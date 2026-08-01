import type { ReactNode } from "react";
import { renderPilotViewModel } from "./renderer.mjs";

type PilotEntry = {
  templateKey: string;
  metadata: { title: string; canonical: string };
  entityIds: string[];
};

const TemplateShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-xl border border-border bg-card/50 p-6 space-y-4" data-editorial-pilot-template>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pilote éditorial interne</p>
    <h2 className="text-2xl font-semibold">{title}</h2>
    {children}
  </section>
);

export const EditorialPilotTemplate = ({ entry }: { entry: PilotEntry }) => {
  const view = renderPilotViewModel(entry);
  return (
    <TemplateShell title={view.title}>
      <p className="text-muted-foreground">{view.description}</p>
      <p className="text-sm text-muted-foreground">Objets : {view.entityIds.join(", ")}</p>
      <a className="text-primary hover:underline" href={view.cta.href}>{view.cta.label}</a>
    </TemplateShell>
  );
};
