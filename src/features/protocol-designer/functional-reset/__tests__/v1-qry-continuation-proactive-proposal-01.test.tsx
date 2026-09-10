import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import {
  buildFunctionalResetQueryNavigation,
  buildFunctionalResetQuerySourceState,
  validateFunctionalResetQueryNavigation,
} from "@/features/query-navigation";
import {
  buildBoundedConversationReferentContext,
  selectBoundedConversationInteraction,
} from "@/features/query-navigation/current-navigation-evidence";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import {
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
  adoptBehaviorContribution,
} from "./p1-behavior-01a-contract-fixtures";
import {
  createFunctionalResetSession,
  FUNCTIONAL_RESET_STORAGE_KEY,
  persistFunctionalResetSession,
  type FunctionalResetSession,
} from "../session";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.request };
});

const HUMAN_POPULATION_RESPONSE = "alors on va prendre une population de primo infarctus (en gardant a l'esprit qu'il peut y avoir des gens qui ont eu des épisodes sans avoir consulté). la tranche d'âge ca va etre 35/85, les critères c'est le tout venant. Bien sur les criteres d'exclusion sont les personnes qui ont des contre indication a l'irm cardiaque (produit de contraste) et qui ont deja eu des problemes coronariens. on exclus également toutes les population sensible et si tu vois. des choses a ajouter on en discute";

const populationContribution = (input: { exclusionKnown?: boolean; vulnerableText?: string } = {}) => {
  const turn = behaviorTurn("turn:v1-qcp:population", HUMAN_POPULATION_RESPONSE);
  return behaviorContribution({
    contributionId: `contribution:v1-qcp:population:${input.exclusionKnown === false ? "unknown" : "known"}:${input.vulnerableText ?? "base"}`,
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "condition:v1-qcp:idm", proposedType: "CONDITION", content: "Primo-infarctus du myocarde", turnId: turn.turnId }),
      // Reproduce the observed provider atomization: only the upper bound is
      // carried locally, while the exact source turn still contains 35/85.
      behaviorItem({ itemId: "criterion:v1-qcp:age-max", semanticIdentity: "population-age-upper-bound", proposedType: "ELIGIBILITY_CRITERION", content: "85 ans", turnId: turn.turnId, sourceText: null }),
      behaviorItem({ itemId: "criterion:v1-qcp:all-comers", proposedType: "ELIGIBILITY_CRITERION", content: "Tout venant", turnId: turn.turnId }),
      ...(input.exclusionKnown === false ? [] : [
        behaviorItem({ itemId: "criterion:v1-qcp:mri", proposedType: "EXCLUSION_CRITERION", content: "Contre-indication à l’IRM cardiaque ou au produit de contraste", turnId: turn.turnId }),
        behaviorItem({ itemId: "criterion:v1-qcp:coronary", proposedType: "EXCLUSION_CRITERION", content: "Antécédent coronarien", turnId: turn.turnId }),
        behaviorItem({
          itemId: "criterion:v1-qcp:vulnerable",
          proposedType: "ELIGIBILITY_CRITERION",
          content: input.vulnerableText ?? "Exclure les populations sensibles",
          sourceText: input.vulnerableText ?? "Exclure les populations sensibles",
          turnId: turn.turnId,
        }),
      ]),
    ],
    unknowns: input.exclusionKnown === false ? [behaviorItem({
      itemId: "unknown:v1-qcp:exclusion",
      proposedType: "UNKNOWN",
      content: "Critères d’exclusion non encore connus",
      turnId: turn.turnId,
      epistemicState: "UNKNOWN",
    })] : [],
  });
};

