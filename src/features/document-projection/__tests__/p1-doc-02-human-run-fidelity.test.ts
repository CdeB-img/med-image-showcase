import { describe, expect, it } from "vitest";
import {
  authorizeResearchProjectDocumentHandoff,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  adoptBehaviorContribution,
  behaviorAuthority,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import {
  buildStandardProtocolPresentation,
  createEmptyFunctionalResetDocumentPortfolio,
  functionalProtocolProjection,
  projectDocumentSourceFromFunctionalProject,
  refreshFunctionalResetDocumentPortfolio,
  renderProjection,
} from "..";

const AT = "2026-09-01T10:00:00.000Z";
const baseTurn = behaviorTurn(
  "turn:p1-doc-02:base",
  "Construire un projet générique avec deux objectifs adoptés, sans formuler encore la question scientifique.",
);

const item = (itemId: string, proposedType: string, content: string, studyRole: string | null = null) =>
  behaviorItem({ itemId, proposedType, content, studyRole, turnId: baseTurn.turnId });

const questionlessProject = () => adoptBehaviorContribution(behaviorContribution({
  contributionId: "contribution:p1-doc-02:base:v1",
  turns: [baseTurn],
  candidateObjects: [
    item("objective:effect", "OBJECTIVE", "Estimer l’effet de l’exposition E sur la réponse R", "PRIMARY_OBJECTIVE"),
    item("objective:feasibility", "OBJECTIVE", "Décrire la faisabilité du recueil multimodal", "SECONDARY_OBJECTIVE"),
    item("population:generic", "POPULATION", "Participants appartenant à la population P"),
  ],
}), null, 1);

const handoffFor = (project: ResearchProjectOwnerProjection, at = AT) => authorizeResearchProjectDocumentHandoff({
  project,
  authority: behaviorAuthority,
  confirmedAt: at,
});

const projectProtocol = (project: ResearchProjectOwnerProjection, requestedAt = AT) => refreshFunctionalResetDocumentPortfolio({
  project,
  previous: createEmptyFunctionalResetDocumentPortfolio(),
  handoffDecision: handoffFor(project, requestedAt),
  requestedAt,
  generateProtocol: true,
});

const sectionValues = (presentation: ReturnType<typeof buildStandardProtocolPresentation>, sectionId: string) => presentation.sections
  .find((section) => section.sectionId === sectionId)?.entries.map((entry) => `${entry.label ? `${entry.label} : ` : ""}${entry.value}`) ?? [];

const temporalContribution = (current: ResearchProjectOwnerProjection) => {
  const temporalTurn = behaviorTurn(
    "turn:p1-doc-02:temporal",
    "Ajouter une échocardiographie dans les 24 heures suivant l’admission, une IRM entre J3 et J5 et un suivi clinique à six mois ; les deux derniers référentiels restent à préciser.",
  );
  const contribution = behaviorContribution({
    contributionId: "contribution:p1-doc-02:temporal:v2",
    previousContributionId: current.contributionRef,
    turns: [temporalTurn],
    candidateObjects: [
      behaviorItem({ itemId: "event:admission", proposedType: "PROJECT_INFORMATION", content: "Admission", turnId: temporalTurn.turnId }),
      behaviorItem({ itemId: "acquisition:echo", proposedType: "ACQUISITION", content: "Échocardiographie", turnId: temporalTurn.turnId }),
      behaviorItem({ itemId: "acquisition:mri", proposedType: "ACQUISITION", content: "IRM", turnId: temporalTurn.turnId }),
      behaviorItem({ itemId: "variable:clinical-follow-up", proposedType: "CANONICAL_VARIABLE", content: "Suivi clinique", turnId: temporalTurn.turnId }),
    ],
  });
  return {
    ...contribution,
    scientificContent: {
      ...contribution.scientificContent,
      temporalQualifications: [
        {
          operation: "ADD" as const,
          qualificationId: "timing:echo:admission",
          subjectProjectRef: "acquisition:echo",
          temporalRole: "ACQUISITION_TIME" as const,
          anchor: {
            kind: "WINDOW" as const,
            direction: "AFTER" as const,
            unit: "HOUR",
            offset: null,
            lowerBound: 0,
            upperBound: 24,
            relativeEventLabel: null,
            tolerance: null,
            reference: { status: "KNOWN" as const, referenceProjectRef: "event:admission" },
          },
          sourceText: temporalTurn.content,
          assertionKind: "USER_STATED" as const,
          evidenceRefs: [],
        },
        {
          operation: "ADD" as const,
          qualificationId: "timing:mri:window",
          subjectProjectRef: "acquisition:mri",
          temporalRole: "ACQUISITION_TIME" as const,
          anchor: {
            kind: "WINDOW" as const,
            direction: "AFTER" as const,
            unit: "DAY",
            offset: null,
            lowerBound: 3,
            upperBound: 5,
            relativeEventLabel: null,
            tolerance: null,
            reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
          },
          sourceText: temporalTurn.content,
          assertionKind: "USER_STATED" as const,
          evidenceRefs: [],
        },
      ],
      expectedVariableOccasions: [{
        operation: "ADD" as const,
        occasionId: "occasion:clinical-follow-up:six-months",
        variableProjectRef: "variable:clinical-follow-up",
        anchor: {
          kind: "TIMEPOINT" as const,
          direction: "AFTER" as const,
          unit: "MONTH",
          offset: 6,
          lowerBound: null,
          upperBound: null,
          relativeEventLabel: null,
          tolerance: null,
          reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
        },
        studyUnitOrGroupRef: null,
        applicableContext: null,
        sourceText: temporalTurn.content,
        assertionKind: "USER_STATED" as const,
        evidenceRefs: [],
      }],
    },
  };
};

describe("P1-DOC-02 — human-run document fidelity", () => {
  it("keeps an absent Project question unresolved while projecting every adopted objective", () => {
    const project = questionlessProject();
    const source = projectDocumentSourceFromFunctionalProject(project, handoffFor(project));
    const portfolio = projectProtocol(project);
    const projection = portfolio.projections.at(-1)!;
    const presentation = buildStandardProtocolPresentation(projection);
    const html = renderProjection(projection, "HTML").content;

    expect(source.scientificQuestion.text).toBe("");
    expect(sectionValues(presentation, "question")).toEqual([]);
    expect(presentation.sections.find((section) => section.sectionId === "question")?.completeness).toBe("MISSING");
    expect(sectionValues(presentation, "objectives")).toHaveLength(2);
    expect(presentation.openItems.map((openItem) => openItem.label)).toContain("Question scientifique");
    expect(presentation.openItems.map((openItem) => openItem.label)).not.toContain("Objectifs");
    expect(html).toContain("Question scientifique");
    expect(html).toContain("À préciser.");
    expect(html).toContain("Estimer l’effet de l’exposition E sur la réponse R");
    expect(html).toContain("Décrire la faisabilité du recueil multimodal");
  });

  it("renders structured temporal semantics naturally without leaking internal enums", () => {
    const projectV1 = questionlessProject();
    const projectV2 = adoptBehaviorContribution(temporalContribution(projectV1), projectV1, 2);
    const projection = projectProtocol(projectV2, "2026-09-01T10:02:00.000Z").projections.at(-1)!;
    const presentation = buildStandardProtocolPresentation(projection);
    const temporal = sectionValues(presentation, "temporality").join(" ");
    const html = renderProjection(projection, "HTML").content;

    expect(temporal).toMatch(/Échocardiographie/i);
    expect(temporal).toMatch(/24 heures/i);
    expect(temporal).toMatch(/Admission/i);
    expect(temporal).toMatch(/IRM/i);
    expect(temporal).toMatch(/J3/i);
    expect(temporal).toMatch(/J5/i);
    expect(temporal).toMatch(/Suivi clinique/i);
    expect(temporal).toMatch(/6 mois/i);
    expect(temporal).toMatch(/référentiel à préciser/i);
    expect(temporal).not.toMatch(/ACQUISITION_TIME|EXPECTED_AT|SINGLE_ASSESSMENT|SCIENTIFIC_WINDOW_TO_DEFINE|OPERATIONAL_WINDOW_FUTURE|\bMONTH\b|référence inconnue/i);
    expect(html).toMatch(/Échocardiographie/i);
    expect(html).toMatch(/24 heures/i);
    expect(html).toMatch(/Admission/i);
    expect(html).toMatch(/IRM/i);
    expect(html).toMatch(/J3/i);
    expect(html).toMatch(/J5/i);
    expect(html).toMatch(/Suivi clinique/i);
    expect(html).toMatch(/6 mois/i);
    expect(html).toMatch(/référentiel à préciser/i);
    expect(html).not.toMatch(/ACQUISITION_TIME|EXPECTED_AT|SINGLE_ASSESSMENT|SCIENTIFIC_WINDOW_TO_DEFINE|OPERATIONAL_WINDOW_FUTURE|\bMONTH\b|référence inconnue/i);
  });

  it("keeps stale P1 immutable and creates a distinct P2 only on explicit regeneration", () => {
    const projectV1 = questionlessProject();
    const portfolioV1 = projectProtocol(projectV1);
    const p1 = portfolioV1.projections.at(-1)!;
    const p1Before = JSON.stringify(p1);
    const p1TemporalBefore = sectionValues(buildStandardProtocolPresentation(p1), "temporality");
    const projectV2 = adoptBehaviorContribution(temporalContribution(projectV1), projectV1, 2);

    const stale = refreshFunctionalResetDocumentPortfolio({
      project: projectV2,
      previous: portfolioV1,
      requestedAt: "2026-09-01T10:01:00.000Z",
    });
    const staleCard = stale.cards.find((card) => card.kind === "PROTOCOL")!;
    const historicalP1 = functionalProtocolProjection(stale, staleCard.projectionId);

    expect(staleCard.freshness).toBe("STALE");
    expect(historicalP1).toBe(p1);
    expect(historicalP1?.source.projectVersion).toBe(projectV1.versionId);
    expect(JSON.stringify(historicalP1)).toBe(p1Before);
    expect(historicalP1?.projectionDigest).toBe(p1.projectionDigest);
    expect(sectionValues(buildStandardProtocolPresentation(historicalP1!), "temporality")).toEqual(p1TemporalBefore);
    expect(p1TemporalBefore).toEqual([]);

    const regenerated = refreshFunctionalResetDocumentPortfolio({
      project: projectV2,
      previous: stale,
      handoffDecision: handoffFor(projectV2, "2026-09-01T10:02:00.000Z"),
      requestedAt: "2026-09-01T10:02:00.000Z",
      generateProtocol: true,
    });
    const p2 = regenerated.projections.at(-1)!;

    expect(regenerated.projections).toHaveLength(2);
    expect(regenerated.projections[0]).toBe(p1);
    expect(JSON.stringify(regenerated.projections[0])).toBe(p1Before);
    expect(p2.projectionId).not.toBe(p1.projectionId);
    expect(p2.priorProjectionId).toBe(p1.projectionId);
    expect(p2.source.projectVersion).toBe(projectV2.versionId);
    expect(sectionValues(buildStandardProtocolPresentation(p2), "temporality").join(" ")).toMatch(/IRM/i);
  });
});
