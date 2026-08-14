from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from typing import Any

from common_contract_ablation_02 import campaign


def run_sem_process_file_transport(
    *,
    mode: str,
    phase: str,
    scenario_id: str,
    round_id: str,
    turns: list[campaign.ConversationTurn],
    previous_full: dict[str, Any] | None,
    previous_single: dict[str, Any] | None,
) -> dict[str, Any]:
    """Transport-only replacement for the frozen pipe-based subprocess call."""
    payload: dict[str, Any] = {
        "mode": mode,
        "phase": phase,
        "scenarioId": scenario_id,
        "roundId": round_id,
        "operationKey": f"{campaign.EXPERIMENT_ID}:{phase}:{scenario_id}:{round_id}:{mode}",
        "ledgerPath": str(campaign.LEDGER_PATH),
        "sessionId": f"ablation02-{phase.lower()}-{scenario_id.lower()}",
        "conversationTurns": [turn.model_dump(mode="json") for turn in turns],
    }
    if mode in {"PAIR", "FULL"}:
        payload["full"] = {"previousModel": previous_full}
    if mode in {"PAIR", "SINGLE"}:
        payload["single"] = {"previousModel": previous_single}
    executable = campaign.REPOSITORY_ROOT / "node_modules" / ".bin" / "vite-node"
    environment = os.environ.copy()
    environment["GEMINI_API_KEY"] = campaign.api_key()
    with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8", suffix=".json") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False))
        handle.flush()
        handle.seek(0)
        completed = subprocess.run(
            [str(executable), str(campaign.PACKAGE_ROOT / "sem_pair_runner.ts")],
            cwd=campaign.REPOSITORY_ROOT,
            stdin=handle,
            text=True,
            capture_output=True,
            check=False,
            env=environment,
        )
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout or "SEM_PAIR_RUNNER_FAILED")[-5000:])
    lines = [line for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise RuntimeError("SEM_PAIR_RUNNER_EMPTY_OUTPUT")
    return json.loads(lines[-1])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["phase-a", "phase-b"])
    args = parser.parse_args()
    campaign.verify_freeze()
    campaign.run_sem_process = run_sem_process_file_transport
    if args.action == "phase-a":
        campaign.run_phase_a()
    else:
        campaign.run_phase_b()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
