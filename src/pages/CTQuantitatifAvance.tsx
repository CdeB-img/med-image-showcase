import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale";

const CTQuantitatifAvance = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT quantitatif avancé et imagerie spectrale",
    description:
      "Développement et validation de biomarqueurs CT robustes : imagerie spectrale, monoénergétique, décomposition matière, calibration phantom et harmonisation multicentrique.",
    about: [
      "Spectral CT",
      "Dual Energy CT",
      "Material decomposition",
      "Monoenergetic reconstruction",
      "Quantitative CT biomarkers",
      "Phantom calibration",
      "Inter-vendor variability"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    url: CANONICAL
  };

  return (
    <>
      <Helmet>
        <title>
          CT quantitatif avancé & Imagerie spectrale | NOXIA
        </title>

        <meta
          name="description"
          content="Imagerie spectrale, monoénergétique et décomposition matière en CT. Calibration physique, robustesse inter-constructeurs et biomarqueurs quantitatifs défendables."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta
          property="og:title"
          content="CT quantitatif avancé & Imagerie spectrale"
        />
        <meta
          property="og:description"
          content="Développement de biomarqueurs CT robustes : physique, calibration, harmonisation multicentrique."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT quantitatif avancé & imagerie spectrale
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Développement de biomarqueurs CT robustes basés sur la physique,
                la décomposition matière et une harmonisation multicentrique
                rigoureusement documentée.
              </p>
            </section>

            {/* PROBLÈME FONDAMENTAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Le mythe de la stabilité des unités Hounsfield
              </h2>

              <p>
                En CT, une valeur HU n’est pas une constante universelle.
                Elle dépend du kernel de reconstruction, de l’algorithme itératif,
                de l’énergie effective, du constructeur et du protocole.
              </p>

              <p>
                Dans un contexte multicentrique, la variabilité technique peut
                dépasser la variation biologique étudiée. Sans calibration ni
                contrôle méthodologique, un biomarqueur CT devient centre-dépendant.
              </p>
            </section>

            {/* IMAGERIE SPECTRALE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Imagerie spectrale & décomposition matière
              </h2>

              <p>
                L’imagerie dual-energy et spectrale permet de dépasser
                l’analyse HU conventionnelle en accédant aux composantes
                physiques du signal.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Décomposition Compton / Photoélectrique</li>
                <li>Reconstruction monoénergétique synthétique</li>
                <li>Analyse des limites basse énergie (&lt;70 keV)</li>
                <li>Évaluation des dérives inter-constructeurs</li>
              </ul>

              <p>
                Implémentation et validation de modèles physiques inspirés
                des équations de décomposition type Alvarez,
                avec confrontation aux reconstructions constructeur.
              </p>
            </section>

            {/* CALIBRATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Calibration physique & validation
              </h2>

              <p>
                Toute quantification CT nécessite une validation physique indépendante.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Calibration phantom eau et matériaux connus</li>
                <li>Correction des dérives énergétiques</li>
                <li>Analyse des kernels et reconstructions</li>
                <li>Évaluation reproductibilité intra / inter-système</li>
              </ul>

              <p>
                L’objectif n’est pas seulement de reproduire une image,
                mais de garantir la stabilité métrique du biomarqueur extrait.
              </p>
            </section>

            {/* APPLICATIONS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications cliniques et translationnelles
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Quantification tissulaire (fibrose, inflammation)</li>
                <li>Perfusion CT et cartographies dérivées</li>
                <li>Analyse calcium et matériaux spécifiques</li>
                <li>Comparaison monoénergétique vs reconstructions standards</li>
              </ul>

              <p>
                Ces approches s’intègrent dans une logique globale d’
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie en imagerie quantitative
                </Link>{" "}
                et d’
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation multicentrique
                </Link>.
              </p>
            </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Physique maîtrisée, biomarqueurs exploitables
              </h2>

              <p>
                L’expertise ne se limite pas à la compréhension physique.
                Elle consiste à transformer cette compréhension en biomarqueurs
                reproductibles, statistiquement robustes et défendables
                en contexte réglementaire ou industriel.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’un développement ou d’une validation en CT quantitatif ?
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

export default CTQuantitatifAvance;