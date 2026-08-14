from __future__ import annotations

from typing import Any

from .campaign import (
    BASELINE_ORDER,
    LEDGER_PATH,
    NATIVE_ROOT,
    NORMALIZED_ROOT,
    RESULT_ROOT,
    SCENARIOS,
    TRANSCRIPT_ROOT,
    ProviderLedger,
    InteractiveCase,
    InteractiveProjection,
    ConversationTurn,
    read_json,
    run_candidate,
    save_output,
    simulator_answers,
    stable_json,
    write_json,
)


MISSING_STATUS = "SIMULATOR_OUTPUT_NOT_CHECKPOINTED_OR_BRANCH_MISSING"


def load_projection(scenario_id: str, baseline: str, round_id: str) -> tuple[InteractiveProjection, Any]:
    normalized = read_json(NORMALIZED_ROOT / f"interactive-{scenario_id}-{baseline}-{round_id}.json".lower())
    native = read_json(NATIVE_ROOT / f"interactive-{scenario_id}-{baseline}-{round_id}.json".lower())
    return InteractiveProjection.model_validate(normalized["projection"]), native


def serialize_transcript(transcript: dict[str, Any]) -> None:
    write_json(TRANSCRIPT_ROOT / f"{transcript['scenarioId'].lower()}.json", transcript)


def resume_scenario(ledger: ProviderLedger, scenario: dict[str, Any]) -> dict[str, Any]:
    scenario_id = scenario["scenarioId"]
    path = TRANSCRIPT_ROOT / f"{scenario_id.lower()}.json"
    transcript = read_json(path)
    resumed_provider_states: list[str] = []
    reused_simulator_answers: list[str] = []

    for state_index in range(2):
        questions: dict[str, str] = {}
        ready_for_candidate: list[str] = []
        for baseline in BASELINE_ORDER:
            branch = transcript["branches"].get(baseline)
            if not branch or not branch["states"]:
                continue
            last_state = branch["states"][-1]
            if last_state["round"] != f"T{state_index}" or last_state["projection"]["action"] != "ASK":
                continue
            if branch["status"] == MISSING_STATUS:
                questions[baseline] = str(last_state["projection"]["next_question"])
            elif branch["status"] == "ACTIVE" and branch["turns"][-1]["role"] == "USER":
                ready_for_candidate.append(baseline)

        answers = (
            simulator_answers(
                ledger=ledger,
                scenario=scenario,
                round_id=f"R{state_index + 1}",
                questions=questions,
            )
            if questions
            else {}
        )
        for baseline, answer in answers.items():
            branch = transcript["branches"][baseline]
            question = questions[baseline]
            branch["turns"].append({
                "message_id": f"{scenario_id}:{baseline}:a{state_index + 1}",
                "role": "ASSISTANT",
                "content": question,
            })
            branch["turns"].append({
                "message_id": f"{scenario_id}:{baseline}:u{state_index + 1}",
                "role": "USER",
                "content": answer,
            })
            branch["status"] = "ACTIVE"
            ready_for_candidate.append(baseline)
            reused_simulator_answers.append(f"{scenario_id}:{baseline}:R{state_index + 1}")
        serialize_transcript(transcript)

        next_round = f"T{state_index + 1}"
        for baseline in ready_for_candidate:
            branch = transcript["branches"][baseline]
            output_path = NORMALIZED_ROOT / f"interactive-{scenario_id}-{baseline}-{next_round}.json".lower()
            if output_path.exists():
                projection, _native = load_projection(scenario_id, baseline, next_round)
                reused = True
            else:
                case = InteractiveCase(
                    case_id=f"{scenario_id}-{baseline}-{next_round}",
                    conversation_turns=[ConversationTurn.model_validate(turn) for turn in branch["turns"]],
                )
                projection, native = run_candidate(
                    baseline,
                    case,
                    ledger=ledger,
                    scenario=scenario_id,
                    round_id=next_round,
                    operation_key=f"CANDIDATE:{scenario_id}:{baseline}:{next_round}",
                )
                save_output(
                    phase="interactive",
                    scenario=scenario_id,
                    baseline=baseline,
                    round_id=next_round,
                    projection=projection,
                    native=native,
                )
                resumed_provider_states.append(f"{scenario_id}:{baseline}:{next_round}")
                reused = False
            branch["states"].append({"round": next_round, "projection": projection.model_dump(mode="json"), "reused": reused})
            if projection.action == "FINISH":
                branch["status"] = "FINISHED"
            elif projection.action == "STOP":
                branch["status"] = "STOPPED_BY_CANDIDATE"
            elif state_index + 1 >= 2:
                branch["status"] = "MAX_DIALOGUE_DEPTH_REACHED"
            else:
                branch["questionsAsked"] += 1
                branch["status"] = MISSING_STATUS
            serialize_transcript(transcript)

    return {
        "scenarioId": scenario_id,
        "resumedProviderStates": resumed_provider_states,
        "reusedSimulatorAnswers": reused_simulator_answers,
        "remainingIncompleteBranches": [
            baseline for baseline, branch in transcript["branches"].items() if branch["status"] == MISSING_STATUS
        ],
    }


def main() -> int:
    ledger = ProviderLedger(LEDGER_PATH)
    manifest = read_json(RESULT_ROOT / "run-manifest.json")
    existing_summary_path = RESULT_ROOT / "resume-summary.json"
    original_reservations = (
        int(read_json(existing_summary_path)["providerReservationsBefore"])
        if existing_summary_path.exists()
        else int(manifest["newProviderRequestsReserved"])
    )
    results = [resume_scenario(ledger, scenario) for scenario in SCENARIOS]
    after = len(ledger.reservations())
    completions = {
        item["requestNumber"]: item for item in ledger.events() if item.get("event") == "COMPLETED"
    }
    resume_reservations = [
        item for item in ledger.reservations() if int(item["requestNumber"]) > original_reservations
    ]
    resumed_states = sorted({
        f"{item['scenario']}:{item['baselineOrSimulator']}:{item['round']}"
        for item in resume_reservations
        if completions.get(item["requestNumber"], {}).get("success") is True
    })
    write_json(RESULT_ROOT / "resume-summary.json", {
        "campaignId": "EXP-SEM-INTERACTIVE-01",
        "resumeMode": "SAFE_RESUME_ONLY_MISSING_WORK",
        "providerReservationsBefore": original_reservations,
        "providerReservationsAfter": after,
        "newProviderReservations": after - original_reservations,
        "resumeSuccessfulCompletions": sum(
            completions.get(item["requestNumber"], {}).get("success") is True for item in resume_reservations
        ),
        "resumeFailedCompletions": sum(
            completions.get(item["requestNumber"], {}).get("success") is False for item in resume_reservations
        ),
        "resumedProviderStates": resumed_states,
        "deterministicCheckpointRecovery": {
            "checkpoint": "native-outputs/simulator-i05-r1.json",
            "recoveredBranches": ["outlines", "sem-current"],
            "providerReplay": False,
        },
        "estimatedDailyUsageAfter": 357 + after,
        "scenarios": results,
    })
    print(stable_json(read_json(RESULT_ROOT / "resume-summary.json")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
