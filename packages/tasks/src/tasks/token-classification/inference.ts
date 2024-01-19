/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
 */

/**
 * Inputs for Token Classification inference
 */
export interface TokenClassificationInput {
	/**
	 * One or several texts which tokens are to be classified
	 */
	inputs: string[] | string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TokenClassificationParameters;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Token Classification
 */
export interface TokenClassificationParameters {
	/**
	 * The strategy used to fuse tokens based on model predictions
	 */
	aggregationStrategy?: AggregationStrategy;
	/**
	 * A list of labels to ignore
	 */
	ignoreLabels?: string[];
	/**
	 * The number of overlapping tokens between chunks when splitting the input text.
	 */
	stride?: number;
	[property: string]: any;
}

/**
 * Do not aggregate tokens
 *
 * Group consecutive tokens with the same label in a single entity.
 *
 * Similar to "simple", also preserves word integrity (use the label predicted for the first
 * token in a word).
 *
 * Similar to "simple", also preserves word integrity (uses the label with the highest
 * score, averaged across the word's tokens).
 *
 * Similar to "simple", also preserves word integrity (uses the label with the highest score
 * across the word's tokens).
 */
export type AggregationStrategy = "none" | "simple" | "first" | "average" | "max";

/**
 * Outputs of inference for the Token Classification task
 */
export interface TokenClassificationOutput {
	/**
	 * The character position in the input where this group ends.
	 */
	end?: number;
	/**
	 * The predicted label for that group of tokens
	 */
	entityGroup?: string;
	label: any;
	/**
	 * The associated score / probability
	 */
	score: number;
	/**
	 * The character position in the input where this group begins.
	 */
	start?: number;
	/**
	 * The corresponding text
	 */
	word?: string;
	[property: string]: any;
}
