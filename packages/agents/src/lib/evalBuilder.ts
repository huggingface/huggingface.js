import type { Tool } from "../types";

// this function passes the tools & files to the context before calling eval
export async function evalBuilder(
	code: string,
	tools: Tool[],
	files: FileList | undefined,
	updateCallback: (message: string, data: undefined | string | Blob) => void
): Promise<() => Promise<void>> {
	async function wrapperEval() {
		if (files && files.length > 0) {
			// @ts-expect-error adding to the scope
			globalThis["file"] = await files[0];
		}

		// add tools to context
		for (const tool of tools) {
			// @ts-expect-error adding to the scope
			globalThis[tool.name] = tool.call;
		}

		// @ts-expect-error adding to the scope
		globalThis["message"] = updateCallback;

		let returnString = "";
		if (files && files.length > 0) {
			returnString = "\nreturn await generate(file);";
		} else {
			returnString = "\n return await generate();";
		}

		// actually run the thing
		await Object.getPrototypeOf(async function () {}).constructor(code + returnString)();

		// clean up tools
		for (const tool of tools) {
			// @ts-expect-error removing from the scope
			delete globalThis[tool.name];
			// @ts-expect-error removing from the scope
			delete globalThis["file"];
			// @ts-expect-error removing from the scope
			delete globalThis["message"];
		}
	}
	return wrapperEval;
}
