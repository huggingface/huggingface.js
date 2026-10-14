/**
 * See the registered mapping of HF model ID => Systalyze model ID here:
 *
 * https://huggingface.co/api/partners/systalyze/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Systalyze and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Systalyze, please open an issue on the present repo
 * and we will tag Systalyze team members.
 *
 * Thanks!
 */

import type { TextGenerationInput, TextGenerationOutput } from "@huggingface/tasks";
import { InferenceClientProviderOutputError } from "../errors.js";
import type { BaseArgs, BodyParams } from "../types.js";
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";

const SYSTALYZE_API_BASE_URL = "https://api.systalyze.com";

export class SystalyzeConversationalTask extends BaseConversationalTask {
	constructor() {
		super("systalyze", SYSTALYZE_API_BASE_URL);
	}
}

export class SystalyzeTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("systalyze", SYSTALYZE_API_BASE_URL);
	}

	override preparePayload(params: BodyParams<TextGenerationInput & BaseArgs>): Record<string, unknown> {
		const { inputs, parameters, ...rest } = params.args;
		return {
			...rest,
			model: params.model,
			prompt: inputs,
			...(parameters?.max_new_tokens !== undefined && { max_tokens: parameters.max_new_tokens }),
			...(parameters?.temperature !== undefined && { temperature: parameters.temperature }),
			...(parameters?.top_p !== undefined && { top_p: parameters.top_p }),
			...(parameters?.repetition_penalty !== undefined && { repetition_penalty: parameters.repetition_penalty }),
			...(parameters?.stop !== undefined && { stop: parameters.stop }),
		};
	}

	override async getResponse(response: unknown): Promise<TextGenerationOutput> {
		const r = response as { choices?: Array<{ text?: string }> };
		if (typeof r?.choices?.[0]?.text === "string") {
			return { generated_text: r.choices[0].text };
		}
		throw new InferenceClientProviderOutputError("Malformed response from Systalyze completions API");
	}
}
