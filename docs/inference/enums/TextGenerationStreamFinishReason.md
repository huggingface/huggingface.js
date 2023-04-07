# Enumeration: TextGenerationStreamFinishReason

## Enumeration Members

### EndOfSequenceToken

• **EndOfSequenceToken** = ``"eos_token"``

the model generated its end of sequence token

#### Defined in

[HfInference.ts:275](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L275)

___

### Length

• **Length** = ``"length"``

number of generated tokens == `max_new_tokens`

#### Defined in

[HfInference.ts:273](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L273)

___

### StopSequence

• **StopSequence** = ``"stop_sequence"``

the model generated a text included in `stop_sequences`

#### Defined in

[HfInference.ts:277](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L277)
