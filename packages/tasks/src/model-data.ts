import type { PipelineType } from "./pipelines";
import type { WidgetExample } from "./widget-example";
import { TokenizerConfig } from "./tokenizer-data";

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
		tokenizer?: TokenizerConfig;
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
	 * Parameters that will be used by the widget when calling Inference Endpoints (serverless)
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
		base_model?: string | string[];
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
