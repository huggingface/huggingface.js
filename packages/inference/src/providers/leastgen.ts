/**
 * See the registered mapping of HF model ID => LeastGen model ID here:
 *
 * https://huggingface.co/api/partners/leastgen/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at LeastGen and want to update this mapping, please use the model mapping API
 *   we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to LeastGen,
 *   please open an issue on the present repo and we will tag LeastGen team members.
 *
 * Thanks!
 */

import type { BodyParams } from "../types.js";
import { omit } from "../utils/omit.js";
import { BaseConversationalTask } from "./providerHelper.js";

const LEASTGEN_API_BASE_URL = "https://api.leastgen.com";

export class LeastGenConversationalTask extends BaseConversationalTask {
	constructor() {
		super("leastgen", LEASTGEN_API_BASE_URL);
	}

	override makeRoute(): string {
		return "v1/chat/completions";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		return omit(super.preparePayload(params), "store");
	}
}
