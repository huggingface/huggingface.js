export function checkFilename(filename: string): void {
	if (
		!filename.endsWith(".safetensors") &&
		!filename.endsWith(".json") &&
		!filename.endsWith(".gguf") &&
		!filename.endsWith(".txt") &&
		!filename.endsWith("/")
	) {
		throw new Error("Files must have a .safetensors, .txt, .gguf or .json extension");
	}

	const split = filename.split("/");

	if (split.length > 2) {
		throw new Error("Files must be only one level deep, not more");
	}
}
