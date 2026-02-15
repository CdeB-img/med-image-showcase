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
  Activity,
  Layers,
  Cpu
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/quantification-ct";

const QuantificationCT = () => {

  /* ================= JSON-LD ================= */

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Quantification CT multicentrique en recherche clinique",
    description:
      "Quantification CT avancée : biomarqueurs morphologiques, perfusion cérébrale, CT spectral, validation HU et harmonisation inter-constructeurs.",
    about: [
      "Computed Tomography quantitative biomarkers",
      "Hounsfield Units HU validation",
      "CT perfusion CBF CBV MTT Tmax",
      "Spectral CT monoenergetic reconstruction",
      "Photoelectric and Compton decomposition",
      "Multicenter CT harmonization"
    ],
    specialty: [
      "Radiology",
      "Cardiovascular imaging",
      "Neuroimaging",
      "Clinical research imaging"
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
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Quantification CT", item: CANONICAL }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Les valeurs HU sont-elles comparables entre constructeurs ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non strictement. Les kernels, reconstructions itératives et implémentations logicielles peuvent modifier la distribution HU. Une calibration et une harmonisation multicentrique sont nécessaires."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la variabilité en perfusion CT cérébrale ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "La littérature rapporte des variations inter-centre significatives sur CBF et Tmax si les paramètres d’injection et de reconstruction ne sont pas strictement contrôlés."
        }
      },
      {
        "@type": "Question",
        name: "Le CT spectral améliore-t-il la quantification ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui, en séparant composantes photoélectrique et Compton, il permet une meilleure caractérisation matière, mais nécessite une modélisation physique rigoureuse."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Quantification CT multicentrique & biomarqueurs robustes | NOXIA</title>
        <meta
          name="description"
          content="Quantification CT avancée : HU validés, perfusion cérébrale, CT spectral, harmonisation inter-constructeurs et architecture Core Lab."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-6xl mx-auto space-y-24">

            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Quantification CT" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Quantification CT multicentrique
                <span className="block text-primary mt-2">
                  Biomarqueurs fondés sur la physique, validés inter-constructeurs et opposables en recherche clinique                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transformation des voxels <strong>Hounsfield Units (HU)</strong> 
                en biomarqueurs reproductibles, intégrés dans une 
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  architecture DICOM contrôlée et audit multicentrique
                </Link>, 
                structurés pour la 
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  recherche multicentrique
                </Link>.
              </p>
            </section>
          
            {/* 3 BLOCS PREMIUM */}
            <section className="grid md:grid-cols-3 gap-6">

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Robustesse physique
                </div>
                <p className="text-sm text-muted-foreground">
                  Validation HU, calibration eau/air, contrôle kernel et reconstructions multiples, selon une approche alignée avec les principes de 
                  <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                    biomarqueur reproductible en IRM
                  </Link>.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Workflow className="w-5 h-5 text-primary" />
                  Architecture pipeline
                </div>
                <p className="text-sm text-muted-foreground">
                  Audit DICOM, segmentation contrôlée (voir 
                  <Link to="/segmentation-irm" className="text-primary hover:underline">
                    segmentation contrôlée et reproductible
                  </Link>), extraction métrique et versioning complet.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-5 h-5 text-primary" />
                  Harmonisation multicentrique
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestion inter-constructeurs, kernels, injection contraste et reconstructions itératives.
                </p>
              </div>

            </section>
            <section className="rounded-2xl border border-border bg-muted/20 p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Ce qui différencie une mesure CT d’un biomarqueur CT
              </h2>

              <div className="grid md:grid-cols-2 gap-8 text-muted-foreground text-sm leading-relaxed">

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Mesure technique
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Valeur HU brute</li>
                    <li>Volume segmenté visuellement</li>
                    <li>Carte perfusion sans contrôle injection</li>
                    <li>Absence d’audit kernel</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Biomarqueur robuste
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Calibration physique vérifiée</li>
                    <li>Segmentation documentée</li>
                    <li>Standardisation injection & reconstruction</li>
                    <li>Traçabilité pipeline & versioning</li>
                  </ul>
                </div>

              </div>
            </section>
            {/* AXES D’ANALYSE STRUCTURÉS */}
            <section className="space-y-10">
              <h2 className="text-3xl font-semibold text-center">
                Axes de quantification CT
              </h2>

              <div className="grid md:grid-cols-2 gap-8">

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Activity className="w-5 h-5 text-primary" />
                    Perfusion cérébrale
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>CBF / CBV / MTT / Tmax</li>
                    <li>Core / pénombre volumétrique</li>
                    <li>Contrôle cohérence temporelle</li>
                    <li>Gestion artefacts mouvement</li>
                  </ul>
                  <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary text-sm hover:underline">
                    Voir perfusion IRM →
                  </Link>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Cpu className="w-5 h-5 text-primary" />
                    CT spectral
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>Reconstruction mono-énergétique</li>
                    <li>Décomposition photoélectrique / Compton</li>
                    <li>Modélisation physique avancée</li>
                    <li>Optimisation contraste matière</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Layers className="w-5 h-5 text-primary" />
                    Analyse morphologique
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>Volumes multi-organes</li>
                    <li>Distribution HU intra-lésionnelle</li>
                    <li>Hétérogénéité volumique</li>
                    <li>Segmentation thorax complète</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Données littérature
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>Variabilité HU dépendante kernel</li>
                    <li>Perfusion CT sensible paramètres injection</li>
                    <li>Écarts inter-constructeurs documentés</li>
                    <li>Reproductibilité améliorée avec standardisation</li>
                  </ul>
                </div>

              </div>
            </section>
            <section className="rounded-2xl border border-border bg-muted/20 p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Données de reproductibilité rapportées
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Variabilité HU liée aux kernels : ±5–20 HU selon reconstruction</li>
                <li>Perfusion CT : variation inter-centre significative sans harmonisation injection</li>
                <li>Reconstructions itératives : modification distribution bruit & texture</li>
                <li>CT spectral : amélioration caractérisation matière sous conditions contrôlées</li>
              </ul>

              <p className="text-muted-foreground">
                Ces chiffres illustrent que la robustesse dépend davantage de la structuration méthodologique que de l’algorithme lui-même.
              </p>
            </section>
            {/* FAQ VISUELLE */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes – Quantification CT
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Les valeurs HU sont-elles strictement universelles ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Les kernels et reconstructions modifient la distribution HU.
                    Une calibration multicentrique est nécessaire.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    La perfusion CT est-elle robuste inter-centres ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Oui si paramètres injection, reconstruction et post-traitement sont standardisés.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Le CT spectral améliore-t-il la précision matière ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Oui, mais uniquement avec une modélisation physique explicite et validation.
                  </p>
                </div>

              </div>
            </section>
            <section className="space-y-6 text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration Core Lab CT.{" "}
                Approche cohérente avec la{" "}
                <Link
                  to="/irm-imagerie-quantitative"
                  className="text-primary hover:underline"
                >
                  structuration Core Lab IRM
                </Link>.
              </h2>

              <p className="text-muted-foreground max-w-3xl mx-auto">
                Centralisation DICOM, audit métadonnées, harmonisation kernel,
                calibration HU, standardisation injection contraste,
                extraction métrique versionnée et exports statistiques opposables.
              </p>

              <Link
                to="/bases-multicentriques"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
              >
                Harmonisation multicentrique →
              </Link>
            </section>
            <section className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
              <h2 className="text-xl font-semibold">
                Explorer les expertises associées
              </h2>

              <div className="flex flex-wrap gap-4 text-sm">
                <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                  IRM quantitative
                </Link>
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  Analyse DICOM
                </Link>
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Harmonisation multicentrique
                </Link>
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  Segmentation contrôlée
                </Link>
              </div>
            </section>
            {/* CTA */}
            <section className="text-center space-y-6">
              <p className="text-muted-foreground">
                La quantification CT robuste repose sur une architecture méthodologique explicite.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Discuter d’un projet CT
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

export default QuantificationCT;