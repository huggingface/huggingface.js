<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleSentenceSimilarityInput } from "@huggingface/tasks";

	import WidgetOutputChart from "../../shared/WidgetOutputChart/WidgetOutputChart.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetAddSentenceBtn from "../../shared/WidgetAddSentenceBtn/WidgetAddSentenceBtn.svelte";
	import WidgetTextInput from "../../shared/WidgetTextInput/WidgetTextInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi } from "../../shared/helpers.js";
	import { isSentenceSimilarityInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	let sourceSentence = "";
	let comparisonSentences: Array<string> = [];
	let nComparisonSentences = 2;
	const maxComparisonSentences = 5;
	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: Array<{ label: string; score: number }> = [];
	let outputJson: string;

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedSourceSentence = sourceSentence.trim();
		if (!trimmedSourceSentence) {
			error = "You need to input some text";
			output = [];
			outputJson = "";
			return;
		}

		const trimmedComparisonSentences: Array<string> = [];
		let emptySentence = false;
		for (const sentence of comparisonSentences) {
			const trimmedSentence = sentence.trim();
			if (!trimmedSentence) {
				emptySentence = true;
			}
			trimmedComparisonSentences.push(trimmedSentence);
		}
		if (emptySentence) {
			error = "You need to specify the comparison sentences";
			output = [];
			outputJson = "";
			return;
		}
		if (comparisonSentences.length < 2) {
			error = "You need to specify at least 2 comparison sentences";
			output = [];
			outputJson = "";
			return;
		}

		const requestBody = {
			inputs: {
				source_sentence: trimmedSourceSentence,
				sentences: trimmedComparisonSentences,
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

		if (res.status === "success") {
			computeTime = res.computeTime;
			for (let i = 0; i < res.output.length; i++) {
				output.push({
					label: trimmedComparisonSentences[i],
					score: res.output[i],
				});
			}
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

	function parseOutput(body: unknown): Array<number> {
		if (Array.isArray(body)) {
			return body;
		}
		throw new TypeError("Invalid output: output must be of type Array");
	}

	function applyWidgetExample(sample: WidgetExampleSentenceSimilarityInput, opts: ExampleRunOpts = {}) {
		sourceSentence = sample.source_sentence;
		comparisonSentences = sample.sentences;
		nComparisonSentences = comparisonSentences.length;
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
		{applyWidgetExample}
		validateExample={isSentenceSimilarityInput}
	/>
	<form class="flex flex-col space-y-2">
		<WidgetTextInput
			bind:value={sourceSentence}
			{isDisabled}
			label="Source Sentence"
			placeholder={isDisabled ? "" : "Your sentence here..."}
		/>
		<WidgetTextInput
			bind:value={comparisonSentences[0]}
			{isDisabled}
			label="Sentences to compare to"
			placeholder={isDisabled ? "" : "Your sentence here..."}
		/>
		{#each Array(nComparisonSentences - 1) as _, idx}
			<WidgetTextInput bind:value={comparisonSentences[idx + 1]} {isDisabled} placeholder="Your sentence here..." />
		{/each}
		<WidgetAddSentenceBtn
			isDisabled={nComparisonSentences === maxComparisonSentences || isDisabled}
			onClick={() => {
				nComparisonSentences++;
			}}
		/>
		<WidgetSubmitBtn
			{isLoading}
			{isDisabled}
			onClick={() => {
				getOutput();
			}}
		/>
	</form>
	<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelLoading} />

	{#if output.length}
		<WidgetOutputChart classNames="pt-4" {output} />
	{/if}

	<WidgetFooter {isDisabled} {outputJson} />
</WidgetWrapper>
