export interface Options {
	/**
	 * (Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true.
	 */
	retry_on_error?: boolean;
	/**
	 * (Default: true). Boolean. There is a cache layer on the inference API to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query.
	 */
	use_cache?: boolean;
	/**
	 * (Default: false). Boolean. Do not load the model if it's not already available.
	 */
	dont_load_model?: boolean;
	/**
	 * (Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least).
	 */
	use_gpu?: boolean;

	/**
	 * (Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.
	 */
	wait_for_model?: boolean;
}

export interface Args {
	/**
	 * The access token to use. Without it, you'll get rate-limited quickly.
	 *
	 * Can be created for free in hf.co/settings/token
	 */
	accessToken?: string;
	/**
	 * The model to use. Can be a full URL for HF inference endpoints.
	 */
	model: string;
}

export type RequestArgs = Args &
	({ data?: Blob | ArrayBuffer } | { inputs: unknown }) & {
		parameters?: Record<string, unknown>;
		accessToken?: string;
	};

export type FillMaskArgs = Args & {
	inputs: string;
};

export type FillMaskReturn = {
	/**
	 * The probability for this token.
	 */
	score: number;
	/**
	 * The actual sequence of tokens that ran against the model (may contain special tokens)
	 */
	sequence: string;
	/**
	 * The id of the token
	 */
	token: number;
	/**
	 * The string representation of the token
	 */
	token_str: string;
}[];

export type SummarizationArgs = Args & {
	/**
	 * A string to be summarized
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?: number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface SummarizationReturn {
	/**
	 * The string after translation
	 */
	summary_text: string;
}

export type QuestionAnsweringArgs = Args & {
	inputs: {
		context: string;
		question: string;
	};
};

export interface QuestionAnsweringReturn {
	/**
	 * A string that’s the answer within the text.
	 */
	answer: string;
	/**
	 * The index (string wise) of the stop of the answer within context.
	 */
	end: number;
	/**
	 * A float that represents how likely that the answer is correct
	 */
	score: number;
	/**
	 * The index (string wise) of the start of the answer within context.
	 */
	start: number;
}

export type TableQuestionAnsweringArgs = Args & {
	inputs: {
		/**
		 * The query in plain text that you want to ask the table
		 */
		query: string;
		/**
		 * A table of data represented as a dict of list where entries are headers and the lists are all the values, all lists must have the same size.
		 */
		table: Record<string, string[]>;
	};
};

export interface TableQuestionAnsweringReturn {
	/**
	 * The aggregator used to get the answer
	 */
	aggregator: string;
	/**
	 * The plaintext answer
	 */
	answer: string;
	/**
	 * A list of coordinates of the cells contents
	 */
	cells: string[];
	/**
	 * a list of coordinates of the cells referenced in the answer
	 */
	coordinates: number[][];
}

export type TextClassificationArgs = Args & {
	/**
	 * A string to be classified
	 */
	inputs: string;
};

export type TextClassificationReturn = {
	/**
	 * The label for the class (model specific)
	 */
	label: string;
	/**
	 * A floats that represents how likely is that the text belongs to this class.
	 */
	score: number;
}[];

