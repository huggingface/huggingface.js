import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig({
  input: "./src/index.ts",
  platform: "neutral",
  plugins: [dts()],
  output: {
    cleanDir: true,
    dir: "dist",
    format: "esm",
  },
});
