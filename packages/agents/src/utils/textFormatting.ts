export function extractJSON(str: string): string {
	const regex = /\{\s*"tool"\s*:\s*"[^"]*"\s*,\s*"input"\s*:\s*"[^"]*"\s*\}/;

	const match = regex.exec(str);

	if (match) {
		return match[0];
	} else {
		throw new Error("No JSON found in the answer.");
	}
}
