import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const QuantificationCT = () => {
  return (
    <>
      <Helmet>
        <title>
          Quantification CT et extraction de biomarqueurs | NOXIA
        </title>

        <meta
          name="description"
          content="Quantification CT en recherche clinique : extraction de biomarqueurs morphologiques et fonctionnels, perfusion, CT spectral et validation méthodologique robuste."
        />

        <link
          rel="canonical"
          href="https://noxia-imagerie.fr/quantification-ct"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">

          <div className="max-w-4xl mx-auto space-y-16">

            {/* ================= HEADER ================= */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Quantification CT & biomarqueurs
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Extraction robuste de paramètres morphologiques et fonctionnels
                à partir d’images scanner (CT) en contexte clinique réel.
              </p>
            </section>

            {/* ================= CONTEXTE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                La quantification CT dépasse largement la simple mesure
                volumique. Elle implique une compréhension fine du signal,
                des unités (HU), des reconstructions et des artefacts
                potentiels liés aux protocoles d’acquisition.
              </p>

              <p>
                En recherche clinique, l’enjeu est double :
                produire des biomarqueurs exploitables,
                tout en garantissant leur reproductibilité
                et leur cohérence physiopathologique.
              </p>
            </section>

            {/* ================= AXES D’ANALYSE ================= */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Axes d’analyse quantitative
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Analyse morphologique
                  </h3>
                  <p>
                    Volumes, surfaces, épaisseurs, rapports anatomiques,
                    distribution tissulaire et métriques dérivées.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Quantification tissulaire (HU)
                  </h3>
                  <p>
                    Analyse statistique des intensités,
                    histogrammes, hétérogénéité intra-lésionnelle
                    et seuils physiologiquement justifiés.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Perfusion CT
                  </h3>
                  <p>
                    Paramètres hémodynamiques dérivés
                    (CBF, CBV, MTT, Tmax),
                    contrôle des artefacts et cohérence temporelle.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    CT spectral / mono-énergétique
                  </h3>
                  <p>
                    Reconstruction mono-énergétique,
                    décomposition matière,
                    exploitation du signal photoélectrique et Compton.
                  </p>
                </div>

              </div>
            </section>

            {/* ================= MÉTHODOLOGIE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Méthodologie
              </h2>

              <p>
                La robustesse d’un biomarqueur repose sur :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle de la géométrie voxel et du spacing</li>
                <li>Validation des unités physiques (HU)</li>
                <li>Gestion des reconstructions multiples</li>
                <li>Standardisation inter-centres</li>
                <li>Documentation complète du pipeline</li>
              </ul>

              <p>
                Une quantification fiable nécessite une séparation claire
                entre visualisation, segmentation et extraction métrique.
              </p>
            </section>

            {/* ================= CONTEXTES ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Contextes d’application
              </h2>

              <p>
                • Oncologie thoracique et abdominale  
                • Cardiovasculaire  
                • AVC et perfusion cérébrale  
                • Études multicentriques longitudinales  
              </p>

              <p className="font-medium text-foreground">
                L’objectif n’est pas seulement de mesurer,
                mais de produire des paramètres interprétables
                et scientifiquement défendables.
              </p>
            </section>

          </div>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default QuantificationCT;