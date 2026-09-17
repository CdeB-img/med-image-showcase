import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import { CANONICAL_PROJECT_OBJECT_TYPES } from "../research-project-construction/canonical-project-backbone.js";
import type { ScientificInterpretationContributionEnvelope } from "../scientific-interpretation/contracts.js";
import { calculateFDimensioning, type FDimensioningInput } from "../data-analysis-planning/dimensioning-calculator.js";
import { acceptStudyStrategyCandidates, buildContextualStudyDesignCompetence } from "../study-design/design-reasoning.js";
import { acceptImagingStudyStrategyCandidates } from "../imaging-study-designer/contextual-proposals.js";
import { qualifyCandidateCollection } from "../observability-measurement/candidate-collection.js";
import type { ContextualReasoningRequest } from "./contextual-reasoning.js";

// A bounded contribution of the existing Scientific Thinking capability. This
// composition is neither a new owner nor a Project/PD-003 object.
const text = z.string().trim().min(1).max(1600);
const ref = z.string().trim().min(1).max(250);
const refs = z.array(ref).max(60);
export const studyProposalAtomSchema = z.object({
  ref, semanticKey: ref, content: z.string().trim().min(1).max(600), rationale: text,
  targetType: z.enum(CANONICAL_PROJECT_OBJECT_TYPES),
  owner: z.enum(["SCIENTIFIC_THINKING", "STUDY_DESIGN", "IMAGING", "OBS", "BIOSTATISTICS", "DATA_MANAGEMENT"]),
  area: z.enum(["QUESTION", "OBJECTIVES", "DESIGN", "POPULATION", "ELIGIBILITY", "RECRUITMENT", "EXPOSURE", "MEASUREMENTS", "TIMING", "DESCRIPTION", "CONFOUNDERS", "ENDPOINTS", "ANALYSIS", "DIMENSIONING", "BIASES", "PRACTICAL"]),
  status: z.enum(["NOXIA_PROPOSAL", "STRONG_CONTEXTUAL_INFERENCE", "PROVISIONAL_ASSUMPTION", "EVIDENCE_SUPPORTED_PROPOSAL", "OPEN_DECISION"]),
  evidenceRefs: refs, dependsOn: refs,
  variableRoles: z.array(z.enum(["EXCLUSION_VARIABLE", "DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE", "STRATIFICATION_VARIABLE", "OUTCOME_VARIABLE", "EXPOSURE_VARIABLE"])).max(6),
  unit: z.string().max(100).nullable(),
  strataCount: z.number().int().min(2).max(100).nullable(),
  // CDM collection source/method are independent of scientific role and lineage.
  plannedSource: z.string().max(300).nullable().optional(),
  plannedMethod: z.string().max(300).nullable().optional(),
  participantReported: z.boolean().optional(),
  analysisMethod: z.enum(["ONE_WAY_ANOVA", "LINEAR_REGRESSION"]).nullable().optional(),
  userChangeRefs: refs.optional(),
}).strict();
export const studyArbitrationSchema = z.object({
  ref, label: z.string().trim().min(1).max(180), rationale: text,
  selection: z.enum(["ONE", "INDEPENDENT"]),
  material: z.boolean(), reversible: z.boolean(),
  affectedBranches: z.array(z.enum(["DESIGN", "RECRUITMENT", "COLLECTION", "ANALYSIS", "DIMENSIONING", "DOCUMENTS"])).min(1).max(6),
  options: z.array(z.object({ ref, label: z.string().trim().min(1).max(220), benefits: text, limits: text, consequences: text, atomRefs: refs.min(1) }).strict()).min(1).max(5),
  recommendedRefs: refs.max(5),
}).strict();
const assumption = z.object({ parameter: ref, value: z.number().finite(), provenance: z.enum(["PROVISIONAL_ASSUMPTION", "USER_ASSUMPTION", "EVIDENCE_SUPPORTED_PROPOSAL"]), sourceRef: ref }).strict();
export const fDimensioningInputSchema = z.object({
  method: z.enum(["ONE_WAY_ANOVA", "LINEAR_REGRESSION"]), alpha: z.number(), power: z.number(), effectSize: z.number(),
  groups: z.number().int(), testedPredictors: z.number().int(), totalPredictors: z.number().int(),
  allocation: z.enum(["BALANCED_GROUPS", "UNSTRATIFIED", "BALANCED_QUOTAS"]), quotaStrata: z.number().int(),
  anticipatedNonEvaluableRate: z.number(), visits: z.enum(["SINGLE", "REPEATED"]),
  nonEvaluableReasons: z.array(text).max(10), assumptions: z.array(assumption).min(4).max(15),
}).strict();
export const contextualStudyProposalSchema = z.object({
  contract: z.literal("SCIENTIFIC_THINKING_STUDY_PROPOSAL_1"), contextDigest: ref,
  reply: text, understanding: z.array(z.string().trim().min(1).max(300)).min(1).max(6),
  atoms: z.array(studyProposalAtomSchema).min(8).max(60),
  arbitrations: z.array(studyArbitrationSchema).min(1).max(8),
  recruitmentNotice: text, participantQuestionnaireIntroduction: text,
  participantArtifactsApplicable: z.boolean(),
  dimensioningScenarios: z.array(z.object({ ref, label: text, branchAtomRefs: refs.min(1), analysisAtomRef: ref.optional(), input: fDimensioningInputSchema }).strict()).max(5),
  candidateIsAdopted: z.literal(false), projectWriteAuthorized: z.literal(false),
}).strict();
export type StudyProposalAtom = z.infer<typeof studyProposalAtomSchema>;
export type StudyArbitration = z.infer<typeof studyArbitrationSchema>;
export type ContextualStudyProposal = z.infer<typeof contextualStudyProposalSchema>;
export type ProposalProjectBinding = null | { projectId: string; versionId: string; projectDigest: string };
export type StudyProposalComposition = Readonly<{
  proposalRef: string; digest: string; sourceTurnRef: string; sourceResponseRef: string;
  sourceProject: ProposalProjectBinding; originalSourceProject: ProposalProjectBinding;
  revision: number; proposal: ContextualStudyProposal; adoptedAtomRefs: readonly string[];
  unavailableOptionRefs: readonly string[]; state: "CURRENT" | "STALE" | "REVIEW_REQUIRED";
  adoptionSourceRefs?: Readonly<Record<string, readonly string[]>>;
  recomputation?: { contributionRef: string; changedAtomRefs: readonly string[]; affectedAtomRefs: readonly string[]; evaluatedOwners: readonly StudyProposalAtom["owner"][]; previousProposalRef: string };
  dimensioning: readonly { ref: string; label: string; status: "CALCULATED" | "BLOCKED"; role?: "PRIMARY" | "ALTERNATIVE"; calculation: ReturnType<typeof calculateFDimensioning> | null; reason: string | null }[];
  ownerReceipts: readonly { owner: StudyProposalAtom["owner"]; atomRefs: readonly string[]; status: "CANDIDATES_NOT_ADOPTED"; projectWrites: 0 }[];
  qrySelection?: import("../query-navigation/contracts.js").NavigationSelection;
  dispositions?: readonly { decisionRef: string; status: "REJECTED" | "DEFERRED"; atomRefs: readonly string[]; optionRefs: readonly string[] }[];
}>;

