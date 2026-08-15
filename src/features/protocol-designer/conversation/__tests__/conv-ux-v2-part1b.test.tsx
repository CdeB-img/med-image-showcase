import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildScientificThinkingInput, executeScientificThinkingEngine } from "@/features/scientific-thinking";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import { applyScientificInterpretationInteractionBoundary } from "@/features/scientific-interpretation/runtime";
import { projectScientificContributionToV1 } from "@/features/scientific-interpretation/v1-compatibility";
import {
  activateConversationalInteraction,
  completeConversationalInteraction,
  createConversationalWorkspaceSession,
  loadConversationalWorkspaceSession,
  persistConversationalWorkspaceSession,
} from "../ConversationalWorkspaceSession";
import {
  composerPlaceholderForActiveInteraction,
  createActiveConversationInteraction,
  createRouteIntentConversationInteraction,
} from "../ActiveConversationInteraction";
import { buildConversationalSemanticHandoff } from "../ConversationalHandoffRouter";
import { buildContributionProjectPanelProjection } from "../ProjectPanel";
import ProjectPanel from "../ProjectPanel";
import UnderstandingReviewCard from "../UnderstandingReviewCard";
import { resolveRouteIntentContribution } from "../RouteIntentResolver";
import { clearProtocolDesignerConversationalWorkspace } from "../reset";

const NOW = "2026-08-15T12:00:00.000Z";
const EXACT_SCENARIO = "Je souhaite étudier l'effet de la colchicine dans l'infarctus du myocarde, étudier les marqueurs de l'inflammation et quantifier les lésions à l'IRM et en biologie, chez deux populations médicaments vs placebo, dans une étude multicentrique créée de toutes pièces.";
const ROUTE_RESPONSE = "Je souhaite maintenant créer un modèle d’étude autour de cela.";

const boundary = (turnId = "turn:initial") => ({
  ownership: "USER",
  epistemicStatus: "EXPLICIT_USER_STATED",
  adoptionStatus: null,
  activeState: true,
  sourceTurnIds: [turnId],
  sourceText: null,
});

const contribution = (route: string | null = null): ScientificInterpretationContributionEnvelope => ({
  contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
  contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
  identity: {
    contributionId: route ? "contribution:route-resolved" : "contribution:colchicine-production",
    contractVersion: "1.0.0",
    runtimeId: "HYBRID_PRIMARY_STRUCTURED",
    runtimeVersion: "1.2.0",
    createdAt: NOW,
    contributionDigest: route ? "digest:route-resolved" : "digest:colchicine-production",
  },
  source: {
    conversationId: "conversation:production",
    originalRequest: EXACT_SCENARIO,
    turns: [{ turnId: "turn:initial", role: "USER", content: EXACT_SCENARIO, createdAt: NOW }],
    sourceRefs: ["turn:initial"],
    rawOutputRef: "raw:production",
    rawOutputDigest: "raw-digest:production",
  },
  runtimeEvidence: { provider: "TEST", model: "TEST", promptDigest: "prompt", schemaDigest: "schema", configurationDigest: "configuration", technicalStatus: "AVAILABLE", parseStatus: "PARSED", validationErrors: [] },
  scientificContent: {
    normalizedUnderstanding: "Étudier l’effet de la colchicine après infarctus avec des mesures complémentaires en IRM cardiaque et en biologie, versus placebo, dans une étude multicentrique.",
    routeProposal: route ? { route, confidence: 0.99, reason: "L’utilisateur demande explicitement de construire une étude." } : null,
    explicitStatements: [],
    candidateObjects: [
      { itemId: "intervention:colchicine", semanticIdentity: "colchicine", proposedType: "INTERVENTION", content: "colchicine", polarity: "AFFIRMED", studyRole: "INTERVENTION_ARM", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "condition:idm", semanticIdentity: "myocardial-infarction", proposedType: "CONDITION", content: "infarctus du myocarde", polarity: "AFFIRMED", studyRole: "CONDITION", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "comparator:placebo", semanticIdentity: "placebo", proposedType: "COMPARATOR", content: "placebo", polarity: "AFFIRMED", studyRole: "COMPARATOR_ARM", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "modality:mri", semanticIdentity: "cardiac-mri", proposedType: "IMAGING_MODALITY", content: "IRM cardiaque", polarity: "AFFIRMED", studyRole: "MEASUREMENT", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "biology:inflammation", semanticIdentity: "inflammatory-biomarkers", proposedType: "BIOLOGICAL_MEASUREMENT", content: "marqueurs inflammatoires", polarity: "AFFIRMED", studyRole: "MEASUREMENT", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "biology:blood", semanticIdentity: "blood-biomarkers", proposedType: "BIOLOGICAL_MEASUREMENT", content: "biomarqueurs sanguins", polarity: "AFFIRMED", studyRole: "MEASUREMENT", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "target:infarct-size", semanticIdentity: "infarct-size", proposedType: "QUANTITATIVE_IMAGING_TARGET", content: "taille de l’infarctus à l’IRM", polarity: "AFFIRMED", studyRole: "MEASUREMENT", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "method:lossy-composite", semanticIdentity: "mri-biology-composite", proposedType: "METHOD", content: "IRM / biologie", polarity: "AFFIRMED", studyRole: "MEASUREMENT", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "design:multicenter", semanticIdentity: "multicenter-study", proposedType: "STUDY_DESIGN", content: "étude multicentrique créée de toutes pièces", polarity: "AFFIRMED", studyRole: "STUDY_DESIGN", confidence: 1, epistemicBoundary: boundary() },
    ],
    candidateRelations: [
      { relationId: "relation:lesion-mri", relationType: "MEASURED_BY", sourceItemId: "target:infarct-size", targetItemId: "modality:mri", polarity: "AFFIRMED", confidence: 1, epistemicBoundary: boundary() },
      { relationId: "relation:arms", relationType: "COMPARES_WITH", sourceItemId: "intervention:colchicine", targetItemId: "comparator:placebo", polarity: "AFFIRMED", confidence: 1, epistemicBoundary: boundary() },
    ],
    inferredContext: [], contextualCandidates: [], negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [], correctionsAndSupersessions: [], openDecisions: [], clarificationNeeds: [],
  },
  epistemicBoundary: { candidateIsAdopted: false, knowledgeSupportIsProjectDecision: false, projectOwnershipTransferred: false, humanDecisionEnvelopeRef: null },
  mapping: [],
  audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
  decisionBoundary: { decisionRequired: true, decisionEnvelopeRef: null, permittedHumanDispositions: ["ACCEPT_WORKING_BASIS"], projectWriteAuthorized: false },
});

