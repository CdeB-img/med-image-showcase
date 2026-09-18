import { logicalDigest } from "../knowledge-engine/canonical.js";
import { buildPersistentProviderJsonSchema, buildPersistentSourceCatalog, persistentSourceAnchoredDeltaSchema,
  relevantProjectContext, type PersistentProviderJsonSchema, type ProductBridgeRequest } from "./product-bridge.js";

// Transport representation only. Expansion still enters the original anchored
// parser, validation, contribution owner and transactional human review.
const aliases: Record<string, string> = { candidateRef: "id", relationRef: "id", qualificationId: "id", occasionId: "id",
  proposedType: "t", relationType: "t", content: "v", proposalSourceText: "s", sourceAnchorId: "u",
  targetSectionId: "d", targetProjectRef: "r", semanticIdentity: "i", operation: "o", polarity: "p",
  studyRole: "k", epistemicStatus: "status", epistemicState: "e", assertionKind: "a", evidenceRefs: "ev",
  sourceObjectRef: "from", targetObjectRef: "to", subjectProjectRef: "subject", variableProjectRef: "variable" };
const defaults: Record<string, unknown> = { operation: "ADD", polarity: "AFFIRMED", epistemicStatus: "CONFIRMED_BY_USER",
  epistemicState: "KNOWN", assertionKind: "USER_ADOPTED_PROPOSAL", evidenceRefs: [] };
export type TransactionSource = { ref: string; turnId: string; role: "USER" | "NOXIA"; start: number; end: number; text: string };
export type CompactPreparationEvidence = { header: { candidateId: string; assentTurnId: string; proposalTurnId: string | null;
  projectId: string | null; projectVersion: string | null; projectDigest: string | null; catalogDigest: string };
  sources: TransactionSource[]; sourceRefsByCandidate: Record<string, string[]>; expandedDigest: string };

export const transactionSourceCatalog = (request: ProductBridgeRequest): TransactionSource[] => {
  const out: TransactionSource[] = [];
  for (const turn of request.conversation.turns.filter(t => t.role === "NOXIA")) {
    const seen = new Set<string>();
    const add = (start: number, end: number) => {
      while (start < end && /\s/u.test(turn.content[start]!)) start++;
      while (end > start && /\s/u.test(turn.content[end - 1]!)) end--;
      const text = turn.content.slice(start, end); if (!text || text.length > 4000 || seen.has(text)) return;
      seen.add(text); out.push({ ref: `p${out.length}`, turnId: turn.turnId, role: "NOXIA", start, end, text });
    };
    for (const match of turn.content.matchAll(/[^\n]+(?:\n(?!\n)[^\n]+)*/gu)) add(match.index!, match.index! + match[0].length);
  }
  buildPersistentSourceCatalog(request.conversation).anchors.forEach((a, index) => out.push({ ref: `u${index}`, turnId: a.turnId,
    role: "USER", start: a.startOffset, end: a.endOffset, text: a.exactText }));
  return out;
};

const compactItemSchema = (schema: PersistentProviderJsonSchema): PersistentProviderJsonSchema => {
  if (schema.anyOf) return { ...schema, anyOf: schema.anyOf.map(compactItemSchema) };
  if (!schema.properties) return schema;
  const properties: Record<string, PersistentProviderJsonSchema> = {};
  for (const [key, value] of Object.entries(schema.properties)) {
    const name = aliases[key] ?? key;
    properties[name] = key === "proposalSourceText" ? { type: "string", minLength: 1,
      description: "Exact p-reference from supplied sources; never repeat its quotation." }
      : key === "sourceAnchorId" ? { type: "string", description: "Exact current assent u-reference; defaults to u0." }
        : { ...value, description: key === "candidateRef" ? "Short local ID c0, c1…; dependencies use these same IDs."
          : key === "targetSectionId" ? "Optional destination SECTION, never an object TYPE. Use only the supplied enum; omit when no permitted section applies. PROJECT_INFORMATION and UNCERTAINTY are types, not sections." : value.description };
  }
  // Defaults are common representation metadata, not inferred scientific values.
  const required = (schema.required ?? []).filter(key => !(key in defaults) && key !== "sourceAnchorId").map(key => aliases[key] ?? key);
  if (!required.includes("s")) required.push("s");
  properties.span = { type: "array", items: { type: "integer", minimum: 0 }, minItems: 2, maxItems: 2,
    description: "Optional exact substring bounds within the p-source; otherwise use the whole saved source." };
  return { ...schema, properties, required };
};
export const compactTransactionSchema = () => {
  const schema = buildPersistentProviderJsonSchema();
  return { ...schema, required: [...(schema.required ?? []), "transaction"], properties: { transaction: { type: "string", description: "Echo the exact TRANSACTION_HEADER.candidateId to bind this output to its request and Project version." },
    ...Object.fromEntries(Object.entries(schema.properties!).map(([key, value]) => [key, { ...value, items: compactItemSchema(value.items!) }])) } };
};

