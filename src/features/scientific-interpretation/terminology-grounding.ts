import { logicalDigest } from "../knowledge-engine/canonical.js";
import type {
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationConversation,
  ScientificInterpretationTerminologyContext,
  ScientificInterpretationTerminologyEntry,
} from "./contracts.js";

// This is the compact vocabulary of roles already accepted by the current
// Contribution -> Project compiler. It contains canonical labels, not acronym
// expansions or fixture-specific aliases.
export const SCIENTIFIC_INTERPRETATION_SUPPORTED_ROLE_TERMINOLOGY = [
  { role: "PRIMARY_ENDPOINT", labelFr: "critère de jugement principal", labelEn: "primary endpoint" },
  { role: "SECONDARY_ENDPOINT", labelFr: "critère de jugement secondaire", labelEn: "secondary endpoint" },
  { role: "EXCLUSION", labelFr: "critère d’exclusion", labelEn: "exclusion criterion" },
  { role: "INCLUSION", labelFr: "critère d’inclusion", labelEn: "inclusion criterion" },
  { role: "MEASURED_VARIABLE", labelFr: "variable mesurée", labelEn: "measured variable" },
  { role: "INTERVENTION_ARM", labelFr: "groupe intervention", labelEn: "intervention arm" },
  { role: "COMPARATOR_ARM", labelFr: "groupe comparateur", labelEn: "comparator arm" },
] as const;

const roleEntries = (): ScientificInterpretationTerminologyEntry[] =>
  SCIENTIFIC_INTERPRETATION_SUPPORTED_ROLE_TERMINOLOGY.map((item) => ({
    termId: `supported-role:${item.role}`,
    preferredMeaning: item.labelFr,
    surfaceForms: [item.labelFr, item.labelEn],
    semanticRoleCandidate: item.role,
    referencedProjectElementIds: [],
    source: "NOXIA_SUPPORTED_ROLE_VOCABULARY",
  }));

const projectEntries = (
  conversation: ScientificInterpretationConversation,
): ScientificInterpretationTerminologyEntry[] => conversation.projectContext?.elements.map((element) => ({
  termId: `project-term:${element.elementId}`,
  preferredMeaning: element.content,
  surfaceForms: [...new Set([element.content, ...(element.aliases ?? [])])],
  semanticRoleCandidate: null,
  referencedProjectElementIds: [element.elementId],
  source: "PROJECT",
})) ?? [];

const previousLocalEntries = (
  previousContribution?: ScientificInterpretationContributionEnvelope | null,
): ScientificInterpretationTerminologyEntry[] => previousContribution?.cognitiveBoundary?.terminologyGrounding?.resolutions
  .filter((resolution) => resolution.source === "CONVERSATION_USER_DEFINED")
  .filter((resolution) => resolution.status === "RESOLVED_CONVERSATION" && resolution.resolvedMeaning)
  .map((resolution) => ({
    termId: `conversation-term:${logicalDigest({
      surfaceForm: resolution.surfaceForm,
      resolvedMeaning: resolution.resolvedMeaning,
      sourceTurnIds: resolution.sourceTurnIds,
    })}`,
    preferredMeaning: resolution.resolvedMeaning!,
    surfaceForms: [resolution.surfaceForm],
    // A local alias preserves concept identity. A role asserted on one use of
    // that concept is not part of the alias definition itself.
    semanticRoleCandidate: null,
    referencedProjectElementIds: [...resolution.referencedProjectElementIds],
    source: "CONVERSATION_USER_DEFINED" as const,
  })) ?? [];

export const buildScientificInterpretationTerminologyContext = (
  conversation: ScientificInterpretationConversation,
  previousContribution?: ScientificInterpretationContributionEnvelope | null,
): ScientificInterpretationTerminologyContext => ({
  lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE",
  contractNature: "RUNTIME_TERMINOLOGY_CONTEXT_NOT_PD003_OBJECT",
  authoritative: false,
  scope: "CURRENT_INTERPRETATION_TURN",
  entries: [...projectEntries(conversation), ...previousLocalEntries(previousContribution), ...roleEntries()],
  resolutionPolicy: "KNOWN_OR_CONTEXT_DEFINED_ELSE_CLARIFY",
});
