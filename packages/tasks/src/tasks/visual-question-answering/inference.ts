/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Visual Question Answering inference
 */
export interface VisualQuestionAnsweringInput {
	/**
	 * One or more image-question pairs
	 */
	inputs: VisualQuestionAnsweringInputElement[] | VisualQuestionAnsweringInputElement;
	/**
	 * Additional inference parameters
	 */
	parameters?: VisualQuestionAnsweringParameters;
	[property: string]: any;
}

export interface VisualQuestionAnsweringInputElement {
	/**
	 * The image.
	 */
	image: any;
	/**
	 * The question to answer based on the image.
	 */
	question: any;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Visual Question Answering
 */
export interface VisualQuestionAnsweringParameters {
	/**
	 * The number of answers to return (will be chosen by order of likelihood). Note that we
	 * return less than topk answers if there are not enough options available within the
	 * context.
	 */
	topK?: number;
	[property: string]: any;
}

/**
 * Outputs of inference for the Visual Question Answering task
 */
export interface VisualQuestionAnsweringOutput {
	/**
	 * The answer to the question
	 */
	answer?: string;
	label: any;
	/**
	 * The associated score / probability
	 */
	score: number;
	[property: string]: any;
}
