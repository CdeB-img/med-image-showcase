const GIT_SHA = /^[0-9a-f]{7,40}$/i;

export const formatProductDevelopmentVersion = (gitSha?: string | null): string => {
  const normalizedSha = gitSha?.trim() ?? "";
  return `DEV · ${GIT_SHA.test(normalizedSha) ? normalizedSha.slice(0, 7).toLowerCase() : "LOCAL"}`;
};

export const deployedCommitVersion = (gitSha?: string | null): { fullSha: string | null; label: string } => {
  const normalizedSha = gitSha?.trim().toLowerCase() ?? "";
  return /^[0-9a-f]{40}$/.test(normalizedSha)
    ? { fullSha: normalizedSha, label: normalizedSha.slice(0, 8) }
    : { fullSha: null, label: "unknown" };
};
