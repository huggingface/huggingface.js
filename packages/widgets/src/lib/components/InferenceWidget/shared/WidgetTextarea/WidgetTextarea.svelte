<script lang="ts">
	import { tick } from "svelte";

	import { delay } from "../../../../utils/ViewUtils.js";
	import WidgetLabel from "../WidgetLabel/WidgetLabel.svelte";

	export let label: string = "";
	export let placeholder: string = "Your sentence here...";
	export let value: string;
	export let isLoading = false;
	export let isDisabled = false;
	export let size: "small" | "big" = "small";

	let containerSpanEl: HTMLSpanElement;
	const typingEffectSpeedMs = 12;
	const classNamesInput = "whitespace-pre-wrap inline font-normal text-black dark:text-white";
	const classNamesOutput = "whitespace-pre-wrap inline text-blue-600 dark:text-blue-400";

	export async function renderTextOutput(outputTxt: string, typingEffect = true): Promise<void> {
		const spanEl = document.createElement("span");
		spanEl.contentEditable = "true";
		spanEl.className = classNamesOutput;
		containerSpanEl?.appendChild(spanEl);
		await tick();
		// fix Chrome bug that adds `<br>` els on contentedtiable el
		const brElts = containerSpanEl?.querySelectorAll("br");
		for (const brEl of brElts) {
			brEl.remove();
		}
		await tick();
		// split on whitespace or any other character to correctly render newlines \n
		if (typingEffect) {
			for (const char of outputTxt.split(/(\s|.)/g)) {
				await delay(typingEffectSpeedMs);
				spanEl.textContent += char;
				moveCaretToEnd();
			}
		} else {
			spanEl.textContent = outputTxt;
		}
		updateInnerTextValue();
	}

	function moveCaretToEnd() {
		containerSpanEl?.focus();
		if (containerSpanEl) {
			const range = document.createRange();
			range.selectNodeContents(containerSpanEl);
			range.collapse(false);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}

	// handle FireFox contenteditable paste bug
	function handlePaste(e: ClipboardEvent) {
		if (isLoading) {
			return e.preventDefault();
		}
		const copiedTxt = e.clipboardData?.getData("text/plain");
		const selection = window.getSelection();
		if (selection?.rangeCount && !!copiedTxt?.length) {
			const range = selection.getRangeAt(0);
			range.deleteContents();
			const spanEl = document.createElement("span");
			spanEl.contentEditable = "true";
			spanEl.className = classNamesInput;
			spanEl.textContent = copiedTxt;
			range.insertNode(spanEl);
		}
		window.getSelection()?.collapseToEnd();
		updateInnerTextValue();
	}

	function updateInnerTextValue() {
		value = containerSpanEl?.textContent ?? "";
	}

	export function setValue(text: string): void {
		containerSpanEl.textContent = text;
		updateInnerTextValue();
	}
</script>

<WidgetLabel {label}>
	<svelte:fragment slot="after">
		<!-- `whitespace-pre-wrap inline-block` are needed to get correct newlines from `el.textContent` on Chrome -->
		<span
			class="{label ? 'mt-1.5' : ''} block w-full resize-y overflow-auto py-2 px-3 {size === 'small'
				? 'min-h-[42px]'
				: 'min-h-[144px]'} inline-block max-h-[500px] whitespace-pre-wrap rounded-lg border border-gray-200 shadow-inner outline-none focus:shadow-inner focus:ring focus:ring-blue-200 dark:bg-gray-925"
			role="textbox"
			contenteditable={!isLoading && !isDisabled}
			style="--placeholder: '{isDisabled ? '' : placeholder}'"
			spellcheck="false"
			dir="auto"
			bind:this={containerSpanEl}
			on:paste|preventDefault={handlePaste}
			on:input={updateInnerTextValue}
		/>
	</svelte:fragment>
</WidgetLabel>

<style>
	span[contenteditable]:empty::before {
		content: var(--placeholder);
		color: rgba(156, 163, 175);
	}
</style>
