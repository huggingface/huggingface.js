/**
 * See the registered mapping of HF model ID => ZenMux model ID here:
 *
 * https://huggingface.co/api/partners/zenmux/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at ZenMux and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to ZenMux, please open an issue on the present repo
 * and we will tag ZenMux team members.
 *
 * Thanks!
 */
import { HeaderParams } from "../types.js";
import { BaseConversationalTask } from "./providerHelper.js";

export class ZenmuxConversationalTask extends BaseConversationalTask {
    constructor() {
        super("zenmux", "https://zenmux.ai/api/v1");
    }
    override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
        const headers = super.prepareHeaders(params, binary);
        headers["x-source-channel"] = "hugging_face";
        headers["accept-language"] = "en-US,en";
        return headers;
    }
}
