import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const BasesMulticentriques = () => {
  return (
    <>
      <Helmet>
        <title>
          Bases de données multicentriques en imagerie médicale | NOXIA
        </title>

        <meta
          name="description"
          content="Structuration et harmonisation de bases de données multicentriques en IRM et CT. Contrôle méthodologique, normalisation DICOM et préparation pour la recherche clinique."
        />

        <link
          rel="canonical"
          href="https://noxia-imagerie.fr/bases-multicentriques"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">

          <div className="max-w-4xl mx-auto space-y-16">

            {/* ================= HEADER ================= */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Bases de données multicentriques en imagerie médicale
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Harmonisation méthodologique de données IRM et CT
                issues de centres multiples pour études cliniques
                et projets translationnels.
              </p>
            </section>

            {/* ================= CONTEXTE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Les études multicentriques introduisent une variabilité
                inhérente : constructeurs différents, protocoles
                d’acquisition hétérogènes, paramètres de reconstruction
                non uniformes et encodages DICOM variables.
              </p>

              <p>
                Sans harmonisation rigoureuse, cette variabilité peut
                introduire des biais majeurs dans la segmentation,
                la quantification ou l’entraînement d’algorithmes.
              </p>
            </section>

            {/* ================= PROBLÉMATIQUES ================= */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Problématiques fréquentes
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Variabilité inter-constructeurs
                  </h3>
                  <p>
                    Différences GE / Siemens / Philips,
                    gestion des kernels CT, reconstructions
                    spectrales ou séquences IRM spécifiques.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Incohérences géométriques
                  </h3>
                  <p>
                    Spacing voxel non homogène,
                    orientations divergentes,
                    séries incomplètes ou mal identifiées.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Métadonnées incomplètes
                  </h3>
                  <p>
                    Tags DICOM manquants,
                    erreurs d’encodage,
                    normalisation insuffisante des unités.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Cohérence longitudinale
                  </h3>
                  <p>
                    Suivi patient multi-temps,
                    recalage et comparabilité inter-visites.
                  </p>
                </div>

              </div>
            </section>

            {/* ================= MÉTHODOLOGIE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Approche méthodologique
              </h2>

              <p>
                L’objectif n’est pas de forcer une homogénéité artificielle,
                mais de contrôler, documenter et intégrer la variabilité.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit systématique des métadonnées DICOM</li>
                <li>Normalisation géométrique contrôlée</li>
                <li>Stratification par centre si nécessaire</li>
                <li>Documentation des transformations appliquées</li>
                <li>Validation physiopathologique des métriques extraites</li>
              </ul>

              <p>
                Chaque étape est conçue pour préserver la traçabilité
                et garantir la reproductibilité scientifique.
              </p>
            </section>

            {/* ================= CAS D’USAGE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Cas d’usage typiques
              </h2>

              <p>
                • Cohortes AVC multicentriques  
                • IRM cardiaque multi-sites  
                • Études CT de perfusion  
                • Validation d’algorithmes IA sur données hétérogènes  
              </p>

              <p className="font-medium text-foreground">
                La robustesse d’un biomarqueur dépend
                de la qualité de la base qui le produit.
              </p>
            </section>

          </div>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default BasesMulticentriques;