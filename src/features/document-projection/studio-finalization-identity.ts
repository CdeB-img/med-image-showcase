import { logicalDigest, stableStringify } from "../knowledge-engine/canonical";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary";
import type { DocumentArchiveClient } from "./generation-archive-client";
import { DOC_ARCHIVE_CONTRACT, type DocumentPersistenceReceipt } from "./generation-persistence";
import type { DocumentWorkingRevision } from "./working-revision";
import { assertStudioReconciliationCurrent } from "./studio-reconciliation";
import { StudioReconciliationError, type StudioReconciliationPlan, type StudioReconciliationRequest,
  type StudioScientificState } from "./studio-reconciliation-contract";

/** Serializable DOC request identity for the existing archive receipt owner.
 * It allocates no generation/ordinal and is NOT a durable successful generation.
 * Future dispatch must retain this identity through the existing recovery path. */
export type StudioFinalizationIdentity = Readonly<{
  contract: "STUDIO_FINALIZATION_IDENTITY_V1"; requestId: string; requestDigest: string;
  reconciliationRequestId: string; reconciliationPlanDigest: string; logicalDocumentRef: string;
  sourceGenerationId: string; sourceGenerationBodyDigest: string;
  workingRevisionId: string; workingRevisionSaveSequence: number; workingRevisionContentDigest: string;
  targetProject: StudioReconciliationPlan["targetProject"];
  target: Readonly<{ kind: "COMPLETE_PACK"; nativeFamily: "DRCI"; documentContractDigest: string }>;
}>;
export const createStudioFinalizationIdentity = (input: { request: StudioReconciliationRequest; plan: StudioReconciliationPlan;
  revision: DocumentWorkingRevision; currentProject: ResearchProjectOwnerProjection; scientificState: StudioScientificState;
  documentContractDigest: string }): StudioFinalizationIdentity | null => {
  assertStudioReconciliationCurrent(input.request, input.revision, input.currentProject, input.scientificState);
  const { planDigest, ...planMaterial } = input.plan;
  if (planDigest !== logicalDigest(planMaterial) || input.plan.requestId !== input.request.requestId
    || input.plan.requestDigest !== input.request.requestDigest || input.plan.projectWriteAuthorized !== false
    || stableStringify(input.plan.targetProject) !== stableStringify({ projectId: input.currentProject.projectId,
      projectVersion: input.currentProject.versionId, projectDigest: input.currentProject.projectDigest }))
    throw new StudioReconciliationError("STUDIO_FINALIZATION_PLAN_INVALID");
  if (input.plan.state === "NO_CHANGE") return null;
  if (input.plan.state !== "READY" || input.plan.packModel !== "COMPLETE_PACK"
    || input.plan.scientificPreparation.action !== "NONE" || !input.documentContractDigest.trim()
    || input.plan.edits.some(edit => edit.action !== "REPLAY_EDITORIAL"
      && !(edit.action === "SCIENTIFIC_CONTRIBUTION" && edit.projectCoverage === "COMPLETE")))
    throw new StudioReconciliationError("STUDIO_FINALIZATION_NOT_READY");
  const material = { contract: "STUDIO_FINALIZATION_IDENTITY_V1" as const,
    reconciliationRequestId: input.request.requestId, reconciliationPlanDigest: planDigest,
    logicalDocumentRef: input.request.logicalDocumentRef, sourceGenerationId: input.request.baseGenerationId,
    sourceGenerationBodyDigest: input.request.baseGenerationBodyDigest, workingRevisionId: input.request.workingRevisionId,
    workingRevisionSaveSequence: input.request.workingRevisionSaveSequence,
    workingRevisionContentDigest: input.request.workingRevisionContentDigest, targetProject: input.plan.targetProject,
    target: { kind: "COMPLETE_PACK" as const, nativeFamily: "DRCI" as const, documentContractDigest: input.documentContractDigest } };
  const requestDigest = logicalDigest(material);
  return Object.freeze({ ...material, requestDigest, requestId: `studio-finalization:${requestDigest}` });
};

/** Matching Project alone is deliberately insufficient. Expected immutable body
 * identity comes from future validated native assembly, never a client Gn guess. */
export const matchesStudioFinalizationReceipt = (identity: StudioFinalizationIdentity, receipt: DocumentPersistenceReceipt | null,
  expected: Readonly<{ generationId: string; bodySha256: string }>): boolean => {
  const { requestId, requestDigest, ...material } = identity;
  return requestDigest === logicalDigest(material) && requestId === `studio-finalization:${requestDigest}`
    && receipt?.contract === DOC_ARCHIVE_CONTRACT && receipt.requestId === requestId && receipt.generation.persistenceState === "COMMITTED"
    && receipt.generation.family === identity.target.nativeFamily
    && stableStringify(receipt.generation.project) === stableStringify(identity.targetProject)
    && receipt.generation.generationId !== identity.sourceGenerationId
    && receipt.generation.generationId === expected.generationId && receipt.generation.bodySha256 === expected.bodySha256
    && /^[a-f0-9]{64}$/u.test(expected.bodySha256);
};
export const readStudioFinalizationReceipt = async (client: Pick<DocumentArchiveClient, "receipt">,
  identity: StudioFinalizationIdentity, expected: Parameters<typeof matchesStudioFinalizationReceipt>[2]) => {
  const receipt = await client.receipt(identity.requestId);
  if (receipt === null) return null;
  if (!matchesStudioFinalizationReceipt(identity, receipt, expected))
    throw new StudioReconciliationError("STUDIO_FINALIZATION_RECEIPT_MISMATCH");
  return receipt;
};
