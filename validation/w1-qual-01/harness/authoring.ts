/* eslint-disable @typescript-eslint/no-explicit-any -- bounded multi-owner fixture construction crosses heterogeneous frozen contracts */
import {
  KNOWLEDGE_ENGINE_VERSION,
  logicalDigest,
  type KnowledgeRequest,
} from "@/features/knowledge-engine";
import { IMAGING_STUDY_DESIGNER_VERSION } from "@/features/imaging-study-designer";
import {
  createRegulatoryResolutionInput,
  knownFact,
  REG000_CORPUS_DIGEST,
  REGULATORY_RESOLUTION_VERSION,
  unknownFact,
} from "@/features/regulatory-resolution";
import { SCIENTIFIC_THINKING_ENGINE_VERSION } from "@/features/scientific-thinking";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import {
  appendProductOwnerInvocation,
  createProductOwnerResultLedger,
  ownerResultNativeDigest,
} from "@/features/protocol-designer/product-owner-result-ledger";
import {
  buildImagingInputFromProjectAndScientificThinking,
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  buildScientificThinkingInputFromProjectSnapshot,
  confirmResearchProjectContribution,
  createSpecializedOwnerHandoffRequestFromSnapshot,
  recordSpecializedOwnerResult,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

export const CAMPAIGN_ID = "W1-QUAL-01-2026-08-25-G" as const;
export const HARNESS_VERSION = "1.1.3" as const;
export const AUTHORED_AT = "2026-08-25T22:00:00.000Z" as const;
export const INITIAL_HEAD = "772cacfd184daeb531eef6a7a866874a7863e228" as const;
export const INVALIDATED_PREDECESSOR_CAMPAIGNS = Object.freeze([
  {
    campaignId: "W1-QUAL-01-2026-08-25-A",
    invalidationReason: "CHARACTERIZATION_HARNESS_VAL_REPLAY_CONFIGURATION_MISMATCH",
    firstDivergentStage: "CHARACTERIZATION_HARNESS",
    ownerRuntimeChanges: 0,
    observedResultsRetained: false,
    correctionScope: "HARNESS_REPLAY_USES_IDENTICAL_FROZEN_VALIDATION_INPUT",
  },
  {
    campaignId: "W1-QUAL-01-2026-08-25-B",
    invalidationReason: "CHARACTERIZATION_HARNESS_ACCEPTANCE_EVALUATOR_FALSE_NEGATIVES",
    firstDivergentStage: "CHARACTERIZATION_HARNESS",
    ownerRuntimeChanges: 0,
    observedResultsRetained: false,
    correctionScope: "DOCUMENTARY_GROUNDING_ACCEPTED; NON_INTERCHANGEABILITY_WORDING_ACCEPTED; PROJECT_QUESTION_INPUT_PRESERVATION_CHECKED",
  },
  {
    campaignId: "W1-QUAL-01-2026-08-25-C",
    invalidationReason: "CHARACTERIZATION_HARNESS_OWNER_COVERAGE_INSUFFICIENT",
    firstDivergentStage: "CHARACTERIZATION_HARNESS",
    ownerRuntimeChanges: 0,
    observedResultsRetained: false,
    correctionScope: "KNOWLEDGE_CRITICAL_CONCEPT_COVERAGE_AND_TYPED_IMAGING_UPSTREAM_FIXTURES",
  },
  {
    campaignId: "W1-QUAL-01-2026-08-25-D",
    invalidationReason: "CHARACTERIZATION_HARNESS_INVALID_STALE_SUCCESSOR_SNAPSHOT",
    firstDivergentStage: "CHARACTERIZATION_HARNESS",
    ownerRuntimeChanges: 0,
    observedResultsRetained: false,
    correctionScope: "CANONICAL_HUMAN_CONFIRMED_PROJECT_SUCCESSOR_AND_VALID_SNAPSHOT_FOR_STALE_READBACK",
  },
  {
    campaignId: "W1-QUAL-01-2026-08-25-E",
    invalidationReason: "CHARACTERIZATION_FREEZE_REG_CORPUS_METADATA_OMITTED",
    firstDivergentStage: "CHARACTERIZATION_HARNESS",
    ownerRuntimeChanges: 0,
    observedResultsRetained: false,
    correctionScope: "FREEZE_EXPLICIT_REG_CORPUS_VERSION_DIGEST_ADMISSION_STATUS_AND_KNOWLEDGE_REGISTRY_DIGEST",
  },
  {
    campaignId: "W1-QUAL-01-2026-08-25-F",
    invalidationReason: "CHARACTERIZATION_HARNESS_TARGETED_LINT_FAILED",
    firstDivergentStage: "CHARACTERIZATION_HARNESS",
    ownerRuntimeChanges: 0,
    observedResultsRetained: false,
    correctionScope: "LOCAL_EXPLICIT_NO_EXPLICIT_ANY_EXEMPTION_FOR_HETEROGENEOUS_FROZEN_CONTRACT_INSPECTION",
  },
]);

type Owner = "KNOWLEDGE" | "SCIENTIFIC_THINKING" | "IMAGING" | "REG" | "VAL";

export type CharacterizationCase = {
  caseId: string;
  ownerUnderTest: Owner;
  domain: string;
  purpose: string;
  inputArtifactRefs: string[];
  projectRef: string;
  upstreamFrozenResultRefs: string[];
  scientificContext: string;
  testedCapabilities: string[];
  expectedObligations: string[];
  forbiddenBehaviors: string[];
  allowedAlternatives: string[];
  expectedGaps: string[];
  expectedLimitations: string[];
  referenceRefs: string[];
  reviewStatus: "AUTHORED_PRE_OBSERVATION";
  exposureStatus: "UNEXPOSED";
  replayPredeclared: boolean;
};

export type EnvelopeObligation = {
  obligationId: string;
  checkId: string;
  critical: boolean;
  statement: string;
  failureClass: string;
  referenceRefs: string[];
};

export type AcceptanceEnvelope = {
  envelopeId: string;
  caseId: string;
  ownerUnderTest: Owner;
  obligations: EnvelopeObligation[];
  allowedVariation: string[];
  forbiddenBehaviors: string[];
  unknownsToPreserve: string[];
  limitationsToExpose: string[];
  referenceSupport: "SUPPORTED_WITHIN_ADMITTED_CORPUS" | "CONTRACT_ONLY";
  authoredBeforeObservation: true;
};

export type FrozenInputPack = {
  packId: string;
  version: "1.0.0";
  sourceCase: string;
  ownerUnderTest: Owner;
  provenance: string[];
  purpose: string;
  payload: Record<string, unknown>;
  digest: string;
  frozen: true;
};

const authority = {
  actorRef: "w1-qual-01:characterization-author",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

type ProjectObject = {
  ref: string;
  type: PersistentProjectDeltaChange["proposedType"];
  section: PersistentProjectDeltaChange["targetSectionId"];
  content: string;
  epistemic?: PersistentProjectDeltaChange["epistemicStatus"];
  role?: PersistentProjectDeltaChange["studyRole"];
};

const projectChange = (raw: string, item: ProjectObject): PersistentProjectDeltaChange => ({
  operation: "ADD",
  candidateRef: item.ref,
  proposedType: item.type,
  targetSectionId: item.section,
  targetProjectRef: null,
  semanticIdentity: item.ref,
  content: item.content,
  polarity: "AFFIRMED",
  studyRole: item.role ?? null,
  epistemicStatus: item.epistemic ?? "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  sourceText: raw,
  proposalSourceText: null,
  evidenceRefs: [],
});

const projectFrom = (slug: string, raw: string, objects: ProjectObject[]) => {
  const at = "2026-08-25T16:01:00.000Z";
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:w1-qual-01:${slug}`,
    language: "fr",
    turns: [{ turnId: `turn:w1-qual-01:${slug}`, role: "USER", content: raw, createdAt: at }],
  };
  const checked = validatePersistentProjectDelta({
    changes: objects.map((item) => projectChange(raw, item)),
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  }, raw, null, conversation);
  if (checked.validation.blocks.length || !checked.candidate) {
    throw new Error(`W1_QUAL_PROJECT_FIXTURE_INVALID:${slug}:${checked.validation.blocks.join(",")}`);
  }
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate,
    conversation,
    currentProject: null,
    createdAt: at,
  });
  if (!contribution) throw new Error(`W1_QUAL_PROJECT_CONTRIBUTION_MISSING:${slug}`);
  const project = confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: `project:w1-qual-01:${slug}`,
    authority,
    confirmedAt: at,
  });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const PROJECTS = {
  cardiac: projectFrom(
    "cardiac",
    "Chez des adultes après infarctus, le projet examine séparément obstruction microvasculaire et hémorragie intramyocardique par IRM cardiaque; la définition opérationnelle multicentrique reste inconnue.",
    [
      { ref: "cardiac-question", type: "SCIENTIFIC_QUESTION", section: "ANALYSIS", content: "Comment distinguer obstruction microvasculaire et hémorragie intramyocardique après infarctus par IRM cardiaque ?" },
      { ref: "cardiac-pop", type: "POPULATION", section: "POPULATION", content: "Adultes après infarctus du myocarde" },
      { ref: "cardiac-condition", type: "CONDITION", section: "POPULATION", content: "Infarctus du myocarde" },
      { ref: "cardiac-mvo", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Obstruction microvasculaire" },
      { ref: "cardiac-imh", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Hémorragie intramyocardique" },
      { ref: "cardiac-mri", type: "IMAGING_MODALITY", section: "IMAGING", content: "IRM cardiaque" },
      { ref: "cardiac-lge", type: "ACQUISITION", section: "IMAGING", content: "Rehaussement tardif" },
      { ref: "cardiac-unknown", type: "UNCERTAINTY", section: "ANALYSIS", content: "Définition opérationnelle multicentrique", epistemic: "UNKNOWN" },
    ],
  ),
  spectral: projectFrom(
    "spectral",
    "Le projet compare l'image virtuelle sans contraste et l'acquisition sans injection native en scanner spectral multicentrique, sans supposer leur équivalence ni la comparabilité interconstructeur.",
    [
      { ref: "spectral-question", type: "SCIENTIFIC_QUESTION", section: "ANALYSIS", content: "Dans quelles conditions une image virtuelle sans contraste peut-elle être comparée à une acquisition native sans injection ?" },
      { ref: "spectral-vnc", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Image virtuelle sans contraste" },
      { ref: "spectral-native", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Acquisition native sans injection" },
      { ref: "spectral-modality", type: "IMAGING_MODALITY", section: "IMAGING", content: "Scanner spectral" },
      { ref: "spectral-acq", type: "ACQUISITION", section: "IMAGING", content: "Acquisition double énergie ou comptage photonique" },
      { ref: "spectral-design", type: "STUDY_DESIGN", section: "DESIGN", content: "Étude multicentrique" },
      { ref: "spectral-unknown", type: "UNCERTAINTY", section: "ANALYSIS", content: "Comparabilité interconstructeur", epistemic: "UNKNOWN" },
    ],
  ),
  neuro: projectFrom(
    "neuro",
    "Chez des adultes avec ischémie cérébrale, le projet examine CBF, CBV et délai de transit par ASL, DSC et scanner de perfusion; le logiciel de post-traitement n'est pas déterminé.",
    [
      { ref: "neuro-question", type: "SCIENTIFIC_QUESTION", section: "ANALYSIS", content: "Comment interpréter conjointement CBF, CBV et délai de transit selon ASL, DSC et scanner de perfusion ?" },
      { ref: "neuro-pop", type: "POPULATION", section: "POPULATION", content: "Adultes avec ischémie cérébrale" },
      { ref: "neuro-condition", type: "CONDITION", section: "POPULATION", content: "Ischémie cérébrale" },
      { ref: "neuro-cbf", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Débit sanguin cérébral CBF" },
      { ref: "neuro-cbv", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Volume sanguin cérébral CBV" },
      { ref: "neuro-delay", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Délai de transit" },
      { ref: "neuro-modality", type: "IMAGING_MODALITY", section: "IMAGING", content: "ASL, DSC et scanner de perfusion" },
      { ref: "neuro-unknown", type: "UNCERTAINTY", section: "ANALYSIS", content: "Logiciel de post-traitement", epistemic: "UNKNOWN" },
    ],
  ),
  unsupported: projectFrom(
    "unsupported",
    "Le projet explore un signal zéphyr quantique pulmonaire par imagerie, mais aucune définition scientifique ou méthode de mesure admise n'est disponible.",
    [
      { ref: "unsupported-question", type: "SCIENTIFIC_QUESTION", section: "ANALYSIS", content: "Le signal zéphyr quantique pulmonaire peut-il être observé par imagerie ?" },
      { ref: "unsupported-object", type: "CANONICAL_VARIABLE", section: "MEASUREMENTS", content: "Signal zéphyr quantique pulmonaire", epistemic: "UNKNOWN" },
      { ref: "unsupported-method", type: "PROJECT_INFORMATION", section: "IMAGING", content: "Méthode de mesure non définie", epistemic: "UNKNOWN" },
    ],
  ),
  regulatory: projectFrom(
    "regulatory",
    "Le projet est une recherche observationnelle prospective multicentrique utilisant des données personnelles de santé; les juridictions seront fournies explicitement au resolver réglementaire.",
    [
      { ref: "reg-question", type: "SCIENTIFIC_QUESTION", section: "ANALYSIS", content: "Quelles exigences encodées sont potentiellement applicables à ce projet ?" },
      { ref: "reg-design", type: "STUDY_DESIGN", section: "DESIGN", content: "Recherche observationnelle prospective multicentrique" },
      { ref: "reg-data", type: "DATA_NEED", section: "MEASUREMENTS", content: "Données personnelles de santé" },
      { ref: "reg-jurisdiction", type: "UNCERTAINTY", section: "ANALYSIS", content: "Juridictions applicables fournies par le caller", epistemic: "UNKNOWN" },
    ],
  ),
};

const canonicalSuccessorSnapshot = (current: ResearchProjectOwnerProjection, slug: string) => {
  const raw = "Le projet ajoute une qualification multicentrique explicitement confirmée.";
  const at = "2026-08-25T19:01:00.000Z";
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:w1-qual-01:${slug}:successor`,
    language: "fr",
    turns: [{ turnId: `turn:w1-qual-01:${slug}:successor`, role: "USER", content: raw, createdAt: at }],
  };
  const checked = validatePersistentProjectDelta({
    changes: [projectChange(raw, {
      ref: `${slug}-successor-design`,
      type: "STUDY_DESIGN",
      section: "DESIGN",
      content: "Qualification multicentrique confirmée",
    })],
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  }, raw, current, conversation);
  if (checked.validation.blocks.length || !checked.candidate) {
    throw new Error(`W1_QUAL_SUCCESSOR_FIXTURE_INVALID:${slug}:${checked.validation.blocks.join(",")}`);
  }
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate,
    conversation,
    currentProject: current,
    createdAt: at,
  });
  if (!contribution) throw new Error(`W1_QUAL_SUCCESSOR_CONTRIBUTION_MISSING:${slug}`);
  const successor = confirmResearchProjectContribution({
    contribution,
    current,
    projectId: current.projectId,
    authority,
    confirmedAt: at,
  });
  return buildProjectContextSnapshot({ project: successor });
};

