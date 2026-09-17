import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { digestPlanningValue, readOnlyValidationHandoff } from "./contracts";
import { buildProjectDataAnalysisView } from "./project-integration";
import type { DataAnalysisPlanningContribution, PlanningContributionType, ProjectDataAnalysisView } from "./types";
import type { StudyProposalComposition } from "../scientific-thinking/contextual-study-proposal.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import { ensureCanonicalProjectState } from "../research-project-construction/canonical-project-backbone.js";
import { qualifyCandidateCollection } from "../observability-measurement/candidate-collection.js";

export type StudyCandidateProjection = {
  projectionType: "SCREENING" | "RECRUITMENT_NOTICE" | "RECRUITED_PARTICIPANT_QUESTIONNAIRE" | "CRF_SPECIFICATION" | "WORKING_PROTOCOL" | "DATA_DICTIONARY" | "ANALYSIS_PLAN" | "DIMENSIONING" | "SCHEDULE_OF_ACTIVITIES" | "IMAGING_GUIDE";
  label: string; owner: "DATA_MANAGEMENT" | "BIOSTATISTICS" | "STUDY_DESIGN" | "IMAGING" | "DOC-001";
  SOURCE_PROJECT_VERSION: string | null; PROPOSAL_REFS: readonly string[]; ADOPTED_REFS: readonly string[];
  freshness: "CURRENT" | "STALE" | "REVIEW_REQUIRED"; status: "CANDIDATE_NOT_VALIDATED";
  content: string; fields: readonly ReturnType<typeof qualifyCandidateCollection>[number][];
  projectionOnly: true; sourceOfTruth: false; projectWriteAuthorized: false;
};

/** Pre-adoption previews extend the existing projection owner. Canonical and
 * candidate inputs stay separate: this never constructs a synthetic Project. */
