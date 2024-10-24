import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Microsoft Research Video to Text is a large-scale dataset for open domain video captioning",
			id: "iejMac/CLIP-MSR-VTT",
		},
		{
			description: "UCF101 Human Actions dataset consists of 13,320 video clips from YouTube, with 101 classes.",
			id: "quchenyuan/UCF101-ZIP",
		},
		{
			description: "A high-quality dataset for human action recognition in YouTube videos.",
			id: "nateraw/kinetics",
		},
		{
			description: "A dataset of video clips of humans performing pre-defined basic actions with everyday objects.",
			id: "HuggingFaceM4/something_something_v2",
		},
		{
			description:
				"This dataset consists of text-video pairs and contains noisy samples with irrelevant video descriptions",
			id: "HuggingFaceM4/webvid",
		},
		{
			description: "A dataset of short Flickr videos for the temporal localization of events with descriptions.",
			id: "iejMac/CLIP-DiDeMo",
		},
	],
	demo: {
		inputs: [
			{
				label: "Input",
				content: "Darth Vader is surfing on the waves.",
				type: "text",
			},
		],
		outputs: [
			{
				filename: "text-to-video-output.gif",
				type: "img",
			},
		],
	},
	metrics: [
		{
			description:
				"Inception Score uses an image classification model that predicts class labels and evaluates how distinct and diverse the images are. A higher score indicates better video generation.",
			id: "is",
		},
		{
			description:
				"Frechet Inception Distance uses an image classification model to obtain image embeddings. The metric compares mean and standard deviation of the embeddings of real and generated images. A smaller score indicates better video generation.",
			id: "fid",
		},
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
			description: "A strong model for consistent video generation.",
			id: "rain1011/pyramid-flow-sd3",
		},
		{
			description: "A robust model for text-to-video generation.",
			id: "VideoCrafter/VideoCrafter2",
		},
		{
			description: "A cutting-edge text-to-video generation model.",
			id: "TIGER-Lab/T2V-Turbo-V2",
		},
	],
	spaces: [
		{
			description: "An application that generates video from text.",
			id: "VideoCrafter/VideoCrafter",
		},
		{
			description: "Consistent video generation application.",
			id: "TIGER-Lab/T2V-Turbo-V2",
		},
		{
			description: "A cutting edge video generation application.",
			id: "Pyramid-Flow/pyramid-flow",
		},
	],
	summary:
		"Text-to-video models can be used in any application that requires generating consistent sequence of images from text. ",
	widgetModels: [],
	youtubeId: undefined,
};

export default taskData;
