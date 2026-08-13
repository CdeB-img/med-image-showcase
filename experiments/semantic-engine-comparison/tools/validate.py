from __future__ import annotations

from importlib.metadata import version
import json
from pathlib import Path
import re
import subprocess
import sys

from jsonschema import Draft7Validator


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = ROOT.parents[1]
sys.path.insert(0, str(ROOT))

from adapters.common import normalize_projection  # noqa: E402
from adapters.evaluator_bridge import EvaluatorBinding, KeyBinding, OwnershipBinding, bind_to_sem003_evaluator_1_1_0  # noqa: E402
from contracts.projection import (  # noqa: E402
    ComparativeCaseInput,
    ConversationTurn,
    NativeConcept,
    NativeRelation,
    ScientificUnderstandingProjection,
    SourceEvidence,
)


EXPECTED_PACKAGES = {
    "dspy": "3.3.0",
    "instructor": "1.15.4",
    "pydantic-ai": "2.29.0",
    "langextract": "1.6.0",
    "outlines": "1.3.3",
    "guidance": "0.3.1",
    "guardrails-ai": "0.10.2",
    "graphiti-core": "0.29.3",
}
EXPECTED_BASELINES = {
    "SEM003C1-SEM-CURRENT-01",
    "SEM003C1-INSTRUCTOR-PYDANTIC-01",
    "SEM003C1-PYDANTICAI-01",
    "SEM003C1-DSPY-01",
    "SEM003C1-LANGEXTRACT-01",
    "SEM003C1-OUTLINES-01",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sample_normalized():
    case = ComparativeCaseInput(
        caseId="SEM3-DEV-COMPARATIVE-SMOKE",
        caseVersion="1.0.0",
        language="fr",
        conversationTurns=[ConversationTurn(messageId="m1", role="USER", content="Comparer A et B sans causalité.")],
    )
    projection = ScientificUnderstandingProjection(
        language="fr",
        normalizedMeaning="Comparaison non causale de A et B",
        concepts=[
            NativeConcept(
                conceptId="a",
                semanticKey="concept.a",
                label="A",
                conceptType="SCIENTIFIC_OBJECT",
                studyRole="SUBJECT",
                polarity="AFFIRMED",
                epistemicStatus="EXPLICIT_USER_STATED",
                sourceEvidence=[SourceEvidence(messageId="m1", quote="A")],
                confidence=1,
            ),
            NativeConcept(
                conceptId="b",
                semanticKey="concept.b",
                label="B",
                conceptType="SCIENTIFIC_OBJECT",
                studyRole="COMPARATOR_ARM",
                polarity="AFFIRMED",
                epistemicStatus="EXPLICIT_USER_STATED",
                sourceEvidence=[SourceEvidence(messageId="m1", quote="B")],
                confidence=1,
            ),
        ],
        relations=[
            NativeRelation(
                relationId="compare-a-b",
                semanticKey="relation.a.compared-with.b",
                sourceConceptId="a",
                targetConceptId="b",
                predicate="COMPARED_WITH",
                polarity="AFFIRMED",
                epistemicStatus="EXPLICIT_USER_STATED",
                sourceEvidence=[SourceEvidence(messageId="m1", quote="Comparer A et B")],
                confidence=1,
            )
        ],
    )
    return case, projection, normalize_projection(
        baseline_id="SEM003C1-INSTRUCTOR-PYDANTIC-01",
        run_id="smoke-1",
        case=case,
        native=projection,
    )


def main() -> int:
    checks: list[tuple[str, bool, str]] = []

    required_dirs = ["baselines", "adapters", "contracts", "manifests", "results"]
    checks.append(("C01_REQUIRED_DIRECTORIES", all((ROOT / name).is_dir() for name in required_dirs), ",".join(required_dirs)))

    freeze = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "freeze.py"), "--check"],
        cwd=REPOSITORY_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    checks.append(("C02_FREEZE_REPRODUCIBLE", freeze.returncode == 0, freeze.stdout.strip() or freeze.stderr.strip()))

    index = load_json(ROOT / "manifests" / "freeze-index.json")
    ids = {item["baselineId"] for item in index["baselineManifests"]}
    checks.append(("C03_BASELINE_INVENTORY", ids == EXPECTED_BASELINES and index["baselineCount"] == 6, f"count={index['baselineCount']}"))

    manifest_files = sorted((ROOT / "manifests").glob("baseline-*.json"))
    manifests = [load_json(path) for path in manifest_files]
    access_clean = all(not item["blindAccessed"] and not item["sealedReferenceAccessed"] and not item["blindExecuted"] and item["resultCount"] == 0 for item in manifests)
    checks.append(("C04_NO_BLIND_ACCESS_OR_RESULTS", access_clean, f"manifests={len(manifests)}"))
    checks.append(("C05_COMMON_PROVIDER_MODEL", all(item["provider"] == "GOOGLE_GEMINI" and item["model"] == "gemini-3.5-flash-lite" and item["configuration"]["temperature"] is None for item in manifests), "provider/model/temperature"))

    observed_versions = {name: version(name) for name in EXPECTED_PACKAGES}
    checks.append(("C06_INSTALLED_VERSIONS", observed_versions == EXPECTED_PACKAGES, json.dumps(observed_versions, sort_keys=True)))

    for schema_path in sorted((ROOT / "contracts").glob("*.schema.json")):
        Draft7Validator.check_schema(load_json(schema_path))
    checks.append(("C07_LOCAL_SCHEMAS_VALID", True, f"schemas={len(list((ROOT / 'contracts').glob('*.schema.json')))}"))

    evaluator_identity = load_json(REPOSITORY_ROOT / "semantic-validation" / "sem-003" / "evaluator" / "registry" / "evaluator-identity.json")
    identity_ok = evaluator_identity["version"] == "1.1.0" and evaluator_identity["configurationDigest"] == index["targetEvaluator"]["configurationDigest"]
    checks.append(("C08_EVALUATOR_IDENTITY", identity_ok, evaluator_identity["configurationDigest"]))

    evaluator_schema_path = REPOSITORY_ROOT / "semantic-validation" / "sem-003" / "evaluator" / "contracts" / "candidate-semantic-representation.schema.json"
    evaluator_schema = load_json(evaluator_schema_path)
    purposes = set(evaluator_schema["properties"]["purpose"]["enum"])
    qualification_missing = "SCIENTIFIC_UNDERSTANDING_BLIND_QUALIFICATION" not in purposes
    gate_recorded = index["commonCampaignGate"] == "EVALUATOR_1_1_0_QUALIFICATION_PURPOSE_ENUM_REQUIRES_GOVERNED_RESOLUTION"
    checks.append(("C09_KNOWN_EVALUATOR_GATE_EXPLICIT", qualification_missing and gate_recorded, ",".join(sorted(purposes))))

    case, projection, normalized = sample_normalized()
    conservation_ok = len(normalized.semanticElements) == len(projection.concepts) and len(normalized.semanticRelations) == len(projection.relations)
    checks.append(("C10_NORMALIZATION_CONSERVATION", conservation_ok, "2 concepts / 1 relation"))

    binding = EvaluatorBinding(
        candidateId="SEM3-EVAL-CAND-COMPARATIVE-SMOKE",
        caseId=case.caseId,
        caseVersion=case.caseVersion,
        envelopeId="SEM3-AE-COMPARATIVE-SMOKE",
        envelopeVersion="1.0.0",
        purpose="SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT",
        requirements=[KeyBinding(referenceId="req-concept-a", acceptedSemanticKeys=["concept.a"])],
        prohibitions=[KeyBinding(referenceId="pro-causality", acceptedSemanticKeys=["relation.a.causes.b"])],
        optionalCandidates=[],
        ambiguities=[],
        ownershipBoundaries=[OwnershipBinding(boundaryId="own-project-adoption", prohibitedAdoptedSemanticKeys=["concept.a"])],
    )
    evaluator_candidate = bind_to_sem003_evaluator_1_1_0(normalized, binding)
    evaluator_errors = list(Draft7Validator(evaluator_schema).iter_errors(evaluator_candidate))
    checks.append(("C11_EVALUATOR_BRIDGE_DEVELOPMENT_PROOF", not evaluator_errors, evaluator_errors[0].message if evaluator_errors else "schema-valid"))

    results = [path for path in (ROOT / "results").iterdir() if path.name != "README.md"]
    checks.append(("C12_RESULTS_EMPTY", not results, f"unexpected={len(results)}"))

    source_files = [*ROOT.glob("baselines/*"), *ROOT.glob("adapters/*"), *ROOT.glob("tools/*"), *ROOT.glob("prompts/*")]
    source_text = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in source_files if path.is_file())
    secret_patterns = [r"AIza[0-9A-Za-z_-]{20,}", r"GEMINI_API_KEY\s*=\s*['\"][^'\"]+"]
    checks.append(("C13_NO_PERSISTED_SECRET", not any(re.search(pattern, source_text) for pattern in secret_patterns), "source scan"))

    prompt_text = "\n".join(path.read_text(encoding="utf-8") for path in (ROOT / "prompts").glob("*.txt"))
    checks.append(("C14_NO_BENCHMARK_CASE_IN_PROMPTS", "SEM3-" not in prompt_text and "Acceptance Envelope" not in prompt_text, "prompt scan"))

    classification = load_json(ROOT / "baselines" / "candidate-classification.json")
    classes = {item["candidate"]: item["classification"] for item in classification["excluded"]}
    checks.append(("C15_COMPONENT_CLASSIFICATION", classes.get("Graphiti Core") == "MEMORY_GRAPH_COMPONENT_NOT_DIRECT_UNDERSTANDING_ENGINE" and classes.get("Guardrails AI") == "VALIDATION_LAYER_NOT_DIRECT_UNDERSTANDING_ENGINE" and classes.get("Guidance") == "NOT_COMPARABLE_WITH_FROZEN_PROVIDER_WITHOUT_CUSTOM_BRIDGE", json.dumps(classes, sort_keys=True)))

    protocol = load_json(ROOT / "manifests" / "comparative-protocol.json")
    anti_overfit_ok = protocol["executionDesign"]["noTuningAfterObservation"] and protocol["executionDesign"]["noRepairDuringCampaign"] and protocol["fairnessControls"]["normalizationAddsUnderstanding"] is False
    checks.append(("C16_PROTOCOL_PRECOMMITMENT", anti_overfit_ok, protocol["status"]))

    forbidden_path_material = "sealed-reference/"
    runtime_sources = [path for path in source_files if path.suffix in {".py", ".ts"} and path.name not in {"validate.py"}]
    forbidden_runtime_reference = any(forbidden_path_material in path.read_text(encoding="utf-8", errors="ignore") for path in runtime_sources)
    checks.append(("C17_BASELINES_HAVE_NO_SEALED_PATH", not forbidden_runtime_reference, "runtime source scan"))

    all_pass = all(result for _, result, _ in checks)
    for check_id, passed, detail in checks:
        print(f"{check_id} {'PASS' if passed else 'FAIL'} {detail}")
    print(f"SEM003C1_VALIDATION {'PASS' if all_pass else 'FAIL'} {sum(1 for _, result, _ in checks if result)}/{len(checks)}")
    print("DECISION SEM003C1_COMPARATIVE_BASELINES_PARTIAL")
    return 0 if all_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
