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
      "Développement et validation de biomarqueurs CT quantitatifs : calibration physique, imagerie spectrale, perfusion, harmonisation multicentrique et robustesse inter-constructeurs.",
    about: [
      "Quantitative CT",
      "Spectral CT",
      "Dual Energy CT",
      "CT Perfusion",
      "Hounsfield Units stability",
      "Material decomposition",
      "Phantom calibration",
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
          CT quantitatif & biomarqueurs physiques | NOXIA
        </title>

        <meta
          name="description"
          content="CT quantitatif en recherche clinique : stabilité HU, calibration phantom, imagerie spectrale, perfusion CT et harmonisation multicentrique pour biomarqueurs robustes."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="CT quantitatif en recherche clinique" />
        <meta
          property="og:description"
          content="Physique maîtrisée, calibration et harmonisation multicentrique en CT quantitatif."
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
                CT quantitatif en recherche clinique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Transformation des données scanner en biomarqueurs
                physiquement cohérents, multicentriques et statistiquement robustes.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                La physique avant l’algorithme
              </h2>

              <p>
                En CT, une unité Hounsfield n’est pas une constante universelle.
                Elle dépend du kernel, de l’algorithme itératif, de l’énergie effective
                et de l’implémentation constructeur.
              </p>

              <p>
                Sans calibration ni harmonisation, la variabilité technique
                peut dépasser l’effet biologique étudié.
                Le CT quantitatif exige donc une maîtrise physique
                avant toute interprétation statistique.
              </p>
            </section>

            {/* STABILITÉ HU */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Stabilité des valeurs HU
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Impact des kernels de reconstruction</li>
                <li>Influence des reconstructions itératives</li>
                <li>Variabilité inter-constructeurs (GE / Siemens / Philips)</li>
                <li>Dérives énergétiques effectives</li>
              </ul>

              <p>
                Une analyse comparative et une calibration phantom
                permettent de documenter et corriger ces écarts.
              </p>

              <p>
                Voir{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  Quantification CT
                </Link>.
              </p>
            </section>

            {/* IMAGERIE SPECTRALE */}
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
                <li>Comparaison modèles physiques vs reconstructions constructeur</li>
              </ul>

              <p>
                Ces approches s’inscrivent dans{" "}
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
                En contexte neurovasculaire, la perfusion CT
                nécessite une stabilisation méthodologique :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle des algorithmes de déconvolution</li>
                <li>Comparaison Tmax, CBF, CBV selon implémentation</li>
                <li>Stabilité volumétrique des seuils cliniques</li>
                <li>Robustesse multicentrique</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                  CT perfusion quantitative dans l’AVC
                </Link>.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique
              </h2>

              <p>
                La variabilité inter-centre peut altérer la puissance statistique.
                Une structuration adaptée permet :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit systématique des métadonnées DICOM</li>
                <li>Détection des reconstructions incompatibles</li>
                <li>Stratification centre-dépendante si nécessaire</li>
                <li>Stabilisation des distributions statistiques</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques
                </Link>.
              </p>
            </section>

            {/* INGÉNIERIE */}
            <section className="space-y-6 text-center text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Ingénierie quantitative intégrée
              </h2>

              <p>
                Le CT quantitatif s’intègre dans une architecture globale
                d’ingénierie méthodologique :
                contrôle DICOM, calibration, extraction métrique,
                traçabilité et validation.
              </p>

              <Link
                to="/ingenierie-imagerie-quantitative"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
              >
                Voir l’ingénierie quantitative
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un biomarqueur CT robuste
                nécessite une maîtrise physique et méthodologique complète.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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