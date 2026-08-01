import { buildSitemap, planPublication, runEngine } from "@editorial-engine/core";
import { noxiaEditorialAdapter, createNoxiaPolicies } from "./adapter.mjs";
import { pilotProjections } from "./catalog.mjs";

const canonicalFor = (path) => new URL(path, noxiaEditorialAdapter.publicOrigin).toString().replace(/\/$/u, "");

export const engineEntries = pilotProjections.map((projection) => ({
  ...projection,
  metadata: { title: projection.title, canonical: canonicalFor(projection.targetPath) },
}));

export const runNoxiaPilot = () => runEngine({
  entries: engineEntries,
  origin: noxiaEditorialAdapter.publicOrigin,
  policies: createNoxiaPolicies(),
});

export const buildPilotTestSitemap = () => {
  const result = runNoxiaPilot();
  return buildSitemap({ registry: result.registry, sitemapPolicy: createNoxiaPolicies({ includePilotSitemap: true }).sitemap });
};

export const planNoxiaPilotPublication = () => {
  const { registry } = runNoxiaPilot();
  return planPublication({
    registry,
    publicationPolicy: {
      isEligible: () => false,
      nextState: (entry) => entry.status,
    },
  });
};

export const resolveEditorialPreview = (path) => {
  const projection = engineEntries.find((entry) => entry.path === path);
  if (!projection) return { notFound: true, robots: "noindex, nofollow" };
  return { notFound: false, projection, robots: "noindex, nofollow" };
};
