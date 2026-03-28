import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Activity,
  Workflow,
  BarChart3,
  ShieldCheck,
  Layers,
  AlertTriangle,
  Database,
  Timer,
  Brain,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/perfusion-hemodynamique-neuro-imagerie";

const PerfusionHemodynamiqueNeuro = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Perfusion hemodynamique neuro en imagerie quantitative",
    description:
      "Analyse hemodynamique cerebrale en AVC: CBF, CBV, Tmax, MTT/TTP, delay maps, penumbra maps et core estimation avec approche multicentrique reproductible.",
    about: [
      "Cerebral Blood Flow",
      "Cerebral Blood Volume",
      "Tmax",
      "MTT",
      "TTP",
      "Delay maps",
      "Penumbra maps",
      "Core estimation",
      "Stroke perfusion imaging",
      "Perfusion MRI",
      "CT perfusion"
    ],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Healthcare professionals"
    },
    specialty: "Neurology",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    url: CANONICAL
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Quantification de la perfusion hemodynamique neuro",
    serviceType: [
      "Lecture CBF/CBV/Tmax/MTT/TTP",
      "Audit DICOM dynamique",
      "Validation core/pénombre",
      "Harmonisation multicentrique"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Structuration d'indicateurs hemodynamiques cerebraux robustes et comparables entre centres, avec regles de mesure, QA et traçabilite des versions."
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
        name: "Perfusion cérébrale",
        item: "https://noxia-imagerie.fr/perfusion-cerebrale"
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Perfusion hémodynamique IRM",
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
        name: "CBF, CBV, Tmax, MTT et TTP mesurent-ils la meme chose ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. CBF et CBV decrivent debit et volume sanguin, Tmax et TTP des delais de transit, et MTT un temps moyen de passage. Leur interpretation doit rester conjointe."
        }
      },
      {
        "@type": "Question",
        name: "Une delay map est-elle equivalente a une penumbra map ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Une delay map decrit un retard hemodynamique continu. Une penumbra map est une derivee logiciel-dependante appliquee a des seuils et modeles deconvolution."
        }
      },
      {
        "@type": "Question",
        name: "Les core estimation maps sont-elles universelles ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Les cartes de core dependent des choix de seuils, de deconvolution, d'AIF/VOF et de pretraitement. Une validation inter-logiciels est necessaire avant usage comme endpoint."
        }
      },
      {
        "@type": "Question",
        name: "Pourquoi cadrer la perfusion hemodynamique separement de l'OEF/CMRO2 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce que l'hemodynamique decrit d'abord le transport sanguin, alors que OEF et CMRO2 visent l'adaptation et la consommation metaboliques. Les deux niveaux sont complementaires mais non interchangeables."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Perfusion hemodynamique neuro: CBF, CBV, Tmax | NOXIA</title>
        <meta
          name="description"
          content="Perfusion hemodynamique neuro en AVC: CBF, CBV, Tmax, MTT/TTP, delay/core/penumbra maps avec validation multicentrique et pipeline reproductible."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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
                { label: "Perfusion cérébrale", path: "/perfusion-cerebrale" },
                { label: "Perfusion hémodynamique IRM" }
              ]}
            />

            <ExpertiseHero
              badge="Perfusion hemodynamique neuro"
              badgeIcon={Activity}
              title="Perfusion hémodynamique cérébrale en imagerie quantitative"
              description="Structurer la lecture CBF, CBV, Tmax, MTT/TTP et des cartes delay/core/pénombre pour obtenir des biomarqueurs robustes, comparables et cliniquement interprétables."
              chips={["CBF/CBV", "Tmax/MTT/TTP", "Delay/Core/Pénombre"]}
              actions={[
                { label: "Échanger sur un protocole", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir le hub perfusion", to: "/perfusion-cerebrale", variant: "secondary", icon: Activity },
                { label: "Voir la perfusion métabolique", to: "/perfusion-metabolique-neuro-imagerie", variant: "secondary", icon: Brain },
                { label: "Voir CT perfusion AVC", to: "/ct-perfusion-quantitative-avc", variant: "secondary", icon: Timer },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Définition de la perfusion hémodynamique cérébrale
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                La perfusion hémodynamique décrit le transport sanguin cérébral via des indicateurs de débit, volume et délai (CBF, CBV, Tmax, MTT, TTP). Ces cartes sont essentielles en AVC, mais restent fortement dépendantes de la chaîne d'acquisition et du logiciel de post-traitement. L'enjeu n'est pas la carte colorée, mais la stabilité de la mesure entre patients, centres et versions logicielles.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cette lecture s'inscrit dans le{" "}
                <Link to="/perfusion-cerebrale" className="text-primary hover:underline">
                  hub perfusion cérébrale
                </Link>
                {" "}et se complète avec l'analyse{" "}
                <Link to="/metabolisme-cerebral" className="text-primary hover:underline">
                  métabolique cérébrale
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Acronymes / définitions rapides</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="font-semibold text-foreground">CBF</div>
                  <p>Débit sanguin cérébral.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">CBV</div>
                  <p>Volume sanguin cérébral.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Tmax</div>
                  <p>Retard temporel de perfusion.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">MTT</div>
                  <p>Temps moyen de transit.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">TTP</div>
                  <p>Temps au pic de contraste.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">AIF/VOF</div>
                  <p>Fonctions artérielle/veineuse de référence.</p>
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Activity className="w-5 h-5 text-primary" />
                  Débit et volume
                </div>
                <p className="text-sm text-muted-foreground">
                  CBF/CBV décrivent l'apport sanguin et le lit capillaire perfusé, avec des sensibilités différentes selon les modèles.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Timer className="w-5 h-5 text-primary" />
                  Retard hémodynamique
                </div>
                <p className="text-sm text-muted-foreground">
                  Tmax, MTT et TTP apportent une lecture temporelle du transit. Ils ne sont pas interchangeables et dépendent des hypothèses de déconvolution.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Layers className="w-5 h-5 text-primary" />
                  Cartes dérivées
                </div>
                <p className="text-sm text-muted-foreground">
                  Delay maps, penumbra maps et core estimation maps sont des sorties algorithmiques, utiles mais logiciel-dépendantes.
                </p>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Delay maps, penumbra maps et core estimation : ce que l'on lit vraiment
              </h2>

              <p>
                Une delay map est une carte continue de retard de transit. Une penumbra map ajoute une logique de seuils pour isoler un territoire hypoperfusé potentiellement récupérable. Une core estimation map combine généralement des critères de débit/volume et de délai pour approcher un noyau infarci. Ces niveaux d'interprétation sont progressifs et ne doivent pas être confondus.
              </p>

              <p>
                En pratique, la cohérence entre ces cartes doit être vérifiée avec l'<Link to="/analyse-dicom" className="text-primary hover:underline">audit DICOM dynamique</Link>, l'harmonisation <Link to="/bases-multicentriques" className="text-primary hover:underline">multicentrique</Link> et l'<Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">ingénierie de pipeline</Link>.
              </p>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Point de vigilance
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Les penumbra maps et core maps sont des objets calculés, pas des vérités anatomopathologiques directes. Leur valeur dépend de la qualité des données, des hypothèses de déconvolution, et du contexte clinique de reperfusion.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Workflow className="w-5 h-5 text-primary" />
                Architecture d'un biomarqueur hémodynamique robuste
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Chaîne d'analyse opposable
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Audit géométrique/temporalité du DICOM dynamique</li>
                    <li>Validation AIF/VOF et gestion des bolus tronqués</li>
                    <li>Versioning seuils, paramètres et reconstruction</li>
                    <li>Exports QA (overlays, volumes, logs)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    Robustesse multicentrique
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Comparaison inter-logiciels et inter-constructeurs</li>
                    <li>Analyse multi-seuil des volumes core/pénombre</li>
                    <li>Suivi des dérives liées aux mises à jour logiciel</li>
                    <li>Critères d'exclusion documentés</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications cliniques et translationnelles
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Tri aigu thrombolyse / thrombectomie selon mismatch</li>
                <li>Suivi de la reperfusion et lecture des territoires à risque</li>
                <li>Standardisation d'endpoints d'essais multicentriques</li>
                <li>Comparaison CT perfusion et IRM perfusion dans des cohortes mixtes</li>
              </ul>

              <p>
                Cette lecture hémodynamique est complémentaire de la lecture métabolique portée par <Link to="/oef-imagerie-cerebrale" className="text-primary hover:underline">l'OEF</Link> et le <Link to="/cmro2-imagerie-cerebrale" className="text-primary hover:underline">CMRO2</Link>. La page dédiée <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">Perfusion métabolique neuro</Link> détaille ce second niveau d'interprétation.
              </p>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Données de la littérature (ordres de grandeur prudents)
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Des écarts inter-logiciels de volumes core/pénombre peuvent être substantiels en conditions non harmonisées.</li>
                <li>Le seuil CBF &lt; 30 % est largement utilisé pour estimer le core, mais sa stabilité dépend du pipeline.</li>
                <li>Tmax ≥ 6 s reste un repère fréquent pour l'hypoperfusion critique, sans valeur universelle absolue.</li>
                <li>La résolution temporelle, le bruit et la qualité AIF/VOF impactent fortement la déconvolution.</li>
                <li>La reproductibilité augmente nettement quand les règles de traitement sont figées et auditables.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-muted/10 p-8 space-y-4">
              <h2 className="text-xl font-semibold">Références & consensus</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Recommandations sur la perfusion cérébrale en AVC aigu (imagerie de sélection).</li>
                <li>Bonnes pratiques de contrôle qualité des acquisitions dynamiques.</li>
                <li>Consensus de reproductibilité des biomarqueurs quantitatifs multicentriques.</li>
                <li>Cadres méthodologiques de validation endpoint en imagerie quantitative.</li>
              </ul>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes – Perfusion hémodynamique
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    CBF, CBV, Tmax, MTT et TTP mesurent-ils la même chose ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Ils décrivent des dimensions différentes du signal hémodynamique et doivent être lus ensemble.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    Une delay map est-elle équivalente à une penumbra map ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. La première est une mesure continue de retard; la seconde applique des règles de classification.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    Les core maps sont-elles universelles ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Elles dépendent des algorithmes et des paramètres; une validation locale et multicentrique est indispensable.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi séparer hémodynamique et métabolique ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Parce que l'hémodynamique décrit le transport sanguin, alors que OEF/CMRO2 visent l'état métabolique du tissu.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>

              <div className="flex flex-wrap gap-3">
                <Link to="/perfusion-metabolique-neuro-imagerie" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Perfusion métabolique neuro <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/oef-imagerie-cerebrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Focus OEF <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/cmro2-imagerie-cerebrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Focus CMRO2 <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ct-perfusion-quantitative-avc" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT Perfusion AVC <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/methodologie-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Méthodologie quantitative <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Une carte de perfusion hémodynamique devient utile quand sa lecture est reproductible, contextualisée et traçable.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground"
              >
                Discuter d'un projet neurovasculaire
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

export default PerfusionHemodynamiqueNeuro;
