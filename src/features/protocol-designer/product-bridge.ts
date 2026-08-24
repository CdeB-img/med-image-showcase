import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationConversation,
  ScientificInterpretationTurn,
  ScientificTemporalAnchorCandidate,
} from "../scientific-interpretation/contracts.js";
import type {
  ResearchProjectOwnerProjection,
  ResearchProjectSectionId,
} from "../research-project-construction/contribution-owner-boundary.js";
import {
  buildProjectContextSnapshot,
  canonicalProjectObjectType,
  ensureCanonicalProjectState,
} from "../research-project-construction/canonical-project-backbone.js";

export const PRODUCT_BRIDGE_API_VERSION = "1.0.0" as const;
export const DEFAULT_GEMINI_CONVERSATION_MODEL = "gemini-3.5-flash-lite" as const;
export const DEFAULT_OPENAI_EXTRACTION_MODEL = "gpt-5.6-terra" as const;
/** Historical alias retained for Level-3 diagnostics and fixtures. */
export const PRODUCT_BRIDGE_MODEL = DEFAULT_GEMINI_CONVERSATION_MODEL;
export const resolveGeminiConversationModel = (value?: string | null): string => value?.trim() || DEFAULT_GEMINI_CONVERSATION_MODEL;
export const resolveOpenAIExtractionModel = (value?: string | null): string => value?.trim() || DEFAULT_OPENAI_EXTRACTION_MODEL;
export const PERSISTENT_PROJECT_DELTA_CONTRACT = "PERSISTENT_PROJECT_DELTA_CANDIDATE" as const;

export const PERSISTENT_PROJECT_OBJECT_TYPES = [
  "SCIENTIFIC_QUESTION",
  "OBJECTIVE",
  "HYPOTHESIS",
  "CONDITION",
  "POPULATION",
  "ELIGIBILITY_CRITERION",
  "STUDY_DESIGN",
  "INTERVENTION",
  "COMPARATOR",
  "ENDPOINT",
  "CANONICAL_VARIABLE",
  "IMAGING_MODALITY",
  "ACQUISITION",
  "VISIT",
  "CONSTRAINT",
  "ANALYSIS_SPECIFICATION",
  "DATA_NEED",
  "UNCERTAINTY",
  "PROJECT_INFORMATION",
] as const;

/**
 * Roles that the current canonical Project runtime can preserve without
 * confusing an object's semantic type with a source-grounded study role.
 * Absence of a role is represented by omission at the provider boundary.
 */
export const PERSISTENT_PROJECT_STUDY_ROLES = [
  "SUBJECT",
  "INTERVENTION_ARM",
  "COMPARATOR_ARM",
  "REFERENCE_STANDARD",
  "MEASUREMENT",
  "OUTCOME_ROLE",
  "PRIMARY_REFERENCE_ARM",
  "PRIMARY_ENDPOINT",
] as const;

/**
 * Relations that the current Project delta compiler can preserve with endpoint
 * semantics derived from PD-003 V2 (plus the retained V1 design comparison).
 * EXPECTED_AT is intentionally carried by its dedicated typed contract.
 */
export const PERSISTENT_PROJECT_RELATION_TYPES = [
  "COMPARES_WITH",
  "COMPARED_WITH",
  "MOTIVATES_DATA_NEED",
  "COVERS_DATA_NEED",
  "OPERATIONALIZES",
] as const;

/**
 * Product form of the instruction validated by ARCH-CONV-03V. The experimental
 * control note is deliberately absent: this call produces the researcher-facing
 * reply and nothing else.
 */
export const NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION = `Tu es l'interlocuteur méthodologique de NOXIA.

Tu aides un chercheur à construire un projet scientifique.

Réponds naturellement au message, comme dans une conversation entre le chercheur et un méthodologiste expérimenté.

Comprends le contexte scientifique, les corrections, les références au projet et les formulations elliptiques.

Ne transforme jamais une hypothèse plausible en information explicitement fournie par l'utilisateur.

Lorsqu'une ambiguïté méthodologiquement importante empêche de comprendre le projet, demande une clarification naturelle.

Lorsqu'une information est seulement plausible, tu peux la présenter comme piste ou question, jamais comme fait acquis.

Ne remplis pas artificiellement les informations manquantes.

Ne présente jamais comme établi un rôle scientifique que le chercheur n'a pas explicitement formulé et qui n'est pas déjà adopté dans le contexte fourni. Le fait qu'une mesure soit envisagée ne signifie pas qu'elle est le critère principal. Si un rôle paraît méthodologiquement plausible, présente-le comme une possibilité ou une question, jamais comme une décision acquise. Cette règle vaut génériquement pour tous les rôles scientifiques.

Lorsqu'une formulation reste scientifiquement elliptique, cherche d'abord quelle information manquante change réellement la signification ou la structure du projet. Distingue notamment ce qui est étudié de comment cela sera observé ou mesuré. Si l'objet, le phénomène ou la propriété scientifique étudié reste indéterminé, clarifie d'abord ce point avant d'approfondir les modalités ou détails techniques. Ne remplis jamais cette ambiguïté à la place du chercheur.

Tu peux comprendre, reformuler ou proposer une modification. Tu ne dois jamais dire qu'une modification du Research Project a été effectuée, enregistrée ou adoptée si le contexte ne confirme pas qu'une décision humaine et une mise à jour du Project ont réellement eu lieu. Utilise par exemple « je comprends que vous souhaitez… », « je retiens comme proposition… » ou « on peut modifier… », et non « j'ai modifié… » ou « je fais la modification… » si aucune adoption n'est démontrée.

Reste concis dans l'échange nominal : deux à cinq phrases, sans accueil répété, sans résumé complet du projet et sans phrase de remplissage. Pose au plus une question principale. Une réponse plus longue est réservée à une explication demandée, une comparaison d'options, un risque important ou un résultat spécialisé nécessitant du contexte.

Lorsque NOXIA te fournit explicitement un besoin QRY après une adoption Project, ne choisis pas un autre besoin scientifique. Formule ce besoin comme une continuation courte et naturelle. Si l'utilisateur change de sujet, suis son sujet sans répéter mécaniquement la question précédente.

Pas de JSON. Pas de labels internes. Pas de description de l'architecture NOXIA. Réponds directement à l'utilisateur.`;

