import type { DocumentProjection } from "./types";

const escapeMarkdown = (value: string) => value.replace(/([\\`*_{}[\]<>#+.!|])/g, "\\$1");
const bulletList = (values: ReadonlyArray<string>) => values.map((item) => `- ${escapeMarkdown(item)}`).join("\n");

export const renderProjectionMarkdown = (projection: Readonly<DocumentProjection>) => {
  const lines: string[] = [
    `# ${escapeMarkdown(projection.title)}`,
    "",
    `- Projection : ${projection.projectionType} v${projection.projectionVersion}`,
    `- État : ${projection.lifecycle}`,
    `- Readiness : ${projection.readiness}`,
    `- Projet source : ${escapeMarkdown(projection.source.projectId)} · ${escapeMarkdown(projection.source.projectVersion)}`,
    `- Profil : ${escapeMarkdown(projection.profile)}`,
    `- Usage : ${escapeMarkdown(projection.usage)}`,
    `- Audience : ${escapeMarkdown(projection.audience)}`,
    `- Frontière : ${projection.boundary}`,
    "",
    "> Projection documentaire en lecture seule. Elle n’est ni la vérité du Research Project, ni un protocole clinique exécutable, ni une approbation.",
  ];
  projection.sections.forEach((section) => {
    lines.push("", `## ${section.order}. ${escapeMarkdown(section.title)}`, "", `Statut : **${section.status}** · Applicabilité : **${section.applicability}**`);
    if (section.statusReasons.length) lines.push("", "Règles de décision :", bulletList(section.statusReasons));
    section.blocks.forEach((block) => {
      lines.push("", `### ${escapeMarkdown(block.label ?? block.kind)}`, "", bulletList(block.items));
    });
    if (section.unknowns.length) lines.push("", "### Inconnues", "", bulletList(section.unknowns));
    if (section.limitations.length) lines.push("", "### Limitations", "", bulletList(section.limitations));
    if (section.contradictions.length) lines.push("", "### Contradictions", "", bulletList(section.contradictions));
    if (section.humanDecisionIds.length) lines.push("", "### Décisions humaines liées", "", bulletList(section.humanDecisionIds));
    lines.push("", "### Provenance", "", bulletList(section.provenanceRefs));
  });
  lines.push("", "## Registre des décisions humaines", "");
  lines.push(projection.humanDecisions.length ? bulletList(projection.humanDecisions.map((item) => `${item.status} — ${item.label} — ${item.actor ?? "acteur non enregistré"} — ${item.reason}`)) : "- Aucune décision transportée.");
  lines.push("", `Digest de projection : ${projection.projectionDigest}`, "");
  return lines.join("\n");
};
