import { logicalDigest, stableStringify, uniqueSorted } from "@/features/knowledge-engine/canonical";
import { REG000_CORPUS, REG000_CORPUS_DIGEST, REG000_CORPUS_VERSION, type CorpusApplicabilityRule, type CorpusRequirement, type RegulatoryCorpusSnapshot } from "./corpus";
import { evaluateCondition, evaluateExclusion, evaluateJurisdiction, rulesForRequirement, type ConditionEvaluation } from "./applicability";
import { RegulatoryResolutionTrace } from "./trace";
import {
  parseRegulatoryResolutionInput,
  REGULATORY_RESOLUTION_VERSION,
  type ApplicabilityCheck,
  type ApplicabilityStatus,
  type ApprovalRequirementResolution,
  type DocumentRequirementResolution,
  type FundingRequirementResolution,
  type GuidanceResolution,
  type HumanReviewRequirement,
  type MissingRegulatoryInformation,
  type QualificationResolution,
  type RegulatoryContradiction,
  type RegulatoryCorpusDiagnostic,
  type RegulatoryResolutionInput,
  type RegulatoryResolutionResult,
  type RequirementResolution,
  type SubmissionRequirementResolution,
} from "./types";

const check = (kind: ApplicabilityCheck["check"], reference: string, result: ConditionEvaluation): ApplicabilityCheck => ({
  check: kind,
  reference,
  outcome: result.outcome,
  reason: result.reason,
  field: result.field,
  qualificationId: result.qualificationId,
  provenance: uniqueSorted(result.provenance),
});

const temporalCheck = (requirement: CorpusRequirement, asOf: string): { status: ApplicabilityStatus | null; check: ApplicabilityCheck } => {
  const date = asOf.slice(0, 10);
  if (requirement.status === "SUPERSEDED" || requirement.supersededBy.length > 0) return {
    status: "SUPERSEDED",
    check: check("EFFECTIVE_PERIOD", requirement.identifier, { outcome: "NOT_SATISFIED", reason: `L’exigence est remplacée${requirement.supersededBy.length ? ` par ${requirement.supersededBy.join(", ")}` : ""}.`, provenance: requirement.source, field: null, qualificationId: null }),
  };
  if (requirement.effectiveFrom && date < requirement.effectiveFrom || requirement.effectiveUntil && date > requirement.effectiveUntil) return {
    status: "OUTSIDE_EFFECTIVE_PERIOD",
    check: check("EFFECTIVE_PERIOD", requirement.identifier, { outcome: "NOT_SATISFIED", reason: `La date ${date} est hors de la période ${requirement.effectiveFrom ?? "OPEN"}/${requirement.effectiveUntil ?? "OPEN"}.`, provenance: requirement.source, field: null, qualificationId: null }),
  };
  return {
    status: null,
    check: check("EFFECTIVE_PERIOD", requirement.identifier, { outcome: "SATISFIED", reason: `La date ${date} est incluse dans la période d’effet encodée.`, provenance: requirement.source, field: null, qualificationId: null }),
  };
};

const classify = (requirement: CorpusRequirement, jurisdiction: ConditionEvaluation, applies: ConditionEvaluation[], excludes: ConditionEvaluation[]): ApplicabilityStatus => {
  const all = [jurisdiction, ...applies, ...excludes.filter((item) => item.outcome !== "NOT_SATISFIED")];
  if (all.some((item) => item.outcome === "CONFLICT")) return "CONFLICTING_REQUIREMENTS";
  if (jurisdiction.outcome === "NOT_SATISFIED" || applies.some((item) => item.outcome === "NOT_SATISFIED") || excludes.some((item) => item.outcome === "SATISFIED")) return "NOT_APPLICABLE";
  if (all.some((item) => item.outcome === "UNKNOWN_REQUIRES_QUALIFICATION")) return "UNKNOWN_REQUIRES_QUALIFICATION";
  if (all.some((item) => item.outcome === "UNKNOWN_MISSING_INFORMATION")) return "UNKNOWN_MISSING_INFORMATION";
  if (all.some((item) => item.outcome === "POTENTIAL")) return "POTENTIALLY_APPLICABLE";
  return requirement.normativeStrength === "CONDITIONAL_MANDATORY" ? "CONDITIONALLY_APPLICABLE" : "APPLICABLE";
};

