import type { DocumentaryPattern } from "@/features/documentary-knowledge/types";
import type { RequirementResolution } from "@/features/regulatory-resolution/types";
import { containsTemplateToken, stableTemplateStringify, templateDigest, uniqueSorted } from "./canonical.ts";
import { CLINICAL_STUDY_TEMPLATE, STUDY_FAMILY_DEFINITIONS } from "./definitions.ts";
import type {
  FamilyResolutionStatus,
  StudyFamilyDefinition,
  StudyFamilyProfile,
  StudyTemplateCompositionInput,
  StudyTemplateInstance,
  TemplateBlockStatus,
  TemplateCondition,
  TemplateConflict,
  TemplateDocumentMapping,
  TemplateHumanDecision,
  TemplateMissingInformation,
  TemplateNodeDefinition,
  TemplateNodeInstance,
  TemplatePatternMapping,
  TemplateReadinessStatus,
  TemplateRequirementMapping,
  TemplateSupport,
} from "./types.ts";
import { STUDY_TEMPLATE_ENGINE_VERSION, STUDY_TEMPLATE_SCHEMA_VERSION } from "./types.ts";

type RequirementEvidence = {
  requirementId: string;
  status: string;
  text: string[];
  reason: string;
  sourceRefs: string[];
  conditions: string[];
};

const blockLike = (node: TemplateNodeDefinition) => ["BLOCK", "TABLE", "ANNEX", "WORKFLOW", "DECISION", "CONDITIONAL_BLOCK", "OPTIONAL_BLOCK", "REQUIRED_BLOCK", "FUTURE_BLOCK"].includes(node.kind);

const applicableProjectObjects = (input: StudyTemplateCompositionInput) => input.researchProject.objects.filter((object) =>
  object.actuality === "CURRENT"
  && object.adoptionState === "ADOPTED"
  && object.epistemicState !== "UNKNOWN"
  && object.epistemicState !== "WITHHELD");

