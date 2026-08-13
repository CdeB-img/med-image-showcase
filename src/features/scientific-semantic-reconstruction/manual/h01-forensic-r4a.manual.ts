/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { applyCriticRepairs, buildSemanticCoverage } from "../coverage";
import { parseSemanticCriticResult, parseSemanticReconstructionCandidate } from "../schema";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, type SemanticConversationMessage } from "../types";

const ROOT = process.cwd();
const R4_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r4");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r4a");
const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const writeJson = (name: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const target = path.join(DIRECTORY, name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const providerJson = (name: string) => {
  const artifact = readJson<any>(path.join(R4_DIRECTORY, "raw-provider-responses", name));
  const response = JSON.parse(artifact.rawStructuredResponse);
  return JSON.parse(response.candidates[0].content.parts.map((part: any) => part.text ?? "").join(""));
};

const caseArtifact = readJson<any>(path.join(R4_DIRECTORY, "cases/SEM-H01.json"));
const candidate = parseSemanticReconstructionCandidate(providerJson("0001-SEM-H01-reconstruction-t1-c0.json"));
const critic1 = parseSemanticCriticResult(providerJson("0002-SEM-H01-critic-t1-c1.json"));
const critic2 = parseSemanticCriticResult(providerJson("0003-SEM-H01-critic-t1-c2.json"));
const messages: SemanticConversationMessage[] = caseArtifact.originalRequest.map((content: string, index: number) => ({
  messageId: `SEM-H01:user:${index + 1}`,
  role: "USER",
  content,
  createdAt: `2026-08-12T21:01:${String(index).padStart(2, "0")}.000Z`,
}));
const request = { schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: "sem-001r4a:SEM-H01", language: "fr" as const, messages, previousModel: null };
const initialCoverage = buildSemanticCoverage(request, candidate);
const afterCritic1 = applyCriticRepairs(request, candidate, critic1.proposedRepairs);
const coverageAfterCritic1 = buildSemanticCoverage(request, afterCritic1.candidate);
const afterCritic2 = applyCriticRepairs(request, afterCritic1.candidate, critic2.proposedRepairs);
const coverageAfterCritic2 = buildSemanticCoverage(request, afterCritic2.candidate);
const relation = (value: any, id: string) => value.relations.entries.find((entry: any) => entry.inventoryRelationId === id);

const comparison = candidate.relations.find((item) => item.relationType === "COMPARES_WITH");
const characterization = candidate.relations.find((item) => item.relationType === "OBSERVES");
const critic1Repair = critic1.proposedRepairs.find((item) => item.action === "UPSERT_RELATION");
const critic2Repair = critic2.proposedRepairs.find((item) => item.action === "UPSERT_RELATION");
const elementById = new Map(candidate.elements.map((item) => [item.clientElementId, item]));
const evidenceChecks = [
  { contract: "Direct scientific comparison preserved", pass: Boolean(comparison), evidence: comparison ?? null },
  { contract: "Characterization target preserved", pass: Boolean(characterization), evidence: characterization ?? null },
  { contract: "Relational operator is carried by comparison", pass: candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "item-2")?.localRole === "relation" && comparison?.inventoryRelationIds.includes("rel-1"), evidence: { fragment: candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "item-2"), comparison } },
  { contract: "Critic failure is rel-2 only", pass: relation(initialCoverage, "rel-2")?.coverageStatus === "EXPLICIT_RELATION_UNMAPPED" && initialCoverage.relations.entries.filter((entry) => entry.coverageStatus !== "MAPPED").length === 1, evidence: relation(initialCoverage, "rel-2") },
  { contract: "Critic repair endpoint is not a comparison node", pass: elementById.get(critic1Repair?.relationTargetClientElementId ?? "")?.canonicalMeaning === "ADC cortical", evidence: { repairTarget: critic1Repair?.relationTargetClientElementId, actualElement: elementById.get(critic1Repair?.relationTargetClientElementId ?? "") ?? null } },
  { contract: "Cycle 1 repair does not close rel-2", pass: relation(coverageAfterCritic1, "rel-2")?.coverageStatus === "EXPLICIT_RELATION_UNMAPPED", evidence: { diagnostics: afterCritic1.diagnostics, relationCoverage: relation(coverageAfterCritic1, "rel-2") } },
  { contract: "Cycle 2 repair does not close rel-2", pass: relation(coverageAfterCritic2, "rel-2")?.coverageStatus === "EXPLICIT_RELATION_UNMAPPED", evidence: { diagnostics: afterCritic2.diagnostics, relationCoverage: relation(coverageAfterCritic2, "rel-2") } },
  { contract: "No Gold used", pass: true, evidence: "Only persisted USER/provider artifacts and deterministic SEM functions were loaded." },
];
if (!evidenceChecks.every((item) => item.pass)) throw new Error("SEM001R4A_FORENSIC_EVIDENCE_INCOMPLETE");

writeJson("h01-forensic-classification-before-repair.json", {
  campaign: "SEM-001R4A",
  caseId: "SEM-H01",
  performedAt: new Date().toISOString(),
  goldUsedForProductDecision: false,
  originalRequest: caseArtifact.originalRequest,
  source: { messages, digest: logicalDigest(messages) },
  observedSemanticGraph: {
    normalizedMeaning: candidate.normalizedMeaning,
    inventory: candidate.semanticInventory,
    elements: candidate.elements,
    relations: candidate.relations,
    interpretation: {
      comparison: "The direct explicit comparison between the two scientific measures is present.",
      characterizationTarget: "The characterization operation and graft target are present through a direct OBSERVES edge.",
      composition: "The candidate-level normalized meaning composes comparison and characterization without requiring a relation-as-node or a redundant intent-to-comparison edge.",
    },
  },
  criticExpectation: {
    inventoryRelationId: "rel-2",
    construction: "framing intent -> functional comparison operator",
    cycle1: { verdict: critic1.verdict, issue: critic1.issues, repair: critic1Repair },
    cycle2: { verdict: critic2.verdict, issue: critic2.issues, repair: critic2Repair },
    mismatch: "Both repairs target the ADC element as though it were a comparison node; the functional comparison fragment is actually carried by the direct COMPARES_WITH edge.",
  },
  semanticInformationActuallyMissing: false,
  firstDivergentStage: "DETERMINISTIC_RELATION_COVERAGE",
  failureClass: "RELATION_COVERAGE_FALSE_POSITIVE",
  recommendedOwner: "DETERMINISTIC_RELATION_COVERAGE",
  classificationChoice: "B — relation already represented but not recognized by deterministic relation coverage, causing the critic to overconstrain the graph",
  chain: {
    source: caseArtifact.originalRequest,
    inventory: candidate.semanticInventory,
    elements: candidate.elements,
    relations: candidate.relations,
    critic1,
    repair1: { diagnostics: afterCritic1.diagnostics, candidate: afterCritic1.candidate, relationCoverage: coverageAfterCritic1.relations },
    critic2,
    repair2: { diagnostics: afterCritic2.diagnostics, candidate: afterCritic2.candidate, relationCoverage: coverageAfterCritic2.relations },
    failure: caseArtifact.error,
  },
  evidenceChecks,
});
console.log(JSON.stringify({
  decision: "R4A_FORENSIC_COMPLETE_BEFORE_PRODUCT_REPAIR",
  caseId: "SEM-H01",
  classification: "RELATION_COVERAGE_FALSE_POSITIVE",
  firstDivergentStage: "DETERMINISTIC_RELATION_COVERAGE",
  owner: "DETERMINISTIC_RELATION_COVERAGE",
  llmCalls: 0,
}, null, 2));
