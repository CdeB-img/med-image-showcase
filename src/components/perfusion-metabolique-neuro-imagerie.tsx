import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/perfusion-metabolique-neuro-imagerie";

const PerfusionMetaboliqueNeuro = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Quantification perfusion et métabolisme cérébral en IRM",
    description:
      "Développement et validation de pipelines quantitatifs OEF, CMRO2, CBF et Tmax en neuro-imagerie multicentrique. Segmentation physiopathologique, hystérésis 3D et harmonisation inter-centre.",
    about: [
      "Oxygen Extraction Fraction MRI",
      "CMRO2 MRI",
      "Cerebral perfusion MRI",
      "Tmax perfusion",
      "Diffusion perfusion mismatch",
      "Ischemic core segmentation",
      "Neurovascular imaging"
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

  return (
    <>
      <Helmet>
        <title>
          Perfusion & Métabolisme cérébral IRM | OEF, CMRO2, Tmax | NOXIA
        </title>

        <meta
          name="description"
          content="Pipelines avancés de quantification OEF, CMRO2, CBF et Tmax en IRM cérébrale. Hystérésis 3D, normalisation hémisphérique et validation multicentrique."
        />

        <link rel="canonical" href={CANONICAL} />

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
                Quantification perfusion & métabolisme cérébral en IRM
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Développement de pipelines avancés pour l’analyse
                OEF, CMRO2, CBF et Tmax dans le contexte
                d’AVC ischémique et d’études multicentriques.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                De la cartographie brute au biomarqueur défendable
              </h2>

              <p>
                Les cartes métaboliques et perfusionnelles
                (OEF, CMRO2, CBF, Tmax) ne sont pas directement
                exploitables telles quelles.
                Leur interprétation nécessite un cadre méthodologique
                strict : normalisation, contrôle hémisphérique,
                segmentation guidée par diffusion et validation volumétrique.
              </p>

              <p>
                L’approche développée repose sur une logique
                physiopathologique : comparaison hémisphère sain / pathologique,
                modélisation du D_core, hystérésis 3D contrôlée
                et filtrage morphologique multi-échelle.
              </p>
            </section>

            {/* PIPELINE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture du pipeline quantitatif
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Calcul D_core par miroir hémisphérique</li>
                <li>Normalisation basée sur médiane + IQR controlatéral</li>
                <li>Hystérésis 3D (seed diffusion → propagation métabolique)</li>
                <li>Nettoyage morphologique 2D puis filtrage 3D volumique</li>
                <li>Analyse multi-seuils (60–250% IQR)</li>
                <li>Évaluation Dice automatique vs référence</li>
              </ul>

              <p>
                Chaque seuil génère un masque indépendant
                permettant d’évaluer robustesse et stabilité
                inter-seuil et inter-patient.
              </p>
            </section>

            {/* BIOMARQUEURS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Biomarqueurs dérivés
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Volume OEF pathologique</li>
                <li>Volume CMRO2 altéré</li>
                <li>Métabolisme mismatch diffusion/perfusion</li>
                <li>Tmax ≥ 6s volumique</li>
                <li>Cartographies combinées métabolique / hémodynamique</li>
              </ul>

              <p>
                L’objectif est de dépasser le simple seuil binaire
                pour produire une analyse volumétrique robuste,
                exploitable statistiquement.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Adaptation multicentrique
              </h2>

              <p>
                Les valeurs absolues OEF et CMRO2
                varient selon séquence, implémentation
                et constructeur.
              </p>

              <p>
                L’utilisation d’une normalisation intra-sujet
                (basée sur l’hémisphère sain)
                permet une robustesse accrue face à la variabilité inter-centre.
              </p>

              <p>
                Cette approche s’inscrit dans la logique globale
                d’{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation multicentrique
                </Link>{" "}
                et de{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation contrôlée
                </Link>.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Développer un biomarqueur métabolique robuste
                nécessite une architecture algorithmique explicite.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet neuro
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