const directProjectSupport = (node: TemplateNodeDefinition, input: StudyTemplateCompositionInput): TemplateSupport[] => {
  const project = input.researchProject;
  const currentObjects = applicableProjectObjects(input);
  const canonicalRefs = (...types: string[]) => currentObjects
    .filter((candidate) => types.includes(candidate.type))
    .map((candidate) => candidate.versionRef);
  const biospecimenRefs = currentObjects
    .filter((candidate) => candidate.scientificRole === "SAMPLE_COLLECTION")
    .map((candidate) => candidate.versionRef);
  const issueRefs = (kind: StudyTemplateCompositionInput["researchProject"]["issues"][number]["kind"]) => project.issues
    .filter((issue) => issue.kind === kind)
    .map((issue) => issue.issueRef);
  const supports: TemplateSupport[] = [];
  const add = (selector: string, sourceRefs: string[], reason: string, supportLevel: TemplateSupport["supportLevel"] = "DIRECT") => supports.push({
    supportId: `TMP-SUPPORT:${templateDigest([node.nodeId, selector, sourceRefs]).slice(5, 17).toUpperCase()}`,
    kind: "PROJECT_SUPPORT",
    sourceRefs: uniqueSorted(sourceRefs),
    supportLevel,
    reason,
    provenance: uniqueSorted([project.projectId, project.projectVersion, project.projectDigest, project.sourceSnapshotDigest, ...sourceRefs]),
  });

  for (const selector of node.projectSelectors) {
    if (selector === "PROJECT_ID") add(selector, [project.projectId, project.projectVersion, project.projectDigest], "L’identité et la version du Research Project sont présentes.");
    else if (selector === "SCIENTIFIC_QUESTION" && canonicalRefs("SCIENTIFIC_QUESTION").length) add(selector, canonicalRefs("SCIENTIFIC_QUESTION"), "La question scientifique gouvernée est présente.");
    else if (selector === "OBJECTIVES" && canonicalRefs("OBJECTIVE").length) add(selector, canonicalRefs("OBJECTIVE"), "Des objectifs structurés existent dans le Research Project.");
    else if (selector === "HYPOTHESES" && canonicalRefs("HYPOTHESIS").length) add(selector, canonicalRefs("HYPOTHESIS"), "Des hypothèses structurées existent dans le Research Project.");
    else if (selector === "POPULATION" && canonicalRefs("POPULATION", "CONDITION", "ELIGIBILITY_CRITERION").length) add(selector, canonicalRefs("POPULATION", "CONDITION", "ELIGIBILITY_CRITERION"), "La structure de population du Research Project est présente.");
    else if (selector === "STUDY_DESIGN" && canonicalRefs("STUDY_DESIGN").length) add(selector, canonicalRefs("STUDY_DESIGN"), "Des plans d’étude structurés sont présents.");
    else if (selector === "ENDPOINTS" && canonicalRefs("ENDPOINT", "CANONICAL_VARIABLE", "DATA_NEED").length) add(selector, canonicalRefs("ENDPOINT", "CANONICAL_VARIABLE", "DATA_NEED"), "Des critères, variables ou besoins de données structurés sont présents.");
    else if (selector === "BIOSPECIMENS" && biospecimenRefs.length) add(selector, uniqueSorted(biospecimenRefs), "Des prélèvements ou collections de matériau sont explicitement présents dans le Research Project.");
    else if (selector === "IMAGING" && project.imagingApplicability === "APPLICABLE") add(selector, canonicalRefs("IMAGING_MODALITY", "ACQUISITION"), "La contribution Imaging est explicitement applicable.");
    else if (selector === "IMAGING" && project.imagingApplicability === "NOT_APPLICABLE") add(selector, [project.projectId], "La contribution Imaging est explicitement non applicable.", "EXCLUSION");
    else if (selector === "UNKNOWNS") add(selector, [project.projectVersion, ...issueRefs("UNKNOWN"), ...issueRefs("WITHHELD"), ...issueRefs("AMBIGUITY")], "Le registre d’inconnues du Research Project reste une source, y compris lorsqu’il est vide.", issueRefs("UNKNOWN").length || issueRefs("WITHHELD").length || issueRefs("AMBIGUITY").length ? "UNKNOWN" : "DIRECT");
    else if (selector === "LIMITATIONS") add(selector, [project.projectVersion, ...issueRefs("LIMITATION")], "Le registre de limitations du Research Project reste visible.");
    else if (selector === "CONTRADICTIONS") add(selector, [project.projectVersion, ...issueRefs("CONTRADICTION")], "Le registre de contradictions du Research Project reste visible.", issueRefs("CONTRADICTION").length ? "UNKNOWN" : "DIRECT");
    else if (selector === "HUMAN_DECISIONS") add(selector, [project.projectVersion, ...project.humanDecisions.map((decision) => `${decision.decisionId}@${decision.version}`)], "Le registre de décisions humaines est référencé sans reconstruction.");
    else if (selector === "DEPENDENCIES") add(selector, project.relations.filter((relation) => relation.actuality === "CURRENT" && relation.adoptionState === "ADOPTED").map((item) => item.versionRef), "Les dépendances structurées du Research Project sont présentes.", project.relations.length ? "DIRECT" : "UNKNOWN");
    else if (selector === "PROVENANCE") add(selector, project.provenanceRefs, "La provenance PRJ est référencée en lecture seule.");
    else if (selector === "READINESS") add(selector, [project.projectVersion, `PRJ-LIFECYCLE:${project.lifecycle}`], "Le cycle de vie Project est conservé séparément de la readiness TMP.");
    else if (selector === "REG_REQUIREMENTS") supports.push({
      supportId: `TMP-SUPPORT:${templateDigest([node.nodeId, input.applicableRequirementSet.resolutionId]).slice(5, 17).toUpperCase()}`,
      kind: "REGULATORY_SUPPORT",
      sourceRefs: [input.applicableRequirementSet.resolutionId],
      supportLevel: input.applicableRequirementSet.unresolvedRequirements.length ? "UNKNOWN" : "DIRECT",
      reason: "Le registre des exigences provient du résultat REG-001, sans requalification TMP.",
      provenance: [input.applicableRequirementSet.resolutionId, input.applicableRequirementSet.corpusDigest],
    });
    else if (selector === "HUMAN_REVIEW" && input.humanDecisions?.some((decision) => decision.targetNodeIds.includes(node.nodeId))) add(selector, input.humanDecisions.map((decision) => decision.decisionId), "Une décision humaine TMP cible explicitement ce bloc.");
    else if (selector === "SPECIALIZED_DEPENDENCY" || selector.startsWith("SPECIALTY:")) {
      const specialty = selector.startsWith("SPECIALTY:") ? selector.slice("SPECIALTY:".length).toLocaleUpperCase("en-US") : null;
      const responsibilities = project.specializedResponsibilities.filter((responsibility) => !specialty || responsibility.owner.toLocaleUpperCase("en-US").includes(specialty));
      supports.push({
        supportId: `TMP-SUPPORT:${templateDigest([node.nodeId, selector, responsibilities]).slice(5, 17).toUpperCase()}`,
        kind: "DEPENDENCY_SUPPORT",
        sourceRefs: uniqueSorted([selector, ...responsibilities.flatMap((responsibility) => responsibility.sourceRefs)]),
        supportLevel: "FUTURE_DEPENDENCY",
        reason: responsibilities.length
          ? "Le bloc reste visible comme dépendance spécialisée future déclarée par le Project ; TMP-001 ne simule pas le moteur propriétaire."
          : "Le bloc reste visible comme dépendance spécialisée future ; TMP-001 ne simule pas le moteur absent.",
        provenance: uniqueSorted([project.projectId, project.projectVersion, "TMP-001:future-consumer-boundary", ...responsibilities.flatMap((responsibility) => responsibility.sourceRefs)]),
      });
    }
  }

  if (node.nodeId === "TMP-REF:RESEARCH_PROJECT") add("SOURCE_REFERENCE", [project.projectId, project.projectVersion, project.projectDigest, project.sourceSnapshotDigest], "Référence explicite vers le Research Project.");
  if (node.nodeId === "TMP-REF:REG-001") supports.push({
    supportId: `TMP-SUPPORT:${templateDigest([node.nodeId, input.applicableRequirementSet.resolutionId]).slice(5, 17).toUpperCase()}`,
    kind: "REGULATORY_SUPPORT",
    sourceRefs: [input.applicableRequirementSet.resolutionId, input.applicableRequirementSet.corpusDigest],
    supportLevel: "DIRECT",
    reason: "Référence explicite vers le résultat REG-001.",
    provenance: [input.applicableRequirementSet.resolutionId],
  });
  if (node.nodeId === "TMP-REF:DOC-002") supports.push({
    supportId: `TMP-SUPPORT:${templateDigest([node.nodeId, input.documentaryPatternGraph.catalogId]).slice(5, 17).toUpperCase()}`,
    kind: "DOCUMENTARY_SUPPORT",
    sourceRefs: [input.documentaryPatternGraph.catalogId, input.documentaryPatternGraph.digest],
    supportLevel: "REFERENCE_ONLY",
    reason: "Référence explicite vers le catalogue DOC-002 ; elle ne crée jamais d’obligation.",
    provenance: [input.documentaryPatternGraph.catalogId],
  });
  return supports;
};