export type TextGenerationArgs = Args & {
	/**
	 * A string to be generated from
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise.
		 */
		do_sample?: boolean;
		/**
		 * (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated.
		 */
		max_new_tokens?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results.
		 */
		max_time?: number;
		/**
		 * (Default: 1). Integer. The number of proposition you want to be returned.
		 */
		num_return_sequences?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting.
		 */
		return_full_text?: boolean;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface TextGenerationReturn {
	/**
	 * The continuated string
	 */
	generated_text: string;
}

export interface TextGenerationStreamToken {
	/** Token ID from the model tokenizer */
	id: number;
	/** Token text */
	text: string;
	/** Logprob */
	logprob: number;
	/**
	 * Is the token a special token
	 * Can be used to ignore tokens when concatenating
	 */
	special: boolean;
}

export interface TextGenerationStreamPrefillToken {
	/** Token ID from the model tokenizer */
	id: number;
	/** Token text */
	text: string;
	/**
	 * Logprob
	 * Optional since the logprob of the first token cannot be computed
	 */
	logprob?: number;
}

export interface TextGenerationStreamBestOfSequence {
	/** Generated text */
	generated_text: string;
	/** Generation finish reason */
	finish_reason: TextGenerationStreamFinishReason;
	/** Number of generated tokens */
	generated_tokens: number;
	/** Sampling seed if sampling was activated */
	seed?: number;
	/** Prompt tokens */
	prefill: TextGenerationStreamPrefillToken[];
	/** Generated tokens */
	tokens: TextGenerationStreamToken[];
}

export enum TextGenerationStreamFinishReason {
	/** number of generated tokens == `max_new_tokens` */
	Length = "length",
	/** the model generated its end of sequence token */
	EndOfSequenceToken = "eos_token",
	/** the model generated a text included in `stop_sequences` */
	StopSequence = "stop_sequence",
}

export interface TextGenerationStreamDetails {
	/** Generation finish reason */
	finish_reason: TextGenerationStreamFinishReason;
	/** Number of generated tokens */
	generated_tokens: number;
	/** Sampling seed if sampling was activated */
	seed?: number;
	/** Prompt tokens */
	prefill: TextGenerationStreamPrefillToken[];
	/** */
	tokens: TextGenerationStreamToken[];
	/** Additional sequences when using the `best_of` parameter */
	best_of_sequences?: TextGenerationStreamBestOfSequence[];
}

export interface TextGenerationStreamReturn {
	/** Generated token, one at a time */
	token: TextGenerationStreamToken;
	/**
	 * Complete generated text
	 * Only available when the generation is finished
	 */
	generated_text: string | null;
	/**
	 * Generation details
	 * Only available when the generation is finished
	 */
	details: TextGenerationStreamDetails | null;
}

export type TokenClassificationArgs = Args & {
	/**
	 * A string to be classified
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Default: simple). There are several aggregation strategies:
		 *
		 * none: Every token gets classified without further aggregation.
		 *
		 * simple: Entities are grouped according to the default schema (B-, I- tags get merged when the tag is similar).
		 *
		 * first: Same as the simple strategy except words cannot end up with different tags. Words will use the tag of the first token when there is ambiguity.
		 *
		 * average: Same as the simple strategy except words cannot end up with different tags. Scores are averaged across tokens and then the maximum label is applied.
		 *
		 * max: Same as the simple strategy except words cannot end up with different tags. Word entity will be the token with the maximum score.
		 */
		aggregation_strategy?: "none" | "simple" | "first" | "average" | "max";
	};
};

export interface TokenClassificationReturnValue {
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	end: number;
	/**
	 * The type for the entity being recognized (model specific).
	 */
	entity_group: string;
	/**
	 * How likely the entity was recognized.
	 */
	score: number;
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	start: number;
	/**
	 * The string that was captured
	 */
	word: string;
}

export type TokenClassificationReturn = TokenClassificationReturnValue[];

export type TranslationArgs = Args & {
	/**
	 * A string to be translated
	 */
	inputs: string;
};

export interface TranslationReturn {
	/**
	 * The string after translation
	 */
	translation_text: string;
}

export type ZeroShotClassificationArgs = Args & {
	/**
	 * a string or list of strings
	 */
	inputs: string | string[];
	parameters: {
		/**
		 * a list of strings that are potential classes for inputs. (max 10 candidate_labels, for more, simply run multiple requests, results are going to be misleading if using too many candidate_labels anyway. If you want to keep the exact same, you can simply run multi_label=True and do the scaling on your end.
		 */
		candidate_labels: string[];
		/**
		 * (Default: false) Boolean that is set to True if classes can overlap
		 */
		multi_label?: boolean;
	};
};

