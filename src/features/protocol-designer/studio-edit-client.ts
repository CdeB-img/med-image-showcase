import { ensureServerProjectSnapshot, ProductBridgeClientError } from "./product-bridge-client.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import { createStudioEditRequest, studioEditOperationId, acceptStudioEditProposal, readStudioEditFailureDiagnostic, type StudioEditProposal } from "../document-projection/studio-edit-proposal.js";
import { readDurableProviderFailureDiagnostic } from "./provider-call-observability.js";
import type { DocumentWorkingRevision } from "../document-projection/working-revision.js";
import { observeDocumentWorkflow, type DocumentWorkflowTraceSink } from "./functional-reset/document-workflow-trace";

export type StudioEditRuntime = {
  projectBinding(): { projectId: string; projectVersion: string; projectDigest: string };
  propose(revision: DocumentWorkingRevision, nodeId: string, instruction: string): Promise<StudioEditProposal>;
};
/** Explicit foreground request through the existing authenticated bridge and
 * durable provider budget owner. No timer, mount effect, retry or new store. */
export const createStudioEditRuntime = (session: () => { sessionId: string; project: ResearchProjectOwnerProjection | null }, trace?: DocumentWorkflowTraceSink): StudioEditRuntime => ({
  projectBinding() { const project = session().project; if (!project) throw new Error("STUDIO_EDIT_PROJECT_REQUIRED");
    return { projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest }; },
  async propose(revision, nodeId, instruction) {
    const current = session(), project = current.project;
    if (!project) throw new Error("STUDIO_EDIT_PROJECT_REQUIRED");
    const editRequest = createStudioEditRequest(revision, this.projectBinding(), nodeId, instruction);
    return observeDocumentWorkflow(trace, { operationRef: studioEditOperationId(editRequest), component: "createStudioEditRuntime.propose",
      owner: "DOC", stage: "DOC_PROJECTION", identity: { workingRevisionId: revision.revisionId, saveSequence: revision.saveSequence,
        contentDigest: revision.contentDigest, logicalDocumentRef: revision.logicalDocumentRef, generationId: revision.baseGenerationId,
        baseGenerationBodyDigest: revision.baseGenerationBodyDigest, nodeId, requestDigest: editRequest.requestDigest } }, async () => {
    const snapshot = await ensureServerProjectSnapshot(current.sessionId, project);
    const response = await fetch("/api/protocol-designer-bridge", { method: "POST", credentials: "same-origin",
      headers: { "content-type": "application/json", "x-noxia-project-snapshot-proof": snapshot.proof },
      body: JSON.stringify({ operation: "STUDIO_EDIT_PROPOSAL", apiVersion: "1.0.0", editRequest,
        currentProject: null, currentProjectRef: snapshot.ref,
        observabilityContext: { sessionId: current.sessionId, conversationId: null, turnId: null,
          clientRequestId: studioEditOperationId(editRequest), testSessionId: null } }) });
    const value = await response.json().catch(() => null);
    if (!response.ok || value?.apiVersion !== "1.0.0") {
      const failure = Array.isArray(value?.observability?.providerCalls)
        ? value.observability.providerCalls.map(readDurableProviderFailureDiagnostic).find(item => item !== null) ?? null : null;
      throw Object.assign(new ProductBridgeClientError(value?.error?.code ?? "STUDIO_EDIT_FAILED",
        "La proposition n’a pas abouti. Votre brouillon est conservé.", null, null,
        null, null, null, null, readStudioEditFailureDiagnostic(value?.error?.diagnostic)),
      { providerFailureDiagnostic: failure });
    }
    return acceptStudioEditProposal(editRequest, revision, value.editProposal);
    }, proposal => ({ proposalId: proposal.proposalId, assessmentClassification: "UNASSESSED" }));
  },
});
