# Interface: ImageSegmentationOutputValue

## Properties

### label

• **label**: `string`

The label for the class (model specific) of a segment.

#### Defined in

[tasks/cv/imageSegmentation.ts:16](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageSegmentation.ts#L16)

___

### mask

• **mask**: `string`

A str (base64 str of a single channel black-and-white img) representing the mask of a segment.

#### Defined in

[tasks/cv/imageSegmentation.ts:20](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageSegmentation.ts#L20)

___

### score

• **score**: `number`

A float that represents how likely it is that the detected object belongs to the given class.

#### Defined in

[tasks/cv/imageSegmentation.ts:24](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageSegmentation.ts#L24)
