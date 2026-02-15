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
  Layers,
  Microscope,
  AlertTriangle
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/corelab-essais-cliniques";

const CorelabEC = () => {

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Core Lab IRM cardiovasculaire pour essais cliniques multicentriques",
    url: CANONICAL,
    areaServed: "Europe",
    serviceType: [
      "Cardiovascular MRI Core Lab",
      "Imaging surrogate endpoints",
      "Multicenter harmonization",
      "ECV validation",
      "Late Gadolinium Enhancement quantification",
      "Microvascular Obstruction assessment",
      "Left Ventricular remodeling analysis"
    ],
    about: [
      "Cardiovascular Magnetic Resonance (CMR)",
      "Late Gadolinium Enhancement (LGE)",
      "Microvascular Obstruction (MVO)",
      "Extracellular Volume (ECV)",
      "Left Ventricular (LV) remodeling",
      "Multicenter clinical trials imaging"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Core Lab IRM essais cliniques", item: CANONICAL }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi un Core Lab est-il indispensable en essai multicentrique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La variabilité inter-centre peut dépasser l’effet traitement. Un Core Lab standardise acquisition, segmentation, seuils et exports afin de réduire la dispersion statistique et sécuriser l’endpoint primaire."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la variabilité inter-observateur en IRM cardiaque ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Selon la littérature, la variabilité peut atteindre 5–15% sur volumes ventriculaires et LGE si les règles ne sont pas formalisées. Une lecture centralisée harmonisée permet de réduire cette variabilité à 2–5%."
        }
      },
      {
        "@type": "Question",
        name: "Un biomarqueur IRM peut-il servir d’endpoint primaire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, à condition que sa reproductibilité, sa validité physiopathologique et sa stabilité multicentrique soient démontrées. L’ECV, le LGE ou la MVO peuvent devenir des surrogate endpoints robustes si le cadre méthodologique est strict."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Core Lab IRM cardiovasculaire pour essais cliniques multicentriques | NOXIA</title>
        <meta
          name="description"
          content="Core Lab IRM cardiovasculaire pour essais randomisés : structuration d’endpoints LGE, MVO, ECV, remodelage VG. Harmonisation multicentrique et validation méthodologique publication-ready."
        />
        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">

            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Core Lab IRM essais cliniques" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Core Lab IRM cardiovasculaire pour essais cliniques multicentriques
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Structuration d’endpoints IRM quantitatifs robustes (LGE, MVO, ECV, remodelage VG),
                harmonisation inter-centre et validation physiopathologique.
                L’imagerie devient un <strong>surrogate endpoint défendable</strong>.
              </p>
            </section>

            {/* ENJEU STRATEGIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                L’IRM comme endpoint primaire ou secondaire robuste
              </h2>

              <p>
                En essai thérapeutique cardiovasculaire, l’effet traitement
                peut être inférieur à la variabilité technique.
                Sans harmonisation stricte, l’endpoint perd sa puissance statistique.
              </p>

              <p>
                Le rôle du Core Lab :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Définition explicite de l’endpoint (primaire / secondaire)</li>
                <li>Standardisation des règles de segmentation</li>
                <li>Formalisation des seuils (SD, FWHM, etc.)</li>
                <li>Contrôle inter-centre et inter-constructeur</li>
                <li>Traçabilité complète (versioning + QA)</li>
              </ul>
            </section>

            {/* RESULTATS LITTERATURE */}
            <section className="rounded-2xl border border-border bg-muted/10 p-8 space-y-6">
              <h2 className="text-2xl font-semibold">
                Résultats chiffrés issus de la littérature
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Variabilité inter-observateur LGE : 5–15% sans harmonisation</li>
                <li>Réduction à 2–5% avec lecture centralisée et règles formalisées</li>
                <li>ECV corrélé à la fibrose histologique (r &gt; 0.6–0.8 selon cohortes)</li>
                <li>La MVO est associée indépendamment au remodelage et au pronostic post-IDM</li>
                <li>Stratification 1.5T / 3T réduit la dispersion multicentrique</li>
              </ul>
            </section>

            {/* ENDPOINTS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Endpoints cardiovasculaires structurants
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li><strong>LGE</strong> (Late Gadolinium Enhancement) – nécrose myocardique</li>
                <li><strong>MVO</strong> (Microvascular Obstruction)</li>
                <li><strong>Volumes ventriculaires & FEVG</strong></li>
                <li><strong>Remodelage VG longitudinal</strong></li>
                <li><strong>ECV</strong> (Extracellular Volume)</li>
                <li><strong>T1 / T2 mapping</strong></li>
              </ul>
            </section>

            {/* POINTS CLES */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Points méthodologiques clés</h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="rounded-xl border border-border p-6 bg-muted/10">
                  <div className="flex items-center gap-2 font-semibold">
                    <Workflow className="w-5 h-5 text-primary" />
                    Lecture centralisée indépendante
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Réduction des biais locaux et homogénéisation des décisions.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-6 bg-muted/10">
                  <div className="flex items-center gap-2 font-semibold">
                    <Database className="w-5 h-5 text-primary" />
                    Audit DICOM exhaustif
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Contrôle des reconstructions multiples, spacing, orientation.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-6 bg-muted/10">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Règles ROI formalisées
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Exclusions artefacts, sectorisation AHA, cohérence anatomique.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-6 bg-muted/10">
                  <div className="flex items-center gap-2 font-semibold">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    QA statistique
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Analyse des distributions, détection d’outliers centre-dépendants.
                  </p>
                </div>

              </div>
            </section>

            {/* REFERENCES */}
            <section className="rounded-2xl border border-border bg-muted/10 p-8 space-y-4">
              <h2 className="text-xl font-semibold">
                Références & consensus internationaux
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>SCMR Guidelines for CMR standardization</li>
                <li>AHA 17-segment myocardial model</li>
                <li>Consensus statements on quantitative CMR in clinical trials</li>
                <li>Position papers on surrogate imaging endpoints</li>
              </ul>
            </section>

            {/* FAQ */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Pourquoi un Core Lab réduit-il la variabilité ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Parce qu’il impose une uniformisation des règles de segmentation,
                    des seuils, des exports et du contrôle qualité sur l’ensemble des centres.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Un endpoint IRM peut-il remplacer un endpoint clinique ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Il peut servir de surrogate endpoint si sa validité physiopathologique
                    et sa robustesse multicentrique sont démontrées.
                  </p>
                </div>

              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un endpoint IRM multicentrique exige
                rigueur méthodologique et validation indépendante.
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