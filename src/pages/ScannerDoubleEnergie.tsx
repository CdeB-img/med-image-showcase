import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Scale,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Workflow,
  Layers,
  Database,
  FileText,
  Atom,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/scanner-double-energie";

const FAQ_ITEMS = [
  {
    question: "Le scanner double énergie réduit-il toujours la dose ?",
    answer:
      "Non. En pratique, la dose peut diminuer dans certains scénarios (par exemple suppression d'une phase additionnelle), mais elle peut aussi augmenter si le protocole est mal cadré ou multiphase.",
  },
  {
    question: "Le double énergie remplace-t-il un scanner conventionnel ?",
    answer:
      "Pas totalement. Le scanner conventionnel reste pertinent pour de nombreux usages. Le double énergie apporte surtout une information matière et énergétique supplémentaire quand la question clinique le justifie.",
  },
  {
    question: "Pourquoi les valeurs ne sont-elles pas directement comparables entre centres ?",
    answer:
      "Parce que les implémentations varient selon le constructeur, les reconstructions, les filtres et les réglages d'énergie. Une harmonisation inter-centres est nécessaire avant comparaison quantitative.",
  },
  {
    question: "Une meilleure visualisation suffit-elle pour valider un biomarqueur ?",
    answer:
      "Non. La validation nécessite une chaîne complète: audit DICOM, calibration, versioning des paramètres, contrôles QA et reproductibilité multicentrique.",
  },
];

const ScannerDoubleEnergie = () => {
  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Scanner double énergie: comparaison avec scanner conventionnel",
    description:
      "Scanner double énergie (DECT): principes, avantages, limites, impacts dose et robustesse quantitative multicentrique versus scanner conventionnel.",
    about: [
      "Dual-energy CT",
      "Spectral CT",
      "Monoenergetic reconstruction",
      "Material decomposition",
      "Dose optimization",
      "HU variability",
      "Multicenter harmonization",
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
    name: "Structuration de protocoles scanner double énergie",
    serviceType: [
      "Audit DICOM dual-energy",
      "Validation monoénergétique",
      "Harmonisation inter-constructeurs",
      "Calibration et QA multicentrique",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Cadrage méthodologique des mesures DECT pour des biomarqueurs comparables et auditables en pratique clinique et en recherche.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "CT spectral avancé", item: "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale" },
      {
        "@type": "ListItem",
        position: 4,
        name: "Scanner double énergie",
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
        <title>Scanner double énergie vs conventionnel: cadre quantitatif | NOXIA</title>
        <meta
          name="description"
          content="Scanner double énergie vs conventionnel: gains cliniques, limites, impact dose et validation multicentrique pour mesures CT robustes."
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
                { label: "Scanner double énergie" },
              ]}
            />

            <ExpertiseHero
              badge="Satellite CT spectral"
              badgeIcon={Atom}
              title="Scanner double énergie vs scanner conventionnel"
              description="Comparer les apports réels du DECT: séparation matière, reconstructions monoénergétiques, effets dose et limites de robustesse quantitative."
              chips={["DECT", "Dose & bruit", "Comparabilité multicentrique"]}
              actions={[
                { label: "Cadrer un protocole DECT", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir le pilier CT spectral", to: "/ct-quantitatif-avance-imagerie-spectrale", variant: "secondary", icon: Database },
                { label: "Voir le principe spectral", to: "/scanner-spectral-principe", variant: "secondary", icon: Workflow },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Définition du scanner double énergie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le scanner double énergie acquiert ou reconstruit l’information à plusieurs niveaux d’énergie, ce qui améliore la différenciation matière par rapport au scanner conventionnel. Son intérêt n’est pas uniquement visuel: il peut renforcer certaines mesures quantitatives, à condition de contrôler reconstruction, calibration et variabilité inter-constructeurs.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Avantages et inconvénients en pratique</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Avantages du double énergie
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Meilleure séparation matière (iode, calcium, eau) selon indication.</li>
                    <li>Reconstructions monoénergétiques utiles pour certaines tâches diagnostiques.</li>
                    <li>Possibilité de remplacer une phase additionnelle dans certains protocoles.</li>
                    <li>Potentiel de robustesse accrue quand la calibration est maîtrisée.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Limites et risques opérationnels
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>La dose n’est pas mécaniquement réduite dans tous les protocoles.</li>
                    <li>La dose peut augmenter si acquisitions multiphases ou réglages non optimisés.</li>
                    <li>Sensibilité au bruit accrue à basses énergies selon reconstruction.</li>
                    <li>Comparabilité inter-centres fragile sans harmonisation explicite.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Scale className="w-5 h-5 text-primary" />
                DECT vs CT conventionnel: lecture méthodologique
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Le CT conventionnel reste adapté à de nombreux usages cliniques courants. Le DECT devient pertinent quand la question clinique exige une information énergétique supplémentaire et qu’un pipeline robuste est disponible. La vraie différence se fait sur la gouvernance technique: règles d’acquisition, audit DICOM, calibration et QA.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Cette logique s’inscrit dans le cadre du{" "}
                <Link to="/ct-quantitatif-avance-imagerie-spectrale" className="text-primary hover:underline">
                  pilier CT quantitatif avancé
                </Link>{" "}
                et complète les approches de{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT
                </Link>{" "}
                et de{" "}
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                  perfusion CT
                </Link>
                .
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Données de la littérature (ordres de grandeur prudents)</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Tendances observées
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Des gains de contraste de l’ordre de plusieurs dizaines de pourcents peuvent être rapportés à basse énergie.</li>
                    <li>Des variations de plusieurs HU persistent selon reconstruction et constructeur.</li>
                    <li>La stabilité peut se dégrader quand l’énergie baisse fortement et que le bruit augmente.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="w-5 h-5 text-primary" />
                    Implication opérationnelle
                  </div>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                    <li>Comparer des chiffres bruts sans harmonisation expose à un biais technique.</li>
                    <li>L’effet dose dépend davantage du protocole que de la seule technologie DECT.</li>
                    <li>La reproductibilité doit être vérifiée entre centres avant endpoint d’essai.</li>
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
                <li>Recommandations de sociétés savantes sur le scanner spectral / dual-energy.</li>
                <li>Cadres de physique médicale sur calibration phantom et QA CT.</li>
                <li>Principes de reproductibilité des biomarqueurs quantitatifs multicentriques.</li>
              </ul>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">Questions fréquentes – Scanner double énergie</h2>
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
                Le double énergie améliore l'information disponible, mais la robustesse vient du pipeline et du contrôle qualité.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Discuter d’un protocole DECT
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

export default ScannerDoubleEnergie;
