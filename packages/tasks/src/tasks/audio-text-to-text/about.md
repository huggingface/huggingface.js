# 🎧 Audio-Text-to-Text with Transformers

Audio-text-to-text models take **both audio input and optional text input** to generate text.
This task extends traditional **automatic speech recognition (ASR)** (speech → text) by allowing a **prompt or instruction** that guides the model’s output.

For example, you can provide an audio clip of a lecture *plus* a text instruction like:

> “Summarize this in one sentence”

The model will produce a concise summary.
This is a **multimodal task** combining **speech understanding** and **natural language generation**.

---

## 🚀 Use Cases

### 🎤 Spoken Dialogue with Context

Models can listen to spoken input and respond based on an accompanying prompt, enabling assistants that combine **voice input** with **text reasoning**.

### 📝 Speech-conditioned Summarization

Convert meeting recordings into bullet-point notes by providing both the **speech audio** and an instruction such as *“Summarize key action items.”*

### ❓ Audio Question Answering

Ask questions about an audio clip: *“What is the main argument of the speaker?”*

### 🌍 Speech-to-Text Translation with Prompts

Provide an audio file in one language with instructions like:
*“Translate this into English, but keep a formal tone.”*

---

## ⚡ Inference with Transformers Pipelines (Beginner-Friendly)

```python
from datasets import load_dataset
from transformers import pipeline

# Load a tiny sample of the minds14 dataset
ds = load_dataset("PolyAI/minds14", "en-US", split="train[:2]")

# Initialize pipelines
asr_pipe = pipeline("automatic-speech-recognition", model="openai/whisper-small")
gen_pipe = pipeline("text2text-generation", model="google/flan-t5-base")

# Helper function
def audio_text_to_text(audio_array, instruction="Summarize this transcription:"):
    # Transcribe audio
    transcription = asr_pipe(audio_array, generate_kwargs={"task": "transcribe", "language": "en"})["text"]
    # Generate text based on instruction
    combined_input = f"{instruction}\n\n{transcription}"
    generated = gen_pipe(combined_input, max_new_tokens=100)[0]["generated_text"]
    return transcription, generated

# Run on dataset
for example in ds:
    transcription, generated = audio_text_to_text(example["audio"]["array"], instruction="Summarize in one short sentence.")
    print("Ground truth:", example["transcription"])
    print("ASR transcription:", transcription)
    print("Generated:", generated)
    print("="*50)
```

> ✅ **Perfect for beginners**: uses `pipeline` for simplicity.

---

## 💻 Raw Model Approach (For AI Nerds)

```python
from datasets import load_dataset
import torch
import torchaudio
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Load dataset
ds = load_dataset("PolyAI/minds14", "en-US", split="train[:2]")

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load Whisper model & processor
whisper_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small").to(device)
processor = WhisperProcessor.from_pretrained("openai/whisper-small")

# Load Flan-T5 text generation model
gen_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base").to(device)
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")

# Helper function
def audio_text_to_text_raw(audio_array, instruction="Summarize this transcription:"):
    audio_tensor = torch.tensor(audio_array, dtype=torch.float32).unsqueeze(0)
    resampler = torchaudio.transforms.Resample(orig_freq=8000, new_freq=16000)
    audio_16k = resampler(audio_tensor)

    # Step 1: ASR
    inputs = processor(audio_16k.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")
    input_features = inputs.input_features.to(device)
    generated_ids = whisper_model.generate(input_features)
    transcription = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    # Step 2: Text-to-text
    combined_input = f"{instruction}\n\n{transcription}"
    tokenized = tokenizer(combined_input, return_tensors="pt").to(device)
    generated_text_ids = gen_model.generate(**tokenized, max_new_tokens=100)
    generated_text = tokenizer.decode(generated_text_ids[0], skip_special_tokens=True)

    return transcription, generated_text

# Run on dataset
for example in ds:
    transcription, generated = audio_text_to_text_raw(example["audio"]["array"], instruction="Summarize in one short sentence.")
    print("Ground truth:", example["transcription"])
    print("ASR transcription:", transcription)
    print("Generated:", generated)
    print("="*50)
```

> ⚡ **Pro tip for AI enthusiasts**: full control without `pipeline`, can customize resampling, decoding, and generation.

---

## 🔗 Transformers Pipeline Example

```python
from transformers import pipeline

pipe = pipeline("audio-text-to-text", model="microsoft/speecht5_asr")

inputs = {
    "audio": "https://huggingface.co/datasets/Narsil/asr_dummy/resolve/main/mlk.flac",
    "text": "Summarize this speech in one sentence."
}

outputs = pipe(inputs)
print(outputs)
# "We must learn to live together as brothers or perish together as fools."
```

Or via **Hugging Face Inference API**:

```bash
curl https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3 \
  -X POST \
  -d '{"inputs": {"audio": "https://huggingface.co/datasets/Narsil/asr_dummy/resolve/main/mlk.flac", "text": "Translate this speech into French"}}' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hf_***"
```

---

## 📚 Useful Resources

* [Speech processing tasks in Transformers](https://huggingface.co/docs/transformers/tasks/audio)
* [Whisper models for transcription & translation](https://huggingface.co/models?search=whisper)
* [SpeechT5: speech-to-text & text-to-speech](https://huggingface.co/microsoft/speecht5_asr)
* [SeamlessM4T: multilingual speech+text](https://huggingface.co/facebook/seamless-m4t-v2-large)
* [How to fine-tune speech models](https://huggingface.co/docs/transformers/training)