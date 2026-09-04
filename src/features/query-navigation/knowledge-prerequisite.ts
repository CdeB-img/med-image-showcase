import { logicalDigest, type KnowledgeContextInput, type ReferenceKnowledgeNeed, type ReferenceKnowledgeOwner, type ScientificObjectRef } from "@/features/knowledge-engine";
import type { FunctionalResetQueryNavigation } from "./functional-reset-progression";

export const QRY_KNOWLEDGE_PREREQUISITE_CONTRACT = "QRY001_KNOWLEDGE_PREREQUISITE" as const;
export const QRY_KNOWLEDGE_PREREQUISITE_VERSION = "1.0.0" as const;

export type ProductKnowledgeTargetCapability =
  | "SCIENTIFIC_THINKING_PROPOSAL"
  | "STUDY_DESIGN_COHERENCE"
  | "OBSERVABILITY_QUALIFICATION"
  | "IMAGING_STUDY_DESIGN"
  | "BIOSTATISTICS_PLANNING"
  | "STUDY_DATA_PLANNING"
  | "DATA_MANAGEMENT_PLANNING"
  | "REGULATORY_REQUIREMENT_RESOLUTION";

export type ProductKnowledgeTargetOwner = Exclude<ReferenceKnowledgeOwner, "KNOWLEDGE">;

export type ProductKnowledgePrerequisiteAction = {
  contract: typeof QRY_KNOWLEDGE_PREREQUISITE_CONTRACT;
  contractVersion: typeof QRY_KNOWLEDGE_PREREQUISITE_VERSION;
  actionId: string;
  actionDigest: string;
  owner: "QUERY_NAVIGATION";
  selectedActionRef: string;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  targetOwner: ProductKnowledgeTargetOwner;
  targetCapability: ProductKnowledgeTargetCapability;
  knowledgeNeed: ReferenceKnowledgeNeed;
  purpose: string;
  scientificObjects: Array<Pick<ScientificObjectRef, "objectId" | "originalTerm" | "role">>;
  context: KnowledgeContextInput;
  relationRefs: string[];
  provenanceRefs: string[];
  projectWriteAuthorized: false;
};

const capabilityByOwner: Record<ProductKnowledgeTargetOwner, ProductKnowledgeTargetCapability> = {
  SCIENTIFIC_THINKING: "SCIENTIFIC_THINKING_PROPOSAL",
  STUDY_DESIGN: "STUDY_DESIGN_COHERENCE",
  OBSERVABILITY_MEASUREMENT: "OBSERVABILITY_QUALIFICATION",
  IMAGING: "IMAGING_STUDY_DESIGN",
  BIOSTATISTICS: "BIOSTATISTICS_PLANNING",
  CDM: "STUDY_DATA_PLANNING",
  DATA_MANAGEMENT: "DATA_MANAGEMENT_PLANNING",
  REG: "REGULATORY_REQUIREMENT_RESOLUTION",
};

const queryOwnerByKnowledgeOwner: Record<ProductKnowledgeTargetOwner, string> = {
  SCIENTIFIC_THINKING: "SCIENTIFIC_THINKING",
  STUDY_DESIGN: "STUDY_DESIGN",
  OBSERVABILITY_MEASUREMENT: "OBSERVABILITY_MEASUREMENT",
  IMAGING: "IMAGING",
  BIOSTATISTICS: "BIOSTATISTICS",
  CDM: "STUDY_DATA_CDM",
  DATA_MANAGEMENT: "DATA_MANAGEMENT",
  REG: "REGULATORY_RESOLUTION",
};

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));

export const createProductKnowledgePrerequisiteAction = (input: Omit<ProductKnowledgePrerequisiteAction,
  "contract" | "contractVersion" | "actionId" | "actionDigest" | "owner" | "projectWriteAuthorized"
>): Readonly<ProductKnowledgePrerequisiteAction> => {
  if (input.knowledgeNeed.owner !== input.targetOwner) throw new Error("QRY_KNOWLEDGE_TARGET_OWNER_MISMATCH");
  if (capabilityByOwner[input.targetOwner] !== input.targetCapability) throw new Error("QRY_KNOWLEDGE_TARGET_CAPABILITY_MISMATCH");
  if (!input.scientificObjects.length || !input.provenanceRefs.length || !input.purpose.trim()) throw new Error("QRY_KNOWLEDGE_PREREQUISITE_SCOPE_INCOMPLETE");
  const material = {
    selectedActionRef: input.selectedActionRef,
    projectId: input.projectId,
    projectVersion: input.projectVersion,
    projectDigest: input.projectDigest,
    targetOwner: input.targetOwner,
    targetCapability: input.targetCapability,
    knowledgeNeed: {
      ...structuredClone(input.knowledgeNeed),
      sourcePreferences: unique(input.knowledgeNeed.sourcePreferences),
    },
    purpose: input.purpose.trim(),
    scientificObjects: structuredClone(input.scientificObjects),
    context: structuredClone(input.context),
    relationRefs: unique(input.relationRefs),
    provenanceRefs: unique(input.provenanceRefs),
    projectWriteAuthorized: false as const,
  };
  const actionDigest = logicalDigest(material);
  return Object.freeze({
    contract: QRY_KNOWLEDGE_PREREQUISITE_CONTRACT,
    contractVersion: QRY_KNOWLEDGE_PREREQUISITE_VERSION,
    actionId: `qry-knowledge-prerequisite:${actionDigest}`,
    actionDigest,
    owner: "QUERY_NAVIGATION",
    ...material,
  });
};

export const attachProductKnowledgePrerequisite = (
  navigation: Readonly<FunctionalResetQueryNavigation>,
  prerequisite: Readonly<ProductKnowledgePrerequisiteAction>,
): FunctionalResetQueryNavigation => {
  if (!navigation.currentAction || prerequisite.selectedActionRef !== navigation.currentAction.selectedActionId) throw new Error("QRY_KNOWLEDGE_SELECTED_ACTION_MISMATCH");
  if (navigation.currentAction.owner !== queryOwnerByKnowledgeOwner[prerequisite.targetOwner]
    || navigation.selection.selected?.owner !== queryOwnerByKnowledgeOwner[prerequisite.targetOwner]
    || navigation.selection.selected.capabilityRef !== prerequisite.targetCapability) {
    throw new Error("QRY_KNOWLEDGE_TARGET_NOT_SELECTED_BY_QRY");
  }
  if (navigation.projectRef !== prerequisite.projectId
    || navigation.projectVersion !== prerequisite.projectVersion
    || navigation.projectDigest !== prerequisite.projectDigest) throw new Error("QRY_KNOWLEDGE_PROJECT_BINDING_STALE");
  return { ...structuredClone(navigation), knowledgePrerequisite: structuredClone(prerequisite) };
};

export const isProductKnowledgePrerequisiteDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const prerequisite = navigation.knowledgePrerequisite;
  return Boolean(prerequisite
    && prerequisite.owner === "QUERY_NAVIGATION"
    && navigation.currentAction
    && prerequisite.selectedActionRef === navigation.currentAction.selectedActionId
    && navigation.currentAction.owner === queryOwnerByKnowledgeOwner[prerequisite.targetOwner]
    && navigation.selection.selected?.owner === queryOwnerByKnowledgeOwner[prerequisite.targetOwner]
    && navigation.selection.selected.capabilityRef === prerequisite.targetCapability
    && prerequisite.projectId === navigation.projectRef
    && prerequisite.projectVersion === navigation.projectVersion
    && prerequisite.projectDigest === navigation.projectDigest);
};
