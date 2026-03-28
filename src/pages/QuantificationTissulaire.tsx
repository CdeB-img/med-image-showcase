import React from "react";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Layers,
  Workflow,
  Brain,
  Database,
  BarChart3,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/quantification-tissulaire";

const QuantificationTissulaire = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Quantification tissulaire en imagerie médicale",
    description:
      "Hub de quantification tissulaire en imagerie: IRM quantitative, CT quantitatif, calibration, harmonisation multicentrique et validation des biomarqueurs.",
    about: [
      "Quantification tissulaire",
      "IRM quantitative",
      "CT quantitatif",
      "Biomarqueurs d'imagerie",
      "Harmonisation multicentrique",
      "Validation méthodologique",
    ],
    specialty: ["Radiology", "Medical Imaging"],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Researchers",
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
    name: "Structuration de biomarqueurs de quantification tissulaire",
    serviceType: [
      "IRM quantitative multicentrique",
      "CT quantitatif multicentrique",
      "Calibration et harmonisation",
      "Validation de biomarqueurs d'imagerie",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Cadrage méthodologique, validation et harmonisation des mesures tissulaires en IRM et CT pour essais cliniques et recherches multicentriques.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Quantification tissulaire", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que la quantification tissulaire en imagerie ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "La quantification tissulaire consiste a transformer le signal d'imagerie en mesures comparables et auditables entre patients et entre centres, au-dela de la simple lecture visuelle.",
        },
      },
      {
        "@type": "Question",
        name: "Pourquoi relier IRM quantitative et CT quantitatif dans un meme hub ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce que les deux modalites partagent des exigences communes: definition explicite des biomarqueurs, controle des biais techniques, harmonisation multicentrique et validation de reproductibilite.",
        },
      },
      {
        "@type": "Question",
        name: "La calibration suffit-elle a rendre un biomarqueur robuste ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. La calibration est necessaire mais doit etre integree avec l'audit DICOM, des regles de segmentation, des controles QA et une tracabilite complete du pipeline.",
        },
      },
      {
        "@type": "Question",
        name: "Quel est le gain principal d'un cadre multicentrique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Un cadre multicentrique reduit la variance technique entre sites et augmente la fiabilite statistique des endpoints d'imagerie utilises en recherche clinique.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Quantification tissulaire IRM/CT: hub multicentrique | NOXIA</title>
        <meta
          name="description"
          content="Quantification tissulaire en IRM et CT: biomarqueurs auditables, calibration, harmonisation multicentrique et validation methodologique pour la recherche clinique."
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
                { label: "Quantification tissulaire" },
              ]}
            />

            <ExpertiseHero
              badge="Hub transversal"
              badgeIcon={Layers}
              title="Quantification tissulaire en imagerie medicale"
              description="Page pilier reliant IRM quantitative et CT quantitatif pour produire des biomarqueurs defensables, harmonises entre centres et exploitables en recherche clinique."
              chips={["IRM", "CT", "Validation multicentrique"]}
              actions={[
                { label: "Explorer IRM quantitative", to: "/irm-imagerie-quantitative", variant: "secondary", icon: Brain },
                { label: "Explorer CT quantitative", to: "/ct-imagerie-quantitative", variant: "secondary", icon: Database },
                { label: "Discuter d'un protocole", to: "/contact", variant: "primary", icon: ArrowRight },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Reponse courte</h2>
              <p className="text-muted-foreground leading-relaxed">
                La quantification tissulaire convertit le signal d'imagerie en mesures reproductibles du tissu, et pas seulement en images interpretable visuellement. En pratique, la robustesse depend de la combinaison: protocoles, segmentation, calibration, QA et harmonisation multicentrique.
              </p>
            </section>

            <section className="grid md:grid-cols-2 gap-6 items-stretch">
              <article className="rounded-2xl border border-border bg-card/50 p-7 space-y-4 h-full">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Brain className="w-5 h-5 text-primary" />
                  Volet IRM quantitative
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  En IRM, l'intensite est non absolue: la quantification tissulaire impose des regles de sequence,
                  de segmentation et de post-traitement. Voir les parcours
                  {" "}<Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">ECV/T1/T2</Link>,
                  {" "}<Link to="/segmentation-irm" className="text-primary hover:underline">segmentation IRM</Link>
                  {" "}et
                  {" "}<Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className="text-primary hover:underline">biomarqueurs d'essai</Link>.
                </p>
                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  Aller au pilier IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </article>

              <article className="rounded-2xl border border-border bg-card/50 p-7 space-y-4 h-full">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Database className="w-5 h-5 text-primary" />
                  Volet CT quantitatif
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  En CT, la quantification tissulaire repose sur la stabilite HU, la calibration et le controle
                  des reconstructions. Voir
                  {" "}<Link to="/quantification-ct" className="text-primary hover:underline">HU & calibration CT</Link>,
                  {" "}<Link to="/ct-quantitatif-avance-imagerie-spectrale" className="text-primary hover:underline">CT spectral avance</Link>
                  {" "}et
                  {" "}<Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">CT perfusion AVC</Link>.
                </p>
                <Link to="/ct-imagerie-quantitative" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  Aller au pilier CT
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Workflow className="w-5 h-5 text-primary" />
                Architecture methodologique commune
              </div>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Audit DICOM et controle geometrique des donnees d'entree.</li>
                <li>Regles de mesure explicites (segmentation, exclusions, seuils).</li>
                <li>Calibration ou normalisation adaptee a la modalite.</li>
                <li>Contrôles QA entree/sortie et tracabilite des versions.</li>
                <li>Validation inter-centres avant interpretation biologique.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Cette logique est detaillee dans la page
                {" "}<Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">Methodologie quantitative</Link>
                {" "}et mise en oeuvre via
                {" "}<Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">l'ingenierie de pipeline</Link>.
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Reperes litterature (ordres de grandeur)
              </div>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>IRM: des variations de plusieurs pourcents peuvent apparaitre entre centres sans harmonisation des sequences.</li>
                <li>CT: des ecarts de plusieurs HU sont rapportes selon kernel, reconstruction et constructeur.</li>
                <li>La reduction de variance technique augmente la puissance statistique d'un endpoint tissulaire.</li>
              </ul>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions frequentes - Quantification tissulaire
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">La quantification tissulaire est-elle seulement une question d'IA ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Non. L'IA n'est qu'un composant. La robustesse depend d'un cadre methodologique complet et trace.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Pourquoi un hub commun IRM/CT ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Pour unifier les principes de qualite et de validation, meme si les physiques de signal sont differentes.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Peut-on comparer des chiffres entre centres sans harmonisation ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Rarement de facon fiable. Les biais techniques peuvent depasser l'effet biologique cible.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Quel est le livrable attendu ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Des mesures auditables: tables, masques, overlays QA, metadonnees et logs versionnes.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associees</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">IRM quantitative <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/ct-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">CT quantitative <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/quantification-ct" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">HU & calibration CT <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">IRM cardiaque (ECV/T1/T2) <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/methodologie-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">Methodologie <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </section>

            <section className="text-center space-y-5 pt-4">
              <p className="text-muted-foreground max-w-2xl mx-auto">
                L'objectif de la quantification tissulaire est de transformer des mesures fragiles en biomarqueurs exploitables, interpretable et defendables.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Cadrer un protocole de quantification
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

export default QuantificationTissulaire;
