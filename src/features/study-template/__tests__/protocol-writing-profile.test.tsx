import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { composeProtocolWritingProfile, PROTOCOL_STRUCTURE_SOURCES } from "../protocol-writing-profile";
import { buildProjectContextSnapshot, type ProjectContextSnapshot } from "../../research-project-construction/canonical-project-backbone";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { workingRevisionFixture } from "../../document-projection/__tests__/working-revision-fixture";
import { prepareDrciDraftPack, prepareDrciGenerationBatches } from "../../document-projection/drci-draft-contract";
import { authorizeResearchProjectDocumentHandoff } from "../../research-project-construction";
import { buildCanonicalCrfPackage } from "../../document-projection/study-deliverable-portfolio";
import ProtocolWritingOutline from "../../document-projection/ProtocolWritingOutline";

const updated = (source: ProjectContextSnapshot, change: (value: ProjectContextSnapshot) => void) => {
  const next = structuredClone(source); change(next);
  const { snapshotDigest: _digest, ...material } = next;
  return { ...material, snapshotDigest: logicalDigest(material) };
};
describe("Original TMP protocol writing profiles / structure is not truth", () => {
  it("composes common + observational + cohort + imaging from current adopted native signals", async () => {
    const run = await workingRevisionFixture(), snapshot = buildProjectContextSnapshot({ project: run.project2 });
    const source = updated(snapshot, next => {
      const design = next.objects.find(object => object.type === "STUDY_DESIGN")!;
      design.content = "Cohorte observationnelle prospective"; design.scientificRole = "PROSPECTIVE_LONGITUDINAL_COHORT";
    });
    const before = JSON.stringify(source), profile = composeProtocolWritingProfile(source);
    expect(profile.profiles).toEqual(["COMMON_CORE", "OBSERVATIONAL", "COHORT", "IMAGING"]);
    expect(profile.sections.some(value => value.sectionId === "ALLOCATION")).toBe(false);
    expect(profile.sections.some(value => value.sectionId === "COHORT_ORIGIN")).toBe(true);
    expect(JSON.stringify(source)).toBe(before); expect(composeProtocolWritingProfile(source)).toEqual(profile);
  });
  it("interventional profile is structure only, with no inferred RIPH or method", async () => {
    const run = await workingRevisionFixture(), source = buildProjectContextSnapshot({ project: run.project2 });
    // The base fixture explicitly states multicentricity, not the study family.
    // A drug name alone must not silently activate an interventional profile.
    expect(composeProtocolWritingProfile(source).profiles).not.toContain("INTERVENTIONAL");
    const profile = composeProtocolWritingProfile(updated(source, next => { next.objects.find(object => object.type === "STUDY_DESIGN")!.content = "Étude interventionnelle randomisée"; }));
    expect(profile.profiles).toContain("INTERVENTIONAL");
    expect(profile.sections.find(value => value.sectionId === "ALLOCATION")?.purpose).toContain("ne pas imposer");
    expect(profile.boundary).toBe("ORIGINAL_STRUCTURE_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_AUTHORITY");
    expect("regulatoryClassification" in profile).toBe(false);
  });
  it("retains the real Working Draft ASSUMED boundary while using exact adopted decisions for structure", async () => {
    const run = await workingRevisionFixture(), source = buildProjectContextSnapshot({ project: run.project2 });
    const adopted = updated(source, next => {
      next.objects.forEach(object => { object.epistemicState = "ASSUMED"; });
      next.objects.find(object => object.type === "STUDY_DESIGN")!.content = "Étude observationnelle prospective monocentrique";
    });
    const before = JSON.stringify(adopted), profile = composeProtocolWritingProfile(adopted);
    expect(profile.profiles).toEqual(["COMMON_CORE", "OBSERVATIONAL", "IMAGING"]);
    expect(profile.basisRefs).toContain(adopted.objects.find(object => object.type === "STUDY_DESIGN")!.versionRef);
    expect(profile.project.projectDigest).toBe(run.project2.projectDigest);
    expect(JSON.stringify(adopted)).toBe(before);
    expect(adopted.objects.every(object => object.epistemicState === "ASSUMED")).toBe(true);
    expect(composeProtocolWritingProfile(adopted)).toEqual(profile);
  });
  it("does not activate an assumed design without its exact native adoption binding", async () => {
    const run = await workingRevisionFixture(), source = buildProjectContextSnapshot({ project: run.project2 });
    for (const mode of ["MISSING_REF", "FOREIGN_REF", "OTHER_OBJECT"] as const) {
      const unbound = updated(source, next => {
        next.objects.forEach(object => { object.epistemicState = "ASSUMED"; });
        const design = next.objects.find(object => object.type === "STUDY_DESIGN")!;
        design.content = "Étude observationnelle prospective";
        next.objects = [design];
        if (mode === "MISSING_REF") design.decisionRefs = [];
        else if (mode === "FOREIGN_REF") design.decisionRefs = ["foreign-human-decision"];
        else next.decisionLedger.forEach(decision => { decision.objectRefs = decision.objectRefs.filter(ref => ref !== design.stableId); });
      });
      expect(composeProtocolWritingProfile(unbound).profiles).toEqual(["COMMON_CORE"]);
    }
  });
  it("does not promote adopted unknown or withheld content into a structural requirement", async () => {
    const run = await workingRevisionFixture(), source = buildProjectContextSnapshot({ project: run.project2 });
    for (const state of ["UNKNOWN", "WITHHELD"] as const) {
      const unresolved = updated(source, next => {
        next.objects.forEach(object => { object.epistemicState = state; });
        next.objects.find(object => object.type === "STUDY_DESIGN")!.content = "Étude observationnelle prospective";
      });
      expect(composeProtocolWritingProfile(unresolved).profiles).toEqual(["COMMON_CORE"]);
    }
  });
  it("unknown/withheld/negated science does not activate a conditional profile", async () => {
    const run = await workingRevisionFixture(), source = buildProjectContextSnapshot({ project: run.project2 });
    const none = updated(source, next => {
      next.objects = next.objects.map(object => ["STUDY_DESIGN", "IMAGING_MODALITY", "ACQUISITION"].includes(object.type)
        ? { ...object, polarity: "NEGATED" } : object);
    });
    expect(composeProtocolWritingProfile(none).profiles).toEqual(["COMMON_CORE"]);
    const unknown = updated(source, next => { next.objects.forEach(object => { object.epistemicState = "UNKNOWN"; }); });
    expect(composeProtocolWritingProfile(unknown).profiles).toEqual(["COMMON_CORE"]);
  });
  it("rejects an unverified snapshot and exposes source scope/licensing without importing template prose", async () => {
    const run = await workingRevisionFixture(), source = buildProjectContextSnapshot({ project: run.project2 });
    expect(() => composeProtocolWritingProfile({ ...source, sourceProjectDigest: "foreign" })).toThrow("TMP_PROTOCOL_PROFILE_BINDING_MISMATCH");
    expect(PROTOCOL_STRUCTURE_SOURCES.every(value => value.retrievedAt === "2026-10-09" && value.rights && value.limitations && value.verification)).toBe(true);
    render(<ProtocolWritingOutline profile={composeProtocolWritingProfile(source)} />);
    expect(screen.getByText(/ne vaut pas qualification réglementaire/u)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Recommended format/u, hidden: true })).toHaveAttribute("href", "https://www.who.int/groups/research-ethics-review-committee/recommended-format-for-a-research-protocol"); cleanup();
  });
  it("native DOC scopes retain the same versioned profile and exact Project, with no archive mutation", async () => {
    const run = await workingRevisionFixture(), before = run.fixture.bodies();
    const handoffDecision = authorizeResearchProjectDocumentHandoff({ project: run.project2, authority: { actorRef: "synthetic-owner", mandateRef: "PROJECT_OWNER", authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED" }, confirmedAt: "2026-10-09T03:00:00Z" });
    const packet = prepareDrciDraftPack(run.project2, { handoffDecision, protocolProjection: run.g2.projection, crf: buildCanonicalCrfPackage(run.project2) });
    const guide = JSON.parse(packet.context).PROTOCOL_WRITING_PROFILE;
    expect(guide.project.projectDigest).toBe(run.project2.projectDigest);
    const scopes = prepareDrciGenerationBatches(packet);
    expect(scopes.every(scope => JSON.parse(scope.context).PROTOCOL_WRITING_PROFILE.profileDigest === guide.profileDigest)).toBe(true);
    expect(packet.instruction).toContain("pas une source de faits"); expect(run.fixture.bodies()).toEqual(before);
  });
});
