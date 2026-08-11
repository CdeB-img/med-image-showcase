import { stableTemplateStringify, templateDigest } from "./canonical.ts";
import type { StudyTemplateCatalog, StudyTemplateExport, StudyTemplateInstance } from "./types.ts";
import { STUDY_TEMPLATE_SCHEMA_VERSION } from "./types.ts";

export const exportStudyTemplates = (catalog: StudyTemplateCatalog, instances: readonly StudyTemplateInstance[], exportedAt: string): StudyTemplateExport => {
  const material = { schemaVersion: STUDY_TEMPLATE_SCHEMA_VERSION, exportedAt, catalog, instances };
  return {
    ...material,
    instances: [...instances],
    digest: templateDigest(material),
    boundary: "STRUCTURED_EXPORT_ONLY_NO_DOCUMENT",
  };
};

export const serializeStudyTemplateExport = (value: StudyTemplateExport) => `${stableTemplateStringify(value)}\n`;

export const importStudyTemplateExport = (serialized: string): StudyTemplateExport => {
  const parsed = JSON.parse(serialized) as StudyTemplateExport;
  if (parsed.schemaVersion !== STUDY_TEMPLATE_SCHEMA_VERSION) throw new Error(`UNSUPPORTED_STUDY_TEMPLATE_SCHEMA:${String(parsed.schemaVersion)}`);
  if (parsed.boundary !== "STRUCTURED_EXPORT_ONLY_NO_DOCUMENT") throw new Error("INVALID_STUDY_TEMPLATE_EXPORT_BOUNDARY");
  const material = { schemaVersion: parsed.schemaVersion, exportedAt: parsed.exportedAt, catalog: parsed.catalog, instances: parsed.instances };
  if (templateDigest(material) !== parsed.digest) throw new Error("STUDY_TEMPLATE_EXPORT_DIGEST_MISMATCH");
  return parsed;
};
