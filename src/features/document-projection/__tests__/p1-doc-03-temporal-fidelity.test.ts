import { describe, expect, it } from "vitest";
import {
  authorizeResearchProjectDocumentHandoff,
  prepareResearchProjectContributionCandidate,
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
  refreshFunctionalResetDocumentPortfolio,
  renderProjection,
} from "..";

const AT = "2026-09-01T12:00:00.000Z";
const TEMPORAL_ENUM = /\b(?:DAYS?|YEARS?|MONTHS?|HOURS?|WEEKS?)\b/;
const ENGLISH_TEMPORAL_QUANTITY = /\b\d+(?:[.,]\d+)?\s+(?:days?|years?|months?|hours?|weeks?)\b/i;

const sourceTurn = behaviorTurn(
  "turn:p1-doc-03:generic-temporal-matrix",
  "Ajouter des acquisitions à 1 jour, 2 jours, 1 an, 3 ans, 1 mois, 6 mois, autour de J7, autour de 6 mois, 2 jours après l’admission, 2 jours avec référentiel inconnu et dans les 48 heures après l’admission ; prévoir aussi une mesure à 3 semaines.",
);

const anchor = (input: {
  unit: string;
  offset: number;
  tolerance?: { lower: number | null; upper: number | null; unit: string } | null;
  reference?: { status: "KNOWN"; referenceProjectRef: string } | { status: "UNKNOWN"; unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" };
}) => ({
  kind: "TIMEPOINT" as const,
  direction: "AFTER" as const,
  unit: input.unit,
  offset: input.offset,
  lowerBound: null,
  upperBound: null,
  relativeEventLabel: null,
  tolerance: input.tolerance ?? null,
  reference: input.reference ?? { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
});

const temporalFixture = () => {
  const acquisitionCases = [
    ["one-day", "Acquisition à un jour", anchor({ unit: "DAYS", offset: 1 })],
    ["two-days", "Acquisition à deux jours", anchor({ unit: "DAYS", offset: 2 })],
    ["one-year", "Acquisition à un an", anchor({ unit: "YEARS", offset: 1 })],
    ["three-years", "Acquisition à trois ans", anchor({ unit: "YEARS", offset: 3 })],
    ["one-month", "Acquisition à un mois", anchor({ unit: "MONTHS", offset: 1 })],
    ["six-months", "Acquisition à six mois", anchor({ unit: "MONTHS", offset: 6 })],
    ["around-day-seven", "Acquisition autour de J7", anchor({ unit: "DAYS", offset: 7, tolerance: { lower: 6, upper: 8, unit: "DAYS" } })],
    ["around-six-months", "Acquisition autour de six mois", anchor({ unit: "MONTHS", offset: 6, tolerance: { lower: 5, upper: 7, unit: "MONTHS" } })],
    ["known-reference", "Acquisition après admission", anchor({ unit: "DAYS", offset: 2, reference: { status: "KNOWN", referenceProjectRef: "event:admission" } })],
    ["unknown-reference", "Acquisition sans référentiel déclaré", anchor({ unit: "DAYS", offset: 2 })],
  ] as const;
  const windowAnchor = {
    kind: "WINDOW" as const,
    direction: "AFTER" as const,
    unit: "HOURS",
    offset: null,
    lowerBound: 0,
    upperBound: 48,
    relativeEventLabel: null,
    tolerance: null,
    reference: { status: "KNOWN" as const, referenceProjectRef: "event:admission" },
  };
  const contribution = behaviorContribution({
    contributionId: "contribution:p1-doc-03:generic-temporal-matrix",
    turns: [sourceTurn],
    candidateObjects: [
      behaviorItem({ itemId: "event:admission", proposedType: "PROJECT_INFORMATION", content: "Admission", turnId: sourceTurn.turnId }),
      ...acquisitionCases.map(([id, content]) => behaviorItem({ itemId: `acquisition:${id}`, proposedType: "ACQUISITION", content, turnId: sourceTurn.turnId })),
      behaviorItem({ itemId: "acquisition:window", proposedType: "ACQUISITION", content: "Acquisition dans les 48 heures", turnId: sourceTurn.turnId }),
      behaviorItem({ itemId: "variable:expected", proposedType: "CANONICAL_VARIABLE", content: "Mesure attendue", turnId: sourceTurn.turnId }),
    ],
  });
  return {
    ...contribution,
    scientificContent: {
      ...contribution.scientificContent,
      temporalQualifications: [
        ...acquisitionCases.map(([id, _content, temporalAnchor]) => ({
          operation: "ADD" as const,
          qualificationId: `timing:${id}`,
          subjectProjectRef: `acquisition:${id}`,
          temporalRole: "ACQUISITION_TIME" as const,
          anchor: temporalAnchor,
          sourceText: sourceTurn.content,
          assertionKind: "USER_STATED" as const,
          evidenceRefs: [],
        })),
        {
          operation: "ADD" as const,
          qualificationId: "timing:window",
          subjectProjectRef: "acquisition:window",
          temporalRole: "ACQUISITION_TIME" as const,
          anchor: windowAnchor,
          sourceText: sourceTurn.content,
          assertionKind: "USER_STATED" as const,
          evidenceRefs: [],
        },
      ],
      expectedVariableOccasions: [{
        operation: "ADD" as const,
        occasionId: "occasion:expected:three-weeks",
        variableProjectRef: "variable:expected",
        anchor: anchor({ unit: "WEEKS", offset: 3 }),
        studyUnitOrGroupRef: null,
        applicableContext: null,
        sourceText: sourceTurn.content,
        assertionKind: "USER_STATED" as const,
        evidenceRefs: [],
      }],
    },
  };
};

const handoffFor = (project: ResearchProjectOwnerProjection) => authorizeResearchProjectDocumentHandoff({
  project,
  authority: behaviorAuthority,
  confirmedAt: AT,
});

const protocolFor = (project: ResearchProjectOwnerProjection) => refreshFunctionalResetDocumentPortfolio({
  project,
  previous: createEmptyFunctionalResetDocumentPortfolio(),
  handoffDecision: handoffFor(project),
  requestedAt: AT,
  generateProtocol: true,
}).projections.at(-1)!;

const temporalPresentation = (project: ResearchProjectOwnerProjection) => buildStandardProtocolPresentation(protocolFor(project))
  .sections.find((section) => section.sectionId === "temporality")!
  .entries.map((entry) => `${entry.label ? `${entry.label} : ` : ""}${entry.value}`)
  .join("\n");

describe("P1-DOC-03 — temporal semantic fidelity", () => {
  it("preserves the structured approximation and source provenance through candidate and adopted Project", () => {
    const contribution = temporalFixture();
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const candidateAnchor = candidate.canonicalChangeSet.temporalQualificationChanges
      .find((change) => change.qualificationId === "timing:around-day-seven")!.candidate!.anchor;

    expect(candidateAnchor).toMatchObject({
      unit: "DAYS",
      offset: 7,
      tolerance: { lower: 6, upper: 8, unit: "DAYS" },
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
      provenance: { sourceText: sourceTurn.content, sourceTurnRefs: [sourceTurn.turnId] },
    });

    const project = adoptBehaviorContribution(contribution, null, 1);
    const adoptedAnchor = project.canonicalState!.temporalQualifications
      .find((qualification) => qualification.qualificationId === "timing:around-day-seven")!.anchor;
    expect(adoptedAnchor).toEqual(candidateAnchor);
  });

  it("renders the generic temporal matrix in natural French in Human Review", () => {
    const review = prepareResearchProjectContributionCandidate(temporalFixture(), null).humanReviewProjection.sections
      .find((section) => section.label === "Temporalité")!
      .items.map((item) => item.content)
      .join("\n");

    expect(review).toMatch(/1 jour/);
    expect(review).toMatch(/2 jours/);
    expect(review).toMatch(/1 an/);
    expect(review).toMatch(/3 ans/);
    expect(review).toMatch(/1 mois/);
    expect(review).toMatch(/6 mois/);
    expect(review).toMatch(/Acquisition autour de J7\s*:\s*autour de (?:J7 \(7 jours\)|7 jours)/i);
    expect(review).toMatch(/Acquisition autour de six mois\s*:\s*autour de (?:M6 \(6 mois\)|6 mois)/i);
    expect(review).toMatch(/2 jours\)?.*après Admission/i);
    expect(review).toMatch(/2 jours\)?.*référentiel à préciser/i);
    expect(review).toMatch(/48 heures.*Admission/i);
    expect(review).toMatch(/3 semaines/i);
    expect(review).not.toMatch(TEMPORAL_ENUM);
    expect(review).not.toMatch(ENGLISH_TEMPORAL_QUANTITY);
  });

  it("keeps the same French temporal semantics in Standard Protocol and HTML", () => {
    const project = adoptBehaviorContribution(temporalFixture(), null, 1);
    const projection = protocolFor(project);
    const standard = temporalPresentation(project);
    const html = renderProjection(projection, "HTML").content;

    expect(standard).toMatch(/Acquisition autour de J7\s+—\s+autour de (?:J7 \(7 jours\)|7 jours)/i);
    expect(standard).toMatch(/Acquisition autour de six mois\s+—\s+autour de (?:M6 \(6 mois\)|6 mois)/i);
    for (const output of [standard, html]) {
      expect(output).toMatch(/1 jour/);
      expect(output).toMatch(/2 jours/);
      expect(output).toMatch(/1 an/);
      expect(output).toMatch(/3 ans/);
      expect(output).toMatch(/1 mois/);
      expect(output).toMatch(/6 mois/);
      expect(output).toMatch(/autour de (?:J7 \(7 jours\)|7 jours)/i);
      expect(output).toMatch(/autour de (?:M6 \(6 mois\)|6 mois)/i);
      expect(output).toMatch(/2 jours\)?.*après Admission/i);
      expect(output).toMatch(/2 jours\)?.*référentiel à préciser/i);
      expect(output).toMatch(/48 heures.*Admission/i);
      expect(output).toMatch(/3 semaines/i);
      expect(output).not.toMatch(TEMPORAL_ENUM);
      expect(output).not.toMatch(ENGLISH_TEMPORAL_QUANTITY);
      expect(output).not.toMatch(/Acquisition autour de J7\s+—\s+à\s+(?:J7|7 jours)/i);
      expect(output).not.toMatch(/Acquisition autour de six mois\s+—\s+à\s+(?:M6|6 mois)/i);
    }
  });
});
