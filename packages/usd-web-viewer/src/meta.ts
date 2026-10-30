// What the WASM side reports as JSON (crate/src/json.rs), and the
// messages between the page and the worker. Internal: not exported.
import type {
	UsdLabel,
	UsdPhysics,
	UsdVariantSelection,
	LoadProgress,
	LoadStats,
	LoadWarning,
	MaterialKind,
	TextureMode,
	UsdLoadErrorCode,
} from "./types.js";

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
/** `min x, y, z, max x, y, z`. */
export type Bounds = [number, number, number, number, number, number];

/** One textured input of a material. */
export interface TextureRef {
	path: string;
	channel: string;
	scale: Vec4;
	bias: Vec4;
	/** The input's own value, shown when the image cannot be read. */
	value?: Vec4;
	colorSpace?: string;
	uvSet?: string;
	wrapS?: string;
	wrapT?: string;
	uvScale: [number, number];
	uvRotation: number;
	uvTranslation: [number, number];
}

export interface MaterialMeta {
	path: string;
	kind: MaterialKind;
	color: Vec3;
	emissive: Vec3;
	opacity: number;
	opacityThreshold: number;
	roughness: number;
	metallic: number;
	colorPrimvar?: string;
	maps: Record<string, TextureRef>;
}

export interface InstanceMeta {
	path: string;
	geometry: number;
	doubleSided: boolean;
	/** Row-major 4x4. */
	matrix: number[];
	material: number;
	/** GeomSubset name to material index. */
	subsets: Record<string, number>;
}

export interface SceneMeta {
	upAxis: string;
	metersPerUnit: number;
	bounds?: Bounds;
	warnings: LoadWarning[];
	geometryCount: number;
	instances: InstanceMeta[];
	materials: MaterialMeta[];
	physics: UsdPhysics;
	labels: UsdLabel[];
	variantSelections: UsdVariantSelection[];
}

/** `[start, count, subset?]`, in indices. */
export type Group = [number, number, string?];

export interface GeometryMeta {
	vertices: number;
	maxIndex: number;
	hasColors: boolean;
	bounds: Bounds;
	uvSets: string[];
	groups: Group[];
}

/** What `UsdScene.read` returns for a mesh past the triangle budget. */
export interface OverBudget {
	overBudget: number;
	path: string;
}

export interface GeometryArrays {
	positions: Float32Array;
	normals: Float32Array;
	uvs: Float32Array[];
	colors: Float32Array | null;
	indices: Uint16Array | Uint32Array;
}

export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** LoadStats as they are counted, and the warnings found along the way; the worker adds the timings that are not composition's. */
export type ComposeStats = Mutable<Omit<LoadStats, "initMs" | "totalMs" | "wasmMemoryBytes">> &
	Partial<Mutable<Pick<LoadStats, "initMs" | "totalMs" | "wasmMemoryBytes">>> & { warnings: LoadWarning[] };

/** What `loadFailure` tells the page. */
export interface Failure {
	code: UsdLoadErrorCode;
	message: string;
	url?: string | undefined;
	status?: number | undefined;
}

/** Progress as the worker reports it, before the page adds `fraction`. */
export type StageProgress = LoadProgress extends infer P ? (P extends unknown ? Omit<P, "fraction"> : never) : never;

/** Starts a load: the one message the page sends the worker. */
export interface LoadRequest {
	url: string;
	wasmModule: WebAssembly.Module;
	maxTextureSize?: number | undefined;
	textures?: TextureMode | undefined;
	maxConcurrentFetches?: number | undefined;
	maxLayerBytes?: number | undefined;
	maxTextureBytes?: number | undefined;
	maxLayers?: number | undefined;
	maxInstances?: number | undefined;
	maxTriangles?: number | undefined;
	/** Keyed by `localKey`. */
	files?: ReadonlyMap<string, Blob> | undefined;
}

/** Worker to page. */
export type WorkerMessage =
	| { type: "progress"; progress: StageProgress }
	| { type: "meta"; meta: SceneMeta }
	| { type: "geometry"; index: number; meta: GeometryMeta | null; arrays: GeometryArrays | null }
	| { type: "scene"; stats: LoadStats & { warnings: LoadWarning[] }; layers: { url: string; size: number }[] }
	| { type: "texture"; path: string; bitmap: ImageBitmap; color: boolean; size: number; error?: undefined }
	| { type: "texture"; path: string; error: string; bitmap?: undefined }
	| { type: "done" }
	| ({ type: "error" } & Failure);
