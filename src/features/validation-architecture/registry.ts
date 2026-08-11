import { validationDigest } from "./canonical";
import { VALIDATION_INVARIANT_IDS } from "./invariants";
import type { ValidationPolicy, ValidatorDefinition, ValidatorRegistry, ValidatorType } from "./types";

const validator = (definition: ValidatorDefinition): ValidatorDefinition => Object.freeze({
  ...definition,
  supportedInvariantIds: [...definition.supportedInvariantIds],
  dependencies: [...definition.dependencies],
  limitations: [...definition.limitations],
  provenance: [...definition.provenance],
});

const COMMON_INVARIANTS = [...VALIDATION_INVARIANT_IDS];

const VALIDATORS: readonly ValidatorDefinition[] = Object.freeze([
  validator({ validatorId: "VAL-SEM-ST-001", validatorType: "SEMANTIC_FIDELITY", version: "1.0.0", status: "FUTURE", sourceType: "SEMANTIC_MODEL", targetType: "SCIENTIFIC_THINKING_OUTPUT", supportedInvariantIds: COMMON_INVARIANTS, availability: "PENDING_SEM_QUALIFICATION", dependencies: [], owner: "VAL-001_FUTURE", limitations: ["SEM-001R3 is not qualified and is absent from the consolidated baseline."], provenance: ["VAL-000", "SYS-001#22", "PENDING_SEM_QUALIFICATION"] }),
  validator({ validatorId: "VAL-ST-IMG-001", validatorType: "ST_HANDOFF", version: "1.0.0", status: "EXPERIMENTAL", sourceType: "SCIENTIFIC_THINKING_OUTPUT", targetType: "IMAGING_DESIGN_RESULT", supportedInvariantIds: COMMON_INVARIANTS, availability: "AVAILABLE", dependencies: [], owner: "VAL-000", limitations: ["Diagnostic structural comparison only; no engine qualification."], provenance: ["VAL-000", "ST-001", "IMG-001", "SYS-001B"] }),
  validator({ validatorId: "VAL-IMG-PRJ-001", validatorType: "IMG_HANDOFF", version: "1.0.0", status: "EXPERIMENTAL", sourceType: "IMAGING_DESIGN_RESULT", targetType: "RESEARCH_PROJECT_RESULT", supportedInvariantIds: COMMON_INVARIANTS, availability: "AVAILABLE", dependencies: [], owner: "VAL-000", limitations: ["Diagnostic structural comparison only; executable protocol readiness is outside VAL-000."], provenance: ["VAL-000", "IMG-001B", "PRJ-001"] }),
  validator({ validatorId: "VAL-PRJ-CONSISTENCY-001", validatorType: "PROJECT_CONSISTENCY", version: "1.0.0", status: "EXPERIMENTAL", sourceType: "RESEARCH_PROJECT_RESULT", targetType: "RESEARCH_PROJECT_RESULT", supportedInvariantIds: COMMON_INVARIANTS, availability: "AVAILABLE", dependencies: [], owner: "VAL-000", limitations: ["Does not validate scientific correctness or project readiness."], provenance: ["VAL-000", "RDE-001", "PRJ-001"] }),
  validator({ validatorId: "VAL-PRJ-REG-001", validatorType: "REGULATORY_CONSISTENCY", version: "1.0.0", status: "EXPERIMENTAL", sourceType: "RESEARCH_PROJECT_RESULT", targetType: "REGULATORY_RESOLUTION_RESULT", supportedInvariantIds: COMMON_INVARIANTS, availability: "AVAILABLE", dependencies: [], owner: "VAL-000", limitations: ["REG-000 remains a candidate corpus; no regulatory qualification is performed."], provenance: ["VAL-000", "REG-001"] }),
  validator({ validatorId: "VAL-TMP-001", validatorType: "TEMPLATE_CONSISTENCY", version: "1.0.0", status: "EXPERIMENTAL", sourceType: "MULTIPLE", targetType: "STUDY_TEMPLATE_INSTANCE", supportedInvariantIds: COMMON_INVARIANTS, availability: "AVAILABLE", dependencies: [], owner: "VAL-000", limitations: ["Checks structure and ownership only; no template is approved."], provenance: ["VAL-000", "DOC-002", "TMP-001"] }),
  validator({ validatorId: "VAL-DOC-001", validatorType: "DOCUMENT_FIDELITY", version: "1.0.0", status: "EXPERIMENTAL", sourceType: "MULTIPLE", targetType: "DOCUMENT_PROJECTION", supportedInvariantIds: COMMON_INVARIANTS, availability: "AVAILABLE", dependencies: [], owner: "VAL-000", limitations: ["Only the current PROTOCOL projection contract is represented by DOC-001B."], provenance: ["VAL-000", "DOC-001", "DOC-001B"] }),
  validator({ validatorId: "VAL-CROSS-PROJECTION-001", validatorType: "CROSS_PROJECTION", version: "1.0.0", status: "EXPERIMENTAL", sourceType: "DOCUMENT_PROJECTION", targetType: "RENDERER_OUTPUT", supportedInvariantIds: COMMON_INVARIANTS, availability: "AVAILABLE", dependencies: [], owner: "VAL-000", limitations: ["Compares logical renderer projections; it is not a visual or accessibility audit."], provenance: ["VAL-000", "DOC-001B", "PD-011"] }),
]);

