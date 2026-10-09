import { PROTOCOL_STRUCTURE_SOURCES, type composeProtocolWritingProfile } from "../study-template/protocol-writing-profile";

/** Informative plan, not a completeness certificate or a second template editor. */
export default function ProtocolWritingOutline({ profile }: { profile: ReturnType<typeof composeProtocolWritingProfile> }) {
  return <details className="border-b p-5 sm:p-6" aria-label="Structure du protocole">
    <summary className="cursor-pointer font-medium">Structure proposée pour ce protocole</summary>
    <p className="mt-3 text-sm text-muted-foreground">Socle NOXIA original et rubriques adaptées aux décisions adoptées. Cette structure n’ajoute aucun choix scientifique et ne vaut pas qualification réglementaire.</p>
    <ol className="mt-3 grid list-inside list-decimal gap-2 text-sm sm:grid-cols-2">{profile.sections.map(section => <li key={section.sectionId}>
      <span className="font-medium">{section.title}</span><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{section.purpose}</p>
    </li>)}</ol>
    <details className="mt-4 text-xs text-muted-foreground"><summary>Sources structurelles et limites</summary>
      <ul className="mt-2 space-y-2">{PROTOCOL_STRUCTURE_SOURCES.filter(source => profile.sourceIds.includes(source.sourceId)).map(source => <li key={source.sourceId}>
        <a className="underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.institution} · {source.versionDate ?? "date de version inconnue"}<p>{source.limitations}</p>
      </li>)}</ul>
    </details>
  </details>;
}
