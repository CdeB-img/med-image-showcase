import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/expertise";

const Expertise = () => {
  const faqItems = [
    {
      question: "Quelle est la différence entre une analyse d'image et un biomarqueur exploitable ?",
      answer:
        "Un biomarqueur exploitable repose sur une chaîne complète : audit des données, normalisation, segmentation contrôlée, métriques traçables et validation de reproductibilité.",
    },
    {
      question: "Pourquoi structurer les projets par modalité IRM et CT ?",
      answer:
        "Parce que les contraintes physiques diffèrent : en IRM la normalisation du signal est centrale, en CT la calibration et la stabilité des unités Hounsfield sont critiques.",
    },
    {
      question: "Pourquoi une page méthodologie séparée est-elle importante ?",
      answer:
        "Elle explicite le cadre scientifique commun aux projets, améliore la cohérence des livrables et renforce l'auditabilité multicentrique.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Expertise en imagerie médicale quantitative",
    description:
      "Expertise intégrée en IRM, CT et méthodologie multicentrique. Développement de biomarqueurs reproductibles, harmonisation inter-constructeurs et ingénierie quantitative en recherche clinique.",
    url: CANONICAL,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Expertise imagerie quantitative: IRM, CT, biomarqueurs | NOXIA</title>

        <meta
          name="description"
          content="Expertise en IRM et CT quantitatives: harmonisation multicentrique, validation méthodologique et biomarqueurs reproductibles pour projets cliniques."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise" },
              ]}
            />

            <ExpertiseHero
              badge="Vue d'ensemble"
              badgeIcon={Workflow}
              title="Expertise en imagerie médicale quantitative"
              description="Transformer des images cliniques hétérogènes en biomarqueurs reproductibles, multicentriques et physiquement cohérents."
              chips={["IRM", "CT", "Méthodologie"]}
              enhanced
              actions={[
                { label: "Parler d'un projet", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir la méthodologie", to: "/methodologie-imagerie-quantitative", variant: "secondary", icon: BarChart3 },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Définition de l’expertise NOXIA en imagerie quantitative</h2>
              <p className="text-muted-foreground leading-relaxed">
                L'expertise NOXIA couvre l'IRM quantitative, le CT quantitatif et la méthodologie multicentrique pour produire des biomarqueurs défendables. La différence se fait sur l'architecture complète: audit DICOM, normalisation, règles de mesure explicites, contrôles QA et traçabilité. L'objectif n'est pas de générer des cartes visuelles, mais des endpoints robustes pour décision clinique et recherche.
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Une approche architecturée, non opportuniste
              </h2>

              <p className="text-muted-foreground leading-relaxed text-center max-w-4xl mx-auto">
                L’imagerie quantitative ne consiste pas à empiler des outils. Elle repose sur une architecture
                méthodologique cohérente intégrant audit DICOM, contrôle géométrique, normalisation signal,
                segmentation contrôlée et extraction métrique traçable.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Reproductibilité
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Règles explicites, versioning et QA pour réduire la variabilité technique.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Workflow className="w-5 h-5 text-primary" />
                    Pipeline opposable
                  </div>
                  <p className="text-sm text-muted-foreground">
                    De la donnée brute au livrable statistique, chaque transformation est traçable.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    Multicentrique
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cohérence inter-centres et inter-constructeurs pour des endpoints défendables.
                  </p>
                </div>
              </div>
            </section>

            <section id="quantification-tissulaire" className="space-y-8 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-center text-foreground">Champs d’intervention</h2>
              <p className="text-center text-muted-foreground">
                Vue transversale IRM/CT disponible sur le hub{" "}
                <Link to="/quantification-tissulaire" className="text-primary hover:underline">
                  Quantification tissulaire
                </Link>
                .
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <article className="rounded-2xl border border-border bg-card/50 p-7 space-y-4 h-full">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Brain className="w-5 h-5 text-primary" />
                    IRM quantitative
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    IRM cardiaque (LGE, T1/T2 mapping, ECV), neuro-imagerie post-AVC, structuration Core Lab
                    et endpoints d’essais thérapeutiques.
                  </p>

                  <Link
                    to="/irm-imagerie-quantitative"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Explorer l’IRM
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>

                <article className="rounded-2xl border border-border bg-card/50 p-7 space-y-4 h-full">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    CT quantitatif
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    CT spectral, décomposition matière, stabilité HU, perfusion AVC, calibration phantom
                    et harmonisation inter-constructeurs.
                  </p>

                  <Link
                    to="/ct-imagerie-quantitative"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Explorer le CT
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>

                <article className="rounded-2xl border border-border bg-card/50 p-7 space-y-4 h-full">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Workflow className="w-5 h-5 text-primary" />
                    Méthodologie
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Audit DICOM, hiérarchisation des bases, harmonisation inter-sites et intégration contrôlée
                    d’IA dans des flux reproductibles.
                  </p>

                  <Link
                    to="/methodologie-imagerie-quantitative"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Explorer la méthodologie
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">Parcours recommandés</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <article className="rounded-2xl border border-border bg-card/50 p-6 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground">Investigation clinique</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Définir des endpoints robustes par modalité et préparer des analyses défendables
                    pour protocoles cliniques et publications.
                  </p>
                  <Link
                    to="/biomarqueurs-irm-cardiaque-essais-cliniques"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Voir les endpoints IRM
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>

                <article className="rounded-2xl border border-border bg-card/50 p-6 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground">Core Lab & multicentrique</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Harmoniser lectures, règles de segmentation et livrables pour réduire
                    la variance inter-centres et sécuriser l’exploitation statistique.
                  </p>
                  <Link
                    to="/corelab-essais-cliniques"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Voir l'approche Core Lab
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>

                <article className="rounded-2xl border border-border bg-card/50 p-6 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground">Data & méthodologie</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Structurer les données DICOM, contrôler la géométrie et définir un pipeline
                    versionné avant l’intégration d’outils IA.
                  </p>
                  <Link
                    to="/analyse-dicom"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Commencer par l'audit DICOM
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">Méthodologie transversale</h2>

              <p className="text-muted-foreground leading-relaxed">
                Les pages modalité ne sont pas des silos. Elles partagent une même base méthodologique:
                qualification des données, règles de mesure explicites, validation de robustesse et livrables auditables.
                Ce socle est détaillé sur la{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  page Méthodologie
                </Link>
                {" "}et implémenté dans les pages{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  Ingénierie quantitative
                </Link>
                ,{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  Analyse DICOM
                </Link>
                {" "}et{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques
                </Link>
                .
              </p>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Audit d'entrée avant toute quantification (géométrie, métadonnées, cohérence temporelle)</li>
                <li>Séparation stricte visualisation / inférence / mesure pour éviter les biais cachés</li>
                <li>Contrôles QA entrée/sortie et critères d'exclusion documentés</li>
                <li>Versioning code, dépendances, paramètres et exports statistiques</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Repères quantitatifs issus de la littérature
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">IRM</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Variabilités inter-lecteur souvent de l'ordre de 5-15% sans standardisation forte.</li>
                    <li>T1/T2 mapping: variations inter-centre de quelques pourcents selon champ et séquence.</li>
                    <li>Amélioration nette de la reproductibilité avec protocoles et QA harmonisés.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">CT</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Écarts HU inter-système de plusieurs unités, accentués par kernel et reconstruction.</li>
                    <li>Perfusion et spectral sensibles aux choix de post-traitement et à la calibration.</li>
                    <li>Harmonisation inter-vendor indispensable avant comparaison multicentrique.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-6 items-stretch">
              <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Ce qui différencie l’approche</h2>

                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Séparation stricte visualisation / segmentation / quantification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Normalisation intra-sujet lorsque nécessaire</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Analyse multi-seuil pour robustesse statistique</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Calibration physique indépendante en CT</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Validation translationnelle lorsque possible</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 to-primary/5 p-8 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Socle opérationnel</h3>

                <p className="text-muted-foreground leading-relaxed">
                  L’automatisation n’est intégrée qu’après validation méthodologique. L’IA est évaluée,
                  auditée et contrôlée. Elle ne remplace jamais l’architecture scientifique.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Plusieurs milliers d’examens analysés en contexte clinique réel, structuration de Core Labs
                  cœur–cerveau, harmonisation inter-constructeurs et validation multicentrique.
                </p>

                <div className="pt-2">
                  <Link
                    to="/ingenierie-imagerie-quantitative"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Voir l’ingénierie quantitative
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes - Expertise imagerie quantitative
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {faqItems.map((item, index) => (
                  <div
                    key={item.question}
                    className={`rounded-xl border border-border bg-card/50 p-6 ${index === 2 ? "md:col-span-2" : ""}`}
                  >
                    <h3 className="font-semibold text-foreground">{item.question}</h3>
                    <p className="text-muted-foreground mt-2">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/irm-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ct-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  CT quantitatif <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/methodologie-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Méthodologie <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ingenierie-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Ingénierie quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Core Lab IRM <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/40 p-6 md:p-8 space-y-6 text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">Prêt à cadrer votre projet ?</h2>

              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Le cadrage initial conditionne la qualité finale des biomarqueurs. Nous pouvons définir un plan
                pragmatique adapté à votre modalité, vos contraintes multicentriques et vos objectifs d’étude.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Parler d'un projet
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/prestations-imagerie-medicale"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-8 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Découvrir les prestations
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Expertise;
