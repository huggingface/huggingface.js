import { InferenceClientInputError } from "../errors.js";
import { dataUrlFromBlob } from "../utils/dataUrlFromBlob.js";
import { toArray } from "../utils/toArray.js";

/**
 * `image-text-to-video` carries optional reference images, videos and audio clips alongside its
 * prompt, each addressed from the prompt by its position ("Image 1", "Video 1", "Audio 1").
 *
 * Providers agree on the concept and on nothing else: fal wants `reference_image_urls`, wavespeed
 * `reference_images`, replicate `reference_image_urls` beside a separate `first_frame_image`, and
 * each bounds the lists differently. A provider declares those differences as a
 * {@link ReferenceInputsSpec} and calls {@link buildReferenceInputs}; the reading, validating and
 * inlining is the same everywhere.
 */
export const REFERENCE_MODALITIES = ["images", "videos", "audio"] as const;

export type ReferenceModality = (typeof REFERENCE_MODALITIES)[number];

/** A URL, a data URL, or the bytes themselves. */
export type ReferenceValue = string | Blob | ArrayBuffer;

/** The task parameter each modality arrives in. */
const TASK_FIELDS: Record<ReferenceModality, string> = {
	images: "reference_images",
	videos: "reference_videos",
	audio: "reference_audio",
};

/** Assumed content type when binary arrives without one. */
const FALLBACK_MIME_TYPES: Record<ReferenceModality, string> = {
	images: "image/png",
	videos: "video/mp4",
	audio: "audio/mpeg",
};

export interface ReferenceInputsSpec {
	/** Payload field carrying each modality. */
	fields: Record<ReferenceModality, string>;
	/** Most entries this provider accepts per modality. */
	maxItems?: Partial<Record<ReferenceModality, number>>;
	/** Most entries this provider accepts across all modalities combined. */
	maxTotal?: number;
	/** Reject a call whose only references are audio. */
	rejectAudioAlone?: boolean;
	/** Inline one binary reference. Defaults to a data URL carrying the blob's own content type. */
	encode?: (blob: Blob, modality: ReferenceModality) => Promise<string>;
}

export interface ReferenceInputs {
	/** Non-empty lists only, under the provider's own field names. */
	payload: Record<string, string[]>;
	/** How many entries each modality carried, before naming. */
	counts: Record<ReferenceModality, number>;
	/** Entries across every modality. */
	total: number;
}

function asList(value: unknown): ReferenceValue[] {
	return value === undefined || value === null ? [] : toArray(value as ReferenceValue | ReferenceValue[]);
}

async function inline(value: ReferenceValue, modality: ReferenceModality, spec: ReferenceInputsSpec): Promise<string> {
	if (typeof value === "string") {
		return value;
	}
	const fallback = FALLBACK_MIME_TYPES[modality];
	const blob = value instanceof Blob ? value : new Blob([value], { type: fallback });
	return spec.encode ? spec.encode(blob, modality) : dataUrlFromBlob(blob, blob.type || fallback);
}

/**
 * Reads the task's reference parameters, checks them against what the provider accepts, and returns
 * them inlined under the provider's field names.
 *
 * @param leadingImage prepended to the images list — for providers whose primary image is simply the
 * first subject reference, rather than a separate first-frame field.
 */
export async function buildReferenceInputs(options: {
	provider: string;
	parameters: Record<string, unknown> | undefined;
	spec: ReferenceInputsSpec;
	leadingImage?: ReferenceValue;
}): Promise<ReferenceInputs> {
	const { provider, parameters, spec, leadingImage } = options;

	const supplied = Object.fromEntries(
		REFERENCE_MODALITIES.map((modality) => [
			modality,
			[
				...(modality === "images" && leadingImage !== undefined ? [leadingImage] : []),
				...asList(parameters?.[TASK_FIELDS[modality]]),
			],
		]),
	) as Record<ReferenceModality, ReferenceValue[]>;

	const counts = Object.fromEntries(
		REFERENCE_MODALITIES.map((modality) => [modality, supplied[modality].length]),
	) as Record<ReferenceModality, number>;
	const total = REFERENCE_MODALITIES.reduce((sum, modality) => sum + counts[modality], 0);

	for (const modality of REFERENCE_MODALITIES) {
		const max = spec.maxItems?.[modality];
		if (max !== undefined && counts[modality] > max) {
			throw new InferenceClientInputError(
				`Provider ${provider} accepts at most ${max} entries in ${TASK_FIELDS[modality]}, got ${counts[modality]}.`,
			);
		}
	}
	if (spec.maxTotal !== undefined && total > spec.maxTotal) {
		throw new InferenceClientInputError(
			`Provider ${provider} accepts at most ${spec.maxTotal} reference files in total, got ${total}.`,
		);
	}
	if (spec.rejectAudioAlone && counts.audio > 0 && counts.images + counts.videos === 0) {
		throw new InferenceClientInputError(
			`Provider ${provider} does not accept reference audio on its own — pass at least one reference image or video with it.`,
		);
	}

	const payload: Record<string, string[]> = {};
	for (const modality of REFERENCE_MODALITIES) {
		if (counts[modality]) {
			payload[spec.fields[modality]] = await Promise.all(
				supplied[modality].map((value) => inline(value, modality, spec)),
			);
		}
	}
	return { payload, counts, total };
}

/** The task parameters consumed by {@link buildReferenceInputs}, for callers stripping them. */
export const REFERENCE_PARAMETERS = Object.values(TASK_FIELDS);
