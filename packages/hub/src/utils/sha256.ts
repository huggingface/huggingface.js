import { isFrontend } from "../../../shared";
import { hexFromBytes } from "./hexFromBytes";

/**
 * Todo: make it go through a Worker
 * @returns hex-encoded sha
 */
export async function sha256(buffer: Blob): Promise<string> {
	if (buffer.size < 10_000_000 && globalThis.crypto?.subtle) {
		return hexFromBytes(
			new Uint8Array(
				await globalThis.crypto.subtle.digest("SHA-256", buffer instanceof Blob ? await buffer.arrayBuffer() : buffer)
			)
		);
	}

	if (isFrontend) {
		if (!wasmModule) {
			wasmModule = await import("hash-wasm");
		}

		const sha256 = await wasmModule.createSHA256();
		sha256.init();

		const reader = buffer.stream().getReader();

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			sha256.update(value);
		}

		return sha256.digest("hex");
	}

	if (!cryptoModule) {
		cryptoModule = await import("./sha256-node");
	}

	return cryptoModule.sha256Node(buffer);
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let cryptoModule: typeof import("./sha256-node");
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let wasmModule: typeof import("hash-wasm");
