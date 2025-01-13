import type { ModelId } from "../types";

export const REPLICATE_API_BASE_URL = "https://api.replicate.com";

type ReplicateId = string;

/**
 * Mapping from HF model ID -> Replicate model ID
 *
 * Available models can be fetched with:
 * ```
 * curl -s \
 * 	-H "Authorization: Bearer $REPLICATE_API_TOKEN" \
 * 	'https://api.replicate.com/v1/models'
 * ```
 *
 * See also https://github.com/replicate/all-the-public-replicate-models
 */
export const REPLICATE_MODEL_IDS: Record<ModelId, ReplicateId> = {
  /** text-to-image */
  "black-forest-labs/FLUX.1-Canny-dev": "black-forest-labs/flux-canny-dev",
  "black-forest-labs/FLUX.1-Depth-dev": "black-forest-labs/flux-depth-dev",
  "black-forest-labs/FLUX.1-dev": "black-forest-labs/flux-dev",
  "black-forest-labs/FLUX.1-Fill-dev": "black-forest-labs/flux-fill-dev",
  "black-forest-labs/FLUX.1-Redux-dev": "black-forest-labs/flux-redux-dev",
  "black-forest-labs/FLUX.1-schnell": "black-forest-labs/flux-schnell",
  "ByteDance/Hyper-SD": "bytedance/hyper-flux-16step",
  "ByteDance/SDXL-Lightning":
    "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
  "dataautogpt3/ProteusV0.3": "datacte/proteus-v0.3",
  "Efficient-Large-Model/Sana_1600M_1024px": "nvidia/sana",
  "fal/AuraFlow": "fofr/aura-flow",
  "KwaiVGI/LivePortrait": "fofr/expression-editor",
  "playgroundai/playground-v2.5-1024px-aesthetic":
    "playgroundai/playground-v2.5-1024px-aesthetic",
  "SG161222/Realistic_Vision_V5.1_noVAE": "lucataco/realistic-vision-v5.1",
  "SG161222/RealVisXL_V3.0": "fofr/realvisxl-v3-multi-controlnet-lora",
  "stabilityai/stable-diffusion-3.5-large-turbo":
    "stability-ai/stable-diffusion-3.5-large-turbo",
  "stabilityai/stable-diffusion-3.5-large":
    "stability-ai/stable-diffusion-3.5-large",
  "stabilityai/stable-diffusion-3.5-medium":
    "stability-ai/stable-diffusion-3.5-medium",
  "stabilityai/stable-diffusion-xl-base-1.0": "stability-ai/sdxl",
  "XLabs-AI/flux-controlnet-collections": "xlabs-ai/flux-dev-controlnet",

  /** image tools */
  "Carve/tracer_b7": "lucataco/remove-bg",
  "Falconsai/nsfw_image_detection": "falcons-ai/nsfw_image_detection",

  /** language */
  "ibm-granite/granite-3.0-2b-instruct": "ibm-granite/granite-3.0-2b-instruct",
  "ibm-granite/granite-3.0-8b-instruct": "ibm-granite/granite-3.0-8b-instruct",

  /** vision */
  "allenai/Molmo-7B-D-0924": "zsxkib/molmo-7b",
  "THUDM/cogvlm2-video-llama3-chat": "chenxwh/cogvlm2-video",

  /** text-to-video */
  "genmo/mochi-1-preview": "genmoai/mochi-1",
  "Lightricks/LTX-Video": "lightricks/ltx-video",
  "rain1011/pyramid-flow-sd3": "zsxkib/pyramid-flow",
  "tencent/HunyuanVideo": "tencent/hunyuan-video",

  /** audio */
  "hkchengrex/MMAudio/tree/main": "zsxkib/mmaudio",
  "ICTNLP/Llama-3.1-8B-Omni": "ictnlp/llama-omni",

  /** speech */
  "openai/whisper-large-v3": "vaibhavs10/incredibly-fast-whisper",
  "SWivid/F5-TTS": "x-lance/f5-tts",
};
