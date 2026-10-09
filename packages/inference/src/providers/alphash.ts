/**
 * See the registered mapping of HF model ID => Alpha.sh model ID here:
 *
 * https://huggingface.co/api/partners/alphash/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Alpha.sh and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Alpha.sh, please open an issue on the present repo
 * and we will tag Alpha.sh team members.
 *
 * Thanks!
 */

import { BaseConversationalTask } from "./providerHelper.js";

/**
 * Alpha.sh serves open-weight models on an OpenAI-compatible API at https://alpha.sh/v1. Model ids on the
 * Hub and on Alpha.sh are the same strings (the Hugging Face repository id), so the base conversational
 * helper applies unchanged: route `v1/chat/completions`, bearer authorization, the OpenAI body as given.
 */
export class AlphaConversationalTask extends BaseConversationalTask {
	constructor() {
		super("alphash", "https://alpha.sh");
	}
}
