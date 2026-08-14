from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

from contracts.models import AuditFinding, CandidateScientificState, ConsolidatedCandidateState
from audit.deterministic_adapter import DeterministicSemanticAuditor
from pipeline.storage import atomic_write_json, read_json


TURN_ORDER = ["T0", "T1", "T2"]

# Campaign-only visible expectations copied from the mission. They are not runtime rules.
EXPECTATIONS: dict[str, list[tuple[int, str, list[str]]]] = {
    "I01": [
        (0, "stent strategies and infarction context", [r"stent", r"infarct"]),
        (1, "culprit lesion treated immediately", [r"lésion coupable|coupable", r"tout de suite|immédiat"]),
        (1, "non-culprit timing comparison", [r"autres lésions|non.coupable", r"hospitalisation", r"4.?6 semaines"]),
        (2, "infarct size primary", [r"taille d.infarct|infarct size", r"principal"]),
        (2, "MVO secondary", [r"mvo", r"secondaire"]),
        (2, "strain rejected", [r"strain", r"ne veux pas|rejet|negat"]),
    ],
    "I02": [
        (0, "OEF perfusion relation", [r"oef", r"perfusion"]),
        (1, "24h and day 7 timing", [r"24.?h", r"j.?7|jour 7"]),
        (1, "pre-procedure MRI missing", [r"avant.*thrombect|pré.geste|pré.thromb", r"absen|manqu|pas d.irm"]),
        (2, "no automatic exclusion", [r"exclu", r"ne.*pas|aucun|non"]),
        (2, "non-causal association", [r"associ|relation", r"caus", r"ne.*pas|non.causal|rejet"]),
    ],
    "I03": [
        (0, "SUVmax alone insufficient", [r"suvmax", r"seul|insuff|ne.*pas"]),
        (1, "iRECIST primary at 12 weeks", [r"irecist", r"12 semaines", r"principal"]),
        (1, "PFS secondary", [r"ssp|survie sans progression", r"secondaire"]),
        (2, "MTV and TLG candidates", [r"mtv", r"tlg", r"candidat|pas encore choisi|non adopté"]),
        (2, "routine CT not research biomarker", [r"scanner|ct", r"routine", r"pas.*biomarqueur|non.*biomarqueur|ne.*pas"]),
    ],
    "I04": [
        (1, "cine and native T1 all sites", [r"cine", r"t1 natif", r"tous.*centre|partout"]),
        (1, "T2 partial", [r"t2", r"pas.*partout|partiel|indispon"]),
        (2, "LGE partial and not primary", [r"lge", r"pas.*partout|partiel", r"pas.*principal|non.*principal"]),
        (2, "ECV conditional on contrast and hematocrit", [r"ecv", r"contraste", r"hématocrite|hematocrit", r"condition|seulement si"]),
    ],
    "I05": [
        (1, "pathological response primary", [r"réponse pathologique", r"principal"]),
        (1, "recurrence exploratory", [r"récidive", r"exploratoire"]),
        (2, "delta ADC unavailable without second MRI", [r"delta adc", r"seconde irm", r"ne.*pas|impossible"]),
        (2, "baseline-only branch retained", [r"baseline.only|baseline", r"garder|conserv|reste.*valide"]),
    ],
    "I06": [
        (0, "DSC and ASL distinct methods", [r"dsc", r"asl", r"méthod|perfusion|compar"]),
        (1, "true progression versus pseudoprogression at 3 months", [r"progression vraie", r"pseudoprogression", r"3 mois"]),
        (2, "paired comparison requires both", [r"comparaison.*dsc.*asl|dsc.*asl", r"les deux|paired"]),
        (2, "ASL-only secondary branch", [r"asl.only|asl seul|asl-only", r"secondaire"]),
        (2, "principal measure remains unknown", [r"mesure principale|laquelle", r"ne sais pas|inconnu|non chois"]),
    ],
    "I07": [
        (0, "association without causality", [r"associ", r"caus", r"pas|non|rejet"]),
        (1, "prediction exploratory only", [r"prédiction|prédire", r"exploratoire"]),
        (2, "measured iodine concentration", [r"concentration iod", r"mesur"]),
        (2, "iodine presence distinct from concentration", [r"présence d.iode|iode", r"concentration", r"pas simplement|distinct"]),
    ],
    "I08": [
        (0, "Lyon local practice not Project decision", [r"lyon", r"ecv", r"local|pratique|pas.*décision|non.*projet"]),
        (1, "native T1 available all sites", [r"t1 natif", r"tous.*centre|partout"]),
        (1, "ECV only two sites", [r"ecv", r"deux centres|2 centres|partiel"]),
        (2, "native T1 principal candidate", [r"t1 natif", r"candidat principal"]),
        (2, "principal candidate not adopted endpoint", [r"candidat", r"non adopté|pas.*endpoint|pas.*critère|décision.*ouverte"]),
        (2, "ECV exploratory where available", [r"ecv", r"exploratoire", r"disponible|condition"]),
    ],
}


