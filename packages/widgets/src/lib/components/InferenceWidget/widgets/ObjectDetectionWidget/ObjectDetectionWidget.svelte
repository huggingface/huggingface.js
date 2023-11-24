<script lang="ts">
	import type { WidgetProps, DetectedObject, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleAssetInput } from "@huggingface/tasks";

	import { mod } from "../../../../utils/ViewUtils.js";
	import { COLORS } from "../../shared/consts.js";
	import WidgetFileInput from "../../shared/WidgetFileInput/WidgetFileInput.svelte";
	import WidgetDropzone from "../../shared/WidgetDropzone/WidgetDropzone.svelte";
	import WidgetOutputChart from "../../shared/WidgetOutputChart/WidgetOutputChart.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { callInferenceApi, getBlobFromUrl } from "../../shared/helpers.js";
	import { isAssetInput } from "../../shared/inputValidation.js";

	import BoundingBoxes from "./SvgBoundingBoxes.svelte";

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
	let output: DetectedObject[] = [];
	let outputJson: string;
	let highlightIndex = -1;
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
		output = [];
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
			output = output.map((o, idx) => addOutputColor(o, idx));
			outputJson = res.outputJson;
			if (output.length === 0) {
				warning = "No object was detected";
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

	function addOutputColor(detObj: DetectedObject, idx: number) {
		const hash = mod(idx, COLORS.length);
		const { color } = COLORS[hash];
		return { ...detObj, color };
	}

	function isValidOutput(arg: any): arg is DetectedObject[] {
		return (
			Array.isArray(arg) &&
			arg.every(
				(x) =>
					typeof x.label === "string" &&
					typeof x.score === "number" &&
					typeof x.box.xmin === "number" &&
					typeof x.box.ymin === "number" &&
					typeof x.box.xmax === "number" &&
					typeof x.box.ymax === "number"
			)
		);
	}

	function parseOutput(body: unknown): DetectedObject[] {
		if (isValidOutput(body)) {
			return body;
		}
		throw new TypeError(
			"Invalid output: output must be of type Array<{label:string; score:number; box:{xmin:number; ymin:number; xmax:number; ymax:number}}>"
		);
	}

	function mouseout() {
		highlightIndex = -1;
	}

	function mouseover(index: number) {
		highlightIndex = index;
	}

	async function applyInputSample(sample: WidgetExampleAssetInput, opts: ExampleRunOpts = {}) {
		imgSrc = sample.src;
		if (opts.isPreview) {
			output = [];
			outputJson = "";
			return;
		}
		const blob = await getBlobFromUrl(imgSrc);
		const exampleOutput = sample.output;
		getOutput(blob, { ...opts.inferenceOpts, exampleOutput });
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
	validateExample={isAssetInput}
>
	<svelte:fragment slot="top" let:isDisabled>
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
					<BoundingBoxes {imgSrc} {mouseover} {mouseout} {output} {highlightIndex} />
				{/if}
			</WidgetDropzone>
			<!-- Better UX for mobile/table through CSS breakpoints -->
			{#if imgSrc}
				<BoundingBoxes classNames="mb-2 md:hidden" {imgSrc} {mouseover} {mouseout} {output} {highlightIndex} />
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
	</svelte:fragment>
	<svelte:fragment slot="bottom">
		<WidgetOutputChart classNames="pt-4" {output} {highlightIndex} {mouseover} {mouseout} />
	</svelte:fragment>
</WidgetWrapper>
