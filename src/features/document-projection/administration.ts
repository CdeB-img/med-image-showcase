/** Documentary metadata is independent of scientific readiness and human adoption. */
export type DocumentAdministration = Readonly<{
  projectId: string;
  metadataRevision: number;
  digest: string;
  status: "DRAFT_WITH_PLACEHOLDERS" | "ADMIN_COMPLETE_FOR_REVIEW";
  fields: ReadonlyArray<Readonly<{
    key: string;
    label: string;
    value: string | null;
    required: boolean;
    placeholder: string;
    sourceRef: string | null;
  }>>;
}>;

export const administrationStatusLabel = (administration: DocumentAdministration) =>
  administration.status === "DRAFT_WITH_PLACEHOLDERS"
    ? "Brouillon — informations à compléter"
    : "Informations administratives complètes — pour revue";
