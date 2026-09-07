import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import { buildMultilingualUserTurn, detectConversationLanguage } from "@/features/protocol-designer/conversation-language-gateway";
import {
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  listEndToEndTraceEvents,
  recordConversationLanguageGatewayTrace,
  recordProductEntryRoutingTrace,
} from "@/features/protocol-designer/scientific-execution-trace";
import { routeProductEntry } from "../product-entry-routing";

const OBSERVED_AT = "2026-09-07T15:00:00.000Z";

describe("FROZEN-INTEGRATED-CAMPAIGN-02-BOUNDED-REPAIR-02 — Product Entry", () => {
  it("preserves a pure UNDERSTAND route without opening construction", () => {
    const routing = routeProductEntry({
      raw: "Je veux comprendre le rôle général de la perfusion en IRM.",
      sourceTurnRef: "turn:repair-02:understand",
      routedAt: OBSERVED_AT,
    });
    expect(routing).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: false,
      projectConstructionEligible: false,
    });
    expect(routing.secondaryRouteIntents).not.toContain("DESIGN_STUDY");
  });

  it("keeps a pure methodological comparison outside construction", () => {
    const routing = routeProductEntry({
      raw: "Quelles différences existe-t-il entre une cohorte et un essai randomisé ?",
      sourceTurnRef: "turn:repair-02:pure-comparison",
      routedAt: OBSERVED_AT,
    });
    expect(routing).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: false,
      projectConstructionEligible: false,
    });
  });

  it("keeps an explicit construction finality reachable", () => {
    const routing = routeProductEntry({
      raw: "Nous voulons construire une étude prospective pour mesurer ce phénomène.",
      sourceTurnRef: "turn:repair-02:explicit-construction",
      routedAt: OBSERVED_AT,
    });
    expect(routing).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
  });

  it("recognizes an action bound to a declared study plan without treating the design noun alone as finality", () => {
    const routing = routeProductEntry({
      raw: "Je veux étudier l’effet du traitement dans une étude multicentrique comparant intervention et placebo.",
      sourceTurnRef: "turn:repair-02:structured-plan",
      routedAt: OBSERVED_AT,
    });
    expect(routing).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
  });

  it("preserves a secondary construction finality without replacing the primary UNDERSTAND intent", () => {
    const raw = "Nous avons des données historiques d’imagerie et pouvons recruter prospectivement de nouveaux participants. Nous voulons comprendre l’évolution du signal, mais le plan d’étude, le calendrier, le critère principal et le rôle des modalités ne sont pas encore décidés.";
    const routing = routeProductEntry({ raw, sourceTurnRef: "turn:repair-02:mixed", routedAt: OBSERVED_AT });
    expect(routing).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
    expect(routing.secondaryRouteIntents).toContain("DESIGN_STUDY");
    expect(routing.scientificContext.secondaryRouteIntents).toContain("DESIGN_STUDY");
  });

  it("routes an explicit generic validation operation to the construction corridor", () => {
    const raw = "Nous avons développé une mesure quantitative automatisée. Nous voulons la valider dans plusieurs centres contre une évaluation de référence, mais le cadre exact et le critère principal restent à définir.";
    const routing = routeProductEntry({ raw, sourceTurnRef: "turn:repair-02:validation", routedAt: OBSERVED_AT });
    expect(routing).toMatchObject({ routeIntent: "DESIGN_STUDY", projectConstructionEligible: true });
  });

  it("does not turn weak uncertainty into an artificial construction decision", () => {
    const routing = routeProductEntry({
      raw: "Je souhaite comprendre si le signal varie, mais l’interprétation reste incertaine.",
      sourceTurnRef: "turn:repair-02:weak",
      routedAt: OBSERVED_AT,
    });
    expect(routing.routeIntent).toBe("UNDERSTAND");
    expect(routing.projectConstructionEligible).toBe(false);
  });

  it("retains an established secondary construction intent across a low-information follow-up", () => {
    const first = routeProductEntry({
      raw: "Nous voulons comprendre ce phénomène, mais le plan d’étude et le critère principal restent à définir.",
      sourceTurnRef: "turn:repair-02:continuity:1",
      routedAt: OBSERVED_AT,
    });
    const followUp = routeProductEntry({
      raw: "Oui, exactement.",
      sourceTurnRef: "turn:repair-02:continuity:2",
      routedAt: OBSERVED_AT,
      previousContext: first.scientificContext,
    });
    expect(first).toMatchObject({ routeIntent: "UNDERSTAND", constructionIntentPresent: true });
    expect(followUp).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
    expect(followUp.secondaryRouteIntents).toContain("DESIGN_STUDY");
  });

  it("retains an established primary construction corridor across a low-information follow-up", () => {
    const first = routeProductEntry({
      raw: "Nous voulons construire une étude prospective pour mesurer ce phénomène.",
      sourceTurnRef: "turn:repair-02:primary-continuity:1",
      routedAt: OBSERVED_AT,
    });
    const followUp = routeProductEntry({
      raw: "Oui, exactement.",
      sourceTurnRef: "turn:repair-02:primary-continuity:2",
      routedAt: OBSERVED_AT,
      previousContext: first.scientificContext,
    });
    expect(first).toMatchObject({ routeIntent: "DESIGN_STUDY", constructionIntentPresent: true });
    expect(followUp).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
  });

  it("keeps the mixed-intent responsibility chain inside existing LEVEL_2 TRACE", () => {
    const raw = "Nous voulons comprendre ce phénomène, mais le plan d’étude et le critère principal restent à définir.";
    const turn = buildMultilingualUserTurn({
      turnId: "turn:repair-02:trace",
      originalText: raw,
      detection: detectConversationLanguage(raw),
      currentConversationLanguage: null,
      projection: null,
    });
    const traceRunId = createProductTraceRunId("session:repair-02", turn.turnId);
    const captureConfiguration = createScientificTraceCaptureConfiguration({
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      captureReason: "MANUAL_DIAGNOSTIC",
    });
    let ledger = recordConversationLanguageGatewayTrace({
      ledger: createScientificExecutionTraceLedger("session:repair-02"),
      traceRunId,
      conversationId: "conversation:repair-02",
      turn,
      observedAt: OBSERVED_AT,
      captureConfiguration,
    });
    const routing = routeProductEntry({ raw, sourceTurnRef: turn.turnId, routedAt: OBSERVED_AT });
    ledger = recordProductEntryRoutingTrace({
      ledger,
      traceRunId,
      conversationId: "conversation:repair-02",
      routing,
      routerInputRef: turn.turnId,
      routerInputDigest: logicalDigest(raw),
      observedAt: OBSERVED_AT,
    });
    const events = listEndToEndTraceEvents({ ledger, traceRunId });
    expect(routing).toMatchObject({ routeIntent: "UNDERSTAND", projectConstructionEligible: true });
    expect(events.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROJECTION_NOT_REQUIRED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
    ]);
    expect(events.every((event) => event.captureLevel === "LEVEL_2_DIAGNOSTIC")).toBe(true);
    expect(events.find((event) => event.stage === "ROUTE_SELECTED")?.output[0]?.digest).toBe(logicalDigest({
      routeIntent: routing.routeIntent,
      routeReasons: routing.routeReasons,
      secondaryRouteIntents: routing.secondaryRouteIntents,
      constructionIntentPresent: routing.constructionIntentPresent,
      projectConstructionEligible: routing.projectConstructionEligible,
    }));
  });
});
