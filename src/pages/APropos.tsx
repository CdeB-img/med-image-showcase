import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";

const CANONICAL = "https://noxia-imagerie.fr/a-propos";
const ORCID_URL = "https://orcid.org/0000-0003-1898-7686";
const LINKEDIN_URL = "https://www.linkedin.com/in/charles-de-bourguignon-045106160/";

const publicationsSelection = [
  {
    title:
      "Oxygen Extraction Fraction Mapping on Admission Magnetic Resonance Imaging May Predict Recovery of Hyperacute Ischemic Brain Lesions After Successful Thrombectomy: A Retrospective Observational Study",
    support: "Stroke",
    dateLabel: "Novembre 2024",
    publishedAt: "2024-11",
    doi: "10.1161/STROKEAHA.124.047311"
  },
  {
    title:
      "Collaterals influence oxygen metabolism on admission MRI in acute ischemic stroke",
    support: "Preprint",
    dateLabel: "Décembre 2024",
    publishedAt: "2024-12",
    doi: "10.1101/2024.12.12.24318960"
  },
  {
    title: "COVERT-MI",
    support: "Circulation",
    dateLabel: "2021",
    publishedAt: "2021"
  },
  {
    title: "Inflammation biomarkers & penumbra mismatch in acute ischemic stroke",
    support: "Neurology",
    dateLabel: "2022",
    publishedAt: "2022"
  }
];

const corelabContributions = [
  {
    study: "RHU MARVELOUS (HCL / INSERM / CNRS / INSA / UCBL)",
    detail:
      "Analyse CoreLab des volets cardio et neuro, avec environ 500 examens traités par volet. Contribution mentionnée dans les remerciements."
  },
  {
    study: "MIMI – étude minimal invasive (2013–2014)",
    detail:
      "Analyse des IRM dédiées au no-reflow. Contribution technique d'analyse réalisée sans co-signature de l'étude principale.",
    citation:
      "Belle L et al. Circ Cardiovasc Interv. 2016;9(3):e003388.",
    doi: "10.1161/CIRCINTERVENTIONS.115.003388"
  }
];

