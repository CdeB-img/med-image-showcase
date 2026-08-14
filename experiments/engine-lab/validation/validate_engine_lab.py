from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


LAB_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = LAB_DIR.parents[1]

CAPABILITY_FIELDS = {
    "capabilityId",
    "currentName",
    "historicalNames",
    "responsibility",
    "scientificOwner",
    "sourceOfTruthOwner",
    "inputs",
    "outputs",
    "currentImplementationPaths",
    "currentRuntime",
    "implementationStatus",
    "evidencePaths",
    "uniqueBusinessValue",
    "deterministicResponsibilities",
    "llmResponsibilities",
    "retrievalResponsibilities",
    "projectionResponsibilities",
    "currentDependencies",
    "documentaryInputs",
    "knownWeaknesses",
    "replacementCandidate",
    "replacementRisk",
    "decision",
}

ENGINE_FIELDS = {
    "engineId",
    "framework",
    "version",
    "rolesSupported",
    "providerSupport",
    "nativeOutputType",
    "statefulCapability",
    "structuredOutputCapability",
    "deterministicValidationCapability",
    "currentAdapterPath",
    "installedEvidence",
    "testedEvidence",
    "currentStatus",
    "limitations",
    "recommendedRole",
}

DOCUMENTARY_FIELDS = {
    "assetId",
    "title",
    "assetClass",
    "sourcePaths",
    "derivedArtifactPaths",
    "provenanceAvailable",
    "versioningAvailable",
    "sensitivityStatus",
    "authorityLevel",
    "knowledgeType",
    "lifecyclePhase",
    "generalizationRisk",
    "currentConsumers",
    "candidateConsumers",
    "currentStatus",
    "missingControls",
    "preservationRequirement",
}

TRANSITION_FIELDS = {
    "capabilityId",
    "businessResponsibility",
    "uniqueValue",
    "truthOwner",
    "currentImplementation",
    "observedProblems",
    "preserve",
    "replaceable",
    "technicalCandidates",
    "experimentNeeded",
    "noxiaLossRisk",
    "provisionalDecision",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def assert_unique(records: list[dict[str, Any]], key: str) -> None:
    values = [record[key] for record in records]
    assert len(values) == len(set(values)), f"duplicate {key}"


def assert_paths(paths: list[str]) -> None:
    for path in paths:
        assert not Path(path).is_absolute(), f"absolute path forbidden: {path}"
        assert (REPO_DIR / path).exists(), f"missing evidence path: {path}"


def validate() -> dict[str, int]:
    schema_paths = sorted((LAB_DIR / "contracts").glob("*.schema.json"))
    assert len(schema_paths) == 5
    for schema_path in schema_paths:
        Draft202012Validator.check_schema(load_json(schema_path))

    capability_registry = load_json(LAB_DIR / "registry" / "capability-registry.json")
    capabilities = capability_registry["capabilities"]
    assert_unique(capabilities, "capabilityId")
    assert len(capabilities) == 23
    for capability in capabilities:
        assert CAPABILITY_FIELDS <= capability.keys()
        assert_paths(capability["evidencePaths"])
        assert capability["decision"] in {
            "KEEP",
            "KEEP_AND_STRENGTHEN",
            "SIMPLIFY",
            "MERGE",
            "MAKE_CONDITIONAL",
            "REPLACE_RUNTIME",
            "RECYCLE",
            "CREATE",
            "DEFER",
            "UNKNOWN_REQUIRES_INSPECTION",
        }

    engine_registry = load_json(LAB_DIR / "registry" / "engine-registry.json")
    engines = engine_registry["engines"]
    assert_unique(engines, "engineId")
    assert len(engines) == 11
    for engine in engines:
        assert ENGINE_FIELDS <= engine.keys()
        assert_paths(engine["installedEvidence"] + engine["testedEvidence"])
        if engine["currentAdapterPath"]:
            assert_paths([engine["currentAdapterPath"]])

    task_registry = load_json(LAB_DIR / "registry" / "task-registry.json")
    tasks = task_registry["tasks"]
    assert_unique(tasks, "taskId")
    assert len(tasks) == 7
    for task in tasks:
        if task["implementationPath"]:
            assert_paths([task["implementationPath"]])
        assert task["mutatesProductState"] is False

    documentary_registry = load_json(LAB_DIR / "registry" / "documentary-asset-registry.json")
    assets = documentary_registry["assets"]
    assert_unique(assets, "assetId")
    assert len(assets) == 15
    for asset in assets:
        assert DOCUMENTARY_FIELDS <= asset.keys()
        assert_paths(asset["sourcePaths"] + asset["derivedArtifactPaths"])

    transition_registry = load_json(LAB_DIR / "registry" / "transition-registry.json")
    transitions = transition_registry["transitions"]
    assert_unique(transitions, "capabilityId")
    assert len(transitions) == len(capabilities)
    assert {item["capabilityId"] for item in transitions} == {item["capabilityId"] for item in capabilities}
    for transition in transitions:
        assert TRANSITION_FIELDS <= transition.keys()

    model_registry = load_json(LAB_DIR / "registry" / "model-registry.json")
    assert_unique(model_registry["models"], "modelId")
    assert all(model["secretsStored"] is False for model in model_registry["models"])

    qry = load_json(LAB_DIR / "registry" / "qry-boundary-contract.json")
    assert qry["implemented"] is False
    assert qry["normativeAuthority"] == "NONE"
    assert set(qry["actions"]) == {
        "ASK",
        "FINISH",
        "FINISH_WITH_OPEN_DECISIONS",
        "REQUEST_KNOWLEDGE",
        "REQUEST_SPECIALIST",
        "STOP",
    }
    assert_paths(qry["sourceReferences"])

    return {
        "schemas": len(schema_paths),
        "capabilities": len(capabilities),
        "engines": len(engines),
        "models": len(model_registry["models"]),
        "tasks": len(tasks),
        "documentaryAssets": len(assets),
        "transitions": len(transitions),
    }


if __name__ == "__main__":
    print(json.dumps({"status": "PASS", **validate()}, sort_keys=True))
