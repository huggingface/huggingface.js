<script lang="ts">
	import { onDestroy } from "svelte";

	export let isDisabled = false;

	let counterSeconds = 0.0;
	let interval: ReturnType<typeof setInterval>;
	let shouldDisplay = false;

	// timer show in seconds
	$: counterHuman = counterSeconds.toLocaleString(undefined, {
		minimumFractionDigits: 1,
	});

	export function start(): void {
		// reset timer for new run
		stop();
		counterSeconds = 0.0;
		shouldDisplay = true;
		// new run
		interval = setInterval(() => (counterSeconds += 0.1), 100);
	}

	export function stop(): void {
		if (interval) {
			clearInterval(interval);
		}
	}

	onDestroy(() => stop());
</script>

{#if shouldDisplay && !isDisabled}
	<span class="font-mono text-xs text-gray-500">{counterHuman}</span>
{/if}
