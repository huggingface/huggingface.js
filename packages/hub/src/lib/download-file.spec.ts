import { expect, test, describe, vi } from "vitest";
import { downloadFile } from "./download-file";
import type { RepoId } from "../types/public";

const DUMMY_REPO: RepoId = {
	name: "hello-world",
	type: "model",
};

describe("downloadFile", () => {
	test("hubUrl params should overwrite HUB_URL", async () => {
		const fetchMock: typeof fetch = vi.fn();
		vi.mocked(fetchMock).mockResolvedValue({
			status: 200,
			ok: true,
		} as Response);

		await downloadFile({
			repo: DUMMY_REPO,
			path: "/README.md",
			hubUrl: "http://dummy-hub",
			fetch: fetchMock,
		});

		expect(fetchMock).toHaveBeenCalledWith("http://dummy-hub/hello-world/resolve/main//README.md", expect.anything());
	});

	test("raw params should use raw url", async () => {
		const fetchMock: typeof fetch = vi.fn();
		vi.mocked(fetchMock).mockResolvedValue({
			status: 200,
			ok: true,
		} as Response);

		await downloadFile({
			repo: DUMMY_REPO,
			path: "README.md",
			raw: true,
			fetch: fetchMock,
		});

		expect(fetchMock).toHaveBeenCalledWith("https://huggingface.co/hello-world/raw/main/README.md", expect.anything());
	});

	test("internal server error should propagate the error", async () => {
		const fetchMock: typeof fetch = vi.fn();
		vi.mocked(fetchMock).mockResolvedValue({
			status: 500,
			ok: false,
			headers: new Map<string, string>([["Content-Type", "application/json"]]),
			json: () => ({
				error: "Dummy internal error",
			}),
		} as unknown as Response);

		await expect(async () => {
			await downloadFile({
				repo: DUMMY_REPO,
				path: "README.md",
				raw: true,
				fetch: fetchMock,
			});
		}).rejects.toThrowError("Dummy internal error");
	});
});
