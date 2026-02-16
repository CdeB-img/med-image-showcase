import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";

const CANONICAL = "https://noxia-imagerie.fr/expertise";

const Expertise = () => {
  return (
    <>
      <Helmet>
        <title>Expertise en imagerie médicale quantitative | NOXIA</title>

        <meta
          name="description"
          content="Expertise intégrée en IRM, CT et méthodologie multicentrique. Développement de biomarqueurs reproductibles, harmonisation inter-constructeurs et ingénierie quantitative en recherche clinique."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Expertise en imagerie médicale quantitative",
            description:
              "IRM, CT et méthodologie multicentrique. Développement de biomarqueurs robustes et ingénierie quantitative en recherche clinique.",
            url: CANONICAL
          })}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-24 px-4">
          <div className="max-w-6xl mx-auto space-y-32">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise" }
              ]}
            />

            {/* ================= HERO ================= */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Expertise en imagerie médicale quantitative
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transformer des images cliniques hétérogènes en biomarqueurs
                reproductibles, multicentriques et physiquement cohérents.
              </p>
            </section>

            {/* ================= POSITIONNEMENT ================= */}
            <section className="max-w-4xl mx-auto space-y-8 text-muted-foreground leading-relaxed text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Une approche architecturée, non opportuniste
              </h2>

              <p>
                L’imagerie quantitative ne consiste pas à empiler des outils.
                Elle repose sur une architecture méthodologique cohérente
                intégrant audit DICOM, contrôle géométrique,
                normalisation signal, segmentation contrôlée
                et extraction métrique traçable.
              </p>

              <p>
                Chaque pipeline est conçu pour être robuste inter-centre,
                cohérent inter-constructeur et défendable en publication
                ou en contexte réglementaire.
              </p>
            </section>

            {/* ================= DOMAINES ================= */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-center">
                Champs d’intervention
              </h2>

              <div className="grid md:grid-cols-3 gap-12">

                {/* IRM */}
                <div className="space-y-5">
                  <h3 className="text-xl font-semibold">IRM quantitative</h3>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    IRM cardiaque (LGE, T1/T2 mapping, ECV),
                    neuro-imagerie post-AVC (perfusion, diffusion, métabolisme),
                    structuration Core Lab et endpoints d’essais thérapeutiques.
                  </p>

                  <Link
                    to="/irm-imagerie-quantitative"
                    className="text-sm font-medium text-primary hover:opacity-80"
                  >
                    Explorer l’IRM →
                  </Link>
                </div>

                {/* CT */}
                <div className="space-y-5">
                  <h3 className="text-xl font-semibold">CT quantitatif</h3>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    CT spectral, décomposition matière,
                    stabilité des unités HU,
                    perfusion AVC,
                    calibration phantom et harmonisation inter-constructeurs.
                  </p>

                  <Link
                    to="/ct-imagerie-quantitative"
                    className="text-sm font-medium text-primary hover:opacity-80"
                  >
                    Explorer le CT →
                  </Link>
                </div>

                {/* MÉTHODOLOGIE */}
                <div className="space-y-5">
                  <h3 className="text-xl font-semibold">
                    Méthodologie & structuration multicentrique
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Audit DICOM, hiérarchisation des bases,
                    harmonisation inter-sites,
                    intégration contrôlée d’IA dans des flux reproductibles.
                  </p>

                  <Link
                    to="/methodologie-imagerie-quantitative"
                    className="text-sm font-medium text-primary hover:opacity-80"
                  >
                    Explorer la méthodologie →
                  </Link>
                </div>

              </div>
            </section>

            {/* ================= DIFFÉRENCIATION ================= */}
            <section className="max-w-4xl mx-auto text-center space-y-8 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Ce qui différencie l’approche
              </h2>

              <p>
                • Séparation stricte visualisation / segmentation / quantification  
                • Normalisation intra-sujet lorsque nécessaire  
                • Analyse multi-seuil pour robustesse statistique  
                • Calibration physique indépendante en CT  
                • Validation translationnelle lorsque possible  
              </p>

              <p>
                L’automatisation n’est intégrée qu’après validation méthodologique.
                L’IA est évaluée, auditée et contrôlée.
                Elle ne remplace jamais l’architecture scientifique.
              </p>
            </section>

            {/* ================= SOCLE ================= */}
            <section className="text-center space-y-6">
              <h2 className="text-xl font-semibold">
                Une expertise indépendante et reproductible
              </h2>

              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Plusieurs milliers d’examens analysés en contexte clinique réel,
                structuration de Core Labs cœur–cerveau,
                harmonisation inter-constructeurs
                et validation multicentrique.
              </p>

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
