import { logicalDigest, uniqueSorted } from "../knowledge-engine/canonical.js";
import type { ProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone.js";
import { documentNativeIdentity, documentNativeProject, type DocumentGenerationBody, type DocumentGenerationRef } from "./generation-persistence.js";
import { documentTextSha256 } from "./document-text-sha256.js";

export type DocumentImpact = Readonly<{
  nativeDocumentRef: string; title: string;
  state: "CURRENT_BINDING" | "EDITORIALLY_MODIFIED" | "POTENTIALLY_OUTDATED" | "REFERENCED_STATE_UNCHANGED" | "UNKNOWN";
  reasons: readonly string[]; affectedSourceRefs: readonly string[];
  coverage: "SOURCE_REFERENCES_ONLY" | "UNAVAILABLE";
}>;
export type DocumentImpactReport = Readonly<{
  generationId: string; currentProjectDigest: string; projectCurrent: boolean; documents: readonly DocumentImpact[];
  knownAffectedCount: number; exhaustiveAffectedCount: null;
  pendingScientificChange: boolean; unassessedDraft: boolean;
  boundary: "READ_ONLY_DEPENDENCY_IMPACT_NOT_SEMANTIC_CERTIFICATION";
}>;
const labels: Record<string, string> = { ENDPOINT: "Critère de jugement", POPULATION: "Population", STUDY_DESIGN: "Plan d’étude",
  CANONICAL_VARIABLE: "Variable", VISIT: "Visite", IMAGING_MODALITY: "Imagerie", ACQUISITION: "Acquisition" };

/** Reuse PRJ's exact version-history references and DOC's section references.
 * No text similarity, lexical scientific classifier or automatic propagation.
 * A section reference is NOT proof of exhaustive prose dependency coverage. */
export const inspectDocumentImpact = async (input: { source: { ref: DocumentGenerationRef; body: DocumentGenerationBody };
  currentProject: Readonly<ProjectContextSnapshot>; pendingScientificChange?: boolean; unassessedDraft?: boolean }): Promise<DocumentImpactReport> => {
  const { ref, body } = input.source, current = input.currentProject;
  const { snapshotDigest, ...snapshot } = current;
  const nativeProject = documentNativeProject(body.native);
  const sourceBinding = { projectId: nativeProject.projectId, projectVersion: nativeProject.projectVersion, projectDigest: nativeProject.projectDigest };
  const archivedBinding = { projectId: ref.project.projectId, projectVersion: ref.project.projectVersion, projectDigest: ref.project.projectDigest };
  if (ref.persistenceState !== "COMMITTED" || documentNativeIdentity(body.native) !== ref.generationId
    || ref.bodySha256 !== await documentTextSha256(JSON.stringify(body))
    || ref.bodyBytes !== new TextEncoder().encode(JSON.stringify(body)).byteLength
    || logicalDigest(sourceBinding) !== logicalDigest(archivedBinding)
    || nativeProject.projectId !== current.sourceProjectRef || current.owner !== "RESEARCH_PROJECT" || !current.readOnly
    || logicalDigest(snapshot) !== snapshotDigest) throw new Error("DOC_IMPACT_SOURCE_BINDING_INVALID");
  const projectCurrent = nativeProject.projectDigest === current.sourceProjectDigest && nativeProject.projectVersion === current.sourceProjectVersion;
  const base = current.versionHistory.find(version => version.versionId === nativeProject.projectVersion);
  const now = current.versionHistory.find(version => version.versionId === current.sourceProjectVersion);
  const objects = [...current.objects, ...current.historicalObjectVersions];
  const relations = [...current.relations, ...current.historicalRelationVersions];
  const times = [...current.temporalQualifications, ...current.historicalTemporalQualificationVersions];
  const occasions = [...current.expectedVariableOccasions, ...current.historicalExpectedVariableOccasionVersions];
  const changes = new Map<string, string>();
  let historyComplete = Boolean(base && now);
  if (base && now) {
    const diff = <T extends { versionRef: string }>(before: readonly string[], after: readonly string[], values: readonly T[], refs: (value: T) => readonly string[], reason: (value: T) => string) => {
      for (const versionRef of uniqueSorted([...before, ...after].filter(value => before.includes(value) !== after.includes(value)))) {
        const value = values.find(item => item.versionRef === versionRef);
        if (!value) { historyComplete = false; continue; }
        for (const sourceRef of refs(value)) changes.set(sourceRef, reason(value));
      }
    };
    diff(base.objectVersionRefs, now.objectVersionRefs, objects, object => [object.stableId], object => `${labels[object.type] ?? "Objet scientifique"} : référence gouvernée révisée.`);
    diff(base.relationVersionRefs, now.relationVersionRefs, relations, relation => [relation.sourceProjectRef, relation.targetProjectRef], () => "Dépendance scientifique révisée.");
    diff(base.temporalQualificationVersionRefs, now.temporalQualificationVersionRefs, times, time => [time.subjectProjectRef], () => "Temporalité ou fenêtre de mesure révisée.");
    diff(base.expectedVariableOccasionVersionRefs, now.expectedVariableOccasionVersionRefs, occasions, occasion => [occasion.variableProjectRef], () => "Occasion de mesure révisée.");
    // Legacy temporal payload has no comparable native dependency in this view.
    if (logicalDigest(base.legacyTemporalVersionRefs) !== logicalDigest(now.legacyTemporalVersionRefs)) historyComplete = false;
  }
  const referencedRelations = relations.filter(relation => base?.relationVersionRefs.includes(relation.versionRef) || now?.relationVersionRefs.includes(relation.versionRef));
  const dependent = new Set(changes.keys());
  // Conservative reachability through already governed bindings. This is an
  // impact warning only; it does not assert that an edit must be propagated.
  let growing = true;
  while (growing) {
    growing = false;
    for (const relation of referencedRelations) {
      if (dependent.has(relation.sourceProjectRef) && !dependent.has(relation.targetProjectRef)) { dependent.add(relation.targetProjectRef); growing = true; }
      if (dependent.has(relation.targetProjectRef) && !dependent.has(relation.sourceProjectRef)) { dependent.add(relation.sourceProjectRef); growing = true; }
    }
  }
  const pack = body.native.family === "DRCI" ? body.native.value : null;
  const nativeDocuments = pack ? pack.documents.map(document => ({ nativeDocumentRef: document.kind, title: document.title,
    refs: uniqueSorted([...document.sections.flatMap(section => section.sourceRefs), ...(document.kind === "CRF" ? pack.crfRows.map(row => row.variableRef) : [])]),
    editorial: pack.humanRevision?.scientificImpact === "DOCUMENT_ONLY" && Boolean(pack.humanRevision.entries.some(entry => entry.document === document.kind)) }))
    : [{ nativeDocumentRef: body.native.family === "TEMPLATE" ? body.native.value.documentDefinition?.documentId ?? body.native.value.projectionType : "",
      title: body.native.family === "TEMPLATE" ? body.native.value.title : "", refs: body.native.family === "TEMPLATE" ? uniqueSorted(body.native.value.sections.flatMap(section => section.projectObjectIds)) : [],
      editorial: body.native.family === "TEMPLATE" && Boolean(body.native.value.documentaryRevision) }];
  const documents = nativeDocuments.map(document => {
    const affectedSourceRefs = document.refs.filter(sourceRef => dependent.has(sourceRef));
    const state: DocumentImpact["state"] = projectCurrent ? document.editorial ? "EDITORIALLY_MODIFIED" : "CURRENT_BINDING"
      : affectedSourceRefs.length ? "POTENTIALLY_OUTDATED" : historyComplete && document.refs.length ? "REFERENCED_STATE_UNCHANGED" : "UNKNOWN";
    const reasons = projectCurrent ? [document.editorial ? "Révision documentaire humaine conservée, liée au projet courant." : "La version source correspond au projet courant ; cela ne certifie pas sa qualité scientifique."]
      : affectedSourceRefs.length ? uniqueSorted(affectedSourceRefs.map(sourceRef => changes.get(sourceRef) ?? "Dépendance liée à un élément scientifique révisé."))
        : [state === "REFERENCED_STATE_UNCHANGED" ? "Aucune modification détectée dans les références présentes. La couverture des dépendances de la prose reste partielle."
          : "Historique ou références insuffisants pour attribuer précisément l’impact ; aucune compatibilité supposée."];
    return { nativeDocumentRef: document.nativeDocumentRef, title: document.title, state, reasons, affectedSourceRefs,
      coverage: document.refs.length ? "SOURCE_REFERENCES_ONLY" as const : "UNAVAILABLE" as const };
  });
  return { generationId: ref.generationId, currentProjectDigest: current.sourceProjectDigest, projectCurrent, documents,
    knownAffectedCount: documents.filter(document => document.state === "POTENTIALLY_OUTDATED").length,
    exhaustiveAffectedCount: null, pendingScientificChange: input.pendingScientificChange ?? false, unassessedDraft: input.unassessedDraft ?? false,
    boundary: "READ_ONLY_DEPENDENCY_IMPACT_NOT_SEMANTIC_CERTIFICATION" };
};
