<script lang="ts">
	import type { ExampleRunOpts } from "../types";
	import type { WidgetExample } from "../WidgetExample";

	type TWidgetExample = $$Generic<WidgetExample>;

	import { slide } from "svelte/transition";

	import IconCaretDownV2 from "../../../Icons/IconCaretDownV2.svelte";

	export let classNames = "";
	export let isLoading = false;
	export let inputSamples: TWidgetExample[];
	export let applyInputSample: (sample: TWidgetExample, opts?: ExampleRunOpts) => void;

	let containerEl: HTMLElement;
	let isOptionsVisible = false;
	let title = "Examples";

	$: {
		// reset title on inputSamples change (i.e. input group change)
		inputSamples;
		title = "Examples";
	}

	function _applyInputSample(idx: number) {
		hideOptions();
		const sample = inputSamples[idx];
		title = sample.example_title as string;
		applyInputSample(sample);
	}

	function _previewInputSample(idx: number) {
		const sample = inputSamples[idx];
		applyInputSample(sample, { isPreview: true });
	}

	function toggleOptionsVisibility() {
		isOptionsVisible = !isOptionsVisible;
	}

	function onClick(e: MouseEvent | TouchEvent) {
		let targetElement = e.target;
		do {
			if (targetElement === containerEl) {
				// This is a click inside. Do nothing, just return.
				return;
			}
			targetElement = (targetElement as HTMLElement).parentElement;
		} while (targetElement);
		// This is a click outside
		hideOptions();
	}

	function hideOptions() {
		isOptionsVisible = false;
	}
</script>

<svelte:window on:click={onClick} />

<div
	class="relative mb-1.5 {classNames}
		{isLoading && 'pointer-events-none opacity-50'} 
		{isOptionsVisible && 'z-10'}"
	bind:this={containerEl}
>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="inline-flex w-32 justify-between rounded-md border border-gray-100 px-4 py-1"
		on:click={toggleOptionsVisibility}
	>
		<div class="truncate text-sm">{title}</div>
		<IconCaretDownV2
			classNames="-mr-1 ml-2 h-5 w-5 transition ease-in-out transform {isOptionsVisible && '-rotate-180'}"
		/>
	</div>

	{#if isOptionsVisible}
		<div
			class="absolute right-0 mt-1 w-full origin-top-right rounded-md ring-1 ring-black ring-opacity-10"
			transition:slide
		>
			<div class="rounded-md bg-white py-1" role="none">
				{#each inputSamples as { example_title }, i}
					<!-- svelte-ignore a11y-click-events-have-key-events a11y-mouse-events-have-key-events -->
					<div
						class="cursor-pointer truncate px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-200"
						on:mouseover={() => _previewInputSample(i)}
						on:click={() => _applyInputSample(i)}
					>
						{example_title}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
