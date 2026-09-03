import type { StandardCanonicalStudyDataInteraction, StandardCanonicalStudyDataPresentation } from "./canonical-study-data-standard";

type Props = {
  presentation: StandardCanonicalStudyDataPresentation;
  interaction: StandardCanonicalStudyDataInteraction | null;
  onContinue: () => void;
  onDiscuss: () => void;
};

export default function CanonicalStudyDataStandardCard({ presentation, interaction, onContinue, onDiscuss }: Props) {
  const active = interaction?.status === "ACTIVE";
  return <article className="max-w-[94%] rounded-2xl border bg-muted/35 p-4 text-sm shadow-sm sm:max-w-[88%]" data-testid="standard-cdm-result">
    <h3 className="font-semibold">{presentation.title}</h3>
    <p className="mt-2 leading-relaxed text-muted-foreground">{presentation.introduction}</p>
    {presentation.variables.length > 0 && <div className="mt-4 space-y-2">
      {presentation.variables.map((variable) => <section key={variable.label} className="rounded-xl border bg-background p-3">
        <p className="font-medium">{variable.label}</p>
        <p className="mt-1 text-muted-foreground">{variable.occasionCount
          ? `${variable.occasionCount} occasion${variable.occasionCount > 1 ? "s" : ""} attendue${variable.occasionCount > 1 ? "s" : ""}`
          : "Occasion à préciser"}</p>
      </section>)}
    </div>}
    {presentation.informationNeeds.length > 0 && <div className="mt-4 rounded-xl border bg-background p-3">
      <p className="font-semibold">Informations encore nécessaires</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{presentation.informationNeeds.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>}
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" disabled={!active} onClick={onContinue} className="min-h-10 rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Préparer la gestion des données</button>
      <button type="button" onClick={onDiscuss} className="min-h-10 rounded-lg border bg-background px-3 py-2 font-medium">Discuter librement</button>
    </div>
    {interaction?.status === "STALE" && <p className="mt-3 font-medium text-muted-foreground" role="status">Cette représentation correspond à une version antérieure du projet.</p>}
  </article>;
}
