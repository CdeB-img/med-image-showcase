import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  Building2,
  FileSearch,
  FlaskConical,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const OG_IMAGE = "https://noxia-imagerie.fr/images/branding/og-home.webp";
const PROJECTS_BANNER_IMAGE = "https://noxia-imagerie.fr/images/branding/og-projets.webp";
const CANONICAL = "https://noxia-imagerie.fr/";

const entryPoints = [
  {
    title: "Structurer un CoreLab IRM/CT",
    description:
      "Mise en place d'un cadre méthodologique explicite pour projets hospitaliers, académiques ou industriels.",
    to: "/prestations-imagerie-medicale#corelab",
    icon: Workflow,
    cta: "Voir l'accompagnement",
  },
  {
    title: "Auditer un pipeline existant",
    description:
      "Relecture indépendante des choix analytiques, des contrôles qualité et de la traçabilité des livrables.",
    to: "/prestations-imagerie-medicale#audit",
    icon: FileSearch,
    cta: "Demander un audit",
  },
  {
    title: "Explorer les expertises",
    description:
      "IRM quantitative, CT avancé, bases multicentriques, recalage multimodal et ingénierie d'analyse.",
    to: "/expertise",
    icon: FlaskConical,
    cta: "Voir les expertises",
  },
];

const methodologicalPillars = [
  {
    title: "Hypothèses explicites",
    description:
      "Les choix de segmentation, normalisation et quantification sont formalisés et documentés.",
    icon: ShieldCheck,
  },
  {
    title: "Traçabilité opérationnelle",
    description:
      "Versioning des scripts, paramètres et sorties pour relire et justifier chaque étape d'analyse.",
    icon: Workflow,
  },
  {
    title: "Contrôles qualité",
    description:
      "Vérifications sur les entrées, gestion des non-conformités et suivi des exclusions.",
    icon: FileSearch,
  },
  {
    title: "Livrables exploitables",
    description:
      "Exports structurés, métriques, overlays et notes méthodologiques compatibles avec l'analyse scientifique.",
    icon: Building2,
  },
];

const Index = () => {
  return (
    <>
      <Helmet>
        <title>
          Imagerie médicale quantitative & Corelab IRM / CT | NOXIA
        </title>

        <meta
          name="description"
          content="Expert indépendant en imagerie médicale quantitative : biomarqueurs IRM et CT, corelab d’essais cliniques, structuration multicentrique et développement de pipelines reproductibles pour la recherche hospitalière."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Imagerie médicale quantitative & Corelab IRM / CT | NOXIA" />
        <meta
          property="og:description"
          content="Biomarqueurs IRM et CT, corelab d’essais cliniques, structuration multicentrique et ingénierie méthodologique en recherche hospitalière."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={OG_IMAGE} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Imagerie médicale quantitative & Corelab IRM / CT | NOXIA" />
        <meta
          name="twitter:description"
          content="Corelab indépendant, biomarqueurs IRM et CT, harmonisation multicentrique et pipelines reproductibles."
        />
        <meta name="twitter:image" content={OG_IMAGE} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["ProfessionalService", "MedicalBusiness"],
              name: "NOXIA Imagerie",
              url: CANONICAL,
              description:
                "Expert indépendant en imagerie médicale quantitative spécialisé en biomarqueurs IRM et CT, corelab d’essais cliniques et structuration multicentrique.",
              areaServed: "Europe",
              serviceType: [
                "Corelab IRM",
                "Corelab CT",
                "Biomarqueurs d'imagerie",
                "Structuration multicentrique",
                "Segmentation quantitative",
                "Imagerie de perfusion",
              ],
              knowsAbout: [
                "IRM cardiaque",
                "IRM cérébrale",
                "ECV mapping",
                "CT spectral",
                "CT perfusion AVC",
                "Essais cliniques randomisés",
                "Biomarqueurs quantitatifs",
              ],
            }),
          }}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">

          <HeroSection />

          <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-8 items-stretch">
                <div className="rounded-2xl border border-border bg-card/50 p-8 md:p-10 space-y-6">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Imagerie quantitative pour études cliniques et projets multicentriques
                  </h2>

                  <p className="text-muted-foreground leading-relaxed">
                    NOXIA intervient comme expertise indépendante en IRM et CT quantitative,
                    avec une approche orientée méthodologie, qualité des données et lisibilité
                    des choix analytiques.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    L'objectif est de transformer des données hétérogènes en livrables
                    exploitables, traçables et discutables scientifiquement.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {["CoreLab IRM/CT", "Audit méthodologique", "Analyse multicentrique", "Ingénierie d'analyse"].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <aside className="rounded-2xl border border-border bg-card/50 p-8 md:p-10 space-y-4 h-full">
                  <h3 className="text-xl font-semibold">Périmètre d'intervention</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <li>• Cadrage d'étude et structuration des endpoints d'imagerie</li>
                    <li>• Audit DICOM, harmonisation inter-site et contrôle qualité</li>
                    <li>• Reprise de pipelines et clarification des choix méthodologiques</li>
                    <li>• Livrables compatibles avec analyse statistique et publication</li>
                  </ul>
                </aside>
              </div>

              <section className="space-y-8">
                <h2 className="text-2xl font-semibold text-center">Choisir un point d'entrée</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {entryPoints.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article key={item.title} className="rounded-2xl border border-border bg-card/50 p-6 space-y-4 h-full">
                        <div className="inline-flex items-center gap-2 text-foreground font-semibold">
                          <Icon className="w-5 h-5 text-primary" />
                          {item.title}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                        <Link
                          to={item.to}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          {item.cta}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-8">
                <Link
                  to="/projets"
                  className="block group rounded-2xl overflow-hidden border border-border/50 bg-black transition hover:border-primary/40 hover:shadow-xl"
                >
                  <div className="aspect-[21/9] overflow-hidden">
                    <img
                      src={PROJECTS_BANNER_IMAGE}
                      alt="Projets en imagerie médicale quantitative : IRM, CT, corelab et biomarqueurs"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="bg-background p-8 md:p-10">
                    <h2 className="text-3xl font-semibold tracking-tight">
                      Projets & cas d'usage en imagerie quantitative
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-4xl">
                      IRM cardiaque et neuro, CT avancé, perfusion AVC, recalage longitudinal
                      et structuration méthodologique de bases multicentriques.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 text-primary font-medium">
                      Explorer les projets
                      <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </section>

              <section className="space-y-8">
                <h2 className="text-2xl font-semibold text-center">Cadre méthodologique</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {methodologicalPillars.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-xl border border-border bg-muted/20 p-6 space-y-3">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                          <Icon className="w-5 h-5 text-primary" />
                          {item.title}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 to-primary/5 p-8 md:p-10 space-y-5 text-center">
                <h2 className="text-2xl font-semibold">Un projet à cadrer ?</h2>
                <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Présentez votre contexte (modalité, type d'étude, niveau de maturité) pour
                  identifier le mode d'intervention le plus adapté.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                  >
                    Contacter NOXIA
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/a-propos"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                  >
                    Voir le parcours
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </section>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;
