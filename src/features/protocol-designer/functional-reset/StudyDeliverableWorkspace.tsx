import { useState } from "react";
import { ArrowLeft, Download, PackageOpen } from "lucide-react";
import {
  downloadStudyDeliverableFile,
  downloadStudyPackage,
  type StudyDeliverablePortfolio,
  type StudyDeliverableStatus,
  type StudyDeliverableFile,
} from "@/features/document-projection";
import { drciDraftPackFiles } from "@/features/document-projection/drci-draft-pack";
import type { DrciDraftPack } from "@/features/document-projection/drci-draft-contract";

type Props = {
  portfolio: Readonly<StudyDeliverablePortfolio>;
  onClose: () => void;
  saveWarning?: string | null;
  documentPacks?: readonly DrciDraftPack[];
  projectId?: string;
};

const statusPresentation: Record<StudyDeliverableStatus, { label: string; className: string }> = {
  STALE: { label: "À actualiser", className: "bg-muted text-muted-foreground" },
  READY: { label: "Prêt", className: "bg-emerald-100 text-emerald-800" },
  PARTIAL: { label: "Partiel", className: "bg-amber-100 text-amber-900" },
  MISSING_DECISION: { label: "Décision requise", className: "bg-amber-100 text-amber-900" },
  NOT_APPLICABLE: { label: "Non applicable", className: "bg-muted text-muted-foreground" },
  PROFILE_REQUIRED: { label: "Profil requis", className: "bg-sky-100 text-sky-900" },
};

export const documentGenerationsForProject = (packs: readonly DrciDraftPack[], projectId: string | undefined) =>
  packs.filter((pack) => pack.project.projectId === projectId).map((pack, index) => ({
    documentGenerationId: `${pack.project.projectId}:document-generation:${index + 1}`,
    documentVersion: index + 1,
    projectId: pack.project.projectId,
    projectVersionId: pack.project.projectVersion,
    projectDigest: pack.project.projectDigest,
    createdAt: pack.generatedAt,
    status: "AVAILABLE" as const,
    documentDraftPack: pack,
  }));

export default function StudyDeliverableWorkspace({ portfolio, onClose, saveWarning, documentPacks = [], projectId }: Props) {
  const [openFile, setOpenFile] = useState<StudyDeliverableFile | null>(null);
  const [openTitle, setOpenTitle] = useState("");
  const availableCount = portfolio.artifacts.filter((artifact) => artifact.files.length > 0).length;
  const generations = documentGenerationsForProject(documentPacks, projectId);
  return <section
    aria-labelledby="study-deliverable-workspace-title"
    className="min-w-0 rounded-3xl border bg-background shadow-sm"
    data-testid="study-deliverable-workspace"
  >
    {saveWarning && <p role="alert" className="border-b bg-amber-50 px-5 py-3 text-sm text-amber-950">{saveWarning}</p>}
    <header className="border-b px-5 py-5 sm:px-6">
      <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Retour à la conversation
      </button>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Documents / Livrables de l’étude</p>
          <h2 id="study-deliverable-workspace-title" className="mt-1 text-2xl font-semibold">Portefeuille documentaire</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {availableCount} livrable{availableCount > 1 ? "s" : ""} téléchargeable{availableCount > 1 ? "s" : ""} depuis le projet version {portfolio.projectRef.projectVersion.split(":").at(-1)}. Les éléments ouverts restent signalés et ne sont pas inventés.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadStudyPackage(portfolio)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          data-testid="download-study-package"
        >
          <PackageOpen className="h-4 w-4" /> Exporter le package de l’étude (.zip)
        </button>
      </div>
    </header>

    {portfolio.artifacts.some(artifact => artifact.status === "STALE") && <p role="status" className="m-5 rounded-xl border bg-amber-50 p-3 text-sm text-amber-900">Le projet a changé. Les documents rédigés ci-dessous sont des versions antérieures à actualiser.</p>}
    {generations.length > 0 && <section className="border-b px-5 py-4 sm:px-6" aria-label="Versions documentaires" data-testid="document-generation-history">
      <h3 className="font-semibold">Versions documentaires</h3>
      <ul className="mt-3 space-y-3">{[...generations].reverse().map((generation) => <li key={generation.documentGenerationId} className="rounded-xl border p-3" data-testid={`document-generation-${generation.documentVersion}`}>
        <p className="text-sm font-medium">Documents V{generation.documentVersion} disponibles · projet version {generation.projectVersionId.split(":").at(-1)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{new Date(generation.createdAt).toLocaleString("fr-FR")} · {generation.projectDigest === portfolio.projectRef.projectDigest ? "Version courante" : "Version historique"}</p>
        <div className="mt-2 flex flex-wrap gap-2">{drciDraftPackFiles(generation.documentDraftPack).map((document) => <button key={document.kind} type="button"
          className="min-h-10 rounded-lg border px-3 text-xs font-medium"
          onClick={() => { setOpenTitle(`Documents V${generation.documentVersion} · ${document.title}`); setOpenFile({ fileName: `${document.kind.toLowerCase()}.html`, format: "HTML", mimeType: "text/html;charset=utf-8", content: document.html }); }}>
          Ouvrir {document.title}
        </button>)}</div>
      </li>)}</ul>
    </section>}
    {openFile && <section className="m-4 rounded-2xl border p-4" aria-label="Document ouvert">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">{openTitle}</h3>
        <button type="button" className="min-h-10 rounded-lg border px-3 text-sm" onClick={() => setOpenFile(null)}>Fermer le document</button></div>
      {openFile.format === "HTML" ? <iframe title={openTitle} sandbox="" srcDoc={openFile.content} className="h-[75vh] w-full rounded-xl border bg-white" />
        : <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap text-sm">{openFile.content}</pre>}
    </section>}
    <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-2">
      {portfolio.artifacts.map((artifact) => {
        const status = statusPresentation[artifact.status];
        return <article key={artifact.artifactId} className="rounded-2xl border p-4" data-testid={`study-deliverable-${artifact.kind}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{artifact.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{artifact.preview}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
          </div>

          {artifact.files.length > 0 && <button type="button" className="mt-3 min-h-10 rounded-lg border px-3 text-sm font-semibold"
            onClick={() => { setOpenTitle(artifact.name); setOpenFile(artifact.files.find(file => file.format === "HTML") ?? artifact.files[0]); }}>Ouvrir {artifact.name}</button>}
          {artifact.files.length > 0 && <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {artifact.files.map((file) => <button
              key={file.fileName}
              type="button"
              onClick={() => downloadStudyDeliverableFile(file)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 font-medium"
              aria-label={`Télécharger ${file.fileName}`}
            ><Download className="h-3.5 w-3.5" /> {file.fileName}</button>)}
          </div>}

          {artifact.missingDecisions.length > 0 && <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">Ce qui reste à décider</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {artifact.missingDecisions.map((decision) => <li key={decision}>{decision}</li>)}
            </ul>
          </details>}

        </article>;
      })}
    </div>

    <footer className="border-t px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-6">
      Source : version confirmée du projet. Cette vue ne modifie ni le projet ni les décisions scientifiques. Le dossier réglementaire ne revendique aucune conformité juridictionnelle.
    </footer>
  </section>;
}
