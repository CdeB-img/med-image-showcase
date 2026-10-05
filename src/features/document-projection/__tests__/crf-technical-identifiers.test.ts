import { describe, expect, it } from "vitest";
import { asciiIdentifierStem, canonicalizeDrciCrfTechnicalIdentifiers, DRCI_CRF_VARIABLE_ID_PATTERN } from "../technical-identifiers";
import { materializeDrciDraftPack, prepareDrciDraftPack, prepareDrciGenerationBatches, DRCI_DOCUMENT_KINDS } from "../drci-draft-contract";
import { authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import { adoptBehaviorContribution, behaviorAuthority, richStudyContribution } from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { documentGenerationsForProject } from "../history";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { buildCanonicalCrfPackage } from "../study-deliverable-portfolio";

const canonicalize = (variableId: string) => (canonicalizeDrciCrfTechnicalIdentifiers({ crfRows: [{ variableId }] }) as {
  crfRows: { variableId: string }[];
}).crfRows[0].variableId;

describe("DOC CRF technical identifiers", () => {
  it.each(["FIELD_1", "FIELD__A", "FIELD_A_", `A${"B".repeat(63)}`])("preserves valid native ASCII identifiers byte for byte: %s", id => {
    expect(canonicalize(id)).toBe(id);
  });
  it.each([
    ["ANTECEDENTS_CARDIOVASCULAIRES_DECLares", "ANTECEDENTS_CARDIOVASCULAIRES_DECLARES"],
    ["mixEd_case", "MIXED_CASE"],
    ["café_Ångström", "CAFE_ANGSTROM"],
    ["Cafe\u0301", "CAFE"],
    ["fullwidth_ＡＢ", "FULLWIDTH_AB"],
    [" space - punctuation / name! ", "SPACE_PUNCTUATION_NAME"],
    ["__mixed---___separators__", "MIXED_SEPARATORS"],
    ["_leading_separator", "LEADING_SEPARATOR"],
  ])("canonicalizes only the technical candidate %s", (raw, expected) => {
    expect(canonicalize(raw)).toBe(expected);
    expect(DRCI_CRF_VARIABLE_ID_PATTERN.test(expected)).toBe(true);
  });
  it.each(["1FIELD", "_123", "___", "医学", "A"])("rejects candidates without a proven valid leading/length contract: %s", raw => {
    expect(() => canonicalize(raw)).toThrow("DRCI_CRF_TECHNICAL_IDENTIFIER_INVALID");
  });
  it("rejects overlength identifiers without truncating or aliasing them", () => {
    expect(() => canonicalize(`A${"B".repeat(64)}`)).toThrow("DRCI_CRF_TECHNICAL_IDENTIFIER_TOO_LONG");
    expect(() => canonicalizeDrciCrfTechnicalIdentifiers({ crfRows: [
      { variableId: `${"A".repeat(64)}x` }, { variableId: `${"A".repeat(64)}y` },
    ] })).toThrow("DRCI_CRF_TECHNICAL_IDENTIFIER_TOO_LONG");
  });
  it.each([
    ["foo-é", "foo_e"], ["field", "FIELD"],
  ])("rejects colliding definitions %s / %s", (a, b) => {
    expect(() => canonicalizeDrciCrfTechnicalIdentifiers({ crfRows: [{ variableId: a }, { variableId: b }] }))
      .toThrow("DRCI_CRF_TECHNICAL_IDENTIFIER_COLLISION");
  });
  it("rewrites structured dependencies through the definitions mapping and preserves every other byte", () => {
    const value = { documents: [{ title: "Scientific label café", text: "Do not rewrite raw-é or values" }], crfRows: [
      { variableId: "raw-é", variableRef: "canonical:project:1", label: "é unchanged", derivedFrom: [], question: "Why raw-é?", controls: ["raw-é > 0"] },
      { variableId: "derived-row", variableRef: "canonical:project:2", derivedFrom: ["raw-é"], derivation: "raw-é / 2", unit: "mL" },
    ] };
    const frozen = JSON.stringify(value);
    const actual = canonicalizeDrciCrfTechnicalIdentifiers(value) as typeof value;
    expect(actual.crfRows.map(row => row.variableId)).toEqual(["RAW_E", "DERIVED_ROW"]);
    expect(actual.crfRows[1].derivedFrom).toEqual(["RAW_E"]);
    expect(actual.documents).toBe(value.documents);
    expect(actual.crfRows.map(({ variableId: _id, derivedFrom: _refs, ...row }) => row))
      .toEqual(value.crfRows.map(({ variableId: _id, derivedFrom: _refs, ...row }) => row));
    expect(JSON.stringify(value)).toBe(frozen);
    expect(canonicalizeDrciCrfTechnicalIdentifiers(actual)).toEqual(actual);
  });
  it("accepts existing canonical references but never manufactures a missing definition", () => {
    const value = { crfRows: [{ variableId: "raw-é", derivedFrom: [] }, { variableId: "derived", derivedFrom: ["RAW_E"] }] };
    expect(canonicalizeDrciCrfTechnicalIdentifiers(value)).toMatchObject({ crfRows: [{ variableId: "RAW_E" }, { derivedFrom: ["RAW_E"] }] });
    expect(() => canonicalizeDrciCrfTechnicalIdentifiers({ crfRows: [{ variableId: "FIELD", derivedFrom: ["missing"] }] }))
      .toThrow("DRCI_OPERATIONAL_CRF_SPECIFICATION_INCOMPLETE");
  });
  it("leaves malformed shapes/types for native strict validation rather than coercing them", () => {
    expect(canonicalizeDrciCrfTechnicalIdentifiers(null)).toBeNull();
    const value = { crfRows: [{ variableId: 123, derivedFrom: [false] }] };
    expect(canonicalizeDrciCrfTechnicalIdentifiers(value)).toEqual(value);
  });
  it.each(["Échéance clinique", "123 âge", "Maße Ångström", "İstanbul I", "___", "field--α--name", "ＡＢＣ"])("reuses the existing REDCap ASCII stem unchanged: %s", raw => {
      const legacy = raw.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR")
        .replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
      expect(asciiIdentifierStem(raw)).toBe(legacy);
    });
});

describe("DRCI batch and materialization admission", () => {
  const at = "2026-10-02T00:22:17.824Z";
  const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
  const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: at });
  const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true }).projections.at(-1)!;
  const packet = prepareDrciDraftPack(project, { handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) });
  const candidate = () => ({ documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `LOCAL_SYNTHETIC ${kind}`,
    sections: [{ title: "LOCAL_SYNTHETIC", paragraphs: [kind === "PROTOCOL_SYNOPSIS" ? "Synthetic qualification prose ".repeat(200) : "Synthetic content"], sourceRefs: [] }], missingElements: [] })),
    crfRows: packet.crf.fields.map((field, index) => ({ variableRef: field.canonicalVariableId,
      variableId: index === 0 ? "ANTECEDENTS_CARDIOVASCULAIRES_DECLares" : `FIELD_${index}`,
      label: field.label, domain: "LOCAL_SYNTHETIC", definition: field.label, entryType: "Texte", visit: "LOCAL_SYNTHETIC",
      unit: field.unit, categories: null, dataOrigin: "UNSPECIFIED", source: "LOCAL_SYNTHETIC", required: "LOCAL_SYNTHETIC",
      condition: null, derivedFrom: index === 1 ? ["ANTECEDENTS_CARDIOVASCULAIRES_DECLares"] : [], analysisImpact: null,
      derivation: null, controls: [], specificationStatus: "UNSPECIFIED" })) });

  it("admits both batches, materializes one bound pack and derives a generation without a session write", () => {
    const native = candidate();
    const before = JSON.stringify(native);
    const projectBefore = JSON.stringify(project);
    const aliases = new Map(packet.sourceFacts.map((fact, index) => [fact.ref, `f${index}`]));
    const expanded = prepareDrciGenerationBatches(packet).map(batch => {
      const context = JSON.parse(batch.context);
      return batch.expand({ documents: native.documents.filter(doc => context.DOCUMENT_SCOPE.includes(doc.kind)),
        crfRows: context.INCLUDE_CRF_ROWS ? native.crfRows.map(row => ({ ...row, variableRef: aliases.get(row.variableRef) })) : [] });
    });
    const value = { documents: expanded.flatMap(batch => batch.documents), crfRows: expanded.flatMap(batch => batch.crfRows) };
    const pack = materializeDrciDraftPack(value, { project, packet, generatedAt: at });
    expect(pack.crfRows[0].variableId).toBe("ANTECEDENTS_CARDIOVASCULAIRES_DECLARES");
    expect(pack.crfRows[1].derivedFrom).toEqual(["ANTECEDENTS_CARDIOVASCULAIRES_DECLARES"]);
    expect(documentGenerationsForProject([pack], project.projectId)[0].documentGenerationId).toBe(`${project.projectId}:document-generation:${pack.packDigest}`);
    expect(materializeDrciDraftPack(native, { project, packet, generatedAt: at }).crfRows).toEqual(pack.crfRows);
    expect(JSON.stringify(native)).toBe(before);
    expect(JSON.stringify(project)).toBe(projectBefore);
  });
  it("keeps technical collisions rejected at materialization", () => {
    const native = candidate();
    native.crfRows[0].variableId = "foo-é";
    native.crfRows[1].variableId = "foo_e";
    expect(() => materializeDrciDraftPack(native, { project, packet, generatedAt: at })).toThrow("DRCI_CRF_TECHNICAL_IDENTIFIER_COLLISION");
  });
  it("keeps identical duplicate definitions rejected by the original native owner", () => {
    const native = candidate();
    native.crfRows[0].variableId = "FIELD";
    native.crfRows[1].variableId = "FIELD";
    native.crfRows[1].derivedFrom = [];
    expect(() => materializeDrciDraftPack(native, { project, packet, generatedAt: at })).toThrow("DRCI_OPERATIONAL_CRF_SPECIFICATION_INCOMPLETE");
  });
  it("keeps native Project references and scientific fields fail-closed", () => {
    const native = candidate();
    native.crfRows[0].variableRef = "MISSING_PROJECT_VARIABLE";
    expect(() => materializeDrciDraftPack(native, { project, packet, generatedAt: at })).toThrow("DRCI_CRF_NATIVE_COVERAGE_MISMATCH");
    const malformed = candidate();
    malformed.crfRows[0].dataOrigin = "INVALID_ORIGIN";
    expect(() => materializeDrciDraftPack(malformed, { project, packet, generatedAt: at })).toThrow();
  });
});
