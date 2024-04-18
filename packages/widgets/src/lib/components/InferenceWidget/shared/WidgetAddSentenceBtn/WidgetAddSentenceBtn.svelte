<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let isDisabled = false;
	export let label = "Add Sentence";

	const dispatch = createEventDispatcher<{ run: void }>();
</script>

{#if !isDisabled}
	<!-- content here -->
	<button
		class="btn-widget h-10 w-full px-5"
		disabled={isDisabled}
		on:click|preventDefault={() => dispatch("run")}
		type="submit"
	>
		{label}
	</button>
{/if}
