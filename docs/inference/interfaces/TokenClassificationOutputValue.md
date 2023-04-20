# Interface: TokenClassificationOutputValue

## Properties

### end

• **end**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[tasks/nlp/tokenClassification.ts:33](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L33)

___

### entity\_group

• **entity\_group**: `string`

The type for the entity being recognized (model specific).

#### Defined in

[tasks/nlp/tokenClassification.ts:37](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L37)

___

### score

• **score**: `number`

How likely the entity was recognized.

#### Defined in

[tasks/nlp/tokenClassification.ts:41](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L41)

___

### start

• **start**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[tasks/nlp/tokenClassification.ts:45](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L45)

___

### word

• **word**: `string`

The string that was captured

#### Defined in

[tasks/nlp/tokenClassification.ts:49](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L49)
