## Use Cases

### Chatbot 💬

Chatbots are used to have conversations instead of providing direct contact with a live human. They are used to provide customer service, sales, and can even be used to play games (see [ELIZA](https://en.wikipedia.org/wiki/ELIZA) from 1966 for one of the earliest examples).

## Voice Assistants 🎙️

Conversational response models are used as part of voice assistants to provide appropriate responses to voice based queries.

## Inference

You can infer with Conversational models with the 🤗 Transformers library using the `conversational` pipeline. This pipeline takes a conversation prompt or a list of conversations and generates responses for each prompt. The models that this pipeline can use are models that have been fine-tuned on a multi-turn conversational task (see https://huggingface.co/models?filter=conversational for a list of updated Conversational models).

```python
from transformers import pipeline, Conversation
converse = pipeline("conversational")

conversation_1 = Conversation("Going to the movies tonight - any suggestions?")
conversation_2 = Conversation("What's the last book you have read?")
converse([conversation_1, conversation_2])

## Output:
## Conversation 1
## user >> Going to the movies tonight - any suggestions?
## bot >> The Big Lebowski ,
## Conversation 2
## user >> What's the last book you have read?
## bot >> The Last Question
```

You can use [huggingface.js](https://github.com/huggingface/huggingface.js) to infer with conversational models on Hugging Face Hub.

```javascript
import { HfInference } from "@huggingface/inference";

const inference = new HfInference(HF_TOKEN);
await inference.conversational({
	model: "facebook/blenderbot-400M-distill",
	inputs: "Going to the movies tonight - any suggestions?",
});
```

## Useful Resources

- Learn how ChatGPT and InstructGPT work in this blog: [Illustrating Reinforcement Learning from Human Feedback (RLHF)](https://huggingface.co/blog/rlhf)
- [Reinforcement Learning from Human Feedback From Zero to ChatGPT](https://www.youtube.com/watch?v=EAd4oQtEJOM)
- [A guide on Dialog Agents](https://huggingface.co/blog/dialog-agents)

This page was made possible thanks to the efforts of [Viraat Aryabumi](https://huggingface.co/viraat).
