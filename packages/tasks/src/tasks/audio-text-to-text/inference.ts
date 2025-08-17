/**
 * Inference code generated from the JSON schema spec in ./spec
 */

/**
 * Inputs for Audio + Text → Text inference
 */
export interface AudioTextToTextInput {
  inputs: {
    audio: Blob;
    text: string;
  };
  parameters?: AudioTextToTextParameters;
  [property: string]: unknown;
}

/**
 * Optional parameters for text generation
 */
export interface AudioTextToTextParameters {
  max_new_tokens?: number;
  temperature?: number;
  [property: string]: unknown;
}

/**
 * Outputs for Audio + Text → Text inference
 */
export interface AudioTextToTextOutputElement {
  generated_text: string;
  [property: string]: unknown;
}

export type AudioTextToTextOutput = AudioTextToTextOutputElement[];
