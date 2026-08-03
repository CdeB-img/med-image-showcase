import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const candidateDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(candidateDir, "../../../");
const readJson = (name) => JSON.parse(readFileSync(join(candidateDir, name), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};

const manifest = readJson("manifest.json");
const baseline = readJson("validation-baseline.json");
const concepts = readJson("concepts.json").concepts;
const assertions = readJson("assertions.json").assertions;
const relations = readJson("relations.json").relations;
const sources = readJson("sources.json").sources;
const evidenceLinks = readJson("evidence-links.json").evidence_links;
const validityDomains = readJson("validity-domains.json").validity_domains;
const limitations = readJson("limitations.json").limitations;
const controversies = readJson("controversies.json").controversies;
const ruleCandidates = readJson("interpretation-rule-candidates.json").interpretation_rule_candidates;
const decisionCandidates = readJson("decision-candidates.json").decision_candidates;
const objectivesHypotheses = readJson("objectives-hypotheses.json");
const verticalConditions = readJson("vertical-slice-conditions.json").vertical_slice_conditions;

const dataJsonNames = readdirSync(candidateDir)
  .filter((name) => name.endsWith(".json") && !["manifest.json", "validation-baseline.json"].includes(name))
  .sort();
const digestMaterial = dataJsonNames
  .map((name) => `${name}\n${JSON.stringify(canonicalize(readJson(name)))}\n`)
  .join("");
const computedDigest = sha256(digestMaterial);

const counts = {
  concepts: concepts.length,
  assertions: assertions.length,
  relations: relations.length,
  sources: sources.length,
  evidence_links: evidenceLinks.length,
  validity_domains: validityDomains.length,
  limitations: limitations.length,
  controversies: controversies.length,
  interpretation_rule_candidates: ruleCandidates.length,
  decision_candidates: decisionCandidates.length,
  objective_candidates: objectivesHypotheses.objective_candidates.length,
  hypothesis_candidates: objectivesHypotheses.hypothesis_candidates.length,
  vertical_slice_conditions: verticalConditions.length,
};
const allowedStances = new Set(["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "DERIVES", "CORRECTS", "RETRACTS"]);
const stanceCounts = Object.fromEntries([...allowedStances].map((stance) => [stance, evidenceLinks.filter((link) => link.relationType === stance).length]));
const decisionCounts = Object.fromEntries(["RETAINED", "ADAPTED", "EXCLUDED"].map((status) => [status, decisionCandidates.filter((item) => item.candidateClassification === status).length]));

if (process.argv.includes("--digest-only")) {
  process.stdout.write(`${computedDigest}\n`);
  process.exit(0);
}

const tests = [];
const test = (number, name, run) => {
  const errors = [];
  const expect = (condition, message) => { if (!condition) errors.push(message); };
  try { run(expect); } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  tests.push({ number, name, passed: errors.length === 0, errors });
};

const primaryIds = [
  ...concepts.flatMap((item) => [item.stableId, item.revisionId]),
  ...assertions.flatMap((item) => [item.stableId, item.revisionId]),
  ...sources.flatMap((item) => [item.stableId, item.revisionId]),
  ...relations.map((item) => item.relationId),
  ...evidenceLinks.map((item) => item.evidenceLinkId),
  ...validityDomains.map((item) => item.contextId),
  ...limitations.map((item) => item.limitationId),
  ...controversies.map((item) => item.controversyId),
  ...ruleCandidates.map((item) => item.ruleCandidateId),
  ...decisionCandidates.map((item) => item.decisionCandidateId),
  ...objectivesHypotheses.objective_candidates.map((item) => item.objectiveId),
  ...objectivesHypotheses.hypothesis_candidates.map((item) => item.hypothesisId),
  ...verticalConditions.map((item) => item.conditionId),
];
const sourceStableIds = new Set(sources.map((item) => item.stableId));
const sourceRevisionIds = new Set(sources.map((item) => item.revisionId));
const conceptIds = new Set(concepts.map((item) => item.stableId));
const assertionRevisionIds = new Set(assertions.map((item) => item.revisionId));
const evidenceIds = new Set(evidenceLinks.map((item) => item.evidenceLinkId));
const domainIds = new Set(validityDomains.map((item) => item.contextId));

const collectIdentifierValues = (value, key = "") => {
  if (Array.isArray(value)) return value.flatMap((item) => collectIdentifierValues(item, key));
  if (!value || typeof value !== "object") return /(?:Id|Ids|Refs|evidence)$/i.test(key) && typeof value === "string" ? [value] : [];
  return Object.entries(value).flatMap(([nestedKey, nested]) => collectIdentifierValues(nested, nestedKey));
};
const allData = { concepts, assertions, relations, sources, evidenceLinks, validityDomains, limitations, controversies, ruleCandidates, decisionCandidates, objectivesHypotheses, verticalConditions };

test(1, "Tous les identifiants primaires sont uniques", (expect) => {
  expect(primaryIds.every(Boolean), "Un identifiant primaire est vide.");
  expect(new Set(primaryIds).size === primaryIds.length, "Au moins un identifiant primaire est dupliqué.");
});

test(2, "Aucun identifiant bibliographique nu", (expect) => {
  const identifierValues = collectIdentifierValues(allData);
  const bare = identifierValues.filter((value) => /^R\d{2}$/.test(value));
  expect(bare.length === 0, `Identifiants nus trouvés : ${bare.join(", ")}`);
  const bibliographicIds = identifierValues.filter((value) => /REF-R\d{2}/.test(value));
  expect(bibliographicIds.every((value) => /PD002:REF-R\d{2}/.test(value)), "Une référence bibliographique n’utilise pas le namespace PD002.");
});

test(3, "Toutes les références d’assertion existent", (expect) => {
  for (const assertion of assertions) {
    for (const sourceRef of assertion.sourceRefs) expect(sourceStableIds.has(sourceRef), `${assertion.stableId} référence une source inconnue ${sourceRef}.`);
    expect(assertionRevisionIds.has(assertion.revisionId), `${assertion.stableId} ne possède pas de révision enregistrée.`);
  }
});

test(4, "Toutes les sources référencées existent", (expect) => {
  for (const link of evidenceLinks) expect(sourceRevisionIds.has(link.sourceRevisionId), `${link.evidenceLinkId} référence une révision de source inconnue.`);
  for (const collection of [concepts, validityDomains, limitations, controversies, objectivesHypotheses.hypothesis_candidates]) {
    for (const item of collection) for (const ref of item.sourceRefs ?? []) expect(sourceStableIds.has(ref), `${item.stableId ?? item.contextId ?? item.limitationId ?? item.controversyId ?? item.hypothesisId} référence ${ref}, absent des sources.`);
  }
});

test(5, "Toutes les stances de preuve sont autorisées", (expect) => {
  for (const link of evidenceLinks) expect(allowedStances.has(link.relationType), `${link.evidenceLinkId} utilise ${link.relationType}.`);
});

test(6, "MENTIONS reste distinct de SUPPORTS", (expect) => {
  expect(stanceCounts.MENTIONS > 0, "Aucun cas MENTIONS ne permet de vérifier la séparation.");
  const supportiveCount = evidenceLinks.filter((link) => link.relationType === "SUPPORTS").length;
  expect(supportiveCount === stanceCounts.SUPPORTS, "Le compte SUPPORTS inclut une autre stance.");
  expect(supportiveCount + stanceCounts.MENTIONS !== supportiveCount, "MENTIONS a été absorbé dans SUPPORTS.");
});

test(7, "Toutes les assertions ont un domaine existant", (expect) => {
  for (const assertion of assertions) expect(domainIds.has(assertion.validityDomainId), `${assertion.stableId} a un domaine absent.`);
});

test(8, "Toutes les règles candidates restent inactives", (expect) => {
  expect(ruleCandidates.length === 6, "Le paquet ne contient pas exactement six règles SCI candidates.");
  for (const rule of ruleCandidates) {
    expect(rule.status === "HUMAN_REVIEW_REQUIRED", `${rule.ruleCandidateId} a un statut de revue incorrect.`);
    expect(rule.activationStatus === "NOT_ACTIVATED", `${rule.ruleCandidateId} est activée.`);
    expect(rule.executable === false, `${rule.ruleCandidateId} est exécutable.`);
  }
});

test(9, "Aucun protocole, ordre, dose ou paramètre scanner", (expect) => {
  const forbiddenKeys = new Set(["protocol", "protocolId", "protocolSteps", "sequenceOrder", "acquisitionOrder", "dose", "scannerParameter", "scannerParameters"]);
  const forbiddenTypes = new Set(["Protocol", "ExecutableProtocol", "SequenceOrder", "AcquisitionInstruction"]);
  const inspect = (value, path = "root") => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      expect(!forbiddenKeys.has(key), `Champ interdit ${path}.${key}.`);
      if (["recordType", "objectType", "type"].includes(key) && typeof nested === "string") expect(!forbiddenTypes.has(nested), `Objet interdit ${nested} dans ${path}.`);
      inspect(nested, `${path}.${key}`);
    }
  };
  inspect(allData);
});

test(10, "Aucun seuil universel non borné", (expect) => {
  const numericThresholds = [];
  const inspect = (value, path = "root") => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      if (/threshold|seuil/i.test(key) && typeof nested === "number") numericThresholds.push(`${path}.${key}`);
      inspect(nested, `${path}.${key}`);
    }
  };
  inspect(allData);
  expect(numericThresholds.length === 0, `Seuils numériques non bornés : ${numericThresholds.join(", ")}`);
});

