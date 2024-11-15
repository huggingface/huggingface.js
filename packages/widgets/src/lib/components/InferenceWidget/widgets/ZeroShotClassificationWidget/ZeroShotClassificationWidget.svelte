<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleZeroShotTextInput } from "@huggingface/tasks";

	import WidgetCheckbox from "../../shared/WidgetCheckbox/WidgetCheckbox.svelte";
	import WidgetOutputChart from "../../shared/WidgetOutputChart/WidgetOutputChart.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetTextarea from "../../shared/WidgetTextarea/WidgetTextarea.svelte";
	import WidgetTextInput from "../../shared/WidgetTextInput/WidgetTextInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isZeroShotTextInput } from "../../shared/inputValidation.js";
	import { widgetStates } from "../../stores.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

	let candidateLabels = "";
	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let multiClass = false;
	let output: Array<{ label: string; score: number }> = [];
	let outputJson: string;
	let text = "";
	let warning: string = "";
	let setTextAreaValue: (text: string) => void;

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedText = text.trim();
		const trimmedCandidateLabels = candidateLabels.trim().split(",").join(",");

		if (!trimmedText) {
			error = "You need to input some text";
			output = [];
			outputJson = "";
			return;
		}

		if (!trimmedCandidateLabels) {
			error = "You need to input at least one label";
			output = [];
			outputJson = "";
			return;
		}

		if (shouldUpdateUrl && !isOnLoadCall) {
			updateUrl({
				candidate_labels: trimmedCandidateLabels,
				multi_class: multiClass ? "true" : "false",
				text: trimmedText,
			});
		}

		const requestBody = {
			inputs: trimmedText,
			parameters: {
				candidate_labels: trimmedCandidateLabels,
				multi_class: multiClass,
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
		warning = "";
		modelLoading = { isLoading: false, estimatedTime: 0 };
		output = [];
		outputJson = "";

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
			getOutput({ withModelLoading: true });
		} else if (res.status === "error" && !isOnLoadCall) {
			error = res.error;
		}
	}

	function parseOutput(body: unknown): Array<{ label: string; score: number }> {
		if (
			body &&
			typeof body === "object" &&
			"labels" in body &&
			Array.isArray(body["labels"]) &&
			"scores" in body &&
			Array.isArray(body["scores"])
		) {
			const scores = body["scores"];
			return body["labels"]
				.filter((_, i) => scores[i] !== null || scores[i] !== undefined)
				.map((x, i) => ({
					label: x ?? "",
					score: scores[i] ?? 0,
				}));
		}
		throw new TypeError("Invalid output: output must be of type <labels:Array; scores:Array>");
	}

	function applyWidgetExample(sample: WidgetExampleZeroShotTextInput, opts: ExampleRunOpts = {}) {
		candidateLabels = sample.candidate_labels;
		multiClass = sample.multi_class;
		setTextAreaValue(sample.text);
		if (opts.isPreview) {
			return;
		}
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}
</script>

<WidgetWrapper {apiUrl} {includeCredentials} {model} let:WidgetInfo let:WidgetHeader let:WidgetFooter>
	<WidgetHeader
		{noTitle}
		{model}
		{isLoading}
		{isDisabled}
		{callApiOnMount}
		{applyWidgetExample}
		validateExample={isZeroShotTextInput}
	/>
	<div class="flex flex-col space-y-2">
		<WidgetTextarea
			bind:value={text}
			bind:setValue={setTextAreaValue}
			{isDisabled}
			placeholder="Text to classify..."
			on:cmdEnter={() => getOutput()}
		/>
		<WidgetTextInput
			bind:value={candidateLabels}
			{isLoading}
			{isDisabled}
			label="Possible class names (comma-separated)"
			placeholder="Possible class names..."
			on:cmdEnter={() => getOutput()}
		/>
		<WidgetCheckbox bind:checked={multiClass} label="Allow multiple true classes" />
		<WidgetSubmitBtn {isLoading} {isDisabled} on:run={() => getOutput()} />
		{#if warning}
			<div class="alert alert-warning mt-2">{warning}</div>
		{/if}
	</div>
	<WidgetInfo {model} {computeTime} {error} {modelLoading} />

	{#if output.length}
		<WidgetOutputChart classNames="pt-4" {output} />
	{/if}

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
