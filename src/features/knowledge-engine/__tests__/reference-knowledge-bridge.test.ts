import { describe, expect, it } from "vitest";
import { createHash } from "../browser-crypto";
import { executeKnowledgeEngine } from "../engine";
import { createKnowledgeOwnerHandoff } from "../knowledge-owner-handoff";
import { createKnowledgeRequest } from "../knowledge-request";
import { getKnowledgeProvider } from "../provider-registry";
import { listReferenceSourceSnapshots, resolveReferenceSourceSnapshot } from "../reference-corpus";
import type { KnowledgeResult, ReferenceKnowledgeOwner } from "../types";

const knowledgeResult = (input: {
  needId: string;
  needClass: string;
  owner: ReferenceKnowledgeOwner;
  sourcePreferences?: string[];
  question?: string;
  jurisdictionTarget?: string;
  includeHistorical?: boolean;
  projectBound?: boolean;
}): KnowledgeResult => executeKnowledgeEngine({
  originalQuestion: input.question ?? input.needClass.replace(/_/g, " ").toLocaleLowerCase("en"),
  scientificObjectTerms: [{ term: input.question ?? input.needClass.replace(/_/g, " ") }],
  consumer: "KNOWLEDGE_ENGINE_TEST",
  context: input.jurisdictionTarget ? { jurisdiction: input.jurisdictionTarget } : undefined,
  researchProjectId: input.projectBound ? "project:reference-bridge" : undefined,
  researchProjectVersion: input.projectBound ? "project-version:v1" : undefined,
  researchProjectDigest: input.projectBound ? "project-digest:v1" : undefined,
  referenceNeed: {
    needId: input.needId,
    needClass: input.needClass,
    owner: input.owner,
    sourcePreferences: input.sourcePreferences ?? [],
    jurisdictionTarget: input.jurisdictionTarget,
    includeHistorical: input.includeHistorical ?? false,
    maxSources: input.sourcePreferences?.length ?? 5,
    maxSectionsPerSource: 2,
  },
  createdAt: "2026-09-03T00:00:00.000Z",
});

