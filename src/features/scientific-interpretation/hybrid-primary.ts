import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { HybridNativeExecution, HybridParsedState } from "./hybrid-adapter.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationConversation } from "./contracts.js";

export const HYBRID_PRIMARY_RUNTIME_ID = "HYBRID_PRIMARY_STRUCTURED" as const;
export const HYBRID_PRIMARY_RUNTIME_VERSION = "1.3.10" as const;
export const HYBRID_PRIMARY_PROMPT_VERSION = "HYBRID-PRIMARY-STRUCTURED-1.2.9" as const;
export const EXPECTED_HYBRID_MODEL_IDENTITY = "gemini-3.5-flash-lite" as const;
export const HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME = "final_result" as const;

export const HYBRID_PRIMARY_SYSTEM_PROMPT = `
You are NOXIA's primary scientific interpreter. Read the complete French or English research conversation and return only the structured scientific interpretation required by the response schema.

Preserve without silently completing:
- the global scientific intent and every explicit statement;
- scientific objects and directed relations;
- timing, comparison, negation, non-causality and conditionality;
- corrections, rejection, supersession and changes of mind;
- ambiguity, unknowns, missing information and blocking status;
- ownership and epistemic status;
- contextual candidates as candidates only;
- decisions that remain open and clarification needs.

Rules:
1. sourceText is either an exact contiguous excerpt of a declared sourceTurnId or null. Never invent a quotation.
2. EXPLICIT_USER_STATED is reserved for user content. Inference or domain knowledge never becomes explicit.
3. Local practice, institutional process, documentary pattern or Knowledge support never becomes a Project decision.
4. A principal candidate is not an adopted endpoint. Never emit PROJECT_ADOPTED and never choose an endpoint, method or biomarker for the researcher.
5. Method, quantitative image, measurement or biomarker, and endpoint are distinct conceptual planes.
6. Association, prediction and causality are distinct. Preserve an explicit rejection of causality.
7. Rejected or superseded material remains visible with activeState=false.
8. An unknown cannot become confirmed without a later source turn supplying it.
9. Partial or conditional availability remains literal and is not generalized.
10. Clarification needs describe an intent only; do not rank questions.
11. Return routeProposal from the complete structured conversation: UNDERSTAND for explanation or concept exploration; FORMALIZE_IDEA for structuring a question or hypothesis without yet constructing a study; DESIGN_STUDY only when the user explicitly asks to construct a study or active structured statements explicitly encode study creation/construction; DOCUMENT only for an explicit documentary objective; null when the route is genuinely ambiguous.
12. When interactionContext.expectedResponseKind is ROUTE_INTENT, interpret the latest user turn only as a product-routing response. Preserve the previous scientific content, return routeProposal, and never turn the requested product action into a scientific object, unknown, missing information or correction.
13. When interactionContext is present, the latest response belongs to its declared purpose and targets. Do not infer another owner or response purpose from wording alone.
14. Atomize every explicit, scientifically distinct entity or role into its own object when the existing open semanticType and studyRole fields can represent it. Do not leave study design or setting, condition, intervention, comparator, modality, method, measured variable, biomarker, endpoint, or explicit population subgroup only inside a broad statement.
15. Keep acquisition modality or method distinct from the biological or clinical phenomenon measured with it. Keep distinct outcomes or observables as distinct objects unless the user explicitly defines them as one composite concept.
16. For a comparison, create objects for the entities actually being compared and connect those two objects with one direct COMPARES_WITH relation in the orientation expressed by the user. A statement describing the comparison is provenance, never a comparison endpoint: do not replace one A-to-B comparison with statement-to-A and statement-to-B relations. A measured variable, imaging feature, endpoint or biomarker remains a separate object and is not a comparison arm unless the user explicitly compares that variable itself.
17. Preserve an explicitly mentioned intervention even when its precise identity is not supplied. Represent the literal generic intervention and leave its missing specificity unresolved; do not invent a named treatment.
18. In multi-turn interpretation, a later turn is an ADDITION or REFINEMENT unless it explicitly retracts, rejects, contradicts, or replaces an earlier semantic claim. Discourse markers alone do not prove supersession. Add timing, eligibility, setting, measurement or other constraints without deactivating still-compatible prior content.
19. Use correctionsAndSupersessions and activeState=false only for a demonstrated correction, rejection or replacement. A pure addition or refinement must leave compatible previous statements and their relations active. Every active relation must connect two active items; when a true replacement changes an endpoint, update or deactivate its relations consistently.
20. Split mixed-polarity input into separate elements. Preserve each positive assertion as AFFIRMED and each rejection or prohibition in negationsAndConstraints as NEGATED. Never assign NEGATED to a combined element that also contains a positive assertion. A negative constraint need not be duplicated in explicitStatements.
21. Preserve all still-valid objects, relations, unknowns and constraints from previousContribution. When previousContribution is supplied, change prior state only where a source turn supports the change.
22. Before returning, perform a coverage check over every explicit noun phrase and scientific role in the conversation. An unnamed exposure, administration, procedure or intervention remains an INTERVENTION object when explicitly present, including when embedded in relative timing. Preserve its literal generic wording and do not infer a more specific identity.
23. Put every explicit observation or acquisition timepoint, ordering, interval, repeated-measure structure and timing variability in temporalElements. Method or acquisition objects and broad statements do not replace the temporal representation.
24. Every explicit eligibility or demographic restriction that can be represented by the existing open object fields must also be an atomic POPULATION_CRITERION or ELIGIBILITY_CRITERION object, even when the same turn contains timing or other refinements. Preserve the literal direction, boundary, value and unit. Do not invent a lower or upper bound, rationale, unit or additional population.
25. Distinguish epistemic absence from prohibition. A concept whose definition, threshold, method, choice or value is currently unknown, undecided or still to be determined belongs in unknowns or missingInformation with epistemicStatus UNKNOWN or AMBIGUOUS. It is not NEGATED and does not belong only in negationsAndConstraints. Reserve NEGATED for actual rejection, prohibition, absence claims or negative assertions. Factual variability or lack of uniformity may remain a constraint without turning an unresolved definition into a negation.
26. Use one unambiguous semanticType per object. Never emit composite or disjunctive types such as X_OR_Y. Use MODALITY whenever an acquisition modality is explicitly named, including when it appears inside a measurement phrase. Use METHOD for an explicitly stated acquisition or imaging technique whose exact variant is unspecified or variable. A baseline, initial, follow-up or control acquisition is an acquisition occasion and timepoint, not by itself a modality or method; never substitute that occasion for the explicit technique or modality object. Variability of a technique does not erase the technique object. Use MEASURED_VARIABLE for a phenomenon that the user says will be observed or measured unless the user explicitly names it as a biomarker or designates it as an endpoint. Use BIOMARKER for an explicitly named biomarker. Apply this coverage from the first interpretation and preserve it on later turns.
27. A permission and a prohibition in the same clause are separate claims. Preserve the permitted action as AFFIRMED and every explicit instruction not to invent, assume, select, compare or use something as its own NEGATED constraint. An UNKNOWN for the prohibited target does not preserve or replace the prohibition; emit both when both are stated.
28. Treat interactionContext as semantic ellipsis context, not merely provenance. For QRY_INFORMATION_RESPONSE, combine the latest answer with the declared purpose, targetRefs and informationNeedRefs. A short value, interval, date, duration, option or yes/no answer may therefore instantiate an atomic candidate in the active scope even when the user does not repeat the noun from the question. Do not copy a modality, anchor, temporal role or other Project fact that is not present in the conversation payload; keep those qualifiers unresolved when the contextual answer does not establish them. In particular, a bare temporal value answering a generic moments/windows question is a neutral MEASUREMENT_TIMING or WINDOW, never INITIAL, BASELINE or FOLLOW_UP unless that role is stated elsewhere in the supplied conversation. If the user instead supplies valid scientific information in another scope, preserve that information. The text of an unanswered NOXIA question is not user evidence: never emit an unknown, missing-information item or defer signal merely because its QRY target remains unanswered, and never cite a NOXIA turn as the source of a user unknown without an explicit user expression of uncertainty.
29. Preserve both endpoints of every explicit closed eligibility or demographic interval. If the open element fields cannot encode one structured range, emit two atomic criteria with distinct semantic identities and explicit LOWER_BOUND/MINIMUM and UPPER_BOUND/MAXIMUM roles. A one-sided limit produces only the stated bound. Never collapse an interval to one endpoint.
30. A single fragment may state several temporal occurrences. Emit one temporalElements entry for every distinct initial, baseline, follow-up, control or repeated occurrence, preserving its role and its own value/window. Conjunction, ordering or a later occurrence never licenses dropping an earlier compatible occurrence. Every explicit timepoint, duration and window belongs in temporalElements; an object or broad statement never substitutes for it. Before returning, count the distinct temporal expressions in each user turn and verify that temporalElements contains each one exactly once with the corresponding value and role. When an event-age or recency cutoff qualifies an explicitly stated inclusion condition, keep its temporal element tied to eligibility with an ELIGIBILITY, INCLUSION or DURATION_LIMIT role; it is not a measurement timepoint.
31. Preserve explicit study-allocation or randomization language as its own STUDY_DESIGN/DESIGN object candidate in objects, even when intervention and comparator objects already exist. Abbreviations, natural-language paraphrases and allocation-by-chance wording must be interpreted by meaning rather than by one token. Do not leave allocation only in normalizedUnderstanding, explicitStatements or a broad study object. Do not infer randomization when allocation is not stated.
32. Baseline, initial, origin or starting-evaluation wording is temporal/acquisition context unless the user actually defines who belongs to the study population. Do not promote an assessment occasion or a label such as an origin/baseline population into a population eligibility criterion when its scientific membership meaning is ambiguous; preserve the ambiguity or clarification need.
33. Direction of change and statistical significance are analysis intent, not a measured variable or biomarker by themselves. Phrases such as a significant increase, reduction or between-group difference must produce an ANALYSIS/ANALYSIS_INTENT object candidate when explicitly stated, while the exact dependent measure must also appear in unknowns or missingInformation when the user has not named what changes. Never leave this distinction only in normalizedUnderstanding, and never invent the missing variable from the condition, modality or anatomy.

Do not access or assume a Research Project. Do not provide a protocol or recommendation. Return concise scientific content, not hidden reasoning.
`.trim();

