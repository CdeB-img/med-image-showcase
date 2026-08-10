import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { PROJECTION_DEFINITIONS, projectionCatalogEntry } from "./contracts";
import type { ProjectionDefinition, ProjectionPlan, ProjectionType } from "./types";

const validateDefinition = (definition: ProjectionDefinition) => {
  const sectionIds = definition.sections.map((section) => section.sectionId);
  const orders = definition.sections.map((section) => section.order);
  if (!definition.definitionId || !definition.projectionType || !definition.title) throw new Error("INVALID_PROJECTION_DEFINITION_IDENTITY");
  if (new Set(sectionIds).size !== sectionIds.length) throw new Error("DUPLICATE_SECTION_DEFINITION_ID");
  if (new Set(orders).size !== orders.length) throw new Error("DUPLICATE_SECTION_DEFINITION_ORDER");
};

export const createProjectionPlanner = (definitions: ReadonlyArray<ProjectionDefinition> = PROJECTION_DEFINITIONS) => {
  definitions.forEach(validateDefinition);
  const byType = new Map(definitions.map((definition) => [definition.projectionType, definition]));
  if (byType.size !== definitions.length) throw new Error("DUPLICATE_PROJECTION_DEFINITION_TYPE");
  return (project: Readonly<ResearchProjectDesignResult>, projectionType: ProjectionType): ProjectionPlan => {
    const definition = byType.get(projectionType);
    if (!definition) {
      const catalog = projectionCatalogEntry(projectionType);
      return {
        projectionType, supported: false, definitionId: null, title: null, templateId: null, sections: [],
        refusal: {
          code: "UNSUPPORTED_PROJECTION_TYPE",
          reason: `${catalog?.label ?? projectionType} est déclaré ou demandé, mais ne possède aucune ProjectionDefinition implémentée.`,
          resumeCondition: "Ajouter une nouvelle ProjectionDefinition et ses SectionDefinitions au registre, sans modifier les planners ni le moteur de composition.",
        },
      };
    }
    const base = {
      projectionType,
      supported: true,
      definitionId: definition.definitionId,
      title: definition.title,
      templateId: `${definition.definitionId}@${definition.definitionVersion}`,
      sections: [...definition.sections].sort((left, right) => left.order - right.order),
    };
    if (project.status === "REFUSED") return {
      ...base,
      refusal: { code: "SOURCE_PROJECT_REFUSED" as const, reason: "Le Research Project source est refusé et ne peut pas être projeté.", resumeCondition: project.refusal?.resumeCondition ?? "Résoudre le refus dans le moteur propriétaire du projet." },
    };
    if (project.candidateVersion.status !== "FROZEN_BY_HUMAN") return {
      ...base,
      refusal: { code: "SOURCE_PROJECT_NOT_FROZEN" as const, reason: "DOC-001 lit uniquement une version de projet gelée par décision humaine.", resumeCondition: "Geler une nouvelle version du Research Project dans PRJ-001." },
    };
    if (project.documentHandoff.status !== "AUTHORIZED") return {
      ...base,
      refusal: { code: "DOCUMENT_HANDOFF_NOT_AUTHORIZED" as const, reason: "Le handoff documentaire de cette version n'est pas autorisé.", resumeCondition: "Autoriser explicitement le handoff Document depuis la version gelée." },
    };
    return { ...base, refusal: null };
  };
};

export const planProjection = (
  project: Readonly<ResearchProjectDesignResult>,
  projectionType: ProjectionType,
  definitions: ReadonlyArray<ProjectionDefinition> = PROJECTION_DEFINITIONS,
) => createProjectionPlanner(definitions)(project, projectionType);