describe("REFERENCE-KNOWLEDGE-BRIDGE-01 — corpus visibility and anchoring", () => {
  it("CASE A resolves the accepted RC01 registry and provider without a second Knowledge engine", () => {
    const snapshot = resolveReferenceSourceSnapshot("RC01-A-016");
    const snapshots = listReferenceSourceSnapshots();
    expect(snapshots).toHaveLength(89);
    expect(snapshots.filter((item) => item.contentAvailability === "METADATA_ONLY")).toHaveLength(82);
    expect(snapshots.filter((item) => item.contentAvailability === "SECTION_INDEXED")).toHaveLength(7);
    expect(snapshot).toMatchObject({ sourceId: "RC01-A-016", contentAvailability: "SECTION_INDEXED", externalAuthorityStatus: "EXTERNAL_REFERENCE_NOT_NOXIA_AUTHORITY" });
    expect(getKnowledgeProvider("reference-corpus-01")).toMatchObject({ type: "REFERENCE_CORPUS", adapterId: "reference-corpus-adapter-v1", status: "CURRENT_CANDIDATE" });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot?.uncertainties)).toBe(true);
  });

  it("CASE B keeps a remote-only source metadata-only and emits no content assertion", () => {
    const result = knowledgeResult({ needId: "OKC01-N-001", needClass: "SOURCE_IDENTITY_VERSION_AND_STATUS", owner: "KNOWLEDGE", sourcePreferences: ["RC01-A-001"], question: "ICH E6 identity version and status" });
    expect(result.referenceSourceSnapshots).toHaveLength(1);
    expect(result.referenceSourceSnapshots[0]).toMatchObject({ sourceId: "RC01-A-001", contentAvailability: "METADATA_ONLY" });
    expect(result.referenceEvidenceCandidates).toHaveLength(0);
    expect(result.applicableAssertions).toHaveLength(0);
    expect(result.documentaryStatements).toHaveLength(0);
    expect(result.gaps.map((gap) => gap.code)).toContain("MISSING_SOURCE_ACCESS");
  });

  it("CASE C exposes local document identity, digest, and reconstructible deterministic anchors", () => {
    const result = knowledgeResult({ needId: "OKC01-N-003", needClass: "ANCHORED_CLAIM_AND_DOCUMENTARY_STATEMENT", owner: "KNOWLEDGE", sourcePreferences: ["RC01-A-018"], question: "adaptive designs interim analyses clinical trials" });
    const candidate = result.referenceEvidenceCandidates[0];
    expect(result.referenceSourceSnapshots[0]).toMatchObject({ sourceId: "RC01-A-018", localDigest: "c8b48547036f69ad95b4aac55510bd0c37ead058dd35dbc7cd0c15085e371a89", contentAvailability: "SECTION_INDEXED" });
    expect(candidate).toBeDefined();
    expect(candidate.candidateIsGovernedAssertion).toBe(false);
    expect(candidate.projectWriteAuthorized).toBe(false);
    expect(candidate.anchor.locator).toContain(`page ${candidate.anchor.page}`);
    expect(createHash("sha256").update(candidate.exactTextExcerpt).digest("hex")).toBe(candidate.anchor.exactContentDigest);
    expect(result.trace.events.map((event) => event.operation)).toEqual(expect.arrayContaining(["RESOLVE_REFERENCE_SOURCE", "RESOLVE_REFERENCE_SECTION", "EMIT_REFERENCE_RESULT"]));
  });

  it("CASE C2 exposes newly acquired CTR and diagnostic-test content through the unchanged bridge", () => {
    const ctr = knowledgeResult({ needId: "OKC01-N-063", needClass: "SUBSTANTIAL_MODIFICATION_AND_RESPONSIBILITIES", owner: "REG", sourcePreferences: ["RC01-A-023"], question: "clinical trial substantial modification submission" });
    const diagnostic = knowledgeResult({ needId: "OKC01-N-043", needClass: "PRECISION_OBSERVATIONAL_CLUSTER_AND_DIAGNOSTIC_DIMENSIONING", owner: "BIOSTATISTICS", sourcePreferences: ["RC01-B-035"], question: "diagnostic accuracy confidence interval precision" });
    expect(ctr.referenceSourceSnapshots[0]).toMatchObject({ sourceId: "RC01-A-023", contentAvailability: "SECTION_INDEXED", documentVersion: "Version 7.2" });
    expect(diagnostic.referenceSourceSnapshots[0]).toMatchObject({ sourceId: "RC01-B-035", contentAvailability: "SECTION_INDEXED", documentVersion: "Final guidance" });
    expect(ctr.referenceEvidenceCandidates.length).toBeGreaterThan(0);
    expect(diagnostic.referenceEvidenceCandidates.length).toBeGreaterThan(0);
    expect(ctr.referenceEvidenceCandidates.every((candidate) => candidate.anchor.sourceId === "RC01-A-023")).toBe(true);
    expect(diagnostic.referenceEvidenceCandidates.every((candidate) => candidate.anchor.sourceId === "RC01-B-035")).toBe(true);
  });

  it("CASE D fails closed for unknown identities and rejects path-shaped source input", () => {
    const unknown = knowledgeResult({ needId: "OKC01-N-001", needClass: "SOURCE_IDENTITY_VERSION_AND_STATUS", owner: "KNOWLEDGE", sourcePreferences: ["RC01-A-999"], question: "source identity version status" });
    expect(unknown.referenceSourceSnapshots).toHaveLength(0);
    expect(unknown.referenceEvidenceCandidates).toHaveLength(0);
    expect(unknown.providerExecutions.find((execution) => execution.providerId === "reference-corpus-01")?.diagnostics).toContain("REFERENCE_SOURCE_NOT_FOUND_FAIL_CLOSED");
    expect(() => createKnowledgeRequest({
      originalQuestion: "source identity version status",
      scientificObjectTerms: [{ term: "source identity" }],
      referenceNeed: { needId: "OKC01-N-001", needClass: "SOURCE_IDENTITY_VERSION_AND_STATUS", owner: "KNOWLEDGE", sourcePreferences: ["../../etc/passwd"] },
    })).toThrow();
  });
});

