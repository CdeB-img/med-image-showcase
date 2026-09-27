import { describe, expect, it } from "vitest";
import { readNaturalCandidateDecision } from "../natural-conversation-policy";
const simpleAcquiescence = [
  "oui", "oui je valide", "je valide", "valide", "on valide", "ça me va", "ça me convient",
  "d'accord", "ok", "ok on garde ça", "on garde ça", "c'est bon", "c'est parfait", "je retiens ça", "ça marche",
];

describe("existing lexical receipt policy — never adoption",()=>{
  it.each(simpleAcquiescence)("classifies unambiguous natural acquiescence: %s", text => {
    expect(readNaturalCandidateDecision(text)).toMatchObject({ act: "CONFIRM", qualified: false });
  });

  it.each(["OUI !", "ÇA ME CONVIENT.", "D’ACCORD", "OK, on garde ça !", "C'EST PARFAIT…"])(
    "preserves case, accent and punctuation equivalence: %s", text => {
      expect(readNaturalCandidateDecision(text)).toMatchObject({ act: "CONFIRM", qualified: false });
    });

  it.each(["non", "non ça ne me convient pas", "je préfère autre chose", "ne valide pas", "attends",
    "valide pas", "oui mais non", "oui ?", "ok si on change le critère"])(
    "never infers confirmation from refusal, condition or question: %s", text => {
      expect(readNaturalCandidateDecision(text)?.act).not.toBe("CONFIRM");
    });

  it.each(["oui je valide. je refuse finalement", "oui je valide. je préfère deux centres"])(
    "does not mark a later correction as a separable addition: %s", text => {
      expect(readNaturalCandidateDecision(text)).toMatchObject({ act: "CONFIRM", qualified: true, separableContinuation: false });
    });

});
