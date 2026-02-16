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
  AlertTriangle,
  Layers,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/bases-multicentriques";

const BasesMulticentriques = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Harmonisation de bases multicentriques en imagerie médicale",
    description:
      "Structuration, harmonisation inter-constructeurs et contrôle méthodologique de bases multicentriques IRM et CT pour essais cliniques et projets translationnels.",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    url: CANONICAL,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Bases multicentriques", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi harmoniser une base multicentrique avant l'analyse ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce que la variabilité technique inter-centre peut dépasser l'effet biologique étudié. Sans harmonisation, les biomarqueurs risquent de refléter le centre plutôt que la physiopathologie.",
        },
      },
      {
        "@type": "Question",
        name: "Les données IRM et CT peuvent-elles être analysées ensemble sans normalisation ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Les différences de constructeurs, séquences, reconstructions et protocoles exigent une standardisation explicite avant toute comparaison statistique robuste.",
        },
      },
      {
        "@type": "Question",
        name: "Quels livrables garantit une harmonisation multicentrique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Une base structurée, des règles documentées, des logs de transformation, des tableaux exploitables pour biostatistique et un dossier QA traçable.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Bases multicentriques & Harmonisation IRM/CT | NOXIA</title>
        <meta
          name="description"
          content="Harmonisation inter-constructeurs (Siemens, GE, Philips), contrôle des séquences 1.5T/3T, normalisation DICOM et structuration multicentrique pour biomarqueurs reproductibles."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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
                { label: "Bases multicentriques" },
              ]}
            />

            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Harmonisation de bases multicentriques IRM et CT
                <span className="block text-primary mt-2">Données robustes avant biomarqueurs</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Maîtriser la variabilité inter-centres, inter-constructeurs et inter-protocoles
                pour produire des analyses quantitatives comparables, auditables et publiables.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Structurer une base multicentrique
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/analyse-dicom"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Voir l'analyse DICOM
                  <Database className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Reproductibilité
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Réduction de la variance technique centre-dépendante avant extraction des endpoints.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Workflow className="w-5 h-5 text-primary" />
                  Pipeline contrôlé
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Audit DICOM, normalisation, stratification et QA documentés de bout en bout.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-5 h-5 text-primary" />
                  Essais multicentriques
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Base unifiée, exploitable en biostatistique et conforme aux exigences Core Lab.
                </p>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Pourquoi l'harmonisation est méthodologiquement critique
              </h2>

              <p>
                Une base multicentrique agrège des acquisitions hétérogènes: constructeurs,
                champs (1.5T/3T), reconstructions CT, paramètres d'acquisition et versions logicielles.
                Sans contrôle explicite, la variabilité technique peut masquer l'effet biologique.
              </p>

              <p>
                Cette étape précède toute{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation IRM
                </Link>
                ,{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT
                </Link>{" "}
                ou extraction d'endpoint en{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  Core Lab
                </Link>
                .
              </p>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">Architecture d'harmonisation</h2>

              <div className="grid md:grid-cols-2 gap-6 items-stretch">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Workflow opérationnel
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Audit des métadonnées DICOM (géométrie, orientation, cohérence temporelle)</li>
                    <li>2. Qualification par centre, constructeur, protocole et version</li>
                    <li>3. Normalisation et règles d'exclusion documentées</li>
                    <li>4. Structuration patient/temps/séquence/reconstruction</li>
                    <li>5. Exports versionnés et auditables pour biostatistique</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Checklist qualité
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Vérification spacing/orientation/FOV inter-séries</li>
                    <li>Gestion explicite des reconstructions multiples</li>
                    <li>Traçabilité des corrections et des exclusions</li>
                    <li>Détection outliers centre-dépendants</li>
                    <li>Dossier QA par centre et par lot de données</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Spécificités par modalité
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">IRM multicentrique</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Stratification champ magnétique 1.5T / 3T</li>
                    <li>Harmonisation séquences (MOLLI, SASHA, etc.)</li>
                    <li>Contrôle normalisation intensité et biais</li>
                    <li>Gestion des différences de coils et protocoles</li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/irm-imagerie-quantitative"
                      className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Voir IRM quantitative <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">CT multicentrique</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Contrôle kernels et reconstructions itératives</li>
                    <li>Stabilité HU et calibration phantom</li>
                    <li>Gestion inter-constructeurs GE/Siemens/Philips</li>
                    <li>Harmonisation énergie et protocoles d'injection</li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/ct-imagerie-quantitative"
                      className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Voir CT quantitatif <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Repères chiffrés pratiques
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">IRM</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Variabilité inter-centre T1/T2: ordre de grandeur 2-6%</li>
                    <li>Écarts absolus ECV inter-centres: souvent 2-4%</li>
                    <li>Stratification 1.5T/3T indispensable sur analyses pooling</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">CT</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Écarts HU inter-scanner: souvent +/-5 à +/-10 HU selon kernel</li>
                    <li>Tolérance phantom eau cible fréquemment utilisée: +/-3 HU</li>
                    <li>Variabilité perfusion accrue sans harmonisation injection/reconstruction</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Risques si la base n'est pas harmonisée
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Biais centre-dépendants interprétés comme effet biologique</li>
                <li>Perte de puissance statistique et inflation des faux positifs</li>
                <li>Difficulté de reproductibilité inter-cohortes</li>
                <li>Retraitements coûteux tardifs en cours de projet</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Database className="w-5 h-5 text-primary" />
                Livrables opérationnels attendus
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Base harmonisée structurée patient/temps/modalité/séquence</li>
                <li>Tables analytiques prêtes pour biostatistique (CSV/Excel)</li>
                <li>Rapport QA centre par centre avec règles d'exclusion</li>
                <li>Historique versionné des transformations et paramètres</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Références & standards utiles</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Guides multicentriques de standardisation IRM et CT</li>
                <li>Recommandations de bonnes pratiques en quantitative imaging biomarkers</li>
                <li>Cadres QA/QC pour essais cliniques multicentriques</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Acronymes & livrables</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">QA / QC</div>
                  <p className="text-sm">Contrôles qualité d'entrée/sortie et traçabilité des exclusions.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">ICC / CV</div>
                  <p className="text-sm">Indices de reproductibilité inter-centre.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">DICOM / NIfTI</div>
                  <p className="text-sm">Format clinique source et format analytique contrôlé.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Core Lab</div>
                  <p className="text-sm">Cadre de centralisation lecture, règles et audit méthodologique.</p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes - Bases multicentriques
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Faut-il harmoniser avant ou après segmentation ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Avant. L'harmonisation sécurise la donnée source et évite de propager des biais.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Peut-on mélanger 1.5T et 3T sans stratification ?</h3>
                  <p className="text-muted-foreground mt-2">
                    C'est déconseillé. La stratification ou la modélisation explicite du champ est nécessaire.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold">Quels livrables facilitent un audit scientifique ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Des tables versionnées, des logs de transformation, des règles d'exclusion explicites
                    et un dossier QA par centre.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/analyse-dicom"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Analyse DICOM <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ingenierie-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Ingénierie quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Core Lab essais cliniques <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-6 pt-4">
              <p className="text-muted-foreground">
                Transformer une base hétérogène en socle analytique fiable exige un cadre
                méthodologique explicite, pas seulement un retraitement technique.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d'un projet multicentrique
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

export default BasesMulticentriques;
