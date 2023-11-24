<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleTextInput, WidgetExampleOutputText, WidgetExample } from "@huggingface/tasks";

	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetShortcutRunLabel from "../../shared/WidgetShortcutRunLabel/WidgetShortcutRunLabel.svelte";
	import WidgetBloomDecoding from "../../shared/WidgetBloomDecoding/WidgetBloomDecoding.svelte";
	import WidgetTextarea from "../../shared/WidgetTextarea/WidgetTextarea.svelte";
	import WidgetTimer from "../../shared/WidgetTimer/WidgetTimer.svelte";
	import WidgetOutputText from "../../shared/WidgetOutputText/WidgetOutputText.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isValidOutputText } from "../../shared/outputValidation.js";
	import { isTextInput } from "../../shared/inputValidation.js";
	import type { PipelineType } from "@huggingface/tasks";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];
	export let isLoggedIn: WidgetProps["includeCredentials"];

	const isBloomLoginRequired = isLoggedIn === false && model.id === "bigscience/bloom";

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
	let warning: string = "";
	let renderTypingEffect: (outputTxt: string) => Promise<void>;
	let inferenceTimer: any;
	let setTextAreaValue: (text: string) => void;
	let decodingStrategy: "sampling" | "greedy" = "sampling";

	// Deactivate server caching for these two pipeline types
	// (translation uses this widget too and still needs caching)
	const useCache = !(["text-generation", "text2text-generation"] as Array<PipelineType>).includes(
		model.pipeline_tag as PipelineType
	);

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		useCache = true,
		exampleOutput = undefined,
	}: InferenceRunOpts<WidgetExampleOutputText> = {}) {
		if (isBloomLoginRequired) {
			return;
		}

		if (exampleOutput) {
			output = exampleOutput.text;
			outputJson = "";
			renderExampleOutput(output);
			return;
		}

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

		const requestBody = { inputs: trimmedValue, parameters: {} as unknown };
		addInferenceParameters(requestBody, model);

		if (model.id === "bigscience/bloom") {
			// see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
			const parameters = {
				seed: Date.now() % 100,
				early_stopping: false,
				length_penalty: 0.0,
				max_new_tokens: 20,
				...(decodingStrategy === "sampling" && {
					top_p: 0.9,
				}),
				do_sample: decodingStrategy === "sampling",
			};
			requestBody["parameters"] = parameters;
		}

		isLoading = true;
		inferenceTimer.start();

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

		// Reset values
		computeTime = "";
		error = "";
		warning = "";
		modelLoading = { isLoading: false, estimatedTime: 0 };
		output = "";
		outputJson = "";

		if (res.status === "success") {
			computeTime = res.computeTime;
			output = res.output;
			outputJson = res.outputJson;
			if (output.length === 0) {
				warning = "No text was generated";
			} else if (model?.pipeline_tag === "text-generation") {
				const outputWithoutInput = output.slice(text.length);
				inferenceTimer.stop();
				if (outputWithoutInput.length === 0) {
					warning = "No text was generated";
				} else {
					await renderTypingEffect(outputWithoutInput);
				}
			}
		} else if (res.status === "loading-model") {
			modelLoading = {
				isLoading: true,
				estimatedTime: res.estimatedTime,
			};
			getOutput({ withModelLoading: true, useCache });
		} else if (res.status === "error") {
			error = res.error;
		}

		isLoading = false;
		inferenceTimer.stop();
	}

	function parseOutput(body: unknown): string {
		if (Array.isArray(body) && body.length) {
			const firstEntry = body[0];
			return (
				firstEntry["generated_text"] ?? // text-generation + text2text-generation
				firstEntry["translation_text"] ?? // translation
				""
			);
		}
		throw new TypeError("Invalid output: output must be of type Array & non-empty");
	}

	function renderExampleOutput(output: string) {
		// if output doesn't start with space, add space in front of output
		const prefix = /^\s/.test(output) ? "" : " ";
		renderTypingEffect(prefix + output);
	}

	function applyInputSample(sample: WidgetExampleTextInput<WidgetExampleOutputText>, opts: ExampleRunOpts = {}) {
		setTextAreaValue(sample.text);
		if (opts.isPreview) {
			if (sample.output) {
				outputJson = "";
				output = sample.output.text;
				renderExampleOutput(output);
			} else {
				output = "";
				outputJson = "";
			}
			return;
		}
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, useCache, exampleOutput });
	}

	function validateExample(sample: WidgetExample): sample is WidgetExampleTextInput<WidgetExampleOutputText> {
		return isTextInput(sample) && (!sample.output || isValidOutputText(sample.output));
	}

	function redirectLogin() {
		window.location.href = `/login?next=${encodeURIComponent(window.location.href)}`;
	}

	function redirectJoin() {
		window.location.href = `/join?next=${encodeURIComponent(window.location.href)}`;
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
		<form class="space-y-2">
			<WidgetTextarea
				bind:value={text}
				bind:setValue={setTextAreaValue}
				{isLoading}
				{isDisabled}
				size="big"
				bind:renderTypingEffect
			/>
			{#if model.id === "bigscience/bloom"}
				<WidgetBloomDecoding bind:decodingStrategy />
			{/if}
			<div class="flex items-center gap-x-2 {isBloomLoginRequired ? 'pointer-events-none opacity-50' : ''}">
				<WidgetSubmitBtn
					{isLoading}
					{isDisabled}
					onClick={() => {
						getOutput({ useCache });
					}}
				/>
				<WidgetShortcutRunLabel {isLoading} {isDisabled} />
				<div class="ml-auto self-start">
					<WidgetTimer bind:this={inferenceTimer} {isDisabled} />
				</div>
			</div>
			{#if warning}
				<div class="alert alert-warning mt-2">{warning}</div>
			{/if}
			{#if isBloomLoginRequired}
				<div class="alert alert-warning mt-2">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					Please
					<span class="cursor-pointer underline" on:click={redirectLogin}>login</span>
					or
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<span class="cursor-pointer underline" on:click={redirectJoin}>register</span> to try BLOOM 🌸
				</div>
			{/if}
		</form>
	</svelte:fragment>
	<svelte:fragment slot="bottom">
		{#if model?.pipeline_tag !== "text-generation"}
			<!-- for pipelines: text2text-generation & translation -->
			<WidgetOutputText classNames="mt-4" {output} />
		{/if}
	</svelte:fragment>
</WidgetWrapper>