export interface ZeroShotClassificationReturnValue {
	labels: string[];
	scores: number[];
	sequence: string;
}

export type ZeroShotClassificationReturn = ZeroShotClassificationReturnValue[];

export type ConversationalArgs = Args & {
	inputs: {
		/**
		 * A list of strings corresponding to the earlier replies from the model.
		 */
		generated_responses?: string[];
		/**
		 * A list of strings corresponding to the earlier replies from the user. Should be of the same length of generated_responses.
		 */
		past_user_inputs?: string[];
		/**
		 * The last input from the user in the conversation.
		 */
		text: string;
	};
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?: number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface ConversationalReturn {
	conversation: {
		generated_responses: string[];
		past_user_inputs: string[];
	};
	generated_text: string;
	warnings: string[];
}
export type FeatureExtractionArgs = Args & {
	/**
	 *  The inputs is a string or a list of strings to get the features from.
	 *
	 *  inputs: "That is a happy person",
	 *
	 */
	inputs: string | string[];
};

/**
 * Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.
 */
export type FeatureExtractionReturn = (number | number[])[];

export type SentenceSimilarityArgs = Args & {
	/**
	 * The inputs vary based on the model. For example when using sentence-transformers/paraphrase-xlm-r-multilingual-v1 the inputs will look like this:
	 *
	 *  inputs: &#123;
	 *    "source_sentence": "That is a happy person",
	 *    "sentences": ["That is a happy dog", "That is a very happy person", "Today is a sunny day"]
	 *  &#125;
	 */
	inputs: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Returned values are a list of floats
 */
export type SentenceSimilarityReturn = number[];

export type ImageClassificationArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageClassificationReturnValue {
	/**
	 * A float that represents how likely it is that the image file belongs to this class.
	 */
	label: string;
	/**
	 * The label for the class (model specific)
	 */
	score: number;
}

export type ImageClassificationReturn = ImageClassificationReturnValue[];

export type ObjectDetectionArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ObjectDetectionReturnValue {
	/**
	 * A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.
	 */
	box: {
		xmax: number;
		xmin: number;
		ymax: number;
		ymin: number;
	};
	/**
	 * The label for the class (model specific) of a detected object.
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
}

export type ObjectDetectionReturn = ObjectDetectionReturnValue[];

export type ImageSegmentationArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageSegmentationReturnValue {
	/**
	 * The label for the class (model specific) of a segment.
	 */
	label: string;
	/**
	 * A str (base64 str of a single channel black-and-white img) representing the mask of a segment.
	 */
	mask: string;
	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
}

export type ImageSegmentationReturn = ImageSegmentationReturnValue[];

export type AutomaticSpeechRecognitionArgs = Args & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AutomaticSpeechRecognitionReturn {
	/**
	 * The text that was recognized from the audio
	 */
	text: string;
}

export type AudioClassificationArgs = Args & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AudioClassificationReturnValue {
	/**
	 * The label for the class (model specific)
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the audio file belongs to this class.
	 */
	score: number;
}

export type AudioClassificationReturn = AudioClassificationReturnValue[];

export type TextToImageArgs = Args & {
	/**
	 * The text to generate an image from
	 */
	inputs: string;

	parameters?: {
		/**
		 * An optional negative prompt for the image generation
		 */
		negative_prompt?: string;
		/**
		 * The height in pixels of the generated image
		 */
		height?: number;
		/**
		 * The width in pixels of the generated image
		 */
		width?: number;
		/**
		 * The number of denoising steps. More denoising steps usually lead to a higher quality image at the expense of slower inference.
		 */
		num_inference_steps?: number;
		/**
		 * Guidance scale: Higher guidance scale encourages to generate images that are closely linked to the text `prompt`, usually at the expense of lower image quality.
		 */
		guidance_scale?: number;
	};
};

export type TextToImageReturn = Blob;

export type ImageToTextArgs = Args & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageToTextReturn {
	/**
	 * The generated caption
	 */
	generated_text: string;
}
