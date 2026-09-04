import { describe, expect, it } from "vitest";
import type { ReferenceKnowledgeNeed } from "@/features/knowledge-engine";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
} from "@/features/research-project-construction";
import {
  attachProductKnowledgePrerequisite,
  buildFunctionalResetQueryNavigation,
  createProductKnowledgePrerequisiteAction,
  type FunctionalResetQueryNavigation,
  type ProductKnowledgeTargetCapability,
  type ProductKnowledgeTargetOwner,
} from "@/features/query-navigation";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { dispatchKnowledgePrerequisiteFromQuery } from "../knowledge-standard";
import { CHANGESET_INITIAL, makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-04T09:00:00.000Z";
const authority = {
  actorRef: "pre-integrated-knowledge:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const project = () => confirmResearchProjectContribution({
  contribution: makeFunctionalReset03A1Contribution([{
    turnId: "turn:pre-integrated-knowledge:1",
    role: "USER",
    content: CHANGESET_INITIAL,
    createdAt: AT,
  }]),
  current: null,
  projectId: "research-project:pre-integrated-knowledge",
  authority,
  confirmedAt: AT,
});

type OwnerCase = {
  targetOwner: ProductKnowledgeTargetOwner;
  queryOwner: string;
  targetCapability: ProductKnowledgeTargetCapability;
  needId: string;
  needClass: string;
  sourceId: string;
  purpose: string;
};

const ownerCases: OwnerCase[] = [
  { targetOwner: "SCIENTIFIC_THINKING", queryOwner: "SCIENTIFIC_THINKING", targetCapability: "SCIENTIFIC_THINKING_PROPOSAL", needId: "OKC01-N-009", needClass: "MECHANISTIC_AND_CONTEXTUAL_SUPPORT", sourceId: "RC01-A-017", purpose: "Qualifier un support mécanistique et contextuel." },
  { targetOwner: "STUDY_DESIGN", queryOwner: "STUDY_DESIGN", targetCapability: "STUDY_DESIGN_COHERENCE", needId: "OKC01-N-012", needClass: "OBSERVATIONAL_VS_INTERVENTIONAL_STRATEGY", sourceId: "RC01-A-018", purpose: "Comparer les implications de stratégies de design." },
  { targetOwner: "OBSERVABILITY_MEASUREMENT", queryOwner: "OBSERVABILITY_MEASUREMENT", targetCapability: "OBSERVABILITY_QUALIFICATION", needId: "OKC01-N-020", needClass: "OBSERVABLE_PROPERTY_AND_MEASUREMENT_ALTERNATIVES", sourceId: "RC01-A-017", purpose: "Imaging modality measurement endpoint." },
  { targetOwner: "IMAGING", queryOwner: "IMAGING", targetCapability: "IMAGING_STUDY_DESIGN", needId: "OKC01-N-027", needClass: "MODALITY_CHOICE_AND_MEASUREMENT_REALIZATION", sourceId: "RC01-A-017", purpose: "Qualifier la réalisation d'une mesure en imagerie." },
  { targetOwner: "BIOSTATISTICS", queryOwner: "BIOSTATISTICS", targetCapability: "BIOSTATISTICS_PLANNING", needId: "OKC01-N-038", needClass: "METHOD_MODEL_ASSUMPTIONS_AND_DIAGNOSTICS", sourceId: "RC01-A-018", purpose: "Documenter les hypothèses et diagnostics de méthode." },
  { targetOwner: "CDM", queryOwner: "STUDY_DATA_CDM", targetCapability: "STUDY_DATA_PLANNING", needId: "OKC01-N-047", needClass: "VARIABLE_IDENTITY_CRF_AND_DATA_DICTIONARY", sourceId: "RC01-A-016", purpose: "Documenter l'identité des variables et le dictionnaire." },
  { targetOwner: "DATA_MANAGEMENT", queryOwner: "DATA_MANAGEMENT", targetCapability: "DATA_MANAGEMENT_PLANNING", needId: "OKC01-N-054", needClass: "CRF_CONSTRUCTION_AND_COLLECTION_SPECIFICATION", sourceId: "RC01-A-016", purpose: "Case report form data collection." },
  { targetOwner: "REG", queryOwner: "REGULATORY_RESOLUTION", targetCapability: "REGULATORY_REQUIREMENT_RESOLUTION", needId: "OKC01-N-067", needClass: "FDA_COMPARATIVE_METHODOLOGICAL_VALUE", sourceId: "RC01-A-018", purpose: "Qualifier la portée méthodologique d'une référence FDA." },
];

