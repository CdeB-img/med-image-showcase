import { describe, expect, it } from "vitest";
import { canonicalModality } from "../modality";
import { executeKnowledgeEngine } from "../engine";
import { projectUnderstandResult } from "../understand-projection";
import {
  executeProductUnderstandInteraction,
  routeProductEntry,
} from "../../protocol-designer/functional-reset/product-entry-routing";

const CREATED_AT = "2026-08-28T10:00:00.000Z";
const CASE_A = "Je voudrais comprendre le rôle du no-reflow après reperfusion et stenting dans le STEMI en IRM cardiaque.";
const CASE_B = "Je voudrais comprendre les différences entre la mesure de l’ECV en IRM et en CT. Je ne souhaite pas concevoir une étude ni un protocole.";
const CASE_C = "Je voudrais comprendre le rôle du T1 en IRM.";

const route = (raw: string, id: string) => routeProductEntry({
  raw,
  sourceTurnRef: `turn:01k:${id}`,
  routedAt: CREATED_AT,
});

describe("PRODUCT-CHECKPOINT-01K — owner-bounded UNDERSTAND runtime repair", () => {
  it("A — resolves an admitted graph identity without losing the raw term or inventing equivalence", () => {
    const decision = route(CASE_A, "a");
    const interaction = executeProductUnderstandInteraction({ raw: CASE_A, decision, createdAt: CREATED_AT });
    const result = executeKnowledgeEngine({ originalQuestion: CASE_A, createdAt: CREATED_AT });
    const stemi = result.resolvedConcepts.find((concept) => concept.conceptId === "noxia:radiology:disease:stemi");
    const direct = result.synthesis.responseProfile.directConclusionIds
      .map((id) => result.synthesis.conclusions.find((conclusion) => conclusion.conclusionId === id))
      .filter(Boolean);

    expect(decision.routeIntent).toBe("UNDERSTAND");
    expect(stemi).toMatchObject({ kind: "KNOWN_ALIAS", originalTerms: ["STEMI"], providerConcepts: { "knowledge-graph": ["noxia:radiology:disease:stemi"] } });
    expect(result.unresolvedConcepts.map((term) => term.toLocaleLowerCase("fr-FR"))).not.toContain("stemi");
    expect(result.queryPlan.providerSelections).toContainEqual(expect.objectContaining({ providerId: "knowledge-graph", included: true }));
    expect(result.queryPlan.resolvedRelations).toContainEqual(expect.objectContaining({ relation: "CONTEXT_DEPENDENT_RELATION" }));
    expect(result.queryPlan.resolvedRelations).not.toContainEqual(expect.objectContaining({ relation: "SAME_AS" }));
    expect(direct.some((conclusion) => conclusion?.semanticRelation?.predicate === "REPRESENTS")).toBe(true);
    expect(interaction.assistantReply).toMatch(/reperfusion/iu);
    expect(interaction).toMatchObject({ projectWrites: 0, protocolProjections: 0, externalCalls: 0 });
  });

  it("A sibling — resolves another governed graph disease by its admitted label", () => {
    const raw = "Comprendre le rôle de l’AVC ischémique aigu en IRM.";
    const result = executeKnowledgeEngine({ originalQuestion: raw, createdAt: CREATED_AT });
    expect(result.resolvedConcepts).toContainEqual(expect.objectContaining({
      conceptId: "noxia:radiology:disease:acute-ischemic-stroke",
      originalTerms: ["AVC ischémique aigu"],
    }));
  });

  it("A anti-overreach — does not resolve a governed slug inside an unrelated longer token", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre STEMIOLOGY en IRM.", createdAt: CREATED_AT });
    expect(result.resolvedConcepts.map((concept) => concept.conceptId)).not.toContain("noxia:radiology:disease:stemi");
  });

  it("B — preserves plural comparison, both modality branches and both explicit refusals", () => {
    const decision = route(CASE_B, "b");
    const interaction = executeProductUnderstandInteraction({ raw: CASE_B, decision, createdAt: CREATED_AT });
    const result = executeKnowledgeEngine({ originalQuestion: CASE_B, exclusions: decision.explicitExclusions.map((item) => item.code), createdAt: CREATED_AT });
    const projection = projectUnderstandResult(result);
    const direct = result.synthesis.responseProfile.directConclusionIds
      .map((id) => result.synthesis.conclusions.find((conclusion) => conclusion.conclusionId === id))
      .filter(Boolean);
    const allowedItemIds = new Set([
      ...result.applicableAssertions.map((assertion) => assertion.revision),
      ...result.documentaryStatements.map((statement) => statement.statementId),
    ]);
    const scopedSourceIds = new Set([
      ...result.evidence.map((evidence) => evidence.sourceId),
      ...result.documentaryStatements.map((statement) => statement.sourceId),
    ]);

    expect(decision.routeIntent).toBe("UNDERSTAND");
    expect(decision.scientificContext.detectedRelationships).toContain("comparaison explicitement demandée");
    expect(decision.explicitExclusions.map((item) => item.code)).toEqual(["NO_STUDY", "NO_PROTOCOL"]);
    expect(decision.projectConstructionEligible).toBe(false);
    expect(result.request).toMatchObject({ requestType: "COMPARE", knowledgePurpose: "COMPARE" });
    expect(result.queryPlan.branches.map((branch) => branch.modality)).toEqual(["MRI", "CT"]);
    expect(result.applicableAssertions.filter((assertion) => assertion.modality && canonicalModality(assertion.modality) === "CT").length).toBeGreaterThanOrEqual(7);
    expect(direct.some((conclusion) => {
      const relation = `${conclusion?.semanticRelation?.subject ?? ""} ${conclusion?.semanticRelation?.object ?? ""}`;
      return /(?:mr|irm)/iu.test(relation) && /ct/iu.test(relation);
    })).toBe(true);
    expect(projection.comparison?.branches.map((branch) => branch.label)).toEqual(["IRM", "CT"]);
    expect(result.gaps).toContainEqual(expect.objectContaining({ scope: "DIRECT_COMPARISON" }));
    expect(result.limitations).toContain("NO_GENERAL_MRI_CT_COMPARISON");
    expect(projection.limitations.join(" ")).toMatch(/comparaison générale IRM\/CT/iu);
    expect(projection.limitations.join(" ")).not.toMatch(/assertion scientifique.*vide|single criterion specificity/iu);
    expect(result.evidence.every((evidence) => allowedItemIds.has(evidence.assertionId))).toBe(true);
    expect(result.sources.every((source) => scopedSourceIds.has(source.sourceId))).toBe(true);
    expect(interaction).toMatchObject({ projectWrites: 0, protocolProjections: 0, externalCalls: 0 });
  });

  it("B sibling — recognizes another plural comparison expression without creating Study Design", () => {
    const raw = "Je veux comprendre les similitudes entre l’OEF mesurée en PET et en IRM.";
    const decision = route(raw, "b-sibling");
    const result = executeKnowledgeEngine({ originalQuestion: raw, createdAt: CREATED_AT });
    expect(decision).toMatchObject({ routeIntent: "UNDERSTAND", projectConstructionEligible: false });
    expect(decision.scientificContext.detectedRelationships).toContain("comparaison explicitement demandée");
    expect(result.request.requestType).toBe("COMPARE");
    expect(result.queryPlan.branches.map((branch) => branch.modality)).toEqual(expect.arrayContaining(["PET", "MRI"]));
  });

  it("comparison anti-overreach — a single-context explanation creates no comparison branch or gap", () => {
    const raw = "Comprendre le rôle du T2 en IRM.";
    const decision = route(raw, "no-comparison");
    const result = executeKnowledgeEngine({ originalQuestion: raw, createdAt: CREATED_AT });
    expect(decision.scientificContext.detectedRelationships).not.toContain("comparaison explicitement demandée");
    expect(result.request.requestType).toBe("EXPLAIN");
    expect(result.coverageMap.items.some((item) => item.branchId === "comparison:direct")).toBe(false);
    expect(result.gaps.some((gap) => gap.scope === "DIRECT_COMPARISON")).toBe(false);
  });

  it("C — keeps the governed ambiguity and removes only the unrelated comparison artifact", () => {
    const decision = route(CASE_C, "c");
    const interaction = executeProductUnderstandInteraction({ raw: CASE_C, decision, createdAt: CREATED_AT });
    const result = executeKnowledgeEngine({ originalQuestion: CASE_C, createdAt: CREATED_AT });
    const projection = projectUnderstandResult(result);
    const ambiguous = result.resolvedConcepts.find((concept) => concept.conceptId === "ambiguous:t1");

    expect(result.queryPlan.domainGate).toBe("CLARIFICATION_REQUIRED");
    expect(ambiguous?.candidateSenses?.map((sense) => sense.conceptId)).toEqual(["method:t1-mapping", "measurement:native-t1"]);
    expect(ambiguous?.candidateSenses?.every((sense) => Object.keys(sense.providerConcepts).length > 0)).toBe(true);
    expect(result.gaps).toContainEqual(expect.objectContaining({ scope: "AMBIGUOUS_KNOWN_CONCEPT" }));
    expect(result.gaps.some((gap) => gap.scope === "DIRECT_COMPARISON")).toBe(false);
    expect(result.coverageMap.items.some((item) => item.branchId === "comparison:direct")).toBe(false);
    expect(projection.clarifications).toContainEqual(expect.objectContaining({ suggestions: expect.arrayContaining(["T1 mapping", "T1 natif", "Je ne sais pas"]) }));
    expect(interaction.assistantReply).not.toMatch(/comparaison générale directe.*branches/iu);
    expect(interaction).toMatchObject({ projectWrites: 0, protocolProjections: 0, externalCalls: 0 });
  });

  it("shared synthesis — structurally prioritizes a requested relation instead of assertion ID order", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le rôle du CBF dans la perfusion cérébrale en IRM.", createdAt: CREATED_AT });
    const direct = result.synthesis.responseProfile.directConclusionIds
      .map((id) => result.synthesis.conclusions.find((conclusion) => conclusion.conclusionId === id))
      .filter(Boolean);
    expect(direct.some((conclusion) => /cbf/iu.test(`${conclusion?.semanticRelation?.subject ?? ""} ${conclusion?.semanticRelation?.object ?? ""}`))).toBe(true);
  });
});
