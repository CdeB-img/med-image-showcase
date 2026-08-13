from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = ROOT.parents[1]
sys.path.insert(0, str(ROOT))

from baselines.langextract_baseline import LANGEXTRACT_OUTPUT_SCHEMA  # noqa: E402
from contracts.projection import schema_documents  # noqa: E402


LOCK = REPOSITORY_ROOT / "experiments" / "requirements-experiments-lock.txt"
MANIFESTS = ROOT / "manifests"
CONTRACTS = ROOT / "contracts"
CREATED_AT_DEFAULT = "2026-08-14T00:00:00+02:00"


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def digest_files(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths):
        relative = path.relative_to(REPOSITORY_ROOT).as_posix()
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def manifest_digest(value: dict) -> str:
    return sha256_bytes(canonical_bytes(value))


def existing_created_at(path: Path) -> str:
    if path.exists():
        try:
            return str(json.loads(path.read_text(encoding="utf-8"))["createdAt"])
        except (KeyError, json.JSONDecodeError):
            pass
    return CREATED_AT_DEFAULT


def sem_code_paths() -> list[Path]:
    root = REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction"
    paths = [value for value in root.glob("*.ts") if value.name != "client.ts"]
    return [
        *paths,
        REPOSITORY_ROOT / "api" / "prompts" / "scientific-semantic-reconstruction-prompt.ts",
        REPOSITORY_ROOT / "api" / "prompts" / "scientific-semantic-atomic-composition-prompt.ts",
    ]


BASELINES = [
    {
        "baselineId": "SEM003C1-SEM-CURRENT-01",
        "filename": "baseline-sem-current.json",
        "framework": "NOXIA_SEM",
        "frameworkVersion": "SEM-001-1.1 / SEM_LEGACY_R5P",
        "code": [ROOT / "baselines" / "sem_current.ts", *sem_code_paths()],
        "prompt": [
            REPOSITORY_ROOT / "api" / "prompts" / "scientific-semantic-reconstruction-prompt.ts",
            REPOSITORY_ROOT / "api" / "prompts" / "scientific-semantic-atomic-composition-prompt.ts",
        ],
        "adapter": [ROOT / "adapters" / "common.py", ROOT / "adapters" / "sem_current.py", ROOT / "contracts" / "projection.py"],
        "outputSchema": [
            REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "schema.ts",
            REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "types.ts",
        ],
        "configuration": {
            "strategy": "NATIVE_SEM_RECONSTRUCTION_CRITIC_DETERMINISTIC_CANONICALIZATION",
            "temperature": None,
            "maxAttemptsPerProviderOperation": 1,
            "previousModel": None,
            "normalization": "LOSSLESS_REFERENCE_BLIND_1.0.0",
        },
    },
    {
        "baselineId": "SEM003C1-INSTRUCTOR-PYDANTIC-01",
        "filename": "baseline-instructor-pydantic.json",
        "framework": "Instructor + Pydantic",
        "frameworkVersion": "Instructor 1.15.4 / Pydantic 2.13.4",
        "code": [ROOT / "baselines" / "instructor_pydantic.py", ROOT / "baselines" / "config.py"],
        "prompt": [ROOT / "prompts" / "scientific-understanding.txt"],
        "adapter": [ROOT / "adapters" / "common.py", ROOT / "contracts" / "projection.py"],
        "outputSchema": [CONTRACTS / "scientific-understanding-native-projection.schema.json"],
        "configuration": {"mode": "Instructor.Mode.JSON", "strict": True, "maxRetries": 0, "temperature": None, "normalization": "LOSSLESS_REFERENCE_BLIND_1.0.0"},
    },
    {
        "baselineId": "SEM003C1-PYDANTICAI-01",
        "filename": "baseline-pydanticai.json",
        "framework": "PydanticAI",
        "frameworkVersion": "2.29.0",
        "code": [ROOT / "baselines" / "pydantic_ai_baseline.py", ROOT / "baselines" / "config.py"],
        "prompt": [ROOT / "prompts" / "scientific-understanding.txt"],
        "adapter": [ROOT / "adapters" / "common.py", ROOT / "contracts" / "projection.py"],
        "outputSchema": [CONTRACTS / "scientific-understanding-native-projection.schema.json"],
        "configuration": {"agentRetries": 0, "providerAttempts": 1, "temperature": None, "tools": [], "normalization": "LOSSLESS_REFERENCE_BLIND_1.0.0"},
    },
    {
        "baselineId": "SEM003C1-DSPY-01",
        "filename": "baseline-dspy.json",
        "framework": "DSPy",
        "frameworkVersion": "3.3.0",
        "code": [ROOT / "baselines" / "dspy_baseline.py", ROOT / "baselines" / "config.py"],
        "prompt": [ROOT / "prompts" / "scientific-understanding.txt"],
        "adapter": [ROOT / "adapters" / "common.py", ROOT / "contracts" / "projection.py"],
        "outputSchema": [CONTRACTS / "scientific-understanding-native-projection.schema.json"],
        "configuration": {"module": "dspy.Predict", "optimizer": None, "demonstrations": [], "cache": False, "numRetries": 0, "temperature": None, "normalization": "LOSSLESS_REFERENCE_BLIND_1.0.0"},
    },
    {
        "baselineId": "SEM003C1-LANGEXTRACT-01",
        "filename": "baseline-langextract.json",
        "framework": "LangExtract",
        "frameworkVersion": "1.6.0",
        "code": [ROOT / "baselines" / "langextract_baseline.py", ROOT / "baselines" / "config.py"],
        "prompt": [ROOT / "prompts" / "langextract-scientific-understanding.txt"],
        "adapter": [ROOT / "adapters" / "common.py", ROOT / "adapters" / "langextract.py", ROOT / "contracts" / "projection.py"],
        "outputSchema": [CONTRACTS / "langextract-native-output.schema.json"],
        "configuration": {"examples": [], "extractionPasses": 1, "batchLength": 1, "maxWorkers": 1, "maxCharBuffer": 20000, "fetchUrls": False, "maxRetries": 0, "temperature": None, "normalization": "LOSSLESS_REFERENCE_BLIND_1.0.0"},
    },
    {
        "baselineId": "SEM003C1-OUTLINES-01",
        "filename": "baseline-outlines.json",
        "framework": "Outlines",
        "frameworkVersion": "1.3.3",
        "code": [ROOT / "baselines" / "outlines_baseline.py", ROOT / "baselines" / "config.py"],
        "prompt": [ROOT / "prompts" / "scientific-understanding.txt"],
        "adapter": [ROOT / "adapters" / "common.py", ROOT / "contracts" / "projection.py"],
        "outputSchema": [CONTRACTS / "scientific-understanding-native-projection.schema.json"],
        "configuration": {"adapter": "outlines.from_gemini", "generator": "outlines.Generator", "providerAttempts": 1, "temperature": None, "normalization": "LOSSLESS_REFERENCE_BLIND_1.0.0"},
    },
]


