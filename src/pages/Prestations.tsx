import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/prestations-imagerie-medicale";

const Prestations = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Prestations en imagerie médicale quantitative",
    description:
      "CoreLab IRM & CT, structuration multicentrique, audit méthodologique, reprise d’études existantes et ingénierie quantitative en recherche clinique.",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    areaServed: "France & Europe",
    url: CANONICAL
  };

  return (
    <>
      <Helmet>
        <title>Prestations | CoreLab & Imagerie Quantitative | NOXIA</title>
        <meta
          name="description"
          content="Prestations en IRM et CT quantitatif : CoreLab externalisé, structuration multicentrique, audit méthodologique, reprise d’études existantes et développement d’outils sur mesure."
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
                Prestations en imagerie médicale quantitative
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                CoreLab IRM & CT, structuration multicentrique,
                ingénierie méthodologique et reprise d’études existantes.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Un partenaire méthodologique indépendant
              </h2>

              <p>
                NOXIA intervient comme structure indépendante,
                spécialisée dans l’analyse avancée d’imagerie en contexte
                hospitalo-universitaire et multicentrique.
              </p>

              <p>
                L’objectif n’est pas uniquement de produire des résultats,
                mais de construire un flux d’analyse robuste, traçable,
                reproductible et scientifiquement défendable.
              </p>
            </section>

            {/* CORELAB */}
            
            <section id="corelab"  className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                CoreLab IRM & CT externalisé
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Structuration complète du circuit image</li>
                <li>Définition protocolaire imagerie</li>
                <li>Formation des centres investigateurs</li>
                <li>Centralisation & contrôle qualité multicentrique</li>
                <li>Relectures médicales et gestion des écarts</li>
                <li>Production de biomarqueurs quantitatifs validés</li>
              </ul>

              <p>
                Adapté aux RHU, PHRC, ANR, essais randomisés
                et partenariats industriels.
              </p>
            </section>

            {/* REPRISE ETUDES */}
            <section id="reprise" className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Reprise d’études déjà réalisées
              </h2>

              <p>
                Intervention sur études existantes présentant :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Anonymisation incomplète ou hétérogène</li>
                <li>Problèmes de cohérence géométrique</li>
                <li>Absence de traçabilité des traitements</li>
                <li>Pipelines non reproductibles</li>
                <li>Résultats difficilement publiables</li>
              </ul>

              <p>
                Reprise complète possible :
                reconstruction de base multicentrique,
                détection des doublons, identification des examens incomplets,
                harmonisation inter-centres et reconstruction d’un flux défendable.
              </p>
            </section>

            {/* AUDIT */}
            <section id="audit" className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Audit méthodologique & harmonisation
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Analyse critique d’un pipeline existant</li>
                <li>Évaluation de la reproductibilité</li>
                <li>Harmonisation inter-constructeurs</li>
                <li>Calibration phantom & validation technique</li>
                <li>Évaluation et intégration contrôlée d’outils IA</li>
              </ul>
            </section>

            {/* INGENIERIE */}
            <section id="ingenierie" className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Développement & ingénierie sur mesure
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Développement Python scientifique dédié</li>
                <li>Modules 3D Slicer spécifiques</li>
                <li>Automatisation de flux DICOM / NIfTI</li>
                <li>Structuration data & architecture serveur</li>
              </ul>

              <p>
                Chaque outil est conçu comme un objet méthodologique explicite,
                jamais comme une simple démonstration technique.
              </p>
            </section>

            {/* MODALITES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Modalités d’intervention
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Mission ponctuelle ciblée</li>
                <li>Accompagnement long terme d’étude</li>
                <li>Support expert sur analyse complexe</li>
                <li>Partenariat R&D industriel</li>
              </ul>

              <p>
                Intervention possible en amont (conception),
                pendant l’étude (structuration) ou en aval (reprise & consolidation).
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-6">
              <p className="text-muted-foreground">
                Toute collaboration débute par un échange exploratoire
                permettant d’identifier les besoins méthodologiques réels.
              </p>

              <Link
                to="/contact"
                className="inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’une collaboration
              </Link>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Prestations;