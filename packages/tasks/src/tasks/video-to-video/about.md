## Use Cases

### Video Style Transfer
Transform a video into different artistic or cinematic styles.  

### Frame Interpolation
Generate intermediate frames for smoother playback (e.g., 30 FPS → 60 FPS).  

### Video Super-Resolution
Upscale low-resolution videos to higher quality while preserving details.  

### Motion Transfer
Transfer motion from a source video to a target video (e.g., animating a character with another person’s dance).  

### Video Editing & Synthesis
Remove, replace, or edit objects within videos while maintaining temporal consistency.  

### Temporal Modification
Convert a day-time video to night-time, or change weather conditions.

### Virtual Try-on
Change clothing or appearance in video while preserving identity and motion.


## Inference

Try Lucy-Edit-Dev to edit costume of a character.

```python
from typing import List

import torch
from PIL import Image

from diffusers import AutoencoderKLWan, LucyEditPipeline
from diffusers.utils import export_to_video, load_video


# Arguments
url = "https://d2drjpuinn46lb.cloudfront.net/painter_original_edit.mp4"
prompt = "Change the apron and blouse to a classic clown costume: satin polka-dot jumpsuit in bright primary colors, ruffled white collar, oversized pom-pom buttons, white gloves, oversized red shoes, red foam nose; soft window light from left, eye-level medium shot, natural folds and fabric highlights."
negative_prompt = ""
num_frames = 81
height = 480
width = 832

# Load video
def convert_video(video: List[Image.Image]) -> List[Image.Image]:
    video = load_video(url)[:num_frames]
    video = [video[i].resize((width, height)) for i in range(num_frames)]
    return video

video = load_video(url, convert_method=convert_video)

# Load model
model_id = "decart-ai/Lucy-Edit-Dev"
vae = AutoencoderKLWan.from_pretrained(model_id, subfolder="vae", torch_dtype=torch.float32)
pipe = LucyEditPipeline.from_pretrained(model_id, vae=vae, torch_dtype=torch.bfloat16)
pipe.to("cuda")

# Generate video
output = pipe(
    prompt=prompt,
    video=video,
    negative_prompt=negative_prompt,
    height=480,
    width=832,
    num_frames=81,
    guidance_scale=5.0
).frames[0]

# Export video
export_to_video(output, "output.mp4", fps=24)

```

---

### Example 2
Video Style Transfer with LTX-Video

```python
import torch
            from diffusers import LTXConditionPipeline, LTXLatentUpsamplePipeline
            from diffusers.pipelines.ltx.pipeline_ltx_condition import LTXVideoCondition
            from diffusers.utils import export_to_video, load_image

            # Choose your base LTX Video model:
            # base_model_id = "Lightricks/LTX-Video-0.9.7-dev"
            base_model_id = "Lightricks/LTX-Video-0.9.7-distilled" # Using distilled for this example

            # 0. Load base model and upsampler
            pipe = LTXConditionPipeline.from_pretrained(base_model_id, torch_dtype=torch.bfloat16)
            pipe_upsample = LTXLatentUpsamplePipeline.from_pretrained(
                "Lightricks/ltxv-spatial-upscaler-0.9.7",
                vae=pipe.vae, 
                torch_dtype=torch.bfloat16
            )
            pipe.to("cuda")
            pipe_upsample.to("cuda")

            def round_to_nearest_resolution_acceptable_by_vae(height, width):
                height = height - (height % pipe.vae_temporal_compression_ratio)
                width = width - (width % pipe.vae_temporal_compression_ratio)
                return height, width

            video = load_video(
                "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/cosmos/cosmos-video2world-input-vid.mp4"
            )[:21]  # Use only the first 21 frames as conditioning
            condition1 = LTXVideoCondition(video=video, frame_index=0)

            prompt = "The video depicts a winding mountain road covered in snow, with a single vehicle traveling along it. The road is flanked by steep, rocky cliffs and sparse vegetation. The landscape is characterized by rugged terrain and a river visible in the distance. The scene captures the solitude and beauty of a winter drive through a mountainous region."
            negative_prompt = "worst quality, inconsistent motion, blurry, jittery, distorted"
            expected_height, expected_width = 768, 1152
            downscale_factor = 2 / 3
            num_frames = 161

            # Part 1. Generate video at smaller resolution
            downscaled_height, downscaled_width = int(expected_height * downscale_factor), int(expected_width * downscale_factor)
            downscaled_height, downscaled_width = round_to_nearest_resolution_acceptable_by_vae(downscaled_height, downscaled_width)

            latents = pipe(
                conditions=[condition1],
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=downscaled_width,
                height=downscaled_height,
                num_frames=num_frames,
                num_inference_steps=30,
                generator=torch.Generator().manual_seed(0),
                output_type="latent",
            ).frames

            # Part 2. Upscale generated video using latent upsampler with fewer inference steps
            # The available latent upsampler upscales the height/width by 2x
            upscaled_height, upscaled_width = downscaled_height * 2, downscaled_width * 2
            upscaled_latents = pipe_upsample(
                latents=latents,
                output_type="latent"
            ).frames

            # Part 3. Denoise the upscaled video with few steps to improve texture (optional, but recommended)
            video = pipe(
                conditions=[condition1],
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=upscaled_width,
                height=upscaled_height,
                num_frames=num_frames,
                denoise_strength=0.4,  # Effectively, 4 inference steps out of 10
                num_inference_steps=10,
                latents=upscaled_latents,
                decode_timestep=0.05,
                image_cond_noise_scale=0.025,
                generator=torch.Generator().manual_seed(0),
                output_type="pil",
            ).frames[0]

            # Part 4. Downscale the video to the expected resolution
            video = [frame.resize((expected_width, expected_height)) for frame in video]

            export_to_video(video, "output.mp4", fps=24)
```

