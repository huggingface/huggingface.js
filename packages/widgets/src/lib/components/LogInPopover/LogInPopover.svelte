<script lang="ts">
	import Popover from "../Popover/Popover.svelte";
	import IconHuggingFace from "../Icons/IconHuggingFace.svelte";
	import { isLoggedIn } from "../InferenceWidget/stores.js";

	export let open = false;
	export let classNames = "";

	let anchorElement: HTMLElement;
</script>

<div bind:this={anchorElement} class={classNames}>
	<slot />
</div>

{#if open && !$isLoggedIn}
	<Popover classNames="w-80" {anchorElement} on:close={() => (open = false)}>
		<div class="flex items-center gap-x-3 text-sm leading-tight">
			<IconHuggingFace classNames="text-5xl" />
			Please login with your Hugging Face account to run the widgets.
		</div>
		<div class="flex text-sm items-center gap-x-2.5 mt-2">
			<a
				href="https://huggingface.co/login{typeof window !== 'undefined'
					? `?next=${encodeURIComponent(window.location.href)}`
					: ''}"
				class="bg-black text-white px-3 py-1 rounded-full dark:!bg-gray-100 dark:!text-black">Log In</a
			>
			<span class="text-gray-400">or</span>
			<a
				href="https://huggingface.co/join{typeof window !== 'undefined'
					? `?next=${encodeURIComponent(window.location.href)}`
					: ''}"
				class="py-1 rounded-full underline decoration-gray-400 underline-offset-2">Create a free account</a
			>
		</div>
	</Popover>
{/if}
