<script lang="ts">
	export let isDisabled = false;
	export let label = "Add Sentence";
	export let onClick: (e: MouseEvent) => void;
</script>

{#if !isDisabled}
	<!-- content here -->
	<button class="btn-widget h-10 w-full px-5" disabled={isDisabled} on:click|preventDefault={onClick} type="submit">
		{label}
	</button>
{/if}
