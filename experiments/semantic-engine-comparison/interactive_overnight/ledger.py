from __future__ import annotations

import datetime as dt
import json
import time
from pathlib import Path
from typing import Any, Callable


KNOWN_DAILY_USAGE_BEFORE_MISSION = 357
MAX_NEW_REQUESTS = 135
HARD_STOP_DAILY_ESTIMATE = 492
MAX_STARTS_PER_ROLLING_MINUTE = 10


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


class ProviderLedger:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def events(self) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        return [json.loads(line) for line in self.path.read_text(encoding="utf-8").splitlines() if line.strip()]

    def reservations(self) -> list[dict[str, Any]]:
        return [item for item in self.events() if item.get("event") == "RESERVED"]

    def completed_operation_keys(self) -> set[str]:
        return {
            str(item["operationKey"])
            for item in self.events()
            if item.get("event") == "COMPLETED" and item.get("success") is True
        }

    def append(self, event: dict[str, Any]) -> None:
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")

    def _pace(self) -> None:
        while True:
            recent = []
            now = time.time()
            for item in self.reservations():
                try:
                    stamp = dt.datetime.fromisoformat(str(item["reservedAt"]).replace("Z", "+00:00")).timestamp()
                except (KeyError, ValueError):
                    continue
                if now - stamp < 60:
                    recent.append(stamp)
            if len(recent) < MAX_STARTS_PER_ROLLING_MINUTE:
                return
            time.sleep(max(0.1, 60.05 - (now - min(recent))))

    def reserve(self, *, baseline: str, scenario: str, round_id: str, operation: str, operation_key: str, retry: int = 0) -> dict[str, Any]:
        self._pace()
        existing = self.reservations()
        if len(existing) >= MAX_NEW_REQUESTS or KNOWN_DAILY_USAGE_BEFORE_MISSION + len(existing) >= HARD_STOP_DAILY_ESTIMATE:
            raise RuntimeError("PROVIDER_DAILY_BUDGET_HARD_STOP")
        number = len(existing) + 1
        event = {
            "event": "RESERVED",
            "requestNumber": number,
            "operationKey": operation_key,
            "baselineOrSimulator": baseline,
            "scenario": scenario,
            "round": round_id,
            "operation": operation,
            "reservedAt": utc_now(),
            "provider": "GOOGLE_GEMINI",
            "model": "gemini-3.5-flash-lite",
            "status": "RESERVED",
            "retry": retry,
        }
        self.append(event)
        return event

    def complete(self, reservation: dict[str, Any], *, started_at: str, success: bool, status: str, error: str | None = None) -> None:
        self.append({
            "event": "COMPLETED",
            "requestNumber": reservation["requestNumber"],
            "operationKey": reservation["operationKey"],
            "baselineOrSimulator": reservation["baselineOrSimulator"],
            "scenario": reservation["scenario"],
            "round": reservation["round"],
            "operation": reservation["operation"],
            "startedAt": started_at,
            "completedAt": utc_now(),
            "provider": reservation["provider"],
            "model": reservation["model"],
            "status": status,
            "success": success,
            "retry": reservation["retry"],
            "error": (error or "")[:1200] or None,
        })

    def call(self, *, baseline: str, scenario: str, round_id: str, operation: str, operation_key: str, function: Callable[[], Any], retry: int = 0) -> Any:
        reservation = self.reserve(
            baseline=baseline, scenario=scenario, round_id=round_id,
            operation=operation, operation_key=operation_key, retry=retry,
        )
        started_at = utc_now()
        try:
            value = function()
        except BaseException as caught:
            self.complete(reservation, started_at=started_at, success=False, status="FAILED", error=f"{caught.__class__.__name__}: {caught}")
            raise
        self.complete(reservation, started_at=started_at, success=True, status="SUCCEEDED")
        return value
