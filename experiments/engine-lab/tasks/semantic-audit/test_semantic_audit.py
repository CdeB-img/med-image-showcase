from __future__ import annotations

import copy
import importlib.util
import json
import re
import sys
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


TASK_DIR = Path(__file__).resolve().parent
LAB_DIR = TASK_DIR.parents[1]
FIXTURE_DIR = TASK_DIR / "fixtures"
sys.path.insert(0, str(TASK_DIR))

spec = importlib.util.spec_from_file_location("semantic_audit", TASK_DIR / "semantic_audit.py")
semantic_audit = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(semantic_audit)
audit_semantic_integrity = semantic_audit.audit_semantic_integrity


def load_variant(filename: str, fixture_id: str) -> dict:
    fixture = json.loads((FIXTURE_DIR / filename).read_text(encoding="utf-8"))
    return next(variant for variant in fixture["variants"] if variant["fixtureId"] == fixture_id)


def classes(findings: list[dict]) -> set[str]:
    return {finding["findingClass"] for finding in findings}


def minimal_payload() -> dict:
    return {
        "conversationTurns": [{"turnId": "T0", "text": "source"}],
        "previousState": {"items": [], "relations": [], "ambiguities": [], "clarifications": []},
        "candidateState": {"items": [], "relations": [], "ambiguities": [], "clarifications": [], "corrections": []},
        "confirmedDecisionIds": [],
        "constraints": [],
        "rawProviderOutput": {"persisted": True},
    }


class SemanticAuditContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        schema = json.loads((LAB_DIR / "contracts" / "semantic-audit-finding.schema.json").read_text(encoding="utf-8"))
        cls.finding_validator = Draft202012Validator(schema)

    def assert_valid_findings(self, findings: list[dict]) -> None:
        for finding in findings:
            errors = list(self.finding_validator.iter_errors(finding))
            self.assertEqual([], errors, [error.message for error in errors])

    def test_aud_c01_findings_only_and_input_not_mutated(self) -> None:
        payload = minimal_payload()
        payload["candidateState"]["relations"] = [
            {
                "relationId": "r",
                "sourceId": "x",
                "targetId": "x",
                "relationType": "ASSOCIATED_WITH",
                "sourceTurnIds": ["T0"],
                "sourceText": "source",
            }
        ]
        before = copy.deepcopy(payload)
        result = audit_semantic_integrity(payload)
        self.assertIsInstance(result, list)
        self.assertNotIsInstance(result, dict)
        self.assertEqual(before, payload)
        self.assert_valid_findings(result)

    def test_aud_c02_core_contains_no_scenario_identifier(self) -> None:
        core = (TASK_DIR / "semantic_audit.py").read_text(encoding="utf-8")
        guards = (TASK_DIR / "guards.py").read_text(encoding="utf-8")
        self.assertNotIn("caseId", core + guards)
        self.assertIsNone(re.search(r"\bI0[1-8]\b", core + guards))

    def test_aud_c03_candidate_primary_to_adopted_is_detected(self) -> None:
        variant = load_variant("i08-endpoint-promotion.json", "I08_PRIMARY_CANDIDATE_PROMOTED")
        findings = audit_semantic_integrity(variant["input"])
        self.assertIn("CANDIDATE_PROMOTED_TO_ADOPTED", classes(findings))
        self.assert_valid_findings(findings)

    def test_aud_c04_local_practice_to_project_is_detected(self) -> None:
        payload = minimal_payload()
        payload["candidateState"]["items"] = [
            {
                "itemId": "local",
                "semanticIdentity": "local-practice",
                "label": "local practice",
                "conceptClass": "METHOD",
                "originType": "LOCAL_PRACTICE",
                "adoptionStatus": "PROJECT_ADOPTED",
                "ownership": "PROJECT",
                "active": True,
                "sourceTurnIds": ["T0"],
                "sourceText": "source",
            }
        ]
        findings = audit_semantic_integrity(payload)
        self.assertIn("LOCAL_PRACTICE_PROMOTED_TO_PROJECT", classes(findings))
        self.assert_valid_findings(findings)

    def test_aud_c05_causality_despite_negation_is_detected(self) -> None:
        variant = load_variant("i07-association-causality.json", "I07_POSITIVE_CAUSALITY_CONFLICT")
        findings = audit_semantic_integrity(variant["input"])
        self.assertIn("CAUSAL_PROMOTION", classes(findings))
        self.assert_valid_findings(findings)

    def test_aud_c06_self_referential_relation_is_detected(self) -> None:
        payload = minimal_payload()
        payload["candidateState"]["relations"] = [
            {
                "relationId": "r",
                "sourceId": "same",
                "targetId": "same",
                "relationType": "ASSOCIATED_WITH",
                "sourceTurnIds": ["T0"],
                "sourceText": "source",
            }
        ]
        findings = audit_semantic_integrity(payload)
        self.assertIn("SELF_REFERENTIAL_RELATION", classes(findings))
        self.assert_valid_findings(findings)

    def test_aud_c07_rejected_or_superseded_active_is_detected(self) -> None:
        payload = minimal_payload()
        payload["candidateState"]["items"] = [
            {
                "itemId": "old",
                "semanticIdentity": "old-state",
                "label": "old state",
                "conceptClass": "PROJECT_VARIABLE",
                "lifecycleStatus": "SUPERSEDED",
                "active": True,
                "sourceTurnIds": ["T0"],
                "sourceText": "source",
            }
        ]
        findings = audit_semantic_integrity(payload)
        self.assertIn("HISTORICAL_STATE_REMAINS_ACTIVE", classes(findings))
        self.assert_valid_findings(findings)

    def test_aud_c08_missing_provenance_is_detected(self) -> None:
        payload = minimal_payload()
        payload["candidateState"]["items"] = [
            {
                "itemId": "untraced",
                "semanticIdentity": "untraced",
                "label": "untraced",
                "conceptClass": "OBSERVABLE_PROPERTY",
                "active": True,
                "sourceTurnIds": [],
                "sourceText": None,
            }
        ]
        findings = audit_semantic_integrity(payload)
        self.assertIn("PROVENANCE_GAP", classes(findings))
        self.assert_valid_findings(findings)

    def test_aud_c09_noncausal_association_has_no_false_positive(self) -> None:
        variant = load_variant("i07-association-causality.json", "I07_NON_CAUSAL_ASSOCIATION_PRESERVED")
        findings = audit_semantic_integrity(variant["input"])
        self.assertTrue(classes(findings).isdisjoint(variant["forbiddenFindingClasses"]))
        self.assert_valid_findings(findings)

    def test_aud_c10_preserved_candidate_has_no_false_positive(self) -> None:
        variant = load_variant("i08-endpoint-promotion.json", "I08_SINGLE_PASS_CANDIDATE_PRESERVED")
        findings = audit_semantic_integrity(variant["input"])
        self.assertTrue(classes(findings).isdisjoint(variant["forbiddenFindingClasses"]))
        self.assert_valid_findings(findings)

    def test_aud_c11_raw_absence_is_technical_finding_only(self) -> None:
        variant = load_variant("i04-partial-availability.json", "I04_PARTIAL_AVAILABILITY_RAW_MISSING")
        findings = audit_semantic_integrity(variant["input"])
        self.assertEqual({"RAW_OUTPUT_NOT_PERSISTED"}, classes(findings))
        self.assertNotIn("SCIENTIFIC_UNDERSTANDING_FAILURE", classes(findings))
        self.assert_valid_findings(findings)

    def test_aud_c12_no_finding_is_automatically_applied(self) -> None:
        variants = [
            load_variant("i08-endpoint-promotion.json", "I08_PRIMARY_CANDIDATE_PROMOTED"),
            load_variant("i07-association-causality.json", "I07_POSITIVE_CAUSALITY_CONFLICT"),
            load_variant("i04-partial-availability.json", "I04_PARTIAL_AVAILABILITY_PROMOTED"),
        ]
        findings = [finding for variant in variants for finding in audit_semantic_integrity(variant["input"])]
        self.assertGreater(len(findings), 0)
        self.assertTrue(all(finding["autoFixAllowed"] is False for finding in findings))
        self.assertTrue(all(finding["status"] == "OPEN" for finding in findings))
        self.assert_valid_findings(findings)


if __name__ == "__main__":
    unittest.main()
