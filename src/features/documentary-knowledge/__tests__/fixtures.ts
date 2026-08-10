import { stableFactId } from "../canonical";
import type { DocumentaryFact, PatternEvidence, PatternOrigin, PatternSourceReference } from "../types";

export const TEST_SOURCE: PatternSourceReference = {
  sourceId: "SRC-TEST-DERIVED",
  corpusId: "DOC-TEST",
  artifactPath: "_intelligence/test-derived-output.json",
  artifactVersion: "1.0",
  artifactDigest: "sha256-test-derived-output",
  sourceKind: "DERIVED_INTELLIGENCE",
  authorityBoundary: "EVIDENCE_ONLY_NOT_AUTHORITY",
};

export const evidence = (input: Partial<PatternEvidence> & Pick<PatternEvidence, "evidenceId">): PatternEvidence => ({
  evidenceId: input.evidenceId,
  sourceId: input.sourceId ?? TEST_SOURCE.sourceId,
  locator: input.locator ?? input.evidenceId,
  observation: input.observation ?? "Observation documentaire abstraite.",
  sourceDocumentRefs: input.sourceDocumentRefs ?? ["DOC-TEST-001"],
  familyRef: input.familyRef ?? "TEST_FAMILY",
  projectRef: input.projectRef ?? null,
  institutionRef: input.institutionRef ?? null,
  extractedFactIds: input.extractedFactIds ?? [],
});

export const fact = (input: Partial<DocumentaryFact> & Pick<DocumentaryFact, "behaviorKey" | "name">): DocumentaryFact => {
  const sourceIds = input.sourceIds ?? [TEST_SOURCE.sourceId];
  const factId = input.factId ?? stableFactId(sourceIds.join("|"), input.behaviorKey);
  const factEvidence = (input.evidence ?? [evidence({ evidenceId: `E-${factId}`, extractedFactIds: [factId] })])
    .map((item) => ({ ...item, extractedFactIds: item.extractedFactIds.length ? item.extractedFactIds : [factId] }));
  return {
    factId,
    behaviorKey: input.behaviorKey,
    name: input.name,
    description: input.description ?? "Comportement de travail réutilisable et contextualisé.",
    category: input.category ?? "Workflow",
    origin: input.origin ?? "DOCUMENTARY_CORPUS",
    scope: input.scope ?? "Contexte explicite",
    inputs: input.inputs ?? ["Entrée sourcée"],
    actions: input.actions ?? ["Qualifier", "Tracer", "Soumettre à revue"],
    outputs: input.outputs ?? ["Sortie candidate"],
    evidence: factEvidence,
    variants: input.variants ?? [],
    limitations: input.limitations ?? ["Aucune autorité ni décision n’est créée."],
    sourceIds,
    extractedAt: input.extractedAt ?? "2026-08-10",
    relatedBehaviorKeys: input.relatedBehaviorKeys ?? [],
  };
};

export const originFact = (origin: PatternOrigin, key = origin) => fact({ behaviorKey: `origin:${key}`, name: `Pattern ${origin}`, origin });
