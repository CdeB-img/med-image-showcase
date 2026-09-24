import { ensureCanonicalProjectState, type CanonicalProjectObjectType } from "../../research-project-construction/canonical-project-backbone.js";
import type { ResearchProjectContributionCandidate, ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary.js";

export type ConversationStylePreference = Readonly<{
  responseLength: "CONCISE";
  source: "EXPLICIT_USER_FEEDBACK";
}>;

export type NaturalConversationAct =
  | "SCIENTIFIC_DECISION_INTENT"
  | "STYLE_OR_DOCUMENTARY_FEEDBACK"
  | "USER_FEEDBACK_ON_ASSISTANT_OUTPUT"
  | "EXTERNAL_EVIDENCE_REQUEST"
  | "PROJECT_STATE_QUESTION"
  | "SCIENTIFIC_EXPLORATION"
  | "CLARIFICATION_RESPONSE"
  | "NEW_INFORMATION";

const folded = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR").replace(/[\u2018\u2019\u02bc\uff07]/gu, "'")
  .replace(/\s+/gu, " ").trim();

/** Recognize an explicit operation, never its scientific scope or adoption.
 * Questions about recording and negative/quoted commands remain discussion. */
export const isExplicitProjectRecordingRequest = (raw: string) => raw.split(/[.!?;\n]/u).some(clause => {
  const text = folded(clause).replace(/^(?:(?:oui|alors|donc|merci|vas-y|s'il vous plait|s'il te plait|ca me convient|cela me convient|c'est parfait|c'est bon)[, ]+)+/u, "");
  const operation = /^(?:(?:je (?:veux|voudrais|souhaite)|nous (?:voulons|souhaitons)|(?:tu peux|vous pouvez)|peux-tu|pouvez-vous)\s+)?(?:enregistre(?:r|z)?|sauvegarde(?:r|z)?|inscri(?:s|re|vez))\b/u;
  const choice = /^(?:(?:(?:je|nous|on)\s+)|(?:(?:tu peux|vous pouvez|peux-tu|pouvez-vous)\s+))?(?:valide(?:r|s|z)?|validons|confirme(?:r|s|z)?|confirmons|retiens|retenons|adopte(?:r|s|z)?|adoptons|garde(?:r)?\s+(?:ca|cela))\b/u;
  const projectEdit = /^(?:ajoute(?:z)?(?:-le|-la)?|mets|mettez)\b.{0,60}\b(?:au|dans le|a jour le) projet\b/u;
  if (operation.test(text)) {
    return !/^(?:enregistre\w*|sauvegarde\w*|inscri\w*)\s+(?:(?:ca|cela|le|la|les|l')\s+)?pas\b/u.test(text);
  }
  if (projectEdit.test(text)) return !/^(?:ajoute\w*|mets|mettez)\s+(?:pas|ne)\b/u.test(text);
  if (!choice.test(text)) return false;
  const target = text.replace(choice, "").trim();
  return !/^(?:pas|que|qu'|si|quand|lorsque|en cas de)\b/u.test(target)
    && !/^(?:le|la|ce|cet|cette|ton|votre)\s+(?:format|style|ton|texte|reponse|concision)\b/u.test(target);
});

/** Feedback concerns the assistant's output, not a new study object. Mixed
 * turns remain mixed; this recognition grants no decision authority. */
export const isUserFeedbackOnAssistantOutput = (raw: string) => {
  const text = folded(raw);
  return /\b(?:ta|ton|tes|votre|vos|ces|cette|cet|question|quetion|hypothese)\b.{0,90}\b(?:ne (?:veut|veulent) rien dire|incomprehensible|a cote de la plaque|on (?:ne )?comprend rien)\b/u.test(text)
    || /\b(?:tu es|vous etes) a cote de la plaque\b/u.test(text)
    || /\b(?:je viens de dire|je (?:te|vous) l'ai deja dit|arrete(?:z)? de me redemander)\b/u.test(text)
    || /\bpourquoi (?:tu|vous)\b.{0,120}\b(?:parle\w*|demande\w*)\b.{0,140}\b(?:tout de suite apres|deja|encore)\b/u.test(text);
};

export const isExternalEvidenceRequest = (raw: string) => {
  const text = folded(raw);
  const literature = /\b(?:etudes?|litterature|publications?|articles?|sources?|references?|cohortes?)\b/u.test(text)
    || /\b(?:les autres|d autres) equipes\b/u.test(text);
  const request = /\?|\b(?:y a\s*-?\s*t\s*-?\s*il|existe\w*|quels?|quelles?|chercher|rechercher|trouve\w*|montre\w*|verifi\w*)\b/u.test(text);
  return literature && request;
};

/** Conservative semantic contrast at the existing extraction boundary. An
 * unclassified claim is left to extraction/review, never silently retyped. */
export const classifyScientificStatementPurpose = (source: string, currentTurn = source): "PROCEDURE_RATIONALE" | "HYPOTHESIS_OR_QUESTION" | "UNDETERMINED" => {
  const text = folded(source);
  const explicitTest = /\b(?:mon|notre|l')\s*hypothese (?:est|serait)|\b(?:je|nous|on)\s+(?:(?:veux|voulons|souhaite|souhaitons|va|allons)\s+)?(?:tester|testons|teste|evaluer si|comparer si)\b/u;
  if (explicitTest.test(text) && !/\b(?:ne|pas|aucune|sans)\b.{0,25}\b(?:hypothese|tester)\b/u.test(text)) return "HYPOTHESIS_OR_QUESTION";
  const procedure = /\b(?:je fais|nous faisons|on fait|realise\w*|preleve\w*|collect\w*|mesur\w*|acquis\w*|standardis\w*)\b/u;
  const rationale = /\b(?:pour|afin de|de cette facon|de cette maniere)\b/u;
  if (procedure.test(text) && rationale.test(text) && !explicitTest.test(text)) return "PROCEDURE_RATIONALE";
  if (/^de (?:cette facon|cette maniere)\b/u.test(text) && procedure.test(folded(currentTurn))
    && !explicitTest.test(folded(currentTurn))) return "PROCEDURE_RATIONALE";
  return "UNDETERMINED";
};

/** Detects a human act, never its target or authority. Binding belongs to QRY. */
export const readNaturalCandidateDecision = (raw: string): Readonly<{
  act: "CONFIRM" | "REFUSE";
  remainder: string;
  qualified: boolean;
}> | null => {
  const text = folded(raw).replace(/[.!]+$/u, "");
  if (/[?"«»“”]/u.test(text) || /\b(?:si|supposons|imaginons|exemple|dirais|dirions|peut etre|a condition)\b/u.test(text)) return null;
  const match = /^(?:(?:oui|alors|donc|vas-y|ca me convient|cela me convient|c'est parfait|c'est bon)[, ]+)*(?:(?:je|nous|on)\s+(confirme|confirmons|valide|validons|adopte|adoptons|accepte|acceptons|refuse|refusons|rejette|rejetons)\b|(?:vous pouvez|tu peux|peux-tu|pouvez-vous)\s+(enregistrer|valider|confirmer|adopter|garder)\b|(garde)\s+(?:ca|cela)\b|(oui|non)\b|(ca me va|cela me va)\b|(valide(?:r|s|z)?|validons|confirme(?:r|s|z)?|confirmons|adopte(?:r|s|z)?|adoptons|accepte(?:r|s|z)?|acceptons|retiens|retenons|garde)\b)/u.exec(text);
  if (!match) return null;
  const verb = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6]!;
  let remainder = text.slice(match[0].length).trim();
  if (/^(?:pas|jamais|plus)\b/u.test(remainder)) return null;
  remainder = remainder.replace(/^[,.; ]+/u, "").trim();
  const qualified = Boolean(remainder && !/^(?:c'est (?:bien |exactement )?(?:ca|cela|bon)|(?:ce|cet|cette|la|le) (?:proposition|formulation|projet|candidate|contribution)|comme tu viens de (?:le |la )?presenter|celui-la|celle-la)$/u.test(remainder));
  return Object.freeze({ act: /refus|rejet/u.test(verb) || verb === "non" ? "REFUSE" : "CONFIRM", remainder, qualified });
};

/** A style suffix may not smuggle a scientific edit into a whole decision. */
export const isOnlyConversationStyleFeedback = (raw: string) => Boolean(detectConversationStylePreference(raw))
  && !/\b(?:ajout\w*|chang\w*|remplac\w*|corrig\w*|modifi\w*|population|critere|objectif|hypothese|suivi|mesure|groupe|irm|analyse|volume|masse|seuil|sauf|hormis|except\w*|uniquement|seulement|premier\w*|deuxieme|partie|condition|pas pour|non pour)\b/u.test(folded(raw));

/** Conversation-only preference. It never becomes a scientific contribution. */
export const detectConversationStylePreference = (raw: string): ConversationStylePreference | null => {
  const text = folded(raw);
  const asksForLess = /\b(?:plus court(?:e|es|s)?|moins (?:long|de texte|detaille)|sois concis|reponses? concises?|raccourcis)\b/u.test(text);
  const reportsExcess = /\b(?:trop|beaucoup trop)\s+(?:long(?:ue|ues|s)?|de (?:texte|details?|paragraphes?|contenu a lire))\b/u.test(text)
    || /\b(?:texte|reponses?|messages?)\b.{0,30}\b(?:trop long|trop detaille|trop a lire)\b/u.test(text);
  return asksForLess || reportsExcess
    ? Object.freeze({ responseLength: "CONCISE" as const, source: "EXPLICIT_USER_FEEDBACK" as const })
    : null;
};

export const isProjectStateQuestion = (raw: string) => {
  const text = folded(raw);
  const interrogative = raw.includes("?")
    || /^(?:ou en est|on en est ou|tu connais|vous connaissez|je t'ai donne|je vous ai donne|il manque quoi|qu'est ce qu'il manque|quel|quelle|et pour)\b/u.test(text);
  const stateOrRecall = /\b(?:projet|deja|encore|actuel|actuelle|retenu|retenue|confirme|confirmee|connais|connait|manque|precis|defini|definie|donne|donnee|rappelle|rappeler|parle|parler)\b/u.test(text);
  const projectDimension = /\b(?:population|patients?|participants?|comparateur|groupes?|critere|endpoint|objectif|hypothese|suivi|calendrier|visite|design|intervention|exposition|mesure|analyse|projet)\b/u.test(text);
  const prospectiveChange = /\b(?:et si|on pourrait|je propose|nous proposons|ajout(?:e|ait|ons)|remplac(?:e|er|ions)|modifi(?:e|er|ions))\b/u.test(text);
  return Boolean(interrogative && projectDimension && stateOrRecall && !prospectiveChange
    || /\b(?:quel|quelle|quels|quelles)\b.{0,45}\b(?:avons|avez|as|est|sont)\b.{0,35}\b(?:retenu|retenue|confirme|confirmee|defini|definie)\b/u.test(text)
    || /^(?:ou en est|on en est ou|il manque quoi|qu'est ce qu'il manque)\b/u.test(text));
};

/** Multi-act recognition only; scientific meaning remains owned by the existing corridor. */
export const classifyNaturalConversationActs = (raw: string): readonly NaturalConversationAct[] => {
  const text = folded(raw);
  const acts = new Set<NaturalConversationAct>();
  const naturalDecision = readNaturalCandidateDecision(raw);
  if (naturalDecision) {
    acts.add("SCIENTIFIC_DECISION_INTENT");
    if (naturalDecision.qualified && /^(?:mais|et)\b|\ben gardant\b/u.test(naturalDecision.remainder)
      && !isOnlyConversationStyleFeedback(naturalDecision.remainder)) acts.add("CLARIFICATION_RESPONSE");
  }
  if (/\b(?:je|nous|on)\s+(?:confirme|confirmons|valide|validons|accepte|acceptons|adopte|adoptons|refuse|refusons|rejette|rejetons|retiens|retenons)\b/u.test(text)) {
    acts.add("SCIENTIFIC_DECISION_INTENT");
  }
  if (/\b(?:je|nous)\s+(?:retiens|retenons)\b.{0,50}\bcomme\s+(?:objectif|critere|endpoint|hypothese|design|population|analyse|mesure|visite)\b/u.test(text)) {
    acts.add("NEW_INFORMATION");
  }
  if (detectConversationStylePreference(raw)) acts.add("STYLE_OR_DOCUMENTARY_FEEDBACK");
  if (isUserFeedbackOnAssistantOutput(raw)) acts.add("USER_FEEDBACK_ON_ASSISTANT_OUTPUT");
  if (isExternalEvidenceRequest(raw)) acts.add("EXTERNAL_EVIDENCE_REQUEST");
  if (isProjectStateQuestion(raw)) acts.add("PROJECT_STATE_QUESTION");
  if (/\b(?:pourquoi|explique|discut|quelles? (?:options|approches|pistes)|propose)\b/u.test(text)) acts.add("SCIENTIFIC_EXPLORATION");
  if (/\b(?:corrige|remplace|a la place|au lieu de|je precise|en fait)\b/u.test(text)) acts.add("CLARIFICATION_RESPONSE");
  if (/^(?:le |la |l')\p{L}+(?: \p{L}+){0,3} est (?:a )?[jma]\+?\d+\b/u.test(text)) acts.add("CLARIFICATION_RESPONSE");
  if (!acts.size || /\b(?:ajoute|egalement|aussi|je veux|je propose|on pourrait|nous (?:prevoyons|excluons))\b/u.test(text)) acts.add("NEW_INFORMATION");
  return Object.freeze([...acts]);
};

export const isUnqualifiedWholeCandidateDecisionWithStyleFeedback = (raw: string) => {
  if (!detectConversationStylePreference(raw)) return null;
  const text = folded(raw);
  if (/\?|\b(?:peut etre|eventuellement|a condition|sauf|except|hormis|seulement|uniquement|partiellement)\b/u.test(text)) return null;
  const match = /^(?:(?:oui|non|finalement|donc|alors)[, ]+)?(?:je|nous|on)\s+(confirme|confirmons|valide|validons|accepte|acceptons|adopte|adoptons|refuse|refusons|rejette|rejetons)(?:\s+(?:ce|cet|cette|la|le|l')\s*(?:candidate|contribution|proposition|modification|changement))?(?:\s+(?:mais|meme si|,))?\s+(.+)$/u.exec(text);
  if (!match || !isOnlyConversationStyleFeedback(match[2]!)) return null;
  return /refus|rejet/u.test(match[1]!) ? "REFUSE" as const : "CONFIRM" as const;
};

type CurrentObject = ReturnType<typeof ensureCanonicalProjectState>["objects"][number];

const currentObjects = (project: Readonly<ResearchProjectOwnerProjection>) => ensureCanonicalProjectState(project).objects
  .filter((object) => object.actuality === "CURRENT" && !["UNKNOWN", "WITHHELD"].includes(object.epistemicState));

const objectsOf = (objects: readonly CurrentObject[], ...types: CanonicalProjectObjectType[]) => objects
  .filter((object) => types.includes(object.objectType));

const conciseList = (objects: readonly CurrentObject[], maximum = 3) => objects.slice(0, maximum)
  .map((object) => object.content).join(" ; ");

export type ProjectGap = Readonly<{ code: string; question: string }>;

/** Material gaps are selected by scientific role, not by UI section order. */
export const nextMaterialProjectGap = (project: Readonly<ResearchProjectOwnerProjection>): ProjectGap | null => {
  const objects = currentObjects(project);
  if (!objectsOf(objects, "POPULATION").length) return {
    code: "POPULATION_UNDEFINED",
    question: "Quels patients ou participants souhaitez-vous inclure ?",
  };
  if (!objectsOf(objects, "STUDY_DESIGN").length) return {
    code: "STUDY_DESIGN_UNDEFINED",
    question: "Quel cadre d’étude souhaitez-vous retenir ?",
  };
  if (!objectsOf(objects, "INTERVENTION_OR_EXPOSURE", "GROUP").length) return {
    code: "COMPARISON_UNDEFINED",
    question: "Quelles interventions, expositions ou groupes doivent être comparés ?",
  };
  if (!objectsOf(objects, "ENDPOINT").some((object) => object.scientificRole === "PRIMARY_ENDPOINT")) return {
    code: "PRIMARY_ENDPOINT_UNDEFINED",
    question: "Quel résultat doit constituer le critère principal ?",
  };
  if (!ensureCanonicalProjectState(project).temporalQualifications.some((item) => item.actuality === "CURRENT")) return {
    code: "TEMPORALITY_UNDEFINED",
    question: "À quel moment le critère principal doit-il être évalué ?",
  };
  return null;
};

const projectConditionContext = (objects: readonly CurrentObject[]) => conciseList(objectsOf(objects, "CONDITION"), 2);

/** Read-only answer from the canonical Project. No Knowledge call and no Project write. */
export const buildNaturalProjectStateReply = (input: {
  raw: string;
  project: Readonly<ResearchProjectOwnerProjection>;
}): { text: string; sourceRefs: string[] } | null => {
  if (!isProjectStateQuestion(input.raw)) return null;
  const text = folded(input.raw);
  const objects = currentObjects(input.project);
  const sourceRefs = [input.project.versionId, input.project.projectDigest];
  const withRefs = (answer: string, selected: readonly CurrentObject[]) => ({
    text: answer,
    sourceRefs: [...sourceRefs, ...selected.map((object) => object.objectId)],
  });

  if (/\b(?:population|patients?|participants?|age|inclus|inclure)\b/u.test(text)) {
    const population = objectsOf(objects, "POPULATION", "ELIGIBILITY_CRITERION");
    const condition = objectsOf(objects, "CONDITION");
    if (!objectsOf(objects, "POPULATION").length) {
      const opening = /\b(?:connais|connait|deja definie|deja precisee)\b/u.test(text)
        ? "Non, pas encore précisément."
        : "Oui : la population reste à préciser.";
      const context = projectConditionContext(objects);
      return withRefs([
        opening,
        context ? `Le contexte clinique est connu (${context}), mais il ne définit pas à lui seul les patients à inclure.` : null,
        "Quels patients souhaitez-vous inclure ?",
      ].filter(Boolean).join(" "), condition);
    }
    return withRefs(`La population actuellement définie est : ${conciseList(population)}.`, population);
  }

  const focus: readonly [RegExp, CanonicalProjectObjectType[], string][] = [
    [/\b(?:comparateur|groupe de reference|groupes?)\b/u, ["GROUP", "INTERVENTION_OR_EXPOSURE"], "La comparaison actuellement retenue est"],
    [/\b(?:critere|endpoint|resultat principal)\b/u, ["ENDPOINT"], "Le critère actuellement retenu est"],
    [/\b(?:objectif)\b/u, ["OBJECTIVE"], "L’objectif actuellement retenu est"],
    [/\b(?:suivi|calendrier|visite|delai|quand)\b/u, ["VISIT", "ACQUISITION"], "Le calendrier actuellement retenu comprend"],
    [/\b(?:design|plan d'etude|aveugle|random)\b/u, ["STUDY_DESIGN"], "Le design actuellement retenu est"],
  ];
  for (const [pattern, types, label] of focus) {
    if (!pattern.test(text)) continue;
    const selected = objectsOf(objects, ...types);
    if (!selected.length) return withRefs(`${label.replace(/ est$| comprend$/u, "")} n’est pas encore défini précisément.`, []);
    const conflicts = selected.filter((object) => object.coherence === "CONFLICTING");
    return withRefs(`${label} : ${conciseList(selected)}.${conflicts.length ? " Ces éléments comportent encore une contradiction à résoudre." : ""}`, selected);
  }

  const known = objects.filter((object) => object.coherence !== "CONFLICTING").slice(0, 3);
  const gap = nextMaterialProjectGap(input.project);
  return withRefs([
    known.length ? `Le projet retient actuellement : ${conciseList(known)}.` : "Le projet ne contient pas encore d’élément scientifique confirmé.",
    gap ? `Le point prioritaire à préciser est le suivant : ${gap.question}` : "Les dimensions structurantes sont renseignées ; les précisions restantes doivent être examinées selon leur impact.",
  ].join(" "), known);
};

const scientificWords = (value: string) => new Set(folded(value).replace(/[^\p{L}\p{N}]+/gu, " ").split(" ")
  .filter((word) => word.length >= 5 && !/^(?:etude|evaluer|efficacite|principal|principale|mesure|methode|patients|entre|comme|selon|faire|decrire)$/u.test(word)));

const materiallyOverlaps = (left: string, right: string) => {
  const a = scientificWords(left);
  const b = scientificWords(right);
  return [...a].some((word) => b.has(word));
};

type ChallengeObject = Readonly<{ objectType: CanonicalProjectObjectType; content: string; scientificRole: string | null }>;

export const scientificTensionsForObjects = (objects: readonly ChallengeObject[]) => {
  const messages: string[] = [];
  const objectives = objects.filter((object) => object.objectType === "OBJECTIVE");
  const endpoints = objects.filter((object) => object.objectType === "ENDPOINT" && object.scientificRole === "PRIMARY_ENDPOINT");
  const objective = objectives[0];
  const endpoint = endpoints[0];
  if (objective && endpoint && !materiallyOverlaps(objective.content, endpoint.content)) {
    messages.push(`Le lien entre l’objectif « ${objective.content} » et le critère principal « ${endpoint.content} » reste à expliciter.`);
  }
  const blindedDesign = objects.find((object) => object.objectType === "STUDY_DESIGN" && /aveugl|masqu/u.test(folded(object.content)));
  if (blindedDesign && !/\b(?:patient|participant|evaluateur|lecteur|clinicien|investigateur|analyste|soignant)\b/u.test(folded(blindedDesign.content))) {
    messages.push("Le masquage est annoncé, mais les personnes concernées et sa faisabilité ne sont pas encore précisés.");
  }
  return messages;
};

export const buildCandidateScientificChallenge = (candidate: Readonly<ResearchProjectContributionCandidate>) => {
  const objects = candidate.canonicalChangeSet.objectChanges.flatMap((change) => change.operation === "REMOVE" || !change.candidate
    ? [] : [{ objectType: change.candidate.objectType, content: change.candidate.content, scientificRole: change.candidate.scientificRole }]);
  const tensions = scientificTensionsForObjects(objects);
  if (!tensions.length) return null;
  return `Deux points de méthode méritent d’être clarifiés : ${tensions.slice(0, 2).join(" ")}`;
};

export const buildConciseAdoptionReply = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  projectExisted: boolean;
  stylePreference: ConversationStylePreference | null;
}) => {
  const receipt = input.projectExisted ? "Choix confirmés enregistrés." : "Projet créé avec les choix que vous avez confirmés.";
  const style = input.stylePreference ? "Je ferai plus court." : null;
  // A Project write produces only a receipt. An optional concise gap is kept
  // for the existing explicit style preference, never a scientific monologue.
  const gap = input.stylePreference ? nextMaterialProjectGap(input.project)?.question ?? null : null;
  return [receipt, style, gap].filter(Boolean).join(" ");
};