def generated_contracts() -> dict[Path, object]:
    documents = schema_documents()
    documents["langextract-native-output.schema.json"] = LANGEXTRACT_OUTPUT_SCHEMA
    return {CONTRACTS / name: value for name, value in documents.items()}


def baseline_manifest(spec: dict) -> dict:
    path = MANIFESTS / spec["filename"]
    payload = {
        "schemaVersion": "1.0.0",
        "baselineId": spec["baselineId"],
        "freezeStatus": "FROZEN_PRE_BLIND_EVALUATOR_GATE_OPEN",
        "framework": spec["framework"],
        "frameworkVersion": spec["frameworkVersion"],
        "provider": "GOOGLE_GEMINI",
        "model": "gemini-3.5-flash-lite",
        "configuration": spec["configuration"],
        "promptTemplateDigest": digest_files(spec["prompt"]),
        "adapterDigest": digest_files(spec["adapter"]),
        "outputSchemaDigest": digest_files(spec["outputSchema"]),
        "dependencyLockDigest": sha256_file(LOCK),
        "codeDigest": digest_files(spec["code"]),
        "createdAt": existing_created_at(path),
        "blindAccessed": False,
        "sealedReferenceAccessed": False,
        "blindExecuted": False,
        "resultCount": 0,
    }
    payload["manifestDigest"] = manifest_digest(payload)
    return payload


def freeze_index(manifests: list[dict]) -> dict:
    protocol = MANIFESTS / "comparative-protocol.json"
    payload = {
        "schemaVersion": "1.0.0",
        "freezeId": "SEM003C1-COMPARATIVE-BASELINES-FREEZE-01",
        "createdAt": existing_created_at(MANIFESTS / "freeze-index.json"),
        "baselineCount": len(manifests),
        "baselineManifests": [
            {"baselineId": item["baselineId"], "manifestDigest": item["manifestDigest"]}
            for item in manifests
        ],
        "comparativeProtocolDigest": sha256_file(protocol),
        "normalizedOutputSchemaDigest": sha256_file(CONTRACTS / "normalized-candidate-semantic-representation.schema.json"),
        "evaluatorBridgeDigest": digest_files([ROOT / "adapters" / "evaluator_bridge.py"]),
        "dependencyLockDigest": sha256_file(LOCK),
        "targetEvaluator": {
            "version": "1.1.0",
            "configurationDigest": "b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd",
        },
        "blindAccessed": False,
        "sealedReferenceAccessed": False,
        "blindExecuted": False,
        "resultsCreated": False,
        "commonCampaignGate": "EVALUATOR_1_1_0_QUALIFICATION_PURPOSE_ENUM_REQUIRES_GOVERNED_RESOLUTION",
        "decision": "SEM003C1_COMPARATIVE_BASELINES_PARTIAL",
    }
    payload["freezeDigest"] = manifest_digest(payload)
    return payload


def serialized(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write == args.check:
        parser.error("choose exactly one of --write or --check")

    expected: dict[Path, str] = {path: serialized(value) for path, value in generated_contracts().items()}
    # Schemas must exist before their digests are calculated.
    if args.write:
        for path, content in expected.items():
            path.write_text(content, encoding="utf-8")
    elif any(not path.exists() for path in expected):
        print("SEM003C1_FREEZE_CHECK_FAIL missing generated schema")
        return 1

    manifests = [baseline_manifest(spec) for spec in BASELINES]
    expected.update({MANIFESTS / spec["filename"]: serialized(value) for spec, value in zip(BASELINES, manifests, strict=True)})
    expected[MANIFESTS / "freeze-index.json"] = serialized(freeze_index(manifests))

    if args.write:
        for path, content in expected.items():
            path.write_text(content, encoding="utf-8")
        print(f"SEM003C1_FREEZE_WRITTEN files={len(expected)} baselines={len(manifests)}")
        return 0

    mismatches = [path.relative_to(REPOSITORY_ROOT).as_posix() for path, content in expected.items() if not path.exists() or path.read_text(encoding="utf-8") != content]
    if mismatches:
        print("SEM003C1_FREEZE_CHECK_FAIL")
        for path in mismatches:
            print(path)
        return 1
    print(f"SEM003C1_FREEZE_CHECK_PASS files={len(expected)} baselines={len(manifests)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
