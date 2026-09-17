import { logicalDigest, normalizeScientificText } from "../knowledge-engine/canonical.js";
import type { KnowledgeResult } from "../knowledge-engine/types.js";
import type { SemanticEpistemicStatus } from "../scientific-semantic-reconstruction/types.js";
import { detectStudyDesignSignals } from "../study-design/design-reasoning.js";
import type { ScientificThinkingAdaptiveQuestion, ScientificThinkingInput } from "./types.js";
import type { ContextualReasoningReceipt } from "./contextual-reasoning.js";

/** Runtime qualifiers on existing candidate contributions, not a PD-003 ontology. */
export type ContextualImplicationStage = "DESIGN" | "DATA_COLLECTION" | "ANALYSIS" | "REPORTING";
export type ContextualImplicationForce = "NEAR_NECESSARY" | "HIGH_VALUE_CONTEXTUAL" | "OPTIONAL_SCIENTIFIC" | "SPECULATIVE";
export type ContextualScientificProposal = Readonly<{
  ref: string;
  owner: "SEM" | "SCIENTIFIC_THINKING" | "IMAGING" | "STUDY_DESIGN" | "OBSERVABILITY_MEASUREMENT";
  dimension: string;
  origin: Extract<SemanticEpistemicStatus, "INFERRED_HIGH_CONFIDENCE" | "INFERRED_CANDIDATE" | "SUPPORTED_CANDIDATE" | "UNSUPPORTED_CANDIDATE">;
  triggerRefs: readonly string[];
  rationale: string;
  stage: ContextualImplicationStage;
  force: ContextualImplicationForce;
  applicability: "APPLICABLE" | "APPLICABILITY_UNKNOWN" | "NOT_APPLICABLE";
  requiredIntentRefs: readonly string[];
  requiredResourceRefs: readonly string[];
  requiresNewCollection: boolean;
  knowledgeDependent: boolean;
  statementRefs: readonly string[];
  conceptRef?: string;
  basis?: "GENERAL_EXPERT_REASONING" | "DOMAIN_KNOWLEDGE_SUPPORTED" | "EVIDENCE_SUPPORTED";
  scientificRole?: string;
  /** This boundary accepts dimensions only. A generated value is invalid. */
  value?: null;
}>;
export type ExplicitContextResource = Readonly<{
  ref: string;
  available: boolean;
  sourceTurnRef: string;
  sourceText: string;
}>;
export type ContextualScientificImplication = Readonly<{
  ref: string;
  owner: ContextualScientificProposal["owner"];
  dimension: string;
  origin: ContextualScientificProposal["origin"];
  triggerRefs: readonly string[];
  rationale: string;
  stage: ContextualImplicationStage;
  force: ContextualImplicationForce;
  applicability: ContextualScientificProposal["applicability"];
  epistemicState: "UNKNOWN";
  value: null;
  projectRole: null;
  reviewState: "PENDING";
  knowledgeDependent: boolean;
  knowledgeResultRef: string | null;
  statementRefs: readonly string[];
  evidenceRefs: readonly string[];
  limitations: readonly string[];
  visible: boolean;
  userStated: false;
  candidateIsAdopted: false;
  projectWriteAuthorized: false;
  basis: "GENERAL_EXPERT_REASONING" | "DOMAIN_KNOWLEDGE_SUPPORTED" | "EVIDENCE_SUPPORTED";
  scientificRole: string;
}>;
export type ContextualScientificUnderstanding = Readonly<{
  owner: "SCIENTIFIC_THINKING";
  sourceRef: string;
  sourceDigest: string;
  contextDigest: string;
  sourceProject: ScientificThinkingInput["researchContext"];
  explicitContent: readonly Readonly<{ ref: string; sourceText: string; origin: "EXPLICIT_USER_STATED" }>[];
  implications: readonly ContextualScientificImplication[];
  visibleImplications: readonly ContextualScientificImplication[];
  informationNeeds: readonly ScientificThinkingAdaptiveQuestion[];
  rejectedProposalRefs: readonly string[];
  specializedGeneration: "UPSTREAM_OWNER_REQUIRED_NOT_GENERATED_HERE" | "CURRENT_OWNER_PROVIDER_CONTRIBUTION";
  projectWriteAuthorized: false;
  candidateIsAdopted: false;
}>;

const unique = (values: readonly string[]) => [...new Set(values)];

/** Scientific Thinking qualifies upstream dimensions. It never extracts an
 * inferred value into Project or substitutes for a domain proposal producer. */
