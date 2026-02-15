import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/corelab-essais-cliniques";

const CorelabEC = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Core Lab IRM cardiovasculaire pour essais cliniques",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    areaServed: "Europe",
    serviceType: [
      "Cardiovascular MRI Core Lab",
      "Imaging surrogate endpoints",
      "Multicenter imaging harmonization",
      "ECV validation",
      "Microvascular Obstruction quantification",
      "Left Ventricular remodeling assessment"
    ],
    url: CANONICAL
  };

  return (
    <>
      <Helmet>
        <title>Core Lab IRM Cardiovasculaire & Endpoints d’Essais | NOXIA</title>
        <meta
          name="description"
          content="Core Lab IRM cardiovasculaire pour essais randomisés multicentriques : définition d’endpoints robustes (MVO, remodelage VG, ECV), validation histologique et harmonisation inter-centre."
        />
        <link rel="canonical" href={CANONICAL} />
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
                Core Lab IRM Cardiovasculaire
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Structuration méthodologique d’endpoints IRM quantitatifs
                pour essais thérapeutiques randomisés et cohortes multicentriques.
                L’imagerie devient un <strong>surrogate endpoint défendable</strong>,
                reproductible et statistiquement robuste.
              </p>
            </section>

            {/* POSITION STRATÉGIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Transformer l’IRM en endpoint décisionnel
              </h2>

              <p>
                Dans un essai thérapeutique cardiovasculaire,
                l’IRM ne peut être un simple outil descriptif.
                Elle doit produire des métriques quantitatives
                capables de détecter un effet traitement
                parfois plus faible que la variabilité technique.
              </p>

              <p>
                Le rôle du Core Lab consiste à :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Définir précisément l’endpoint IRM (primaire / secondaire)</li>
                <li>Formaliser les règles de segmentation</li>
                <li>Standardiser les seuils et post-traitements</li>
                <li>Contrôler la variabilité inter-centre</li>
                <li>Garantir la traçabilité et la reproductibilité</li>
              </ul>
            </section>

            {/* ENDPOINTS STRUCTURANTS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Endpoints IRM cardiovasculaires structurants
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Nécrose myocardique (Late Gadolinium Enhancement)</li>
                <li>Microvascular Obstruction (MVO)</li>
                <li>Volumes ventriculaires & fraction d’éjection</li>
                <li>Remodelage ventriculaire gauche longitudinal</li>
                <li>ECV – fraction volumique extracellulaire</li>
                <li>T1 natif et T2 mapping</li>
              </ul>

              <p>
                Chaque paramètre possède une sensibilité spécifique
                aux conditions d’acquisition et aux règles de segmentation.
                Leur définition doit être explicite et documentée.
              </p>
            </section>

            {/* VALIDATION TRANSLATIONNELLE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation translationnelle : ECV & histologie
              </h2>

              <p>
                Dans un protocole hypertrophique intégrant biopsies septales,
                l’ECV a été validé dans un cadre strict :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Mesure d’hématocrite immédiate pré-injection</li>
                <li>Centrifugation contrôlée et gestion des biais d’hydratation</li>
                <li>Sectorisation myocardique AHA</li>
                <li>Corrélation quantitative IRM ↔ fibrose histologique</li>
              </ul>

              <p>
                Cette approche renforce la validité physiopathologique
                du biomarqueur et limite les erreurs systématiques
                liées à des approximations biologiques.
              </p>

              <p>
                Voir également :{" "}
                <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                  ECV & Mapping T1/T2
                </Link>
              </p>
            </section>

            {/* EXPÉRIENCE MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Essais randomisés et cohortes à grande échelle
              </h2>

              <p>
                Expérience sur essais post-IDM multicentriques,
                stratégies thérapeutiques (ex. anti-inflammatoires),
                remodelage ventriculaire gauche longitudinal
                sur cohortes &gt;2000 patients,
                ainsi que maladies rares (ex. Fabry).
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Lecture centralisée indépendante</li>
                <li>Standardisation inter-centre</li>
                <li>Extraction volumétrique harmonisée</li>
                <li>Gestion longitudinale T0 / M6 / M12</li>
              </ul>
            </section>

            {/* HARMONISATION TECHNIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation inter-centre et contrôle qualité
              </h2>

              <p>
                Dans un contexte multicentrique, la variabilité technique
                peut dépasser l’effet traitement.
                L’harmonisation est donc structurante.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit exhaustif des métadonnées DICOM</li>
                <li>Contrôle géométrique et orientation</li>
                <li>Détection de reconstructions multiples</li>
                <li>Normalisation séquence-dépendante</li>
                <li>QC visuel et QC volumétrique systématique</li>
              </ul>

              <p>
                Ces principes sont détaillés dans{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques & harmonisation IRM/CT
                </Link>.
              </p>
            </section>

            {/* INTÉGRATION TRANSVERSALE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Intégration avec segmentation et analyse DICOM
              </h2>

              <p>
                Un Core Lab IRM robuste repose sur :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <Link to="/segmentation-irm" className="text-primary hover:underline">
                    Segmentation IRM contrôlée
                  </Link>
                </li>
                <li>
                  <Link to="/analyse-dicom" className="text-primary hover:underline">
                    Audit DICOM et structuration
                  </Link>
                </li>
                <li>
                  <Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className="text-primary hover:underline">
                    Structuration des biomarqueurs d’essais
                  </Link>
                </li>
              </ul>

              <p>
                La valeur scientifique de l’endpoint dépend
                davantage de sa structuration méthodologique
                que de la sophistication algorithmique seule.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un endpoint IRM multicentrique exige
                rigueur méthodologique, harmonisation technique
                et validation physiopathologique.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Échanger sur un projet d’essai clinique
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

export default CorelabEC;