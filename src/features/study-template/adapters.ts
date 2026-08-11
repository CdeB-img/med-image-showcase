import type { DocumentDefinition, StudyTemplateInstance } from "./types.ts";
import { CLINICAL_STUDY_TEMPLATE } from "./definitions.ts";

export const buildDocumentDefinitionAdapter = (instance: StudyTemplateInstance): {
  consumer: "DOC-001";
  instanceRef: string;
  definitions: DocumentDefinition[];
  mappings: StudyTemplateInstance["documents"];
  boundary: "FUTURE_READ_ONLY_ADAPTER_NO_PROTOCOL_PROJECTION_NO_ENGINE_MUTATION";
} => ({
  consumer: "DOC-001",
  instanceRef: instance.instanceId,
  definitions: CLINICAL_STUDY_TEMPLATE.documents,
  mappings: instance.documents,
  boundary: "FUTURE_READ_ONLY_ADAPTER_NO_PROTOCOL_PROJECTION_NO_ENGINE_MUTATION",
});

export const buildFutureConsumerContracts = (instance: StudyTemplateInstance) => ({
  documentProjection: buildDocumentDefinitionAdapter(instance),
  validation: {
    consumer: "VAL-001" as const,
    instanceRef: instance.instanceId,
    readinessRef: instance.readinessGraph.digest,
    status: "NOT_IMPLEMENTED_NEXT_ARCHITECTURAL_STEP" as const,
    boundary: "NO_VALIDATION_PERFORMED_BY_TMP_001" as const,
  },
});
