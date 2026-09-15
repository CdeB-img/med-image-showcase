import type { DocumentProjection } from "./types";
import { administrationStatusLabel } from "./administration";
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

const renderAdministration = (projection: Readonly<DocumentProjection>) => {
  const admin = projection.administration;
  if (!admin) return "";
  return `<section aria-label="Informations administratives" data-status="${admin.status}"><h2>Informations administratives</h2><p class="status">${administrationStatusLabel(admin)}</p><dl class="administration">${admin.fields.filter((f) => f.required || f.value).map((f) => `<div><dt>${escapeHtml(f.label)}</dt><dd>${escapeHtml(f.value ?? f.placeholder)}</dd></div>`).join("")}</dl><p class="note">La complétude administrative ne constitue pas une approbation scientifique ou réglementaire.</p></section>`;
};

export const renderProjectionHtml = (projection: Readonly<DocumentProjection>) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(projection.title)}</title>
<style>body{margin:0;background:#f1f5f9;color:#172b3a;font:16px/1.65 system-ui,sans-serif}main{max-width:900px;margin:32px auto;padding:48px;background:white;border-top:6px solid #146b71}h1{font-size:30px;line-height:1.25}h2{font-size:21px;margin-top:28px;color:#155e63}h3{font-size:17px}section{break-inside:avoid}dt{font-weight:600}dd{margin:0 0 12px;overflow-wrap:anywhere}.administration{display:grid;grid-template-columns:1fr 1fr;gap:12px 32px}.brand{letter-spacing:.18em;font-weight:700;color:#146b71}.status,.note{padding:12px 16px;background:#eef6f6;border-left:3px solid #146b71}.note,footer,summary{font-size:13px;color:#526371}details{margin-top:32px;border-top:1px solid #cbd5e1;padding-top:16px}li{margin:5px 0}footer{margin-top:32px;overflow-wrap:anywhere}@media print{body{background:white;font-size:10pt}main{margin:0;padding:0;border:0}details{display:none}h2{break-after:avoid}a{color:inherit}}@media(max-width:650px){main{margin:0;padding:24px}.administration{grid-template-columns:1fr}}</style></head>
<body><main><article data-projection-id="${escapeHtml(projection.projectionId)}">
<header><p class="brand">NOXIA · PROTOCOL DESIGNER</p><h1>${escapeHtml(projection.administration?.fields.find((f) => f.key === "title")?.value ?? projection.title)}</h1><p>Protocole de travail · version générée ${escapeHtml(projection.projectionVersion)} · projet version ${escapeHtml(projection.source.projectVersion.match(/:version:(\d+)$/)?.[1] ?? projection.source.projectVersion)}</p><p class="note">Version de travail issue du projet adopté. Les éléments absents restent à préciser. Ce document ne constitue pas une approbation scientifique ou réglementaire.</p></header>
${renderAdministration(projection)}
${renderStandardShortProtocol(projection)}
<details><summary>Traçabilité documentaire et décisions</summary>
<dl><dt>Identité de projection</dt><dd>${escapeHtml(projection.projectionId)}</dd><dt>État scientifique</dt><dd>${projection.lifecycle} · ${projection.readiness}</dd><dt>Projet source</dt><dd>${escapeHtml(projection.source.projectId)} · ${escapeHtml(projection.source.projectVersion)}</dd><dt>Empreinte source</dt><dd>${escapeHtml(projection.source.projectDigest)}</dd><dt>Généré le</dt><dd>${escapeHtml(projection.requestedAt)}</dd><dt>Template</dt><dd>${projection.source.template ? `${escapeHtml(projection.source.template.templateId)} · ${escapeHtml(projection.source.template.templateInstanceId)}` : "LEGACY_DIRECT_PROJECT_PROJECTION"}</dd><dt>Profil / usage</dt><dd>${escapeHtml(projection.profile)} · ${escapeHtml(projection.usage)} · ${escapeHtml(projection.audience)}</dd></dl>
${projection.sections.map(renderTraceSection).join("\n")}
<section><h2>Registre des décisions humaines</h2>${projection.humanDecisions.length ? list(projection.humanDecisions.map((item) => `${item.status} — ${item.gateId} — ${item.actor ?? "acteur non attribué"} — mandat ${item.mandate ?? "non attribué"} — version ${item.version} — ${item.reason ?? "raison non renseignée"}`)) : "<p>Aucune décision transportée.</p>"}</section>
<section><h2>Provenance de la projection</h2>${projection.provenanceRefs.length ? list(projection.provenanceRefs) : "<p>Aucune provenance supplémentaire transportée.</p>"}</section>
</details><footer>Projection en lecture seule · Digest : ${escapeHtml(projection.projectionDigest)}</footer></article></main></body></html>`;
