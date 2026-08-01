import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { noxiaEditorialAdapter } from "./adapter.mjs";
import { engineEntries, buildPilotTestSitemap, planNoxiaPilotPublication, resolveEditorialPreview, runNoxiaPilot } from "./engine.mjs";
import { pilotEntities, sourceCatalog } from "./catalog.mjs";
import { EditorialPilotTemplate } from "./EditorialPilotTemplates";
import { validateNoxiaPilot } from "./validate.mjs";

const root = process.cwd();

describe("NOXIA editorial-engine pilot", () => {
  it("loads the standalone core through the product adapter", () => {
    const result = runNoxiaPilot();
    expect(result.validation.valid).toBe(true);
    expect(noxiaEditorialAdapter.productId).toBe("noxia-imagerie");
  });

  it("keeps the generic core independent of product and legacy consumer imports", () => {
    const engineRoot = path.resolve(root, "../../editorial-engine");
    const output = execFileSync(process.execPath, ["scripts/verify-independence.mjs"], { cwd: engineRoot, encoding: "utf8" });
    expect(output).toContain("Independence verification passed");
    const adapterSource = fs.readFileSync(path.join(root, "src/editorial/adapter.mjs"), "utf8");
    expect(adapterSource.toLowerCase()).not.toContain("openlater");
  });

  it("validates the sourced 12-object business registry and the 8 pilot projections", () => {
    const validation = validateNoxiaPilot(root);
    expect(validation).toMatchObject({ valid: true, entityCount: 12, projectionCount: 8, routeCount: 8 });
    expect(new Set(pilotEntities.map((item) => item.entityId)).size).toBe(pilotEntities.length);
    expect(sourceCatalog).toHaveLength(9);
  });

  it("keeps public routes canonical and excludes private routes", () => {
    const result = runNoxiaPilot();
    expect(Object.keys(result.routing.routes)).toHaveLength(8);
    expect(Object.keys(result.routing.routes)).not.toContain("/admin/");
    for (const entry of engineEntries) expect(entry.metadata.canonical).toBe(`https://noxia-imagerie.fr${entry.path}`);
  });

  it("keeps the production sitemap empty while generating a separate deterministic test sitemap", () => {
    expect(runNoxiaPilot().sitemap.urls).toEqual([]);
    expect(buildPilotTestSitemap().urls).toEqual([...buildPilotTestSitemap().urls].sort());
    expect(buildPilotTestSitemap().urls).toHaveLength(8);
  });

  it("does not make any projection publishable and returns a noindex editorial 404", () => {
    expect(planNoxiaPilotPublication().publishable).toEqual([]);
    expect(resolveEditorialPreview("/missing-editorial-preview")).toEqual({ notFound: true, robots: "noindex, nofollow" });
  });

  it("renders representative hub, guide, technical sheet and workflow templates without touching routes", () => {
    for (const id of ["pilot-irm-hub", "pilot-ecv-guide", "pilot-dicom-technical", "pilot-corelab-workflow"]) {
      const entry = engineEntries.find((item) => item.id === id)!;
      const { unmount } = render(<EditorialPilotTemplate entry={entry} />);
      expect(screen.getByRole("heading", { name: entry.metadata.title })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Contacter NOXIA" })).toHaveAttribute("href", "/contact");
      unmount();
    }
  });

  it("leaves viewers and application surfaces outside the change set", () => {
    const changedComponents = execFileSync("git", ["diff", "--name-only", "--", "src/components"], { cwd: root, encoding: "utf8" });
    expect(changedComponents.trim()).toBe("");
    const editorialSource = fs.readFileSync(path.join(root, "src/editorial/engine.mjs"), "utf8");
    expect(editorialSource).not.toMatch(/supabase|stripe|auth/iu);
  });
});
