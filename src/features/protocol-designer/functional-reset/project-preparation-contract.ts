/** Native checkpoint/result contract shared by existing session and server
 * owners. No session loader, React dependency or second lifecycle. */
import type { ProductBridgeRequest } from "../product-bridge.js";
import type { StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal.js";
import type { WorkingDraftMetadata } from "./continuous-project-build.js";
import type { ScientificDiscussionRetention } from "./contribution-discussion-retention.js";

export type ProjectPreparationCheckpoint = Readonly<{
  contract: "EXPLICIT_PROJECT_PREPARATION_V1";
  preparationId: string; sessionId: string; projectId: string; cutoffTurnId: string;
  conversationCutoffTurnId?: string;
  preparationTrigger?: "EXPLICIT_PROJECT_PREPARATION_ACTION" | "NATIVE_STUDIO_SCIENTIFIC_CONTRIBUTION";
  presentation?: "INTERNAL_VERSION_PRODUCTION";
  scientificSourceIdentity?: ProductBridgeRequest["workingDraftScientificSource"];
  capturedAt: string; requestDigest: string; inputDigest: string; previousDraftDigest: string;
  request: ProductBridgeRequest; previousDraft: WorkingDraftMetadata | null;
  priorDiscussionProposalBindings?: readonly { elementRef: string;
    binding: ScientificDiscussionRetention["elements"][number]["proposalBinding"] }[];
}>;
export type ProjectPreparationResult = Readonly<{ composition: StudyProposalComposition; workingDraft: WorkingDraftMetadata }>;
export type ProjectPreparationDecision = "PENDING" | "ADOPTED" | "REFUSED" | "ABANDONED";
export type WorkingDraftPreparationStatus = "PREPARING" | "READY_FOR_REVIEW" | "FAILED" | "SUPERSEDED" | "UNKNOWN/INTERRUPTED" | "NO_CHANGE";
export type WorkingDraftPreparation = Readonly<{
  checkpoint?: ProjectPreparationCheckpoint; result?: ProjectPreparationResult; decision?: ProjectPreparationDecision;
  adoptedContributionRef?: string; postCutoffBlocker?: string;
  sourceTurnRef: string; status: WorkingDraftPreparationStatus; code: string | null; updatedAt: string;
  recovery?: Readonly<{ sourceResponseRef: string; compositionResponseRef: string; sourceConversationDigest: string;
    baseProjectId: string; baseProjectVersion: string | null; baseProjectDigest: string | null }>;
}>;
