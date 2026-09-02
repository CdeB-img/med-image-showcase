import type { StandardStudyDesignInteraction, StandardStudyDesignPresentation } from "./study-design-standard";

type Props = {
  presentation: StandardStudyDesignPresentation;
  interaction: StandardStudyDesignInteraction | null;
  onSelect: (optionRef: string) => void;
  onDiscuss: () => void;
};

const statusMessage = (interaction: StandardStudyDesignInteraction | null) => {
  if (!interaction) return null;
  if (interaction.status === "PENDING_HUMAN_REVIEW") return "Une option est en attente de votre confirmation dans la revue ci-dessous.";
  if (interaction.status === "ADOPTED") return "Le design confirmé est maintenant intégré au Research Project.";
  if (interaction.status === "REJECTED") return "Ces options ont été écartées. Le Research Project n’a pas été modifié.";
  if (interaction.status === "STALE") return "Ces options correspondent à une version antérieure du Research Project.";
  return null;
};

export default function StudyDesignStandardCard({ presentation, interaction, onSelect, onDiscuss }: Props) {
  const active = interaction?.status === "ACTIVE";
  const message = statusMessage(interaction);
  return <article className="max-w-[94%] rounded-2xl border bg-muted/35 p-4 text-sm shadow-sm sm:max-w-[88%]" data-testid="standard-study-design-proposal">
    <h3 className="font-semibold">{presentation.title}</h3>
    <p className="mt-2 leading-relaxed text-muted-foreground">{presentation.introduction}</p>

    {presentation.options.length > 0 ? <div className="mt-4 space-y-3">
      {presentation.options.map((option, index) => <section key={option.optionRef} className="rounded-xl border bg-background p-4">
        <p className="font-semibold">{index + 1}. {option.label}</p>
        <p className="mt-2 leading-relaxed">{option.rationale}</p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {option.mainAdvantage && <div className="rounded-lg bg-emerald-50 p-3 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
            <dt className="text-xs font-semibold uppercase tracking-wide">Atout principal</dt>
            <dd className="mt-1">{option.mainAdvantage}</dd>
          </div>}
          {option.mainLimitation && <div className="rounded-lg bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            <dt className="text-xs font-semibold uppercase tracking-wide">Limite principale</dt>
            <dd className="mt-1">{option.mainLimitation}</dd>
          </div>}
        </dl>
        {option.details.length > 0 && <details className="mt-3 rounded-lg border px-3 py-2">
          <summary className="cursor-pointer font-medium">Voir les prérequis et conséquences</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {option.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        </details>}
        <button
          type="button"
          disabled={!active}
          onClick={() => onSelect(option.optionRef)}
          className="mt-3 min-h-10 rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >Retenir cette option pour revue</button>
      </section>)}
    </div> : presentation.informationNeed && <p className="mt-4 rounded-xl border bg-background p-4 font-medium">{presentation.informationNeed}</p>}

    {presentation.majorTradeoff && <details className="mt-4 rounded-xl border bg-background px-4 py-3">
      <summary className="cursor-pointer font-medium">Comparer les arbitrages</summary>
      <p className="mt-3 whitespace-pre-line text-muted-foreground">{presentation.majorTradeoff}</p>
    </details>}

    {presentation.options.length > 0 && <button type="button" onClick={onDiscuss} className="mt-4 min-h-10 rounded-lg border bg-background px-3 py-2 font-medium">
      Discuter ou proposer une autre stratégie
    </button>}
    {message && <p className="mt-3 text-sm font-medium text-muted-foreground" role="status">{message}</p>}
  </article>;
}
