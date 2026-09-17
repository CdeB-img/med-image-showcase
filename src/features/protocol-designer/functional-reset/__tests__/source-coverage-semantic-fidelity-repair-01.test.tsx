import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { evaluatePersistentSourceCoverage, sourceCoverageFindings } from "../../persistent-source-coverage";
import { contributionFromPersistentDelta, validatePersistentProjectDelta,
  materializePersistentSourceAnchors, constrainPersistentRelationsToCanonicalSignatures, validatePersistentProviderContract,
  type PersistentProjectDeltaCandidate, type PersistentProjectDeltaChange, type PersistentTemporalQualification, type PersistentProjectRelation,
} from "../../product-bridge";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import ContributionReview from "../ContributionReview";

const object = (ref: string, content: string, sourceText: string, proposedType = "PROJECT_INFORMATION"): PersistentProjectDeltaChange => ({
  operation: "ADD", candidateRef: ref, semanticIdentity: ref, proposedType, content, sourceText,
  polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
});
const delta = (changes: PersistentProjectDeltaChange[], extra: Partial<PersistentProjectDeltaCandidate> = {}): PersistentProjectDeltaCandidate => ({
  contract: "PERSISTENT_PROJECT_DELTA_CANDIDATE", contractVersion: "0.4.0", projectWriteAuthorized: false,
  changes, relations: [], temporalQualifications: [], expectedVariableOccasions: [], ...extra,
});
const time = (subjectProjectRef: string, sourceText: string, day = 1): PersistentTemporalQualification => ({
  operation: "ADD", qualificationId: `time:${subjectProjectRef}:${day}`, subjectProjectRef, sourceText, temporalRole: "ACQUISITION_TIME",
  anchor: { kind: "TIMEPOINT", direction: "AT", unit: "jour", offset: day, lowerBound: null, upperBound: null,
    relativeEventLabel: null, tolerance: null, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } },
  assertionKind: "USER_STATED", evidenceRefs: [],
});
const comparison = (sourceText: string): PersistentProjectRelation => ({ relationRef: "comparison", sourceText, relationType: "COMPARES_WITH",
  sourceObjectRef: "alpha", targetObjectRef: "beta", polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN" as const, assertionKind: "USER_STATED" as const, evidenceRefs: [] });
const coverage = (raw: string, candidate: PersistentProjectDeltaCandidate) => evaluatePersistentSourceCoverage({ raw, candidate, sourceTurnRef: "turn" });

describe("N5 — granular source coverage, separate from scientific truth and adoption", () => {
  it("recognizes the explicit NIHSS identity in Score NIHSS, without promoting an epistemic state", () => {
    const candidate = delta([object("nihss", "Score NIHSS", "le NIHSS", "CANONICAL_VARIABLE")]);
    candidate.changes[0].epistemicState = "UNKNOWN";
    expect(coverage("le NIHSS", candidate)[0].status).toBe("REPRESENTED");
    expect(candidate.changes[0].epistemicState).toBe("UNKNOWN");
  });
  it("composes an acquisition and its own temporal qualification, keeping the unknown reference", () => {
    const raw = "on garde l'IRM à J1";
    const candidate = delta([object("mri", "IRM", raw, "ACQUISITION")], { temporalQualifications: [time("mri", raw)] });
    const result = coverage(raw, candidate)[0];
    expect(result.status).toBe("REPRESENTED");
    expect(result.evidenceRefs).toContain("time:mri:1");
    expect(candidate.temporalQualifications[0].anchor.reference.status).toBe("UNKNOWN");
  });
  it("composes objects only through the explicit comparison relation", () => {
    const raw = "Alpha comparé à Beta";
    const objects = [object("alpha", "Alpha", raw), object("beta", "Beta", raw)];
    expect(coverage(raw, delta(objects, { relations: [comparison(raw)] }))[0].status).toBe("REPRESENTED");
    expect(coverage(raw, delta(objects))[0].status).not.toBe("REPRESENTED");
  });
  it("composes a comparison and a linked acquisition time", () => {
    const raw = "Alpha comparé à Beta à J1";
    const candidate = delta([object("alpha", "Alpha", raw, "ACQUISITION"), object("beta", "Beta", raw, "ACQUISITION")], {
      relations: [comparison(raw)], temporalQualifications: [time("alpha", raw)],
    });
    const result = coverage(raw, candidate)[0];
    expect(result.status).toBe("REPRESENTED");
    expect(result.evidenceRefs).toEqual(expect.arrayContaining(["comparison", "time:alpha:1"]));
  });
  it("keeps a missing upper age bound partial, despite a large covering anchor", () => {
    const raw = "adultes de 18 à 80 ans";
    const result = coverage(raw, delta([object("age", "Adultes : âge minimum 18 ans", raw, "ELIGIBILITY_CRITERION")]))[0];
    expect(result.status).toBe("PARTIALLY_REPRESENTED");
    expect(result.unmatchedTerms).toContain("80");
  });
  it("keeps J6 visible when only the J1 occasion exists", () => {
    const raw = "IRM à J1 et J6";
    const candidate = delta([object("mri", "IRM", raw, "ACQUISITION")], { temporalQualifications: [time("mri", raw)] });
    expect(coverage(raw, candidate).find(span => span.sourceText === "J6")?.status).toBe("UNREPRESENTED");
    expect(sourceCoverageFindings(coverage(raw, candidate)).some(finding => finding.status === "OPEN" && finding.message.includes("J6"))).toBe(true);
  });
  it("keeps a genuinely absent explicit negative constraint visible", () => {
    const findings = sourceCoverageFindings(coverage("pas de PET", delta([])));
    expect(findings[0].code).toBe("SOURCE_COVERAGE_UNREPRESENTED");
    expect(findings[0].status).toBe("OPEN");
  });
  it("does not cover two independent readers with one reader", () => {
    const raw = "deux lecteurs indépendants";
    const result = coverage(raw, delta([object("readers", "Un lecteur", raw, "CONSTRAINT")]))[0];
    expect(result.status).toBe("PARTIALLY_REPRESENTED");
    expect(result.unmatchedTerms).toEqual(expect.arrayContaining(["deux", "independants"]));
  });
  it("reuses the existing request predicate and does not persist a proposal request", () => {
    const result = coverage("Propose plusieurs pistes", delta([]))[0];
    expect(result.status).toBe("CONVERSATIONAL_OR_DISCOURSE");
    expect(result.recognizedConversationAct).toBe("EXISTING_REQUEST_RECOGNITION");
  });
  it("reuses the existing sentence mood for a methodological request, without answering it", () => {
    expect(coverage("Peux-tu me proposer une première version des critères d'inclusion", delta([]))[0].status)
      .toBe("CONVERSATIONAL_OR_DISCOURSE");
  });
  it("keeps an unclassified fragment UNKNOWN rather than creating a conversation classifier", () => {
    const result = coverage("Pour l'instant", delta([]))[0];
    expect(result.status).toBe("UNKNOWN");
    expect(sourceCoverageFindings([result])[0].status).toBe("OPEN");
  });
  it("does not blanket-cover an internal omission from one paragraph anchor", () => {
    const raw = "IRM à J1. Pas de PET.";
    const candidate = delta([object("mri", "IRM à J1", raw, "ACQUISITION")]);
    expect(coverage(raw, candidate)[1].status).toBe("UNREPRESENTED");
    expect(coverage(raw, candidate)[1].evidenceRefs).toEqual([]);
  });
  it("does not borrow a time from an unrelated acquisition on a different span", () => {
    const raw = "IRM à J1. Scanner à J6.";
    const candidate = delta([object("mri", "IRM", "IRM à J1", "ACQUISITION"), object("ct", "Scanner", "Scanner à J6", "ACQUISITION")], {
      temporalQualifications: [time("ct", "Scanner à J6", 1)],
    });
    const first = coverage(raw, candidate)[0];
    expect(first.status).toBe("PARTIALLY_REPRESENTED");
    expect(first.evidenceRefs).not.toContain("time:ct:1");
  });
  it("does not arbitrarily compose unlinked objects from different anchors", () => {
    const raw = "Alpha comparé à Beta. Alpha. Beta.";
    expect(coverage(raw, delta([object("alpha", "Alpha", "Alpha."), object("beta", "Beta", "Beta.")]))[0].status)
      .not.toBe("REPRESENTED");
  });
  it("does not use a removed or ungrounded object as representation evidence", () => {
    const absent = object("mri", "IRM à J1", "Scanner à J6", "ACQUISITION");
    expect(coverage("IRM à J1", delta([absent]))[0].status).toBe("UNREPRESENTED");
    absent.sourceText = "IRM à J1"; absent.operation = "REMOVE";
    expect(coverage("IRM à J1", delta([absent]))[0].status).toBe("UNREPRESENTED");
  });
  it("does not treat reversed numeric bounds as an exact rendering", () => {
    const raw = "adultes de 18 à 80 ans";
    expect(coverage(raw, delta([object("age", "Adultes de 80 à 18 ans", raw, "ELIGIBILITY_CRITERION")]))[0].status)
      .toBe("PARTIALLY_REPRESENTED");
  });
  it.each([["Valeur 30 %", "Valeur 30"], ["Valeur < 30", "Valeur > 30"]])("preserves the unit/operator obligation in %s", (raw, content) => {
    expect(coverage(raw, delta([object("value", content, raw, "CONSTRAINT")]))[0].status).toBe("PARTIALLY_REPRESENTED");
  });
  it("does not promote a modality when a conditional phrase is not represented", () => {
    const raw = "IRM si possible avant la reperfusion";
    const candidate = delta([object("mri", "IRM avant la reperfusion", raw, "ACQUISITION")]);
    expect(coverage(raw, candidate)[0].status).toBe("PARTIALLY_REPRESENTED");
    expect(coverage(raw, candidate)[0].unmatchedTerms).toContain("possible");
  });
  it("does not borrow two comparison-end quantities to fabricate one age interval", () => {
    const raw = "Adultes de 18 à 80 ans";
    const candidate = delta([object("alpha", "Adultes 18 ans", raw), object("beta", "Adultes 80 ans", raw)], { relations: [comparison(raw)] });
    expect(coverage(raw, candidate)[0].status).toBe("PARTIALLY_REPRESENTED");
  });
  it("does not turn a temporal presentation's missing-reference diagnostic into a source fact", () => {
    const raw = "IRM référentiel à préciser";
    const qualification = time("mri", raw);
    qualification.anchor.kind = "RELATIVE_EVENT"; qualification.anchor.offset = null; qualification.anchor.unit = null;
    expect(coverage(raw, delta([object("mri", "IRM", raw, "ACQUISITION")], { temporalQualifications: [qualification] }))[0].status)
      .toBe("PARTIALLY_REPRESENTED");
  });
  it("composes independently represented variable names with identical provenance", () => {
    const raw = "Variables Alpha Beta";
    const candidate = delta([object("alpha", "Variables Alpha", raw, "CANONICAL_VARIABLE"), object("beta", "Variables Beta", raw, "CANONICAL_VARIABLE")]);
    expect(coverage(raw, candidate)[0].status).toBe("REPRESENTED");
  });
  it("shows a source omission separately from À clarifier, without authorizing a Project write", () => {
    const raw = "IRM à J1. Pas de PET.";
    const candidate = delta([object("mri", "IRM à J1", raw, "ACQUISITION")]);
    const contribution = contributionFromPersistentDelta({ candidate, currentProject: null,
      conversation: { conversationId: "c", language: "fr", turns: [{ turnId: "t", role: "USER", content: raw }] } });
    const prepared = prepareResearchProjectContributionCandidate(contribution, null);
    const markup = renderToStaticMarkup(<ContributionReview contribution={contribution} candidate={prepared} status="PENDING"
      onConfirm={() => {}} onCorrect={() => {}} onReject={() => {}} />);
    expect(markup).toContain("Passages à vérifier");
    expect(markup).toContain("Pas de PET.");
    expect(markup).not.toContain("À clarifier");
    expect(contribution.scientificContent.clarificationNeeds).toEqual([]);
    expect(contribution.decisionBoundary.projectWriteAuthorized).toBe(false);
    expect(contribution.epistemicBoundary.candidateIsAdopted).toBe(false);
  });
  it.each(["AVC-T02", "AVC-T03", "RHU-T03", "RHU-T09"])("preserves validated recorded objects/links/values and N1/references for %s", id => {
    const record = JSON.parse(readFileSync(resolve("validation/protocol-designer-v1-human-conversation-causal-audit-02", `${id}-recorded-provider.json`), "utf8"));
    const sections: string[] = record.request.input.split("\n\n");
    const catalog = JSON.parse(sections.find(section => section.startsWith("CATALOGUE D'ANCRAGES")).split("\n").slice(1).join("\n"));
    const raw: string = catalog.anchors.find(anchor => anchor.fragmentKind === "FULL_TURN").exactText;
    expect(validatePersistentProviderContract(record.output).valid).toBe(true);
    const materialized = materializePersistentSourceAnchors({ value: record.output, catalog, currentUserTurn: { turnId: catalog.currentUserTurnId, content: raw } });
    expect(materialized.valid).toBe(true);
    const constrained = constrainPersistentRelationsToCanonicalSignatures(materialized.value, null);
    const conversation = { conversationId: "test", language: "fr" as const, turns: [{ turnId: catalog.currentUserTurnId, role: "USER" as const, content: raw }] };
    const checked = validatePersistentProjectDelta(constrained.value, raw, null, conversation);
    expect(checked.validation.valid).toBe(true);
    const original = JSON.stringify(checked.candidate);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: null });
    expect(JSON.stringify(checked.candidate)).toBe(original);
    expect(prepareResearchProjectContributionCandidate(contribution, null).canonicalChangeSet.status).toBe("READY_FOR_HUMAN_DECISION");
    if (id.startsWith("AVC")) expect(checked.candidate.changes.filter(change => change.proposedType === "ANALYSIS_SPECIFICATION").length).toBeGreaterThanOrEqual(2);
    if (id === "RHU-T03") expect(checked.candidate.expectedVariableOccasions).toHaveLength(6);
  });
});
