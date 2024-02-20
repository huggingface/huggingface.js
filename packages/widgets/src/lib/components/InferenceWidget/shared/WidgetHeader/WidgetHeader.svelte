<script lang="ts">
	import { tgiSupportedModels, updateWidgetState } from "../../stores.js";
	import { TASKS_DATA } from "@huggingface/tasks";
	import type { WidgetExample, WidgetExampleAttribute } from "@huggingface/tasks";
	import type { WidgetProps, ExampleRunOpts } from "../types.js";
	import { getPipelineTask } from "../../../../utils/ViewUtils.js";
	import IconInfo from "../../..//Icons/IconInfo.svelte";
	import IconLightning from "../../..//Icons/IconLightning.svelte";
	import PipelineTag from "../../../PipelineTag/PipelineTag.svelte";
	import WidgetExamples from "../WidgetExamples/WidgetExamples.svelte";

	type TWidgetExample = $$Generic<WidgetExample>;

	export let model: WidgetProps["model"];
	export let noTitle = false;
	export let title: string | null = null;
	export let isLoading = false;
	export let isDisabled = false;
	export let applyWidgetExample: ((sample: TWidgetExample, opts?: ExampleRunOpts) => void) | undefined = undefined;
	export let validateExample: ((sample: WidgetExample) => sample is TWidgetExample) | undefined = undefined;
	export let callApiOnMount: WidgetProps["callApiOnMount"] = false;
	export let exampleQueryParams: WidgetExampleAttribute[] = [];

	const pipeline = model?.pipeline_tag;

	$: task = pipeline ? getPipelineTask(pipeline) : undefined;

	$: validExamples = getValidExamples(isDisabled);

	function getValidExamples(isDisabled: boolean): TWidgetExample[] {
		const examples = (model?.widgetData ?? []).filter(
			(sample): sample is TWidgetExample =>
				(validateExample?.(sample) ?? false) && (!isDisabled || sample.output !== undefined)
		);

		// if there are no examples with outputs AND model.inference !== InferenceDisplayability.Yes
		// then widget will show InferenceDisplayability error to the user without showing anything else
		if (isDisabled && !examples.length) {
			updateWidgetState(model.id, "noInference", true);
		}

		return examples;
	}
</script>

<div class="mb-2 flex items-center font-semibold">
	{#if !noTitle}
		{#if title}
			<div class="flex items-center text-lg">
				{title}
			</div>
		{:else}
			<div class="flex items-center text-lg">
				{#if !isDisabled}
					<IconLightning classNames="-ml-1 mr-1 text-yellow-500" />
					Inference API (serverless)
				{:else}
					Inference Examples
				{/if}
			</div>
			<a target="_blank" href="https://huggingface.co/docs/hub/models-widgets#example-outputs">
				<IconInfo classNames="ml-1.5 text-sm text-gray-400 hover:text-black" />
			</a>
		{/if}
	{/if}
</div>
<div class="mb-0.5 flex w-full max-w-full flex-wrap items-center justify-between text-sm text-gray-500">
	{#if pipeline && task}
		<div class="flex gap-4 items-center mb-1.5">
			<a
				class={TASKS_DATA[task] ? "hover:underline" : undefined}
				href={TASKS_DATA[task] ? `/tasks/${task}` : undefined}
				target="_blank"
				title={TASKS_DATA[task] ? `Learn more about ${task}` : undefined}
			>
				<PipelineTag {pipeline} />
			</a>
			{#if $tgiSupportedModels?.has(model.id)}
				<p class="text-xs text-gray-400">
					Streaming with <a href="https://huggingface.co/docs/text-generation-inference" class="underline">TGI</a>
				</p>
			{/if}
		</div>
	{/if}

	{#if validExamples.length && applyWidgetExample}
		<WidgetExamples {validExamples} {isLoading} {applyWidgetExample} {callApiOnMount} {exampleQueryParams} />
	{/if}
</div>
