
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
    input: string;
    /**
     * Additional inference parameters
     */
    parameters?: { [key: string]: unknown };
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
