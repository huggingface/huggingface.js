import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "NYU Depth V2 Dataset: Video dataset containing both RGB and depth sensor data",
			id: "sayakpaul/nyu_depth_v2",
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
			description: "Strong Depth Estimation model trained on 1.4 million images.",
			id: "Intel/dpt-large",
		},
		{
			description: "Strong Depth Estimation model trained on the KITTI dataset.",
			id: "facebook/dpt-dinov2-large-kitti",
		},
		{
			description: "A strong monocular depth estimation model.",
			id: "Bingxin/Marigold",
		},
	],
	spaces: [
		{
			description: "An application that predicts the depth of an image and then reconstruct the 3D model as voxels.",
			id: "radames/dpt-depth-estimation-3d-voxels",
		},
		{
			description: "An application that can estimate the depth in a given image.",
			id: "keras-io/Monocular-Depth-Estimation",
		},
	],
	summary: "Depth estimation is the task of predicting depth of the objects present in an image.",
	widgetModels: [""],
	youtubeId: "",
};

export default taskData;
