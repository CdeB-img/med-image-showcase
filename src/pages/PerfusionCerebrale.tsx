import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Activity,
  Timer,
  BarChart3,
  ShieldCheck,
  Layers,
  Brain,
  AlertTriangle,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/perfusion-cerebrale";

const FAQ_ITEMS = [
  {
    question: "Que couvre une page de perfusion cerebrale en imagerie quantitative ?",
    answer:
      "Elle couvre les marqueurs hemodynamiques (CBF, CBV, Tmax, MTT/TTP), la CT perfusion AVC et leur articulation avec la lecture metabolique. L'objectif est de relier physiologie et robustesse de mesure.",
  },
  {
    question: "Pourquoi separer perfusion hemodynamique et metabolisme cerebral ?",
    answer:
      "Parce que l'hemodynamique decrit le transport sanguin alors que le metabolisme decrit l'utilisation de l'oxygene. Les deux dimensions sont complementaires, mais ne doivent pas etre confondues.",
  },
  {
    question: "Les cartes de perfusion sont-elles comparables entre logiciels ?",
    answer:
      "Pas automatiquement. Les algorithmes de deconvolution, l'AIF/VOF et les seuils varient selon les outils. Une validation locale et multicentrique est necessaire avant usage en endpoint.",
  },
  {
    question: "Pourquoi la perfusion cerebrale doit-elle etre cadree methodologiquement ?",
    answer:
      "Sans pipeline traceable, la variabilite technique peut depasser le signal biologique. Un cadre QA, versioning et harmonisation inter-centres est indispensable pour des conclusions defendables.",
  },
];

