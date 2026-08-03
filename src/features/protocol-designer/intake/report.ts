import { INTERPRETED_FIELD_KEYS, type AdaptiveQuestion, type ProtocolDesignerSession } from "./types";
import { scenarioDetails } from "./scenarios";

export type ReportSectionStatus = "Disponible" | "Partiellement disponible" | "Bloqué" | "Non encore supporté" | "Non applicable" | "À confirmer" | "Revue experte nécessaire";
export type ContextualReportSection = { number: number; title: string; status: ReportSectionStatus; content: string[] };
export type ContextualDeliverable = { title: string; status: string; available: string[]; missing: string[]; sources: string[]; limits: string[] };
export type ContextualReport = { title: string; status: "PROVISIONAL" | "FINAL"; generatedAt: string; sections: ContextualReportSection[]; deliverables: ContextualDeliverable[] };

export const REPORT_SECTION_TITLES = [
  "Identification de la session", "Question scientifique originale", "Question reformulée et validée", "Profil et niveau de l’utilisateur",
  "Contexte scientifique et clinique", "Population", "Groupes, interventions ou comparateurs", "Objectif scientifique",
  "Phénomènes biologiques ou physiopathologiques discutés", "Résultats ou critères recherchés", "Contexte organisationnel", "Équipements disponibles",
  "Contraintes déclarées", "Informations explicitement fournies", "Informations interprétées puis confirmées", "Informations inconnues",
  "Ambiguïtés résolues", "Contradictions restantes", "Questions adaptatives posées", "Justification de chaque question",
  "Réponses de l’utilisateur", "Conséquences de chaque réponse", "Scénario ou corpus principal retenu", "Corpus secondaires éventuellement mobilisés",
  "Niveau de couverture réel", "Éléments scientifiquement supportés", "Éléments non encore supportés", "Hypothèses de travail",
  "Conditions de refus ou de non-évaluabilité", "Options scientifiques discutées", "Décision humaine", "Alternative(s) non retenue(s)",
  "Limites", "Risques méthodologiques", "Controverses", "Knowledge Gaps", "Evidence Map", "Sources et versions",
  "Statut du démonstrateur", "Livrables disponibles", "Livrables non encore générables", "Historique synthétique de la session",
] as const;

const valuesFor = (session: ProtocolDesignerSession, field: typeof INTERPRETED_FIELD_KEYS[number]) => {
  const intent = session.validatedIntent;
  if (!intent) return [];
  const review = intent.reviews[field];
  if (review?.state === "REMOVED" || review?.state === "UNKNOWN" || review?.state === "NOT_RELEVANT") return [];
  const value = review?.state === "CORRECTED" ? review.correctedValue : intent.interpretation[field].value;
  return Array.isArray(value) ? value : value ? [String(value)] : [];
};
const list = (values: string[], fallback: string) => values.length ? values : [fallback];

export const canGenerateFinalReport = (session: ProtocolDesignerSession) => Boolean(
  session.validatedIntent?.confirmedAt && session.confirmedScenarioId && session.decision
  && session.validatedIntent.interpretation.contradictions.every((item) => session.validatedIntent?.contradictionResolutions[item] === "RESOLVED"),
);