const STALE_READBACK_SNAPSHOTS = {
  cardiac: canonicalSuccessorSnapshot(PROJECTS.cardiac.project, "cardiac"),
};

const sourceRefs = {
  cardiac: [
    "RB-004@1.1:Obstruction microvasculaire et hémorragie intramyocardique",
    "noxia:scientific-source:pubmed:23021401",
    "noxia:scientific-source:pubmed:30231886",
  ],
  spectral: [
    "RB-003@1.0:VNC et comparabilité intersystème",
    "noxia:scientific-source:pubmed:33411614",
    "noxia:scientific-assertion:spectral-ct:vnc-not-true-noncontrast",
  ],
  neuro: [
    "RB-005@1.0:Perfusion cérébrale et dépendances méthodologiques",
    "noxia:scientific-source:pubmed:30346227",
    "noxia:scientific-source:pubmed:25907520",
  ],
  unsupported: ["KE-001:explicit-gap-and-unsupported-domain-boundary"],
  reg: ["REG-000@1.0.0:CANDIDATE_NOT_ADMITTED", "REG-001@1.0.0:methodological-aid-boundary"],
  val: ["VAL-001@1.0.0:structural-fidelity-only", "PD-011:scientific-qualification-separate"],
};

const syntheticKnowledge = (input: {
  slug: "cardiac" | "spectral" | "neuro" | "unsupported";
  project: ResearchProjectOwnerProjection;
  snapshot: Readonly<ProjectContextSnapshot>;
  concepts: Array<{ label: string; objectType: "PHENOMENON" | "PHYSIOLOGICAL_CONSTRUCT" | "OBSERVATION" | "DERIVED_MEASUREMENT" }>;
  statement: string;
  sourceRef: string;
  limitation: string;
  gapCode?: string;
}) => {
  const request = buildKnowledgeRequestFromCanonicalSnapshot({
    projectSnapshot: input.snapshot,
    question: input.snapshot.objects.find((item) => item.type === "SCIENTIFIC_QUESTION")?.content ?? input.statement,
    createdAt: AUTHORED_AT,
  });
  const resultId = `frozen-knowledge-result:w1-qual-01:${input.slug}`;
  const assertionId = `frozen-assertion:w1-qual-01:${input.slug}`;
  const evidenceId = `frozen-evidence:w1-qual-01:${input.slug}`;
  const gapCode = input.gapCode ?? null;
  const resultMaterial = {
    resultId,
    requestId: request.requestId,
    concepts: input.concepts,
    statement: input.statement,
    sourceRef: input.sourceRef,
    limitation: input.limitation,
    gapCode,
  };
  const resultDigest = logicalDigest(resultMaterial);
  const nativePayload = {
    contractVersion: KNOWLEDGE_ENGINE_VERSION,
    resultId,
    resultRevision: 1,
    resultDigest,
    request,
    registrySnapshotRef: `frozen-provider-registry:${input.slug}:1`,
    coverageStatus: input.slug === "unsupported" ? "NO_MATCH" : "PARTIAL",
    resolvedConcepts: input.concepts.map((concept, index) => ({
      conceptId: `frozen-concept:${input.slug}:${index + 1}`,
      preferredLabel: concept.label,
      originalTerms: [concept.label],
      kind: input.slug === "unsupported" ? "UNKNOWN" : "DOCUMENT_BOUND_CONCEPT",
      objectType: concept.objectType,
      providerConcepts: { "W1-QUAL-01-FROZEN": [`frozen-provider-concept:${input.slug}:${index + 1}`] },
    })),
    applicableAssertions: input.slug === "unsupported" ? [] : [{
      stableId: assertionId,
      revision: "1",
      providerId: "W1-QUAL-01-FROZEN-REFERENCE",
      status: "GOVERNED_DOCUMENTARY",
      text: input.statement,
      atomicContent: { boundedFixture: true },
      conceptIds: input.concepts.map((_item, index) => `frozen-concept:${input.slug}:${index + 1}`),
      modality: input.slug === "spectral" ? "CT" : input.slug === "neuro" ? "MRI_CT" : "MRI",
      context: { applicability: "BOUNDED_CHARACTERIZATION_FIXTURE" },
      polarity: "QUALIFIED",
      evidenceRelations: ["QUALIFIES"],
      limitations: [input.limitation],
      reviewStatus: "AUTHORED_REFERENCE_FIXTURE",
      locator: input.sourceRef,
      applicability: "APPLICABLE_WITH_LIMITATIONS",
      applicabilityReasons: ["Fixture scoped to the frozen characterization case."],
    }],
    documentaryStatements: [],
    evidence: input.slug === "unsupported" ? [] : [{
      evidenceId,
      assertionId,
      sourceId: input.sourceRef,
      relation: "QUALIFIES",
      locator: input.sourceRef,
      limitations: [input.limitation],
    }],
    sources: input.slug === "unsupported" ? [] : [{
      sourceId: input.sourceRef,
      revision: "1",
      title: input.sourceRef,
      status: "GOVERNED_DOCUMENTARY",
      locator: input.sourceRef,
    }],
    gaps: gapCode ? [{
      gapId: `frozen-gap:${input.slug}:${gapCode}`,
      code: gapCode,
      explanation: input.slug === "unsupported" ? "No admitted corpus supports this object." : "The frozen reference intentionally preserves bounded applicability.",
      affectedConceptIds: input.concepts.map((_item, index) => `frozen-concept:${input.slug}:${index + 1}`),
      resumeCondition: "Owner-specific review with admitted evidence; no automatic inference.",
    }] : [],
    limitations: [input.limitation],
    controversies: input.slug === "unsupported" ? [] : [{
      conflictId: `frozen-conflict:${input.slug}`,
      state: "OPEN",
      explanation: "Alternative operationalizations remain context dependent.",
    }],
    unresolvedConcepts: input.slug === "unsupported" ? input.concepts.map((concept) => concept.label) : [],
    ambiguities: input.slug === "unsupported" ? ["REFERENCE_AMBIGUITY"] : [],
    provenance: [{ providerId: "W1-QUAL-01-FROZEN-REFERENCE", version: "1", representationDigest: logicalDigest(input.sourceRef) }],
    trace: { engineVersion: KNOWLEDGE_ENGINE_VERSION, privacy: { externalCallMade: false } },
    externalEvidence: null,
  } as any;
  const handoff = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId: `frozen-knowledge-handoff:${input.slug}`,
    owner: "KNOWLEDGE",
    capabilityId: "KNOWLEDGE_EVIDENCE",
    purpose: `Frozen upstream Knowledge fixture for ${input.slug}.`,
    sourceProject: input.snapshot,
    nativeInputType: "KnowledgeRequest",
    nativeInputVersion: KNOWLEDGE_ENGINE_VERSION,
    nativeInput: request,
  });
  const result = recordSpecializedOwnerResult({
    request: handoff,
    resultId,
    resultVersion: "1",
    completedAt: AUTHORED_AT,
    status: "COMPLETED_WITH_LIMITATIONS",
    resultKind: input.slug === "unsupported" ? "GAP" : "EVIDENCE_DIAGNOSTIC",
    nativePayloadType: "KnowledgeResult",
    nativePayloadVersion: KNOWLEDGE_ENGINE_VERSION,
    nativePayload,
    stableProjectRefs: input.snapshot.objects.map((item) => item.stableId),
    evidenceRefs: input.slug === "unsupported" ? [] : [input.sourceRef, evidenceId],
    unknowns: input.slug === "unsupported" ? input.concepts : [],
    gaps: gapCode ? [`frozen-gap:${input.slug}:${gapCode}:${gapCode}`] : [],
    limitations: [input.limitation],
    provenance: [input.sourceRef, resultDigest],
  });
  const observation = {
    contract: "PROJECT_SPINE_03_NATIVE_OWNER_INVOCATION",
    contractVersion: "0.1.0",
    invocationId: `frozen-knowledge-invocation:${input.slug}`,
    handoffId: handoff.handoffId,
    owner: "KNOWLEDGE",
    capabilityId: "KNOWLEDGE_EVIDENCE",
    ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION,
    sourceProjectRef: input.snapshot.sourceProjectRef,
    sourceProjectVersion: input.snapshot.sourceProjectVersion,
    sourceProjectDigest: input.snapshot.sourceProjectDigest,
    requestRef: request.requestId,
    resultRef: `${result.resultId}@${result.resultVersion}`,
    status: input.slug === "unsupported" ? "OWNER_EVIDENCE_GAP" : "COMPLETED",
    failureCode: null,
    provenance: [...result.provenance],
    evidenceRefs: [...result.evidenceRefs],
    unknowns: [...result.unknowns],
    gaps: [...result.gaps],
    limitations: [...result.limitations],
    startedAt: AUTHORED_AT,
    completedAt: AUTHORED_AT,
    latencyMs: 0,
    runtimeStarts: 0,
    llmFallbackCalls: 0,
    projectWrites: 0,
  } as any;
  const retained = appendProductOwnerInvocation({
    ledger: createProductOwnerResultLedger(`frozen-upstream:${input.slug}`),
    callerRef: CAMPAIGN_ID,
    retainedAt: AUTHORED_AT,
    request: handoff,
    result,
    observation,
    dependencies: [],
  });
  return { ledger: retained.ledger, result, entry: retained.entry };
};

