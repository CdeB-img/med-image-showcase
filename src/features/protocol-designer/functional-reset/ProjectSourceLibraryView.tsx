import { useState } from "react";
import { safeSourceUrl, sourceShortReference, type ProjectSource, type ProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import type { DocumentProjection } from "@/features/document-projection";

type Props = { library: ProjectSourceLibrary | undefined; documents: readonly DocumentProjection[]; onAcquire: () => void; onInstruction: (text: string) => void; onClose: () => void; message: string };
export default function ProjectSourceLibraryView({ library, documents, onAcquire, onInstruction, onClose, message }: Props) {
  const [query, setQuery] = useState("");
  const sources = library?.sources ?? [];
  const usages = (sourceId: string) => documents.filter((document) => document.evidenceContent?.sources.some((entry) => entry.source.sourceId === sourceId));
  const renderSource = (entry: ProjectSource) => <article key={entry.source.sourceId} className="rounded-xl border bg-background p-4">
    <h3 className="font-semibold">{sourceShortReference(entry)}</h3><p className="mt-1">{entry.source.title}</p>
    {entry.authors.length > 1 && <p className="mt-1 text-xs text-muted-foreground">{entry.authors.join(" ; ")}</p>}
    <div className="mt-2 flex flex-wrap gap-3 text-sm">{entry.source.doi && <span>DOI : {entry.source.doi}</span>}{entry.source.pmid && <a className="underline" href={`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(entry.source.pmid)}/`} target="_blank" rel="noreferrer">PubMed · {entry.source.pmid}</a>}{safeSourceUrl(entry.url) && !entry.source.pmid && <a className="underline" href={safeSourceUrl(entry.url)!} target="_blank" rel="noreferrer">Consulter la source</a>}</div>
    <p className="mt-2 text-sm">Intérêt pour vous : {entry.userRelevance === "EXPLICIT_INTEREST" ? "explicitement demandé" : entry.userRelevance === "INFERRED_INTEREST" ? "inféré — à confirmer" : "aucune préférence déclarée"}. Statut scientifique : {entry.scientificWeight.assessment === "OWNER_QUALIFIED_ASSERTIONS" ? "assertions qualifiées dans le corpus" : "non évalué"}. Niveau de preuve comparatif : non attribué.</p>
    <p className="mt-1 text-sm text-muted-foreground">{usages(entry.source.sourceId).length ? `Utilisée dans l’introduction : versions ${usages(entry.source.sourceId).map((document) => document.projectionVersion).join(", ")}.` : "Non utilisée dans les versions documentaires conservées."}</p>
    {entry.conflicts?.filter((conflict) => ["CONTRADICTION", "CONTROVERSY"].includes(conflict.state)).map((conflict) => <p key={conflict.conflictId} className="mt-2 text-sm">Désaccord scientifique non arbitré : {conflict.explanation}</p>)}
    <details className="mt-2 text-sm"><summary>Ce que cette source soutient et ses limites</summary><ul className="mt-2 list-disc pl-5">{entry.assertions.map((assertion) => <li key={assertion.revision}>{assertion.text}<span className="block text-xs text-muted-foreground">{assertion.applicability} · {assertion.locator}</span></li>)}</ul>{!entry.assertions.length && <p>Aucune assertion qualifiée disponible ; la référence seule ne permet pas d’inventer son contenu.</p>}</details>
    <button type="button" className="mt-3 min-h-10 rounded-lg border px-3 text-sm" onClick={() => onInstruction(`Ajoute la référence PMID ${entry.source.pmid ?? entry.source.sourceId} dans l’introduction`)}>Demander son ajout à l’introduction</button>
  </article>;
  const groups = [
    { title: "Sources apportées ou mentionnées par vous", items: sources.filter((source) => source.origins.some((origin) => origin.startsWith("USER_"))) },
    { title: "Sources utilisées dans les documents", items: sources.filter((source) => usages(source.source.sourceId).length) },
    { title: "Sources suggérées ou retrouvées par NOXIA", items: sources.filter((source) => source.origins.some((origin) => ["EXISTING_CORPUS", "NOXIA_RETRIEVED"].includes(origin))) },
  ];
  return <section aria-label="Bibliothèque des sources du projet" className="rounded-2xl border bg-background p-5">
    <button type="button" onClick={onClose} className="min-h-10 rounded-lg border px-3 text-sm">Retour au projet</button>
    <h2 className="mt-4 text-xl font-semibold">Sources du projet</h2><p className="mt-2 text-sm text-muted-foreground">L’intérêt que vous portez à une publication reste distinct de son poids scientifique. Le corpus local conserve ses qualifications et ses limites ; aucune recherche Internet n’est effectuée ici.</p>
    <button type="button" onClick={onAcquire} className="mt-3 min-h-11 rounded-xl border px-4 text-sm">Retrouver les sources du corpus local</button>
    <form className="mt-4" onSubmit={(event) => { event.preventDefault(); if (query.trim()) { onInstruction(`Il manque ${query.trim()} dans l’introduction`); setQuery(""); } }}>
      <label htmlFor="document-source-query" className="block text-sm font-medium">Référence à retrouver — auteur et année, DOI ou PMID</label>
      <input id="document-source-query" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 w-full rounded-lg border p-3" />
      <button type="submit" disabled={!query.trim()} className="mt-2 min-h-10 rounded-lg border px-3 text-sm disabled:opacity-50">Retrouver et proposer son ajout</button>
    </form>
    {message && <p role="status" className="mt-4 rounded-xl border p-3 text-sm">{message}</p>}
    {groups.map((group) => <section key={group.title} aria-label={group.title} className="mt-6"><h3 className="mb-3 font-semibold">{group.title}</h3><div className="space-y-3">{group.items.length ? group.items.map(renderSource) : <p className="text-sm text-muted-foreground">Aucune source dans cette catégorie.</p>}</div></section>)}
    {Boolean(library?.unresolvedMentions.length) && <section className="mt-6"><h3 className="font-semibold">Références à identifier</h3><ul className="mt-2 list-disc pl-5">{library!.unresolvedMentions.map((mention) => <li key={mention.mentionId}>{mention.text} — identité non résolue, aucun DOI ni contenu inféré.</li>)}</ul></section>}
  </section>;
}
