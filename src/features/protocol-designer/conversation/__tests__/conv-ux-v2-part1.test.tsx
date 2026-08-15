import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WorkspaceInteractionHandoff } from "@/features/adaptive-research-workspace/interactions";
import { createWorkspaceInteractionHandoff } from "@/features/adaptive-research-workspace/interactions";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import { projectScientificContributionToV1 } from "@/features/scientific-interpretation/v1-compatibility";
import { createProtocolDesignerWorkspaceHandoff } from "@/features/protocol-designer/intake/workspace-handoff";
import { answerProjectQuestion, createResearchProjectConstructionSession } from "@/features/research-project-construction";
import { makeFrozenImagingResult, makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import { buildQueryNavigationProductProjection } from "@/features/query-navigation/product";
import ConversationalProtocolDesignerShell from "../ConversationalProtocolDesignerShell";
import ConversationTimeline from "../ConversationTimeline";
import ProjectPanel, { type ProjectPanelProjection } from "../ProjectPanel";
import UnderstandingReviewCard from "../UnderstandingReviewCard";
import {
  buildConversationalSemanticHandoff,
  routeConversationalHandoff,
} from "../ConversationalHandoffRouter";
import {
  appendConversationEvent,
  completeConversationalOwnerHandoff,
  confirmConversationalUnderstanding,
  createConversationalWorkspaceSession,
  markConversationalHandoffPending,
  migrateConversationalWorkspaceSession,
  persistConversationalWorkspaceSession,
} from "../ConversationalWorkspaceSession";

const NOW = "2026-08-15T12:00:00.000Z";
const USER_TEXT = "Je souhaite étudier l'effet de la colchicine dans l'infarctus du myocarde, étudier les marqueurs de l'inflammation et quantifier les lésions à l'IRM et en biologie, chez deux populations médicaments vs placebo.";
const CORRECTION = "L’IRM et la biologie sont complémentaires. Je ne souhaite pas comparer les deux méthodes.";

const boundary = (turnId = "turn:user") => ({
  ownership: "USER",
  epistemicStatus: "EXPLICIT_USER_STATED",
  adoptionStatus: null,
  activeState: true,
  sourceTurnIds: [turnId],
  sourceText: USER_TEXT,
});

const contribution = (): ScientificInterpretationContributionEnvelope => ({
  contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
  contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
  identity: {
    contributionId: "contribution:colchicine",
    contractVersion: "1.0.0",
    runtimeId: "TEST_RUNTIME",
    runtimeVersion: "1",
    createdAt: NOW,
    contributionDigest: "digest:colchicine",
  },
  source: {
    conversationId: "conversation:colchicine",
    originalRequest: USER_TEXT,
    turns: [{ turnId: "turn:user", role: "USER", content: USER_TEXT, createdAt: NOW }],
    sourceRefs: ["turn:user"],
    rawOutputRef: "raw:colchicine",
    rawOutputDigest: "raw-digest:colchicine",
  },
  runtimeEvidence: {
    provider: "TEST",
    model: "TEST",
    promptDigest: "prompt",
    schemaDigest: "schema",
    configurationDigest: "configuration",
    technicalStatus: "STRUCTURED_CONTRACT_VALID",
    parseStatus: "PARSED",
    validationErrors: [],
  },
  scientificContent: {
    normalizedUnderstanding: "Étudier la colchicine après infarctus, avec des mesures complémentaires en IRM cardiaque et en biologie, versus placebo.",
    routeProposal: { route: "DESIGN_STUDY", confidence: 1, reason: "Projet comparatif déclaré." },
    explicitStatements: [],
    candidateObjects: [
      { itemId: "drug:colchicine", semanticIdentity: "colchicine", proposedType: "INTERVENTION", content: "colchicine", polarity: "AFFIRMED", studyRole: "INTERVENTION_ARM", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "condition:idm", semanticIdentity: "infarctus-du-myocarde", proposedType: "CLINICAL_CONDITION", content: "infarctus du myocarde", polarity: "AFFIRMED", studyRole: "CONDITION", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "modality:mri", semanticIdentity: "cardiac-mri", proposedType: "IMAGING_MODALITY", content: "IRM cardiaque", polarity: "AFFIRMED", studyRole: "MEASUREMENT", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "biomarker:inflammation", semanticIdentity: "inflammatory-biomarkers", proposedType: "BIOMARKER", content: "marqueurs inflammatoires biologiques", polarity: "AFFIRMED", studyRole: "MEASUREMENT", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "target:lesions", semanticIdentity: "lesion-burden", proposedType: "SCIENTIFIC_OBJECT", content: "quantification des lésions", polarity: "AFFIRMED", studyRole: "OUTCOME_ROLE", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "comparator:placebo", semanticIdentity: "placebo", proposedType: "COMPARATOR", content: "placebo", polarity: "AFFIRMED", studyRole: "COMPARATOR_ARM", confidence: 1, epistemicBoundary: boundary() },
    ],
    candidateRelations: [
      { relationId: "relation:complementary", relationType: "COMPLEMENTARY_WITH", sourceItemId: "modality:mri", targetItemId: "biomarker:inflammation", polarity: "AFFIRMED", confidence: 1, epistemicBoundary: boundary() },
    ],
    inferredContext: [],
    contextualCandidates: [],
    negationsAndConstraints: [],
    temporalElements: [],
    ambiguities: [],
    unknowns: [],
    missingInformation: [],
    correctionsAndSupersessions: [],
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

const projectProjection = (): ProjectPanelProjection => ({
  projectRef: "project:colchicine",
  projectVersion: "project-version:1",
  projectDigest: "project-digest:1",
  sections: [
    { sectionId: "QUESTION", label: "Question", state: "CONFIRMED", items: ["Colchicine versus placebo après infarctus"] },
    { sectionId: "IMAGING", label: "Imagerie", state: "MENTIONED", items: ["IRM cardiaque"] },
    { sectionId: "MEASUREMENTS", label: "Variables / mesures", state: "TO_CLARIFY", items: ["Marqueurs inflammatoires biologiques"] },
  ],
  documents: [
    { documentId: "document:protocol", label: "Protocole", owner: "DOC-001", sourceState: "NOT_GENERATABLE", explanation: "Population et critère principal à préciser." },
    { documentId: "document:sap", label: "SAP", owner: "DOC-001", sourceState: "STALE", explanation: "À actualiser après modification du projet." },
  ],
  sourceOfTruth: false,
  projectWriteAuthorized: false,
});

const workspaceHandoff = (): WorkspaceInteractionHandoff => ({
  interactionVersion: "1.0.0",
  handoffId: "workspace-handoff:timing",
  sourceActionRef: "selected-action:timing",
  sourceProjectRef: "project:colchicine",
  sourceProjectVersion: "project-version:1",
  sourceStateDigest: "project-digest:1",
  targetRef: "PRJ-Q-TIMING",
  answerOwner: "RESEARCH_PROJECT",
  response: {
    responseId: "response:timing",
    selectedActionRef: "selected-action:timing",
    presentationRef: "presentation:timing",
    projectRef: "project:colchicine",
    projectVersionAtPresentation: "project-version:1",
    responseKind: "FREE_TEXT",
    rawResponse: "six mois",
    actorRef: "researcher:test",
    actorRole: "RESEARCHER",
    selectedOptionRefs: [],
    disposition: "ANSWER",
    receivedAt: NOW,
    provenanceRefs: ["need:timing"],
    rawResponseIsProjectTruth: false,
    projectWriteAuthorized: false,
    digest: "response-digest:timing",
  },
  route: {
    routeId: "route:timing",
    responseRef: "response:timing",
    destination: "SCIENTIFIC_INTERPRETATION",
    owner: "SCIENTIFIC_INTERPRETATION",
    inputRefs: ["response:timing", "presentation:timing", "selected-action:timing"],
    expectedOutputContract: "ScientificInterpretationContribution",
    projectWriteAuthorized: false,
    humanDecisionCreated: false,
    scientificParsingPerformed: false,
    reason: "ROUTED_BY_ACTION_AND_ANSWER_CONTRACT_NOT_RESPONSE_CONTENT",
  },
  state: "INTERPRETATION_PENDING",
  rawResponsePreserved: true,
  responseIsProjectTruth: false,
  contributionAdopted: false,
  humanDecisionCreated: false,
  projectWriteAuthorized: false,
  validationWriteAuthorized: false,
  providerCalls: 0,
});

describe("CONV-UX-V2-01 — continuous scientific conversation", () => {
  it("CONV-V2-C01 keeps the same mounted timeline after understanding confirmation", () => {
    const session = appendConversationEvent(createConversationalWorkspaceSession(NOW, "session:one", "conversation:one"), { eventId: "event:review", type: "UNDERSTANDING_REVIEW", createdAt: NOW, presentationStatus: "CURRENT", text: "Voici ce que j’ai compris.", ownerRefs: ["contribution:colchicine"], replayContext: null });
    const { rerender } = render(<ConversationTimeline session={session} draft="" busy={false} onDraftChange={vi.fn()} onSubmit={vi.fn()} />);
    const timeline = screen.getByTestId("conversation-timeline");
    rerender(<ConversationTimeline session={confirmConversationalUnderstanding(session, "contribution:colchicine", "researcher:test", NOW)} draft="" busy={false} onDraftChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId("conversation-timeline")).toBe(timeline);
    expect(screen.getByTestId("conversation-timeline")).toHaveAttribute("data-conversation-id", "conversation:one");
  });

  it("CONV-V2-C02 continue reasoning never creates a second conversation shell", () => {
    render(<ConversationalProtocolDesignerShell session={createConversationalWorkspaceSession(NOW)} project={projectProjection()} timeline={<div>Conversation active</div>} />);
    expect(screen.getAllByTestId("conversational-protocol-designer-shell")).toHaveLength(1);
    expect(screen.getByText("Conversation active")).toBeInTheDocument();
  });

  it("CONV-V2-C03 requires explicit confirmation or correction", () => {
    const onConfirm = vi.fn();
    render(<UnderstandingReviewCard contribution={contribution()} status="PENDING" onConfirm={onConfirm} onCorrect={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Voici ce que j’ai compris" })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon objectif" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("CONV-V2-C04 confirmation remains a working-context event, not adopted Project truth", () => {
    const next = confirmConversationalUnderstanding(createConversationalWorkspaceSession(NOW), "contribution:colchicine", "researcher:test", NOW);
    expect(next.understanding).toMatchObject({ status: "CONFIRMED_WORKING_CONTEXT", contributionRef: "contribution:colchicine", projectWriteAuthorized: false });
    expect(next.currentProjectRef).toBeNull();
  });

  it("CONV-V2-C05 appends a correction to the same conversation with supersession refs", () => {
    const start = createConversationalWorkspaceSession(NOW, "session:one", "conversation:one");
    const next = appendConversationEvent(start, { eventId: "event:correction", type: "USER_CORRECTION", createdAt: NOW, presentationStatus: "CURRENT", text: CORRECTION, ownerRefs: ["contribution:colchicine"], replayContext: { supersedesEventRefs: ["event:review"] } });
    expect(next.conversationId).toBe(start.conversationId);
    expect(next.timeline.at(-1)).toMatchObject({ type: "USER_CORRECTION", replayContext: { supersedesEventRefs: ["event:review"] } });
  });

  it("CONV-V2-C06 keeps MRI and biological measurements as distinct semantic concepts", () => {
    const handoff = buildConversationalSemanticHandoff(contribution());
    expect(handoff.scientificElements).toContainEqual(expect.objectContaining({ itemId: "modality:mri", semanticKind: "IMAGING_MODALITY" }));
    expect(handoff.scientificElements).toContainEqual(expect.objectContaining({ itemId: "biomarker:inflammation", semanticKind: "BIOLOGICAL_MEASUREMENT" }));
    expect(handoff.scientificElements.find((item) => /IRM\s*\/\s*biologie/i.test(item.content))).toBeUndefined();
  });

  it("CONV-V2-C07 never creates an implicit MRI-versus-biology comparison", () => {
    const handoff = buildConversationalSemanticHandoff(contribution());
    expect(handoff.relations).toContainEqual(expect.objectContaining({ relationType: "COMPLEMENTARY_WITH" }));
    expect(handoff.relations.some((relation) => /COMPARE|VERSUS/.test(relation.relationType) && [relation.sourceItemId, relation.targetItemId].includes("modality:mri") && [relation.sourceItemId, relation.targetItemId].includes("biomarker:inflammation"))).toBe(false);
  });

  it("CONV-V2-C08 uses typed Contribution content rather than a legacy projection alone", () => {
    const handoff = buildConversationalSemanticHandoff(contribution());
    expect(handoff).toMatchObject({ contractNature: "CONVERSATIONAL_TYPED_HANDOFF_NOT_SOURCE_OF_TRUTH", contributionRef: "contribution:colchicine", legacyProjectionRef: null, projectWriteAuthorized: false });
    expect(handoff.scientificElements.length).toBeGreaterThan(1);
  });

  it("CONV-V2-C09 routes every free-text QRY answer to a contractual owner", () => {
    const route = routeConversationalHandoff({ interaction: workspaceHandoff(), contribution: contribution(), ownerTarget: "RESEARCH_PROJECT", currentProjectRef: "project:colchicine", currentProjectVersion: "project-version:1", freshness: "CURRENT" });
    expect(route).toMatchObject({ targetOwner: "RESEARCH_PROJECT", sourceOwner: "SCIENTIFIC_INTERPRETATION", projectWriteAuthorized: false });
  });

  it("CONV-V2-C10 exposes pending, success and failure owner feedback", () => {
    const base = createConversationalWorkspaceSession(NOW);
    const pending = appendConversationEvent(base, { eventId: "event:pending", type: "OWNER_FEEDBACK", createdAt: NOW, presentationStatus: "PENDING", text: "NOXIA met à jour cette partie du projet.", ownerRefs: ["RESEARCH_PROJECT"], replayContext: null });
    const success = appendConversationEvent(pending, { eventId: "event:success", type: "OWNER_FEEDBACK", createdAt: NOW, presentationStatus: "SUCCESS", text: "J’ai pris en compte cette précision.", ownerRefs: ["RESEARCH_PROJECT"], replayContext: null });
    const failed = appendConversationEvent(success, { eventId: "event:failure", type: "ERROR", createdAt: NOW, presentationStatus: "FAILURE", text: "La mise à jour a échoué. Vous pouvez réessayer.", ownerRefs: ["RESEARCH_PROJECT"], replayContext: null });
    render(<ConversationTimeline session={failed} draft="" busy={false} onDraftChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("NOXIA met à jour cette partie du projet.")).toBeInTheDocument();
    expect(screen.getByText("J’ai pris en compte cette précision.")).toBeInTheDocument();
    expect(screen.getByText("La mise à jour a échoué. Vous pouvez réessayer.")).toBeInTheDocument();
  });

  it("CONV-V2-C11 successful owner processing requests QRY re-evaluation", () => {
    const completed = completeConversationalOwnerHandoff(createConversationalWorkspaceSession(NOW), { handoffRef: "handoff:one", ownerRef: "RESEARCH_PROJECT", ownerResultRef: "project-result:2", projectRef: "project:colchicine", projectVersion: "project-version:2", projectDigest: "project-digest:2", qryMemoryRef: "qry-memory:2", qryActionRef: "qry-action:2", completedAt: NOW });
    expect(completed.qry).toMatchObject({ refreshRequestedByRef: "project-result:2", currentActionRef: "qry-action:2", memoryRef: "qry-memory:2" });
  });

  it("CONV-V2-C12 appends the next QRY action to the same timeline", () => {
    const completed = completeConversationalOwnerHandoff(createConversationalWorkspaceSession(NOW, "session:one", "conversation:one"), { handoffRef: "handoff:one", ownerRef: "RESEARCH_PROJECT", ownerResultRef: "project-result:2", projectRef: "project:colchicine", projectVersion: "project-version:2", projectDigest: "project-digest:2", qryMemoryRef: "qry-memory:2", qryActionRef: "qry-action:2", completedAt: NOW });
    expect(completed.conversationId).toBe("conversation:one");
    expect(completed.timeline.map((event) => event.type)).toEqual(expect.arrayContaining(["OWNER_FEEDBACK", "QRY_RESPONSE"]));
  });

  it("CONV-V2-C13 never permits a silent Standard event", () => {
    expect(() => appendConversationEvent(createConversationalWorkspaceSession(NOW), { eventId: "event:silent", type: "OWNER_FEEDBACK", createdAt: NOW, presentationStatus: "PENDING", text: "", ownerRefs: ["RESEARCH_PROJECT"], replayContext: null })).toThrow("CONVERSATION_EVENT_VISIBLE_TEXT_REQUIRED");
  });

  it("CONV-V2-C14 keeps every Standard response outside adopted Project truth", () => {
    expect(workspaceHandoff()).toMatchObject({ responseIsProjectTruth: false, contributionAdopted: false, projectWriteAuthorized: false });
    expect(routeConversationalHandoff({ interaction: workspaceHandoff(), contribution: contribution(), ownerTarget: "RESEARCH_PROJECT", currentProjectRef: "project:colchicine", currentProjectVersion: "project-version:1", freshness: "CURRENT" }).projectWriteAuthorized).toBe(false);
  });

  it("CONV-V2-C15 keeps the Project panel sticky on desktop", () => {
    render(<ProjectPanel projection={projectProjection()} />);
    expect(screen.getByRole("complementary", { name: "Research Project" }).className).toMatch(/lg:sticky/);
  });

  it("CONV-V2-C16 keeps ProjectPanel a projection rather than an editable mega-form", () => {
    render(<ProjectPanel projection={projectProjection()} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("CONV-V2-C17 displays document states only from TMP/DOC source state", () => {
    render(<ProjectPanel projection={projectProjection()} />);
    expect(screen.getByText("Pas encore générable")).toBeInTheDocument();
    expect(screen.getByText("À actualiser après modification du projet")).toBeInTheDocument();
    expect(projectProjection().documents.every((document) => document.owner === "DOC-001")).toBe(true);
  });

  it("CONV-V2-C18 reload migrates once and deduplicates timeline events", () => {
    const storage = new Map<string, string>();
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) };
    const legacyScientific = { sessionVersion: "SCIENTIFIC-INTERPRETATION-WORKSPACE-1.0", sessionId: "legacy-si", messages: [{ turnId: "turn:one", role: "USER", content: USER_TEXT, createdAt: NOW }], contributionHistory: [], projectionHistory: [], fallbackHistory: [], currentContribution: null };
    const migrated = migrateConversationalWorkspaceSession({ legacyScientificInterpretation: legacyScientific, legacyGuidedWorkspace: { sessionId: "legacy-guided", projectConstruction: { result: { resultId: "project:one", candidateVersion: { versionId: "project-version:1" }, resultDigest: "project-digest:1" } } }, now: NOW });
    persistConversationalWorkspaceSession(adapter, appendConversationEvent(migrated, migrated.timeline[0]!));
    const restored = migrateConversationalWorkspaceSession({ storage: adapter, now: NOW });
    expect(restored.sessionId).toBe(migrated.sessionId);
    expect(restored.timeline.filter((event) => event.eventId === "turn:one")).toHaveLength(1);
    expect(restored.currentProjectRef).toBe("project:one");
  });

  it("CONV-V2-C19 Expert remains a projection of the same owner refs", () => {
    const session = createConversationalWorkspaceSession(NOW);
    const { rerender } = render(<ConversationalProtocolDesignerShell session={session} project={projectProjection()} timeline={<div>Timeline</div>} mode="STANDARD" />);
    const project = screen.getByRole("complementary", { name: "Research Project" });
    rerender(<ConversationalProtocolDesignerShell session={{ ...session, currentMode: "EXPERT" }} project={projectProjection()} timeline={<div>Timeline</div>} mode="EXPERT" />);
    expect(screen.getByRole("complementary", { name: "Research Project" })).toBe(project);
    expect(screen.getByText("project:colchicine")).toBeInTheDocument();
  });

  it("CONV-V2-C20 introduces no scientific owner", () => {
    const allowed = new Set(["SCIENTIFIC_INTERPRETATION", "SCIENTIFIC_THINKING", "IMAGING", "KNOWLEDGE", "RESEARCH_PROJECT", "HUMAN_DECISION", "QUERY_NAVIGATION"]);
    const route = routeConversationalHandoff({ interaction: workspaceHandoff(), contribution: contribution(), ownerTarget: "IMAGING", currentProjectRef: "project:colchicine", currentProjectVersion: "project-version:1", freshness: "CURRENT" });
    expect(allowed.has(route.targetOwner)).toBe(true);
    expect(route).not.toHaveProperty("scientificDecision");
  });

  it("COLCHICINE-E2E closes response → SI → Project owner → QRY in one conversation", () => {
    const imaging = makeFrozenImagingResult();
    const initialProject = createResearchProjectConstructionSession(makeProjectInput({
      question: USER_TEXT,
      outcomes: [],
      population: [],
      pathology: [],
      methods: ["IRM cardiaque"],
      interventions: [],
      objectives: false,
      hypotheses: false,
      imagingResult: imaging,
      imagingStatus: "FROZEN_BY_HUMAN",
    }));
    const admittedValidationGate = [{ gateId: "V1_READY", status: "ALLOWED" as const, runRefs: ["validation-run:colchicine"], findingRefs: [], reviewRequestRefs: [], affectedBranchRefs: ["project:v1-readiness"], owner: "VAL-001", reason: "Validation fixture admise pour isoler le corridor conversationnel." }];
    const navigationSourceProject = { ...initialProject.result, localReadiness: [], projectionReadiness: [], missingInformation: [], contradictions: [], dependencies: [] };
    const initialSelection = buildQueryNavigationProductProjection(navigationSourceProject, undefined, null, admittedValidationGate);
    const openQuestion = initialProject.result.adaptiveQuestions.find((questionItem) => !questionItem.answeredValue);
    expect(openQuestion).toBeDefined();
    const questionCandidate = initialSelection.alternatives.find((candidate) => candidate.targetRef === openQuestion!.questionId);
    expect(questionCandidate).toBeDefined();
    const initialNavigation = buildQueryNavigationProductProjection(navigationSourceProject, initialSelection.memory, questionCandidate!.candidateId, admittedValidationGate);
    expect(initialNavigation.questionPresentation?.informationNeedRefs).toEqual(questionCandidate!.navigationNeedRefs);
    const interaction = createWorkspaceInteractionHandoff({
      projection: initialNavigation,
      currentProjectVersion: initialProject.result.candidateVersion.versionId,
      currentSourceStateDigest: initialNavigation.sourceStateDigest,
      disposition: "ANSWER",
      rawResponse: "Quantifier conjointement les lésions en IRM cardiaque et les marqueurs inflammatoires biologiques.",
      actorRef: "researcher:colchicine",
      actorRole: "RESEARCHER",
      receivedAt: NOW,
      responseId: "response:colchicine-population",
    });
    const interpretedResponse = contribution();
    interpretedResponse.identity.contributionId = "contribution:colchicine-population";
    interpretedResponse.source.originalRequest = String(interaction.response.rawResponse);
    interpretedResponse.scientificContent.candidateObjects.push({
      itemId: "outcome:lesions-and-inflammation",
      semanticIdentity: "lesions-and-inflammatory-biomarkers",
      proposedType: "OUTCOME",
      content: "quantification des lésions et marqueurs inflammatoires biologiques",
      polarity: "AFFIRMED",
      studyRole: "OUTCOME_ROLE",
      confidence: 1,
      epistemicBoundary: boundary("turn:population"),
    });
    const route = routeConversationalHandoff({
      interaction,
      contribution: interpretedResponse,
      ownerTarget: "RESEARCH_PROJECT",
      currentProjectRef: initialProject.result.resultId,
      currentProjectVersion: initialProject.result.candidateVersion.versionId,
      freshness: "CURRENT",
    });
    const rebuiltProject = answerProjectQuestion(initialProject, route.targetRef, String(interaction.response.rawResponse));
    const refreshedNavigation = buildQueryNavigationProductProjection(rebuiltProject.result, undefined, null, admittedValidationGate);
    expect(rebuiltProject.result.resultDigest).not.toBe(initialProject.result.resultDigest);
    expect(rebuiltProject.controls.answers?.[route.targetRef]).toContain("Quantifier");
    expect(refreshedNavigation.selectedAction?.selectedActionId).not.toBe(initialNavigation.selectedAction?.selectedActionId);

    let conversation = appendConversationEvent(createConversationalWorkspaceSession(NOW, "session:colchicine", "conversation:colchicine"), {
      eventId: "event:initial-colchicine", type: "USER_MESSAGE", createdAt: NOW, presentationStatus: "CURRENT", text: USER_TEXT, ownerRefs: ["USER"], replayContext: null,
    });
    conversation = appendConversationEvent(conversation, {
      eventId: interaction.response.responseId, type: "USER_MESSAGE", createdAt: NOW, presentationStatus: "CURRENT", text: String(interaction.response.rawResponse), ownerRefs: ["USER"], replayContext: null,
    });
    conversation = markConversationalHandoffPending(conversation, interaction.handoffId, "RESEARCH_PROJECT", NOW);
    conversation = appendConversationEvent(conversation, {
      eventId: "event:interpreted-outcome", type: "NOXIA_INTERPRETATION", createdAt: NOW, presentationStatus: "SUCCESS", text: "Résultat interprété comme des mesures complémentaires en IRM cardiaque et en biologie.", ownerRefs: [interpretedResponse.identity.contributionId], replayContext: null,
    });
    conversation = completeConversationalOwnerHandoff(conversation, {
      handoffRef: interaction.handoffId,
      ownerRef: "RESEARCH_PROJECT",
      ownerResultRef: `project-owner-result:${rebuiltProject.result.resultDigest}`,
      projectRef: rebuiltProject.result.resultId,
      projectVersion: rebuiltProject.result.candidateVersion.versionId,
      projectDigest: rebuiltProject.result.resultDigest,
      qryMemoryRef: refreshedNavigation.memory.memoryId,
      qryActionRef: refreshedNavigation.selectedAction?.selectedActionId ?? null,
      completedAt: NOW,
    });
    expect(conversation.conversationId).toBe("conversation:colchicine");
    expect(conversation.pendingHandoffRefs).toEqual([]);
    expect(conversation.timeline.map((event) => event.type)).toEqual(expect.arrayContaining(["USER_MESSAGE", "NOXIA_INTERPRETATION", "OWNER_FEEDBACK", "QRY_RESPONSE"]));
    expect(conversation.currentProjectDigest).toBe(rebuiltProject.result.resultDigest);
  });

  it("COLCHICINE-CORRECTION retires an inactive MRI-versus-biology relation from current projections", () => {
    const corrected = contribution();
    corrected.identity.contributionId = "contribution:colchicine-corrected";
    corrected.source.originalRequest = CORRECTION;
    corrected.scientificContent.candidateRelations = [
      { relationId: "relation:old-comparison", relationType: "COMPARED_WITH", sourceItemId: "modality:mri", targetItemId: "biomarker:inflammation", polarity: "AFFIRMED", confidence: 1, epistemicBoundary: { ...boundary("turn:old"), activeState: false } },
      { relationId: "relation:complementary", relationType: "COMPLEMENTARY_WITH", sourceItemId: "modality:mri", targetItemId: "biomarker:inflammation", polarity: "AFFIRMED", confidence: 1, epistemicBoundary: boundary("turn:correction") },
    ];
    const typed = buildConversationalSemanticHandoff(corrected);
    const legacyProjection = projectScientificContributionToV1(corrected);
    const workspace = createProtocolDesignerWorkspaceHandoff(legacyProjection, NOW, typed);
    expect(typed.relations.find((relation) => relation.relationId === "relation:old-comparison")?.activeState).toBe(false);
    expect(workspace.scientificContext.detectedRelationships.some((relation) => relation.includes("COMPARED_WITH"))).toBe(false);
    expect(workspace.scientificContext.detectedRelationships.some((relation) => relation.includes("COMPLEMENTARY_WITH"))).toBe(true);
    expect(workspace.validatedIntent?.interpretation.availableEquipment.value).toContain("IRM cardiaque");
    expect(workspace.validatedIntent?.interpretation.availableEquipment.value).not.toContain("marqueurs inflammatoires biologiques");
    expect(workspace.validatedIntent?.interpretation.outcomesMentioned.value).toContain("marqueurs inflammatoires biologiques");
  });
});
