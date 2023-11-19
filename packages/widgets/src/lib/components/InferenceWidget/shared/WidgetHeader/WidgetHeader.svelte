<script lang="ts">
	import type { PipelineType } from "../../../../interfaces/Types";

	import { getPipelineTask } from "../../../../utils/ViewUtils";
	import { TASKS_DATA } from "../../../../../../../tasks/src/tasksData";
	import IconInfo from "../../../Icons/IconInfo.svelte";
	import IconLightning from "../../../Icons/IconLightning.svelte";
	import PipelineTag from "../../../PipelineTag/PipelineTag.svelte";

	export let noTitle = false;
	export let title: string | null = null;
	export let pipeline: PipelineType | undefined;
	export let isDisabled = false;

	$: task = pipeline ? getPipelineTask(pipeline) : undefined;
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
					Inference API
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
		<a
			class={TASKS_DATA[task] ? "hover:underline" : undefined}
			href={TASKS_DATA[task] ? `/tasks/${task}` : undefined}
			target="_blank"
			title={TASKS_DATA[task] ? `Learn more about ${task}` : undefined}
		>
			<PipelineTag classNames="mr-2 mb-1.5" {pipeline} />
		</a>
	{/if}
	<slot />
</div>
