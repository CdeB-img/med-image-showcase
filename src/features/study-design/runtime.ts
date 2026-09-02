import { logicalDigest, normalizeScientificText, stableStringify } from "@/features/knowledge-engine/canonical";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import {
  createSpecializedOwnerHandoffRequestFromSnapshot,
  listSpecializedOwnerCapabilities,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerId,
} from "@/features/research-project-construction/specialized-owner-handoff";
import {
  buildLegacyStudyDesignReasoningSeeds,
  detectStudyDesignSignals,
  type LegacyStudyDesignReasoningSeed,
} from "./design-reasoning";
import {
  STUDY_DESIGN_PROPOSAL_CONTRACT,
  STUDY_DESIGN_RUNTIME_CONTRACT,
  STUDY_DESIGN_RUNTIME_VERSION,
  type StudyDesignAxes,
  type StudyDesignFamilyCode,
  type StudyDesignHandoffProposal,
  type StudyDesignInformationNeed,
  type StudyDesignOption,
  type StudyDesignProposalContribution,
  type StudyDesignRuntimeInput,
  type StudyDesignTraceSink,
  type StudyDesignValidationFinding,
  type StudyDesignValidationResult,
} from "./contracts";

const DESIGN_OBJECT_TYPES = new Set<ProjectContextSnapshot["objects"][number]["type"]>([
  "SCIENTIFIC_QUESTION",
  "OBJECTIVE",
  "HYPOTHESIS",
  "POPULATION",
  "ELIGIBILITY_CRITERION",
  "STUDY_DESIGN",
  "GROUP",
  "INTERVENTION_OR_EXPOSURE",
  "ENDPOINT",
  "CANONICAL_VARIABLE",
  "IMAGING_MODALITY",
  "ACQUISITION",
  "VISIT",
  "CONSTRAINT",
  "ANALYSIS_SPECIFICATION",
  "DATA_NEED",
  "PROJECT_INFORMATION",
]);

const SUPPORTED_FAMILIES = new Set<StudyDesignFamilyCode>([
  "CROSS_SECTIONAL_OBSERVATIONAL",
  "PROSPECTIVE_LONGITUDINAL_COHORT",
  "RETROSPECTIVE_LONGITUDINAL_COHORT",
  "AMBISPECTIVE_LONGITUDINAL_COHORT",
  "PROSPECTIVE_PROGNOSTIC_COHORT",
  "METHODOLOGICAL_VALIDATION",
  "COMPARATIVE_OBSERVATIONAL",
  "INTERVENTIONAL_COMPARATIVE_STUDY",
]);

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const snapshotIsValid = (snapshot: Readonly<ProjectContextSnapshot>) => {
  const detached = clone(snapshot);
  const { snapshotDigest, ...material } = detached;
  return detached.contract === "PROJECT_CONTEXT_SNAPSHOT"
    && detached.contractVersion === "0.3.0"
    && detached.owner === "RESEARCH_PROJECT"
    && detached.readOnly === true
    && logicalDigest(material) === snapshotDigest;
};

export const buildStudyDesignRuntimeInput = (snapshot: Readonly<ProjectContextSnapshot>): Readonly<StudyDesignRuntimeInput> => {
  if (!snapshotIsValid(snapshot)) throw new Error("STUDY_DESIGN_PROJECT_SNAPSHOT_INVALID");
  const designKnowns = snapshot.objects
    .filter((item) => DESIGN_OBJECT_TYPES.has(item.type) && ["KNOWN", "ASSUMED"].includes(item.epistemicState))
    .map((item) => ({
      projectRef: item.stableId,
      versionRef: item.versionRef,
      type: item.type,
      content: item.content,
      scientificRole: item.scientificRole,
      epistemicState: item.epistemicState as "KNOWN" | "ASSUMED",
      provenanceRefs: unique([
        item.versionRef,
        item.sourceContributionRef,
        ...item.sourceItemRefs,
        ...item.provenance.sourceTurnRefs,
        ...item.provenance.evidenceRefs,
      ]),
    }))
    .sort((left, right) => left.versionRef.localeCompare(right.versionRef));
  const designUnknowns = snapshot.openIssues
    .map((item) => ({ ...item, sourceRefs: unique(item.sourceRefs) }))
    .sort((left, right) => left.issueRef.localeCompare(right.issueRef));
  const sourceProvenanceRefs = unique([
    snapshot.sourceContributionRef,
    snapshot.sourceContributionDigest,
    snapshot.snapshotDigest,
    ...designKnowns.flatMap((item) => [item.versionRef, ...item.provenanceRefs]),
    ...designUnknowns.flatMap((item) => [item.issueRef, ...item.sourceRefs]),
    ...snapshot.relations.flatMap((item) => [item.versionRef, item.sourceContributionRef, ...item.provenance.evidenceRefs]),
    ...snapshot.temporalQualifications.flatMap((item) => [item.versionRef, item.sourceContributionRef, ...item.provenance.evidenceRefs]),
  ]);
  return deepFreeze({
    contract: STUDY_DESIGN_RUNTIME_CONTRACT,
    contractVersion: STUDY_DESIGN_RUNTIME_VERSION,
    projectId: snapshot.sourceProjectRef,
    projectVersion: snapshot.sourceProjectVersion,
    projectDigest: snapshot.sourceProjectDigest,
    projectSnapshot: clone(snapshot),
    sourceProvenanceRefs,
    designKnowns,
    designUnknowns,
    projectWriteAuthorized: false,
  }) as Readonly<StudyDesignRuntimeInput>;
};

