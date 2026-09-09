import { logicalDigest, uniqueSorted } from "@/features/knowledge-engine/canonical";
import {
  buildDataAnalysisPlanningContext,
  buildDataManagementPlanningContribution,
  buildStudyDataPlanContribution,
} from "@/features/data-analysis-planning";
import {
  ensureCanonicalProjectState,
  presentCanonicalTemporalAnchor,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { renderProjection } from "./renderer";
import { buildStandardProtocolPresentation } from "./standard-protocol-presentation";
import { projectDocumentSourceFromFunctionalProject } from "./functional-reset-boundary";
import type { DocumentProjection } from "./types";

export const STUDY_DELIVERABLE_PORTFOLIO_VERSION = "1.0.0" as const;

export type StudyDeliverableStatus = "READY" | "PARTIAL" | "MISSING_DECISION" | "NOT_APPLICABLE" | "PROFILE_REQUIRED";
export type StudyDeliverableKind =
  | "PROTOCOL_FULL"
  | "PROTOCOL_SYNOPSIS"
  | "SCHEDULE_OF_ACTIVITIES"
  | "CRF"
  | "DATA_DICTIONARY"
  | "DATA_MANAGEMENT_PLAN"
  | "EDC_IMPORT_PACKAGE"
  | "STATISTICAL_ANALYSIS_PLAN"
  | "REGULATORY_DOCUMENT_PACKAGE"
  | "IMAGING_CORE_LAB_MANUAL";

export type StudyDeliverableFile = Readonly<{
  fileName: string;
  format: "HTML" | "MARKDOWN" | "CSV" | "JSON";
  mimeType: string;
  content: string;
}>;

export type StudyDeliverableArtifact = Readonly<{
  artifactId: string;
  artifactVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
  kind: StudyDeliverableKind;
  name: string;
  status: StudyDeliverableStatus;
  preview: string;
  files: readonly StudyDeliverableFile[];
  sourceObjectRefs: readonly string[];
  canonicalVariableRefs: readonly string[];
  missingDecisions: readonly string[];
  limitations: readonly string[];
}>;

export type CanonicalCrfField = Readonly<{
  fieldId: string;
  canonicalVariableId: string;
  canonicalVariableVersionId: string;
  label: string;
  scientificRole: string | null;
  valueType: null;
  unit: string | null;
  choices: null;
  required: null;
  expectedOccasionRefs: readonly string[];
  plannedSource: string | null;
  plannedMethod: string | null;
  missingnessRule: null;
  validationRules: readonly string[];
  provenanceRefs: readonly string[];
}>;

export type CanonicalCrfPackage = Readonly<{
  contract: "CANONICAL_CRF_PACKAGE";
  contractVersion: "1.0.0";
  packageId: string;
  owner: "DATA_MANAGEMENT";
  sourceProject: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
  sourceLogicalProjectionRefs: readonly string[];
  status: "CANDIDATE_PROJECTION_ONLY";
  fields: readonly CanonicalCrfField[];
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;

export type StudyDeliverableManifest = Readonly<{
  manifestVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
  portfolioId: string;
  generatedAt: string;
  project: Readonly<{
    projectId: string;
    projectVersion: string;
    projectDigest: string;
  }>;
  projectionOwner: "DOC-001";
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  regulatoryComplianceClaim: false;
  redcapProfile: "REDCAP_DATA_DICTIONARY_CSV_BASE_PROFILE_1.0";
  redcapInstanceCompatibility: "REQUIRES_LOCAL_REDCAP_VALIDATION";
  artifacts: readonly Readonly<{
    artifactId: string;
    artifactVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
    kind: StudyDeliverableKind;
    status: StudyDeliverableStatus;
    files: readonly Readonly<{ fileName: string; format: StudyDeliverableFile["format"]; mimeType: string }>[];
    sourceObjectRefs: readonly string[];
    canonicalVariableRefs: readonly string[];
  }>[];
  variableMappings: readonly Readonly<{
    canonicalVariableId: string;
    redcapFieldName: string;
  }>[];
  canonicalCrfPackageRef: string;
}>;

export type StudyDeliverablePortfolio = Readonly<{
  contract: "V1_STUDY_DELIVERABLE_PORTFOLIO";
  contractVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
  portfolioId: string;
  projectRef: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
  generatedAt: string;
  owner: "DOC-001";
  artifacts: readonly StudyDeliverableArtifact[];
  manifest: StudyDeliverableManifest;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
})[character] ?? character);

