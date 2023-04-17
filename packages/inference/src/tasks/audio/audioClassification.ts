import type { AudioClassificationArgs, AudioClassificationReturn, Options } from "../../types";
import { request } from "../custom/request";

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
