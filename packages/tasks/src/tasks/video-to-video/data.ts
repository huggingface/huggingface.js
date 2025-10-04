import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Dataset with detailed annotations for training and benchmarking video instance editing.",
			id: "suimu/VIRESET",
		},
		{
			description: "Dataset to evaluate models on long video generation and understanding.",
			id: "zhangsh2001/LongV-EVAL",
		},
		{
			description: "Collection of 104 demo videos from the SeedVR/SeedVR2 series showcasing model outputs.",
			id: "Iceclear/SeedVR_VideoDemos",
		},
	],
	demo: {
		inputs: [
			{
				filename: "input.gif",
				type: "img",
			},
		],
		outputs: [
			{
				filename: "output.gif",
				type: "img",
			},
		],
	},
	metrics: [],
	models: [
		{
			description:
				"Model for editing outfits, character, and scenery in videos.",
			id: "decart-ai/Lucy-Edit-Dev",
		},
		{
			description: "Predicts next video frames for frame interpolation and higher FPS.",
			id: "keras-io/conv-lstm",
		},
		{
			description: "Video upscaling model that enhances resolution while preserving quality.",
			id: "ByteDance-Seed/SeedVR2-7B",
		},
		{
			description: "Framework that uses 3D mesh proxies for precise, consistent video editing.",
			id: "LeoLau/Shape-for-Motion",
		},
		{
			description: "A model to upscale videos at input, designed for seamless use with ComfyUI.",
			id: "numz/SeedVR2_comfyUI",
		},
		{
			description: "Model for relighting videos by manipulating illumination distributions.",
			id: "TeslaYang123/TC-Light",
		},
	],
	spaces: [
		{
			description: "Interactive demo space for Lucy-Edit-Dev video editing.",
			id: "decart-ai/lucy-edit-dev",
		},
		{
			description: "Demo space for SeedVR2-3B showcasing video upscaling and restoration.",
			id: "ByteDance-Seed/SeedVR2-3B",
		},
	],
	summary:
		"Video-to-video models take one or more videos as input and generate new videos as output. They can enhance quality, interpolate frames, modify styles, or create new motion dynamics, enabling creative applications, video production, and research.",
	widgetModels: [],
	youtubeId: "",
};

export default taskData;
