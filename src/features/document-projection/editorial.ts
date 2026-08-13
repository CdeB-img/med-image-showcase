import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { CompositionPlan, CompositionPlanSection, DocumentBlock, DocumentSectionInstance, EditorialCommitment, EditorialFact } from "./types";

const commitmentPrefix: Record<EditorialCommitment, string> = {
  CONFIRMED: "Confirmé",
  ADOPTED: "Adopté",
  CANDIDATE: "Candidat",
  REQUIREMENT: "Exigence",
  UNKNOWN: "Inconnu",
  LIMITATION: "Limite",
  CONTRADICTION: "Contradiction",
  REJECTED: "Rejeté",
};

const renderFact = (item: EditorialFact) => `${commitmentPrefix[item.commitment]} — ${item.label} : ${item.value}`;

const groupedFacts = (section: CompositionPlanSection) => {
  const groups = new Map<EditorialCommitment, EditorialFact[]>();
  section.facts.forEach((item) => groups.set(item.commitment, [...(groups.get(item.commitment) ?? []), item]));
  return [...groups.entries()];
};

const blockForFacts = (section: CompositionPlanSection, commitment: EditorialCommitment, items: EditorialFact[]): DocumentBlock => ({
  blockId: `doc-block:${logicalDigest({ sectionId: section.definition.sectionId, commitment, facts: items.map((item) => item.factId) })}`,
  kind: section.definition.pattern === "DECLARATIVE" || section.definition.pattern === "IDENTITY" || section.definition.pattern === "SYNTHESIS" ? "PARAGRAPH" : "LIST",
  label: commitmentPrefix[commitment],
  items: items.map(renderFact),
  commitment,
  provenanceRefs: [...new Set(items.map((item) => item.sourceRef))].sort(),
});

const emptyBlock = (section: CompositionPlanSection): DocumentBlock => ({
  blockId: `doc-block:${logicalDigest({ sectionId: section.definition.sectionId, empty: true, status: section.status })}`,
  kind: "EMPTY_STATE",
  label: "Contenu non complété",
  items: [section.statusReasons[0] ?? "Aucun objet source ne permet une formulation défendable."],
  commitment: "UNKNOWN",
  provenanceRefs: section.provenanceRefs,
});

export const composeEditorialSection = (section: CompositionPlanSection): DocumentSectionInstance => {
  const blocks = groupedFacts(section).map(([commitment, items]) => blockForFacts(section, commitment, items));
  if (!blocks.length) blocks.push(emptyBlock(section));
  const material = {
    definition: section.definition,
    applicability: section.applicability,
    status: section.status,
    statusReasons: section.statusReasons,
    blocks,
    unknowns: section.unknowns,
    limitations: section.limitations,
    contradictions: section.contradictions,
    humanDecisionIds: section.humanDecisionIds,
    provenanceRefs: section.provenanceRefs,
    templateNodeIds: section.templateNodeIds,
    templateSectionIds: section.templateSectionIds,
    templateBlockIds: section.templateBlockIds,
    projectObjectIds: section.projectObjectIds,
    requirementIds: section.requirementIds,
    patternIds: section.patternIds,
    sourceEngine: section.sourceEngine,
    templateStatus: section.templateStatus,
    templateReadiness: section.templateReadiness,
    futureReason: section.futureReason,
    conflicts: section.conflicts,
  };
  return {
    sectionId: section.definition.sectionId,
    title: section.definition.title,
    order: section.definition.order,
    intent: section.definition.intent,
    pattern: section.definition.pattern,
    applicability: section.applicability,
    status: section.status,
    statusReasons: section.statusReasons,
    blocks,
    unknowns: section.unknowns,
    limitations: section.limitations,
    contradictions: section.contradictions,
    humanDecisionIds: section.humanDecisionIds,
    provenanceRefs: section.provenanceRefs,
    templateNodeIds: section.templateNodeIds,
    templateSectionIds: section.templateSectionIds,
    templateBlockIds: section.templateBlockIds,
    projectObjectIds: section.projectObjectIds,
    requirementIds: section.requirementIds,
    patternIds: section.patternIds,
    sourceEngine: section.sourceEngine,
    templateStatus: section.templateStatus,
    templateReadiness: section.templateReadiness,
    futureReason: section.futureReason,
    conflicts: section.conflicts,
    contentDigest: logicalDigest(material),
  };
};

export const composeEditorialProjection = (plan: CompositionPlan) => plan.sections
  .map(composeEditorialSection)
  .sort((left, right) => left.order - right.order);
