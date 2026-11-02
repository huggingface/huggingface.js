import * as THREE from "three";
import type { BodyMeta, JointEndMeta, JointMeta } from "./meta.js";

const AXES = { X: new THREE.Vector3(1, 0, 0), Y: new THREE.Vector3(0, 1, 0), Z: new THREE.Vector3(0, 0, 1) };
const ONE = new THREE.Vector3(1, 1, 1);

export interface Articulation {
	/** Joint positions, by joint: degrees or stage units. */
	readonly positions: Map<JointMeta, number>;
	/** Each body's motion from its authored pose. */
	pose(): THREE.Matrix4[];
}

/**
 * Poses rigid bodies from joint positions, in stage space like instance matrices. A body hangs from the first joint
 * naming it `body1`: body1 = body0 · frame0 · motion · frame1⁻¹, each frame relative to its body (or the world).
 * Bodies no joint holds stay as authored, and a joint that would close a loop is left out.
 */
export function createArticulation(bodies: BodyMeta[], joints: JointMeta[]): Articulation {
	const rest = bodies.map((b) => new THREE.Matrix4().fromArray(b.matrix));
	const restInverse = rest.map((m) => m.clone().invert());
	const frame = (end: JointEndMeta) => {
		const local = new THREE.Matrix4().compose(
			new THREE.Vector3(...end.position),
			new THREE.Quaternion(...end.rotation),
			ONE,
		);
		const world = new THREE.Matrix4().fromArray(end.target).multiply(local);
		return end.body === undefined ? world : restInverse[end.body].clone().multiply(world);
	};
	const parentOf = new Map<number, { joint: JointMeta; frame0: THREE.Matrix4; frame1Inverse: THREE.Matrix4 }>();
	for (const joint of joints) {
		const child = joint.body1.body;
		if (child !== undefined && child !== joint.body0.body && !parentOf.has(child)) {
			parentOf.set(child, { joint, frame0: frame(joint.body0), frame1Inverse: frame(joint.body1).invert() });
		}
	}
	const motion = (joint: JointMeta, value: number) => {
		const axis = AXES[joint.axis ?? "X"];
		switch (joint.type) {
			case "revolute":
				return new THREE.Matrix4().makeRotationAxis(axis, THREE.MathUtils.degToRad(value));
			case "prismatic":
				return new THREE.Matrix4().makeTranslation(axis.clone().multiplyScalar(value));
			default:
				return new THREE.Matrix4();
		}
	};

	const positions = new Map<JointMeta, number>();
	const pose = () => {
		const world: THREE.Matrix4[] = [];
		const placing = new Set<number>();
		const place = (body: number): THREE.Matrix4 => {
			const parent = parentOf.get(body);
			if (world[body] || !parent || placing.has(body)) {
				return world[body] ?? rest[body];
			}
			placing.add(body);
			const from = parent.joint.body0.body === undefined ? new THREE.Matrix4() : place(parent.joint.body0.body);
			world[body] = from
				.clone()
				.multiply(parent.frame0)
				.multiply(motion(parent.joint, positions.get(parent.joint) ?? 0))
				.multiply(parent.frame1Inverse);
			placing.delete(body);
			return world[body];
		};
		return rest.map((_, body) => place(body).clone().multiply(restInverse[body]));
	};
	return { positions, pose };
}
