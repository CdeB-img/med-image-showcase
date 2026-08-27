import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import { applyCriticRepairs, type CriticRepairDiagnostic } from "./coverage.js";
import {
  PROVIDER_EPISTEMIC_STATUSES,
  SEMANTIC_ELEMENT_TYPES,
  SEMANTIC_POLARITIES,
  SEMANTIC_STUDY_ROLES,
  type SemanticCriticRepair,
  type SemanticElementType,
  type SemanticPolarity,
  type SemanticProviderAttempt,
  type SemanticProviderMetadata,
  type SemanticReconstructionCandidate,
  type SemanticReconstructionRequest,
  type SemanticStudyRole,
} from "./types.js";

export const SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION = "SEM-001-ATOMIC-COMPOSITION-1.1" as const;
export const SEMANTIC_ATOMIC_COMPOSITION_ACCEPTANCE_GUARD_VERSION = "SEM-001-ATOMIC-COMPOSITION-ACCEPTANCE-GUARD-1.0" as const;

const constituentSchema = z.object({
  constituentId: z.string().min(1).max(120),
  sourceMessageId: z.string().min(1).max(120),
  sourceText: z.string().min(1).max(1_000),
  normalizedMeaning: z.string().min(1).max(500),
  semanticType: z.enum(SEMANTIC_ELEMENT_TYPES),
  studyRole: z.enum(SEMANTIC_STUDY_ROLES),
  polarity: z.enum(SEMANTIC_POLARITIES),
}).strict();

const directRelationSchema = z.object({
  sourceConstituentId: z.string().min(1).max(120),
  targetConstituentId: z.string().min(1).max(120),
  sourceMessageId: z.string().min(1).max(120),
  sourceText: z.string().min(1).max(1_000),
  relationType: z.string().min(1).max(160),
  polarity: z.enum(SEMANTIC_POLARITIES),
}).strict();

const atomicityTransportReportSchema = z.object({
  reportId: z.string().min(1).max(120),
  subjectInventoryItemIds: z.array(z.string().min(1).max(120)).min(1).max(20),
  status: z.enum(["COMPLETE", "INCOMPLETE", "NOT_APPLICABLE", "AMBIGUOUS"]),
  constituents: z.array(constituentSchema).max(20),
  directRelations: z.array(directRelationSchema).max(30),
  reason: z.string().min(1).max(1_000),
}).strict();

const atomicityReportSchema = atomicityTransportReportSchema.superRefine((report, context) => {
  const constituentIds = report.constituents.map((item) => item.constituentId);
  if (new Set(constituentIds).size !== constituentIds.length) {
    context.addIssue({ code: "custom", message: "DUPLICATE_CONSTITUENT_ID", path: ["constituents"] });
  }
  const known = new Set(constituentIds);
  report.directRelations.forEach((relation, index) => {
    if (!known.has(relation.sourceConstituentId) || !known.has(relation.targetConstituentId)) {
      context.addIssue({ code: "custom", message: "ATOMIC_RELATION_ENDPOINT_UNKNOWN", path: ["directRelations", index] });
    }
  });
  if (report.status === "INCOMPLETE" && report.constituents.length < 2) {
    context.addIssue({ code: "custom", message: "INCOMPLETE_ATOMICITY_REQUIRES_INDEPENDENT_CONSTITUENTS", path: ["constituents"] });
  }
  if (report.status === "COMPLETE" && report.constituents.length > 0 && report.constituents.length < 2) {
    context.addIssue({ code: "custom", message: "COMPLETE_ATOMICITY_EVIDENCE_REQUIRES_INDEPENDENT_CONSTITUENTS", path: ["constituents"] });
  }
  if (report.status === "NOT_APPLICABLE" && (report.constituents.length || report.directRelations.length)) {
    context.addIssue({ code: "custom", message: "NOT_APPLICABLE_ATOMICITY_MUST_NOT_INVENT_CONSTITUENTS", path: ["status"] });
  }
});

const compositeSchema = z.object({
  compositeId: z.string().min(1).max(120),
  sourceMessageId: z.string().min(1).max(120),
  sourceText: z.string().min(1).max(1_000),
  normalizedMeaning: z.string().min(1).max(500),
  semanticType: z.enum(SEMANTIC_ELEMENT_TYPES),
  studyRole: z.enum(SEMANTIC_STUDY_ROLES),
  polarity: z.enum(SEMANTIC_POLARITIES),
}).strict();

const compositeRelationTransportSchema = z.object({
  sourceInventoryItemId: z.string().min(1).max(120).nullable(),
  sourceIsComposite: z.boolean(),
  targetInventoryItemId: z.string().min(1).max(120).nullable(),
  targetIsComposite: z.boolean(),
  sourceMessageId: z.string().min(1).max(120),
  sourceText: z.string().min(1).max(1_000),
  relationType: z.string().min(1).max(160),
  polarity: z.enum(SEMANTIC_POLARITIES),
}).strict();

const compositeRelationSchema = compositeRelationTransportSchema.superRefine((relation, context) => {
  if (relation.sourceIsComposite === Boolean(relation.sourceInventoryItemId)) {
    context.addIssue({ code: "custom", message: "COMPOSITE_RELATION_SOURCE_MUST_SELECT_ONE_ENDPOINT", path: ["sourceIsComposite"] });
  }
  if (relation.targetIsComposite === Boolean(relation.targetInventoryItemId)) {
    context.addIssue({ code: "custom", message: "COMPOSITE_RELATION_TARGET_MUST_SELECT_ONE_ENDPOINT", path: ["targetIsComposite"] });
  }
  if (relation.sourceIsComposite && relation.targetIsComposite) {
    context.addIssue({ code: "custom", message: "COMPOSITE_RELATION_CANNOT_BE_SELF_RELATION", path: ["targetIsComposite"] });
  }
});

const compositionTransportReportSchema = z.object({
  reportId: z.string().min(1).max(120),
  sourceInventoryItemIds: z.array(z.string().min(1).max(120)).min(1).max(30),
  status: z.enum(["COMPLETE", "INCOMPLETE", "NOT_REQUIRED", "AMBIGUOUS"]),
  composite: compositeSchema.nullable(),
  relations: z.array(compositeRelationTransportSchema).max(30),
  reason: z.string().min(1).max(1_000),
}).strict();

const compositionReportSchema = compositionTransportReportSchema.superRefine((report, context) => {
  if (report.status === "INCOMPLETE" && !report.composite) {
    context.addIssue({ code: "custom", message: "INCOMPLETE_COMPOSITION_REQUIRES_COMPOSITE", path: ["composite"] });
  }
  if (report.status === "COMPLETE" && !report.composite) {
    context.addIssue({ code: "custom", message: "COMPLETE_COMPOSITION_REQUIRES_EXISTING_COMPOSITE_EVIDENCE", path: ["composite"] });
  }
  if (report.status === "NOT_REQUIRED" && (report.composite || report.relations.length)) {
    context.addIssue({ code: "custom", message: "NOT_REQUIRED_COMPOSITION_MUST_NOT_INVENT_COMPOSITE", path: ["composite"] });
  }
  report.relations.forEach((relation, index) => {
    const parsed = compositeRelationSchema.safeParse(relation);
    if (!parsed.success) parsed.error.issues.forEach((issue) => context.addIssue({ code: "custom", message: issue.message, path: ["relations", index, ...issue.path] }));
  });
});

const routeAssessmentTransportSchema = z.object({
  status: z.enum(["CORRECT", "INCORRECT", "UNCERTAIN"]),
  proposedRoute: z.enum(["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE"]).nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(1_000),
  expectedCapabilities: z.array(z.string().min(1).max(120)).max(20),
}).strict();

const routeAssessmentSchema = routeAssessmentTransportSchema.superRefine((assessment, context) => {
  if (assessment.status === "INCORRECT" && !assessment.proposedRoute) {
    context.addIssue({ code: "custom", message: "INCORRECT_ROUTE_REQUIRES_PROPOSAL", path: ["proposedRoute"] });
  }
  if (assessment.status !== "INCORRECT" && assessment.proposedRoute) {
    context.addIssue({ code: "custom", message: "ROUTE_PROPOSAL_ONLY_ALLOWED_FOR_INCORRECT_ROUTE", path: ["proposedRoute"] });
  }
});

