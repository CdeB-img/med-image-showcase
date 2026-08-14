from __future__ import annotations

import argparse
import datetime as dt
import difflib
import json
import statistics
from pathlib import Path
from typing import Any

from common_contract_ablation_02.campaign import (
    CONFIGURATION_IDS,
    COMMON_TRANSCRIPT_ROOT,
    FREEZE_PATH,
    INTERACTIVE_ROOT,
    LEDGER_PATH,
    NATIVE_ROOT,
    RESULT_ROOT,
    SCENARIO_PACK_PATH,
    STATE_ROOT,
    VIEW_ROOT,
    read_json,
    sha256,
    stable_json,
    verify_freeze,
    write_json,
)


COLLECTIONS = [
    "explicitUserStatements",
    "objects",
    "relations",
    "inferredContext",
    "contextualScientificCandidates",
    "negationsAndConstraints",
    "temporalModel",
    "ambiguities",
    "missingInformation",
    "unknowns",
    "correctionsAndSupersessions",
    "ownershipAndEpistemicState",
    "clarificationCandidates",
    "contradictions",
]

SECTION_TITLES = {
    "explicitUserStatements": "EXPLICITEMENT DIT PAR LE CHERCHEUR",
    "relations": "RELATIONS COMPRISES",
    "inferredContext": "CONTEXTE INFÉRÉ",
    "contextualScientificCandidates": "CANDIDATS SCIENTIFIQUES CONTEXTUELS",
    "negationsAndConstraints": "NÉGATIONS / CONTRAINTES",
    "temporalModel": "TEMPORALITÉ",
    "ambiguities": "AMBIGUÏTÉS",
    "missingInformation": "INFORMATIONS MANQUANTES",
    "unknowns": "INCONNUES",
    "correctionsAndSupersessions": "CORRECTIONS / SUPERSESSIONS",
    "ownershipAndEpistemicState": "OWNERSHIP / STATUT ÉPISTÉMIQUE",
    "clarificationCandidates": "QUESTIONS DE CLARIFICATION CANDIDATES",
}


def compact(value: Any) -> str:
    if value is None:
        return "—"
    if isinstance(value, bool):
        return "oui" if value else "non"
    if isinstance(value, (str, int, float)):
        return str(value)
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def item_line(value: Any) -> str:
    if isinstance(value, str):
        return f"- {value}"
    if not isinstance(value, dict):
        return f"- {compact(value)}"
    order = [
        "content", "subject", "predicate", "object", "previousContent", "currentContent",
        "question", "scientificRole", "polarity", "temporalContext", "epistemicStatus",
        "ownership", "owner", "priority", "blocking", "decisionImpact", "basis",
        "provenanceTurnIds", "sourceText", "interpretations", "disposition", "targetIds",
    ]
    fields = [f"{key}={compact(value[key])}" for key in order if key in value and value[key] not in (None, [], "")]
    return "- " + (" | ".join(fields) if fields else compact(value))


def collection_lines(values: list[Any]) -> list[str]:
    return [item_line(value) for value in values] if values else ["- Aucun élément produit."]


