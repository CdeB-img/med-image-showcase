import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase } from "../competence";
import { applyCriticRepairs, buildSemanticCoverage, buildSemanticTaxonomyReport, criticAcceptIsConsistent, runSemanticCriticCycles } from "../coverage";
import { parseSemanticCriticResult } from "../schema";
import {
  SEMANTIC_CRITIC_CHECKS,
  type ScientificSemanticProvider,
  type SemanticCriticResult,
  type SemanticReconstructionCandidate,
} from "../types";
import type { SemanticCompetenceCase } from "../competence-fixtures";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

const checklist = (fail?: (typeof SEMANTIC_CRITIC_CHECKS)[number]) => SEMANTIC_CRITIC_CHECKS.map((check) => ({
  check,
  result: check === fail ? "FAIL" as const : "PASS" as const,
  evidence: check === fail ? "Adversarial synthetic defect detected." : "Synthetic evidence passed.",
}));

const issue = (code: SemanticCriticResult["issues"][number]["code"]) => ({
  code,
  severity: "CRITICAL" as const,
  elementClientIds: [],
  description: "Synthetic adversarial issue.",
  recommendedAction: "Apply a bounded source-grounded repair.",
  resolved: false,
});

const gold = (objects: SemanticCompetenceCase["gold"]["requiredExplicitObjects"], relations: SemanticCompetenceCase["gold"]["requiredRelations"] = [], forbidden: string[] = []): SemanticCompetenceCase => ({
  caseId: "SEM-R3-SYNTHETIC",
  split: "DEVELOPMENT_CASES",
  domain: "generic",
  turns: ["Je veux comparer CT et IRM cardiaque."],
  gold: {
    requiredExplicitObjects: objects,
    requiredRelations: relations,
    acceptableInferences: [],
    forbiddenInferences: forbidden,
    requiredAmbiguities: [],
    optionalClarifications: [],
    forbiddenClarifications: [],
    expectedIntent: "comparer",
    allowedRoutes: ["FORMALIZE_IDEA"],
    criticalSemanticElements: objects.map((item) => item.meaning),
  },
});

const modelFor = (candidate = comparisonCandidate()) => canonicalizeSemanticReconstruction({
  request: makeSemanticRequest(),
  candidate,
  critic: acceptedCritic(candidate),
  metadata: { provider: "TEST", model: "r3", temperature: null },
  reconstructionCallId: "reconstruct",
  criticCallId: "critic",
});

const relationRepair = (candidate: SemanticReconstructionCandidate) => ({
  repairId: "repair-relation",
  action: "UPSERT_RELATION" as const,
  reason: "Restore the direct grounded comparison.",
  sourceInventoryItemIds: ["i-ct", "i-mri"],
  sourceInventoryRelationIds: ["ir-compare"],
  elementClientElementId: null,
  elementType: null,
  elementCanonicalMeaning: null,
  elementStudyRole: null,
  elementPolarity: null,
  elementInventoryItemIds: [],
  elementSourceMessageId: null,
  elementSourceText: null,
  elementEpistemicStatus: null,
  elementConfidence: null,
  elementInferenceReason: null,
  elementRequiresConfirmation: null,
  elementSupersedesElementIds: [],
  relationClientRelationId: candidate.relations[0].clientRelationId,
  relationSourceClientElementId: candidate.relations[0].sourceClientElementId,
  relationTargetClientElementId: candidate.relations[0].targetClientElementId,
  relationType: candidate.relations[0].relationType,
  relationPolarity: candidate.relations[0].polarity,
  relationInventoryRelationIds: candidate.relations[0].inventoryRelationIds,
  relationEpistemicStatus: candidate.relations[0].epistemicStatus,
  relationConfidence: candidate.relations[0].confidence,
  relationInferenceReason: candidate.relations[0].inferenceReason,
  relationRequiresConfirmation: candidate.relations[0].requiresConfirmation,
  ambiguity: null,
  route: null,
  routeConfidence: null,
  routeReason: null,
  routeExpectedCapabilities: [],
});

