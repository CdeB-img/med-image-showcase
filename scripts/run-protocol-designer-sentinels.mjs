import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const functional = "src/features/protocol-designer/functional-reset/__tests__/";
const bridge = "src/features/protocol-designer/__tests__/";
const doc = "src/features/document-projection/__tests__/";
// Selection only: reuse current canonical tests, no alternate fixtures/runners.
const sentinels = {
  S1: [functional + "continuous-project-build.test.tsx", functional + "project-owner-reload.test.ts"],
  S2: [functional + "project-adoption-trace.test.tsx"],
  S3: [functional + "project-qry-01.test.tsx"],
  S4: [doc + "drci-draft-pack.test.tsx"],
  S5: [functional + "document-generation-history.test.ts", doc + "document-lifecycle-owner.test.ts", doc + "living-document-revision.test.ts"],
  S6: [bridge + "durable-provider-failure-capture.test.ts", bridge + "durable-working-draft-recovery.test.ts"],
  S7: [functional + "session-persistence-verdict.test.ts", functional + "project-adoption-effects.test.ts"],
  S8: [functional + "terra-current-project-scalability.test.ts", functional + "terra-nominal-retention.test.tsx", functional + "scientific-discussion-retention.test.ts"],
  S9: [doc + "drci-draft-pack.test.tsx", doc + "drci-renderer-domain-independence.test.ts"],
  S10: [bridge + "durable-public-handler.test.ts", doc + "drci-draft-pack.test.tsx"],
};
const files = [...new Set(Object.values(sentinels).flat())];
const tracked = new Set(execFileSync("git", ["ls-files", "-z", "--", "src"], { cwd: root, encoding: "utf8" }).split("\0"));
for (const file of files) if (!tracked.has(file)) throw new Error("SENTINEL_NOT_CANONICAL: " + file);
console.log("PROTOCOL_DESIGNER_SENTINELS=" + JSON.stringify(sentinels));
const result = spawnSync(process.execPath, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...files, ...process.argv.slice(2)],
  { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
