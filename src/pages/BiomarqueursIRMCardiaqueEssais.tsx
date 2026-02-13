import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/biomarqueurs-irm-cardiaque-essais";

const BiomarqueursIRMCardiaqueEssais = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Biomarqueurs IRM cardiaque en essais randomisés",
    about: [
      "Cardiac MRI",
      "Clinical trial imaging endpoints",
      "Myocardial infarction",
      "Microvascular obstruction",
      "Extracellular volume",
      "T1 mapping",
      "T2 mapping"
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
        <title>Biomarqueurs IRM cardiaque & Essais randomisés | NOXIA</title>
        <meta
          name="description"
          content="Définition, validation et quantification de biomarqueurs IRM cardiaque utilisés comme endpoints d’essais thérapeutiques multicentriques : LGE, MVO, ECV, T1, T2."
        />
        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Biomarqueurs IRM cardiaque & Essais randomisés | NOXIA" />
        <meta
          property="og:description"
          content="IRM cardiaque comme endpoint d’essais : validation translationnelle, harmonisation multicentrique et biomarqueurs robustes."
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
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Biomarqueurs IRM cardiaque comme endpoints d’essais randomisés
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Définition, validation et quantification de biomarqueurs IRM
                utilisés comme endpoints primaires ou secondaires
                dans des essais thérapeutiques multicentriques.
              </p>
            </section>

            {/* IRM COMME ENDPOINT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                L’IRM cardiaque comme surrogate endpoint
              </h2>

              <p>
                Dans les essais cardiovasculaires modernes, l’IRM cardiaque
                constitue un outil quantitatif central. Elle permet d’évaluer
                la nécrose myocardique, l’obstruction microvasculaire,
                le remodelage ventriculaire gauche ou les altérations tissulaires diffuses.
              </p>

              <p>
                Toutefois, un biomarqueur IRM n’a de valeur scientifique
                que si sa définition méthodologique est explicite,
                reproductible et physiopathologiquement cohérente.
              </p>
            </section>

            {/* BIOMARQUEURS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Biomarqueurs utilisés en pratique
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Nécrose myocardique en rehaussement tardif (LGE)</li>
                <li>Obstruction microvasculaire (MVO)</li>
                <li>Remodelage ventriculaire gauche longitudinal</li>
                <li>Fraction d’éjection et volumes ventriculaires</li>
                <li>ECV (Extracellular Volume Fraction)</li>
                <li>T1 natif : inflammation et fibrose diffuse</li>
                <li>T2 mapping : marqueur d’œdème actif</li>
              </ul>

              <p>
                La distinction entre T1 (inflammation / fibrose diffuse)
                et T2 (œdème) est essentielle, car leur interprétation
                influence directement les conclusions cliniques.
              </p>
            </section>

            {/* VALIDATION ECV */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation translationnelle de l’ECV
              </h2>

              <p>
                Dans certaines études hypertrophiques, l’ECV a été corrélé
                à des biopsies septales réalisées le jour même.
                La méthodologie incluait :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Prélèvement sanguin immédiat avant injection</li>
                <li>Mesure précise de l’hématocrite</li>
                <li>Contrôle des biais liés à la position et à l’hydratation</li>
                <li>Sectorisation myocardique selon le modèle AHA</li>
                <li>Corrélation IRM ↔ analyse histologique</li>
              </ul>

              <p>
                Cette approche a renforcé la légitimité de l’ECV
                comme reflet quantitatif de l’espace extracellulaire.
              </p>
            </section>

            {/* ESSAIS MULTICENTRIQUES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Expérience en essais multicentriques
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Essais post-IDM avec évaluation MVO et nécrose</li>
                <li>Études médicament vs placebo (infarctus, myocardite)</li>
                <li>Cohortes longitudinales 2 000 patients (remodelage VG)</li>
                <li>Relectures institutionnelles massives cardiothoraciques</li>
                <li>Études rétrospectives (ex. maladie de Fabry)</li>
              </ul>

              <p>
                Le rôle consistait à harmoniser les méthodes,
                structurer les bases multicentriques et garantir
                la robustesse des endpoints IRM.
              </p>
            </section>

            {/* METHODOLOGIE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation et comparaison des méthodes
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Méthodes SD vs FWHM selon la séquence</li>
                <li>Approches bullseye avec biais homogène contrôlé</li>
                <li>Analyse des biais systématiques</li>
                <li>Reproductibilité intra et inter-observateur</li>
                <li>Validation inter-logiciels (clinique vs recherche)</li>
              </ul>

              <p>
                Le choix de la méthode influence directement
                le volume final mesuré et donc la puissance statistique de l’essai.
              </p>
            </section>

            {/* STRUCTURATION CORELAB */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Pourquoi structurer un Core Lab IRM
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Standardisation des lectures</li>
                <li>Centralisation du contrôle qualité</li>
                <li>Harmonisation multicentrique documentée</li>
                <li>Structuration propre des bases DICOM</li>
                <li>Production de biomarqueurs statistiquement exploitables</li>
              </ul>

              <p>
                Sans structuration méthodologique, la variabilité inter-centre
                peut dépasser l’effet thérapeutique étudié.
              </p>
            </section>

            {/* LIENS INTERNES */}
            <section className="space-y-6 text-center">
              <h2 className="text-xl font-semibold">
                Approfondir
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
                  to="/segmentation-irm"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Segmentation IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Bases multicentriques
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’un Core Lab IRM pour un essai multicentrique ?
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