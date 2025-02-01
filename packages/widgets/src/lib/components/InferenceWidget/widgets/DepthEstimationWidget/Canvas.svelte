<script lang="ts">
  import { afterUpdate } from "svelte";

  export let classNames = "";
  export let imgSrc = "";
  export let depthMap: ImageData | null = null;

  let containerEl: HTMLElement;
  let canvas: HTMLCanvasElement;
  let imgEl: HTMLImageElement;
  let width = 0;
  let height = 0;

  function draw() {
    width = containerEl.clientWidth;
    height = containerEl.clientHeight;
    const ctx = canvas?.getContext("2d");

    if (ctx && imgEl && depthMap) {
      ctx.drawImage(imgEl, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const depth = depthMap.data[i];
        imageData.data[i] = depth;
        imageData.data[i + 1] = depth;
        imageData.data[i + 2] = depth;
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }

  afterUpdate(draw);
</script>

<svelte:window on:resize={draw} />

<div class="relative top-0 left-0 inline-flex {classNames}" bind:this={containerEl}>
  <div class="flex max-w-sm justify-center">
    <img alt="" class="relative top-0 left-0 object-contain" src={imgSrc} bind:this={imgEl} />
  </div>
  {#if depthMap}
    <canvas
      class="absolute top-0 left-0"
      {width}
      {height}
      bind:this={canvas}
    />
  {/if}
</div>