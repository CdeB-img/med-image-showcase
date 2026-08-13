import { SEMANTIC_CRITIC_CHECKS, type ScientificSemanticProvider, type SemanticConversationMessage, type SemanticCriticResult, type SemanticReconstructionCandidate, type SemanticReconstructionRequest } from "../types";

export const makeSemanticRequest = (messages: SemanticConversationMessage[] = [{ messageId: "user-1", role: "USER", content: "Je veux comparer CT et IRM cardiaque.", createdAt: "2026-08-11T10:00:00.000Z" }], previousModel: SemanticReconstructionRequest["previousModel"] = null): SemanticReconstructionRequest => ({
  schemaVersion: "SEM-001-1.1",
  sessionId: "semantic-session-test",
  language: "fr",
  messages,
  previousModel,
});

export const comparisonCandidate = (): SemanticReconstructionCandidate => ({
  candidateId: "candidate-1",
  language: "fr",
  normalizedMeaning: "Comparer le CT et l’IRM dans un contexte cardiaque.",
  summaryForUser: "Je comprends que vous souhaitez comparer le CT et l’IRM cardiaque. Le critère de comparaison reste à préciser.",
  semanticInventory: {
    explicitFragments: [
      { inventoryItemId: "i-operation", sourceMessageId: "user-1", sourceText: "comparer", normalizedLabel: "comparer", localRole: "operation", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-ct", "i-mri"] },
      { inventoryItemId: "i-ct", sourceMessageId: "user-1", sourceText: "CT", normalizedLabel: "CT", localRole: "comparison endpoint", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-mri"] },
      { inventoryItemId: "i-mri", sourceMessageId: "user-1", sourceText: "IRM", normalizedLabel: "IRM", localRole: "comparison endpoint", polarity: "AFFIRMED", modifiers: ["cardiaque"], linkedInventoryItemIds: ["i-ct"] },
      { inventoryItemId: "i-context", sourceMessageId: "user-1", sourceText: "cardiaque", normalizedLabel: "contexte cardiaque", localRole: "anatomical context", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-mri"] },
    ],
    explicitRelations: [{ inventoryRelationId: "ir-compare", sourceInventoryItemId: "i-ct", targetInventoryItemId: "i-mri", sourceMessageId: "user-1", sourceText: "comparer CT et IRM", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" }],
  },
  elements: [
    { clientElementId: "e-operation", type: "OPERATION", canonicalMeaning: "comparer", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["i-operation"], sourceMessageId: "user-1", sourceText: "comparer", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-ct", type: "MODALITY", canonicalMeaning: "CT", studyRole: "SUBJECT", polarity: "AFFIRMED", inventoryItemIds: ["i-ct"], sourceMessageId: "user-1", sourceText: "CT", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-mri", type: "MODALITY", canonicalMeaning: "IRM", studyRole: "COMPARATOR_ARM", polarity: "AFFIRMED", inventoryItemIds: ["i-mri"], sourceMessageId: "user-1", sourceText: "IRM", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-context", type: "ANATOMICAL_CONTEXT", canonicalMeaning: "contexte cardiaque", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["i-context"], sourceMessageId: "user-1", sourceText: "cardiaque", epistemicStatus: "EXPLICIT_USER_STATED", confidence: .99, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-criterion", type: "MISSING_CONCEPT", canonicalMeaning: "critère de comparaison", studyRole: "NONE", polarity: "UNCERTAIN", inventoryItemIds: [], sourceMessageId: null, sourceText: null, epistemicStatus: "INFERRED_HIGH_CONFIDENCE", confidence: .96, inferenceReason: "Le mot comparer ne précise pas la dimension évaluée.", requiresConfirmation: true, supersedesElementIds: [] },
  ],
  relations: [{ clientRelationId: "r-compare", sourceClientElementId: "e-ct", targetClientElementId: "e-mri", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: ["ir-compare"], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false }],
  missingConcepts: ["critère de comparaison"],
  ellipses: [],
  ambiguities: ["La dimension de comparaison n’est pas précisée."],
  unknowns: ["critère de comparaison"],
  contradictions: [],
  knowledgeRequests: [],
  clarificationCandidates: [{ question: "Sur quel critère souhaitez-vous comparer le CT et l’IRM ?", reason: "Le critère change la question scientifique.", resolvesClientElementIds: ["e-criterion"] }],
  routeProposal: { route: "FORMALIZE_IDEA", confidence: .9, reason: "La comparaison est explicite mais son critère reste ouvert.", expectedCapabilities: ["SCIENTIFIC_THINKING"] },
  semanticWarnings: [],
});

export const acceptedCritic = (_candidate = comparisonCandidate()): SemanticCriticResult => ({
  criticId: "critic-1",
  verdict: "ACCEPT",
  checklist: SEMANTIC_CRITIC_CHECKS.map((check) => ({ check, result: "PASS", evidence: "Synthetic fixture covers this contract." })),
  missingExplicitSourceFragments: [],
  issues: [],
  proposedRepairs: [],
  criticSummary: "Les modalités et leur relation sont conservées ; l’ambiguïté reste visible.",
});

export class FakeSemanticProvider implements ScientificSemanticProvider {
  metadata = { provider: "TEST_PROVIDER", model: "semantic-test-model", temperature: 0 };
  calls: string[] = [];
  constructor(public candidate = comparisonCandidate(), public critic = acceptedCritic(candidate), private readonly failure: "NONE" | "RECONSTRUCT" | "CRITIC" = "NONE") {}
  async reconstruct() {
    this.calls.push("RECONSTRUCT");
    if (this.failure === "RECONSTRUCT") throw new Error("provider unavailable");
    return { callId: "reconstruction-call", candidate: this.candidate };
  }
  async critique() {
    this.calls.push("CRITIC");
    if (this.failure === "CRITIC") throw new Error("critic unavailable");
    return { callId: "critic-call", critic: this.critic };
  }
}
