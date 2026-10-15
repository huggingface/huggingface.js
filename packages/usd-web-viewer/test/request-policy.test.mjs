// What a load requests, and how. usage: npx vitest run test/request-policy.test.mjs
import { afterAll, afterEach, test } from "vitest";
import assert from "node:assert/strict";
import { requestFor } from "../src/load-core.ts";

const SITE = "https://site.example/scenes/root.usda";
const FILES = "local:///pkg/root.usda";

const realFetch = globalThis.fetch;
let calls = [];
globalThis.fetch = async (url, init) => {
	calls.push([url, init]);
	return new Response("ok");
};
afterEach(() => {
	calls = [];
});
afterAll(() => {
	globalThis.fetch = realFetch;
});

test("requests carry the browser's default same-origin credentials, no custom headers and no referrer", async () => {
	const request = requestFor(SITE);
	await request(SITE);
	await request("https://other.example/t.png");
	assert.deepEqual(calls, [
		[SITE, { credentials: "same-origin", referrerPolicy: "no-referrer" }],
		["https://other.example/t.png", { credentials: "same-origin", referrerPolicy: "no-referrer" }],
	]);
});

test("only http(s) URLs are fetched, but for the root; local: URLs only by a load from files", async () => {
	// [url, root, fetched]
	const cases = [
		["javascript:alert(1)//x.png", SITE, false],
		["JaVaScRiPt:alert(1)//x.png", SITE, false],
		["data:image/png;base64,AAAA", SITE, false],
		["blob:https://site.example/1234", SITE, false],
		["file:///etc/passwd", SITE, false],
		["local:///pkg/a.usda", SITE, false],
		["not a url", SITE, false],
		["HTTP://site.example/a.usda", SITE, true],
		// The root is the caller's choice, whatever its scheme.
		["blob:https://site.example/1234", "blob:https://site.example/1234", true],
		["https://site.example/a.usda", FILES, true],
		["blob:https://site.example/1234", FILES, false],
	];
	for (const [url, root, expected] of cases) {
		calls = [];
		const outcome = await requestFor(root)(url).then(
			() => true,
			(error) => (assert.ok(error instanceof TypeError, `${url}: ${error}`), false),
		);
		assert.equal(outcome, expected, `${url} from ${root}`);
		assert.equal(calls.length, expected ? 1 : 0, `${url} from ${root}`);
	}
	const files = new Map([["pkg/a.usda", new Blob(["#usda 1.0"])]]);
	const local = requestFor(FILES, files);
	assert.equal(await (await local("local:///pkg/a.usda")).text(), "#usda 1.0");
	assert.equal((await local("local:///pkg/b.usda")).status, 404);
	assert.equal(calls.length, 0);
});