export const hasSufficientStudyIntent = (contribution: ScientificInterpretationContributionEnvelope | null) => {
  const atoms = contribution?.scientificContent.candidateObjects ?? [];
  const types = new Set(atoms.map(a => a.proposedType));
  return atoms.length >= 3 && types.has("POPULATION")
    && [...types].some(t => t && /VARIABLE|ENDPOINT|ACQUISITION|EXPOSURE|INTERVENTION/u.test(t))
    && [...types].some(t => t && /QUESTION|OBJECTIVE|STUDY_DESIGN|PROJECT_INFORMATION/u.test(t));
};

export const STUDY_PROPOSAL_MANDATE = `L'intention permet une stratégie de travail substantielle : PROPOSE_FIRST, puis arbitrages utiles. Le paquet est une composition de propositions réversibles, jamais un objet Project.
Produis une réponse conversationnelle courte et une contribution interne structurée SCIENTIFIC_THINKING_STUDY_PROPOSAL_1, liée au contextDigest fourni. Aucun second interlocuteur ni appel scientifique supplémentaire. Le texte visible est uniquement reply.
Ne te limite pas à question/population/design : couvre objectifs, éligibilité, recrutement, exposition si pertinente, mesures, temporalité, description, facteurs de confusion, critère, analyse, dimensionnement, biais et faisabilité. Une étude descriptive ne nécessite pas d'hypothèse artificielle. Les inconnues structurantes restent OPEN_DECISION ; les autres peuvent recevoir une hypothèse de travail explicitement PROVISIONAL_ASSUMPTION, aisément corrigible. Aucun fait USER ou élément adopté ne doit être contredit.
Pour une décision qui change plusieurs branches, propose 2–3 options avec bénéfices, limites et conséquences avant une demande nue. Sépare les décisions indépendantes : une stratification ne décide ni bornes, ni allocation, ni effectif, ni analyse, ni exclusions, ni timing. Définis les variables candidates et leurs rôles, sans promotion canonique. Le dimensionnement est un scénario hypothétique soumis au calculateur, jamais un nombre calculé par toi. Pour une association continue : LINEAR_REGRESSION, effectSize=f² incrémental ; pour groupes indépendants : ONE_WAY_ANOVA, effectSize=f de Cohen et BALANCED_GROUPS. Quotas pour régression : BALANCED_QUOTAS, sans prétendre dimensionner chaque contraste. Explicite alpha, puissance, effet, modèle, allocation, non-évaluabilité et provenance. USER_ASSUMPTION exige une hypothèse USER_DECLARED_ASSUMPTION déjà répertoriée dans statisticalAssessment.assumptions : recopie sa valeur et sourceRef=sourceTurnRef:parameter (twoSidedAlpha correspond à alpha). Sinon utilise PROVISIONAL_ASSUMPTION ; ne prête aucun paramètre au chercheur. Ne transpose jamais deux groupes à plusieurs classes. Une visite unique utilise les raisons de non-évaluabilité, pas les perdus de vue. Sans inputs défendables, laisse le scénario absent et propose leur acquisition.
Pour chaque variable, distingue plannedSource et plannedMethod (axes CDM existants) ; participantReported=true uniquement pour une donnée explicitement auto-déclarée par la personne recrutée. Consentement administratif, contrôles qualité, acquisition, résultats de laboratoire/imagerie, variables dérivées et déviations relèvent du site/CRF : jamais du questionnaire. Taille/poids nécessitent un choix explicite d'auto-déclaration. Le screening est une vérification d'éligibilité par l'équipe, distinct des trois autres aperçus.
Relie chaque scénario à un analysisAtomRef de type ANALYSIS_SPECIFICATION dont analysisMethod correspond au calcul. Ses branchAtomRefs désignent l'option stratégique concernée ; régression principale → régression, comparaison de classes → ANOVA. Fournis si possible les deux alternatives, chacune hypothétique. Pas de N principal issu d'un autre modèle. Les entrées numériques ne deviennent jamais adoptées par le choix stratégique.
Si studyProposalRecomputation est présent, reconstruis uniquement affectedAtomRefs et leurs dépendances. Préserve exactement les autres atomes, leurs références et arbitrages. Chaque modification directe porte userChangeRefs=[itemId N1 fourni], avec contenu/type identiques à la correction N1 ; les conséquences restent des propositions indépendantes. Un modèle non dimensionnable reste explicitement bloqué, sans réutiliser l'ancien N. Aucun nouveau rôle ni adoption implicite.
L'annonce de recrutement est un appel à volontaires, pas une notice réglementaire ni un consentement. Le questionnaire est destiné à la personne recrutée, distinct du CRF. Si l'unité étudiée n'est pas humaine, participantArtifactsApplicable=false : ne crée pas de participant fictif ni de questionnaire humain. Les aperçus sont des documents de travail non validés. N'attribue aucun choix ou nombre à la littérature sans référence Knowledge fournie et applicable.
Forme JSON exacte : {contract,contextDigest,reply,understanding:[textes courts],atoms:[{ref,semanticKey,targetType,owner,area,content,rationale,status,evidenceRefs:[],dependsOn:[],variableRoles:[],unit:null,strataCount:null,plannedSource:null,plannedMethod:null,participantReported:false,analysisMethod:null,userChangeRefs:[]}],arbitrations:[{ref,label,rationale,selection:ONE|INDEPENDENT,material:true,reversible:true,affectedBranches:[],options:[{ref,label,benefits,limits,consequences,atomRefs:[]}],recommendedRefs:[]}],recruitmentNotice,participantQuestionnaireIntroduction,participantArtifactsApplicable,dimensioningScenarios:[{ref,label,branchAtomRefs:[],analysisAtomRef,input:{method,alpha,power,effectSize,groups,testedPredictors,totalPredictors,allocation,quotaStrata,anticipatedNonEvaluableRate,visits:SINGLE|REPEATED,nonEvaluableReasons:[],assumptions:[{parameter,value,provenance,sourceRef}]}}],candidateIsAdopted:false,projectWriteAuthorized:false}.
Owners : QUESTION/OBJECTIVES=SCIENTIFIC_THINKING, DESIGN/POPULATION/ELIGIBILITY/RECRUITMENT/EXPOSURE/TIMING/BIASES/PRACTICAL=STUDY_DESIGN, ANALYSIS/DIMENSIONING/CONFOUNDERS=BIOSTATISTICS, MEASUREMENTS/ENDPOINTS=OBS ou IMAGING selon domaine, DESCRIPTION=DATA_MANAGEMENT. Types Project natifs seulement. Statuts : NOXIA_PROPOSAL, STRONG_CONTEXTUAL_INFERENCE, PROVISIONAL_ASSUMPTION, EVIDENCE_SUPPORTED_PROPOSAL, OPEN_DECISION. Zones mentionnées avec leurs listes dans le contexte. Réponse visible concise ; les détails restent dans les candidats.`;

