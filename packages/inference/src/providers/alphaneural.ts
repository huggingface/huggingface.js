/**
 * See the registered mapping of HF model ID => AlphaNeural model ID here:
 *
 * https://huggingface.co/api/partners/alphaneural/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at AlphaNeural and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to AlphaNeural, please open an issue on the present repo
 * and we will tag AlphaNeural team members.
 *
 * Thanks!
 */
import type { TextGenerationInput, TextGenerationOutput, TextGenerationOutputFinishReason } from "@huggingface/tasks";
import type { BodyParams } from "../types.js";
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";
import { omit } from "../utils/omit.js";
import { InferenceClientProviderOutputError } from "../errors.js";

const ALPHANEURAL_API_BASE_URL = "https://proxy.alfnrl.io";

interface AlphaneuralTextCompletionOutput {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		index: number;
	}>;
	model: string;
}

export class AlphaneuralConversationalTask extends BaseConversationalTask {
	constructor() {
		super("alphaneural", ALPHANEURAL_API_BASE_URL);
	}
}

export class AlphaneuralTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("alphaneural", ALPHANEURAL_API_BASE_URL);
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

	override async getResponse(response: AlphaneuralTextCompletionOutput): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			"choices" in response &&
			Array.isArray(response?.choices) &&
			response.choices.length > 0 &&
			typeof response.choices[0]?.text === "string"
		) {
			return {
				generated_text: response.choices[0].text,
			};
		}
		throw new InferenceClientProviderOutputError("Received malformed response from AlphaNeural text generation API");
	}
}