const epistemicStatus = z.enum([
  "EXPLICIT_USER_STATED", "INFERRED_HIGH_CONFIDENCE", "INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE",
  "UNSUPPORTED_CANDIDATE", "CONFIRMED_BY_USER", "REJECTED_BY_USER", "UNKNOWN", "AMBIGUOUS",
]);
const polarity = z.enum(["AFFIRMED", "NEGATED", "UNCERTAIN", "CONDITIONAL"]);
const nullableText = z.string().nullable();
const confidence = z.number().min(0).max(1).nullable();
const routeProposalSchema = z.object({
  route: z.enum(["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE"]),
  confidence,
  reason: nullableText,
}).strict().nullable();

const scientificElementSchema = z.object({
  elementId: z.string().min(1),
  content: z.string().min(1),
  semanticIdentity: nullableText,
  semanticType: z.string().min(1),
  studyRole: z.string().min(1),
  sourceTurnIds: z.array(z.string()),
  sourceText: nullableText,
  polarity,
  temporalContext: nullableText,
  ownership: z.string().min(1),
  epistemicStatus,
  activeState: z.boolean(),
  previousElementIds: z.array(z.string()),
  evidenceRefs: z.array(z.string()),
  confidence,
  adoptionStatus: nullableText,
  originStatus: nullableText,
  originType: nullableText,
  availabilityScope: nullableText,
  availabilityClaim: nullableText,
  decisionId: nullableText,
}).strict();

