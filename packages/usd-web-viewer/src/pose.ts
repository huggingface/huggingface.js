import * as THREE from "three";
import type { LoadResult, UsdJoint, UsdRigidBody } from "./types.js";

/** A drawn copy of a mesh: a `THREE.Mesh`, or one instance of a `THREE.InstancedMesh`. */
interface Target {
	mesh: THREE.Mesh;
	index: number | null;
	rest: THREE.Matrix4;
}

const AXES = { X: new THREE.Vector3(1, 0, 0), Y: new THREE.Vector3(0, 1, 0), Z: new THREE.Vector3(0, 0, 1) };

/**
 * Poses the bodies joints connect, kinematically. A joint at `value` moves its body1, relative to its body0, by the joint's motion
 * from where the authored poses have it (`rest`) about or along its frame's axis; the bodies past it in the chain move with it.
 * Meshes keep their authored matrices as the rest pose. Joints and values are in public units (degrees, meters).
 */
export function createPoser(
	root: THREE.Group,
	joints: readonly UsdJoint[],
	bodies: readonly UsdRigidBody[],
	metersPerUnit: number,
): Pick<LoadResult, "pose" | "resetPose" | "getPose"> {
	const values = new Map<string, number>();
	let state: ReturnType<typeof prepare> | null = null;

	// Built on first use, once every mesh has streamed in.
	function prepare() {
		const bodyPaths = bodies.map((b) => b.path).sort((a, b) => b.length - a.length);
		const ownerOf = (path: string) => bodyPaths.find((b) => path === b || path.startsWith(b + "/"));
		const targets = new Map<string, Target[]>();
		const add = (path: string, target: Target) => {
			const body = ownerOf(path);
			if (body) {
				targets.set(body, [...(targets.get(body) ?? []), target]);
			}
		};
		const matrix = new THREE.Matrix4();
		for (const child of root.children) {
			if (child instanceof THREE.InstancedMesh) {
				(child.userData.paths as string[]).forEach((path, index) => {
					child.getMatrixAt(index, matrix);
					add(path, { mesh: child, index, rest: matrix.clone() });
				});
			} else if (child instanceof THREE.Mesh) {
				add(child.name, { mesh: child, index: null, rest: child.matrix.clone() });
			}
		}
		// Joints that move a body, by the body they hang from; the world is "".
		const children = new Map<string, { joint: UsdJoint; body: string; frame: THREE.Matrix4 }[]>();
		const moved = new Set<string>();
		for (const joint of joints) {
			if (!joint.body1 || !["revolute", "prismatic", "fixed"].includes(joint.kind)) {
				continue;
			}
			const parent = joint.body0 ?? "";
			const edge = { joint, body: joint.body1, frame: new THREE.Matrix4().fromArray(joint.frame) };
			children.set(parent, [...(children.get(parent) ?? []), edge]);
			moved.add(joint.body1);
		}
		// The walk starts from whatever no joint moves: the world, static bodies,
		// and prims a joint hangs from that are not rigid bodies.
		const roots = [...new Set(["", ...bodies.map((b) => b.path), ...children.keys()])].filter((b) => !moved.has(b));
		return { targets, children, roots };
	}

	const motion = new THREE.Matrix4();
	const inverse = new THREE.Matrix4();
	function jointMotion(joint: UsdJoint, out: THREE.Matrix4) {
		out.identity();
		if (joint.kind !== "revolute" && joint.kind !== "prismatic") {
			return out;
		}
		const delta = (values.get(joint.path) ?? joint.rest) - joint.rest;
		if (joint.kind === "revolute") {
			return out.makeRotationAxis(AXES[joint.axis], THREE.MathUtils.degToRad(delta));
		}
		const along = AXES[joint.axis].clone().multiplyScalar(delta / (metersPerUnit || 1));
		return out.makeTranslation(along.x, along.y, along.z);
	}

	function apply() {
		state ??= prepare();
		const { targets, children, roots } = state;
		// Each body's move from its rest pose: its parent's, then the joint's
		// motion about the joint frame (frame · motion · frame⁻¹).
		const deltas = new Map<string, THREE.Matrix4>();
		const queue = roots.map((body) => ({ body, delta: new THREE.Matrix4() }));
		for (let next = queue.shift(); next; next = queue.shift()) {
			const { body, delta } = next;
			if (deltas.has(body)) {
				continue; // A loop closure: the first path to a body wins.
			}
			deltas.set(body, delta);
			for (const edge of children.get(body) ?? []) {
				queue.push({
					body: edge.body,
					delta: delta
						.clone()
						.multiply(edge.frame)
						.multiply(jointMotion(edge.joint, motion))
						.multiply(inverse.copy(edge.frame).invert()),
				});
			}
		}
		const touched = new Set<THREE.Mesh>();
		const placed = new THREE.Matrix4();
		for (const [body, list] of targets) {
			const delta = deltas.get(body);
			if (!delta) {
				continue;
			}
			for (const { mesh, index, rest } of list) {
				placed.multiplyMatrices(delta, rest);
				if (index === null) {
					mesh.matrix.copy(placed);
					mesh.matrixWorldNeedsUpdate = true;
				} else {
					(mesh as THREE.InstancedMesh).setMatrixAt(index, placed);
					touched.add(mesh);
				}
			}
		}
		for (const mesh of touched as Set<THREE.InstancedMesh>) {
			mesh.instanceMatrix.needsUpdate = true;
			// Recomputed when next culled, around where the instances are now.
			mesh.boundingSphere = null;
			mesh.boundingBox = null;
		}
	}

	return {
		pose(path: string, value: number) {
			const joint = joints.find((j) => j.path === path);
			if (!joint) {
				throw new Error(`no joint at ${path}`);
			}
			if (joint.kind !== "revolute" && joint.kind !== "prismatic") {
				return;
			}
			const clamp = (j: UsdJoint, v: number) =>
				j.kind === "revolute" || j.kind === "prismatic"
					? Math.min(j.upper ?? Infinity, Math.max(j.lower ?? -Infinity, v))
					: v;
			const v = clamp(joint, value);
			values.set(path, v);
			for (const follower of joints) {
				if (follower.mimic?.reference === path) {
					values.set(follower.path, clamp(follower, -(follower.mimic.gearing * v + follower.mimic.offset)));
				}
			}
			apply();
		},
		getPose() {
			return Object.fromEntries(
				joints
					.filter((j) => j.kind === "revolute" || j.kind === "prismatic")
					.map((j) => [j.path, values.get(j.path) ?? j.rest]),
			);
		},
		resetPose() {
			values.clear();
			if (state) {
				apply();
			}
		},
	};
}
