import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function recursiveCopy(path: string) {
	for (const item of readdirSync(path)) {
		if (item.endsWith(".d.ts")) {
			const content = readFileSync(join(path, item), "utf-8");
			writeFileSync(join(path, item.replace(".d.ts", ".d.cts")), content.replaceAll(".d.ts.map", ".d.cts.map"));
		} else if (item.endsWith(".d.ts.map")) {
			const content = readFileSync(join(path, item), "utf-8");
			writeFileSync(join(path, item.replace(".d.ts.map", ".d.cts.map")), content.replaceAll(".d.ts", ".d.cts"));
		} else if (statSync(join(path, item)).isDirectory()) {
			recursiveCopy(join(path, item));
		}
	}
}

recursiveCopy("dist");
