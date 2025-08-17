# 🎧 Audio-Text-to-Text Task for Hugging Face

This task page introduces **Audio-Text-to-Text models**, which take **both audio and optional text input** to generate text output. This is a **multimodal task** combining **speech understanding** and **text generation**.

---

## 📝 Task Description

Audio-Text-to-Text extends traditional automatic speech recognition (ASR) by allowing a **prompt or instruction** that guides the model output.

**Example Use Case:**

* Provide an audio clip of someone speaking.
* Include a text instruction: "Summarize this in one sentence."
* Model outputs a concise summary.

**Applications:**

* Spoken dialogue with context
* Speech-conditioned summarization
* Audio question answering
* Speech-to-text translation with prompts

---

## ⚡ Example Input/Output Schema

**Inputs:**

```json
{
  "audio": "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen2-Audio/audio/1272-128104-0000.flac",
  "text": "What does the person say?"
}
```

**Outputs:**

```json
{
  "generated_text": "The original content of this audio is:'Mister Quiller is the apostle of the middle classes and we are glad to welcome his gospel.'"
}
```

> The input audio can be from a URL or a local file path. The text field is optional, but it can guide the response.

---

## 💻 Raw Model Approach

```python
from io import BytesIO
from urllib.request import urlopen
import librosa
import torch
from transformers import Qwen2AudioForConditionalGeneration, AutoProcessor

# Load processor and model
processor = AutoProcessor.from_pretrained("Qwen/Qwen2-Audio-7B-Instruct")
model = Qwen2AudioForConditionalGeneration.from_pretrained(
    "Qwen/Qwen2-Audio-7B-Instruct", device_map="auto"
)

# Define conversation with audio+text
conversation = [
    {'role': 'system', 'content': 'You are a helpful assistant.'},
    {"role": "user", "content": [
        {"type": "audio", "audio_url": "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen2-Audio/audio/glass-breaking-151256.mp3"},
        {"type": "text", "text": "What's that sound?"}
    ]}
]

# Apply chat template
text = processor.apply_chat_template(conversation, add_generation_prompt=True, tokenize=False)

# Load audio files
audios = []
for message in conversation:
    if isinstance(message["content"], list):
        for ele in message["content"]:
            if ele["type"] == "audio":
                audios.append(
                    librosa.load(
                        BytesIO(urlopen(ele['audio_url']).read()),
                        sr=processor.feature_extractor.sampling_rate
                    )[0]
                )

# Tokenize inputs
inputs = processor(text=text, audios=audios, return_tensors="pt", padding=True)
inputs.input_ids = inputs.input_ids.to("cuda")

# Generate output
generate_ids = model.generate(**inputs, max_length=1024)
generate_ids = generate_ids[:, inputs.input_ids.size(1):]
response = processor.batch_decode(generate_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]
print(response)
```

> This approach allows **audio+text input** for text generation, without relying on pipelines.

---

## 🔗 Resources

* [Speech processing tasks in Transformers](https://huggingface.co/docs/transformers/tasks/audio)
* [Whisper models for transcription & translation](https://huggingface.co/models?search=whisper)
* [SpeechT5: speech-to-text & text-to-speech](https://huggingface.co/microsoft/speecht5_asr)
* [SeamlessM4T: multilingual speech+text](https://huggingface.co/facebook/seamless-m4t-v2-large)
* [How to fine-tune speech models](https://huggingface.co/docs/transformers/training)

---

**👆 Input/Output Visualization**

The HF Hub can show **interactive inputs/outputs** like below for this task:

**Inputs:**

```json
{
  "audio": "<audio URL or file>",
  "text": "Optional instruction or question about the audio"
}
```

**Outputs:**

```json
{
  "generated_text": "Model-generated answer or transcription based on the audio and text instruction."
}
```