import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evidenceLinkTypes } from "../scientific-model-schema.mjs";
import { validateScientificAssertionRevisions } from "../scientific-model-validate.mjs";
import { assertionReviewDecisions, evidenceRelationCounts, scientificAssertionIdentities, scientificAssertionRevisions, scientificEvidenceLinks } from "./assertions.mjs";
import { scientificCorpusConceptDesignations, scientificCorpusConceptIdentities, scientificCorpusEntityRevisions, conceptBySlug, ontologicalRequalificationDecisions } from "./concepts.mjs";
import { derivedMeasurements, quantitativeModelRecords } from "./measurements.mjs";
import { inspectProtectedSurfaces } from "./protected-surfaces.mjs";
import { internalScientificProjections, projectionReadiness } from "./projections.mjs";
import { competencyQueries, queryScientificCorpus } from "./query.mjs";
import { conceptReadiness, readinessRules, synthesisReadiness } from "./readiness.mjs";
import { scientificSourceRevisions } from "./sources.mjs";
import { createScientificSynthesis, scientificSyntheses, synthesisDefinitions } from "./synthesis.mjs";
import { validateP4AssertionCandidate, validateP4EvidenceCandidate, validateScientificCorpus } from "./validate.mjs";
import { stableStringify } from "../migration/stable-json.mjs";
import { withoutAuthorizedP12ProtectedChanges } from "../../test/p12-protected-surfaces.mjs";

const root = process.cwd();
const protectedState = inspectProtectedSurfaces({ root });
const corpusValidation = validateScientificCorpus({ root, inspectGit: false });
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const p4ScriptPaths = [
  "scripts/enrich-scientific-corpus.mjs", "scripts/validate-scientific-corpus.mjs", "scripts/report-scientific-corpus.mjs",
  "scripts/query-scientific-corpus.mjs", "scripts/report-scientific-synthesis.mjs", "scripts/validate-scientific-readiness.mjs",
  "scripts/validate-scientific-projections.mjs", "scripts/report-scientific-projections.mjs",
];
const p4ScriptText = p4ScriptPaths.map((path) => readFileSync(resolve(root, path), "utf8")).join("\n");
const query = (key) => queryScientificCorpus(competencyQueries[key]);

