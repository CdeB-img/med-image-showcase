import type { ScientificContributionItem, ScientificInterpretationContributionEnvelope } from "../scientific-interpretation/contracts.js";
import { presentCanonicalTemporalAnchor } from "../research-project-construction/temporal-presentation.js";
import { classifyNaturalConversationActs, detectConversationStylePreference } from "./functional-reset/natural-conversation-policy.js";
import { hasExplicitConversationRequestMood, requestsAssistedProposal } from "../query-navigation/conversation-proposal-request.js";

// A read-only disposition of existing extraction findings. These are audit
// roles, not another Project status, inferred fact or human decision model.
type DispositionRole = "REPRESENTED" | "REDUNDANT_PARAPHRASE" | "DISCOURSE_ACT" | "SUPERSEDED"
  | "PARTIAL_MATERIAL" | "TRUE_OMISSION" | "UNKNOWN";
type Evidence = { refs: string[]; sources: string[]; text: string; kind: "OBJECT" | "LINK" | "ENUMERATION"; type: string | null; polarity?: string | null };
export type SourceCoverageDisposition = {
  diagnosticId: string; sourceSpan: string; sourceRefs: string[]; oldClass: string; classification: DispositionRole;
  semanticEvidence: string[]; candidateRefs: string[]; unmatchedTerms: string[];
  actionable: boolean; aggregateGroup: string | null; reason: string;
};

const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR").replace(/[’']/gu, " ").replace(/\s+/gu, " ").trim();
const normalized = (text: string) => fold(text)
  .replace(/\b([jm])\s*\+?\s*(-?\d+)\b/gu, (_, code: string, number: string) => `${code}${number.replace("-", "minus")}`)
  .replace(/(\d)[.,](\d)/gu, "$1decimal$2")
  .replace(/\b(\d+(?:decimal\d+)?)\s*(?:s|sec|secondes?)\b/gu, "$1 seconde")
  .replace(/superieur(?:e)? ou egal(?:e)? a|≥/gu, " ge ").replace(/inferieur(?:e)? ou egal(?:e)? a|≤/gu, " leq ")
  .replace(/inferieur(?:e)? a|</gu, " lt ").replace(/superieur(?:e)? a|>/gu, " gt ")
  .replace(/jusqu a (?=\d)|maximal(?:e)?(?: de)? (?=\d)|au maximum (?=\d)/gu, " leq ")
  .replace(/%/gu, " pourcent ").replace(/=/gu, " eq ")
  .replace(/\b(?:plus tard|ulterieurement)\b/gu, " futur ")
  .replace(/\b(?:au depart|dans un premier temps|initialement)\b/gu, " initial ")
  .replace(/\bdans un seul centre\b/gu, " monocentrique ")
  .replace(/\bpre[ -]reperfusion\b/gu, " avant reperfusion ")
  .replace(/\b(?:en excluant le core|en dehors du core|sans core)\b/gu, " absence recouvrement core ")
  .replace(/\b(?:lorsqu elle est disponible|quand elle est disponible|si elle est disponible)\b/gu, " si disponible ")
  .replace(/^le modele \d+ est le modele\b/u, "modele")
  .replace(/\bechelles adaptees comme\b/gu, " score ")
  .replace(/\b(?:core|penombre) (?:defini(?:e)? par|class(?:e|ee) si)\b/gu, match => match.startsWith("core") ? "core" : "penombre")
  .replace(/\bclassant le (core|penombre) si\b/gu, "$1")
  .replace(/\b(?:eventuellement|optionnel(?:le)?|de facon optionnelle|envisages? de facon conditionnelle)\b/gu, " option ")
  .replace(/\b(?:pas de|sans|absence d)\b/gu, " absence ")
  .replace(/\b(?:deux|deuxieme)\b/gu, " 2 ").replace(/\b(?:trois|troisieme)\b/gu, " 3 ")
  .replace(/\b(?:recal(?:ee?|ees|es|age))\b/gu, " recalage ")
  .replace(/\b(?:diffusion irm|irm de diffusion)\b/gu, " irm diffusion ")
  .replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/gu, " ").trim();

