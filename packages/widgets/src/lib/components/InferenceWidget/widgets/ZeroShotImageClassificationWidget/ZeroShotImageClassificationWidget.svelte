<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleAssetAndZeroShotInput } from "@huggingface/tasks";

	import { onMount } from "svelte";

	import WidgetFileInput from "../../shared/WidgetFileInput/WidgetFileInput.svelte";
	import WidgetDropzone from "../../shared/WidgetDropzone/WidgetDropzone.svelte";
	import WidgetTextInput from "../../shared/WidgetTextInput/WidgetTextInput.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import WidgetOutputChart from "../../shared/WidgetOutputChart/WidgetOutputChart.svelte";
	import { addInferenceParameters, callInferenceApi, getWidgetExample } from "../../shared/helpers.js";
	import { isAssetAndZeroShotInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let includeCredentials: WidgetProps["includeCredentials"];
	let isDisabled = false;

	let candidateLabels = "";
	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: Array<{ label: string; score: number }> = [];
	let outputJson: string;
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

	function isValidOutput(arg: any): arg is { label: string; score: number }[] {
		return Array.isArray(arg) && arg.every((x) => typeof x.label === "string" && typeof x.score === "number");
	}

	function parseOutput(body: unknown): Array<{ label: string; score: number }> {
		if (isValidOutput(body)) {
			return body;
		}
		throw new TypeError("Invalid output: output must be of type <labels:Array; scores:Array>");
	}

	async function applyInputSample(sample: WidgetExampleAssetAndZeroShotInput, opts: ExampleRunOpts = {}) {
		candidateLabels = sample.candidate_labels;
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
		const trimmedCandidateLabels = candidateLabels.trim().split(",").join(",");

		if (!trimmedCandidateLabels) {
			error = "You need to input at least one label";
			output = [];
			outputJson = "";
			return;
		}

		if (!imageBase64) {
			error = "You need to upload an image";
			output = [];
			outputJson = "";
			return;
		}

		const requestBody = {
			image: imageBase64,
			parameters: {
				candidate_labels: trimmedCandidateLabels,
			},
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
		output = [];
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

	onMount(() => {
		(async () => {
			const example = getWidgetExample<WidgetExampleAssetAndZeroShotInput>(model, isAssetAndZeroShotInput);
			if (callApiOnMount && example) {
				await applyInputSample(example, { inferenceOpts: { isOnLoadCall: true } });
			}
		})();
	});
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
	validateExample={isAssetAndZeroShotInput}
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
			<WidgetTextInput
				bind:value={candidateLabels}
				{isDisabled}
				label="Possible class names (comma-separated)"
				placeholder="Possible class names..."
			/>
			<WidgetSubmitBtn
				{isLoading}
				{isDisabled}
				onClick={() => {
					getOutput();
				}}
			/>
		</form>
	</svelte:fragment>
	<svelte:fragment slot="bottom">
		{#if output.length}
			<WidgetOutputChart classNames="pt-4" {output} />
		{/if}
	</svelte:fragment>
</WidgetWrapper>
