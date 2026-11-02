// Drives loadUsd with a controlled fake Worker standing in for the WASM worker.
import { test } from "vitest";
import assert from "node:assert/strict";
import * as THREE from "three";

class FakeWorker {
	static last = null;
	/** Thrown by the next construction, as a browser does for a cross-origin script. */
	static failNext = null;
	terminated = false;
	received = [];
	constructor() {
		if (FakeWorker.failNext) {
			const error = FakeWorker.failNext;
			FakeWorker.failNext = null;
			throw error;
		}
		FakeWorker.last = this;
	}
	postMessage(request) {
		this.request ??= request;
		this.received.push(request);
	}
	terminate() {
		this.terminated = true;
	}
	/** Delivers a message as if the worker posted it. */
	send(data) {
		this.onmessage({ data });
	}
}

// Missing from the oldest supported browsers (Safari 16.4).
delete Map.groupBy;
delete AbortSignal.any;
delete URL.canParse;
globalThis.location = { href: "https://example.test/" };
globalThis.Worker = FakeWorker;
globalThis.fetch = async () => new Response(new Uint8Array());
WebAssembly.compileStreaming = async () => ({});
// Only the viewer's empty module: Node itself compiles WASM (undici's llhttp on Node 20).
const realCompile = WebAssembly.compile;
WebAssembly.compile = async (bytes) => (bytes.byteLength ? realCompile(bytes) : {});
const { loadUsd } = await import("../src/index.ts");

const TEXTURE = {
	path: "https://example.test/t.png",
	channel: "rgb",
	scale: [1, 1, 1, 1],
	bias: [0, 0, 0, 0],
	uvScale: [1, 1],
	uvRotation: 0,
	uvTranslation: [0, 0],
};

/** The worker's messages for one triangle drawn once with `matrix`, using a material with a color map. */
function sceneMessages(matrix) {
	return [
		{
			type: "meta",
			meta: {
				upAxis: "Y",
				metersPerUnit: 1,
				warnings: [],
				geometryCount: 1,
				instances: [{ path: "/M", geometry: 0, material: 0, subsets: {}, doubleSided: false, matrix }],
				materials: [
					{
						path: "/Mat",
						kind: "preview",
						color: [1, 1, 1],
						emissive: [0, 0, 0],
						roughness: 0.5,
						metallic: 0,
						opacity: 1,
						opacityThreshold: 0,
						maps: { diffuseColor: TEXTURE },
					},
				],
			},
		},
		{
			type: "geometry",
			index: 0,
			meta: { groups: [[0, 3]], bounds: [0, 0, 0, 1, 1, 0], uvSets: [], hasColors: false },
			arrays: {
				positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
				normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
				uvs: [],
				colors: null,
				indices: new Uint16Array([0, 1, 2]),
			},
		},
		{ type: "scene", stats: { warnings: [] } },
	];
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

async function load(matrix = IDENTITY) {
	let textures = 0;
	const loading = loadUsd("scene.usda", { onProgress: (p) => p.stage === "textures" && textures++ });
	await new Promise((resolve) => setTimeout(resolve));
	const worker = FakeWorker.last;
	sceneMessages(matrix).forEach((m) => worker.send(m));
	const result = await loading;
	return { ...result, worker, textureCount: () => textures };
}

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const fakeBitmap = () => ({
	width: 4,
	height: 4,
	closed: false,
	close() {
		this.closed = true;
	},
});

test("a rotated child under a non-uniformly scaled parent keeps its shear", async () => {
	// USD row vectors: rotate 45 degrees about Z, then scale x by 2.
	const c = Math.SQRT1_2;
	const matrix = [2 * c, c, 0, 0, -2 * c, c, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1];
	const { root } = await load(matrix);
	// Framing measures a freshly loaded root, before any render updates it.
	const box = new THREE.Box3().setFromObject(root);
	assert.ok(Math.abs(box.max.x - (1 + 2 * c)) < 1e-6, `bounds follow the drawn matrix (${box.max.x})`);
	root.updateMatrixWorld(true);
	const mesh = root.children[0];
	mesh.matrixWorld.elements.forEach((v, i) =>
		assert.ok(Math.abs(v - matrix[i]) < 1e-9, `element ${i}: ${v} vs ${matrix[i]}`),
	);
});

test("dispose stops the worker and settles the complete promise", async () => {
	const { worker, complete, dispose } = await load();
	dispose();
	assert.equal(worker.terminated, true);
	const settled = await Promise.race([
		complete.then(
			() => true,
			(e) => e.code === "aborted",
		),
		new Promise((resolve) => setTimeout(() => resolve(false), 50)),
	]);
	assert.equal(settled, true);
});

test("a texture arriving after dispose is closed, not applied", async () => {
	const { root, worker, dispose, textureCount } = await load();
	dispose();
	const bitmap = fakeBitmap();
	worker.send({ type: "texture", path: "https://example.test/t.png", bitmap });
	assert.equal(bitmap.closed, true);
	assert.equal(root.children[0].material.map, null);
	assert.equal(textureCount(), 0);
});

test("geometry bounds come from the worker, so vertex arrays are released once uploaded and framing still works", async () => {
	const { root } = await load();
	const { geometry } = root.children[0];
	assert.deepEqual(geometry.boundingBox, new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 0)));
	assert.deepEqual(geometry.boundingSphere.center, new THREE.Vector3(0.5, 0.5, 0));
	assert.ok(geometry.boundingSphere.radius >= Math.SQRT1_2);
	const attributes = Object.values(geometry.attributes);
	// three.js calls this right after copying an attribute to the GPU.
	for (const attribute of [geometry.index, ...attributes]) attribute.onUploadCallback();
	assert.ok(attributes.every((attribute) => attribute.array === null));
	assert.deepEqual([...geometry.index.array], [0, 1, 2]);
	assert.ok(!new THREE.Box3().setFromObject(root).isEmpty());
});
test("abort before geometry rejects with an aborted UsdLoadError and stops the worker", async () => {
	const controller = new AbortController();
	const loading = loadUsd("scene.usda", { signal: controller.signal });
	await new Promise((resolve) => setTimeout(resolve));
	const worker = FakeWorker.last;
	controller.abort();
	await assert.rejects(loading, { name: "UsdLoadError", code: "aborted" });
	assert.equal(worker.terminated, true);
	// A scene that was already on its way is dropped.
	sceneMessages(IDENTITY).forEach((m) => worker.send(m));
});

