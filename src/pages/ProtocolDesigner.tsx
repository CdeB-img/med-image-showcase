import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";
import { DEMONSTRATOR_SCENARIOS } from "@/features/protocol-designer/fixtures";
import { ArrowRight, BookOpenCheck, CircleAlert, Compass, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/protocol-designer";

const ProtocolDesigner = () => {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Protocol Designer", item: CANONICAL },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Protocol Designer : démonstrateur de raisonnement | NOXIA</title>
        <meta name="description" content="Découvrez le Protocol Designer NOXIA : un démonstrateur local pour structurer intention, hypothèses, preuves, limites et décision humaine." />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <main className="min-h-screen overflow-x-clip bg-background">
        <section className="relative border-b border-border/60 px-4 py-16 sm:py-20 lg:py-28">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.14),transparent_32%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.08),transparent_28%)]" />
          <div className="relative mx-auto max-w-6xl">
            <Breadcrumb items={[{ label: "Accueil", path: "/" }, { label: "Protocol Designer" }]} />
            <div className="mt-12 grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary">Raisonnement scientifique guidé</p>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
                  De l’intention à une décision <span className="text-primary">explicable.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Explorez un parcours déterministe qui rend visibles les hypothèses, les informations manquantes, les preuves, les controverses et les limites avant toute décision humaine.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/protocol-designer/demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    Ouvrir le démonstrateur <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <a href="#principes" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-card/60 px-6 py-3 font-semibold transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    Comprendre le cadre
                  </a>
                </div>
              </div>
              <aside className="rounded-2xl border border-primary/30 bg-card/70 p-6 shadow-2xl shadow-primary/5">
                <p className="text-sm font-semibold">Ce que le démonstrateur fait</p>
                <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3"><Compass aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />Part d’une intention formulée par l’utilisateur.</li>
                  <li className="flex gap-3"><Scale aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />Compare sans choisir automatiquement.</li>
                  <li className="flex gap-3"><CircleAlert aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-300" />Maintient les bloqueurs critiques visibles.</li>
                  <li className="flex gap-3"><FileCheck2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />Produit un rapport local imprimable.</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section id="principes" className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Une interface de méthode</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Le raisonnement reste inspectable à chaque étape</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                { icon: BookOpenCheck, title: "Preuves situées", text: "Chaque projection cite son corpus propriétaire, sa version et un localisateur documentaire vérifiable." },
                { icon: CircleAlert, title: "Incertitude honnête", text: "Inconnues, contradictions, non-évaluabilité et limites ne sont jamais masquées par un score global." },
                { icon: ShieldCheck, title: "Autorité humaine", text: "Aucune option n’est validée par défaut : auteur, portée et confirmation sont demandés explicitement." },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-border/70 bg-card/50 p-6">
                  <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/25 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Trois corpus, trois scénarios préparés</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">Les scénarios sont des projections locales de démonstration. Ils ne chargent pas les documents scientifiques à l’exécution et ne génèrent ni protocole ni recommandation clinique.</p>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {DEMONSTRATOR_SCENARIOS.map((scenario, index) => (
                <article key={scenario.id} className="rounded-xl border border-border bg-background/70 p-5">
                  <p className="font-mono text-xs text-primary">0{index + 1} · {scenario.program.id} v{scenario.program.version}</p>
                  <h3 className="mt-3 font-semibold">{scenario.shortLabel}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Scénario préparé · {scenario.reasoningBook.id} v{scenario.reasoningBook.version}</p>
                </article>
              ))}
            </div>
            <Link to="/protocol-designer/demo" className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Commencer par mon intention <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ProtocolDesigner;
