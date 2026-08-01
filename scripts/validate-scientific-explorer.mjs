import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildScientificExplorerProjection } from "../src/features/scientific-explorer/build-projection.mjs";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const errors = [];
const expect = (condition, code) => {
  if (!condition) errors.push(code);
};

const first = buildScientificExplorerProjection();
const second = buildScientificExplorerProjection();
const app = read("src/App.tsx");
const header = read("src/components/Header.tsx");
const page = read("src/pages/ScientificKnowledgeExplorer.tsx");
const component = read("src/features/scientific-explorer/ScientificExplorer.tsx");
const model = read("src/features/scientific-explorer/model.ts");
const sitemap = read("public/sitemap.xml");
const generated = read("src/features/scientific-explorer/scientific-explorer-data.ts");
const expectedGenerated = `import type { ScientificExplorerData } from "./types";\n\nconst scientificExplorerData: ScientificExplorerData = ${stableStringify(first, 2)};\n\nexport default scientificExplorerData;\n`;

expect(first.digest === second.digest && stableStringify(first) === stableStringify(second), "PROJECTION_NOT_DETERMINISTIC");
expect(first.selectedDomain.key === "segmentation", "PILOT_NOT_SELECTED_FROM_CATALOG");
expect(first.defaultConceptKey === null, "ARBITRARY_DEFAULT_SELECTION");
expect(first.assertions.length > 0 && first.evidenceLinks.length > 0 && first.sources.length > 0, "EMPTY_SCIENTIFIC_PROJECTION");
expect(first.illustration === null, "UNEXPECTED_PILOT_ILLUSTRATION");
expect(!Object.hasOwn(first.facets, "modalities"), "NON_DISCRIMINATING_MODALITY_FACET");
for (const [facet, options] of Object.entries(first.facets)) {
  expect(options.length > 0, `EMPTY_FACET:${facet}`);
  expect(options.every((option) => option.assertionCount > 0 && option.assertionCount < first.assertions.length), `NO_OP_FACET:${facet}`);
}
expect(generated === expectedGenerated, "MATERIALIZED_PROJECTION_STALE");
expect((app.match(/path="\/connaissances"/g) ?? []).length === 1, "PUBLIC_EXPLORER_ROUTE_MISSING_OR_DUPLICATE");
expect(header.includes('{ label: "Explorer les connaissances", path: "/connaissances" }'), "HEADER_ACCESS_MISSING");
expect(page.includes('const CANONICAL = "https://noxia-imagerie.fr/connaissances/"'), "EXPLORER_CANONICAL_INVALID");
expect(page.includes('<meta name="robots" content="noindex, follow" />'), "EXPLORER_NOINDEX_MISSING");
expect(!sitemap.includes("/connaissances"), "EXPLORER_PRESENT_IN_SITEMAP");
expect(!component.includes("knowledge-graph") && !model.includes("knowledge-graph"), "FULL_GRAPH_IMPORTED_IN_REACT");
expect(component.includes("useSearchParams") && model.includes("serializeExplorerState"), "URL_STATE_CONTRACT_MISSING");
expect(first.safeguards.publicPublicationReady === false, "PUBLIC_READINESS_INFERRED");
expect(first.safeguards.humanScientificReviewPerformed === false, "HUMAN_REVIEW_FABRICATED");

const report = {
  valid: errors.length === 0,
  errors,
  projection: {
    domain: first.selectedDomain.key,
    digest: first.digest,
    assertions: first.assertions.length,
    evidenceLinks: first.evidenceLinks.length,
    sources: first.sources.length,
    syntheses: first.syntheses.length,
  },
  route: {
    path: "/connaissances/",
    canonical: "https://noxia-imagerie.fr/connaissances/",
    robots: "noindex, follow",
    inSitemap: false,
  },
  protectedSurfaces: {
    authorizedP12RouteAdded: true,
    existingPublicPagesModifiedByP12: 0,
    sitemapModifiedByP12: false,
    seoRoutesAdded: 0,
  },
};

console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
