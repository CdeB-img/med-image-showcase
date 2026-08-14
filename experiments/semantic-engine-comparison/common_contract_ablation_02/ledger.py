from __future__ import annotations

import datetime as dt
import json
import time
from pathlib import Path
from typing import Any, Callable


TARGET_PROVIDER_REQUESTS = 260
SOFT_PROVIDER_REQUEST_LIMIT = 280
MAX_NEW_PROVIDER_REQUESTS = 320
DAILY_LIMIT = 500
RESERVED_DAILY_MARGIN = 180
MAX_STARTS_PER_ROLLING_MINUTE = 10


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


class ProviderLedger:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.touch()

    def events(self) -> list[dict[str, Any]]:
        return [json.loads(line) for line in self.path.read_text(encoding="utf-8").splitlines() if line.strip()]

    def reservations(self) -> list[dict[str, Any]]:
        return [event for event in self.events() if event.get("event") == "RESERVED"]

    def successful_operation_keys(self) -> set[str]:
        return {
            str(event["operationKey"])
            for event in self.events()
            if event.get("event") == "COMPLETED" and event.get("success") is True
        }

    def append(self, event: dict[str, Any]) -> None:
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")

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
            if len(recent) < MAX_STARTS_PER_ROLLING_MINUTE:
                return
            time.sleep(max(0.1, 60.05 - (now - min(recent))))

    def reserve(
        self,
        *,
        configuration_id: str,
        phase: str,
        scenario_id: str,
        round_id: str,
        operation: str,
        operation_key: str,
        retry: int = 0,
    ) -> dict[str, Any]:
        if operation_key in self.successful_operation_keys():
            raise RuntimeError(f"SUCCESS_OPERATION_REPLAY_FORBIDDEN:{operation_key}")
        self.pace()
        existing = self.reservations()
        if len(existing) >= MAX_NEW_PROVIDER_REQUESTS or len(existing) >= DAILY_LIMIT - RESERVED_DAILY_MARGIN:
            raise RuntimeError("PROVIDER_DAILY_BUDGET_HARD_STOP")
        event = {
            "event": "RESERVED",
            "requestNumber": len(existing) + 1,
            "operationKey": operation_key,
            "configurationId": configuration_id,
            "phase": phase,
            "scenarioId": scenario_id,
            "round": round_id,
            "operation": operation,
            "reservedAt": utc_now(),
            "provider": "GOOGLE_GEMINI",
            "model": "gemini-3.5-flash-lite",
            "temperature": None,
            "status": "RESERVED",
            "retry": retry,
        }
        self.append(event)
        return event

    def complete(
        self,
        reservation: dict[str, Any],
        *,
        started_at: str,
        success: bool,
        status: str,
        error: str | None = None,
    ) -> None:
        self.append({
            "event": "COMPLETED",
            "requestNumber": reservation["requestNumber"],
            "operationKey": reservation["operationKey"],
            "configurationId": reservation["configurationId"],
            "phase": reservation["phase"],
            "scenarioId": reservation["scenarioId"],
            "round": reservation["round"],
            "operation": reservation["operation"],
            "startedAt": started_at,
            "completedAt": utc_now(),
            "provider": reservation["provider"],
            "model": reservation["model"],
            "status": status,
            "success": success,
            "retry": reservation["retry"],
            "error": (error or "")[:1600] or None,
        })

    def call(
        self,
        *,
        configuration_id: str,
        phase: str,
        scenario_id: str,
        round_id: str,
        operation: str,
        operation_key: str,
        function: Callable[[], Any],
        retry: int = 0,
    ) -> Any:
        reservation = self.reserve(
            configuration_id=configuration_id,
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            operation=operation,
            operation_key=operation_key,
            retry=retry,
        )
        started_at = utc_now()
        try:
            value = function()
        except BaseException as caught:
            self.complete(
                reservation,
                started_at=started_at,
                success=False,
                status="FAILED",
                error=f"{caught.__class__.__name__}: {caught}",
            )
            raise
        self.complete(reservation, started_at=started_at, success=True, status="SUCCEEDED")
        return value
