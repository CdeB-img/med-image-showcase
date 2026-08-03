import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const featureRoot = path.join(root, "src/features/protocol-designer");
const fixturePath = path.join(featureRoot, "fixtures/fabry-p0.fixture.json");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const listFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
  });

const relativeFeatureFiles = listFiles(featureRoot)
  .map((file) => path.relative(featureRoot, file).split(path.sep).join("/"))
  .sort();

const productionFeatureFiles = relativeFeatureFiles.filter(
  (file) => file !== "README.md" && !file.startsWith("__tests__/") && !file.startsWith("fixtures/"),
);

const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
const appSource = read("src/App.tsx");
const sitemapSource = read("public/sitemap.xml");
const readmeSource = fs.readFileSync(path.join(featureRoot, "README.md"), "utf8");

const currentRoutes = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
const baselineRoutes = [
  "/",
  "/projets",
  "/projet/:id",
  "/contact",
  "/segmentation-irm",
  "/analyse-dicom",
  "/quantification-ct",
  "/quantification-tissulaire",
  "/recalage-multimodal",
  "/bases-multicentriques",
  "/corelab-essais-cliniques",
  "/biomarqueurs-irm-cardiaque-essais-cliniques",
  "/ecv-mapping-t1-t2-irm-cardiaque",
  "/perfusion-cerebrale",
  "/metabolisme-cerebral",
  "/perfusion-metabolique-neuro-imagerie",
  "/perfusion-hemodynamique-neuro-imagerie",
  "/perfusion-metabolique-neuro-imagerie/CMRO2Imagerie",
  "/cmro2-imagerie-cerebrale",
  "/perfusion-metabolique-neuro-imagerie/OEFImagerie",
  "/oef-imagerie-cerebrale",
  "/ingenierie-imagerie-quantitative",
  "/ct-quantitatif-avance-imagerie-spectrale",
  "/scanner-double-energie",
  "/scanner-comptage-photon",
  "/scanner-spectral-principe",
  "/ct-perfusion-quantitative-avc",
  "/irm-imagerie-quantitative",
  "/ct-imagerie-quantitative",
  "/methodologie-imagerie-quantitative",
  "/a-propos",
  "/prestations-imagerie-medicale",
  "/expertise",
  "/references-publications",
  "/connaissances",
  "/corelabirm",
  "/cmro2",
  "/oef",
  "/perfusion-hemodynamique",
  "*",
];

const publicPagesDigest = () => {
  const pagesRoot = path.join(root, "src/pages");
  const hash = createHash("sha256");

  for (const file of listFiles(pagesRoot).sort()) {
    hash.update(path.relative(pagesRoot, file).split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }

  return hash.digest("hex");
};

describe("Protocol Designer P0 boundary", () => {
  it("keeps the Protocol Designer absent from public routes", () => {
    expect(appSource).not.toMatch(/protocol[- ]designer/i);
  });

  it("keeps the Protocol Designer out of the sitemap", () => {
    expect(sitemapSource).not.toMatch(/protocol[- ]designer/i);
  });

  it("preserves the complete route baseline", () => {
    expect(currentRoutes).toEqual(baselineRoutes);
  });

  it("preserves every existing public page", () => {
    expect(publicPagesDigest()).toBe("061e8374ac7359953f6c51ba2c73f38c480ee04db7aebabcd58c20c77d1889b1");
  });

  it("contains no production implementation or network access", () => {
    expect(productionFeatureFiles).toEqual([]);
  });

  it("does not import or modify the Editorial Engine", () => {
    expect(productionFeatureFiles).toEqual([]);
    expect(JSON.stringify(fixture)).not.toMatch(/editorial[- ]engine/i);
  });

  it("contains no PACS, DICOM or PixelData access", () => {
    expect(JSON.stringify(fixture)).not.toMatch(/pacs|dicom|pixeldata/i);
  });

  it("does not load a Reasoning Book or simulate C-KNOW", () => {
    expect(JSON.stringify(fixture)).not.toMatch(/reasoning[- ]book|pd-002|c-know|assertion|evidence/i);
  });

  it("keeps the Fabry fixture strictly technical and non-implemented", () => {
    expect(fixture).toEqual({
      caseId: "PD-P0-FABRY-INTENT-001",
      intent: "Je souhaite étudier la fibrose myocardique dans la maladie de Fabry.",
      implementationStatus: "NOT_IMPLEMENTED",
    });
    expect(Object.keys(fixture).sort()).toEqual(["caseId", "implementationStatus", "intent"]);
  });

  it("contains no protocol, recommendation, biomarker, proof or expected result", () => {
    expect(Object.keys(fixture).join(" ")).not.toMatch(
      /protocol|recommendation|biomarker|biomarkeur|proof|evidence|expected.?result|resultat.?attendu/i,
    );
  });

  it("does not claim a PD-011 PASS", () => {
    expect(fixture.implementationStatus).toBe("NOT_IMPLEMENTED");
    expect(JSON.stringify(fixture)).not.toMatch(/pass|evaluated_under_pd011/i);
  });

  it("creates no Gate or Stop business object", () => {
    expect(productionFeatureFiles).toEqual([]);
    expect(Object.keys(fixture)).not.toContain("Gate");
    expect(Object.keys(fixture)).not.toContain("Stop");
  });

  it("reserves scientific navigation to PD-009, never to a PD-005 role", () => {
    expect(readmeSource).toContain("PD-009 est l’unique autorité sur la navigation scientifique");
    expect(readmeSource).toContain("Aucun rôle PD-005 ne possède la prochaine action scientifique");
  });
});
