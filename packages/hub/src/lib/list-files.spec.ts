import * as assert from "assert";
import type { ListFileEntry } from "./list-files";
import { listFiles } from "./list-files";

describe("listFiles", () => {
	it("should fetch the list of files from the repo", async () => {
		const cursor = listFiles({
			repo: {
				name: "bert-base-uncased",
				type: "model",
			},
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
			hubUrl:   "https://huggingface.co",
		});

		const files: ListFileEntry[] = [];

		for await (const entry of cursor) {
			files.push(entry);
		}

		assert.deepStrictEqual(files, [
			{
				lastCommit: {
					author: {
						date: "2018-11-14T23:35:08.000Z",
					},
					id:      "504939aa53e8ce310dba3dd2296dbe266c575de4",
					subject: "initial commit",
				},
				path:     ".gitattributes",
				security: {
					avScan: {
						virusFound: false,
						virusNames: null,
					},
					blobId:           "dc08351d4dc0732d9c8af04070ced089b201ce2f",
					name:             ".gitattributes",
					pickleImportScan: null,
					repositoryId:     "models/bert-base-uncased",
					safe:             true,
				},
				size: 345,
				type: "file",
			},
			{
				lastCommit: {
					author: {
						date: "2019-06-18T09:06:51.000Z",
					},
					id:      "bb3c1c3256d2598217df9889a14a2e811587891d",
					subject: "Update config.json",
				},
				path:     "config.json",
				security: {
					avScan: {
						virusFound: false,
						virusNames: null,
					},
					blobId:           "fca794a5f07ff8f963fe8b61e3694b0fb7f955df",
					name:             "config.json",
					pickleImportScan: null,
					repositoryId:     "models/bert-base-uncased",
					safe:             true,
				},
				size: 313,
				type: "file",
			},
			{
				lastCommit: {
					author: {
						date: "2019-06-18T09:06:34.000Z",
					},
					id:      "3d2477d72b675a999d1b13ca822aaaf4908634ad",
					subject: "Update pytorch_model.bin",
				},
				lfs: {
					oid:  "097417381d6c7230bd9e3557456d726de6e83245ec8b24f529f60198a67b203a",
					size: 440473133,
				},
				path:     "pytorch_model.bin",
				security: {
					avScan: {
						virusFound: false,
						virusNames: null,
					},
					blobId:           "ba5d19791be1dd7992e33bd61f20207b0f7f50a5",
					name:             "pytorch_model.bin",
					pickleImportScan: {
						highestSafetyLevel: "innocuous",
						imports:            [
							{
								module: "collections",
								name:   "OrderedDict",
								safety: "innocuous",
							},
							{
								module: "torch",
								name:   "FloatStorage",
								safety: "innocuous",
							},
							{
								module: "torch._utils",
								name:   "_rebuild_tensor_v2",
								safety: "innocuous",
							},
						],
					},
					repositoryId: "models/bert-base-uncased",
					safe:         true,
				},
				size: 440473133,
				type: "file",
			},
			{
				lastCommit: {
					author: {
						date: "2019-09-23T19:48:44.000Z",
					},
					id:      "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
					subject: "Update tf_model.h5",
				},
				lfs: {
					oid:  "a7a17d6d844b5de815ccab5f42cad6d24496db3850a2a43d8258221018ce87d2",
					size: 536063208,
				},
				path:     "tf_model.h5",
				security: {
					avScan: {
						virusFound: false,
						virusNames: null,
					},
					blobId:           "9eb98c817f04b051b3bcca591bcd4e03cec88018",
					name:             "tf_model.h5",
					pickleImportScan: null,
					repositoryId:     "models/bert-base-uncased",
					safe:             true,
				},
				size: 536063208,
				type: "file",
			},
			{
				lastCommit: {
					author: {
						date: "2018-11-14T23:35:08.000Z",
					},
					id:      "2f07d813ca87c8c709147704c87210359ccf2309",
					subject: "Update vocab.txt",
				},
				path:     "vocab.txt",
				security: {
					avScan: {
						virusFound: false,
						virusNames: null,
					},
					blobId:           "fb140275c155a9c7c5a3b3e0e77a9e839594a938",
					name:             "vocab.txt",
					pickleImportScan: null,
					repositoryId:     "models/bert-base-uncased",
					safe:             true,
				},
				size: 231508,
				type: "file",
			},
		]);
	});
});
