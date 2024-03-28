<script lang="ts">
	import { onMount, tick, createEventDispatcher } from "svelte";
	import { fade } from "svelte/transition";
	import { debounce } from "../../utils/ViewUtils.js";

	export let classNames = "";
	export let anchorElement: HTMLElement;
	export let alignment: "start" | "center" | "end" | "auto" = "auto";
	export let placement: "top" | "bottom" | "auto" | "prefer-top" | "prefer-bottom" = "auto";
	export let waitForContent = false;
	export let size: "sm" | "md" = "md";
	export let invertedColors = false;
	export let touchOnly = false;

	let popoverElement: HTMLDivElement;

	/// sizes of the arrow and its padding, needed to position the popover position correctly
	const ARROW_PADDING = 24;
	const ARROW_SIZE = 10;

	/// to prevent the toast from being too close to the edge of the screen
	const HIT_ZONE_MARGIN = 80;

	const dispatch = createEventDispatcher<{ close: void }>();

	let computedAlignment = alignment === "auto" ? "center" : alignment;
	let computedPlacement = placement === "auto" ? "bottom" : placement;

	let left: number;
	let top: number;
	let width: number;
	let height: number;

	let popoverShift: number;
	let isTouchOnly = false;
	let isActive = true;

	function updatePlacement(anchorBbox: DOMRect, pageHeight: number) {
		if (pageHeight > 0) {
			if (placement === "auto") {
				/// check if the anchor is closer to the top or bottom of the page
				computedPlacement = anchorBbox.top > pageHeight / 2 ? "top" : "bottom";
			} else if (placement === "prefer-top") {
				/// check if the toast has enough space to be placed above the anchor
				const popoverHeight = popoverElement.getBoundingClientRect().height;
				computedPlacement = anchorBbox.top > popoverHeight + HIT_ZONE_MARGIN ? "top" : "bottom";
			} else if (placement === "prefer-bottom") {
				/// check if the toast has enough space to be placed below the anchor
				const popoverHeight = popoverElement.getBoundingClientRect().height;
				computedPlacement =
					anchorBbox.top + anchorBbox.height + popoverHeight + HIT_ZONE_MARGIN > pageHeight ? "top" : "bottom";
			}
		}
	}

	function updateAlignment(anchorBbox: DOMRect, pageWidth: number) {
		if (alignment === "auto" && pageWidth > 0) {
			const popoverWidth = popoverElement.getBoundingClientRect().width;
			if (anchorBbox.left + popoverWidth > pageWidth - HIT_ZONE_MARGIN) {
				computedAlignment = "end";
			} else {
				computedAlignment = "start";
			}
		}
	}

	async function updatePosition() {
		if (anchorElement && !waitForContent) {
			await tick();

			const bbox = anchorElement.getBoundingClientRect();
			updateAlignment(bbox, window.innerWidth);
			updatePlacement(bbox, window.innerHeight);

			left = bbox.left + window.scrollX;
			top = bbox.top + window.scrollY;
			width = bbox.width;
			height = bbox.height;

			/// shift the popover so the arrow is exaclty at the middle of the anchor
			popoverShift = width / 2 - ARROW_SIZE / 2 - ARROW_PADDING;
		}
	}

	const debouncedShow = debounce(() => (isActive = true), 250);

	function hide() {
		if (!popoverElement?.matches(":hover")) {
			isActive = false;
		}
	}
	const debouncedHide = debounce(hide, 250);

	onMount(() => {
		isTouchOnly = touchOnly && window.matchMedia("(any-hover: none)").matches;

		if (!isTouchOnly) {
			updatePosition();
			if (anchorElement) {
				anchorElement.addEventListener("mouseover", debouncedShow);
				anchorElement.addEventListener("mouseleave", debouncedHide);
				return () => {
					anchorElement.removeEventListener("mouseover", debouncedShow);
					anchorElement.removeEventListener("mouseleave", debouncedHide);
				};
			}
		}
	});
</script>

<svelte:window on:resize={() => dispatch("close")} on:scroll={() => dispatch("close")} />

<div class={isTouchOnly ? "hidden sm:contents" : "contents"}>
	<div
		class="pointer-events-none absolute bg-transparent hidden"
		class:hidden={!isActive}
		style:top="{top}px"
		style:left="{left}px"
		style:width="{width}px"
		style:height="{height}px"
	>
		<div
			bind:this={popoverElement}
			in:fade={{ duration: 100 }}
			on:mouseleave={debouncedHide}
			class="pointer-events-auto absolute z-10 transform
				{computedPlacement === 'top' ? 'bottom-full -translate-y-3' : 'top-full translate-y-2.5'}
				{computedAlignment === 'start' ? 'left-0' : computedAlignment === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}
				{classNames}"
		>
			<div
				class="absolute z-0 rotate-45 transform
					{size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5 rounded-sm'}
					{invertedColors ? 'bg-black dark:bg-gray-800' : 'border bg-white shadow  dark:bg-gray-800'}
					{computedPlacement === 'top' ? 'top-full -translate-y-1' : 'bottom-full translate-y-1'}
					{computedAlignment === 'start' ? 'left-6' : computedAlignment === 'center' ? 'left-1/2' : 'right-6'}"
			/>
			<div
				class="shadow-alternate-xl relative z-5 border font-normal leading-tight transition-opacity
					{size === 'sm' ? 'rounded px-2 py-1.5' : 'rounded-xl p-4'}
					{invertedColors ? 'border-black bg-black text-white dark:bg-gray-800' : 'bg-white text-black dark:bg-gray-925'}
				"
			>
				<slot />
			</div>
		</div>
	</div>
</div>
