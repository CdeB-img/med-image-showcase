import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildScientificExplorerProjection } from "../src/features/scientific-explorer/build-projection.mjs";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";

const root = process.cwd();
const target = resolve(root, "src/features/scientific-explorer/scientific-explorer-data.ts");
const check = process.argv.includes("--check");
const data = buildScientificExplorerProjection();
const content = `import type { ScientificExplorerData } from "./types";\n\nconst scientificExplorerData: ScientificExplorerData = ${stableStringify(data, 2)};\n\nexport default scientificExplorerData;\n`;

if (check) {
  const current = existsSync(target) ? readFileSync(target, "utf8") : null;
  if (current !== content) {
    console.error("scientific-explorer-data.ts is stale; run npm run build:scientific-explorer-data.");
    process.exitCode = 1;
  } else {
    console.log(`Scientific explorer data is current: ${data.assertions.length} assertions, ${data.sources.length} sources, digest ${data.digest}.`);
  }
} else {
  const temporary = `${target}.tmp`;
  try {
    writeFileSync(temporary, content, "utf8");
    renameSync(temporary, target);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  console.log(`Scientific explorer data generated for ${data.selectedDomain.label}: ${data.assertions.length} assertions, ${data.sources.length} sources.`);
}

