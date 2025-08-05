import {
	BaseConversationalTask,
	BaseTextGenerationTask,
	TaskProviderHelper,
	type TextToImageTaskHelper,
} from "./providerHelper.js";

/**
 * See the registered mapping of HF model ID => Swarmind model ID here:
 *
 * https://huggingface.co/api/partners/swarmind/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Swarmind and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Swarmind, please open an issue on the present repo
 * and we will tag Swarmind team members.
 *
 * Thanks!
 */

const SWARMIND_API_BASE_URL = "https://api.swarmind.ai/lai/private";

export class SwarmindTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("swarmind", SWARMIND_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/v1/chat/completions";
	}
}

export class SwarmindConversationalTask extends BaseConversationalTask {
	constructor() {
		super("swarmind", SWARMIND_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/v1/chat/completions";
	}
}