test(11, "Aucun statut fictif de revue humaine", (expect) => {
  const inspect = (value, path = "root") => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      if (key === "humanReviewed") expect(nested === false, `${path}.${key} doit rester false.`);
      if (key === "scientificHumanReview" || key === "human_review") expect(nested === null, `${path}.${key} doit rester null.`);
      inspect(nested, `${path}.${key}`);
    }
  };
  inspect({ ...allData, manifest });
  expect(manifest.review_status === "HUMAN_REVIEW_REQUIRED", "Le manifeste ne demande pas de revue humaine.");
});

test(12, "Aucune conclusion d’évaluation PD-011", (expect) => {
  const serialized = JSON.stringify(allData);
  expect(!/PASS[ _-]?PD[ _-]?011/i.test(serialized), "Une conclusion d’évaluation PD-011 est présente.");
  expect(!/PD011[^\n\"]*(PASSED|VALIDATED)/i.test(serialized), "Un statut positif PD-011 est présent.");
});

test(13, "Aucun objet Gate ou Stop", (expect) => {
  const forbidden = [];
  const inspect = (value, path = "root") => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      if (["recordType", "objectType", "entityType"].includes(key) && ["Gate", "Stop"].includes(nested)) forbidden.push(`${path}.${key}`);
      inspect(nested, `${path}.${key}`);
    }
  };
  inspect(allData);
  expect(forbidden.length === 0, `Objets interdits : ${forbidden.join(", ")}`);
});

