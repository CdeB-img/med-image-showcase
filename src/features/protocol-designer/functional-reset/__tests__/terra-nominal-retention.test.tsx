import { explicitTestSave } from "./legacy-persistence-test-adapter";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { createFunctionalResetSession, type FunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import type { ProductBridgeRequest } from "../../product-bridge";
import { behaviorAuthority, adoptBehaviorContribution, richStudyContribution } from "./p1-behavior-01a-contract-fixtures";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { cleanup(); bridge.mockReset(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("seven real submitTerraText paths consume same-call owner receipts, persist/reload and retain the first unadopted condition", async () => {
  const network = vi.fn(() => { throw new Error("PROVIDER_FORBIDDEN"); }); vi.stubGlobal("fetch", network);
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
  const at = "2026-10-04T12:00:00.000Z";
  const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
  const session = createFunctionalResetSession(at);
  session.project = project; session.projectId = project.projectId; session.projectAuthority = behaviorAuthority;
  session.conversationId = "conversation:p1-behavior-01a";
  const requests: Omit<ProductBridgeRequest, "apiVersion">[] = [];
  let saved: FunctionalResetSession | undefined;
  const noMeaning = { coverage: "COMPLETE", nonPersistentReason: "NO_SCIENTIFIC_MEANING", elements: [] };
  bridge.mockImplementation(async (request: Omit<ProductBridgeRequest, "apiVersion">) => {
    requests.push(request);
    const reply = `synthetic-nominal-reply-${requests.length}`;
    return { apiVersion: "1.0.0", assistantReply: reply,
      assistantTurn: { turnId: reply, role: "NOXIA", content: reply, createdAt: at }, conversationFailure: null,
      scientificConversation: { owner: "SCIENTIFIC_THINKING", responseOwner: "LLM", outcome: "NATIVE_TEXT", projectWrites: 0,
        projectWriteAuthorized: false, retainedScientificResult: { reply,
          userContribution: requests.length === 1 ? { coverage: "COMPLETE", nonPersistentReason: null,
            elements: [{ id: "independent-control", content: "Condition de contrôle indépendante encore à discuter.",
              epistemicState: "OPEN_UNKNOWN", polarity: "CONDITIONAL", conditions: ["Pas encore décidée"], linkedIds: [] }] } : noMeaning,
          assistantContribution: noMeaning, dispositions: [], candidateBindings: [] } },
      persistentExtraction: { called: false, status: "NOT_REQUESTED", failure: null, providerArtifact: null,
        wireCandidate: null, candidate: null, validation: null, contribution: null },
      observability: { provider: "OPENAI", model: "NONE_NO_PROVIDER", calls: 0, conversationCalls: 0, providerCalls: [],
        projectWrites: 0, extractionAttempts: 0, conversationLatencyMs: 0, extractionLatencyMs: null } };
  });
  const before = logicalDigest(project);
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={explicitTestSave(value => {
    saved = JSON.parse(JSON.stringify(value)); return true;
  })} /></HelmetProvider>);
  for (let i = 0; i < 7; i++) {
    fireEvent.change(screen.getByRole("textbox"), { target: { value: i === 0
      ? "Une condition de contrôle indépendante demeure à discuter, sans décision ni préparation du projet."
      : `Merci pour cette explication ${i}.` } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByText(`synthetic-nominal-reply-${i + 1}`);
    await waitFor(() => expect(screen.queryByText("NOXIA réfléchit…")).not.toBeInTheDocument());
  }
  const firstRef = requests[0].conversation.turns[0].turnId;
  const last = requests.at(-1)!;
  expect(last.evaluatePersistentDelta).toBe(false);
  const packet = JSON.parse(prepareTerraConversation({ ...last, apiVersion: "1.0.0" }).context);
  expect(packet.RECENT_CONVERSATION.some(t => t.ref === firstRef)).toBe(false);
  expect(packet.CURRENT_DISCUSSION.retainedMeaning.some(e => e.sourceTurnRef === firstRef && e.content.includes("contrôle indépendante"))).toBe(true);
  expect(packet.UNPROJECTED_USER_CONTEXT).toBeUndefined();
  expect(saved!.scientificDiscussionRetention!.sourceCoverage).toHaveLength(14);
  expect(saved!.scientificDiscussionRetention!.elements).toHaveLength(1);
  expect(saved!.retainedContributionCandidates).toEqual([]);
  expect(logicalDigest(project)).toBe(before);
  expect(network).not.toHaveBeenCalled();
  expect(bridge).toHaveBeenCalledTimes(7);
});
