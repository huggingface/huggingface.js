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

import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";

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
}
