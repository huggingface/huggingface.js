/**
 * See the registered mapping of HF model ID => Baseten model ID here:
 *
 * https://huggingface.co/api/partners/baseten/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Baseten and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Baseten, please open an issue on the present repo
 * and we will tag Baseten team members.
 *
 * Thanks!
 */
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
} from "./providerHelper.js";

const BASETEN_API_BASE_URL = "https://inference.baseten.co";

export class BasetenConversationalTask extends BaseConversationalTask {
	constructor() {
		super("baseten", BASETEN_API_BASE_URL);
	}

	override makeRoute(): string {
		return "v1/chat/completions";
	}
}