export const semanticAtomicCompositionTransportSchema = z.object({
  auditId: z.string().min(1).max(120),
  schemaVersion: z.literal(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION),
  verdict: z.enum(["ACCEPT", "REVISE", "CLARIFICATION_REQUIRED"]),
  atomicityReports: z.array(atomicityTransportReportSchema).min(1).max(30),
  compositionReports: z.array(compositionTransportReportSchema).min(1).max(30),
  routeAssessment: routeAssessmentTransportSchema,
  summary: z.string().min(1).max(2_000),
}).strict();

export const semanticAtomicCompositionAuditSchema = semanticAtomicCompositionTransportSchema.superRefine((audit, context) => {
  audit.atomicityReports.forEach((report, index) => {
    const parsed = atomicityReportSchema.safeParse(report);
    if (!parsed.success) parsed.error.issues.forEach((issue) => context.addIssue({ code: "custom", message: issue.message, path: ["atomicityReports", index, ...issue.path] }));
  });
  audit.compositionReports.forEach((report, index) => {
    const parsed = compositionReportSchema.safeParse(report);
    if (!parsed.success) parsed.error.issues.forEach((issue) => context.addIssue({ code: "custom", message: issue.message, path: ["compositionReports", index, ...issue.path] }));
  });
  const route = routeAssessmentSchema.safeParse(audit.routeAssessment);
  if (!route.success) route.error.issues.forEach((issue) => context.addIssue({ code: "custom", message: issue.message, path: ["routeAssessment", ...issue.path] }));
  const unresolved = [...audit.atomicityReports, ...audit.compositionReports].some((item) => item.status === "INCOMPLETE");
  const ambiguous = [...audit.atomicityReports, ...audit.compositionReports].some((item) => item.status === "AMBIGUOUS") || audit.routeAssessment.status === "UNCERTAIN";
  if (audit.verdict === "ACCEPT" && (unresolved || ambiguous || audit.routeAssessment.status === "INCORRECT")) {
    context.addIssue({ code: "custom", message: "AUDIT_ACCEPT_INCONSISTENT", path: ["verdict"] });
  }
  if (audit.verdict === "REVISE" && !unresolved && audit.routeAssessment.status !== "INCORRECT") {
    context.addIssue({ code: "custom", message: "AUDIT_REVISE_WITHOUT_REPAIR", path: ["verdict"] });
  }
  if (audit.verdict === "CLARIFICATION_REQUIRED" && !ambiguous) {
    context.addIssue({ code: "custom", message: "AUDIT_CLARIFICATION_WITHOUT_AMBIGUITY", path: ["verdict"] });
  }
});

export type SemanticAtomicCompositionTransport = z.infer<typeof semanticAtomicCompositionTransportSchema>;
export type SemanticAtomicCompositionAudit = z.infer<typeof semanticAtomicCompositionAuditSchema>;
export type SemanticAtomicityReport = SemanticAtomicCompositionAudit["atomicityReports"][number];
export type SemanticCompositionReport = SemanticAtomicCompositionAudit["compositionReports"][number];

const stringArray = { type: "array", items: { type: "string" } } as const;
const jsonObject = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: "object", properties, required, additionalProperties: false });
const constituentJsonSchema = jsonObject({
  constituentId: { type: "string" }, sourceMessageId: { type: "string" }, sourceText: { type: "string" }, normalizedMeaning: { type: "string" },
  semanticType: { type: "string", enum: SEMANTIC_ELEMENT_TYPES }, studyRole: { type: "string", enum: SEMANTIC_STUDY_ROLES }, polarity: { type: "string", enum: SEMANTIC_POLARITIES },
});
const directRelationJsonSchema = jsonObject({
  sourceConstituentId: { type: "string" }, targetConstituentId: { type: "string" }, sourceMessageId: { type: "string" }, sourceText: { type: "string" }, relationType: { type: "string" }, polarity: { type: "string", enum: SEMANTIC_POLARITIES },
});
const compositeJsonSchema = jsonObject({
  compositeId: { type: "string" }, sourceMessageId: { type: "string" }, sourceText: { type: "string" }, normalizedMeaning: { type: "string" },
  semanticType: { type: "string", enum: SEMANTIC_ELEMENT_TYPES }, studyRole: { type: "string", enum: SEMANTIC_STUDY_ROLES }, polarity: { type: "string", enum: SEMANTIC_POLARITIES },
});
const compositeRelationJsonSchema = jsonObject({
  sourceInventoryItemId: { anyOf: [{ type: "string" }, { type: "null" }] }, sourceIsComposite: { type: "boolean" },
  targetInventoryItemId: { anyOf: [{ type: "string" }, { type: "null" }] }, targetIsComposite: { type: "boolean" },
  sourceMessageId: { type: "string" }, sourceText: { type: "string" }, relationType: { type: "string" }, polarity: { type: "string", enum: SEMANTIC_POLARITIES },
});

export const SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA = jsonObject({
  auditId: { type: "string" },
  schemaVersion: { type: "string", enum: [SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION] },
  verdict: { type: "string", enum: ["ACCEPT", "REVISE", "CLARIFICATION_REQUIRED"] },
  atomicityReports: { type: "array", minItems: 1, items: jsonObject({
    reportId: { type: "string" }, subjectInventoryItemIds: stringArray, status: { type: "string", enum: ["COMPLETE", "INCOMPLETE", "NOT_APPLICABLE", "AMBIGUOUS"] },
    constituents: { type: "array", items: constituentJsonSchema }, directRelations: { type: "array", items: directRelationJsonSchema }, reason: { type: "string" },
  }) },
  compositionReports: { type: "array", minItems: 1, items: jsonObject({
    reportId: { type: "string" }, sourceInventoryItemIds: stringArray, status: { type: "string", enum: ["COMPLETE", "INCOMPLETE", "NOT_REQUIRED", "AMBIGUOUS"] },
    composite: { anyOf: [compositeJsonSchema, { type: "null" }] }, relations: { type: "array", items: compositeRelationJsonSchema }, reason: { type: "string" },
  }) },
  routeAssessment: jsonObject({
    status: { type: "string", enum: ["CORRECT", "INCORRECT", "UNCERTAIN"] }, proposedRoute: { anyOf: [{ type: "string", enum: ["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE"] }, { type: "null" }] },
    confidence: { type: "number", minimum: 0, maximum: 1 }, reason: { type: "string" }, expectedCapabilities: stringArray,
  }),
  summary: { type: "string" },
});

export const parseSemanticAtomicCompositionTransport = (value: unknown) => semanticAtomicCompositionTransportSchema.parse(value);
export const parseSemanticAtomicCompositionAudit = (value: unknown) => semanticAtomicCompositionAuditSchema.parse(value);

export type AtomicCompositionAcceptanceCheck =
  | "ATOMIC_CONSTITUENTS_REPRESENTED"
  | "DIRECT_REQUIRED_RELATIONS_REPRESENTED"
  | "REQUIRED_COMPOSITE_REPRESENTED"
  | "AUDIT_FINDINGS_CONSISTENT_WITH_STATUS";

export type AtomicCompositionAcceptanceDiagnostic = {
  reportId: string;
  scope: "ATOMICITY" | "COMPOSITION";
  originalStatus: SemanticAtomicityReport["status"] | SemanticCompositionReport["status"];
  effectiveStatus: SemanticAtomicityReport["status"] | SemanticCompositionReport["status"];
  checks: Record<AtomicCompositionAcceptanceCheck, "PASS" | "FAIL" | "NOT_APPLICABLE" | "UNKNOWN">;
  disposition: "UNCHANGED" | "AUDIT_STATUS_INCONSISTENT" | "AMBIGUOUS_NO_REPAIR";
  reason: string;
};

