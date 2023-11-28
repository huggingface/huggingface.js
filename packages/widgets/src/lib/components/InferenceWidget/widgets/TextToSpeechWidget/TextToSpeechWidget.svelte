<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleTextInput } from "@huggingface/tasks";

	import WidgetAudioTrack from "../../shared/WidgetAudioTrack/WidgetAudioTrack.svelte";
	import WidgetTextarea from "../../shared/WidgetTextarea/WidgetTextarea.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
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
	let setTextAreaValue: (text: string) => void;

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
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
		if (body && typeof body === "object" && body instanceof Blob) {
			return URL.createObjectURL(body);
		}
		throw new TypeError("Invalid output: output must be of type object & instance of Blob");
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
	<form>
		<WidgetTextarea bind:value={text} bind:setValue={setTextAreaValue} {isDisabled} />
		<WidgetSubmitBtn
			classNames="mt-2"
			{isLoading}
			{isDisabled}
			onClick={() => {
				getOutput();
			}}
		/>
	</form>
	<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelLoading} />

	{#if output.length}
		<WidgetAudioTrack classNames="mt-4" src={output} />
	{/if}

	<WidgetFooter {isDisabled} {outputJson} />
</WidgetWrapper>
