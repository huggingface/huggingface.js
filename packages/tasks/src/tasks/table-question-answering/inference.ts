/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
 */

/**
 * Inputs for Table Question Answering inference
 */
export interface TableQuestionAnsweringInput {
	/**
	 * One or several questions about a table
	 */
	inputs: Inputs;
	/**
	 * Additional inference parameters
	 */
	parameters?: { [key: string]: any };
	[property: string]: any;
}

/**
 * One or several questions about a table
 */
export interface Inputs {
	/**
	 * One or several questions to be answered about the table
	 */
	question?: string[] | string;
	/**
	 * The table to serve as context for the questions
	 */
	table?: { [key: string]: any };
	[property: string]: any;
}

/**
 * Outputs of inference for the Table Question Answering task
 */
export interface TableQuestionAnsweringOutput {
	/**
	 * If the model has an aggregator, this returns the aggregator.
	 */
	aggregator?: string;
	/**
	 * The answer of the question given the table. If there is an aggregator, the answer will be
	 * preceded by `AGGREGATOR >`.
	 */
	answer: string;
	/**
	 * List of strings made up of the answer cell values.
	 */
	cells: string[];
	/**
	 * Coordinates of the cells of the answers.
	 */
	coordinates: Array<number[]>;
	[property: string]: any;
}
