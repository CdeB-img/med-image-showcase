import { describe, expect, it } from "vitest";
import {
  buildPreProjectNavigationDecision,
  realizePreProjectNavigationDecision,
  type PreProjectVisibleStructuredUnderstanding,
} from "@/features/query-navigation";
import { routeProductEntry } from "../product-entry-routing";

const OBSERVED_AT = "2026-08-31T10:00:00.000Z";
const GENERIC_ACKNOWLEDGEMENT = "J’ai bien pris en compte les éléments scientifiques de votre demande. Je vous propose de les organiser dans une première compréhension structurée, que vous pourrez préciser avant toute confirmation.";
const ULTRA_TRAIL_INPUT = "je voudrais faire une étude sur les ultra trailers. cette population force beaucoup sur le coeur et je voudrais les explorer sur deux populations, une ultra trailers débutant et une confirmer pour voir si la discipline provoque une atteinte cardiaque. pour cela je compte utiliser l'irm ainsi que des prélevements sanguins";

const governedCase = (raw: string, caseId: string) => {
  const sourceTurnRef = `turn:p1-ux-gen-01:${caseId}`;
  const routing = routeProductEntry({ raw, sourceTurnRef, routedAt: OBSERVED_AT });
  const decision = buildPreProjectNavigationDecision({ routing });
  const structuredUnderstanding: PreProjectVisibleStructuredUnderstanding = {
    source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION",
    visibleToUser: true,
    representedDimensionRefs: routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef),
    projectWriteAuthorized: false,
  };
  return { routing, decision, structuredUnderstanding };
};

const fallbackFor = (raw: string, caseId: string, providerReply?: string | null) => {
  const testCase = governedCase(raw, caseId);
  const realization = realizePreProjectNavigationDecision({
    decision: testCase.decision,
    providerReply,
    structuredUnderstanding: testCase.structuredUnderstanding,
  });
  return { ...testCase, realization };
};

