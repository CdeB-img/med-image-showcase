import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/** Resolve the documented sibling checkout from the shared Git root, including linked worktrees. */
export const editorialEngineRoot = (checkoutRoot: string): string => {
  const gitCommonDir = execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: checkoutRoot, encoding: "utf8" }).trim();
  const engineRoot = path.resolve(checkoutRoot, gitCommonDir, "../../../editorial-engine");
  if (!existsSync(path.join(engineRoot, "packages/core/src/index.mjs"))) {
    throw new Error("EDITORIAL_ENGINE_SIBLING_CHECKOUT_REQUIRED");
  }
  return engineRoot;
};
