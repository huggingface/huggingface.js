import { pathsInfo, type RepoDesignation, type RepoId, type PathInfo } from "../../index";
// Compile-time regression: these functions are deliberately never called.
export async function checkBucketCapableTypes(
	wideString: string,
	wideRepo: RepoDesignation,
	wideId: RepoId,
	bucketString: `buckets/${string}`,
): Promise<void> {
	const bucketObject = await pathsInfo({
		repo: { type: "bucket", name: "owner/bucket" },
		paths: ["file.txt"],
		expand: true,
	});
	// @ts-expect-error Expanded bucket-capable input must not guarantee lastCommit.
	bucketObject[0].lastCommit.date.getTime();
	const bucketLiteral = await pathsInfo({ repo: "buckets/owner/bucket", paths: ["file.txt"], expand: true });
	// @ts-expect-error Expanded bucket-capable input must not guarantee lastCommit.
	bucketLiteral[0].lastCommit.date.getTime();
	const bucketTemplate = await pathsInfo({ repo: bucketString, paths: ["file.txt"], expand: true });
	// @ts-expect-error Expanded bucket-capable input must not guarantee lastCommit.
	bucketTemplate[0].lastCommit.date.getTime();
	const broadString = await pathsInfo({ repo: wideString, paths: ["file.txt"], expand: true });
	// @ts-expect-error Expanded bucket-capable input must not guarantee lastCommit.
	broadString[0].lastCommit.date.getTime();
	const wholeRepoDesignation = await pathsInfo({ repo: wideRepo, paths: ["file.txt"], expand: true });
	// @ts-expect-error Expanded bucket-capable input must not guarantee lastCommit.
	wholeRepoDesignation[0].lastCommit.date.getTime();
	const wholeRepoId = await pathsInfo({ repo: wideId, paths: ["file.txt"], expand: true });
	// @ts-expect-error Expanded bucket-capable input must not guarantee lastCommit.
	wholeRepoId[0].lastCommit.date.getTime();
}
export async function checkNonbucketTypes(): Promise<void> {
	const modelObject = await pathsInfo({
		repo: { type: "model", name: "owner/model" },
		paths: ["file.txt"],
		expand: true,
	});
	modelObject[0].lastCommit.date.getTime();
	const datasetObject = await pathsInfo({
		repo: { type: "dataset", name: "owner/dataset" },
		paths: ["file.txt"],
		expand: true,
	});
	datasetObject[0].lastCommit.date.getTime();
	const spaceObject = await pathsInfo({
		repo: { type: "space", name: "owner/space" },
		paths: ["file.txt"],
		expand: true,
	});
	spaceObject[0].lastCommit.date.getTime();
	const kernelObject = await pathsInfo({
		repo: { type: "kernel", name: "owner/kernel" },
		paths: ["file.txt"],
		expand: true,
	});
	kernelObject[0].lastCommit.date.getTime();
	const modelLiteral = await pathsInfo({ repo: "owner/model", paths: ["file.txt"], expand: true });
	modelLiteral[0].lastCommit.date.getTime();
	const datasetLiteral = await pathsInfo({ repo: "datasets/owner/dataset", paths: ["file.txt"], expand: true });
	datasetLiteral[0].lastCommit.date.getTime();
	const spaceLiteral = await pathsInfo({ repo: "spaces/owner/space", paths: ["file.txt"], expand: true });
	spaceLiteral[0].lastCommit.date.getTime();
	const kernelLiteral = await pathsInfo({ repo: "kernels/owner/kernel", paths: ["file.txt"], expand: true });
	kernelLiteral[0].lastCommit.date.getTime();
	const optional = await pathsInfo({ repo: { type: "bucket", name: "owner/bucket" }, paths: ["file.txt"] });
	// @ts-expect-error Non-expanded PathInfo already correctly requires a guard.
	optional[0].lastCommit.date.getTime();
}
const documentedBucket: PathInfo = { path: "file.txt", type: "file", size: 7, uploadedAt: "2026-11-13T00:00:00Z" };
void documentedBucket;

