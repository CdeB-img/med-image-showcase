import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { executeResearchProjectConstruction } from "@/features/research-project-construction/engine";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import QueryNavigationPanel from "../QueryNavigationPanel";
import {
  QRY001_CLOSURE_CAMPAIGN_BOUNDARY,
  QRY001_CLOSURE_GATES,
  QRY001_CLOSURE_SCENARIO_FAMILIES,
  appendNavigationLifecycleEvent,
  buildQuestionResponseEnvelope,
  buildProjectQueryNavigationSourceState,
  buildQueryNavigationProductProjection,
  countImplicitDuplicatePresentations,
  createQueryNavigationMemory,
  inspectNavigationActionFreshness,
  replayQueryNavigationLifecycle,
  routeNavigationResponse,
} from "..";

const project = (sparse = false) => executeResearchProjectConstruction(makeProjectInput(sparse ? { population: [], pathology: [], outcomes: [], objectives: false, hypotheses: false } : {}));

describe("QRY-001 Part 4 — product projection", () => {
  it("QRY4-UI-C01 shows the Prochaine action surface", () => { render(<QueryNavigationPanel project={project(true)} />); expect(screen.getByTestId("query-navigation-panel")).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Prochaine action" })).toBeInTheDocument(); });
  it("QRY4-UI-C02 shows why-now", () => { render(<QueryNavigationPanel project={project(true)} />); expect(screen.getAllByText(/Pourquoi maintenant :/).length).toBeGreaterThan(0); });
  it("QRY4-UI-C03 standard mode hides internals", () => { render(<QueryNavigationPanel project={project(true)} />); expect(screen.queryByText("Trace")).toBeNull(); expect(screen.queryByText("Valeur d’information")).toBeNull(); });
  it("QRY4-UI-C04 expert mode exposes trace", () => { render(<QueryNavigationPanel project={project(true)} />); fireEvent.click(screen.getByRole("button", { name: "Mode expert" })); expect(screen.getByText("Preuves et trace QRY")).toBeInTheDocument(); expect(screen.getByText("Trace")).toBeInTheDocument(); });
  it("QRY4-UI-C05 preserves multiple alternatives without artificial ordering", () => { const projection = buildQueryNavigationProductProjection(project(true)); expect(projection.alternatives.length).toBeGreaterThan(1); expect(projection.status).toBe("MULTIPLE_OPTIONS"); expect(projection.selection.selected).toBeNull(); });
  it("QRY4-UI-C06 exposes the answer contract after a human navigation choice", () => { render(<QueryNavigationPanel project={project(true)} />); const candidate = screen.getAllByRole("button").find((button) => button.textContent?.includes("Clarifier par un Échange adaptatif")); expect(candidate).toBeDefined(); fireEvent.click(candidate!); expect(screen.getByText(/Contrat de réponse :/)).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Préparer une réponse libre" })).toBeInTheDocument(); });
  it("QRY4-UI-C07 defer remains explicit", () => { render(<QueryNavigationPanel project={project(true)} />); const candidate = screen.getAllByRole("button").find((button) => button.textContent?.includes("Clarifier par un Échange adaptatif")); fireEvent.click(candidate!); fireEvent.click(screen.getByRole("button", { name: "Plus tard" })); expect(screen.getByRole("status")).toHaveTextContent(/reste ouvert/); });
  it("QRY4-UI-C08 decline/cannot-answer creates no loop", () => { render(<QueryNavigationPanel project={project(true)} />); fireEvent.click(screen.getByRole("button", { name: "Je ne sais pas" })); expect(screen.getByRole("status")).toHaveTextContent(/aucune valeur par défaut/); });
  it("QRY4-UI-C09 Human Review targets the existing Human Decision boundary", () => { const value = project(); const isolated = { ...value, adaptiveQuestions: [], contradictions: [], missingInformation: [], localReadiness: [], projectionReadiness: [] }; render(<QueryNavigationPanel project={isolated} validationGates={[{ gateId: "PROJECT_FREEZE", status: "REVIEW_REQUIRED", runRefs: ["val-run:1"], findingRefs: [], reviewRequestRefs: ["human-review:1"], affectedBranchRefs: ["project:freeze"], owner: "VAL-001", reason: "Revue humaine requise." }]} />); fireEvent.click(screen.getByRole("button", { name: "Préparer la revue humaine" })); expect(screen.getByRole("status")).toHaveTextContent(/Human Decision Envelope/); expect(screen.getByRole("status")).toHaveTextContent(/Aucun arbitrage ni décision/); });
  it("QRY4-UI-C10 system prerequisite is never rendered as scientific question", () => { const value = project(); const isolated = { ...value, adaptiveQuestions: [], contradictions: [], missingInformation: [], localReadiness: [], projectionReadiness: [] }; render(<QueryNavigationPanel project={isolated} />); expect(screen.getByText(/Prérequis système\/validation/)).toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Préparer une réponse libre" })).toBeNull(); });
  it("QRY4-UI-C11 NOT_EVALUABLE remains visible", () => { const value = project(); const isolated = { ...value, adaptiveQuestions: [], contradictions: [], missingInformation: [], localReadiness: [], projectionReadiness: [] }; render(<QueryNavigationPanel project={isolated} />); expect(buildQueryNavigationProductProjection(isolated).status).toBe("NOT_EVALUABLE"); expect(screen.getByText(/Gate VAL : NOT_EVALUABLE/)).toBeInTheDocument(); });
  it("QRY4-UI-C12 pending S never activates provider", () => expect(buildQueryNavigationProductProjection(project()).providerCalls).toBe(0));
  it("QRY4-UI-C13 candidate/provisional status is explicit", () => { const value = project(); render(<QueryNavigationPanel project={value} />); expect(value.candidateVersion.status).toBe("CANDIDATE_NOT_FROZEN"); expect(screen.getByText(/Statut du Project : candidate not frozen/)).toBeInTheDocument(); });
  it("QRY4-UI-C14 rendering is read-only", () => { const value = project(true); const before = JSON.stringify(value); render(<QueryNavigationPanel project={value} />); expect(JSON.stringify(value)).toBe(before); });
  it("QRY4-UI-C15 no opaque score is displayed", () => { render(<QueryNavigationPanel project={project(true)} />); expect(screen.queryByText(/score global/i)).toBeNull(); });
});

describe("QRY-001 Part 4 — boundaries", () => {
  const sources = ["contracts.ts", "adapters.ts", "information-value.ts", "engine.ts", "lifecycle.ts", "response-routing.ts", "product.ts", "QueryNavigationPanel.tsx"]
    .map((name) => readFileSync(resolve(process.cwd(), "src/features/query-navigation", name), "utf8")).join("\n");
  it("QRY4-BND-C01 does not modify Project", () => expect(sources).not.toMatch(/saveProject\s*\(|answerProjectQuestion\s*\(/));
  it("QRY4-BND-C02 does not create HumanDecision", () => expect(sources).not.toMatch(/createHumanDecisionCandidate\s*\(|engageHumanDecision\s*\(/));
  it("QRY4-BND-C03 does not modify ValidationRun", () => expect(sources).not.toMatch(/updateValidationRun\s*\(|saveValidationRun\s*\(/));
  it("QRY4-BND-C04 does not resolve findings", () => expect(sources).not.toMatch(/resolveValidationAfterHumanDecision\s*\(/));
  it("QRY4-BND-C05 creates no Scientific Object from raw response", () => expect(sources).not.toMatch(/createScientificObject\s*\(/));
  it("QRY4-BND-C06 does not choose StatisticalMethod", () => expect(sources).not.toMatch(/selectStatisticalMethod\s*\(/));
  it("QRY4-BND-C07 does not choose Estimand", () => expect(sources).not.toMatch(/selectEstimand\s*\(/));
  it("QRY4-BND-C08 does not choose MeasurementDefinition", () => expect(sources).not.toMatch(/selectMeasurementDefinition\s*\(/));
  it("QRY4-BND-C09 does not create a document", () => expect(sources).not.toMatch(/renderDocument\s*\(|createDocument\s*\(/));
  it("QRY4-BND-C10 remains projection owner, not UX doctrine owner", () => expect(buildQueryNavigationProductProjection(project())).toMatchObject({ projectionOnly: true, sourceOfTruth: false }));
  it("QRY4-BND-C11 claims no PD-011 PASS", () => expect(buildQueryNavigationProductProjection(project()).pd011QualificationClaimed).toBe(false));
  it("QRY4-BND-C12 calls no provider", () => { expect(sources).not.toMatch(/fetch\s*\(|generateContent\s*\(|GoogleGenerativeAI|OpenAI\s*\(/); expect(QRY001_CLOSURE_CAMPAIGN_BOUNDARY.providerCalls).toBe(0); });
});

describe("QRY-001 Part 4 — closure campaign", () => {
  it("covers scenario families A through V", () => { expect(QRY001_CLOSURE_SCENARIO_FAMILIES).toHaveLength(22); expect(QRY001_CLOSURE_SCENARIO_FAMILIES[0]).toMatch(/^A_/); expect(QRY001_CLOSURE_SCENARIO_FAMILIES.at(-1)).toMatch(/^V_/); });
  it.each(QRY001_CLOSURE_GATES)("$gateId has explicit closure evidence", (gate) => { expect(gate.gateId).toMatch(/^QRY-CLOSE-C\d{2}$/); expect(gate.requirement).toBeTruthy(); expect(gate.evidenceRefs.length).toBeGreaterThan(0); });
  it("is not PD-011 qualification", () => expect(QRY001_CLOSURE_CAMPAIGN_BOUNDARY.qualificationStatus).toBe("NOT_PD011_QUALIFICATION"));
  it("uses no blind data or provider", () => expect(QRY001_CLOSURE_CAMPAIGN_BOUNDARY).toMatchObject({ blindDataUsed: false, providerCalls: 0 }));
  it("creates no Project/VAL write or HumanDecision", () => expect(QRY001_CLOSURE_CAMPAIGN_BOUNDARY).toMatchObject({ projectWrites: 0, validationWrites: 0, humanDecisionsCreated: 0 }));
  it("QRY4-CLOSE-E2E reconstructs source, action, presentation, response, handoff and next Project selection", () => { const value = project(true); const initial = buildQueryNavigationProductProjection(value); const chosen = buildQueryNavigationProductProjection(value, initial.memory, initial.alternatives[0]!.candidateId); const action = chosen.selectedAction!; const presentation = chosen.questionPresentation!; const response = buildQuestionResponseEnvelope({ responseId: "response:e2e", selectedActionRef: action.selectedActionId, presentationRef: presentation.presentationId, projectRef: value.resultId, projectVersionAtPresentation: value.candidateVersion.versionId, responseKind: presentation.expectedAnswerKind, rawResponse: "Réponse scientifique visible", actorRef: "researcher:fixture", actorRole: "RESEARCHER", selectedOptionRefs: [], disposition: "ANSWER", receivedAt: "2026-08-15T08:00:00.000Z", provenanceRefs: ["researcher:fixture"] }); const freshness = inspectNavigationActionFreshness(action, { projectVersion: value.candidateVersion.versionId, sourceStateDigest: chosen.sourceStateDigest }); const route = routeNavigationResponse(action, presentation, response, freshness); const nextProject = { ...value, candidateVersion: { ...value.candidateVersion, versionId: `${value.candidateVersion.versionId}:next` } }; const rebuilt = buildQueryNavigationProductProjection(nextProject); expect(buildProjectQueryNavigationSourceState(value)).toBeTruthy(); expect(chosen.selection.trace.nonDominatedCandidateRefs).toContain(action.actionCandidateRef); expect(route).toMatchObject({ destination: "SCIENTIFIC_INTERPRETATION", projectWriteAuthorized: false, humanDecisionCreated: false }); expect(rebuilt.projectVersion).not.toBe(chosen.projectVersion); expect(rebuilt.explanation.traceRef).not.toBe(chosen.explanation.traceRef); });
  it("QRY4-CLOSE-REPLAY keeps deterministic selection across equivalent reconstructions", () => { const value = project(true); const first = buildQueryNavigationProductProjection(value); const second = buildQueryNavigationProductProjection(structuredClone(value)); expect(second.sourceStateDigest).toBe(first.sourceStateDigest); expect(second.selection.trace.digest).toBe(first.selection.trace.digest); expect(second.selection.trace.nonDominatedCandidateRefs).toEqual(first.selection.trace.nonDominatedCandidateRefs); });
  it("multi-cycle replay keeps zero implicit duplicate question", () => { const value = project(true); const projection = buildQueryNavigationProductProjection(value); const candidate = projection.alternatives[0]!; const chosen = buildQueryNavigationProductProjection(value, projection.memory, candidate.candidateId); const action = chosen.selectedAction!; let memory = createQueryNavigationMemory(value.resultId, value.candidateVersion.versionId); const events = ["ACTION_SELECTED", "ACTION_PRESENTED", "ACTION_DEFERRED", "ACTION_REOPENED", "ACTION_PRESENTED", "RESPONSE_RECEIVED", "ACTION_COMPLETED", "ACTION_SUPERSEDED"] as const; events.forEach((eventType, index) => { memory = appendNavigationLifecycleEvent(memory, { eventType, actionRef: action.selectedActionId, presentationRef: chosen.questionPresentation?.presentationId ?? null, responseRef: eventType === "RESPONSE_RECEIVED" ? "response:1" : null, projectRef: value.resultId, projectVersion: value.candidateVersion.versionId, sourceStateDigest: chosen.sourceStateDigest, reason: eventType, evidenceRefs: index === 3 ? ["trigger:explicit"] : [], recordedAt: `2026-08-15T08:0${index}:00.000Z` }); }); const replay = replayQueryNavigationLifecycle(memory); expect(replay.validCausalOrder).toBe(true); expect(countImplicitDuplicatePresentations(memory.events)).toBe(0); });
});
