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

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.request };
});

const REQUEST = "Je veux créer une étude longitudinale pour caractériser l’évolution de la fonction myocardique après une intervention.";
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;

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
});
