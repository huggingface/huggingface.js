import * as tasks from "./tasks";
import type { Options, RequestArgs } from "./types";
import type { DistributiveOmit } from "./utils/distributive-omit";

/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */

type Task = Omit<typeof tasks, "request" | "streamingRequest">;

type TaskWithNoAccessToken = {
	[key in keyof Task]: (
		args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken">,
		options?: Parameters<Task[key]>[1]
	) => ReturnType<Task[key]>;
};

type TaskWithNoAccessTokenNoEndpointUrl = {
	[key in keyof Task]: (
		args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken" | "endpointUrl">,
		options?: Parameters<Task[key]>[1]
	) => ReturnType<Task[key]>;
};

export class HfInference implements Task {
	protected readonly accessToken: string;
	protected readonly defaultOptions: Options;

	speechToText: typeof tasks.speechToText;
	audioClassification: typeof tasks.audioClassification;
	automaticSpeechRecognition: typeof tasks.automaticSpeechRecognition;
	textToSpeech: typeof tasks.textToSpeech;
	audioToAudio: typeof tasks.audioToAudio;
	imageClassification: typeof tasks.imageClassification;
	imageSegmentation: typeof tasks.imageSegmentation;
	imageToText: typeof tasks.imageToText;
	objectDetection: typeof tasks.objectDetection;
	textToImage: typeof tasks.textToImage;
	imageToImage: typeof tasks.imageToImage;
	zeroShotImageClassification: typeof tasks.zeroShotImageClassification;
	featureExtraction: typeof tasks.featureExtraction;
	fillMask: typeof tasks.fillMask;
	questionAnswering: typeof tasks.questionAnswering;
	sentenceSimilarity: typeof tasks.sentenceSimilarity;
	summarization: typeof tasks.summarization;
	tableQuestionAnswering: typeof tasks.tableQuestionAnswering;
	textClassification: typeof tasks.textClassification;
	textGeneration: typeof tasks.textGeneration;
	tokenClassification: typeof tasks.tokenClassification;
	translation: typeof tasks.translation;
	zeroShotClassification: typeof tasks.zeroShotClassification;
	chatCompletion: typeof tasks.chatCompletion;
	documentQuestionAnswering: typeof tasks.documentQuestionAnswering;
	visualQuestionAnswering: typeof tasks.visualQuestionAnswering;
	tabularRegression: typeof tasks.tabularRegression;
	tabularClassification: typeof tasks.tabularClassification;
	textGenerationStream: typeof tasks.textGenerationStream;
	chatCompletionStream: typeof tasks.chatCompletionStream;

	static mapInferenceFn<TOut, TArgs>(instance: HfInference, func: (...args: [TArgs, Options?]) => TOut) {
		return function (...[args, options]: Parameters<(...args: [TArgs, Options?]) => TOut>): TOut {
			return func({ ...args, accessToken: instance.accessToken }, { ...instance.defaultOptions, ...(options ?? {}) });
		};
	}

	constructor(accessToken = "", defaultOptions: Options = {}) {
		this.accessToken = accessToken;
		this.defaultOptions = defaultOptions;

		this.speechToText = HfInference.mapInferenceFn(this, tasks.speechToText);
		this.audioClassification = HfInference.mapInferenceFn(this, tasks.audioClassification);
		this.automaticSpeechRecognition = HfInference.mapInferenceFn(this, tasks.automaticSpeechRecognition);
		this.textToSpeech = HfInference.mapInferenceFn(this, tasks.textToSpeech);
		this.audioToAudio = HfInference.mapInferenceFn(this, tasks.audioToAudio);
		this.imageClassification = HfInference.mapInferenceFn(this, tasks.imageClassification);
		this.imageSegmentation = HfInference.mapInferenceFn(this, tasks.imageSegmentation);
		this.imageToText = HfInference.mapInferenceFn(this, tasks.imageToText);
		this.objectDetection = HfInference.mapInferenceFn(this, tasks.objectDetection);
		this.textToImage = HfInference.mapInferenceFn(this, tasks.textToImage);
		this.imageToImage = HfInference.mapInferenceFn(this, tasks.imageToImage);
		this.zeroShotImageClassification = HfInference.mapInferenceFn(this, tasks.zeroShotImageClassification);
		this.featureExtraction = HfInference.mapInferenceFn(this, tasks.featureExtraction);
		this.fillMask = HfInference.mapInferenceFn(this, tasks.fillMask);
		this.questionAnswering = HfInference.mapInferenceFn(this, tasks.questionAnswering);
		this.sentenceSimilarity = HfInference.mapInferenceFn(this, tasks.sentenceSimilarity);
		this.summarization = HfInference.mapInferenceFn(this, tasks.summarization);
		this.tableQuestionAnswering = HfInference.mapInferenceFn(this, tasks.tableQuestionAnswering);
		this.textClassification = HfInference.mapInferenceFn(this, tasks.textClassification);
		this.textGeneration = HfInference.mapInferenceFn(this, tasks.textGeneration);
		this.tokenClassification = HfInference.mapInferenceFn(this, tasks.tokenClassification);
		this.translation = HfInference.mapInferenceFn(this, tasks.translation);
		this.zeroShotClassification = HfInference.mapInferenceFn(this, tasks.zeroShotClassification);
		this.chatCompletion = HfInference.mapInferenceFn(this, tasks.chatCompletion);
		this.documentQuestionAnswering = HfInference.mapInferenceFn(this, tasks.documentQuestionAnswering);
		this.visualQuestionAnswering = HfInference.mapInferenceFn(this, tasks.visualQuestionAnswering);
		this.tabularRegression = HfInference.mapInferenceFn(this, tasks.tabularRegression);
		this.tabularClassification = HfInference.mapInferenceFn(this, tasks.tabularClassification);

		/// Streaming methods
		this.textGenerationStream = HfInference.mapInferenceFn(this, tasks.textGenerationStream);
		this.chatCompletionStream = HfInference.mapInferenceFn(this, tasks.chatCompletionStream);
	}

	/**
	 * Returns copy of HfInference tied to a specified endpoint.
	 */
	public endpoint(endpointUrl: string): HfInferenceEndpoint {
		return new HfInferenceEndpoint(endpointUrl, this.accessToken, this.defaultOptions);
	}
}

export class HfInferenceEndpoint {
	constructor(endpointUrl: string, accessToken = "", defaultOptions: Options = {}) {
		accessToken;
		defaultOptions;

		for (const [name, fn] of Object.entries(tasks)) {
			Object.defineProperty(this, name, {
				enumerable: false,
				value: (params: RequestArgs, options: Options) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					fn({ ...params, accessToken, endpointUrl } as any, { ...defaultOptions, ...options }),
			});
		}
	}
}

export interface HfInference extends TaskWithNoAccessToken {}

export interface HfInferenceEndpoint extends TaskWithNoAccessTokenNoEndpointUrl {}