test("abort after geometry stops textures but leaves the model to its owner", async () => {
	const controller = new AbortController();
	const loading = loadUsd("scene.usda", { signal: controller.signal });
	await new Promise((resolve) => setTimeout(resolve));
	const worker = FakeWorker.last;
	sceneMessages(IDENTITY).forEach((m) => worker.send(m));
	const { root, complete } = await loading;
	controller.abort();
	assert.equal(worker.terminated, true);
	await assert.rejects(complete, { code: "aborted" });
	assert.equal(root.children.length, 1);
});

test("a worker error after geometry rejects complete instead of vanishing", async () => {
	const { complete, worker } = await load();
	worker.send({ type: "error", code: "compose", message: "boom" });
	await assert.rejects(complete, { name: "UsdLoadError", code: "compose", message: "boom" });
});

test("a message the page cannot handle fails the load and stops the worker", async () => {
	const loading = loadUsd("scene.usda");
	await tick();
	const worker = FakeWorker.last;
	const [meta, geometry] = sceneMessages(IDENTITY);
	worker.send(meta);
	worker.send({ ...geometry, arrays: null });
	await assert.rejects(loading, { name: "UsdLoadError", code: "worker", message: /could not build the scene/ });
	assert.equal(worker.terminated, true);
});

test("an onProgress that throws is the caller's error: the load goes on", async () => {
	const loading = loadUsd("scene.usda", {
		onProgress: () => {
			throw new Error("caller bug");
		},
	});
	await tick();
	const worker = FakeWorker.last;
	assert.throws(() => worker.send({ type: "progress", progress: { stage: "compose", round: 1 } }), /caller bug/);
	sceneMessages(IDENTITY).forEach((m) => worker.send(m));
	(await loading).dispose();
});

test("each wasmUrl is compiled on its own, once", async () => {
	const fetched = [];
	const fetchBefore = globalThis.fetch;
	globalThis.fetch = async (url) => (fetched.push(String(url)), new Response(new Uint8Array()));
	try {
		for (const wasmUrl of ["https://cdn.test/a.wasm", "https://cdn.test/b.wasm", "https://cdn.test/a.wasm"]) {
			const loading = loadUsd("scene.usda", { wasmUrl });
			await tick();
			sceneMessages(IDENTITY).forEach((m) => FakeWorker.last.send(m));
			(await loading).dispose();
		}
	} finally {
		globalThis.fetch = fetchBefore;
	}
	assert.deepEqual(fetched, ["https://cdn.test/a.wasm", "https://cdn.test/b.wasm"]);
});

