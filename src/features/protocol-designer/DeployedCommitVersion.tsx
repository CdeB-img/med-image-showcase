import { deployedCommitVersion } from "./product-development-version";

export default function DeployedCommitVersion({ sha = typeof __NOXIA_BUILD_GIT_SHA__ === "undefined" ? "" : __NOXIA_BUILD_GIT_SHA__ }: { sha?: string }) {
  const version = deployedCommitVersion(sha);
  return <span
    className="ml-2 inline-block align-baseline font-mono text-[11px] font-normal normal-case tracking-normal text-muted-foreground"
    data-testid="protocol-designer-deployed-version"
    title={version.fullSha ?? undefined}
    aria-label={version.fullSha ? `Commit déployé : ${version.label}` : "Commit déployé inconnu"}
  >{version.label}</span>;
}
