# Interface: ObjectDetectionOutputValue

## Properties

### box

• **box**: `Object`

A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `xmax` | `number` |
| `xmin` | `number` |
| `ymax` | `number` |
| `ymin` | `number` |

#### Defined in

[tasks/cv/objectDetection.ts:16](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/objectDetection.ts#L16)

___

### label

• **label**: `string`

The label for the class (model specific) of a detected object.

#### Defined in

[tasks/cv/objectDetection.ts:25](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/objectDetection.ts#L25)

___

### score

• **score**: `number`

A float that represents how likely it is that the detected object belongs to the given class.

#### Defined in

[tasks/cv/objectDetection.ts:30](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/objectDetection.ts#L30)