const familyAxes = (input: {
  family: StudyDesignFamilyCode;
  comparatorKnown: boolean;
  comparatorRequired: boolean;
  interventionExplicit: boolean;
  signals: ReturnType<typeof detectStudyDesignSignals>;
}): StudyDesignAxes => {
  const inferredTemporal: StudyDesignAxes["temporalDirection"] = input.signals.prospective && input.signals.retrospective ? "AMBISPECTIVE"
    : input.signals.prospective ? "PROSPECTIVE"
      : input.signals.retrospective ? "RETROSPECTIVE" : "UNKNOWN";
  const temporalDirection: StudyDesignAxes["temporalDirection"] = input.family.startsWith("PROSPECTIVE_") ? "PROSPECTIVE"
    : input.family.startsWith("RETROSPECTIVE_") ? "RETROSPECTIVE"
      : input.family.startsWith("AMBISPECTIVE_") ? "AMBISPECTIVE"
        : input.family === "CROSS_SECTIONAL_OBSERVATIONAL" ? "CROSS_SECTIONAL"
          : inferredTemporal;
  const structuralForm: StudyDesignAxes["structuralForm"] = input.family.includes("LONGITUDINAL") || input.family.includes("PROGNOSTIC") ? "LONGITUDINAL"
    : input.family === "METHODOLOGICAL_VALIDATION" ? "METHODOLOGICAL_VALIDATION"
      : input.family.includes("CROSS_SECTIONAL") ? "CROSS_SECTIONAL"
        : input.signals.longitudinal ? "LONGITUDINAL" : "UNKNOWN";
  return {
    temporalDirection,
    interventionMode: input.family === "INTERVENTIONAL_COMPARATIVE_STUDY" && input.interventionExplicit
      ? "INTERVENTIONAL"
      : input.family === "INTERVENTIONAL_COMPARATIVE_STUDY" ? "UNKNOWN" : "OBSERVATIONAL",
    structuralForm,
    comparisonStructure: input.family === "METHODOLOGICAL_VALIDATION" ? "UNKNOWN"
      : !input.comparatorRequired ? "NONE"
        : input.comparatorKnown ? "BETWEEN_GROUPS" : "UNKNOWN",
    allocationMechanism: input.family === "INTERVENTIONAL_COMPARATIVE_STUDY" ? "UNKNOWN" : "NOT_APPLICABLE",
  };
};

type ExtendedStudyDesignReasoningSeed = Omit<LegacyStudyDesignReasoningSeed, "family"> & {
  family: "AMBISPECTIVE_LONGITUDINAL_COHORT" | "INTERVENTIONAL_COMPARATIVE_STUDY";
};

const ambispectiveSeed = (): ExtendedStudyDesignReasoningSeed => ({
  family: "AMBISPECTIVE_LONGITUDINAL_COHORT",
  label: "Cohorte longitudinale ambispective",
  whyItAnswersQuestion: "Le Project explicite à la fois des observations historiques et un suivi prospectif pour une même question longitudinale.",
  estimandPurpose: "Relier une trajectoire historique documentée à des observations futures sans assimiler les deux niveaux de contrôle des données.",
  limitations: ["La continuité des définitions, mesures et calendriers entre périodes doit être démontrée."],
  biases: ["Biais d’information historique", "Attrition prospective"],
  constraints: ["Provenance et comparabilité temporelle des deux périodes à qualifier"],
  sourceSignals: ["composantes rétrospective et prospective déclarées"],
});

const interventionalSeed = (): ExtendedStudyDesignReasoningSeed => ({
  family: "INTERVENTIONAL_COMPARATIVE_STUDY",
  label: "Étude comparative interventionnelle à préciser",
  whyItAnswersQuestion: "Le Project déclare explicitement une intervention ou une assignation ; sa structure comparative reste à qualifier par les owners compétents.",
  estimandPurpose: "Comparer des stratégies explicitement déclarées sans inférer allocation, randomisation, effectif ni modèle statistique.",
  limitations: ["Allocation, comparateur, cadre réglementaire et sécurité restent ouverts."],
  biases: ["Biais de sélection ou d’allocation à qualifier"],
  constraints: ["Revue humaine et contributions spécialisées requises avant adoption"],
  sourceSignals: ["intervention explicitement déclarée dans le Project"],
});

