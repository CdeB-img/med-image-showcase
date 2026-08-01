import type { ScientificExplorerData } from "./types";

type ScientificIllustrationProps = {
  illustration: ScientificExplorerData["illustration"];
};

const ScientificIllustration = ({ illustration }: ScientificIllustrationProps) => {
  if (!illustration) return null;

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card/60">
      <img src={illustration.src} alt={illustration.alt} className="h-auto w-full object-cover" loading="lazy" />
      {(illustration.caption || illustration.credit) && (
        <figcaption className="flex flex-wrap justify-between gap-2 px-4 py-3 text-xs text-muted-foreground">
          <span>{illustration.caption}</span>
          <span>{illustration.credit}</span>
        </figcaption>
      )}
    </figure>
  );
};

export default ScientificIllustration;
