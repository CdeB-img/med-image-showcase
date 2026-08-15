import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationFinding } from "@/features/scientific-interpretation/contracts";
import { validationDigest } from "./canonical";
import { SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ADAPTER } from "./product-adapters";
import type { ValidationDisposition, ValidationEvidence, ValidationObservation, ValidationProductFinding } from "./product-contracts";
import type { ValidationSeverity } from "./types";
import { VAL001_CHECKPOINT_IDS } from "./invariant-registry";

const invariantForAuditCode = (code: string) => `AUDIT-D:${code}`;
const severityFor = (finding: ScientificInterpretationFinding): ValidationSeverity => finding.severity === "CRITICAL" ? "BLOCKING" : finding.severity;
const dispositionFor = (finding: ScientificInterpretationFinding): ValidationDisposition => finding.severity === "CRITICAL" ? "BLOCK_HANDOFF" : finding.severity === "WARNING" ? "CONTINUE_WITH_WARNING" : "CONTINUE";

export const buildValidationObservationsFromAuditD = (
  contribution: Readonly<ScientificInterpretationContributionEnvelope>,
  targetArtifactRef = SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ADAPTER.buildReference(contribution),
): { observations: ValidationObservation[]; findings: ValidationProductFinding[]; warning: "VAL_AUDIT_FINDING_PRESENT" | null } => {
  const sourceArtifactRef = SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ADAPTER.buildReference(contribution);
  const auditFindings = contribution.audit.deterministicFindings;
  const observations = auditFindings.map((finding): ValidationObservation => {
    const evidence: ValidationEvidence = {
      evidenceId: `val-evidence:${finding.findingId}`,
      kind: "AUDIT_FINDING",
      sourcePath: "audit.deterministicFindings",
      targetPath: null,
      sourceObjectRef: contribution.identity.contributionId,
      targetObjectRef: null,
      exactSourceSpan: null,
      relationRef: null,
      decisionRef: null,
      provenanceRef: null,
      digest: validationDigest(finding),
      auditFindingRef: finding.findingId,
      domainValidatorResultRef: null,
      comparisonNote: "Referenced without recomputing or mutating SEM-AUDIT-D.",
    };
    return {
      observationId: `val-observation:${validationDigest({ auditFinding: finding.findingId, contribution: contribution.identity.contributionId })}`,
      checkpointId: VAL001_CHECKPOINT_IDS.requestInterpretation,
      invariantRef: invariantForAuditCode(finding.code),
      plane: finding.code.includes("SOURCE") ? "PROVENANCE_LINEAGE" : finding.code.includes("PROMOTED") ? "DECISION" : "EPISTEMIC",
      sourceRef: finding.findingId,
      targetRef: contribution.identity.contributionId,
      observationType: "CONFLICT",
      sourcePath: "audit.deterministicFindings",
      targetPath: null,
      sourceValueRef: finding.findingId,
      targetValueRef: null,
      semanticKey: null,
      evidence: [evidence],
      deterministic: true,
      confidenceKind: "DETERMINISTIC",
      technicalStatus: "SUCCESS",
      limitations: [],
    };
  });
  const findings = auditFindings.map((finding, index): ValidationProductFinding => ({
    findingId: `val-finding:${validationDigest({ auditFinding: finding.findingId, contribution: contribution.identity.contributionId })}`,
    checkpointId: VAL001_CHECKPOINT_IDS.requestInterpretation,
    invariantRef: invariantForAuditCode(finding.code),
    observationRefs: [observations[index].observationId],
    findingClass: "AUDIT_FINDING_PRESENT",
    domainFailureClassRef: finding.code,
    severity: severityFor(finding),
    disposition: dispositionFor(finding),
    sourceArtifactRef,
    targetArtifactRef,
    evidence: observations[index].evidence,
    owner: "SEM-AUDIT-D",
    reviewOwner: "SCIENTIFIC_INTERPRETATION",
    technicalStatus: "SUCCESS",
    semanticStatus: "FINDINGS_PRESENT",
    reviewRequired: finding.severity === "CRITICAL",
    humanDecisionRequired: false,
    blocking: finding.severity === "CRITICAL",
    limitations: [],
    provenance: [finding.findingId],
    automaticCorrectionAllowed: false,
    autoDecisionAllowed: false,
  }));
  return { observations, findings, warning: auditFindings.length ? "VAL_AUDIT_FINDING_PRESENT" : null };
};

export const SEM_AUDIT_L_PRODUCT_ACTIVE = false as const;