export const buildStudyCandidateProjections = (composition: StudyProposalComposition, project: ResearchProjectOwnerProjection | null): StudyCandidateProjection[] => {
  const excluded = new Set(composition.proposal.arbitrations.flatMap(a => a.options.filter(o => composition.unavailableOptionRefs.includes(o.ref)).flatMap(o => o.atomRefs)));
  composition.dispositions?.filter(d => d.status === "REJECTED").flatMap(d => d.atomRefs).filter(r => !composition.adoptedAtomRefs.includes(r)).forEach(r => excluded.add(r));
  let changed = true; while (changed) { changed = false; for (const a of composition.proposal.atoms) if (!excluded.has(a.ref) && a.dependsOn.some(r => excluded.has(r))) { excluded.add(a.ref); changed = true; } }
  const atoms = composition.proposal.atoms.filter(a => !excluded.has(a.ref));
  const objects = project ? ensureCanonicalProjectState(project).objects.filter(o => o.actuality === "CURRENT") : [];
  const adopted = (ref: string) => objects.find(o => o.content === composition.proposal.atoms.find(a => a.ref === ref)?.content
    && (composition.adoptionSourceRefs?.[ref] ?? [`${composition.proposalRef}:atom:${ref}`]).some(r => o.sourceItemRefs.includes(r)));
  const text = (areas: readonly string[]) => atoms.filter(a => areas.includes(a.area)).map(a => {
    const object = adopted(a.ref); return `${object ? "Confirmé" : "Proposé"} — ${object?.content ?? a.content}`;
  }).join("\n");
  const fields = qualifyCandidateCollection(atoms.filter(a => ["OBS", "IMAGING", "DATA_MANAGEMENT", "BIOSTATISTICS"].includes(a.owner)));
  const freshness: StudyCandidateProjection["freshness"] = composition.state === "CURRENT"
    && (composition.sourceProject?.projectId ?? null) === (project?.projectId ?? null)
    && (composition.sourceProject?.versionId ?? null) === (project?.versionId ?? null)
    && (composition.sourceProject?.projectDigest ?? null) === (project?.projectDigest ?? null) ? "CURRENT" : composition.state === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "STALE";
  const base = { SOURCE_PROJECT_VERSION: composition.sourceProject?.versionId ?? null,
    PROPOSAL_REFS: [composition.proposalRef, ...atoms.filter(a => !adopted(a.ref)).map(a => a.ref)],
    ADOPTED_REFS: objects.filter(o => composition.adoptedAtomRefs.some(ref => adopted(ref)?.objectVersionId === o.objectVersionId)).map(o => o.objectVersionId),
    freshness, status: "CANDIDATE_NOT_VALIDATED" as const, projectionOnly: true as const, sourceOfTruth: false as const, projectWriteAuthorized: false as const };
  const make = (projectionType: StudyCandidateProjection["projectionType"], label: string, owner: StudyCandidateProjection["owner"], content: string, collection = false): StudyCandidateProjection => ({ ...base, projectionType, label, owner, content: freshness === "REVIEW_REQUIRED" ? "Ces aperçus doivent être réévalués après la correction. Aucun ancien contenu ni effectif ne constitue une proposition courante." : content, fields: freshness === "REVIEW_REQUIRED" ? [] : collection ? fields : [] });
  const fieldText = fields.map(f => `${f.label} · ${f.unit ?? "unité à préciser"} · ${f.roles.join(", ") || "rôle à préciser"} · valeur non recueillie`).join("\n");
  const projections: StudyCandidateProjection[] = [
    ...(composition.proposal.participantArtifactsApplicable ? [
    make("RECRUITMENT_NOTICE", "Annonce de recrutement", "STUDY_DESIGN", `Appel à volontaires — texte de travail\n${text(["OBJECTIVES", "POPULATION", "RECRUITMENT", "TIMING", "PRACTICAL"])}\nCritères envisagés :\n${text(["ELIGIBILITY"])}\nContact et modalités de prise de rendez-vous : à compléter.\nCe brouillon n'est ni une notice réglementaire ni un consentement.`),
    make("SCREENING", "Vérification de l’éligibilité par l’équipe", "STUDY_DESIGN", `Critères à vérifier par l’équipe — aucune inclusion simulée\n${text(["ELIGIBILITY", "POPULATION"])}\n${fields.filter(f => f.roles.includes("EXCLUSION_VARIABLE")).map(f => f.label).join("\n")}`, true),
    make("RECRUITED_PARTICIPANT_QUESTIONNAIRE", "Questionnaire du participant recruté", "DATA_MANAGEMENT", `${composition.proposal.participantQuestionnaireIntroduction}\n${fields.filter(f => f.participantReported).map(f => `${f.label} : réponse à renseigner`).join("\n")}\nCe questionnaire n'est ni le CRF ni une décision d'éligibilité.`, true),
    ] : []),
    make("CRF_SPECIFICATION", "CRF candidat", "DATA_MANAGEMENT", `Spécification de collecte — aucun résultat simulé\n${fieldText}\n${text(["TIMING", "MEASUREMENTS"])}\nLes méthodes, occasions et contrôles encore inconnus restent à qualifier.`, true),
    make("WORKING_PROTOCOL", "Protocole de travail", "DOC-001", `${text(["QUESTION", "OBJECTIVES", "DESIGN", "POPULATION", "ELIGIBILITY", "RECRUITMENT", "EXPOSURE", "MEASUREMENTS", "TIMING", "ENDPOINTS", "ANALYSIS", "BIASES", "PRACTICAL"])}\nLes alternatives non arbitrées restent concurrentes ; aucune validation scientifique ou réglementaire n'est déclarée.`),
    make("DATA_DICTIONARY", "Dictionnaire de données candidat", "DATA_MANAGEMENT", fieldText, true),
    make("ANALYSIS_PLAN", "Plan d'analyse candidat", "BIOSTATISTICS", text(["ANALYSIS", "CONFOUNDERS", "DESCRIPTION", "ENDPOINTS"])),
    make("DIMENSIONING", "Scénarios de dimensionnement", "BIOSTATISTICS", composition.dimensioning.filter(s => !composition.proposal.dimensioningScenarios.find(candidate => candidate.ref === s.ref)?.branchAtomRefs.some(r => excluded.has(r))).map(s => s.calculation
      ? `${s.role === "PRIMARY" ? "Stratégie principale candidate" : "Alternative"} — ${s.label}\nScénario hypothétique, non adopté : ${s.calculation.evaluableTotal} évaluables, ${s.calculation.totalSampleSize} à recruter ; ${s.calculation.strata} groupes/quotas, ${s.calculation.evaluablePerStratum} évaluables et ${s.calculation.recruitedPerStratum} à recruter par groupe/quota.\n${s.calculation.methodIdentity} · alpha=${s.calculation.inputs.alpha} · puissance=${s.calculation.inputs.power} · effet=${s.calculation.inputs.effectSize} (${s.calculation.effectSizeMeaning}) · non-évaluabilité=${s.calculation.inputs.anticipatedNonEvaluableRate}.\n${s.calculation.inputs.nonEvaluableReasons.join(" · ")}\n${s.calculation.inputs.assumptions.map(a => `${a.parameter}=${a.value} · ${a.provenance} · ${a.sourceRef}`).join("\n")}\nLimites : ${s.calculation.limitations.join(" ")}`
      : `${s.label} — calcul bloqué : ${s.reason}`).join("\n\n") || `Dimensionnement à instruire : ${text(["DIMENSIONING"])}\nLes hypothèses quantitatives et la méthode restent à préciser ; aucun effectif n'est inventé.`),
    make("SCHEDULE_OF_ACTIVITIES", "Calendrier candidat", "STUDY_DESIGN", text(["TIMING", "MEASUREMENTS", "PRACTICAL"])),
    ...(atoms.some(a => a.owner === "IMAGING") ? [make("IMAGING_GUIDE", "Guide d'imagerie candidat", "IMAGING", text(["MEASUREMENTS", "TIMING"]))] : []),
  ];
  return projections.map(p => p.projectionType === "RECRUITED_PARTICIPANT_QUESTIONNAIRE" ? { ...p, fields: p.fields.filter(f => f.participantReported) }
    : p.projectionType === "SCREENING" ? { ...p, fields: p.fields.filter(f => f.roles.includes("EXCLUSION_VARIABLE")) } : p);
};

