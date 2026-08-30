import type {
  ContributionEpistemicBoundary,
  ScientificContributionItem,
  ScientificContributionRelation,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import {
  confirmResearchProjectContribution,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

export const BEHAVIOR_OBSERVED_AT = "2026-08-31T12:00:00.000Z";
export const BEHAVIOR_PROJECT_ID = "research-project:p1-behavior-01a";

export type BehavioralContractId = `B${string}`;

export type BehavioralTransitionContract = Readonly<{
  id: BehavioralContractId;
  title: string;
  precondition: string;
  userAction: string;
  mustPreserve: readonly string[];
  mayInterpret: readonly string[];
  mustNotInvent: readonly string[];
  expectedQryAction: string;
  expectedVisibleBehavior: readonly string[];
  expectedCandidateEffect: string;
  expectedProjectEffect: string;
  humanGate: string;
  expectedTraceFacts: readonly string[];
  expectedDocumentEffect: string;
  deterministicAssertions: readonly string[];
  humanOnlyAssertions: readonly string[];
}>;

const contract = (value: BehavioralTransitionContract) => Object.freeze(value);

/**
 * P1 test oracle only. This is neither a Product authority nor a new runtime
 * state model. Its expectations are derived from the routed authorities and
 * the already established P1 restoration target.
 */
export const P1_BEHAVIORAL_CONTRACTS: readonly BehavioralTransitionContract[] = Object.freeze([
  contract({
    id: "B01", title: "Rich initial study request",
    precondition: "No candidate and no adopted Project.",
    userAction: "Submit a study-construction request containing several explicit dimensions.",
    mustPreserve: ["Every explicit dimension", "Candidate status", "Source provenance"],
    mayInterpret: ["Natural formulation", "Reversible structure"],
    mustNotInvent: ["Missing scientific content", "Project adoption"],
    expectedQryAction: "PROPOSE unless a material ambiguity makes ASK eligible.",
    expectedVisibleBehavior: ["Specific governed response", "Structured understanding", "Human Review"],
    expectedCandidateEffect: "One working candidate pending Human Review.",
    expectedProjectEffect: "No Project write.",
    humanGate: "Explicit confirmation required for first adoption.",
    expectedTraceFacts: ["DESIGN_STUDY route", "QUERY_NAVIGATION owns WHAT", "projectWrites=0"],
    expectedDocumentEffect: "No document projection.",
    deterministicAssertions: ["Rich response is not a generic acknowledgement", "Candidate is reviewable"],
    humanOnlyAssertions: ["Scientific adequacy of the proposed structure"],
  }),
  contract({
    id: "B02", title: "Sparse or ambiguous initial request",
    precondition: "No candidate and no adopted Project.",
    userAction: "Submit an insufficiently specified study request.",
    mustPreserve: ["The sparse statement", "Unknowns"],
    mayInterpret: ["Insufficiency", "A material explicit ambiguity"],
    mustNotInvent: ["Project structure", "Scientific values"],
    expectedQryAction: "ASK only with material information value; otherwise bounded PROPOSE/RESPOND.",
    expectedVisibleBehavior: ["Generic acknowledgement permitted when governed meaning is insufficient"],
    expectedCandidateEffect: "No fabricated candidate.",
    expectedProjectEffect: "No Project write.",
    humanGate: "Not applicable until a candidate exists.",
    expectedTraceFacts: ["Already supplied information remains referenced", "projectWrites=0"],
    expectedDocumentEffect: "No document projection.",
    deterministicAssertions: ["No fabricated dimensions"],
    humanOnlyAssertions: ["Whether a real ambiguity is scientifically material"],
  }),
  contract({
    id: "B03", title: "Human confirms first structure",
    precondition: "A first candidate exists and Human Review is pending.",
    userAction: "Explicitly confirm the reviewed structure.",
    mustPreserve: ["Candidate content", "Actor", "Mandate", "Provenance"],
    mayInterpret: ["None beyond the reviewed candidate"],
    mustNotInvent: ["Unreviewed Project content"],
    expectedQryAction: "Recompute next useful action after adoption.",
    expectedVisibleBehavior: ["Adopted Project visibly distinguishable", "Version 1 visible"],
    expectedCandidateEffect: "Pending candidate becomes an adopted contribution record.",
    expectedProjectEffect: "Create Project v1 exactly once.",
    humanGate: "ADOPTED decision with actor and PROJECT_OWNER mandate.",
    expectedTraceFacts: ["PROJECT_CREATED after HUMAN_DECISION_RECORDED"],
    expectedDocumentEffect: "Document remains ungenerated until explicit handoff/export.",
    deterministicAssertions: ["revision=1", "previousVersionId=null", "llmProjectWrites=0"],
    humanOnlyAssertions: ["Confirmation means the structure corresponds to the user's project"],
  }),
  contract({
    id: "B04", title: "Add information to an adopted Project",
    precondition: "Project vN exists.",
    userAction: "Add one scientifically relevant item.",
    mustPreserve: ["Project vN", "Existing values", "Source turn"],
    mayInterpret: ["A new typed Project contribution"],
    mustNotInvent: ["Unstated additions"],
    expectedQryAction: "Recompute after confirmed adoption.",
    expectedVisibleBehavior: ["Proposed addition visible before confirmation"],
    expectedCandidateEffect: "ADD pending Human Review.",
    expectedProjectEffect: "Unchanged before confirmation; vN+1 after confirmation.",
    humanGate: "Confirmation required.",
    expectedTraceFacts: ["PROJECT_CANDIDATE_EXTRACTED", "PROJECT_VERSIONED only after decision"],
    expectedDocumentEffect: "Current projection becomes stale after vN+1.",
    deterministicAssertions: ["ADD operation", "Base Project byte-stable before confirmation"],
    humanOnlyAssertions: ["Scientific relevance of the added item"],
  }),
  contract({
    id: "B05", title: "Remove existing information",
    precondition: "Project vN contains an active item.",
    userAction: "Explicitly remove that item.",
    mustPreserve: ["Project vN", "Removed identity", "Historical version"],
    mayInterpret: ["Explicit negation as REMOVE"],
    mustNotInvent: ["A free-text replacement"],
    expectedQryAction: "Recompute after confirmed removal.",
    expectedVisibleBehavior: ["Removal delta visible"],
    expectedCandidateEffect: "REMOVE pending Human Review.",
    expectedProjectEffect: "Item remains before confirmation and is absent from vN+1 after it.",
    humanGate: "Confirmation required.",
    expectedTraceFacts: ["REMOVE candidate attributable to source turn"],
    expectedDocumentEffect: "Existing document becomes stale after adoption.",
    deterministicAssertions: ["REMOVE, not ADD", "Prior canonical version remains historical"],
    humanOnlyAssertions: ["Whether the removal is intended despite downstream consequences"],
  }),
  contract({
    id: "B06", title: "Re-add previously removed information",
    precondition: "An item is absent from the current Project after an explicit removal.",
    userAction: "Explicitly re-add the same semantic item.",
    mustPreserve: ["Semantic lineage", "Removal history"],
    mayInterpret: ["Re-addition as a new ADD in the current version"],
    mustNotInvent: ["Hidden restoration", "Competing duplicate identity"],
    expectedQryAction: "Recompute after confirmed re-addition.",
    expectedVisibleBehavior: ["New addition proposal visible"],
    expectedCandidateEffect: "ADD pending Human Review.",
    expectedProjectEffect: "New version contains one current identity and reconstructible history.",
    humanGate: "Confirmation required.",
    expectedTraceFacts: ["ADD follows earlier REMOVE"],
    expectedDocumentEffect: "Existing document becomes stale after adoption.",
    deterministicAssertions: ["Exactly one CURRENT identity after re-addition"],
    humanOnlyAssertions: ["Scientific justification for restoring the item"],
  }),
  contract({
    id: "B07", title: "Replace or correct an existing value",
    precondition: "Project vN contains a value with stable semantic identity.",
    userAction: "Provide a corrected value.",
    mustPreserve: ["Stable identity", "Old value", "Provenance"],
    mayInterpret: ["Value change as REPLACE"],
    mustNotInvent: ["A second competing field"],
    expectedQryAction: "Recompute after confirmed replacement.",
    expectedVisibleBehavior: ["Old value → proposed new value"],
    expectedCandidateEffect: "REPLACE pending Human Review.",
    expectedProjectEffect: "Unchanged before confirmation; vN+1 contains the new value.",
    humanGate: "Confirmation required.",
    expectedTraceFacts: ["REPLACE references the prior Project identity"],
    expectedDocumentEffect: "Existing document becomes stale after adoption.",
    deterministicAssertions: ["REPLACE, not ADD", "Old version is SUPERSEDED, not deleted"],
    humanOnlyAssertions: ["Whether the corrected value is scientifically appropriate"],
  }),
  contract({
    id: "B08", title: "Multiple coherent changes in one message",
    precondition: "Project vN exists.",
    userAction: "Provide several coherent changes in one turn.",
    mustPreserve: ["Every valid change", "Per-change attribution"],
    mayInterpret: ["One coherent review bundle"],
    mustNotInvent: ["Dropped changes", "Forced one-field workflow"],
    expectedQryAction: "Do not interrupt the coherent bundle with a lower-value question.",
    expectedVisibleBehavior: ["All changes grouped and visible"],
    expectedCandidateEffect: "One candidate containing all valid changes.",
    expectedProjectEffect: "No mutation before one explicit bundle confirmation.",
    humanGate: "One confirmation may adopt the coherent bundle.",
    expectedTraceFacts: ["Every engaging change has a Human Review ref"],
    expectedDocumentEffect: "Existing document becomes stale after adoption.",
    deterministicAssertions: ["No silent partial drop", "Review coverage is complete"],
    humanOnlyAssertions: ["Coherence of the bundled scientific changes"],
  }),
  contract({
    id: "B09", title: "Partial answer",
    precondition: "A QRY information need is open.",
    userAction: "Answer only part of the requested information.",
    mustPreserve: ["Useful supplied value", "Unanswered part as open"],
    mayInterpret: ["Partial satisfaction of a need"],
    mustNotInvent: ["Missing answer", "Form completion"],
    expectedQryAction: "Recompute the next useful action from the updated state.",
    expectedVisibleBehavior: ["Accepted supplied information and remaining open point"],
    expectedCandidateEffect: "Candidate contains only supplied Project changes.",
    expectedProjectEffect: "Only confirmed supplied information is adopted.",
    humanGate: "Confirmation required for supplied Project changes.",
    expectedTraceFacts: ["Known and unknown portions remain distinct"],
    expectedDocumentEffect: "Projection reflects the value and retains the open point.",
    deterministicAssertions: ["No inferred completion"],
    humanOnlyAssertions: ["Whether the partial answer is sufficient for a branch"],
  }),
  contract({
    id: "B10", title: "I do not know yet",
    precondition: "A QRY information need is open.",
    userAction: "Explicitly answer that the information is not known yet.",
    mustPreserve: ["UNKNOWN/deferred status", "Source response", "Open need"],
    mayInterpret: ["Explicit deferral"],
    mustNotInvent: ["A Project value", "Immediate duplicate question"],
    expectedQryAction: "Select another useful action when one exists.",
    expectedVisibleBehavior: ["Unknown accepted without fault framing"],
    expectedCandidateEffect: "No scientific Project change.",
    expectedProjectEffect: "No new Project version.",
    humanGate: "No adoption gate for an absent value.",
    expectedTraceFacts: ["ACTION_DEFERRED with USER_DOES_NOT_KNOW"],
    expectedDocumentEffect: "Open unknown remains visible where applicable.",
    deterministicAssertions: ["Deferred need is not immediately repeated"],
    humanOnlyAssertions: ["Whether another unresolved dimension has higher value"],
  }),
  contract({
    id: "B11", title: "Not applicable or refusal",
    precondition: "A question permits a negative, not-applicable, unknown or refused response.",
    userAction: "Answer NO, NOT_APPLICABLE, UNKNOWN or REFUSE_TO_ANSWER.",
    mustPreserve: ["Exact response semantics", "Provenance"],
    mayInterpret: ["Lifecycle consequence defined by the applicable contract"],
    mustNotInvent: ["Missing-data equivalence", "A positive value"],
    expectedQryAction: "Do not immediately repeat without a new trigger.",
    expectedVisibleBehavior: ["Four states remain distinguishable"],
    expectedCandidateEffect: "Only representable, user-supplied semantics may enter review.",
    expectedProjectEffect: "No implicit value or version.",
    humanGate: "Required only if the disposition changes the Project.",
    expectedTraceFacts: ["Disposition and provenance retained"],
    expectedDocumentEffect: "Projection preserves the exact state.",
    deterministicAssertions: ["NO != NOT_APPLICABLE != UNKNOWN != REFUSE_TO_ANSWER"],
    humanOnlyAssertions: ["Scientific consequence of the disposition"],
  }),
  contract({
    id: "B12", title: "Next useful question",
    precondition: "An adopted Project has at least one unresolved material dimension.",
    userAction: "Complete an adopted change.",
    mustPreserve: ["Already known information", "QRY memory"],
    mayInterpret: ["Information value and dependency order"],
    mustNotInvent: ["A fixed form order", "A repeated known question"],
    expectedQryAction: "Select the highest-value eligible action or PROPOSE/stop.",
    expectedVisibleBehavior: ["One next useful action"],
    expectedCandidateEffect: "No candidate unless the user supplies Project information.",
    expectedProjectEffect: "QRY never mutates Project.",
    humanGate: "Separate from Project adoption.",
    expectedTraceFacts: ["QUERY_NAVIGATION owns selection", "projectWriteAuthorized=false"],
    expectedDocumentEffect: "Document blockers may inform, not own, selection.",
    deterministicAssertions: ["Known need is not selected", "Answered action is not immediately repeated"],
    humanOnlyAssertions: ["Scientific value among non-dominated alternatives"],
  }),
  contract({
    id: "B13", title: "Correction of a previous interpretation",
    precondition: "A candidate interpretation is pending and no Project has adopted it.",
    userAction: "State that the interpretation is wrong and provide a correction.",
    mustPreserve: ["Prior candidate as history", "Correction provenance"],
    mayInterpret: ["Corrected candidate supersedes the prior proposal"],
    mustNotInvent: ["Silent history rewrite", "Project mutation"],
    expectedQryAction: "Use the corrected candidate state.",
    expectedVisibleBehavior: ["Current corrected proposal, prior proposal reconstructible"],
    expectedCandidateEffect: "Corrected candidate replaces, rather than accumulates with, the prior interpretation.",
    expectedProjectEffect: "No Project write before confirmation.",
    humanGate: "Confirmation required for the corrected candidate.",
    expectedTraceFacts: ["Supersession/reference to prior candidate"],
    expectedDocumentEffect: "No document change before adoption.",
    deterministicAssertions: ["One current corrected semantic value", "Prior candidate remains reconstructible"],
    humanOnlyAssertions: ["Whether the correction now matches intent"],
  }),
  contract({
    id: "B14", title: "Provider realization rejected or unavailable",
    precondition: "QRY has selected a governed WHAT.",
    userAction: "Provider HOW is absent or rejected by conformance validation.",
    mustPreserve: ["Governed WHAT", "Explicit dimensions", "Rejection evidence"],
    mayInterpret: ["A bounded local formulation"],
    mustNotInvent: ["New science", "Empty generic reply when governed meaning is rich"],
    expectedQryAction: "Keep the same governed action and WHAT.",
    expectedVisibleBehavior: ["Specific governed fallback"],
    expectedCandidateEffect: "Unchanged by realization choice.",
    expectedProjectEffect: "No Project write.",
    humanGate: "Unchanged.",
    expectedTraceFacts: ["Provider response received status", "Accepted/rejected status", "Reason class", "Fallback reason"],
    expectedDocumentEffect: "None.",
    deterministicAssertions: ["Fallback preserves rich meaning", "Final TRACE exposes the rejection boundary"],
    humanOnlyAssertions: ["Natural quality of the fallback wording"],
  }),
  contract({
    id: "B15", title: "Semantic category fidelity",
    precondition: "A governed object is available for visible projection.",
    userAction: "Review the structured understanding or Project view.",
    mustPreserve: ["Object meaning", "Scientific role", "Provenance"],
    mayInterpret: ["Presentation label compatible with meaning"],
    mustNotInvent: ["An unrelated visible category"],
    expectedQryAction: "Not applicable to passive presentation.",
    expectedVisibleBehavior: ["Visible section is semantically compatible with the object"],
    expectedCandidateEffect: "No reclassification merely for display convenience.",
    expectedProjectEffect: "No semantic mutation through projection.",
    humanGate: "No new gate; presentation is passive.",
    expectedTraceFacts: ["Object type/role and projection section remain inspectable"],
    expectedDocumentEffect: "Same semantic category fidelity in document projection.",
    deterministicAssertions: ["Sample/material collection is not collapsed into an unrelated imaging section"],
    humanOnlyAssertions: ["Borderline domain categorization when contracts do not decide it"],
  }),
  contract({
    id: "B16", title: "Project Living View",
    precondition: "An adopted Project exists, optionally with a pending delta.",
    userAction: "Continue the conversation or inspect the Project.",
    mustPreserve: ["Current version", "Known values", "Open states", "Pending/adopted distinction"],
    mayInterpret: ["Compact Standard projection"],
    mustNotInvent: ["Pending value as adopted"],
    expectedQryAction: "Remain available independently from Project display.",
    expectedVisibleBehavior: ["Persistent Project panel with current version and open states"],
    expectedCandidateEffect: "Pending delta remains separately reviewable.",
    expectedProjectEffect: "Adopted values remain unchanged before confirmation.",
    humanGate: "Pending delta requires confirmation.",
    expectedTraceFacts: ["Project version before/after remains stable until decision"],
    expectedDocumentEffect: "Document state remains tied to adopted version only.",
    deterministicAssertions: ["Project and pending review show distinct states"],
    humanOnlyAssertions: ["Usability of the living view"],
  }),
  contract({
    id: "B17", title: "Session continuity",
    precondition: "A session contains adopted state and/or a pending candidate.",
    userAction: "Reload and rehydrate the session.",
    mustPreserve: ["Project version", "Pending candidate", "Open gaps", "QRY memory"],
    mayInterpret: ["Schema-compatible migration only"],
    mustNotInvent: ["Provider replay", "Project mutation"],
    expectedQryAction: "Resume stored navigation state.",
    expectedVisibleBehavior: ["Same state after reload"],
    expectedCandidateEffect: "Persisted candidate remains pending when supported by the session contract.",
    expectedProjectEffect: "Same Project digest and version.",
    humanGate: "Unchanged.",
    expectedTraceFacts: ["No new trace event solely for rehydration"],
    expectedDocumentEffect: "Same portfolio and freshness state.",
    deterministicAssertions: ["Rehydration is byte-stable for governed state", "Provider calls=0"],
    humanOnlyAssertions: ["Acceptability of session persistence scope"],
  }),
  contract({
    id: "B18", title: "Document projection current or stale",
    precondition: "A document projection exists for Project vN.",
    userAction: "Keep Project unchanged or adopt Project vN+1.",
    mustPreserve: ["Projection source version", "Historical projection"],
    mayInterpret: ["CURRENT or STALE freshness"],
    mustNotInvent: ["Silent currentness after Project change"],
    expectedQryAction: "Document blockers may be read as signals only.",
    expectedVisibleBehavior: ["Current when bound to vN; stale/update required after vN+1"],
    expectedCandidateEffect: "None.",
    expectedProjectEffect: "Document projection never mutates Project.",
    humanGate: "Explicit handoff/export required to generate or update.",
    expectedTraceFacts: ["Project and projection version bindings"],
    expectedDocumentEffect: "CURRENT → STALE after adopted Project change.",
    deterministicAssertions: ["Old projection cannot appear current for vN+1"],
    humanOnlyAssertions: ["Whether a partial projection is useful enough to request"],
  }),
  contract({
    id: "B19", title: "Human Review and Project Living View consistency",
    precondition: "The same candidate or adopted state is projected in several surfaces.",
    userAction: "Compare conversation, structured understanding, Human Review, Project and document projection.",
    mustPreserve: ["Identity", "Known values", "Unknowns", "Candidate/adopted status", "Project version"],
    mayInterpret: ["Different presentation density and wording"],
    mustNotInvent: ["Cross-surface semantic disagreement"],
    expectedQryAction: "No new action created by passive comparison.",
    expectedVisibleBehavior: ["Semantically consistent projections"],
    expectedCandidateEffect: "No mutation.",
    expectedProjectEffect: "No mutation.",
    humanGate: "No new decision created by projection.",
    expectedTraceFacts: ["Shared identities and version refs"],
    expectedDocumentEffect: "Document binds the same adopted Project version.",
    deterministicAssertions: ["Known-value sets agree", "Statuses do not conflict"],
    humanOnlyAssertions: ["Whether presentation differences remain understandable"],
  }),
  contract({
    id: "B20", title: "No silent Project write",
    precondition: "Any initial, addition, removal, replacement, multi-change or correction candidate.",
    userAction: "Produce and inspect a candidate without confirming it.",
    mustPreserve: ["Adopted Project", "Candidate boundary", "Human authority"],
    mayInterpret: ["A proposed delta"],
    mustNotInvent: ["Engaging mutation", "Implicit adoption"],
    expectedQryAction: "Selection never authorizes Project writes.",
    expectedVisibleBehavior: ["Proposal remains visibly pending"],
    expectedCandidateEffect: "projectWriteAuthorized=false for every class.",
    expectedProjectEffect: "Zero mutation until Human Decision.",
    humanGate: "Mandatory for every engaging change.",
    expectedTraceFacts: ["projectWrites=0 before confirmation", "decision owner remains human for adoption"],
    expectedDocumentEffect: "No projection refresh from a pending candidate.",
    deterministicAssertions: ["Shared invariant applies to all candidate classes"],
    humanOnlyAssertions: ["Whether the user intends to adopt the candidate"],
  }),
]);

export const behaviorAuthority = Object.freeze({
  actorRef: "p1-behavior-01a:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
});

export const behaviorTurn = (turnId: string, content: string): ScientificInterpretationTurn => ({
  turnId,
  role: "USER",
  content,
  createdAt: BEHAVIOR_OBSERVED_AT,
});

export type SyntheticItemInput = Readonly<{
  itemId: string;
  proposedType: string;
  content: string;
  turnId: string;
  semanticIdentity?: string;
  studyRole?: string | null;
  sourceText?: string | null;
  epistemicState?: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD";
  epistemicStatus?: string;
  activeState?: boolean;
  polarity?: string;
  previousItemIds?: string[];
}>;

const boundary = (input: SyntheticItemInput): ContributionEpistemicBoundary => ({
  ownership: "USER",
  epistemicState: input.epistemicState ?? "KNOWN",
  epistemicStatus: input.epistemicStatus ?? "EXPLICIT_USER_STATED",
  adoptionStatus: "CANDIDATE",
  activeState: input.activeState ?? true,
  sourceTurnIds: [input.turnId],
  sourceText: input.sourceText ?? input.content,
});

export const behaviorItem = (input: SyntheticItemInput): ScientificContributionItem => ({
  itemId: input.itemId,
  semanticIdentity: input.semanticIdentity ?? input.itemId,
  proposedType: input.proposedType,
  content: input.content,
  polarity: input.polarity ?? "AFFIRMED",
  studyRole: input.studyRole ?? null,
  confidence: 1,
  previousItemIds: input.previousItemIds ?? [],
  evidenceRefs: [],
  epistemicBoundary: boundary(input),
});

export const behaviorRelation = (input: Readonly<{
  relationId: string;
  relationType: string;
  sourceItemId: string;
  targetItemId: string;
  turnId: string;
}>): ScientificContributionRelation => ({
  relationId: input.relationId,
  relationType: input.relationType,
  sourceItemId: input.sourceItemId,
  targetItemId: input.targetItemId,
  polarity: "AFFIRMED",
  confidence: 1,
  evidenceRefs: [],
  epistemicBoundary: boundary({
    itemId: input.relationId,
    proposedType: "RELATION",
    content: input.relationType,
    turnId: input.turnId,
  }),
});

export const behaviorContribution = (input: Readonly<{
  contributionId: string;
  turns: ScientificInterpretationTurn[];
  candidateObjects?: ScientificContributionItem[];
  temporalElements?: ScientificContributionItem[];
  relations?: ScientificContributionRelation[];
  unknowns?: ScientificContributionItem[];
  negations?: ScientificContributionItem[];
  corrections?: ScientificContributionItem[];
  previousContributionId?: string | null;
}>): ScientificInterpretationContributionEnvelope => ({
  contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
  contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
  identity: {
    contributionId: input.contributionId,
    previousContributionId: input.previousContributionId ?? null,
    contractVersion: "1.0.0",
    runtimeId: "P1_BEHAVIOR_01A_SYNTHETIC_FIXTURE",
    runtimeVersion: "1.0.0",
    createdAt: BEHAVIOR_OBSERVED_AT,
    contributionDigest: `${input.contributionId}:digest`,
  },
  source: {
    conversationId: "conversation:p1-behavior-01a",
    originalRequest: input.turns.at(-1)?.content ?? "",
    turns: input.turns,
    sourceRefs: input.turns.map((turn) => turn.turnId),
    rawOutputRef: `fixture:${input.contributionId}`,
    rawOutputDigest: `fixture:${input.contributionId}:digest`,
  },
  runtimeEvidence: {
    provider: "TEST_FIXTURE_NO_PROVIDER_CALL",
    model: "NONE",
    promptDigest: null,
    schemaDigest: "p1-behavior-01a-fixture-schema",
    configurationDigest: "p1-behavior-01a-fixture-configuration",
    technicalStatus: "STRUCTURED_CONTRACT_VALID",
    parseStatus: "PARSED",
    validationErrors: [],
  },
  scientificContent: {
    normalizedUnderstanding: input.turns.at(-1)?.content ?? null,
    routeProposal: null,
    explicitStatements: [],
    candidateObjects: input.candidateObjects ?? [],
    candidateRelations: input.relations ?? [],
    inferredContext: [],
    contextualCandidates: [],
    negationsAndConstraints: input.negations ?? [],
    temporalElements: input.temporalElements ?? [],
    ambiguities: [],
    unknowns: input.unknowns ?? [],
    missingInformation: [],
    correctionsAndSupersessions: input.corrections ?? [],
    openDecisions: [],
    clarificationNeeds: [],
  },
  epistemicBoundary: {
    candidateIsAdopted: false,
    knowledgeSupportIsProjectDecision: false,
    projectOwnershipTransferred: false,
    humanDecisionEnvelopeRef: null,
  },
  mapping: [],
  audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
  decisionBoundary: {
    decisionRequired: true,
    decisionEnvelopeRef: null,
    permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
    projectWriteAuthorized: false,
  },
});

export const richStudyTurn = behaviorTurn(
  "turn:p1-behavior-01a:rich",
  "Je veux créer une étude comparant la population A et la population B, avec l’intervention X, la méthode Y, la mesure Z et le temps T1.",
);

export const richStudyContribution = () => behaviorContribution({
  contributionId: "contribution:p1-behavior-01a:rich",
  turns: [richStudyTurn],
  candidateObjects: [
    behaviorItem({ itemId: "question:ab", proposedType: "SCIENTIFIC_QUESTION", content: "Comparer la population A et la population B", turnId: richStudyTurn.turnId }),
    behaviorItem({ itemId: "population:a", proposedType: "POPULATION", content: "population A", turnId: richStudyTurn.turnId }),
    behaviorItem({ itemId: "population:b", proposedType: "POPULATION", content: "population B", turnId: richStudyTurn.turnId }),
    behaviorItem({ itemId: "intervention:x", proposedType: "INTERVENTION", content: "intervention X", turnId: richStudyTurn.turnId, studyRole: "INTERVENTION_ARM" }),
    behaviorItem({ itemId: "comparator:b", proposedType: "COMPARATOR", content: "population B", turnId: richStudyTurn.turnId, studyRole: "COMPARATOR_ARM" }),
    behaviorItem({ itemId: "design:study", proposedType: "STUDY_DESIGN", content: "étude comparative", turnId: richStudyTurn.turnId }),
    behaviorItem({ itemId: "method:y", proposedType: "MEASUREMENT", content: "méthode Y", turnId: richStudyTurn.turnId }),
    behaviorItem({ itemId: "measurement:z", proposedType: "MEASUREMENT", content: "mesure Z", turnId: richStudyTurn.turnId }),
  ],
  temporalElements: [
    behaviorItem({ itemId: "time:t1", proposedType: "TIMEPOINT", content: "mesure à T1", turnId: richStudyTurn.turnId }),
  ],
  relations: [
    behaviorRelation({ relationId: "relation:a-vs-b", relationType: "COMPARES_WITH", sourceItemId: "population:a", targetItemId: "population:b", turnId: richStudyTurn.turnId }),
  ],
});

export const adoptBehaviorContribution = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
  minute: number,
) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: BEHAVIOR_PROJECT_ID,
  authority: behaviorAuthority,
  confirmedAt: `2026-08-31T12:${String(minute).padStart(2, "0")}:00.000Z`,
});
