import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  Activity,
  Brain,
  BarChart3,
  Layers,
  AlertTriangle,
  Workflow,
  ShieldCheck,
  Database
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/oef-imagerie-cerebrale";
const HUB_CANONICAL = "https://noxia-imagerie.fr/metabolisme-cerebral";

const OEFImagerie = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "OEF en imagerie cerebrale - extraction d'oxygene",
    description:
      "OEF (Oxygen Extraction Fraction) : biomarqueur de l'extraction d'oxygene cerebral, interpretation physiopathologique, lien avec CMRO2 et applications en AVC.",
    about: [
      "OEF",
      "Oxygen Extraction Fraction",
      "CMRO2",
      "Stroke imaging",
      "Cerebral metabolism",
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
        name: "Metabolisme cerebral",
        item: HUB_CANONICAL
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "OEF",
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
        name: "Qu'est-ce que l'OEF en imagerie cerebrale ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "L'OEF correspond a la fraction d'oxygene extraite du sang par le tissu cerebral. Elle reflete la capacite d'adaptation metabolique en cas de baisse de perfusion."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la difference entre OEF et CMRO2 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "L'OEF mesure l'extraction d'oxygene, tandis que le CMRO2 mesure la consommation totale. Le CMRO2 depend a la fois du debit sanguin et de l'OEF."
        }
      },
      {
        "@type": "Question",
        name: "Pourquoi l'OEF est-elle importante en AVC ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Une augmentation de l'OEF peut indiquer un tissu encore viable qui compense une hypoperfusion. C'est un signal typique des zones de penombre ischemique."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>OEF en imagerie cérébrale: extraction d’oxygène validée | NOXIA</title>
        <meta
          name="description"
          content="OEF en imagerie cérébrale: mesure de l’extraction d’oxygène, lecture physiopathologique en AVC et validation multicentrique de biomarqueurs métaboliques."
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
                { label: "Métabolisme cérébral", path: "/metabolisme-cerebral" },
                { label: "OEF" }
              ]}
            />

            <ExpertiseHero
              badge="Biomarqueur d'extraction"
              badgeIcon={Activity}
              title="OEF en imagerie cerebrale"
              description="L'OEF (Oxygen Extraction Fraction) renseigne sur la capacite du tissu cerebral a compenser une baisse de perfusion en augmentant l'extraction d'oxygene."
              chips={["Extraction d'oxygene", "Penombre ischemique", "Lien OEF-CMRO2"]}
              actions={[
                { label: "Discuter d'un projet neuro", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir le hub métabolisme", to: "/metabolisme-cerebral", variant: "secondary", icon: Database },
                { label: "Voir le focus CMRO2", to: "/cmro2-imagerie-cerebrale", variant: "secondary", icon: ArrowRight }
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Définition de l’OEF en imagerie cérébrale
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                L’OEF correspond à la fraction d’oxygène extraite du sang par le tissu cérébral. En situation d’hypoperfusion, une OEF élevée peut traduire une compensation métabolique compatible avec une pénombre ischémique. L’OEF doit être interprétée avec le CMRO2, la perfusion et la diffusion.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Acronymes / definitions rapides</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="font-semibold text-foreground">OEF</div>
                  <p>Fraction d'oxygene extraite par le tissu.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">CMRO2</div>
                  <p>Consommation totale d'oxygene cerebrale.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">CBF</div>
                  <p>Debit sanguin cerebral.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Tmax</div>
                  <p>Retard perfusionnel en imagerie dynamique.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Penombre</div>
                  <p>Tissu menace mais potentiellement recuperable.</p>
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Activity className="w-5 h-5 text-primary" />
                  Extraction
                </div>
                <p className="text-sm text-muted-foreground">
                  Part d'oxygene prelevee par le tissu cerebral a partir du sang disponible.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Brain className="w-5 h-5 text-primary" />
                  Adaptation
                </div>
                <p className="text-sm text-muted-foreground">
                  L'OEF peut augmenter pour maintenir le metabolisme quand le debit sanguin chute.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Layers className="w-5 h-5 text-primary" />
                  Lecture combinee
                </div>
                <p className="text-sm text-muted-foreground">
                  Interpretation a relier au CBF, au CMRO2, a la diffusion et au contexte clinique.
                </p>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Definition physiologique de l'OEF
              </h2>

              <p>
                En neuro-imagerie, l’OEF correspond à la fraction d’oxygène extraite par le tissu cérébral à partir du flux disponible. Ce marqueur répond à une question clinique simple : le tissu compense-t-il encore une hypoperfusion ?
              </p>

              <p>
                Ce n’est pas une mesure de débit mais une mesure d’adaptation métabolique. Son interprétation devient robuste quand elle est intégrée au pipeline de{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  perfusion/métabolisme IRM
                </Link>{" "}
                et à la{" "}
                <Link to="/perfusion-hemodynamique-neuro-imagerie" className="text-primary hover:underline">
                  perfusion hémodynamique
                </Link>
                {" "},
                puis à une{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologie quantitative
                </Link>{" "}
                explicite.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Lecture experte
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Une OEF élevée n’est pas automatiquement un “bon” ou un “mauvais” signal : elle doit être lue avec la chronologie clinique, la diffusion et la qualité de reperfusion. C’est la cohérence des marqueurs, plus que la valeur isolée, qui soutient la décision.
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Workflow className="w-5 h-5 text-primary" />
                Du signal a la mesure interpretable
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Une carte OEF brute ne suffit pas. L'interpretation demande une normalisation explicite,
                une coherence avec les autres cartes et des controles qualite reproductibles.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Conditions de robustesse
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Reference intra-sujet ou hemispherique explicite</li>
                    <li>Lecture conjointe avec diffusion, CBF, Tmax et CMRO2</li>
                    <li>Traçabilite des modeles et parametres d'estimation</li>
                    <li>Gestion explicite des artefacts et des exclusions</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Points de vigilance
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Variabilite inter-centre et inter-modele</li>
                    <li>Sensibilite au bruit et a la perfusion</li>
                    <li>Risque de sur-interpretation d'une carte isolee</li>
                    <li>Dependance au contexte de reperfusion</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Relation avec le CMRO2
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>L'OEF augmente frequemment quand le debit sanguin diminue</li>
                <li>Le CMRO2 peut rester transitoirement stable en phase compensatoire</li>
                <li>La chute conjointe OEF + CMRO2 signe un echec metabolique tissulaire</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/cmro2-imagerie-cerebrale" className="text-primary hover:underline">
                  CMRO2 en imagerie cerebrale
                </Link>
                {" "}pour la lecture complementaire du metabolisme global.
              </p>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Role en AVC et penombre ischemique
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>OEF augmentee : tissu encore viable mais menace</li>
                <li>Mismatch metabolique utile pour caracteriser la penombre</li>
                <li>Aide a interpreter la recuperation post-reperfusion</li>
              </ul>

              <p>
                En pratique, ces analyses s'integrent avec la{" "}
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                  perfusion CT
                </Link>
                {" "}et la{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  perfusion/metabolisme IRM
                </Link>
                {" "}dans le cadre plus large de l'
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
                <li>Mesure souvent indirecte en contexte clinique</li>
                <li>Dependance aux hypotheses physiologiques</li>
                <li>Variabilite inter-methodes et inter-logiciels</li>
                <li>Sensibilite au bruit et aux erreurs de perfusion</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Donnees issues de la litterature
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>OEF cerebrale normale : environ 30 a 40%</li>
                <li>OEF augmentee en penombre ischemique compensatoire</li>
                <li>Correlations historiques avec viabilite tissulaire en PET</li>
                <li>Chute d'OEF associee a un infarctus etabli dans les etats avances</li>
              </ul>

              <p className="text-muted-foreground">
                Consensus : l'OEF est centrale pour lire l'adaptation metabolique,
                mais doit etre interpretee conjointement avec CMRO2 et la perfusion.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions frequentes - OEF
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    L'OEF suffit-elle pour statuer sur la viabilite ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Elle doit etre interpretee avec la diffusion, la perfusion et le CMRO2.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold text-foreground">
                    Une OEF elevee est-elle toujours favorable ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Pas necessairement. Elle peut signer une compensation utile, mais son sens depend du contexte hemodynamique et temporel.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi l'OEF est-elle importante en AVC ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Parce qu'une OEF augmentee peut indiquer un tissu encore viable en situation d'hypoperfusion, compatible avec une zone de penombre ischemique potentiellement recuperable.
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
                <Link to="/cmro2-imagerie-cerebrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CMRO2 cérébral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/perfusion-hemodynamique-neuro-imagerie" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Perfusion hémodynamique <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ct-perfusion-quantitative-avc" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT Perfusion AVC <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                L'extraction d'oxygene doit se lire dans un modele metabolique global et jamais de maniere isolee.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Discuter d'un projet neuro
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

export default OEFImagerie;