describe("SEM-001R3 generic competence repair contracts", () => {
  it("1 — separates an object's canonical type from its study role", () => {
    const candidate = comparisonCandidate();
    candidate.elements[2].type = "INTERVENTION";
    candidate.elements[2].studyRole = "COMPARATOR_ARM";
    const fixture = gold([{ type: "COMPARATOR", meaning: "IRM", aliases: [], critical: true }]);
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).explicitObjectRecall).toBe(1);
  });

  it("2 — keeps modality distinct from method", () => {
    const candidate = comparisonCandidate();
    candidate.elements[2].type = "METHOD";
    const fixture = gold([{ type: "MODALITY", meaning: "IRM", aliases: [], critical: true }]);
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).explicitObjectRecall).toBe(0);
  });

  it("3 — keeps biomarker distinct from phenomenon", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1].type = "BIOMARKER";
    const fixture = gold([{ type: "PHENOMENON", meaning: "CT", aliases: [], critical: true }]);
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).explicitObjectRecall).toBe(0);
  });

  it("4 — keeps biomarker distinct from endpoint", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1].type = "BIOMARKER";
    const fixture = gold([{ type: "ENDPOINT", meaning: "CT", aliases: [], critical: true }]);
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).explicitObjectRecall).toBe(0);
  });

  it("5 — preserves an intervention used as comparator arm", () => {
    const candidate = comparisonCandidate();
    candidate.elements[2].type = "INTERVENTION";
    candidate.elements[2].studyRole = "COMPARATOR_ARM";
    expect(modelFor(candidate).elements.find((item) => item.canonicalMeaning === "IRM")).toMatchObject({ type: "INTERVENTION", studyRole: "COMPARATOR_ARM" });
  });

  it("6 — preserves comparison endpoints and direct relation", () => {
    const model = modelFor();
    const fixture = gold(
      [{ type: "MODALITY", meaning: "CT", aliases: [], critical: true }, { type: "MODALITY", meaning: "IRM", aliases: [], critical: true }],
      [{ source: "CT", target: "IRM", relationAliases: ["COMPARES_WITH"], critical: true }],
    );
    expect(evaluateSemanticCase(fixture, model)).toMatchObject({ explicitObjectRecall: 1, explicitRelationRecall: 1 });
  });

  it("7 — preserves a measure, method and directed relation", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1].type = "BIOMARKER";
    candidate.elements[2].type = "METHOD";
    candidate.relations[0].relationType = "MEASURED_BY";
    const fixture = gold(
      [{ type: "BIOMARKER", meaning: "CT", aliases: [], critical: true }, { type: "METHOD", meaning: "IRM", aliases: [], critical: true }],
      [{ source: "CT", target: "IRM", relationAliases: ["MEASURED_BY"], critical: true }],
    );
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).criticalSemanticRecall).toBe(1);
  });

  it("8 — excludes a negated constraint from forbidden affirmed inference", () => {
    const candidate = comparisonCandidate();
    candidate.elements[3] = { ...candidate.elements[3], type: "CONSTRAINT", canonicalMeaning: "ne pas affirmer de causalité", polarity: "NEGATED" };
    const fixture = gold([], [], ["causalité"]);
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).criticalUnsupportedInferenceCount).toBe(0);
  });

  it("9 — does not turn a conditional relation into an affirmed forbidden proposition", () => {
    const candidate = comparisonCandidate();
    candidate.relations[0] = { ...candidate.relations[0], relationType: "CAUSES", polarity: "CONDITIONAL" };
    const fixture = gold([], [], ["causalité"]);
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).criticalUnsupportedInferenceCount).toBe(0);
  });

  it("10 — detects an explicit fragment with no typed mapping", () => {
    const candidate = comparisonCandidate();
    candidate.elements = candidate.elements.filter((item) => item.clientElementId !== "e-mri");
    candidate.relations = [];
    const coverage = buildSemanticCoverage(makeSemanticRequest(), candidate);
    expect(coverage.explicit.entries.find((item) => item.inventoryItemId === "i-mri")?.coverageStatus).toBe("UNRESOLVED_EXPLICIT_FRAGMENT");
  });

  it("11 — detects an explicit relation with no direct mapping", () => {
    const candidate = comparisonCandidate();
    candidate.relations = [];
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).relations.entries[0].coverageStatus).toBe("EXPLICIT_RELATION_UNMAPPED");
  });

  it.each([
    ["12 — critic detects object loss", "EVERY_EXPLICIT_OBJECT_REPRESENTED", "OBJECT_LOSS"],
    ["13 — critic detects relation loss", "EVERY_EXPLICIT_RELATION_REPRESENTED", "RELATION_LOSS"],
    ["14 — critic detects incompatible type", "NO_INCOMPATIBLE_OBJECT_TYPE", "TYPE_MISMATCH"],
    ["15 — critic detects endpoint promotion", "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION", "UNSUPPORTED_ENDPOINT_PROMOTION"],
    ["16 — critic detects invented causality", "NO_INFERENCE_PROMOTED", "UNSUPPORTED_CAUSALITY"],
    ["17 — critic detects hidden ambiguity", "NO_AMBIGUITY_HIDDEN", "AMBIGUITY_HIDDEN"],
  ] as const)("%s", (_label, failedCheck, issueCode) => {
    const candidate = comparisonCandidate();
    const critic = parseSemanticCriticResult({
      criticId: `critic-${issueCode}`,
      verdict: "REVISE",
      checklist: checklist(failedCheck),
      issues: [issue(issueCode)],
      proposedRepairs: [relationRepair(candidate)],
      criticSummary: "Adversarial defect found.",
    });
    expect(critic.checklist.find((item) => item.check === failedCheck)?.result).toBe("FAIL");
    expect(critic.verdict).toBe("REVISE");
  });

  it("18 — critic leaves a correct reconstruction unchanged", () => {
    const candidate = comparisonCandidate();
    const repaired = applyCriticRepairs(makeSemanticRequest(), candidate, []);
    expect(repaired.candidate).toEqual(candidate);
    expect(repaired.diagnostics).toEqual([]);
  });

  it("19 — accepts a source-grounded bounded critic repair", () => {
    const candidate = comparisonCandidate();
    const repair = relationRepair(candidate);
    candidate.relations = [];
    const repaired = applyCriticRepairs(makeSemanticRequest(), candidate, [repair]);
    expect(repaired.diagnostics).toEqual([{ repairId: "repair-relation", status: "ACCEPTED", reason: "SCHEMA_AND_SOURCE_GROUNDING_PASSED" }]);
    expect(repaired.candidate.relations).toHaveLength(1);
  });

  it("20 — rejects an ungrounded critic repair", () => {
    const candidate = comparisonCandidate();
    const repair = relationRepair(candidate);
    repair.sourceInventoryRelationIds = ["unknown"];
    expect(applyCriticRepairs(makeSemanticRequest(), candidate, [repair]).diagnostics[0]).toMatchObject({ status: "REJECTED", reason: "REPAIR_SOURCE_INVENTORY_UNKNOWN" });
  });

  it("21 — refuses ACCEPT when deterministic coverage is incomplete", () => {
    const candidate = comparisonCandidate();
    candidate.relations = [];
    expect(criticAcceptIsConsistent(acceptedCritic(candidate), buildSemanticCoverage(makeSemanticRequest(), candidate))).toBe(false);
  });

  it("22 — fails cleanly after two critic/repair cycles", async () => {
    const candidate = comparisonCandidate();
    const revise: SemanticCriticResult = {
      criticId: "critic-revise",
      verdict: "REVISE",
      checklist: checklist("EVERY_EXPLICIT_RELATION_REPRESENTED"),
      missingExplicitSourceFragments: [],
      issues: [issue("RELATION_LOSS")],
      proposedRepairs: [relationRepair(candidate)],
      criticSummary: "Revise.",
    };
    const provider: ScientificSemanticProvider = {
      metadata: { provider: "TEST", model: "critic", temperature: null },
      reconstruct: async () => ({ callId: "unused", candidate }),
      critique: async () => ({ callId: "critic", critic: revise }),
    };
    const result = await runSemanticCriticCycles(provider, makeSemanticRequest(), candidate);
    expect(result.critics).toHaveLength(2);
    expect(result).toMatchObject({ accepted: false, terminalReason: "CRITIC_MAX_CYCLES_EXHAUSTED" });
  });

  it("23 — runs a source-grounded repair then a fresh accepting audit", async () => {
    const candidate = comparisonCandidate();
    const relation = candidate.relations[0];
    candidate.relations = [];
    const revise: SemanticCriticResult = {
      criticId: "critic-revise",
      verdict: "REVISE",
      checklist: checklist("EVERY_EXPLICIT_RELATION_REPRESENTED"),
      missingExplicitSourceFragments: [],
      issues: [issue("RELATION_LOSS")],
      proposedRepairs: [relationRepair({ ...candidate, relations: [relation] })],
      criticSummary: "Restore relation.",
    };
    const accept = acceptedCritic(candidate);
    let cycle = 0;
    const provider: ScientificSemanticProvider = {
      metadata: { provider: "TEST", model: "critic", temperature: null },
      reconstruct: async () => ({ callId: "unused", candidate }),
      critique: async () => ({ callId: `critic-${++cycle}`, critic: cycle === 1 ? revise : accept }),
    };
    const result = await runSemanticCriticCycles(provider, makeSemanticRequest(), candidate);
    expect(result).toMatchObject({ accepted: true, terminalReason: "CRITIC_ACCEPTED_AFTER_COMPLETE_AUDIT" });
    expect(result.repairDiagnostics[0].status).toBe("ACCEPTED");
  });

  it("24 — rejects intent spokes as a substitute for a direct scientific relation", () => {
    const candidate = comparisonCandidate();
    candidate.elements.find((item) => item.clientElementId === "e-context")!.type = "SCIENTIFIC_OBJECT";
    candidate.semanticInventory.explicitRelations = [];
    candidate.relations = [
      { ...candidate.relations[0], clientRelationId: "r-intent-tool", sourceClientElementId: "e-operation", targetClientElementId: "e-ct", inventoryRelationIds: [] },
      { ...candidate.relations[0], clientRelationId: "r-intent-target", sourceClientElementId: "e-operation", targetClientElementId: "e-context", inventoryRelationIds: [] },
    ];
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).relations).toMatchObject({ status: "INCOMPLETE" });
  });

  it("25 — recognizes semantically equivalent inverse measurement wording", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1].type = "BIOMARKER";
    candidate.elements[2].type = "METHOD";
    candidate.relations[0] = { ...candidate.relations[0], sourceClientElementId: "e-mri", targetClientElementId: "e-ct", relationType: "MEASURES" };
    const fixture = gold(
      [{ type: "BIOMARKER", meaning: "CT", aliases: [], critical: true }, { type: "METHOD", meaning: "IRM", aliases: [], critical: true }],
      [{ source: "CT", target: "IRM", relationAliases: ["MEASURED_BY"], critical: true }],
    );
    expect(evaluateSemanticCase(fixture, modelFor(candidate)).explicitRelationRecall).toBe(1);
  });

  it("26 — reports short quantitative comparands misclassified as methods", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1] = { ...candidate.elements[1], type: "METHOD", canonicalMeaning: "T1", sourceText: "T1" };
    candidate.elements[2] = { ...candidate.elements[2], type: "METHOD", canonicalMeaning: "T2", sourceText: "T2" };
    candidate.relations[0] = { ...candidate.relations[0], sourceClientElementId: "e-ct", targetClientElementId: "e-mri" };
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "T1 versus T2", createdAt: "2026-08-11T10:00:00.000Z" }]);
    expect(buildSemanticTaxonomyReport(request, candidate)).toMatchObject({
      status: "INCOMPLETE",
      findings: [
        { code: "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD", clientElementId: "e-ct", expectedType: "BIOMARKER" },
        { code: "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD", clientElementId: "e-mri", expectedType: "BIOMARKER" },
      ],
    });
  });

  it("27 — treats a grounded comparative connector as relation coverage, not as a missing object", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-marker",
      sourceMessageId: "user-1",
      sourceText: "versus",
      normalizedLabel: "comparison",
      localRole: "comparator_marker",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: [],
    });
    candidate.semanticInventory.explicitRelations[0].sourceText = "CT versus IRM cardiaque";
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "Je veux comparer CT versus IRM cardiaque.", createdAt: "2026-08-11T10:00:00.000Z" }]);
    const entry = buildSemanticCoverage(request, candidate).explicit.entries.find((item) => item.inventoryItemId === "i-marker");
    expect(entry).toMatchObject({ coverageStatus: "MAPPED", mappedClientRelationIds: ["r-compare"] });
  });

  it("28 — detects a direct relation required by coordinated subjects before their shared change hub is classified", () => {
    const candidate = comparisonCandidate();
    candidate.elements = candidate.elements.filter((item) => ["e-ct", "e-mri"].includes(item.clientElementId));
    candidate.elements[0] = { ...candidate.elements[0], type: "BIOMARKER", inventoryItemIds: ["i-ct"] };
    candidate.elements[1] = { ...candidate.elements[1], type: "BIOMARKER", inventoryItemIds: ["i-mri"] };
    candidate.relations = [];
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-change",
      sourceMessageId: "user-1",
      sourceText: "comparer",
      normalizedLabel: "change over time",
      localRole: "temporal_change",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: [],
    });
    candidate.semanticInventory.explicitRelations = [
      { inventoryRelationId: "ir-left-change", sourceInventoryItemId: "i-ct", targetInventoryItemId: "i-change", sourceMessageId: "user-1", sourceText: "comparer CT", normalizedRelation: "CHANGES_AFTER", polarity: "AFFIRMED" },
      { inventoryRelationId: "ir-right-change", sourceInventoryItemId: "i-mri", targetInventoryItemId: "i-change", sourceMessageId: "user-1", sourceText: "IRM cardiaque", normalizedRelation: "CHANGES_AFTER", polarity: "AFFIRMED" },
    ];
    const report = buildSemanticCoverage(makeSemanticRequest(), candidate).relations;
    expect(report.entries.some((entry) => entry.inventoryRelationId.startsWith("structural:inventory-coordinated:") && entry.coverageStatus === "EXPLICIT_RELATION_UNMAPPED")).toBe(true);
  });

  it("29 — accepts a faithful target-to-time relation for an inventory relation phrased time-to-target", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1] = { ...candidate.elements[1], type: "ENDPOINT", canonicalMeaning: "measured variable" };
    candidate.elements[2] = { ...candidate.elements[2], type: "TIMING", canonicalMeaning: "five days" };
    candidate.relations[0] = { ...candidate.relations[0], sourceClientElementId: "e-ct", targetClientElementId: "e-mri", relationType: "REPEATED_AT" };
    candidate.semanticInventory.explicitRelations[0] = { ...candidate.semanticInventory.explicitRelations[0], sourceInventoryItemId: "i-mri", targetInventoryItemId: "i-ct", normalizedRelation: "REPEATED_AT" };
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).relations.entries[0]).toMatchObject({ coverageStatus: "MAPPED" });
  });

  it("30 — does not treat a biomarker endpoint as a measurement tool", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1] = { ...candidate.elements[1], type: "ENDPOINT" };
    candidate.elements[2] = { ...candidate.elements[2], type: "BIOMARKER" };
    candidate.relations[0] = { ...candidate.relations[0], relationType: "MEASURES" };
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).relations.entries[0]).toMatchObject({ coverageStatus: "MAPPED" });
  });

  it("31 — counts an exact inventory fragment as mapped inside a composite elliptical element", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments[1] = { ...candidate.semanticInventory.explicitFragments[1], sourceText: "IRM", normalizedLabel: "late MRI" };
    candidate.elements[2] = { ...candidate.elements[2], sourceText: "late IRM", inventoryItemIds: ["i-mri"] };
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "Je veux comparer CT et IRM cardiaque.", createdAt: "2026-08-11T10:00:00.000Z" }]);
    expect(buildSemanticCoverage(request, candidate).explicit.entries.find((entry) => entry.inventoryItemId === "i-mri")).toMatchObject({ coverageStatus: "MAPPED" });
  });

  it("32 — recognizes a direct arm comparison as preserving an explicit comparison action spoke", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-action",
      sourceMessageId: "user-1",
      sourceText: "comparer",
      normalizedLabel: "compare",
      localRole: "action",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: ["i-ct", "i-mri"],
    });
    candidate.elements[0] = { ...candidate.elements[0], inventoryItemIds: ["i-action"] };
    candidate.semanticInventory.explicitRelations.push({ inventoryRelationId: "ir-action-arm", sourceInventoryItemId: "i-action", targetInventoryItemId: "i-ct", sourceMessageId: "user-1", sourceText: "comparer CT", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" });
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).relations.entries.find((entry) => entry.inventoryRelationId === "ir-action-arm")).toMatchObject({ coverageStatus: "MAPPED" });
  });

  it("33 — reports a repeatability object governed by an explicit intent as SCIENTIFIC_INTENT", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments[0] = { ...candidate.semanticInventory.explicitFragments[0], sourceText: "comparer", localRole: "action" };
    candidate.semanticInventory.explicitFragments[1] = { ...candidate.semanticInventory.explicitFragments[1], sourceText: "répétabilité", normalizedLabel: "repeatability", localRole: "property" };
    candidate.elements[0] = { ...candidate.elements[0], inventoryItemIds: ["i-operation"], sourceText: "comparer" };
    candidate.elements[1] = { ...candidate.elements[1], type: "SCIENTIFIC_OBJECT", inventoryItemIds: ["i-ct"], sourceText: "répétabilité", canonicalMeaning: "repeatability" };
    candidate.semanticInventory.explicitRelations[0] = { ...candidate.semanticInventory.explicitRelations[0], sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-ct", normalizedRelation: "AIMS_TO_MODIFY" };
    expect(buildSemanticTaxonomyReport(makeSemanticRequest(), candidate).findings).toContainEqual(expect.objectContaining({ clientElementId: "e-ct", expectedType: "SCIENTIFIC_INTENT" }));
  });

  it("34 — does not require a rejected relation to remain active after an explicit correction supersedes its endpoint", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1] = { ...candidate.elements[1], polarity: "NEGATED" };
    candidate.elements.push({ ...candidate.elements[1], clientElementId: "e-replacement", canonicalMeaning: "replacement endpoint", polarity: "AFFIRMED", supersedesElementIds: ["e-ct"] });
    candidate.relations = [];
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).relations.entries[0]).toMatchObject({ coverageStatus: "MAPPED", mappedClientRelationIds: ["superseded:e-ct"] });
  });

  it("35 — maps an explicit composite objective through its constituent elements and direct relation", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-objective",
      sourceMessageId: "user-1",
      sourceText: "comparer CT et IRM cardiaque",
      normalizedLabel: "comparison objective",
      localRole: "objective",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: ["i-ct", "i-mri"],
    });
    candidate.semanticInventory.explicitRelations.push({ inventoryRelationId: "ir-objective", sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-objective", sourceMessageId: "user-1", sourceText: "comparer CT et IRM cardiaque", normalizedRelation: "AIMS_TO_EVALUATE", polarity: "AFFIRMED" });
    candidate.relations.push({ ...candidate.relations[0], clientRelationId: "r-intent-ct", sourceClientElementId: "e-operation", targetClientElementId: "e-ct", relationType: "AIMS_TO_EVALUATE", inventoryRelationIds: ["ir-objective"] });
    const coverage = buildSemanticCoverage(makeSemanticRequest(), candidate);
    expect(coverage.explicit.entries.find((entry) => entry.inventoryItemId === "i-objective")?.mappedClientElementIds).toEqual(expect.arrayContaining(["e-ct", "e-mri"]));
    expect(coverage.relations.entries.find((entry) => entry.inventoryRelationId === "ir-objective")).toMatchObject({ coverageStatus: "MAPPED" });
  });
});

