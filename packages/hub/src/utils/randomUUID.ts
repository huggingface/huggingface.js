export async function randomUUID(): Promise<string> {
	if (globalThis.crypto) {
		return globalThis.crypto.randomUUID();
	} else {
		return (await import("node:crypto")).randomUUID();
	}
}
