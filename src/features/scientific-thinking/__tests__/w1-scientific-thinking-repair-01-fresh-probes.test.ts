import { describe, expect, it } from "vitest";
import {
  KNOWLEDGE_ENGINE_VERSION,
  logicalDigest,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import {
  appendProductOwnerInvocation,
  createProductOwnerResultLedger,
} from "@/features/protocol-designer/product-owner-result-ledger";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  listScientificRunEvents,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  createSpecializedOwnerHandoffRequestFromSnapshot,
  recordSpecializedOwnerResult,
  type NativeOwnerInvocationObservation,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { executeScientificThinkingEngine } from "../engine";

type ProbeDefinition = {
  probeId: string;
  question: string | null;
  purpose: string;
  population: string;
  condition: string;
  reasoningObjects: string[];
  knowledgeSupport: "PARTIAL" | "CONFLICTING" | "NO_MATCH";
  knowledgeStatement: string;
  knowledgeGap?: string;
  projectUnknown?: string;
  outOfOwner?: boolean;
};

const authority = {
  actorRef: "w1-st-repair-01:development-probe-author",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const change = (input: Partial<PersistentProjectDeltaChange> & Pick<PersistentProjectDeltaChange, "candidateRef" | "proposedType" | "content" | "sourceText">): PersistentProjectDeltaChange => ({
  operation: "ADD",
  targetSectionId: "MEASUREMENTS",
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

const projectFor = (probe: ProbeDefinition): ResearchProjectOwnerProjection => {
  const raw = [probe.question, probe.population, probe.condition, ...probe.reasoningObjects, probe.projectUnknown].filter(Boolean).join(" ");
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${probe.probeId}`,
    language: "fr",
    turns: [{ turnId: `turn:${probe.probeId}`, role: "USER", content: raw, createdAt: "2026-08-25T23:10:00.000Z" }],
  };
  const changes: PersistentProjectDeltaChange[] = [
    ...(probe.question ? [change({
      candidateRef: `${probe.probeId}:question`,
      proposedType: "SCIENTIFIC_QUESTION",
      targetSectionId: "ANALYSIS",
      content: probe.question,
      sourceText: raw,
    })] : []),
    change({
      candidateRef: `${probe.probeId}:population`,
      proposedType: "POPULATION",
      targetSectionId: "POPULATION",
      content: probe.population,
      sourceText: raw,
    }),
    change({
      candidateRef: `${probe.probeId}:condition`,
      proposedType: "CONDITION",
      targetSectionId: "POPULATION",
      content: probe.condition,
      sourceText: raw,
    }),
    ...probe.reasoningObjects.map((content, index) => change({
      candidateRef: `${probe.probeId}:reasoning:${index + 1}`,
      proposedType: "CANONICAL_VARIABLE",
      targetSectionId: "MEASUREMENTS",
      content,
      sourceText: raw,
    })),
    ...(probe.projectUnknown ? [change({
      candidateRef: `${probe.probeId}:unknown`,
      proposedType: "UNCERTAINTY",
      targetSectionId: "ANALYSIS",
      content: probe.projectUnknown,
      sourceText: raw,
      epistemicStatus: "UNKNOWN",
      epistemicState: "UNKNOWN",
    })] : []),
  ];
  const checked = validatePersistentProjectDelta({
    changes,
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  }, raw, null, conversation);
  expect(checked.validation.blocks).toEqual([]);
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: null,
    createdAt: "2026-08-25T23:10:00.000Z",
  });
  return confirmResearchProjectContribution({
    contribution: contribution!,
    current: null,
    projectId: `project:w1-st-repair-01:${probe.probeId.toLowerCase()}`,
    authority,
    confirmedAt: "2026-08-25T23:10:00.000Z",
  });
};

const frozenKnowledgeFor = (probe: ProbeDefinition, project: ResearchProjectOwnerProjection) => {
  const snapshot = buildProjectContextSnapshot({ project });
  const request = buildKnowledgeRequestFromCanonicalSnapshot({
    projectSnapshot: snapshot,
    question: probe.question ?? probe.purpose,
    createdAt: "2026-08-25T23:11:00.000Z",
  });
  const resultId = `frozen-knowledge-result:w1-st-repair-01:${probe.probeId}`;
  const resultDigest = logicalDigest({
    probeId: probe.probeId,
    requestId: request.requestId,
    support: probe.knowledgeSupport,
    statement: probe.knowledgeStatement,
    gap: probe.knowledgeGap ?? null,
  });
  const assertionId = `frozen-assertion:w1-st-repair-01:${probe.probeId}`;
  const sourceId = `fixture-source:w1-st-repair-01:${probe.probeId}`;
  const evidenceId = `frozen-evidence:w1-st-repair-01:${probe.probeId}`;
  const hasEvidence = probe.knowledgeSupport !== "NO_MATCH";
  const nativePayload = {
    contractVersion: KNOWLEDGE_ENGINE_VERSION,
    resultId,
    resultRevision: 1,
    resultDigest,
    request,
    registrySnapshotRef: "frozen-provider-registry:w1-st-repair-01:1",
    coverageStatus: probe.knowledgeSupport,
    resolvedConcepts: probe.reasoningObjects.map((label, index) => ({
      conceptId: `frozen-concept:${probe.probeId}:${index + 1}`,
      preferredLabel: label,
      originalTerms: [label],
      kind: hasEvidence ? "DOCUMENT_BOUND_CONCEPT" : "UNKNOWN",
      objectType: "PHENOMENON",
      providerConcepts: { "W1-ST-REPAIR-01-FROZEN": [`provider-concept:${probe.probeId}:${index + 1}`] },
    })),
    applicableAssertions: hasEvidence ? [{
      stableId: assertionId,
      revision: "1",
      providerId: "W1-ST-REPAIR-01-FROZEN",
      status: "GOVERNED_DOCUMENTARY",
      text: probe.knowledgeStatement,
      atomicContent: { boundedDevelopmentProbe: true },
      conceptIds: probe.reasoningObjects.map((_label, index) => `frozen-concept:${probe.probeId}:${index + 1}`),
      modality: "NOT_APPLICABLE",
      context: { applicability: "BOUNDED_DEVELOPMENT_PROBE" },
      polarity: probe.knowledgeSupport === "CONFLICTING" ? "QUALIFIED" : "AFFIRMED",
      evidenceRelations: ["QUALIFIES"],
      limitations: ["Development probe evidence is bounded and non-qualifying."],
      reviewStatus: "AUTHORED_DEVELOPMENT_FIXTURE",
      locator: sourceId,
      applicability: "APPLICABLE_WITH_LIMITATIONS",
      applicabilityReasons: ["Bounded deterministic development probe."],
    }] : [],
    documentaryStatements: [],
    evidence: hasEvidence ? [{
      evidenceId,
      assertionId,
      sourceId,
      relation: "QUALIFIES",
      locator: sourceId,
      limitations: ["Development probe evidence is bounded and non-qualifying."],
    }] : [],
    sources: hasEvidence ? [{ sourceId, revision: "1", title: sourceId, status: "GOVERNED_DOCUMENTARY", locator: sourceId }] : [],
    gaps: probe.knowledgeGap ? [{
      gapId: `frozen-gap:${probe.probeId}`,
      code: probe.knowledgeGap,
      explanation: "A major evidence gap is intentionally frozen for this development probe.",
      affectedConceptIds: probe.reasoningObjects.map((_label, index) => `frozen-concept:${probe.probeId}:${index + 1}`),
      resumeCondition: "Provide admitted owner evidence; no automatic inference.",
    }] : [],
    limitations: ["Development probe evidence is bounded and non-qualifying."],
    controversies: probe.knowledgeSupport === "CONFLICTING" ? [{
      conflictId: `frozen-conflict:${probe.probeId}`,
      state: "OPEN",
      explanation: "Two contextual explanations remain plausible and no winner is selected.",
    }] : [],
    unresolvedConcepts: hasEvidence ? [] : [...probe.reasoningObjects],
    ambiguities: hasEvidence ? [] : ["INSUFFICIENT_EVIDENCE"],
    provenance: [{ providerId: "W1-ST-REPAIR-01-FROZEN", version: "1", representationDigest: logicalDigest(sourceId) }],
    trace: { engineVersion: KNOWLEDGE_ENGINE_VERSION, privacy: { externalCallMade: false } },
    externalEvidence: null,
  } as unknown as KnowledgeResult;
  const requestHandoff = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId: `frozen-knowledge-handoff:${probe.probeId}`,
    owner: "KNOWLEDGE",
    capabilityId: "KNOWLEDGE_EVIDENCE",
    purpose: `Frozen Knowledge input for ${probe.probeId}.`,
    sourceProject: snapshot,
    nativeInputType: "KnowledgeRequest",
    nativeInputVersion: KNOWLEDGE_ENGINE_VERSION,
    nativeInput: request,
  });
  const result = recordSpecializedOwnerResult({
    request: requestHandoff,
    resultId,
    resultVersion: "1",
    completedAt: "2026-08-25T23:11:00.000Z",
    status: "COMPLETED_WITH_LIMITATIONS",
    resultKind: hasEvidence ? "EVIDENCE_DIAGNOSTIC" : "GAP",
    nativePayloadType: "KnowledgeResult",
    nativePayloadVersion: KNOWLEDGE_ENGINE_VERSION,
    nativePayload,
    stableProjectRefs: snapshot.objects.map((item) => item.stableId),
    evidenceRefs: hasEvidence ? [sourceId, evidenceId] : [],
    unknowns: hasEvidence ? [] : [...probe.reasoningObjects],
    gaps: probe.knowledgeGap ? [`frozen-gap:${probe.probeId}`] : [],
    limitations: ["Development probe evidence is bounded and non-qualifying."],
    provenance: [sourceId, resultDigest],
  });
  const observation: NativeOwnerInvocationObservation = {
    contract: "PROJECT_SPINE_03_NATIVE_OWNER_INVOCATION",
    contractVersion: "0.1.0",
    invocationId: `frozen-knowledge-invocation:${probe.probeId}`,
    handoffId: requestHandoff.handoffId,
    owner: "KNOWLEDGE",
    capabilityId: "KNOWLEDGE_EVIDENCE",
    ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION,
    sourceProjectRef: snapshot.sourceProjectRef,
    sourceProjectVersion: snapshot.sourceProjectVersion,
    sourceProjectDigest: snapshot.sourceProjectDigest,
    requestRef: request.requestId,
    resultRef: `${result.resultId}@${result.resultVersion}`,
    status: hasEvidence ? "COMPLETED" : "OWNER_EVIDENCE_GAP",
    failureCode: null,
    provenance: [...result.provenance],
    evidenceRefs: [...result.evidenceRefs],
    unknowns: [...result.unknowns],
    gaps: [...result.gaps],
    limitations: [...result.limitations],
    startedAt: "2026-08-25T23:11:00.000Z",
    completedAt: "2026-08-25T23:11:00.000Z",
    latencyMs: 0,
    runtimeStarts: 0,
    llmFallbackCalls: 0,
    projectWrites: 0,
  };
  const retained = appendProductOwnerInvocation({
    ledger: createProductOwnerResultLedger(`w1-st-repair-01:${probe.probeId}`),
    callerRef: "W1-ST-REPAIR-01:FRESH-PROBE",
    retainedAt: "2026-08-25T23:11:00.000Z",
    request: requestHandoff,
    result,
    observation,
    dependencies: [],
  });
  return { snapshot, ledger: retained.ledger, result };
};

const runProbe = (probe: ProbeDefinition, runSuffix = "primary") => {
  const project = projectFor(probe);
  const knowledge = frozenKnowledgeFor(probe, project);
  const trace = createScientificRunTraceRecorder({
    ledger: createScientificExecutionTraceLedger(`session:w1-st-repair-01:${probe.probeId}:${runSuffix}`),
    runId: `scientific-run:w1-st-repair-01:${probe.probeId}:${runSuffix}`,
    projectSnapshot: knowledge.snapshot,
    initiatorContext: { kind: "TEST_HARNESS", initiatorRef: `W1-ST-REPAIR-01:${probe.probeId}` },
    startedAt: "2026-08-25T23:12:00.000Z",
    createdAt: "2026-08-25T23:12:00.000Z",
  });
  const invocation = invokeScientificThinkingForProject({
    project,
    projectSnapshot: knowledge.snapshot,
    knowledgeResultId: knowledge.result.resultId,
    ledger: knowledge.ledger,
    callerRef: "W1-ST-REPAIR-01:FRESH-PROBE",
    purpose: probe.purpose,
    startedAt: "2026-08-25T23:12:00.000Z",
    completedAt: "2026-08-25T23:12:01.000Z",
    runtime: executeScientificThinkingEngine,
    monotonicNow: (() => { let value = 0; return () => ++value; })(),
    trace,
  });
  const run = trace.complete("2026-08-25T23:12:01.000Z");
  const events = listScientificRunEvents({ ledger: trace.getLedger(), runId: run.runId });
  expect(events.length).toBeGreaterThan(0);
  expect(events.every((event) => event.privateReasoningStored === false)).toBe(true);
  expect(invocation.projectWrites).toBe(0);
  expect(invocation.result?.projectWriteAuthorized).toBe(false);
  expect(invocation.entry.dependencies).toEqual([expect.objectContaining({ owner: "KNOWLEDGE", resultId: knowledge.result.resultId })]);
  return invocation.result!.nativePayload;
};

const probes = {
  A: {
    probeId: "ST-REPAIR-A",
    question: "Chez des adultes avec arthrose, le programme d’exercice conduit-il à une meilleure mobilité que l’éducation seule ?",
    purpose: "Examiner des contributions candidates pour une comparaison explicite sans sélectionner de stratégie.",
    population: "Adultes avec arthrose",
    condition: "Arthrose",
    reasoningObjects: ["Programme d’exercice", "Éducation seule", "Mobilité fonctionnelle"],
    knowledgeSupport: "PARTIAL",
    knowledgeStatement: "Les deux stratégies et la mobilité sont documentées avec une applicabilité contextuelle limitée.",
  },
  B: {
    probeId: "ST-REPAIR-B",
    question: "Chez des adultes avec syndrome métabolique, le niveau de cytokine anticipe-t-il la récupération fonctionnelle à six mois ?",
    purpose: "Proposer une relation prédictive candidate sans affirmer une performance démontrée.",
    population: "Adultes avec syndrome métabolique",
    condition: "Syndrome métabolique",
    reasoningObjects: ["Niveau de cytokine", "Récupération fonctionnelle à six mois"],
    knowledgeSupport: "PARTIAL",
    knowledgeStatement: "Une association contextuelle est plausible mais ne démontre ni causalité ni performance prédictive.",
  },
  C: {
    probeId: "ST-REPAIR-C",
    question: "Pourquoi certains traitements échouent-ils malgré une exposition adéquate chez des adultes atteints de mélanome ?",
    purpose: "Préserver plusieurs explications candidates sans choisir de mécanisme gagnant.",
    population: "Adultes atteints de mélanome",
    condition: "Mélanome",
    reasoningObjects: ["Échec thérapeutique", "Exposition adéquate", "Échappement immunitaire"],
    knowledgeSupport: "CONFLICTING",
    knowledgeStatement: "Plusieurs explications contextualisées restent plausibles et contradictoires.",
  },
  D: {
    probeId: "ST-REPAIR-D",
    question: "Pourquoi le signal composite change-t-il après une exposition environnementale chez des adultes ?",
    purpose: "Conserver le gap critique sans produire une hypothèse forte de remplissage.",
    population: "Adultes exposés",
    condition: "Exposition environnementale",
    reasoningObjects: ["Signal composite", "Réponse après exposition"],
    knowledgeSupport: "NO_MATCH",
    knowledgeStatement: "Aucune assertion applicable n’est disponible.",
    knowledgeGap: "MAJOR_EVIDENCE_GAP",
  },
  E: {
    probeId: "ST-REPAIR-E",
    question: null,
    purpose: "Une dimension structurante du projet reste inconnue et doit être clarifiée avant toute proposition précise.",
    population: "Participants atteints d’une maladie rare",
    condition: "Maladie rare",
    reasoningObjects: ["Phénotype composite", "Évolution clinique"],
    knowledgeSupport: "PARTIAL",
    knowledgeStatement: "Les objets sont documentés séparément, sans relation soutenable entre eux.",
    projectUnknown: "Relation causale structurante non définie",
  },
  F: {
    probeId: "ST-REPAIR-F",
    question: "Pourquoi la récupération diffère-t-elle après une même charge virale chez des adultes infectés ?",
    purpose: "Conserver la contradiction Knowledge et les explications concurrentes candidates.",
    population: "Adultes infectés",
    condition: "Infection virale",
    reasoningObjects: ["Charge virale", "Récupération", "Réponse immunitaire"],
    knowledgeSupport: "CONFLICTING",
    knowledgeStatement: "Deux explications contextuelles incompatibles restent ouvertes.",
  },
  G: {
    probeId: "ST-REPAIR-G",
    question: "Quelle campagne marketing maximise la conversion d’un service grand public ?",
    purpose: "Refuser une demande hors ownership scientifique sans pseudo-candidat.",
    population: "Audience commerciale",
    condition: "Service grand public",
    reasoningObjects: ["Campagne marketing", "Conversion"],
    knowledgeSupport: "PARTIAL",
    knowledgeStatement: "Fixture de frontière hors owner.",
    outOfOwner: true,
  },
  H: {
    probeId: "ST-REPAIR-H",
    question: "Le profil de sommeil module-t-il la réponse immunitaire après vaccination chez des adultes ?",
    purpose: "Démontrer une éligibilité structurelle indépendante des déclencheurs lexicaux historiques.",
    population: "Adultes vaccinés",
    condition: "Vaccination",
    reasoningObjects: ["Profil de sommeil", "Réponse immunitaire"],
    knowledgeSupport: "PARTIAL",
    knowledgeStatement: "Les deux objets sont documentés avec une portée contextuelle bornée.",
  },
} satisfies Record<string, ProbeDefinition>;

describe("W1-ST-REPAIR-01 — fresh independent development probes", () => {
  it("Probe A — produces pending reasoning candidates for a supported comparative question", () => {
    const output = runProbe(probes.A);
    expect(output.hypotheses.length).toBeGreaterThan(0);
    expect(output.objectives.length).toBeGreaterThan(0);
    expect([...output.hypotheses, ...output.objectives].every((candidate) => candidate.reviewState === "PENDING")).toBe(true);
  });

  it("Probe B — proposes a bounded predictive hypothesis without evidence promotion", () => {
    const output = runProbe(probes.B);
    expect(output.hypotheses.length).toBeGreaterThan(0);
    expect(output.hypotheses.every((hypothesis) => hypothesis.support !== "SUPPORTED" && hypothesis.reviewState === "PENDING")).toBe(true);
  });

  it("Probe C — preserves multiple plausible explanations and the Knowledge contradiction", () => {
    const output = runProbe(probes.C);
    expect(output.alternatives.length).toBeGreaterThan(0);
    expect(output.contradictions).toEqual(expect.arrayContaining([expect.stringContaining("frozen-conflict:ST-REPAIR-C")]));
    expect(output.hypotheses.every((hypothesis) => hypothesis.reviewState === "PENDING")).toBe(true);
  });

  it("Probe D — does not force a strong hypothesis when evidence is insufficient", () => {
    const output = runProbe(probes.D);
    expect(output.hypotheses.every((hypothesis) => hypothesis.support === "UNSUPPORTED")).toBe(true);
    expect(output.knowledgeRequest?.gapCodes).toContain("MAJOR_EVIDENCE_GAP");
    expect(output.proposedNextAction).not.toBe("HANDOFF_TO_RESEARCH_DESIGN");
  });

  it("Probe E — preserves a structuring Project unknown without inventing a precise hypothesis", () => {
    const output = runProbe(probes.E);
    expect(output.unknowns).toEqual(expect.arrayContaining([expect.stringContaining("UNKNOWN_PROJECT_OBJECT:ST-REPAIR-E:unknown")]));
    expect(output.hypotheses).toHaveLength(0);
  });

  it("Probe F — keeps the contradiction and a competing candidate without selecting a winner", () => {
    const output = runProbe(probes.F);
    expect(output.contradictions).toEqual(expect.arrayContaining([expect.stringContaining("frozen-conflict:ST-REPAIR-F")]));
    expect(output.alternatives.length).toBeGreaterThan(0);
    expect(output.selectedQuestionCandidate).toBeNull();
  });

  it("Probe G — refuses out-of-owner input without pseudo-candidates", () => {
    const output = runProbe(probes.G);
    expect(output.refusal?.code).toBe("OUT_OF_DOMAIN");
    expect(output.questions).toHaveLength(0);
    expect(output.hypotheses).toHaveLength(0);
    expect(output.objectives).toHaveLength(0);
  });

  it("Probe H — is independent of legacy lexical triggers", () => {
    const output = runProbe(probes.H);
    expect(output.hypotheses.length + output.objectives.length + output.alternatives.length).toBeGreaterThan(0);
    expect([...output.hypotheses, ...output.objectives].every((candidate) => candidate.reviewState === "PENDING")).toBe(true);
  });

  it("replays the principal positive probes deterministically", () => {
    for (const probe of [probes.A, probes.B, probes.C, probes.H]) {
      const first = runProbe(probe, "determinism-1");
      const second = runProbe(probe, "determinism-2");
      expect(second.outputDigest).toBe(first.outputDigest);
      expect(second.questions).toEqual(first.questions);
      expect(second.hypotheses).toEqual(first.hypotheses);
      expect(second.objectives).toEqual(first.objectives);
      expect(second.contradictions).toEqual(first.contradictions);
    }
  });
});
