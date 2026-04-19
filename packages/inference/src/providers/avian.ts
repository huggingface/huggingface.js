/**
 * See the registered mapping of HF model ID => Avian model ID here:
 *
 * https://huggingface.co/api/partners/avian/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Avian and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Avian, please open an issue on the present repo
 * and we will tag Avian team members.
 *
 * Thanks!
 */

import { BaseConversationalTask } from "./providerHelper.js";

export class AvianConversationalTask extends BaseConversationalTask {
	constructor() {
		super("avian", "https://api.avian.io/v1");
	}

	override makeRoute(): string {
		return "/chat/completions";
	}
}
