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
	data: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: {
		[key: string]: unknown;
	};
	[property: string]: unknown;
}
export type AutomaticSpeechRecognitionOutput = AutomaticSpeechRecognitionOutputElement[];
/**
 * Outputs of inference for the Automatic Speech Recognition task
 */
export interface AutomaticSpeechRecognitionOutputElement {
	/**
	 * The recognized text.
	 */
	text: string;
	[property: string]: unknown;
}
