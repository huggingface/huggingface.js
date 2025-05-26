import { textToImageTool } from './textToImage.js';
import { imageToTextTool } from './imageToText.js';
import { textToSpeechTool } from './textToSpeech.js';
import { speechToTextTool } from './speechToText.js';
import type { Tool } from '../types.js';

export const defaultTools: Array<Tool> = [textToImageTool, imageToTextTool, textToSpeechTool, speechToTextTool];

export { textToImageTool } from "./textToImage.js";
export { imageToTextTool } from "./imageToText.js";
export { textToSpeechTool } from "./textToSpeech.js";
export { speechToTextTool } from "./speechToText.js";
