import { describe, expect, it } from "vitest";
import { buildCurrentTurnNavigation, type CurrentGovernedNavigationInput } from "../current-turn-navigation";
import { selectNextAction } from "../engine";
import { validateNavigationSelection } from "../validation";
import { makeContext, TWO_OPTIONS_STATE, USER_UNKNOWN_STATE } from "./fixtures";
import {
  contributionFromPersistentDelta, validatePersistentProjectDelta,
  type PersistentProjectDeltaWireCandidate,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution, prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";

const AT = "2026-09-08T18:00:00.000Z";
type Row = readonly [ref: string, type: string, content: string, state: "KNOWN" | "UNKNOWN" | "WITHHELD", source: string];

// Exact historical inputs and a deliberately MINIMAL typed projection of their
// captured outputs. No runtime read from untracked validation artefacts.
// Provenance: validation/frozen-integrated-campaign-02-openai-luna-low/execution-01/
// scenario-{a,b,c,d}/full-text-capture.json and persistent-extraction.json.
// This is a deterministic regression fixture, NOT a provider replay or scientific gold.
const HISTORICAL_CASES: readonly { id: string; source: string; french: string; rows: readonly Row[]; comparison?: readonly [string, string] }[] = [
  {
    id: "A",
    source: "We have historical cardiac MRI and echocardiography data from patients followed after a first myocardial infarction, and we can prospectively recruit new patients with follow-up imaging. We want to understand adverse left ventricular remodeling, but the exact study design, timing, primary endpoint, and role of each imaging modality are not decided.",
    french: "Nous disposons de données historiques d’IRM cardiaque et d’échocardiographie provenant de patients suivis après un premier infarctus du myocarde, et nous pouvons recruter prospectivement de nouveaux patients avec une imagerie de suivi. Nous souhaitons comprendre le remodelage défavorable du ventricule gauche, mais la conception exacte de l’étude, le calendrier, le critère d’évaluation principal et le rôle de chaque modalité d’imagerie ne sont pas décidés.",
    rows: [
      ["candidate:objective-comprendre-remodelage-vg-defavorable", "OBJECTIVE", "Comprendre le remodelage défavorable du ventricule gauche", "KNOWN", "We want to understand adverse left ventricular remodeling,"],
      ["candidate:uncertainty-conception-etude", "UNCERTAINTY", "La conception exacte de l’étude n’est pas décidée", "UNKNOWN", "but the exact study design,"],
      ["candidate:uncertainty-calendrier", "UNCERTAINTY", "Le calendrier exact n’est pas décidé", "UNKNOWN", "timing,"],
      ["candidate:uncertainty-critere-principal", "UNCERTAINTY", "Le critère d’évaluation principal n’est pas décidé", "UNKNOWN", "primary endpoint,"],
      ["candidate:uncertainty-role-modalites-imagerie", "UNCERTAINTY", "Le rôle de chaque modalité d’imagerie n’est pas décidé", "UNKNOWN", "and role of each imaging modality are not decided."],
    ],
  },
  {
    id: "B",
    source: "We want to conduct a multicenter randomized study comparing two management strategies after an acute cardiovascular event. Imaging will be used to characterize remodeling and may contribute to the principal evaluation, but the exact endpoint hierarchy, follow-up strategy, and analysis plan are not yet fixed.",
    french: "Nous souhaitons mener une étude randomisée multicentrique comparant deux stratégies de prise en charge après un événement cardiovasculaire aigu. L’imagerie sera utilisée pour caractériser le remodelage et pourrait contribuer à l’évaluation principale, mais la hiérarchie exacte des critères d’évaluation, la stratégie de suivi et le plan d’analyse ne sont pas encore fixés.",
    rows: [
      ["candidate:management-strategy-1", "INTERVENTION", "Première stratégie de prise en charge, identité précise non fournie", "UNKNOWN", "We want to conduct a multicenter randomized study comparing two management strategies after an acute cardiovascular event."],
      ["candidate:management-strategy-2", "INTERVENTION", "Deuxième stratégie de prise en charge, identité précise non fournie", "UNKNOWN", "We want to conduct a multicenter randomized study comparing two management strategies after an acute cardiovascular event."],
      ["candidate:imaging-principal-evaluation-uncertainty", "UNCERTAINTY", "Contribution possible de l'imagerie à l'évaluation principale, non fixée", "UNKNOWN", "Imaging will be used to characterize remodeling and may contribute to the principal evaluation,"],
      ["candidate:endpoint-hierarchy-uncertainty", "UNCERTAINTY", "Hiérarchie exacte des critères d'évaluation non fixée", "UNKNOWN", "but the exact endpoint hierarchy,"],
      ["candidate:follow-up-strategy-uncertainty", "UNCERTAINTY", "Stratégie de suivi non fixée", "UNKNOWN", "follow-up strategy,"],
      ["candidate:analysis-plan-uncertainty", "UNCERTAINTY", "Plan d'analyse non fixé", "UNKNOWN", "and analysis plan are not yet fixed."],
    ],
    comparison: ["candidate:management-strategy-1", "candidate:management-strategy-2"],
  },
  {
    id: "C",
    source: "We have developed an automated quantitative measurement of myocardial fibrosis from late-gadolinium-enhancement cardiac MRI. We want to validate it across several centers against expert manual assessment, but we have not yet decided the exact validation framework or primary performance endpoint.",
    french: "Nous avons développé une mesure quantitative automatisée de la fibrose myocardique à partir d’une IRM cardiaque avec rehaussement tardif au gadolinium. Nous souhaitons la valider dans plusieurs centres par rapport à une évaluation manuelle réalisée par des experts, mais nous n’avons pas encore décidé du cadre exact de validation ni du critère principal de performance.",
    rows: [
      ["cand-objective-multicenter-validation", "OBJECTIVE", "Valider dans plusieurs centres la mesure quantitative automatisée de la fibrose myocardique par rapport à une évaluation manuelle experte", "KNOWN", "We want to validate it across several centers against expert manual assessment,"],
      ["cand-uncertainty-validation-framework", "UNCERTAINTY", "Le cadre exact de validation reste à définir.", "UNKNOWN", "but we have not yet decided the exact validation framework or primary performance endpoint."],
      ["cand-uncertainty-primary-performance-endpoint", "UNCERTAINTY", "Le critère principal de performance reste à définir.", "UNKNOWN", "but we have not yet decided the exact validation framework or primary performance endpoint."],
    ],
  },
  {
    id: "D",
    source: "We want to build a prospective multicenter study using quantitative cardiac MRI across different manufacturers, field strengths and software versions. The aim is to compare a disease population with a reference population. A central Core Lab is planned, but acquisition harmonization, quality control, reader organization and analysis strategy are not yet fixed.",
    french: "Nous souhaitons mettre en place une étude prospective multicentrique utilisant l’IRM cardiaque quantitative avec différents fabricants, intensités de champ et versions logicielles. L’objectif est de comparer une population atteinte d’une maladie à une population de référence. Un Core Lab central est prévu, mais l’harmonisation des acquisitions, le contrôle qualité, l’organisation des lecteurs et la stratégie d’analyse ne sont pas encore définis.",
    rows: [
      ["cand-objective-compare-disease-and-reference-populations", "OBJECTIVE", "Comparer une population atteinte d’une maladie à une population de référence", "UNKNOWN", "The aim is to compare a disease population with a reference population."],
      ["cand-project-info-central-core-lab", "PROJECT_INFORMATION", "Core Lab central prévu", "KNOWN", "A central Core Lab is planned,"],
      ["cand-uncertainty-reader-organization", "UNCERTAINTY", "L’organisation des lecteurs n’est pas encore définie", "UNKNOWN", "reader organization and analysis strategy are not yet fixed."],
      ["cand-uncertainty-analysis-strategy", "UNCERTAINTY", "La stratégie d’analyse n’est pas encore définie", "UNKNOWN", "reader organization and analysis strategy are not yet fixed."],
    ],
  },
];

const THROMBUS_SOURCE = "je souhaite étudier les thrombus intraventriculaires gauches post IDM. ils sont souvent ratés a l'échographies et plus visibles à l'IRM. je voudrais donc faire un double protocole. évaluer le nombre de thrombus manqués à l'écho et detectés à l'IRM et évaluer le devenir clinique des patientss atteints de thrombus intra VG. pour cela nous allons nous concentrer sur les sus décalage ST antérieur";
const THROMBUS_ROWS: readonly Row[] = [
  ["objective:detection", "OBJECTIVE", "Évaluer les thrombus manqués à l’échographie et détectés à l’IRM", "KNOWN", "évaluer le nombre de thrombus manqués à l'écho et detectés à l'IRM"],
  ["objective:clinical-outcome", "OBJECTIVE", "Évaluer le devenir clinique des patients atteints de thrombus intra-VG", "KNOWN", "évaluer le devenir clinique des patientss atteints de thrombus intra VG"],
  ["population:anterior-st-elevation", "POPULATION", "Patients avec sus-décalage ST antérieur", "KNOWN", "sus décalage ST antérieur"],
];

const wireFromRows = (rows: readonly Row[]): PersistentProjectDeltaWireCandidate => ({
  changes: rows.map(([candidateRef, proposedType, content, epistemicState, sourceText]) => ({
    operation: "ADD", candidateRef, semanticIdentity: candidateRef, proposedType, content, sourceText,
    polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState, assertionKind: "USER_STATED", evidenceRefs: [],
  })),
  relations: [], temporalQualifications: [], expectedVariableOccasions: [],
});

const prepared = (id: string, source: string, wire: PersistentProjectDeltaWireCandidate, current: ResearchProjectOwnerProjection | null = null) => {
  const sourceTurnRef = `pass3a:local-fixture:${id}`;
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${id}`, language: "fr", turns: [{ turnId: sourceTurnRef, role: "USER", content: source, createdAt: AT }],
  };
  const checked = validatePersistentProjectDelta(wire, source, current, conversation);
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.validation.valid).toBe(true);
  expect(checked.candidate).not.toBeNull();
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: current, createdAt: AT });
  expect(contribution).not.toBeNull();
  const candidate = prepareResearchProjectContributionCandidate(contribution!, current);
  expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
  return { sourceTurnRef, sourceText: source, currentProject: current, candidate, validation: checked.validation, contribution: contribution! };
};

const historicalFixture = (id: string) => {
  const source = HISTORICAL_CASES.find((item) => item.id === id)!;
  const wire = wireFromRows(source.rows);
  if (source.comparison) wire.relations = [{
    relationRef: "relation:management-strategy-comparison", sourceText: source.source.split(".")[0] + ".",
    relationType: "COMPARES_WITH", sourceObjectRef: source.comparison[0], targetObjectRef: source.comparison[1],
    polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
  }];
  return { ...prepared(id, source.source, wire), sourceText: source.french };
};

const checkNavigation = (input: Parameters<typeof buildCurrentTurnNavigation>[0]) => {
  const result = buildCurrentTurnNavigation(input);
  expect(validateNavigationSelection(result.selection)).toMatchObject({ valid: true, issues: [] });
  expect(result.candidateAdopted).toBe(false);
  expect(result.envelope.projectWriteAuthorized).toBe(false);
  return result;
};

const adopt = (fixture: ReturnType<typeof prepared>) => confirmResearchProjectContribution({
  contribution: fixture.contribution, current: fixture.currentProject,
  projectId: fixture.currentProject?.projectId ?? "project:pass3a-current-navigation",
  authority: { actorRef: "test:researcher", mandateRef: "PROJECT_OWNER", authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED" },
  confirmedAt: AT,
});

const adoptedBase = () => adopt(prepared("adopted-base", "Nous souhaitons étudier le phénomène alpha.", wireFromRows([
  ["objective:alpha", "OBJECTIVE", "Étudier le phénomène alpha", "KNOWN", "étudier le phénomène alpha"],
])));

const governedInput = (project: ResearchProjectOwnerProjection, comparison = false) => {
  const selection = selectNextAction(makeContext(comparison ? TWO_OPTIONS_STATE : USER_UNKNOWN_STATE, {
    projectRef: project.projectId, projectVersion: project.versionId,
  }));
  expect(validateNavigationSelection(selection).valid).toBe(true);
  const selected = selection.selected!;
  const currentNavigation: CurrentGovernedNavigationInput = {
    projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
    selectedActionRef: selected.candidateId, sourceStateDigest: selection.context.sourceStateDigest, selected,
    authorizedContent: [{ ref: selected.targetRef, text: selected.explanation, status: "UNKNOWN" }],
    alreadyProvidedInformationRefs: [],
  };
  const interaction: ScientificInterpretationConversation["interactionContext"] = {
    interactionRef: "interaction:current", sourceActionRef: selected.candidateId, owner: "QUERY_NAVIGATION", purpose: selected.explanation,
    expectedResponseKind: "QRY_INFORMATION_RESPONSE", targetRefs: [selected.targetRef], informationNeedRefs: selected.navigationNeedRefs,
    projectRef: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
  };
  return { currentNavigation, interaction };
};

describe("PASS3A — current-turn navigation, exact input reuse without provider replay", () => {
  it.each(["A", "B", "C", "D"])("routes validated typed evidence from historical %s without adopting or turning UNKNOWN into ASK", (id) => {
    const fixture = historicalFixture(id);
    const before = JSON.stringify(fixture.candidate);
    const result = checkNavigation(fixture);
    expect(result.candidateRef).toBe(fixture.candidate.contributionRef);
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.targetRefs.length).toBeGreaterThan(0);
    expect(result.envelope.sourceTurnRef).toBe(fixture.sourceTurnRef);
    expect(result.selection.selected!.sourceRefs).toEqual(expect.arrayContaining([fixture.sourceTurnRef, fixture.candidate.contributionRef]));
    expect(result.envelope.projectBinding).toBeNull();
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
    expect(JSON.stringify(fixture.candidate)).toBe(before);
  });

  it("produces context-specific purposes A–D without requiring four different action categories", () => {
    const results = ["A", "B", "C", "D"].map((id) => checkNavigation(historicalFixture(id)));
    expect(new Set(results.map((result) => result.envelope.purpose)).size).toBe(4);
    expect(new Set(results.map((result) => result.envelope.whatRef)).size).toBe(4);
    expect(results.every((result) => result.envelope.action === "PROPOSE")).toBe(true);
  });

  it("uses the exact thrombus source and structures its two represented objectives without inventing endpoints", () => {
    const fixture = prepared("thrombus-t1", THROMBUS_SOURCE, wireFromRows(THROMBUS_ROWS));
    const result = checkNavigation(fixture);
    expect(result.envelope.authorizedContent.map((item) => item.text)).toEqual(THROMBUS_ROWS.slice(0, 2).map((item) => item[2]));
    expect(result.envelope.targetRefs).toHaveLength(2);
    expect(result.envelope.purpose).not.toContain("critère principal");
    expect(result.envelope.authorizedContent.some((item) => item.text === THROMBUS_SOURCE)).toBe(false);
    expect(fixture.candidate.canonicalChangeSet.objectChanges).toHaveLength(3);
  });

  it("keeps the thrombus proposal non-adopted when a second turn asks only for an explanation", () => {
    const first = prepared("thrombus-t1", THROMBUS_SOURCE, wireFromRows(THROMBUS_ROWS));
    checkNavigation(first);
    const before = JSON.stringify(first.candidate);
    const second = checkNavigation({ sourceTurnRef: "thrombus:t2", sourceText: "Explique pourquoi ces deux objectifs sont à distinguer sans les adopter.", candidate: null, validation: null, currentProject: null, requestKind: "USER_TURN" });
    expect(second.envelope.action).toBe("RESPOND");
    expect(second.candidateRef).toBeNull();
    expect(JSON.stringify(first.candidate)).toBe(before);
  });

  it("supports the same typed objective structure outside imaging", () => {
    const raw = "Nous souhaitons évaluer la stabilité d’un échantillon biologique pendant son stockage. Le plan d’analyse reste à définir.";
    const result = checkNavigation(prepared("non-imaging", raw, wireFromRows([
      ["objective:sample-stability", "OBJECTIVE", "Évaluer la stabilité d’un échantillon biologique pendant son stockage", "KNOWN", "évaluer la stabilité d’un échantillon biologique pendant son stockage"],
      ["unknown:analysis", "UNCERTAINTY", "Le plan d’analyse reste à définir", "UNKNOWN", "Le plan d’analyse reste à définir"],
    ])));
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.purpose).toContain("stabilité");
    expect(JSON.stringify(result.envelope)).not.toMatch(/IRM|cardiaque|ventricule/iu);
  });

  it.each(["UNKNOWN", "WITHHELD"] as const)("preserves %s without deriving a question from that status alone", (state) => {
    const raw = "La méthode de mesure n’est pas fournie.";
    const fixture = prepared(`state:${state}`, raw, wireFromRows([["context:method", "PROJECT_INFORMATION", "Méthode de mesure non fournie", state, raw]]));
    const result = checkNavigation(fixture);
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.authorizedContent[0].status).toBe(state);
  });

  it("keeps known objective information available instead of selecting it as a question", () => {
    const fixture = historicalFixture("A");
    const result = checkNavigation(fixture);
    const known = fixture.candidate.canonicalChangeSet.objectChanges.find((item) => item.candidate?.objectType === "OBJECTIVE")!;
    expect(result.envelope.alreadyProvidedInformationRefs).toContain(known.objectId);
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
  });

  it("leaves a pure comparison request conversational with no fabricated candidate", () => {
    const result = checkNavigation({ sourceTurnRef: "comparison:only", sourceText: "Explique la différence entre une cohorte et un essai sans construire d’étude.", candidate: null, validation: null, currentProject: null });
    expect(result.envelope.action).toBe("RESPOND");
    expect(result.candidateRef).toBeNull();
  });

  it("distinguishes a USER_TURN asking why from explicit POST_ADOPTION continuation", () => {
    const project = adoptedBase();
    const governed = governedInput(project);
    const base = { sourceTurnRef: "post:current", sourceText: "Pourquoi cette question ?", currentProject: project, candidate: null, validation: null, ...governed };
    const explanation = checkNavigation({ ...base, requestKind: "USER_TURN" });
    const continuation = checkNavigation({ ...base, requestKind: "POST_ADOPTION_QRY_CONTINUATION" });
    expect(explanation.envelope.action).toBe("RESPOND");
    expect(explanation.envelope.selectedInformationNeedRef).toBeNull();
    expect(continuation.envelope.action).toBe("ASK_QUESTION");
    expect(continuation.envelope.selectedInformationNeedRef).toBe(governed.currentNavigation.selected.navigationNeedRefs[0]);
  });

  it("preserves native QRY COMPARE_OPTIONS and its alternatives rather than rewriting it as ASK", () => {
    const project = adoptedBase();
    const governed = governedInput(project, true);
    const result = checkNavigation({ sourceTurnRef: "post:compare", sourceText: "Continuer après adoption.", currentProject: project, candidate: null, validation: null, requestKind: "POST_ADOPTION_QRY_CONTINUATION", ...governed });
    expect(result.selection.selected).toEqual(governed.currentNavigation.selected);
    expect(result.envelope.actionCategory).toBe("COMPARE_OPTIONS");
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.targetRefs).toEqual(expect.arrayContaining(governed.currentNavigation.selected.knownOptionRefs));
  });

  it("does not ask a governed need already explicitly answered", () => {
    const project = adoptedBase();
    const governed = governedInput(project);
    governed.currentNavigation = { ...governed.currentNavigation, alreadyProvidedInformationRefs: [...governed.currentNavigation.selected.navigationNeedRefs] };
    const result = checkNavigation({ sourceTurnRef: "post:known", sourceText: "Ce point est déjà fourni.", currentProject: project, candidate: null, validation: null, requestKind: "POST_ADOPTION_QRY_CONTINUATION", ...governed });
    expect(result.envelope.action).not.toBe("ASK_QUESTION");
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
  });

  it.each(["projectId", "projectVersion", "projectDigest"] as const)("blocks stale/foreign interaction at the %s binding", (field) => {
    const project = adoptedBase();
    const governed = governedInput(project);
    governed.currentNavigation = { ...governed.currentNavigation, [field]: `foreign:${field}` };
    const result = checkNavigation({ sourceTurnRef: "post:stale", sourceText: "Continuer.", currentProject: project, candidate: null, validation: null, requestKind: "POST_ADOPTION_QRY_CONTINUATION", ...governed });
    expect(result.envelope.action).not.toBe("ASK_QUESTION");
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
    expect(result.envelope.targetRefs).not.toContain(governed.currentNavigation.selected.targetRef);
    expect(result.envelope.authorizedContent.some((item) => item.ref === governed.currentNavigation.selected.targetRef)).toBe(false);
  });

  it("does not reuse a candidate from an unrelated turn merely because the base Project version matches", () => {
    const previous = historicalFixture("A");
    const result = checkNavigation({ ...previous, sourceTurnRef: "different:turn", sourceText: "Une autre demande." });
    expect(result.candidateRef).toBeNull();
    expect(result.envelope.candidateRef).toBeNull();
  });

  it("does not use a failed or unvalidated candidate as governed evidence", () => {
    const fixture = historicalFixture("A");
    const result = checkNavigation({ ...fixture, validation: { ...fixture.validation, valid: false, blocks: ["TEST_VALIDATION_BLOCK"] } });
    expect(result.candidateRef).toBeNull();
    expect(result.envelope.action).toBe("RESPOND");
  });

  it("binds a corrective delta to the adopted version without mutating that version", () => {
    const project = adoptedBase();
    const original = project.canonicalState!.objects.find((item) => item.objectType === "OBJECTIVE" && item.actuality === "CURRENT")!;
    const raw = "Remplacer l’objectif alpha par l’objectif bêta.";
    const wire = wireFromRows([["objective:beta", "OBJECTIVE", "Étudier le phénomène bêta", "KNOWN", raw]]);
    wire.changes[0] = { ...wire.changes[0], operation: "REPLACE", targetProjectRef: original.objectId };
    const fixture = prepared("correction:t2", raw, wire, project);
    const before = JSON.stringify(project);
    const result = checkNavigation(fixture);
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.projectBinding!.projectVersion).toBe(project.versionId);
    expect(result.envelope.purpose).toContain("bêta");
    expect(JSON.stringify(project)).toBe(before);
    const refusal = checkNavigation({ sourceTurnRef: "correction:t3", sourceText: "Je refuse cette modification ; conserve l’objectif précédent.", candidate: null, validation: null, currentProject: project });
    expect(refusal.envelope.action).toBe("RESPOND");
    expect(JSON.stringify(project)).toBe(before);
  });

  it("represents a temporal-only delta as a real change, not a zero-change candidate", () => {
    const initial = prepared("temporal:t1", "Une acquisition IRM initiale est prévue.", wireFromRows([
      ["acquisition:initial", "ACQUISITION", "Acquisition IRM initiale", "KNOWN", "Une acquisition IRM initiale est prévue."],
    ]));
    const project = adopt(initial);
    const raw = "L’acquisition IRM initiale est prévue à J7.";
    const wire = wireFromRows([]);
    wire.temporalQualifications = [{
      operation: "ADD", qualificationId: "timing:initial", sourceText: raw, subjectProjectRef: "acquisition:initial",
      temporalRole: "ACQUISITION_TIME", anchor: {
        kind: "TIMEPOINT", direction: "AT", unit: "DAY", offset: 7, lowerBound: 7, upperBound: 7,
        relativeEventLabel: null, tolerance: null,
        reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
      }, assertionKind: "USER_STATED", evidenceRefs: [],
    }];
    const fixture = prepared("temporal:t2", raw, wire, project);
    expect(fixture.candidate.canonicalChangeSet.objectChanges).toHaveLength(0);
    expect(fixture.candidate.canonicalChangeSet.temporalQualificationChanges).toHaveLength(1);
    const result = checkNavigation(fixture);
    expect(result.envelope.targetRefs.length).toBeGreaterThan(0);
    expect(result.envelope.targetRefs).toEqual(expect.arrayContaining(fixture.candidate.humanReviewProjection.expectedChangeRefs));
    expect(result.envelope.purpose).not.toContain("0 changements");
    expect(result.envelope.action).toBe("PROPOSE");
  });
});