describe("P1-UX-GEN-01 — rich governed first-response specificity", () => {
  it.each([
    "Je veux faire une étude comparant la méthode alpha et la méthode bêta.",
    "Nous souhaitons faire un projet de recherche sur la réponse gamma.",
  ])("recognizes the generic French study-construction form without case vocabulary: %s", (raw) => {
    expect(routeProductEntry({ raw, sourceTurnRef: `turn:p1-ux-gen-01:faire:${raw}`, routedAt: OBSERVED_AT })).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      projectConstructionEligible: true,
    });
  });

  it("reproduces the Ultra-trail corridor and keeps every explicit dimension visible in a provider-free fallback", () => {
    const testCase = fallbackFor(ULTRA_TRAIL_INPUT, "ultra-trail", null);
    const dimensions = testCase.routing.explicitScientificDimensions.map((dimension) => dimension.sourceText).join(" ");

    expect(testCase.routing).toMatchObject({ routeIntent: "DESIGN_STUDY", projectConstructionEligible: true });
    expect(testCase.decision).toMatchObject({ owner: "QUERY_NAVIGATION", action: "PROPOSE" });
    expect(dimensions).toMatch(/ultra trailers/iu);
    expect(dimensions).toMatch(/d[ée]butant/iu);
    expect(dimensions).toMatch(/confirmer/iu);
    expect(dimensions).toMatch(/atteinte cardiaque/iu);
    expect(dimensions).toMatch(/irm/iu);
    expect(dimensions).toMatch(/pr[ée]levements sanguins/iu);
    expect(testCase.realization).toMatchObject({
      executor: "LOCAL_DETERMINISTIC_REALIZATION",
      providerReplyAccepted: false,
      conformanceReason: "LOCAL_QUALIFICATION_NO_PROVIDER_REPLY",
    });
    expect(testCase.realization.assistantReply).not.toBe(GENERIC_ACKNOWLEDGEMENT);
    expect(testCase.realization.assistantReply).toMatch(/ultra trailers/iu);
    expect(testCase.realization.assistantReply).toMatch(/d[ée]butant/iu);
    expect(testCase.realization.assistantReply).toMatch(/confirmer/iu);
    expect(testCase.realization.assistantReply).toMatch(/atteinte cardiaque/iu);
    expect(testCase.realization.assistantReply).toMatch(/irm/iu);
    expect(testCase.realization.assistantReply).toMatch(/pr[ée]levements sanguins/iu);
  });

  it.each([
    {
      id: "GEN-A",
      raw: "Je veux créer une étude sur la cohorte alpha, avec la méthode bêta et la réponse gamma à six mois.",
      visible: [/cohorte alpha/iu, /m[ée]thode b[êe]ta/iu, /r[ée]ponse gamma/iu],
    },
    {
      id: "GEN-B",
      raw: "Je veux créer une étude comparant le groupe alpha et le groupe bêta.",
      visible: [/groupe alpha/iu, /groupe b[êe]ta/iu],
    },
    {
      id: "GEN-C",
      raw: "Je veux créer une étude utilisant la méthode alpha ainsi que la méthode bêta.",
      visible: [/m[ée]thode alpha/iu, /m[ée]thode b[êe]ta/iu],
    },
  ])("$id preserves multiple governed semantic dimensions in the deterministic response", ({ id, raw, visible }) => {
    const testCase = fallbackFor(raw, id, null);
    expect(testCase.routing.projectConstructionEligible).toBe(true);
    expect(testCase.routing.explicitScientificDimensions.length).toBeGreaterThan(1);
    expect(testCase.realization.assistantReply).not.toBe(GENERIC_ACKNOWLEDGEMENT);
    for (const pattern of visible) expect(testCase.realization.assistantReply).toMatch(pattern);
  });

  it("GEN-D permits the compact generic response for a genuinely sparse request", () => {
    const testCase = fallbackFor("Je veux créer une étude.", "GEN-D", null);
    expect(testCase.routing.explicitScientificDimensions).toHaveLength(1);
    expect(testCase.realization.assistantReply).toBe(GENERIC_ACKNOWLEDGEMENT);
  });

  it("GEN-E uses a governed rich fallback when provider realization is unavailable or rejected", () => {
    const raw = "Je veux créer une étude comparant le groupe alpha et le groupe bêta avec la méthode gamma.";
    const unavailable = fallbackFor(raw, "GEN-E-unavailable", null);
    const rejected = fallbackFor(raw, "GEN-E-rejected", "D’accord.");

    for (const testCase of [unavailable, rejected]) {
      expect(testCase.realization.executor).toBe("LOCAL_DETERMINISTIC_REALIZATION");
      expect(testCase.realization.assistantReply).toMatch(/groupe alpha/iu);
      expect(testCase.realization.assistantReply).toMatch(/groupe b[êe]ta/iu);
      expect(testCase.realization.assistantReply).toMatch(/m[ée]thode gamma/iu);
      expect(testCase.realization.assistantReply).not.toMatch(/delta|biomarqueur|imagerie/iu);
    }
    expect(rejected.realization.conformanceReason).toBe("PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH");
  });

  it("GEN-F continues to accept a faithful natural provider paraphrase without verbatim source spans", () => {
    const testCase = governedCase(
      "Je veux créer une étude comparant le groupe alpha et le groupe bêta pour observer la réponse gamma.",
      "GEN-F",
    );
    const providerReply = "Je propose de structurer cette comparaison entre les deux groupes en conservant la réponse gamma comme objet d’observation commun.";
    const realization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply,
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_FIXTURE",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });

    expect(realization).toMatchObject({
      providerReplyAccepted: true,
      executor: "GEMINI_CONVERSATION_MODEL",
      assistantReply: providerReply,
    });
    expect(testCase.decision.explicitDimensions.every((dimension) => !providerReply.includes(dimension.sourceText))).toBe(true);
  });

  it("GEN-G preserves the existing rejection of a provider scientific WHAT shift", () => {
    const testCase = governedCase(
      "Je veux créer une étude comparant le groupe alpha et le groupe bêta.",
      "GEN-G",
    );
    const realization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: "Je propose d’abandonner cette comparaison et de la remplacer par un biomarqueur delta.",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });

    expect(realization).toMatchObject({
      providerReplyAccepted: false,
      executor: "LOCAL_DETERMINISTIC_REALIZATION",
      conformanceReason: "PROVIDER_PROPOSAL_REJECTED_QRY_WHAT_SHIFT",
    });
    expect(realization.assistantReply).not.toMatch(/biomarqueur delta/iu);
  });
});
