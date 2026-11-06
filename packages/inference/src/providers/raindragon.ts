/**
 * See the registered mapping of HF model ID => RainDragon model ID here:
 *
 * https://huggingface.co/api/partners/raindragon/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at RainDragon and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to RainDragon, please open an issue on the present repo
 * and we will tag RainDragon team members.
 *
 * Thanks!
 */
import { BaseConversationalTask } from "./providerHelper.js";

const RAINDRAGON_API_BASE_URL = "https://inference.raindragon.ai";

export class RaindragonConversationalTask extends BaseConversationalTask {
	constructor() {
		super("raindragon", RAINDRAGON_API_BASE_URL);
	}
}
