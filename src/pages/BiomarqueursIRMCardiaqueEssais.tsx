import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/biomarqueurs-irm-cardiaque-essais-cliniques";

const BiomarqueursIRMCardiaqueEssais = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Biomarqueurs IRM cardiaque en essais cliniques multicentriques",
    description:
      "Définition, validation et harmonisation de biomarqueurs IRM cardiaque utilisés comme endpoints d’essais thérapeutiques multicentriques : LGE, MVO, ECV, T1, T2.",
    about: [
      "Cardiac MRI",
      "Late Gadolinium Enhancement",
      "Microvascular Obstruction",
      "Extracellular Volume",
      "T1 mapping",
      "T2 mapping",
      "Clinical trial imaging endpoints",
      "Multicenter imaging harmonization"
    ],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Researchers"
    },
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
        <title>
          Biomarqueurs IRM cardiaque & Essais cliniques multicentriques | NOXIA
        </title>

        <meta
          name="description"
          content="IRM cardiaque comme endpoint d’essais thérapeutiques : définition méthodologique des biomarqueurs LGE, MVO, ECV, T1 et T2, harmonisation multicentrique et validation translationnelle."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta
          property="og:title"
          content="Biomarqueurs IRM cardiaque en essais multicentriques | NOXIA"
        />
        <meta
          property="og:description"
          content="Structuration, harmonisation et validation de biomarqueurs IRM cardiaque utilisés comme endpoints d’essais randomisés."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

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
                Biomarqueurs IRM cardiaque comme endpoints d’essais cliniques
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Définition, validation méthodologique et harmonisation
                multicentrique de biomarqueurs IRM cardiaque utilisés
                comme endpoints primaires ou secondaires d’essais thérapeutiques.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                L’IRM cardiaque comme outil décisionnel quantitatif
              </h2>

              <p>
                Dans les essais cardiovasculaires modernes, l’IRM cardiaque
                dépasse le rôle descriptif. Elle devient un surrogate endpoint
                capable de mesurer la nécrose myocardique, l’obstruction
                microvasculaire, le remodelage ventriculaire gauche ou
                les altérations tissulaires diffuses.
              </p>

              <p>
                La validité scientifique d’un biomarqueur dépend cependant
                de sa définition méthodologique : règles de segmentation,
                choix des seuils, contrôle des biais centre-dépendants
                et reproductibilité inter-observateur.
              </p>

              <p>
                Cette structuration s’intègre dans une logique de{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  Core Lab IRM multicentrique
                </Link>{" "}
                et d’{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation de bases de données hétérogènes
                </Link>.
              </p>
            </section>

            {/* BIOMARQUEURS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Biomarqueurs IRM utilisés en essais randomisés
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Nécrose myocardique en rehaussement tardif (LGE)</li>
                <li>Obstruction microvasculaire (MVO)</li>
                <li>Volumes et fraction d’éjection ventriculaire</li>
                <li>Remodelage ventriculaire gauche longitudinal</li>
                <li>ECV (Extracellular Volume Fraction)</li>
                <li>T1 natif : inflammation et fibrose diffuse</li>
                <li>T2 mapping : marqueur d’œdème actif</li>
              </ul>

              <p>
                La distinction entre T1 (inflammation / fibrose diffuse)
                et T2 (œdème) est fondamentale, car elle influence directement
                l’interprétation physiopathologique et les conclusions
                cliniques d’un essai.
              </p>
            </section>

            {/* VALIDATION ECV */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation translationnelle : ECV et corrélation histologique
              </h2>

              <p>
                Dans des protocoles hypertrophiques avec biopsies septales,
                l’ECV a été évalué en conditions contrôlées :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Prélèvement sanguin immédiat avant injection</li>
                <li>Mesure précise de l’hématocrite</li>
                <li>Contrôle des biais liés à l’hydratation et à la position</li>
                <li>Sectorisation myocardique selon le modèle AHA</li>
                <li>Corrélation IRM ↔ analyse histologique</li>
              </ul>

              <p>
                Cette rigueur méthodologique renforce la légitimité
                de l’ECV comme reflet quantitatif de l’espace extracellulaire.
                Voir également la page dédiée{" "}
                <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                  ECV & Mapping T1/T2
                </Link>.
              </p>
            </section>

            {/* MÉTHODOLOGIE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Comparaison des méthodes de segmentation
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Méthodes SD vs FWHM selon la séquence</li>
                <li>Approches bullseye avec biais homogène contrôlé</li>
                <li>Analyse des biais systématiques</li>
                <li>Reproductibilité intra et inter-observateur</li>
                <li>Validation inter-logiciels</li>
              </ul>

              <p>
                Ces éléments s’inscrivent dans une logique globale de{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation IRM reproductible
                </Link>{" "}
                et de traçabilité complète des paramètres.
              </p>
            </section>

            {/* IMPACT PROMOTEUR */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Impact sur la puissance statistique d’un essai
              </h2>

              <p>
                Une variabilité méthodologique excessive peut dépasser
                l’effet thérapeutique étudié. Structurer précisément
                les biomarqueurs IRM permet :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Réduction du bruit inter-centre</li>
                <li>Amélioration de la cohérence des endpoints</li>
                <li>Optimisation de la puissance statistique</li>
                <li>Robustesse des analyses secondaires</li>
                <li>Crédibilité scientifique des publications</li>
              </ul>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin de structurer ou valider des biomarqueurs IRM
                dans un essai multicentrique ?
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

export default BiomarqueursIRMCardiaqueEssais;