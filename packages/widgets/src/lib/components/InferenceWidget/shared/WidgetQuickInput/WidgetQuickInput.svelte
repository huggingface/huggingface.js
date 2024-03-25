<script lang="ts">
	import { onCmdEnter } from "../../../../utils/ViewUtils.js";
	import WidgetSubmitBtn from "../WidgetSubmitBtn/WidgetSubmitBtn.svelte";

	export let flatTop = false;
	export let isLoading: boolean;
	export let isDisabled = false;
	export let onClickSubmitBtn: (e?: MouseEvent) => void;
	export let placeholder = "Your sentence here...";
	export let submitButtonLabel: string | undefined = undefined;
	export let value: string = "";
</script>

<div class="flex h-10">
	<input
		bind:value
		class="form-input-alt min-w-0 flex-1 rounded-r-none {flatTop ? 'rounded-t-none' : ''}"
		placeholder={isDisabled ? "" : placeholder}
		required={true}
		type="text"
		disabled={isLoading || isDisabled}
		autocomplete="off"
		use:onCmdEnter={{ disabled: isLoading || isDisabled, callback: onClickSubmitBtn }}
	/>
	<WidgetSubmitBtn
		classNames="rounded-l-none border-l-0 {flatTop ? 'rounded-t-none' : ''}"
		{isLoading}
		{isDisabled}
		label={submitButtonLabel}
		onClick={onClickSubmitBtn}
	/>
</div>
