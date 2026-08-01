const publicOrigin = "https://noxia-imagerie.fr";

export const noxiaEditorialAdapter = {
  productId: "noxia-imagerie",
  publicOrigin,
  locales: ["fr-FR"],
  publisher: { name: "NOXIA Imagerie", url: publicOrigin },
  authorPolicy: { mode: "product-owned", authorUrl: `${publicOrigin}/a-propos` },
  privateRoutes: ["/admin", "/app", "/dashboard", "/auth"],
  reservedRoutes: ["/404", "/sitemap.xml", "/robots.txt"],
  canonicalPolicy: { mode: "existing-public-route", trailingSlash: false },
  robotsPolicy: { fixture: "noindex, nofollow", existingRoute: "unchanged" },
  sitemapPolicy: { mode: "isolated-test-artifact", publicSitemapMutation: false },
  publicationPolicy: { mode: "disabled-for-pilot", sideEffects: false },
  navigationPolicy: { mode: "deterministic-pilot-projection" },
  structuredDataPolicy: { mode: "derived-test-documents", publicMutation: false },
  resolveCta: (key = "contact") => ({ contact: { label: "Contacter NOXIA", href: "/contact" } })[key] ?? null,
  rendererAdapter: { name: "noxia-pilot-view-model", runtime: "React", publicRouteMutation: false },
  storageAdapter: { name: "repository-source-catalog", writeMode: "none" },
  observabilityAdapter: { name: "static-contract-only", network: false },
};

export const isPrivateOrReservedPath = (path) =>
  [...noxiaEditorialAdapter.privateRoutes, ...noxiaEditorialAdapter.reservedRoutes].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export const createNoxiaPolicies = ({ includePilotSitemap = false } = {}) => ({
  route: {
    isPublic: (entry) => entry.publicationStatus === "existing-route-only" && !isPrivateOrReservedPath(entry.path),
  },
  sitemap: {
    isIncluded: (entry) => includePilotSitemap && entry.publicationStatus === "existing-route-only" && entry.indexable === false,
  },
  navigation: {
    isVisible: (entry) => entry.publicationStatus === "existing-route-only",
  },
  structuredData: {
    createDocument: (entry) => ({
      "@context": "https://schema.org",
      "@type": entry.templateKey === "hub" ? "CollectionPage" : "Article",
      "@id": entry.metadata.canonical,
      name: entry.metadata.title,
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${noxiaEditorialAdapter.publicOrigin}/#website` },
      about: entry.entityIds,
      isAccessibleForFree: true,
      potentialAction: { "@type": "ContactAction", target: `${noxiaEditorialAdapter.publicOrigin}/contact` },
    }),
  },
});
