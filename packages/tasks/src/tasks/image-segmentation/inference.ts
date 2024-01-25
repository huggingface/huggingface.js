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
	 * The input image data
	 */
	data: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: ImageSegmentationParameters;
	[property: string]: unknown;
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
	subtask?: ImageSegmentationSubtask;
	/**
	 * Probability threshold to filter out predicted masks.
	 */
	threshold?: number;
	[property: string]: unknown;
}

export type ImageSegmentationSubtask = "instance" | "panoptic" | "semantic";

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
	mask: unknown;
	/**
	 * The score or confidence degreee the model has
	 */
	score?: number;
	[property: string]: unknown;
}
