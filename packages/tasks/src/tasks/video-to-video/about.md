# Video-to-Video Models

Video-to-video models take one or more videos as input and generate new videos as output. Unlike video-text-to-text models (which produce text), these models transform or synthesize videos while maintaining temporal consistency.  

They can enhance video quality, interpolate frames, modify styles, or generate new motion dynamics, making them key for creative applications, video production, and research.

---

## Different Types of Video-to-Video Models

- **Base Models:** Pre-trained video generative or transformation models (e.g., Stable Video Diffusion).  
- **Instruction-Tuned Models:** Fine-tuned on paired video transformations (e.g., low-res → high-res, day → night).  
- **Conditional Models:** Accept additional control signals such as optical flow, depth, edges, or reference video (e.g., ControlNet for Video).  

---

## Use Cases

### 🎨 Video Style Transfer
Transform a video into different artistic or cinematic styles.  

### 🔄 Frame Interpolation
Generate intermediate frames for smoother playback (e.g., 30 FPS → 60 FPS).  

### 🔧 Video Super-Resolution
Upscale low-resolution videos to higher quality while preserving details.  

### 🕺 Motion Transfer
Transfer motion from a source video to a target video (e.g., animating a character with another person’s dance).  

### ✂️ Video Editing & Synthesis
Remove, replace, or edit objects within videos while maintaining temporal consistency.  

---

## Inference

You can use the [🤗 Diffusers](https://huggingface.co/docs/diffusers) or [Transformers](https://huggingface.co/docs/transformers) libraries to run video-to-video models.

---

### Example 1: Stable Video Diffusion (Video Enhancement)

```python
import torch
from diffusers import StableVideoDiffusionPipeline
import imageio

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load Stable Video Diffusion
pipe = StableVideoDiffusionPipeline.from_pretrained(
    "stabilityai/stable-video-diffusion-img2vid", 
    torch_dtype=torch.float16
).to(device)

# Load input video frames (e.g., using imageio or decord)
video = imageio.mimread("input.mp4", memtest=False)

# Generate enhanced video
output = pipe(video, decode_chunk_size=8, num_frames=24).frames

# Save result
imageio.mimsave("output.mp4", output, fps=24)
```

---

### Example 2: Video Style Transfer with ControlNet

```python
import torch
from diffusers import ControlNetModel, StableVideoDiffusionPipeline
import imageio

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load ControlNet for edge-guided video editing
controlnet = ControlNetModel.from_pretrained("lllyasviel/sd-controlnet-canny", torch_dtype=torch.float16)
pipe = StableVideoDiffusionPipeline.from_pretrained(
    "stabilityai/stable-video-diffusion-img2vid", 
    controlnet=controlnet,
    torch_dtype=torch.float16
).to(device)

# Load input video
video = imageio.mimread("input.mp4", memtest=False)

# Apply style transfer
output = pipe(video, guidance_scale=8.5, num_frames=16, prompt="anime style").frames

# Save result
imageio.mimsave("styled_output.mp4", output, fps=24)
```

---

### Example 3: Frame Interpolation (RIFE)

```python
import torch
from transformers import RifeModel
import imageio

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load RIFE frame interpolation model
model = RifeModel.from_pretrained("megvii-research/ECCV2022-RIFE").to(device)

# Load frames from input video
video = imageio.mimread("input_30fps.mp4", memtest=False)

# Interpolate frames
interpolated_frames = model.interpolate(video, scale=2)  # 30 FPS → 60 FPS

# Save result
imageio.mimsave("output_60fps.mp4", interpolated_frames, fps=60)
```

---

## Useful Resources

- [🤗 Diffusers: Video Generation](https://huggingface.co/docs/diffusers/using-diffusers/video)  
- [Stable Video Diffusion](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid)  
- [RIFE Frame Interpolation](https://huggingface.co/megvii-research/ECCV2022-RIFE)  
- [ControlNet for Video](https://huggingface.co/lllyasviel/sd-controlnet-canny)  
- [Transformers Video Tasks](https://huggingface.co/docs/transformers/tasks/video)  
