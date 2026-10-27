import * as THREE from "three";
import { UsdLoadError } from "./errors.js";
import { OUT_OF_MEMORY, localKey, localUrl } from "./load-core.js";
import { createPoser } from "./pose.js";
import { SHOW } from "./show.js";
import type { InternalOptions } from "./show.js";
import { applyFallback, attachTexture, configureTexture, createMaterial, variant } from "./materials.js";
import type { UsdMaterial } from "./materials.js";
import type {
	GeometryArrays,
	GeometryMeta,
	InstanceMeta,
	LoadRequest,
	Mutable,
	SceneMeta,
	StageProgress,
	WorkerMessage,
} from "./meta.js";
import type {
	LoadInfo,
	LoadOptions,
	LoadProgress,
	LoadResult,
	LoadStats,
	UsdDependency,
	UsdJoint,
	UsdPhysics,
} from "./types.js";

// Instances of one geometry with the same materials drawn as one
// InstancedMesh past this many.
const INSTANCING_MIN = 4;

// The share of the overall `fraction` each stage spans (see LoadProgress).
const STAGES: Record<LoadProgress["stage"], [number, number]> = {
	layers: [0, 0.4],
	compose: [0.4, 0.5],
	geometry: [0.5, 0.8],
	textures: [0.8, 1],
};

/** Where `progress` puts the load overall, before taking the maximum so far. */
function stageFraction(progress: StageProgress) {
	const [start, end] = STAGES[progress.stage];
	// More layers may yet be found; a compose round is halfway into its stage.
	const done =
		progress.stage === "layers"
			? progress.loaded / (progress.total + 1)
			: progress.stage === "compose"
				? 0.5
				: progress.total
					? progress.loaded / progress.total
					: 1;
	return start + (end - start) * done;
}

const wasmModules = new Map<string, Promise<WebAssembly.Module>>();

/** Compiles the WASM module once per URL and page; workers instantiate it without refetching. */
function compileWasm(url?: string | URL) {
	// Written inline so bundlers (Vite, webpack) emit the asset and rewrite the URL.
	url ??= new URL("../wasm/usd_wasm_bg.wasm", import.meta.url);
	const key = String(url);
	let module = wasmModules.get(key);
	if (!module) {
		module = compile(url).catch((error) => {
			wasmModules.delete(key);
			throw new UsdLoadError("worker", `could not load the WASM module from ${key}: ${(error as Error).message}`, {
				url: key,
				cause: error,
			});
		});
		wasmModules.set(key, module);
	}
	return module;
}

async function compile(url: string | URL) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	// Servers that do not send `application/wasm` break streaming compilation.
	if (response.headers.get("content-type")?.startsWith("application/wasm")) {
		return WebAssembly.compileStreaming(response);
	}
	return WebAssembly.compile(await response.arrayBuffer());
}

/**
 * Loads a USD stage into a three.js group. Resolves once geometry is ready;
 * `complete` settles when every texture has streamed in. Rejects with a
 * UsdLoadError of code `worker` where there are no Web Workers (e.g. on a server).
 *
 * @param url  root layer URL (relative URLs resolve against the page), or its key in `options.files`
 */
