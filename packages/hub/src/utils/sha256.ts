import { hexFromBytes } from "./hexFromBytes";

/**
 * Todo: make it go through a Worker
 * @returns hex-encoded sha
 */
export async function sha256(buffer: ArrayBuffer): Promise<string> {
	if (globalThis.crypto) {
		return hexFromBytes(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", buffer)));
	}

	const cryptoModule = await import("node:crypto");
	return cryptoModule.createHash("sha256").update(new Uint8Array(buffer)).digest().toString("hex");
}