export const PERSISTENT_DELTA_SYSTEM_INSTRUCTION = `Tu extrais uniquement les conséquences scientifiques persistantes candidates pour le Research Project.

Le DERNIER MESSAGE UTILISATEUR est la source de l'assertion ou de l'adoption. Le Project adopté sert seulement à résoudre une référence, une correction ou un doublon. Les propositions récentes de NOXIA ne peuvent devenir une source scientifique que si le dernier message utilisateur les accepte explicitement ; conserve alors séparément le texte de la proposition et le texte de l'adoption.

Le Project Context Snapshot est une mémoire en lecture seule. Son tableau objects est l'inventaire exclusif des identifiants Project stables utilisables. Le contenu d'un objet Project antérieur n'est jamais une preuve du tour utilisateur courant et ne doit jamais être recopié dans sourceText, epistemicStatus ou proposalSourceText comme s'il venait du dernier message.

Ignore la conversation, les demandes d'explication ou de reformulation, les méta-questions, le ton, les pistes plausibles et toute information non explicitement acceptée par l'utilisateur.

Une mention dans une question, une demande d'information, une hypothèse exploratoire, un exemple ou une proposition n'est pas un fait du Project. Extrais uniquement ce que l'utilisateur affirme explicitement comme appartenant à son projet ou ce qu'il demande explicitement d'ajouter, retirer ou corriger. Demander si, combien, quand ou comment un élément est prévu n'établit ni sa présence ni sa valeur dans le Project. En cas de doute entre une demande conversationnelle et une modification persistante, retourne une liste vide.

Pour chaque modification durable explicite, propose une opération minimale et un objet scientifique typé. Préserve les rôles, hypothèses, comparaisons, temporalités, négations et relations explicitement formulés.

Pour chaque sourceText, COPIE une sous-chaîne contiguë exacte du DERNIER MESSAGE UTILISATEUR, caractère par caractère. Ne corrige pas l'orthographe, ne retire pas les accents, ne normalise pas la typographie ou la casse, ne traduis pas, ne résume pas et ne paraphrase pas. Si aucun fragment utilisateur courant ne porte littéralement l'assertion, ne la qualifie pas EXPLICIT_USER_STATED et n'invente aucun sourceText. Pour une réponse elliptique résolue par le contexte, sourceText reste le fragment utilisateur elliptique exact ; les mots du Project ou de NOXIA ne deviennent pas une fausse citation utilisateur.

Avant de rendre la sortie, effectue un contrôle littéral final sur CHAQUE sourceText de changes, relations, temporalQualifications et expectedVariableOccasions : sa valeur complète doit être contenue telle quelle dans le DERNIER MESSAGE UTILISATEUR. Vérifie notamment les déterminants, prépositions et contractions ; ne remplace aucun mot par une forme grammaticalement plus pratique. Si le fragment minimal envisagé n'est pas une copie certaine, utilise une proposition ou phrase contiguë plus large copiée exactement du message, sans en changer un caractère.

Lis le message entier avant de produire la sortie. Un même tour peut contenir plusieurs faits persistants indépendants : produis toutes leurs modifications atomiques, leurs relations et leurs qualifications temporelles. Ne sélectionne jamais un seul changement principal au détriment des autres faits explicites.

N'aplatis jamais plusieurs identités explicites dans un seul objet. Une comparaison entre une intervention et un comparateur produit deux objets distincts et une relation COMPARES_WITH. Une intervention dont l'identité exacte n'est pas fournie reste explicite comme catégorie et inconnue quant à son identité précise ; n'invente aucun nom, dose, phase, randomisation ou aveugle.

Traite séparément la provenance linguistique et l'état épistémique. EXPLICIT_USER_STATED signifie uniquement que le contenu est ancré dans un fragment utilisateur exact. Cela ne suffit jamais à rendre KNOWN une portée, un référentiel ou un qualificatif non fourni. Pour un contenu explicitement dit mais sous-spécifié, conserve la provenance EXPLICIT_USER_STATED et porte epistemicState = UNKNOWN. N'efface ni le contenu explicite ni l'inconnue.

Conserve un OBJECTIVE séparément d'une CONDITION, d'un ENDPOINT, d'une CANONICAL_VARIABLE et d'une ANALYSIS_SPECIFICATION. Lorsqu'une formulation exprime ce que le projet cherche à démontrer, évaluer, comparer, réduire, augmenter ou faire disparaître, représente ce but comme OBJECTIVE même si le mot « objectif » n'est pas écrit. Préserve séparément la cible ou condition concernée. Un objectif d'efficacité n'est pas une mesure. Un effet ou phénomène visé peut rester à préciser quant à sa définition opérationnelle.

Pour l'imagerie, distingue IMAGING_MODALITY, ACQUISITION, CANONICAL_VARIABLE, DATA_NEED et MeasurementDefinition. IMAGING_MODALITY identifie une modalité ou famille de méthode explicitement nommée. ACQUISITION représente une réalisation planifiée seulement lorsque l'utilisateur établit réellement qu'un examen, une collecte ou une acquisition aura lieu ; une modalité seulement envisagée ou comparée ne suffit pas. CANONICAL_VARIABLE représente une quantité, catégorie ou information de données définie pour le Project, jamais la modalité qui la produit. DATA_NEED représente l'information dont le Project a besoin. MeasurementDefinition reste une définition de méthode gouvernée hors de ce contrat Project et ne doit pas être inventée. Une modalité ou acquisition utilisée pour quantifier ou caractériser quelque chose peut OPERATIONALIZES un DATA_NEED, mais ne crée jamais à elle seule une MeasurementDefinition, une CANONICAL_VARIABLE ni un rôle biomarqueur. Lorsque le contexte établit une acquisition, conserve séparément l'identité de la modalité au lieu de la remplacer par l'acquisition.

Une procédure de mesure ou une méthode de référence n'est jamais une INTERVENTION du seul fait qu'elle est appliquée à un tissu, un animal ou un participant. Utilise ACQUISITION pour une acquisition ou un prélèvement, CANONICAL_VARIABLE pour la grandeur produite et DATA_NEED pour le besoin mesuré. ANALYSIS_SPECIFICATION est une spécification analytique autonome : elle exige au minimum une finalité ou question analytique, des entrées et une procédure suffisamment établies pour former une identité de spécification. Une simple mention de traitement, segmentation, quantification ou d'une méthode restant à définir ne suffit pas à la créer. Lorsque ce contexte méthodologique est explicitement dit mais reste trop incomplet pour constituer une MeasurementDefinition ou une ANALYSIS_SPECIFICATION, conserve-le séparément comme PROJECT_INFORMATION avec son fragment source exact, le lien contextuel lisible vers la grandeur concernée dans content et epistemicState = UNKNOWN. PROJECT_INFORMATION préserve ici une information Project sous-spécifiée ; il ne devient ni une méthode qualifiée par son owner ni un substitut permanent à MeasurementDefinition. N'attribue REFERENCE_STANDARD que si l'utilisateur établit explicitement ce rôle ou s'il est déjà adopté dans le Project.

Une comparaison peut porter sur des groupes ou interventions, mais aussi sur des modalités, acquisitions, procédures d'analyse ou grandeurs mesurées. Conserve les deux extrémités explicites et COMPARES_WITH sans transformer une comparaison méthodologique en comparaison de bras. Une affirmation utilisateur sur la précision ou la performance d'une méthode peut être conservée comme HYPOTHESIS ou rationale Project ; elle ne devient jamais une preuve Knowledge ni une hypothèse statistique formelle non formulée.

Toute temporalité explicitement exprimée doit être conservée dans temporalQualifications ; ne la résume pas dans content et ne la supprime pas lorsque son référentiel manque. Une temporalité exprimée dans le même message qu'un nouvel objet référence le candidateRef de cet objet. Un repère relatif ou abrégé reste une information temporelle explicite : conserve le référentiel UNKNOWN lorsqu'il n'est pas fourni ou reste ambigu.

Pour la population, sépare les dimensions persistantes qui possèdent des identités différentes lorsque le contrat le permet : cohorte ou population, borne d'âge, condition d'inclusion, absence ou exclusion, seuil d'éligibilité. Utilise ELIGIBILITY_CRITERION pour une contrainte d'éligibilité et conserve AMBIGUOUS ou UNKNOWN lorsque la portée exacte d'une absence ou exclusion n'est pas fournie. Ne transforme pas plusieurs critères indépendants en une seule phrase POPULATION.

ADD crée une nouvelle identité scientifique : omets targetProjectRef. Un objet Project existant seulement utile comme contexte n'est jamais la cible de ADD ; référence-le dans une relation. REPLACE et REMOVE exigent au contraire targetProjectRef. N'émets jamais les chaînes sentinelles "null", "none", "N/A" ou "undefined".

Une temporalité portant sur un objet Project existant n'est jamais un nouvel objet autonome. Utilise temporalQualifications avec l'identifiant stable de l'objet porteur, un rôle temporel typé et un anchor structuré. Pour « l'IRM sera réalisée entre J3 et J5 » sur une Acquisition IRM existante, propose ACQUISITION_TIME avec une fenêtre J3–J5 ; si le référentiel de J0 n'est pas fourni, conserve reference.status = UNKNOWN et n'invente aucune relation ANCHORED_TO.

Une occasion attendue de mesure utilise expectedVariableOccasions et référence une CANONICAL_VARIABLE stable. Elle ne crée ni nouvelle variable ni valeur observée. EXPECTED_AT ne s'applique pas à une modalité ou à une Acquisition.

REPLACE et REMOVE modifient l'objet existant désigné par targetProjectRef, qui doit être l'identifiant stable exact fourni dans les objets canoniques du Project. Une section ou un libellé n'est qu'une projection et ne remplace jamais cet identifiant stable.

N'émets REPLACE ou REMOVE que lorsque le DERNIER MESSAGE UTILISATEUR autorise réellement la correction, le remplacement ou le retrait de cette identité Project. sourceText doit alors être le fragment exact de ce dernier message qui autorise la mutation ; l'ancien contenu est retrouvé via targetProjectRef et ne devient jamais la source courante. Une précision, un enrichissement ou un fait plus spécifique n'autorise pas à lui seul le retrait, le remplacement ou la supersession d'un contenu antérieur. Conserve les deux candidats si leur articulation reste ouverte.

Un changement de rôle scientifique ne remplace pas l'identité scientifique. studyRole est indépendant de proposedType. Omets studyRole lorsqu'aucun rôle n'est explicitement établi par le dernier message ou déjà adopté sur l'objet Project référencé. Ne remplis jamais ce champ seulement parce qu'il existe. N'attribue jamais PRIMARY_INTERVENTION ou PRIMARY_OBJECTIVE : ces rôles ne font pas partie du contrat Project courant. Si l'utilisateur désigne explicitement un nouveau critère principal, conserve les objets distincts : retire le rôle principal de l'ancien objet avec REPLACE et studyRole explicitement nul dans le contrat local, puis attribue PRIMARY_ENDPOINT au nouvel objet par REPLACE s'il existe déjà ou ADD s'il est réellement nouveau. Ne déduis aucun rôle secondaire non formulé.

Une relation utilise uniquement un relationType admis par le contrat, un candidateRef déclaré dans changes de cette même sortie ou un stableId présent dans objects du Project Context Snapshot. Détermine d'abord le type scientifique de chaque extrémité, puis choisis seulement une signature compatible et conserve sa direction :
- COMPARES_WITH / COMPARED_WITH : INTERVENTION ou COMPARATOR vers INTERVENTION ou COMPARATOR ; ou IMAGING_MODALITY, ACQUISITION, ANALYSIS_SPECIFICATION ou CANONICAL_VARIABLE vers un objet de cette même famille de comparaison ;
- MOTIVATES_DATA_NEED : SCIENTIFIC_QUESTION, OBJECTIVE ou HYPOTHESIS vers DATA_NEED ;
- COVERS_DATA_NEED : CANONICAL_VARIABLE vers DATA_NEED ;
- OPERATIONALIZES : CANONICAL_VARIABLE, ACQUISITION ou ANALYSIS_SPECIFICATION vers DATA_NEED.
CONSUMED_BY_ANALYSIS est une relation canonique mais n'est pas disponible dans ce contrat produit : ne l'émets pas et n'utilise jamais OPERATIONALIZES comme substitut. Une ANALYSIS_SPECIFICATION ne peut donc jamais OPERATIONALIZES une CANONICAL_VARIABLE. La simple co-présence de deux objets n'établit aucune relation. N'invente jamais un identifiant, et n'utilise jamais un label, un contenu ou un sectionId comme référence. Si aucune signature admise ne représente fidèlement une relation optionnelle, omets la relation tout en conservant les objets explicites ; ne fabrique ni extrémité ni relation de remplacement. Une information inchangée déjà présente n'est pas une modification. Si aucune conséquence persistante explicite n'existe, retourne des listes vides.

Ne complète pas la science. Ne crée pas de rôle scientifique non formulé. Ne décide pas pour l'utilisateur. N'applique jamais le Project.`;

