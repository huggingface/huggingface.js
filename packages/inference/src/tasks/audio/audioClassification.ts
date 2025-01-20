import type { AudioClassificationInput, AudioClassificationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import { omit } from "../../utils/omit";

export type AudioClassificationArgs = BaseArgs & AudioClassificationInput;

/**
 * This task reads some audio input and outputs the likelihood of classes.
 * Recommended model:  superb/hubert-large-superb-er
 */
export async function audioClassification(
	args: AudioClassificationArgs,
	options?: Options
): Promise<AudioClassificationOutput> {
	const payload = {
		...omit(args, "inputs"),
		data: args.inputs,
	}
	const res = await request<AudioClassificationOutput>(payload, {
		...options,
		taskHint: "audio-classification",
	});
	const isValidOutput =
		Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
	}
	return res;
}
