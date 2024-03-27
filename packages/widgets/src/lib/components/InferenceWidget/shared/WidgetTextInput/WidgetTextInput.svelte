<script lang="ts">
	import LogInPopover from "../../../LogInPopover/LogInPopover.svelte";
	import { createEventDispatcher } from "svelte";
	import { onCmdEnter } from "../../../../utils/ViewUtils.js";
	import WidgetLabel from "../WidgetLabel/WidgetLabel.svelte";
	import { isLoggedIn } from "../../stores.js";

	export let label: string | undefined = undefined;
	export let placeholder: string = "Your sentence here...";
	export let isLoading = false;
	export let isDisabled = false;
	export let value: string;

	let popOverOpen = false;

	const dispatch = createEventDispatcher<{ cmdEnter: void }>();
</script>

<LogInPopover bind:open={popOverOpen}>
	<WidgetLabel {label}>
		<svelte:fragment slot="after">
			<input
				bind:value
				class="{label ? 'mt-1.5' : ''} form-input-alt block w-full"
				placeholder={isDisabled ? "" : placeholder}
				disabled={isDisabled}
				type="text"
				use:onCmdEnter={{ disabled: isLoading || isDisabled }}
				on:cmdEnter={() => {
					if (!$isLoggedIn) {
						popOverOpen = true;
						return;
					}
					dispatch("cmdEnter");
				}}
			/>
		</svelte:fragment>
	</WidgetLabel>
</LogInPopover>
