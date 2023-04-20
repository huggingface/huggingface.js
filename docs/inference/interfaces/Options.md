# Interface: Options

## Properties

### dont\_load\_model

• `Optional` **dont\_load\_model**: `boolean`

(Default: false). Boolean. Do not load the model if it's not already available.

#### Defined in

[types.ts:13](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/types.ts#L13)

___

### retry\_on\_error

• `Optional` **retry\_on\_error**: `boolean`

(Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true.

#### Defined in

[types.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/types.ts#L5)

___

### use\_cache

• `Optional` **use\_cache**: `boolean`

(Default: true). Boolean. There is a cache layer on the inference API to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query.

#### Defined in

[types.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/types.ts#L9)

___

### use\_gpu

• `Optional` **use\_gpu**: `boolean`

(Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least).

#### Defined in

[types.ts:17](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/types.ts#L17)

___

### wait\_for\_model

• `Optional` **wait\_for\_model**: `boolean`

(Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.

#### Defined in

[types.ts:22](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/types.ts#L22)