const frozenKnowledge = {
  cardiac: syntheticKnowledge({
    slug: "cardiac", ...PROJECTS.cardiac,
    concepts: [
      { label: "obstruction microvasculaire", objectType: "PHENOMENON" },
      { label: "hémorragie intramyocardique", objectType: "OBSERVATION" },
      { label: "IRM cardiaque", objectType: "OBSERVATION" },
    ],
    statement: "Obstruction microvasculaire and intramyocardial hemorrhage are distinct CMR findings whose operationalization and prognostic interpretation remain method dependent.",
    sourceRef: "noxia:scientific-source:pubmed:23021401",
    limitation: "CMR finding definitions and quantification depend on acquisition, timing and analysis choices.",
  }),
  spectral: syntheticKnowledge({
    slug: "spectral", ...PROJECTS.spectral,
    concepts: [
      { label: "iodine attenuation", objectType: "PHENOMENON" },
      { label: "virtual non-contrast", objectType: "DERIVED_MEASUREMENT" },
      { label: "true noncontrast acquisition", objectType: "OBSERVATION" },
      { label: "spectral CT", objectType: "OBSERVATION" },
    ],
    statement: "Virtual non-contrast images are not universally equivalent to true unenhanced acquisitions.",
    sourceRef: "noxia:scientific-source:pubmed:33411614",
    limitation: "Residual iodine, calcium handling and platform implementation limit substitution claims.",
  }),
  neuro: syntheticKnowledge({
    slug: "neuro", ...PROJECTS.neuro,
    concepts: [
      { label: "cerebral perfusion", objectType: "PHYSIOLOGICAL_CONSTRUCT" },
      { label: "CBF", objectType: "DERIVED_MEASUREMENT" },
      { label: "CBV", objectType: "DERIVED_MEASUREMENT" },
      { label: "transit delay", objectType: "DERIVED_MEASUREMENT" },
      { label: "ASL", objectType: "OBSERVATION" },
      { label: "DSC", objectType: "OBSERVATION" },
      { label: "CT perfusion", objectType: "OBSERVATION" },
    ],
    statement: "Perfusion metrics are method- and post-processing-dependent and must not be treated as interchangeable without qualification.",
    sourceRef: "noxia:scientific-source:pubmed:30346227",
    limitation: "Software, deconvolution, delay sensitivity and modality assumptions constrain comparability.",
  }),
  unsupported: syntheticKnowledge({
    slug: "unsupported", ...PROJECTS.unsupported,
    concepts: [{ label: "signal zéphyr quantique pulmonaire", objectType: "PHENOMENON" }],
    statement: "No admitted statement exists for the declared object.",
    sourceRef: "KE-001:unsupported-domain-boundary",
    limitation: "The admitted corpus does not cover the declared object.",
    gapCode: "NO_ADMITTED_CORPUS_MATCH",
  }),
};

