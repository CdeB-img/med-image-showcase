import { siteIdentity } from "@/config/siteIdentity";

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export const organizationReference = {
  "@id": siteIdentity.organization.id,
};

export const personReference = {
  "@id": siteIdentity.person.id,
};

export const createBreadcrumbListJsonLd = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const createOrganizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": siteIdentity.organization.id,
  name: siteIdentity.organization.name,
  url: siteIdentity.organization.url,
  logo: siteIdentity.organization.logoUrl,
  email: siteIdentity.organization.email,
  description: siteIdentity.organization.description,
  areaServed: siteIdentity.organization.areaServed,
  knowsAbout: siteIdentity.organization.knowsAbout,
  founder: personReference,
  sameAs: [siteIdentity.person.orcidUrl, siteIdentity.person.linkedinUrl],
});

export const createPersonJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": siteIdentity.person.id,
  name: siteIdentity.person.name,
  jobTitle: siteIdentity.person.jobTitle,
  url: siteIdentity.person.pageUrl,
  image: siteIdentity.person.imageUrl,
  email: siteIdentity.organization.email,
  identifier: {
    "@type": "PropertyValue",
    propertyID: "ORCID",
    value: siteIdentity.person.orcidUrl,
  },
  knowsAbout: siteIdentity.person.knowsAbout,
  worksFor: organizationReference,
  sameAs: [siteIdentity.person.orcidUrl, siteIdentity.person.linkedinUrl],
});

export const createWebsiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteIdentity.organization.url}#website`,
  name: siteIdentity.organization.name,
  url: siteIdentity.organization.url,
  inLanguage: "fr-FR",
  publisher: organizationReference,
});

