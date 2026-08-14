from __future__ import annotations

import argparse
from typing import Any

from common_contract_ablation_02 import campaign
from common_contract_ablation_02.resume_file_transport import run_sem_process_file_transport
from common_contract_ablation_02.resume_file_transport_and_json_repair import (
    run_dspy_with_deterministic_json_syntax_repair,
)


FROZEN_RUN_PYDANTIC_CONFIGURATIONS = campaign.run_pydantic_configurations


def failed_native(phase: str, scenario_id: str, round_id: str, configuration_id: str) -> bool:
    path = campaign.native_checkpoint(phase, scenario_id, round_id, configuration_id)
    return path.exists() and campaign.read_json(path).get("status") == "FAILED"


def run_pydantic_preserving_contract_failures(**kwargs: Any) -> None:
    phase = kwargs["phase"]
    scenario_id = kwargs["scenario_id"]
    round_id = kwargs["round_id"]
    common_id = "PYDANTIC_COMMON_CONTRACT"
    critic_id = "PYDANTIC_CONDITIONAL_CRITIC"
    common_state = campaign.load_state(phase, scenario_id, round_id, common_id)
    critic_state = campaign.load_state(phase, scenario_id, round_id, critic_id)
    common_failed = failed_native(phase, scenario_id, round_id, common_id)
    critic_failed = failed_native(phase, scenario_id, round_id, critic_id)
    if (common_state or common_failed) and (critic_state or critic_failed):
        return
    try:
        FROZEN_RUN_PYDANTIC_CONFIGURATIONS(**kwargs)
    except BaseException as caught:
        error = f"{caught.__class__.__name__}: {caught}"[:4000]
        common_state = campaign.load_state(phase, scenario_id, round_id, common_id)
        failure = {
            "status": "FAILED",
            "failureClass": "STRUCTURED_CONTRACT_OR_FRAMEWORK_FAILURE",
            "scenarioId": scenario_id,
            "round": round_id,
            "nativeRawOutputAvailable": False,
            "reason": error,
            "noSemanticRetry": True,
        }
        if common_state is None:
            campaign.write_json(campaign.native_checkpoint(phase, scenario_id, round_id, common_id), {
                **failure,
                "configurationId": common_id,
                "pairedFirstOutput": True,
            })
        campaign.write_json(campaign.native_checkpoint(phase, scenario_id, round_id, critic_id), {
            **failure,
            "configurationId": critic_id,
            "criticExecuted": common_state is not None,
            "sharedFirstOutputFailed": common_state is None,
        })


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["phase-a", "phase-b"])
    args = parser.parse_args()
    campaign.verify_freeze()
    campaign.api_key()
    campaign.run_sem_process = run_sem_process_file_transport
    campaign.run_dspy = run_dspy_with_deterministic_json_syntax_repair
    campaign.run_pydantic_configurations = run_pydantic_preserving_contract_failures
    if args.action == "phase-a":
        campaign.run_phase_a()
    else:
        campaign.run_phase_b()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