export const PROJECT_SECTION_IDS = [
  "POPULATION",
  "DESIGN",
  "INTERVENTION",
  "COMPARATOR",
  "IMAGING",
  "MEASUREMENTS",
  "TEMPORALITY",
  "ANALYSIS",
] as const satisfies readonly ResearchProjectSectionId[];

export const persistentProjectDeltaChangeSchema = z.object({
  operation: z.enum(["ADD", "REMOVE", "REPLACE"]),
  sourceText: z.string().min(1).max(4_000),
  targetSectionId: z.enum(PROJECT_SECTION_IDS).optional(),
  targetProjectRef: z.string().min(1).nullable().optional(),
  content: z.string().min(1).max(4_000),
  candidateRef: z.string().min(1).max(300).optional(),
  semanticIdentity: z.string().min(1).max(300).nullable().optional(),
  // Keep historical Level-3 payloads readable locally; the live provider is
  // bounded to PERSISTENT_PROJECT_OBJECT_TYPES by its function declaration.
  proposedType: z.string().min(1).max(120).optional(),
  polarity: z.enum(["AFFIRMED", "NEGATED", "UNKNOWN"]).optional(),
  // Keep historical Level-3 owner payloads readable locally. The live Gemini
  // boundary is separately checked against PERSISTENT_PROJECT_STUDY_ROLES.
  studyRole: z.string().min(1).max(120).nullable().optional(),
  epistemicStatus: z.enum(["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"]).optional(),
  epistemicState: z.enum(["KNOWN", "ASSUMED", "UNKNOWN", "WITHHELD"]).optional(),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]).optional(),
  proposalSourceText: z.string().min(1).max(4_000).nullable().optional(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20).optional(),
}).strict();

export const persistentProjectRelationSchema = z.object({
  relationRef: z.string().min(1).max(300),
  sourceText: z.string().min(1).max(4_000),
  relationType: z.string().min(1).max(120),
  sourceObjectRef: z.string().min(1).max(300),
  targetObjectRef: z.string().min(1).max(300),
  polarity: z.enum(["AFFIRMED", "NEGATED", "UNKNOWN"]),
  epistemicStatus: z.enum(["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"]),
  epistemicState: z.enum(["KNOWN", "ASSUMED", "UNKNOWN", "WITHHELD"]).optional(),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]),
  proposalSourceText: z.string().min(1).max(4_000).nullable().optional(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20),
}).strict();

export const persistentTemporalAnchorSchema = z.object({
  kind: z.enum(["TIMEPOINT", "RELATIVE_EVENT", "WINDOW", "INTERVAL"]),
  direction: z.enum(["BEFORE", "AT", "AFTER", "UNKNOWN"]),
  unit: z.string().min(1).max(40),
  offset: z.number().finite().nullable(),
  lowerBound: z.number().finite().nullable(),
  upperBound: z.number().finite().nullable(),
  relativeEventLabel: z.string().min(1).max(300).nullable(),
  tolerance: z.object({
    lower: z.number().finite().nullable(),
    upper: z.number().finite().nullable(),
    unit: z.string().min(1).max(40),
  }).strict().nullable(),
  reference: z.discriminatedUnion("status", [
    z.object({ status: z.literal("KNOWN"), referenceProjectRef: z.string().min(1).max(300) }).strict(),
    z.object({ status: z.literal("UNKNOWN"), unresolvedReason: z.enum(["REFERENCE_EVENT_NOT_SUPPLIED", "REFERENCE_EVENT_AMBIGUOUS"]) }).strict(),
  ]),
}).strict();

export const persistentTemporalQualificationSchema = z.object({
  operation: z.enum(["ADD", "REMOVE", "REPLACE"]),
  qualificationId: z.string().min(1).max(300),
  sourceText: z.string().min(1).max(4_000),
  subjectProjectRef: z.string().min(1).max(300),
  temporalRole: z.enum(["ACQUISITION_TIME", "COLLECTION_TIME", "PROCESSING_TIME", "TRANSFORMATION_TIME", "ANALYSIS_TIME"]),
  anchor: persistentTemporalAnchorSchema.nullable(),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]),
  proposalSourceText: z.string().min(1).max(4_000).nullable().optional(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20),
}).strict();

