import { describe, expect, it } from "vitest";
import { routeProductEntry } from "../product-entry-routing";

const route = (raw: string, extra: Partial<Parameters<typeof routeProductEntry>[0]> = {}) => routeProductEntry({
  raw, sourceTurnRef: "turn:reversible-admission", routedAt: "2026-09-14T12:00:00.000Z", ...extra,

});

describe("Product Entry — reversible extraction admission independent of route certainty", () => {
  it.each([
    "Propose-moi plusieurs options, les mesures couvrent huit séries.",
    "Les mesures couvrent huit séries puis propose-moi plusieurs options.",
    "Propose-moi plusieurs options et les mesures couvrent huit séries.",
    "Les observations concernent quatre groupes, propose-moi des alternatives.",
    "Présente-moi plusieurs options puis les observations couvrent cinq semaines.",
  ])("does not discard an unclassified clause beside a request: %s", (raw) => {
    const result = route(raw, { currentProjectAvailable: true });
    expect(result.projectConstructionEligible).toBe(true);
    expect(result.projectWriteAuthorized).toBe(false);
  });

  it.each([
    "Les observations disponibles couvrent trois ateliers et deux périodes. Les durées individuelles sont recueillies après chaque intervention.",
    "La population inclurait des adultes. L'effectif reste inconnu.",
    "La méthode repose sur une cohorte observationnelle prospective. Le calendrier n'est pas fourni.",
    "Essai randomisé, ouvert, avec le suivi renforcé dans le bras intervention et le suivi habituel en comparaison.",
    "Le rôle de cette mesure est secondaire.",
    "La différence entre les deux mesures sera consignée dans le registre.",
  ])("admits supplied material without asserting construction finality: %s", (raw) => {
    expect(route(raw)).toMatchObject({
      domainGate: "IN_SCOPE", constructionIntentPresent: false,
      projectConstructionEligible: true, projectWriteAuthorized: false,
    });
  });

  it.each([
    "Comment construire une étude prospective ?",
    "Quelles différences existe-t-il entre une cohorte et un essai randomisé ?",
    "Peux-tu comparer ces méthodes",
    "Explique ce choix.",
    "Discutons de cette option.",
    "Fais-moi des propositions.",
    "Donne-moi plusieurs options.",
    "Qu'est-ce que tu proposerais ?",
    "Je veux uniquement comprendre le principe général de cette méthode.",
    "J'aimerais peut-être travailler sur cette question.",
    "Je pense que ce phénomène pourrait dépendre du délai et je veux formaliser cette hypothèse.",
  ])("keeps a conversation-only request outside extraction: %s", (raw) => {
    expect(route(raw)).toMatchObject({ projectConstructionEligible: false, projectWriteAuthorized: false });
  });

  it.each([
    "Les observations disponibles couvrent trois ateliers. Comment organiser la suite ?",
    "Les observations disponibles couvrent trois ateliers. Explique ce choix.",
    "Les observations disponibles couvrent trois ateliers. Discutons de cette option.",
    "Les observations disponibles couvrent trois ateliers. Fais-moi des propositions.",
    "Les observations disponibles couvrent trois ateliers, propose-moi plusieurs options.",
    "Les observations disponibles couvrent trois ateliers, explique ce choix.",
    "Les observations disponibles couvrent trois ateliers, discutons de cette option.",
    "Les observations disponibles couvrent trois ateliers; je veux comprendre les possibilités.",
    "Je veux comprendre les possibilités. Les observations disponibles couvrent trois ateliers.",
    "Je veux formaliser cette hypothèse. Les observations disponibles couvrent trois ateliers.",
    "Les observations disponibles couvrent trois ateliers.\n\nQuelles différences faut-il examiner ?",
  ])("preserves declarative material in a mixed contribution and request: %s", (raw) => {
    expect(route(raw)).toMatchObject({ projectConstructionEligible: true, projectWriteAuthorized: false });
  });

  it("keeps a pure understanding request with an internal comma outside extraction", () => {
    expect(route("Je voudrais comprendre cette différence, et comment les observations sont recueillies."))
      .toMatchObject({ projectConstructionEligible: false, projectWriteAuthorized: false });
    expect(route("Explique ce choix, propose-moi plusieurs options."))
      .toMatchObject({ projectConstructionEligible: false, projectWriteAuthorized: false });
  });

  it.each([
    "Je ne veux ni étude ni protocole.",
    "Je souhaite uniquement comprendre ce sujet, sans créer d'étude ni de protocole.",
    "J'ai un T2 élevé sur mon examen, que dois-je faire ?",
    "Le contact est patient@example.org.",
    "   ",
    "... ?",
  ])("preserves explicit exclusions, privacy and empty-input gates: %s", (raw) => {
    expect(route(raw)).toMatchObject({ projectConstructionEligible: false, projectWriteAuthorized: false });
  });

  it("preserves forced understanding and current-Project preservation", () => {
    expect(route("Les observations disponibles couvrent trois ateliers.", { forceUnderstand: true }))
      .toMatchObject({ projectConstructionEligible: false });
    expect(route("On garde le projet tel quel.", { currentProjectAvailable: true }))
      .toMatchObject({ currentProjectDirection: "PRESERVE_EXISTING_PROJECT", projectConstructionEligible: false });
  });

  it.each([
    "J'ai des douleurs thoraciques.",
    "Je ressens une fatigue persistante.",
    "Je suis diabétique.",
    "Les observations disponibles couvrent trois ateliers. J'ai des douleurs thoraciques.",
    "Je veux construire une étude prospective. J'ai des douleurs thoraciques.",
  ])("fails closed on the complete personal-referent owner before extraction: %s", (raw) => {
    expect(route(raw)).toMatchObject({ domainGate: "OUT_OF_SCOPE", routeIntent: null, projectConstructionEligible: false, projectWriteAuthorized: false });
  });

  it("keeps explicit correction mode as a candidate-only admission", () => {
    expect(route("La valeur serait 7.", { currentProjectAvailable: true, explicitCorrectionMode: true }))
      .toMatchObject({ currentProjectDirection: "MODIFY_EXISTING_PROJECT_OBJECT", projectConstructionEligible: true, projectWriteAuthorized: false });
  });

  it("does not admit a question merely because its wording names a Project edit", () => {
    expect(route("Je modifie la valeur ?", { currentProjectAvailable: true }))
      .toMatchObject({ projectConstructionEligible: false, projectWriteAuthorized: false });
  });

  it.each([
    "Bonjour.",
    "Je ne suis pas certain.",
    "Par exemple, une valeur pourrait être 7.",
  ])("does not confuse admission of unresolved discourse with finality or adoption: %s", (raw) => {
    // Product Entry does not certify semantic relevance. The existing extraction
    // contract can return an empty delta; examples/uncertainty are not adoption.
    expect(route(raw)).toMatchObject({ constructionIntentPresent: false, projectConstructionEligible: true, projectWriteAuthorized: false });
  });
  it.each([
  {
    "id": "A01",
    "raw": "Je travaille sur la viabilité du myocarde après un IDM. L'idée est de comparer deux groupes : stent posé immédiatement dans le groupe intervention, pose différée dans le groupe comparateur. Un double aveugle serait souhaitable, mais je ne sais pas encore s'il est réalisable.\nOn prévoit une IRM cardiaque entre le troisième et le sixième jour après l'infarctus. Le principal serait la taille des lésions microvasculaires, en valeur absolue, mesurée 3 minutes après l'injection. Il y aura aussi la cinétique segmentaire, le strain, T1 et T2. J'ai écrit précoce et tardif dans mes notes, le sens de ces termes reste à préciser. Pour l'effectif, rien de fixé à ce stade."
  },
  {
    "id": "A02",
    "raw": "Je commence par qui on peut recruter : des adultes de 35 à 85 ans après un premier infarctus reconnu. On exclurait les contre-indications réelles à l'IRM cardiaque. Les dispositifs implantés sont des exemples à regarder individuellement, pas une liste d'exclusions automatiques."
  },
  {
    "id": "A03",
    "raw": "Mon sujet, c'est le lien entre l'œdème myocardique et le strain après infarctus. Je pars sur une cohorte observationnelle prospective d'adultes après un premier IDM reconnu. L'examen serait une IRM cardiaque, entre J2 et J4 après l'IDM, avec le strain longitudinal global de cette IRM initiale comme principal. Pour l'œdème, on prévoit une mesure par T2.\nIl y aurait aussi une mesure dite tardive. Le délai après injection pour celle-là, je ne le connais pas encore."
  },
  {
    "id": "B01",
    "raw": "Je prépare un essai chez des adultes ayant un diabète de type 2. L'objectif serait de comparer l'effet d'un suivi infirmier coordonné à celui du suivi habituel sur le contrôle glycémique. Essai randomisé, ouvert, avec le suivi infirmier dans le bras intervention et le suivi habituel en comparaison.\nLe principal serait le changement d'HbA1c entre l'inclusion et 24 semaines ; la visite d'évaluation principale se ferait à 24 semaines."
  }
])("regression $id T01: admits the frozen supplied material", ({ raw }) => {
    expect(route(raw)).toMatchObject({ constructionIntentPresent: false, projectConstructionEligible: true, projectWriteAuthorized: false });
  });

});
