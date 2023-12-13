<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleAssetAndTextInput } from "@huggingface/tasks";

	import WidgetFileInput from "../../shared/WidgetFileInput/WidgetFileInput.svelte";
	import WidgetDropzone from "../../shared/WidgetDropzone/WidgetDropzone.svelte";
	import WidgetQuickInput from "../../shared/WidgetQuickInput/WidgetQuickInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import WidgetOutputChart from "../../shared/WidgetOutputChart/WidgetOutputChart.svelte";
	import { addInferenceParameters, callInferenceApi } from "../../shared/helpers.js";
	import { isAssetAndTextInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let includeCredentials: WidgetProps["includeCredentials"];
	let isDisabled = false;

	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: Array<{ answer: string; score?: number }> | null = [];
	let outputJson: string;
	let question = "";
	let imgSrc = "";
	let imageBase64 = "";

	async function onSelectFile(file: File | Blob) {
		imgSrc = URL.createObjectURL(file);
		await updateImageBase64(file);
	}

	function updateImageBase64(file: File | Blob): Promise<void> {
		return new Promise((resolve, reject) => {
			const fileReader: FileReader = new FileReader();
			fileReader.onload = async () => {
				try {
					const imageBase64WithPrefix: string = fileReader.result as string;
					imageBase64 = imageBase64WithPrefix.split(",")[1]; // remove prefix
					isLoading = false;
					resolve();
				} catch (err) {
					reject(err);
				}
			};
			fileReader.onerror = (e) => reject(e);
			isLoading = true;
			fileReader.readAsDataURL(file);
		});
	}

	function isValidOutput(arg: any): arg is { answer: string; score?: number }[] {
		return (
			Array.isArray(arg) &&
			arg.every((x) => typeof x.answer === "string" && (typeof x.score === "number" || x.score === undefined))
		);
	}

	function parseOutput(body: unknown): Array<{ answer: string; score?: number }> {
		if (isValidOutput(body)) {
			return body;
		}
		throw new TypeError("Invalid output: output must be of type Array<{ answer: string, score?: number }>");
	}

	async function applyInputSample(sample: WidgetExampleAssetAndTextInput, opts: ExampleRunOpts = {}) {
		question = sample.text;
		imgSrc = sample.src;
		if (opts.isPreview) {
			return;
		}
		const res = await fetch(imgSrc);
		const blob = await res.blob();
		await updateImageBase64(blob);
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedQuestion = question.trim();

		if (!trimmedQuestion) {
			error = "You need to input a question";
			output = null;
			outputJson = "";
			return;
		}

		if (!imageBase64) {
			error = "You need to upload an image";
			output = null;
			outputJson = "";
			return;
		}

		const requestBody = {
			inputs: { question: trimmedQuestion, image: imageBase64 },
		};
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
		output = null;
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
	validateExample={isAssetAndTextInput}
>
	<svelte:fragment slot="top" let:isDisabled>
		<form class="space-y-2">
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
			<WidgetQuickInput
				bind:value={question}
				{isLoading}
				{isDisabled}
				onClickSubmitBtn={() => {
					getOutput();
				}}
			/>
		</form>
	</svelte:fragment>
	<svelte:fragment slot="bottom">
		{#if output}
			<WidgetOutputChart labelField="answer" classNames="pt-4" {output} />
		{/if}
	</svelte:fragment>
</WidgetWrapper>
