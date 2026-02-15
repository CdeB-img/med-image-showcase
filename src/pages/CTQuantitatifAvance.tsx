import React from "react";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Atom,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Brain
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale";

const CTQuantitatifAvance = () => {
  // MAJ du JSON-LD pour matcher les 4 questions de la FAQ et enrichir le contexte
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
      "Hounsfield unit variability",
      "Phantom calibration",
      "Multicenter CT reproducibility"
    ],
    specialty: ["Radiology", "Medical physics", "Quantitative imaging research"],
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
          text: "Non. Les valeurs HU dépendent du kernel, de l’algorithme itératif, de l’énergie effective et du constructeur. Des écarts de 5 à 20 HU peuvent apparaître entre systèmes."
        }
      },
      {
        "@type": "Question",
        name: "Le CT spectral améliore-t-il réellement la quantification ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui sous conditions. La décomposition Compton / photoélectrique et les reconstructions monoénergétiques réduisent certains biais, mais nécessitent calibration phantom et validation indépendante."
        }
      },
      {
        "@type": "Question",
        name: "Pourquoi une calibration phantom est-elle nécessaire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Elle permet de mesurer la dérive instrumentale et de convertir les valeurs machine-dépendantes en grandeurs physiques absolues (densité électronique, Z effectif)."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la variabilité inter-constructeur ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sans harmonisation, la variabilité technique peut dépasser la variation biologique d'intérêt. L'harmonisation réduit ce bruit de fond méthodologique."
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

              <div className="flex justify-center gap-4 flex-wrap pt-2">
                <Link
                  to="/quantification-ct"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 hover:bg-muted/40 transition font-medium"
                >
                  Quantification CT clinique
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition font-medium"
                >
                  Étude de faisabilité
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* BANDEAU INTRO FULL-WIDTH (Ex-section orpheline) */}
            <section className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 font-semibold text-foreground text-lg">
                <Atom className="w-6 h-6 text-primary shrink-0" />
                Décomposition physique du signal
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                L'imagerie quantitative moderne ne se contente plus de niveaux de gris. 
                Elle repose sur la modélisation des interactions Compton / Photoélectrique, 
                la reconstruction monoénergétique synthétique et la maîtrise de la cohérence basse énergie.
              </p>
            </section>

            {/* SECTION 1 : SPECTRAL */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Imagerie spectrale & décomposition physique
              </h2>

              <div className="grid md:grid-cols-2 gap-12 items-start">
                
                {/* Colonne Gauche : Contexte + Liste */}
                <div className="space-y-6 text-muted-foreground">
                  <p className="leading-relaxed">
                    Le dual-energy et le CT spectral permettent de s'affranchir partiellement 
                    des artefacts de durcissement de faisceau et d'accéder aux propriétés 
                    intrinsèques de la matière, notamment dans des approches de {" "}
                    <Link to="/quantification-ct" className="text-primary hover:underline">
                    quantification CT clinique
                    </Link>.
                  </p>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Décomposition Compton / Photoélectrique</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Reconstructions monoénergétiques (40-190 keV)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Cartographie de densité électronique (Z-eff)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Analyse du comportement spectral (&lt;70 keV)</span>
                    </li>
                  </ul>
                </div>

                {/* Colonne Droite : Focus Technique */}
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <Brain className="w-5 h-5 text-primary shrink-0" />
                    Modèles physiques & validation
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Implémentation de modèles inspirés des équations de décomposition 
                    type Alvarez-Macovski, avec confrontation systématique aux reconstructions 
                    constructeur.
                  </p>
                  <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">
                      Objectif : Cohérence physique inter-vendor plutôt que reproduction visuelle flatteuse.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION BREAK : LE PROBLÈME (Pattern visuel distinct) */}
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-10 space-y-6 text-center md:text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-32 h-32" />
              </div>
              
              <h2 className="text-3xl font-semibold text-foreground relative z-10">
                L’illusion de la stabilité des unités Hounsfield
              </h2>

              <div className="grid md:grid-cols-3 gap-8 relative z-10">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Une valeur HU n’est pas une constante universelle. 
                    Elle dépend du kernel, de l’algorithme itératif, 
                    de l’énergie effective et du constructeur.
                    Sans calibration, comparer deux patients revient à comparer deux devises sans taux de change.
                  </p>
                </div>
                <div className="rounded-xl bg-background/80 border border-border p-6 shadow-sm flex flex-col justify-center items-center md:items-start">
                  <p className="text-3xl font-bold text-primary">5 à 20 HU</p>
                  <p className="text-sm text-muted-foreground mt-1">Variabilité inter-vendor sans calibration</p>
                </div>
              </div>
            </section>

            {/* SECTION 2 : CALIBRATION */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Calibration indépendante & validation physique
              </h2>

              <div className="grid md:grid-cols-2 gap-12 items-start">

                {/* Colonne Gauche */}
                <div className="space-y-6 text-muted-foreground">
                  <p className="leading-relaxed">
                    Pour dépasser l'analyse visuelle, toute quantification avancée doit être 
                    confrontée à une validation physique indépendante ("Ground Truth").
                    Cette étape s’inscrit dans une logique d’
                      <Link to="/harmonisation-multicentrique" className="text-primary hover:underline">
                      harmonisation multicentrique {" "}
                      </Link>
                      indispensable en recherche clinique.
                  </p>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Calibration phantom (eau / inserts tissulaires)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Correction des dérives énergétiques temporelles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Harmonisation des biais systématiques inter-vendor</span>
                    </li>
                  </ul>
                </div>

                {/* Colonne Droite */}
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    Impact méthodologique
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Une calibration indépendante transforme un outil technique 
                    en biomarqueur scientifiquement défendable.
                  </p>
                  <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">
                      Sans calibration externe, la variabilité technique 
                      peut dépasser la variation biologique étudiée.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 3 : ARCHITECTURE */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture d’un biomarqueur CT robuste
              </h2>

              <div className="grid md:grid-cols-2 gap-12 items-start">

                {/* Colonne Gauche */}
                <div className="space-y-6 text-muted-foreground">
                  <p className="leading-relaxed">
                    Un biomarqueur CT exploitable repose sur une séquence méthodologique 
                    explicite, documentée et versionnée.
                    La robustesse dépend aussi d’une {" "}
                    <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                    ingénierie en imagerie quantitative
                    </Link>
                    structurée.
                  </p>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Audit DICOM des métadonnées énergétiques</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Stratification par constructeur (Siemens/GE/Philips)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Extraction métrique automatisée et logs de QC</span>
                    </li>
                  </ul>
                </div>

                {/* Colonne Droite */}
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                    Principe central
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    L’objectif final n'est pas le{" "}
                    <Link to="/segmentation-irm" className="text-primary hover:underline">
                    masque de segmentation
                    </Link>,
                    mais la valeur numérique extraite (quantification).
                  </p>
                  <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">
                      Priorité à la robustesse statistique sur la précision pixel-perfect isolée.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 4 : APPLICATIONS */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications cliniques et translationnelles
              </h2>

              <div className="grid md:grid-cols-2 gap-12 items-start">

                {/* Colonne Gauche */}
                <div className="space-y-6 text-muted-foreground">
                  <p className="leading-relaxed">
                    Ces méthodes s'appliquent dès lors qu'une mesure quantitative 
                    est requise pour un endpoint d'essai clinique ou une étude physiopathologique. dans une logique de{" "}
                    <Link to="/quantification-ct" className="text-primary hover:underline">
                    quantification CT clinique
                    </Link>.
                  </p>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Quantification fibrose pulmonaire & inflammation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Caractérisation de plaque (Calcium / Lipide)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>Perfusion CT quantitative (Flux/Volume)</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link to="/ingenierie-imagerie-quantitative" className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
                      Voir l'ingénierie quantitative <ArrowRight className="w-3 h-3"/>
                    </Link>
                  </div>
                </div>

                {/* Colonne Droite */}
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    Positionnement
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    L’objectif est de produire des paramètres exploitables
                    en contexte multicentrique, industriel ou réglementaire,
                    et non des indicateurs dépendants d’un système unique.
                  </p>
                  <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">
                      Le biomarqueur doit survivre au changement de machine.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* DATA & CONSENSUS (Full Width Grid) */}
            <section className="rounded-2xl border border-border bg-muted/40 p-10 space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Données de référence & Consensus
              </h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Reproductibilité rapportée
                  </h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2 leading-relaxed">
                    <li>Variabilité HU inter-constructeur brute : <strong>5–20 HU</strong></li>
                    <li>Gain de contraste en monoénergétique (40keV) : <strong>+30–50%</strong></li>
                    <li>Coefficient de variation Perfusion CT : <strong>5–12%</strong></li>
                    <li>Nécessité de débruitage itératif &lt;70 keV</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Guidelines
                  </h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2 leading-relaxed">
                    <li>Guidelines on Dual-Energy CT (Quality & Safety)</li>
                    <li>Consensus sur la reproductibilité en Perfusion CT</li>
                    <li>Standards de calibration Phantom (AAPM/QIBA)</li>
                    <li>Recommandations pour l'harmonisation multicentrique</li>
                  </ul>
                </div>
              </div>
            </section>
           <section className="rounded-2xl border border-border bg-card/40 p-10 space-y-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Expertises associées
            </h2>

            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Cette approche s’intègre dans une architecture plus large
              d’ingénierie quantitative et d’harmonisation multicentrique.
            </p>

            <div className="grid md:grid-cols-3 gap-6">

              <Link
                to="/quantification-ct"
                className="rounded-xl border border-border bg-card/50 p-6 hover:border-primary/40 hover:bg-card/70 transition-all group"
              >
                <div className="space-y-2">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Quantification CT clinique
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Extraction métrique robuste en contexte patient.
                  </p>
                </div>
              </Link>

              <Link
                to="/harmonisation-multicentrique"
                className="rounded-xl border border-border bg-card/50 p-6 hover:border-primary/40 hover:bg-card/70 transition-all group"
              >
                <div className="space-y-2">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Harmonisation multicentrique
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Réduction des biais inter-constructeurs.
                  </p>
                </div>
              </Link>

              <Link
                to="/ingenierie-imagerie-quantitative"
                className="rounded-xl border border-border bg-card/50 p-6 hover:border-primary/40 hover:bg-card/70 transition-all group"
              >
                <div className="space-y-2">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Ingénierie en imagerie quantitative
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Architecture méthodologique complète.
                  </p>
                </div>
              </Link>

            </div>
          </section>
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                En résumé
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• La valeur HU brute n’est pas stable entre centres</li>
                <li>• Le spectral améliore la physique, pas la validité automatique</li>
                <li>• La calibration phantom est indispensable</li>
                <li>• Un biomarqueur robuste doit survivre au changement de machine</li>
              </ul>
            </section>
            {/* FAQ ROBUSTE (Grid 2x2) */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes – CT quantitatif
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-3 hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold text-foreground">
                    Les unités Hounsfield sont-elles comparables entre centres ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Non. Des écarts de 5 à 20 HU sont fréquents selon le kernel,
                    l'énergie effective et le constructeur. Une harmonisation est requise.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-3 hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold text-foreground">
                    Le CT spectral améliore-t-il la quantification ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Oui, car il permet de séparer l'effet photoélectrique du Compton, 
                    mais cela exige une calibration rigoureuse pour être valide.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-3 hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi utiliser un fantôme de calibration ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour fixer une "vérité terrain". Cela permet de mesurer la dérive 
                    instrumentale et de la corriger avant l'analyse des patients.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-3 hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold text-foreground">
                    Est-ce applicable en routine clinique ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Oui, mais le pipeline de post-traitement doit être automatisé 
                    pour ne pas alourdir le flux de travail radiologique.
                  </p>
                </div>

              </div>
            </section>        

            {/* CTA */}
            <section className="rounded-2xl border border-border bg-card/30 p-10 text-center">
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Vous développez un protocole de recherche ou un outil industriel ? <br/>
                Sécurisez vos données avec une validation physique explicite.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition shadow-lg shadow-primary/20"
              >
                Discuter d’un projet spectral
                <ArrowRight className="w-5 h-5" />
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