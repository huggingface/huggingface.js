<script lang="ts">
	import { PIPELINE_DATA } from "../../interfaces/Types";
	import PipelineIcon from "../PipelineIcon/PipelineIcon.svelte";

	export let classNames = "";
	export let pipeline = "";
</script>

<div class="inline-flex items-center {classNames}">
	<PipelineIcon classNames="mr-1" {pipeline} />
	<span>
		{PIPELINE_DATA[pipeline].name ?? pipeline}
	</span>
</div>
