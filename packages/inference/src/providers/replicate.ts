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
  "ByteDance/Hyper-SD":
    "bytedance/hyper-flux-16step:382cf8959fb0f0d665b26e7e80b8d6dc3faaef1510f14ce017e8c732bb3d1eb7",
  "ByteDance/SDXL-Lightning":
    "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
  "dataautogpt3/ProteusV0.3":
    "datacte/proteus-v0.3:b28b79d725c8548b173b6a19ff9bffd16b9b80df5b18b8dc5cb9e1ee471bfa48",
  "Efficient-Large-Model/Sana_1600M_1024px":
    "nvidia/sana:c6b5d2b7459910fec94432e9e1203c3cdce92d6db20f714f1355747990b52fa6",
  "fal/AuraFlow":
    "fofr/aura-flow:ae5ab66a7d1ca7ee44cf8c50265d3bafdef23734d03d66063d1c8fcf82f0c17b",
  "KwaiVGI/LivePortrait":
    "fofr/expression-editor:bf913bc90e1c44ba288ba3942a538693b72e8cc7df576f3beebe56adc0a92b86",
  "playgroundai/playground-v2.5-1024px-aesthetic":
    "playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
  "SG161222/Realistic_Vision_V5.1_noVAE":
    "lucataco/realistic-vision-v5.1:2c8e954decbf70b7607a4414e5785ef9e4de4b8c51d50fb8b8b349160e0ef6bb",
  "SG161222/RealVisXL_V3.0":
    "fofr/realvisxl-v3-multi-controlnet-lora:90a4a3604cd637cb9f1a2bdae1cfa9ed869362ca028814cdce310a78e27daade",
  "stabilityai/stable-diffusion-3.5-large-turbo":
    "stability-ai/stable-diffusion-3.5-large-turbo",
  "stabilityai/stable-diffusion-3.5-large":
    "stability-ai/stable-diffusion-3.5-large",
  "stabilityai/stable-diffusion-3.5-medium":
    "stability-ai/stable-diffusion-3.5-medium",
  "stabilityai/stable-diffusion-xl-base-1.0":
    "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
  "XLabs-AI/flux-controlnet-collections":
    "xlabs-ai/flux-dev-controlnet:9a8db105db745f8b11ad3afe5c8bd892428b2a43ade0b67edc4e0ccd52ff2fda",

  /** image-to-image */
  "Carve/tracer_b7":
    "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",

  /** image-classification */
  "Falconsai/nsfw_image_detection":
    "falcons-ai/nsfw_image_detection:97116600cabd3037e5f22ca08ffcc33b92cfacebf7ccd3609e9c1d29e43d3a8d",

  /** text-generation */
  "ibm-granite/granite-3.0-2b-instruct":
    "ibm-granite/granite-3.0-2b-instruct:97679a145f9b2e7370ac4da5012ab06efcba0f30e7a9efadd846fcce51f99d8e",
  "ibm-granite/granite-3.0-8b-instruct":
    "ibm-granite/granite-3.0-8b-instruct:8d8fb55950fb8eb2817fc078b7b05a0bd3ecc612d6332d8009fb0c007839192e",

  /** image-text-to-text */
  "allenai/Molmo-7B-D-0924":
    "zsxkib/molmo-7b:76ebd700864218a4ca97ac1ccff068be7222272859f9ea2ae1dd4ac073fa8de8",
  "THUDM/cogvlm2-video-llama3-chat":
    "chenxwh/cogvlm2-video:9da7e9a554d36bb7b5fec36b43b00e4616dc1e819bc963ded8e053d8d8196cb5",

  /** text-to-video */
  "genmo/mochi-1-preview":
    "genmoai/mochi-1:1944af04d098ef69bed7f9d335d102e652203f268ec4aaa2d836f6217217e460",
  "Lightricks/LTX-Video":
    "lightricks/ltx-video:8c47da666861d081eeb4d1261853087de23923a268a69b63febdf5dc1dee08e4",
  "rain1011/pyramid-flow-sd3":
    "zsxkib/pyramid-flow:8e221e66498a52bb3a928a4b49d85379c99ca60fec41511265deec35d547c1fb",
  "tencent/HunyuanVideo":
    "tencent/hunyuan-video:8283f26be7ce5dc0119324b4752cbfd3970b3ef1b923c4d3c35eb6546518747a",

  /** audio */
  "hkchengrex/MMAudio/tree/main":
    "zsxkib/mmaudio:4b9f801a167b1f6cc2db6ba7ffdeb307630bf411841d4e8300e63ca992de0be9",
  "ICTNLP/Llama-3.1-8B-Omni":
    "ictnlp/llama-omni:36c9bcf70a56f40d9a27445c30c769308b18180296749f86ec9b682baf7ad351",

  /** automatic-speech-recognition */
  "openai/whisper-large-v3":
    "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
  "SWivid/F5-TTS":
    "x-lance/f5-tts:87faf6dd7a692dd82043f662e76369cab126a2cf1937e25a9d41e0b834fd230e",
};
