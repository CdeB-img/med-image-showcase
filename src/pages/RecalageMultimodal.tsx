import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const RecalageMultimodal = () => {
  return (
    <>
      <Helmet>
        <title>
          Recalage multimodal IRM / CT en recherche clinique | NOXIA
        </title>

        <meta
          name="description"
          content="Recalage multimodal IRM et CT pour études longitudinales et projets multicentriques. Alignement géométrique rigoureux et validation méthodologique en imagerie médicale."
        />

        <link
          rel="canonical"
          href="https://noxia-imagerie.fr/recalage-multimodal"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">

          <div className="max-w-4xl mx-auto space-y-16">

            {/* ================= HEADER ================= */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Recalage multimodal IRM / CT
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Alignement géométrique rigoureux pour analyses longitudinales,
                multimodales et multicentriques en imagerie médicale.
              </p>
            </section>

            {/* ================= CONTEXTE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Le recalage constitue une étape structurante dans toute analyse
                quantitative en imagerie. Un alignement approximatif peut
                introduire des biais majeurs dans la segmentation,
                la quantification volumique ou l’extraction de biomarqueurs.
              </p>

              <p>
                En contexte clinique réel, les défis incluent :
                variations d’orientation, différences de résolution,
                distorsions spécifiques à la modalité et évolution
                anatomique longitudinale.
              </p>
            </section>

            {/* ================= TYPES DE RECALAGE ================= */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Types de recalage
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Monomodal longitudinal
                  </h3>
                  <p>
                    Alignement IRM → IRM ou CT → CT pour suivi patient
                    multi-visites, contrôle de progression lésionnelle
                    et comparaison volumique robuste.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Multimodal IRM / CT
                  </h3>
                  <p>
                    Fusion structure / fonction, diffusion / perfusion,
                    anatomie / paramétrique, avec métriques adaptées
                    aux différences de contraste.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Recalage rigide / affine
                  </h3>
                  <p>
                    Correction des translations, rotations et
                    changements d’échelle sans déformation locale.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Recalage non-linéaire
                  </h3>
                  <p>
                    Adaptation aux déformations anatomiques,
                    transformation diffeomorphique contrôlée
                    et validation locale des champs de déplacement.
                  </p>
                </div>

              </div>
            </section>

            {/* ================= APPROCHE MÉTHODOLOGIQUE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Approche méthodologique
              </h2>

              <p>
                Le recalage n’est pas une simple étape technique.
                Il doit être documenté, contrôlé et validé.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Choix explicite de la métrique de similarité</li>
                <li>Contrôle de la convergence et des paramètres</li>
                <li>Évaluation visuelle systématique</li>
                <li>Validation quantitative si applicable</li>
                <li>Traçabilité complète des transformations appliquées</li>
              </ul>

              <p>
                L’objectif est d’obtenir un alignement
                physiologiquement cohérent,
                et non simplement mathématiquement optimal.
              </p>
            </section>

            {/* ================= CONTEXTES D’APPLICATION ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Contextes d’application
              </h2>

              <p>
                • Suivi de lésions cérébrales  
                • IRM cardiaque multi-séquences  
                • Fusion CT / IRM en oncologie  
                • Études multicentriques avec protocoles variables  
              </p>

              <p className="font-medium text-foreground">
                Un recalage robuste conditionne la validité
                de toute analyse quantitative ultérieure.
              </p>
            </section>

          </div>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default RecalageMultimodal;