const relationSchema = z.object({
  relationId: z.string().min(1),
  sourceElementId: z.string().min(1),
  targetElementId: z.string().min(1),
  relationType: z.string().min(1),
  sourceTurnIds: z.array(z.string()),
  sourceText: nullableText,
  polarity,
  temporalContext: nullableText,
  ownership: z.string().min(1),
  epistemicStatus,
  activeState: z.boolean(),
  previousRelationIds: z.array(z.string()),
  evidenceRefs: z.array(z.string()),
  confidence,
}).strict();

const ambiguitySchema = z.object({
  ambiguityId: z.string().min(1), content: z.string().min(1), interpretations: z.array(z.string()),
  decisionalImpact: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]), sourceTurnIds: z.array(z.string()),
  sourceText: nullableText, status: z.enum(["OPEN", "RESOLVED"]), decisionId: nullableText,
}).strict();

const missingSchema = z.object({
  missingId: z.string().min(1), content: z.string().min(1), decisionalImpact: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  blocking: z.boolean(), owner: z.string().min(1), sourceTurnIds: z.array(z.string()), sourceText: nullableText,
  epistemicStatus: z.enum(["UNKNOWN", "AMBIGUOUS"]),
}).strict();

const correctionSchema = z.object({
  correctionId: z.string().min(1), previousContent: z.string(), currentContent: z.string(),
  disposition: z.enum(["MODIFIED", "REJECTED", "SUPERSEDED", "CONFIRMED"]),
  previousSemanticIdentity: nullableText, currentSemanticIdentity: nullableText,
  sourceTurnIds: z.array(z.string()), sourceText: nullableText,
}).strict();

