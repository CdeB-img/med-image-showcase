import { beforeAll, describe, expect, it } from "vitest";
import { logicalDigest, stableStringify } from "@/features/knowledge-engine";
import {
  REG000_CORPUS,
  REG000_CORPUS_DIGEST,
  REG000_CORPUS_VERSION,
  createRegulatoryResolutionInput,
  knownFact,
  resolveRegulatoryRequirements,
  unknownFact,
  type RegulatoryResolutionInput,
  type RegulatoryResolutionResult,
} from "@/features/regulatory-resolution";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import {
  invokeRegulatoryForProject,
  readProductRegulatoryOwnerResult,
  requireCurrentProductRegulatoryOwnerResult,
} from "@/features/protocol-designer/product-regulatory-owner-runtime";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  SPECIALIZED_OWNER_CAPABILITIES,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  invokeRegulatoryOwnerFromProject,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { createFunctionalResetSession } from "../session";

const authority = {
  actorRef: "w1-reg-01:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const change = (input: Partial<PersistentProjectDeltaChange> & Pick<PersistentProjectDeltaChange, "candidateRef" | "proposedType" | "content" | "sourceText">): PersistentProjectDeltaChange => ({
  operation: "ADD",
  targetSectionId: "DESIGN",
  targetProjectRef: null,
  semanticIdentity: input.candidateRef,
  polarity: "AFFIRMED",
  studyRole: null,
  epistemicStatus: "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
  ...input,
});