export async function checkUnionAndGenericTypes<T extends RepoDesignation>(
	genericRepo: T,
	unionRepo: { type: "bucket"; name: string } | { type: "model"; name: string },
	uncertainPrefix: `${string}/owner/repo`,
	uncertainSuffix: `buck${string}`,
): Promise<void> {
	const genericRepoResult = await pathsInfo({ repo: genericRepo, paths: ["file.txt"], expand: true });
	// @ts-expect-error This input can designate a bucket.
	genericRepoResult[0].lastCommit.date.getTime();
	genericRepoResult[0].lastCommit?.date.getTime();
	const unionRepoResult = await pathsInfo({ repo: unionRepo, paths: ["file.txt"], expand: true });
	// @ts-expect-error This input can designate a bucket.
	unionRepoResult[0].lastCommit.date.getTime();
	unionRepoResult[0].lastCommit?.date.getTime();
	const uncertainPrefixResult = await pathsInfo({ repo: uncertainPrefix, paths: ["file.txt"], expand: true });
	// @ts-expect-error This input can designate a bucket.
	uncertainPrefixResult[0].lastCommit.date.getTime();
	uncertainPrefixResult[0].lastCommit?.date.getTime();
	const uncertainSuffixResult = await pathsInfo({ repo: uncertainSuffix, paths: ["file.txt"], expand: true });
	// @ts-expect-error This input can designate a bucket.
	uncertainSuffixResult[0].lastCommit.date.getTime();
	uncertainSuffixResult[0].lastCommit?.date.getTime();
}
export async function checkNonbucketTemplateTypes(
	model: `owner/${string}`,
	dataset: `datasets/${string}`,
	space: `spaces/${string}`,
	kernel: `kernels/${string}`,
): Promise<void> {
	for (const repo of [model, dataset, space, kernel]) {
		const result = await pathsInfo({ repo, paths: ["file.txt"], expand: true });
		result[0].lastCommit.date.getTime();
	}
	const singleSegment = await pathsInfo({ repo: "bert-base-uncased", paths: ["file.txt"], expand: true });
	singleSegment[0].lastCommit.date.getTime();
}

export async function checkNonbucketUnionTypes(repo: {
	type: "model" | "dataset" | "space" | "kernel";
	name: string;
}): Promise<void> {
	const result = await pathsInfo({ repo, paths: ["file.txt"], expand: true });
	result[0].lastCommit.date.getTime();
}

export async function checkGenericNonbucketDiscriminator<T extends "model" | "dataset">(type: T): Promise<void> {
	const result = await pathsInfo({ repo: { type, name: "owner/repo" }, paths: ["file.txt"], expand: true });
	result[0].lastCommit.date.getTime();
}

export async function checkGenericNonbucketObject<T extends { type: "model" | "dataset"; name: string }>(
	repo: T,
): Promise<void> {
	const result = await pathsInfo({ repo, paths: ["file.txt"], expand: true });
	result[0].lastCommit.date.getTime();
}

export async function checkGenericNonbucketStrings<
	T extends `datasets/${string}` | `spaces/${string}` | `kernels/${string}`,
>(repo: T): Promise<void> {
	const result = await pathsInfo({ repo, paths: ["file.txt"], expand: true });
	result[0].lastCommit.date.getTime();
}

export async function checkGenericModelPrefix<T extends `owner/${string}`>(repo: T): Promise<void> {
	const result = await pathsInfo({ repo, paths: ["file.txt"], expand: true });
	result[0].lastCommit.date.getTime();
}

export async function checkGenericModelLiteral<T extends "bert-base-uncased" | "gpt2">(repo: T): Promise<void> {
	const result = await pathsInfo({ repo, paths: ["file.txt"], expand: true });
	result[0].lastCommit.date.getTime();
}
