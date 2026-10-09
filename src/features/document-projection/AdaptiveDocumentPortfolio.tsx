import type { PortfolioNeed } from "./adaptive-portfolio";

const applicability = { APPLICABLE: "Pertinent pour cette étude", POTENTIALLY_APPLICABLE: "À confirmer", NOT_APPLICABLE: "Non applicable", UNKNOWN: "Applicabilité inconnue" };
export default function AdaptiveDocumentPortfolio({ items, onConversation }: { items: readonly PortfolioNeed[]; onConversation?: () => void }) {
  const visible = items.filter(item => item.applicability === "APPLICABLE" || item.requested || item.delivery !== "NOT_GENERATED");
  const potential = items.filter(item => !visible.includes(item) && item.applicability !== "NOT_APPLICABLE");
  const card = (item: PortfolioNeed) => <li key={item.documentId} className="rounded-xl border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-medium">{item.label}</h4><span className="text-xs text-muted-foreground">{item.requested ? "Demandé par vous" : applicability[item.applicability]}</span></div>
    <p className="mt-1 text-sm">{item.delivery === "GENERATED" ? "Document archivé pour le projet courant"
      : item.delivery === "POTENTIALLY_OUTDATED" ? "Document historique · à actualiser"
        : item.productionSupported && item.applicability === "APPLICABLE" ? "Disponible dans la prochaine génération explicite du pack"
          : "Besoin documentaire à préciser · production non qualifiée"}</p>
    <details className="mt-2 text-xs text-muted-foreground"><summary>Pourquoi ce document ?</summary><ul className="mt-2 space-y-1">{item.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      <p className="mt-2">Une suggestion n’est ni une obligation réglementaire ni un document déjà produit.</p></details>
  </li>;
  return <section className="border-b p-5 sm:p-6" aria-label="Documents pertinents pour votre étude">
    <h3 className="font-semibold">Les documents de votre étude</h3>
    <p className="mt-2 text-sm text-muted-foreground">Propositions issues du projet, de TMP et des exigences qualifiées par REG. Aucune génération à la consultation.</p>
    <ul className="mt-3 grid gap-3 sm:grid-cols-2">{visible.map(card)}</ul>
    {potential.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm">Autres besoins possibles · à qualifier ({potential.length})</summary><ul className="mt-3 grid gap-3 sm:grid-cols-2">{potential.map(card)}</ul></details>}
    {onConversation && <button type="button" className="mt-4 min-h-11 rounded-lg border px-3 text-sm" onClick={onConversation}>Demander un autre document dans la conversation</button>}
  </section>;
}
