import type { PipelineType } from "./pipelines";

type TableData = Record<string, (string | number)[]>;

//#region outputs
export type WidgetExampleOutputLabels = Array<{ label: string; score: number }>;
export interface WidgetExampleOutputAnswerScore {
	answer: string;
	score: number;
}
export interface WidgetExampleOutputText {
	text: string;
}
export interface WidgetExampleOutputUrl {
	url: string;
}

export type WidgetExampleOutput =
	| WidgetExampleOutputLabels
	| WidgetExampleOutputAnswerScore
	| WidgetExampleOutputText
	| WidgetExampleOutputUrl;
//#endregion

export interface WidgetExampleBase<TOutput> {
	example_title?: string;
	group?: string;
	/**
	 * Potential overrides to API parameters for this specific example
	 * (takes precedences over the model card metadata's inference.parameters)
	 */
	parameters?: {
		/// token-classification
		aggregation_strategy?: string;
		/// text-generation
		top_k?: number;
		top_p?: number;
		temperature?: number;
		max_new_tokens?: number;
		do_sample?: boolean;
		/// text-to-image
		negative_prompt?: string;
		guidance_scale?: number;
		num_inference_steps?: number;
	};
	/**
	 * Optional output
	 */
	output?: TOutput;
}

export interface WidgetExampleTextInput<TOutput = WidgetExampleOutput> extends WidgetExampleBase<TOutput> {
	text: string;
}

export interface WidgetExampleTextAndContextInput<TOutput = WidgetExampleOutput>
	extends WidgetExampleTextInput<TOutput> {
	context: string;
}

export interface WidgetExampleTextAndTableInput<TOutput = WidgetExampleOutput> extends WidgetExampleTextInput<TOutput> {
	table: TableData;
}

export interface WidgetExampleAssetInput<TOutput = WidgetExampleOutput> extends WidgetExampleBase<TOutput> {
	src: string;
}
export interface WidgetExampleAssetAndPromptInput<TOutput = WidgetExampleOutput>
	extends WidgetExampleAssetInput<TOutput> {
	prompt: string;
}

export type WidgetExampleAssetAndTextInput<TOutput = WidgetExampleOutput> = WidgetExampleAssetInput<TOutput> &
	WidgetExampleTextInput<TOutput>;

export type WidgetExampleAssetAndZeroShotInput<TOutput = WidgetExampleOutput> = WidgetExampleAssetInput<TOutput> &
	WidgetExampleZeroShotTextInput<TOutput>;

export interface WidgetExampleStructuredDataInput<TOutput = WidgetExampleOutput> extends WidgetExampleBase<TOutput> {
	structured_data: TableData;
}

export interface WidgetExampleTableDataInput<TOutput = WidgetExampleOutput> extends WidgetExampleBase<TOutput> {
	table: TableData;
}

export interface WidgetExampleZeroShotTextInput<TOutput = WidgetExampleOutput> extends WidgetExampleTextInput<TOutput> {
	text: string;
	candidate_labels: string;
	multi_class: boolean;
}

export interface WidgetExampleSentenceSimilarityInput<TOutput = WidgetExampleOutput>
	extends WidgetExampleBase<TOutput> {
	source_sentence: string;
	sentences: string[];
}

//#endregion

export type WidgetExample<TOutput = WidgetExampleOutput> =
	| WidgetExampleTextInput<TOutput>
	| WidgetExampleTextAndContextInput<TOutput>
	| WidgetExampleTextAndTableInput<TOutput>
	| WidgetExampleAssetInput<TOutput>
	| WidgetExampleAssetAndPromptInput<TOutput>
	| WidgetExampleAssetAndTextInput<TOutput>
	| WidgetExampleAssetAndZeroShotInput<TOutput>
	| WidgetExampleStructuredDataInput<TOutput>
	| WidgetExampleTableDataInput<TOutput>
	| WidgetExampleZeroShotTextInput<TOutput>
	| WidgetExampleSentenceSimilarityInput<TOutput>;

type KeysOfUnion<T> = T extends unknown ? keyof T : never;

export type WidgetExampleAttribute = KeysOfUnion<WidgetExample>;

export enum InferenceDisplayability {
	/**
	 * Yes
	 */
	Yes = "Yes",
	/**
	 * And then, all the possible reasons why it's no:
	 */
	ExplicitOptOut = "ExplicitOptOut",
	CustomCode = "CustomCode",
	LibraryNotDetected = "LibraryNotDetected",
	PipelineNotDetected = "PipelineNotDetected",
	PipelineLibraryPairNotSupported = "PipelineLibraryPairNotSupported",
}

/**
 * Public interface for model metadata
 */
export interface ModelData {
	/**
	 * id of model (e.g. 'user/repo_name')
	 */
	id: string;
	/**
	 * Kept for backward compatibility
	 */
	modelId?: string;
	/**
	 * Whether or not to enable inference widget for this model
	 */
	inference: InferenceDisplayability;
	/**
	 * is this model private?
	 */
	private?: boolean;
	/**
	 * this dictionary has useful information about the model configuration
	 */
	config?: Record<string, unknown> & {
		adapter_transformers?: { model_class?: string; model_name?: string };
		architectures?: string[];
		sklearn?: {
			filename?: string;
			model_format?: string;
		};
		speechbrain?: {
			interface?: string;
		};
		peft?: {
			base_model_name?: string;
			task_type?: string;
		};
	};
	/**
	 * all the model tags
	 */
	tags?: string[];
	/**
	 * transformers-specific info to display in the code sample.
	 */
	transformersInfo?: TransformersInfo;
	/**
	 * Pipeline type
	 */
	pipeline_tag?: PipelineType | undefined;
	/**
	 * for relevant models, get mask token
	 */
	mask_token?: string | undefined;
	/**
	 * Example data that will be fed into the widget.
	 *
	 * can be set in the model card metadata (under `widget`),
	 * or by default in `DefaultWidget.ts`
	 */
	widgetData?: WidgetExample[] | undefined;
	/**
	 * Parameters that will be used by the widget when calling Inference API
	 * https://huggingface.co/docs/api-inference/detailed_parameters
	 *
	 * can be set in the model card metadata (under `inference/parameters`)
	 * Example:
	 * inference:
	 *     parameters:
	 *         key: val
	 */
	cardData?: {
		inference?:
			| boolean
			| {
					parameters?: Record<string, unknown>;
			  };
		base_model?: string;
	};
	/**
	 * Library name
	 * Example: transformers, SpeechBrain, Stanza, etc.
	 */
	library_name?: string;
}

/**
 * transformers-specific info to display in the code sample.
 */
export interface TransformersInfo {
	/**
	 * e.g. AutoModelForSequenceClassification
	 */
	auto_model: string;
	/**
	 * if set in config.json's auto_map
	 */
	custom_class?: string;
	/**
	 * e.g. text-classification
	 */
	pipeline_tag?: PipelineType;
	/**
	 * e.g. "AutoTokenizer" | "AutoFeatureExtractor" | "AutoProcessor"
	 */
	processor?: string;
}
