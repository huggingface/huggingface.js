/**
 * Script for generating llm.ts
 * The source data is taken from llama.cpp
 */

import { gguf } from "../../gguf/src/gguf";
import { appendFileSync, writeFileSync } from "node:fs";

const RE_SPECIAL_TOKEN = /<[|_A-Za-z0-9]+>|\[[A-Z]+\]|<\uFF5C[\u2581A-Za-z]+\uFF5C>/g;
const MAX_NUMBER_OF_TAGS_PER_MODEL = 5;
const N_WORKERS = 16;

interface OutputItem {
	model: string;
	gguf: string;
	ollama: {
		template: string;
		tokens: string[];
		params?: any;
	};
};

const getSpecialTokens = (tmpl: string): string[] => {
  const matched = tmpl.match(RE_SPECIAL_TOKEN);
  const tokens = Array.from(matched || []);
  return Array.from(new Set(tokens)); // deduplicate
};

(async () => {
  writeFileSync('ollama_tmp.jsonl', ''); // clear the file

  const models: string[] = [];
  const output: OutputItem[] = [];

  const html = await (await fetch('https://ollama.com/library')).text();
  const matched = html.match(/href="\/library\/[^"]+/g);
	if (!matched) {
		throw new Error('cannot find any model url');
	}
  for (let i = 0; i < matched.length; i++) {
    models.push(matched[i].replace('href="/', ''));
  }
  console.log({models});

  //////// Get tags ////////

  let nDoing = 0;
  let nAll = models.length;
  const modelsWithTag: string[] = [];
  const workerGetTags = async () => {
    while (true) {
      const model = models.shift();
      if (!model) return;
      nDoing++;
      console.log(`Getting tags ${nDoing} / ${nAll}`);
      const html = await (await fetch(`https://ollama.com/${model}`)).text();
      const matched = html.match(/href="\/library\/[^"]+/g);
			if (!matched) {
				throw new Error('cannot find any tag url');
			}
      for (let i = 0; i < matched.length && i < MAX_NUMBER_OF_TAGS_PER_MODEL; i++) {
        const midAndTag: string = matched[i].replace('href="/', '');
        if (midAndTag.match(/:/) && !midAndTag.match(/\/blobs/)) {
          modelsWithTag.push(midAndTag);
        }
      }
    }
  };
  await Promise.all(Array(N_WORKERS).fill(null).map(() => workerGetTags()));
  console.log({modelsWithTag});

  //////// Get template ////////

  nDoing = 0;
  nAll = modelsWithTag.length;
  let seenTemplate = new Set();
  const workerGetTemplate = async () => {
    while (true) {
      const modelWithTag = modelsWithTag.shift();
      if (!modelWithTag) return;

      nDoing++;
      const [model, tag] = modelWithTag.split(':');
      console.log(`Fetch template ${nDoing} / ${nAll} | model=${model} tag=${tag}`);
      const getBlobUrl = (digest) => `https://registry.ollama.com/v2/${model}/blobs/${digest}`;
      const manifest = await (await fetch(`https://registry.ollama.com/v2/${model}/manifests/${tag}`)).json();
      if (!manifest.layers) {
        console.log(' --> [X] No layers');
        continue;
      }
      const modelUrl = getBlobUrl(manifest.layers.find(l => l.mediaType.match(/\.model/)).digest);
      const ggufData = await gguf(modelUrl);
      const { metadata } = ggufData;
      const ggufTmpl = metadata['tokenizer.chat_template'];
      if (ggufTmpl) {
        if (seenTemplate.has(ggufTmpl)) {
          console.log(' --> Already seen this GGUF template, skip...');
          continue;
        }
        seenTemplate.add(ggufTmpl);
        console.log(' --> GGUF chat template OK');
        const tmplBlob = manifest.layers.find(l => l.mediaType.match(/\.template/));
        if (!tmplBlob) continue;
        const ollamaTmplUrl = getBlobUrl(tmplBlob.digest);
        if (!ollamaTmplUrl) {
          console.log(' --> [X] No ollama template');
          continue;
        }
        const ollamaTmpl = await (await fetch(ollamaTmplUrl)).text();
        console.log(' --> All OK');
        const record: OutputItem = {
          model: modelWithTag,
          gguf: ggufTmpl,
          ollama: {
            template: ollamaTmpl,
            tokens: getSpecialTokens(ggufTmpl),
          }
        };
        // get params
        const ollamaParamsBlob = manifest.layers.find(l => l.mediaType.match(/\.params/));
        const ollamaParamsUrl = ollamaParamsBlob ? getBlobUrl(ollamaParamsBlob.digest) : null;
        if (ollamaParamsUrl) {
          console.log(' --> Got params');
          record.ollama.params = await (await fetch(ollamaParamsUrl)).json();
        }
        output.push(record);
        appendFileSync('ollama_tmp.jsonl', JSON.stringify(record)+'\n');
      } else {
        console.log(' --> [X] No GGUF template');
        continue;
      }
      //console.log({modelUrl, ggufData});
      //break;
    }
  };

  await Promise.all(Array(N_WORKERS).fill(null).map(() => workerGetTemplate()));

  console.log('DONE');
  output.sort((a, b) => a.model.localeCompare(b.model));

  writeFileSync('./src/chat-template-automap.ts', `
// This file is auto generated, please do not modify manually
// To update it, run "pnpm run build:automap"

export interface OllamaChatTemplateMapEntry {
\tmodel:   string;
\tgguf:    string;
\tollama:  {
\t\ttemplate: string;
\t\ttokens:   string[];
\t\tparams?:  unknown;
\t};
}

export const OLLAMA_CHAT_TEMPLATE_MAPPING: OllamaChatTemplateMapEntry[] = ${JSON.stringify(output, null, '\t')};
  `.trim());
})();
