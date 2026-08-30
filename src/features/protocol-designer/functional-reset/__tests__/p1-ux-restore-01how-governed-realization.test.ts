import { describe, expect, it } from "vitest";
import {
  buildPreProjectNavigationDecision,
  realizePreProjectNavigationDecision,
  type PreProjectVisibleStructuredUnderstanding,
} from "@/features/query-navigation";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  recordPreProjectScientificTraceSegment,
} from "@/features/protocol-designer/scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "@/features/validation-architecture";
import { routeProductEntry } from "../product-entry-routing";

const OBSERVED_AT = "2026-08-30T16:00:00.000Z";
const CEC_INPUT = "je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";
const HUMAN_REJECTED_RESPONSE = "Je retiens ces différentes dimensions pour structurer notre démarche : d'une part, l'élévation de la troponine post-circulation extracorporelle comme témoin d'une souffrance myocardique ; d'autre part, l'utilisation de l'IRM cardiaque pour rechercher des lésions de nécrose ou de fibrose en rehaussement tardif, ainsi que pour quantifier une éventuelle modification de volume extracellulaire (ECV) ou de la contractilité.";
const NATURAL_GOVERNED_RESPONSE = "Je retiens l'élévation de la troponine après circulation extracorporelle comme hypothèse d'une atteinte myocardique à explorer en IRM. La première structure d'étude conserve trois branches distinctes : les lésions visibles en rehaussement tardif, une modification de l'ECV et une modification de la contractilité.";

const buildCase = (raw: string, caseId: string) => {
  const sourceTurnRef = `turn:p1-ux-restore-01how:${caseId}`;
  const routing = routeProductEntry({ raw, sourceTurnRef, routedAt: OBSERVED_AT });
  const decision = buildPreProjectNavigationDecision({ routing });
  const request: Omit<ProductBridgeRequest, "apiVersion"> = {
    requestKind: "USER_TURN",
    conversation: {
      conversationId: `conversation:p1-ux-restore-01how:${caseId}`,
      language: "fr",
      turns: [{ turnId: sourceTurnRef, role: "USER", content: raw, createdAt: OBSERVED_AT }],
    },
    currentProject: null,
    evaluatePersistentDelta: routing.projectConstructionEligible,
    preProjectNavigation: decision,
  };
  const structuredUnderstanding: PreProjectVisibleStructuredUnderstanding = {
    source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION",
    visibleToUser: true,
    representedDimensionRefs: routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef),
    projectWriteAuthorized: false,
  };
  return { sourceTurnRef, routing, decision, request, structuredUnderstanding };
};

