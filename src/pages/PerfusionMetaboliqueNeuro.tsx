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
      "Développement, validation et harmonisation multicentrique de biomarqueurs OEF, CMRO2, CBF et Tmax en neuro-imagerie quantitative.",
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
          content="Pipelines avancés OEF, CMRO2, CBF et Tmax en IRM cérébrale. Hystérésis 3D, normalisation hémisphérique, segmentation physiopathologique et harmonisation multicentrique."
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
                Perfusion & Métabolisme cérébral en IRM quantitative
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Structuration algorithmique et validation multicentrique
                de biomarqueurs OEF, CMRO₂, CBF et Tmax
                dans l’AVC ischémique et les études neurovasculaires.
              </p>
            </section>

            {/* ENJEU FONDAMENTAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                De la cartographie physiologique au biomarqueur exploitable
              </h2>

              <p>
                Les cartes OEF, CMRO₂, CBF et Tmax ne sont pas,
                par nature, des biomarqueurs.
                Elles représentent des distributions continues
                issues de modèles physiologiques complexes,
                fortement sensibles aux conditions d’acquisition,
                aux paramètres de reconstruction et aux artefacts.
              </p>

              <p>
                La transformation d’une carte métabolique
                en endpoint défendable nécessite :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Une normalisation intra-sujet robuste</li>
                <li>Une séparation explicite diffusion / pénombre</li>
                <li>Une segmentation volumique cohérente en 3D</li>
                <li>Une validation inter-seuil et inter-patient</li>
                <li>Une reproductibilité inter-centre documentée</li>
              </ul>
            </section>

            {/* ARCHITECTURE ALGORITHMIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture du pipeline quantitatif
              </h2>

              <p>
                L’approche développée repose sur une logique
                physiopathologique avant d’être algorithmique.
                La diffusion définit le noyau ischémique (D_core),
                servant de point d’ancrage anatomique.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Calcul miroir hémisphérique pour référence controlatérale</li>
                <li>Normalisation basée sur médiane + IQR</li>
                <li>Détection multi-seuil (60–250% IQR)</li>
                <li>Hystérésis 3D : propagation contrôlée depuis le core</li>
                <li>Filtrage morphologique multi-échelle</li>
                <li>Nettoyage volumique et suppression des artéfacts isolés</li>
              </ul>

              <p>
                Chaque seuil génère un masque indépendant,
                permettant d’évaluer la stabilité volumétrique
                et la sensibilité aux paramètres.
              </p>
            </section>

            {/* BIOMARQUEURS DÉRIVÉS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Biomarqueurs dérivés et métriques volumétriques
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Volume OEF pathologique normalisé</li>
                <li>Volume CMRO₂ altéré</li>
                <li>Mismatch diffusion / métabolisme</li>
                <li>Tmax ≥ 6 s volumique</li>
                <li>Cartographie combinée hémodynamique + métabolique</li>
              </ul>

              <p>
                L’objectif est d’éviter une approche binaire simpliste.
                La distribution complète des valeurs,
                la dispersion intra-lésionnelle
                et la relation avec la diffusion
                sont intégrées dans l’analyse.
              </p>
            </section>

            {/* VALIDATION & ROBUSTESSE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation et robustesse multicentrique
              </h2>

              <p>
                Les valeurs absolues OEF et CMRO₂
                varient selon constructeur,
                implémentation séquence
                et calibration physiologique.
              </p>

              <p>
                La normalisation intra-sujet
                par référence hémisphérique
                permet de limiter l’effet
                de la variabilité inter-centre.
              </p>

              <p>
                Cette structuration s’inscrit dans la logique globale de{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  bases multicentriques harmonisées
                </Link>{" "}
                et d’{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie méthodologique explicite
                </Link>.
              </p>
            </section>

            {/* POSITIONNEMENT SCIENTIFIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Positionnement scientifique
              </h2>

              <p>
                La segmentation métabolique ne doit pas être
                une simple projection de seuil.
                Elle doit rester cohérente avec :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>La physiopathologie de la pénombre</li>
                <li>L’évolution temporelle post-AVC</li>
                <li>La cohérence diffusion / perfusion</li>
                <li>La reproductibilité volumétrique</li>
              </ul>

              <p>
                Cette approche complète la{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation IRM contrôlée
                </Link>{" "}
                et peut s’intégrer dans une logique de{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  Core Lab neurovasculaire multicentrique
                </Link>.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un biomarqueur métabolique robuste
                exige une architecture explicite,
                traçable et reproductible.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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