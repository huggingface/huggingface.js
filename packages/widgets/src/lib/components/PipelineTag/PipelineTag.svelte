<script lang="ts">
	import { PIPELINE_DATA } from "@huggingface/tasks";
	import PipelineIcon from "../PipelineIcon/PipelineIcon.svelte";

	export let classNames = "";
	export let pipeline = "";

	$: pipelineData = pipeline in PIPELINE_DATA ? PIPELINE_DATA[pipeline as keyof typeof PIPELINE_DATA] : undefined;
</script>

<div class="inline-flex items-center {classNames}">
	<PipelineIcon classNames="mr-1" {pipeline} />
	<span>
		{pipelineData ? pipelineData.name : pipeline}
	</span>
</div>