const informationNeed = (input: {
  proposalId: string;
  code: string;
  question: string;
  reason: string;
  targetOwner: StudyDesignInformationNeed["targetOwner"];
  path: StudyDesignInformationNeed["intendedResolutionPath"];
  sourceRefs: readonly string[];
}): StudyDesignInformationNeed => ({
  needId: `study-design-information-need:${logicalDigest({ proposal: input.proposalId, code: input.code })}`,
  question: input.question,
  reason: input.reason,
  targetOwner: input.targetOwner,
  intendedResolutionPath: input.path,
  sourceRefs: unique(input.sourceRefs),
  status: "OPEN_NOT_RESOLVED",
});

const makeHandoff = (input: {
  proposalId: string;
  optionId: string;
  targetOwner: SpecializedOwnerId;
  capabilityId: string;
  project: StudyDesignProposalContribution["sourceProject"];
  purpose: string;
  informationNeeded: readonly string[];
  provenanceRefs: readonly string[];
}): StudyDesignHandoffProposal => ({
  handoffId: `study-design-handoff-proposal:${logicalDigest({ proposal: input.proposalId, option: input.optionId, target: input.targetOwner })}`,
  sourceOwner: "STUDY_DESIGN",
  targetOwner: input.targetOwner,
  capabilityId: input.capabilityId,
  sourceProposalRef: input.proposalId,
  sourceOptionRef: input.optionId,
  sourceProjectRef: input.project.projectId,
  sourceProjectVersion: input.project.projectVersion,
  sourceProjectDigest: input.project.projectDigest,
  purpose: input.purpose,
  informationNeeded: unique(input.informationNeeded),
  provenanceRefs: unique(input.provenanceRefs),
  status: "PROPOSED_NOT_EXECUTED",
  ownershipTransferred: false,
  projectWriteAuthorized: false,
});

const proposalMaterial = (proposal: StudyDesignProposalContribution) => {
  const { proposalDigest: _proposalDigest, ...material } = proposal;
  return material;
};