export const persistentExpectedVariableOccasionSchema = z.object({
  operation: z.enum(["ADD", "REMOVE", "REPLACE"]),
  occasionId: z.string().min(1).max(300),
  sourceText: z.string().min(1).max(4_000),
  variableProjectRef: z.string().min(1).max(300),
  anchor: persistentTemporalAnchorSchema.nullable(),
  studyUnitOrGroupRef: z.string().min(1).max(300).nullable().optional(),
  applicableContext: z.string().min(1).max(1_000).nullable().optional(),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]),
  proposalSourceText: z.string().min(1).max(4_000).nullable().optional(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20),
}).strict();

export const persistentProjectDeltaSchema = z.object({
  changes: z.array(persistentProjectDeltaChangeSchema).max(20).default([]),
  relations: z.array(persistentProjectRelationSchema).max(30).default([]),
  temporalQualifications: z.array(persistentTemporalQualificationSchema).max(20).default([]),
  expectedVariableOccasions: z.array(persistentExpectedVariableOccasionSchema).max(30).default([]),
}).strict();

const TEXTUAL_NULL_SENTINELS = new Set(["null", "none", "n/a", "undefined"]);

export type PersistentProviderContractValidation = {
  valid: boolean;
  blocks: string[];
};

/**
 * Checks the exact live-provider wire contract without narrowing historical
 * Level-3 fixtures or native owner payloads that legitimately use other role
 * vocabularies. This is a structural boundary only; it performs no linguistic
 * or scientific repair.
 */
export const validatePersistentProviderContract = (value: unknown): PersistentProviderContractValidation => {
  const parsed = persistentProjectDeltaSchema.safeParse(value);
  if (!parsed.success) return {
    valid: false,
    blocks: parsed.error.issues.map((issue) => `PROVIDER_SCHEMA:${issue.path.join(".")}:${issue.code}`),
  };

  const blocks: string[] = [];
  parsed.data.changes.forEach((change, index) => {
    const target = typeof change.targetProjectRef === "string" ? change.targetProjectRef.trim().toLocaleLowerCase("en-US") : null;
    if (target && TEXTUAL_NULL_SENTINELS.has(target)) blocks.push(`change:${index}:TARGET_PROJECT_REF_SENTINEL_FORBIDDEN`);
    if (change.targetProjectRef === null) blocks.push(`change:${index}:TARGET_PROJECT_REF_NULL_MUST_BE_OMITTED`);

    const role = typeof change.studyRole === "string" ? change.studyRole.trim() : null;
    if (role && TEXTUAL_NULL_SENTINELS.has(role.toLocaleLowerCase("en-US"))) blocks.push(`change:${index}:STUDY_ROLE_SENTINEL_FORBIDDEN`);
    if (role && !PERSISTENT_PROJECT_STUDY_ROLES.includes(role as (typeof PERSISTENT_PROJECT_STUDY_ROLES)[number])) {
      blocks.push(`change:${index}:STUDY_ROLE_OUTSIDE_PROVIDER_VOCABULARY`);
    }
  });
  parsed.data.relations.forEach((relation, index) => {
    if (!PERSISTENT_PROJECT_RELATION_TYPES.includes(relation.relationType as (typeof PERSISTENT_PROJECT_RELATION_TYPES)[number])) {
      blocks.push(`relation:${index}:RELATION_TYPE_OUTSIDE_PROVIDER_VOCABULARY`);
    }
  });
  return { valid: blocks.length === 0, blocks };
};

export type PersistentProjectDeltaChange = z.infer<typeof persistentProjectDeltaChangeSchema>;
export type PersistentProjectRelation = z.infer<typeof persistentProjectRelationSchema>;
export type PersistentTemporalQualification = z.infer<typeof persistentTemporalQualificationSchema>;
export type PersistentExpectedVariableOccasion = z.infer<typeof persistentExpectedVariableOccasionSchema>;
export type PersistentProjectDeltaWireCandidate = z.infer<typeof persistentProjectDeltaSchema>;
export type PersistentProjectDeltaCandidate = {
  contract: typeof PERSISTENT_PROJECT_DELTA_CONTRACT;
  contractVersion: "0.4.0";
  projectWriteAuthorized: false;
  changes: PersistentProjectDeltaChange[];
  relations: PersistentProjectRelation[];
  temporalQualifications: PersistentTemporalQualification[];
  expectedVariableOccasions: PersistentExpectedVariableOccasion[];
};

export type PersistentExtractionProviderArtifact = {
  artifactRef: string;
  requestTurnRef: string;
  provider: "GOOGLE_GEMINI" | "OPENAI";
  model: string;
  modelRequested?: string | null;
  modelReturned?: string | null;
  functionName: "propose_persistent_project_delta";
  receivedAt: string;
  providerResponseId: string | null;
  providerRequestId?: string | null;
  endpoint?: string;
  sourceProjectId?: string | null;
  sourceProjectVersion?: string | null;
  sourceProjectDigest?: string | null;
  promptDigest?: string;
  schemaDigest?: string;
  configurationDigest?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
    output_tokens_details?: { reasoning_tokens?: number };
  } | null;
  structuredArgsExact: unknown;
  structuredArgsSerialized: string;
  structuredArgsDigest: string;
};

export type PersistentDeltaNormalization = {
  code: "IMAGING_MODALITY_TEMPORAL_SUBJECT_NORMALIZED_TO_ACQUISITION";
  sourceCandidateRef: string;
  fromObjectType: "IMAGING_MODALITY";
  toObjectType: "ACQUISITION";
  reason: "ACQUISITION_TIME_SUBJECT";
};

export type PersistentDeltaValidation = {
  valid: boolean;
  acceptedChanges: PersistentProjectDeltaChange[];
  acceptedRelations: PersistentProjectRelation[];
  acceptedTemporalQualifications: PersistentTemporalQualification[];
  acceptedExpectedVariableOccasions: PersistentExpectedVariableOccasion[];
  blocks: string[];
  noOps: string[];
  normalizations: PersistentDeltaNormalization[];
};

export type ProductBridgeRequest = {
  apiVersion: typeof PRODUCT_BRIDGE_API_VERSION;
  conversation: ScientificInterpretationConversation;
  currentProject: ResearchProjectOwnerProjection | null;
  evaluatePersistentDelta: boolean;
  requestKind?: "USER_TURN" | "POST_ADOPTION_QRY_CONTINUATION";
};

export type ProductBridgeResponse = {
  apiVersion: typeof PRODUCT_BRIDGE_API_VERSION;
  assistantReply: string;
  assistantTurn: ScientificInterpretationTurn;
  persistentExtraction: {
    called: boolean;
    status: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE";
    failure?: {
      code: "PERSISTENT_VALIDATION_BLOCKED" | "PERSISTENT_PROVIDER_FAILURE";
      message: string;
      details: string[];
      provider: {
        stage: "PERSISTENT_DELTA";
        provider?: "GOOGLE_GEMINI" | "OPENAI";
        httpStatus: number | null;
        providerStatus: string | null;
        providerMessage: string;
        responseId: string | null;
        requestId?: string | null;
      } | null;
    } | null;
    providerArtifact: PersistentExtractionProviderArtifact | null;
    wireCandidate: PersistentProjectDeltaWireCandidate | null;
    candidate: PersistentProjectDeltaCandidate | null;
    validation: PersistentDeltaValidation | null;
    contribution: ScientificInterpretationContributionEnvelope | null;
  };
  observability: {
    provider: "GOOGLE_GEMINI";
    model: string;
    conversationProvider?: "GOOGLE_GEMINI";
    conversationModel?: string;
    extractionProvider?: "OPENAI" | null;
    extractionModelRequested?: string | null;
    extractionModelReturned?: string | null;
    conversationLatencyMs: number;
    extractionLatencyMs: number | null;
    calls: 1 | 2;
    projectWrites: 0;
    conversationUsage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | null;
    extractionUsage?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
      input_tokens_details?: { cached_tokens?: number };
      output_tokens_details?: { reasoning_tokens?: number };
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    } | null;
  };
};

