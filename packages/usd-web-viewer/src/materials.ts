// UsdPreviewSurface on three.js MeshStandardMaterial.
//
// Each textured input becomes the matching three.js map. UsdUVTexture can read
// any channel (`r`, `g`, `b`, `a`, `rgb`) and remaps it as `texel * scale + bias`;
// three.js maps read fixed channels with no remap, so the sampling line of the
// map's shader chunk is rewritten to the authored channel, scale and bias.
import * as THREE from "three";
import type { MaterialMeta, TextureRef, Vec3, Vec4 } from "./meta.js";

type MapName = "map" | "emissiveMap" | "roughnessMap" | "metalnessMap" | "aoMap" | "alphaMap" | "normalMap";

interface Slot {
	map: MapName;
	chunk: keyof typeof THREE.ShaderChunk;
	from: string;
	/** The rewritten line, given `e(base, size)`, the remapped texel as GLSL. */
	to: (e: (base: string, size: 1 | 3) => string) => string;
}

/** How a textured input samples its image. */
interface Patch {
	channel: string;
	scale: Vec4;
	bias: Vec4;
}

/** What a material keeps of its USD source, in `userData.usd`. */
interface UsdData {
	maps: MaterialMeta["maps"];
	colorPrimvar: string | undefined;
	/** UV set name to the three.js `channel` reading it. */
	uvChannels: Record<string, number>;
	color: Vec3;
}

/** A MeshStandardMaterial made here: its USD source and shader patches in `userData`. */
export type UsdMaterial = THREE.MeshStandardMaterial & { userData: { usd: UsdData; patches: Record<string, Patch> } };

// input -> three.js map and the shader chunk line to rewrite.
export const SLOTS: Record<string, Slot> = {
	diffuseColor: {
		map: "map",
		chunk: "map_fragment",
		from: "diffuseColor *= sampledDiffuseColor;",
		to: (e) => `diffuseColor.rgb *= ${e("sampledDiffuseColor", 3)};`,
	},
	emissiveColor: {
		map: "emissiveMap",
		chunk: "emissivemap_fragment",
		from: "totalEmissiveRadiance *= emissiveColor.rgb;",
		to: (e) => `totalEmissiveRadiance *= ${e("emissiveColor", 3)};`,
	},
	roughness: {
		map: "roughnessMap",
		chunk: "roughnessmap_fragment",
		from: "texelRoughness.g",
		to: (e) => e("texelRoughness", 1),
	},
	metallic: {
		map: "metalnessMap",
		chunk: "metalnessmap_fragment",
		from: "texelMetalness.b",
		to: (e) => e("texelMetalness", 1),
	},
	occlusion: {
		map: "aoMap",
		chunk: "aomap_fragment",
		from: "texture2D( aoMap, vAoMapUv ).r",
		to: (e) => e("texture2D( aoMap, vAoMapUv )", 1),
	},
	opacity: {
		map: "alphaMap",
		chunk: "alphamap_fragment",
		from: "texture2D( alphaMap, vAlphaMapUv ).g",
		to: (e) => e("texture2D( alphaMap, vAlphaMapUv )", 1),
	},
	normal: {
		map: "normalMap",
		chunk: "normal_fragment_maps",
		from: "texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0",
		to: (e) => e("texture2D( normalMap, vNormalMapUv )", 3),
	},
};

/** A material from the extracted parameters; maps attach later as textures arrive. */
export function createMaterial(m: MaterialMeta): UsdMaterial {
	const linear = (c: Vec3) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace);
	const material = new THREE.MeshStandardMaterial({
		color: linear(m.color),
		emissive: linear(m.emissive),
		roughness: m.roughness,
		metalness: m.metallic,
		opacity: m.opacity,
	});
	const textured = "opacity" in m.maps;
	if (m.opacityThreshold > 0 && (textured || m.opacity < 1)) {
		// A threshold makes opacity a cutout mask, drawn in the opaque pass.
		material.alphaTest = m.opacityThreshold;
	} else if (textured || m.opacity < 1) {
		material.transparent = true;
		material.depthWrite = false;
	}
	material.name = m.path;
	material.userData.usd = {
		maps: m.maps,
		colorPrimvar: m.colorPrimvar,
		uvChannels: Object.create(null),
		color: m.color,
	};
	// Until its base color texture streams in, a textured surface shows mid grey
	// (18%, the usual neutral) rather than the stark white texture multiplier.
	if (m.maps.diffuseColor) {
		material.color.setRGB(0.18, 0.18, 0.18, THREE.LinearSRGBColorSpace);
	}
	return prepare(material);
}

/** A copy that reads per-vertex colors, is double-sided, or reads UV sets from other attributes. */
export function variant(
	material: UsdMaterial,
	{
		doubleSided,
		vertexColors,
		uvChannels,
	}: { doubleSided: boolean; vertexColors: boolean; uvChannels: Record<string, number> },
): UsdMaterial {
	const copy = material.clone() as UsdMaterial;
	copy.userData.usd.uvChannels = uvChannels;
	if (doubleSided) {
		copy.side = THREE.DoubleSide;
	}
	if (vertexColors) {
		copy.vertexColors = true;
		copy.color.setRGB(1, 1, 1);
	}
	return prepare(copy);
}

/** Wires the shader rewrite; `userData.patches` grows as textured inputs attach. */
function prepare(material: THREE.MeshStandardMaterial): UsdMaterial {
	material.userData.patches = {};
	material.onBeforeCompile = (shader) => {
		for (const [input, ref] of Object.entries(material.userData.patches)) {
			const { chunk, from, to } = SLOTS[input];
			const code = THREE.ShaderChunk[chunk].replaceAll(
				from,
				to((base, size) => remap(base, size, ref as Patch)),
			);
			shader.fragmentShader = shader.fragmentShader.replace(`#include <${chunk}>`, code);
		}
	};
	material.customProgramCacheKey = () => JSON.stringify(material.userData.patches);
	return material as UsdMaterial;
}

