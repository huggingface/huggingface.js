/**
 * See the registered mapping of HF model ID => Aiqre model ID here:
 *
 * https://huggingface.co/api/partners/aiqre/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Aiqre and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Aiqre, please open an issue on the present repo
 * and we will tag Aiqre team members.
 *
 * Thanks!
 */

import { BaseConversationalTask } from "./providerHelper.js";

const AIQRE_API_BASE_URL = "https://api.aiqre.com";

export class AiqreConversationalTask extends BaseConversationalTask {
	constructor() {
		super("aiqre", AIQRE_API_BASE_URL);
	}
}
