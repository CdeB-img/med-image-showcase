import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  canonicalTestFilesForInvocation,
  trackedCanonicalTestFiles,
} from "./canonical-test-files";

const temporaryRepositories: string[] = [];

const makeTemporaryRepository = (): string => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), "noxia-canonical-tests-"));
  temporaryRepositories.push(repositoryRoot);
  mkdirSync(join(repositoryRoot, "src", "nested"), { recursive: true });

  writeFileSync(join(repositoryRoot, "src", "tracked.test.ts"), "export {};\n");
  writeFileSync(join(repositoryRoot, "src", "nested", "tracked.spec.tsx"), "export {};\n");
  writeFileSync(join(repositoryRoot, "src", "not-a-test.ts"), "export {};\n");
  writeFileSync(join(repositoryRoot, "src", "untracked.test.ts"), "export {};\n");
  writeFileSync(join(repositoryRoot, "src", "ignored.test.mjs"), "export {};\n");

  execFileSync("git", ["init", "--quiet"], { cwd: repositoryRoot });
  writeFileSync(
    join(repositoryRoot, ".git", "info", "exclude"),
    "/src/ignored.test.mjs\n",
  );
  execFileSync(
    "git",
    ["add", "--", "src/tracked.test.ts", "src/nested/tracked.spec.tsx", "src/not-a-test.ts"],
    { cwd: repositoryRoot },
  );

  return repositoryRoot;
};

afterEach(() => {
  for (const repositoryRoot of temporaryRepositories.splice(0)) {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

describe("canonical Vitest discovery", () => {
  it("selects only tracked canonical tests regardless of local ignored or untracked files", () => {
    const repositoryRoot = makeTemporaryRepository();

    expect(trackedCanonicalTestFiles(repositoryRoot)).toEqual([
      "src/nested/tracked.spec.tsx",
      "src/tracked.test.ts",
    ]);
    expect(canonicalTestFilesForInvocation(repositoryRoot, ["run"])).toEqual([
      "src/nested/tracked.spec.tsx",
      "src/tracked.test.ts",
    ]);
  });

  it("keeps an untracked historical test available only when it is requested explicitly", () => {
    const repositoryRoot = makeTemporaryRepository();

    expect(canonicalTestFilesForInvocation(repositoryRoot, [
      "run",
      "src/ignored.test.mjs",
    ])).toEqual([
      "src/ignored.test.mjs",
      "src/nested/tracked.spec.tsx",
      "src/tracked.test.ts",
    ]);
  });
});
