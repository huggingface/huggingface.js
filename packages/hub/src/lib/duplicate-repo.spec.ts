import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { uploadFile } from "./upload-file";
import { downloadFile } from "./download-file";
import { duplicateRepo } from "./duplicate-repo";
import { modelInfo } from "./model-info";

describe("duplicateRepo", () => {
	it("should duplicate a repo with its content", async () => {
		const suffix = insecureRandomString();
		const fromRepo = { type: "model", name: `${TEST_USER}/TEST-${suffix}` } satisfies RepoId;
		const toRepo = { type: "model", name: `${TEST_USER}/TEST-${suffix}-copy` } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo: fromRepo,
			});

			await uploadFile({
				repo: fromRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				file: {
					path: "file.txt",
					content: new Blob(["file content"]),
				},
			});

			const duplicated = await duplicateRepo({
				fromRepo,
				toRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			assert.ok(duplicated.url.includes(toRepo.name));
			assert.isFalse(duplicated.filesCopyPending);

			const content = await downloadFile({
				repo: toRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				path: "file.txt",
			});

			assert.equal(await content?.text(), "file content");
		} finally {
			await deleteRepo({
				repo: fromRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}).catch(() => undefined);
			await deleteRepo({
				repo: toRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}).catch(() => undefined);
		}
	});

	it("should duplicate a repo as private", async () => {
		const suffix = insecureRandomString();
		const fromRepo = { type: "model", name: `${TEST_USER}/TEST-${suffix}` } satisfies RepoId;
		const toRepo = { type: "model", name: `${TEST_USER}/TEST-${suffix}-private-copy` } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo: fromRepo,
			});

			await duplicateRepo({
				fromRepo,
				toRepo,
				private: true,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const info = await modelInfo({
				name: toRepo.name,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			assert.isTrue(info.private);
		} finally {
			await deleteRepo({
				repo: fromRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}).catch(() => undefined);
			await deleteRepo({
				repo: toRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}).catch(() => undefined);
		}
	});

	it("should default the destination to the source name when toRepo is omitted", async () => {
		const bodies: string[] = [];
		const mockFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
			bodies.push(String(init?.body));
			return new Response(JSON.stringify({ url: "https://hub-ci.huggingface.co/hub.js/gpt2" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}) as typeof fetch;

		const duplicated = await duplicateRepo({
			fromRepo: { type: "model", name: "gpt2" },
			accessToken: TEST_ACCESS_TOKEN,
			hubUrl: TEST_HUB_URL,
			fetch: mockFetch,
		});

		assert.equal(JSON.parse(bodies[0] ?? "{}").repository, "gpt2");
		assert.ok(duplicated.url.includes("hub.js/gpt2"));
	});
});
