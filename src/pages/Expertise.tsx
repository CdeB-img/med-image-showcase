import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/expertise";

const Expertise = () => {
  return (
    <>
      <Helmet>
        <title>Expertise | IRM, CT & Méthodologie | NOXIA</title>
        <meta
          name="description"
          content="Expertise en imagerie médicale quantitative : IRM cardiaque et neuro, CT spectral et perfusion, méthodologie multicentrique et ingénierie reproductible."
        />
        <link rel="canonical" href={CANONICAL} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-6xl mx-auto space-y-24">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Expertise en imagerie médicale quantitative
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                IRM · CT · Méthodologie multicentrique
              </p>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Analyse avancée, structuration méthodologique et production de
                biomarqueurs reproductibles en contexte hospitalo-universitaire
                et industriel.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              <p>
                L’expertise NOXIA repose sur une approche signal-driven :
                compréhension fine des métadonnées, cohérence géométrique,
                séparation stricte entre visualisation, segmentation et quantification.
              </p>
              <p>
                Chaque flux est conçu pour être traçable, reproductible
                et scientifiquement défendable.
              </p>
            </section>

            {/* 3 PILIERS */}
            <section className="grid md:grid-cols-3 gap-8">

              {/* IRM */}
              <div className="p-8 rounded-xl border border-border bg-background space-y-4">
                <h2 className="text-xl font-semibold">IRM</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  IRM cardiaque avancée (LGE, T1/T2, ECV), neuro post-AVC,
                  biomarqueurs myocardiques et métaboliques.
                </p>
                <Link
                  to="/irm-imagerie-quantitative"
                  className="inline-block text-sm text-primary font-medium hover:opacity-80"
                >
                  Explorer l’IRM →
                </Link>
              </div>

              {/* CT */}
              <div className="p-8 rounded-xl border border-border bg-background space-y-4">
                <h2 className="text-xl font-semibold">CT</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  CT spectral, monoénergétique, perfusion AVC,
                  harmonisation inter-constructeurs et calibration phantom.
                </p>
                <Link
                  to="/ct-imagerie-quantitative"
                  className="inline-block text-sm text-primary font-medium hover:opacity-80"
                >
                  Explorer le CT →
                </Link>
              </div>

              {/* MÉTHODOLOGIE */}
              <div className="p-8 rounded-xl border border-border bg-background space-y-4">
                <h2 className="text-xl font-semibold">Méthodologie</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Structuration multicentrique, audit méthodologique,
                  anonymisation avancée et ingénierie quantitative.
                </p>
                <Link
                  to="/methodologie-imagerie-quantitative"
                  className="inline-block text-sm text-primary font-medium hover:opacity-80"
                >
                  Explorer la méthodologie →
                </Link>
              </div>

            </section>

            {/* DIFFERENCIATION */}
            <section className="text-center space-y-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold">
                Une expertise intégrée cœur–cerveau
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Plus de 5000 examens analysés en contexte clinique et scientifique,
                avec structuration de CoreLab multicentriques,
                harmonisation inter-sites et validation méthodologique rigoureuse.
              </p>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Expertise;