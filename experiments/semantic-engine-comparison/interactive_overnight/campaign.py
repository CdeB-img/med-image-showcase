from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel


PACKAGE_ROOT = Path(__file__).resolve().parent
COMPARISON_ROOT = PACKAGE_ROOT.parent
REPOSITORY_ROOT = COMPARISON_ROOT.parents[1]
RESULT_ROOT = COMPARISON_ROOT / "results" / "interactive-overnight"
TRANSCRIPT_ROOT = RESULT_ROOT / "interactive-transcripts"
NATIVE_ROOT = RESULT_ROOT / "native-outputs"
NORMALIZED_ROOT = RESULT_ROOT / "normalized-outputs"
LEDGER_PATH = RESULT_ROOT / "provider-ledger.jsonl"

sys.path.insert(0, str(COMPARISON_ROOT))

from interactive_overnight.baselines import MODEL, api_key, run_external, run_sem  # noqa: E402
from interactive_overnight.ledger import ProviderLedger, utc_now  # noqa: E402
from interactive_overnight.models import BASELINE_IDS, ConversationTurn, InteractiveCase, InteractiveProjection  # noqa: E402


BASELINE_ORDER = ["sem-current", "dspy", "instructor", "pydanticai", "outlines", "langextract"]
CAMPAIGN_ID = "EXP-SEM-INTERACTIVE-01"

SMOKE_CASES = [
    {
        "case_id": "DEV-VISIBLE-TEMPORAL-NONCAUSAL",
        "message": "Je veux comparer l'IRM avant et après traitement, sans supposer que la variation observée est causée par le traitement.",
    },
    {
        "case_id": "DEV-VISIBLE-METHOD-MEASUREMENT",
        "message": "Je veux utiliser le T1 mapping natif et mesurer le T1 myocardique; le rôle du biomarqueur reste à discuter.",
    },
]

SCENARIOS: list[dict[str, Any]] = [
    {
        "scenarioId": "I01",
        "title": "STEMI, stenting and CMR",
        "initialVisible": "Je veux étudier chez des patients avec STEMI la mise en place immédiate versus différée d'un stent, avec une évaluation des lésions en IRM cardiaque.",
        "hiddenCard": {
            "facts": ["STEMI", "stent immédiat versus différé", "IRM cardiaque"],
            "correctionFirstResponse": "La taille d'infarctus est le critère principal; la MVO est secondaire; le strain n'est pas prévu.",
            "unknownResponses": "Si une autre précision non fournie est demandée, répondre qu'elle est inconnue à ce stade.",
            "constraints": ["ne pas inventer de causalité", "ne pas adopter d'autre endpoint"],
        },
    },
    {
        "scenarioId": "I02",
        "title": "Stroke, thrombectomy and OEF",
        "initialVisible": "Je veux étudier après thrombectomie la perfusion cérébrale et l'OEF en lien avec l'évolution des lésions, sans avoir encore fixé tous les temps d'imagerie.",
        "hiddenCard": {
            "facts": ["thrombectomie", "perfusion cérébrale", "OEF", "évolution des lésions"],
            "correctionFirstResponse": "Correction: nous n'aurons pas d'IRM avant thrombectomie. Les temps prévus sont 24 h et J7. Nous étudions une association, pas une causalité.",
            "unknownResponses": "Toute précision non fournie reste inconnue.",
            "constraints": ["aucune IRM pré-thrombectomie", "24 h et J7", "association non causale"],
        },
    },
    {
        "scenarioId": "I03",
        "title": "Immunotherapy and FDG PET",
        "initialVisible": "Je veux suivre sous immunothérapie la réponse tumorale en TEP-FDG et voir quels paramètres quantitatifs seraient utiles.",
        "hiddenCard": {
            "facts": ["immunothérapie", "réponse tumorale", "TEP-FDG"],
            "correctionFirstResponse": "Le critère principal sera la réponse iRECIST à 12 semaines; la PFS est secondaire. MTV et TLG peuvent rester des candidats. Le CT de routine n'est pas un biomarqueur.",
            "unknownResponses": "Les détails non mentionnés restent inconnus.",
            "constraints": ["iRECIST à 12 semaines principal", "PFS secondaire", "MTV/TLG candidats", "CT routine non biomarqueur"],
        },
    },
    {
        "scenarioId": "I04",
        "title": "Fabry multicenter",
        "initialVisible": "Nous préparons une étude multicentrique dans la maladie de Fabry et voulons identifier les mesures IRM quantitatives comparables entre centres.",
        "hiddenCard": {
            "facts": ["Fabry", "multicentrique", "IRM quantitative", "comparabilité inter-centres"],
            "correctionFirstResponse": "Le T1 natif peut rester candidat principal. L'ECV est conditionnel. Non, le T2 ne sera pas disponible partout: il reste exploratoire. Le LGE n'est disponible que partiellement et ne sera pas principal.",
            "unknownResponses": "Pour le reste, répondre inconnu.",
            "constraints": ["non est une donnée", "T2 exploratoire", "LGE partiel non principal", "ECV conditionnel"],
        },
    },
    {
        "scenarioId": "I05",
        "title": "Rectal cancer and ADC delta",
        "initialVisible": "Je veux étudier en IRM la réponse d'un cancer du rectum pendant le traitement et quantifier l'évolution de l'ADC.",
        "hiddenCard": {
            "facts": ["cancer du rectum", "IRM", "réponse pendant traitement", "variation ADC"],
            "correctionFirstResponse": "Le delta ADC entre baseline et mi-traitement est exploratoire. La réponse pathologique finale est la référence, sans supposer qu'une hausse d'ADC la cause.",
            "unknownResponses": "Les autres paramètres restent inconnus.",
            "constraints": ["delta ADC exploratoire", "réponse pathologique référence", "pas de causalité"],
        },
    },
]


