from __future__ import annotations

import argparse

from common_contract_ablation_02 import campaign
from common_contract_ablation_02.resume_file_transport import run_sem_process_file_transport
from common_contract_ablation_02.resume_file_transport_and_json_repair import (
    run_dspy_with_deterministic_json_syntax_repair,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["phase-a", "phase-b"])
    args = parser.parse_args()
    campaign.verify_freeze()
    campaign.api_key()  # Load the existing local environment before a checkpoint-only DSPy resume.
    campaign.run_sem_process = run_sem_process_file_transport
    campaign.run_dspy = run_dspy_with_deterministic_json_syntax_repair
    if args.action == "phase-a":
        campaign.run_phase_a()
    else:
        campaign.run_phase_b()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
