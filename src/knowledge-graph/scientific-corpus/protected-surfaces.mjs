import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const lines = (value) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const git = (root, args) => lines(execFileSync("git", args, { cwd: root, encoding: "utf8" }));
const EDITORIAL_ENGINE_NAME = ["editorial", "engine"].join("-");
const SOURCE_PATH = /\.(?:[cm]?[jt]sx?)$/u;

const sourcePaths = (root) => [...new Set([
  ...git(root, ["ls-files", "--", "src/knowledge-graph", "scripts"]),
  ...git(root, ["ls-files", "--others", "--exclude-standard", "--", "src/knowledge-graph", "scripts"]),
])]
  .filter((path) => SOURCE_PATH.test(path) && !/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(path))
  .filter((path) => existsSync(`${root}/${path}`))
  .sort();

const externalPathViolation = (line) => {
  const escapedName = EDITORIAL_ENGINE_NAME.replace("-", "[-_]");
  const userSpecificAbsolutePath = new RegExp(`(?:/Users/|[A-Za-z]:[\\\\/])[^\\s;,)]+${escapedName}`, "iu");
  const relativeSiblingPath = new RegExp(`\\.\\.[\\\\/](?:\\.\\.[\\\\/])*${escapedName}(?:[\\\\/]|[\"']|$)`, "iu");
  const constructsEditorialPath = new RegExp(`(?:resolve|join|chdir)\\s*\\([^;\\n]*[\"']${escapedName}[\"']`, "iu");
  const directsCommandToEditorialRoot = new RegExp(`(?:cwd\\s*:|--git-dir|--work-tree|(?:^|[\"'])git[\"'])[^;\\n]*${escapedName}`, "iu");

  if (userSpecificAbsolutePath.test(line)) return "USER_SPECIFIC_ABSOLUTE_EDITORIAL_PATH";
  if (relativeSiblingPath.test(line)) return "RELATIVE_SIBLING_EDITORIAL_PATH";
  if (constructsEditorialPath.test(line)) return "EDITORIAL_PATH_CONSTRUCTION";
  if (directsCommandToEditorialRoot.test(line)) return "EDITORIAL_COMMAND_TARGET";
  return null;
};

export const inspectEditorialEngineOwnershipBoundary = ({ root = process.cwd() } = {}) => {
  const scannedPaths = sourcePaths(root);
  const violations = scannedPaths.flatMap((path) => readFileSync(`${root}/${path}`, "utf8")
    .split("\n")
    .flatMap((line, index) => {
      const rule = externalPathViolation(line);
      return rule ? [{ path, line: index + 1, rule }] : [];
    }));

  return Object.freeze({
    proofType: "REPOSITORY_LOCAL_WRITE_BOUNDARY",
    externalWorktreeInspected: false,
    scannedPaths: Object.freeze(scannedPaths),
    violations: Object.freeze(violations),
    preserved: violations.length === 0,
  });
};

export const protectedPathRules = Object.freeze([
  { surface: "PUBLIC_PAGES", pattern: /^src\/pages\// },
  { surface: "PUBLIC_ROUTES", pattern: /^(src\/App\.tsx|src\/main\.tsx|src\/routes\/)/ },
  { surface: "SEO", pattern: /^(public\/(robots|sitemap)|scripts\/audit-seo|docs\/seo-|src\/components\/SEO|src\/lib\/seo)/i },
  { surface: "VIEWERS", pattern: /viewer/i },
  { surface: "PACS", pattern: /(^|\/)pacs(\/|$)/i },
  { surface: "SUPABASE", pattern: /^supabase\// },
  { surface: "AUTH", pattern: /(^|\/)(auth|authentication)(\/|\.|$)/i },
  { surface: "STRIPE", pattern: /stripe/i },
]);

export const inspectProtectedSurfaces = ({ root = process.cwd() } = {}) => {
  const changed = [...new Set([
    ...git(root, ["diff", "--name-only"]),
    ...git(root, ["diff", "--cached", "--name-only"]),
    ...git(root, ["ls-files", "--others", "--exclude-standard"]),
  ])].sort();
  const protectedChanges = changed.flatMap((path) => protectedPathRules.filter((rule) => rule.pattern.test(path)).map((rule) => ({ surface: rule.surface, path })));
  const editorialEngineBoundary = inspectEditorialEngineOwnershipBoundary({ root });
  const editorialEngineState = {
    root: null,
    head: null,
    changed: editorialEngineBoundary.violations.map(({ path, line, rule }) => `${path}:${line}:${rule}`),
    proofType: editorialEngineBoundary.proofType,
    externalWorktreeInspected: editorialEngineBoundary.externalWorktreeInspected,
    scannedPathCount: editorialEngineBoundary.scannedPaths.length,
    violations: editorialEngineBoundary.violations,
  };
  return Object.freeze({
    changedPaths: Object.freeze(changed),
    protectedChanges: Object.freeze(protectedChanges),
    protectedSurfacesUnchanged: protectedChanges.length === 0,
    editorialEngine: Object.freeze(editorialEngineState),
    editorialEngineOwnershipPreserved: editorialEngineBoundary.preserved,
    editorialEngineUnchanged: editorialEngineBoundary.preserved,
  });
};
