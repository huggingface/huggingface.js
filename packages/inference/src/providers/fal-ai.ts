import type { ProviderMapping } from "./types";

export const FAL_AI_API_BASE_URL = "https://fal.run";

type FalAiId = string;

export const FAL_AI_SUPPORTED_MODEL_IDS: ProviderMapping<FalAiId> = {
    "text-to-image": {
        "black-forest-labs/FLUX.1-schnell": "fal-ai/flux/schnell",
        "black-forest-labs/FLUX.1-dev": "fal-ai/flux/dev",
        "black-forest-labs/FLUX.1-Depth-dev": "fal-ai/flux-lora-depth",
        "black-forest-labs/FLUX.1-Canny-dev": "fal-ai/flux-lora-canny",
        "black-forest-labs/FLUX.1-Fill-dev": "fal-ai/flux-lora-fill",
        "black-forest-labs/FLUX.1-Redux-dev": "fal-ai/flux/dev/redux",
        "playgroundai/playground-v2.5-1024px-aesthetic": "fal-ai/playground-v25",
        "ByteDance/SDXL-Lightning": "fal-ai/lightning-models",
        "PixArt-alpha/PixArt-Sigma-XL-2-1024-MS": "fal-ai/pixart-sigma",
        "stabilityai/stable-diffusion-3-medium": "fal-ai/stable-diffusion-v3-medium",
        "Warlord-K/Sana-1024": "fal-ai/sana",
        "fal/AuraFlow-v0.2": "fal-ai/aura-flow",
        "stabilityai/stable-diffusion-3.5-large": "fal-ai/stable-diffusion-v35-large",
        "yresearch/Switti": "fal-ai/switti",
        "guozinan/PuLID": "fal-ai/flux-pulid",
        "lllyasviel/ic-light": "fal-ai/iclight-v2",
        "stabilityai/stable-diffusion-xl-base-1.0": "fal-ai/lora",
        "Kwai-Kolors/Kolors": "fal-ai/kolors"
    },
    "image-to-image": {
        "Yuanshi/OminiControl": "fal-ai/flux-subject",
        "fal/AuraSR-v2": "fal-ai/aura-sr",
        "franciszzj/Leffa": "fal-ai/leffa",
        "ai-forever/Real-ESRGAN": "fal-ai/esrgan"
    },
    "image-segmentation": {
        "briaai/RMBG-2.0": "fal-ai/bria/background/remove",
        "ZhengPeng7/BiRefNet": "fal-ai/birefnet/v2"
    },
    "text-to-video": {
        "genmo/mochi-1-preview": "fal-ai/mochi-v1",
        "THUDM/CogVideoX-5b": "fal-ai/cogvideox-5b",
        "Lightricks/LTX-Video": "fal-ai/ltx-video",
        "tencent/HunyuanVideo": "fal-ai/hunyuan-video",
        "wileewang/TransPixar": "fal-ai/transpixar"
    },
    "image-to-video": {
        "stabilityai/stable-video-1.0": "fal-ai/stable-video",
        "KwaiVGI/LivePortrait": "fal-ai/live-portrait"
    },
    "text-to-audio": {
        "hkchengrex/MMAudio": "fal-ai/mmaudio-v2",
        "stabilityai/stable-audio-open-1.0": "fal-ai/stable-audio"
    },
    "text-to-speech": {
        "SWivid/F5-TTS": "fal-ai/f5-tts"
    },
    "image-text-to-text": {
        "vikhyatk/moondream-next": "fal-ai/moondream-next",
        "microsoft/Florence-2-large": "fal-ai/florence-2-large/caption",
        "ByteDance/Sa2VA-8B": "fal-ai/sa2va/8b/image"
    },
    "mask-generation": {
        "facebook/sam2-hiera-large": "fal-ai/sam2"
    },
    "image-to-3d": {
        "JeffreyXiang/TRELLIS-image-large": "fal-ai/trellis"
    },
    "depth-estimation": {
        "Intel/dpt-hybrid-midas": "fal-ai/imageutils/depth",
        "prs-eth/marigold-depth-v1-0": "fal-ai/imageutils/marigold-depth",
        "depth-anything/Depth-Anything-V2-Large": "fal-ai/image-preprocessors/depth-anything/v2"
    },
    "automatic-speech-recognition": {
        "openai/whisper-large-v3": "fal-ai/whisper"
    }
};