const governedNavigation = (ownerCase: OwnerCase, sourceId = ownerCase.sourceId) => {
  const currentProject = project();
  const base = buildFunctionalResetQueryNavigation({ project: currentProject, recordedAt: AT });
  if (!base.currentAction || !base.selection.selected) throw new Error("QRY_ACTION_EXPECTED");
  const navigation: FunctionalResetQueryNavigation = {
    ...structuredClone(base),
    selection: {
      ...structuredClone(base.selection),
      selected: { ...structuredClone(base.selection.selected), owner: ownerCase.queryOwner, capabilityRef: ownerCase.targetCapability },
    },
    currentAction: { ...structuredClone(base.currentAction), owner: ownerCase.queryOwner },
  };
  const snapshot = buildProjectContextSnapshot({ project: currentProject });
  const need: ReferenceKnowledgeNeed = {
    needId: ownerCase.needId,
    needClass: ownerCase.needClass,
    owner: ownerCase.targetOwner,
    sourcePreferences: [sourceId],
    includeHistorical: false,
    maxSources: 1,
    maxSectionsPerSource: 2,
  };
  const action = createProductKnowledgePrerequisiteAction({
    selectedActionRef: navigation.currentAction!.selectedActionId,
    projectId: currentProject.projectId,
    projectVersion: currentProject.versionId,
    projectDigest: currentProject.projectDigest,
    targetOwner: ownerCase.targetOwner,
    targetCapability: ownerCase.targetCapability,
    knowledgeNeed: need,
    purpose: ownerCase.purpose,
    scientificObjects: snapshot.objects.slice(0, 3).map((object) => ({
      objectId: object.stableId,
      originalTerm: object.content,
      role: object.type === "INTERVENTION_OR_EXPOSURE" && object.scientificRole === "COMPARATOR_ARM" ? "COMPARATOR" as const : "CONTEXT" as const,
    })),
    context: { domain: "clinical research", jurisdiction: ownerCase.targetOwner === "REG" ? "FR" : null },
    relationRefs: snapshot.relations.map((relation) => relation.stableId),
    provenanceRefs: [navigation.currentAction!.selectedActionId, snapshot.snapshotDigest],
  });
  return { currentProject, navigation: attachProductKnowledgePrerequisite(navigation, action) };
};

const dispatch = (ownerCase: OwnerCase, options?: { sourceId?: string; traceEnabled?: boolean; ledger?: ReturnType<typeof createProductOwnerResultLedger> }) => {
  const prepared = governedNavigation(ownerCase, options?.sourceId);
  return dispatchKnowledgePrerequisiteFromQuery({
    project: prepared.currentProject,
    navigation: prepared.navigation,
    ownerResultLedger: options?.ledger ?? createProductOwnerResultLedger("session:pre-integrated-knowledge"),
    traceLedger: createScientificExecutionTraceLedger("session:pre-integrated-knowledge"),
    sessionId: "session:pre-integrated-knowledge",
    conversationId: "conversation:pre-integrated-knowledge",
    startedAt: AT,
    completedAt: "2026-09-04T09:00:01.000Z",
    traceEnabled: options?.traceEnabled,
  });
};

