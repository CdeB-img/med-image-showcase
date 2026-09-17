import { describe, expect, it } from "vitest";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
} from "@/features/research-project-construction";
import {
  buildBoundedConversationReferentContext,
  selectBoundedConversationInteraction,
} from "@/features/query-navigation/current-navigation-evidence";
import { validatePersistentProjectDelta } from "@/features/protocol-designer/product-bridge";
import { executeProductUnderstandInteraction, routeProductEntry } from "../product-entry-routing";
import {
  buildCandidateScientificChallenge,
  buildConciseAdoptionReply,
  buildNaturalProjectStateReply,
  classifyNaturalConversationActs,
  detectConversationStylePreference,
  nextMaterialProjectGap,
} from "../natural-conversation-policy";
import {
  markContributionCandidatePresented,
  retainValidatedContributionCandidate,
} from "../contribution-lifecycle";
import {
  behaviorAuthority,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "./p1-behavior-01a-contract-fixtures";

const at = "2026-09-16T12:00:00.000Z";
const source = "Comparer deux stratégies après infarctus afin d’évaluer la viabilité myocardique, dans une étude à deux groupes en double aveugle, avec comme critère principal la proportion de masse VG représentée par les lésions microvasculaires.";
const turn = behaviorTurn("turn:conversation-repair", source);
const contribution = behaviorContribution({
  contributionId: "candidate:conversation-repair",
  turns: [turn],
  candidateObjects: [
    behaviorItem({ itemId: "condition:idm", proposedType: "CONDITION", content: "Contexte après infarctus du myocarde", turnId: turn.turnId }),
    behaviorItem({ itemId: "objective:viability", proposedType: "OBJECTIVE", content: "Évaluer la viabilité myocardique", turnId: turn.turnId }),
    behaviorItem({ itemId: "intervention:immediate", proposedType: "INTERVENTION", content: "Stent immédiat", turnId: turn.turnId }),
    behaviorItem({ itemId: "group:delayed", proposedType: "COMPARATOR", content: "Stent différé", turnId: turn.turnId }),
    behaviorItem({ itemId: "design:blind", proposedType: "STUDY_DESIGN", content: "Étude à deux groupes en double aveugle", turnId: turn.turnId }),
    behaviorItem({ itemId: "endpoint:mvo", proposedType: "ENDPOINT", content: "Proportion de masse VG représentée par les lésions microvasculaires", studyRole: "PRIMARY_ENDPOINT", turnId: turn.turnId }),
  ],
});
const candidate = prepareResearchProjectContributionCandidate(contribution, null);
const retained = markContributionCandidatePresented({
  retained: retainValidatedContributionCandidate({
    retained: [], contribution, candidate,
    validation: { valid: true, acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [], acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [] },
    validatorRef: "HUMAN_CONVERSATION_REPAIR_TEST", sourceTurnRef: turn.turnId,
    baseProject: null, dependencyBindings: [], traceRunId: null, retainedAt: at,
  }),
  candidateRef: contribution.identity.contributionId,
  presentedAt: at,
});
const project = confirmResearchProjectContribution({
  contribution,
  current: null,
  projectId: "project:conversation-repair",
  authority: behaviorAuthority,
  confirmedAt: at,
  reviewedProjection: candidate.humanReviewProjection,
});

const referentContext = buildBoundedConversationReferentContext({
  retained,
  currentProject: null,
  conversationId: contribution.source.conversationId,
  runtimeTurns: [turn],
  selectedReviewRef: contribution.identity.contributionId,
});

describe("V1 human scientific conversation repair", () => {
  it("MIXED_INTENT_CONFIRMATION_PLUS_FEEDBACK", () => {
    const raw = "on adopte meme si je trouve que tu propose beaucoup trop de texte a lire";
    expect(classifyNaturalConversationActs(raw)).toEqual(expect.arrayContaining([
      "SCIENTIFIC_DECISION_INTENT", "STYLE_OR_DOCUMENTARY_FEEDBACK",
    ]));
    expect(selectBoundedConversationInteraction({ sourceText: raw, correctionMode: false, referentContext })?.kind)
      .toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
  });

  it("MIXED_INTENT_CORRECTION_PLUS_QUESTION", () => {
    expect(classifyNaturalConversationActs("Je corrige le suivi à six mois ; quel critère avons-nous retenu ?"))
      .toEqual(expect.arrayContaining(["CLARIFICATION_RESPONSE", "PROJECT_STATE_QUESTION"]));
  });

  it("PENDING_DECISION_REFERENCE_RESOLUTION", () => {
    const decision = selectBoundedConversationInteraction({
      sourceText: "Nous adoptons cette proposition, mais faites désormais des réponses plus courtes.",
      correctionMode: false,
      referentContext,
    });
    expect(decision).toMatchObject({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE" });
    expect(decision?.evidenceRefs).toContain(contribution.identity.contributionId);
  });

  it("PROJECT_STATE_QUESTION_NO_KNOWLEDGE_DETOUR", () => {
    const raw = "tu ne devrais pas me dire qu'on parle de la population ?";
    const decision = routeProductEntry({ raw, sourceTurnRef: "turn:state", routedAt: at, currentProjectAvailable: true });
    const result = executeProductUnderstandInteraction({ raw, decision, createdAt: at, currentProject: project });
    expect(result).toMatchObject({ responsibilityOwner: "RESEARCH_PROJECT", externalCalls: 0, projectWrites: 0 });
    expect(result.assistantReply).toContain("population reste à préciser");
    expect(result.assistantReply).not.toContain("connaissances internes");
  });

  it("ELLIPTICAL_PROJECT_STATE_QUESTION", () => {
    const answer = buildNaturalProjectStateReply({ raw: "la population tu ne connais pas. ?", project });
    expect(answer?.text).toContain("Non, pas encore précisément");
    expect(answer?.text).toContain("contexte clinique");
  });

  it("PROSPECTIVE_PROPOSAL_IS_NOT_PROJECT_STATE_RECALL", () => {
    expect(buildNaturalProjectStateReply({
      raw: "Et si on ajoutait une analyse exploratoire selon un seuil encore indéterminé ? Je propose cette analyse.",
      project,
    })).toBeNull();
  });

  it("SCIENTIFIC_RETENTION_AS_OBJECTIVE_IS_NEW_INFORMATION", () => {
    expect(classifyNaturalConversationActs(
      "Je retiens comme objectif exploratoire principal la caractérisation du débit et du transit.",
    )).toEqual(expect.arrayContaining(["SCIENTIFIC_DECISION_INTENT", "NEW_INFORMATION"]));
  });

  it("CONDITION_NOT_POPULATION", () => {
    const raw = "Étudier deux stratégies post-infarctus du myocarde.";
    const common = { operation: "ADD" as const, sourceText: raw, targetProjectRef: null,
      polarity: "AFFIRMED" as const, studyRole: null, epistemicStatus: "EXPLICIT_USER_STATED" as const,
      epistemicState: "KNOWN" as const, assertionKind: "USER_STATED" as const,
      proposalSourceText: null, evidenceRefs: [] as string[] };
    const checked = validatePersistentProjectDelta({ changes: [
      { ...common, candidateRef: "condition:idm", semanticIdentity: "condition:idm", proposedType: "CONDITION", content: "Infarctus du myocarde" },
      { ...common, candidateRef: "population:idm", semanticIdentity: "population:idm", proposedType: "POPULATION", content: "Infarctus du myocarde" },
    ], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, null, {
      conversationId: "conversation:condition-population", language: "fr",
      turns: [{ turnId: "turn:condition-population", role: "USER", content: raw }],
    });
    expect(checked.validation.valid).toBe(true);
    expect(checked.validation.acceptedChanges.map((change) => change.proposedType)).toEqual(["CONDITION"]);
    expect(checked.validation.noOps).toContain("change:1:CONDITION_CONTEXT_NOT_POPULATION");
  });

  it("OBJECTIVE_NOT_ENDPOINT", () => {
    const objects = ensureCanonicalProjectState(project).objects.filter((object) => object.actuality === "CURRENT");
    expect(objects.find((object) => object.objectType === "OBJECTIVE")?.objectId).not.toBe(
      objects.find((object) => object.objectType === "ENDPOINT")?.objectId,
    );
    expect(objects.find((object) => object.objectType === "OBJECTIVE")?.scientificRole).not.toBe("PRIMARY_ENDPOINT");
  });

  it("STYLE_FEEDBACK_CHANGES_LENGTH_NOT_SCIENCE", () => {
    const before = JSON.stringify(project);
    const preference = detectConversationStylePreference("Fais plus court, il y a trop de texte à lire.");
    const reply = buildConciseAdoptionReply({ project, projectExisted: true, stylePreference: preference });
    expect(preference).toMatchObject({ responseLength: "CONCISE" });
    expect(reply).toContain("Je ferai plus court");
    expect(JSON.stringify(project)).toBe(before);
  });

  it("NEXT_BEST_GAP_SELECTION", () => {
    expect(nextMaterialProjectGap(project)).toMatchObject({ code: "POPULATION_UNDEFINED" });
    expect(buildConciseAdoptionReply({ project, projectExisted: true, stylePreference: detectConversationStylePreference("Réponds plus court.") }))
      .toContain("Quels patients");
  });

  it("SCIENTIFIC_TENSION_SURFACED", () => {
    const challenge = buildCandidateScientificChallenge(candidate);
    expect(challenge).toContain("l’objectif");
    expect(challenge).toContain("critère principal");
    expect(challenge).toContain("masquage");
  });

  it("STANDARD_RESPONSE_BREVITY", () => {
    const challenge = buildCandidateScientificChallenge(candidate)!;
    expect(challenge.length).toBeLessThan(650);
    expect(challenge.split(/[.!?]+/u).filter(Boolean).length).toBeLessThanOrEqual(3);
    expect(buildConciseAdoptionReply({ project, projectExisted: true, stylePreference: detectConversationStylePreference("Réponds plus court.") }).length)
      .toBeLessThan(240);
  });

  it("PROJECT_INTEGRITY_AFTER_MIXED_INTENT", () => {
    const before = JSON.stringify(ensureCanonicalProjectState(project));
    classifyNaturalConversationActs("On adopte, mais moins de texte ensuite.");
    detectConversationStylePreference("On adopte, mais moins de texte ensuite.");
    expect(JSON.stringify(ensureCanonicalProjectState(project))).toBe(before);
    expect(before).not.toContain("moins de texte");
  });
});