export type DataAnalysisProjectionStatus = "GENERATABLE" | "PARTIALLY_GENERATABLE" | "BLOCKED" | "NOT_GENERATABLE" | "NOT_APPLICABLE";

export type DataAnalysisTemplateBlockInput = {
  blockId: "PROTOCOL_DATA_AND_ANALYSIS" | "DATA_MANAGEMENT_PLAN" | "CRF_SPECIFICATION" | "DATA_DICTIONARY" | "SCHEDULE_OF_ACTIVITIES" | "SAP" | "STATISTICAL_METHODS";
  label: string;
  status: DataAnalysisProjectionStatus;
  sourceProjectVersion: string;
  sourceObjectRefs: string[];
  structuredContent: unknown;
  missing: string[];
  decisionsRequired: string[];
  limitations: string[];
  projectionOnly: true;
  sourceOfTruth: false;
};

export type DataAnalysisDocumentProjectionInput = {
  projectionId: string;
  projectionType: "PROTOCOL_DATA_AND_ANALYSIS" | "DATA_MANAGEMENT_PLAN" | "CRF_SPECIFICATION" | "DATA_DICTIONARY" | "SCHEDULE_OF_ACTIVITIES" | "SAP" | "STATISTICAL_METHODS";
  projectId: string;
  projectVersion: string;
  blocks: DataAnalysisTemplateBlockInput[];
  status: DataAnalysisProjectionStatus;
  decisionRefs: string[];
  provenance: string[];
  projectionOnly: true;
  sourceOfTruth: false;
  documentWriteAuthorized: false;
};

const statusFor = (present: boolean, blocked: boolean, missing: string[], notApplicable = false): DataAnalysisProjectionStatus => {
  if (notApplicable) return "NOT_APPLICABLE";
  if (!present) return "NOT_GENERATABLE";
  if (blocked) return "BLOCKED";
  return missing.length ? "PARTIALLY_GENERATABLE" : "GENERATABLE";
};

const logicalAnalysisStatus = (status: "GENERATABLE" | "GENERATABLE_WITH_LIMITATIONS" | "NOT_GENERATABLE" | "NOT_APPLICABLE" | "BLOCKED" | undefined): DataAnalysisProjectionStatus => status === "GENERATABLE" ? "GENERATABLE" : status === "GENERATABLE_WITH_LIMITATIONS" ? "PARTIALLY_GENERATABLE" : status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : status === "BLOCKED" ? "BLOCKED" : "NOT_GENERATABLE";

export const buildDataManagementTemplateInput = (view: Readonly<ProjectDataAnalysisView>): DataAnalysisTemplateBlockInput[] => {
  const plan = view.dataManagement;
  const missing = plan ? [...plan.readiness.blockingItems, ...plan.readiness.warningItems] : ["Data Management Plan non adopté dans cette version Project."];
  const common = { sourceProjectVersion: view.projectVersion, missing, decisionsRequired: plan?.readiness.decisionsRequired ?? [], limitations: plan?.readiness.limitations ?? [], projectionOnly: true as const, sourceOfTruth: false as const };
  return [
    { ...common, blockId: "DATA_MANAGEMENT_PLAN", label: "Data Management Plan", status: statusFor(Boolean(plan), plan?.readiness.overallStatus === "BLOCKED", missing), sourceObjectRefs: plan ? [plan.definition.definitionId] : [], structuredContent: plan?.definition ?? null },
    { ...common, blockId: "CRF_SPECIFICATION", label: "CRF Specification", status: statusFor(Boolean(plan), false, missing), sourceObjectRefs: plan ? [plan.logicalCRF.projectionId] : [], structuredContent: plan?.logicalCRF ?? null },
    { ...common, blockId: "DATA_DICTIONARY", label: "Data Dictionary", status: statusFor(Boolean(plan), false, missing), sourceObjectRefs: plan ? [plan.logicalDataDictionary.projectionId] : [], structuredContent: plan?.logicalDataDictionary ?? null },
    { ...common, blockId: "SCHEDULE_OF_ACTIVITIES", label: "Schedule of Activities", status: statusFor(Boolean(plan), false, missing), sourceObjectRefs: plan ? [plan.logicalScheduleOfActivities.projectionId] : [], structuredContent: plan?.logicalScheduleOfActivities ?? null },
  ];
};

