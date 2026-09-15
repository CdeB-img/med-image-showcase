import { describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "../engine";
import { assertExternalTransmissionAllowed, canPersistKnowledgeQuestion, classifySensitivity, isPatientLevelExpression } from "../privacy";

describe("knowledge privacy: ownership and individual referents", () => {
  it.each([
    "Mon hypothèse concerne les liens entre sommeil et douleur dans une population.",
    "Ma prochaine analyse comparera les pressions dans les deux groupes.",
    "Mes choix méthodologiques concernent la mesure des symptômes.",
    "Mon montage compare les réponses de deux capteurs.",
    "Ma question porte sur la précision des estimations.",
    "Mes remarques décrivent les limites du calcul.",
    "Mes mesures expérimentales seront répétées demain.",
    "Mes résultats comparent la croissance des cultures.",
    "Mes données permettent de comparer les deux méthodes.",
    "Mes traitements thermiques sont comparés à température constante.",
    "Ma pression de vapeur caractérise cet échantillon.",
    "Mon examen méthodologique porte sur la qualité des données.",
    "J'ai besoin de comprendre les mécanismes de cette maladie.",
    "J’ai prévu une analyse des biomarqueurs.",
    "J'ai étudié la douleur dans une cohorte.",
    "J'ai mal compris les explications sur les symptômes.",
    "Pour moi, cette hypothèse reste à examiner.",
  ])("does not infer an individual from ownership of work: %s", (question) => {
    expect(isPatientLevelExpression(question)).toBe(false);
    expect(classifySensitivity(question)).toBe("PUBLIC");
    expect(canPersistKnowledgeQuestion(question)).toBe(true);
  });

  it.each([
    "Ma douleur persiste depuis hier.",
    "Mes symptômes ont changé.",
    "Mon dernier examen montre une anomalie.",
    "Ma nouvelle valeur de T2 est élevée.",
    "Mon T1 est élevé.",
    "MA TENSION EST ÉLEVÉE.",
    "Ma pression artérielle monte.",
    "Mon traitement a changé.",
    "Mes données personnelles sont confidentielles.",
    "Mon adresse est confidentielle.",
    "Mon salaire est privé.",
    "Ma mère souffre de douleurs.",
    "Mon biomarqueur est de 42 unités.",
    "Mon diabète est mal équilibré.",
    "Mes nausées ont augmenté.",
    "J’ai un T2 élevé.",
    "J'ai de fortes douleurs.",
    "J'ai mal au dos.",
    "Mes dossiers médicaux sont confidentiels.",
    "J'ai eu un infarctus.",
    "J'ai 47 ans.",
    "Je suis diabétique.",
    "Je souffre de douleurs.",
    "Chez moi, la douleur revient.",
    "Que signifie cette valeur pour moi ?",
  ])("keeps personal symptoms, measurements and private data restricted: %s", (question) => {
    expect(isPatientLevelExpression(question)).toBe(true);
    expect(classifySensitivity(question)).toBe("RESTRICTED_PERSONAL");
    expect(canPersistKnowledgeQuestion(question)).toBe(false);
    expect(assertExternalTransmissionAllowed(classifySensitivity(question))).toBe(false);
  });

  it("does not let a work possessive exempt another personal referent in the same question", () => {
    const question = "Ma question concerne la méthode. Mon résultat de T2 est de 52 ms.";
    expect(classifySensitivity(question)).toBe("RESTRICTED_PERSONAL");
    expect(canPersistKnowledgeQuestion(question)).toBe(false);
  });

  it.each([
    "Ma question concerne la méthode, contact : personne@example.org.",
    "Ma question concerne la méthode, téléphone : 06 12 34 56 78.",
    "Ma question concerne la méthode, né le 03/04/1978.",
    "Ma question concerne la méthode, IPP: ABCD1234.",
  ])("preserves direct-identifier blocking independently of ownership: %s", (question) => {
    expect(classifySensitivity(question)).toBe("RESTRICTED_PERSONAL");
    expect(canPersistKnowledgeQuestion(question)).toBe(false);
    expect(assertExternalTransmissionAllowed(classifySensitivity(question))).toBe(false);
  });

  it("keeps secrets ineligible for question persistence", () => {
    expect(canPersistKnowledgeQuestion("Ma question concerne la méthode, api_key=synthetic-secret.")).toBe(false);
  });

  it("uses the same patient predicate for the sensitivity classification and domain gate", () => {
    const scientific = executeKnowledgeEngine({ originalQuestion: "Ma réflexion concerne la différence entre T1 mapping et ECV." });
    expect(scientific.request.sensitivityClassification).toBe("PUBLIC");
    expect(scientific.queryPlan.domainGate).toBe("IN_SCOPE");
    expect(scientific.gaps.some((gap) => gap.code === "PRIVACY_BLOCKED")).toBe(false);

    const personal = executeKnowledgeEngine({ originalQuestion: "Ma valeur de T1 est élevée." });
    expect(personal.request.sensitivityClassification).toBe("RESTRICTED_PERSONAL");
    expect(personal.queryPlan.domainGate).toBe("PATIENT_LEVEL_BLOCKED");
    expect(personal.applicableAssertions).toHaveLength(0);
    expect(personal.trace.privacy.externalCallMade).toBe(false);
  });
});
