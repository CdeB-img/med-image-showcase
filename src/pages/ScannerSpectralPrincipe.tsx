import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Atom,
  Workflow,
  Layers,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Database,
  FileText,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/scanner-spectral-principe";

const FAQ_ITEMS = [
  {
    question: "Qu’est-ce que le scanner spectral en une phrase ?",
    answer:
      "Le scanner spectral exploite l'information énergétique des photons pour mieux différencier les matériaux que le scanner conventionnel mono-énergie apparente.",
  },
  {
    question: "Le principe spectral est-il identique en DECT et en comptage photonique ?",
    answer:
      "Le principe général est commun (information énergie-dépendante), mais l’implémentation instrumentale diffère entre DECT et détecteurs à comptage photonique.",
  },
  {
    question: "Pourquoi ce principe est-il important pour la quantification ?",
    answer:
      "Parce qu'il aide à séparer les contributions matière/énergie et réduit le risque de confondre un effet technique avec un effet biologique.",
  },
  {
    question: "Un principe physique suffit-il pour un endpoint clinique ?",
    answer:
      "Non. Il faut un pipeline complet: protocole stable, calibration, QA, traçabilité et validation multicentrique.",
  },
];

const ScannerSpectralPrincipe = () => {
  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Principe du scanner spectral en imagerie quantitative",
    description:
      "Principe physique du scanner spectral: énergie, décomposition matière, différences DECT/PCCT et implications pour biomarqueurs CT robustes.",
    about: [
      "Spectral CT principle",
      "Dual-energy CT principle",
      "Photon-counting CT principle",
      "Photoelectric effect",
      "Compton interaction",
      "Material decomposition",
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
    name: "Cadrage physique du scanner spectral",
    serviceType: [
      "Explicitation des hypothèses physiques",
      "Validation des reconstructions énergétiques",
      "Intégration en pipeline quantitatif",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Traduction des principes spectraux en règles opérationnelles pour des mesures CT reproductibles.",
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
      { "@type": "ListItem", position: 5, name: "Principe spectral", item: CANONICAL },
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
        <title>Principe du scanner spectral: DECT, PCCT et quantification | NOXIA</title>
        <meta
          name="description"
          content="Principe du scanner spectral: bases physiques, différences DECT/PCCT et impact concret sur la robustesse des biomarqueurs CT multicentriques."
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
                { label: "Principe spectral" },
              ]}
            />

            <ExpertiseHero
              badge="Fondamentaux physiques"
              badgeIcon={Atom}
              title="Principe du scanner spectral"
              description="Comprendre la logique physique (énergie, matière, reconstruction) pour éviter les interprétations quantitatives fragiles."
              chips={["Photoélectrique/Compton", "DECT vs PCCT", "Validation pipeline"]}
              actions={[
                { label: "Voir le pilier CT spectral", to: "/ct-quantitatif-avance-imagerie-spectrale", variant: "primary", icon: ArrowRight },
                { label: "Voir scanner double énergie", to: "/scanner-double-energie", variant: "secondary", icon: Workflow },
                { label: "Voir scanner comptage photonique", to: "/scanner-comptage-photon", variant: "secondary", icon: Database },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Définition du principe spectral</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le scanner spectral exploite la dépendance à l’énergie de l’atténuation des tissus. L’idée centrale est de ne plus considérer une seule densité apparente, mais une réponse énergie-dépendante qui permet une meilleure décomposition matière. C’est cette base physique qui justifie les applications quantitatives avancées en CT.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Comment cela fonctionne concrètement</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Workflow className="w-5 h-5 text-primary" />
                    Acquisition
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mesure multi-énergie (simultanée ou reconstruite) selon l’architecture détecteur et la stratégie d’acquisition.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="w-5 h-5 text-primary" />
                    Modélisation
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Décomposition des composantes matière avec hypothèses physiques et contraintes de reconstruction.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Validation
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vérification par QA, calibration et cohérence multicentrique avant interprétation clinique.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Ce que le principe spectral n’autorise pas automatiquement
              </div>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Comparer des valeurs inter-sites sans harmonisation.</li>
                <li>Déduire un biomarqueur robuste à partir d’un seul rendu visuel.</li>
                <li>Confondre amélioration de contraste et validité quantitative.</li>
              </ul>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Données de la littérature (ordres de grandeur prudents)</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Observations récurrentes
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Des gains de contraste peuvent être importants à basses énergies.</li>
                    <li>Le bruit augmente souvent quand l’énergie baisse fortement.</li>
                    <li>Les écarts inter-vendor restent non négligeables sans harmonisation.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    Impact pratique
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Le protocole et la reconstruction gouvernent la robustesse finale.</li>
                    <li>La calibration indépendante reste un prérequis d’endpoint.</li>
                    <li>Le pipeline doit être versionné et auditable en multicentrique.</li>
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
                <li>Consensus sur imagerie CT spectral/DECT et pratiques de reconstruction.</li>
                <li>Cadres de physique médicale (QA, calibration, comparabilité).</li>
                <li>Guides de reproductibilité pour biomarqueurs quantitatifs en recherche clinique.</li>
              </ul>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">Questions fréquentes – Principe spectral</h2>
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
                <Link to="/scanner-double-energie" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Scanner double énergie <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/scanner-comptage-photon" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Scanner à comptage photonique <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ct-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT quantitative <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Le principe spectral est un levier puissant, à condition d’être converti en règles de mesure explicites.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Échanger sur votre stratégie CT spectral
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

export default ScannerSpectralPrincipe;
