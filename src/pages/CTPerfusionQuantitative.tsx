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
  Timer
} from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-perfusion-quantitative-avc";

const CTPerfusionQuantitative = () => {

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT Perfusion quantitative en AVC ischémique aigu",
    description:
      "Quantification robuste Tmax, CBF, CBV et mismatch en CT perfusion. Validation méthodologique, stabilité volumique, harmonisation multicentrique et endpoints d’essais thérapeutiques.",
    about: [
      "CT Perfusion",
      "Tmax ≥ 6 seconds",
      "CBF < 30 percent",
      "Cerebral Blood Flow",
      "Cerebral Blood Volume",
      "Ischemic core",
      "Penumbra",
      "Deconvolution SVD",
      "Acute ischemic stroke"
    ],
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
        name: "CT quantitative",
        item: "https://noxia-imagerie.fr/ct-imagerie-quantitative"
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "CT Perfusion AVC",
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
        name: "Le seuil Tmax ≥ 6 secondes est-il universel ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Tmax ≥ 6s est un seuil issu d’études pivot (EXTEND, DEFUSE) mais dépend du modèle de déconvolution, de l’AIF et du logiciel utilisé. Deux plateformes différentes peuvent générer des volumes divergents pour un même patient."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la variabilité inter-logiciels en CT perfusion ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "La littérature rapporte des différences volumétriques pouvant dépasser 20 à 40% selon les implémentations SVD, le lissage et les paramètres temporels. Sans harmonisation, le biomarqueur devient logiciel-dépendant."
        }
      },
      {
        "@type": "Question",
        name: "CBF < 30% correspond-il toujours au core ischémique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "CBF < 30% est utilisé comme approximation du core dans plusieurs essais, mais peut surestimer ou sous-estimer selon la qualité du bolus, la résolution temporelle et la méthode de normalisation."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>
          CT Perfusion AVC | Quantification Tmax ≥6s & CBF | NOXIA
        </title>

        <meta
          name="description"
          content="Quantification robuste Tmax ≥6s, CBF <30% et mismatch en CT perfusion AVC. Validation méthodologique, stabilité volumique inter-logiciels et harmonisation multicentrique."
        />

        <link rel="canonical" href={CANONICAL} />

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
                { label: "CT quantitative", path: "/ct-imagerie-quantitative" },
                { label: "CT Perfusion AVC" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT Perfusion quantitative en AVC ischémique aigu
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transformation des cartographies Tmax, CBF et CBV en
                biomarqueurs volumétriques reproductibles,
                exploitables en décision thérapeutique
                et essais multicentriques.
              </p>
            </section>

            {/* PROBLÈME STRUCTUREL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Tmax ≥ 6s et CBF &lt; 30% : des seuils historiques mais dépendants
              </h2>

              <p>
                Les essais pivot (DEFUSE 3, EXTEND-IA, SWIFT PRIME)
                ont popularisé les seuils Tmax ≥ 6 secondes
                et CBF &lt; 30% pour définir pénombre et core.
              </p>

              <p>
                Toutefois, des études comparatives inter-logiciels
                montrent des écarts volumétriques pouvant dépasser
                20 à 40% pour un même patient selon :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Modèle de déconvolution (standard SVD vs block-circulant)</li>
                <li>Choix et stabilité de l’AIF</li>
                <li>Filtrage spatial/temporal automatique</li>
                <li>Résolution temporelle réelle</li>
                <li>Lissage implémenté par le constructeur</li>
              </ul>

              <p>
                Un biomarqueur dépendant du logiciel n’est pas un biomarqueur physiopathologique.
              </p>
            </section>

            {/* RÉSULTATS CHIFFRÉS */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Résultats issus de la littérature
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <p>
                    Variabilité inter-logiciels : différences volumétriques
                    rapportées jusqu’à 30–50% selon implémentation.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <p>
                    Surestimation du core possible lorsque la résolution
                    temporelle est insuffisante ou le bolus sous-optimal.
                  </p>
                </div>

              </div>
            </section>

            {/* PIPELINE ROBUSTE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture d’un pipeline robuste
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit DICOM dynamique complet</li>
                <li>Contrôle bolus et cohérence temporelle</li>
                <li>Validation AIF</li>
                <li>Masque cérébral contrôlé</li>
                <li>Seuils versionnés</li>
                <li>Analyse multi-seuil (4–8s / 20–40%)</li>
                <li>Extraction volumique traçable</li>
              </ul>

              <p>
                L’objectif : stabilité volumique inter-centre et reproductibilité statistique.
              </p>
            </section>
            <section className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
              <h2 className="text-lg font-semibold">
                Ce qui distingue une approche quantitative
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Audit complet du DICOM dynamique</li>
                <li>Validation indépendante des seuils</li>
                <li>Analyse multi-seuil de stabilité volumique</li>
                <li>Comparaison inter-logiciels documentée</li>
              </ul>
            </section>
            {/* POINTS CLÉS */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Points méthodologiques clés
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <p className="mt-2">
                    Séparation stricte : visualisation ≠ quantification.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <Timer className="w-5 h-5 text-primary" />
                  <p className="mt-2">
                    Vérification systématique du bolus et de l’AIF.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <Layers className="w-5 h-5 text-primary" />
                  <p className="mt-2">
                    Analyse multi-seuil pour tester la stabilité volumique.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <Database className="w-5 h-5 text-primary" />
                  <p className="mt-2">
                    Harmonisation multicentrique documentée.
                  </p>
                </div>

              </div>
            </section>
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">
                Références & essais pivot
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>DEFUSE 3 Trial – Tmax ≥ 6s definition</li>
                <li>EXTEND-IA – Perfusion imaging selection</li>
                <li>SWIFT PRIME – Core volume thresholds</li>
                <li>Comparative inter-software variability studies (30–50%)</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed">
                Les pipelines sont alignés sur les recommandations internationales
                et les critères de sélection d’essais randomisés récents.
              </p>
            </section>
            {/* FAQ visible */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes (CT Perfusion AVC)
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Le seuil Tmax ≥ 6 secondes est-il universel ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Tmax ≥ 6s dépend du modèle de déconvolution,
                    du logiciel et de l’AIF. Deux plateformes peuvent produire
                    des volumes divergents pour un même patient.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Quelle est la variabilité inter-logiciels ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Des différences de 20 à 40% ont été rapportées
                    selon les implémentations.
                  </p>
                </div>

              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer ou auditer un pipeline CT perfusion multicentrique ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet AVC
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

export default CTPerfusionQuantitative;