const ownershipSchema = z.object({
  statementId: z.string().min(1), content: z.string().min(1), ownership: z.string().min(1), epistemicStatus,
  sourceTurnIds: z.array(z.string()), sourceText: nullableText,
}).strict();

const openDecisionSchema = z.object({
  decisionId: z.string().min(1), content: z.string().min(1), affectedElementIds: z.array(z.string()),
  decisionOwner: z.string().min(1), status: z.enum(["OPEN", "CONFIRMED"]), sourceTurnIds: z.array(z.string()), sourceText: nullableText,
}).strict();

const clarificationSchema = z.object({
  clarificationId: z.string().min(1), targetUnknown: z.string().min(1),
  decisionalImpact: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]), affectedDecisions: z.array(z.string()),
  affectedBranches: z.array(z.string()), blocking: z.boolean(), candidateQuestionIntent: z.string().min(1), resolutionOwner: z.string().min(1),
}).strict();

export const hybridPrimaryInterpretationSchema = z.object({
  normalizedUnderstanding: z.string().min(1),
  routeProposal: routeProposalSchema.default(null),
  scientificGoalCandidates: z.array(z.string()),
  studyIntentCandidates: z.array(z.string()),
  objects: z.array(scientificElementSchema),
  relations: z.array(relationSchema),
  explicitStatements: z.array(scientificElementSchema),
  inferredContext: z.array(scientificElementSchema),
  contextualCandidates: z.array(scientificElementSchema),
  negationsAndConstraints: z.array(scientificElementSchema),
  temporalElements: z.array(scientificElementSchema),
  ambiguities: z.array(ambiguitySchema),
  unknowns: z.array(missingSchema),
  missingInformation: z.array(missingSchema),
  correctionsAndSupersessions: z.array(correctionSchema),
  ownershipAndEpistemicStates: z.array(ownershipSchema),
  openDecisions: z.array(openDecisionSchema),
  clarificationNeeds: z.array(clarificationSchema),
}).strict();

const nullableStringJson = { anyOf: [{ type: "string" }, { type: "null" }] } as const;
const nullableNumberJson = { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] } as const;
const stringArrayJson = { type: "array", items: { type: "string" } } as const;
const required = (properties: Record<string, unknown>) => Object.keys(properties);

const elementProperties = {
  elementId: { type: "string" }, content: { type: "string" }, semanticIdentity: nullableStringJson,
  semanticType: { type: "string" }, studyRole: { type: "string" }, sourceTurnIds: stringArrayJson,
  sourceText: nullableStringJson, polarity: { type: "string", enum: polarity.options }, temporalContext: nullableStringJson,
  ownership: { type: "string" }, epistemicStatus: { type: "string", enum: epistemicStatus.options }, activeState: { type: "boolean" },
  previousElementIds: stringArrayJson, evidenceRefs: stringArrayJson, confidence: nullableNumberJson,
  adoptionStatus: nullableStringJson, originStatus: nullableStringJson, originType: nullableStringJson,
  availabilityScope: nullableStringJson, availabilityClaim: nullableStringJson, decisionId: nullableStringJson,
};
const relationProperties = {
  relationId: { type: "string" }, sourceElementId: { type: "string" }, targetElementId: { type: "string" }, relationType: { type: "string" },
  sourceTurnIds: stringArrayJson, sourceText: nullableStringJson, polarity: { type: "string", enum: polarity.options }, temporalContext: nullableStringJson,
  ownership: { type: "string" }, epistemicStatus: { type: "string", enum: epistemicStatus.options }, activeState: { type: "boolean" },
  previousRelationIds: stringArrayJson, evidenceRefs: stringArrayJson, confidence: nullableNumberJson,
};

