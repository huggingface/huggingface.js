/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Text to Speech inference
 *
 * Inputs for Text To Audio inference
 */
export interface TextToSpeechInput {
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

/**
 * Outputs for Text to Speech inference
 *
 * Outputs of inference for the Text To Audio task
 */
export interface TextToSpeechOutput {
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