def flatten(candidate: CandidateScientificState | None) -> str:
    if candidate is None:
        return ""
    return json.dumps(candidate.model_dump(mode="json"), ensure_ascii=False, sort_keys=True).casefold()


def expectation_results(scenario: str, turn_index: int, candidate: CandidateScientificState | None) -> list[dict[str, Any]]:
    material = flatten(candidate)
    values: list[dict[str, Any]] = []
    for introduced, label, patterns in EXPECTATIONS[scenario]:
        if introduced > turn_index:
            continue
        matches = [bool(re.search(pattern, material, flags=re.IGNORECASE)) for pattern in patterns]
        values.append({"expectation": label, "met": all(matches), "evidencePatterns": patterns, "patternMatches": matches})
    return values


def intrinsic_violations(candidate: CandidateScientificState | None) -> list[str]:
    if candidate is None:
        return ["NOT_EVALUABLE"]
    values: list[str] = []
    material = candidate.model_dump_json().upper()
    if "PROJECT_ADOPTED" in material:
        values.append("PROJECT_ADOPTION_EMITTED")
    for relation in candidate.relations:
        if relation.sourceElementId == relation.targetElementId:
            values.append(f"SELF_RELATION:{relation.relationId}")
    for item in [*candidate.objects, *candidate.explicitStatements, *candidate.contextualCandidates]:
        if item.epistemicStatus == "REJECTED_BY_USER" and item.activeState:
            values.append(f"REJECTED_STATE_ACTIVE:{item.elementId}")
        if item.originType == "LOCAL_PRACTICE" and item.ownership.upper() == "PROJECT":
            values.append(f"LOCAL_PRACTICE_PROMOTED:{item.elementId}")
        if item.originStatus in {"INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE"} and (
            item.adoptionStatus == "PROJECT_ADOPTED" or item.studyRole.upper() == "PRIMARY_ENDPOINT"
        ):
            values.append(f"CANDIDATE_PROMOTED:{item.elementId}")
    noncausal = any("caus" in f"{item.content} {item.sourceText or ''}".casefold() for item in candidate.negationsAndConstraints)
    if noncausal and any(relation.relationType.upper() in {"CAUSES", "DETERMINES", "PREVENTS"} for relation in candidate.relations):
        values.append("CAUSALITY_DESPITE_EXPLICIT_NON_CAUSALITY")
    if not Path(candidate.source.rawOutputRef).exists():
        values.append("RAW_OUTPUT_LOST")
    return values


def stage_metrics(
    values: list[tuple[str, str, int, CandidateScientificState | None, list[AuditFinding]]],
) -> dict[str, Any]:
    applicable = 0
    met = 0
    critical: list[dict[str, str]] = []
    evaluable = 0
    for scenario, turn, index, candidate, findings in values:
        if candidate and candidate.technicalStatus == "STRUCTURED_CONTRACT_VALID":
            evaluable += 1
        expectations = expectation_results(scenario, index, candidate)
        applicable += len(expectations)
        met += sum(1 for item in expectations if item["met"])
        for item in expectations:
            if not item["met"]:
                critical.append({"scenario": scenario, "turn": turn, "violation": f"VISIBLE_EXPECTATION_NOT_RECONSTRUCTIBLE:{item['expectation']}"})
        for violation in intrinsic_violations(candidate):
            critical.append({"scenario": scenario, "turn": turn, "violation": violation})
        for finding in findings:
            if finding.severity == "CRITICAL" and finding.status in {"OPEN", "ACKNOWLEDGED"}:
                critical.append({"scenario": scenario, "turn": turn, "violation": f"OPEN_FINDING:{finding.findingClass}"})
    return {
        "states": len(values),
        "evaluableStates": evaluable,
        "explicitAndCriticalExpectationRetention": {"met": met, "applicable": applicable, "rate": met / applicable if applicable else None},
        "criticalViolationCount": len(critical),
        "criticalViolations": critical,
    }


