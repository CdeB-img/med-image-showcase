from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from google.genai import types
from pydantic_ai import Agent
from pydantic_ai.providers.google import GoogleProvider

from contracts.models import (
    AdjudicationOutput,
    AuditFinding,
    CandidateScientificState,
    ConversationTurn,
)
from interpreter.prompts import ADJUDICATOR_PROMPT_VERSION, ADJUDICATOR_SYSTEM_PROMPT
from interpreter.pydantic_primary import RawFirstGoogleModel
from pipeline.ledger import MODEL, ProviderLedger, utc_now
from pipeline.storage import atomic_write_json, logical_digest, read_json, stable_json


@dataclass
class AdjudicatorProviderValue:
    output: AdjudicationOutput
    rawOutputRef: str
    success: bool
    finalDisposition: str
    providerStatus: str
    error: str | None


class PydanticTypedAdjudicator:
    runtimeId = "PYDANTIC_TYPED_ADJUDICATOR"
    runtimeVersion = "0.1.0-experimental"

    def __init__(self, *, ledger: ProviderLedger, apiKey: str):
        self.ledger = ledger
        self.apiKey = apiKey
        self.promptDigest = logical_digest({"version": ADJUDICATOR_PROMPT_VERSION, "prompt": ADJUDICATOR_SYSTEM_PROMPT})
        self.schemaDigest = logical_digest(AdjudicationOutput.model_json_schema())
        self.configurationDigest = logical_digest({
            "runtime": self.runtimeId,
            "version": self.runtimeVersion,
            "provider": "GOOGLE_GEMINI",
            "model": MODEL,
            "temperature": None,
            "retries": 0,
            "promptDigest": self.promptDigest,
            "schemaDigest": self.schemaDigest,
        })

    def adjudicate(
        self,
        *,
        turns: list[ConversationTurn],
        previousState: CandidateScientificState | None,
        primaryCandidate: CandidateScientificState,
        deterministicFindings: list[AuditFinding],
        semanticAuditFindings: list[AuditFinding],
        rawDirectory: Path,
        scenario: str,
        turn: str,
    ) -> tuple[AdjudicationOutput, str, int, int]:
        operation_key = f"HYBRID-RUNTIME-PROTOTYPE-01:{scenario}:{turn}:ADJUDICATOR"
        started = time.perf_counter()

        def execute(reservation: dict[str, Any]) -> AdjudicatorProviderValue:
            raw_path = rawDirectory / f"request-{reservation['requestNumber']:04d}-adjudicator-{scenario.lower()}-{turn.lower()}.json"
            request_payload = {
                "conversation": [item.model_dump(mode="json") for item in turns],
                "previousState": previousState.model_dump(mode="json") if previousState else None,
                "immutablePrimaryCandidate": primaryCandidate.model_dump(mode="json"),
                "deterministicFindings": [item.model_dump(mode="json") for item in deterministicFindings],
                "semanticAuditFindings": [item.model_dump(mode="json") for item in semanticAuditFindings],
                "confirmedDecisions": [],
            }
            record = {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "requestNumber": reservation["requestNumber"],
                "operationKey": reservation["operationKey"],
                "configuration": "PYDANTIC_TYPED_ADJUDICATOR",
                "scenario": scenario,
                "turn": turn,
                "role": "SEMANTIC_ADJUDICATOR",
                "provider": "GOOGLE_GEMINI",
                "model": MODEL,
                "temperature": None,
                "promptVersion": ADJUDICATOR_PROMPT_VERSION,
                "promptDigest": self.promptDigest,
                "schemaVersion": "SEMANTIC_ADJUDICATION_OUTPUT_0.1.0-experimental",
                "schemaDigest": self.schemaDigest,
                "requestPayload": request_payload,
                "requestPayloadDigest": logical_digest(request_payload),
                "providerStartedAt": utc_now(),
                "rawPersistedAt": None,
                "rawResponse": None,
                "rawDigest": None,
                "parseResult": "PENDING",
                "validationErrors": [],
                "validationCompletedAt": None,
            }

            def capture(raw: dict[str, Any]) -> None:
                record["rawResponse"] = raw
                record["rawPersistedAt"] = utc_now()
                record["rawDigest"] = logical_digest(raw)
                atomic_write_json(raw_path, record)

            model = RawFirstGoogleModel(
                MODEL,
                provider=GoogleProvider(
                    api_key=self.apiKey,
                    retry_options=types.HttpRetryOptions(attempts=1),
                ),
                raw_capture=capture,
            )
            agent = Agent(
                model,
                output_type=AdjudicationOutput,
                system_prompt=ADJUDICATOR_SYSTEM_PROMPT,
                model_settings={"timeout": 45},
                retries=0,
            )
            try:
                output = agent.run_sync(stable_json(request_payload)).output
            except BaseException as caught:
                if not raw_path.exists():
                    capture({
                        "kind": "CLIENT_SIDE_FAILURE_BEFORE_PROVIDER_RESPONSE",
                        "exceptionType": caught.__class__.__name__,
                        "exception": str(caught)[:4000],
                    })
                stored = read_json(raw_path)
                stored["parseResult"] = "STRUCTURED_CONTRACT_FAILURE"
                stored["validationErrors"] = [{
                    "errorType": caught.__class__.__name__,
                    "message": str(caught)[:4000],
                }]
                stored["validationCompletedAt"] = utc_now()
                atomic_write_json(raw_path, stored)
                return AdjudicatorProviderValue(
                    output=AdjudicationOutput(
                        resolutions=[],
                        consolidatedInterpretation=None,
                        unresolvedFindingIds=[item.findingId for item in [*deterministicFindings, *semanticAuditFindings]],
                        disposition="FAIL_CLOSED",
                    ),
                    rawOutputRef=str(raw_path),
                    success=False,
                    finalDisposition="STRUCTURED_CONTRACT_FAILURE",
                    providerStatus="SUCCEEDED" if stored["rawResponse"]["kind"] == "PROVIDER_RESPONSE" else "FAILED",
                    error=f"{caught.__class__.__name__}: {caught}",
                )
            stored = read_json(raw_path)
            stored["parseResult"] = "VALID"
            stored["validationCompletedAt"] = utc_now()
            atomic_write_json(raw_path, stored)
            return AdjudicatorProviderValue(
                output=output,
                rawOutputRef=str(raw_path),
                success=True,
                finalDisposition="SUCCESS",
                providerStatus="SUCCEEDED",
                error=None,
            )

        result = self.ledger.execute(
            operationKey=operation_key,
            configuration="PYDANTIC_TYPED_ADJUDICATOR",
            scenario=scenario,
            turn=turn,
            role="SEMANTIC_ADJUDICATOR",
            function=execute,
        )
        return result.output, result.rawOutputRef, round((time.perf_counter() - started) * 1000), 1
