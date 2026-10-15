// Browser checks for what only a browser shows: the real Worker and fetch
// (credentials, abort), createImageBitmap limits and rendering. Serves
// the package (its build and the fixtures) itself, logging each request.
// usage: npm run build && npm run test:e2e
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULE = "/dist/esm/index.js";
const MIME = {
	".js": "text/javascript",
	".wasm": "application/wasm",
	".png": "image/png",
	".usda": "text/plain",
	".usdc": "application/octet-stream",
	".usdz": "model/vnd.usdz+zip",
};
// A page that imports nothing: each check imports the package itself.
const PAGE = `<!doctype html><script type="importmap">{ "imports": { "three": "/node_modules/three/build/three.module.js", "three/addons/": "/node_modules/three/examples/jsm/" } }</script>`;

// Requests to the server (CORS preflights included), with their cookies and Authorization header.
let requests = [];
const server = http.createServer((req, res) => {
	const url = new URL(req.url, "http://localhost");
	const cors = { "access-control-allow-origin": "*" };
	if (url.pathname === "/") return res.writeHead(200, { "content-type": "text/html" }).end(PAGE);
	requests.push({
		method: req.method,
		url: url.pathname,
		cookie: req.headers.cookie ?? null,
		auth: req.headers.authorization ?? null,
	});
	if (req.method === "OPTIONS") return res.writeHead(204, cors).end();
	const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
	if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile())
		return res.writeHead(404, cors).end("not found");
	res
		.writeHead(200, {
			"content-type": MIME[path.extname(file)] ?? "application/octet-stream",
			"cache-control": "no-store",
			...cors,
		})
		.end(fs.readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;

// Several meshes and materials, one of them instanced: geometry streams in over several messages.
const SHAPES = "/fixtures/implicit_gprims.usda";
// Two quads whose shared material samples /fixtures/quadrants.png.
const TEXTURED = "/fixtures/uv_set.usda";

const browser = await chromium.launch({
	headless: true,
	args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
// An uncaught error or unhandled rejection in the page fails the test it happens in.
let pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
await page.goto(BASE);

/** The textured fixture with its texture moved to `texture`, served at `root` through a route. */
async function routeTextured(root, texture) {
	const usda = fs.readFileSync(path.join(ROOT, TEXTURED), "utf8").replace("@quadrants.png@", `@${texture}@`);
	await page.context().route(root, (route) => route.fulfill({ body: usda, contentType: "text/plain" }));
}

test("requests send cookies to the page's own origin, like <model-viewer>, and no custom headers", async () => {
	await page.context().addCookies([{ name: "session", value: "1", url: BASE }]);
	// The root (served through a route) authors its texture on another origin of the same server.
	const root = `${BASE}/__fixture/cross-origin.usda`;
	await routeTextured(root, `http://localhost:${new URL(BASE).port}/fixtures/quadrants.png`);
	requests = [];
	const counts = await page.evaluate(
		async ([module, own, other]) => {
			const { loadUsd } = await import(module);
			const counts = [];
			for (const url of [own, other]) {
				const result = await loadUsd(url);
				counts.push(await result.complete);
				result.dispose();
			}
			return counts;
		},
		[MODULE, TEXTURED, root],
	);
	await page.context().clearCookies();
	assert.deepEqual(counts, [
		{ textures: 1, failed: 0 },
		{ textures: 1, failed: 0 },
	]);
	const log = requests.map((r) => [r.method, r.url, r.cookie, r.auth]);
	assert.deepEqual(
		log.filter(([, url]) => url.startsWith("/fixtures/")),
		[
			["GET", TEXTURED, "session=1", null],
			["GET", "/fixtures/quadrants.png", "session=1", null],
			["GET", "/fixtures/quadrants.png", null, null],
		],
		JSON.stringify(log),
	);
});

test("textures past maxTextureBytes, over 16384 px a side or 8192 x 8192 px in area, or of unchecked formats fail as warnings, not the load", async () => {
	// PNG headers claiming 20000 x 20000 and 16384 x 8192 px, and a GIF.
	const png = (width, height) => {
		const header = Buffer.alloc(33);
		header.set([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
		header.writeUInt32BE(width, 16);
		header.writeUInt32BE(height, 20);
		header.set([8, 6], 24);
		return header;
	};
	const gif = Buffer.from("GIF89a\x10\x00\x10\x00\x00\x00\x00", "latin1");
	for (const [name, body] of [
		["huge", png(20000, 20000)],
		["wide", png(16384, 8192)],
		["gif", gif],
	]) {
		await page.context().route(`**/__${name}.png`, (route) => route.fulfill({ body, contentType: "image/png" }));
		await routeTextured(`${BASE}/__fixture/${name}.usda`, `${BASE}/__${name}.png`);
	}
	const out = await page.evaluate(
		async ([module, cases]) => {
			const { loadUsd } = await import(module);
			const outcomes = [];
			for (const [url, options] of cases) {
				const result = await loadUsd(url, options);
				outcomes.push({
					counts: await result.complete,
					messages: result.info.warnings.filter((w) => w.code === "texture-failed").map((w) => w.message),
				});
				result.dispose();
			}
			return outcomes;
		},
		[
			MODULE,
			[
				[TEXTURED, { maxTextureBytes: 100 }],
				[`${BASE}/__fixture/huge.usda`, {}],
				[`${BASE}/__fixture/wide.usda`, {}],
				[`${BASE}/__fixture/gif.usda`, {}],
			],
		],
	);
	assert.deepEqual(
		out.map((o) => o.counts),
		[
			{ textures: 0, failed: 1 },
			{ textures: 0, failed: 1 },
			{ textures: 0, failed: 1 },
			{ textures: 0, failed: 1 },
		],
	);
	assert.match(out[0].messages[0], /maxTextureBytes/);
	assert.match(out[1].messages[0], /image too large: 20000x20000/);
	assert.match(out[2].messages[0], /image too large: 16384x8192 \(at most 8192x8192 px in area\)/);
	assert.match(out[3].messages[0], /unsupported image format/);
});

test("abort rejects with an aborted UsdLoadError, before or during the load", async () => {
	// The root never arrives: the load is still fetching when it is aborted.
	let held;
	await page.context().route("**/__pending.usda", (route) => (held = route));
	const outcomes = await page.evaluate(
		async ([module, url]) => {
			const { loadUsd } = await import(module);
			const outcome = (promise) =>
				promise.then(
					() => "resolved",
					(e) => `${e.name}:${e.code}`,
				);
			const controller = new AbortController();
			const pending = loadUsd("/__pending.usda", { signal: controller.signal });
			setTimeout(() => controller.abort(), 50);
			return [await outcome(pending), await outcome(loadUsd(url, { signal: AbortSignal.abort() }))];
		},
		[MODULE, SHAPES],
	);
	await held?.abort();
	await page.context().unroute("**/__pending.usda");
	assert.deepEqual(outcomes, ["UsdLoadError:aborted", "UsdLoadError:aborted"]);
});

test("lifecycle: a newer load wins; stopping a load stops all of it, while WASM compiles and as meshes stream in", async () => {
	let held;
	await page.context().route("**/__hang.wasm", (route) => (held = route));
	const out = await page.evaluate(
		async ([module, shapes, textured]) => {
			const settle = (promise) =>
				Promise.race([
					promise.then(
						() => "resolved",
						(e) => e.code,
					),
					new Promise((resolve) => setTimeout(() => resolve("hung"), 3000)),
				]);
			// A fresh copy of the module, its WASM compile never finishing.
			const fresh = await import(`${module}?compiling`);
			const compiling = new AbortController();
			const whileCompiling = fresh.loadUsd(shapes, { signal: compiling.signal, wasmUrl: "/__hang.wasm" });
			const compilingOutcome = settle(whileCompiling);
			setTimeout(() => compiling.abort(), 50);

			const { createViewer } = await import(module);
			const host = document.body.appendChild(document.createElement("div"));
			host.style.cssText = "width:200px;height:150px";
			const viewer = createViewer(host);
			const shown = () => viewer.scene.children.filter((c) => c.name === "usd").length;

			// Overlapping loads: the older is discarded.
			const first = viewer.load(shapes).then(
				() => "resolved",
				(e) => e.code,
			);
			const second = await viewer.load(textured);
			const overlapping = {
				first: await first,
				shown: shown(),
				secondShown: viewer.scene.children.includes(second.root),
			};

			let streaming;
			const streamed = new Promise((resolve) => (streaming = resolve));
			const cleared = viewer.load(shapes, {
				textures: "none",
				onProgress: (p) => p.stage === "geometry" && streaming(),
			});
			await streamed;
			const before = shown();
			viewer.clear();
			const afterClear = shown();
			const outcomes = { compiling: await compilingOutcome, cleared: await settle(cleared) };
			await new Promise((resolve) => setTimeout(resolve, 300));
			const later = shown();
			viewer.dispose();
			viewer.dispose();
			const canvasRemoved = !host.querySelector("canvas");
			host.remove();
			return { overlapping, outcomes, shown: [before, afterClear, later], canvasRemoved };
		},
		[MODULE, SHAPES, TEXTURED],
	);
	await held?.abort();
	await page.context().unroute("**/__hang.wasm");
	assert.deepEqual(
		out,
		{
			overlapping: { first: "aborted", shown: 1, secondShown: true },
			outcomes: { compiling: "aborted", cleared: "aborted" },
			shown: [1, 0, 0],
			canvasRemoved: true,
		},
		JSON.stringify(out),
	);
});

test("createViewer fits its canvas to the container's content box, so a padded auto-height container keeps its height", async () => {
	const out = await page.evaluate(async (module) => {
		const { createViewer } = await import(module);
		const sizes = [];
		for (const style of ["width:400px;padding:8px", "width:400px;height:300px;padding:8px"]) {
			const host = document.body.appendChild(document.createElement("div"));
			host.style.cssText = style;
			const viewer = createViewer(host);
			const canvas = host.querySelector("canvas");
			const size = () => [canvas.clientWidth, canvas.clientHeight, host.clientHeight];
			await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
			const first = size();
			await new Promise((resolve) => setTimeout(resolve, 500));
			sizes.push([first, size()]);
			viewer.dispose();
			host.remove();
		}
		return sizes;
	}, MODULE);
	assert.deepEqual(out, [
		[
			[400, 150, 166],
			[400, 150, 166],
		],
		[
			[400, 300, 316],
			[400, 300, 316],
		],
	]);
});

test("framing drops the orbit and pan still easing out, so the camera stays where it was framed", async () => {
	const out = await page.evaluate(
		async ([module, url]) => {
			const { createViewer } = await import(module);
			const frames = (n) =>
				new Promise((resolve) => {
					const step = () => (n-- > 0 ? requestAnimationFrame(step) : resolve());
					step();
				});
			const host = document.body.appendChild(document.createElement("div"));
			host.style.cssText = "width:200px;height:150px";
			const viewer = createViewer(host);
			await viewer.load(url, { textures: "none" });
			await frames(5);
			const pose = () => [...viewer.camera.position.toArray(), ...viewer.controls.target.toArray()];
			const framed = pose();
			// An orbit and a pan let go of just before framing again.
			viewer.controls.rotateLeft(0.5);
			viewer.controls.pan(40, 0);
			viewer.frame();
			await frames(60);
			const after = pose();
			viewer.dispose();
			host.remove();
			return Math.max(...after.map((v, i) => Math.abs(v - framed[i])));
		},
		[MODULE, TEXTURED],
	);
	assert.ok(out < 1e-6, `the camera drifted ${out} from its framed pose`);
});

test("loads sharing one caller signal leave no listener on it once complete", async () => {
	const live = await page.evaluate(
		async ([module, url]) => {
			const { createViewer } = await import(module);
			const host = document.body.appendChild(document.createElement("div"));
			host.style.cssText = "width:200px;height:150px";
			const viewer = createViewer(host);
			// The abort listeners on the caller's signal, gone once removed or once their own signal aborts.
			const { signal } = new AbortController();
			const listeners = new Set();
			const add = signal.addEventListener.bind(signal);
			const remove = signal.removeEventListener.bind(signal);
			signal.addEventListener = (type, listener, options) => {
				listeners.add(listener);
				options?.signal?.addEventListener("abort", () => listeners.delete(listener), { once: true });
				add(type, listener, options);
			};
			signal.removeEventListener = (type, listener, options) => {
				listeners.delete(listener);
				remove(type, listener, options);
			};
			const live = [];
			for (let i = 0; i < 3; i++) {
				const result = await viewer.load(url, { textures: "none", signal });
				await result.complete;
				await new Promise((resolve) => setTimeout(resolve));
				live.push(listeners.size);
			}
			viewer.dispose();
			host.remove();
			return live;
		},
		[MODULE, TEXTURED],
	);
	assert.deepEqual(live, [0, 0, 0]);
});

test("a lost WebGL context drops the stage and calls onContextLost; once restored, onContextRestored reloads the last stage shown", async () => {
	const out = await page.evaluate(
		async ([module, url]) => {
			const { createViewer } = await import(module);
			const until = async (predicate) => {
				for (let i = 0; i < 500 && !predicate(); i++) await new Promise((resolve) => setTimeout(resolve, 20));
			};
			const host = document.body.appendChild(document.createElement("div"));
			host.style.cssText = "width:200px;height:150px";
			const events = [];
			let reload;
			const viewer = createViewer(host, {
				onContextLost: () => events.push("lost"),
				onContextRestored: (promise) => (
					events.push(promise ? "restored with a reload" : "restored"), (reload = promise)
				),
			});
			// Aborting the first load's signal after it finished must not stop the reload.
			const first = new AbortController();
			await viewer.load(url, { textures: "none", signal: first.signal });
			first.abort();
			// A load that fails is not the one reloaded.
			const failed = await viewer.load("/fixtures/__missing.usda").then(
				() => "loaded",
				(error) => error.code,
			);
			const lose = viewer.renderer.getContext().getExtension("WEBGL_lose_context");
			lose.loseContext();
			await until(() => events.includes("lost"));
			const lost = { stage: !!viewer.scene.getObjectByName("usd") };
			lose.restoreContext();
			await until(() => events.length === 2);
			const again = await reload;
			const restored = { triangles: again.info.triangles, shown: viewer.scene.children.includes(again.root) };
			viewer.dispose();
			host.remove();
			return { failed, events, lost, restored };
		},
		[MODULE, SHAPES],
	);
	assert.deepEqual(out, {
		failed: "fetch",
		events: ["lost", "restored with a reload"],
		lost: { stage: false },
		restored: { triangles: 3304, shown: true },
	});
});

/** Loads `root` from `files` (`{ key: text, or '/fixtures/…' to copy a served file }`) with `options`, logging only the requests made during the load. */
async function loadFiles(root, files, options = {}) {
	const sources = Object.fromEntries(
		Object.entries(files).map(([key, source]) => [
			key,
			source.startsWith("/fixtures/") ? [...fs.readFileSync(path.join(ROOT, source))] : source,
		]),
	);
	await page.evaluate(() => import("/dist/esm/index.js"));
	requests = [];
	return page.evaluate(
		async ([module, root, sources, options]) => {
			const { loadUsd } = await import(module);
			const files = new Map(
				Object.entries(sources).map(([key, source]) => [
					key,
					new File([typeof source === "string" ? source : new Uint8Array(source)], key.split("/").pop()),
				]),
			);
			const result = await loadUsd(root, { ...options, files });
			const complete = await result.complete;
			result.dispose();
			return { meshes: result.info.meshes, complete, warnings: result.info.warnings.map((w) => [w.code, w.path]) };
		},
		[MODULE, root, sources, options],
	);
}

const fetched = () => requests.filter((r) => /\.(usd[acz]?|png)$/.test(r.url));

test("files: a dropped package loads its payloads and textures by relative path, and fetches nothing", async () => {
	const quad = fs
		.readFileSync(path.join(ROOT, TEXTURED), "utf8")
		.replace("@quadrants.png@", "@../Textures/quadrants.png@");
	const result = await loadFiles("pkg/root.usda", {
		"pkg/root.usda": "#usda 1.0\n(subLayers = [@./payloads/quad.usda@])",
		"pkg/payloads/quad.usda": quad,
		"pkg/Textures/quadrants.png": "/fixtures/quadrants.png",
	});
	assert.deepEqual(result, { meshes: 2, complete: { textures: 1, failed: 0 }, warnings: [] });
	assert.deepEqual(fetched(), []);
});

test("files: a missing file is a warning with its local: path, never a request", async () => {
	const result = await loadFiles("root.usda", {
		"root.usda": "#usda 1.0\n(subLayers = [@./absent.usda@, @/fixtures/uv_set.usda@])",
	});
	assert.deepEqual(
		result.warnings
			.filter(([code]) => code === "layer-missing")
			.map(([, path]) => path)
			.sort(),
		["local:///absent.usda", "local:///fixtures/uv_set.usda"],
	);
	assert.deepEqual(fetched(), []);
});

test("files: an http(s) layer in the files is fetched like any other", async () => {
	const result = await loadFiles("root.usda", {
		"root.usda": `#usda 1.0\n(subLayers = [@${BASE}/fixtures/meshes.usda@])`,
	});
	assert.ok(result.meshes > 0);
	assert.deepEqual(
		fetched().map((r) => r.url),
		["/fixtures/meshes.usda"],
	);
});

test("files: a single dropped .usdz loads its packaged texture", async () => {
	const result = await loadFiles("uv_set.usdz", { "uv_set.usdz": "/fixtures/uv_set.usdz" });
	assert.deepEqual(result, { meshes: 2, complete: { textures: 1, failed: 0 }, warnings: [] });
	assert.deepEqual(fetched(), []);
});

let failed = 0;
try {
	for (const [name, fn] of tests) {
		pageErrors = [];
		try {
			await fn();
			if (pageErrors.length) {
				throw new Error(`page error: ${pageErrors.join("; ")}`);
			}
			console.log(`ok   ${name}`);
		} catch (error) {
			failed++;
			console.log(`FAIL ${name}: ${error.message.split("\n")[0]}`);
		}
	}
} finally {
	await browser.close();
	server.close();
}
console.log(`${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