test(14, "Aucune décision D0–D16 convertie en règle", (expect) => {
  expect(decisionCandidates.length === 17, "La matrice ne contient pas les 17 décisions sources.");
  const expectedIds = Array.from({ length: 17 }, (_, index) => `PD002:D${index}`);
  expect(expectedIds.every((id) => decisionCandidates.some((item) => item.sourceDecisionId === id)), "Une décision source manque.");
  for (const decision of decisionCandidates) {
    expect(decision.convertedToRule === false, `${decision.sourceDecisionId} est convertie en règle.`);
    expect(decision.executable === false, `${decision.sourceDecisionId} est exécutable.`);
  }
});

test(15, "Digest reproductible et manifeste cohérent", (expect) => {
  const secondDigest = sha256(dataJsonNames.map((name) => `${name}\n${JSON.stringify(canonicalize(readJson(name)))}\n`).join(""));
  expect(computedDigest === secondDigest, "Deux calculs successifs diffèrent.");
  expect(manifest.digest.value === computedDigest, `Digest manifeste ${manifest.digest.value} différent du digest calculé ${computedDigest}.`);
  expect(Object.entries(counts).every(([key, value]) => manifest.included_object_counts[key] === value), "Les comptes du manifeste ne correspondent pas aux données.");
});

test(16, "Reasoning Book maître inchangé", (expect) => {
  const path = "output/documents/noxia-protocol-designer-reasoning-book-pd-002-fabry.docx";
  expect(sha256(readFileSync(join(repoRoot, path))) === baseline.authority_file_sha256[path], "Le Reasoning Book maître a changé.");
});