test("a worker that dies of running out of memory fails as a scene too large to load", async () => {
	const loading = loadUsd("scene.usda");
	await tick();
	FakeWorker.last.onerror({ message: "Uncaught RangeError: WebAssembly.Memory.grow(): Maximum memory size exceeded" });
	await assert.rejects(loading, { name: "UsdLoadError", code: "compose", message: /^scene too large to load/ });
});

test("progress carries an overall fraction that only grows and ends at 1", async () => {
	const seen = [];
	const loading = loadUsd("scene.usda", { onProgress: (p) => seen.push(p.fraction) });
	await tick();
	const worker = FakeWorker.last;
	for (const progress of [
		{ stage: "layers", loaded: 1, total: 1, bytes: 10 },
		{ stage: "layers", loaded: 1, total: 4, bytes: 10 },
		{ stage: "layers", loaded: 4, total: 4, bytes: 40 },
		{ stage: "compose", round: 1 },
		{ stage: "geometry", loaded: 1, total: 2 },
		{ stage: "geometry", loaded: 2, total: 2 },
		{ stage: "textures", loaded: 0, total: 2, bytes: 0 },
		{ stage: "textures", loaded: 2, total: 2, bytes: 9 },
	]) {
		worker.send({ type: "progress", progress });
	}
	sceneMessages(IDENTITY).forEach((m) => worker.send(m));
	await loading;
	assert.ok(
		seen.every((f, i) => i === 0 || f >= seen[i - 1]),
		`never decreases: ${seen}`,
	);
	assert.equal(seen.at(-1), 1);
});

test("complete reports texture counts and failures become warnings", async () => {
	const { complete, worker, info } = await load();
	worker.send({ type: "texture", path: "https://example.test/t.png", bitmap: fakeBitmap() });
	worker.send({ type: "texture", path: "https://example.test/u.png", error: "HTTP 404" });
	worker.send({ type: "done" });
	assert.deepEqual(await complete, { textures: 1, failed: 1 });
	assert.deepEqual(info.warnings, [
		{ code: "texture-failed", message: "HTTP 404", path: "https://example.test/u.png" },
	]);
});

test("a worker that cannot be constructed fails with a worker UsdLoadError", async () => {
	FakeWorker.failNext = Object.assign(new Error("cross-origin worker script"), { name: "SecurityError", code: 18 });
	await assert.rejects(loadUsd("scene.usda", { workerUrl: "https://cdn.other.test/worker.js" }), {
		name: "UsdLoadError",
		code: "worker",
	});
}, 3000);

test("files: the root key loads as a local: URL, with the keys normalised", async () => {
	const root = new Blob(["#usda 1.0"]);
	const texture = new Blob([]);
	const loading = loadUsd("./my pkg\\root.usda", {
		files: new Map([
			["my pkg/root.usda", root],
			["/my pkg/Textures\\a.png", texture],
		]),
	});
	await tick();
	const { request } = FakeWorker.last;
	assert.equal(request.url, "local:///my%20pkg/root.usda");
	assert.deepEqual(
		[...request.files],
		[
			["my pkg/root.usda", root],
			["my pkg/Textures/a.png", texture],
		],
	);
	FakeWorker.last.send({ type: "error", code: "compose", message: "stop" });
	await assert.rejects(loading, { code: "compose" });
});

test("files: a root missing from files fails with a 404 fetch error before any worker starts", async () => {
	const before = FakeWorker.last;
	await assert.rejects(loadUsd("root.usda", { files: new Map([["Root.usda", new Blob([])]]) }), {
		name: "UsdLoadError",
		code: "fetch",
		status: 404,
	});
	assert.equal(FakeWorker.last, before);
}, 3000);

test("with textures off, a textured input shows its own value, not the grey shown while a texture loads", async () => {
	const [meta, geometry, done] = sceneMessages(IDENTITY);
	meta.meta.materials[0].maps = { diffuseColor: { ...TEXTURE, value: [0, 0, 1] } };
	const loading = loadUsd("scene.usda", { textures: "none" });
	await tick();
	[meta, geometry, done].forEach((m) => FakeWorker.last.send(m));
	const { root } = await loading;
	assert.deepEqual(root.children[0].material.color.toArray(), [0, 0, 1]);
});

test("maxConcurrentFetches must be a finite positive integer", async () => {
	for (const value of [0, -1, 1.5, Infinity, NaN]) {
		await assert.rejects(loadUsd("scene.usda", { maxConcurrentFetches: value }), RangeError, String(value));
	}
}, 3000);

