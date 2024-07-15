import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "NYU Depth V2 Dataset: Video dataset containing both RGB and depth sensor data.",
			id: "sayakpaul/nyu_depth_v2",
		},
		{
			description: "Monocular depth estimation benchmark based without noise and errors.",
			id: "depth-anything/DA-2K",
		},
	],
	demo: {
		inputs: [
			{
				filename: "depth-estimation-input.jpg",
				type: "img",
			},
		],
		outputs: [
			{
				filename: "depth-estimation-output.png",
				type: "img",
			},
		],
	},
	metrics: [],
	models: [
		{
			description: "Cutting-edge depth estimation model.",
			id: "depth-anything/Depth-Anything-V2-Large",
		},
		{
			description: "A strong monocular depth estimation model.",
			id: "Bingxin/Marigold",
		},
		{
			description: "A metric depth estimation model trained on NYU dataset.",
			id: "Intel/zoedepth-nyu",
		},
	],
	spaces: [
		{
			description: "An application that predicts the depth of an image and then reconstruct the 3D model as voxels.",
			id: "radames/dpt-depth-estimation-3d-voxels",
		},
		{
			description: "An application on cutting-edge depth estimation.",
			id: "depth-anything/Depth-Anything-V2",
		},
		{
			description: "An application to try state-of-the-art depth estimation.",
			id: "merve/compare_depth_models",
		},
	],
	summary: "Depth estimation is the task of predicting depth of the objects present in an image.",
	widgetModels: [""],
	youtubeId: "",
};

export default taskData;
