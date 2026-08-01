const P12_AUTHORIZED_PRODUCT_PATHS = new Set([
  "src/App.tsx",
  "src/components/Header.tsx",
  "src/pages/ScientificKnowledgeExplorer.tsx",
]);

export const withoutAuthorizedP12ProductChanges = (paths) => paths.filter((path) => !P12_AUTHORIZED_PRODUCT_PATHS.has(path));

export const withoutAuthorizedP12ProtectedChanges = (changes) => changes.filter((change) => !P12_AUTHORIZED_PRODUCT_PATHS.has(change.path));
