import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

const CANONICAL_TEST_FILE = /^src\/.*\.(?:test|spec)\.(?:ts|tsx|mjs)$/;

const normalizeRepositoryPath = (filePath: string): string =>
  filePath.replace(/\\/g, "/").replace(/^\.\//, "");

export const isCanonicalTestFile = (filePath: string): boolean =>
  CANONICAL_TEST_FILE.test(normalizeRepositoryPath(filePath));

export const trackedCanonicalTestFiles = (repositoryRoot: string): string[] => {
  let trackedFiles: string;

  try {
    trackedFiles = execFileSync("git", ["ls-files", "-z", "--", "src"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`CANONICAL_TEST_DISCOVERY_REQUIRES_READABLE_GIT_INDEX${detail}`);
  }

  const canonicalFiles = trackedFiles
    .split("\0")
    .filter(Boolean)
    .map(normalizeRepositoryPath)
    .filter(isCanonicalTestFile)
    .sort();

  if (canonicalFiles.length === 0) {
    throw new Error("CANONICAL_TEST_DISCOVERY_FOUND_NO_TRACKED_TESTS");
  }

  return canonicalFiles;
};

const explicitlyRequestedTestFiles = (
  repositoryRoot: string,
  commandLineArguments: readonly string[],
): string[] => commandLineArguments
  .filter((argument) => !argument.startsWith("-"))
  .map((argument) => {
    const absolutePath = isAbsolute(argument)
      ? argument
      : resolve(repositoryRoot, argument);
    const repositoryPath = normalizeRepositoryPath(relative(repositoryRoot, absolutePath));

    return {
      absolutePath,
      repositoryPath,
    };
  })
  .filter(({ absolutePath, repositoryPath }) =>
    !repositoryPath.startsWith("../")
    && existsSync(absolutePath)
    && isCanonicalTestFile(repositoryPath))
  .map(({ repositoryPath }) => repositoryPath);

export const canonicalTestFilesForInvocation = (
  repositoryRoot: string,
  commandLineArguments: readonly string[],
): string[] => [...new Set([
  ...trackedCanonicalTestFiles(repositoryRoot),
  ...explicitlyRequestedTestFiles(repositoryRoot, commandLineArguments),
])].sort();
