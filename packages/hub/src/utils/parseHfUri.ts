import type { RepoType } from "../types/public";

export interface HfUri {
	type: RepoType;
	/** `namespace/name` */
	id: string;
	revision?: string;
	/** Path inside the repo or bucket, without leading slash. Empty for the root */
	path: string;
}

const TYPE_PREFIXES: Record<string, RepoType> = {
	models: "model",
	datasets: "dataset",
	spaces: "space",
	kernels: "kernel",
	buckets: "bucket",
};
const SINGULAR_TO_PLURAL = Object.fromEntries(Object.entries(TYPE_PREFIXES).map(([plural, type]) => [type, plural]));
const SPECIAL_REFS_REVISION = /^refs\/(?:convert\/[\w.-]+|pr\/\d+)/;

export function isHfUri(uri: string): boolean {
	return uri.startsWith("hf://");
}

/**
 * Port of `parse_hf_uri` from huggingface_hub: `hf://[<TYPE>/]<ID>[@<REVISION>][/<PATH>]`.
 */
export function parseHfUri(uri: string): HfUri {
	const fail = (message: string): never => {
		throw new TypeError(`Invalid HF URI '${uri}': ${message}`);
	};

	if (!isHfUri(uri)) {
		return fail("must start with 'hf://'. Expected format: hf://[<TYPE>/]<ID>[@<REVISION>][/<PATH>]");
	}
	const body = uri.slice("hf://".length);
	if (!body) {
		return fail("empty body after 'hf://'");
	}

	let type: RepoType = "model";
	let location = body;
	const slashIndex = body.indexOf("/");
	const first = slashIndex === -1 ? body : body.slice(0, slashIndex);
	if (first in TYPE_PREFIXES) {
		if (slashIndex === -1) {
			return fail(`missing identifier after '${first}'`);
		}
		type = TYPE_PREFIXES[first];
		location = body.slice(slashIndex + 1);
	} else if (first in SINGULAR_TO_PLURAL) {
		return fail(`type prefix must be plural. Did you mean 'hf://${SINGULAR_TO_PLURAL[first]}/...'?`);
	}

	location = location.replace(/^\/+|\/+$/g, "");

	if (type === "bucket") {
		const [namespace, name, ...rest] = location.split("/");
		if (!namespace || !name) {
			return fail(`bucket id must be 'namespace/name', got '${location}'`);
		}
		if (`${namespace}/${name}`.includes("@")) {
			return fail("bucket URIs do not support a revision marker ('@')");
		}
		return { type, id: `${namespace}/${name}`, path: rest.join("/") };
	}

	if (!location) {
		return fail("missing repository id");
	}

	const atIndex = location.indexOf("@");
	if (atIndex === -1 || location.slice(0, atIndex).split("/").length - 1 > 1) {
		const [namespace, name, ...rest] = location.split("/");
		if (!namespace || !name) {
			return fail(`repository id must be 'namespace/name', got '${location}'`);
		}
		return { type, id: `${namespace}/${name}`, path: rest.join("/") };
	}

	const id = location.slice(0, atIndex);
	if (id.split("/").length !== 2 || id.split("/").some((part) => !part)) {
		return fail(`repository id must be 'namespace/name', got '${id}'`);
	}
	const revisionAndPath = location.slice(atIndex + 1);
	let revision: string;
	let path: string;
	const special = SPECIAL_REFS_REVISION.exec(revisionAndPath);
	if (special) {
		revision = special[0];
		path = revisionAndPath.slice(revision.length).replace(/^\//, "");
	} else {
		const revisionEnd = revisionAndPath.indexOf("/");
		revision = revisionEnd === -1 ? revisionAndPath : revisionAndPath.slice(0, revisionEnd);
		path = revisionEnd === -1 ? "" : revisionAndPath.slice(revisionEnd + 1);
	}
	revision = decodeURIComponent(revision);
	if (!revision) {
		return fail("empty revision after '@'");
	}
	return { type, id, revision, path };
}