describe("P4 real sourced ECV/T1 scientific corpus", () => {
  it("01 — contains a non-empty real scientific corpus", () => {
    expect(scientificAssertionRevisions.length).toBeGreaterThanOrEqual(40);
    expect(scientificEvidenceLinks.length).toBeGreaterThan(0);
  });

  it("02 — versions every retained real source", () => {
    expect(scientificSourceRevisions.length).toBeGreaterThanOrEqual(20);
    expect(scientificSourceRevisions.every((source) => source.stableId !== source.revisionId && source.revisionNumber === 1)).toBe(true);
  });

  it("03 — validates every DOI that is present", () => {
    expect(scientificSourceRevisions.filter((source) => source.doi).every((source) => /^10\.\d{4,9}\/[\w.()/:;-]+$/i.test(source.doi))).toBe(true);
  });

  it("04 — validates every PMID that is present", () => {
    expect(scientificSourceRevisions.filter((source) => source.pmid).every((source) => /^\d{7,8}$/.test(source.pmid))).toBe(true);
  });

  it("05 — preserves unknown fields as null", () => {
    expect(scientificSourceRevisions.every((source) => source.repositoryPath === null)).toBe(true);
    expect(quantitativeModelRecords.every((record) => record.referenceRange === null && record.threshold === null)).toBe(true);
  });

  it("06 — requires an exploitable locator on every evidence link", () => {
    expect(scientificEvidenceLinks.every((link) => validateP4EvidenceCandidate(link).valid)).toBe(true);
  });

  it("07 — keeps assertions atomic", () => {
    const result = validateScientificAssertionRevisions({ assertionIdentities: scientificAssertionIdentities, assertionRevisions: scientificAssertionRevisions, evidenceLinks: scientificEvidenceLinks, sourceRevisions: scientificSourceRevisions });
    expect(result.valid).toBe(true);
    expect(result.errors.filter((error) => error.code === "ASSERTION_CONCLUSION_CARDINALITY")).toHaveLength(0);
  });

  it("08 — refuses a real assertion without source", () => {
    const candidate = { ...scientificAssertionRevisions[0], sourceRefs: [] };
    expect(validateP4AssertionCandidate(candidate, []).errors.map((error) => error.code)).toContain("REAL_ASSERTION_WITHOUT_SOURCE");
  });

  it("09 — refuses SUPPORTS without an exploitable passage", () => {
    const candidate = { ...scientificEvidenceLinks.find((link) => link.relationType === "SUPPORTS"), locator: null, extraction: { section: null, passage: null } };
    expect(validateP4EvidenceCandidate(candidate).valid).toBe(false);
  });

  it("10 — keeps MENTIONS distinct from SUPPORTS", () => {
    expect(evidenceRelationCounts.MENTIONS).toBeGreaterThan(0);
    expect(scientificEvidenceLinks.filter((link) => link.relationType === "MENTIONS").every((link) => !scientificEvidenceLinks.some((other) => other.evidenceLinkId === link.evidenceLinkId && other.relationType === "SUPPORTS"))).toBe(true);
  });

  it("11 — preserves REFUTES evidence", () => expect(evidenceRelationCounts.REFUTES).toBeGreaterThan(0));
  it("12 — preserves QUALIFIES evidence", () => expect(evidenceRelationCounts.QUALIFIES).toBeGreaterThan(0));

  it("13 — preserves contextual contradictions", () => {
    expect(corpusValidation.layers.assertions.contradictions.length).toBeGreaterThan(0);
    expect(query("contradictions").contradictions.length).toBeGreaterThan(0);
  });

  it("14 — requires an explicit rule for consensus", () => {
    expect(scientificSyntheses.filter((item) => item.consensus.detected).every((item) => item.consensus.ruleId && item.consensus.rule.requiresCurrentOfficialConsensusOrGuideline)).toBe(true);
  });

  it("15 — never converts a numeric publication majority into consensus", () => {
    expect(scientificSyntheses.every((item) => item.convergence.publicationMajorityUsed === false && item.consensus.rule.rawPublicationCountIgnored === true)).toBe(true);
  });

  it("16 — strictly distinguishes CMR ECV and CT ECV", () => {
    const [mr, ct] = [derivedMeasurements.find((item) => item.stableId.endsWith("ecv-mr")), derivedMeasurements.find((item) => item.stableId.endsWith("ecv-ct-single-energy"))];
    expect(mr.formula).not.toBe(ct.formula);
    expect(mr.method).not.toBe(ct.method);
  });

  it("17 — distinguishes native from post-contrast T1", () => expect(conceptBySlug["native-myocardial-t1"]).not.toBe(conceptBySlug["post-contrast-myocardial-t1"]));
  it("18 — distinguishes T1 mapping from ECV", () => expect(conceptBySlug["myocardial-t1-mapping"]).not.toBe(conceptBySlug["myocardial-ecv-mr"]));

  it("19 — represents sourced ECV as a derived measurement", () => {
    expect(derivedMeasurements.some((item) => item.stableId.endsWith("myocardial-ecv-mr") && item.recordType === "DerivedMeasurement")).toBe(true);
  });

  it("20 — sources the CMR ECV formula", () => {
    const record = derivedMeasurements.find((item) => item.stableId.endsWith("myocardial-ecv-mr"));
    expect(record.formula).toContain("T1_myo_post");
    expect(record.sourceRefs.length).toBeGreaterThan(0);
  });

  it("21 — has no invented formula", () => expect(quantitativeModelRecords.filter((item) => item.formula).every((item) => item.sourceRefs.length > 0)).toBe(true));
  it("22 — has no invented normal value", () => expect(quantitativeModelRecords.every((item) => item.referenceRange === null)).toBe(true));
  it("23 — has no unsourced unit", () => expect(quantitativeModelRecords.every((item) => item.unit && item.sourceRefs.length > 0)).toBe(true));
  it("24 — filters 1.5 T evidence", () => expect(query("ecv15T").dataPresent.assertionCount).toBeGreaterThan(0));
  it("25 — filters 3 T evidence", () => expect(query("ecv3T").dataPresent.assertionCount).toBeGreaterThan(0));
  it("26 — filters MOLLI", () => expect(query("molli").dataPresent.assertionCount).toBeGreaterThan(0));
  it("27 — filters SASHA", () => expect(query("sasha").dataPresent.assertionCount).toBeGreaterThan(0));
  it("28 — filters myocarditis", () => expect(query("ecvMyocarditis").dataPresent.assertionCount).toBeGreaterThan(0));
  it("29 — filters myocardial infarction", () => expect(query("ecvInfarction").dataPresent.assertionCount).toBeGreaterThan(0));

  it("30 — includes amyloidosis only with sourced assertions", () => {
    const result = queryScientificCorpus({ concept: "ecv", disease: "amyloidosis", modality: "mr" });
    expect(result.applicableAssertions.length).toBeGreaterThan(0);
    expect(result.applicableAssertions.every((assertion) => assertion.sourceRefs.length > 0)).toBe(true);
  });

  it("31 — filters CT ECV", () => expect(query("ecvCt").dataPresent.assertionCount).toBeGreaterThan(0));

  it("32 — does not infer an unreported manufacturer", () => {
    const result = queryScientificCorpus({ concept: "ecv", manufacturer: "UNREPORTED_MANUFACTURER" });
    expect(result.applicableAssertions).toHaveLength(0);
    expect(result.dataAbsent).toContain("NO_REPORTED_CONTEXT:manufacturer");
  });

  it("33 — does not infer an unreported software version", () => {
    const result = queryScientificCorpus({ concept: "ecv", software: "UNREPORTED_SOFTWARE" });
    expect(result.applicableAssertions).toHaveLength(0);
    expect(result.dataAbsent).toContain("NO_REPORTED_CONTEXT:softwareVersion");
  });

  it("34 — attaches documented limitations", () => expect(query("limitations").applicableAssertions.length).toBeGreaterThan(0));
  it("35 — preserves documented biases", () => expect(scientificAssertionRevisions.some((assertion) => /BIAS|UNDERESTIMATION/.test(`${assertion.predicate} ${assertion.literalValue}`))).toBe(true));
  it("36 — distinguishes repeatability and reproducibility", () => expect(conceptBySlug.repeatability).not.toBe(conceptBySlug.reproducibility));
  it("37 — makes intersite reproducibility queryable", () => expect(query("reproducibility").applicableAssertions.length).toBeGreaterThan(0));

  it("38 — manages official documentary corrections", () => {
    expect(scientificEvidenceLinks.filter((link) => link.relationType === "CORRECTS").length).toBe(2);
  });

  it("39 — supports retraction lifecycle without inventing one", () => {
    expect(evidenceLinkTypes).toContain("RETRACTS");
    expect(scientificEvidenceLinks.filter((link) => link.relationType === "RETRACTS")).toHaveLength(0);
  });

  it("40 — qualifies a corrected source", () => {
    const source = scientificSourceRevisions.find((item) => item.pmid === "28992817");
    expect(source.metadata.documentStatus).toBe("CORRECTED");
    expect(source.correctedByRevisionId).toContain("29415744");
  });

  it("41 — produces deterministic composed queries", () => {
    const first = queryScientificCorpus({ concept: "ecv", modality: "mr", disease: "myocarditis" });
    const second = queryScientificCorpus({ concept: "ecv", modality: "mr", disease: "myocarditis" });
    expect(stableStringify(first)).toBe(stableStringify(second));
  });

  it("42 — exposes missing data explicitly", () => expect(query("ctReproducibility").dataAbsent).toContain("NO_APPLICABLE_ASSERTION"));
  it("43 — excludes out-of-context assertions", () => expect(queryScientificCorpus({ concept: "ecv", manufacturer: "UNREPORTED_MANUFACTURER" }).outOfContextAssertions.length).toBeGreaterThan(0));
  it("44 — includes context-compatible assertions", () => expect(queryScientificCorpus({ concept: "ecv", modality: "mr", disease: "myocarditis" }).applicableAssertions.length).toBeGreaterThan(0));
  it("45 — creates a valid internal ECV projection", () => expect(internalScientificProjections.some((item) => item.key === "scientific-card-ecv" && item.assertions.length > 0)).toBe(true));
  it("46 — creates a valid internal T1 mapping projection", () => expect(internalScientificProjections.some((item) => item.key === "scientific-card-t1-mapping" && item.assertions.length > 0)).toBe(true));
  it("47 — creates a valid MOLLI/SASHA comparison", () => expect(internalScientificProjections.some((item) => item.key === "comparison-molli-sasha" && item.assertions.length > 0)).toBe(true));
  it("48 — creates a valid CMR/CT comparison", () => expect(internalScientificProjections.some((item) => item.key === "comparison-mr-ct-ecv" && item.assertions.length > 0)).toBe(true));
  it("49 — creates a valid myocarditis projection", () => expect(internalScientificProjections.some((item) => item.key === "knowledge-state-ecv-myocarditis" && item.assertions.length > 0)).toBe(true));
  it("50 — routes no internal projection", () => expect(internalScientificProjections.every((item) => item.route === null)).toBe(true));
  it("51 — indexes no internal projection", () => expect(internalScientificProjections.every((item) => item.indexable === false)).toBe(true));
  it("52 — places no internal projection in the sitemap", () => expect(internalScientificProjections.every((item) => item.inSitemap === false)).toBe(true));
  it("53 — creates no public text", () => expect(internalScientificProjections.every((item) => item.prose === null && item.publicContentGenerated === false)).toBe(true));
  it("54 — calculates seven readiness dimensions independently", () => expect(Object.keys(readinessRules)).toHaveLength(7));

  it("55 — keeps scientificReady distinct from publicPublicationReady", () => {
    expect(projectionReadiness.some((item) => item.scientificReady.ready)).toBe(true);
    expect(projectionReadiness.every((item) => item.publicPublicationReady.ready === false)).toBe(true);
  });

  it("56 — never claims a human review", () => {
    expect(scientificAssertionRevisions.every((item) => item.humanReviewed === false)).toBe(true);
    expect(assertionReviewDecisions.every((item) => item.scientificHumanReview === null)).toBe(true);
  });

  it("57 — qualifies every extraction", () => expect(scientificEvidenceLinks.every((link) => link.extraction?.interpretationLevel)).toBe(true));

  it("58 — flags derived interpretations explicitly", () => {
    const derived = scientificEvidenceLinks.filter((link) => link.extraction?.interpretationLevel === "DERIVED_INTERPRETATION");
    expect(derived.length).toBeGreaterThan(0);
    expect(derived.every((link) => link.extraction.directAuthorStatement === false)).toBe(true);
  });

  it("59 — stores multidimensional source quality without a global score", () => {
    expect(scientificSourceRevisions.every((source) => source.metadata.sourceQuality && !("globalScore" in source.metadata.sourceQuality))).toBe(true);
  });

  it("60 — produces deterministic structured syntheses", () => {
    const definition = synthesisDefinitions.find((item) => item.key === "ecv");
    expect(stableStringify(createScientificSynthesis(definition))).toBe(stableStringify(createScientificSynthesis(definition)));
  });

  it("61 — never performs or labels a statistical meta-analysis", () => {
    expect(scientificSyntheses.every((item) => item.statisticalMetaAnalysisPerformed === false && item.synthesisType.includes("NOT_META_ANALYSIS"))).toBe(true);
  });

  it("62 — creates no automated clinical recommendation engine", () => {
    expect(internalScientificProjections.every((item) => item.clinicalRecommendationEngine === false)).toBe(true);
  });

  it("63 — creates concepts only with selected sources", () => expect(scientificCorpusConceptIdentities.every((item) => item.sourceRefs.length > 0)).toBe(true));
  it("64 — sources every designation", () => expect(scientificCorpusConceptDesignations.every((item) => item.sourceRef)).toBe(true));
  it("65 — preserves ambiguous historical classifications", () => expect(ontologicalRequalificationDecisions.every((item) => item.decision === "DEFERRED" && item.appliedClass === item.historicalClass)).toBe(true));
  it("66 — leaves editorial-engine unchanged", () => expect(protectedState.editorialEngineUnchanged).toBe(true));
  it("67 — leaves public pages unchanged outside the authorized P12 explorer", () => expect(withoutAuthorizedP12ProtectedChanges(protectedState.protectedChanges.filter((item) => item.surface === "PUBLIC_PAGES"))).toHaveLength(0));
  it("68 — leaves public routes unchanged outside the authorized P12 explorer", () => expect(withoutAuthorizedP12ProtectedChanges(protectedState.protectedChanges.filter((item) => item.surface === "PUBLIC_ROUTES"))).toHaveLength(0));
  it("69 — leaves SEO files unchanged", () => expect(protectedState.protectedChanges.filter((item) => item.surface === "SEO")).toHaveLength(0));
  it("70 — leaves the sitemap unchanged", () => expect(protectedState.changedPaths.filter((path) => /sitemap/i.test(path))).toHaveLength(0));
  it("71 — leaves viewers unchanged", () => expect(protectedState.protectedChanges.filter((item) => item.surface === "VIEWERS")).toHaveLength(0));
  it("72 — leaves PACS unchanged", () => expect(protectedState.protectedChanges.filter((item) => item.surface === "PACS")).toHaveLength(0));
  it("73 — leaves Supabase unchanged", () => expect(protectedState.protectedChanges.filter((item) => item.surface === "SUPABASE")).toHaveLength(0));

  it("74 — defines no deployment action", () => {
    expect(p4ScriptText).not.toMatch(/\bdeploy\b/);
    expect(Object.keys(packageJson.scripts).filter((key) => key.includes("scientific")).every((key) => !/deploy/.test(packageJson.scripts[key]))).toBe(true);
  });

  it("75 — defines no commit action", () => expect(p4ScriptText).not.toMatch(/git\s+commit/));
  it("76 — defines no push action", () => expect(p4ScriptText).not.toMatch(/git\s+push/));

  it("77 — passes git diff whitespace validation", () => {
    expect(() => execFileSync("git", ["diff", "--check"], { cwd: root, stdio: "pipe" })).not.toThrow();
  });

  it("validates the complete P4 corpus gate", () => {
    expect(corpusValidation.valid).toBe(true);
    expect(conceptReadiness.length).toBe(scientificCorpusConceptIdentities.length);
    expect(synthesisReadiness.length).toBe(scientificSyntheses.length);
    expect(scientificCorpusEntityRevisions.length).toBe(scientificCorpusConceptIdentities.length);
  });

  it("rejects exploratory evidence promoted to a recommendation", () => {
    const candidate = { ...scientificAssertionRevisions[0], assertionType: "RecommendationAssertion", sourceRefs: [scientificSourceRevisions[0].revisionId] };
    const link = { ...scientificEvidenceLinks[0], evidenceSourceType: "OBSERVATIONAL_STUDY", extraction: { ...scientificEvidenceLinks[0].extraction, interpretationLevel: "NUMERIC_RESULT" } };
    expect(validateP4AssertionCandidate(candidate, [link]).errors.map((error) => error.code)).toContain("EXPLORATORY_RESULT_PROMOTED_TO_RECOMMENDATION");
  });
});
