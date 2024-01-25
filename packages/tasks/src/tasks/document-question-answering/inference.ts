
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */


/**
 * Inputs for Document Question Answering inference
 */
export interface DocumentQuestionAnsweringInput {
    /**
     * One (document, question) pair to answer
     */
    input: DocumentQuestionAnsweringInputSingle;
    /**
     * Additional inference parameters
     */
    parameters?: DocumentQuestionAnsweringParameters;
    [property: string]: unknown;
}

/**
 * One (document, question) pair to answer
 */
export interface DocumentQuestionAnsweringInputSingle {
    /**
     * The image on which the question is asked
     */
    image: unknown;
    /**
     * A question to ask of the document
     */
    question: string;
    [property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Document Question Answering
 */
export interface DocumentQuestionAnsweringParameters {
    /**
     * If the words in the document are too long to fit with the question for the model, it will
     * be split in several chunks with some overlap. This argument controls the size of that
     * overlap.
     */
    docStride?: number;
    /**
     * Whether to accept impossible as an answer
     */
    handleImpossibleAnswer?: boolean;
    /**
     * Language to use while running OCR. Defaults to english.
     */
    lang?: string;
    /**
     * The maximum length of predicted answers (e.g., only answers with a shorter length are
     * considered).
     */
    maxAnswerLen?: number;
    /**
     * The maximum length of the question after tokenization. It will be truncated if needed.
     */
    maxQuestionLen?: number;
    /**
     * The maximum length of the total sentence (context + question) in tokens of each chunk
     * passed to the model. The context will be split in several chunks (using doc_stride as
     * overlap) if needed.
     */
    maxSeqLen?: number;
    /**
     * The number of answers to return (will be chosen by order of likelihood). Can return less
     * than top_k answers if there are not enough options available within the context.
     */
    topK?: number;
    /**
     * A list of words and bounding boxes (normalized 0->1000). If provided, the inference will
     * skip the OCR step and use the provided bounding boxes instead.
     */
    wordBoxes?: Array<number[] | string>;
    [property: string]: unknown;
}

/**
 * Outputs of inference for the Document Question Answering task
 */
export interface DocumentQuestionAnsweringOutput {
    /**
     * The answer to the question.
     */
    answer: string;
    end:    number;
    /**
     * The probability associated to the answer.
     */
    score: number;
    start: number;
    /**
     * The index of each word/box pair that is in the answer
     */
    words: number[];
    [property: string]: unknown;
}
