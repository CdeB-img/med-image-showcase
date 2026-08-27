const GIT_SHA = /^[0-9a-f]{7,40}$/i;

export const formatProductDevelopmentVersion = (gitSha?: string | null): string => {
  const normalizedSha = gitSha?.trim() ?? "";
  return `DEV · ${GIT_SHA.test(normalizedSha) ? normalizedSha.slice(0, 7).toLowerCase() : "LOCAL"}`;
};
