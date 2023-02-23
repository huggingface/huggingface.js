export type Options = {
	/**
	 * (Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true.
	 */
	retry_on_error?: boolean;
	/**
	 * (Default: true). Boolean. There is a cache layer on the inference API to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query.
	 */
	use_cache?:      boolean;
	/**
	 * (Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least).
	 */
	use_gpu?:        boolean;

	/**
	 * (Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.
	 */
	wait_for_model?: boolean;
};

export type Args = {
	model: string;
};

export type FillMaskArgs = Args & {
	inputs: string;
};

export type FillMaskReturn = {
	/**
	 * The probability for this token.
	 */
	score:     number;
	/**
	 * The actual sequence of tokens that ran against the model (may contain special tokens)
	 */
	sequence:  string;
	/**
	 * The id of the token
	 */
	token:     number;
	/**
	 * The string representation of the token
	 */
	token_str: string;
}[];

export type SummarizationArgs = Args & {
	/**
	 * A string to be summarized
	 */
	inputs:      string;
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?:         number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?:           number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?:         number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?:        number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?:              number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?:              number;
	};
};

export type SummarizationReturn = {
	/**
	 * The string after translation
	 */
	summary_text: string;
};

export type QuestionAnswerArgs = Args & {
	inputs: {
		context:  string;
		question: string;
	};
};

export type QuestionAnswerReturn = {
	/**
	 * A string that’s the answer within the text.
	 */
	answer: string;
	/**
	 * The index (string wise) of the stop of the answer within context.
	 */
	end:    number;
	/**
	 * A float that represents how likely that the answer is correct
	 */
	score:  number;
	/**
	 * The index (string wise) of the start of the answer within context.
	 */
	start:  number;
};

export type TableQuestionAnswerArgs = Args & {
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

export type TableQuestionAnswerReturn = {
	/**
	 * The aggregator used to get the answer
	 */
	aggregator:  string;
	/**
	 * The plaintext answer
	 */
	answer:      string;
	/**
	 * A list of coordinates of the cells contents
	 */
	cells:       string[];
	/**
	 * a list of coordinates of the cells referenced in the answer
	 */
	coordinates: number[][];
};

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
	inputs:      string;
	parameters?: {
		/**
		 * (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise.
		 */
		do_sample?:            boolean;
		/**
		 * (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated.
		 */
		max_new_tokens?:       number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results.
		 */
		max_time?:             number;
		/**
		 * (Default: 1). Integer. The number of proposition you want to be returned.
		 */
		num_return_sequences?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?:   number;
		/**
		 * (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting.
		 */
		return_full_text?:     boolean;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?:          number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?:                number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?:                number;
	};
};

export type TextGenerationReturn = {
	/**
	 * The continuated string
	 */
	generated_text: string;
};

export type TokenClassificationArgs = Args & {
	/**
	 * A string to be classified
	 */
	inputs:      string;
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

export type TokenClassificationReturnValue = {
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	end:          number;
	/**
	 * The type for the entity being recognized (model specific).
	 */
	entity_group: string;
	/**
	 * How likely the entity was recognized.
	 */
	score:        number;
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	start:        number;
	/**
	 * The string that was captured
	 */
	word:         string;
};

export type TokenClassificationReturn = TokenClassificationReturnValue[];

export type TranslationArgs = Args & {
	/**
	 * A string to be translated
	 */
	inputs: string;
};

export type TranslationReturn = {
	/**
	 * The string after translation
	 */
	translation_text: string;
};

export type ZeroShotClassificationArgs = Args & {
	/**
	 * a string or list of strings
	 */
	inputs:     string | string[];
	parameters: {
		/**
		 * a list of strings that are potential classes for inputs. (max 10 candidate_labels, for more, simply run multiple requests, results are going to be misleading if using too many candidate_labels anyway. If you want to keep the exact same, you can simply run multi_label=True and do the scaling on your end.
		 */
		candidate_labels: string[];
		/**
		 * (Default: false) Boolean that is set to True if classes can overlap
		 */
		multi_label?:     boolean;
	};
};

export type ZeroShotClassificationReturnValue = {
	labels:   string[];
	scores:   number[];
	sequence: string;
};

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
		past_user_inputs?:    string[];
		/**
		 * The last input from the user in the conversation.
		 */
		text:                 string;
	};
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?:         number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?:           number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?:         number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?:        number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?:              number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?:              number;
	};
};

