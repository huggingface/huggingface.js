/**
 * See the registered mapping of HF model ID => Bytez model ID here:
 *
 * https://huggingface.co/api/partners/bytez-ai/models
 *
 * Note, HF model IDs are 1-1 with Bytez model IDs. This is a publicly available mapping.
 *
 **/

import type {
	ChatCompletionOutput,
	SummarizationOutput,
	TextGenerationOutput,
	TranslationOutput,
	QuestionAnsweringOutput,
	QuestionAnsweringInput,
	VisualQuestionAnsweringOutput,
	VisualQuestionAnsweringInput,
	DocumentQuestionAnsweringOutput,
	DocumentQuestionAnsweringInput,
	QuestionAnsweringOutputElement,
	ImageSegmentationInput,
	ZeroShotClassificationInput,
	ZeroShotImageClassificationOutput,
	ZeroShotImageClassificationInput,
	BoundingBox,
	FeatureExtractionOutput,
	FeatureExtractionInput,
	SentenceSimilarityOutput,
	SentenceSimilarityInput,
	FillMaskOutput,
	FillMaskInput,
	TextClassificationOutput,
	TokenClassificationOutput,
	ZeroShotClassificationOutput,
	TextToSpeechInput,
	AutomaticSpeechRecognitionInput,
	AutomaticSpeechRecognitionOutput,
	ObjectDetectionInput,
	ObjectDetectionOutput,
	AudioClassificationInput,
	AudioClassificationOutput,
	ImageClassificationInput,
	ImageClassificationOutput,
	ImageToTextOutput,
} from "@huggingface/tasks";
import type { BaseArgs, BodyParams, HeaderParams, RequestArgs, UrlParams } from "../types.js";
import type {
	AudioClassificationTaskHelper,
	AutomaticSpeechRecognitionTaskHelper,
	ConversationalTaskHelper,
	DocumentQuestionAnsweringTaskHelper,
	FeatureExtractionTaskHelper,
	FillMaskTaskHelper,
	ImageClassificationTaskHelper,
	ImageSegmentationTaskHelper,
	ImageToTextTaskHelper,
	ObjectDetectionTaskHelper,
	QuestionAnsweringTaskHelper,
	SentenceSimilarityTaskHelper,
	SummarizationTaskHelper,
	TextClassificationTaskHelper,
	TextToImageTaskHelper,
	TextToSpeechTaskHelper,
	TextToVideoTaskHelper,
	TokenClassificationTaskHelper,
	TranslationTaskHelper,
	VisualQuestionAnsweringTaskHelper,
	ZeroShotClassificationTaskHelper,
	ZeroShotImageClassificationTaskHelper,
} from "./providerHelper.js";
import {
	TaskProviderHelper,
	type TextGenerationTaskHelper,
	// type TextToVideoTaskHelper,
} from "./providerHelper.js";
import type { ImageSegmentationOutput } from "../../../tasks/dist/commonjs/index.js";
import { base64FromBytes } from "../utils/base64FromBytes.js";
import type {
	AudioClassificationArgs,
	AutomaticSpeechRecognitionArgs,
	ImageClassificationArgs,
	ImageSegmentationArgs,
	ImageToTextArgs,
	ObjectDetectionArgs,
} from "../tasks/index.js";

export interface BytezStringLikeOutput {
	output: string;
	error: string;
}

export interface BytezQuestionAnsweringOutput {
	output: QuestionAnsweringOutputElement;
	error: string;
}

export interface BytezDocumentQuestionAnsweringOutput {
	output: DocumentQuestionAnsweringOutput;
	error: string;
}

export interface BytezImageSegmentationOutput {
	output: {
		score: number;
		label: string;
		mask_png: string;
	}[];
	error: string;
}
export interface BytezImageClassificationOutput {
	output: {
		score: number;
		label: string;
	}[];
	error: string;
}

export interface BytezZeroShotImageClassificationOutput {
	output: {
		score: number;
		label: string;
	}[];
	error: string;
}

export interface BytezTokenClassificationOutput {
	output: {
		index: number;
		entity: string;
		score: number;
		word: string;
		start: number;
		end: number;
	}[];
	error: string;
}

export interface BytezZeroShotClassificationOutput {
	output: ZeroShotClassificationOutput;
	error: string;
}