class SimulatorAnswer(BaseModel):
    baseline: str
    answer: str


class SimulatorBatch(BaseModel):
    answers: list[SimulatorAnswer]


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(stable_json(value), encoding="utf-8")
    temporary.replace(path)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git_head() -> str:
    return subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPOSITORY_ROOT, text=True, capture_output=True, check=True).stdout.strip()


def error_kind(caught: BaseException) -> str:
    material = f"{caught.__class__.__name__}: {caught}".lower()
    if any(token in material for token in ["429", "resource_exhausted", "502", "503", "504", "timeout", "unavailable", "connection reset"]):
        return "TRANSIENT_PROVIDER"
    if any(token in material for token in ["400", "invalid_argument", "schema", "validationerror", "jsondecode"]):
        return "DETERMINISTIC_CONTRACT_OR_OUTPUT"
    return "FRAMEWORK_OR_UNKNOWN"


def run_candidate(slug: str, case: InteractiveCase, *, ledger: ProviderLedger, scenario: str, round_id: str, operation_key: str):
    if slug == "sem-current":
        return run_sem(case, ledger_path=LEDGER_PATH, scenario=scenario, round_id=round_id, operation_key=operation_key)
    try:
        return run_external(slug, case, ledger=ledger, scenario=scenario, round_id=round_id, operation_key=operation_key)
    except Exception as caught:
        if error_kind(caught) != "TRANSIENT_PROVIDER":
            raise
        time.sleep(60)
        return ledger.call(
            baseline=BASELINE_IDS[slug], scenario=scenario, round_id=round_id,
            operation="CANDIDATE_SCIENTIFIC_STATE", operation_key=f"{operation_key}:retry1", retry=1,
            function=lambda: __import__("interactive_overnight.baselines", fromlist=["RUNNERS"]).RUNNERS[slug](case),
        )


def save_output(*, phase: str, scenario: str, baseline: str, round_id: str, projection: InteractiveProjection, native: Any) -> None:
    stem = f"{phase}-{scenario}-{baseline}-{round_id}".lower()
    write_json(NATIVE_ROOT / f"{stem}.json", native)
    write_json(NORMALIZED_ROOT / f"{stem}.json", {
        "campaignId": CAMPAIGN_ID,
        "scenarioId": scenario,
        "baseline": baseline,
        "round": round_id,
        "normalization": "EXPERIMENTAL_MINIMAL_PROJECTION_NO_SCIENTIFIC_ENRICHMENT",
        "projection": projection.model_dump(mode="json"),
    })


