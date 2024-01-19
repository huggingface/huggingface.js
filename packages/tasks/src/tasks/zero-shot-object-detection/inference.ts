/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
 */

/**
 * Inputs for Zero Shot Object Detection inference
 */
export interface ZeroShotObjectDetectionInput {
	/**
	 * One or several images to perform object detection on
	 */
	inputs: ZeroShotObjectDetectionInputs[] | ZeroShotObjectDetectionInputs;
	/**
	 * Additional inference parameters
	 */
	parameters?: { [key: string]: any };
	[property: string]: any;
}

export interface ZeroShotObjectDetectionInputs {
	/**
	 * The candidate labels for this image
	 */
	candidateLabels: string[];
	/**
	 * The image data to generate bounding boxes from
	 */
	image: any;
	[property: string]: any;
}

/**
 * Outputs of inference for the Zero Shot Object Detection task
 */
export interface ZeroShotObjectDetectionOutput {
	/**
	 * The predicted bounding box. Coordinates are relative to the top left corner of the input
	 * image.
	 */
	box: BoundingBox;
	/**
	 * A candidate label
	 */
	label: string;
	/**
	 * The associated score / probability
	 */
	score: number;
	[property: string]: any;
}

/**
 * The predicted bounding box. Coordinates are relative to the top left corner of the input
 * image.
 */
export interface BoundingBox {
	xmax: number;
	xmin: number;
	ymax: number;
	ymin: number;
	[property: string]: any;
}