export interface BytezObjectDetectionOutput {
	output: {
		score: number;
		label: string;
		box: BoundingBox;
	}[];
	error: string;
}

export interface BytezFeatureExtractionOutput {
	output: FeatureExtractionOutput[];
	error: string;
}

export interface BytezSentenceSimilarityOutput {
	output: number[][];
	error: string;
}

export interface BytezSentenceFillMaskOutput {
	output: FillMaskOutput;
	error: string;
}

export interface BytezVisualQuestionAnsweringOutput {
	output: VisualQuestionAnsweringOutput;
	error: string;
}

export interface BytezChatLikeOutput {
	output: ChatCompletionOutput;
	error: string;
}

// const BASE_URL = "https://api.bytez.com"
const BASE_URL = "http://localhost:8080";

abstract class BytezTask extends TaskProviderHelper {
	constructor(url?: string) {
		super("bytez", url || BASE_URL);
	}

	makeRoute(params: UrlParams): string {
		return `models/v2/${params.model}`;
	}

	// we always pass in "application/json"
	override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		void binary;

		const headers: Record<string, string> = { Authorization: `Key ${params.accessToken}` };
		headers["Content-Type"] = "application/json";
		return headers;
	}

	// we always want this behavior with out API, we only support JSON payloads
	override makeBody(params: BodyParams): BodyInit {
		return JSON.stringify(this.preparePayload(params));
	}

	async _preparePayloadAsync(args: Record<string, unknown>) {
		if ("inputs" in args) {
			const input = args.inputs as Blob;
			const arrayBuffer = await input.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const base64 = base64FromBytes(uint8Array);

			return {
				...args,
				inputs: base64,
			};
		} else {
			// handle LegacyImageInput case
			const data = args.data as Blob;
			const arrayBuffer = data instanceof Blob ? await data.arrayBuffer() : data;
			const uint8Array = new Uint8Array(arrayBuffer);
			const base64 = base64FromBytes(uint8Array);

			return {
				...args,
				inputs: base64,
			};
		}
	}

	handleError(error: string) {
		if (error) {
			throw new Error(`There was a problem with the Bytez API: ${error}`);
		}
	}
}

export class BytezTextGenerationTask extends BytezTask implements TextGenerationTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
			stream: params.args.stream,
			complianceFormat: params.args.stream ? "hf://text-generation" : undefined,
		};
	}

	override async getResponse(
		response: BytezStringLikeOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<TextGenerationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return {
			generated_text: output,
		};
	}
}

export class BytezConversationalTask extends BytezTask implements ConversationalTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			messages: params.args.messages,
			params: params.args.parameters,
			stream: params.args.stream,
			// HF uses the same schema as OAI compliant spec
			complianceFormat: "openai://chat/completions",
		};
	}
	override async getResponse(
		response: BytezChatLikeOutput,
		url: string,
		headers?: HeadersInit
	): Promise<ChatCompletionOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

export class BytezSummarizationTask extends BytezTask implements SummarizationTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezStringLikeOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<SummarizationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return {
			summary_text: output,
		};
	}
}

export class BytezTranslationTask extends BytezTask implements TranslationTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezStringLikeOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<TranslationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return {
			translation_text: output,
		};
	}
}

export class BytezTextToImageTask extends BytezTask implements TextToImageTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezStringLikeOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<string | Blob | Record<string, unknown>> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		const cdnResponse = await fetch(output);

		const blob = await cdnResponse.blob();

		return blob;
	}
}

export class BytezTextToVideoTask extends BytezTask implements TextToVideoTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(response: BytezStringLikeOutput, url?: string, headers?: HeadersInit): Promise<Blob> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		const cdnResponse = await fetch(output);

		const blob = await cdnResponse.blob();

		return blob;
	}
}

export class BytezImageToTextTask extends BytezTask implements ImageToTextTaskHelper {
	preparePayloadAsync(args: ImageToTextArgs): Promise<RequestArgs> {
		const _args = args as Record<string, unknown>;
		return this._preparePayloadAsync(_args);
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			base64: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezStringLikeOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<ImageToTextOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return {
			generatedText: output,
			generated_text: output,
		};
	}
}

