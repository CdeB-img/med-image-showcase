from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from common_contract_ablation_02.campaign import critic_trigger, provider_budget_plan, scenarios, select_question
from common_contract_ablation_02.ledger import ProviderLedger
from common_contract_ablation_02.models import CommonScientificState


def state(**overrides: object) -> CommonScientificState:
    value: dict[str, object] = {
        "originalRequest": "Demande exacte.",
        "conversationTurns": [{"turnId": "T0", "role": "USER", "content": "Demande exacte."}],
        "normalizedUnderstanding": "Compréhension.",
        "scientificGoal": "Objectif.",
        "explicitUserStatements": [],
        "objects": [],
        "relations": [],
        "inferredContext": [],
        "contextualScientificCandidates": [],
        "negationsAndConstraints": [],
        "temporalModel": [],
        "ambiguities": [],
        "missingInformation": [],
        "unknowns": [],
        "correctionsAndSupersessions": [],
        "ownershipAndEpistemicState": [],
        "clarificationCandidates": [],
        "contradictions": [],
    }
    value.update(overrides)
    return CommonScientificState.model_validate(value)


class CampaignContractTests(unittest.TestCase):
    def test_provider_budget_nominal_maximum_is_below_target(self) -> None:
        plan = provider_budget_plan()
        self.assertEqual(plan["nominalMaximum"], 256)
        self.assertLessEqual(plan["nominalMaximum"], plan["target"])
        self.assertEqual(plan["hardStop"], 320)
        self.assertEqual(plan["minimumDailyQuotaPreserved"], 180)

    def test_exact_scenario_identity(self) -> None:
        values = scenarios()
        self.assertEqual([item["scenarioId"] for item in values], [f"I{index:02d}" for index in range(1, 9)])
        self.assertEqual(
            values[0]["t0"],
            "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        )
        self.assertEqual(
            values[-1]["r2"],
            "Je préfère donc partir sur le T1 natif comme candidat principal, mais garder l'ECV exploratoire là où il est disponible.",
        )

    def test_controller_uses_frozen_priority_and_native_order(self) -> None:
        candidates = [
            {
                "clarificationId": "medium",
                "question": "Question medium ?",
                "targetIds": [],
                "priority": "MEDIUM",
                "blocking": True,
                "decisionImpact": "Impact important.",
            },
            {
                "clarificationId": "high-second",
                "question": "Question high native first ?",
                "targetIds": [],
                "priority": "HIGH",
                "blocking": True,
                "decisionImpact": "Impact décisif.",
            },
            {
                "clarificationId": "high-third",
                "question": "Question high native second ?",
                "targetIds": [],
                "priority": "HIGH",
                "blocking": True,
                "decisionImpact": "Impact décisif.",
            },
        ]
        selected = select_question(state(clarificationCandidates=candidates), set())
        self.assertEqual(selected["clarificationId"], "high-second")
        selected_after_answer = select_question(state(clarificationCandidates=candidates), {"question high native first ?"})
        self.assertEqual(selected_after_answer["clarificationId"], "high-third")

    def test_controller_never_selects_low(self) -> None:
        candidate = {
            "clarificationId": "low",
            "question": "Question low ?",
            "targetIds": [],
            "priority": "LOW",
            "blocking": True,
            "decisionImpact": "Faible.",
        }
        self.assertIsNone(select_question(state(clarificationCandidates=[candidate]), set()))

    def test_conditional_critic_trigger_is_content_independent_and_deterministic(self) -> None:
        self.assertEqual(critic_trigger(state()), (False, []))
        required, reasons = critic_trigger(state(contradictions=["Contradiction explicite."]))
        self.assertTrue(required)
        self.assertEqual(reasons, ["CONTRADICTION_PRESENT"])

    def test_explicit_statement_requires_provenance_and_source(self) -> None:
        invalid = {
            "itemId": "explicit-1",
            "content": "contenu",
            "scientificRole": "OBJECT",
            "polarity": "AFFIRMED",
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "ownership": "USER",
            "provenanceTurnIds": [],
            "sourceText": None,
        }
        with self.assertRaises(ValueError):
            state(explicitUserStatements=[invalid])

    def test_ledger_forbids_success_replay(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger = ProviderLedger(Path(directory) / "ledger.jsonl")
            result = ledger.call(
                configuration_id="TEST",
                phase="TEST",
                scenario_id="SYNTHETIC",
                round_id="T0",
                operation="SYNTHETIC",
                operation_key="synthetic:success",
                function=lambda: {"ok": True},
            )
            self.assertEqual(result, {"ok": True})
            with self.assertRaisesRegex(RuntimeError, "SUCCESS_OPERATION_REPLAY_FORBIDDEN"):
                ledger.reserve(
                    configuration_id="TEST",
                    phase="TEST",
                    scenario_id="SYNTHETIC",
                    round_id="T0",
                    operation="SYNTHETIC",
                    operation_key="synthetic:success",
                )

    def test_no_blind_binding_in_experimental_inputs(self) -> None:
        package_root = Path(__file__).resolve().parent
        result_root = package_root.parent / "results" / "common-contract-ablation-02"
        runtime_files = [
            package_root / "campaign.py",
            package_root / "ledger.py",
            package_root / "models.py",
            package_root / "sem_pair_runner.ts",
            package_root / "common-state-system.txt",
            package_root / "conditional-critic-system.txt",
            package_root / "researcher-simulator-system.txt",
            result_root / "scenario-pack-frozen.json",
        ]
        material = "\n".join(path.read_text(encoding="utf-8") for path in runtime_files).casefold()
        self.assertNotIn("sealed-reference", material)
        self.assertNotIn("semantic-validation/sem-003/blind", material)


if __name__ == "__main__":
    unittest.main()
