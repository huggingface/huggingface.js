import { validateOutput, z } from "../../lib/validateOutput";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type AudioClassificationArgs = BaseArgs & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AudioClassificationOutputValue {
	/**
	 * The label for the class (model specific)
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the audio file belongs to this class.
	 */
	score: number;
}

export type AudioClassificationReturn = AudioClassificationOutputValue[];

/**
 * This task reads some audio input and outputs the likelihood of classes.
 * Recommended model:  superb/hubert-large-superb-er
 */
export async function audioClassification(
	args: AudioClassificationArgs,
	options?: Options
): Promise<AudioClassificationReturn> {
	const res = await request<AudioClassificationReturn>(args, {
		...options,
		taskHint: "audio-classification",
	});
	return validateOutput(res, z.array(z.object({ label: z.string(), score: z.number() })));
}
