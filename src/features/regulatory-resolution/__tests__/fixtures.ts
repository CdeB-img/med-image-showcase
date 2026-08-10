import { createHumanDecisionCandidate, engageHumanDecision, type HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import { candidateFact, createRegulatoryResolutionInput, knownFact, unknownFact } from "../input";
import type { RegulatoryQualification, RegulatoryResolutionInput } from "../types";

export const PROJECT_PROVENANCE = ["research-project:test:v1", "user-declaration:test"];

export const makeDecision = (decisionId: string, target: string): HumanDecisionEnvelope => engageHumanDecision(createHumanDecisionCandidate({
  decisionId,
  gateId: `gate:${decisionId}`,
  scope: [target],
  targets: [target],
  reason: "Qualification humaine explicite pour le scénario de test REG-001.",
  provenance: PROJECT_PROVENANCE,
  engineSource: "RESEARCH_PROJECT",
  projectVersion: "project-version:test:v1",
}), {
  status: "ADOPTED",
  actor: "Expert réglementaire de test",
  mandate: "mandate:reg-001:test",
  reason: "Qualification humaine explicite pour le scénario de test REG-001.",
  timestamp: "2026-08-10T10:00:00.000Z",
});

export const makePendingDecision = (decisionId: string, target: string) => createHumanDecisionCandidate({
  decisionId,
  gateId: `gate:${decisionId}`,
  scope: [target],
  targets: [target],
  reason: "Décision réglementaire candidate à instruire.",
  provenance: PROJECT_PROVENANCE,
  engineSource: "RESEARCH_PROJECT",
  projectVersion: "project-version:test:v1",
});

export const confirmedQualification = (qualificationId: string, decision: HumanDecisionEnvelope): RegulatoryQualification => ({
  qualificationId,
  state: "HUMAN_CONFIRMED",
  decisionId: decision.decisionId,
  provenance: [...decision.provenance, `decision:${decision.decisionId}`],
});

export const makeBaseInput = (overrides: Partial<RegulatoryResolutionInput> = {}): RegulatoryResolutionInput => {
  const base = createRegulatoryResolutionInput({
    researchProjectId: "research-project:test",
    researchProjectVersion: "project-version:test:v1",
    researchProjectDigest: "project-digest:test:v1",
    resolutionAsOf: "2026-08-10T12:00:00.000Z",
    jurisdiction: knownFact(["FR"], "Juridiction française explicitement déclarée.", PROJECT_PROVENANCE),
    projectCharacteristics: {
      humanHealthResearch: knownFact(false, "Le scénario de base est explicitement hors recherche impliquant des personnes.", PROJECT_PROVENANCE),
      projectNatures: knownFact(["HEALTH_RESEARCH"], "Nature déclarée.", PROJECT_PROVENANCE),
      intendedDocuments: knownFact([], "Aucun livrable documentaire n’est demandé dans le scénario de base.", PROJECT_PROVENANCE),
      explicitlyIncorporatedGuidance: knownFact([], "Aucun guide n’est incorporé comme obligation.", PROJECT_PROVENANCE),
    },
    studyDesignCharacteristics: {
      interventionModel: knownFact("OBSERVATIONAL", "Design observationnel déclaré.", PROJECT_PROVENANCE),
      temporalDirection: knownFact("RETROSPECTIVE", "Direction rétrospective déclarée.", PROJECT_PROVENANCE),
      randomised: knownFact(false, "Aucune randomisation déclarée.", PROJECT_PROVENANCE),
      registryBased: knownFact(false, "Aucun registre déclaré.", PROJECT_PROVENANCE),
      reportTypes: knownFact([], "Aucun type de rapport déclaré.", PROJECT_PROVENANCE),
    },
    interventionCharacteristics: {
      interventionPresent: knownFact(false, "Absence d’intervention explicitement déclarée.", PROJECT_PROVENANCE),
      medicinalProductTrial: knownFact(false, "Aucun essai de médicament déclaré.", PROJECT_PROVENANCE),
      medicalDeviceStudy: knownFact(false, "Aucune étude de dispositif déclarée.", PROJECT_PROVENANCE),
    },
    productCharacteristics: { productTypes: knownFact(["NO_HEALTH_PRODUCT_IDENTIFIED"], "Aucun produit de santé identifié.", PROJECT_PROVENANCE) },
    dataCharacteristics: {
      personalHealthData: knownFact(false, "Aucune donnée personnelle de santé dans le scénario de base.", PROJECT_PROVENANCE),
      existingData: knownFact(true, "Données existantes déclarées.", PROJECT_PROVENANCE),
      prospectiveCollection: knownFact(false, "Aucun recueil prospectif déclaré.", PROJECT_PROVENANCE),
      routinelyCollectedHealthData: knownFact(false, "Aucune donnée courante déclarée.", PROJECT_PROVENANCE),
      sources: knownFact(["EXISTING_DATA"], "Source de données déclarée.", PROJECT_PROVENANCE),
      transferOutsideEea: knownFact(false, "Aucun transfert hors EEE déclaré.", PROJECT_PROVENANCE),
    },
    biologicalSampleCharacteristics: { samplesPresent: knownFact(false, "Absence d’échantillons explicitement déclarée.", PROJECT_PROVENANCE) },
    multicenterCharacteristics: { multicenter: knownFact(false, "Projet monocentrique déclaré.", PROJECT_PROVENANCE), centerCount: knownFact(1, "Un centre déclaré.", PROJECT_PROVENANCE) },
    internationalCharacteristics: {
      international: knownFact(false, "Projet national déclaré.", PROJECT_PROVENANCE),
      centerJurisdictions: knownFact(["FR"], "Le centre est français.", PROJECT_PROVENANCE),
      crossCountryRequirementDiscoveryNeeded: knownFact(false, "Aucune comparaison internationale demandée.", PROJECT_PROVENANCE),
    },
    fundingProgramCandidates: knownFact([], "Aucun programme de financement identifié.", PROJECT_PROVENANCE),
    fundingProgramEditionCandidates: knownFact([], "Aucune édition de financement identifiée.", PROJECT_PROVENANCE),
    knownRegulatoryQualifications: [],
    unknowns: [],
    contradictions: [],
    humanDecisions: [],
    provenance: PROJECT_PROVENANCE,
  });
  return createRegulatoryResolutionInput({ ...base, ...overrides });
};

export const retrospectiveHealthDataInput = () => {
  const base = makeBaseInput();
  return makeBaseInput({
    projectCharacteristics: { ...base.projectCharacteristics, humanHealthResearch: unknownFact("Le champ juridique RIPH n’est pas qualifié.", PROJECT_PROVENANCE) },
    dataCharacteristics: { ...base.dataCharacteristics, personalHealthData: knownFact(true, "Des données personnelles de santé existantes sont traitées.", PROJECT_PROVENANCE), existingData: knownFact(true, "Données existantes.", PROJECT_PROVENANCE) },
    unknowns: [{ unknownId: "unknown:riph-scope", field: "projectCharacteristics.humanHealthResearch", reason: "Le champ RIPH doit être qualifié sans être inféré du design rétrospectif.", provenance: PROJECT_PROVENANCE }],
  });
};

export const phrcStage2Input = () => {
  const base = makeBaseInput();
  return makeBaseInput({
    resolutionAsOf: "2026-01-15T12:00:00.000Z",
    fundingProgramCandidates: knownFact([{ programId: "FUND_PHRC_N", state: "EXPLICITLY_IDENTIFIED", provenance: PROJECT_PROVENANCE }], "PHRC-N explicitement identifié.", PROJECT_PROVENANCE),
    fundingProgramEditionCandidates: knownFact([{
      programId: "FUND_PHRC_N", editionId: "ED_PHRC_2025_2026", stage: knownFact("COMPLETE_DOSSIER", "Stade 2 déclaré.", PROJECT_PROVENANCE),
      selectedAfterPriorStage: knownFact(true, "Sélection après stade 1 explicitement déclarée.", PROJECT_PROVENANCE), state: "EXPLICITLY_IDENTIFIED", provenance: PROJECT_PROVENANCE,
    }], "Édition et stade PHRC explicitement identifiés.", PROJECT_PROVENANCE),
  });
};

export const candidatePhilanthropicInput = () => {
  const base = makeBaseInput();
  return makeBaseInput({ fundingProgramCandidates: candidateFact([{ programId: "FUND_UNKNOWN", state: "CANDIDATE", provenance: PROJECT_PROVENANCE }], "Programme candidat non qualifié.", PROJECT_PROVENANCE), fundingProgramEditionCandidates: unknownFact("Édition non identifiée.", PROJECT_PROVENANCE) });
};
