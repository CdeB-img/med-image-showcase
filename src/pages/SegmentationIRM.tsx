import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Brain,
  Heart,
  CheckCircle2,
  FileText,
  Workflow,
  ShieldCheck,
  BarChart3,
  Database,
  ArrowRight,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/segmentation-irm";

const SegmentationIRM = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Segmentation IRM en recherche clinique",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    serviceType: [
      "Segmentation IRM",
      "Segmentation lésionnelle",
      "Quantification volumique",
      "Validation méthodologique",
      "Pipelines reproductibles",
    ],
    description:
      "Segmentation IRM cérébrale et cardiaque en recherche clinique : approche signal-driven, validation physiopathologique, reproductibilité, extraction de biomarqueurs quantitatifs et livrables traçables (DICOM/NIfTI).",
    url: CANONICAL,
  };

  return (
    <>
      <Helmet>
        <title>Segmentation IRM en recherche clinique | NOXIA</title>
        <meta
          name="description"
          content="Segmentation IRM cérébrale et cardiaque en recherche clinique. Approche signal-driven, validation méthodologique, livrables traçables (DICOM/NIfTI) et extraction de biomarqueurs quantitatifs."
        />
        <link rel="canonical" href={CANONICAL} />

        {/* Open Graph (optionnel mais recommandé) */}
        <meta property="og:title" content="Segmentation IRM en recherche clinique | NOXIA" />
        <meta
          property="og:description"
          content="Segmentation IRM (neuro & cardio) : pipelines reproductibles, validation inter-reader, biomarqueurs quantitatifs défendables."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        {/* JSON-LD */}
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
                Segmentation IRM en recherche clinique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Segmentation lésionnelle et tissulaire en IRM, orientée biomarqueurs :
                traçabilité DICOM/NIfTI, validation physiopathologique et reproductibilité
                pour études hospitalo-universitaires et projets multicentriques.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Discuter d’un besoin
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/projets"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 font-medium text-foreground hover:bg-muted/40 transition"
                >
                  Voir des démonstrations
                  <FileText className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* TL;DR EXEC */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Workflow className="w-5 h-5 text-primary" />
                    Ce que je livre
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Masques (NIfTI/DICOM), métriques volumétriques, exports tables (CSV/Excel),
                    scripts/pipeline, et un résumé QC traçable.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Ce qui est non-négociable
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Cohérence physiopathologique, séparation segmentation/visualisation/quantification,
                    et reproductibilité inter-centre.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Pour quoi faire
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Biomarkers exploitables pour analyses statistiques, publications,
                    validation méthodologique ou industrialisation contrôlée.
                  </p>
                </div>
              </div>
            </section>

            {/* DOMAINES */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Domaines d’application</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Brain className="w-5 h-5 text-primary" />
                    Neuro-imagerie
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Lésions ischémiques, tumorales ou inflammatoires. Intégration DWI/ADC,
                    FLAIR/T1/T2, perfusion, et suivi longitudinal (T0/T1/M6…).
                  </p>
                  <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Régions (core / pénombre / référence) et cohérence anatomique</li>
                    <li>Gestion multicentrique : protocoles hétérogènes, intensités, géométrie</li>
                    <li>Exports compatibles analyse statistique</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Heart className="w-5 h-5 text-primary" />
                    IRM cardiaque
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Segmentation endocardique/épicardique, LGE (PSIR/MAG),
                    quantification lésionnelle et tissulaire (infarct / MVO / œdème selon séquences).
                  </p>
                  <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Anneaux endo/épi + règles de cohérence myocardique</li>
                    <li>Robustesse aux artefacts (respiration, inhomogénéités)</li>
                    <li>Métriques volumiques et ratios défendables</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* VERROUS */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Verrous classiques en segmentation IRM</h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">
                <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Database className="w-5 h-5 text-primary" />
                    Données réelles ≠ datasets propres
                  </div>
                  <p>
                    Séquences multiples, champs de vue, résolutions, paramètres d’acquisition,
                    artefacts et variabilité inter-centre.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Validité scientifique
                  </div>
                  <p>
                    Un masque “joli” n’est pas un biomarqueur. Le pipeline doit documenter
                    hypothèses, seuils, post-traitements et impact sur les métriques.
                  </p>
                </div>
              </div>
            </section>

            {/* APPROCHE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">Approche méthodologique</h2>

              <p>
                L’objectif n’est pas de “faire tourner un modèle” mais de produire une
                segmentation exploitable, contrôlée et défendable. Les choix sont explicites :
                pré-traitement, normalisation, règles morphologiques, critères d’exclusion, et
                contrôle géométrique.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Contrôles systématiques
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Géométrie, orientation, spacing, cohérence DICOM ↔ NIfTI</li>
                    <li>Harmonisation inter-centre (si nécessaire, et documentée)</li>
                    <li>Validation intra/inter-observateur quand applicable</li>
                    <li>QC visuel + QC quantitatif (statistiques / distributions)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Workflow className="w-5 h-5 text-primary" />
                    IA : oui, mais cadrée
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Découpage clair : inférence ≠ vérité terrain</li>
                    <li>Post-traitements contrôlés (morpho, topologie)</li>
                    <li>Validation par cohérence physiopathologique</li>
                    <li>Traçabilité des versions / paramètres</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* LIVRABLES */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Livrables typiques</h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">
                <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <FileText className="w-5 h-5 text-primary" />
                    Segmentation & exports
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Masques NIfTI (et/ou DICOM SEG si requis)</li>
                    <li>Volumes/aires (ml, mm³), métriques dérivées</li>
                    <li>Exports par patient/temps/lecteur (CSV/Excel)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Traçabilité & QC
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Résumé méthodologique (paramètres, règles)</li>
                    <li>QC images/overlays pour revue rapide</li>
                    <li>Logs et versioning du pipeline</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* LIENS INTERNES */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages liées</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/analyse-dicom"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Analyse DICOM
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/recalibrage-multimodal"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Recalage multimodal
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Bases multicentriques
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/quantification-ct"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Quantification CT
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA FINAL */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Si vous avez un protocole multicentrique, un besoin de segmentation “niveau publication”,
                ou une contrainte de reproductibilité, l’échange initial sert à cadrer rapidement
                faisabilité, livrables et validation.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Contact
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

export default SegmentationIRM;