export const HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  $defs: {
    ScientificElement: {
      type: "object",
      description: "One atomic scientific entity, role, statement, constraint or temporal element. Distinct explicit concepts require distinct elements.",
      additionalProperties: false,
      properties: elementProperties,
      required: required(elementProperties),
    },
    ScientificRelation: {
      type: "object",
      description: "A directed relation whose endpoints are the actual active objects or statements participating in the relation.",
      additionalProperties: false,
      properties: relationProperties,
      required: required(relationProperties),
    },
    Ambiguity: { type: "object", additionalProperties: false, properties: {
      ambiguityId: { type: "string" }, content: { type: "string" }, interpretations: stringArrayJson,
      decisionalImpact: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] }, sourceTurnIds: stringArrayJson,
      sourceText: nullableStringJson, status: { type: "string", enum: ["OPEN", "RESOLVED"] }, decisionId: nullableStringJson,
    }, required: ["ambiguityId", "content", "interpretations", "decisionalImpact", "sourceTurnIds", "sourceText", "status", "decisionId"] },
    MissingInformation: { type: "object", additionalProperties: false, properties: {
      missingId: { type: "string" }, content: { type: "string" }, decisionalImpact: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] },
      blocking: { type: "boolean" }, owner: { type: "string" }, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
      epistemicStatus: { type: "string", enum: ["UNKNOWN", "AMBIGUOUS"] },
    }, required: ["missingId", "content", "decisionalImpact", "blocking", "owner", "sourceTurnIds", "sourceText", "epistemicStatus"] },
    Correction: { type: "object", additionalProperties: false, properties: {
      correctionId: { type: "string" }, previousContent: { type: "string" }, currentContent: { type: "string" },
      disposition: { type: "string", enum: ["MODIFIED", "REJECTED", "SUPERSEDED", "CONFIRMED"] },
      previousSemanticIdentity: nullableStringJson, currentSemanticIdentity: nullableStringJson, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
    }, required: ["correctionId", "previousContent", "currentContent", "disposition", "previousSemanticIdentity", "currentSemanticIdentity", "sourceTurnIds", "sourceText"] },
    OwnershipState: { type: "object", additionalProperties: false, properties: {
      statementId: { type: "string" }, content: { type: "string" }, ownership: { type: "string" },
      epistemicStatus: { type: "string", enum: epistemicStatus.options }, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
    }, required: ["statementId", "content", "ownership", "epistemicStatus", "sourceTurnIds", "sourceText"] },
    OpenDecision: { type: "object", additionalProperties: false, properties: {
      decisionId: { type: "string" }, content: { type: "string" }, affectedElementIds: stringArrayJson, decisionOwner: { type: "string" },
      status: { type: "string", enum: ["OPEN", "CONFIRMED"] }, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
    }, required: ["decisionId", "content", "affectedElementIds", "decisionOwner", "status", "sourceTurnIds", "sourceText"] },
    ClarificationNeed: { type: "object", additionalProperties: false, properties: {
      clarificationId: { type: "string" }, targetUnknown: { type: "string" }, decisionalImpact: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] },
      affectedDecisions: stringArrayJson, affectedBranches: stringArrayJson, blocking: { type: "boolean" },
      candidateQuestionIntent: { type: "string" }, resolutionOwner: { type: "string" },
    }, required: ["clarificationId", "targetUnknown", "decisionalImpact", "affectedDecisions", "affectedBranches", "blocking", "candidateQuestionIntent", "resolutionOwner"] },
  },
  properties: {
    normalizedUnderstanding: { type: "string" },
    routeProposal: { anyOf: [{ type: "object", additionalProperties: false, properties: {
      route: { type: "string", enum: ["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE"] },
      confidence: nullableNumberJson,
      reason: nullableStringJson,
    }, required: ["route", "confidence", "reason"] }, { type: "null" }] },
    scientificGoalCandidates: stringArrayJson, studyIntentCandidates: stringArrayJson,
    objects: {
      type: "array",
      description: "Atomic explicit scientific objects with one unambiguous semanticType per object; composite X_OR_Y types are forbidden. Include design or setting, every explicit allocation/randomization statement as its own STUDY_DESIGN or DESIGN object, condition, named or unnamed intervention or exposure, comparator, every explicitly named acquisition modality as MODALITY, every explicitly stated acquisition or imaging technique as METHOD when its exact variant is unspecified or variable, observed or measured phenomena as MEASURED_VARIABLE unless explicitly named as biomarkers or endpoints, explicit biomarkers as BIOMARKER, explicit comparison groups, every explicit eligibility or demographic criterion, and explicit comparative/statistical change intent as ANALYSIS or ANALYSIS_INTENT. An initial, baseline, follow-up or control acquisition is an occasion/timepoint rather than a modality or method. Direction or statistical significance without a named dependent measure is analysis intent and never a measurement or biomarker. Preserve criterion direction, boundary, value and unit without invention.",
      items: { $ref: "#/$defs/ScientificElement" },
    },
    relations: {
      type: "array",
      description: "Relations between the actual participating objects. Represent a comparison as one direct COMPARES_WITH relation from one comparison arm to the other in the user-expressed orientation. A statement describing the comparison is provenance and must not be a comparison endpoint or create statement-to-arm fan-out. Keep the measured variable separate from the compared arms.",
      items: { $ref: "#/$defs/ScientificRelation" },
    },
    explicitStatements: {
      type: "array",
      description: "Atomic explicit assertions. Split positive assertions from negative constraints and never negate a mixed-polarity combined statement.",
      items: { $ref: "#/$defs/ScientificElement" },
    }, inferredContext: { type: "array", items: { $ref: "#/$defs/ScientificElement" } },
    contextualCandidates: { type: "array", items: { $ref: "#/$defs/ScientificElement" } }, negationsAndConstraints: {
      type: "array",
      description: "Actual negative assertions, rejections, prohibitions and constraints. Every explicit instruction not to invent, assume, select, compare or use something is a separate NEGATED constraint, including when the same clause also permits another action. A definition, threshold, method, choice or value that is merely unknown or undecided belongs in unknowns or missingInformation instead; an UNKNOWN does not replace a separately stated prohibition.",
      items: { $ref: "#/$defs/ScientificElement" },
    },
    temporalElements: {
      type: "array",
      description: "Every explicit timepoint, interval, ordering, initial or repeated observation structure, and timing variability, even when also represented by method or acquisition objects. A compound fragment with baseline/initial and later/control/follow-up occasions requires one distinct entry per occurrence, with distinct semantic identities and BASELINE/INITIAL versus FOLLOW_UP roles when explicitly established.",
      items: { $ref: "#/$defs/ScientificElement" },
    }, ambiguities: { type: "array", items: { $ref: "#/$defs/Ambiguity" } },
    unknowns: {
      type: "array",
      description: "Explicitly unresolved definitions, thresholds, choices, methods, values or knowledge states. These are epistemic unknowns, not negative constraints. When direction of change or statistical significance is explicit but the dependent measure is unnamed, record that exact dependent measure as UNKNOWN. Never derive a user unknown from an unanswered NOXIA question alone.",
      items: { $ref: "#/$defs/MissingInformation" },
    }, missingInformation: {
      type: "array",
      description: "Information explicitly described as not yet defined, selected, known or determined when it is needed to complete the scientific interpretation, including an unnamed dependent measure behind an explicit change/comparison intent. Never derive missing information from an unanswered NOXIA question alone.",
      items: { $ref: "#/$defs/MissingInformation" },
    },
    correctionsAndSupersessions: {
      type: "array",
      description: "Only demonstrated corrections, rejections or replacements. Pure additions and refinements do not supersede compatible prior content.",
      items: { $ref: "#/$defs/Correction" },
    }, ownershipAndEpistemicStates: { type: "array", items: { $ref: "#/$defs/OwnershipState" } },
    openDecisions: { type: "array", items: { $ref: "#/$defs/OpenDecision" } }, clarificationNeeds: { type: "array", items: { $ref: "#/$defs/ClarificationNeed" } },
  },
  required: ["normalizedUnderstanding", "routeProposal", "scientificGoalCandidates", "studyIntentCandidates", "objects", "relations", "explicitStatements", "inferredContext", "contextualCandidates", "negationsAndConstraints", "temporalElements", "ambiguities", "unknowns", "missingInformation", "correctionsAndSupersessions", "ownershipAndEpistemicStates", "openDecisions", "clarificationNeeds"],
} as const;

