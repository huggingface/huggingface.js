// Just copy over the already generated .d.ts and .d.ts.map files to .d.cts and .d.cts.map files
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function recursiveRename(path: string) {
	for (const item of readdirSync(path)) {
		if (item.endsWith(".d.ts")) {
			const content = readFileSync(join(path, item), "utf-8");
			writeFileSync(join(path, item.replace(".d.ts", ".d.cts")), content.replaceAll(".d.ts.map", ".d.cts.map"));
			rmSync(join(path, item));
		} else if (item.endsWith(".d.ts.map")) {
			const content = readFileSync(join(path, item), "utf-8");
			writeFileSync(join(path, item.replace(".d.ts.map", ".d.cts.map")), content.replaceAll(".d.ts", ".d.cts"));
			rmSync(join(path, item));
		} /* else if (item.endsWith(".js")) {
			const content = readFileSync(join(path, item), "utf-8");
			writeFileSync(join(path, item.replace(".js", ".cjs")), content);
		} */ else if (statSync(join(path, item)).isDirectory()) {
			recursiveRename(join(path, item));
		}
	}
}

recursiveRename("dist/cjs");
