/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Text To Audio inference
 */
export interface TextToAudioInput {
	/**
	 * The input text data
	 */
	data: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TextToAudioParameters;
	[property: string]: unknown;
}
/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text To Audio
 */
export interface TextToAudioParameters {
	/**
	 * Parametrization of the text generation process
	 */
	generate?: GenerationParameters;
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
export type TextToAudioOutput = TextToAudioOutputElement[];
/**
 * Outputs of inference for the Text To Audio task
 */
export interface TextToAudioOutputElement {
	/**
	 * The generated audio waveform.
	 */
	audio: unknown;
	/**
	 * The sampling rate of the generated audio waveform.
	 */
	samplingRate: number;
	[property: string]: unknown;
}
