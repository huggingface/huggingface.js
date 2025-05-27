export * from "./src";

// TODO: remove this before merging
// Run with: npx ts-node index.ts
import { getHardwareRequirements } from "./src/lib/hardware-requirements";
(async () => {
  const models = [
    "hexgrad/Kokoro-82M",
    "microsoft/OmniParser-v2.0",
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
    "NousResearch/DeepHermes-3-Llama-3-8B-Preview",
    "unsloth/DeepSeek-R1-Distill-Llama-8B-unsloth-bnb-4bit",
  ];

  for (const name of models) {
    const mem = await getHardwareRequirements({ name });
    console.log('mem', JSON.stringify(mem, null, 2));
  }
})();