export const prepareContextualScientificUnderstanding = (input: {
  scientificInput: Readonly<ScientificThinkingInput>;
  source: Readonly<{ turnRef: string; text: string }>;
  adaptiveQuestions: readonly ScientificThinkingAdaptiveQuestion[];
  proposals?: readonly ContextualScientificProposal[];
  knowledge?: Readonly<KnowledgeResult> | null;
  resources?: readonly ExplicitContextResource[];
  sourceTurns?: readonly Readonly<{ turnRef: string; text: string }>[];
  intentRefs?: readonly string[];
  contextRefs?: readonly string[];
  rejectedProposalRefs?: readonly string[];
  reasoning?: ContextualReasoningReceipt;
}): ContextualScientificUnderstanding => {
  if (!input.source.turnRef || !input.source.text) throw new Error("CONTEXTUAL_SOURCE_REQUIRED");
  const native = input.scientificInput;
  if (normalizeScientificText(native.originalExpression) !== normalizeScientificText(input.source.text)) {
    throw new Error("CONTEXTUAL_INTENT_SOURCE_CHANGED");
  }
  const projectBinding = [native.researchContext.researchProjectId, native.researchContext.researchProjectVersion,
    native.researchContext.researchProjectDigest, native.researchContext.projectSnapshotDigest];
  if (projectBinding.some(Boolean) && !projectBinding.every(Boolean)) throw new Error("CONTEXTUAL_PROJECT_BINDING_INCOMPLETE");
  const turns = [input.source, ...(input.sourceTurns ?? [])];
  const reasoning = input.reasoning;
  if (reasoning && (reasoning.sourceTurnRef !== input.source.turnRef || reasoning.sourceDigest !== logicalDigest(input.source.text)
    || reasoning.project?.projectId !== (native.researchContext.researchProjectId ?? undefined)
    || reasoning.project?.versionId !== (native.researchContext.researchProjectVersion ?? undefined)
    || reasoning.project?.projectDigest !== (native.researchContext.researchProjectDigest ?? undefined)
    || reasoning.projectWrites !== 0 || reasoning.projectWriteAuthorized || reasoning.candidateIsAdopted)) throw new Error("CONTEXTUAL_REASONING_CURRENT_BINDING_REQUIRED");
  const resources = [...(input.resources ?? []), ...(reasoning?.resources ?? [])];
  for (const resource of resources) {
    if (!resource.ref || !resource.sourceText || !turns.some(turn => turn.turnRef === resource.sourceTurnRef
      && turn.text.includes(resource.sourceText))) throw new Error("CONTEXTUAL_CONSTRAINT_SOURCE_NOT_EXPLICIT");
  }
  if (new Set(resources.map(resource => resource.ref)).size !== resources.length) throw new Error("CONTEXTUAL_CONSTRAINT_CONTRADICTION");
  const intentRefs = [...(input.intentRefs ?? []), ...(reasoning?.intentRefs ?? [])];
  const knownRefs = new Set([input.source.turnRef, native.requestId, ...turns.map(t => t.turnRef), ...(input.contextRefs ?? []), ...intentRefs]);
  const rejected = new Set(input.rejectedProposalRefs ?? []);
  const signals = detectStudyDesignSignals(turns.map(t => t.text).join("\n"), false);
  const structural = (suffix: string, dimension: string, stage: ContextualImplicationStage,
    force: ContextualImplicationForce): ContextualScientificProposal => ({
    ref: `${native.requestId}:context:${suffix}`, owner: "SCIENTIFIC_THINKING", dimension,
    origin: "INFERRED_HIGH_CONFIDENCE", triggerRefs: [input.source.turnRef],
    rationale: "Dimension structurelle à considérer ; aucune valeur ni décision de projet n’est déduite.",
    stage, force, applicability: "APPLICABLE", requiredIntentRefs: [], requiredResourceRefs: [],
    requiresNewCollection: false, knowledgeDependent: false, statementRefs: [],
  });
  // Study architecture, not disease keywords: no hidden medical checklist.
  const structuralProposals = [structural("description", "caractéristiques des unités étudiées", "REPORTING", "HIGH_VALUE_CONTEXTUAL")];
  if (native.population.length) structuralProposals.push(structural("baseline", "caractéristiques initiales pertinentes de la population", "DATA_COLLECTION", "HIGH_VALUE_CONTEXTUAL"));
  if (native.methodsMentioned.length) structuralProposals.push(structural("observation", "conditions et moment de l’observation", "DESIGN", "HIGH_VALUE_CONTEXTUAL"));
  if (signals.prognostic || signals.longitudinal) structuralProposals.push(structural("evolution", "résultat observé et temporalité du suivi", "DESIGN", "NEAR_NECESSARY"));
  if (signals.comparative) structuralProposals.push(structural("comparison", "comparabilité des groupes et facteurs de confusion", "ANALYSIS", "HIGH_VALUE_CONTEXTUAL"));
  const proposals = [...structuralProposals, ...(input.proposals ?? []), ...(reasoning?.proposals ?? [])];
  const structuralRefs = new Set(structuralProposals.map(proposal => proposal.ref));
  if (new Set(proposals.map(proposal => proposal.ref)).size !== proposals.length) throw new Error("CONTEXTUAL_PROPOSAL_IDENTITY_DUPLICATE");
  const knowledge = input.knowledge;
  const knowledgeCurrent = knowledge && knowledge.request.originalQuestion === normalizeScientificText(input.source.text);
  const implications = proposals.filter(proposal => !rejected.has(proposal.ref)).map(proposal => {
    if (!proposal.ref || !proposal.dimension.trim() || !proposal.rationale.trim() || proposal.value != null
      || !proposal.triggerRefs.length || proposal.triggerRefs.some(ref => !knownRefs.has(ref))
      || !["INFERRED_HIGH_CONFIDENCE", "INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE", "UNSUPPORTED_CANDIDATE"].includes(proposal.origin)
      || !["DESIGN", "DATA_COLLECTION", "ANALYSIS", "REPORTING"].includes(proposal.stage)
      || !["NEAR_NECESSARY", "HIGH_VALUE_CONTEXTUAL", "OPTIONAL_SCIENTIFIC", "SPECULATIVE"].includes(proposal.force)
      || !["APPLICABLE", "APPLICABILITY_UNKNOWN", "NOT_APPLICABLE"].includes(proposal.applicability)
      || (!structuralRefs.has(proposal.ref) && !proposal.knowledgeDependent
        && !reasoning?.proposals.some(p => p.ref === proposal.ref && p.basis === "GENERAL_EXPERT_REASONING"))) {
      throw new Error("CONTEXTUAL_DIMENSION_PROPOSAL_INVALID");
    }
    const concept = knowledgeCurrent ? knowledge.resolvedConcepts.find(candidate => candidate.conceptId === proposal.conceptRef
      && candidate.preferredLabel === proposal.dimension && !["UNKNOWN", "AMBIGUOUS"].includes(candidate.kind)) : null;
    const conceptRefs = concept ? [concept.conceptId, ...Object.values(concept.providerConcepts).flat()] : [];
    const statements = knowledgeCurrent ? [
      ...knowledge.applicableAssertions.map(statement => ({ ref: statement.stableId, applicability: statement.applicability,
        conceptRefs: statement.conceptIds,
        evidenceRefs: knowledge.evidence.filter(evidence => evidence.assertionId === statement.stableId || evidence.assertionId === statement.revision).map(evidence => evidence.evidenceId),
        sourceRefs: knowledge.evidence.filter(evidence => evidence.assertionId === statement.stableId || evidence.assertionId === statement.revision).map(evidence => evidence.sourceId) })),
      ...knowledge.documentaryStatements.map(statement => ({ ref: statement.statementId, applicability: statement.applicability,
        conceptRefs: statement.conceptIds,
        evidenceRefs: [], sourceRefs: [statement.sourceId] })),
    ].filter(statement => proposal.statementRefs.includes(statement.ref)
      && statement.conceptRefs.some(ref => conceptRefs.includes(ref))
      && ["APPLICABLE_EXACT", "APPLICABLE_WITH_LIMITATIONS"].includes(statement.applicability)) : [];
    const supported = proposal.knowledgeDependent && proposal.applicability === "APPLICABLE"
      && Boolean(knowledgeCurrent) && knowledge!.coverageStatus !== "CONFLICTING"
      && proposal.statementRefs.length > 0 && statements.length === unique(proposal.statementRefs).length;
    const incompatible = proposal.applicability === "NOT_APPLICABLE"
      || proposal.requiredResourceRefs.some(ref => resources.some(resource => resource.ref === ref && !resource.available))
      || (signals.retrospective && proposal.requiresNewCollection)
      || proposal.requiredIntentRefs.some(ref => !intentRefs.includes(ref));
    const resourceUnknown = proposal.requiredResourceRefs.some(ref => !resources.some(resource => resource.ref === ref));
    const applicability = incompatible ? "NOT_APPLICABLE" as const
      : resourceUnknown ? "APPLICABILITY_UNKNOWN" as const : proposal.applicability;
    const origin = proposal.knowledgeDependent
      ? supported ? "SUPPORTED_CANDIDATE" as const : "UNSUPPORTED_CANDIDATE" as const : proposal.origin === "SUPPORTED_CANDIDATE"
        ? "INFERRED_CANDIDATE" as const : proposal.origin;
    const limitations = unique([
      "DIMENSION_ONLY_VALUE_UNKNOWN_NO_PROJECT_ROLE_ASSIGNED",
      ...(proposal.knowledgeDependent && !supported ? ["APPLICABLE_DOMAIN_KNOWLEDGE_REQUIRED"] : []),
      ...(knowledgeCurrent ? knowledge!.limitations : []),
      ...(resourceUnknown ? ["RESOURCE_AVAILABILITY_UNKNOWN"] : []),
      ...(incompatible ? ["EXPLICIT_CONSTRAINT_OR_INTENT_OVERRIDES_CONTEXTUAL_EXPECTATION"] : []),
      ...(proposal.stage === "REPORTING" ? ["REPORTING_EXPECTATION_IS_NOT_ELIGIBILITY"] : []),
    ]);
    if (proposal.basis === "EVIDENCE_SUPPORTED" && (!supported || !statements.some(s => s.evidenceRefs.length))) throw new Error("CONTEXTUAL_EVIDENCE_CLAIM_UNSUPPORTED");
    if (proposal.basis === "DOMAIN_KNOWLEDGE_SUPPORTED" && !supported) throw new Error("CONTEXTUAL_KNOWLEDGE_CLAIM_UNSUPPORTED");
    return Object.freeze({ ref: proposal.ref, owner: proposal.owner, dimension: proposal.dimension,
      origin, triggerRefs: [...proposal.triggerRefs], rationale: proposal.rationale,
      stage: proposal.stage, force: proposal.force, applicability, epistemicState: "UNKNOWN" as const,
      value: null, projectRole: null, reviewState: "PENDING" as const, knowledgeDependent: proposal.knowledgeDependent,
      knowledgeResultRef: knowledgeCurrent ? knowledge!.resultId : null, statementRefs: statements.map(statement => statement.ref),
      evidenceRefs: unique(statements.flatMap(statement => [...statement.evidenceRefs, ...statement.sourceRefs])), limitations,
      visible: applicability === "APPLICABLE" && proposal.force !== "SPECULATIVE" && (!proposal.knowledgeDependent || supported),
      userStated: false as const, candidateIsAdopted: false as const, projectWriteAuthorized: false as const,
      basis: proposal.basis ?? (supported ? "DOMAIN_KNOWLEDGE_SUPPORTED" as const : "GENERAL_EXPERT_REASONING" as const),
      scientificRole: proposal.scientificRole ?? "Dimension à considérer, aucun rôle Project fixé" });
  });
  const questions = input.adaptiveQuestions.filter(question => !question.answeredValue
    && (!reasoning?.questions.some(q => q.ref === question.questionId)
      || reasoning.questions.find(q => q.ref === question.questionId)!.dimensionRefs.some(ref =>
        implications.some(i => i.ref === ref && i.visible))));
  const digest = logicalDigest({ source: input.source, native, proposals, resources, intentRefs: input.intentRefs ?? [],
    contextRefs: input.contextRefs ?? [], rejected: [...rejected], knowledge: knowledgeCurrent ? knowledge!.resultDigest : null, questions });
  const forceOrder: Record<ContextualImplicationForce, number> = { NEAR_NECESSARY: 0, HIGH_VALUE_CONTEXTUAL: 1, OPTIONAL_SCIENTIFIC: 2, SPECULATIVE: 3 };
  const ranking = new Map(reasoning?.ranking.map(r => [r.ref, r]));
  const visible = implications.filter(i => i.visible && !ranking.get(i.ref)?.redundant && ranking.get(i.ref)?.relevance !== "LOW");
  const ranked = visible.sort((a, b) => {
    const ra = ranking.get(a.ref), rb = ranking.get(b.ref);
    return Number(!ra) - Number(!rb)
      || ({ HIGH: 0, CONDITIONAL: 1, LOW: 2 }[ra?.relevance as "HIGH" | "CONDITIONAL" | "LOW"] ?? 2) - ({ HIGH: 0, CONDITIONAL: 1, LOW: 2 }[rb?.relevance as "HIGH" | "CONDITIONAL" | "LOW"] ?? 2)
      || Number(rb?.dependencyImpact === "BRANCH_STRUCTURING") - Number(ra?.dependencyImpact === "BRANCH_STRUCTURING")
      || forceOrder[a.force] - forceOrder[b.force]
      || Number(rb?.stageRelevance === "CURRENT") - Number(ra?.stageRelevance === "CURRENT");
  });
  return Object.freeze({ owner: "SCIENTIFIC_THINKING", sourceRef: `${native.requestId}:contextual:${digest}`,
    sourceDigest: logicalDigest(input.source.text), contextDigest: digest, sourceProject: { ...native.researchContext },
    explicitContent: [{ ref: input.source.turnRef, sourceText: input.source.text, origin: "EXPLICIT_USER_STATED" as const }],
    implications, visibleImplications: ranked.slice(0, reasoning ? 5 : 3), informationNeeds: questions,
    rejectedProposalRefs: [...rejected], specializedGeneration: reasoning ? "CURRENT_OWNER_PROVIDER_CONTRIBUTION" : "UPSTREAM_OWNER_REQUIRED_NOT_GENERATED_HERE",
    projectWriteAuthorized: false, candidateIsAdopted: false });
};
