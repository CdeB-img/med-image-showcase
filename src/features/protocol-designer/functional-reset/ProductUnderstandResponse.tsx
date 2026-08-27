import type { ReactNode } from "react";
import type { ProductUnderstandKnowledgePresentation } from "./product-entry-routing";

type Props = {
  presentation: ProductUnderstandKnowledgePresentation;
};

const readableCode = (value: string) => value
  .toLocaleLowerCase("fr-FR")
  .replace(/_/g, " ")
  .replace(/^./, (character) => character.toLocaleUpperCase("fr-FR"));

const Detail = ({ title, count, children }: {
  title: string;
  count?: number;
  children: ReactNode;
}) => <details className="rounded-xl border border-border/80 bg-background/70 px-3 py-2">
  <summary className="cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-ring">
    {title}{typeof count === "number" ? ` (${count})` : ""}
  </summary>
  <div className="mt-3 space-y-3 text-sm">{children}</div>
</details>;

export default function ProductUnderstandResponse({ presentation }: Props) {
  const { projection } = presentation;
  return <div data-testid="product-understand-knowledge-response" className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-sm bg-muted px-4 py-4 text-sm leading-relaxed sm:max-w-[84%]">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{projection.coverageLabel}</p>
      <div className="mt-2 space-y-2 font-medium">
        {projection.answerStatements.map((statement) => <p key={statement.statementId}>{statement.text}</p>)}
      </div>
      <p className="mt-2 text-muted-foreground">{projection.requestSummary}</p>
      <p className="mt-2 text-xs text-muted-foreground">{projection.boundedConclusion}</p>
    </div>

    {projection.clarifications.length > 0 && <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Clarification nécessaire</p>
      {projection.clarifications.map((clarification) => <div key={clarification.id} className="mt-2 space-y-1">
        <p className="font-medium">{clarification.question}</p>
        <p className="text-xs text-muted-foreground">{clarification.reason}</p>
        <p className="text-xs text-muted-foreground">Choix possibles : {clarification.suggestions.join(" · ")}</p>
      </div>)}
    </div>}

    {projection.supportedItems.length > 0 && <Detail title="Éléments reliés à la réponse" count={projection.supportedItems.length}>
      {projection.supportedItems.map((item) => <article key={item.id} className="border-l-2 border-primary/40 pl-3">
        <p>{item.text}</p>
        <p className="mt-1 text-xs text-muted-foreground">{readableCode(item.status)} · {readableCode(item.applicability)}</p>
        {item.supportIds.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Traçabilité : {item.supportIds.length} source(s) reliée(s).</p>}
        {item.locator && <p className="mt-1 break-words text-xs text-muted-foreground">Localisateur : {item.locator}</p>}
      </article>)}
    </Detail>}

    <div className="grid gap-2 sm:grid-cols-2">
      <Detail title="Sources" count={presentation.sources.length}>
        {presentation.sources.length > 0
          ? presentation.sources.map((source, index) => <article key={`${source.label}:${source.revision}:${index}`}>
            <p className="font-medium">{source.label}</p>
            <p className="text-xs text-muted-foreground">Version {source.revision} · {source.contribution}</p>
            {source.locator && <p className="mt-1 break-words text-xs text-muted-foreground">Localisateur : {source.locator}</p>}
          </article>)
          : <p className="text-muted-foreground">Aucune source applicable n’est affichée pour cette réponse.</p>}
      </Detail>

      <Detail title="Applicabilité">
        {presentation.assertions.length > 0
          ? [...new Set(presentation.assertions.map((item) => item.applicability))].map((item) => <p key={item}>• {readableCode(item)}</p>)
          : projection.coverage.map((item) => <p key={item.id}><strong>{item.label} :</strong> {item.status}. {item.explanation}</p>)}
      </Detail>

      <Detail title="Limites" count={presentation.limitations.length}>
        {presentation.limitations.length > 0
          ? presentation.limitations.map((item) => <p key={item}>• {readableCode(item)}</p>)
          : <p className="text-muted-foreground">Aucune limite supplémentaire n’est structurée dans ce résultat.</p>}
      </Detail>

      <Detail title="Contradictions / débats" count={presentation.contradictions.length}>
        {presentation.contradictions.length > 0
          ? presentation.contradictions.map((item, index) => <p key={`${item.state}:${index}`}><strong>{readableCode(item.state)} :</strong> {item.explanation}</p>)
          : <p className="text-muted-foreground">Aucune contradiction structurée n’est présente dans ce résultat.</p>}
      </Detail>

      <Detail title="Lacunes" count={presentation.gaps.length}>
        {presentation.gaps.length > 0
          ? presentation.gaps.map((item, index) => <p key={`${item.kind}:${index}`}>• {item.explanation}{item.resumeCondition ? ` Condition de reprise : ${item.resumeCondition}` : ""}</p>)
          : <p className="text-muted-foreground">Aucune lacune supplémentaire n’est structurée dans ce résultat.</p>}
      </Detail>

      <Detail title="Provenance et versions" count={presentation.provenance.length}>
        <p>Knowledge Engine {presentation.engineVersion}</p>
        <p>État du corpus : {presentation.freshness.corpusStateDate}</p>
        {presentation.provenance.map((item) => <p key={`${item.provider}:${item.version}`}>• {item.provider} · version {item.version}</p>)}
      </Detail>
    </div>
  </div>;
}