export const calculateStudyProposalScenarios = (proposal: ContextualStudyProposal) => {
  const recommended = new Set(proposal.arbitrations.flatMap(a => a.options.filter(o => a.recommendedRefs.includes(o.ref)).flatMap(o => o.atomRefs)));
  const primary = proposal.dimensioningScenarios.find(s => s.branchAtomRefs.every(r => recommended.has(r)))?.ref;
  return proposal.dimensioningScenarios.map(scenario => {
  const role = scenario.ref === primary ? "PRIMARY" as const : "ALTERNATIVE" as const;
  try {
    const analysis = proposal.atoms.find(a => a.ref === scenario.analysisAtomRef);
    if (!analysis || analysis.area !== "ANALYSIS" || analysis.targetType !== "ANALYSIS_SPECIFICATION"
      || analysis.analysisMethod !== scenario.input.method) throw new Error("PRIMARY_ANALYSIS_DIMENSIONING_BINDING_REQUIRED");
    const stratum = proposal.atoms.filter(a => scenario.branchAtomRefs.includes(a.ref) && a.strataCount !== null);
    if (stratum.some(a => scenario.input.method === "ONE_WAY_ANOVA" && a.strataCount !== scenario.input.groups
      || scenario.input.allocation === "BALANCED_QUOTAS" && a.strataCount !== scenario.input.quotaStrata)) throw new Error("DIMENSIONING_STRATA_MISMATCH");
    return { ref: scenario.ref, role, label: scenario.label, status: "CALCULATED" as const, calculation: calculateFDimensioning(scenario.input as FDimensioningInput), reason: null }; }
  catch (error) { return { ref: scenario.ref, role, label: scenario.label, status: "BLOCKED" as const, calculation: null, reason: error instanceof Error ? error.message : "DIMENSIONING_FAILED" }; }
});
};

