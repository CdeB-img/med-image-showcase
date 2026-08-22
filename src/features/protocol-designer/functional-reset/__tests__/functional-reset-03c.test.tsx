import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildStandardProtocolPresentation,
  createEmptyFunctionalResetDocumentPortfolio,
  refreshFunctionalResetDocumentPortfolio,
  type DocumentProjection,
  type FunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import {
  authorizeResearchProjectDocumentHandoff,
  confirmResearchProjectContribution,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { HYBRID_PRIMARY_RUNTIME_VERSION } from "@/features/scientific-interpretation/hybrid-primary";
import type {
  ContributionEpistemicBoundary,
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation/functional-reset-progression";
import { classifyFunctionalResetQueryDeferral } from "../query-deferral";
import ProtocolPreview from "../ProtocolPreview";
import {
  CHANGESET_AGE_TIMING,
  CHANGESET_INITIAL,
  CHANGESET_READD,
  CHANGESET_REMOVE,
  CHANGESET_REPEAT_REMOVE,
  CHANGESET_SCOPE,
  makeFunctionalReset03A1Contribution,
} from "./functional-reset-03a1-fixtures";

const authority = {
  actorRef: "functional-reset:03c:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (turnId: string, content: string): ScientificInterpretationTurn => ({
  turnId,
  role: "USER",
  content,
  createdAt: "2026-08-22T09:00:00.000Z",
});

const boundary = (turnId: string, epistemicStatus = "EXPLICIT_USER_STATED"): ContributionEpistemicBoundary => ({
  ownership: "SCIENTIFIC_INTERPRETATION",
  epistemicStatus,
  adoptionStatus: "CANDIDATE",
  activeState: true,
  sourceTurnIds: [turnId],
  sourceText: null,
});

const item = (input: {
  itemId: string;
  semanticIdentity: string;
  proposedType: string;
  content: string;
  turnId: string;
  studyRole?: string;
  previousItemIds?: string[];
}): ScientificContributionItem => ({
  itemId: input.itemId,
  semanticIdentity: input.semanticIdentity,
  proposedType: input.proposedType,
  content: input.content,
  polarity: "AFFIRMED",
  studyRole: input.studyRole ?? input.proposedType,
  confidence: 1,
  previousItemIds: input.previousItemIds ?? [],
  epistemicBoundary: boundary(input.turnId),
});

const referenceTurn = turn("turn:fr03c:reference", CHANGESET_INITIAL);

const referenceContribution = (initialTiming = "J5 et J7"): ScientificInterpretationContributionEnvelope => {
  const base = structuredClone(makeFunctionalReset03A1Contribution([referenceTurn]));
  const turnId = referenceTurn.turnId;
  return {
    ...base,
    identity: {
      ...base.identity,
      contributionId: `contribution:fr03c:${initialTiming}`,
      contributionDigest: `digest:fr03c:${initialTiming}`,
    },
    scientificContent: {
      ...base.scientificContent,
      candidateObjects: [
        ...base.scientificContent.candidateObjects,
        item({ itemId: "criterion:age:min:18", semanticIdentity: "population-age-minimum", proposedType: "ELIGIBILITY_CRITERION", content: "18 ans", turnId }),
        item({ itemId: "criterion:age:max:80", semanticIdentity: "population-age-maximum", proposedType: "ELIGIBILITY_CRITERION", content: "80 ans", turnId }),
        item({ itemId: "criterion:idm:recent", semanticIdentity: "recent-myocardial-infarction-seven-days", proposedType: "INCLUSION_CRITERION", content: "infarctus datant de moins de 7 jours", turnId }),
      ],
      temporalElements: [
        item({ itemId: `timing:initial:${initialTiming}`, semanticIdentity: "mri-initial-acquisition", proposedType: "TIMEPOINT", content: `IRM initiale entre ${initialTiming}`, turnId, studyRole: "INITIAL_ACQUISITION" }),
        item({ itemId: "timing:follow-up:3-months", semanticIdentity: "mri-follow-up-acquisition", proposedType: "TIMEPOINT", content: "contrôle IRM à 3 mois", turnId, studyRole: "FOLLOW_UP_ACQUISITION" }),
      ],
    },
  };
};

const confirm = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null = null,
) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: "research-project:functional-reset-03c",
  authority,
  confirmedAt: "2026-08-22T09:01:00.000Z",
});

const referenceProject = () => confirm(referenceContribution());