const PerfusionCerebrale = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Perfusion cerebrale en imagerie quantitative",
    description:
      "Hub perfusion cerebrale: perfusion hemodynamique IRM, CT perfusion AVC, lecture physiopathologique et validation multicentrique des biomarqueurs.",
    about: [
      "Cerebral perfusion imaging",
      "Perfusion MRI",
      "CT perfusion",
      "CBF",
      "CBV",
      "Tmax",
      "MTT",
      "TTP",
      "Penumbra",
      "Core estimation",
      "Multicenter imaging reproducibility",
    ],
    specialty: ["Neuroradiology", "Neurology", "Clinical research imaging"],
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
    name: "Structuration de biomarqueurs de perfusion cerebrale",
    serviceType: [
      "Audit DICOM dynamique",
      "Analyse CBF/CBV/Tmax/MTT/TTP",
      "Validation core/penombre",
      "Harmonisation multicentrique",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Conception et validation de pipelines de perfusion cerebrale pour produire des mesures robustes, comparables entre centres et auditables.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Perfusion cerebrale", item: CANONICAL },
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
        <title>Perfusion cerebrale: IRM hemodynamique et CT AVC | NOXIA</title>
        <meta
          name="description"
          content="Perfusion cerebrale quantitative: IRM hemodynamique, CT perfusion AVC, validation multicentrique et interpretation clinique des biomarqueurs neurovasculaires."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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
                { label: "Perfusion cérébrale" },
              ]}
            />

            <ExpertiseHero
              badge="Hub neurovasculaire"
              badgeIcon={Activity}
              title="Perfusion cérébrale en imagerie quantitative"
              description="Structurer la lecture hémodynamique et son interprétation clinique en AVC: CBF/CBV/Tmax, cartes core/pénombre et robustesse multicentrique."
              chips={["IRM hémodynamique", "CT perfusion AVC", "Validation multicentrique"]}
              actions={[
                { label: "Échanger sur un protocole", to: "/contact", variant: "primary", icon: ArrowRight },
                {
                  label: "Perfusion hémodynamique IRM",
                  to: "/perfusion-hemodynamique-neuro-imagerie",
                  variant: "secondary",
                  icon: Timer,
                },
                {
                  label: "CT perfusion AVC",
                  to: "/ct-perfusion-quantitative-avc",
                  variant: "secondary",
                  icon: ArrowRight,
                },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Définition de la perfusion cérébrale</h2>
              <p className="text-muted-foreground leading-relaxed">
                En imagerie quantitative, la perfusion cérébrale décrit l&apos;apport sanguin et les délais de transit
                dans le tissu cérébral, avec des marqueurs comme CBF, CBV, Tmax, MTT et TTP. L&apos;enjeu n&apos;est pas de
                produire une carte colorée, mais une mesure fiable et comparable entre patients, logiciels et centres.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cette lecture se construit avec un cadre d&apos;
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  audit DICOM
                </Link>{" "}
                dynamique, d&apos;
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie quantitative
                </Link>{" "}
                et d&apos;
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation multicentrique
                </Link>
                .
              </p>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Timer className="w-5 h-5 text-primary" />
                  Hémodynamique
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyse CBF/CBV/Tmax/MTT/TTP, delay maps et cohérence de transit dans l&apos;ischémie aiguë.
                </p>
                <Link
                  to="/perfusion-hemodynamique-neuro-imagerie"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Ouvrir la page hémodynamique
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Brain className="w-5 h-5 text-primary" />
                  Métabolisme
                </div>
                <p className="text-sm text-muted-foreground">
                  Lecture OEF/CMRO2 et adaptation énergétique, dans la continuité de la perfusion IRM métabolique.
                </p>
                <Link to="/metabolisme-cerebral" className="text-primary text-sm font-medium hover:underline">
                  Ouvrir le hub métabolisme
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Layers className="w-5 h-5 text-primary" />
                  Translation clinique
                </div>
                <p className="text-sm text-muted-foreground">
                  CT perfusion AVC, logique core/pénombre et articulation avec les décisions de reperfusion.
                </p>
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary text-sm font-medium hover:underline">
                  Voir CT perfusion AVC
                </Link>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Perfusion cérébrale: différence IRM vs CT
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">IRM perfusion</div>
                  <p className="text-sm text-muted-foreground">
                    Très utile pour intégrer diffusion, perfusion et contexte tissulaire sans irradiation. Les
                    paramètres restent sensibles aux séquences, au post-traitement et à la standardisation inter-centres.
                  </p>
                  <Link
                    to="/perfusion-hemodynamique-neuro-imagerie"
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Voir la perfusion hémodynamique IRM
                  </Link>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">CT perfusion</div>
                  <p className="text-sm text-muted-foreground">
                    Très utilisée en AVC aigu pour cartographier vite core/pénombre, avec forte dépendance aux
                    hypothèses de déconvolution, aux seuils et au logiciel d&apos;analyse.
                  </p>
                  <Link
                    to="/ct-perfusion-quantitative-avc"
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Voir la CT perfusion AVC
                  </Link>
                </div>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">Rôle de CBF, CBV et Tmax</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
                  <div className="font-semibold text-foreground">CBF (débit)</div>
                  <p className="text-sm text-muted-foreground">
                    Indique la baisse de perfusion active. Une chute marquée soutient l&apos;hypoperfusion significative.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
                  <div className="font-semibold text-foreground">CBV (volume)</div>
                  <p className="text-sm text-muted-foreground">
                    Informe sur le compartiment sanguin perfusé, utile pour nuancer la sévérité et la compensation.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
                  <div className="font-semibold text-foreground">Tmax (retard)</div>
                  <p className="text-sm text-muted-foreground">
                    Mesure le retard hémodynamique et participe à la définition des volumes à risque selon les seuils.
                  </p>
                </div>
              </div>
              <p>
                Ces trois marqueurs décrivent surtout le transport sanguin. Pour une lecture de viabilité, il faut les
                relier au volet{" "}
                <Link to="/metabolisme-cerebral" className="text-primary hover:underline">
                  métabolisme cérébral
                </Link>{" "}
                (notamment OEF/CMRO2).
              </p>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">Architecture d&apos;un pipeline de perfusion robuste</h2>
              <p>
                Un pipeline robuste sépare l&apos;acquisition, le calcul des cartes, la définition des seuils et
                l&apos;interprétation clinique. Cette séparation évite de confondre une variation de logiciel avec une
                variation physiopathologique réelle.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit géométrique et temporel des séries dynamiques.</li>
                <li>Contrôle des fonctions AIF/VOF et de la déconvolution.</li>
                <li>Versioning explicite des seuils core/pénombre.</li>
                <li>QA entrée/sortie avec logs et overlays de relecture.</li>
              </ul>

              <p>
                Ce socle s&apos;intègre dans la{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologie quantitative
                </Link>{" "}
                et se complète naturellement avec le volet{" "}
                <Link to="/metabolisme-cerebral" className="text-primary hover:underline">
                  métabolisme cérébral
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Lecture clinique: ce qui piège le plus
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Les cartes core/pénombre sont des objets calculés, pas des vérités anatomopathologiques directes. Une
                différence de logiciel, d&apos;AIF ou de seuil peut déplacer les volumes estimés. L&apos;interprétation doit
                toujours être recontextualisée avec les données cliniques et la temporalité de reperfusion.
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Données de la littérature: ordres de grandeur utiles
              </div>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Des variations inter-logiciels de plusieurs secondes sur Tmax sont rapportées selon la déconvolution.</li>
                <li>Les estimations core/pénombre changent avec les seuils et la qualité de calibration temporelle.</li>
                <li>La variabilité multicentrique diminue nettement avec protocoles harmonisés et QA explicite.</li>
                <li>Le signal hémodynamique seul ne suffit pas toujours à expliquer la viabilité tissulaire.</li>
              </ul>

              <p className="text-muted-foreground">
                Lecture pratique: stabiliser d&apos;abord la variance technique, puis interpréter la variance biologique.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">Questions fréquentes</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.question} className="rounded-xl border border-border bg-card/50 p-6">
                    <h3 className="font-semibold text-foreground">{item.question}</h3>
                    <p className="text-muted-foreground mt-2">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Pages associées</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/perfusion-hemodynamique-neuro-imagerie"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Perfusion hémodynamique IRM <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/metabolisme-cerebral"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Métabolisme cérébral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ct-perfusion-quantitative-avc"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  CT perfusion AVC <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/perfusion-metabolique-neuro-imagerie"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Perfusion métabolique IRM <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-6">
              <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                <div className="flex items-center justify-center gap-2 font-semibold text-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Synthèse
                </div>
                <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  La perfusion cérébrale utile en clinique et en recherche n&apos;est pas une collection de cartes, mais un
                  cadre de mesure reproductible reliant hémodynamique, contexte clinique et robustesse méthodologique.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Cadrer un projet neurovasculaire
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PerfusionCerebrale;
