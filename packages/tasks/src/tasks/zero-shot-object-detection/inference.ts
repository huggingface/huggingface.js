/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Zero Shot Object Detection inference
 */
export interface ZeroShotObjectDetectionInput {
	/**
	 * One or several images to perform object detection on
	 */
	inputs: ZeroShotObjectDetectionInputSingle[] | ZeroShotObjectDetectionInputSingle;
	/**
	 * Additional inference parameters
	 */
	parameters?: { [key: string]: unknown };
	[property: string]: unknown;
}

export interface ZeroShotObjectDetectionInputSingle {
	/**
	 * The candidate labels for this image
	 */
	candidateLabels: string[];
	/**
	 * The image data to generate bounding boxes from
	 */
	image: unknown;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Zero Shot Object Detection task
 */
export interface ZeroShotObjectDetectionOutput {
	/**
	 * The predicted bounding box. Coordinates are relative to the top left corner of the input
	 * image.
	 */
	box: Box;
	/**
	 * A candidate label
	 */
	label: string;
	/**
	 * The associated score / probability
	 */
	score: number;
	[property: string]: unknown;
}

/**
 * The predicted bounding box. Coordinates are relative to the top left corner of the input
 * image.
 */
export interface Box {
	xmax: number;
	xmin: number;
	ymax: number;
	ymin: number;
	[property: string]: unknown;
}
