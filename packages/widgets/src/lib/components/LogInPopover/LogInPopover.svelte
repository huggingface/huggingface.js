<script lang="ts">
	import Popover from "../Popover/Popover.svelte";
	import IconHuggingFace from "../Icons/IconHuggingFace.svelte";
	import { isLoggedIn } from "../InferenceWidget/stores.js";

	export let placement: "top" | "bottom" | "auto" | "prefer-top" | "prefer-bottom" = "prefer-top";
	export let open = false;
</script>

<Popover classNames="w-72" {placement} open={!$isLoggedIn && open}>
	<svelte:fragment slot="anchor">
		<slot />
	</svelte:fragment>
	<svelte:fragment slot="content">
		<div class="flex items-center gap-x-3 text-sm">
			<IconHuggingFace classNames="text-5xl" />
			You need a Hugging Face accont to compute wigdets
		</div>
		<div class="flex text-sm items-center gap-x-2 mt-2">
			<a
				href="https://huggingface.co/login{typeof window !== 'undefined'
					? `?next=${encodeURIComponent(window.location.href)}`
					: ''}"
				class="px-2 py-1 rounded-full">Log In</a
			>
			<a
				href="https://huggingface.co/join{typeof window !== 'undefined'
					? `?next=${encodeURIComponent(window.location.href)}`
					: ''}"
				class="bg-black text-white px-2 py-1 rounded-full dark:!bg-gray-100 dark:!text-black">Sign Up</a
			>
		</div>
	</svelte:fragment>
</Popover>
