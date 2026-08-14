from __future__ import annotations

import unittest

from pydantic import ValidationError

from .adjudicate import BASELINES, CAPABILITIES, MATRIX
from .models import ConversationTurn, InteractiveCase, InteractiveProjection


class InteractiveContractTests(unittest.TestCase):
    def test_negative_answer_is_data_not_stop(self) -> None:
        case = InteractiveCase(
            case_id="negative-is-data",
            conversation_turns=[ConversationTurn(message_id="u1", role="USER", content="Non, le T2 ne sera pas disponible partout.")],
        )
        self.assertTrue(case.conversation_turns[0].content.startswith("Non"))
        projection = InteractiveProjection(state_summary="T2 indisponible sur certains sites", action="FINISH", next_question=None)
        self.assertEqual(projection.action, "FINISH")

    def test_ask_requires_exactly_one_question_field(self) -> None:
        projection = InteractiveProjection(state_summary="État incomplet", action="ASK", next_question="Quel est le critère principal ?")
        self.assertIsNotNone(projection.next_question)

    def test_finish_cannot_hide_a_question(self) -> None:
        with self.assertRaises(ValidationError):
            InteractiveProjection(state_summary="État terminé", action="FINISH", next_question="Encore une question ?")

    def test_capability_matrix_is_complete_without_global_score(self) -> None:
        self.assertEqual(set(MATRIX), set(CAPABILITIES))
        for assessments in MATRIX.values():
            self.assertEqual(set(assessments), set(BASELINES))
            for assessment in assessments.values():
                self.assertIn(assessment["status"], {"PASS", "PARTIAL", "FAIL", "NOT_EVALUABLE", "NOT_TESTED"})


if __name__ == "__main__":
    unittest.main()
