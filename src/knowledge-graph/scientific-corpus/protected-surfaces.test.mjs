import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inspectProtectedSurfaces } from "./protected-surfaces.mjs";

const temporaryDirectories = [];

const createRepository = ({ siblingState }) => {
  const parent = mkdtempSync(join(tmpdir(), "noxia-editorial-boundary-"));
  const root = join(parent, "noxia");
  const sourceRoot = join(root, "src", "knowledge-graph");
  temporaryDirectories.push(parent);
  mkdirSync(sourceRoot, { recursive: true });
  const editorialPackage = `@${["editorial", "engine"].join("-")}/core`;
  writeFileSync(join(sourceRoot, "entry.mjs"), `import { createEditorialEngine } from "${editorialPackage}";\nexport { createEditorialEngine };\n`);
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["add", "--", "src/knowledge-graph/entry.mjs"], { cwd: root });

  if (siblingState !== "ABSENT") {
    const sibling = join(parent, "editorial-engine");
    mkdirSync(sibling, { recursive: true });
    writeFileSync(join(sibling, "README.md"), "external state\n");
    if (siblingState === "DIRTY_GIT") {
      execFileSync("git", ["init", "--quiet"], { cwd: sibling });
      execFileSync("git", ["add", "--", "README.md"], { cwd: sibling });
      execFileSync("git", ["-c", "user.name=NOXIA Test", "-c", "user.email=test@noxia.invalid", "commit", "--quiet", "-m", "fixture"], { cwd: sibling });
      writeFileSync(join(sibling, "README.md"), "unrelated pre-existing modification\n");
      writeFileSync(join(sibling, "untracked.txt"), "unrelated untracked file\n");
    }
  }

  return root;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("Editorial Engine ownership boundary", () => {
  it.each(["ABSENT", "NON_GIT", "DIRTY_GIT"])("is independent of a %s sibling worktree", (siblingState) => {
    const result = inspectProtectedSurfaces({ root: createRepository({ siblingState }) });

    expect(result.editorialEngineOwnershipPreserved).toBe(true);
    expect(result.editorialEngine).toMatchObject({
      root: null,
      head: null,
      changed: [],
      proofType: "REPOSITORY_LOCAL_WRITE_BOUNDARY",
      externalWorktreeInspected: false,
    });
  });

  it("fails closed when NOXIA source targets an Editorial Engine sibling path", () => {
    const root = createRepository({ siblingState: "ABSENT" });
    const violatingPath = join(root, "src", "knowledge-graph", "external-write.mjs");
    writeFileSync(violatingPath, 'import { resolve } from "node:path";\nexport const target = resolve(process.cwd(), "../../editorial-engine");\n');
    execFileSync("git", ["add", "--", "src/knowledge-graph/external-write.mjs"], { cwd: root });

    const result = inspectProtectedSurfaces({ root });

    expect(result.editorialEngineOwnershipPreserved).toBe(false);
    expect(result.editorialEngine.externalWorktreeInspected).toBe(false);
    expect(result.editorialEngine.violations).toEqual([
      expect.objectContaining({
        path: "src/knowledge-graph/external-write.mjs",
        rule: "RELATIVE_SIBLING_EDITORIAL_PATH",
      }),
    ]);
  });
});