const requirementEvidence = (input: StudyTemplateCompositionInput): RequirementEvidence[] => {
  const result = input.applicableRequirementSet;
  const byId = new Map<string, RequirementEvidence>();
  const addRequirement = (requirement: RequirementResolution) => byId.set(requirement.requirementId, {
    requirementId: requirement.requirementId,
    status: requirement.status,
    text: [requirement.requirementId, requirement.title, requirement.reason, ...requirement.conditions],
    reason: requirement.reason,
    sourceRefs: uniqueSorted([requirement.requirementId, ...requirement.sourceIds, ...requirement.provenance]),
    conditions: [...requirement.conditions],
  });
  [...result.applicableRequirements, ...result.potentiallyApplicableRequirements, ...result.notApplicableRequirements, ...result.unresolvedRequirements]
    .forEach(addRequirement);
  result.documentRequirements.forEach((document) => {
    const existing = byId.get(document.requirementId);
    const evidence: RequirementEvidence = {
      requirementId: document.requirementId,
      status: document.status,
      text: [document.requirementId, document.documentId, document.reason, ...document.sections, ...document.fields, ...document.annexes],
      reason: document.reason,
      sourceRefs: uniqueSorted([document.requirementId, document.documentRequirementId ?? "", ...document.sourceIds, ...document.provenance].filter(Boolean)),
      conditions: [...document.conditions],
    };
    byId.set(document.requirementId, existing ? {
      ...evidence,
      text: uniqueSorted([...existing.text, ...evidence.text]),
      sourceRefs: uniqueSorted([...existing.sourceRefs, ...evidence.sourceRefs]),
      conditions: uniqueSorted([...existing.conditions, ...evidence.conditions]),
    } : evidence);
  });
  result.fundingRequirements.forEach((funding) => byId.set(funding.requirementId, {
    requirementId: funding.requirementId,
    status: funding.status,
    text: [funding.requirementId, funding.programId ?? "", funding.editionId ?? "", ...funding.documents, ...funding.sections, ...funding.fields, ...funding.annexes],
    reason: `Exigence de financement ${funding.programId ?? "non qualifiée"}.`,
    sourceRefs: uniqueSorted([funding.requirementId, ...funding.sourceIds, ...funding.provenance]),
    conditions: [],
  }));
  return [...byId.values()].sort((left, right) => left.requirementId.localeCompare(right.requirementId));
};

const requirementMappings = (nodes: readonly TemplateNodeDefinition[], evidence: readonly RequirementEvidence[]): TemplateRequirementMapping[] => evidence.map((requirement) => {
  const matched = nodes.filter((node) => node.requirementTokens.length && containsTemplateToken(requirement.text, node.requirementTokens)).map((node) => node.nodeId);
  return {
    requirementId: requirement.requirementId,
    status: requirement.status,
    nodeIds: uniqueSorted(matched.length ? matched : ["TMP-NODE:REQUIREMENT_REGISTER"]),
    reason: requirement.reason,
    sourceRefs: requirement.sourceRefs,
  };
});

const patternMappings = (nodes: readonly TemplateNodeDefinition[], patterns: readonly DocumentaryPattern[]): TemplatePatternMapping[] => patterns.map((pattern) => ({
  patternId: pattern.patternId,
  patternStatus: pattern.status,
  nodeIds: uniqueSorted(nodes.filter((node) => node.patternCategories.includes(pattern.category)).map((node) => node.nodeId)),
  reason: `Correspondance déclarative de catégorie « ${pattern.category} » ; aucun statut REQUIRED n’en découle.`,
  sourceRefs: uniqueSorted([pattern.patternId, pattern.provenance.recordDigest, ...pattern.provenance.sourceIds]),
  boundary: "REFERENCE_ONLY_NEVER_MAKES_REQUIRED",
}));

