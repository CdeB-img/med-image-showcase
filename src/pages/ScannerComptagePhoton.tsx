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
  BarChart3,
  Workflow,
  Layers,
  Database,
  FileText,
  Activity,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/scanner-comptage-photon";

const FAQ_ITEMS = [
  {
    question: "Le scanner à comptage photonique remplace-t-il immédiatement le DECT ?",
    answer:
      "Pas en pratique courante. Il apporte des avantages physiques importants, mais son déploiement reste progressif et dépend des usages, des coûts et de la maturité des pipelines.",
  },
  {
    question: "Quels gains sont attendus avec le comptage photonique ?",
    answer:
      "Les gains attendus concernent surtout la résolution spatiale, l'efficacité énergétique et la caractérisation matière. Leur impact clinique dépend toutefois des protocoles et de la validation locale.",
  },
  {
    question: "Les mesures sont-elles automatiquement plus robustes ?",
    answer:
      "Non. La technologie améliore le signal disponible, mais la robustesse reste liée à la calibration, au QA, à la reconstruction et à l'harmonisation multicentrique.",
  },
  {
    question: "Existe-t-il un intérêt hors scanner diagnostique, notamment en interventionnel ?",
    answer:
      "Oui, potentiellement. Les principes du comptage photonique intéressent aussi l'imagerie interventionnelle et des capteurs spectraux dédiés, mais les applications cliniques restent hétérogènes selon les plateformes.",
  },
];

const ScannerComptagePhoton = () => {
  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Scanner à comptage photonique: enjeux quantitatifs",
    description:
      "Scanner à comptage photonique (PCCT): principes, bénéfices, limites et ouverture vers l'imagerie interventionnelle et les capteurs spectraux hors scanner.",
    about: [
      "Photon-counting CT",
      "Spectral imaging",
      "Energy-resolved detectors",
      "Material decomposition",
      "Dose optimization",
      "Interventional imaging",
      "Quantitative biomarkers",
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
      "Cadrage méthodologique pour exploiter le comptage photonique en biomarqueurs quantitatifs robustes et comparables entre sites.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "CT", item: "https://noxia-imagerie.fr/ct-imagerie-quantitative" },
      {
        "@type": "ListItem",
        position: 4,
        name: "CT quantitatif avancé",
        item: "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale",
      },
      { "@type": "ListItem", position: 5, name: "Scanner à comptage photonique", item: CANONICAL },
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
        <title>Scanner à comptage photonique: enjeux cliniques et QA | NOXIA</title>
        <meta
          name="description"
          content="Scanner à comptage photonique: principes, bénéfices réels, limites techniques et intégration multicentrique en quantification CT."
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
                { label: "CT", path: "/ct-imagerie-quantitative" },
                { label: "CT quantitatif avancé", path: "/ct-quantitatif-avance-imagerie-spectrale" },
                { label: "Scanner à comptage photonique" },
              ]}
            />

            <ExpertiseHero
              badge="Satellite CT spectral"
              badgeIcon={Cpu}
              title="Scanner à comptage photonique"
              description="Transformer le gain physique du photon-counting en mesure clinique robuste: résolution, caractérisation matière, QA et comparabilité multicentrique."
              chips={["PCCT", "Résolution & énergie", "Validation multicentrique"]}
              actions={[
                { label: "Cadrer un pipeline PCCT", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir le pilier CT spectral", to: "/ct-quantitatif-avance-imagerie-spectrale", variant: "secondary", icon: Database },
                { label: "Voir DECT vs conventionnel", to: "/scanner-double-energie", variant: "secondary", icon: Workflow },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Définition du scanner à comptage photonique</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le scanner à comptage photonique détecte les photons individuellement et exploite l’information énergétique de façon plus fine que les détecteurs intégrateurs classiques. Cette approche ouvre des perspectives fortes en quantification, mais impose une discipline technique stricte pour éviter de sur-interpréter des gains instrumentaux non validés cliniquement.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Apports potentiels et limites actuelles</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Atouts attendus
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Résolution spatiale plus fine selon protocoles et matrices.</li>
                    <li>Meilleure efficience énergétique pour la caractérisation matière.</li>
                    <li>Réduction de certains artéfacts et meilleure séparation spectrale.</li>
                    <li>Potentiel d'amélioration de biomarqueurs densité/matière.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Limites de déploiement
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Dépendance aux algorithmes de correction et de reconstruction.</li>
                    <li>Volumes de données et complexité de QA accrus.</li>
                    <li>Comparabilité inter-vendor encore en consolidation.</li>
                    <li>Nécessité d'une validation endpoint avant usage d'essai.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Activity className="w-5 h-5 text-primary" />
                Ouverture hors scanner: interventionnel et autres capteurs spectraux
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Les principes de comptage photonique intéressent aussi des domaines hors scanner diagnostique: imagerie interventionnelle, systèmes de fluoroscopie spectraux et capteurs spécialisés. L’enjeu reste le même: transformer un signal physique riche en indicateur clinique reproductible.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Dans cette perspective, la logique développée en{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie quantitative
                </Link>{" "}
                et{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation multicentrique
                </Link>{" "}
                reste la condition de crédibilité des biomarqueurs, quel que soit le capteur.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Données de la littérature (ordres de grandeur prudents)</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Tendances rapportées
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Amélioration possible de résolution et de contraste spectral selon protocoles.</li>
                    <li>Variabilité encore notable selon constructeur et chaîne de reconstruction.</li>
                    <li>Gains quantitatifs dépendants du QA et des calibrations locales.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="w-5 h-5 text-primary" />
                    Implication méthodologique
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Le gain matériel ne dispense pas de validation indépendante.</li>
                    <li>Les endpoints doivent rester robustes en conditions multicentriques.</li>
                    <li>La traçabilité des versions est critique en phase de transition technologique.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <FileText className="w-5 h-5 text-primary" />
                Références & consensus
              </div>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Recommandations émergentes sur le photon-counting CT en imagerie clinique.</li>
                <li>Guides de physique médicale sur calibration et contrôle spectral.</li>
                <li>Principes de reproductibilité pour biomarqueurs quantitatifs en recherche multicentrique.</li>
              </ul>
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
                Le comptage photonique est une avancée prometteuse, mais la crédibilité clinique repose toujours sur la validation méthodologique.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Discuter d’un pipeline PCCT
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
