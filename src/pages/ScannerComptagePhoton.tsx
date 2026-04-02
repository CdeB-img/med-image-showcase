import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Workflow,
  Database,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/scanner-comptage-photon";

const FAQ_ITEMS = [
  {
    question: "Quels gains sont déjà rapportés avec le comptage photonique ?",
    answer:
      "Les gains déjà documentés concernent surtout la résolution spatiale, la séparation matière, la détectabilité de structures fines et certaines tâches quantitatives. Leur ampleur reste liée à l’indication, au protocole et à la reconstruction.",
  },
  {
    question: "Pourquoi la reconstruction reste-t-elle un point critique ?",
    answer:
      "Parce qu’elle modifie directement le compromis bruit/résolution et peut déplacer les métriques. Un rendu visuel plus net ne garantit pas, à lui seul, une mesure plus robuste.",
  },
  {
    question: "Que permet réellement l’imagerie K-edge et la séparation matière ?",
    answer:
      "Elle permet de distinguer plus spécifiquement certains matériaux ou agents de contraste, avec des cas déjà rapportés en dual-contraste et en imagerie ciblée. La valeur clinique dépend de la calibration et de la cohérence de la chaîne d’analyse.",
  },
  {
    question: "Les mesures sont-elles automatiquement plus robustes ?",
    answer:
      "Non. Le SPCCT enrichit le signal disponible, mais la robustesse d’un endpoint dépend toujours des règles de reconstruction, de calibration, de QA et d’harmonisation inter-systèmes.",
  },
];

