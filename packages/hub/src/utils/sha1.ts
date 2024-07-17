import { hexFromBytes } from "./hexFromBytes";
import { isFrontend } from "./isFrontend";

export async function* sha1(buffer: Blob, opts?: { abortSignal?: AbortSignal }): AsyncGenerator<number, string | null> {
	yield 0;

	if (globalThis.crypto?.subtle) {
		const res = hexFromBytes(
			new Uint8Array(
				await globalThis.crypto.subtle.digest("SHA-1", buffer instanceof Blob ? await buffer.arrayBuffer() : buffer)
			)
		);

		yield 1;
		return res;
	}

	if (isFrontend) {
		yield 1;
		return null; // unsupported if we're here
	}

	if (!cryptoModule) {
		cryptoModule = await import("./sha-node");
	}

	return yield* cryptoModule.sha1Node(buffer, { abortSignal: opts?.abortSignal });
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let cryptoModule: typeof import("./sha-node");
