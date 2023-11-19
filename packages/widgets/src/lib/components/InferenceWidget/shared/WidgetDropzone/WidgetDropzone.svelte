<script lang="ts">
	import IconSpin from "$lib/components/Icons/IconSpin.svelte";
	import { getBlobFromUrl } from "../../shared/helpers.js";

	export let accept = "image/*";
	export let classNames = "";
	export let isLoading = false;
	export let isDisabled = false;
	export let imgSrc = "";
	export let label = "Drag image file here or click to browse from your device";
	export let onSelectFile: (file: File | Blob) => void;
	export let onError: (e: string) => void;

	let fileInput: HTMLInputElement;
	let isDragging = false;

	function onChange() {
		const file = fileInput.files?.[0];
		if (file) {
			onSelectFile(file);
		}
	}

	async function onDrop(e: DragEvent) {
		isDragging = false;
		const itemList = e.dataTransfer?.items;
		if (!itemList || isLoading) {
			return;
		}
		const items = Array.from(itemList);
		const uriItem = items.find((x) => x.kind === "string" && x.type === "text/uri-list");
		const fileItem = items.find((x) => x.kind === "file");
		if (uriItem) {
			const url = await new Promise<string>((resolve) => uriItem.getAsString((s) => resolve(s)));
			const file = await getBlobFromUrl(url);

			onSelectFile(file);
		} else if (fileItem) {
			const file = fileItem.getAsFile();
			if (file) {
				onSelectFile(file);
			}
		} else {
			onError(`Unrecognized dragged and dropped file or element.`);
		}
	}
</script>

<input
	{accept}
	bind:this={fileInput}
	on:change={onChange}
	disabled={isLoading || isDisabled}
	style="display: none;"
	type="file"
/>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="relative cursor-pointer rounded border-2 border-dashed px-3 py-7 text-center
		{isDisabled ? 'pointer-events-none' : ''}
		{isDragging ? 'border-green-300 bg-green-50 text-green-500' : 'text-gray-500'}
		{classNames}"
	on:click={() => {
		fileInput.click();
	}}
	on:dragenter={() => {
		isDragging = true;
	}}
	on:dragleave={() => {
		isDragging = false;
	}}
	on:dragover|preventDefault
	on:drop|preventDefault={onDrop}
>
	{#if !imgSrc && !isDisabled}
		<span class="pointer-events-none text-sm">{label}</span>
	{:else}
		<div class={isDragging ? "pointer-events-none" : ""}>
			<slot />
		</div>
	{/if}
	{#if isLoading}
		<div
			class="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full border border-gray-100 bg-white shadow"
		>
			<IconSpin classNames="text-purple-500 animate-spin h-6 w-6" />
		</div>
	{/if}
</div>
