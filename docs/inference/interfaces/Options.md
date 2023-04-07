# Interface: Options

## Properties

### dont\_load\_model

• `Optional` **dont\_load\_model**: `boolean`

(Default: false). Boolean. Do not load the model if it's not already available.

#### Defined in

[HfInference.ts:19](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L19)

___

### retry\_on\_error

• `Optional` **retry\_on\_error**: `boolean`

(Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true.

#### Defined in

[HfInference.ts:11](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L11)

___

### use\_cache

• `Optional` **use\_cache**: `boolean`

(Default: true). Boolean. There is a cache layer on the inference API to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query.

#### Defined in

[HfInference.ts:15](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L15)

___

### use\_gpu

• `Optional` **use\_gpu**: `boolean`

(Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least).

#### Defined in

[HfInference.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L23)

___

### wait\_for\_model

• `Optional` **wait\_for\_model**: `boolean`

(Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.

#### Defined in

[HfInference.ts:28](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L28)
