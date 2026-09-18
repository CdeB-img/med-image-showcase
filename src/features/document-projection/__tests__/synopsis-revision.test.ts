import { describe, expect, it } from "vitest";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { prepareSynopsisRevision, materializeSynopsisRevision, SYNOPSIS_OBLIGATIONS, type SynopsisRevisionInput } from "../synopsis-revision";
import { encodeSessionStorage, decodeSessionStorage } from "../../protocol-designer/functional-reset/session-storage-codec";
import { saveProjectSession, createProjectSession } from "../../protocol-designer/functional-reset/project-workspace-storage";

type Mutable<T> = T extends readonly (infer U)[] ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const copy = (input: SynopsisRevisionInput) => structuredClone(input) as Mutable<SynopsisRevisionInput>;

const at = "2026-09-18T18:00:00.000Z";
const binding = { projectId: "project", projectVersion: "version:1", projectDigest: "digest:1" };
const metadata = { providerStatus: "completed", rawProviderResponseRef: "scientific-interpretation-raw:received", createdAt: at };
const domains = [
  "Essai thérapeutique randomisé comparant un traitement pharmacologique au placebo, suivi à six mois.",
  "Étude observationnelle d’imagerie quantifiant une mesure objective chez des volontaires inclus prospectivement.",
  "Étude neurologique longitudinale évaluant une fonction cognitive avant intervention puis au suivi annuel.",
  "Étude méthodologique de reproductibilité comparant deux lecteurs indépendants et deux mesures répétées.",
];
const fixture = (domain = domains[0]!) => {
  const texts = SYNOPSIS_OBLIGATIONS.map((o, i) => `${o}. ${domain} ` + [
    "La justification repose sur une incertitude documentée qui motive une étude sans préjuger de son résultat.",
    "L’objectif est de mesurer une association définie et de présenter les estimations avec leurs limites.",
    "Le plan retenu distingue le cadre de l’étude des conclusions qui pourront en être tirées.",
    "La population incluse répond à des critères explicites appliqués de manière homogène pour chaque participant.",
    "N = 120 inclus ; cette valeur ne désigne pas le nombre de mesures finalement évaluables.",
    "La cible est pragmatique, non calculée par puissance ; aucune justification numérique supplémentaire n’est adoptée.",
    "Les critères d’éligibilité comprennent le consentement et la sécurité, sans exclusion déduite automatiquement d’une incertitude.",
    "La procédure prévoit une mesure à 6 mois, exprimée en mm, avec documentation des acquisitions manquantes.",
    "Le critère principal est la mesure quantitative prévue ; aucun composite supplémentaire n’est ajouté au protocole.",
    "L’analyse principale comprend une régression ajustée sur le groupe ; les analyses complémentaires restent exploratoires.",
    "Une association observée ne démontre pas une causalité et les résultats discordants ne sont pas supprimés.",
    "La dose reste à définir. Aucune interaction n’est imposée. Les modalités institutionnelles restent ouvertes avant validation.",
  ][i] + " Le recueil conserve chaque source, sa date, son origine et les motifs d’absence afin de distinguer observation et interprétation.");
  // The optional paragraph is explicitly outside the protected scientific nucleus.
  const optional = Array(250).fill("Présentation éditoriale répétée pour le contexte général.").join(" ");
  const original = { kind: "PROTOCOL_SYNOPSIS" as const, title: "Synopsis de travail", sections: [
    { title: "Étude", paragraphs: [...texts, optional], sourceRefs: ["unknown", "negated"] },
  ], missingElements: [] };
  const sourceFacts = [
    { ref: "unknown", type: "UNCERTAINTY", content: "La dose reste à définir.", epistemicState: "UNKNOWN" },
    { ref: "negated", type: "PROJECT_INFORMATION", content: "Aucune interaction n’est imposée.", polarity: "NEGATED", epistemicState: "KNOWN" },
  ];
  const frozenCompanion = { documents: ["CRF", "RECRUITMENT"].map(kind => ({ ...structuredClone(original), kind: kind as "CRF" | "RECRUITMENT" })), crfRows: [] };
  const input: SynopsisRevisionInput = { original, originalRawRef: "scientific-interpretation-raw:original", originalProviderStatus: "completed",
    projectBinding: binding, evidenceDigest: logicalDigest(null), sourceFactsDigest: logicalDigest(sourceFacts),
    fragments: texts.map((text, i) => ({ ref: `p${i}`, sectionIndex: 0, paragraphIndex: i, text,
      obligations: [SYNOPSIS_OBLIGATIONS[i]!], sourceFactRefs: i === 11 ? ["unknown", "negated"] : [] })),
    priorAttemptOriginalDigests: [], attemptNumber: 1, frozenCompanion, frozenDigest: logicalDigest(frozenCompanion), frozenProtocolDigest: "protocol-digest" };
  const packet = { projectBinding: binding, context: JSON.stringify({ CURRENT_PROJECT: { sourceFacts }, AVAILABLE_EVIDENCE: null }) };
  const value = { paragraphs: input.fragments.map(f => ({ sectionIndex: 0, fragmentRefs: [f.ref] })) };
  return { input, packet, value };
};

