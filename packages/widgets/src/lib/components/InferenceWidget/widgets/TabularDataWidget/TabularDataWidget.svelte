<script lang="ts">
	import type { WidgetProps, HighlightCoordinates, InferenceRunOpts, ExampleRunOpts } from "../../shared/types.js";
	import type { WidgetExampleStructuredDataInput, WidgetExampleOutputLabels } from "@huggingface/tasks";

	import WidgetTableInput from "../../shared/WidgetTableInput/WidgetTableInput.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { mod } from "../../../../utils/ViewUtils.js";
	import {
		addInferenceParameters,
		convertDataToTable,
		convertTableToData,
		callInferenceApi,
		updateUrl,
	} from "../../shared/helpers.js";
	import { isStructuredDataInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	const widgetData = model?.widgetData?.[0] as WidgetExampleStructuredDataInput<WidgetExampleOutputLabels> | undefined;
	const columns: string[] = Object.keys(widgetData?.structured_data ?? {});

	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: (string | number)[] | null = [];
	let outputJson: string;
	let table: (string | number)[][] = [columns];

	let highlighted: HighlightCoordinates = {};
	let highlightErrorKey = "";
	let scrollTableToRight: () => Promise<void>;
	let tableWithOutput: (string | number)[][];
	$: {
		const structuredData = convertTableToData(table);
		if (output?.length) {
			structuredData.Prediction = output;
			const lastColIndex = Object.keys(structuredData).length - 1;
			highlighted = highlightOutput(output, lastColIndex);
			scrollTableToRight();
		} else {
			delete structuredData.Prediction;
			highlighted = {};
			if (highlightErrorKey) {
				highlighted[highlightErrorKey] = "bg-red-100 border-red-100 dark:bg-red-800 dark:border-red-800";
				highlightErrorKey = "";
			}
		}
		tableWithOutput = convertDataToTable(structuredData);
	}

	const COLORS = ["blue", "green", "yellow", "purple", "red"] as const;

	function onChangeTable(updatedTable: (string | number)[][]) {
		table = updatedTable;
		output = [];
	}

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		for (let [i, row] of table.entries()) {
			for (const [j, cell] of row.entries()) {
				if (!String(cell)) {
					error = `Missing value at row=${i} & column='${columns[j]}'`;
					highlightErrorKey = `${--i}-${j}`;
					output = null;
					outputJson = "";
					return;
				}
				// tabular-data backend expects value `NaN` for "null value"
				if (/(null|nan)/i.test(String(cell))) {
					table[i][j] = "NaN";
				}
			}
		}

		// strip prediction column
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { Prediction, ...tableWithoutOutput } = convertTableToData(tableWithOutput);

		if (shouldUpdateUrl && !isOnLoadCall) {
			updateUrl({
				structured_data: JSON.stringify(tableWithoutOutput),
			});
		}

		const requestBody = {
			inputs: {
				data: tableWithoutOutput,
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

	function isValidOutput(arg: any): arg is (string | number)[] {
		return Array.isArray(arg) && arg.every((x) => typeof x === "string" || typeof x === "number");
	}

	function parseOutput(body: unknown): (string | number)[] {
		if (isValidOutput(body)) {
			return body;
		}
		throw new TypeError("Invalid output: output must be of type Array<string | number>");
	}

	function highlightOutput(output: (string | number)[], colIndex: number): HighlightCoordinates {
		const set: Set<string | number> = new Set(output);
		const classes = set.size < COLORS.length ? Object.fromEntries([...set].map((cls, i) => [cls, i])) : {};

		return Object.fromEntries(
			output.map((row, rowIndex) => {
				const colorIndex = classes[row] ?? mod(rowIndex, COLORS.length);
				const color = COLORS[colorIndex];
				return [
					`${rowIndex}-${colIndex}`,
					`bg-${color}-100 border-${color}-100 dark:bg-${color}-800 dark:border-${color}-800`,
				];
			})
		);
	}

	function applyWidgetExample(sample: WidgetExampleStructuredDataInput, opts: ExampleRunOpts = {}) {
		table = convertDataToTable(sample.structured_data);
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
		validateExample={isStructuredDataInput}
	/>
	<form>
		<div class="mt-4">
			{#if table.length > 1 || table[1]?.length > 1}
				<WidgetTableInput
					{highlighted}
					{isLoading}
					{isDisabled}
					onChange={onChangeTable}
					table={tableWithOutput}
					canAddCol={false}
					bind:scrollTableToRight
				/>
			{/if}
		</div>
		<WidgetSubmitBtn
			{isLoading}
			{isDisabled}
			onClick={() => {
				getOutput();
			}}
		/>
	</form>
	<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelLoading} />
	<WidgetFooter {isDisabled} {outputJson} />
</WidgetWrapper>
