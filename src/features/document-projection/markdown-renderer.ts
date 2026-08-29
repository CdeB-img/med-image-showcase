import type { DocumentProjection } from "./types";

const escapeMarkdown = (value: string) => value.replace(/([\\`*_{}[\]<>#+.!|])/g, "\\$1");
const bulletList = (values: ReadonlyArray<string>) => values.map((item) => `- ${escapeMarkdown(item)}`).join("\n");

export const renderProjectionMarkdown = (projection: Readonly<DocumentProjection>) => {
  const lines: string[] = [
    `# ${escapeMarkdown(projection.title)}`,
    "",
    `- Identité de projection : ${escapeMarkdown(projection.projectionId)}`,
    `- Projection : ${projection.projectionType} v${projection.projectionVersion}`,
    `- État : ${projection.lifecycle}`,
    `- Readiness : ${projection.readiness}`,
    `- Projet source : ${escapeMarkdown(projection.source.projectId)} · ${escapeMarkdown(projection.source.projectVersion)}`,
    `- Empreinte du projet source : ${escapeMarkdown(projection.source.projectDigest)}`,
    `- Projection demandée le : ${escapeMarkdown(projection.requestedAt)}`,
    `- Template : ${projection.source.template ? `${escapeMarkdown(projection.source.template.templateId)} · instance ${escapeMarkdown(projection.source.template.templateInstanceId)}` : "LEGACY_DIRECT_PROJECT_PROJECTION"}`,
    `- Profil : ${escapeMarkdown(projection.profile)}`,
    `- Usage : ${escapeMarkdown(projection.usage)}`,
    `- Audience : ${escapeMarkdown(projection.audience)}`,
    `- Frontière : ${projection.boundary}`,
    "",
    "> Projection documentaire en lecture seule. Elle n’est ni la vérité du Research Project, ni un protocole clinique exécutable, ni une approbation.",
  ];
  projection.sections.forEach((section) => {
    lines.push("", `## ${section.order}. ${escapeMarkdown(section.title)}`, "", `Statut : **${section.status}** · Applicabilité : **${section.applicability}** · TMP : **${section.templateStatus ?? "LEGACY"}**`);
    if (section.templateNodeIds.length) lines.push("", "Nœuds TMP :", bulletList(section.templateNodeIds));
    if (section.futureReason) lines.push("", `Dépendance future : ${escapeMarkdown(section.futureReason)}`);
    if (section.statusReasons.length) lines.push("", "Règles de décision :", bulletList(section.statusReasons));
    section.blocks.forEach((block) => {
      lines.push("", `### ${escapeMarkdown(block.label ?? block.kind)}`, "", bulletList(block.items));
    });
    if (section.unknowns.length) lines.push("", "### Inconnues", "", bulletList(section.unknowns));
    if (section.limitations.length) lines.push("", "### Limitations", "", bulletList(section.limitations));
    if (section.contradictions.length) lines.push("", "### Contradictions", "", bulletList(section.contradictions));
    if (section.requirementIds.length) lines.push("", "### Exigences REG-001", "", bulletList(section.requirementIds));
    if (section.patternIds.length) lines.push("", "### Patterns DOC-002", "", bulletList(section.patternIds));
    if (section.humanDecisionIds.length) lines.push("", "### Décisions humaines liées", "", bulletList(section.humanDecisionIds));
    lines.push("", "### Provenance", "", bulletList(section.provenanceRefs));
  });
  lines.push("", "## Registre des décisions humaines", "");
  lines.push(projection.humanDecisions.length ? bulletList(projection.humanDecisions.map((item) => `${item.status} — ${item.gateId} — ${item.actor ?? "acteur non attribué"} — mandat ${item.mandate ?? "non attribué"} — version ${item.version} — ${item.reason ?? "raison non renseignée"}`)) : "- Aucune décision transportée.");
  lines.push("", "## Provenance de la projection", "");
  lines.push(projection.provenanceRefs.length ? bulletList(projection.provenanceRefs) : "- Aucune provenance supplémentaire transportée.");
  lines.push("", `Digest de projection : ${projection.projectionDigest}`, "");
  return lines.join("\n");
};
