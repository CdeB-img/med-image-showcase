import { logicalDigest, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import type { CommitmentRule, CompositionPlanSection, DeclarativePredicate, DocumentSectionStatus, EditorialCommitment, EditorialFact, FactDefinition, SectionApplicability, SectionDefinition, TextDefinition } from "./types";

const resolvePath = (root: unknown, path: string): unknown => {
  if (!path || path === "$root") return root;
  return path.split(".").reduce<unknown>((current, part) => current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined, root);
};

const empty = (value: unknown) => value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
const equal = (value: unknown, expected?: string) => expected === "__NULL__" ? value === null || value === undefined
  : expected === "__EMPTY__" ? empty(value)
    : String(value) === expected;

const predicateMatches = (predicate: DeclarativePredicate | undefined, root: Readonly<ResearchProjectDesignResult>, item: unknown) => {
  if (!predicate) return true;
  if (predicate.kind === "ALL") return predicate.predicates.every((candidate) => predicateMatches(candidate, root, item));
  const itemValue = resolvePath(item, predicate.path);
  const rootValue = resolvePath(root, predicate.path);
  switch (predicate.kind) {
    case "ROOT_PATH_EQUALS": return equal(rootValue, predicate.value);
    case "ROOT_PATH_NOT_EQUALS": return !equal(rootValue, predicate.value);
    case "ROOT_PATH_NON_EMPTY": return !empty(rootValue);
    case "ITEM_FIELD_EQUALS": return equal(itemValue, predicate.value);
    case "ITEM_FIELD_NOT_EQUALS": return !equal(itemValue, predicate.value);
    case "ITEM_EQUALS_ROOT": return String(itemValue ?? "") === String(resolvePath(root, predicate.rootPath ?? "") ?? "");
    case "ITEM_NOT_EQUALS_ROOT": return String(itemValue ?? "") !== String(resolvePath(root, predicate.rootPath ?? "") ?? "");
  }
};

const selectedItems = (root: Readonly<ResearchProjectDesignResult>, select: string) => {
  if (select === "$root") return [{ item: root as unknown, index: 0 }];
  const collection = select.endsWith("[]");
  const value = resolvePath(root, collection ? select.slice(0, -2) : select);
  if (collection) return (Array.isArray(value) ? value : []).map((item, index) => ({ item, index }));
  return empty(value) ? [] : [{ item: value, index: 0 }];
};

const printable = (value: unknown) => Array.isArray(value) ? value.map(printable).filter(Boolean).join(" ; ")
  : value === null || value === undefined ? ""
    : typeof value === "object" ? JSON.stringify(value)
      : String(value);

const interpolate = (template: string, root: Readonly<ResearchProjectDesignResult>, item: unknown) => template
  .replace(/\{\{([^}]+)\}\}/g, (_match, rawPath: string) => {
    const path = rawPath.trim();
    if (path === "value") return printable(item);
    if (path.startsWith("root.")) return printable(resolvePath(root, path.slice(5)));
    return printable(resolvePath(item, path));
  })
  .replace(/\s+/g, " ")
  .replace(/\s+([;:,])/g, "$1")
  .trim();

const commitmentFor = (rule: CommitmentRule, project: Readonly<ResearchProjectDesignResult>, item: unknown): EditorialCommitment => {
  if (rule.kind === "STATIC") return rule.value;
  if (rule.kind === "FIELD_MAP") return rule.map[String(resolvePath(item, rule.path) ?? "")] ?? rule.fallback;
  if (rule.kind === "ROOT_GATE") {
    const status = project.decisionsRequired.find((decision) => decision.gateId === rule.gateId)?.status;
    return status ? rule.map[status] ?? rule.fallback : rule.fallback;
  }
  return String(resolvePath(item, rule.itemPath) ?? "") === String(resolvePath(project, rule.rootPath) ?? "") ? rule.selected : rule.other;
};

const extractFacts = (project: Readonly<ResearchProjectDesignResult>, definitions: ReadonlyArray<FactDefinition>): EditorialFact[] => {
  const result = definitions.flatMap((definition) => selectedItems(project, definition.select).flatMap(({ item, index }) => {
    if (!predicateMatches(definition.includeWhen, project, item)) return [];
    const value = interpolate(definition.template, project, item);
    if (!value) return [];
    const label = interpolate(definition.label, project, item);
    const explicitId = definition.sourceIdPath ? resolvePath(definition.select === "$root" ? project : item, definition.sourceIdPath) : null;
    const primitiveId = typeof item === "string" || typeof item === "number" ? printable(item) : "";
    const sourceId = printable(explicitId) || primitiveId || `${index + 1}-${logicalDigest(item)}`;
    const sourceRef = `${definition.sourceKind}:${sourceId}`;
    const commitment = commitmentFor(definition.commitment, project, item);
    return [{ factId: `doc-fact:${logicalDigest({ label, value, commitment, sourceRef })}`, label, value, commitment, sourceRef }];
  }));
  return [...new Map(result.map((item) => [item.factId, item])).values()];
};