export class BytezQuestionAnsweringTask extends BytezTask implements QuestionAnsweringTaskHelper {
	override preparePayload(params: BodyParams<QuestionAnsweringInput & BaseArgs>): Record<string, unknown> {
		return {
			question: params.args.inputs.question,
			context: params.args.inputs.context,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezQuestionAnsweringOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<QuestionAnsweringOutput[number]> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		const { answer, score, start, end } = output;

		return {
			answer,
			score,
			start,
			end,
		};
	}
}

export class BytezVisualQuestionAnsweringTask extends BytezTask implements VisualQuestionAnsweringTaskHelper {
	override preparePayload(params: BodyParams<VisualQuestionAnsweringInput>): Record<string, unknown> {
		return {
			base64: params.args.inputs.image,
			question: params.args.inputs.question,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezVisualQuestionAnsweringOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<VisualQuestionAnsweringOutput[number]> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output[0];
	}
}

export class BytezDocumentQuestionAnsweringTask extends BytezTask implements DocumentQuestionAnsweringTaskHelper {
	override preparePayload(params: BodyParams<DocumentQuestionAnsweringInput>): Record<string, unknown> {
		return {
			base64: params.args.inputs.image,
			question: params.args.inputs.question,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezDocumentQuestionAnsweringOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<DocumentQuestionAnsweringOutput[number]> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output[0];
	}
}

export class BytezImageSegmentationTask extends BytezTask implements ImageSegmentationTaskHelper {
	preparePayloadAsync(args: ImageSegmentationArgs): Promise<RequestArgs> {
		return this._preparePayloadAsync(args);
	}

	override preparePayload(params: BodyParams<ImageSegmentationInput>): Record<string, unknown> {
		return {
			base64: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezImageSegmentationOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<ImageSegmentationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		// some models return no score, in which case we default to -1 to indicate that a number is expected, but no number was produced
		return output.map(({ label, score, mask_png }) => ({ label, score: score || -1, mask: mask_png }));
	}
}

export class BytezImageClassificationTask extends BytezTask implements ImageClassificationTaskHelper {
	preparePayloadAsync(args: ImageClassificationArgs): Promise<RequestArgs> {
		const _args = args as Record<string, unknown>;
		return this._preparePayloadAsync(_args);
	}