const contributionFor = (input: {
  raw: string;
  current: ResearchProjectOwnerProjection | null;
  changes: PersistentProjectDeltaChange[];
}) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${input.raw}`,
    language: "fr",
    turns: [{ turnId: `turn:${input.raw}`, role: "USER", content: input.raw, createdAt: "2026-08-25T13:00:00.000Z" }],
  };
  const checked = validatePersistentProjectDelta({ changes: input.changes, relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, input.raw, input.current, conversation);
  expect(checked.validation.blocks).toEqual([]);
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.current,
    createdAt: "2026-08-25T13:00:01.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const adopt = (input: { current: ResearchProjectOwnerProjection | null; raw: string; changes: PersistentProjectDeltaChange[]; at: string }) => confirmResearchProjectContribution({
  contribution: contributionFor(input),
  current: input.current,
  projectId: input.current?.projectId ?? "project:w1-reg-01",
  authority,
  confirmedAt: input.at,
});

const supportedProject = () => {
  const raw = "Essai interventionnel randomisé d'un médicament contre placebo en France et dans l'Union européenne.";
  return adopt({
    current: null,
    raw,
    at: "2026-08-25T13:01:00.000Z",
    changes: [
      change({ candidateRef: "condition:cardiac", proposedType: "CONDITION", targetSectionId: "POPULATION", content: "Condition cardiaque", sourceText: raw }),
      change({ candidateRef: "intervention:medicine", proposedType: "INTERVENTION_OR_EXPOSURE", targetSectionId: "DESIGN", content: "Médicament expérimental", sourceText: raw }),
      change({ candidateRef: "comparator:placebo", proposedType: "INTERVENTION_OR_EXPOSURE", targetSectionId: "DESIGN", content: "Placebo", sourceText: raw, studyRole: "COMPARATOR" }),
      change({ candidateRef: "design:randomized", proposedType: "STUDY_DESIGN", targetSectionId: "DESIGN", content: "Essai interventionnel randomisé", sourceText: raw }),
    ],
  });
};

const advanceProject = (current: ResearchProjectOwnerProjection) => {
  const raw = "Le projet ajoute un objectif de faisabilité multicentrique.";
  return adopt({
    current,
    raw,
    at: "2026-08-25T13:20:00.000Z",
    changes: [change({ candidateRef: "objective:multicenter-feasibility", proposedType: "OBJECTIVE", targetSectionId: "ANALYSIS", content: "Évaluer la faisabilité multicentrique", sourceText: raw })],
  });
};

type RequestMode = "SUPPORTED" | "MISSING_JURISDICTION" | "UNSUPPORTED_JURISDICTION" | "MISSING_STUDY_CONTEXT";

const regulatoryRequest = (
  project: ResearchProjectOwnerProjection,
  snapshot: Readonly<ProjectContextSnapshot>,
  mode: RequestMode,
): RegulatoryResolutionInput => {
  const provenance = [snapshot.sourceProjectRef, snapshot.sourceProjectVersion, snapshot.sourceProjectDigest, snapshot.snapshotDigest];
  const jurisdiction = mode === "MISSING_JURISDICTION"
    ? unknownFact<string[]>("La juridiction n'est pas fournie par le caller.", provenance)
    : knownFact(mode === "UNSUPPORTED_JURISDICTION" ? ["CA"] : ["FR", "EU_EEA"], "Juridiction explicitement fournie par le caller.", provenance);
  const centerJurisdictions = mode === "MISSING_JURISDICTION"
    ? unknownFact<string[]>("Les juridictions des centres ne sont pas fournies.", provenance)
    : knownFact(mode === "UNSUPPORTED_JURISDICTION" ? ["CA"] : ["FR", "EU_EEA"], "Juridictions des centres explicitement fournies.", provenance);
  const interventionModel = mode === "MISSING_STUDY_CONTEXT"
    ? unknownFact<"INTERVENTIONAL" | "OBSERVATIONAL">("Le caractère interventionnel ou observationnel reste à qualifier.", provenance)
    : knownFact<"INTERVENTIONAL" | "OBSERVATIONAL">("INTERVENTIONAL", "Le caller qualifie explicitement le projet d'interventionnel.", provenance);
  const unknowns = [
    ...(mode === "MISSING_JURISDICTION" ? [{ unknownId: "unknown:jurisdiction", field: "jurisdiction", reason: "La juridiction est absente.", provenance }] : []),
    ...(mode === "MISSING_STUDY_CONTEXT" ? [{ unknownId: "unknown:intervention-model", field: "studyDesignCharacteristics.interventionModel", reason: "Le modèle d'étude manque.", provenance }] : []),
  ];
  return createRegulatoryResolutionInput({
    researchProjectId: snapshot.sourceProjectRef,
    researchProjectVersion: snapshot.sourceProjectVersion,
    researchProjectDigest: snapshot.sourceProjectDigest,
    resolutionAsOf: "2026-08-25T13:10:00.000Z",
    jurisdiction,
    projectCharacteristics: {
      humanHealthResearch: knownFact(true, "Le caller indique une recherche en santé impliquant des personnes.", provenance),
      projectNatures: knownFact(["HEALTH_RESEARCH"], "Nature déclarée.", provenance),
      intendedDocuments: knownFact(["RESEARCH_PROTOCOL"], "Un protocole de recherche est envisagé.", provenance),
      explicitlyIncorporatedGuidance: knownFact([], "Aucun guide n'est incorporé comme obligation.", provenance),
    },
    studyDesignCharacteristics: {
      interventionModel,
      temporalDirection: knownFact<"PROSPECTIVE" | "RETROSPECTIVE" | "MIXED">("PROSPECTIVE", "Direction prospective déclarée.", provenance),
      randomised: knownFact(true, "Randomisation déclarée.", provenance),
      registryBased: knownFact(false, "Aucun registre déclaré.", provenance),
      reportTypes: knownFact([], "Aucun rapport de résultats encore demandé.", provenance),
    },
    interventionCharacteristics: {
      interventionPresent: knownFact(true, "Intervention présente.", provenance),
      medicinalProductTrial: knownFact(true, "Essai de médicament déclaré par le caller.", provenance),
      medicalDeviceStudy: knownFact(false, "Aucun dispositif médical déclaré.", provenance),
    },
    productCharacteristics: { productTypes: knownFact(["MEDICINAL_PRODUCT"], "Médicament déclaré.", provenance) },
    dataCharacteristics: {
      personalHealthData: knownFact(true, "Données personnelles de santé prévues.", provenance),
      existingData: knownFact(false, "Pas de données existantes déclarées.", provenance),
      prospectiveCollection: knownFact(true, "Collecte prospective déclarée.", provenance),
      routinelyCollectedHealthData: knownFact(false, "Pas de données de soin courant déclarées.", provenance),
      sources: knownFact(["PROSPECTIVE_RESEARCH_COLLECTION"], "Source de données déclarée.", provenance),
      transferOutsideEea: knownFact(false, "Aucun transfert hors EEE déclaré.", provenance),
    },
    biologicalSampleCharacteristics: { samplesPresent: knownFact(false, "Aucun échantillon biologique déclaré.", provenance) },
    multicenterCharacteristics: {
      multicenter: knownFact(true, "Projet multicentrique déclaré.", provenance),
      centerCount: knownFact(2, "Deux centres déclarés.", provenance),
    },
    internationalCharacteristics: {
      international: knownFact(false, "Le caller ne qualifie pas le projet d'international.", provenance),
      centerJurisdictions,
      crossCountryRequirementDiscoveryNeeded: knownFact(false, "Aucune découverte transfrontalière demandée.", provenance),
    },
    fundingProgramCandidates: knownFact([], "Aucun financement candidat.", provenance),
    fundingProgramEditionCandidates: knownFact([], "Aucune édition de financement candidate.", provenance),
    knownRegulatoryQualifications: [],
    unknowns,
    contradictions: [],
    humanDecisions: [project.confirmationDecision],
    provenance,
  });
};

type CorpusSource = {
  sourceId: string;
  title: string;
  jurisdiction: string;
  locator: string;
  officialURL: string;
  temporal: { verifiedAt: string; sourceRevision: string; effectiveFrom: string | null };
};

const corpusSources = (REG000_CORPUS as unknown as { requirementSources: CorpusSource[] }).requirementSources;

const timing = {
  startedAt: "2026-08-25T13:10:00.000Z",
  completedAt: "2026-08-25T13:10:01.000Z",
  monotonicNow: (() => {
    let value = 200;
    return () => value += 0.25;
  })(),
};

let project: ResearchProjectOwnerProjection;
let snapshot: Readonly<ProjectContextSnapshot>;
let projectV2: ResearchProjectOwnerProjection;
let snapshotV2: Readonly<ProjectContextSnapshot>;
let request: RegulatoryResolutionInput;
let nativeResult: RegulatoryResolutionResult;
let nativeStarts = 0;
let invocation: ReturnType<typeof invokeRegulatoryForProject>;
let missingJurisdictionInvocation: ReturnType<typeof invokeRegulatoryForProject>;
let missingContextInvocation: ReturnType<typeof invokeRegulatoryForProject>;
let session: ReturnType<typeof createFunctionalResetSession>;

describe("W1-REG-01 — product canonical regulatory owner invocation", () => {
  beforeAll(() => {
    project = supportedProject();
    snapshot = buildProjectContextSnapshot({ project });
    request = regulatoryRequest(project, snapshot, "SUPPORTED");
    session = { ...createFunctionalResetSession("2026-08-25T13:00:00.000Z"), projectId: project.projectId, project };
    invocation = invokeRegulatoryForProject({
      project,
      projectSnapshot: snapshot,
      regulatoryRequest: request,
      ledger: session.knowledgeOwnerLedger,
      callerRef: "W1-REG-01:EXPLICIT_PRODUCT_DIAGNOSTIC",
      purpose: "Identifier les exigences documentées pour les juridictions explicitement déclarées.",
      runtime: (nativeRequest) => {
        nativeStarts += 1;
        nativeResult = resolveRegulatoryRequirements(nativeRequest);
        return nativeResult;
      },
      ...timing,
    });
    missingJurisdictionInvocation = invokeRegulatoryForProject({
      project,
      projectSnapshot: snapshot,
      regulatoryRequest: regulatoryRequest(project, snapshot, "MISSING_JURISDICTION"),
      ledger: session.knowledgeOwnerLedger,
      callerRef: "W1-REG-01:MISSING_JURISDICTION",
      purpose: "Identifier les informations de juridiction manquantes.",
      startedAt: "2026-08-25T13:11:00.000Z",
      completedAt: "2026-08-25T13:11:01.000Z",
    });
    missingContextInvocation = invokeRegulatoryForProject({
      project,
      projectSnapshot: snapshot,
      regulatoryRequest: regulatoryRequest(project, snapshot, "MISSING_STUDY_CONTEXT"),
      ledger: session.knowledgeOwnerLedger,
      callerRef: "W1-REG-01:MISSING_STUDY_CONTEXT",
      purpose: "Identifier les informations de design manquantes pour l'applicabilité.",
      startedAt: "2026-08-25T13:12:00.000Z",
      completedAt: "2026-08-25T13:12:01.000Z",
    });
    projectV2 = advanceProject(project);
    snapshotV2 = buildProjectContextSnapshot({ project: projectV2 });
  });

  it("W1REG01-01 canonical Project reaches native REG", () => {
    expect(invocation.observation).toMatchObject({ owner: "REGULATORY_RESOLUTION", runtimeStarts: 1 });
  });

  it("W1REG01-02 product REG entrypoint is really used", () => {
    expect(invocation.entry.callerRef).toBe("W1-REG-01:EXPLICIT_PRODUCT_DIAGNOSTIC");
    expect(invocation.entry.request).toEqual(invocation.request);
  });

  it("W1REG01-03 preserves the same Project ID", () => {
    expect(invocation.result?.sourceProjectRef).toBe(project.projectId);
  });

  it("W1REG01-04 preserves the same Project version", () => {
    expect(invocation.result?.sourceProjectVersion).toBe(project.versionId);
  });

  it("W1REG01-05 preserves the same Project digest", () => {
    expect(invocation.result?.sourceProjectDigest).toBe(project.projectDigest);
  });

  it("W1REG01-06 preserves RegulatoryRequest identity and version", () => {
    expect(invocation.request.nativeInput).toEqual(request);
    expect(invocation.request.nativeInputVersion).toBe(request.contractVersion);
    expect(invocation.observation.requestRef).toBe(`regulatory-request:${logicalDigest(request)}`);
  });

  it("W1REG01-07 preserves the native RegulatoryResult", () => {
    expect(invocation.result?.nativePayload).toEqual(nativeResult);
    expect(invocation.result?.resultId).toBe(nativeResult.resolutionId);
  });

  it("W1REG01-08 preserves REG ownership", () => {
    expect(invocation.result?.owner).toBe("REGULATORY_RESOLUTION");
    expect(invocation.request.capabilityId).toBe("REGULATORY_REQUIREMENT_RESOLUTION");
  });

  it("W1REG01-09 preserves Project ownership", () => {
    expect(invocation.result?.projectContribution).toBeNull();
    expect(stableStringify(project)).toBe(stableStringify(session.project));
  });

  it("W1REG01-10 uses the real local corpus for supported jurisdictions", () => {
    expect(nativeStarts).toBe(1);
    expect(nativeResult).toMatchObject({ corpusVersion: REG000_CORPUS_VERSION, corpusDigest: REG000_CORPUS_DIGEST });
    expect([...nativeResult.applicableRequirements, ...nativeResult.unresolvedRequirements].some((item) => ["FR", "EU_EEA"].includes(item.jurisdiction))).toBe(true);
  });

  it("W1REG01-11 preserves source identities", () => {
    expect(invocation.result?.evidenceRefs).toEqual(nativeResult.provenance.sourceRefs);
    expect(invocation.result?.evidenceRefs.length).toBeGreaterThan(0);
  });

  it("W1REG01-12 keeps source versions and locators reconstructible from the exact corpus", () => {
    const requirement = [...nativeResult.applicableRequirements, ...nativeResult.unresolvedRequirements].find((item) => item.sourceIds.length)!;
    const source = corpusSources.find((item) => item.sourceId === requirement.sourceIds[0]);
    expect(source).toMatchObject({ sourceId: requirement.sourceIds[0] });
    expect(source?.locator.length).toBeGreaterThan(0);
    expect(source?.temporal.sourceRevision.length).toBeGreaterThan(0);
    expect(source?.temporal.verifiedAt).toBe("2026-08-10");
    expect(invocation.result?.nativePayload).toMatchObject({ corpusVersion: REG000_CORPUS_VERSION, corpusDigest: REG000_CORPUS_DIGEST });
  });

  it("W1REG01-13 preserves applicability", () => {
    expect(invocation.result?.nativePayload?.applicableRequirements).toEqual(nativeResult.applicableRequirements);
    expect(invocation.result?.nativePayload?.unresolvedRequirements).toEqual(nativeResult.unresolvedRequirements);
  });

  it("W1REG01-14 preserves requirements", () => {
    expect(invocation.result?.nativePayload?.regulatoryMandatoryRequirements).toEqual(nativeResult.regulatoryMandatoryRequirements);
    expect(nativeResult.regulatoryMandatoryRequirements.length).toBeGreaterThan(0);
  });

  it("W1REG01-15 preserves limitations", () => {
    expect(invocation.result?.limitations).toEqual(expect.arrayContaining([
      "LOCAL_REGULATORY_RESOLUTION_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_APPROVAL",
      "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION",
    ]));
  });

  it("W1REG01-16 keeps missing jurisdiction missing", () => {
    expect(missingJurisdictionInvocation.result?.nativePayload?.missingInformation.some((item) => item.field === "jurisdiction")).toBe(true);
    expect(missingJurisdictionInvocation.result?.resultKind).toBe("GAP");
  });

  it("W1REG01-17 never infers a jurisdiction", () => {
    const result = missingJurisdictionInvocation.result!.nativePayload!;
    expect(result.applicableRequirements.filter((item) => ["FR", "EU_EEA", "US"].includes(item.jurisdiction))).toEqual([]);
    expect(missingJurisdictionInvocation.request.nativeInput.jurisdiction).toMatchObject({ state: "UNKNOWN", value: null });
  });

  it("W1REG01-18 fails closed for an unsupported jurisdiction", () => {
    let unsupportedStarts = 0;
    expect(() => invokeRegulatoryForProject({
      project,
      projectSnapshot: snapshot,
      regulatoryRequest: regulatoryRequest(project, snapshot, "UNSUPPORTED_JURISDICTION"),
      ledger: session.knowledgeOwnerLedger,
      callerRef: "W1-REG-01:UNSUPPORTED",
      purpose: "Résoudre une juridiction absente du corpus.",
      runtime: (nativeRequest) => {
        unsupportedStarts += 1;
        return resolveRegulatoryRequirements(nativeRequest);
      },
      startedAt: "2026-08-25T13:13:00.000Z",
      completedAt: "2026-08-25T13:13:01.000Z",
    })).toThrow("UNSUPPORTED_JURISDICTION:CA");
    expect(unsupportedStarts).toBe(0);
  });

  it("W1REG01-19 fails closed on missing critical Project context", () => {
    expect(missingContextInvocation.result?.nativePayload?.missingInformation.some((item) => item.field === "studyDesignCharacteristics.interventionModel")).toBe(true);
    expect(missingContextInvocation.result?.resultKind).toBe("GAP");
  });

  it("W1REG01-20 makes no cross-jurisdiction extrapolation", () => {
    const known = new Set(REG000_CORPUS.requirements.map((item) => item.jurisdiction));
    expect(known.has("CA")).toBe(false);
    expect(() => regulatoryRequest(project, snapshot, "UNSUPPORTED_JURISDICTION").jurisdiction.value).not.toThrow();
    expect(invocation.result?.nativePayload?.applicableRequirements.every((item) => known.has(item.jurisdiction))).toBe(true);
  });

  it("W1REG01-21 never promotes a scientific source to a regulatory requirement", () => {
    const corpusSourceIds = new Set(corpusSources.map((item) => item.sourceId));
    expect(invocation.result?.evidenceRefs.every((sourceId) => corpusSourceIds.has(sourceId))).toBe(true);
    expect(invocation.entry.dependencies).toEqual([]);
  });

  it("W1REG01-22 does not promote the result to approval", () => {
    expect(invocation.result).not.toHaveProperty("approved");
    expect(invocation.result).not.toHaveProperty("authorized");
    expect(invocation.result?.nativePayload?.readiness.notice).toBe("LOCAL_REGULATORY_RESOLUTION_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_APPROVAL");
  });

  it("W1REG01-23 does not promote a legal conclusion", () => {
    expect(invocation.result).not.toHaveProperty("legalToProceed");
    expect(invocation.result?.nativePayload?.provenance.authorityBoundary).toBe("METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION");
  });

  it("W1REG01-24 retains an immutable OwnerResult", () => {
    expect(Object.isFrozen(invocation.result)).toBe(true);
    expect(Object.isFrozen(invocation.result?.nativePayload)).toBe(true);
    expect(Object.isFrozen(invocation.ledger)).toBe(true);
  });

  it("W1REG01-25 retains REG in the shared owner ledger", () => {
    expect(invocation.ledger.contract).toBe("PROTOCOL_DESIGNER_KNOWLEDGE_OWNER_LEDGER");
    expect(invocation.ledger.entries).toHaveLength(1);
    expect(invocation.ledger.entries[0].result?.owner).toBe("REGULATORY_RESOLUTION");
  });

  it("W1REG01-26 reads back the exact ledger result", () => {
    const readback = readProductRegulatoryOwnerResult({ ledger: invocation.ledger, resultId: invocation.result!.resultId, currentProjectSnapshot: snapshot });
    expect(readback.freshness.status).toBe("CURRENT");
    expect(readback.entry.result).toEqual(invocation.result);
  });

  it("W1REG01-27 rejects a stale Project result", () => {
    const input = { ledger: invocation.ledger, resultId: invocation.result!.resultId, currentProjectSnapshot: snapshotV2 };
    expect(readProductRegulatoryOwnerResult(input).freshness.status).toBe("STALE_OWNER_RESULT");
    expect(() => requireCurrentProductRegulatoryOwnerResult(input)).toThrow("STALE_REGULATORY_RESULT");
  });

  it("W1REG01-28 keeps the historical stale result readable", () => {
    const readback = readProductRegulatoryOwnerResult({ ledger: invocation.ledger, resultId: invocation.result!.resultId, currentProjectSnapshot: snapshotV2 });
    expect(readback.entry.result).toEqual(invocation.result);
    expect(readback.entry.entryDigest).toBe(invocation.entry.entryDigest);
  });

  it("W1REG01-29 performs zero Project writes", () => {
    expect(invocation.projectWrites).toBe(0);
    expect(invocation.observation.projectWrites).toBe(0);
    expect(stableStringify(project)).not.toBe(stableStringify(projectV2));
  });

  it("W1REG01-30 does not bypass Human Decision", () => {
    expect(invocation.humanDecisionBypassed).toBe(false);
    expect(invocation.result?.projectContribution).toBeNull();
    expect(invocation.result?.projectWriteAuthorized).toBe(false);
  });

  it("W1REG01-31 makes no Gemini, Terra, web or external regulatory call", () => {
    expect(invocation).toMatchObject({ geminiCalls: 0, terraCalls: 0, webCalls: 0, externalRegulatoryCalls: 0 });
    expect(invocation.observation.llmFallbackCalls).toBe(0);
  });

  it("W1REG01-32 preserves the existing SPINE REG path", () => {
    const spine = invokeRegulatoryOwnerFromProject({ project, ...timing });
    expect(spine).toMatchObject({ observation: { owner: "REGULATORY_RESOLUTION", projectWrites: 0, llmFallbackCalls: 0 } });
    expect(spine.result?.nativePayloadType).toBe("RegulatoryResolutionResult");
  });

  it("W1REG01-33 preserves existing W1 Knowledge, ST and Imaging capabilities", () => {
    expect(SPECIALIZED_OWNER_CAPABILITIES).toEqual(expect.arrayContaining([
      expect.objectContaining({ owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE" }),
      expect.objectContaining({ owner: "SCIENTIFIC_THINKING", capabilityId: "SCIENTIFIC_THINKING_PROPOSAL" }),
      expect.objectContaining({ owner: "IMAGING", capabilityId: "IMAGING_STUDY_DESIGN" }),
    ]));
  });

  it("W1REG01-34 leaves the W1 VAL ledger untouched", () => {
    expect(session.validationRunLedger.entries).toEqual([]);
    expect(invocation.ledger.sessionId).toBe(session.knowledgeOwnerLedger.sessionId);
  });

  it("W1REG01-35 keeps REG conditional and never auto-triggers it", () => {
    const untouched = createFunctionalResetSession("2026-08-25T13:30:00.000Z");
    expect(untouched.knowledgeOwnerLedger.entries.filter((entry) => entry.result?.owner === "REGULATORY_RESOLUTION")).toEqual([]);
    expect(untouched.queryNavigation).toBeNull();
    expect(invocation.entry.callerRef).toContain("EXPLICIT_PRODUCT_DIAGNOSTIC");
  });
});
