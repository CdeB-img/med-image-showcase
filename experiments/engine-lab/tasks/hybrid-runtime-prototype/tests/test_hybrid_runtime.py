from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pydantic import ValidationError
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider


TASK_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TASK_ROOT))

from adapters.protocols import InterpreterResult  # noqa: E402
from audit.deterministic_adapter import DeterministicSemanticAuditor  # noqa: E402
from contracts.models import (  # noqa: E402
    AdjudicationOutput,
    AdjudicationResolution,
    Ambiguity,
    CandidateScientificState,
    ClarificationNeed,
    ContextInput,
    ConversationTurn,
    OpenDecision,
    PrimaryScientificInterpretation,
    RuntimeIdentity,
    ScientificElement,
    ScientificRelation,
)
from interpreter.pydantic_primary import RawFirstGoogleModel  # noqa: E402
from pipeline.core import HybridRuntimePipeline  # noqa: E402
from pipeline.projection import build_candidate_state  # noqa: E402
from pipeline.storage import atomic_write_json, read_json  # noqa: E402


def element(
    identity: str,
    content: str,
    *,
    semantic_type: str = "SCIENTIFIC_OBJECT",
    role: str = "NONE",
    polarity: str = "AFFIRMED",
    ownership: str = "USER",
    epistemic: str = "EXPLICIT_USER_STATED",
    active: bool = True,
) -> ScientificElement:
    return ScientificElement(
        elementId=identity,
        content=content,
        semanticIdentity=identity,
        semanticType=semantic_type,
        studyRole=role,
        sourceTurnIds=["T0"],
        sourceText=content,
        polarity=polarity,
        ownership=ownership,
        epistemicStatus=epistemic,
        activeState=active,
    )


def candidate(tmp: Path, interpretation: PrimaryScientificInterpretation | None = None) -> CandidateScientificState:
    raw = tmp / "raw.json"
    atomic_write_json(raw, {
        "rawPersistedAt": "2026-08-14T00:00:00Z",
        "rawResponse": {"text": "scientifically inspectable"},
        "parseResult": "VALID",
    })
    value = interpretation or PrimaryScientificInterpretation(
        normalizedUnderstanding="Étudier une association.",
        objects=[element("object", "association")],
        explicitStatements=[element("explicit", "association")],
    )
    return build_candidate_state(
        conversationId="conversation-test",
        turns=[ConversationTurn(turnId="T0", role="USER", content="association")],
        previousState=None,
        interpretation=value,
        rawOutputRef=str(raw),
        rawDigest="0" * 64,
        runtimeIdentity=RuntimeIdentity(
            runtimeId="TEST_PRIMARY",
            runtimeVersion="0.1.0",
            provider="NONE",
            model="NONE",
            promptDigest="p",
            schemaDigest="s",
            configurationDigest="c",
        ),
        contextInputs=[],
    )


class EmptyAuditor:
    def audit(self, **_: object) -> list:
        return []


class FakePrimary:
    def __init__(self, value: CandidateScientificState):
        self.value = value

    def interpret(self, **_: object) -> InterpreterResult:
        return InterpreterResult(candidate=self.value.model_copy(deep=True), rawOutputRef=self.value.source.rawOutputRef, latencyMs=1, providerCalls=0)


class UnusedAdjudicator:
    def adjudicate(self, **_: object):
        raise AssertionError("adjudicator should not be called")


class FakeResponse:
    def model_dump(self, **_: object) -> dict:
        return {"candidates": [{"content": {"parts": [{"text": "{}"}]}}]}


class HybridRuntimeContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def audit(self, current: CandidateScientificState, previous: CandidateScientificState | None = None):
        return DeterministicSemanticAuditor().audit(
            turns=current.source.turns,
            previousState=previous,
            candidateState=current,
            confirmedDecisionIds=[],
        )

    def test_hyb_c01_raw_provider_output_persisted_before_parsing(self) -> None:
        events: list[str] = []
        model = RawFirstGoogleModel(
            "gemini-3.5-flash-lite",
            provider=GoogleProvider(api_key="not-used"),
            raw_capture=lambda _: events.append("RAW_PERSISTED"),
        )
        with patch.object(GoogleModel, "_process_response", side_effect=lambda _: events.append("PARSED") or "ok"):
            self.assertEqual("ok", model._process_response(FakeResponse()))
        self.assertEqual(["RAW_PERSISTED", "PARSED"], events)

    def test_hyb_c02_all_ablations_share_primary_output(self) -> None:
        current = candidate(self.root)
        pipeline = HybridRuntimePipeline(
            primary=FakePrimary(current),
            deterministicAuditor=EmptyAuditor(),
            semanticAuditor=EmptyAuditor(),
            adjudicator=UnusedAdjudicator(),
            resultRoot=self.root / "results",
        )
        pipeline.run_state(
            scenario="VISIBLE",
            turn="T2",
            conversationId="conversation",
            turns=current.source.turns,
            previousState=None,
            contextInputs=[],
            experimentalFinalState=True,
        )
        record = read_json(self.root / "results" / "consolidated-states" / "visible-t2.json")
        identities = {record[key] for key in ["p0CandidateStateId", "p1CandidateStateId", "p2CandidateStateId", "p3PrimaryCandidateStateId"]}
        self.assertEqual({current.identity.stateId}, identities)

    def test_hyb_c03_deterministic_audit_never_mutates(self) -> None:
        current = candidate(self.root)
        current.relations.append(ScientificRelation(
            relationId="self", sourceElementId="x", targetElementId="x", relationType="ASSOCIATED_WITH",
            sourceTurnIds=["T0"], sourceText="association", polarity="AFFIRMED", ownership="USER",
            epistemicStatus="EXPLICIT_USER_STATED", activeState=True,
        ))
        before = copy.deepcopy(current)
        self.audit(current)
        self.assertEqual(before, current)

    def test_hyb_c04_semantic_audit_returns_findings_only(self) -> None:
        current = candidate(self.root)
        before = current.model_dump(mode="json")
        result = EmptyAuditor().audit(candidateState=current)
        self.assertIsInstance(result, list)
        self.assertEqual(before, current.model_dump(mode="json"))

    def test_hyb_c05_adjudicator_cannot_write_project_adopted(self) -> None:
        with self.assertRaises(ValidationError):
            AdjudicationOutput(
                resolutions=[AdjudicationResolution(
                    resolutionId="r", findingIds=[], action="KEEP_PRIMARY", sourceTurnIds=["T0"], sourceText="association",
                    previousValue=None, resultingValue="PROJECT_ADOPTED", epistemicStatus="CONFIRMED_BY_USER",
                    ownership="PROJECT_ADOPTED", rationale="forbidden",
                )],
                consolidatedInterpretation=None,
                unresolvedFindingIds=[],
                disposition="CANDIDATE_ACCEPTABLE",
            )

    def test_hyb_c06_primary_candidate_cannot_become_adopted_endpoint(self) -> None:
        promoted = element("candidate", "T1 natif", role="PRIMARY_ENDPOINT", epistemic="INFERRED_CANDIDATE")
        promoted.originStatus = "INFERRED_CANDIDATE"
        promoted.adoptionStatus = "PROJECT_ADOPTED"
        current = candidate(self.root, PrimaryScientificInterpretation(normalizedUnderstanding="candidate", contextualCandidates=[promoted]))
        self.assertIn("CANDIDATE_PROMOTED_TO_ADOPTED", {item.findingClass for item in self.audit(current)})

    def test_hyb_c07_local_practice_cannot_become_project_decision(self) -> None:
        local = element("local", "À Lyon ils font de l'ECV", ownership="PROJECT")
        local.originType = "LOCAL_PRACTICE"
        local.adoptionStatus = "PROJECT_ADOPTED"
        current = candidate(self.root, PrimaryScientificInterpretation(normalizedUnderstanding="local", inferredContext=[local]))
        self.assertIn("LOCAL_PRACTICE_PROMOTED_TO_PROJECT", {item.findingClass for item in self.audit(current)})

    def test_hyb_c08_association_cannot_become_causality_after_rejection(self) -> None:
        source = element("oef", "OEF")
        target = element("perfusion", "perfusion")
        negation = element("noncausal", "ne pas dire qu'il la cause", semantic_type="CONSTRAINT", polarity="NEGATED")
        relation = ScientificRelation(
            relationId="r", sourceElementId="oef", targetElementId="perfusion", relationType="CAUSES",
            sourceTurnIds=["T0"], sourceText="associé", polarity="AFFIRMED", ownership="USER",
            epistemicStatus="EXPLICIT_USER_STATED", activeState=True,
        )
        current = candidate(self.root, PrimaryScientificInterpretation(
            normalizedUnderstanding="causal", objects=[source, target], relations=[relation], negationsAndConstraints=[negation],
        ))
        self.assertIn("CAUSAL_PROMOTION", {item.findingClass for item in self.audit(current)})

    def test_hyb_c09_rejected_state_cannot_remain_active(self) -> None:
        rejected = element("strain", "strain", epistemic="REJECTED_BY_USER", active=True)
        current = candidate(self.root, PrimaryScientificInterpretation(normalizedUnderstanding="rejected", objects=[rejected]))
        self.assertIn("HISTORICAL_STATE_REMAINS_ACTIVE", {item.findingClass for item in self.audit(current)})

    def test_hyb_c10_unknown_cannot_be_confirmed_without_new_source(self) -> None:
        previous_item = element("measure", "mesure principale", epistemic="UNKNOWN")
        previous = candidate(self.root / "previous", PrimaryScientificInterpretation(normalizedUnderstanding="unknown", objects=[previous_item]))
        current_item = element("measure", "mesure principale", epistemic="CONFIRMED_BY_USER")
        current = candidate(self.root / "current", PrimaryScientificInterpretation(normalizedUnderstanding="confirmed", objects=[current_item]))
        self.assertIn("UNSUPPORTED_INVENTION", {item.findingClass for item in self.audit(current, previous)})

    def test_hyb_c11_self_relation_is_detected(self) -> None:
        current = candidate(self.root)
        current.relations = [ScientificRelation(
            relationId="r", sourceElementId="same", targetElementId="same", relationType="ASSOCIATED_WITH",
            sourceTurnIds=["T0"], sourceText="association", polarity="AFFIRMED", ownership="USER",
            epistemicStatus="EXPLICIT_USER_STATED", activeState=True,
        )]
        self.assertIn("SELF_REFERENTIAL_RELATION", {item.findingClass for item in self.audit(current)})

    def test_hyb_c12_partial_availability_remains_partial(self) -> None:
        partial = element("lge", "LGE pas disponible partout")
        partial.availabilityScope = "PARTIAL"
        partial.availabilityClaim = "PARTIAL"
        current = candidate(self.root, PrimaryScientificInterpretation(normalizedUnderstanding="partial", objects=[partial]))
        self.assertNotIn("LOCAL_PRACTICE_PROMOTED_TO_PROJECT", {item.findingClass for item in self.audit(current)})
        self.assertEqual("PARTIAL", current.objects[0].availabilityScope)

    def test_hyb_c13_contextual_candidate_remains_candidate(self) -> None:
        contextual = element("mvo", "MVO", ownership="SEM_CANDIDATE", epistemic="INFERRED_CANDIDATE")
        contextual.originStatus = "INFERRED_CANDIDATE"
        contextual.adoptionStatus = "CANDIDATE"
        current = candidate(self.root, PrimaryScientificInterpretation(normalizedUnderstanding="candidate", contextualCandidates=[contextual]))
        self.assertNotIn("CANDIDATE_PROMOTED_TO_ADOPTED", {item.findingClass for item in self.audit(current)})

    def test_hyb_c14_schema_failure_raw_remains_scientifically_inspectable(self) -> None:
        current = candidate(self.root)
        current.technicalStatus = "STRUCTURED_CONTRACT_FAILURE"
        raw = read_json(Path(current.source.rawOutputRef))
        self.assertEqual("scientifically inspectable", raw["rawResponse"]["text"])
        self.assertEqual("STRUCTURED_CONTRACT_FAILURE", current.technicalStatus)

    def test_hyb_c15_lost_raw_is_critical_pipeline_failure(self) -> None:
        current = candidate(self.root)
        Path(current.source.rawOutputRef).unlink()
        findings = self.audit(current)
        raw = next(item for item in findings if item.findingClass == "RAW_OUTPUT_NOT_PERSISTED")
        self.assertEqual("CRITICAL", raw.severity)

    def test_hyb_c16_qry_receives_open_decisions_not_project_truth(self) -> None:
        current = candidate(self.root)
        current.openDecisions = [OpenDecision(
            decisionId="d", content="mesure principale", decisionOwner="RESEARCH_PROJECT", status="OPEN",
        )]
        current.clarificationNeeds = [ClarificationNeed(
            clarificationId="q", targetUnknown="mesure principale", decisionalImpact="HIGH",
            affectedDecisions=["d"], affectedBranches=["primary-analysis"], blocking=True,
            candidateQuestionIntent="clarify principal measure", resolutionOwner="USER",
        )]
        self.assertEqual("OPEN", current.openDecisions[0].status)
        self.assertNotIn("PROJECT_ADOPTED", current.model_dump_json())

    def test_hyb_c17_runtime_core_contains_no_case_identifier(self) -> None:
        roots = [TASK_ROOT / name for name in ["adapters", "interpreter", "audit", "adjudication", "pipeline", "contracts"]]
        material = "\n".join(path.read_text(encoding="utf-8") for root in roots for path in root.rglob("*.py"))
        self.assertNotIn("caseId", material)

    def test_hyb_c18_no_blind_path_is_read(self) -> None:
        roots = [TASK_ROOT / name for name in ["adapters", "interpreter", "audit", "adjudication", "pipeline", "contracts"]]
        material = "\n".join(path.read_text(encoding="utf-8") for root in roots for path in root.rglob("*.*") if path.suffix in {".py", ".ts"})
        self.assertNotIn("semantic-validation/sem-003/blind", material)
        self.assertNotIn("sealed-reference", material)


if __name__ == "__main__":
    unittest.main()
