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
  Layers,
  AlertTriangle,
  Workflow,
  ShieldCheck,
  Database
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/cmro2-imagerie-cerebrale";
const PERFUSION_CANONICAL =
  "https://noxia-imagerie.fr/perfusion-metabolique-neuro-imagerie";

const CMRO2Imagerie = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CMRO2 en imagerie cerebrale - biomarqueur metabolique",
    description:
      "CMRO2 (cerebral metabolic rate of oxygen) : biomarqueur du metabolisme cerebral, interpretation physiopathologique, relation avec l'OEF et applications en AVC.",
    about: [
      "CMRO2",
      "Cerebral metabolic rate of oxygen",
      "OEF",
      "Cerebral metabolism",
      "Stroke imaging",
      "Perfusion MRI"
    ],
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
        name: "IRM",
        item: "https://noxia-imagerie.fr/irm-imagerie-quantitative"
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Perfusion & Metabolisme cerebral",
        item: PERFUSION_CANONICAL
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "CMRO2",
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
        name: "Qu'est-ce que le CMRO2 en imagerie cerebrale ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Le CMRO2 correspond au taux de consommation d'oxygene cerebral. Il reflete l'activite metabolique neuronale et permet d'apprecier la viabilite tissulaire au-dela du seul debit sanguin."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la difference entre CMRO2 et OEF ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "L'OEF mesure la fraction d'oxygene extraite du sang, tandis que le CMRO2 correspond a la consommation reelle d'oxygene par le tissu. Le CMRO2 integre donc debit sanguin et extraction."
        }
      },
      {
        "@type": "Question",
        name: "Le CMRO2 est-il mesurable en pratique clinique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Le CMRO2 direct reste difficile a mesurer en routine. Des estimations sont possibles via IRM, CT perfusion ou modeles metaboliques, mais exigent une validation methodologique rigoureuse."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>CMRO2 en imagerie cérébrale: biomarqueur métabolique | NOXIA</title>
        <meta
          name="description"
          content="CMRO2 en imagerie cérébrale: consommation d’oxygène, interprétation en AVC, lien avec l’OEF et validation multicentrique des biomarqueurs cliniques."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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
                { label: "IRM", path: "/irm-imagerie-quantitative" },
                { label: "Perfusion & Métabolisme cérébral", path: "/perfusion-metabolique-neuro-imagerie" },
                { label: "CMRO2" }
              ]}
            />

            <ExpertiseHero
              badge="Biomarqueur metabolique"
              badgeIcon={Brain}
              title="CMRO2 en imagerie cerebrale"
              description="Le CMRO2 (Cerebral Metabolic Rate of Oxygen) permet d'approcher la consommation reelle d'oxygene du tissu cerebral et d'affiner l'evaluation de la viabilite neuronale au-dela de la simple perfusion."
              chips={["Metabolisme cerebral", "AVC ischemique", "OEF & CBF"]}
              actions={[
                { label: "Discuter d'un projet neuro", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir la page perfusion", to: "/perfusion-metabolique-neuro-imagerie", variant: "secondary", icon: Database },
                { label: "Voir le focus OEF", to: "/oef-imagerie-cerebrale", variant: "secondary", icon: ArrowRight }
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Définition du CMRO2 en imagerie cérébrale
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Le CMRO2 mesure la consommation cérébrale d’oxygène, et non uniquement la perfusion. En AVC, il aide à distinguer un tissu encore métaboliquement actif d’un tissu déjà en échec énergétique. L’interprétation du CMRO2 se fait avec l’OEF, le CBF et les données de diffusion.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Acronymes / definitions rapides</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="font-semibold text-foreground">CMRO2</div>
                  <p>Consommation cerebrale d'oxygene du tissu.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">OEF</div>
                  <p>Fraction d'oxygene extraite du sang.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">CBF</div>
                  <p>Debit sanguin cerebral, composante hemodynamique.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Tmax</div>
                  <p>Retard temporel perfusionnel, utile en mismatch.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">PET</div>
                  <p>Reference historique pour validation metabolique.</p>
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Brain className="w-5 h-5 text-primary" />
                  Metabolisme
                </div>
                <p className="text-sm text-muted-foreground">
                  Reflet de l'activite energetique neuronale et de la capacite du tissu a utiliser l'oxygene disponible.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Activity className="w-5 h-5 text-primary" />
                  Viabilite
                </div>
                <p className="text-sm text-muted-foreground">
                  Aide a distinguer adaptation compensatoire, penombre encore recuperable et effondrement metabolique.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Layers className="w-5 h-5 text-primary" />
                  Multimodalite
                </div>
                <p className="text-sm text-muted-foreground">
                  Interpretation a mettre en regard de la diffusion, de la perfusion, de l'OEF et du contexte clinique.
                </p>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Definition physiologique du CMRO2
              </h2>

              <p>
                Le CMRO2 correspond à la consommation cérébrale d’oxygène par le tissu, c’est-à-dire à la dépense métabolique effective plutôt qu’au seul apport sanguin. C’est le marqueur qui répond à la question : le tissu utilise-t-il encore l’oxygène disponible ?
              </p>

              <p>
                Contrairement aux paramètres purement hémodynamiques, le CMRO2 vise une lecture plus directe de la viabilité neuronale. Son intérêt est maximal quand il est interprété avec l’
                <Link to="/oef-imagerie-cerebrale" className="text-primary hover:underline">
                  OEF
                </Link>
                , la{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  perfusion IRM
                </Link>{" "}
                et un cadre{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologique explicite
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Interprétation clinique rapide
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Une baisse persistante du CMRO2, surtout associée à une diffusion altérée, suggère une souffrance métabolique avancée. À l’inverse, un CMRO2 relativement préservé malgré l’hypoperfusion peut soutenir l’hypothèse d’un tissu encore récupérable.
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Workflow className="w-5 h-5 text-primary" />
                Du signal au biomarqueur interpretable
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Le CMRO2 n'est pas une simple carte "a lire". Pour en faire une mesure defendable,
                il faut expliciter les hypotheses physiologiques, la normalisation, les seuils et les controles qualite.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Conditions de robustesse
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Reference intra-sujet ou hemispherique explicite</li>
                    <li>Coherence avec diffusion, CBF, Tmax et contexte de reperfusion</li>
                    <li>Traçabilite des modeles et parametres de calcul</li>
                    <li>Gestion documentee des artefacts et exclusions</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Ce qu'on cherche a stabiliser
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>La variabilite inter-centre et inter-modele</li>
                    <li>La separation tissu viable / tissue en echec metabolique</li>
                    <li>La reproductibilite des volumes ou ratios derives</li>
                    <li>L'interpretabilite clinique d'une carte continue</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Relation entre CMRO2 et OEF
              </h2>

              <p>
                Le CMRO2 est relie a l'OEF selon une relation simple dans son principe :
                <strong className="text-foreground"> CMRO2 = CBF x OEF x contenu arteriel en oxygene</strong>.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>L'OEF traduit l'effort d'extraction quand la perfusion baisse</li>
                <li>Le CMRO2 cherche a quantifier la consommation reelle du tissu</li>
                <li>Une hausse d'OEF n'implique pas forcement un maintien du CMRO2</li>
                <li>La baisse du CMRO2 signe plus directement la souffrance metabolique</li>
              </ul>

              <p>
                Pour replacer le CMRO2 dans une lecture plus large des biomarqueurs neurovasculaires,
                voir{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  Perfusion & Métabolisme cérébral
                </Link>.
                {" "}Le pendant "extraction" est détaillé sur{" "}
                <Link to="/oef-imagerie-cerebrale" className="text-primary hover:underline">
                  OEF en imagerie cerebrale
                </Link>
                . Le cadre de structuration des mesures est détaillé sur{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  Methodologie imagerie quantitative
                </Link>
                .
              </p>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications en AVC et neuro-imagerie
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">Penombre ischemique</div>
                  <p className="text-sm text-muted-foreground">
                    Le CMRO2 peut aider a distinguer un tissu encore metabolisant d'un territoire dont la perfusion est alteree mais non completement condamne.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">Suivi post-reperfusion</div>
                  <p className="text-sm text-muted-foreground">
                    L'evolution du CMRO2 peut contribuer a interpreter recanalisation, recuperation partielle et persistance d'une souffrance tissulaire.
                  </p>
                </div>
              </div>

              <p>
                En pratique, ces approches se lisent avec la{" "}
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                  perfusion CT
                </Link>{" "}
                et l'
                <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                  IRM quantitative
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Limites methodologiques
              </div>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Mesure directe difficile en routine clinique</li>
                <li>Dependance forte aux hypotheses et modeles physiologiques</li>
                <li>Sensibilite aux erreurs de perfusion, recalage et calibration</li>
                <li>Variabilite inter-centres et inter-implementations</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Ordres de grandeur rapportes dans la litterature
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>CMRO2 cerebral normal : environ 3.0 a 3.5 ml O2 / 100 g / min</li>
                <li>Baisse nette dans les zones infarciees ou en echec metabolique</li>
                <li>Augmentation compensatoire de l'OEF possible en penombre</li>
                <li>Correlations historiquement etablies avec la viabilite en PET</li>
              </ul>

              <p className="text-muted-foreground">
                Ces valeurs servent surtout de repere conceptuel : l'enjeu reel, en imagerie quantitative,
                est de stabiliser la mesure dans un pipeline reproductible.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions frequentes - CMRO2
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    CMRO2 et perfusion sont-ils equivalents ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. La perfusion renseigne sur le debit, alors que le CMRO2 vise la consommation reelle d'oxygene par le tissu.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    Peut-on utiliser le CMRO2 comme endpoint directement ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Pas sans cadre methodologique strict. Il faut des regles explicites de calcul, de normalisation, de QC et d'interpretation.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold text-foreground">
                    Le CMRO2 est-il mesurable en pratique clinique ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Le CMRO2 direct reste difficile en routine. Des estimations sont possibles via IRM, CT perfusion ou modeles metaboliques, mais elles doivent etre validees dans un cadre methodologique strict.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>

              <div className="flex flex-wrap gap-3">
                <Link to="/perfusion-metabolique-neuro-imagerie" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Perfusion & Métabolisme cérébral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/oef-imagerie-cerebrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  OEF cérébral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ct-perfusion-quantitative-avc" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT Perfusion AVC <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Le metabolisme cerebral ne s'interprete pas isolément :
                il demande une lecture conjointe de la perfusion, de l'extraction et de la consommation.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
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

export default CMRO2Imagerie;