describe("bounded synopsis revision protects source prose across domains", () => {
  it.each(domains)("uses the same operation for %s", domain => {
    const { input, packet, value } = fixture(domain);
    const before = JSON.stringify(input);
    const prepared = prepareSynopsisRevision(packet, input);
    const result = materializeSynopsisRevision(value, prepared, metadata);
    expect(result.words).toBeGreaterThanOrEqual(550); expect(result.words).toBeLessThanOrEqual(750);
    expect(result.document.sections[0]!.paragraphs).toEqual(input.fragments.map(f => f.text));
    expect(result.provenance.structuralGate).toBe("PASS");
    expect(result.provenance.semanticEquivalenceGeneral).toBe("NOT_PROVEN");
    expect(JSON.stringify(input)).toBe(before);
    expect(prepared.context).not.toContain("CRF"); expect(prepared.context).not.toContain("RECRUITMENT");
    expect(JSON.stringify(decodeSessionStorage(encodeSessionStorage({ pack: result, previous: input.original })))).toBe(JSON.stringify({ pack: result, previous: input.original }));
  });
  it.each(["endpoint disappeared", "N changed", "N status changed", "unknown adopted", "negation inverted", "unit changed", "timepoint changed", "comparator changed", "cited claim strengthened", "discordance removed"])("rejects replacement prose: %s", label => {
    const { input, packet, value } = fixture();
    const prepared = prepareSynopsisRevision(packet, input);
    // The text intended for display is replaced while valid source references remain.
    const malicious = { paragraphs: value.paragraphs.map(p => ({ ...p, text: label + " nouvelle affirmation non soutenue" })) };
    expect(() => materializeSynopsisRevision(malicious, prepared, metadata)).toThrow();
    const mutatedPlan = copy(input);
    mutatedPlan.fragments[0]!.text = label + " nouvelle affirmation non soutenue";
    expect(() => prepareSynopsisRevision(packet, mutatedPlan)).toThrow("DOC_REVISION_SOURCE_FRAGMENT_INVALID");
  });
  it("rejects a missing protected endpoint and does not accept self-attestation", () => {
    const { input, packet, value } = fixture();
    const prepared = prepareSynopsisRevision(packet, input);
    expect(() => materializeSynopsisRevision({ paragraphs: value.paragraphs.slice(0, 8) }, prepared, metadata)).toThrow("DOC_REVISION_PROTECTED_FRAGMENT_OMITTED");
    expect(() => materializeSynopsisRevision({ ...value, factsPreserved: true }, prepared, metadata)).toThrow();
  });
  it.each(["project", "evidence", "crf", "recruitment"])("rejects stale or altered %s before provider", what => {
    const { input, packet } = fixture(); const changed = copy(input);
    if (what === "project") changed.projectBinding.projectDigest = "other";
    else if (what === "evidence") changed.evidenceDigest = "other";
    else changed.frozenCompanion.documents[what === "crf" ? 0 : 1]!.title = "changed";
    expect(() => prepareSynopsisRevision(packet, changed)).toThrow();
  });
  it.each([2, 3])("rejects attempt number %i", number => {
    const { input, packet } = fixture();
    expect(() => prepareSynopsisRevision(packet, { ...input, attemptNumber: number as 1 })).toThrow("DOC_REVISION_ATTEMPT_ALREADY_USED");
  });
  it("rejects an already persisted attempt after reload", () => {
    const { input, packet } = fixture();
    const prior = decodeSessionStorage(encodeSessionStorage([logicalDigest(input.original)])) as string[];
    expect(() => prepareSynopsisRevision(packet, { ...input, priorAttemptOriginalDigests: prior })).toThrow("DOC_REVISION_ATTEMPT_ALREADY_USED");
  });
  it("rejects provider incomplete, orphan citation and missing open-state protection", () => {
    const { input, packet, value } = fixture();
    expect(() => materializeSynopsisRevision(value, prepareSynopsisRevision(packet, input), { ...metadata, providerStatus: "incomplete" })).toThrow("DOC_REVISION_PROVIDER_INCOMPLETE");
    const cited = copy(input); cited.original.sections[0]!.paragraphs[0] += " [[CITE:orphan]]"; cited.fragments[0]!.text += " [[CITE:orphan]]";
    expect(() => prepareSynopsisRevision(packet, cited)).toThrow("DOC_REVISION_CITATION_UNPROTECTED");
    const open = copy(input); open.fragments[11]!.sourceFactRefs = [];
    expect(() => prepareSynopsisRevision(packet, open)).toThrow("DOC_REVISION_OPEN_OR_NEGATED_FACT_UNPROTECTED");
  });
  it.each([500, 751])("rejects a protected synopsis of %i words", words => {
    const { input, packet } = fixture(); const changed = copy(input);
    const text = Array(words).fill("scientifique").join(" ");
    changed.original.sections[0]!.paragraphs = [text, Array(1000).fill("contexte").join(" ")];
    changed.fragments = [{ ref: "p", sectionIndex: 0, paragraphIndex: 0, text, obligations: [...SYNOPSIS_OBLIGATIONS], sourceFactRefs: ["unknown", "negated"] }];
    if (words > 750) expect(() => prepareSynopsisRevision(packet, changed)).toThrow("DOC_REVISION_PROTECTED_CORE_EXCEEDS_BOUND");
    else expect(() => materializeSynopsisRevision({ paragraphs: [{ sectionIndex: 0, fragmentRefs: ["p"] }] }, prepareSynopsisRevision(packet, changed), metadata)).toThrow("DRCI_SYNOPSIS_WORD_BOUND_EXCEEDED");
  });
  it("fails atomic persistence without replacing the previous project", () => {
    const stored = new Map<string, string>();
    const storage = { getItem: (k: string) => stored.get(k) ?? null, setItem: (k: string, v: string) => { stored.set(k, v); } } as Storage;
    const saved = createProjectSession(storage, "project"); const raw = saveProjectSession(storage, saved, saved.session);
    const failing = { ...storage, setItem: () => { throw new Error("quota"); } } as Storage;
    const previous = stored.get(saved.key);
    expect(() => saveProjectSession(failing, { ...saved, raw }, { ...saved.session, updatedAt: at })).toThrow("quota");
    expect(stored.get(saved.key)).toBe(previous);
  });
});
