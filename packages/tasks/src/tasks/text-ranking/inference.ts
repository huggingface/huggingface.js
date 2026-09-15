/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Text Ranking inference
 */
export interface TextRankingInput {
	inputs: TextRankingInputData;
	[property: string]: unknown;
}
export interface TextRankingInputData {
	/**
	 * The query to rank the documents against.
	 */
	query: string;
	/**
	 * Whether to include the document text in the output.
	 */
	return_documents?: boolean;
	/**
	 * The documents to rank.
	 */
	texts: string[];
	[property: string]: unknown;
}
export type TextRankingOutput = TextRankingOutputElement[];
/**
 * Documents ranked by relevance to the query, in descending score order.
 */
export interface TextRankingOutputElement {
	/**
	 * The index of the document in the input texts.
	 */
	index: number;
	/**
	 * The relevance score of the document.
	 */
	score: number;
	/**
	 * The document text, included when return_documents is true.
	 */
	text?: string;
	[property: string]: unknown;
}
