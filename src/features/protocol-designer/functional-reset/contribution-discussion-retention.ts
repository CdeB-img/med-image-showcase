import { z } from "zod/v4";
import { logicalDigest } from "../../knowledge-engine/canonical.js";
import type { ScientificInterpretationTurn } from "../../scientific-interpretation/contracts.js";
import type { ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary.js";
import { buildProjectContextSnapshot } from "../../research-project-construction/canonical-project-backbone.js";
import type { RetainedContributionCandidate } from "./contribution-lifecycle.js";
import type { StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal.js";

// Extension of RETAINED_CONTRIBUTION_LIFECYCLE, not a transcript/Project owner.
// Semantic classification is returned WITH the ordinary Scientific Thinking
// answer. Native validation verifies identity/closure, not semantic similarity.
const ref = z.string().min(1);
const meaning = z.object({
  id: ref, content: ref,
  epistemicState: z.enum(["USER_STATED", "PROPOSED_NOT_ADOPTED", "OPEN_UNKNOWN"]),
  polarity: z.enum(["AFFIRMED", "NEGATED", "CONDITIONAL", "UNKNOWN"]),
  conditions: z.array(ref), linkedIds: z.array(ref),
}).strict();
const coverage = z.object({
  coverage: z.enum(["COMPLETE", "PARTIAL", "UNKNOWN"]),
  nonPersistentReason: z.enum(["NO_SCIENTIFIC_MEANING", "PRESENTATION_ONLY"]).nullable(),
  elements: z.array(meaning),
}).strict();
export const terraScientificResultSchema = z.object({
  reply: ref,
  userContribution: coverage,
  assistantContribution: coverage,
  dispositions: z.array(z.object({
    elementRef: ref, status: z.enum(["SUPERSEDED", "REJECTED", "CLOSED"]),
    replacementId: ref.nullable(),
    // An explicit current USER direction is required; no age/silence heuristic.
    explicitUserDirection: z.literal(true),
  }).strict()),
  candidateBindings: z.array(z.object({ elementRef: ref, candidateRef: ref, changeRef: ref }).strict()),
}).strict();
export type TerraScientificResult = z.infer<typeof terraScientificResultSchema>;
export const terraScientificResultJsonSchema = () => {
  const { $schema: _dialect, ...schema } = z.toJSONSchema(terraScientificResultSchema);
  return schema;
};
type Turn = Pick<ScientificInterpretationTurn, "turnId" | "role" | "content">;
export type RetainedDiscussionElement = Readonly<z.infer<typeof meaning> & {
  ref: string; sourceTurnRef: string; sourceDigest: string;
  linkedRefs: readonly string[];
  status: "PROPOSED_NOT_ADOPTED" | "OPEN_UNKNOWN" | "SUPERSEDED" | "REJECTED" | "CLOSED" | "ADOPTED";
  dispositionSourceRef: string | null;
  replacementRef: string | null;
  candidateBinding: { candidateRef: string; changeRef: string } | null;
  proposalBinding?: { proposalRef: string; atomRefs: readonly string[] };
  adoption?: { projectId: string; projectVersion: string; decisionRef: string };
}>;
export type ScientificDiscussionRetention = Readonly<{
  owner: "RETAINED_CONTRIBUTION_LIFECYCLE";
  semanticOwner: "SCIENTIFIC_THINKING";
  contractVersion: "1.0.0";
  conversationId: string;
  sourceCoverage: readonly Readonly<{ turnRef: string; sourceDigest: string;
    coverage: "COMPLETE" | "PARTIAL" | "UNKNOWN"; elementRefs: readonly string[];
    nonPersistentReason: "NO_SCIENTIFIC_MEANING" | "PRESENTATION_ONLY" | "GOVERNED_OWNER_EVENT" | null;
    classificationOwner?: "SCIENTIFIC_THINKING" | "RESEARCH_PROJECT"; ownerEventRef?: string }>[];
  elements: readonly RetainedDiscussionElement[];
}>;
export const emptyScientificDiscussionRetention = (conversationId: string): ScientificDiscussionRetention => ({
  owner: "RETAINED_CONTRIBUTION_LIFECYCLE", semanticOwner: "SCIENTIFIC_THINKING", contractVersion: "1.0.0",
  conversationId, sourceCoverage: [], elements: [],
});
const active = (e: RetainedDiscussionElement) => e.status === "PROPOSED_NOT_ADOPTED" || e.status === "OPEN_UNKNOWN";
const fail = (): never => { throw new Error("SCIENTIFIC_DISCUSSION_RETENTION_INVALID"); };

/** Passive first-failure attribution. Values are classes, never source prose,
 * provider IDs, arbitrary schema messages or a copy of the rejected receipt. */
export type ScientificDiscussionRetentionDiagnostic = Readonly<{
  contract: "SCIENTIFIC_DISCUSSION_RETENTION_DIAGNOSTIC";
  failedField: string;
  failedValueClass: string;
  failedInvariant: string;
  firstFailedBranch: string;
  firstFailedValidator: "terraScientificResultSchema" | "validateScientificDiscussionRetention" | "retainScientificDiscussionResult";
}>;
class ScientificDiscussionRetentionError extends Error {
  constructor(readonly diagnostic: ScientificDiscussionRetentionDiagnostic) {
    super("SCIENTIFIC_DISCUSSION_RETENTION_INVALID");
  }
}
const retentionDiagnostic = (failedField: string, failedValueClass: string, failedInvariant: string,
  firstFailedBranch: string, firstFailedValidator: ScientificDiscussionRetentionDiagnostic["firstFailedValidator"]
    = "retainScientificDiscussionResult"): ScientificDiscussionRetentionDiagnostic => ({
  contract: "SCIENTIFIC_DISCUSSION_RETENTION_DIAGNOSTIC", failedField, failedValueClass, failedInvariant,
  firstFailedBranch, firstFailedValidator,
});
export const scientificDiscussionRetentionFailureDiagnostic = (error: unknown): ScientificDiscussionRetentionDiagnostic | null =>
  error instanceof ScientificDiscussionRetentionError ? error.diagnostic : null;
const rejectRetention = (field: string, valueClass: string, invariant: string, branch: string): never => {
  throw new ScientificDiscussionRetentionError(retentionDiagnostic(field, valueClass, invariant, branch));
};
// An unknown property name can itself contain private text. Only contract
// field names and anonymous array positions may enter a schema diagnostic.
const receiptFieldNames = new Set(["reply", "userContribution", "assistantContribution", "coverage", "nonPersistentReason",
  "elements", "id", "content", "epistemicState", "polarity", "conditions", "linkedIds", "dispositions", "elementRef",
  "status", "replacementId", "explicitUserDirection", "candidateBindings", "candidateRef", "changeRef"]);
const sanitizedReceiptField = (path: readonly PropertyKey[]) => ("result" + path.slice(0, 10).map(part => typeof part === "number"
  ? "[]" : typeof part === "string" && receiptFieldNames.has(part) ? `.${part}` : ".unknownField").join("")).slice(0, 160);

export const validateScientificDiscussionRetention = (state: ScientificDiscussionRetention, conversationId: string,
  turns: readonly Turn[], onFailure?: (diagnostic: ScientificDiscussionRetentionDiagnostic) => void): boolean => {
  const invalid = (field: string, valueClass: string, invariant: string, branch: string): false => {
    onFailure?.(retentionDiagnostic(field, valueClass, invariant, branch, "validateScientificDiscussionRetention"));
    return false;
  };
  try {
    if (state.owner !== "RETAINED_CONTRIBUTION_LIFECYCLE")
      return invalid("state.owner", "IDENTITY_MISMATCH", "RETENTION_OWNER_MATCH", "STATE_OWNER");
    if (state.semanticOwner !== "SCIENTIFIC_THINKING")
      return invalid("state.semanticOwner", "IDENTITY_MISMATCH", "SEMANTIC_OWNER_MATCH", "STATE_SEMANTIC_OWNER");
    if (state.contractVersion !== "1.0.0")
      return invalid("state.contractVersion", "IDENTITY_MISMATCH", "RETENTION_VERSION_MATCH", "STATE_VERSION");
    if (state.conversationId !== conversationId)
      return invalid("state.conversationId", "IDENTITY_MISMATCH", "RETENTION_CONVERSATION_MATCH", "STATE_CONVERSATION");
    const elements = new Map(state.elements.map(e => [e.ref, e]));
    if (elements.size !== state.elements.length)
      return invalid("state.elements[].ref", "DUPLICATE_REFERENCE", "UNIQUE_ELEMENT_REFS", "STATE_ELEMENT_REFS");
    if (new Set(state.sourceCoverage.map(s => s.turnRef)).size !== state.sourceCoverage.length)
      return invalid("state.sourceCoverage[].turnRef", "DUPLICATE_REFERENCE", "UNIQUE_SOURCE_TURN_REFS", "STATE_SOURCE_REFS");
    return state.sourceCoverage.every(s => {
      const source = turns.find(t => t.turnId === s.turnRef);
      if (!source) return invalid("state.sourceCoverage[].turnRef", "UNRESOLVED_REFERENCE", "SOURCE_TURN_PRESENT", "STATE_SOURCE_TURN");
      if (logicalDigest(source.content) !== s.sourceDigest)
        return invalid("state.sourceCoverage[].sourceDigest", "DIGEST_MISMATCH", "SOURCE_DIGEST_MATCH", "STATE_SOURCE_DIGEST");
      if (!["COMPLETE", "PARTIAL", "UNKNOWN"].includes(s.coverage))
        return invalid("state.sourceCoverage[].coverage", "INVALID_ENUM", "COVERAGE_ENUM", "STATE_COVERAGE");
      if (!(s.nonPersistentReason === null || ["NO_SCIENTIFIC_MEANING", "PRESENTATION_ONLY", "GOVERNED_OWNER_EVENT"].includes(s.nonPersistentReason)))
        return invalid("state.sourceCoverage[].nonPersistentReason", "INVALID_ENUM", "NON_PERSISTENT_REASON_ENUM", "STATE_REASON");
      if (!(s.nonPersistentReason !== "GOVERNED_OWNER_EVENT" || s.classificationOwner === "RESEARCH_PROJECT" && Boolean(s.ownerEventRef)))
        return invalid("state.sourceCoverage[].ownerEventRef", "MISSING_OWNER_BINDING", "GOVERNED_EVENT_HAS_PROJECT_OWNER", "STATE_GOVERNED_EVENT");
      if (!(s.coverage !== "COMPLETE" || s.elementRefs.length > 0 || s.nonPersistentReason !== null))
        return invalid("state.sourceCoverage[].elementRefs", "COMPLETE_EMPTY_WITHOUT_REASON", "COMPLETE_COVERAGE_HAS_MEANING_OR_REASON", "STATE_COMPLETE_EMPTY");
      if (s.elementRefs.length && s.nonPersistentReason)
        return invalid("state.sourceCoverage[].nonPersistentReason", "NONEMPTY_WITH_NON_PERSISTENT_REASON", "MEANING_AND_NON_PERSISTENT_REASON_EXCLUSIVE", "STATE_REASON_WITH_MEANING");
      if (new Set(s.elementRefs).size !== s.elementRefs.length)
        return invalid("state.sourceCoverage[].elementRefs", "DUPLICATE_REFERENCE", "UNIQUE_SOURCE_ELEMENT_REFS", "STATE_SOURCE_ELEMENT_REFS");
      return s.elementRefs.every(r => elements.get(r)?.sourceTurnRef === s.turnRef)
        || invalid("state.sourceCoverage[].elementRefs", "SOURCE_BINDING_MISMATCH", "ELEMENT_REFS_BOUND_TO_SOURCE", "STATE_SOURCE_ELEMENT_BINDING");
    }) && state.elements.every(e => {
      const source = state.sourceCoverage.find(s => s.turnRef === e.sourceTurnRef);
      if (!meaning.safeParse({ id: e.id, content: e.content, epistemicState: e.epistemicState,
        polarity: e.polarity, conditions: e.conditions, linkedIds: e.linkedIds }).success)
        return invalid("state.elements[]", "INVALID_SCHEMA", "RETAINED_MEANING_SCHEMA", "STATE_MEANING_SCHEMA");
      if (!(source?.elementRefs.includes(e.ref) && source.sourceDigest === e.sourceDigest))
        return invalid("state.elements[].sourceTurnRef", "SOURCE_BINDING_MISMATCH", "ELEMENT_SOURCE_COVERAGE_AND_DIGEST_MATCH", "STATE_ELEMENT_SOURCE");
      if (e.ref !== `retained-discussion:${logicalDigest({ turnRef: e.sourceTurnRef, id: e.id })}`)
        return invalid("state.elements[].ref", "IDENTITY_MISMATCH", "CANONICAL_ELEMENT_REF", "STATE_ELEMENT_IDENTITY");
      if (!["PROPOSED_NOT_ADOPTED", "OPEN_UNKNOWN", "SUPERSEDED", "REJECTED", "CLOSED", "ADOPTED"].includes(e.status))
        return invalid("state.elements[].status", "INVALID_ENUM", "RETENTION_STATUS_ENUM", "STATE_ELEMENT_STATUS");
      if (!e.linkedRefs.every(r => elements.has(r)))
        return invalid("state.elements[].linkedRefs", "UNRESOLVED_REFERENCE", "EVERY_RETAINED_LINK_RESOLVES", "STATE_ELEMENT_LINKS");
      if (!(active(e) || e.status === "ADOPTED" && Boolean(e.adoption?.projectId && e.adoption.projectVersion && e.adoption.decisionRef)
        || Boolean(e.dispositionSourceRef && turns.some(t => t.role === "USER" && t.turnId === e.dispositionSourceRef))))
        return invalid("state.elements[].dispositionSourceRef", "MISSING_LIFECYCLE_AUTHORITY", "INACTIVE_MEANING_HAS_HUMAN_OR_ADOPTION_BINDING", "STATE_ELEMENT_AUTHORITY");
      return e.status !== "SUPERSEDED" || Boolean(e.replacementRef && elements.has(e.replacementRef))
        || invalid("state.elements[].replacementRef", "UNRESOLVED_REFERENCE", "SUPERSEDED_MEANING_HAS_REPLACEMENT", "STATE_ELEMENT_REPLACEMENT");
    });
  } catch { return invalid("state", "UNREADABLE_STRUCTURE", "READABLE_RETENTION_STRUCTURE", "STATE_STRUCTURE"); }
};

/** Accept a first-owner receipt, bound to the actual received USER/NOXIA pair.
 * No Project mutation, provider call, implicit adoption or local summarization. */
export const retainScientificDiscussionResult = (input: {
  state?: ScientificDiscussionRetention; conversationId: string; runtimeTurns: readonly Turn[];
  userTurn: Turn; assistantTurn: Turn; result: unknown; retained: readonly RetainedContributionCandidate[];
}): ScientificDiscussionRetention => {
  const parsed = terraScientificResultSchema.safeParse(input.result);
  if (!parsed.success) throw new ScientificDiscussionRetentionError(retentionDiagnostic(
    sanitizedReceiptField(parsed.error.issues[0]?.path ?? []), "INVALID_SCHEMA", "TERRA_SCIENTIFIC_RESULT_SCHEMA",
    "RESULT_SCHEMA", "terraScientificResultSchema"));
  const result = parsed.data;
  const previous = input.state ?? emptyScientificDiscussionRetention(input.conversationId);
  let stateFailure: ScientificDiscussionRetentionDiagnostic | null = null;
  const observeStateFailure = (diagnostic: ScientificDiscussionRetentionDiagnostic) => { stateFailure = diagnostic; };
  if (!validateScientificDiscussionRetention(previous, input.conversationId, input.runtimeTurns, observeStateFailure))
    throw new ScientificDiscussionRetentionError(stateFailure!);
  if (input.userTurn.role !== "USER") rejectRetention("userTurn.role", "ROLE_MISMATCH", "USER_SOURCE_ROLE", "USER_ROLE");
  if (input.assistantTurn.role !== "NOXIA") rejectRetention("assistantTurn.role", "ROLE_MISMATCH", "ASSISTANT_SOURCE_ROLE", "ASSISTANT_ROLE");
  if (input.assistantTurn.content !== result.reply) rejectRetention("result.reply", "SOURCE_TEXT_MISMATCH", "REPLY_MATCHES_ASSISTANT_SOURCE", "REPLY_BINDING");
  const additions: RetainedDiscussionElement[] = [];
  const receipts = ([ [input.userTurn, result.userContribution], [input.assistantTurn, result.assistantContribution] ] as const).map(([turn, receipt]) => {
    const field = turn === input.userTurn ? "result.userContribution" : "result.assistantContribution";
    if (previous.sourceCoverage.some(s => s.turnRef === turn.turnId))
      rejectRetention(field, "ALREADY_RETAINED_SOURCE", "SOURCE_RETAINED_ONCE", "SOURCE_ALREADY_RETAINED");
    const ids = new Map(receipt.elements.map(e => [e.id, `retained-discussion:${logicalDigest({ turnRef: turn.turnId, id: e.id })}`]));
    if (ids.size !== receipt.elements.length)
      rejectRetention(`${field}.elements[].id`, "DUPLICATE_ID", "UNIQUE_IDS_WITHIN_CONTRIBUTION", "CONTRIBUTION_ELEMENT_IDS");
    if (receipt.elements.length > 0 && receipt.nonPersistentReason)
      rejectRetention(`${field}.nonPersistentReason`, "NONEMPTY_WITH_NON_PERSISTENT_REASON", "MEANING_AND_NON_PERSISTENT_REASON_EXCLUSIVE", "CONTRIBUTION_REASON_WITH_MEANING");
    if (receipt.coverage === "COMPLETE" && !receipt.elements.length && !receipt.nonPersistentReason)
      rejectRetention(`${field}.elements`, "COMPLETE_EMPTY_WITHOUT_REASON", "COMPLETE_COVERAGE_HAS_MEANING_OR_REASON", "CONTRIBUTION_COMPLETE_EMPTY");
    for (const element of receipt.elements) {
      if (element.linkedIds.some(id => !ids.has(id)))
        rejectRetention(`${field}.elements[].linkedIds`, "UNRESOLVED_REFERENCE", "EVERY_LINKED_ID_RESOLVES_WITHIN_CONTRIBUTION", "CONTRIBUTION_LINK_CLOSURE");
      additions.push({ ...element, ref: ids.get(element.id)!, sourceTurnRef: turn.turnId, sourceDigest: logicalDigest(turn.content),
        linkedRefs: element.linkedIds.map(id => ids.get(id)!),
        status: element.epistemicState === "OPEN_UNKNOWN" ? "OPEN_UNKNOWN" : "PROPOSED_NOT_ADOPTED",
        dispositionSourceRef: null, replacementRef: null, candidateBinding: null });
    }
    return { turnRef: turn.turnId, sourceDigest: logicalDigest(turn.content), coverage: receipt.coverage,
      elementRefs: [...ids.values()], nonPersistentReason: receipt.nonPersistentReason };
  });
  let elements = [...previous.elements, ...additions];
  const touched = new Set<string>();
  for (const d of result.dispositions) {
    const target = previous.elements.find(e => e.ref === d.elementRef && active(e));
    const replacement = additions.find(e => e.id === d.replacementId && e.sourceTurnRef === input.userTurn.turnId);
    if (!target) rejectRetention("result.dispositions[].elementRef", "MISSING_OR_INACTIVE_TARGET", "DISPOSITION_TARGET_ACTIVE_PREVIOUS_MEANING", "DISPOSITION_TARGET");
    if (touched.has(d.elementRef)) rejectRetention("result.dispositions[].elementRef", "DUPLICATE_DISPOSITION", "ONE_DISPOSITION_PER_ELEMENT", "DISPOSITION_DUPLICATE");
    if (d.status === "SUPERSEDED" ? !replacement : d.replacementId !== null)
      rejectRetention("result.dispositions[].replacementId", d.status === "SUPERSEDED" ? "MISSING_USER_REPLACEMENT" : "UNEXPECTED_REPLACEMENT",
        "SUPERSEDED_REQUIRES_NEW_USER_REPLACEMENT_OTHER_DISPOSITIONS_REQUIRE_NULL", "DISPOSITION_REPLACEMENT");
    touched.add(d.elementRef);
    elements = elements.map(e => e.ref === d.elementRef ? { ...e, status: d.status,
      dispositionSourceRef: input.userTurn.turnId, replacementRef: replacement?.ref ?? null } : e);
  }
  for (const b of result.candidateBindings) {
    const target = elements.find(e => e.ref === b.elementRef && active(e));
    const candidate = input.retained.find(c => c.candidateRef === b.candidateRef && c.validation.valid && !c.validation.blocks.length
      && c.actuality === "CURRENT" && c.candidateDigest === logicalDigest({ contribution: c.contribution, candidate: c.candidate }));
    const change = candidate?.candidate.canonicalChangeSet.objectChanges.find(c => c.changeRef === b.changeRef);
    if (!target) rejectRetention("result.candidateBindings[].elementRef", "MISSING_OR_INACTIVE_TARGET", "CANDIDATE_BINDING_TARGET_ACTIVE", "CANDIDATE_TARGET");
    if (!change?.candidate) rejectRetention("result.candidateBindings[].changeRef", "MISSING_OR_INVALID_NATIVE_CANDIDATE", "BINDING_HAS_VALID_CURRENT_NATIVE_CHANGE", "CANDIDATE_CHANGE");
    if (![...change.candidate.provenance.sourceTurnRefs, ...change.candidate.provenance.proposalSourceTurnRefs].includes(target.sourceTurnRef))
      rejectRetention("result.candidateBindings[].elementRef", "SOURCE_BINDING_MISMATCH", "NATIVE_CHANGE_BOUND_TO_MEANING_SOURCE", "CANDIDATE_SOURCE");
    if (change.operation === "REMOVE") rejectRetention("result.candidateBindings[].changeRef", "REMOVE_OPERATION", "CANDIDATE_BINDING_NOT_REMOVAL", "CANDIDATE_OPERATION");
    elements = elements.map(e => e.ref === b.elementRef ? { ...e, candidateBinding: { candidateRef: b.candidateRef, changeRef: b.changeRef } } : e);
  }
  const next: ScientificDiscussionRetention = { ...previous, sourceCoverage: [...previous.sourceCoverage, ...receipts], elements };
  if (!validateScientificDiscussionRetention(next, input.conversationId, input.runtimeTurns, observeStateFailure))
    throw new ScientificDiscussionRetentionError(stateFailure!);
  return next;
};

// A semantic binding alone does NOT adopt. Both the existing human receipt and
// the exact current native object version must agree before omitting duplication.
export const retainedDiscussionElementAdopted = (e: RetainedDiscussionElement,
  retained: readonly RetainedContributionCandidate[], project: ResearchProjectOwnerProjection | null) => {
  if (!e.candidateBinding || !project) return false;
  const c = retained.find(c => c.candidateRef === e.candidateBinding!.candidateRef);
  if (!c?.validation.valid || c.validation.blocks.length || c.candidateDigest !== logicalDigest({ contribution: c.contribution, candidate: c.candidate })
    || c.humanDecision?.status !== "ADOPTED" || !c.humanDecision.targets.includes(c.candidateRef)) return false;
  const object = c.candidate.canonicalChangeSet.objectChanges.find(change => change.changeRef === e.candidateBinding!.changeRef)?.candidate;
  return Boolean(object && buildProjectContextSnapshot({ project }).objects.some(current => current.stableId === object.objectId
    && current.decisionRefs.includes(c.humanDecision!.decisionId)));
};

export const activeScientificDiscussionRetention = (state: ScientificDiscussionRetention,
  retained: readonly RetainedContributionCandidate[], project: ResearchProjectOwnerProjection | null,
  composition?: StudyProposalComposition | null) => {
  const elements = new Map(state.elements.map(e => [e.ref, e]));
  const adopted = (e: RetainedDiscussionElement) => retainedDiscussionElementAdopted(e, retained, project)
    || retainedDiscussionProposalAdopted(e, project, composition);
  const effectiveLinks = (ref: string, visited = new Set<string>()): string[] => {
    if (visited.has(ref)) fail(); visited.add(ref);
    const e = elements.get(ref); if (!e) return fail();
    if (e.status === "SUPERSEDED" && e.replacementRef) return effectiveLinks(e.replacementRef, visited);
    if (!active(e) && e.status !== "ADOPTED") throw new Error("SCIENTIFIC_DISCUSSION_DEPENDENCY_UNRESOLVED");
    if (e.status !== "ADOPTED" && !adopted(e)) return [ref];
    const sources = e.proposalBinding?.atomRefs.flatMap(ref => composition?.adoptionSourceRefs?.[ref] ?? []) ?? [];
    const binding = e.candidateBinding && retained.find(c => c.candidateRef === e.candidateBinding!.candidateRef);
    const objectId = binding && binding.candidate.canonicalChangeSet.objectChanges.find(c => c.changeRef === e.candidateBinding!.changeRef)?.objectId;
    if (!project) throw new Error("SCIENTIFIC_DISCUSSION_DEPENDENCY_UNRESOLVED");
    const targets = buildProjectContextSnapshot({ project }).objects.filter(o => o.stableId === objectId
      || o.sourceItemRefs.some(ref => sources.includes(ref))).map(o => o.stableId);
    if (!targets.length) throw new Error("SCIENTIFIC_DISCUSSION_DEPENDENCY_UNRESOLVED");
    return targets;
  };
  return state.elements.filter(e => active(e) && !adopted(e))
    .map(({ ref, content, epistemicState, polarity, conditions, linkedRefs, sourceTurnRef, sourceDigest }) => ({
      ref, content, epistemicState, polarity, conditions, linkedRefs: linkedRefs.flatMap(ref => effectiveLinks(ref)), sourceTurnRef, sourceDigest,
      status: "NOT_ADOPTED" as const,
    }));
};

export const retainedDiscussionProposalBindingsSchema = z.array(z.object({
  elementRef: ref, atomRefs: z.array(ref).min(1), sourceTurnRef: ref,
}).strict());
export type RetainedDiscussionProposalBindings = z.infer<typeof retainedDiscussionProposalBindingsSchema>;

/** Semantic correspondence comes from the existing Working Draft ST operation,
 * not a local text matcher. Human review/materialization remain their owners. */
export const bindRetainedDiscussionProposal = (state: ScientificDiscussionRetention | undefined,
  composition: StudyProposalComposition, bindings: RetainedDiscussionProposalBindings): ScientificDiscussionRetention | undefined => {
  if (!state) { if (bindings.length) fail(); return state; }
  const refs = new Set<string>();
  for (const b of retainedDiscussionProposalBindingsSchema.parse(bindings)) {
    const e = state.elements.find(e => e.ref === b.elementRef && active(e));
    if (!e || refs.has(b.elementRef) || e.sourceTurnRef !== b.sourceTurnRef
      || new Set(b.atomRefs).size !== b.atomRefs.length
      || b.atomRefs.some(ref => !composition.proposal.atoms.some(a => a.ref === ref))) fail();
    refs.add(b.elementRef);
  }
  return { ...state, elements: state.elements.map(e => {
    const b = bindings.find(b => b.elementRef === e.ref);
    return b ? { ...e, proposalBinding: { proposalRef: composition.proposalRef, atomRefs: [...b.atomRefs] } } : e;
  }) };
};

const retainedDiscussionProposalAdopted = (e: RetainedDiscussionElement,
  project: ResearchProjectOwnerProjection | null, composition?: StudyProposalComposition | null) => {
  const b = e.proposalBinding;
  if (!b || !project || !composition || composition.proposalRef !== b.proposalRef
    || composition.sourceProject?.projectDigest !== project.projectDigest
    || composition.sourceProject?.versionId !== project.versionId) return false;
  const snapshot = buildProjectContextSnapshot({ project });
  return b.atomRefs.length > 0 && b.atomRefs.every(ref => {
    const sources = composition.adoptionSourceRefs?.[ref];
    return composition.adoptedAtomRefs.includes(ref) && Boolean(sources?.length)
      && sources!.every(source => snapshot.objects.some(o => o.sourceItemRefs.includes(source)));
  });
};

/** Persist the transfer as a lifecycle fact. A subsequent Project replacement
 * cannot resurrect this old meaning as a non-adopted active contribution. */
export const settleRetainedDiscussionAdoption = (state: ScientificDiscussionRetention | undefined,
  project: ResearchProjectOwnerProjection, retained: readonly RetainedContributionCandidate[],
  composition?: StudyProposalComposition | null): ScientificDiscussionRetention | undefined => state ? ({
  ...state, elements: state.elements.map(e => active(e) && (retainedDiscussionElementAdopted(e, retained, project)
    || retainedDiscussionProposalAdopted(e, project, composition)) ? { ...e, status: "ADOPTED",
      adoption: { projectId: project.projectId, projectVersion: project.versionId, decisionRef: project.confirmationDecision.decisionId } } : e),
}) : state;

/** Only the typed, UI-generated confirmation acknowledgement, not arbitrary
 * user prose. Its meaning is the already committed native human decision. */
export const recordGovernedAdoptionContextEvent = (state: ScientificDiscussionRetention | undefined,
  project: ResearchProjectOwnerProjection, turns: readonly Turn[]): ScientificDiscussionRetention | undefined => {
  if (!state) return state; // Never reconstruct historical source coverage.
  const decision = project.confirmationDecision;
  if (decision.status !== "ADOPTED" || !decision.actor || !decision.mandate || !decision.timestamp) fail();
  if (turns.some(t => state.sourceCoverage.some(s => s.turnRef === t.turnId))) fail();
  return { ...state, sourceCoverage: [...state.sourceCoverage, ...turns.map(turn => ({
    turnRef: turn.turnId, sourceDigest: logicalDigest(turn.content), coverage: "COMPLETE" as const, elementRefs: [],
    nonPersistentReason: "GOVERNED_OWNER_EVENT" as const, classificationOwner: "RESEARCH_PROJECT" as const,
    ownerEventRef: decision.decisionId,
  }))] };
};

export const TERRA_RETENTION_INSTRUCTION = `\nRetourne l'enveloppe structurée demandée, avec reply contenant uniquement la réponse française naturelle visible.
SCIENTIFIC_THINKING porte la qualification sémantique de chaque source : classifie exhaustivement le dernier USER et ta réponse en éléments scientifiques minimum suffisants, ou déclare explicitement NO_SCIENTIFIC_MEANING/PRESENTATION_ONLY. Pas de copie systématique du texte complet, pas de résumé du transcript ni de nouvelle synthèse du Project. Conserve chaque négation, condition, incertitude et relation matérielle. Un fragment adopté ne couvre pas le reste du message. Si la couverture est incertaine, déclare PARTIAL/UNKNOWN ; ne prétends jamais COMPLETE par défaut. Une suggestion NOXIA reste PROPOSED_NOT_ADOPTED.
Les dispositions ne concernent que les refs actives fournies et une direction USER explicite dans ce tour ; une absence, ancienneté, silence ou simple similarité ne ferme jamais une contribution. SUPERSEDED exige replacementId d'un nouvel élément USER. Une fermeture partielle n'élimine pas les autres éléments. candidateBindings exprime une correspondance sémantique précise avec un changement natif validé déjà fourni, ancré à la même source ; ce lien n'adopte rien. Aucun write Project/QRY/Review/DOC. Aucun contenu historique clos dans la réponse nominale.`;