def ledger_metrics(result_root: Path) -> dict[str, Any]:
    events = [json.loads(line) for line in (result_root / "provider-ledger.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    reserved = [item for item in events if item["event"] == "RESERVED"]
    completed = [item for item in events if item["event"] == "COMPLETED"]
    raw_present = [item for item in completed if item.get("rawOutputRef") and Path(item["rawOutputRef"]).exists()]
    role_counts = Counter(item["role"] for item in reserved)
    return {
        "providerCalls": len(reserved),
        "callsByRole": dict(sorted(role_counts.items())),
        "retries": sum(1 for item in reserved if item.get("retryOf") is not None),
        "completedOperations": len(completed),
        "technicalFailures": sum(1 for item in completed if not item.get("success")),
        "rawPersistence": {
            "completedWithRaw": len(raw_present),
            "completed": len(completed),
            "rate": len(raw_present) / len(completed) if completed else None,
        },
    }


def load_rows(result_root: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    auditor = DeterministicSemanticAuditor()
    previous_p3: dict[str, CandidateScientificState | None] = {}
    for scenario_index in range(1, 9):
        scenario = f"I{scenario_index:02d}"
        for index, turn in enumerate(TURN_ORDER):
            stem = f"{scenario.lower()}-{turn.lower()}"
            p0_record = read_json(result_root / "candidate-states" / f"{stem}.json")
            d_record = read_json(result_root / "deterministic-findings" / f"{stem}.json")
            l_record = read_json(result_root / "semantic-audit-findings" / f"{stem}.json")
            a_record = read_json(result_root / "adjudication-records" / f"{stem}.json")
            c_record = read_json(result_root / "consolidated-states" / f"{stem}.json")
            primary = CandidateScientificState.model_validate(p0_record["candidateState"])
            d_findings = [AuditFinding.model_validate(item) for item in d_record["findings"]]
            l_findings = [AuditFinding.model_validate(item) for item in l_record["findings"]]
            consolidated = ConsolidatedCandidateState.model_validate(c_record["consolidated"])
            p3 = consolidated.candidateState
            p3_findings = []
            if p3:
                p3_findings = auditor.audit(
                    turns=p3.source.turns,
                    previousState=previous_p3.get(scenario),
                    candidateState=p3,
                    confirmedDecisionIds=[],
                )
            previous_p3[scenario] = p3 or primary
            rows.append({
                "scenario": scenario,
                "turn": turn,
                "turnIndex": index,
                "primary": primary,
                "deterministic": d_findings,
                "semantic": l_findings,
                "auditRecord": l_record,
                "adjudicationRecord": a_record,
                "consolidated": consolidated,
                "p3Findings": p3_findings,
            })
    return rows


def build_metrics(rows: list[dict[str, Any]], result_root: Path) -> dict[str, Any]:
    p0_values = [(r["scenario"], r["turn"], r["turnIndex"], r["primary"], []) for r in rows]
    p1_values = [(r["scenario"], r["turn"], r["turnIndex"], r["primary"], r["deterministic"]) for r in rows]
    p2_values = [(r["scenario"], r["turn"], r["turnIndex"], r["primary"], [*r["deterministic"], *r["semantic"]]) for r in rows]
    p3_values = [(r["scenario"], r["turn"], r["turnIndex"], r["consolidated"].candidateState, r["p3Findings"]) for r in rows]
    operations = ledger_metrics(result_root)
    audit_calls = sum(int(r["auditRecord"].get("providerCalls", 0)) for r in rows)
    adjudicator_calls = sum(int(r["adjudicationRecord"].get("providerCalls", 0)) for r in rows)
    semantic_findings = [item for row in rows for item in row["semantic"]]
    resolutions = [item for row in rows for item in (row["adjudicationRecord"].get("output") or {}).get("resolutions", [])]
    p0 = stage_metrics(p0_values)
    p1 = stage_metrics(p1_values)
    p2 = stage_metrics(p2_values)
    p3 = stage_metrics(p3_values)
    p0_keys = {(item["scenario"], item["turn"], item["violation"]) for item in p0["criticalViolations"]}
    p3_keys = {(item["scenario"], item["turn"], item["violation"]) for item in p3["criticalViolations"]}
    return {
        "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
        "stateCount": 24,
        "stages": {
            "P0_PYDANTIC_DIRECT": p0,
            "P1_PYDANTIC_PLUS_AUDIT_D": {**p1, "findings": sum(len(r["deterministic"]) for r in rows)},
            "P2_PYDANTIC_PLUS_AUDIT_D_PLUS_AUDIT_L": {**p2, "semanticFindings": len(semantic_findings)},
            "P3_FULL_HYBRID_CANDIDATE": p3,
        },
        "conditionalStages": {
            "auditL": {
                "triggeredStates": sum(1 for r in rows if r["auditRecord"]["triggered"]),
                "calls": audit_calls,
                "triggerRate": sum(1 for r in rows if r["auditRecord"]["triggered"]) / 24,
                "findingsConfirmed": sum(1 for item in semantic_findings if item.auditJudgment == "CONFIRMED"),
                "findingsRejected": sum(1 for item in semantic_findings if item.auditJudgment == "REJECTED"),
                "newFindings": sum(1 for item in semantic_findings if item.auditJudgment == "NEW"),
                "noValueCalls": sum(1 for r in rows if r["auditRecord"].get("providerCalls") and not r["semantic"]),
            },
            "adjudicator": {
                "triggeredStates": sum(1 for r in rows if r["adjudicationRecord"]["triggered"]),
                "calls": adjudicator_calls,
                "triggerRate": sum(1 for r in rows if r["adjudicationRecord"]["triggered"]) / 24,
                "resolutions": len(resolutions),
                "noValueCalls": sum(1 for r in rows if r["adjudicationRecord"].get("providerCalls") and not (r["adjudicationRecord"].get("output") or {}).get("resolutions")),
            },
            "criticalViolationsRemovedByP3": len(p0_keys - p3_keys),
            "criticalViolationsIntroducedByP3": len(p3_keys - p0_keys),
            "unresolvedStates": sum(1 for r in rows if r["consolidated"].unresolvedFindingIds),
        },
        "operations": operations,
        "latency": {
            "totalStateLatencyMs": sum(r["consolidated"].latencyMs for r in rows),
            "meanStateLatencyMs": sum(r["consolidated"].latencyMs for r in rows) / 24,
            "callsPerState": operations["providerCalls"] / 24,
        },
        "technicalStatus": {
            "structuredContractFailures": sum(1 for r in rows if r["primary"].technicalStatus == "STRUCTURED_CONTRACT_FAILURE"),
            "auditLTechnicalFailures": sum(1 for r in rows if r["auditRecord"].get("technicalFailure")),
            "adjudicatorTechnicalFailures": sum(1 for r in rows if r["adjudicationRecord"].get("technicalFailure")),
            "notEvaluableP3": sum(1 for r in rows if r["consolidated"].disposition in {"NOT_EVALUABLE", "FAIL_CLOSED"}),
        },
    }


def decision(metrics: dict[str, Any]) -> str:
    p3 = metrics["stages"]["P3_FULL_HYBRID_CANDIDATE"]
    if p3["evaluableStates"] < 24 or p3["criticalViolationCount"] > 0:
        return "HYBRID_RUNTIME_PROTOTYPE_REQUIRES_ALTERNATIVE_PRIMARY_INTERPRETER"
    adjudicator = metrics["conditionalStages"]["adjudicator"]
    audit_l = metrics["conditionalStages"]["auditL"]
    if adjudicator["resolutions"] > 0 and metrics["conditionalStages"]["criticalViolationsRemovedByP3"] > 0:
        return "HYBRID_RUNTIME_WITH_CONDITIONAL_ADJUDICATION_REQUIRED"
    if audit_l["findingsConfirmed"] + audit_l["newFindings"] > 0:
        return "PYDANTIC_PLUS_SEM_AUDIT_RUNTIME_CANDIDATE"
    return "PYDANTIC_GUARDED_RUNTIME_SUFFICIENT"


def json_block(value: Any) -> str:
    return "```json\n" + json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n```"


def human_review(scenario: dict[str, Any], rows: list[dict[str, Any]], result_root: Path) -> str:
    content = [
        f"# {scenario['scenarioId']} — {scenario['title']}",
        "",
        "Visible experimental evidence only. No hidden Gold and no Project write.",
        "",
    ]
    for row in rows:
        candidate = row["primary"]
        raw_record = read_json(Path(candidate.source.rawOutputRef))
        content.extend([
            f"## {row['turn']}",
            "",
            "### INPUT EXACT",
            "",
            json_block([item.model_dump(mode="json") for item in candidate.source.turns]),
            "",
            "### P0 — PYDANTIC DIRECT",
            "",
            "Raw provider output:",
            "",
            json_block(raw_record.get("rawResponse")),
            "",
            "Candidate state:",
            "",
            json_block(candidate.model_dump(mode="json")),
            "",
            "### P1 — DETERMINISTIC AUDIT",
            "",
            json_block([item.model_dump(mode="json") for item in row["deterministic"]]),
            "",
            "### P2 — SEM-AUDIT-L",
            "",
            f"Triggered: `{row['auditRecord']['triggered']}`  ",
            f"Reasons: `{', '.join(row['auditRecord']['triggerReasons']) or 'NONE'}`",
            "",
            json_block([item.model_dump(mode="json") for item in row["semantic"]]),
            "",
            "### P3 — ADJUDICATED CANDIDATE",
            "",
            f"Triggered: `{row['adjudicationRecord']['triggered']}`  ",
            f"Disposition: `{row['consolidated'].disposition}`",
            "",
            "Resolutions:",
            "",
            json_block((row["adjudicationRecord"].get("output") or {}).get("resolutions", [])),
            "",
            "Final candidate state:",
            "",
            json_block(row["consolidated"].candidateState.model_dump(mode="json") if row["consolidated"].candidateState else None),
            "",
            "Open decisions:",
            "",
            json_block([item.model_dump(mode="json") for item in row["consolidated"].openDecisions]),
            "",
            "Clarification needs:",
            "",
            json_block([item.model_dump(mode="json") for item in row["consolidated"].clarificationNeeds]),
            "",
            "Concrete visible-expectation check:",
            "",
            json_block({
                "P0": expectation_results(row["scenario"], row["turnIndex"], row["primary"]),
                "P3": expectation_results(row["scenario"], row["turnIndex"], row["consolidated"].candidateState),
            }),
            "",
        ])
    return "\n".join(content)


def produce_reports(repository_root: Path, result_root: Path, scenario_pack: Path) -> None:
    rows = load_rows(result_root)
    metrics = build_metrics(rows, result_root)
    terminal = decision(metrics)
    metrics["decision"] = terminal
    atomic_write_json(result_root / "metrics.json", metrics)
    atomic_write_json(result_root / "replacement-evidence.json", {
        "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
        "decision": terminal,
        "productRuntimeReplaced": False,
        "evidence": {
            "sharedPrimaryOutputAcrossAblations": all(
                len({
                    read_json(result_root / "consolidated-states" / f"{row['scenario'].lower()}-{row['turn'].lower()}.json")[key]
                    for key in ["p0CandidateStateId", "p1CandidateStateId", "p2CandidateStateId", "p3PrimaryCandidateStateId"]
                }) == 1 for row in rows
            ),
            "p0CriticalViolations": metrics["stages"]["P0_PYDANTIC_DIRECT"]["criticalViolationCount"],
            "p3CriticalViolations": metrics["stages"]["P3_FULL_HYBRID_CANDIDATE"]["criticalViolationCount"],
            "auditLCalls": metrics["conditionalStages"]["auditL"]["calls"],
            "adjudicatorCalls": metrics["conditionalStages"]["adjudicator"]["calls"],
            "providerCalls": metrics["operations"]["providerCalls"],
            "callsPerState": metrics["latency"]["callsPerState"],
        },
        "limitations": [
            "Visible I01-I08 corpus only; this is not independent qualification evidence.",
            "Campaign-only expectation matching is a transparent review aid, not a semantic Gold or composite score.",
            "No QRY, Knowledge/document retrieval or Research Project integration was implemented.",
        ],
    })
    scenarios = read_json(scenario_pack)["scenarios"]
    for scenario in scenarios:
        scenario_rows = [row for row in rows if row["scenario"] == scenario["scenarioId"]]
        (result_root / "human-review" / f"{scenario['scenarioId']}.md").write_text(
            human_review(scenario, scenario_rows, result_root), encoding="utf-8"
        )
    index = [
        "# HYBRID-RUNTIME-PROTOTYPE-01 — Human Review Index",
        "",
        "Visible, non-normative experimental review. Each view shows the exact input, native raw response, shared P0 candidate, P1/P2 findings and P3 consolidation.",
        "",
    ]
    index.extend(f"- [{scenario['scenarioId']} — {scenario['title']}](human-review/{scenario['scenarioId']}.md)" for scenario in scenarios)
    index.extend([
        "",
        f"Decision: `{terminal}`",
        "",
        f"Provider calls: {metrics['operations']['providerCalls']}/80 maximum.",
        f"P3 evaluable states: {metrics['stages']['P3_FULL_HYBRID_CANDIDATE']['evaluableStates']}/24.",
        f"P3 critical violations: {metrics['stages']['P3_FULL_HYBRID_CANDIDATE']['criticalViolationCount']}.",
    ])
    (result_root / "HUMAN-REVIEW-INDEX.md").write_text("\n".join(index) + "\n", encoding="utf-8")

    p0 = metrics["stages"]["P0_PYDANTIC_DIRECT"]
    p3 = metrics["stages"]["P3_FULL_HYBRID_CANDIDATE"]
    final = f"""# HYBRID-RUNTIME-PROTOTYPE-01 — Final Prototype Report

Decision: `{terminal}`

## Architecture executed

PydanticAI direct primary → existing non-mutating SEM-AUDIT-D → conditional SEM Single prompted second reader → conditional typed Pydantic adjudicator → consolidated candidate state. The four ablations reuse the same primary output. No state was written to a Research Project.

## Results

- primary states: 24;
- P0/P1/P2/P3 records: 24 each;
- P0 evaluable states: {p0['evaluableStates']}/24;
- P3 evaluable states: {p3['evaluableStates']}/24;
- P0 critical visible/guard violations: {p0['criticalViolationCount']};
- P3 critical visible/guard violations: {p3['criticalViolationCount']};
- SEM-AUDIT-L: {metrics['conditionalStages']['auditL']['calls']} calls, trigger rate {metrics['conditionalStages']['auditL']['triggerRate']:.1%};
- adjudicator: {metrics['conditionalStages']['adjudicator']['calls']} calls, trigger rate {metrics['conditionalStages']['adjudicator']['triggerRate']:.1%};
- provider requests: {metrics['operations']['providerCalls']}/80, including {metrics['operations']['retries']} retries;
- raw persistence: {metrics['operations']['rawPersistence']['completedWithRaw']}/{metrics['operations']['rawPersistence']['completed']} completed operations;
- mean provider calls/state: {metrics['latency']['callsPerState']:.2f};
- unresolved states: {metrics['conditionalStages']['unresolvedStates']}.

## Interpretation

The experiment measures marginal safeguards on a visible corpus; it is not a qualification campaign. A complete-looking state is not credited when provenance, epistemic status or source constraints are unsafe. Structured failures remain technical evidence and are not relabelled as cognitive failure.

## Boundaries

- QRY implemented: NO;
- product runtime replaced: NO;
- blind data accessed: NO;
- normative documents modified: NO;
- Knowledge or documentary corpus loaded: NO;
- Research Project written: NO.

## Limits

The visible expectation checks are campaign-specific review aids. They do not enter runtime code and do not constitute a hidden Gold. Product adoption still requires a separate architectural decision and subsequent non-regression/qualification work.
"""
    (result_root / "FINAL-PROTOTYPE-REPORT.md").write_text(final, encoding="utf-8")

    short = f"""# HYBRID-RUNTIME-PROTOTYPE-01 — Short report

Decision: `{terminal}`

The isolated prototype executed PydanticAI direct interpretation, the existing non-mutating SEM-AUDIT-D, conditional SEM-AUDIT-L and conditional typed adjudication on 24 visible I01–I08 conversation states. All ablations reuse one primary output per state.

## Outcome

- P0 evaluable: {p0['evaluableStates']}/24; P3 evaluable: {p3['evaluableStates']}/24;
- P0 critical violations: {p0['criticalViolationCount']}; P3: {p3['criticalViolationCount']};
- Audit-L calls: {metrics['conditionalStages']['auditL']['calls']}; adjudicator calls: {metrics['conditionalStages']['adjudicator']['calls']};
- provider calls: {metrics['operations']['providerCalls']}; retries: {metrics['operations']['retries']}; calls/state: {metrics['latency']['callsPerState']:.2f};
- technical failures: {metrics['operations']['technicalFailures']}; raw persistence: {metrics['operations']['rawPersistence']['completedWithRaw']}/{metrics['operations']['rawPersistence']['completed']};
- unresolved states: {metrics['conditionalStages']['unresolvedStates']}.

Detailed evidence is in `experiments/engine-lab/results/hybrid-runtime-prototype-01/FINAL-PROTOTYPE-REPORT.md`, `HUMAN-REVIEW-INDEX.md`, `metrics.json` and `replacement-evidence.json`.

No QRY, Blind, Knowledge retrieval, normative mutation, product replacement or Research Project write occurred.
"""
    (repository_root / "docs" / "hybrid-runtime-prototype-01-report.md").write_text(short, encoding="utf-8")