export const VALIDATOR_REGISTRY: ValidatorRegistry = Object.freeze({
  registryId: "VAL-000-VALIDATOR-REGISTRY",
  version: "1.0.0",
  validators: [...VALIDATORS],
  digest: validationDigest(VALIDATORS),
  boundary: "TECHNICAL_VALIDATOR_REGISTRY_NOT_SCIENTIFIC_QUALIFICATION",
});

const policy = (input: Omit<ValidationPolicy, "boundary">): ValidationPolicy => Object.freeze({
  ...input,
  invariantIds: [...input.invariantIds],
  blockingSeverities: [...input.blockingSeverities],
  requiredValidators: input.requiredValidators.map((item) => ({ ...item })),
  compatibleSources: input.compatibleSources.map((item) => ({ ...item, versions: [...item.versions] })),
  boundary: "TECHNICAL_VALIDATION_POLICY_NOT_SCIENTIFIC_STANDARD",
});

export const VALIDATION_POLICIES: readonly ValidationPolicy[] = Object.freeze([
  policy({ policyId: "ENGINE_HANDOFF", version: "1.0.0", invariantIds: COMMON_INVARIANTS, blockingSeverities: ["BLOCKING"], warningsAccepted: false, requiredValidators: [{ validatorId: "VAL-ST-IMG-001", version: "1.0.0" }, { validatorId: "VAL-IMG-PRJ-001", version: "1.0.0" }], compatibleSources: [{ sourceType: "SCIENTIFIC_THINKING_OUTPUT", versions: ["1.1.0"] }, { sourceType: "IMAGING_DESIGN_RESULT", versions: ["1.2.0"] }] }),
  policy({ policyId: "PROJECT_CONSTRUCTION", version: "1.0.0", invariantIds: COMMON_INVARIANTS, blockingSeverities: ["BLOCKING"], warningsAccepted: false, requiredValidators: [{ validatorId: "VAL-PRJ-CONSISTENCY-001", version: "1.0.0" }, { validatorId: "VAL-IMG-PRJ-001", version: "1.0.0" }], compatibleSources: [{ sourceType: "RESEARCH_PROJECT_RESULT", versions: ["1.1.0"] }, { sourceType: "IMAGING_DESIGN_RESULT", versions: ["1.2.0"] }] }),
  policy({ policyId: "REGULATORY_COMPOSITION", version: "1.0.0", invariantIds: COMMON_INVARIANTS, blockingSeverities: ["BLOCKING", "ERROR"], warningsAccepted: false, requiredValidators: [{ validatorId: "VAL-PRJ-REG-001", version: "1.0.0" }], compatibleSources: [{ sourceType: "RESEARCH_PROJECT_RESULT", versions: ["1.1.0"] }] }),
  policy({ policyId: "TEMPLATE_COMPOSITION", version: "1.0.0", invariantIds: COMMON_INVARIANTS, blockingSeverities: ["BLOCKING", "ERROR"], warningsAccepted: false, requiredValidators: [{ validatorId: "VAL-TMP-001", version: "1.0.0" }], compatibleSources: [{ sourceType: "MULTIPLE", versions: ["1.0.0"] }] }),
  policy({ policyId: "DOCUMENT_PROJECTION", version: "1.0.0", invariantIds: COMMON_INVARIANTS, blockingSeverities: ["BLOCKING", "ERROR"], warningsAccepted: false, requiredValidators: [{ validatorId: "VAL-DOC-001", version: "1.0.0" }], compatibleSources: [{ sourceType: "MULTIPLE", versions: ["1.0.0"] }] }),
  policy({ policyId: "CROSS_PROJECTION", version: "1.0.0", invariantIds: COMMON_INVARIANTS, blockingSeverities: ["BLOCKING", "ERROR"], warningsAccepted: false, requiredValidators: [{ validatorId: "VAL-CROSS-PROJECTION-001", version: "1.0.0" }], compatibleSources: [{ sourceType: "DOCUMENT_PROJECTION", versions: ["1.2.0"] }] }),
  policy({ policyId: "SEMANTIC_END_TO_END_FUTURE", version: "1.0.0", invariantIds: COMMON_INVARIANTS, blockingSeverities: ["BLOCKING", "ERROR"], warningsAccepted: false, requiredValidators: [{ validatorId: "VAL-SEM-ST-001", version: "1.0.0" }], compatibleSources: [{ sourceType: "SEMANTIC_MODEL", versions: ["PENDING_SEM_QUALIFICATION"] }] }),
]);

export const getValidator = (validatorIdOrType: string): ValidatorDefinition | null => {
  const found = VALIDATOR_REGISTRY.validators.find((item) => item.validatorId === validatorIdOrType || item.validatorType === validatorIdOrType as ValidatorType);
  return found ? structuredClone(found) : null;
};

export const listValidators = (): ValidatorDefinition[] => structuredClone(VALIDATOR_REGISTRY.validators);
export const listPolicies = (): ValidationPolicy[] => structuredClone([...VALIDATION_POLICIES]);
export const getValidationPolicy = (policyId: string): ValidationPolicy | null => {
  const found = VALIDATION_POLICIES.find((item) => item.policyId === policyId);
  return found ? structuredClone(found) : null;
};
