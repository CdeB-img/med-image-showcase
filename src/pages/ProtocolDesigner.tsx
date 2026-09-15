import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";
import { ArrowRight, BookOpenCheck, CheckCircle2, CircleAlert } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/protocol-designer";

const futureSteps = ["Revues", "Interprétation des résultats", "Publication"];

export default function ProtocolDesigner() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Protocol Designer", item: CANONICAL },
    ],
  };

  return <>
    <Helmet>
      <title>Protocol Designer — protocole scientifique sourcé | NOXIA</title>
      <meta name="description" content="Structurez une question de recherche, confrontez-la aux sources scientifiques et produisez un protocole sourcé à réviser avec votre équipe." />
      <link rel="canonical" href={CANONICAL} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Protocol Designer — protocole scientifique sourcé | NOXIA" />
      <meta property="og:description" content="De la question de recherche à un protocole scientifique sourcé et révisable." />
      <meta property="og:url" content={CANONICAL} />
      <meta property="og:image" content="https://noxia-imagerie.fr/images/branding/og-home.webp" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Protocol Designer — protocole scientifique sourcé | NOXIA" />
      <meta name="twitter:description" content="De la question de recherche à un protocole scientifique sourcé et révisable." />
      <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
    </Helmet>

    <main className="min-h-screen overflow-x-clip bg-background">
      <section className="relative border-b border-border/60 px-4 py-14 sm:py-20 lg:py-24">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.14),transparent_32%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.08),transparent_28%)]" />
        <div className="relative mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", path: "/" }, { label: "Protocol Designer" }]} />
          <div className="mt-10 max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Protocol Designer</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">De votre question de recherche à un protocole scientifique sourcé</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Structurez l’étude, confrontez les choix aux sources scientifiques, produisez les documents puis révisez le protocole au fil des décisions.</p>
            <Link to="/protocol-designer/demo" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Commencer un projet <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Un même projet, de la conception à la publication</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Parcours du projet de recherche">
            {["Conception", "Protocole / documents"].map((step, index) => <li key={step} className="rounded-2xl border border-primary/35 bg-primary/5 p-5">
              <span className="text-xs font-semibold text-primary">0{index + 1}</span><p className="mt-2 font-semibold">{step}</p>
            </li>)}
            {futureSteps.map((step, index) => <li key={step} aria-disabled="true" className="rounded-2xl border border-dashed bg-muted/55 p-5 text-muted-foreground">
              <span className="text-xs font-semibold">0{index + 3} · À venir</span><p className="mt-2 font-semibold">{step}</p>
            </li>)}
          </ol>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/25 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold tracking-tight">Repères de confiance</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              { icon: CheckCircle2, title: "Décisions confirmées", text: "Les choix scientifiques restent soumis à la confirmation du chercheur." },
              { icon: BookOpenCheck, title: "Sources traçables", text: "Les documents relient les arguments aux références mobilisées." },
              { icon: CircleAlert, title: "Incertitudes explicites", text: "Les informations manquantes et les limites restent visibles." },
            ].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border bg-background p-5">
              <Icon aria-hidden="true" className="h-5 w-5 text-primary" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>)}
          </div>
          <Link to="/protocol-designer/demo" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg border bg-background px-6 py-3 font-semibold hover:bg-card">
            Commencer un projet <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
