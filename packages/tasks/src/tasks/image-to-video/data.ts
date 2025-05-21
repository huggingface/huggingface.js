import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "A dataset of images and short video clips for image-to-video generation research.",
			id: "some/image-to-video-dataset",
		},
	],
	demo: {
		inputs: [
			{
				filename: "image-to-video-input.jpeg",
				type: "img",
			},
			{
				label: "Optional prompt",
				content: "A dog running in a field of flowers, cinematic lighting",
				type: "text",
			},
		],
		outputs: [
			{
				filename: "image-to-video-output.gif",
				type: "img", // Representing video as gif for demo
			},
		],
	},
	metrics: [
		{
			description: "Frechet Video Distance (FVD) is a common metric for evaluating the quality of generated videos, comparing them to real videos.",
			id: "fvd",
		},
		{
			description: "Inception Score (IS) can be adapted for videos to measure the diversity and quality of generated frames.",
			id: "is_video", 
		},
	],
	models: [
		{
			description: "A generic model for image-to-video generation.",
			id: "generic/image-to-video-model",
		},
	],
	spaces: [
		{
			description: "An application that generates video from an image.",
			id: "user/image-to-video-space",
		},
	],
	summary:
		"Image-to-video models take a still image as input and generate a video sequence. These models can be guided by text prompts to influence the content and style of the output video.",
	widgetModels: ["generic/image-to-video-model-widget"],
	youtubeId: undefined,
};

export default taskData; 