<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let isDisabled = false;
	export let label = "Add Sentence";
</script>

{#if !isDisabled}
	<!-- content here -->
	<button class="btn-widget h-10 w-full px-5" disabled={isDisabled} on:click|preventDefault type="submit">
		{label}
	</button>
{/if}
