import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { logicalDigest } from "@/features/knowledge-engine";
import { ProductBridgeClientError } from "@/features/protocol-designer/product-bridge-client";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";
import { makeFunctionalResetBridgeResponseForRequest } from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({
  bridge: vi.fn(),
  language: vi.fn(),
}));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  ProductBridgeClientError: class ProductBridgeClientError extends Error {
    constructor(readonly code: string, message: string, readonly diagnostic: unknown = null) { super(message); }
  },
  requestProtocolDesignerBridge: runtime.bridge,
  requestConversationLanguageProjection: runtime.language,
}));

const ENGLISH_FIC_D = "We want to build a prospective multicenter study using quantitative cardiac MRI across different manufacturers, field strengths and software versions. The aim is to compare a disease population with a reference population. A central Core Lab is planned, but acquisition harmonization, quality control, reader organization and analysis strategy are not yet fixed.";
const FRENCH_WORKING = "Nous voulons construire une étude prospective multicentrique utilisant la MRI cardiaque quantitative avec différents fabricants, champs magnétiques et versions logicielles. L’objectif est de comparer une population atteinte d’une maladie à une population de référence. Un Core Lab central est prévu, mais l’harmonisation des acquisitions, le contrôle qualité, l’organisation des lecteurs et la stratégie d’analyse ne sont pas encore fixés.";
const ENGLISH_VISIBLE = "I preserved the supplied scientific dimensions in a structured continuation; no Project decision has been made.";

