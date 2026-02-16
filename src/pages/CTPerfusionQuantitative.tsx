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
  Scaling,
  FileText
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ct-perfusion-quantitative-avc";

const CTPerfusionQuantitative = () => {
  /* ============================================================
     JSON-LD
  ============================================================ */

  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT Perfusion quantitative en AVC ischémique aigu",
    description:
      "Quantification robuste de la pénombre (Tmax) et du core (CBF/CBV) en CT perfusion : audit DICOM dynamique, contrôle AIF/VOF, stabilité multi-seuil, variabilité inter-logiciels, harmonisation multicentrique et livrables traçables.",
    url: CANONICAL,
    inLanguage: "fr-FR",
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Healthcare Professionals"
    },
    about: [
      "CT Perfusion",
      "CTP",
      "AVC ischémique aigu",
      "Acute ischemic stroke",
      "Tmax",
      "CBF",
      "CBV",
      "Mismatch",
      "Ischemic core",
      "Penumbra",
      "AIF",
      "Arterial Input Function",
      "VOF",
      "Venous Output Function",
      "SVD",
      "Deconvolution",
      "Thrombectomy eligibility",
      "DEFUSE 3",
      "EXTEND-IA",
      "SWIFT PRIME"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    }
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Quantification CT Perfusion en AVC",
    serviceType: [
      "Audit CT perfusion (DICOM dynamique)",
      "Quantification core / pénombre",
      "Analyse multi-seuil et stabilité volumique",
      "Comparaison inter-logiciels",
      "Harmonisation multicentrique",
      "Livrables traçables (NIfTI/DICOM + tables)"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Lecture centralisée et quantification défendable des volumes de core/pénombre en CT perfusion : règles explicites, QC, stabilité des volumes, et exports prêts pour analyses statistiques ou essais multicentriques.",

    availableChannel: {
      "@type": "ServiceChannel",
      serviceLocation: {
        "@type": "Place",
        name: "Remote core-lab reading"
      }
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "CT", item: "https://noxia-imagerie.fr/ct-imagerie-quantitative" },
      { "@type": "ListItem", position: 4, name: "CT Perfusion AVC", item: CANONICAL }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi les volumes (core/pénombre) varient-ils selon le logiciel ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce que les volumes dépendent de la déconvolution (SVD standard vs circulante), du choix AIF/VOF, du filtrage spatio-temporel et des hypothèses de normalisation. Dans certains contextes, des écarts importants inter-plateformes sont rapportés : c’est précisément ce qui impose un audit et une harmonisation multicentrique."
        }
      },
      {
        "@type": "Question",
        name: "Tmax ≥ 6 s et CBF < 30 % sont-ils des constantes universelles ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Ce sont des seuils historiques issus d’essais et de pratiques standardisées, mais ils restent dépendants de l’implémentation logicielle et de la qualité du DICOM dynamique (résolution temporelle, bolus, mouvement, AIF). Une analyse multi-seuil et des contrôles QA sont nécessaires pour rendre le biomarqueur défendable."
        }
      },
      {
        "@type": "Question",
        name: "Quel est l’impact de la résolution temporelle et du bolus sur la quantification ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Une résolution temporelle trop faible, un bolus tronqué (truncation) ou du mouvement rendent la déconvolution instable et peuvent déplacer artificiellement les volumes. Avant toute interprétation, la cohérence temporelle et la qualité de l’AIF/VOF doivent être vérifiées et documentées."
        }
      }
    ]
  };

  /* ============================================================
     UI
  ============================================================ */

  return (
    <>
      <Helmet>
        <title>CT Perfusion quantitative en AVC aigu | Core & pénombre | NOXIA</title>
        <meta
          name="description"
          content="CT Perfusion quantitative en AVC aigu : quantification core (CBF/CBV) et pénombre (Tmax), contrôle AIF/VOF, stabilité multi-seuil, variabilité inter-logiciels, harmonisation multicentrique et livrables traçables."
        />
        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="CT Perfusion quantitative en AVC aigu | NOXIA" />
        <meta
          property="og:description"
          content="De la carte colorée au biomarqueur défendable : audit DICOM dynamique, AIF/VOF, stabilité multi-seuil et harmonisation inter-logiciels."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(medicalWebPageJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "CT", path: "/ct-imagerie-quantitative" },
                { label: "CT Perfusion AVC" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT Perfusion quantitative en AVC ischémique aigu
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transformer les cartographies Tmax / CBF / CBV en biomarqueurs volumétriques
                <strong> reproductibles</strong>, exploitables en lecture centralisée,
                décision thérapeutique et essais multicentriques.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Auditer un pipeline CTP
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Harmonisation multicentrique
                  <Database className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* TL;DR */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Workflow className="w-5 h-5 text-primary" />
                    Ce que je livre
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Masques core/pénombre (NIfTI/DICOM selon besoin), tables patient/temps (CSV/Excel),
                    règles/seuils versionnés et un QC traçable.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Ce qui est non-négociable
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Audit DICOM dynamique, contrôle AIF/VOF, cohérence temporelle du bolus,
                    et validation de la stabilité volumique (multi-seuil).
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Pour quoi faire
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Endpoints défendables : distributions stables, comparabilité inter-centre,
                    analyses statistiques et documentation méthodologique opposable.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Biomarker → Endpoint → Statistical robustness
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION — Seuils */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Tmax ≥ 6 s et CBF &lt; 30 % : standards historiques, pas constantes physiques
              </h2>

              <p>
                Les seuils ont été popularisés par des stratégies de sélection perfusion (pénombre/core)
                et sont utiles en pratique. Mais le volume final dépend d’une chaîne algorithmique :
                déconvolution (SVD), sélection AIF/VOF, filtrage, résolution temporelle, lissage,
                et contraintes propres à chaque plateforme.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Déconvolution : sensibilité aux délais de transit (SVD standard vs circulante)</li>
                <li>AIF/VOF : choix automatique parfois instable, surtout sur acquisitions bruitées</li>
                <li>Pré-traitements (filtrage/lissage) : réduction du bruit vs dilution morphologique</li>
                <li>Résolution temporelle / truncation : impact direct sur la stabilité de la déconvolution</li>
              </ul>

              <p>
                Conclusion opérationnelle : un biomarqueur “correct” doit être robuste aux variantes plausibles
                de la chaîne de traitement, ou au minimum documenter sa sensibilité.
              </p>
            </section>

            {/* SECTION — Résultats rapportés */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Ordres de grandeur rapportés (lecture inter-logiciels)
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">
                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Variabilité volumique non négligeable
                      </h3>
                      <p>
                        Des études comparatives rapportent des divergences inter-plateformes pouvant être
                        importantes sur core/pénombre, surtout lorsque bolus, mouvement ou AIF/VOF sont sous-optimaux.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Formulation volontairement prudente : l’amplitude dépend du dataset, du protocole et de la plateforme.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Risque : éligibilité modifiée par la plateforme
                      </h3>
                      <p>
                        La conséquence méthodologique n’est pas “un volume différent”, mais un changement potentiel
                        de classification (core trop grand / mismatch trop petit) si la chaîne n’est pas stabilisée.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* SECTION — Données issues de la littérature */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Données issues de la littérature (ordre de grandeur)
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Corrélation core CBF &lt; 30% vs infarct final
                  </h3>
                  <p>
                    Les études de validation rapportent des corrélations modérées à fortes
                    (r ≈ 0.6–0.8) entre volume CBF &lt; 30% et volume d’infarct final,
                    avec une surestimation possible en cas de bolus suboptimal.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Reproductibilité intra-plateforme
                  </h3>
                  <p>
                    Les coefficients ICC rapportés pour les volumes de core/pénombre
                    sont généralement &gt; 0.80 en conditions optimales,
                    mais chutent significativement lorsque la résolution temporelle
                    ou l’AIF sont instables.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Variabilité inter-logiciels
                  </h3>
                  <p>
                    Des écarts volumétriques cliniquement significatifs sont rapportés
                    entre solutions commerciales majeures,
                    avec des différences pouvant modifier la classification mismatch
                    dans une proportion non négligeable de patients.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Impact clinique
                  </h3>
                  <p>
                    Des analyses ont montré que la variabilité plateforme
                    peut théoriquement modifier l’éligibilité thrombectomie
                    lorsque le volume core approche les seuils décisionnels
                    (ex : 50–70 mL selon protocole).
                  </p>
                </div>

              </div>

              <p className="text-xs text-muted-foreground italic">
                Références principales : DEFUSE 3, EXTEND-IA, Cereda et al., Koopman et al., études comparatives inter-logiciels en CTP.
              </p>
            </section>
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Verrous techniques critiques en CT Perfusion
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Bolus truncation (fin d’acquisition avant retour veineux complet)</li>
                <li>Mouvement pendant le pic artériel</li>
                <li>Couverture cérébrale incomplète</li>
                <li>AIF aberrante (calcifiée, partiellement voluménique)</li>
                <li>Sténose carotidienne controlatérale créant une pénombre apparente</li>
              </ul>
            </section>
            {/* SECTION — Pipeline */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture d’une quantification CTP défendable
              </h2>

              <p>
                L’objectif n’est pas de produire une carte “propre”, mais un volume robuste et traçable.
                Concrètement :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit DICOM dynamique : intégrité temporelle, couverture, mouvements, truncation</li>
                <li>Contrôle du bolus : cohérence des courbes, exclusions argumentées si nécessaire</li>
                <li>Contrôle AIF/VOF : stabilité, pertinence anatomique, détection d’instabilités</li>
                <li>Masque cérébral / exclusions : crâne, artefacts, régions hors parenchyme</li>
                <li>Seuils explicités et versionnés + post-traitement morphologique documenté</li>
                <li>Analyse multi-seuil : test de stabilité (Tmax 4–10 s ; CBF 20–40 %) selon protocole</li>
                <li>Exports : volumes, distributions, overlays QC, logs et versions</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  Analyse DICOM
                </Link>{" "}
                et{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques & harmonisation
                </Link>
                .
              </p>
            </section>

            {/* SECTION — OEF / CMRO2 (CT & IRM) */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Brain className="w-5 h-5 text-primary" />
                Perfusion et métabolisme : OEF / CMRO₂ en CT et en IRM
              </div>

              <p className="text-muted-foreground leading-relaxed">
                OEF (oxygen extraction fraction) et CMRO₂ (cerebral metabolic rate of oxygen) peuvent être
                estimés via des approches CT avancées (modélisations dépendantes de la chaîne d’acquisition)
                et via des approches IRM quantitatives. La valeur ajoutée, en contexte AVC,
                est d’analyser la cohérence physiopathologique au-delà du seul mismatch perfusion.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Voir{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  Perfusion & métabolisme cérébral
                </Link>{" "}
                (CT & IRM) pour un cadrage dédié.
              </p>
            </section>

            {/* SECTION — Glossaire */}
            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Acronymes et biomarqueurs</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Tmax</div>
                  <p className="text-sm">
                    Temps de retard après déconvolution ; utilisé comme proxy de pénombre selon seuil.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">CBF</div>
                  <p className="text-sm">
                    Cerebral Blood Flow ; seuil relatif (ex. &lt;30 %) utilisé pour approximer le core.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">CBV</div>
                  <p className="text-sm">
                    Cerebral Blood Volume ; utile pour contextualiser perfusion et effondrement capillaire.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">AIF / VOF</div>
                  <p className="text-sm">
                    Courbes artérielle/veineuse de référence ; pivot de stabilité pour la déconvolution.
                  </p>
                </div>
              </div>
            </section>

            {/* FAQ visible (doit matcher le FAQ JSON-LD) */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes (CT Perfusion AVC)
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi les volumes (core/pénombre) varient-ils selon le logiciel ?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Parce que la déconvolution, l’AIF/VOF, les filtres et la normalisation diffèrent selon les plateformes.
                    Sans audit et harmonisation, le biomarqueur devient partiellement logiciel-dépendant.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Tmax ≥ 6 s et CBF &lt; 30 % sont-ils des constantes universelles ?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Non. Ce sont des standards utiles, mais sensibles à l’implémentation et à la qualité du DICOM dynamique.
                    Une analyse multi-seuil + QA rend la mesure scientifiquement défendable.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3 md:col-span-2">
                  <h3 className="font-semibold text-foreground">
                    Quel est l’impact de la résolution temporelle et du bolus sur la quantification ?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Une résolution insuffisante, un bolus tronqué ou du mouvement déstabilisent la déconvolution
                    et peuvent déplacer artificiellement core/pénombre. Le contrôle temporel et AIF/VOF est un prérequis
                    avant toute interprétation clinique ou statistique.
                  </p>
                </div>
              </div>
            </section>

            {/* PAGES LIÉES */}
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
                  to="/bases-multicentriques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Bases multicentriques
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/recalage-multimodal"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Recalage multimodal
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/perfusion-metabolique-neuro-imagerie"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Perfusion & métabolisme
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <AlertTriangle className="w-3 h-3" /> Lecture centralisée / essais multicentriques
              </div>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                Si la variabilité plateforme peut polluer vos résultats, l’audit + harmonisation du pipeline CTP
                est souvent plus rentable que “rajouter des patients”.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition"
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
