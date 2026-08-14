from __future__ import annotations

import datetime as dt
import json
import time
from pathlib import Path
from typing import Any, Callable, TypeVar

from pipeline.storage import append_jsonl


MODEL = "gemini-3.5-flash-lite"
MAX_NEW_PROVIDER_REQUESTS = 80
MAX_STARTS_PER_ROLLING_60_SECONDS = 10
MAX_TRANSIENT_RETRY = 1
T = TypeVar("T")


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


class ProviderOperationError(RuntimeError):
    def __init__(
        self,
        disposition: str,
        message: str,
        *,
        transient: bool = False,
        rawOutputRef: str | None = None,
    ):
        super().__init__(message)
        self.disposition = disposition
        self.transient = transient
        self.rawOutputRef = rawOutputRef


class ProviderLedger:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.touch(exist_ok=True)

    def events(self) -> list[dict[str, Any]]:
        return [json.loads(line) for line in self.path.read_text(encoding="utf-8").splitlines() if line.strip()]

    def reservations(self) -> list[dict[str, Any]]:
        return [event for event in self.events() if event.get("event") == "RESERVED"]

    def terminal_operations(self) -> set[str]:
        return {
            str(event["operationKey"])
            for event in self.events()
            if event.get("event") == "COMPLETED" and event.get("replayAllowed") is False
        }

    def pace(self) -> None:
        while True:
            now = time.time()
            recent: list[float] = []
            for event in self.reservations():
                try:
                    stamp = dt.datetime.fromisoformat(str(event["reservedAt"]).replace("Z", "+00:00")).timestamp()
                except (KeyError, ValueError):
                    continue
                if now - stamp < 60:
                    recent.append(stamp)
            if len(recent) < MAX_STARTS_PER_ROLLING_60_SECONDS:
                return
            time.sleep(max(0.1, 60.05 - (now - min(recent))))

    def reserve(
        self,
        *,
        operationKey: str,
        configuration: str,
        scenario: str,
        turn: str,
        role: str,
        retryOf: int | None = None,
    ) -> dict[str, Any]:
        if operationKey in self.terminal_operations():
            raise RuntimeError(f"TERMINAL_OPERATION_REPLAY_FORBIDDEN:{operationKey}")
        self.pace()
        reservations = self.reservations()
        if len(reservations) >= MAX_NEW_PROVIDER_REQUESTS:
            raise RuntimeError("PROVIDER_BUDGET_80_HARD_STOP")
        value = {
            "event": "RESERVED",
            "requestNumber": len(reservations) + 1,
            "operationKey": operationKey,
            "configuration": configuration,
            "scenario": scenario,
            "turn": turn,
            "role": role,
            "reservedAt": utc_now(),
            "provider": "GOOGLE_GEMINI",
            "model": MODEL,
            "temperature": None,
            "retryOf": retryOf,
            "cumulativeCalls": len(reservations) + 1,
        }
        append_jsonl(self.path, value)
        return value

    def complete(
        self,
        reservation: dict[str, Any],
        *,
        startedAt: str,
        providerStatus: str,
        rawOutputRef: str | None,
        success: bool,
        disposition: str,
        error: str | None,
        replayAllowed: bool,
    ) -> None:
        append_jsonl(self.path, {
            "event": "COMPLETED",
            "requestNumber": reservation["requestNumber"],
            "operationKey": reservation["operationKey"],
            "configuration": reservation["configuration"],
            "scenario": reservation["scenario"],
            "turn": reservation["turn"],
            "role": reservation["role"],
            "reservedAt": reservation["reservedAt"],
            "startedAt": startedAt,
            "completedAt": utc_now(),
            "provider": reservation["provider"],
            "model": reservation["model"],
            "providerStatus": providerStatus,
            "rawOutputRef": rawOutputRef,
            "success": success,
            "failure": None if success else disposition,
            "finalDisposition": disposition,
            "retryOf": reservation["retryOf"],
            "cumulativeCalls": reservation["cumulativeCalls"],
            "replayAllowed": replayAllowed,
            "error": (error or "")[:1600] or None,
        })

    def execute(
        self,
        *,
        operationKey: str,
        configuration: str,
        scenario: str,
        turn: str,
        role: str,
        function: Callable[[dict[str, Any]], T],
    ) -> T:
        first_request: int | None = None
        for attempt in range(MAX_TRANSIENT_RETRY + 1):
            key = operationKey if attempt == 0 else f"{operationKey}:retry1"
            reservation = self.reserve(
                operationKey=key,
                configuration=configuration,
                scenario=scenario,
                turn=turn,
                role=role,
                retryOf=first_request,
            )
            first_request = first_request or int(reservation["requestNumber"])
            started = utc_now()
            try:
                value = function(reservation)
            except ProviderOperationError as caught:
                raw_ref = getattr(caught, "rawOutputRef", None)
                terminal = not caught.transient or attempt >= MAX_TRANSIENT_RETRY
                self.complete(
                    reservation,
                    startedAt=started,
                    providerStatus="FAILED",
                    rawOutputRef=raw_ref,
                    success=False,
                    disposition=caught.disposition,
                    error=str(caught),
                    replayAllowed=not terminal,
                )
                if caught.transient and attempt < MAX_TRANSIENT_RETRY:
                    time.sleep(60)
                    continue
                raise
            except BaseException as caught:
                self.complete(
                    reservation,
                    startedAt=started,
                    providerStatus="FAILED",
                    rawOutputRef=None,
                    success=False,
                    disposition="UNCLASSIFIED_TECHNICAL_FAILURE",
                    error=f"{caught.__class__.__name__}: {caught}",
                    replayAllowed=False,
                )
                raise
            success = bool(getattr(value, "success", True))
            disposition = str(getattr(value, "finalDisposition", "SUCCESS" if success else "TECHNICAL_FAILURE"))
            provider_status = str(getattr(value, "providerStatus", "SUCCEEDED"))
            self.complete(
                reservation,
                startedAt=started,
                providerStatus=provider_status,
                rawOutputRef=getattr(value, "rawOutputRef", None),
                success=success,
                disposition=disposition,
                error=getattr(value, "error", None),
                replayAllowed=False,
            )
            return value
        raise RuntimeError("UNREACHABLE_RETRY_STATE")
