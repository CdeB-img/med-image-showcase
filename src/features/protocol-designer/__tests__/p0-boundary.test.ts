import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const featureRoot = path.join(root, "src/features/protocol-designer");
const fixturePath = path.join(featureRoot, "fixtures/fabry-p0.fixture.json");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
const appSource = read("src/App.tsx");
const sitemapSource = read("public/sitemap.xml");
const readmeSource = read("src/features/protocol-designer/README.md");
const productionSources = [
  appSource,
  read("src/pages/ProtocolDesigner.tsx"),
  read("src/pages/ProtocolDesignerDemo.tsx"),
  read("src/features/protocol-designer/fixtures.ts"),
  read("src/features/protocol-designer/DisclosureStack.tsx"),
].join("\n");

describe("Protocol Designer P0 Fabry boundary", () => {
  it("keeps the Fabry candidate absent from public routes", () => {
    expect(appSource).not.toMatch(/fabry|PD-P0-FABRY-INTENT-001/i);
  });

  it("keeps the Fabry candidate out of the sitemap", () => {
    expect(sitemapSource).not.toMatch(/fabry|PD-P0-FABRY-INTENT-001/i);
  });

  it("keeps the three admitted scenarios separate from the Fabry candidate", () => {
    expect(productionSources).toMatch(/NXP-000001/);
    expect(productionSources).toMatch(/NXP-000002/);
    expect(productionSources).toMatch(/NXP-000003/);
    expect(productionSources).not.toMatch(/PD-P0-FABRY-INTENT-001|maladie de Fabry/i);
  });

  it("does not expose the Fabry P0 intent on an existing public page", () => {
    expect(productionSources).not.toContain(String(fixture.intent));
  });

  it("never imports or executes the Fabry P0 fixture", () => {
    expect(productionSources).not.toMatch(/fabry-p0\.fixture|fixtures\/fabry-p0/i);
  });

  it("does not couple the Fabry candidate to the Editorial Engine", () => {
    expect(JSON.stringify(fixture)).not.toMatch(/editorial[- ]engine/i);
  });

  it("contains no PACS, DICOM or PixelData access in the Fabry candidate", () => {
    expect(JSON.stringify(fixture)).not.toMatch(/pacs|dicom|pixeldata/i);
  });

  it("does not load a Reasoning Book or simulate C-KNOW for Fabry", () => {
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

  it("contains no protocol, recommendation, biomarker, proof or expected result in Fabry", () => {
    expect(Object.keys(fixture).join(" ")).not.toMatch(/protocol|recommendation|biomarker|biomarkeur|proof|evidence|expected.?result/i);
  });

  it("does not claim a PD-011 scientific validation for Fabry", () => {
    expect(fixture.implementationStatus).toBe("NOT_IMPLEMENTED");
    expect(JSON.stringify(fixture)).not.toMatch(/pass|evaluated_under_pd011/i);
  });

  it("creates no Gate or Stop business object for Fabry", () => {
    expect(Object.keys(fixture)).not.toContain("Gate");
    expect(Object.keys(fixture)).not.toContain("Stop");
  });

  it("continues to reserve scientific navigation to PD-009", () => {
    expect(readmeSource).toContain("PD-009 est l’unique autorité sur la navigation scientifique");
    expect(readmeSource).toContain("Aucun rôle PD-005 ne possède la prochaine action scientifique");
    expect(readmeSource).toContain("La fixture Fabry P0 reste inchangée");
  });
});