type JsonSchemaValue = null | boolean | number | string | JsonSchemaValue[] | { [key: string]: JsonSchemaValue };

const PROVIDER_SCHEMA_KEYWORDS = new Set([
  "$defs", "$ref", "additionalProperties", "anyOf", "description", "enum", "items", "maximum", "minimum",
  "nullable", "properties", "required", "type",
]);

const toProviderTransportSchema = (value: JsonSchemaValue, context: "SCHEMA" | "PROPERTIES" | "DEFS" = "SCHEMA"): JsonSchemaValue => {
  if (Array.isArray(value)) return value.map((item) => toProviderTransportSchema(item));
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    if (context === "PROPERTIES" || context === "DEFS") {
      return [[key, toProviderTransportSchema(entry, "SCHEMA")]];
    }
    if (key === "const") return [["enum", [toProviderTransportSchema(entry)]]];
    if (!PROVIDER_SCHEMA_KEYWORDS.has(key)) return [];
    const childContext = key === "properties" ? "PROPERTIES" : key === "$defs" ? "DEFS" : "SCHEMA";
    return [[key, toProviderTransportSchema(entry, childContext)]];
  }));
};

export const HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA = toProviderTransportSchema(
  HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA as unknown as JsonSchemaValue,
) as Record<string, JsonSchemaValue>;

