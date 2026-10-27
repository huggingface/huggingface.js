// The public types; `index` re-exports them.
import type * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

/** `preview` (default): base color up to `maxTextureSize`, roughness / metallic / occlusion / opacity / emissive maps up to 512 px, no normal maps. `full`: every map, normals included, up to `maxTextureSize`. `none`: no textures. */
export type TextureMode = "none" | "preview" | "full";

export type LoadProgress = (
	| {
			readonly stage: "layers";
			readonly loaded: number;
			/** Grows while layer dependencies are discovered. */ readonly total: number;
			readonly bytes: number;
	  }
	| { readonly stage: "compose"; readonly round: number }
	/** Meshes streaming out of the worker; the load resolves once `loaded === total`. */
	| { readonly stage: "geometry"; readonly loaded: number; readonly total: number }
	| { readonly stage: "textures"; readonly loaded: number; readonly total: number; readonly bytes: number }
) & {
	/**
	 * The whole load, 0 to 1, for a progress bar; it never decreases. Each stage spans a share: `layers` 0–0.4 (`loaded / (total + 1)`,
	 * as more layers may yet be found), `compose` 0.45, `geometry` 0.5–0.8 and `textures` 0.8–1 (`loaded / total`). It reaches 1 when the
	 * last texture settles, or with the `textures` stage when there are none.
	 */
	readonly fraction: number;
};

/**
 * Every request a load makes is sent as `<model-viewer>` sends its own: cookies only to the page's own origin (the browser's default
 * `credentials: 'same-origin'`), no custom headers, no referrer, and only to http(s) URLs (the root URL excepted, as the caller chose it).
 */
export interface LoadOptions {
	/** Default `preview`. */
	textures?: TextureMode | undefined;
	/** Long-side cap for decoded textures, in pixels. Default 1024. */
	maxTextureSize?: number | undefined;
	/** Aborts fetches and the worker; the load rejects with a UsdLoadError of code `aborted`. */
	signal?: AbortSignal | undefined;
	onProgress?: ((progress: LoadProgress) => void) | undefined;
	/** Where the `.wasm` binary is served from. Defaults to the copy next to the package. */
	wasmUrl?: string | URL | undefined;
	/** Where the worker script is served from. Defaults to the copy next to the package. */
	workerUrl?: string | URL | undefined;
	/** Requests in flight at once, a positive integer (anything else throws a RangeError). Default 16 (textures: at most 4 fetched and decoded at once). */
	maxConcurrentFetches?: number | undefined;
	/** Total bytes of USD layers to fetch before failing with a `fetch` error. Default 768 MiB. */
	maxLayerBytes?: number | undefined;
	/** Layer files to request before failing with a `fetch` error. Default 1024. Layers read from inside a `.usdz` package are not requested, so not counted: the package counts once, its contents are bounded by `maxLayerBytes` and the package expansion limits (512 MiB per file, 1 GiB in all). */
	maxLayers?: number | undefined;
	/** Triangles drawn across all meshes, counted once per instance; meshes past it are left out unread with a `triangle-limit` warning. Default 20 million. */
	maxTriangles?: number | undefined;
	/** Mesh instances drawn, PointInstancer placements (nested ones expanded) included; the rest are left out with an `instance-limit` warning. Default 100,000. Many instances of one mesh with the same materials draw as one `THREE.InstancedMesh`. */
	maxInstances?: number | undefined;
	/** Total bytes of texture files, read from packages or fetched (counted as they download); textures past it fail with a `texture-failed` warning. Default 512 MiB. Only PNG, JPEG and WebP up to 16384 px a side and 8192 x 8192 px in area are decoded; others are refused from their header. */
	maxTextureBytes?: number | undefined;
	/**
	 * Loads from these files instead of the network, e.g. ones dropped on the page or picked with `<input type="file" webkitdirectory>`.
	 * Keys are package-relative paths (`pkg/root.usda`, `pkg/Textures/a.png`; a `File`'s `webkitRelativePath` works as is), and the
	 * `url` argument is the key of the root layer. Relative asset paths resolve against their layer's key and match a key exactly
	 * (case-sensitive; `\\` and a leading `./` or `/` are normalised). Paths not in `files` are never fetched: they are missing.
	 * Absolute http(s) paths in the files are fetched like any other. Files are read in the worker only when
	 * needed, counted against `maxLayerBytes` and `maxTextureBytes`.
	 */
	files?: ReadonlyMap<string, Blob> | undefined;
}

