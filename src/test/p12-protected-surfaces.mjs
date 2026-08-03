const P12_AUTHORIZED_PRODUCT_PATHS = new Set([
  "src/App.tsx",
  "src/components/Header.tsx",
  "src/pages/ScientificKnowledgeExplorer.tsx",
]);

const P_WEB_03_AUTHORIZED_PRODUCT_PATHS = new Set([
  "docs/seo-authority-local-report.md",
  "index.html",
  "src/pages/ProtocolDesigner.tsx",
  "src/pages/ProtocolDesignerDemo.tsx",
]);

const AUTHORIZED_PRODUCT_PATHS = new Set([
  ...P12_AUTHORIZED_PRODUCT_PATHS,
  ...P_WEB_03_AUTHORIZED_PRODUCT_PATHS,
]);

export const withoutAuthorizedP12ProductChanges = (paths) => paths.filter((path) => !P12_AUTHORIZED_PRODUCT_PATHS.has(path));

export const withoutAuthorizedP12ProtectedChanges = (changes) => changes.filter((change) => !P12_AUTHORIZED_PRODUCT_PATHS.has(change.path));

export const withoutAuthorizedProductChanges = (paths) => paths.filter((path) => !AUTHORIZED_PRODUCT_PATHS.has(path));

export const withoutAuthorizedProtectedChanges = (changes) => changes.filter((change) => !AUTHORIZED_PRODUCT_PATHS.has(change.path));
