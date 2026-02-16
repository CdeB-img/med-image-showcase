import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ShieldCheck,
  Database,
  Workflow,
  FileText,
  ArrowRight,
  BarChart3,
  AlertTriangle,
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
      "Audit technique DICOM, contrôle géométrique, harmonisation inter-centres et structuration de bases d'imagerie pour projets cliniques multicentriques.",
    url: CANONICAL,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Méthodologie", item: "https://noxia-imagerie.fr/methodologie-imagerie-quantitative" },
      { "@type": "ListItem", position: 4, name: "Analyse DICOM", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi auditer les métadonnées DICOM avant toute IA ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce qu'une erreur de spacing, d'orientation ou d'indexation peut invalider la quantification, même si l'image semble visuellement correcte.",
        },
      },
      {
        "@type": "Question",
        name: "La conversion DICOM vers NIfTI suffit-elle à sécuriser un pipeline ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. La conversion doit être contrôlée, traçable et associée à des vérifications de cohérence géométrique et de métadonnées critiques.",
        },
      },
      {
        "@type": "Question",
        name: "Quels livrables fournit un audit DICOM robuste ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Un rapport d'anomalies, une base structurée, des logs de transformation, des exclusions documentées et une traçabilité complète pour audit scientifique.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Analyse DICOM & structuration multicentrique | NOXIA</title>
        <meta
          name="description"
          content="Audit DICOM avancé, harmonisation multicentrique et structuration de bases d'images médicales. Contrôle géométrique, anonymisation et pipelines reproductibles pour recherche clinique."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Méthodologie", path: "/methodologie-imagerie-quantitative" },
                { label: "Analyse DICOM" },
              ]}
            />

            <section className="space-y-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Analyse DICOM et structuration multicentrique
                <span className="block text-primary mt-2">Sécuriser la donnée avant d'automatiser</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Audit technique, cohérence géométrique, contrôle des métadonnées critiques
                et structuration des jeux de données avant segmentation, IA et biomarqueurs.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Initier un audit DICOM
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Voir bases multicentriques
                  <Database className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-5 h-5 text-primary" />
                  Géométrie fiable
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Contrôle spacing, orientation, ordre des slices et cohérence inter-séries.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Métadonnées critiques
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Validation des tags nécessaires à la quantification (unités, protocole, reconstruction).
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Workflow className="w-5 h-5 text-primary" />
                  Chaîne traçable
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Conversion contrôlée, logs complets, exclusions documentées, livrables auditables.
                </p>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Le problème invisible: la métadonnée
              </h2>

              <p>
                Une erreur DICOM ne se voit pas toujours visuellement. Un volume peut paraître
                cohérent et rester analytiquement faux si la géométrie ou l'indexation est incorrecte.
              </p>

              <p>
                C'est pourquoi l'audit DICOM précède toute{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation IRM
                </Link>
                ,{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT
                </Link>{" "}
                et{" "}
                <Link to="/recalage-multimodal" className="text-primary hover:underline">
                  recalage multimodal
                </Link>
                .
              </p>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">Architecture d'audit DICOM</h2>

              <div className="grid md:grid-cols-2 gap-6 items-stretch">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Contrôles systématiques
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Qualification des séries et détection d'incomplétudes</li>
                    <li>2. Vérification géométrique (spacing, orientation, FOV)</li>
                    <li>3. Validation des tags quantitatifs et protocolaires</li>
                    <li>4. Détection des reconstructions multiples et doublons</li>
                    <li>5. Rapport d'anomalies et règles d'exclusion</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-primary" />
                    Structuration multicentrique
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Anonymisation harmonisée et mapping patient sécurisé</li>
                    <li>Hiérarchie patient/temps/modalité/séquence/reconstruction</li>
                    <li>Conversion DICOM vers NIfTI contrôlée et traçable</li>
                    <li>Conservation des correspondances UID et des logs</li>
                    <li>Exports prêts pour pipeline d'ingénierie quantitative</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Cas complexes fréquemment rencontrés
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Données incomplètes</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Séries tronquées ou slices manquantes</li>
                    <li>Reconstructions multiples non documentées</li>
                    <li>Incohérences d'horodatage dynamique</li>
                    <li>Anonymisation destructive des tags critiques</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Géométrie ambiguë</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Orientation oblique non prévue dans le pipeline</li>
                    <li>Spacing incohérent entre séries d'un même examen</li>
                    <li>Inversion d'axes et ordre de slices non conforme</li>
                    <li>Mélange de protocoles dans un même lot multicentrique</li>
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Ces situations imposent des règles explicites d'exclusion ou de rerun avant
                toute exploitation en{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie quantitative
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Signaux d'alerte fréquents en audit
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Anomalies géométriques</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Incohérences spacing/orientation inter-séries</li>
                    <li>Slices manquantes ou désordonnées</li>
                    <li>FOV et matrices incompatibles avec le protocole attendu</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Anomalies de métadonnées</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Tags indispensables absents ou inconsistants</li>
                    <li>Reconstructions non identifiées correctement</li>
                    <li>Mauvaise séparation des temps et séries dynamiques</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Risques sans audit en amont
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Segmentation correcte visuellement mais métriques quantitatives fausses</li>
                <li>Échecs silencieux de recalage et propagation d'erreurs</li>
                <li>Variabilité artificielle en analyses multicentriques</li>
                <li>Retraitement complet tardif, coûteux et retard de projet</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <FileText className="w-5 h-5 text-primary" />
                Livrables d'audit DICOM
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Rapport d'anomalies priorisées (géométrie, tags, séries)</li>
                <li>Journal de transformation DICOM vers NIfTI versionné</li>
                <li>Règles d'exclusion explicites et justifiées</li>
                <li>Dossier QA exploitable pour audit scientifique ou réglementaire</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Références & standards utiles</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>DICOM Standard (IOD, tags, cohérence géométrique)</li>
                <li>Guides de bonnes pratiques d'anonymisation en imagerie clinique</li>
                <li>Recommandations de QA pour pipelines d'imagerie quantitative</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Acronymes & livrables</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">IOD</div>
                  <p className="text-sm">Modèle d'objet DICOM attendu pour une modalité donnée.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">UID</div>
                  <p className="text-sm">Identifiant unique pour tracer séries et instances.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">QA</div>
                  <p className="text-sm">Contrôles automatiques et manuels de conformité.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Logs</div>
                  <p className="text-sm">Historique de transformation et décisions d'exclusion.</p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes - Analyse DICOM
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Quel est le minimum à vérifier avant conversion ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Géométrie, complétude des séries, tags protocolaires critiques et cohérence patient/temps.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Peut-on auditer un lot déjà traité ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Oui, avec reprise des logs et recalcul des contrôles QA pour identifier les points de dérive.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold">Comment ce travail s'intègre au pipeline global ?</h3>
                  <p className="text-muted-foreground mt-2">
                    L'audit DICOM est l'étape d'entrée de l'architecture d'ingénierie quantitative et de
                    l'harmonisation multicentrique.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Bases multicentriques <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ingenierie-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Ingénierie quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/recalage-multimodal"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Recalage multimodal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-6 pt-4">
              <p className="text-muted-foreground">
                Un audit précoce évite des mois de retraitement aval et sécurise la validité
                scientifique de tout le pipeline.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d'un audit DICOM
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
