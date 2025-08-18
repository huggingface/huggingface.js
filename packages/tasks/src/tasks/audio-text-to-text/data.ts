import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
  datasets: [
    {
      id: "mozilla-foundation/common_voice_13_0",
      description: "Multilingual dataset for speech recognition.",
    },
    {
      id: "open-slr/slr85",
      description: "Large-scale Mandarin speech dataset.",
    },
  ],
  demo: {
    inputs: [
      {
        filename: "https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/winning_call.mp3",
        type: "audio",
      },
    ],
    outputs: [
      {
        label: "Transcription",
        content: "This is the transcribed text from the audio.",
        type: "text",
      },
    ],
  },
  metrics: [
    { id: "wer", description: "Word Error Rate" },
    { id: "cer", description: "Character Error Rate" },
  ],
  models: [
    {
      id: "Qwen/Qwen2-Audio-7B-Instruct",
      description: "Multimodal LLM that accepts audio + text and outputs text.",
    },
    {
      id: "mistralai/Voxtral-Small-24B-2507",
      description: "Voxtral model for audio-to-text generation with multimodal capabilities.",
    },
    {
      id: "onnx-community/Voxtral-Mini-3B-2507-ONNX",
      description: "ONNX optimized Voxtral Mini model for fast inference in JS.",
    },
  ],
  spaces: [
    {
      id: "Qwen/Qwen2-Audio-Demo",
      description: "Interactive demo Space for Qwen2-Audio with audio input.",
    },
    {
      id: "mistralai/voxtral-demo",
      description: "Demo Space for Voxtral Small audio-to-text model.",
    },
  ],
  summary:
    "Audio-Text-to-Text tasks involve giving a model audio input to generate textual responses, such as transcription or audio-based question answering.",
  widgetModels: [
    "Qwen/Qwen2-Audio-7B-Instruct",
    "mistralai/Voxtral-Small-24B-2507",
    "onnx-community/Voxtral-Mini-3B-2507-ONNX",
  ],
  youtubeId: "",
};

export default taskData;