import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/methodologie-imagerie-quantitative";

const MethodologieImagerieQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Méthodologie en imagerie quantitative IRM & CT",
    description:
      "Architecture méthodologique complète pour la transformation de données DICOM hétérogènes en biomarqueurs quantitatifs robustes, reproductibles et multicentriques en IRM et CT.",
    about: [
      "Medical image processing methodology",
      "Reproducible imaging biomarkers",
      "Multicenter harmonization",
      "DICOM audit",
      "Image normalization",
      "Quantitative MRI",
      "Quantitative CT"
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
        <title>Méthodologie en Imagerie Quantitative | NOXIA</title>

        <meta
          name="description"
          content="Architecture méthodologique complète pour biomarqueurs IRM et CT : audit DICOM, normalisation, harmonisation multicentrique et reproductibilité statistique."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Méthodologie en Imagerie Quantitative" />
        <meta
          property="og:description"
          content="Conception de pipelines robustes pour biomarqueurs IRM et CT en recherche clinique multicentrique."
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
                Méthodologie en imagerie quantitative
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Transformer des données DICOM hétérogènes en biomarqueurs
                robustes nécessite une architecture méthodologique explicite,
                traçable et reproductible.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du signal brut au biomarqueur défendable
              </h2>

              <p>
                Un biomarqueur d’imagerie n’est jamais une simple segmentation.
                Il résulte d’une chaîne complète intégrant contrôle des métadonnées,
                cohérence géométrique, normalisation du signal,
                segmentation, post-traitement, extraction métrique et traçabilité.
              </p>

              <p>
                L’objectif est de réduire les biais centre-dépendants,
                stabiliser les distributions statistiques
                et garantir la reproductibilité inter-opérateurs
                et inter-logiciels.
              </p>
            </section>

            {/* CHAÎNE MÉTHODOLOGIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture méthodologique type
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit et validation des métadonnées DICOM</li>
                <li>Conversion contrôlée DICOM → NIfTI si nécessaire</li>
                <li>Resampling géométrique documenté</li>
                <li>Normalisation intra-sujet ou populationnelle</li>
                <li>Segmentation guidée (règles physiopathologiques explicites)</li>
                <li>Nettoyage morphologique et filtrage volumique</li>
                <li>Extraction multi-seuils pour analyse de robustesse</li>
                <li>Logs, QA automatisé et versioning</li>
              </ul>

              <p>
                Chaque étape est dissociée, documentée et audit-able.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique
              </h2>

              <p>
                En contexte multicentrique, la variabilité technique
                peut dépasser la variabilité biologique.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Analyse inter-constructeurs (IRM & CT)</li>
                <li>Contrôle des séquences et reconstructions</li>
                <li>Normalisation intra-sujet (ex. hémisphère controlatéral)</li>
                <li>Calibration phantom en CT</li>
                <li>Documentation centre-dépendante</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques
                </Link>.
              </p>
            </section>

            {/* IRM & CT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications en IRM et CT
              </h2>

              <p>
                La méthodologie s’adapte aux contraintes physiques propres à chaque modalité.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  En IRM : normalisation signal, hystérésis 3D, seeds physiopathologiques
                </li>
                <li>
                  En CT : contrôle kernels, énergie effective, calibration matière
                </li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                  Imagerie quantitative IRM
                </Link>{" "}
                et{" "}
                <Link to="/ct-imagerie-quantitative" className="text-primary hover:underline">
                  Imagerie quantitative CT
                </Link>.
              </p>
            </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Reproductibilité avant automatisation
              </h2>

              <p>
                L’automatisation n’a de valeur que si la méthodologie est stable.
                L’ingénierie quantitative précède l’IA.
              </p>

              <p>
                La robustesse méthodologique constitue le socle
                de tout biomarqueur exploitable en contexte académique,
                industriel ou réglementaire.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin de structurer ou auditer une chaîne d’imagerie quantitative ?
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

export default MethodologieImagerieQuantitative;