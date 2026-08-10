import type { DocumentSectionInstance, ProjectionReadiness } from "./types";

export const assessProjectionReadiness = (sections: ReadonlyArray<DocumentSectionInstance>): ProjectionReadiness => sections.some((section) =>
  !["GENERATABLE", "NOT_APPLICABLE"].includes(section.status)
  || section.contradictions.length > 0
  || section.unknowns.length > 0
) ? "PARTIAL" : "READY_FOR_REVIEW";
