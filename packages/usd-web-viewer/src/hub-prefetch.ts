// The layers of a Hub package, listed with one tree-API call, so a load can
// request them all at once instead of discovering them a round trip at a time.

// Bucket files (`/buckets/…/resolve/<path>`) never match: buckets have no
// revision to pin, and their tree API takes none either.
const RESOLVE =
	/^(https:\/\/(?:huggingface\.co|hf\.co))\/((?:datasets\/|spaces\/|kernels\/)?)([^/?#]+\/[^/?#]+)\/resolve\/([^/?#]+)\/([^?#]+)$/;
const LAYER = /\.(usd|usda|usdc)$/i;
const SIMREADY_PACKAGE = "com.nvidia.simready.packaging.json";
const MAX_FILES = 256;
const MAX_BYTES = 64 * 2 ** 20;

/** The load's fetch. */
export type Request = (url: string) => Promise<Response>;

export interface PackageLayers {
	layers: { url: string; size: number }[];
	eager: boolean;
}

interface TreeEntry {
	type: "file" | "directory";
	path: string;
	size: number;
}

/**
 * The USD layers of the package holding a Hub `resolve` URL, as `{ url, size }`:
 * the directory with a SimReady packaging manifest among the root's parent
 * and grandparent, else everything under the root's own directory. `eager`
 * when a manifest declares the package, so its layers are worth requesting
 * before the root is read. No layers, without a request, for a root at the
 * top of its repo or any other URL, and none if the listing fails: the load then discovers layers as usual.
 */
export async function hubPackageLayers(rootUrl: string, request: Request): Promise<PackageLayers> {
	const match = rootUrl.split(/[?#]/)[0].match(RESOLVE);
	const none: PackageLayers = { layers: [], eager: false };
	if (!match) {
		return none;
	}
	const [, origin, prefix, repo, revision, path] = match;
	const parent = path.split("/").slice(0, -1);
	// A root at the top of a repo would list, and preload, the whole repo.
	if (!parent.length) {
		return none;
	}
	const listed = parent.length > 1 ? parent.slice(0, -1) : parent;
	try {
		const response = await request(
			`${origin}/api/${prefix || "models/"}${repo}/tree/${revision}/${listed.join("/")}?recursive=true`,
		);
		if (!response.ok) {
			return none;
		}
		const entries: TreeEntry[] = await response.json();
		const decoded = parent.map(decodeURIComponent);
		const manifest = [decoded, decoded.slice(0, -1)].find(
			(dir) => dir.length >= listed.length && entries.some((e) => e.path === [...dir, SIMREADY_PACKAGE].join("/")),
		);
		const depth = (manifest ?? decoded).length;
		const packageDir = decoded
			.slice(0, depth)
			.map((name) => name + "/")
			.join("");
		// As the root spells it, so URLs match the ones composition resolves.
		const base = `${origin}/${prefix}${repo}/resolve/${revision}/${parent
			.slice(0, depth)
			.map((name) => name + "/")
			.join("")}`;
		const layers: PackageLayers["layers"] = [];
		let bytes = 0;
		for (const { type, path: file, size } of entries) {
			if (type !== "file" || !file.startsWith(packageDir) || !LAYER.test(file)) {
				continue;
			}
			if (layers.length >= MAX_FILES || bytes + size > MAX_BYTES) {
				continue;
			}
			bytes += size;
			layers.push({
				url: new URL(file.slice(packageDir.length).replace(/[%#?]/g, encodeURIComponent), base).href,
				size,
			});
		}
		return { layers, eager: !!manifest };
	} catch {
		return none;
	}
}

/**
 * A Hub `resolve` URL pinned to the commit its branch or tag points at now,
 * so every layer and texture of one load (all resolved against the root)
 * comes from the same commit even if the repo is pushed to meanwhile. Unchanged,
 * without a request, for a commit or any other URL, and if the lookup fails.
 */
export async function pinHubRevision(rootUrl: string, request: Request): Promise<string> {
	const match = rootUrl.split(/[?#]/)[0].match(RESOLVE);
	if (!match) {
		return rootUrl;
	}
	const [, origin, prefix, repo, revision] = match;
	if (/^[0-9a-f]{40}$/.test(revision)) {
		return rootUrl;
	}
	try {
		const response = await request(`${origin}/api/${prefix || "models/"}${repo}/revision/${revision}?expand%5B%5D=sha`);
		const { sha }: { sha?: string } = response.ok ? await response.json() : {};
		if (!/^[0-9a-f]{40}$/.test(sha ?? "")) {
			return rootUrl;
		}
		return rootUrl.replace(`/resolve/${revision}/`, `/resolve/${sha}/`);
	} catch {
		return rootUrl;
	}
}
