/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Visual Document Retrieval inference
 */
export interface VisualDocumentRetrievalInput {
	/**
	 * The query or list of queries to
	 */
	inputs: VisualDocumentRetrievalInputData;
	/**
	 * Additional inference parameters for Visual Document Retrieval
	 */
	parameters?: VisualDocumentRetrievalParameters;
	[property: string]: unknown;
}
/**
 * The query or list of queries to
 */
export type VisualDocumentRetrievalInputData = string[] | string;
/**
 * Additional inference parameters for Visual Document Retrieval
 */
export interface VisualDocumentRetrievalParameters {
	/**
	 * The number of answers to return (will be chosen by order of likelihood). Note that we
	 * return less than topk answers if there are not enough options available within the
	 * context.
	 */
	top_k?: number;
	[property: string]: unknown;
}
export type VisualDocumentRetrievalOutput = VisualDocumentRetrievalOutputElement[];
/**
 * Outputs of inference for the Visual Document Retrieval task
 */
export interface VisualDocumentRetrievalOutputElement {
	/**
	 * The page index of the document
	 */
	page_index: number;
	/**
	 * The associated score / probability
	 */
	score: number;
	[property: string]: unknown;
}