const routeInteraction = () => createRouteIntentConversationInteraction({
  interactionRef: "interaction:route",
  sourceActionRef: "route-intent:missing",
  contributionRef: "contribution:colchicine-production",
  projectRef: null,
  projectVersion: null,
  projectDigest: null,
  now: NOW,
});

describe("CONV-UX-V2-01B — active interaction and semantic projection hotfix", () => {
  it("CONV-V2B-C01 routes a free response by the active interaction purpose", () => {
    const session = activateConversationalInteraction(createConversationalWorkspaceSession(NOW), routeInteraction(), NOW);
    expect(session.currentInteractionRef).toBe("interaction:route");
    expect(session.currentInteraction).toMatchObject({ owner: "SCIENTIFIC_INTERPRETATION", purpose: "RESOLVE_ROUTE_INTENT", expectedResponseKind: "ROUTE_INTENT" });
  });

  it("CONV-V2B-C02 keeps a route-intent answer outside scientific unknowns", () => {
    const previous = contribution();
    const interpretedRoute = contribution("DESIGN_STUDY");
    interpretedRoute.source.turns.push({ turnId: "turn:route", role: "USER", content: ROUTE_RESPONSE, createdAt: NOW });
    interpretedRoute.scientificContent.unknowns.push({
      itemId: "unknown:route-utterance",
      semanticIdentity: null,
      proposedType: "UNKNOWN",
      content: "modèle d’étude à créer",
      polarity: "AFFIRMED",
      studyRole: null,
      confidence: 0.5,
      epistemicBoundary: boundary("turn:route"),
    });
    const resolved = applyScientificInterpretationInteractionBoundary(interpretedRoute, previous, {
      conversationId: "conversation:production",
      language: "fr",
      turns: interpretedRoute.source.turns,
      interactionContext: {
        interactionRef: "interaction:route",
        sourceActionRef: "route-intent:missing",
        owner: "SCIENTIFIC_INTERPRETATION",
        purpose: "RESOLVE_ROUTE_INTENT",
        expectedResponseKind: "ROUTE_INTENT",
        targetRefs: [previous.identity.contributionId],
        informationNeedRefs: [],
        projectRef: null,
        projectVersion: null,
        projectDigest: null,
      },
    });
    expect(resolveRouteIntentContribution(resolved)).toMatchObject({ status: "RESOLVED", routeIntent: "DESIGN_STUDY" });
    expect(resolved.scientificContent.unknowns.map((item) => item.content)).not.toContain("modèle d’étude à créer");
    expect(resolved.scientificContent.candidateObjects).toEqual(previous.scientificContent.candidateObjects);
  });

  it("CONV-V2B-C03 resolves the existing study-design route without a Project write", () => {
    const resolution = resolveRouteIntentContribution(contribution("DESIGN_STUDY"));
    expect(resolution).toMatchObject({ status: "RESOLVED", routeIntent: "DESIGN_STUDY", projectWriteAuthorized: false });
  });

  it("CONV-V2B-C04 keeps an ambiguous navigation intent in contextual clarification", () => {
    expect(resolveRouteIntentContribution(contribution())).toMatchObject({ status: "CLARIFICATION_REQUIRED", routeIntent: null, projectWriteAuthorized: false });
  });

  it("CONV-V2B-C05 reflects the active interaction in the composer context", () => {
    expect(composerPlaceholderForActiveInteraction(routeInteraction())).toBe("Dis-moi ce que tu veux construire ou approfondir…");
    const correction = createActiveConversationInteraction({ interactionRef: "interaction:correction", owner: "SCIENTIFIC_INTERPRETATION", purpose: "CORRECT_SCIENTIFIC_UNDERSTANDING", expectedResponseKind: "SCIENTIFIC_CORRECTION", targetRefs: ["contribution:one"], now: NOW });
    expect(composerPlaceholderForActiveInteraction(correction)).toBe("Corrige ou précise ce que j’ai compris…");
  });

  it("CONV-V2B-C06 keeps exactly one Standard free-response interaction active", () => {
    const first = activateConversationalInteraction(createConversationalWorkspaceSession(NOW), routeInteraction(), NOW);
    const secondInteraction = createActiveConversationInteraction({ interactionRef: "interaction:qry", sourceActionRef: "qry:one", owner: "RESEARCH_PROJECT", purpose: "ANSWER_QRY_INFORMATION_NEED", expectedResponseKind: "QRY_INFORMATION_RESPONSE", targetRefs: ["question:population"], informationNeedRefs: ["need:population"], now: NOW });
    const second = activateConversationalInteraction(first, secondInteraction, NOW);
    expect(second.currentInteractionRef).toBe("interaction:qry");
    expect(second.currentInteraction?.interactionRef).toBe("interaction:qry");
    expect(JSON.stringify(second)).not.toContain('"interactionRef":"interaction:route"');
  });

  it("CONV-V2B-C07 never classifies a hybrid generic method or biological measurement as imaging", () => {
    const panel = buildContributionProjectPanelProjection(contribution());
    const imaging = panel.sections.find((section) => section.sectionId === "IMAGING")!;
    const measurements = panel.sections.find((section) => section.sectionId === "MEASUREMENTS")!;
    expect(imaging.items).toEqual(["IRM cardiaque"]);
    expect(measurements.items).toEqual(expect.arrayContaining(["marqueurs inflammatoires", "biomarqueurs sanguins", "taille de l’infarctus à l’IRM"]));
    expect(imaging.items.join(" ")).not.toMatch(/biologi/i);
  });

  it("CONV-V2B-C08 prevents QRY/ST from presupposing an MRI-versus-biology comparison without a relation", () => {
    const typed = buildConversationalSemanticHandoff(contribution());
    const projection = projectScientificContributionToV1(contribution());
    const input = buildScientificThinkingInput(projection.validatedIntent, ["infarctus du myocarde"], projection.scientificSessionContext.detectedRelationships, null, { sourceJourney: "DESIGN_STUDY" });
    const output = executeScientificThinkingEngine(input);
    expect(typed.relations.some((relation) => /COMPARE/.test(relation.relationType) && [relation.sourceItemId, relation.targetItemId].includes("modality:mri") && [relation.sourceItemId, relation.targetItemId].includes("biology:inflammation"))).toBe(false);
    expect(input.methodsMentioned).toEqual(["IRM cardiaque"]);
    expect(output.adaptiveQuestions.map((item) => item.label).join(" ")).not.toMatch(/comparer.*IRM.*biologi/i);
  });

  it("CONV-V2B-C09 keeps Understanding, ProjectPanel and downstream inputs semantically consistent", () => {
    const typed = buildConversationalSemanticHandoff(contribution());
    const panel = buildContributionProjectPanelProjection(contribution());
    const projection = projectScientificContributionToV1(contribution());
    expect(typed.scientificElements.find((item) => item.itemId === "method:lossy-composite")?.semanticKind).toBe("UNCLASSIFIED_CANDIDATE");
    expect(panel.sections.find((section) => section.sectionId === "IMAGING")?.items).toEqual(["IRM cardiaque"]);
    expect(projection.validatedIntent.interpretation.availableEquipment.value).toEqual(["IRM cardiaque"]);
    expect(projection.validatedIntent.interpretation.outcomesMentioned.value).toEqual(expect.arrayContaining(["marqueurs inflammatoires", "biomarqueurs sanguins"]));
    render(<UnderstandingReviewCard contribution={contribution()} status="CONFIRMED" onConfirm={() => undefined} onCorrect={() => undefined} onAdd={() => undefined} />);
    const review = screen.getByTestId("understanding-review-card");
    expect(review).toHaveTextContent("IRM cardiaque");
    expect(review).toHaveTextContent("marqueurs inflammatoires");
    expect(review).not.toHaveTextContent("IRM / biologie");
  });

  it("CONV-V2B-C10 progresses the exact colchicine scenario past route intent", () => {
    const resolution = resolveRouteIntentContribution(contribution("DESIGN_STUDY"));
    expect(resolution.feedbackText).toBe("D’accord. Nous allons construire l’étude à partir de cette question.");
    expect(resolution.routeIntent).toBe("DESIGN_STUDY");
  });

  it("CONV-V2B-C11 cannot silently loop on the same unresolved orientation after a valid answer", () => {
    const active = activateConversationalInteraction(createConversationalWorkspaceSession(NOW), routeInteraction(), NOW);
    const completed = completeConversationalInteraction(active, "interaction:route", "response:route", NOW);
    expect(completed.currentInteractionRef).toBeNull();
    expect(completed.currentInteraction).toBeNull();
  });

  it("CONV-V2B-C12 reload preserves the resolved interaction state and semantic separation", () => {
    const storage = new Map<string, string>();
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) };
    const completed = completeConversationalInteraction(activateConversationalInteraction(createConversationalWorkspaceSession(NOW), routeInteraction(), NOW), "interaction:route", "response:route", NOW);
    persistConversationalWorkspaceSession(adapter, completed);
    const restored = loadConversationalWorkspaceSession(adapter)!;
    expect(restored.currentInteractionRef).toBeNull();
    expect(restored.currentInteraction).toBeNull();
    expect(buildContributionProjectPanelProjection(contribution()).sections.find((section) => section.sectionId === "IMAGING")?.items).toEqual(["IRM cardiaque"]);
  });

  it("CONV-V2B-C13 fixes the owner projection instead of rewriting MRI/biology copy in React", () => {
    const sources = ["../ProjectPanel.tsx", "../../../scientific-interpretation/ScientificInterpretationWorkspace.tsx"].map((file) => readFileSync(resolve(__dirname, file), "utf8")).join("\n");
    expect(sources).not.toMatch(/replace\([^\n]*(IRM|biologi)/i);
  });

  it("CONV-V2B-C14 introduces neither a new scientific owner nor a Project write path", () => {
    const allowed = new Set(["SCIENTIFIC_INTERPRETATION", "SCIENTIFIC_THINKING", "IMAGING", "KNOWLEDGE", "RESEARCH_PROJECT", "HUMAN_DECISION", "QUERY_NAVIGATION", "VALIDATION", "DOCUMENT", "STUDY_TEMPLATE", "DATA_ANALYSIS", "DATA_MANAGEMENT", "BIOSTATISTICS"]);
    const interaction = routeInteraction();
    expect(allowed.has(interaction.owner)).toBe(true);
    expect(interaction).toMatchObject({ sourceOfTruth: false, projectWriteAuthorized: false });
  });

  it("CONV-V2B-C15 clears every conversational owner, Project and Knowledge persistence key", () => {
    const storage = new Map<string, string>([
      ["noxia-conversational-workspace-session-v2", "{}"],
      ["noxia-scientific-interpretation-session-v1", "{}"],
      ["noxia-scientific-interpretation-owner-session-v2", "{}"],
      ["noxia-semantic-workspace-session-v1", "{}"],
      ["noxia-guided-intake-session-v10", "{}"],
      ["noxia-protocol-designer-owner-session-v2", "{}"],
      ["noxia-knowledge-engine-snapshots-v1-2", "[]"],
      ["noxia-knowledge-engine-snapshots-v1-1", "[]"],
    ]);
    clearProtocolDesignerConversationalWorkspace({ removeItem: (key) => storage.delete(key) });
    expect(storage.size).toBe(0);
    const workspace = readFileSync(resolve(__dirname, "../../../scientific-interpretation/ScientificInterpretationWorkspace.tsx"), "utf8");
    const page = readFileSync(resolve(__dirname, "../../../../pages/ProtocolDesignerDemo.tsx"), "utf8");
    expect(workspace).toContain("onResetWorkspace?.()");
    expect(page).toContain("onResetWorkspace={reset}");
    expect(page).toContain("clearProtocolDesignerConversationalWorkspace(window.localStorage)");
  });

  it("renders the separated ProjectPanel projection", () => {
    render(<ProjectPanel projection={buildContributionProjectPanelProjection(contribution())} />);
    expect(screen.getByRole("heading", { name: "Imagerie" }).parentElement?.parentElement).toHaveTextContent("IRM cardiaque");
    expect(screen.getByRole("heading", { name: "Variables / mesures" }).parentElement?.parentElement).toHaveTextContent("biomarqueurs sanguins");
  });
});
