/**
 * See the registered mapping of HF model ID => OVHcloud model ID here:
 *
 * https://huggingface.co/api/partners/ovhcloud/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at OVHcloud and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to OVHcloud, please open an issue on the present repo
 * and we will tag OVHcloud team members.
 *
 * Thanks!
 */

import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper";
import type { ChatCompletionOutput, TextGenerationOutput, TextGenerationOutputFinishReason } from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams } from "../types";
import { omit } from "../utils/omit";
import type { TextGenerationInput } from "@huggingface/tasks";

const OVHCLOUD_API_BASE_URL = "https://oai.endpoints.kepler.ai.cloud.ovh.net";

interface OvhCloudTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		logprobs: unknown;
		index: number;
	}>;
}

export class OvhCloudConversationalTask extends BaseConversationalTask {
	constructor() {
		super("ovhcloud", OVHCLOUD_API_BASE_URL);
	}
}

export class OvhCloudTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("ovhcloud", OVHCLOUD_API_BASE_URL);
	}

	override preparePayload(params: BodyParams<TextGenerationInput>): Record<string, unknown> {
		return {
			model: params.model,
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters
				? {
						max_tokens: (params.args.parameters as Record<string, unknown>).max_new_tokens,
						...omit(params.args.parameters as Record<string, unknown>, "max_new_tokens"),
				  }
				: undefined),
			prompt: params.args.inputs,
		};
	}

	override async getResponse(response: OvhCloudTextCompletionOutput): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			"choices" in response &&
			Array.isArray(response?.choices) &&
			typeof response?.model === "string"
		) {
			const completion = response.choices[0];
			return {
				generated_text: completion.text,
			};
		}
		throw new InferenceOutputError("Expected OVHcloud text generation response format");
	}
}
