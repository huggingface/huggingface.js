import { readFileSync, writeFileSync } from "fs";

const arg = process.argv[2];

const file = readFileSync("package.json", "utf-8");

writeFileSync("package.json", file.replace(/"type": ".*"/, `"type": "${arg}"`));
