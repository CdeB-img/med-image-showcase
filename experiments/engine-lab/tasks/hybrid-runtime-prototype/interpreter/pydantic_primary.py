from __future__ import annotations

import importlib.metadata
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from google.genai import types
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

from adapters.protocols import InterpreterResult
from contracts.models import (
    CandidateScientificState,
    ContextInput,
    ConversationTurn,
    PrimaryScientificInterpretation,
    RuntimeIdentity,
)
from interpreter.prompts import PRIMARY_PROMPT_VERSION, PRIMARY_SYSTEM_PROMPT
from pipeline.ledger import MODEL, ProviderLedger, utc_now
from pipeline.projection import build_candidate_state
from pipeline.storage import atomic_write_json, logical_digest, read_json, stable_json


@dataclass
class PydanticProviderValue:
    interpretation: PrimaryScientificInterpretation | None
    rawOutputRef: str
    rawDigest: str
    success: bool
    finalDisposition: str
    providerStatus: str
    error: str | None


class RawFirstGoogleModel(GoogleModel):
    """Capture the SDK response before PydanticAI processes or validates it."""

    def __init__(self, *args: Any, raw_capture: Callable[[dict[str, Any]], None], **kwargs: Any):
        super().__init__(*args, **kwargs)
        self._raw_capture = raw_capture
        self._captured = False

    def _process_response(self, response: Any) -> Any:
        self._raw_capture({
            "kind": "PROVIDER_RESPONSE",
            "response": response.model_dump(mode="json", by_alias=True, exclude_none=False),
        })
        self._captured = True
        return super()._process_response(response)

    async def request(self, *args: Any, **kwargs: Any) -> Any:
        try:
            return await super().request(*args, **kwargs)
        except BaseException as caught:
            if not self._captured:
                self._raw_capture({
                    "kind": "PROVIDER_EXCEPTION",
                    "exceptionType": caught.__class__.__name__,
                    "exception": str(caught)[:4000],
                })
                self._captured = True
            raise


def render_conversation(turns: list[ConversationTurn]) -> str:
    return "\n".join(f"{turn.turnId} | {turn.role}: {turn.content}" for turn in turns)