// Presentation carriers only. Negations, alternatives, conditionality, units,
// quantities and scientific descriptors are never stop words.
const carriers = new Set(normalized("le la les l de du des d un une a au aux en et pour par sur son sa ses je nous on il elle qui que qu avec comme sera seront est sont c ce cette ces bien garde gardant acquisition score classe notamment puis mais donc ici dans leur leurs cet cela il s agit souhaite voudrais veux veut faut idee terme objectif hypothese critere principal final serait seront etre devront devra doit restent reste pourrait pourront pourra permettant concernant dont tenant voir afin tel quelque chose durant par rapport a evidemment servira realisee prevoit participe finalement chez faire alors tandis egalement aussi ensuite car restera but pense criteres").split(" "));
const aliases: Record<string, string> = {
  perfusionnel: "perfusion", perfusionnels: "perfusion", predictif: "prediction", predictive: "prediction", predictifs: "prediction",
  predire: "prediction", predits: "prediction", predit: "prediction", definir: "definition", defini: "definition", definie: "definition", definira: "definition",
  valide: "validation", valides: "validation", valider: "validation", verifies: "verification", verifie: "verification", verifier: "verification",
  evaluee: "evaluation", evaluer: "evaluation", evaluation: "evaluation", etudies: "etude", etudier: "etude", etude: "etude",
  constitue: "constituer", constituee: "constituer", construisons: "construire", construire: "construire",
  comparera: "comparaison", compares: "comparaison", compare: "comparaison", comparer: "comparaison", comparant: "comparaison",
  prete: "pret", extension: "extension", adaptees: "adapte", recueil: "recueillir", inclus: "inclusion", inclure: "inclusion",
  cardio: "cardiaque", cardiaques: "cardiaque", neuro: "neurologique", neurologiques: "neurologique",
  fiable: "fiabilite", faible: "faible", independantes: "independant", independants: "independant",
  pourra: "pourra", devront: "devront", apporte: "apport", repart: "repart", reperfuses: "reperfusion", reperfuse: "reperfusion",
  plutot: "plutot", realises: "realisation", realisee: "realisation", realise: "realisation", clinique: "clinique",
  seuils: "seuil", coefficients: "coefficient", lecteurs: "lecteur", traditionnelle: "traditionnel", traditionnelles: "traditionnel", traditionnels: "traditionnel",
  uniquement: "unique",
  recherche: "rechercher", regardera: "evaluation", evaluera: "evaluation",
};
const tokens = (text: string) => normalized(text).split(" ").filter(word => word && !carriers.has(word))
  .map(word => aliases[word] ?? (word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word));
const sourceKey = (text: string) => fold(text).replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/gu, " ").trim();
const overlaps = (a: string, b: string) => Boolean(sourceKey(a) && sourceKey(b)
  && (` ${sourceKey(a)} `.includes(` ${sourceKey(b)} `) || ` ${sourceKey(b)} `.includes(` ${sourceKey(a)} `)));
const grounded = (source: string | null | undefined, raw: string): source is string => Boolean(source && fold(raw).includes(fold(source)));
const unique = <T,>(values: T[]) => [...new Set(values)];

const sentences = (raw: string) => raw.split(/(?<=[.!?;])(?:\s+|$)|\n+/u).map(text => text.trim()).filter(Boolean);
const contextOf = (source: string, contexts: string[]) => contexts.find(text => fold(text).includes(fold(source))) ?? source;
const roleText = (item: ScientificContributionItem) => [item.proposedType === "OBJECTIVE" ? "objectif" : "",
  item.proposedType === "HYPOTHESIS" ? "hypothèse" : "", item.studyRole === "PRIMARY_ENDPOINT" ? "critère principal" : "",
  item.studyRole === "REFERENCE_STANDARD" ? "référence" : "", item.studyRole === "SECONDARY_ENDPOINT" ? "secondaire" : ""].join(" ");

