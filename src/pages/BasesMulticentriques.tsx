import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/bases-multicentriques";

const BasesMulticentriques = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Harmonisation de bases multicentriques en imagerie médicale",
    description:
      "Structuration, harmonisation inter-constructeurs et contrôle méthodologique de bases multicentriques IRM et CT pour essais cliniques et projets translationnels.",
    about: [
      "Multicenter imaging studies",
      "DICOM harmonization",
      "MRI inter-scanner variability",
      "CT reconstruction kernels",
      "Imaging endpoints validation"
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
        <title>Bases multicentriques & Harmonisation IRM/CT | NOXIA</title>

        <meta
          name="description"
          content="Harmonisation inter-constructeurs (Siemens, GE, Philips), contrôle des séquences 1.5T/3T, normalisation DICOM et structuration multicentrique pour biomarqueurs reproductibles."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Harmonisation multicentrique IRM & CT | NOXIA" />
        <meta
          property="og:description"
          content="Maîtrise de la variabilité inter-centre et inter-constructeurs pour essais cliniques et biomarqueurs quantitatifs."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Harmonisation de bases multicentriques en imagerie médicale
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Contrôle de la variabilité inter-constructeurs,
                normalisation DICOM et structuration méthodologique
                pour produire des biomarqueurs réellement reproductibles.
              </p>
            </section>

            {/* PROBLÈME FONDAMENTAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Le vrai problème des études multicentriques
              </h2>

              <p>
                Une base multicentrique n’est jamais homogène.
                Elle combine différents constructeurs (Siemens, GE, Philips),
                différentes générations de logiciels,
                différents champs magnétiques (1.5T, 3T),
                différents kernels CT et paramètres de reconstruction.
              </p>

              <p>
                Sans contrôle méthodologique, la variabilité technique
                peut dépasser l’effet biologique étudié.
                Un biomarqueur devient alors dépendant du centre,
                et non de la physiopathologie.
              </p>
            </section>

            {/* VARIABILITÉ TECHNIQUE */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Sources majeures de variabilité
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Variabilité inter-constructeurs
                  </h3>
                  <p>
                    Implémentations différentes des séquences IRM,
                    mapping T1/T2 dépendant du champ et du constructeur,
                    kernels CT influençant directement la quantification.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Différences 1.5T vs 3T
                  </h3>
                  <p>
                    Décalage systématique des valeurs T1 natif,
                    sensibilité accrue aux artefacts,
                    dispersion accrue si non stratifiée.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Reconstruction & kernels CT
                  </h3>
                  <p>
                    Impact direct sur la densité, le bruit
                    et la reproductibilité des mesures quantitatives.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Métadonnées DICOM
                  </h3>
                  <p>
                    Tags manquants, encodages variables,
                    incohérences d’orientation ou de spacing voxel.
                  </p>
                </div>

              </div>
            </section>

            {/* MÉTHODOLOGIE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Approche méthodologique structurée
              </h2>

              <p>
                L’objectif n’est pas d’effacer la variabilité,
                mais de la maîtriser, la documenter
                et l’intégrer dans le modèle analytique.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit exhaustif des métadonnées DICOM</li>
                <li>Stratification par centre si nécessaire</li>
                <li>Normalisation géométrique contrôlée</li>
                <li>Documentation complète des transformations</li>
                <li>Analyse des biais centre-dépendants</li>
                <li>Validation physiopathologique des métriques extraites</li>
              </ul>

              <p>
                Chaque transformation est tracée.
                La reproductibilité prime sur la simplification.
              </p>
            </section>

            {/* LIENS STRATÉGIQUES */}
            <section className="space-y-6 text-center">
              <h2 className="text-xl font-semibold">
                Voir également
              </h2>

              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Core Lab IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/ecv-mapping-t1-t2-irm-cardiaque"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  ECV & Mapping
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/segmentation-irm"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Segmentation IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’harmoniser une base multicentrique avant analyse ?
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

export default BasesMulticentriques;