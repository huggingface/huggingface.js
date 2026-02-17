/**
 * See the registered mapping of HF model ID => Latitude model ID here:
 *
 * https://huggingface.co/api/partners/latitude-sh/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Latitude and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Latitude, please open an issue on the present repo
 * and we will tag Latitude team members.
 *
 * Thanks!
 */

import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";

export class LatitudeConversationalTask extends BaseConversationalTask {
	constructor() {
		super("latitude-sh", "https://api.lsh.ai");
	}
}

export class LatitudeTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("latitude-sh", "https://api.lsh.ai");
	}
}