/** `texel.<channel> * scale + bias` as GLSL, sized to the slot (1 or 3 components). */
function remap(base: string, size: 1 | 3, ref: Patch) {
	const f = (v: number) => v.toFixed(6);
	// The channel is an output name from the file: only r, g, b or a reach the shader.
	const channel = ["r", "g", "b", "a"].includes(ref.channel) ? ref.channel : "rgb";
	if (channel === "rgb") {
		const expr = `(${base}.rgb * vec3(${ref.scale.slice(0, 3).map(f)}) + vec3(${ref.bias.slice(0, 3).map(f)}))`;
		return size === 3 ? expr : `${expr}.r`;
	}
	const i = "rgba".indexOf(channel);
	const expr = `(${base}.${channel} * ${f(ref.scale[i])} + ${f(ref.bias[i])})`;
	return size === 3 ? `vec3${expr}` : expr;
}

/**
 * Attaches a decoded image to every input of `material` that samples `path`.
 * `isColor` says whether the image holds color (see `imageInfo`).
 * `textureFor(ref, colorSpace, uvChannel)` returns a configured three.js texture.
 */
export function attachTexture(
	material: UsdMaterial,
	path: string,
	isColor: boolean,
	textureFor: (ref: TextureRef, colorSpace: THREE.ColorSpace, uvChannel: number) => THREE.Texture,
): void {
	const usd = material.userData.usd;
	let changed = false;
	for (const [input, ref] of Object.entries(usd.maps)) {
		const slot = SLOTS[input];
		if (ref.path !== path || !slot) {
			continue;
		}
		const texture = textureFor(
			ref,
			colorSpace(ref, isColor),
			ref.uvSet !== undefined && Object.hasOwn(usd.uvChannels, ref.uvSet) ? usd.uvChannels[ref.uvSet] : 0,
		);
		material[slot.map] = texture;
		material.userData.patches[input] = { channel: ref.channel, scale: ref.scale, bias: ref.bias };
		// The texture now carries the value: the constant factor becomes neutral.
		if (input === "diffuseColor") {
			material.color.setRGB(...usd.color, THREE.LinearSRGBColorSpace);
		}
		if (input === "roughness") {
			material.roughness = 1;
		}
		if (input === "metallic") {
			material.metalness = 1;
		}
		if (input === "emissiveColor") {
			material.emissive.setRGB(1, 1, 1);
		}
		if (input === "opacity") {
			material.opacity = 1;
		}
		changed = true;
	}
	if (changed) {
		material.needsUpdate = true;
	}
}

/**
 * When an image cannot be read, each input it fed shows its own value (authored,
 * or the shader's default), as if it had no texture. The texture's `fallback`
 * is only for a texture node with no image at all (read when extracting).
 */
export function applyFallback(material: UsdMaterial, path: string): void {
	for (const [input, ref] of Object.entries(material.userData.usd.maps)) {
		if (ref.path !== path || !ref.value) {
			continue;
		}
		const [r, g, b] = ref.value;
		if (input === "diffuseColor") {
			material.color.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
		}
		if (input === "emissiveColor") {
			material.emissive.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
		}
		if (input === "roughness") {
			material.roughness = r;
		}
		if (input === "metallic") {
			material.metalness = r;
		}
		if (input === "opacity") {
			material.opacity = r;
		}
	}
}

/** `sourceColorSpace`: explicit `raw`/`sRGB` wins; `auto` follows the image, so every input sampling it agrees. */
function colorSpace(ref: TextureRef, isColor: boolean): THREE.ColorSpace {
	if (ref.colorSpace === "raw") {
		return THREE.NoColorSpace;
	}
	if (ref.colorSpace === "sRGB") {
		return THREE.SRGBColorSpace;
	}
	return isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
}

// UsdUVTexture wrap tokens; anything else (`repeat`, `useMetadata`) repeats. A
// Map, so tokens from the file never reach Object.prototype. `black` has no
// three.js equivalent (no border color); clamp is closest.
const WRAP = new Map<string, THREE.Wrapping>([
	["mirror", THREE.MirroredRepeatWrapping],
	["clamp", THREE.ClampToEdgeWrapping],
	["black", THREE.ClampToEdgeWrapping],
]);

/** A texture for `ref` sharing the decoded image of `base`: color space, wrap, UV set and UsdTransform2d. */
export function configureTexture(
	base: THREE.Texture,
	ref: TextureRef,
	colorSpaceValue: THREE.ColorSpace,
	uvChannel: number,
): THREE.Texture {
	const texture = base.clone();
	texture.colorSpace = colorSpaceValue;
	texture.channel = uvChannel;
	texture.wrapS = WRAP.get(ref.wrapS ?? "") ?? THREE.RepeatWrapping;
	texture.wrapT = WRAP.get(ref.wrapT ?? "") ?? THREE.RepeatWrapping;
	const [sx, sy] = ref.uvScale;
	const [tx, ty] = ref.uvTranslation;
	const angle = (ref.uvRotation * Math.PI) / 180;
	if (sx !== 1 || sy !== 1 || tx !== 0 || ty !== 0 || angle !== 0) {
		// UsdTransform2d: st' = rotate(st * scale) + translation (counterclockwise degrees).
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		texture.matrixAutoUpdate = false;
		texture.matrix.set(c * sx, -s * sy, tx, s * sx, c * sy, ty, 0, 0, 1);
	}
	texture.needsUpdate = true;
	return texture;
}
