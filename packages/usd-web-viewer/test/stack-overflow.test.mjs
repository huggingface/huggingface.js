// Its own file: a trap leaves the WASM instance unusable for later tests.
import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeStage, loadFailure } from "../src/load-core.ts";

// No finalizers: one freeing a loader leaked by the trap would run on the unusable instance.
globalThis.FinalizationRegistry = undefined;
const { initSync, lastPanic, UsdLoader } = await import("../wasm/usd_wasm.js");

const exports = initSync({ module: readFileSync(new URL("../wasm/usd_wasm_bg.wasm", import.meta.url)) });

test("layers nested too deeply fail as a compose error, not a bare trap", async () => {
	const depth = 100000;
	const usda = "#usda 1.0\n" + 'def Xform "A" {\n'.repeat(depth) + "}\n".repeat(depth);
	const fetchBytes = async () => new TextEncoder().encode(usda);
	const error = await composeStage({ UsdLoader, fetchBytes, rootUrl: "https://h/deep.usda" }).then(
		() => null,
		(e) => e,
	);
	assert.ok(error, "the load fails");
	const failure = loadFailure(error, exports.memory.buffer.byteLength, lastPanic);
	assert.equal(failure.code, "compose");
	assert.match(failure.message, /^stack overflow: the scene nests too deeply to read/);
});