export const prepareCompactTransaction = (request: ProductBridgeRequest) => {
  const sources = transactionSourceCatalog(request);
  const assent = [...request.conversation.turns].reverse().find(t => t.role === "USER");
  if (!assent) throw new Error("TRANSACTION_ASSENT_MISSING");
  const proposal = [...request.conversation.turns].reverse().find(t => t.role === "NOXIA");
  const header = { candidateId: `transaction:${logicalDigest({ assent, projectDigest: request.currentProject?.projectDigest ?? null })}`,
    assentTurnId: assent.turnId, proposalTurnId: proposal?.turnId ?? null, projectId: request.currentProject?.projectId ?? null,
    projectVersion: request.currentProject?.versionId ?? null, projectDigest: request.currentProject?.projectDigest ?? null,
    catalogDigest: logicalDigest(sources) };
  return { header, sources, context: JSON.stringify({ TRANSACTION_HEADER: header, COMMON_DEFAULTS: { ...defaults, u: "u0" },
    FIELD_NAMES: aliases, DESTINATION_SECTION_VALUES: buildPersistentProviderJsonSchema().properties!.changes!.items!.properties!.targetSectionId!.enum,
    DESTINATION_SECTION_RULE: "d est facultatif et appartient exclusivement à DESTINATION_SECTION_VALUES. Ne copie jamais t dans d : PROJECT_INFORMATION, OBJECTIVE et UNCERTAINTY ne sont pas des sections. Si aucun d permis ne convient, omets ce champ; le propriétaire canonique conserve le type t.",
    TEMPORAL_REPRESENTATION_RULE: "Un repère qualitatif sans quantité (avant/après une injection, même jour qu'une visite) utilise kind=RELATIVE_EVENT, unit/offset/lowerBound/upperBound/tolerance=null, relativeEventLabel exact et reference EXPLICIT non résolue si nécessaire; direction peut être AT pour le même jour. TIMEPOINT exige un offset numérique et une unité. Ne crée aucune quantité pour satisfaire le schéma.",
    VARIABLE_REPRESENTATION_RULE: "Un champ de recueil = une CANONICAL_VARIABLE. Ne fusionne jamais statut et traitement, qualité et motif, ni mesures avant/après d'une même quantité : ces valeurs sont saisies séparément. Une énumération de modalités d'UN champ (oui/non, classes d'âge) demeure un seul champ. Cette séparation de représentation ne crée aucune mesure non retenue.",
    SOURCE_ANCHORS: sources, CURRENT_ASSENT: assent,
    ORIGINAL_USER_DECISIONS_AND_CORRECTIONS: request.conversation.turns.filter(t => t.role === "USER" && t.turnId !== assent.turnId),
    CURRENT_PROJECT: relevantProjectContext(request.currentProject),
    POLICY: "Préparer les choix désignés, pas toutes les anciennes suggestions. Dernière revue groupée et corrections/refus humains prévalent. La revue résume : elle ne retire pas les décisions humaines antérieures non corrigées, leurs variables, unités ou définitions. Les sources sont conservées côté système. Toute sortie reste candidate, jamais adoptée." }) };
};

