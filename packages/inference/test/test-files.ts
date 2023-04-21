// https://vitejs.dev/config/shared-options.html#define
const files = __TEST_FILES__;

export const readTestFile = (filename: string): Uint8Array => {
	if (!(filename in files)) {
		throw new Error(`File is not pre-loaded for unit tests: ${filename}`);
	}
	return Uint8Array.from(atob(files[filename]), (c) => c.charCodeAt(0));
};