describe("PRE-INTEGRATED Gate 2 — QRY-governed Knowledge product connection", () => {
  it.each(ownerCases)("makes the one immutable Knowledge handoff product-reachable for $targetOwner", (ownerCase) => {
    const output = dispatch(ownerCase);
    expect(output.status).toBe("CURRENT_HANDOFF_READY");
    expect(output.targetOwnerDispatchAuthorized).toBe(true);
    expect(output.handoff).toMatchObject({
      targetOwner: ownerCase.targetOwner,
      status: "CURRENT",
      readOnly: true,
      ownershipTransferred: false,
      certaintyIncreaseAuthorized: false,
      projectWriteAuthorized: false,
    });
    expect(output.handoff.sourceRefs).toContain(ownerCase.sourceId);
    expect(output.handoff.limitations.length).toBeGreaterThan(0);
    expect(output.ownerResultLedger.entries.some((entry) => entry.request.owner === "KNOWLEDGE")).toBe(true);
    expect(output.projectWrites).toBe(0);
    expect(output.providerCalls).toBe(0);
  });

  it("deduplicates one unchanged need by stable request identity", () => {
    const first = dispatch(ownerCases[0]!);
    const second = dispatch(ownerCases[0]!, { ledger: first.ownerResultLedger });
    expect(second.reused).toBe(true);
    expect(second.status).toBe("CURRENT_RESULT_REUSED");
    expect(second.ownerResultLedger.entries).toHaveLength(first.ownerResultLedger.entries.length);
    expect(second.result.resultId).toBe(first.result.resultId);
  });

  it("fails closed when a governed source is metadata-only and emits no content candidate", () => {
    const output = dispatch(ownerCases[0]!, { sourceId: "RC01-B-032" });
    expect(output.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(output.targetOwnerDispatchAuthorized).toBe(false);
    expect(output.result.nativePayload.referenceSourceSnapshots[0]?.contentAvailability).toBe("METADATA_ONLY");
    expect(output.result.nativePayload.referenceEvidenceCandidates).toEqual([]);
    expect(output.handoff.candidates).toEqual([]);
  });

  it("rejects a prerequisite attached to a QRY action owned by another capability", () => {
    const prepared = governedNavigation(ownerCases[0]!);
    const invalid = structuredClone(prepared.navigation);
    invalid.currentAction!.owner = "IMAGING";
    expect(() => attachProductKnowledgePrerequisite(invalid, prepared.navigation.knowledgePrerequisite!)).toThrow("QRY_KNOWLEDGE_TARGET_NOT_SELECTED_BY_QRY");
  });

  it("rejects stale Project binding before retrieval", () => {
    const prepared = governedNavigation(ownerCases[1]!);
    const staleProject = { ...prepared.currentProject, versionId: `${prepared.currentProject.versionId}:stale` };
    expect(() => dispatchKnowledgePrerequisiteFromQuery({
      project: staleProject,
      navigation: prepared.navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:stale"),
      traceLedger: createScientificExecutionTraceLedger("session:stale"),
      sessionId: "session:stale",
      conversationId: "conversation:stale",
      startedAt: AT,
      completedAt: AT,
    })).toThrow("QRY_KNOWLEDGE_PROJECT_BINDING_STALE");
  });

  it("keeps product output equivalent with TRACE on and off", () => {
    const traceOn = dispatch(ownerCases[3]!, { traceEnabled: true });
    const traceOff = dispatch(ownerCases[3]!, { traceEnabled: false });
    expect(traceOn.result.resultId).toBe(traceOff.result.resultId);
    expect(traceOn.result.nativePayload.resultDigest).toBe(traceOff.result.nativePayload.resultDigest);
    expect(traceOn.handoff.handoffDigest).toBe(traceOff.handoff.handoffDigest);
    expect(traceOn.targetOwnerDispatchAuthorized).toBe(traceOff.targetOwnerDispatchAuthorized);
    expect(traceOn.projectWrites).toBe(0);
    expect(traceOff.projectWrites).toBe(0);
  });
});