const syntheticScientificThinking = (slug: keyof typeof frozenKnowledge) => {
  const project = PROJECTS[slug].project;
  const snapshot = PROJECTS[slug].snapshot;
  const knowledge = frozenKnowledge[slug];
  const input = buildScientificThinkingInputFromProjectSnapshot({
    projectSnapshot: snapshot,
    projectRevision: project.revision,
    knowledgeOwnerResult: knowledge.result,
    purpose: `Frozen upstream Scientific Thinking fixture for ${slug}.`,
  });
  const resultId = `frozen-st-result:w1-qual-01:${slug}`;
  const question = snapshot.objects.find((item) => item.type === "SCIENTIFIC_QUESTION")?.content ?? input.validatedReformulation;
  const outputDigest = logicalDigest({ resultId, question, knowledge: knowledge.result.nativePayload?.resultDigest });
  const kNative = knowledge.result.nativePayload as any;
  const kDependency = {
    owner: "KNOWLEDGE" as const,
    ownershipTransferred: false as const,
    knowledgeOwnerResultRef: `${knowledge.result.resultId}@${knowledge.result.resultVersion}`,
    knowledgeResultRef: knowledge.result.resultId,
    knowledgeResultRevision: 1,
    knowledgeResultDigest: kNative.resultDigest,
    candidateRefs: [],
    assertionRefs: kNative.applicableAssertions.map((item: any) => item.stableId),
    documentaryStatementRefs: [],
    evidenceRefs: kNative.evidence.map((item: any) => item.evidenceId),
    sourceRefs: kNative.sources.map((item: any) => item.sourceId),
    applicability: kNative.applicableAssertions.map((item: any) => ({ assertionRef: item.stableId, status: item.applicability })),
    contradictionRefs: kNative.controversies.map((item: any) => item.conflictId),
    gapRefs: kNative.gaps.map((item: any) => item.gapId),
  };
  const output = {
    contractVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    outputId: resultId,
    outputDigest,
    status: slug === "unsupported" ? "REFUSED" : "CANDIDATES_PROPOSED",
    candidateNotice: "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW",
    originalIdea: question,
    understoodProblem: question,
    centralScientificObject: snapshot.objects.find((item) => item.type === "CANONICAL_VARIABLE")?.content ?? question,
    semanticElements: [],
    questions: [{ questionId: `frozen-st-question:${slug}`, text: question, kind: "PRIMARY", rationale: "Frozen Project question.", testability: slug === "unsupported" ? "NEEDS_CLARIFICATION" : "TESTABLE_CANDIDATE", scope: "BALANCED", support: slug === "unsupported" ? "UNSUPPORTED" : "PARTIAL", reviewState: "PENDING", linkedAssumptionIds: [], sourceTerms: input.scientificObjectTerms }],
    selectedQuestionCandidate: null,
    hypotheses: slug === "unsupported" ? [] : [
      { hypothesisId: `frozen-st-hypothesis:${slug}:1`, text: `Primary candidate for ${question}`, kind: "PRIMARY", falsifiability: "TESTABLE_CANDIDATE", observableCondition: "Requires owner-qualified measurement.", direction: null, limitations: [...kNative.limitations], unknowns: [...input.missingInformation], support: "PARTIAL", reviewState: "PENDING", linkedQuestionIds: [`frozen-st-question:${slug}`] },
      { hypothesisId: `frozen-st-hypothesis:${slug}:2`, text: `Alternative candidate for ${question}`, kind: "ALTERNATIVE", falsifiability: "NEEDS_CLARIFICATION", observableCondition: "Alternative operationalization remains open.", direction: null, limitations: [...kNative.limitations], unknowns: [...input.missingInformation], support: "PARTIAL", reviewState: "PENDING", linkedQuestionIds: [`frozen-st-question:${slug}`] },
    ],
    objectives: slug === "unsupported" ? [] : [{ objectiveId: `frozen-st-objective:${slug}`, text: `Evaluate the declared scientific question without selecting a method.`, level: "PRIMARY", support: "PARTIAL", reviewState: "PENDING", linkedQuestionIds: [`frozen-st-question:${slug}`], linkedHypothesisIds: [`frozen-st-hypothesis:${slug}:1`] }],
    mechanisms: [], assumptions: [],
    unknowns: [...new Set([...input.missingInformation, ...kNative.gaps.map((item: any) => item.code)])],
    ambiguities: slug === "unsupported" ? ["SCIENTIFIC_OBJECT_UNSUPPORTED"] : [],
    contradictions: kNative.controversies.map((item: any) => item.conflictId),
    conceptualBiases: [], reasoningIssues: [], methodPreferences: input.methodsMentioned,
    alternatives: slug === "unsupported" ? [] : ["Primary candidate", "Alternative operationalization"],
    operations: [], adaptiveQuestions: [], humanGates: [], changes: [],
    refusal: slug === "unsupported" ? { code: "OUT_OF_DOMAIN", reason: "No admitted Knowledge support.", resumeCondition: "Provide an admitted scientific definition and evidence." } : null,
    knowledgeRequest: slug === "unsupported"
      ? { status: "REQUIRED", reason: "Frozen Knowledge gaps remain explicit.", unresolvedConcepts: kNative.unresolvedConcepts, gapCodes: kNative.gaps.map((item: any) => item.code) }
      : null,
    proposedNextAction: slug === "unsupported" ? "STOP" : "REVIEW_CANDIDATES",
    humanDecisionRequired: slug !== "unsupported",
    knowledgeDependencies: [kDependency],
    provenance: { engineVersion: SCIENTIFIC_THINKING_ENGINE_VERSION, inputRef: input.requestId, knowledgeResultRef: knowledge.result.resultId, sourceRefs: [...kDependency.sourceRefs, ...kDependency.evidenceRefs], policyRefs: ["RDE-001", "RDE-002", "PD-003", "PD-009", "KE-001"], llmContributionStatus: "UPSTREAM_LANGUAGE_INTERPRETATION_CANDIDATE_ONLY" },
    graph: { projectionVersion: "RUNTIME_PROJECTION_1.0", ontologyStatus: "NO_NEW_ONTOLOGY", nodes: [], edges: [] },
    handoff: { handoffVersion: "1.1", status: "NOT_READY", questionId: null, hypothesisIds: [], objectiveIds: [], mechanisms: [], knownInformation: [], acceptedUnknowns: [], unresolvedUnknowns: [...input.missingInformation], contradictions: kNative.controversies.map((item: any) => item.conflictId), decisionRecordIds: [], humanDecisions: [], alternativesNotSelected: [], limitations: [...kNative.limitations], provenanceRefs: [...kDependency.sourceRefs, ...kDependency.evidenceRefs], knowledgeResultRef: knowledge.result.resultId, blockedBy: ["HUMAN_REVIEW_REQUIRED"], boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN" },
    trace: [],
  } as any;
  const request = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId: `frozen-st-handoff:${slug}`,
    owner: "SCIENTIFIC_THINKING",
    capabilityId: "SCIENTIFIC_THINKING_PROPOSAL",
    purpose: `Frozen upstream Scientific Thinking fixture for ${slug}.`,
    sourceProject: snapshot,
    nativeInputType: "ScientificThinkingInput",
    nativeInputVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    nativeInput: input,
  });
  const result = recordSpecializedOwnerResult({
    request,
    resultId,
    resultVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    completedAt: AUTHORED_AT,
    status: "COMPLETED_WITH_LIMITATIONS",
    resultKind: slug === "unsupported" ? "GAP" : "RECOMMENDATION_OPTION",
    nativePayloadType: "ScientificThinkingOutput",
    nativePayloadVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    nativePayload: output,
    stableProjectRefs: snapshot.objects.map((item) => item.stableId),
    evidenceRefs: output.provenance.sourceRefs,
    unknowns: [...output.unknowns, ...output.ambiguities],
    gaps: kNative.gaps.map((item: any) => item.code),
    limitations: [...output.handoff.limitations, "SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS"],
    provenance: [resultId, input.requestId, ...output.provenance.sourceRefs],
  });
  const observation = {
    contract: "PROJECT_SPINE_04_SCIENTIFIC_REASONING_OWNER_CHAIN", contractVersion: "0.1.0",
    invocationId: `frozen-st-invocation:${slug}`, handoffId: request.handoffId, owner: "SCIENTIFIC_THINKING", capabilityId: "SCIENTIFIC_THINKING_PROPOSAL",
    ownerRuntimeVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    sourceProjectRef: snapshot.sourceProjectRef, sourceProjectVersion: snapshot.sourceProjectVersion, sourceProjectDigest: snapshot.sourceProjectDigest,
    requestRef: request.handoffId, resultRef: `${result.resultId}@${result.resultVersion}`, status: "COMPLETED_WITH_LIMITATIONS", failureCode: null,
    stableProjectRefs: [...result.stableProjectRefs], unknowns: [...result.unknowns], gaps: [...result.gaps], limitations: [...result.limitations],
    startedAt: AUTHORED_AT, completedAt: AUTHORED_AT, latencyMs: 0, runtimeStarts: 0, conversationalLlmCalls: 0, projectWrites: 0,
  } as any;
  const retained = appendProductOwnerInvocation({
    ledger: knowledge.ledger,
    callerRef: CAMPAIGN_ID,
    retainedAt: AUTHORED_AT,
    request,
    result,
    observation,
    dependencies: [{ owner: "KNOWLEDGE", resultId: knowledge.result.resultId, resultVersion: knowledge.result.resultVersion, nativeResultDigest: ownerResultNativeDigest(knowledge.result)! }],
  });
  return { ledger: retained.ledger, result, entry: retained.entry };
};

const frozenScientificThinking = {
  cardiac: syntheticScientificThinking("cardiac"),
  spectral: syntheticScientificThinking("spectral"),
  neuro: syntheticScientificThinking("neuro"),
  unsupported: syntheticScientificThinking("unsupported"),
};

