import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ingenierie-imagerie-quantitative";

const IngenierieImagerieQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Ingénierie en imagerie quantitative IRM & CT",
    description:
      "Conception de pipelines robustes pour la segmentation, la normalisation, l’harmonisation multicentrique et l’extraction de biomarqueurs quantitatifs en IRM et CT.",
    about: [
      "Medical image processing pipelines",
      "DICOM to NIfTI conversion",
      "Multicenter imaging harmonization",
      "Quantitative MRI",
      "Quantitative CT",
      "Image normalization",
      "Hysteresis segmentation",
      "Reproducible biomarkers"
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
          Ingénierie en Imagerie Quantitative IRM & CT | NOXIA
        </title>

        <meta
          name="description"
          content="Architecture de pipelines reproductibles en IRM et CT : conversion DICOM, normalisation du signal, segmentation multi-seuils, harmonisation multicentrique et extraction de biomarqueurs robustes."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta
          property="og:title"
          content="Ingénierie en Imagerie Quantitative IRM & CT"
        />
        <meta
          property="og:description"
          content="Conception de pipelines robustes et reproductibles pour biomarqueurs IRM et CT en recherche clinique."
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
                Ingénierie en imagerie quantitative IRM & CT
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Conception de pipelines méthodologiques robustes pour transformer
                des données DICOM hétérogènes en biomarqueurs quantitatifs
                reproductibles, exploitables statistiquement et scientifiquement défendables.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Au-delà de la segmentation : architecture méthodologique
              </h2>

              <p>
                Un biomarqueur d’imagerie n’est pas un masque.
                Il est le résultat d’une chaîne complète :
                contrôle des métadonnées DICOM, cohérence géométrique,
                normalisation du signal, segmentation,
                post-traitement morphologique,
                extraction métrique et traçabilité.
              </p>

              <p>
                L’ingénierie quantitative vise à rendre cette chaîne explicite,
                versionnée et reproductible, afin de limiter les biais centre-dépendants
                et les effets méthodologiques invisibles.
              </p>
            </section>

            {/* PIPELINE GLOBAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture type d’un pipeline quantitatif
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit et validation des métadonnées DICOM</li>
                <li>Conversion contrôlée DICOM → NIfTI</li>
                <li>Resampling géométrique documenté</li>
                <li>Normalisation intra-sujet (ex. hémisphère controlatéral)</li>
                <li>Segmentation guidée (hystérésis 3D, seeds physiopathologiques)</li>
                <li>Nettoyage morphologique 2D puis filtrage volumique 3D</li>
                <li>Extraction multi-seuils pour analyse de robustesse</li>
                <li>Export métriques + logs + QA automatisé</li>
              </ul>

              <p>
                Chaque transformation est traçable.  
                La séparation inférence / quantification est maintenue.
              </p>
            </section>

            {/* IRM */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Application en IRM
              </h2>

              <p>
                En IRM, la variabilité inter-séquence et inter-constructeurs
                impose une normalisation robuste :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Normalisation médiane + IQR controlatéral</li>
                <li>Comparaison hémisphérique miroir</li>
                <li>Seeds physiopathologiques (diffusion, LGE, mapping)</li>
                <li>Propagation contrôlée par hystérésis 3D</li>
                <li>Analyse multi-seuil (ex. 60–250% IQR)</li>
                <li>Évaluation Dice automatique vs référence experte</li>
              </ul>

              <p>
                Voir également{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  Segmentation IRM
                </Link>{" "}
                et{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  Perfusion & Métabolisme cérébral
                </Link>.
              </p>
            </section>

            {/* CT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Application en CT quantitatif
              </h2>

              <p>
                En CT, la problématique principale n’est pas la segmentation,
                mais la stabilité physique des valeurs :
                reconstruction, kernel, énergie, implémentation constructeur.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle des kernels et reconstructions</li>
                <li>Calibration phantom (eau, matériaux connus)</li>
                <li>Analyse inter-constructeurs (GE / Siemens / Philips)</li>
                <li>Validation mono-énergétique et décomposition matière</li>
                <li>Impact des reconstructions sur biomarqueurs dérivés</li>
              </ul>

              <p>
                Cette approche s’intègre dans{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  Quantification CT
                </Link>{" "}
                et sera développée dans la section dédiée au CT avancé.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Reproductibilité multicentrique
              </h2>

              <p>
                Une base multicentrique n’est jamais homogène.
                La variabilité technique peut dépasser l’effet biologique étudié.
              </p>

              <p>
                L’ingénierie quantitative permet :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit systématique des acquisitions</li>
                <li>Détection de doublons et examens incomplets</li>
                <li>Harmonisation géométrique et signal</li>
                <li>Documentation centre-dépendante</li>
                <li>Stabilisation statistique des distributions</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Harmonisation multicentrique
                </Link>.
              </p>
            </section>

            {/* VALEUR */}
            <section className="space-y-6 text-muted-foreground leading-relaxed text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Ce que cette approche change
              </h2>

              <p>
                L’imagerie devient un outil décisionnel quantitatif,
                structuré et audit-able, plutôt qu’un simple support visuel.
              </p>

              <p>
                La robustesse méthodologique précède l’automatisation.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin de structurer un pipeline d’imagerie quantitative IRM ou CT ?
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

export default IngenierieImagerieQuantitative;