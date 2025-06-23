<p align="center">
  <br/>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-light.svg">
    <img alt="huggingface javascript library logo" src="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-light.svg" width="376" height="59" style="max-width: 100%;">
  </picture>
  <br/>
  <br/>
</p>

# Hugging Face JS Libraries: Supercharge Your JavaScript AI Applications!

Welcome to the official Hugging Face JavaScript libraries! This is your one-stop shop for seamlessly integrating the power of Hugging Face into your JavaScript projects. Whether you're building web applications, Node.js backends, or exploring AI in new frontiers like Deno and Bun, our libraries provide the tools you need.

**What can you do with these libraries?**

*   **Run Inference with Ease:** Access over 100,000 machine learning models for a vast array of tasks. From text generation and image classification to audio processing and beyond, tap into cutting-edge AI with just a few lines of code.
*   **Interact with the Hugging Face Hub:** Programmatically manage your models, datasets, and Spaces. Create repositories, upload files, and stay connected to the vibrant Hugging Face ecosystem.
*   **Leverage Specialized Tools:** Work with specific file formats like GGUF and DDUF, utilize Jinja templating for chat applications, and much more.

**Why choose Hugging Face JS?**

*   **TypeScript First:** Enjoy the benefits of static typing for robust and maintainable code.
*   **Modern JavaScript:** Designed for modern environments (Node.js >= 18, Deno, Bun, and contemporary browsers) to minimize dependencies and maximize performance.
*   **Community Driven:** We're constantly evolving! Your feedback and contributions are invaluable in shaping the future of these libraries.

**Get a taste of what's possible:**

```ts
// Programmatically interact with the Hub
import { createRepo, uploadFile } from "@huggingface/hub";

await createRepo({
  repo: { type: "model", name: "my-user/nlp-model" },
  accessToken: HF_TOKEN // Your Hugging Face access token
});

await uploadFile({
  repo: "my-user/nlp-model",
  accessToken: HF_TOKEN,
  file: {
    path: "pytorch_model.bin",
    content: new Blob(["mock model data"]) // Example with a Blob
  }
});

// Run AI models for various tasks
import { InferenceClient } from "@huggingface/inference";

const inference = new InferenceClient(HF_TOKEN); // Your Hugging Face Token

// Example: Chat with an AI model
const { choices } = await inference.chatCompletion({
  model: "meta-llama/Llama-3.1-8B-Instruct", // Choose your model
  provider: "sambanova", // Optionally, specify a provider like Sambanova, Together AI, etc.
  messages: [{ role: "user", content: "Hello, how are you?" }],
  max_tokens: 512, // Control the length of the response
});
console.log(choices[0].message.content); // Display the AI's message

// Example: Generate an image from text
const imageBlob = await inference.textToImage({
  model: "black-forest-labs/FLUX.1-dev", // Choose your image generation model
  provider: "replicate", // Optionally, specify a provider
  inputs: "A vibrant painting of a futuristic city",
});
// imageBlob now contains the image data (e.g., display it on a webpage or save it)

// ...and explore many other AI tasks!
```

## 🚀 Quick Start: Your First AI Adventure in 5 Minutes! 🌟

Excited to see Hugging Face JS in action? Let's get you started with a super simple text generation example. This will take just a few minutes!

**Goal:** Ask an AI to complete a sentence for you.

**Environment:** We'll use Node.js for this example. Make sure you have it installed!

**Steps:**

1.  **Create a Project Folder & Initialize:**
    Open your terminal and run:
    ```bash
    mkdir my-hf-js-app
    cd my-hf-js-app
    npm init -y
    # This creates a package.json file
    ```

2.  **Install `@huggingface/inference`:**
    This library lets you run AI models.
    ```bash
    npm install @huggingface/inference
    ```