export const expandCompactTransaction = (value: unknown, request: ProductBridgeRequest) => {
  const prepared = prepareCompactTransaction(request);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("COMPACT_TRANSACTION_INVALID");
  if ((value as Record<string, unknown>).transaction !== prepared.header.candidateId) throw new Error("COMPACT_TRANSACTION_BINDING_MISMATCH");
  const sourceCatalog = buildPersistentSourceCatalog(request.conversation);
  const sourceMap = new Map(prepared.sources.map(s => [s.ref, s]));
  const sourceRefsByCandidate: Record<string, string[]> = {};
  const expanded: Record<string, unknown> = {};
  for (const [collection, raw] of Object.entries(value)) {
    if (collection === "transaction") continue;
    if (!["changes", "relations", "temporalQualifications", "expectedVariableOccasions"].includes(collection) || !Array.isArray(raw))
      throw new Error("COMPACT_TRANSACTION_COLLECTION_INVALID");
    expanded[collection] = raw.map((row: unknown) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("COMPACT_TRANSACTION_ITEM_INVALID");
      const item: Record<string, unknown> = { ...defaults };
      for (const [key, field] of Object.entries(row)) {
        if (key === "span") continue;
        const canonical = Object.entries(aliases).find(([original, short]) => short === key &&
          (key !== "id" || original === (collection === "changes" ? "candidateRef" : collection === "relations" ? "relationRef" : collection === "temporalQualifications" ? "qualificationId" : "occasionId")) &&
          (key !== "t" || original === (collection === "relations" ? "relationType" : "proposedType")))?.[0] ?? key;
        item[canonical] = field;
      }
      if (collection === "relations") delete item.operation;
      if (collection !== "changes" && collection !== "relations") {
        delete item.polarity; delete item.epistemicStatus; delete item.epistemicState;
      }
      const quote = sourceMap.get(String(item.proposalSourceText));
      if (!quote) throw new Error("COMPACT_PROPOSAL_REF_INVALID");
      const assentRef = String(item.sourceAnchorId ?? "u0");
      const assentSource = sourceMap.get(assentRef);
      if (!assentSource || assentSource.role !== "USER" || assentSource.turnId !== prepared.header.assentTurnId)
        throw new Error("COMPACT_ASSENT_REF_INVALID");
      item.sourceAnchorId = sourceCatalog.anchors.find(a => a.startOffset === assentSource.start && a.endOffset === assentSource.end)?.anchorId;
      if (!item.sourceAnchorId) throw new Error("COMPACT_ASSENT_BINDING_INVALID");
      const span = (row as Record<string, unknown>).span;
      let exactQuote = quote.text;
      if (span !== undefined) {
        if (!Array.isArray(span) || span.length !== 2 || !span.every(Number.isInteger)
          || span[0] < 0 || span[1] <= span[0] || span[1] > quote.text.length) throw new Error("COMPACT_PROPOSAL_BOUNDS_INVALID");
        exactQuote = quote.text.slice(span[0], span[1]);
      }
      if (quote.role === "NOXIA") item.proposalSourceText = exactQuote;
      else { item.assertionKind = "USER_STATED"; item.epistemicStatus = "EXPLICIT_USER_STATED"; delete item.proposalSourceText; }
      if (collection === "changes") {
        const id = String(item.candidateRef);
        if (!id || id === "undefined") throw new Error("COMPACT_CHANGE_ID_MISSING");
        sourceRefsByCandidate[id] = [...new Set([quote.turnId, assentSource.turnId])];
      }
      return item;
    });
  }
  const changes = (expanded.changes ?? []) as Record<string, unknown>[];
  const localIds = new Map(changes.map(row => [String(row.candidateRef), `${prepared.header.candidateId}:${String(row.candidateRef)}`]));
  for (const row of changes) {
    const id = String(row.candidateRef); row.candidateRef = localIds.get(id);
    sourceRefsByCandidate[String(row.candidateRef)] = sourceRefsByCandidate[id]!; delete sourceRefsByCandidate[id];
  }
  for (const collection of ["relations", "temporalQualifications", "expectedVariableOccasions"]) {
    for (const row of (expanded[collection] ?? []) as Record<string, unknown>[]) {
      for (const key of ["sourceObjectRef", "targetObjectRef", "subjectProjectRef", "variableProjectRef"])
        if (typeof row[key] === "string" && localIds.has(row[key])) row[key] = localIds.get(row[key]);
      const anchor = row.anchor as Record<string, unknown> | undefined;
      const reference = anchor?.reference as Record<string, unknown> | undefined;
      if (reference && typeof reference.referenceProjectRef === "string" && localIds.has(reference.referenceProjectRef))
        reference.referenceProjectRef = localIds.get(reference.referenceProjectRef);
    }
  }
  // No relaxed downstream contract: unknown fields, missing mandatory fields,
  // overflows or unresolved dependencies reject the complete candidate.
  const parsed = persistentSourceAnchoredDeltaSchema.parse(expanded);
  return { value: parsed, evidence: { header: prepared.header, sources: prepared.sources, sourceRefsByCandidate,
    expandedDigest: logicalDigest(parsed) } satisfies CompactPreparationEvidence };
};

