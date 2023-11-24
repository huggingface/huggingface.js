<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleTextInput, WidgetExampleOutputUrl, WidgetExample } from "@huggingface/tasks";

	import WidgetQuickInput from "../../shared/WidgetQuickInput/WidgetQuickInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isValidOutputUrl } from "../../shared/outputValidation.js";
	import { isTextInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];
	let isDisabled = false;

	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output = "";
	let outputJson = "";
	let text = "";

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		useCache = false,
		exampleOutput = undefined,
	}: InferenceRunOpts<WidgetExampleOutputUrl> = {}) {
		if (exampleOutput) {
			output = exampleOutput.url;
			return;
		}

		const trimmedText = text.trim();

		if (!trimmedText) {
			error = "You need to input some text";
			output = "";
			return;
		}

		if (shouldUpdateUrl && !isOnLoadCall) {
			updateUrl({ text: trimmedText });
		}

		const requestBody = { inputs: trimmedText };
		addInferenceParameters(requestBody, model);

		isLoading = true;

		const res = await callInferenceApi(
			apiUrl,
			model.id,
			requestBody,
			apiToken,
			parseOutput,
			withModelLoading,
			includeCredentials,
			isOnLoadCall,
			useCache
		);

		isLoading = false;
		// Reset values
		computeTime = "";
		error = "";
		modelLoading = { isLoading: false, estimatedTime: 0 };
		output = "";
		outputJson = "";

		if (res.status === "success") {
			computeTime = res.computeTime;
			output = res.output;
			outputJson = res.outputJson;
		} else if (res.status === "loading-model") {
			modelLoading = {
				isLoading: true,
				estimatedTime: res.estimatedTime,
			};
			getOutput({ withModelLoading: true });
		} else if (res.status === "error") {
			error = res.error || `Error encountered on input "${trimmedText}"`;
		}
	}

	function parseOutput(body: unknown): string {
		if (body && typeof body === "object" && body instanceof Blob) {
			return URL.createObjectURL(body);
		}
		throw new TypeError("Invalid output: output must be of type object & of instance Blob");
	}

	function applyInputSample(sample: WidgetExampleTextInput<WidgetExampleOutputUrl>, opts: ExampleRunOpts = {}) {
		text = sample.text;
		if (opts.isPreview) {
			if (sample.output) {
				output = sample.output.url;
			} else {
				output = "";
			}
			return;
		}
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}

	function validateExample(sample: WidgetExample): sample is WidgetExampleTextInput<WidgetExampleOutputUrl> {
		return isTextInput(sample) && (!sample.output || isValidOutputUrl(sample.output));
	}
</script>

<WidgetWrapper
	{callApiOnMount}
	{apiUrl}
	{includeCredentials}
	{applyInputSample}
	{computeTime}
	{error}
	{isLoading}
	{model}
	{modelLoading}
	{noTitle}
	{outputJson}
	{validateExample}
	exampleQueryParams={["text"]}
>
	<svelte:fragment slot="top" let:isDisabled>
		<form>
			<WidgetQuickInput bind:value={text} {isLoading} {isDisabled} onClickSubmitBtn={() => getOutput()} />
		</form>
	</svelte:fragment>
	<svelte:fragment slot="bottom">
		{#if output.length}
			<div class="mt-4 flex justify-center bg-gray-50 dark:bg-gray-925">
				<img class="max-w-sm object-contain" src={output} alt="" />
			</div>
		{/if}
	</svelte:fragment>
</WidgetWrapper>
