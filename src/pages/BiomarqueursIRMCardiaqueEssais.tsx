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
      "Définition, validation méthodologique et harmonisation multicentrique de biomarqueurs IRM cardiaque utilisés comme endpoints primaires ou secondaires d’essais thérapeutiques randomisés.",
    about: [
      "Cardiac MRI",
      "Clinical trial imaging endpoints",
      "Late Gadolinium Enhancement",
      "Microvascular Obstruction",
      "Extracellular Volume Fraction",
      "T1 mapping",
      "T2 mapping",
      "Left ventricular remodeling",
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
    mainEntity: {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Pourquoi l’IRM cardiaque est-elle utilisée comme endpoint d’essai clinique ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "L’IRM cardiaque permet une quantification directe de la nécrose, de l’obstruction microvasculaire, du remodelage ventriculaire et des altérations tissulaires diffuses. Elle constitue un surrogate endpoint robuste lorsqu’elle est méthodologiquement standardisée."
          }
        },
        {
          "@type": "Question",
          "name": "Quelle est la différence entre T1 et T2 en pratique clinique ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Le T1 natif est principalement associé à l’inflammation et à la fibrose diffuse, tandis que le T2 mapping reflète l’œdème actif. Leur confusion peut conduire à des interprétations physiopathologiques erronées."
          }
        },
        {
          "@type": "Question",
          "name": "Pourquoi l’harmonisation multicentrique est-elle critique ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "La variabilité inter-constructeurs et inter-centres peut dépasser l’effet thérapeutique étudié. Une harmonisation documentée est nécessaire pour garantir la validité statistique et scientifique des biomarqueurs."
          }
        }
      ]
    },
    url: CANONICAL
  };

  return (
    <>
      <Helmet>
        <title>
          Biomarqueurs IRM cardiaque & Endpoints d’essais cliniques | NOXIA
        </title>

        <meta
          name="description"
          content="IRM cardiaque comme endpoint d’essais thérapeutiques multicentriques : LGE, MVO, ECV, T1, T2. Validation translationnelle, harmonisation inter-centre et reproductibilité scientifique."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta
          property="og:title"
          content="Biomarqueurs IRM cardiaque en essais multicentriques"
        />
        <meta
          property="og:description"
          content="Structuration, validation et harmonisation de biomarqueurs IRM cardiaque utilisés comme endpoints randomisés."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Biomarqueurs IRM cardiaque comme endpoints d’essais cliniques
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Structuration méthodologique, validation translationnelle
                et harmonisation multicentrique de biomarqueurs IRM
                utilisés comme endpoints primaires ou secondaires
                d’essais thérapeutiques randomisés.
              </p>
            </section>

            {/* POSITION STRATÉGIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                De l’image descriptive au surrogate endpoint
              </h2>

              <p>
                L’IRM cardiaque moderne ne se limite plus à la visualisation.
                Elle permet une quantification directe des lésions myocardiques,
                du remodelage ventriculaire gauche et des altérations
                tissulaires diffuses. Dans un essai thérapeutique,
                ces mesures deviennent des endpoints décisionnels.
              </p>

              <p>
                Toutefois, un biomarqueur IRM n’a de valeur scientifique
                que si sa définition est explicite : règles de segmentation,
                choix des seuils, séparation inférence / quantification,
                contrôle des biais inter-centre et reproductibilité.
              </p>

              <p>
                Cette démarche s’intègre dans une logique globale de{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  Core Lab IRM multicentrique
                </Link>{" "}
                et d’{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation méthodologique des bases d’imagerie
                </Link>.
              </p>
            </section>

            {/* BIOMARQUEURS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Biomarqueurs cardiaques structurants
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Nécrose myocardique (Late Gadolinium Enhancement)</li>
                <li>Obstruction microvasculaire (MVO)</li>
                <li>Volumes ventriculaires & fraction d’éjection</li>
                <li>Remodelage ventriculaire longitudinal</li>
                <li>ECV – quantification de l’espace extracellulaire</li>
                <li>T1 natif – inflammation / fibrose diffuse</li>
                <li>T2 mapping – œdème actif</li>
              </ul>

              <p>
                La distinction entre T1 et T2 est essentielle :
                le T1 reflète principalement l’inflammation ou la fibrose diffuse,
                tandis que le T2 est un marqueur d’œdème actif.
                Une confusion méthodologique altère directement
                l’interprétation physiopathologique.
              </p>
            </section>

            {/* VALIDATION TRANSLATIONNELLE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation translationnelle : ECV et corrélation histologique
              </h2>

              <p>
                Dans des protocoles hypertrophiques intégrant biopsies septales,
                l’ECV a été évalué dans des conditions strictement contrôlées :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Prélèvement sanguin immédiat avant injection</li>
                <li>Mesure précise de l’hématocrite (contrôle décantation)</li>
                <li>Sectorisation myocardique AHA</li>
                <li>Corrélation IRM ↔ histologie quantitative</li>
              </ul>

              <p>
                Cette approche renforce la validité physiopathologique
                du biomarqueur. Voir également la page dédiée{" "}
                <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                  ECV & Mapping T1/T2
                </Link>.
              </p>
            </section>

            {/* VARIABILITÉ MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Variabilité inter-centre et puissance statistique
              </h2>

              <p>
                Dans un essai multicentrique, la variabilité technique
                (constructeur, champ 1.5T/3T, implémentation séquence,
                post-traitement logiciel) peut dépasser l’effet
                thérapeutique étudié.
              </p>

              <p>
                Une harmonisation structurée permet :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Réduction du bruit centre-dépendant</li>
                <li>Stabilisation des distributions statistiques</li>
                <li>Amélioration de la puissance analytique</li>
                <li>Robustesse des conclusions publiables</li>
              </ul>

              <p>
                Cette étape est détaillée dans{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques & Harmonisation IRM/CT
                </Link>.
              </p>
            </section>

            {/* LIENS TRANSVERSAUX */}
            <section className="space-y-6 text-center">
              <h2 className="text-xl font-semibold">
                Approches complémentaires
              </h2>

              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/segmentation-irm"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Segmentation IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Core Lab IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Harmonisation multicentrique
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA FINAL */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un endpoint IRM robuste est un travail
                méthodologique avant d’être un travail logiciel.
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