def smoke(ledger: ProviderLedger) -> dict[str, Any]:
    results: dict[str, Any] = {}
    phase_start = len([item for item in ledger.reservations() if item.get("scenario") == "SMOKE"])
    for slug in BASELINE_ORDER:
        rows = []
        for index, item in enumerate(SMOKE_CASES, start=1):
            if len([event for event in ledger.reservations() if event.get("scenario") == "SMOKE"]) >= 25:
                rows.append({"caseId": item["case_id"], "status": "PHASE_A_CALL_CAP_REACHED"})
                continue
            normalized_path = NORMALIZED_ROOT / f"smoke-{item['case_id']}-{slug}-s{index}".lower()
            normalized_path = normalized_path.with_suffix(".json")
            if normalized_path.exists():
                rows.append({"caseId": item["case_id"], "status": "SUCCESS_REUSED"})
                continue
            case = InteractiveCase(
                case_id=item["case_id"],
                conversation_turns=[ConversationTurn(message_id=f"{item['case_id']}:u1", role="USER", content=item["message"])],
            )
            started = time.monotonic()
            try:
                projection, native = run_candidate(
                    slug, case, ledger=ledger, scenario="SMOKE", round_id=f"S{index}",
                    operation_key=f"SMOKE:{slug}:{item['case_id']}",
                )
                save_output(phase="smoke", scenario=item["case_id"], baseline=slug, round_id=f"S{index}", projection=projection, native=native)
                rows.append({"caseId": item["case_id"], "status": "SUCCESS", "latencySeconds": round(time.monotonic() - started, 3)})
            except Exception as caught:
                rows.append({
                    "caseId": item["case_id"], "status": "FAILED", "failureClass": error_kind(caught),
                    "error": f"{caught.__class__.__name__}: {caught}"[-2000:], "latencySeconds": round(time.monotonic() - started, 3),
                })
        results[slug] = {
            "status": "TECHNICALLY_READY" if sum(row["status"].startswith("SUCCESS") for row in rows) == 2 else "TECHNICALLY_UNAVAILABLE",
            "runs": rows,
        }
    readiness = {
        "campaignId": CAMPAIGN_ID,
        "phase": "A_TECHNICAL_READINESS",
        "model": MODEL,
        "phaseACallsBeforeResume": phase_start,
        "phaseACalls": len([item for item in ledger.reservations() if item.get("scenario") == "SMOKE"]),
        "baselines": results,
        "generatedAt": utc_now(),
    }
    write_json(RESULT_ROOT / "technical-readiness.json", readiness)
    return readiness


def simulator_answers(*, ledger: ProviderLedger, scenario: dict[str, Any], round_id: str, questions: dict[str, str]) -> dict[str, str]:
    if not questions:
        return {}
    operation_key = f"SIMULATOR:{scenario['scenarioId']}:{round_id}"
    checkpoint = NATIVE_ROOT / f"simulator-{scenario['scenarioId']}-{round_id}.json".lower()
    if checkpoint.exists():
        recorded = read_json(checkpoint)
        return {str(item["baseline"]): str(item["answer"]) for item in recorded.get("answers", [])}
    if operation_key in ledger.completed_operation_keys():
        # The provider operation succeeded during an earlier interrupted run, but
        # its output was not checkpointed. Never replay it silently.
        return {}
    client = genai.Client(
        api_key=api_key(),
        http_options=types.HttpOptions(timeout=30_000, retry_options=types.HttpRetryOptions(attempts=1)),
    )
    payload = {
        "instruction": "Act as the same simulated research user independently in each branch. Answer only the question asked. Never mention the hidden card. On round R1, integrate correctionFirstResponse in every answer while still answering the question. You may answer unknown or non. Do not add scientific knowledge not present in the card. Return exactly one answer per baseline.",
        "scenarioId": scenario["scenarioId"],
        "round": round_id,
        "hiddenCard": scenario["hiddenCard"],
        "questions": questions,
    }
    def call():
        response = client.models.generate_content(
            model=MODEL,
            contents=json.dumps(payload, ensure_ascii=False, sort_keys=True),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_json_schema=SimulatorBatch.model_json_schema(),
            ),
        )
        return SimulatorBatch.model_validate_json(response.text)
    try:
        result = ledger.call(
            baseline="SIMULATED_RESEARCH_USER", scenario=scenario["scenarioId"], round_id=round_id,
            operation="BATCHED_SIMULATOR_ANSWER", operation_key=operation_key,
            function=call,
        )
    except Exception as caught:
        if error_kind(caught) != "TRANSIENT_PROVIDER":
            raise
        time.sleep(60)
        result = ledger.call(
            baseline="SIMULATED_RESEARCH_USER", scenario=scenario["scenarioId"], round_id=round_id,
            operation="BATCHED_SIMULATOR_ANSWER", operation_key=f"SIMULATOR:{scenario['scenarioId']}:{round_id}:retry1",
            function=call, retry=1,
        )
    write_json(checkpoint, result.model_dump(mode="json"))
    answer_map = {item.baseline: item.answer for item in result.answers}
    return {key: answer_map[key] for key in questions if key in answer_map}