## Useful Resources

### Papers
- [SeedVR2](https://huggingface.co/papers/2506.22432) - A diffusion-based framework for consistent and controllable video editing.
- [DreamVVT](https://huggingface.co/papers/2508.02807) - A two-stage diffusion transformer framework for video virtual try-on.
- [Lumen](https://huggingface.co/papers/2508.12945) - A video relighting & background editing framework given a video and text instruction.
- [ROSE](https://huggingface.co/papers/2508.18633) - A unified framework for video object removal that handles both the target object and side-effects like shadows and reflections.
- [VIRESET](https://huggingface.co/papers/2411.16199) - A repainting method using Sequential ControlNet and sketch-aware attention to ensure temporal consistency and visual quality.
- [Shape-for-Motion](https://huggingface.co/papers/2506.22432) - A video editing framework that uses time-consistent 3D meshes and dual-propagation to apply precise single-frame edits across entire videos.
- [Generative Video Propagation](https://arxiv.org/html/2412.19761v1) - A framework that propagates first-frame edits across videos, enabling insertion, removal, background replacement, and multi-edit consistency.

### Codes
- [Lumen](https://github.com/Kunbyte-AI/Lumen) - Official implementation of Lumen for text-guided video editing.
- [VIRES](https://github.com/suimuc/VIRES) - Implementation for sketch- and text-guided video instance repainting.
- [ECCV2022-RIFE: Video Frame Interpolation](https://github.com/hzwer/ECCV2022-RIFE)- Real-time video frame interpolation via intermediate flow estimation.
- [StableVSR: Enhancing Perceptual Quality in Video](https://github.com/claudiom4sir/StableVSR)- Super-resolution method to enhance perceptual video quality.

### Datasets
- [VIRESET Dataset](https://huggingface.co/datasets/suimu/VIRESET) - A dataset with detailed annotations for training and benchmarking video instance editing.
- [SeedVR Demo Videos](https://huggingface.co/datasets/Iceclear/SeedVR_VideoDemos) - A collection of demo videos for the SeedVR/SeedVR2 video restoration series, intended to showcase model outputs under different settings.
- [LongV-EVAL](https://huggingface.co/datasets/zhangsh2001/LongV-EVAL) - Benchmark for long video generation and understanding.
- [Canny-Control](https://huggingface.co/datasets/Lightricks/Canny-Control-Dataset) - Small dataset of video clips with canny-edge guidance for training ControlNet-style models.



