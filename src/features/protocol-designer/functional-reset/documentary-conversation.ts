import { createKnowledgeRequest, prepareScientificObjectTerms, type KnowledgeResult } from "@/features/knowledge-engine";
import { collectProjectKnowledgeSources, emptyProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import { buildProjectContextSnapshot } from "@/features/research-project-construction";
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
  if (/pourquoi/.test(normalized) && /reference|source|utilis|cite/.test(normalized)) return { kind: "EXPLAIN_SOURCE" };
  if (/contexte.*(source|reference)|prepar.*(source|bibliograph)|cherche.*corpus/.test(normalized)) return { kind: "PREPARE_EVIDENCE" };
  // A request targeting study methods cannot be accepted as an introduction edit merely because it contains an editorial verb.
  if (/raccour|develop|reformul|reecri/.test(normalized) && /population|methodolog|endpoint|critere|analyse statistique|procedur/.test(normalized)) return { kind: "CLARIFY" };
  if (/retire|retirer|supprime/.test(normalized) && /\b\d{4}\b|doi|pmid|reference|source|publication|article/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "REMOVE_SOURCE", sourceRequired: true };
  if (/il manque|ajoute|ajouter|cite cette/.test(normalized) && /\b\d{4}\b|doi|pmid|reference|source|publication|article/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "ADD_SOURCE", sourceRequired: true };
  if (/angle|accent|partir de/.test(normalized) && /\b\d{4}\b|doi|pmid/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "FOCUS_SOURCE", sourceRequired: true };
  if (/raccour|abrege|concis/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "SHORTEN", sourceRequired: false };
  if (/trop affirmative|trop affirmatif|plus prudent|nuance/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "CAUTION", sourceRequired: false };
  if (/developpe|developper|approfondis|etoffe/.test(normalized) && /introduction|cette partie|contexte/.test(normalized)) return { kind: "DOCUMENT_REVISION", transformation: "EXPAND", sourceRequired: false };
  return { kind: documentContext ? "CLARIFY" : "NOT_DOCUMENTARY" };
};

export const acquireDocumentKnowledge = (session: FunctionalResetSession, recordedAt: string) => {
  const project = session.project;
  if (!project) throw new Error("DOCUMENT_PROJECT_REQUIRED");
  const snapshot = buildProjectContextSnapshot({ project });
  const text = snapshot.objects.filter((object) => ["SCIENTIFIC_QUESTION", "CANONICAL_VARIABLE", "IMAGING_MODALITY", "CONDITION"].includes(object.type)).map((object) => object.content).join(" ; ");
  const prepared = prepareScientificObjectTerms({ originalQuestion: text, candidates: snapshot.objects.filter((object) => ["CANONICAL_VARIABLE", "IMAGING_MODALITY", "CONDITION"].includes(object.type)).map((object) => ({ term: object.content, role: "SUBJECT" as const, sourceText: object.content, sourceRef: object.stableId })) });
  const request = createKnowledgeRequest({ originalQuestion: `Documenter les notions présentes dans le projet, sans qualifier leur adoption ni leur applicabilité clinique : ${text}`,
    scientificObjectTerms: prepared.accepted, researchProjectId: project.projectId, strategyVersion: snapshot.sourceProjectVersion, researchProjectVersion: project.versionId, researchProjectDigest: project.projectDigest,
    // General scientific background only. This request does not qualify applicability to the study population.
    consumer: "PROTOCOL_DESIGNER_UNDERSTAND", externalSearchPolicy: "INTERNAL_ONLY", context: {}, createdAt: recordedAt });
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