const syntheticValChain = () => {
  const slug = "spectral" as const;
  const project = PROJECTS[slug].project;
  const snapshot = PROJECTS[slug].snapshot;
  const knowledge = frozenKnowledge[slug];
  const st = frozenScientificThinking[slug];
  const nativeInput = buildImagingInputFromProjectAndScientificThinking({ project, projectSnapshot: snapshot, scientificThinkingResult: st.result, knowledgeOwnerResult: knowledge.result });
  const nativePayload = {
    contractVersion: IMAGING_STUDY_DESIGNER_VERSION,
    inputVersion: IMAGING_STUDY_DESIGNER_VERSION,
    resultId: "frozen-imaging-result:w1-qual-01:val-chain",
    resultDigest: logicalDigest({ input: nativeInput.inputId, fixture: "val-chain" }),
    status: "STRATEGY_CANDIDATES",
    projectionNotice: "RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE",
    scientificQuestion: nativeInput.confirmedScientificQuestion,
    objectives: nativeInput.objectives,
    hypotheses: nativeInput.hypotheses,
    phenomena: [], biomarkerCandidates: [], biomarkerComparison: [], modalityCandidates: [], modalityComparison: [], acquisitionStrategies: [], equipmentAssessment: [], timingStrategy: [],
    harmonizationStrategy: { centerMode: "MULTICENTRIC_HETEROGENEITY_UNKNOWN", commonCore: [], acceptableVariants: [], variantsToQualify: [], incompatibilities: [], unknowns: ["INTERSYSTEM_COMPARABILITY_UNKNOWN"], bridgeStudy: "UNKNOWN", futureAnalyticalStratification: "UNKNOWN", additionalQualityControls: [] },
    qualityStrategy: [], nonEvaluabilityRules: [], imageAnalysisStrategy: [], imagingVariables: [], decisionGraph: { projectionVersion: "RUNTIME_PROJECTION_1.0", ontologyStatus: "NO_NEW_ONTOLOGY", nodes: [], edges: [], brokenChains: [] },
    knowledgeHandoff: { gapCodes: (knowledge.result.nativePayload as any).gaps.map((item: any) => item.code) },
    missingInformation: ["INTERSYSTEM_COMPARABILITY_UNKNOWN"],
    limitations: [...(knowledge.result.nativePayload as any).limitations],
    contradictions: [...(st.result.nativePayload as any).contradictions],
    projectConstructionHandoff: { unknowns: [...st.result.unknowns], limitations: [...(knowledge.result.nativePayload as any).limitations] },
    provenance: { inputRef: nativeInput.inputId, sourceRefs: [...knowledge.result.evidenceRefs] },
    trace: [],
  } as any;
  const request = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId: "frozen-imaging-handoff:val-chain", owner: "IMAGING", capabilityId: "IMAGING_STUDY_DESIGN",
    purpose: "Frozen Imaging output for VAL structural characterization.", sourceProject: snapshot,
    nativeInputType: "ImagingDesignInput", nativeInputVersion: IMAGING_STUDY_DESIGNER_VERSION, nativeInput,
  });
  const result = recordSpecializedOwnerResult({
    request, resultId: nativePayload.resultId, resultVersion: IMAGING_STUDY_DESIGNER_VERSION, completedAt: AUTHORED_AT,
    status: "COMPLETED_WITH_LIMITATIONS", resultKind: "RECOMMENDATION_OPTION", nativePayloadType: "ImagingDesignResult", nativePayloadVersion: IMAGING_STUDY_DESIGNER_VERSION, nativePayload,
    stableProjectRefs: snapshot.objects.map((item) => item.stableId), evidenceRefs: [...knowledge.result.evidenceRefs], unknowns: [...st.result.unknowns],
    gaps: ["OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED"],
    limitations: [...(knowledge.result.nativePayload as any).limitations, "OBS_RUNTIME_UNAVAILABLE_NO_AUTONOMOUS_QUALIFICATION"],
    provenance: [nativePayload.resultId, nativeInput.inputId, st.result.resultId, knowledge.result.resultId],
  });
  const observation = {
    contract: "PROJECT_SPINE_04_SCIENTIFIC_REASONING_OWNER_CHAIN", contractVersion: "0.1.0", invocationId: "frozen-imaging-invocation:val-chain",
    handoffId: request.handoffId, owner: "IMAGING", capabilityId: "IMAGING_STUDY_DESIGN", ownerRuntimeVersion: IMAGING_STUDY_DESIGNER_VERSION,
    sourceProjectRef: snapshot.sourceProjectRef, sourceProjectVersion: snapshot.sourceProjectVersion, sourceProjectDigest: snapshot.sourceProjectDigest,
    requestRef: request.handoffId, resultRef: `${result.resultId}@${result.resultVersion}`, status: "COMPLETED_WITH_LIMITATIONS", failureCode: null,
    stableProjectRefs: [...result.stableProjectRefs], unknowns: [...result.unknowns], gaps: [...result.gaps], limitations: [...result.limitations],
    startedAt: AUTHORED_AT, completedAt: AUTHORED_AT, latencyMs: 0, runtimeStarts: 0, conversationalLlmCalls: 0, projectWrites: 0,
  } as any;
  const retained = appendProductOwnerInvocation({
    ledger: st.ledger, callerRef: CAMPAIGN_ID, retainedAt: AUTHORED_AT, request, result, observation,
    dependencies: [
      { owner: "KNOWLEDGE", resultId: knowledge.result.resultId, resultVersion: knowledge.result.resultVersion, nativeResultDigest: ownerResultNativeDigest(knowledge.result)! },
      { owner: "SCIENTIFIC_THINKING", resultId: st.result.resultId, resultVersion: st.result.resultVersion, nativeResultDigest: ownerResultNativeDigest(st.result)! },
    ],
  });
  return { project, snapshot, ledger: retained.ledger, knowledgeEntry: retained.ledger.entries[0], scientificThinkingEntry: retained.ledger.entries[1], imagingEntry: retained.entry };
};

const frozenValChain = syntheticValChain();

const baseRegulatoryRequest = (jurisdictions: string[] | null, variant: "FULL" | "MISSING_CONTEXT" = "FULL") => {
  const snapshot = PROJECTS.regulatory.snapshot;
  const provenance = [snapshot.sourceProjectRef, snapshot.sourceProjectVersion, snapshot.sourceProjectDigest, snapshot.snapshotDigest];
  const known = <T>(value: T, reason: string) => knownFact(value, reason, provenance);
  const unknown = <T>(reason: string) => unknownFact<T>(reason, provenance);
  const missing = variant === "MISSING_CONTEXT";
  return createRegulatoryResolutionInput({
    researchProjectId: snapshot.sourceProjectRef,
    researchProjectVersion: snapshot.sourceProjectVersion,
    researchProjectDigest: snapshot.sourceProjectDigest,
    resolutionAsOf: "2026-08-25T16:20:00.000Z",
    jurisdiction: jurisdictions ? known(jurisdictions, "Jurisdictions caller-supplied and frozen.") : unknown("Jurisdiction not supplied."),
    projectCharacteristics: {
      humanHealthResearch: missing ? unknown("Human-health-research qualification missing.") : known(true, "Health research declared."),
      projectNatures: known(["HEALTH_RESEARCH"], "Project nature declared."),
      intendedDocuments: known(["RESEARCH_PROTOCOL"], "Protocol document intended."),
      explicitlyIncorporatedGuidance: known(jurisdictions?.includes("INTERNATIONAL") ? ["STROBE"] : [], "Caller-supplied guidance list."),
    },
    studyDesignCharacteristics: {
      interventionModel: known("OBSERVATIONAL" as const, "Observational design declared."),
      temporalDirection: known("PROSPECTIVE" as const, "Prospective direction declared."),
      randomised: missing ? unknown("Randomisation status missing.") : known(false, "No randomisation declared."),
      registryBased: known(false, "Not registry based."),
      reportTypes: known(jurisdictions?.includes("INTERNATIONAL") ? ["OBSERVATIONAL_STUDY_REPORT"] : [], "Report types supplied."),
    },
    interventionCharacteristics: {
      interventionPresent: known(false, "No intervention declared."), medicinalProductTrial: known(false, "No medicinal product trial."), medicalDeviceStudy: known(false, "No medical device study."),
    },
    productCharacteristics: { productTypes: known(["NO_HEALTH_PRODUCT_IDENTIFIED"], "No health product identified.") },
    dataCharacteristics: {
      personalHealthData: known(true, "Personal health data declared."), existingData: known(false, "Prospective collection."), prospectiveCollection: known(true, "Prospective collection declared."), routinelyCollectedHealthData: known(false, "Not routine-care data."), sources: known(["PROSPECTIVE_RESEARCH_COLLECTION"], "Data source declared."), transferOutsideEea: missing ? unknown("Transfer status missing.") : known(false, "No transfer outside EEA declared."),
    },
    biologicalSampleCharacteristics: { samplesPresent: known(false, "No samples declared.") },
    multicenterCharacteristics: { multicenter: known(true, "Multicenter declared."), centerCount: missing ? unknown("Center count missing.") : known(3, "Three centers declared.") },
    internationalCharacteristics: {
      international: known(Boolean(jurisdictions && jurisdictions.length > 1), "International status derived only from caller-supplied jurisdiction set."),
      centerJurisdictions: jurisdictions ? known(jurisdictions, "Center jurisdictions supplied.") : unknown("Center jurisdictions missing."),
      crossCountryRequirementDiscoveryNeeded: known(Boolean(jurisdictions && jurisdictions.length > 1), "Cross-country discovery flag supplied."),
    },
    fundingProgramCandidates: known([], "No funding program supplied."),
    fundingProgramEditionCandidates: known([], "No funding edition supplied."),
    knownRegulatoryQualifications: [],
    unknowns: missing || !jurisdictions ? [{ unknownId: `reg-unknown:${missing ? "context" : "jurisdiction"}`, field: missing ? "projectCharacteristics.humanHealthResearch" : "jurisdiction", reason: "Frozen characterization unknown.", provenance }] : [],
    contradictions: [], humanDecisions: [], provenance,
  });
};

const knowledgeDefinitions = [
  ["K-CARDIAC-01", "cardiac", "Distinguer MVO et hémorragie intramyocardique, leurs limites et leur ambiguïté de référence.", "Quelles connaissances distinguent obstruction microvasculaire et hémorragie intramyocardique après infarctus en IRM cardiaque ?", sourceRefs.cardiac, true],
  ["K-SPECTRAL-01", "spectral", "Tester VNC, non-substitution et comparabilité intersystème.", "Une image virtuelle sans contraste peut-elle remplacer universellement une acquisition native sans injection en scanner spectral multicentrique ?", sourceRefs.spectral, true],
  ["K-NEURO-01", "neuro", "Tester dépendances de CBF/CBV/délai selon modalité et logiciel.", "Comment préserver les dépendances de CBF, CBV et délai de transit entre ASL, DSC et scanner de perfusion ?", sourceRefs.neuro, false],
  ["K-UNSUPPORTED-01", "unsupported", "Tester le gap honnête hors corpus.", "Que sait le corpus admis sur le signal zéphyr quantique pulmonaire ?", sourceRefs.unsupported, false],
  ["K-REFERENCE-AMBIGUITY-01", "cardiac", "Tester l'absence d'équivalence silencieuse entre no-reflow, MVO et hémorragie.", "No-reflow, obstruction microvasculaire et hémorragie intramyocardique sont-ils strictement équivalents ?", sourceRefs.cardiac, false],
  ["K-STALE-01", "cardiac", "Tester la conservation historique et le marquage stale face à un Project successeur.", "Quelles connaissances caractérisent l'obstruction microvasculaire après infarctus en IRM cardiaque ?", sourceRefs.cardiac, false],
] as const;

