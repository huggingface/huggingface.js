import { hexFromBytes } from "./hexFromBytes";

/**
 * Todo: make it go through a Worker
 * @returns hex-encoded sha
 */
export async function sha256(buffer: ArrayBuffer | Blob): Promise<string> {
	if (typeof __filename === undefined) {
		return hexFromBytes(
			new Uint8Array(
				await globalThis.crypto.subtle.digest("SHA-256", buffer instanceof Blob ? await buffer.arrayBuffer() : buffer)
			)
		);
	}

	if (!cryptoModule) {
		cryptoModule = await import("./sha256-node");
	}
	return cryptoModule.sha256Node(buffer);
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let cryptoModule: typeof import("./sha256-node");
