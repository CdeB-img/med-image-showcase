import { Helmet } from "react-helmet-async";

const SITE_URL = "https://noxia-imagerie.fr";

const GlobalEntitySchema = () => {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: "NOXIA Imagerie",
    url: SITE_URL,
    email: "contact@noxia-imagerie.fr",
    areaServed: ["France", "Europe"],
    knowsAbout: [
      "Imagerie medicale quantitative",
      "IRM quantitative",
      "CT quantitatif",
      "CoreLab imagerie",
      "Analyse DICOM",
      "Harmonisation multicentrique",
    ],
    founder: {
      "@id": `${SITE_URL}/a-propos#person`,
    },
  };

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/a-propos#person`,
    name: "Charles de Bourguignon",
    jobTitle: "Expert en imagerie medicale quantitative",
    url: `${SITE_URL}/a-propos`,
    email: "contact@noxia-imagerie.fr",
    worksFor: {
      "@id": `${SITE_URL}#organization`,
    },
    affiliation: [
      { "@type": "Organization", name: "Inserm", url: "https://www.inserm.fr" },
      { "@type": "Organization", name: "CNRS", url: "https://www.cnrs.fr" },
      { "@type": "Organization", name: "INSA Lyon", url: "https://www.insa-lyon.fr" },
      { "@type": "Organization", name: "CREATIS", url: "https://www.creatis.insa-lyon.fr" },
      { "@type": "Organization", name: "Universite Claude Bernard Lyon 1", url: "https://www.univ-lyon1.fr" },
      { "@type": "Organization", name: "Hospices Civils de Lyon", url: "https://www.chu-lyon.fr" },
      { "@type": "Organization", name: "CHU Saint-Etienne", url: "https://www.chu-st-etienne.fr" },
      { "@type": "Organization", name: "EZUS Lyon 1", url: "https://ezus-lyon1.fr" },
    ],
    sameAs: [`${SITE_URL}/a-propos`, `${SITE_URL}/references-publications`],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(personJsonLd)}</script>
    </Helmet>
  );
};

export default GlobalEntitySchema;
