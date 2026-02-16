import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Workflow,
  ShieldCheck,
  Database,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCode,
} from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/methodologie-imagerie-quantitative";

const MethodologieImagerieQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Méthodologie en imagerie quantitative IRM et CT",
    description:
      "Cadre méthodologique complet pour transformer des données DICOM hétérogènes en biomarqueurs quantitatifs robustes, traçables et multicentriques.",
    about: [
      "Medical image processing methodology",
      "Reproducible imaging biomarkers",
      "Multicenter harmonization",
      "DICOM audit",
      "Image normalization",
      "Quantitative MRI",
      "Quantitative CT",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    url: CANONICAL,
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Architecture méthodologique en imagerie quantitative",
    serviceType: [
      "Audit DICOM",
      "Structuration multicentrique",
      "Normalisation IRM et CT",
      "Validation de robustesse",
      "Pipeline reproductible et audit-ready",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Conception et validation de chaînes méthodologiques IRM/CT opposables pour essais cliniques et recherche translationnelle.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Méthodologie", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi la méthodologie précède-t-elle l'automatisation ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce qu'une automatisation appliquée à des données instables amplifie les biais. Le cadre méthodologique définit les règles, les contrôles et la traçabilité avant toute IA.",
        },
      },
      {
        "@type": "Question",
        name: "Un pipeline peut-il être reproductible sans versioning strict ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Reproductibilité et auditabilité exigent versioning du code, des dépendances, des paramètres et des jeux d'entrée/sortie.",
        },
      },
      {
        "@type": "Question",
        name: "Comment éviter que la variabilité multicentrique masque l'effet biologique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Par audit DICOM, harmonisation des protocoles, normalisation explicite, stratification centre/constructeur et validation statistique continue.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Méthodologie en Imagerie Quantitative | NOXIA</title>
        <meta
          name="description"
          content="Cadre méthodologique complet pour biomarqueurs IRM et CT : audit DICOM, normalisation, harmonisation multicentrique, calibration physique et robustesse statistique."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="Méthodologie en Imagerie Quantitative" />
        <meta
          property="og:description"
          content="Architecture méthodologique robuste pour biomarqueurs IRM et CT en recherche clinique multicentrique."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Méthodologie" },
              ]}
            />

            <ExpertiseHero
              badge="Méthodologie"
              badgeIcon={Workflow}
              title="Méthodologie en imagerie quantitative"
              description="Construire une chaîne explicite, versionnée et reproductible pour transformer des données DICOM hétérogènes en biomarqueurs défendables en IRM et en CT."
              chips={["Audit-ready", "Multicentrique", "Reproductible"]}
              actions={[
                { label: "Structurer une méthodologie", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir l'ingénierie quantitative", to: "/ingenierie-imagerie-quantitative", variant: "secondary", icon: BarChart3 },
              ]}
            />

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Reproductibilité
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Versioning complet et règles explicites pour relier chaque résultat à un run traçable.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Workflow className="w-5 h-5 text-primary" />
                  Pipeline opposable
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Audit DICOM, normalisation, segmentation, métriques, QA et livrables structurés.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-5 h-5 text-primary" />
                  Multicentrique
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Harmonisation inter-centres et inter-constructeurs pour stabiliser la variance technique.
                </p>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du signal brut au biomarqueur exploitable
              </h2>

              <p>
                Un biomarqueur n'est pas une simple valeur extraite. C'est le résultat d'un enchaînement
                méthodologique dont chaque étape doit être définie, contrôlée et justifiable.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Qualification des entrées (métadonnées et géométrie)</li>
                <li>Séparation stricte visualisation, inférence et mesure</li>
                <li>Règles de normalisation explicites par modalité</li>
                <li>Validation de robustesse (inter-seuils, inter-centres)</li>
                <li>Traçabilité complète des transformations et exclusions</li>
              </ul>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture méthodologique type
              </h2>

              <div className="grid md:grid-cols-2 gap-6 items-stretch">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Maillage du pipeline
                  </h3>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Audit DICOM et contrôle géométrique</li>
                    <li>2. Structuration multicentrique et règles de conversion</li>
                    <li>3. Pré-traitement et normalisation explicite</li>
                    <li>4. Segmentation contrôlée + critères d'exclusion</li>
                    <li>5. Extraction métrique + QA + exports auditables</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 to-primary/5 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Checklist qualité
                  </h3>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Code + dépendances + paramètres versionnés</li>
                    <li>Logs d'exécution et décisions de rerun conservés</li>
                    <li>Contrôles entrée/sortie systématiques</li>
                    <li>Gestion explicite des échecs (fallback/documentation)</li>
                    <li>Livrables exploitables en biostatistique et audit</li>
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Voir aussi{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  Analyse DICOM
                </Link>
                ,{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques
                </Link>{" "}
                et{" "}
                <Link to="/recalage-multimodal" className="text-primary hover:underline">
                  Recalage multimodal
                </Link>
                .
              </p>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Spécificités par modalité
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Méthodologie IRM</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Normalisation dépendante séquence et champ</li>
                    <li>Distinction T1/T2/perfusion/diffusion</li>
                    <li>Références intra-sujet pour limiter les biais</li>
                    <li>Validation inter-centres explicite (1.5T/3T)</li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/irm-imagerie-quantitative"
                      className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Voir IRM quantitative <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Méthodologie CT</h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Contrôle des kernels et reconstructions itératives</li>
                    <li>Calibration phantom et stabilité HU</li>
                    <li>Gestion énergie effective et spectral CT</li>
                    <li>Analyse reproductibilité inter-scanner</li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/ct-imagerie-quantitative"
                      className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Voir CT quantitatif <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Repères chiffrés méthodologiques
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">IRM</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Variabilité T1/T2 inter-centres: ordre de grandeur 2-6%</li>
                    <li>Écarts absolus ECV inter-centres: souvent 2-4%</li>
                    <li>ICC volumes ventriculaires: souvent &gt; 0.9 en conditions contrôlées</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">CT</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Écarts HU inter-scanner: souvent +/-5 à +/-10 HU selon kernel</li>
                    <li>Tolérance calibration eau phantom visée: +/-3 HU</li>
                    <li>Sensibilité accrue de certains paramètres spectral/perfusion aux dérives</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Risques d'une architecture méthodologique fragile
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Biais techniques interprétés comme signaux biologiques</li>
                <li>Inflation des faux positifs ou dilution d'effet traitement</li>
                <li>Incohérences inter-centres non détectées en amont</li>
                <li>Retraitements lourds en phase tardive de projet</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Acronymes & livrables</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">QA / QC</div>
                  <p className="text-sm">Contrôles qualité entrée/sortie et justification des exclusions.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">ICC / CV</div>
                  <p className="text-sm">Indicateurs de reproductibilité inter-lecteurs et inter-centres.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">DICOM / NIfTI</div>
                  <p className="text-sm">Format clinique source et format analytique contrôlé.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Logs</div>
                  <p className="text-sm">Historique run, paramètres et versions pour audit scientifique.</p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes - Méthodologie quantitative
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Pourquoi distinguer inférence et mesure ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Pour éviter qu'un comportement algorithmique instable contamine la métrique finale.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Faut-il documenter toutes les exclusions ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Oui. Une exclusion non tracée dégrade l'auditabilité et la reproductibilité du résultat.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold">Quand intégrer l'IA dans le pipeline ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Après stabilisation du cadre méthodologique et définition des contrôles de robustesse.
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
                  to="/recalage-multimodal"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Recalage multimodal <ArrowRight className="w-4 h-4" />
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
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Une méthodologie explicite transforme l'imagerie en outil décisionnel quantitatif,
                plutôt qu'en support visuel difficilement comparable.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Définir le cadre méthodologique
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
