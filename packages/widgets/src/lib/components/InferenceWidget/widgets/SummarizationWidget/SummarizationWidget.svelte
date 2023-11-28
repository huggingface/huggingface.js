<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleTextInput } from "@huggingface/tasks";

	import WidgetOutputText from "../../shared/WidgetOutputText/WidgetOutputText.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetTextarea from "../../shared/WidgetTextarea/WidgetTextarea.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isTextInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output = "";
	let outputJson: string;
	let text = "";
	let setTextAreaValue: (text: string) => void;

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedValue = text.trim();

		if (!trimmedValue) {
			error = "You need to input some text";
			output = "";
			outputJson = "";
			return;
		}

		if (shouldUpdateUrl && !isOnLoadCall) {
			updateUrl({ text: trimmedValue });
		}

		const requestBody = { inputs: trimmedValue };
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
			isOnLoadCall
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
			error = res.error;
		}
	}

	function parseOutput(body: unknown): string {
		if (Array.isArray(body) && body.length) {
			return body[0]?.["summary_text"] ?? "";
		}
		throw new TypeError("Invalid output: output must be of type Array & non-empty");
	}

	function applyInputSample(sample: WidgetExampleTextInput, opts: ExampleRunOpts = {}) {
		setTextAreaValue(sample.text);
		if (opts.isPreview) {
			return;
		}
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}
</script>

<WidgetWrapper
	{apiUrl}
	{includeCredentials}
	{model}
	let:isDisabled
	let:modelLoadInfo
	let:WidgetInfo
	let:WidgetHeader
	let:WidgetFooter
>
	<WidgetHeader
		{noTitle}
		{model}
		{isLoading}
		{isDisabled}
		{callApiOnMount}
		{applyInputSample}
		validateExample={isTextInput}
	/>
	<form class="space-y-2">
		<WidgetTextarea bind:value={text} bind:setValue={setTextAreaValue} {isDisabled} />
		<WidgetSubmitBtn
			{isLoading}
			{isDisabled}
			onClick={() => {
				getOutput();
			}}
		/>
	</form>
	<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelLoading} />

	<WidgetOutputText classNames="mt-4" {output} />

	<WidgetFooter {isDisabled} {outputJson} />
</WidgetWrapper>
