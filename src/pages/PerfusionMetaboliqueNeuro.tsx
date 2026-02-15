import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  Brain,
  Workflow,
  BarChart3,
  ShieldCheck,
  Layers,
  Database,
  AlertTriangle
} from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/perfusion-metabolique-neuro-imagerie";

const PerfusionMetaboliqueNeuro = () => {

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Perfusion et métabolisme cérébral en IRM quantitative",
    description:
      "Quantification OEF, CMRO2, CBF et Tmax en IRM cérébrale. Pipeline physiopathologique, normalisation hémisphérique, hystérésis 3D et harmonisation multicentrique.",
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
        name: "Neuro-imagerie",
        item: "https://noxia-imagerie.fr/irm-imagerie-quantitative"
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Perfusion & Métabolisme cérébral",
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
        name: "Pourquoi les cartes OEF ou CMRO2 ne sont-elles pas directement des biomarqueurs ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Les cartes métaboliques sont des distributions continues issues de modèles physiologiques complexes. Sans normalisation intra-sujet, segmentation cohérente et validation multicentrique, elles restent des visualisations et non des endpoints quantitatifs robustes."
        }
      },
      {
        "@type": "Question",
        name: "La normalisation hémisphérique est-elle indispensable ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui. Les valeurs absolues OEF et CMRO2 varient selon constructeur, séquence et calibration. Une référence controlatérale intra-sujet réduit la variabilité inter-centre et stabilise les distributions statistiques."
        }
      },
      {
        "@type": "Question",
        name: "Pourquoi utiliser une hystérésis 3D plutôt qu’un simple seuil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Un seuil isolé fragmente la pénombre et amplifie le bruit. L’hystérésis 3D permet une propagation contrôlée depuis le core diffusionnel, assurant cohérence anatomique et stabilité volumétrique."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>
          Perfusion & Métabolisme cérébral IRM (OEF, CMRO2, CBF, Tmax) | NOXIA
        </title>

        <meta
          name="description"
          content="Quantification OEF, CMRO2, CBF et Tmax en IRM cérébrale. Pipeline physiopathologique, normalisation hémisphérique, hystérésis 3D et harmonisation multicentrique."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
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
          <div className="max-w-5xl mx-auto space-y-16">

            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Neuro-imagerie", path: "/irm-imagerie-quantitative" },
                { label: "Perfusion & Métabolisme cérébral" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Perfusion & Métabolisme cérébral en IRM quantitative
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Structuration algorithmique et validation multicentrique
                des biomarqueurs OEF, CMRO₂, CBF et Tmax
                dans l’AVC ischémique et la recherche neurovasculaire.
              </p>
            </section>

            {/* TL;DR */}
            <section className="rounded-2xl border border-border bg-muted/10 p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Brain className="w-5 h-5 text-primary" />
                    Ce que l’on quantifie
                  </div>
                  <p className="text-muted-foreground mt-2">
                    OEF pathologique, CMRO2 altéré, volumes Tmax,
                    mismatch diffusion / métabolisme.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Workflow className="w-5 h-5 text-primary" />
                    Ce qui fait la différence
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Normalisation hémisphérique robuste,
                    hystérésis 3D et validation multi-seuil.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Objectif final
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Transformer une cartographie physiologique
                    en biomarqueur exploitable et défendable.
                  </p>
                </div>
              </div>
            </section>

            {/* ARCHITECTURE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture physiopathologique du pipeline
              </h2>

              <p>
                La diffusion définit le noyau ischémique (D_core),
                servant d’ancrage anatomique.
                Les cartes métaboliques sont ensuite analysées
                relativement à l’hémisphère controlatéral.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Calcul miroir hémisphérique intra-sujet</li>
                <li>Normalisation médiane + IQR</li>
                <li>Détection multi-seuil (60–250%)</li>
                <li>Propagation 3D contrôlée</li>
                <li>Filtrage morphologique multi-échelle</li>
              </ul>
            </section>

            {/* POINTS MÉTHODOLOGIQUES */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Points méthodologiques clés
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <div className="flex items-center gap-2 font-semibold">
                    <Layers className="w-5 h-5 text-primary" />
                    Normalisation intra-sujet
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Réduction de la variabilité inter-centre
                    via référence controlatérale.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <div className="flex items-center gap-2 font-semibold">
                    <Database className="w-5 h-5 text-primary" />
                    Multi-seuil & stabilité
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Analyse de sensibilité volumétrique
                    aux variations de paramètres.
                  </p>
                </div>

              </div>
            </section>

            {/* FAQ */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi les cartes OEF ne sont-elles pas directement exploitables ?
                  </h3>
                  <p className="text-muted-foreground">
                    Sans normalisation et segmentation cohérente,
                    elles restent des visualisations continues
                    et non des endpoints volumétriques robustes.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    Un simple seuil Tmax ≥ 6s suffit-il ?
                  </h3>
                  <p className="text-muted-foreground">
                    Non. L’analyse volumétrique doit intégrer cohérence 3D,
                    bruit, artefacts et relation avec la diffusion.
                  </p>
                </div>

              </div>
            </section>

            {/* RÉFÉRENCES */}
            <section className="rounded-2xl border border-border bg-muted/10 p-8">
              <h2 className="text-xl font-semibold">
                Références & consensus
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>DEFUSE / DAWN – critères mismatch perfusion-diffusion</li>
                <li>Consensus sur Tmax ≥ 6s en sélection thrombectomie</li>
                <li>Recommandations sur biomarqueurs métaboliques expérimentaux</li>
              </ul>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un biomarqueur métabolique robuste
                exige une architecture explicite et reproductible.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground"
              >
                Discuter d’un projet neurovasculaire
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

export default PerfusionMetaboliqueNeuro;