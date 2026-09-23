/** `features` can be tens of KB; anything bigger is not an info file we can use. */
export const MAX_INFO_BYTES = 200_000;
/** LeRobot templates use widths of 3 and 6; the file is user-controlled so keep expansion bounded. */
const MAX_INDEX_WIDTH = 16;
export const MAX_PATH_TEMPLATE_LENGTH = 1_000;
/**
 * Also bounds the filled-in path: a short template can repeat `{video_key}`, and the feature key it
 * expands to is as long as the author likes.
 */
const MAX_REPO_PATH_LENGTH = 1_000;

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
 *
 * Both the template and string values usually come from a user-authored `meta/info.json`, so this
 * throws unless the result is a repo path that is at most `MAX_REPO_PATH_LENGTH` long and passes
 * `isSafeRepoPath`.
 */
export function formatPathTemplate(template: string, vars: Record<string, string | number>): string {
	if (template.length > MAX_PATH_TEMPLATE_LENGTH) {
		throw new Error(`Path template is too long (${template.length} > ${MAX_PATH_TEMPLATE_LENGTH})`);
	}
	let length = template.length;
	const path = template.replace(PLACEHOLDER_RE, (match, name: string, width?: string) => {
		const value = vars[name] ?? 0;
		const filled =
			typeof value === "string" ? value : String(value).padStart(Math.min(Number(width ?? "1"), MAX_INDEX_WIDTH), "0");
		/// Bail out as soon as the bound is crossed rather than building the whole string first
		length += filled.length - match.length;
		if (length > MAX_REPO_PATH_LENGTH) {
			throw new Error(`Formatted path is too long (> ${MAX_REPO_PATH_LENGTH})`);
		}
		return filled;
	});
	if (!isSafeRepoPath(path)) {
		throw new Error(`Refusing unsafe repo path: ${path.slice(0, 100)}`);
	}
	return path;
}

/** Builds `${endpoint}/datasets/${repoId}/resolve/${revision}/${path}`, encoding each path segment. */
export function resolveUrl(endpoint: string, repoId: string, revision: string, path: string): string {
	if (!isSafeRepoPath(path)) {
		throw new Error(`Refusing to build a URL for unsafe repo path: ${path}`);
	}
	const encoded = path.split("/").map(encodeURIComponent).join("/");
	return `${endpoint}/datasets/${repoId}/resolve/${encodeURIComponent(revision)}/${encoded}`;
}