export type ConversationalReturn = {
	conversation: {
		generated_responses: string[];
		past_user_inputs:    string[];
	};
	generated_text: string;
	warnings:       string[];
};

export type FeatureExtractionArgs = Args & {
	/**
	 * The inputs vary based on the model. For example when using sentence-transformers/paraphrase-xlm-r-multilingual-v1 the inputs will look like this:
	 *
	 *  inputs: {
	 *    "source_sentence": "That is a happy person",
	 *    "sentences": ["That is a happy dog", "That is a very happy person", "Today is a sunny day"]
	 */
	inputs: Record<string, any> | Record<string, any>[];
};

/**
 * Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.
 */
export type FeatureExtractionReturn = (number | number[])[];

export type ImageClassificationArgs = Args & {
	/**
	 * Binary image data
	 */
	data: any;
};

export type ImageClassificationReturnValue = {
	/**
	 * A float that represents how likely it is that the image file belongs to this class.
	 */
	label: string;
	/**
	 * The label for the class (model specific)
	 */
	score: number;
};

export type ImageClassificationReturn = ImageClassificationReturnValue[];

export type ObjectDetectionArgs = Args & {
	/**
	 * Binary image data
	 */
	data: any;
};

export type ObjectDetectionReturnValue = {
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
};

export type ObjectDetectionReturn = ObjectDetectionReturnValue[];

export type ImageSegmentationArgs = Args & {
	/**
	 * Binary image data
	 */
	data: any;
};

export type ImageSegmentationReturnValue = {
	/**
	 * The label for the class (model specific) of a segment.
	 */
	label: string;
	/**
	 * A str (base64 str of a single channel black-and-white img) representing the mask of a segment.
	 */
	mask:  string;
	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
};

export type ImageSegmentationReturn = ImageSegmentationReturnValue[];

export type AutomaticSpeechRecognitionArgs = Args & {
	/**
	 * Binary audio data
	 */
	data: any;
};

export type AutomaticSpeechRecognitionReturn = {
	/**
	 * The text that was recognized from the audio
	 */
	text: string;
};

export type AudioClassificationArgs = Args & {
	/**
	 * Binary audio data
	 */
	data: any;
};

export type AudioClassificationReturnValue = {
	/**
	 * The label for the class (model specific)
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the audio file belongs to this class.
	 */
	score: number;
};

export type AudioClassificationReturn = AudioClassificationReturnValue[];

export class HfInference {
	private readonly apiKey:         string;
	private readonly defaultOptions: Options;

	constructor(apiKey: string, defaultOptions: Options = {}) {
		this.apiKey = apiKey;
		this.defaultOptions = defaultOptions;
	}

	/**
	 * Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.
	 */
	public async fillMask(args: FillMaskArgs, options?: Options): Promise<FillMaskReturn> {
		return this.request(args, options);
	}

	/**
	 * This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.
	 */
	public async summarization(args: SummarizationArgs, options?: Options): Promise<SummarizationReturn> {
		return (await this.request(args, options))?.[0];
	}

	/**
	 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
	 */
	public async questionAnswer(args: QuestionAnswerArgs, options?: Options): Promise<QuestionAnswerReturn> {
		return await this.request(args, options);
	}

	/**
	 * Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.
	 */
	public async tableQuestionAnswer(
		args: TableQuestionAnswerArgs,
		options?: Options
	): Promise<TableQuestionAnswerReturn> {
		return await this.request(args, options);
	}

