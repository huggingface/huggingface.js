/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Automatic Speech Recognition inference
 */
export interface AutomaticSpeechRecognitionInput {
	/**
	 * The input audio data
	 */
	inputs: any;
	/**
	 * Additional inference parameters
	 */
	parameters?: { [key: string]: any };
	[property: string]: any;
}

/**
 * Outputs of inference for the Automatic Speech Recognition task
 */
export interface AutomaticSpeechRecognitionOutput {
	/**
	 * The recognized text.
	 */
	text: string;
	[property: string]: any;
}
