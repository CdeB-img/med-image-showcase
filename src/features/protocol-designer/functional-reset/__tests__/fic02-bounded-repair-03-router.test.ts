import { describe, expect, it } from "vitest";
import { routeProductEntry } from "../product-entry-routing";

const ROUTED_AT = "2026-09-07T18:00:00.000Z";

const route = (
  raw: string,
  sourceTurnRef: string,
  previousContext?: Parameters<typeof routeProductEntry>[0]["previousContext"],
) => routeProductEntry({ raw, sourceTurnRef, routedAt: ROUTED_AT, previousContext });

describe("FIC02-BOUNDED-REPAIR-03 — generic constructive-finality routing", () => {
  it("preserves a legitimate understanding-only route", () => {
    expect(route(
      "Je veux uniquement comprendre le principe général de cette méthode.",
      "turn:rc05:understand",
    )).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: false,
      projectConstructionEligible: false,
    });
  });

  it("keeps a pure comparison outside construction", () => {
    expect(route(
      "Quelles différences existe-t-il entre une cohorte et un essai randomisé ?",
      "turn:rc05:comparison",
    )).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: false,
      projectConstructionEligible: false,
    });
  });

  it("keeps an explicit construction request reachable", () => {
    expect(route(
      "Nous voulons construire une étude prospective pour évaluer cette méthode.",
      "turn:rc05:construction",
    )).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
  });

  it("preserves UNDERSTAND as primary while representing an explicit open construction finality", () => {
    const result = route(
      "Nous voulons comprendre l'évolution du signal dans deux groupes, mais nous n'avons pas encore décidé le plan d'étude, le calendrier ni le critère principal. Les mesures disponibles couvrent plusieurs périodes, plusieurs modalités et plusieurs centres, avec des contraintes de collecte différentes qui devront rester visibles dans la suite du raisonnement.",
      "turn:rc05:understand-and-build",
    );
    expect(result).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
    expect(result.secondaryRouteIntents).toContain("DESIGN_STUDY");
  });

  it("keeps comparison plus explicit construction reachable", () => {
    expect(route(
      "Nous voulons comparer deux approches puis construire une étude prospective pour les évaluer.",
      "turn:rc05:comparison-and-build",
    )).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
  });

  it("recognizes validation methodology when the study decisions are explicitly open", () => {
    expect(route(
      "Nous souhaitons valider une méthode dans plusieurs sites, mais nous n'avons pas encore défini le cadre d'évaluation ni le critère principal. La mesure existe déjà, les données proviendront de contextes techniques variés et l'évaluation devra conserver les écarts entre centres sans présumer du résultat de performance.",
      "turn:rc05:validation",
    )).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
  });

  it("preserves an established construction finality across a lexically poor follow-up", () => {
    const first = route(
      "Nous voulons comprendre cette évolution, mais nous n'avons pas encore défini le plan d'étude ni le critère principal. Les observations disponibles couvrent plusieurs périodes, plusieurs groupes et plusieurs modalités, avec des contraintes distinctes qui devront rester explicites pendant le cadrage.",
      "turn:rc05:follow-up:1",
    );
    const followUp = route("Oui, exactement.", "turn:rc05:follow-up:2", first.scientificContext);
    expect(first).toMatchObject({ routeIntent: "UNDERSTAND", constructionIntentPresent: true });
    expect(followUp).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: true,
      projectConstructionEligible: true,
    });
    expect(followUp.secondaryRouteIntents).toContain("DESIGN_STUDY");
  });

  it("honors an explicit change of direction toward non-construction", () => {
    const first = route(
      "Nous voulons construire une étude prospective.",
      "turn:rc05:direction:1",
    );
    const changed = route(
      "Je souhaite désormais uniquement comprendre ce sujet, sans créer d'étude ni de protocole.",
      "turn:rc05:direction:2",
      first.scientificContext,
    );
    expect(changed).toMatchObject({
      routeIntent: "UNDERSTAND",
      constructionIntentPresent: false,
      projectConstructionEligible: false,
    });
    expect(changed.secondaryRouteIntents).not.toContain("DESIGN_STUDY");
  });
});
