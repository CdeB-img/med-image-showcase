import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { evaluatePersistentSourceCoverage, sourceCoverageFindings } from "../../persistent-source-coverage";
import { projectActionableSourceCoverage } from "../../actionable-source-coverage";
import { contributionFromPersistentDelta, type PersistentProjectDeltaCandidate, type PersistentProjectDeltaChange, type PersistentTemporalQualification } from "../../product-bridge";
import type { ScientificInterpretationContributionEnvelope } from "../../../scientific-interpretation/contracts";
import { prepareResearchProjectContributionCandidate } from "../../../research-project-construction/contribution-owner-boundary";
import ContributionReview from "../ContributionReview";

const object = (ref: string, content: string, sourceText: string, proposedType = "PROJECT_INFORMATION"): PersistentProjectDeltaChange => ({
  operation: "ADD", candidateRef: ref, semanticIdentity: ref, proposedType, content, sourceText, polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
});
const delta = (changes: PersistentProjectDeltaChange[], extra: Partial<PersistentProjectDeltaCandidate> = {}): PersistentProjectDeltaCandidate => ({
  contract: "PERSISTENT_PROJECT_DELTA_CANDIDATE", contractVersion: "0.4.0", projectWriteAuthorized: false,
  changes, relations: [], temporalQualifications: [], expectedVariableOccasions: [], ...extra,
});
const contribution = (raw: string, candidate = delta([])): ScientificInterpretationContributionEnvelope => {
  const produced = contributionFromPersistentDelta({ candidate, currentProject: null,
    conversation: { conversationId: "test", language: "fr", turns: [{ turnId: "user", role: "USER", content: raw }] } });
  if (produced) return produced;
  // The Bridge returns null for a zero delta. Exercise the projection's pure
  // act recognition with an explicitly empty extraction envelope fixture.
  const fixture = structuredClone(records[0].contribution);
  fixture.source.originalRequest = raw;
  fixture.source.turns = [{ turnId: "user", role: "USER", content: raw }];
  for (const values of Object.values(fixture.scientificContent)) if (Array.isArray(values)) values.length = 0;
  fixture.audit.deterministicFindings = sourceCoverageFindings(evaluatePersistentSourceCoverage({ raw, candidate, sourceTurnRef: "user" }));
  fixture.audit.unresolvedFindings = fixture.audit.deterministicFindings.filter(finding => finding.status === "OPEN");
  fixture.mapping = [];
  return fixture;
};
const time = (ref: string, raw: string, offset: number, unit = "jour"): PersistentTemporalQualification => ({
  operation: "ADD", qualificationId: `time:${ref}:${unit}:${offset}`, subjectProjectRef: ref, temporalRole: "ACQUISITION_TIME", sourceText: raw,
  assertionKind: "USER_STATED", evidenceRefs: [], anchor: { kind: "TIMEPOINT", direction: "AT", unit, offset,
    lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null,
    reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } },
});
const project = (raw: string, candidate = delta([])) => projectActionableSourceCoverage(contribution(raw, candidate));
const records: { id: string; contribution: ScientificInterpretationContributionEnvelope }[] = JSON.parse(readFileSync(resolve(
  "validation/protocol-designer-v1-source-coverage-actionable-review-repair-02/baseline-replayed-stages.json"), "utf8"));
const render = (c: ScientificInterpretationContributionEnvelope) => renderToStaticMarkup(<ContributionReview contribution={c}
  candidate={prepareResearchProjectContributionCandidate(c, null)} status="PENDING" onConfirm={() => {}} onCorrect={() => {}} onReject={() => {}} />);

