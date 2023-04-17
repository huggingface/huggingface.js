import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type AudioClassificationArgs = BaseArgs & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AudioClassificationReturnValue {
	/**
	 * The label for the class (model specific)
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the audio file belongs to this class.
	 */
	score: number;
}

export type AudioClassificationReturn = AudioClassificationReturnValue[];

/**
 * This task reads some audio input and outputs the likelihood of classes.
 * Recommended model:  superb/hubert-large-superb-er
 */
export async function audioClassification(
	args: AudioClassificationArgs,
	options?: Options
): Promise<AudioClassificationReturn> {
	const res = await request<AudioClassificationReturn>(args, options);
	const isValidOutput =
		Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<label: string, score: number>");
	}
	return res;
}
