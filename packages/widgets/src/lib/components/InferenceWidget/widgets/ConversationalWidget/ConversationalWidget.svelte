<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import { Template } from "@huggingface/jinja";
	import type { WidgetExampleTextInput } from "@huggingface/tasks";

	import WidgetOutputConvo from "../../shared/WidgetOutputConvo/WidgetOutputConvo.svelte";
	import WidgetQuickInput from "../../shared/WidgetQuickInput/WidgetQuickInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isTextInput } from "../../shared/inputValidation.js";
	import { widgetStates } from "../../stores.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

	interface Message {
		role: string;
		content: string;
	}

	interface Response {
		generated_text: string;
	}

	type Output = Array<{
		input: string;
		response: string;
	}>;

	let computeTime = "";
	let chat: Message[] = [];
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: Output = [];
	let outputJson: string;
	let text = "";

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedText = text.trim();

		if (!trimmedText) {
			return;
		}

		if (shouldUpdateUrl && !chat.length) {
			updateUrl({ text: trimmedText });
		}

		// Add user message to chat
		chat = chat.concat([{ role: "user", content: trimmedText }]);

		// Render chat template
		const chatTemplate = model.config?.tokenizer?.chat_template;
		if (chatTemplate === undefined) {
			outputJson = "";
			output = [];
			error = "No chat template found in tokenizer config";
			return;
		}

		const template = new Template(chatTemplate);
		const chatText = template.render({
			messages: chat,
			bos_token: model.config?.tokenizer?.bos_token,
			eos_token: model.config?.tokenizer?.eos_token,
		});

		const requestBody = { inputs: chatText };
		addInferenceParameters(requestBody, model);

		isLoading = true;

		const res = await callInferenceApi(
			apiUrl,
			model.id,
			requestBody,
			apiToken,
			(body) => parseOutput(body, chat),
			withModelLoading,
			includeCredentials,
			isOnLoadCall
		);

		isLoading = false;
		// Reset values
		computeTime = "";
		error = "";
		modelLoading = { isLoading: false, estimatedTime: 0 };
		outputJson = "";

		if (res.status === "success") {
			computeTime = res.computeTime;
			outputJson = res.outputJson;
			if (res.output) {
				chat = res.output.chat;
				output = res.output.output;
			}
			// Emptying input value
			text = "";
		} else if (res.status === "loading-model") {
			modelLoading = {
				isLoading: true,
				estimatedTime: res.estimatedTime,
			};
			getOutput({ withModelLoading: true });
		} else if (res.status === "error") {
			error = res.error;
		}
	}

	function isValidOutput(arg: any): arg is Response {
		return typeof arg?.generated_text === "string";
	}

	function parseOutput(
		body: unknown,
		chat: Message[]
	): {
		chat: Message[];
		output: Output;
	} {
		if (isValidOutput(body)) {
			const chatWithOutput = chat.concat([{ role: "assistant", content: body.generated_text }]);

			const output = chatWithOutput.reduce((acc, message, index) => {
				if (index % 2 === 0) {
					acc.push({ input: message.content, response: chatWithOutput[index + 1].content });
				}
				return acc;
			}, [] as Output);

			return { chat: chatWithOutput, output };
		}
		throw new TypeError("Invalid output: output must be of type <generated_text: string>");
	}

	function applyWidgetExample(sample: WidgetExampleTextInput, opts: ExampleRunOpts = {}) {
		text = sample.text;
		if (opts.isPreview) {
			return;
		}
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}
</script>

<WidgetWrapper {apiUrl} {includeCredentials} {model} let:WidgetInfo let:WidgetHeader let:WidgetFooter>
	<WidgetHeader
		{noTitle}
		{model}
		{isLoading}
		{isDisabled}
		{callApiOnMount}
		{applyWidgetExample}
		validateExample={isTextInput}
	/>
	<WidgetOutputConvo modelId={model.id} {output} />

	<WidgetQuickInput
		bind:value={text}
		flatTop={true}
		{isLoading}
		{isDisabled}
		onClickSubmitBtn={() => {
			getOutput();
		}}
		submitButtonLabel="Send"
	/>

	<WidgetInfo {model} {computeTime} {error} {modelLoading} />

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
