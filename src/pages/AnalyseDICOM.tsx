import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ShieldCheck,
  Database,
  Workflow,
  FileText,
  ArrowRight,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/analyse-dicom";

const AnalyseDICOM = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Analyse DICOM et structuration multicentrique",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    serviceType: [
      "DICOM audit",
      "Multicenter data structuring",
      "DICOM anonymization",
      "Metadata validation",
      "DICOM to NIfTI controlled conversion",
    ],
    description:
      "Audit technique DICOM, contrôle géométrique, harmonisation inter-centres et structuration de bases d’imagerie pour projets cliniques multicentriques.",
    url: CANONICAL,
  };

  return (
    <>
      <Helmet>
        <title>Analyse DICOM & structuration multicentrique | NOXIA</title>

        <meta
          name="description"
          content="Audit DICOM avancé, harmonisation multicentrique et structuration de bases d’images médicales. Contrôle géométrique, anonymisation et pipelines reproductibles pour recherche clinique."
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
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Analyse DICOM & structuration multicentrique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Sécuriser la donnée avant toute segmentation, IA ou extraction
                de biomarqueur. Audit technique, cohérence géométrique et
                harmonisation inter-constructeurs.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un audit
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {/* PROBLÈME FONDAMENTAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Le problème invisible : la métadonnée
              </h2>

              <p>
                Toute quantification repose sur la validité des métadonnées DICOM.
                Un spacing erroné, une orientation incohérente, une série mal indexée
                ou une reconstruction multiple non documentée invalident immédiatement
                les volumes extraits.
              </p>

              <p>
                L’erreur ne se voit pas toujours visuellement.
                Elle devient critique au moment de l’analyse statistique.
              </p>
            </section>

            {/* CE QUI EST CONTRÔLÉ */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Ce qui est systématiquement contrôlé
              </h2>

              <div className="grid md:grid-cols-2 gap-8 text-muted-foreground leading-relaxed">

                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    Cohérence géométrique
                  </div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Spacing voxel et anisotropie</li>
                    <li>Orientation patient</li>
                    <li>Ordre des slices</li>
                    <li>Détection séries incomplètes</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Métadonnées critiques
                  </div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Unités physiques (HU, ADC, T1…)</li>
                    <li>Tags constructeurs spécifiques</li>
                    <li>Reconstructions multiples</li>
                    <li>Incohérences inter-séries</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* STRUCTURATION MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration de bases multicentriques
              </h2>

              <p>
                Une base multicentrique doit être hiérarchisée explicitement :
                patient → temps → modalité → séquence → reconstruction.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Anonymisation harmonisée et traçable</li>
                <li>Mapping UID patient sécurisé</li>
                <li>Conversion contrôlée DICOM → NIfTI</li>
                <li>Logs complets de transformation</li>
                <li>Détection doublons et séries aberrantes</li>
              </ul>

              <p>
                Cette structuration est le socle de toute{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation multicentrique
                </Link>.
              </p>
            </section>

            {/* CHAÎNE MÉTHODOLOGIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Intégration dans la chaîne quantitative
              </h2>

              <p>
                L’analyse DICOM précède et sécurise :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <Link to="/segmentation-irm" className="text-primary hover:underline">
                    Segmentation IRM
                  </Link>
                </li>
                <li>
                  <Link to="/quantification-ct" className="text-primary hover:underline">
                    Quantification CT
                  </Link>
                </li>
                <li>
                  <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                    Perfusion CT
                  </Link>
                </li>
                <li>
                  <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                    Ingénierie quantitative
                  </Link>
                </li>
              </ul>

              <p>
                Une erreur DICOM non détectée en amont
                peut compromettre l’ensemble du pipeline.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Sécuriser avant d’automatiser
              </h2>

              <p>
                L’automatisation n’a de sens que si la donnée
                est géométriquement valide et physiquement cohérente.
              </p>

              <p>
                L’audit DICOM n’est pas une étape administrative.
                C’est une étape scientifique.
              </p>
            </section>

            {/* CTA FINAL */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Un audit précoce évite des mois de retraitement ultérieur.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Initier un audit DICOM
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

export default AnalyseDICOM;