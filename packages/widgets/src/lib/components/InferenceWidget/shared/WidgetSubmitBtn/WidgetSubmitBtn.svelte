<script lang="ts">
	import IconSpin from "../../..//Icons/IconSpin.svelte";

	export let classNames = "";
	export let isDisabled = false;
	export let isLoading: boolean;
	export let label = "Compute";
	export let onClick: () => void;
</script>

{#if !isDisabled}
	<button
		class="btn-widget h-10 w-24 px-5 {classNames}"
		disabled={isDisabled || isLoading}
		on:click|preventDefault={onClick}
		type="submit"
	>
		{#if isLoading}
			<IconSpin classNames="text-gray-600 animate-spin" />
		{:else}
			{label}
		{/if}
	</button>
{/if}
