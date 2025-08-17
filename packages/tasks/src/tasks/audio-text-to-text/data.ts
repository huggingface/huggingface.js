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
        filename: "demo.wav",
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
      id: "openai/whisper-small",
      description: "Small Whisper model for automatic speech recognition (ASR).",
    },
    {
      id: "openai/whisper-medium",
      description: "Medium Whisper model for more accurate ASR transcription.",
    },
  ],
  spaces: [
    {
      id: "openai/whisper-demo",
      description: "Demo space to try Whisper speech-to-text models.",
    },
  ],
  summary: "Transcribe spoken audio into text using automatic speech recognition (ASR) models.",
  widgetModels: ["openai/whisper-small"],
  youtubeId: "",
};

export default taskData;
