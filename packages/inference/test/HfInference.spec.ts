import { expect, it, describe, assert } from "vitest";

import type { TextGenerationStreamOutput } from "../src";
import { HfInference } from "../src";
import "./vcr";
import { readTestFile } from "./test-files";

const TIMEOUT = 60000 * 3;

if (!process.env.HF_ACCESS_TOKEN) {
	console.warn("Set HF_ACCESS_TOKEN in the env to run the tests for better rate limits");
}

describe.concurrent(
	"HfInference",
	() => {
		// Individual tests can be ran without providing an api key, however running all tests without an api key will result in rate limiting error.
		const hf = new HfInference(process.env.HF_ACCESS_TOKEN);

		it("throws error if model does not exist", () => {
			expect(
				hf.fillMask({
					model: "this-model-does-not-exist-123",
					inputs: "[MASK] world!",
				})
			).rejects.toThrowError("Model this-model-does-not-exist-123 does not exist");
		});

		it("fillMask", async () => {
			expect(
				await hf.fillMask({
					model: "bert-base-uncased",
					inputs: "[MASK] world!",
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
				await hf.summarization({
					model: "facebook/bart-large-cnn",
					inputs:
						"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.",
					parameters: {
						max_length: 100,
					},
				})
			).toEqual({
				summary_text:
					"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world.",
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
				})
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
						query: "How many stars does the transformers repository have?",
						table: {
							Repository: ["Transformers", "Datasets", "Tokenizers"],
							Stars: ["36542", "4512", "3934"],
							Contributors: ["651", "77", "34"],
							"Programming language": ["Python", "Python", "Rust, Python and NodeJS"],
						},
					},
				})
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
				})
			).toMatchObject({
				answer: "us-001",
				score: expect.any(Number),
				// not sure what start/end refers to in this case
				start: expect.any(Number),
				end: expect.any(Number),
			});
		});

		it("documentQuestionAnswering with non-array output", async () => {
			expect(
				await hf.documentQuestionAnswering({
					model: "naver-clova-ix/donut-base-finetuned-docvqa",
					inputs: {
						question: "Invoice number?",
						image: new Blob([readTestFile("invoice.png")], { type: "image/png" }),
					},
				})
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
				})
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
				await hf.textGeneration({
					model: "gpt2",
					inputs: "The answer to the universe is",
				})
			).toMatchObject({
				generated_text: expect.any(String),
			});
		});

		it("textGeneration - google/flan-t5-xxl", async () => {
			expect(
				await hf.textGeneration({
					model: "google/flan-t5-xxl",
					inputs: "The answer to the universe is",
				})
			).toMatchObject({
				generated_text: expect.any(String),
			});
		});

		it("textGenerationStream - google/flan-t5-xxl", async () => {
			const phrase = "one two three four";
			const response = hf.textGenerationStream({
				model: "google/flan-t5-xxl",
				inputs: `repeat "${phrase}"`,
			});

			const makeExpectedReturn = (tokenText: string, fullPhrase: string): TextGenerationStreamOutput => {
				const eot = tokenText === "</s>";
				return {
					details: null,
					token: {
						id: expect.any(Number),
						logprob: expect.any(Number),
						text: expect.stringContaining(tokenText),
						special: eot,
					},
					generated_text: eot ? fullPhrase : null,
				};
			};

			const expectedTokens = phrase.split(" ");
			// eot token
			expectedTokens.push("</s>");

			for await (const ret of response) {
				const expectedToken = expectedTokens.shift();
				assert(expectedToken);
				expect(ret).toMatchObject(makeExpectedReturn(expectedToken, phrase));
			}
		});

		it("tokenClassification", async () => {
			expect(
				await hf.tokenClassification({
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
				await hf.translation({
					model: "t5-base",
					inputs: "My name is Wolfgang and I live in Berlin",
				})
			).toMatchObject({
				translation_text: "Mein Name ist Wolfgang und ich lebe in Berlin",
			});
		});
		it("zeroShotClassification", async () => {
			expect.extend({
				closeTo(received, expected, precision) {
					const { isNot } = this;
					let pass = false;
					let expectedDiff = 0;
					let receivedDiff = 0;

					if (received === Infinity && expected === Infinity) {
						pass = true;
					} else if (received === -Infinity && expected === -Infinity) {
						pass = true;
					} else {
						expectedDiff = 10 ** -precision / 2;
						receivedDiff = Math.abs(expected - received);
						pass = receivedDiff < expectedDiff;
					}

					return {
						pass,
						message: () =>
							isNot
								? `expected ${received} to not be close to ${expected}, received difference is ${receivedDiff}, but expected ${expectedDiff}`
								: `expected ${received} to be close to ${expected}, received difference is ${receivedDiff}, but expected ${expectedDiff}`,
					};
				},
			});
			expect(
				await hf.zeroShotClassification({
					model: "facebook/bart-large-mnli",
					inputs: [
						"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
					],
					parameters: { candidate_labels: ["refund", "legal", "faq"] },
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
		it("conversational", async () => {
			expect(
				await hf.conversational({
					model: "microsoft/DialoGPT-large",
					inputs: {
						past_user_inputs: ["Which movie is the best ?"],
						generated_responses: ["It is Die Hard for sure."],
						text: "Can you explain why ?",
					},
				})
			).toMatchObject({
				generated_text: "It's the best movie ever.",
				conversation: {
					past_user_inputs: ["Which movie is the best ?", "Can you explain why ?"],
					generated_responses: ["It is Die Hard for sure.", "It's the best movie ever."],
				},
				warnings: ["Setting `pad_token_id` to `eos_token_id`:50256 for open-end generation."],
			});
		});
		it("SentenceSimilarity", async () => {
			expect(
				await hf.sentenceSimilarity({
					model: "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
					inputs: {
						source_sentence: "That is a happy person",
						sentences: ["That is a happy dog", "That is a very happy person", "Today is a sunny day"],
					},
				})
			).toEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
		});
		it("FeatureExtraction", async () => {
			const response = await hf.featureExtraction({
				model: "sentence-transformers/distilbert-base-nli-mean-tokens",
				inputs: "That is a happy person",
			});
			expect(response).toEqual(expect.arrayContaining([expect.any(Number)]));
		});
		it("automaticSpeechRecognition", async () => {
			expect(
				await hf.automaticSpeechRecognition({
					model: "facebook/wav2vec2-large-960h-lv60-self",
					data: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
				})
			).toMatchObject({
				text: "GOING ALONG SLUSHY COUNTRY ROADS AND SPEAKING TO DAMP AUDIENCES IN DRAUGHTY SCHOOLROOMS DAY AFTER DAY FOR A FORTNIGHT HE'LL HAVE TO PUT IN AN APPEARANCE AT SOME PLACE OF WORSHIP ON SUNDAY MORNING AND HE CAN COME TO US IMMEDIATELY AFTERWARDS",
			});
		});
		it("audioClassification", async () => {
			expect(
				await hf.audioClassification({
					model: "superb/hubert-large-superb-er",
					data: new Blob([readTestFile("sample1.flac")], { type: "audio/flac" }),
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
		it("textToSpeech", async () => {
			expect(
				await hf.textToSpeech({
					model: "espnet/kan-bayashi_ljspeech_vits",
					inputs: "hello there!",
				})
			).toBeInstanceOf(Blob);
		});
		it("imageClassification", async () => {
			expect(
				await hf.imageClassification({
					data: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
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
		it("objectDetection", async () => {
			expect(
				await hf.imageClassification({
					data: new Blob([readTestFile("cats.png")], { type: "image/png" }),
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
				await hf.imageClassification({
					data: new Blob([readTestFile("cats.png")], { type: "image/png" }),
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
		it("textToImage", async () => {
			const res = await hf.textToImage({
				inputs: "award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]",
				model: "stabilityai/stable-diffusion-2",
			});
			expect(res).toBeInstanceOf(Blob);
		});

		it("textToImage with parameters", async () => {
			const width = 512;
			const height = 128;
			const num_inference_steps = 10;

			const res = await hf.textToImage({
				inputs: "award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]",
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
		it("imageToText", async () => {
			expect(
				await hf.imageToText({
					data: new Blob([readTestFile("cheetah.png")], { type: "image/png" }),
					model: "nlpconnect/vit-gpt2-image-captioning",
				})
			).toEqual({
				generated_text: "a large brown and white giraffe standing in a field ",
			});
		});
		it("request - google/flan-t5-xxl", async () => {
			expect(
				await hf.request({
					model: "google/flan-t5-xxl",
					inputs: "one plus two equals",
				})
			).toMatchObject([
				{
					generated_text: expect.any(String),
				},
			]);
		});

		it("tabularRegression", async () => {
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
				})
			).toMatchObject([270.5473526976245, 313.6843425638086, 328.3727133404402]);
		});

		it("endpoint - makes request to specified endpoint", async () => {
			const ep = hf.endpoint("https://api-inference.huggingface.co/models/google/flan-t5-xxl");
			const { generated_text } = await ep.textGeneration({
				inputs: "one plus two equals",
			});
			expect(generated_text).toEqual("three");
		});
	},
	TIMEOUT
);
