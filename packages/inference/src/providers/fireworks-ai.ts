export const FIREWORKS_AI_API_BASE_URL = "https://api.fireworks.ai/inference";

/**
 * See the registered mapping of HF model ID => Fireworks model ID here:
 *
 * https://huggingface.co/api/partners/fireworks/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Fireworks and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Fireworks, please open an issue on the present repo
 * and we will tag Fireworks team members.
 *
 * Thanks!
 */

// Examples
//
// "meta-llama/Llama-3.3-70B-Instruct": "accounts/fireworks/models/llama-v3p3-70b-instruct",
// "meta-llama/Llama-3.2-3B-Instruct": "accounts/fireworks/models/llama-v3p2-3b-instruct",
// "meta-llama/Llama-3.1-8B-Instruct": "accounts/fireworks/models/llama-v3p1-8b-instruct",
// "mistralai/Mixtral-8x7B-Instruct-v0.1": "accounts/fireworks/models/mixtral-8x7b-instruct",
// "deepseek-ai/DeepSeek-R1": "accounts/fireworks/models/deepseek-r1",
// "deepseek-ai/DeepSeek-V3": "accounts/fireworks/models/deepseek-v3",
// "meta-llama/Llama-3.2-90B-Vision-Instruct": "accounts/fireworks/models/llama-v3p2-90b-vision-instruct",
// "meta-llama/Llama-3.2-11B-Vision-Instruct": "accounts/fireworks/models/llama-v3p2-11b-vision-instruct",
// "meta-llama/Meta-Llama-3-70B-Instruct": "accounts/fireworks/models/llama-v3-70b-instruct",
// "meta-llama/Meta-Llama-3-8B-Instruct": "accounts/fireworks/models/llama-v3-8b-instruct",
// "mistralai/Mistral-Small-24B-Instruct-2501": "accounts/fireworks/models/mistral-small-24b-instruct-2501",
// "mistralai/Mixtral-8x22B-Instruct-v0.1": "accounts/fireworks/models/mixtral-8x22b-instruct",
// "Qwen/QWQ-32B-Preview": "accounts/fireworks/models/qwen-qwq-32b-preview",
// "Qwen/Qwen2.5-72B-Instruct": "accounts/fireworks/models/qwen2p5-72b-instruct",
// "Qwen/Qwen2.5-Coder-32B-Instruct": "accounts/fireworks/models/qwen2p5-coder-32b-instruct",
// "Qwen/Qwen2-VL-72B-Instruct": "accounts/fireworks/models/qwen2-vl-72b-instruct",
// "Gryphe/MythoMax-L2-13b": "accounts/fireworks/models/mythomax-l2-13b",
// "microsoft/Phi-3.5-vision-instruct": "accounts/fireworks/models/phi-3-vision-128k-instruct",
