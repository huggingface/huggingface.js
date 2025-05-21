import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "A dataset of images and short video clips for image-to-video generation research.",
			id: "some/image-to-video-dataset",
		},
		{
			description: "A benchmark dataset for reference-based video generation.",
			id: "ali-vilab/VACE-Benchmark",
		},
		{
			description: "A dataset for scoring video generation styles.",
			id: "Rapidata/sora-video-generation-style-likert-scoring",
		},
		{
			description: "A dataset for captioned videos ",
			id: "BestWishYsh/ChronoMagic",
		},
	],
	demo: {
		inputs: [
			{
				filename: "image-to-video-input.jpg",
				type: "img",
			},
			{
				label: "Optional prompt",
				content: "This penguin is dancing",
				type: "text",
			},
		],
		outputs: [
			{
				filename: "image-to-video-output.gif",
				type: "img",
			},
		],
	},
	metrics: [
		{
			description:
				"Fréchet Video Distance (FVD) measures the perceptual similarity between the distributions of generated videos and a set of real videos, assessing overall visual quality and temporal coherence of the video generated from an input image.",
			id: "fvd",
		},
		{
			description:
				"CLIP Score measures the semantic similarity between a textual prompt (if provided alongside the input image) and the generated video frames. It evaluates how well the video's generated content and motion align with the textual description, conditioned on the initial image.",
			id: "clip_score",
		},
		{
			description:
				"First Frame Fidelity, often measured using LPIPS (Learned Perceptual Image Patch Similarity), PSNR, or SSIM, quantifies how closely the first frame of the generated video matches the input conditioning image.",
			id: "lpips",
		},
		{
			description:
				"Identity Preservation Score measures the consistency of identity (e.g., a person's face or a specific object's characteristics) between the input image and throughout the generated video frames, often calculated using features from specialized models like face recognition (e.g., ArcFace) or re-identification models.",
			id: "identity_preservation",
		},
		{
			description:
				"Motion Score evaluates the quality, realism, and temporal consistency of motion in the video generated from a static image. This can be based on optical flow analysis (e.g., smoothness, magnitude), consistency of object trajectories, or specific motion plausibility assessments.",
			id: "motion_score",
		},
	],
	models: [
		{
			description: "LTX-Video, a 13B parameter model for high quality video generation",
			id: "Lightricks/LTX-Video-0.9.7-dev",
		},
		{
			description: "A 1.3B parameter model for reference-based video generation",
			id: "Wan-AI/Wan2.1-VACE-1.3B",
		},
		{
			description: "An image-to-video generation model using FramePack methodology with Hunyuan-DiT architecture.",
			id: "lllyasviel/FramePackI2V_HY",
		},
		{
			description: "An image-to-video generation model using FramePack F1 methodology with Hunyuan-DiT architecture",
			id: "lllyasviel/FramePack_F1_I2V_HY_20250503",
		},
		{
			description: "A distilled version of the LTX-Video-0.9.7-dev model for faster inference",
			id: "Lightricks/LTX-Video-0.9.7-distilled",
		},
		{
			description: "An image-to-video generation model by Skywork AI, 1.3B parameters, producing 540p videos.",
			id: "Skywork/SkyReels-V2-I2V-1.3B-540P",
		},
		{
			description: "An image-to-video generation model by Skywork AI, 14B parameters, producing 720p videos.",
			id: "Skywork/SkyReels-V2-I2V-14B-720P",
		},
		{
			description: "An image-to-video generation model by Skywork AI, 14B parameters, producing 540p videos.",
			id: "Skywork/SkyReels-V2-I2V-14B-540P",
		},
		{
			description: "Diffusers version of Hunyuan-DiT for image-to-video generation.",
			id: "hunyuanvideo-community/HunyuanVideo-I2V",
		},
		{
			description: "Tencent's Hunyuan-DiT model for image-to-video generation.",
			id: "tencent/HunyuanVideo-I2V",
		},
		{
			description: "A 14B parameter model for 480p image-to-video generation by Wan-AI.",
			id: "Wan-AI/Wan2.1-I2V-14B-480P",
		},
		{
			description: "A 14B parameter model for 720p image-to-video generation by Wan-AI.",
			id: "Wan-AI/Wan2.1-I2V-14B-720P",
		},
		{
			description: "A Diffusers version of the Wan2.1-I2V-14B-720P model for 720p image-to-video generation.",
			id: "Wan-AI/Wan2.1-I2V-14B-720P-Diffusers",
		},
		{
			description:
				"A 14B parameter model for frame-level feature to video (FLF2V) generation by Wan-AI, producing 720p videos (Diffusers version).",
			id: "Wan-AI/Wan2.1-FLF2V-14B-720P-diffusers",
		},
		{
			description: "A Diffusers version of the Wan2.1-I2V-14B-480P model for 480p image-to-video generation.",
			id: "Wan-AI/Wan2.1-I2V-14B-480P-Diffusers",
		},

		{
			description: "A video generation model based on LTX-Video-0.9, evaluated on the VACE benchmark.",
			id: "ali-vilab/VACE-LTX-Video-0.9",
		},
		{
			description: "An image-to-video model by Stability AI for generating short videos from images.",
			id: "stabilityai/stable-video-diffusion-img2vid",
		},
		{
			description: "A 5 billion parameter model for image-to-video generation by THUDM.",
			id: "THUDM/CogVideoX-5b-I2V",
		},
	],
	spaces: [
		{
			description: "An application to generate videos fast.",
			id: "Lightricks/ltx-video-distilled",
		},
		{
			description: "Generate videos with the FramePack-F1",
			id: "linoyts/FramePack-F1",
		},
		{
			description: "Generate videos with the FramePack",
			id: "lisonallen/framepack-i2v",
		},
		{
			description: "Wan2.1 with CausVid LoRA",
			id: "multimodalart/wan2-1-fast",
		},
		{
			description: "A demo for Stable Video Diffusion",
			id: "multimodalart/stable-video-diffusion",
		},
	],
	summary:
		"Image-to-video models take a still image as input and generate a video. These models can be guided by text prompts to influence the content and style of the output video.",
	widgetModels: [],
	youtubeId: undefined,
};

export default taskData;
