import initWasm, { Chunker } from "./chunker_wasm_bg.js";
import { wasmBinary, XET_CORE_COMMIT, XET_CORE_WASM_SHA256 } from "./chunker_wasm_bg.wasm.base64.js";

let initPromise: ReturnType<typeof initWasm> | undefined;

export function init(): ReturnType<typeof initWasm> {
	initPromise ??= initWasm({ module_or_path: wasmBinary });
	return initPromise;
}

export { Chunker, XET_CORE_COMMIT, XET_CORE_WASM_SHA256 };