export const acceptContextualStudyProposal = (raw: unknown, input: {
  contextDigest: string; sourceTurnRef: string; sourceResponseRef: string; sourceProject: ProposalProjectBinding;
  applicableEvidenceRefs: readonly string[];
  userAssumptions?: readonly { parameter: string; value: number; sourceRef: string }[];
  scopedAtomRefs?: readonly string[]; previousOwnerReceipts?: StudyProposalComposition["ownerReceipts"];
  sourceText?: string; ownerContext?: ContextualReasoningRequest | null;
}): StudyProposalComposition => {
  const proposal = contextualStudyProposalSchema.parse(raw);
  if (proposal.contextDigest !== input.contextDigest) throw new Error("STUDY_PROPOSAL_CONTEXT_MISMATCH");
  const ids = [...proposal.atoms.map(a => a.ref), ...proposal.arbitrations.flatMap(a => [a.ref, ...a.options.map(o => o.ref)])];
  if (new Set(ids).size !== ids.length) throw new Error("STUDY_PROPOSAL_DUPLICATE_REF");
  const atoms = new Map(proposal.atoms.map(a => [a.ref, a]));
  for (const atom of proposal.atoms) {
    const allowed = atom.owner === "SCIENTIFIC_THINKING" ? ["QUESTION", "OBJECTIVES"]
      : atom.owner === "STUDY_DESIGN" ? ["DESIGN", "POPULATION", "ELIGIBILITY", "RECRUITMENT", "EXPOSURE", "TIMING", "BIASES", "PRACTICAL"]
      : atom.owner === "BIOSTATISTICS" ? ["ANALYSIS", "DIMENSIONING", "CONFOUNDERS"]
      : atom.owner === "DATA_MANAGEMENT" ? ["DESCRIPTION"] : ["MEASUREMENTS", "ENDPOINTS"];
    if (!allowed.includes(atom.area)) throw new Error("STUDY_PROPOSAL_OWNER_SCOPE_INVALID");
    if (atom.dependsOn.some(r => !atoms.has(r) || r === atom.ref)) throw new Error("STUDY_PROPOSAL_DEPENDENCY_INVALID");
    if (atom.evidenceRefs.some(r => !input.applicableEvidenceRefs.includes(r))
      || atom.status === "EVIDENCE_SUPPORTED_PROPOSAL" && !atom.evidenceRefs.length) throw new Error("STUDY_PROPOSAL_EVIDENCE_INVALID");
  }
  // Cycles cannot acquire a false impression of being derivable.
  const visited = new Set<string>(), active = new Set<string>();
  const visit = (id: string) => { if (active.has(id)) throw new Error("STUDY_PROPOSAL_DEPENDENCY_CYCLE");
    if (visited.has(id)) return; active.add(id); atoms.get(id)!.dependsOn.forEach(visit); active.delete(id); visited.add(id); };
  proposal.atoms.forEach(a => visit(a.ref));
  for (const arbitration of proposal.arbitrations) {
    if (arbitration.options.some(o => o.atomRefs.some(r => !atoms.has(r)))
      || arbitration.recommendedRefs.some(r => !arbitration.options.some(o => o.ref === r))
      || arbitration.selection === "ONE" && arbitration.recommendedRefs.length > 1) throw new Error("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
  }
  for (const scenario of proposal.dimensioningScenarios) {
    if (scenario.branchAtomRefs.some(r => !atoms.has(r)) || scenario.input.assumptions.some(a =>
      a.provenance === "EVIDENCE_SUPPORTED_PROPOSAL" && !input.applicableEvidenceRefs.includes(a.sourceRef))) throw new Error("STUDY_PROPOSAL_DIMENSIONING_SOURCE_INVALID");
    if (scenario.input.assumptions.some(a => a.provenance === "USER_ASSUMPTION" && !input.userAssumptions?.some(source =>
      source.parameter === a.parameter && source.value === a.value && source.sourceRef === a.sourceRef))) throw new Error("STUDY_PROPOSAL_USER_ASSUMPTION_UNVERIFIED");
  }
  const digest = logicalDigest({ proposal, sourceProject: input.sourceProject, sourceTurnRef: input.sourceTurnRef, sourceResponseRef: input.sourceResponseRef });
  const evaluatedAtoms = input.scopedAtomRefs ? proposal.atoms.filter(a => input.scopedAtomRefs!.includes(a.ref)) : proposal.atoms;
  const designAtoms = evaluatedAtoms.filter(a => a.owner === "STUDY_DESIGN");
  const designReceipt = designAtoms.length ? acceptStudyStrategyCandidates(input.ownerContext?.studyDesign
    ?? buildContextualStudyDesignCompetence(input.sourceText ?? ""), designAtoms) : null;
  const imagingAtoms = evaluatedAtoms.filter(a => a.owner === "IMAGING");
  const imagingReceipt = imagingAtoms.length ? acceptImagingStudyStrategyCandidates({ context: input.ownerContext?.imaging ?? null, atoms: imagingAtoms }) : null;
  qualifyCandidateCollection(evaluatedAtoms.filter(a => ["OBS", "IMAGING", "DATA_MANAGEMENT", "BIOSTATISTICS"].includes(a.owner)));
  return { proposalRef: `scientific-study-proposal:${digest}`, digest, sourceTurnRef: input.sourceTurnRef,
    sourceResponseRef: input.sourceResponseRef, sourceProject: input.sourceProject, originalSourceProject: input.sourceProject,
    revision: 1, proposal, adoptedAtomRefs: [], unavailableOptionRefs: [], state: "CURRENT",
    dimensioning: calculateStudyProposalScenarios(proposal),
    ownerReceipts: [...(input.previousOwnerReceipts ?? []).filter(r => !evaluatedAtoms.some(a => a.owner === r.owner)), ...(designReceipt ? [designReceipt] : []), ...(imagingReceipt ? [imagingReceipt] : []), ...[...new Set(evaluatedAtoms.map(a => a.owner))].filter(o => !["STUDY_DESIGN", "IMAGING"].includes(o)).map(owner => ({ owner,
      atomRefs: evaluatedAtoms.filter(a => a.owner === owner).map(a => a.ref), status: "CANDIDATES_NOT_ADOPTED" as const, projectWrites: 0 as const }))] };
};