const compatibleElement = (
  candidate: SemanticReconstructionCandidate,
  finding: { sourceMessageId?: string; sourceText?: string; semanticType?: SemanticElementType; studyRole?: SemanticStudyRole; polarity?: SemanticPolarity },
) => finding.sourceMessageId && finding.sourceText && finding.semanticType && finding.studyRole && finding.polarity
  ? candidate.elements.find((element) => element.sourceMessageId === finding.sourceMessageId
  && element.sourceText === finding.sourceText
  && element.type === finding.semanticType
  && element.studyRole === finding.studyRole
  && element.polarity === finding.polarity
  && element.epistemicStatus === "EXPLICIT_USER_STATED")
  : undefined;

const directRelationRepresented = (
  candidate: SemanticReconstructionCandidate,
  sourceClientElementIds: string[],
  targetClientElementIds: string[],
  relationType: string,
  polarity: SemanticPolarity,
) => candidate.relations.some((relation) => sourceClientElementIds.includes(relation.sourceClientElementId)
  && targetClientElementIds.includes(relation.targetClientElementId)
  && relation.relationType === relationType
  && relation.polarity === polarity
  && relation.epistemicStatus === "EXPLICIT_USER_STATED");

type ExplicitCompositeMethodFinding = {
  composite: NonNullable<SemanticCompositionReport["composite"]>;
  relations: SemanticCompositionReport["relations"];
};

const compositeMethodCarrierTypes = new Set<SemanticElementType>(["METHOD", "MODALITY"]);
const compositeMethodQualifierTypes = new Set<SemanticElementType>(["TIMING", "CONDITION", "CONSTRAINT"]);
const sourceGapIsStructural = (value: string) => /^[\s,;:()[\]{}/+&-]*$/u.test(value);
const acquisitionQualifierRole = (value: string) => /\b(acquisition|timing|phase|sequence|parameter|setting|qualifier)\b|\b(measurement|technical|protocol) (condition|constraint)\b/i.test(value);

const exactSourceEnvelope = (
  request: SemanticReconstructionRequest,
  fragments: Array<{ sourceMessageId: string; sourceText: string }>,
) => {
  const messageId = fragments[0]?.sourceMessageId;
  if (!messageId || fragments.some((fragment) => fragment.sourceMessageId !== messageId)) return null;
  const message = request.messages.find((item) => item.role === "USER" && item.messageId === messageId);
  if (!message) return null;
  const spans = fragments.map((fragment) => {
    const start = message.content.indexOf(fragment.sourceText);
    if (start < 0 || start !== message.content.lastIndexOf(fragment.sourceText)) return null;
    return { start, end: start + fragment.sourceText.length };
  });
  if (spans.some((span) => !span)) return null;
  const ordered = (spans as Array<{ start: number; end: number }>).sort((left, right) => left.start - right.start);
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].start < ordered[index - 1].end
      || !sourceGapIsStructural(message.content.slice(ordered[index - 1].end, ordered[index].start))) return null;
  }
  return {
    sourceMessageId: messageId,
    sourceText: message.content.slice(ordered[0].start, ordered.at(-1)!.end),
    start: ordered[0].start,
    end: ordered.at(-1)!.end,
  };
};

const inventoryItemsAreConnected = (
  candidate: SemanticReconstructionCandidate,
  inventoryItemIds: string[],
) => {
  const selected = new Set(inventoryItemIds);
  const inventoryById = new Map(candidate.semanticInventory.explicitFragments.map((item) => [item.inventoryItemId, item]));
  const visited = new Set<string>();
  const pending = [inventoryItemIds[0]];
  while (pending.length) {
    const current = pending.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const fragment = inventoryById.get(current);
    const neighbours = new Set(fragment?.linkedInventoryItemIds.filter((id) => selected.has(id)) ?? []);
    candidate.semanticInventory.explicitFragments.forEach((item) => {
      if (selected.has(item.inventoryItemId) && item.linkedInventoryItemIds.includes(current)) neighbours.add(item.inventoryItemId);
    });
    candidate.semanticInventory.explicitRelations.forEach((relation) => {
      if (relation.sourceInventoryItemId === current && selected.has(relation.targetInventoryItemId)) neighbours.add(relation.targetInventoryItemId);
      if (relation.targetInventoryItemId === current && selected.has(relation.sourceInventoryItemId)) neighbours.add(relation.sourceInventoryItemId);
    });
    neighbours.forEach((id) => { if (!visited.has(id)) pending.push(id); });
  }
  return visited.size === selected.size;
};

const explicitCompositeMethodAlreadyRepresented = (
  candidate: SemanticReconstructionCandidate,
  sourceInventoryItemIds: string[],
  envelope: NonNullable<ReturnType<typeof exactSourceEnvelope>>,
) => candidate.elements.some((element) => {
  if (element.type !== "METHOD" || element.epistemicStatus !== "EXPLICIT_USER_STATED") return false;
  if (element.sourceMessageId === envelope.sourceMessageId && element.sourceText === envelope.sourceText) return true;
  const backingFragments = element.inventoryItemIds
    .map((id) => candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return backingFragments.some((fragment) => sourceInventoryItemIds.every((id) => fragment.linkedInventoryItemIds.includes(id)))
    || sourceInventoryItemIds.every((id) => element.inventoryItemIds.includes(id));
});

const explicitCompositeMethodFinding = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
  report: SemanticCompositionReport,
): { disposition: "REQUIRED_MISSING"; finding: ExplicitCompositeMethodFinding }
  | { disposition: "REQUIRED_REPRESENTED" | "NO_STRUCTURED_PROOF"; finding: null } => {
  if (report.status !== "NOT_REQUIRED" || report.sourceInventoryItemIds.length < 2) {
    return { disposition: "NO_STRUCTURED_PROOF", finding: null };
  }
  const inventoryById = new Map(candidate.semanticInventory.explicitFragments.map((item) => [item.inventoryItemId, item]));
  const fragments = report.sourceInventoryItemIds.map((id) => inventoryById.get(id));
  if (fragments.some((item) => !item)) return { disposition: "NO_STRUCTURED_PROOF", finding: null };
  const typedComponents = report.sourceInventoryItemIds.map((inventoryItemId) => candidate.elements.find((element) =>
    element.inventoryItemIds.includes(inventoryItemId)
    && element.epistemicStatus === "EXPLICIT_USER_STATED"
    && !element.requiresConfirmation));
  if (typedComponents.some((item) => !item)
    || !typedComponents.some((item) => item && compositeMethodCarrierTypes.has(item.type))
    || !typedComponents.some((item, index) => item
      && compositeMethodQualifierTypes.has(item.type)
      && acquisitionQualifierRole(normalizedSemanticDescriptor(fragments[index]?.localRole, ...(fragments[index]?.modifiers ?? []))))) {
    return { disposition: "NO_STRUCTURED_PROOF", finding: null };
  }
  const polarities = new Set(typedComponents.map((item) => item!.polarity));
  const envelope = exactSourceEnvelope(request, fragments as NonNullable<(typeof fragments)[number]>[]);
  if (polarities.size !== 1 || !envelope || !inventoryItemsAreConnected(candidate, report.sourceInventoryItemIds)) {
    return { disposition: "NO_STRUCTURED_PROOF", finding: null };
  }
  if (explicitCompositeMethodAlreadyRepresented(candidate, report.sourceInventoryItemIds, envelope)) {
    return { disposition: "REQUIRED_REPRESENTED", finding: null };
  }
  const carrier = typedComponents.find((item) => item && compositeMethodCarrierTypes.has(item.type))!;
  const polarity = carrier.polarity;
  const normalizedMeaning = (fragments as NonNullable<(typeof fragments)[number]>[])
    .sort((left, right) => envelope.sourceText.indexOf(left.sourceText) - envelope.sourceText.indexOf(right.sourceText))
    .map((item) => item.normalizedLabel)
    .join(" ");
  const composite: NonNullable<SemanticCompositionReport["composite"]> = {
    compositeId: stableId("explicit-composite-method", { sourceInventoryItemIds: report.sourceInventoryItemIds, envelope }),
    sourceMessageId: envelope.sourceMessageId,
    sourceText: envelope.sourceText,
    normalizedMeaning,
    semanticType: "METHOD",
    studyRole: carrier.studyRole,
    polarity,
  };
  const relations: SemanticCompositionReport["relations"] = report.sourceInventoryItemIds.map((targetInventoryItemId) => ({
    sourceInventoryItemId: null,
    sourceIsComposite: true,
    targetInventoryItemId,
    targetIsComposite: false,
    sourceMessageId: envelope.sourceMessageId,
    sourceText: envelope.sourceText,
    relationType: "COMPOSES",
    polarity,
  }));
  const selected = new Set(report.sourceInventoryItemIds);
  candidate.relations.filter((relation) => relation.epistemicStatus === "EXPLICIT_USER_STATED").forEach((relation) => {
    const sourceElement = candidate.elements.find((item) => item.clientElementId === relation.sourceClientElementId);
    const targetElement = candidate.elements.find((item) => item.clientElementId === relation.targetClientElementId);
    const sourceSelected = sourceElement?.inventoryItemIds.some((id) => selected.has(id)) ?? false;
    const targetSelected = targetElement?.inventoryItemIds.some((id) => selected.has(id)) ?? false;
    if (sourceSelected === targetSelected) return;
    const inventoryRelation = relation.inventoryRelationIds
      .map((id) => candidate.semanticInventory.explicitRelations.find((item) => item.inventoryRelationId === id))
      .find((item) => item && (selected.has(item.sourceInventoryItemId) !== selected.has(item.targetInventoryItemId)));
    if (!inventoryRelation) return;
    const externalInventoryItemId = selected.has(inventoryRelation.sourceInventoryItemId)
      ? inventoryRelation.targetInventoryItemId
      : inventoryRelation.sourceInventoryItemId;
    const externalFragment = inventoryById.get(externalInventoryItemId);
    if (!externalFragment) return;
    const relationEnvelope = exactSourceEnvelope(request, [...fragments as NonNullable<(typeof fragments)[number]>[], externalFragment]);
    if (!relationEnvelope) return;
    relations.push({
      sourceInventoryItemId: sourceSelected ? null : externalInventoryItemId,
      sourceIsComposite: sourceSelected,
      targetInventoryItemId: targetSelected ? null : externalInventoryItemId,
      targetIsComposite: targetSelected,
      sourceMessageId: relationEnvelope.sourceMessageId,
      sourceText: relationEnvelope.sourceText,
      relationType: relation.relationType,
      polarity: relation.polarity,
    });
  });
  return { disposition: "REQUIRED_MISSING", finding: { composite, relations } };
};