export const COMPACT_TRANSACTION_INSTRUCTION = `FORMAT TRANSPORT COMPACT : les champs du contrat sont renommés selon FIELD_NAMES. Utilise uniquement ce schéma de sortie. id est une référence locale courte; t le type; v la valeur scientifique concise mais intégrale; s une référence p exacte de SOURCE_ANCHORS, jamais la citation répétée. u est l'ancrage humain courant (u0 par défaut). Pour un fait directement formulé dans le message courant, s peut être sa référence u; il reste USER_STATED. Les métadonnées COMMON_DEFAULTS sont matérialisées côté serveur quand omises. Conserve e=UNKNOWN pour un vrai point ouvert, k pour un rôle explicitement retenu, o/r pour une correction de l'objet Project existant. Ne répète ni header ni citations ni semanticIdentity narrative si id suffit. Ne fusionne pas des variables indépendantes. Garde les relations/dépendances explicites et les qualifications temporelles typées. Référence les IDs locaux exacts. Écris les accents directement en Unicode et un JSON compact, sans reformuler l'historique dans chaque ligne. Une liste vide ne convient pas quand des choix scientifiques explicitement désignés sont à préparer.
COMPLÉTUDE AVANT COMPACTION : confronte la revue groupée aux ORIGINAL_USER_DECISIONS_AND_CORRECTIONS. Un résumé plus court ne supprime pas un choix humain antérieur non corrigé. Préserve CHAQUE variable de recueil explicitement retenue comme CANONICAL_VARIABLE distincte, avec son unité et ses phases exactes quand elles sont dites, même si la dernière revue ne réénumère pas le recueil. Préserve aussi l'objectif explicite, les formules et définitions retenues (PROJECT_INFORMATION si aucune signature typée existante ne convient), les règles d'évaluabilité, les négations et chaque point ouvert. Les sources p antérieures peuvent soutenir ces éléments lorsque la dernière revue les abrège. Ne confonds pas préserver une décision avec inventer une méthode absente. Avant de répondre, vérifie en interne que chaque choix retenu, variable et définition possède une ligne ou une représentation typée dans le candidat : raccourcis les métadonnées répétées, jamais la couverture scientifique. Rien n'est adopté sans PRJ Human Review.
RÉFÉRENTIELS TEMPORELS : une série coordonnée partage normalement l'événement index explicite de son premier temps, sauf contradiction matérielle. Sépare les temps directement formulés des références héritées inférées. Pour une référence implicite, utilise la proposition visible NOXIA comme provenance de travail (source p exacte), jamais une citation utilisateur prétendument explicite ; si aucune proposition visible ne la soutient, conserve cette référence UNKNOWN. Ne transforme pas un référentiel inféré en fait USER_STATED. Ne crée pas de référence KNOWN vers un objet inexistant. Les champs temporels et leurs sources restent intégralement soumis à la revue humaine existante.`;
