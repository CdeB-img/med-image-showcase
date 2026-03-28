import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Brain,
  Activity,
  BarChart3,
  ShieldCheck,
  Layers,
  AlertTriangle,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/metabolisme-cerebral";

const FAQ_ITEMS = [
  {
    question: "Que recouvre le metabolisme cerebral en imagerie quantitative ?",
    answer:
      "Il recouvre la lecture combinee de l'extraction et de la consommation d'oxygene, en pratique via OEF, CMRO2 et leur contexte hemodynamique. L'objectif est d'estimer la viabilite tissulaire, pas seulement le debit.",
  },
  {
    question: "OEF et CMRO2 sont-ils interchangeables ?",
    answer:
      "Non. L'OEF renseigne sur l'extraction, le CMRO2 sur la consommation metabolique. Une interpretation robuste exige de les lire avec la perfusion et la diffusion.",
  },
  {
    question: "Pourquoi parler de metabolisme en plus de la perfusion ?",
    answer:
      "Parce qu'une hypoperfusion n'implique pas toujours un echec energetique complet. Le metabolisme aide a distinguer compensation, penombre et tissu deja non viable.",
  },
  {
    question: "Les mesures metaboliques sont-elles directement transposables entre centres ?",
    answer:
      "Pas sans methode explicite. Les resultats dependent des modeles, des sequences et du post-traitement. Une harmonisation multicentrique et des controles QA sont indispensables.",
  },
];