const statusReason = (status: ApplicabilityStatus, requirement: CorpusRequirement, checks: ApplicabilityCheck[]) => {
  const decisive = checks.find((item) => {
    if (["CONFLICT", "UNKNOWN_REQUIRES_QUALIFICATION", "UNKNOWN_MISSING_INFORMATION", "POTENTIAL"].includes(item.outcome)) return true;
    if (status === "NOT_APPLICABLE" && item.check === "DOES_NOT_APPLY_IF" && item.outcome === "SATISFIED") return true;
    return item.check !== "DOES_NOT_APPLY_IF" && item.outcome === "NOT_SATISFIED";
  });
  const fallback: Record<ApplicabilityStatus, string> = {
    APPLICABLE: "Toutes les conditions REG-000 évaluables sont satisfaites dans le périmètre déclaré.",
    CONDITIONALLY_APPLICABLE: "L’exigence conditionnelle REG-000 est applicable dans le périmètre déclaré.",
    POTENTIALLY_APPLICABLE: "Des éléments candidats soutiennent l’applicabilité, sans permettre une conclusion engageante.",
    NOT_APPLICABLE: "Une condition explicite d’applicabilité n’est pas satisfaite ou une exclusion est satisfaite.",
    UNKNOWN_REQUIRES_QUALIFICATION: "Une qualification humaine ou externe est nécessaire.",
    UNKNOWN_MISSING_INFORMATION: "Une information structurante manque.",
    CONFLICTING_REQUIREMENTS: "Une contradiction empêche toute résolution automatique.",
    SUPERSEDED: `L’exigence ${requirement.identifier} est remplacée.`,
    OUTSIDE_EFFECTIVE_PERIOD: `L’exigence ${requirement.identifier} est hors de sa période d’effet.`,
  };
  return decisive?.reason ?? fallback[status];
};

const versionFailureResolution = (requirement: CorpusRequirement, input: RegulatoryResolutionInput, corpus: RegulatoryCorpusSnapshot): RequirementResolution => {
  const versionCheck = check("VERSION", corpus.corpus.identifier, { outcome: "UNKNOWN_MISSING_INFORMATION", reason: `Le couple corpus demandé ${input.regulatoryCorpusVersion}/${input.regulatoryCorpusDigest} ne correspond pas au snapshot ${corpus.corpus.version}/${logicalDigest(corpus)}.`, provenance: [corpus.corpus.identifier], field: "regulatoryCorpusVersion", qualificationId: null });
  return {
    requirementId: requirement.identifier, title: requirement.title, status: "UNKNOWN_MISSING_INFORMATION", normativeStrength: requirement.normativeStrength,
    jurisdiction: requirement.jurisdiction, applicableJurisdictions: [], excludedJurisdictions: [], authority: requirement.authority, sourceIds: uniqueSorted(requirement.source),
    reason: versionCheck.reason, conditions: [...requirement.conditions], checks: [versionCheck], edition: requirement.programEdition,
    effectivePeriod: { from: requirement.effectiveFrom, until: requirement.effectiveUntil }, supersededBy: [...requirement.supersededBy],
    provenance: uniqueSorted([corpus.corpus.identifier, ...requirement.source]),
  };
};

const resolveRequirement = (requirement: CorpusRequirement, input: RegulatoryResolutionInput, rules: CorpusApplicabilityRule[]): RequirementResolution => {
  const matchingRules = rulesForRequirement(requirement.identifier, rules);
  const version = check("VERSION", `${input.regulatoryCorpusVersion}/${input.regulatoryCorpusDigest}`, { outcome: "SATISFIED", reason: "La version et le digest du corpus d’entrée correspondent au snapshot résolu.", provenance: [input.regulatoryCorpusDigest], field: null, qualificationId: null });
  const temporal = temporalCheck(requirement, input.resolutionAsOf);
  const base = {
    requirementId: requirement.identifier,
    title: requirement.title,
    normativeStrength: requirement.normativeStrength,
    jurisdiction: requirement.jurisdiction,
    authority: requirement.authority,
    sourceIds: uniqueSorted(requirement.source),
    edition: requirement.programEdition,
    effectivePeriod: { from: requirement.effectiveFrom, until: requirement.effectiveUntil },
    supersededBy: [...requirement.supersededBy],
    provenance: uniqueSorted([input.researchProjectDigest, input.regulatoryCorpusDigest, ...requirement.source]),
  };
  if (temporal.status) return { ...base, status: temporal.status, applicableJurisdictions: [], excludedJurisdictions: [], reason: temporal.check.reason, conditions: [...requirement.conditions], checks: [version, temporal.check] };
  const jurisdiction = evaluateJurisdiction(input, requirement);
  const appliesIds = uniqueSorted([...requirement.conditions, ...matchingRules.flatMap((rule) => rule.relations.appliesIf)]);
  const applies = appliesIds.map((conditionId) => evaluateCondition(conditionId, input, requirement));
  const exclusions = matchingRules.flatMap((rule) => rule.relations.doesNotApplyIf.map((token) => ({ token, result: evaluateExclusion(token, input) })));
  const dependencyChecks = matchingRules.flatMap((rule) => rule.relations.dependsOn.map((dependency) => check("DEPENDS_ON", dependency, {
    outcome: rules.some((candidate) => candidate.relations.requires.includes(dependency)) ? "NOT_EVALUATED" : "NOT_EVALUATED",
    reason: `La dépendance REG-000 ${dependency} est conservée ; son accomplissement ne vaut pas condition d’applicabilité sauf référence à une Requirement explicite.`,
    provenance: requirement.source,
    field: null,
    qualificationId: null,
  })));
  const conflictChecks = matchingRules.flatMap((rule) => rule.relations.conflictsWith.map((conflict) => check("CONFLICT", conflict, {
    outcome: "NOT_EVALUATED", reason: `La relation de conflit ${conflict} est conservée et sera ouverte si sa cible devient active.`, provenance: requirement.source, field: null, qualificationId: null,
  })));
  const checks = [
    version,
    temporal.check,
    check("JURISDICTION", requirement.jurisdiction, jurisdiction.evaluation),
    ...applies.map((result, index) => check("APPLIES_IF", appliesIds[index], result)),
    ...exclusions.map(({ token, result }) => check("DOES_NOT_APPLY_IF", token, result)),
    ...matchingRules.flatMap((rule) => rule.relations.requires.map((required) => check("REQUIRES", required, { outcome: required === requirement.identifier ? "SATISFIED" : "NOT_EVALUATED", reason: `Relation requires de ${rule.ruleId} conservée.`, provenance: requirement.source, field: null, qualificationId: null }))),
    ...dependencyChecks,
    ...conflictChecks,
  ];
  const status = classify(requirement, jurisdiction.evaluation, applies, exclusions.map((item) => item.result));
  return {
    ...base,
    status,
    applicableJurisdictions: jurisdiction.applicable,
    excludedJurisdictions: jurisdiction.excluded,
    reason: statusReason(status, requirement, checks),
    conditions: appliesIds,
    checks,
  };
};

