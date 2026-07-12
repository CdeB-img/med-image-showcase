import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const appSource = read("src/App.tsx");
const projectsSource = read("src/data/projects.ts");
const siteOrigin = "https://noxia-imagerie.fr";

function read(relativePath) {
  return fs.readFileSync(path.join(rootDirectory, relativePath), "utf8");
}

function normalizePath(value) {
  const url = new URL(value, siteOrigin);
  return url.pathname.replace(/\/$/, "") || "/";
}

function cleanText(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/\{[^}]+\}/g, " ").replace(/\s+/g, " ").trim();
}

function getProjectRecords() {
  const records = [];
  const projectPattern = /\{\s*id:\s*"([^"]+)",([\s\S]*?)\n  \},/g;

  for (const match of projectsSource.matchAll(projectPattern)) {
    const [, id, body] = match;
    const title = body.match(/title:\s*"([^"]+)"/)?.[1] ?? "";
    const seoTitle = body.match(/seoTitle:\s*"([^"]+)"/)?.[1] ?? title;
    const description = body.match(/description:\s*\n?\s*"([^"]+)"/)?.[1] ?? "";
    const relatedLinks = [...body.matchAll(/\{\s*label:\s*"[^"]+",\s*to:\s*"([^"]+)"\s*\}/g)].map(
      (link) => link[1]
    );

    records.push({ id, title, seoTitle, description, relatedLinks });
  }

  return records;
}

const projectRecords = getProjectRecords();
const projectById = new Map(projectRecords.map((project) => [project.id, project]));

function pageImportMap() {
  const imports = new Map();
  const pattern = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["']([^"']+)["']\)\)/g;

  for (const match of appSource.matchAll(pattern)) {
    const importPath = match[2]
      .replace(/^@\//, "src/")
      .replace(/^\.\//, "src/");
    imports.set(match[1], `${importPath}.tsx`);
  }

  return imports;
}

function getRoutes() {
  const imports = pageImportMap();
  const routes = [];
  const redirects = [];
  const routePattern = /<Route\s+path="([^"]+)"\s+element=\{<([A-Za-z0-9_]+)(?:\s*\/|\s*>)/g;
  const redirectPattern = /<Route\s+path="([^"]+)"\s+element=\{<Navigate\s+to="([^"]+)"/g;

  for (const match of appSource.matchAll(routePattern)) {
    const [route, component] = [match[1], match[2]];
    if (component === "Navigate" || route === "*") continue;
    const file = imports.get(component);
    if (file) routes.push({ route, component, file });
  }

  for (const match of appSource.matchAll(redirectPattern)) {
    redirects.push({ route: match[1], target: match[2] });
  }

  const projectIds = projectRecords.map((project) => project.id);
  const projectRoute = routes.find((route) => route.route === "/projet/:id");

  if (projectRoute) {
    projectIds.forEach((id) => {
      routes.push({ ...projectRoute, route: `/projet/${id}`, projectId: id });
    });
    return { routes: routes.filter((route) => route.route !== "/projet/:id"), redirects };
  }

  return { routes, redirects };
}

function getCanonical(source, route) {
  if (route.startsWith("/projet/")) return `${siteOrigin}${route}`;
  const match = source.match(/const\s+CANONICAL\s*=\s*"([^"]+)"/);
  return match?.[1] ?? "";
}

