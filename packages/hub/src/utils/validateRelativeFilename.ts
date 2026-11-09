/**
 * Port of `_validate_relative_filename` from huggingface_hub
 * (https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/_local_folder.py),
 * added there in https://github.com/huggingface/huggingface_hub/pull/4540.
 */

/**
 * Validate that a repo filename is safe to use as a path relative to a local directory.
 *
 * A repo filename is a POSIX-style ('/'-separated) path relative to the repo root. When materialized
 * on disk (in the cache dir or in a local dir), it is joined onto a base directory. A malicious repository
 * could craft a filename that escapes that base directory, resulting in an arbitrary file write:
 *
 * - an absolute path (`/etc/...`),
 * - a Windows drive path (`C:\Windows\...`) or drive-relative path (`D:foo`),
 * - a UNC path (`\\attacker-host\share\...`) — which on Windows additionally makes the client
 *   authenticate to the attacker's SMB server during path resolution, leaking a NetNTLMv2 hash,
 * - a path using `..` to traverse upward.
 *
 * Such filenames would otherwise cause `join(localDir, filename)` to discard `localDir` (when the right
 * side is anchored) or point outside of it (with `..`). We reject them here, before touching the
 * filesystem. The check runs on all platforms and interprets the name under both POSIX and Windows
 * rules, so a file materialized on Linux cannot escape when later consumed on Windows.
 *
 * Note: on POSIX, `node:path.join` treats a backslash as an ordinary filename character, so
 * `a\..\..\evil` is harmless there but escapes on Windows. Both are rejected.
 */
export function validateRelativeFilename(filename: string): void {
	// Reject parent-directory traversal ('..' as any segment, whether '/'- or '\'-separated).
	if (filename.replace(/\\/g, "/").split("/").includes("..")) {
		throw new TypeError(
			`Invalid filename "${filename}": cannot contain a ".." path segment. Please ask the repository owner to rename this file.`,
		);
	}

	// Reject anchored paths (absolute / drive-relative / root-relative / UNC) under either OS's rules.
	// Check each POSIX segment under Windows rules too, because path.join handles them separately.
	for (const part of [filename, ...filename.split("/")]) {
		if (
			part.startsWith("/") || // POSIX absolute
			part.startsWith("\\") || // Windows root-relative, or UNC when doubled
			/^[a-zA-Z]:/.test(part) // Windows drive-absolute (C:\foo, C:/foo) or drive-relative (C:foo)
		) {
			throw new TypeError(
				`Invalid filename "${filename}": cannot be an absolute, drive-relative or UNC path. Please ask the repository owner to rename this file.`,
			);
		}
	}
}