class PydanticPrimaryInterpreter:
    runtimeId = "PYDANTIC_AI_DIRECT"
    runtimeVersion = "0.1.0-experimental"

    def __init__(self, *, ledger: ProviderLedger, apiKey: str):
        self.ledger = ledger
        self.apiKey = apiKey
        self.schemaDigest = logical_digest(PrimaryScientificInterpretation.model_json_schema())
        self.promptDigest = logical_digest({"version": PRIMARY_PROMPT_VERSION, "prompt": PRIMARY_SYSTEM_PROMPT})
        self.configurationDigest = logical_digest({
            "runtime": self.runtimeId,
            "runtimeVersion": self.runtimeVersion,
            "provider": "GOOGLE_GEMINI",
            "model": MODEL,
            "temperature": None,
            "retries": 0,
            "pydanticAI": importlib.metadata.version("pydantic-ai"),
            "promptDigest": self.promptDigest,
            "schemaDigest": self.schemaDigest,
        })

    @property
    def identity(self) -> RuntimeIdentity:
        return RuntimeIdentity(
            runtimeId=self.runtimeId,
            runtimeVersion=self.runtimeVersion,
            provider="GOOGLE_GEMINI",
            model=MODEL,
            promptDigest=self.promptDigest,
            schemaDigest=self.schemaDigest,
            configurationDigest=self.configurationDigest,
        )

    def _call(
        self,
        *,
        turns: list[ConversationTurn],
        previousCandidateState: CandidateScientificState | None,
        contextInputs: list[ContextInput],
        rawDirectory: Path,
        scenario: str,
        turn: str,
    ) -> PydanticProviderValue:
        operation_key = f"HYBRID-RUNTIME-PROTOTYPE-01:{scenario}:{turn}:PRIMARY"

        def execute(reservation: dict[str, Any]) -> PydanticProviderValue:
            raw_path = rawDirectory / f"request-{reservation['requestNumber']:04d}-primary-{scenario.lower()}-{turn.lower()}.json"
            request_metadata = {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "requestNumber": reservation["requestNumber"],
                "operationKey": reservation["operationKey"],
                "configuration": reservation["configuration"],
                "scenario": scenario,
                "turn": turn,
                "role": "PRIMARY_INTERPRETER",
                "provider": "GOOGLE_GEMINI",
                "model": MODEL,
                "temperature": None,
                "promptVersion": PRIMARY_PROMPT_VERSION,
                "promptDigest": self.promptDigest,
                "schemaVersion": "PRIMARY_SCIENTIFIC_INTERPRETATION_0.1.0-experimental",
                "schemaDigest": self.schemaDigest,
                "requestPayload": {
                    "conversation": [item.model_dump(mode="json") for item in turns],
                    "previousCandidateState": previousCandidateState.model_dump(mode="json") if previousCandidateState else None,
                    "contextInputs": [item.model_dump(mode="json") for item in contextInputs],
                },
                "requestPayloadDigest": logical_digest({
                    "conversation": [item.model_dump(mode="json") for item in turns],
                    "previousCandidateState": previousCandidateState.model_dump(mode="json") if previousCandidateState else None,
                    "contextInputs": [item.model_dump(mode="json") for item in contextInputs],
                }),
                "providerStartedAt": utc_now(),
                "rawPersistedAt": None,
                "rawResponse": None,
                "rawDigest": None,
                "parseResult": "PENDING",
                "validationErrors": [],
                "validationCompletedAt": None,
                "candidateStateRef": None,
            }

            def capture(raw: dict[str, Any]) -> None:
                request_metadata["rawResponse"] = raw
                request_metadata["rawPersistedAt"] = utc_now()
                request_metadata["rawDigest"] = logical_digest(raw)
                atomic_write_json(raw_path, request_metadata)

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
                output_type=PrimaryScientificInterpretation,
                system_prompt=PRIMARY_SYSTEM_PROMPT,
                model_settings={"timeout": 45},
                retries=0,
            )
            try:
                result = agent.run_sync(stable_json({
                    "conversation": [item.model_dump(mode="json") for item in turns],
                    "previousCandidateState": previousCandidateState.model_dump(mode="json") if previousCandidateState else None,
                    "contextInputs": [item.model_dump(mode="json") for item in contextInputs],
                }))
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
                return PydanticProviderValue(
                    interpretation=None,
                    rawOutputRef=str(raw_path),
                    rawDigest=str(stored["rawDigest"]),
                    success=False,
                    finalDisposition="STRUCTURED_CONTRACT_FAILURE",
                    providerStatus="SUCCEEDED" if stored["rawResponse"]["kind"] == "PROVIDER_RESPONSE" else "FAILED",
                    error=f"{caught.__class__.__name__}: {caught}",
                )
            stored = read_json(raw_path)
            stored["parseResult"] = "VALID"
            stored["validationCompletedAt"] = utc_now()
            atomic_write_json(raw_path, stored)
            return PydanticProviderValue(
                interpretation=result.output,
                rawOutputRef=str(raw_path),
                rawDigest=str(stored["rawDigest"]),
                success=True,
                finalDisposition="SUCCESS",
                providerStatus="SUCCEEDED",
                error=None,
            )

        return self.ledger.execute(
            operationKey=operation_key,
            configuration="PYDANTIC_PRIMARY",
            scenario=scenario,
            turn=turn,
            role="PRIMARY_INTERPRETER",
            function=execute,
        )

    def interpret(
        self,
        *,
        conversationId: str,
        turns: list[ConversationTurn],
        previousCandidateState: CandidateScientificState | None,
        contextInputs: list[ContextInput],
        rawDirectory: Path,
        scenario: str,
        turn: str,
    ) -> InterpreterResult:
        started = time.perf_counter()
        value = self._call(
            turns=turns,
            previousCandidateState=previousCandidateState,
            contextInputs=contextInputs,
            rawDirectory=rawDirectory,
            scenario=scenario,
            turn=turn,
        )
        interpretation = value.interpretation or PrimaryScientificInterpretation(normalizedUnderstanding="")
        candidate = build_candidate_state(
            conversationId=conversationId,
            turns=turns,
            previousState=previousCandidateState,
            interpretation=interpretation,
            rawOutputRef=value.rawOutputRef,
            rawDigest=value.rawDigest,
            runtimeIdentity=self.identity,
            contextInputs=contextInputs,
            technicalStatus="STRUCTURED_CONTRACT_VALID" if value.success else "STRUCTURED_CONTRACT_FAILURE",
        )
        raw = read_json(Path(value.rawOutputRef))
        raw["candidateStateRef"] = candidate.identity.stateId
        atomic_write_json(Path(value.rawOutputRef), raw)
        return InterpreterResult(
            candidate=candidate,
            rawOutputRef=value.rawOutputRef,
            latencyMs=round((time.perf_counter() - started) * 1000),
            providerCalls=1,
        )
