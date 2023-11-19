<script lang="ts">
	import IconCode from "../../../Icons/IconCode.svelte";
	import IconMaximize from "../../../Icons/IconMaximize.svelte";

	export let onClickMaximizeBtn: () => void;
	export let outputJson: string;
	export let isDisabled = false;

	let isOutputJsonVisible = false;
</script>

<div class="mt-auto flex items-center pt-4 text-xs text-gray-500">
	{#if !isDisabled}
		<button
			class="flex items-center {outputJson ? '' : 'cursor-not-allowed text-gray-300'}"
			disabled={!outputJson}
			on:click={() => {
				isOutputJsonVisible = !isOutputJsonVisible;
			}}
		>
			<IconCode classNames="mr-1" />
			JSON Output
		</button>
	{/if}
	<button class="ml-auto flex items-center" on:click|preventDefault={onClickMaximizeBtn}>
		<IconMaximize classNames="mr-1" />
		Maximize
	</button>
</div>
{#if outputJson && isOutputJsonVisible}
	<pre
		class="mt-3 max-h-screen overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-600 dark:bg-gray-800">{outputJson}</pre>
{/if}
