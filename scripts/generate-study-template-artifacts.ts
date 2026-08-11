import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { makeFrozenImagingResult } from "@/features/research-project-construction/__tests__/fixtures";
import {
  auditStudyTemplateInstance,
  composeStudyTemplateInstance,
  createStudyTemplateCatalog,
  exportStudyTemplates,
  stableTemplateStringify,
  templateDigest,
} from "@/features/study-template";
import { makeTemplateDecision, makeTemplateInput } from "@/features/study-template/__tests__/fixtures";

const OUTPUT_ROOT = resolve(process.cwd(), "study-template-engine/tmp-001");
const GENERATED_AT = "2026-08-11T12:00:00.000Z";
const checkOnly = process.argv.includes("--check");
const fixtureBoundary = {
  dataStatus: "ILLUSTRATIVE_TECHNICAL_FIXTURE_NOT_SCIENTIFIC_CORPUS",
  notice: "Ces instances prouvent les contrats TMP-001. Elles ne décrivent aucune étude réelle et ne valent ni protocole, ni recommandation, ni qualification réglementaire.",
};

const genericProject = {
  question: "Question scientifique de fixture à structurer, sans usage clinique.",
  outcomes: ["outcome de fixture"],
  population: ["population de fixture"],
  pathology: ["condition de fixture"],
  assertions: [],
};

const conflictDecisions = [
  makeTemplateDecision("fixture:conflict:required", ["TMP-DOC:RISK_PLAN"], "REQUIRED"),
  makeTemplateDecision("fixture:conflict:optional", ["TMP-DOC:RISK_PLAN"], "OPTIONAL"),
];
const statusDecisions = [
  makeTemplateDecision("fixture:required", ["TMP-DOC:PROTOCOL"], "REQUIRED"),
  makeTemplateDecision("fixture:optional", ["TMP-NODE:REVIEW_NOTES"], "OPTIONAL"),
  makeTemplateDecision("fixture:not-applicable", ["TMP-DOC:PATIENT_INFORMATION"], "NOT_APPLICABLE"),
  makeTemplateDecision("fixture:blocked", ["TMP-DOC:CORE_LAB_MANUAL"], "BLOCKED"),
  makeTemplateDecision("fixture:conditional", ["TMP-DOC:SYNOPSIS"], "CONDITIONAL"),
];

const imagingResult = makeFrozenImagingResult();
const inputs = [
  makeTemplateInput({ projectOptions: genericProject }),
  makeTemplateInput({ projectOptions: { ...genericProject, imagingResult }, phrc: true }),
  makeTemplateInput({ projectOptions: genericProject, declaredUnknowns: [{ unknownId: "fixture:unknown:endpoint", field: "endpoint.primary", reason: "Critère de fixture non arrêté.", provenance: ["TMP-001:TEST_FIXTURE"] }] }),
  makeTemplateInput({ projectOptions: genericProject, humanDecisions: conflictDecisions }),
  makeTemplateInput({ projectOptions: genericProject, humanDecisions: statusDecisions }),
  { ...makeTemplateInput({ projectOptions: genericProject }), requestedDetailLevel: "MINIMAL" as const },
].map((input) => ({
  ...input,
  declaredLimitations: [
    ...(input.declaredLimitations ?? []),
    { limitationId: "TMP-LIMITATION:ILLUSTRATIVE_FIXTURE", reason: fixtureBoundary.notice, provenance: [fixtureBoundary.dataStatus] },
  ],
}));

const instances = inputs.map(composeStudyTemplateInstance);
const catalog = createStudyTemplateCatalog(GENERATED_AT, instances);
const audits = instances.map((instance) => auditStudyTemplateInstance(instance));
const exported = exportStudyTemplates(catalog, instances, GENERATED_AT);

const artifacts: Record<string, unknown> = {
  "study-template-catalog.json": catalog,
  "template-families.json": { ...fixtureBoundary, contractVersion: catalog.contractVersion, catalogId: catalog.catalogId, families: catalog.families },
  "template-graph.json": catalog.graph,
  "template-instances.json": { ...fixtureBoundary, contractVersion: catalog.contractVersion, generatedAt: GENERATED_AT, instances },
  "template-statistics.json": catalog.statistics,
  "template-audit.json": { auditVersion: "TMP-001-AUDIT-1.0.0", catalogAudit: catalog.audit, instanceAudits: audits, passed: catalog.audit.passed && audits.every((audit) => audit.passed), boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX" },
  "requirement-mapping.json": { ...fixtureBoundary, instances: instances.map((instance) => ({ instanceId: instance.instanceId, mappings: instance.requirementMapping })) },
  "pattern-mapping.json": { ...fixtureBoundary, instances: instances.map((instance) => ({ instanceId: instance.instanceId, mappings: instance.patternMapping })) },
  "document-mapping.json": { ...fixtureBoundary, instances: instances.map((instance) => ({ instanceId: instance.instanceId, mappings: instance.documents })) },
  "dependency-graph.json": { ...fixtureBoundary, instances: instances.map((instance) => ({ instanceId: instance.instanceId, graph: instance.dependencyGraph })) },
  "readiness-graph.json": { ...fixtureBoundary, notice: "LOCAL_TEMPLATE_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_READINESS", instances: instances.map((instance) => ({ instanceId: instance.instanceId, graph: instance.readinessGraph })) },
  "structured-export.json": exported,
  "export-manifest.json": {
    ...fixtureBoundary,
    contractVersion: catalog.contractVersion,
    engineVersion: instances[0].engineVersion,
    generatedAt: GENERATED_AT,
    files: [],
    nextArchitecturalStep: "VAL-001_NOT_IMPLEMENTED",
    boundary: "MACHINE_READABLE_LOGICAL_STRUCTURE_ONLY_NO_DOCUMENT",
  },
};

const pretty = (value: unknown) => `${JSON.stringify(JSON.parse(stableTemplateStringify(value)), null, 2)}\n`;
const manifest = artifacts["export-manifest.json"] as { files: Array<{ path: string; digest: string }> };
manifest.files = Object.entries(artifacts)
  .filter(([name]) => name !== "export-manifest.json")
  .map(([name, value]) => ({ path: name, digest: templateDigest(value) }))
  .sort((left, right) => left.path.localeCompare(right.path));

if (!checkOnly) mkdirSync(OUTPUT_ROOT, { recursive: true });
let mismatch = false;
for (const [name, value] of Object.entries(artifacts).sort(([left], [right]) => left.localeCompare(right))) {
  const path = resolve(OUTPUT_ROOT, name);
  const expected = pretty(value);
  if (checkOnly) {
    let actual = "";
    try { actual = readFileSync(path, "utf8"); } catch { actual = ""; }
    if (actual !== expected) {
      mismatch = true;
      process.stderr.write(`OUTDATED_STUDY_TEMPLATE_ARTIFACT:${name}\n`);
    }
  } else {
    writeFileSync(path, expected, "utf8");
  }
}

if (mismatch) process.exitCode = 1;
else process.stdout.write(`${checkOnly ? "STUDY_TEMPLATE_ARTIFACTS_CURRENT" : "STUDY_TEMPLATE_ARTIFACTS_GENERATED"}:${Object.keys(artifacts).length}\n`);