const completePreAnalysisProject = () => {
  const turn = behaviorTurn("turn:v1-qcp:complete", "Projet confirmé prêt pour la planification analytique.");
  const contribution = behaviorContribution({
    contributionId: "contribution:v1-qcp:complete",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "question:v1-qcp", proposedType: "SCIENTIFIC_QUESTION", content: "Quel est l’effet de la stratégie sur le critère principal ?", turnId: turn.turnId }),
      behaviorItem({ itemId: "objective:v1-qcp", proposedType: "OBJECTIVE", content: "Comparer le critère principal entre les groupes", studyRole: "PRIMARY", turnId: turn.turnId }),
      behaviorItem({ itemId: "design:v1-qcp", proposedType: "STUDY_DESIGN", content: "Étude comparative prospective", turnId: turn.turnId }),
      behaviorItem({ itemId: "condition:v1-qcp", proposedType: "CONDITION", content: "Condition clinique définie", turnId: turn.turnId }),
      behaviorItem({ itemId: "population:v1-qcp", proposedType: "POPULATION", content: "Population definition : adultes avec condition clinique définie", turnId: turn.turnId }),
      behaviorItem({ itemId: "age:v1-qcp", proposedType: "ELIGIBILITY_CRITERION", content: "Âge minimal : 18 ans", turnId: turn.turnId }),
      behaviorItem({ itemId: "inclusion:v1-qcp", proposedType: "INCLUSION_CRITERION", content: "Inclusion : diagnostic confirmé", turnId: turn.turnId }),
      behaviorItem({ itemId: "exclusion:v1-qcp", proposedType: "EXCLUSION_CRITERION", content: "Exclusion : contre-indication documentée", turnId: turn.turnId }),
      behaviorItem({ itemId: "intervention:v1-qcp", proposedType: "INTERVENTION", content: "Stratégie immédiate", turnId: turn.turnId }),
      behaviorItem({ itemId: "comparator:v1-qcp", proposedType: "COMPARATOR", content: "Stratégie différée", turnId: turn.turnId }),
      behaviorItem({ itemId: "endpoint:v1-qcp", proposedType: "ENDPOINT", content: "Critère principal quantitatif", studyRole: "PRIMARY_ENDPOINT", turnId: turn.turnId }),
      behaviorItem({ itemId: "variable:v1-qcp", proposedType: "CANONICAL_VARIABLE", content: "Mesure quantitative principale", studyRole: "OBSERVABLE_PROPERTY", turnId: turn.turnId }),
      behaviorItem({ itemId: "modality:v1-qcp", proposedType: "MODALITY", content: "IRM", turnId: turn.turnId }),
      behaviorItem({ itemId: "acquisition:v1-qcp", proposedType: "ACQUISITION", content: "Acquisition IRM avec lecture, qualité, comparabilité et faisabilité définies", turnId: turn.turnId }),
      behaviorItem({ itemId: "visit:v1-qcp", proposedType: "VISIT", content: "Visite principale à J30", turnId: turn.turnId }),
    ],
  });
  return adoptBehaviorContribution(contribution, null, 1);
};

const projectBeforePopulation = () => {
  const turn = behaviorTurn("turn:v1-qcp:before-population", "Le cadre scientifique et les méthodes sont confirmés ; la population reste à définir.");
  return adoptBehaviorContribution(behaviorContribution({
    contributionId: "contribution:v1-qcp:before-population",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "question:v1-qcp:before", proposedType: "SCIENTIFIC_QUESTION", content: "Quel est l’effet de la stratégie sur le critère principal ?", turnId: turn.turnId }),
      behaviorItem({ itemId: "design:v1-qcp:before", proposedType: "STUDY_DESIGN", content: "Étude comparative prospective", turnId: turn.turnId }),
      behaviorItem({ itemId: "intervention:v1-qcp:before", proposedType: "INTERVENTION", content: "Stratégie immédiate", turnId: turn.turnId }),
      behaviorItem({ itemId: "comparator:v1-qcp:before", proposedType: "COMPARATOR", content: "Stratégie différée", turnId: turn.turnId }),
      behaviorItem({ itemId: "endpoint:v1-qcp:before", proposedType: "ENDPOINT", content: "Critère principal", studyRole: "PRIMARY_ENDPOINT", turnId: turn.turnId }),
      behaviorItem({ itemId: "modality:v1-qcp:before", proposedType: "MODALITY", content: "IRM", turnId: turn.turnId }),
      behaviorItem({ itemId: "acquisition:v1-qcp:before", proposedType: "ACQUISITION", content: "Acquisition IRM avec rôle, lecture, qualité, comparabilité et faisabilité définis", turnId: turn.turnId }),
      behaviorItem({ itemId: "visit:v1-qcp:before", proposedType: "VISIT", content: "Visite principale à J30", turnId: turn.turnId }),
      behaviorItem({ itemId: "analysis:v1-qcp:before", proposedType: "ANALYSIS_SPECIFICATION", content: "Analyse comparative du critère principal", turnId: turn.turnId }),
    ],
  }), null, 1);
};

const emptyReferent = () => buildBoundedConversationReferentContext({
  retained: [], currentProject: null, conversationId: "conversation:v1-qcp", runtimeTurns: [],
});

