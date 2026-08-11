import { describe, expect, it } from "vitest";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import { makeThinkingInput } from "@/features/scientific-thinking/__tests__/fixtures";
import { executeImagingStudyDesigner } from "@/features/imaging-study-designer";
import { makeImagingInput } from "@/features/imaging-study-designer/__tests__/fixtures";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution";
import { makeBaseInput } from "@/features/regulatory-resolution/__tests__/fixtures";
import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import { composeStudyTemplateInstance } from "@/features/study-template";
import { makeTemplateInput } from "@/features/study-template/__tests__/fixtures";
import { makeAuthorizedProject, makeTemplateProjectionRequest } from "@/features/document-projection/__tests__/fixtures";
import { projectDocumentFromStudyTemplate } from "@/features/document-projection";
import {
  adaptDocumentProjection,
  adaptDocumentaryPatternCatalog,
  adaptImagingDesignResult,
  adaptRegulatoryResolutionResult,
  adaptRendererOutput,
  adaptResearchProjectResult,
  adaptScientificThinkingOutput,
  adaptStudyTemplateInstance,
  auditValidationArchitecture,
  explainValidationFinding,
  listPolicies,
  listValidators,
  validateTransformation,
  validateWithPolicy,
  VALIDATION_ARCHITECTURE_AUDIT_CODES,
  VALIDATION_CHECKPOINTS,
  VALIDATION_ERROR_CODES,
  VALIDATION_INVARIANTS,
  VALIDATOR_REGISTRY,
} from "..";
import type { ValidationPolicy, ValidationResult, ValidatorDefinition } from "../types";
import { makeValidationRequest, SYNTHETIC_VALIDATION_FIXTURES } from "./fixtures";

describe("VAL-000 contracts and registries", () => {
  it("publishes the exact 18 invariant IDs and 26 error codes", () => {
    expect(VALIDATION_INVARIANTS.map((item) => item.invariantId)).toEqual(Array.from({ length: 18 }, (_, index) => `VAL-C${String(index + 1).padStart(2, "0")}`));
    expect(VALIDATION_ERROR_CODES).toHaveLength(26);
  });

  it("registers eight versioned validators and keeps SEM disabled", () => {
    expect(VALIDATOR_REGISTRY.validators).toHaveLength(8);
    const semantic = listValidators().find((item) => item.validatorId === "VAL-SEM-ST-001");
    expect(semantic).toMatchObject({ status: "FUTURE", availability: "PENDING_SEM_QUALIFICATION" });
    expect(VALIDATION_CHECKPOINTS).toHaveLength(7);
    expect(VALIDATION_CHECKPOINTS[0]).toMatchObject({ checkpointId: "A", status: "PENDING_SEM_QUALIFICATION" });
  });

  it("publishes seven technical policies without a universal policy", () => {
    expect(listPolicies().map((item) => item.policyId)).toEqual([
      "ENGINE_HANDOFF", "PROJECT_CONSTRUCTION", "REGULATORY_COMPOSITION", "TEMPLATE_COMPOSITION", "DOCUMENT_PROJECTION", "CROSS_PROJECTION", "SEMANTIC_END_TO_END_FUTURE",
    ]);
    expect(listPolicies().every((item) => item.blockingSeverities.length > 0 && item.boundary.includes("NOT_SCIENTIFIC_STANDARD"))).toBe(true);
  });
});

describe("VAL-000 synthetic fixtures", () => {
  for (const fixture of SYNTHETIC_VALIDATION_FIXTURES) {
    it(fixture.fixtureId, () => {
      const sourceBefore = structuredClone(fixture.request.sourceArtifact);
      const targetBefore = structuredClone(fixture.request.targetArtifact);
      const result = validateTransformation(fixture.request);
      if (fixture.expectedCode) expect(result.findings.map((item) => item.code)).toContain(fixture.expectedCode);
      else expect(result.status).toBe("VALID");
      expect(fixture.request.sourceArtifact).toEqual(sourceBefore);
      expect(fixture.request.targetArtifact).toEqual(targetBefore);
      expect(result.findings.every((item) => item.automaticCorrectionAllowed === false && item.evidence.length > 0)).toBe(true);
      expect(result.boundary).toBe("DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION");
    });
  }

  it("excludes requestedAt from logical determinism", () => {
    const firstRequest = makeValidationRequest();
    const secondRequest = { ...structuredClone(firstRequest), requestedAt: "2030-01-01T00:00:00.000Z" };
    expect(validateTransformation(firstRequest).resultDigest).toBe(validateTransformation(secondRequest).resultDigest);
  });

  it("applies policy invariants and blocking rules", () => {
    const fixture = SYNTHETIC_VALIDATION_FIXTURES.find((item) => item.fixtureId === "04-unknown-strengthened")!;
    const request = { ...fixture.request, validatorType: "PROJECT_CONSISTENCY" as const };
    expect(validateWithPolicy(request, "PROJECT_CONSTRUCTION").status).toBe("INVALID");
  });

  it("returns unavailable for the unqualified SEM frontier", () => {
    const request = makeValidationRequest({ validatorType: "SEMANTIC_FIDELITY" });
    request.sourceArtifact.artifactType = "SEMANTIC_MODEL";
    request.sourceArtifact.version = "PENDING_SEM_QUALIFICATION";
    request.sourceVersion = "PENDING_SEM_QUALIFICATION";
    expect(validateWithPolicy(request, "SEMANTIC_END_TO_END_FUTURE").status).toBe("VALIDATOR_UNAVAILABLE");
  });

  it("provides deterministic structured explanations", () => {
    const result = validateTransformation(SYNTHETIC_VALIDATION_FIXTURES[1].request);
    const first = explainValidationFinding(result.findings[0]);
    const second = explainValidationFinding(result.findings[0]);
    expect(first).toEqual(second);
    expect(first.automaticCorrectionAllowed).toBe(false);
  });
});