const evidenceFor = (contribution: ScientificInterpretationContributionEnvelope): Evidence[] => {
  const raw = contribution.source.originalRequest, content = contribution.scientificContent;
  const objects = [...new Map([...content.candidateObjects, ...content.temporalElements, ...content.negationsAndConstraints]
    .filter(item => item.epistemicBoundary.activeState !== false && grounded(item.epistemicBoundary.sourceText, raw))
    .map(item => [item.itemId, item])).values()];
  const byRef = new Map(objects.flatMap(item => unique([item.itemId, ...(item.semanticIdentity ? [item.semanticIdentity] : [])])
    .map(ref => [ref, item] as const)));
  const labels = new Map(objects.map(item => [item.itemId, item.content]));
  const evidence: Evidence[] = objects.map(item => ({ refs: [item.itemId], sources: [item.epistemicBoundary.sourceText!],
    text: `${item.polarity === "NEGATED" ? "absence pas non ne " : ""}${item.content} ${roleText(item)}`, kind: "OBJECT", type: item.proposedType, polarity: item.polarity }));
  for (const temporal of [...(content.temporalQualifications ?? []), ...(content.expectedVariableOccasions ?? [])]) {
    if (temporal.operation === "REMOVE" || !temporal.anchor || !grounded(temporal.sourceText, raw)) continue;
    if (temporal.anchor.offset === null && temporal.anchor.lowerBound === null && temporal.anchor.upperBound === null
      && !temporal.anchor.relativeEventLabel && temporal.anchor.reference.status !== "KNOWN") continue;
    const subjectRef = "subjectProjectRef" in temporal ? temporal.subjectProjectRef : temporal.variableProjectRef;
    const subject = byRef.get(subjectRef);
    if (!subject) continue;
    const contextRef = "studyUnitOrGroupRef" in temporal ? temporal.studyUnitOrGroupRef : null;
    const context = contextRef ? byRef.get(contextRef) : null;
    const id = "qualificationId" in temporal ? temporal.qualificationId : temporal.occasionId;
    evidence.push({ refs: [id, subject.itemId, ...(context ? [context.itemId] : [])], sources: [temporal.sourceText, subject.epistemicBoundary.sourceText!],
      // The presentation reads only the common temporal value fields; it does
      // not create/adopt a canonical value or supply missing provenance.
      text: `${subject.content} ${roleText(subject)} ${context?.content ?? ""} ${presentCanonicalTemporalAnchor(temporal.anchor as Parameters<typeof presentCanonicalTemporalAnchor>[0], labels).split(" —")[0]}`,
      kind: "LINK", type: subject.proposedType, polarity: subject.polarity });
  }
  for (const relation of content.candidateRelations) {
    const source = byRef.get(relation.sourceItemId), target = byRef.get(relation.targetItemId);
    if (!source || !target || relation.epistemicBoundary.activeState === false || !grounded(relation.epistemicBoundary.sourceText, raw)) continue;
    if (!["COMPARES_WITH", "COMPARED_WITH"].includes(relation.relationType)) continue;
    evidence.push({ refs: [relation.relationId, source.itemId, target.itemId], sources: [relation.epistemicBoundary.sourceText],
      text: `${source.content} comparaison ${target.content}`, kind: "LINK", type: null, polarity: relation.polarity });
  }
  // Combine explicit content atoms in one source sentence only for independent
  // enumerations. A combined bag of numbers/operators cannot prove a bound,
  // comparison direction, conditional or temporal binding.
  const contexts = sentences(raw);
  for (const context of contexts) {
    const group = evidence.filter(unit => unit.kind === "OBJECT" && unit.sources.some(source => overlaps(source, context)));
    if (group.length > 1) evidence.push({ refs: unique(group.flatMap(unit => unit.refs)), sources: [context],
      text: group.map(unit => unit.text).join(" ; "), kind: "ENUMERATION", type: null });
  }
  // Registration is a relationship stated by the context object, not inferred
  // from co-occurring modalities. Combine it with its very same named/timed
  // acquisition, whose native role supplies REFERENCE_STANDARD.
  for (const registration of evidence.filter(unit => unit.type === "PROJECT_INFORMATION" && /\brecalage\b/u.test(normalized(unit.text)))) {
    for (const acquisition of evidence.filter(unit => unit.type === "ACQUISITION" && /\breference\b/u.test(fold(unit.text)))) {
      if (!registration.sources.some(anchor => acquisition.sources.includes(anchor))) continue;
      const eventKeys = tokens(acquisition.text).filter(token => /^(?:irm|scanner|j\d+|m\d+)$/u.test(token));
      if (eventKeys.length < 2 || !eventKeys.every(token => tokens(registration.text).includes(token))) continue;
      evidence.push({ refs: unique([...registration.refs, ...acquisition.refs]), sources: registration.sources,
        text: `${registration.text} ; ${acquisition.text}`, kind: "LINK", type: "ACQUISITION" });
    }
  }
  const monocentric = evidence.filter(unit => unit.type === "STUDY_DESIGN" && /\bmonocentrique\b/u.test(normalized(unit.text)));
  if (monocentric.length === 1 && !objects.some(item => /\bmulticentrique\b/u.test(fold(item.content)))) {
    for (const inclusion of evidence.filter(unit => unit.type === "CONSTRAINT" && /\binclusion\b/u.test(tokens(unit.text).join(" ")))) {
      if (!inclusion.sources.some(anchor => /\b(?:seul centre|monocentrique)\b/u.test(fold(anchor)))) continue;
      evidence.push({ refs: unique([...inclusion.refs, ...monocentric[0]!.refs]), sources: inclusion.sources,
        text: `${inclusion.text} ; ${monocentric[0]!.text}`, kind: "LINK", type: "CONSTRAINT" });
    }
  }
  return evidence;
};

