import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const lines = (value) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const git = (root, args) => lines(execFileSync("git", args, { cwd: root, encoding: "utf8" }));

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
  const editorialEngineRoot = resolve(root, "../../editorial-engine");
  const editorialEngineState = existsSync(resolve(editorialEngineRoot, ".git")) ? {
    root: editorialEngineRoot,
    head: git(editorialEngineRoot, ["rev-parse", "HEAD"])[0] ?? null,
    changed: [...new Set([...git(editorialEngineRoot, ["diff", "--name-only"]), ...git(editorialEngineRoot, ["diff", "--cached", "--name-only"]), ...git(editorialEngineRoot, ["ls-files", "--others", "--exclude-standard"])])].sort(),
  } : { root: editorialEngineRoot, head: null, changed: ["EDITORIAL_ENGINE_REPOSITORY_NOT_FOUND"] };
  return Object.freeze({
    changedPaths: Object.freeze(changed),
    protectedChanges: Object.freeze(protectedChanges),
    protectedSurfacesUnchanged: protectedChanges.length === 0,
    editorialEngine: Object.freeze(editorialEngineState),
    editorialEngineUnchanged: editorialEngineState.changed.length === 0,
  });
};
