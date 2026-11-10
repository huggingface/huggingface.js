// UsdPreviewSurface inputs on three.js materials.
import { test } from "vitest";
import assert from "node:assert/strict";
import * as THREE from "three";
import { SLOTS, applyFallback, attachTexture, configureTexture, createMaterial } from "../src/materials.ts";

const ref = {
	path: "image.png",
	channel: "r",
	scale: [1, 1, 1, 1],
	bias: [0, 0, 0, 0],
	uvScale: [1, 1],
	uvTranslation: [0, 0],
	uvRotation: 0,
};
const material = (maps) =>
	createMaterial({
		path: "/M",
		kind: "preview",
		color: [1, 1, 1],
		emissive: [0, 0, 0],
		roughness: 0.5,
		metallic: 0,
		opacity: 1,
		opacityThreshold: 0,
		maps,
	});
const attach = (m, isColor) =>
	attachTexture(m, "image.png", isColor, (r, colorSpace, channel) =>
		configureTexture(new THREE.Texture(), r, colorSpace, channel),
	);

test("auto color space is decided by the image, the same for every input that samples it", () => {
	for (const [isColor, expected] of [
		[true, THREE.SRGBColorSpace],
		[false, THREE.NoColorSpace],
	]) {
		const m = material({ roughness: ref, diffuseColor: { ...ref, channel: "rgb" } });
		attach(m, isColor);
		assert.deepEqual([m.map.colorSpace, m.roughnessMap.colorSpace], [expected, expected]);
	}
	const explicit = material({
		diffuseColor: { ...ref, channel: "rgb", colorSpace: "raw" },
		roughness: { ...ref, colorSpace: "sRGB" },
	});
	attach(explicit, true);
	assert.deepEqual(
		[explicit.map.colorSpace, explicit.roughnessMap.colorSpace],
		[THREE.NoColorSpace, THREE.SRGBColorSpace],
	);
});

test("an image that cannot be read leaves the input's own value, not the texture's fallback", () => {
	const blue = material({
		diffuseColor: { ...ref, channel: "rgb", fallback: [1, 0, 0, 1], value: [0, 0, 1] },
		roughness: { ...ref, value: [0.5, 0.5, 0.5] },
	});
	// Grey while loading.
	assert.deepEqual(
		blue.color.toArray().map((v) => +v.toFixed(6)),
		[0.18, 0.18, 0.18],
	);
	applyFallback(blue, "image.png");
	assert.deepEqual(blue.color.toArray(), [0, 0, 1]);
	assert.equal(blue.roughness, 0.5);
});

test("only r, g, b or a from an authored channel reaches the shader", () => {
	const m = material({ roughness: { ...ref, channel: "r_evil" }, metallic: { ...ref, channel: "g" } });
	attach(m, false);
	const shader = { fragmentShader: "#include <roughnessmap_fragment>\n#include <metalnessmap_fragment>" };
	m.onBeforeCompile(shader);
	assert.ok(!shader.fragmentShader.includes("r_evil"));
	assert.match(shader.fragmentShader, /\.rgb \* vec3/);
	assert.match(shader.fragmentShader, /\.g \* /);
});

test("every patched line is still in its three.js shader chunk", () => {
	// onBeforeCompile replaces these lines verbatim; a reworded chunk would silently drop the remap.
	for (const [input, { chunk, from }] of Object.entries(SLOTS)) {
		assert.ok(THREE.ShaderChunk[chunk].includes(from), `${input}: ${chunk} no longer contains ${JSON.stringify(from)}`);
	}
});

test("wrap tokens map to three.js wrapping, and any other token repeats", () => {
	const wraps = (wrapS) => configureTexture(new THREE.Texture(), { ...ref, wrapS }, THREE.NoColorSpace, 0).wrapS;
	assert.deepEqual(["mirror", "clamp", "black", "repeat", undefined, "constructor", "__proto__"].map(wraps), [
		THREE.MirroredRepeatWrapping,
		THREE.ClampToEdgeWrapping,
		THREE.ClampToEdgeWrapping,
		...Array(4).fill(THREE.RepeatWrapping),
	]);
});