/**
 * - `prim-unsupported`: visible geometry other than meshes and the implicit `Cube` / `Sphere` / `Cylinder` / `Cone` / `Capsule` / `Plane` (e.g. `BasisCurves`, `Points`, `Volume`, Gaussian splats) left out.
 * - `nothing-drawable`: no visible mesh had anything to draw.
 * - `layer-missing`: a layer could not be fetched, or was not an http(s) URL.
 * - `layer-unreadable`: a layer was fetched but could not be parsed; composition goes on without it.
 * - `material-fallback`: materials with neither UsdPreviewSurface nor a supported MDL material (OmniPBR, glTF), e.g. MaterialX only or custom MDL modules, shown grey.
 * - `composition`: what composition reported, e.g. an unresolved reference (the first 5, then a count).
 * - `texture-failed`: an image could not be fetched or read, or was refused (not an http(s) URL, past `maxTextureBytes`, larger than 16384 px a side or 8192 x 8192 px in area, or not PNG, JPEG or WebP); its inputs show their own (authored or default) values.
 * - `triangle-limit`: meshes left out past `maxTriangles`.
 * - `instance-limit`: instances left out past `maxInstances`.
 */
export type WarningCode =
	| "layer-missing"
	| "layer-unreadable"
	| "prim-unsupported"
	| "nothing-drawable"
	| "material-fallback"
	| "composition"
	| "texture-failed"
	| "triangle-limit"
	| "instance-limit";

export interface LoadWarning {
	readonly code: WarningCode;
	readonly message: string;
	/** The layer URL, texture path or an example prim / material path. */
	readonly path?: string | undefined;
}

/**
 * A 4x4 local-to-world matrix in stage space: the stage's own up axis and units, like the meshes' matrices under the root, which
 * turns them Y-up and into meters. The numbers are a column-major three.js matrix: `new THREE.Matrix4().fromArray(m)`, then parent
 * what it places under `root`.
 */
export type UsdMatrix = readonly [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];

/**
 * What a stage authors for simulation (UsdPhysics), read as authored: nothing is estimated. Masses are in kilograms, densities in
 * kg/m³, inertia in kg·m², joint limits and positions in degrees or meters. Positions and matrices are in stage space (see
 * {@link UsdMatrix}).
 */
export interface UsdPhysics {
	readonly bodies: readonly UsdRigidBody[];
	readonly colliders: readonly UsdCollider[];
	readonly materials: readonly UsdPhysicsMaterial[];
	readonly joints: readonly UsdJoint[];
}

/** A prim with `PhysicsRigidBodyAPI`. Its meshes are the ones at or under its path, but not under a nested body. */
export interface UsdRigidBody {
	readonly path: string;
	readonly kinematic: boolean;
	/**
	 * In kilograms: `physics:mass` on the body (`authored`), else the sum of its colliders' own masses when every collider has one
	 * (`colliders`); null otherwise, when the engine would compute it.
	 */
	readonly mass: { readonly value: number; readonly source: "authored" | "colliders" } | null;
	/** In the body's frame, stage units, as authored. */
	readonly centerOfMass: readonly [number, number, number] | null;
	/** kg·m², about `principalAxes`. */
	readonly diagonalInertia: readonly [number, number, number] | null;
	/** `w, x, y, z`, in the body's frame. */
	readonly principalAxes: readonly [number, number, number, number] | null;
	/** Where the body is in the authored pose; not updated by `pose`. */
	readonly world: UsdMatrix;
	/** Collider prim paths. */
	readonly colliders: readonly string[];
	/** Bodies held to this one by fixed joints (this body is the joint's body0): they move with it. */
	readonly attached: readonly string[];
}

/** A prim with `PhysicsCollisionAPI`. */
export interface UsdCollider {
	readonly path: string;
	/** The nearest rigid body at or above it; null for a static collider. */
	readonly body: string | null;
	/** The prim type as authored: `Mesh`, `Cube`, `Sphere`, `Capsule`, `Cylinder`, `Cone`, `Plane`, ... */
	readonly shape: string;
	/** `physics:approximation` on a mesh as authored: `none`, `convexHull`, `convexDecomposition`, `meshSimplification`, `boundingCube`, `boundingSphere`, `sdf`, ... */
	readonly approximation: string | null;
	/** False for an invisible or guide collision-only mesh, which the viewer does not draw. */
	readonly visual: boolean;
	/** The physics material bound with the `physics` purpose. */
	readonly material: string | null;
	/** Kilograms. */
	readonly mass: number | null;
	/** kg/m³. */
	readonly density: number | null;
}

