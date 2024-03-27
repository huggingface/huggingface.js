<script lang="ts">
	import LogInPopover from "../../../LogInPopover/LogInPopover.svelte";
	import IconSpin from "../../..//Icons/IconSpin.svelte";
	import { isLoggedIn } from "../../stores.js";

	export let classNames = "";
	export let isDisabled = false;
	export let isLoading: boolean;
	export let label = "Compute";
	export let onClick: () => void;

	let popOverOpen = false;

	function _onClick() {
		if (!$isLoggedIn) {
			popOverOpen = true;
			return;
		}

		onClick();
	}
</script>

{#if !isDisabled}
	<LogInPopover bind:open={popOverOpen}>
		<button
			class="btn-widget h-10 w-24 px-5 {classNames}"
			disabled={isDisabled || isLoading}
			on:click|preventDefault={_onClick}
			type="submit"
		>
			{#if isLoading}
				<IconSpin classNames="text-gray-600 animate-spin" />
			{:else}
				{label}
			{/if}
		</button>
	</LogInPopover>
{/if}
