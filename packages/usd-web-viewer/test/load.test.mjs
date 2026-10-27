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
				physics: { bodies: [], colliders: [], materials: [], joints: [] },
				labels: [],
				variantSelections: [],
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
		{ type: "scene", stats: { warnings: [] }, layers: [{ url: "https://example.test/scene.usda", size: 10 }] },
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

/** A body with a door hinged at x = 1 about Z, a drawer sliding along X, and a pane fixed to the door, in centimeters. */
function articulatedMessages() {
	const frame = (x) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1];
	const instance = (path) => ({
		path,
		geometry: 0,
		material: 0,
		subsets: {},
		doubleSided: false,
		matrix: frame(path === "/Door/Pane/M" ? 2 : 0),
	});
	const body = (path, mass) => ({
		path,
		kinematic: false,
		mass,
		massSource: mass === null ? null : "authored",
		centerOfMass: null,
		diagonalInertia: null,
		principalAxes: null,
		world: IDENTITY,
		colliders: [],
		attached: [],
	});
	const joint = (path, kind, body0, body1, extra) => ({
		path,
		kind,
		displayName: null,
		body0,
		body1,
		frame: frame(100),
		rest: 0,
		mimic: null,
		...extra,
	});
	const [meta, geometry] = sceneMessages(IDENTITY);
	return [
		{
			...meta,
			meta: {
				...meta.meta,
				metersPerUnit: 0.01,
				instances: ["/Body/M", "/Door/M", "/Door/Pane/M", "/Drawer/M", "/Lid/M"].map(instance),
				physics: {
					bodies: [
						body("/Body", 50),
						body("/Door", 2),
						body("/Door/Pane", 1),
						body("/Drawer", null),
						body("/Lid", null),
					],
					colliders: [],
					materials: [],
					joints: [
						joint("/J/Hinge", "revolute", "/Body", "/Door", { axis: "Z", lower: -90, upper: 90 }),
						joint("/J/Pane", "fixed", "/Door", "/Door/Pane"),
						joint("/J/Slide", "prismatic", "/Body", "/Drawer", { axis: "X", lower: 0, upper: 30 }),
						joint("/J/Custom", "generic", "/Body", "/Door", {
							dofs: [
								{ dof: "transX", low: -5, high: 5 },
								{ dof: "rotZ", low: -10, high: 10 },
							],
						}),
						joint("/J/Lid", "revolute", "/Shelf", "/Lid", { axis: "Z", lower: 0, upper: 90 }),
						joint("/J/Follower", "revolute", "/Body", "/Drawer", {
							axis: "Z",
							lower: null,
							upper: null,
							mimic: { reference: "/J/Hinge", gearing: -1, offset: 0 },
						}),
					],
				},
				labels: [{ path: "/", taxonomy: "wikidata_class", values: ["cabinet"] }],
				variantSelections: [{ prim: "/Cabinet", set: "PhysX", selection: "Enabled" }],
			},
		},
		geometry,
		{ type: "scene", stats: { warnings: [] }, layers: [{ url: "https://example.test/scene.usda", size: 10 }] },
	];
}

async function loadArticulated() {
	const loading = loadUsd("scene.usda");
	await tick();
	const worker = FakeWorker.last;
	articulatedMessages().forEach((m) => worker.send(m));
	const result = await loading;
	// Five copies of one mesh draw as one InstancedMesh: read the copy's own matrix.
	const position = (path) => {
		const mesh = result.root.children.find((m) => m.userData.paths?.includes(path));
		const matrix = new THREE.Matrix4();
		mesh.getMatrixAt(mesh.userData.paths.indexOf(path), matrix);
		return new THREE.Vector3().setFromMatrixPosition(matrix);
	};
	return { ...result, worker, position };
}

