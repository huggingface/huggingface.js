/** `features` can be tens of KB; anything bigger is not an info file we can use. */
export const MAX_INFO_BYTES = 200_000;
/** LeRobot templates use widths of 3 and 6; the file is user-controlled so keep expansion bounded. */
const MAX_INDEX_WIDTH = 16;
const MAX_PATH_TEMPLATE_LENGTH = 1_000;

const PLACEHOLDER_RE = /\{(\w+)(?::0?(\d+)d)?\}/g;

/**
 * A repo path is safe when it cannot escape its prefix once pasted into a URL. Feature keys come
 * straight from user-authored `meta/info.json`, so a key of `..` would otherwise walk up the tree.
 */
export function isSafeRepoPath(path: string): boolean {
	return path.length > 0 && !path.split("/").includes("..") && !path.startsWith("/");
}

/**
 * Fills a python-format template such as `data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet`.
 * Unknown placeholders resolve to 0 so that partially-specified templates still yield a usable path.
 */
export function formatPathTemplate(template: string, vars: Record<string, string | number>): string {
	if (template.length > MAX_PATH_TEMPLATE_LENGTH) {
		throw new Error(`Path template is too long (${template.length} > ${MAX_PATH_TEMPLATE_LENGTH})`);
	}
	return template.replace(PLACEHOLDER_RE, (_match, name: string, width?: string) => {
		const value = vars[name] ?? 0;
		if (typeof value === "string") {
			return value;
		}
		const pad = Math.min(Number(width ?? "1"), MAX_INDEX_WIDTH);
		return String(value).padStart(pad, "0");
	});
}

/** Builds `${endpoint}/datasets/${repoId}/resolve/${revision}/${path}`, encoding each path segment. */
export function resolveUrl(endpoint: string, repoId: string, revision: string, path: string): string {
	if (!isSafeRepoPath(path)) {
		throw new Error(`Refusing to build a URL for unsafe repo path: ${path}`);
	}
	const encoded = path.split("/").map(encodeURIComponent).join("/");
	return `${endpoint}/datasets/${repoId}/resolve/${encodeURIComponent(revision)}/${encoded}`;
}