export const validateStudyDesignProposal = (
  input: Readonly<StudyDesignRuntimeInput>,
  proposal: Readonly<StudyDesignProposalContribution>,
): StudyDesignValidationResult => {
  const findings: StudyDesignValidationFinding[] = [];
  const add = (code: string, path: string, message: string) => findings.push({ code, path, message });
  if (proposal.contract !== STUDY_DESIGN_PROPOSAL_CONTRACT
    || proposal.contractVersion !== STUDY_DESIGN_RUNTIME_VERSION
    || proposal.proposalVersion !== STUDY_DESIGN_RUNTIME_VERSION) {
    add("PROPOSAL_CONTRACT_INVALID", "proposal.contract", "The proposal contract and component version must match the qualified Study Design runtime.");
  }
  if (!snapshotIsValid(input.projectSnapshot)
    || input.projectId !== input.projectSnapshot.sourceProjectRef
    || input.projectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    add("SOURCE_PROJECT_IDENTITY_INVALID", "input.projectSnapshot", "The runtime input is not bound to the exact canonical Project snapshot.");
  }
  if (proposal.owner !== "STUDY_DESIGN" || proposal.capabilityId !== "STUDY_DESIGN_COHERENCE") add("OWNER_INVALID", "proposal.owner", "Study Design must own this contribution.");
  if (proposal.sourceProject.projectId !== input.projectId
    || proposal.sourceProject.projectVersion !== input.projectVersion
    || proposal.sourceProject.projectDigest !== input.projectDigest
    || proposal.sourceProject.snapshotDigest !== input.projectSnapshot.snapshotDigest) {
    add("SOURCE_PROJECT_MISMATCH", "proposal.sourceProject", "Proposal source identity does not match the consumed Project snapshot.");
  }
  if (proposal.projectWriteAuthorized !== false
    || proposal.projectOwnershipTransferred !== false
    || proposal.candidateIsAdopted !== false
    || proposal.selectedOptionId !== null
    || proposal.humanDecisionRequired !== true) {
    add("PROJECT_OR_ADOPTION_BOUNDARY_INVALID", "proposal", "The runtime cannot write Project, transfer ownership or select/adopt an option.");
  }
  if (proposal.options.length > 3) add("TOO_MANY_OPTIONS", "proposal.options", "Study Design may emit at most three options.");
  if (proposal.proposalStatus === "INSUFFICIENT_CONTEXT" && proposal.options.length !== 0) add("INSUFFICIENT_CONTEXT_WITH_OPTIONS", "proposal.options", "Insufficient context must not produce speculative options.");
  if (proposal.proposalStatus === "INSUFFICIENT_CONTEXT" && proposal.informationNeeds.length === 0) add("INSUFFICIENT_CONTEXT_WITHOUT_INFORMATION_NEED", "proposal.informationNeeds", "Insufficient context must produce a structured information need.");
  if (proposal.proposalStatus === "PROPOSED_NON_ADOPTED" && proposal.options.length === 0) add("PROPOSAL_WITHOUT_OPTIONS", "proposal.options", "A proposal status requires at least one option.");
  if ((proposal.proposalStatus === "INSUFFICIENT_CONTEXT") !== (proposal.epistemicStatus === "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED")) {
    add("PROPOSAL_EPISTEMIC_STATUS_INCONSISTENT", "proposal.epistemicStatus", "Proposal and epistemic statuses must preserve the same sufficiency boundary.");
  }
  const optionIds = proposal.options.map((option) => option.optionId);
  const familyCodes = proposal.options.map((option) => option.family.code);
  if (new Set(optionIds).size !== optionIds.length || new Set(familyCodes).size !== familyCodes.length) add("DUPLICATE_OPTION", "proposal.options", "Option identities and bounded family identities must be unique.");
  const sourceRefs = new Set(input.sourceProvenanceRefs);
  for (const [index, option] of proposal.options.entries()) {
    if (!SUPPORTED_FAMILIES.has(option.family.code)
      || option.family.namespace !== "NOXIA_STUDY_DESIGN_FAMILY"
      || option.family.vocabularyVersion !== STUDY_DESIGN_RUNTIME_VERSION
      || option.family.vocabularyScope !== "BOUNDED_EXTENSIBLE_NON_EXHAUSTIVE") {
      add("UNSUPPORTED_DESIGN_FAMILY", `proposal.options[${index}].family`, "The bounded runtime cannot emit an unregistered or falsely exhaustive design family.");
    }
    if (option.projectWriteAuthorized !== false || option.adoptionStatus !== "PROPOSED_NOT_ADOPTED") add("OPTION_BOUNDARY_INVALID", `proposal.options[${index}]`, "An option cannot write or adopt Project state.");
    if (!option.conciseDescription.trim() || !option.rationale.statement.trim() || !option.rationale.evidenceRefs.length || option.rationale.evidenceRefs.some((ref) => !sourceRefs.has(ref))) {
      add("RATIONALE_NOT_PROJECT_EVIDENCE_LINKED", `proposal.options[${index}].rationale`, "Every rationale must cite provenance from the exact runtime input.");
    }
    if (!option.provenanceRefs.length || option.provenanceRefs.some((ref) => !sourceRefs.has(ref)) || option.epistemicStatus !== "SUPPORTED_CANDIDATE_NOT_ADOPTED") {
      add("OPTION_PROVENANCE_INVALID", `proposal.options[${index}].provenanceRefs`, "Every option must preserve Project provenance and an explicit non-adopted epistemic status.");
    }
  }
  const handoffIds = new Set(proposal.downstreamHandoffs.map((handoff) => handoff.handoffId));
  if (handoffIds.size !== proposal.downstreamHandoffs.length) add("DUPLICATE_HANDOFF_ID", "proposal.downstreamHandoffs", "Downstream handoff identities must be unique.");
  const capabilityById = new Map<string, { owner: SpecializedOwnerId }>(
    listSpecializedOwnerCapabilities().entries.map((entry) => [entry.capabilityId, entry]),
  );
  for (const [index, handoff] of proposal.downstreamHandoffs.entries()) {
    const capability = capabilityById.get(handoff.capabilityId);
    if (!capability
      || capability.owner !== handoff.targetOwner
      || handoff.sourceOwner !== "STUDY_DESIGN"
      || handoff.sourceProposalRef !== proposal.proposalId
      || (handoff.sourceOptionRef !== null && !optionIds.includes(handoff.sourceOptionRef))
      || handoff.sourceProjectRef !== input.projectId
      || handoff.sourceProjectVersion !== input.projectVersion
      || handoff.sourceProjectDigest !== input.projectDigest
      || handoff.projectWriteAuthorized !== false
      || handoff.ownershipTransferred !== false
      || handoff.status !== "PROPOSED_NOT_EXECUTED") {
      add("HANDOFF_INVALID", `proposal.downstreamHandoffs[${index}]`, "Handoff owner, source identity or write boundary is invalid.");
    }
  }
  if (proposal.options.some((option) => option.downstreamHandoffRefs.some((ref) => !handoffIds.has(ref)))) add("OPTION_HANDOFF_REF_INVALID", "proposal.options", "An option references a missing handoff.");
  const referencedHandoffs = proposal.options.flatMap((option) => option.downstreamHandoffRefs);
  if (proposal.downstreamHandoffs.some((handoff) => referencedHandoffs.filter((ref) => ref === handoff.handoffId).length !== 1)) {
    add("HANDOFF_OPTION_LINK_INVALID", "proposal.downstreamHandoffs", "Every handoff must be referenced by exactly one source option.");
  }
  const validOptionIds = new Set(optionIds);
  if (proposal.tradeOffs.some((tradeOff) => tradeOff.optionRefs.length < 2 || tradeOff.optionRefs.some((ref) => !validOptionIds.has(ref)))) {
    add("TRADEOFF_OPTION_REF_INVALID", "proposal.tradeOffs", "Trade-offs must compare at least two emitted options.");
  }
  if (!proposal.provenanceRefs.length || proposal.provenanceRefs.some((ref) => !sourceRefs.has(ref))) add("PROVENANCE_INVALID", "proposal.provenanceRefs", "Proposal provenance must remain within the consumed input provenance.");
  if (!proposal.epistemicStatus) add("EPISTEMIC_STATUS_REQUIRED", "proposal.epistemicStatus", "Epistemic status is mandatory.");
  if (proposal.validation.status !== "PASS" || proposal.validation.findings.length !== 0) add("DECLARED_VALIDATION_INVALID", "proposal.validation", "A returned proposal must carry its deterministic PASS result.");
  if (logicalDigest(proposalMaterial(proposal)) !== proposal.proposalDigest) add("PROPOSAL_DIGEST_INVALID", "proposal.proposalDigest", "Proposal digest does not match its canonical material.");
  return { status: findings.length ? "BLOCKED" : "PASS", findings };
};

