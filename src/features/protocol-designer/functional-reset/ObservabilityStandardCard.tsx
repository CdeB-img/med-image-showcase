import type { StandardObservabilityInteraction, StandardObservabilityPresentation } from "./observability-standard";

type Props = {
  presentation: StandardObservabilityPresentation;
  interaction: StandardObservabilityInteraction | null;
  onSelect: (measurementRef: string) => void;
  onDiscuss: () => void;
};

export default function ObservabilityStandardCard({ presentation, interaction, onSelect, onDiscuss }: Props) {
  const active = interaction?.status === "ACTIVE";
  const status = interaction?.status === "PENDING_HUMAN_REVIEW"
    ? "Une mesure est en attente de votre confirmation dans la revue ci-dessous."
    : interaction?.status === "ADOPTED" ? "La conséquence confirmée est intégrée au projet."
      : interaction?.status === "STALE" ? "Ces propositions correspondent à une version antérieure du projet."
        : null;
  return <article className="max-w-[94%] rounded-2xl border bg-muted/35 p-4 text-sm shadow-sm sm:max-w-[88%]" data-testid="standard-observability-proposal">
    <h3 className="font-semibold">{presentation.title}</h3>
    <p className="mt-2 leading-relaxed text-muted-foreground">{presentation.introduction}</p>
    {presentation.properties.map((property) => <section key={property.propertyRef} className="mt-3 rounded-xl border bg-background p-4">
      <p className="font-semibold">Propriété observable proposée</p>
      <p className="mt-1">{property.label}</p>
      <p className="mt-2 text-muted-foreground">{property.rationale}</p>
    </section>)}
    {presentation.options.length > 0 ? <div className="mt-4 space-y-3">
      {presentation.options.map((option, index) => <section key={option.optionRef} className="rounded-xl border bg-background p-4">
        <p className="font-semibold">{index + 1}. {option.measurementLabel}</p>
        <p className="mt-1 text-muted-foreground">Propriété visée : {option.propertyLabel}</p>
        <p className="mt-2 leading-relaxed">{option.rationale}</p>
        {option.limitations.length > 0 && <details className="mt-3 rounded-lg border px-3 py-2">
          <summary className="cursor-pointer font-medium">Voir les limites</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{option.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>}
        <button type="button" disabled={!active} onClick={() => onSelect(option.optionRef)} className="mt-3 min-h-10 rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Retenir cette mesure pour revue</button>
      </section>)}
    </div> : presentation.informationNeeds.length > 0 && <div className="mt-4 rounded-xl border bg-background p-4">
      <p className="font-semibold">Point à préciser</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{presentation.informationNeeds.map((need) => <li key={need}>{need}</li>)}</ul>
    </div>}
    <button type="button" onClick={onDiscuss} className="mt-4 min-h-10 rounded-lg border bg-background px-3 py-2 font-medium">Discuter librement</button>
    {status && <p className="mt-3 font-medium text-muted-foreground" role="status">{status}</p>}
  </article>;
}