export async function loadUsd(url: string, options: LoadOptions = {}): Promise<LoadResult> {
	const {
		maxTextureSize,
		textures,
		maxConcurrentFetches,
		maxLayerBytes,
		maxTextureBytes,
		maxLayers,
		maxInstances,
		maxTriangles,
		onProgress,
		signal,
	} = options;
	if (maxConcurrentFetches !== undefined && !(Number.isInteger(maxConcurrentFetches) && maxConcurrentFetches > 0)) {
		throw new RangeError(`maxConcurrentFetches must be a positive integer, got ${maxConcurrentFetches}`);
	}
	const aborted = () => new UsdLoadError("aborted", "the load was aborted", { url, cause: signal?.reason });
	if (signal?.aborted) {
		throw aborted();
	}
	if (typeof Worker === "undefined") {
		throw new UsdLoadError("worker", "loading needs Web Workers: call loadUsd in a browser", { url });
	}
	const files = options.files && new Map([...options.files].map(([key, file]) => [localKey(key), file]));
	if (files && !files.has(localKey(url))) {
		throw new UsdLoadError("fetch", `the root layer ${url} is not in files`, { url, status: 404 });
	}
	const absoluteUrl = files ? localUrl(url) : new URL(url, location.href).href;
	// The compile is shared with other loads: aborting stops waiting for it, not it.
	const module = await new Promise<WebAssembly.Module>((resolve, reject) => {
		const abortWait = () => reject(aborted());
		signal?.addEventListener("abort", abortWait, { once: true });
		compileWasm(options.wasmUrl)
			.then(resolve, reject)
			.finally(() => signal?.removeEventListener("abort", abortWait));
	});
	if (signal?.aborted) {
		throw aborted();
	}
	let worker: Worker;
	try {
		// Inline `new Worker(new URL(...))` is the pattern bundlers recognise and bundle.
		worker = options.workerUrl
			? new Worker(options.workerUrl, { type: "module" })
			: new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
	} catch (error) {
		throw new UsdLoadError("worker", `could not start the worker: ${(error as Error).message}`, {
			url: options.workerUrl && String(options.workerUrl),
			cause: error,
		});
	}
	interface Counts {
		textures: number;
		failed: number;
	}
	let resolveScene!: (scene: BuiltScene) => void;
	let rejectScene!: (error?: UsdLoadError) => void;
	let resolveComplete!: (counts: Counts) => void;
	let rejectComplete!: (error: UsdLoadError) => void;
	const scenePromise = new Promise<BuiltScene>((resolve, reject) => ((resolveScene = resolve), (rejectScene = reject)));
	const complete = new Promise<Counts>((resolve, reject) => ((resolveComplete = resolve), (rejectComplete = reject)));
	// A rejection nobody awaits (e.g. after dispose) must not surface as unhandled.
	complete.catch(() => {});
	const counts = { textures: 0, failed: 0 };
	let fraction = 0;
	let built: BuiltScene | null = null;
	// Geometry, the scene and textures follow the `meta` that builds it.
	const builtScene = () => {
		if (!built) {
			throw new Error("the worker sent the scene before its metadata");
		}
		return built;
	};
	let delivered = false;
	let stopped = false;
	// The one way out (done, error, dispose, abort): stop the worker, which
	// frees its WASM memory, and settle both promises (a no-op if settled).
	const stop = (error?: UsdLoadError) => {
		if (stopped) {
			return;
		}
		stopped = true;
		worker.terminate();
		signal?.removeEventListener("abort", abort);
		rejectScene(error);
		if (error) {
			rejectComplete(error);
		} else {
			resolveComplete({ ...counts });
		}
	};
	function fail(error: UsdLoadError) {
		// Before geometry resolves nothing has reached the caller: free it here.
		if (built && !delivered) {
			built.dispose();
		}
		stop(error);
	}
	function abort() {
		fail(aborted());
	}
	signal?.addEventListener("abort", abort, { once: true });

	worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
		// Messages already queued when the load was stopped (disposed or aborted).
		if (stopped) {
			if (data.type === "texture") {
				data.bitmap?.close();
			}
			return;
		}
		// The caller's own callback: an error it throws is the caller's, not a failed load.
		if (data.type === "progress") {
			fraction = Math.max(fraction, stageFraction(data.progress));
			onProgress?.({ ...data.progress, fraction });
			return;
		}
		try {
			receive(data);
		} catch (error) {
			if (data.type === "texture") {
				data.bitmap?.close();
			}
			fail(
				new UsdLoadError("worker", `could not build the scene: ${(error as Error)?.message || error}`, {
					url: absoluteUrl,
					cause: error,
				}),
			);
		}
	};
	function receive(data: WorkerMessage) {
		switch (data.type) {
			case "meta":
				if (signal?.aborted) {
					return abort();
				}
				built = buildScene(data.meta, textures);
				(options as InternalOptions)[SHOW]?.(built.root, data.meta);
				break;
			case "geometry":
				builtScene().addGeometry(data.index, data.meta, data.arrays);
				break;
			case "scene": {
				const { warnings, ...stats } = data.stats;
				builtScene().info.stats = stats;
				builtScene().info.dependencies.unshift(
					...data.layers.map(({ url, size }): UsdDependency => ({ url, kind: "layer", size })),
				);
				builtScene().info.warnings.push(...warnings);
				delivered = true;
				resolveScene(builtScene());
				break;
			}
			case "texture":
				if (data.bitmap) {
					builtScene().applyTexture(data.path, data.bitmap, data.color, data.size);
					counts.textures++;
				} else {
					builtScene().textureFailed(data.path);
					counts.failed++;
					builtScene().info.warnings.push({ code: "texture-failed", message: data.error, path: data.path });
				}
				break;
			case "done":
				stop();
				break;
			case "error":
				fail(new UsdLoadError(data.code, data.message, { url: data.url, status: data.status }));
				break;
		}
	}
	worker.onerror = (event: ErrorEvent) => {
		event.preventDefault?.();
		const message = event.message || "the worker failed";
		// The worker itself ran out of memory, outside the handler that reports it.
		if (OUT_OF_MEMORY.test(message)) {
			fail(new UsdLoadError("compose", `scene too large to load: ran out of memory: ${message}`, { url: absoluteUrl }));
		} else {
			fail(new UsdLoadError("worker", message, { url: absoluteUrl }));
		}
	};
	const request: LoadRequest = {
		url: absoluteUrl,
		wasmModule: module,
		maxTextureSize,
		textures,
		maxConcurrentFetches,
		maxLayerBytes,
		maxTextureBytes,
		maxLayers,
		maxInstances,
		maxTriangles,
		files,
	};
	worker.postMessage(request);

	const scene = await scenePromise;
	return {
		root: scene.root,
		info: scene.info as LoadInfo,
		complete,
		pose: scene.poser.pose,
		resetPose: scene.poser.resetPose,
		getPose: scene.poser.getPose,
		dispose() {
			stop(aborted());
			scene.dispose();
		},
	};
}

