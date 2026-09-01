import { describe, expect, it } from "vitest";
import {
  authorizeResearchProjectDocumentHandoff,
  ensureCanonicalProjectState,
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

const AT = "2026-09-02T08:00:00.000Z";
const ACQUISITION_REF = "acquisition:assessment-initial";
const ACQUISITION_TIMING_REF = "timing:assessment-initial";
const FOLLOW_UP_REF = "VISIT:suivi clinique 6 mois";

const temporalAnchor = (lowerBound: number, upperBound: number) => ({
  kind: lowerBound === upperBound ? "TIMEPOINT" as const : "WINDOW" as const,
  direction: "AT" as const,
  unit: "DAY",
  offset: lowerBound === upperBound ? lowerBound : null,
  lowerBound,
  upperBound,
  relativeEventLabel: null,
  tolerance: null,
  reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
});

const initialProject = () => {
  const turn = behaviorTurn("turn:p1-doc-04:v1", "Prévoir une évaluation d'imagerie initiale à J7.");
  const contribution = behaviorContribution({
    contributionId: "contribution:p1-doc-04:v1",
    turns: [turn],
    candidateObjects: [behaviorItem({
      itemId: ACQUISITION_REF,
      proposedType: "ACQUISITION",
      content: "Évaluation d'imagerie initiale",
      turnId: turn.turnId,
    })],
  });
  return adoptBehaviorContribution({
    ...contribution,
    scientificContent: {
      ...contribution.scientificContent,
      temporalQualifications: [{
        operation: "ADD" as const,
        qualificationId: ACQUISITION_TIMING_REF,
        subjectProjectRef: ACQUISITION_REF,
        temporalRole: "ACQUISITION_TIME" as const,
        anchor: temporalAnchor(7, 7),
        sourceText: turn.content,
        assertionKind: "USER_STATED" as const,
        evidenceRefs: [],
      }],
    },
  }, null, 1);
};

const addVisit = (
  current: ResearchProjectOwnerProjection | null,
  content: string,
  options: { replaceImagingTiming?: boolean; suffix?: string } = {},
) => {
  const suffix = options.suffix ?? "visit";
  const turn = behaviorTurn(`turn:p1-doc-04:${suffix}`, options.replaceImagingTiming
    ? `Déplacer l'évaluation d'imagerie entre J5 et J8 et ajouter : ${content}`
    : `Ajouter : ${content}`);
  const contribution = behaviorContribution({
    contributionId: `contribution:p1-doc-04:${suffix}`,
    previousContributionId: current?.contributionRef ?? null,
    turns: [turn],
    candidateObjects: [behaviorItem({
      itemId: FOLLOW_UP_REF,
      proposedType: "VISIT",
      content,
      turnId: turn.turnId,
    })],
  });
  return adoptBehaviorContribution({
    ...contribution,
    scientificContent: {
      ...contribution.scientificContent,
      temporalQualifications: options.replaceImagingTiming ? [{
        operation: "REPLACE" as const,
        qualificationId: ACQUISITION_TIMING_REF,
        subjectProjectRef: ACQUISITION_REF,
        temporalRole: "ACQUISITION_TIME" as const,
        anchor: temporalAnchor(5, 8),
        sourceText: turn.content,
        assertionKind: "USER_STATED" as const,
        evidenceRefs: [],
      }] : [],
    },
  }, current, current ? current.revision + 1 : 1);
};

const handoffFor = (project: ResearchProjectOwnerProjection, at = AT) => authorizeResearchProjectDocumentHandoff({
  project,
  authority: behaviorAuthority,
  confirmedAt: at,
});

const protocolPortfolio = (
  project: ResearchProjectOwnerProjection,
  previous = createEmptyFunctionalResetDocumentPortfolio(),
  requestedAt = AT,
) => refreshFunctionalResetDocumentPortfolio({
  project,
  previous,
  handoffDecision: handoffFor(project, requestedAt),
  requestedAt,
  generateProtocol: true,
});

const temporalText = (project: ResearchProjectOwnerProjection) => {
  const projection = protocolPortfolio(project).projections.at(-1)!;
  const standard = buildStandardProtocolPresentation(projection).sections
    .find((section) => section.sectionId === "temporality")!
    .entries.map((entry) => `${entry.label ? `${entry.label} : ` : ""}${entry.value}`)
    .join("\n");
  const html = renderProjection(projection, "HTML").content;
  const htmlTemporality = html.match(/<section id="short-temporality">[\s\S]*?<\/section>/)?.[0] ?? "";
  return { projection, standard, html, htmlTemporality };
};

describe("P1-DOC-04 — adopted VISIT / follow-up fidelity", () => {
  it("A — preserves one generic adopted VISIT through document source, Standard and HTML", () => {
    const project = addVisit(null, "Suivi clinique à 6 mois", { suffix: "visit-only" });
    const canonical = ensureCanonicalProjectState(project);
    const visit = canonical.objects.find((object) => object.objectId === FOLLOW_UP_REF)!;
    const source = projectDocumentSourceFromFunctionalProject(project, handoffFor(project));
    const { standard, html } = temporalText(project);

    expect(visit).toMatchObject({
      objectId: FOLLOW_UP_REF,
      objectType: "VISIT",
      sectionId: "TEMPORALITY",
      content: "Suivi clinique à 6 mois",
      actuality: "CURRENT",
    });
    expect(visit.semanticKey).toBe("TEMPORALITY:VISIT:visit suivi clinique 6 mois");
    expect(visit.provenance.sourceText).toContain("Suivi clinique à 6 mois");
    expect(canonical.temporalQualifications.some((item) => item.subjectProjectRef === FOLLOW_UP_REF)).toBe(false);
    expect(source.visits).toEqual(expect.arrayContaining([
      expect.objectContaining({ visitId: FOLLOW_UP_REF, timingValue: "Suivi clinique à 6 mois" }),
    ]));
    expect(standard).toContain("Suivi clinique à 6 mois");
    expect(html).toContain("Suivi clinique à 6 mois");
  });

  it("B — preserves the existing imaging-only temporal projection", () => {
    const { standard, htmlTemporality } = temporalText(initialProject());
    for (const output of [standard, htmlTemporality]) {
      expect(output).toMatch(/imagerie initiale/i);
      expect(output).toMatch(/J7|7 jours/i);
      expect(output).not.toMatch(/Suivi clinique|6 mois/i);
    }
  });

  it("C — preserves an imaging replacement and an independent VISIT without cross-binding", () => {
    const project = addVisit(initialProject(), "Suivi clinique à 6 mois", {
      replaceImagingTiming: true,
      suffix: "combined",
    });
    const { standard, htmlTemporality } = temporalText(project);
    for (const output of [standard, htmlTemporality]) {
      expect(output).toMatch(/imagerie initiale/i);
      expect(output).toMatch(/J5|5 jours/i);
      expect(output).toMatch(/J8|8 jours/i);
      expect(output).toContain("Suivi clinique à 6 mois");
      expect(output).not.toMatch(/imagerie[^\n<]*6 mois|suivi clinique[^\n<]*J5[^\n<]*J8/i);
    }
  });

  it("D — keeps P1 immutable and creates a linked P2 only after explicit regeneration", () => {
    const projectV1 = initialProject();
    const portfolioV1 = protocolPortfolio(projectV1, createEmptyFunctionalResetDocumentPortfolio(), "2026-09-02T08:01:00.000Z");
    const p1 = portfolioV1.projections.at(-1)!;
    const p1Before = JSON.stringify(p1);
    const projectV2 = addVisit(projectV1, "Suivi clinique à 6 mois", { suffix: "regeneration" });

    const stale = refreshFunctionalResetDocumentPortfolio({
      project: projectV2,
      previous: portfolioV1,
      requestedAt: "2026-09-02T08:02:00.000Z",
    });
    expect(stale.cards.find((card) => card.kind === "PROTOCOL")?.freshness).toBe("STALE");
    expect(functionalProtocolProjection(stale, p1.projectionId)).toBe(p1);
    expect(JSON.stringify(p1)).toBe(p1Before);

    const regenerated = protocolPortfolio(projectV2, stale, "2026-09-02T08:03:00.000Z");
    const p2 = regenerated.projections.at(-1)!;
    expect(regenerated.projections).toHaveLength(2);
    expect(regenerated.projections[0]).toBe(p1);
    expect(JSON.stringify(regenerated.projections[0])).toBe(p1Before);
    expect(p2.source.projectVersion).toBe(projectV2.versionId);
    expect(p2.priorProjectionId).toBe(p1.projectionId);
    expect(buildStandardProtocolPresentation(p1).sections.find((section) => section.sectionId === "temporality")?.entries
      .some((entry) => /6 mois/i.test(entry.value))).toBe(false);
    expect(buildStandardProtocolPresentation(p2).sections.find((section) => section.sectionId === "temporality")?.entries
      .some((entry) => /Suivi clinique à 6 mois/i.test(entry.value))).toBe(true);
  });

  it("E — preserves an underspecified follow-up without inventing an assessment", () => {
    const { standard, htmlTemporality } = temporalText(addVisit(null, "Suivi à 6 mois", { suffix: "unknown-assessment" }));
    for (const output of [standard, htmlTemporality]) {
      expect(output).toContain("Suivi à 6 mois");
      expect(output).not.toMatch(/examen|questionnaire|consultation complète|évaluation intermédiaire|imagerie/i);
    }
  });

  it("F — preserves an unanchored follow-up without inventing a reference event", () => {
    const { standard, htmlTemporality } = temporalText(addVisit(null, "Visite à 6 mois", { suffix: "unknown-reference" }));
    for (const output of [standard, htmlTemporality]) {
      expect(output).toContain("Visite à 6 mois");
      expect(output).not.toMatch(/après (?:admission|inclusion|randomisation)|depuis (?:admission|inclusion|randomisation)|référentiel/i);
    }
  });
});