const isRelevant = (status: ApplicabilityStatus) => !["NOT_APPLICABLE", "SUPERSEDED", "OUTSIDE_EFFECTIVE_PERIOD"].includes(status);
const isApplicable = (status: ApplicabilityStatus) => ["APPLICABLE", "CONDITIONALLY_APPLICABLE"].includes(status);

const applyExplicitDependencies = (resolutions: RequirementResolution[], rules: CorpusApplicabilityRule[]) => {
  const byId = new Map(resolutions.map((item) => [item.requirementId, item]));
  for (const resolution of resolutions) {
    if (!isRelevant(resolution.status)) continue;
    const dependencies = rulesForRequirement(resolution.requirementId, rules).flatMap((rule) => rule.relations.dependsOn).filter((id) => byId.has(id));
    for (const dependencyId of dependencies) {
      const dependency = byId.get(dependencyId)!;
      const outcome: ApplicabilityCheck["outcome"] = dependency.status === "CONFLICTING_REQUIREMENTS" ? "CONFLICT" : isApplicable(dependency.status) ? "SATISFIED" : dependency.status === "POTENTIALLY_APPLICABLE" ? "POTENTIAL" : dependency.status === "UNKNOWN_REQUIRES_QUALIFICATION" ? "UNKNOWN_REQUIRES_QUALIFICATION" : dependency.status === "UNKNOWN_MISSING_INFORMATION" ? "UNKNOWN_MISSING_INFORMATION" : "NOT_SATISFIED";
      const dependencyCheck = check("DEPENDS_ON", dependencyId, { outcome, reason: `La Requirement dépendante ${dependencyId} est ${dependency.status}.`, provenance: dependency.provenance, field: null, qualificationId: null });
      resolution.checks = resolution.checks.map((item) => item.check === "DEPENDS_ON" && item.reference === dependencyId ? dependencyCheck : item);
      if (outcome === "CONFLICT") resolution.status = "CONFLICTING_REQUIREMENTS";
      else if (outcome === "UNKNOWN_REQUIRES_QUALIFICATION") resolution.status = "UNKNOWN_REQUIRES_QUALIFICATION";
      else if (outcome === "UNKNOWN_MISSING_INFORMATION" || outcome === "NOT_SATISFIED") resolution.status = "UNKNOWN_MISSING_INFORMATION";
      else if (outcome === "POTENTIAL" && isApplicable(resolution.status)) resolution.status = "POTENTIALLY_APPLICABLE";
      resolution.reason = statusReason(resolution.status, {
        identifier: resolution.requirementId, title: resolution.title, authority: resolution.authority, jurisdiction: resolution.jurisdiction, source: resolution.sourceIds, version: "", revision: "", effectiveFrom: resolution.effectivePeriod.from, effectiveUntil: resolution.effectivePeriod.until, programEdition: resolution.edition, supersedes: [], supersededBy: resolution.supersededBy, requiredDocuments: [], requiredSections: [], requiredFields: [], requiredAnnexes: [], submissionWorkflow: [], deadlines: [], conditions: resolution.conditions, normativeStrength: resolution.normativeStrength, status: "",
      }, resolution.checks);
    }
  }
};

