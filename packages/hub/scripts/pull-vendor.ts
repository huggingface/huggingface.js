import { writeFileSync } from "node:fs";

const HASH_WASM_SOURCE = "https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/sha256.umd.min.js";
const HASH_WASM_DEST = "./src/vendor/hash-wasm/sha256.js";
const HASH_WASM_WORKER_DEST = "./src/vendor/hash-wasm/sha256-worker.ts";

async function main() {
	const res = await fetch(HASH_WASM_SOURCE);
	const jsSource = await res.text();

	// Write plain JS file
	writeFileSync(HASH_WASM_DEST, jsSource);

	// Write wrapped file for web worker
	writeFileSync(
		HASH_WASM_WORKER_DEST,
		`export const sha256WebWorkerCode = ${JSON.stringify(jsSource)}`,
	);
}

main();