export const assertValidStudyDesignProposal = (
  input: Readonly<StudyDesignRuntimeInput>,
  proposal: Readonly<StudyDesignProposalContribution>,
) => {
  const validation = validateStudyDesignProposal(input, proposal);
  if (validation.status === "BLOCKED") throw new Error(`STUDY_DESIGN_PROPOSAL_INVALID:${validation.findings.map((finding) => finding.code).join(",")}`);
  return proposal;
};

export type StudyDesignDownstreamNeed = {
  contract: "STUDY_DESIGN_DOWNSTREAM_NEED";
  contractVersion: typeof STUDY_DESIGN_RUNTIME_VERSION;
  sourceProposalRef: string;
  sourceOptionRef: string | null;
  informationNeeded: readonly string[];
  provenanceRefs: readonly string[];
  projectWriteAuthorized: false;
};

/**
 * Adapts RDE-owned need declarations to the existing specialized-owner
 * handoff contract. Requests are built but never executed by RDE-01.
 */
export const buildStudyDesignDownstreamHandoffRequests = (
  input: Readonly<StudyDesignRuntimeInput>,
  proposal: Readonly<StudyDesignProposalContribution>,
): readonly Readonly<SpecializedOwnerHandoffRequest<StudyDesignDownstreamNeed>>[] => {
  assertValidStudyDesignProposal(input, proposal);
  return proposal.downstreamHandoffs.map((handoff) => createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId: handoff.handoffId,
    owner: handoff.targetOwner,
    capabilityId: handoff.capabilityId,
    purpose: handoff.purpose,
    sourceProject: input.projectSnapshot,
    nativeInputType: "StudyDesignDownstreamNeed",
    nativeInputVersion: STUDY_DESIGN_RUNTIME_VERSION,
    nativeInput: {
      contract: "STUDY_DESIGN_DOWNSTREAM_NEED",
      contractVersion: STUDY_DESIGN_RUNTIME_VERSION,
      sourceProposalRef: handoff.sourceProposalRef,
      sourceOptionRef: handoff.sourceOptionRef,
      informationNeeded: [...handoff.informationNeeded],
      provenanceRefs: [...handoff.provenanceRefs],
      projectWriteAuthorized: false,
    },
  }));
};