const categoryCorrectionEvidence = (source: string, context: string, evidence: Evidence[]) => {
  const declaration = /^([\p{L}][\p{L}\p{N}]*) n est pas (?:vraiment )?une methode ([\p{L}]+)$/u.exec(fold(source));
  const replacement = /c est un parametre de ([\p{L}]+)/u.exec(fold(context));
  if (!declaration || !replacement) return null;
  const variable = declaration[1]!, rejected = tokens(declaration[2]!)[0], category = tokens(replacement[1]!)[0];
  const parameter = evidence.find(unit => unit.type === "CANONICAL_VARIABLE" && tokens(unit.text).includes(variable) && tokens(unit.text).includes(category!));
  const accepted = evidence.find(unit => unit.type === "ANALYSIS_SPECIFICATION" && tokens(unit.text).includes(variable) && tokens(unit.text).includes(category!));
  const distinct = evidence.filter(unit => unit.type === "ANALYSIS_SPECIFICATION" && tokens(unit.text).includes(rejected!));
  if (!parameter || !accepted || !distinct.length || distinct.some(unit => tokens(unit.text).includes(variable))) return null;
  return [parameter, accepted, ...distinct];
};

const independentExclusionEvidence = (source: string, evidence: Evidence[]) => {
  const alternative = /^impossibilite de (.+) ou de (.+)$/u.exec(fold(source));
  if (!alternative) return null;
  const subjects = [alternative[1]!, alternative[2]!];
  const clauses = subjects.map(subject => evidence.find(unit => unit.type === "ELIGIBILITY_CRITERION"
    && unit.sources.some(anchor => overlaps(anchor, source))
    && fold(unit.text).includes(`exclusion en cas d impossibilite de ${subject}`)));
  // Each existing candidate predicate explicitly excludes on its own. Their
  // union is not inferred from two bare items or a shared paragraph anchor.
  return clauses.every(Boolean) ? clauses as Evidence[] : null;
};

const nonExclusiveCollaborationEvidence = (source: string, evidence: Evidence[]) => {
  const clause = /^(.+?) reste un volet de la collaboration$/u.exec(fold(source));
  if (!clause) return null;
  const subject = tokens(clause[1]!);
  const about = (unit: Evidence) => subject.length && subject.every(token => tokens(unit.text).includes(token));
  const loan = evidence.find(unit => unit.type === "PROJECT_INFORMATION" && about(unit)
    && /\bprete par\b/u.test(fold(unit.text)) && /\bextension\b/u.test(fold(unit.text)));
  const nonUnique = evidence.find(unit => unit.type === "PROJECT_INFORMATION" && about(unit)
    && /\bn est pas l objectif unique\b/u.test(fold(unit.text)));
  const otherObjective = evidence.find(unit => unit.type === "OBJECTIVE" && !about(unit));
  return loan && nonUnique && otherObjective ? [loan, nonUnique, otherObjective] : null;
};