const resolveFamilies = (input: StudyTemplateCompositionInput, requirements: readonly RequirementEvidence[], patterns: readonly TemplatePatternMapping[]): StudyFamilyProfile[] => {
  const project = input.researchProject;
  const regulatoryText = requirements.flatMap((requirement) => requirement.text);
  const applicableText = requirements.filter((requirement) => ["APPLICABLE"].includes(requirement.status)).flatMap((requirement) => requirement.text);
  const potentialText = requirements.filter((requirement) => ["CONDITIONALLY_APPLICABLE", "POTENTIALLY_APPLICABLE", "UNKNOWN_REQUIRES_QUALIFICATION", "UNKNOWN_MISSING_INFORMATION"].includes(requirement.status)).flatMap((requirement) => requirement.text);
  const conflictingText = requirements.filter((requirement) => requirement.status === "CONFLICTING_REQUIREMENTS").flatMap((requirement) => requirement.text);
  const notApplicableText = requirements.filter((requirement) => requirement.status === "NOT_APPLICABLE").flatMap((requirement) => requirement.text);
  const projectDesignObjects = applicableProjectObjects(input).filter((item) => item.type === "STUDY_DESIGN");
  const projectDesignText = projectDesignObjects.flatMap((item) => [item.content, item.scientificRole ?? "", item.semanticKey]);
  const make = (family: StudyFamilyDefinition): StudyFamilyProfile => {
    let status: FamilyResolutionStatus = "UNKNOWN";
    let source: StudyFamilyProfile["source"] = "PROJECT_AND_REG-001";
    let reason = "Aucun signal gouverné suffisant ne permet de qualifier cet axe.";
    let supportingProjectFacts: string[] = [];
    let supportingRequirements: string[] = [];
    const matchedPatterns = patterns.filter((mapping) => mapping.nodeIds.some((nodeId) => CLINICAL_STUDY_TEMPLATE.graph.nodes.find((node) => node.nodeId === nodeId)?.familyIds.includes(family.familyId))).map((item) => item.patternId);

    if (family.resolver === "ALWAYS") {
      status = "APPLICABLE";
      source = "TMP-001_BASE";
      reason = "Le moteur compose une StudyTemplateInstance pour un Research Project fourni.";
      supportingProjectFacts = [project.projectId, project.projectVersion];
    } else if (family.resolver === "PROJECT_DESIGN") {
      source = "PROJECT";
      if (containsTemplateToken(projectDesignText, family.resolverTokens)) {
        status = "APPLICABLE";
        supportingProjectFacts = projectDesignObjects.map((item) => item.versionRef);
        reason = "Le Research Project expose explicitement un ou plusieurs plans de cette famille.";
      }
    } else if (family.resolver === "PROJECT_IMAGING") {
      source = "PROJECT";
      if (project.imagingApplicability === "APPLICABLE") {
        status = "APPLICABLE";
        supportingProjectFacts = applicableProjectObjects(input).filter((item) => ["IMAGING_MODALITY", "ACQUISITION"].includes(item.type)).map((item) => item.versionRef);
        reason = "La contribution Imaging est explicitement applicable dans le Research Project.";
      } else if (project.imagingApplicability === "NOT_APPLICABLE") {
        status = "NOT_APPLICABLE";
        supportingProjectFacts = [project.projectId, project.projectVersion];
        reason = "Le Research Project porte une exclusion explicite de la contribution Imaging.";
      }
    } else {
      source = "REG-001";
      if (containsTemplateToken(conflictingText, family.resolverTokens)) status = "CONFLICTING";
      else if (containsTemplateToken(applicableText, family.resolverTokens)) status = "APPLICABLE";
      else if (containsTemplateToken(potentialText, family.resolverTokens)) status = "POTENTIALLY_APPLICABLE";
      else if (containsTemplateToken(notApplicableText, family.resolverTokens)) status = "NOT_APPLICABLE";
      else if (containsTemplateToken(regulatoryText, family.resolverTokens)) status = "UNKNOWN";
      supportingRequirements = requirements.filter((requirement) => containsTemplateToken(requirement.text, family.resolverTokens)).map((item) => item.requirementId);
      reason = supportingRequirements.length
        ? `Le statut reprend sans renforcement ${supportingRequirements.length} résolution(s) REG-001 correspondante(s).`
        : "Aucune résolution REG-001 correspondante ne permet de qualifier cet axe.";
    }
    return {
      familyId: family.familyId,
      source,
      status,
      reason,
      supportingProjectFacts: uniqueSorted(supportingProjectFacts),
      supportingRequirements: uniqueSorted(supportingRequirements),
      supportingPatterns: uniqueSorted(matchedPatterns),
      conflicts: status === "CONFLICTING" ? supportingRequirements : [],
      unknowns: status === "UNKNOWN" ? [`FAMILY_UNKNOWN:${family.familyId}`] : [],
    };
  };
  return STUDY_FAMILY_DEFINITIONS.map(make).sort((left, right) => left.familyId.localeCompare(right.familyId));
};

const statusFromRegulatory = (statuses: readonly string[], future: boolean): TemplateBlockStatus | null => {
  if (statuses.includes("CONFLICTING_REQUIREMENTS")) return "CONFLICTING";
  if (statuses.includes("APPLICABLE")) return future ? "BLOCKED" : "REQUIRED";
  if (statuses.some((status) => ["CONDITIONALLY_APPLICABLE", "POTENTIALLY_APPLICABLE"].includes(status))) return future ? "BLOCKED" : "CONDITIONAL";
  if (statuses.some((status) => ["UNKNOWN_REQUIRES_QUALIFICATION", "UNKNOWN_MISSING_INFORMATION"].includes(status))) return "UNKNOWN";
  if (statuses.length && statuses.every((status) => ["NOT_APPLICABLE", "SUPERSEDED", "OUTSIDE_EFFECTIVE_PERIOD"].includes(status))) return "NOT_APPLICABLE";
  return null;
};

const readinessForStatus = (status: TemplateBlockStatus, supports: readonly TemplateSupport[]): TemplateReadinessStatus => {
  if (status === "CONFLICTING") return "CONFLICTING";
  if (status === "BLOCKED") return "BLOCKED";
  if (status === "UNKNOWN") return "UNKNOWN";
  if (status === "FUTURE") return "FUTURE";
  if (status === "NOT_APPLICABLE") return "COMPLETE";
  if (status === "REQUIRED") return supports.some((support) => support.supportLevel === "DIRECT") ? "COMPLETE" : "INCOMPLETE";
  if (status === "OPTIONAL") return "COMPLETE";
  return supports.length ? "PARTIAL" : "INCOMPLETE";
};

const overallReadiness = (nodes: readonly TemplateNodeInstance[]): TemplateReadinessStatus => {
  const values = new Set(nodes.map((node) => node.readiness));
  if (values.has("CONFLICTING")) return "CONFLICTING";
  if (values.has("BLOCKED")) return "BLOCKED";
  if (values.has("UNKNOWN")) return "UNKNOWN";
  if (values.has("INCOMPLETE")) return "INCOMPLETE";
  if (values.has("PARTIAL")) return "PARTIAL";
  if (values.has("FUTURE")) return "FUTURE";
  return "COMPLETE";
};

const targetNodesForMissing = (field: string, requirementIds: readonly string[], requirementMapping: readonly TemplateRequirementMapping[]) => {
  const mapped = requirementMapping.filter((mapping) => requirementIds.includes(mapping.requirementId)).flatMap((mapping) => mapping.nodeIds);
  if (mapped.length) return uniqueSorted(mapped);
  if (/population/i.test(field)) return ["TMP-NODE:POPULATION"];
  if (/endpoint|criterion|critere/i.test(field)) return ["TMP-NODE:ENDPOINTS"];
  if (/imaging|equipment|modality/i.test(field)) return ["TMP-NODE:IMAGING_CONTRIBUTION"];
  return ["TMP-NODE:UNKNOWNS", "TMP-NODE:REQUIREMENT_REGISTER"];
};

