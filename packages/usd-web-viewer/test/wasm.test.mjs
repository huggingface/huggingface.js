// The built WASM module through its wasm-bindgen glue, with no JavaScript loader around it.
import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initSync, UsdLoader } from "../wasm/usd_wasm.js";

initSync({ module: readFileSync(new URL("../wasm/usd_wasm_bg.wasm", import.meta.url)) });

test("a fixture composes into a scene of two quads sharing one texture", () => {
	const root = "https://example.test/uv_set.usda";
	const loader = new UsdLoader();
	assert.deepEqual(loader.addLayer(root, readFileSync(new URL("../fixtures/uv_set.usda", import.meta.url))), []);
	assert.deepEqual(loader.compose(root, 1000), []);

	const scene = loader.takeScene();
	const meta = JSON.parse(scene.meta());
	assert.equal(meta.upAxis, "Y");
	assert.equal(meta.geometryCount, 2);
	assert.equal(meta.instances.length, 2);
	const { path, uvSet } = meta.materials[0].maps.emissiveColor;
	assert.deepEqual([path, uvSet], ["https://example.test/quadrants.png", "custom"]);

	for (const index of [0, 1]) {
		assert.ok(scene.read(index, 1000));
		assert.equal(scene.positions().length, 4 * 3);
		assert.equal(scene.indices16().length, 2 * 3);
	}
	scene.finish();
	scene.free();
	loader.free();
});
