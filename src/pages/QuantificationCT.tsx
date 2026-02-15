import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/quantification-ct";

const QuantificationCT = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Quantification CT et extraction de biomarqueurs",
    description:
      "Quantification CT avancée en recherche clinique : biomarqueurs morphologiques et fonctionnels, perfusion, CT spectral et validation méthodologique multicentrique.",
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
        <title>Quantification CT & biomarqueurs reproductibles | NOXIA</title>

        <meta
          name="description"
          content="Quantification CT en recherche clinique : biomarqueurs morphologiques, perfusion cérébrale, CT spectral, validation des HU et harmonisation multicentrique."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-28">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Quantification CT & biomarqueurs
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Extraction de paramètres morphologiques, tissulaires et hémodynamiques
                à partir d’images scanner (CT), dans une logique méthodologique
                reproductible et multicentrique.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du voxel HU au biomarqueur exploitable
              </h2>

              <p>
                La quantification CT dépasse la simple mesure volumique.
                Elle implique une compréhension fine :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Des unités physiques (Hounsfield Units)</li>
                <li>Des kernels de reconstruction</li>
                <li>Du bruit et des filtres appliqués</li>
                <li>Des reconstructions multiples (itératives, mono-énergétiques)</li>
              </ul>

              <p>
                En recherche clinique, un biomarqueur CT n’a de valeur
                que s’il est reproductible inter-centre et physiopathologiquement cohérent.
              </p>
            </section>

            {/* AXES D’ANALYSE */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Axes d’analyse quantitative
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Analyse morphologique
                  </h3>
                  <p>
                    Volumes, surfaces, épaisseurs pariétales,
                    rapports anatomiques, distribution tissulaire,
                    segmentation multi-organes et métriques dérivées.
                  </p>
                  <p className="text-sm mt-2">
                    Applications : oncologie thoracique, aorte, calcium, foie,
                    segmentation thorax complète.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Quantification tissulaire (HU)
                  </h3>
                  <p>
                    Analyse statistique des intensités,
                    histogrammes intra-lésionnels,
                    hétérogénéité volumique,
                    seuils basés sur justification physiologique
                    plutôt que sur valeur arbitraire.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Perfusion CT cérébrale
                  </h3>
                  <p>
                    Extraction de CBF, CBV, MTT, Tmax,
                    contrôle de cohérence temporelle,
                    gestion des artefacts de mouvement,
                    et validation volumétrique core/pénombre.
                  </p>
                  <p className="text-sm mt-2">
                    Voir également{" "}
                    <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                      perfusion IRM & métabolisme cérébral
                    </Link>.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    CT spectral & mono-énergétique
                  </h3>
                  <p>
                    Reconstruction mono-énergétique,
                    décomposition matière,
                    exploitation des composantes photoélectrique et Compton,
                    modélisation physique avancée.
                  </p>
                </div>

              </div>
            </section>

            {/* MÉTHODOLOGIE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture méthodologique
              </h2>

              <p>
                La robustesse d’un biomarqueur CT repose sur :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit complet des métadonnées DICOM</li>
                <li>Contrôle du spacing voxel et orientation</li>
                <li>Validation des HU (calibration eau/air si nécessaire)</li>
                <li>Gestion explicite des kernels et reconstructions multiples</li>
                <li>Standardisation des règles de segmentation</li>
                <li>Documentation complète du pipeline et versioning</li>
              </ul>

              <p>
                Une quantification fiable impose une séparation claire entre :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Visualisation</li>
                <li>Segmentation</li>
                <li>Extraction métrique</li>
                <li>Analyse statistique</li>
              </ul>

              <p>
                Voir également{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  Analyse DICOM & structuration
                </Link>{" "}
                et{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Harmonisation multicentrique
                </Link>.
              </p>
            </section>

            {/* VARIABILITÉ MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Variabilité inter-constructeurs
              </h2>

              <p>
                Les valeurs quantitatives CT peuvent varier selon :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Constructeur (GE, Siemens, Philips)</li>
                <li>Version logicielle</li>
                <li>Kernels de reconstruction</li>
                <li>Itérations algorithmiques</li>
                <li>Paramètres d’injection contraste</li>
              </ul>

              <p>
                Sans harmonisation documentée, la variabilité technique
                peut dépasser l’effet biologique étudié.
              </p>
            </section>

            {/* CONTEXTES D’APPLICATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Contextes d’application
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Oncologie thoracique et abdominale</li>
                <li>Imagerie cardiovasculaire (aorte, calcifications)</li>
                <li>AVC et perfusion cérébrale</li>
                <li>Études longitudinales multicentriques</li>
                <li>Validation d’algorithmes IA</li>
              </ul>

              <p>
                L’objectif n’est pas uniquement de mesurer,
                mais de produire des paramètres interprétables,
                reproductibles et scientifiquement défendables.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Un biomarqueur CT robuste repose d’abord sur une architecture méthodologique explicite.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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