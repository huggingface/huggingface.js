/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
 */

/**
 * Inputs for Object Detection inference
 */
export interface ObjectDetectionInput {
	/**
	 * One or several input images to perform object detection on
	 */
	inputs: any;
	/**
	 * Additional inference parameters
	 */
	parameters?: ObjectDetectionParameters;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Object Detection
 */
export interface ObjectDetectionParameters {
	/**
	 * The probability necessary to make a prediction.
	 */
	threshold?: number;
	[property: string]: any;
}

/**
 * Outputs of inference for the Object Detection task
 */
export interface ObjectDetectionOutput {
	/**
	 * The predicted bounding box. Coordinates are relative to the top left corner of the input
	 * image.
	 */
	box: BoundingBox;
	/**
	 * The predicted label for the bounding box
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
