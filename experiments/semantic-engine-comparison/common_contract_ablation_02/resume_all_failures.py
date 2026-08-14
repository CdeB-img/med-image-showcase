from __future__ import annotations

import argparse
from typing import Any

from common_contract_ablation_02 import campaign
from common_contract_ablation_02.resume_file_transport import run_sem_process_file_transport
from common_contract_ablation_02.resume_file_transport_and_json_repair import (
    run_dspy_with_deterministic_json_syntax_repair,
)
from common_contract_ablation_02.resume_resilient import run_pydantic_preserving_contract_failures


FROZEN_RUN_SEM_CONFIGURATIONS = campaign.run_sem_configurations


def run_sem_process_preserving_failures(**kwargs: Any) -> dict[str, Any]:
    try:
        return run_sem_process_file_transport(**kwargs)
    except BaseException as caught:
        failure = {
            "status": "FAILED",
            "failureClass": "SEM_PROVIDER_OR_STRUCTURED_CONTRACT_FAILURE",
            "nativeRawOutputAvailable": False,
            "reason": f"{caught.__class__.__name__}: {caught}"[:5000],
            "noAdditionalSemanticRetry": True,
        }
        if kwargs["mode"] == "PAIR":
            return {"pairedFirstReconstruction": True, "SEM_FULL": failure, "SEM_SINGLE_PASS": failure}
        return {kwargs["mode"] == "FULL" and "SEM_FULL" or "SEM_SINGLE_PASS": failure, "pairedFirstReconstruction": False}


def failed_native(phase: str, scenario_id: str, round_id: str, configuration_id: str) -> bool:
    path = campaign.native_checkpoint(phase, scenario_id, round_id, configuration_id)
    return path.exists() and campaign.read_json(path).get("status") == "FAILED"


def run_sem_preserving_state_failures(**kwargs: Any) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    phase = kwargs["phase"]
    scenario_id = kwargs["scenario_id"]
    round_id = kwargs["round_id"]
    full_state = campaign.load_state(phase, scenario_id, round_id, "SEM_FULL")
    single_state = campaign.load_state(phase, scenario_id, round_id, "SEM_SINGLE_PASS")
    full_done = full_state is not None or failed_native(phase, scenario_id, round_id, "SEM_FULL")
    single_done = single_state is not None or failed_native(phase, scenario_id, round_id, "SEM_SINGLE_PASS")
    if full_done and single_done:
        full_model = (
            campaign.read_json(campaign.native_checkpoint(phase, scenario_id, round_id, "SEM_FULL")).get("model")
            if full_state is not None else kwargs["previous_full"]
        )
        single_model = (
            campaign.read_json(campaign.native_checkpoint(phase, scenario_id, round_id, "SEM_SINGLE_PASS")).get("model")
            if single_state is not None else kwargs["previous_single"]
        )
        return full_model, single_model
    return FROZEN_RUN_SEM_CONFIGURATIONS(**kwargs)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["phase-a", "phase-b"])
    args = parser.parse_args()
    campaign.verify_freeze()
    campaign.api_key()
    campaign.run_sem_process = run_sem_process_preserving_failures
    campaign.run_sem_configurations = run_sem_preserving_state_failures
    campaign.run_dspy = run_dspy_with_deterministic_json_syntax_repair
    campaign.run_pydantic_configurations = run_pydantic_preserving_contract_failures
    if args.action == "phase-a":
        campaign.run_phase_a()
    else:
        campaign.run_phase_b()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
