<script lang="ts">
  import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
  import type { WidgetExampleAssetInput } from "@huggingface/tasks";

  import { onMount } from "svelte";

  import WidgetFileInput from "../../shared/WidgetFileInput/WidgetFileInput.svelte";
  import WidgetDropzone from "../../shared/WidgetDropzone/WidgetDropzone.svelte";
  import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
  import { callInferenceApi, getBlobFromUrl } from "../../shared/helpers.js";
  import { isAssetInput } from "../../shared/inputValidation.js";
  import { widgetStates } from "../../stores.js";

  import Canvas from "./Canvas.svelte";

  export let apiToken: WidgetProps["apiToken"];
  export let apiUrl: WidgetProps["apiUrl"];
  export let callApiOnMount: WidgetProps["callApiOnMount"];
  export let model: WidgetProps["model"];
  export let noTitle: WidgetProps["noTitle"];
  export let includeCredentials: WidgetProps["includeCredentials"];

  $: isDisabled = $widgetStates?.[model.id]?.isDisabled;

  let computeTime = "";
  let error: string = "";
  let isLoading = false;
  let imgSrc = "";
  let modelLoading = {
    isLoading: false,
    estimatedTime: 0,
  };
  let output: ImageData | null = null;
  let outputJson: string;
  let warning: string = "";

  function onSelectFile(file: File | Blob) {
    imgSrc = URL.createObjectURL(file);
    getOutput(file);
  }

  async function getOutput(
    file: File | Blob,
    { withModelLoading = false, isOnLoadCall = false, exampleOutput = undefined }: InferenceRunOpts = {}
  ) {
    if (!file) {
      return;
    }

    // Reset values
    computeTime = "";
    error = "";
    warning = "";
    output = null;
    outputJson = "";

    const requestBody = { file };

    isLoading = true;

    const res = await callInferenceApi(
      apiUrl,
      model.id,
      requestBody,
      apiToken,
      parseOutput,
      withModelLoading,
      includeCredentials,
      isOnLoadCall
    );

    isLoading = false;
    modelLoading = { isLoading: false, estimatedTime: 0 };

    if (res.status === "success") {
      computeTime = res.computeTime;
      output = res.output;
      outputJson = res.outputJson;
    } else if (res.status === "loading-model") {
      modelLoading = {
        isLoading: true,
        estimatedTime: res.estimatedTime,
      };
      getOutput(file, { withModelLoading: true });
    } else if (res.status === "error" && !isOnLoadCall) {
      error = res.error;
    }
  }

  function parseOutput(body: unknown): ImageData {
    if (body instanceof ImageData) {
      return body;
    }
    throw new TypeError("Invalid output: output must be of type ImageData");
  }

  async function applyWidgetExample(sample: WidgetExampleAssetInput, opts: ExampleRunOpts = {}) {
    imgSrc = sample.src;
    if (opts.isPreview) {
      output = null;
      outputJson = "";
      return;
    }
    const blob = await getBlobFromUrl(imgSrc);
    const exampleOutput = sample.output;
    getOutput(blob, { ...opts.inferenceOpts, exampleOutput });
  }

  onMount(() => {
    if (callApiOnMount) {
      getOutput(new Blob(), { isOnLoadCall: true });
    }
  });
</script>

<WidgetWrapper {apiUrl} {includeCredentials} {model} let:WidgetInfo let:WidgetHeader let:WidgetFooter>
  <WidgetHeader
    {noTitle}
    {model}
    {isLoading}
    {isDisabled}
    {callApiOnMount}
    {applyWidgetExample}
    validateExample={isAssetInput}
  />

  <WidgetDropzone
    classNames="hidden md:block"
    {isLoading}
    {isDisabled}
    {imgSrc}
    on:run={(e) => onSelectFile(e.detail)}
    on:error={(e) => (error = e.detail)}
  >
    {#if imgSrc}
      <Canvas {imgSrc} depthMap={output} />
    {/if}
  </WidgetDropzone>
  <!-- Better UX for mobile/table through CSS breakpoints -->
  {#if imgSrc}
    <Canvas classNames="mr-2 md:hidden" {imgSrc} depthMap={output} />
  {/if}
  <WidgetFileInput
    accept="image/*"
    classNames="mr-2 md:hidden"
    {isLoading}
    {isDisabled}
    label="Browse for image"
    on:run={(e) => onSelectFile(e.detail)}
  />
  {#if warning}
    <div class="alert alert-warning mt-2">{warning}</div>
  {/if}

  <WidgetInfo {model} {computeTime} {error} {modelLoading} />

  <WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>