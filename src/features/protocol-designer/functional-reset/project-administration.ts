import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { DocumentAdministration } from "@/features/document-projection/administration";

export type LocalResearcherProfile = {
  actorRef: string;
  organizationRef: string;
  revision: number;
  name: string;
  email: string;
  organization: string;
  department: string;
  address: string;
};

export type ProjectAdministrativeData = {
  principalInvestigator: string;
  investigatorRef: string;
  sponsor: string;
  sponsorRef: string;
  protocolVersion: string;
  institution: string;
  contactEmail: string;
  department: string;
  address: string;
};

export type LocalProjectMetadata = {
  title: string;
  revision: number;
  administration: ProjectAdministrativeData;
};

export const emptyProjectAdministration = (): ProjectAdministrativeData => ({
  principalInvestigator: "", investigatorRef: "", sponsor: "", sponsorRef: "", protocolVersion: "",
  institution: "", contactEmail: "", department: "", address: "",
});

export const emptyLocalProfile = (): LocalResearcherProfile => ({
  actorRef: `local-researcher:${crypto.randomUUID()}`,
  organizationRef: `local-organization:${crypto.randomUUID()}`,
  revision: 0, name: "", email: "", organization: "", department: "", address: "",
});

export const documentAdministrationFrom = (
  projectId: string,
  metadata: LocalProjectMetadata,
): DocumentAdministration => {
  const data = metadata.administration;
  const field = (key: string, label: string, raw: string, required: boolean, placeholder: string, sourceRef: string | null = null) => ({
    key, label, value: raw.trim() || null, required, placeholder,
    sourceRef: raw.trim() ? sourceRef ?? `${projectId}:administration:${metadata.revision}:${key}` : null,
  });
  const fields = [
    field("title", "Titre de travail", metadata.title, true, "[Titre de travail à compléter]"),
    field("principalInvestigator", "Investigateur principal", data.principalInvestigator, true, "[Investigateur principal à compléter]", data.investigatorRef || null),
    field("sponsor", "Promoteur", data.sponsor, true, "[Promoteur à compléter]", data.sponsorRef || null),
    field("protocolVersion", "Version documentaire déclarée", data.protocolVersion, true, "[Numéro de version à compléter]"),
    field("institution", "Institution de rattachement", data.institution, false, "[Institution non renseignée]"),
    field("contactEmail", "Contact", data.contactEmail, false, "[Contact non renseigné]"),
    field("department", "Service / unité", data.department, false, "[Service non renseigné]"),
    field("address", "Adresse professionnelle", data.address, false, "[Adresse non renseignée]"),
  ];
  const status = fields.some((f) => f.required && !f.value) ? "DRAFT_WITH_PLACEHOLDERS" : "ADMIN_COMPLETE_FOR_REVIEW";
  const material = { projectId, metadataRevision: metadata.revision, status, fields } as const;
  return { ...material, digest: logicalDigest(material) };
};