type BuiltScene = ReturnType<typeof buildScene>;

function buildScene(meta: SceneMeta, textureMode: LoadOptions["textures"]) {
	const info: Mutable<Omit<LoadInfo, "stats">> & {
		stats?: LoadStats;
		warnings: LoadInfo["warnings"][number][];
		dependencies: Mutable<UsdDependency>[];
	} = {
		upAxis: meta.upAxis,
		metersPerUnit: meta.metersPerUnit,
		meshes: 0,
		geometries: 0,
		triangles: 0,
		materials: meta.materials.length,
		materialKinds: countBy(meta.materials, (m) => m.kind),
		warnings: [...meta.warnings],
		physics: inMeters(meta.physics, meta.metersPerUnit || 1),
		labels: meta.labels,
		variantSelections: meta.variantSelections,
		// The fetched layers come with the scene; textures in packages are part of their package.
		dependencies: [...new Set(meta.materials.flatMap((m) => Object.values(m.maps).map((ref) => ref.path)))]
			.filter((path) => !path.includes("["))
			.map((url): Mutable<UsdDependency> => ({ url, kind: "texture", size: null })),
	};
	const root = new THREE.Group();
	root.name = "usd";
	// three.js is Y-up in meters.
	if (meta.upAxis === "Z") {
		root.rotation.x = -Math.PI / 2;
	}
	root.scale.setScalar(meta.metersPerUnit || 1);

	const materials = meta.materials.map((m) => {
		const material = createMaterial(m);
		// With textures off, each textured input shows its own value, as when its image fails.
		if (textureMode === "none") {
			Object.values(m.maps).forEach(({ path }) => applyFallback(material, path));
		}
		return material;
	});
	const variants = new Map<string, UsdMaterial>();
	const materialFor = (
		index: number,
		doubleSided: boolean,
		vertexColors: boolean,
		uvChannels: Record<string, number>,
	) => {
		const routed = Object.keys(uvChannels).length > 0;
		if (!doubleSided && !vertexColors && !routed) {
			return materials[index];
		}
		const key = `${index}|${doubleSided}|${vertexColors}|${JSON.stringify(uvChannels)}`;
		let copy = variants.get(key);
		if (!copy) {
			copy = variant(materials[index], { doubleSided, vertexColors, uvChannels });
			variants.set(key, copy);
		}
		return copy;
	};

	// Geometries stream in one at a time; each brings in the meshes that draw it.
	const geometries: THREE.BufferGeometry[] = [];
	const instancesOf = new Map<number, InstanceMeta[]>();
	for (const inst of meta.instances) {
		const list = instancesOf.get(inst.geometry);
		if (list) {
			list.push(inst);
		} else {
			instancesOf.set(inst.geometry, [inst]);
		}
	}
	const instanced: THREE.InstancedMesh[] = [];
	const addGeometry = (index: number, g: GeometryMeta | null, a: GeometryArrays | null) => {
		if (!g) {
			return;
		}
		// A malformed message: throwing fails the load.
		if (!a) {
			throw new Error("a geometry without its arrays");
		}
		const geometry = createGeometry(g, a);
		geometries.push(geometry);
		info.geometries++;

		const triangles = g.groups.reduce((n, [, count]) => n + count / 3, 0);
		// Instances by the materials they draw with.
		const batches = new Map<string, { material: UsdMaterial | UsdMaterial[]; list: InstanceMeta[] }>();
		for (const inst of instancesOf.get(index) ?? []) {
			// A group takes its GeomSubset's material, else the mesh's.
			const mats = g.groups.map(([, , subset]) => {
				const m = subset !== undefined && Object.hasOwn(inst.subsets, subset) ? inst.subsets[subset] : inst.material;
				const usd = materials[m].userData.usd;
				// Route each named UV set to its attribute on this geometry; meshes that
				// lay their UV sets out differently get their own copy of the material.
				const uvChannels: Record<string, number> = Object.create(null);
				for (const ref of Object.values(usd.maps)) {
					if (ref.uvSet === undefined) {
						continue;
					}
					const k = g.uvSets.indexOf(ref.uvSet);
					if (k > 0) {
						uvChannels[ref.uvSet] = k;
					}
				}
				return materialFor(m, inst.doubleSided, g.hasColors && !!usd.colorPrimvar, uvChannels);
			});
			const key = mats.map((m) => m.uuid).join();
			const batch = batches.get(key);
			if (batch) {
				batch.list.push(inst);
			} else {
				batches.set(key, { material: mats.length > 1 ? mats : mats[0], list: [inst] });
			}
			info.meshes++;
			info.triangles += triangles;
		}
		// USD stores row-vector matrices row-major: the same numbers column-major for three.js.
		// Set whole rather than decomposed, which would lose shear.
		for (const { material, list } of batches.values()) {
			if (list.length > INSTANCING_MIN) {
				const mesh = new THREE.InstancedMesh(geometry, material, list.length);
				mesh.name = list[0].path;
				mesh.userData.paths = list.map((inst) => inst.path);
				const matrix = new THREE.Matrix4();
				list.forEach((inst, k) => mesh.setMatrixAt(k, matrix.fromArray(inst.matrix)));
				mesh.computeBoundingBox();
				mesh.computeBoundingSphere();
				instanced.push(mesh);
				root.add(mesh);
				continue;
			}
			for (const inst of list) {
				const mesh = new THREE.Mesh(geometry, material);
				mesh.name = inst.path;
				mesh.matrix.fromArray(inst.matrix);
				mesh.matrixAutoUpdate = false;
				mesh.matrixWorldNeedsUpdate = true;
				root.add(mesh);
			}
		}
	};

	const allMaterials = () => [...materials, ...variants.values()];
	const textures = new Map<string, THREE.Texture>();
	const applyTexture = (path: string, bitmap: ImageBitmap, isColor: boolean, size: number) => {
		const dependency = info.dependencies.find((d) => d.url === path && d.kind === "texture") as
			| Mutable<UsdDependency>
			| undefined;
		if (dependency) {
			dependency.size = size;
		}
		const base = new THREE.Texture(bitmap);
		base.flipY = false;
		base.anisotropy = 4;
		textures.set(path, base);
		const textureFor: Parameters<typeof attachTexture>[3] = (ref, colorSpace, uvChannel) =>
			configureTexture(base, ref, colorSpace, uvChannel);
		for (const material of allMaterials()) {
			attachTexture(material, path, isColor, textureFor);
		}
	};
	const textureFailed = (path: string) => allMaterials().forEach((material) => applyFallback(material, path));

	const dispose = () => {
		geometries.forEach((g) => g.dispose());
		instanced.forEach((mesh) => mesh.dispose());
		for (const m of allMaterials()) {
			for (const key of [
				"map",
				"emissiveMap",
				"roughnessMap",
				"metalnessMap",
				"aoMap",
				"alphaMap",
				"normalMap",
			] as const) {
				m[key]?.dispose();
			}
			m.dispose();
		}
		for (const t of textures.values()) {
			(t.image as ImageBitmap | undefined)?.close?.();
			t.dispose();
		}
	};

	const poser = createPoser(root, info.physics.joints, info.physics.bodies, meta.metersPerUnit);

	return { root, info, poser, addGeometry, applyTexture, textureFailed, dispose };
}