const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/\s+/g, " ").trim();

const projectElements = (project: ResearchProjectOwnerProjection | null) => project
  ? ensureCanonicalProjectState(project).objects
    .filter((object) => object.actuality === "CURRENT")
    .map((object) => ({
      sectionId: object.sectionId,
      element: {
        ...object.projection,
        elementId: object.objectId,
        sourceProposedType: object.projection.sourceProposedType ?? object.objectType,
        sourceStudyRole: object.scientificRole,
      },
    }))
  : [];

export const validatePersistentProjectDelta = (
  value: unknown,
  rawUserTurn: string,
  project: ResearchProjectOwnerProjection | null,
  conversation?: ScientificInterpretationConversation,
): { wireCandidate: z.infer<typeof persistentProjectDeltaSchema> | null; candidate: PersistentProjectDeltaCandidate | null; validation: PersistentDeltaValidation } => {
  const parsed = persistentProjectDeltaSchema.safeParse(value);
  if (!parsed.success) return {
    wireCandidate: null,
    candidate: null,
    validation: {
      valid: false,
      acceptedChanges: [],
      acceptedRelations: [],
      acceptedTemporalQualifications: [],
      acceptedExpectedVariableOccasions: [],
      blocks: ["PERSISTENT_DELTA_CONTRACT_INVALID"],
      noOps: [],
      normalizations: [],
    },
  };

  const elements = projectElements(project);
  const canonicalState = project ? ensureCanonicalProjectState(project) : null;
  const acceptedChanges: PersistentProjectDeltaChange[] = [];
  const acceptedRelations: PersistentProjectRelation[] = [];
  const acceptedTemporalQualifications: PersistentTemporalQualification[] = [];
  const acceptedExpectedVariableOccasions: PersistentExpectedVariableOccasion[] = [];
  const blocks: string[] = [];
  const noOps: string[] = [];
  const normalizations: PersistentDeltaNormalization[] = [];
  const signatures = new Set<string>();
  const candidateRefs = new Set<string>();
  const recentAssistantText = (conversation?.turns ?? []).filter((turn) => turn.role === "NOXIA");

  const validateAssertion = (input: {
    prefix: string;
    assertionKind?: "USER_STATED" | "USER_ADOPTED_PROPOSAL" | "OWNER_SUPPORTED";
    proposalSourceText?: string | null;
    evidenceRefs?: string[];
  }) => {
    const assertionKind = input.assertionKind ?? "USER_STATED";
    if (assertionKind === "USER_ADOPTED_PROPOSAL") {
      if (!input.proposalSourceText || !recentAssistantText.some((turn) => turn.content.includes(input.proposalSourceText!))) {
        blocks.push(`${input.prefix}:ADOPTED_PROPOSAL_SOURCE_NOT_IN_ASSISTANT_CONTEXT`);
        return false;
      }
    }
    if (assertionKind === "OWNER_SUPPORTED" && !(input.evidenceRefs?.length)) {
      blocks.push(`${input.prefix}:OWNER_SUPPORTED_EVIDENCE_REQUIRED`);
      return false;
    }
    return true;
  };

  parsed.data.changes.forEach((change, index) => {
    const prefix = `change:${index}`;
    if (!rawUserTurn.includes(change.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: change.assertionKind, proposalSourceText: change.proposalSourceText, evidenceRefs: change.evidenceRefs })) return;
    if (change.candidateRef) {
      if (candidateRefs.has(change.candidateRef)) {
        blocks.push(`${prefix}:DUPLICATE_CANDIDATE_REF`);
        return;
      }
      candidateRefs.add(change.candidateRef);
    }
    const target = change.targetProjectRef
      ? elements.find(({ element }) => element.elementId === change.targetProjectRef)
      : null;
    if (change.operation === "ADD" && change.targetProjectRef != null) {
      blocks.push(`${prefix}:ADD_MUST_NOT_TARGET_EXISTING_REF`);
      return;
    }
    if (change.operation === "ADD" && [change.candidateRef, change.semanticIdentity]
      .some((ref) => ref && elements.some(({ element }) => element.elementId === ref))) {
      blocks.push(`${prefix}:ADD_MUST_USE_NEW_IDENTITY`);
      return;
    }
    if (change.operation !== "ADD" && !target) {
      blocks.push(`${prefix}:PROJECT_REF_INVALID`);
      return;
    }
    const targetRole = target?.element.sourceStudyRole ?? null;
    const proposedRole = change.studyRole === undefined ? targetRole : change.studyRole;
    const targetType = target?.element.sourceProposedType ?? null;
    const proposedType = change.proposedType ?? targetType;
    const canonicalType = canonicalProjectObjectType({
      proposedType: proposedType ?? null,
      studyRole: proposedRole ?? null,
    });
    if (proposedRole === "REFERENCE_STANDARD" && ["INTERVENTION_OR_EXPOSURE", "GROUP"].includes(canonicalType)) {
      blocks.push(`${prefix}:REFERENCE_STANDARD_NOT_STUDY_INTERVENTION_OR_ARM`);
      return;
    }
    const targetPolarity = target?.element.sourcePolarity ?? "AFFIRMED";
    const proposedPolarity = change.polarity ?? targetPolarity;
    if (change.operation === "REPLACE" && target
      && normalized(target.element.content) === normalized(change.content)
      && normalized(targetRole ?? "") === normalized(proposedRole ?? "")
      && normalized(targetType ?? "") === normalized(proposedType ?? "")
      && normalized(targetPolarity) === normalized(proposedPolarity)) {
      noOps.push(`${prefix}:REPLACE_NO_NET_CHANGE`);
      return;
    }
    if (change.operation === "ADD" && elements.some(({ sectionId, element }) => (!change.targetSectionId || sectionId === change.targetSectionId)
      && normalized(element.content) === normalized(change.content))) {
      noOps.push(`${prefix}:DUPLICATE_EXISTING_ELEMENT`);
      return;
    }
    const signature = `${change.operation}:${change.targetSectionId ?? change.proposedType ?? "UNCLASSIFIED"}:${change.targetProjectRef ?? "NEW"}:${normalized(change.content)}`;
    if (signatures.has(signature)) {
      noOps.push(`${prefix}:DUPLICATE_CANDIDATE_CHANGE`);
      return;
    }
    signatures.add(signature);
    acceptedChanges.push(change);
  });

  // The wire contract may express “IRM à M3” as a modality carrying an
  // AcquisitionTime. Preserve the exact wire artifact, but normalize that
  // same-turn candidate to the canonical object capable of carrying the role.
  // This rule is structural only: it does not inspect French or create a fact
  // absent from the provider proposal.
  const acquisitionTimeSubjectRefs = new Set(parsed.data.temporalQualifications
    .filter((qualification) => qualification.temporalRole === "ACQUISITION_TIME")
    .map((qualification) => qualification.subjectProjectRef));
  const normalizedChanges = acceptedChanges.map((change) => {
    if (change.operation !== "ADD") return change;
    const matchingRef = [change.candidateRef, change.semanticIdentity]
      .find((ref): ref is string => Boolean(ref && acquisitionTimeSubjectRefs.has(ref)));
    if (!matchingRef || canonicalProjectObjectType({
      proposedType: change.proposedType ?? null,
      studyRole: change.studyRole ?? null,
    }) !== "IMAGING_MODALITY") return change;
    normalizations.push({
      code: "IMAGING_MODALITY_TEMPORAL_SUBJECT_NORMALIZED_TO_ACQUISITION",
      sourceCandidateRef: matchingRef,
      fromObjectType: "IMAGING_MODALITY",
      toObjectType: "ACQUISITION",
      reason: "ACQUISITION_TIME_SUBJECT",
    });
    return { ...change, proposedType: "ACQUISITION" };
  });

  const allowedObjectRefs = new Set([
    ...elements.map(({ element }) => element.elementId),
    ...normalizedChanges.flatMap((change) => [change.candidateRef, change.semanticIdentity, change.targetProjectRef].filter((ref): ref is string => Boolean(ref))),
  ]);
  const currentObjectType = new Map(canonicalState?.objects
    .filter((object) => object.actuality === "CURRENT")
    .map((object) => [object.objectId, object.objectType] as const) ?? []);
  const knownObjectType = new Map(currentObjectType);
  for (const change of normalizedChanges) {
    if (change.operation === "REMOVE") continue;
    const candidateType = canonicalProjectObjectType({
      proposedType: change.proposedType ?? null,
      studyRole: change.studyRole ?? null,
    });
    for (const ref of [change.candidateRef, change.semanticIdentity].filter((value): value is string => Boolean(value))) {
      knownObjectType.set(ref, candidateType);
    }
  }
  const relationEndpointsCompatible = (relationType: string, sourceRef: string, targetRef: string) => {
    const sourceType = knownObjectType.get(sourceRef);
    const targetType = knownObjectType.get(targetRef);
    if (!sourceType || !targetType) return false;
    if (relationType === "COMPARES_WITH" || relationType === "COMPARED_WITH") {
      const studyArms = new Set(["INTERVENTION_OR_EXPOSURE", "GROUP"]);
      const measurementMethods = new Set(["IMAGING_MODALITY", "ACQUISITION", "ANALYSIS_SPECIFICATION", "CANONICAL_VARIABLE"]);
      return (studyArms.has(sourceType) && studyArms.has(targetType))
        || (measurementMethods.has(sourceType) && measurementMethods.has(targetType));
    }
    if (relationType === "MOTIVATES_DATA_NEED") {
      return ["SCIENTIFIC_QUESTION", "OBJECTIVE", "HYPOTHESIS"].includes(sourceType) && targetType === "DATA_NEED";
    }
    if (relationType === "COVERS_DATA_NEED") return sourceType === "CANONICAL_VARIABLE" && targetType === "DATA_NEED";
    if (relationType === "OPERATIONALIZES") {
      return ["CANONICAL_VARIABLE", "ACQUISITION", "ANALYSIS_SPECIFICATION"].includes(sourceType) && targetType === "DATA_NEED";
    }
    return false;
  };
  (parsed.data.relations ?? []).forEach((relation, index) => {
    const prefix = `relation:${index}`;
    if (!rawUserTurn.includes(relation.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: relation.assertionKind, proposalSourceText: relation.proposalSourceText, evidenceRefs: relation.evidenceRefs })) return;
    if (!PERSISTENT_PROJECT_RELATION_TYPES.includes(relation.relationType as (typeof PERSISTENT_PROJECT_RELATION_TYPES)[number])) {
      blocks.push(`${prefix}:RELATION_TYPE_OUTSIDE_PROVIDER_VOCABULARY`);
      return;
    }
    const missing = [relation.sourceObjectRef, relation.targetObjectRef].filter((ref) => !allowedObjectRefs.has(ref));
    if (missing.length) {
      blocks.push(`${prefix}:PROJECT_RELATION_ENDPOINT_INVALID`);
      return;
    }
    if (!relationEndpointsCompatible(relation.relationType, relation.sourceObjectRef, relation.targetObjectRef)) {
      blocks.push(`${prefix}:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH`);
      return;
    }
    const signature = `${relation.relationType}:${relation.sourceObjectRef}:${relation.targetObjectRef}:${relation.polarity}`;
    if (signatures.has(signature)) {
      noOps.push(`${prefix}:DUPLICATE_CANDIDATE_RELATION`);
      return;
    }
    signatures.add(signature);
    acceptedRelations.push(relation);
  });

  const currentTemporalQualifications = canonicalState?.temporalQualifications.filter((item) => item.actuality === "CURRENT") ?? [];
  const currentExpectedOccasions = canonicalState?.expectedVariableOccasions.filter((item) => item.actuality === "CURRENT") ?? [];

  const validateAnchor = (anchor: z.infer<typeof persistentTemporalAnchorSchema> | null, prefix: string) => {
    if (!anchor) {
      blocks.push(`${prefix}:TEMPORAL_ANCHOR_REQUIRED`);
      return false;
    }
    if ((anchor.kind === "WINDOW" || anchor.kind === "INTERVAL")
      && (anchor.lowerBound === null || anchor.upperBound === null || anchor.lowerBound > anchor.upperBound)) {
      blocks.push(`${prefix}:TEMPORAL_ANCHOR_BOUNDS_INVALID`);
      return false;
    }
    if (anchor.kind === "TIMEPOINT" && anchor.offset === null) {
      blocks.push(`${prefix}:TEMPORAL_ANCHOR_OFFSET_REQUIRED`);
      return false;
    }
    if (anchor.reference.status === "KNOWN" && !knownObjectType.has(anchor.reference.referenceProjectRef)) {
      blocks.push(`${prefix}:TEMPORAL_REFERENCE_INVALID`);
      return false;
    }
    return true;
  };

  parsed.data.temporalQualifications.forEach((qualification, index) => {
    const prefix = `temporalQualification:${index}`;
    if (!rawUserTurn.includes(qualification.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: qualification.assertionKind, proposalSourceText: qualification.proposalSourceText, evidenceRefs: qualification.evidenceRefs })) return;
    const subjectType = knownObjectType.get(qualification.subjectProjectRef);
    if (!subjectType) {
      blocks.push(`${prefix}:PROJECT_REF_INVALID`);
      return;
    }
    if (qualification.temporalRole === "ACQUISITION_TIME" && subjectType !== "ACQUISITION") {
      blocks.push(`${prefix}:TEMPORAL_ROLE_SUBJECT_MISMATCH`);
      return;
    }
    if (qualification.temporalRole === "ANALYSIS_TIME" && subjectType !== "ANALYSIS_SPECIFICATION") {
      blocks.push(`${prefix}:TEMPORAL_ROLE_SUBJECT_MISMATCH`);
      return;
    }
    const previous = currentTemporalQualifications.find((item) => item.qualificationId === qualification.qualificationId) ?? null;
    if (qualification.operation === "ADD" && previous) {
      noOps.push(`${prefix}:QUALIFICATION_ALREADY_EXISTS`);
      return;
    }
    if (qualification.operation !== "ADD" && !previous) {
      blocks.push(`${prefix}:TEMPORAL_QUALIFICATION_REF_INVALID`);
      return;
    }
    if (previous && (previous.subjectProjectRef !== qualification.subjectProjectRef || previous.temporalRole !== qualification.temporalRole)) {
      blocks.push(`${prefix}:TEMPORAL_ROLE_SUBJECT_MISMATCH`);
      return;
    }
    if (qualification.operation !== "REMOVE" && !validateAnchor(qualification.anchor, prefix)) return;
    if (qualification.operation === "REMOVE" && qualification.anchor !== null) {
      blocks.push(`${prefix}:REMOVE_MUST_NOT_CARRY_ANCHOR`);
      return;
    }
    acceptedTemporalQualifications.push(qualification);
  });

  parsed.data.expectedVariableOccasions.forEach((occasion, index) => {
    const prefix = `expectedVariableOccasion:${index}`;
    if (!rawUserTurn.includes(occasion.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: occasion.assertionKind, proposalSourceText: occasion.proposalSourceText, evidenceRefs: occasion.evidenceRefs })) return;
    if (knownObjectType.get(occasion.variableProjectRef) !== "CANONICAL_VARIABLE") {
      blocks.push(`${prefix}:EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE`);
      return;
    }
    if (occasion.studyUnitOrGroupRef && !knownObjectType.has(occasion.studyUnitOrGroupRef)) {
      blocks.push(`${prefix}:EXPECTED_OCCASION_CONTEXT_REF_INVALID`);
      return;
    }
    const previous = currentExpectedOccasions.find((item) => item.occasionId === occasion.occasionId) ?? null;
    if (occasion.operation === "ADD" && previous) {
      noOps.push(`${prefix}:EXPECTED_OCCASION_ALREADY_EXISTS`);
      return;
    }
    if (occasion.operation !== "ADD" && !previous) {
      blocks.push(`${prefix}:EXPECTED_OCCASION_REF_INVALID`);
      return;
    }
    if (previous && previous.variableProjectRef !== occasion.variableProjectRef) {
      blocks.push(`${prefix}:EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE`);
      return;
    }
    if (occasion.operation !== "REMOVE" && !validateAnchor(occasion.anchor, prefix)) return;
    if (occasion.operation === "REMOVE" && occasion.anchor !== null) {
      blocks.push(`${prefix}:REMOVE_MUST_NOT_CARRY_ANCHOR`);
      return;
    }
    acceptedExpectedVariableOccasions.push(occasion);
  });

  const validation = {
    valid: blocks.length === 0,
    acceptedChanges: normalizedChanges,
    acceptedRelations,
    acceptedTemporalQualifications,
    acceptedExpectedVariableOccasions,
    blocks,
    noOps,
    normalizations,
  };
  return {
    wireCandidate: parsed.data,
    candidate: blocks.length ? null : {
      contract: PERSISTENT_PROJECT_DELTA_CONTRACT,
      contractVersion: "0.4.0",
      projectWriteAuthorized: false,
      changes: normalizedChanges,
      relations: acceptedRelations,
      temporalQualifications: acceptedTemporalQualifications,
      expectedVariableOccasions: acceptedExpectedVariableOccasions,
    },
    validation,
  };
};