const csv = (value: string | number | boolean | null) => {
  const text = value === null ? "" : String(value);
  return /[",\n\r]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
};

const csvDocument = (headers: readonly string[], rows: readonly (readonly (string | number | boolean | null)[])[]) =>
  `${[headers, ...rows].map((row) => row.map(csv).join(",")).join("\r\n")}\r\n`;

const listHtml = (values: readonly string[], empty = "À préciser.") => values.length
  ? `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`
  : `<p>${escapeHtml(empty)}</p>`;

const documentHtml = (title: string, project: Readonly<ResearchProjectOwnerProjection>, body: string) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)}</title></head>
<body><main><header><h1>${escapeHtml(title)}</h1><p>Research Project ${escapeHtml(project.projectId)} · version ${escapeHtml(project.versionId)}</p><p>Projection en lecture seule ; toute information manquante reste explicitement ouverte.</p></header>${body}</main></body></html>`;

const slug = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR").replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");

const redcapFieldName = (label: string, variableId: string) => {
  // Keep the adapter on the conservative 26-character REDCap field-name
  // boundary while retaining a deterministic suffix tied to Project identity.
  const stem = slug(label).slice(0, 17) || "variable";
  const safeStem = /^[a-z]/u.test(stem) ? stem : `v_${stem}`;
  return `${safeStem}_${logicalDigest(variableId).slice(0, 8)}`;
};

const artifact = (input: Omit<StudyDeliverableArtifact, "artifactId" | "artifactVersion"> & { project: Readonly<ResearchProjectOwnerProjection> }): StudyDeliverableArtifact => Object.freeze({
  artifactId: `study-deliverable:${logicalDigest({
    kind: input.kind,
    project: input.project.projectId,
    version: input.project.versionId,
    files: input.files.map((file) => ({ fileName: file.fileName, content: file.content })),
  })}`,
  artifactVersion: STUDY_DELIVERABLE_PORTFOLIO_VERSION,
  kind: input.kind,
  name: input.name,
  status: input.status,
  preview: input.preview,
  files: Object.freeze([...input.files]),
  sourceObjectRefs: Object.freeze(uniqueSorted([...input.sourceObjectRefs])),
  canonicalVariableRefs: Object.freeze(uniqueSorted([...input.canonicalVariableRefs])),
  missingDecisions: Object.freeze(uniqueSorted([...input.missingDecisions])),
  limitations: Object.freeze(uniqueSorted([...input.limitations])),
});

/**
 * Reuses the current Study Data and Data Management planning projections. The
 * package is a read-only, provider-neutral representation: Project remains the
 * owner of scientific meaning and no proposed planning object is adopted here.
 */
export const buildCanonicalCrfPackage = (
  project: Readonly<ResearchProjectOwnerProjection>,
): CanonicalCrfPackage => {
  const canonicalState = ensureCanonicalProjectState(project);
  const documentSource = projectDocumentSourceFromFunctionalProject(project, null);
  const planningContext = buildDataAnalysisPlanningContext(documentSource);
  const studyData = buildStudyDataPlanContribution(planningContext);
  const dataManagement = buildDataManagementPlanningContribution(planningContext, studyData);
  const variableVersions = new Map(canonicalState.objects
    .filter((object) => object.actuality === "CURRENT"
      && object.objectType === "CANONICAL_VARIABLE"
      && !["UNKNOWN", "WITHHELD"].includes(object.epistemicState))
    .map((object) => [object.objectId, object]));
  const studyVariables = new Map(studyData.content.canonicalVariables.map((variable) => [variable.variableRef.objectId, variable]));
  const fields: CanonicalCrfField[] = dataManagement.content.logicalCRF.fields.map((field) => {
    const variable = variableVersions.get(field.canonicalVariableRef.objectId);
    const planned = studyVariables.get(field.canonicalVariableRef.objectId);
    if (!variable || !planned) throw new Error("CANONICAL_CRF_PROJECT_VARIABLE_BINDING_MISSING");
    return Object.freeze({
      fieldId: field.fieldDefinitionId,
      canonicalVariableId: variable.objectId,
      canonicalVariableVersionId: variable.objectVersionId,
      label: field.projectedLabel,
      scientificRole: variable.scientificRole,
      valueType: null,
      unit: field.unit,
      choices: null,
      required: null,
      expectedOccasionRefs: Object.freeze(field.expectedOccasionRefs.map((reference) => reference.objectId)),
      plannedSource: planned.plannedSource,
      plannedMethod: planned.plannedMethod,
      missingnessRule: null,
      validationRules: Object.freeze(uniqueSorted([...field.structuralControls, ...field.contextualControls])),
      provenanceRefs: Object.freeze(uniqueSorted([
        variable.objectId,
        variable.objectVersionId,
        ...field.provenance.sourceRefs,
      ])),
    });
  });
  const packageId = `canonical-crf-package:${logicalDigest({
    project: project.projectId,
    version: project.versionId,
    digest: project.projectDigest,
    fields,
  })}`;
  return Object.freeze({
    contract: "CANONICAL_CRF_PACKAGE",
    contractVersion: "1.0.0",
    packageId,
    owner: "DATA_MANAGEMENT",
    sourceProject: { projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest },
    sourceLogicalProjectionRefs: Object.freeze([
      dataManagement.content.logicalCRF.projectionId,
      dataManagement.content.logicalDataDictionary.projectionId,
      dataManagement.content.logicalScheduleOfActivities.projectionId,
    ]),
    status: "CANDIDATE_PROJECTION_ONLY",
    fields: Object.freeze(fields),
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  });
};

export const buildStudyDeliverablePortfolio = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  protocolProjection: Readonly<DocumentProjection> | null;
  generatedAt: string;
}): StudyDeliverablePortfolio => {
  if (input.protocolProjection && (
    input.protocolProjection.source.projectId !== input.project.projectId
    || input.protocolProjection.source.projectVersion !== input.project.versionId
    || input.protocolProjection.source.projectDigest !== input.project.projectDigest
  )) throw new Error("STUDY_DELIVERABLE_PROTOCOL_PROJECT_BINDING_MISMATCH");
  const state = ensureCanonicalProjectState(input.project);
  const canonicalCrfPackage = buildCanonicalCrfPackage(input.project);
  const current = state.objects.filter((object) => object.actuality === "CURRENT");
  const known = current.filter((object) => !["UNKNOWN", "WITHHELD"].includes(object.epistemicState));
  const byType = (...types: typeof known[number]["objectType"][]) => known.filter((object) => types.includes(object.objectType));
  const questions = byType("SCIENTIFIC_QUESTION");
  const objectives = byType("OBJECTIVE");
  const hypotheses = byType("HYPOTHESIS");
  const designs = byType("STUDY_DESIGN");
  const populations = byType("POPULATION", "CONDITION", "ELIGIBILITY_CRITERION");
  const endpoints = byType("ENDPOINT");
  const variables = byType("CANONICAL_VARIABLE");
  const analyses = byType("ANALYSIS_SPECIFICATION");
  const imaging = byType("IMAGING_MODALITY", "ACQUISITION");
  const visits = byType("VISIT");
  const occasionByVariable = new Map(variables.map((variable) => [
    variable.objectId,
    state.expectedVariableOccasions.filter((occasion) => occasion.actuality === "CURRENT" && occasion.variableProjectRef === variable.objectId),
  ]));
  const variableMappings = canonicalCrfPackage.fields.map((field) => ({
    canonicalVariableId: field.canonicalVariableId,
    redcapFieldName: redcapFieldName(field.label, field.canonicalVariableId),
  }));
  const variableRefs = variables.map((variable) => variable.objectId);
  const objectRefs = (objects: typeof known) => objects.flatMap((object) => [object.objectId, object.objectVersionId]);
  const protocolPresentation = input.protocolProjection ? buildStandardProtocolPresentation(input.protocolProjection) : null;
  const synopsisBody = [
    `<section><h2>Question scientifique</h2>${listHtml(questions.map((item) => item.content))}</section>`,
    `<section><h2>Objectifs</h2>${listHtml(objectives.map((item) => item.content))}</section>`,
    `<section><h2>Design</h2>${listHtml(designs.map((item) => item.content))}</section>`,
    `<section><h2>Population</h2>${listHtml(populations.map((item) => item.content))}</section>`,
    `<section><h2>Critères d’évaluation</h2>${listHtml(endpoints.map((item) => item.content))}</section>`,
    `<section><h2>Mesures</h2>${listHtml(variables.map((item) => item.content))}</section>`,
    `<section><h2>Analyse</h2>${listHtml(analyses.map((item) => item.content), "Méthode principale à décider.")}</section>`,
  ].join("");
  const soaRows = variables.flatMap((variable) => {
    const occasions = occasionByVariable.get(variable.objectId) ?? [];
    if (!occasions.length) return [[variable.objectId, variable.content, "", "", "À préciser"]];
    return occasions.map((occasion) => [
      variable.objectId,
      variable.content,
      occasion.occasionId,
      presentCanonicalTemporalAnchor(occasion.anchor, new Map(known.map((object) => [object.objectId, object.content]))),
      "Prévue",
    ]);
  });
  const soaCsv = csvDocument(["canonical_variable_id", "variable_label", "occasion_id", "timing", "status"], soaRows);
  const genericDictionaryRows = canonicalCrfPackage.fields.map((field) => {
    const mapping = variableMappings.find((item) => item.canonicalVariableId === field.canonicalVariableId)!;
    const variable = variables.find((item) => item.objectId === field.canonicalVariableId)!;
    return [field.canonicalVariableId, mapping.redcapFieldName, field.label, field.scientificRole ?? "", field.unit ?? "", field.choices ? JSON.stringify(field.choices) : "", variable.epistemicState, field.canonicalVariableVersionId];
  });
  const genericDictionaryCsv = csvDocument([
    "canonical_variable_id", "field_name", "field_label", "scientific_role", "unit", "value_domain", "epistemic_state", "source_object_version",
  ], genericDictionaryRows);
  const redcapHeaders = [
    "Variable / Field Name", "Form Name", "Section Header", "Field Type", "Field Label",
    "Choices, Calculations, OR Slider Labels", "Field Note", "Text Validation Type OR Show Slider Number",
    "Text Validation Min", "Text Validation Max", "Identifier?", "Branching Logic (Show field only if...)",
    "Required Field?", "Custom Alignment", "Question Number (surveys only)", "Matrix Group Name", "Matrix Ranking?", "Field Annotation",
  ];
  const redcapCsv = csvDocument(redcapHeaders, [[
    "record_id", "study_identification", "", "text", "Identifiant technique du dossier",
    "", "Clé technique REDCap ; ce champ n’est pas une variable scientifique du Research Project.",
    "", "", "", "", "", "y", "", "", "", "", "",
  ], ...canonicalCrfPackage.fields.map((field) => {
    const mapping = variableMappings.find((item) => item.canonicalVariableId === field.canonicalVariableId)!;
    return [mapping.redcapFieldName, "study_measurements", "", "text", field.label, "", `NOXIA canonicalVariableId: ${field.canonicalVariableId}`, "", "", "", "", "", "", "", "", "", "", ""];
  })]);
  const crfHtml = documentHtml("CRF — formulaire logique", input.project, `<section><h2>Mesures</h2>${canonicalCrfPackage.fields.length ? canonicalCrfPackage.fields.map((field) => {
    const mapping = variableMappings.find((item) => item.canonicalVariableId === field.canonicalVariableId)!;
    const occasions = occasionByVariable.get(field.canonicalVariableId) ?? [];
    return `<article data-canonical-variable-id="${escapeHtml(field.canonicalVariableId)}"><h3>${escapeHtml(field.label)}</h3><dl><dt>Identité canonique</dt><dd>${escapeHtml(field.canonicalVariableId)}</dd><dt>Nom de champ d’export</dt><dd>${escapeHtml(mapping.redcapFieldName)}</dd><dt>Type</dt><dd>${escapeHtml(field.valueType ?? "À qualifier")}</dd><dt>Unité</dt><dd>${escapeHtml(field.unit ?? "À préciser")}</dd><dt>Temporalité</dt><dd>${escapeHtml(occasions.length ? occasions.map((item) => presentCanonicalTemporalAnchor(item.anchor, new Map(known.map((object) => [object.objectId, object.content])))).join(" ; ") : "À préciser")}</dd><dt>Obligatoire</dt><dd>À décider</dd></dl></article>`;
  }).join("") : "<p>Aucune variable canonique adoptée.</p>"}</section>`);
  const dmpHtml = documentHtml("Plan de gestion des données", input.project, [
    `<section><h2>Périmètre de collecte</h2>${listHtml(variables.map((item) => `${item.content} — ${item.objectId}`), "Aucune variable canonique adoptée.")}</section>`,
    "<section><h2>Décisions ouvertes</h2><ul><li>Source opérationnelle et responsabilités de saisie à préciser.</li><li>Contrôles, queries, corrections, gel et release à décider.</li></ul></section>",
    "<section><h2>Frontière</h2><p>Aucune donnée réelle, ingestion, query, correction, transformation, freeze, lock ou release n’est exécutée par cette projection.</p></section>",
  ].join(""));
  const sapHtml = documentHtml("Plan d’analyse statistique", input.project, [
    `<section><h2>Objectifs analytiques</h2>${listHtml(objectives.map((item) => item.content))}</section>`,
    `<section><h2>Critères</h2>${listHtml(endpoints.map((item) => item.content))}</section>`,
    `<section><h2>Variables</h2>${listHtml(variables.map((item) => `${item.content} — ${item.objectId}`))}</section>`,
    `<section><h2>Spécifications adoptées</h2>${listHtml(analyses.map((item) => item.content), "Méthode d’analyse principale non encore adoptée.")}</section>`,
    "<section><h2>Éléments non définis</h2><p>Population d’analyse, gestion des données manquantes, multiplicité, sensibilités et dimensionnement restent à décider lorsqu’ils sont applicables.</p></section>",
  ].join(""));
  const regulatoryRequirements = input.protocolProjection?.sections.flatMap((section) => section.requirementIds) ?? [];
  const regulatoryContent = JSON.stringify({
    packageVersion: "1.0.0",
    project: { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest },
    status: "PROFILE_REQUIRED",
    regulatoryComplianceClaim: false,
    profileDependencies: ["juridiction", "promoteur", "institution", "qualification réglementaire de la recherche", "templates locaux applicables"],
    resolvedRequirementRefs: uniqueSorted(regulatoryRequirements),
    note: "Index de préparation uniquement. Aucun document juridictionnel ou formulaire institutionnel n’est présenté comme conforme.",
  }, null, 2);
  const imagingHtml = documentHtml("Guide Imaging / Core Lab", input.project, [
    `<section><h2>Modalités et acquisitions adoptées</h2>${listHtml(imaging.map((item) => item.content))}</section>`,
    `<section><h2>Mesures canoniques</h2>${listHtml(variables.map((item) => `${item.content} — ${item.objectId}`))}</section>`,
    "<section><h2>Éléments opérationnels ouverts</h2><p>Harmonisation inter-centres, contrôle qualité, transfert, lecture et adjudication restent à définir par les owners compétents.</p></section>",
  ].join(""));
  const protocolPresentationHtml = protocolPresentation?.sections.map((section) => `<section data-source-section="${escapeHtml(section.sectionId)}"><h2>${escapeHtml(section.title)}</h2>${section.entries.length
    ? `<ul>${section.entries.map((entry) => `<li>${entry.label ? `<strong>${escapeHtml(entry.label)} :</strong> ` : ""}${escapeHtml(entry.value)}</li>`).join("")}</ul>`
    : "<p>À préciser.</p>"}</section>`).join("") ?? "";
  const fullProtocolHtml = input.protocolProjection ? documentHtml("Protocole complet", input.project, [
    protocolPresentationHtml,
    `<section><h2>Organisation et conduite de l’étude</h2>${listHtml(designs.map((item) => item.content), "Design à préciser.")}${listHtml(visits.map((item) => item.content), "Calendrier et visites à préciser.")}</section>`,
    `<section><h2>Données et collecte</h2>${listHtml(canonicalCrfPackage.fields.map((field) => `${field.label} — ${field.canonicalVariableId}`), "Aucune variable canonique adoptée.")}<p>Le CRF, le dictionnaire et le calendrier détaillés sont fournis comme livrables séparés du même portefeuille.</p></section>`,
    `<section><h2>Stratégie d’analyse</h2>${listHtml(analyses.map((item) => item.content), "Méthode d’analyse principale non encore adoptée.")}</section>`,
    "<section><h2>Gestion des données</h2><p>La stratégie de collecte, les contrôles, les queries, les corrections, le gel et la release restent ouverts tant qu’ils ne sont pas adoptés.</p></section>",
    "<section><h2>Cadre réglementaire et éthique</h2><p>La juridiction, le promoteur, l’institution et la qualification réglementaire doivent être fournis avant toute projection juridictionnelle. Aucune conformité n’est revendiquée.</p></section>",
    `<section><h2>Provenance</h2><p>Research Project ${escapeHtml(input.project.projectId)} · ${escapeHtml(input.project.versionId)} · digest ${escapeHtml(input.project.projectDigest)}</p></section>`,
  ].join("")) : null;
  const fullProtocolMarkdown = input.protocolProjection ? [
    renderProjection(input.protocolProjection, "MARKDOWN").content,
    "## Organisation et conduite de l’étude",
    ...(designs.length ? designs.map((item) => `- ${item.content}`) : ["- Design à préciser."]),
    ...(visits.length ? visits.map((item) => `- ${item.content}`) : ["- Calendrier et visites à préciser."]),
    "## Données et collecte",
    ...(canonicalCrfPackage.fields.length ? canonicalCrfPackage.fields.map((field) => `- ${field.label} — \`${field.canonicalVariableId}\``) : ["- Aucune variable canonique adoptée."]),
    "## Stratégie d’analyse",
    ...(analyses.length ? analyses.map((item) => `- ${item.content}`) : ["- Méthode d’analyse principale non encore adoptée."]),
    "## Gestion des données",
    "La stratégie de collecte et le cycle de vie des données restent à adopter.",
    "## Cadre réglementaire et éthique",
    "Profil juridictionnel et institutionnel requis. Aucune conformité revendiquée.",
    "## Provenance",
    `Research Project ${input.project.projectId} · ${input.project.versionId} · ${input.project.projectDigest}`,
  ].join("\n\n") : null;
  const fullProtocolFiles: StudyDeliverableFile[] = fullProtocolHtml && fullProtocolMarkdown ? [
    { fileName: "protocol-complet.html", format: "HTML", mimeType: "text/html;charset=utf-8", content: fullProtocolHtml },
    { fileName: "protocol-complet.md", format: "MARKDOWN", mimeType: "text/markdown;charset=utf-8", content: fullProtocolMarkdown },
  ] : [];

  const artifacts: StudyDeliverableArtifact[] = [
    artifact({ project: input.project, kind: "PROTOCOL_FULL", name: "Protocole complet", status: input.protocolProjection ? (input.protocolProjection.readiness === "READY_FOR_REVIEW" && !(protocolPresentation?.openItems.length) ? "READY" : "PARTIAL") : "MISSING_DECISION", preview: protocolPresentation?.sections.slice(0, 3).map((section) => section.title).join(" · ") ?? "Autorisation de projection documentaire requise.", files: fullProtocolFiles, sourceObjectRefs: objectRefs(known), canonicalVariableRefs: variableRefs, missingDecisions: input.protocolProjection ? protocolPresentation?.openItems.map((item) => item.label) ?? [] : ["Autoriser la projection documentaire de la version courante"], limitations: ["Projection de travail ; ni protocole clinique exécutable ni approbation."] }),
    artifact({ project: input.project, kind: "PROTOCOL_SYNOPSIS", name: "Synopsis", status: questions.length && objectives.length && designs.length && populations.length && endpoints.length ? "READY" : "PARTIAL", preview: `${questions[0]?.content ?? "Question à préciser"} — ${objectives[0]?.content ?? "Objectif à préciser"}`, files: [{ fileName: "synopsis.html", format: "HTML", mimeType: "text/html;charset=utf-8", content: documentHtml("Synopsis du protocole", input.project, synopsisBody) }], sourceObjectRefs: objectRefs([...questions, ...objectives, ...designs, ...populations, ...endpoints, ...variables, ...analyses]), canonicalVariableRefs: variableRefs, missingDecisions: [...(!designs.length ? ["Design"] : []), ...(!populations.length ? ["Population"] : []), ...(!endpoints.length ? ["Critère principal"] : [])], limitations: ["Projection condensée du même Research Project ; aucune vérité indépendante."] }),
    artifact({ project: input.project, kind: "SCHEDULE_OF_ACTIVITIES", name: "Schedule of Activities", status: variables.length ? (variables.every((variable) => (occasionByVariable.get(variable.objectId) ?? []).length > 0) ? "READY" : "PARTIAL") : "MISSING_DECISION", preview: variables.length ? `${variables.length} variable(s) · ${soaRows.filter((row) => row[2]).length} occasion(s) structurée(s)` : "Variables canoniques requises.", files: variables.length ? [{ fileName: "schedule-of-activities.csv", format: "CSV", mimeType: "text/csv;charset=utf-8", content: soaCsv }] : [], sourceObjectRefs: objectRefs([...variables, ...visits]), canonicalVariableRefs: variableRefs, missingDecisions: variables.flatMap((variable) => (occasionByVariable.get(variable.objectId) ?? []).length ? [] : [`Occasion de collecte : ${variable.content}`]), limitations: ["Une cellule « À préciser » ne constitue pas une visite adoptée."] }),
    artifact({ project: input.project, kind: "CRF", name: "CRF", status: variables.length ? "PARTIAL" : "MISSING_DECISION", preview: variables.length ? `${variables.length} champ(s) projeté(s) depuis les variables canoniques.` : "Variables canoniques requises.", files: variables.length ? [{ fileName: "crf.html", format: "HTML", mimeType: "text/html;charset=utf-8", content: crfHtml }] : [], sourceObjectRefs: objectRefs(variables), canonicalVariableRefs: variableRefs, missingDecisions: ["Domaine de valeurs, caractère obligatoire et règles de saisie à confirmer"], limitations: ["CRF logique de design-time ; aucun eCRF déployé."] }),
    artifact({ project: input.project, kind: "DATA_DICTIONARY", name: "Data Dictionary", status: variables.length ? "PARTIAL" : "MISSING_DECISION", preview: variables.length ? `${variables.length} variable(s), identités canoniques préservées.` : "Variables canoniques requises.", files: variables.length ? [{ fileName: "data-dictionary.csv", format: "CSV", mimeType: "text/csv;charset=utf-8", content: genericDictionaryCsv }, { fileName: "data-dictionary.json", format: "JSON", mimeType: "application/json;charset=utf-8", content: JSON.stringify(genericDictionaryRows.map((row) => ({ canonicalVariableId: row[0], fieldName: row[1], label: row[2], scientificRole: row[3], unit: row[4] || null, valueDomain: row[5] || null, epistemicState: row[6], sourceObjectVersion: row[7] })), null, 2) }] : [], sourceObjectRefs: objectRefs(variables), canonicalVariableRefs: variableRefs, missingDecisions: ["Unités et domaines de valeurs non adoptés restent vides"], limitations: ["Le dictionnaire ne recrée ni ne renomme la variable scientifique canonique."] }),
    artifact({ project: input.project, kind: "DATA_MANAGEMENT_PLAN", name: "Data Management Plan", status: variables.length ? "PARTIAL" : "MISSING_DECISION", preview: variables.length ? "Périmètre canonique disponible ; politiques opérationnelles ouvertes." : "Variables canoniques requises.", files: variables.length ? [{ fileName: "data-management-plan.html", format: "HTML", mimeType: "text/html;charset=utf-8", content: dmpHtml }] : [], sourceObjectRefs: objectRefs(variables), canonicalVariableRefs: variableRefs, missingDecisions: ["Stratégie de collecte", "Contrôles et queries", "Freeze, lock et release"], limitations: ["Aucune opération Data Management réelle n’est exécutée."] }),
    artifact({ project: input.project, kind: "EDC_IMPORT_PACKAGE", name: "Export EDC", status: variables.length ? "PARTIAL" : "MISSING_DECISION", preview: variables.length ? `Package CRF canonique, CSV générique et dictionnaire REDCap pour ${variables.length} variable(s).` : "Variables canoniques requises.", files: variables.length ? [{ fileName: "canonical-crf-package.json", format: "JSON", mimeType: "application/json;charset=utf-8", content: JSON.stringify(canonicalCrfPackage, null, 2) }, { fileName: "edc-generic-fields.csv", format: "CSV", mimeType: "text/csv;charset=utf-8", content: genericDictionaryCsv }, { fileName: "redcap-data-dictionary.csv", format: "CSV", mimeType: "text/csv;charset=utf-8", content: redcapCsv }, { fileName: "edc-variable-mapping.json", format: "JSON", mimeType: "application/json;charset=utf-8", content: JSON.stringify({ canonicalCrfPackageRef: canonicalCrfPackage.packageId, profile: "REDCAP_DATA_DICTIONARY_CSV_BASE_PROFILE_1.0", instanceCompatibility: "REQUIRES_LOCAL_REDCAP_VALIDATION", mappings: variableMappings }, null, 2) }] : [], sourceObjectRefs: objectRefs(variables), canonicalVariableRefs: variableRefs, missingDecisions: variables.length ? ["Types EDC, domaines, contraintes et caractère obligatoire à valider avant usage opérationnel"] : ["Variables canoniques"], limitations: ["Le profil CSV est destiné à l’import de métadonnées REDCap ; la compatibilité avec une version/instance locale doit être vérifiée avant usage.", "Aucune conformité CDISC ni compatibilité EDC générale n’est revendiquée."] }),
    artifact({ project: input.project, kind: "STATISTICAL_ANALYSIS_PLAN", name: "Statistical Analysis Plan", status: analyses.length ? "PARTIAL" : "MISSING_DECISION", preview: analyses.length ? `${analyses.length} spécification(s) adoptée(s) ; inconnues conservées.` : "La méthode d’analyse principale n’a pas encore été choisie.", files: objectives.length || endpoints.length || variables.length ? [{ fileName: "statistical-analysis-plan.html", format: "HTML", mimeType: "text/html;charset=utf-8", content: sapHtml }] : [], sourceObjectRefs: objectRefs([...objectives, ...endpoints, ...variables, ...analyses]), canonicalVariableRefs: variableRefs, missingDecisions: analyses.length ? ["Missingness, multiplicité, sensibilités et dimensionnement selon applicabilité"] : ["Méthode d’analyse principale"], limitations: ["SAP partiel fidèle ; aucune méthode, analyse, valeur ou effectif n’est inventé."] }),
    artifact({ project: input.project, kind: "REGULATORY_DOCUMENT_PACKAGE", name: "Documents réglementaires / éthiques", status: "PROFILE_REQUIRED", preview: "Juridiction et profil institutionnel requis ; aucune conformité revendiquée.", files: [{ fileName: "regulatory-package-index.json", format: "JSON", mimeType: "application/json;charset=utf-8", content: regulatoryContent }], sourceObjectRefs: uniqueSorted(regulatoryRequirements), canonicalVariableRefs: [], missingDecisions: ["Juridiction", "Promoteur", "Institution", "Qualification réglementaire", "Templates locaux"], limitations: ["REGULATORY_COMPLIANCE_CLAIM = NO"] }),
    artifact({ project: input.project, kind: "IMAGING_CORE_LAB_MANUAL", name: "Guide Imaging / Core Lab", status: imaging.length ? "PARTIAL" : "NOT_APPLICABLE", preview: imaging.length ? `${imaging.length} élément(s) d’imagerie adopté(s) ; opérations inter-centres à préciser.` : "Aucune imagerie applicable n’est adoptée.", files: imaging.length ? [{ fileName: "imaging-core-lab-manual.html", format: "HTML", mimeType: "text/html;charset=utf-8", content: imagingHtml }] : [], sourceObjectRefs: objectRefs([...imaging, ...variables]), canonicalVariableRefs: variableRefs, missingDecisions: imaging.length ? ["Harmonisation inter-centres", "Contrôle qualité", "Lecture et adjudication"] : [], limitations: ["Guide opérationnel partiel ; aucun paramètre d’acquisition n’est inventé."] }),
  ];
  const portfolioId = `study-deliverable-portfolio:${logicalDigest({ project: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest, artifacts: artifacts.map((item) => item.artifactId) })}`;
  const manifest: StudyDeliverableManifest = Object.freeze({
    manifestVersion: STUDY_DELIVERABLE_PORTFOLIO_VERSION,
    portfolioId,
    generatedAt: input.generatedAt,
    project: { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest },
    projectionOwner: "DOC-001",
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    regulatoryComplianceClaim: false,
    redcapProfile: "REDCAP_DATA_DICTIONARY_CSV_BASE_PROFILE_1.0",
    redcapInstanceCompatibility: "REQUIRES_LOCAL_REDCAP_VALIDATION",
    canonicalCrfPackageRef: canonicalCrfPackage.packageId,
    artifacts: artifacts.map((item) => ({
      artifactId: item.artifactId,
      artifactVersion: item.artifactVersion,
      kind: item.kind,
      status: item.status,
      files: item.files.map((file) => ({ fileName: file.fileName, format: file.format, mimeType: file.mimeType })),
      sourceObjectRefs: item.sourceObjectRefs,
      canonicalVariableRefs: item.canonicalVariableRefs,
    })),
    variableMappings,
  });
  return Object.freeze({
    contract: "V1_STUDY_DELIVERABLE_PORTFOLIO",
    contractVersion: STUDY_DELIVERABLE_PORTFOLIO_VERSION,
    portfolioId,
    projectRef: manifest.project,
    generatedAt: input.generatedAt,
    owner: "DOC-001",
    artifacts: Object.freeze(artifacts),
    manifest,
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  });
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  bytes.forEach((byte) => { crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8); });
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (value: string) => {
  const date = new Date(value);
  const year = Math.max(1980, date.getUTCFullYear());
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
};