export const buildBiostatisticsTemplateInput = (view: Readonly<ProjectDataAnalysisView>): DataAnalysisTemplateBlockInput[] => {
  const plan = view.biostatistics;
  const missing = plan ? [...plan.readiness.blockingItems, ...plan.readiness.warningItems] : ["Biostatistics Plan non adopté dans cette version Project."];
  const common = { sourceProjectVersion: view.projectVersion, missing, decisionsRequired: plan?.readiness.decisionsRequired ?? [], limitations: plan?.readiness.limitations ?? [], projectionOnly: true as const, sourceOfTruth: false as const };
  return [
    { ...common, blockId: "SAP", label: "Statistical Analysis Plan", status: logicalAnalysisStatus(plan?.logicalSAP.status), sourceObjectRefs: plan ? [plan.logicalSAP.projectionId] : [], structuredContent: plan?.logicalSAP ?? null },
    { ...common, blockId: "STATISTICAL_METHODS", label: "Statistical Methods", status: logicalAnalysisStatus(plan?.logicalStatisticalMethods.status), sourceObjectRefs: plan ? [plan.logicalStatisticalMethods.projectionId] : [], structuredContent: plan?.logicalStatisticalMethods ?? null },
  ];
};

export const buildDataAnalysisDocumentProjectionInputs = (project: Readonly<ResearchProjectDesignResult>): DataAnalysisDocumentProjectionInput[] => {
  const view = buildProjectDataAnalysisView(project);
  const blocks = [...buildDataManagementTemplateInput(view), ...buildBiostatisticsTemplateInput(view)];
  const individual: DataAnalysisDocumentProjectionInput[] = blocks.map((block) => ({
    projectionId: `data-analysis-document:${digestPlanningValue({ project: project.documentHandoff.projectId, version: view.projectVersion, block: block.blockId, content: block.structuredContent })}`,
    projectionType: block.blockId,
    projectId: project.documentHandoff.projectId,
    projectVersion: view.projectVersion,
    blocks: [block],
    status: block.status,
    decisionRefs: view.decisions.map((item) => item.decisionId),
    provenance: [`project:${project.documentHandoff.projectId}@${view.projectVersion}`, ...block.sourceObjectRefs],
    projectionOnly: true,
    sourceOfTruth: false,
    documentWriteAuthorized: false,
  }));
  const protocolStatus: DataAnalysisProjectionStatus = blocks.some((item) => item.status === "BLOCKED") ? "BLOCKED" : blocks.some((item) => item.status === "NOT_GENERATABLE") ? "PARTIALLY_GENERATABLE" : blocks.some((item) => item.status === "PARTIALLY_GENERATABLE") ? "PARTIALLY_GENERATABLE" : "GENERATABLE";
  return [{
    projectionId: `data-analysis-document:${digestPlanningValue({ project: project.documentHandoff.projectId, version: view.projectVersion, type: "PROTOCOL_DATA_AND_ANALYSIS", blocks })}`,
    projectionType: "PROTOCOL_DATA_AND_ANALYSIS" as const,
    projectId: project.documentHandoff.projectId,
    projectVersion: view.projectVersion,
    blocks,
    status: protocolStatus,
    decisionRefs: view.decisions.map((item) => item.decisionId),
    provenance: [`project:${project.documentHandoff.projectId}@${view.projectVersion}`, ...blocks.flatMap((item) => item.sourceObjectRefs)],
    projectionOnly: true as const,
    sourceOfTruth: false as const,
    documentWriteAuthorized: false as const,
  }, ...individual];
};

export const buildDataAnalysisValidationObservation = (contribution: Readonly<DataAnalysisPlanningContribution>) => ({
  ...readOnlyValidationHandoff(contribution),
  validationPurpose: "DATA_ANALYSIS_DESIGN_TIME_OBSERVATION" as const,
  contributionType: contribution.contributionType as PlanningContributionType,
  realizedDataRequired: false as const,
  executionAuthorized: false as const,
});
