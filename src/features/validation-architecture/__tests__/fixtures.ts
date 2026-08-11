import { validationDigest } from "../canonical";
import { VALIDATION_INVARIANT_IDS } from "../invariants";
import type { ValidationArtifact, ValidationElement, ValidationErrorCode, ValidationRequest, ValidatorType } from "../types";

const baseElement = (patch: Partial<ValidationElement> = {}): ValidationElement => ({
  ref: "object:1",
  kind: "PROJECT_OBJECT",
  semanticKey: "explicit scientific object",
  status: "KNOWN",
  sourceRefs: [],
  provenanceRefs: ["source:1"],
  owner: "RESEARCH_PROJECT",
  ...patch,
});

const makeArtifact = (side: "source" | "target", patch: Partial<ValidationArtifact> = {}): ValidationArtifact => ({
  artifactId: `fixture-${side}`,
  artifactType: "RESEARCH_PROJECT_RESULT",
  version: "1.0.0",
  digest: `fixture-${side}-digest`,
  owner: "RESEARCH_PROJECT",
  sourceArtifactRefs: side === "target" ? ["fixture-source"] : [],
  elements: [baseElement(side === "target" ? { sourceRefs: ["object:1"] } : {})],
  relations: [],
  boundary: "SYNTHETIC_VALIDATION_FIXTURE",
  ...patch,
});

export const makeValidationRequest = (options: {
  source?: ValidationArtifact;
  target?: ValidationArtifact;
  validatorType?: ValidatorType;
  validationId?: string;
  rendererOnlyChange?: boolean;
} = {}): ValidationRequest => {
  const source = options.source ?? makeArtifact("source");
  const target = options.target ?? makeArtifact("target");
  return {
    validationId: options.validationId ?? `VAL-FIXTURE-${validationDigest({ source: source.artifactId, target: target.artifactId, validator: options.validatorType ?? "PROJECT_CONSISTENCY" })}`,
    validatorType: options.validatorType ?? "PROJECT_CONSISTENCY",
    sourceArtifact: source,
    targetArtifact: target,
    sourceVersion: source.version,
    targetVersion: target.version,
    sourceDigest: source.digest,
    targetDigest: target.digest,
    context: { rendererOnlyChange: options.rendererOnlyChange },
    expectedInvariantSet: [...VALIDATION_INVARIANT_IDS],
    humanDecisions: [],
    unknowns: [],
    contradictions: [],
    limitations: ["SYNTHETIC_FIXTURE_NOT_SCIENTIFIC_EVIDENCE"],
    provenance: ["VAL-000:FIXTURE"],
    requestedAt: "2026-08-11T10:00:00.000Z",
    validationPolicyVersion: "1.0.0",
  };
};

const mappedPair = (sourcePatch: Partial<ValidationElement>, targetPatch: Partial<ValidationElement>) => {
  const sourceElement = baseElement(sourcePatch);
  const targetElement = baseElement({ ...sourcePatch, sourceRefs: [sourceElement.ref], ...targetPatch });
  return {
    source: makeArtifact("source", { elements: [sourceElement] }),
    target: makeArtifact("target", { elements: [targetElement] }),
  };
};

export type SyntheticValidationFixture = { fixtureId: string; request: ValidationRequest; expectedCode: ValidationErrorCode | null };

