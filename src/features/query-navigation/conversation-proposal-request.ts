// Existing bounded conversational-act predicate, extracted unchanged for reuse
// by source coverage without importing the owner-result ledger/runtime graph.
export const requestsAssistedProposal = (clause: string) => {
  if (/["«»“”]|\b(?:exemple|supposons|imaginons|si)\b/u.test(clause)) return false;
  const proposalObject = /\b(?:propositions?|options?|alternatives?|possibilités?|pistes?|suggestions?|solutions?|hypothèses?|approches?|choix|ce qu[' ]il manque|what is missing)\b/u.test(clause);
  const imperative = clause.match(/(?:^|[,;:]\s*|\b(?:puis|ensuite|maintenant|alors)\s+)((?:fais|faites|donne|donnez|propose|proposez|suggère|suggérez|présente|présentez)(?:[- ]moi)?|(?:peux|pouvez)[- ](?:tu|vous)\s+(?:me\s+)?(?:faire|donner|proposer|suggérer|présenter)|suggest(?: me)?)\b/u);
  // A negative constraint on adoption is not negation of the proposal request.
  const negated = imperative && /^\s+(?:pas|jamais|aucune?s?)\b/u.test(clause.slice(imperative.index! + imperative[0].length));
  if (imperative && !negated && (proposalObject || /^(?:proposez?|suggère|suggérez|suggest)\b/u.test(imperative[1]))) return true;
  if (proposalObject && /^(?:tu|vous)\s+(?:peux|pouvez|pourrais|pourriez)\s+(?:me\s+)?(?:proposer|suggérer|présenter)\b/u.test(clause)) return true;
  // Interrogative requests may follow a contextual preamble. Their proposal
  // purpose does not authorize adoption or remove another clause's payload.
  const question = /(?:^|[,;:]\s*|\bet\s+)(quelles?\s+[^.!?]+)[?]?$/u.exec(clause)?.[1];
  const negativeQuestion = question && /\b(?:ne|n')\s*(?:\p{L}+\s+){0,3}(?:propos\p{L}*|sugg\p{L}*|voi\p{L}*|verr\p{L}*|peu\p{L}*|pouv\p{L}*|pourr\p{L}*)/u.test(question);
  if (question && proposalObject && !negativeQuestion && (
    /\b(?:proposes?|proposez|proposerais|proposeriez|suggères?|suggérez|suggérerais|suggéreriez|vois|voyez|verrais|verriez)[- ](?:tu|vous)\b/u.test(question)
    || /\b(?:peut|pourrait)[- ]on\s+(?:proposer|envisager|examiner|explorer)\b/u.test(question)
    || /\b(?:examiner|envisager|explorer)(?:\s+(?:ensuite|maintenant))?\s*$/u.test(question)
  )) return true;
  return /^(?:qu[' ]est-ce que|que)\s+(?:tu|vous)\s+(?:me\s+)?(?:proposerais|proposeriez|proposes|proposez|suggères|suggérez)\b/u.test(clause)
    || /^(?:tu|vous)\s+(?:vois|voyez|envisages|envisagez)\s+(?:d[' ]autres|des|plusieurs)\s+/u.test(clause) && proposalObject
    || /^quelles?\b/u.test(clause) && proposalObject && !negativeQuestion && (
      /\b(?:proposes?|proposez|proposer|suggères?|suggérez|suggérer)\b/u.test(clause)
      || /\b(?:peux|pouvez|pourrais|pourriez)[- ](?:tu|vous)\s+(?:me\s+)?(?:faire|donner|présenter)\b/u.test(clause)
      || /\b(?:seraient|sont|te semblent|vous semblent)\s+(?:(?:les plus|encore|scientifiquement)\s+)?(?:intéressantes?|possibles?|pertinentes?|envisageables?|utiles?)\b/u.test(clause));
};

// Existing product-entry sentence-mood check, unchanged. This recognizes a
// request, never its scientific answer or its target/adoption semantics.
export const hasExplicitConversationRequestMood = (raw: string, command: string) => {
    return raw.trim().endsWith("?")
      || /^(?:pourquoi|comment|quel(?:le)?s?|qui|que|quand|ou|combien|est ce|qu est ce)\b/u.test(command)
      || /^(?:peux tu|pouvez vous|pourrais tu|pourriez vous|dois je|devons nous)\b/u.test(command)
      || /^(?:explique(?:r|z)?|compare(?:r|z)?|decris|decrivez|decrire|reformule(?:r|z)?)\b/u.test(command);
};
