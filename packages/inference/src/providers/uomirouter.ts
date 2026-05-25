/**
 * See the registered mapping of HF model ID => UomiRouter model ID here:
 *
 * https://huggingface.co/api/partners/uomirouter/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at UomiRouter and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to UomiRouter, please open an issue on the present repo
 *   and we will tag UomiRouter team members.
 *
 * Thanks!
 *
 * Notes on UomiRouter:
 * - Gateway is OpenAI-compatible at /v1/chat/completions (streaming, tool calling, structured output).
 * - Auth: `Authorization: Bearer sk-uomi-...` user-provided keys — handled by BaseConversationalTask.
 * - Inference is dispatched across a distributed pool of operator-run GPU nodes; each response
 *   carries an `Inference-Id: <uuid>` header for verifiable response attestation (off-chain today, on-chain anchoring on UOMI L1 is the next milestone).
 * - No payload shape divergence from the OpenAI spec, so no preparePayload/getResponse override
 *   is needed — the BaseConversationalTask defaults cover the full request/response path.
 */

import { BaseConversationalTask } from "./providerHelper.js";

export class UomiRouterConversationalTask extends BaseConversationalTask {
	constructor() {
		super("uomirouter", "https://gateway.uomi.ai");
	}
}
