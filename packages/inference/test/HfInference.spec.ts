import { expect, it, describe, assert } from "vitest";

import type { ChatCompletionStreamOutput, VisualQuestionAnsweringInput } from "@huggingface/tasks";

import {
	audioClassification,
	audioToAudio,
	automaticSpeechRecognition,
	chatCompletion,
	chatCompletionStream,
	documentQuestionAnswering,
	featureExtraction,
	fillMask,
	HfInference,
	imageClassification,
	imageToImage,
	imageToText,
	objectDetection,
	questionAnswering,
	request,
	sentenceSimilarity,
	summarization,
	tableQuestionAnswering,
	tabularClassification,
	tabularRegression,
	textClassification,
	textGeneration,
	textGenerationStream,
	textToImage,
	textToSpeech,
	tokenClassification,
	translation,
	visualQuestionAnswering,
	zeroShotClassification,
	zeroShotImageClassification,
} from "../src";
import "./vcr";
import { readTestFile } from "./test-files";

const TIMEOUT = 60000 * 3;
const env = import.meta.env;

if (!env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
}

describe.concurrent("HfInference", () => {
	// Individual tests can be ran without providing an api key, however running all tests without an api key will result in rate limiting error.

	describe.concurrent(
		"HF Inference",
		() => {
			it("throws error if model does not exist", () => {
				expect(
					fillMask({
						model: "this-model-does-not-exist-123",
						inputs: "[MASK] world!",
						accessToken: env.HF_TOKEN,
					})
				).rejects.toThrowError("Model this-model-does-not-exist-123 does not exist");
			});

			it("fillMask", async () => {
				expect(
					await fillMask({
						model: "bert-base-uncased",
						inputs: "[MASK] world!",
						accessToken: env.HF_TOKEN,
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							token: expect.any(Number),
							token_str: expect.any(String),
							sequence: expect.any(String),
						}),
					])
				);
			});

			it("works without model", async () => {
				expect(
					await fillMask({
						inputs: "[MASK] world!",
						accessToken: env.HF_TOKEN,
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							token: expect.any(Number),
							token_str: expect.any(String),
							sequence: expect.any(String),
						}),
					])
				);
			});

			it("summarization", async () => {
				expect(
					await summarization({
						model: "google/pegasus-xsum",
						inputs:
							"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.",
						parameters: {
							max_length: 100,
						},
						accessToken: env.HF_TOKEN,
					})
				).toEqual({
					summary_text: "The Eiffel Tower is one of the most famous buildings in the world.",
				});
			});

			it("questionAnswering", async () => {
				const res = await questionAnswering({
					model: "deepset/roberta-base-squad2",
					inputs: {
						question: "What is the capital of France?",
						context: "The capital of France is Paris.",
					},
					accessToken: env.HF_TOKEN,
				});
				expect(res).toMatchObject([
					{
						answer: "Paris",
						score: expect.any(Number),
						start: expect.any(Number),
						end: expect.any(Number),
					},
				]);
			});

			it("tableQuestionAnswering", async () => {
				expect(
					await tableQuestionAnswering({
						model: "google/tapas-base-finetuned-wtq",
						inputs: {
							question: "How many stars does the transformers repository have?",
							table: {
								Repository: ["Transformers", "Datasets", "Tokenizers"],
								Stars: ["36542", "4512", "3934"],
								Contributors: ["651", "77", "34"],
								"Programming language": ["Python", "Python", "Rust, Python and NodeJS"],
							},
						},
						accessToken: env.HF_TOKEN,
					})
				).toMatchObject([
					{
						answer: "AVERAGE > 36542",
						coordinates: [[0, 1]],
						cells: ["36542"],
						aggregator: "AVERAGE",
					},
				]);
			});

			it("documentQuestionAnswering", async () => {
				const res = await documentQuestionAnswering({
					model: "impira/layoutlm-document-qa",
					inputs: {
						question: "Invoice number?",
						image: new Blob([readTestFile("invoice.png")], { type: "image/png" }),
					},
					accessToken: env.HF_TOKEN,
				});
				expect(res).toBeInstanceOf(Array);
				for (const elem of res) {
					expect(elem).toMatchObject({
						answer: expect.any(String),
						score: expect.any(Number),
					});
				}
			});

			// Errors with "Error: If you are using a VisionEncoderDecoderModel, you must provide a feature extractor"
			it.skip("documentQuestionAnswering with non-array output", async () => {
				expect(
					await documentQuestionAnswering({
						model: "naver-clova-ix/donut-base-finetuned-docvqa",
						inputs: {
							question: "Invoice number?",
							image: new Blob([readTestFile("invoice.png")], { type: "image/png" }),
						},
						accessToken: env.HF_TOKEN,
					})
				).toMatchObject({
					answer: "us-001",
				});
			});

			it("visualQuestionAnswering", async () => {
				const res = await visualQuestionAnswering({
					model: "dandelin/vilt-b32-finetuned-vqa",
					inputs: {
						question: "How many cats are lying down?",
						image: new Blob([readTestFile("cats.png")], { type: "image/png" }),
					},
					accessToken: env.HF_TOKEN,
				} satisfies VisualQuestionAnsweringInput);
				expect(res).toBeInstanceOf(Array);
				for (const elem of res) {
					expect(elem).toMatchObject({
						answer: expect.any(String),
						score: expect.any(Number),
					});
				}
			});

			it("textClassification", async () => {
				expect(
					await textClassification({
						model: "distilbert-base-uncased-finetuned-sst-2-english",
						inputs: "I like you. I love you.",
						accessToken: env.HF_TOKEN,
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							label: expect.any(String),
							score: expect.any(Number),
						}),
					])
				);
			});

			it("textGeneration - gpt2", async () => {
				expect(
					await textGeneration({
						accessToken: env.HF_TOKEN,
						model: "gpt2",
						inputs: "The answer to the universe is",
					})
				).toMatchObject({
					generated_text: expect.any(String),
				});
			});

			it("textGeneration - openai-community/gpt2", async () => {
				expect(
					await textGeneration({
						accessToken: env.HF_TOKEN,
						model: "openai-community/gpt2",
						inputs: "The answer to the universe is",
					})
				).toMatchObject({
					generated_text: expect.any(String),
				});
			});

			it("textGenerationStream - meta-llama/Llama-3.2-3B", async () => {
				const response = textGenerationStream({
					accessToken: env.HF_TOKEN,
					model: "meta-llama/Llama-3.2-3B",
					inputs: "Please answer the following question: complete one two and ____.",
					parameters: {
						max_new_tokens: 50,
						seed: 0,
					},
				});

				for await (const ret of response) {
					expect(ret).toMatchObject({
						details: null,
						index: expect.any(Number),
						token: {
							id: expect.any(Number),
							logprob: expect.any(Number),
							text: expect.any(String) || null,
							special: expect.any(Boolean),
						},
						generated_text: ret.generated_text
							? "Please answer the following question: complete one two and ____. 1. 2. 3. 4. 5. 6. 7. 8. 9. 10. 11. 12. 13. 14. 15. 16. 17"
							: null,
					});
				}
			});

			it("textGenerationStream - catch error", async () => {
				const response = textGenerationStream({
					accessToken: env.HF_TOKEN,
					model: "meta-llama/Llama-3.2-3B",
					inputs: "Write a short story about a robot that becomes sentient and takes over the world.",
					parameters: {
						max_new_tokens: 10_000,
					},
				});

				await expect(response.next()).rejects.toThrow(
					"Error forwarded from backend: Input validation error: `inputs` tokens + `max_new_tokens` must be <= 4096. Given: 17 `inputs` tokens and 10000 `max_new_tokens`"
				);
			});

			it.skip("textGenerationStream - Abort", async () => {
				const controller = new AbortController();
				const response = textGenerationStream(
					{
						accessToken: env.HF_TOKEN,
						model: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
						inputs: "Write an essay about Sartre's philosophy.",
						parameters: {
							max_new_tokens: 100,
						},
					},
					{ signal: controller.signal }
				);
				await expect(response.next()).resolves.toBeDefined();
				await expect(response.next()).resolves.toBeDefined();
				controller.abort();
				await expect(response.next()).rejects.toThrow("The operation was aborted");
			});

			it("tokenClassification", async () => {
				expect(
					await tokenClassification({
						accessToken: env.HF_TOKEN,
						model: "dbmdz/bert-large-cased-finetuned-conll03-english",
						inputs: "My name is Sarah Jessica Parker but you can call me Jessica",
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							entity_group: expect.any(String),
							score: expect.any(Number),
							word: expect.any(String),
							start: expect.any(Number),
							end: expect.any(Number),
						}),
					])
				);
			});

			it("translation", async () => {
				expect(
					await translation({
						accessToken: env.HF_TOKEN,
						model: "t5-base",
						inputs: "My name is Wolfgang and I live in Berlin",
					})
				).toMatchObject({
					translation_text: "Mein Name ist Wolfgang und ich lebe in Berlin",
				});
			});
			it("zeroShotClassification", async () => {
				expect(
					await zeroShotClassification({
						model: "facebook/bart-large-mnli",
						inputs:
							"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
						parameters: { candidate_labels: ["refund", "legal", "faq"] },
						accessToken: env.HF_TOKEN,
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							sequence:
								"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
							labels: ["refund", "faq", "legal"],
							scores: [
								expect.closeTo(0.877787709236145, 5),
								expect.closeTo(0.10522633045911789, 5),
								expect.closeTo(0.01698593981564045, 5),
							],
						}),
					])
				);
			});
			it("sentenceSimilarity", async () => {
				expect(
					await sentenceSimilarity({
						accessToken: env.HF_TOKEN,
						model: "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
						inputs: {
							sourceSentence: "That is a happy person",
							sentences: ["That is a happy dog", "That is a very happy person", "Today is a sunny day"],
						},
					})
				).toEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
			});
			it("FeatureExtraction", async () => {
				const response = await featureExtraction({
					accessToken: env.HF_TOKEN,
					model: "sentence-transformers/distilbert-base-nli-mean-tokens",
					inputs: "That is a happy person",
				});
				expect(response).toEqual(expect.arrayContaining([expect.any(Number)]));
			});
			it("FeatureExtraction - same model as sentence similarity", async () => {
				const response = await featureExtraction({
					accessToken: env.HF_TOKEN,
					model: "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
					inputs: "That is a happy person",
				});

				expect(response.length).toBeGreaterThan(10);
				expect(response).toEqual(expect.arrayContaining([expect.any(Number)]));
			});
			it("FeatureExtraction - facebook/bart-base", async () => {
				const response = await featureExtraction({
					accessToken: env.HF_TOKEN,
					model: "facebook/bart-base",
					inputs: "That is a happy person",
				});
				// 1x7x768
				expect(response).toEqual([
					[
						expect.arrayContaining([expect.any(Number)]),
						expect.arrayContaining([expect.any(Number)]),
						expect.arrayContaining([expect.any(Number)]),
						expect.arrayContaining([expect.any(Number)]),
						expect.arrayContaining([expect.any(Number)]),
						expect.arrayContaining([expect.any(Number)]),
						expect.arrayContaining([expect.any(Number)]),
					],
				]);
			});
			it("FeatureExtraction - facebook/bart-base, list input", async () => {
				const response = await featureExtraction({
					accessToken: env.HF_TOKEN,
					model: "facebook/bart-base",
					inputs: ["hello", "That is a happy person"],
				});
				// Nx1xTx768
				expect(response).toEqual([
					[
						[
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
						],
					],
					[
						[
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
							expect.arrayContaining([expect.any(Number)]),
						],
					],
				]);
			});
			it("automaticSpeechRecognition", async () => {
				expect(
					await automaticSpeechRecognition({
						accessToken: env.HF_TOKEN,
						model: "facebook/wav2vec2-large-960h-lv60-self",
						inputs: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
					})
				).toMatchObject({
					text: "GOING ALONG SLUSHY COUNTRY ROADS AND SPEAKING TO DAMP AUDIENCES IN DRAUGHTY SCHOOLROOMS DAY AFTER DAY FOR A FORTNIGHT HE'LL HAVE TO PUT IN AN APPEARANCE AT SOME PLACE OF WORSHIP ON SUNDAY MORNING AND HE CAN COME TO US IMMEDIATELY AFTERWARDS",
				});
			});
			it("audioClassification", async () => {
				expect(
					await audioClassification({
						model: "superb/hubert-large-superb-er",
						inputs: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
						accessToken: env.HF_TOKEN,
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							label: expect.any(String),
						}),
					])
				);
			});

			it("audioToAudio", async () => {
				expect(
					await audioToAudio({
						model: "speechbrain/sepformer-wham",
						accessToken: env.HF_TOKEN,
						inputs: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							label: expect.any(String),
							audio: expect.any(Blob),
						}),
						expect.objectContaining({
							label: expect.any(String),
							audio: expect.any(Blob),
						}),
					])
				);
			});

			it("textToSpeech", async () => {
				expect(
					await textToSpeech({
						accessToken: env.HF_TOKEN,
						model: "espnet/kan-bayashi_ljspeech_vits",
						inputs: "hello there!",
					})
				).toMatchObject({
					audio: expect.any(Blob),
				});
			});

			it("imageClassification", async () => {
				expect(
					await imageClassification({
						accessToken: env.HF_TOKEN,
						inputs: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
						model: "google/vit-base-patch16-224",
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							label: expect.any(String),
						}),
					])
				);
			});

			it("zeroShotImageClassification", async () => {
				expect(
					await zeroShotImageClassification({
						accessToken: env.HF_TOKEN,
						inputs: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
						model: "openai/clip-vit-large-patch14-336",
						parameters: {
							candidate_labels: ["animal", "toy", "car"],
						},
					})
				).toEqual([
					{
						label: "animal",
						score: expect.any(Number),
					},
					{
						label: "car",
						score: expect.any(Number),
					},
					{
						label: "toy",
						score: expect.any(Number),
					},
				]);
			});

			it("objectDetection", async () => {
				expect(
					await objectDetection({
						accessToken: env.HF_TOKEN,
						inputs: new Blob([readTestFile("cats.png")], { type: "image/png" }),
						model: "facebook/detr-resnet-50",
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							label: expect.any(String),
							box: expect.objectContaining({
								xmin: expect.any(Number),
								ymin: expect.any(Number),
								xmax: expect.any(Number),
								ymax: expect.any(Number),
							}),
						}),
					])
				);
			});
			it("imageSegmentation", async () => {
				expect(
					await imageClassification({
						accessToken: env.HF_TOKEN,
						inputs: new Blob([readTestFile("cats.png")], { type: "image/png" }),
						model: "facebook/detr-resnet-50-panoptic",
					})
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							label: expect.any(String),
							mask: expect.any(String),
						}),
					])
				);
			});
			it("imageToImage", async () => {
				const num_inference_steps = 25;

				const res = await imageToImage({
					accessToken: env.HF_TOKEN,
					inputs: new Blob([readTestFile("stormtrooper_depth.png")], { type: "image/png" }),
					parameters: {
						prompt: "elmo's lecture",
						num_inference_steps,
					},
					model: "lllyasviel/sd-controlnet-depth",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});
			it("imageToImage blob data", async () => {
				const res = await imageToImage({
					accessToken: env.HF_TOKEN,
					inputs: new Blob([readTestFile("bird_canny.png")], { type: "image / png" }),
					model: "lllyasviel/sd-controlnet-canny",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});
			it("textToImage", async () => {
				const res = await textToImage({
					accessToken: env.HF_TOKEN,
					inputs:
						"award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]",
					model: "stabilityai/stable-diffusion-2",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});

			it("textToImage with parameters", async () => {
				const width = 512;
				const height = 128;
				const num_inference_steps = 10;

				const res = await textToImage({
					accessToken: env.HF_TOKEN,
					inputs:
						"award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]",
					model: "stabilityai/stable-diffusion-2",
					parameters: {
						negative_prompt: "blurry",
						width,
						height,
						num_inference_steps,
					},
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});
			it("imageToText", async () => {
				expect(
					await imageToText({
						accessToken: env.HF_TOKEN,
						inputs: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
						model: "nlpconnect/vit-gpt2-image-captioning",
					})
				).toEqual({
					generated_text: "a large brown and white giraffe standing in a field ",
				});
			});
			it("request - openai-community/gpt2", async () => {
				expect(
					await request({
						accessToken: env.HF_TOKEN,
						model: "openai-community/gpt2",
						inputs: "one plus two equals",
					})
				).toMatchObject([
					{
						generated_text: expect.any(String),
					},
				]);
			});

			// Skipped at the moment because takes forever
			it.skip("tabularRegression", async () => {
				expect(
					await tabularRegression({
						accessToken: env.HF_TOKEN,
						model: "scikit-learn/Fish-Weight",
						inputs: {
							data: {
								Height: ["11.52", "12.48", "12.3778"],
								Length1: ["23.2", "24", "23.9"],
								Length2: ["25.4", "26.3", "26.5"],
								Length3: ["30", "31.2", "31.1"],
								Species: ["Bream", "Bream", "Bream"],
								Width: ["4.02", "4.3056", "4.6961"],
							},
						},
					})
				).toMatchObject([270.5473526976245, 313.6843425638086, 328.3727133404402]);
			});

			// Skipped at the moment because takes forever
			it.skip("tabularClassification", async () => {
				expect(
					await tabularClassification({
						accessToken: env.HF_TOKEN,
						model: "vvmnnnkv/wine-quality",
						inputs: {
							data: {
								fixed_acidity: ["7.4", "7.8", "10.3"],
								volatile_acidity: ["0.7", "0.88", "0.32"],
								citric_acid: ["0", "0", "0.45"],
								residual_sugar: ["1.9", "2.6", "6.4"],
								chlorides: ["0.076", "0.098", "0.073"],
								free_sulfur_dioxide: ["11", "25", "5"],
								total_sulfur_dioxide: ["34", "67", "13"],
								density: ["0.9978", "0.9968", "0.9976"],
								pH: ["3.51", "3.2", "3.23"],
								sulphates: ["0.56", "0.68", "0.82"],
								alcohol: ["9.4", "9.8", "12.6"],
							},
						},
					})
				).toMatchObject([5, 5, 7]);
			});

			const hf = new HfInference();
			it("endpoint - makes request to specified endpoint", async () => {
				const ep = hf.endpoint("https://api-inference.huggingface.co/models/openai-community/gpt2");
				const { generated_text } = await ep.textGeneration({
					inputs: "one plus two equals",
					accessToken: env.HF_TOKEN,
				});
				assert.include(generated_text, "three");
			});

			it("chatCompletion modelId - OpenAI Specs", async () => {
				const res = await chatCompletion({
					accessToken: env.HF_TOKEN,
					model: "mistralai/Mistral-7B-Instruct-v0.2",
					messages: [{ role: "user", content: "Complete the this sentence with words one plus one is equal " }],
					max_tokens: 500,
					temperature: 0.1,
					seed: 0,
				});
				if (res.choices && res.choices.length > 0) {
					const completion = res.choices[0].message?.content;
					expect(completion).toContain("to two");
				}
			});

			it("chatCompletionStream modelId - OpenAI Specs", async () => {
				const stream = chatCompletionStream({
					accessToken: env.HF_TOKEN,
					model: "mistralai/Mistral-7B-Instruct-v0.2",
					messages: [{ role: "user", content: "Complete the equation 1+1= ,just the answer" }],
					max_tokens: 500,
					temperature: 0.1,
					seed: 0,
				});
				let out = "";
				for await (const chunk of stream) {
					if (chunk.choices && chunk.choices.length > 0) {
						out += chunk.choices[0].delta.content;
					}
				}
				expect(out).toContain("2");
			});

			it("chatCompletionStream modelId Fail - OpenAI Specs", async () => {
				expect(
					chatCompletionStream({
						accessToken: env.HF_TOKEN,
						model: "google/gemma-2b",
						messages: [{ role: "user", content: "Complete the equation 1+1= ,just the answer" }],
						max_tokens: 500,
						temperature: 0.1,
						seed: 0,
					}).next()
				).rejects.toThrowError(
					"Server google/gemma-2b does not seem to support chat completion. Error: Template error: template not found"
				);
			});

			it("chatCompletion - OpenAI Specs", async () => {
				const ep = hf.endpoint("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2");
				const res = await ep.chatCompletion({
					model: "tgi",
					messages: [{ role: "user", content: "Complete the this sentence with words one plus one is equal " }],
					max_tokens: 500,
					temperature: 0.1,
					seed: 0,
				});
				if (res.choices && res.choices.length > 0) {
					const completion = res.choices[0].message?.content;
					expect(completion).toContain("to two");
				}
			});
			it("chatCompletionStream - OpenAI Specs", async () => {
				const ep = hf.endpoint("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2");
				const stream = ep.chatCompletionStream({
					model: "tgi",
					messages: [{ role: "user", content: "Complete the equation 1+1= ,just the answer" }],
					max_tokens: 500,
					temperature: 0.1,
					seed: 0,
				});
				let out = "";
				for await (const chunk of stream) {
					if (chunk.choices && chunk.choices.length > 0) {
						out += chunk.choices[0].delta.content;
					}
				}
				expect(out).toContain("2");
			});
			it("custom mistral - OpenAI Specs", async () => {
				const MISTRAL_KEY = env.MISTRAL_KEY;
				const hf = new HfInference(MISTRAL_KEY);
				const ep = hf.endpoint("https://api.mistral.ai");
				const stream = ep.chatCompletionStream({
					model: "mistral-tiny",
					messages: [{ role: "user", content: "Complete the equation one + one = , just the answer" }],
				}) as AsyncGenerator<ChatCompletionStreamOutput>;
				let out = "";
				for await (const chunk of stream) {
					if (chunk.choices && chunk.choices.length > 0) {
						out += chunk.choices[0].delta.content;
					}
				}
				expect(out).toContain("The answer to one + one is two.");
			});
			it("custom openai - OpenAI Specs", async () => {
				const OPENAI_KEY = env.OPENAI_KEY;
				const hf = new HfInference(OPENAI_KEY);
				const ep = hf.endpoint("https://api.openai.com");
				const stream = ep.chatCompletionStream({
					model: "gpt-3.5-turbo",
					messages: [{ role: "user", content: "Complete the equation one + one =" }],
				}) as AsyncGenerator<ChatCompletionStreamOutput>;
				let out = "";
				for await (const chunk of stream) {
					if (chunk.choices && chunk.choices.length > 0) {
						out += chunk.choices[0].delta.content;
					}
				}
				expect(out).toContain("two");
			});
		},
		TIMEOUT
	);

	/**
	 * Compatibility with third-party Inference Providers
	 */
	describe.concurrent(
		"Fal AI",
		() => {
			it("textToImage", async () => {
				const res = await textToImage({
					accessToken: env.HF_FAL_KEY,
					model: "black-forest-labs/FLUX.1-schnell",
					provider: "fal-ai",
					inputs: "black forest gateau cake spelling out the words FLUX SCHNELL, tasty, food photography, dynamic shot",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});

			it("speechToText", async () => {
				const res = await automaticSpeechRecognition({
					accessToken: env.HF_FAL_KEY,
					model: "openai/whisper-large-v3",
					provider: "fal-ai",
					inputs: new Blob([readTestFile("sample2.wav")], { type: "audio/x-wav" }),
				});
				expect(res).toMatchObject({
					text: " he has grave doubts whether sir frederick leighton's work is really greek after all and can discover in it but little of rocky ithaca",
				});
			});
		},
		TIMEOUT
	);

	describe.concurrent(
		"Replicate",
		() => {
			it("textToImage canonical", async () => {
				const res = await textToImage({
					accessToken: env.HF_REPLICATE_KEY,
					model: "black-forest-labs/FLUX.1-schnell",
					provider: "replicate",
					inputs: "black forest gateau cake spelling out the words FLUX SCHNELL, tasty, food photography, dynamic shot",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});

			it("textToImage versioned", async () => {
				const res = await textToImage({
					accessToken: env.HF_REPLICATE_KEY,
					model: "ByteDance/SDXL-Lightning",
					provider: "replicate",
					inputs: "black forest gateau cake spelling out the words FLUX SCHNELL, tasty, food photography, dynamic shot",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});

			it.skip("textToSpeech versioned", async () => {
				const res = await textToSpeech({
					accessToken: env.HF_REPLICATE_KEY,
					model: "SWivid/F5-TTS",
					provider: "replicate",
					inputs: "Hello, how are you?",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});
		},
		TIMEOUT
	);
	describe.concurrent(
		"SambaNova",
		() => {
			it("chatCompletion", async () => {
				const res = await chatCompletion({
					accessToken: env.HF_SAMBANOVA_KEY,
					model: "meta-llama/Llama-3.1-8B-Instruct",
					provider: "sambanova",
					messages: [{ role: "user", content: "Complete this sentence with words, one plus one is equal " }],
				});
				if (res.choices && res.choices.length > 0) {
					const completion = res.choices[0].message?.content;
					expect(completion).toContain("two");
				}
			});
			it("chatCompletion stream", async () => {
				const stream = chatCompletionStream({
					accessToken: env.HF_SAMBANOVA_KEY,
					model: "meta-llama/Llama-3.1-8B-Instruct",
					provider: "sambanova",
					messages: [{ role: "user", content: "Complete the equation 1 + 1 = , just the answer" }],
				}) as AsyncGenerator<ChatCompletionStreamOutput>;
				let out = "";
				for await (const chunk of stream) {
					if (chunk.choices && chunk.choices.length > 0) {
						out += chunk.choices[0].delta.content;
					}
				}
				expect(out).toContain("2");
			});
		},
		TIMEOUT
	);

	describe.concurrent(
		"Together",
		() => {
			it("chatCompletion", async () => {
				const res = await chatCompletion({
					accessToken: env.HF_TOGETHER_KEY,
					model: "meta-llama/Llama-3.3-70B-Instruct",
					provider: "together",
					messages: [{ role: "user", content: "Complete this sentence with words, one plus one is equal " }],
				});
				if (res.choices && res.choices.length > 0) {
					const completion = res.choices[0].message?.content;
					expect(completion).toContain("two");
				}
			});

			it("chatCompletion stream", async () => {
				const stream = chatCompletionStream({
					accessToken: env.HF_TOGETHER_KEY,
					model: "meta-llama/Llama-3.3-70B-Instruct",
					provider: "together",
					messages: [{ role: "user", content: "Complete the equation 1 + 1 = , just the answer" }],
				}) as AsyncGenerator<ChatCompletionStreamOutput>;
				let out = "";
				for await (const chunk of stream) {
					if (chunk.choices && chunk.choices.length > 0) {
						out += chunk.choices[0].delta.content;
					}
				}
				expect(out).toContain("2");
			});

			it("textToImage", async () => {
				const res = await textToImage({
					model: "stabilityai/stable-diffusion-xl-base-1.0",
					accessToken: env.HF_TOGETHER_KEY,
					provider: "together",
					inputs: "award winning high resolution photo of a giant tortoise",
				});
				expect(res).toSatisfy((out) => typeof out === "object" && !!out && "image" in out && out.image instanceof Blob);
			});

			it("textGeneration", async () => {
				const res = await textGeneration({
					accessToken: env.HF_TOGETHER_KEY,
					model: "mistralai/Mixtral-8x7B-v0.1",
					provider: "together",
					inputs: "Paris is",
					temperature: 0,
					max_tokens: 10,
				});
				expect(res).toMatchObject({ generated_text: " a city of love, and it’s also" });
			});
		},
		TIMEOUT
	);

	describe.concurrent("3rd party providers", () => {
		it("chatCompletion - fails with unsupported model", async () => {
			expect(
				chatCompletion({
					model: "black-forest-labs/Flux.1-dev",
					provider: "together",
					messages: [{ role: "user", content: "Complete this sentence with words, one plus one is equal " }],
					accessToken: env.HF_TOGETHER_KEY,
				})
			).rejects.toThrowError(
				"Model black-forest-labs/Flux.1-dev is not supported for task conversational and provider together"
			);
		});
	});
});
