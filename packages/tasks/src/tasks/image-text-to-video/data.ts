import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [],
	demo: {
		inputs: [
			{
				filename: "image-text-to-video-input.png",
				type: "img",
			},
			{
				label: "Text Prompt",
				content: "A camera pan showing the scene in motion",
				type: "text",
			},
		],
		outputs: [
			{
				filename: "image-text-to-video-output.gif",
				type: "img",
			},
		],
	},
	metrics: [
		{
			description:
				"Frechet Video Distance uses a model that captures coherence for changes in frames and the quality of each frame. A smaller score indicates better video generation.",
			id: "fvd",
		},
		{
			description:
				"CLIPSIM measures similarity between video frames and text using an image-text similarity model. A higher score indicates better video generation.",
			id: "clipsim",
		},
	],
	models: [
		{
			description: "A powerful model for image-text-to-video generation.",
			id: "Lightricks/LTX-Video",
		},
	],
	spaces: [
		{
			description: "An application for image-text-to-video generation.",
			id: "Lightricks/ltx-video-distilled",
		},
	],
	summary:
		"Image-text-to-video models take an image and a text prompt as input and generate a video based on the reference image and text instructions. These models are useful for animating still images, creating dynamic content from static references, and generating videos with specific motion or transformation guidance.",
	widgetModels: ["Lightricks/LTX-Video"],
	youtubeId: undefined,
};

export default taskData;
