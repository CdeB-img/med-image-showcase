import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import { Helmet } from "react-helmet-async";
import { ArrowRight, BookOpen, ExternalLink, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/references-publications";

const signedPublications = [
  {
    title:
      "Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise: A Longitudinal Study during an Extreme Mountain Ultra-Marathon",
    source: "PLoS ONE",
    date: "2016",
    doi: "10.1371/journal.pone.0161855",
    role: "Co-auteur",
    context:
      "Etude longitudinale des variations de rigidite musculaire quadriceps en contexte d'ultra-endurance.",
  },
  {
    title:
      "Correction: Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise",
    source: "PLoS ONE",
    date: "2016",
    doi: "10.1371/journal.pone.0167668",
    role: "Co-auteur",
    context:
      "Publication de correction associee a l'article principal de 2016 sur l'elastographie musculaire.",
  },
  {
    title:
      "Association of myocardial hemorrhage and persistent microvascular obstruction with circulating inflammatory biomarkers in STEMI patients",
    source: "PLoS ONE",
    date: "2021",
    doi: "10.1371/journal.pone.0245684",
    role: "Co-auteur",
    context:
      "Relations entre hemorrhagie intramyocardique, obstruction microvasculaire persistante et biomarqueurs inflammatoires.",
  },
  {
    title:
      "Serum Soluble Tumor Necrosis Factor Receptors 1 and 2 Are Early Prognosis Markers After ST-Segment Elevation Myocardial Infarction",
    source: "Frontiers in Pharmacology",
    date: "2021",
    role: "Co-auteur",
    context:
      "Evaluation de sTNFR1/sTNFR2 comme biomarqueurs pronostiques precoces apres STEMI.",
  },
  {
    title:
      "Oxygen Extraction Fraction Mapping on Admission Magnetic Resonance Imaging May Predict Recovery of Hyperacute Ischemic Brain Lesions After Successful Thrombectomy: A Retrospective Observational Study",
    source: "Stroke",
    date: "Novembre 2024",
    doi: "10.1161/STROKEAHA.124.047311",
    role: "Co-auteur",
    context: "Imagerie OEF admission et recuperation lesionnelle apres thrombectomie.",
  },
  {
    title:
      "Collaterals influence oxygen metabolism on admission MRI in acute ischemic stroke",
    source: "Preprint",
    date: "Decembre 2024",
    doi: "10.1101/2024.12.12.24318960",
    role: "Co-auteur",
    context: "Lien entre collaterales et metabolisme oxygenique sur IRM d'admission.",
  },
  {
    title: "COVERT-MI",
    source: "Circulation",
    date: "2021",
    role: "Contribution imagerie",
    context: "Biomarqueurs IRM cardiaques en contexte infarctus et no-reflow.",
  },
  {
    title: "Inflammation biomarkers & penumbra mismatch in acute ischemic stroke",
    source: "Neurology",
    date: "2022",
    role: "Co-auteur",
    context: "Biomarqueurs inflammatoires et mismatch de penombre en phase aigue.",
  },
];

const methodologicalContributions = [
  {
    study: "RHU MARVELOUS (HCL / Inserm / CNRS / INSA / UCBL)",
    role: "Contribution methodologique, remerciements",
    context:
      "Analyses CoreLab des volets cardio et neuro (environ 500 examens par volet).",
  },
  {
    study: "MIMI (minimal invasive immediate mechanical intervention)",
    role: "Contribution methodologique, non co-signataire",
    context:
      "Analyse IRM du no-reflow en appui methodologique de l'etude principale.",
    citation: "Belle L et al. Circ Cardiovasc Interv. 2016;9(3):e003388.",
    doi: "10.1161/CIRCINTERVENTIONS.115.003388",
  },
];

const institutionalLinks = [
  { label: "Inserm", href: "https://www.inserm.fr" },
  { label: "CNRS", href: "https://www.cnrs.fr" },
  { label: "INSA Lyon", href: "https://www.insa-lyon.fr" },
  { label: "CREATIS", href: "https://www.creatis.insa-lyon.fr" },
  { label: "Universite Claude Bernard Lyon 1", href: "https://www.univ-lyon1.fr" },
  { label: "Hospices Civils de Lyon", href: "https://www.chu-lyon.fr" },
  { label: "CHU Saint-Etienne", href: "https://www.chu-st-etienne.fr" },
  { label: "EZUS Lyon 1", href: "https://ezus-lyon1.fr" },
];

const ReferencesPublications = () => {
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "References et publications",
    url: CANONICAL,
    description:
      "Publications signees et contributions methodologiques en imagerie medicale quantitative.",
    about: ["Publications scientifiques", "IRM quantitative", "CT quantitatif", "CoreLab"],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "A propos", item: "https://noxia-imagerie.fr/a-propos" },
      { "@type": "ListItem", position: 3, name: "References & publications", item: CANONICAL },
    ],
  };

  const publicationItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Publications et contributions en imagerie quantitative",
    itemListElement: signedPublications.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "ScholarlyArticle",
        name: item.title,
        isPartOf: item.source,
        ...(item.doi ? { identifier: `https://doi.org/${item.doi}` } : {}),
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>References & publications | NOXIA</title>
        <meta
          name="description"
          content="Publications signees, DOI et contributions methodologiques en imagerie medicale quantitative."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(publicationItemListJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "A propos", path: "/a-propos" },
                { label: "References & publications" },
              ]}
            />

            <ExpertiseHero
              badge="References"
              badgeIcon={BookOpen}
              title="References & publications"
              description="Publications scientifiques signees et contributions methodologiques documentees en imagerie quantitative IRM et CT."
              chips={["DOI sourcables", "Role explicite", "Contexte methodologique"]}
              actions={[
                { label: "Discuter d'un projet", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir A propos", to: "/a-propos", variant: "secondary", icon: BookOpen },
              ]}
            />

            <section className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-5">
                <h2 className="text-xl font-semibold">Publications signees</h2>
                <p className="text-xs text-muted-foreground">
                  Cette section recense les articles principaux (peer-reviewed ou preprint). Les figures, datasets et depots techniques associes ne sont pas listes comme publications distinctes.
                </p>
                <ul className="space-y-5">
                  {signedPublications.map((item) => (
                    <li key={item.title} className="space-y-1">
                      <p className="font-medium text-foreground leading-snug">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.source} - {item.date}</p>
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Role :</strong> {item.role}</p>
                      <p className="text-sm text-muted-foreground">{item.context}</p>
                      {item.doi ? (
                        <a
                          href={`https://doi.org/${item.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          DOI : {item.doi}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-5">
                <h2 className="text-xl font-semibold">Contributions methodologiques</h2>
                <ul className="space-y-5">
                  {methodologicalContributions.map((item) => (
                    <li key={item.study} className="space-y-1">
                      <p className="font-medium text-foreground leading-snug">{item.study}</p>
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Role :</strong> {item.role}</p>
                      <p className="text-sm text-muted-foreground">{item.context}</p>
                      {item.citation ? (
                        <p className="text-sm text-muted-foreground">{item.citation}</p>
                      ) : null}
                      {item.doi ? (
                        <a
                          href={`https://doi.org/${item.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          DOI : {item.doi}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <FlaskConical className="w-5 h-5 text-primary" />
                Environnements institutionnels
              </div>
              <p className="text-sm text-muted-foreground">
                Liens externes d'organisations avec lesquelles des travaux methodologiques ont ete conduits.
              </p>
              <div className="flex flex-wrap gap-3">
                {institutionalLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                  >
                    {item.label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ReferencesPublications;