describe("P1-UX-RESTORE-01HOW — governed WHAT fidelity in Gemini realization", () => {
  it("makes the pre-Project HOW boundary explicit without forbidding natural paraphrase", () => {
    expect(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION).toContain("enveloppe scientifique gouvernée");
    expect(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION).toContain("Tu peux reformuler naturellement, comprimer, réordonner");
    expect(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION).toContain("aucun concept scientifique, relation scientifique, mécanisme, interprétation");
    expect(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION).toContain("idée scientifiquement plausible mais absente");
    expect(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION).not.toMatch(/circulation extracorporelle|troponine|rehaussement tardif|fibrose|contractilit[ée]/iu);
  });

  it("projects existing QRY identities, provenance and the absence of governed structured relations without creating a second representation", () => {
    const testCase = buildCase(CEC_INPUT, "cec-envelope");
    const context = naturalConversationContext(testCase.request);

    expect(testCase.decision).toMatchObject({ owner: "QUERY_NAVIGATION", action: "PROPOSE" });
    expect(context).toContain("Enveloppe scientifique gouvernée de réalisation");
    expect(context).toContain(`provenance ${testCase.sourceTurnRef}`);
    expect(context).toContain("statut EXPLICIT_USER_STATED");
    expect(context).toContain("AUCUNE_RELATION_STRUCTURÉE_TRANSMISE");
    expect(context).toContain("AUCUN_STATUT_ADDITIONNEL_TRANSMIS");
    for (const dimension of testCase.decision.explicitDimensions) {
      expect(context).toContain(`[${dimension.dimensionRef}] ${dimension.sourceText}`);
    }
  });

  it("keeps natural equivalent wording accepted while preserving every governed CEC branch", () => {
    const testCase = buildCase(CEC_INPUT, "cec-natural");
    const realization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: NATURAL_GOVERNED_RESPONSE,
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_FIXTURE",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });

    expect(realization).toMatchObject({
      providerReplyAccepted: true,
      executor: "GEMINI_CONVERSATION_MODEL",
      assistantReply: NATURAL_GOVERNED_RESPONSE,
    });
    expect(NATURAL_GOVERNED_RESPONSE).toMatch(/atteinte myocardique/iu);
    expect(NATURAL_GOVERNED_RESPONSE).toMatch(/rehaussement tardif/iu);
    expect(NATURAL_GOVERNED_RESPONSE).toMatch(/ECV/iu);
    expect(NATURAL_GOVERNED_RESPONSE).toMatch(/contractilit[ée]/iu);
    expect(NATURAL_GOVERNED_RESPONSE).not.toMatch(/n[ée]crose|fibrose/iu);
    expect(testCase.decision.explicitDimensions.every((dimension) => !NATURAL_GOVERNED_RESPONSE.includes(dimension.sourceText))).toBe(true);
  });

  it("covers the same no-new-science class with a generic non-cardiac realization", () => {
    const raw = "Je veux créer une étude comparant la technique alpha et la technique bêta pour mesurer la réponse fonctionnelle gamma.";
    const testCase = buildCase(raw, "generic-non-cardiac");
    const reply = "Je propose de structurer l'étude autour de la comparaison entre les deux techniques, en conservant la réponse fonctionnelle comme mesure commune.";
    const realization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: reply,
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_FIXTURE",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });

    expect(realization.providerReplyAccepted).toBe(true);
    expect(reply).not.toContain("delta");
    expect(naturalConversationContext(testCase.request)).toContain("tout nouveau concept, relation, mécanisme, interprétation");
  });

  it("localizes the historical enrichment at QUESTION_FORMULATION_BOUNDARY using DIAGNOSTIC TRACE only", () => {
    const testCase = buildCase(CEC_INPUT, "historical-diagnostic");
    const traceRunId = createProductTraceRunId("session:p1-ux-restore-01how", testCase.sourceTurnRef);
    const segment = createPreProjectScientificTraceSegment({
      sessionId: "session:p1-ux-restore-01how",
      sourceTurnRef: testCase.sourceTurnRef,
      traceRunId,
      sourceText: CEC_INPUT,
      routing: testCase.routing,
      request: testCase.request,
      providerBoundary: {
        systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
        context: naturalConversationContext(testCase.request),
        assistantReply: HUMAN_REJECTED_RESPONSE,
        provider: "GOOGLE_GEMINI",
        model: "RECORDED_HISTORICAL_RESPONSE",
        formulationOwner: "GEMINI_CONVERSATION_MODEL",
        visibleStructuredUnderstandingDimensionRefs: testCase.structuredUnderstanding.representedDimensionRefs,
      },
      captureConfiguration: createScientificTraceCaptureConfiguration({
        captureLevel: "LEVEL_2_DIAGNOSTIC",
        captureReason: "MANUAL_DIAGNOSTIC",
      }),
    });
    const recorded = recordPreProjectScientificTraceSegment({
      ledger: createScientificExecutionTraceLedger("session:p1-ux-restore-01how"),
      traceRunId,
      conversationId: testCase.request.conversation.conversationId,
      segment,
      observedAt: OBSERVED_AT,
    });
    const projection = buildTraceInspectorRunProjection({ ledger: recorded.ledger, traceRunId });

    expect(testCase.decision.realizationDirective).not.toMatch(/n[ée]crose|fibrose/iu);
    expect(naturalConversationContext(testCase.request)).not.toMatch(/n[ée]crose|fibrose/iu);
    expect(HUMAN_REJECTED_RESPONSE).toMatch(/n[ée]crose|fibrose/iu);
    expect(segment.points[3]).toMatchObject({
      point: "QUESTION_FORMULATION_BOUNDARY",
      owner: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
    });
    expect(projection.ownerFacts).toEqual({
      askVsProposeOwner: "QUERY_NAVIGATION",
      whatToAskOwner: "QUERY_NAVIGATION",
      questionFormulationOwner: "GEMINI_CONVERSATION_MODEL",
      qryWhatLlmHowContract: "RESPECTED",
    });
    expect(projection.captureLevel).toBe("LEVEL_2_DIAGNOSTIC");
  });
});
