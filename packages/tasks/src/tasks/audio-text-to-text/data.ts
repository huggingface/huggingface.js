import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
  datasets: [
    {
      id: "mozilla-foundation/common_voice_13_0",
      description: "Multilingual dataset for speech recognition.",
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
        content: "This is the transcribed text from the audio.",
        label: "Transcription",
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
      description: "Small Whisper model for ASR.",
    },
  ],
  spaces: [],
  summary: "Convert audio input into text using speech-to-text models.",
  widgetModels: ["openai/whisper-small"],
};

export default taskData;