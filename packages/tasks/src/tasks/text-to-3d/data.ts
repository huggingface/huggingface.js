import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "A large dataset of over 10 million 3D objects.",
			id: "allenai/objaverse-xl",
		},
		{
			description: "Descriptive captions for 3D objects in Objaverse.",
			id: "tiange/Cap3D",
		},
	],
	demo: {
		inputs: [
			{
				label: "Prompt",
				content: "Enter a prompt to generate a 3D model.",
				type: "text",
			},
		],
		outputs: [
			{
				label: "Result",
				content: "image-to-3d-3d-output-filename.glb",
				type: "text",
			},
		],
	},
	metrics: [],
	models: [
		{
			description: "Text-to-3D mesh model by OpenAI",
			id: "openai/shap-e",
		},
		{
			description: "Generative 3D gaussian splatting model.",
			id: "ashawkey/LGM",
		},
	],
	spaces: [
		{
			description: "Shap-E based text-to-3D demo with mesh outputs.",
			id: "hysts/Shap-E",
		},
		{
			description: "LGM based text/image-to-3D demo with splat outputs.",
			id: "ashawkey/LGM",
		},
	],
	summary:
		"Text-to-3D models take in text input and produce 3D output. The 3D output may be a mesh (`.glb`, `.obj`) or splat (`.ply`, `.splat`).",
	widgetModels: [],
	youtubeId: "",
};

export default taskData;
