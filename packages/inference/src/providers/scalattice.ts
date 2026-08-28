/**
 * See the registered mapping of HF model ID => Scalattice model ID here:
 *
 * https://huggingface.co/api/partners/scalattice/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Scalattice and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Scalattice, please open an issue on the present repo
 * and we will tag Scalattice team members.
 *
 * Thanks!
 */
import { BaseConversationalTask } from "./providerHelper.js";

const SCALATTICE_API_BASE_URL = "https://api.scalattice.cloud";

export class ScalatticeConversationalTask extends BaseConversationalTask {
	constructor() {
		super("scalattice", SCALATTICE_API_BASE_URL);
	}
}
