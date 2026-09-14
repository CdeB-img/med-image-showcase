import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation";
import {
  FUNCTIONAL_RESET_STORAGE_KEY,
  type FunctionalResetSession,
} from "../session";
import {
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";
import { dispatchScientificThinkingFromQuery, readScientificThinkingOutputFromLedger } from "../scientific-thinking-standard";
import { buildKnowledgeRequestFromCanonicalSnapshot, buildProjectContextSnapshot } from "@/features/research-project-construction";
import { invokeKnowledgeForProject } from "@/features/protocol-designer/product-knowledge-owner-runtime";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.request };
});

const REQUEST = "Je veux créer une étude longitudinale pour caractériser l’évolution de la fonction myocardique après une intervention.";
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
const submit = async (text: string) => {
  await waitFor(() => expect(screen.getByLabelText("Votre message")).not.toBeDisabled());
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const objectiveContribution = (turns: ScientificInterpretationTurn[]) => {
  const contribution = makeFunctionalResetContribution(turns);
  const source = contribution.scientificContent.candidateObjects[0]!;
  return {
    ...contribution,
    identity: {
      ...contribution.identity,
      contributionId: "contribution:scientific-stack-st-01:objective",
      contributionDigest: "digest:scientific-stack-st-01:objective",
    },
    scientificContent: {
      ...contribution.scientificContent,
      candidateObjects: [{
        ...source,
        itemId: "objective:scientific-stack-st-01:myocardial-function",
        semanticIdentity: "objective:myocardial-function:trajectory",
        proposedType: "OBJECTIVE",
        content: "Caractériser l’évolution longitudinale de la fonction myocardique après une intervention",
        studyRole: "PRIMARY",
      }],
      candidateRelations: [],
    },
  };
};

describe("SCIENTIFIC-STACK-ST-01 — corridor Standard réel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request: { conversation: { turns: ScientificInterpretationTurn[] } }) =>
      makeFunctionalResetBridgeResponse(
        request.conversation.turns,
        objectiveContribution(request.conversation.turns.filter((turn) => turn.role === "USER")),
        "Je vous présente cette intention pour confirmation.",
      ));
  });

  afterEach(cleanup);

  it("branche QRY sur Scientific Thinking après adoption, sans second appel provider ni écriture Project", async () => {
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: REQUEST } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await screen.findByText("Projet créé.");
    await waitFor(() => expect(stored().queryNavigation?.currentAction?.owner).toBe("SCIENTIFIC_THINKING"));
    await waitFor(() => expect(stored().scientificThinkingInteraction).not.toBeNull());

    const session = stored();
    const projectVersion = session.project?.versionId;
    expect(runtime.request).toHaveBeenCalledTimes(1);
    expect(session.queryNavigation?.currentAction).toMatchObject({
      owner: "SCIENTIFIC_THINKING",
      affectedDecisionRefs: ["project-section:QUESTION"],
    });
    expect(session.scientificThinkingInteraction).toMatchObject({
      owner: "SCIENTIFIC_THINKING",
      capabilityId: "SCIENTIFIC_THINKING_PROPOSAL",
      sourceProjectRef: session.project?.projectId,
      sourceProjectVersion: projectVersion,
      sourceProjectDigest: session.project?.projectDigest,
      status: "ACTIVE",
      projectWriteAuthorized: false,
    });
    expect(session.project?.versionId).toBe(projectVersion);
    expect(session.bridgeTraces.at(-1)).toMatchObject({
      requestKind: "POST_ADOPTION_QRY_CONTINUATION",
      provider: "NONE",
      calls: 0,
      continuationPresentationSource: "ST_STANDARD_PROJECTION",
    });

    const events = session.scientificExecutionTraceLedger.events;
    expect(events.some((event) => event.eventType === "QRY_ACTION_SELECTED"
      && event.common?.decisionOwner === "QUERY_NAVIGATION")).toBe(true);
    expect(events.some((event) => event.eventType === "OWNER_INVOCATION_COMPLETED"
      && event.owner === "SCIENTIFIC_THINKING"
      && event.common?.provider === "NONE")).toBe(true);
    expect(events.some((event) => event.eventType === "UI_PROJECTION"
      && event.common?.responsibilityOwner === "SCIENTIFIC_THINKING")).toBe(true);

    await waitFor(() => expect(screen.queryByText(/SCIENTIFIC_THINKING_PROPOSAL/)).toBeNull());
    expect(screen.queryByText(/scientific-thinking-output:/)).toBeNull();
  });

  it.each([
    ["je valide", "ADOPTED"],
    ["je refuse", "REJECTED"],
  ] as const)("enregistre %s sur une candidate Scientific Thinking présentée avec sa provenance", async (message, decision) => {
    renderDemo();
    await submit(REQUEST);
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(stored().scientificThinkingInteraction?.status).toBe("ACTIVE"));
    const before = stored();
    const output = readScientificThinkingOutputFromLedger({
      ledger: before.knowledgeOwnerLedger,
      resultRef: before.scientificThinkingInteraction!.ownerResultRef,
    })!;
    expect(output.questions.length + output.hypotheses.length).toBeGreaterThan(0);
    const selectionVerb = decision === "ADOPTED" ? "retiens" : "choisis";
    await submit(output.questions.length ? `Je ${selectionVerb} la question 1` : `Je ${selectionVerb} l’hypothèse 1`);
    await waitFor(() => expect(stored().scientificThinkingInteraction?.status).toBe("PENDING_HUMAN_REVIEW"));
    expect(stored().project!.revision).toBe(before.project!.revision);
    const candidateRef = stored().pendingContribution!.identity.contributionId;
    await submit(message);
    await waitFor(() => expect(stored().retainedContributionCandidates?.find((record) => record.candidateRef === candidateRef)?.humanDecision?.status).toBe(decision));
    const after = stored();
    const record = after.retainedContributionCandidates!.find((item) => item.candidateRef === candidateRef)!;
    const decisionTurn = after.runtimeTurns.find((turn) => turn.role === "USER" && turn.content === message)!;
    expect(record.humanDecision!.provenance).toContain(decisionTurn.turnId);
    expect(after.project!.revision).toBe(before.project!.revision + (decision === "ADOPTED" ? 1 : 0));
    if (decision === "REJECTED") expect(after.project!.projectDigest).toBe(before.project!.projectDigest);
    expect(runtime.request.mock.calls.filter(([request]) => request.requestKind !== "POST_ADOPTION_QRY_CONTINUATION")).toHaveLength(1);
  });

  it("distingue l'identité Knowledge et réutilise seulement l'entrée native exacte", async () => {
    renderDemo();
    await submit(REQUEST);
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(stored().scientificThinkingInteraction?.status).toBe("ACTIVE"));
    const session = stored();
    const project = session.project!;
    const snapshot = buildProjectContextSnapshot({ project });
    const at = "2026-09-14T13:00:00.000Z";
    const request = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: snapshot, question: "Quelles connaissances locales sont disponibles ?", createdAt: at,
    });
    const knowledge = invokeKnowledgeForProject({
      project, projectSnapshot: snapshot, knowledgeRequest: request, ledger: session.knowledgeOwnerLedger,
      callerRef: "test:exact-st-reuse", purpose: request.originalQuestion, startedAt: at, completedAt: at,
    });
    const enriched = invokeScientificThinkingForProject({
      project, projectSnapshot: snapshot, knowledgeResultId: knowledge.result!.resultId, ledger: knowledge.ledger,
      callerRef: "test:exact-st-reuse", purpose: session.queryNavigation!.currentAction!.reason, startedAt: at, completedAt: at,
    });
    const original = session.knowledgeOwnerLedger.entries.find((entry) => entry.result?.resultId === session.scientificThinkingInteraction!.ownerResultRef)!;
    expect(enriched.request.nativeInput.requestId).not.toBe((original.request.nativeInput as { requestId: string }).requestId);
    expect(enriched.request.nativeInput).not.toEqual(original.request.nativeInput);
    const reused = dispatchScientificThinkingFromQuery({
      project, navigation: session.queryNavigation!, ownerResultLedger: enriched.ledger,
      traceLedger: session.scientificExecutionTraceLedger, sessionId: session.sessionId, conversationId: session.conversationId,
      presentationTurnRef: "turn:exact-st-reuse", startedAt: at, completedAt: at,
    });
    expect(reused.output).toEqual(original.result!.nativePayload);
    expect(reused.ownerResultLedger.entries).toHaveLength(enriched.ledger.entries.length);
    expect(reused.output.knowledgeDependencies).toEqual([]);
  });
});