def scenario_cost_estimate(readiness: dict[str, Any]) -> int:
    ready = [slug for slug in BASELINE_ORDER if readiness["baselines"][slug]["status"] == "TECHNICALLY_READY"]
    # Observed SEM smoke calls are used because the native stack can make reconstruction and critic calls.
    sem_calls = 0
    if "sem-current" in ready:
        reservations = [item for item in ProviderLedger(LEDGER_PATH).reservations() if item["baselineOrSimulator"] == BASELINE_IDS["sem-current"]]
        sem_calls = max(2, (len(reservations) + 1) // 2)
    per_state = len([slug for slug in ready if slug != "sem-current"]) + sem_calls
    return 3 * per_state + 2


def run_scenario(ledger: ProviderLedger, readiness: dict[str, Any], scenario: dict[str, Any]) -> dict[str, Any]:
    scenario_id = scenario["scenarioId"]
    active = [slug for slug in BASELINE_ORDER if readiness["baselines"][slug]["status"] == "TECHNICALLY_READY"]
    branches = {
        slug: {
            "baseline": slug,
            "status": "ACTIVE",
            "questionsAsked": 0,
            "turns": [ConversationTurn(message_id=f"{scenario_id}:{slug}:u0", role="USER", content=scenario["initialVisible"])],
            "states": [],
        }
        for slug in active
    }
    for state_index in range(3):
        round_id = f"T{state_index}"
        questions: dict[str, str] = {}
        for slug in active:
            branch = branches[slug]
            if branch["status"] != "ACTIVE":
                continue
            output_path = NORMALIZED_ROOT / f"interactive-{scenario_id}-{slug}-{round_id}.json".lower()
            if output_path.exists():
                stored = read_json(output_path)
                projection = InteractiveProjection.model_validate(stored["projection"])
                native = read_json(NATIVE_ROOT / f"interactive-{scenario_id}-{slug}-{round_id}.json".lower())
                reused = True
            else:
                case = InteractiveCase(case_id=f"{scenario_id}-{slug}-{round_id}", conversation_turns=branch["turns"])
                try:
                    projection, native = run_candidate(
                        slug, case, ledger=ledger, scenario=scenario_id, round_id=round_id,
                        operation_key=f"CANDIDATE:{scenario_id}:{slug}:{round_id}",
                    )
                    save_output(phase="interactive", scenario=scenario_id, baseline=slug, round_id=round_id, projection=projection, native=native)
                    reused = False
                except Exception as caught:
                    branch["status"] = "TECHNICAL_FAILURE"
                    branch["failure"] = {"class": error_kind(caught), "error": f"{caught.__class__.__name__}: {caught}"[-2000:]}
                    continue
            branch["states"].append({"round": round_id, "projection": projection.model_dump(mode="json"), "reused": reused})
            if projection.action == "STOP":
                branch["status"] = "STOPPED_BY_CANDIDATE"
            elif projection.action == "FINISH":
                branch["status"] = "FINISHED"
            elif state_index == 2 or branch["questionsAsked"] >= 2:
                branch["status"] = "MAX_DIALOGUE_DEPTH_REACHED"
            else:
                branch["questionsAsked"] += 1
                questions[slug] = projection.next_question or ""
        if not questions:
            continue
        answers = simulator_answers(ledger=ledger, scenario=scenario, round_id=f"R{state_index + 1}", questions=questions)
        for slug in set(questions) - set(answers):
            branches[slug]["status"] = "SIMULATOR_OUTPUT_NOT_CHECKPOINTED_OR_BRANCH_MISSING"
        for slug, answer in answers.items():
            branch = branches[slug]
            question = questions[slug]
            branch["turns"].append(ConversationTurn(message_id=f"{scenario_id}:{slug}:a{state_index + 1}", role="ASSISTANT", content=question))
            branch["turns"].append(ConversationTurn(message_id=f"{scenario_id}:{slug}:u{state_index + 1}", role="USER", content=answer))
    serializable = {
        "scenarioId": scenario_id,
        "title": scenario["title"],
        "initialVisible": scenario["initialVisible"],
        "branches": {
            slug: {
                **{key: value for key, value in branch.items() if key != "turns"},
                "turns": [item.model_dump(mode="json") for item in branch["turns"]],
            }
            for slug, branch in branches.items()
        },
    }
    write_json(TRANSCRIPT_ROOT / f"{scenario_id.lower()}.json", serializable)
    return serializable


def run_interactive(ledger: ProviderLedger, readiness: dict[str, Any]) -> list[dict[str, Any]]:
    completed = []
    for index, scenario in enumerate(SCENARIOS):
        path = TRANSCRIPT_ROOT / f"{scenario['scenarioId'].lower()}.json"
        if path.exists():
            completed.append(read_json(path))
            continue
        estimate = scenario_cost_estimate(readiness)
        remaining = 135 - len(ledger.reservations())
        if remaining < estimate:
            if index < 4:
                break
            continue
        completed.append(run_scenario(ledger, readiness, scenario))
    return completed


def manifest(ledger: ProviderLedger, readiness: dict[str, Any], transcripts: list[dict[str, Any]]) -> dict[str, Any]:
    files = sorted([*PACKAGE_ROOT.glob("*.py"), PACKAGE_ROOT / "sem_runner.ts"])
    value = {
        "campaignId": CAMPAIGN_ID,
        "status": "GENERATION_COMPLETE_AWAITING_POST_HOC_ADJUDICATION",
        "nature": "EXPERIMENTAL_NON_NORMATIVE_EXPLORATORY",
        "sourceHead": git_head(),
        "provider": "GOOGLE_GEMINI",
        "model": MODEL,
        "samplingParameters": "OMITTED",
        "baselines": [BASELINE_IDS[slug] for slug in BASELINE_ORDER],
        "scientificStateOwner": "SEM_OR_EXTERNAL_FRAMEWORK_BASELINE",
        "dialogueControl": {
            "noxiaImplementedStatus": "NOXIA_INTERACTIVE_CONTROLLER_NOT_IMPLEMENTED",
            "experimentalPolicy": "Candidate output action constrained by generic prompt; SEM action adapted from native clarification candidates.",
        },
        "scenarioIdsExecuted": [item["scenarioId"] for item in transcripts],
        "newProviderRequestsReserved": len(ledger.reservations()),
        "knownDailyUsageBeforeMission": 357,
        "estimatedDailyUsageAfterMission": 357 + len(ledger.reservations()),
        "codeDigests": {str(path.relative_to(REPOSITORY_ROOT)): digest(path) for path in files},
        "technicalReadinessDigest": digest(RESULT_ROOT / "technical-readiness.json"),
        "scenarioCardsDigest": digest(RESULT_ROOT / "scenario-cards.json"),
        "createdAt": utc_now(),
        "forbiddenClaims": ["PD011_PASS", "INDEPENDENT_BLIND", "HUMAN_EXPERT_ADJUDICATION"],
    }
    write_json(RESULT_ROOT / "run-manifest.json", value)
    return value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["smoke", "interactive", "all"], default="all")
    args = parser.parse_args()
    RESULT_ROOT.mkdir(parents=True, exist_ok=True)
    for path in [TRANSCRIPT_ROOT, NATIVE_ROOT, NORMALIZED_ROOT]:
        path.mkdir(parents=True, exist_ok=True)
    write_json(RESULT_ROOT / "scenario-cards.json", {
        "campaignId": CAMPAIGN_ID,
        "classification": "EXPERIMENTAL_VISIBLE_SIMULATOR_CARDS_NOT_BLIND",
        "branchIsolation": True,
        "scenarios": SCENARIOS,
    })
    ledger = ProviderLedger(LEDGER_PATH)
    readiness = read_json(RESULT_ROOT / "technical-readiness.json") if (RESULT_ROOT / "technical-readiness.json").exists() else None
    if args.phase in {"smoke", "all"}:
        readiness = smoke(ledger)
    if readiness is None:
        raise RuntimeError("TECHNICAL_READINESS_MISSING")
    transcripts: list[dict[str, Any]] = []
    if args.phase in {"interactive", "all"}:
        transcripts = run_interactive(ledger, readiness)
    manifest(ledger, readiness, transcripts)
    print(stable_json({
        "campaignId": CAMPAIGN_ID,
        "phase": args.phase,
        "ready": {key: value["status"] for key, value in readiness["baselines"].items()},
        "scenariosComplete": [item["scenarioId"] for item in transcripts],
        "providerRequestsReserved": len(ledger.reservations()),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