export const enforceAtomicCompositionAcceptanceConsistency = (
  candidate: SemanticReconstructionCandidate,
  audit: SemanticAtomicCompositionAudit,
  request?: SemanticReconstructionRequest,
): {
  audit: SemanticAtomicCompositionAudit;
  diagnostics: AtomicCompositionAcceptanceDiagnostic[];
  changed: boolean;
  acceptAllowed: boolean;
} => {
  let changed = false;
  const diagnostics: AtomicCompositionAcceptanceDiagnostic[] = [];
  const atomicityReports = audit.atomicityReports.map((report): SemanticAtomicityReport => {
    if (report.status === "AMBIGUOUS") {
      diagnostics.push({
        reportId: report.reportId, scope: "ATOMICITY", originalStatus: report.status, effectiveStatus: report.status,
        checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "UNKNOWN", DIRECT_REQUIRED_RELATIONS_REPRESENTED: "UNKNOWN", REQUIRED_COMPOSITE_REPRESENTED: "NOT_APPLICABLE", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "UNKNOWN" },
        disposition: "AMBIGUOUS_NO_REPAIR", reason: "Ambiguous findings cannot authorize deterministic constituent creation.",
      });
      return report;
    }
    const evidenceRequiresRepresentation = report.status === "COMPLETE" && report.constituents.length >= 2;
    if (!evidenceRequiresRepresentation) {
      diagnostics.push({
        reportId: report.reportId, scope: "ATOMICITY", originalStatus: report.status, effectiveStatus: report.status,
        checks: { ATOMIC_CONSTITUENTS_REPRESENTED: report.status === "INCOMPLETE" ? "FAIL" : "NOT_APPLICABLE", DIRECT_REQUIRED_RELATIONS_REPRESENTED: report.status === "INCOMPLETE" && report.directRelations.length ? "FAIL" : "NOT_APPLICABLE", REQUIRED_COMPOSITE_REPRESENTED: "NOT_APPLICABLE", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "PASS" },
        disposition: "UNCHANGED", reason: report.status === "INCOMPLETE" ? "The audit already requires a bounded repair." : "No autonomous constituent finding requires a representation check.",
      });
      return report;
    }
    const canonicalContext = atomicCanonicalContext(candidate, report);
    const elementsByConstituent = new Map(report.constituents.map((finding) => [finding.constituentId, compatibleElement(candidate, {
      ...finding,
      semanticType: resolveAtomicConstituentType(finding.semanticType, canonicalContext),
    })]));
    const constituentsRepresented = [...elementsByConstituent.values()].every(Boolean);
    const relationsRepresented = report.directRelations.every((relation) => {
      const source = elementsByConstituent.get(relation.sourceConstituentId);
      const target = elementsByConstituent.get(relation.targetConstituentId);
      return Boolean(source && target && directRelationRepresented(candidate, [source.clientElementId], [target.clientElementId], resolveAtomicDirectRelation(relation.relationType, canonicalContext), relation.polarity));
    });
    if (constituentsRepresented && relationsRepresented) {
      diagnostics.push({
        reportId: report.reportId, scope: "ATOMICITY", originalStatus: report.status, effectiveStatus: report.status,
        checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "PASS", DIRECT_REQUIRED_RELATIONS_REPRESENTED: "PASS", REQUIRED_COMPOSITE_REPRESENTED: "NOT_APPLICABLE", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "PASS" },
        disposition: "UNCHANGED", reason: "Every source-grounded autonomous constituent and direct required relation already has a compatible explicit representation.",
      });
      return report;
    }
    changed = true;
    diagnostics.push({
      reportId: report.reportId, scope: "ATOMICITY", originalStatus: report.status, effectiveStatus: "INCOMPLETE",
      checks: { ATOMIC_CONSTITUENTS_REPRESENTED: constituentsRepresented ? "PASS" : "FAIL", DIRECT_REQUIRED_RELATIONS_REPRESENTED: relationsRepresented ? "PASS" : "FAIL", REQUIRED_COMPOSITE_REPRESENTED: "NOT_APPLICABLE", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "FAIL" },
      disposition: "AUDIT_STATUS_INCONSISTENT", reason: "A COMPLETE atomicity finding cannot be accepted while its autonomous constituents or direct required relations are absent from the candidate.",
    });
    return { ...report, status: "INCOMPLETE", reason: `${report.reason} Deterministic acceptance guard: compatible constituent or relation representation is missing.` };
  });

  const compositionReports = audit.compositionReports.map((report): SemanticCompositionReport => {
    if (report.status === "AMBIGUOUS") {
      diagnostics.push({
        reportId: report.reportId, scope: "COMPOSITION", originalStatus: report.status, effectiveStatus: report.status,
        checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "NOT_APPLICABLE", DIRECT_REQUIRED_RELATIONS_REPRESENTED: "UNKNOWN", REQUIRED_COMPOSITE_REPRESENTED: "UNKNOWN", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "UNKNOWN" },
        disposition: "AMBIGUOUS_NO_REPAIR", reason: "Ambiguous findings cannot authorize deterministic composite creation.",
      });
      return report;
    }
    if (report.status === "NOT_REQUIRED" && request) {
      const requirement = explicitCompositeMethodFinding(request, candidate, report);
      if (requirement.disposition === "REQUIRED_MISSING") {
        changed = true;
        diagnostics.push({
          reportId: report.reportId, scope: "COMPOSITION", originalStatus: report.status, effectiveStatus: "INCOMPLETE",
          checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "PASS", DIRECT_REQUIRED_RELATIONS_REPRESENTED: "FAIL", REQUIRED_COMPOSITE_REPRESENTED: "FAIL", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "FAIL" },
          disposition: "AUDIT_STATUS_INCONSISTENT",
          reason: "A source-contiguous, linked modality-or-method plus acquisition qualifier is an explicit composite method; NOT_REQUIRED cannot hide that object.",
        });
        return {
          ...report,
          status: "INCOMPLETE",
          composite: requirement.finding.composite,
          relations: requirement.finding.relations,
          reason: `${report.reason} Deterministic acceptance guard: structured source evidence requires a distinct composite METHOD while preserving its components.`,
        };
      }
      if (requirement.disposition === "REQUIRED_REPRESENTED") {
        diagnostics.push({
          reportId: report.reportId, scope: "COMPOSITION", originalStatus: report.status, effectiveStatus: report.status,
          checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "PASS", DIRECT_REQUIRED_RELATIONS_REPRESENTED: "PASS", REQUIRED_COMPOSITE_REPRESENTED: "PASS", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "PASS" },
          disposition: "UNCHANGED", reason: "The source-grounded composite method is already represented without suppressing its components.",
        });
        return report;
      }
    }
    if (report.status !== "COMPLETE" || !report.composite) {
      diagnostics.push({
        reportId: report.reportId, scope: "COMPOSITION", originalStatus: report.status, effectiveStatus: report.status,
        checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "NOT_APPLICABLE", DIRECT_REQUIRED_RELATIONS_REPRESENTED: report.status === "INCOMPLETE" && report.relations.length ? "FAIL" : "NOT_APPLICABLE", REQUIRED_COMPOSITE_REPRESENTED: report.status === "INCOMPLETE" ? "FAIL" : "NOT_APPLICABLE", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "PASS" },
        disposition: "UNCHANGED", reason: report.status === "INCOMPLETE" ? "The audit already requires a bounded repair." : "No required composite finding is asserted.",
      });
      return report;
    }
    const compositeElement = compatibleElement(candidate, report.composite);
    const candidateIdsForInventory = (inventoryItemId: string) => candidate.elements.filter((element) => element.inventoryItemIds.includes(inventoryItemId)
      && element.epistemicStatus === "EXPLICIT_USER_STATED").map((element) => element.clientElementId);
    const relationsRepresented = report.relations.every((relation) => {
      const sourceIds = relation.sourceIsComposite ? [compositeElement?.clientElementId].filter((id): id is string => Boolean(id)) : candidateIdsForInventory(relation.sourceInventoryItemId!);
      const targetIds = relation.targetIsComposite ? [compositeElement?.clientElementId].filter((id): id is string => Boolean(id)) : candidateIdsForInventory(relation.targetInventoryItemId!);
      return directRelationRepresented(candidate, sourceIds, targetIds, relation.relationType, relation.polarity);
    });
    if (compositeElement && relationsRepresented) {
      diagnostics.push({
        reportId: report.reportId, scope: "COMPOSITION", originalStatus: report.status, effectiveStatus: report.status,
        checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "NOT_APPLICABLE", DIRECT_REQUIRED_RELATIONS_REPRESENTED: "PASS", REQUIRED_COMPOSITE_REPRESENTED: "PASS", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "PASS" },
        disposition: "UNCHANGED", reason: "The required composite and its explicit relations already have compatible representations.",
      });
      return report;
    }
    changed = true;
    diagnostics.push({
      reportId: report.reportId, scope: "COMPOSITION", originalStatus: report.status, effectiveStatus: "INCOMPLETE",
      checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "NOT_APPLICABLE", DIRECT_REQUIRED_RELATIONS_REPRESENTED: relationsRepresented ? "PASS" : "FAIL", REQUIRED_COMPOSITE_REPRESENTED: compositeElement ? "PASS" : "FAIL", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "FAIL" },
      disposition: "AUDIT_STATUS_INCONSISTENT", reason: "A COMPLETE composition finding cannot be accepted while its required composite or explicit relations are absent from the candidate.",
    });
    return { ...report, status: "INCOMPLETE", reason: `${report.reason} Deterministic acceptance guard: compatible composite or relation representation is missing.` };
  });
  const effective = parseSemanticAtomicCompositionAudit({
    ...audit,
    verdict: changed && audit.verdict === "ACCEPT" ? "REVISE" : audit.verdict,
    atomicityReports,
    compositionReports,
    summary: changed ? `${audit.summary} Deterministic acceptance guard rejected a false completion or composition finding.` : audit.summary,
  });
  return { audit: effective, diagnostics, changed, acceptAllowed: !changed && atomicCompositionAcceptIsConsistent(effective) };
};

