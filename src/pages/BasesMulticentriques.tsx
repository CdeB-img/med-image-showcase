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
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Harmonisation de bases multicentriques IRM & CT
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Maîtrise de la variabilité inter-constructeurs et inter-centres
                pour garantir la validité scientifique des biomarqueurs
                en recherche clinique et essais multicentriques.
              </p>
            </section>

            {/* PROBLÈME CENTRAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Pourquoi l’harmonisation est méthodologiquement critique
              </h2>

              <p>
                Une base multicentrique n’est jamais homogène. Elle agrège
                des acquisitions issues de constructeurs différents,
                de générations logicielles hétérogènes, de champs magnétiques
                distincts (1.5T / 3T) et de reconstructions CT multiples.
              </p>

              <p>
                Sans audit rigoureux des données et sans contrôle des
                métadonnées DICOM, la variabilité technique peut dépasser
                l’effet biologique étudié. Le risque est majeur : produire
                un biomarqueur dépendant du centre plutôt que de la
                physiopathologie.
              </p>

              <p>
                Cette étape précède toute{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation IRM
                </Link>,{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT
                </Link>{" "}
                ou extraction d’endpoint utilisé en{" "}
                <Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className="text-primary hover:underline">
                  essai clinique multicentrique
                </Link>.
              </p>
            </section>

            {/* VARIABILITÉ TECHNIQUE */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">
                Sources majeures de variabilité
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Variabilité inter-constructeurs
                  </h3>
                  <p>
                    Implémentations différentes des séquences IRM,
                    variations de mapping T1/T2,
                    reconstructions CT spécifiques à chaque constructeur.
                  </p>
                  <p>
                    Ces différences impactent directement les distributions
                    statistiques des biomarqueurs.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Champ magnétique 1.5T vs 3T
                  </h3>
                  <p>
                    Décalage systématique du T1 natif,
                    dispersion accrue en cas de non-stratification,
                    sensibilité différenciée aux artefacts.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Reconstruction & kernels CT
                  </h3>
                  <p>
                    Influence directe sur le bruit, la densité,
                    et la stabilité des mesures en unités HU.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Métadonnées DICOM
                  </h3>
                  <p>
                    Tags incomplets, incohérences d’orientation,
                    erreurs de spacing voxel ou encodages variables.
                  </p>
                  <p>
                    Voir également la page dédiée{" "}
                    <Link to="/analyse-dicom" className="text-primary hover:underline">
                      Analyse DICOM & structuration
                    </Link>.
                  </p>
                </div>

              </div>
            </section>

            {/* APPROCHE MÉTHODOLOGIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Approche méthodologique structurée
              </h2>

              <p>
                L’objectif n’est pas d’effacer la variabilité, mais de la
                caractériser, la documenter et l’intégrer explicitement
                dans le modèle analytique.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit exhaustif des métadonnées DICOM</li>
                <li>Contrôle géométrique et cohérence inter-séries</li>
                <li>Stratification centre / constructeur si nécessaire</li>
                <li>Normalisation contrôlée et traçable</li>
                <li>Documentation complète des transformations</li>
                <li>Analyse des biais centre-dépendants</li>
              </ul>

              <p>
                Cette démarche s’intègre dans une logique globale de{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologie d’imagerie quantitative
                </Link>{" "}
                et constitue le socle de toute activité de{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  Core Lab multicentrique
                </Link>.
              </p>
            </section>

            {/* IMPACT SCIENTIFIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Impact direct sur la puissance statistique
              </h2>

              <p>
                Une harmonisation correcte permet :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Réduction du bruit centre-dépendant</li>
                <li>Stabilisation des distributions statistiques</li>
                <li>Amélioration de la puissance analytique</li>
                <li>Robustesse des conclusions publiables</li>
              </ul>

              <p>
                À l’inverse, une base non harmonisée peut masquer un effet
                thérapeutique réel ou générer des faux positifs.
              </p>
            </section>

            {/* CTA FINAL */}
            <section className="text-center space-y-6">
              <h2 className="text-xl font-semibold">
                Transformer une base hétérogène en socle scientifique robuste
              </h2>

              <p className="text-muted-foreground max-w-3xl mx-auto">
                L’harmonisation multicentrique est un travail méthodologique
                avant d’être un travail logiciel. Elle conditionne la validité
                de toute analyse ultérieure.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet multicentrique
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