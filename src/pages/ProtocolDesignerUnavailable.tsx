import { Helmet } from "react-helmet-async";

export default function ProtocolDesignerUnavailable() {
  return (
    <main className="min-h-[70vh] px-4 py-24">
      <Helmet>
        <title>Protocol Designer indisponible | NOXIA</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card/40 p-8">
        <p className="font-mono text-xs text-muted-foreground">ACCÈS TEMPORAIREMENT SUSPENDU</p>
        <h1 className="mt-3 text-2xl font-semibold">Protocol Designer n’est pas accessible publiquement.</h1>
        <p className="mt-4 text-muted-foreground">
          La surface est maintenue hors production pendant sa stabilisation. Aucun traitement externe n’est déclenché depuis cette page.
        </p>
      </section>
    </main>
  );
}