export const validateHybridProviderTransportSchema = (schema: JsonSchemaValue): string[] => {
  const errors: string[] = [];
  const visit = (value: JsonSchemaValue, path: string, context: "SCHEMA" | "PROPERTIES" | "DEFS") => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`, "SCHEMA"));
      return;
    }
    if (value === null || typeof value !== "object") return;
    Object.entries(value).forEach(([key, entry]) => {
      if (context === "SCHEMA" && !PROVIDER_SCHEMA_KEYWORDS.has(key)) errors.push(`${path}.${key}`);
      const childContext = key === "properties" ? "PROPERTIES" : key === "$defs" ? "DEFS" : "SCHEMA";
      visit(entry, `${path}.${key}`, context === "PROPERTIES" || context === "DEFS" ? "SCHEMA" : childContext);
    });
  };
  visit(schema, "$", "SCHEMA");
  return errors;
};

// Backward-compatible symbol for the uncommitted SEM-CLOSURE-001 candidate.
export const HYBRID_PRIMARY_JSON_SCHEMA = HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA;

export const HYBRID_PRIMARY_PROMPT_DIGEST = logicalDigest({ version: HYBRID_PRIMARY_PROMPT_VERSION, prompt: HYBRID_PRIMARY_SYSTEM_PROMPT });
export const HYBRID_PRIMARY_INTERNAL_SCHEMA_DIGEST = logicalDigest(HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA);
export const HYBRID_PRIMARY_TRANSPORT_SCHEMA_DIGEST = logicalDigest(HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA);
export const HYBRID_PRIMARY_SCHEMA_DIGEST = HYBRID_PRIMARY_INTERNAL_SCHEMA_DIGEST;

type ProviderRawEnvelope = {
  rawAttempts?: Array<{ httpStatus?: unknown; providerBodyText?: unknown }>;
};

const structuredArgumentsFromProviderBody = (bodyText: string) => {
  const body = JSON.parse(bodyText) as { candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name?: unknown; args?: unknown } }> } }> };
  const calls = body.candidates?.flatMap((candidate) => candidate.content?.parts?.flatMap((part) => part.functionCall ? [part.functionCall] : []) ?? []) ?? [];
  const call = calls.find((candidate) => candidate.name === HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME);
  if (!call) throw new Error("PROVIDER_OUTPUT_FUNCTION_CALL_MISSING");
  if (!call.args || typeof call.args !== "object" || Array.isArray(call.args)) throw new Error("PROVIDER_OUTPUT_FUNCTION_ARGUMENTS_INVALID");
  return call.args;
};

export const parseHybridPrimaryProviderOutput = (
  raw: unknown,
  execution: HybridNativeExecution,
  conversation: ScientificInterpretationConversation,
  previousState?: ScientificInterpretationContributionEnvelope | null,
): HybridParsedState => {
  const envelope = raw && typeof raw === "object" ? raw as ProviderRawEnvelope : {};
  const finalBody = envelope.rawAttempts?.at(-1)?.providerBodyText;
  if (typeof finalBody !== "string") throw new Error("PROVIDER_RESPONSE_BODY_MISSING");
  const parsedValue = hybridPrimaryInterpretationSchema.parse(structuredArgumentsFromProviderBody(finalBody));
  const noxiaTurnIds = new Set(conversation.turns.filter((turn) => turn.role === "NOXIA").map((turn) => turn.turnId));
  const userTurnIds = new Set(conversation.turns.filter((turn) => turn.role === "USER").map((turn) => turn.turnId));
  const groundedMissing = <T extends { sourceTurnIds?: string[] }>(items: T[]) => items.filter((item) => {
    const refs = item.sourceTurnIds ?? [];
    const citesNoxia = refs.some((turnId) => noxiaTurnIds.has(turnId));
    const citesUser = refs.some((turnId) => userTurnIds.has(turnId));
    return !citesNoxia || citesUser;
  });
  const groundedUnknowns = groundedMissing(parsedValue.unknowns);
  const groundedMissingInformation = groundedMissing(parsedValue.missingInformation);
  const analyses = parsedValue.objects.filter((item) => /ANALYSIS|ESTIMAND|STATISTICAL/i.test(`${item.semanticType} ${item.studyRole}`));
  const hasStructuredDependentMeasure = parsedValue.objects.some((item) => /BIOMARKER|MEASURED_VARIABLE|MEASUREMENT|ENDPOINT|OUTCOME|QUANTITATIVE_TARGET/i.test(item.semanticType));
  const analysisTargetUnknowns = hasStructuredDependentMeasure ? [] : analyses
    .filter((analysis) => ![...groundedUnknowns, ...groundedMissingInformation].some((missing) =>
      missing.sourceText === analysis.sourceText
      || missing.sourceTurnIds.some((turnId) => analysis.sourceTurnIds.includes(turnId))))
    .map((analysis) => ({
      missingId: `analysis-target:${logicalDigest({ analysis: analysis.elementId, source: analysis.sourceTurnIds })}`,
      content: `Exact dependent measure for analysis intent: ${analysis.content}`,
      decisionalImpact: "HIGH" as const,
      blocking: false,
      owner: "USER",
      sourceTurnIds: analysis.sourceTurnIds,
      sourceText: analysis.sourceText,
      epistemicStatus: "UNKNOWN" as const,
    }));
  const value = {
    ...parsedValue,
    unknowns: [...groundedUnknowns, ...analysisTargetUnknowns],
    missingInformation: groundedMissingInformation,
  };
  const generatedAt = new Date().toISOString();
  return {
    identity: {
      stateId: `hybrid-state:${logicalDigest({ conversationId: conversation.conversationId, previous: previousState?.identity.contributionDigest ?? null, value })}`,
      conversationId: conversation.conversationId,
      previousStateId: previousState?.identity.contributionId ?? null,
      generatedAt,
    },
    source: {
      originalRequest: conversation.turns.find((turn) => turn.role === "USER")?.content ?? "",
      turns: conversation.turns,
    },
    understanding: {
      normalizedUnderstanding: value.normalizedUnderstanding,
      scientificGoalCandidates: value.scientificGoalCandidates,
      studyIntentCandidates: value.studyIntentCandidates,
    },
    ...value,
    technicalStatus: "STRUCTURED_CONTRACT_VALID",
    auditStatus: "NOT_RUN",
    adjudicationStatus: "NOT_REQUIRED",
    runtimeIdentity: {
      runtimeId: execution.runtimeId,
      runtimeVersion: execution.runtimeVersion,
      provider: execution.provider,
      model: execution.model,
      promptDigest: execution.promptDigest,
      schemaDigest: execution.schemaDigest,
      configurationDigest: execution.configurationDigest,
    },
  };
};
