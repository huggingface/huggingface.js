import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const args = parseArgs({
	allowPositionals: true,
});

const dep = args.positionals[0];

if (!dep) {
	console.error("Error: No dependency specified.");
	process.exit(1);
}

process.chdir(`./packages/${dep}`);

// Always query npm public directly, never the internal hf-registry
// proxy. The proxy holds back versions newer than ~3 days; a dep
// published minutes ago would look missing or at the wrong version
// and break chained releases (publish tasks -> publish hub right
// after, etc.).
const PUBLIC_NPM = "--registry=https://registry.npmjs.org/";

const localPackageJson = readFileSync(`./package.json`, "utf-8");
const localVersion = JSON.parse(localPackageJson).version as string;
const remoteVersion = execSync(`npm view ${PUBLIC_NPM} @huggingface/${dep} version`).toString().trim();

if (localVersion !== remoteVersion) {
	console.error(
		`Error: The local @huggingface/${dep} package version (${localVersion}) differs from the remote version (${remoteVersion}). Release halted.`
	);
	process.exit(1);
}

execSync(`npm pack`);
execSync(`mv huggingface-${dep}-${localVersion}.tgz ${dep}-local.tgz`);

execSync(`npm pack ${PUBLIC_NPM} @huggingface/${dep}@${remoteVersion}`);
execSync(`mv huggingface-${dep}-${remoteVersion}.tgz ${dep}-remote.tgz`);

execSync(`rm -Rf local && mkdir local && tar -xf ${dep}-local.tgz -C local`);
execSync(`rm -Rf remote && mkdir remote && tar -xf ${dep}-remote.tgz -C remote`);

// Remove package.json files because they're modified by npm
execSync(`rm local/package/package.json`);
execSync(`rm remote/package/package.json`);

try {
	execSync("diff --brief -r local remote").toString();
} catch (e) {
	console.error(e.output.filter(Boolean).join("\n"));
	console.error(`Error: The local and remote @huggingface/${dep} packages are inconsistent. Release halted.`);
	process.exit(1);
}

console.log(`The local and remote @huggingface/${dep} packages are consistent.`);

execSync(`rm -Rf local`);
execSync(`rm -Rf remote`);
