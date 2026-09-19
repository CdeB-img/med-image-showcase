import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { drciDraftPackFiles, type DrciDraftPack } from "../drci-draft-pack";

const historical = JSON.parse(readFileSync("validation/noxia-drci-last-deterministic-document-cleanup-01/PACK_PROVISIONAL.json", "utf8")) as DrciDraftPack;
describe("independent CRF rendering does not infer scientific rules from a domain keyword", () => {
  it.each([
    ["Méthode de cartographie rénale", "Cartes interprétables nécessaires ; aucun prélèvement sanguin.", "LGE sans exclusion de l’analyse principale."],
    ["Reproductibilité des cartes de température", "Cartes thermiques interprétables nécessaires.", "Les mesures répétées contribuent à l’analyse principale."],
    ["Essai pharmacologique", "Évaluabilité par questionnaire complet selon la décision adoptée.", "Analyse principale en intention de traiter, même si le traitement a été interrompu."],
  ])("renders only adopted conditions for %s", (title, quality, analysis) => {
    const candidate: DrciDraftPack = { ...historical, evidenceContent: undefined, crfRows: [], sourceFacts: [
      { ref: "quality", type: "PROJECT_INFORMATION", content: quality, polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "analysis", type: "PROJECT_INFORMATION", content: analysis, polarity: "AFFIRMED", epistemicState: "KNOWN" },
    ], documents: [{ kind: "CRF", title, sections: [{ title: "Collecte", paragraphs: [quality, analysis], sourceRefs: ["quality", "analysis"] }], missingElements: [] }] };
    const before = JSON.stringify(candidate), output = drciDraftPackFiles(candidate)[0].markdown;
    expect(output).toContain(quality); expect(output).toContain(analysis);
    for (const invented of ["ECV_EVALUABLE", "T1 pré/post appariables", "hématocrite disponible", "absence de LGE focal", "lecture IRM"]) expect(output).not.toContain(invented);
    expect(JSON.stringify(candidate)).toBe(before);
  });
});
