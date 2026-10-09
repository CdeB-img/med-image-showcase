import type { StudyTemplateProjectionContext } from "./types";
import type { DocumentGenerationRef } from "./generation-persistence";
import { archivedStudioDocuments } from "./studio-document";
import { logicalDigest, uniqueSorted } from "../knowledge-engine/canonical";

/** Explicit documentary intent only; never extraction of scientific truth. */
export const additionalDocumentRequest = (text: string) => {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLowerCase();
  if (!/\b(?:prepare|cree|ajoute|produis|genere|souhaite|veux)\b/u.test(normalized)) return null;
  const kind = /\bquestionnaire\b/u.test(normalized) ? "QUESTIONNAIRE"
    : /\bguide d.entretien\b/u.test(normalized) ? "INTERVIEW_GUIDE"
    : /\bmanuel d.imagerie\b/u.test(normalized) ? "IMAGING_CHARTER" : null;
  return kind ? { documentId: kind, label: { QUESTIONNAIRE: "Questionnaire", INTERVIEW_GUIDE: "Guide d’entretien", IMAGING_CHARTER: "Manuel d’imagerie" }[kind],
    requestDigest: logicalDigest(text), instruction: text } : null;
};
export type PortfolioNeed = Readonly<{
  documentId: string; label: string;
  applicability: "APPLICABLE" | "POTENTIALLY_APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
  delivery: "NOT_GENERATED" | "GENERATED" | "POTENTIALLY_OUTDATED";
  requested: boolean; productionSupported: boolean; reasons: readonly string[]; sourceRefs: readonly string[];
}>;
const names: Record<string, string> = { PROTOCOL: "Protocole", SYNOPSIS: "Synopsis", IMAGING_CHARTER: "Charte d’imagerie",
  CORE_LAB_MANUAL: "Manuel de lecture", SAP: "Plan d’analyse statistique", CRF_SPECIFICATION: "CRF",
  DATA_DICTIONARY: "Dictionnaire de données", DATA_MANAGEMENT_PLAN: "Plan de gestion des données",
  PATIENT_INFORMATION: "Information des participants", CONSENT: "Consentement", REGULATORY_SUBMISSION: "Dossier réglementaire" };
const nativeDefinitions: Record<string, string> = { PROTOCOL_FULL: "PROTOCOL", PROTOCOL_SYNOPSIS: "SYNOPSIS", CRF: "CRF_SPECIFICATION", RECRUITMENT: "RECRUITMENT" };

/** DOC presentation adapter, not a second applicability engine. TMP's family
 * evidence and REG statuses are preserved without promotion to obligation. */
export const projectAdaptivePortfolio = (context: StudyTemplateProjectionContext,
  generations: readonly DocumentGenerationRef[], currentProjectDigest: string,
  requests: readonly { content: string; sourceRef: string }[] = []): readonly PortfolioNeed[] => {
  if (context.instance.inputRefs.researchProjectDigest !== currentProjectDigest) throw new Error("DOC_PORTFOLIO_PROJECT_BINDING_MISMATCH");
  const archived = generations.flatMap(generation => archivedStudioDocuments(generation).map(document => ({
    documentId: nativeDefinitions[document.nativeDocumentRef] ?? document.nativeDocumentRef, generation,
  })));
  const requested = requests.flatMap(source => {
    const request = additionalDocumentRequest(source.content);
    return request ? [{ ...request, sourceRef: source.sourceRef }] : [];
  });
  const rows: PortfolioNeed[] = context.definition.documents.map(definition => {
    const mapping = context.instance.documents.find(document => document.documentId === definition.documentId);
    const families = context.instance.familyProfiles.filter(family => definition.familyIds.includes(family.familyId));
    const nodes = context.instance.nodes.filter(node => node.nodeId === definition.nodeId);
    const direct = nodes.flatMap(node => node.supports).filter(support => support.supportLevel === "DIRECT"
      && ["PROJECT_SUPPORT", "REGULATORY_SUPPORT", "HUMAN_DECISION_SUPPORT"].includes(support.kind));
    const status = mapping?.status;
    const applicability = status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : status === "UNKNOWN" || status === "CONFLICTING" ? "UNKNOWN"
      : direct.length || families.some(family => family.status === "APPLICABLE") ? "APPLICABLE"
        : "POTENTIALLY_APPLICABLE";
    const generated = archived.filter(item => item.documentId === definition.documentId);
    return { documentId: definition.documentId, label: names[definition.documentId] ?? definition.label,
      applicability, requested: requested.some(item => item.documentId === definition.documentId),
      productionSupported: ["PROTOCOL", "SYNOPSIS", "CRF_SPECIFICATION", "RECRUITMENT"].includes(definition.documentId),
      delivery: generated.some(item => item.generation.project.projectDigest === currentProjectDigest) ? "GENERATED"
        : generated.length ? "POTENTIALLY_OUTDATED" : "NOT_GENERATED",
      reasons: uniqueSorted([...families.map(family => family.reason), ...direct.map(support => support.reason),
        ...(applicability === "POTENTIALLY_APPLICABLE" ? ["Structure TMP disponible ; pertinence et owner spécialisé à confirmer avant production."] : []),
        ...(applicability === "UNKNOWN" ? ["L’applicabilité reste inconnue ; aucune obligation n’est déduite du plan d’étude."] : [])]),
      sourceRefs: uniqueSorted([...families.flatMap(family => [...family.supportingProjectFacts, ...family.supportingRequirements]),
        ...direct.flatMap(support => support.sourceRefs), ...requested.filter(item => item.documentId === definition.documentId).map(item => item.sourceRef)]) };
  });
  for (const request of requested) if (!rows.some(row => row.documentId === request.documentId)) rows.push({
    documentId: request.documentId, label: request.label, applicability: "UNKNOWN", requested: true,
    delivery: "NOT_GENERATED", productionSupported: false,
    reasons: ["Demande utilisateur conservée. Le contrat de production de ce document n’est pas encore disponible ; aucun document n’a été inventé."], sourceRefs: [request.sourceRef] });
  return rows;
};