const hasScientificPayload = (raw: string) => /\d|\b(?:patients?|adultes?|population|ischemique|irm|pet|lecteurs?|cmro2|oef|tmax|cbf|reperfusion|thrombolyse|thrombectomie|registre|donnees|anonymisees?|autorisations?|gouvernance|protocole|territoire|fenetre|examens|contre indications?|biologiques?|sang|plasma)\b/u.test(fold(raw));
const discourseEvidence = (source: string, context: string): string | null => {
  const text = fold(source).replace(/[.!?]+$/u, "");
  const acts = classifyNaturalConversationActs(source);
  if (/^(?:oui|non|merci|c est (?:bien )?(?:cela|ca|bon)|oui c est bon|pour l instant|en echange|a terme)$/u.test(text)) return "Bounded acknowledgment/connector: no scientific payload";
  if (/^(?:oui )?cela correspond globalement$/u.test(text)) return "Acknowledgment about the formulation";
  if (detectConversationStylePreference(source) && !hasScientificPayload(source)) return "Existing STYLE_OR_DOCUMENTARY_FEEDBACK classifier; no scientific payload";
  if (/^(?:on va (?:vraiment )?(?:faire simple pour commencer|reprendre plus simplement)|je reformule(?: encore plus simplement)? pour (?:que ce soit bien enregistre|l enregistrer)|mais il faut corriger un point important|je corrige donc le calendrier precedent)$/u.test(text)) return `Presentation/correction preamble; existing acts: ${acts.join(", ")}`;
  if (/^(?:vous pouvez (?:l enregistrer telle quelle|enregistrer le projet avec cette formulation)|merci d enregistrer cette formulation comme projet complet|cette formulation correspond au projet|cette synthese ne reprend pas correctement le projet|cette proposition ne correspond pas vraiment a ce que je demande|la synthese precedente est a refuser car elle a perdu le cœur du projet)$/u.test(text)) return "Formulation/confirmation request; no decision binding performed";
  if (/^je veux maintenant qu on passe a l etape suivante/u.test(text)) return "Conversation transition; no Project content";
  if (/^(?:mais )?sans detailler leurs analyses maintenant$/u.test(text)) return "Request to defer the analytical detail; no supplied analytical specification";
  if (hasExplicitConversationRequestMood(context, fold(context)) || requestsAssistedProposal(fold(context))) {
    if (!/\b(?:je propose d inclure|on pourrait inclure|avec un|pour lesquels|doit comporter)\b/u.test(fold(context))) return "Existing request/mood classifier on the intact sentence; request is not a missing Project fact";
  }
  if (/^(?:il faut formaliser|en commencant par les criteres|de non[ -]inclusion|puis le deroulement des visites|il faut maintenant m aider a transformer|en signalant ce qui reste a arbitrer)/u.test(text)
    || /^(?:on pourra detailler le plan statistique|les criteres d inclusion apres|en restant pragmatique|deroulement provisoire)$/u.test(text)) return "Instruction about the next drafting step, not scientific content";
  return null;
};

// Supersession requires a source correction AND the replacement rendered by
// actual candidate content/native time. The old value alone cannot discharge
// its own diagnostic. Restrict the proof to the intact correction sentence.
const correctionEvidence = (source: string, context: string, raw: string, evidence: Evidence[]) => {
  const text = fold(context);
  const correction = /(?:ce n est pas|non pas|pas)\s+([^,;.]+)[,;]\s*(?:mais|c est bien|c est|plutot)\s+([^,;.]+)/u.exec(text)
    ?? /(?:finalement|a la place|au lieu de)\s+([^,;.]+)[,;]\s*(?:et )?(?:pas|non)\s+([^,;.]+)/u.exec(text);
  if (!correction) return null;
  const reversed = /^(?:finalement|a la place|au lieu de)/u.test(correction[0]);
  const oldValue = reversed ? correction[2]! : correction[1]!, replacement = reversed ? correction[1]! : correction[2]!;
  const oldTokens = tokens(oldValue), replacementTokens = tokens(replacement);
  // Category corrections need a typed parameter/model proof above; a phrase
  // borrowed from a second category is insufficient supersession evidence.
  if (/\bmethode\b/u.test(oldValue)) return null;
  if (!oldTokens.length || !replacementTokens.length) return null;
  // A context label after the replacement ("pour la ...") is not the value;
  // its binding must be in the anchored native evidence, not inferred here.
  const valueTokens = tokens(replacement.split(/\bpour\b/u)[0]!);
  const oldIncluded = oldTokens.every(token => tokens(source).includes(token));
  const newIncluded = valueTokens.length && valueTokens.every(token => tokens(source).includes(token));
  if (!oldIncluded && !newIncluded) return null;
  const scope = /\bpour (?:la |le |les )?(.+)$/u.exec(replacement)?.[1];
  // A named cohort/group heading in the user's own source supplies context
  // for an abbreviated label in the correction. Verify the existing target
  // against that heading; never rebind or guess a Project reference.
  const prefix = raw.slice(0, Math.max(0, raw.indexOf(context)));
  const heading = [...prefix.matchAll(/(?:^|\n)\s*-?\s*([\p{L}\p{N} _-]+)\s*:/gu)].at(-1)?.[1]?.trim();
  const proof = evidence.find(unit => unit.kind !== "ENUMERATION" && unit.sources.some(anchor => overlaps(anchor, context))
    && valueTokens.length && valueTokens.every(token => tokens(unit.text).includes(token)) && !oldTokens.some(token => tokens(unit.text).includes(token))
    && (!scope || overlaps(unit.text, scope) || heading && sourceKey(unit.text).includes(sourceKey(heading))));
  return proof ? { proof, oldValue, replacement, oldIncluded } : null;
};

