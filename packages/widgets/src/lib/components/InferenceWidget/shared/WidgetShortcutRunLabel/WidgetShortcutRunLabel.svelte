<script lang="ts">
	import { onMount } from "svelte";

	export let isLoading: boolean;
	export let isDisabled = false;

	let shortcutLabel = "";

	onMount(() => {
		const isMac = navigator.platform.includes("Mac");
		shortcutLabel = isMac ? "⌘+Enter" : "ctrl+Enter";
	});
</script>

{#if !isDisabled}
	<kbd
		class="hidden rounded border border-gray-200 bg-gray-100 py-0.5 px-1.5 text-xs leading-none text-gray-700 dark:bg-gray-800 dark:text-gray-300 md:inline {isLoading
			? 'opacity-40'
			: 'opacity-70'}"
		>{shortcutLabel}
	</kbd>
{/if}