test(17, "PD-003, PD-007, PD-009 et PD-011 inchangés", (expect) => {
  for (const [path, expected] of Object.entries(baseline.authority_file_sha256).filter(([path]) => path.startsWith("docs/"))) {
    expect(sha256(readFileSync(join(repoRoot, path))) === expected, `${path} a changé.`);
  }
});

test(18, "Aucune dépendance à PD-008", (expect) => {
  const jsonNames = readdirSync(candidateDir).filter((name) => name.endsWith(".json"));
  const jsonText = jsonNames.map((name) => readFileSync(join(candidateDir, name), "utf8")).join("\n");
  expect(!/PD-008|PD008/.test(jsonText), "Une dépendance ou référence PD-008 apparaît dans les données JSON.");
  expect(Array.isArray(manifest.runtime_imports) && manifest.runtime_imports.length === 0, "Le manifeste contient un import d’exécution.");
});

test(19, "Intégrité référentielle complémentaire", (expect) => {
  const sourceStableIdByRevisionId = new Map(sources.map((source) => [source.revisionId, source.stableId]));
  for (const link of evidenceLinks) expect(assertionRevisionIds.has(link.assertionRevisionId), `${link.evidenceLinkId} référence une assertion absente.`);
  for (const assertion of assertions) {
    const linkedSourceStableIds = new Set(evidenceLinks
      .filter((link) => link.assertionRevisionId === assertion.revisionId)
      .map((link) => sourceStableIdByRevisionId.get(link.sourceRevisionId)));
    for (const sourceRef of assertion.sourceRefs) expect(linkedSourceStableIds.has(sourceRef), `${assertion.stableId} déclare ${sourceRef} sans EvidenceLink correspondant.`);
  }
  for (const relation of relations) {
    expect(conceptIds.has(relation.sourceId), `${relation.relationId} a une source conceptuelle absente.`);
    expect(conceptIds.has(relation.targetId), `${relation.relationId} a une cible conceptuelle absente.`);
    for (const id of relation.evidenceLinkIds) expect(evidenceIds.has(id), `${relation.relationId} référence une preuve absente ${id}.`);
  }
  for (const rule of ruleCandidates) {
    expect(domainIds.has(rule.validityDomainId), `${rule.ruleCandidateId} a un domaine absent.`);
    for (const id of rule.assertionRevisionIds) expect(assertionRevisionIds.has(id), `${rule.ruleCandidateId} référence une assertion absente.`);
    for (const id of rule.evidenceLinkIds) expect(evidenceIds.has(id), `${rule.ruleCandidateId} référence une preuve absente.`);
  }
  for (const decision of decisionCandidates) {
    expect(domainIds.has(decision.validityDomainId), `${decision.sourceDecisionId} a un domaine absent.`);
    for (const id of decision.evidence) expect(sourceStableIds.has(id) || evidenceIds.has(id), `${decision.sourceDecisionId} référence ${id}, absent.`);
  }
});

const failed = tests.filter((item) => !item.passed);
const report = {
  package_id: manifest.package_id,
  package_status: manifest.package_status,
  review_status: manifest.review_status,
  activation_status: manifest.activation_status,
  digest: computedDigest,
  digest_files: dataJsonNames.map((name) => relative(repoRoot, join(candidateDir, name))),
  counts,
  evidence_links_by_stance: stanceCounts,
  decisions_by_classification: decisionCounts,
  validations: { total: tests.length, passed: tests.length - failed.length, failed: failed.length, tests },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