const projectProjection = (
  project: ResearchProjectOwnerProjection,
  previous: FunctionalResetDocumentPortfolio | null = null,
) => {
  const handoffDecision = authorizeResearchProjectDocumentHandoff({
    project,
    authority,
    confirmedAt: "2026-08-22T09:02:00.000Z",
  });
  const portfolio = refreshFunctionalResetDocumentPortfolio({
    project,
    previous: previous ?? createEmptyFunctionalResetDocumentPortfolio(),
    handoffDecision,
    requestedAt: "2026-08-22T09:03:00.000Z",
    generateProtocol: true,
  });
  return { portfolio, projection: portfolio.projections.at(-1)! };
};

const section = (projection: DocumentProjection, sectionId: string) => projection.sections.find((candidate) => candidate.sectionId === sectionId)!;
const presentationSection = (projection: DocumentProjection, sectionId: string) => buildStandardProtocolPresentation(projection).sections.find((candidate) => candidate.sectionId === sectionId)!;
const presentationText = (projection: DocumentProjection) => buildStandardProtocolPresentation(projection).sections
  .flatMap((candidate) => candidate.entries.flatMap((value) => [value.label, value.value].filter(Boolean)))
  .join(" ");

const mutationTurns = [
  CHANGESET_INITIAL,
  CHANGESET_AGE_TIMING,
  CHANGESET_SCOPE,
  CHANGESET_REMOVE,
  CHANGESET_REPEAT_REMOVE,
  CHANGESET_READD,
].map((content, index) => turn(`turn:fr03c:mutation:${index + 1}`, content));

const projectAtMutationStage = (stage: number) => {
  let project: ResearchProjectOwnerProjection | null = null;
  for (let index = 1; index <= stage; index += 1) {
    project = confirm(makeFunctionalReset03A1Contribution(mutationTurns.slice(0, index)), project);
  }
  return project!;
};

