import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { pauseSpace, requestSpaceHardware, restartSpace, setSpaceSleepTime, spaceRuntime } from "./space-runtime";

const RUNTIME_RESPONSE = {
	stage: "RUNNING",
	hardware: { current: "cpu-basic", requested: null },
	gcTimeout: null,
};

describe("space-runtime", () => {
	it("should get the runtime of a space", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "space", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
				sdk: "static",
			});

			const runtime = await spaceRuntime({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
			assert.equal(typeof runtime.stage, "string");
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}).catch(() => undefined);
		}
	});

	it("should call the pause endpoint", async () => {
		let calledUrl = "";
		let calledMethod = "";
		await pauseSpace({
			repo: { type: "space", name: "user/space" },
			accessToken: "hf_test_token",
			fetch: async (url, init) => {
				calledUrl = String(url);
				calledMethod = init?.method ?? "GET";
				return new Response(JSON.stringify(RUNTIME_RESPONSE), {
					headers: { "Content-Type": "application/json" },
				});
			},
		});
		assert.equal(calledUrl, "https://huggingface.co/api/spaces/user/space/pause");
		assert.equal(calledMethod, "POST");
	});

	it("should call the restart endpoint, with factory reboot when requested", async () => {
		const urls: string[] = [];
		const fetchImpl = async (url: string | URL | Request) => {
			urls.push(String(url));
			return new Response(JSON.stringify(RUNTIME_RESPONSE), {
				headers: { "Content-Type": "application/json" },
			});
		};
		await restartSpace({ repo: { type: "space", name: "user/space" }, accessToken: "hf_test_token", fetch: fetchImpl });
		await restartSpace({
			repo: { type: "space", name: "user/space" },
			factory: true,
			accessToken: "hf_test_token",
			fetch: fetchImpl,
		});
		assert.deepStrictEqual(urls, [
			"https://huggingface.co/api/spaces/user/space/restart",
			"https://huggingface.co/api/spaces/user/space/restart?factory=true",
		]);
	});

	it("should request hardware, optionally with a custom sleep time", async () => {
		const bodies: string[] = [];
		const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
			bodies.push(String(init?.body));
			return new Response(JSON.stringify(RUNTIME_RESPONSE), {
				headers: { "Content-Type": "application/json" },
			});
		};
		await requestSpaceHardware({
			repo: { type: "space", name: "user/space" },
			hardware: "t4-medium",
			accessToken: "hf_test_token",
			fetch: fetchImpl,
		});
		await requestSpaceHardware({
			repo: { type: "space", name: "user/space" },
			hardware: "t4-medium",
			sleepTimeSeconds: 3600,
			accessToken: "hf_test_token",
			fetch: fetchImpl,
		});
		assert.deepStrictEqual(
			bodies.map((b) => JSON.parse(b)),
			[{ flavor: "t4-medium" }, { flavor: "t4-medium", sleepTimeSeconds: 3600 }],
		);
	});

	it("should set the sleep time", async () => {
		let calledUrl = "";
		let body: unknown;
		await setSpaceSleepTime({
			repo: { type: "space", name: "user/space" },
			seconds: 1800,
			accessToken: "hf_test_token",
			fetch: async (url, init) => {
				calledUrl = String(url);
				body = JSON.parse(String(init?.body));
				return new Response(JSON.stringify(RUNTIME_RESPONSE), {
					headers: { "Content-Type": "application/json" },
				});
			},
		});
		assert.equal(calledUrl, "https://huggingface.co/api/spaces/user/space/sleeptime");
		assert.deepStrictEqual(body, { seconds: 1800 });
	});
});
