import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  ShieldCheck,
  Workflow,
  Layers,
  BarChart3,
  AlertTriangle,
  Database,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/recalage-multimodal";

const RecalageMultimodal = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Recalage multimodal IRM / CT en recherche clinique",
    description:
      "Alignement géométrique contrôlé pour analyses longitudinales et multimodales, avec validation qualitative et quantitative des transformations.",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    url: CANONICAL,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Recalage multimodal", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi le recalage est-il critique avant quantification ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce qu'un défaut d'alignement introduit des biais spatiaux qui se propagent vers segmentation, volumétrie et biomarqueurs, même si l'image paraît acceptable.",
        },
      },
      {
        "@type": "Question",
        name: "Quand utiliser un recalage rigide, affine ou non-linéaire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Rigide pour corriger translation/rotation, affine pour ajouter l'échelle et le cisaillement, non-linéaire pour modéliser les déformations anatomiques locales.",
        },
      },
      {
        "@type": "Question",
        name: "Comment valider un recalage en pratique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Par contrôle visuel systématique, métriques quantitatives adaptées (Dice, TRE, distances de contours), et traçabilité complète des paramètres de transformation.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Recalage multimodal IRM / CT en recherche clinique | NOXIA</title>
        <meta
          name="description"
          content="Recalage multimodal IRM et CT pour études longitudinales et projets multicentriques. Alignement géométrique rigoureux, validation méthodologique et intégration dans pipelines quantitatifs."
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
                { label: "Recalage multimodal" },
              ]}
            />

            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Recalage multimodal IRM / CT
                <span className="block text-primary mt-2">Alignement fiable avant biomarqueurs</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Alignement géométrique contrôlé pour analyses longitudinales, multimodales
                et multicentriques. Un recalage robuste conditionne la validité quantitative.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Intégrer un recalage robuste
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ingenierie-imagerie-quantitative"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Voir l'ingénierie quantitative
                  <Database className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Robustesse
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Réduction des biais spatiaux qui dégradent segmentation et mesures quantitatives.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Workflow className="w-5 h-5 text-primary" />
                  Pipeline maîtrisé
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Paramètres explicites, stratégie multi-résolution et validation systématique.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Layers className="w-5 h-5 text-primary" />
                  Multimodal et longitudinal
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  IRM/CT, visites successives, et comparabilité anatomique entre temps et modalités.
                </p>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Le recalage comme socle méthodologique
              </h2>

              <p>
                Toute extraction volumique suppose un espace de référence cohérent. Un alignement
                approximatif introduit des erreurs souvent discrètes visuellement mais majeures
                statistiquement.
              </p>

              <p>
                En pratique, le recalage s'intègre en amont de la{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation IRM
                </Link>
                , de la{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT
                </Link>{" "}
                et de l'{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  audit DICOM
                </Link>
                .
              </p>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">Architecture d'un recalage contrôlé</h2>

              <div className="grid md:grid-cols-2 gap-6 items-stretch">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-primary" />
                    Workflow technique
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Pré-traitements géométriques et masques de pertinence</li>
                    <li>2. Choix de la métrique (MI, CC, SSD) selon modalité</li>
                    <li>3. Optimisation multi-résolution et contraintes de régularité</li>
                    <li>4. Application et sauvegarde des transformations</li>
                    <li>5. Contrôles visuels et quantitatifs systématiques</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Checklist qualité
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Convergence contrôlée et absence de déformations aberrantes</li>
                    <li>Vérification contours/structures d'intérêt post-alignement</li>
                    <li>Mesures de recouvrement (Dice) et erreurs de repères (TRE)</li>
                    <li>Traçabilité complète des paramètres et versions</li>
                    <li>Gestion explicite des cas d'échec et reruns</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Typologies de recalage en pratique
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Monomodal longitudinal</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>IRM vers IRM ou CT vers CT multi-visites</li>
                    <li>Comparaison de progression lésionnelle</li>
                    <li>Stabilisation anatomique pour suivi volumique</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Multimodal IRM / CT</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Fusion structure/fonction ou anatomie/paramétrique</li>
                    <li>Métriques adaptées aux contrastes hétérogènes</li>
                    <li>Validation renforcée des zones frontières</li>
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                La stratégie retenue dépend de la question clinique, de la modalité
                et du niveau de déformation attendu entre acquisitions.
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Repères de validation
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Qualitatif</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Superposition visuelle des structures anatomiques cibles</li>
                    <li>Cohérence des contours en zones à fort gradient</li>
                    <li>Absence de distorsion anatomique non plausible</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Quantitatif</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Dice, Hausdorff, TRE selon cas d'usage</li>
                    <li>Suivi de stabilité inter-temps/inter-centres</li>
                    <li>Seuils d'acceptation définis avant analyse finale</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Risques d'un recalage insuffisamment contrôlé
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Propagation d'erreurs dans segmentation et mesures de volume</li>
                <li>Incohérences longitudinales interprétées comme progression pathologique</li>
                <li>Biais centre-dépendants en contexte multicentrique</li>
                <li>Perte de confiance dans les endpoints quantitatifs</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Workflow className="w-5 h-5 text-primary" />
                Livrables de recalage
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Matrices et champs de transformation versionnés</li>
                <li>Jeux d'images recalées et overlays de contrôle visuel</li>
                <li>Métriques de validation (Dice, TRE, distances) par cas</li>
                <li>Journal des paramètres et critères d'acceptation</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Références & standards utiles</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>ITK/ANTs bonnes pratiques de registration médicale</li>
                <li>Consensus sur validation de recalage en imagerie clinique</li>
                <li>Cadres QA/QC pour pipelines longitudinaux et multimodaux</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Acronymes & livrables</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">MI / CC / SSD</div>
                  <p className="text-sm">Métriques de similarité selon type de modalité.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">TRE</div>
                  <p className="text-sm">Target Registration Error sur points de repère.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Dice</div>
                  <p className="text-sm">Indice de recouvrement des structures segmentées.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Warp field</div>
                  <p className="text-sm">Champ de transformation sauvegardé et réutilisable.</p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes - Recalage multimodal
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Faut-il toujours un recalage non-linéaire ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Le modèle de transformation dépend de l'objectif, de la modalité et du niveau
                    de déformation attendu.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Comment choisir la métrique de similarité ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Selon la modalité et le contraste: MI pour multimodal, CC/SSD pour monomodal.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold">Quel est le minimum pour un audit de recalage ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Paramètres versionnés, résultats qualitatifs documentés, métriques quantitatives
                    et règles d'acceptation explicites.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/analyse-dicom"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Analyse DICOM <ArrowRight className="w-4 h-4" />
                </Link>
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
              </div>
            </section>

            <section className="text-center space-y-6 pt-4">
              <p className="text-muted-foreground">
                Un recalage robuste n'est pas une étape cosmétique: c'est une condition de validité
                pour toute conclusion quantitative.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d'un projet de recalage
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

export default RecalageMultimodal;
