/* eslint-disable @typescript-eslint/no-explicit-any -- bounded evaluator intentionally inspects heterogeneous immutable owner contracts */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  executeKnowledgeRequest,
  logicalDigest,
  stableStringify,
} from "@/features/knowledge-engine";
import { executeImagingStudyDesigner } from "@/features/imaging-study-designer";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import { invokeImagingForProject } from "@/features/protocol-designer/product-imaging-owner-runtime";
import {
  createProductKnowledgeOwnerLedger,
  invokeKnowledgeForProject,
  readProductKnowledgeOwnerResult,
} from "@/features/protocol-designer/product-knowledge-owner-runtime";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { invokeRegulatoryForProject } from "@/features/protocol-designer/product-regulatory-owner-runtime";
import {
  executeScientificOwnerChainValidationProfile,
  replayScientificOwnerChainValidationProfile,
} from "@/features/protocol-designer/product-scientific-loop-validation-runtime";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  listScientificRunEvents,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { ProjectContextSnapshot, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { AcceptanceEnvelope, CharacterizationCase, FrozenInputPack } from "./authoring";
import { CAMPAIGN_ID, HARNESS_VERSION, INITIAL_HEAD } from "./authoring";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const clone = <T>(value: T): T => structuredClone(value);
const textOf = (value: unknown) => stableStringify(value).toLocaleLowerCase("fr-FR");

type Outcome = "SATISFIED" | "PARTIALLY_SATISFIED" | "VIOLATED" | "NOT_APPLICABLE" | "NON_ADJUDICABLE" | "HUMAN_ARBITRATION_REQUIRED";
type Evaluation = {
  obligationId: string;
  checkId: string;
  critical: boolean;
  outcome: Outcome;
  failureClass: string;
  evidence: string[];
  note: string;
};

type CaseExecution = {
  caseId: string;
  owner: string;
  inputPackDigest: string;
  traceRunId: string;
  traceEventRefs: string[];
  requestRef: string | null;
  requestDigest: string | null;
  outputResultRef: string | null;
  outputDigest: string | null;
  status: string;
  error: string | null;
  result: unknown;
  observation: unknown;
  evaluations: Evaluation[];
  verdict: "FULLY_SATISFIED" | "PARTIALLY_SATISFIED" | "CRITICAL_VIOLATION" | "NON_ADJUDICABLE" | "HUMAN_ARBITRATION_REQUIRED";
  firstDivergentStage: string | null;
  runtimeProviderCalls: 0;
};

const caseRegistry = read<{ cases: CharacterizationCase[] }>("case-registry.json");
const envelopeRegistry = read<{ envelopes: AcceptanceEnvelope[] }>("acceptance-envelope-registry.json");
const inputRegistry = read<{ packs: FrozenInputPack[] }>("frozen-input-registry.json");
const freeze = read<{ gitHead: string; freezeDigest: string; registries: { cases: number; envelopes: number; packs: number } }>("characterization-freeze.json");

if (freeze.gitHead !== INITIAL_HEAD
  || freeze.registries.cases !== caseRegistry.cases.length
  || freeze.registries.envelopes !== envelopeRegistry.envelopes.length
  || freeze.registries.packs !== inputRegistry.packs.length
  || caseRegistry.cases.length !== 35) {
  throw new Error("W1_QUAL_01_FROZEN_CAMPAIGN_INVALID");
}
for (const pack of inputRegistry.packs) {
  const material = { version: pack.version, sourceCase: pack.sourceCase, ownerUnderTest: pack.ownerUnderTest, provenance: pack.provenance, purpose: pack.purpose, payload: pack.payload };
  if (logicalDigest(material) !== pack.digest || !pack.frozen) throw new Error(`W1_QUAL_01_FROZEN_INPUT_DIGEST_INVALID:${pack.sourceCase}`);
}

mkdirSync(OUT, { recursive: true });
const envelopes = new Map(envelopeRegistry.envelopes.map((item) => [item.caseId, item]));
const packs = new Map(inputRegistry.packs.map((item) => [item.sourceCase, item]));
const traces: unknown[] = [];
const results = new Map<string, CaseExecution[]>();
const rawByCase = new Map<string, any>();

const times = (index: number) => {
  const minute = 30 + index;
  const hh = 16 + Math.floor(minute / 60);
  const mm = minute % 60;
  const base = `2026-08-25T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return { startedAt: `${base}:00.000Z`, completedAt: `${base}:01.000Z` };
};

const newTrace = (caseId: string, snapshot: Readonly<ProjectContextSnapshot>, startedAt: string, suffix = "primary") => createScientificRunTraceRecorder({
  ledger: createScientificExecutionTraceLedger(`session:${CAMPAIGN_ID}:${caseId}:${suffix}`),
  runId: `scientific-run:${CAMPAIGN_ID}:${caseId}:${suffix}`,
  projectSnapshot: snapshot,
  initiatorContext: { kind: suffix === "primary" ? "TEST_HARNESS" : "REPLAY_ANALYSIS", initiatorRef: `${CAMPAIGN_ID}:${caseId}:${suffix}` },
  startedAt,
  createdAt: startedAt,
});

const finishTrace = (caseId: string, trace: ReturnType<typeof newTrace>, completedAt: string, error: string | null, suffix = "primary") => {
  const run = error ? trace.fail(completedAt, error, "UNKNOWN_STAGE") : trace.complete(completedAt);
  const ledger = trace.getLedger();
  const events = listScientificRunEvents({ ledger, runId: run.runId });
  const item = { caseId, executionKind: suffix === "primary" ? "PRIMARY" : "PREDECLARED_REPLAY", run, events, ledgerDigest: ledger.ledgerDigest };
  traces.push(item);
  return item;
};

const runtimeEvidence = (raw: any) => ({
  zeroProjectWrite: raw?.projectWrites === 0 || raw?.execution?.projectWrites === 0 || raw?.expectedPreRuntimeRejection === true,
  noProviderCall: ["externalEvidenceCalls", "geminiCalls", "terraCalls", "webCalls", "externalRegulatoryCalls", "obsRuntimeCalls", "semanticReviewerCalls"].every((key) => (raw?.[key] ?? raw?.execution?.[key] ?? 0) === 0),
  traceBound: Boolean(raw?.traceEventRefs?.length),
});

const evaluate = (caseItem: CharacterizationCase, raw: any, traceEventRefs: string[]): Evaluation[] => {
  const envelope = envelopes.get(caseItem.caseId);
  if (!envelope) throw new Error(`W1_QUAL_ENVELOPE_MISSING:${caseItem.caseId}`);
  const evidence = runtimeEvidence({ ...raw, traceEventRefs });
  const native = raw?.result?.nativePayload ?? raw?.execution?.run ?? null;
  const outputText = textOf(native ?? raw?.error ?? "");
  return envelope.obligations.map((item): Evaluation => {
    let outcome: Outcome = "NON_ADJUDICABLE";
    let note = "No deterministic evaluator mapping.";
    const satisfy = (passed: boolean, ok: string, fail: string) => { outcome = passed ? "SATISFIED" : "VIOLATED"; note = passed ? ok : fail; };
    switch (item.checkId) {
      case "ZERO_PROJECT_WRITE": satisfy(evidence.zeroProjectWrite, "Zero Project writes observed.", "Project write boundary was not demonstrated."); break;
      case "NO_PROVIDER_CALL": satisfy(evidence.noProviderCall, "All external/LLM/provider counters are zero.", "An external or LLM provider counter is non-zero."); break;
      case "TRACE_BOUND": satisfy(evidence.traceBound, "Scientific Execution Trace events retained.", "Trace event binding missing."); break;
      case "K_HONEST_GAP": {
        const assertions = native?.applicableAssertions ?? [];
        const hasGap = ["NO_MATCH", "OUT_OF_DOMAIN", "NO_PROVIDER", "COVERAGE_UNKNOWN"].includes(native?.coverageStatus) || (native?.gaps?.length ?? 0) > 0;
        satisfy(hasGap && assertions.length === 0, "Unsupported domain returned no fabricated assertion and retained a gap.", "Unsupported domain generated assertions or suppressed the gap.");
        break;
      }
      case "K_RELEVANCE": {
        const expected: Record<string, string[]> = { cardiac: ["microvascular", "hemorrhage", "hémorragie"], spectral: ["non-contrast", "noncontrast", "spectral"], neuro: ["perfusion", "cbf", "transit"] };
        const terms = expected[caseItem.domain] ?? [];
        satisfy(terms.some((term) => outputText.includes(term)), "At least one domain-defining concept is present in the governed output.", "No domain-defining concept is present in the output.");
        break;
      }
      case "K_CRITICAL_CONCEPT_COVERAGE": {
        const expectedGroups: Record<string, string[][]> = caseItem.caseId === "K-STALE-01"
          ? { cardiac: [["microvascular", "mvo"]] }
          : {
            cardiac: [["microvascular", "mvo"], ["hemorrhage", "hémorragie", "imh"]],
            spectral: [["virtual non-contrast", "virtual noncontrast", "vnc", "virtuelle sans contraste"], ["true noncontrast", "native noncontrast", "native sans injection", "sans injection"]],
            neuro: [["cbf", "débit sanguin cérébral"], ["cbv", "volume sanguin cérébral"], ["transit", "delay", "délai", "tmax"]],
          };
        const groups = expectedGroups[caseItem.domain] ?? [];
        const missing = groups.filter((group) => !group.some((term) => outputText.includes(term)));
        const gapText = textOf(native?.gaps ?? []);
        const omissionsExplicit = missing.length > 0 && missing.every((group) => group.some((term) => gapText.includes(term)));
        if (caseItem.caseId === "K-REFERENCE-AMBIGUITY-01" && missing.length > 0 && (native?.gaps?.length ?? 0) > 0) {
          outcome = "SATISFIED";
          note = "The ambiguity case returned an explicit gap instead of silently omitting or collapsing the terms.";
          break;
        }
        satisfy(missing.length === 0 || omissionsExplicit, "All case-defining concepts are represented or explicitly exposed as omissions.", `Critical concept groups missing without an explicit gap: ${missing.map((group) => group.join("|")).join(", ")}`);
        break;
      }
      case "K_SOURCE_GROUNDING": {
        const assertions = native?.applicableAssertions ?? [];
        const documentaryStatements = native?.documentaryStatements ?? [];
        if (assertions.length === 0 && documentaryStatements.length === 0) {
          outcome = "NOT_APPLICABLE";
          note = "No assertion or documentary statement was returned; the owner exposed a gap/limitation instead.";
          break;
        }
        const assertionsGrounded = assertions.every((assertion: any) => Boolean(assertion.providerId && assertion.locator));
        const documentaryGrounded = documentaryStatements.every((statement: any) => Boolean(statement.providerId && statement.locator && statement.sourceId));
        const grounded = assertionsGrounded && documentaryGrounded && (native?.sources?.length ?? 0) > 0;
        satisfy(grounded, "Assertions/documentary statements carry provider, locator and source data.", "Returned scientific material lacks reconstructible grounding.");
        break;
      }
      case "K_APPLICABILITY": {
        const material = [...(native?.applicableAssertions ?? []), ...(native?.documentaryStatements ?? [])];
        if (material.length === 0 && (native?.gaps?.length ?? 0) > 0) {
          outcome = "NOT_APPLICABLE";
          note = "No scientific content was returned; applicability is represented through an explicit gap.";
          break;
        }
        const allExplicit = material.every((entry: any) => Boolean(entry.applicability || entry.applicabilityStatus || entry.context?.applicability));
        const qualified = material.some((entry: any) => /limit|partial|qualif|context|condition|unknown/i.test(textOf(entry.applicability ?? entry.applicabilityStatus ?? entry.context?.applicability ?? entry.limitations ?? [])));
        satisfy(material.length > 0 && allExplicit && qualified, "Applicability is explicit and at least one returned item remains qualified.", "Applicability is missing or silently presented as unconditional.");
        break;
      }
      case "K_LIMITATIONS": satisfy((native?.limitations?.length ?? 0) > 0 || (raw?.result?.limitations?.length ?? 0) > 0, "Limitations are explicit.", "No limitation is exposed."); break;
      case "K_CONTRADICTION_OR_ALTERNATIVES": {
        const controversyCount = native?.controversies?.length ?? 0;
        const alternativeText = /position a|position b|alternative|controvers|contradict|désaccord/.test(outputText);
        if (controversyCount === 0 && !alternativeText) {
          outcome = "NOT_APPLICABLE";
          note = "No contradiction or alternative was encoded by the bounded admitted material returned for this case.";
          break;
        }
        satisfy(controversyCount > 0 || alternativeText, "Contradictions or alternative positions remain explicit.", "A supported contradiction or alternative was suppressed.");
        break;
      }
      case "K_NO_PROMOTION_OR_DECISION": {
        const noDecision = raw?.result?.projectWriteAuthorized === false && raw?.result?.projectContribution === null;
        const promotion = /\b(adopted|approved|established fact|scientifically proven|décision adoptée|preuve définitive)\b/.test(outputText);
        satisfy(noDecision && !promotion, "Knowledge remains non-authoritative on Project and does not inflate certainty.", "Knowledge produced a Project decision or evidence-strength promotion.");
        break;
      }
      case "K_VNC_NON_EQUIVALENCE": satisfy(/not universally equivalent|non.*equivalent|n.?est pas.*équivalent|non.?interchange|not interchangeable|ne sont pas nécessairement interchangeables|ne peut pas être présumée universelle/.test(outputText), "Non-equivalence/non-interchangeability or non-universal transfer limit is explicit.", "VNC substitution boundary is not visible."); break;
      case "K_REFERENCE_AMBIGUITY": {
        const strictEquivalence = /strictly equivalent|are equivalent|sont équivalents/.test(outputText) && !/not equivalent|non équivalent|not universally/.test(outputText);
        satisfy(!strictEquivalence && ((native?.ambiguities?.length ?? 0) > 0 || (native?.gaps?.length ?? 0) > 0 || (native?.limitations?.length ?? 0) > 0), "No strict equivalence is asserted and ambiguity/limits remain visible.", "Reference ambiguity was collapsed or hidden.");
        break;
      }
      case "K_STALE_READBACK": satisfy(raw?.staleReadback?.freshness?.status === "STALE_OWNER_RESULT" && Boolean(raw?.staleReadback?.entry?.result), "Historical result remains readable and is explicitly marked stale.", "Stale readback was not detected or historical readability was lost."); break;
      case "ST_PROJECT_FIDELITY": {
        const inputQuestion = raw?.request?.nativeInput?.validatedReformulation ?? "";
        const preserved = Boolean(inputQuestion) && native?.originalIdea?.startsWith(inputQuestion);
        satisfy(preserved, "Exact Project question is retained in the immutable ST original-idea input while candidate reformulations remain proposals.", "The exact Project question is no longer reconstructible in ST output.");
        break;
      }
      case "ST_KNOWLEDGE_LINEAGE": {
        const deps = native?.knowledgeDependencies ?? [];
        const ledgerDeps = raw?.entry?.dependencies ?? [];
        satisfy(deps.length === 1 && deps[0].ownershipTransferred === false && ledgerDeps.some((dep: any) => dep.owner === "KNOWLEDGE" && dep.resultId === deps[0].knowledgeResultRef && dep.nativeResultDigest === deps[0].knowledgeResultDigest), "Exact Knowledge result identity/digest lineage retained.", "Knowledge result lineage is broken.");
        break;
      }
      case "ST_CANDIDATE_BOUNDARY": satisfy(native?.candidateNotice === "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW" && [...(native?.questions ?? []), ...(native?.hypotheses ?? []), ...(native?.objectives ?? [])].every((candidate: any) => candidate.reviewState !== "ADOPTED") && raw?.result?.projectWriteAuthorized === false, "All generated science remains candidate and human-reviewed.", "Automatic adoption or Project write boundary violation detected."); break;
      case "ST_UNKNOWN_AND_GAP_PRESERVATION": {
        const input = raw?.request?.nativeInput;
        const inputGaps = input?.knowledge?.gapCodes ?? [];
        const preserved = inputGaps.every((gap: string) => (native?.knowledgeRequest?.gapCodes ?? []).includes(gap)) && (input?.missingInformation ?? []).every((unknown: string) => (native?.unknowns ?? []).includes(unknown) || (native?.handoff?.unresolvedUnknowns ?? []).includes(unknown));
        satisfy(preserved, "Knowledge gaps and Project unknowns remain visible.", "A Knowledge gap or Project unknown was lost.");
        break;
      }
      case "ST_UNSUPPORTED_BOUNDARY": satisfy(["REFUSED", "CLARIFICATION_REQUIRED"].includes(native?.status) && (native?.hypotheses ?? []).every((hypothesis: any) => hypothesis.support !== "SUPPORTED"), "Unsupported input is refused/clarified without supported hypothesis.", "Unsupported hypothesis is presented as solid."); break;
      case "ST_NO_EVIDENCE_PROMOTION": satisfy(native?.candidateNotice === "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW" && (native?.hypotheses ?? []).every((hypothesis: any) => hypothesis.reviewState === "PENDING"), "Evidence remains distinct from candidate hypotheses.", "Candidate hypothesis was promoted."); break;
      case "ST_ALTERNATIVES": satisfy((native?.alternatives?.length ?? 0) > 0 || (native?.hypotheses?.length ?? 0) > 1, "Plural candidate branches remain visible.", "Defensible alternatives were suppressed."); break;
      case "ST_CONTRADICTION_PRESERVATION": {
        const inputRefs = raw?.request?.nativeInput?.knowledge?.contradictionRefs ?? [];
        const outputRefs = [...(native?.contradictions ?? []), ...(native?.knowledgeDependencies ?? []).flatMap((dep: any) => dep.contradictionRefs ?? [])];
        satisfy(inputRefs.every((ref: string) => outputRefs.includes(ref)), "All upstream contradiction references remain explicit.", "An upstream contradiction reference was lost.");
        break;
      }
      case "ST_REASONING_MINIMUM": {
        if (caseItem.domain === "unsupported") {
          outcome = "NOT_APPLICABLE";
          note = "Unsupported input is assessed by the refusal/clarification boundary, not by a minimum candidate count.";
          break;
        }
        const candidates = [...(native?.questions ?? []), ...(native?.hypotheses ?? []), ...(native?.objectives ?? [])];
        satisfy((native?.questions?.length ?? 0) > 0 && (native?.hypotheses?.length ?? 0) > 0 && (native?.objectives?.length ?? 0) > 0 && candidates.every((candidate: any) => candidate.reviewState !== "ADOPTED"), "Question, hypothesis and objective candidates are inspectable and pending review.", "Critical reasoning candidates are missing or were silently adopted.");
        break;
      }
      case "ST_MODEL_KNOWLEDGE_BOUNDARY": {
        const dependenciesRemainOwned = (native?.knowledgeDependencies ?? []).every((dep: any) => dep.ownershipTransferred === false);
        const candidatesRemainCandidates = native?.candidateNotice === "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW" && [...(native?.hypotheses ?? []), ...(native?.objectives ?? [])].every((candidate: any) => candidate.reviewState !== "ADOPTED");
        satisfy(dependenciesRemainOwned && candidatesRemainCandidates && raw?.result?.owner === "SCIENTIFIC_THINKING", "Knowledge ownership and candidate scientific-model boundary remain distinct.", "Scientific Thinking confused candidate models with Knowledge assertions or transferred ownership.");
        break;
      }
      case "IMG_QUESTION_ALIGNMENT": satisfy(native?.scientificQuestion?.questionId === raw?.request?.nativeInput?.confirmedScientificQuestion?.questionId && native?.scientificQuestion?.text === raw?.request?.nativeInput?.confirmedScientificQuestion?.text, "Imaging preserves exact question identity and text.", "Imaging scientific need drift detected."); break;
      case "IMG_UPSTREAM_LINEAGE": satisfy((raw?.entry?.dependencies ?? []).some((dep: any) => dep.owner === "KNOWLEDGE") && (raw?.entry?.dependencies ?? []).some((dep: any) => dep.owner === "SCIENTIFIC_THINKING") && raw?.request?.nativeInput?.sourceHandoff?.stOutputRef, "Exact Knowledge and ST dependencies are retained.", "Required upstream lineage is missing."); break;
      case "IMG_CANDIDATE_AND_NO_RANKING": {
        const candidates = [...(native?.modalityCandidates ?? []), ...(native?.acquisitionStrategies ?? [])];
        const pending = candidates.every((candidate: any) => candidate.reviewState !== "ADOPTED");
        const rankings = [...(native?.modalityComparison ?? []), ...(native?.biomarkerComparison ?? [])];
        const noRanking = rankings.every((comparison: any) => comparison.notice === "NO_AUTOMATIC_RANKING");
        const expectedOptions = caseItem.domain === "unsupported" ? ["RETURN_TO_SCIENTIFIC_THINKING", "CLARIFICATION_REQUIRED"].includes(native?.status) : candidates.length > 0 && (native?.acquisitionStrategies?.length ?? 0) > 0;
        satisfy(expectedOptions && pending && noRanking, "Options remain candidates and comparison explicitly forbids automatic ranking.", "Candidate options/acquisitions are absent or automatic selection/ranking occurred.");
        break;
      }
      case "IMG_QA_AND_EQUIPMENT": {
        const hasQa = caseItem.domain === "unsupported" ? ["RETURN_TO_SCIENTIFIC_THINKING", "CLARIFICATION_REQUIRED"].includes(native?.status) : (native?.qualityStrategy?.length ?? 0) > 0;
        const noAssumption = (native?.equipmentAssessment ?? []).every((assessment: any) => assessment.assumptionForbidden === true && assessment.availabilityEvidenceStatus !== "VERIFIED");
        satisfy(hasQa && noAssumption, "QA is visible and equipment compatibility is not invented.", "QA is absent or equipment compatibility was invented.");
        break;
      }
      case "IMG_OBS_BOUNDARY": {
        const resultText = textOf(raw?.result);
        const gap = (raw?.result?.gaps ?? []).includes("OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED") && (raw?.result?.limitations ?? []).includes("OBS_RUNTIME_UNAVAILABLE_NO_AUTONOMOUS_QUALIFICATION");
        const invented = /observableproperty.{0,40}(validated|qualified|adopted)|measurementdefinition.{0,40}(validated|qualified|adopted)|biomarkerrole.{0,40}(validated|qualified|adopted)/.test(resultText);
        satisfy(gap && !invented, "OBS gap is explicit and no qualified OBS object is invented.", "OBS capability was invented or the expected gap was lost.");
        break;
      }
      case "IMG_LIMITATIONS": satisfy((raw?.result?.limitations?.length ?? 0) > 0 && (native?.limitations?.length ?? 0) > 0, "Imaging and upstream limitations remain explicit.", "Imaging limitations were suppressed."); break;
      case "IMG_RETURN_TO_ST": satisfy(["RETURN_TO_SCIENTIFIC_THINKING", "CLARIFICATION_REQUIRED", "REFUSED"].includes(native?.status) && (native?.acquisitionStrategies?.length ?? 0) === 0, "Unsupported measurement chain does not overcommit and returns/clarifies.", "Unsupported measurement chain generated acquisition commitments."); break;
      case "IMG_MODALITY_ALIGNMENT": {
        if (caseItem.domain === "unsupported") {
          outcome = "NOT_APPLICABLE";
          note = "Unsupported input must return or clarify without generating a modality candidate.";
          break;
        }
        const labels = textOf(native?.modalityCandidates ?? []);
        const expected: Record<string, RegExp> = { cardiac: /irm|mri|mr\b/, spectral: /\bct\b|scanner|spectral/, neuro: /irm|mri|mr\b|\bct\b|scanner/ };
        satisfy((native?.modalityCandidates?.length ?? 0) > 0 && expected[caseItem.domain]?.test(labels), "Modality candidates align with the declared imaging domain.", "Modality candidates are absent or mismatched to the declared domain.");
        break;
      }
      case "IMG_CORELAB_CONTEXTUAL": {
        const assessment = native?.coreLabAssessment;
        satisfy(assessment?.status === "HUMAN_ASSESSMENT_REQUIRED" && assessment?.notice === "NO_AUTOMATIC_OPTIMUM" && (assessment?.options?.length ?? 0) > 0, "Core Lab remains a contextual human assessment with no automatic optimum.", "Core Lab was generalized or selected automatically.");
        break;
      }
      case "IMG_UNKNOWN_PRESERVATION": {
        const inputUnknowns = raw?.request?.nativeInput?.missingInformation ?? [];
        const preservedText = textOf([native?.missingInformation ?? [], native?.projectConstructionHandoff?.unknowns ?? [], raw?.result?.unknowns ?? []]);
        satisfy(inputUnknowns.every((unknown: string) => preservedText.includes(unknown.toLocaleLowerCase("fr-FR"))), "All input unknowns remain reconstructible downstream.", "At least one Project/upstream unknown was suppressed.");
        break;
      }
      case "REG_UNSUPPORTED_FAIL_CLOSED": satisfy(raw?.error?.startsWith("UNSUPPORTED_JURISDICTION:"), "Unsupported jurisdiction rejected before REG execution.", "Unsupported jurisdiction was not rejected fail-closed."); break;
      case "REG_STALE_FAIL_CLOSED": satisfy(raw?.error === "REGULATORY_PRODUCT_REQUEST_SNAPSHOT_MISMATCH", "Stale Project/request binding rejected.", "Stale regulatory request was accepted."); break;
      case "REG_JURISDICTION_FIDELITY": {
        const requested = raw?.request?.nativeInput?.jurisdiction?.value ?? [];
        const resolutions = ["applicableRequirements", "potentiallyApplicableRequirements", "notApplicableRequirements", "unresolvedRequirements"].flatMap((key) => native?.[key] ?? []);
        const noForeignApplicable = resolutions.filter((resolution: any) => ["APPLICABLE", "CONDITIONALLY_APPLICABLE", "POTENTIALLY_APPLICABLE"].includes(resolution.status)).every((resolution: any) => requested.includes(resolution.jurisdiction) || resolution.jurisdiction === "INTERNATIONAL");
        satisfy(noForeignApplicable, "No unsupported national corpus is applied to the caller jurisdiction.", "Jurisdiction mismatch/extrapolation observed.");
        break;
      }
      case "REG_CORPUS_BOUNDARY": {
        if (raw?.error) { outcome = "NOT_APPLICABLE"; note = "Request rejected before corpus execution; corpus claim not produced."; break; }
        satisfy((native?.corpusDiagnostics ?? []).some((diagnostic: any) => diagnostic.kind === "CANDIDATE_CORPUS") && native?.readiness?.notice === "LOCAL_REGULATORY_RESOLUTION_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_APPROVAL", "Candidate corpus and bounded readiness notices are explicit.", "Corpus boundary notice is missing.");
        break;
      }
      case "REG_SOURCE_GROUNDING": {
        if (raw?.error) { outcome = "NOT_APPLICABLE"; note = "Request rejected before requirements were resolved."; break; }
        const resolutions = ["applicableRequirements", "potentiallyApplicableRequirements", "notApplicableRequirements", "unresolvedRequirements"].flatMap((key) => native?.[key] ?? []);
        satisfy(resolutions.length > 0 && resolutions.every((resolution: any) => (resolution.sourceIds?.length ?? 0) > 0), "All requirement resolutions retain encoded source IDs.", "A requirement resolution lacks encoded sources.");
        break;
      }
      case "REG_NO_APPROVAL": {
        const boundary = !native || (native?.provenance?.authorityBoundary === "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION" && native?.readiness?.notice === "LOCAL_REGULATORY_RESOLUTION_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_APPROVAL");
        const approvalClaim = /\b(project|study)\s+(is\s+)?(approved|authorized|legally valid|compliant)\b|\b(approval granted|autorisation accordée|conforme au droit)\b/.test(outputText);
        satisfy(boundary && !approvalClaim, "No approval/legal/current-law completeness claim is produced.", "Regulatory approval or legal conclusion was invented.");
        break;
      }
      case "REG_MISSING_INFORMATION": satisfy((native?.missingInformation?.length ?? 0) > 0 || (native?.readiness?.reasons ?? []).length > 0, "Missing regulatory information remains explicit.", "Missing regulatory context was suppressed."); break;
      case "VAL_EXPECTED_FINDING": {
        const expected = raw?.expectedFailureClass;
        const findings = raw?.execution?.run?.findings ?? [];
        const found = findings.some((finding: any) => expected === "STALE_" ? finding.domainFailureClassRef?.startsWith("STALE_") : finding.domainFailureClassRef === expected);
        satisfy(found, `Expected structural finding ${expected} detected.`, `Expected structural finding ${expected} was not detected.`);
        break;
      }
      case "VAL_NO_FALSE_CRITICAL": satisfy((raw?.execution?.run?.findings?.length ?? 0) === 0, "Valid structural chain has no artificial finding.", "False positive finding observed on valid chain."); break;
      case "VAL_OBSERVER_ONLY": satisfy(raw?.execution?.repairCalls === 0 && raw?.execution?.projectWrites === 0 && raw?.execution?.humanDecisionBypassed === false && raw?.execution?.run?.autoFixAllowed === false, "VAL remains read-only observer with no repair or decision.", "VAL repair/write/decision boundary violation observed."); break;
      case "VAL_NO_SCIENTIFIC_PASS": satisfy(raw?.execution?.scientificQualificationClaimed === false && raw?.execution?.run?.pd011QualificationClaimed === false, "Structural result is not promoted to scientific PASS or PD-011 qualification.", "Scientific PASS/qualification was invented."); break;
    }
    return { obligationId: item.obligationId, checkId: item.checkId, critical: item.critical, outcome, failureClass: item.failureClass, evidence: traceEventRefs, note };
  });
};

const verdictFor = (evaluations: Evaluation[]): CaseExecution["verdict"] => {
  if (evaluations.some((item) => item.critical && item.outcome === "VIOLATED")) return "CRITICAL_VIOLATION";
  if (evaluations.some((item) => item.outcome === "HUMAN_ARBITRATION_REQUIRED")) return "HUMAN_ARBITRATION_REQUIRED";
  if (evaluations.some((item) => item.outcome === "NON_ADJUDICABLE")) return "NON_ADJUDICABLE";
  if (evaluations.some((item) => ["PARTIALLY_SATISFIED", "VIOLATED"].includes(item.outcome))) return "PARTIALLY_SATISFIED";
  return "FULLY_SATISFIED";
};

const stageFor = (owner: string, evaluations: Evaluation[]) => {
  const violation = evaluations.find((item) => item.outcome === "VIOLATED");
  if (!violation) return null;
  if (violation.checkId === "TRACE_BOUND") return "CHARACTERIZATION_HARNESS";
  if (violation.failureClass.includes("STALE")) return "STALE_VALIDATION";
  if (owner === "KNOWLEDGE") return "KNOWLEDGE_ENGINE";
  if (owner === "SCIENTIFIC_THINKING") return "SCIENTIFIC_THINKING_ENGINE";
  if (owner === "IMAGING") return "IMAGING_ENGINE";
  if (owner === "REG") return violation.checkId.includes("JURISDICTION") ? "REG_REQUEST_BUILDING" : "REG_ENGINE";
  if (owner === "VAL") return violation.failureClass.includes("LINEAGE") || violation.failureClass.includes("PROVENANCE") ? "VAL_INPUT_ADAPTER" : "VAL_ENGINE";
  return "UNKNOWN_STAGE";
};

const addResult = (owner: string, item: CaseExecution) => results.set(owner, [...(results.get(owner) ?? []), item]);

const executeOne = (caseItem: CharacterizationCase, index: number, replay = false) => {
  const pack = packs.get(caseItem.caseId);
  if (!pack) throw new Error(`W1_QUAL_INPUT_PACK_MISSING:${caseItem.caseId}`);
  const payload = clone(pack.payload) as any;
  const snapshot = payload.projectSnapshot as Readonly<ProjectContextSnapshot>;
  const { startedAt, completedAt } = times(index + (replay ? 40 : 0));
  const suffix = replay ? "replay" : "primary";
  const trace = newTrace(caseItem.caseId, snapshot, startedAt, suffix);
  let raw: any = { error: null, expectedPreRuntimeRejection: false };
  try {
    if (caseItem.ownerUnderTest === "KNOWLEDGE") {
      const invocation = invokeKnowledgeForProject({ project: payload.project, projectSnapshot: snapshot, knowledgeRequest: payload.knowledgeRequest, ledger: createProductKnowledgeOwnerLedger(`qual:${caseItem.caseId}:${suffix}`), callerRef: CAMPAIGN_ID, purpose: caseItem.purpose, startedAt, completedAt, runtime: executeKnowledgeRequest, monotonicNow: (() => { let value = 0; return () => ++value; })(), trace });
      const staleReadback = payload.staleReadbackSnapshot && invocation.result
        ? readProductKnowledgeOwnerResult({
          ledger: invocation.ledger,
          resultId: invocation.result.resultId,
          currentProjectSnapshot: payload.staleReadbackSnapshot,
          trace,
          observedAt: completedAt,
        })
        : null;
      raw = { ...invocation, staleReadback, error: null };
    } else if (caseItem.ownerUnderTest === "SCIENTIFIC_THINKING") {
      const invocation = invokeScientificThinkingForProject({ project: payload.project, projectSnapshot: snapshot, knowledgeResultId: payload.knowledgeResultId, ledger: rehydrateProductOwnerResultLedger(payload.frozenOwnerLedger), callerRef: CAMPAIGN_ID, purpose: caseItem.purpose, startedAt, completedAt, runtime: executeScientificThinkingEngine, monotonicNow: (() => { let value = 0; return () => ++value; })(), trace });
      raw = { ...invocation, error: null };
    } else if (caseItem.ownerUnderTest === "IMAGING") {
      const invocation = invokeImagingForProject({ project: payload.project, projectSnapshot: snapshot, knowledgeResultId: payload.knowledgeResultId, scientificThinkingResultId: payload.scientificThinkingResultId, ledger: rehydrateProductOwnerResultLedger(payload.frozenOwnerLedger), callerRef: CAMPAIGN_ID, purpose: caseItem.purpose, startedAt, completedAt, runtime: executeImagingStudyDesigner, monotonicNow: (() => { let value = 0; return () => ++value; })(), trace });
      raw = { ...invocation, error: null };
    } else if (caseItem.ownerUnderTest === "REG") {
      const invocation = invokeRegulatoryForProject({ project: payload.project, projectSnapshot: snapshot, regulatoryRequest: payload.regulatoryRequest, ledger: createProductKnowledgeOwnerLedger(`qual:${caseItem.caseId}:${suffix}`), callerRef: CAMPAIGN_ID, purpose: caseItem.purpose, startedAt, completedAt, runtime: resolveRegulatoryRequirements, monotonicNow: (() => { let value = 0; return () => ++value; })(), trace });
      raw = { ...invocation, error: null };
    } else {
      const ledger = rehydrateProductOwnerResultLedger(payload.frozenOwnerLedger);
      const knowledgeEntry = clone(ledger.entries[0]) as any;
      const scientificThinkingEntry = clone(ledger.entries[1]) as any;
      const imagingEntry = clone(ledger.entries[2]) as any;
      const valSnapshot = clone(snapshot) as any;
      switch (payload.defectRecipe) {
        case "PROJECT_DIGEST_MISMATCH": valSnapshot.sourceProjectDigest = `mismatch:${valSnapshot.sourceProjectDigest}`; break;
        case "STALE_KNOWLEDGE": knowledgeEntry.result.sourceProjectVersion = `stale:${knowledgeEntry.result.sourceProjectVersion}`; break;
        case "STALE_ST": scientificThinkingEntry.result.sourceProjectVersion = `stale:${scientificThinkingEntry.result.sourceProjectVersion}`; break;
        case "WRONG_OWNER_METADATA": scientificThinkingEntry.result.owner = "KNOWLEDGE"; break;
        case "PROVENANCE_MISSING": scientificThinkingEntry.result.nativePayload.knowledgeDependencies[0].sourceRefs = []; scientificThinkingEntry.result.nativePayload.knowledgeDependencies[0].evidenceRefs = []; break;
        case "UNKNOWN_DROPPED": imagingEntry.result.unknowns = []; break;
        case "LIMITATION_DROPPED": scientificThinkingEntry.result.nativePayload.handoff.limitations = []; imagingEntry.result.nativePayload.limitations = []; break;
        case "CONTRADICTION_DROPPED": scientificThinkingEntry.result.nativePayload.knowledgeDependencies[0].contradictionRefs = []; break;
        case "KNOWLEDGE_TO_ST_LINEAGE_BROKEN": scientificThinkingEntry.dependencies = []; break;
        case "ST_TO_IMAGING_LINEAGE_BROKEN": imagingEntry.dependencies = imagingEntry.dependencies.filter((dep: any) => dep.owner !== "SCIENTIFIC_THINKING"); break;
      }
      const observationInput = replay
        ? clone(rawByCase.get(caseItem.caseId)?.observationInput)
        : { validationInvocationId: `w1-qual-01:${caseItem.caseId}:primary`, projectSnapshot: valSnapshot, knowledgeEntry, scientificThinkingEntry, imagingEntry, callerRef: CAMPAIGN_ID, purpose: caseItem.purpose, completedAt };
      if (!observationInput) throw new Error("CHARACTERIZATION_HARNESS_PRIMARY_VAL_INPUT_MISSING");
      trace.append({ eventType: "HANDOFF_STARTED", timestamp: startedAt, owner: "VAL", status: "STARTED", requestRef: { requestId: observationInput.validationInvocationId, requestSchemaVersion: "SCIENTIFIC_OWNER_CHAIN_FIDELITY@0.1.0", requestDigest: logicalDigest(observationInput) }, diagnostic: { stage: "VAL_INPUT_ADAPTER", code: "CHARACTERIZATION_VAL_INPUT_BOUND" } });
      trace.append({ eventType: "HANDOFF_ACCEPTED", timestamp: startedAt, owner: "VAL", status: "ACCEPTED", diagnostic: { stage: "VAL_INPUT_ADAPTER", code: "CHARACTERIZATION_VAL_INPUT_ACCEPTED" } });
      trace.append({ eventType: "VALIDATION_STARTED", timestamp: startedAt, owner: "VAL", engine: "VAL-001-DETERMINISTIC-ENGINE", engineVersion: "1.0.0", status: "STARTED", diagnostic: { stage: "VAL_ENGINE", code: "CHARACTERIZATION_VALIDATION_STARTED" } });
      const execution = executeScientificOwnerChainValidationProfile(observationInput);
      trace.append({ eventType: "VALIDATION_COMPLETED", timestamp: completedAt, owner: "VAL", engine: "VAL-001-DETERMINISTIC-ENGINE", engineVersion: "1.0.0", status: execution.boundedStatus, outputResultRef: { artifactType: "VALIDATION_RUN", owner: "VAL", artifactId: execution.run.validationRunId, artifactVersion: "0.1.0", artifactDigest: execution.run.resultDigest }, diagnostic: { stage: "VAL_ENGINE", code: "CHARACTERIZATION_STRUCTURAL_FIDELITY_OBSERVED" }, technicalMetadata: { boundedStatus: execution.boundedStatus, projectWrites: execution.projectWrites, repairAuthorized: false, scientificQualificationClaimed: false } });
      raw = { execution, observationInput, expectedFailureClass: payload.expectedFailureClass, error: null };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_CHARACTERIZATION_EXECUTION_ERROR";
    raw = { error: message, expectedPreRuntimeRejection: payload.expectedError ? message.startsWith(payload.expectedError) : false, projectWrites: 0, externalEvidenceCalls: 0, geminiCalls: 0, terraCalls: 0, webCalls: 0, externalRegulatoryCalls: 0, expectedFailureClass: payload.expectedFailureClass };
  }
  const traceItem = finishTrace(caseItem.caseId, trace, completedAt, raw.error && !raw.expectedPreRuntimeRejection ? raw.error : null, suffix) as any;
  const traceEventRefs = traceItem.events.map((event: any) => event.eventId);
  if (replay) return { raw, traceItem };
  const evaluations = evaluate(caseItem, raw, traceEventRefs);
  const result = raw.result ?? raw.execution?.run ?? null;
  const native = raw.result?.nativePayload ?? raw.execution?.run ?? null;
  const item: CaseExecution = {
    caseId: caseItem.caseId,
    owner: caseItem.ownerUnderTest,
    inputPackDigest: pack.digest,
    traceRunId: traceItem.run.runId,
    traceEventRefs,
    requestRef: raw.request?.handoffId ?? raw.observationInput?.validationInvocationId ?? null,
    requestDigest: raw.request ? logicalDigest(raw.request.nativeInput) : raw.observationInput ? logicalDigest(raw.observationInput) : null,
    outputResultRef: raw.result ? `${raw.result.resultId}@${raw.result.resultVersion}` : raw.execution?.run?.validationRunId ?? null,
    outputDigest: native?.resultDigest ?? native?.outputDigest ?? native?.resolutionId ?? (native ? logicalDigest(native) : null),
    status: raw.observation?.status ?? raw.execution?.boundedStatus ?? (raw.expectedPreRuntimeRejection ? "EXPECTED_FAIL_CLOSED_REJECTION" : raw.error ? "EXECUTION_ERROR" : "UNKNOWN"),
    error: raw.error,
    result,
    observation: raw.observation ?? { boundedStatus: raw.execution?.boundedStatus, repairCalls: raw.execution?.repairCalls, projectWrites: raw.execution?.projectWrites, scientificQualificationClaimed: raw.execution?.scientificQualificationClaimed },
    evaluations,
    verdict: verdictFor(evaluations),
    firstDivergentStage: stageFor(caseItem.ownerUnderTest, evaluations),
    runtimeProviderCalls: 0,
  };
  rawByCase.set(caseItem.caseId, raw);
  addResult(caseItem.ownerUnderTest, item);
  return item;
};

for (const [index, caseItem] of caseRegistry.cases.entries()) executeOne(caseItem, index, false);

const replays: unknown[] = [];
for (const [index, caseItem] of caseRegistry.cases.filter((item) => item.replayPredeclared).entries()) {
  const primary = (results.get(caseItem.ownerUnderTest) ?? []).find((item) => item.caseId === caseItem.caseId)!;
  const replay = executeOne(caseItem, index, true) as any;
  const replayNative = replay.raw.result?.nativePayload ?? replay.raw.execution?.run ?? null;
  let replayDigest = replayNative?.resultDigest ?? replayNative?.outputDigest ?? replayNative?.resolutionId ?? (replayNative ? logicalDigest(replayNative) : null);
  if (caseItem.ownerUnderTest === "VAL" && primary.result && replay.raw.observationInput) {
    const replayed = replayScientificOwnerChainValidationProfile({ previousRun: primary.result as any, observationInput: replay.raw.observationInput });
    replayDigest = replayed.resultDigest;
  }
  replays.push({ caseId: caseItem.caseId, owner: caseItem.ownerUnderTest, primaryDigest: primary.outputDigest, replayDigest, semanticPayloadStable: primary.outputDigest === replayDigest, gapsStable: stableStringify((rawByCase.get(caseItem.caseId)?.result?.gaps ?? [])) === stableStringify(replay.raw.result?.gaps ?? []), limitationsStable: stableStringify((rawByCase.get(caseItem.caseId)?.result?.limitations ?? [])) === stableStringify(replay.raw.result?.limitations ?? []), sourcesStable: stableStringify((rawByCase.get(caseItem.caseId)?.result?.nativePayload?.sources ?? [])) === stableStringify(replay.raw.result?.nativePayload?.sources ?? []), traceRunId: replay.traceItem.run.runId });
}

const ownerOrder = ["KNOWLEDGE", "SCIENTIFIC_THINKING", "IMAGING", "REG", "VAL"];
const FAILURE_CLASSES_IN_SCOPE: Record<string, string[]> = {
  KNOWLEDGE: [
    "IRRELEVANT_ASSERTION", "CRITICAL_RELEVANT_ASSERTION_OMITTED", "SOURCE_REFERENCE_MISSING", "SOURCE_GROUNDING_BROKEN",
    "APPLICABILITY_LOST", "LIMITATION_SUPPRESSED", "CONTRADICTION_SUPPRESSED", "KNOWLEDGE_GAP_SUPPRESSED",
    "UNSUPPORTED_CONTENT_GENERATED", "EVIDENCE_STRENGTH_PROMOTED", "PROJECT_DECISION_LEAK", "STALE_RESULT", "REFERENCE_AMBIGUITY",
  ],
  SCIENTIFIC_THINKING: [
    "PROJECT_QUESTION_DRIFT", "KNOWLEDGE_CONTEXT_LOSS", "KNOWLEDGE_GAP_LOSS", "UNSUPPORTED_HYPOTHESIS", "EVIDENCE_PROMOTION",
    "ALTERNATIVE_SUPPRESSION", "FALSE_CERTAINTY", "CONTRADICTION_LOSS", "LINEAGE_BREAK", "PROJECT_ADOPTION_LEAK",
    "MODEL_KNOWLEDGE_CONFUSION", "CRITICAL_REASONING_OMISSION",
  ],
  IMAGING: [
    "SCIENTIFIC_NEED_DRIFT", "MODALITY_MISMATCH", "ACQUISITION_OVERCOMMITMENT", "METHOD_AUTO_SELECTION", "QA_REQUIREMENT_LOSS",
    "EQUIPMENT_COMPATIBILITY_INVENTED", "CORELAB_GENERALIZATION", "UNKNOWN_SUPPRESSION", "OBS_CAPABILITY_INVENTED", "OBS_GAP_LOST",
    "KNOWLEDGE_LINEAGE_LOST", "PROJECT_ADOPTION_LEAK",
  ],
  REG: [
    "JURISDICTION_MISMATCH", "UNSUPPORTED_JURISDICTION_EXTRAPOLATION", "MISSING_CONTEXT_SUPPRESSED", "REQUIREMENT_SOURCE_LOST",
    "CORPUS_LIMITATION_SUPPRESSED", "REGULATORY_APPROVAL_INVENTED", "LEGAL_CONCLUSION_INVENTED", "CURRENT_LAW_COMPLETENESS_CLAIMED",
    "CONTRADICTION_SUPPRESSED", "STALE_REGULATORY_RESULT", "PROJECT_WRITE_LEAK",
  ],
  VAL: [
    "PROJECT_DIGEST_MISMATCH", "STALE_KNOWLEDGE_RESULT", "STALE_SCIENTIFIC_THINKING_RESULT", "OWNER_TRANSFER_VIOLATION",
    "KNOWLEDGE_EVIDENCE_LINEAGE_MISSING", "UNKNOWN_LOST", "LIMITATION_LOST", "CONTRADICTION_LOST",
    "KNOWLEDGE_TO_ST_LINEAGE_MISSING", "ST_TO_IMAGING_LINEAGE_MISSING", "FALSE_POSITIVE_ON_VALID_CHAIN",
    "VAL_REPAIR_OR_WRITE", "SCIENTIFIC_PASS_INVENTED",
  ],
};
const descriptiveCategory = (failureClass: string) => {
  if (/UNSUPPORTED_CONTENT|UNSUPPORTED_HYPOTHESIS|INVENTED/.test(failureClass)) return "unsupportedAdditions";
  if (/OMITTED|OMISSION/.test(failureClass)) return "criticalOmissions";
  if (/CONTEXT|QUESTION_DRIFT|NEED_DRIFT/.test(failureClass)) return "contextLosses";
  if (/GAP/.test(failureClass)) return "gapLosses";
  if (/LIMITATION|CORPUS_LIMITATION/.test(failureClass)) return "limitationLosses";
  if (/CONTRADICTION/.test(failureClass)) return "contradictionLosses";
  if (/LINEAGE|SOURCE|PROVENANCE/.test(failureClass)) return "provenanceBreaks";
  if (/STALE/.test(failureClass)) return "staleProtectionFailures";
  if (/OWNER|PROJECT_WRITE|ADOPTION|SELECTION/.test(failureClass)) return "ownershipViolations";
  return null;
};

const summaries = ownerOrder.map((owner) => {
  const items = results.get(owner) ?? [];
  const evaluations = items.flatMap((item) => item.evaluations);
  const observed = [...new Set(evaluations.filter((item) => item.outcome === "VIOLATED").map((item) => item.failureClass))].sort();
  const exercised = [...new Set(evaluations.map((item) => item.failureClass))].sort();
  const inScope = [...new Set([...(FAILURE_CLASSES_IN_SCOPE[owner] ?? []), ...exercised])].sort();
  const metrics: Record<string, unknown> = {
    casesExecuted: items.length,
    casesFullySatisfied: items.filter((item) => item.verdict === "FULLY_SATISFIED").length,
    casesPartiallySatisfied: items.filter((item) => item.verdict === "PARTIALLY_SATISFIED").length,
    casesWithCriticalViolation: items.filter((item) => item.verdict === "CRITICAL_VIOLATION").length,
    nonAdjudicableCases: items.filter((item) => item.verdict === "NON_ADJUDICABLE").length,
    humanArbitrationCases: items.filter((item) => item.verdict === "HUMAN_ARBITRATION_REQUIRED").length,
    criticalObligations: evaluations.filter((item) => item.critical).length,
    criticalViolations: evaluations.filter((item) => item.critical && item.outcome === "VIOLATED").length,
    unsupportedAdditions: 0, criticalOmissions: 0, contextLosses: 0, gapLosses: 0, limitationLosses: 0, contradictionLosses: 0, provenanceBreaks: 0, staleProtectionFailures: 0, ownershipViolations: 0,
    failureClassesObserved: observed,
    failureClassesInScope: inScope,
    failureClassesExercised: exercised,
    failureClassesExercisedNotObserved: exercised.filter((failureClass) => !observed.includes(failureClass)),
    failureClassesNotDirectlyExercised: inScope.filter((failureClass) => !exercised.includes(failureClass)),
  };
  for (const item of evaluations.filter((evaluation) => evaluation.outcome === "VIOLATED")) {
    const category = descriptiveCategory(item.failureClass);
    if (category) metrics[category] = Number(metrics[category]) + 1;
  }
  const critical = Number(metrics.criticalViolations);
  const nonAdjudicable = Number(metrics.nonAdjudicableCases);
  const human = Number(metrics.humanArbitrationCases);
  const partial = Number(metrics.casesPartiallySatisfied);
  const characterizationStatus = critical > 0 ? "OWNER_REPAIR_REQUIRED"
    : nonAdjudicable > 0 ? "REFERENCE_EVIDENCE_INSUFFICIENT"
      : human > 0 ? "HUMAN_ARBITRATION_REQUIRED"
        : partial > 0 ? "CHARACTERIZED_WITH_LIMITATIONS"
          : "CHARACTERIZED_WITHIN_BOUNDED_SCOPE";
  const replay = replays.filter((item: any) => item.owner === owner);
  return { owner, characterizationStatus, metrics, replay: { cases: replay.length, stable: replay.every((item: any) => item.semanticPayloadStable), details: replay }, traceRunIds: items.map((item) => item.traceRunId), coverage: [...new Set(caseRegistry.cases.filter((item) => item.ownerUnderTest === owner).map((item) => item.domain))] };
});

const failures = ownerOrder.flatMap((owner) => (results.get(owner) ?? []).flatMap((item) => item.evaluations.filter((evaluation) => evaluation.outcome === "VIOLATED").map((evaluation) => ({ failureId: `failure:${logicalDigest({ caseId: item.caseId, obligationId: evaluation.obligationId })}`, caseId: item.caseId, owner, severity: evaluation.critical ? "CRITICAL" : "NON_CRITICAL", firstDivergentStage: item.firstDivergentStage ?? "UNKNOWN_STAGE", failureClass: evaluation.failureClass, evidence: evaluation.evidence, note: evaluation.note, repairOwner: owner, repairPerformed: false }))));

const resultFile = (owner: string) => owner === "SCIENTIFIC_THINKING" ? "scientific-thinking-results.json" : owner === "KNOWLEDGE" ? "knowledge-results.json" : owner === "IMAGING" ? "imaging-results.json" : owner === "REG" ? "reg-results.json" : "val-results.json";
for (const owner of ownerOrder) write(resultFile(owner), { contract: `W1_QUAL_01_${owner}_RESULTS`, version: "1.0.0", campaignId: CAMPAIGN_ID, freezeDigest: freeze.freezeDigest, results: results.get(owner) ?? [] });
write("failure-registry.json", { contract: "W1_QUAL_01_FAILURE_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, failures, ownerRuntimeRepairPerformed: false });
write("owner-characterization-summary.json", { contract: "W1_QUAL_01_OWNER_CHARACTERIZATION_SUMMARY", version: "1.0.0", campaignId: CAMPAIGN_ID, boundedCharacterizationNotUniversalScientificValidation: true, summaries });
write("trace-index.json", { contract: "W1_QUAL_01_TRACE_INDEX", version: "1.0.0", campaignId: CAMPAIGN_ID, traceContract: "SCIENTIFIC_EXECUTION_TRACE_LEDGER@0.1.0", traces });

const allSufficient = summaries.every((item) => ["CHARACTERIZED_WITHIN_BOUNDED_SCOPE", "CHARACTERIZED_WITH_LIMITATIONS"].includes(item.characterizationStatus));
const nextAuthorizedMission = allSufficient
  ? "W1-LOOP-QUAL-01_CONTROLLED_SCIENTIFIC_LOOP_CHARACTERIZATION"
  : failures.some((failure) => failure.owner === "KNOWLEDGE" && failure.failureClass === "CRITICAL_RELEVANT_ASSERTION_OMITTED")
    ? "W1-KNOWLEDGE-REPAIR-01_CRITICAL_CONCEPT_RETRIEVAL_COVERAGE"
    : failures.some((failure) => failure.owner === "SCIENTIFIC_THINKING" && failure.failureClass === "CRITICAL_REASONING_OMISSION")
      ? "W1-SCIENTIFIC-THINKING-REPAIR-01_CRITICAL_REASONING_CANDIDATE_COVERAGE"
      : "OWNER_SPECIFIC_BOUNDED_REPAIR_OR_ARBITRATION_REQUIRED";
const manifestMaterial = {
  campaignId: CAMPAIGN_ID,
  harnessVersion: HARNESS_VERSION,
  freezeDigest: freeze.freezeDigest,
  baseline: { branch: "protocol-designer-canonical-ingestion", head: INITIAL_HEAD },
  method: { authoringBeforeObservation: true, acceptanceEnvelopesFrozen: true, frozenTypedInputs: true, upstreamOwnersRecomputedDuringIsolatedCases: false, exactGoldJsonUsed: false, ownerRuntimeRepairPerformed: false, llmCalls: 0, externalProviderCalls: 0 },
  counts: { totalCases: caseRegistry.cases.length, casesPerOwner: Object.fromEntries(ownerOrder.map((owner) => [owner, (results.get(owner) ?? []).length])), acceptanceEnvelopes: envelopeRegistry.envelopes.length, frozenInputPacks: inputRegistry.packs.length, primaryTraceRuns: caseRegistry.cases.length, replayTraceRuns: replays.length },
  ownerDecisions: Object.fromEntries(summaries.map((item) => [item.owner, item.characterizationStatus])),
  metrics: Object.fromEntries(summaries.map((item) => [item.owner, item.metrics])),
  failures: { total: failures.length, critical: failures.filter((item) => item.severity === "CRITICAL").length, nonCritical: failures.filter((item) => item.severity === "NON_CRITICAL").length },
  replay: { predeclaredCases: replays.length, allLogicalPayloadsStable: replays.every((item: any) => item.semanticPayloadStable), details: replays },
  decisions: {
    W1_ARCHITECTURAL_CONVERGENCE_READY: "YES",
    W1_OBSERVABILITY_READY: "YES",
    W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY: allSufficient ? "YES" : "NO",
    W1_CONTROLLED_LOOP_CHARACTERIZATION_READY: "NO",
    WAVE_1_COMPLETE: "NO",
    NEXT_AUTHORIZED_MISSION: nextAuthorizedMission,
    WAVE_2_AUTHORIZED: "NO",
  },
  files: ["characterization-freeze.json", "case-registry.json", "acceptance-envelope-registry.json", "frozen-input-registry.json", "knowledge-results.json", "scientific-thinking-results.json", "imaging-results.json", "reg-results.json", "val-results.json", "failure-registry.json", "owner-characterization-summary.json", "trace-index.json"],
};
write("campaign-manifest.json", { contract: "W1_QUAL_01_CAMPAIGN_MANIFEST", version: "1.0.0", ...manifestMaterial, manifestDigest: logicalDigest(manifestMaterial), machineEvidenceNotScientificAuthority: true });
console.log(JSON.stringify({ campaignId: CAMPAIGN_ID, cases: caseRegistry.cases.length, failures: failures.length, criticalFailures: failures.filter((item) => item.severity === "CRITICAL").length, ownerDecisions: manifestMaterial.ownerDecisions, replayStable: manifestMaterial.replay.allLogicalPayloadsStable, individualReady: manifestMaterial.decisions.W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY }));