const stDefinitions = [
  ["ST-CARDIAC-01", "cardiac", "Conserver deux phénomènes distincts, limites et alternatives candidates.", sourceRefs.cardiac, true],
  ["ST-SPECTRAL-01", "spectral", "Conserver les alternatives de substitution et la non-comparabilité automatique.", sourceRefs.spectral, false],
  ["ST-NEURO-01", "neuro", "Conserver les inconnues de logiciel et les hypothèses comme candidates.", sourceRefs.neuro, false],
  ["ST-UNSUPPORTED-01", "unsupported", "Refuser ou clarifier sans hypothèse solide hors corpus.", sourceRefs.unsupported, false],
] as const;

const imagingDefinitions = [
  ["IMG-CARDIAC-01", "cardiac", "Proposer des options Imaging candidates avec QA et équipement non inventé.", sourceRefs.cardiac, true],
  ["IMG-SPECTRAL-01", "spectral", "Préserver VNC/non-contraste et comparabilité sans classement automatique.", sourceRefs.spectral, false],
  ["IMG-NEURO-01", "neuro", "Préserver les alternatives multimodales et dépendances de post-traitement.", sourceRefs.neuro, false],
  ["IMG-UNSUPPORTED-01", "unsupported", "Retourner vers Scientific Thinking faute de chaîne de mesure défendable.", sourceRefs.unsupported, false],
] as const;

const regDefinitions = [
  ["REG-FR-01", ["FR"], "France", "FULL", true],
  ["REG-EU-01", ["EU_EEA"], "EU/EEA", "FULL", false],
  ["REG-US-01", ["US"], "United States", "FULL", false],
  ["REG-INTL-01", ["INTERNATIONAL"], "International methodological/reporting", "FULL", false],
  ["REG-UNSUPPORTED-01", ["CA"], "Unsupported jurisdiction", "FULL", false],
  ["REG-MISSING-JURISDICTION-01", null, "Missing jurisdiction", "FULL", false],
  ["REG-MISSING-CONTEXT-01", ["FR", "EU_EEA"], "Insufficient context", "MISSING_CONTEXT", false],
  ["REG-STALE-REQUEST-01", ["FR"], "Stale Project/request", "FULL", true],
] as const;

const valDefinitions = [
  ["VAL-CLEAN-01", "CLEAN", "Valid frozen chain has no critical artificial finding.", true],
  ["VAL-PROJECT-DIGEST-01", "PROJECT_DIGEST_MISMATCH", "Project digest mismatch is detected.", false],
  ["VAL-STALE-K-01", "STALE_KNOWLEDGE", "Stale Knowledge is detected.", false],
  ["VAL-STALE-ST-01", "STALE_ST", "Stale Scientific Thinking is detected.", false],
  ["VAL-WRONG-OWNER-01", "WRONG_OWNER_METADATA", "Wrong owner metadata is detected.", false],
  ["VAL-PROVENANCE-01", "PROVENANCE_MISSING", "Missing evidence provenance is detected.", false],
  ["VAL-UNKNOWN-01", "UNKNOWN_DROPPED", "Dropped unknown is detected.", false],
  ["VAL-LIMITATION-01", "LIMITATION_DROPPED", "Dropped limitation is detected.", false],
  ["VAL-CONTRADICTION-01", "CONTRADICTION_DROPPED", "Dropped contradiction is detected.", false],
  ["VAL-K-ST-LINEAGE-01", "KNOWLEDGE_TO_ST_LINEAGE_BROKEN", "Broken Knowledge to ST lineage is detected.", false],
  ["VAL-ST-IMG-LINEAGE-01", "ST_TO_IMAGING_LINEAGE_BROKEN", "Broken ST to Imaging lineage is detected.", false],
  ["VAL-OBS-GAP-01", "EXPECTED_OBS_GAP", "Expected OBS gap produces no false critical finding.", false],
  ["VAL-NO-SCIENTIFIC-PASS-01", "STRUCTURAL_NOT_SCIENTIFIC", "Structural pass never becomes scientific PASS.", true],
] as const;

const pack = (sourceCase: string, ownerUnderTest: Owner, purpose: string, provenance: string[], payload: Record<string, unknown>): FrozenInputPack => {
  const material = { version: "1.0.0", sourceCase, ownerUnderTest, provenance, purpose, payload };
  return { packId: `frozen-input:${sourceCase}`, ...material, digest: logicalDigest(material), frozen: true };
};

const obligation = (caseId: string, index: number, checkId: string, critical: boolean, statement: string, failureClass: string, refs: string[]): EnvelopeObligation => ({
  obligationId: `${caseId}-O${String(index + 1).padStart(2, "0")}`,
  checkId, critical, statement, failureClass, referenceRefs: refs,
});

const commonObligations = (caseId: string, refs: string[]) => [
  obligation(caseId, 0, "ZERO_PROJECT_WRITE", true, "Owner and adapter perform zero Project writes.", "PROJECT_WRITE_LEAK", refs),
  obligation(caseId, 1, "NO_PROVIDER_CALL", true, "No external provider, web, LLM or external evidence call occurs.", "EXTERNAL_PROVIDER_CALL", refs),
  obligation(caseId, 2, "TRACE_BOUND", true, "Execution is reconstructible through Scientific Execution Trace.", "TRACE_BINDING_MISSING", ["W1-TRACE-01"]),
];

