/**
 * See the registered mapping of HF model ID => Berget model ID here:
 *
 * https://huggingface.co/api/partners/berget/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_INFERENCE_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Berget and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Berget, please open an issue on the present repo
 * and we will tag Berget team members.
 *
 * Thanks!
 */

import { BaseConversationalTask } from "./providerHelper.js";

export class BergetConversationalTask extends BaseConversationalTask {
	constructor() {
		super("berget", "https://api.berget.ai");
	}
}
