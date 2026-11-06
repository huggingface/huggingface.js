import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Real-robot teleoperation episodes on the SO-100 arm, in LeRobot format.",
			id: "lerobot/svla_so100_pickplace",
		},
		{
			description: "Bimanual ALOHA simulation episodes.",
			id: "lerobot/aloha_sim_transfer_cube_human",
		},
	],
	demo: {
		inputs: [
			{
				filename: "robotics-camera.jpg",
				type: "img",
			},
			{
				label: "Instruction",
				content: "pick up the red cube and place it in the bowl",
				type: "text",
			},
		],
		outputs: [
			{
				type: "chart",
				data: [
					{ label: "step 1", score: 0.12 },
					{ label: "step 2", score: 0.18 },
					{ label: "step 3", score: 0.21 },
				],
			},
		],
	},
	metrics: [
		{
			description: "Fraction of evaluation episodes in which the task is completed.",
			id: "success_rate",
		},
	],
	models: [
		{
			description: "A compact vision-language-action policy for low-cost arms.",
			id: "lerobot/smolvla_base",
		},
		{
			description: "A generalist vision-language-action policy with open-world knowledge.",
			id: "lerobot/pi05_base",
		},
		{
			description: "A humanoid-oriented vision-language-action foundation model.",
			id: "nvidia/GR00T-N1.7-3B",
		},
	],
	spaces: [
		{
			description: "Visualize LeRobot datasets episode by episode.",
			id: "lerobot/visualize_dataset",
		},
	],
	summary:
		"Robotics policies map a robot's observation (camera images, proprioceptive state and an instruction) to the next chunk of actions. Vision-language-action models are the common form; inference runs once per control tick.",
	widgetModels: [],
};

export default taskData;