function pageDetails(route) {
  const source = read(route.file);
  const project = route.projectId ? projectById.get(route.projectId) : undefined;
  const canonical = getCanonical(source, route.route);
  const titleMatch = source.match(/<title>([\s\S]*?)<\/title>/);
  const descriptionMatch = source.match(/name="description"[\s\S]{0,320}?content=(?:"([^"]+)"|\{([^}]+)\})/);
  const directH1 = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const heroTitle = source.match(/<ExpertiseHero[\s\S]{0,520}?\btitle=(?:"([^"]+)"|\{([^}]+)\})/);
  const usesHeroSection = source.includes("<HeroSection");
  const linkPattern = /\b(?:to|href)\s*=\s*(?:\{\s*)?["'](\/[^"'#?]*)/g;
  const links = [...source.matchAll(linkPattern)].map((match) => match[1]);
  if (project) links.push(...project.relatedLinks);
  const jsonTypes = [...source.matchAll(/["']@type["']\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
  const canonicalCount = [...source.matchAll(/rel="canonical"/g)].length;
  const jsonLdScripts = [...source.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

  return {
    ...route,
    canonical,
    title: project?.seoTitle ?? cleanText(titleMatch?.[1] ?? ""),
    description: project?.description ?? descriptionMatch?.[1] ?? descriptionMatch?.[2] ?? "",
    h1: project?.title ?? cleanText(directH1?.[1] ?? heroTitle?.[1] ?? heroTitle?.[2] ?? (usesHeroSection ? "HeroSection" : "")),
    hasBreadcrumbList: source.includes("BreadcrumbList"),
    hasFaqPage: source.includes("FAQPage") && /JSON\.stringify\([^)]*faq/i.test(source),
    jsonTypes: [...new Set(jsonTypes)],
    links: [...new Set(links)],
    canonicalCount,
    hasOnlySerializedJsonLd: jsonLdScripts.every((script) => /JSON\.stringify\(/.test(script[1])),
  };
}

function sitemapPaths() {
  return [...read("public/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => normalizePath(match[1]));
}

const { routes, redirects } = getRoutes();
const pages = routes.map(pageDetails);
const canonicalRoutes = new Set(pages.map((page) => normalizePath(page.canonical || page.route)));
const knownRoutes = new Set([...pages.map((page) => page.route), ...redirects.map((redirect) => redirect.route)]);
const sitemap = new Set(sitemapPaths());
const errors = [];
const warnings = [];
const titleRoutes = new Map();
const descriptionRoutes = new Map();

for (const page of pages) {
  if (!page.canonical) errors.push(`${page.route}: canonical absent`);
  if (!page.title) errors.push(`${page.route}: title absent`);
  if (!page.description) errors.push(`${page.route}: meta description absente`);
  if (!page.h1) errors.push(`${page.route}: H1 absent ou non detecte`);
  if (page.canonicalCount !== 1) errors.push(`${page.route}: ${page.canonicalCount} canonical(s) detecte(s), un seul attendu`);
  if (page.canonical && page.canonical !== page.canonical.toLowerCase()) {
    errors.push(`${page.route}: canonical avec une casse incoherente (${page.canonical})`);
  }
  if (!page.projectId && /name="robots"[\s\S]{0,120}?content="[^"]*noindex/i.test(read(page.file))) {
    errors.push(`${page.route}: noindex detecte sur une page canonique`);
  }
  if (!page.hasOnlySerializedJsonLd) {
    errors.push(`${page.route}: JSON-LD non serialise de maniere sure`);
  }
  if (page.title.length > 65) {
    warnings.push(`${page.route}: title trop long (${page.title.length} caracteres)`);
  }
  if (page.description.length < 100 || page.description.length > 165) {
    warnings.push(`${page.route}: meta description hors plage de lecture cible (${page.description.length} caracteres)`);
  }
  if (page.route !== "/" && !page.hasBreadcrumbList) warnings.push(`${page.route}: BreadcrumbList absent`);
  for (const link of page.links) {
    if (!knownRoutes.has(link) && !link.startsWith("/projet/")) {
      errors.push(`${page.route}: lien interne introuvable (${link})`);
    }
    if (redirects.some((redirect) => redirect.route === link)) {
      warnings.push(`${page.route}: lien interne vers une redirection (${link})`);
    }
  }

  const normalizedTitle = page.title.trim().toLowerCase();
  const normalizedDescription = page.description.trim().toLowerCase();
  titleRoutes.set(normalizedTitle, [...(titleRoutes.get(normalizedTitle) ?? []), page.route]);
  descriptionRoutes.set(normalizedDescription, [...(descriptionRoutes.get(normalizedDescription) ?? []), page.route]);
}

for (const route of canonicalRoutes) {
  if (!sitemap.has(route)) errors.push(`${route}: URL canonique absente du sitemap`);
}

for (const pathInSitemap of sitemap) {
  if (!canonicalRoutes.has(pathInSitemap)) errors.push(`${pathInSitemap}: URL du sitemap sans route canonique`);
}

for (const [title, titleRoutesList] of titleRoutes) {
  if (title && titleRoutesList.length > 1) {
    errors.push(`title duplique sur ${titleRoutesList.join(", ")} (${title})`);
  }
}

for (const [description, descriptionRoutesList] of descriptionRoutes) {
  if (description && descriptionRoutesList.length > 1) {
    warnings.push(`meta description dupliquee sur ${descriptionRoutesList.join(", ")}`);
  }
}

const faqPages = pages.filter((page) => page.hasFaqPage).map((page) => page.route);
const lines = [
  "# Rapport local SEO - NOXIA",
  "",
  `Genere localement le ${new Date().toISOString()}. Aucune requete reseau n'est effectuee.`,
  "",
  "## Resume",
  "",
  `- Pages canoniques analysees : ${pages.length}`,
  `- Redirections historiques : ${redirects.length}`,
  `- URLs sitemap : ${sitemap.size}`,
  `- Pages emettant actuellement FAQPage : ${faqPages.length}`,
  `- Liens de projets verifies : ${projectRecords.reduce((count, project) => count + project.relatedLinks.length, 0)}`,
  `- Erreurs : ${errors.length}`,
  `- Avertissements : ${warnings.length}`,
  "",
  "## Pages",
  "",
  "| Route | Fichier | Canonical | Title | H1 detecte | Title | Meta | BreadcrumbList | FAQPage | Liens sortants |",
  "|---|---|---|---|---|---:|---:|---:|---:|---:|",
  ...pages.map((page) =>
    `| \`${page.route}\` | \`${page.file}\` | \`${page.canonical || "absent"}\` | ${page.title || "absent"} | ${page.h1 || "absent"} | ${page.title.length} | ${page.description.length} | ${page.hasBreadcrumbList ? "oui" : "non"} | ${page.hasFaqPage ? "oui" : "non"} | ${page.links.length} |`
  ),
  "",
  "## Redirections historiques",
  "",
  "| Route | Cible |",
  "|---|---|",
  ...redirects.map((redirect) => `| \`${redirect.route}\` | \`${redirect.target}\` |`),
  "",
  "## Erreurs",
  "",
  ...(errors.length ? errors.map((error) => `- ${error}`) : ["- Aucune erreur detectee."]),
  "",
  "## Avertissements",
  "",
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- Aucun avertissement detecte."]),
  "",
  "## Pages avec FAQPage actuellement emis",
  "",
  ...(faqPages.length ? faqPages.map((route) => `- \`${route}\``) : ["- Aucune."]),
  "",
];

const reportPath = path.join(rootDirectory, "docs/seo-authority-local-report.md");
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

console.log(`Rapport cree : ${path.relative(rootDirectory, reportPath)}`);
console.log(`Pages : ${pages.length}; erreurs : ${errors.length}; avertissements : ${warnings.length}.`);

if (errors.length > 0) process.exitCode = 1;