describe("VAL-000 architecture audit", () => {
  it("passes the default registry without automatic correction", () => {
    const audit = auditValidationArchitecture();
    expect(audit.passed).toBe(true);
    expect(audit.findings).toEqual([]);
    expect(audit.boundary).toBe("DETECTION_ONLY_NO_AUTOMATIC_FIX");
  });

  it("detects all twelve required audit categories", () => {
    const base: ValidatorDefinition = {
      validatorId: "BAD-A", validatorType: "PROJECT_CONSISTENCY", version: "", status: "AVAILABLE", sourceType: "RESEARCH_PROJECT_RESULT", targetType: "RESEARCH_PROJECT_RESULT", supportedInvariantIds: [], availability: "UNAVAILABLE", dependencies: ["BAD-B"], owner: "", limitations: [], provenance: [],
    };
    const mutant: ValidatorDefinition = {
      ...base, validatorId: "BAD-B", version: "1.0.0", status: "EXPERIMENTAL", availability: "AVAILABLE", dependencies: ["BAD-A"], owner: "VAL-000", supportedInvariantIds: ["VAL-C01", "VAL-C99"], provenance: ["fixture"],
    };
    const badPolicy: ValidationPolicy = {
      policyId: "BAD-POLICY", version: "1.0.0", invariantIds: ["VAL-C99"], blockingSeverities: [], warningsAccepted: true, requiredValidators: [{ validatorId: "MISSING", version: "1.0.0" }], compatibleSources: [], boundary: "TECHNICAL_VALIDATION_POLICY_NOT_SCIENTIFIC_STANDARD",
    };
    let run = 0;
    const probeRunner = (request: Parameters<typeof validateTransformation>[0]): ValidationResult => {
      request.sourceArtifact.owner = "MUTATED_SOURCE";
      request.targetArtifact.owner = "MUTATED_TARGET";
      const result = validateTransformation({ ...request, validatorType: "PROJECT_CONSISTENCY" }, "VAL-PRJ-CONSISTENCY-001");
      return { ...result, resultDigest: `non-deterministic-${run += 1}` };
    };
    const audit = auditValidationArchitecture({ validators: [base, mutant], policies: [badPolicy], probeRunners: { "BAD-B": probeRunner } });
    expect(new Set(audit.findings.map((item) => item.code))).toEqual(new Set(VALIDATION_ARCHITECTURE_AUDIT_CODES));
    expect(audit.findings.every((item) => item.automaticCorrectionAllowed === false)).toBe(true);
  });
});

describe("VAL-000 read-only adapters for current contracts", () => {
  it("adapts ST, IMG, PRJ, REG, DOC-002, TMP and DOC-001B without mutation", () => {
    const st = executeScientificThinkingEngine(makeThinkingInput());
    const img = executeImagingStudyDesigner(makeImagingInput());
    const prj = executeResearchProjectConstruction(makeProjectInput());
    const reg = resolveRegulatoryRequirements(makeBaseInput());
    const template = composeStudyTemplateInstance(makeTemplateInput());
    const projectSession = makeAuthorizedProject();
    const projectionResult = projectDocumentFromStudyTemplate(makeTemplateProjectionRequest(projectSession));
    expect(projectionResult.ok).toBe(true);
    if (!projectionResult.ok) throw new Error("DOC001B_FIXTURE_NOT_PROJECTED");
    const projection = projectionResult.projection;
    const sources = [st, img, prj, reg, DOCUMENTARY_PATTERN_CATALOG, template, projection].map((item) => structuredClone(item));
    const artifacts = [
      adaptScientificThinkingOutput(st), adaptImagingDesignResult(img), adaptResearchProjectResult(prj), adaptRegulatoryResolutionResult(reg), adaptDocumentaryPatternCatalog(DOCUMENTARY_PATTERN_CATALOG), adaptStudyTemplateInstance(template), adaptDocumentProjection(projection), adaptRendererOutput(projection, { rendererId: "markdown", rendererVersion: "1.0.0", format: "MARKDOWN" }),
    ];
    expect(artifacts.every((item) => item.elements.length > 0 && item.digest.length > 0)).toBe(true);
    expect([st, img, prj, reg, DOCUMENTARY_PATTERN_CATALOG, template, projection]).toEqual(sources);
    expect(CLASSIFY_REAL_CONTRACTS(artifacts.map((item) => item.artifactType))).toBe(true);
  });
});

const CLASSIFY_REAL_CONTRACTS = (types: string[]) => ["SCIENTIFIC_THINKING_OUTPUT", "IMAGING_DESIGN_RESULT", "RESEARCH_PROJECT_RESULT", "REGULATORY_RESOLUTION_RESULT", "DOCUMENTARY_PATTERN_CATALOG", "STUDY_TEMPLATE_INSTANCE", "DOCUMENT_PROJECTION", "RENDERER_OUTPUT"].every((type) => types.includes(type));