const detectedConflicts = (input: StudyTemplateCompositionInput, requirementMapping: readonly TemplateRequirementMapping[], patternMapping: readonly TemplatePatternMapping[]): TemplateConflict[] => {
  const conflicts: TemplateConflict[] = [];
  const add = (sources: string[], affectedNodes: string[], reason: string, resolutions: string[]) => conflicts.push({
    conflictId: `TMP-CONFLICT:${templateDigest([sources, affectedNodes, reason]).slice(5, 17).toUpperCase()}`,
    sources: uniqueSorted(sources),
    affectedNodes: uniqueSorted(affectedNodes),
    reason,
    status: "OPEN",
    possibleResolutions: resolutions,
    humanDecisionRequired: true,
  });
  const project = input.researchProject;
  const regulatory = input.applicableRequirementSet;
  if (project.projectDigest !== regulatory.researchProjectDigest || regulatory.researchProjectId !== project.projectId) {
    add([project.projectId, project.projectDigest, regulatory.resolutionId, regulatory.researchProjectDigest], ["TMP-NODE:PROJECT_IDENTITY", "TMP-NODE:REQUIREMENT_REGISTER"], "Les identités ou digests Project/REG-001 ne correspondent pas.", ["Rejouer REG-001 sur la version exacte du Research Project."]);
  }
  project.issues.filter((issue) => issue.kind === "CONTRADICTION").forEach((issue) => add([project.projectId, issue.issueRef, ...issue.sourceRefs], ["TMP-NODE:CONFLICTS"], issue.reason, ["Arbitrage humain dans le moteur propriétaire de la contradiction."]));
  regulatory.contradictions.forEach((conflict) => {
    const affected = requirementMapping.filter((mapping) => conflict.requirementIds.includes(mapping.requirementId)).flatMap((mapping) => mapping.nodeIds);
    add([conflict.contradictionId, ...conflict.requirementIds, ...conflict.provenance], affected.length ? affected : ["TMP-NODE:REQUIREMENT_REGISTER"], conflict.description, ["Qualification ou arbitrage humain dans REG-001."]);
  });
  const patternNodes = new Map(patternMapping.map((mapping) => [mapping.patternId, mapping.nodeIds]));
  input.documentaryPatternGraph.relations.filter((relation) => relation.type === "CONFLICTS_WITH").forEach((relation) => {
    add([relation.relationId, relation.fromId, relation.toId], [...(patternNodes.get(relation.fromId) ?? []), ...(patternNodes.get(relation.toId) ?? [])], relation.rationale, ["Revue documentaire humaine ; aucune promotion de pattern."]);
  });
  const decisions = [...(input.humanDecisions ?? [])];
  const targetIds = uniqueSorted(decisions.flatMap((decision) => decision.targetNodeIds));
  targetIds.forEach((target) => {
    const outcomes = uniqueSorted(decisions.filter((decision) => decision.targetNodeIds.includes(target)).map((decision) => decision.outcome));
    if (outcomes.length > 1) add(decisions.filter((decision) => decision.targetNodeIds.includes(target)).map((decision) => decision.decisionId), [target], `Décisions humaines TMP incompatibles pour ${target}: ${outcomes.join(", ")}.`, ["Créer une décision humaine versionnée qui arbitre explicitement les décisions antérieures."]);
  });
  return conflicts.sort((left, right) => left.conflictId.localeCompare(right.conflictId));
};