def render_state_view(payload: dict[str, Any], selected: Any = None, previous: dict[str, Any] | None = None) -> str:
    state = payload["state"]
    turns = state.get("conversationTurns", [])
    lines = [
        f"# {payload['scenarioId']} — {payload['configurationId']} — {payload['phase']} {payload['round']}",
        "",
        "## INPUT",
        "",
        "Message utilisateur courant VERBATIM :",
        "",
        f"> {turns[-1].get('content', '—') if turns else '—'}",
        "",
        "Conversation précédente VERBATIM :",
        "",
    ]
    previous_turns = turns[:-1]
    lines.extend([f"> {turn.get('turnId', '?')} | {turn.get('role', '?')} : {turn.get('content', '')}" for turn in previous_turns] or ["> —"])
    lines.extend([
        "",
        "## COMPRÉHENSION GLOBALE",
        "",
        state.get("normalizedUnderstanding") or "—",
        "",
        "Objectif scientifique produit :",
        "",
        state.get("scientificGoal") or "—",
    ])
    for key in [
        "explicitUserStatements", "relations", "inferredContext", "contextualScientificCandidates",
        "negationsAndConstraints", "temporalModel", "ambiguities", "missingInformation", "unknowns",
        "correctionsAndSupersessions", "ownershipAndEpistemicState", "clarificationCandidates",
    ]:
        lines.extend(["", f"## {SECTION_TITLES[key]}", "", *collection_lines(state.get(key, []))])
    lines.extend(["", "## QUESTION SÉLECTIONNÉE", "", compact(selected or "NON_EXÉCUTÉE_DANS_CETTE_PHASE")])
    if previous is not None:
        lines.extend(["", "## APRÈS RÉPONSE — DIFF DÉTERMINISTE", ""])
        delta = state_diff(previous["state"], state)
        lines.extend([f"- {row['disposition']} | {row['collection']} | {row['value']}" for row in delta] or ["- Aucune différence structurée."])
        lines.extend(["", "État complet : voir toutes les sections ci-dessus."])
    lines.extend(["", "_Vue déterministe : aucune reformulation LLM post-hoc._", ""])
    return "\n".join(lines)


def comparable(value: Any) -> str:
    if not isinstance(value, dict):
        return compact(value)
    ignored = {key for key in value if key.lower().endswith("id") or key in {"provenanceTurnIds"}}
    return json.dumps({key: value[key] for key in sorted(value) if key not in ignored}, ensure_ascii=False, sort_keys=True)