const MetabolismeCerebral = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Metabolisme cerebral en imagerie quantitative",
    description:
      "Hub metabolisme cerebral: OEF, CMRO2, perfusion metabolique IRM et cadre methodologique pour biomarqueurs neurovasculaires robustes.",
    about: [
      "Cerebral metabolism imaging",
      "OEF",
      "CMRO2",
      "Ischemic stroke imaging",
      "Perfusion MRI",
      "Tissue viability",
      "Multicenter harmonization",
    ],
    specialty: ["Neurology", "Neuroradiology", "Clinical research imaging"],
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
    name: "Structuration de biomarqueurs de metabolisme cerebral",
    serviceType: [
      "Lecture OEF/CMRO2",
      "Pipeline perfusion metabolique IRM",
      "Validation de viabilite tissulaire",
      "Harmonisation multicentrique neuro",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Conception et validation d'approches metaboliques neuro en imagerie quantitative, avec tracabilite des modeles et robustesse multicentrique.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Métabolisme cérébral", item: CANONICAL },
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
        <title>Métabolisme cérébral: OEF, CMRO2 et viabilité tissulaire | NOXIA</title>
        <meta
          name="description"
          content="Métabolisme cérébral en imagerie quantitative: OEF, CMRO2, perfusion métabolique IRM et validation multicentrique des biomarqueurs de viabilité."
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
                { label: "Métabolisme cérébral" },
              ]}
            />

            <ExpertiseHero
              badge="Hub métabolique neuro"
              badgeIcon={Brain}
              title="Métabolisme cérébral en imagerie quantitative"
              description="Relier OEF, CMRO2 et perfusion pour caractériser la viabilité tissulaire en AVC au-delà de la seule lecture hémodynamique."
              chips={["OEF", "CMRO2", "Viabilité tissulaire"]}
              actions={[
                { label: "Discuter d'un protocole neuro", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir OEF", to: "/oef-imagerie-cerebrale", variant: "secondary", icon: Activity },
                { label: "Voir CMRO2", to: "/cmro2-imagerie-cerebrale", variant: "secondary", icon: BarChart3 },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Définition du métabolisme cérébral en imagerie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le métabolisme cérébral en imagerie quantitative vise à estimer l&apos;utilisation de l&apos;oxygène par le
                tissu, en particulier via l&apos;OEF et le CMRO2. Cette approche répond à une question clinique centrale:
                un territoire hypoperfusé est-il encore viable sur le plan énergétique ?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                La lecture métabolique se discute toujours avec la{" "}
                <Link to="/perfusion-cerebrale" className="text-primary hover:underline">
                  perfusion cérébrale
                </Link>{" "}
                et le cadre de{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologie quantitative
                </Link>
                .
              </p>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Activity className="w-5 h-5 text-primary" />
                  OEF
                </div>
                <p className="text-sm text-muted-foreground">
                  Mesure l&apos;extraction d&apos;oxygène. Utile pour identifier une compensation métabolique en cas
                  d&apos;hypoperfusion.
                </p>
                <Link to="/oef-imagerie-cerebrale" className="text-primary text-sm font-medium hover:underline">
                  Focus OEF
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Brain className="w-5 h-5 text-primary" />
                  CMRO2
                </div>
                <p className="text-sm text-muted-foreground">
                  Approche de la consommation d&apos;oxygène tissulaire. Informe sur la viabilité au-delà du débit.
                </p>
                <Link to="/cmro2-imagerie-cerebrale" className="text-primary text-sm font-medium hover:underline">
                  Focus CMRO2
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Layers className="w-5 h-5 text-primary" />
                  Intégration
                </div>
                <p className="text-sm text-muted-foreground">
                  Interprétation conjointe OEF/CMRO2/perfusion pour distinguer pénombre, compensation et infarctus établi.
                </p>
                <Link
                  to="/perfusion-metabolique-neuro-imagerie"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Pipeline perfusion métabolique
                </Link>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">Lien perfusion ↔ métabolisme</h2>
              <p>
                La perfusion et le métabolisme répondent à deux questions complémentaires: combien de sang arrive
                (transport) et comment l&apos;oxygène est utilisé (fonction). C&apos;est leur couplage qui permet une lecture
                robuste de la viabilité tissulaire en phase aiguë.
              </p>
              <p>
                Cette articulation est détaillée dans le{" "}
                <Link to="/perfusion-cerebrale" className="text-primary hover:underline">
                  hub perfusion cérébrale
                </Link>{" "}
                et opérationnalisée dans{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  la perfusion métabolique IRM
                </Link>
                .
              </p>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                OEF vs CMRO2: complémentarité physiopathologique
              </h2>
              <p>
                L&apos;OEF et le CMRO2 ne répondent pas à la même question. L&apos;OEF renseigne sur l&apos;effort d&apos;extraction,
                alors que le CMRO2 renseigne sur l&apos;activité métabolique effective. C&apos;est leur combinaison qui permet
                une lecture plus robuste de la viabilité tissulaire.
              </p>
              <p>
                En pratique, cette interprétation doit être alignée avec les marqueurs de{" "}
                <Link to="/perfusion-hemodynamique-neuro-imagerie" className="text-primary hover:underline">
                  perfusion hémodynamique
                </Link>
                , puis consolidée dans une architecture de{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  pipeline versionné
                </Link>
                .
              </p>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Notion de pénombre et logique physiopathologique
              </h2>
              <p>
                La pénombre correspond à un tissu menacé mais potentiellement récupérable: la perfusion est insuffisante
                mais le métabolisme n&apos;est pas encore totalement effondré. L&apos;objectif de la lecture OEF/CMRO2 est
                justement de préciser cette zone intermédiaire.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Hypoperfusion avec compensation: OEF tend à augmenter.</li>
                <li>Défaillance métabolique: CMRO2 diminue durablement.</li>
                <li>Échec tissulaire installé: chute conjointe des indicateurs fonctionnels.</li>
              </ul>
              <p>
                En pratique, cette logique physiopathologique doit rester alignée avec la{" "}
                <Link to="/perfusion-hemodynamique-neuro-imagerie" className="text-primary hover:underline">
                  lecture hémodynamique
                </Link>{" "}
                et les contrôles QA du pipeline.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Point de vigilance méthodologique
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Les marqueurs métaboliques sont sensibles aux hypothèses de modèle, à la normalisation et au bruit.
                Une valeur isolée ne suffit pas. La robustesse vient de la cohérence inter-marqueurs, du contexte
                clinique et de la traçabilité du pipeline.
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Données de la littérature: repères prudents
              </div>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>L&apos;OEF normale est souvent rapportée autour de 30-40% selon la méthode et la population.</li>
                <li>Des augmentations d&apos;OEF sont observées en pénombre ischémique avant effondrement métabolique.</li>
                <li>Le CMRO2 diminue dans les territoires non viables, avec variabilité selon modèle et modalité.</li>
                <li>La comparabilité inter-centres s&apos;améliore avec normalisation intra-sujet et QA explicite.</li>
              </ul>
              <p className="text-muted-foreground">
                Message clé: la valeur clinique est dans l&apos;interprétation intégrée, pas dans un chiffre isolé.
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
                  to="/perfusion-metabolique-neuro-imagerie"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Perfusion métabolique IRM <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/perfusion-cerebrale"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Hub perfusion cérébrale <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/oef-imagerie-cerebrale"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  OEF cérébral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/cmro2-imagerie-cerebrale"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  CMRO2 cérébral <ArrowRight className="w-4 h-4" />
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
                  Le métabolisme cérébral apporte une couche décisionnelle clé sur la viabilité tissulaire. Sa valeur
                  dépend d&apos;une lecture intégrée avec la perfusion, d&apos;une méthode explicite et d&apos;une validation
                  multicentrique rigoureuse.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Structurer une analyse métabolique
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

export default MetabolismeCerebral;
