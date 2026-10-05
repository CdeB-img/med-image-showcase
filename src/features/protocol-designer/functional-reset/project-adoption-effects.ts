/** Effect coordination only: PRJ owns adoption; QRY/DOC remain read-only consumers. */
import type { ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { DocumentAdministration } from "@/features/document-projection/administration";
import { markFunctionalResetDocumentFailure, refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { ensureServerProjectSnapshot } from "../product-bridge-client";
import { deriveFunctionalResetDataOwnerState } from "./canonical-study-data-standard";
import { attachCurrentKnowledgePrerequisiteWhenRequired } from "./knowledge-standard";
import type { ProjectAdoptionTrace } from "./project-adoption-trace";
import { saveFunctionalResetWorkspaceSession, type FunctionalResetSession, type SessionSave } from "./session";

export const documentBlockerSignals = (documents: FunctionalResetSession["documents"]) =>
  documents.cards.flatMap(card => card.blockerGroups.map(group => ({ dimension: group.dimension, items: [...group.items] })));

export const refreshAdoptedProjectConsumers = (input: Readonly<{
  previous: FunctionalResetSession;
  project: ResearchProjectOwnerProjection;
  administration: DocumentAdministration;
  recordedAt: string;
}>) => {
  const { project, previous, administration, recordedAt } = input;
  let documents;
  try {
    documents = refreshFunctionalResetDocumentPortfolio({ administration, project, previous: previous.documents, requestedAt: recordedAt });
  } catch (error) {
    documents = markFunctionalResetDocumentFailure(project, previous.documents, error);
  }
  const queryNavigation = attachCurrentKnowledgePrerequisiteWhenRequired({ project, navigation: buildFunctionalResetQueryNavigation({
    project, previous: previous.queryNavigation, documentBlockers: documentBlockerSignals(documents), recordedAt,
    dataOwnerState: deriveFunctionalResetDataOwnerState({ project, ledger: previous.knowledgeOwnerLedger }),
  }) });
  return { documents, queryNavigation };
};

export type ProjectAdoptionEffectResult =
  | { status: "NOT_COMMITTED"; error: unknown }
  | { status: "COMMITTED"; session: FunctionalResetSession; auxiliaryUpload: Promise<"UPLOADED" | "FAILED"> | null };

/** One scientific write, then optional auxiliary upload. Never retry or redispatch. */
export const persistAdoptedProjectSession = (input: Readonly<{
  storage: Storage;
  session: FunctionalResetSession & { project: ResearchProjectOwnerProjection };
  previousProject: ResearchProjectOwnerProjection | null;
  save?: SessionSave;
  adoptionTrace?: ProjectAdoptionTrace;
  uploadSnapshot: boolean;
}>): ProjectAdoptionEffectResult => {
  let session: FunctionalResetSession = input.session;
  const { project } = input.session;
  const trace = input.save ? input.adoptionTrace : undefined;
  if (trace) {
    trace.writeStarted(project, input.previousProject);
    session = { ...session, scientificExecutionTraceLedger: trace.ledger() };
  }
  const result = saveFunctionalResetWorkspaceSession(input.storage, session, input.save);
  if (result.scientificPersisted === false) return { status: "NOT_COMMITTED", error: result.error };
  if (trace) {
    trace.writeSucceeded(project);
    session = { ...session, scientificExecutionTraceLedger: trace.ledger() };
  }
  const auxiliaryUpload = input.uploadSnapshot
    ? Promise.resolve().then(() => ensureServerProjectSnapshot(session.sessionId, project))
      .then(() => "UPLOADED" as const, () => "FAILED" as const)
    : null;
  return { status: "COMMITTED", session, auxiliaryUpload };
};
