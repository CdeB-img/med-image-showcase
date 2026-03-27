import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
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
    about: [
      "Oxygen Extraction Fraction",
      "CMRO2 MRI",
      "CBF MRI",
      "Tmax perfusion MRI",
      "Ischemic stroke imaging",
      "Diffusion perfusion mismatch"
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
          Perfusion neuro IRM: OEF, CMRO2 et biomarqueurs AVC | NOXIA
        </title>

        <meta
          name="description"
          content="Perfusion neuro IRM quantitative en AVC: OEF, CMRO2, CBF, Tmax, harmonisation multicentrique et validation méthodologique des biomarqueurs cliniques."
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
                { label: "IRM", path: "/irm-imagerie-quantitative" },
                { label: "Perfusion & Métabolisme cérébral" }
              ]}
            />

            {/* HERO */}
            <ExpertiseHero
              badge="Neuro-imagerie quantitative"
              badgeIcon={Brain}
              title="Quantification de la perfusion et du métabolisme cérébral en IRM (OEF, CMRO2, CBF, Tmax) dans l’AVC ischémique"
              description="Structuration algorithmique et validation multicentrique des biomarqueurs OEF, CMRO₂, CBF et Tmax dans l’AVC ischémique et la recherche neurovasculaire."
              chips={["OEF/CMRO2", "AVC ischémique", "Multicentrique"]}
              actions={[
                { label: "Échanger sur un protocole", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir IRM quantitative", to: "/irm-imagerie-quantitative", variant: "secondary", icon: Database },
                { label: "Voir focus OEF", to: "/oef-imagerie-cerebrale", variant: "secondary", icon: ArrowRight },
                { label: "Voir focus CMRO2", to: "/cmro2-imagerie-cerebrale", variant: "secondary", icon: ArrowRight },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Réponse courte
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                La perfusion neuro IRM quantitative mesure le déséquilibre entre débit et métabolisme dans l’AVC, via des indicateurs comme OEF, CMRO2, CBF et Tmax. En pratique, ces cartes n’ont de valeur clinique que si le pipeline de normalisation, de segmentation et de QA est explicite. L’objectif est de produire des biomarqueurs comparables entre centres, et pas seulement des visualisations physiologiques.
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
                  <Link
                    to="/cmro2-imagerie-cerebrale"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-3"
                  >
                    Ouvrir le focus CMRO2
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/oef-imagerie-cerebrale"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-2"
                  >
                    Ouvrir le focus OEF
                    <ArrowRight className="w-4 h-4" />
                  </Link>
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
                relativement à l’hémisphère controlatéral, avec une lecture croisée entre{" "}
                <Link to="/oef-imagerie-cerebrale" className="text-primary hover:underline">
                  OEF
                </Link>{" "}
                et{" "}
                <Link to="/cmro2-imagerie-cerebrale" className="text-primary hover:underline">
                  CMRO2
                </Link>.
              </p>

              <p>
                Cliniquement, le même principe que la{" "}
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                  CT perfusion quantitative
                </Link>{" "}
                s’applique : séparer l’information utile du bruit technique, puis documenter la robustesse selon un cadre{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologique reproductible
                </Link>.
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

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Focus biomarqueur : CMRO2
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Le CMRO2 merite une lecture dédiée car il ne se confond ni avec le debit, ni avec l'extraction.
                Son interpretation depend du couple OEF/CBF, du contexte de reperfusion et du pipeline de normalisation.
              </p>

              <Link
                to="/cmro2-imagerie-cerebrale"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Voir la page dédiée au CMRO2
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                OEF vs CMRO2 : ce qu’on mesure réellement
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">OEF (extraction)</div>
                  <p className="text-sm text-muted-foreground">
                    L’OEF décrit la part d’oxygène extraite quand la perfusion baisse. Une hausse peut refléter une compensation, sans garantir que le métabolisme global soit préservé.
                  </p>
                  <Link to="/oef-imagerie-cerebrale" className="text-primary text-sm hover:underline">
                    Voir le détail OEF →
                  </Link>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">CMRO2 (consommation)</div>
                  <p className="text-sm text-muted-foreground">
                    Le CMRO2 cherche à approcher la consommation réelle d’oxygène du tissu. Sa baisse signe plus directement un échec énergétique et une viabilité réduite.
                  </p>
                  <Link to="/cmro2-imagerie-cerebrale" className="text-primary text-sm hover:underline">
                    Voir le détail CMRO2 →
                  </Link>
                </div>
              </div>

              <p>
                L’interprétation la plus robuste repose sur une lecture conjointe OEF/CMRO2/CBF/Tmax, dans le cadre global de l’
                <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                  IRM quantitative
                </Link>.
              </p>
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
            {/* DONNÉES ISSUES DE LA LITTÉRATURE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Données issues des essais cliniques
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>DEFUSE 3 : sélection basée sur mismatch perfusion-diffusion</li>
                <li>DAWN : extension fenêtre thrombectomie jusqu’à 24h</li>
                <li>Tmax ≥ 6s : corrélé au volume hypoperfusé critique</li>
                <li>Variabilité inter-centre documentée supérieure 15% sans harmonisation</li>
              </ul>

              <p>
                La robustesse volumétrique dépend directement de la normalisation,
                du traitement du bruit et de la cohérence anatomique 3D.
              </p>
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

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>

              <div className="flex flex-wrap gap-3">
                <Link to="/cmro2-imagerie-cerebrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CMRO2 cérébral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/oef-imagerie-cerebrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  OEF cérébral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ct-perfusion-quantitative-avc" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT Perfusion AVC <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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
