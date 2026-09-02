import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { invokeStudyDesignForProjectSnapshot } from "@/features/protocol-designer/product-study-design-owner-runtime";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import { listSpecializedOwnerCapabilities } from "@/features/research-project-construction/specialized-owner-handoff";
import {
  buildStudyDesignDownstreamHandoffRequests,
  buildStudyDesignRuntimeInput,
  executeStudyDesignRuntime,
  validateStudyDesignProposal,
  type StudyDesignProposalContribution,
  type StudyDesignTraceFact,
} from "@/features/study-design";

const provenance = (source: string) => ({
  sourcePlan: "USER" as const,
  assertionKind: "USER_STATED" as const,
  sourceTurnRefs: [source],
  sourceText: source,
  proposalSourceTurnRefs: [],
  adoptionSourceTurnRefs: [],
  evidenceRefs: [`evidence:${source}`],
  evidenceQualification: "REFERENCES_PRESENT_NOT_VERIFIED" as const,
});

type ObjectInput = {
  id: string;
  type: ProjectContextSnapshot["objects"][number]["type"];
  content: string;
  role?: string | null;
  epistemicState?: ProjectContextSnapshot["objects"][number]["epistemicState"];
};

const snapshot = (input: {
  version?: string;
  objects: ObjectInput[];
  relations?: ProjectContextSnapshot["relations"];
  issues?: ProjectContextSnapshot["openIssues"];
}): ProjectContextSnapshot => {
  const version = input.version ?? "project-rde:version:1";
  const projectDigest = logicalDigest({ version, objects: input.objects });
  const base = {
    contract: "PROJECT_CONTEXT_SNAPSHOT" as const,
    contractVersion: "0.3.0" as const,
    owner: "RESEARCH_PROJECT" as const,
    sourceProjectRef: "project:rde-01",
    sourceProjectVersion: version,
    sourceProjectDigest: projectDigest,
    sourceProjectRevision: Number(version.split(":").at(-1) ?? 1),
    previousProjectVersion: null,
    sourceContributionRef: `contribution:${version}`,
    sourceContributionDigest: logicalDigest({ contribution: version }),
    objects: input.objects.map((object) => ({
      stableId: object.id,
      versionRef: `${object.id}@${version}`,
      version: 1,
      type: object.type,
      content: object.content,
      scientificRole: object.role ?? null,
      semanticKey: `semantic:${object.id}`,
      epistemicState: object.epistemicState ?? "KNOWN",
      provenanceKind: "USER_STATED" as const,
      provenance: provenance(`turn:${object.id}`),
      decisionRefs: [`decision:${object.id}`],
      sourceContributionRef: `contribution:${version}`,
      sourceItemRefs: [`source-item:${object.id}`],
    })),
    relations: input.relations ?? [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
    historicalObjectVersions: [],
    historicalRelationVersions: [],
    historicalTemporalQualificationVersions: [],
    historicalExpectedVariableOccasionVersions: [],
    legacyTemporalMappings: [],
    openConflicts: [],
    openIssues: input.issues ?? [],
    humanDecisions: [],
    decisionLedger: [],
    versionHistory: [],
    specializedResponsibilities: [],
    pendingVerificationRefs: [],
    activeQryNeed: null,
    readOnly: true as const,
  };
  return { ...base, snapshotDigest: logicalDigest(base) };
};

const question = (content: string): ObjectInput => ({ id: "question:design", type: "SCIENTIFIC_QUESTION", content });
const objective: ObjectInput = { id: "objective:primary", type: "OBJECTIVE", content: "Caractériser la trajectoire du critère principal", role: "PRIMARY" };
const population: ObjectInput = { id: "population:study", type: "POPULATION", content: "Population de recherche définie" };

describe("P1-RDE-01 — bounded Study Design runtime", () => {
  it("A — produces a prospective longitudinal option without adoption", () => {
    const source = snapshot({ objects: [question("Étudier prospectivement l'évolution longitudinale du critère lors du suivi"), objective, population] });
    const input = buildStudyDesignRuntimeInput(source);
    const proposal = executeStudyDesignRuntime(input);
    expect(proposal.options.map((option) => option.family.code)).toContain("PROSPECTIVE_LONGITUDINAL_COHORT");
    expect(proposal.options[0]?.axes.temporalDirection).toBe("PROSPECTIVE");
    expect(proposal.options[0]?.axes).toMatchObject({ interventionMode: "OBSERVATIONAL", structuralForm: "LONGITUDINAL", allocationMechanism: "NOT_APPLICABLE" });
    expect(proposal).toMatchObject({ selectedOptionId: null, candidateIsAdopted: false, projectWriteAuthorized: false, humanDecisionRequired: true });
    const downstream = buildStudyDesignDownstreamHandoffRequests(input, proposal);
    expect(downstream).toEqual(expect.arrayContaining([
      expect.objectContaining({
        owner: "BIOSTATISTICS",
        capabilityId: "BIOSTATISTICS_PLANNING",
        sourceProject: expect.objectContaining({ sourceProjectVersion: source.sourceProjectVersion, sourceProjectDigest: source.sourceProjectDigest }),
        projectWriteAuthorized: false,
      }),
    ]));
  });

  it("B — preserves prospective, retrospective and ambispective alternatives", () => {
    const source = snapshot({ objects: [question("Étudier une trajectoire longitudinale avec données rétrospectives existantes puis suivi prospectif"), objective, population] });
    const proposal = executeStudyDesignRuntime(buildStudyDesignRuntimeInput(source));
    expect(proposal.options.map((option) => option.family.code)).toEqual([
      "PROSPECTIVE_LONGITUDINAL_COHORT",
      "RETROSPECTIVE_LONGITUDINAL_COHORT",
      "AMBISPECTIVE_LONGITUDINAL_COHORT",
    ]);
    expect(proposal.tradeOffs).toHaveLength(1);
    expect(proposal.downstreamHandoffs.map((handoff) => handoff.targetOwner)).toEqual(expect.arrayContaining(["BIOSTATISTICS", "STUDY_DATA_CDM", "DATA_MANAGEMENT"]));
  });

  it("C — returns zero option and a future-QRY information need when context is insufficient", () => {
    const source = snapshot({ objects: [question("Quel plan d'étude faut-il retenir ?"), population] });
    const proposal = executeStudyDesignRuntime(buildStudyDesignRuntimeInput(source));
    expect(proposal).toMatchObject({ proposalStatus: "INSUFFICIENT_CONTEXT", options: [], epistemicStatus: "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED" });
    expect(proposal.informationNeeds).toEqual(expect.arrayContaining([
      expect.objectContaining({ intendedResolutionPath: "FUTURE_QRY_HANDOFF", status: "OPEN_NOT_RESOLVED" }),
    ]));
    expect(proposal.downstreamHandoffs).toEqual([]);
    const temporalUnknown = executeStudyDesignRuntime(buildStudyDesignRuntimeInput(snapshot({
      objects: [question("Étudier l'évolution longitudinale du critère"), objective, population],
    })));
    expect(temporalUnknown.options).toEqual([]);
    expect(temporalUnknown.proposalStatus).toBe("INSUFFICIENT_CONTEXT");
  });

  it("G — never invents an intervention when Project contains none", () => {
    const source = snapshot({ objects: [
      question("Comparer longitudinalement des trajectoires lors d'un suivi prospectif"),
      objective,
      population,
    ] });
    const proposal = executeStudyDesignRuntime(buildStudyDesignRuntimeInput(source));
    expect(proposal.options.some((option) => option.family.code === "INTERVENTIONAL_COMPARATIVE_STUDY")).toBe(false);
    expect(proposal.options.every((option) => option.axes.interventionMode === "OBSERVATIONAL")).toBe(true);
    expect(proposal.downstreamHandoffs.some((handoff) => handoff.targetOwner === "REGULATORY_RESOLUTION")).toBe(false);
  });

  it("H — retains comparator uncertainty instead of constructing a comparator", () => {
    const source = snapshot({ objects: [question("Comparer prospectivement les trajectoires longitudinales entre groupes"), objective, population] });
    const proposal = executeStudyDesignRuntime(buildStudyDesignRuntimeInput(source));
    const comparative = proposal.options.find((option) => option.family.code === "COMPARATIVE_OBSERVATIONAL");
    expect(comparative?.axes.comparisonStructure).toBe("UNKNOWN");
    expect(comparative?.unresolvedQuestions).toContain("Le comparateur ou la structure de comparaison reste à définir.");
    expect(proposal.informationNeeds).toEqual(expect.arrayContaining([expect.objectContaining({ question: expect.stringContaining("comparateur") })]));
  });

  it("binds identity exactly, is deterministic, and changes identity with Project version", () => {
    const sourceV1 = snapshot({ objects: [question("Suivi longitudinal prospectif"), objective, population] });
    const inputV1 = buildStudyDesignRuntimeInput(sourceV1);
    const before = JSON.stringify(sourceV1);
    const first = executeStudyDesignRuntime(inputV1);
    const second = executeStudyDesignRuntime(buildStudyDesignRuntimeInput(sourceV1));
    expect(second).toEqual(first);
    expect(JSON.stringify(sourceV1)).toBe(before);
    expect(sourceV1.humanDecisions).toEqual([]);
    expect(sourceV1.activeQryNeed).toBeNull();
    expect(first.sourceProject).toMatchObject({ projectVersion: sourceV1.sourceProjectVersion, projectDigest: sourceV1.sourceProjectDigest, snapshotDigest: sourceV1.snapshotDigest });

    const sourceV2 = snapshot({ version: "project-rde:version:2", objects: [question("Suivi longitudinal prospectif"), objective, population] });
    const next = executeStudyDesignRuntime(buildStudyDesignRuntimeInput(sourceV2));
    expect(next.proposalId).not.toBe(first.proposalId);
    expect(next.sourceProject.projectVersion).not.toBe(first.sourceProject.projectVersion);
    expect(next.sourceProject.projectDigest).not.toBe(first.sourceProject.projectDigest);
  });

  it("blocks invalid Project identity, more than three options and invalid handoffs", () => {
    const source = snapshot({ objects: [question("Suivi longitudinal prospectif"), objective, population] });
    const input = buildStudyDesignRuntimeInput(source);
    expect(() => executeStudyDesignRuntime({ ...input, projectVersion: "stale-version" })).toThrow("STUDY_DESIGN_SOURCE_PROJECT_IDENTITY_INVALID");
    const valid = executeStudyDesignRuntime(input);
    const overThree = {
      ...valid,
      options: [...valid.options, ...Array.from({ length: 4 }, (_, index) => ({ ...valid.options[0]!, optionId: `invalid-extra:${index}`, family: { ...valid.options[0]!.family, code: `INVALID_${index}` as never } }))],
    } as unknown as StudyDesignProposalContribution;
    const overThreeValidation = validateStudyDesignProposal(input, overThree);
    expect(overThreeValidation.status).toBe("BLOCKED");
    expect(overThreeValidation.findings.map((finding) => finding.code)).toContain("TOO_MANY_OPTIONS");

    const invalidHandoff = {
      ...valid,
      downstreamHandoffs: [{
        ...valid.downstreamHandoffs[0]!,
        targetOwner: "SCIENTIFIC_THINKING",
      }],
    } as StudyDesignProposalContribution;
    const handoffValidation = validateStudyDesignProposal(input, invalidHandoff);
    expect(handoffValidation.status).toBe("BLOCKED");
    expect(handoffValidation.findings.map((finding) => finding.code)).toContain("HANDOFF_INVALID");

    const unsupportedFamily = {
      ...valid,
      options: valid.options.map((option, index) => index === 0
        ? { ...option, family: { ...option.family, code: "UNSUPPORTED_DESIGN" } }
        : option),
    } as unknown as StudyDesignProposalContribution;
    expect(validateStudyDesignProposal(input, unsupportedFamily).findings.map((finding) => finding.code)).toContain("UNSUPPORTED_DESIGN_FAMILY");
  });

  it("adapts declared needs to the existing SpecializedOwnerHandoffRequest contract without executing them", () => {
    const source = snapshot({ objects: [question("Étudier une trajectoire longitudinale avec données rétrospectives existantes puis suivi prospectif"), objective, population] });
    const input = buildStudyDesignRuntimeInput(source);
    const proposal = executeStudyDesignRuntime(input);
    const requests = buildStudyDesignDownstreamHandoffRequests(input, proposal);
    expect(requests).toHaveLength(proposal.downstreamHandoffs.length);
    expect(requests).toEqual(expect.arrayContaining([
      expect.objectContaining({
        contract: "PROJECT_SPINE_02_SPECIALIZED_OWNER_HANDOFF",
        owner: "BIOSTATISTICS",
        capabilityId: "BIOSTATISTICS_PLANNING",
        projectWriteAuthorized: false,
        conversationalLlmExpertFallback: "FORBIDDEN",
        sourceProject: expect.objectContaining({ snapshotDigest: source.snapshotDigest }),
        nativeInput: expect.objectContaining({ sourceProposalRef: proposal.proposalId, projectWriteAuthorized: false }),
      }),
    ]));
  });

  it("exposes factual trace events without changing scientific output", () => {
    const source = snapshot({ objects: [question("Suivi longitudinal prospectif"), objective, population] });
    const input = buildStudyDesignRuntimeInput(source);
    const withoutTrace = executeStudyDesignRuntime(input);
    const facts: StudyDesignTraceFact[] = [];
    const withTrace = executeStudyDesignRuntime(input, (fact) => facts.push({ ...fact, handoffRefs: [...fact.handoffRefs] }));
    expect(withTrace).toEqual(withoutTrace);
    expect(facts.map((fact) => fact.event)).toEqual([
      "INVOCATION_REQUESTED",
      "PROJECT_VERSION_CONSUMED",
      "PROPOSAL_PRODUCED",
      "OPTION_COUNT_RECORDED",
      "HANDOFFS_PROPOSED",
    ]);
    expect(facts.every((fact) => fact.projectVersion === source.sourceProjectVersion && fact.projectDigest === source.sourceProjectDigest)).toBe(true);
  });

  it("adapts direct invocation to TRACE v2 without changing the proposal", () => {
    const source = snapshot({ objects: [question("Suivi longitudinal prospectif"), objective, population] });
    const trace = createScientificRunTraceRecorder({
      ledger: createScientificExecutionTraceLedger("session:rde-trace"),
      runId: "run:rde-trace",
      projectSnapshot: source,
      initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "P1-RDE-01" },
      startedAt: "2026-09-02T00:00:00.000Z",
    });
    const invoke = (withTrace: boolean) => invokeStudyDesignForProjectSnapshot({
      projectSnapshot: source,
      ledger: createProductOwnerResultLedger("session:rde-owner-ledger"),
      callerRef: "P1-RDE-01",
      purpose: "Qualifier une stratégie de design sans adoption.",
      startedAt: "2026-09-02T00:00:01.000Z",
      completedAt: "2026-09-02T00:00:02.000Z",
      monotonicNow: (() => { let value = 0; return () => value++; })(),
      trace: withTrace ? trace : undefined,
    });
    const untraced = invoke(false);
    const traced = invoke(true);
    expect(traced.result?.nativePayload).toEqual(untraced.result?.nativePayload);
    expect(traced.projectWrites).toBe(0);
    expect(traced.humanDecisionCreated).toBe(false);
    expect(traced.providerCalls).toBe(0);
    const ownerEvents = trace.getLedger().events.filter((event) => event.owner === "STUDY_DESIGN");
    expect(ownerEvents.map((event) => event.eventType)).toEqual([
      "HANDOFF_STARTED",
      "HANDOFF_ACCEPTED",
      "OWNER_INVOCATION_STARTED",
      "OWNER_INVOCATION_COMPLETED",
      "RESULT_PERSISTED",
    ]);
    expect(ownerEvents.find((event) => event.eventType === "OWNER_INVOCATION_COMPLETED")?.technicalMetadata).toMatchObject({
      optionCount: traced.result?.nativePayload?.options.length,
      handoffCount: traced.result?.nativePayload?.downstreamHandoffs.length,
    });
  });

  it("registers exactly one callable Study Design capability wired through the governed product boundary", () => {
    const entries = listSpecializedOwnerCapabilities().entries.filter((entry) => entry.capabilityId === "STUDY_DESIGN_COHERENCE");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      owner: "STUDY_DESIGN",
      status: "AVAILABLE_WITH_LIMITATIONS",
      implementationVersion: "1.0.0",
      readsProjectSnapshot: true,
      canWriteProject: false,
      externalProvider: "NONE",
    });
    expect(entries[0]?.limitations).toEqual(expect.arrayContaining([expect.stringContaining("IMPLEMENTED_AND_PRODUCT_WIRED")]));
  });
});