const typeForSection: Record<(typeof PROJECT_SECTION_IDS)[number], string> = {
  POPULATION: "ELIGIBILITY_CRITERION",
  DESIGN: "STUDY_DESIGN",
  INTERVENTION: "INTERVENTION",
  COMPARATOR: "COMPARATOR",
  IMAGING: "MODALITY",
  MEASUREMENTS: "MEASUREMENT",
  TEMPORALITY: "TIMEPOINT",
  ANALYSIS: "ANALYSIS_INTENT",
};

const itemFromChange = (input: {
  change: PersistentProjectDeltaChange;
  index: number;
  turn: ScientificInterpretationTurn;
  conversation: ScientificInterpretationConversation;
  project: ResearchProjectOwnerProjection | null;
}): ScientificContributionItem => {
  const target = projectElements(input.project).find(({ element }) => element.elementId === input.change.targetProjectRef)?.element ?? null;
  const itemId = input.change.candidateRef ?? `persistent-delta-item:${logicalDigest({ turnId: input.turn.turnId, index: input.index, change: input.change })}`;
  const assertionKind = input.change.assertionKind ?? "USER_STATED";
  const proposalTurn = assertionKind === "USER_ADOPTED_PROPOSAL" && input.change.proposalSourceText
    ? [...input.conversation.turns].reverse().find((turn) => turn.role === "NOXIA" && turn.content.includes(input.change.proposalSourceText!)) ?? null
    : null;
  const sourceTurnIds = [...new Set([proposalTurn?.turnId, input.turn.turnId].filter((ref): ref is string => Boolean(ref)))];
  return {
    itemId,
    semanticIdentity: target?.elementId ?? input.change.semanticIdentity ?? itemId,
    proposedType: target?.sourceProposedType ?? input.change.proposedType ?? typeForSection[input.change.targetSectionId ?? "ANALYSIS"],
    content: input.change.operation === "REMOVE" && target ? target.content : input.change.content,
    polarity: input.change.operation === "REMOVE" ? "NEGATED" : input.change.polarity ?? "AFFIRMED",
    studyRole: input.change.studyRole === undefined ? target?.sourceStudyRole ?? null : input.change.studyRole,
    confidence: 1,
    previousItemIds: input.change.targetProjectRef ? [input.change.targetProjectRef] : [],
    evidenceRefs: [...(input.change.evidenceRefs ?? [])],
    epistemicBoundary: {
      ownership: assertionKind === "USER_ADOPTED_PROPOSAL" ? "NOXIA" : assertionKind === "OWNER_SUPPORTED" ? "OWNER" : "USER",
      epistemicState: input.change.epistemicState ?? null,
      epistemicStatus: assertionKind === "USER_ADOPTED_PROPOSAL"
        ? "CONFIRMED_BY_USER"
        : assertionKind === "OWNER_SUPPORTED"
          ? "SUPPORTED_CANDIDATE"
          : input.change.epistemicStatus ?? "EXPLICIT_USER_STATED",
      adoptionStatus: "CANDIDATE",
      originType: assertionKind === "USER_ADOPTED_PROPOSAL" ? "ASSISTANT_PROPOSAL" : assertionKind,
      originStatus: assertionKind === "USER_ADOPTED_PROPOSAL" ? "USER_EXPLICITLY_ADOPTED" : "PERSISTENT_EXTRACTION_CANDIDATE",
      activeState: input.change.operation !== "REMOVE",
      sourceTurnIds,
      sourceText: input.change.sourceText,
    },
  };
};

