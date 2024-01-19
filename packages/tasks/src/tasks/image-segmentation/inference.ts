/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Image Segmentation inference
 */
export interface ImageSegmentationInput {
	/**
	 * One or several image files to perform segmentation on
	 */
	inputs: any;
	/**
	 * Additional inference parameters
	 */
	parameters?: ImageSegmentationParameters;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Image Segmentation
 */
export interface ImageSegmentationParameters {
	/**
	 * Threshold to use when turning the predicted masks into binary values.
	 */
	maskThreshold?: number;
	/**
	 * Mask overlap threshold to eliminate small, disconnected segments.
	 */
	overlapMaskAreaThreshold?: number;
	/**
	 * Segmentation task to be performed, depending on model capabilities.
	 */
	subtask?: Subtask;
	/**
	 * Probability threshold to filter out predicted masks.
	 */
	threshold?: number;
	[property: string]: any;
}

export type Subtask = "instance" | "panoptic" | "semantic";

/**
 * Outputs of inference for the Image Segmentation task
 *
 * A predicted mask / segment
 */
export interface ImageSegmentationOutput {
	/**
	 * The label of the predicted segment
	 */
	label: string;
	/**
	 * The corresponding mask as a black-and-white image
	 */
	mask: any;
	[property: string]: any;
}
