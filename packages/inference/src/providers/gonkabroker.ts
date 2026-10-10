/**
 * See the registered mapping of HF model ID => GonkaBroker model ID here:
 *
 * https://huggingface.co/api/partners/gonkabroker/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_INFERENCE_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at GonkaBroker and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to GonkaBroker, please open an issue on the present repo
 * and we will tag GonkaBroker team members.
 *
 * Thanks!
 */

import type {
	ChatCompletionOutput,
	TextGenerationInput,
	TextGenerationOutput,
	TextGenerationOutputFinishReason,
} from "@huggingface/tasks";
import type { BodyParams } from "../types.js";
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";
import { omit } from "../utils/omit.js";
import { InferenceClientProviderOutputError } from "../errors.js";

interface GonkaBrokerTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		seed: number;
		logprobs: unknown;
		index: number;
	}>;
}

const GONKABROKER_API_BASE_URL = "https://proxy.gonkabroker.com";

export class GonkaBrokerConversationalTask extends BaseConversationalTask {
	constructor() {
		super("gonkabroker", GONKABROKER_API_BASE_URL);
	}
}

export class GonkaBrokerTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("gonkabroker", GONKABROKER_API_BASE_URL);
	}

	override preparePayload(params: BodyParams<TextGenerationInput>): Record<string, unknown> {
		return {
			model: params.model,
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters
				? {
						max_tokens: params.args.parameters.max_new_tokens,
						...omit(params.args.parameters, "max_new_tokens"),
					}
				: undefined),
			prompt: params.args.inputs,
		};
	}

	override async getResponse(response: GonkaBrokerTextCompletionOutput): Promise<TextGenerationOutput> {
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
		throw new InferenceClientProviderOutputError("Received malformed response from GonkaBroker text generation API");
	}
}
