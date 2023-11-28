<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleAssetInput } from "@huggingface/tasks";

	import WidgetFileInput from "../../shared/WidgetFileInput/WidgetFileInput.svelte";
	import WidgetDropzone from "../../shared/WidgetDropzone/WidgetDropzone.svelte";
	import WidgetOutputText from "../../shared/WidgetOutputText/WidgetOutputText.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { callInferenceApi, getBlobFromUrl } from "../../shared/helpers.js";
	import { isAssetInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let imgSrc = "";
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output = "";
	let outputJson: string;
	let warning: string = "";

	function onSelectFile(file: File | Blob) {
		imgSrc = URL.createObjectURL(file);
		getOutput(file);
	}

	async function getOutput(
		file: File | Blob,
		{ withModelLoading = false, isOnLoadCall = false, exampleOutput = undefined }: InferenceRunOpts = {}
	) {
		if (!file) {
			return;
		}

		// Reset values
		computeTime = "";
		error = "";
		warning = "";
		output = "";
		outputJson = "";

		const requestBody = { file };

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
		modelLoading = { isLoading: false, estimatedTime: 0 };

		if (res.status === "success") {
			computeTime = res.computeTime;
			output = res.output;
			outputJson = res.outputJson;
			if (output.length === 0) {
				warning = "No classes were detected";
			}
		} else if (res.status === "loading-model") {
			modelLoading = {
				isLoading: true,
				estimatedTime: res.estimatedTime,
			};
			getOutput(file, { withModelLoading: true });
		} else if (res.status === "error") {
			error = res.error;
		}
	}

	function parseOutput(body: unknown): string {
		if (Array.isArray(body) && body.length) {
			const firstEntry = body[0];
			return firstEntry["generated_text"];
		}
		throw new TypeError("Invalid output: output must be of type Array & non-empty");
	}

	async function applyInputSample(sample: WidgetExampleAssetInput, opts: ExampleRunOpts = {}) {
		imgSrc = sample.src;
		if (opts.isPreview) {
			output = "";
			outputJson = "";
			return;
		}
		const blob = await getBlobFromUrl(imgSrc);
		getOutput(blob);
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
		validateExample={isAssetInput}
	/>
	<form>
		<WidgetDropzone
			classNames="hidden md:block"
			{isLoading}
			{isDisabled}
			{imgSrc}
			{onSelectFile}
			onError={(e) => (error = e)}
		>
			{#if imgSrc}
				<img src={imgSrc} class="pointer-events-none mx-auto max-h-44 shadow" alt="" />
			{/if}
		</WidgetDropzone>
		<!-- Better UX for mobile/table through CSS breakpoints -->
		{#if imgSrc}
			{#if imgSrc}
				<div class="mb-2 flex justify-center bg-gray-50 dark:bg-gray-900 md:hidden">
					<img src={imgSrc} class="pointer-events-none max-h-44" alt="" />
				</div>
			{/if}
		{/if}
		<WidgetFileInput
			accept="image/*"
			classNames="mr-2 md:hidden"
			{isLoading}
			{isDisabled}
			label="Browse for image"
			{onSelectFile}
		/>
		{#if warning}
			<div class="alert alert-warning mt-2">{warning}</div>
		{/if}
	</form>
	<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelLoading} />

	{#if model?.pipeline_tag !== "text-generation"}
		<WidgetOutputText classNames="mt-4" {output} />
	{/if}

	<WidgetFooter {isDisabled} {outputJson} />
</WidgetWrapper>
