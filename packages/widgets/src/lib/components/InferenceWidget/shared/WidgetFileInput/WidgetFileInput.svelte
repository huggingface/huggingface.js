<script lang="ts">
	import IconSpin from "../../../Icons/IconSpin.svelte";
	import IconFile from "../../../Icons/IconFile.svelte";
	import { isLoggedIn } from "../../stores.js";
	import LogInPopover from "../../../LogInPopover/LogInPopover.svelte";
	import { createEventDispatcher } from "svelte";

	export let accept: string | undefined;
	export let classNames = "";
	export let isLoading = false;
	export let isDisabled = false;
	export let label = "Browse for file";
	const dispatch = createEventDispatcher<{ run: File | Blob }>();

	let fileInput: HTMLInputElement;
	let isDragging = false;
	let popOverOpen = false;

	function onChange() {
		if (!$isLoggedIn) {
			popOverOpen = true;
			return;
		}

		const file = fileInput.files?.[0];
		if (file) {
			dispatch("run", file);
		}
	}
</script>

{#if !isDisabled}
	<LogInPopover bind:open={popOverOpen}>
		<button
			class={classNames}
			on:click={(e) => {
				if (!$isLoggedIn) {
					popOverOpen = true;
					e.preventDefault();
					return;
				}
			}}
			on:dragenter={() => {
				isDragging = true;
			}}
			on:dragover|preventDefault
			on:dragleave={() => {
				isDragging = false;
			}}
			on:drop|preventDefault={(e) => {
				isDragging = false;
				fileInput.files = e.dataTransfer?.files ?? null;
				onChange();
			}}
		>
			<label class="btn-widget {isDragging ? 'ring' : ''} {isLoading ? 'text-gray-600' : ''}">
				{#if isLoading}
					<IconSpin classNames="-ml-1 mr-1.5 text-gray-600 animate-spin" />
				{:else}
					<IconFile classNames="-ml-1 mr-1.5" />
				{/if}
				<input
					{accept}
					bind:this={fileInput}
					on:change={onChange}
					disabled={isLoading || isDisabled}
					style="display: none;"
					type="file"
				/>
				{label}
			</label>
		</button>
	</LogInPopover>
{/if}
