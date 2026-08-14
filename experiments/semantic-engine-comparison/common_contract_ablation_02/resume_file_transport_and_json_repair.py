from __future__ import annotations

import argparse
import json
import re
from typing import Any

import json_repair

from common_contract_ablation_02 import campaign
from common_contract_ablation_02.resume_file_transport import run_sem_process_file_transport


def run_dspy_with_deterministic_json_syntax_repair(
    turns: list[campaign.ConversationTurn],
) -> tuple[campaign.CommonScientificState, dict[str, Any]]:
    """Frozen DSPy call plus a syntax-only local repair fallback."""
    lm = campaign.dspy.LM(
        f"gemini/{campaign.MODEL}",
        temperature=None,
        cache=False,
        num_retries=0,
        timeout=30,
    )
    predictor = campaign.dspy.Predict(campaign.CommonContractSignature)
    instruction = (
        campaign.COMMON_PROMPT_PATH.read_text(encoding="utf-8")
        + "\nJSON_SCHEMA:\n"
        + json.dumps(campaign.CommonScientificState.model_json_schema(), ensure_ascii=False, sort_keys=True)
    )
    with campaign.dspy.context(lm=lm):
        native = predictor(instruction=instruction, conversation=campaign.render_conversation(turns))
    raw = native.common_state_json
    text = str(raw).strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE)
    syntax_repair = False
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = json_repair.loads(text)
        syntax_repair = True
    state = campaign.CommonScientificState.model_validate(parsed)
    return state, {
        "common_state_json": raw,
        "deterministicJsonSyntaxRepairApplied": syntax_repair,
        "deterministicJsonSyntaxRepairTool": "json-repair" if syntax_repair else None,
        "llmRepairCall": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["phase-a", "phase-b"])
    args = parser.parse_args()
    campaign.verify_freeze()
    campaign.run_sem_process = run_sem_process_file_transport
    campaign.run_dspy = run_dspy_with_deterministic_json_syntax_repair
    if args.action == "phase-a":
        campaign.run_phase_a()
    else:
        campaign.run_phase_b()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
