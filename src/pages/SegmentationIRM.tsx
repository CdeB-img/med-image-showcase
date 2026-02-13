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
                    Cohérence physiopathologique, segmentation/visualisation/quantification,
                    et reproductibilité.
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
            {/* EXPERTISE IRM CARDIAQUE – ESSAIS CLINIQUES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                IRM cardiaque translationnelle et essais thérapeutiques
              </h2>

              <p>
                L’activité en IRM cardiaque s’inscrit dans un contexte d’essais cliniques
                randomisés, d’études multicentriques et de corrélations histologiques.
                L’approche dépasse la segmentation volumique pour intégrer validation
                physiopathologique et interprétation biomarqueur.
              </p>

              <h3 className="text-lg font-semibold text-foreground pt-2">
                Quantification de l’ECV et corrélations histologiques
              </h3>

              <p>
                Contribution à la validation de l’Extracellular Volume (ECV) comme estimateur
                quantitatif de l’espace extracellulaire dans les cardiomyopathies hypertrophiques,
                avec corrélation directe aux biopsies septales.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Prélèvement sanguin immédiatement avant injection (hématocrite réel en décubitus)</li>
                <li>Contrôle pré-analytique (centrifugation, hydratation, variabilité biologique)</li>
                <li>Quantification segmentaire AHA</li>
                <li>Corrélation ECV ↔ fibrose histologique</li>
              </ul>

              <p>
                Participation à une cohorte de volontaires sains stratifiés par tranche d’âge
                afin d’établir les valeurs normales d’ECV et leur évolution physiologique.
              </p>

              <h3 className="text-lg font-semibold text-foreground pt-4">
                Biomarqueurs tissulaires : T1 / T2
              </h3>

              <ul className="list-disc pl-6 space-y-2">
                <li>T1 mapping : marqueur d’inflammation et expansion interstitielle</li>
                <li>T2 mapping : marqueur d’œdème (distinction critique avec artefacts de séquence)</li>
                <li>Analyse critique des confusions méthodologiques fréquentes</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground pt-4">
                Activité core-lab – IRM cardiaque multicentrique
              </h3>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  IDM – stratégies de reperfusion immédiate vs différée (évaluation nécrose et MVO)
                </li>
                <li>
                  Cohorte 2000 patients avec IRM à deux temps : remodelage ventriculaire gauche
                </li>
                <li>
                  Essais randomisés colchicine vs placebo dans l’IDM (évaluation lésion finale IRM)
                </li>
                <li>
                  Essai colchicine dans la myocardite (inclusion multicentrique)
                </li>
                <li>
                  Étude rétrospective maladie de Fabry (~100 sujets)
                </li>
                <li>
                  Cohortes institutionnelles : ~500 IRM cardiaques relues intégralement
                </li>
              </ul>

              <p>
                Ces travaux impliquent lecture centralisée, harmonisation multicentrique,
                contrôle qualité, segmentation, quantification et structuration
                des bases pour analyse statistique.
              </p>
            </section>
            {/* APPROCHE MÉTHODOLOGIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Approche méthodologique
              </h2>

              <p>
                Une segmentation IRM exploitable en recherche clinique repose sur une
                chaîne méthodologique explicite. L’objectif n’est pas d’obtenir un masque
                visuellement convaincant, mais de produire un biomarqueur quantifiable,
                reproductible et scientifiquement défendable.
              </p>

              <p>
                Chaque projet débute par un audit des données : géométrie, orientation,
                cohérence DICOM ↔ NIfTI, intégrité des métadonnées et stabilité inter-centre.
                Le pré-traitement est adapté à la séquence (IRM 3D, PSIR, DWI, FLAIR…)
                et peut inclure normalisation du signal, séparation hémisphérique,
                léger resampling contrôlé ou harmonisation multicentrique documentée.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle du spacing, orientation et cohérence géométrique</li>
                <li>Normalisation du signal lorsque nécessaire</li>
                <li>Pré-traitement spécifique à la séquence</li>
                <li>Harmonisation inter-centre traçable</li>
                <li>QC visuel et QC quantitatif systématique</li>
              </ul>

              <p>
                Lorsque des approches IA sont utilisées, elles s’inscrivent dans ce cadre :
                séparation claire entre inférence, post-traitement morphologique et
                extraction quantitative, avec traçabilité des paramètres et des versions.
              </p>
            </section>

            {/* VALIDATION DES MÉTHODES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation et comparaison des méthodes de segmentation
              </h2>

              <p>
                Les stratégies semi-automatiques ou automatiques doivent être évaluées
                face à une segmentation experte de référence. Le choix de la méthode dépend
                fortement de la séquence étudiée et du contexte physiopathologique.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>PSIR cardiaque : approches basées sur écart-type (SD)</li>
                <li>IRM 3D : méthodes FWHM adaptées au signal tissulaire</li>
                <li>Approche bullseye segmentaire avec biais homogène contrôlé</li>
                <li>Analyse des biais systématiques (surestimation, dispersion)</li>
                <li>Reproductibilité intra et inter-observateur</li>
              </ul>

              <p>
                L’objectif est d’identifier la méthode la plus robuste et la plus
                scientifiquement défendable dans le cadre de l’étude, en évaluant
                l’impact des choix de seuil sur les biomarqueurs finaux.
              </p>
            </section>

            {/* ÉVALUATION DE NOUVELLES SÉQUENCES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Évaluation de nouvelles séquences et biomarqueurs
              </h2>

              <p>
                L’introduction d’une nouvelle séquence nécessite une validation indépendante,
                comparée aux méthodes historiques et aux standards cliniques existants.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Validation du strain (speckle tracking) vs tagging historique</li>
                <li>Comparaison inter-logiciels (ex. CMR42 vs solutions alternatives)</li>
                <li>Évaluation de séquences avancées (T1 rho, mapping quantitatif…)</li>
                <li>Analyse de concordance et limites méthodologiques</li>
                <li>Impact sur les biomarqueurs cliniques dérivés</li>
              </ul>

              <p>
                Cette démarche permet de transformer une innovation technique en
                outil scientifiquement exploitable pour publication ou validation clinique.
              </p>
            </section>

            {/* VALIDATION INTER-LOGICIELS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation inter-logiciels et cohérence des mesures
              </h2>

              <p>
                Les solutions cliniques validées (ex. outils FDA) et les plugins de recherche
                peuvent produire des métriques divergentes. Une validation croisée
                permet d’objectiver la concordance réelle.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Transfert et harmonisation des ROI entre environnements</li>
                <li>Comparaison quantitative des valeurs produites</li>
                <li>Analyse de concordance et dispersion statistique</li>
                <li>Identification d’écarts méthodologiques implicites</li>
              </ul>

              <p>
                Cette analyse permet d’évaluer la fiabilité d’un outil de recherche
                face à une solution clinique de référence.
              </p>
            </section>

            {/* STRUCTURATION MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration et fiabilisation de bases multicentriques
              </h2>

              <p>
                Dans de nombreuses études multicentriques, les données sont centralisées
                progressivement, avec hétérogénéité des protocoles, anonymisation incomplète
                ou organisation non standardisée.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit complet des données DICOM</li>
                <li>Anonymisation harmonisée et conforme</li>
                <li>Détection des doublons et examens incomplets</li>
                <li>Structuration patient / temps / séquence</li>
                <li>Création d’une base exploitable pour analyse statistique</li>
              </ul>

              <p>
                L’objectif est de transformer un ensemble de données hétérogènes en
                base multicentrique propre, traçable et directement exploitable
                pour analyses quantitatives ou publications.
              </p>
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