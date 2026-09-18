import { prepareStandardContextualReasoningRequest } from "../../scientific-thinking/contextual-reasoning-input.js";
import { z } from "zod";
import { isExplicitProjectRecordingRequest } from "./natural-conversation-policy.js";
import { logicalDigest } from "../../knowledge-engine/canonical.js";
import { CANONICAL_PROJECT_OBJECT_TYPES } from "../../research-project-construction/canonical-project-backbone.js";
import { prepareResearchProjectContributionCandidate } from "../../research-project-construction/contribution-owner-boundary.js";
import { acceptContextualStudyProposal, hardStudyProposalDependencies, studyProposalOptionDecisionRefs, studyDependencyQualificationSchema, studyProposalOwnerAreas, studyProposalAtomSchema, studyArbitrationSchema, contextualStudyProposalSchema, STUDY_PROPOSAL_MANDATE, type StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal.js";
import { prepareTerraConversation } from "../../scientific-thinking/scientific-collaborator-conversation.js";
import { buildCurrentTurnNavigation, selectStudyProposalArbitrations } from "../../query-navigation/current-turn-navigation.js";
import type { ProductBridgeRequest } from "../product-bridge.js";
import type { ScientificInterpretationTurn } from "../../scientific-interpretation/contracts.js";
import { assertStudyProposalCurrent, buildStudyProposalSelectionContribution, studyProposalBinding } from "./study-proposal-standard.js";
import type { ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary.js";
type WorkingDraftSession = { project: ResearchProjectOwnerProjection | null; projectId: string; conversationId: string;
  runtimeTurns: ScientificInterpretationTurn[]; updatedAt: string; studyProposal?: StudyProposalComposition | null; workingDraft?: WorkingDraftMetadata | null };

// Consumer preparation of the existing ST composition and PRJ contribution.
// No canonical aggregate, provider transport, adoption or documentary generation.
const responseSchema = z.object({
  requestType: z.enum(["STUDY_UPDATE", "TARGETED_QUESTION", "INSUFFICIENT"]),
  proposal: contextualStudyProposalSchema.nullable(),
  explicitDecisions: z.array(z.object({ atomRef: z.string(), sourceTurnRef: z.string(), quote: z.string().min(1) }).strict()).max(60),
  inferredAtomRefs: z.array(z.string()).max(60),
  rejectedAtomRefs: z.array(z.string()).max(60),
}).strict();
export type WorkingDraftUpdate = z.infer<typeof responseSchema>;
export type WorkingDraftMetadata = {
  compositionDigest: string;
  reviewScopeDigest?: string;
  inputDigest: string;
  sourceUserTurnRef: string;
  origins: Record<string, "EXPLICIT_USER" | "INFERRED" | "PROPOSED" | "OPEN">;
  explicitDecisions: WorkingDraftUpdate["explicitDecisions"];
  history: readonly { atom: StudyProposalComposition["proposal"]["atoms"][number]; status: "REJECTED" | "SUPERSEDED" }[];
  readyReview: { contribution: ReturnType<typeof buildStudyProposalSelectionContribution>; candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> } | null;
  readiness: Record<"PROTOCOL" | "SYNOPSIS" | "CRF" | "RECRUITMENT", { status: "WORKING_DRAFT" | "OPEN"; blockers: readonly string[] }>;
  metrics: { userExplicitElements: number; noxiaPrebuiltElements: number; openHighValueDecisions: number; substantiveTurns: number; turnsToReadyReview: number | null };
  failure: string | null;
};

export const isWorkingDraftReviewOnlyRequest = (text: string) => isExplicitProjectRecordingRequest(text)
  && !/\b(?:ajout\w*|chang\w*|remplac\w*|corrig\w*|modifi\w*|sauf|uniquement|seulement|inclu\w*|exclu\w*|mais|prefer\w*|plut[oô]t|finalement|sans|avec)\b|\d/iu.test(text);

export const validatePreparedWorkingReview = (session: WorkingDraftSession) => {
  const composition = session.studyProposal, draft = session.workingDraft, prepared = draft?.readyReview;
  if (!composition || !draft || !prepared || draft.failure || composition.digest !== draft.compositionDigest) return null;
  if (draft.reviewScopeDigest !== logicalDigest({ composition: composition.digest, scope: recommendedWorkingScope(composition) })) return null;
  try {
    assertStudyProposalCurrent(composition, session.project);
    const lastUser = [...session.runtimeTurns].reverse().find(t => t.role === "USER");
    if (lastUser?.turnId !== draft.sourceUserTurnRef && !isWorkingDraftReviewOnlyRequest(lastUser?.content ?? "")) return null;
    const reply = session.runtimeTurns.find(t => t.turnId === composition.sourceResponseRef)!;
    const source = session.runtimeTurns.find(t => t.turnId === composition.sourceTurnRef)!;
    const expected = buildStudyProposalSelectionContribution({ composition, ...recommendedWorkingScope(composition),
      project: session.project, projectId: session.projectId, conversationId: session.conversationId,
      proposalTurn: reply, selectionTurn: source, createdAt: reply.createdAt ?? session.updatedAt, preparingReview: true });
    const checked = prepareResearchProjectContributionCandidate(prepared.contribution, session.project);
    if (logicalDigest(expected) !== logicalDigest(prepared.contribution)
      || checked.contributionDigest !== prepared.candidate.contributionDigest
      || checked.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") return null;
    return { contribution: prepared.contribution, candidate: checked };
  } catch { return null; }
};

export const workingDraftInputDigest = (request: ProductBridgeRequest) => logicalDigest({
  turns: request.conversation.turns, project: studyProposalBinding(request.currentProject),
  previous: request.studyProposalContext?.digest ?? null, rejected: request.workingDraftHistory ?? [],
});

export const prepareWorkingDraftRequest = (request: ProductBridgeRequest) => {
  const previous = request.studyProposalContext;
  if (previous) assertStudyProposalCurrent(previous, request.currentProject);
  const inputDigest = workingDraftInputDigest(request);
  const base = JSON.parse(prepareTerraConversation(request).context);
  const context = JSON.stringify({ ...base, contextDigest: inputDigest,
    previousStudyProposal: previous?.proposal ?? null,
    rejectedChoices: previous?.dispositions?.filter(d => d.status === "REJECTED") ?? [],
    rejectedWorkingElements: request.workingDraftHistory ?? [],
    nativeObjectTypes: CANONICAL_PROJECT_OBJECT_TYPES,
    nativeContractValues: { ownerAreas: Object.fromEntries(studyProposalAtomSchema.shape.owner.options.map(owner => [owner, studyProposalOwnerAreas(owner)])), area: studyProposalAtomSchema.shape.area.options, owner: studyProposalAtomSchema.shape.owner.options,
      status: studyProposalAtomSchema.shape.status.options, variableRoles: studyProposalAtomSchema.shape.variableRoles.element.options,
      affectedBranches: studyArbitrationSchema.shape.affectedBranches.element.options, dependencyKinds: studyDependencyQualificationSchema.shape.kind.options },
  });
  const instruction = `Tu prépares en arrière-plan la composition de travail existante après la réponse visible de NOXIA. Tu n'es pas un second interlocuteur et tu ne peux rien adopter ni écrire dans Project.
Évalue sémantiquement la matière scientifique, la structure déjà inférable, les décisions explicites, les arbitrages ouverts et le type de demande. Une question ciblée sans changement scientifique => TARGETED_QUESTION ; une intention pauvre => INSUFFICIENT ; dans ces cas proposal=null et listes vides, sans inventer une étude. Sinon STUDY_UPDATE : intègre les derniers choix et corrections, conserve les branches non affectées et leurs références, propage les dépendances, retire les propositions refusées ou remplacées. Ne réactive aucun refus. Retenir une architecture visible proposée dans le transcript est une mise à jour scientifique même sans nouvelle valeur. Sépare les choix ou inférences établis des détails opérationnels ouverts ; une dépendance ne doit bloquer un élément que si son interprétation scientifique dépend réellement du choix manquant. Ne supprime pas des temporalités ou critères explicites à cause d’une procédure opérationnelle indépendante restant à définir. Ne force aucune hypothèse dans un design descriptif.
Maintiens une architecture substantielle et faisable avec les catégories existantes applicables, y compris comparateur/exposition, masquage/allocation si pertinents, sécurité, soins concomitants, temporalités/référentiels, critères candidats, analyse, recueil, dimensionnement et faisabilité. Les décisions manquantes restent OPEN_DECISION ; ne fabrique aucun fait, dose, seuil, institution, calcul ou référence. Propose des familles quand une spécification demande une vérification. Préserve la réponse visible : proposal.reply n'est jamais affiché à sa place.
${STUDY_PROPOSAL_MANDATE}
Pour cette composition de travail, ajoute à CHAQUE atome dependencyQualifications:[{ref,kind,rationale}], exactement une qualification pour CHAQUE lien dependsOn (liste vide sans dépendance). HARD_BLOCKING_DEPENDENCY : sans le prérequis la décision n'a pas de sens autonome, devient contradictoire, change d'unité scientifique ou viole une exigence du propriétaire. SOFT_REFINEMENT_DEPENDENCY : précision nécessaire à l'exécution/finalisation, mais le parent a déjà un sens scientifique autonome. OPTIONAL_DETAIL : enrichissement facultatif. Ne transforme jamais tous les OPEN en soft. Ne supprime aucun lien pour rendre la revue adoptable. Sépare un choix conceptuel stable et sa spécification opérationnelle ouverte en deux atomes avec des contenus autonomes ; ne qualifie pas tout le parent OPEN uniquement parce qu'une précision reste inconnue. Un comparateur contradictoire, une unité changeant le sens ou une option exclusive indécise reste bloquant. Si previousStudyProposal existe, conserve les atomes et références non affectés ; actualise uniquement les décisions modifiées et leurs conséquences, sans recommencer l'étude.
Respecte exclusivement nativeContractValues : area est une catégorie native, variableRoles ne contient que les rôles natifs et affectedBranches désigne les familles de branches natives, jamais des références d'atomes. N'invente aucun enum. Respecte ownerAreas pour chaque couple owner/area : l'attribution d'une temporalité appartient au propriétaire natif de TIMING, indépendamment de la modalité scientifique. content≤600 caractères, rationale≤1600, chaque understanding≤300. recruitmentNotice et participantQuestionnaireIntroduction sont des chaînes non vides, jamais null : une indication des éléments restant à préciser suffit, sans rédiger de document ni questionnaire. analysisMethod=null hors méthode calculatoire native applicable.
Réponds UNIQUEMENT avec l'enveloppe JSON {requestType,proposal,explicitDecisions:[{atomRef,sourceTurnRef,quote}],inferredAtomRefs:[],rejectedAtomRefs:[]}. Chaque explicitDecision cite littéralement un passage d'un tour USER réel qui exprime ce choix ; une inférence ou recommandation n'est jamais une décision explicite. Les inferredAtomRefs désignent seulement les inférences fortes. Les rejetés désignent des atomes de previousStudyProposal retirés par un refus USER explicite. Ne confonds pas une explication ciblée avec une correction. Statuts natifs inchangés ; tous les éléments restent non adoptés. Pas de scénario de dimensionnement numérique sans inputs défendables. Fournis 12–24 atomes utiles lorsque la matière le permet, dépendances acycliques ; pas de longs aperçus documentaires. contextDigest doit être recopié exactement.
GRAPHE DE PRÉREQUIS : dependsOn va de l'atome dépendant vers son prérequis ; il ne représente pas toute relation scientifique. Pour chaque lien, identifie ce que le prérequis rend possible : HARD_BLOCKING_DEPENDENCY si son absence empêche l'interprétation ou l'adoption scientifique du dépendant ; SOFT_REFINEMENT_DEPENDENCY ou OPTIONAL_DETAIL uniquement pour un raffinement ou détail orienté, sans blocage du choix autonome. Une contextualisation, une précision d'indication, un contexte de sélection ou une conséquence ne crée pas à elle seule un prérequis inverse : conserve cette information dans content/rationale, sans fabriquer un dependsOn réciproque. Réévalue les liens hérités lorsque les choix évoluent ; conserver les branches non affectées ne signifie pas recopier un lien devenu purement contextuel. Si un prérequis dépend déjà directement ou indirectement du dépendant, n'ajoute pas le lien inverse. Examine le sens des deux relations, sans supprimer arbitrairement une arête ni affaiblir un vrai prérequis HARD. Si un atome mélange un prérequis et sa conséquence, sépare ces concepts avec les atomes/types natifs nécessaires, en conservant leur matière scientifique et leurs qualifications. Avant émission, vérifie l'absence de tout cycle, y compris SOFT/OPTIONAL et mixte ; un changement de qualification ne résout pas un cycle.
RÉDACTION BACKGROUND COMPACTE : conserve intégralement les décisions, distinctions scientifiques, liens, qualifications et arbitrages utiles. La concision porte sur leur explication, jamais sur leur suppression. Une justification ne répète pas le contenu : rationale d'atome ≤180 caractères, rationale de dépendance ≤100, rationale d'arbitrage ≤180 ; benefits/limits/consequences ≤140 chacun, understanding ≤150 chacun. proposal.reply ≤120 caractères car non affiché ; recruitmentNotice et participantQuestionnaireIntroduction ≤120 chacun, sans aperçu documentaire. N'ajoute pas de scénario chiffré pour remplir une rubrique. Les branches non affectées conservent leur contenu et leurs références ; ne les reformule pas pour le style. Ne tronque aucun texte ni lien pour respecter ces cibles ; garde une explication plus longue si elle est indispensable à son sens. Émets du JSON sans indentation ni commentaires.`;
  return { context, instruction, inputDigest };
};

export const recommendedWorkingScope = (composition: StudyProposalComposition) => {
  const excluded = new Set([...composition.adoptedAtomRefs, ...composition.dispositions?.flatMap(d => d.atomRefs) ?? []]);
  const options = composition.proposal.arbitrations.flatMap(a => a.options);
  const optionAtoms = new Set(options.flatMap(o => o.atomRefs));
  let selectedOptions = composition.proposal.arbitrations.flatMap(a => a.recommendedRefs)
    .filter(r => !composition.unavailableOptionRefs.includes(r));
  let selected = new Set<string>();
  // Repeat option closure too: a removed option cannot satisfy another parent.
  while (true) {
    selected = new Set([...composition.proposal.atoms.filter(a => !optionAtoms.has(a.ref)).map(a => a.ref),
      ...options.filter(o => selectedOptions.includes(o.ref)).flatMap(o => studyProposalOptionDecisionRefs(composition.proposal, o))].filter(r => !excluded.has(r)));
    let changed = true;
    while (changed) { changed = false; for (const a of composition.proposal.atoms) if (selected.has(a.ref)
      && (a.status === "OPEN_DECISION" || hardStudyProposalDependencies(a).some(r => !selected.has(r) && !composition.adoptedAtomRefs.includes(r)))) {
      selected.delete(a.ref); changed = true;
    } }
    const safeOptions = selectedOptions.filter(r => options.some(o => o.ref === r && studyProposalOptionDecisionRefs(composition.proposal, o).every(ref => selected.has(ref))));
    if (safeOptions.length === selectedOptions.length) break;
    selectedOptions = safeOptions;
  }
  return { selectedOptionRefs: selectedOptions, selectedAtomRefs: [...selected].filter(r => !optionAtoms.has(r)) };
};

export const workingDraftReviewCoverage = (composition: StudyProposalComposition) => {
  const scope = recommendedWorkingScope(composition);
  const selected = new Set([...scope.selectedAtomRefs, ...composition.proposal.arbitrations.flatMap(a =>
    a.options.filter(o => scope.selectedOptionRefs.includes(o.ref)).flatMap(o => studyProposalOptionDecisionRefs(composition.proposal, o)))]);
  return { total: composition.proposal.atoms.length, stable: [...selected],
    open: composition.proposal.atoms.filter(a => a.status === "OPEN_DECISION").map(a => a.ref),
    excluded: composition.proposal.atoms.filter(a => !selected.has(a.ref)).map(a => ({ ref: a.ref, content: a.content,
      reason: a.status === "OPEN_DECISION" ? "OPEN_DECISION_NOT_ADOPTED" : composition.adoptedAtomRefs.includes(a.ref) ? "ALREADY_ADOPTED"
        : composition.dispositions?.some(d => d.atomRefs.includes(a.ref)) ? "REJECTED_OR_DEFERRED"
        : hardStudyProposalDependencies(a).some(r => !selected.has(r) && !composition.adoptedAtomRefs.includes(r)) ? "HARD_DEPENDENCY_NOT_SATISFIED" : "UNSELECTED_OPTION" })),
  };
};

/** Compare only ASCII layout separators; recover one exact span of the immutable USER source. */
export const resolveWorkingDraftSourceQuote = (source: string, quote: string): { quote: string; start: number; end: number } | null => {
  const canonical = (text: string) => {
    let value = ""; const starts: number[] = [], ends: number[] = [];
    for (let i = 0; i < text.length;) {
      const start = i;
      if (/[ \t\r\n]/u.test(text[i]!)) {
        while (i < text.length && /[ \t\r\n]/u.test(text[i]!)) i++;
        value += " ";
      } else { value += text[i]!; i++; }
      starts.push(start); ends.push(i);
    }
    return { value, starts, ends };
  };
  const target = canonical(quote).value;
  if (!target || !target.replace(/ /gu, "")) return null;
  const original = canonical(source), start = original.value.indexOf(target);
  if (start < 0 || original.value.indexOf(target, start + 1) >= 0) return null;
  const rawStart = original.starts[start]!, rawEnd = original.ends[start + target.length - 1]!;
  return { quote: source.slice(rawStart, rawEnd), start: rawStart, end: rawEnd };
};

export const acceptWorkingDraftUpdate = (raw: unknown, request: ProductBridgeRequest) => {
  const update = responseSchema.parse(raw);
  if (update.requestType !== "STUDY_UPDATE") {
    if (update.proposal || update.explicitDecisions.length || update.inferredAtomRefs.length || update.rejectedAtomRefs.length) throw new Error("WORKING_DRAFT_OUT_OF_SCOPE");
    return { update, composition: null };
  }
  if (!update.proposal) throw new Error("WORKING_DRAFT_PROPOSAL_REQUIRED");
  const user = [...request.conversation.turns].reverse().find(t => t.role === "USER")!;
  const reply = [...request.conversation.turns].reverse().find(t => t.role === "NOXIA");
  if (!reply) throw new Error("WORKING_DRAFT_VISIBLE_REPLY_REQUIRED");
  const atoms = new Set(update.proposal.atoms.map(a => a.ref));
  if (update.inferredAtomRefs.some(r => !atoms.has(r))) throw new Error("WORKING_DRAFT_USER_PROVENANCE_INVALID");
  update.explicitDecisions = update.explicitDecisions.map(decision => {
    const source = request.conversation.turns.find(t => t.role === "USER" && t.turnId === decision.sourceTurnRef);
    const anchor = source && resolveWorkingDraftSourceQuote(source.content, decision.quote);
    if (!atoms.has(decision.atomRef) || !anchor) throw new Error("WORKING_DRAFT_USER_PROVENANCE_INVALID");
    return { ...decision, quote: anchor.quote };
  });
  const previous = request.studyProposalContext;
  if (update.rejectedAtomRefs.some(r => !previous?.proposal.atoms.some(a => a.ref === r) || atoms.has(r))) throw new Error("WORKING_DRAFT_REJECTED_REFERENCE_INVALID");
  const rejectedHistory = (request.workingDraftHistory ?? []).filter(h => h.status === "REJECTED");
  if (update.proposal.atoms.some(a => rejectedHistory.some(h => h.atom.content === a.content || h.atom.ref === a.ref))) throw new Error("WORKING_DRAFT_REJECTED_REACTIVATED");
  const unavailable = new Set(previous?.dispositions?.filter(d => d.status === "REJECTED").flatMap(d => d.atomRefs) ?? []);
  if (update.proposal.atoms.some(a => unavailable.has(a.ref))) throw new Error("WORKING_DRAFT_REJECTED_REACTIVATED");
  // Native specialized inputs are prepared from a non-adopted contribution.
  // This temporary composition never escapes the owner qualification below.
  const sourceProject = studyProposalBinding(request.currentProject);
  const digest = logicalDigest({ proposal: update.proposal, sourceProject, sourceTurnRef: user.turnId, sourceResponseRef: reply.turnId });
  const provisional: StudyProposalComposition = { proposal: update.proposal, proposalRef: `scientific-study-proposal:${digest}`,
    digest, sourceTurnRef: user.turnId, sourceResponseRef: reply.turnId, sourceProject, originalSourceProject: sourceProject,
    revision: 1, adoptedAtomRefs: [], unavailableOptionRefs: [], state: "CURRENT", dimensioning: [], ownerReceipts: [] };
  const contribution = buildStudyProposalSelectionContribution({ composition: provisional, ...recommendedWorkingScope(provisional),
    project: request.currentProject, projectId: request.currentProject?.projectId ?? `discussion:${request.conversation.conversationId}`,
    conversationId: request.conversation.conversationId, proposalTurn: reply, selectionTurn: user,
    createdAt: reply.createdAt ?? user.createdAt ?? new Date().toISOString(), preparingReview: true });
  const ownerContext = prepareStandardContextualReasoningRequest({ contribution, turns: request.conversation.turns,
    sessionId: request.conversation.conversationId });
  const composition = acceptContextualStudyProposal(update.proposal, { contextDigest: workingDraftInputDigest(request),
    sourceTurnRef: user.turnId, sourceResponseRef: reply.turnId, sourceProject: studyProposalBinding(request.currentProject),
    // Open/unselected branches remain working proposals. Only the native scope
    // receives specialized qualification, with exactly the handoffs built for it.
    scopedAtomRefs: contribution.scientificContent.candidateObjects.map(item => item.evidenceRefs!.find(ref => atoms.has(ref))!),
    ownerContext: ownerContext?.request, applicableEvidenceRefs: [], sourceText: request.conversation.turns.filter(t => t.role === "USER").map(t => t.content).join("\n"),
  });
  return { update, composition };
};

export const prepareContinuousWorkingDraft = (session: WorkingDraftSession, composition: StudyProposalComposition, update: WorkingDraftUpdate, inputDigest: string): WorkingDraftMetadata => {
  assertStudyProposalCurrent(composition, session.project);
  const origins: WorkingDraftMetadata["origins"] = {};
  for (const atom of composition.proposal.atoms) origins[atom.ref] = atom.status === "OPEN_DECISION" ? "OPEN"
    : update.explicitDecisions.some(d => d.atomRef === atom.ref) ? "EXPLICIT_USER"
    : update.inferredAtomRefs.includes(atom.ref) ? "INFERRED" : "PROPOSED";
  const rejected = new Set(update.rejectedAtomRefs);
  const history = [...session.workingDraft?.history ?? [], ...session.studyProposal?.proposal.atoms
    .filter(old => !composition.proposal.atoms.some(next => next.ref === old.ref && logicalDigest(next) === logicalDigest(old)))
    .map(atom => ({ atom, status: rejected.has(atom.ref) ? "REJECTED" as const : "SUPERSEDED" as const })) ?? []];
  const scope = recommendedWorkingScope(composition);
  let readyReview: WorkingDraftMetadata["readyReview"] = null;
  let failure: string | null = null;
  try {
    const user = session.runtimeTurns.find(t => t.turnId === composition.sourceTurnRef)!;
    const reply = session.runtimeTurns.find(t => t.turnId === composition.sourceResponseRef)!;
    const contribution = buildStudyProposalSelectionContribution({ composition, ...scope,
      project: session.project, projectId: session.projectId, conversationId: session.conversationId,
      proposalTurn: reply, selectionTurn: user, createdAt: reply.createdAt ?? session.updatedAt, preparingReview: true });
    const candidate = prepareResearchProjectContributionCandidate(contribution, session.project);
    if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") throw new Error("WORKING_REVIEW_OWNER_NOT_READY");
    readyReview = { contribution, candidate };
  } catch (error) { failure = error instanceof Error ? error.message : "WORKING_REVIEW_FAILED"; }
  const open = composition.proposal.atoms.filter(a => a.status === "OPEN_DECISION");
  const ready = (areas: string[]): WorkingDraftMetadata["readiness"]["PROTOCOL"] => ({
    status: readyReview && areas.every(area => composition.proposal.atoms.some(a => a.area === area && a.status !== "OPEN_DECISION")) ? "WORKING_DRAFT" : "OPEN",
    blockers: open.filter(a => areas.includes(a.area)).map(a => a.content),
  });
  const readiness = { PROTOCOL: ready(["QUESTION", "DESIGN", "ENDPOINTS"]), SYNOPSIS: ready(["QUESTION", "DESIGN"]),
    CRF: ready(["MEASUREMENTS", "DESCRIPTION"]), RECRUITMENT: ready(["POPULATION", "ELIGIBILITY", "RECRUITMENT"]) };
  const previousTurns = session.workingDraft?.metrics.substantiveTurns ?? 0;
  return { compositionDigest: composition.digest, reviewScopeDigest: logicalDigest({ composition: composition.digest, scope }), inputDigest, sourceUserTurnRef: composition.sourceTurnRef, origins,
    explicitDecisions: update.explicitDecisions, history, readyReview, readiness,
    metrics: { userExplicitElements: update.explicitDecisions.length, noxiaPrebuiltElements: Object.values(origins).filter(v => v === "INFERRED" || v === "PROPOSED").length,
      openHighValueDecisions: open.length, substantiveTurns: previousTurns + 1,
      turnsToReadyReview: session.workingDraft?.metrics.turnsToReadyReview ?? (readyReview ? session.runtimeTurns.filter(t => t.role === "USER").length : null) }, failure };
};

/** Refresh an obsolete selection projection, not the scientific draft. No LLM,
 * extraction, canonical write or conversation response is involved. */
export const refreshWorkingDraftReview = (session: WorkingDraftSession) => {
  const composition = session.studyProposal, draft = session.workingDraft;
  if (!composition || !draft || draft.failure || composition.digest !== draft.compositionDigest
    || draft.reviewScopeDigest === logicalDigest({ composition: composition.digest, scope: recommendedWorkingScope(composition) })) return null;
  assertStudyProposalCurrent(composition, session.project);
  const lastUser = [...session.runtimeTurns].reverse().find(t => t.role === "USER");
  if (lastUser?.turnId !== draft.sourceUserTurnRef && !isWorkingDraftReviewOnlyRequest(lastUser?.content ?? "")) return null;
  const user = session.runtimeTurns.find(t => t.turnId === composition.sourceTurnRef)!;
  const reply = session.runtimeTurns.find(t => t.turnId === composition.sourceResponseRef)!;
  const contribution = buildStudyProposalSelectionContribution({ composition: { ...composition, ownerReceipts: [] },
    ...recommendedWorkingScope(composition), project: session.project, projectId: session.projectId, conversationId: session.conversationId,
    proposalTurn: reply, selectionTurn: user, createdAt: reply.createdAt ?? session.updatedAt, preparingReview: true });
  const sourceTurns = session.runtimeTurns.slice(0, session.runtimeTurns.findIndex(t => t.turnId === composition.sourceResponseRef) + 1);
  const ownerContext = prepareStandardContextualReasoningRequest({ contribution, turns: sourceTurns, sessionId: session.conversationId });
  const qualification = acceptContextualStudyProposal(composition.proposal, { contextDigest: composition.proposal.contextDigest,
    sourceTurnRef: composition.sourceTurnRef, sourceResponseRef: composition.sourceResponseRef, sourceProject: composition.sourceProject,
    scopedAtomRefs: contribution.scientificContent.candidateObjects.map(item => item.evidenceRefs!.find(r => composition.proposal.atoms.some(a => a.ref === r))!),
    // Same evidence admission as the native working producer; a candidate
    // cannot authorize its own support references during a cache refresh.
    ownerContext: ownerContext?.request, applicableEvidenceRefs: [],
    sourceText: sourceTurns.filter(t => t.role === "USER").map(t => t.content).join("\n") });
  const qualified = { ...composition, ownerReceipts: qualification.ownerReceipts };
  const updated = prepareContinuousWorkingDraft(session, qualified, { requestType: "STUDY_UPDATE", proposal: qualified.proposal,
    explicitDecisions: draft.explicitDecisions, inferredAtomRefs: Object.keys(draft.origins).filter(r => draft.origins[r] === "INFERRED"),
    rejectedAtomRefs: [] }, draft.inputDigest);
  if (!updated.readyReview || updated.failure) return null;
  return { studyProposal: qualified, workingDraft: { ...updated, history: draft.history, metrics: draft.metrics } };
};

export const compactWorkingDraftAdvice = (request: ProductBridgeRequest) => {
  const composition = request.studyProposalContext;
  if (!composition) return null;
  assertStudyProposalCurrent(composition, request.currentProject);
  const proposalTurn = request.conversation.turns.find(t => t.turnId === composition.sourceResponseRef);
  const source = request.conversation.turns.find(t => t.turnId === composition.sourceTurnRef);
  if (!proposalTurn || !source) throw new Error("WORKING_DRAFT_SOURCE_MISSING");
  // Existing QRY selector owns priority; this projection never owns the phrasing.
  const selectable = composition.proposal.atoms.filter(a => a.status !== "OPEN_DECISION" && !a.dependsOn.length
    && !composition.proposal.arbitrations.some(r => r.options.some(o => o.atomRefs.includes(a.ref)))).map(a => a.ref);
  if (!selectable.length) return null;
  const contribution = buildStudyProposalSelectionContribution({ composition, project: request.currentProject,
    projectId: request.currentProject?.projectId ?? `discussion:${request.conversation.conversationId}`, conversationId: request.conversation.conversationId,
    selectedOptionRefs: [], selectedAtomRefs: selectable, proposalTurn: proposalTurn as ScientificInterpretationTurn,
    selectionTurn: source as ScientificInterpretationTurn, createdAt: proposalTurn.createdAt ?? new Date().toISOString(), preparingReview: true });
  const navigation = buildCurrentTurnNavigation({ sourceTurnRef: source.turnId, sourceText: source.content,
    contribution, candidate: prepareResearchProjectContributionCandidate(contribution, request.currentProject),
    validation: null, currentProject: request.currentProject, substantiveProposalEligible: true });
  const selection = selectStudyProposalArbitrations({ composition, navigation });
  const action = selection.selected;
  const advice = (item: typeof selection.nonDominated[number]) => ({ action: item.actionCategory,
    label: item.actionLabel, reason: item.explanation, impacts: item.impacts, options: item.knownOptionRefs,
    blockers: item.dependencies.filter(d => d.status !== "SATISFIED") });
  return { STATUS: selection.trace.outcome, TRACE_REF: selection.trace.traceId,
    ALTERNATIVES: selection.nonDominated.map(advice),
    ...(action ? { NEXT_HIGH_VALUE_ACTION: action.actionLabel, WHY_NOW: action.explanation,
      IMPACT: action.impacts, OPTIONS: action.knownOptionRefs, BLOCKERS: action.dependencies.filter(d => d.status !== "SATISFIED") } : {}) };

};
