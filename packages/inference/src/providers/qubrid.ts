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

/**
 * See the registered mapping of HF model ID => Qubrid model ID here:
 *
 * https://huggingface.co/api/partners/qubrid/models
 *
 * This is a publicly available mapping once the provider is registered on the Hub.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_INFERENCE_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Qubrid and want to update this mapping, please use the model mapping API on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Qubrid, please open an issue on the present repo
 * and we will tag Qubrid team members.
 *
 * Partner channel (HF-routed traffic), not the direct Qubrid /v1 API.
 * Override for staging: QUBRID_HF_CHANNEL_BASE_URL
 */

interface QubridTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		seed: number;
		logprobs: unknown;
		index: number;
	}>;
}

const QUBRID_HF_CHANNEL_BASE_URL =
	(typeof process !== "undefined" && process.env?.QUBRID_HF_CHANNEL_BASE_URL) ||
	"https://platform.qubrid.com/partners/huggingface";
// Dev/staging override example:
// QUBRID_HF_CHANNEL_BASE_URL=https://backend.dev.platform.qubrid.com/partners/huggingface

export class QubridConversationalTask extends BaseConversationalTask {
	constructor() {
		super("qubrid", QUBRID_HF_CHANNEL_BASE_URL);
	}
}

export class QubridTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("qubrid", QUBRID_HF_CHANNEL_BASE_URL);
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

	override async getResponse(response: QubridTextCompletionOutput): Promise<TextGenerationOutput> {
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
		throw new InferenceClientProviderOutputError("Received malformed response from Qubrid text generation API");
	}
}