test("a material shared by meshes with different UV sets reads the named set on each", async () => {
	const emissive = { ...TEXTURE, uvSet: "custom" };
	const [meta, geometry, done] = sceneMessages(IDENTITY);
	const uv = () => new Float32Array(6);
	meta.meta.materials[0].maps = { emissiveColor: emissive };
	meta.meta.geometryCount = 2;
	meta.meta.instances = [
		{ path: "/WithSt", geometry: 0, material: 0, subsets: {}, doubleSided: false, matrix: IDENTITY },
		{ path: "/OnlyCustom", geometry: 1, material: 0, subsets: {}, doubleSided: false, matrix: IDENTITY },
	];
	const geometryWithSt = {
		...geometry,
		meta: { ...geometry.meta, uvSets: ["st", "custom"] },
		arrays: { ...geometry.arrays, uvs: [uv(), uv()] },
	};
	const geometryOnlyCustom = {
		...geometry,
		index: 1,
		meta: { ...geometry.meta, uvSets: ["custom"] },
		arrays: { ...geometry.arrays, uvs: [uv()] },
	};
	const loading = loadUsd("scene.usda");
	await tick();
	const worker = FakeWorker.last;
	[meta, geometryWithSt, geometryOnlyCustom, done].forEach((m) => worker.send(m));
	const { root } = await loading;
	worker.send({ type: "texture", path: TEXTURE.path, bitmap: fakeBitmap() });
	const [withSt, onlyCustom] = root.children;
	assert.equal(withSt.material.emissiveMap.channel, 1);
	assert.equal(onlyCustom.material.emissiveMap.channel, 0);
});

test("geometry streams in; the load resolves once every geometry has arrived", async () => {
	const loading = loadUsd("scene.usda");
	await new Promise((resolve) => setTimeout(resolve));
	const worker = FakeWorker.last;
	const [meta, geometry, done] = sceneMessages(IDENTITY);
	worker.send(meta);
	worker.send(geometry);
	const early = await Promise.race([
		loading.then(() => "resolved"),
		new Promise((resolve) => setTimeout(() => resolve("pending"), 20)),
	]);
	assert.equal(early, "pending");
	worker.send(done);
	const { info, root } = await loading;
	assert.deepEqual([info.meshes, info.geometries, info.triangles, root.children.length], [1, 1, 1, 1]);
});

const at = (x) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1];

test("instances of one geometry with the same materials draw as one InstancedMesh, framed and freed like meshes", async () => {
	const [meta, geometry, done] = sceneMessages(IDENTITY);
	const red = { ...meta.meta.materials[0], path: "/Red", maps: {} };
	meta.meta.materials = [{ ...red, path: "/Blue" }, red];
	// Six alike, two double-sided: one InstancedMesh and two meshes.
	meta.meta.instances = Array.from({ length: 8 }, (_, x) => ({
		path: `/I[${x}]`,
		geometry: 0,
		material: 0,
		subsets: { Part: 1 },
		doubleSided: x >= 6,
		matrix: at(x),
	}));
	geometry.meta = {
		...geometry.meta,
		groups: [
			[0, 3, "Part"],
			[3, 3],
		],
		bounds: [0, 0, 0, 1, 1, 0],
	};
	geometry.arrays = {
		...geometry.arrays,
		positions: new Float32Array(12),
		normals: new Float32Array(12),
		indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
	};
	const loading = loadUsd("scene.usda");
	await tick();
	[meta, geometry, done].forEach((m) => FakeWorker.last.send(m));
	const { root, info, dispose } = await loading;
	const [batch, ...single] = root.children;
	assert.equal(batch.isInstancedMesh, true);
	assert.equal(batch.count, 6);
	assert.deepEqual(
		batch.material.map((m) => m.name),
		["/Red", "/Blue"],
	);
	assert.deepEqual(
		single.map((m) => [m.isInstancedMesh ?? false, m.name]),
		[
			[false, "/I[6]"],
			[false, "/I[7]"],
		],
	);
	assert.deepEqual([info.meshes, info.triangles], [8, 16]);
	const matrix = new THREE.Matrix4();
	batch.getMatrixAt(5, matrix);
	assert.equal(matrix.elements[12], 5);
	const box = new THREE.Box3().setFromObject(root);
	assert.deepEqual([box.min.x, box.max.x], [0, 8]);
	let freed = false;
	batch.addEventListener("dispose", () => (freed = true));
	dispose();
	assert.equal(freed, true);
});
