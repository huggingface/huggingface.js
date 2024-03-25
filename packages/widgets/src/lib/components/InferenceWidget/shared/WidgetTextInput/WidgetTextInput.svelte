<script lang="ts">
	import { onCmdEnter } from "../../../../utils/ViewUtils.js";
	import WidgetLabel from "../WidgetLabel/WidgetLabel.svelte";

	export let label: string | undefined = undefined;
	export let placeholder: string = "Your sentence here...";
	export let isLoading = false;
	export let isDisabled = false;
	export let value: string;
	export let onClick: () => void;
</script>

<WidgetLabel {label}>
	<svelte:fragment slot="after">
		<input
			bind:value
			class="{label ? 'mt-1.5' : ''} form-input-alt block w-full"
			placeholder={isDisabled ? "" : placeholder}
			disabled={isDisabled}
			type="text"
			use:onCmdEnter={{ disabled: isLoading || isDisabled, callback: onClick }}
		/>
	</svelte:fragment>
</WidgetLabel>
