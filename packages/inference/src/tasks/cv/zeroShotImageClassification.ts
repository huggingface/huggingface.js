import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";

export type ZeroShotImageClassificationArgs = BaseArgs & {
	inputs: {
		/**
		 * Binary image data
		 */
		image: Blob | ArrayBuffer;
	};
	parameters: {
		/**
		 * A list of strings that are potential classes for inputs. (max 10)
		 */
		candidate_labels: string[];
	};
};

export interface ZeroShotImageClassificationOutputValue {
	label: string;
	score: number;
}

export type ZeroShotImageClassificationOutput = ZeroShotImageClassificationOutputValue[];

/**
 * Classify an image to specified classes.
 * Recommended model: openai/clip-vit-large-patch14-336
 */
export async function zeroShotImageClassification(
	args: ZeroShotImageClassificationArgs,
	options?: Options
): Promise<ZeroShotImageClassificationOutput> {
	const reqArgs: RequestArgs = {
		...args,
		inputs: {
			image: base64FromBytes(
				new Uint8Array(
					args.inputs.image instanceof ArrayBuffer ? args.inputs.image : await args.inputs.image.arrayBuffer()
				)
			),
		},
	} as RequestArgs;

	const res = await request<ZeroShotImageClassificationOutput>(reqArgs, {
		...options,
		taskHint: "zero-shot-image-classification",
	});
	const isValidOutput =
		Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
	}
	return res;
}