const applyConflicts = (resolutions: RequirementResolution[], rules: CorpusApplicabilityRule[], input: RegulatoryResolutionInput): RegulatoryContradiction[] => {
  const byId = new Map(resolutions.map((item) => [item.requirementId, item]));
  const contradictions: RegulatoryContradiction[] = input.contradictions.map((item) => ({ contradictionId: item.contradictionId, requirementIds: uniqueSorted(item.requirementIds), description: item.description, status: "OPEN_NO_AUTOMATIC_ARBITRATION", provenance: uniqueSorted(item.provenance) }));
  for (const contradiction of input.contradictions) {
    for (const requirementId of contradiction.requirementIds) {
      const resolution = byId.get(requirementId);
      if (resolution && isRelevant(resolution.status)) {
        resolution.status = "CONFLICTING_REQUIREMENTS";
        resolution.reason = contradiction.description;
        resolution.checks.push(check("CONFLICT", contradiction.contradictionId, { outcome: "CONFLICT", reason: contradiction.description, provenance: contradiction.provenance, field: null, qualificationId: null }));
      }
    }
  }
  for (const rule of rules) {
    for (const sourceId of rule.relations.requires) {
      const source = byId.get(sourceId);
      if (!source || !isRelevant(source.status)) continue;
      for (const targetId of rule.relations.conflictsWith) {
        const target = byId.get(targetId);
        if (!target || !isRelevant(target.status)) continue;
        const ids = uniqueSorted([sourceId, targetId]);
        const contradictionId = `regulatory-conflict:${ids.join(":")}`;
        if (!contradictions.some((item) => item.contradictionId === contradictionId)) contradictions.push({ contradictionId, requirementIds: ids, description: `REG-000 déclare ${sourceId} incompatible avec ${targetId}; REG-001 ne les arbitre pas.`, status: "OPEN_NO_AUTOMATIC_ARBITRATION", provenance: uniqueSorted([...source.sourceIds, ...target.sourceIds]) });
        for (const item of [source, target]) {
          item.status = "CONFLICTING_REQUIREMENTS";
          item.reason = `Conflit ouvert entre ${sourceId} et ${targetId}.`;
          item.checks.push(check("CONFLICT", targetId === item.requirementId ? sourceId : targetId, { outcome: "CONFLICT", reason: item.reason, provenance: item.sourceIds, field: null, qualificationId: null }));
        }
      }
    }
  }
  return contradictions.sort((left, right) => left.contradictionId.localeCompare(right.contradictionId));
};

const qualificationAndMissing = (resolutions: RequirementResolution[], input: RegulatoryResolutionInput) => {
  const qualificationMap = new Map<string, QualificationResolution>();
  const missingMap = new Map<string, MissingRegulatoryInformation>();
  for (const resolution of resolutions) {
    for (const item of resolution.checks) {
      if (item.outcome === "UNKNOWN_REQUIRES_QUALIFICATION") {
        const qualificationId = item.qualificationId ?? (item.reference.startsWith("COND_") ? item.reference : `QUALIFICATION_FOR_${item.reference}`);
        const existing = qualificationMap.get(qualificationId);
        const known = input.knownRegulatoryQualifications.find((candidate) => candidate.qualificationId === qualificationId);
        qualificationMap.set(qualificationId, {
          qualificationId,
          status: known?.state === "QUALIFICATION_CANDIDATE" ? "QUALIFICATION_CANDIDATE" : "UNKNOWN_REQUIRES_QUALIFICATION",
          blockedRequirementIds: uniqueSorted([...(existing?.blockedRequirementIds ?? []), resolution.requirementId]),
          reason: item.reason,
          decisionId: known?.decisionId ?? null,
          provenance: uniqueSorted([...(existing?.provenance ?? []), ...item.provenance]),
        });
      }
      if (item.outcome === "UNKNOWN_MISSING_INFORMATION") {
        const field = item.field ?? (item.reference.startsWith("COND_") ? `condition:${item.reference}` : item.reference);
        const existing = missingMap.get(field);
        missingMap.set(field, {
          field,
          reason: item.reason,
          blockedRequirementIds: uniqueSorted([...(existing?.blockedRequirementIds ?? []), resolution.requirementId]),
          possibleConsequences: uniqueSorted([...(existing?.possibleConsequences ?? []), `Le statut de ${resolution.requirementId} peut changer.`]),
          prioritySignal: resolution.normativeStrength.includes("MANDATORY") ? "BLOCKING" : "NORMAL",
          provenance: uniqueSorted([...(existing?.provenance ?? []), ...item.provenance]),
        });
      }
    }
  }
  for (const unknown of input.unknowns) {
    if (missingMap.has(unknown.field)) continue;
    missingMap.set(unknown.field, { field: unknown.field, reason: unknown.reason, blockedRequirementIds: [], possibleConsequences: ["Aucune conclusion négative ne peut être tirée de cette absence."], prioritySignal: "NORMAL", provenance: uniqueSorted(unknown.provenance) });
  }
  return { qualifications: [...qualificationMap.values()].sort((a, b) => a.qualificationId.localeCompare(b.qualificationId)), missing: [...missingMap.values()].sort((a, b) => a.field.localeCompare(b.field)) };
};

