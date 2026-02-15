import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/methodologie-imagerie-quantitative";

const MethodologieImagerieQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Méthodologie en imagerie quantitative IRM & CT",
    description:
      "Architecture méthodologique complète pour transformer des données DICOM hétérogènes en biomarqueurs quantitatifs robustes, reproductibles et multicentriques en IRM et CT.",
    about: [
      "Medical image processing methodology",
      "Reproducible imaging biomarkers",
      "Multicenter harmonization",
      "DICOM audit",
      "Image normalization",
      "Quantitative MRI",
      "Quantitative CT"
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
        <title>Méthodologie en Imagerie Quantitative | NOXIA</title>

        <meta
          name="description"
          content="Architecture méthodologique complète pour biomarqueurs IRM et CT : audit DICOM, normalisation, harmonisation multicentrique, calibration physique et reproductibilité statistique."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Méthodologie en Imagerie Quantitative" />
        <meta
          property="og:description"
          content="Conception de pipelines robustes pour biomarqueurs IRM et CT en recherche clinique multicentrique."
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
                Méthodologie en imagerie quantitative
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Une architecture explicite, traçable et reproductible
                pour transformer des données DICOM hétérogènes
                en biomarqueurs scientifiquement défendables.
              </p>
            </section>

            {/* PHILOSOPHIE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du signal brut au biomarqueur exploitable
              </h2>

              <p>
                Un biomarqueur d’imagerie ne se réduit pas à un masque
                ou à une valeur volumique. Il est le produit d’une chaîne
                méthodologique complète intégrant :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle des métadonnées et cohérence géométrique</li>
                <li>Normalisation du signal et des unités physiques</li>
                <li>Segmentation guidée par règles physiopathologiques</li>
                <li>Extraction métrique versionnée</li>
                <li>Analyse de robustesse inter-seuil et inter-centre</li>
              </ul>

              <p>
                L’objectif est de dissocier clairement visualisation,
                segmentation et quantification,
                afin de stabiliser les distributions statistiques
                et réduire les biais centre-dépendants.
              </p>
            </section>

            {/* CHAÎNE STRUCTURÉE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture méthodologique type
              </h2>

              <p>
                Une chaîne robuste repose sur des étapes distinctes,
                documentées et auditables :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Audit exhaustif des{" "}
                  <Link to="/analyse-dicom" className="text-primary hover:underline">
                    métadonnées DICOM
                  </Link>
                </li>
                <li>Détection des reconstructions multiples et incohérences</li>
                <li>Conversion contrôlée DICOM → NIfTI si nécessaire</li>
                <li>Resampling géométrique explicite</li>
                <li>Normalisation intra-sujet (ex. hémisphère contrôle) ou populationnelle</li>
                <li>Segmentation contrôlée et reproductible</li>
                <li>Nettoyage morphologique 2D puis filtrage 3D</li>
                <li>Extraction multi-seuils pour analyse de stabilité</li>
                <li>Logs complets, QA automatisé et versioning</li>
              </ul>

              <p>
                Chaque transformation doit pouvoir être reproduite
                indépendamment du logiciel utilisé.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique
              </h2>

              <p>
                En contexte multicentrique, la variabilité technique
                peut dépasser la variabilité biologique étudiée.
                La méthodologie doit donc intégrer :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Analyse inter-constructeurs IRM & CT</li>
                <li>Contrôle des séquences et reconstructions</li>
                <li>Stratification centre-dépendante si nécessaire</li>
                <li>Calibration phantom en CT</li>
                <li>Documentation systématique des biais identifiés</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques & harmonisation
                </Link>.
              </p>
            </section>

            {/* IRM */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Spécificités IRM
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Normalisation signal dépendante séquence</li>
                <li>Distinction stricte T1 / T2 / perfusion / diffusion</li>
                <li>Seeds physiopathologiques explicites</li>
                <li>Propagation contrôlée (hystérésis 3D)</li>
              </ul>

              <p>
                Applications détaillées :
                {" "}
                <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                  IRM quantitative
                </Link>{" "}
                et{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  Core Lab IRM
                </Link>.
              </p>
            </section>

            {/* CT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Spécificités CT
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle stabilité HU</li>
                <li>Impact kernels et reconstructions itératives</li>
                <li>Analyse énergétique et spectral CT</li>
                <li>Calibration physique indépendante</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/ct-imagerie-quantitative" className="text-primary hover:underline">
                  CT quantitatif
                </Link>{" "}
                et{" "}
                <Link to="/ct-quantitatif-avance-imagerie-spectrale" className="text-primary hover:underline">
                  CT avancé & spectral
                </Link>.
              </p>
            </section>

            {/* PRINCIPES DIRECTEURS */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Reproductibilité avant automatisation
              </h2>

              <p>
                L’automatisation n’a de valeur que si la méthodologie est stable.
                L’IA ne corrige pas une architecture fragile.
              </p>

              <p>
                La robustesse méthodologique constitue le socle
                de tout biomarqueur exploitable en contexte académique,
                industriel ou réglementaire.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer ou auditer une chaîne d’imagerie quantitative ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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

export default MethodologieImagerieQuantitative;