test("physics, labels and variant selections pass through, with prismatic limits in meters", async () => {
	const { info } = await loadArticulated();
	const slide = info.physics.joints.find((j) => j.path === "/J/Slide");
	assert.deepEqual([slide.lower, slide.upper, slide.rest], [0, 0.3, 0]);
	const hinge = info.physics.joints.find((j) => j.path === "/J/Hinge");
	assert.deepEqual([hinge.lower, hinge.upper], [-90, 90]);
	assert.equal(info.physics.bodies.length, 5);
	assert.deepEqual(info.labels, [{ path: "/", taxonomy: "wikidata_class", values: ["cabinet"] }]);
	assert.deepEqual(info.variantSelections, [{ prim: "/Cabinet", set: "PhysX", selection: "Enabled" }]);
});

test("dependencies list the layers read and the textures, sized as they arrive", async () => {
	const { info, worker } = await load();
	assert.deepEqual(info.dependencies, [
		{ url: "https://example.test/scene.usda", kind: "layer", size: 10 },
		{ url: TEXTURE.path, kind: "texture", size: null },
	]);
	worker.send({ type: "texture", path: TEXTURE.path, bitmap: fakeBitmap(), color: true, size: 2048 });
	assert.equal(info.dependencies[1].size, 2048);
});

test("pose turns a body about its joint and moves what is fixed to it", async () => {
	const { pose, position } = await loadArticulated();
	pose("/J/Hinge", 90);
	// Hinged at x = 100 cm, a quarter turn about Z takes the door's origin to (100, -100).
	const door = position("/Door/M");
	assert.ok(door.distanceTo(new THREE.Vector3(100, -100, 0)) < 1e-9, `door at ${door.toArray()}`);
	// The pane, 2 cm along the door, swings with it.
	const pane = position("/Door/Pane/M");
	assert.ok(pane.distanceTo(new THREE.Vector3(100, -98, 0)) < 1e-9, `pane at ${pane.toArray()}`);
	assert.ok(position("/Body/M").length() < 1e-12, "the body stays");
});

test("pose slides in meters, clamps to the limits, and resetPose puts everything back", async () => {
	const { pose, resetPose, position } = await loadArticulated();
	pose("/J/Slide", 0.12);
	assert.ok(position("/Drawer/M").distanceTo(new THREE.Vector3(12, 0, 0)) < 1e-9);
	pose("/J/Slide", 5);
	assert.ok(position("/Drawer/M").distanceTo(new THREE.Vector3(30, 0, 0)) < 1e-9, "clamped to 0.3 m");
	resetPose();
	assert.ok(position("/Drawer/M").length() < 1e-12);
	assert.ok(position("/Door/M").length() < 1e-12);
	assert.throws(() => pose("/J/Missing", 1), /no joint at \/J\/Missing/);
});

test("getPose reports every joint where it is, mimic joints included", async () => {
	const { pose, resetPose, getPose } = await loadArticulated();
	const rest = { "/J/Hinge": 0, "/J/Slide": 0, "/J/Lid": 0, "/J/Follower": 0 };
	assert.deepEqual(getPose(), rest);
	pose("/J/Hinge", 45);
	pose("/J/Slide", 0.1);
	assert.deepEqual(getPose(), { ...rest, "/J/Hinge": 45, "/J/Slide": 0.1, "/J/Follower": 45 });
	resetPose();
	assert.deepEqual(getPose(), rest);
});

test("generic translation limits are in meters too", async () => {
	const { info } = await loadArticulated();
	const custom = info.physics.joints.find((j) => j.path === "/J/Custom");
	assert.deepEqual(custom.dofs, [
		{ dof: "transX", low: -0.05, high: 0.05 },
		{ dof: "rotZ", low: -10, high: 10 },
	]);
});

test("pose moves a body hung from a prim that is not a rigid body", async () => {
	const { pose, position } = await loadArticulated();
	pose("/J/Lid", 90);
	const lid = position("/Lid/M");
	assert.ok(lid.distanceTo(new THREE.Vector3(100, -100, 0)) < 1e-9, `lid at ${lid.toArray()}`);
});