const humanReviews = (qualifications: QualificationResolution[], missing: MissingRegulatoryInformation[], contradictions: RegulatoryContradiction[], input: RegulatoryResolutionInput): HumanReviewRequirement[] => {
  const reviews: HumanReviewRequirement[] = [];
  for (const item of qualifications) reviews.push({ reviewId: `review:qualification:${item.qualificationId}`, kind: "REGULATORY_QUALIFICATION", requirementIds: item.blockedRequirementIds, reason: item.reason, decisionId: item.decisionId, status: item.decisionId ? "PRESERVED_HUMAN_DECISION" : "PENDING", provenance: item.provenance });
  for (const item of contradictions) reviews.push({ reviewId: `review:contradiction:${item.contradictionId}`, kind: "CORPUS_CONTRADICTION", requirementIds: item.requirementIds, reason: item.description, decisionId: null, status: "PENDING", provenance: item.provenance });
  for (const item of missing.filter((candidate) => candidate.prioritySignal === "BLOCKING")) reviews.push({ reviewId: `review:missing:${logicalDigest(item.field)}`, kind: "MISSING_INFORMATION", requirementIds: item.blockedRequirementIds, reason: item.reason, decisionId: null, status: "PENDING", provenance: item.provenance });
  for (const decision of input.humanDecisions) reviews.push({ reviewId: `review:preserved:${decision.decisionId}:v${decision.version}`, kind: "EXTERNAL_AUTHORITY_REVIEW", requirementIds: decision.targets.filter((target) => target.startsWith("REQ_")), reason: decision.reason ?? "Décision humaine conservée sans reconstruction de motif.", decisionId: decision.decisionId, status: "PRESERVED_HUMAN_DECISION", provenance: uniqueSorted(decision.provenance) });
  return reviews.sort((a, b) => a.reviewId.localeCompare(b.reviewId));
};

const requirementById = (corpus: RegulatoryCorpusSnapshot) => new Map(corpus.requirements.map((item) => [item.identifier, item]));

const documentContextMatchesRequirement = (context: string, requirementId: string) => {
  if (context.includes("PHRC_N_2025_2026_STAGE1")) return requirementId === "REQ_PHRC_STAGE1";
  if (context.includes("PHRC_N_2025_2026_STAGE2")) return requirementId === "REQ_PHRC_STAGE2";
  if (context === "RHU_V6_2023") return requirementId.startsWith("REQ_RHU_V6_");
  if (context === "CPP_APPLICATION") return requirementId === "REQ_FR_CPP_PROTOCOL";
  if (context === "RANDOMISED_TRIAL_PROTOCOL_REPORTING") return requirementId === "REQ_SPIRIT_2025";
  return true;
};

const documentResolutions = (resolutions: RequirementResolution[], corpus: RegulatoryCorpusSnapshot): DocumentRequirementResolution[] => {
  const byId = requirementById(corpus);
  const documents: DocumentRequirementResolution[] = [];
  for (const resolution of resolutions.filter((item) => isRelevant(item.status))) {
    const requirement = byId.get(resolution.requirementId)!;
    for (const documentId of requirement.requiredDocuments) documents.push({
      documentRequirementId: null, documentId, status: resolution.status, requirementId: resolution.requirementId, sourceIds: resolution.sourceIds, authority: resolution.authority,
      reason: resolution.reason, conditions: resolution.conditions, edition: resolution.edition, effectivePeriod: resolution.effectivePeriod,
      sections: [...requirement.requiredSections], fields: [...requirement.requiredFields], annexes: [...requirement.requiredAnnexes], provenance: resolution.provenance,
    });
  }
  for (const documentRequirement of corpus.documentRequirements) {
    const rule = corpus.applicabilityRules.find((item) => item.ruleId === documentRequirement.applicabilityRuleId);
    if (!rule) continue;
    const sourceLinked = corpus.requirements.filter((item) => documentContextMatchesRequirement(documentRequirement.context, item.identifier) && item.requiredDocuments.includes(documentRequirement.documentId) && item.source.some((source) => documentRequirement.sourceIds.includes(source)));
    const directlyRelevant = sourceLinked.map((item) => resolutions.find((resolution) => resolution.requirementId === item.identifier)!).filter((item) => item && isRelevant(item.status));
    const fallbackRelevant = rule.relations.requires.filter((requirementId) => documentContextMatchesRequirement(documentRequirement.context, requirementId)).map((requirementId) => resolutions.find((item) => item.requirementId === requirementId)!).filter((item) => item && isRelevant(item.status));
    const linked = directlyRelevant.length ? directlyRelevant : fallbackRelevant;
    for (const resolution of linked) {
      const requirement = byId.get(resolution.requirementId)!;
      const documentStatus: ApplicabilityStatus = documentRequirement.qualificationStatus === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : documentRequirement.qualificationStatus === "UNKNOWN" ? "UNKNOWN_REQUIRES_QUALIFICATION" : resolution.status;
      const entry: DocumentRequirementResolution = {
        documentRequirementId: documentRequirement.documentRequirementId,
        documentId: documentRequirement.documentId,
        status: documentStatus,
        requirementId: resolution.requirementId,
        sourceIds: uniqueSorted([...documentRequirement.sourceIds, ...resolution.sourceIds]),
        authority: resolution.authority,
        reason: documentRequirement.justification,
        conditions: resolution.conditions,
        edition: resolution.edition,
        effectivePeriod: resolution.effectivePeriod,
        sections: [...requirement.requiredSections],
        fields: [...requirement.requiredFields],
        annexes: [...requirement.requiredAnnexes],
        provenance: uniqueSorted([...documentRequirement.sourceIds, ...resolution.provenance]),
      };
      const duplicate = documents.findIndex((item) => item.documentId === entry.documentId && item.requirementId === entry.requirementId);
      if (duplicate >= 0) documents[duplicate] = entry;
      else documents.push(entry);
    }
  }
  return documents.filter((item, index, all) => all.findIndex((candidate) => candidate.documentId === item.documentId && candidate.requirementId === item.requirementId) === index)
    .sort((a, b) => `${a.documentId}:${a.requirementId}`.localeCompare(`${b.documentId}:${b.requirementId}`));
};

