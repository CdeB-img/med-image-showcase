import type { StandardDataManagementInteraction, StandardDataManagementPresentation } from "./data-management-standard";

type Props = {
  presentation: StandardDataManagementPresentation;
  interaction: StandardDataManagementInteraction | null;
  onDiscuss: () => void;
};

export default function DataManagementStandardCard({ presentation, interaction, onDiscuss }: Props) {
  return <article className="max-w-[94%] rounded-2xl border bg-muted/35 p-4 text-sm shadow-sm sm:max-w-[88%]" data-testid="standard-data-management-result">
    <h3 className="font-semibold">{presentation.title}</h3>
    <p className="mt-2 leading-relaxed text-muted-foreground">{presentation.introduction}</p>
    <div className="mt-4 rounded-xl border bg-background p-3">
      <p><span className="font-semibold">Collecte logique :</span> {presentation.collectionRequirementCount} exigence{presentation.collectionRequirementCount > 1 ? "s" : ""}</p>
      <p className="mt-2"><span className="font-semibold">État de mise à disposition :</span> {presentation.releaseStatus === "RELEASED" ? "release exacte disponible" : "release encore requise"}</p>
    </div>
    {presentation.informationNeeds.length > 0 && <div className="mt-4 rounded-xl border bg-background p-3">
      <p className="font-semibold">Points à résoudre</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{presentation.informationNeeds.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>}
    <button type="button" onClick={onDiscuss} className="mt-4 min-h-10 rounded-lg border bg-background px-3 py-2 font-medium">Discuter librement</button>
    {interaction?.status === "STALE" && <p className="mt-3 font-medium text-muted-foreground" role="status">Cette préparation correspond à une version antérieure du projet.</p>}
  </article>;
}