const repairBase = (repairId: string, action: SemanticCriticRepair["action"], reason: string): SemanticCriticRepair => ({
  repairId, action, reason, sourceInventoryItemIds: [], sourceInventoryRelationIds: [],
  inventoryItemId: null, inventorySourceMessageId: null, inventorySourceText: null, inventoryNormalizedLabel: null, inventoryLocalRole: null, inventoryPolarity: null,
  inventoryModifiers: [], inventoryLinkedItemIds: [], inventoryRelationId: null, inventoryRelationSourceItemId: null, inventoryRelationTargetItemId: null,
  inventoryRelationSourceMessageId: null, inventoryRelationSourceText: null, inventoryNormalizedRelation: null, inventoryRelationPolarity: null,
  elementClientElementId: null, elementType: null, elementCanonicalMeaning: null, elementStudyRole: null, elementPolarity: null, elementInventoryItemIds: [],
  elementSourceMessageId: null, elementSourceText: null, elementEpistemicStatus: null, elementConfidence: null, elementInferenceReason: null,
  elementRequiresConfirmation: null, elementSupersedesElementIds: [], relationClientRelationId: null, relationSourceClientElementId: null,
  relationTargetClientElementId: null, relationType: null, relationPolarity: null, relationInventoryRelationIds: [], relationEpistemicStatus: null,
  relationConfidence: null, relationInferenceReason: null, relationRequiresConfirmation: null, ambiguity: null, route: null, routeConfidence: null,
  routeReason: null, routeExpectedCapabilities: [],
});

const stableId = (prefix: string, value: unknown) => `${prefix}-${logicalDigest(value).replace(/^ke1-/, "")}`;
const exactUserSpan = (request: SemanticReconstructionRequest, messageId: string, sourceText: string) => request.messages.some((message) =>
  message.role === "USER" && message.messageId === messageId && message.content.includes(sourceText));

export type AtomicCompositionCompilationDiagnostic = {
  reportId: string;
  status: "COMPILED" | "REJECTED" | "NO_CHANGE";
  reason: string;
};

export type AtomicCanonicalClassificationDiagnostic = {
  reportId: string;
  findingId: string;
  scope: "CONSTITUENT_TYPE" | "DIRECT_RELATION";
  suppliedValue: string;
  effectiveValue: string;
  studyRole: SemanticStudyRole | null;
  disposition: "PRESERVED" | "RECLASSIFIED_FROM_SEMANTIC_ROLE";
  reason: string;
};

const normalizedSemanticDescriptor = (...values: Array<string | null | undefined>) => values
  .filter((value): value is string => Boolean(value))
  .join(" ")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("fr-FR");

const parameterBoundaryRole = (value: string) => /\b(parameter|parametre|constraint|contrainte|condition|boundary|borne|limit|limite|range|plage|setting|configuration|requirement|exigence|criterion|critere|threshold|seuil)s?\b/.test(value);
const comparativeIntent = (value: string) => /\b(compar|contrast|benchmark|align|harmonis|standardis|reconcil|equivalen)[a-z]*\b/.test(value);
const weakCoordinationRelation = (value: string) => normalizedSemanticDescriptor(value) === "coordinated_with";
const roleSensitiveTechnicalTypes = new Set<SemanticElementType>(["SCIENTIFIC_OBJECT", "CONDITION", "MODALITY", "METHOD", "UNKNOWN"]);

