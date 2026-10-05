import { renderProjectionHtml } from "./html-renderer";
import { renderProjectionMarkdown } from "./markdown-renderer";
import type { DocumentProjection } from "./types";

export type ProjectionRenderFormat = "MARKDOWN" | "HTML";

export const renderProjection = (projection: Readonly<DocumentProjection>, format: ProjectionRenderFormat) => format === "MARKDOWN"
  ? { format, mimeType: "text/markdown;charset=utf-8", extension: "md", content: renderProjectionMarkdown(projection) }
  : { format, mimeType: "text/html;charset=utf-8", extension: "html", content: renderProjectionHtml(projection) };

/** Passive browser export. Rendering/identity remain owned by DOC. */
export const downloadProjection = (projection: DocumentProjection, format: ProjectionRenderFormat) => {
  const rendered = renderProjection(projection, format);
  const url = URL.createObjectURL(new Blob([rendered.content], { type: rendered.mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `noxia-${projection.projectionType.toLocaleLowerCase()}-${projection.projectionVersion}.${rendered.extension}`;
  try { link.click(); } finally { URL.revokeObjectURL(url); }
};
