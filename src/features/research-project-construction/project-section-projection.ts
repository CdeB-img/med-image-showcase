/**
 * Human-facing Research Project projection vocabulary.
 *
 * Section placement is a projection concern: it does not promote the current
 * runtime object type or create a new PD-003 canonical identity.
 */
export const RESEARCH_PROJECT_SECTION_IDS = [
  "QUESTION",
  "POPULATION",
  "DESIGN",
  "INTERVENTION",
  "COMPARATOR",
  "IMAGING",
  "BIOSPECIMENS",
  "MEASUREMENTS",
  "TEMPORALITY",
  "ANALYSIS",
] as const;

export type ResearchProjectSectionId = typeof RESEARCH_PROJECT_SECTION_IDS[number];

export const RESEARCH_PROJECT_SECTION_LABELS: Readonly<Record<ResearchProjectSectionId, string>> = Object.freeze({
  QUESTION: "Question",
  POPULATION: "Population",
  DESIGN: "Design",
  INTERVENTION: "Intervention",
  COMPARATOR: "Comparateur",
  IMAGING: "Imagerie",
  BIOSPECIMENS: "Prélèvements / échantillons",
  MEASUREMENTS: "Éléments à observer ou mesurer",
  TEMPORALITY: "Temporalité",
  ANALYSIS: "Analyse",
});

export const RESEARCH_PROJECT_SECTION_ORDER: readonly ResearchProjectSectionId[] = Object.freeze([
  ...RESEARCH_PROJECT_SECTION_IDS,
]);

const SECTION_BY_GOVERNED_STUDY_ROLE: Readonly<Record<string, ResearchProjectSectionId>> = Object.freeze({
  SAMPLE_COLLECTION: "BIOSPECIMENS",
});

export const projectSectionForGovernedStudyRole = (
  studyRole: string | null | undefined,
): ResearchProjectSectionId | null => {
  const normalizedRole = studyRole?.trim().toLocaleUpperCase("en-US");
  return normalizedRole ? SECTION_BY_GOVERNED_STUDY_ROLE[normalizedRole] ?? null : null;
};
