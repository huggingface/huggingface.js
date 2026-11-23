/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Audio to Audio inference
 */
export interface AudioToAudioInput {
	/**
	 * The input audio data
	 */
	inputs: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: {
		[key: string]: unknown;
	};
	[property: string]: unknown;
}
export type AudioToAudioOutput = AudioToAudioOutputElement[];
/**
 * Outputs of inference for the Audio To Audio task
 *
 * A generated audio file with its label.
 */
export interface AudioToAudioOutputElement {
	/**
	 * The generated audio file.
	 */
	blob: unknown;
	/**
	 * The content type of audio file.
	 */
	"content-type": string;
	/**
	 * The label of the audio file.
	 */
	label: string;
	[property: string]: unknown;
}
