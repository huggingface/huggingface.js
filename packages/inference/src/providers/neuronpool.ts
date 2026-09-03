import { BaseConversationalTask } from "./providerHelper.js";

/**
 * See the registered mapping of HF model ID => NeuronPool catalog id here:
 *
 * https://huggingface.co/api/partners/neuronpool/models
 *
 * If you want to try to run inference for a new model locally before it's registered
 * on huggingface.co, add it to HARDCODED_MODEL_INFERENCE_MAPPING in consts.ts.
 *
 * - If you work at NeuronPool and want to update this mapping, use the model
 *   mapping API on huggingface.co (POST /api/partners/neuronpool/models).
 * - If you're a community member and want to add a new supported HF model,
 *   open an issue on huggingface.js and tag the NeuronPool team.
 */
const NEURONPOOL_API_BASE_URL = "https://api.neuronpool.dev";

export class NeuronpoolConversationalTask extends BaseConversationalTask {
	constructor() {
		super("neuronpool", NEURONPOOL_API_BASE_URL);
	}
}