def state_diff(before: dict[str, Any], after: dict[str, Any]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    if before.get("normalizedUnderstanding") != after.get("normalizedUnderstanding"):
        rows.append({"disposition": "MODIFIÉ", "collection": "normalizedUnderstanding", "value": f"{before.get('normalizedUnderstanding', '—')} → {after.get('normalizedUnderstanding', '—')}"})
    for key in COLLECTIONS:
        before_values = before.get(key, [])
        after_values = after.get(key, [])
        before_map = {comparable(value): value for value in before_values}
        after_map = {comparable(value): value for value in after_values}
        for identity in after_map.keys() - before_map.keys():
            rows.append({"disposition": "AJOUTÉ", "collection": key, "value": compact(after_map[identity])})
        for identity in before_map.keys() - after_map.keys():
            rows.append({"disposition": "REJETÉ_OU_SUPERSEDED", "collection": key, "value": compact(before_map[identity])})
    return rows


def payload_path(phase: str, scenario_id: str, round_id: str, configuration_id: str) -> Path:
    name = f"{phase}-{scenario_id}-{round_id}-{configuration_id}".lower().replace("_", "-") + ".json"
    return STATE_ROOT / name


def exact_inputs(scenario: dict[str, Any], round_id: str) -> str:
    values = [f"T0: {scenario['t0']}"]
    if round_id in {"T1", "T2"}:
        values.append(f"R1: {scenario['r1']}")
    if round_id == "T2":
        values.append(f"R2: {scenario['r2']}")
    return "\n\n".join(values)


def selected_for(scenario_id: str, configuration_id: str, round_id: str) -> Any:
    path = INTERACTIVE_ROOT / f"{scenario_id.lower()}.json"
    if not path.exists():
        return None
    branch = next((item for item in read_json(path)["branches"].values() if item["configurationId"] == configuration_id), None)
    if not branch:
        return None
    row = next((item for item in branch.get("selectedQuestions", []) if item["round"] == round_id), None)
    return row["selection"] if row else None


def write_views_and_review_book() -> None:
    scenario_pack = read_json(SCENARIO_PACK_PATH)
    review_root = RESULT_ROOT / "human-review"
    review_root.mkdir(parents=True, exist_ok=True)
    index = ["# EXP-SEM-ABLATION-02 — Human Review Index", "", "Vues déterministes, non normatives, sans adjudication LLM.", ""]
    for scenario in scenario_pack["scenarios"]:
        scenario_id = scenario["scenarioId"]
        index.append(f"- [{scenario_id} — {scenario['title']}](human-review/{scenario_id}.md)")
        lines = [f"# {scenario_id} — {scenario['title']}", "", "## Common Transcript", ""]
        for round_index, round_id in enumerate(["T0", "T1", "T2"]):
            lines.extend([f"## {round_id} — QUESTION / CONVERSATION EXACTE", "", exact_inputs(scenario, round_id), ""])
            for configuration_id in CONFIGURATION_IDS:
                path = payload_path("COMMON_TRANSCRIPT", scenario_id, round_id, configuration_id)
                lines.extend([f"### {configuration_id}", ""])
                if not path.exists():
                    lines.extend(["ÉTAT ABSENT / ÉCHEC TECHNIQUE.", ""])
                    continue
                payload = read_json(path)
                previous = None if round_index == 0 else read_json(payload_path("COMMON_TRANSCRIPT", scenario_id, f"T{round_index - 1}", configuration_id))
                view = render_state_view(payload, previous=previous)
                view_path = VIEW_ROOT / path.name.replace(".json", ".md")
                view_path.parent.mkdir(parents=True, exist_ok=True)
                view_path.write_text(view, encoding="utf-8")
                lines.extend([view, ""])
        lines.extend(["## Tableau synthétique concret — état T2", "", "| Dimension | SEM Full | SEM Single | Pydantic | Pydantic+Critic | DSPy |", "|---|---|---|---|---|---|"])
        rows = [
            ("Compréhension globale", "normalizedUnderstanding"),
            ("Explicite manquant / reconnu", "explicitUserStatements"),
            ("Inférences pertinentes", "inferredContext"),
            ("Candidats contextuels", "contextualScientificCandidates"),
            ("Ambiguïtés", "ambiguities"),
            ("Question choisie", "clarificationCandidates"),
        ]
        payloads = [read_json(payload_path("COMMON_TRANSCRIPT", scenario_id, "T2", configuration_id))["state"] for configuration_id in CONFIGURATION_IDS]
        for label, key in rows:
            values = []
            for state in payloads:
                value = state.get(key)
                if isinstance(value, list):
                    value = [item.get("content") or item.get("question") or item.get("subject") or item for item in value]
                values.append(compact(value).replace("|", "\\|"))
            lines.append("| " + " | ".join([label, *values]) + " |")
        interactive_path = INTERACTIVE_ROOT / f"{scenario_id.lower()}.json"
        if interactive_path.exists():
            lines.extend(["", "## Interactive Dialogue", "", "Branches et questions réellement échangées :", "", "```json", stable_json(read_json(interactive_path)).rstrip(), "```"])
        (review_root / f"{scenario_id}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (RESULT_ROOT / "HUMAN-REVIEW-INDEX.md").write_text("\n".join(index) + "\n", encoding="utf-8")


def diff_pair(phase: str, scenario_id: str, round_id: str, before_id: str, after_id: str) -> dict[str, Any] | None:
    before_path = payload_path(phase, scenario_id, round_id, before_id)
    after_path = payload_path(phase, scenario_id, round_id, after_id)
    if not before_path.exists() or not after_path.exists():
        return None
    before = read_json(before_path)["state"]
    after = read_json(after_path)["state"]
    delta = state_diff(before, after)
    return {
        "phase": phase,
        "scenarioId": scenario_id,
        "round": round_id,
        "before": before_id,
        "after": after_id,
        "classification": "NO_MEANINGFUL_CHANGE" if not delta else "POST_PASS_CHANGED_REQUIRES_SIMULATED_POST_HOC_ADJUDICATION",
        "changes": delta,
        "normalizedUnderstandingDiff": list(difflib.ndiff(
            str(before.get("normalizedUnderstanding", "")).split(),
            str(after.get("normalizedUnderstanding", "")).split(),
        )),
    }


def component_contribution() -> dict[str, Any]:
    rows = []
    for scenario_id in [f"I{index:02d}" for index in range(1, 9)]:
        for round_id in ["T0", "T1", "T2"]:
            for before, after in [
                ("SEM_SINGLE_PASS", "SEM_FULL"),
                ("PYDANTIC_COMMON_CONTRACT", "PYDANTIC_CONDITIONAL_CRITIC"),
                ("SEM_SINGLE_PASS", "PYDANTIC_COMMON_CONTRACT"),
                ("SEM_FULL", "PYDANTIC_CONDITIONAL_CRITIC"),
                ("PYDANTIC_COMMON_CONTRACT", "DSPY_COMMON_CONTRACT"),
            ]:
                row = diff_pair("COMMON_TRANSCRIPT", scenario_id, round_id, before, after)
                if row:
                    rows.append(row)
    return {
        "adjudication": "SIMULATED_POST_HOC_ADJUDICATION",
        "realHumanReview": False,
        "exactDeterministicDiffs": rows,
        "note": "Changed states require bounded post-hoc scientific classification; a textual reformulation alone is never a useful change.",
    }


def operational_metrics() -> dict[str, Any]:
    events = [json.loads(line) for line in LEDGER_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]
    reservations = [event for event in events if event.get("event") == "RESERVED"]
    completions = {event["requestNumber"]: event for event in events if event.get("event") == "COMPLETED"}
    by_configuration: dict[str, dict[str, Any]] = {}
    for reservation in reservations:
        row = by_configuration.setdefault(reservation["configurationId"], {"providerCalls": 0, "criticCalls": 0, "repairCalls": 0, "retries": 0, "latencies": []})
        row["providerCalls"] += 1
        row["criticCalls"] += "CRITIC" in reservation["operation"]
        row["repairCalls"] += "REPAIR" in reservation["operation"]
        row["retries"] += int(reservation.get("retry", 0) > 0)
        completion = completions.get(reservation["requestNumber"])
        if completion:
            start = dt.datetime.fromisoformat(completion["startedAt"].replace("Z", "+00:00"))
            end = dt.datetime.fromisoformat(completion["completedAt"].replace("Z", "+00:00"))
            row["latencies"].append((end - start).total_seconds())
    for row in by_configuration.values():
        values = row.pop("latencies")
        row["medianLatencySeconds"] = round(statistics.median(values), 3) if values else None
        row["meanLatencySeconds"] = round(statistics.mean(values), 3) if values else None
    state_counts = {configuration_id: len(list(STATE_ROOT.glob(f"*-{configuration_id.lower().replace('_', '-')}.json"))) for configuration_id in CONFIGURATION_IDS}
    return {
        "totalProviderCalls": len(reservations),
        "successfulProviderCalls": sum(completions.get(row["requestNumber"], {}).get("success") is True for row in reservations),
        "failedProviderCalls": sum(completions.get(row["requestNumber"], {}).get("success") is False for row in reservations),
        "byLedgerConfiguration": by_configuration,
        "successfulStatesByArchitecture": state_counts,
        "scenarioPackDigestAfterCampaign": sha256(SCENARIO_PACK_PATH),
        "scenarioPackDigestUnchanged": sha256(SCENARIO_PACK_PATH) == read_json(FREEZE_PATH)["scenarioPackDigest"],
    }


def generate() -> None:
    verify_freeze()
    write_views_and_review_book()
    write_json(RESULT_ROOT / "component-contribution-analysis.json", component_contribution())
    write_json(RESULT_ROOT / "operational-metrics.json", operational_metrics())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["generate"])
    parser.parse_args()
    generate()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