/** A material with `PhysicsMaterialAPI`. */
export interface UsdPhysicsMaterial {
	readonly path: string;
	/** kg/m³. */
	readonly density: number | null;
	readonly staticFriction: number | null;
	readonly dynamicFriction: number | null;
	readonly restitution: number | null;
}

export type UsdAxis = "X" | "Y" | "Z";

/** A degree of freedom a `PhysicsLimitAPI` instance names. */
export type UsdDof = "transX" | "transY" | "transZ" | "rotX" | "rotY" | "rotZ" | "distance";

/**
 * What a joint is and how far it moves. Field names follow the USD attributes they come from (`lowerLimit`, `coneAngle0Limit`,
 * `minDistance`, `limit:<dof>:physics:low`). Rotations are in degrees, translations in meters; null is unbounded. More kinds may be
 * added: handle unknown ones.
 */
export type UsdJointKind =
	| { readonly kind: "revolute"; readonly axis: UsdAxis; readonly lower: number | null; readonly upper: number | null }
	| { readonly kind: "prismatic"; readonly axis: UsdAxis; readonly lower: number | null; readonly upper: number | null }
	| { readonly kind: "spherical"; readonly axis: UsdAxis; readonly cone0: number | null; readonly cone1: number | null }
	| { readonly kind: "distance"; readonly min: number | null; readonly max: number | null }
	| { readonly kind: "fixed" }
	/** A `PhysicsJoint` (or a joint type this package does not know) limited per degree of freedom; locked where `low > high`. */
	| {
			readonly kind: "generic";
			readonly dofs: readonly { readonly dof: UsdDof; readonly low: number | null; readonly high: number | null }[];
	  };

/** A UsdPhysics joint between two rigid bodies. */
export type UsdJoint = UsdJointKind & {
	readonly path: string;
	/** The prim type as authored, e.g. `PhysicsRevoluteJoint`. */
	readonly type: string;
	/** Only when authored. */
	readonly displayName: string | null;
	/** The `physics:body0` / `physics:body1` targets as authored; null is the world. */
	readonly target0: string | null;
	readonly target1: string | null;
	/** The rigid bodies it connects: the nearest rigid body at or above each target, else the target itself; null is the world. */
	readonly body0: string | null;
	readonly body1: string | null;
	/** The joint frame on each target (`localPos` and `localRot` placed in the authored pose), without scale; not updated by `pose`. */
	readonly frame0: UsdMatrix;
	readonly frame1: UsdMatrix;
	/** Computed from the two frames: where the authored poses put the joint (degrees or meters; 0 for the other kinds). */
	readonly rest: number;
	/** A PhysX mimic joint, which follows `reference`: `position + gearing * reference + offset = 0`. */
	readonly mimic: { readonly reference: string; readonly gearing: number; readonly offset: number } | null;
};

/** A UsdSemantics label set: `semantics:labels:<taxonomy>` on a prim, e.g. `wikidata_class` = `["cabinet"]`. */
export interface UsdLabel {
	readonly path: string;
	readonly taxonomy: string;
	readonly values: readonly string[];
}

/** A variant selection on the stage's default prim (not stage-wide), e.g. `PhysX` = `Enabled`. */
export interface UsdVariantSelection {
	readonly prim: string;
	readonly set: string;
	readonly selection: string;
}

/**
 * A file the stage depends on: a layer it read (USD, or a `.usdz` package, whose own contents are not listed) or a texture a
 * material references outside a package.
 */
export interface UsdDependency {
	/** The fetched URL, or the key in `files` for a local load. */
	readonly url: string;
	readonly kind: "layer" | "texture";
	/** Bytes; null for a texture not fetched: skipped by the texture mode, still loading, or failed (see `warnings`). */
	readonly size: number | null;
}

export type MaterialKind = "preview" | "omnipbr" | "gltf-pbr" | "displayColor" | "fallback";

