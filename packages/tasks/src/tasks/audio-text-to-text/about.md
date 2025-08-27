## Different Types of Audio-Text-to-Text Models

Audio-text-to-text models can be categorized into two main types:

- **Base:**  
  Pre-trained models that extract rich audio features using techniques such as Wav2Vec, HuBERT, or Whisper. These models serve as the backbone for various downstream tasks. An example is the [Qwen2-Audio-7b](https://huggingface.co/Qwen/Qwen2-Audio-7B), which can be further fine-tuned.

- **Instruction:**  
  Base models fine-tuned on specialized audio instruction datasets to better handle task-specific querie and conversation. For instance, [Ichigo-llama3.1-s-instruct-v0.4](https://huggingface.co/homebrewltd/Ichigo-llama3.1-s-instruct-v0.4) has been optimized to follow detailed audio-related commands.

### Use Cases

- **Multimodal Audio Dialogue:**  
  These models can engage in real-time, multi-turn conversations by processing audio inputs and generating text responses. They are the backbone of advanced voice assistants and interactive dialogue systems.
  You can try this model with [Audio Flamingo](https://huggingface.co/spaces/nvidia/audio-flamingo-3) demo, which is a large audio-language model that unifies speech, sound, and music understanding with long-context reasoning, multi-turn dialogue, and voice-to-voice interaction.

- **Speech Transcription and Analysis:**  
  Beyond converting spoken words to text, these models capture prosody, emotion, and speaker characteristics. This enriched transcription can be used for applications such as sentiment analysis and speaker profiling.

You can try this with [Voxtral Mini](https://huggingface.co/mistralai/Voxtral-Mini-3B-2507) with this code snippet:
```python
from transformers import VoxtralForConditionalGeneration, AutoProcessor
import torch

device = "cuda"
repo_id = "mistralai/Voxtral-Mini-3B-2507"

processor = AutoProcessor.from_pretrained(repo_id)
model = VoxtralForConditionalGeneration.from_pretrained(repo_id, torch_dtype=torch.bfloat16, device_map=device)

inputs = processor.apply_transcription_request(language="en", audio="https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/obama.mp3", model_id=repo_id)
inputs = inputs.to(device, dtype=torch.bfloat16)

outputs = model.generate(**inputs, max_new_tokens=500)
decoded_outputs = processor.batch_decode(outputs[:, inputs.input_ids.shape[1]:], skip_special_tokens=True)

print("\nGenerated responses:")
print("=" * 80)
for decoded_output in decoded_outputs:
    print(decoded_output)
    print("=" * 80)
```

- **Audio Question Answering:**  
  By directly processing audio inputs, the models can answer questions about the content of an audio clip—whether it’s a podcast excerpt or a recorded conversation.

You can try this with [Qwen2-Audio-Instruct-Demo](https://huggingface.co/Qwen/Qwen2-Audio-Instruct-Demo) with this code snippet:
```python
from io import BytesIO
from urllib.request import urlopen
import librosa
from transformers import Qwen2AudioForConditionalGeneration, AutoProcessor

processor = AutoProcessor.from_pretrained("Qwen/Qwen2-Audio-7B-Instruct")
model = Qwen2AudioForConditionalGeneration.from_pretrained("Qwen/Qwen2-Audio-7B-Instruct", device_map="auto")

conversation = [
    {'role': 'system', 'content': 'You are a helpful assistant.'}, 
    {"role": "user", "content": [
        {"type": "audio", "audio_url": "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen2-Audio/audio/glass-breaking-151256.mp3"},
        {"type": "text", "text": "What's that sound?"},
    ]},
    {"role": "assistant", "content": "It is the sound of glass shattering."},
    {"role": "user", "content": [
        {"type": "text", "text": "What can you do when you hear that?"},
    ]},
    {"role": "assistant", "content": "Stay alert and cautious, and check if anyone is hurt or if there is any damage to property."},
    {"role": "user", "content": [
        {"type": "audio", "audio_url": "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen2-Audio/audio/1272-128104-0000.flac"},
        {"type": "text", "text": "What does the person say?"},
    ]},
]
text = processor.apply_chat_template(conversation, add_generation_prompt=True, tokenize=False)
audios = []
for message in conversation:
    if isinstance(message["content"], list):
        for ele in message["content"]:
            if ele["type"] == "audio":
                audios.append(
                    librosa.load(
                        BytesIO(urlopen(ele['audio_url']).read()), 
                        sr=processor.feature_extractor.sampling_rate)[0]
                )

inputs = processor(text=text, audios=audios, return_tensors="pt", padding=True)
inputs.input_ids = inputs.input_ids.to("cuda")

generate_ids = model.generate(**inputs, max_length=256)
generate_ids = generate_ids[:, inputs.input_ids.size(1):]

response = processor.batch_decode(generate_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]
```

### Useful Resources

Here are some useful resources:

- [Audio Flamingo, an Large Audio-Language Model that that unifies speech, sound, and music understanding with long-context reasoning, multi-turn dialogue, and voice-to-voice interaction.](https://huggingface.co/nvidia/audio-flamingo-3)

- [Ultravox, a fast multimodal large language model designed for real-time voice interactions-.](https://github.com/fixie-ai/ultravox)

- [Ichigo an audio-text-to-text model for audio-related tasks.](https://github.com/menloresearch/ichigo)

- [An open-source large-scale audio-language model by Alibaba Cloud, Qwen2-Audio, supporting voice chat and audio analysis in multiple languages.](https://github.com/QwenLM/Qwen2-Audio)

- [A compact, open-source speech tokenizer, WhisperSpeech, enhancing multilingual performance with minimal impact on English capabilities.](https://github.com/janhq/WhisperSpeech)

- [A guide to Microsoft's open-source Phi models, PhiCookBook, offering capable and cost-effective small language models.](https://github.com/microsoft/PhiCookBook) 

- [Fast-RTC, turn any python function into a real-time audio and video stream over WebRTC or WebSockets.](https://huggingface.co/fastrtc)