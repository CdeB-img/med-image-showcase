from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from audit.deterministic_adapter import audit_payload
from contracts.models import AuditFinding, CandidateScientificState, ConversationTurn, SemanticAuditLBatch
from pipeline.ledger import MODEL, ProviderLedger, ProviderOperationError
from pipeline.storage import atomic_write_json, logical_digest, read_json


PROMPT_VERSION = "SEM-AUDIT-L-NOXIA-SEM-SINGLE-0.1.0-experimental"


@dataclass
class AuditLProviderValue:
    findings: list[AuditFinding]
    rawOutputRef: str
    success: bool
    finalDisposition: str
    providerStatus: str
    error: str | None


class SemanticAuditL:
    runtimeId = "NOXIA_SEM_SINGLE_PROMPTED_SECOND_READER"
    runtimeVersion = "0.1.0-experimental"

    def __init__(self, *, ledger: ProviderLedger, apiKey: str, repositoryRoot: Path):
        self.ledger = ledger
        self.apiKey = apiKey
        self.repositoryRoot = repositoryRoot
        self.runner = Path(__file__).resolve().parent / "sem_audit_l_runner.ts"
        self.schemaDigest = logical_digest(SemanticAuditLBatch.model_json_schema())

    def audit_with_metadata(
        self,
        *,
        turns: list[ConversationTurn],
        previousState: CandidateScientificState | None,
        candidateState: CandidateScientificState,
        confirmedDecisionIds: list[str],
        deterministicFindings: list[AuditFinding] | None = None,
        rawDirectory: Path,
        scenario: str,
        turn: str,
    ) -> AuditLProviderValue:
        del previousState, confirmedDecisionIds
        findings = deterministicFindings or []
        operation_key = f"HYBRID-RUNTIME-PROTOTYPE-01:{scenario}:{turn}:SEM_AUDIT_L"

        def execute(reservation: dict[str, Any]) -> AuditLProviderValue:
            raw_path = rawDirectory / f"request-{reservation['requestNumber']:04d}-audit-l-{scenario.lower()}-{turn.lower()}.json"
            payload = {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "requestNumber": reservation["requestNumber"],
                "operationKey": reservation["operationKey"],
                "scenario": scenario,
                "turn": turn,
                "model": MODEL,
                "rawPath": str(raw_path),
                "conversationTurns": [item.model_dump(mode="json") for item in turns],
                "candidateState": audit_payload(candidateState),
                "deterministicFindings": [item.model_dump(mode="json") for item in findings],
                "promptVersion": PROMPT_VERSION,
            }
            environment = os.environ.copy()
            environment["GEMINI_API_KEY"] = self.apiKey
            completed = subprocess.run(
                [str(self.repositoryRoot / "node_modules" / ".bin" / "vite-node"), str(self.runner)],
                cwd=self.repositoryRoot,
                input=json.dumps(payload, ensure_ascii=False),
                text=True,
                capture_output=True,
                check=False,
                env=environment,
            )
            if completed.returncode != 0:
                raise ProviderOperationError(
                    "SEM_AUDIT_L_RUNNER_FAILURE",
                    (completed.stderr or completed.stdout or "SEM_AUDIT_L_RUNNER_FAILED")[-4000:],
                    rawOutputRef=str(raw_path) if raw_path.exists() else None,
                )
            lines = [line for line in completed.stdout.splitlines() if line.strip()]
            if not lines:
                raise ProviderOperationError("SEM_AUDIT_L_EMPTY_OUTPUT", "SEM-AUDIT-L runner returned no status")
            result = json.loads(lines[-1])
            status = result.get("status")
            raw_ref = str(result.get("rawOutputRef") or raw_path)
            if status in {"NETWORK_FAILURE", "HTTP_FAILURE"}:
                http = int(result.get("httpStatus") or 0)
                transient = status == "NETWORK_FAILURE" or http in {429, 502, 503, 504}
                raise ProviderOperationError(
                    "TRANSIENT_PROVIDER_FAILURE" if transient else "PROVIDER_FAILURE",
                    str(result.get("error") or status)[:4000],
                    transient=transient,
                    rawOutputRef=raw_ref,
                )
            if status != "SUCCESS":
                return AuditLProviderValue(
                    findings=[],
                    rawOutputRef=raw_ref,
                    success=False,
                    finalDisposition=str(status),
                    providerStatus="SUCCEEDED",
                    error=str(result.get("error") or status),
                )
            try:
                batch = SemanticAuditLBatch.model_validate(result["parsed"])
            except ValidationError as caught:
                record = read_json(Path(raw_ref))
                record["parseResult"] = "SCHEMA_FAILURE"
                record["validationErrors"] = caught.errors(include_url=False)
                atomic_write_json(Path(raw_ref), record)
                return AuditLProviderValue(
                    findings=[],
                    rawOutputRef=raw_ref,
                    success=False,
                    finalDisposition="STRUCTURED_CONTRACT_FAILURE",
                    providerStatus="SUCCEEDED",
                    error=str(caught),
                )
            record = read_json(Path(raw_ref))
            record["parseResult"] = "VALID"
            record["validationErrors"] = []
            atomic_write_json(Path(raw_ref), record)
            return AuditLProviderValue(
                findings=batch.findings,
                rawOutputRef=raw_ref,
                success=True,
                finalDisposition="SUCCESS",
                providerStatus="SUCCEEDED",
                error=None,
            )

        return self.ledger.execute(
            operationKey=operation_key,
            configuration="SEM_AUDIT_L",
            scenario=scenario,
            turn=turn,
            role="SEMANTIC_AUDITOR",
            function=execute,
        )

    def audit(self, **kwargs: Any) -> list[AuditFinding]:
        return self.audit_with_metadata(**kwargs).findings
