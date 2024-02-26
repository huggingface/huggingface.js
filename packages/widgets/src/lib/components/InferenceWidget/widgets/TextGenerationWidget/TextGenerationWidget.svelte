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
	import { widgetStates } from "../../stores.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];
	export let isLoggedIn: WidgetProps["includeCredentials"];

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

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
	let renderTextOutput: (outputTxt: string, typingEffect?: boolean) => Promise<void>;
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
		example = undefined,
	}: InferenceRunOpts<WidgetExampleOutputText> = {}) {
		if (isBloomLoginRequired) {
			return;
		}

		if (example) {
			output = example.text;
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

		const parameters = {} as any;
		if (model?.pipeline_tag === "text-generation") {
			// todo: until streaming is supported https://github.com/huggingface/huggingface.js/issues/410
			parameters["max_new_tokens"] = 20;
		}
		const requestBody = { inputs: trimmedValue, parameters };
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
					await renderTextOutput(outputWithoutInput);
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
		renderTextOutput(prefix + output, false);
	}

	function applyWidgetExample(example: WidgetExampleTextInput<WidgetExampleOutputText>, opts: ExampleRunOpts = {}) {
		setTextAreaValue(example.text);
		if (opts.isPreview) {
			if (example.output) {
				outputJson = "";
				output = example.output.text;
				renderExampleOutput(output);
			} else {
				output = "";
				outputJson = "";
			}
			return;
		}
		getOutput({ ...opts.inferenceOpts, useCache, example });
	}

	function validateExample(example: WidgetExample): example is WidgetExampleTextInput<WidgetExampleOutputText> {
		return isTextInput(example) && (!example.output || isValidOutputText(example.output));
	}

	function redirectLogin() {
		window.location.href = `/login?next=${encodeURIComponent(window.location.href)}`;
	}

	function redirectJoin() {
		window.location.href = `/join?next=${encodeURIComponent(window.location.href)}`;
	}
</script>

<WidgetWrapper {apiUrl} {includeCredentials} {model} let:WidgetInfo let:WidgetHeader let:WidgetFooter>
	<WidgetHeader {noTitle} {model} {isLoading} {isDisabled} {callApiOnMount} {applyWidgetExample} {validateExample} />
	<div class="space-y-2">
		<WidgetTextarea
			bind:value={text}
			bind:setValue={setTextAreaValue}
			{isLoading}
			{isDisabled}
			size="big"
			bind:renderTextOutput
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
	</div>
	<WidgetInfo {model} {computeTime} {error} {modelLoading} />

	{#if model?.pipeline_tag !== "text-generation"}
		<!-- for pipelines: text2text-generation & translation -->
		<WidgetOutputText classNames="mt-4" {output} />
	{/if}

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