const materialOperator = (text: string) => /\d|\b(?:absence|pas|sans|ou|si|possible|option|uniquement|seulement|avant|apres|ge|leq|lt|gt|pourcent|independant)\b/u.test(normalized(text));
const numericOrder = (text: string) => normalized(text).match(/\b\d+(?:decimal\d+)?\b/gu) ?? [];
const thresholdClaims = (text: string) => {
  const normalizedText = normalized(text);
  return [...normalizedText.matchAll(/\b([\p{L}][\p{L}\p{N}]*)\s+(lt|gt|ge|leq|eq)\s+(\d+(?:decimal\d+)?)(?:\s+(pourcent|seconde))?\b/gu)]
    .map(match => ({ expression: match[0], variable: match[1],
      compartment: [...normalizedText.slice(0, match.index).matchAll(/\b(core|penombre)\b/gu)].at(-1)?.[1] ?? null }));
};
const isSubsequence = (source: string[], target: string[]) => {
  let position = 0;
  return source.every(value => { const next = target.findIndex((candidate, index) => index >= position && candidate === value); position = next + 1; return next >= 0; });
};
const proofFor = (source: string, context: string, evidence: Evidence[]) => {
  const obligations = tokens(source);
  const matches = evidence.filter(unit => unit.sources.some(anchor => overlaps(anchor, source)
      || unit.kind === "OBJECT" && overlaps(anchor, context))
    || unit.kind !== "ENUMERATION" && obligations.length > 1 && obligations.every(token => tokens(unit.text).includes(token)))
    .filter(unit => unit.kind !== "ENUMERATION" || !materialOperator(source))
    .map(unit => {
      const candidate = tokens(unit.text);
      const missing = obligations.filter(token => !candidate.includes(token));
      if (unit.type === "CANONICAL_VARIABLE" && /\b(?:on regardera|on evaluera)\b/u.test(fold(source))) {
        // A canonical measurement already states what will be evaluated; this
        // rule cannot discharge a comparison/stratification predicate.
        const index = missing.indexOf("evaluation"); if (index >= 0) missing.splice(index, 1);
      }
      if (unit.type === "ENDPOINT" && /\b(?:etudies|etudiee) comme criteres? secondaires?\b/u.test(fold(source))
        && /\bsecondaire/u.test(fold(unit.text))) {
        const index = missing.indexOf("etude"); if (index >= 0) missing.splice(index, 1);
      }
      if (["ANALYSIS_SPECIFICATION", "PROJECT_INFORMATION"].includes(unit.type ?? "")
        && /^le modele .+ repose sur /u.test(fold(source)) && /\bmodele\b/u.test(fold(unit.text))) {
        const index = missing.indexOf("repose"); if (index >= 0) missing.splice(index, 1);
      }
      if (unit.polarity === "NEGATED" && !/\b(?:absence|pas|non|sans)\b/u.test(normalized(source))) missing.push("POLARITY_NOT_REPRESENTED");
      for (const claim of thresholdClaims(source)) {
        if (!thresholdClaims(unit.text).some(rendering => rendering.expression === claim.expression
          && (!claim.compartment || rendering.compartment === claim.compartment))) missing.push(`THRESHOLD_BINDING:${claim.expression}`);
      }
      if (["OBJECTIVE", "HYPOTHESIS"].includes(unit.type ?? "") && /\bsi\b/u.test(fold(source))
        && /\b(?:evaluer|hypothese)\b/u.test(fold(unit.text))) {
        // "Évaluer si ..." denotes the object of exploration, not a condition
        // governing acquisition/eligibility. No possible/option token removed.
        const index = missing.indexOf("si"); if (index >= 0) missing.splice(index, 1);
      }
      // Semantic roles can discharge the corresponding source label; they are
      // otherwise not discarded by the lexical carrier list.
      for (const role of ["objectif", "hypothese", "critere principal", "reference"]) {
        if (new RegExp(`\\b${role}\\b`, "u").test(fold(source)) && !new RegExp(`\\b${role}\\b`, "u").test(fold(unit.text))) missing.push(`ROLE:${role}`);
      }
      if (/\b\d+\s*(?:a|–|-)\s*\d+\b/u.test(fold(source))) {
        if (!isSubsequence(numericOrder(source), numericOrder(unit.text))) missing.push("BOUND_ORDER_NOT_REPRESENTED");
      }
      return { unit, missing: unique(missing), matched: obligations.filter(token => candidate.includes(token)) };
    }).sort((a, b) => a.missing.length - b.missing.length || b.matched.length - a.matched.length || a.unit.refs.length - b.unit.refs.length);
  // Context delimits source locality; its words never become fact evidence.
  return matches[0];
};

