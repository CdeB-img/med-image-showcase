import { describe, expect, it } from "vitest";
import { determineCoverage } from "../conflict-gap-analyzer";
import { resolveConcepts } from "../concept-resolver";
import { executeKnowledgeEngine } from "../engine";
import { createKnowledgeRequest } from "../knowledge-request";
import { assessKnowledgeSnapshot, createKnowledgeSnapshot, loadKnowledgeSnapshots, saveKnowledgeSnapshot } from "../persistence";
import { KNOWLEDGE_PROVIDER_REGISTRY } from "../provider-registry";
import { projectUnderstandResult } from "../understand-projection";

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("ENG-002 — 12 cas produit supplémentaires", () => {
  it("9 — répond à une question simple parfaitement couverte", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral et le photon counting CT." });
    const projection = projectUnderstandResult(result);
    expect(result.coverageStatus).toBe("SUPPORTED");
    expect(result.coverageMap.items[0].status).toBe("SUPPORTED_COVERAGE");
    expect(projection.requestSummary).toContain("CT spectral");
    expect(projection.supportedItems.length).toBeGreaterThan(0);
  });

  it("10 — fédère deux providers pertinents sans s’arrêter au premier", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral et le photon counting CT." });
    const executed = result.providerExecutions.filter((item) => item.included && item.executionStatus === "SUCCESS").map((item) => item.providerId);
    expect(executed).toEqual(expect.arrayContaining(["p5-multidomain", "rb-003"]));
    expect(result.provenance.map((item) => item.providerId)).toEqual(expect.arrayContaining(["p5-multidomain", "rb-003"]));
  });

  it("11 — conserve des éléments convergents sans vote par nombre de sources", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre la perfusion cérébrale, l’OEF et le CMRO2." });
    expect(result.synthesis.conclusions.length).toBeGreaterThan(1);
    expect(result.synthesis.convergences).toContain("Plusieurs éléments compatibles sont conservés sans vote par nombre de sources.");
  });

  it("12 — conserve les assertions contradictoires sans résolution automatique", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre l’ECV avec un hématocrite synthétique." });
    expect(result.controversies.length).toBeGreaterThan(0);
    expect(result.synthesis.conclusions.length).toBeGreaterThan(1);
    expect(result.humanReviewRequirements).toContain("CONFLICT_REVIEW_REQUIRED");
  });

  it("13 — distingue un provider indisponible d’une absence scientifique", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral." });
    const unavailable = result.providerExecutions.map((item) => item.included ? { ...item, executionStatus: "UNAVAILABLE" as const, resultCount: 0 } : item);
    expect(determineCoverage(result.queryPlan, unavailable, [], 0, 0, [])).toBe("SOURCE_UNAVAILABLE");
  });

  it("14 — conserve un provider présent mais exclut ses assertions au contexte incompatible", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comparer le T1 mapping et l’ECV dans la maladie de Fabry.", context: { pathology: "FABRY_DISEASE" } });
    expect(result.providerExecutions.find((item) => item.providerId === "p4r-ecv-t1")?.included).toBe(true);
    expect(result.excludedAssertions.length).toBeGreaterThan(0);
    expect(result.coverageStatus).toBe("PARTIAL");
    expect(result.coverageMap.items.some((item) => item.status === "PARTIAL_COVERAGE")).toBe(true);
  });

  it("15 — transforme une question très générale en clarification utile", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Je voudrais comprendre l’imagerie médicale de façon générale." });
    const projection = projectUnderstandResult(result);
    expect(result.gaps).toContainEqual(expect.objectContaining({ scope: "GENERAL_OR_AMBIGUOUS_QUESTION" }));
    expect(projection.clarifications.length).toBeGreaterThan(0);
    expect(projection.clarifications.every((item) => item.reason && item.influence && item.suggestions.includes("Je ne sais pas"))).toBe(true);
  });

  it("16 — résout une faute de frappe gouvernée sans changer l’objet scientifique", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Quelle différence entre le T1 maping et l’ECV en IRM ?" });
    expect(result.resolvedConcepts.map((item) => item.conceptId)).toEqual(expect.arrayContaining(["method:t1-mapping", "biomarker:ecv"]));
    expect(result.specificity.preservedTerms).toContain("t1 maping");
  });

  it("17 — garde un acronyme ambigu comme ambiguïté et ne sélectionne aucun corpus voisin", () => {
    const request = createKnowledgeRequest({ originalQuestion: "Que signifie T1 en imagerie ?", scientificObjectTerms: [{ term: "T1" }] });
    const resolution = resolveConcepts(request);
    const result = executeKnowledgeEngine({ originalQuestion: request.originalQuestion, scientificObjectTerms: [{ term: "T1" }] });
    expect(resolution.ambiguities.length).toBeGreaterThan(0);
    expect(result.ambiguities.length).toBeGreaterThan(0);
    expect(result.providerExecutions.every((item) => !item.included)).toBe(true);
  });

  it("18 — un changement de contexte produit une nouvelle requête et invalide l’ancienne révision", () => {
    const first = executeKnowledgeEngine({ originalQuestion: "Comprendre le T1 mapping en IRM.", context: { usage: "COMPREHENSION" } });
    const second = executeKnowledgeEngine({ originalQuestion: "Comprendre le T1 mapping en IRM.", context: { usage: "MULTICENTRIC_COMPARISON" } });
    expect(first.request.requestId).not.toBe(second.request.requestId);
    expect(first.request.context.digest).not.toBe(second.request.context.digest);
    expect(first.resultDigest).not.toBe(second.resultDigest);
  });

  it("19 — sauvegarde et recharge une session Knowledge versionnée", () => {
    const storage = new MemoryStorage();
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral." });
    const snapshot = createKnowledgeSnapshot({ sessionId: "session-19", contextVersion: 3, result, projectionSettings: { depth: "PROFESSIONAL", openDisclosure: "ANSWER" }, timestamp: "2026-08-09T10:00:00.000Z" });
    saveKnowledgeSnapshot(storage, snapshot);
    const loaded = loadKnowledgeSnapshots(storage, { registryDigest: result.registrySnapshotRef, providerVersions: result.providerVersions, corpusRepresentationDigests: snapshot.corpusRepresentationDigests, question: result.request.originalQuestion, contextVersion: 3 });
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({ state: "CURRENT", snapshot: { requestId: result.request.requestId, schemaVersion: "1.1.0", contextVersion: 3 } });
    expect(loaded[0].snapshot.result.resultDigest).toBe(result.resultDigest);
  });

  it("20 — détecte une version provider modifiée après persistance", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral." });
    const snapshot = createKnowledgeSnapshot({ sessionId: "session-20", contextVersion: 1, result, projectionSettings: { depth: "PROFESSIONAL", openDisclosure: "ANSWER" } });
    const assessed = assessKnowledgeSnapshot(snapshot, { registryDigest: `${KNOWLEDGE_PROVIDER_REGISTRY.digest}-changed`, providerVersions: { ...result.providerVersions, "p5-multidomain": "future-version" } });
    expect(assessed.state).toBe("STALE_PROVIDER_VERSION");
    expect(assessed.reasons.join(" ")).toContain("version de provider");
  });
});

describe("ENG-002 — persistance et narration bornées", () => {
  it("refuse de persister une donnée patient, un identifiant ou un secret", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le T2 mapping de manière générale." });
    for (const question of ["J’ai un T2 élevé.", "Patient IPP: ABCD1234, expliquer le T2.", "api_key=secret-value, expliquer le T2."]) {
      expect(() => createKnowledgeSnapshot({ sessionId: "private", contextVersion: 1, result: { ...result, request: { ...result.request, originalQuestion: question } }, projectionSettings: { depth: "PROFESSIONAL", openDisclosure: "ANSWER" } })).toThrow("SENSITIVE_KNOWLEDGE_SNAPSHOT_NOT_PERSISTED");
    }
  });

  it("ne projette aucune assertion ni source absente du KnowledgeResult", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral." });
    const projection = projectUnderstandResult(result, "EXPERT");
    const allowedIds = new Set([...result.applicableAssertions.map((item) => item.revision), ...result.documentaryStatements.map((item) => item.statementId)]);
    expect(projection.supportedItems.every((item) => allowedIds.has(item.id))).toBe(true);
    expect(projection.sources.map((item) => item.id)).toEqual(result.sources.map((item) => item.sourceId));
  });
});
