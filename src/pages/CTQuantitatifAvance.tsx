import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale";

const CTQuantitatifAvance = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT quantitatif avancé et imagerie spectrale",
    description:
      "Développement, calibration et validation de biomarqueurs CT robustes : imagerie spectrale, monoénergétique, décomposition matière, modèles physiques et harmonisation multicentrique.",
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType": "Researchers"
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
        <title>CT quantitatif avancé & imagerie spectrale | NOXIA</title>

        <meta
          name="description"
          content="Imagerie spectrale, reconstruction monoénergétique et décomposition matière en CT. Calibration phantom, validation physique et harmonisation inter-constructeurs."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-28">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT quantitatif avancé & imagerie spectrale
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Développement de biomarqueurs CT fondés sur la physique du signal,
                la décomposition matière et une validation méthodologique
                rigoureuse en contexte multicentrique.
              </p>
            </section>

            {/* PROBLÈME FONDAMENTAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                L’illusion de la stabilité des HU
              </h2>

              <p>
                Une valeur Hounsfield n’est pas une constante universelle.
                Elle dépend :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Du kernel de reconstruction</li>
                <li>De l’algorithme itératif</li>
                <li>De l’énergie effective du faisceau</li>
                <li>Du constructeur et de la version logicielle</li>
                <li>Des paramètres d’injection et du timing</li>
              </ul>

              <p>
                En étude multicentrique, la variabilité technique peut dépasser
                la variation biologique étudiée. Sans calibration indépendante,
                un biomarqueur CT devient centre-dépendant.
              </p>

              <p>
                Voir également{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Harmonisation multicentrique
                </Link>.
              </p>
            </section>

            {/* IMAGERIE SPECTRALE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Imagerie spectrale & modèles physiques
              </h2>

              <p>
                Le dual-energy et le CT spectral permettent d’accéder
                aux composantes physiques sous-jacentes du signal :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Décomposition Compton / Photoélectrique</li>
                <li>Reconstruction monoénergétique synthétique</li>
                <li>Cartes matériaux spécifiques</li>
                <li>Analyse des comportements basse énergie (&lt;70 keV)</li>
              </ul>

              <p>
                Implémentation et confrontation de modèles inspirés
                des équations de décomposition type Alvarez,
                avec comparaison directe aux reconstructions constructeur.
              </p>

              <p>
                L’enjeu n’est pas la reproduction visuelle,
                mais la cohérence métrique inter-système.
              </p>
            </section>

            {/* CALIBRATION PHYSIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Calibration indépendante & validation
              </h2>

              <p>
                Toute quantification avancée doit être confrontée
                à une validation physique indépendante.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Calibration phantom eau / matériaux de référence</li>
                <li>Correction des dérives énergétiques</li>
                <li>Comparaison monoénergétique simulé vs constructeur</li>
                <li>Analyse des biais systématiques inter-vendor</li>
                <li>Reproductibilité intra / inter-machine</li>
              </ul>

              <p>
                Cette étape transforme un outil technique
                en biomarqueur scientifiquement défendable.
              </p>
            </section>

            {/* APPLICATIONS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications cliniques et translationnelles
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Quantification fibrose / inflammation</li>
                <li>Analyse calcium et matériaux spécifiques</li>
                <li>Perfusion CT avancée</li>
                <li>Comparaison reconstructions monoénergétiques</li>
                <li>Validation de biomarqueurs industriels</li>
              </ul>

              <p>
                Ces travaux s’intègrent dans une logique globale d’
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie en imagerie quantitative
                </Link>{" "}
                et de{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT clinique
                </Link>.
              </p>
            </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Physique maîtrisée, biomarqueur exploitable
              </h2>

              <p>
                L’expertise ne se limite pas à la compréhension des équations.
                Elle consiste à transformer cette compréhension
                en paramètres reproductibles, statistiquement robustes
                et exploitables en contexte clinique, réglementaire ou industriel.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Un développement en CT quantitatif nécessite d’abord une validation physique explicite.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet spectral
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

export default CTQuantitatifAvance;