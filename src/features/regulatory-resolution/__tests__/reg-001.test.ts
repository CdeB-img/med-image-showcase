import { stableStringify, logicalDigest } from "@/features/knowledge-engine/canonical";
import { createHumanDecisionCandidate } from "@/features/protocol-designer/human-decision";
import { REG000_CORPUS, REG000_CORPUS_DIGEST, resolveRegulatoryRequirements, knownFact, unknownFact, type RegulatoryCorpusSnapshot, type RegulatoryResolutionResult } from "..";
import { confirmedQualification, makeBaseInput, makeDecision, makePendingDecision, phrcStage2Input, PROJECT_PROVENANCE, retrospectiveHealthDataInput } from "./fixtures";

const all = (result: RegulatoryResolutionResult) => [...result.applicableRequirements, ...result.potentiallyApplicableRequirements, ...result.notApplicableRequirements, ...result.unresolvedRequirements];
const requirement = (result: RegulatoryResolutionResult, id: string) => all(result).find((item) => item.requirementId === id)!;
const cloneCorpus = () => structuredClone(REG000_CORPUS) as RegulatoryCorpusSnapshot;
const inputForCorpus = (input: ReturnType<typeof makeBaseInput>, corpus: RegulatoryCorpusSnapshot) => ({ ...input, regulatoryCorpusVersion: corpus.corpus.version, regulatoryCorpusDigest: logicalDigest(corpus) });

