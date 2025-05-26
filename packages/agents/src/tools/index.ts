import { textToImageTool } from './textToImage.js';
import { imageToTextTool } from './imageToText.js';
import { textToSpeechTool } from './textToSpeech.js';
import { speechToTextTool } from './speechToText.js';
import type { Tool } from '../types.js';

export const defaultTools: Array<Tool> = [textToImageTool, imageToTextTool, textToSpeechTool, speechToTextTool];

export { textToImageTool } from "./textToImage";
export { imageToTextTool } from "./imageToText";
export { textToSpeechTool } from "./textToSpeech";
export { speechToTextTool } from "./speechToText";
