<script lang="ts">
	import type { WidgetProps } from "../types.js";
	import { widgetStates, updateWidgetState, isLoggedIn } from "../../stores.js";
	import IconCode from "../../..//Icons/IconCode.svelte";
	import IconMaximize from "../../..//Icons/IconMaximize.svelte";
	import LogInPopover from "../../../../components/LogInPopover/LogInPopover.svelte";

	export let model: WidgetProps["model"];
	export let outputJson: string;
	export let isDisabled = false;

	$: isMaximized = $widgetStates?.[model.id]?.isMaximized;

	let isOutputJsonVisible = false;
	let popOverOpen = false;
</script>

<div class="mt-auto flex items-center pt-4 text-xs text-gray-500">
	{#if !isDisabled}
		<button
			class="flex items-center {outputJson ? '' : 'cursor-not-allowed text-gray-300'}"
			disabled={!outputJson}
			type="button"
			on:click={() => {
				isOutputJsonVisible = !isOutputJsonVisible;
			}}
		>
			<IconCode classNames="mr-1" />
			JSON Output
		</button>
	{/if}
	<LogInPopover bind:open={popOverOpen} classNames="ml-auto">
		<button
			class="flex items-center"
			type="button"
			on:click|preventDefault={() => {
				if (!$isLoggedIn) {
					popOverOpen = true;
					return;
				}
				updateWidgetState(model.id, "isMaximized", !isMaximized);
			}}
		>
			<IconMaximize classNames="mr-1" />
			{#if !isMaximized}
				Maximize
			{:else}
				Minimize
			{/if}
		</button>
	</LogInPopover>
</div>
{#if outputJson && isOutputJsonVisible}
	<pre
		class="mt-3 max-h-screen overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-600 dark:bg-gray-800">{outputJson}</pre>
{/if}
