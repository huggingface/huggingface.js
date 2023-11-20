<script lang="ts">
	import { fly } from "svelte/transition";

	interface Output {
		aggregator?: string;
		answer: string;
		coordinates: [number, number][];
		cells: number[];
	}

	export let output: Output;
	export let isAnswerOnlyOutput: boolean;
</script>

<div
	class="col-span-12 flex h-10 items-center overflow-x-auto rounded-t-lg border border-b-0 bg-gradient-to-r to-white px-3 dark:to-gray-950 {!!output
		?.cells?.length || isAnswerOnlyOutput
		? 'via-green border-green-50 from-green-50 dark:border-green-800 dark:from-green-800'
		: 'via-red border-red-50 from-red-50 dark:border-red-800 dark:from-red-800'}"
	in:fly
>
	{#if isAnswerOnlyOutput}
		<span
			class="ml-2 whitespace-nowrap rounded border border-green-200 bg-green-100 px-1 leading-tight text-green-800 dark:border-green-700 dark:bg-green-800 dark:text-green-100"
			>{output.answer}</span
		>
	{:else}
		<span class="whitespace-nowrap">
			{#if output.cells.length}
				{output.cells.length}
				match{output.cells.length > 1 ? "es" : ""}
				:
			{:else}
				No matches
			{/if}
		</span>
		{#if output.cells.length}
			{#each output.cells as answer}
				<span
					class="ml-2 whitespace-nowrap rounded border border-green-200 bg-green-100 px-1 leading-tight text-green-800 dark:border-green-700 dark:bg-green-800 dark:text-green-100"
					>{answer}</span
				>
			{/each}
			{#if output.aggregator !== "NONE"}
				<span
					class="ml-auto whitespace-nowrap rounded border border-blue-200 bg-blue-100 px-1 leading-tight text-blue-800 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-100"
					>{output.aggregator}</span
				>
			{/if}
		{/if}
	{/if}
</div>
