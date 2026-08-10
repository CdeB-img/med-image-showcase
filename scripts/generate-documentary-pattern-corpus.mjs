import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ENGINE_VERSION = "1.0.0";
const SCHEMA_VERSION = "1.0.0";
const GENERATED_AT = "2026-08-10";
const OUTPUT_ROOT = path.resolve(process.cwd(), "documentary-pattern-corpus/doc-002");
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

const makeEvidence = ({ evidenceId, sourceId, locator, observation, sourceDocumentRefs = [], familyRef = null, factId: extractedFactId }) => ({
  evidenceId,
  sourceId,
  locator,
  observation: sanitize(observation),
  sourceDocumentRefs: uniqueSorted(sourceDocumentRefs),
  familyRef,
  projectRef: null,
  institutionRef: null,
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
  extractedAt: GENERATED_AT,
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

const buildFacts = async () => {
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
  const digest = logicalDigest({ version: "1.0.0", sources: sourceCatalog, patterns, relations, graphDigest: graph.digest });
  const catalogId = `DKC-${logicalDigest(["1.0.0", digest]).slice(5, 17).toUpperCase()}`;
  const audit = buildAudit({ digest, patterns, relations, sourceCatalog, graph });
  return {
    contractVersion: SCHEMA_VERSION,
    catalogId,
    version: "1.0.0",
    generatedAt: GENERATED_AT,
    priorCatalogId: null,
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

const main = async () => {
  const sourceCatalog = (await buildSourceCatalog()).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const facts = (await buildFacts()).sort((left, right) => left.factId.localeCompare(right.factId));
  const catalog = buildCatalog(facts, sourceCatalog);
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