	/**
	 * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
	 */
	public async textClassification(args: TextClassificationArgs, options?: Options): Promise<TextClassificationReturn> {
		return (await this.request(args, options))?.[0];
	}

	/**
	 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
	 */
	public async textGeneration(args: TextGenerationArgs, options?: Options): Promise<TextGenerationReturn> {
		return (await this.request(args, options))?.[0];
	}

	/**
	 * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
	 */
	public async tokenClassification(
		args: TokenClassificationArgs,
		options?: Options
	): Promise<TokenClassificationReturn> {
		return HfInference.toArray(await this.request(args, options));
	}

	/**
	 * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
	 */
	public async translation(args: TranslationArgs, options?: Options): Promise<TranslationReturn> {
		return (await this.request(args, options))?.[0];
	}

	/**
	 * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
	 */
	public async zeroShotClassification(
		args: ZeroShotClassificationArgs,
		options?: Options
	): Promise<ZeroShotClassificationReturn> {
		return HfInference.toArray(await this.request(args, options));
	}

	/**
	 * This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.
	 *
	 */
	public async conversational(args: ConversationalArgs, options?: Options): Promise<ConversationalReturn> {
		return await this.request(args, options);
	}

	/**
	 * This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.
	 */
	public async featureExtraction(args: FeatureExtractionArgs, options?: Options): Promise<FeatureExtractionReturn> {
		return await this.request(args, options);
	}

	/**
	 * This task reads some audio input and outputs the said words within the audio files.
	 * Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self
	 */
	public async automaticSpeechRecognition(
		args: AutomaticSpeechRecognitionArgs,
		options?: Options
	): Promise<AutomaticSpeechRecognitionReturn> {
		return await this.request(args, {
			...options,
			binary: true,
		});
	}

	/**
	 * This task reads some audio input and outputs the likelihood of classes.
	 * Recommended model:  superb/hubert-large-superb-er
	 */
	public async audioClassification(
		args: AudioClassificationArgs,
		options?: Options
	): Promise<AudioClassificationReturn> {
		return await this.request(args, {
			...options,
			binary: true,
		});
	}

	/**
	 * This task reads some image input and outputs the likelihood of classes.
	 * Recommended model: google/vit-base-patch16-224
	 */
	public async imageClassification(
		args: ImageClassificationArgs,
		options?: Options
	): Promise<ImageClassificationReturn> {
		return await this.request(args, {
			...options,
			binary: true,
		});
	}

	/**
	 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
	 * Recommended model: facebook/detr-resnet-50
	 */
	public async objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionReturn> {
		return await this.request(args, {
			...options,
			binary: true,
		});
	}

	/**
	 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
	 * Recommended model: facebook/detr-resnet-50-panoptic
	 */
	public async imageSegmentation(args: ImageSegmentationArgs, options?: Options): Promise<ImageSegmentationReturn> {
		return await this.request(args, {
			...options,
			binary: true,
		});
	}

	public async request(
		args: Args & { data?: any },
		options?: Options & {
			binary?: boolean;
		}
	): Promise<any> {
		const mergedOptions = { ...this.defaultOptions, ...options };
		const { model, ...otherArgs } = args;
		const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
			headers: { Authorization: `Bearer ${this.apiKey}` },
			method:  "POST",
			body:    options?.binary
				? args.data
				: JSON.stringify({
						...otherArgs,
						options: mergedOptions,
				  }),
		});

		if (mergedOptions.retry_on_error !== false && response.status === 503 && !mergedOptions.wait_for_model) {
			return this.request(args, {
				...mergedOptions,
				wait_for_model: true,
			});
		}

		const res = await response.json();
		if (res.error) {
			throw new Error(res.error);
		}
		return res;
	}

	private static toArray(obj: any): any[] {
		if (Array.isArray(obj)) {
			return obj;
		}
		return [obj];
	}
}