describe("REFERENCE-KNOWLEDGE-BRIDGE-01 — jurisdiction, time, and source class", () => {
  it("CASE E preserves FDA methodological relevance without creating a French requirement", () => {
    const result = knowledgeResult({ needId: "OKC01-N-002", needClass: "CONTEXT_APPLICABILITY_AND_JURISDICTION", owner: "KNOWLEDGE", sourcePreferences: ["RC01-A-017"], question: "clinical trial imaging endpoint process standards", jurisdictionTarget: "FR" });
    const candidate = result.referenceEvidenceCandidates[0];
    expect(candidate).toMatchObject({ jurisdiction: "US", methodologicalRelevance: "HIGH" });
    expect(candidate.regulatoryApplicability).toContain("NOT_AUTOMATIC_FOR_FRENCH_STUDY");
    expect(candidate.limitations).toEqual(expect.arrayContaining(["METHODOLOGICAL_RELEVANCE_DOES_NOT_CREATE_TARGET_JURISDICTION_REQUIREMENT"]));
  });

  it("CASE F retains the EU/FR currentness and jurisdiction metadata", () => {
    const result = knowledgeResult({ needId: "OKC01-N-002", needClass: "CONTEXT_APPLICABILITY_AND_JURISDICTION", owner: "KNOWLEDGE", sourcePreferences: ["RC01-A-013"], question: "French jurisdiction applicability", jurisdictionTarget: "FR" });
    expect(result.referenceSourceSnapshots[0]).toMatchObject({ sourceId: "RC01-A-013", jurisdiction: "FR", currentOrHistorical: "CURRENT" });
  });

  it("CASE G keeps historical sources retrievable explicitly but excludes them from default current retrieval", () => {
    const historical = knowledgeResult({ needId: "OKC01-N-001", needClass: "SOURCE_IDENTITY_VERSION_AND_STATUS", owner: "KNOWLEDGE", sourcePreferences: ["RC01-D-044"], question: "historical funding source status" });
    const current = knowledgeResult({ needId: "OKC01-N-001", needClass: "SOURCE_IDENTITY_VERSION_AND_STATUS", owner: "KNOWLEDGE", question: "current source identity version status" });
    expect(historical.referenceSourceSnapshots[0].currentOrHistorical).toBe("HISTORICAL_CLOSED_CALL");
    expect(current.referenceSourceSnapshots.every((snapshot) => !snapshot.currentOrHistorical.includes("HISTORICAL"))).toBe(true);
  });

  it("CASE H retains a study protocol as a practice artifact without authority promotion", () => {
    const result = knowledgeResult({ needId: "OKC01-N-005", needClass: "EXTERNAL_SEARCH_AND_DOCUMENT_CLASSIFICATION", owner: "KNOWLEDGE", sourcePreferences: ["RC01-E-048"], question: "study protocol document classification" });
    expect(result.referenceSourceSnapshots[0]).toMatchObject({ documentType: "STUDY_PROTOCOL", sourceClass: "E_LINKED_STUDY_ARTIFACT_SET", externalAuthorityStatus: "EXTERNAL_REFERENCE_NOT_NOXIA_AUTHORITY" });
    expect(result.referenceEvidenceCandidates).toHaveLength(0);
    expect(result.referenceDocumentRelationships[0]).toMatchObject({ studySetId: "RC01-SET-001", relationshipType: "SAME_STUDY_ARTIFACT_SET", practiceRuleInferred: false });
  });

  it("CASE I retains regulatory guidance classification and external-authority boundary", () => {
    const snapshot = resolveReferenceSourceSnapshot("RC01-A-019");
    expect(snapshot).toMatchObject({ documentType: "REGULATORY_GUIDANCE", sourceClass: "A_AUTHORITATIVE_OR_INSTITUTIONAL_REFERENCE", externalAuthorityStatus: "EXTERNAL_REFERENCE_NOT_NOXIA_AUTHORITY" });
  });

  it("CASE J retains funding relevance without promoting a generic scientific rule", () => {
    const result = knowledgeResult({ needId: "OKC01-N-001", needClass: "SOURCE_IDENTITY_VERSION_AND_STATUS", owner: "KNOWLEDGE", sourcePreferences: ["RC01-D-043"], question: "current funding call identity status" });
    expect(result.referenceSourceSnapshots[0]).toMatchObject({ documentType: "FUNDING_RULE", sourceClass: "D_FUNDING_OR_OPERATIONAL_RULE" });
    expect(result.referenceEvidenceCandidates).toHaveLength(0);
    expect(result.applicableAssertions).toHaveLength(0);
  });

  it("CASE K exposes a platform protocol relationship without extracting a practice rule", () => {
    const result = knowledgeResult({ needId: "OKC01-N-045", needClass: "ANALYSIS_DATASET_REPRODUCIBILITY_AND_RELEASE", owner: "BIOSTATISTICS", sourcePreferences: ["RC01-E-062"], question: "platform protocol and statistical analysis relationship" });
    expect(result.referenceSourceSnapshots[0]).toMatchObject({ sourceId: "RC01-E-062", contentAvailability: "METADATA_ONLY" });
    expect(result.referenceEvidenceCandidates).toHaveLength(0);
    expect(result.referenceDocumentRelationships[0]).toMatchObject({ studySetId: "RC01-SET-007", relationshipType: "SAME_STUDY_ARTIFACT_SET", practiceRuleInferred: false });
  });
});