const atomicCanonicalContext = (
  candidate: SemanticReconstructionCandidate,
  report: SemanticAtomicityReport,
) => {
  const inventoryById = new Map(candidate.semanticInventory.explicitFragments.map((item) => [item.inventoryItemId, item]));
  const subjectIds = new Set(report.subjectInventoryItemIds);
  const subjectDescriptor = normalizedSemanticDescriptor(...report.subjectInventoryItemIds.map((id) => inventoryById.get(id)?.localRole));
  const linkedIntentDescriptors = candidate.semanticInventory.explicitFragments.flatMap((fragment) => {
    const linkedByFragment = fragment.linkedInventoryItemIds.some((id) => subjectIds.has(id));
    const linkedByRelation = candidate.semanticInventory.explicitRelations.some((relation) => relation.sourceInventoryItemId === fragment.inventoryItemId
      && subjectIds.has(relation.targetInventoryItemId));
    if (!linkedByFragment && !linkedByRelation) return [];
    const intentElements = candidate.elements.filter((element) => element.inventoryItemIds.includes(fragment.inventoryItemId)
      && ["SCIENTIFIC_INTENT", "OPERATION"].includes(element.type));
    return intentElements.map((element) => normalizedSemanticDescriptor(fragment.localRole, fragment.normalizedLabel, element.canonicalMeaning));
  });
  const hasComparativeIntent = linkedIntentDescriptors.some(comparativeIntent);
  const constituentsAreParameterBoundaries = parameterBoundaryRole(subjectDescriptor) && hasComparativeIntent;
  return { hasComparativeIntent, constituentsAreParameterBoundaries };
};

const resolveAtomicConstituentType = (
  suppliedType: SemanticElementType,
  context: ReturnType<typeof atomicCanonicalContext>,
): SemanticElementType => context.constituentsAreParameterBoundaries && roleSensitiveTechnicalTypes.has(suppliedType)
  ? "CONSTRAINT"
  : suppliedType;

const resolveAtomicDirectRelation = (
  suppliedRelation: string,
  context: ReturnType<typeof atomicCanonicalContext>,
) => context.hasComparativeIntent && weakCoordinationRelation(suppliedRelation)
  ? "COMPARES_WITH"
  : suppliedRelation;

const compositeMethodRequiresFormalizationRoute = (
  candidate: SemanticReconstructionCandidate,
  report: SemanticCompositionReport,
) => {
  if (candidate.routeProposal.route !== "UNDERSTAND" || report.status !== "INCOMPLETE" || report.composite?.semanticType !== "METHOD") return false;
  const measurementRelation = report.relations.find((relation) =>
    (relation.sourceIsComposite || relation.targetIsComposite)
    && /measur|quantif|observ|detect|evaluat/i.test(relation.relationType));
  if (!measurementRelation) return false;
  const targetInventoryItemId = measurementRelation.sourceIsComposite
    ? measurementRelation.targetInventoryItemId
    : measurementRelation.sourceInventoryItemId;
  if (!targetInventoryItemId) return false;
  return candidate.semanticInventory.explicitFragments.some((fragment) =>
    /\b(action|operation|intent|objective|goal|aim)\b/i.test(normalizedSemanticDescriptor(fragment.localRole))
    && fragment.linkedInventoryItemIds.includes(targetInventoryItemId));
};

