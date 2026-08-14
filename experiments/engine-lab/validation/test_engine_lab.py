from __future__ import annotations

import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


LAB_DIR = Path(__file__).resolve().parents[1]


def load(path: str) -> dict:
    return json.loads((LAB_DIR / path).read_text(encoding="utf-8"))


def valid_manifest(mode: str, promotion_decision_id: str | None = None, tuning: bool | None = None) -> dict:
    manifest = {
        "experimentId": "experiment-visible-001",
        "status": "EXPERIMENTAL_SANDBOX",
        "mode": mode,
        "track": "COMMON_TASK_TRACK",
        "taskId": "SEMANTIC_RECONSTRUCTION",
        "engineIds": ["PYDANTICAI"],
        "inputDigest": "sha256:input",
        "configurationDigest": "sha256:configuration",
        "nativeOutputPersistenceRequired": True,
        "normativeAuthority": "NONE",
        "productWriteAllowed": False,
        "promotionDecisionId": promotion_decision_id,
        "createdAt": "2026-08-14T00:00:00Z",
    }
    if tuning is not None:
        manifest["tuningAfterObservationAllowed"] = tuning
    return manifest


class EngineLabContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest_schema = load("contracts/experiment-manifest.schema.json")
        cls.manifest_validator = Draft202012Validator(cls.manifest_schema)
        cls.native_schema = load("contracts/native-output-record.schema.json")
        cls.run_schema = load("contracts/run-record.schema.json")
        cls.engines = load("registry/engine-registry.json")["engines"]
        cls.assets = load("registry/documentary-asset-registry.json")["assets"]

    def test_lab_c01_no_normative_authority(self) -> None:
        manifest = valid_manifest("DISCOVERY", tuning=True)
        self.assertFalse(list(self.manifest_validator.iter_errors(manifest)))
        self.assertEqual("NONE", manifest["normativeAuthority"])
        self.assertTrue(all(load(path)["status"] == "EXPERIMENTAL_SANDBOX" for path in [
            "registry/capability-registry.json",
            "registry/engine-registry.json",
            "registry/model-registry.json",
            "registry/task-registry.json",
            "registry/documentary-asset-registry.json",
            "registry/transition-registry.json",
        ]))

    def test_lab_c02_discovery_can_tune_own_prompts_and_adapters(self) -> None:
        manifest = valid_manifest("DISCOVERY", tuning=True)
        self.assertFalse(list(self.manifest_validator.iter_errors(manifest)))

    def test_lab_c03_frozen_comparison_rejects_post_observation_tuning(self) -> None:
        manifest = valid_manifest("FROZEN_COMPARISON", tuning=True)
        self.assertTrue(list(self.manifest_validator.iter_errors(manifest)))
        manifest["tuningAfterObservationAllowed"] = False
        self.assertFalse(list(self.manifest_validator.iter_errors(manifest)))

    def test_lab_c04_native_output_is_captured_before_validation(self) -> None:
        native = {
            "runId": "run-1",
            "capturedAt": "2026-08-14T00:00:00Z",
            "captureOrder": "BEFORE_PARSING_VALIDATION_OR_REJECTION",
            "nativeOutputType": "text",
            "nativeRawOutput": "raw",
            "providerStatus": "SUCCESS",
            "parsingStatus": "NOT_ATTEMPTED",
            "structuredContractStatus": "NOT_ATTEMPTED",
            "normalizationArtifactPath": None,
        }
        self.assertFalse(list(Draft202012Validator(self.native_schema).iter_errors(native)))
        native["captureOrder"] = "AFTER_VALIDATION"
        self.assertTrue(list(Draft202012Validator(self.native_schema).iter_errors(native)))

    def test_lab_c05_technical_and_cognitive_failures_are_separate(self) -> None:
        technical = self.run_schema["properties"]["technicalDisposition"]["enum"]
        scientific = self.run_schema["properties"]["scientificDisposition"]["enum"]
        self.assertIn("WIRING_FAILURE", technical)
        self.assertNotIn("WIRING_FAILURE", scientific)
        self.assertIn("FAIL", scientific)
        self.assertNotIn("FAIL", technical)

    def test_lab_c06_native_output_is_not_replaced_by_normalization(self) -> None:
        required = set(self.native_schema["required"])
        self.assertIn("nativeRawOutput", required)
        self.assertIn("normalizationArtifactPath", required)
        self.assertNotEqual("nativeRawOutput", "normalizationArtifactPath")

    def test_lab_c07_experiment_cannot_write_product_project(self) -> None:
        manifest = valid_manifest("DISCOVERY", tuning=True)
        manifest["productWriteAllowed"] = True
        self.assertTrue(list(self.manifest_validator.iter_errors(manifest)))

    def test_lab_c08_product_candidate_requires_explicit_decision(self) -> None:
        missing = valid_manifest("PRODUCT_CANDIDATE")
        self.assertTrue(list(self.manifest_validator.iter_errors(missing)))
        explicit = valid_manifest("PRODUCT_CANDIDATE", promotion_decision_id="human-decision-001")
        self.assertFalse(list(self.manifest_validator.iter_errors(explicit)))

    def test_lab_c09_engines_are_registered_by_role(self) -> None:
        self.assertTrue(all(engine["rolesSupported"] for engine in self.engines))
        role_sets = {tuple(engine["rolesSupported"]) for engine in self.engines}
        self.assertGreater(len(role_sets), 3)
        self.assertTrue(all("recommendedRole" in engine for engine in self.engines))

    def test_lab_c10_installed_framework_can_be_non_competitor(self) -> None:
        statuses = {engine["engineId"]: engine["currentStatus"] for engine in self.engines}
        self.assertEqual("NOT_A_DIRECT_COMPETITOR", statuses["GUARDRAILS_AI"])
        self.assertEqual("NOT_A_DIRECT_COMPETITOR", statuses["GRAPHITI"])

    def test_lab_c11_documentary_assets_preserve_provenance_and_risk(self) -> None:
        self.assertTrue(all(asset["provenanceAvailable"] for asset in self.assets))
        self.assertTrue(all(asset["generalizationRisk"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"} for asset in self.assets))
        self.assertTrue(all(asset["preservationRequirement"] for asset in self.assets))

    def test_lab_c12_local_practice_is_not_general_rule(self) -> None:
        local = next(asset for asset in self.assets if asset["assetClass"] == "LOCAL_PRACTICE")
        self.assertEqual("LOCAL_EVIDENCE_ONLY", local["authorityLevel"])
        self.assertEqual("CRITICAL", local["generalizationRisk"])
        self.assertIn("Never promote local practice", local["preservationRequirement"])


if __name__ == "__main__":
    unittest.main()