export const generateContextualReport = (
  session: ProtocolDesignerSession,
  questions: AdaptiveQuestion[],
  requested: "PROVISIONAL" | "FINAL",
  now = new Date().toISOString(),
): ContextualReport => {
  const status = requested === "FINAL" && canGenerateFinalReport(session) ? "FINAL" : "PROVISIONAL";
  const scenario = session.confirmedScenarioId ? scenarioDetails(session.confirmedScenarioId) : undefined;
  const intent = session.validatedIntent;
  const unknown = intent ? INTERPRETED_FIELD_KEYS.flatMap((key) => valuesFor(session, key).length ? [] : [key]) : [...INTERPRETED_FIELD_KEYS];
  const questionMap = new Map(questions.map((question) => [question.questionId, question]));
  const answeredQuestions = session.adaptiveAnswers.map((answer) => questionMap.get(answer.questionId)).filter(Boolean) as AdaptiveQuestion[];
  const sectionsContent: string[][] = [
    [`Session ${session.sessionId}`, `Créée ${session.createdAt}`, `Schéma ${session.sessionSchemaVersion}`, `Rapport ${status}`],
    [session.originalQuestion || "Non fournie"], [intent?.validatedReformulation || "Non validée"],
    list(valuesFor(session, "userExpertise"), "Niveau non confirmé"), list(valuesFor(session, "clinicalContext"), "Contexte à confirmer"),
    list(valuesFor(session, "population"), "Population inconnue"), list(valuesFor(session, "interventionsOrGroups"), "Non précisés"),
    list(valuesFor(session, "scientificPurpose"), "Objectif à préciser"), list(valuesFor(session, "phenomenaOfInterest"), "Phénomène à clarifier"),
    list(valuesFor(session, "outcomesMentioned"), "Critères non déclarés"), list(valuesFor(session, "centers"), "Organisation non précisée"),
    list([...valuesFor(session, "availableEquipment"), ...valuesFor(session, "fieldStrengths"), ...valuesFor(session, "manufacturers"), ...valuesFor(session, "models")], "Équipements inconnus"),
    list(valuesFor(session, "constraints"), "Aucune contrainte confirmée"),
    intent ? INTERPRETED_FIELD_KEYS.flatMap((key) => intent.interpretation[key].origin === "EXPLICIT_USER_STATEMENT" ? valuesFor(session, key) : []) : ["Aucune"],
    intent ? INTERPRETED_FIELD_KEYS.flatMap((key) => ["NORMALIZED_FROM_USER_TERM", "TENTATIVE_INTERPRETATION"].includes(intent.interpretation[key].origin) && ["CONFIRMED", "CORRECTED"].includes(intent.reviews[key]?.state ?? "") ? valuesFor(session, key) : []) : ["Aucune"],
    unknown, Object.entries(intent?.ambiguityResolutions ?? {}).map(([key, value]) => `${key}: ${value}`), intent?.interpretation.contradictions ?? [],
    answeredQuestions.map((question) => question.label), answeredQuestions.map((question) => question.reason),
    session.adaptiveAnswers.map((answer) => `${answer.label} — ${answer.status}`), session.adaptiveAnswers.map((answer) => answer.consequence),
    [scenario ? `${scenario.title} — ${scenario.reasoningBook.id} v${scenario.reasoningBook.version}` : "Aucun scénario confirmé"],
    session.secondaryScenarioIds.map((id) => scenarioDetails(id)?.title ?? id),
    [scenario ? "Couverture locale bornée au corpus du démonstrateur." : "NO_SUPPORTED_MATCH"], scenario?.constructs ?? ["Aucun élément scientifique projeté"],
    ["Aucun protocole, timing, seuil ou paramètre constructeur n’est exécutable dans cette version."], scenario?.hypotheses ?? ["Aucune hypothèse locale mobilisée"],
    [...(scenario?.limitations ?? []), ...(intent?.interpretation.contradictions ?? [])], scenario?.strategies.map((item) => `${item.title}: ${item.benefit}`) ?? ["Aucune option"],
    session.decision ? [`${session.decision.outcome} — ${session.decision.author} — ${session.decision.justification}`] : ["Aucune décision finale"],
    scenario?.strategies.slice(1).map((item) => item.title) ?? ["Aucune alternative documentée"], scenario?.limitations ?? ["Couverture scientifique absente"],
    scenario ? ["Les dépendances techniques et la comparabilité doivent être vérifiées par un expert."] : ["Orientation non établie"],
    scenario ? [scenario.controversy] : ["Aucune controverse projetée"], list(intent?.interpretation.missingInformation ?? [], "Aucun gap enregistré"),
    scenario?.evidence.map((item) => `${item.label} — ${item.locator} — ${item.relation}`) ?? ["Aucune preuve mobilisée"],
    scenario ? [`${scenario.program.id} v${scenario.program.version}`, `${scenario.reasoningBook.id} v${scenario.reasoningBook.version}`, `Connaissances au ${scenario.knowledgeDate}`] : ["Aucune source locale mobilisée"],
    ["Projection de démonstration — ni validation scientifique, ni avis médical, ni PASS PD-011."],
    ["Dossier de raisonnement scientifique"],
    ["Protocole d’acquisition: NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE", "Financement: STRUCTURE_ONLY", "Publication: STRUCTURE_ONLY"],
    [`Création ${session.createdAt}`, ...session.invalidatedDownstream.map((item) => `Invalidation: ${item}`), `Génération ${now}`],
  ];
  const sections = REPORT_SECTION_TITLES.map((title, index) => ({
    number: index + 1, title,
    status: sectionsContent[index]?.length && !sectionsContent[index].every((item) => /^(Non |Aucun|Aucune|NO_|NOT_)/.test(item)) ? "Disponible" as const : "À confirmer" as const,
    content: sectionsContent[index]?.length ? sectionsContent[index] : ["Aucune information disponible — absence conservée explicitement."],
  }));
  const deliverables: ContextualDeliverable[] = [
    { title: "Dossier de raisonnement scientifique", status: status === "FINAL" ? "GENERATED" : "PROVISIONAL", available: ["Question, contexte, orientation, décision et traçabilité"], missing: unknown, sources: scenario ? [scenario.reasoningBook.id] : [], limits: ["Projection de démonstration"] },
    { title: "Proposition de protocole d’acquisition", status: "NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE", available: [], missing: ["Règles exécutables validées", "Revue experte"], sources: [], limits: ["Aucun paramètre, séquence ou timing inventé"] },
    { title: "Partie imagerie — demande de financement", status: "STRUCTURE_ONLY", available: ["Contexte et phénomènes validés"], missing: ["Organisation, ressources et règles exécutables"], sources: scenario ? [scenario.reasoningBook.id] : [], limits: ["Brouillon non prêt à soumission"] },
    { title: "Partie imagerie — publication scientifique", status: "STRUCTURE_ONLY", available: ["Structure Méthodes"], missing: ["Acquisition, analyse, QA et données validées"], sources: scenario ? [scenario.reasoningBook.id] : [], limits: ["Aucun résultat ni méthode inventés"] },
  ];
  return { title: status === "FINAL" ? "Dossier de session scientifique" : "RAPPORT_PROVISOIRE — RAISONNEMENT INCOMPLET", status, generatedAt: now, sections, deliverables };
};

export const reportToMarkdown = (report: ContextualReport) => [
  `# ${report.title}`, "", `Statut : ${report.status}`, `Généré : ${report.generatedAt}`, "",
  ...report.sections.flatMap((section) => [`## ${section.number}. ${section.title}`, "", `État : ${section.status}`, "", ...section.content.map((item) => `- ${item}`), ""]),
  "## Livrables", "", ...report.deliverables.flatMap((item) => [`### ${item.title}`, "", `Statut : ${item.status}`, ...item.available.map((value) => `- Disponible : ${value}`), ...item.missing.map((value) => `- Manquant : ${value}`), ...item.limits.map((value) => `- Limite : ${value}`), ""]),
].join("\n");
