<script lang="ts">
	import type { WidgetProps } from "../../shared/types.js";

	import { onMount } from "svelte";

	import IconSpin from "../../../Icons/IconSpin.svelte";
	import IconCross from "../../../Icons/IconCross.svelte";
	import WidgetHeader from "../../shared/WidgetHeader/WidgetHeader.svelte";

	export let apiToken: WidgetProps["apiToken"];
	export let model: WidgetProps["model"];

	enum Replay {
		Loading,
		Available,
		Unavailable,
	}

	let replay = Replay.Loading;
	let replaySrc = "";

	function doesReplayExist() {
		// check if repository has `replay.mp4` file
		replaySrc = `/${model.id}/resolve/main/replay.mp4`;
		const xhr = new XMLHttpRequest();
		xhr.open("HEAD", replaySrc, false);
		xhr.send();
		return xhr.status !== 404;
	}

	onMount(() => {
		replay = doesReplayExist() ? Replay.Available : Replay.Unavailable;
	});
</script>

<!-- 
	WidgetWrapper.svelte component is not used because this pipeline widget (reinforcement-learning)
	does NOT use InferenceAPI (unlike other pipelines widgets)
-->
<div class="flex w-full max-w-full flex-col">
	<WidgetHeader title="Video Preview" pipeline="reinforcement-learning" />
	<div class="w-full overflow-hidden rounded-lg">
		{#if replay === Replay.Available}
			<!-- svelte-ignore a11y-media-has-caption -->
			<video class="w-full" src={replaySrc} controls autoplay muted loop />
		{:else if replay === Replay.Unavailable}
			<div class="flex items-center justify-center rounded-lg border py-6 text-sm text-gray-500">
				{#if !!apiToken}
					Add<span class="font-mono text-xs">&nbsp;./replay.mp4&nbsp;</span>file to display a preview
				{:else}
					<IconCross />
					Preview not found
				{/if}
			</div>
		{:else}
			<div class="flex items-center justify-center rounded-lg border py-6 text-sm text-gray-500">
				<IconSpin classNames="mr-1.5 text-purple-400 dark:text-purple-200 animate-spin mt-0.5" />
				<span class="text-gray-500">loading</span>
			</div>
		{/if}
	</div>
</div>