const APropos = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Charles de Bourguignon",
    jobTitle: "Expert en imagerie médicale quantitative",
    description:
      "Expert indépendant en IRM et CT quantitatif. CoreLab multicentrique, biomarqueurs cœur–cerveau, ingénierie d’analyse et harmonisation inter-centres.",
    email: "contact@noxia-imagerie.fr",
    url: CANONICAL,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "ORCID",
      value: ORCID_URL,
    },
    sameAs: [ORCID_URL, LINKEDIN_URL],
    worksFor: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    }
  };

  const publicationsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Publications et contributions de Charles de Bourguignon",
    itemListElement: publicationsSelection.map((publication, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "ScholarlyArticle",
        name: publication.title,
        isPartOf: publication.support,
        datePublished: publication.publishedAt,
        ...(publication.doi ? { identifier: `https://doi.org/${publication.doi}` } : {})
      }
    }))
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "A propos", item: CANONICAL }
    ]
  };

  return (
    <>
      <Helmet>
        <title>
          Charles de Bourguignon | Expert Imagerie Médicale – NOXIA
        </title>

        <meta
          name="description"
          content="Charles de Bourguignon, expert indépendant en imagerie médicale quantitative. IRM cardiaque et neuro, CT avancé, CoreLab multicentrique et ingénierie de biomarqueurs reproductibles."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(publicationsJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-24 px-4">
          <div className="max-w-6xl mx-auto space-y-32">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "À propos" }
              ]}
            />

            {/* ================= HERO ================= */}
            <section className="grid md:grid-cols-2 gap-16 items-center">

              <div className="flex justify-center md:justify-start">
                <img
                  src="/images/branding/portrait-charles.webp"
                  alt="Charles de Bourguignon – Expert imagerie médicale quantitative"
                  className="w-64 h-64 object-cover rounded-full shadow-2xl"
                />
              </div>

              <div className="space-y-8">

                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                    Charles de Bourguignon
                  </h1>

                  <p className="text-xl text-muted-foreground">
                    Expert indépendant en imagerie médicale quantitative
                  </p>

                  <div className="text-sm uppercase tracking-wider text-primary font-medium">
                    CoreLab IRM & CT • Multicentrique • Essais cliniques
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  J’interviens à l’interface entre clinique, recherche translationnelle
                  et ingénierie quantitative. Mon activité est dédiée à la conception
                  de flux d’analyse robustes, traçables et inter-constructeurs,
                  transformant le signal d’imagerie en biomarqueurs exploitables.
                </p>

                {/* Preuve chiffrée */}
                <div className="grid grid-cols-3 gap-6 pt-6">
                  <div>
                    <div className="text-2xl font-semibold">5000+</div>
                    <div className="text-xs text-muted-foreground">
                      Examens analysés
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">3700+</div>
                    <div className="text-xs text-muted-foreground">
                      Cardiaque
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">1500+</div>
                    <div className="text-xs text-muted-foreground">
                      Neuro & préclinique
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* ================= POSITIONNEMENT ================= */}
            <section className="space-y-8 max-w-4xl">
              <h2 className="text-3xl font-semibold">
                Positionnement
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Après plus de dix années en environnement hospitalo-universitaire,
                j’ai structuré et piloté un CoreLab imagerie cœur–cerveau
                impliqué dans des projets RHU, ANR, PHRC et partenariats industriels.
                Ces travaux ont notamment été menés en lien avec le CHU
                Saint-Étienne et les Hospices Civils de Lyon.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Aujourd’hui, j’interviens de manière indépendante auprès
                d’équipes académiques, de centres hospitaliers et de promoteurs
                industriels pour concevoir, harmoniser et fiabiliser
                des flux d’imagerie quantitative à haute exigence scientifique.
              </p>
            </section>

            {/* ================= EXPERTISE ================= */}
            <section className="grid md:grid-cols-2 gap-16">

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  Expertise clinique spécialisée
                </h3>

                <ul className="space-y-3 text-muted-foreground">
                  <li>• IRM cardiaque : LGE, T1/T2 mapping, ECV, fonction</li>
                  <li>• IRM neuro post-AVC : Tmax, ADC, OEF, CMRO₂, pénombre</li>
                  <li>• Scanner thoracique & coronarien (CAD-RADS)</li>
                  <li>• CT spectral & mono-énergétique avancé</li>
                </ul>

                <p className="text-muted-foreground leading-relaxed">
                  L’analyse est systématiquement guidée par une cohérence
                  physiopathologique du signal et une exigence de reproductibilité
                  inter-centre.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  Ingénierie & méthodologie
                </h3>

                <ul className="space-y-3 text-muted-foreground">
                  <li>• Structuration CoreLab mono & multicentrique</li>
                  <li>• Harmonisation protocoles et contrôle qualité</li>
                  <li>• Anonymisation DICOM avancée</li>
                  <li>• Développement Python & modules 3D Slicer</li>
                  <li>• Évaluation et intégration d’outils IA</li>
                </ul>

                <p className="text-muted-foreground leading-relaxed">
                  Chaque outil est conçu comme un objet méthodologique explicite,
                  documenté et statistiquement exploitable.
                </p>
              </div>

            </section>

            {/* ================= PUBLICATIONS ================= */}
            <section className="space-y-8">
              <h2 className="text-3xl font-semibold">
                Publications et contributions
              </h2>

              <p className="text-sm text-muted-foreground">
                Version detaillee:{" "}
                <Link to="/references-publications" className="text-primary hover:underline">
                  References & publications
                </Link>
                .
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-5">
                  <h3 className="text-xl font-semibold">Publications signées (sélection)</h3>

                  <ul className="space-y-4">
                    {publicationsSelection.map((publication) => (
                      <li key={publication.title} className="space-y-1">
                        <p className="text-foreground font-medium leading-snug">
                          {publication.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {publication.support} • {publication.dateLabel}
                        </p>
                        {publication.doi && (
                          <a
                            href={`https://doi.org/${publication.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            DOI : {publication.doi}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-5">
                  <h3 className="text-xl font-semibold">
                    Contributions CoreLab (remerciements / non co-signées)
                  </h3>

                  <ul className="space-y-4">
                    {corelabContributions.map((contribution) => (
                      <li key={contribution.study} className="space-y-1">
                        <p className="text-foreground font-medium leading-snug">
                          {contribution.study}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {contribution.detail}
                        </p>
                        {contribution.citation && (
                          <p className="text-sm text-muted-foreground">
                            {contribution.citation}
                          </p>
                        )}
                        {contribution.doi && (
                          <a
                            href={`https://doi.org/${contribution.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            DOI : {contribution.doi}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-muted-foreground">
                    Cette section distingue volontairement les publications signées
                    et les contributions méthodologiques réalisées en CoreLab.
                  </p>
                </div>
              </div>
            </section>

            {/* ================= CADRE ================= */}
            <section className="bg-primary/5 border border-primary/20 rounded-xl p-10 text-center space-y-6">
              <h2 className="text-2xl font-semibold">
                Cadre méthodologique
              </h2>

              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                La robustesse méthodologique précède l’automatisation.
                Les solutions IA sont évaluées, validées et intégrées
                dans des flux contrôlés. L’objectif est la production
                de biomarqueurs fiables, interprétables et réglementairement défendables.
              </p>

              <Link
                to="/contact"
                className="inline-block rounded-md bg-primary px-8 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet
              </Link>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default APropos;