const submissionResolutions = (resolutions: RequirementResolution[], corpus: RegulatoryCorpusSnapshot): SubmissionRequirementResolution[] => corpus.submissionRequirements.flatMap((submission) => {
  const linked = resolutions.filter((item) => submission.requirementIds.includes(item.requirementId) && isRelevant(item.status));
  if (!linked.length) return [];
  const status: ApplicabilityStatus = linked.some((item) => item.status === "CONFLICTING_REQUIREMENTS") ? "CONFLICTING_REQUIREMENTS" : linked.some((item) => item.status === "UNKNOWN_REQUIRES_QUALIFICATION") ? "UNKNOWN_REQUIRES_QUALIFICATION" : linked.some((item) => item.status === "UNKNOWN_MISSING_INFORMATION") ? "UNKNOWN_MISSING_INFORMATION" : linked.some((item) => item.status === "POTENTIALLY_APPLICABLE") ? "POTENTIALLY_APPLICABLE" : "APPLICABLE";
  return [{ submissionId: submission.submissionId, title: submission.title, status, requirementIds: uniqueSorted(linked.map((item) => item.requirementId)), workflow: [...submission.workflow], sourceIds: uniqueSorted(linked.flatMap((item) => item.sourceIds)), provenance: uniqueSorted(linked.flatMap((item) => item.provenance)) }];
}).sort((a, b) => a.submissionId.localeCompare(b.submissionId));

const approvalResolutions = (resolutions: RequirementResolution[], corpus: RegulatoryCorpusSnapshot): ApprovalRequirementResolution[] => corpus.approvalRequirements.flatMap((approval) => {
  const linked = resolutions.filter((item) => approval.requirementIds.includes(item.requirementId) && isRelevant(item.status));
  if (!linked.length) return [];
  const status = linked[0].status;
  return [{ approvalRequirementId: approval.approvalRequirementId, status, authority: approval.authority, resultRequired: approval.resultRequired, requirementIds: uniqueSorted(linked.map((item) => item.requirementId)), sourceIds: uniqueSorted(approval.sourceIds), provenance: uniqueSorted([...approval.sourceIds, ...linked.flatMap((item) => item.provenance)]) }];
}).sort((a, b) => a.approvalRequirementId.localeCompare(b.approvalRequirementId));

const fundingResolutions = (resolutions: RequirementResolution[], corpus: RegulatoryCorpusSnapshot): FundingRequirementResolution[] => {
  const programs = new Map(corpus.programEditions.map((edition) => [edition.editionId, edition.programId]));
  const byId = requirementById(corpus);
  return resolutions.filter((item) => item.normativeStrength === "PROGRAM_MANDATORY" && isRelevant(item.status)).map((resolution) => {
    const requirement = byId.get(resolution.requirementId)!;
    return { requirementId: resolution.requirementId, programId: resolution.edition ? programs.get(resolution.edition) ?? null : null, editionId: resolution.edition, status: resolution.status, documents: [...requirement.requiredDocuments], sections: [...requirement.requiredSections], fields: [...requirement.requiredFields], annexes: [...requirement.requiredAnnexes], deadlines: [...requirement.deadlines], submissionWorkflow: [...requirement.submissionWorkflow], sourceIds: resolution.sourceIds, provenance: resolution.provenance };
  }).sort((a, b) => a.requirementId.localeCompare(b.requirementId));
};

const guidanceResolutions = (resolutions: RequirementResolution[], kind: GuidanceResolution["guidanceKind"]): GuidanceResolution[] => resolutions.filter((item) => item.normativeStrength === kind && isRelevant(item.status)).map((item) => ({ requirementId: item.requirementId, title: item.title, status: item.status, guidanceKind: kind, sourceIds: item.sourceIds, reason: item.reason, provenance: item.provenance })).sort((a, b) => a.requirementId.localeCompare(b.requirementId));

