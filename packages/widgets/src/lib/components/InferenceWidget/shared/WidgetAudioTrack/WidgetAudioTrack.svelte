<script lang="ts">
	export let autoplay = false;
	export let classNames = "";
	export let controls = true;
	export let label = "";
	export let src: string | undefined = undefined;
</script>

<div class={classNames}>
	{#if $$slots.default}
		<slot />
	{:else if label.length}
		<div class="mb-1.5 truncate text-sm text-gray-500">{label}</div>
	{/if}
	<!-- svelte-ignore a11y-media-has-caption -->
	<audio {autoplay} {controls} {src} />
</div>
