import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Database,
  Workflow,
  ShieldCheck,
  BarChart3,
  Microscope,
  ArrowRight,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/corelab-essais-cliniques";

const CorelabEC = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Core Lab IRM cardiovasculaire pour essais cliniques",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    serviceType: [
      "Cardiovascular MRI Core Lab",
      "Imaging surrogate endpoints",
      "Multicenter imaging harmonization",
      "ECV validation",
      "Microvascular Obstruction quantification",
      "Left Ventricular remodeling assessment",
      "Randomized controlled trial imaging analysis"
    ],
    description:
      "Core Lab IRM cardiovasculaire pour essais randomisés multicentriques : définition d’endpoints quantitatifs robustes (MVO, remodelage VG, ECV), harmonisation inter-centre, validation histologique et extraction de biomarqueurs reproductibles.",
    url: CANONICAL,
    keywords: [
      "Cardiovascular MRI Core Lab",
      "ECV validation biopsy correlation",
      "Microvascular Obstruction",
      "Left Ventricular Remodeling",
      "Randomized Clinical Trial imaging endpoint",
      "Late Gadolinium Enhancement",
      "Multicenter MRI harmonization"
    ],
  };

  return (
    <>
      <Helmet>
        <title>Core Lab IRM Cardiovasculaire & Endpoints d’Essais | NOXIA</title>
        <meta
          name="description"
          content="Core Lab IRM cardiovasculaire pour essais multicentriques. Définition et validation d’endpoints IRM (MVO, remodelage VG, ECV), harmonisation inter-centre et biomarqueurs reproductibles."
        />
        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Core Lab IRM Cardiovasculaire | NOXIA" />
        <meta
          property="og:description"
          content="IRM comme surrogate endpoint robuste en essais thérapeutiques randomisés multicentriques."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">

            {/* HERO */}
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Core Lab IRM Cardiovasculaire
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                L’IRM comme <strong>surrogate endpoint quantitatif</strong> dans
                les essais thérapeutiques randomisés et cohortes multicentriques.
                Harmonisation, validation translationnelle et biomarqueurs défendables.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                L’imagerie comme endpoint thérapeutique robuste
              </h2>

              <p>
                Dans plusieurs essais multicentriques post-infarctus,
                études médicament vs placebo et cohortes longitudinales,
                l’IRM cardiovasculaire a été utilisée comme critère
                principal ou secondaire d’efficacité.
              </p>

              <p>
                L’objectif du Core Lab est de transformer une acquisition
                IRM hétérogène en un <strong>biomarqueur quantitatif
                reproductible</strong> : nécrose, Microvascular Obstruction (MVO),
                remodelage ventriculaire gauche, Late Gadolinium Enhancement (LGE),
                T1, T2, Extracellular Volume (ECV).
              </p>
            </section>

            {/* VALIDATION TRANSLATIONNELLE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation histologique et ECV
              </h2>

              <p>
                Participation à une étude translationnelle intégrant
                biopsies septales chez patients hypertrophiques avec IRM pré-biopsie.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Prélèvement d’hématocrite immédiat pré-injection</li>
                <li>Centrifugation et contrôle des biais liés à l’hydratation</li>
                <li>Quantification sectorielle AHA</li>
                <li>Corrélation ECV ↔ analyse histologique</li>
              </ul>

              <p>
                Ces travaux ont renforcé la validité physiopathologique de l’ECV
                comme marqueur quantitatif de l’espace extracellulaire et de la fibrose diffuse.
              </p>

              <p>
                Rappels méthodologiques essentiels :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>T1 : inflammation et fibrose diffuse</li>
                <li>T2 : œdème (distinction critique en pratique)</li>
              </ul>
            </section>

            {/* GRANDES COHORTES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Essais randomisés et cohortes longitudinales
              </h2>

              <p>
                Expérience sur essais post-IDM multicentriques,
                études thérapeutiques (colchicine vs placebo),
                évaluation du remodelage ventriculaire gauche
                sur cohortes &gt;2000 patients, et analyses
                institutionnelles à grande échelle.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Lecture centralisée multicentrique</li>
                <li>Définition d’endpoints IRM standardisés</li>
                <li>Quantification MVO et nécrose</li>
                <li>Analyse du remodelage ventriculaire gauche</li>
                <li>Gestion de cohortes maladies rares (ex. Fabry)</li>
              </ul>
            </section>

            {/* STRUCTURATION MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique et contrôle qualité
              </h2>

              <p>
                Un endpoint IRM robuste nécessite une harmonisation stricte :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit complet des DICOM</li>
                <li>Contrôle géométrique et métadonnées</li>
                <li>Anonymisation harmonisée</li>
                <li>Détection des doublons et examens incomplets</li>
                <li>Extraction volumétrique standardisée</li>
              </ul>

              <p>
                L’imagerie devient un outil décisionnel quantitatif,
                non un simple support illustratif.
              </p>
            </section>

            {/* LIENS INTERNES */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">
                Approfondir
              </h2>

              <div className="flex flex-wrap gap-3">
                <Link to="/segmentation-irm" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Segmentation IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/bases-multicentriques" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Bases multicentriques
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/analyse-dicom" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Analyse DICOM
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’un Core Lab IRM pour un essai thérapeutique multicentrique ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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

export default CorelabEC;