const readiness = (resolutions: RequirementResolution[], qualifications: QualificationResolution[], missing: MissingRegulatoryInformation[], contradictions: RegulatoryContradiction[], corpus: RegulatoryCorpusSnapshot, compatible: boolean): RegulatoryResolutionResult["readiness"] => {
  const unresolved = resolutions.filter((item) => ["UNKNOWN_REQUIRES_QUALIFICATION", "UNKNOWN_MISSING_INFORMATION", "CONFLICTING_REQUIREMENTS", "POTENTIALLY_APPLICABLE"].includes(item.status)).map((item) => item.requirementId);
  let status: RegulatoryResolutionResult["readiness"]["status"] = "RESOLUTION_COMPLETE";
  const reasons: string[] = [];
  if (!compatible) { status = "CORPUS_VERSION_OUTDATED"; reasons.push("Le couple version/digest demandé ne correspond pas au snapshot chargé."); }
  else if (contradictions.length) { status = "CONTRADICTION_OPEN"; reasons.push("Au moins une contradiction reste ouverte sans arbitrage automatique."); }
  else if (missing.some((item) => item.blockedRequirementIds.length)) { status = "MISSING_INFORMATION"; reasons.push("Des informations structurantes manquent pour certaines exigences."); }
  else if (qualifications.length) { status = "QUALIFICATION_REQUIRED"; reasons.push("Une ou plusieurs qualifications humaines ou externes sont requises."); }
  else if (unresolved.length) { status = "RESOLUTION_PARTIAL"; reasons.push("Certaines exigences ne sont que potentiellement applicables."); }
  else if (corpus.corpus.admissionStatus !== "ADMITTED") { status = "CORPUS_INSUFFICIENT"; reasons.push(`Le corpus est ${corpus.corpus.documentLevel}/${corpus.corpus.admissionStatus}, pas une autorité admise.`); }
  return { status, reasons, unresolvedRequirementIds: uniqueSorted(unresolved), notice: "LOCAL_REGULATORY_RESOLUTION_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_APPROVAL" };
};

const corpusDiagnostics = (resolutions: RequirementResolution[], corpus: RegulatoryCorpusSnapshot, compatible: boolean): RegulatoryCorpusDiagnostic[] => {
  const diagnostics: RegulatoryCorpusDiagnostic[] = [];
  if (corpus.corpus.admissionStatus !== "ADMITTED") diagnostics.push({
    diagnosticId: "corpus-diagnostic:candidate-corpus",
    severity: "WARNING",
    kind: "CANDIDATE_CORPUS",
    ruleId: null,
    reference: corpus.corpus.identifier,
    requirementIds: [],
    description: `Le snapshot est ${corpus.corpus.documentLevel}/${corpus.corpus.admissionStatus}; REG-001 ne le promeut pas en autorité admise.`,
    provenance: [corpus.corpus.identifier, corpus.corpus.version],
  });
  if (!compatible) diagnostics.push({
    diagnosticId: "corpus-diagnostic:version-mismatch",
    severity: "ERROR",
    kind: "CORPUS_VERSION_MISMATCH",
    ruleId: null,
    reference: corpus.corpus.identifier,
    requirementIds: corpus.requirements.map((item) => item.identifier).sort(),
    description: "La version ou le digest demandé ne correspond pas au snapshot chargé; aucune résolution positive n’est produite.",
    provenance: [corpus.corpus.identifier, corpus.corpus.version],
  });
  for (const resolution of resolutions) {
    for (const item of resolution.checks.filter((candidate) => candidate.outcome === "UNKNOWN_MISSING_INFORMATION" && candidate.field?.startsWith("corpus."))) diagnostics.push({
      diagnosticId: `corpus-diagnostic:uninterpreted:${logicalDigest({ requirementId: resolution.requirementId, reference: item.reference })}`,
      severity: "ERROR",
      kind: "UNINTERPRETED_CONDITION",
      ruleId: null,
      reference: item.reference,
      requirementIds: [resolution.requirementId],
      description: item.reason,
      provenance: item.provenance,
    });
  }
  for (const rule of corpus.applicabilityRules) {
    const symbolic = [...rule.relations.dependsOn, ...rule.relations.conflictsWith].filter((reference) => !corpus.requirements.some((item) => item.identifier === reference));
    for (const reference of symbolic) diagnostics.push({
      diagnosticId: `corpus-diagnostic:symbolic:${rule.ruleId}:${reference}`,
      severity: "INFORMATION",
      kind: "SYMBOLIC_RELATION",
      ruleId: rule.ruleId,
      reference,
      requirementIds: rule.relations.requires.filter((item) => corpus.requirements.some((requirement) => requirement.identifier === item)),
      description: `La relation ${reference} est symbolique dans REG-000 et n’est pas arbitrée comme une Requirement autonome par REG-001.`,
      provenance: [corpus.corpus.identifier, rule.ruleId],
    });
  }
  return diagnostics.filter((item, index, all) => all.findIndex((candidate) => candidate.diagnosticId === item.diagnosticId) === index).sort((a, b) => a.diagnosticId.localeCompare(b.diagnosticId));
};

