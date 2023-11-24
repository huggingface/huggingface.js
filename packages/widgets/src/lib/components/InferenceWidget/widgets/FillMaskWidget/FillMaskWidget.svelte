<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "$lib/components/InferenceWidget/shared/types.js";
	import type { WidgetExampleTextInput, WidgetExampleOutputLabels, WidgetExample } from "@huggingface/tasks";

	import WidgetOutputChart from "../../shared/WidgetOutputChart/WidgetOutputChart.svelte";
	import WidgetTextarea from "../../shared/WidgetTextarea/WidgetTextarea.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import {
		addInferenceParameters,
		callInferenceApi,
		updateUrl,
	} from "$lib/components/InferenceWidget/shared/helpers.js";
	import { isValidOutputLabels } from "$lib/components/InferenceWidget/shared/outputValidation.js";
	import { isTextInput } from "$lib/components/InferenceWidget/shared/inputValidation.js";

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
	let output: Array<{ label: string; score: number }> = [];
	let outputJson: string;
	let text = "";
	let setTextAreaValue: (text: string) => void;

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts<WidgetExampleOutputLabels> = {}) {
		if (exampleOutput) {
			output = exampleOutput;
			outputJson = "";
			return;
		}

		const trimmedText = text.trim();

		if (!trimmedText) {
			error = "You need to input some text";
			output = [];
			outputJson = "";
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

	function parseOutput(body: unknown): Array<{ label: string; score: number }> {
		if (Array.isArray(body)) {
			// entries = body -> text-classificartion
			// entries = body[0] -> summarization
			const entries = (model.pipeline_tag === "text-classification" ? body[0] ?? [] : body) as Record<
				string,
				unknown
			>[];
			return entries
				.filter((x) => !!x)
				.map((x) => ({
					// label = x.label -> text-classificartion
					label: x.label ? String(x.label) : String(x.token_str),
					score: x.score ? Number(x.score) : 0,
				}));
		}
		throw new TypeError("Invalid output: output must be of type Array");
	}

	function applyInputSample(sample: WidgetExampleTextInput<WidgetExampleOutputLabels>, opts: ExampleRunOpts = {}) {
		setTextAreaValue(sample.text);
		if (opts.isPreview) {
			if (sample.output) {
				output = sample.output;
			} else {
				output = [];
			}
			return;
		}
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}

	function validateExample(sample: WidgetExample): sample is WidgetExampleTextInput<WidgetExampleOutputLabels> {
		return isTextInput(sample) && (!sample.output || isValidOutputLabels(sample.output));
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
			{#if model.pipeline_tag === "fill-mask"}
				<div class="mb-1.5 text-sm text-gray-500">
					Mask token: <code>{model.mask_token}</code>
				</div>
			{/if}
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
	</svelte:fragment>
	<svelte:fragment slot="bottom">
		<WidgetOutputChart classNames="pt-4" {output} />
	</svelte:fragment>
</WidgetWrapper>
