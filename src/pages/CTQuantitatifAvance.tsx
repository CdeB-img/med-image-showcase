import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Atom,
  AlertTriangle
} from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale";

const CTQuantitatifAvance = () => {
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "CT quantitatif avancé et imagerie spectrale",
  description:
    "Imagerie spectrale, reconstruction monoénergétique et décomposition matière en CT. Calibration phantom, validation physique indépendante et harmonisation inter-constructeurs.",
  about: [
    "Dual-energy CT",
    "Spectral CT",
    "Monoenergetic reconstruction",
    "Material decomposition",
    "Compton and photoelectric decomposition",
    "Hounsfield unit variability",
    "Phantom calibration",
    "Multicenter CT reproducibility"
  ],
  specialty: [
    "Radiology",
    "Medical physics",
    "Quantitative imaging research"
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

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Accueil",
      item: "https://noxia-imagerie.fr/"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Expertise",
      item: "https://noxia-imagerie.fr/expertise"
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "CT quantitatif avancé",
      item: CANONICAL
    }
  ]
};
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Les unités Hounsfield sont-elles comparables entre centres ?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Non. Les valeurs HU dépendent du kernel, de l’algorithme itératif, de l’énergie effective et du constructeur. Des écarts de 5 à 20 HU peuvent apparaître entre systèmes."
      }
    },
    {
      "@type": "Question",
      name: "Le CT spectral améliore-t-il réellement la quantification ?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Oui sous conditions. La décomposition Compton / photoélectrique et les reconstructions monoénergétiques réduisent certains biais, mais nécessitent calibration phantom et validation indépendante."
      }
    }
  ]
};
  return (
    <>
      <Helmet>
        <title>CT quantitatif avancé & imagerie spectrale | NOXIA</title>

        <meta
          name="description"
          content="Imagerie spectrale, reconstruction monoénergétique et décomposition matière en CT. Calibration phantom, validation physique et harmonisation inter-constructeurs."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(faqJsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">
      <Breadcrumb
        items={[
          { label: "Accueil", path: "/" },
          { label: "Expertise", path: "/expertise" },
          { label: "CT quantitatif avancé" }
        ]}
      />

            {/* HERO */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT quantitatif avancé
                <span className="block text-primary mt-3">
                  Imagerie spectrale & biomarqueurs physiquement opposables
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transformer la physique du signal CT en paramètres
                reproductibles, calibrés et multicentriques.
              </p>

              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  to="/quantification-ct"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 hover:bg-muted/40 transition"
                >
                  Quantification CT clinique
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
            <section className="space-y-6">

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Atom className="w-5 h-5 text-primary" />
                  Décomposition physique
                </div>
                <p className="text-muted-foreground text-sm">
                  Modélisation Compton / Photoélectrique,
                  reconstruction monoénergétique et cohérence basse énergie.
                </p>
              </div>
            </section>
 
            {/* IMAGERIE SPECTRALE */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Imagerie spectrale & décomposition physique
              </h2>

              <div className="grid md:grid-cols-2 gap-10">

                {/* Colonne gauche */}
                <div className="space-y-6 text-muted-foreground">

                  <p>
                    Le dual-energy et le CT spectral permettent d’accéder
                    aux composantes physiques du signal.
                  </p>

                  <ul className="space-y-3 list-disc pl-6">
                    <li>Décomposition Compton / Photoélectrique</li>
                    <li>Reconstructions monoénergétiques synthétiques</li>
                    <li>Cartes matériaux spécifiques</li>
                    <li>Analyse comportement basse énergie (&lt;70 keV)</li>
                  </ul>

                </div>

                {/* Colonne droite */}
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">

                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <Atom className="w-5 h-5 text-primary shrink-0" />
                    Modèles physiques & validation
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Implémentation de modèles inspirés des équations de décomposition
                    type Alvarez, avec confrontation systématique aux reconstructions
                    constructeur et analyse des écarts métriques inter-systèmes.
                  </p>

                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">
                      Objectif : cohérence physique inter-vendor,
                      pas reproduction visuelle.
                    </p>
                  </div>

                </div>

              </div>
            </section>
            {/* PROBLÈME FONDAMENTAL */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-8 space-y-6">
              <h2 className="text-3xl font-semibold">
                L’illusion de la stabilité des unités Hounsfield
              </h2>

              <p className="text-muted-foreground">
                Une valeur HU n’est pas une constante universelle.
                Elle dépend du kernel, de l’algorithme itératif,
                de l’énergie effective et du constructeur.
              </p>

              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-lg font-medium">
                  Variabilité inter-vendor rapportée : <span className="text-primary">5 à 20 HU</span>
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Sans calibration indépendante, un biomarqueur CT devient centre-dépendant.
                </p>
              </div>
            </section>



          {/* CALIBRATION INDÉPENDANTE */}
          <section className="space-y-10">
            <h2 className="text-2xl font-semibold text-foreground">
              Calibration indépendante & validation physique
            </h2>

            <div className="grid md:grid-cols-2 gap-10">

              {/* Colonne gauche */}
              <div className="space-y-6 text-muted-foreground">

                <p>
                  Toute quantification avancée doit être confrontée à une validation physique indépendante.
                </p>

                <ul className="space-y-3 list-disc pl-6">
                  <li>Calibration phantom eau / matériaux de référence</li>
                  <li>Correction des dérives énergétiques</li>
                  <li>Analyse des biais systématiques inter-vendor</li>
                  <li>Reproductibilité intra / inter-machine</li>
                </ul>

              </div>

              {/* Colonne droite */}
              <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">

                <div className="flex items-center gap-3 font-semibold text-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  Impact méthodologique
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Une calibration indépendante transforme un outil technique
                  en biomarqueur scientifiquement défendable
                  et multicentriquement exploitable.
                </p>

                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">
                    Sans calibration externe, la variabilité technique
                    peut dépasser la variation biologique étudiée.
                  </p>
                </div>

              </div>

            </div>
          </section>
            {/* ARCHITECTURE PIPELINE */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture méthodologique d’un biomarqueur CT robuste
              </h2>

              <div className="grid md:grid-cols-2 gap-12">

                <div className="space-y-6 text-muted-foreground">
                  <p>
                    Un biomarqueur CT exploitable repose sur une séquence méthodologique explicite.
                  </p>

                  <ul className="space-y-3 list-disc pl-6">
                    <li>Audit DICOM & paramètres énergétiques critiques</li>
                    <li>Calibration phantom indépendante</li>
                    <li>Stratification inter-constructeurs</li>
                    <li>Extraction métrique versionnée</li>
                    <li>Analyse statistique intra / inter-scanner</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/60 p-8 space-y-5">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                    Principe central
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    L’objectif n’est pas l’amélioration visuelle,
                    mais la production d’une valeur physiquement cohérente
                    et multicentriquement exploitable.
                  </p>
                </div>

              </div>
            </section>



          {/* APPLICATIONS CLINIQUES */}
          <section className="space-y-10">
            <h2 className="text-2xl font-semibold text-foreground">
              Applications cliniques et translationnelles
            </h2>

            <div className="grid md:grid-cols-2 gap-10">

              {/* Colonne gauche */}
              <div className="space-y-6 text-muted-foreground">

                <ul className="space-y-3 list-disc pl-6">
                  <li>Quantification fibrose / inflammation</li>
                  <li>Analyse calcium et matériaux spécifiques</li>
                  <li>Perfusion CT avancée</li>
                  <li>Comparaison reconstructions monoénergétiques</li>
                  <li>Validation de biomarqueurs industriels</li>
                </ul>

                <p>
                  Ces travaux s’intègrent dans une logique globale d’
                  <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                    ingénierie en imagerie quantitative
                  </Link>{" "}
                  et de{" "}
                  <Link to="/quantification-ct" className="text-primary hover:underline">
                    quantification CT clinique
                  </Link>.
                </p>

              </div>

              {/* Colonne droite */}
              <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">

                <div className="flex items-center gap-3 font-semibold text-foreground">
                  <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                  Position translationnelle
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  L’objectif est de produire des paramètres exploitables
                  en contexte multicentrique, industriel ou réglementaire,
                  et non des indicateurs dépendants d’un système unique.
                </p>

                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">
                    Un biomarqueur robuste doit conserver sa cohérence
                    malgré la variabilité technique inter-système.
                  </p>
                </div>

              </div>

            </div>
          </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Physique maîtrisée, biomarqueur exploitable
              </h2>

              <p>
                L’expertise ne se limite pas à la compréhension des équations.
                Elle consiste à transformer cette compréhension
                en paramètres reproductibles, statistiquement robustes
                et exploitables en contexte clinique, réglementaire ou industriel.
              </p>
            </section>
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Points méthodologiques clés
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <h3 className="font-semibold mb-2">Calibration phantom</h3>
                  <p className="text-muted-foreground text-sm">
                    Validation indépendante avant toute exploitation biomarqueur.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6">
                  <h3 className="font-semibold mb-2">Analyse inter-constructeurs</h3>
                  <p className="text-muted-foreground text-sm">
                    Stratification Siemens / GE / Philips si nécessaire.
                  </p>
                </div>

              </div>
            </section>

        <section className="rounded-2xl border border-border/50 bg-card/50 p-8 space-y-8">
          <h2 className="text-2xl font-semibold">
            Données & consensus internationaux
          </h2>

          <div className="grid md:grid-cols-2 gap-8">

            <div>
              <h3 className="font-semibold mb-3">Reproductibilité rapportée</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Variabilité HU inter-constructeur : 5–20 HU</li>
                <li>Amélioration contraste monoénergétique : +30–50%</li>
                <li>Coefficient variation perfusion CT : 5–12%</li>
                <li>Bruit amplifié &lt;70 keV sans correction physique</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Consensus & guidelines</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Guidelines on Dual-Energy CT</li>
                <li>CT perfusion reproducibility recommendations</li>
                <li>Phantom calibration standards</li>
                <li>Spectral CT quantification position papers</li>
              </ul>
            </div>

          </div>
        </section>
  



            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes – CT quantitatif
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Les unités Hounsfield sont-elles comparables entre centres ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Des écarts de 5 à 20 HU peuvent apparaître selon kernel,
                    énergie effective et constructeur.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Le CT spectral améliore-t-il la quantification ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Oui sous conditions : calibration phantom,
                    validation indépendante et contrôle inter-vendor sont indispensables.
                  </p>
                </div>

              </div>
            </section>        
            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Un développement en CT quantitatif nécessite d’abord une validation physique explicite.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet spectral
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

export default CTQuantitatifAvance;