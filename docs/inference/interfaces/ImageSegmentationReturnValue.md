# Interface: ImageSegmentationReturnValue

## Properties

### label

• **label**: `string`

The label for the class (model specific) of a segment.

#### Defined in

[HfInference.ts:531](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L531)

___

### mask

• **mask**: `string`

A str (base64 str of a single channel black-and-white img) representing the mask of a segment.

#### Defined in

[HfInference.ts:535](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L535)

___

### score

• **score**: `number`

A float that represents how likely it is that the detected object belongs to the given class.

#### Defined in

[HfInference.ts:539](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L539)
