<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleTextInput } from "@huggingface/tasks";

	import WidgetQuickInput from "../../shared/WidgetQuickInput/WidgetQuickInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isTextInput } from "../../shared/inputValidation.js";

	import { DataTable } from "./DataTable.js";
	import { widgetStates } from "../../stores.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: DataTable | undefined;
	let outputJson: string;
	let text = "";

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedText = text.trim();

		if (!trimmedText) {
			error = "You need to input some text";
			exampleOutput = undefined;
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
		exampleOutput = undefined;
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
		} else if (res.status === "error" && !isOnLoadCall) {
			error = res.error;
		}
	}

	function parseOutput(body: any): DataTable {
		if (Array.isArray(body)) {
			if (body.length === 1) {
				body = body[0];
			}
			return new DataTable(body);
		}
		throw new TypeError("Invalid output: output must be of type Array");
	}

	const SINGLE_DIM_COLS = 4;

	function range(n: number, b?: number): number[] {
		return b
			? Array(b - n)
					.fill(0)
					.map((_, i) => n + i)
			: Array(n)
					.fill(0)
					.map((_, i) => i);
	}
	const numOfRows = (total_elems: number) => {
		return Math.ceil(total_elems / SINGLE_DIM_COLS);
	};

	function applyWidgetExample(sample: WidgetExampleTextInput, opts: ExampleRunOpts = {}) {
		text = sample.text;
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
		validateExample={isTextInput}
	/>

	<WidgetQuickInput
		bind:value={text}
		{isLoading}
		{isDisabled}
		on:run={() => getOutput()}
		on:cmdEnter={() => getOutput()}
	/>

	<WidgetInfo {model} {computeTime} {error} {modelLoading} />

	{#if output}
		{#if output.isArrLevel0}
			<div class="mt-3 h-96 overflow-auto">
				<table class="w-full table-auto border text-right font-mono text-xs">
					{#each range(numOfRows(output.oneDim.length)) as i}
						<tr>
							{#each range(SINGLE_DIM_COLS) as j}
								{#if j * numOfRows(output.oneDim.length) + i < output.oneDim.length}
									<td class="bg-gray-100 px-1 text-gray-400 dark:bg-gray-900">
										{j * numOfRows(output.oneDim.length) + i}
									</td>
									<td class="px-1 py-0.5 {output.bg(output.oneDim[j * numOfRows(output.oneDim.length) + i])}">
										{output.oneDim[j * numOfRows(output.oneDim.length) + i].toFixed(3)}
									</td>
								{/if}
							{/each}
						</tr>
					{/each}
				</table>
			</div>
		{:else}
			<div class="mt-3 overflow-auto">
				<table class="border text-right font-mono text-xs">
					<tr>
						<td class="bg-gray-100 dark:bg-gray-900" />
						{#each range(output.twoDim[0].length) as j}
							<td class="bg-gray-100 px-1 pt-1 text-gray-400 dark:bg-gray-900">{j}</td>
						{/each}
					</tr>
					{#each output.twoDim as column, i}
						<tr>
							<td class="bg-gray-100 pl-4 pr-1 text-gray-400 dark:bg-gray-900">{i}</td>
							{#each column as x}
								<td class="px-1 py-1 {output.bg(x)}">
									{x.toFixed(3)}
								</td>
							{/each}
						</tr>
					{/each}
				</table>
			</div>
		{/if}
	{/if}

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
