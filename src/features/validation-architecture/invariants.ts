import type { ValidationErrorCode, ValidationInvariant } from "./types";

export const VALIDATION_INVARIANTS: readonly ValidationInvariant[] = Object.freeze([
  { invariantId: "VAL-C01", statement: "Original request traceable.", description: "La demande originale demeure reliée à chaque représentation qui en dépend.", owner: "NOXIA_PRODUCT", authorityRefs: ["Charte", "PD-003", "RDE-002"] },
  { invariantId: "VAL-C02", statement: "Explicit object never silently lost.", description: "Un objet explicite ne disparaît pas sans diagnostic et justification.", owner: "PD-003", authorityRefs: ["PD-003", "PD-011"] },
  { invariantId: "VAL-C03", statement: "Critical relation never silently lost.", description: "Une relation critique reste reconstructible à travers les handoffs.", owner: "PD-003", authorityRefs: ["PD-003", "RDE-002"] },
  { invariantId: "VAL-C04", statement: "Unknown remains unknown unless a valid source/decision changes it.", description: "Une inconnue ne peut être renforcée ou supprimée sans source ou décision valide.", owner: "NOXIA_PRODUCT", authorityRefs: ["Charte", "PD-003", "PD-011"] },
  { invariantId: "VAL-C05", statement: "Contradiction remains visible.", description: "Une contradiction reste ouverte jusqu’à une résolution documentée et autorisée.", owner: "PD-003", authorityRefs: ["PD-003", "PD-009", "PD-011"] },
  { invariantId: "VAL-C06", statement: "Decision IDs and versions preserved.", description: "Les décisions humaines conservent identité, version, statut et provenance.", owner: "HUMAN_DECISION_ENVELOPE", authorityRefs: ["PD-003", "PD-009", "SYS-001B"] },
  { invariantId: "VAL-C07", statement: "Provenance remains reconstructible.", description: "Toute transformation conserve un chemin de provenance vérifiable.", owner: "NOXIA_PRODUCT", authorityRefs: ["PD-003", "PD-011", "KE-001"] },
  { invariantId: "VAL-C08", statement: "Engine ownership preserved.", description: "Un moteur consommateur ne s’attribue pas la responsabilité du moteur source.", owner: "RDE-001", authorityRefs: ["RDE-001", "RDE-002", "RDE-003"] },
  { invariantId: "VAL-C09", statement: "Project remains source of project truth.", description: "Le Research Project reste la seule source de vérité d’un projet particulier.", owner: "RESEARCH_PROJECT", authorityRefs: ["RDE-001", "RDE-002"] },
  { invariantId: "VAL-C10", statement: "REG remains owner of requirement applicability.", description: "L’applicabilité d’une Requirement n’est ni recalculée ni possédée en aval de REG-001.", owner: "REG-001", authorityRefs: ["REG-001", "DOC-001B"] },
  { invariantId: "VAL-C11", statement: "DOC-002 remains owner of documentary patterns.", description: "Un Documentary Pattern conserve son statut, ses limites et son owner DOC-002.", owner: "DOC-002", authorityRefs: ["DOC-002", "TMP-001"] },
  { invariantId: "VAL-C12", statement: "TMP remains structural composition only.", description: "TMP-001 possède la structure logique sans produire contenu ou validation.", owner: "TMP-001", authorityRefs: ["TMP-001", "DOC-001B"] },
  { invariantId: "VAL-C13", statement: "DOC remains projection only.", description: "DOC-001 projette sans devenir source scientifique ou projet.", owner: "DOC-001", authorityRefs: ["RDE-001", "DOC-001", "DOC-001B"] },
  { invariantId: "VAL-C14", statement: "Renderer change does not change science.", description: "Une variation de renderer ne modifie aucun contenu scientifique logique.", owner: "DOC-001", authorityRefs: ["PD-011", "DOC-001B"] },
  { invariantId: "VAL-C15", statement: "Missing engine never simulated.", description: "Une capacité absente reste absente, bloquée ou future.", owner: "RDE-001", authorityRefs: ["RDE-001", "RDE-002"] },
  { invariantId: "VAL-C16", statement: "NOT_APPLICABLE never becomes applicable silently.", description: "Un statut non applicable ne peut être renforcé sans événement explicite.", owner: "NOXIA_PRODUCT", authorityRefs: ["PD-003", "RDE-002"] },
  { invariantId: "VAL-C17", statement: "FUTURE never becomes implemented silently.", description: "Une capacité future n’est jamais présentée comme implémentée sans preuve distincte.", owner: "NOXIA_PRODUCT", authorityRefs: ["RDE-001", "PD-011"] },
  { invariantId: "VAL-C18", statement: "Same source/version/policy gives same validation result.", description: "Les mêmes entrées logiques et versions produisent le même digest de validation.", owner: "VAL-000", authorityRefs: ["PD-009", "PD-011", "KE-001"] },
]);

export const VALIDATION_INVARIANT_IDS = VALIDATION_INVARIANTS.map((invariant) => invariant.invariantId);

export const getValidationInvariant = (invariantId: string) => VALIDATION_INVARIANTS.find((invariant) => invariant.invariantId === invariantId) ?? null;

export const ERROR_CODE_INVARIANTS: Readonly<Record<ValidationErrorCode, string[]>> = Object.freeze({
  OBJECT_LOST: ["VAL-C02"], RELATION_LOST: ["VAL-C03"], OBJECT_ADDED_WITHOUT_SOURCE: ["VAL-C02", "VAL-C07"], RELATION_ADDED_WITHOUT_SOURCE: ["VAL-C03", "VAL-C07"],
  UNKNOWN_STRENGTHENED: ["VAL-C04"], UNKNOWN_REMOVED: ["VAL-C04"], CONTRADICTION_HIDDEN: ["VAL-C05"], CONTRADICTION_RESOLVED_WITHOUT_DECISION: ["VAL-C05", "VAL-C06"],
  DECISION_LOST: ["VAL-C06"], DECISION_RECREATED: ["VAL-C06"], DECISION_STATUS_CHANGED: ["VAL-C06"], PROVENANCE_LOST: ["VAL-C01", "VAL-C07"],
  SOURCE_VERSION_MISMATCH: ["VAL-C07", "VAL-C18"], DIGEST_MISMATCH: ["VAL-C07", "VAL-C18"], OWNERSHIP_VIOLATION: ["VAL-C08", "VAL-C09"],
  NOT_APPLICABLE_STRENGTHENED: ["VAL-C16"], BLOCKED_BYPASSED: ["VAL-C15"], FUTURE_SIMULATED: ["VAL-C17"], REQUIREMENT_REINTERPRETED: ["VAL-C10"],
  PATTERN_PROMOTED: ["VAL-C11"], TEMPLATE_STRUCTURE_BYPASSED: ["VAL-C12"], DOCUMENT_CONTENT_INVENTED: ["VAL-C09", "VAL-C13"], SEMANTIC_DRIFT: ["VAL-C01", "VAL-C02"],
  ROUTE_DRIFT: ["VAL-C01"], DOWNSTREAM_INFORMATION_LOSS: ["VAL-C02", "VAL-C04", "VAL-C05", "VAL-C06", "VAL-C07"], PROJECTION_DIVERGENCE: ["VAL-C13", "VAL-C14"],
});