describe("REFERENCE-KNOWLEDGE-BRIDGE-01 — generic read-only owner handoff", () => {
  const ownerCases: Array<[ReferenceKnowledgeOwner, string, string, string, string]> = [
    ["SCIENTIFIC_THINKING", "OKC01-N-009", "MECHANISTIC_AND_CONTEXTUAL_SUPPORT", "RC01-A-017", "clinical trial imaging endpoint process"],
    ["STUDY_DESIGN", "OKC01-N-012", "OBSERVATIONAL_VS_INTERVENTIONAL_STRATEGY", "RC01-A-018", "adaptive designs clinical trials"],
    ["OBSERVABILITY_MEASUREMENT", "OKC01-N-020", "OBSERVABLE_PROPERTY_AND_MEASUREMENT_ALTERNATIVES", "RC01-A-017", "imaging modality measurement endpoint"],
    ["IMAGING", "OKC01-N-027", "MODALITY_CHOICE_AND_MEASUREMENT_REALIZATION", "RC01-A-017", "choice imaging modality"],
    ["BIOSTATISTICS", "OKC01-N-038", "METHOD_MODEL_ASSUMPTIONS_AND_DIAGNOSTICS", "RC01-A-018", "adaptive design statistical methods assumptions"],
    ["CDM", "OKC01-N-047", "VARIABLE_IDENTITY_CRF_AND_DATA_DICTIONARY", "RC01-A-016", "study data variables data dictionary"],
    ["DATA_MANAGEMENT", "OKC01-N-054", "CRF_CONSTRUCTION_AND_COLLECTION_SPECIFICATION", "RC01-A-016", "case report form data collection"],
    ["REG", "OKC01-N-067", "FDA_COMPARATIVE_METHODOLOGICAL_VALUE", "RC01-A-018", "FDA adaptive design guidance"],
  ];

  it.each(ownerCases)("delivers anchored Knowledge candidates to %s without ownership or Project transfer", (owner, needId, needClass, sourceId, question) => {
    const result = knowledgeResult({ needId, needClass, owner, sourcePreferences: [sourceId], question, projectBound: true });
    const before = JSON.stringify(result);
    const handoff = createKnowledgeOwnerHandoff({
      result,
      targetOwner: owner,
      currentProject: { projectId: "project:reference-bridge", projectVersion: "project-version:v1", projectDigest: "project-digest:v1" },
    });
    expect(handoff.status).toBe("CURRENT");
    expect(handoff.sourceRefs).toContain(sourceId);
    expect(handoff.candidateRefs.length).toBeGreaterThan(0);
    expect(handoff.anchors.length).toBe(handoff.candidateRefs.length);
    expect(handoff.limitations.length).toBeGreaterThan(0);
    expect(handoff.readOnly).toBe(true);
    expect(handoff.sourceDocumentAccess).toBe("FORBIDDEN_USE_KNOWLEDGE_PROJECTION_ONLY");
    expect(handoff.ownershipTransferred).toBe(false);
    expect(handoff.certaintyIncreaseAuthorized).toBe(false);
    expect(handoff.projectWriteAuthorized).toBe(false);
    expect(JSON.stringify(result)).toBe(before);
  });

  it("blocks silent reuse after incompatible Project change", () => {
    const result = knowledgeResult({ needId: "OKC01-N-012", needClass: "OBSERVATIONAL_VS_INTERVENTIONAL_STRATEGY", owner: "STUDY_DESIGN", sourcePreferences: ["RC01-A-018"], question: "adaptive designs clinical trials", projectBound: true });
    const handoff = createKnowledgeOwnerHandoff({
      result,
      targetOwner: "STUDY_DESIGN",
      currentProject: { projectId: "project:reference-bridge", projectVersion: "project-version:v2", projectDigest: "project-digest:v2" },
    });
    expect(handoff.status).toBe("STALE_PROJECT_BINDING");
    expect(handoff.staleReasons).toEqual(expect.arrayContaining(["PROJECT_VERSION_CHANGED", "PROJECT_DIGEST_CHANGED"]));
    expect(handoff.candidates).toHaveLength(0);
    expect(() => createKnowledgeRequest({
      originalQuestion: "adaptive designs clinical trials",
      scientificObjectTerms: [{ term: "adaptive design" }],
      researchProjectId: "project:reference-bridge",
      referenceNeed: { needId: "OKC01-N-012", needClass: "OBSERVATIONAL_VS_INTERVENTIONAL_STRATEGY", owner: "STUDY_DESIGN" },
    })).toThrow("REFERENCE_KNOWLEDGE_PROJECT_BINDING_INCOMPLETE");
  });

  it("keeps trace on/off behavior equivalent outside trace facts and never selects RC01 implicitly", () => {
    const result = knowledgeResult({ needId: "OKC01-N-027", needClass: "MODALITY_CHOICE_AND_MEASUREMENT_REALIZATION", owner: "IMAGING", sourcePreferences: ["RC01-A-017"], question: "choice imaging modality", projectBound: true });
    const currentProject = { projectId: "project:reference-bridge", projectVersion: "project-version:v1", projectDigest: "project-digest:v1" };
    const traceOn = createKnowledgeOwnerHandoff({ result, targetOwner: "IMAGING", currentProject, trace: "ON" });
    const traceOff = createKnowledgeOwnerHandoff({ result, targetOwner: "IMAGING", currentProject, trace: "OFF" });
    expect(traceOn.handoffDigest).toBe(traceOff.handoffDigest);
    expect(traceOn.candidates).toEqual(traceOff.candidates);
    expect(traceOn.traceFacts).toHaveLength(1);
    expect(traceOff.traceFacts).toHaveLength(0);
    const ordinary = executeKnowledgeEngine({ originalQuestion: "Comprendre le T1 mapping et l’ECV en IRM.", createdAt: "2026-09-03T00:00:00.000Z" });
    expect(ordinary.queryPlan.providerSelections.find((selection) => selection.providerId === "reference-corpus-01")?.included).toBe(false);
    expect(ordinary.referenceSourceSnapshots).toHaveLength(0);
  });
});
