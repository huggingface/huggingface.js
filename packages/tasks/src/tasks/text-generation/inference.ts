
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */


/**
 * Inputs for Text Generation inference
 */
export interface TextGenerationInput {
    /**
     * The text to initialize generation with
     */
    input: string;
    /**
     * Additional inference parameters
     */
    parameters?: TextGenerationParameters;
    [property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text Generation
 */
export interface TextGenerationParameters {
    /**
     * Whether to use logit sampling (true) or greedy search (false).
     */
    doSample?: boolean;
    /**
     * Maximum number of generated tokens.
     */
    maxNewTokens?: number;
    /**
     * The parameter for repetition penalty. A value of 1.0 means no penalty. See [this
     * paper](https://hf.co/papers/1909.05858) for more details.
     */
    repetitionPenalty?: number;
    /**
     * Whether to prepend the prompt to the generated text.
     */
    returnFullText?: boolean;
    /**
     * Stop generating tokens if a member of `stop_sequences` is generated.
     */
    stopSequences?: string[];
    /**
     * The value used to modulate the logits distribution.
     */
    temperature?: number;
    /**
     * The number of highest probability vocabulary tokens to keep for top-k-filtering.
     */
    topK?: number;
    /**
     * If set to < 1, only the smallest set of most probable tokens with probabilities that add
     * up to `top_p` or higher are kept for generation.
     */
    topP?: number;
    /**
     * Truncate input tokens to the given size.
     */
    truncate?: number;
    /**
     * Typical Decoding mass. See [Typical Decoding for Natural Language
     * Generation](https://hf.co/papers/2202.00666) for more information
     */
    typicalP?: number;
    /**
     * Watermarking with [A Watermark for Large Language Models](https://hf.co/papers/2301.10226)
     */
    watermark?: boolean;
    [property: string]: unknown;
}

/**
 * Outputs for Text Generation inference
 */
export interface TextGenerationOutput {
    /**
     * The generated text
     */
    generatedText: string;
    [property: string]: unknown;
}