const hasMaterialMissingObligation = (terms: string[]) => terms.some(term =>
  /\d|^ROLE:|^THRESHOLD_BINDING:|BOUND_ORDER|POLARITY/u.test(term)
  || /^(?:absence|pas|non|ou|si|possible|option|unique|seulement|avant|apres|ge|leq|lt|gt|pourcent|independant|comparaison|stratification|reference|principal|secondaire|population|patient|adulte|cohorte|retrospectif|prospectif|ischemique|consentement|reperfusion|traitement|registre|irm|scanner|oef|cmro2|cbf|tmax|biobanque|biologique|socle|clinique|annuel|lesion|core|penombre|prediction|qualite|volume|dice|perfusion|metabolique|territoire|fenetre|interpretabilite)$/u.test(term));

const labelFor = (text: string) => {
  const source = fold(text);
  if (/\b(?:acceder|acces|anonymisees?|autorisations?|gouvernance)\b/u.test(source)) return "Accès aux données et conditions de gouvernance";
  if (/\b(?:registre|analyse principale|non inclusion|criteres d inclusion|territoire|fenetre temporelle|adultes|perte de chance|thrombolyse|thrombectomie|consentement)\b/u.test(source)) return "Population et conditions d’inclusion";
  if (/\b(?:seuils?|inferieur|superieur|cbf|tmax|oef|cmro2)\b/u.test(source)) return "Modèles et paramètres d’analyse";
  if (/\b(?:dice|compar|tici|predict|lesion finale|reperfusion)\b/u.test(source)) return "Évaluation et comparaison";
  if (/\b(?:irm|scanner|j\d|m\d|visites?|suivi)\b/u.test(source)) return "Acquisitions et suivi";
  if (/\b(?:biobanque|biologique|socle|plasma|sang|fecale)\b/u.test(source)) return "Données et prélèvements";
  return "Éléments de l’étude";
};

