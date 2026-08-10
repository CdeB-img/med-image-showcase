import { renderProjectionHtml } from "./html-renderer";
import { renderProjectionMarkdown } from "./markdown-renderer";
import type { DocumentProjection } from "./types";

export type ProjectionRenderFormat = "MARKDOWN" | "HTML";

export const renderProjection = (projection: Readonly<DocumentProjection>, format: ProjectionRenderFormat) => format === "MARKDOWN"
  ? { format, mimeType: "text/markdown;charset=utf-8", extension: "md", content: renderProjectionMarkdown(projection) }
  : { format, mimeType: "text/html;charset=utf-8", extension: "html", content: renderProjectionHtml(projection) };