	override preparePayload(params: BodyParams<ImageClassificationInput>): Record<string, unknown> {
		return {
			base64: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezImageClassificationOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<ImageClassificationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

export class BytezZeroShotImageClassificationTask extends BytezTask implements ZeroShotImageClassificationTaskHelper {
	override preparePayload(
		params: BodyParams<ZeroShotImageClassificationInput & BaseArgs>
	): Record<string, unknown> | BodyInit {
		const candidate_labels = params.args.parameters.candidate_labels;

		return {
			base64: params.args.inputs,
			candidate_labels,
			params: { ...params.args.parameters, candidate_labels: undefined },
		};
	}

	override async getResponse(
		response: BytezZeroShotImageClassificationOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<ZeroShotImageClassificationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

export class BytezObjectDetectionTask extends BytezTask implements ObjectDetectionTaskHelper {
	async preparePayloadAsync(args: ObjectDetectionArgs): Promise<RequestArgs> {
		const _args = args as Record<string, unknown>;
		return this._preparePayloadAsync(_args);
	}

	override preparePayload(params: BodyParams<ObjectDetectionInput & BaseArgs>): Record<string, unknown> | BodyInit {
		return {
			base64: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezObjectDetectionOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<ObjectDetectionOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

// TODO this flattens the vectors, this may not be the desired behavior, see how our test model performs when hitting HF directly
// and compare the HF impl model's output through our own api
export class BytezFeatureExtractionTask extends BytezTask implements FeatureExtractionTaskHelper {
	override preparePayload(params: BodyParams<FeatureExtractionInput & BaseArgs>): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezFeatureExtractionOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<FeatureExtractionOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output.flat();
	}
}

export class BytezSentenceSimilarityTask extends BytezTask implements SentenceSimilarityTaskHelper {
	override preparePayload(params: BodyParams<SentenceSimilarityInput & BaseArgs>): Record<string, unknown> {
		return {
			text: [params.args.inputs.source_sentence, ...params.args.inputs.sentences],
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezSentenceSimilarityOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<SentenceSimilarityOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		const [sourceSentenceVector, ...sentenceVectors] = output;

		const similarityScores = [];

		for (const sentenceVector of sentenceVectors) {
			const similarity = this.cosineSimilarity(sourceSentenceVector, sentenceVector);
			similarityScores.push(similarity);
		}

		return similarityScores;
	}

	cosineSimilarity(a: number[], b: number[]): number {
		if (a.length !== b.length) throw new Error("Vectors must be same length");
		let dot = 0,
			normA = 0,
			normB = 0;
		for (let i = 0; i < a.length; i++) {
			dot += a[i] * b[i];
			normA += a[i] ** 2;
			normB += b[i] ** 2;
		}
		if (normA === 0 || normB === 0) return 0;
		return dot / (Math.sqrt(normA) * Math.sqrt(normB));
	}
}

export class BytezFillMaskTask extends BytezTask implements FillMaskTaskHelper {
	override preparePayload(params: BodyParams<FillMaskInput & BaseArgs>): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezSentenceFillMaskOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<FillMaskOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

export class BytezTextClassificationTask extends BytezTask implements TextClassificationTaskHelper {
	override preparePayload(params: BodyParams<ZeroShotClassificationInput & BaseArgs>): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezZeroShotImageClassificationOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<TextClassificationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

export class BytezTokenClassificationTask extends BytezTask implements TokenClassificationTaskHelper {
	override preparePayload(params: BodyParams<ZeroShotClassificationInput & BaseArgs>): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezTokenClassificationOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<TokenClassificationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output.map(({ end, entity, score, start, word }) => ({
			entity_group: entity,
			score,
			word,
			start,
			end,
		}));
	}
}

export class BytezZeroShotClassificationTask extends BytezTask implements ZeroShotClassificationTaskHelper {
	override preparePayload(params: BodyParams<ZeroShotClassificationInput & BaseArgs>): Record<string, unknown> {
		return {
			text: params.args.inputs,
			candidate_labels: params.args.parameters.candidate_labels,
			params: {
				...params.args.parameters,
				candidate_labels: undefined,
			},
		};
	}

	override async getResponse(
		response: BytezZeroShotImageClassificationOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<ZeroShotClassificationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

export class BytezAudioClassificationTask extends BytezTask implements AudioClassificationTaskHelper {
	async preparePayloadAsync(args: AudioClassificationArgs): Promise<RequestArgs> {
		const _args = args as Record<string, unknown>;
		return this._preparePayloadAsync(_args);
	}

	override preparePayload(params: BodyParams<AudioClassificationInput & BaseArgs>): Record<string, unknown> | BodyInit {
		return {
			base64: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezZeroShotImageClassificationOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<AudioClassificationOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return output;
	}
}

export class BytezTextToSpeechTask extends BytezTask implements TextToSpeechTaskHelper {
	override preparePayload(params: BodyParams<TextToSpeechInput & BaseArgs>): Record<string, unknown> {
		return {
			text: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(response: BytezStringLikeOutput, url?: string, headers?: HeadersInit): Promise<Blob> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		const byteArray = Buffer.from(output, "base64");
		return new Blob([byteArray], { type: "audio/wav" });
	}
}

export class BytezAutomaticSpeechRecognitionTask extends BytezTask implements AutomaticSpeechRecognitionTaskHelper {
	async preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
		const _args = args as Record<string, unknown>;
		return this._preparePayloadAsync(_args);
	}

	override preparePayload(params: BodyParams<AutomaticSpeechRecognitionInput & BaseArgs>): Record<string, unknown> {
		return {
			base64: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezStringLikeOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<AutomaticSpeechRecognitionOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return {
			text: output.trim(),
		};
	}
}

export class BytezTextToAudioTask extends BytezTask implements AutomaticSpeechRecognitionTaskHelper {
	async preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
		const _args = args as Record<string, unknown>;
		return this._preparePayloadAsync(_args);
	}

	override preparePayload(params: BodyParams<AutomaticSpeechRecognitionInput & BaseArgs>): Record<string, unknown> {
		return {
			base64: params.args.inputs,
			params: params.args.parameters,
		};
	}

	override async getResponse(
		response: BytezStringLikeOutput,
		url?: string,
		headers?: HeadersInit
	): Promise<AutomaticSpeechRecognitionOutput> {
		void url;
		void headers;

		const { error, output } = response;

		this.handleError(error);

		return {
			text: output.trim(),
		};
	}
}
