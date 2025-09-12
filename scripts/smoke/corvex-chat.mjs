import { InferenceClient } from "../../packages/inference/dist/esm/index.js";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  try {
    const method = init.method || "GET";
    const headers = init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};
    let bodyPreview = "";

    if (typeof init.body === "string") {
      bodyPreview = init.body;
    } else if (init.body && typeof init.body.getReader === "function") {
      // It's a stream; skip printing to avoid consuming it
      bodyPreview = "[stream]";
    } else if (init.body instanceof Buffer) {
      bodyPreview = `[Buffer ${init.body.length} bytes]`;
    }

    console.error("\n[FETCH] ", method, url);
    console.error("[HEADERS]", headers);
    if (bodyPreview) console.error("[BODY]   ", bodyPreview);

    const res = await originalFetch(url, init);
    const txt = await res.clone().text();

    console.error("[RESPONSE]", res.status, res.statusText);
    console.error("[RES HDRS]", Object.fromEntries(res.headers.entries()));
    console.error("[RES BODY]", txt.slice(0, 4000)); // avoid flooding
    return res;
  } catch (e) {
    console.error("[FETCH ERROR]", e);
    throw e;
  }
};

const VALID = process.env.CORVEX_API_KEY || "replace_me";
const INVALID = "invalid_key";

async function run(apiKey, label) {
  const client = new InferenceClient();
  try {
    const out = await client.chatCompletion({
      provider: "corvex",
      task: "conversational",
      apiKey,
      model: "tinyllama",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is the capital of France?" },
      ],
      max_tokens: 100,
      temperature: 0.7,
      stream: false,
    });
    console.log(`[${label}] OK\n`, JSON.stringify(out, null, 2));
  } catch (e) {
    console.error(`[${label}] ERROR`, e?.status || "", e?.message || e);
  }
}

// Optional: point at raw IP like in your curl
// export CORVEX_API_BASE_URL=http://34.48.240.55
if (process.env.CORVEX_API_BASE_URL) {
  console.log("Using CORVEX_API_BASE_URL =", process.env.CORVEX_API_BASE_URL);
}

await run(VALID, "VALID");
await run(INVALID, "INVALID");