/** Joint limits, positions and mimic offsets from stage units to meters wherever they are lengths. */
function inMeters(physics: UsdPhysics, metersPerUnit: number): UsdPhysics {
	const m = (v: number | null) => (v === null ? null : v * metersPerUnit);
	const joints = physics.joints.map((j): UsdJoint => {
		switch (j.kind) {
			case "prismatic":
				return {
					...j,
					lower: m(j.lower),
					upper: m(j.upper),
					rest: j.rest * metersPerUnit,
					mimic: j.mimic && { ...j.mimic, offset: j.mimic.offset * metersPerUnit },
				};
			case "distance":
				return { ...j, min: m(j.min), max: m(j.max) };
			case "generic":
				return {
					...j,
					dofs: j.dofs.map((d) =>
						d.dof.startsWith("rot") ? d : { ...d, low: d.low * metersPerUnit, high: d.high * metersPerUnit },
					),
				};
			case "revolute":
			case "spherical":
			case "fixed":
				return j;
			default: {
				const never: never = j;
				return never;
			}
		}
	});
	return { ...physics, joints };
}

function createGeometry(g: GeometryMeta, a: GeometryArrays) {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(a.positions, 3));
	geometry.setAttribute("normal", new THREE.BufferAttribute(a.normals, 3));
	// UV set k is three.js attribute `uv`, `uv1`, `uv2`, ... (a texture's `channel`).
	a.uvs.forEach((uv, k) => geometry.setAttribute(k ? `uv${k}` : "uv", new THREE.BufferAttribute(uv, 2)));
	if (a.colors) {
		geometry.setAttribute("color", new THREE.BufferAttribute(a.colors, 3));
	}
	geometry.setIndex(new THREE.BufferAttribute(a.indices, 1));
	// Once on the GPU the vertex arrays are dead weight. The index stays: three.js builds wireframes from it.
	for (const attribute of Object.values(geometry.attributes) as THREE.BufferAttribute[]) {
		attribute.onUpload(releaseArray);
	}
	// Bounds come from the worker, so framing and culling never rescan positions.
	geometry.boundingBox = new THREE.Box3().setFromArray(g.bounds);
	geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
	if (g.groups.length > 1) {
		g.groups.forEach(([start, count], j) => geometry.addGroup(start, count, j));
	}
	return geometry;
}

/** `onUpload` callback: drops the CPU copy of an attribute three.js just uploaded. */
function releaseArray(this: { array: unknown }) {
	this.array = null;
}

function countBy<T>(list: T[], key: (item: T) => string) {
	const out: Record<string, number> = {};
	for (const item of list) {
		out[key(item)] = (out[key(item)] || 0) + 1;
	}
	return out;
}