export const buildAuthoredCampaign = () => {
  const cases: CharacterizationCase[] = [];
  const envelopes: AcceptanceEnvelope[] = [];
  const inputs: FrozenInputPack[] = [];

  for (const [caseId, slug, purpose, question, refs, replay] of knowledgeDefinitions) {
    const fixture = PROJECTS[slug];
    const request = buildKnowledgeRequestFromCanonicalSnapshot({ projectSnapshot: fixture.snapshot, question, createdAt: AUTHORED_AT });
    const specific = slug === "unsupported"
      ? [obligation(caseId, 3, "K_HONEST_GAP", true, "Unsupported content returns an explicit gap without fabricated assertion.", "UNSUPPORTED_CONTENT_GENERATED", [...refs])]
      : [
        obligation(caseId, 3, "K_RELEVANCE", true, "Returned material remains relevant to the declared scientific objects.", "IRRELEVANT_ASSERTION", [...refs]),
        obligation(caseId, 4, "K_CRITICAL_CONCEPT_COVERAGE", true, "All case-defining scientific concepts remain represented or their omission is exposed as a gap.", "CRITICAL_RELEVANT_ASSERTION_OMITTED", [...refs]),
        obligation(caseId, 5, "K_SOURCE_GROUNDING", true, "Returned assertions remain reconstructible to source references.", "SOURCE_GROUNDING_BROKEN", [...refs]),
        obligation(caseId, 6, "K_APPLICABILITY", true, "Applicability remains explicit and qualified where the reference scope is bounded.", "APPLICABILITY_LOST", [...refs]),
        obligation(caseId, 7, "K_LIMITATIONS", false, "Applicability limitations remain visible.", "LIMITATION_SUPPRESSED", [...refs]),
        obligation(caseId, 8, "K_CONTRADICTION_OR_ALTERNATIVES", false, "Contradictions or alternative operationalizations remain visible when supported by the admitted references.", "CONTRADICTION_SUPPRESSED", [...refs]),
        obligation(caseId, 9, "K_NO_PROMOTION_OR_DECISION", true, "Knowledge neither promotes evidence strength nor creates a Project decision.", "PROJECT_DECISION_LEAK", ["KE-001", "PD-003 V2 Ownership Matrix"]),
      ];
    if (caseId === "K-SPECTRAL-01") specific.push(obligation(caseId, 10, "K_VNC_NON_EQUIVALENCE", true, "VNC is not promoted to universal replacement of native noncontrast acquisition.", "EVIDENCE_STRENGTH_PROMOTED", [...refs]));
    if (caseId.includes("REFERENCE")) specific.push(obligation(caseId, 10, "K_REFERENCE_AMBIGUITY", true, "Related cardiac terms are not silently collapsed into strict equivalence.", "REFERENCE_AMBIGUITY", [...refs]));
    if (caseId === "K-STALE-01") specific.push(obligation(caseId, 10, "K_STALE_READBACK", true, "A result bound to Project vN remains historically readable but is marked stale against vN+1.", "STALE_RESULT", ["PD-003 V2 Research Object Model", "W1-CLOSURE-01"]));
    const obligations = [...commonObligations(caseId, [...refs]), ...specific];
    cases.push({ caseId, ownerUnderTest: "KNOWLEDGE", domain: slug, purpose, inputArtifactRefs: [`frozen-input:${caseId}`], projectRef: `${fixture.project.projectId}@${fixture.project.versionId}`, upstreamFrozenResultRefs: [], scientificContext: question, testedCapabilities: obligations.map((item) => item.checkId), expectedObligations: obligations.map((item) => item.statement), forbiddenBehaviors: ["Project decision", "evidence inflation", "external search", "unsupported content generation"], allowedAlternatives: ["Supported result", "partial result", "explicit gap", "clarification"], expectedGaps: slug === "unsupported" ? ["NO_MATCH_OR_OUT_OF_DOMAIN"] : [], expectedLimitations: ["Bounded corpus; applicability remains qualified."], referenceRefs: [...refs], reviewStatus: "AUTHORED_PRE_OBSERVATION", exposureStatus: "UNEXPOSED", replayPredeclared: replay });
    envelopes.push({ envelopeId: `acceptance-envelope:${caseId}`, caseId, ownerUnderTest: "KNOWLEDGE", obligations, allowedVariation: ["Wording", "assertion order", "number of documentary statements"], forbiddenBehaviors: ["adopted Project decision", "fabricated source", "silent certainty promotion"], unknownsToPreserve: fixture.snapshot.openIssues.filter((item) => item.kind === "UNKNOWN").map((item) => item.reason), limitationsToExpose: ["Corpus and applicability boundaries"], referenceSupport: slug === "unsupported" ? "CONTRACT_ONLY" : "SUPPORTED_WITHIN_ADMITTED_CORPUS", authoredBeforeObservation: true });
    const staleReadbackSnapshot = caseId === "K-STALE-01"
      ? STALE_READBACK_SNAPSHOTS.cardiac
      : null;
    inputs.push(pack(caseId, "KNOWLEDGE", purpose, [fixture.snapshot.snapshotDigest, ...refs], { project: fixture.project, projectSnapshot: fixture.snapshot, knowledgeRequest: request, staleReadbackSnapshot }));
  }

  for (const [caseId, slug, purpose, refs, replay] of stDefinitions) {
    const fixture = PROJECTS[slug];
    const upstream = frozenKnowledge[slug];
    const obligations = [...commonObligations(caseId, [...refs]),
      obligation(caseId, 3, "ST_PROJECT_FIDELITY", true, "The adopted Project question and context remain identifiable.", "PROJECT_QUESTION_DRIFT", [...refs]),
      obligation(caseId, 4, "ST_KNOWLEDGE_LINEAGE", true, "The exact frozen Knowledge result identity and digest remain linked.", "LINEAGE_BREAK", [...refs]),
      obligation(caseId, 5, "ST_CANDIDATE_BOUNDARY", true, "Hypotheses and models remain candidates requiring human review.", "PROJECT_ADOPTION_LEAK", ["RDE-002", "PD-009"]),
      obligation(caseId, 6, slug === "unsupported" ? "ST_UNSUPPORTED_BOUNDARY" : "ST_UNKNOWN_AND_GAP_PRESERVATION", true, slug === "unsupported" ? "Unsupported input is refused or remains clarification-required without solid hypothesis." : "Frozen Knowledge gaps and Project unknowns remain visible.", slug === "unsupported" ? "UNSUPPORTED_HYPOTHESIS" : "KNOWLEDGE_GAP_LOSS", [...refs]),
      obligation(caseId, 7, "ST_NO_EVIDENCE_PROMOTION", true, "Knowledge support is not converted into established Project truth.", "EVIDENCE_PROMOTION", ["KE-001", "RDE-002"]),
      obligation(caseId, 8, "ST_CONTRADICTION_PRESERVATION", true, "Upstream Knowledge contradiction references remain explicit.", "CONTRADICTION_LOSS", [...refs]),
      obligation(caseId, 9, "ST_REASONING_MINIMUM", true, "Supported inputs produce inspectable question, objective and hypothesis candidates.", "CRITICAL_REASONING_OMISSION", ["RDE-001", "RDE-002", ...refs]),
      obligation(caseId, 10, "ST_MODEL_KNOWLEDGE_BOUNDARY", true, "Scientific models and hypotheses remain candidate reasoning artifacts and never become Knowledge assertions.", "MODEL_KNOWLEDGE_CONFUSION", ["KE-001", "RDE-002"]),
    ];
    if (slug === "spectral") obligations.push(obligation(caseId, 11, "ST_ALTERNATIVES", false, "Multiple defensible branches remain available for review.", "ALTERNATIVE_SUPPRESSION", [...refs]));
    cases.push({ caseId, ownerUnderTest: "SCIENTIFIC_THINKING", domain: slug, purpose, inputArtifactRefs: [`frozen-input:${caseId}`], projectRef: `${fixture.project.projectId}@${fixture.project.versionId}`, upstreamFrozenResultRefs: [`${upstream.result.resultId}@${upstream.result.resultVersion}`], scientificContext: fixture.snapshot.objects.find((item) => item.type === "SCIENTIFIC_QUESTION")?.content ?? purpose, testedCapabilities: obligations.map((item) => item.checkId), expectedObligations: obligations.map((item) => item.statement), forbiddenBehaviors: ["Knowledge ownership transfer", "automatic adoption", "false certainty"], allowedAlternatives: ["Candidate hypotheses", "clarification", "refusal", "request Knowledge"], expectedGaps: [...upstream.result.gaps], expectedLimitations: [...upstream.result.limitations], referenceRefs: [...refs], reviewStatus: "AUTHORED_PRE_OBSERVATION", exposureStatus: "UNEXPOSED", replayPredeclared: replay });
    envelopes.push({ envelopeId: `acceptance-envelope:${caseId}`, caseId, ownerUnderTest: "SCIENTIFIC_THINKING", obligations, allowedVariation: ["Candidate wording", "number of scientifically defensible alternatives", "question ordering"], forbiddenBehaviors: ["hypothesis presented as knowledge", "automatic Project adoption", "upstream gap suppression"], unknownsToPreserve: [...upstream.result.unknowns], limitationsToExpose: [...upstream.result.limitations], referenceSupport: slug === "unsupported" ? "CONTRACT_ONLY" : "SUPPORTED_WITHIN_ADMITTED_CORPUS", authoredBeforeObservation: true });
    inputs.push(pack(caseId, "SCIENTIFIC_THINKING", purpose, [fixture.snapshot.snapshotDigest, upstream.result.resultId, ...refs], { project: fixture.project, projectSnapshot: fixture.snapshot, frozenOwnerLedger: upstream.ledger, knowledgeResultId: upstream.result.resultId }));
  }

  for (const [caseId, slug, purpose, refs, replay] of imagingDefinitions) {
    const fixture = PROJECTS[slug];
    const k = frozenKnowledge[slug];
    const st = frozenScientificThinking[slug];
    const obligations = [...commonObligations(caseId, [...refs]),
      obligation(caseId, 3, "IMG_QUESTION_ALIGNMENT", true, "Imaging output stays aligned with the frozen Project/ST question.", "SCIENTIFIC_NEED_DRIFT", [...refs]),
      obligation(caseId, 4, "IMG_UPSTREAM_LINEAGE", true, "Exact frozen Knowledge and ST result dependencies remain linked.", "KNOWLEDGE_LINEAGE_LOST", [...refs]),
      obligation(caseId, 5, "IMG_CANDIDATE_AND_NO_RANKING", true, "Modalities and acquisitions remain candidates with no automatic ranking or adoption.", "METHOD_AUTO_SELECTION", ["RDE-003", ...refs]),
      obligation(caseId, 6, "IMG_QA_AND_EQUIPMENT", false, "QA needs and unknown equipment compatibility remain explicit.", "EQUIPMENT_COMPATIBILITY_INVENTED", ["RDE-003", ...refs]),
      obligation(caseId, 7, "IMG_OBS_BOUNDARY", true, "OBS absence remains explicit and no qualified OBS object is invented.", "OBS_CAPABILITY_INVENTED", ["OBS-001", "RDE-003"]),
      obligation(caseId, 8, slug === "unsupported" ? "IMG_RETURN_TO_ST" : "IMG_LIMITATIONS", true, slug === "unsupported" ? "Unsupported measurement chain returns to Scientific Thinking or requests clarification." : "Scientific and technical limitations remain visible.", slug === "unsupported" ? "ACQUISITION_OVERCOMMITMENT" : "LIMITATION_SUPPRESSED", [...refs]),
      obligation(caseId, 9, "IMG_MODALITY_ALIGNMENT", true, "Modality candidates remain aligned with the declared imaging domain.", "MODALITY_MISMATCH", ["RDE-003", ...refs]),
      obligation(caseId, 10, "IMG_CORELAB_CONTEXTUAL", false, "Core Lab options remain contextual and human-assessed without automatic optimum.", "CORELAB_GENERALIZATION", ["RDE-003", ...refs]),
      obligation(caseId, 11, "IMG_UNKNOWN_PRESERVATION", true, "Project and upstream unknowns remain visible downstream.", "UNKNOWN_SUPPRESSION", ["RDE-003", ...refs]),
    ];
    cases.push({ caseId, ownerUnderTest: "IMAGING", domain: slug, purpose, inputArtifactRefs: [`frozen-input:${caseId}`], projectRef: `${fixture.project.projectId}@${fixture.project.versionId}`, upstreamFrozenResultRefs: [`${k.result.resultId}@${k.result.resultVersion}`, `${st.result.resultId}@${st.result.resultVersion}`], scientificContext: fixture.snapshot.objects.find((item) => item.type === "SCIENTIFIC_QUESTION")?.content ?? purpose, testedCapabilities: obligations.map((item) => item.checkId), expectedObligations: obligations.map((item) => item.statement), forbiddenBehaviors: ["qualified OBS object invention", "automatic method selection", "equipment compatibility assumption"], allowedAlternatives: ["Candidate modalities", "candidate acquisitions", "clarification", "return to Scientific Thinking"], expectedGaps: ["OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED"], expectedLimitations: ["OBS_RUNTIME_UNAVAILABLE_NO_AUTONOMOUS_QUALIFICATION", ...st.result.limitations], referenceRefs: [...refs], reviewStatus: "AUTHORED_PRE_OBSERVATION", exposureStatus: "UNEXPOSED", replayPredeclared: replay });
    envelopes.push({ envelopeId: `acceptance-envelope:${caseId}`, caseId, ownerUnderTest: "IMAGING", obligations, allowedVariation: ["Candidate ordering", "QA wording", "multiple defensible modality branches"], forbiddenBehaviors: ["validated ObservableProperty", "validated MeasurementDefinition", "validated BiomarkerRole", "adopted Project method"], unknownsToPreserve: [...st.result.unknowns], limitationsToExpose: ["OBS runtime absent", ...st.result.limitations], referenceSupport: slug === "unsupported" ? "CONTRACT_ONLY" : "SUPPORTED_WITHIN_ADMITTED_CORPUS", authoredBeforeObservation: true });
    inputs.push(pack(caseId, "IMAGING", purpose, [fixture.snapshot.snapshotDigest, k.result.resultId, st.result.resultId, ...refs], { project: fixture.project, projectSnapshot: fixture.snapshot, frozenOwnerLedger: st.ledger, knowledgeResultId: k.result.resultId, scientificThinkingResultId: st.result.resultId }));
  }

  for (const [caseId, jurisdictions, domain, variant, replay] of regDefinitions) {
    const fixture = PROJECTS.regulatory;
    const request = baseRegulatoryRequest(jurisdictions ? [...jurisdictions] : null, variant as "FULL" | "MISSING_CONTEXT");
    const frozenRequest = caseId === "REG-STALE-REQUEST-01" ? { ...request, researchProjectDigest: `stale:${request.researchProjectDigest}` } : request;
    const isUnsupported = caseId === "REG-UNSUPPORTED-01";
    const isStale = caseId === "REG-STALE-REQUEST-01";
    const obligations = [...commonObligations(caseId, sourceRefs.reg),
      obligation(caseId, 3, isUnsupported ? "REG_UNSUPPORTED_FAIL_CLOSED" : isStale ? "REG_STALE_FAIL_CLOSED" : "REG_JURISDICTION_FIDELITY", true, isUnsupported ? "Unsupported jurisdiction fails closed without extrapolation." : isStale ? "Stale Project/request binding fails closed." : "Only caller-supplied jurisdictions are evaluated without France extrapolation.", isUnsupported ? "UNSUPPORTED_JURISDICTION_EXTRAPOLATION" : isStale ? "STALE_REGULATORY_RESULT" : "JURISDICTION_MISMATCH", sourceRefs.reg),
      obligation(caseId, 4, "REG_CORPUS_BOUNDARY", true, "Candidate corpus status and bounded coverage remain visible.", "CORPUS_LIMITATION_SUPPRESSED", sourceRefs.reg),
      obligation(caseId, 5, "REG_SOURCE_GROUNDING", true, "Resolved requirements retain encoded source references.", "REQUIREMENT_SOURCE_LOST", sourceRefs.reg),
      obligation(caseId, 6, "REG_NO_APPROVAL", true, "No regulatory approval, authorization, legal validation or current-law completeness is claimed.", "REGULATORY_APPROVAL_INVENTED", sourceRefs.reg),
    ];
    if (!jurisdictions || variant === "MISSING_CONTEXT") obligations.push(obligation(caseId, 7, "REG_MISSING_INFORMATION", true, "Missing jurisdiction or context remains explicit.", "MISSING_CONTEXT_SUPPRESSED", sourceRefs.reg));
    cases.push({ caseId, ownerUnderTest: "REG", domain, purpose: `Characterize REG for ${domain}.`, inputArtifactRefs: [`frozen-input:${caseId}`], projectRef: `${fixture.project.projectId}@${fixture.project.versionId}`, upstreamFrozenResultRefs: [], scientificContext: `Caller-supplied jurisdiction=${jurisdictions?.join(",") ?? "UNKNOWN"}; variant=${variant}`, testedCapabilities: obligations.map((item) => item.checkId), expectedObligations: obligations.map((item) => item.statement), forbiddenBehaviors: ["legal advice", "approval", "unsupported jurisdiction extrapolation", "current-law completeness claim"], allowedAlternatives: ["applicable", "potentially applicable", "missing information", "qualification required", "fail-closed rejection"], expectedGaps: !jurisdictions || variant === "MISSING_CONTEXT" ? ["MISSING_REGULATORY_INFORMATION"] : [], expectedLimitations: ["REG-000 candidate corpus", "methodological aid only"], referenceRefs: [...sourceRefs.reg], reviewStatus: "AUTHORED_PRE_OBSERVATION", exposureStatus: "UNEXPOSED", replayPredeclared: replay });
    envelopes.push({ envelopeId: `acceptance-envelope:${caseId}`, caseId, ownerUnderTest: "REG", obligations, allowedVariation: ["Requirement ordering", "multiple conditional statuses"], forbiddenBehaviors: ["approval claim", "legal conclusion", "corpus completeness claim"], unknownsToPreserve: !jurisdictions ? ["jurisdiction"] : variant === "MISSING_CONTEXT" ? ["humanHealthResearch", "randomised", "transferOutsideEea", "centerCount"] : [], limitationsToExpose: ["CANDIDATE_NOT_ADMITTED", "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION"], referenceSupport: "SUPPORTED_WITHIN_ADMITTED_CORPUS", authoredBeforeObservation: true });
    inputs.push(pack(caseId, "REG", `Characterize REG for ${domain}.`, [fixture.snapshot.snapshotDigest, REG000_CORPUS_DIGEST, ...sourceRefs.reg], { project: fixture.project, projectSnapshot: fixture.snapshot, regulatoryRequest: frozenRequest, expectedError: isUnsupported ? "UNSUPPORTED_JURISDICTION" : isStale ? "REGULATORY_PRODUCT_REQUEST_SNAPSHOT_MISMATCH" : null }));
  }

  for (const [caseId, defectRecipe, purpose, replay] of valDefinitions) {
    const expectedClass: Record<string, string | null> = {
      CLEAN: null, PROJECT_DIGEST_MISMATCH: "STALE_", STALE_KNOWLEDGE: "STALE_KNOWLEDGE_RESULT", STALE_ST: "STALE_SCIENTIFIC_THINKING_RESULT", WRONG_OWNER_METADATA: "OWNER_TRANSFER_VIOLATION", PROVENANCE_MISSING: "KNOWLEDGE_EVIDENCE_LINEAGE_MISSING", UNKNOWN_DROPPED: "UNKNOWN_LOST", LIMITATION_DROPPED: "LIMITATION_LOST", CONTRADICTION_DROPPED: "CONTRADICTION_LOST", KNOWLEDGE_TO_ST_LINEAGE_BROKEN: "KNOWLEDGE_TO_ST_LINEAGE_MISSING", ST_TO_IMAGING_LINEAGE_BROKEN: "ST_TO_IMAGING_LINEAGE_MISSING", EXPECTED_OBS_GAP: null, STRUCTURAL_NOT_SCIENTIFIC: null,
    };
    const obligations = [...commonObligations(caseId, sourceRefs.val),
      obligation(caseId, 3, expectedClass[defectRecipe] ? "VAL_EXPECTED_FINDING" : "VAL_NO_FALSE_CRITICAL", true, expectedClass[defectRecipe] ? `VAL detects the predeclared defect class ${expectedClass[defectRecipe]}.` : "The valid structural chain has no artificial blocking finding.", expectedClass[defectRecipe] ?? "FALSE_POSITIVE_ON_VALID_CHAIN", sourceRefs.val),
      obligation(caseId, 4, "VAL_OBSERVER_ONLY", true, "VAL performs no repair, Project write or human decision.", "VAL_REPAIR_OR_WRITE", sourceRefs.val),
      obligation(caseId, 5, "VAL_NO_SCIENTIFIC_PASS", true, "Structural fidelity is not promoted to scientific qualification.", "SCIENTIFIC_PASS_INVENTED", sourceRefs.val),
    ];
    cases.push({ caseId, ownerUnderTest: "VAL", domain: "structural-fidelity", purpose, inputArtifactRefs: [`frozen-input:${caseId}`], projectRef: `${frozenValChain.project.projectId}@${frozenValChain.project.versionId}`, upstreamFrozenResultRefs: [frozenValChain.knowledgeEntry.result!.resultId, frozenValChain.scientificThinkingEntry.result!.resultId, frozenValChain.imagingEntry.result!.resultId], scientificContext: `Predeclared defect recipe: ${defectRecipe}`, testedCapabilities: obligations.map((item) => item.checkId), expectedObligations: obligations.map((item) => item.statement), forbiddenBehaviors: ["repair", "Project write", "scientific PASS", "automatic decision"], allowedAlternatives: ["structural pass", "structural findings"], expectedGaps: defectRecipe === "EXPECTED_OBS_GAP" ? ["OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED"] : [], expectedLimitations: ["Structural fidelity only; not PD-011 qualification."], referenceRefs: [...sourceRefs.val], reviewStatus: "AUTHORED_PRE_OBSERVATION", exposureStatus: "UNEXPOSED", replayPredeclared: replay });
    envelopes.push({ envelopeId: `acceptance-envelope:${caseId}`, caseId, ownerUnderTest: "VAL", obligations, allowedVariation: ["Finding identifiers", "observation ordering"], forbiddenBehaviors: ["repair", "scientific judgment", "automatic decision"], unknownsToPreserve: [], limitationsToExpose: ["STRUCTURAL_FIDELITY_ONLY_NOT_SCIENTIFIC_QUALIFICATION"], referenceSupport: "CONTRACT_ONLY", authoredBeforeObservation: true });
    inputs.push(pack(caseId, "VAL", purpose, [frozenValChain.snapshot.snapshotDigest, frozenValChain.ledger.ledgerDigest, ...sourceRefs.val], { projectSnapshot: frozenValChain.snapshot, frozenOwnerLedger: frozenValChain.ledger, defectRecipe, expectedFailureClass: expectedClass[defectRecipe] }));
  }

  return { cases, envelopes, inputs };
};
