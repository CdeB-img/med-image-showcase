import { render as renderUi, fireEvent } from "@testing-library/react";
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
  const fixture = contributionFromPersistentDelta({ candidate: delta([object("synthetic:seed", raw, raw)]), currentProject: null,
    conversation: { conversationId: "test", language: "fr", turns: [{ turnId: "user", role: "USER", content: raw }] } })!;
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
// FIXTURE_PURPOSE: exercise current actionable coverage and its public/audit projection.
// SOURCE_CLASS: SYNTHETIC_CURRENT_CONTRACT; ORIGINAL_SOURCE_FAMILY: N5b 17-case replay.
// SANITIZATION: YES. No provider request, private conversation, or original replay is copied.
// CURRENT_CONTRACT_PROTECTED: one disposition per OPEN finding, bounded semantic proof,
// fail-open UNKNOWN, and human-review grouping without Project authorization.
const withOpenFindings = (c: ScientificInterpretationContributionEnvelope, spans: string[], id: string) => {
  const fixture = structuredClone(c);
  fixture.audit.deterministicFindings = spans.map((span, index) => ({
    findingId: `synthetic:${id}:${index}`, code: "SOURCE_COVERAGE_UNKNOWN", severity: "WARNING" as const,
    status: "OPEN" as const, message: `Couverture du passage non déterminée : « ${span} »`, sourceRefs: ["user"],
  }));
  fixture.audit.unresolvedFindings = [...fixture.audit.deterministicFindings];
  return fixture;
};
const records: { id: string; contribution: ScientificInterpretationContributionEnvelope }[] = [
  (() => {
    const raw = "Tmax n'est pas vraiment une méthode métabolique, c'est un paramètre de perfusion. L'IRM à J+1 recalée sur le scanner de référence.";
    const c = contribution(raw, delta([
      object("cand-tmax-perfusion", "Tmax, paramètre de perfusion", raw, "CANONICAL_VARIABLE"),
      object("cand-perfusion-model", "Modèle de perfusion utilisant Tmax", raw, "ANALYSIS_SPECIFICATION"),
      object("cand-metabolic-model", "Modèle métabolique indépendant", raw, "ANALYSIS_SPECIFICATION"),
      object("cand-mri-ct-registration-context", "Recalage IRM J1 scanner", raw, "PROJECT_INFORMATION"),
      { ...object("cand-mri-j1-acquisition", "IRM J1 scanner", raw, "ACQUISITION"), studyRole: "REFERENCE_STANDARD" },
    ]));
    return { id: "SYNTHETIC_PARAMETER_AND_REGISTRATION", contribution: withOpenFindings(c,
      ["Tmax n'est pas vraiment une méthode métabolique", "L'IRM à J+1 recalée sur le scanner de référence."], "parameter") };
  })(),
  (() => {
    const raw = "Cardio:\nce n'est pas J3, c'est bien M3 pour la cardio.";
    const c = contribution(raw, delta([object("cand-cardio", "IRM Cardio", raw, "ACQUISITION"),
      object("cand-other-acquisition", "Scanner neurologique", raw, "ACQUISITION")],
      { temporalQualifications: [time("cand-cardio", "c'est bien M3 pour la cardio.", 3, "mois")] }));
    return { id: "SYNTHETIC_NAMED_TEMPORAL_CORRECTION", contribution: withOpenFindings(c,
      ["ce n'est pas J3", "c'est bien M3 pour la cardio."], "temporal") };
  })(),
  (() => {
    const raw = "Le logiciel reste un volet de la collaboration. impossibilité de suivi ou de consentement.";
    const c = contribution(raw, delta([
      object("cand-loan", "Logiciel prêté par le partenaire en extension de la collaboration", raw, "PROJECT_INFORMATION"),
      object("cand-nonunique", "Le logiciel n'est pas l'objectif unique", raw, "PROJECT_INFORMATION"),
      object("cand-other-objective", "Étudier le parcours clinique", raw, "OBJECTIVE"),
      object("cand-exclusion-followup", "Exclusion en cas d'impossibilité de suivi", raw, "ELIGIBILITY_CRITERION"),
      object("cand-exclusion-consent", "Exclusion en cas d'impossibilité de consentement", raw, "ELIGIBILITY_CRITERION"),
    ]));
    return { id: "SYNTHETIC_COLLABORATION_AND_EXCLUSIONS", contribution: withOpenFindings(c,
      ["Le logiciel reste un volet de la collaboration", "impossibilité de suivi ou de consentement"], "collaboration") };
  })(),
  (() => {
    const raw = "en restant pragmatique. Inclure des adultes. Tenir un registre parallèle.";
    const c = contribution(raw);
    return { id: "SYNTHETIC_DISCOURSE_AND_MATERIAL", contribution: withOpenFindings(c,
      ["en restant pragmatique", "Inclure des adultes.", "Tenir un registre parallèle."], "discourse") };
  })(),
  (() => {
    const raw = "Les mesures CMRO2 devront être validées.";
    const c = contribution(raw, delta([object("cand-cmro2", "Les mesures CMRO2 devront être validées", raw, "CONSTRAINT")]));
    return { id: "SYNTHETIC_REPRESENTED_AUDIT", contribution: withOpenFindings(c, [raw], "represented") };
  })(),
  (() => {
    const raw = "il pourra accéder à des données anonymisées selon le protocole, les autorisations et la gouvernance du projet.";
    return { id: "SYNTHETIC_GOVERNANCE_GROUP", contribution: withOpenFindings(contribution(raw), [
      "il pourra accéder à des données anonymisées", "selon le protocole", "les autorisations", "la gouvernance du projet.",
    ], "governance") };
  })(),
];
const portableFixture = (id: string) => {
  const value = records.find(record => record.id === id)?.contribution;
  if (!value) throw new Error(`PORTABLE_COVERAGE_FIXTURE_MISSING:${id}`);
  return value;
};
const render = (c: ScientificInterpretationContributionEnvelope) => renderToStaticMarkup(<ContributionReview contribution={c}
  candidate={prepareResearchProjectContributionCandidate(c, null)} status="PENDING" onConfirm={() => {}} onCorrect={() => {}} onReject={() => {}} />);