describe("V1 QRY continuation and proactive proposal flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockRejectedValue(new Error("PROVIDER_FORBIDDEN_IN_V1_QCP_01"));
  });

  afterEach(cleanup);

  it("QCP01 — recovers both endpoints of a context-bound 35/85 age range without treating arbitrary pairs as age", () => {
    const candidate = prepareResearchProjectContributionCandidate(populationContribution(), null);
    const keys = candidate.proposedSections.find((section) => section.sectionId === "POPULATION")?.elements.map((element) => element.semanticKey) ?? [];
    expect(keys).toEqual(expect.arrayContaining(["POPULATION:ELIGIBILITY:AGE:MIN", "POPULATION:ELIGIBILITY:AGE:MAX"]));
    expect(candidate.proposedSections.find((section) => section.sectionId === "POPULATION")?.elements)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ content: "Âge minimal : 35 ans" }),
        expect.objectContaining({ content: "Âge maximal : 85 ans" }),
      ]));

    const unrelatedTurn = behaviorTurn("turn:v1-qcp:pair", "Le matériau suit une géométrie 35/85 sans information d’âge.");
    const unrelated = prepareResearchProjectContributionCandidate(behaviorContribution({
      contributionId: "contribution:v1-qcp:pair",
      turns: [unrelatedTurn],
      candidateObjects: [behaviorItem({ itemId: "criterion:v1-qcp:pair", proposedType: "ELIGIBILITY_CRITERION", content: "Ratio 35/85", turnId: unrelatedTurn.turnId })],
    }), null);
    expect(unrelated.proposedSections.flatMap((section) => section.elements).map((element) => element.semanticKey))
      .not.toContain("POPULATION:ELIGIBILITY:AGE:MIN");
  });

  it("QCP02-QCP04 — recomputes resolved population facets and keeps a genuinely unknown exclusion open", () => {
    const beforeProject = projectBeforePopulation();
    const beforeNavigation = buildFunctionalResetQueryNavigation({ project: beforeProject, recordedAt: "2026-09-10T11:00:00.000Z" });
    const beforePopulationNeeds = beforeNavigation.currentAction?.navigationNeedRefs.filter((ref) =>
      beforeNavigation.needSections[ref] === "POPULATION") ?? [];
    expect(beforePopulationNeeds.length).toBeGreaterThan(1);

    const complete = adoptBehaviorContribution(populationContribution(), beforeProject, 2);
    const afterNavigation = buildFunctionalResetQueryNavigation({
      project: complete,
      previous: beforeNavigation,
      recordedAt: "2026-09-10T11:01:00.000Z",
    });
    const completeUnknowns = buildFunctionalResetQuerySourceState(complete).projectUnknowns;
    expect(completeUnknowns.some((need) => need.branchRefs.some((ref) => ref.startsWith("project-facet:POPULATION:")))).toBe(false);
    expect(afterNavigation.memory.resolvedNeedRefs).toEqual(expect.arrayContaining(beforePopulationNeeds));
    expect(afterNavigation.standardQuestion?.text ?? "").not.toMatch(/critères d'inclusion et les exclusions|critères d’inclusion et les exclusions/i);

    const partial = adoptBehaviorContribution(populationContribution({ exclusionKnown: false }), null, 3);
    const remaining = buildFunctionalResetQuerySourceState(partial).projectUnknowns
      .filter((need) => need.branchRefs.some((ref) => ref.startsWith("project-facet:POPULATION:")));
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.branchRefs).toEqual(["project-facet:POPULATION:EXCLUSION"]);
    expect(remaining[0]?.intent).toMatch(/exclusions|contre-indications/i);
  });

  it("QCP-sensitive — preserves the controlled vulnerable-population exclusion and only the explicit exception", () => {
    const candidate = prepareResearchProjectContributionCandidate(populationContribution({
      vulnerableText: "Exclure les populations sensibles sauf femmes enceintes",
    }), null);
    const vulnerable = candidate.proposedSections.find((section) => section.sectionId === "POPULATION")?.elements
      .filter((element) => element.semanticKey?.includes("CONTROLLED_VULNERABLE_POPULATION_SET")) ?? [];
    expect(vulnerable).toHaveLength(2);
    expect(vulnerable[0]).toMatchObject({ semanticKey: "POPULATION:ELIGIBILITY:EXCLUSION:CONTROLLED_VULNERABLE_POPULATION_SET" });
    expect(vulnerable[0]?.content).toMatch(/profil réglementaire applicable/i);
    expect(vulnerable[1]?.semanticKey).toMatch(/:EXCEPTION:.*femmes enceintes$/);
    expect(vulnerable[1]?.content).toMatch(/ne vaut pas critère général d’éligibilité/i);
    expect(vulnerable.map((element) => element.content).join(" ")).not.toMatch(/mineur|détenu|incapable/i);
  });

  it.each([
    "fais moi des propositions",
    "donne-moi plutôt deux options",
    "propose-moi ce qu'il manque",
  ])("QCP05-QCP06 — recognizes the explicit assisted-proposal act: %s", (sourceText) => {
    expect(selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext: emptyReferent() }))
      .toMatchObject({ kind: "USER_REQUESTS_ASSISTED_PROPOSAL" });
    expect(selectBoundedConversationInteraction({ sourceText: "oui j'ai compris", correctionMode: false, referentContext: emptyReferent() }))
      .toBeUndefined();
  });

  it("QCP07-QCP08 — QRY selects an existing proposal-capable owner without Project write", () => {
    const project = completePreAnalysisProject();
    const before = JSON.stringify(project);
    const navigation = buildFunctionalResetQueryNavigation({
      project,
      recordedAt: "2026-09-10T12:00:00.000Z",
      forceRebuild: true,
      requestedAction: "ASSISTED_PROPOSAL",
    });
    expect(navigation).toMatchObject({
      status: "OWNER_ACTION_READY",
      currentAction: { owner: "BIOSTATISTICS", projectWriteAuthorized: false },
      selection: { selected: { capabilityRef: "BIOSTATISTICS_PLANNING", projectionOnly: true, projectWriteAuthorized: false } },
    });
    expect(validateFunctionalResetQueryNavigation(navigation)).toBe(true);
    expect(JSON.stringify(project)).toBe(before);
  });

  it("QCP10 — applies the same proposal act to a non-medical material/temperature/geometry project", () => {
    const turn = behaviorTurn("turn:v1-qcp:nonmedical", "Étudier la tenue du matériau alpha à 80 °C ; la géométrie reste à définir.");
    const project = adoptBehaviorContribution(behaviorContribution({
      contributionId: "contribution:v1-qcp:nonmedical",
      turns: [turn],
      candidateObjects: [
        behaviorItem({ itemId: "question:v1-qcp:nonmedical", proposedType: "SCIENTIFIC_QUESTION", content: "Comment le matériau alpha se comporte-t-il à 80 °C ?", turnId: turn.turnId }),
        behaviorItem({ itemId: "objective:v1-qcp:nonmedical", proposedType: "OBJECTIVE", content: "Évaluer la tenue du matériau alpha à 80 °C", turnId: turn.turnId }),
        behaviorItem({ itemId: "material:v1-qcp:nonmedical", proposedType: "PROJECT_INFORMATION", content: "Matériau alpha", turnId: turn.turnId }),
        behaviorItem({ itemId: "temperature:v1-qcp:nonmedical", proposedType: "MEASUREMENT", content: "Température : 80 °C", turnId: turn.turnId }),
      ],
    }), null, 4);
    const navigation = buildFunctionalResetQueryNavigation({
      project,
      recordedAt: "2026-09-10T12:10:00.000Z",
      forceRebuild: true,
      requestedAction: "ASSISTED_PROPOSAL",
    });
    expect(navigation).toMatchObject({
      status: "OWNER_ACTION_READY",
      currentAction: { owner: "STUDY_DESIGN", projectWriteAuthorized: false },
      selection: { selected: { capabilityRef: "STUDY_DESIGN_COHERENCE" } },
    });
  });

  it("QCP07-QCP10 — Standard shows the existing owner proposal for the explicit request, with zero bridge/provider call", async () => {
    const project = completePreAnalysisProject();
    const session = createFunctionalResetSession("2026-09-10T12:00:00.000Z");
    const queryNavigation = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-09-10T12:00:01.000Z" });
    persistFunctionalResetSession(window.localStorage, { ...session, project, queryNavigation });

    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: "fais moi des propositions" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await screen.findByTestId("standard-biostatistics-proposal");
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
      expect(stored.biostatisticsInteraction).toMatchObject({ status: "ACTIVE", projectWriteAuthorized: false });
      expect(stored.project?.versionId).toBe(project.versionId);
      expect(stored.bridgeTraces.at(-1)).toMatchObject({
        requestKind: "POST_ADOPTION_QRY_CONTINUATION",
        provider: "NONE",
        calls: 0,
        continuationPresentationSource: "BIOSTATISTICS_STANDARD_PROJECTION",
      });
    });
    expect(runtime.request).not.toHaveBeenCalled();
    const projectVersionBeforeReview = project.versionId;
    fireEvent.click(within(screen.getByTestId("standard-biostatistics-proposal"))
      .getByRole("button", { name: /Retenir cette stratégie pour revue/i }));
    const review = await screen.findByTestId("functional-contribution-review");
    expect(within(review).getByRole("button", { name: "Cela correspond à mon projet" })).toBeEnabled();
    expect(within(review).getByRole("button", { name: "Décrire une correction" })).toBeEnabled();
    expect(within(review).getByRole("button", { name: "Refuser cette proposition" })).toBeEnabled();
    fireEvent.click(within(review).getByRole("button", { name: "Refuser cette proposition" }));
    await within(review).findByText("Proposition refusée. Le Research Project est inchangé.");
    expect((JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession).project?.versionId)
      .toBe(projectVersionBeforeReview);
    expect(screen.queryByText("J'accuse réception de votre demande.")).toBeNull();
  });
});