const ScannerComptagePhoton = () => {
  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Scanner à comptage photonique (SPCCT): séparation matière, K-edge et quantification",
    description:
      "Le scanner à comptage photonique (SPCCT) est désormais utilisé en clinique avec des bénéfices déjà documentés en résolution, séparation matière, détectabilité et quantification ciblée.",
    about: [
      "Photon-counting CT",
      "Spectral imaging",
      "Energy-resolved detectors",
      "Material decomposition",
      "K-edge imaging",
      "Quantitative imaging",
      "Image detectability",
    ],
    specialty: ["Radiology", "Medical physics", "Quantitative imaging"],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Healthcare professionals and clinical researchers",
    },
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
    name: "Structuration de pipelines scanner à comptage photonique",
    serviceType: [
      "Audit DICOM photon-counting",
      "Validation matière et énergie",
      "Contrôle qualité multicentrique",
      "Intégration CT spectral avancé",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Cadrage méthodologique pour exploiter le SPCCT en biomarqueurs quantitatifs comparables et défendables.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      {
        "@type": "ListItem",
        position: 3,
        name: "CT spectral avancé",
        item: "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Scanner à comptage photonique",
        item: CANONICAL,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
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
        <title>Scanner à comptage photonique: séparation matière, K-edge et quantification | NOXIA</title>
        <meta
          name="description"
          content="Scanner à comptage photonique: séparation matière, imagerie K-edge, détectabilité et quantification en CT spectral avancé."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(medicalWebPageJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
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
                { label: "CT spectral avancé", path: "/ct-quantitatif-avance-imagerie-spectrale" },
                { label: "Scanner à comptage photonique" },
              ]}
            />

            <ExpertiseHero
              badge="SPCCT clinique"
              badgeIcon={Cpu}
              title="Scanner à comptage photonique (SPCCT)"
              description="Le SPCCT est désormais une technologie clinique qui change réellement le CT lorsqu’on cherche plus de résolution, une séparation matière plus spécifique, une imagerie K-edge exploitable et une quantification utile."
              chips={["SPCCT", "K-edge", "Séparation matière", "Quantification"]}
              actions={[
                { label: "Cadrer un pipeline SPCCT", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir le pilier CT spectral", to: "/ct-quantitatif-avance-imagerie-spectrale", variant: "secondary", icon: Database },
                { label: "Voir DECT vs conventionnel", to: "/scanner-double-energie", variant: "secondary", icon: Workflow },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Ce que change réellement le comptage photonique</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le SPCCT n’est plus seulement un sujet de preuve de concept. En pratique clinique,
                la résolution spatiale supérieure est déjà tangible sur des structures fines,
                notamment en cardio-thoracique et en imagerie vasculaire.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sa valeur ne se limite pas à la résolution: séparation matière, imagerie K-edge,
                détectabilité et quantification ciblée sont désormais documentées. Ces bénéfices sont
                déjà accessibles en clinique, mais leur niveau de performance dépend de l’usage, du
                protocole et de la chaîne de reconstruction.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Ce que le SPCCT apporte — et ce qu’il faut encore contrôler</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Apports déjà tangibles
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Résolution spatiale plus fine sur structures de petite taille.</li>
                    <li>Meilleure séparation matière en comparaison de CT intégrateurs.</li>
                    <li>Imagerie spectrale et K-edge plus spécifiques pour certaines tâches de caractérisation et de quantification.</li>
                    <li>Meilleure efficience de dose dans certains protocoles.</li>
                    <li>Réduction possible de dose et/ou de charge iodée selon l’indication, le protocole et la reconstruction.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Points encore critiques
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Dépendance forte aux choix de reconstruction et de post-traitement.</li>
                    <li>Stabilité quantitative sensible au protocole d’acquisition.</li>
                    <li>Comparabilité inter-systèmes non triviale en multicentrique.</li>
                    <li>Validation indispensable des endpoints avant usage d’étude.</li>
                    <li>Risque de surestimation si gain visuel et robustesse métrique sont confondus.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Exemples de résultats déjà rapportés</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Perfusion rénale dual-contraste</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Faisabilité d&apos;une perfusion rénale dynamique avec iode et gadolinium K-edge,
                    avec modélisation gamma variate et corrélations significatives entre cartes HU,
                    iode et gadolinium.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Imagerie thoracique humaine haute résolution</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Faisabilité humaine rapportée avec visualisation plus fine des petites voies
                    aériennes, des vaisseaux et des parois bronchiques, y compris dans des contextes
                    de dose maîtrisée selon protocole.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Imagerie cardiaque et coronaire avancée</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Intérêt rapporté pour l’analyse des stents, calcifications et plaques, avec
                    amélioration de la détectabilité et lecture plus fine des structures coronaires,
                    notamment sur les effets de blooming.
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Leur exploitation quantitative reste toutefois dépendante de la reconstruction, de la calibration et de la cohérence de la chaîne technique.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Quand le SPCCT apporte réellement quelque chose</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Situations favorables</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Analyse de petites structures avec exigence de haute résolution.</li>
                    <li>Stents, calcifications, coronaires et plaque avec besoin de lecture fine.</li>
                    <li>Séparation matière lorsque l’information énergétique change la décision.</li>
                    <li>Imagerie d’agents spécifiques et approches K-edge ciblées.</li>
                    <li>Quantification dédiée dans un pipeline acquisition/reconstruction stabilisé.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Situations à risque d’interprétation</h3>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Comparaisons de valeurs entre protocoles non harmonisés.</li>
                    <li>Extrapolation multicentrique sans contrôle inter-systèmes.</li>
                    <li>Confusion entre gain visuel et endpoint quantitativement robuste.</li>
                    <li>Lecture indépendante des cartes sans contrôle de cohérence inter-reconstructions.</li>
                    <li>Sous-estimation de l’impact des paramètres de reconstruction.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Ce que NOXIA opère en pratique</h2>
              <p className="text-muted-foreground leading-relaxed">
                NOXIA structure un signal spectral riche en sorties défendables: comparaison HU, monoE
                et cartes matière, cohérence inter-reconstructions, extraction de métriques
                quantitatives et revue dédiée dans des viewers spectraux pour replacer chaque carte
                dans une lecture cohérente de l’ensemble des reconstructions.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cette approche s&apos;inscrit dans une logique d&apos;
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie quantitative
                </Link>{" "}
                et de{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  lecture Core Lab
                </Link>
                {" "}: l&apos;objectif reste une mesure exploitable, traçable, comparée et
                interprétable dans un contexte clinique ou d&apos;étude.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">Questions fréquentes – Scanner à comptage photonique</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.question} className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                    <h3 className="font-semibold text-foreground">{item.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Pages associées</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/ct-quantitatif-avance-imagerie-spectrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT spectral avancé <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/scanner-spectral-principe" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Principe spectral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/scanner-double-energie" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Scanner double énergie <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ct-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT quantitative <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Le SPCCT devient réellement utile lorsqu’un gain instrumental est transformé en
                mesure exploitable, traçable et interprétable.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Discuter d’un pipeline SPCCT
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

export default ScannerComptagePhoton;
