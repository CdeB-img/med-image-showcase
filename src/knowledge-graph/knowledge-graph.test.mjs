import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  biomarkerProfileShape,
  createKnowledgeGraphReport,
  entities,
  entityFamilies,
  evidenceStatuses,
  hasDirectedCycle,
  knowledgeGraphAuthority,
  protocolShape,
  registries,
  relationDefinitions,
  relationTypes,
  relations,
  sources,
  validateKnowledgeGraph,
} from "./index.mjs";
import { withoutAuthorizedProductChanges } from "../test/p12-protected-surfaces.mjs";

const root = process.cwd();

describe("NOXIA canonical radiology knowledge graph", () => {
  it("loads every canonical entity family and registry", () => {
    expect(knowledgeGraphAuthority.canonicalSourceOfTruth).toBe(true);
    expect(entityFamilies).toHaveLength(34);
    for (const family of entityFamilies) expect(typeof family).toBe("string");
    for (const name of ["knowledge-graph", "entities", "relations", "taxonomy", "publications", "protocols", "biomarkers", "equipment", "manufacturers", "pathologies", "modalities", "workflows", "standards", "sources", "evidence", "synonyms", "constraints"]) {
      expect(registries[name]).toBeDefined();
      expect(registries[name].version).toBe("1.0.0");
      expect(registries[name].entryCount).toBeTypeOf("number");
    }
  });

  it("validates immutable identities, provenance, evidence statuses and source files", () => {
    const validation = validateKnowledgeGraph({ root });
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(entities).toHaveLength(118);
    expect(new Set(entities.map((entity) => entity.entityId)).size).toBe(entities.length);
    for (const entity of entities) {
      expect(entity.entityId).toMatch(/^noxia:radiology:/u);
      expect(entity.createdFrom).toBe(entity.sourceRefs[0]);
      expect(evidenceStatuses).toContain(entity.evidenceStatus);
    }
    for (const source of sources) expect(existsSync(join(root, source.path))).toBe(true);
  });

  it("keeps every relation typed, sourced, versioned and resolvable", () => {
    expect(new Set(relations.map((relation) => relation.relationId)).size).toBe(relations.length);
    const entityIds = new Set(entities.map((entity) => entity.entityId));
    for (const relation of relations) {
      expect(relationTypes).toContain(relation.relationType);
      expect(relationDefinitions[relation.relationType]).toBeDefined();
      expect(entityIds).toContain(relation.sourceId);
      expect(entityIds).toContain(relation.targetId);
      expect(relation.sourceRefs.length).toBeGreaterThan(0);
      expect(relation.version).toBe("1.0.0");
    }
  });

  it("keeps the protocol and equipment models declarative without inventing records", () => {
    expect(registries.protocols.entryCount).toBe(0);
    expect(registries.equipment.entryCount).toBe(0);
    expect(registries.manufacturers.entryCount).toBe(0);
    expect(protocolShape).toEqual([
      "modalityIds", "orderedSequenceIds", "duration", "preparation", "indicationIds", "contraindicationIds", "measurementIds", "biomarkerIds", "diseaseIds", "publicationIds",
    ]);
  });

  it("derives complete biomarker profile fields from canonical relations", () => {
    const profiles = registries.biomarkers.entries.profiles;
    expect(Object.keys(profiles)).toHaveLength(registries.biomarkers.entryCount);
    for (const profile of Object.values(profiles)) for (const field of biomarkerProfileShape) expect(profile).toHaveProperty(field);
  });

  it("retains publication fields without manufacturing missing DOI, PMID or author data", () => {
    for (const publication of registries.publications.entries) {
      expect(publication.properties).toHaveProperty("doi");
      expect(publication.properties).toHaveProperty("pmid");
      expect(publication.properties).toHaveProperty("authors");
      expect(publication.properties).toHaveProperty("journal");
      expect(publication.properties).toHaveProperty("year");
      expect(publication.properties).toHaveProperty("publicationType");
      expect(publication.properties).toHaveProperty("evidenceLevel");
    }
  });

  it("generates the JSON report with exact coverage counts", () => {
    const report = createKnowledgeGraphReport({ root });
    expect(report).toMatchObject({ entityFamilyCount: 34, entityCount: 118, relationCount: 93, constraintCount: 13, publicationCount: 9 });
    expect(report.validation.valid).toBe(true);
    expect(report.coverage.incompleteFamilies).toEqual(expect.arrayContaining(["Manufacturer", "Equipment", "Protocol", "Dataset"]));
  });

  it("detects cycles in structural relations while the canonical graph remains acyclic", () => {
    expect(hasDirectedCycle(relations.filter((relation) => relation.relationType === "PART_OF"))).toBe(false);
    expect(hasDirectedCycle([
      { sourceId: "a", targetId: "b" },
      { sourceId: "b", targetId: "a" },
    ])).toBe(true);
  });

  it("does not couple the graph to SEO, editorial output, SaaS or unauthorized application routes", () => {
    const graphFiles = execFileSync("rg", ["--files", "src/knowledge-graph"], { cwd: root, encoding: "utf8" }).trim().split("\n");
    expect(graphFiles.every((file) => !file.endsWith(".md"))).toBe(true);
    const graphSource = graphFiles.map((file) => readFileSync(join(root, file), "utf8")).join("\n");
    expect(graphSource).not.toMatch(/from\s+["'][^"']*(?:openlater|editorial-engine|supabase|stripe)[^"']*["']/iu);
    const protectedChanges = execFileSync("git", ["diff", "--name-only", "--", "src/App.tsx", "src/pages", "src/components", "public/sitemap.xml", "public/robots.txt"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    expect(withoutAuthorizedProductChanges(protectedChanges)).toEqual([]);
    const protocolDesignerSource = ["src/pages/ProtocolDesigner.tsx", "src/pages/ProtocolDesignerDemo.tsx"]
      .map((file) => readFileSync(join(root, file), "utf8"))
      .join("\n");
    expect(protocolDesignerSource).not.toMatch(/from\s+["'][^"']*knowledge-graph[^"']*["']/iu);
    expect(graphFiles.every((file) => !relative("src/knowledge-graph", file).startsWith(".."))).toBe(true);
  });
});
