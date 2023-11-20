<script lang="ts">
	let isPromptTipOpen = false;
	export let decodingStrategy: "sampling" | "greedy" = "sampling";
	$: isSampling = decodingStrategy === "sampling";
	$: description =
		decodingStrategy === "sampling"
			? 'Switch to "greedy" for more accurate completion e.g. math/history/translations (but which may be repetitive/less inventive)'
			: 'Switch to "sampling" for more imaginative completions e.g. story/poetry (but which may be less accurate)';

	function toggleState() {
		decodingStrategy = decodingStrategy === "sampling" ? "greedy" : "sampling";
	}
</script>

<svelte:window on:click={() => (isPromptTipOpen = false)} />

<div>
	<div class="flex w-full justify-between">
		<div class="flex items-center gap-x-2">
			<span class="transition-opacity {isSampling ? 'opacity-80' : 'opacity-40'}">sampling</span>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="cursor-pointer" on:click={toggleState}>
				<div class="relative h-2 w-8 rounded-full border-2 border-blue-200 dark:border-blue-800">
					<div
						class="absolute -mt-1.5 h-4 w-4 rounded-full bg-blue-400 transition-transform dark:bg-blue-600 {!isSampling
							? 'translate-x-3.5'
							: '-translate-x-0.5'}"
					/>
				</div>
			</div>
			<span class="transition-opacity {!isSampling ? 'opacity-80' : 'opacity-40'}">greedy</span>
		</div>
		<div class="relative">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<span class="cursor-pointer text-xs" on:click|stopPropagation={() => (isPromptTipOpen = true)}
				>ⓘ <span class="underline">BLOOM prompting tips</span></span
			>
			{#if isPromptTipOpen}
				<div
					class="absolute right-0 z-10 w-56 rounded bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
				>
					A good prompt: Do NOT talk to Bloom as an entity, it's not a chatbot but a webpage/blog/article completion
					model. For the best behaviours: MIMIC a few words of a webpage similar to the content you want to generate.
					Start a sentence as if YOU were writing a blog, webpage, math post, coding article and Bloom will generate a
					coherent follow-up.
				</div>
			{/if}
		</div>
	</div>
	<p
		class="my-1 rounded border border-gray-200 bg-gray-100 py-0.5 px-1.5 leading-none text-gray-700 opacity-70 dark:bg-gray-800 dark:text-gray-300"
	>
		{description}
	</p>
</div>
