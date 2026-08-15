import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Scientific Interpretation Vercel Node ESM runtime", () => {
  it("loads the production handler graph without aliases or extensionless imports", () => {
    const output = execFileSync(process.execPath, [resolve(process.cwd(), "scripts/check-scientific-interpretation-server.mjs")], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(output).toContain("RUNTIME_ALIAS_COUNT=0");
    expect(output).toContain("EXTENSIONLESS_RELATIVE_IMPORT_COUNT=0");
    expect(output).toContain("NODE_ESM_HANDLER_LOAD=PASS");
  });
});
