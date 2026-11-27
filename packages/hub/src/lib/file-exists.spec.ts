import { assert, it, describe } from "vitest";
import { fileExists } from "./file-exists";

describe("fileExists", () => {
	it("should return true for file that exists", async () => {
		const info = await fileExists({
			repo: {
				name: "google-bert/bert-base-uncased",
				type: "model",
			},
			path: "tf_model.h5",
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
		});

		assert(info, "file should exist");
	});

	it("should return false for file that does not exist", async () => {
		const info = await fileExists({
			repo: {
				name: "google-bert/bert-base-uncased",
				type: "model",
			},
			path: "tf_model.h5dadazdzazd",
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
		});

		assert(!info, "file should not exist");
	});

	it("should URL-encode each segment of the path", async () => {
		const urls: string[] = [];
		const info = await fileExists({
			repo: {
				name: "bigcode/commitpackft",
				type: "dataset",
			},
			path: "data/c#/data 1.jsonl",
			fetch: async (url) => {
				urls.push(String(url));
				return new Response(null, { status: 200 });
			},
		});

		assert(info, "file should exist");
		assert.deepStrictEqual(urls, [
			"https://huggingface.co/datasets/bigcode/commitpackft/raw/main/data/c%23/data%201.jsonl",
		]);
	});
});