export const compileAtomicCompositionRepairs = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
  audit: SemanticAtomicCompositionAudit,
): { repairs: SemanticCriticRepair[]; diagnostics: AtomicCompositionCompilationDiagnostic[]; classifications: AtomicCanonicalClassificationDiagnostic[] } => {
  const repairs: SemanticCriticRepair[] = [];
  const diagnostics: AtomicCompositionCompilationDiagnostic[] = [];
  const classifications: AtomicCanonicalClassificationDiagnostic[] = [];
  const inventoryById = new Map(candidate.semanticInventory.explicitFragments.map((item) => [item.inventoryItemId, item]));
  const inventoryBySpan = new Map(candidate.semanticInventory.explicitFragments.map((item) => [`${item.sourceMessageId}\u0000${item.sourceText}`, item]));
  const elementBySpanAndType = new Map(candidate.elements.filter((item) => item.sourceMessageId && item.sourceText).map((item) => [`${item.sourceMessageId}\u0000${item.sourceText}\u0000${item.type}`, item]));

  for (const report of audit.atomicityReports) {
    if (report.status !== "INCOMPLETE") continue;
    if (report.subjectInventoryItemIds.some((id) => !inventoryById.has(id))) {
      diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "ATOMICITY_SUBJECT_INVENTORY_UNKNOWN" });
      continue;
    }
    if (report.constituents.some((item) => !exactUserSpan(request, item.sourceMessageId, item.sourceText))) {
      diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "ATOMICITY_CONSTITUENT_NOT_SOURCE_GROUNDED" });
      continue;
    }
    if (report.directRelations.some((item) => !exactUserSpan(request, item.sourceMessageId, item.sourceText))) {
      diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "ATOMICITY_RELATION_NOT_SOURCE_GROUNDED" });
      continue;
    }
    const canonicalContext = atomicCanonicalContext(candidate, report);
    const local = new Map<string, { inventoryItemId: string; elementClientElementId: string }>();
    for (const constituent of report.constituents) {
      const effectiveType = resolveAtomicConstituentType(constituent.semanticType, canonicalContext);
      classifications.push({
        reportId: report.reportId,
        findingId: constituent.constituentId,
        scope: "CONSTITUENT_TYPE",
        suppliedValue: constituent.semanticType,
        effectiveValue: effectiveType,
        studyRole: constituent.studyRole,
        disposition: effectiveType === constituent.semanticType ? "PRESERVED" : "RECLASSIFIED_FROM_SEMANTIC_ROLE",
        reason: effectiveType === constituent.semanticType
          ? "The audit type is compatible with the structured semantic role."
          : "The constituent is an autonomous value of a parameter boundary governed by an explicit comparative intent; its technical context does not define its canonical type.",
      });
      const spanKey = `${constituent.sourceMessageId}\u0000${constituent.sourceText}`;
      const existingInventory = inventoryBySpan.get(spanKey);
      const inventoryItemId = existingInventory?.inventoryItemId ?? stableId("r3d-inventory", { report: report.reportId, constituent });
      if (!existingInventory) {
        repairs.push({ ...repairBase(stableId("r3d-repair", { inventoryItemId }), "UPSERT_INVENTORY_FRAGMENT", report.reason),
          sourceInventoryItemIds: report.subjectInventoryItemIds, inventoryItemId, inventorySourceMessageId: constituent.sourceMessageId,
          inventorySourceText: constituent.sourceText, inventoryNormalizedLabel: constituent.normalizedMeaning, inventoryLocalRole: "AUTONOMOUS_EXPLICIT_CONSTITUENT",
          inventoryPolarity: constituent.polarity, inventoryLinkedItemIds: report.subjectInventoryItemIds });
      }
      const elementKey = `${constituent.sourceMessageId}\u0000${constituent.sourceText}\u0000${effectiveType}`;
      const existingElement = elementBySpanAndType.get(elementKey);
      const elementClientElementId = existingElement?.clientElementId ?? stableId("r3d-element", { report: report.reportId, constituent });
      if (!existingElement) {
        repairs.push({ ...repairBase(stableId("r3d-repair", { elementClientElementId }), "UPSERT_ELEMENT", report.reason),
          sourceInventoryItemIds: [inventoryItemId], elementClientElementId, elementType: effectiveType,
          elementCanonicalMeaning: constituent.normalizedMeaning, elementStudyRole: constituent.studyRole, elementPolarity: constituent.polarity,
          elementInventoryItemIds: [inventoryItemId], elementSourceMessageId: constituent.sourceMessageId, elementSourceText: constituent.sourceText,
          elementEpistemicStatus: "EXPLICIT_USER_STATED", elementConfidence: 1, elementRequiresConfirmation: false });
      }
      local.set(constituent.constituentId, { inventoryItemId, elementClientElementId });
    }
    for (const relation of report.directRelations) {
      const effectiveRelation = resolveAtomicDirectRelation(relation.relationType, canonicalContext);
      classifications.push({
        reportId: report.reportId,
        findingId: `${relation.sourceConstituentId}->${relation.targetConstituentId}`,
        scope: "DIRECT_RELATION",
        suppliedValue: relation.relationType,
        effectiveValue: effectiveRelation,
        studyRole: null,
        disposition: effectiveRelation === relation.relationType ? "PRESERVED" : "RECLASSIFIED_FROM_SEMANTIC_ROLE",
        reason: effectiveRelation === relation.relationType
          ? "The direct relation is compatible with the linked scientific intent."
          : "A linguistic coordination edge is weaker than the explicit comparative scientific intent carried by the structured inventory.",
      });
      const source = local.get(relation.sourceConstituentId);
      const target = local.get(relation.targetConstituentId);
      if (!source || !target) continue;
      const existingInventoryRelation = candidate.semanticInventory.explicitRelations.find((item) => item.sourceInventoryItemId === source.inventoryItemId
        && item.targetInventoryItemId === target.inventoryItemId && item.normalizedRelation === effectiveRelation);
      const inventoryRelationId = existingInventoryRelation?.inventoryRelationId ?? stableId("r3d-inventory-relation", { report: report.reportId, relation });
      if (!existingInventoryRelation) {
        repairs.push({ ...repairBase(stableId("r3d-repair", { inventoryRelationId }), "UPSERT_INVENTORY_RELATION", report.reason),
          sourceInventoryItemIds: [source.inventoryItemId, target.inventoryItemId], inventoryRelationId, inventoryRelationSourceItemId: source.inventoryItemId,
          inventoryRelationTargetItemId: target.inventoryItemId, inventoryRelationSourceMessageId: relation.sourceMessageId,
          inventoryRelationSourceText: relation.sourceText, inventoryNormalizedRelation: effectiveRelation, inventoryRelationPolarity: relation.polarity });
      }
      const existingRelation = candidate.relations.find((item) => item.sourceClientElementId === source.elementClientElementId
        && item.targetClientElementId === target.elementClientElementId && item.relationType === effectiveRelation);
      if (!existingRelation) {
        const relationClientRelationId = stableId("r3d-relation", { report: report.reportId, relation });
        repairs.push({ ...repairBase(stableId("r3d-repair", { relationClientRelationId }), "UPSERT_RELATION", report.reason),
          sourceInventoryItemIds: [source.inventoryItemId, target.inventoryItemId], sourceInventoryRelationIds: [inventoryRelationId],
          relationClientRelationId, relationSourceClientElementId: source.elementClientElementId, relationTargetClientElementId: target.elementClientElementId,
          relationType: effectiveRelation, relationPolarity: relation.polarity, relationInventoryRelationIds: [inventoryRelationId],
          relationEpistemicStatus: "EXPLICIT_USER_STATED", relationConfidence: 1, relationRequiresConfirmation: false });
      }
    }
    diagnostics.push({ reportId: report.reportId, status: repairs.length ? "COMPILED" : "NO_CHANGE", reason: "ATOMICITY_REPORT_COMPILED_WITH_AGGREGATE_PRESERVED" });
  }

  for (const report of audit.compositionReports) {
    if (report.status !== "INCOMPLETE" || !report.composite) continue;
    if (report.sourceInventoryItemIds.some((id) => !inventoryById.has(id))) {
      diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "COMPOSITION_SOURCE_INVENTORY_UNKNOWN" });
      continue;
    }
    if (!exactUserSpan(request, report.composite.sourceMessageId, report.composite.sourceText)) {
      diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "COMPOSITE_NOT_SOURCE_GROUNDED" });
      continue;
    }
    if (report.relations.some((item) => !exactUserSpan(request, item.sourceMessageId, item.sourceText))) {
      diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "COMPOSITE_RELATION_NOT_SOURCE_GROUNDED" });
      continue;
    }
    if (report.relations.some((item) => [item.sourceInventoryItemId, item.targetInventoryItemId].filter(Boolean).some((id) => !inventoryById.has(id!)))) {
      diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "COMPOSITE_RELATION_ENDPOINT_UNKNOWN" });
      continue;
    }
    const spanKey = `${report.composite.sourceMessageId}\u0000${report.composite.sourceText}`;
    const existingInventory = inventoryBySpan.get(spanKey);
    const inventoryItemId = existingInventory?.inventoryItemId ?? stableId("r3d-inventory", { report: report.reportId, composite: report.composite });
    if (!existingInventory) {
      repairs.push({ ...repairBase(stableId("r3d-repair", { inventoryItemId }), "UPSERT_INVENTORY_FRAGMENT", report.reason),
        sourceInventoryItemIds: report.sourceInventoryItemIds, inventoryItemId, inventorySourceMessageId: report.composite.sourceMessageId,
        inventorySourceText: report.composite.sourceText, inventoryNormalizedLabel: report.composite.normalizedMeaning, inventoryLocalRole: "EXPLICIT_COMPOSITE_OBJECT",
        inventoryPolarity: report.composite.polarity, inventoryLinkedItemIds: report.sourceInventoryItemIds });
    }
    const elementKey = `${report.composite.sourceMessageId}\u0000${report.composite.sourceText}\u0000${report.composite.semanticType}`;
    const existingElement = elementBySpanAndType.get(elementKey);
    const elementClientElementId = existingElement?.clientElementId ?? stableId("r3d-element", { report: report.reportId, composite: report.composite });
    if (!existingElement) {
      repairs.push({ ...repairBase(stableId("r3d-repair", { elementClientElementId }), "UPSERT_ELEMENT", report.reason),
        sourceInventoryItemIds: [inventoryItemId], elementClientElementId, elementType: report.composite.semanticType,
        elementCanonicalMeaning: report.composite.normalizedMeaning, elementStudyRole: report.composite.studyRole, elementPolarity: report.composite.polarity,
        elementInventoryItemIds: [inventoryItemId], elementSourceMessageId: report.composite.sourceMessageId, elementSourceText: report.composite.sourceText,
        elementEpistemicStatus: "EXPLICIT_USER_STATED", elementConfidence: 1, elementRequiresConfirmation: false });
    }
    for (const relation of report.relations) {
      const sourceInventoryItemId = relation.sourceIsComposite ? inventoryItemId : relation.sourceInventoryItemId!;
      const targetInventoryItemId = relation.targetIsComposite ? inventoryItemId : relation.targetInventoryItemId!;
      const sourceClientElementId = relation.sourceIsComposite ? elementClientElementId : candidate.elements.find((item) => item.inventoryItemIds.includes(sourceInventoryItemId))?.clientElementId;
      const targetClientElementId = relation.targetIsComposite ? elementClientElementId : candidate.elements.find((item) => item.inventoryItemIds.includes(targetInventoryItemId))?.clientElementId;
      if (!sourceClientElementId || !targetClientElementId) {
        diagnostics.push({ reportId: report.reportId, status: "REJECTED", reason: "COMPOSITE_RELATION_TYPED_ENDPOINT_UNKNOWN" });
        continue;
      }
      const inventoryRelationId = stableId("r3d-inventory-relation", { report: report.reportId, relation });
      repairs.push({ ...repairBase(stableId("r3d-repair", { inventoryRelationId }), "UPSERT_INVENTORY_RELATION", report.reason),
        sourceInventoryItemIds: [sourceInventoryItemId, targetInventoryItemId], inventoryRelationId, inventoryRelationSourceItemId: sourceInventoryItemId,
        inventoryRelationTargetItemId: targetInventoryItemId, inventoryRelationSourceMessageId: relation.sourceMessageId,
        inventoryRelationSourceText: relation.sourceText, inventoryNormalizedRelation: relation.relationType, inventoryRelationPolarity: relation.polarity });
      const relationClientRelationId = stableId("r3d-relation", { report: report.reportId, relation });
      repairs.push({ ...repairBase(stableId("r3d-repair", { relationClientRelationId }), "UPSERT_RELATION", report.reason),
        sourceInventoryItemIds: [sourceInventoryItemId, targetInventoryItemId], sourceInventoryRelationIds: [inventoryRelationId],
        relationClientRelationId, relationSourceClientElementId: sourceClientElementId, relationTargetClientElementId: targetClientElementId,
        relationType: relation.relationType, relationPolarity: relation.polarity, relationInventoryRelationIds: [inventoryRelationId],
        relationEpistemicStatus: "EXPLICIT_USER_STATED", relationConfidence: 1, relationRequiresConfirmation: false });
    }
    diagnostics.push({ reportId: report.reportId, status: repairs.length ? "COMPILED" : "NO_CHANGE", reason: "COMPOSITION_REPORT_COMPILED_WITH_CONSTITUENTS_PRESERVED" });
  }

  const repairedCompositeMethod = audit.compositionReports.find((report) => compositeMethodRequiresFormalizationRoute(candidate, report));
  if (audit.routeAssessment.status === "CORRECT" && repairedCompositeMethod) {
    const reason = "The complete repaired graph contains an explicit composite method, an explicit measurement relation, and a source-grounded scientific action; it requires formalization rather than explanation-only exploration.";
    repairs.push({ ...repairBase(stableId("r3d-repair", { route: "FORMALIZE_IDEA", reportId: repairedCompositeMethod.reportId }), "SET_ROUTE", reason),
      route: "FORMALIZE_IDEA", routeConfidence: 1, routeReason: reason,
      routeExpectedCapabilities: ["SCIENTIFIC_FORMALIZATION", "METHOD_COMPOSITION"] });
  } else if (audit.routeAssessment.status === "INCORRECT" && audit.routeAssessment.proposedRoute) {
    repairs.push({ ...repairBase(stableId("r3d-repair", { route: audit.routeAssessment.proposedRoute, reason: audit.routeAssessment.reason }), "SET_ROUTE", audit.routeAssessment.reason),
      route: audit.routeAssessment.proposedRoute, routeConfidence: audit.routeAssessment.confidence, routeReason: audit.routeAssessment.reason,
      routeExpectedCapabilities: audit.routeAssessment.expectedCapabilities });
  }
  return { repairs, diagnostics, classifications };
};

