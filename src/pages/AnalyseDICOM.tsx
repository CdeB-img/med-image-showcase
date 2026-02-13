import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const AnalyseDICOM = () => {
  return (
    <>
      <Helmet>
        <title>
          Analyse DICOM & structuration de bases d’images | NOXIA
        </title>

        <meta
          name="description"
          content="Analyse DICOM, structuration de bases multicentriques et harmonisation d’images médicales pour la recherche clinique. Contrôle des métadonnées et pipelines reproductibles."
        />

        <link
          rel="canonical"
          href="https://noxia-imagerie.fr/analyse-dicom"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">

          <div className="max-w-4xl mx-auto space-y-16">

            {/* ================= HEADER ================= */}
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Analyse DICOM & structuration de bases d’images
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Contrôle, harmonisation et préparation méthodologique
                de données d’imagerie médicale pour projets cliniques
                et études multicentriques.
              </p>
            </section>

            {/* ================= CONTEXTE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Les données DICOM contiennent bien plus que des images.
                Elles intègrent des métadonnées essentielles :
                géométrie, espacements, unités physiques,
                paramètres d’acquisition, identifiants d’étude
                et structure hiérarchique patient / série.
              </p>

              <p>
                En recherche clinique, une analyse DICOM rigoureuse
                constitue un prérequis à toute segmentation,
                quantification ou analyse statistique fiable.
              </p>
            </section>

            {/* ================= ENJEUX ================= */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Enjeux méthodologiques
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold mb-2 text-foreground">
                    Cohérence géométrique
                  </h3>
                  <p>
                    Vérification des espacements voxel,
                    orientation des axes, correspondance
                    entre séries (CT, IRM, perfusion).
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold mb-2 text-foreground">
                    Harmonisation multicentrique
                  </h3>
                  <p>
                    Gestion des variations inter-constructeurs,
                    protocoles hétérogènes et différences
                    d’encodage des métadonnées.
                  </p>
                </div>

              </div>
            </section>

            {/* ================= STRUCTURATION ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration des bases d’images
              </h2>

              <p>
                La préparation d’une base de données exploitable
                nécessite une organisation claire :
                anonymisation contrôlée,
                hiérarchisation des séries,
                normalisation des noms et
                génération d’identifiants cohérents.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit des métadonnées DICOM</li>
                <li>Détection d’incohérences inter-séries</li>
                <li>Conversion maîtrisée DICOM → NIfTI</li>
                <li>Traçabilité des transformations</li>
              </ul>

              <p>
                Chaque transformation est documentée
                afin de garantir reproductibilité
                et auditabilité scientifique.
              </p>
            </section>

            {/* ================= APPLICATIONS ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications typiques
              </h2>

              <p>
                • Préparation d’études multicentriques  
                • Validation d’algorithmes de segmentation  
                • Harmonisation avant analyse IA  
                • Extraction de métriques quantitatives fiables  
              </p>

              <p className="font-medium text-foreground">
                L’objectif est de sécuriser la chaîne complète
                du signal brut aux biomarqueurs finaux.
              </p>
            </section>

          </div>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default AnalyseDICOM;