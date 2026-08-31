import type { DocumentProjection } from "./types";
import { buildStandardProtocolPresentation } from "./standard-protocol-presentation";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
const list = (values: ReadonlyArray<string>) => `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

const humanizeTemporalTraceValue = (value: string) => value
  .replace(/\bACQUISITION_TIME\b/g, "moment de l’acquisition")
  .replace(/\bEXPECTED_AT\b/g, "moment attendu")
  .replace(/\bSINGLE_ASSESSMENT\b/g, "évaluation unique")
  .replace(/\bSCIENTIFIC_WINDOW_TO_DEFINE\b/g, "fenêtre scientifique à préciser")
  .replace(/\bOPERATIONAL_WINDOW_FUTURE\b/g, "fenêtre opérationnelle future")
  .replace(/\bHOUR\b/g, "heure")
  .replace(/\bDAY\b/g, "jour")
  .replace(/\bWEEK\b/g, "semaine")
  .replace(/\bMONTH\b/g, "mois")
  .replace(/\bYEAR\b/g, "an");

const renderTraceSection = (section: Readonly<DocumentProjection["sections"][number]>) => {
  const visible = section.sectionId === "visits-temporal" ? humanizeTemporalTraceValue : (value: string) => value;
  const visibleList = (values: ReadonlyArray<string>) => list(values.map(visible));
  return `<section id="${escapeHtml(section.sectionId)}"><h2>${section.order}. ${escapeHtml(section.title)}</h2><p><strong>Statut :</strong> ${section.status} · <strong>Applicabilité :</strong> ${section.applicability} · <strong>TMP :</strong> ${section.templateStatus ?? "LEGACY"}</p>${section.templateNodeIds.length ? `<h3>Nœuds TMP</h3>${visibleList(section.templateNodeIds)}` : ""}${section.futureReason ? `<p><strong>Dépendance future :</strong> ${escapeHtml(visible(section.futureReason))}</p>` : ""}${section.statusReasons.length ? `<h3>Règles de décision</h3>${visibleList(section.statusReasons)}` : ""}${section.blocks.map((block) => `<div data-commitment="${block.commitment}"><h3>${escapeHtml(block.label ?? block.kind)}</h3>${visibleList(block.items)}</div>`).join("")}${section.unknowns.length ? `<h3>Inconnues</h3>${visibleList(section.unknowns)}` : ""}${section.limitations.length ? `<h3>Limitations</h3>${visibleList(section.limitations)}` : ""}${section.contradictions.length ? `<h3>Contradictions</h3>${visibleList(section.contradictions)}` : ""}${section.requirementIds.length ? `<h3>Exigences REG-001</h3>${visibleList(section.requirementIds)}` : ""}${section.patternIds.length ? `<h3>Patterns DOC-002</h3>${visibleList(section.patternIds)}` : ""}${section.humanDecisionIds.length ? `<h3>Décisions humaines liées</h3>${visibleList(section.humanDecisionIds)}` : ""}<h3>Provenance</h3>${visibleList(section.provenanceRefs)}</section>`;
};

const renderStandardShortProtocol = (projection: Readonly<DocumentProjection>) => {
  const presentation = buildStandardProtocolPresentation(projection);
  const sections = presentation.sections.map((section) => {
    const content = section.entries.length
      ? section.entries.map((item) => item.kind === "LABELED_VALUE"
        ? `<dl><dt>${escapeHtml(item.label ?? "")}</dt><dd>${escapeHtml(item.value)}</dd></dl>`
        : item.kind === "LIST_ITEM" ? `<ul><li>${escapeHtml(item.value)}</li></ul>` : `<p>${escapeHtml(item.value)}</p>`).join("")
      : "<p>À préciser.</p>";
    return `<section id="short-${escapeHtml(section.sectionId)}"><h2>${escapeHtml(section.title)}</h2>${content}</section>`;
  }).join("\n");
  const openItems = presentation.openItems.length
    ? list(presentation.openItems.map((item) => item.label))
    : "<p>Aucun point général supplémentaire n’est signalé dans cet aperçu.</p>";
  return `<section id="short-protocol"><h1>Protocole de travail</h1>${sections}<section id="short-open-items"><h2>Points restant à préciser</h2>${openItems}</section></section>`;
};

export const renderProjectionHtml = (projection: Readonly<DocumentProjection>) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(projection.title)}</title></head>
<body><main><article data-projection-id="${escapeHtml(projection.projectionId)}">
<header><h1>${escapeHtml(projection.title)}</h1><dl><dt>Identité de projection</dt><dd>${escapeHtml(projection.projectionId)}</dd><dt>Projection</dt><dd>${projection.projectionType} v${escapeHtml(projection.projectionVersion)}</dd><dt>État</dt><dd>${projection.lifecycle}</dd><dt>Readiness</dt><dd>${projection.readiness}</dd><dt>Projet source</dt><dd>${escapeHtml(projection.source.projectId)} · ${escapeHtml(projection.source.projectVersion)}</dd><dt>Empreinte du projet source</dt><dd>${escapeHtml(projection.source.projectDigest)}</dd><dt>Projection demandée le</dt><dd>${escapeHtml(projection.requestedAt)}</dd><dt>Template</dt><dd>${projection.source.template ? `${escapeHtml(projection.source.template.templateId)} · instance ${escapeHtml(projection.source.template.templateInstanceId)} · niveau ${escapeHtml(projection.source.template.requestedDetailLevel ?? "non spécifié")}` : "LEGACY_DIRECT_PROJECT_PROJECTION"}</dd><dt>Profil</dt><dd>${escapeHtml(projection.profile)}</dd><dt>Usage</dt><dd>${escapeHtml(projection.usage)}</dd><dt>Audience</dt><dd>${escapeHtml(projection.audience)}</dd></dl><p><strong>Frontière :</strong> projection en lecture seule ; ni vérité du projet, ni protocole clinique exécutable, ni approbation.</p></header>
${renderStandardShortProtocol(projection)}
<details><summary>Traçabilité documentaire</summary>
${projection.sections.map(renderTraceSection).join("\n")}
<section><h2>Registre des décisions humaines</h2>${projection.humanDecisions.length ? list(projection.humanDecisions.map((item) => `${item.status} — ${item.gateId} — ${item.actor ?? "acteur non attribué"} — mandat ${item.mandate ?? "non attribué"} — version ${item.version} — ${item.reason ?? "raison non renseignée"}`)) : "<p>Aucune décision transportée.</p>"}</section>
<section><h2>Provenance de la projection</h2>${projection.provenanceRefs.length ? list(projection.provenanceRefs) : "<p>Aucune provenance supplémentaire transportée.</p>"}</section>
</details>
<footer><p>Digest de projection : ${escapeHtml(projection.projectionDigest)}</p></footer></article></main></body></html>`;
