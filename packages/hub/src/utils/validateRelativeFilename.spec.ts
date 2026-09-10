import { describe, expect, it } from "vitest";
import { validateRelativeFilename } from "./validateRelativeFilename";

/**
 * Same shapes as `UNSAFE_FILENAMES` / `SAFE_FILENAMES` in
 * huggingface_hub's `tests/test_local_folder.py`.
 */
const UNSAFE_FILENAMES = [
	"../evil", // parent traversal
	"folder/../../evil", // nested parent traversal
	"a\\..\\..\\evil", // parent traversal, backslash-separated (escapes on Windows)
	"folder/..\\evil", // mixed separators
	"/etc/evil", // POSIX absolute
	"C:\\Windows\\System32\\evil", // Windows drive-absolute
	"C:/Windows/System32/evil", // Windows drive-absolute (forward slashes)
	"D:relative\\evil", // Windows drive-relative
	"\\\\attacker\\share\\evil", // UNC path (also triggers SMB auth / NetNTLMv2 leak on Windows)
	"\\evil", // Windows root-relative
	"folder/C:\\Windows\\evil", // nested Windows drive-absolute
	"folder/\\\\attacker\\share\\evil", // nested UNC path
	"folder/\\evil", // nested Windows root-relative
];

const SAFE_FILENAMES = ["file.txt", "path/in/repo.txt", "weird but valid/name.txt", "..dots/...file.txt"];

describe("validateRelativeFilename", () => {
	for (const filename of UNSAFE_FILENAMES) {
		it(`should reject ${JSON.stringify(filename)}`, () => {
			expect(() => validateRelativeFilename(filename)).toThrow(/Invalid filename/);
		});
	}

	for (const filename of SAFE_FILENAMES) {
		it(`should accept ${JSON.stringify(filename)}`, () => {
			expect(() => validateRelativeFilename(filename)).not.toThrow();
		});
	}
});