const relationFromPersistentCandidate = (input: {
  relation: PersistentProjectRelation;
  turn: ScientificInterpretationTurn;
  conversation: ScientificInterpretationConversation;
}) => {
  const proposalTurn = input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" && input.relation.proposalSourceText
    ? [...input.conversation.turns].reverse().find((turn) => turn.role === "NOXIA" && turn.content.includes(input.relation.proposalSourceText!)) ?? null
    : null;
  return {
    relationId: input.relation.relationRef,
    relationType: input.relation.relationType,
    sourceItemId: input.relation.sourceObjectRef,
    targetItemId: input.relation.targetObjectRef,
    polarity: input.relation.polarity,
    confidence: 1,
    evidenceRefs: [...input.relation.evidenceRefs],
    epistemicBoundary: {
      ownership: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" ? "NOXIA" : input.relation.assertionKind === "OWNER_SUPPORTED" ? "OWNER" : "USER",
      epistemicState: input.relation.epistemicState ?? null,
      epistemicStatus: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL"
        ? "CONFIRMED_BY_USER"
        : input.relation.assertionKind === "OWNER_SUPPORTED"
          ? "SUPPORTED_CANDIDATE"
          : input.relation.epistemicStatus,
      adoptionStatus: "CANDIDATE",
      originType: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" ? "ASSISTANT_PROPOSAL" : input.relation.assertionKind,
      originStatus: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" ? "USER_EXPLICITLY_ADOPTED" : "PERSISTENT_EXTRACTION_CANDIDATE",
      activeState: true,
      sourceTurnIds: [...new Set([proposalTurn?.turnId, input.turn.turnId].filter((ref): ref is string => Boolean(ref)))],
      sourceText: input.relation.sourceText,
    },
  };
};

