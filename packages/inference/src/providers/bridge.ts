/**
 * See the registered mapping of HF model ID => Bridge model ID here:
 *
 * https://huggingface.co/api/partners/bridge/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's
 * registered on huggingface.co, you can add it to
 * "HARDCODED_MODEL_INFERENCE_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Bridge and want to update this mapping, please use the
 *   model mapping API provided on huggingface.co.
 * - If you're a community member and want to add a new supported HF model
 *   to Bridge, please open an issue on this repository.
 */

import { BaseConversationalTask } from "./providerHelper.js";

export class BridgeConversationalTask extends BaseConversationalTask {
	constructor() {
		super("bridge", "https://hf.38.60.227.125.sslip.io");
	}
}
