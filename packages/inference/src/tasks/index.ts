// Custom tasks with arbitrary inputs and outputs
export * from "./custom/request";
export * from "./custom/streamingRequest";

// Audio tasks
export * from "./audio/audioClassification";
export * from "./audio/audioToAudio";
export * from "./audio/automaticSpeechRecognition";
export * from "./audio/textToSpeech";

// Computer Vision tasks
export * from "./cv/imageClassification";
export * from "./cv/imageSegmentation";
export * from "./cv/imageToImage";
export * from "./cv/imageToText";
export * from "./cv/objectDetection";
export * from "./cv/textToImage";
export * from "./cv/textToVideo";
export * from "./cv/zeroShotImageClassification";

// Natural Language Processing tasks
export * from "./nlp/chatCompletion";
export * from "./nlp/chatCompletionStream";
export * from "./nlp/featureExtraction";
export * from "./nlp/fillMask";
export * from "./nlp/questionAnswering";
export * from "./nlp/sentenceSimilarity";
export * from "./nlp/summarization";
export * from "./nlp/tableQuestionAnswering";
export * from "./nlp/textClassification";
export * from "./nlp/textGeneration";
export * from "./nlp/textGenerationStream";
export * from "./nlp/tokenClassification";
export * from "./nlp/translation";
export * from "./nlp/zeroShotClassification";

// Multimodal tasks
export * from "./multimodal/documentQuestionAnswering";
export * from "./multimodal/visualQuestionAnswering";

// Tabular tasks
export * from "./tabular/tabularClassification";
export * from "./tabular/tabularRegression";
