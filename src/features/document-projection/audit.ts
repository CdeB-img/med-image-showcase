import { logicalDigest, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type {
  DocumentProjection,
  DocumentProjectionAuditCode,
  DocumentProjectionAuditFinding,
  DocumentProjectionAuditResult,
  DocumentProjectionRequest,
} from "./types";

type MutationChecks = {
  projectUnchanged: boolean;
  templateUnchanged: boolean;
};

const finding = (
  code: DocumentProjectionAuditCode,
  severity: DocumentProjectionAuditFinding["severity"],
  subjectId: string,
  message: string,
  evidenceRefs: readonly string[] = [],
): DocumentProjectionAuditFinding => ({
  findingId: `DOC001B-FINDING:${logicalDigest({ code, subjectId, message, evidenceRefs }).slice(5, 17).toUpperCase()}`,
  code,
  severity,
  subjectId,
  message,
  evidenceRefs: uniqueSorted([...evidenceRefs]),
});

const result = (subjectId: string, findings: DocumentProjectionAuditFinding[]): DocumentProjectionAuditResult => {
  const ordered = [...findings].sort((left, right) => left.findingId.localeCompare(right.findingId));
  return {
    auditVersion: "DOC-001B-AUDIT-1.0.0",
    subjectId,
    findings: ordered,
    counts: {
      ERROR: ordered.filter((item) => item.severity === "ERROR").length,
      WARNING: ordered.filter((item) => item.severity === "WARNING").length,
      INFORMATION: ordered.filter((item) => item.severity === "INFORMATION").length,
    },
    passed: !ordered.some((item) => item.severity === "ERROR"),
    boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX",
  };
};

export const auditDocumentProjection = (
  request: Readonly<DocumentProjectionRequest> | null | undefined,
  projection?: Readonly<DocumentProjection> | null,
  mutationChecks: MutationChecks = { projectUnchanged: true, templateUnchanged: true },
): DocumentProjectionAuditResult => {
  const findings: DocumentProjectionAuditFinding[] = [];
  const subjectId = projection?.projectionId ?? request?.templateContext?.instance.instanceId ?? "DOC-001B:UNRESOLVED_INPUT";
  const context = request?.templateContext;
  if (!context?.instance) {
    findings.push(finding("DOC_WITHOUT_TEMPLATE_INSTANCE", "ERROR", subjectId, "Le nouveau parcours DOC-001B exige une StudyTemplateInstance existante."));
    return result(subjectId, findings);
  }

  const { instance, definition } = context;
  const project = request.project;
  if (
    instance.inputRefs.researchProjectId !== project.documentHandoff.projectId
    || instance.inputRefs.researchProjectVersion !== project.candidateVersion.versionId
  ) findings.push(finding(
    "DOC_TEMPLATE_PROJECT_MISMATCH",
    "ERROR",
    instance.instanceId,
    "L’instance TMP et le Research Project ne désignent pas la même identité/version.",
    [instance.inputRefs.researchProjectId, instance.inputRefs.researchProjectVersion, project.documentHandoff.projectId, project.candidateVersion.versionId],
  ));

  if (
    instance.inputRefs.researchProjectDigest !== project.resultDigest
    || instance.templateId !== definition.templateId
    || instance.templateVersion !== definition.templateVersion
    || instance.templateRevision !== definition.templateRevision
    || !instance.provenance.includes(definition.digest)
    || request.regulatoryResolutionRef.resolutionId !== instance.inputRefs.regulatoryResolutionId
    || request.regulatoryResolutionRef.corpusVersion !== instance.inputRefs.regulatoryCorpusVersion
    || request.regulatoryResolutionRef.corpusDigest !== instance.inputRefs.regulatoryCorpusDigest
    || request.documentaryPatternSnapshotRef.catalogId !== instance.inputRefs.documentaryCatalogId
    || request.documentaryPatternSnapshotRef.catalogVersion !== instance.inputRefs.documentaryCatalogVersion
    || request.documentaryPatternSnapshotRef.catalogDigest !== instance.inputRefs.documentaryCatalogDigest
  ) findings.push(finding(
    "DOC_TEMPLATE_DIGEST_MISMATCH",
    "ERROR",
    instance.instanceId,
    "Les digests ou versions Project/Template/REG/DOC-002 ne correspondent pas aux références figées dans l’instance TMP.",
    [project.resultDigest, instance.inputRefs.researchProjectDigest, definition.digest, ...instance.provenance],
  ));

  projection?.sections.forEach((section) => {
    if (!section.templateNodeIds.length) findings.push(finding("DOC_SECTION_WITHOUT_TEMPLATE_NODE", "ERROR", section.sectionId, "La section DOC ne référence aucun nœud TMP."));
    const hasSubstantiveContent = section.blocks.some((block) => block.kind !== "EMPTY_STATE" && block.items.length > 0);
    if (hasSubstantiveContent && !section.projectObjectIds.length) findings.push(finding("DOC_CONTENT_WITHOUT_PROJECT_SOURCE", "ERROR", section.sectionId, "Un contenu documentaire ne référence aucun objet du Research Project."));
    if (section.requirementIds.length && !section.provenanceRefs.includes(request.regulatoryResolutionRef.resolutionId)) findings.push(finding("DOC_REQUIREMENT_WITHOUT_REG_SOURCE", "ERROR", section.sectionId, "Des exigences sont projetées sans référence à la résolution REG-001."));
    if (section.patternIds.length && !section.provenanceRefs.includes(request.documentaryPatternSnapshotRef.catalogId)) findings.push(finding("DOC_PATTERN_WITHOUT_DOC002_SOURCE", "ERROR", section.sectionId, "Des patterns sont utilisés sans référence au snapshot DOC-002."));
    if (section.templateStatus === "UNKNOWN" && !["UNKNOWN", "BLOCKED"].includes(section.status)) findings.push(finding("TMP_UNKNOWN_STRENGTHENED", "ERROR", section.sectionId, "Un statut TMP UNKNOWN a été renforcé dans DOC.", [section.status]));
    if (section.templateStatus === "BLOCKED" && section.status !== "BLOCKED") findings.push(finding("TMP_BLOCKED_BYPASSED", "ERROR", section.sectionId, "Un bloc TMP BLOCKED a été rendu disponible dans DOC.", [section.status]));
    if (section.templateStatus === "FUTURE" && section.status !== "FUTURE") findings.push(finding("TMP_FUTURE_SIMULATED", "ERROR", section.sectionId, "Un bloc TMP FUTURE a été simulé comme capacité présente.", [section.status]));
    if (section.conflicts.length && section.status !== "BLOCKED") findings.push(finding("CONFLICT_HIDDEN", "ERROR", section.sectionId, "Un conflit TMP visible n’a pas bloqué la section DOC.", section.conflicts));
  });

  if (!mutationChecks.projectUnchanged) findings.push(finding("PROJECT_MUTATED", "ERROR", subjectId, "DOC-001B a muté le Research Project."));
  if (!mutationChecks.templateUnchanged) findings.push(finding("TEMPLATE_MUTATED", "ERROR", subjectId, "DOC-001B a muté la StudyTemplateInstance ou sa définition."));
  if (!instance.inputMutationChecks.reg001Unchanged) findings.push(finding("REG_MUTATED", "ERROR", subjectId, "L’instance TMP signale une mutation de REG-001."));
  if (!instance.inputMutationChecks.doc002Unchanged) findings.push(finding("DOC002_MUTATED", "ERROR", subjectId, "L’instance TMP signale une mutation de DOC-002."));
  return result(subjectId, findings);
};