const contributionTemporalAnchor = (
  anchor: PersistentTemporalQualification["anchor"] | PersistentExpectedVariableOccasion["anchor"],
): ScientificTemporalAnchorCandidate | null => {
  if (!anchor) return null;
  if (!anchor.kind || !anchor.direction || !anchor.unit || anchor.offset === undefined
    || anchor.lowerBound === undefined || anchor.upperBound === undefined
    || anchor.relativeEventLabel === undefined || anchor.tolerance === undefined || !anchor.reference?.status) {
    throw new Error("PERSISTENT_TEMPORAL_ANCHOR_NOT_NORMALIZED");
  }
  const reference = anchor.reference.status === "KNOWN"
    ? { status: "KNOWN" as const, referenceProjectRef: anchor.reference.referenceProjectRef! }
    : { status: "UNKNOWN" as const, unresolvedReason: anchor.reference.unresolvedReason! };
  return {
    kind: anchor.kind,
    direction: anchor.direction,
    unit: anchor.unit,
    offset: anchor.offset,
    lowerBound: anchor.lowerBound,
    upperBound: anchor.upperBound,
    relativeEventLabel: anchor.relativeEventLabel,
    tolerance: anchor.tolerance ? {
      lower: anchor.tolerance.lower ?? null,
      upper: anchor.tolerance.upper ?? null,
      unit: anchor.tolerance.unit!,
    } : null,
    reference,
  };
};

export const contributionFromPersistentDelta = (input: {
  candidate: PersistentProjectDeltaCandidate;
  conversation: ScientificInterpretationConversation;
  currentProject: ResearchProjectOwnerProjection | null;
  providerArtifact?: PersistentExtractionProviderArtifact | null;
  createdAt?: string;
}): ScientificInterpretationContributionEnvelope | null => {
  if (!input.candidate.changes.length
    && !input.candidate.relations.length
    && !input.candidate.temporalQualifications.length
    && !input.candidate.expectedVariableOccasions.length) return null;
  const lastUserTurn = [...input.conversation.turns].reverse().find((turn) => turn.role === "USER");
  if (!lastUserTurn) return null;
  const createdAt = input.createdAt ?? new Date().toISOString();
  const items = input.candidate.changes.map((change, index) => itemFromChange({
    change,
    index,
    turn: lastUserTurn,
    conversation: input.conversation,
    project: input.currentProject,
  }));
  const relations = input.candidate.relations.map((relation) => relationFromPersistentCandidate({ relation, turn: lastUserTurn, conversation: input.conversation }));
  const candidateObjects = items.filter((item, index) => input.candidate.changes[index]?.targetSectionId !== "TEMPORALITY"
    && !/TEMPORAL|TIMING|TIMEPOINT|WINDOW|VISIT/i.test(item.proposedType ?? ""));
  const temporalElements = items.filter((item, index) => input.candidate.changes[index]?.targetSectionId === "TEMPORALITY"
    || /TEMPORAL|TIMING|TIMEPOINT|WINDOW|VISIT/i.test(item.proposedType ?? ""));
  const correctionsAndSupersessions = items.filter((_, index) => input.candidate.changes[index]?.operation !== "ADD");
  const contributionId = `persistent-project-contribution:${logicalDigest({
    conversationId: input.conversation.conversationId,
    turnId: lastUserTurn.turnId,
    changes: input.candidate.changes,
    baseProject: input.currentProject?.versionId ?? null,
  })}`;
  const contributionDigest = logicalDigest({ contributionId, candidate: input.candidate, items });
  return {
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId,
      previousContributionId: input.currentProject?.contributionRef ?? null,
      contractVersion: "1.0.0",
      runtimeId: "MINIMAL_PRODUCT_BRIDGE_PERSISTENT_DELTA",
      runtimeVersion: "0.4.0",
      createdAt,
      contributionDigest,
    },
    source: {
      conversationId: input.conversation.conversationId,
      originalRequest: lastUserTurn.content,
      turns: input.conversation.turns,
      sourceRefs: [...new Set([
        lastUserTurn.turnId,
        ...items.flatMap((item) => item.epistemicBoundary.sourceTurnIds),
        ...relations.flatMap((relation) => relation.epistemicBoundary.sourceTurnIds),
      ])],
      rawOutputRef: input.providerArtifact?.artifactRef ?? null,
      rawOutputDigest: input.providerArtifact?.structuredArgsDigest ?? null,
    },
    runtimeEvidence: {
      provider: input.providerArtifact?.provider ?? "GOOGLE_GEMINI",
      model: input.providerArtifact?.modelReturned ?? input.providerArtifact?.model ?? PRODUCT_BRIDGE_MODEL,
      promptDigest: input.providerArtifact?.promptDigest ?? logicalDigest(PERSISTENT_DELTA_SYSTEM_INSTRUCTION),
      schemaDigest: input.providerArtifact?.schemaDigest ?? logicalDigest(persistentProjectDeltaSchema.toString()),
      configurationDigest: input.providerArtifact?.configurationDigest
        ?? logicalDigest({ model: PRODUCT_BRIDGE_MODEL, mode: "REQUIRED_FUNCTION_CALL", version: "0.3.0" }),
      technicalStatus: "STRUCTURED_CONTRACT_VALID",
      parseStatus: "PARSED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: null,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects,
      candidateRelations: relations,
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements,
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions,
      openDecisions: [],
      clarificationNeeds: [],
      temporalQualifications: input.candidate.temporalQualifications.map((candidate) => ({
        operation: candidate.operation,
        qualificationId: candidate.qualificationId,
        subjectProjectRef: candidate.subjectProjectRef,
        temporalRole: candidate.temporalRole,
        anchor: contributionTemporalAnchor(candidate.anchor),
        sourceText: candidate.sourceText,
        assertionKind: candidate.assertionKind,
        evidenceRefs: [...candidate.evidenceRefs],
      })),
      expectedVariableOccasions: input.candidate.expectedVariableOccasions.map((candidate) => ({
        operation: candidate.operation,
        occasionId: candidate.occasionId,
        variableProjectRef: candidate.variableProjectRef,
        anchor: contributionTemporalAnchor(candidate.anchor),
        studyUnitOrGroupRef: candidate.studyUnitOrGroupRef,
        applicableContext: candidate.applicableContext,
        sourceText: candidate.sourceText,
        assertionKind: candidate.assertionKind,
        evidenceRefs: [...candidate.evidenceRefs],
      })),
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: items.map((item) => ({
      sourceItemId: item.itemId,
      proposedTargetDomain: "RESEARCH_PROJECT",
      proposedTargetTypes: [item.proposedType ?? "PROJECT_INFORMATION"],
      mappingStatus: "EXACT_CONTRIBUTION",
      qualificationOwnerRequired: null,
      mappingLimitations: [],
    })),
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  };
};

export const relevantProjectContext = (project: ResearchProjectOwnerProjection | null) => project ? {
  ...buildProjectContextSnapshot({ project }),
  revision: project.revision,
  sections: project.sections.filter((section) => section.sectionId !== "QUESTION").map((section) => ({
    sectionId: section.sectionId,
    label: section.label,
    elements: section.elements.map((element) => ({
      stableId: element.elementId,
      semanticKey: element.semanticKey ?? null,
      content: element.content,
      scientificType: element.sourceProposedType ?? null,
      scientificRole: element.sourceStudyRole ?? null,
    })),
  })),
} : null;

export const parseProductBridgeRequest = (value: unknown): ProductBridgeRequest | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<ProductBridgeRequest>;
  if (record.apiVersion !== PRODUCT_BRIDGE_API_VERSION
    || typeof record.evaluatePersistentDelta !== "boolean"
    || (record.requestKind !== undefined && !["USER_TURN", "POST_ADOPTION_QRY_CONTINUATION"].includes(record.requestKind))
    || !record.conversation
    || typeof record.conversation.conversationId !== "string"
    || !["fr", "en"].includes(record.conversation.language)
    || !Array.isArray(record.conversation.turns)
    || !record.conversation.turns.length
    || !record.conversation.turns.every((turn) => turn && typeof turn.turnId === "string"
      && ["USER", "NOXIA"].includes(turn.role)
      && typeof turn.content === "string" && turn.content.trim().length > 0 && turn.content.length <= 4_000)) return null;
  if (record.currentProject !== null && record.currentProject?.contract !== "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION") return null;
  return record as ProductBridgeRequest;
};