export const atomicCompositionAcceptIsConsistent = (audit: SemanticAtomicCompositionAudit) => audit.verdict === "ACCEPT"
  && audit.atomicityReports.every((item) => ["COMPLETE", "NOT_APPLICABLE"].includes(item.status))
  && audit.compositionReports.every((item) => ["COMPLETE", "NOT_REQUIRED"].includes(item.status))
  && audit.routeAssessment.status === "CORRECT";

export interface SemanticAtomicCompositionProvider {
  readonly metadata: SemanticProviderMetadata;
  auditAtomicComposition(
    request: SemanticReconstructionRequest,
    candidate: SemanticReconstructionCandidate,
    cycle: 1 | 2,
  ): Promise<{ callId: string; audit: SemanticAtomicCompositionAudit; attempts?: SemanticProviderAttempt[] }>;
}

export type SemanticAtomicCompositionCycleResult = {
  candidate: SemanticReconstructionCandidate;
  audits: SemanticAtomicCompositionAudit[];
  callIds: string[];
  attempts: SemanticProviderAttempt[];
  cycleAttempts: SemanticProviderAttempt[][];
  acceptanceDiagnostics: AtomicCompositionAcceptanceDiagnostic[];
  compilationDiagnostics: AtomicCompositionCompilationDiagnostic[];
  repairDiagnostics: CriticRepairDiagnostic[];
  accepted: boolean;
  terminalReason: string;
};

export const runSemanticAtomicCompositionCycles = async (
  provider: SemanticAtomicCompositionProvider,
  request: SemanticReconstructionRequest,
  initialCandidate: SemanticReconstructionCandidate,
): Promise<SemanticAtomicCompositionCycleResult> => {
  let candidate = initialCandidate;
  const audits: SemanticAtomicCompositionAudit[] = [];
  const callIds: string[] = [];
  const attempts: SemanticProviderAttempt[] = [];
  const cycleAttempts: SemanticProviderAttempt[][] = [];
  const acceptanceDiagnostics: AtomicCompositionAcceptanceDiagnostic[] = [];
  const compilationDiagnostics: AtomicCompositionCompilationDiagnostic[] = [];
  const repairDiagnostics: CriticRepairDiagnostic[] = [];

  for (const cycle of [1, 2] as const) {
    const result = await provider.auditAtomicComposition(request, candidate, cycle);
    const guarded = enforceAtomicCompositionAcceptanceConsistency(candidate, result.audit, request);
    audits.push(guarded.audit);
    acceptanceDiagnostics.push(...guarded.diagnostics);
    callIds.push(result.callId);
    const currentAttempts = result.attempts ?? [];
    cycleAttempts.push(currentAttempts);
    attempts.push(...currentAttempts);
    if (guarded.acceptAllowed) {
      return { candidate, audits, callIds, attempts, cycleAttempts, acceptanceDiagnostics, compilationDiagnostics, repairDiagnostics, accepted: true, terminalReason: "ATOMIC_COMPOSITION_AUDIT_ACCEPTED" };
    }
    if (guarded.audit.verdict === "CLARIFICATION_REQUIRED") {
      return { candidate, audits, callIds, attempts, cycleAttempts, acceptanceDiagnostics, compilationDiagnostics, repairDiagnostics, accepted: false, terminalReason: "ATOMIC_COMPOSITION_CLARIFICATION_REQUIRED" };
    }
    const compiled = compileAtomicCompositionRepairs(request, candidate, guarded.audit);
    compilationDiagnostics.push(...compiled.diagnostics);
    const applied = applyCriticRepairs(request, candidate, compiled.repairs);
    repairDiagnostics.push(...applied.diagnostics);
    if (!compiled.repairs.length || !applied.diagnostics.some((item) => item.status === "ACCEPTED")) {
      return { candidate, audits, callIds, attempts, cycleAttempts, acceptanceDiagnostics, compilationDiagnostics, repairDiagnostics, accepted: false, terminalReason: "ATOMIC_COMPOSITION_REPAIR_REJECTED" };
    }
    candidate = applied.candidate;
    if (guarded.changed) {
      const postRepair = enforceAtomicCompositionAcceptanceConsistency(candidate, result.audit, request);
      acceptanceDiagnostics.push(...postRepair.diagnostics);
      if (postRepair.acceptAllowed) {
        audits[audits.length - 1] = postRepair.audit;
        return {
          candidate, audits, callIds, attempts, cycleAttempts, acceptanceDiagnostics, compilationDiagnostics, repairDiagnostics,
          accepted: true, terminalReason: "ATOMIC_COMPOSITION_FALSE_COMPLETE_REPAIRED_AND_VERIFIED",
        };
      }
    }
    if (cycle === 2) {
      return { candidate, audits, callIds, attempts, cycleAttempts, acceptanceDiagnostics, compilationDiagnostics, repairDiagnostics, accepted: false, terminalReason: "ATOMIC_COMPOSITION_REQUIRES_POST_REPAIR_AUDIT" };
    }
  }
  throw new Error("ATOMIC_COMPOSITION_CYCLE_BOUND_UNREACHABLE");
};

export const makeAtomicCompositionAuditContext = (request: SemanticReconstructionRequest, candidate: SemanticReconstructionCandidate, cycle: 1 | 2) => ({
  schemaVersion: request.schemaVersion,
  auditSchemaVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION,
  language: request.language,
  messages: request.messages,
  auditCycle: cycle,
  semanticInventory: candidate.semanticInventory,
  typedCandidate: candidate,
  currentRoute: candidate.routeProposal,
  epistemicStatuses: PROVIDER_EPISTEMIC_STATUSES,
});

export const semanticAtomicCompositionTypeGuard = (_type: SemanticElementType, _role: SemanticStudyRole, _polarity: SemanticPolarity) => true;
