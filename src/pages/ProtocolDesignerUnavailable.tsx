import { Helmet } from "react-helmet-async";

export default function ProtocolDesignerUnavailable() {
  return (
    <main className="min-h-[70vh] px-4 py-24">
      <Helmet>
        <title>Protocol Designer indisponible | NOXIA</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card/40 p-8">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Version d’évaluation</p>
        <h1 className="mt-3 text-2xl font-semibold">Protocol Designer est temporairement indisponible.</h1>
        <p className="mt-4 text-muted-foreground">
          La conception d’étude, les sources et les documents de travail seront de nouveau accessibles après cette interruption. Aucun traitement externe n’est déclenché depuis cette page.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Un document généré nécessite une validation scientifique, réglementaire et institutionnelle adaptée à son usage.</p>
      </section>
    </main>
  );
}
