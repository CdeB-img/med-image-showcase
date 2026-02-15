import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-imagerie-quantitative";

const CTImagerieQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT quantitatif en recherche clinique",
    description:
      "Développement, validation et harmonisation multicentrique de biomarqueurs CT : stabilité HU, calibration phantom, imagerie spectrale, perfusion et robustesse inter-constructeurs.",
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
        <title>CT quantitatif & biomarqueurs physiques | NOXIA</title>

        <meta
          name="description"
          content="CT quantitatif en recherche clinique : maîtrise des unités Hounsfield, calibration phantom, imagerie spectrale, perfusion CT et harmonisation multicentrique pour biomarqueurs robustes."
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
                CT quantitatif en recherche clinique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Transformer le scanner en outil décisionnel quantitatif :
                biomarqueurs physiquement cohérents, multicentriques
                et statistiquement exploitables.
              </p>
            </section>

            {/* PHYSIQUE FONDAMENTALE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                La physique avant l’algorithme
              </h2>

              <p>
                En CT, une unité Hounsfield (HU) n’est pas une constante universelle.
                Elle dépend du kernel de reconstruction, du filtre,
                de l’algorithme itératif, de l’énergie effective,
                du champ spectral et de l’implémentation constructeur.
              </p>

              <p>
                Sans calibration ni contrôle méthodologique,
                la variabilité technique peut dépasser la variation biologique étudiée.
                Le CT quantitatif exige donc une compréhension physique explicite
                avant toute interprétation statistique.
              </p>

              <p>
                Cette approche s’inscrit dans une logique globale
                d’
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie en imagerie quantitative
                </Link>.
              </p>
            </section>

            {/* STABILITÉ HU */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Stabilité des unités Hounsfield
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Impact des kernels de reconstruction</li>
                <li>Influence des reconstructions itératives</li>
                <li>Dérives énergétiques effectives</li>
                <li>Variabilité inter-constructeurs (GE, Siemens, Philips)</li>
                <li>Effets des reconstructions haute fréquence</li>
              </ul>

              <p>
                La calibration phantom (eau, matériaux connus)
                permet de documenter les dérives systématiques
                et de stabiliser les métriques quantitatives.
              </p>

              <p>
                Voir{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  Quantification CT
                </Link>.
              </p>
            </section>

            {/* SPECTRAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Imagerie spectrale & décomposition matière
              </h2>

              <p>
                Le dual-energy et le spectral CT permettent d’accéder
                aux composantes physiques du signal :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Décomposition Compton / Photoélectrique</li>
                <li>Reconstruction monoénergétique synthétique</li>
                <li>Analyse basse énergie (&lt;70 keV)</li>
                <li>Confrontation modèles physiques ↔ reconstructions constructeur</li>
              </ul>

              <p>
                L’enjeu est de produire un biomarqueur physiquement interprétable,
                non simplement dépendant d’un post-traitement logiciel.
              </p>

              <p>
                Voir{" "}
                <Link to="/ct-quantitatif-avance-imagerie-spectrale" className="text-primary hover:underline">
                  CT quantitatif avancé & imagerie spectrale
                </Link>.
              </p>
            </section>

            {/* PERFUSION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Perfusion CT quantitative
              </h2>

              <p>
                En neurovasculaire, la perfusion CT est un outil décisionnel majeur
                (Tmax, CBF, CBV, mismatch).
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle des modèles de déconvolution</li>
                <li>Comparaison inter-logiciels</li>
                <li>Stabilité volumique multi-seuil</li>
                <li>Nettoyage morphologique documenté</li>
                <li>Robustesse multicentrique</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                  CT perfusion quantitative & AVC
                </Link>.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique
              </h2>

              <p>
                En études multicentriques, la variabilité technique
                peut altérer la puissance statistique et biaiser les conclusions.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit systématique des métadonnées DICOM</li>
                <li>Détection reconstructions incompatibles</li>
                <li>Stratification centre-dépendante si nécessaire</li>
                <li>Stabilisation des distributions statistiques</li>
                <li>Traçabilité complète des transformations</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Harmonisation multicentrique
                </Link>.
              </p>
            </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Physique maîtrisée, biomarqueurs exploitables
              </h2>

              <p>
                Le CT quantitatif ne consiste pas à mesurer davantage,
                mais à mesurer correctement.
                La robustesse méthodologique prime sur la complexité algorithmique.
              </p>

              <p>
                L’objectif est de produire des paramètres interprétables,
                reproductibles et défendables en contexte académique,
                industriel ou réglementaire.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer ou auditer un biomarqueur CT multicentrique ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet CT
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

export default CTImagerieQuantitative;