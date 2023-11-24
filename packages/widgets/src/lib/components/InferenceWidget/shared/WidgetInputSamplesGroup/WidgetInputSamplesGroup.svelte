<script lang="ts">
	import { slide } from "svelte/transition";

	import IconCaretDownV2 from "../../..//Icons/IconCaretDownV2.svelte";

	export let classNames = "";
	export let isLoading = false;
	export let inputGroups: string[];
	export let selectedInputGroup: string;

	let containerEl: HTMLElement;
	let isOptionsVisible = false;
	let title = "Groups";

	function chooseInputGroup(idx: number) {
		hideOptions();
		const inputGroup = inputGroups[idx];
		title = inputGroup;
		selectedInputGroup = inputGroup;
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
				{#each inputGroups as inputGroup, i}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="truncate px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-200"
						on:click={() => chooseInputGroup(i)}
					>
						{inputGroup}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