export const composeStudyTemplateInstance = (input: StudyTemplateCompositionInput): StudyTemplateInstance => {
  const before = {
    project: stableTemplateStringify(input.researchProject),
    regulatory: stableTemplateStringify(input.applicableRequirementSet),
    patterns: stableTemplateStringify(input.documentaryPatternGraph),
  };
  const template = CLINICAL_STUDY_TEMPLATE;
  if (input.templateId && input.templateId !== template.templateId) throw new Error(`UNKNOWN_STUDY_TEMPLATE:${input.templateId}`);
  const definitions = template.graph.nodes;
  const requirements = requirementEvidence(input);
  const requirementMapping = requirementMappings(definitions, requirements);
  const patternMapping = patternMappings(definitions, input.documentaryPatternGraph.patterns);
  const familyProfiles = resolveFamilies(input, requirements, patternMapping);
  const conditions: TemplateCondition[] = requirements.flatMap((requirement) => requirement.conditions.flatMap((condition, index) => {
    const targets = requirementMapping.find((mapping) => mapping.requirementId === requirement.requirementId)?.nodeIds ?? ["TMP-NODE:REQUIREMENT_REGISTER"];
    return targets.map((targetNodeId) => ({
      conditionId: `TMP-CONDITION:${templateDigest([requirement.requirementId, targetNodeId, condition, index]).slice(5, 17).toUpperCase()}`,
      targetNodeId,
      expression: condition,
      status: requirement.status === "APPLICABLE" ? "SATISFIED" as const : requirement.status === "NOT_APPLICABLE" ? "NOT_SATISFIED" as const : "UNKNOWN" as const,
      sourceRefs: requirement.sourceRefs,
      reason: `Condition reprise de REG-001 avec le statut ${requirement.status}.`,
    }));
  })).sort((left, right) => left.conditionId.localeCompare(right.conditionId));
  const conflicts = detectedConflicts(input, requirementMapping, patternMapping);

  const projectUnknowns = input.researchProject.issues
    .filter((issue) => ["UNKNOWN", "WITHHELD", "AMBIGUITY"].includes(issue.kind))
    .map((issue) => ({ unknownId: `PRJ-${issue.kind}:${issue.issueRef}`, field: `researchProject.${issue.kind.toLocaleLowerCase("en-US")}`, reason: issue.reason, provenance: [input.researchProject.projectId, ...issue.sourceRefs] }));
  const regulatoryUnknowns = input.applicableRequirementSet.missingInformation.map((missing, index) => ({ unknownId: `REG-UNKNOWN:${index + 1}:${templateDigest(missing).slice(5, 11)}`, field: missing.field, reason: missing.reason, provenance: missing.provenance }));
  const unknowns = [...projectUnknowns, ...regulatoryUnknowns, ...(input.declaredUnknowns ?? [])].sort((left, right) => left.unknownId.localeCompare(right.unknownId));
  const missingInformation: TemplateMissingInformation[] = [
    ...input.applicableRequirementSet.missingInformation.map((missing) => ({
      missingInformationId: `TMP-MISSING:${templateDigest(missing).slice(5, 17).toUpperCase()}`,
      targetNodeIds: targetNodesForMissing(missing.field, missing.blockedRequirementIds, requirementMapping),
      field: missing.field,
      reason: missing.reason,
      sourceRefs: uniqueSorted([...missing.blockedRequirementIds, ...missing.provenance]),
      status: "OPEN" as const,
    })),
    ...(input.declaredUnknowns ?? []).map((unknown) => ({
      missingInformationId: `TMP-MISSING:${templateDigest(unknown).slice(5, 17).toUpperCase()}`,
      targetNodeIds: targetNodesForMissing(unknown.field, [], requirementMapping),
      field: unknown.field,
      reason: unknown.reason,
      sourceRefs: unknown.provenance,
      status: "OPEN" as const,
    })),
  ].sort((left, right) => left.missingInformationId.localeCompare(right.missingInformationId));
  const limitations = [
    ...input.researchProject.issues.filter((issue) => issue.kind === "LIMITATION").map((issue) => ({ limitationId: `PRJ-LIMITATION:${issue.issueRef}`, reason: issue.reason, provenance: [input.researchProject.projectId, ...issue.sourceRefs] })),
    ...input.applicableRequirementSet.corpusDiagnostics.map((diagnostic) => ({ limitationId: `REG-DIAGNOSTIC:${diagnostic.diagnosticId}`, reason: diagnostic.description, provenance: diagnostic.provenance })),
    { limitationId: "TMP-LIMITATION:DOC002_REFERENCE_ONLY", reason: "Les patterns DOC-002 restent candidats, locaux, historiques ou externes selon leur statut et ne créent aucune obligation.", provenance: [input.documentaryPatternGraph.catalogId, input.documentaryPatternGraph.digest] },
    { limitationId: "TMP-LIMITATION:DOC001B_READ_ONLY_CONSUMER", reason: "DOC-001B consomme la StudyTemplateInstance comme structure logique en lecture seule ; TMP-001 ne génère aucun document.", provenance: ["DOC-001B:template-integration", "TMP-001:consumer-boundary"] },
    ...(input.declaredLimitations ?? []),
  ].sort((left, right) => left.limitationId.localeCompare(right.limitationId));
  const humanDecisions = [...(input.humanDecisions ?? [])].map((decision) => ({ ...decision, targetNodeIds: uniqueSorted(decision.targetNodeIds), provenance: uniqueSorted(decision.provenance) })).sort((left, right) => left.decisionId.localeCompare(right.decisionId) || left.version - right.version);

  const nodeInstances: TemplateNodeInstance[] = definitions.map((definition) => {
    const supports = directProjectSupport(definition, input);
    requirementMapping.filter((mapping) => mapping.nodeIds.includes(definition.nodeId)).forEach((mapping) => supports.push({
      supportId: `TMP-SUPPORT:${templateDigest([definition.nodeId, mapping.requirementId]).slice(5, 17).toUpperCase()}`,
      kind: "REGULATORY_SUPPORT",
      sourceRefs: mapping.sourceRefs,
      supportLevel: mapping.status === "APPLICABLE" ? "DIRECT" : mapping.status === "NOT_APPLICABLE" ? "EXCLUSION" : mapping.status.includes("UNKNOWN") ? "UNKNOWN" : "CONDITIONAL",
      reason: mapping.reason,
      provenance: mapping.sourceRefs,
    }));
    const nodePatternMappings = patternMapping.filter((mapping) => mapping.nodeIds.includes(definition.nodeId));
    if (nodePatternMappings.length) supports.push({
      supportId: `TMP-SUPPORT:${templateDigest([definition.nodeId, nodePatternMappings.map((mapping) => mapping.patternId)]).slice(5, 17).toUpperCase()}`,
      kind: "DOCUMENTARY_SUPPORT",
      sourceRefs: uniqueSorted(nodePatternMappings.map((mapping) => mapping.patternId)),
      supportLevel: "REFERENCE_ONLY",
      reason: `${nodePatternMappings.length} pattern(s) DOC-002 correspondent aux catégories déclarées ; aucun statut REQUIRED n’en découle.`,
      provenance: [input.documentaryPatternGraph.catalogId, input.documentaryPatternGraph.digest],
    });
    const decisions = humanDecisions.filter((decision) => decision.targetNodeIds.includes(definition.nodeId));
    decisions.forEach((decision) => supports.push({
      supportId: `TMP-SUPPORT:${templateDigest([definition.nodeId, decision.decisionId, decision.version]).slice(5, 17).toUpperCase()}`,
      kind: "HUMAN_DECISION_SUPPORT",
      sourceRefs: [decision.decisionId, `version:${decision.version}`, decision.mandate],
      supportLevel: decision.outcome === "NOT_APPLICABLE" ? "EXCLUSION" : "DIRECT",
      reason: decision.reason,
      provenance: decision.provenance,
    }));
    const mappedStatuses = requirementMapping.filter((mapping) => mapping.nodeIds.includes(definition.nodeId)).map((mapping) => mapping.status);
    const nodeConflicts = conflicts.filter((conflict) => conflict.affectedNodes.includes(definition.nodeId));
    const nodeMissing = missingInformation.filter((missing) => missing.targetNodeIds.includes(definition.nodeId));
    const familyStates = definition.familyIds.map((familyId) => familyProfiles.find((family) => family.familyId === familyId)?.status ?? "UNKNOWN");
    let status: TemplateBlockStatus = definition.defaultStatus;
    const regulatoryStatus = statusFromRegulatory(mappedStatuses, definition.defaultStatus === "FUTURE");
    if (definition.kind === "REQUIRED_BLOCK" && supports.some((support) => support.kind === "PROJECT_SUPPORT" && support.supportLevel === "DIRECT")) status = "REQUIRED";
    if (definition.defaultStatus !== "FUTURE" && supports.some((support) => support.kind === "PROJECT_SUPPORT" && support.supportLevel === "EXCLUSION")) status = "NOT_APPLICABLE";
    if (regulatoryStatus) status = regulatoryStatus;
    if (familyStates.length && familyStates.every((family) => family === "NOT_APPLICABLE")) status = "NOT_APPLICABLE";
    else if (familyStates.includes("CONFLICTING")) status = "CONFLICTING";
    else if (familyStates.length && familyStates.every((family) => family === "UNKNOWN") && status === "CONDITIONAL") status = "UNKNOWN";
    if (nodeMissing.length && status !== "NOT_APPLICABLE") status = "UNKNOWN";
    if (decisions.length) status = decisions[decisions.length - 1].outcome;
    if (nodeConflicts.length) status = "CONFLICTING";
    if (definition.kind === "FUTURE_BLOCK" && status === "REQUIRED") status = "BLOCKED";
    const sortedSupports = supports.sort((left, right) => left.supportId.localeCompare(right.supportId));
    return {
      nodeId: definition.nodeId,
      definitionRef: definition.nodeId,
      kind: definition.kind,
      label: definition.label,
      status,
      readiness: readinessForStatus(status, sortedSupports),
      supports: sortedSupports,
      conditionIds: conditions.filter((condition) => condition.targetNodeId === definition.nodeId).map((condition) => condition.conditionId),
      conflictIds: nodeConflicts.map((conflict) => conflict.conflictId),
      unknownRefs: nodeMissing.map((missing) => missing.missingInformationId),
      limitationRefs: blockLike(definition) ? limitations.map((limitation) => limitation.limitationId) : [],
      decisionRefs: decisions.map((decision) => `${decision.decisionId}@${decision.version}`),
      provenance: uniqueSorted([...definition.provenance, ...sortedSupports.flatMap((support) => support.provenance)]),
    };
  }).sort((left, right) => left.nodeId.localeCompare(right.nodeId));

  const byId = new Map(nodeInstances.map((node) => [node.nodeId, node]));
  let changed = true;
  while (changed) {
    changed = false;
    template.graph.relations.filter((relation) => ["DEPENDS_ON", "REQUIRES"].includes(relation.type)).forEach((relation) => {
      const source = byId.get(relation.fromId);
      const target = byId.get(relation.toId);
      if (!source || !target || ["NOT_APPLICABLE", "CONFLICTING", "BLOCKED"].includes(source.status)) return;
      if (["CONFLICTING", "BLOCKED"].includes(target.status) || (source.status === "REQUIRED" && ["UNKNOWN", "FUTURE"].includes(target.status))) {
        source.status = target.status === "CONFLICTING" ? "CONFLICTING" : "BLOCKED";
        source.readiness = readinessForStatus(source.status, source.supports);
        changed = true;
      }
    });
  }

  const dynamicRelation = (fromId: string, type: "CONFLICTS_WITH" | "EXCLUDES", toId: string, reason: string, provenance: string[]) => ({
    relationId: `TMP-REL:${templateDigest([fromId, type, toId, reason]).slice(5, 17).toUpperCase()}`,
    fromId,
    type,
    toId,
    reason,
    provenance: uniqueSorted(provenance),
  });
  const instanceRelations = [
    ...template.graph.relations,
    ...conflicts.flatMap((conflict) => conflict.affectedNodes.map((nodeId) => dynamicRelation("TMP-NODE:CONFLICTS", "CONFLICTS_WITH", nodeId, conflict.reason, conflict.sources))),
    ...humanDecisions.filter((decision) => decision.outcome === "NOT_APPLICABLE").flatMap((decision) => decision.targetNodeIds.map((nodeId) => dynamicRelation("TMP-NODE:HUMAN_DECISIONS", "EXCLUDES", nodeId, decision.reason, [decision.decisionId, ...decision.provenance]))),
  ].sort((left, right) => left.relationId.localeCompare(right.relationId));

  const documents: TemplateDocumentMapping[] = template.documents.map((document) => {
    const node = byId.get(document.nodeId)!;
    const sections = document.sectionIds.map((sectionId) => template.sections.find((section) => section.sectionId === sectionId)!).filter(Boolean);
    return {
      documentId: document.documentId,
      nodeId: document.nodeId,
      sectionIds: document.sectionIds,
      blockIds: uniqueSorted([...document.sharedBlockIds, ...sections.flatMap((section) => section.blockIds)]),
      status: node.status,
      readiness: node.readiness,
      futureConsumer: "DOC-001" as const,
      boundary: "LOGICAL_DEFINITION_NOT_DOCUMENT_PROJECTION" as const,
    };
  }).sort((left, right) => left.documentId.localeCompare(right.documentId));

  const dependencyEdges = instanceRelations.filter((relation) => ["DEPENDS_ON", "REQUIRES", "OPTIONALLY_REQUIRES", "PRECEDES", "FOLLOWS"].includes(relation.type));
  const dependencyGraph = { nodes: uniqueSorted(dependencyEdges.flatMap((edge) => [edge.fromId, edge.toId])), edges: dependencyEdges, digest: templateDigest(dependencyEdges) };
  const readinessNodes = nodeInstances.map((node) => ({ nodeId: node.nodeId, readiness: node.readiness }));
  const readinessGraph = { nodes: readinessNodes, overall: overallReadiness(nodeInstances), digest: templateDigest(readinessNodes) };
  const after = {
    project: stableTemplateStringify(input.researchProject),
    regulatory: stableTemplateStringify(input.applicableRequirementSet),
    patterns: stableTemplateStringify(input.documentaryPatternGraph),
  };
  const mutationChecks = {
    researchProjectUnchanged: before.project === after.project,
    reg001Unchanged: before.regulatory === after.regulatory,
    doc002Unchanged: before.patterns === after.patterns,
  };
  const instanceMaterial = {
    template: [template.templateId, template.templateVersion, template.templateRevision],
    inputs: [input.researchProject.projectDigest, input.researchProject.sourceSnapshotDigest, input.applicableRequirementSet.resolutionId, input.documentaryPatternGraph.digest],
    familyProfiles,
    nodes: nodeInstances,
    relations: instanceRelations,
    documents,
    conditions,
    conflicts,
    missingInformation,
    unknowns,
    limitations,
    humanDecisions,
    composedAt: input.compositionAsOf,
    requestedDetailLevel: input.requestedDetailLevel ?? "FULL",
  };
  const digest = templateDigest(instanceMaterial);
  return {
    contractVersion: STUDY_TEMPLATE_SCHEMA_VERSION,
    engineVersion: STUDY_TEMPLATE_ENGINE_VERSION,
    instanceId: `TMP-INSTANCE:${digest.slice(5, 17).toUpperCase()}`,
    templateId: template.templateId,
    templateVersion: template.templateVersion,
    templateRevision: template.templateRevision,
    composedAt: input.compositionAsOf,
    requestedDetailLevel: input.requestedDetailLevel ?? "FULL",
    inputRefs: {
      researchProjectId: input.researchProject.projectId,
      researchProjectVersion: input.researchProject.projectVersion,
      researchProjectDigest: input.researchProject.projectDigest,
      regulatoryResolutionId: input.applicableRequirementSet.resolutionId,
      regulatoryCorpusVersion: input.applicableRequirementSet.corpusVersion,
      regulatoryCorpusDigest: input.applicableRequirementSet.corpusDigest,
      documentaryCatalogId: input.documentaryPatternGraph.catalogId,
      documentaryCatalogVersion: input.documentaryPatternGraph.version,
      documentaryCatalogDigest: input.documentaryPatternGraph.digest,
    },
    familyProfiles,
    nodes: nodeInstances,
    relations: instanceRelations,
    documents,
    conditions,
    conflicts,
    missingInformation,
    unknowns,
    limitations,
    humanDecisions,
    upstreamHumanDecisionRefs: uniqueSorted([...(input.upstreamHumanDecisions ?? []), ...input.researchProject.humanDecisions, ...input.applicableRequirementSet.humanDecisions].map((decision) => `${decision.decisionId}@${decision.version}`)),
    requirementMapping,
    patternMapping,
    dependencyGraph,
    readinessGraph,
    inputMutationChecks: mutationChecks,
    provenance: uniqueSorted([
      input.researchProject.projectId,
      input.researchProject.projectVersion,
      input.researchProject.projectDigest,
      input.researchProject.sourceSnapshotDigest,
      input.applicableRequirementSet.resolutionId,
      input.applicableRequirementSet.corpusDigest,
      input.documentaryPatternGraph.catalogId,
      input.documentaryPatternGraph.digest,
      template.templateId,
      template.digest,
    ]),
    trace: [
      { sequence: 1, operation: "READ_GOVERNED_INPUTS", inputRefs: [input.researchProject.projectId, input.researchProject.projectVersion, input.researchProject.projectDigest, input.researchProject.sourceSnapshotDigest, input.applicableRequirementSet.resolutionId, input.documentaryPatternGraph.catalogId], outputRefs: [], decision: "READ_ONLY", mode: "BOUNDARY" },
      { sequence: 2, operation: "RESOLVE_MULTI_AXIS_FAMILIES", inputRefs: familyProfiles.flatMap((profile) => [...profile.supportingProjectFacts, ...profile.supportingRequirements]), outputRefs: familyProfiles.map((profile) => profile.familyId), decision: "NO_SINGLE_BRANCH_FORCED", mode: "DETERMINISTIC" },
      { sequence: 3, operation: "MAP_REQUIREMENTS_AND_PATTERNS", inputRefs: [...requirementMapping.map((mapping) => mapping.requirementId), ...patternMapping.map((mapping) => mapping.patternId)], outputRefs: nodeInstances.map((node) => node.nodeId), decision: "PATTERN_NEVER_MAKES_REQUIRED", mode: "DETERMINISTIC" },
      { sequence: 4, operation: "APPLY_HUMAN_TEMPLATE_DECISIONS", inputRefs: humanDecisions.map((decision) => decision.decisionId), outputRefs: humanDecisions.flatMap((decision) => decision.targetNodeIds), decision: "HUMAN_INPUT_PRESERVED", mode: "HUMAN_INPUT" },
      { sequence: 5, operation: "COMPOSE_LOGICAL_INSTANCE", inputRefs: [template.templateId], outputRefs: [`TMP-INSTANCE:${digest.slice(5, 17).toUpperCase()}`], decision: "NO_DOCUMENT_GENERATED", mode: "DETERMINISTIC" },
    ],
    digest,
    boundary: "LOGICAL_STRUCTURE_ONLY_NOT_A_DOCUMENT_NOT_A_PROTOCOL_NOT_A_DECISION",
  };
};
