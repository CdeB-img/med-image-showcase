import { z } from "zod";
import type { ProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone";
import type { DocumentProjectBinding } from "./generation-persistence";

export const STUDIO_RECONCILIATION_CONTRACT = "STUDIO_RECONCILIATION_V1" as const;
export type StudioNativeDelta = Readonly<{
  editRef: string; nodeId: string; nativeAnchor: string; field: "TITLE" | "SECTION_HEADING" | "BLOCK";
  change: "UNCHANGED" | "ADDED" | "REMOVED" | "MODIFIED";
  beforeText: string; afterText: string; beforeDigest: string; afterDigest: string;
  contextDigest: string; provenanceRefs: readonly string[];
}>;
export type StudioScientificState = Readonly<{
  stateDigest: string; pendingTurnRef: string | null; pendingPreparationId: string | null;
  preparations: readonly Readonly<{ preparationId: string; requestDigest: string; inputDigest: string;
    resultDigest: string | null; cutoffTurnId: string; project: DocumentProjectBinding | null;
    status: string; decision: string; valid: boolean }>[];
}>;
export type StudioReconciliationRequest = Readonly<{
  contract: typeof STUDIO_RECONCILIATION_CONTRACT; requestId: string; requestDigest: string;
  origin: "STUDIO"; logicalDocumentRef: string; nativeDocumentRef: string;
  workingRevisionId: string; workingRevisionSaveSequence: number; workingRevisionContentDigest: string;
  baseGenerationId: string; baseGenerationBodyDigest: string; baseProject: DocumentProjectBinding;
  currentProject: Readonly<ProjectContextSnapshot>; scientificState: StudioScientificState;
  delta: readonly StudioNativeDelta[];
  projectWriteAuthorized: false;
}>;

const ref = z.string().min(1).max(600).refine(value => !value.includes("\u0000"));
const coverage = z.object({ coverage: z.enum(["COMPLETE", "PARTIAL", "UNKNOWN"]),
  projectVersionRefs: z.array(ref).min(1) }).strict();
const ambiguity = z.object({ question: ref, alternatives: z.array(z.object({ interpretation: ref,
  consequence: ref }).strict()).min(2).max(5), materialProjectRefs: z.array(ref).min(1) }).strict();
/** Existing DOCUMENT_ONLY / PROJECT_CHANGE / AMBIGUOUS vocabulary. This is
 * a scoped owner receipt, never a general free-text equivalence certificate. */
export const studioAssessmentPayloadSchema = z.object({
  requestDigest: ref,
  scientificStateDisposition: z.enum(["NO_NET_CHANGE", "PENDING_HUMAN_CONFIRMATION", "AMBIGUOUS"]),
  scientificStateReason: ref,
  scientificStateAmbiguity: ambiguity.nullable(),
  edits: z.array(z.object({ editRef: ref,
    classification: z.enum(["DOCUMENT_ONLY", "PROJECT_CHANGE", "AMBIGUOUS"]),
    reason: ref, provenanceRefs: z.array(ref).min(1), projectCoverage: coverage.nullable(),
    ambiguity: ambiguity.nullable(),
  }).strict()),
}).strict();
export type StudioAssessmentPayload = z.infer<typeof studioAssessmentPayloadSchema>;
export type StudioReconciliationPlan = Readonly<{
  contract: typeof STUDIO_RECONCILIATION_CONTRACT; requestId: string; requestDigest: string; planDigest: string;
  targetProject: DocumentProjectBinding; assessmentRef: string | null; assessmentDigest: string | null;
  scientificStateAmbiguity: StudioAssessmentPayload["scientificStateAmbiguity"];
  state: "NO_CHANGE" | "READY" | "REQUIRES_RECONCILIATION" | "NEEDS_HUMAN_ARBITRATION" | "SCIENTIFIC_PREPARATION_REQUIRED";
  edits: readonly Readonly<{ source: StudioNativeDelta;
    action: "REPLAY_EDITORIAL" | "SCIENTIFIC_CONTRIBUTION" | "REQUIRES_RECONCILIATION" | "REQUIRES_HUMAN_ARBITRATION";
    assessmentRef: string; reason: string; targetAnchor: string | null; targetContextDigest: string | null;
    ambiguity: StudioAssessmentPayload["scientificStateAmbiguity"];
    projectCoverage: "COMPLETE" | "PARTIAL" | "UNKNOWN" | null }>[];
  scientificContribution: Readonly<{ origin: "STUDIO"; requestId: string; assessmentRef: string;
    logicalDocumentRef: string; baseGenerationId: string; targetProject: DocumentProjectBinding;
    edits: readonly StudioNativeDelta[]; projectWriteAuthorized: false }> | null;
  scientificPreparation: Readonly<{ action: "NONE" | "REUSE_VALID_PREPARATION" | "EXISTING_SCIENTIFIC_PREPARATION_PATH";
    preparationId: string | null; reason: string }>;
  packModel: "COMPLETE_PACK"; projectWriteAuthorized: false;
}>;
export class StudioReconciliationError extends Error {
  constructor(readonly code: string) { super(code); }
}