const extractTexts = (project: Readonly<ResearchProjectDesignResult>, definitions: ReadonlyArray<TextDefinition>) => uniqueSorted(definitions.flatMap((definition) => selectedItems(project, definition.select).flatMap(({ item }) => {
  if (!predicateMatches(definition.includeWhen, project, item)) return [];
  const value = interpolate(definition.template, project, item);
  return value ? [value] : [];
})));

const applicabilityFor = (project: Readonly<ResearchProjectDesignResult>, definition: SectionDefinition): SectionApplicability => {
  const rule = definition.applicability;
  if (rule.kind === "ALWAYS") return rule.value;
  if (rule.kind === "PATH_ENUM") return rule.map[String(resolvePath(project, rule.path) ?? "")] ?? rule.fallback;
  return rule.paths.some((path) => !empty(resolvePath(project, path))) ? rule.whenPresent : rule.whenAbsent;
};

const linkedDecisions = (project: Readonly<ResearchProjectDesignResult>, definition: SectionDefinition) => definition.decisionGateIds.includes("*")
  ? project.decisionsRequired
  : project.decisionsRequired.filter((decision) => definition.decisionGateIds.includes(decision.gateId));

const statusFor = (
  project: Readonly<ResearchProjectDesignResult>,
  definition: SectionDefinition,
  applicability: SectionApplicability,
  facts: ReadonlyArray<EditorialFact>,
  unknowns: ReadonlyArray<string>,
  limitations: ReadonlyArray<string>,
  contradictions: ReadonlyArray<string>,
): DocumentSectionStatus => {
  const rule = definition.generability;
  if (applicability === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  if (rule.blockWhen?.some((predicate) => predicateMatches(predicate, project, project)) || (rule.blockWhenContradictions && contradictions.length)) return "BLOCKED";
  if (facts.length < rule.minimumFacts) return "NOT_GENERATABLE";
  if (rule.requirementsOnly || rule.alwaysPartialWhenFacts) return "PARTIALLY_GENERATABLE";
  if (rule.partialWhenUnknowns && unknowns.length) return "PARTIALLY_GENERATABLE";
  if (rule.partialWhenLimitations && limitations.length) return "PARTIALLY_GENERATABLE";
  if (rule.partialWhenPendingDecisions && linkedDecisions(project, definition).some((decision) => decision.status === "PENDING")) return "PARTIALLY_GENERATABLE";
  return "GENERATABLE";
};

export const planSection = (project: Readonly<ResearchProjectDesignResult>, definition: SectionDefinition): CompositionPlanSection => {
  const facts = extractFacts(project, definition.facts);
  const unknowns = extractTexts(project, definition.unknowns);
  const limitations = uniqueSorted([...extractTexts(project, definition.limitations), ...(definition.staticLimitations ?? [])]);
  const contradictions = extractTexts(project, definition.contradictions);
  const applicability = applicabilityFor(project, definition);
  const status = statusFor(project, definition, applicability, facts, unknowns, limitations, contradictions);
  const commonProvenance = [
    `ResearchProject:${project.documentHandoff.projectId}`,
    `ResearchProjectVersion:${project.candidateVersion.versionId}`,
    project.provenance.inputRef,
    ...project.provenance.sourceRefs,
  ];
  return {
    definition,
    applicability,
    status,
    statusReasons: [definition.generability.messages[status] ?? "Statut calculé depuis la définition déclarative et les objets sources."],
    facts,
    unknowns,
    limitations,
    contradictions,
    humanDecisionIds: linkedDecisions(project, definition).map((decision) => decision.gateId).sort(),
    provenanceRefs: uniqueSorted([...commonProvenance, ...facts.map((item) => item.sourceRef)]),
    templateNodeIds: [],
    templateSectionIds: [],
    templateBlockIds: [],
    projectObjectIds: uniqueSorted(facts.map((item) => item.sourceRef)),
    requirementIds: [],
    patternIds: [],
    sourceEngine: definition.specializedEngine ?? "PRJ-001",
    templateStatus: null,
    templateReadiness: null,
    futureReason: null,
    conflicts: [],
  };
};

export const createSectionPlanner = () => planSection;
export const planSections = (project: Readonly<ResearchProjectDesignResult>, definitions: ReadonlyArray<SectionDefinition>) => definitions.map((definition) => planSection(project, definition));
