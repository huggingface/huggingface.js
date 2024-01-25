
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */


/**
 * Inputs for Question Answering inference
 */
export interface QuestionAnsweringInput {
    /**
     * One (context, question) pair to answer
     */
    input: Input;
    /**
     * Additional inference parameters
     */
    parameters?: QuestionAnsweringParameters;
    [property: string]: unknown;
}

/**
 * One (context, question) pair to answer
 */
export interface Input {
    /**
     * The context to be used for answering the question
     */
    context: string;
    /**
     * The question to be answered
     */
    question: string;
    [property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Question Answering
 */
export interface QuestionAnsweringParameters {
    /**
     * Attempts to align the answer to real words. Improves quality on space separated
     * languages. Might hurt on non-space-separated languages (like Japanese or Chinese)
     */
    alignToWords?: boolean;
    /**
     * If the context is too long to fit with the question for the model, it will be split in
     * several chunks with some overlap. This argument controls the size of that overlap.
     */
    docStride?: number;
    /**
     * Whether to accept impossible as an answer.
     */
    handleImpossibleAnswer?: boolean;
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
     * passed to the model. The context will be split in several chunks (using docStride as
     * overlap) if needed.
     */
    maxSeqLen?: number;
    /**
     * The number of answers to return (will be chosen by order of likelihood). Note that we
     * return less than topk answers if there are not enough options available within the
     * context.
     */
    topK?: number;
    [property: string]: unknown;
}

/**
 * Outputs of inference for the Question Answering task
 */
export interface QuestionAnsweringOutput {
    /**
     * The answer to the question.
     */
    answer: string;
    /**
     * The character position in the input where the answer ends.
     */
    end: number;
    /**
     * The probability associated to the answer.
     */
    score: number;
    /**
     * The character position in the input where the answer begins.
     */
    start: number;
    [property: string]: unknown;
}