export interface LoadStats {
	readonly layers: number;
	readonly layerBytes: number;
	readonly missing: number;
	readonly rounds: number;
	readonly fetchMs: number;
	readonly parseMs: number;
	readonly composeMs: number;
	readonly initMs: number;
	readonly totalMs: number;
	readonly wasmMemoryBytes: number;
}

export interface LoadInfo {
	/** As authored, like Pixar's `UsdGeomGetStageUpAxis`: `Y` (default) or `Z`; anything else is drawn as `Y`. */
	readonly upAxis: string;
	readonly metersPerUnit: number;
	readonly meshes: number;
	readonly geometries: number;
	readonly triangles: number;
	readonly materials: number;
	readonly materialKinds: Readonly<Partial<Record<MaterialKind, number>>>;
	readonly stats: LoadStats;
	/** What could not be shown faithfully. Grows (texture failures) until `complete` settles. */
	readonly warnings: readonly LoadWarning[];
	readonly physics: UsdPhysics;
	readonly labels: readonly UsdLabel[];
	readonly variantSelections: readonly UsdVariantSelection[];
	/** The layers the stage read and the textures its materials reference; texture sizes fill in until `complete` settles. */
	readonly dependencies: readonly UsdDependency[];
}

export interface LoadResult {
	/** Y-up, in meters. */
	readonly root: THREE.Group;
	readonly info: LoadInfo;
	/** Settles when textures have streamed in; rejects with a UsdLoadError if the load is aborted, disposed or the worker dies. */
	readonly complete: Promise<{ textures: number; failed: number }>;
	/**
	 * Moves a joint to `value` (degrees for a revolute joint, meters for a prismatic one, clamped to its limits) and with it the meshes
	 * of its body1, the bodies fixed to it and everything further down the chain; mimic joints follow. Kinematic only: no collisions.
	 * Cheap enough for every frame of a drag. Only revolute and prismatic joints with a body1 can be posed: anything else, an unknown
	 * path or a value that is not a finite number throws. `viewer.load` results re-render by themselves; for `loadUsd`, render after.
	 */
	pose(joint: string, value: number): void;
	/** Puts every joint back where the authored poses have it. */
	resetPose(): void;
	/** Where every joint `pose` can move is now, by path (degrees or meters), mimic joints included. */
	getPose(): Record<string, number>;
	/** Frees geometries, materials and textures and stops any textures still streaming. */
	dispose(): void;
}

/** A `compose` error whose message starts with `scene too large to load` ran out of WebAssembly memory (4 GiB at most). */
export type UsdLoadErrorCode = "aborted" | "fetch" | "compose" | "worker" | "webgl";

export interface ViewerOptions {
	/** Canvas background. Default: transparent. */
	background?: THREE.ColorRepresentation | undefined;
	/** The WebGL context was lost: the stage is gone (its geometry lived only on the GPU) and any load in flight aborted. */
	onContextLost?: (() => void) | undefined;
	/** The context is back: `reload` loads the last model shown again, with the same options (null if none was shown). */
	onContextRestored?: ((reload: Promise<LoadResult> | null) => void) | undefined;
}

export interface ToBlobOptions {
	type?: "image/png" | "image/webp" | undefined;
	quality?: number | undefined;
	width?: number | undefined;
	height?: number | undefined;
}

export interface Viewer {
	readonly renderer: THREE.WebGLRenderer;
	readonly scene: THREE.Scene;
	readonly camera: THREE.PerspectiveCamera;
	readonly controls: OrbitControls;
	/** Loads a stage, replacing the current one once its geometry shows. A newer load aborts this one. */
	load(url: string, options?: LoadOptions): Promise<LoadResult>;
	/**
	 * Renders a fresh frame and encodes it, e.g. for a thumbnail: `type` `image/png` (default) or `image/webp` (PNG where the browser
	 * cannot encode WebP, as Safari), `quality` 0–1 for WebP, and an optional size in pixels (giving one keeps the aspect ratio;
	 * default: the canvas's). Rejects when the viewer is disposed or its WebGL context is lost.
	 */
	toBlob(options?: ToBlobOptions): Promise<Blob>;
	/** Removes and frees the current stage, and aborts any load in flight. */
	clear(): void;
	/** Points the camera at `object`, by default the current stage. */
	frame(object?: THREE.Object3D): void;
	requestRender(): void;
	/** Frees the renderer, the GPU context, the current stage and any load in flight, and removes the canvas. Safe to call twice. */
	dispose(): void;
}
