import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import { buildProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import { humanDecisionEnvelopeSchema, type HumanDecisionEnvelope } from "../protocol-designer/human-decision.js";

export const DRCI_DOCUMENT_KINDS = ["PROTOCOL_SYNOPSIS", "PROTOCOL_FULL", "CRF", "RECRUITMENT"] as const;
const text = z.string().trim().min(1).max(16000);
const sectionSchema = z.object({ title: text, paragraphs: z.array(text).min(1).max(12), sourceRefs: z.array(text).max(100) }).strict();
const documentSchema = z.object({ kind: z.enum(DRCI_DOCUMENT_KINDS), title: text,
  sections: z.array(sectionSchema).min(1).max(30), missingElements: z.array(text).max(50) }).strict();
// Equivalent DOC representations retain every label/control verbatim. Unknown
// origins and invalid values still fail; no scientific value is inferred.
const originAliases = { SITE_CLINIQUE: "SITE_RECORDED", LABORATOIRE: "LAB_RESULT", IMAGERIE: "IMAGING_DERIVED" } as const;
const crfRowSchema = z.object({ variableRef: text, domain: text, definition: text, entryType: text,
  // Optional only for reading historical V1 packs. New operational DOC scopes
  // must supply these collection specifications without writing to Project.
  variableId: z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/u).optional(), label: text.optional(), visit: text.optional(),
  condition: text.nullable().optional(), derivedFrom: z.array(text).max(25).optional(), analysisImpact: text.nullable().optional(),
  unit: text.nullable(), categories: z.union([text, z.array(text).min(1).max(50).transform(values => values.join(" ; "))]).nullable(),
  dataOrigin: z.preprocess(value => typeof value === "string" && value in originAliases
    ? originAliases[value as keyof typeof originAliases] : value,
  z.enum(["PARTICIPANT_REPORTED", "SITE_RECORDED", "LAB_RESULT", "IMAGING_DERIVED", "IMAGING_READER_RECORDED", "SYSTEM_DERIVED", "UNSPECIFIED"])),
  source: text, required: text, derivation: text.nullable(), controls: z.union([z.array(text).max(10), text.transform(value => [value])]),
  specificationStatus: z.enum(["ADOPTED_PROJECT", "DERIVED_FROM_PROJECT", "PROPOSED_FOR_REVIEW", "UNSPECIFIED"]) }).strict();