export const executeStudyDesignRuntime = (
  input: Readonly<StudyDesignRuntimeInput>,
  traceSink?: StudyDesignTraceSink,
): Readonly<StudyDesignProposalContribution> => {
  if (input.contract !== STUDY_DESIGN_RUNTIME_CONTRACT || input.contractVersion !== STUDY_DESIGN_RUNTIME_VERSION || input.projectWriteAuthorized !== false) {
    throw new Error("STUDY_DESIGN_INPUT_CONTRACT_INVALID");
  }
  if (!snapshotIsValid(input.projectSnapshot)
    || input.projectId !== input.projectSnapshot.sourceProjectRef
    || input.projectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("STUDY_DESIGN_SOURCE_PROJECT_IDENTITY_INVALID");
  }
  traceSink?.({ event: "INVOCATION_REQUESTED", owner: "STUDY_DESIGN", capabilityId: "STUDY_DESIGN_COHERENCE", projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, proposalId: null, optionCount: null, handoffRefs: [] });
  traceSink?.({ event: "PROJECT_VERSION_CONSUMED", owner: "STUDY_DESIGN", capabilityId: "STUDY_DESIGN_COHERENCE", projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, proposalId: null, optionCount: null, handoffRefs: [] });

  const proposalId = `study-design-proposal:${logicalDigest({
    projectId: input.projectId,
    projectVersion: input.projectVersion,
    projectDigest: input.projectDigest,
    snapshotDigest: input.projectSnapshot.snapshotDigest,
    runtimeVersion: STUDY_DESIGN_RUNTIME_VERSION,
  })}`;
  const normalizedText = normalizeScientificText(input.designKnowns.map((item) => `${item.scientificRole ?? ""} ${item.content}`).join(" ")).toLocaleLowerCase("fr-FR");
  const availableData = input.designKnowns.some((item) => /données? (existantes?|historiques?)|base existante|déjà acquises?/i.test(item.content));
  const signals = detectStudyDesignSignals(normalizedText, availableData);
  const question = input.designKnowns.find((item) => item.type === "SCIENTIFIC_QUESTION");
  const explicitDesign = input.designKnowns.some((item) => item.type === "STUDY_DESIGN");
  const crossSectional = /transversal|prévalence|descripti|mesure unique/.test(normalizedText);
  const hasDiscriminatingSignal = explicitDesign || crossSectional || signals.validation || signals.prognostic || signals.longitudinal || signals.retrospective || signals.prospective || signals.comparative || signals.interventionExplicit;
  const sufficient = Boolean(question && hasDiscriminatingSignal);
  const comparatorKnown = input.designKnowns.some((item) => item.type === "GROUP"
    && (/COMPARATOR|CONTROL|REFERENCE/i.test(item.scientificRole ?? "") || /comparateur|t[ée]moin|contr[ôo]le/i.test(item.content)))
    || input.projectSnapshot.relations.some((relation) => /COMPARE|COMPARATOR|CONTROL/i.test(relation.type));
  const interventionExplicit = signals.interventionExplicit || input.designKnowns.some((item) => item.type === "INTERVENTION_OR_EXPOSURE" && /INTERVENTION|TREATMENT|ASSIGN/i.test(item.scientificRole ?? ""));
  const evidenceRefs = unique([
    ...(question?.provenanceRefs ?? []),
    ...input.designKnowns.filter((item) => item.type === "STUDY_DESIGN" || item.type === "OBJECTIVE" || item.type === "HYPOTHESIS" || item.type === "GROUP" || item.type === "INTERVENTION_OR_EXPOSURE" || item.type === "VISIT").flatMap((item) => [item.versionRef, ...item.provenanceRefs]),
  ]);
  const fallbackEvidenceRefs = evidenceRefs.length ? evidenceRefs : input.sourceProvenanceRefs.slice(0, 1);

  let seeds: Array<LegacyStudyDesignReasoningSeed | ReturnType<typeof ambispectiveSeed> | ReturnType<typeof interventionalSeed>> = [];
  if (sufficient) {
    seeds = buildLegacyStudyDesignReasoningSeeds({ text: normalizedText, hasAvailableData: availableData });
    if (!signals.prospective) {
      seeds = seeds.filter((seed) => !seed.family.startsWith("PROSPECTIVE_"));
    }
    if (!crossSectional) {
      seeds = seeds.filter((seed) => seed.family !== "CROSS_SECTIONAL_OBSERVATIONAL");
    }
    if (!signals.longitudinal && !signals.prognostic) {
      seeds = seeds.filter((seed) => seed.family !== "RETROSPECTIVE_LONGITUDINAL_COHORT");
    }
    if (signals.prospective && signals.retrospective && signals.longitudinal) {
      seeds = [
        ...seeds.filter((seed) => seed.family === "PROSPECTIVE_LONGITUDINAL_COHORT" || seed.family === "RETROSPECTIVE_LONGITUDINAL_COHORT"),
        ambispectiveSeed(),
      ];
    }
    if (interventionExplicit) {
      seeds = [interventionalSeed(), ...seeds.filter((seed) => seed.family !== "COMPARATIVE_OBSERVATIONAL")];
    }
    seeds = [...new Map(seeds.map((seed) => [seed.family, seed])).values()].slice(0, 3);
  }

  const sourceProject = {
    projectId: input.projectId,
    projectVersion: input.projectVersion,
    projectDigest: input.projectDigest,
    snapshotDigest: input.projectSnapshot.snapshotDigest,
  };
  const handoffs: StudyDesignHandoffProposal[] = [];
  const options: StudyDesignOption[] = seeds.map((seed) => {
    const family = seed.family as StudyDesignFamilyCode;
    const optionId = `study-design-option:${logicalDigest({ proposalId, family })}`;
    const comparatorRequired = family.includes("COMPARATIVE") || family === "METHODOLOGICAL_VALIDATION";
    const optionHandoffs = [
      makeHandoff({ proposalId, optionId, targetOwner: "BIOSTATISTICS", capabilityId: "BIOSTATISTICS_PLANNING", project: sourceProject, purpose: "Qualifier les conséquences analytiques sans choisir de modèle ni produire de dimensionnement.", informationNeeded: ["Objectif analytique", "estimand à qualifier", "incertitudes de comparaison"], provenanceRefs: fallbackEvidenceRefs }),
      ...(input.designKnowns.some((item) => item.type === "ENDPOINT" || item.type === "CANONICAL_VARIABLE") ? [makeHandoff({ proposalId, optionId, targetOwner: "OBSERVABILITY_MEASUREMENT", capabilityId: "OBSERVABILITY_QUALIFICATION", project: sourceProject, purpose: "Qualifier la chaîne phénomène-mesure et les limites de mesure.", informationNeeded: ["ObservableProperties", "MeasurementDefinitions", "limites de validité"], provenanceRefs: fallbackEvidenceRefs })] : []),
      ...(input.designKnowns.some((item) => item.type === "IMAGING_MODALITY" || item.type === "ACQUISITION") ? [makeHandoff({ proposalId, optionId, targetOwner: "IMAGING", capabilityId: "IMAGING_STUDY_DESIGN", project: sourceProject, purpose: "Qualifier la stratégie d’imagerie dans son ownership spécialisé.", informationNeeded: ["faisabilité conceptuelle", "qualité", "limites d’acquisition"], provenanceRefs: fallbackEvidenceRefs })] : []),
      ...(family === "INTERVENTIONAL_COMPARATIVE_STUDY" ? [makeHandoff({ proposalId, optionId, targetOwner: "REGULATORY_RESOLUTION", capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION", project: sourceProject, purpose: "Qualifier les exigences réglementaires sans produire d’autorisation ni de classification implicite.", informationNeeded: ["juridiction", "nature de l’intervention", "usage prévu"], provenanceRefs: fallbackEvidenceRefs })] : []),
      ...(/RETROSPECTIVE|AMBISPECTIVE/.test(family) ? [
        makeHandoff({ proposalId, optionId, targetOwner: "STUDY_DATA_CDM", capabilityId: "STUDY_DATA_PLANNING", project: sourceProject, purpose: "Qualifier l’identité, la provenance et la disponibilité des données historiques.", informationNeeded: ["sources de données", "couverture temporelle", "identifiants et provenance"], provenanceRefs: fallbackEvidenceRefs }),
        makeHandoff({ proposalId, optionId, targetOwner: "DATA_MANAGEMENT", capabilityId: "DATA_MANAGEMENT_PLANNING", project: sourceProject, purpose: "Qualifier la qualité et le raccordement opérationnel des données historiques et prospectives.", informationNeeded: ["qualité des données", "raccordement temporel", "flux de données"], provenanceRefs: fallbackEvidenceRefs }),
      ] : []),
    ];
    handoffs.push(...optionHandoffs);
    const unresolvedQuestions = unique([
      ...(comparatorRequired && !comparatorKnown ? ["Le comparateur ou la structure de comparaison reste à définir."] : []),
      ...(family === "INTERVENTIONAL_COMPARATIVE_STUDY" ? ["Le mécanisme d’allocation reste inconnu."] : []),
      ...input.designUnknowns.map((item) => item.reason),
    ]);
    return {
      optionId,
      family: { namespace: "NOXIA_STUDY_DESIGN_FAMILY", code: family, vocabularyVersion: "1.0.0", vocabularyScope: "BOUNDED_EXTENSIBLE_NON_EXHAUSTIVE" },
      label: seed.label,
      conciseDescription: seed.estimandPurpose,
      axes: familyAxes({ family, comparatorKnown, comparatorRequired, interventionExplicit, signals }),
      rationale: {
        statement: seed.whyItAnswersQuestion,
        evidenceRefs: fallbackEvidenceRefs,
        epistemicStatus: unresolvedQuestions.length ? "PROJECT_GROUNDED_WITH_UNKNOWNS" : "PROJECT_GROUNDED_PROPOSAL",
      },
      advantages: [seed.estimandPurpose],
      limitations: unique([...seed.limitations, ...seed.biases]),
      prerequisites: unique(seed.constraints),
      consequences: unique([
        "Une revue humaine est requise avant toute adoption dans le Research Project.",
        "Les décisions de mesure, d’analyse, d’effectif et d’exécution restent chez leurs owners spécialisés.",
      ]),
      unresolvedQuestions,
      downstreamHandoffRefs: optionHandoffs.map((handoff) => handoff.handoffId),
      provenanceRefs: fallbackEvidenceRefs,
      epistemicStatus: "SUPPORTED_CANDIDATE_NOT_ADOPTED",
      projectWriteAuthorized: false,
      adoptionStatus: "PROPOSED_NOT_ADOPTED",
    };
  });

  const informationNeeds: StudyDesignInformationNeed[] = [
    ...(!question ? [informationNeed({ proposalId, code: "SCIENTIFIC_QUESTION_REQUIRED", question: "Quelle question scientifique confirmée la stratégie doit-elle instruire ?", reason: "Une stratégie d’étude ne peut être proposée sans question scientifique explicite.", targetOwner: "RESEARCH_PROJECT", path: "FUTURE_QRY_HANDOFF", sourceRefs: input.sourceProvenanceRefs })] : []),
    ...(question && options.length === 0 ? [informationNeed({ proposalId, code: "DESIGN_SIGNAL_REQUIRED", question: "Quelle temporalité, structure de comparaison ou finalité méthodologique est attendue ?", reason: "Le Project ne contient pas assez de contraintes compatibles pour distinguer honnêtement une famille de design.", targetOwner: "RESEARCH_PROJECT", path: "FUTURE_QRY_HANDOFF", sourceRefs: question.provenanceRefs })] : []),
    ...(signals.comparative && !comparatorKnown ? [informationNeed({ proposalId, code: "COMPARATOR_REQUIRED", question: "Quel comparateur ou quelle structure de comparaison est scientifiquement justifié ?", reason: "L’intention comparative est présente mais le comparateur reste inconnu.", targetOwner: "RESEARCH_PROJECT", path: "FUTURE_QRY_HANDOFF", sourceRefs: fallbackEvidenceRefs })] : []),
    ...input.designUnknowns.map((unknown) => informationNeed({ proposalId, code: unknown.issueRef, question: unknown.reason, reason: `Inconnue Project conservée (${unknown.kind}).`, targetOwner: "RESEARCH_PROJECT", path: "HUMAN_REVIEW", sourceRefs: unknown.sourceRefs })),
  ];
  const tradeOffs = options.length > 1 ? [{
    tradeOffId: `study-design-tradeoff:${logicalDigest({ proposalId, options: options.map((option) => option.optionId) })}`,
    optionRefs: options.map((option) => option.optionId),
    gains: options.map((option) => `${option.optionId}: ${option.advantages.join(" ")}`),
    losses: options.map((option) => `${option.optionId}: ${option.limitations.join(" ")}`),
    decisionRequired: true as const,
  }] : [];
  const withoutDigest = {
    contract: STUDY_DESIGN_PROPOSAL_CONTRACT,
    contractVersion: STUDY_DESIGN_RUNTIME_VERSION,
    owner: "STUDY_DESIGN" as const,
    capabilityId: "STUDY_DESIGN_COHERENCE" as const,
    proposalId,
    proposalVersion: "1.0.0" as const,
    proposalStatus: options.length ? "PROPOSED_NON_ADOPTED" as const : "INSUFFICIENT_CONTEXT" as const,
    sourceProject,
    options,
    selectedOptionId: null,
    tradeOffs,
    informationNeeds,
    unresolvedQuestions: unique([...input.designUnknowns.map((item) => item.reason), ...informationNeeds.map((item) => item.question)]),
    downstreamHandoffs: handoffs,
    limitations: unique([
      "Contribution bornée de cohérence de design ; elle ne constitue ni adoption, ni protocole, ni validation scientifique.",
      "Aucun modèle statistique, effectif, paramètre d’acquisition, endpoint final ou qualification réglementaire n’est produit.",
      ...(options.length ? [] : ["Le contexte ne permet pas de distinguer honnêtement une famille de design."]),
    ]),
    provenanceRefs: unique(input.sourceProvenanceRefs),
    epistemicStatus: options.length ? "PROPOSAL_ONLY" as const : "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED" as const,
    validation: { status: "PASS" as const, findings: [] },
    humanDecisionRequired: true as const,
    projectWriteAuthorized: false as const,
    projectOwnershipTransferred: false as const,
    candidateIsAdopted: false as const,
  };
  const proposal = deepFreeze({ ...withoutDigest, proposalDigest: logicalDigest(withoutDigest) }) as Readonly<StudyDesignProposalContribution>;
  const validation = validateStudyDesignProposal(input, proposal);
  if (validation.status === "BLOCKED") {
    traceSink?.({ event: "PROPOSAL_BLOCKED", owner: "STUDY_DESIGN", capabilityId: "STUDY_DESIGN_COHERENCE", projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, proposalId, optionCount: options.length, handoffRefs: handoffs.map((handoff) => handoff.handoffId) });
    throw new Error(`STUDY_DESIGN_PROPOSAL_INVALID:${validation.findings.map((finding) => finding.code).join(",")}`);
  }
  traceSink?.({ event: "PROPOSAL_PRODUCED", owner: "STUDY_DESIGN", capabilityId: "STUDY_DESIGN_COHERENCE", projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, proposalId, optionCount: options.length, handoffRefs: handoffs.map((handoff) => handoff.handoffId) });
  traceSink?.({ event: "OPTION_COUNT_RECORDED", owner: "STUDY_DESIGN", capabilityId: "STUDY_DESIGN_COHERENCE", projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, proposalId, optionCount: options.length, handoffRefs: [] });
  traceSink?.({ event: "HANDOFFS_PROPOSED", owner: "STUDY_DESIGN", capabilityId: "STUDY_DESIGN_COHERENCE", projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, proposalId, optionCount: null, handoffRefs: handoffs.map((handoff) => handoff.handoffId) });
  return proposal;
};

export const studyDesignScientificOutputIsStable = (left: Readonly<StudyDesignProposalContribution>, right: Readonly<StudyDesignProposalContribution>) => stableStringify(left) === stableStringify(right);
