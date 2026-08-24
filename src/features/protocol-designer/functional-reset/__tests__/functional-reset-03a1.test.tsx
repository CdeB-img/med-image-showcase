import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { HYBRID_PRIMARY_RUNTIME_VERSION } from "@/features/scientific-interpretation/hybrid-primary";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import {
  CHANGESET_AGE_TIMING,
  CHANGESET_INITIAL,
  CHANGESET_READD,
  CHANGESET_REMOVE,
  CHANGESET_REPEAT_REMOVE,
  CHANGESET_REPLACE_AGE,
  CHANGESET_SCOPE,
  makeFunctionalReset03A1Contribution,
} from "./functional-reset-03a1-fixtures";
import { COLCHICINE_03A_INITIAL, COLCHICINE_03A_MODIFICATION, makeFunctionalResetBridgeResponseForRequest, makeFunctionalResetContribution } from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const authority = {
  actorRef: "functional-reset-03a1:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const sequence = [
  CHANGESET_INITIAL,
  CHANGESET_AGE_TIMING,
  CHANGESET_SCOPE,
  CHANGESET_REMOVE,
  CHANGESET_REPEAT_REMOVE,
  CHANGESET_READD,
  CHANGESET_REPLACE_AGE,
];

const turnsTo = (stage: number): ScientificInterpretationTurn[] => sequence.slice(0, stage).map((content, index) => ({
  turnId: `turn:changeset:${index + 1}`,
  role: "USER",
  content,
  createdAt: `2026-08-20T10:0${index}:00.000Z`,
}));

const buildSequence = (stage: number) => {
  let project: ResearchProjectOwnerProjection | null = null;
  const records: Array<{
    contribution: ReturnType<typeof makeFunctionalReset03A1Contribution>;
    candidate: ReturnType<typeof prepareResearchProjectContributionCandidate>;
    projectBefore: ResearchProjectOwnerProjection | null;
    projectAfter: ResearchProjectOwnerProjection;
  }> = [];
  for (let currentStage = 1; currentStage <= stage; currentStage += 1) {
    const contribution = makeFunctionalReset03A1Contribution(turnsTo(currentStage));
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    const projectBefore = project;
    project = confirmResearchProjectContribution({
      contribution,
      current: project,
      projectId: "research-project:changeset",
      authority,
      confirmedAt: `2026-08-20T11:0${currentStage}:00.000Z`,
    });
    records.push({ contribution, candidate, projectBefore, projectAfter: project });
  }
  return { project: project!, records };
};

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const confirm = async () => {
  const callsBefore = runtime.request.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
  await waitFor(() => expect(runtime.request.mock.calls.length).toBeGreaterThan(callsBefore));
  await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());
};

const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as {
  project: ResearchProjectOwnerProjection | null;
  pendingContribution: unknown;
};

const confirmInitialAndAge = async () => {
  submit(CHANGESET_INITIAL);
  await screen.findByText("J’ai suffisamment d’éléments pour vous proposer une première structure d’étude.");
  await confirm();
  submit(CHANGESET_AGE_TIMING);
  await screen.findByText("J’ai compris deux modifications :");
  await confirm();
  await screen.findByText(/Projet mis à jour\./);
};

const reachRemovalReview = async () => {
  await confirmInitialAndAge();
  submit(CHANGESET_SCOPE);
  expect((await screen.findAllByText("Je comprends votre proposition. Je vous la présente séparément pour confirmation.")).length).toBeGreaterThan(0);
  submit(CHANGESET_REMOVE);
  await screen.findByText("J’ai compris une modification :");
};

