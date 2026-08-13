from __future__ import annotations

import importlib
import json
from pathlib import Path
import sys
import unittest

from jsonschema import Draft7Validator


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = ROOT.parents[1]
sys.path.insert(0, str(ROOT))

from adapters.common import normalize_projection  # noqa: E402
from adapters.evaluator_bridge import EvaluatorBinding, KeyBinding, OwnershipBinding, bind_to_sem003_evaluator_1_1_0  # noqa: E402
from adapters.sem_current import normalize_sem_response  # noqa: E402
from contracts.projection import (  # noqa: E402
    ComparativeCaseInput,
    ConversationTurn,
    NativeConcept,
    NativeRelation,
    ScientificUnderstandingProjection,
    SourceEvidence,
)


def case() -> ComparativeCaseInput:
    return ComparativeCaseInput(
        caseId="SEM3-DEV-COMPARATIVE-TEST",
        caseVersion="1.0.0",
        language="fr",
        conversationTurns=[ConversationTurn(messageId="m1", role="USER", content="Comparer A et B sans causalité.")],
    )


def projection() -> ScientificUnderstandingProjection:
    return ScientificUnderstandingProjection(
        language="fr",
        normalizedMeaning="Comparer A et B sans causalité",
        concepts=[
            NativeConcept(conceptId="a", semanticKey="concept.a", label="A", conceptType="OBJECT", studyRole="SUBJECT", polarity="AFFIRMED", epistemicStatus="EXPLICIT_USER_STATED", sourceEvidence=[SourceEvidence(messageId="m1", quote="A")], confidence=1),
            NativeConcept(conceptId="b", semanticKey="concept.b", label="B", conceptType="OBJECT", studyRole="COMPARATOR", polarity="AFFIRMED", epistemicStatus="EXPLICIT_USER_STATED", sourceEvidence=[SourceEvidence(messageId="m1", quote="B")], confidence=1),
        ],
        relations=[
            NativeRelation(relationId="compare-a-b", semanticKey="relation.a.compared-with.b", sourceConceptId="a", targetConceptId="b", predicate="COMPARED_WITH", polarity="AFFIRMED", epistemicStatus="EXPLICIT_USER_STATED", sourceEvidence=[SourceEvidence(messageId="m1", quote="Comparer A et B")], confidence=1)
        ],
    )


