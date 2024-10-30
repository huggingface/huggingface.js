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

const localVersion = JSON.parse(readFileSync(`./package.json`, "utf-8")).version as string;
const remoteVersion = execSync(`npm view @huggingface/${dep} version`).toString().trim();

if (localVersion !== remoteVersion) {
	console.error(
		`Error: The local @huggingface/${dep} package version (${localVersion}) differs from the remote version (${remoteVersion}). Release halted.`
	);
	process.exit(1);
}

execSync(`npm pack @huggingface/${dep}`);
execSync(`mv huggingface-${dep}-${localVersion}.tgz ${dep}-local.tgz`);

execSync(`npm pack @huggingface/${dep}@${remoteVersion}`);
execSync(`mv huggingface-${dep}-${remoteVersion}.tgz ${dep}-remote.tgz`);

execSync(`tar -xf ${dep}-local.tgz`);
const localChecksum = execSync(`cd package && tar --mtime='1970-01-01' --mode=755 -cf - . | sha256sum | cut -d' ' -f1`)
	.toString()
	.trim();
console.log(`Local package checksum: ${localChecksum}`);
execSync(`rm -Rf package`);

execSync(`tar -xf ${dep}-remote.tgz`);
const remoteChecksum = execSync(`cd package && tar --mtime='1970-01-01' --mode=755 -cf - . | sha256sum | cut -d' ' -f1`)
	.toString()
	.trim();
console.log(`Remote package checksum: ${remoteChecksum}`);
execSync(`rm -Rf package`);

if (localChecksum !== remoteChecksum) {
	console.error(
		`Checksum Verification Failed: The local @huggingface/${dep} package differs from the remote version. Release halted. Local Checksum: ${localChecksum}, Remote Checksum: ${remoteChecksum}`
	);
	process.exit(1);
}
console.log(
	`Checksum Verification Successful: The local and remote @huggingface/${dep} packages are consistent. Local Checksum: ${localChecksum}, Remote Checksum: ${remoteChecksum}.`
);
