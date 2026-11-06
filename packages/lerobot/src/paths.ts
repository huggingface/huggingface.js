/** `features` can be tens of KB; anything bigger is not an info file we can use. */
export const MAX_INFO_BYTES = 200_000;
/** LeRobot templates use widths of 3 and 6; the file is user-controlled so keep expansion bounded. */
const MAX_INDEX_WIDTH = 16;
export const MAX_PATH_TEMPLATE_LENGTH = 1_000;
/** Bounds the filled-in path too: a short template can repeat a long `{video_key}`. */
const MAX_REPO_PATH_LENGTH = 1_000;

const PLACEHOLDER_RE = /\{(\w+)(?::0?(\d+)d)?\}/g;

/** False for a path that would escape the repo, such as a `..` feature key from a user-authored info.json. */
export function isSafeRepoPath(path: string): boolean {
	return path.length > 0 && !path.split("/").includes("..") && !path.startsWith("/");
}

/** Canonical directory containing a dataset's meta/info.json; an empty path selects the repo root. */
export function normalizeDatasetPath(path = ""): string {
	if (path.includes("\\") || Array.from(path).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
		throw new Error("Invalid dataset path");
	}
	const parts = path.split("/").filter((part) => part && part !== ".");
	if (parts.includes("..")) {
		throw new Error("Dataset path cannot contain '..'");
	}
	return parts.join("/");
}

/**
 * Fills a python-format template such as `data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet`,
 * unknown placeholders as 0. Templates come from a user-authored info.json, so this throws past
 * `MAX_REPO_PATH_LENGTH` or on a path that fails `isSafeRepoPath`.
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
