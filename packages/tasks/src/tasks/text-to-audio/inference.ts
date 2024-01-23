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
	 * One or several texts to generate audio for
	 */
	inputs: string[] | string;
	/**
	 * Additional inference parameters
	 */
	parameters?: { [key: string]: unknown };
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Text To Audio task
 */
export interface TextToAudioOutput {
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
