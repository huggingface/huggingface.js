import { assert, describe, expect, it } from "vitest";

import type { ChatCompletionStreamOutput } from "@huggingface/tasks";

import { HfInference, InferenceClient } from "../src/index.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";
import { readTestFile } from "./test-files.js";

const TIMEOUT = 60000 * 3;
const env = import.meta.env;

if (!env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
}

describe.skip("InferenceClient", () => {
	// Individual tests can be ran without providing an api key, however running all tests without an api key will result in rate limiting error.

	describe("backward compatibility", () => {
		it("works with old HfInference name", async () => {
			const hf = new HfInference(env.HF_TOKEN);
			expect("fillMask" in hf).toBe(true);
		});
	});

	describe.concurrent(
		"HF Inference",
		() => {
			const hf = new InferenceClient(env.HF_TOKEN);
			HARDCODED_MODEL_INFERENCE_MAPPING["hf-inference"] = {
				"google-bert/bert-base-uncased": {
					provider: "hf-inference",
					providerId: "google-bert/bert-base-uncased",
					hfModelId: "google-bert/bert-base-uncased",
					task: "fill-mask",
					status: "live",
				},
				"google/pegasus-xsum": {
					provider: "hf-inference",
					providerId: "google/pegasus-xsum",
					hfModelId: "google/pegasus-xsum",
					task: "summarization",
					status: "live",
				},
				"deepset/roberta-base-squad2": {
					provider: "hf-inference",
					providerId: "deepset/roberta-base-squad2",
					hfModelId: "deepset/roberta-base-squad2",
					task: "question-answering",
					status: "live",
				},
				"google/tapas-base-finetuned-wtq": {
					provider: "hf-inference",
					providerId: "google/tapas-base-finetuned-wtq",
					hfModelId: "google/tapas-base-finetuned-wtq",
					task: "table-question-answering",
					status: "live",
				},
				"mistralai/Mistral-7B-Instruct-v0.2": {
					provider: "hf-inference",
					providerId: "mistralai/Mistral-7B-Instruct-v0.2",
					hfModelId: "mistralai/Mistral-7B-Instruct-v0.2",
					task: "text-generation",
					status: "live",
				},
				"impira/layoutlm-document-qa": {
					provider: "hf-inference",
					providerId: "impira/layoutlm-document-qa",
					hfModelId: "impira/layoutlm-document-qa",
					task: "document-question-answering",
					status: "live",
				},
				"naver-clova-ix/donut-base-finetuned-docvqa": {
					provider: "hf-inference",
					providerId: "naver-clova-ix/donut-base-finetuned-docvqa",
					hfModelId: "naver-clova-ix/donut-base-finetuned-docvqa",
					task: "document-question-answering",
					status: "live",
				},
				"google/tapas-large-finetuned-wtq": {
					provider: "hf-inference",
					providerId: "google/tapas-large-finetuned-wtq",
					hfModelId: "google/tapas-large-finetuned-wtq",
					task: "table-question-answering",
					status: "live",
				},
				"facebook/detr-resnet-50": {
					provider: "hf-inference",
					providerId: "facebook/detr-resnet-50",
					hfModelId: "facebook/detr-resnet-50",
					task: "object-detection",
					status: "live",
				},
				"facebook/detr-resnet-50-panoptic": {
					provider: "hf-inference",
					providerId: "facebook/detr-resnet-50-panoptic",
					hfModelId: "facebook/detr-resnet-50-panoptic",
					task: "image-segmentation",
					status: "live",
				},
				"facebook/wav2vec2-large-960h-lv60-self": {
					provider: "hf-inference",
					providerId: "facebook/wav2vec2-large-960h-lv60-self",
					hfModelId: "facebook/wav2vec2-large-960h-lv60-self",
					task: "automatic-speech-recognition",
					status: "live",
				},
				"superb/hubert-large-superb-er": {
					provider: "hf-inference",
					providerId: "superb/hubert-large-superb-er",
					hfModelId: "superb/hubert-large-superb-er",
					task: "audio-classification",
					status: "live",
				},
				"speechbrain/sepformer-wham": {
					provider: "hf-inference",
					providerId: "speechbrain/sepformer-wham",
					hfModelId: "speechbrain/sepformer-wham",
					task: "audio-to-audio",
					status: "live",
				},
				"espnet/kan-bayashi_ljspeech_vits": {
					provider: "hf-inference",
					providerId: "espnet/kan-bayashi_ljspeech_vits",
					hfModelId: "espnet/kan-bayashi_ljspeech_vits",
					task: "text-to-speech",
					status: "live",
				},
				"sentence-transformers/paraphrase-xlm-r-multilingual-v1": {
					provider: "hf-inference",
					providerId: "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
					hfModelId: "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
					task: "sentence-similarity",
					status: "live",
				},
				"sentence-transformers/distilbert-base-nli-mean-tokens": {
					provider: "hf-inference",
					providerId: "sentence-transformers/distilbert-base-nli-mean-tokens",
					hfModelId: "sentence-transformers/distilbert-base-nli-mean-tokens",
					task: "feature-extraction",
					status: "live",
				},
				"facebook/bart-base": {
					provider: "hf-inference",
					providerId: "facebook/bart-base",
					hfModelId: "facebook/bart-base",
					task: "feature-extraction",
					status: "live",
				},
				"facebook/bart-large-mnli": {
					provider: "hf-inference",
					providerId: "facebook/bart-large-mnli",
					hfModelId: "facebook/bart-large-mnli",
					task: "zero-shot-classification",
					status: "live",
				},
				"facebook/bart-large-cnn": {
					provider: "hf-inference",
					providerId: "facebook/bart-large-cnn",
					hfModelId: "facebook/bart-large-cnn",
					task: "summarization",
					status: "live",
				},
				"facebook/bart-large-xsum": {
					provider: "hf-inference",
					providerId: "facebook/bart-large-xsum",
					hfModelId: "facebook/bart-large-xsum",
					task: "summarization",
					status: "live",
				},
				"stabilityai/stable-diffusion-2": {
					provider: "hf-inference",
					providerId: "stabilityai/stable-diffusion-2",
					hfModelId: "stabilityai/stable-diffusion-2",
					task: "text-to-image",
					status: "live",
				},
				"lllyasviel/sd-controlnet-canny": {
					provider: "hf-inference",
					providerId: "lllyasviel/sd-controlnet-canny",
					hfModelId: "lllyasviel/sd-controlnet-canny",
					task: "image-to-image",
					status: "live",
				},
				"lllyasviel/sd-controlnet-depth": {
					provider: "hf-inference",
					providerId: "lllyasviel/sd-controlnet-depth",
					hfModelId: "lllyasviel/sd-controlnet-depth",
					task: "image-to-image",
					status: "live",
				},
				"t5-base": {
					provider: "hf-inference",
					providerId: "t5-base",
					hfModelId: "t5-base",
					task: "translation",
					status: "live",
				},
				"openai/clip-vit-large-patch14-336": {
					provider: "hf-inference",
					providerId: "openai/clip-vit-large-patch14-336",
					hfModelId: "openai/clip-vit-large-patch14-336",
					task: "zero-shot-image-classification",
					status: "live",
				},
				"google/vit-base-patch16-224": {
					provider: "hf-inference",
					providerId: "google/vit-base-patch16-224",
					hfModelId: "google/vit-base-patch16-224",
					task: "image-classification",
					status: "live",
				},
				"dandelin/vilt-b32-finetuned-vqa": {
					provider: "hf-inference",
					providerId: "dandelin/vilt-b32-finetuned-vqa",
					hfModelId: "dandelin/vilt-b32-finetuned-vqa",
					task: "visual-question-answering",
					status: "live",
				},
				"dbmdz/bert-large-cased-finetuned-conll03-english": {
					provider: "hf-inference",
					providerId: "dbmdz/bert-large-cased-finetuned-conll03-english",
					hfModelId: "dbmdz/bert-large-cased-finetuned-conll03-english",
					task: "token-classification",
					status: "live",
				},
				"nlpconnect/vit-gpt2-image-captioning": {
					provider: "hf-inference",
					providerId: "nlpconnect/vit-gpt2-image-captioning",
					hfModelId: "nlpconnect/vit-gpt2-image-captioning",
					task: "image-to-text",
					status: "live",
				},
			};

			it("throws error if model does not exist", () => {
				expect(
					hf.fillMask({
						model: "this-model/does-not-exist-123",
						inputs: "[MASK] world!",
					}),
				).rejects.toThrowError("Model this-model/does-not-exist-123 does not exist");
			});

			it("fillMask", async () => {
				expect(
					await hf.fillMask({
						model: "google-bert/bert-base-uncased",
						inputs: "[MASK] world!",
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							token: expect.any(Number),
							token_str: expect.any(String),
							sequence: expect.any(String),
						}),
					]),
				);
			});

			it.skip("works without model", async () => {
				expect(
					await hf.fillMask({
						inputs: "[MASK] world!",
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							token: expect.any(Number),
							token_str: expect.any(String),
							sequence: expect.any(String),
						}),
					]),
				);
			});

			it("summarization", async () => {
				expect(
					await hf.summarization({
						model: "google/pegasus-xsum",
						inputs:
							"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.",
						parameters: {
							max_length: 100,
						},
					}),
				).toEqual({
					summary_text: "The Eiffel Tower is one of the most famous buildings in the world.",
				});
			});

			it("questionAnswering", async () => {
				expect(
					await hf.questionAnswering({
						model: "deepset/roberta-base-squad2",
						inputs: {
							question: "What is the capital of France?",
							context: "The capital of France is Paris.",
						},
					}),
				).toMatchObject({
					answer: "Paris",
					score: expect.any(Number),
					start: expect.any(Number),
					end: expect.any(Number),
				});
			});

			it("tableQuestionAnswering", async () => {
				expect(
					await hf.tableQuestionAnswering({
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
					}),
				).toMatchObject({
					answer: "AVERAGE > 36542",
					coordinates: [[0, 1]],
					cells: ["36542"],
					aggregator: "AVERAGE",
				});
			});

			it("documentQuestionAnswering", async () => {
				expect(
					await hf.documentQuestionAnswering({
						model: "impira/layoutlm-document-qa",
						inputs: {
							question: "Invoice number?",
							image: new Blob([readTestFile("invoice.png")], { type: "image/png" }),
						},
					}),
				).toMatchObject({
					answer: "us-001",
					score: expect.any(Number),
					// not sure what start/end refers to in this case
					start: expect.any(Number),
					end: expect.any(Number),
				});
			});

			// Errors with "Error: If you are using a VisionEncoderDecoderModel, you must provide a feature extractor"
			it.skip("documentQuestionAnswering with non-array output", async () => {
				expect(
					await hf.documentQuestionAnswering({
						model: "naver-clova-ix/donut-base-finetuned-docvqa",
						inputs: {
							question: "Invoice number?",
							image: new Blob([readTestFile("invoice.png")], { type: "image/png" }),
						},
					}),
				).toMatchObject({
					answer: "us-001",
				});
			});

			it("visualQuestionAnswering", async () => {
				expect(
					await hf.visualQuestionAnswering({
						model: "dandelin/vilt-b32-finetuned-vqa",
						inputs: {
							question: "How many cats are lying down?",
							image: new Blob([readTestFile("cats.png")], { type: "image/png" }),
						},
					}),
				).toMatchObject({
					answer: "2",
					score: expect.any(Number),
				});
			});

			it("textClassification", async () => {
				expect(
					await hf.textClassification({
						model: "distilbert-base-uncased-finetuned-sst-2-english",
						inputs: "I like you. I love you.",
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							label: expect.any(String),
							score: expect.any(Number),
						}),
					]),
				);
			});

			it.skip("textGeneration - gpt2", async () => {
				expect(
					await hf.textGeneration({
						model: "gpt2",
						inputs: "The answer to the universe is",
					}),
				).toMatchObject({
					generated_text: expect.any(String),
				});
			});

			it.skip("textGeneration - openai-community/gpt2", async () => {
				expect(
					await hf.textGeneration({
						model: "openai-community/gpt2",
						inputs: "The answer to the universe is",
					}),
				).toMatchObject({
					generated_text: expect.any(String),
				});
			});

			it("textGenerationStream - meta-llama/Llama-3.2-3B", async () => {
				const response = hf.textGenerationStream({
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
				const response = hf.textGenerationStream({
					model: "meta-llama/Llama-3.2-3B",
					inputs: "Write a short story about a robot that becomes sentient and takes over the world.",
					parameters: {
						max_new_tokens: 10_000,
					},
				});

				await expect(response.next()).rejects.toThrow(
					"Error forwarded from backend: Input validation error: `inputs` tokens + `max_new_tokens` must be <= 4096. Given: 17 `inputs` tokens and 10000 `max_new_tokens`",
				);
			});

			it.skip("textGenerationStream - Abort", async () => {
				const controller = new AbortController();
				const response = hf.textGenerationStream(
					{
						model: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
						inputs: "Write an essay about Sartre's philosophy.",
						parameters: {
							max_new_tokens: 100,
						},
					},
					{ signal: controller.signal },
				);
				await expect(response.next()).resolves.toBeDefined();
				await expect(response.next()).resolves.toBeDefined();
				controller.abort();
				await expect(response.next()).rejects.toThrow("The operation was aborted");
			});

			it("tokenClassification", async () => {
				expect(
					await hf.tokenClassification({
						model: "dbmdz/bert-large-cased-finetuned-conll03-english",
						inputs: "My name is Sarah Jessica Parker but you can call me Jessica",
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							entity_group: expect.any(String),
							score: expect.any(Number),
							word: expect.any(String),
							start: expect.any(Number),
							end: expect.any(Number),
						}),
					]),
				);
			});

			it("translation", async () => {
				expect(
					await hf.translation({
						model: "t5-base",
						inputs: "My name is Wolfgang and I live in Berlin",
					}),
				).toMatchObject({
					translation_text: "Mein Name ist Wolfgang und ich lebe in Berlin",
				});
				// input is a list
				expect(
					await hf.translation({
						model: "t5-base",
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						inputs: ["My name is Wolfgang and I live in Berlin", "I work as programmer"] as any,
					}),
				).toMatchObject([
					{
						translation_text: "Mein Name ist Wolfgang und ich lebe in Berlin",
					},
					{
						translation_text: "Ich arbeite als Programmierer",
					},
				]);
			});
			it("zeroShotClassification", async () => {
				expect(
					await hf.zeroShotClassification({
						model: "facebook/bart-large-mnli",
						inputs: [
							"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
						] as any,
						parameters: { candidate_labels: ["refund", "legal", "faq"] },
					}),
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
					]),
				);
			});
			it("sentenceSimilarity", async () => {
				expect(
					await hf.sentenceSimilarity({
						model: "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
						inputs: {
							source_sentence: "That is a happy person",
							sentences: ["That is a happy dog", "That is a very happy person", "Today is a sunny day"],
						},
					}),
				).toEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
			});
			it("FeatureExtraction", async () => {
				const response = await hf.featureExtraction({
					model: "sentence-transformers/distilbert-base-nli-mean-tokens",
					inputs: "That is a happy person",
				});
				expect(response).toEqual(expect.arrayContaining([expect.any(Number)]));
			});
			it("FeatureExtraction - auto-compatibility sentence similarity", async () => {
				const response = await hf.featureExtraction({
					model: "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
					inputs: "That is a happy person",
				});

				expect(response.length).toBeGreaterThan(10);
				expect(response).toEqual(expect.arrayContaining([expect.any(Number)]));
			});
			it("FeatureExtraction - facebook/bart-base", async () => {
				const response = await hf.featureExtraction({
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
				const response = await hf.featureExtraction({
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
					await hf.automaticSpeechRecognition({
						model: "facebook/wav2vec2-large-960h-lv60-self",
						data: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
					}),
				).toMatchObject({
					text: "GOING ALONG SLUSHY COUNTRY ROADS AND SPEAKING TO DAMP AUDIENCES IN DRAUGHTY SCHOOLROOMS DAY AFTER DAY FOR A FORTNIGHT HE'LL HAVE TO PUT IN AN APPEARANCE AT SOME PLACE OF WORSHIP ON SUNDAY MORNING AND HE CAN COME TO US IMMEDIATELY AFTERWARDS",
				});
			});
			it("audioClassification", async () => {
				expect(
					await hf.audioClassification({
						model: "superb/hubert-large-superb-er",
						data: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							label: expect.any(String),
						}),
					]),
				);
			});

			it("audioToAudio", async () => {
				expect(
					await hf.audioToAudio({
						model: "speechbrain/sepformer-wham",
						data: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							label: expect.any(String),
							blob: expect.any(String),
							"content-type": expect.any(String),
						}),
					]),
				);
			});

			it("textToSpeech", async () => {
				expect(
					await hf.textToSpeech({
						model: "espnet/kan-bayashi_ljspeech_vits",
						inputs: "hello there!",
					}),
				).toBeInstanceOf(Blob);
			});

			it("imageClassification", async () => {
				expect(
					await hf.imageClassification({
						data: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
						model: "google/vit-base-patch16-224",
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							label: expect.any(String),
						}),
					]),
				);
			});

			it("zeroShotImageClassification", async () => {
				expect(
					await hf.zeroShotImageClassification({
						inputs: { image: new Blob([readTestFile("cheetah.png")], { type: "image/png" }) },
						model: "openai/clip-vit-large-patch14-336",
						parameters: {
							candidate_labels: ["animal", "toy", "car"],
						},
					}),
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
					await hf.objectDetection({
						data: new Blob([readTestFile("cats.png")], { type: "image/png" }),
						model: "facebook/detr-resnet-50",
					}),
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
					]),
				);
			});
			it("imageSegmentation", async () => {
				expect(
					await hf.imageSegmentation({
						inputs: new Blob([readTestFile("cats.png")], { type: "image/png" }),
						model: "facebook/detr-resnet-50-panoptic",
					}),
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							score: expect.any(Number),
							label: expect.any(String),
							mask: expect.any(String),
						}),
					]),
				);
			});
			it("imageToImage", async () => {
				const num_inference_steps = 25;

				const res = await hf.imageToImage({
					inputs: new Blob([readTestFile("stormtrooper_depth.png")], { type: "image / png" }),
					parameters: {
						prompt: "elmo's lecture",
						num_inference_steps,
					},
					model: "lllyasviel/sd-controlnet-depth",
				});
				expect(res).toBeInstanceOf(Blob);
			});
			it("imageToImage blob data", async () => {
				const res = await hf.imageToImage({
					inputs: new Blob([readTestFile("bird_canny.png")], { type: "image / png" }),
					model: "lllyasviel/sd-controlnet-canny",
				});
				expect(res).toBeInstanceOf(Blob);
			});
			it("textToImage", async () => {
				const res = await hf.textToImage({
					inputs:
						"award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]",
					model: "stabilityai/stable-diffusion-2",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage with parameters", async () => {
				const width = 512;
				const height = 128;
				const num_inference_steps = 10;

				const res = await hf.textToImage({
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
				expect(res).toBeInstanceOf(Blob);
			});
			it("textToImage with json output", async () => {
				const res = await hf.textToImage({
					inputs: "a giant tortoise",
					model: "stabilityai/stable-diffusion-2",
					outputType: "json",
				});
				expect(res).toMatchObject({
					output: expect.any(String),
				});
			});
			it("imageToText", async () => {
				expect(
					await hf.imageToText({
						data: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
						model: "nlpconnect/vit-gpt2-image-captioning",
					}),
				).toEqual({
					generated_text: "a large brown and white giraffe standing in a field ",
				});
			});

			/// Skipping because the function is deprecated
			it.skip("request - openai-community/gpt2", async () => {
				expect(
					await hf.request({
						model: "openai-community/gpt2",
						inputs: "one plus two equals",
					}),
				).toMatchObject([
					{
						generated_text: expect.any(String),
					},
				]);
			});

			// Skipped at the moment because takes forever
			it.skip("tabularRegression", async () => {
				expect(
					await hf.tabularRegression({
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
					}),
				).toMatchObject([270.5473526976245, 313.6843425638086, 328.3727133404402]);
			});

			// Skipped at the moment because takes forever
			it.skip("tabularClassification", async () => {
				expect(
					await hf.tabularClassification({
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
					}),
				).toMatchObject([5, 5, 7]);
			});

			it("endpoint - makes request to specified endpoint", async () => {
				const ep = hf.endpoint("https://router.huggingface.co/hf-inference/models/openai-community/gpt2");
				const { generated_text } = await ep.textGeneration({
					inputs: "one plus one is equal to",
					parameters: {
						max_new_tokens: 1,
					},
				});
				assert.include(generated_text, "two");
			});

			it("endpoint - makes request to specified endpoint - alternative syntax", async () => {
				const epClient = new InferenceClient(env.HF_TOKEN, {
					endpointUrl: "https://router.huggingface.co/hf-inference/models/openai-community/gpt2",
				});
				const { generated_text } = await epClient.textGeneration({
					inputs: "one plus one is equal to",
					parameters: {
						max_new_tokens: 1,
					},
				});
				assert.include(generated_text, "two");
			});

			it("chatCompletion modelId - OpenAI Specs", async () => {
				const res = await hf.chatCompletion({
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
				const stream = hf.chatCompletionStream({
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

			it.skip("chatCompletionStream modelId Fail - OpenAI Specs", async () => {
				expect(
					hf
						.chatCompletionStream({
							model: "google/gemma-2b",
							messages: [{ role: "user", content: "Complete the equation 1+1= ,just the answer" }],
							max_tokens: 500,
							temperature: 0.1,
							seed: 0,
						})
						.next(),
				).rejects.toThrowError(
					"Server google/gemma-2b does not seem to support chat completion. Error: Template error: template not found",
				);
			});

			it("chatCompletion - OpenAI Specs", async () => {
				const ep = hf.endpoint("https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2");
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
				const ep = hf.endpoint("https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2");
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
				const hf = new InferenceClient(MISTRAL_KEY);
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
		},
		TIMEOUT,
	);

	/**
	 * Compatibility with third-party Inference Providers
	 */
	describe.concurrent(
		"Fal AI",
		() => {
			const client = new InferenceClient(env.HF_FAL_KEY ?? "dummy");

			HARDCODED_MODEL_INFERENCE_MAPPING["fal-ai"] = {
				"openfree/flux-chatgpt-ghibli-lora": {
					provider: "fal-ai",
					hfModelId: "openfree/flux-chatgpt-ghibli-lora",
					providerId: "fal-ai/flux-lora",
					status: "live",
					task: "text-to-image",
					adapter: "lora",
					adapterWeightsPath: "flux-chatgpt-ghibli-lora.safetensors",
				},
				"nerijs/pixel-art-xl": {
					provider: "fal-ai",
					hfModelId: "nerijs/pixel-art-xl",
					providerId: "fal-ai/lora",
					status: "live",
					task: "text-to-image",
					adapter: "lora",
					adapterWeightsPath: "pixel-art-xl.safetensors",
				},
			};

			it(`textToImage - black-forest-labs/FLUX.1-schnell`, async () => {
				const res = await client.textToImage({
					model: "black-forest-labs/FLUX.1-schnell",
					provider: "fal-ai",
					inputs:
						"Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth.",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			/// Skipped: we need a way to pass the base model ID
			it(`textToImage - SD LoRAs`, async () => {
				const res = await client.textToImage({
					model: "nerijs/pixel-art-xl",
					provider: "fal-ai",
					inputs: "pixel, a cute corgi",
					parameters: {
						negative_prompt: "3d render, realistic",
					},
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it(`textToImage - Flux LoRAs`, async () => {
				const res = await client.textToImage({
					model: "openfree/flux-chatgpt-ghibli-lora",
					provider: "fal-ai",
					inputs:
						"Ghibli style sky whale transport ship, its metallic skin adorned with traditional Japanese patterns, gliding through cotton candy clouds at sunrise. Small floating gardens hang from its sides, where workers in futuristic kimonos tend to glowing plants. Rainbow auroras shimmer in the background. [trigger]",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it(`automaticSpeechRecognition - openai/whisper-large-v3`, async () => {
				const res = await client.automaticSpeechRecognition({
					model: "openai/whisper-large-v3",
					provider: "fal-ai",
					data: new Blob([readTestFile("sample2.wav")], { type: "audio/x-wav" }),
				});
				expect(res).toMatchObject({
					text: " he has grave doubts whether sir frederick leighton's work is really greek after all and can discover in it but little of rocky ithaca",
				});
			});
			it("imageToVideo - fal-ai", async () => {
				const res = await client.imageToVideo({
					model: "fal-ai/ltxv-13b-098-distilled/image-to-video",
					provider: "fal-ai",
					inputs: new Blob([readTestFile("cats.png")], { type: "image/png" }),
					parameters: {
						prompt: "The cats are jumping around in a playful manner",
					},
				});
				expect(res).toBeInstanceOf(Blob);
			});
		},
		TIMEOUT,
	);

	describe.concurrent(
		"Replicate",
		() => {
			const client = new InferenceClient(env.HF_REPLICATE_KEY ?? "dummy");

			it("textToImage canonical - black-forest-labs/FLUX.1-schnell", async () => {
				const res = await client.textToImage({
					model: "black-forest-labs/FLUX.1-schnell",
					provider: "replicate",
					inputs: "black forest gateau cake spelling out the words FLUX SCHNELL, tasty, food photography, dynamic shot",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage canonical - black-forest-labs/FLUX.1-dev", async () => {
				const res = await client.textToImage({
					model: "black-forest-labs/FLUX.1-dev",
					provider: "replicate",
					inputs:
						"A tiny laboratory deep in the Black Forest where squirrels in lab coats experiment with mixing chocolate and pine cones",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			// Runs black-forest-labs/flux-dev-lora under the hood
			// with fofr/flux-80s-cyberpunk as the LoRA weights
			it("textToImage - all Flux LoRAs", async () => {
				const res = await client.textToImage({
					model: "fofr/flux-80s-cyberpunk",
					provider: "replicate",
					inputs: "style of 80s cyberpunk, a portrait photo",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage canonical - stabilityai/stable-diffusion-3.5-large-turbo", async () => {
				const res = await client.textToImage({
					model: "stabilityai/stable-diffusion-3.5-large-turbo",
					provider: "replicate",
					inputs: "A confused rubber duck wearing a tiny wizard hat trying to cast spells with a banana wand",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage versioned - ByteDance/SDXL-Lightning", async () => {
				const res = await client.textToImage({
					model: "ByteDance/SDXL-Lightning",
					provider: "replicate",
					inputs: "A grumpy storm cloud wearing sunglasses and throwing tiny lightning bolts like confetti",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage versioned - ByteDance/Hyper-SD", async () => {
				const res = await client.textToImage({
					model: "ByteDance/Hyper-SD",
					provider: "replicate",
					inputs: "A group of dancing bytes wearing tiny party hats doing the macarena in cyberspace",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage versioned - playgroundai/playground-v2.5-1024px-aesthetic", async () => {
				const res = await client.textToImage({
					model: "playgroundai/playground-v2.5-1024px-aesthetic",
					provider: "replicate",
					inputs: "A playground where slides turn into rainbows and swings launch kids into cotton candy clouds",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage versioned - stabilityai/stable-diffusion-xl-base-1.0", async () => {
				const res = await client.textToImage({
					model: "stabilityai/stable-diffusion-xl-base-1.0",
					provider: "replicate",
					inputs: "An octopus juggling watermelons underwater while wearing scuba gear",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it.skip("textToSpeech versioned", async () => {
				const res = await client.textToSpeech({
					model: "SWivid/F5-TTS",
					provider: "replicate",
					inputs: "Hello, how are you?",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it.skip("textToSpeech OuteTTS -  usually Cold", async () => {
				const res = await client.textToSpeech({
					model: "OuteAI/OuteTTS-0.3-500M",
					provider: "replicate",
					inputs: "OuteTTS is a frontier TTS model for its size of 1 Billion parameters",
				});

				expect(res).toBeInstanceOf(Blob);
			});

			it("textToSpeech Kokoro", async () => {
				const res = await client.textToSpeech({
					model: "hexgrad/Kokoro-82M",
					provider: "replicate",
					inputs: "Kokoro is a frontier TTS model for its size of 1 Billion parameters",
				});

				expect(res).toBeInstanceOf(Blob);
			});

			it("imageToImage - FLUX Kontext Dev", async () => {
				const res = await client.imageToImage({
					model: "black-forest-labs/flux-kontext-dev",
					provider: "replicate",
					inputs: new Blob([readTestFile("stormtrooper_depth.png")], { type: "image/png" }),
					parameters: {
						prompt: "Change the stormtrooper armor to golden color while keeping the same pose and helmet design",
					},
				});
				expect(res).toBeInstanceOf(Blob);
			});
		},
		TIMEOUT,
	);
	describe.concurrent(
		"Together",
		() => {
			const client = new InferenceClient(env.HF_TOGETHER_KEY ?? "dummy");

			it("textToImage", async () => {
				const res = await client.textToImage({
					model: "stabilityai/stable-diffusion-xl-base-1.0",
					provider: "together",
					inputs: "award winning high resolution photo of a giant tortoise",
				});
				expect(res).toBeInstanceOf(Blob);
			});
		},
		TIMEOUT,
	);

	describe.concurrent(
		"Scaleway",
		() => {
			const client = new InferenceClient(env.HF_SCALEWAY_KEY ?? "dummy");

			HARDCODED_MODEL_INFERENCE_MAPPING.scaleway = {
				"meta-llama/Llama-3.1-8B-Instruct": {
					provider: "scaleway",
					hfModelId: "meta-llama/Llama-3.1-8B-Instruct",
					providerId: "llama-3.1-8b-instruct",
					status: "live",
					task: "conversational",
				},
				"BAAI/bge-multilingual-gemma2": {
					provider: "scaleway",
					hfModelId: "BAAI/bge-multilingual-gemma2",
					providerId: "bge-multilingual-gemma2",
					task: "feature-extraction",
					status: "live",
				},
			};

			it("featureExtraction", async () => {
				const res = await client.featureExtraction({
					model: "BAAI/bge-multilingual-gemma2",
					provider: "scaleway",
					inputs: "That is a happy person",
				});

				expect(res).toBeInstanceOf(Array);
				expect(res[0]).toEqual(expect.arrayContaining([expect.any(Number)]));
			});
		},
		TIMEOUT,
	);

	describe.concurrent(
		"DeepInfra",
		() => {
			const client = new InferenceClient(env.DEEPINFRA_API_KEY ?? env.HF_DEEPINFRA_KEY ?? "dummy");

			const ASR_HF_MODEL = "nvidia/nemotron-3.5-asr-streaming-0.6b";
			const ASR_PROVIDER_ID = "nvidia/Nemotron-3.5-ASR-Streaming-Multilingual-0.6b";

			const TTS_HF_MODEL = "hexgrad/Kokoro-82M";
			const TTS_PROVIDER_ID = "hexgrad/Kokoro-82M";

			const FE_HF_MODEL = "Qwen/Qwen3-Embedding-0.6B";
			const FE_PROVIDER_ID = "Qwen/Qwen3-Embedding-0.6B";

			const T2I_HF_MODEL = "stabilityai/sdxl-turbo";
			const T2I_PROVIDER_ID = "stabilityai/sdxl-turbo";

			const setAsrMapping = () => {
				HARDCODED_MODEL_INFERENCE_MAPPING["deepinfra"] = {
					[ASR_HF_MODEL]: {
						provider: "deepinfra",
						hfModelId: ASR_HF_MODEL,
						providerId: ASR_PROVIDER_ID,
						status: "live",
						task: "automatic-speech-recognition",
					},
				};
			};

			const setTtsMapping = () => {
				HARDCODED_MODEL_INFERENCE_MAPPING["deepinfra"] = {
					[TTS_HF_MODEL]: {
						provider: "deepinfra",
						hfModelId: TTS_HF_MODEL,
						providerId: TTS_PROVIDER_ID,
						status: "live",
						task: "text-to-speech",
					},
				};
			};

			const setFeatureExtractionMapping = () => {
				HARDCODED_MODEL_INFERENCE_MAPPING["deepinfra"] = {
					[FE_HF_MODEL]: {
						provider: "deepinfra",
						hfModelId: FE_HF_MODEL,
						providerId: FE_PROVIDER_ID,
						status: "live",
						task: "feature-extraction",
					},
				};
			};

			const setTextToImageMapping = () => {
				HARDCODED_MODEL_INFERENCE_MAPPING["deepinfra"] = {
					[T2I_HF_MODEL]: {
						provider: "deepinfra",
						hfModelId: T2I_HF_MODEL,
						providerId: T2I_PROVIDER_ID,
						status: "live",
						task: "text-to-image",
					},
				};
			};

			it("automaticSpeechRecognition", async () => {
				setAsrMapping();
				const res = await client.automaticSpeechRecognition({
					model: ASR_HF_MODEL,
					provider: "deepinfra",
					data: new Blob([readTestFile("sample2.wav")], { type: "audio/x-wav" }),
				});
				expect(typeof res.text).toBe("string");
				expect(res.text.length).toBeGreaterThan(0);
			});

			it("textToSpeech", async () => {
				setTtsMapping();
				const res = await client.textToSpeech({
					model: TTS_HF_MODEL,
					provider: "deepinfra",
					inputs: "Hello from DeepInfra text to speech.",
					parameters: { voice: "af_bella" },
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("featureExtraction", async () => {
				setFeatureExtractionMapping();
				const res = await client.featureExtraction({
					model: FE_HF_MODEL,
					provider: "deepinfra",
					inputs: "Hello from DeepInfra feature extraction.",
				});
				expect(Array.isArray(res)).toBe(true);
				expect(res.length).toBeGreaterThan(0);
			});

			it("textToImage", async () => {
				setTextToImageMapping();
				const res = await client.textToImage({
					model: T2I_HF_MODEL,
					provider: "deepinfra",
					inputs: "An astronaut riding a horse on the moon.",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it("textToImage with url output", async () => {
				setTextToImageMapping();
				const res = await client.textToImage({
					model: T2I_HF_MODEL,
					provider: "deepinfra",
					inputs: "An astronaut riding a horse on the moon.",
					outputType: "url",
				});
				expect(typeof res).toBe("string");
				expect(res).toMatch(/^https?:\/\//);
			});
		},
		TIMEOUT,
	);

	describe.concurrent(
		"Nscale",
		() => {
			const client = new InferenceClient(env.HF_NSCALE_KEY ?? "dummy");

			HARDCODED_MODEL_INFERENCE_MAPPING["nscale"] = {
				"meta-llama/Llama-3.1-8B-Instruct": {
					provider: "nscale",
					hfModelId: "meta-llama/Llama-3.1-8B-Instruct",
					providerId: "nscale",
					status: "live",
					task: "conversational",
				},
				"black-forest-labs/FLUX.1-schnell": {
					provider: "nscale",
					hfModelId: "black-forest-labs/FLUX.1-schnell",
					providerId: "flux-schnell",
					status: "live",
					task: "text-to-image",
				},
			};

			it("textToImage", async () => {
				const res = await client.textToImage({
					model: "black-forest-labs/FLUX.1-schnell",
					provider: "nscale",
					inputs: "An astronaut riding a horse",
				});
				expect(res).toBeInstanceOf(Blob);
			});
		},
		TIMEOUT,
	);

	describe.concurrent(
		"ZAI",
		() => {
			const client = new InferenceClient(env.HF_ZAI_KEY ?? "dummy");

			HARDCODED_MODEL_INFERENCE_MAPPING["zai-org"] = {
				"zai-org/glm-image": {
					provider: "zai-org",
					hfModelId: "zai-org/glm-image",
					providerId: "glm-image",
					status: "live",
					task: "text-to-image",
				},
			};

			it("textToImage", async () => {
				const res = await client.textToImage({
					model: "zai-org/glm-image",
					provider: "zai-org",
					inputs:
						"A cute little kitten sitting on a sunny windowsill, with the background of blue sky and white clouds.",
				});
				expect(res).toBeInstanceOf(Blob);
			});
		},
		TIMEOUT,
	);

	describe.concurrent(
		"Wavespeed AI",
		() => {
			const client = new InferenceClient(env.HF_WAVESPEED_KEY ?? "dummy");

			HARDCODED_MODEL_INFERENCE_MAPPING["wavespeed"] = {
				"Qwen/Qwen-Image-Edit-2509": {
					provider: "wavespeed",
					hfModelId: "Qwen/Qwen-Image-Edit-2509",
					providerId: "wavespeed-ai/qwen-image/edit-plus-lora",
					status: "live",
					task: "image-to-image",
				},
				"dx8152/Qwen-Edit-2509-Multiple-angles": {
					provider: "wavespeed",
					hfModelId: "dx8152/Qwen-Edit-2509-Multiple-angles",
					providerId: "wavespeed-ai/qwen-image/edit-plus-lora",
					status: "live",
					task: "image-to-image",
					adapter: "lora",
					adapterWeightsPath: "镜头转换.safetensors",
				},
				"black-forest-labs/FLUX.1-schnell": {
					provider: "wavespeed",
					hfModelId: "black-forest-labs/FLUX.1-schnell",
					providerId: "wavespeed-ai/flux-schnell",
					status: "live",
					task: "text-to-image",
				},
				"Wan-AI/Wan2.1-T2V-14B": {
					provider: "wavespeed",
					hfModelId: "wavespeed-ai/wan-2.1/t2v-480p",
					providerId: "wavespeed-ai/wan-2.1/t2v-480p",
					status: "live",
					task: "text-to-video",
				},
				"HiDream-ai/HiDream-E1-Full": {
					provider: "wavespeed",
					hfModelId: "wavespeed-ai/hidream-e1-full",
					providerId: "wavespeed-ai/hidream-e1-full",
					status: "live",
					task: "image-to-image",
				},
				"openfree/flux-chatgpt-ghibli-lora": {
					provider: "wavespeed",
					hfModelId: "openfree/flux-chatgpt-ghibli-lora",
					providerId: "wavespeed-ai/flux-dev-lora",
					status: "live",
					task: "text-to-image",
					adapter: "lora",
					adapterWeightsPath: "flux-chatgpt-ghibli-lora.safetensors",
				},
				"linoyts/yarn_art_Flux_LoRA": {
					provider: "wavespeed",
					hfModelId: "linoyts/yarn_art_Flux_LoRA",
					providerId: "wavespeed-ai/flux-dev-lora-ultra-fast",
					status: "live",
					task: "text-to-image",
					adapter: "lora",
					adapterWeightsPath: "pytorch_lora_weights.safetensors",
				},
				"Wan-AI/Wan2.1-I2V-14B-480P": {
					provider: "wavespeed",
					hfModelId: "Wan-AI/Wan2.1-I2V-14B-480P",
					providerId: "wavespeed-ai/wan-2.1/i2v-480p",
					status: "live",
					task: "image-to-video",
				},
			};
			it(`textToImage - black-forest-labs/FLUX.1-schnell`, async () => {
				const res = await client.textToImage({
					model: "black-forest-labs/FLUX.1-schnell",
					provider: "wavespeed",
					inputs:
						"Cute boy with a hat, exploring nature, holding a telescope, backpack, surrounded by flowers, cartoon style, vibrant colors.",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it(`textToImage - openfree/flux-chatgpt-ghibli-lora`, async () => {
				const res = await client.textToImage({
					model: "openfree/flux-chatgpt-ghibli-lora",
					provider: "wavespeed",
					inputs:
						"Cute boy with a hat, exploring nature, holding a telescope, backpack, surrounded by flowers, cartoon style, vibrant colors.",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it(`textToImage - linoyts/yarn_art_Flux_LoRA`, async () => {
				const res = await client.textToImage({
					model: "linoyts/yarn_art_Flux_LoRA",
					provider: "wavespeed",
					inputs:
						"Cute boy with a hat, exploring nature, holding a telescope, backpack, surrounded by flowers, cartoon style, vibrant colors.",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it(`textToVideo - Wan-AI/Wan2.1-T2V-14B`, async () => {
				const res = await client.textToVideo({
					model: "Wan-AI/Wan2.1-T2V-14B",
					provider: "wavespeed",
					inputs:
						"A cool street dancer, wearing a baggy hoodie and hip-hop pants, dancing in front of a graffiti wall, night neon background, quick camera cuts, urban trends.",
					parameters: {
						guidance_scale: 5,
						num_inference_steps: 30,
						seed: -1,
					},
					duration: 5,
					enable_safety_checker: true,
					flow_shift: 2.9,
					size: "480*832",
				});
				expect(res).toBeInstanceOf(Blob);
			});

			it(`imageToImage - HiDream-ai/HiDream-E1-Full`, async () => {
				const res = await client.imageToImage({
					model: "HiDream-ai/HiDream-E1-Full",
					provider: "wavespeed",
					inputs: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
					parameters: {
						prompt: "The leopard chases its prey",
						guidance_scale: 5,
						num_inference_steps: 30,
						seed: -1,
					},
				});
				expect(res).toBeInstanceOf(Blob);
			});
			it(`imageToVideo - Wan-AI/Wan2.1-I2V-14B-480P`, async () => {
				const res = await client.imageToVideo({
					model: "Wan-AI/Wan2.1-I2V-14B-480P",
					provider: "wavespeed",
					inputs: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
					parameters: {
						prompt: "The leopard chases its prey",
						guidance_scale: 5,
						num_inference_steps: 29,
						seed: -1,
					},
				});
				expect(res).toBeInstanceOf(Blob);
			});
			it(`imageToImage - Qwen/Qwen-Image-Edit-2509`, async () => {
				const res = await client.imageToImage({
					model: "Qwen/Qwen-Image-Edit-2509",
					provider: "wavespeed",
					inputs: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
					parameters: {
						prompt: "Turn the animal's head left",
					},
				});
				expect(res).toBeInstanceOf(Blob);
			});
			it(`imageToImage - dx8152/Qwen-Edit-2509-Multiple-angles`, async () => {
				const res = await client.imageToImage({
					model: "dx8152/Qwen-Edit-2509-Multiple-angles",
					provider: "wavespeed",
					inputs: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
					parameters: {
						prompt: "Turn the animal's head left",
						images: [
							new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
							new Blob([readTestFile("bird_canny.png")], { type: "image/png" }),
						],
					},
				});
				expect(res).toBeInstanceOf(Blob);
			});
		},
		TIMEOUT,
	);
});