const concatBytes = (parts: readonly Uint8Array[]) => {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  parts.forEach((part) => { output.set(part, offset); offset += part.length; });
  return output;
};

const zipHeader = (length: number) => new Uint8Array(length);
const write16 = (target: Uint8Array, offset: number, value: number) => new DataView(target.buffer).setUint16(offset, value, true);
const write32 = (target: Uint8Array, offset: number, value: number) => new DataView(target.buffer).setUint32(offset, value, true);

export const buildStudyPackageZipBytes = (portfolio: Readonly<StudyDeliverablePortfolio>): Uint8Array => {
  const encoder = new TextEncoder();
  const files = [
    ...portfolio.artifacts.flatMap((artifact) => artifact.files),
    { fileName: "manifest.json", format: "JSON" as const, mimeType: "application/json;charset=utf-8", content: JSON.stringify(portfolio.manifest, null, 2) },
  ];
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  const stamp = dosDateTime(portfolio.generatedAt);
  files.forEach((file) => {
    const name = encoder.encode(file.fileName);
    const content = encoder.encode(file.content);
    const crc = crc32(content);
    const local = zipHeader(30 + name.length);
    write32(local, 0, 0x04034b50); write16(local, 4, 20); write16(local, 6, 0x0800); write16(local, 8, 0);
    write16(local, 10, stamp.time); write16(local, 12, stamp.date); write32(local, 14, crc); write32(local, 18, content.length); write32(local, 22, content.length); write16(local, 26, name.length); write16(local, 28, 0); local.set(name, 30);
    localParts.push(local, content);
    const central = zipHeader(46 + name.length);
    write32(central, 0, 0x02014b50); write16(central, 4, 20); write16(central, 6, 20); write16(central, 8, 0x0800); write16(central, 10, 0);
    write16(central, 12, stamp.time); write16(central, 14, stamp.date); write32(central, 16, crc); write32(central, 20, content.length); write32(central, 24, content.length); write16(central, 28, name.length); write16(central, 30, 0); write16(central, 32, 0); write16(central, 34, 0); write16(central, 36, 0); write32(central, 38, 0); write32(central, 42, localOffset); central.set(name, 46);
    centralParts.push(central);
    localOffset += local.length + content.length;
  });
  const centralDirectory = concatBytes(centralParts);
  const end = zipHeader(22);
  write32(end, 0, 0x06054b50); write16(end, 4, 0); write16(end, 6, 0); write16(end, 8, files.length); write16(end, 10, files.length); write32(end, 12, centralDirectory.length); write32(end, 16, localOffset); write16(end, 20, 0);
  return concatBytes([...localParts, centralDirectory, end]);
};

export const buildStudyPackageZip = (portfolio: Readonly<StudyDeliverablePortfolio>): Blob => new Blob(
  [buildStudyPackageZipBytes(portfolio)],
  { type: "application/zip" },
);

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadStudyDeliverableFile = (file: Readonly<StudyDeliverableFile>) => triggerDownload(
  new Blob([file.content], { type: file.mimeType }),
  file.fileName,
);

export const downloadStudyPackage = (portfolio: Readonly<StudyDeliverablePortfolio>) => triggerDownload(
  buildStudyPackageZip(portfolio),
  `noxia-study-package-${slug(portfolio.projectRef.projectId)}-${slug(portfolio.projectRef.projectVersion)}.zip`,
);
