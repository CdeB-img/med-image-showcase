import type { DocumentGenerationBody, DocumentGenerationRef } from "./generation-persistence";

export type DocumentStudioTarget = { generation: DocumentGenerationRef; nativeDocumentRef: string };

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