const storedSession = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const projectionResponse = (request: {
  projectionKind: "INPUT_TO_FRENCH" | "OUTPUT_FROM_FRENCH";
  sourceText: string;
  sourceLanguageHint: string;
  targetLanguage: string;
  projectionIdentityDigest: string;
}) => {
  const translatedText = request.projectionKind === "INPUT_TO_FRENCH" ? FRENCH_WORKING : ENGLISH_VISIBLE;
  return {
    apiVersion: "1.0.0",
    operation: "LANGUAGE_PROJECTION",
    projection: {
      contract: "CONVERSATION_LANGUAGE_PROJECTION",
      contractVersion: "1.0.0",
      projectionId: `language-projection:${request.projectionIdentityDigest}`,
      projectionKind: request.projectionKind,
      sourceTextDigest: logicalDigest(request.sourceText),
      sourceLanguage: request.sourceLanguageHint.toLowerCase(),
      targetLanguage: request.targetLanguage.toLowerCase(),
      translatedText,
      translatedTextDigest: logicalDigest(translatedText),
      providerResultDigest: logicalDigest({ translatedText, projectionKind: request.projectionKind }),
      status: "SUCCEEDED",
      supportStatus: "SUPPORTED",
      qualificationStatus: "QUALIFIED",
      provider: "GOOGLE_GEMINI",
      model: "gemini-3.5-flash-lite",
      providerResponseId: `provider:${request.projectionKind}`,
      providerCalls: 1,
      translationContractVersion: "1.0.0",
      ambiguityPreserved: true,
      limitations: [],
      invariants: [],
      createdAt: "2026-09-04T12:00:00.000Z",
      projectWriteAuthorized: false,
      scientificDecisionAuthorized: false,
    },
    observability: { provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite", calls: 1, latencyMs: 1 },
  } as const;
};

describe("MULTILINGUAL-CONVERSATION-GATEWAY-01 — Standard integration", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/protocol-designer/demo");
    window.localStorage.clear();
    runtime.bridge.mockReset();
    runtime.language.mockReset();
    runtime.bridge.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request, null));
    runtime.language.mockImplementation(async (request) => projectionResponse(request));
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("routes the exact English campaign witness from French, localizes the response, and shares one state with Expert", async () => {
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: ENGLISH_FIC_D } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());
    expect(storedSession().entries.at(-1)).toMatchObject({ kind: "TEXT", role: "NOXIA", content: ENGLISH_VISIBLE });
    expect(screen.getByLabelText("Conversation")).toHaveTextContent(ENGLISH_VISIBLE);
    expect(runtime.language).toHaveBeenCalledTimes(2);
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    const bridgeRequest = runtime.bridge.mock.calls[0][0];
    expect(bridgeRequest.conversation).toMatchObject({ language: "fr", turns: [expect.objectContaining({ content: ENGLISH_FIC_D })] });
    expect(bridgeRequest.languageBoundary).toMatchObject({
      workingLanguage: "fr",
      turnProjections: [expect.objectContaining({
        frenchWorkingText: FRENCH_WORKING,
        originalIsImmutableEvidence: true,
        workingProjectionIsUserLiteral: false,
      })],
    });

    await waitFor(() => expect(storedSession().conversationLanguageGateway.responses).toHaveLength(1));
    const standardState = window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!;
    const state = storedSession();
    expect(state.runtimeTurns[0].content).toBe(ENGLISH_FIC_D);
    expect(state.runtimeTurns[1].content).toMatch(/[éèà]/u);
    expect(state.entries.some((entry) => entry.kind === "TEXT" && entry.role === "NOXIA" && entry.content === ENGLISH_VISIBLE)).toBe(true);
    expect(state.conversationLanguageGateway).toMatchObject({
      conversationLanguage: "en",
      projectWriteAuthorized: false,
      scientificDecisionAuthorized: false,
      turns: [expect.objectContaining({ originalText: ENGLISH_FIC_D, frenchWorkingText: FRENCH_WORKING })],
      responses: [expect.objectContaining({ internalFrenchResponse: expect.any(String), localizedResponse: ENGLISH_VISIBLE })],
    });
    const traceStages = state.scientificExecutionTraceLedger.events.map((event) => event.common?.stage ?? event.eventType);
    expect(traceStages).toEqual(expect.arrayContaining([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROJECTION_CREATED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
      "RESPONSE_LOCALIZED",
    ]));
    expect(screen.queryByTestId("trace-inspector")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Expert" }));
    const inspector = screen.getByTestId("trace-inspector");
    expect(within(inspector).getByTestId("trace-event-LANGUAGE_DETECTED")).toBeInTheDocument();
    expect(within(inspector).getByTestId("trace-event-ROUTE_SELECTED")).toBeInTheDocument();
    expect(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe(standardState);
  });

  it("fails closed before the Router when the required input projection fails and preserves retry/provenance facts", async () => {
    runtime.language.mockRejectedValueOnce(new ProductBridgeClientError(
      "LANGUAGE_PROJECTION_PROVIDER_FAILURE",
      "Cette langue ne peut pas être traitée pour le moment.",
    ));
    const original = "1.5 T と 3 T の MRI を比較する研究を計画したいです。";
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: original } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("projection linguistique nécessaire n’a pas abouti");
    expect(runtime.bridge).not.toHaveBeenCalled();
    await waitFor(() => expect(storedSession().conversationLanguageGateway.failures).toHaveLength(1));
    const state = storedSession();
    expect(state.runtimeTurns).toContainEqual(expect.objectContaining({ role: "USER", content: original }));
    expect(state.conversationLanguageGateway.failures[0]).toMatchObject({
      projectionKind: "INPUT_TO_FRENCH",
      sourceLanguage: "ja",
      targetLanguage: "fr",
      failureCategory: "LANGUAGE_PROJECTION_PROVIDER_FAILURE",
      retryStatus: "NOT_RETRIED",
      projectWriteAuthorized: false,
      scientificDecisionAuthorized: false,
    });
    const stages = state.scientificExecutionTraceLedger.events.map((event) => event.common?.stage ?? event.eventType);
    expect(stages).toEqual([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROJECTION_FAILED",
      "ERROR_BOUNDARY",
    ]);
    expect(stages).not.toContain("ROUTE_SELECTED");
    expect(state.project).toBeNull();
  });

  it("attributes an output-localization failure to the canonical French response rather than the original user text", async () => {
    runtime.language
      .mockImplementationOnce(async (request) => projectionResponse(request))
      .mockRejectedValueOnce(new ProductBridgeClientError(
        "LANGUAGE_PROJECTION_PROVIDER_FAILURE",
        "Cette langue ne peut pas être traitée pour le moment.",
      ));
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: ENGLISH_FIC_D } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("projection linguistique nécessaire n’a pas abouti");
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(runtime.language).toHaveBeenCalledTimes(2);
    const outputProjectionRequest = runtime.language.mock.calls[1][0];
    const state = storedSession();
    expect(state.conversationLanguageGateway.failures[0]).toMatchObject({
      projectionKind: "OUTPUT_FROM_FRENCH",
      sourceTextDigest: logicalDigest(outputProjectionRequest.sourceText),
      sourceLanguage: "fr",
      targetLanguage: "en",
      retryStatus: "NOT_RETRIED",
    });
    expect(state.conversationLanguageGateway.failures[0].sourceTextDigest).not.toBe(logicalDigest(ENGLISH_FIC_D));
    const stages = state.scientificExecutionTraceLedger.events.map((event) => event.common?.stage ?? event.eventType);
    expect(stages).toContain("LANGUAGE_PROJECTION_FAILED");
    expect(stages).not.toContain("RESPONSE_LOCALIZED");
  });

  it("binds an explicit Standard LEVEL_2 request before language projection and routing", async () => {
    window.history.replaceState({}, "", "/protocol-designer/demo?traceCaptureLevel=LEVEL_2_DIAGNOSTIC");
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: ENGLISH_FIC_D } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());
    const state = storedSession();
    const run = state.scientificExecutionTraceLedger.runBindings[0];
    const events = state.scientificExecutionTraceLedger.events
      .filter((event) => event.runId === run.runId)
      .map((event) => event.common!);
    expect(run.captureConfiguration).toMatchObject({
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      captureReason: "MANUAL_DIAGNOSTIC",
    });
    expect(events.every((event) => event.captureLevel === "LEVEL_2_DIAGNOSTIC")).toBe(true);
    expect(events.map((event) => event.stage)).toEqual(expect.arrayContaining([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROVIDER_RESULT_RECEIVED",
      "LANGUAGE_PROJECTION_MATERIALIZATION_STARTED",
      "LANGUAGE_PROJECTION_MATERIALIZED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
    ]));
    expect(events.map((event) => event.stage)).not.toContain("LANGUAGE_PROJECTION_CREATED");
  });

  it("keeps an exact conformance rejection reconstructible at Standard LEVEL_2 without routing", async () => {
    window.history.replaceState({}, "", "/protocol-designer/demo?traceCaptureLevel=LEVEL_2_DIAGNOSTIC");
    runtime.language.mockRejectedValueOnce(new ProductBridgeClientError(
      "LANGUAGE_PROJECTION_CONTRACT_FAILED:LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS",
      "La projection linguistique n’a pas conservé les invariants requis.",
      {
        contract: "LANGUAGE_PROJECTION_CONTRACT_FAILURE_DIAGNOSTIC",
        contractVersion: "1.0.0",
        subInvariantIds: ["LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS"],
        provider: "GOOGLE_GEMINI",
        model: "gemini-3.5-flash-lite",
        providerResponseId: "provider:contract-rejected",
        providerResultDigest: "digest:contract-rejected-provider-result",
      },
    ));
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: ENGLISH_FIC_D } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("projection linguistique nécessaire n’a pas abouti");
    expect(runtime.bridge).not.toHaveBeenCalled();
    const state = storedSession();
    const events = state.scientificExecutionTraceLedger.events.map((event) => event.common!);
    expect(events.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROVIDER_RESULT_RECEIVED",
      "LANGUAGE_PROJECTION_MATERIALIZATION_STARTED",
      "LANGUAGE_PROJECTION_CONTRACT_REJECTED",
      "ERROR_BOUNDARY",
    ]);
    expect(events[4]).toMatchObject({
      reasonCode: "LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS",
      provider: "GOOGLE_GEMINI",
      component: { componentVersion: "1.0.0" },
      input: [expect.objectContaining({
        version: "gemini-3.5-flash-lite",
        digest: "digest:contract-rejected-provider-result",
      })],
    });
    expect(JSON.stringify(events)).not.toContain(ENGLISH_FIC_D);
  });
});
