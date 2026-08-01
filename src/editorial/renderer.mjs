import { noxiaEditorialAdapter } from "./adapter.mjs";

const supportedTemplates = new Set(["hub", "guide", "technical-sheet", "workflow", "tool", "service", "reference"]);

export const renderPilotViewModel = (entry) => {
  if (!supportedTemplates.has(entry.templateKey)) throw new Error(`Unsupported NOXIA pilot template: ${entry.templateKey}`);
  return {
    templateKey: entry.templateKey,
    eyebrow: "Pilote éditorial interne",
    title: entry.metadata.title,
    description: `Projection de démonstration issue de ${entry.entityIds.length} objet(s) métier NOXIA.`,
    canonical: entry.metadata.canonical,
    robots: "noindex, nofollow",
    cta: noxiaEditorialAdapter.resolveCta("contact"),
    entityIds: entry.entityIds,
  };
};

export const supportedPilotTemplates = [...supportedTemplates].sort();