describe("SEM-001R3 linguistic robustness outside holdout", () => {
  it.each([
    ["phrase complète", "Je veux comparer CT et IRM cardiaque."],
    ["langage télégraphique", "CT versus IRM cardiaque"],
    ["faute de frappe", "Comparer CT et IRM cardiaque svp."],
    ["abréviation", "Comparer CT et CMR cardiaque."],
    ["négation", "Ne pas comparer CT et IRM cardiaque."],
    ["comparaison implicite", "Différence de mesure entre CT et IRM cardiaque."],
    ["comparaison explicite", "CT comparé à IRM cardiaque."],
    ["objet à rôles multiples", "IRM comme stratégie active, CT comme référence."],
    ["français", "Comparer le scanner et la résonance magnétique cardiaque."],
    ["terminologie anglaise", "Compare whole-heart CT with cardiac MRI."],
  ])("preserves inventory coverage for %s", (_label, message) => {
    const candidate = comparisonCandidate();
    const left = message.match(/CT|scanner|whole-heart CT/)?.[0] ?? "CT";
    const right = message.match(/IRM|CMR|résonance magnétique|cardiac MRI/)?.[0] ?? "IRM";
    candidate.semanticInventory.explicitFragments = candidate.semanticInventory.explicitFragments.filter((item) => ["i-ct", "i-mri"].includes(item.inventoryItemId));
    candidate.semanticInventory.explicitFragments[0] = { ...candidate.semanticInventory.explicitFragments[0], sourceText: left, normalizedLabel: left };
    candidate.semanticInventory.explicitFragments[1] = { ...candidate.semanticInventory.explicitFragments[1], sourceText: right, normalizedLabel: right };
    candidate.semanticInventory.explicitRelations[0].sourceText = message;
    candidate.elements = candidate.elements.filter((item) => ["e-ct", "e-mri"].includes(item.clientElementId));
    candidate.elements[0] = { ...candidate.elements[0], canonicalMeaning: left, sourceText: left };
    candidate.elements[1] = { ...candidate.elements[1], canonicalMeaning: right, sourceText: right };
    candidate.relations[0].polarity = message.startsWith("Ne pas") ? "NEGATED" : "AFFIRMED";
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: message, createdAt: "2026-08-11T10:00:00.000Z" }]);
    expect(buildSemanticCoverage(request, candidate)).toMatchObject({ explicit: { status: "COMPLETE" }, relations: { status: "COMPLETE" } });
  });
});