export const projectActionableSourceCoverage = (contribution: ScientificInterpretationContributionEnvelope) => {
  const evidence = evidenceFor(contribution), contexts = sentences(contribution.source.originalRequest);
  const findings = contribution.audit.deterministicFindings.filter(finding => finding.code.startsWith("SOURCE_COVERAGE_") && finding.status === "OPEN");
  const dispositions: SourceCoverageDisposition[] = findings.map(finding => {
    const source = /«\s?(.*?)\s?»\s*$/su.exec(finding.message)?.[1] ?? finding.message;
    const context = contextOf(source, contexts), discourse = discourseEvidence(source, context);
    let categoryCorrection = categoryCorrectionEvidence(source, context, evidence);
    if (categoryCorrection) {
      const parameterRefs = categoryCorrection[0]!.refs, rejectedRefs = categoryCorrection.slice(2).flatMap(unit => unit.refs);
      if (contribution.scientificContent.candidateRelations.some(relation => relation.epistemicBoundary.activeState !== false
        && relation.polarity !== "NEGATED" && !["COMPARES_WITH", "COMPARED_WITH"].includes(relation.relationType)
        && (parameterRefs.includes(relation.sourceItemId) && rejectedRefs.includes(relation.targetItemId)
          || parameterRefs.includes(relation.targetItemId) && rejectedRefs.includes(relation.sourceItemId)))) categoryCorrection = null;
    }
    const correction = correctionEvidence(source, context, contribution.source.originalRequest, evidence);
    const exclusions = independentExclusionEvidence(source, evidence);
    const collaboration = nonExclusiveCollaborationEvidence(source, evidence);
    const best = proofFor(source, context, evidence);
    let classification: DispositionRole, reason: string;
    let units: Evidence[] = best?.matched.length ? [best.unit] : [];
    if (discourse) { classification = "DISCOURSE_ACT"; reason = discourse; units = []; }
    else if (categoryCorrection) { classification = "REPRESENTED"; reason = "Explicit parameter category, separate models, and no contrary parameter membership in the candidate"; units = categoryCorrection; }
    else if (correction) { classification = correction.oldIncluded ? "SUPERSEDED" : "REPRESENTED";
      reason = `Explicit correction ${correction.oldValue} → ${correction.replacement}; replacement value and existing named target represented`; units = [correction.proof]; }
    else if (exclusions) { classification = "REPRESENTED"; reason = "Each explicit candidate exclusion predicate applies independently; both source alternatives rendered"; units = exclusions; }
    else if (collaboration) { classification = "REDUNDANT_PARAPHRASE"; reason = "Loan/extension collaboration, non-exclusive objective and additional research objective explicitly present"; units = collaboration; }
    else if (best && !best.missing.length && best.matched.length) {
      classification = fold(source) === fold(best.unit.text) ? "REPRESENTED" : "REDUNDANT_PARAPHRASE";
      reason = "All substantive source obligations rendered by grounded content/roles/native links after bounded surface normalization";
    } else if (best?.matched.length && hasMaterialMissingObligation(best.missing)) {
      classification = "PARTIAL_MATERIAL"; reason = "Partial rendering with an unrepresented material quantity/operator/role/scientific dimension";
    } else if (best?.matched.length) { classification = "UNKNOWN"; reason = "Partial surface match; semantic equivalence/materiality of remaining wording cannot be demonstrated by the bounded evidence rules"; }
    else if (/\b(?:\d+|[jm]\d+)\b/u.test(normalized(source)) || hasScientificPayload(source)) {
      classification = "TRUE_OMISSION"; reason = "Explicit scientific source information has no rendering in the candidate evidence";
    } else { classification = "UNKNOWN"; reason = "Neither coverage nor a purely conversational role can be demonstrated; retained for review"; }
    const actionable = ["PARTIAL_MATERIAL", "TRUE_OMISSION", "UNKNOWN"].includes(classification);
    const group = actionable ? `${contexts.indexOf(context)}:${labelFor(context)}` : null;
    return { diagnosticId: finding.findingId, sourceSpan: source, sourceRefs: [...finding.sourceRefs], oldClass: finding.code.replace("SOURCE_COVERAGE_", ""),
      classification, semanticEvidence: units.map(unit => unit.text), candidateRefs: unique(units.flatMap(unit => unit.refs)),
      unmatchedTerms: actionable ? best?.missing ?? tokens(source) : [], actionable, aggregateGroup: group, reason };
  });
  const groups = new Map<string, { id: string; label: string; sourceContext: string; dispositions: SourceCoverageDisposition[] }>();
  for (const disposition of dispositions.filter(item => item.actionable)) {
    const context = contextOf(disposition.sourceSpan, contexts), id = disposition.aggregateGroup!;
    const group = groups.get(id) ?? { id, label: labelFor(context), sourceContext: context, dispositions: [] };
    group.dispositions.push(disposition); groups.set(id, group);
  }
  return { dispositions, actionableItems: [...groups.values()], partialComprehensionWarning: groups.size > 0 };
};
