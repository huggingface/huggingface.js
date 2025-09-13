import type { TaskData } from "../Types";

const taskData: TaskData = {
  taskId: "video-to-video",
  title: "Video-to-Video",
  definition: "Models that take videos as input and generate new videos as output. These models enable video style transfer, frame interpolation, super-resolution, motion transfer, and video editing.",
  shortDefinition: "Transform or generate videos from video inputs.",
  modalities: ["video"],
  input: ["video"],
  output: ["video"],
  tags: [
    "video", 
    "generation", 
    "style-transfer", 
    "super-resolution", 
    "frame-interpolation", 
    "motion-transfer", 
    "editing"
  ],
  libraries: ["diffusers", "transformers"],
  datasets: [
    {
      name: "WebVid-10M",
      url: "https://m-bain.github.io/webvid-dataset/",
    },
    {
      name: "UCF101",
      url: "https://www.crcv.ucf.edu/data/UCF101.php",
    },
    {
      name: "DAVIS",
      url: "https://davischallenge.org/davis2017/code.html",
    },
    {
      name: "VoxCeleb2",
      url: "https://www.robots.ox.ac.uk/~vgg/data/voxceleb/",
    }
  ],
  models: [
    {
      modelId: "stabilityai/stable-video-diffusion-img2vid",
      taskName: "Video-to-Video Generation",
    },
    {
      modelId: "megvii-research/ECCV2022-RIFE",
      taskName: "Frame Interpolation",
    },
    {
      modelId: "lllyasviel/sd-controlnet-canny",
      taskName: "Video Style Transfer (ControlNet)",
    },
  ],
};

export default taskData;
