// Lets the viewer show meshes as they stream in, before the load resolves.
// Internal: not exported.
import type * as THREE from "three";
import type { SceneMeta } from "./meta.js";
import type { LoadOptions } from "./types.js";

export const SHOW: unique symbol = Symbol("show");

export type InternalOptions = LoadOptions & { [SHOW]?: (root: THREE.Group, meta: SceneMeta) => void };
