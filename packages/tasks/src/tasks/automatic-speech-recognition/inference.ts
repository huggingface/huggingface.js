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
	parameters?: AutomaticSpeechRecognitionParameters;
	[property: string]: unknown;
}
/**
 * Additional inference parameters
 *
 * Additional inference parameters for Automatic Speech Recognition
 */
export interface AutomaticSpeechRecognitionParameters {
	/**
	 * Parametrization of the text generation process
	 */
	generate?: GenerationParameters;
	/**
	 * Whether to output corresponding timestamps with the generated text
	 */
	returnTimestamps?: boolean;
	[property: string]: unknown;
}
/**
 * Parametrization of the text generation process
 *
 * Ad-hoc parametrization of the text generation process
 */
export interface GenerationParameters {
	/**
	 * I can be the papa you'd be the mama
	 */
	temperature?: number;
	[property: string]: unknown;
}
export interface AutomaticSpeechRecognitionOutputChunk {
	/**
	 * A chunk of text identified by the model
	 */
	text: string;
	/**
	 * The start and end timestamps corresponding with the text
	 */
	timestamps: number[];
	[property: string]: unknown;
}
export type AutomaticSpeechRecognitionOutput = AutomaticSpeechRecognitionOutputElement[];
/**
 * Outputs of inference for the Automatic Speech Recognition task
 */
export interface AutomaticSpeechRecognitionOutputElement {
	/**
	 * When returnTimestamps is enabled, chunks contains a list of audio chunks identified by
	 * the model.
	 */
	chunks?: AutomaticSpeechRecognitionOutputChunk[];
	/**
	 * The recognized text.
	 */
	text: string;
	[property: string]: unknown;
}