3.  **Get Your Hugging Face Access Token (Important!):**
    *   Go to your [Hugging Face account settings](https://huggingface.co/settings/tokens).
    *   Click "New token". Give it a name (e.g., "my-js-app-token") and assign it the "read" role.
    *   Copy the generated token. **Treat this like a password!**
    *   For this quick start, we'll set it as an environment variable in your terminal:
        ```bash
        # On macOS/Linux
        export HF_TOKEN="hf_YOUR_COPIED_TOKEN_HERE"
        # On Windows (Command Prompt)
        # set HF_TOKEN=hf_YOUR_COPIED_TOKEN_HERE
        # On Windows (PowerShell)
        # $env:HF_TOKEN="hf_YOUR_COPIED_TOKEN_HERE"
        ```
        (Replace `hf_YOUR_COPIED_TOKEN_HERE` with your actual token)
        *For real projects, use a `.env` file or other secure methods to manage tokens.*

4.  **Create Your JavaScript File:**
    Create a file named `index.js` in your `my-hf-js-app` folder and add this code:

    ```javascript
    // index.js
    import { InferenceClient } from "@huggingface/inference";

    async function runMyFirstAi() {
      // Get your Hugging Face token from the environment variable
      const hfToken = process.env.HF_TOKEN;

      if (!hfToken) {
        console.error("🚨 Hugging Face token (HF_TOKEN) is not set!");
        console.log("Please set it as an environment variable.");
        return;
      }

      // Initialize the Inference Client
      const client = new InferenceClient(hfToken);
      const model = "gpt2"; // A classic, widely available text generation model

      console.log(`🤖 Asking model "${model}" to complete a sentence...`);

      try {
        const response = await client.textGeneration({
          model: model,
          inputs: "The best thing about coding is ", // Your sentence starter
          parameters: {
            max_new_tokens: 20, // How many new words the AI should add
          },
        });

        console.log("\n✨ AI says:");
        console.log(response.generated_text);
        console.log("\n🎉 You just ran your first AI task with Hugging Face JS!");

      } catch (error) {
        console.error("😭 Oh no, something went wrong:", error.message);
        if (error.message.includes("authorization")) {
          console.error("Check if your HF_TOKEN is correct and has 'read' permissions.");
        }
      }
    }

    runMyFirstAi();
    ```
    *Note: This example uses ES Modules (`import`). Your `package.json` should have `"type": "module"` or you can save the file as `index.mjs`.*
    To add `"type": "module"` to `package.json`, you can do it manually or run:
    `npm pkg set type="module"`

5.  **Run Your Code!**
    Back in your terminal (in the `my-hf-js-app` directory):
    ```bash
    node index.js
    ```

    You should see the AI complete your sentence! How cool is that? 😎

You've officially run your first AI task using Hugging Face JS! From here, you can explore more models, different AI tasks, and integrate this power into your own applications.

---

## 📚 Digging Deeper: Installation & Setup Options

The Quick Start got you running, but let's look at the standard installation methods for different project types.

### Installation: Add Hugging Face JS to Your Project

Pick the installation method that fits your development style:

**1. For Node.js, Bun, or Web Projects (using a bundler like Webpack or Vite):**

Use your favorite package manager (`npm`, `yarn`, or `pnpm`) to add the libraries.

Install only the packages you need. For example, to use AI models and manage your Hugging Face Hub repositories:
```bash
npm install @huggingface/inference @huggingface/hub
# Or yarn add @huggingface/inference @huggingface/hub
# Or pnpm add @huggingface/inference @huggingface/hub
```

Then, import them into your TypeScript or JavaScript code:
```ts
// For using AI models
import { InferenceClient } from "@huggingface/inference";
// For managing Hub repositories (like creating repos, uploading files)
import { createRepo, listFiles } from "@huggingface/hub";
// You can also import specific types if you're using TypeScript
import type { RepoId } from "@huggingface/hub";
```

**2. For Plain JavaScript in the Browser (using a CDN):**

No build step? No problem! You can use our libraries directly in your HTML files. We recommend using ES modules for this.

```html
<script type="module">
  // Import the functions you need from the latest versions on a CDN
  // Always check for the latest version on npm!
  import { InferenceClient } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@LATEST_VERSION/+esm';
  import { listFiles } from "https://cdn.jsdelivr.net/npm/@huggingface/hub@LATEST_VERSION/+esm";

  const HF_TOKEN = "your_hf_token_here"; // IMPORTANT: Secure your token, especially in client-side code!
  const inference = new InferenceClient(HF_TOKEN);

  async function runBrowserExample() {
    try {
      // Example: List files in the public "gpt2" model repository
      const files = await listFiles({ repo: "gpt2" }); // No token needed for public repos
      console.log("Files in gpt2 model repo:", files.map(file => file.path));

      // Example: Run a simple text generation task (using a public model)
      const { generated_text } = await inference.textGeneration({
        model: "gpt2",
        inputs: "Once upon a time",
      });
      console.log("AI generated text:", generated_text);
    } catch (error) {
      console.error("Error in browser example:", error);
    }
  }
  runBrowserExample();
</script>
```
**Important Note:** Replace `LATEST_VERSION` with the current latest version number of each package (e.g., `@4.0.6`). You can find this on [npm](https://www.npmjs.com/package/@huggingface/inference). Be cautious with your Hugging Face token in client-side browser code; it's often better to have a backend make authenticated API calls.

**3. For Deno Projects:**

Deno makes it easy to use modules directly from URLs. You can use CDNs like esm.sh or import directly from npm:

```ts
// Option 1: Import from esm.sh (a popular CDN for ES modules)
import { InferenceClient } from "https://esm.sh/@huggingface/inference";
import { createRepo, listFiles } from "https://esm.sh/@huggingface/hub";

// Option 2: Import directly from npm (Deno supports this!)
// import { InferenceClient } from "npm:@huggingface/inference";
// import { createRepo, listFiles } from "npm:@huggingface/hub";

// It's best to manage your Hugging Face token using environment variables in Deno
const HF_TOKEN = Deno.env.get("HF_TOKEN");
if (!HF_TOKEN) {
  console.warn("HF_TOKEN environment variable not set. Some operations might fail.");
}

const inference = new InferenceClient(HF_TOKEN);

async function runDenoExample() {
  const { choices } = await inference.chatCompletion({
    model: "mistralai/Mistral-7B-Instruct-v0.1",
    messages: [{ role: "user", content: "What's the weather like in Paris?" }],
  });
  console.log("AI response:", choices[0].message.content);
}
runDenoExample();
```

### 🔑 Secure Your Hugging Face Token!

Your Hugging Face token is your key to accessing models and managing your Hub account. **Protect it like a password!**

*   **Best Practice:** Use environment variables (e.g., `process.env.HF_TOKEN` in Node.js, `Deno.env.get("HF_TOKEN")` in Deno).
*   For local development, `dotenv` (npm package) is great for loading variables from a `.env` file (make sure to add `.env` to your `.gitignore`!).
*   **Avoid hardcoding tokens directly in your source code**, especially if the code will be public or shared.

### Your First AI Task (Revisited): Text Generation

The Quick Start showed a Node.js example. The core logic is similar across environments once you have the `InferenceClient` initialized.

Here's the Node.js example again for reference, focusing on the AI part:

1.  **Ensure Token is Set:** (As shown in the Quick Start or via `.env`)
2.  **Write the Code:**

    ```ts
    // myAiApp.ts (or .js with "type": "module" in package.json)
    import { InferenceClient } from "@huggingface/inference";

    const HF_TOKEN = process.env.HF_TOKEN; // From environment

    if (!HF_TOKEN) {
      throw new Error("Hugging Face token (HF_TOKEN) is not set.");
    }

    const client = new InferenceClient(HF_TOKEN);

    async function generateStoryOpening() {
      try {
        const response = await client.textGeneration({
          model: "gpt2",
          inputs: "In a world where dragons rule the skies,",
          parameters: { max_new_tokens: 50, temperature: 0.7 }
        });
        console.log("AI's story opening:", response.generated_text);
      } catch (error) {
        console.error("Error generating text:", error.message);
      }
    }
    generateStoryOpening();
    ```

3.  **Run It:** (Assuming `HF_TOKEN` is set in your terminal session)
    ```bash
    # If TypeScript: npx ts-node myAiApp.ts
    # If JavaScript: node myAiApp.js
    ```

Now you're equipped with the installation know-how! Let's explore what these libraries can do.

## 🛠️ Explore Our JavaScript Toolkit for AI

This repository is your gateway to a powerful suite of JavaScript libraries, meticulously crafted to connect your projects with the vast Hugging Face ecosystem. All libraries are written in TypeScript, ensuring type safety and a great developer experience, and they compile to standard JavaScript for broad compatibility.

Here’s a breakdown of the tools at your disposal:

*   **`@huggingface/inference`**: ([Dive into the Docs](packages/inference/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/inference))
    *   **Purpose:** Your primary tool for running AI models. This is where the magic happens!
    *   **Key Features:**
        *   🧠 Access tens of thousands of pre-trained models for a huge variety of tasks: text generation, image creation, code completion, summarization, translation, audio processing, and much more.
        *   🚀 Supports multiple inference providers:
            *   Hugging Face's own Inference API (free tier available for many models).
            *   Dedicated Inference Endpoints (for production-grade performance and reliability).
            *   Third-party services like Replicate, Cohere, Together AI, and others, giving you flexibility and access to even more specialized hardware.
        *   💻 Works seamlessly in Node.js, browsers, Deno, and Bun.
*   **`@huggingface/hub`**: ([Dive into the Docs](packages/hub/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/hub))
    *   **Purpose:** Programmatically manage your models, datasets, and Spaces on the Hugging Face Hub.
    *   **Key Features:**
        *   📁 Create, update, and delete repositories (for models, datasets, or Spaces).
        *   📤 Upload and download files (like model weights, configuration files, or datasets).
        *   🔍 List repository contents, manage branches, and interact with repository metadata.
*   **`@huggingface/agents`** (formerly part of `@huggingface/mcp-client`): ([Dive into the Docs](packages/agents/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/agents))
    *   **Purpose:** Build sophisticated AI agents that can reason, plan, and use tools to accomplish complex tasks.
    *   **Key Features:**
        *   🤖 Provides a framework for creating agents powered by Large Language Models (LLMs).
        *   🛠️ Enables agents to use "tools" (custom functions or external APIs) to gather information or perform actions (e.g., web search, calculations, interacting with other services).
        *    dibangun on top of `@huggingface/inference` for model interaction.
*   **`@huggingface/gguf`**: ([Dive into the Docs](packages/gguf/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/gguf))
    *   **Purpose:** Work with GGUF (GPT-Generated Unified Format) model files.
    *   **Key Features:** A robust JavaScript parser for the GGUF format, which is highly popular for running LLMs efficiently on CPUs and various hardware. It can even parse GGUF files hosted remotely without downloading the entire file.
*   **`@huggingface/dduf`**: ([Dive into the Docs](packages/dduf/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/dduf))
    *   **Purpose:** Similar to `@huggingface/gguf`, but for DDUF files.
    *   **Key Features:** A parser for DDUF (Diffusers Unified Format), often used with diffusion models (especially for image generation tasks).
*   **`@huggingface/tasks`**: ([Dive into the Docs](packages/tasks/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/tasks))
    *   **Purpose:** Contains the definitions and metadata for standard AI tasks and other primitives used across the Hugging Face Hub.
    *   **Key Features:** This is the canonical source for information like "pipeline tasks" (e.g., `text-generation`, `image-classification`), model library names (e.g., `transformers`, `diffusers`), widget examples, and more. Essential if you're building tools that deeply integrate with the Hub's structure.
*   **`@huggingface/jinja`**: ([Dive into the Docs](packages/jinja/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/jinja))
    *   **Purpose:** A JavaScript implementation of the Jinja templating engine.
    *   **Key Features:** Many LLMs expect their inputs (prompts) to be formatted using Jinja templates, especially for chat applications. This library allows you to render those templates correctly in your JavaScript environment.
*   **`@huggingface/space-header`**: ([Dive into the Docs](packages/space-header/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/space-header))
    *   **Purpose:** Embed the standard Hugging Face Space header component in your own web applications.
    *   **Key Features:** Easily include the familiar `mini_header` from Hugging Face Spaces into your projects, even if they are hosted outside the Hugging Face platform, providing a consistent look and feel.
*   **`@huggingface/ollama-utils`**: ([Dive into the Docs](packages/ollama-utils/README.md) | [See on npm](https://www.npmjs.com/package/@huggingface/ollama-utils))
    *   **Purpose:** Utilities to improve compatibility and integration with Ollama.
    *   **Key Features:** Provides tools to help align models running via Ollama (a popular tool for running LLMs locally) with the Hugging Face Hub ecosystem, particularly around chat templates and model metadata.

**✨ Built for the Modern Web & Beyond:**

We embrace modern JavaScript to deliver libraries that are:
*   **Lean & Efficient:** Minimizing unnecessary polyfills and dependencies.
*   **Versatile:** Optimized for a wide range of environments:
    *   **Browsers:** Latest versions of Chrome, Firefox, Safari, and Edge.
    *   **Node.js:** Version 18 or newer is recommended.
    *   **Deno & Bun:** First-class support for these exciting new runtimes.

**🤝 We Value Your Voice!**

These libraries are a community effort. Your feedback, bug reports, and feature ideas are what drive improvement and innovation.
*   Encounter an issue or have a suggestion? Please **[open an issue on GitHub](https://github.com/huggingface/huggingface.js/issues)**!
*   Want to contribute directly? That's amazing! Check out our [CONTRIBUTING.md](CONTRIBUTING.md) guide.

## 💡 Diving Deeper: Code Examples & Use Cases

Let's explore more practical ways to use our core libraries. Remember to have your Hugging Face access token handy (and secure!). You can create one in your [Hugging Face account settings](https://huggingface.co/settings/tokens).

### `@huggingface/inference` Unleashed: More AI Tasks

Let's dive into more examples with the `@huggingface/inference` library. This is your go-to for making AI models do cool things!

```ts
import { InferenceClient } from "@huggingface/inference";
// For saving files in Node.js, if you want to try that:
// import { writeFile } from 'fs/promises';
// import { Buffer } from 'buffer'; // Needed for arrayBuffer to Buffer conversion

const HF_TOKEN = process.env.HF_TOKEN; // Keep your token in environment variables!
if (!HF_TOKEN) {
  throw new Error("HF_TOKEN is not set in environment variables.");
}

const client = new InferenceClient(HF_TOKEN);

async function exploreAiTasks() {
  try {
    // 1. Chat with an AI (Chat Completion)
    console.log("💬 Let's chat with an AI...");
    const chatResponse = await client.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2", // A popular open chat model
      messages: [{ role: "user", content: "What are three fun facts about JavaScript?" }],
      max_tokens: 200, // Control how long the AI's response can be
    });
    console.log("AI says:", chatResponse.choices[0].message.content);

    // 2. Streaming Chat: Get responses word-by-word (or token-by-token)
    console.log("\n💬 Streaming a poem from the AI...");
    process.stdout.write("AI's poem: ");
    for await (const chunk of client.chatCompletionStream({
      model: "HuggingFaceH4/zephyr-7b-beta", // Another good chat model
      messages: [{ role: "user", content: "Write a short, funny poem about a confused robot." }],
      max_tokens: 100,
    })) {
      // `chunk.choices[0].delta.content` gives you the new part of the message
      process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
    process.stdout.write("\n");

    // 3. Using a Different Provider (e.g., Replicate, Together AI)
    //    You might need an API key for that provider.
    console.log("\n🖼️ Generating an image using a Replicate model...");
    const imageResult = await client.textToImage({
      model: "stabilityai/stable-diffusion-2-1", // This model ID is often found on the provider's site
      inputs: "A majestic lion wearing a crown, photorealistic",
      provider: "replicate", // Specify the provider
      // providerToken: process.env.REPLICATE_API_TOKEN, // If the provider needs its own token
    });
    console.log("Image generated! It's a Blob. In a browser, you could create an Object URL and show it in an <img> tag.");
    // Example: Saving the image in Node.js (uncomment fs/promises and Buffer imports above)
    // const imageBuffer = Buffer.from(await imageResult.arrayBuffer());
    // await writeFile('lion_king.png', imageBuffer);
    // console.log("Image saved as lion_king.png");


    // 4. Translate Text
    console.log("\n🌐 Translating text...");
    const translationResult = await client.translation({
      model: "facebook/nllb-200-distilled-600M", // A powerful translation model
      inputs: "Hello, world! JavaScript is fun.",
      parameters: {
        src_lang: "eng_Latn", // Source language (English)
        tgt_lang: "fra_Latn", // Target language (French)
      },
    });
    console.log(`Original: ${translationResult[0].original_text}`);
    console.log(`Translation (to French): ${translationResult[0].translation_text}`);


    // 5. Image to Text (Image Captioning)
    console.log("\n📝 Generating a caption for an image...");
    const imageUrlForCaption = 'https://huggingface.co/datasets/Narsil/image_dummy/raw/main/parrots.png'; // An example image URL
    const imageBlobForCaption = await (await fetch(imageUrlForCaption)).blob(); // Download the image data

    const captionResult = await client.imageToText({
      data: imageBlobForCaption,
      model: 'Salesforce/blip-image-captioning-large', // A good image captioning model
    });
    console.log("Image caption:", captionResult.generated_text);


    // 6. Using Your Own Dedicated Inference Endpoint
    //    If you have a paid Inference Endpoint on Hugging Face for better performance/reliability.
    //    The endpoint URL looks something like: https://your-endpoint-name.region.vendor.endpoints.huggingface.cloud
    // console.log("\n⚡ Using a dedicated Inference Endpoint for text generation...");
    // const myEndpointUrl = process.env.MY_INFERENCE_ENDPOINT_URL;
    // if (myEndpointUrl) {
    //   const endpointClient = client.endpoint(myEndpointUrl);
    //   const endpointResponse = await endpointClient.textGeneration({
    //     inputs: "The future of AI is ",
    //     parameters: { max_new_tokens: 20 }
    //   });
    //   console.log("Response from dedicated endpoint:", endpointResponse.generated_text);
    // } else {
    //   console.log("(Skipping dedicated endpoint example as MY_INFERENCE_ENDPOINT_URL is not set)");
    // }

  } catch (error) {
    console.error("💥 An error occurred during inference examples:", error.message);
  }
}

exploreAiTasks();
```

### `@huggingface/hub` in Action: Managing Your AI Assets

The `@huggingface/hub` library helps you manage your models, datasets, and Spaces programmatically.

```ts
import {
  createRepo,
  uploadFile,
  deleteFiles,
  listFiles,
  // deleteRepo // Careful with this one!
} from "@huggingface/hub";

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  throw new Error("HF_TOKEN is not set for Hub examples.");
}

async function manageMyHubAssets() {
  try {
    // Create a unique repository name (e.g., using your username and a timestamp)
    // Replace "your-username" with your actual Hugging Face username!
    const repoName = `your-username/my-js-test-model-${Date.now()}`;
    const repoUrl = `https://huggingface.co/${repoName}`;

    // 1. Create a new (private) model repository
    console.log(`✨ Creating a new private repository: ${repoName}`);
    await createRepo({
      repo: repoName, // You can also use { type: "model", name: repoName }
      accessToken: HF_TOKEN,
      private: true, // Make it private
      spaceSdk: "gradio" // Example: if it's a Space, specify SDK (gradio, streamlit, docker, static)
    });
    console.log(`Repository created! Visit it at: ${repoUrl}`);

    // 2. Upload files to your new repository
    console.log("\n⬆️ Uploading a dummy model file and a README...");

    // Create some dummy file content (as a Blob)
    const dummyModelContent = new Blob(
      ["This is a placeholder for a model file. Content: " + Math.random()],
      { type: "text/plain" }
    );
    await uploadFile({
      repo: repoName,
      accessToken: HF_TOKEN,
      file: {
        path: "model_v1.txt", // Path inside your repository
        content: dummyModelContent,
      },
    });
    console.log("Uploaded model_v1.txt");

    const readmeFileContent = new Blob(
      [`# My Awesome JS Model\n\nThis model was created and managed using the \`@huggingface/hub\` library!`],
      { type: "text/markdown" }
    );
    await uploadFile({
      repo: repoName,
      accessToken: HF_TOKEN,
      file: { path: "README.md", content: readmeFileContent },
    });
    console.log("Uploaded README.md. Check your repo online!");

    // 3. List files in the repository
    console.log("\n📄 Listing files in the repository...");
    const filesInRepo = await listFiles({ repo: repoName, accessToken: HF_TOKEN });
    console.log("Files found:", filesInRepo.map(f => f.path).join(", "));

    // 4. Delete a specific file
    console.log("\n🗑️ Deleting model_v1.txt...");
    await deleteFiles({
      repo: repoName,
      accessToken: HF_TOKEN,
      paths: ["model_v1.txt"], // Can be an array of paths
    });
    console.log("model_v1.txt deleted.");

    // List files again to see the change
    const filesAfterDelete = await listFiles({ repo: repoName, accessToken: HF_TOKEN });
    console.log("Files remaining:", filesAfterDelete.map(f => f.path).join(", ") || "None");

    // 5. IMPORTANT: Cleaning up (deleting the test repository)
    //    Be very careful with deleteRepo in real projects!
    // console.log(`\n🧹 Cleaning up: Deleting repository ${repoName}...`);
    // await deleteRepo({ repo: repoName, accessToken: HF_TOKEN });
    // console.log(`Repository ${repoName} deleted. (Example cleanup)`);

  } catch (error) {
    console.error("💥 An error occurred during Hub examples:", error.message);
  }
}

manageMyHubAssets();

// Example for interacting with a Space (e.g., deleting files)
async function manageMySpace() {
  // const spaceRepo = { type: "space" as const, name: "your-username/your-space-name" };
  // console.log(`\n🗑️ Deleting files from Space: ${spaceRepo.name}`);
  // try {
  //   await deleteFiles({
  //     repo: spaceRepo, // or "spaces/your-username/your-space-name"
  //     accessToken: HF_TOKEN,
  //     paths: ["old_config.json", "temp_data.csv"]
  //   });
  //   console.log("Files deleted from the Space.");
  // } catch (error) {
  //   console.error(`Failed to delete files from Space: ${error.message}`);
  // }
}
// manageMySpace();
```

### `@huggingface/mcp-client`: Building AI Agents

The `@huggingface/mcp-client` is for more advanced use cases, like creating AI agents that can use tools to perform actions.

```ts
import { Agent } from '@huggingface/mcp-client';

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  throw new Error("HF_TOKEN is not set for MCP Agent examples.");
}

async function useAiAgent() {
  console.log("🤖 Initializing an AI Agent...");
  try {
    const agent = new Agent({
      // Provider for the underlying Language Model
      provider: "huggingface", // Or "auto", or another like "openai", "anthropic" (may need specific API keys)
      // Model that is good at following instructions and using tools
      model: "HuggingFaceH4/zephyr-7b-beta",
      apiKey: HF_TOKEN, // Token for the LLM provider (Hugging Face in this case)

      // Servers provide tools to the agent (e.g., web browsing, code execution).
      // This is an advanced setup. For this example, we'll run without external tools.
      // servers: [
      //   {
      //     // Example: Playwright MCP for web browsing capabilities
      //     command: "npx", // Command to start the tool server
      //     args: ["@playwright/mcp@latest"], // Arguments for the command
      //   },
      // ],
    });

    // If you had tool servers, you might load their capabilities:
    // await agent.loadTools();
    // console.log("Agent's available tools:", agent.tools.map(t => t.name));

    const userQuery = "What is the Hugging Face Hub and what can I do there?";
    console.log(`\n👤 User asks: "${userQuery}"`);

    process.stdout.write("🤖 Agent is thinking... Response: ");
    for await (const chunk of agent.run(userQuery)) {
      // The structure of `chunk` depends on what the agent is doing:
      // - If it's the LLM generating text: chunk will have `choices`
      // - If it's calling a tool: chunk will have `type: "tool-call"`
      // - If it's returning a tool's result: chunk will have `type: "tool-result"`

      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      } else if (chunk.type === "tool-call") {
        // In a real scenario, you'd execute the tool call here.
        process.stdout.write(`\n[Agent wants to call tool: ${chunk.toolName} with args: ${JSON.stringify(chunk.toolArgs)}]`);
        // ... then feed the result back to the agent.
      }
      // Add more handling for other chunk types as needed.
    }
    process.stdout.write("\n");
    console.log("\n✅ Agent run finished.");

  } catch (error) {
    console.error("💥 An error occurred with the AI Agent:", error.message);
  }
}

useAiAgent();
```

These examples are designed to be more illustrative and easier to understand. Remember to install necessary libraries (`@huggingface/inference`, `@huggingface/hub`, `@huggingface/mcp-client`) and set up your `HF_TOKEN` environment variable.

Explore the individual `README.md` files within each `packages/*` directory for even more detailed documentation on each library.

## Join the Community & Contribute!

We believe in the power of community! Your contributions, feedback, and ideas are what make these libraries great.

*   **Found a bug? Have a feature idea?** Please [open an issue](https://github.com/huggingface/huggingface.js/issues)!
*   **Want to contribute code?** That's fantastic! Check out our [CONTRIBUTING.md](CONTRIBUTING.md) guide to get started.

### Setting Up Your Development Environment

If you're ready to dive into the code and contribute:

1.  **Enable Corepack:** This tool helps manage `pnpm`, our package manager.
    ```console
    sudo corepack enable # You might not need sudo depending on your setup
    ```

2.  **Install All Dependencies:** From the root of this monorepo:
    ```console
    pnpm install
    ```

3.  **Code Quality Checks:** We use Prettier for formatting and ESLint for linting.
    ```console
    pnpm -r format:check
    pnpm -r lint:check
    ```
    To automatically fix formatting issues:
    ```console
    pnpm -r format
    ```

4.  **Running Tests:**
    Ensure all tests pass before submitting a pull request:
    ```console
    pnpm -r test
    ```

### Building the Libraries

To build all packages:

```console
pnpm -r build
```

This command will generate ESM (ECMAScript Modules) and CJS (CommonJS) JavaScript files in the `dist` directory of each package (e.g., `packages/inference/dist/index.mjs` and `packages/inference/dist/index.js`).

## License

These libraries are licensed under the [LICENSE](LICENSE) file in the root of this repository.
