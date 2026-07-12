const SITE_URL = "https://noxia-imagerie.fr";

export const siteIdentity = {
  organization: {
    id: `${SITE_URL}#organization`,
    name: "NOXIA Imagerie",
    shortName: "NOXIA",
    url: SITE_URL,
    logoUrl: `${SITE_URL}/images/branding/favicon.ico`,
    email: "contact@noxia-imagerie.fr",
    description:
      "Imagerie medicale quantitative IRM et CT pour la recherche clinique, les Core Labs et les analyses multicentriques.",
    areaServed: ["France", "Europe"],
    knowsAbout: [
      "Imagerie medicale quantitative",
      "IRM quantitative",
      "CT quantitatif",
      "Core Lab imagerie",
      "Analyse DICOM",
      "Harmonisation multicentrique",
    ],
  },
  person: {
    id: `${SITE_URL}/a-propos#person`,
    name: "Charles de Bourguignon",
    jobTitle: "Consultant independant en imagerie medicale quantitative",
    pageUrl: `${SITE_URL}/a-propos`,
    imageUrl: `${SITE_URL}/images/branding/portrait-charles.webp`,
    orcidUrl: "https://orcid.org/0000-0003-1898-7686",
    linkedinUrl: "https://www.linkedin.com/in/charles-de-bourguignon-045106160/",
    knowsAbout: [
      "Imagerie medicale quantitative",
      "IRM cardiaque",
      "CT quantitatif",
      "Core Lab imagerie",
      "Biomarqueurs d'imagerie",
      "Harmonisation multicentrique",
    ],
  },
} as const;

export const siteUrls = {
  home: `${SITE_URL}/`,
  about: `${SITE_URL}/a-propos`,
  references: `${SITE_URL}/references-publications`,
  contact: `${SITE_URL}/contact`,
} as const;