class ComparativeBaselineTests(unittest.TestCase):
    def test_common_normalizer_preserves_counts_and_source_ids(self):
        native = projection()
        normalized = normalize_projection(baseline_id="SEM003C1-INSTRUCTOR-PYDANTIC-01", run_id="run-1", case=case(), native=native)
        self.assertEqual(len(normalized.semanticElements), 2)
        self.assertEqual(len(normalized.semanticRelations), 1)
        self.assertEqual({item.sourceNativeId for item in normalized.semanticElements}, {"a", "b"})

    def test_common_normalizer_is_digest_stable(self):
        first = normalize_projection(baseline_id="SEM003C1-INSTRUCTOR-PYDANTIC-01", run_id="run-1", case=case(), native=projection())
        second = normalize_projection(baseline_id="SEM003C1-INSTRUCTOR-PYDANTIC-01", run_id="run-1", case=case(), native=projection())
        self.assertEqual(first.nativeOutputDigest, second.nativeOutputDigest)

    def test_relation_to_absent_concept_is_rejected(self):
        native = projection().model_dump()
        native["relations"][0]["targetConceptId"] = "missing"
        with self.assertRaises(ValueError):
            ScientificUnderstandingProjection.model_validate(native)

    def test_sem_degraded_output_is_provider_failure_not_semantic_success(self):
        normalized = normalize_sem_response(run_id="run-1", case=case(), response={"mode": "DEGRADED", "providerStatus": "FAILED_CALL", "model": {}})
        self.assertEqual(normalized.executionStatus, "PROVIDER_FAILURE")
        self.assertEqual(normalized.semanticElements, [])

    def test_bridge_exact_key_mapping_only(self):
        normalized = normalize_projection(baseline_id="SEM003C1-INSTRUCTOR-PYDANTIC-01", run_id="run-1", case=case(), native=projection())
        binding = EvaluatorBinding(
            candidateId="SEM3-EVAL-CAND-COMPARATIVE-TEST",
            caseId=case().caseId,
            caseVersion="1.0.0",
            envelopeId="SEM3-AE-COMPARATIVE-TEST",
            envelopeVersion="1.0.0",
            purpose="SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT",
            requirements=[KeyBinding(referenceId="req-a", acceptedSemanticKeys=["concept.a"]), KeyBinding(referenceId="req-missing", acceptedSemanticKeys=["concept.absent"])],
            prohibitions=[],
            optionalCandidates=[],
            ambiguities=[],
            ownershipBoundaries=[OwnershipBinding(boundaryId="own-project", prohibitedAdoptedSemanticKeys=["concept.a"])],
        )
        candidate = bind_to_sem003_evaluator_1_1_0(normalized, binding)
        self.assertEqual(candidate["obligationMappings"][0]["status"], "PRESERVED")
        self.assertEqual(candidate["obligationMappings"][1]["status"], "OMITTED")

    def test_frozen_bridge_plus_external_binding_satisfies_active_evaluator_schema(self):
        normalized = normalize_projection(baseline_id="SEM003C1-INSTRUCTOR-PYDANTIC-01", run_id="run-1", case=case(), native=projection())
        binding = EvaluatorBinding(
            candidateId="SEM3-EVAL-CAND-COMPARATIVE-TEST",
            caseId=case().caseId,
            caseVersion="1.0.0",
            envelopeId="SEM3-AE-COMPARATIVE-TEST",
            envelopeVersion="1.0.0",
            purpose="SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT",
            requirements=[], prohibitions=[], optionalCandidates=[], ambiguities=[], ownershipBoundaries=[],
        )
        candidate = bind_to_sem003_evaluator_1_1_0(normalized, binding)
        external_binding = json.loads((REPOSITORY_ROOT / "semantic-validation/sem-003/evaluator/registry/sem003c1r2-comparative-evaluator-binding.json").read_text())
        candidate["schemaVersion"] = "1.3.0"
        candidate["purpose"] = external_binding["candidateBinding"]["purpose"]
        schema = json.loads((REPOSITORY_ROOT / "semantic-validation/sem-003/evaluator/contracts/candidate-semantic-representation.schema.json").read_text())
        self.assertEqual(list(Draft7Validator(schema).iter_errors(candidate)), [])

    def test_all_framework_modules_import_without_execution(self):
        for module in ["baselines.instructor_pydantic", "baselines.pydantic_ai_baseline", "baselines.dspy_baseline", "baselines.langextract_baseline", "baselines.outlines_baseline"]:
            loaded = importlib.import_module(module)
            self.assertTrue(callable(loaded.run))

    def test_manifest_inventory_is_unique(self):
        index = json.loads((ROOT / "manifests/freeze-index.json").read_text())
        ids = [item["baselineId"] for item in index["baselineManifests"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(ids), 6)

    def test_results_directory_contains_policy_only(self):
        self.assertEqual(sorted(path.name for path in (ROOT / "results").iterdir()), ["README.md"])

    def test_evaluator_qualification_purpose_repair_preserves_the_original_freeze(self):
        schema = json.loads((REPOSITORY_ROOT / "semantic-validation/sem-003/evaluator/contracts/candidate-semantic-representation.schema.json").read_text())
        self.assertIn("SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION", schema["properties"]["purpose"]["enum"])
        freeze = json.loads((ROOT / "manifests/freeze-index.json").read_text())
        self.assertEqual(freeze["decision"], "SEM003C1_COMPARATIVE_BASELINES_PARTIAL")
        binding = json.loads((REPOSITORY_ROOT / "semantic-validation/sem-003/evaluator/registry/sem003c1r2-comparative-evaluator-binding.json").read_text())
        self.assertEqual(binding["sourceComparativeFreeze"]["freezeDigest"], freeze["freezeDigest"])
        self.assertFalse(binding["baselineCodeOrConfigurationChanged"])
        self.assertEqual(binding["benchmarkSet"], "BLIND")


if __name__ == "__main__":
    unittest.main()