export const SYNTHETIC_VALIDATION_FIXTURES: SyntheticValidationFixture[] = [
  { fixtureId: "01-exact-preservation", request: makeValidationRequest(), expectedCode: null },
  { fixtureId: "02-object-lost", request: makeValidationRequest({ target: makeArtifact("target", { elements: [] }) }), expectedCode: "OBJECT_LOST" },
  { fixtureId: "03-relation-lost", request: makeValidationRequest({ source: makeArtifact("source", { relations: [{ ref: "relation:1", from: "object:1", to: "object:2", relationType: "DEPENDS_ON", sourceRefs: [], provenanceRefs: ["source:1"], owner: "RESEARCH_PROJECT" }] }) }), expectedCode: "RELATION_LOST" },
  { fixtureId: "04-unknown-strengthened", request: makeValidationRequest(mappedPair({ ref: "unknown:1", kind: "UNKNOWN", semanticKey: "missing fact", status: "UNKNOWN" }, { status: "KNOWN" })), expectedCode: "UNKNOWN_STRENGTHENED" },
  { fixtureId: "05-contradiction-hidden", request: makeValidationRequest({ source: makeArtifact("source", { elements: [baseElement({ ref: "contradiction:1", kind: "CONTRADICTION", semanticKey: "positions conflict", status: "OPEN" })] }), target: makeArtifact("target", { elements: [] }) }), expectedCode: "CONTRADICTION_HIDDEN" },
  { fixtureId: "06-decision-lost", request: makeValidationRequest({ source: makeArtifact("source", { elements: [baseElement({ ref: "decision:1", kind: "DECISION", semanticKey: "decision:1", status: "ADOPTED", version: "1", owner: "HUMAN" })] }), target: makeArtifact("target", { elements: [] }) }), expectedCode: "DECISION_LOST" },
  { fixtureId: "07-provenance-lost", request: makeValidationRequest(mappedPair({}, { provenanceRefs: [] })), expectedCode: "PROVENANCE_LOST" },
  { fixtureId: "08-ownership-violation", request: makeValidationRequest(mappedPair({}, { owner: "DOC-001" })), expectedCode: "OWNERSHIP_VIOLATION" },
  { fixtureId: "09-requirement-reinterpreted", request: makeValidationRequest(mappedPair({ ref: "requirement:1", kind: "REQUIREMENT", semanticKey: "requirement", status: "POTENTIALLY_APPLICABLE", owner: "REG-001" }, { status: "APPLICABLE" })), expectedCode: "REQUIREMENT_REINTERPRETED" },
  { fixtureId: "10-pattern-promoted", request: makeValidationRequest(mappedPair({ ref: "pattern:1", kind: "PATTERN", semanticKey: "pattern", status: "CANDIDATE_ONLY", owner: "DOC-002" }, { status: "OFFICIAL" })), expectedCode: "PATTERN_PROMOTED" },
  { fixtureId: "11-template-bypass", request: makeValidationRequest({ source: makeArtifact("source", { artifactId: "template:1", artifactType: "STUDY_TEMPLATE_INSTANCE", owner: "TMP-001", elements: [baseElement({ ref: "template-node:1", kind: "TEMPLATE_NODE", owner: "TMP-001" })] }), target: makeArtifact("target", { artifactType: "DOCUMENT_PROJECTION", owner: "DOC-001", sourceArtifactRefs: [], elements: [baseElement({ ref: "template-node:1", kind: "TEMPLATE_NODE", owner: "TMP-001", sourceRefs: ["template-node:1"] })] }), validatorType: "DOCUMENT_FIDELITY" }), expectedCode: "TEMPLATE_STRUCTURE_BYPASSED" },
  { fixtureId: "12-document-invented-content", request: makeValidationRequest({ target: makeArtifact("target", { artifactType: "DOCUMENT_PROJECTION", elements: [baseElement({ sourceRefs: ["object:1"] }), baseElement({ ref: "document-content:invented", kind: "DOCUMENT_CONTENT", semanticKey: "invented", status: "GENERATABLE", sourceRefs: [], provenanceRefs: [], owner: "DOC-001" })] }), validatorType: "DOCUMENT_FIDELITY" }), expectedCode: "DOCUMENT_CONTENT_INVENTED" },
  { fixtureId: "13-renderer-only-change", request: makeValidationRequest({ source: makeArtifact("source", { artifactType: "DOCUMENT_PROJECTION", version: "1.2.0", elements: [baseElement({ ref: "section:1", kind: "DOCUMENT_CONTENT", semanticKey: "content-digest", status: "GENERATABLE", owner: "DOC-001" })] }), target: makeArtifact("target", { artifactType: "RENDERER_OUTPUT", version: "2.0.0", sourceArtifactRefs: ["fixture-source"], elements: [baseElement({ ref: "section:1", kind: "DOCUMENT_CONTENT", semanticKey: "content-digest", status: "GENERATABLE", sourceRefs: ["section:1"], owner: "DOC-001" })] }), validatorType: "CROSS_PROJECTION", rendererOnlyChange: true }), expectedCode: null },
  { fixtureId: "14-missing-engine-simulated", request: makeValidationRequest(mappedPair({ ref: "engine:biostatistics", kind: "ENGINE_CAPABILITY", semanticKey: "biostatistics", status: "UNAVAILABLE", owner: "BIOSTATISTICS" }, { status: "IMPLEMENTED" })), expectedCode: "FUTURE_SIMULATED" },
  { fixtureId: "15-not-applicable-strengthened", request: makeValidationRequest(mappedPair({ status: "NOT_APPLICABLE" }, { status: "APPLICABLE" })), expectedCode: "NOT_APPLICABLE_STRENGTHENED" },
  { fixtureId: "16-future-simulated", request: makeValidationRequest(mappedPair({ status: "FUTURE" }, { status: "IMPLEMENTED" })), expectedCode: "FUTURE_SIMULATED" },
];

