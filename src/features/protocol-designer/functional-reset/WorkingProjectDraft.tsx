import type { FunctionalResetSession } from "./session";

const labels = { EXPLICIT_USER: "Vos choix", INFERRED: "Éléments déduits", PROPOSED: "Propositions", OPEN: "Points ouverts" } as const;
export default function WorkingProjectDraft({ session }: { session: FunctionalResetSession }) {
  const composition = session.studyProposal, draft = session.workingDraft;
  if (!composition || !draft || composition.digest !== draft.compositionDigest) return null;
  return <section aria-label="Projet de travail" className="space-y-3">
    <h2 className="text-base font-semibold">Projet de travail</h2>
    <p className="text-xs text-muted-foreground">Les choix enregistrés figurent dans « Mon projet ». Ce brouillon reste à confirmer.</p>
    {Object.entries(labels).map(([origin, label]) => <section key={origin} aria-label={label}>
      <h3 className="text-sm font-semibold">{label}</h3>
      <ul className="space-y-1 text-sm">{composition.proposal.atoms.filter(a => draft.origins[a.ref] === origin).map(a => <li key={a.ref}>
        {a.content}<details className="text-xs text-muted-foreground"><summary>Pourquoi ce choix ?</summary>{a.rationale}
          {a.dependsOn.length > 0 && <p>Dépend de : {a.dependsOn.map(r => composition.proposal.atoms.find(x => x.ref === r)?.content).join(" ; ")}</p>}
        </details>
      </li>)}</ul>
    </section>)}
    {(["REJECTED", "SUPERSEDED"] as const).map(status => <details key={status}>
      <summary className="text-sm">{status === "REJECTED" ? "Propositions écartées" : "Éléments remplacés"}</summary>
      <ul className="text-sm">{draft.history.filter(h => h.status === status).map((h, i) => <li key={i}>{h.atom.content}</li>)}</ul>
    </details>)}
    <details><summary className="text-sm">Préparation des documents</summary>
      <p className="text-xs text-muted-foreground">Documents après confirmation du projet ; les points ouverts resteront explicitement à compléter.</p>
      {Object.entries(draft.readiness).map(([kind, readiness]) => <p key={kind} className="text-sm">{({ PROTOCOL: "Protocole", SYNOPSIS: "Synopsis", CRF: "Recueil", RECRUITMENT: "Recrutement" } as Record<string, string>)[kind]} · {readiness.status === "WORKING_DRAFT" ? "Base de travail préparée" : "À préciser"}</p>)}
    </details>
  </section>;
}