export const resolveRegulatoryRequirements = (rawInput: RegulatoryResolutionInput, corpus: RegulatoryCorpusSnapshot = REG000_CORPUS): RegulatoryResolutionResult => {
  const input = parseRegulatoryResolutionInput(rawInput);
  const inputBefore = stableStringify(input);
  const corpusBefore = stableStringify(corpus);
  const corpusDigest = logicalDigest(corpus);
  const compatible = input.regulatoryCorpusVersion === corpus.corpus.version && input.regulatoryCorpusDigest === corpusDigest;
  const resolutions = [...corpus.requirements].sort((a, b) => a.identifier.localeCompare(b.identifier)).map((requirement) => {
    return compatible ? resolveRequirement(requirement, input, corpus.applicabilityRules) : versionFailureResolution(requirement, input, corpus);
  });
  if (compatible) applyExplicitDependencies(resolutions, corpus.applicabilityRules);
  const contradictions = applyConflicts(resolutions, corpus.applicabilityRules, input);
  const { qualifications, missing } = qualificationAndMissing(resolutions, input);
  const trace = new RegulatoryResolutionTrace();
  for (const resolution of resolutions) trace.add("RESOLVE_REQUIREMENT", resolution.requirementId, { inputDigest: input.researchProjectDigest, corpusDigest, requirementId: resolution.requirementId }, resolution, resolution.status, resolution.checks);
  const applicableRequirements = resolutions.filter((item) => isApplicable(item.status));
  const potentiallyApplicableRequirements = resolutions.filter((item) => item.status === "POTENTIALLY_APPLICABLE");
  const notApplicableRequirements = resolutions.filter((item) => ["NOT_APPLICABLE", "SUPERSEDED", "OUTSIDE_EFFECTIVE_PERIOD"].includes(item.status));
  const unresolvedRequirements = resolutions.filter((item) => ["UNKNOWN_REQUIRES_QUALIFICATION", "UNKNOWN_MISSING_INFORMATION", "CONFLICTING_REQUIREMENTS"].includes(item.status));
  const resultMaterial = {
    contractVersion: REGULATORY_RESOLUTION_VERSION,
    researchProjectId: input.researchProjectId,
    researchProjectVersion: input.researchProjectVersion,
    researchProjectDigest: input.researchProjectDigest,
    corpusVersion: corpus.corpus.version,
    corpusDigest,
    resolvedAt: input.resolutionAsOf,
    applicableRequirements,
    potentiallyApplicableRequirements,
    notApplicableRequirements,
    unresolvedRequirements,
    regulatoryMandatoryRequirements: resolutions.filter((item) => ["LEGAL_MANDATORY", "REGULATORY_MANDATORY", "CONDITIONAL_MANDATORY", "PROGRAM_MANDATORY"].includes(item.normativeStrength) && isRelevant(item.status)),
    requiredQualifications: qualifications,
    missingInformation: missing,
    contradictions,
    humanReviewRequirements: humanReviews(qualifications, missing, contradictions, input),
    fundingRequirements: fundingResolutions(resolutions, corpus),
    documentRequirements: documentResolutions(resolutions, corpus),
    submissionRequirements: submissionResolutions(resolutions, corpus),
    approvalRequirements: approvalResolutions(resolutions, corpus),
    methodologicalGuidance: guidanceResolutions(resolutions, "METHODOLOGICAL_GUIDANCE"),
    reportingGuidance: guidanceResolutions(resolutions, "REPORTING_GUIDANCE"),
    corpusDiagnostics: corpusDiagnostics(resolutions, corpus, compatible),
    humanDecisions: input.humanDecisions.map((decision) => ({ ...decision, scope: [...decision.scope], targets: [...decision.targets], provenance: [...decision.provenance], impact: { affectedObjects: [...decision.impact.affectedObjects], affectedEngines: [...decision.impact.affectedEngines], reopenedGates: [...decision.impact.reopenedGates], obsoleteProjections: [...decision.impact.obsoleteProjections] } })),
    provenance: {
      engineVersion: REGULATORY_RESOLUTION_VERSION,
      researchProjectRefs: uniqueSorted([input.researchProjectId, input.researchProjectVersion, input.researchProjectDigest]),
      corpusRefs: uniqueSorted([corpus.corpus.identifier, corpus.corpus.version, corpusDigest]),
      sourceRefs: uniqueSorted(resolutions.flatMap((item) => item.sourceIds)),
      authorityBoundary: "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION" as const,
    },
    readiness: readiness(resolutions, qualifications, missing, contradictions, corpus, compatible),
  };
  const resolutionId = `regulatory-resolution:${logicalDigest(resultMaterial)}`;
  trace.add("BUILD_APPLICABLE_REQUIREMENT_SET", null, { input: input.researchProjectDigest, corpus: corpusDigest }, resultMaterial, resultMaterial.readiness.status);
  if (stableStringify(input) !== inputBefore) throw new Error("RESEARCH_PROJECT_PROJECTION_MUTATED_BY_REGULATORY_RESOLUTION");
  if (stableStringify(corpus) !== corpusBefore) throw new Error("REGULATORY_CORPUS_MUTATED_BY_REGULATORY_RESOLUTION");
  return { ...resultMaterial, resolutionId, trace: trace.build() };
};