describe("FUNCTIONAL-RESET-03A1 — semantic Project changeset", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(
      request,
      makeFunctionalReset03A1Contribution(request.conversation.turns.filter((turn: ScientificInterpretationTurn) => turn.role === "USER")),
    ));
  });
  afterEach(cleanup);

  it("FR03A1-C01 — one semantic change remains one Project change despite multiple textual representations", () => {
    const { project: projectV1 } = buildSequence(1);
    const contribution = makeFunctionalReset03A1Contribution(turnsTo(2));
    const candidate = prepareResearchProjectContributionCandidate(contribution, projectV1);
    expect(contribution.scientificContent.explicitStatements).toEqual(expect.arrayContaining([
      expect.objectContaining({ content: CHANGESET_AGE_TIMING }),
    ]));
    expect(candidate.changeSet).toMatchObject({ status: "PENDING_HUMAN_CONFIRMATION", effectiveChangeCount: 2 });
    expect(candidate.changeSet.changes.filter((change) => change.operation !== "NO_CHANGE")).toHaveLength(2);
  });

  it("FR03A1-C02 — age maximum is an eligibility criterion, not a population value", () => {
    const { project } = buildSequence(2);
    const population = project.sections.find((section) => section.sectionId === "POPULATION")!;
    expect(population.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ semanticKey: "POPULATION:ELIGIBILITY:AGE:MAX", content: "Âge maximal : 75 ans" }),
    ]));
    expect(population.elements.filter((element) => /75 ans/i.test(element.content))).toHaveLength(1);
    expect(population.elements.some((element) => element.content === "75 ans" || element.content === CHANGESET_AGE_TIMING)).toBe(false);
  });

  it("FR03A1-C03 — timing J3–J5 is represented once", () => {
    const { project, records } = buildSequence(2);
    const timingChanges = records[1].candidate.changeSet.changes.filter((change) => change.targetSectionId === "TEMPORALITY" && change.operation !== "NO_CHANGE");
    expect(timingChanges).toEqual([expect.objectContaining({ operation: "ADD", presentation: "+ IRM : J3–J5" })]);
    expect(project.sections.find((section) => section.sectionId === "TEMPORALITY")?.elements).toEqual([
      expect.objectContaining({ semanticKey: "TEMPORALITY:IRM:WINDOW", content: "IRM : J3–J5" }),
    ]);
  });

  it("FR03A1-C04 — negated scope text cannot become a positive Project value", () => {
    const { project, records } = buildSequence(3);
    expect(records[2].candidate.changeSet).toMatchObject({ status: "NO_NET_CHANGE", effectiveChangeCount: 0 });
    expect(project.revision).toBe(2);
    expect(project.sections.flatMap((section) => section.elements.map((element) => element.content)).join(" ")).not.toMatch(/pas l’ensemble|l’âge maximal est de 75 ans/i);
  });

  it("FR03A1-C05 — removal appears in review before Project mutation", async () => {
    renderDemo();
    await reachRemovalReview();
    const beforeConfirmation = JSON.stringify(stored().project);
    const review = screen.getAllByTestId("functional-contribution-review").at(-1)!;
    expect(within(review).getByText("Mesures / biomarqueurs")).toBeInTheDocument();
    expect(within(review).getByText("− Biomarqueurs sanguins")).toBeInTheDocument();
    expect(stored().project?.revision).toBe(2);
    expect(JSON.stringify(stored().project)).toBe(beforeConfirmation);
  });

  it("FR03A1-C06 — removal creates a Project version only after confirmation", async () => {
    renderDemo();
    await reachRemovalReview();
    await confirm();
    const project = stored().project!;
    expect(project.revision).toBe(3);
    const measurements = project.sections.find((section) => section.sectionId === "MEASUREMENTS")!.elements.map((element) => element.content);
    expect(measurements).not.toContain("biomarqueurs sanguins");
    expect(measurements).toEqual(expect.arrayContaining(["inflammation", "lésions en IRM", "taille de l’infarctus"]));
  });

  it("FR03A1-C07 — repeated removal is idempotent and creates no Project version", () => {
    const { project, records } = buildSequence(5);
    expect(records[3].projectAfter.revision).toBe(3);
    expect(records[4].candidate.changeSet).toMatchObject({ status: "NO_NET_CHANGE", effectiveChangeCount: 0 });
    expect(records[4].projectAfter).toBe(records[4].projectBefore);
    expect(project.revision).toBe(3);
  });

  it("FR03A1-C08 — re-add produces one semantic ADD", () => {
    const { project, records } = buildSequence(6);
    const effective = records[5].candidate.changeSet.changes.filter((change) => change.operation !== "NO_CHANGE");
    expect(effective).toEqual([expect.objectContaining({ operation: "ADD", targetSectionId: "MEASUREMENTS", presentation: "+ Biomarqueurs sanguins" })]);
    expect(project.revision).toBe(4);
    expect(project.sections.find((section) => section.sectionId === "MEASUREMENTS")?.elements.filter((element) => element.content === "biomarqueurs sanguins")).toHaveLength(1);
  });

  it("FR03A1-C09 — correction 75→80 produces REPLACE without duplicate active values", () => {
    const { project, records } = buildSequence(7);
    const ageChanges = records[6].candidate.changeSet.changes.filter((change) => change.targetSectionId === "POPULATION" && change.operation !== "NO_CHANGE");
    expect(ageChanges).toEqual([expect.objectContaining({ operation: "REPLACE", presentation: "Âge maximal : 75 ans → 80 ans" })]);
    const ageValues = project.sections.find((section) => section.sectionId === "POPULATION")!.elements.filter((element) => /Âge maximal/i.test(element.content));
    expect(ageValues).toEqual([expect.objectContaining({ content: "Âge maximal : 80 ans" })]);
    expect(project.revision).toBe(5);
  });

  it("FR03A1-C10 — NO_CHANGE never displays a misleading confirmation card", async () => {
    renderDemo();
    await confirmInitialAndAge();
    submit(CHANGESET_SCOPE);
    expect((await screen.findAllByText("Je comprends votre proposition. Je vous la présente séparément pour confirmation.")).length).toBeGreaterThan(0);
    expect(screen.queryByText(/J’ai compris 0 modifications/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Cela correspond à mon projet" })).toBeNull();
    expect(stored().project?.revision).toBe(2);
    expect(stored().pendingContribution).toBeNull();
  });

  it("FR03A1-C11 — Project cannot mutate when review reports zero changes", () => {
    const { project: projectV2 } = buildSequence(2);
    const contribution = makeFunctionalReset03A1Contribution(turnsTo(3));
    const confirmed = confirmResearchProjectContribution({
      contribution,
      current: projectV2,
      projectId: projectV2.projectId,
      authority,
      confirmedAt: "2026-08-20T12:00:00.000Z",
    });
    expect(confirmed).toBe(projectV2);
    expect(confirmed.versionId).toBe(projectV2.versionId);
  });

  it("FR03A1-C12 — ProjectPanel excludes raw negation fragments from scientific values", async () => {
    renderDemo();
    await confirmInitialAndAge();
    submit(CHANGESET_SCOPE);
    expect((await screen.findAllByText("Je comprends votre proposition. Je vous la présente séparément pour confirmation.")).length).toBeGreaterThan(0);
    const projectPanel = screen.getByTestId("functional-research-project");
    expect(projectPanel.textContent).not.toMatch(/pas l’ensemble de la population|l’âge maximal est de 75 ans, pas/i);
    expect(within(projectPanel).getByText("Âge maximal : 75 ans")).toBeInTheDocument();
  });

  it("FR03A1-C13 — a French session does not expose an internal English summary in Standard", async () => {
    renderDemo();
    submit(CHANGESET_INITIAL);
    await screen.findByText("J’ai suffisamment d’éléments pour vous proposer une première structure d’étude.");
    expect(screen.getByTestId("functional-contribution-review").textContent).not.toMatch(/The user wants to study/i);
    await confirm();
    const projectPanel = screen.getByTestId("functional-research-project");
    expect(projectPanel.textContent).not.toMatch(/The user wants to study/i);
    expect(within(projectPanel).getByText(/Projet sur infarctus du myocarde/)).toBeInTheDocument();
  });

  it("FR03A1-C14 — Scientific Interpretation runtime remains on the admitted foundation", () => {
    expect(HYBRID_PRIMARY_RUNTIME_VERSION).toBe("1.3.10");
    expect(makeFunctionalReset03A1Contribution(turnsTo(7)).identity).toMatchObject({
      runtimeId: "HYBRID_PRIMARY_STRUCTURED",
      runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
    });
  });

  it("FR03A1-C15 — RESET-01/02/03A contributions remain compatible with the PRJ changeset boundary", () => {
    const firstTurn: ScientificInterpretationTurn = { turnId: "legacy:1", role: "USER", content: COLCHICINE_03A_INITIAL, createdAt: "2026-08-20T09:00:00.000Z" };
    const initial = makeFunctionalResetContribution([firstTurn]);
    const projectV1 = confirmResearchProjectContribution({ contribution: initial, current: null, projectId: "legacy:project", authority, confirmedAt: "2026-08-20T09:01:00.000Z" });
    const secondTurn: ScientificInterpretationTurn = { turnId: "legacy:2", role: "USER", content: COLCHICINE_03A_MODIFICATION, createdAt: "2026-08-20T09:02:00.000Z" };
    const update = makeFunctionalResetContribution([firstTurn, secondTurn]);
    const candidate = prepareResearchProjectContributionCandidate(update, projectV1);
    expect(candidate.changeSet.effectiveChangeCount).toBe(2);
    expect(candidate.proposedSections.flatMap((section) => section.elements.map((element) => element.content))).toEqual(expect.arrayContaining([
      "colchicine", "placebo", "Âge maximal : 75 ans", "IRM : J3–J5",
    ]));
  });
});
