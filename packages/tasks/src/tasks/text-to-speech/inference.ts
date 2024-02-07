/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Text to Speech inference
 *
 * Inputs for Text To Audio inference
 */
export interface TextToSpeechInput {
	/**
	 * The input text data
	 */
	data: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TextToAudioParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text To Audio
 */
export interface TextToAudioParameters {
	/**
	 * Parametrization of the text generation process
	 */
	generate?: GenerationParameters;
	[property: string]: unknown;
}

/**
 * Parametrization of the text generation process
 *
 * Ad-hoc parametrization of the text generation process
 */
export interface GenerationParameters {
	/**
	 * Whether to use sampling instead of greedy decoding when generating new tokens.
	 */
	doSample?: boolean;
	/**
	 * Controls the stopping condition for beam-based methods.
	 */
	earlyStopping?: EarlyStoppingUnion;
	/**
	 * If set to float strictly between 0 and 1, only tokens with a conditional probability
	 * greater than epsilon_cutoff will be sampled. In the paper, suggested values range from
	 * 3e-4 to 9e-4, depending on the size of the model. See [Truncation Sampling as Language
	 * Model Desmoothing](https://hf.co/papers/2210.15191) for more details.
	 */
	epsilonCutoff?: number;
	/**
	 * Eta sampling is a hybrid of locally typical sampling and epsilon sampling. If set to
	 * float strictly between 0 and 1, a token is only considered if it is greater than either
	 * eta_cutoff or sqrt(eta_cutoff) * exp(-entropy(softmax(next_token_logits))). The latter
	 * term is intuitively the expected next token probability, scaled by sqrt(eta_cutoff). In
	 * the paper, suggested values range from 3e-4 to 2e-3, depending on the size of the model.
	 * See [Truncation Sampling as Language Model Desmoothing](https://hf.co/papers/2210.15191)
	 * for more details.
	 */
	etaCutoff?: number;
	/**
	 * The maximum length (in tokens) of the generated text, including the input.
	 */
	maxLength?: number;
	/**
	 * The maximum number of tokens to generate. Takes precedence over maxLength.
	 */
	maxNewTokens?: number;
	/**
	 * The minimum length (in tokens) of the generated text, including the input.
	 */
	minLength?: number;
	/**
	 * The minimum number of tokens to generate. Takes precedence over maxLength.
	 */
	minNewTokens?: number;
	/**
	 * Number of groups to divide num_beams into in order to ensure diversity among different
	 * groups of beams. See [this paper](https://hf.co/papers/1610.02424) for more details.
	 */
	numBeamGroups?: number;
	/**
	 * Number of beams to use for beam search.
	 */
	numBeams?: number;
	/**
	 * The value balances the model confidence and the degeneration penalty in contrastive
	 * search decoding.
	 */
	penaltyAlpha?: number;
	/**
	 * The value used to modulate the next token probabilities.
	 */
	temperature?: number;
	/**
	 * The number of highest probability vocabulary tokens to keep for top-k-filtering.
	 */
	topK?: number;
	/**
	 * If set to float < 1, only the smallest set of most probable tokens with probabilities
	 * that add up to top_p or higher are kept for generation.
	 */
	topP?: number;
	/**
	 * Local typicality measures how similar the conditional probability of predicting a target
	 * token next is to the expected conditional probability of predicting a random token next,
	 * given the partial text already generated. If set to float < 1, the smallest set of the
	 * most locally typical tokens with probabilities that add up to typical_p or higher are
	 * kept for generation. See [this paper](https://hf.co/papers/2202.00666) for more details.
	 */
	typicalP?: number;
	/**
	 * Whether the model should use the past last key/values attentions to speed up decoding
	 */
	useCache?: boolean;
	[property: string]: unknown;
}

/**
 * Controls the stopping condition for beam-based methods.
 */
export type EarlyStoppingUnion = boolean | "never";

/**
 * Outputs for Text to Speech inference
 *
 * Outputs of inference for the Text To Audio task
 */
export interface TextToSpeechOutput {
	/**
	 * The generated audio waveform.
	 */
	audio: unknown;
	samplingRate: unknown;
	/**
	 * The sampling rate of the generated audio waveform.
	 */
	textToSpeechOutputSamplingRate?: number;
	[property: string]: unknown;
}
