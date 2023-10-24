import { isFrontend } from "../../../shared";
import { eventToGenerator } from "./eventToGenerator";
import { hexFromBytes } from "./hexFromBytes";

const webWorkerCode = `
// Would prefer no CDN, but need a clever way to not burden the main file of the bundle
importScripts("https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/sha256.umd.min.js");

const createSHA256 = hashwasm.createSHA256;

self.addEventListener('message', async (event) => {
	const { file } = event.data;
	const sha256 = await createSHA256();
	sha256.init();
	const reader = file.stream().getReader();
	const total = file.size;
	let bytesDone = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		sha256.update(value);
		bytesDone += value.length;
		postMessage({ progress: bytesDone / total });
	}
	postMessage({ sha256: sha256.digest('hex') });
});
`;

/**
 * @returns hex-encoded sha
 * @yields progress (0-1)
 */
export async function* sha256(
	buffer: Blob,
	opts?: { useWebWorker?: boolean | { minSize: number } }
): AsyncGenerator<number, string> {
	yield 0;

	const maxCryptoSize =
		typeof opts?.useWebWorker === "object" && opts?.useWebWorker.minSize !== undefined
			? opts.useWebWorker.minSize
			: 10_000_000;
	if (buffer.size < maxCryptoSize && globalThis.crypto?.subtle) {
		const res = hexFromBytes(
			new Uint8Array(
				await globalThis.crypto.subtle.digest("SHA-256", buffer instanceof Blob ? await buffer.arrayBuffer() : buffer)
			)
		);

		yield 1;

		return res;
	}

	if (isFrontend) {
		if (opts?.useWebWorker) {
			try {
				return yield* eventToGenerator<number, string>((yieldCallback, returnCallback, rejectCallack) => {
					// Todo: Maybe pool workers
					const worker = new Worker(URL.createObjectURL(new Blob([webWorkerCode])));
					worker.addEventListener("message", (event) => {
						if (event.data.sha256) {
							returnCallback(event.data.sha256);
						} else if (event.data.progress) {
							yieldCallback(event.data.progress);
						} else {
							rejectCallack(event);
						}
					});
					worker.addEventListener("error", (event) => {
						rejectCallack(event.error);
					});
					worker.postMessage({ file: buffer });
				});
			} catch (err) {
				console.warn("Failed to use web worker for sha256", err);
			}
		}
		if (!wasmModule) {
			wasmModule = await import("hash-wasm");
		}

		const sha256 = await wasmModule.createSHA256();
		sha256.init();

		const reader = buffer.stream().getReader();
		const total = buffer.size;
		let bytesDone = 0;

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			sha256.update(value);
			bytesDone += value.length;
			yield bytesDone / total;
		}

		return sha256.digest("hex");
	}

	if (!cryptoModule) {
		cryptoModule = await import("./sha256-node");
	}

	return yield* cryptoModule.sha256Node(buffer);
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let cryptoModule: typeof import("./sha256-node");
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let wasmModule: typeof import("hash-wasm");
