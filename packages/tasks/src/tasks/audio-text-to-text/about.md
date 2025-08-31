## Use Cases

> This task takes `audio` and a `text prompt` and returns `text` (answers, summaries, structured notes, etc.).

### Audio question answering
Ask targeted questions about lectures, podcasts, or calls and get prices, and context-aware answers.
**Example:** Audio: physics lecture → Prompt: “What did the teacher say about gravity and how is it measured?”

### Meeting notes & action items
Turn multi-speaker meetings into concise minutes with decisions, owners, and deadlines.
**Example:** Audio: weekly stand-up → Prompt: “Summarize key decisions and list action items with assignees.”

### Speech understanding & intent
Go beyond transcription to extract intent, sentiment, uncertainty, or emotion from spoken language.
**Example:** “I’m not sure I can finish this on time.” → Prompt: “Describe speaker intent and confidence.”

### Music & sound analysis (textual)
Describe instrumentation, genre, tempo, or sections, and suggest edits or techniques (text output only).
**Example:** Song demo → Prompt: “Identify key and tempo, then suggest jazz reharmonization ideas for the chorus.”

## Inference
You can use 'transformers' library, and your audio file to any of the `audio-text-to-text` model, with instructions and get text responses. Following code examples show how to do so.

### Summarization / Q&A on a Single Audio
Run queries or request summaries directly from an audio clip.

```python
from transformers import VoxtralForConditionalGeneration, AutoProcessor
import torch

device = "cuda"
repo_id = "mistralai/Voxtral-Mini-3B-2507"

processor = AutoProcessor.from_pretrained(repo_id)
model = VoxtralForConditionalGeneration.from_pretrained(repo_id, torch_dtype=torch.bfloat16, device_map=device)

conversation = [
    {
        "role": "user",
        "content": [
            {
                "type": "audio",
                "path": "https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/winning_call.mp3",
            },
            {"type": "text", "text": "Summarize this audio"},
        ],
    }
]

inputs = processor.apply_chat_template(conversation)
inputs = inputs.to(device, dtype=torch.bfloat16)

outputs = model.generate(**inputs, max_new_tokens=500)
decoded_outputs = processor.batch_decode(outputs[:, inputs.input_ids.shape[1]:], skip_special_tokens=True)

print("\nGenerated response:")
print("=" * 80)
print(decoded_outputs[0])
print("=" * 80)
```

### Multiple Audio Querying 
Pass multiple audio inputs in the same request and ask questions that compare or reference them.

```python
from transformers import VoxtralForConditionalGeneration, AutoProcessor
import torch

device = "cuda"
repo_id = "mistralai/Voxtral-Mini-3B-2507"

processor = AutoProcessor.from_pretrained(repo_id)
model = VoxtralForConditionalGeneration.from_pretrained(repo_id, torch_dtype=torch.bfloat16, device_map=device)

conversation = [
    {
        "role": "user",
        "content": [
            {
                "type": "audio",
                "path": "https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/mary_had_lamb.mp3",
            },
            {
                "type": "audio",
                "path": "https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/winning_call.mp3",
            },
            {"type": "text", "text": "What sport and what nursery rhyme are referenced?"},
        ],
    }
]

inputs = processor.apply_chat_template(conversation)
inputs = inputs.to(device, dtype=torch.bfloat16)

outputs = model.generate(**inputs, max_new_tokens=500)
decoded_outputs = processor.batch_decode(outputs[:, inputs.input_ids.shape[1]:], skip_special_tokens=True)

print("\nGenerated response:")
print("=" * 80)
print(decoded_outputs[0])
print("=" * 80)
```

### Multi-Turn Conversation with Audio 
Mix audio and text across multiple turns in a conversation, just like a dialogue with context.

```python
from transformers import VoxtralForConditionalGeneration, AutoProcessor
import torch

device = "cuda"
repo_id = "mistralai/Voxtral-Mini-3B-2507"

processor = AutoProcessor.from_pretrained(repo_id)
model = VoxtralForConditionalGeneration.from_pretrained(repo_id, torch_dtype=torch.bfloat16, device_map=device)

conversation = [
    {
        "role": "user",
        "content": [
            {
                "type": "audio",
                "path": "https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/obama.mp3",
            },
            {
                "type": "audio",
                "path": "https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/bcn_weather.mp3",
            },
            {"type": "text", "text": "Describe briefly what you can hear."},
        ],
    },
    {
        "role": "assistant",
        "content": "The audio begins with the speaker delivering a farewell address in Chicago, reflecting on his eight years as president and expressing gratitude to the American people. The audio then transitions to a weather report, stating that it was 35 degrees in Barcelona the previous day, but the temperature would drop to minus 20 degrees the following day.",
    },
    {
        "role": "user",
        "content": [
            {
                "type": "audio",
                "path": "https://huggingface.co/datasets/hf-internal-testing/dummy-audio-samples/resolve/main/winning_call.mp3",
            },
            {"type": "text", "text": "Ok, now compare this new audio with the previous one."},
        ],
    },
]

inputs = processor.apply_chat_template(conversation)
inputs = inputs.to(device, dtype=torch.bfloat16)

outputs = model.generate(**inputs, max_new_tokens=500)
decoded_outputs = processor.batch_decode(outputs[:, inputs.input_ids.shape[1]:], skip_special_tokens=True)

print("\nGenerated response:")
print("=" * 80)
print(decoded_outputs[0])
print("=" * 80)
```

## Useful Resources

If you want to learn more about this concept, here are some useful links:

### Papers
- [SpeechGPT (Paper)](https://huggingface.co/papers/2507.13264)
- [Voxtral (Paper)](https://arxiv.org/pdf/2507.13264)
- [Qwen2-audio-instruct (Paper)](https://arxiv.org/pdf/2407.10759)
- [AudioPaLM (Paper)](https://arxiv.org/pdf/2306.12925)

### Blogs
- [Qwen2-audio-instruct (Blog)](https://qwenlm.github.io/blog/qwen2-audio/)

### Datasets
- [nvidia/AF-Think](https://huggingface.co/datasets/nvidia/AF-Think)
- [nvidia/AudioSkills](https://huggingface.co/datasets/nvidia/AudioSkills)

### Code & Demos
- [Qwen2-audio-instruct](https://github.com/QwenLM/Qwen2-Audio)
- [SpeechGPT](https://github.com/QwenLM/Qwen2-Audio)
- [AudioPaLM](https://github.com/0nutation/SpeechGPT)
