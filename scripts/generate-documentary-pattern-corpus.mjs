import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ENGINE_VERSION = "1.0.0";
const SCHEMA_VERSION = "1.0.0";
const GENERATED_AT = "2026-08-10";
const CATALOG_VERSION = "1.1.0";
const CATALOG_GENERATED_AT = "2026-09-04";
const PRIOR_CATALOG_ID = "DKC-DFA1F2EDD8B6";
const PRIOR_CATALOG_DIGEST = "doc2-badbdb3301dcc35f";
const LEGACY_PATTERN_COUNT = 120;
const LEGACY_PATTERN_IDS_SHA256 = "c02dba6b6c561ed94f47911394ca86a53fc5294e95ff41faf5ef8350718e081e";
const LEGACY_PATTERN_RECORDS_SHA256 = "2e6ee2ba37b555f1d3b9f115673124a3f60a34048ea16a9f08ffd996774af0bd";
const OUTPUT_ROOT = path.resolve(process.cwd(), "documentary-pattern-corpus/doc-002");
const REFERENCE_CLOSURE_PATH = path.resolve(process.cwd(), "reference-corpus/reference-corpus-01/documentary-evidence-closure-01.json");
const REFERENCE_CLOSURE_ARTIFACT_PATH = "reference-corpus/reference-corpus-01/documentary-evidence-closure-01.json";
const sourceArg = process.argv.find((item) => item.startsWith("--source-root="));
const SOURCE_ROOT = path.resolve(sourceArg ? sourceArg.slice("--source-root=".length) : path.join(process.cwd(), "../docs-audit"));
const CHECK_ONLY = process.argv.includes("--check");

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => [key, canonicalize(item)]));
  return value;
};
const stableStringify = (value) => JSON.stringify(canonicalize(value));
const logicalDigest = (value) => {
  const input = stableStringify(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return `doc2-${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalize = (value) => String(value ?? "").normalize("NFKC").replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
const comparable = (value) => normalize(value).toLocaleLowerCase("fr-FR");
const slug = (value) => comparable(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const uniqueSorted = (values) => [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))].sort((left, right) => left.localeCompare(right));
const patternId = (key) => `DKP-${logicalDigest(comparable(key)).slice(5, 17).toUpperCase()}`;
const factId = (sourceId, key) => `DKF-${logicalDigest([sourceId, comparable(key)]).slice(5, 17).toUpperCase()}`;
const relationId = (fromId, type, toId) => `DKR-${logicalDigest([fromId, type, toId]).slice(5, 17).toUpperCase()}`;

const allowedRelativeSources = new Set([
  "_audit/10-reusable-knowledge-candidates.csv",
  "_audit/11-study-lifecycle-map.md",
  "_audit/13-document-corpus-audit-report.md",
  "_audit/doc-000b-r1-computerized-systems-validation.md",
  "_audit/doc-000b-r1-study-tracking.md",
  "_audit/doc-000c-documentary-closure-review.md",
  "_audit/doc-000c-final-corpus-status.md",
  "_audit/corelab-patterns.json",
  "_audit/corelab-workflows.json",
  "_audit/corelab-fda-comparison.md",
  "_audit/doc-000d-corelab-operational-corpus-report.md",
  "_intelligence/_document-patterns.md",
  "_intelligence/_document-reusable-structures.md",
  "_intelligence/_document-variants.md",
]);

const sourceDefinitions = [
  ["SRC-DOC000A-CANDIDATES", "DOC-000A", "_audit/10-reusable-knowledge-candidates.csv", "1.0", "DERIVED_AUDIT"],
  ["SRC-DOC000A-LIFECYCLE", "DOC-000A", "_audit/11-study-lifecycle-map.md", "1.0", "DERIVED_AUDIT"],
  ["SRC-DOC000A-REPORT", "DOC-000A", "_audit/13-document-corpus-audit-report.md", "1.0", "DERIVED_AUDIT"],
  ["SRC-DOC000B-R1-VALIDATION", "DOC-000B-R1", "_audit/doc-000b-r1-computerized-systems-validation.md", "1.0", "DERIVED_INTELLIGENCE"],
  ["SRC-DOC000B-R1-TRACKING", "DOC-000B-R1", "_audit/doc-000b-r1-study-tracking.md", "1.0", "DERIVED_INTELLIGENCE"],
  ["SRC-DOC000B-PATTERNS", "DOC-000B", "_intelligence/_document-patterns.md", "1.0", "DERIVED_INTELLIGENCE"],
  ["SRC-DOC000B-STRUCTURES", "DOC-000B", "_intelligence/_document-reusable-structures.md", "1.0", "DERIVED_INTELLIGENCE"],
  ["SRC-DOC000B-VARIANTS", "DOC-000B", "_intelligence/_document-variants.md", "1.0", "DERIVED_INTELLIGENCE"],
  ["SRC-DOC000C-CLOSURE", "DOC-000C", "_audit/doc-000c-documentary-closure-review.md", "1.0", "DERIVED_AUDIT"],
  ["SRC-DOC000C-STATUS", "DOC-000C", "_audit/doc-000c-final-corpus-status.md", "1.0", "DERIVED_AUDIT"],
  ["SRC-DOC000D-PATTERNS", "DOC-000D", "_audit/corelab-patterns.json", "1.1", "DERIVED_OPERATIONAL_CORPUS"],
  ["SRC-DOC000D-WORKFLOWS", "DOC-000D", "_audit/corelab-workflows.json", "1.1", "DERIVED_OPERATIONAL_CORPUS"],
  ["SRC-DOC000D-FDA", "DOC-000D", "_audit/corelab-fda-comparison.md", "1.1", "EXTERNAL_COMPARISON"],
  ["SRC-DOC000D-REPORT", "DOC-000D", "_audit/doc-000d-corelab-operational-corpus-report.md", "1.1", "DERIVED_OPERATIONAL_CORPUS"],
];

const readSource = async (relativePath) => {
  if (!allowedRelativeSources.has(relativePath) || relativePath.includes("99_excluded") || relativePath.endsWith(".tar")) throw new Error(`RAW_OR_UNAUTHORISED_SOURCE:${relativePath}`);
  return readFile(path.join(SOURCE_ROOT, relativePath), "utf8");
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(value); value = ""; }
    else if (character === "\n") { row.push(value.replace(/\r$/, "")); rows.push(row); row = []; value = ""; }
    else value += character;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const header = rows.shift();
  return rows.filter((item) => item.length === header.length).map((item) => Object.fromEntries(header.map((key, index) => [key, item[index]])));
};

const parseMarkdownTables = (text) => {
  const lines = text.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].startsWith("|") || !/^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[index + 1])) continue;
    const parseRow = (line) => line.slice(1, -1).split("|").map((cell) => normalize(cell));
    const headers = parseRow(lines[index]);
    const rows = [];
    index += 2;
    while (index < lines.length && lines[index].startsWith("|")) {
      const cells = parseRow(lines[index]);
      rows.push(Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""])));
      index += 1;
    }
    tables.push({ headers, rows });
  }
  return tables;
};

const sanitize = (value) => normalize(value)
  .replace(/\bCARIM\b/gi, "la source locale")
  .replace(/\b(?:Siemens|Skyra|Philips|GE Healthcare)\b/gi, "la plateforme observée")
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:mg|ml|mm|ms|kv|ma|bpm|tesla)\b/gi, "[valeur contextuelle non réutilisée]");

const categoryForCoreType = (type) => {
  if (/Acquisition|Positioning|Timing|Sequence|Parameter/.test(type)) return "Acquisition";
  if (/Reader|Reading|Adjudication/.test(type)) return "CoreLab";
  if (/Quality|Artefact|Calibration/.test(type)) return "Quality";
  if (/Equipment/.test(type)) return "Equipment";
  if (/Transfer|Anonymization|Inventory|DataDictionary|CRF|Restricted/.test(type)) return "Data";
  if (/Monitoring|Feedback/.test(type)) return "Monitoring";
  if (/Deviation/.test(type)) return "Deviation";
  if (/Training/.test(type)) return "Training";
  if (/Troubleshooting/.test(type)) return "Troubleshooting";
  if (/ImagingCharter/.test(type)) return "Imaging";
  if (/Site|CoreLab/.test(type)) return "CoreLab";
  return "Imaging";
};

const categoryForLabel = (label) => {
  const text = comparable(label);
  if (/validation|test|anomal/.test(text)) return "Validation";
  if (/decision|approval|signature/.test(text)) return "Human Decision";
  if (/risk|risque/.test(text)) return "Risk";
  if (/quality|qualite|finding|action/.test(text)) return "Quality";
  if (/data|variable|crf|fair|metadata|dictionary/.test(text)) return "Data";
  if (/monitor|tracking|milestone|deadline/.test(text)) return "Monitoring";
  if (/budget|cost|cout|funding/.test(text)) return "Funding";
  if (/communication/.test(text)) return "Communication";
  if (/training|formation/.test(text)) return "Training";
  if (/regulatory|soumission|consent/.test(text)) return "Regulatory Interaction";
  if (/equipment|site capability/.test(text)) return "Equipment";
  if (/workflow|logigramme|lifecycle/.test(text)) return "Workflow";
  if (/review|revue/.test(text)) return "Review";
  if (/project|study/.test(text)) return "Project";
  return "Document Structure";
};

const makeEvidence = ({ evidenceId, sourceId, locator, observation, sourceDocumentRefs = [], familyRef = null, projectRef = null, institutionRef = null, factId: extractedFactId }) => ({
  evidenceId,
  sourceId,
  locator,
  observation: sanitize(observation),
  sourceDocumentRefs: uniqueSorted(sourceDocumentRefs),
  familyRef,
  projectRef,
  institutionRef,
  extractedFactIds: [extractedFactId],
});

const makeFact = (input) => ({
  factId: factId(input.sourceIds.join("|"), input.behaviorKey),
  behaviorKey: input.behaviorKey,
  name: sanitize(input.name),
  description: sanitize(input.description),
  category: input.category,
  origin: input.origin,
  scope: sanitize(input.scope ?? "Contexte documentaire à qualifier"),
  inputs: uniqueSorted((input.inputs ?? []).map(sanitize)),
  actions: (input.actions ?? []).map(sanitize).filter(Boolean),
  outputs: uniqueSorted((input.outputs ?? []).map(sanitize)),
  evidence: [],
  variants: [],
  limitations: uniqueSorted((input.limitations ?? []).map(sanitize)),
  sourceIds: uniqueSorted(input.sourceIds),
  extractedAt: input.extractedAt ?? GENERATED_AT,
  relatedBehaviorKeys: input.relatedBehaviorKeys ?? [],
});

const splitPipe = (value) => String(value ?? "").split("|").map(sanitize).filter(Boolean);

const coreRelationMap = {
  "CLP-007": [["PRECEDES", "CLP-008", "Le contrôle de réception précède le contrôle qualité détaillé."]],
  "CLP-008": [["REQUIRES", "CLP-007", "Le contrôle qualité suppose une réception traçable."], ["PRECEDES", "CLP-009", "Le QC documenté précède la décision d’interprétabilité."]],
  "CLP-009": [["FOLLOWS", "CLP-008", "La décision d’interprétabilité suit l’évaluation technique."]],
  "CLP-013": [["REQUIRES", "CLP-014", "Le profil de qualification inclut une formation et son maintien."]],
  "CLP-015": [["OPTIONALLY_REQUIRES", "CLP-012", "L’adjudication peut dépendre du plan de lecture préspecifié."]],
  "CLP-016": [["PRECEDES", "CLP-007", "Le transfert documenté précède la réception et son rapprochement."]],
  "CLP-017": [["PRECEDES", "CLP-016", "La dé-identification gouvernée précède le transfert autorisé."]],
  "CLP-020": [["DEPENDS_ON", "CLP-019", "La compatibilité est évaluée à partir d’un profil d’équipement daté."]],
  "CLP-021": [["REQUIRES", "CLP-020", "La qualification du site requiert une compatibilité étayée."]],
  "CLP-022": [["USES", "CLP-023", "Le monitoring utilise les déviations et leurs statuts sans les clôturer automatiquement."]],
  "CLP-024": [["GENERALIZES", "CLP-007", "Le cycle Core Lab contient le contrôle de réception comme sous-comportement."], ["COMPLEMENTS", "CLP-025", "Le cycle opérationnel et la charte structurée sont complémentaires."]],
  "CLP-025": [["SPECIALIZES", "CLP-024", "La charte explicite une projection structurée du cycle Core Lab."]],
  "CLP-026": [["CONSUMES", "CLP-008", "Le CRF d’imagerie consomme le statut QC sans le recalculer."], ["CONSUMES", "CLP-009", "Le CRF transporte la décision d’interprétabilité."]],
  "CLP-031": [["REQUIRES", "CLP-021", "L’activation du site requiert une qualification documentée."]],
  "CLP-032": [["FOLLOWS", "CLP-008", "La boucle de retour est déclenchée après un finding QC."], ["PRODUCES", "CLP-023", "Une action non résolue peut produire une déviation tracée."]],
  "CLP-033": [["COMPLEMENTS", "CLP-026", "Le dictionnaire qualifie les variables transportées par le CRF d’imagerie."]],
  "CLP-034": [["COMPLEMENTS", "CLP-017", "La frontière source-connaissance complète la dé-identification sans la remplacer."]],
};

const buildSourceCatalog = async () => {
  const explicitPaths = new Set(sourceDefinitions.map((item) => item[2]));
  const discovered = [];
  for (const directory of ["_audit", "_intelligence"]) {
    const entries = await readdir(path.join(SOURCE_ROOT, directory), { withFileTypes: true });
    for (const entry of entries) {
      const artifactPath = `${directory}/${entry.name}`;
      if (!entry.isFile() || explicitPaths.has(artifactPath) || !/\.(?:csv|json|md|txt)$/i.test(entry.name) || /restricted.*\.tar$/i.test(entry.name)) continue;
      allowedRelativeSources.add(artifactPath);
      discovered.push([
        `SRC-INTEGRITY-${logicalDigest(artifactPath).slice(5, 17).toUpperCase()}`,
        "DOC-000-DERIVED-INTEGRITY",
        artifactPath,
        "2026-08-10-snapshot",
        directory === "_audit" ? "DERIVED_AUDIT" : "DERIVED_INTELLIGENCE",
      ]);
    }
  }
  return Promise.all([...sourceDefinitions, ...discovered].map(async ([sourceId, corpusId, artifactPath, artifactVersion, sourceKind]) => {
    const content = await readSource(artifactPath);
    return { sourceId, corpusId, artifactPath, artifactVersion, artifactDigest: sha256(content), sourceKind, authorityBoundary: "EVIDENCE_ONLY_NOT_AUTHORITY" };
  }));
};

const buildReferenceEvidenceSources = (closure) => {
  const retrievalByArtifact = new Map(closure.RETRIEVAL_EVIDENCE.map((item) => [item.ARTIFACT_ID, item]));
  const relationshipsByArtifact = (artifactId) => closure.RELATIONSHIPS
    .filter((item) => item.FROM_ARTIFACT_ID === artifactId || item.TO_ARTIFACT_ID === artifactId)
    .map((item) => ({
      relationType: item.RELATION_TYPE,
      fromArtifactId: item.FROM_ARTIFACT_ID,
      toArtifactId: item.TO_ARTIFACT_ID,
      linkageConfidence: item.LINKAGE_CONFIDENCE,
      linkageSource: item.LINKAGE_SOURCE,
    }));
  const versionRelationshipsBySource = (sourceId) => closure.VERSION_RELATIONSHIPS
    .filter((item) => item.EVIDENCE_SOURCE_ID === sourceId)
    .map((item) => ({ from: item.FROM, to: item.TO, relation: item.RELATION, confidence: item.CONFIDENCE }));

  return closure.ARTIFACTS.map((artifact) => {
    const retrievalEvidence = retrievalByArtifact.get(artifact.ARTIFACT_ID) ?? null;
    const artifactRelationships = relationshipsByArtifact(artifact.ARTIFACT_ID);
    const versionRelationships = versionRelationshipsBySource(artifact.SOURCE_ID);
    const evidenceEnvelope = { artifact, retrievalEvidence, artifactRelationships, versionRelationships };
    return {
      sourceId: artifact.SOURCE_ID,
      corpusId: "REFERENCE-CORPUS-01",
      artifactPath: REFERENCE_CLOSURE_ARTIFACT_PATH,
      artifactVersion: artifact.VERSION,
      artifactDigest: sha256(stableStringify(evidenceEnvelope)),
      artifactDigestScope: "METADATA_AND_AUTHORIZED_DERIVED_EVIDENCE_ONLY",
      sourceKind: "REFERENCE_CORPUS_DERIVED_EVIDENCE",
      authorityBoundary: "EVIDENCE_ONLY_NOT_AUTHORITY",
      referenceSourceId: artifact.SOURCE_ID,
      artifactId: artifact.ARTIFACT_ID,
      platformTrialId: artifact.PLATFORM_TRIAL_ID || null,
      studyId: artifact.STUDY_ID,
      artifactType: artifact.ARTIFACT_TYPE,
      title: artifact.TITLE,
      artifactDate: artifact.DATE,
      officialUrl: artifact.OFFICIAL_URL,
      retrievedAt: artifact.RETRIEVAL_DATE,
      currentOrHistoricalStatus: artifact.CURRENT_OR_HISTORICAL_STATUS,
      contentAvailabilityState: artifact.CONTENT_READINESS_STATE,
      rights: {
        publiclyAccessible: artifact.PUBLICLY_ACCESSIBLE,
        localStorageAllowed: artifact.LOCAL_STORAGE_ALLOWED,
        repositoryCommitAllowed: artifact.REPOSITORY_COMMIT_ALLOWED,
        derivedPatternAnalysisAllowed: artifact.DERIVED_PATTERN_ANALYSIS_ALLOWED,
        redistributionAllowed: artifact.REDISTRIBUTION_ALLOWED,
      },
      contentEvidence: retrievalEvidence ? {
        inspected: retrievalEvidence.DOCUMENTARY_CONTENT_INSPECTED,
        minimalDocumentStructure: retrievalEvidence.MINIMAL_DOCUMENT_STRUCTURE,
        verifiedSectionOrThemeReferences: retrievalEvidence.VERIFIED_SECTION_OR_THEME_REFERENCES,
        paginationOrStableSectionIdentifiers: retrievalEvidence.PAGINATION_OR_STABLE_SECTION_IDENTIFIERS,
        transientBinarySha256: retrievalEvidence.TRANSIENT_BINARY_SHA256,
        reproducibilityLimitations: retrievalEvidence.REPRODUCIBILITY_LIMITATIONS,
      } : null,
      artifactRelationships,
      versionRelationships,
      limitations: artifact.UNCERTAINTIES,
    };
  });
};

const buildFacts = async (referenceClosure) => {
  const facts = [];
  const core = JSON.parse(await readSource("_audit/corelab-patterns.json"));
  const coreKeyById = new Map(core.patterns.map((item) => [item.patternId, `doc000d:${item.type}:${slug(item.name)}`]));
  core.patterns.forEach((item) => {
    const behaviorKey = coreKeyById.get(item.patternId);
    const fact = makeFact({
      behaviorKey,
      name: item.name,
      description: item.rationale,
      category: categoryForCoreType(item.type),
      origin: "LOCAL_PRACTICE",
      scope: item.scope,
      inputs: splitPipe(item.inputs),
      actions: splitPipe(item.steps),
      outputs: splitPipe(item.outputs),
      limitations: [item.limitations, item.prohibitions, "Pratique locale candidate; aucune valeur, plateforme ou procédure d’étude n’est réutilisée."],
      sourceIds: ["SRC-DOC000D-PATTERNS", "SRC-DOC000D-REPORT"],
      relatedBehaviorKeys: (coreRelationMap[item.patternId] ?? []).map(([type, targetId, rationale]) => ({ type, targetBehaviorKey: coreKeyById.get(targetId), rationale })),
    });
    const evidenceId = `DKE-${item.patternId}`;
    fact.evidence = [makeEvidence({
      evidenceId,
      sourceId: "SRC-DOC000D-PATTERNS",
      locator: `patterns/${item.patternId}`,
      observation: `Structure opérationnelle abstraite ${item.type}; statut source CANDIDATE_ONLY.`,
      sourceDocumentRefs: splitPipe(item.sourceDocumentIds),
      familyRef: item.type,
      factId: fact.factId,
    })];
    fact.variants = [{
      variantId: `DKV-${item.patternId}`,
      name: "Variante locale observée",
      description: sanitize(item.scope),
      applicability: "Sélection explicite selon le projet, le site et la modalité; aucun héritage silencieux.",
      kind: "LOCAL_VARIANT",
      evidenceIds: [evidenceId],
      limitations: [sanitize(item.limitations), "La variante ne vaut ni standard ni configuration par défaut."],
    }];
    facts.push(fact);
  });

  const patternsText = await readSource("_intelligence/_document-patterns.md");
  const patternTables = parseMarkdownTables(patternsText);
  for (const table of patternTables.filter((item) => item.headers[0] === "Pattern")) {
    for (const row of table.rows) {
      const label = row.Pattern;
      if (!label) continue;
      const sourceId = row["Observation du corpus"] ? "SRC-DOC000B-PATTERNS" : "SRC-DOC000B-R1-VALIDATION";
      const behaviorKey = `doc000b:observed:${slug(label)}`;
      const fact = makeFact({
        behaviorKey,
        name: label,
        description: row["Interprétation autorisée"] || row.Limite || "Structure de travail observée dans le corpus documentaire.",
        category: categoryForLabel(label),
        origin: row.Classe?.includes("LOCAL_PRACTICE") ? "LOCAL_PRACTICE" : "DOCUMENTARY_CORPUS",
        inputs: [],
        actions: ["Conserver la structure", "Qualifier le contexte", "Soumettre toute décision à l’owner humain"],
        outputs: ["Pattern documentaire contextualisé"],
        limitations: [row["Interprétation interdite"] || row.Limite || "Aucune généralisation ni validation implicite."],
        sourceIds: [sourceId],
      });
      const evidenceId = `DKE-${logicalDigest([sourceId, label]).slice(5, 17).toUpperCase()}`;
      fact.evidence = [makeEvidence({
        evidenceId,
        sourceId,
        locator: `table:${slug(label)}`,
        observation: row["Observation du corpus"] || row.Preuve || "Pattern dérivé candidat.",
        sourceDocumentRefs: row.Preuve ? [row.Preuve] : ["DOC-000B-DERIVED-OBSERVATION"],
        familyRef: row.Classe || "TRANSVERSAL_DOCUMENT_PATTERN",
        factId: fact.factId,
      })];
      facts.push(fact);
    }
  }

  const structuresText = await readSource("_intelligence/_document-reusable-structures.md");
  const structureTables = parseMarkdownTables(structuresText);
  for (const table of structureTables.filter((item) => ["Composant", "Structure réutilisable candidate"].includes(item.headers[0]))) {
    for (const row of table.rows) {
      const label = row.Composant || row["Structure réutilisable candidate"];
      if (!label) continue;
      const behaviorKey = `doc000b:structure:${slug(label)}`;
      const sourceId = row.Composant ? "SRC-DOC000B-STRUCTURES" : "SRC-DOC000B-R1-VALIDATION";
      const fact = makeFact({
        behaviorKey,
        name: label,
        description: `Structure documentaire candidate composée de ${row["Champs minimaux"] || row["Composants minimaux"] || "champs explicitement sourcés"}.`,
        category: categoryForLabel(label),
        origin: "DOCUMENTARY_CORPUS",
        inputs: splitPipe((row["Champs minimaux"] || row["Composants minimaux"] || "").replaceAll(";", "|")),
        actions: ["Renseigner les champs applicables", "Conserver la provenance", "Router la revue vers le propriétaire du sens"],
        outputs: ["Bloc documentaire traçable"],
        limitations: [row["Conditions d’admission future"] || row.Statut || "CANDIDATE_ONLY", `Le sens reste détenu par ${row["Owner du sens"] || row["Ownership de substance"] || "le propriétaire de domaine et la décision humaine"}.`],
        sourceIds: [sourceId],
      });
      const evidenceId = `DKE-${logicalDigest([sourceId, label]).slice(5, 17).toUpperCase()}`;
      fact.evidence = [makeEvidence({ evidenceId, sourceId, locator: `structure:${slug(label)}`, observation: "Structure réutilisable candidate, sans statut officiel.", sourceDocumentRefs: ["DOC-000B-STRUCTURE-MAP"], familyRef: "REUSABLE_STRUCTURE", factId: fact.factId })];
      facts.push(fact);
    }
  }

  const variantsText = await readSource("_intelligence/_document-variants.md");
  const variantTables = parseMarkdownTables(variantsText);
  const dimensionTable = variantTables.find((item) => item.headers[0] === "Dimension");
  if (dimensionTable) {
    const behaviorKey = "doc000b:variant:explicit-context-resolution";
    const fact = makeFact({
      behaviorKey,
      name: "Résolution explicite des variantes documentaires",
      description: "Les dimensions de contexte modifient la forme documentaire sans autoriser l’héritage silencieux d’une pratique.",
      category: "Decision",
      origin: "DOCUMENTARY_CORPUS",
      inputs: ["Dimensions actives", "Preuves de contexte", "Owner de qualification"],
      actions: ["Établir les dimensions actives", "Identifier les champs affectés", "Conserver les alternatives", "Enregistrer la décision humaine de profil"],
      outputs: ["Profil de variante traçable"],
      limitations: ["Une variante observée ne devient ni cible ni valeur par défaut.", "Le fichier le plus récent ne prouve pas la succession."],
      sourceIds: ["SRC-DOC000B-VARIANTS"],
    });
    const evidenceId = "DKE-DOC000B-VARIANT-DIMENSIONS";
    fact.evidence = [makeEvidence({ evidenceId, sourceId: "SRC-DOC000B-VARIANTS", locator: "dimensions-de-variation", observation: "Dimensions de variation observées et règles de non-généralisation.", sourceDocumentRefs: ["DOC-000B-VARIANT-MAP"], familyRef: "VARIANT_DIMENSIONS", factId: fact.factId })];
    fact.variants = dimensionTable.rows.map((row) => ({
      variantId: `DKV-${logicalDigest(row.Dimension).slice(5, 17).toUpperCase()}`,
      name: sanitize(row.Dimension),
      description: sanitize(row["Effets documentaires attendus"]),
      applicability: `Qualification par ${sanitize(row["Owners de qualification"])}`,
      kind: "UNRESOLVED_VARIANT",
      evidenceIds: [evidenceId],
      limitations: [sanitize(row.Interdiction)],
    }));
    facts.push(fact);
  }

  const candidateRows = parseCsv(await readSource("_audit/10-reusable-knowledge-candidates.csv"));
  candidateRows.forEach((row) => {
    const family = /classés\s+([0-9]{2}_[A-Z_]+)/.exec(row.statement)?.[1] ?? row.candidate_id;
    const behaviorKey = `doc000a:family:${comparable(family)}`;
    const label = family.replace(/^\d+_/, "").replaceAll("_", " ").toLocaleLowerCase("fr-FR");
    const fact = makeFact({
      behaviorKey,
      name: `Structure documentaire récurrente — ${label}`,
      description: `La famille ${label} apparaît comme structure de travail récurrente à contextualiser et à revoir.`,
      category: categoryForLabel(label),
      origin: "DOCUMENTARY_CORPUS",
      inputs: ["Document de la famille", "Contexte", "Statut et version prouvés"],
      actions: ["Qualifier l’applicabilité", "Vérifier le statut", "Conserver l’historique et la revue humaine"],
      outputs: ["Structure candidate contextualisée"],
      limitations: ["La fréquence ne vaut ni norme, ni actualité, ni approbation.", "La source représentative ne démontre pas à elle seule une pratique générale."],
      sourceIds: ["SRC-DOC000A-CANDIDATES", "SRC-DOC000A-REPORT"],
    });
    const evidenceId = `DKE-${row.candidate_id}`;
    fact.evidence = [makeEvidence({
      evidenceId,
      sourceId: "SRC-DOC000A-CANDIDATES",
      locator: row.candidate_id,
      observation: `Récurrence documentaire déclarée pour la famille ${family}; statut source CANDIDATE_ONLY.`,
      sourceDocumentRefs: [row.source_document].filter(Boolean),
      familyRef: family,
      factId: fact.factId,
    })];
    facts.push(fact);
  });

  const lifecycleKey = "doc000a:workflow:descriptive-study-lifecycle";
  const lifecycleFact = makeFact({
    behaviorKey: lifecycleKey,
    name: "Cycle documentaire descriptif avec retours",
    description: "Le corpus observe une séquence de travail comportant des branches, reprises et activités transversales de qualité, risque, formation et décision humaine.",
    category: "Workflow",
    origin: "HISTORICAL_REFERENCE",
    inputs: ["État du projet", "Documents et décisions disponibles"],
    actions: ["Situer la phase observée", "Conserver les branches et reprises", "Tracer les remises aux phases aval"],
    outputs: ["Vue descriptive du cycle documentaire"],
    limitations: ["Cette séquence n’est ni un workflow NOXIA officiel ni une règle réglementaire.", "Aucune transition automatique n’est déduite."],
    sourceIds: ["SRC-DOC000A-LIFECYCLE"],
  });
  lifecycleFact.evidence = [makeEvidence({ evidenceId: "DKE-DOC000A-LIFECYCLE", sourceId: "SRC-DOC000A-LIFECYCLE", locator: "sequence-observee", observation: "Séquence descriptive et exceptions non linéaires explicitement conservées.", sourceDocumentRefs: ["DOC-000A-LIFECYCLE-MAP"], familyRef: "STUDY_LIFECYCLE", factId: lifecycleFact.factId })];
  facts.push(lifecycleFact);

  const externalKey = "doc000d:boundary:external-guidance-separated-from-local-practice";
  const externalFact = makeFact({
    behaviorKey: externalKey,
    name: "Séparation d’une référence externe et d’une pratique locale",
    description: "Une comparaison de domaines peut exposer convergences et écarts sans convertir la référence externe en règle locale ni la pratique locale en conformité.",
    category: "Regulatory Interaction",
    origin: "EXTERNAL_REFERENCE",
    inputs: ["Référence externe", "Observation locale distincte"],
    actions: ["Comparer les domaines", "Conserver la portée de chaque source", "Exposer les écarts et décisions requises"],
    outputs: ["Carte de comparaison sans promotion d’autorité"],
    limitations: ["Aucune conformité réglementaire n’est conclue.", "Aucune procédure locale n’est approuvée par rapprochement documentaire."],
    sourceIds: ["SRC-DOC000D-FDA"],
    relatedBehaviorKeys: [{ type: "COEXISTS_WITH", targetNodeId: "REG-000:REQUIREMENT_REFERENCE", rationale: "Une exigence réglementaire ne peut être apportée que par REG-000/REG-001 et reste distincte du pattern documentaire." }],
  });
  externalFact.evidence = [makeEvidence({ evidenceId: "DKE-DOC000D-EXTERNAL-SEPARATION", sourceId: "SRC-DOC000D-FDA", locator: "regle-de-separation", observation: "La comparaison sépare explicitement référence externe, observation locale et décision humaine requise.", sourceDocumentRefs: ["CLD-0021"], familyRef: "EXTERNAL_COMPARISON", factId: externalFact.factId })];
  facts.push(externalFact);

  const protocolFact = makeFact({
    behaviorKey: "doc000b:structure:contextual-protocol-with-conditional-blocks",
    name: "Structure de protocole contextualisée",
    description: "Des sections communes peuvent être organisées avec des blocs conditionnels et des variantes explicites sans devenir un modèle scientifique universel.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    inputs: ["Sections communes observées", "Dimensions de variante", "Provenance des blocs"],
    actions: ["Identifier les sections communes", "Qualifier les blocs conditionnels", "Conserver les variantes non sélectionnées", "Tracer la source de chaque bloc"],
    outputs: ["Structure documentaire candidate avec variantes"],
    limitations: ["La structure ne choisit ni méthode, ni paramètre, ni contenu scientifique.", "Aucune variante n’est héritée silencieusement."],
    sourceIds: ["SRC-DOC000B-PATTERNS", "SRC-DOC000B-VARIANTS", "SRC-DOC000A-CANDIDATES"],
  });
  const protocolEvidenceA = "DKE-DOC000B-PROTOCOL-STRUCTURE";
  const protocolEvidenceB = "DKE-DOC000B-PROTOCOL-VARIANTS";
  protocolFact.evidence = [
    makeEvidence({ evidenceId: protocolEvidenceA, sourceId: "SRC-DOC000B-PATTERNS", locator: "protocol-structure", observation: "Structures de protocoles et composants transversaux observés dans le corpus dérivé.", sourceDocumentRefs: ["DOC-000B-PROTOCOL-FAMILY"], familyRef: "PROTOCOL", factId: protocolFact.factId }),
    makeEvidence({ evidenceId: protocolEvidenceB, sourceId: "SRC-DOC000B-VARIANTS", locator: "protocol-variants", observation: "Variantes de protocole explicitement qualifiées par contexte.", sourceDocumentRefs: ["DOC-000B-VARIANT-MAP"], familyRef: "VARIANT_DIMENSIONS", factId: protocolFact.factId }),
  ];
  protocolFact.variants = [
    { variantId: "DKV-PROTOCOL-OBSERVED", name: "Structure observée", description: "Sections réellement observées, sans promotion normative.", applicability: "Contexte source démontré", kind: "OBSERVED_VARIANT", evidenceIds: [protocolEvidenceA], limitations: ["Ne prouve ni complétude ni actualité."] },
    { variantId: "DKV-PROTOCOL-UNRESOLVED", name: "Bloc conditionnel", description: "Bloc dont l’applicabilité dépend d’une dimension de projet non résolue.", applicability: "Décision explicite de l’owner requise", kind: "UNRESOLVED_VARIANT", evidenceIds: [protocolEvidenceB], limitations: ["Aucune sélection automatique."] },
  ];
  facts.push(protocolFact);

  const editorialFact = makeFact({
    behaviorKey: "doc000b:editorial:explicit-commitment-level",
    name: "Niveau d’engagement documentaire explicite",
    description: "Une même information doit conserver son niveau d’engagement — observation, candidat, limite, décision ou élément rejeté — sans mémoriser ni reproduire les formulations originales.",
    category: "Editorial",
    origin: "DOCUMENTARY_CORPUS",
    inputs: ["Information sourcée", "Contexte", "Statut démontré"],
    actions: ["Qualifier le niveau d’engagement", "Séparer observation et décision", "Rendre la limite visible"],
    outputs: ["Formulation prudente et reconstructible"],
    limitations: ["Le pattern ne rédige aucun document et n’augmente jamais l’engagement de la source."],
    sourceIds: ["SRC-DOC000B-PATTERNS", "SRC-DOC000B-STRUCTURES"],
  });
  editorialFact.evidence = [
    makeEvidence({ evidenceId: "DKE-DOC000B-EDITORIAL-PATTERN", sourceId: "SRC-DOC000B-PATTERNS", locator: "interpretations-authorisees-interdites", observation: "Le corpus dérivé distingue interprétation autorisée et interprétation interdite pour chaque récurrence.", sourceDocumentRefs: ["DOC-000B-PATTERN-MAP"], familyRef: "EDITORIAL_BOUNDARY", factId: editorialFact.factId }),
    makeEvidence({ evidenceId: "DKE-DOC000B-SOURCE-TRACE", sourceId: "SRC-DOC000B-STRUCTURES", locator: "source-trace-block", observation: "Le bloc de trace conserve origine, preuve, version et limites.", sourceDocumentRefs: ["DOC-000B-STRUCTURE-MAP"], familyRef: "SOURCE_TRACE", factId: editorialFact.factId }),
  ];
  facts.push(editorialFact);

  const addReferenceFact = (input, evidenceSpecs, variants = []) => {
    const fact = makeFact({ ...input, extractedAt: CATALOG_GENERATED_AT });
    fact.evidence = evidenceSpecs.map((item, index) => makeEvidence({
      evidenceId: `DKE-DOC002R-${slug(item.label ?? input.behaviorKey).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
      sourceId: item.sourceId,
      locator: item.locator,
      observation: item.observation,
      sourceDocumentRefs: item.sourceDocumentRefs,
      familyRef: item.familyRef,
      projectRef: item.projectRef,
      institutionRef: item.institutionRef ?? null,
      factId: fact.factId,
    }));
    fact.variants = variants.map((variant) => ({
      ...variant,
      evidenceIds: variant.evidenceIndexes.map((index) => fact.evidence[index].evidenceId),
      evidenceIndexes: undefined,
    }));
    facts.push(fact);
    return fact;
  };

  addReferenceFact({
    behaviorKey: "doc002r:boundary:protocol-specialized-document-detail-allocation",
    name: "Allocation contextualisée du niveau de détail entre protocole et document spécialisé",
    description: "Un protocole peut porter l’engagement de haut niveau tandis qu’un artefact explicitement lié porte un détail de domaine, opérationnel ou analytique; la répartition doit être constatée dans la même étude et ne constitue pas une règle universelle.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Famille documentaire d’une même étude avec liens explicites entre artefacts",
    inputs: ["Identité d’étude", "Protocole ou document maître", "Artefact spécialisé lié", "Version et provenance"],
    actions: ["Vérifier l’identité commune", "Localiser l’engagement de haut niveau", "Localiser le détail spécialisé", "Conserver les limites et versions"],
    outputs: ["Frontière de détail documentaire contextualisée"],
    limitations: ["Aucune famille documentaire n’impose cette répartition à une autre étude.", "L’absence de détail n’est pas interprétée comme un renvoi sans référence explicite."],
    sourceIds: ["RC01-E-060", "RC01-E-076", "RC01-E-081", "RC01-E-085"],
    relatedBehaviorKeys: [
      { type: "COMPLEMENTS", targetBehaviorKey: "doc000b:structure:contextual-protocol-with-conditional-blocks", rationale: "La frontière de détail complète la structure conditionnelle du protocole sans en changer l’owner." },
      { type: "COMPLEMENTS", targetBehaviorKey: "doc002r:classification:explicit-deferral-to-specialized-document", rationale: "Une allocation observée ne devient un report intentionnel que si le renvoi spécialisé est explicite." },
    ],
  }, [
    { label: "detail-step", sourceId: "RC01-E-060", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-001", observation: "Le synopsis de domaine STEP spécialise une vue maître officiellement liée.", sourceDocumentRefs: ["RC01-ART-059", "RC01-ART-060"], familyRef: "MASTER_PROTOCOL_AND_DOMAIN_SYNOPSIS", projectRef: "STEP" },
    { label: "detail-practical", sourceId: "RC01-E-076", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-004", observation: "La famille PRACTICAL sépare les couches maître, domaine et intervention par des artefacts liés.", sourceDocumentRefs: ["RC01-ART-068", "RC01-ART-076", "RC01-ART-077"], familyRef: "MASTER_DOMAIN_INTERVENTION", projectRef: "PRACTICAL" },
    { label: "detail-sprint", sourceId: "RC01-E-081", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-006", observation: "Dans SPRINT, le protocole et le manuel de procédures répartissent contenu directeur et réalisation opérationnelle.", sourceDocumentRefs: ["RC01-ART-078", "RC01-ART-081"], familyRef: "PROTOCOL_AND_PROCEDURE_MANUAL", projectRef: "SPRINT" },
    { label: "detail-orchid", sourceId: "RC01-E-085", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-007", observation: "Dans ORCHID, le protocole, les SOP et le SAP exposent des frontières opérationnelles et analytiques distinctes.", sourceDocumentRefs: ["RC01-ART-082", "RC01-ART-084", "RC01-ART-085"], familyRef: "PROTOCOL_SOP_SAP", projectRef: "ORCHID" },
  ], [
    { variantId: "DKV-DOC002R-DETAIL-STEP", name: "Maître vers domaine STEP", description: "Le domaine lié porte un niveau de détail propre à sa portée.", applicability: "STEP uniquement, selon les artefacts et versions référencés", kind: "OBSERVED_VARIANT", evidenceIndexes: [0], limitations: ["Le protocole maître complet n’est pas stocké localement."] },
    { variantId: "DKV-DOC002R-DETAIL-PRACTICAL", name: "Maître, domaine et intervention PRACTICAL", description: "Des couches documentaires liées spécialisent progressivement le contexte.", applicability: "PRACTICAL uniquement, sans inférer l’activation courante", kind: "OBSERVED_VARIANT", evidenceIndexes: [1], limitations: ["Les documents protégés ne sont ni copiés ni redistribués."] },
    { variantId: "DKV-DOC002R-DETAIL-SPRINT", name: "Protocole et manuel SPRINT", description: "Le manuel porte des éléments opérationnels distincts du protocole.", applicability: "SPRINT uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [2], limitations: ["Aucun DMP autonome n’est établi."] },
    { variantId: "DKV-DOC002R-DETAIL-ORCHID", name: "Protocole, SOP et SAP ORCHID", description: "Les artefacts séparent contenu directeur, procédures et analyse.", applicability: "ORCHID uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [3], limitations: ["Aucun CRF ni DMP autonome n’est établi."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:classification:uninterpreted-documentary-omission",
    name: "Omission documentaire non interprétée",
    description: "Une information absente d’un artefact observé reste une omission non interprétée tant qu’aucun renvoi, motif de report ou statut de non-applicabilité n’est explicitement prouvé.",
    category: "Unknown",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Information attendue ou dimension de variante absente d’un document disponible",
    inputs: ["Artefact observé", "Dimension recherchée", "Documents aval disponibles ou absents", "Preuve de renvoi éventuelle"],
    actions: ["Constater l’absence", "Rechercher un renvoi explicite dans la preuve disponible", "Conserver UNKNOWN si le motif manque"],
    outputs: ["Omission non interprétée avec limite explicite"],
    limitations: ["Une mention de lecture centralisée sans nombre de lecteurs ne prouve pas un report intentionnel.", "L’absence d’un document public ne prouve ni son inexistence ni une décision scientifique."],
    sourceIds: ["SRC-INTEGRITY-C2A679E74CF8", "RC01-E-073"],
    relatedBehaviorKeys: [{ type: "ALTERNATIVE_TO", targetBehaviorKey: "doc002r:classification:explicit-deferral-to-specialized-document", rationale: "L’omission inexpliquée et le report explicitement référencé sont des qualifications distinctes." }],
  }, [
    { label: "omission-corelab", sourceId: "SRC-INTEGRITY-C2A679E74CF8", locator: "document-dependencies:Core Lab Manual", observation: "Le modèle documentaire signale qu’une mention isolée de lecture centralisée ne suffit pas à établir les paramètres du dispositif de lecture.", sourceDocumentRefs: ["DOC-000B-DOCUMENT-DEPENDENCIES", "DOC-000B-VARIANT-MAP"], familyRef: "CORE_LAB_MANUAL", projectRef: null },
    { label: "omission-ispy", sourceId: "RC01-E-073", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-005", observation: "La famille I-SPY relie une ressource d’imagerie à l’étude sans fournir dans le corpus un protocole, un SAP ou une charte d’imagerie complets.", sourceDocumentRefs: ["RC01-ART-071", "RC01-ART-073"], familyRef: "IMAGING_DATA_WITHOUT_FULL_DOCUMENT_CHAIN", projectRef: "I_SPY_2" },
  ], [
    { variantId: "DKV-DOC002R-OMISSION-READER-COUNT", name: "Nombre de lecteurs non documenté", description: "La lecture centralisée est mentionnée mais le nombre de lecteurs n’est pas établi dans les artefacts disponibles.", applicability: "Conserver comme omission non interprétée si aucun document spécialisé lié n’est disponible", kind: "UNRESOLVED_VARIANT", evidenceIndexes: [0], limitations: ["Ne pas qualifier automatiquement cette absence de report intentionnel."] },
    { variantId: "DKV-DOC002R-OMISSION-MISSING-FAMILY", name: "Famille spécialisée non disponible", description: "Une fonction est observable mais son artefact documentaire spécialisé n’est pas accessible dans le corpus.", applicability: "Conserver UNKNOWN et la limite de corpus", kind: "UNRESOLVED_VARIANT", evidenceIndexes: [1], limitations: ["Ne prouve pas que le document n’existe pas hors corpus."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:classification:explicit-deferral-to-specialized-document",
    name: "Report explicite du détail vers un document spécialisé",
    description: "Le détail peut être qualifié de volontairement différé seulement lorsqu’un artefact directeur référence explicitement une couche spécialisée liée et identifiable.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Relations documentaires explicites au sein d’une même étude ou plateforme",
    inputs: ["Artefact directeur", "Référence explicite", "Artefact spécialisé", "Identité d’étude commune"],
    actions: ["Vérifier le lien explicite", "Conserver les identités et versions", "Limiter la qualification à la portée observée"],
    outputs: ["Report intentionnel étayé et contextualisé"],
    limitations: ["Sans référence explicite, appliquer l’omission non interprétée.", "Le pattern ne décide ni le contenu à différer ni sa qualité scientifique."],
    sourceIds: ["RC01-E-060", "RC01-E-075", "RC01-E-077"],
    relatedBehaviorKeys: [{ type: "SPECIALIZES", targetBehaviorKey: "doc002r:boundary:protocol-specialized-document-detail-allocation", rationale: "Le report explicite est une qualification plus stricte que la simple observation d’une frontière de détail." }],
  }, [
    { label: "deferral-step", sourceId: "RC01-E-060", locator: "RELATIONSHIPS/DOMAIN_SPECIALIZES_MASTER/STEP", observation: "La navigation officielle STEP relie la vue maître au synopsis de domaine.", sourceDocumentRefs: ["RC01-ART-059", "RC01-ART-060"], familyRef: "MASTER_TO_DOMAIN", projectRef: "STEP" },
    { label: "deferral-remap", sourceId: "RC01-E-075", locator: "RELATIONSHIPS/DOMAIN_SPECIALIZES_CORE/REMAP_CAP", observation: "La documentation REMAP-CAP relie le protocole cœur aux couches domaine et analyse.", sourceDocumentRefs: ["RC01-ART-062", "RC01-ART-063", "RC01-ART-075"], familyRef: "CORE_TO_DOMAIN_AND_ANALYSIS", projectRef: "REMAP_CAP" },
    { label: "deferral-practical", sourceId: "RC01-E-077", locator: "RELATIONSHIPS/INTERVENTION_APPENDIX_SPECIALIZES_DOMAIN", observation: "La documentation PRACTICAL relie explicitement maître, domaine et annexe d’intervention.", sourceDocumentRefs: ["RC01-ART-068", "RC01-ART-076", "RC01-ART-077"], familyRef: "MASTER_TO_DOMAIN_TO_INTERVENTION", projectRef: "PRACTICAL" },
  ], [
    { variantId: "DKV-DOC002R-DEFERRAL-MASTER-DOMAIN", name: "Renvoi maître vers domaine", description: "La couche maître conserve la portée commune et la couche domaine spécialise le détail.", applicability: "Seulement si le lien maître-domaine est explicite", kind: "OBSERVED_VARIANT", evidenceIndexes: [0, 1, 2], limitations: ["La granularité exacte reste propre à chaque plateforme."] },
    { variantId: "DKV-DOC002R-DEFERRAL-DOMAIN-INTERVENTION", name: "Renvoi domaine vers intervention", description: "Une annexe d’intervention spécialise une couche de domaine déjà liée au maître.", applicability: "Seulement pour la hiérarchie PRACTICAL observée", kind: "OBSERVED_VARIANT", evidenceIndexes: [2], limitations: ["Aucune activation courante n’est déduite."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:propagation:same-study-variable-definition",
    name: "Continuité documentaire des variables au sein d’une même étude",
    description: "Une famille liée peut relier protocole, formulaires et dictionnaire de données pour rendre les variables reconstructibles sans faire d’un document aval la source scientifique du projet.",
    category: "Data",
    origin: "DOCUMENTARY_CORPUS",
    scope: "SPRINT, preuves de même étude Protocol–CRF–Data Dictionary",
    inputs: ["Identité d’étude", "Protocole", "Formulaires", "Dictionnaire de données"],
    actions: ["Préserver les identités d’artefact", "Relier collecte et définition", "Conserver les lacunes de correspondance champ à champ"],
    outputs: ["Lignage documentaire de variable candidat"],
    limitations: ["La correspondance champ à champ n’a pas été adjudiquée.", "Le pattern ne crée ni variable canonique ni décision de collecte."],
    sourceIds: ["RC01-E-078", "RC01-E-079", "RC01-E-080"],
    relatedBehaviorKeys: [
      { type: "COMPLEMENTS", targetBehaviorKey: "doc000b:structure:variable-specification", rationale: "La preuve SPRINT contextualise la continuité entre collecte et définition sans remplacer l’owner Data." },
      { type: "PRECEDES", targetBehaviorKey: "doc002r:boundary:incomplete-linked-document-family", rationale: "Les liens démontrés sont établis avant de qualifier les classes documentaires absentes." },
    ],
  }, [
    { label: "sprint-protocol", sourceId: "RC01-E-078", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-006/PROTOCOL", observation: "Le protocole SPRINT appartient à la même famille officielle que les formulaires et le dictionnaire.", sourceDocumentRefs: ["RC01-ART-078"], familyRef: "PROTOCOL", projectRef: "SPRINT" },
    { label: "sprint-crf", sourceId: "RC01-E-079", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-006/CRF", observation: "La compilation de formulaires SPRINT documente les supports de collecte de la même étude.", sourceDocumentRefs: ["RC01-ART-079"], familyRef: "CRF", projectRef: "SPRINT" },
    { label: "sprint-dd", sourceId: "RC01-E-080", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-006/DATA_DICTIONARY", observation: "Le dictionnaire SPRINT documente une version de variables et de codages de la même étude.", sourceDocumentRefs: ["RC01-ART-080"], familyRef: "DATA_DICTIONARY", projectRef: "SPRINT" },
  ], [
    { variantId: "DKV-DOC002R-SPRINT-VARIABLE-LINEAGE", name: "Lignage SPRINT", description: "Protocole, formulaires et dictionnaire sont liés par l’identité SPRINT.", applicability: "SPRINT seulement; correspondance de champs non adjudiquée", kind: "OBSERVED_VARIANT", evidenceIndexes: [0, 1, 2], limitations: ["Aucun DMP ou SAP autonome n’est ajouté à cette chaîne."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:boundary:same-study-operational-and-data-workflow-allocation",
    name: "Allocation des procédures et workflows data dans des artefacts liés",
    description: "Des procédures opérationnelles ou de Data Management peuvent être distribuées entre protocole, manuel et SOP d’une même étude sans que ces artefacts soient requalifiés en DMP autonome.",
    category: "Workflow",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Familles liées SPRINT et ORCHID, conservées séparément",
    inputs: ["Protocole", "Manuel ou SOP", "Identité d’étude", "Contenu data ou opérationnel observé"],
    actions: ["Relier les artefacts de même étude", "Qualifier le rôle documentaire", "Préserver l’absence de DMP autonome"],
    outputs: ["Workflow documentaire contextualisé"],
    limitations: ["Un chapitre ou une SOP ne devient pas automatiquement un DMP.", "SPRINT et ORCHID ne sont jamais fusionnés en chaîne unique."],
    sourceIds: ["RC01-E-081", "RC01-E-084"],
    relatedBehaviorKeys: [{ type: "COMPLEMENTS", targetBehaviorKey: "doc002r:boundary:protocol-specialized-document-detail-allocation", rationale: "L’allocation opérationnelle constitue une application contextualisée de la frontière de détail." }],
  }, [
    { label: "operations-sprint", sourceId: "RC01-E-081", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-006/MOP", observation: "Le manuel SPRINT lié au protocole porte des thèmes de Data Management, sécurité et opérations de saisie.", sourceDocumentRefs: ["RC01-ART-078", "RC01-ART-081"], familyRef: "PROTOCOL_AND_PROCEDURE_MANUAL", projectRef: "SPRINT" },
    { label: "operations-orchid", sourceId: "RC01-E-084", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-007/SOP", observation: "La compilation SOP ORCHID liée au protocole porte la couche procédurale de la même étude.", sourceDocumentRefs: ["RC01-ART-082", "RC01-ART-084"], familyRef: "PROTOCOL_AND_SOP", projectRef: "ORCHID" },
  ], [
    { variantId: "DKV-DOC002R-OPS-SPRINT", name: "Manuel de procédures SPRINT", description: "Le manuel complète le protocole sur des opérations et workflows data.", applicability: "SPRINT uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [0], limitations: ["Pas de DMP autonome établi."] },
    { variantId: "DKV-DOC002R-OPS-ORCHID", name: "SOP ORCHID", description: "Les SOP complètent le protocole sur les procédures opérationnelles.", applicability: "ORCHID uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [1], limitations: ["Les SOP ne sont pas renommées DMP."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:boundary:same-study-analysis-plan-allocation",
    name: "Séparation du cadre protocolaire et du plan d’analyse",
    description: "Lorsqu’un SAP est explicitement lié au protocole de la même étude, les engagements analytiques peuvent être répartis entre cadre directeur et spécification statistique sans déduire une méthode ni une compatibilité de version non prouvée.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Familles liées ORCHID, REMAP-CAP et PRACTICAL",
    inputs: ["Protocole", "SAP", "Identité d’étude", "Version explicite disponible"],
    actions: ["Conserver la relation protocole–SAP", "Distinguer cadre et spécification", "Exposer les liaisons de version non adjudiquées"],
    outputs: ["Frontière analytique documentaire traçable"],
    limitations: ["DOC-002 ne sélectionne aucune méthode statistique.", "La compatibilité exacte protocole–SAP reste UNKNOWN lorsqu’elle n’est pas explicitement établie."],
    sourceIds: ["RC01-E-063", "RC01-E-069", "RC01-E-085"],
    relatedBehaviorKeys: [{ type: "COMPLEMENTS", targetBehaviorKey: "doc002r:boundary:protocol-specialized-document-detail-allocation", rationale: "La séparation protocole–SAP est une frontière spécialisée d’analyse." }],
  }, [
    { label: "analysis-orchid", sourceId: "RC01-E-085", locator: "RELATIONSHIPS/SAP_SUPPORTS_PROTOCOL/ORCHID", observation: "Le SAP final ORCHID est relié au protocole ORCHID dans la même famille officielle.", sourceDocumentRefs: ["RC01-ART-082", "RC01-ART-085"], familyRef: "PROTOCOL_AND_SAP", projectRef: "ORCHID" },
    { label: "analysis-remap", sourceId: "RC01-E-063", locator: "RELATIONSHIPS/SAP_SPECIALIZES_CORE/REMAP_CAP", observation: "L’appendice d’analyse REMAP-CAP est co-listé avec le protocole cœur et conserve sa propre version.", sourceDocumentRefs: ["RC01-ART-062", "RC01-ART-063"], familyRef: "CORE_PROTOCOL_AND_SAP", projectRef: "REMAP_CAP" },
    { label: "analysis-practical", sourceId: "RC01-E-069", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-004/SAP", observation: "PRACTICAL publie séparément le protocole maître et le plan d’analyse maître.", sourceDocumentRefs: ["RC01-ART-068", "RC01-ART-069"], familyRef: "MASTER_PROTOCOL_AND_MASTER_SAP", projectRef: "PRACTICAL" },
  ], [
    { variantId: "DKV-DOC002R-ANALYSIS-ORCHID", name: "SAP autonome ORCHID", description: "Le SAP est un artefact analytique autonome lié au protocole.", applicability: "ORCHID uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [0], limitations: ["Le lien exact à une version de protocole n’a pas été adjudiqué."] },
    { variantId: "DKV-DOC002R-ANALYSIS-PLATFORM", name: "Plan maître et extensions", description: "Un plan maître peut coexister avec des extensions spécifiques au domaine.", applicability: "REMAP-CAP ou PRACTICAL selon leurs artefacts officiels", kind: "OBSERVED_VARIANT", evidenceIndexes: [1, 2], limitations: ["Aucune architecture statistique universelle n’est déduite."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:version:explicit-artifact-succession",
    name: "Succession documentaire versionnée explicitement",
    description: "Une relation de succession entre versions est conservée lorsqu’une source officielle identifie les deux versions; elle ne prouve pas la propagation du changement aux artefacts aval.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Versions explicites STEP, REMAP-CAP, PRINCIPLE, PRACTICAL et SPRINT",
    inputs: ["Artefact antérieur", "Artefact ultérieur", "Source officielle de succession", "Portée de version"],
    actions: ["Conserver les deux identités de version", "Enregistrer la relation de succession", "Refuser toute propagation aval non prouvée"],
    outputs: ["Lignage de version reconstructible"],
    limitations: ["La version la plus récente observée n’est pas automatiquement la version applicable.", "Aucun artefact aval n’est marqué obsolète sans preuve propre."],
    sourceIds: ["RC01-E-061", "RC01-E-065", "RC01-E-074", "RC01-E-076", "RC01-E-080"],
    relatedBehaviorKeys: [{ type: "SPECIALIZES", targetBehaviorKey: "doc000b:structure:change-history", rationale: "La succession explicite contextualise le pattern général d’historique des modifications." }],
  }, [
    { label: "version-step", sourceId: "RC01-E-061", locator: "VERSION_RELATIONSHIPS/STEP", observation: "Le hub STEP conserve des couples de versions successives pour le maître et le domaine.", sourceDocumentRefs: ["RC01-ART-061"], familyRef: "PLATFORM_VERSION_LINEAGE", projectRef: "STEP" },
    { label: "version-remap", sourceId: "RC01-E-074", locator: "VERSION_RELATIONSHIPS/REMAP_CAP", observation: "La lignée REMAP-CAP conserve une version cœur historique et une version ultérieure explicitement nommée.", sourceDocumentRefs: ["RC01-ART-062", "RC01-ART-074"], familyRef: "CORE_PROTOCOL_VERSION_LINEAGE", projectRef: "REMAP_CAP" },
    { label: "version-principle", sourceId: "RC01-E-065", locator: "VERSION_RELATIONSHIPS/PRINCIPLE", observation: "Le protocole PRINCIPLE observé déclare une succession de version explicite.", sourceDocumentRefs: ["RC01-ART-065"], familyRef: "PROTOCOL_VERSION_LINEAGE", projectRef: "PRINCIPLE" },
    { label: "version-practical", sourceId: "RC01-E-076", locator: "VERSION_RELATIONSHIPS/PRACTICAL", observation: "PRACTICAL conserve des successions distinctes pour les couches maître, domaine et intervention.", sourceDocumentRefs: ["RC01-ART-068", "RC01-ART-076", "RC01-ART-077"], familyRef: "MODULAR_VERSION_LINEAGE", projectRef: "PRACTICAL" },
    { label: "version-sprint", sourceId: "RC01-E-080", locator: "VERSION_RELATIONSHIPS/SPRINT", observation: "Le dictionnaire SPRINT conserve une succession de release explicitement identifiée.", sourceDocumentRefs: ["RC01-ART-080"], familyRef: "DATA_DICTIONARY_VERSION_LINEAGE", projectRef: "SPRINT" },
  ], [
    { variantId: "DKV-DOC002R-VERSION-PLATFORM", name: "Versions de plateforme modulaires", description: "Les couches maître, domaine ou intervention peuvent évoluer selon des lignées distinctes.", applicability: "STEP, REMAP-CAP ou PRACTICAL selon les relations explicites", kind: "OBSERVED_VARIANT", evidenceIndexes: [0, 1, 3], limitations: ["Ne pas supposer une mise à jour synchrone de toutes les couches."] },
    { variantId: "DKV-DOC002R-VERSION-DATA-RELEASE", name: "Version de dictionnaire de données", description: "La release du dictionnaire conserve sa propre identité de version.", applicability: "SPRINT uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [4], limitations: ["La compatibilité champ à champ avec les formulaires reste non adjudiquée."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:amendment:explicit-affected-document-group",
    name: "Groupement explicite des documents affectés par un amendement",
    description: "Une page d’amendement peut relier plusieurs artefacts affectés; la relation est conservée sans déclarer chaque fichier supersédé ni approuvé en l’absence d’une preuve au niveau du fichier.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    scope: "PRINCIPLE, amendement et groupe de documents officiellement liés",
    inputs: ["Identité d’amendement", "Artefacts groupés", "Source officielle", "Relations de version disponibles"],
    actions: ["Conserver le groupement", "Distinguer impact et supersession", "Laisser les arêtes fichier par fichier UNKNOWN"],
    outputs: ["Impact documentaire d’amendement borné"],
    limitations: ["Le groupement ne vaut ni approbation ni preuve de supersession pour chaque document.", "L’applicabilité courante reste hors du pattern."],
    sourceIds: ["RC01-E-066"],
    relatedBehaviorKeys: [{ type: "COMPLEMENTS", targetBehaviorKey: "doc002r:version:explicit-artifact-succession", rationale: "L’impact d’amendement complète le lignage de version sans le remplacer." }],
  }, [
    { label: "amendment-principle", sourceId: "RC01-E-066", locator: "RELATIONSHIPS/AMENDMENT_GROUPS_AFFECTED_DOCUMENTS", observation: "La source officielle PRINCIPLE groupe protocole et documents associés sous un amendement identifié.", sourceDocumentRefs: ["RC01-ART-065", "RC01-ART-066"], familyRef: "AMENDMENT_DOCUMENT_GROUP", projectRef: "PRINCIPLE" },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:architecture:master-domain-artifact-modularity",
    name: "Modularité documentaire maître–domaine–intervention",
    description: "Certaines plateformes structurent des dispositions communes dans une couche maître ou cœur et des spécialisations dans des artefacts de domaine ou d’intervention explicitement liés.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Architectures observées STEP, REMAP-CAP et PRACTICAL",
    inputs: ["Document maître ou cœur", "Artefact de domaine", "Artefact d’intervention éventuel", "Liens officiels"],
    actions: ["Conserver la hiérarchie observée", "Préserver les versions par couche", "Refuser la généralisation inter-plateforme"],
    outputs: ["Hiérarchie documentaire modulaire contextualisée"],
    limitations: ["Chaque plateforme conserve sa propre architecture.", "La modularité documentaire ne détermine ni design scientifique ni activation d’un domaine."],
    sourceIds: ["RC01-E-060", "RC01-E-075", "RC01-E-077"],
    relatedBehaviorKeys: [{ type: "GENERALIZES", targetBehaviorKey: "doc002r:classification:explicit-deferral-to-specialized-document", rationale: "La modularité décrit la structure globale dont certains renvois explicites sont des instances." }],
  }, [
    { label: "modularity-step", sourceId: "RC01-E-060", locator: "RELATIONSHIPS/DOMAIN_SPECIALIZES_MASTER/STEP", observation: "STEP relie une vue maître et un synopsis de domaine.", sourceDocumentRefs: ["RC01-ART-059", "RC01-ART-060"], familyRef: "MASTER_DOMAIN", projectRef: "STEP" },
    { label: "modularity-remap", sourceId: "RC01-E-075", locator: "RELATIONSHIPS/DOMAIN_SPECIALIZES_CORE/REMAP_CAP", observation: "REMAP-CAP sépare protocole cœur, appendice de domaine, couche analytique et ressources régionales.", sourceDocumentRefs: ["RC01-ART-062", "RC01-ART-063", "RC01-ART-064", "RC01-ART-075"], familyRef: "CORE_DOMAIN_REGION_ANALYSIS", projectRef: "REMAP_CAP" },
    { label: "modularity-practical", sourceId: "RC01-E-077", locator: "RELATIONSHIPS/INTERVENTION_APPENDIX_SPECIALIZES_DOMAIN/PRACTICAL", observation: "PRACTICAL relie des artefacts maître, domaine et intervention.", sourceDocumentRefs: ["RC01-ART-068", "RC01-ART-076", "RC01-ART-077"], familyRef: "MASTER_DOMAIN_INTERVENTION", projectRef: "PRACTICAL" },
  ], [
    { variantId: "DKV-DOC002R-MODULARITY-STEP", name: "Maître et domaine STEP", description: "Deux couches liées sont observées.", applicability: "STEP uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [0], limitations: ["Le protocole maître complet n’est pas stocké."] },
    { variantId: "DKV-DOC002R-MODULARITY-REMAP", name: "Cœur, domaine, région et analyse REMAP-CAP", description: "Plusieurs axes documentaires sont séparés et liés.", applicability: "REMAP-CAP uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [1], limitations: ["L’applicabilité régionale varie."] },
    { variantId: "DKV-DOC002R-MODULARITY-PRACTICAL", name: "Maître, domaine et intervention PRACTICAL", description: "Trois niveaux de spécialisation sont observés.", applicability: "PRACTICAL uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [2], limitations: ["L’activation courante n’est pas inférée."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:boundary:incomplete-linked-document-family",
    name: "Famille documentaire liée mais incomplète",
    description: "Une famille de même étude conserve les artefacts présents, les contenus intégrés et les classes autonomes absentes sans compléter la chaîne depuis une autre étude.",
    category: "Unknown",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Familles SPRINT et ORCHID indépendantes",
    inputs: ["Identité d’étude", "Artefacts présents", "Contenus intégrés", "Classes autonomes absentes"],
    actions: ["Inventorier les artefacts liés", "Distinguer intégré et autonome", "Conserver les absences", "Interdire la fusion inter-études"],
    outputs: ["Famille partielle honnête et reconstructible"],
    limitations: ["SPRINT et ORCHID fournissent des preuves complémentaires mais jamais une chaîne unique.", "Une classe absente du corpus n’est pas déclarée inexistante."],
    sourceIds: ["RC01-E-078", "RC01-E-082"],
    relatedBehaviorKeys: [{ type: "ALTERNATIVE_TO", targetBehaviorKey: "doc000a:workflow:descriptive-study-lifecycle", rationale: "Une famille documentaire partielle ne doit pas être gonflée en cycle complet." }],
  }, [
    { label: "incomplete-sprint", sourceId: "RC01-E-078", locator: "CHAIN_ASSESSMENT/FAMILIES/SPRINT", observation: "SPRINT relie protocole, CRF, dictionnaire et manuel; le DMP et le SAP ne sont pas établis comme artefacts autonomes.", sourceDocumentRefs: ["RC01-ART-078", "RC01-ART-079", "RC01-ART-080", "RC01-ART-081"], familyRef: "INCOMPLETE_LINKED_FAMILY", projectRef: "SPRINT" },
    { label: "incomplete-orchid", sourceId: "RC01-E-082", locator: "CHAIN_ASSESSMENT/FAMILIES/ORCHID", observation: "ORCHID relie protocole, dictionnaire, SOP et SAP; le CRF et le DMP ne sont pas établis comme artefacts autonomes.", sourceDocumentRefs: ["RC01-ART-082", "RC01-ART-083", "RC01-ART-084", "RC01-ART-085"], familyRef: "INCOMPLETE_LINKED_FAMILY", projectRef: "ORCHID" },
  ], [
    { variantId: "DKV-DOC002R-INCOMPLETE-SPRINT", name: "Famille SPRINT", description: "Protocol, CRF, Data Dictionary et MOP sont présents.", applicability: "SPRINT uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [0], limitations: ["Pas de DMP ni SAP autonomes établis."] },
    { variantId: "DKV-DOC002R-INCOMPLETE-ORCHID", name: "Famille ORCHID", description: "Protocol, Data Dictionary, SOP et SAP sont présents.", applicability: "ORCHID uniquement", kind: "OBSERVED_VARIANT", evidenceIndexes: [1], limitations: ["Pas de CRF ni DMP autonomes établis."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:boundary:remote-content-evidence-rights",
    name: "Preuve documentaire distante sans droit de stockage",
    description: "Un document officiellement accessible mais non stockable reste une source de preuve dérivée bornée; son URL, son identité, son statut de droits et ses limites de reproductibilité sont conservés sans binaire ni extrait substantiel.",
    category: "Document Structure",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Sources RC01 qualifiées CONTENT_ACCESSIBLE_NOT_STORED",
    inputs: ["Identité de document", "URL officielle", "Statut de droits", "Références de structure autorisées", "Limites de reproductibilité"],
    actions: ["Conserver la métadonnée", "Limiter l’abstraction aux phénomènes autorisés", "Ne pas stocker le binaire", "Rendre la dépendance de récupération future explicite"],
    outputs: ["Preuve dérivée rights-first"],
    limitations: ["L’accès ponctuel ne crée aucun droit de redistribution.", "La source n’est ni SECTION_INDEXED ni runtime-content-ready.", "La reproductibilité hors ligne n’est pas garantie."],
    sourceIds: referenceClosure.PLATFORM_READINESS.map((platform) => referenceClosure.ARTIFACTS.find((item) => item.PLATFORM_TRIAL_ID === platform.PLATFORM_TRIAL_ID).SOURCE_ID),
    relatedBehaviorKeys: [{ type: "SPECIALIZES", targetBehaviorKey: "doc000b:structure:source-trace-block", rationale: "La preuve distante applique le bloc de trace à une source non stockable." }],
  }, referenceClosure.PLATFORM_READINESS.map((platform) => {
    const source = referenceClosure.ARTIFACTS.find((item) => item.PLATFORM_TRIAL_ID === platform.PLATFORM_TRIAL_ID);
    return {
      label: `rights-${platform.NAME}`,
      sourceId: source.SOURCE_ID,
      locator: `PLATFORM_READINESS/${platform.PLATFORM_TRIAL_ID}`,
      observation: `La preuve ${platform.NAME} reste accessible par récupération contrôlée avec contenu local, index de sections et readiness runtime explicitement absents.`,
      sourceDocumentRefs: referenceClosure.ARTIFACTS.filter((item) => item.PLATFORM_TRIAL_ID === platform.PLATFORM_TRIAL_ID).map((item) => item.ARTIFACT_ID),
      familyRef: "REMOTE_CONTENT_RIGHTS_BOUNDARY",
      projectRef: platform.NAME,
    };
  }), [
    { variantId: "DKV-DOC002R-RIGHTS-NO-STORAGE", name: "Stockage et commit interdits", description: "La consultation autorise une analyse dérivée mais pas la conservation du binaire.", applicability: "Sources dont LOCAL_STORAGE_ALLOWED et REPOSITORY_COMMIT_ALLOWED valent NO", kind: "OBSERVED_VARIANT", evidenceIndexes: [1, 2, 3], limitations: ["Aucun texte substantiel n’est reproduit."] },
    { variantId: "DKV-DOC002R-RIGHTS-UNKNOWN-STORAGE", name: "Droit de stockage non établi", description: "Le contenu reste non stocké tant que le droit de conservation n’est pas établi.", applicability: "Sources dont le droit de stockage vaut UNKNOWN", kind: "UNRESOLVED_VARIANT", evidenceIndexes: [0, 4], limitations: ["L’accessibilité publique ne suffit pas à autoriser le commit."] },
  ]);

  addReferenceFact({
    behaviorKey: "doc002r:commitment:scope-and-specialization-boundary",
    name: "Engagement documentaire borné par portée et spécialisation",
    description: "La formulation documentaire doit distinguer dispositions communes, engagements propres à un domaine, paramètres laissés ouverts et détails confiés à un artefact lié sans augmenter le niveau d’engagement scientifique.",
    category: "Editorial",
    origin: "DOCUMENTARY_CORPUS",
    scope: "Protocoles maîtres, documents de domaine et artefacts spécialisés liés",
    inputs: ["Fait ou décision gouverné", "Portée documentaire", "Couche de spécialisation", "Statut connu ou ouvert"],
    actions: ["Conserver l’engagement source", "Expliciter la portée", "Signaler les paramètres ouverts", "Référencer la couche spécialisée"],
    outputs: ["Formulation documentaire bornée et traçable"],
    limitations: ["Aucun wording source n’est imité.", "Le pattern ne choisit ni étude, ni endpoint, ni méthode, ni paramètre."],
    sourceIds: ["SRC-DOC000B-PATTERNS", "RC01-E-060", "RC01-E-065", "RC01-E-077"],
    relatedBehaviorKeys: [
      { type: "SPECIALIZES", targetBehaviorKey: "doc000b:editorial:explicit-commitment-level", rationale: "La portée et la spécialisation contextualisent le niveau d’engagement existant." },
      { type: "COMPLEMENTS", targetBehaviorKey: "doc002r:architecture:master-domain-artifact-modularity", rationale: "La formulation bornée rend visible la structure modulaire sans la transformer en science." },
    ],
  }, [
    { label: "commitment-derived", sourceId: "SRC-DOC000B-PATTERNS", locator: "interpretations-authorisees-interdites", observation: "Le modèle DOC-000B distingue contenu observé, interprétation autorisée et promotion interdite.", sourceDocumentRefs: ["DOC-000B-PATTERN-MAP"], familyRef: "EDITORIAL_COMMITMENT", projectRef: null },
    { label: "commitment-step", sourceId: "RC01-E-060", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-001", observation: "STEP sépare portée maître et spécialisation de domaine dans des ressources liées.", sourceDocumentRefs: ["RC01-ART-059", "RC01-ART-060"], familyRef: "MASTER_DOMAIN_COMMITMENT", projectRef: "STEP" },
    { label: "commitment-principle", sourceId: "RC01-E-065", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-003", observation: "PRINCIPLE combine protocole maître, sections spécialisées intégrées et historique d’amendement dans une portée explicitement versionnée.", sourceDocumentRefs: ["RC01-ART-065"], familyRef: "EMBEDDED_SPECIALIZED_COMMITMENT", projectRef: "PRINCIPLE" },
    { label: "commitment-practical", sourceId: "RC01-E-077", locator: "DOC002R_EXTRACTION_CANDIDATES/DEC01-CAND-004", observation: "PRACTICAL distribue les engagements entre couches maître, domaine et intervention liées.", sourceDocumentRefs: ["RC01-ART-068", "RC01-ART-076", "RC01-ART-077"], familyRef: "MASTER_DOMAIN_INTERVENTION_COMMITMENT", projectRef: "PRACTICAL" },
  ], [
    { variantId: "DKV-DOC002R-COMMITMENT-SHARED", name: "Disposition commune", description: "Le document maître porte une disposition partagée à la portée observée.", applicability: "Seulement si la portée maître est prouvée", kind: "OBSERVED_VARIANT", evidenceIndexes: [1, 3], limitations: ["Ne vaut pas règle universelle."] },
    { variantId: "DKV-DOC002R-COMMITMENT-SPECIALIZED", name: "Engagement spécialisé", description: "Un domaine ou une intervention porte un engagement propre à sa portée.", applicability: "Seulement pour l’artefact spécialisé lié", kind: "OBSERVED_VARIANT", evidenceIndexes: [1, 3], limitations: ["Ne doit pas être projeté sur les autres domaines."] },
    { variantId: "DKV-DOC002R-COMMITMENT-OPEN", name: "Paramètre explicitement ouvert", description: "Une information non arrêtée reste visible comme ouverte ou requérant une décision humaine.", applicability: "Lorsque le statut source est UNKNOWN ou décision requise", kind: "UNRESOLVED_VARIANT", evidenceIndexes: [0], limitations: ["Aucun remplissage automatique."] },
  ]);

  const factsByName = new Map(facts.map((fact) => [comparable(fact.name), fact]));
  const relate = (fromName, type, toName, rationale) => {
    const from = factsByName.get(comparable(fromName));
    const to = factsByName.get(comparable(toName));
    if (from && to) from.relatedBehaviorKeys.push({ type, targetBehaviorKey: to.behaviorKey, rationale });
  };
  relate("Requirements → risk → specification → test traceability", "PRECEDES", "Test case and anomaly lifecycle", "La traçabilité des exigences prépare les tests et leur cycle d’anomalie.");
  relate("Test case and anomaly lifecycle", "GENERATES", "Change impact and periodic review", "Les anomalies et corrections alimentent l’analyse d’impact du changement.");
  relate("Requirement Traceability Line", "REQUIRES", "Validation Test Case", "La ligne de traçabilité doit référencer un test défini.");
  relate("Validation Test Case", "GENERATES", "Anomaly / Corrective Action", "Un écart entre attendu et observé peut produire une anomalie tracée.");
  relate("Anomaly / Corrective Action", "PRECEDES", "Change Impact Record", "Une correction acceptée précède l’enregistrement de son impact et de sa clôture.");

  return facts;
};

const statusFor = (facts, evidence) => {
  const origins = uniqueSorted(facts.map((fact) => fact.origin));
  if (origins.includes("LOCAL_PRACTICE")) return "LOCAL_PRACTICE";
  if (origins.includes("EXTERNAL_REFERENCE")) return "EXTERNAL_REFERENCE";
  if (origins.includes("HISTORICAL_REFERENCE")) return "HISTORICAL_REFERENCE";
  const families = uniqueSorted(evidence.map((item) => item.familyRef));
  const documents = uniqueSorted(evidence.flatMap((item) => item.sourceDocumentRefs));
  if (families.length > 1) return "SUPPORTED_BY_MULTIPLE_FAMILIES";
  if (documents.length > 1) return "SUPPORTED_BY_MULTIPLE_DOCUMENTS";
  return "CANDIDATE_ONLY";
};

const confidenceFor = (facts, evidence) => {
  if (facts.some((fact) => fact.origin === "LOCAL_PRACTICE")) return "LOCAL_ONLY";
  const institutions = uniqueSorted(evidence.map((item) => item.institutionRef));
  const projects = uniqueSorted(evidence.map((item) => item.projectRef));
  const documents = uniqueSorted(evidence.flatMap((item) => item.sourceDocumentRefs));
  if (institutions.length > 1) return "MULTIPLE_INSTITUTIONS";
  if (projects.length > 1) return "MULTIPLE_PROJECTS";
  if (documents.length > 1) return "MULTIPLE_DOCUMENTS";
  if (documents.length === 1) return "SINGLE_DOCUMENT";
  return "UNKNOWN";
};

const buildCatalog = (facts, sourceCatalog) => {
  const byKey = new Map();
  facts.forEach((fact) => {
    const key = comparable(fact.behaviorKey);
    byKey.set(key, [...(byKey.get(key) ?? []), fact]);
  });
  const keyToPatternId = new Map([...byKey.keys()].map((key) => [key, patternId(key)]));
  const patterns = [...byKey.entries()].map(([key, groupedFacts]) => {
    groupedFacts.sort((left, right) => left.factId.localeCompare(right.factId));
    const id = keyToPatternId.get(key);
    const evidence = [...new Map(groupedFacts.flatMap((fact) => fact.evidence).map((item) => [item.evidenceId, item])).values()].sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
    const variants = [...new Map(groupedFacts.flatMap((fact) => fact.variants).map((item) => [item.variantId, item])).values()].sort((left, right) => left.variantId.localeCompare(right.variantId));
    const sourceIds = uniqueSorted(groupedFacts.flatMap((fact) => fact.sourceIds));
    const sources = sourceCatalog.filter((source) => sourceIds.includes(source.sourceId)).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
    const evidenceIds = evidence.map((item) => item.evidenceId);
    const factIds = groupedFacts.map((fact) => fact.factId);
    const makeRelation = (type, toId, rationale, relationEvidenceIds = evidenceIds, relationSourceIds = sourceIds, status = "CANDIDATE_ONLY") => ({
      relationId: relationId(id, type, toId), fromId: id, type, toId, rationale, evidenceIds: uniqueSorted(relationEvidenceIds), provenanceSourceIds: uniqueSorted(relationSourceIds), status,
    });
    const relationships = [
      ...evidence.map((item) => makeRelation("SUPPORTED_BY", item.evidenceId, "Le pattern conserve le lien vers son observation documentaire.", [item.evidenceId], [item.sourceId])),
      ...factIds.map((item) => makeRelation("DERIVES_FROM", item, "Le pattern est abstrait à partir d’un fait documentaire contextualisé.")),
      ...groupedFacts.flatMap((fact) => fact.relatedBehaviorKeys.map((item) => makeRelation(item.type, item.targetNodeId ?? keyToPatternId.get(comparable(item.targetBehaviorKey ?? "")) ?? patternId(item.targetBehaviorKey ?? ""), item.rationale, fact.evidence.map((entry) => entry.evidenceId), fact.sourceIds, item.type === "CONFLICTS_WITH" ? "UNRESOLVED" : "CANDIDATE_ONLY"))),
    ];
    const origins = uniqueSorted(groupedFacts.map((fact) => fact.origin));
    const limitations = uniqueSorted(groupedFacts.flatMap((fact) => fact.limitations));
    const recordBase = { patternId: id, key, category: groupedFacts[0].category, origins, sourceIds, evidenceIds, factIds, variants, limitations };
    return {
      patternId: id,
      name: groupedFacts[0].name,
      description: groupedFacts[0].description,
      category: groupedFacts[0].category,
      status: statusFor(groupedFacts, evidence),
      confidence: confidenceFor(groupedFacts, evidence),
      origin: origins.length === 1 ? origins[0] : "DOCUMENTARY_CORPUS",
      sources,
      evidence,
      relationships: [...new Map(relationships.map((item) => [item.relationId, item])).values()].sort((left, right) => left.relationId.localeCompare(right.relationId)),
      variants,
      limitations,
      provenance: {
        sourceIds,
        evidenceIds,
        factIds,
        sourceVersions: Object.fromEntries(sources.map((source) => [source.sourceId, source.artifactVersion])),
        extractionDates: uniqueSorted(groupedFacts.map((fact) => fact.extractedAt)),
        transformation: "ABSTRACTION_FROM_PREEXTRACTED_DOCUMENTARY_OUTPUT",
        abstractionRuleVersion: ENGINE_VERSION,
        recordDigest: logicalDigest(recordBase),
      },
      version: "1.0.0",
      createdFrom: factIds,
    };
  }).sort((left, right) => left.patternId.localeCompare(right.patternId));

  const relations = [...new Map(patterns.flatMap((pattern) => pattern.relationships).map((item) => [item.relationId, item])).values()].sort((left, right) => left.relationId.localeCompare(right.relationId));
  const externalReferenceIds = uniqueSorted(relations.flatMap((edge) => [edge.fromId, edge.toId]).filter((id) => /^(?:REG-000|REG-001):/.test(id)));
  const nodes = [
    ...patterns.map((pattern) => ({ nodeId: pattern.patternId, kind: "PATTERN", label: pattern.name })),
    ...patterns.flatMap((pattern) => pattern.evidence.map((item) => ({ nodeId: item.evidenceId, kind: "EVIDENCE", label: item.observation }))),
    ...patterns.flatMap((pattern) => pattern.createdFrom.map((item) => ({ nodeId: item, kind: "FACT", label: item }))),
    ...sourceCatalog.map((source) => ({ nodeId: source.sourceId, kind: "SOURCE", label: source.corpusId })),
    ...externalReferenceIds.map((nodeId) => ({ nodeId, kind: "EXTERNAL_REFERENCE", label: nodeId })),
  ];
  const uniqueNodes = [...new Map(nodes.map((node) => [node.nodeId, node])).values()].sort((left, right) => left.nodeId.localeCompare(right.nodeId));
  const graph = { graphVersion: ENGINE_VERSION, nodes: uniqueNodes, edges: relations, digest: logicalDigest({ nodes: uniqueNodes, edges: relations }) };
  const countBy = (values) => Object.fromEntries(uniqueSorted(values).map((value) => [value, values.filter((item) => item === value).length]));
  const statistics = {
    patternCount: patterns.length,
    factCount: new Set(patterns.flatMap((pattern) => pattern.createdFrom)).size,
    evidenceCount: new Set(patterns.flatMap((pattern) => pattern.evidence.map((item) => item.evidenceId))).size,
    sourceCount: sourceCatalog.length,
    relationCount: relations.length,
    variantCount: patterns.reduce((sum, pattern) => sum + pattern.variants.length, 0),
    categoryCount: 25,
    averageEvidencePerPattern: patterns.length ? Math.round(patterns.reduce((sum, pattern) => sum + pattern.evidence.length, 0) / patterns.length * 100) / 100 : 0,
    localPatternCount: patterns.filter((pattern) => pattern.status === "LOCAL_PRACTICE").length,
    historicalPatternCount: patterns.filter((pattern) => pattern.status === "HISTORICAL_REFERENCE").length,
    externalPatternCount: patterns.filter((pattern) => pattern.status === "EXTERNAL_REFERENCE").length,
    candidateOnlyPatternCount: patterns.filter((pattern) => pattern.status === "CANDIDATE_ONLY").length,
    supportedByMultipleDocumentsCount: patterns.filter((pattern) => pattern.status === "SUPPORTED_BY_MULTIPLE_DOCUMENTS").length,
    supportedByMultipleFamiliesCount: patterns.filter((pattern) => pattern.status === "SUPPORTED_BY_MULTIPLE_FAMILIES").length,
    contradictionCount: relations.filter((edge) => edge.type === "CONFLICTS_WITH").length,
    consumerCount: 9,
    orphanPatternCount: patterns.filter((pattern) => !pattern.relationships.some((edge) => edge.type === "SUPPORTED_BY")).length,
    patternWithoutProvenanceCount: patterns.filter((pattern) => !pattern.provenance.sourceIds.length || !pattern.provenance.recordDigest).length,
    patternWithoutConsumerCount: 0,
    patternsWithoutVariantCount: patterns.filter((pattern) => !pattern.variants.length).length,
    supersededPatternCount: patterns.filter((pattern) => pattern.status === "SUPERSEDED").length,
    patternsRequiringHumanReviewCount: patterns.filter((pattern) => /humain|human|revue|review|decision|décision/i.test([pattern.description, ...pattern.limitations].join(" ")) || pattern.variants.some((variant) => variant.kind === "UNRESOLVED_VARIANT")).length,
    byCategory: countBy(patterns.map((pattern) => pattern.category)),
    byStatus: countBy(patterns.map((pattern) => pattern.status)),
    byConfidence: countBy(patterns.map((pattern) => pattern.confidence)),
    byOrigin: countBy(patterns.map((pattern) => pattern.origin)),
    provenanceCoveragePercent: patterns.length ? Math.round(patterns.filter((pattern) => pattern.provenance.sourceIds.length && pattern.provenance.recordDigest).length / patterns.length * 10000) / 100 : 100,
    evidenceCoveragePercent: patterns.length ? Math.round(patterns.filter((pattern) => pattern.evidence.length).length / patterns.length * 10000) / 100 : 100,
  };
  const digest = logicalDigest({ version: CATALOG_VERSION, sources: sourceCatalog, patterns, relations, graphDigest: graph.digest });
  const catalogId = `DKC-${logicalDigest([CATALOG_VERSION, digest]).slice(5, 17).toUpperCase()}`;
  const audit = buildAudit({ digest, patterns, relations, sourceCatalog, graph });
  return {
    contractVersion: SCHEMA_VERSION,
    catalogId,
    version: CATALOG_VERSION,
    generatedAt: CATALOG_GENERATED_AT,
    priorCatalogId: PRIOR_CATALOG_ID,
    sourceCatalog,
    patterns,
    relations,
    graph,
    statistics,
    audit,
    digest,
    boundary: "DOCUMENTARY_KNOWLEDGE_ONLY_NOT_SCIENCE_NOT_RULE_NOT_DECISION",
  };
};

const sensitiveMatchers = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?33|0)[1-9](?:[ .-]?\d{2}){4}\b/,
  /\b\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}\b/,
  /\b\d+(?:[.,]\d+)?\s*(?:mg|ml|mm|ms|kv|ma|bpm|tesla)\b/i,
  /\b(?:CARIM|Siemens|Skyra|Philips|GE Healthcare)\b/i,
];

function buildAudit(catalog) {
  const findings = [];
  const add = (code, severity, subjectId, message, evidenceIds = []) => findings.push({ findingId: `DKA-${logicalDigest([code, subjectId, message]).slice(5, 17).toUpperCase()}`, code, severity, subjectId, message, evidenceIds: uniqueSorted(evidenceIds) });
  const sourceIds = new Set(catalog.sourceCatalog.map((source) => source.sourceId));
  const nodeIds = new Set(catalog.graph.nodes.map((node) => node.nodeId));
  catalog.patterns.forEach((pattern) => {
    if (!pattern.evidence.length) add("PATTERN_WITHOUT_EVIDENCE", "ERROR", pattern.patternId, "Le pattern ne porte aucune observation documentaire.");
    if (!pattern.provenance.sourceIds.length || !pattern.provenance.recordDigest) add("PATTERN_WITHOUT_PROVENANCE", "ERROR", pattern.patternId, "Le lignage du pattern est incomplet.");
    if (!pattern.category) add("PATTERN_WITHOUT_CATEGORY", "ERROR", pattern.patternId, "La catégorie documentaire manque.");
    if (!pattern.relationships.some((edge) => edge.type === "SUPPORTED_BY")) add("ORPHAN_PATTERN", "ERROR", pattern.patternId, "Le pattern n’est relié à aucune preuve.");
    if (pattern.origin === "LOCAL_PRACTICE" && pattern.status !== "LOCAL_PRACTICE") add("LOCAL_PATTERN_PROMOTED", "ERROR", pattern.patternId, "Une pratique locale a reçu un statut plus général.", pattern.provenance.evidenceIds);
    if (pattern.origin === "EXTERNAL_REFERENCE" && pattern.status !== "EXTERNAL_REFERENCE") add("EXTERNAL_REFERENCE_PROMOTED", "ERROR", pattern.patternId, "Une référence externe a été promue en pattern général.", pattern.provenance.evidenceIds);
    if (pattern.origin === "HISTORICAL_REFERENCE" && pattern.status !== "HISTORICAL_REFERENCE") add("HISTORICAL_PATTERN_PROMOTED", "ERROR", pattern.patternId, "Une référence historique a été promue en pratique actuelle.", pattern.provenance.evidenceIds);
    const text = [pattern.name, pattern.description, ...pattern.limitations, ...pattern.variants.flatMap((variant) => [variant.name, variant.description, variant.applicability, ...variant.limitations])].join(" ");
    if (sensitiveMatchers.some((matcher) => matcher.test(text))) add("SENSITIVE_VALUE_LEAK", "ERROR", pattern.patternId, "Une valeur sensible, locale ou exécutable apparaît dans le pattern abstrait.", pattern.provenance.evidenceIds);
    pattern.provenance.sourceIds.forEach((id) => { if (!sourceIds.has(id)) add("BROKEN_SOURCE_REFERENCE", "ERROR", pattern.patternId, `La source ${id} n’existe pas dans le catalogue.`, pattern.provenance.evidenceIds); });
    const knownEvidence = new Set(pattern.evidence.map((evidence) => evidence.evidenceId));
    pattern.variants.forEach((variant) => { if (!variant.name || !variant.description || variant.evidenceIds.some((id) => !knownEvidence.has(id))) add("INVALID_VARIANT", "ERROR", variant.variantId, "La variante est incomplète ou référence une preuve étrangère.", variant.evidenceIds); });
  });
  catalog.sourceCatalog.forEach((source) => { if (!source.artifactVersion) add("SOURCE_VERSION_MISSING", "ERROR", source.sourceId, "La version de l’artefact source manque."); });
  catalog.sourceCatalog.filter((source) => source.sourceKind === "REFERENCE_CORPUS_DERIVED_EVIDENCE").forEach((source) => {
    if (source.contentAvailabilityState !== "CONTENT_ACCESSIBLE_NOT_STORED"
      || source.artifactDigestScope !== "METADATA_AND_AUTHORIZED_DERIVED_EVIDENCE_ONLY"
      || source.rights?.derivedPatternAnalysisAllowed !== "YES"
      || source.rights?.repositoryCommitAllowed === "YES"
      || source.contentEvidence?.transientBinarySha256) {
      add("RIGHTS_BOUNDARY_VIOLATION", "ERROR", source.sourceId, "La source distante ne respecte pas la frontière rights-first de DOC002R.");
    }
  });
  catalog.relations.forEach((edge) => {
    if (!nodeIds.has(edge.fromId) || !nodeIds.has(edge.toId)) add("DANGLING_RELATION", "ERROR", edge.relationId, "La relation référence un nœud absent.", edge.evidenceIds);
    if (edge.type === "CONFLICTS_WITH" && edge.status === "UNRESOLVED") add("UNRESOLVED_CONTRADICTION", "WARNING", edge.relationId, "La contradiction reste ouverte et requiert un arbitrage externe ou humain.", edge.evidenceIds);
  });
  findings.sort((left, right) => left.findingId.localeCompare(right.findingId));
  const counts = { ERROR: findings.filter((item) => item.severity === "ERROR").length, WARNING: findings.filter((item) => item.severity === "WARNING").length, INFORMATION: findings.filter((item) => item.severity === "INFORMATION").length };
  return { auditVersion: "1.0.0", catalogDigest: catalog.digest, findings, counts, passed: counts.ERROR === 0, boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX" };
}

const categoryDefinitions = [
  ["Document Structure", "Composition et contrôle documentaire sans propriété du sens."], ["Editorial", "Forme éditoriale sans création de faits."], ["Workflow", "Enchaînement de travail candidat et contextualisé."], ["Decision", "Point de choix sans décision automatique."], ["Review", "Revue humaine ou spécialisée."], ["Validation", "Preuves, tests et acceptation sans validation implicite."], ["Quality", "Contrôle, finding, action et clôture humaine."], ["CoreLab", "Organisation opérationnelle de Core Lab candidate."], ["Acquisition", "Comportements d’acquisition sans paramètres exécutables."], ["Imaging", "Pratiques documentaires d’imagerie."], ["Data", "Structures de données, transfert, traçabilité et gouvernance."], ["Monitoring", "Suivi, jalons, écarts et escalade."], ["Regulatory Interaction", "Interaction documentaire avec une référence externe, sans règle réglementaire."], ["Funding", "Structures de ressources et coûts sans montant historique."], ["Deviation", "Observation, impact, action, acceptation et clôture."], ["Training", "Formation versionnée et traçable."], ["Operational", "Pratique de conduite opérationnelle."], ["Project", "Cadrage et suivi de projet."], ["Communication", "Événement ou circuit de communication."], ["Risk", "Risque, contrôle, owner et statut sans score implicite."], ["Software", "Pratique liée à un système informatisé sans produit recommandé."], ["Equipment", "Profil et capacité d’équipement sans compatibilité déduite."], ["Troubleshooting", "Incident, reprise, vérification et escalade."], ["Human Decision", "Décision, mandat, justification et impact attribuables."], ["Unknown", "Catégorie non résolue conservée explicitement."],
].map(([category, description]) => ({ category, description, status: "SUPPORTED_CATEGORY", boundary: "CLASSIFICATION_ONLY_NOT_AUTHORITY" }));

const buildReconciliationProjection = (catalog, facts, referenceClosure) => {
  const newPatternIds = uniqueSorted(facts
    .filter((fact) => fact.behaviorKey.startsWith("doc002r:"))
    .map((fact) => patternId(fact.behaviorKey)));
  const newPatternIdSet = new Set(newPatternIds);
  const legacyPatterns = catalog.patterns.filter((pattern) => !newPatternIdSet.has(pattern.patternId));
  const legacyPatternIdsSha256 = sha256(JSON.stringify(legacyPatterns.map((pattern) => pattern.patternId).sort()));
  const legacyPatternRecordsSha256 = sha256(JSON.stringify([...legacyPatterns].sort((left, right) => left.patternId.localeCompare(right.patternId))));
  const identityIntegrity = {
    expectedLegacyPatternCount: LEGACY_PATTERN_COUNT,
    observedLegacyPatternCount: legacyPatterns.length,
    expectedLegacyPatternIdsSha256: LEGACY_PATTERN_IDS_SHA256,
    observedLegacyPatternIdsSha256: legacyPatternIdsSha256,
    expectedLegacyPatternRecordsSha256: LEGACY_PATTERN_RECORDS_SHA256,
    observedLegacyPatternRecordsSha256: legacyPatternRecordsSha256,
    identityRegressionCount: legacyPatterns.length === LEGACY_PATTERN_COUNT && legacyPatternIdsSha256 === LEGACY_PATTERN_IDS_SHA256 && legacyPatternRecordsSha256 === LEGACY_PATTERN_RECORDS_SHA256 ? 0 : 1,
  };
  if (identityIntegrity.identityRegressionCount) throw new Error(`DOC002R_LEGACY_PATTERN_REGRESSION:${JSON.stringify(identityIntegrity)}`);

  const platformBenchmark = referenceClosure.PLATFORM_READINESS.map((platform) => {
    const sources = referenceClosure.ARTIFACTS.filter((item) => item.PLATFORM_TRIAL_ID === platform.PLATFORM_TRIAL_ID);
    const sourceIds = sources.map((item) => item.SOURCE_ID);
    return {
      platformTrialId: platform.PLATFORM_TRIAL_ID,
      name: platform.NAME,
      documentaryContentInspected: platform.DOCUMENTARY_CONTENT_INSPECTED,
      contentAccessibleForFutureRetrieval: platform.CONTENT_ACCESSIBLE_FOR_FUTURE_RETRIEVAL,
      localReproducibleContent: platform.LOCAL_REPRODUCIBLE_CONTENT,
      sectionIndexedInKnowledge: platform.SECTION_INDEXED_IN_KNOWLEDGE,
      doc002rSourceReady: platform.DOC002R_SOURCE_READY,
      sourceIds,
      artifactIds: sources.map((item) => item.ARTIFACT_ID),
      patternIds: newPatternIds.filter((id) => catalog.patterns.find((pattern) => pattern.patternId === id)?.provenance.sourceIds.some((sourceId) => sourceIds.includes(sourceId))),
      limitations: platform.LIMITATIONS,
    };
  });

  const capability = {
    DOCUMENTARY_COMMITMENT: "SUPPORTED_STRONG",
    DOCUMENTARY_DETAIL_BOUNDARY: "SUPPORTED_STRONG",
    INTENTIONAL_UNDERSPECIFICATION: "SUPPORTED_PARTIAL",
    DOCUMENTARY_OMISSION: "SUPPORTED_STRONG",
    CROSS_DOCUMENT_PROPAGATION: "SUPPORTED_STRONG",
    DOCUMENT_VERSIONING: "SUPPORTED_STRONG",
    AMENDMENT_PROPAGATION: "SUPPORTED_PARTIAL",
    DOCUMENT_MODULARITY: "SUPPORTED_STRONG",
    PROTOCOL_WRITING: "SUPPORTED_STRONG",
    CRF_DESIGN: "SUPPORTED_STRONG",
    DATA_DICTIONARY_RELATIONSHIP: "SUPPORTED_STRONG",
    DMP_WORKFLOW: "SUPPORTED_PARTIAL",
    DATA_VALIDATION: "SUPPORTED_STRONG",
    DATABASE_FREEZE: "SUPPORTED_STRONG",
    SITE_FEASIBILITY: "SUPPORTED_STRONG",
    MONITORING: "SUPPORTED_STRONG",
    QUALITY_ASSURANCE: "SUPPORTED_STRONG",
    AUDIT: "SUPPORTED_STRONG",
    BUDGET: "SUPPORTED_STRONG",
    CLOSEOUT: "SUPPORTED_STRONG",
    ARCHIVING: "SUPPORTED_STRONG",
    MASTER_PROTOCOL: "SUPPORTED_STRONG",
    ARM_COHORT_MODULARITY: "SUPPORTED_STRONG",
    PLATFORM_VERSIONING: "SUPPORTED_STRONG",
  };

  return {
    missionId: "DOC002R_RECONCILIATION_AND_EXTENSION",
    projectionType: "NON_NORMATIVE_RECONCILIATION_AND_BENCHMARK_PREPARATION",
    generatedAt: CATALOG_GENERATED_AT,
    priorCatalog: { catalogId: PRIOR_CATALOG_ID, version: "1.0.0", digest: PRIOR_CATALOG_DIGEST },
    currentCatalog: { catalogId: catalog.catalogId, version: catalog.version, digest: catalog.digest },
    generationOwner: "DOC-002_EXISTING_GENERATOR",
    newPatternIds,
    identityIntegrity,
    sourceAccess: {
      remoteContentReaccessed: "NO_NOT_REQUIRED_DERIVED_CLOSURE_SUFFICIENT",
      rawHistoricalSourceReadCount: 0,
      restrictedArchiveAccessed: "NO",
      protectedRemoteBinariesCommitted: 0,
      contentAccessibleNotStoredCount: referenceClosure.ARTIFACTS.filter((item) => item.CONTENT_READINESS_STATE === "CONTENT_ACCESSIBLE_NOT_STORED").length,
      runtimeContentReadyCount: referenceClosure.PLATFORM_RUNTIME_CONTENT_READY_COUNT,
      sectionIndexReadyCount: referenceClosure.PLATFORM_SECTION_INDEX_READY_COUNT,
      reproducibleLocalContentReadyCount: referenceClosure.PLATFORM_REPRODUCIBLE_LOCAL_CONTENT_READY_COUNT,
    },
    linkedStudyBoundaries: referenceClosure.CHAIN_ASSESSMENT,
    versionRelationships: referenceClosure.VERSION_RELATIONSHIPS,
    artifactRelationships: referenceClosure.RELATIONSHIPS,
    capability,
    platformBenchmark: {
      status: "PREPARED_NOT_EXECUTED",
      imagingTransposition: "PLANNED_NOT_EXECUTED",
      futureTarget: "FUNCTIONALLY_EQUIVALENT_OR_BETTER_DOCUMENT_SET",
      platforms: platformBenchmark,
    },
    boundaries: {
      secondPatternEngineCreated: "NO",
      secondPatternGraphCreated: "NO",
      secondDocumentaryCorpusCreated: "NO",
      scientificRulesCreated: 0,
      regulatoryRequirementsCreated: 0,
      practiceToAuthorityPromotions: 0,
      binaryOrProtectedTextStored: "NO",
      tmpRuntimeChanged: "NO",
    },
  };
};

const main = async () => {
  const referenceClosure = JSON.parse(await readFile(REFERENCE_CLOSURE_PATH, "utf8"));
  const sourceCatalog = [...await buildSourceCatalog(), ...buildReferenceEvidenceSources(referenceClosure)].sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const facts = (await buildFacts(referenceClosure)).sort((left, right) => left.factId.localeCompare(right.factId));
  const catalog = buildCatalog(facts, sourceCatalog);
  const reconciliation = buildReconciliationProjection(catalog, facts, referenceClosure);
  const outputs = {
    "documentary-source-catalog.json": sourceCatalog,
    "documentary-facts.json": facts,
    "documentary-pattern-catalog.json": catalog.patterns,
    "documentary-pattern-graph.json": catalog.graph,
    "documentary-pattern-categories.json": categoryDefinitions,
    "documentary-pattern-variants.json": catalog.patterns.flatMap((pattern) => pattern.variants.map((variant) => ({ patternId: pattern.patternId, ...variant }))),
    "documentary-pattern-relations.json": catalog.relations,
    "documentary-pattern-statistics.json": catalog.statistics,
    "documentary-pattern-audit.json": catalog.audit,
    "documentary-pattern-corpus.json": catalog,
    "documentary-pattern-reconciliation.json": reconciliation,
  };
  await mkdir(OUTPUT_ROOT, { recursive: true });
  const mismatches = [];
  for (const [filename, value] of Object.entries(outputs)) {
    const content = `${JSON.stringify(value, null, 2)}\n`;
    const outputPath = path.join(OUTPUT_ROOT, filename);
    if (CHECK_ONLY) {
      const existing = await readFile(outputPath, "utf8").catch(() => "");
      if (existing !== content) mismatches.push(filename);
    } else await writeFile(outputPath, content, "utf8");
  }
  if (mismatches.length) throw new Error(`DOC002_GENERATED_OUTPUT_DRIFT:${mismatches.join(",")}`);
  if (!catalog.audit.passed) throw new Error(`DOC002_AUDIT_FAILED:${JSON.stringify(catalog.audit.counts)}`);
  process.stdout.write(`${JSON.stringify({ mode: CHECK_ONLY ? "check" : "write", outputRoot: path.relative(process.cwd(), OUTPUT_ROOT), catalogId: catalog.catalogId, digest: catalog.digest, ...catalog.statistics, audit: catalog.audit.counts })}\n`);
};

await main();