describe("FUNCTIONAL-RESET-03C — human-readable protocol working preview", () => {
  afterEach(cleanup);

  it("FR03C-C01 — Standard preview is derived from the existing document projection chain", () => {
    const { projection } = projectProjection(referenceProject());
    const presentation = buildStandardProtocolPresentation(projection);
    expect(presentation).toMatchObject({
      boundary: "DOC_001_STANDARD_PROTOCOL_PRESENTATION",
      sourceProjectionId: projection.projectionId,
      sourceProjectVersion: projection.source.projectVersion,
      sourceProjectDigest: projection.source.projectDigest,
    });
  });

  it("FR03C-C02 — Standard preview is not persisted as a second source of truth", () => {
    const { portfolio, projection } = projectProjection(referenceProject());
    expect(buildStandardProtocolPresentation(projection)).toMatchObject({ sourceOfTruth: false, persisted: false });
    expect(JSON.stringify(portfolio)).not.toContain("STANDARD_PROTOCOL_PRESENTATION");
  });

  it("FR03C-C03 — Known Project facts are not lost between Project and Standard preview", () => {
    const project = referenceProject();
    const { projection } = projectProjection(project);
    const known = project.sections.flatMap((candidate) => candidate.elements.map((value) => value.content));
    const visible = presentationText(projection);
    for (const expected of ["infarctus du myocarde", "colchicine", "placebo", "étude multicentrique", "IRM", "inflammation", "biomarqueurs sanguins"]) {
      expect(known.join(" ")).toMatch(new RegExp(expected, "i"));
      expect(visible).toMatch(new RegExp(expected, "i"));
    }
  });

  it("FR03C-C04 — Known multicenter design is displayed", () => {
    const { projection } = projectProjection(referenceProject());
    expect(presentationSection(projection, "design").entries).toContainEqual(expect.objectContaining({ value: "Étude multicentrique." }));
    expect(section(projection, "study-design").blocks.flatMap((block) => block.items).join(" ")).toContain("étude multicentrique");
  });

  it("FR03C-C05 — Known intervention is not reported as absent", () => {
    const { projection } = projectProjection(referenceProject());
    expect(presentationSection(projection, "intervention")).toMatchObject({ completeness: "KNOWN", entries: [expect.objectContaining({ value: "Colchicine." })] });
  });

  it("FR03C-C06 — Known comparator is not reported as absent", () => {
    const { projection } = projectProjection(referenceProject());
    expect(presentationSection(projection, "comparator")).toMatchObject({ completeness: "KNOWN", entries: [expect.objectContaining({ value: "Placebo." })] });
  });

  it("FR03C-C07 — Known imaging modality is not reported as absent", () => {
    const { projection } = projectProjection(referenceProject());
    expect(presentationSection(projection, "imaging")).toMatchObject({ completeness: "KNOWN", entries: [expect.objectContaining({ value: "IRM." })] });
  });

  it("FR03C-C08 — Known measurements are not reported as absent", () => {
    const { projection } = projectProjection(referenceProject());
    expect(presentationSection(projection, "measurements").entries.map((value) => value.value)).toEqual(expect.arrayContaining([
      "inflammation", "lésions en IRM", "taille de l’infarctus", "biomarqueurs sanguins",
    ]));
  });

  it("FR03C-C09 — Known temporal occurrences are not reported as absent", () => {
    const { projection } = projectProjection(referenceProject());
    expect(presentationSection(projection, "temporality")).toMatchObject({ completeness: "KNOWN" });
  });

  it("FR03C-C10 — Age minimum and maximum from 03B1 are both preserved", () => {
    const { projection } = projectProjection(referenceProject());
    expect(presentationSection(projection, "population").entries).toContainEqual(expect.objectContaining({ label: "Âge", value: "18 à 80 ans" }));
  });

  it("FR03C-C11 — Initial and follow-up imaging timepoints remain distinct", () => {
    const project = referenceProject();
    const source = projectProjection(project).projection;
    expect(presentationSection(source, "temporality").entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "IRM initiale", value: "J5–J7" }),
      expect.objectContaining({ label: "IRM de suivi", value: "3 mois" }),
    ]));
    expect(section(source, "visits-temporal").blocks.flatMap((block) => block.items).join(" ")).toMatch(/Visit BASELINE.*Visit FOLLOW_UP/s);
  });

  it("FR03C-C12 — Scientific values are not duplicated with technical annotations", () => {
    const { projection } = projectProjection(referenceProject());
    const population = presentationSection(projection, "population");
    expect(population.entries.filter((value) => value.value.includes("80 ans"))).toHaveLength(1);
    expect(JSON.stringify(population)).not.toMatch(/Contrainte d’éligibilité explicitement confirmée|formulation opérationnelle spécialisée/i);
  });

  it("FR03C-C13 — DOC-002 pattern counts are absent from Standard preview", () => {
    const { projection } = projectProjection(referenceProject());
    expect(projection.sections.some((candidate) => candidate.patternIds.length > 0)).toBe(true);
    expect(JSON.stringify(buildStandardProtocolPresentation(projection))).not.toMatch(/DOC-002|pattern\(s\)/i);
  });

  it("FR03C-C14 — Internal ownership/engine jargon is absent from Standard preview", () => {
    const { projection } = projectProjection(referenceProject());
    const presentation = buildStandardProtocolPresentation(projection);
    const visible = `${presentationText(projection)} ${presentation.openItems.map((value) => value.label).join(" ")}`;
    expect(visible).not.toMatch(/MeasurementDefinitions|canonicalPromotion|handoff|IMAGING:|BIOSTATISTICS:|QRY:|PRJ:/i);
  });

  it("FR03C-C15 — Global open-items list is deduplicated", () => {
    const { projection } = projectProjection(referenceProject());
    const labels = buildStandardProtocolPresentation(projection).openItems.map((value) => value.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(["Objectifs", "Plan d’analyse statistique"]);
  });

  it("FR03C-C16 — A partially known section is not presented as wholly absent", () => {
    const { projection } = projectProjection(referenceProject());
    expect(section(projection, "imaging").status).not.toBe("GENERATABLE");
    expect(presentationSection(projection, "imaging")).toMatchObject({ completeness: "KNOWN", entries: [expect.objectContaining({ value: "IRM." })] });
  });

  it("FR03C-C17 — Open items remain grounded in real owner/projection state", () => {
    const { projection } = projectProjection(referenceProject());
    const presentation = buildStandardProtocolPresentation(projection);
    for (const open of presentation.openItems) {
      const source = section(projection, open.sourceSectionId);
      expect(open.sourceKind === "UNKNOWN" ? source.unknowns[open.sourceIndex] : source.statusReasons[open.sourceIndex]).toBeTruthy();
    }
  });

  it("FR03C-C18 — French session produces French human-readable presentation", () => {
    const { projection } = projectProjection(referenceProject());
    const visible = presentationText(projection);
    expect(visible).toMatch(/Étude multicentrique|IRM de suivi|Comparaison entre colchicine et placebo/);
    expect(visible).not.toMatch(/\bknown\b|follow-up|candidate|owner/i);
  });

  it("FR03C-C19 — Removed biomarker disappears after document refresh", () => {
    const project = projectAtMutationStage(4);
    const { projection } = projectProjection(project);
    expect(presentationText(projection)).not.toMatch(/biomarqueurs sanguins/i);
  });

  it("FR03C-C20 — Re-added biomarker reappears after document refresh", () => {
    const project = projectAtMutationStage(6);
    const { projection } = projectProjection(project);
    expect(presentationText(projection)).toMatch(/biomarqueurs sanguins/i);
  });

  it("FR03C-C21 — Project mutation makes previous preview stale", () => {
    const first = projectAtMutationStage(1);
    const current = projectProjection(first).portfolio;
    const changed = projectAtMutationStage(2);
    const stale = refreshFunctionalResetDocumentPortfolio({ project: changed, previous: current, requestedAt: "2026-08-22T09:04:00.000Z" });
    expect(stale.cards.find((card) => card.kind === "PROTOCOL")).toMatchObject({ freshness: "STALE", stateLabel: "À actualiser" });
  });

  it("FR03C-C22 — Refreshing preview binds it to the new Project version", () => {
    const first = projectAtMutationStage(1);
    const current = projectProjection(first).portfolio;
    const changed = projectAtMutationStage(2);
    const refreshed = projectProjection(changed, current);
    expect(refreshed.projection.source.projectVersion).toBe(changed.versionId);
    expect(refreshed.portfolio.cards.find((card) => card.kind === "PROTOCOL")).toMatchObject({ freshness: "CURRENT" });
  });

  it("FR03C-C23 — Preview remains read-only", () => {
    const { projection } = projectProjection(referenceProject());
    expect(buildStandardProtocolPresentation(projection)).toMatchObject({ readOnly: true, projectWriteAuthorized: false });
    render(<ProtocolPreview projection={projection} stale={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("FR03C-C24 — Preview cannot mutate Research Project", () => {
    const project = referenceProject();
    const before = JSON.stringify(project);
    const { projection } = projectProjection(project);
    const onClose = vi.fn();
    render(<ProtocolPreview projection={projection} stale={false} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Retour à la conversation" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(JSON.stringify(project)).toBe(before);
    expect(screen.queryByRole("button", { name: /modifier|enregistrer|confirmer/i })).toBeNull();
  });

  it("FR03C-C25 — QRY behavior is unchanged", () => {
    const project = referenceProject();
    const before = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-22T09:05:00.000Z" });
    projectProjection(project);
    const after = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-22T09:05:00.000Z" });
    expect(after).toEqual(before);
  });

  it("FR03C-C26 — Scientific Interpretation uses the admitted v1.3.10 foundation", () => {
    expect(HYBRID_PRIMARY_RUNTIME_VERSION).toBe("1.3.10");
  });

  it("FR03C-C27 — 03B1 QRY deferral remains PASS", () => {
    const contribution = referenceContribution();
    const unknownTurn = turn("turn:fr03c:unknown", "Je ne sais pas encore. On peut avancer sur le point suivant.");
    contribution.source.turns.push(unknownTurn);
    contribution.scientificContent.unknowns.push(item({ itemId: "unknown:fr03c", semanticIdentity: "population-criteria-unknown", proposedType: "UNKNOWN", content: "critères non définis", turnId: unknownTurn.turnId }));
    contribution.scientificContent.unknowns[0]!.epistemicBoundary.epistemicStatus = "UNKNOWN_MISSING_INFORMATION";
    expect(classifyFunctionalResetQueryDeferral({ contribution, sourceTurnId: unknownTurn.turnId, rawResponse: unknownTurn.content })).not.toBeNull();
  });

  it("FR03C-C28 — 03B1 multi-timepoint behavior remains PASS", () => {
    const project = referenceProject();
    expect(project.sections.find((candidate) => candidate.sectionId === "TEMPORALITY")?.elements.map((value) => value.semanticKey)).toEqual([
      "TEMPORALITY:IRM:INITIAL",
      "TEMPORALITY:IRM:FOLLOW_UP",
    ]);
    const { projection } = projectProjection(project);
    expect(presentationSection(projection, "temporality").entries).toHaveLength(2);
  });

  it("renders the reference scenario as a readable working document", () => {
    const { projection } = projectProjection(referenceProject());
    render(<ProtocolPreview projection={projection} stale={false} onClose={vi.fn()} />);
    const preview = screen.getByTestId("functional-protocol-preview");
    expect(within(preview).getByRole("heading", { name: "PROTOCOLE DE TRAVAIL" })).toBeInTheDocument();
    expect(within(preview).getByRole("heading", { name: "Design" }).closest("article")).toHaveTextContent("Étude multicentrique.");
    expect(within(preview).getByRole("heading", { name: "Population" }).closest("article")).toHaveTextContent(/Âge\s*18 à 80 ans/);
    expect(within(preview).getByRole("heading", { name: "Temporalité" }).closest("article")).toHaveTextContent(/IRM initiale\s*J5–J7.*IRM de suivi\s*3 mois/s);
    expect(preview.textContent).not.toMatch(/DOC-002|pattern\(s\)|MeasurementDefinitions|IMAGING:|Biostatistics adopted/i);
  });
});