const renderAudit = (c: ScientificInterpretationContributionEnvelope) => {
  const ui = renderUi(<ContributionReview contribution={c} candidate={prepareResearchProjectContributionCandidate(c, null)} status="PENDING"
    onConfirm={() => {}} onCorrect={() => {}} onReject={() => {}} />);
  fireEvent.click(ui.getByTestId("functional-review-details"));
  const markup = ui.getByTestId("review-audit-detail").outerHTML;
  ui.unmount(); return markup;
};
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
    expect(render(c)).toContain("Projet en construction · des points restent à préciser.");
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
  it("shows the explicit parameter category and registration evidence", () => {
    const c = portableFixture("SYNTHETIC_PARAMETER_AND_REGISTRATION");
    const result = projectActionableSourceCoverage(c);
    const classification = result.dispositions.find(item => item.sourceSpan.startsWith("Tmax n"))!;
    expect(classification.classification).toBe("REPRESENTED");
    expect(classification.candidateRefs).toEqual(expect.arrayContaining(["cand-tmax-perfusion", "cand-perfusion-model", "cand-metabolic-model"]));
    const registration = result.dispositions.find(item => item.sourceSpan.startsWith("L'IRM à J+1 recalée"))!;
    expect(registration.actionable).toBe(false);
    expect(registration.candidateRefs).toEqual(expect.arrayContaining(["cand-mri-ct-registration-context", "cand-mri-j1-acquisition"]));
  });
  it("uses the source's named cohort context to verify, without rebinding, a corrected time", () => {
    const c = portableFixture("SYNTHETIC_NAMED_TEMPORAL_CORRECTION");
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.find(item => item.sourceSpan === "ce n'est pas J3")?.classification).toBe("SUPERSEDED");
    expect(result.dispositions.find(item => item.sourceSpan === "c'est bien M3 pour la cardio.")?.classification).toBe("REPRESENTED");
    const wrong = structuredClone(c);
    const qualification = wrong.scientificContent.temporalQualifications!.find(item => item.qualificationId === "time:cand-cardio:mois:3")!;
    qualification.subjectProjectRef = "cand-other-acquisition";
    expect(projectActionableSourceCoverage(wrong).dispositions.find(item => item.sourceSpan === "c'est bien M3 pour la cardio.")?.actionable).toBe(true);
  });
  it("proves the collaboration and independent exclusions from actual predicates", () => {
    const c = portableFixture("SYNTHETIC_COLLABORATION_AND_EXCLUSIONS");
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.find(item => item.sourceSpan === "Le logiciel reste un volet de la collaboration")?.actionable).toBe(false);
    expect(result.dispositions.find(item => item.sourceSpan === "impossibilité de suivi ou de consentement")?.classification).toBe("REPRESENTED");
    const missing = structuredClone(c);
    missing.scientificContent.candidateObjects = missing.scientificContent.candidateObjects.filter(item => item.itemId !== "cand-exclusion-consent");
    expect(projectActionableSourceCoverage(missing).dispositions.find(item => item.sourceSpan === "impossibilité de suivi ou de consentement")?.actionable).toBe(true);
  });
  it("does not accept a contrary parameter membership relation", () => {
    const c = structuredClone(portableFixture("SYNTHETIC_PARAMETER_AND_REGISTRATION"));
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
  it("projects every one of the 14 fixed portable OPEN findings with unique identities", () => {
    // The original 267 was the size of an unversioned historical campaign, not
    // a product limit. These six synthetic fixtures contain 2+2+2+3+1+4 findings.
    expect(records.map(record => record.contribution.audit.deterministicFindings.length)).toEqual([2, 2, 2, 3, 1, 4]);
    const dispositions = records.flatMap(record => projectActionableSourceCoverage(record.contribution).dispositions);
    expect(dispositions).toHaveLength(14);
    expect(new Set(dispositions.map(item => item.diagnosticId)).size).toBe(14);
  });
  it("groups the data access statement, retaining all four source fragments", () => {
    const record = { contribution: portableFixture("SYNTHETIC_GOVERNANCE_GROUP") };
    const result = projectActionableSourceCoverage(record.contribution);
    const group = result.actionableItems.find(item => item.label.includes("gouvernance"))!;
    expect(group.dispositions.map(item => item.sourceSpan)).toEqual(expect.arrayContaining([
      "il pourra accéder à des données anonymisées", "selon le protocole", "les autorisations", "la gouvernance du projet."]));
    expect(group.dispositions.every(item => item.actionable)).toBe(true);
    expect(render(record.contribution)).not.toContain("source-coverage-audit");
    const audit = renderAudit(record.contribution);
    for (const item of group.dispositions) expect(audit).toContain(item.sourceSpan);
  });
  it("does not turn the RHU T9 methodological request into a Project omission", () => {
    const c = portableFixture("SYNTHETIC_DISCOURSE_AND_MATERIAL");
    const result = projectActionableSourceCoverage(c);
    expect(result.dispositions.find(item => item.sourceSpan === "en restant pragmatique")?.classification).toBe("DISCOURSE_ACT");
    expect(result.dispositions.some(item => item.actionable && item.sourceSpan.includes("adultes"))).toBe(true);
    expect(result.dispositions.some(item => item.actionable && item.sourceSpan.includes("registre parallèle"))).toBe(true);
  });
  it("does not trigger comprehension warning from provenance/legacy status alone", () => {
    const c = structuredClone(portableFixture("SYNTHETIC_REPRESENTED_AUDIT"));
    c.scientificContent.ambiguities.push({ ...c.scientificContent.candidateObjects[0], itemId: "legacy-provenance", content: "Détail de provenance",
      epistemicBoundary: { ...c.scientificContent.candidateObjects[0].epistemicBoundary, epistemicStatus: "UNREPRESENTED_SOURCE_SPAN" } });
    expect(render(c)).not.toContain("Projet en construction · des points restent à préciser.");
  });
  it("shows no partial-comprehension warning for a represented finding and retains it in the audit", () => {
    const c = portableFixture("SYNTHETIC_REPRESENTED_AUDIT");
    expect(projectActionableSourceCoverage(c).actionableItems).toHaveLength(0);
    const markup = render(c);
    expect(markup).not.toContain("Projet en construction · des points restent à préciser.");
    expect(markup).not.toContain('data-testid="source-coverage-review"');
    expect(markup).not.toContain('data-testid="source-coverage-audit"');
    const audit = renderAudit(c);
    expect(audit).toContain('data-testid="source-coverage-audit"');
    const coverageSection = audit.match(/data-testid="source-coverage-audit"[\s\S]*?<\/section>/u)?.[0];
    expect(coverageSection).toContain("Les mesures CMRO2 devront être validées.");
  });
});
