import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Database, Workflow, FileText, ArrowRight } from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/analyse-dicom";

const AnalyseDICOM = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Analyse DICOM et structuration de bases multicentriques",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    serviceType: [
      "Audit DICOM",
      "Structuration multicentrique",
      "Anonymisation",
      "Contrôle métadonnées",
      "Conversion DICOM NIfTI"
    ],
    description:
      "Audit et structuration de données DICOM pour recherche clinique multicentrique. Contrôle géométrique, harmonisation inter-constructeurs et pipelines reproductibles.",
    url: CANONICAL,
  };

  return (
    <>
      <Helmet>
        <title>Analyse DICOM & structuration multicentrique | NOXIA</title>
        <meta
          name="description"
          content="Audit DICOM, harmonisation multicentrique et structuration de bases d’images médicales. Contrôle géométrique, anonymisation et pipelines reproductibles pour recherche clinique."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">

            {/* HERO */}
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Analyse DICOM & structuration multicentrique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Audit technique, harmonisation inter-centres et préparation méthodologique
                de bases d’imagerie pour projets cliniques exigeants.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un audit
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {/* TL;DR */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Database className="w-5 h-5 text-primary" />
                    Ce qui est vérifié
                  </div>
                  <p className="text-muted-foreground">
                    Géométrie voxel, orientation, cohérence séries, unités physiques,
                    métadonnées critiques.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Workflow className="w-5 h-5 text-primary" />
                    Ce qui est livré
                  </div>
                  <p className="text-muted-foreground">
                    Base structurée patient / temps / séquence,
                    mapping UID, logs d’audit et documentation.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Objectif
                  </div>
                  <p className="text-muted-foreground">
                    Sécuriser toute la chaîne avant segmentation,
                    IA ou extraction biomarqueur.
                  </p>
                </div>

              </div>
            </section>

            {/* ENJEUX */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Pourquoi l’audit DICOM est indispensable
              </h2>

              <p>
                Les métadonnées DICOM déterminent la validité de toute mesure.
                Un spacing erroné, une orientation incohérente ou une série mal indexée
                invalident immédiatement les volumes extraits.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle de la cohérence géométrique inter-séries</li>
                <li>Détection des reconstructions multiples non documentées</li>
                <li>Validation des unités (HU, ADC, T1…)</li>
                <li>Harmonisation inter-constructeurs</li>
              </ul>
            </section>

            {/* STRUCTURATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration multicentrique
              </h2>

              <p>
                Les bases multicentriques nécessitent une hiérarchisation explicite :
                patient → temps → modalité → séquence → reconstruction.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Anonymisation harmonisée</li>
                <li>Mapping UID traçable</li>
                <li>Conversion maîtrisée DICOM → NIfTI</li>
                <li>Logs de transformation</li>
              </ul>
            </section>

            {/* LIENS INTERNES */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 space-y-4">
              <h2 className="text-xl font-semibold">Pages liées</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/segmentation-irm" className="link-pill">Segmentation IRM</Link>
                <Link to="/quantification-ct" className="link-pill">Quantification CT</Link>
                <Link to="/bases-multicentriques" className="link-pill">Bases multicentriques</Link>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Un audit DICOM précoce évite des mois de retraitement ultérieur.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Initier un audit
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