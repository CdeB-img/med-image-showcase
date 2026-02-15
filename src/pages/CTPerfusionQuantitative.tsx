import React from "react";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  ShieldCheck,
  Database,
  Workflow,
  BarChart3,
  AlertTriangle,
  Layers,
  Timer,
  Brain,
  Zap,
  Scaling
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ct-perfusion-quantitative-avc";

const CTPerfusionQuantitative = () => {

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT Perfusion quantitative en AVC ischémique aigu",
    description:
      "Quantification robuste des volumes de pénombre (Tmax) et de core (CBF) en CT perfusion. Analyse de la variabilité inter-logiciels et validation des seuils DEFUSE-3 / EXTEND.",
    about: [
      "CT Perfusion (CTP)",
      "Acute Ischemic Stroke",
      "Tmax ≥ 6 seconds (Penumbra)",
      "CBF < 30% (Ischemic Core)",
      "SVD Deconvolution",
      "Arterial Input Function (AIF)",
      "Mismatch volume",
      "Thrombectomy eligibility"
    ],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Healthcare Professionals"
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
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "CT Quantitative", item: "https://noxia-imagerie.fr/quantification-ct" },
      { "@type": "ListItem", position: 4, name: "CT Perfusion AVC", item: CANONICAL }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi les volumes varient-ils selon le logiciel utilisé ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La variabilité provient du modèle de déconvolution (SVD vs SVD circulant), du filtrage du bruit, et de la sélection automatique de l'AIF. Des écarts de 30% à 50% sont documentés entre les solutions leaders du marché."
        }
      },
      {
        "@type": "Question",
        name: "Le seuil Tmax ≥ 6s est-il suffisant pour définir la pénombre ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "C'est le standard des essais DEFUSE-3, mais il peut inclure des zones d'oligémie bénigne si le délai de transit global est allongé (ex: sténose carotidienne controlatérale)."
        }
      },
      {
        "@type": "Question",
        name: "Quel est l'impact de la résolution temporelle sur le CBF ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Une résolution temporelle < 2-3 secondes est nécessaire pour capturer précisément le pic de l'AIF. Une sous-échantillonnage conduit systématiquement à une surestimation du core ischémique."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>CT Perfusion AVC | Quantification Tmax & CBF | NOXIA</title>
        <meta
          name="description"
          content="Expertise en CT Perfusion pour l'AVC. Maîtrise des seuils Tmax ≥ 6s et CBF < 30%. Analyse de variabilité inter-logiciels et harmonisation multicentrique."
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
                { label: "CT Quantitative", path: "/quantification-ct" },
                { label: "CT Perfusion AVC" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT Perfusion Quantitative en AVC Aigu
                <span className="block text-primary mt-3 text-3xl md:text-4xl">
                  Au-delà de l'affichage : la fiabilité volumétrique
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transformer les cartes de temps de transit en biomarqueurs décisionnels 
                robustes, alignés sur les critères <strong>DEFUSE-3</strong> et <strong>EXTEND</strong>.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Auditer un pipeline Perfusion
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/biomarqueurs-irm-cardiaque-essais-cliniques" 
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Endpoints Essais Cliniques
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* SECTION 1 : LE RISQUE LOGICIEL (Pattern Symétrique) */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                L'illusion de l'universalité des seuils
              </h2>

              <div className="grid md:grid-cols-2 gap-12 items-start">
                
                <div className="space-y-6 text-muted-foreground">
                  <p className="leading-relaxed">
                    Les seuils <strong>Tmax ≥ 6s</strong> (Pénombre) et <strong>CBF &lt; 30%</strong> (Core) 
                    sont devenus les standards cliniques. Cependant, leur calcul dépend d'une chaîne algorithmique complexe 
                    où chaque étape introduit un biais potentiel.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>SVD Deconvolution :</strong> L'implémentation (standard vs circulant) modifie radicalement la sensibilité aux délais de transit.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Sélection AIF/VOF :</strong> Une Artère Afférente (AIF) mal choisie ou bruitée déplace l'intégralité des volumes calculés.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Pre-processing :</strong> Le lissage spatial réduit le bruit mais peut artificiellement augmenter le volume du core.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6 h-full">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                    Variabilité Inter-Logiciels (Littérature)
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium">Écart de Volume Core</span>
                        <span className="text-2xl font-bold text-foreground">40%</span>
                      </div>
                      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[40%]"></div>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-2 block">Variation maximale observée entre logiciels sur un même dataset (ex: RAPID vs Olea).</span>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium">Discordance Mismatch</span>
                        <span className="text-2xl font-bold text-foreground">1/4</span>
                      </div>
                      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[25%]"></div>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-2 block">Patients dont l'éligibilité thérapeutique change selon l'outil utilisé.</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Source : Études comparatives (Koopman et al., Ann Neurol ; Cereda et al., Stroke).
                  </p>
                </div>

              </div>
            </section>

            {/* SECTION 2 : METHODOLOGIE NOXIA */}
            <section className="space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-foreground">Architecture d'une analyse centralisée</h2>
                <p className="text-muted-foreground">Sécuriser la donnée perfusion pour les essais multicentriques.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 rounded-2xl border border-border bg-muted/10 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Database className="w-20 h-20" />
                  </div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Scaling className="w-5 h-5 text-primary" /> Audit Dynamique
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vérification de la <strong>résolution temporelle</strong> (idéalement &lt; 2s). Analyse de la qualité du bolus (Truncation, mouvement) avant tout calcul de carte.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border border-border bg-muted/10 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Workflow className="w-20 h-20" />
                  </div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" /> Stabilité Multi-Seuil
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Au lieu d'un seuil unique, nous testons la <strong>stabilité volumique</strong> sur une plage (Tmax 4s à 10s). Si le volume double entre 6s et 8s, la mesure est fragile.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border border-border bg-muted/10 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-20 h-20" />
                  </div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" /> Normalisation AIF
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Validation ou repositionnement manuel de l'<strong>Artère Afférente</strong> et de la <strong>Veine de Sortie</strong> (VOF) pour garantir une déconvolution mathématiquement stable.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 3 : GLOSSAIRE / ABOUT (Acronymes) */}
            <section className="rounded-2xl border border-border bg-card/50 p-10 space-y-8">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Comprendre les biomarqueurs de perfusion</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <span className="font-bold text-primary">Tmax</span>
                  <p className="text-xs text-muted-foreground">Temps mis par le bolus pour atteindre son maximum après déconvolution. Le marqueur de la pénombre.</p>
                </div>
                <div className="space-y-2">
                  <span className="font-bold text-primary">CBF</span>
                  <p className="text-xs text-muted-foreground">Cerebral Blood Flow. Un débit &lt; 30% du côté sain définit classiquement le core (zone non sauvable).</p>
                </div>
                <div className="space-y-2">
                  <span className="font-bold text-primary">CBV</span>
                  <p className="text-xs text-muted-foreground">Cerebral Blood Volume. Utilisé pour confirmer le core (effondrement du lit capillaire).</p>
                </div>
                <div className="space-y-2">
                  <span className="font-bold text-primary">AIF</span>
                  <p className="text-xs text-muted-foreground">Arterial Input Function. La courbe de référence de l'arrivée du contraste dans le cerveau.</p>
                </div>
              </div>
            </section>

            {/* FAQ GRILLE 2x2 */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-center text-foreground">Questions Fréquentes (Expert)</h2>
              <div className="grid md:grid-cols-2 gap-6">
                
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi ne pas utiliser uniquement le CBV ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Le CBV peut être faussement maintenu par une vasodilatation compensatrice (autorégulation). Le CBF &lt; 30% reste plus prédictif de l'infarctus final à la phase hyper-précoce.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Le mouvement du patient est-il corrigeable ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Oui, par recalage rigide 3D, mais seulement si le mouvement est modéré. Un mouvement brusque pendant le pic de contraste rend la déconvolution instable et les volumes inexploitables.
                  </p>
                </div>

                 <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Comment gérer les sténoses carotidiennes ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Une sténose serrée retarde l'AIF et peut créer une "pénombre fantôme" (Tmax élevé sans ischémie réelle). Une analyse experte doit intégrer les cartes de temps de transit global (MTT).
                  </p>
                </div>

                 <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Quelle épaisseur de coupe privilégier ?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Un compromis entre rapport signal/bruit et résolution. Généralement 5mm. Des coupes trop fines augmentent le bruit et créent des trous dans les masques de segmentation du core.
                  </p>
                </div>

              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4 pt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <AlertTriangle className="w-3 h-3" /> Expert Review Required
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Vous menez un essai clinique AVC ? Ne laissez pas la variabilité logicielle polluer vos résultats statistiques. 
                Standardisons votre pipeline de lecture.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition mt-4"
              >
                Demander une étude de faisabilité
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

export default CTPerfusionQuantitative;