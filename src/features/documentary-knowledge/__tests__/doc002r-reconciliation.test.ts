import { describe, expect, it } from "vitest";
import reconciliation from "../../../../documentary-pattern-corpus/doc-002/documentary-pattern-reconciliation.json";
import evidenceClosure from "../../../../reference-corpus/reference-corpus-01/documentary-evidence-closure-01.json";
import { DOCUMENTARY_PATTERN_CATALOG } from "..";

const patternNamed = (name: string) => {
  const pattern = DOCUMENTARY_PATTERN_CATALOG.patterns.find((item) => item.name === name);
  expect(pattern, name).toBeDefined();
  return pattern!;
};

describe("DOC002R — réconciliation additive et preuves documentaires liées", () => {
  it("préserve intégralement les 120 patterns DOC-002 antérieurs", () => {
    expect(reconciliation.identityIntegrity.identityRegressionCount).toBe(0);
    expect(reconciliation.identityIntegrity.observedLegacyPatternCount).toBe(120);
    expect(reconciliation.identityIntegrity.observedLegacyPatternIdsSha256).toBe(reconciliation.identityIntegrity.expectedLegacyPatternIdsSha256);
    expect(reconciliation.identityIntegrity.observedLegacyPatternRecordsSha256).toBe(reconciliation.identityIntegrity.expectedLegacyPatternRecordsSha256);
    expect(reconciliation.newPatternIds).toHaveLength(12);
  });

  it("cas A — représente une frontière protocole/document spécialisé sans règle universelle", () => {
    const pattern = patternNamed("Allocation contextualisée du niveau de détail entre protocole et document spécialisé");
    expect(pattern.status).toBe("SUPPORTED_BY_MULTIPLE_FAMILIES");
    expect(pattern.variants.map((item) => item.name)).toEqual(expect.arrayContaining([
      "Maître vers domaine STEP",
      "Protocole et manuel SPRINT",
      "Protocole, SOP et SAP ORCHID",
    ]));
    expect(pattern.limitations.join(" ")).toMatch(/Aucune famille documentaire.*autre étude/);
  });

  it("cas B — conserve un nombre de lecteurs absent comme omission non interprétée", () => {
    const pattern = patternNamed("Omission documentaire non interprétée");
    const variant = pattern.variants.find((item) => item.name === "Nombre de lecteurs non documenté");
    expect(variant?.kind).toBe("UNRESOLVED_VARIANT");
    expect(variant?.limitations.join(" ")).toMatch(/Ne pas qualifier automatiquement.*report intentionnel/);
  });

  it("cas C — réserve le report intentionnel aux références spécialisées explicites", () => {
    const pattern = patternNamed("Report explicite du détail vers un document spécialisé");
    expect(pattern.evidence.map((item) => item.projectRef)).toEqual(expect.arrayContaining(["STEP", "REMAP_CAP", "PRACTICAL"]));
    expect(pattern.limitations.join(" ")).toMatch(/Sans référence explicite.*omission non interprétée/);
    expect(pattern.relationships.some((item) => item.type === "SPECIALIZES")).toBe(true);
  });

  it("cas D — conserve la chaîne SPRINT exacte sans SAP ni DMP autonomes", () => {
    const variablePattern = patternNamed("Continuité documentaire des variables au sein d'une même étude");
    expect(variablePattern.evidence.map((item) => item.familyRef)).toEqual(expect.arrayContaining(["PROTOCOL", "CRF", "DATA_DICTIONARY"]));
    expect(variablePattern.evidence.every((item) => item.projectRef === "SPRINT")).toBe(true);
    const incomplete = patternNamed("Famille documentaire liée mais incomplète");
    const sprint = incomplete.variants.find((item) => item.name === "Famille SPRINT");
    expect(sprint?.description).toMatch(/Protocol, CRF, Data Dictionary et MOP/);
    expect(sprint?.limitations.join(" ")).toMatch(/Pas de DMP ni SAP autonomes/);
  });

  it("cas E — sépare l’analytique et l’opérationnel ORCHID sans inventer CRF ou DMP", () => {
    const analysis = patternNamed("Séparation du cadre protocolaire et du plan d'analyse");
    expect(analysis.evidence.some((item) => item.projectRef === "ORCHID" && item.familyRef === "PROTOCOL_AND_SAP")).toBe(true);
    const operations = patternNamed("Allocation des procédures et workflows data dans des artefacts liés");
    expect(operations.evidence.some((item) => item.projectRef === "ORCHID" && item.familyRef === "PROTOCOL_AND_SOP")).toBe(true);
    const orchid = patternNamed("Famille documentaire liée mais incomplète").variants.find((item) => item.name === "Famille ORCHID");
    expect(orchid?.limitations.join(" ")).toMatch(/Pas de CRF ni DMP autonomes/);
  });

  it("cas F — conserve trois variantes de modularité avec provenance de plateforme", () => {
    const pattern = patternNamed("Modularité documentaire maître–domaine–intervention");
    expect(pattern.variants).toHaveLength(3);
    expect(new Set(pattern.evidence.map((item) => item.projectRef))).toEqual(new Set(["STEP", "REMAP_CAP", "PRACTICAL"]));
    expect(pattern.limitations.join(" ")).toMatch(/Chaque plateforme conserve sa propre architecture/);
  });

  it("cas G — préserve versions et amendement sans propager un changement non prouvé", () => {
    const version = patternNamed("Succession documentaire versionnée explicitement");
    expect(version.limitations.join(" ")).toMatch(/Aucun artefact aval.*sans preuve propre/);
    expect(reconciliation.versionRelationships).toHaveLength(9);
    const amendment = patternNamed("Groupement explicite des documents affectés par un amendement");
    expect(amendment.evidence[0].projectRef).toBe("PRINCIPLE");
    expect(amendment.limitations.join(" ")).toMatch(/ni approbation ni preuve de supersession/);
  });

  it("cas H — les pratiques CIC/locales antérieures restent locales", () => {
    const local = DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "LOCAL_PRACTICE");
    expect(local).toHaveLength(37);
    expect(local.every((pattern) => pattern.status === "LOCAL_PRACTICE")).toBe(true);
  });

  it("cas I — la guidance externe antérieure reste une référence non obligatoire", () => {
    const external = DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "EXTERNAL_REFERENCE");
    expect(external).toHaveLength(1);
    expect(external[0].status).toBe("EXTERNAL_REFERENCE");
    expect(JSON.stringify(external)).not.toMatch(/LEGAL_MANDATORY|REGULATORY_MANDATORY|APPROVED_BY/);
  });

  it("cas J — conserve 27 enveloppes de preuve distante sans binaire ni fausse readiness", () => {
    const sources = DOCUMENTARY_PATTERN_CATALOG.sourceCatalog.filter((source) => source.sourceKind === "REFERENCE_CORPUS_DERIVED_EVIDENCE");
    expect(sources).toHaveLength(27);
    expect(sources.every((source) => source.contentAvailabilityState === "CONTENT_ACCESSIBLE_NOT_STORED")).toBe(true);
    expect(sources.every((source) => source.artifactDigestScope === "METADATA_AND_AUTHORIZED_DERIVED_EVIDENCE_ONLY")).toBe(true);
    expect(sources.every((source) => source.rights?.repositoryCommitAllowed !== "YES")).toBe(true);
    expect(sources.every((source) => source.contentEvidence?.transientBinarySha256 === null)).toBe(true);
    expect(sources.every((source) => source.artifactPath === "reference-corpus/reference-corpus-01/documentary-evidence-closure-01.json")).toBe(true);
    expect(reconciliation.sourceAccess.runtimeContentReadyCount).toBe(0);
    expect(reconciliation.sourceAccess.sectionIndexReadyCount).toBe(0);
    expect(reconciliation.sourceAccess.reproducibleLocalContentReadyCount).toBe(0);
  });

  it("préserve exactement les identités et provenances RC01 sans les ré-posséder", () => {
    const sources = DOCUMENTARY_PATTERN_CATALOG.sourceCatalog.filter((source) => source.sourceKind === "REFERENCE_CORPUS_DERIVED_EVIDENCE");
    const closureBySourceId = new Map(evidenceClosure.ARTIFACTS.map((artifact) => [artifact.SOURCE_ID, artifact]));
    expect(sources.map((source) => source.sourceId).sort()).toEqual([...closureBySourceId.keys()].sort());
    sources.forEach((source) => {
      const artifact = closureBySourceId.get(source.sourceId)!;
      expect(source.referenceSourceId).toBe(artifact.SOURCE_ID);
      expect(source.artifactId).toBe(artifact.ARTIFACT_ID);
      expect(source.studyId).toBe(artifact.STUDY_ID);
      expect(source.artifactVersion).toBe(artifact.VERSION);
      expect(source.officialUrl).toBe(artifact.OFFICIAL_URL);
      expect(source.retrievedAt).toBe(artifact.RETRIEVAL_DATE);
      expect(source.authorityBoundary).toBe("EVIDENCE_ONLY_NOT_AUTHORITY");
    });
  });

  it("prépare une projection de benchmark sans exécuter de transposition", () => {
    expect(reconciliation.platformBenchmark.status).toBe("PREPARED_NOT_EXECUTED");
    expect(reconciliation.platformBenchmark.imagingTransposition).toBe("PLANNED_NOT_EXECUTED");
    expect(reconciliation.platformBenchmark.futureTarget).toBe("FUNCTIONALLY_EQUIVALENT_OR_BETTER_DOCUMENT_SET");
    expect(reconciliation.platformBenchmark.platforms.map((item) => item.name)).toEqual(["STEP", "REMAP_CAP", "PRINCIPLE", "PRACTICAL", "I_SPY_2"]);
    expect(reconciliation.platformBenchmark.platforms.find((item) => item.name === "I_SPY_2")?.doc002rSourceReady).toBe("PARTIAL");
  });
});
