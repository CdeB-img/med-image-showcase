import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
const projectsSource = fs.readFileSync(path.join(root, "src/data/projects.ts"), "utf8");
const siteOrigin = "https://noxia-imagerie.fr";

const imports = new Map<string, string>();
for (const match of appSource.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["']([^"']+)["']\)\)/g)) {
  imports.set(match[1], `${match[2].replace(/^@\//, "src/").replace(/^\.\//, "src/")}.tsx`);
}

const pageRoutes = [...appSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<([A-Za-z0-9_]+)(?:\s*\/|\s*>)/g)]
  .map((match) => ({ route: match[1], file: imports.get(match[2]) }))
  .filter((entry): entry is { route: string; file: string } => Boolean(entry.file) && entry.route !== "*");

const sitemapPaths = new Set(
  [...fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => new URL(match[1]).pathname.replace(/\/$/, "") || "/")
);
const redirectRoutes = [...appSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate\s+to="([^"]+)"/g)];
const knownRoutes = new Set([
  ...pageRoutes.map((page) => page.route),
  ...redirectRoutes.map((match) => match[1]),
  ...[...projectsSource.matchAll(/id:\s*"([^"]+)"/g)].map((match) => `/projet/${match[1]}`),
]);

describe("SEO page contract", () => {
  it("keeps non-empty titles, descriptions, canonicals and H1 renderers on public page components", () => {
    for (const page of pageRoutes) {
      const source = fs.readFileSync(path.join(root, page.file), "utf8");
      const isDynamicProject = page.route === "/projet/:id";

      expect(source, `${page.route} needs a title`).toMatch(/<title>[\s\S]+?<\/title>/);
      expect(source, `${page.route} needs a description`).toMatch(/name="description"[\s\S]{0,320}?content=/);
      expect(source, `${page.route} needs a canonical`).toMatch(/rel="canonical"[\s\S]{0,160}?href=/);
      expect(source, `${page.route} needs a visible H1 renderer`).toMatch(/<h1|<ExpertiseHero|<HeroSection/);
      expect([...source.matchAll(/rel="canonical"/g)], `${page.route} needs one canonical`).toHaveLength(1);

      if (!isDynamicProject) {
        const canonical = source.match(/const\s+CANONICAL\s*=\s*"([^"]+)"/)?.[1];
        expect(canonical, `${page.route} needs a literal canonical`).toBeTruthy();
        expect(canonical, `${page.route} canonical must be lowercase`).toBe(canonical?.toLowerCase());
        expect(sitemapPaths, `${page.route} canonical must be in sitemap`).toContain(
          new URL(canonical as string, siteOrigin).pathname.replace(/\/$/, "") || "/"
        );
      }
    }
  });

  it("keeps BreadcrumbList markup on every non-home public page", () => {
    for (const page of pageRoutes.filter((page) => page.route !== "/")) {
      const source = fs.readFileSync(path.join(root, page.file), "utf8");
      expect(source, `${page.route} needs BreadcrumbList JSON-LD`).toContain("BreadcrumbList");
    }
  });

  it("does not emit a FAQPage schema automatically without an explicit audit allowlist", () => {
    const allowlist: string[] = [];

    for (const page of pageRoutes) {
      const source = fs.readFileSync(path.join(root, page.file), "utf8");
      const emitsFaqSchema = /<script\s+type="application\/ld\+json">\s*\{JSON\.stringify\([^)]*faq/i.test(source);
      if (emitsFaqSchema) expect(allowlist, `${page.route} emits FAQPage without approval`).toContain(page.route);
    }
  });

  it("uses JSON.stringify for every emitted JSON-LD script", () => {
    for (const page of pageRoutes) {
      const source = fs.readFileSync(path.join(root, page.file), "utf8");
      const scripts = [...source.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

      for (const script of scripts) {
        expect(script[1], `${page.route} has an unsafe JSON-LD script`).toMatch(/JSON\.stringify\(/);
      }
    }
  });

  it("keeps project-specific related links on public or redirected routes", () => {
    const projectLinks = [...projectsSource.matchAll(/\bto:\s*"([^"]+)"/g)].map((match) => match[1]);

    for (const link of projectLinks) {
      expect(knownRoutes, `Project link ${link} needs a matching route`).toContain(link);
    }
  });
});
