import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/expertise";

const Expertise = () => {
  return (
    <>
      <Helmet>
        <title>Expertise en imagerie médicale quantitative | NOXIA</title>
        <meta
          name="description"
          content="Expertise intégrée en IRM, CT et méthodologie multicentrique. Production de biomarqueurs robustes, harmonisation inter-constructeurs et ingénierie quantitative."
        />
        <link rel="canonical" href={CANONICAL} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-24 px-4">
          <div className="max-w-6xl mx-auto space-y-28">

            {/* ================= HERO ================= */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Une expertise structurée autour du signal
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                IRM · CT · Méthodologie multicentrique
              </p>

              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                L’imagerie quantitative n’est pas une accumulation d’outils.
                C’est une architecture méthodologique cohérente,
                pensée pour transformer le signal en biomarqueur
                reproductible et scientifiquement défendable.
              </p>
            </section>

            {/* ================= VISION ================= */}
            <section className="max-w-4xl mx-auto space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Vision transversale
              </h2>

              <p>
                L’expertise NOXIA repose sur une approche intégrée :
                compréhension fine des métadonnées DICOM,
                cohérence géométrique,
                séparation stricte entre visualisation, segmentation
                et quantification.
              </p>

              <p>
                Chaque flux est conçu pour être traçable,
                inter-centre robuste,
                et physiopathologiquement cohérent.
              </p>
            </section>

            {/* ================= PYRAMIDE ================= */}
            <section className="space-y-12">

              <h2 className="text-2xl font-semibold text-center">
                Trois piliers complémentaires
              </h2>

              <div className="grid md:grid-cols-3 gap-10">

                {/* IRM */}
                <div className="p-8 rounded-xl border border-border bg-background space-y-5">
                  <h3 className="text-xl font-semibold">IRM</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    IRM cardiaque avancée (LGE, T1/T2, ECV),
                    neuro post-AVC (Tmax, ADC, OEF/CMRO₂),
                    biomarqueurs myocardiques et métaboliques.
                  </p>

                  <Link
                    to="/irm-imagerie-quantitative"
                    className="inline-block text-sm font-medium text-primary hover:opacity-80"
                  >
                    Explorer l’IRM →
                  </Link>
                </div>

                {/* CT */}
                <div className="p-8 rounded-xl border border-border bg-background space-y-5">
                  <h3 className="text-xl font-semibold">CT</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    CT spectral, reconstruction mono-énergétique,
                    décomposition matière,
                    perfusion AVC et harmonisation inter-constructeurs.
                  </p>

                  <Link
                    to="/ct-imagerie-quantitative"
                    className="inline-block text-sm font-medium text-primary hover:opacity-80"
                  >
                    Explorer le CT →
                  </Link>
                </div>

                {/* MÉTHODOLOGIE */}
                <div className="p-8 rounded-xl border border-border bg-background space-y-5">
                  <h3 className="text-xl font-semibold">Méthodologie</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Structuration multicentrique,
                    audit de flux,
                    anonymisation avancée,
                    validation et intégration contrôlée d’IA.
                  </p>

                  <Link
                    to="/methodologie-imagerie-quantitative"
                    className="inline-block text-sm font-medium text-primary hover:opacity-80"
                  >
                    Explorer la méthodologie →
                  </Link>
                </div>

              </div>
            </section>

            {/* ================= SOCLE ================= */}
            <section className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-2xl font-semibold">
                Un socle méthodologique commun
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Plus de 5000 examens analysés en contexte clinique
                et scientifique.
                Structuration de CoreLab cœur–cerveau,
                harmonisation inter-sites,
                validation inter-constructeurs.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                L’automatisation n’intervient qu’après validation.
                L’IA est intégrée dans des flux contrôlés,
                jamais utilisée comme boîte noire autonome.
              </p>
            </section>

            {/* ================= CTA ================= */}
            <section className="text-center space-y-6">
              <h2 className="text-xl font-semibold">
                Une expertise indépendante, reproductible et traçable
              </h2>

              <Link
                to="/prestations-imagerie-medicale"
                className="inline-block rounded-md bg-primary px-8 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Découvrir les prestations
              </Link>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Expertise;