import type { StandardImagingInteraction, StandardImagingPresentation } from "./imaging-standard";

type Props = {
  presentation: StandardImagingPresentation;
  interaction: StandardImagingInteraction | null;
  onSelect: (optionRef: string) => void;
  onDiscuss: () => void;
};

export default function ImagingStandardCard({ presentation, interaction, onSelect, onDiscuss }: Props) {
  const active = interaction?.status === "ACTIVE";
  const status = interaction?.status === "PENDING_HUMAN_REVIEW"
    ? "Une stratégie d’acquisition est en attente de votre confirmation dans la revue ci-dessous."
    : interaction?.status === "ADOPTED" ? "La stratégie confirmée est intégrée au projet."
      : interaction?.status === "REJECTED" ? "La proposition a été écartée sans modifier le projet."
        : interaction?.status === "STALE" ? "Ces propositions correspondent à une version antérieure du projet."
          : null;
  return <article className="max-w-[94%] rounded-2xl border bg-muted/35 p-4 text-sm shadow-sm sm:max-w-[88%]" data-testid="standard-imaging-proposal">
    <h3 className="font-semibold">{presentation.title}</h3>
    <p className="mt-2 leading-relaxed text-muted-foreground">{presentation.introduction}</p>
    {presentation.options.length > 0 ? <div className="mt-4 space-y-3">
      {presentation.options.map((option, index) => <section key={option.optionRef} className="rounded-xl border bg-background p-4">
        <p className="font-semibold">{index + 1}. {option.modalityLabel}</p>
        {option.acquisitionLabel && <p className="mt-1">{option.acquisitionLabel}</p>}
        <p className="mt-2 leading-relaxed text-muted-foreground">{option.rationale}</p>
        {option.requirements.length > 0 && <p className="mt-3">Exigences à discuter : {option.requirements.join(" ; ")}</p>}
        {option.limitations.length > 0 && <details className="mt-3 rounded-lg border px-3 py-2">
          <summary className="cursor-pointer font-medium">Voir les limites techniques</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{option.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>}
        {option.projectCandidateType && <button type="button" disabled={!active} onClick={() => onSelect(option.optionRef)} className="mt-3 min-h-10 rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Retenir cette acquisition pour revue</button>}
      </section>)}
    </div> : null}
    {presentation.commonRequirements.length > 0 && <details className="mt-4 rounded-xl border bg-background px-4 py-3">
      <summary className="cursor-pointer font-medium">Qualité et comparabilité</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{presentation.commonRequirements.map((item) => <li key={item}>{item}</li>)}</ul>
    </details>}
    {presentation.unresolvedQuestions.length > 0 && <div className="mt-4 rounded-xl border bg-background p-4">
      <p className="font-semibold">Points à préciser</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{presentation.unresolvedQuestions.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
    </div>}
    <button type="button" onClick={onDiscuss} className="mt-4 min-h-10 rounded-lg border bg-background px-3 py-2 font-medium">Discuter librement</button>
    {status && <p className="mt-3 font-medium text-muted-foreground" role="status">{status}</p>}
  </article>;
}
