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
}
