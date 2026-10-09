import type { DocumentGenerationBody, DocumentGenerationRef } from "./generation-persistence";
import { DRCI_DOCUMENT_KINDS } from "./drci-draft-contract";
import { logicalDigest } from "../knowledge-engine/canonical";

export type DocumentStudioTarget = { generation: DocumentGenerationRef; nativeDocumentRef: string;
  initialMode?: "READ" | "EDIT"; activeRevisionId?: string };

/** Current DRCI adapter, using the archive's existing native artifact identity.
 * This is display routing, not a new portfolio registry or filename identity. */
export const archivedStudioDocuments = (generation: DocumentGenerationRef) => {
  if (generation.family !== "DRCI") return [];
  const packDigest = generation.generationId.split(":document-generation:")[1];
  if (!packDigest) return [];
  const titles = { PROTOCOL_FULL: "Protocole complet", PROTOCOL_SYNOPSIS: "Synopsis", CRF: "CRF", RECRUITMENT: "Recrutement" };
  return DRCI_DOCUMENT_KINDS.flatMap(kind => {
    const artifactId = `drci-document:${logicalDigest([packDigest, kind])}`;
    return generation.files.some(file => file.artifactId === artifactId)
      ? [{ nativeDocumentRef: kind, title: titles[kind] }] : [];
  });
};

/** Select actual native documents, not rendered files or a new kind registry. */
export const studioDocuments = (body: DocumentGenerationBody) => body.native.family === "DRCI"
  ? body.native.value.documents.map(document => ({ nativeDocumentRef: document.kind, title: document.title }))
  : [{ nativeDocumentRef: body.native.value.documentDefinition?.documentId ?? body.native.value.projectionType, title: body.native.value.title }];

export const hasProtectedTextBinding = (text: string) => /\[\[(?:FACT|CITE):/u.test(text);

/** Read-only display resolves only existing native references, never meaning. */
export const studioBoundText = (text: string, body: DocumentGenerationBody) => text.replace(/\[\[(FACT|CITE):([^\]]+)\]\]/gu, (token, kind: string, ref: string) => {
  if (kind === "FACT") return body.native.family === "DRCI"
    ? body.native.value.sourceFacts.find(fact => fact.ref === ref)?.content ?? token
    : token;
  const sources = body.native.value.evidenceContent?.sources ?? [];
  const source = sources.find(item => item.source.sourceId === ref);
  return source ? `[Référence : ${source.source.title}]` : token;
});
