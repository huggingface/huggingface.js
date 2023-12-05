<script lang="ts">
	import { InferenceDisplayability } from "@huggingface/tasks";
	import type { WidgetExample, WidgetExampleAttribute } from "@huggingface/tasks";
	import type { WidgetProps, ModelLoadInfo, ExampleRunOpts } from "../types.js";

	type TWidgetExample = $$Generic<WidgetExample>;

	import { onMount } from "svelte";

	import IconCross from "../../..//Icons/IconCross.svelte";
	import WidgetInputSamples from "../WidgetInputSamples/WidgetInputSamples.svelte";
	import WidgetInputSamplesGroup from "../WidgetInputSamplesGroup/WidgetInputSamplesGroup.svelte";
	import WidgetFooter from "../WidgetFooter/WidgetFooter.svelte";
	import WidgetHeader from "../WidgetHeader/WidgetHeader.svelte";
	import WidgetInfo from "../WidgetInfo/WidgetInfo.svelte";
	import WidgetModelLoading from "../WidgetModelLoading/WidgetModelLoading.svelte";
	import { getModelLoadInfo, getQueryParamVal, getWidgetExample } from "../../..//InferenceWidget/shared/helpers.js";
	import { modelLoadStates } from "../../stores.js";

	export let apiUrl: string;
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let computeTime: string;
	export let error: string;
	export let isLoading = false;
	export let model: WidgetProps["model"];
	export let includeCredentials: WidgetProps["includeCredentials"];
	export let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	export let noTitle = false;
	export let outputJson: string;
	export let applyInputSample: (sample: TWidgetExample, opts?: ExampleRunOpts) => void = () => {};
	export let validateExample: (sample: WidgetExample) => sample is TWidgetExample;
	export let exampleQueryParams: WidgetExampleAttribute[] = [];

	let isDisabled = model.inference !== InferenceDisplayability.Yes && model.pipeline_tag !== "reinforcement-learning";
	let isMaximized = false;
	let modelLoadInfo: ModelLoadInfo | undefined = undefined;
	let selectedInputGroup: string;
	let modelTooBig = false;

	interface ExamplesGroup {
		group: string;
		inputSamples: TWidgetExample[];
	}

	const allInputSamples = (model.widgetData ?? [])
		.filter(validateExample)
		.sort((sample1, sample2) => (sample2.example_title ? 1 : 0) - (sample1.example_title ? 1 : 0))
		.map((sample, idx) => ({
			example_title: `Example ${++idx}`,
			group: "Group 1",
			...sample,
		}));
	let inputSamples = !isDisabled ? allInputSamples : allInputSamples.filter((sample) => sample.output !== undefined);
	let inputGroups = getExamplesGroups();

	$: selectedInputSamples =
		inputGroups.length === 1 ? inputGroups[0] : inputGroups.find(({ group }) => group === selectedInputGroup);

	function getExamplesGroups(): ExamplesGroup[] {
		const inputGroups: ExamplesGroup[] = [];
		for (const inputSample of inputSamples) {
			const groupExists = inputGroups.find(({ group }) => group === inputSample.group);
			if (!groupExists) {
				inputGroups.push({ group: inputSample.group as string, inputSamples: [] });
			}
			inputGroups.find(({ group }) => group === inputSample.group)?.inputSamples.push(inputSample);
		}
		return inputGroups;
	}

	onMount(() => {
		(async () => {
			if (model.inference === InferenceDisplayability.Yes) {
				modelLoadInfo = await getModelLoadInfo(apiUrl, model.id, includeCredentials);
				$modelLoadStates[model.id] = modelLoadInfo;
				modelTooBig = modelLoadInfo?.state === "TooBig";

				if (modelTooBig) {
					// disable the widget
					isDisabled = true;
					inputSamples = allInputSamples.filter((sample) => sample.output !== undefined);
					inputGroups = getExamplesGroups();
				}
			}

			const exampleFromQueryParams = {} as TWidgetExample;
			for (const key of exampleQueryParams) {
				const val = getQueryParamVal(key);
				if (val) {
					// @ts-expect-error complicated type
					exampleFromQueryParams[key] = val;
				}
			}
			if (Object.keys(exampleFromQueryParams).length) {
				// run widget example from query params
				applyInputSample(exampleFromQueryParams);
			} else {
				// run random widget example
				const example = getWidgetExample<TWidgetExample>(model, validateExample);
				if (callApiOnMount && example) {
					applyInputSample(example, { inferenceOpts: { isOnLoadCall: true } });
				}
			}
		})();
	});
</script>

{#if isDisabled && !inputSamples.length}
	<WidgetHeader pipeline={model.pipeline_tag} noTitle={true} />
	<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelTooBig} />
{:else}
	<!-- require that we have `modelLoadInfo` for InferenceDisplayability.Yes models -->
	{#if modelLoadInfo || model.inference !== InferenceDisplayability.Yes}
		<div
			class="flex w-full max-w-full flex-col
			 {isMaximized ? 'fixed inset-0 z-20 bg-white p-12' : ''}"
		>
			{#if isMaximized}
				<button class="absolute right-12 top-6" on:click={() => (isMaximized = !isMaximized)}>
					<IconCross classNames="text-xl text-gray-500 hover:text-black" />
				</button>
			{/if}
			<WidgetHeader {noTitle} pipeline={model.pipeline_tag} {isDisabled}>
				{#if !!inputGroups.length}
					<div class="ml-auto flex gap-x-1">
						<!-- Show samples selector when there are more than one sample -->
						{#if inputGroups.length > 1}
							<WidgetInputSamplesGroup
								bind:selectedInputGroup
								{isLoading}
								inputGroups={inputGroups.map(({ group }) => group)}
							/>
						{/if}
						<WidgetInputSamples
							classNames={!selectedInputSamples ? "opacity-50 pointer-events-none" : ""}
							{isLoading}
							inputSamples={selectedInputSamples?.inputSamples ?? []}
							{applyInputSample}
						/>
					</div>
				{/if}
			</WidgetHeader>
			<slot name="top" {isDisabled} />
			<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelTooBig} />
			{#if modelLoading.isLoading}
				<WidgetModelLoading estimatedTime={modelLoading.estimatedTime} />
			{/if}
			<slot name="bottom" />
			<WidgetFooter bind:isMaximized {outputJson} {isDisabled} />
		</div>
	{/if}
{/if}
