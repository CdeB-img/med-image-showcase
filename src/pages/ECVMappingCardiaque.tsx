import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  ShieldCheck,
  Database,
  Workflow,
  Microscope,
  BarChart3,
  Droplets,
  Timer,
  Layers,
  AlertTriangle
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ecv-mapping-t1-t2-irm-cardiaque";

const ECVMappingCardiaque = () => {
  
  const jsonLd = {
    
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "ECV et Mapping T1/T2 en IRM cardiaque",
    description:
      "Validation, quantification et interprétation des biomarqueurs ECV, T1 natif et T2 mapping en IRM cardiaque. Approche méthodologique rigoureuse et validation translationnelle.",
    about: [
      "Extracellular Volume",
      "T1 mapping cardiac MRI",
      "T2 mapping cardiac MRI",
      "Diffuse fibrosis",
      "Myocardial edema",
      "Histological validation"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    url: CANONICAL
  };
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Accueil",
      item: "https://noxia-imagerie.fr/"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Expertise",
      item: "https://noxia-imagerie.fr/expertise"
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "IRM",
      item: "https://noxia-imagerie.fr/irm-imagerie-quantitative"
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "ECV & Mapping T1/T2",
      item: CANONICAL
    }

  ]
  
};
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Pourquoi l’ECV varie-t-il entre centres ?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Les différences de champ magnétique (1.5T vs 3T), de séquence (MOLLI, ShMOLLI, SASHA), de timing post-contraste et de gestion de l’hématocrite peuvent générer des écarts absolus supérieurs à 2–4%. Une harmonisation multicentrique documentée est indispensable."
      }
    },
    {
      "@type": "Question",
      name: "Un T1 natif élevé signifie-t-il toujours fibrose ?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Non. Le T1 natif peut refléter inflammation, œdème ou fibrose diffuse selon le contexte clinique et la séquence utilisée. L’interprétation nécessite une cohérence avec les autres biomarqueurs et les conditions d’acquisition."
      }
    },
    {
      "@type": "Question",
      name: "Le T2 mapping est-il spécifique de l’œdème myocardique ?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Le T2 mapping est sensible à l’œdème actif mais également aux artefacts de mouvement, au gating et aux paramètres d’acquisition. Un contrôle qualité strict et une standardisation inter-centre sont nécessaires."
      }
    }
  ]
};
  return (
    <>
      <Helmet>
        <title>ECV & Mapping T1/T2 en IRM cardiaque | NOXIA</title>

        <meta
          name="description"
          content="ECV, T1 natif et T2 mapping en IRM cardiaque : validation histologique, précision de l’hématocrite, sectorisation AHA, timing post-contraste et contrôle des biais méthodologiques."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="ECV & Mapping T1/T2 en IRM cardiaque | NOXIA" />
        <meta
          property="og:description"
          content="Biomarqueurs tissulaires IRM cardiaque : validation translationnelle et rigueur méthodologique."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(faqJsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "IRM", path: "/irm-imagerie-quantitative" },
                { label: "ECV & Mapping T1/T2" }
              ]}
            />
            {/* ================= HERO ================= */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                ECV & Mapping T1/T2 en IRM cardiaque
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Quantifier l’espace extracellulaire (ECV) et interpréter T1/T2
                n’est pas une question d’outil : c’est une question de
                <strong>conditions de mesure</strong>, de <strong>timing</strong>,
                de <strong>segmentation</strong> et de <strong>validation</strong>.
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Discuter d’une validation
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/biomarqueurs-irm-cardiaque-essais-cliniques"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Endpoints en essai clinique
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* ================= TL;DR ================= */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Droplets className="w-5 h-5 text-primary" />
                    Point critique ECV
                  </div>
                  <p className="text-muted-foreground">
                    L’ECV dépend directement de l’<strong>hématocrite</strong> et du <strong>timing</strong>.
                    Une valeur “approximée” induit un biais systématique.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Microscope className="w-5 h-5 text-primary" />
                    Ce que T1/T2 signifient
                  </div>
                  <p className="text-muted-foreground">
                    T1 natif : inflammation / fibrose diffuse (selon contexte). T2 : œdème actif.
                    Les confondre = interprétation physiopathologique fausse.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Ce qui rend la mesure robuste
                  </div>
                  <p className="text-muted-foreground">
                    Séquences homogènes, ROI maîtrisées, sectorisation AHA, QA, et harmonisation multicentrique documentée.
                  </p>
                </div>
              </div>
            </section>

            {/* ================= SENSIBILITE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Pourquoi ces biomarqueurs sont sensibles
              </h2>

              <p>
                L’ECV, le T1 natif et le T2 mapping sont des biomarqueurs tissulaires diffus.
                Ils sont donc plus sensibles aux conditions de mesure que des endpoints purement morphologiques.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Champ magnétique (1.5T vs 3T) : distributions et artefacts différents</li>
                <li>Constructeur / version logicielle : implémentations non équivalentes</li>
                <li>Paramétrage séquence (MOLLI, ShMOLLI, SASHA…) : biais systématiques possibles</li>
                <li>Timing post-contraste : impact direct sur T1 post et ECV</li>
                <li>ROI et segmentation : contamination sang, trabéculations, bord endo/épi</li>
              </ul>

              <p>
                Sans cadre méthodologique, la variabilité technique peut dépasser la variation physiopathologique recherchée.
              </p>
            </section>

            {/* ================= ECV VALIDATION ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                ECV : validation translationnelle et précision méthodologique
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Workflow className="w-5 h-5 text-primary" />
                    Chaîne ECV “propre”
                  </div>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Prélèvement sanguin au bon moment (proche injection)</li>
                    <li>Mesure fiable de l’hématocrite (et traçabilité)</li>
                    <li>Timing post-contraste documenté</li>
                    <li>Règles ROI : myocardium (AHA), sang, exclusions artefacts</li>
                    <li>Export des valeurs sources + versions + QA</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Timer className="w-5 h-5 text-primary" />
                    Erreurs classiques (et coûteuses)
                  </div>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Hématocrite “récupéré” trop tard / non comparable</li>
                    <li>Décantation / hydratation non considérées</li>
                    <li>Timing post non contrôlé → ECV centre-dépendant</li>
                    <li>ROI contaminées (sang, graisse, artefacts) → biais</li>
                    <li>Comparaison inter-centre sans stratification / QA</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      ECV : objectif scientifique
                    </h3>
                    <p>
                      Obtenir un biomarqueur exploitable statistiquement (et défendable),
                      avec distributions stables, biais documentés, et une logique de validation
                      (corrélations, cohérence physiopathologique, stabilité).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= T1 VS T2 ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Distinction critique : T1 vs T2
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">
                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">T1 natif</h3>
                      <p>
                        Sensible à l’inflammation / fibrose diffuse selon contexte,
                        fortement dépendant des séquences et du champ.
                        La reproductibilité dépend autant de l’acquisition que de la segmentation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Microscope className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">T2 mapping</h3>
                      <p>
                        Marqueur d’œdème actif. Sensible aux mouvements, au gating,
                        et aux choix de ROI. La comparabilité inter-centre nécessite un QA strict.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Point méthodologique non négociable
                    </h3>
                    <p>
                      Les interprétations (inflammation, fibrose, œdème) doivent être
                      alignées sur : séquence, timing, qualité image, règles ROI,
                      et comparabilité inter-centre. Sinon, on “sur-interprète” une variabilité technique.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= MULTICENTRIQUE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration multicentrique et robustesse
              </h2>

              <p>
                L’harmonisation n’est pas un slogan : c’est un ensemble de décisions
                (audit, exclusions, stratification, normalisation, QA) documentées et opposables.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit DICOM et contrôle des paramètres critiques</li>
                <li>Détection des examens incomplets / doublons / protocol drift</li>
                <li>Stratification 1.5T vs 3T si nécessaire</li>
                <li>Standardisation des exports et des règles ROI</li>
                <li>QA reproductible (checks + revue ciblée)</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques & harmonisation
                </Link>{" "}
                et{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  Analyse DICOM
                </Link>.
              </p>
            </section>
            {/* POINTS MÉTHODOLOGIQUES CLÉS */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Points méthodologiques clés
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Hématocrite mesuré et traçable
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    L’ECV est directement dépendant de l’hématocrite. Toute valeur non documentée
                    introduit un biais systématique difficilement récupérable.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Timer className="w-5 h-5 text-primary" />
                    Timing post-contraste standardisé
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    La reproductibilité multicentrique impose une fenêtre temporelle
                    définie et documentée après injection.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="w-5 h-5 text-primary" />
                    ROI anatomiquement cohérentes
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Exclusion sang, graisse, artefacts et trabéculations.
                    Sectorisation AHA lorsque nécessaire.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    Stratification inter-centre
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Analyse séparée 1.5T / 3T et constructeur si besoin,
                    afin d’éviter une dilution statistique des effets biologiques.
                  </p>
                </div>

              </div>
            </section>
            {/* ================= PAGES LIEES ================= */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages liées</h2>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/biomarqueurs-irm-cardiaque-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Biomarqueurs & Endpoints d’essais
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Core Lab IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/irm-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  IRM quantitative
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/methodologie-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Méthodologie quantitative
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
            {/* FAQ TECHNIQUE */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes (ECV / T1 / T2)
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi l’ECV varie-t-il entre centres ?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Les différences de champ magnétique, séquence (MOLLI, ShMOLLI, SASHA),
                    timing post-contraste et gestion de l’hématocrite
                    peuvent générer des écarts supérieurs à 2–4% absolus.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    T1 natif élevé = fibrose ?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Pas systématiquement. Le T1 natif reflète plusieurs phénomènes
                    (inflammation, œdème, fibrose diffuse).
                    L’interprétation dépend du contexte clinique et des autres séquences.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Le T2 mapping est-il spécifique de l’œdème ?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Il est sensible à l’œdème actif mais également aux artefacts
                    de mouvement et aux paramètres d’acquisition.
                    Un contrôle qualité strict est indispensable.
                  </p>
                </div>

              </div>
            </section>
            {/* RÉFÉRENCES & CONSENSUS */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">
                Références & consensus internationaux
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>SCMR Recommendations for T1 and T2 Mapping (standardization)</li>
                <li>Consensus statements on ECV measurement reproducibility</li>
                <li>AHA 17-segment myocardial model</li>
                <li>Position papers on quantitative CMR in clinical trials</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed">
                Les pipelines sont alignés avec les recommandations
                des sociétés savantes internationales et les exigences
                de publication multicentrique.
              </p>
            </section>
            {/* ================= CTA FINAL ================= */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’une validation ECV/T1/T2 ou d’une harmonisation multicentrique exploitable en essai ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter du projet
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

export default ECVMappingCardiaque;