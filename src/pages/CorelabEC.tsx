import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  ShieldCheck,
  Database,
  Workflow,
  BarChart3,
  Microscope,
  AlertTriangle,
  Layers
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/corelab-essais-cliniques";

const CorelabEC = () => {

  /* =========================
     JSON-LD — SERVICE
  ========================== */

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Core Lab IRM cardiovasculaire pour essais cliniques multicentriques",
    url: CANONICAL,
    areaServed: "Europe",
    serviceType: [
      "Cardiovascular MRI Core Lab",
      "Surrogate imaging endpoints",
      "Multicenter harmonization",
      "Late Gadolinium Enhancement quantification",
      "Microvascular Obstruction assessment",
      "Extracellular Volume validation",
      "Left Ventricular remodeling analysis"
    ],
    about: [
      "Cardiovascular Magnetic Resonance (CMR)",
      "Late Gadolinium Enhancement (LGE)",
      "Microvascular Obstruction (MVO)",
      "Extracellular Volume (ECV)",
      "Left Ventricular (LV) remodeling",
      "Multicenter randomized clinical trials"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    }
  };

  /* =========================
     JSON-LD — BREADCRUMB
  ========================== */

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Core Lab IRM cardiovasculaire", item: CANONICAL }
    ]
  };

  /* =========================
     JSON-LD — FAQ
  ========================== */

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi un Core Lab est-il indispensable en essai multicentrique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "En imagerie cardiovasculaire multicentrique, la variabilité technique peut dépasser l’effet traitement. Un Core Lab standardise acquisition, segmentation, seuils et contrôle qualité afin de réduire la dispersion statistique et sécuriser l’endpoint primaire."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la variabilité inter-observateur en IRM cardiaque ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Sans règles formalisées, la variabilité inter-observateur peut atteindre 5–15% sur LGE ou volumes ventriculaires. Une lecture centralisée harmonisée permet de réduire cette variabilité à environ 2–5% selon la littérature."
        }
      },
      {
        "@type": "Question",
        name: "Un biomarqueur IRM peut-il devenir endpoint primaire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui, à condition que sa reproductibilité, sa validité physiopathologique et sa stabilité multicentrique soient démontrées. LGE, MVO ou ECV peuvent devenir des surrogate endpoints robustes si le cadre méthodologique est strict."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>
          Core Lab IRM cardiovasculaire | Essais cliniques multicentriques | NOXIA
        </title>

        <meta
          name="description"
          content="Core Lab IRM cardiovasculaire pour essais randomisés multicentriques : structuration d’endpoints LGE, MVO, ECV et remodelage VG. Harmonisation inter-centre, réduction de variabilité et validation publication-ready."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(serviceJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqJsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">

            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Core Lab IRM cardiovasculaire" }
              ]}
            />

            {/* ================= HERO ================= */}

            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Core Lab IRM cardiovasculaire pour essais cliniques multicentriques
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Structuration d’endpoints IRM quantitatifs robustes
                (LGE, MVO, ECV, remodelage ventriculaire gauche),
                harmonisation inter-centre et validation physiopathologique.
                L’imagerie devient un <strong>surrogate endpoint défendable</strong>.
              </p>

              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Dans un contexte décisionnel (YMYL), la robustesse méthodologique
                prime sur la sophistication algorithmique.
                Un endpoint mal structuré peut compromettre la puissance statistique
                d’un essai randomisé.
              </p>
            </section>

            {/* ================= ENJEU ================= */}

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Transformer l’IRM en endpoint statistiquement robuste
              </h2>

              <p>
                En essai thérapeutique cardiovasculaire, l’effet traitement
                peut être inférieur à la variabilité technique inter-centre.
                Sans harmonisation stricte, l’endpoint perd sa sensibilité.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Définition explicite de l’endpoint primaire / secondaire</li>
                <li>Standardisation des règles de segmentation</li>
                <li>Formalisation des seuils (SD, FWHM, etc.)</li>
                <li>Lecture centralisée indépendante</li>
                <li>Traçabilité complète (versioning + QA)</li>
              </ul>
            </section>

            {/* ================= RESULTATS LITTERATURE ================= */}

            <section className="rounded-2xl border border-border bg-muted/10 p-8 space-y-6">
              <h2 className="text-2xl font-semibold">
                Résultats chiffrés issus de la littérature
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Variabilité inter-observateur LGE : 5–15% sans harmonisation</li>
                <li>Réduction à 2–5% avec lecture centralisée formalisée</li>
                <li>ECV corrélé à la fibrose histologique (r &gt; 0.6–0.8)</li>
                <li>MVO associée indépendamment au remodelage post-IDM</li>
                <li>Variation physiopathologique ECV souvent de 2–4% absolus</li>
                <li>Stratification 1.5T / 3T réduit la dispersion multicentrique</li>
              </ul>
            </section>

            {/* ================= ENDPOINTS ================= */}

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Endpoints cardiovasculaires structurants
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li><strong>LGE</strong> – nécrose myocardique</li>
                <li><strong>MVO</strong> – obstruction microvasculaire</li>
                <li><strong>Volumes ventriculaires & FEVG</strong></li>
                <li><strong>Remodelage VG longitudinal</strong></li>
                <li>
                  <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                    <strong>ECV</strong>
                  </Link>
                </li>
                <li><strong>T1 / T2 mapping</strong></li>
              </ul>
            </section>

            {/* ================= CE QUE CE N'EST PAS ================= */}

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Ce qu’un Core Lab n’est pas
              </h2>

              <p>
                Un Core Lab n’est ni une simple plateforme de post-traitement,
                ni une automatisation sans validation.
                Il s’agit d’une structuration méthodologique opposable en publication,
                audit ou soumission réglementaire.
              </p>
            </section>

            {/* ================= CTA ================= */}

            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un endpoint IRM multicentrique exige
                rigueur méthodologique, harmonisation technique
                et validation indépendante.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Échanger sur un projet d’essai
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CorelabEC;