describe("REG-001 — Regulatory Requirement Resolution Engine", () => {
  it("est déterministe et produit le même Requirement Set pour le même projet et le même corpus", () => {
    const input = phrcStage2Input();
    const first = resolveRegulatoryRequirements(input);
    const second = resolveRegulatoryRequirements(input);
    expect(first.resolutionId).toBe(second.resolutionId);
    expect(first.resolvedAt).toBe(input.resolutionAsOf);
    expect(stableStringify(all(first).map((item) => [item.requirementId, item.status]))).toBe(stableStringify(all(second).map((item) => [item.requirementId, item.status])));
  });

  it("préserve le projet et REG-000 sans mutation", () => {
    const input = retrospectiveHealthDataInput();
    const projectBefore = stableStringify(input);
    const corpusBefore = stableStringify(REG000_CORPUS);
    resolveRegulatoryRequirements(input);
    expect(stableStringify(input)).toBe(projectBefore);
    expect(stableStringify(REG000_CORPUS)).toBe(corpusBefore);
    expect(input.regulatoryCorpusDigest).toBe(REG000_CORPUS_DIGEST);
  });

  it("CAS A — conserve les unknowns d’un projet français rétrospectif sans inventer RIPH ou MR", () => {
    const result = resolveRegulatoryRequirements(retrospectiveHealthDataInput());
    expect(requirement(result, "REQ_FR_RIPH_CLASSIFICATION").status).toBe("UNKNOWN_MISSING_INFORMATION");
    expect(requirement(result, "REQ_CNIL_MR_ROUTE").status).toBe("UNKNOWN_REQUIRES_QUALIFICATION");
    expect(result.requiredQualifications.some((item) => item.reason.includes("CNIL/MR"))).toBe(true);
    expect(result.requiredQualifications.every((item) => !["RIPH_1", "RIPH_2", "RIPH_3", "MR_001_SCOPE", "MR_003_SCOPE"].includes(item.qualificationId))).toBe(true);
  });

  it("CAS B — sépare la route CTIS d’une autorisation ANSM RIPH 1", () => {
    const base = makeBaseInput();
    const ctrDecision = makeDecision("decision:ctr-scope", "EU_CTR_536_2014_SCOPE");
    const input = makeBaseInput({
      jurisdiction: knownFact(["FR", "EU_EEA"], "France et UE/EEE explicitement déclarées.", PROJECT_PROVENANCE),
      projectCharacteristics: { ...base.projectCharacteristics, humanHealthResearch: knownFact(true, "Recherche humaine déclarée.", PROJECT_PROVENANCE) },
      studyDesignCharacteristics: { ...base.studyDesignCharacteristics, interventionModel: knownFact("INTERVENTIONAL", "Interventionnel déclaré.", PROJECT_PROVENANCE) },
      interventionCharacteristics: { interventionPresent: knownFact(true, "Intervention déclarée.", PROJECT_PROVENANCE), medicinalProductTrial: knownFact(true, "Essai de médicament déclaré.", PROJECT_PROVENANCE), medicalDeviceStudy: knownFact(false, "Pas de dispositif.", PROJECT_PROVENANCE) },
      productCharacteristics: { productTypes: knownFact(["MEDICINAL_PRODUCT"], "Médicament déclaré.", PROJECT_PROVENANCE) },
      knownRegulatoryQualifications: [confirmedQualification("EU_CTR_536_2014_SCOPE", ctrDecision)], humanDecisions: [ctrDecision],
    });
    const result = resolveRegulatoryRequirements(input);
    expect(requirement(result, "REQ_EU_CTR_CTIS").status).toBe("APPLICABLE");
    expect(requirement(result, "REQ_EU_CTR_APPLICATION_DOSSIER").status).toBe("APPLICABLE");
    expect(requirement(result, "REQ_FR_ANSM_RIPH1_AUTHORIZATION").status).toBe("NOT_APPLICABLE");
    expect(result.approvalRequirements.some((item) => item.approvalRequirementId === "APR_CTR_MEMBER_STATE")).toBe(true);
    expect(result.approvalRequirements.some((item) => item.approvalRequirementId === "APR_ANSM_RIPH1")).toBe(false);
  });

  it("CAS C — une étude de dispositif n’hérite d’aucune règle médicament", () => {
    const base = makeBaseInput();
    const input = makeBaseInput({
      jurisdiction: knownFact(["FR", "EU_EEA"], "Juridictions déclarées.", PROJECT_PROVENANCE),
      studyDesignCharacteristics: { ...base.studyDesignCharacteristics, interventionModel: knownFact("INTERVENTIONAL", "Interventionnel.", PROJECT_PROVENANCE) },
      interventionCharacteristics: { interventionPresent: knownFact(true, "Intervention présente.", PROJECT_PROVENANCE), medicinalProductTrial: knownFact(false, "Ce n’est pas un essai de médicament.", PROJECT_PROVENANCE), medicalDeviceStudy: knownFact(true, "Étude de dispositif déclarée.", PROJECT_PROVENANCE) },
      productCharacteristics: { productTypes: knownFact(["MEDICAL_DEVICE"], "Dispositif médical déclaré.", PROJECT_PROVENANCE) },
    });
    const result = resolveRegulatoryRequirements(input);
    expect(requirement(result, "REQ_EU_CTR_CTIS").status).toBe("NOT_APPLICABLE");
    expect(requirement(result, "REQ_EU_CTR_APPLICATION_DOSSIER").status).toBe("NOT_APPLICABLE");
    expect(result.applicableRequirements.filter((item) => item.requirementId.startsWith("REQ_EU_CTR"))).toEqual([]);
  });

  it("CAS D — applique uniquement le stade 2 de l’édition PHRC explicitement connue", () => {
    const result = resolveRegulatoryRequirements(phrcStage2Input());
    expect(requirement(result, "REQ_PHRC_STAGE1").status).toBe("OUTSIDE_EFFECTIVE_PERIOD");
    expect(requirement(result, "REQ_PHRC_STAGE2").status).toBe("APPLICABLE");
    const funding = result.fundingRequirements.find((item) => item.requirementId === "REQ_PHRC_STAGE2")!;
    expect(funding).toMatchObject({ programId: "FUND_PHRC_N", editionId: "ED_PHRC_2025_2026" });
    expect(funding.documents).toContain("DOC_RESEARCH_PROTOCOL");
    expect(funding.deadlines).toEqual(["2026-06-16T20:00:00+02:00"]);
    expect(funding.submissionWorkflow).toEqual(["INNOVARC_STAGE2"]);
    expect(result.fundingRequirements.some((item) => item.requirementId === "REQ_RHU_V6_COMPLETE_DOSSIER")).toBe(false);
  });

  it("projette le protocole PHRC comme non applicable au seul stade 1 encodé", () => {
    const input = makeBaseInput({
      resolutionAsOf: "2025-10-01T12:00:00.000Z",
      fundingProgramCandidates: knownFact([{ programId: "FUND_PHRC_N", state: "EXPLICITLY_IDENTIFIED", provenance: PROJECT_PROVENANCE }], "PHRC-N identifié.", PROJECT_PROVENANCE),
      fundingProgramEditionCandidates: knownFact([{ programId: "FUND_PHRC_N", editionId: "ED_PHRC_2025_2026", stage: knownFact("LETTER_OF_INTENT", "Stade 1 déclaré.", PROJECT_PROVENANCE), selectedAfterPriorStage: knownFact(false, "Aucun stade préalable.", PROJECT_PROVENANCE), state: "EXPLICITLY_IDENTIFIED", provenance: PROJECT_PROVENANCE }], "Édition PHRC et stade 1 identifiés.", PROJECT_PROVENANCE),
    });
    const result = resolveRegulatoryRequirements(input);
    expect(requirement(result, "REQ_PHRC_STAGE1").status).toBe("APPLICABLE");
    expect(result.documentRequirements).toContainEqual(expect.objectContaining({ documentRequirementId: "DOCREQ_PHRC_STAGE1_PROTOCOL", documentId: "DOC_RESEARCH_PROTOCOL", requirementId: "REQ_PHRC_STAGE1", status: "NOT_APPLICABLE" }));
  });

  it("CAS E — distingue RHU V6 du PHRC et conserve la provenance ANR", () => {
    const input = makeBaseInput({
      resolutionAsOf: "2023-03-01T12:00:00.000Z",
      fundingProgramCandidates: knownFact([{ programId: "FUND_RHU", state: "EXPLICITLY_IDENTIFIED", provenance: PROJECT_PROVENANCE }], "RHU identifié.", PROJECT_PROVENANCE),
      fundingProgramEditionCandidates: knownFact([{ programId: "FUND_RHU", editionId: "ED_RHU_V6_2023", stage: knownFact("COMPLETE_DOSSIER", "Dossier complet.", PROJECT_PROVENANCE), selectedAfterPriorStage: knownFact(false, "Pas de stade préalable requis.", PROJECT_PROVENANCE), state: "EXPLICITLY_IDENTIFIED", provenance: PROJECT_PROVENANCE }], "RHU V6 identifié.", PROJECT_PROVENANCE),
    });
    const result = resolveRegulatoryRequirements(input);
    expect(requirement(result, "REQ_RHU_V6_COMPLETE_DOSSIER").status).toBe("APPLICABLE");
    expect(requirement(result, "REQ_RHU_V6_ANNEXES").status).toBe("APPLICABLE");
    expect(result.fundingRequirements.filter((item) => item.programId === "FUND_RHU")).toHaveLength(2);
    expect(result.fundingRequirements.flatMap((item) => item.sourceIds)).toContain("SRC_ANR_RHU_V6_2023");
    expect(result.fundingRequirements.some((item) => item.programId === "FUND_PHRC_N")).toBe(false);
  });

  it("CAS F — exige une qualification privacy et ne choisit aucune MR", () => {
    const base = makeBaseInput();
    const input = makeBaseInput({ dataCharacteristics: { ...base.dataCharacteristics, personalHealthData: knownFact(true, "Données personnelles de santé déclarées.", PROJECT_PROVENANCE) } });
    const result = resolveRegulatoryRequirements(input);
    expect(requirement(result, "REQ_CNIL_MR_ROUTE").status).toBe("UNKNOWN_REQUIRES_QUALIFICATION");
    expect(result.humanReviewRequirements.some((item) => item.kind === "REGULATORY_QUALIFICATION" && item.status === "PENDING")).toBe(true);
    expect(result.requiredQualifications.every((item) => item.status !== "HUMAN_CONFIRMED")).toBe(true);
    expect(result.requiredQualifications.map((item) => item.qualificationId)).not.toEqual(expect.arrayContaining(["MR_001_SCOPE", "MR_003_SCOPE"]));
  });

  it("CAS G — sépare les juridictions d’un projet multicentrique international", () => {
    const base = makeBaseInput();
    const input = makeBaseInput({
      jurisdiction: knownFact(["INTERNATIONAL", "EU_EEA"], "Cadre international et UE/EEE déclaré.", PROJECT_PROVENANCE),
      multicenterCharacteristics: { multicenter: knownFact(true, "Multicentrique.", PROJECT_PROVENANCE), centerCount: knownFact(3, "Trois centres.", PROJECT_PROVENANCE) },
      internationalCharacteristics: { international: knownFact(true, "International.", PROJECT_PROVENANCE), centerJurisdictions: knownFact(["FR", "US", "EU_EEA"], "Juridictions des centres explicites.", PROJECT_PROVENANCE), crossCountryRequirementDiscoveryNeeded: knownFact(true, "Comparaison nationale nécessaire.", PROJECT_PROVENANCE) },
      projectCharacteristics: { ...base.projectCharacteristics, humanHealthResearch: knownFact(false, "Hors champ RIPH explicitement confirmé pour ce scénario.", PROJECT_PROVENANCE) },
    });
    const result = resolveRegulatoryRequirements(input);
    const french = requirement(result, "REQ_FR_RIPH_CLASSIFICATION");
    expect(french.applicableJurisdictions).toEqual(["FR"]);
    expect(french.excludedJurisdictions).toEqual(expect.arrayContaining(["US", "EU_EEA"]));
    expect(french.status).toBe("NOT_APPLICABLE");
    expect(requirement(result, "REQ_US_ACT_REGISTRATION_RESULTS").applicableJurisdictions).toEqual(["US"]);
  });

  it("CAS H — une donnée structurante absente reste UNKNOWN_MISSING_INFORMATION", () => {
    const base = makeBaseInput();
    const input = makeBaseInput({ dataCharacteristics: { ...base.dataCharacteristics, personalHealthData: unknownFact("Le traitement de données personnelles de santé n’est pas renseigné.", PROJECT_PROVENANCE) } });
    const result = resolveRegulatoryRequirements(input);
    expect(requirement(result, "REQ_CNIL_MR_ROUTE").status).toBe("UNKNOWN_MISSING_INFORMATION");
    expect(requirement(result, "REQ_CNIL_MR_ROUTE").status).not.toBe("NOT_APPLICABLE");
    expect(result.missingInformation.some((item) => item.blockedRequirementIds.includes("REQ_CNIL_MR_ROUTE"))).toBe(true);
  });

  it("CAS I — conserve SUPERSEDED et la référence vers la Requirement courante", () => {
    const corpus = cloneCorpus();
    corpus.requirements.push({ ...corpus.requirements[0], identifier: "REQ_SYNTHETIC_SUPERSEDED", title: "Synthetic superseded requirement", status: "SUPERSEDED", supersededBy: ["REQ_FR_RIPH_CLASSIFICATION"], conditions: [] });
    const result = resolveRegulatoryRequirements(inputForCorpus(makeBaseInput(), corpus), corpus);
    const superseded = requirement(result, "REQ_SYNTHETIC_SUPERSEDED");
    expect(superseded.status).toBe("SUPERSEDED");
    expect(superseded.supersededBy).toEqual(["REQ_FR_RIPH_CLASSIFICATION"]);
  });

  it("CAS J — expose deux Requirements incompatibles sans arbitrage", () => {
    const corpus = cloneCorpus();
    const seed = corpus.requirements[0];
    corpus.requirements.push({ ...seed, identifier: "REQ_SYNTHETIC_A", title: "Synthetic A", conditions: [] }, { ...seed, identifier: "REQ_SYNTHETIC_B", title: "Synthetic B", conditions: [] });
    corpus.applicabilityRules.push({ ruleId: "AR_SYNTHETIC_CONFLICT", title: "Synthetic conflict", axes: {}, relations: { appliesIf: [], doesNotApplyIf: [], requires: ["REQ_SYNTHETIC_A"], dependsOn: [], conflictsWith: ["REQ_SYNTHETIC_B"], supersedes: [], jurisdiction: ["FR"], effectivePeriod: ["2022-07-31/OPEN"] }, unknownResult: "UNKNOWN_REQUIRES_QUALIFICATION" });
    const result = resolveRegulatoryRequirements(inputForCorpus(makeBaseInput(), corpus), corpus);
    expect(requirement(result, "REQ_SYNTHETIC_A").status).toBe("CONFLICTING_REQUIREMENTS");
    expect(requirement(result, "REQ_SYNTHETIC_B").status).toBe("CONFLICTING_REQUIREMENTS");
    expect(result.contradictions.some((item) => item.requirementIds.includes("REQ_SYNTHETIC_A") && item.requirementIds.includes("REQ_SYNTHETIC_B"))).toBe(true);
  });

  it("évalue appliesIf et doesNotApplyIf sans transformer l’absence en false", () => {
    const human = makeDecision("decision:riph1", "RIPH_1");
    const base = makeBaseInput();
    const applicable = resolveRegulatoryRequirements(makeBaseInput({ projectCharacteristics: { ...base.projectCharacteristics, humanHealthResearch: knownFact(true, "Champ humain confirmé.", PROJECT_PROVENANCE) }, knownRegulatoryQualifications: [confirmedQualification("RIPH_1", human)], humanDecisions: [human] }));
    expect(requirement(applicable, "REQ_FR_RIPH_CLASSIFICATION").status).toBe("APPLICABLE");
    expect(requirement(applicable, "REQ_FR_CPP_OPINION").status).toBe("APPLICABLE");
    const outside = resolveRegulatoryRequirements(makeBaseInput());
    expect(requirement(outside, "REQ_FR_RIPH_CLASSIFICATION").checks).toContainEqual(expect.objectContaining({ check: "DOES_NOT_APPLY_IF", reference: "OUTSIDE_RIPH_SCOPE_CONFIRMED", outcome: "SATISFIED" }));
  });

  it("propage une dépendance explicite vers un statut non résolu", () => {
    const corpus = cloneCorpus();
    const seed = corpus.requirements[0];
    corpus.requirements.push(
      { ...seed, identifier: "REQ_DEPENDENCY_BASE", title: "Future base", conditions: [], effectiveFrom: "2030-01-01" },
      { ...seed, identifier: "REQ_DEPENDENCY_CHILD", title: "Dependent child", conditions: [] },
    );
    corpus.applicabilityRules.push({ ruleId: "AR_DEPENDENCY", title: "Explicit dependency", axes: {}, relations: { appliesIf: [], doesNotApplyIf: [], requires: ["REQ_DEPENDENCY_CHILD"], dependsOn: ["REQ_DEPENDENCY_BASE"], conflictsWith: [], supersedes: [], jurisdiction: ["FR"], effectivePeriod: ["2022-07-31/OPEN"] }, unknownResult: "UNKNOWN_REQUIRES_QUALIFICATION" });
    const result = resolveRegulatoryRequirements(inputForCorpus(makeBaseInput(), corpus), corpus);
    expect(requirement(result, "REQ_DEPENDENCY_BASE").status).toBe("OUTSIDE_EFFECTIVE_PERIOD");
    expect(requirement(result, "REQ_DEPENDENCY_CHILD").status).toBe("UNKNOWN_MISSING_INFORMATION");
    expect(requirement(result, "REQ_DEPENDENCY_CHILD").checks).toContainEqual(expect.objectContaining({ check: "DEPENDS_ON", reference: "REQ_DEPENDENCY_BASE", outcome: "NOT_SATISFIED" }));
  });

  it("sépare les obligations réglementaires des guides méthodologiques et de reporting", () => {
    const base = makeBaseInput();
    const input = makeBaseInput({ projectCharacteristics: { ...base.projectCharacteristics, intendedDocuments: knownFact(["RESULTS_REPORT"], "Rapport de résultats prévu.", PROJECT_PROVENANCE) } });
    const result = resolveRegulatoryRequirements(input);
    expect(result.reportingGuidance.some((item) => item.requirementId === "REQ_STROBE" && item.status === "APPLICABLE")).toBe(true);
    expect(result.regulatoryMandatoryRequirements.some((item) => item.requirementId === "REQ_STROBE")).toBe(false);
    expect(result.methodologicalGuidance.every((item) => item.guidanceKind === "METHODOLOGICAL_GUIDANCE")).toBe(true);
  });

  it("préserve exactement une décision PENDING sans actor/mandate et une décision engageante", () => {
    const pending = makePendingDecision("decision:pending-reg", "REQ_CNIL_MR_ROUTE");
    const adopted = makeDecision("decision:adopted-reg", "EU_CTR_536_2014_SCOPE");
    const result = resolveRegulatoryRequirements(makeBaseInput({ humanDecisions: [pending, adopted] }));
    expect(result.humanDecisions).toEqual([pending, adopted]);
    expect(result.humanDecisions[0]).toMatchObject({ status: "PENDING", actor: null, mandate: null, timestamp: null });
    expect(result.humanDecisions[1]).toMatchObject({ status: "ADOPTED", actor: "Expert réglementaire de test", mandate: "mandate:reg-001:test" });
  });

  it("refuse de traiter une qualification candidate comme décision humaine", () => {
    const candidateDecision = createHumanDecisionCandidate({ decisionId: "decision:mr-candidate", gateId: "gate:mr", scope: ["MR_001_SCOPE"], targets: ["REQ_CNIL_MR_ROUTE"], provenance: PROJECT_PROVENANCE, engineSource: "RESEARCH_PROJECT", projectVersion: "project-version:test:v1" });
    const base = makeBaseInput();
    const input = makeBaseInput({ dataCharacteristics: { ...base.dataCharacteristics, personalHealthData: knownFact(true, "Données de santé.", PROJECT_PROVENANCE) }, knownRegulatoryQualifications: [{ qualificationId: "MR_001_SCOPE", state: "QUALIFICATION_CANDIDATE", decisionId: candidateDecision.decisionId, provenance: PROJECT_PROVENANCE }], humanDecisions: [candidateDecision] });
    const result = resolveRegulatoryRequirements(input);
    expect(requirement(result, "REQ_CNIL_MR_ROUTE").status).toBe("UNKNOWN_REQUIRES_QUALIFICATION");
    expect(result.requiredQualifications.some((item) => item.status === "QUALIFICATION_CANDIDATE")).toBe(true);
  });

  it("conserve sources, autorités, périodes et provenance dans chaque résolution pertinente", () => {
    const result = resolveRegulatoryRequirements(phrcStage2Input());
    const phrc = requirement(result, "REQ_PHRC_STAGE2");
    expect(phrc.authority).toBe("AUTH_FR_DGOS");
    expect(phrc.sourceIds).toEqual(expect.arrayContaining(["SRC_DGOS_PHRC_2025_2026", "SRC_DGOS_NOTE_2025_90"]));
    expect(phrc.effectivePeriod).toEqual({ from: "2025-12-10", until: "2026-06-16" });
    expect(phrc.provenance).toEqual(expect.arrayContaining(["project-digest:test:v1", REG000_CORPUS_DIGEST]));
  });

  it("détecte un digest ou une version de corpus différent sans résoudre positivement", () => {
    const input = makeBaseInput({ regulatoryCorpusDigest: "stale-corpus-digest" });
    const result = resolveRegulatoryRequirements(input);
    expect(result.readiness.status).toBe("CORPUS_VERSION_OUTDATED");
    expect(result.applicableRequirements).toHaveLength(0);
    expect(result.unresolvedRequirements).toHaveLength(REG000_CORPUS.requirements.length);
    expect(result.unresolvedRequirements.every((item) => item.status === "UNKNOWN_MISSING_INFORMATION")).toBe(true);
  });

  it("respecte la période d’effet d’une édition de financement", () => {
    const input = phrcStage2Input();
    const after = resolveRegulatoryRequirements({ ...input, resolutionAsOf: "2026-08-10T12:00:00.000Z" });
    expect(requirement(after, "REQ_PHRC_STAGE2").status).toBe("OUTSIDE_EFFECTIVE_PERIOD");
    expect(after.fundingRequirements.some((item) => item.requirementId === "REQ_PHRC_STAGE2")).toBe(false);
  });
});
