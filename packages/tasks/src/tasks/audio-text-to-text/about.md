## Use Cases

### Audio question answering
Ask questions about an audio clip, and the model gives answers.
Example: “What did the teacher say about gravity in this lecture?”

### Music Analysis
Work with audio and prompts to analyze.
Example: “Make this melody sound more jazzy”

### Speech Understanding
Go beyond transcription to capture meaning, intent, and emotion.
Example: Understanding uncertainty in “I’m not sure I can finish this on time.”

### Meeting Minutes
Summarize meetings into action items.
Example: Audio: job interview → Prompt: “List strengths and weaknesses”


## Inference
You can use transformers library, and your audio file to any of the `audio-text-to-text` model, with instructions and get text responses. Following code shows how to do so.

```python

import transformers
import numpy as np
import librosa

pipe = transformers.pipeline(model='fixie-ai/ultravox-v0_5-llama-3_2-1b', trust_remote_code=True)

path = "<path-to-input-audio>"  # TODO: pass the audio here
audio, sr = librosa.load(path, sr=16000)


turns = [
  {
    "role": "system",
    "content": "You are a friendly and helpful character. You love to answer questions for people."
  },
]
pipe({'audio': audio, 'turns': turns, 'sampling_rate': sr}, max_new_tokens=30)


```
