from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


TASK_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(TASK_DIR))
spec = importlib.util.spec_from_file_location("semantic_audit_guard_matrix", TASK_DIR / "semantic_audit.py")
semantic_audit = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(semantic_audit)


def payload() -> dict:
    return {
        "conversationTurns": [{"turnId": "T0", "text": "source"}],
        "previousState": {"items": [], "relations": [], "ambiguities": [], "clarifications": []},
        "candidateState": {"items": [], "relations": [], "ambiguities": [], "clarifications": [], "corrections": []},
        "confirmedDecisionIds": [],
        "constraints": [],
        "rawProviderOutput": {"persisted": True},
    }


def finding_classes(value: dict) -> set[str]:
    return {finding["findingClass"] for finding in semantic_audit.audit_semantic_integrity(value)}


def item(identity: str, concept_class: str, epistemic_status: str = "EXPLICIT_USER_STATED") -> dict:
    return {
        "itemId": identity,
        "semanticIdentity": identity,
        "label": identity,
        "conceptClass": concept_class,
        "epistemicStatus": epistemic_status,
        "ownership": "USER",
        "active": True,
        "sourceTurnIds": ["T0"],
        "sourceText": "source",
    }


class DeterministicGuardMatrixTests(unittest.TestCase):
    def test_g05_supersession_requires_changed_meaning(self) -> None:
        value = payload()
        value["candidateState"]["corrections"] = [
            {
                "correctionId": "same",
                "previousSemanticIdentity": "identity-a",
                "currentSemanticIdentity": "identity-a",
                "disposition": "SUPERSEDED",
                "sourceTurnIds": ["T0"],
                "sourceText": "source",
            }
        ]
        self.assertIn("SUPERSESSION_ERROR", finding_classes(value))

    def test_g07_method_measurement_and_phenomenon_observable_planes(self) -> None:
        method_value = payload()
        method_value["previousState"]["items"] = [item("identity-a", "METHOD")]
        method_value["candidateState"]["items"] = [item("identity-a", "MEASURE")]
        self.assertIn("METHOD_MEASUREMENT_COLLAPSE", finding_classes(method_value))

        phenomenon_value = payload()
        phenomenon_value["previousState"]["items"] = [item("identity-b", "PHENOMENON")]
        phenomenon_value["candidateState"]["items"] = [item("identity-b", "OBSERVABLE_PROPERTY")]
        self.assertIn("PHENOMENON_OBSERVABLE_COLLAPSE", finding_classes(phenomenon_value))

    def test_g09_explicit_negation_remains_active(self) -> None:
        value = payload()
        previous = item("identity-a", "ENDPOINT_ROLE")
        previous["polarity"] = "NEGATED"
        candidate = item("identity-a", "ENDPOINT_ROLE")
        candidate["polarity"] = "AFFIRMED"
        value["previousState"]["items"] = [previous]
        value["candidateState"]["items"] = [candidate]
        self.assertIn("POLARITY_CONFLICT", finding_classes(value))

    def test_g11_answered_clarification_is_not_left_open(self) -> None:
        value = payload()
        value["candidateState"]["clarifications"] = [
            {
                "clarificationId": "question-a",
                "normalizedQuestion": "question",
                "status": "OPEN",
                "answerTurnIds": ["T0"],
                "sourceTurnIds": ["T0"],
                "sourceText": "source",
            }
        ]
        self.assertIn("HISTORICAL_STATE_REMAINS_ACTIVE", finding_classes(value))

    def test_g12_unknown_requires_new_source_before_confirmation(self) -> None:
        value = payload()
        previous = item("identity-a", "OBSERVABLE_PROPERTY", "UNKNOWN")
        candidate = item("identity-a", "OBSERVABLE_PROPERTY", "CONFIRMED_BY_USER")
        value["previousState"]["items"] = [previous]
        value["candidateState"]["items"] = [candidate]
        self.assertIn("UNSUPPORTED_INVENTION", finding_classes(value))


if __name__ == "__main__":
    unittest.main()
