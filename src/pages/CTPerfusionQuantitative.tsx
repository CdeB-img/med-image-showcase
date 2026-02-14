import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-perfusion-quantitative-avc";

const CTPerfusionQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT Perfusion quantitative en phase aiguë",
    description:
      "Développement et validation de pipelines robustes pour la quantification Tmax, CBF, CBV et mismatch en CT perfusion dans le cadre d’AVC ischémique et d’études multicentriques.",
    about: [
      "CT Perfusion",
      "Tmax threshold",
      "CBF 30 percent",
      "Ischemic core CT",
      "Perfusion mismatch",
      "Stroke imaging",
      "Multicenter CT harmonization"
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
          CT Perfusion quantitative & AVC | NOXIA
        </title>

        <meta
          name="description"
          content="Quantification robuste Tmax, CBF et mismatch en CT perfusion. Harmonisation multicentrique, validation méthodologique et extraction volumique reproductible."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta
          property="og:title"
          content="CT Perfusion quantitative en phase aiguë"
        />
        <meta
          property="og:description"
          content="Pipelines robustes de quantification Tmax et CBF en CT perfusion pour recherche clinique multicentrique."
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
                CT Perfusion quantitative en phase aiguë
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                De la cartographie colorimétrique au biomarqueur volumique
                défendable : structuration méthodologique de Tmax, CBF et mismatch
                en contexte AVC et essais multicentriques.
              </p>
            </section>

            {/* PROBLÈME */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Tmax ≥ 6s n’est pas une constante universelle
              </h2>

              <p>
                Les cartes de perfusion CT dépendent fortement du modèle
                de déconvolution, du choix de l’AIF, du filtrage temporel,
                du lissage spatial et de l’implémentation logicielle.
              </p>

              <p>
                Deux plateformes différentes peuvent produire des volumes
                significativement divergents pour un même patient.
                Sans cadre méthodologique explicite, le biomarqueur devient
                centre-dépendant.
              </p>
            </section>

            {/* PIPELINE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture d’un pipeline robuste
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit complet des séries dynamiques DICOM</li>
                <li>Vérification cohérence temporelle et bolus</li>
                <li>Masque cérébral automatisé</li>
                <li>Resampling géométrique documenté</li>
                <li>Seuils volumétriques explicitement définis</li>
                <li>Nettoyage morphologique 2D puis filtrage 3D</li>
                <li>Extraction métrique versionnée et traçable</li>
              </ul>

              <p>
                L’objectif n’est pas seulement de générer une carte,
                mais de produire un volume reproductible et exploitable statistiquement.
              </p>
            </section>

            {/* SEUILS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Analyse multi-seuil et stabilité volumique
              </h2>

              <p>
                Les seuils classiques (Tmax ≥ 6s, CBF &lt; 30%)
                sont historiquement établis mais restent sensibles
                à l’implémentation.
              </p>

              <p>
                Une approche robuste consiste à analyser la stabilité
                volumique sur plusieurs seuils afin d’évaluer
                la sensibilité du biomarqueur aux choix méthodologiques.
              </p>

              <p>
                Cette logique s’inscrit dans l’{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie en imagerie quantitative
                </Link>.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique
              </h2>

              <p>
                En contexte multicentrique, la variabilité technique
                peut dépasser l’effet biologique étudié.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Comparaison inter-logiciels</li>
                <li>Documentation centre-dépendante</li>
                <li>Détection anomalies d’acquisition</li>
                <li>Stabilisation statistique des distributions volumétriques</li>
              </ul>

              <p>
                Voir également{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques
                </Link>.
              </p>
            </section>

            {/* APPLICATIONS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Sélection thrombectomie</li>
                <li>Évaluation mismatch diffusion / perfusion</li>
                <li>Essais thérapeutiques AVC</li>
                <li>Comparaison CT perfusion vs IRM métabolique</li>
              </ul>
            </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                De l’image colorée au biomarqueur défendable
              </h2>

              <p>
                La perfusion CT ne doit pas être un simple affichage.
                Elle peut devenir un outil décisionnel quantitatif,
                structuré et reproductible lorsque la méthodologie
                est explicitement définie.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer ou valider un pipeline CT perfusion ?
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

export default CTPerfusionQuantitative;