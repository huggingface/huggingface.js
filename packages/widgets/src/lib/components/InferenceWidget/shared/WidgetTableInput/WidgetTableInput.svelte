<script lang="ts">
	import type { HighlightCoordinates } from "../types.js";

	import { createEventDispatcher, onMount, tick } from "svelte";

	import { scrollToMax } from "../../../../utils/ViewUtils.js";
	import IconRow from "../../..//Icons/IconRow.svelte";

	type Table = (string | number)[][];

	export let highlighted: HighlightCoordinates;
	export let table: Table = [[]];
	export let canAddRow = true;
	export let canAddCol = true;
	export let isLoading = false;
	export let isDisabled = false;

	const dispatch = createEventDispatcher<{ change: Table }>();

	let initialTable: Table = [[]];
	let tableContainerEl: HTMLElement;

	onMount(() => {
		initialTable = table.map((row) => row.map((cell) => cell));
	});

	async function addCol() {
		const updatedTable = table.map((row, colIndex) => [...row, colIndex === 0 ? `Header ${table[0].length + 1}` : ""]);
		dispatch("change", updatedTable);
		await scrollTableToRight();
	}

	export async function scrollTableToRight(): Promise<void> {
		await tick();
		scrollToMax(tableContainerEl, "x");
	}

	function addRow() {
		const updatedTable = [...table, Array(table[0].length).fill("")];
		dispatch("change", updatedTable);
	}

	function editCell(e: Event, [x, y]: [number, number]) {
		const value = (e.target as HTMLElement)?.innerText;

		const updatedTable = table.map((row, rowIndex) =>
			rowIndex === y ? row.map((col, colIndex) => (colIndex === x ? value : col)) : row
		);
		dispatch("change", updatedTable);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.code === "Enter") {
			(e.target as HTMLElement)?.blur();
		}
	}

	function resetTable() {
		const updatedTable = initialTable;
		dispatch("change", updatedTable);
	}
</script>

<div class="overflow-auto" bind:this={tableContainerEl}>
	{#if table.length > 1}
		<table class="table-question-answering">
			<thead>
				<tr>
					{#each table[0] as header, x}
						<th
							contenteditable={canAddCol && !isLoading && !isDisabled}
							class="h-6 border-2 border-gray-100"
							on:keydown={onKeyDown}
							on:input={(e) => editCell(e, [x, 0])}
						>
							{header}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each table.slice(1) as row, y}
					<tr class={highlighted[`${y}`] ?? "bg-white"}>
						{#each row as cell, x}
							<td
								class={(highlighted[`${y}-${x}`] ?? "border-gray-100") + " h-6 border-2"}
								contenteditable={!isLoading && !isDisabled}
								on:keydown={onKeyDown}
								on:input={(e) => editCell(e, [x, y + 1])}>{cell}</td
							>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<div class="mb-1 flex flex-wrap">
	{#if canAddRow}
		<button class="btn-widget mt-2 mr-1.5 flex-1 lg:flex-none" on:click={addRow} type="button">
			<IconRow classNames="mr-2" />
			Add row
		</button>
	{/if}
	{#if canAddCol}
		<button class="btn-widget mt-2 flex-1 lg:mr-1.5 lg:flex-none" on:click={addCol} type="button">
			<IconRow classNames="transform rotate-90 mr-1" />
			Add col
		</button>
	{/if}
	<button class="btn-widget mt-2 flex-1 lg:ml-auto lg:flex-none" on:click={resetTable} type="button">
		Reset table
	</button>
</div>