describe("N5b — actionable coverage, immutable candidate and complete audit", () => {
  it("keeps the missing upper age bound material", () => {
    const raw = "âge 18–80";
    const result = project(raw, delta([object("age", "≥18", raw, "ELIGIBILITY_CRITERION")]));
    expect(result.dispositions[0].classification).toBe("PARTIAL_MATERIAL");
    expect(result.dispositions[0].unmatchedTerms).toContain("80");
    expect(result.partialComprehensionWarning).toBe(true);
  });
  it("keeps J6 omitted when only J1 exists", () => {
    const raw = "IRM à J1 et J6";
    const result = project(raw, delta([object("mri", "IRM", raw, "ACQUISITION")], { temporalQualifications: [time("mri", raw, 1)] }));
    expect(result.dispositions.find(item => item.sourceSpan === "J6")?.classification).toBe("TRUE_OMISSION");
  });
  it("does not cover two readers by one", () => {
    const raw = "deux lecteurs";
    expect(project(raw, delta([object("reader", "Un lecteur", raw, "CONSTRAINT")])).dispositions[0].classification).toBe("PARTIAL_MATERIAL");
  });
  it("keeps an absent PET constraint visible and outside clarificationNeeds", () => {
    const raw = "IRM à J1. Pas de PET.";
    const c = contribution(raw, delta([object("mri", "IRM à J1", raw, "ACQUISITION")]));
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.find(item => item.sourceSpan === "Pas de PET.")?.classification).toBe("TRUE_OMISSION");
    expect(render(c)).toContain("Compréhension partielle");
    expect(render(c)).toContain("Pas de PET.");
    expect(c.scientificContent.clarificationNeeds).toEqual([]);
  });
  it("supersedes J3 only when the corrected M3 is represented", () => {
    const raw = "finalement M3, pas J3";
    const d = delta([object("mri", "IRM à M3", raw, "ACQUISITION")], { temporalQualifications: [time("mri", raw, 3, "mois")] });
    const result = project(raw, d);
    expect(result.dispositions.find(item => item.sourceSpan.includes("pas J3"))?.classification).toBe("SUPERSEDED");
    expect(project(raw).dispositions.some(item => item.classification === "SUPERSEDED")).toBe(false);
  });
  it.each([
    ["ce n'est pas 18, c'est bien 21", "Âge minimum 21 ans", "ELIGIBILITY_CRITERION"],
    ["ce n'est pas T1, c'est bien T2", "Mesure T2", "CANONICAL_VARIABLE"],
    ["ce n'est pas la survie, c'est bien la douleur", "Douleur", "ENDPOINT"],
  ])("verifies generic bound/term/endpoint corrections in %s", (raw, content, type) => {
    const result = project(raw, delta([object("replacement", content, raw, type)]));
    expect(result.dispositions.some(item => item.classification === "SUPERSEDED")).toBe(true);
    expect(result.dispositions.filter(item => item.classification === "SUPERSEDED").every(item => item.candidateRefs.includes("replacement"))).toBe(true);
    expect(project(raw).dispositions.some(item => item.classification === "SUPERSEDED")).toBe(false);
  });
  it.each(["oui c'est bon", "Oui", "c'est bien cela", "Pour l'instant", "En échange", "on va vraiment faire simple pour commencer",
    "Vous pouvez enregistrer le projet avec cette formulation", "Je veux maintenant qu'on passe à l'étape suivante"])("does not bind or warn on the pure act %s", raw => {
    const c = contribution(raw); const before = JSON.stringify(c);
    expect(projectActionableSourceCoverage(c).dispositions.every(item => item.classification === "DISCOURSE_ACT")).toBe(true);
    expect(projectActionableSourceCoverage(c).partialComprehensionWarning).toBe(false);
    expect(JSON.stringify(c)).toBe(before);
    expect(c.decisionBoundary.projectWriteAuthorized).toBe(false);
  });
  it("does not use a whole paragraph anchor to cover missing internal information", () => {
    const raw = "IRM à J1. Deux lecteurs indépendants. Pas de PET.";
    const result = project(raw, delta([object("mri", "IRM à J1", raw, "ACQUISITION")]));
    expect(result.dispositions.filter(item => item.actionable).map(item => item.sourceSpan)).toEqual(expect.arrayContaining(["Deux lecteurs indépendants.", "Pas de PET."]));
  });
  it.each([["Valeur 30 %", "Valeur 30"], ["Valeur < 30", "Valeur > 30"], ["Valeur ≤ 30", "Valeur 30"], ["Valeur ≤ 30", "Valeur ≥ 30"], ["âge 18–80", "âge 80–18"],
    ["IRM si possible avant reperfusion", "IRM avant reperfusion"]])("retains the material operator/ordering in %s", (raw, content) => {
    expect(project(raw, delta([object("value", content, raw, "CONSTRAINT")])).partialComprehensionWarning).toBe(true);
  });
  it("does not borrow a threshold from another variable or compartment", () => {
    const raw = "core défini par CBF inférieur à 30 %";
    const wrong = "Core : CBF inférieur à 60 % et CMRO2 inférieur à 30 %";
    expect(project(raw, delta([object("model", wrong, raw, "ANALYSIS_SPECIFICATION")])).partialComprehensionWarning).toBe(true);
    const swapped = "Core : CBF inférieur à 60 % ; pénombre : CBF inférieur à 30 %";
    expect(project(raw, delta([object("model", swapped, raw, "ANALYSIS_SPECIFICATION")])).partialComprehensionWarning).toBe(true);
  });
  it("requires the native primary-endpoint role despite equivalent content", () => {
    const raw = "Le critère principal est la taille de la lésion";
    expect(project(raw, delta([object("endpoint", "Taille de la lésion", raw, "ENDPOINT")])).partialComprehensionWarning).toBe(true);
  });
  it("requires an explicit comparison rather than joining unrelated objects", () => {
    const raw = "Alpha comparé à Beta. Alpha. Beta.";
    expect(project(raw, delta([object("alpha", "Alpha", "Alpha."), object("beta", "Beta", "Beta.")])).partialComprehensionWarning).toBe(true);
  });
  it("shows the explicit native membership and registration evidence for AVC T2", () => {
    const c = records.find(record => record.id === "AVC-T02")!.contribution;
    const result = projectActionableSourceCoverage(c);
    const classification = result.dispositions.find(item => item.sourceSpan.startsWith("Tmax n"))!;
    expect(classification.classification).toBe("REPRESENTED");
    expect(classification.candidateRefs).toEqual(expect.arrayContaining(["cand-tmax-perfusion", "cand-perfusion-model", "cand-metabolic-model"]));
    const registration = result.dispositions.find(item => item.sourceSpan.startsWith("L'IRM à J+1 recalée"))!;
    expect(registration.actionable).toBe(false);
    expect(registration.candidateRefs).toEqual(expect.arrayContaining(["cand-mri-ct-registration-context", "cand-mri-j1-acquisition"]));
  });
  it("uses the source's named cohort context to verify, without rebinding, a corrected time", () => {
    const c = records.find(record => record.id === "RHU-T03")!.contribution;
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.find(item => item.sourceSpan === "ce n'est pas J3")?.classification).toBe("SUPERSEDED");
    expect(result.dispositions.find(item => item.sourceSpan === "c'est bien M3 pour la cardio.")?.classification).toBe("REPRESENTED");
    const wrong = structuredClone(c);
    const qualification = wrong.scientificContent.temporalQualifications!.find(item => item.qualificationId === "tq-acq-irm-idm-suivi-m3")!;
    qualification.subjectProjectRef = "cand-acquisition-irm-avc-j0";
    expect(projectActionableSourceCoverage(wrong).dispositions.find(item => item.sourceSpan === "c'est bien M3 pour la cardio.")?.actionable).toBe(true);
  });
  it("proves the collaboration and independent exclusions from actual predicates", () => {
    const c = records.find(record => record.id === "RHU-T03")!.contribution;
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.find(item => item.sourceSpan === "Le logiciel reste un volet de la collaboration")?.actionable).toBe(false);
    expect(result.dispositions.find(item => item.sourceSpan === "impossibilité de suivi ou de consentement")?.classification).toBe("REPRESENTED");
    const missing = structuredClone(c);
    missing.scientificContent.candidateObjects = missing.scientificContent.candidateObjects.filter(item => item.itemId !== "cand-eligibilite-impossibilite-consentement");
    expect(projectActionableSourceCoverage(missing).dispositions.find(item => item.sourceSpan === "impossibilité de suivi ou de consentement")?.actionable).toBe(true);
  });
  it("does not accept a contrary parameter membership relation", () => {
    const c = structuredClone(records.find(record => record.id === "AVC-T02")!.contribution);
    c.scientificContent.candidateRelations.push({ relationId: "contrary", relationType: "IS_COMPONENT_OF", sourceItemId: "cand-tmax-perfusion",
      targetItemId: "cand-metabolic-model", polarity: "AFFIRMED", confidence: 1,
      epistemicBoundary: { ...c.scientificContent.candidateObjects[0].epistemicBoundary } });
    expect(projectActionableSourceCoverage(c).dispositions.find(item => item.sourceSpan.startsWith("Tmax n"))?.actionable).toBe(true);
  });
  it("does not borrow a day from an unrelated acquisition", () => {
    const raw = "IRM à J1. Scanner à J6.";
    const result = project(raw, delta([object("mri", "IRM", "IRM à J1", "ACQUISITION"), object("ct", "Scanner", "Scanner à J6", "ACQUISITION")],
      { temporalQualifications: [time("ct", "Scanner à J6", 1)] }));
    expect(result.dispositions.find(item => item.sourceSpan === "IRM à J1.")?.actionable).toBe(true);
  });
  it("does not fabricate an interval by joining two quantities", () => {
    const raw = "âge 18–80";
    expect(project(raw, delta([object("a", "âge 18", raw), object("b", "âge 80", raw)])).partialComprehensionWarning).toBe(true);
  });
  it("does not use an inactive candidate as proof of an open diagnostic", () => {
    const raw = "IRM à J1 et J6";
    const c = contribution(raw, delta([object("mri", "IRM à J1", raw, "ACQUISITION")]));
    c.scientificContent.candidateObjects[0].epistemicBoundary.activeState = false;
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.filter(item => item.actionable).every(item => !item.candidateRefs.includes("mri"))).toBe(true);
    expect(result.dispositions.find(item => item.sourceSpan === "J6")?.classification).toBe("TRUE_OMISSION");
  });
  it("keeps mixed scientific information despite a proposal request", () => {
    const raw = "Peux-tu proposer des critères ? Je propose d'inclure des patients adultes avec un AVC ischémique aigu.";
    const result = project(raw);
    expect(result.dispositions.some(item => item.actionable && item.sourceSpan.includes("adultes"))).toBe(true);
  });
  it.each(records.map(record => [record.id, record.contribution] as const))("preserves all candidate, epistemic and raw audit fields in %s", (_id, c) => {
    const before = JSON.stringify(c); const result = projectActionableSourceCoverage(c);
    const raw = c.audit.deterministicFindings.filter(finding => finding.code.startsWith("SOURCE_COVERAGE_") && finding.status === "OPEN");
    expect(result.dispositions.map(item => item.diagnosticId)).toEqual(raw.map(item => item.findingId));
    expect(JSON.stringify(c)).toBe(before);
    expect(result.dispositions.every(item => item.reason.length > 0)).toBe(true);
  });
  it("accounts for exactly all 267 baseline open diagnostics", () => {
    const dispositions = records.flatMap(record => projectActionableSourceCoverage(record.contribution).dispositions);
    expect(dispositions).toHaveLength(267);
    expect(new Set(dispositions.map(item => item.diagnosticId)).size).toBe(267);
  });
  it("groups the data access statement, retaining all four source fragments", () => {
    const record = records.find(record => record.id === "RHU-T03")!;
    const result = projectActionableSourceCoverage(record.contribution);
    const group = result.actionableItems.find(item => item.label.includes("gouvernance"))!;
    expect(group.dispositions.map(item => item.sourceSpan)).toEqual(expect.arrayContaining([
      "il pourra accéder à des données anonymisées", "selon le protocole", "les autorisations", "la gouvernance du projet."]));
    expect(group.dispositions.every(item => item.actionable)).toBe(true);
    expect(render(record.contribution)).toContain("source-coverage-group-detail");
  });
  it("does not turn the RHU T9 methodological request into a Project omission", () => {
    const c = records.find(record => record.id === "RHU-T09")!.contribution;
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.find(item => item.sourceSpan === "en restant pragmatique")?.classification).toBe("DISCOURSE_ACT");
    expect(result.dispositions.some(item => item.actionable && item.sourceSpan.includes("adultes"))).toBe(true);
    expect(result.dispositions.some(item => item.actionable && item.sourceSpan.includes("registre parallèle"))).toBe(true);
  });
  it("does not trigger comprehension warning from provenance/legacy status alone", () => {
    const c = structuredClone(records.find(record => record.id === "AVC-T05")!.contribution);
    c.scientificContent.ambiguities.push({ ...c.scientificContent.candidateObjects[0], itemId: "legacy-provenance", content: "Détail de provenance",
      epistemicBoundary: { ...c.scientificContent.candidateObjects[0].epistemicBoundary, epistemicStatus: "UNREPRESENTED_SOURCE_SPAN" } });
    expect(render(c)).not.toContain("Compréhension partielle");
  });
  it("shows no partial-comprehension warning for the represented AVC T5/confirmation", () => {
    const c = records.find(record => record.id === "AVC-T05")!.contribution;
    expect(projectActionableSourceCoverage(c).actionableItems).toHaveLength(0);
    const markup = render(c);
    expect(markup).not.toContain("Compréhension partielle");
    expect(markup).not.toContain('data-testid="source-coverage-review"');
    expect(markup).toContain('data-testid="source-coverage-audit"');
    expect(markup).toContain("CMRO2 devront être validés");
  });
});
