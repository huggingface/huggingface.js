/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Text To Audio inference
 */
export interface TextToSpeechInput {
	/**
	 * One or several texts to generate audio for
	 */
	inputs: string[] | string;
	/**
	 * Additional inference parameters
	 */
	parameters?: { [key: string]: any };
	[property: string]: any;
}

/**
 * Outputs of inference for the Text To Audio task
 */
export interface TextToSpeechOutput {
	/**
	 * The generated audio waveform.
	 */
	audio: any;
	/**
	 * The sampling rate of the generated audio waveform.
	 */
	samplingRate: number;
	[property: string]: any;
}
