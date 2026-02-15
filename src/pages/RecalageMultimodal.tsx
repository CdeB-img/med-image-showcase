import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/recalage-multimodal";

const RecalageMultimodal = () => {
  return (
    <>
      <Helmet>
        <title>
          Recalage multimodal IRM / CT en recherche clinique | NOXIA
        </title>

        <meta
          name="description"
          content="Recalage multimodal IRM et CT pour études longitudinales et projets multicentriques. Alignement géométrique rigoureux, validation méthodologique et intégration dans pipelines quantitatifs."
        />

        <link rel="canonical" href={CANONICAL} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">

          <div className="max-w-5xl mx-auto space-y-24">

            {/* ================= HERO ================= */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Recalage multimodal IRM / CT
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Alignement géométrique contrôlé pour analyses longitudinales,
                multimodales et multicentriques.  
                Un recalage robuste conditionne la validité
                de toute quantification ultérieure.
              </p>
            </section>

            {/* ================= ENJEU FONDAMENTAL ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Le recalage comme socle méthodologique
              </h2>

              <p>
                Toute segmentation, toute extraction volumique et tout biomarqueur
                dérivé supposent un espace commun cohérent.
                Un alignement approximatif introduit des biais systématiques
                souvent invisibles à l’œil nu mais majeurs en analyse statistique.
              </p>

              <p>
                En contexte clinique réel, les défis incluent :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Variations d’orientation DICOM</li>
                <li>Résolutions anisotropes</li>
                <li>Distorsions IRM spécifiques au champ</li>
                <li>Évolution anatomique longitudinale</li>
                <li>Différences de contraste multimodal</li>
              </ul>

              <p>
                Un recalage non contrôlé compromet directement
                la validité d’un{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  pipeline de segmentation
                </Link>{" "}
                ou d’une{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT
                </Link>.
              </p>
            </section>

            {/* ================= TYPES DE RECALAGE ================= */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-center">
                Typologies de recalage
              </h2>

              <div className="grid md:grid-cols-2 gap-8 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Monomodal longitudinal
                  </h3>
                  <p>
                    IRM → IRM ou CT → CT pour suivi multi-visites.
                    Stabilisation volumique et comparaison robuste
                    de progression lésionnelle.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Multimodal IRM / CT
                  </h3>
                  <p>
                    Fusion structure / fonction,
                    diffusion / perfusion,
                    anatomie / paramétrique.
                    Nécessite métriques adaptées aux contrastes hétérogènes.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Recalage rigide & affine
                  </h3>
                  <p>
                    Correction translation / rotation / échelle.
                    Adapté aux analyses globales sans déformation locale.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Recalage non-linéaire diffeomorphique
                  </h3>
                  <p>
                    Modélisation des déformations anatomiques locales,
                    contrôle du champ de déplacement et validation topologique.
                  </p>
                </div>

              </div>
            </section>

            {/* ================= MÉTHODOLOGIE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Approche méthodologique contrôlée
              </h2>

              <p>
                Le recalage n’est pas une étape automatique.
                Il doit être explicitement paramétré et validé.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Choix documenté de la métrique de similarité (MI, CC…)</li>
                <li>Optimisation multi-résolution contrôlée</li>
                <li>Vérification de la convergence</li>
                <li>Évaluation visuelle systématique</li>
                <li>Validation quantitative si applicable (Dice, TRE…)</li>
                <li>Traçabilité complète des transformations</li>
              </ul>

              <p>
                L’objectif est un alignement physiologiquement cohérent,
                pas simplement mathématiquement optimal.
              </p>

              <p>
                Cette démarche s’intègre dans l’{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie quantitative
                </Link>{" "}
                et dans la logique de{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  structuration multicentrique
                </Link>.
              </p>
            </section>

            {/* ================= APPLICATIONS ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Contextes d’application
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Suivi longitudinal de lésions cérébrales</li>
                <li>IRM cardiaque multi-séquences (cine / LGE / mapping)</li>
                <li>Fusion CT / IRM en oncologie</li>
                <li>Analyse perfusion / diffusion post-AVC</li>
                <li>Études multicentriques avec protocoles hétérogènes</li>
              </ul>

              <p className="font-medium text-foreground">
                Le recalage est une étape structurante.
                Toute erreur se propage dans l’ensemble du pipeline.
              </p>
            </section>

            {/* ================= CTA ================= */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’intégrer un recalage robuste dans un pipeline IRM ou CT ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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

export default RecalageMultimodal;