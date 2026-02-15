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
  Brain,
  Heart,
  Layers
} from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/irm-imagerie-quantitative";

const IRMImagerieQuantitative = () => {

  /* =========================
     JSON-LD – PAGE PRINCIPALE
  ========================== */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "IRM quantitative en recherche clinique multicentrique",
  description:
    "IRM quantitative en cardiologie et neuro-imagerie : segmentation contrôlée, mapping T1/T2, ECV, perfusion cérébrale, harmonisation multicentrique et structuration Core Lab.",
  about: [
    "Cardiac MRI quantitative biomarkers",
    "Late Gadolinium Enhancement LGE",
    "Extracellular Volume ECV",
    "T1 mapping",
    "T2 mapping",
    "Cerebral perfusion MRI",
    "DICOM harmonization",
    "Multicenter imaging reproducibility"
  ],
  specialty: [
    "Cardiology",
    "Neuroradiology",
    "Clinical research imaging"
  ],
  keywords:
    "IRM quantitative, LGE, ECV, T1 mapping, T2 mapping, perfusion cérébrale, DICOM multicentrique",
  medicalAudience: {
    "@type": "MedicalAudience",
    audienceType: "Researchers"
  },
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
        name: "IRM quantitative",
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
        name: "Quelle est la variabilité inter-observateur en IRM quantitative ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Selon la littérature en IRM cardiaque, la variabilité inter-reader peut atteindre 5 à 15% sur les volumes myocardiques et davantage sur la quantification LGE. Des pipelines semi-automatisés validés permettent de réduire cette variabilité vers 1 à 3% dans des conditions contrôlées."
        }
      },
      {
        "@type": "Question",
        name: "Les valeurs T1 et T2 sont-elles comparables entre centres ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Les valeurs T1 et T2 dépendent du champ magnétique (1.5T vs 3T), du constructeur, de la séquence (MOLLI, ShMOLLI, SASHA) et du post-traitement. Une harmonisation multicentrique est indispensable pour éviter des biais supérieurs à la variation biologique étudiée."
        }
      },
      {
        "@type": "Question",
        name: "Un algorithme IA suffit-il pour produire un biomarqueur IRM publiable ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. L’inférence algorithmique doit être intégrée dans une architecture comprenant audit DICOM, segmentation contrôlée, validation quantitative, traçabilité des paramètres et analyse de robustesse inter-centre."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>IRM quantitative multicentrique & biomarqueurs reproductibles | NOXIA</title>

        <meta
          name="description"
          content="IRM quantitative en cardiologie et neuro-imagerie : LGE, ECV, T1/T2 mapping, perfusion cérébrale, harmonisation multicentrique et structuration Core Lab."
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
          <div className="max-w-5xl mx-auto space-y-20">

            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "IRM quantitative" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                IRM quantitative multicentrique : biomarqueurs reproductibles en cardiologie et neuro-imagerie
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transformation du signal IRM en biomarqueurs mesurables,
                reproductibles et physiopathologiquement cohérents,
                en cardiologie et neuro-imagerie.
              </p>
            </section>

            {/* POSITIONNEMENT CENTRAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du contraste visuel au biomarqueur statistiquement exploitable
              </h2>

              <p>
                Un hypersignal ne constitue pas un biomarqueur.
                Un biomarqueur IRM exige définition métrique explicite,
                segmentation contrôlée, validation quantitative et harmonisation multicentrique.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Définition précise de la métrique (ml, %, ratio, mapping)</li>
                <li>Séparation visualisation / segmentation / quantification</li>
                <li>Contrôle DICOM (spacing, orientation, métadonnées)</li>
                <li>Analyse de reproductibilité (ICC, Dice)</li>
                <li>Traçabilité et versioning pipeline</li>
              </ul>
            </section>
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture Core Lab IRM quantitative
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit initial DICOM multicentrique</li>
                <li>Définition des règles de segmentation</li>
                <li>Versioning pipeline & traçabilité</li>
                <li>Contrôle qualité systématique</li>
                <li>Exports statistiquement exploitables</li>
              </ul>

              <p>
                L’objectif n’est pas de produire une valeur,
                mais de produire une valeur opposable.
              </p>
            </section>
            {/* IRM CARDIAQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                IRM cardiaque quantitative
              </h2>

              <p>
                En cardiologie interventionnelle et essais randomisés,
                l’IRM constitue un surrogate endpoint reconnu.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>LGE (Late Gadolinium Enhancement) – quantification nécrose</li>
                <li>MVO – Microvascular Obstruction</li>
                <li>Volumes VG & fraction d’éjection</li>
                <li>ECV (Extracellular Volume)</li>
                <li>T1 mapping natif (fibrose diffuse)</li>
                <li>T2 mapping (œdème actif)</li>
              </ul>

              <p>
                Variabilité inter-observateur rapportée : 5–15% selon méthode.
                Pipelines semi-automatisés validés : réduction vers 1–3%.
              </p>
            </section>

            {/* NEURO */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                IRM cérébrale quantitative et perfusion
              </h2>

              <p>
                En neuro-imagerie, la variabilité technique peut dépasser
                l’effet physiopathologique si la structuration n’est pas explicite.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Cartes CBF, Tmax, OEF, CMRO₂</li>
                <li>Normalisation hémisphérique miroir</li>
                <li>Définition explicite du core diffusion</li>
                <li>Propagation volumique 3D contrôlée</li>
                <li>Analyse multi-seuils pour robustesse statistique</li>
              </ul>
            </section>

            {/* HARMONISATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Variabilité technique et harmonisation multicentrique
              </h2>

              <p>
                Les valeurs T1, T2 ou ECV peuvent varier de 2–4% absolus
                entre centres uniquement en raison du champ magnétique
                ou de la séquence utilisée.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>1.5T vs 3T</li>
                <li>Constructeur (Siemens / GE / Philips)</li>
                <li>Implémentation MOLLI vs SASHA</li>
                <li>Timing post-contraste</li>
              </ul>

              <p>
                Sans harmonisation, la variabilité technique peut dépasser
                la variation biologique recherchée.
              </p>
            </section>

            {/* FAQ VISUELLE */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes – IRM quantitative
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Quelle est la variabilité inter-observateur ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    5–15% rapportés dans la littérature selon séquence.
                    Réduction possible vers 1–3% avec pipeline contrôlé.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Les valeurs T1/T2 sont-elles comparables entre centres ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non sans harmonisation. Les différences de champ,
                    constructeur et séquence peuvent induire
                    des écarts supérieurs à l’effet biologique étudié.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    L’IA suffit-elle pour un biomarqueur publiable ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Elle doit être intégrée dans une architecture
                    validée, auditée et traçable.
                  </p>
                </div>

              </div>
            </section>
            {/* DONNÉES ISSUES DE LA LITTÉRATURE */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Données de reproductibilité rapportées dans la littérature
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>LGE : variabilité inter-observateur 5–15% selon méthode</li>
                <li>T1 mapping : coefficient de variation inter-centre 2–6%</li>
                <li>ECV : variations absolues 2–4% liées au champ et séquence</li>
                <li>Volumes ventriculaires : ICC souvent supérieurs 0.9 en conditions contrôlées</li>
              </ul>

              <p className="text-muted-foreground">
                Ces chiffres illustrent que la robustesse dépend davantage
                de la structuration méthodologique que de l’algorithme lui-même.
              </p>
            </section>
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">
                Références & consensus internationaux
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>SCMR Recommendations for T1 and T2 Mapping</li>
                <li>Consensus statements on ECV reproducibility</li>
                <li>AHA 17-segment myocardial model</li>
                <li>Guidelines for quantitative MRI in clinical trials</li>
              </ul>
            </section>
            {/* CTA FINAL */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                L’IRM quantitative exige une architecture méthodologique explicite.
                La robustesse du biomarqueur précède l’algorithme.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Discuter d’un projet IRM
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

export default IRMImagerieQuantitative;