const generatedSchema = z.object({ documents: z.array(documentSchema).length(4), crfRows: z.array(crfRowSchema).max(100) }).strict();
const validateOperationalRows = (rows: z.infer<typeof crfRowSchema>[]) => {
  const ids = new Set(rows.map(row => row.variableId));
  if (ids.size !== rows.length || rows.some(row => !row.variableId || !row.label || !row.visit
    || row.condition === undefined || !row.derivedFrom || row.analysisImpact === undefined
    || row.derivedFrom.some(id => !ids.has(id))
    || ["ADOPTED_PROJECT", "DERIVED_FROM_PROJECT", "PROPOSED_FOR_REVIEW", "UNSPECIFIED"].includes(row.entryType)))
    throw new Error("DRCI_OPERATIONAL_CRF_SPECIFICATION_INCOMPLETE");
};
// Collection/projection corrections are read-only consequences of the bound
// Project. They never change a scientific fact or an institutional method.
export const polishDrciEditorialText = (value: string) => value.split(/(\[\[FACT:[^\]]+\]\])/gu).map(part => {
  if (part.startsWith("[[FACT:")) return part;
  return part.replace(/\b([Ll])[’']endpoint\b/gu, "$1e critère de jugement")
    .replace(/\b([Dd])[’']endpoint\b/gu, "$1e critère de jugement")
    .replace(/\bEndpoint(s?)\b/gu, (_match, plural: string) => plural ? "Critères de jugement" : "Critère de jugement")
    .replace(/\bendpoint(s?)\b/gu, (_match, plural: string) => plural ? "critères de jugement" : "critère de jugement")
    .replace(/\bcritère principal\b/gu, "critère de jugement principal")
    .replace(/\bCritère principal\b/gu, "Critère de jugement principal")
    .replace(/\b[Pp]ré-screening\b/gu, match => match.startsWith("P") ? "Présélection" : "présélection")
    .replace(/\b[Ss]creening\b/gu, match => match.startsWith("S") ? "Présélection" : "présélection")
    .replace(/\b([Ll])e présélection\b/gu, "$1a présélection")
    .replace(/\b([Dd])u présélection\b/gu, "$1e la présélection")
    .replace(/\b([Aa])u présélection\b/gu, (_match, initial: string) => `${initial === "A" ? "À" : "à"} la présélection`)
    .replace(/\b([Uu])n présélection\b/gu, "$1ne présélection")
    .replace(/\b([Cc])e présélection\b/gu, "$1ette présélection")
    .replace(/\bévalu able\b/gu, "évaluable")
    .replace(/\bcohorte incluse\b/gu, "population incluse")
    .replace(/^À définir avant gel du protocole\s*[—–-]\s*/iu, "");
}).join("");
export const completeDrciOperationalProjection = (
  generated: z.infer<typeof generatedSchema>,
  sourceFacts: readonly { ref: string; type: string; content: string; polarity: string; epistemicState: string }[],
) => {
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLocaleLowerCase("fr");
  // ProjectContextSnapshot omits AFFIRMED to keep its wire representation compact.
  const current = sourceFacts.filter(fact => fact.epistemicState === "KNOWN"
    && (fact.polarity === undefined || fact.polarity === "AFFIRMED"));
  const design = current.find(fact => fact.type === "STUDY_DESIGN");
  const documents = generated.documents.map(doc => ({ ...doc, title: polishDrciEditorialText(doc.title),
    missingElements: doc.missingElements.map(polishDrciEditorialText), sections: doc.sections.map(section => ({ ...section,
    title: polishDrciEditorialText(section.title),
    paragraphs: section.paragraphs.map(paragraph => polishDrciEditorialText(design && /observationnel/iu.test(design.content) && !/faisabil/iu.test(design.content)
      ? paragraph.replace(/^((?:Le projet|L[’']étude) est (?:conçu[e]?|présenté[e]?|défini[e]?) comme )une étude de faisabilité/iu,
        "$1une étude observationnelle") : paragraph)),
  })) }));
  const crfRows = generated.crfRows.map(row => {
    const fact = current.find(fact => fact.ref === row.variableRef && fact.type === "CANONICAL_VARIABLE");
    if (!fact) return row;
    const label = normalized(fact.content);
    if (/^pression arterielle (?:systolique|diastolique)/u.test(label)) return { ...row,
      required: "Oui : mesure prévue pour chaque participant ; une absence est documentée.",
      condition: null, specificationStatus: "DERIVED_FROM_PROJECT" as const };
    if (/^traitement antihypertenseur/u.test(label)) return { ...row,
      required: "Oui : statut présent ou absent à renseigner pour vérifier l’éligibilité.", specificationStatus: "DERIVED_FROM_PROJECT" as const };
    if (/^qualite des acquisitions/u.test(label) && current.some(fact => /cartes.*interprétables/iu.test(fact.content))) return { ...row,
      required: "Oui : interprétabilité à documenter pour chaque examen, même sans anomalie.",
      condition: null, specificationStatus: "DERIVED_FROM_PROJECT" as const };
    return row;
  });
  return { documents, crfRows };
};
export type DrciProjectBinding = { projectId: string; projectVersion: string; projectDigest: string };
export type RetainedDrciScope = Readonly<{ requestContext: string; value: unknown; rawOutputRef: string }>;
export type RetainedDrciProtocol = RetainedDrciScope & Readonly<{ remainingScope?: RetainedDrciScope }>;
// Output preparation only: one adopted version / one final pack. Long protocol
// prose and the native field inventory must not compete for the same 8000-token
// response. No partial batch is a document pack or a Project decision.
export const prepareDrciGenerationBatches = (packet: { context: string; instruction: string; projectBinding: DrciProjectBinding }) => {
  const context = JSON.parse(packet.context);
  if (logicalDigest(context.DATA_MANAGEMENT_CRF.sourceProject) !== logicalDigest(packet.projectBinding))
    throw new Error("DRCI_RUNTIME_BINDING_MISMATCH");
  const aliases = new Map<string, string>(context.CURRENT_PROJECT.sourceFacts.map((f: { ref: string }, i: number) => [f.ref, `f${i}`]));
  const originals = new Map([...aliases].map(([ref, alias]) => [alias, ref]));
  const compact = (value: unknown): unknown => typeof value === "string" ? aliases.get(value) ?? value
    : Array.isArray(value) ? value.map(compact) : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).map(([key, field]) => [key, compact(field)])) : value;
  // Native DOC repeats identical applicability notes in many sections. Retain
  // every exact note once, with every section association, before token count.
  const notes = new Map<string, string>();
  const noteRef = (value: string) => { if (!notes.has(value)) notes.set(value, `n${notes.size}`); return notes.get(value)!; };
  const plan = context.DOCUMENT_PLAN.map((section: { title: string; status: string; applicability: string; unknowns: string[]; limitations: string[]; contradictions: string[] }) =>
    ({ ...section, unknowns: section.unknowns.map(noteRef), limitations: section.limitations.map(noteRef), contradictions: section.contradictions.map(noteRef) }));
  const binding = `drci:${logicalDigest({ source: context.DATA_MANAGEMENT_CRF.sourceProject, context: packet.context })}`;
  const scopes = [["PROTOCOL_FULL"], ["PROTOCOL_SYNOPSIS", "CRF", "RECRUITMENT"]] as const;
  return scopes.map((kinds, index) => ({
    requestScope: kinds.join("+"),
    context: JSON.stringify({ ...compact(context) as Record<string, unknown>, DOCUMENT_PLAN: compact(plan),
      DOCUMENT_PLAN_NOTES: Object.fromEntries([...notes].map(([value, ref]) => [ref, value])), OUTPUT_FORMAT: "json", PROJECT_BINDING: context.DATA_MANAGEMENT_CRF.sourceProject,
      DOCUMENT_SCOPE: kinds, INCLUDE_CRF_ROWS: index === 1 }),
    runtimeBinding: { preparation: binding, project: packet.projectBinding },
    instruction: `${packet.instruction}\nFORMAT / SCOPE DE CETTE SORTIE : retourne uniquement les documents de DOCUMENT_SCOPE, tous complets. Le JSON contient uniquement documents et crfRows. Le runtime attribue binding, identités et provenance ; ne les reproduis pas. Les notes n du plan sont les textes exacts de DOCUMENT_PLAN_NOTES ; ne les utilise pas comme sourceRefs. Les références f sont des alias exacts : utilise-les uniquement dans sourceRefs et variableRef, jamais dans la prose. crfRows est vide pour PROTOCOL_FULL; il contient tous les champs natifs pour le scope CRF. Aucun résultat partiel n'est publié. Les négations scientifiques restent formulées normalement. Préserve la rédaction complète ; les spécifications de saisie restent courtes et les inconnus explicites.`,
    expand(value: unknown) {
      // Legacy model binding is inert metadata; runtime authority stays local.
      const batch = z.object({ binding: z.unknown().optional(), documents: z.array(documentSchema).length(kinds.length), crfRows: z.array(crfRowSchema).max(100) }).strict().parse(value);
      if (new Set(batch.documents.map(d => d.kind)).size !== kinds.length || batch.documents.some(d => !(kinds as readonly string[]).includes(d.kind))
        || index === 0 && batch.crfRows.length) throw new Error("DRCI_BATCH_SCOPE_MISMATCH");
      if (index === 1 && context.DOCUMENT_SPECIFICATION === "DRCI_OPERATIONAL_V2") validateOperationalRows(batch.crfRows);
      const original = (ref: string) => { const found = originals.get(ref); if (!found) throw new Error("DRCI_BATCH_REFERENCE_INVALID"); return found; };
      return { documents: batch.documents.map(d => ({ ...d, sections: d.sections.map(s => ({ ...s, sourceRefs: s.sourceRefs.map(original),
        paragraphs: s.paragraphs.map(p => p.replace(/\[\[FACT:([^\]]+)\]\]/gu, (_, ref: string) => `[[FACT:${original(ref)}]]`)) })) })),
        crfRows: batch.crfRows.map(row => ({ ...row, variableRef: original(row.variableRef) })) };
    },
  }));
};

export const validateRetainedDrciScope = (packet: Parameters<typeof prepareDrciGenerationBatches>[0], retained: RetainedDrciScope, index: 0 | 1) => {
  const batch = prepareDrciGenerationBatches(packet)[index];
  const current = JSON.parse(batch.context);
  const previous = JSON.parse(retained.requestContext);
  const scientificSource = (context: typeof current) => ({ CURRENT_PROJECT: context.CURRENT_PROJECT,
    DOCUMENT_SPECIFICATION: context.DOCUMENT_SPECIFICATION ?? null,
    DATA_MANAGEMENT_CRF: context.DATA_MANAGEMENT_CRF, AVAILABLE_EVIDENCE: context.AVAILABLE_EVIDENCE,
    DOCUMENT_PLAN: context.DOCUMENT_PLAN.map((section: { unknowns: string[]; limitations: string[]; contradictions: string[] }) => ({ ...section,
      ...Object.fromEntries(["unknowns", "limitations", "contradictions"].map(key => [key,
        section[key as keyof typeof section].map(ref => context.DOCUMENT_PLAN_NOTES[ref] ?? ref)])) })) });
  if (logicalDigest(previous.PROJECT_BINDING) !== logicalDigest(packet.projectBinding)
    || logicalDigest(scientificSource(previous)) !== logicalDigest(scientificSource(current))
    || JSON.stringify(previous.DOCUMENT_SCOPE) !== JSON.stringify(current.DOCUMENT_SCOPE)
    || !retained.rawOutputRef.startsWith("scientific-interpretation-raw:")) throw new Error("DRCI_RETAINED_PROTOCOL_SOURCE_MISMATCH");
  return batch.expand(retained.value);
};
export const validateRetainedDrciProtocol = (packet: Parameters<typeof prepareDrciGenerationBatches>[0], retained: RetainedDrciProtocol) =>
  validateRetainedDrciScope(packet, retained, 0);
export type DrciDraftPack = Readonly<{
  contract: "DRCI_DRAFT_PACK_V1";
  project: { projectId: string; projectVersion: string; projectDigest: string };
  generatedAt: string;
  protocolProjectionId: string;
  handoffDecisionDigest: string;
  sourceFacts: readonly { ref: string; type: string; content: string; polarity: string; epistemicState: string }[];
  canonicalCrfPackageRef: string;
  documents: z.infer<typeof generatedSchema>["documents"];
  crfRows: z.infer<typeof generatedSchema>["crfRows"];
  packDigest: string;
  crossConsistency: "SOURCE_BINDINGS_CHECKED_HUMAN_REVIEW_PENDING";
  projectWriteAuthorized: false;
  reusedProtocolEvidenceRef: string | null;
  preparationBinding: string;
}>;

export const validateDrciHandoff = (project: ResearchProjectOwnerProjection, value: unknown) => {
  const parsed = humanDecisionEnvelopeSchema.safeParse(value);
  if (!parsed.success) throw new Error("DRCI_HUMAN_HANDOFF_REQUIRED");
  const decision = parsed.data;
  if (decision.status !== "ADOPTED" || decision.gateId !== "PRJ-GATE-DOCUMENT-WORKING-PROJECTION"
    || decision.projectVersion !== project.versionId || !decision.scope.includes("DOCUMENT_HANDOFF")
    || ![project.projectId, project.versionId, project.projectDigest].every(ref => decision.targets.includes(ref)))
    throw new Error("DRCI_HANDOFF_PROJECT_VERSION_MISMATCH");
  return decision as HumanDecisionEnvelope;
};

export type DrciDraftSource = Readonly<{
  handoffDecision: HumanDecisionEnvelope;
  protocolProjection: { projectionId: string; source: { projectId: string; projectVersion: string; projectDigest: string }; sections: readonly { title: string; status: string; applicability: string; unknowns: readonly string[]; limitations: readonly string[]; contradictions: readonly string[] }[]; evidenceContent?: unknown };
  crf: { packageId: string; sourceProject: { projectId: string; projectVersion: string; projectDigest: string }; fields: readonly { canonicalVariableId: string; label: string; unit: string | null; plannedSource: string | null; plannedMethod: string | null; validationRules: readonly string[] }[] };
}>;
// The HTTP packet needs the native DOC plan, not the editorial projection's
// repeated rendered values/snapshot. The canonical Project remains unchanged.
export const prepareDrciDraftSource = (source: DrciDraftSource): DrciDraftSource => ({
  handoffDecision: source.handoffDecision, crf: source.crf,
  protocolProjection: { projectionId: source.protocolProjection.projectionId,
    source: source.protocolProjection.source,
    sections: source.protocolProjection.sections.map(({ title, status, applicability, unknowns, limitations, contradictions }) =>
      ({ title, status, applicability, unknowns, limitations, contradictions })),
    ...(source.protocolProjection.evidenceContent ? { evidenceContent: source.protocolProjection.evidenceContent } : {}) },
});
export const prepareDrciDraftPack = (project: ResearchProjectOwnerProjection, source: DrciDraftSource) => {
  const { handoffDecision: handoff, protocolProjection: projection, crf } = source;
  const decision = validateDrciHandoff(project, handoff);
  if (projection.source.projectId !== project.projectId || projection.source.projectVersion !== project.versionId
    || projection.source.projectDigest !== project.projectDigest) throw new Error("DRCI_PROTOCOL_PROJECTION_STALE");
  const snapshot = buildProjectContextSnapshot({ project });
  const sourceFacts = snapshot.objects.map(item => ({ ref: item.stableId, type: item.type, content: item.content,
    polarity: item.polarity, epistemicState: item.epistemicState }));
  if (crf.sourceProject.projectId !== project.projectId || crf.sourceProject.projectVersion !== project.versionId
    || crf.sourceProject.projectDigest !== project.projectDigest || !Array.isArray(crf.fields)
    || crf.fields.some(field => !snapshot.objects.some(item => item.stableId === field.canonicalVariableId && item.type === "CANONICAL_VARIABLE")))
    throw new Error("DRCI_CRF_NATIVE_SOURCE_MISMATCH");
  const context = JSON.stringify({ DOCUMENT_SPECIFICATION: "DRCI_OPERATIONAL_V2", CURRENT_PROJECT: { sourceFacts, relations: snapshot.relations,
    temporalQualifications: snapshot.temporalQualifications, expectedVariableOccasions: snapshot.expectedVariableOccasions,
    openIssues: snapshot.openIssues }, DOCUMENT_PLAN: projection.sections.map(section => ({ title: section.title, status: section.status, applicability: section.applicability, unknowns: section.unknowns, limitations: section.limitations, contradictions: section.contradictions })),
    DATA_MANAGEMENT_CRF: crf, AVAILABLE_EVIDENCE: projection.evidenceContent ?? null });
  const instruction = `Rédige en français un pack de travail DRCI professionnel à partir exclusivement du Project adopté, de ses contributions DOC/CDM/Data Management et des sources vérifiées fournies. Le transcript et les pistes non adoptées sont absents. Aucune écriture Project, adoption, exécution clinique, recherche ou validation réglementaire n'est autorisée.
FRONTIÈRE : Project fournit décisions, contraintes, valeurs, inconnues et provenance ; DOC transforme ces éléments en méthode expliquée, organisation et outils de collecte. Une spécification mécaniquement dérivée d'une décision existante n'est pas une nouvelle décision scientifique. Autorise types, unités, modalités évidentes, conditions d'éligibilité et dérivations identitaires usuelles, sans nouvel arbitrage. Si un choix change le sens scientifique, la mesure, la population ou l'analyse et plusieurs options sont raisonnables, laisse-le ouvert. Les champs null du CRF natif signifient absence de spécification de collecte canonique, pas interdiction d'une représentation documentaire déductible.
Ne fabrique jamais institution, promoteur, assurance, identifiant réglementaire, contact, référence, résultat bibliographique, durée de recrutement, calcul de puissance, seuil clinique ni choix technique absent. UNKNOWN/WITHHELD restent ouverts ; NEGATED reste une absence normalement formulée. Aucune hypothèse directionnelle ni test artificiel si l'étude est descriptive/estimative. Une proposition d'organisation non adoptée doit être clairement présentée comme proposition, jamais comme décision acquise.
FORMAT JSON seulement : {documents:[{kind,title,sections:[{title,paragraphs,sourceRefs}],missingElements}],crfRows:[{variableRef,variableId,label,domain,visit,definition,entryType,unit,categories,dataOrigin,source,required,condition,derivedFrom,derivation,controls,analysisImpact,specificationStatus}]}.
Les kinds : PROTOCOL_SYNOPSIS, PROTOCOL_FULL, CRF, RECRUITMENT, une occurrence par scope. sourceRefs cite uniquement les ref de sourceFacts comme metadata invisible. variableRef lie chaque ligne à sa variable canonique. Pas d'IDs internes ni jargon runtime dans le texte ; variableId est un nom de collecte lisible en MAJUSCULES_AVEC_UNDERSCORES, pas un identifiant technique du Project. Ne retourne aucun binding : il appartient au runtime.
RÉDACTION : paragraphes reliés, denses, utiles. Interdit : fact → paraphrase → paragraphe suivant → même paraphrase. Pas de marqueur FACT, inventaire brut de décisions, longue défense administrative, annonce autocentrée. Chaque élément a une section principale ; une synthèse courte ou un renvoi peut le rappeler, sans copier le paragraphe. Regroupe les inconnues dans une liste finale unique « À définir avant gel du protocole », en distinguant technique, analyse et institution. Les sections peuvent expliquer une conséquence locale d'un inconnu, sans répéter chaque placeholder partout.
PROTOCOLE COMPLET : véritable protocole scientifique de travail, environ 2500–3200 mots utiles, jusqu'à 30 sections rédigées ; fusionne les rubriques voisines plutôt que 31 sections d'une phrase. Couvre : identification/titre ; synopsis bref ; contexte/rationnel ; lacune/question ; objectifs principal et secondaires/exploratoires effectivement retenus ; design ; population/inclusion/exclusion ; recrutement ; parcours/visite ; imagerie ; biologie ; définition endpoint ; variables secondaires ; évaluabilité ; recueil ; populations d'analyse ; statistiques ; dimensionnement ; exclusions/non-évaluables ; gestion des données ; qualité/reproductibilité ; biais ; sécurité/découvertes fortuites ; éthique ; faisabilité/calendrier ; références ; éléments à compléter.
RATIONNEL : explique pourquoi le marqueur choisi informe la question, ce qu'il ne démontre pas, pourquoi l'exposition est intéressante, les conséquences du design transversal si retenu (association interindividuelle, pas progression individuelle ni causalité), les exclusions pertinentes et le compromis validité interne/généralisabilité. Pour un ECV myocardique : expansion extracellulaire ne vaut pas preuve histologique spécifique de fibrose ; une lésion LGE focale modifie le périmètre de l'analyse diffuse. Explique sélection des volontaires/survivants sains, confusion résiduelle et biais de mesure, sans inventer de résultats. Si AVAILABLE_EVIDENCE n'apporte pas de bibliographie vérifiée, écris [Revue bibliographique et références à compléter / vérifier]. Ne prétends ni étude de littérature exhaustive ni références disponibles.
MÉTHODE : transforme les décisions en enchaînement compréhensible de screening, consentement, collecte clinique, biologie/IRM, lecture/qualité, dérivation et analyse ; respecte timing et séparations de sources adoptés. Ne décide ni lecteur, aveuglement, ROI, segmentation, nombre minimal de segments, agent/dose, séquence constructeur, délai acceptable, procédure de PA ou seuil rénal lorsqu'ils sont ouverts. Reproductibilité : explique les points à standardiser et les choix restant à valider, sans prétendre une procédure déjà fixée. Une découverte focale excluant l'analyse principale ne supprime ni le participant inclus ni ses données ni le motif du flux.
STATISTIQUES : restitue exactement les décisions retenues. Si elles sont âge continu principal, régression linéaire ajustée sexe + IMC, classes descriptives secondaires, splines exploratoires et aucune interaction imposée, respecte tous ces statuts ; aucune covariable explicitement refusée ne revient. Explique inclus versus analysables, exclusion LGE+ et non-évaluabilité, effectifs/motifs rapportés, description des classes, pente/estimations + intervalles de confiance sans imposer un niveau absent. Diagnostics de linéarité/résidus/hétéroscédasticité/influence à examiner, sans sélectionner une transformation, un seuil d'outlier ou une règle de retrait. Le manque de covariable nécessaire est signalé sans inventer imputation ou analyse en cas complets. Données manquantes restent ouvertes. N pragmatique n'est jamais un calcul de puissance ; n'invente pas alpha, power, effet attendu ni N analysable.
SYNOPSIS DRCI : 550–750 mots, équivalent 1–2 pages, lu en quelques minutes. Synthèse de décision : justification, question/objectif, design, population/N et statut, critères majeurs, parcours, endpoint, statistiques, faisabilité/biais et décisions ouvertes avant gel. Pas de détail CRF ni répétition intégrale du protocole.
CRF OPÉRATIONNEL : dictionnaire utilisable, EXACTEMENT une ligne pour chaque canonicalVariableId des fields DATA_MANAGEMENT_CRF, aucune variable canonique ajoutée. Chaque ligne contient toutes les clés, dont condition et analysisImpact (null si sans objet), derivedFrom (liste des variableId parents, vide si saisie directe). variableId unique, label clair, domain module de collecte, visit temporalité, definition précise, entryType réellement numérique/catégoriel/booléen/texte/calculé ; jamais un statut à la place du type.
Origines autorisées, distinctes : PARTICIPANT_REPORTED (déclaration), SITE_RECORDED (recueil clinique site), LAB_RESULT (résultat laboratoire), IMAGING_DERIVED (mesure quantitative issue de l'image), IMAGING_READER_RECORDED (qualification du lecteur), SYSTEM_DERIVED (calcul déterministe secondaire), UNSPECIFIED si réellement indécidable. source décrit le document/mesure d'origine et qui consigne, sans inventer un dossier ou lecteur imposé. Les données site, laboratoire et lecture IRM restent séparées ; un calcul relie ses entrées sans effacer leur origine.
Spécifications déductibles : âge numérique en années, bornes exactes adoptées pour éligibilité ; classe calculée depuis âge avec les classes adoptées ; IMC = poids kg / (taille cm / 100)^2 ; statut tabac jamais/ancien/actuel ; PA cumulés et délai d'arrêt obligatoires conditionnellement à ancien fumeur et règle exacte conjonctive adoptée ; statut LGE focal oui/non provenant du lecteur, obligatoire pour déterminer l'éligibilité de l'analyse principale ; ECV calculé depuis T1 myocardique/sanguin pré/post et Ht, formule exacte adoptée, unité %. La formule de fraction ECV est affichée telle qu'adoptée ; la conversion fraction ×100 en pourcentage est explicitée comme conversion d'unité, sans changer le modèle. Ne confonds pas T1 sanguin avec laboratoire. Ht fraction et T1 ms restent exacts.
required précise oui, conditionnel ou nécessaire à l'analyse principale avec motif ; cela organise le recueil sans inventer rejet automatique/imputation. condition conserve les règles existantes ; controls fournit des contrôles de type, cohérence d'unité, présence, appariement, temporalité et seuils déjà décidés. Pas de valeurs normales ni bornes de contrôle clinique non adoptées. Pas de nouvelle règle numérique pour la qualité des cartes. quality peut rester texte motivé en absence d'échelle adoptée, sans créer un score. SEX modalités au sens adopté, codage supplémentaire non fixé explicite. PA statut HTA est l'antécédent connu, pas une nouvelle HTA déduite d'une mesure sans seuil. Traitement hors HTA connue n'est pas automatiquement exclusif : indication à confirmer médicalement.
specificationStatus : DERIVED_FROM_PROJECT pour représentation mécanique de décisions ; ADOPTED_PROJECT seulement si la spécification de collecte elle-même est adoptée ; PROPOSED_FOR_REVIEW pour option opérationnelle non univoque ; UNSPECIFIED si ouverte. Les règles déductibles ne nécessitent pas une nouvelle adoption scientifique. Rédige court chaque cellule (évite répétitions) pour conserver l'intégralité des lignes dans la borne. Les modalités absentes = null, pas « À définir » partout ; null sans objet sera affiché comme absence de modalités/dérivation.
ORGANISATION CRF : sections modulaires screening/éligibilité, consentement, démographie, anthropométrie, antécédents cardiovasculaires, PA/HTA, diabète, tabac, sécurité IRM/contraste, laboratoire, acquisition, lecture, dérivation ECV, qualité/évaluabilité, éligibilité analytique, clôture. Regroupe les modules voisins sans perdre les fonctions. Screening, consentement, sécurité, motifs de clôture sont des contrôles de processus présentés dans les sections, pas de fausses variables canoniques ajoutées. Identifiants/pseudonymisation, autorisations, formulaire de consentement et règles institutionnelles restent ouverts avant usage clinique.
RECRUTEMENT = deux objets dans le même document : A. texte candidat court, clair, non coercitif, pas promesse de bénéfice ni résultat individuel ; B. formulaire papier de pré-screening réellement utilisable avec blancs ____ et cases ☐, champs sur lignes séparées (paragraphes peuvent contenir des sauts de ligne). Âge et critères courants, décisions conditionnelles lisibles : oui/non/à confirmer, exclusions, anciens fumeurs seuil cumul ET seuil arrêt, IRM/contraste vérification médicale, issue potentiellement éligible/non éligible/à confirmer + motif. Une incertitude ne vaut ni exclusion ni éligibilité automatique. HTA connue même contrôlée est exclue si adoptée ; tout antihypertenseur ne prouve pas HTA, vérifier l'indication. Ne transforme pas le pré-screening en consentement, diagnostic ou données d'analyse. Coordonnées du site/contact et règles de conservation pré-consentement restent ouverts.
COHÉRENCE : les quatre documents expriment strictement la même population/âge/classes/N et statut, équilibre de sexe, HTA/diabète/tabac, visite/scanner/acquisition/T1/T2/LGE/Ht/ECV/analyse et éléments ouverts là où pertinents. Aucun ancien critère remplacé ne survit. Ne comble pas l'agent/dose, constructeur, tolérance de délai, procédure de PA, seuils rénaux, modalités de lecture, missingness, institutionnel ou bibliographie non vérifiée. Les documents restent de travail à revoir, aucune validation scientifique, réglementaire ou institutionnelle revendiquée.`;
  return { context, instruction, sourceFacts, crf, handoffDecisionDigest: logicalDigest(decision), protocolProjectionId: projection.projectionId,
    projectBinding: { projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest } };
};

export const materializeDrciDraftPack = (value: unknown, input: {
  project: ResearchProjectOwnerProjection; packet: ReturnType<typeof prepareDrciDraftPack>; generatedAt: string; reusedProtocolEvidenceRef?: string | null;
}): DrciDraftPack => {
  const authoritative = { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest };
  const context = JSON.parse(input.packet.context);
  const nativeFacts = buildProjectContextSnapshot({ project: input.project }).objects.map(item => ({ ref: item.stableId, type: item.type,
    content: item.content, polarity: item.polarity, epistemicState: item.epistemicState }));
  if (logicalDigest(input.packet.projectBinding) !== logicalDigest(authoritative)
    || logicalDigest(input.packet.crf.sourceProject) !== logicalDigest(authoritative)
    || logicalDigest(context.DATA_MANAGEMENT_CRF.sourceProject) !== logicalDigest(authoritative)
    || logicalDigest(input.packet.sourceFacts) !== logicalDigest(nativeFacts)
    || logicalDigest(context.CURRENT_PROJECT.sourceFacts) !== logicalDigest(nativeFacts)) throw new Error("DRCI_RUNTIME_PROJECT_BINDING_MISMATCH");
  const decoded = generatedSchema.parse(value);
  const generated = context.DOCUMENT_SPECIFICATION === "DRCI_OPERATIONAL_V2"
    ? completeDrciOperationalProjection(decoded, input.packet.sourceFacts) : decoded;
  if (new Set(generated.documents.map(item => item.kind)).size !== 4) throw new Error("DRCI_DOCUMENT_SET_INCOMPLETE");
  const refs = new Set(input.packet.sourceFacts.map(item => item.ref));
  const expected = input.packet.crf.fields.map(item => item.canonicalVariableId);
  if (new Set(generated.crfRows.map(item => item.variableRef)).size !== expected.length
    || generated.crfRows.length !== expected.length || generated.crfRows.some(item => !expected.includes(item.variableRef)))
    throw new Error("DRCI_CRF_NATIVE_COVERAGE_MISMATCH");
  if (context.DOCUMENT_SPECIFICATION === "DRCI_OPERATIONAL_V2") validateOperationalRows(generated.crfRows);
  for (const doc of generated.documents) for (const section of doc.sections) {
    if (section.sourceRefs.some(ref => !refs.has(ref))) throw new Error("DRCI_SOURCE_REFERENCE_INVALID");
    for (const paragraph of section.paragraphs) for (const match of paragraph.matchAll(/\[\[FACT:([^\]]+)\]\]/gu))
      if (!refs.has(match[1]!)) throw new Error("DRCI_FACT_BINDING_INVALID");
  }
  const material = { contract: "DRCI_DRAFT_PACK_V1" as const,
    project: authoritative,
    generatedAt: input.generatedAt, protocolProjectionId: input.packet.protocolProjectionId,
    handoffDecisionDigest: input.packet.handoffDecisionDigest, sourceFacts: input.packet.sourceFacts,
    canonicalCrfPackageRef: input.packet.crf.packageId, documents: generated.documents, crfRows: generated.crfRows,
    crossConsistency: "SOURCE_BINDINGS_CHECKED_HUMAN_REVIEW_PENDING" as const, projectWriteAuthorized: false as const,
    reusedProtocolEvidenceRef: input.reusedProtocolEvidenceRef ?? null,
    preparationBinding: prepareDrciGenerationBatches(input.packet)[0].runtimeBinding.preparation };
  return { ...material, packDigest: logicalDigest(material) };
};

export const isDrciDraftPackCurrent = (pack: DrciDraftPack, project: ResearchProjectOwnerProjection) => {
  const { packDigest, ...material } = pack;
  return pack.project.projectId === project.projectId && pack.project.projectVersion === project.versionId
    && pack.project.projectDigest === project.projectDigest && packDigest === logicalDigest(material);
};
