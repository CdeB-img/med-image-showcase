import type { DocumentAdministration } from "@/features/document-projection/administration";
import { type ProductDocumentAction } from "./product-entry-routing";
import { isFunctionalDocumentProjectionCurrent } from "@/features/document-projection/functional-reset-boundary";
import { refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import { recordSourceInterest, resolveProjectSource, sourceShortReference } from "@/features/knowledge-engine/project-source-library";
import { availableDocumentEvidence, readableDocumentDiff, restoreDocumentRevision, reviseScientificDocument } from "@/features/document-projection/scientific-document-revision";
import { explainDocumentSourceComparison, explainDocumentSourceSelection } from "@/features/document-projection/scientific-narrative";
import type { KnowledgeResult } from "@/features/knowledge-engine";
import { collectProjectKnowledgeSources, emptyProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import { buildKnowledgeRequestFromCanonicalSnapshot, buildProjectContextSnapshot } from "@/features/research-project-construction";
import { invokeKnowledgeForProject } from "../product-knowledge-owner-runtime";
import { readProductOwnerResult } from "../product-owner-result-ledger";
import type { FunctionalResetSession } from "./session";
import type { DocumentaryTransformation } from "@/features/document-projection/scientific-document-revision";

export type DocumentaryIntent =
  | { kind: "PROJECT_CHANGE" }
  | { kind: "DOCUMENT_REVISION"; transformation: DocumentaryTransformation; sourceRequired: boolean }
  | { kind: "DIFF" | "RESTORE" | "COMPARE_SOURCES" | "EXPLAIN_SOURCE" | "PREPARE_EVIDENCE" | "CLARIFY" }
  | { kind: "NOT_DOCUMENTARY" };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
/** A bounded DOC command adapter. Anything outside the supported editorial scope remains with native QRY/PRJ. */
export const resolveDocumentaryIntent = (text: string, documentContext = false): DocumentaryIntent => {
  const normalized = normalize(text);
  const sourceAction = /(?:ajoute|retire|supprime)\s+(?:aussi\s+)?(?:cette?\s+|une?\s+|la\s+|le\s+)?(?:source|reference|publication|article|revue)\b/.test(normalized);
  const changesScience = (/(?:devien|devient|exclu|incluons|remplac|changeons|retenons|considerons|sera|seront|elarg|reduis)/.test(normalized)
      || !sourceAction && /(?:ajoute|ajoutons|supprime|supprimons|retire|retirons)/.test(normalized))
    && /critere|endpoint|population|avc|patient|inclusion|exclusion|irm|scanner|gold standard|comparateur|placebo|effectif|randomis|visite|suivi/.test(normalized);
  if (changesScience) return { kind: "PROJECT_CHANGE" };
  const documentary = documentContext || /introduction|bibliograph|reference|publication|article|document|protocole|version precedente/.test(normalized);
  if (!documentary) return { kind: "NOT_DOCUMENTARY" };
  if (/qu.*chang|montre.*chang|difference|\bdiff\b/.test(normalized)) return { kind: "DIFF" };
  if (/reviens|revenir|restaure/.test(normalized) && /version precedente/.test(normalized)) return { kind: "RESTORE" };
  if (/compare/.test(normalized) && /article|source|publication|reference/.test(normalized)) return { kind: "COMPARE_SOURCES" };
  if (/pourquoi/.test(normalized) && /reference|source|utilis|cite|privileg/.test(normalized)) return { kind: "EXPLAIN_SOURCE" };
  if (/contexte.*(source|reference)|prepar.*(source|bibliograph)|cherche.*corpus/.test(normalized)) return { kind: "PREPARE_EVIDENCE" };
  // A request targeting study methods cannot be accepted as an introduction edit merely because it contains an editorial verb.
  if (/raccour|develop|reformul|reecri/.test(normalized) && /population|methodolog|endpoint|critere|analyse statistique|procedur/.test(normalized)) return { kind: "CLARIFY" };
  if (/retire|retirer|supprime/.test(normalized) && /\b\d{4}\b|doi|pmid|reference|source|publication|article/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "REMOVE_SOURCE", sourceRequired: true };
  if (/il manque|ajoute|ajouter|cite cette/.test(normalized) && /\b\d{4}\b|doi|pmid|reference|source|publication|article/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "ADD_SOURCE", sourceRequired: true };
  if (/angle|accent|partir de|mets?.*(?:avant|valeur)|davantage.*avant/.test(normalized) && /\b\d{4}\b|doi|pmid/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "FOCUS_SOURCE", sourceRequired: true };
  if (/raccour|abrege|concis/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "SHORTEN", sourceRequired: false };
  if (/trop affirmative|trop affirmatif|plus prudent|nuance/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "CAUTION", sourceRequired: false };
  if (/developpe|developper|approfondis|etoffe/.test(normalized) && /introduction|cette partie|contexte/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "EXPAND", sourceRequired: false };
  return { kind: documentContext ? "CLARIFY" : "NOT_DOCUMENTARY" };
};

export const acquireDocumentKnowledge = (session: FunctionalResetSession, recordedAt: string) => {
  const project = session.project;
  if (!project) throw new Error("DOCUMENT_PROJECT_REQUIRED");
  const snapshot = buildProjectContextSnapshot({ project });
  // Background sources address the adopted question and endpoint. Acquisition
  // details remain in the full applicability context, rather than becoming an
  // unrelated, potentially ambiguous second bibliographic question.
  const scientificObjectRefs = snapshot.objects.filter((item) => item.epistemicState === "KNOWN" && item.polarity !== "NEGATED"
    && ["SCIENTIFIC_QUESTION", "OBJECTIVE", "ENDPOINT", "CONDITION", "SCIENTIFIC_MODEL"].includes(item.type)).map((item) => item.stableId);
  const request = buildKnowledgeRequestFromCanonicalSnapshot({
    projectSnapshot: snapshot,
    ...(scientificObjectRefs.length ? { scientificObjectRefs } : {}),
    // UNDERSTAND keeps population/pathology differences explicit limitations instead of silently claiming exact applicability.
    question: "Construire le contexte scientifique documenté du protocole à partir des notions validées dans le Research Project.",
    createdAt: recordedAt,
  });
  const existing = session.knowledgeOwnerLedger.entries.find((entry) => entry.result?.owner === "KNOWLEDGE" && (entry.request.nativeInput as { requestId?: string }).requestId === request.requestId);
  let ledger = session.knowledgeOwnerLedger;
  let result: KnowledgeResult;
  if (existing?.result) {
    const retained = readProductOwnerResult({ ledger, resultId: existing.result.resultId, currentProjectSnapshot: snapshot, expectedOwner: "KNOWLEDGE" });
    if (retained.freshness.status !== "CURRENT") throw new Error("DOCUMENT_KNOWLEDGE_STALE");
    result = retained.entry.result!.nativePayload as KnowledgeResult;
  } else {
    const invocation = invokeKnowledgeForProject({ project, projectSnapshot: snapshot, knowledgeRequest: request, ledger, callerRef: "DOC-001:SCIENTIFIC_BACKGROUND", purpose: request.originalQuestion, startedAt: recordedAt, completedAt: recordedAt });
    if (!invocation.result) throw new Error(invocation.observation.failureCode ?? "DOCUMENT_KNOWLEDGE_UNAVAILABLE");
    ledger = invocation.ledger; result = invocation.result.nativePayload;
  }
  return { sourceLibrary: collectProjectKnowledgeSources(session.sourceLibrary ?? emptyProjectSourceLibrary(project.projectId), result), knowledgeOwnerLedger: ledger };
};

export type DocumentInstructionResult = {
  message: string;
  update: Partial<FunctionalResetSession>;
  closeSourceLibrary?: boolean;
  forwardToScience?: boolean;
};

export function prepareDocumentInstruction(session: FunctionalResetSession, administration: DocumentAdministration | undefined, instruction: string, sourceTurnRef: string, timestamp: string): DocumentInstructionResult | undefined {
  const intent = resolveDocumentaryIntent(instruction, true);
  let result: DocumentInstructionResult | undefined;
  const reply = (message: string, update: Partial<FunctionalResetSession> = {}) => {
    result = { message, update };
  };
  if (intent.kind === "PROJECT_CHANGE") return {
    message: "Cette instruction modifie la science du projet. Elle passe dans la conversation scientifique et exige votre revue avant adoption.",
    update: {}, forwardToScience: true,
  };
  if (intent.kind === "CLARIFY" || intent.kind === "NOT_DOCUMENTARY") {
    reply("Précisez la section et la transformation demandées. La révision disponible porte sur l’introduction et ses références : développer, raccourcir, réorienter vers une source identifiée, ajouter ou retirer une référence. Aucune autre section n’a été modifiée.");
    return result;
  }
  if (!session.project) { reply("Confirmez d’abord le projet scientifique pour lui associer des sources et un document."); return result; }
  const projection = session.documents.projections.at(-1);
  if (projection && !isFunctionalDocumentProjectionCurrent(projection, session.project, administration)) {
    reply("Le document courant doit être régénéré depuis le Project avant une nouvelle révision. Les versions précédentes restent consultables."); return result;
  }
  if (session.openDocumentProjectionId && projection && session.openDocumentProjectionId !== projection.projectionId) {
    reply("Cette version est historique. Ouvrez la version documentaire courante avant de la réviser."); return result;
  }
  let retainedEvidence: ReturnType<typeof acquireDocumentKnowledge> | undefined;
  try {
    let evidence = acquireDocumentKnowledge(session, timestamp);
    retainedEvidence = evidence;
    if (intent.kind === "PREPARE_EVIDENCE") {
      reply("Les sources disponibles ont été préparées. Pour rédiger les documents, utilisez « Générer les documents ».", evidence);
      if (result) result.closeSourceLibrary = true;
      return result;
    }
    if (["DIFF", "RESTORE"].includes(intent.kind)) {
      const previous = session.documents.projections.find((item) => item.projectionId === projection?.priorProjectionId);
      if (!projection || !previous) { reply("Il n’existe pas encore deux versions documentaires à comparer.", evidence); return result; }
      if (intent.kind === "DIFF") { reply(readableDocumentDiff(previous, projection), evidence); return result; }
      const restored = restoreDocumentRevision(projection, previous, { instruction, turnRef: sourceTurnRef, timestamp });
      const documents = refreshFunctionalResetDocumentPortfolio({ project: session.project, previous: { ...session.documents, projections: [...session.documents.projections, restored] }, administration, knowledgeLibrary: evidence.sourceLibrary, handoffDecision: session.documents.handoffDecision, requestedAt: timestamp });
      reply(`Le contenu de la version ${previous.projectionVersion} a été restauré dans une nouvelle version ${restored.projectionVersion}. Les versions antérieures et le Project sont conservés.`, { ...evidence, documents, openDocumentProjectionId: restored.projectionId }); return result;
    }
    const resolution = resolveProjectSource(evidence.sourceLibrary, instruction);
    if (intent.kind === "COMPARE_SOURCES") {
      if (resolution.matches.length !== 2) { reply("Identifiez exactement deux références par auteur et année, DOI ou PMID. Aucun rapprochement approximatif n’a été effectué.", evidence); return result; }
      const candidates = availableDocumentEvidence(evidence.sourceLibrary);
      reply(resolution.matches.map((source) => `${sourceShortReference(source)} : ${candidates.filter((item) => item.sourceRefs.includes(source.source.sourceId)).map((item) => item.text).join(" ") || "Aucune assertion rédigée admissible disponible."}`).join("\n\n") + "\n\nCette comparaison porte sur les assertions accessibles. Leur niveau de preuve comparatif et leur applicabilité à votre étude ne sont pas établis par votre préférence.", evidence); return result;
    }
    if (intent.kind === "EXPLAIN_SOURCE") {
      if (resolution.matches.length === 2) {
        reply(explainDocumentSourceComparison(evidence.sourceLibrary, projection?.evidenceContent?.narrative,
          resolution.matches.map((match) => match.source.sourceId)), evidence); return result;
      }
      if (resolution.status !== "RESOLVED") { reply("Identifiez une référence, ou exactement deux références pour expliquer leur priorité relative. Aucun rapprochement approximatif n’a été effectué.", evidence); return result; }
      const id = resolution.matches[0]!.source.sourceId;
      reply(projection?.evidenceContent?.excludedSourceRefs.includes(id)
        ? "Cette référence a été retirée sur instruction documentaire. Elle reste visible dans la bibliothèque et l’historique ; ce retrait ne change pas sa qualification scientifique."
        : explainDocumentSourceSelection(evidence.sourceLibrary, projection?.evidenceContent?.narrative, id), evidence); return result;
    }
    if (intent.kind !== "DOCUMENT_REVISION") return result;
    let sourceId: string | undefined;
    if (intent.sourceRequired) {
      const interest = recordSourceInterest(evidence.sourceLibrary, { text: instruction, turnRef: sourceTurnRef, recordedAt: timestamp, explicitUse: intent.transformation !== "REMOVE_SOURCE" });
      evidence = { ...evidence, sourceLibrary: interest.library };
      retainedEvidence = evidence;
      if (interest.resolution.status !== "RESOLVED") {
        reply(interest.resolution.status === "AMBIGUOUS" ? "Plusieurs références correspondent. Précisez le DOI ou le PMID ; aucune citation n’a été ajoutée."
          : "Cette référence n’est pas identifiée dans les sources locales accessibles. Votre mention est conservée ; aucun auteur, DOI, PMID ou contenu n’a été inventé et aucune recherche externe n’a été lancée.", evidence); return result;
      }
      sourceId = interest.resolution.matches[0]!.source.sourceId;
    }
    if (!projection?.evidenceContent) { reply("La source est conservée. Préparez d’abord le contexte sourcé et les références depuis l’aperçu du protocole, puis appliquez cette révision.", evidence); return result; }
    const revision = reviseScientificDocument({ projection, library: evidence.sourceLibrary, transformation: intent.transformation, sourceId, instruction, turnRef: sourceTurnRef, timestamp });
    const documents = revision.projection === projection ? session.documents : refreshFunctionalResetDocumentPortfolio({ project: session.project, previous: { ...session.documents, projections: [...session.documents.projections, revision.projection] }, administration, knowledgeLibrary: evidence.sourceLibrary, handoffDecision: session.documents.handoffDecision, requestedAt: timestamp });
    reply(revision.message, { ...evidence, documents, openDocumentProjectionId: revision.projection.projectionId });
    if (result) result.closeSourceLibrary = true;
  } catch (error) {
    const code = error instanceof Error ? error.message : "DOCUMENT_REVISION_UNAVAILABLE";
    reply(code === "SOURCE_WITHOUT_APPLICABLE_DOCUMENTARY_ASSERTION" ? "Cette référence ne dispose pas d’une assertion rédigée suffisamment qualifiée pour cette révision. Son ajout comme citation décorative a été refusé."
      : code === "DOCUMENT_RESTORE_SOURCE_CHANGED" ? "Cette version dépend d’un autre état scientifique ou administratif. Elle reste consultable dans l’historique ; la restauration ne peut pas remplacer silencieusement le Project courant."
        : "La révision n’a pas pu être qualifiée. Le projet et toutes les versions documentaires précédentes sont conservés.", retainedEvidence ?? {});
  }
  return result;
}

export type ProductDocumentCommandResult = { assistantContent: string; projectionId?: string | null; clearProjection?: boolean; openDeliverables?: boolean };

export function dispatchProductDocumentAction(
  session: FunctionalResetSession,
  action: ProductDocumentAction,
 ): ProductDocumentCommandResult {
    if (!session.project) {
      return {
        assistantContent: action === "OPEN_STUDY_DELIVERABLES" || action === "OPEN_EDC_EXPORT"
          ? "Des éléments d’étude confirmés sont nécessaires avant de pouvoir préparer les livrables."
          : "Des éléments d’étude confirmés sont nécessaires avant de pouvoir afficher un aperçu du protocole.",
    };
}

    if (action === "OPEN_STUDY_DELIVERABLES" || action === "OPEN_EDC_EXPORT") {
      return {
        clearProjection: true, openDeliverables: true,
        assistantContent: action === "OPEN_EDC_EXPORT"
          ? "L’espace des livrables est ouvert sur le CRF canonique et ses exports de collecte. Chaque format reste téléchargeable séparément."
          : "L’espace des livrables de l’étude est ouvert. Les documents incomplets restent explicitement signalés.",
    };
    }

    const protocolCard = session.documents.cards.find((card) => card.kind === "PROTOCOL");
    const projectionId = protocolCard?.canOpen ? protocolCard.projectionId : null;
    if (action === "OPEN_CURRENT_PROTOCOL") {
      return {
        assistantContent: projectionId
          ? protocolCard?.freshness === "CURRENT"
            ? "Voici la version actuelle du protocole."
            : "Voici la dernière version disponible du protocole. Elle reste signalée comme historique."
          : "Aucun aperçu du protocole n’existe encore. Une demande explicite de création est nécessaire.",
        ...(projectionId ? { projectionId } : {}),
    };
    }

    if (action === "DOWNLOAD_PROTOCOL") {
      return {
        assistantContent: projectionId
          ? "Le protocole est ouvert. Le téléchargement HTML est disponible dans l’aperçu."
          : "Aucun aperçu du protocole n’est encore disponible au téléchargement.",
        ...(projectionId ? { projectionId } : {}),
    };
    }

    if (action === "CREATE_PROTOCOL" && protocolCard?.freshness === "CURRENT" && projectionId) {
      return {
        assistantContent: "Voici la version actuelle du protocole.",
        projectionId,
    };
    }

    if (action === "REGENERATE_PROTOCOL" && protocolCard?.freshness === "CURRENT" && projectionId) {
      return {
        assistantContent: "Le protocole reflète déjà la version actuelle du projet.",
        projectionId,
    };
    }

    return { assistantContent: "Ouvrez Protocole / documents, puis choisissez « Générer les documents » pour la version confirmée du projet.", openDeliverables: true };
  }
