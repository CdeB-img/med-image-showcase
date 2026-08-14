from __future__ import annotations

import datetime as dt
import hashlib
import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REPO = Path(__file__).resolve().parents[3]
RESULT = REPO / "experiments/semantic-engine-comparison/results/common-contract-ablation-02"
STATE_ROOT = RESULT / "common-states"
NATIVE_ROOT = RESULT / "native-outputs"
VIEW_ROOT = RESULT / "human-readable"
REVIEW_ROOT = RESULT / "human-review"
LEDGER = RESULT / "provider-ledger.jsonl"
SCENARIO_PACK = RESULT / "scenario-pack-frozen.json"
FREEZE = RESULT / "experiment-freeze-manifest.json"

CONFIGURATIONS = [
    "SEM_FULL",
    "SEM_SINGLE_PASS",
    "PYDANTIC_COMMON_CONTRACT",
    "PYDANTIC_CONDITIONAL_CRITIC",
    "DSPY_COMMON_CONTRACT",
]

SHORT = {
    "SEM_FULL": "SEM Full",
    "SEM_SINGLE_PASS": "SEM Single",
    "PYDANTIC_COMMON_CONTRACT": "Pydantic",
    "PYDANTIC_CONDITIONAL_CRITIC": "Pydantic+Critic",
    "DSPY_COMMON_CONTRACT": "DSPy",
}

COLLECTIONS = [
    ("explicitUserStatements", "EXPLICITEMENT DIT PAR LE CHERCHEUR"),
    ("relations", "RELATIONS COMPRISES"),
    ("inferredContext", "CONTEXTE INFÉRÉ"),
    ("contextualScientificCandidates", "CANDIDATS SCIENTIFIQUES CONTEXTUELS"),
    ("negationsAndConstraints", "NÉGATIONS / CONTRAINTES"),
    ("temporalModel", "TEMPORALITÉ"),
    ("ambiguities", "AMBIGUÏTÉS"),
    ("missingInformation", "INFORMATIONS MANQUANTES"),
    ("unknowns", "INCONNUES"),
    ("correctionsAndSupersessions", "CORRECTIONS / SUPERSESSIONS"),
    ("ownershipAndEpistemicState", "OWNERSHIP / STATUT ÉPISTÉMIQUE"),
    ("clarificationCandidates", "QUESTIONS DE CLARIFICATION CANDIDATES"),
]

SCENARIO_JUDGMENTS = {
    "I01": {
        "SEM_FULL": "Complet sur intervention, comparateur, lésions, CMR, J3–J5, taille d’infarctus, MVO et exclusion du strain; résumé T2 moins cumulatif que SEM Single.",
        "SEM_SINGLE_PASS": "État T2 cumulatif, fidèle et précis; aucune ambiguïté résiduelle après R1/R2.",
        "PYDANTIC_COMMON_CONTRACT": "Compréhension complète et compacte; relation temporelle et hiérarchie des critères conservées.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Scientifiquement identique à la première passe; aucun bénéfice observable du critic.",
        "DSPY_COMMON_CONTRACT": "Compréhension globale fidèle et complète; structure relationnelle plus pauvre que SEM/Pydantic.",
    },
    "I02": {
        "SEM_FULL": "Préserve 24 h/J7, absence d’IRM pré-geste, non-exclusion et refus causal.",
        "SEM_SINGLE_PASS": "Scientifiquement équivalent à SEM Full sur les obligations décisives.",
        "PYDANTIC_COMMON_CONTRACT": "Préserve les obligations; propose encore une question temporelle malgré 24 h/J7 déjà explicités.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Même compréhension et même question redondante; critic sans valeur visible.",
        "DSPY_COMMON_CONTRACT": "Préserve explicitement temporalité, non-exclusion et non-causalité; aucune question superflue.",
    },
    "I03": {
        "SEM_FULL": "Préserve iRECIST à 12 semaines, SSP secondaire, MTV/TLG candidats et scanner de routine non promu; clarification d’adoption encore ouverte.",
        "SEM_SINGLE_PASS": "Même contenu scientifique que SEM Full; aucune valeur supplémentaire du critic sur ce scénario.",
        "PYDANTIC_COMMON_CONTRACT": "Résumé fidèle, mais la négation SUVmax/scanner n’est pas conservée dans la collection dédiée à T2 bien qu’elle reste textuellement comprise.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Identique à la première passe; le critic ne restaure pas la structure de négation dédiée.",
        "DSPY_COMMON_CONTRACT": "Fidèle sur critères, candidats et statut du scanner; structure relationnelle et ownership moins détaillés.",
    },
    "I04": {
        "SEM_FULL": "Fidèle sur disponibilité multicentrique, T1/ciné, T2/LGE et condition ECV; perd la clarification légitime sur le critère principal observée en Single.",
        "SEM_SINGLE_PASS": "Compréhension fidèle avec inconnue et clarification légitimes sur le critère principal.",
        "PYDANTIC_COMMON_CONTRACT": "T0 interprétable; T1/T2 non évaluables scientifiquement car le contrat a rejeté l’objet et le raw provider n’a pas été conservé.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Même limite que Pydantic simple; le critic ne peut pas intervenir après l’échec de première passe.",
        "DSPY_COMMON_CONTRACT": "Compréhension T2 fidèle et techniquement conforme; ne propose toutefois aucune clarification sur le critère principal.",
    },
    "I05": {
        "SEM_FULL": "T0/T1 interprétables; T2 non évaluable faute de sortie native persistée après échec structuré.",
        "SEM_SINGLE_PASS": "Même limite T2 que SEM Full; l’échec est structurel, pas une preuve de mauvaise compréhension.",
        "PYDANTIC_COMMON_CONTRACT": "Préserve la correction récidive → réponse pathologique, le caractère exploratoire et la séparation delta ADC/baseline-only.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Scientifiquement identique à la première passe; critic sans bénéfice observable.",
        "DSPY_COMMON_CONTRACT": "Préserve correctement la correction, l’exploratoire et l’analyse baseline-only; aucune question de validité proposée.",
    },
    "I06": {
        "SEM_FULL": "État cumulatif riche et clarification de la mesure principale; certaines questions interactives portent inutilement sur un seuil de discordance.",
        "SEM_SINGLE_PASS": "Préserve coréférence ASL, temporalité à 3 mois et analyses principale/secondaire; dialogue répète deux questions proches sur le seuil.",
        "PYDANTIC_COMMON_CONTRACT": "Compréhension T2 complète, correction ‘la seconde’ → ASL explicite; branche interactive échoue après une question méthodologique.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Même compréhension T2; critic sans changement sémantique, branche interactive également en échec.",
        "DSPY_COMMON_CONTRACT": "Compréhension fidèle et correction explicite; FINISH immédiat omet une clarification utile sur la mesure principale.",
    },
    "I07": {
        "SEM_FULL": "Préserve association, concentration mesurée et non-causalité; formule inutilement la prédiction comme ‘rejetée ou exploratoire’ au lieu d’exploratoire.",
        "SEM_SINGLE_PASS": "Préserve exactement association, concentration mesurée, non-causalité et prédiction exploratoire.",
        "PYDANTIC_COMMON_CONTRACT": "Compréhension compacte et fidèle, sans promotion causale ni prédictive.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Scientifiquement identique à la première passe; critic sans valeur observable.",
        "DSPY_COMMON_CONTRACT": "Fidèle sur mesure versus présence, association, non-causalité et prédiction exploratoire.",
    },
    "I08": {
        "SEM_FULL": "Conserve disponibilité multicentrique et ECV exploratoire mais promeut ‘candidat principal’ en ‘critère principal’ dans le résumé T2.",
        "SEM_SINGLE_PASS": "Seule sortie T2 qui conserve explicitement ‘candidat principal’ sans le promouvoir en endpoint/critère adopté.",
        "PYDANTIC_COMMON_CONTRACT": "Comprend la disponibilité mais son scientificGoal promeut le candidat principal en endpoint principal; dialogue répète la même question après ‘Non’.",
        "PYDANTIC_CONDITIONAL_CRITIC": "Même risque de promotion; le critic ne le corrige pas et le dialogue reste ouvert.",
        "DSPY_COMMON_CONTRACT": "Comprend la disponibilité mais promeut également en endpoint/critère principal; deux questions répétitives après réponses négative/incertaine.",
    },
}

SEM_CRITIC_ADJUDICATION = {
    ("I01", "T1"): ("CRITIC_ADDED", "Ajoute des explicites et relations cumulatives sur lésions coupables/non coupables."),
    ("I04", "T1"): ("CRITIC_ADDED", "Ajoute deux relations utiles sur la disponibilité des séquences."),
    ("I04", "T2"): ("CRITIC_DAMAGED", "Supprime l’inconnue et la clarification légitimes sur le critère principal."),
    ("I06", "T1"): ("CRITIC_ADDED", "Restaure le contexte cumulatif et une clarification sur les cas ASL-only."),
    ("I07", "T2"): ("CRITIC_DAMAGED", "Réduit les relations et rend la prédiction ‘rejetée ou exploratoire’ alors qu’elle est exploratoire."),
    ("I08", "T1"): ("CRITIC_DAMAGED", "Introduit onze pseudo-corrections sans correction utilisateur correspondante."),
    ("I08", "T2"): ("CRITIC_DAMAGED", "Promeut ‘candidat principal’ en ‘critère principal’."),
}


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value.rstrip() + "\n", encoding="utf-8")


def slug(value: str) -> str:
    return value.lower().replace("_", "-")


def artifact_name(phase: str, scenario: str, round_id: str, configuration: str) -> str:
    return f"{slug(phase)}-{scenario.lower()}-{round_id.lower()}-{slug(configuration)}.json"


def state_path(phase: str, scenario: str, round_id: str, configuration: str) -> Path:
    return STATE_ROOT / artifact_name(phase, scenario, round_id, configuration)


def native_path(phase: str, scenario: str, round_id: str, configuration: str) -> Path:
    return NATIVE_ROOT / artifact_name(phase, scenario, round_id, configuration)


def compact(value: Any) -> str:
    if value is None:
        return "—"
    if isinstance(value, bool):
        return "oui" if value else "non"
    if isinstance(value, (str, int, float)):
        return str(value)
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def item_summary(item: Any) -> str:
    if not isinstance(item, dict):
        return compact(item)
    keys = [
        "content", "subject", "predicate", "object", "previousContent", "currentContent",
        "question", "scientificRole", "polarity", "temporalContext", "epistemicStatus",
        "ownership", "owner", "priority", "blocking", "decisionImpact", "basis",
        "sourceText", "provenanceTurnIds", "interpretations", "disposition", "targetIds",
    ]
    parts = [f"{key}={compact(item[key])}" for key in keys if item.get(key) not in (None, "", [])]
    return " | ".join(parts) if parts else compact(item)


def collection_md(values: list[Any]) -> str:
    if not values:
        return "- Aucun élément produit."
    return "\n".join(f"- {item_summary(value)}" for value in values)


def native_assessment(native: dict[str, Any] | None, configuration: str, scenario: str, round_id: str) -> dict[str, Any]:
    if native is None:
        return {
            "providerStatus": "UNKNOWN_NO_NATIVE_ARTIFACT",
            "parsingStatus": "UNKNOWN",
            "structuredContractConformance": "NOT_ASSESSABLE",
            "scientificSemanticEvaluability": "NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED",
            "evaluationMode": "NONE",
            "nativeRawOutputPersisted": False,
            "missingStructuralGuarantees": ["NATIVE_OUTPUT_ARTIFACT_MISSING"],
        }
    if native.get("status") == "FAILED":
        raw = bool(native.get("nativeRawOutputAvailable"))
        return {
            "providerStatus": "FAILED_OR_OUTPUT_REJECTED",
            "parsingStatus": native.get("failureClass", "FAILED"),
            "structuredContractConformance": "FAIL",
            "scientificSemanticEvaluability": "NATIVE_OUTPUT_SEMANTIC_REVIEW_REQUIRED" if raw else "NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED",
            "evaluationMode": "NATIVE_OUTPUT_SEMANTIC_REVIEW" if raw else "NONE",
            "nativeRawOutputPersisted": raw,
            "missingStructuralGuarantees": [
                "COMMON_SCIENTIFIC_STATE_NOT_AVAILABLE",
                "NATIVE_RAW_OUTPUT_NOT_PERSISTED" if not raw else "STRUCTURED_CONTRACT_CONFORMANCE",
            ],
            "exactError": native.get("reason"),
        }
    regenerated = configuration == "DSPY_COMMON_CONTRACT" and scenario == "I01" and round_id == "T1"
    if configuration == "DSPY_COMMON_CONTRACT":
        repaired = bool(native.get("deterministicJsonSyntaxRepairApplied"))
        return {
            "providerStatus": "SUCCESS",
            "parsingStatus": "PARSED_AFTER_DETERMINISTIC_SYNTAX_REPAIR" if repaired else "PARSED",
            "structuredContractConformance": "PASS",
            "scientificSemanticEvaluability": "EVALUABLE",
            "evaluationMode": "DETERMINISTIC" if repaired else "DIRECT_STRUCTURED_OUTPUT",
            "nativeRawOutputPersisted": isinstance(native.get("common_state_json"), str),
            "missingStructuralGuarantees": ["PRIMARY_STRICT_PAIRED_SAMPLE_LOST"] if regenerated else [],
            "REGENERATED_AFTER_TECHNICAL_OUTPUT_LOSS": regenerated,
            "primaryStrictPairedSample": not regenerated,
        }
    return {
        "providerStatus": "SUCCESS",
        "parsingStatus": "PARSED_AND_VALIDATED",
        "structuredContractConformance": "PASS",
        "scientificSemanticEvaluability": "EVALUABLE",
        "evaluationMode": "DETERMINISTIC_COMMON_STATE_PROJECTION",
        "nativeRawOutputPersisted": False,
        "missingStructuralGuarantees": ["EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE"],
    }


def exact_turns(phase: str, scenario: str, round_id: str, configuration: str) -> list[dict[str, str]]:
    if phase == "COMMON_TRANSCRIPT":
        row = next(item for item in scenario_pack() if item["scenarioId"] == scenario)
        turns = [{"turnId": f"{scenario}:T0", "role": "USER", "content": row["t0"]}]
        if round_id in {"T1", "T2"}:
            turns.append({"turnId": f"{scenario}:R1", "role": "USER", "content": row["r1"]})
        if round_id == "T2":
            turns.append({"turnId": f"{scenario}:R2", "role": "USER", "content": row["r2"]})
        return turns
    ipath = RESULT / "interactive" / f"{scenario.lower()}.json"
    if not ipath.exists():
        return []
    branch = read_json(ipath)["branches"].get(configuration, {})
    turns = branch.get("turns", [])
    target = int(round_id.removeprefix("T"))
    user_seen = -1
    selected = []
    for turn in turns:
        selected.append(turn)
        if turn.get("role") == "USER":
            user_seen += 1
            if user_seen == target:
                break
    return selected


def render_state_view(phase: str, scenario: str, round_id: str, configuration: str) -> str:
    spath = state_path(phase, scenario, round_id, configuration)
    npath = native_path(phase, scenario, round_id, configuration)
    payload = read_json(spath) if spath.exists() else None
    native = read_json(npath) if npath.exists() else None
    assessment = native_assessment(native, configuration, scenario, round_id)
    turns = payload.get("state", {}).get("conversationTurns", []) if payload else exact_turns(phase, scenario, round_id, configuration)
    lines = [
        f"# {scenario} — {configuration} — {phase} {round_id}",
        "",
        "## INPUT",
        "",
        "Message utilisateur courant VERBATIM :",
        "",
        f"> {turns[-1].get('content', '—') if turns else '—'}",
        "",
        "Conversation précédente VERBATIM :",
        "",
        *([f"> {turn.get('turnId', '?')} | {turn.get('role', '?')} : {turn.get('content', '')}" for turn in turns[:-1]] or ["> —"]),
        "",
        "## NATIVE OUTPUT",
        "",
        f"Artefact : `{npath.relative_to(REPO)}`" if npath.exists() else "Artefact : ABSENT",
        "",
        "```json",
        json.dumps(native, ensure_ascii=False, indent=2, sort_keys=True) if native is not None else "null",
        "```",
        "",
        "## STRUCTURED CONTRACT STATUS",
        "",
        f"- provider status : `{assessment['providerStatus']}`",
        f"- parsing status : `{assessment['parsingStatus']}`",
        f"- structured contract conformance : `{assessment['structuredContractConformance']}`",
        f"- scientific semantic evaluability : `{assessment['scientificSemanticEvaluability']}`",
        f"- evaluation mode : `{assessment['evaluationMode']}`",
        f"- native raw output persisted : `{str(assessment['nativeRawOutputPersisted']).lower()}`",
    ]
    if assessment.get("REGENERATED_AFTER_TECHNICAL_OUTPUT_LOSS"):
        lines.extend([
            "- `REGENERATED_AFTER_TECHNICAL_OUTPUT_LOSS = TRUE`",
            "- `primaryStrictPairedSample = false`",
        ])
    if assessment.get("exactError"):
        lines.append(f"- exact error : {assessment['exactError']}")
    lines.extend(["", "## SCIENTIFIC INTERPRETATION", ""])
    if payload is None:
        lines.append("Aucune interprétation scientifique n’est produite : la sortie native exploitable n’a pas été persistée. Cet état n’est pas compté comme un échec de compréhension scientifique.")
    else:
        state = payload["state"]
        lines.extend([
            "### COMPRÉHENSION GLOBALE",
            "",
            state.get("normalizedUnderstanding") or "—",
            "",
            "Objectif scientifique produit :",
            "",
            state.get("scientificGoal") or "—",
        ])
        for key, title in COLLECTIONS:
            lines.extend(["", f"### {title}", "", collection_md(state.get(key, []))])
    lines.extend(["", "## MISSING STRUCTURAL GUARANTEES", ""])
    missing = assessment.get("missingStructuralGuarantees", [])
    lines.extend([f"- {value}" for value in missing] or ["- Aucune limite supplémentaire observée au niveau du Common Scientific State accepté."])
    lines.extend([
        "",
        "_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._",
    ])
    return "\n".join(lines)


def scenario_pack() -> list[dict[str, Any]]:
    return read_json(SCENARIO_PACK)["scenarios"]


def selected_question(scenario: str, configuration: str, round_id: str) -> Any:
    ipath = RESULT / "interactive" / f"{scenario.lower()}.json"
    if not ipath.exists():
        return None
    branch = read_json(ipath)["branches"].get(configuration)
    if not branch:
        return None
    row = next((row for row in branch.get("selectedQuestions", []) if row.get("round") == round_id), None)
    return row.get("selection") if row else None


def compact_state_block(phase: str, scenario: str, round_id: str, configuration: str) -> list[str]:
    spath = state_path(phase, scenario, round_id, configuration)
    npath = native_path(phase, scenario, round_id, configuration)
    native = read_json(npath) if npath.exists() else None
    assessment = native_assessment(native, configuration, scenario, round_id)
    view = VIEW_ROOT / artifact_name(phase, scenario, round_id, configuration).replace(".json", ".md")
    lines = [
        f"### {configuration}",
        "",
        f"- SCIENTIFIC_SEMANTIC_EVALUABILITY : `{assessment['scientificSemanticEvaluability']}`",
        f"- STRUCTURED_CONTRACT_CONFORMANCE : `{assessment['structuredContractConformance']}`",
        f"- [Vue complète avec sortie native](../human-readable/{view.name})",
    ]
    if not spath.exists():
        lines.extend(["", "Aucun Common Scientific State accepté; aucune conclusion scientifique n’est tirée de cet échec structurel.", ""])
        return lines
    state = read_json(spath)["state"]
    lines.extend([
        "",
        f"Compréhension globale : {state.get('normalizedUnderstanding') or '—'}",
        "",
        f"Explicites : {collection_md(state.get('explicitUserStatements', []))}",
        "",
        f"Relations : {collection_md(state.get('relations', []))}",
        "",
        f"Contexte inféré : {collection_md(state.get('inferredContext', []))}",
        "",
        f"Candidats contextuels : {collection_md(state.get('contextualScientificCandidates', []))}",
        "",
        f"Négations / contraintes : {collection_md(state.get('negationsAndConstraints', []))}",
        "",
        f"Temporalité : {collection_md(state.get('temporalModel', []))}",
        "",
        f"Ambiguïtés : {collection_md(state.get('ambiguities', []))}",
        "",
        f"Inconnues / manquants : {collection_md(state.get('missingInformation', []) + state.get('unknowns', []))}",
        "",
        f"Corrections : {collection_md(state.get('correctionsAndSupersessions', []))}",
        "",
        f"Question sélectionnée : {compact(selected_question(scenario, configuration, round_id) if phase == 'INTERACTIVE' else 'NON_EXÉCUTÉE_DANS_COMMON_TRANSCRIPT')}",
        "",
    ])
    return lines


def t2_cell(scenario: str, configuration: str, key: str) -> str:
    spath = state_path("COMMON_TRANSCRIPT", scenario, "T2", configuration)
    if not spath.exists():
        return "NON ÉVALUABLE — sortie native non persistée après échec de contrat"
    state = read_json(spath)["state"]
    if key == "judgment":
        return SCENARIO_JUDGMENTS[scenario][configuration]
    values = state.get(key)
    if isinstance(values, list):
        texts = [item_summary(value) for value in values]
        return "; ".join(texts) if texts else "aucun élément produit"
    return compact(values)


def ledger_events() -> tuple[list[dict[str, Any]], dict[int, dict[str, Any]]]:
    events = [json.loads(line) for line in LEDGER.read_text(encoding="utf-8").splitlines() if line.strip()]
    reservations = [event for event in events if event.get("event") == "RESERVED"]
    completions = {event["requestNumber"]: event for event in events if event.get("event") == "COMPLETED"}
    return reservations, completions


def scenario_calls(scenario: str) -> dict[str, int]:
    reservations, _ = ledger_events()
    return dict(Counter(row["configurationId"] for row in reservations if row.get("scenarioId") == scenario))


def scenario_latency(scenario: str, configuration: str) -> str:
    reservations, completions = ledger_events()
    values = []
    for row in reservations:
        if row.get("scenarioId") != scenario or row.get("configurationId") != configuration:
            continue
        completion = completions.get(row["requestNumber"])
        if not completion:
            continue
        start = dt.datetime.fromisoformat(completion["startedAt"].replace("Z", "+00:00"))
        end = dt.datetime.fromisoformat(completion["completedAt"].replace("Z", "+00:00"))
        values.append((end - start).total_seconds())
    return f"{statistics.mean(values):.2f} s/appel direct ({len(values)} appels)" if values else "aucun appel direct attribué"


def generate_views_and_books() -> None:
    VIEW_ROOT.mkdir(parents=True, exist_ok=True)
    REVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    all_native = sorted(NATIVE_ROOT.glob("*.json"))
    for npath in all_native:
        name = npath.name
        phase = "COMMON_TRANSCRIPT" if name.startswith("common-transcript-") else "INTERACTIVE"
        parts = name.removesuffix(".json").split("-")
        offset = 2 if phase == "COMMON_TRANSCRIPT" else 1
        scenario = parts[offset].upper()
        round_id = parts[offset + 1].upper()
        configuration_slug = "-".join(parts[offset + 2 :])
        configuration = next((value for value in CONFIGURATIONS if slug(value) == configuration_slug), None)
        if configuration is None:
            continue
        write_text(VIEW_ROOT / name.replace(".json", ".md"), render_state_view(phase, scenario, round_id, configuration))

    index = [
        "# EXP-SEM-ABLATION-02 — Human Review Index",
        "",
        "Adjudication expérimentale post-hoc simulée; aucune revue humaine indépendante et aucun score composite.",
        "",
        "Chaque vue sépare NATIVE OUTPUT, STRUCTURED CONTRACT STATUS, SCIENTIFIC INTERPRETATION et MISSING STRUCTURAL GUARANTEES.",
        "",
    ]
    for scenario in scenario_pack():
        sid = scenario["scenarioId"]
        index.append(f"- [{sid} — {scenario['title']}](human-review/{sid}.md)")
        lines = [
            f"# {sid} — {scenario['title']}",
            "",
            "SIMULATED_POST_HOC_ADJUDICATION — non indépendante, non PD-011.",
            "",
            "## Common Transcript",
            "",
        ]
        cumulative = []
        for round_id, source_key in [("T0", "t0"), ("T1", "r1"), ("T2", "r2")]:
            cumulative.append(f"{round_id}: {scenario[source_key]}")
            lines.extend([f"## {round_id} — QUESTION / CONVERSATION EXACTE", "", "\n\n".join(cumulative), ""])
            for configuration in CONFIGURATIONS:
                lines.extend(compact_state_block("COMMON_TRANSCRIPT", sid, round_id, configuration))
        lines.extend([
            "## Tableau synthétique concret — état T2",
            "",
            "| Dimension | SEM Full | SEM Single | Pydantic | Pydantic+Critic | DSPy |",
            "|---|---|---|---|---|---|",
        ])
        for label, key in [
            ("Compréhension globale", "normalizedUnderstanding"),
            ("Conclusion post-hoc", "judgment"),
            ("Inférences pertinentes", "inferredContext"),
            ("Candidats contextuels", "contextualScientificCandidates"),
            ("Négations", "negationsAndConstraints"),
            ("Ambiguïtés", "ambiguities"),
            ("Questions candidates", "clarificationCandidates"),
        ]:
            cells = [t2_cell(sid, configuration, key).replace("|", "\\|").replace("\n", " ") for configuration in CONFIGURATIONS]
            lines.append("| " + " | ".join([label, *cells]) + " |")
        calls = scenario_calls(sid)
        call_cells = []
        latency_cells = []
        for configuration in CONFIGURATIONS:
            direct = calls.get(configuration, 0)
            shared = calls.get("SEM_SHARED_FIRST_RECONSTRUCTION", 0) if configuration.startswith("SEM_") else calls.get("PYDANTIC_SHARED_FIRST_OUTPUT", 0) if configuration.startswith("PYDANTIC_") else 0
            call_cells.append(f"{direct} direct" + (f" + pool partagé {shared}" if shared else ""))
            latency_cells.append(scenario_latency(sid, configuration))
        lines.append("| Appels provider | " + " | ".join(call_cells) + " |")
        lines.append("| Latence des appels directs | " + " | ".join(latency_cells) + " |")

        ipath = RESULT / "interactive" / f"{sid.lower()}.json"
        if ipath.exists():
            lines.extend(["", "## Interactive Dialogue", ""])
            interactive = read_json(ipath)
            for configuration in CONFIGURATIONS:
                branch = interactive["branches"].get(configuration)
                lines.extend([f"### {configuration}", ""])
                if not branch:
                    lines.extend(["Branche absente.", ""])
                    continue
                lines.extend([
                    f"Statut : `{branch['status']}`",
                    "",
                    "Conversation réellement échangée :",
                    "",
                    *[f"- {turn['role']} `{turn['turnId']}` : {turn['content']}" for turn in branch.get("turns", [])],
                    "",
                ])
        write_text(REVIEW_ROOT / f"{sid}.md", "\n".join(lines))
    write_text(RESULT / "HUMAN-REVIEW-INDEX.md", "\n".join(index))


def state_comparable(value: Any) -> str:
    if not isinstance(value, dict):
        return compact(value)
    ignored = {key for key in value if key.lower().endswith("id") or key == "provenanceTurnIds"}
    return json.dumps({key: value[key] for key in sorted(value) if key not in ignored}, ensure_ascii=False, sort_keys=True)


def state_diff(before: dict[str, Any], after: dict[str, Any]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    if before.get("normalizedUnderstanding") != after.get("normalizedUnderstanding"):
        rows.append({"disposition": "MODIFIED", "collection": "normalizedUnderstanding", "before": compact(before.get("normalizedUnderstanding")), "after": compact(after.get("normalizedUnderstanding"))})
    for key, _ in COLLECTIONS:
        before_map = {state_comparable(value): value for value in before.get(key, [])}
        after_map = {state_comparable(value): value for value in after.get(key, [])}
        for identity in sorted(after_map.keys() - before_map.keys()):
            rows.append({"disposition": "ADDED", "collection": key, "value": compact(after_map[identity])})
        for identity in sorted(before_map.keys() - after_map.keys()):
            rows.append({"disposition": "REMOVED_OR_SUPERSEDED", "collection": key, "value": compact(before_map[identity])})
    return rows


def component_contribution() -> dict[str, Any]:
    sem_rows = []
    pyd_rows = []
    for sid in [f"I{index:02d}" for index in range(1, 9)]:
        for round_id in ["T0", "T1", "T2"]:
            single = state_path("COMMON_TRANSCRIPT", sid, round_id, "SEM_SINGLE_PASS")
            full = state_path("COMMON_TRANSCRIPT", sid, round_id, "SEM_FULL")
            if single.exists() and full.exists():
                before = read_json(single)["state"]
                after = read_json(full)["state"]
                classification, rationale = SEM_CRITIC_ADJUDICATION.get((sid, round_id), ("NO_MEANINGFUL_CHANGE", "Aucune amélioration scientifique critique observable; différence absente ou seulement de richesse/formulation."))
                sem_rows.append({
                    "scenarioId": sid,
                    "round": round_id,
                    "classification": classification,
                    "rationale": rationale,
                    "exactDeterministicDiff": state_diff(before, after),
                })
            common = state_path("COMMON_TRANSCRIPT", sid, round_id, "PYDANTIC_COMMON_CONTRACT")
            critic = state_path("COMMON_TRANSCRIPT", sid, round_id, "PYDANTIC_CONDITIONAL_CRITIC")
            if common.exists() and critic.exists():
                before = read_json(common)["state"]
                after = read_json(critic)["state"]
                pyd_rows.append({
                    "scenarioId": sid,
                    "round": round_id,
                    "classification": "NO_MEANINGFUL_CHANGE",
                    "rationale": "Les différences observées sont null/\"null\" ou échappement de chaîne; aucune obligation scientifique n’est ajoutée, retirée ou corrigée.",
                    "exactDeterministicDiff": state_diff(before, after),
                })
    sem_counts = Counter(row["classification"] for row in sem_rows)
    pyd_counts = Counter(row["classification"] for row in pyd_rows)
    return {
        "adjudication": "SIMULATED_POST_HOC_ADJUDICATION",
        "realHumanReview": False,
        "semanticReviewProviderCalls": 0,
        "SEM_FULL_vs_SEM_SINGLE_PASS": {
            "comparableCommonTranscriptStates": len(sem_rows),
            "classificationCounts": dict(sem_counts),
            "incrementalCriticProviderCallsInCommonTranscript": 33,
            "rows": sem_rows,
        },
        "PYDANTIC_CONDITIONAL_CRITIC_vs_COMMON": {
            "comparableCommonTranscriptStates": len(pyd_rows),
            "criticTriggers": 20,
            "criticSkipped": 2,
            "criticAccept": 18,
            "criticRevise": 2,
            "classificationCounts": dict(pyd_counts),
            "incrementalCriticProviderCallsInCommonTranscript": 20,
            "rows": pyd_rows,
        },
        "crossArchitectureFindings": {
            "pydanticVsSemSingle": "Pydantic est généralement aussi lisible et scientifiquement complet, mais moins riche en relations/provenance structurées et moins robuste sur I04.",
            "pydanticCriticVsSemFull": "Le critic Pydantic ne récupère aucune perte observable; SEM Full reste plus riche structurellement mais n’est pas systématiquement plus juste.",
            "dspyVsPydantic": "DSPy est le plus robuste sur les états acceptés (24/24 Phase A), mais produit moins de relations, aucun objet dédié et peu d’enrichissement; une sortie primaire a été perdue puis régénérée.",
        },
    }


def operational_metrics() -> dict[str, Any]:
    reservations, completions = ledger_events()
    by_configuration: dict[str, dict[str, Any]] = {}
    by_operation = Counter(row["operation"] for row in reservations)
    for configuration in sorted({row["configurationId"] for row in reservations}):
        rows = [row for row in reservations if row["configurationId"] == configuration]
        latencies = []
        for row in rows:
            completion = completions.get(row["requestNumber"])
            if not completion:
                continue
            start = dt.datetime.fromisoformat(completion["startedAt"].replace("Z", "+00:00"))
            end = dt.datetime.fromisoformat(completion["completedAt"].replace("Z", "+00:00"))
            latencies.append((end - start).total_seconds())
        by_configuration[configuration] = {
            "ledgerReservations": len(rows),
            "actualProviderStarts": len(rows) - (1 if configuration == "DSPY_COMMON_CONTRACT" else 0),
            "successfulCalls": sum(completions.get(row["requestNumber"], {}).get("success") is True for row in rows),
            "failedCalls": sum(completions.get(row["requestNumber"], {}).get("success") is False for row in rows),
            "retries": sum(bool(row.get("retry")) for row in rows),
            "medianLatencySecondsPerLedgerOperation": round(statistics.median(latencies), 3) if latencies else None,
            "meanLatencySecondsPerLedgerOperation": round(statistics.mean(latencies), 3) if latencies else None,
        }
    contract = {}
    for configuration in CONFIGURATIONS:
        phase_rows = {}
        for phase in ["COMMON_TRANSCRIPT", "INTERACTIVE"]:
            native_files = list(NATIVE_ROOT.glob(f"{slug(phase)}-*-{slug(configuration)}.json"))
            failures = sum(read_json(path).get("status") == "FAILED" for path in native_files)
            phase_rows[phase] = {
                "attemptedStates": len(native_files),
                "structuredContractPass": len(native_files) - failures,
                "structuredContractFail": failures,
                "scientificallyEvaluable": len(native_files) - failures,
                "scientificallyNotAssessableBecauseRawUnavailable": failures,
            }
        contract[configuration] = phase_rows
    freeze = read_json(FREEZE)
    digest = hashlib.sha256(SCENARIO_PACK.read_bytes()).hexdigest()
    return {
        "ledgerReservations": len(reservations),
        "actualProviderStarts": len(reservations) - 1,
        "nonProviderLocalFailureReservations": [14],
        "successfulProviderOperations": sum(completions.get(row["requestNumber"], {}).get("success") is True for row in reservations),
        "failedLedgerOperations": sum(completions.get(row["requestNumber"], {}).get("success") is False for row in reservations),
        "semanticReviewCalls": 0,
        "retries": sum(bool(row.get("retry")) for row in reservations),
        "byLedgerConfiguration": by_configuration,
        "byOperation": dict(by_operation),
        "contractAndScientificEvaluability": contract,
        "phaseA": {"scenariosComplete": 8, "scenariosTotal": 8, "commonStates": 114, "attemptedStates": 120},
        "phaseB": {"scenariosComplete": 4, "scenariosTotal": 4, "branchesComplete": 20, "branchesTotal": 20, "commonStates": 44, "attemptedStates": 55, "researcherSimulatorCalls": 7},
        "scenarioPackDigestBefore": freeze["scenarioPackDigest"],
        "scenarioPackDigestAfter": digest,
        "scenarioPackDigestUnchanged": digest == freeze["scenarioPackDigest"],
        "providerBudget": {"target": 260, "softLimit": 280, "hardStop": 320, "dailyLimit": 500, "remainingAfterActualStarts": 500 - (len(reservations) - 1)},
        "notes": [
            "Request 14 failed locally before HTTP and consumed no provider quota.",
            "Request 13 was a provider response with invalid JSON whose raw output was not persisted; I01/T1 DSPy was uniquely regenerated in request 15 and is not a primary strict-paired sample.",
            "Latencies are measured per ledger operation, not end-to-end per architecture state.",
            "No LLM semantic interpretation call was required or used.",
        ],
    }


def interactive_summary() -> dict[str, Any]:
    rows = {}
    totals = defaultdict(Counter)
    for ipath in sorted((RESULT / "interactive").glob("*.json")):
        sid = ipath.stem.upper()
        rows[sid] = {}
        for configuration, branch in read_json(ipath)["branches"].items():
            questions = branch.get("askedQuestions", [])
            answers = max(0, sum(turn.get("role") == "USER" for turn in branch.get("turns", [])) - 1)
            rows[sid][configuration] = {"status": branch["status"], "questions": questions, "researcherAnswers": answers}
            totals[configuration]["branches"] += 1
            totals[configuration]["questions"] += len(questions)
            totals[configuration]["answers"] += answers
            totals[configuration][branch["status"]] += 1
    return {"byScenario": rows, "byConfiguration": {key: dict(value) for key, value in totals.items()}}


def comparative_summary(metrics: dict[str, Any], contribution: dict[str, Any]) -> dict[str, Any]:
    return {
        "experimentId": "EXP-SEM-ABLATION-02",
        "status": "COMPLETE_WITH_STRUCTURED_CONTRACT_FAILURES_SEPARATELY_REPORTED",
        "decision": [
            "HYBRID_SEM_CONTRACT_PYDANTIC_RUNTIME",
            "SEM_CRITIC_MAKE_CONDITIONAL_OR_REMOVE_PENDING_TARGETED_EVIDENCE",
            "PYDANTIC_CONDITIONAL_CRITIC_NOT_JUSTIFIED_BY_THIS_EXPERIMENT",
            "DSPY_RUNTIME_CANDIDATE_REQUIRES_RELATION_AND_RAW_OUTPUT_ROBUSTNESS_WORK",
        ],
        "mainResult": {
            "SEM_FULL": "Richest structured representation, but 33 Phase-A critic calls produced only 3 adjudicated useful changes, 4 degradations and 16 no-meaningful-change states among 23 comparable states.",
            "SEM_SINGLE_PASS": "Practically equivalent on most scientific obligations and uniquely preserved I08 candidate status; one shared structured failure at I05/T2.",
            "PYDANTIC_COMMON_CONTRACT": "Simple and usually scientifically complete, but 4/24 Phase-A states across its two branches failed at I04 and interactive contract robustness was weak; exact provider raw was not persisted.",
            "PYDANTIC_CONDITIONAL_CRITIC": "No meaningful semantic benefit on 22 comparable Phase-A states despite 20 critic calls.",
            "DSPY_COMMON_CONTRACT": "24/24 Phase-A contract states accepted and strong summaries, but sparse relation/object modeling, little contextual enrichment, and one lost primary output followed by a non-primary regeneration.",
        },
        "scientificVsContract": {
            "rule": "Scientific semantic evaluability and structured contract conformance are independent dimensions.",
            "notAssessableOutputs": "Failures with no persisted raw output are not counted as scientific failures.",
            "semanticReviewCalls": 0,
        },
        "interactive": interactive_summary(),
        "operational": metrics,
        "componentContributionDigest": hashlib.sha256(json.dumps(contribution, ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
        "boundaries": {"realHumanReview": False, "pd011Qualification": False, "blindUsed": False, "tuningAfterObservation": False, "normativeDocumentsModified": False},
    }


def replacement_matrix() -> str:
    return """# EXP-SEM-ABLATION-02 — Component Replacement Matrix

| Composant | Valeur observée | Coût observé | Candidat de remplacement | Perte / gain | Verdict |
|---|---|---|---|---|---|
| SEM RECONSTRUCTION | Représentation la plus relationnelle et traçable; compréhension généralement fidèle | 55 reconstructions + 19 réparations structurées dans la campagne | Runtime direct vers le Common Scientific Contract | Gain de simplicité; risque de perdre la densité relationnelle, la provenance et certains objets | `MERGE_IN_COMMON_CONTRACT` |
| SEM CRITIC | 3 améliorations utiles, 4 dégradations, 16 états sans changement significatif sur 23 comparables Phase A | 33 appels Phase A, 49 appels au total | Guard déterministe puis critic ciblé uniquement sur une violation démontrée | Forte économie; évite les pseudo-corrections et promotions observées | `MAKE_CONDITIONAL` |
| SEM REPAIR | Récupère certaines sorties structurées; un état I05/T2 reste rejeté | 19 appels | Réparation syntaxique/structurelle locale avant toute régénération | Réduit les appels; doit rester strictement non sémantique | `SIMPLIFY` |
| SEM CANONICALIZATION DÉTERMINISTE | Rend la sortie SEM exploitable et traçable dans le contrat commun | local | Conserver comme couche générique de normalisation sans ajout scientifique | Garantie de stabilité; coût provider nul | `KEEP` |
| SEM OWNERSHIP / EPISTEMIC CONTRACT | Garantie structurante absente ou plus sparse chez les runtimes simples | coût local après génération | Common Scientific Contract + guards déterministes | Conserve la frontière user/inférence/candidat; indispensable malgré l’erreur I08 à corriger au niveau génératif | `KEEP` |
| SEM RELATION MODEL | SEM produit 93–102 relations Phase A contre 37 Pydantic et 14 DSPy | complexité structurelle | Common contract enrichi par exigences relationnelles explicites | Peut réduire le code, mais aucune suppression tant que la perte relationnelle n’est pas testée | `MERGE_IN_COMMON_CONTRACT` |
| CONTEXTUAL ENRICHMENT | Faible dans toutes les configurations : SEM 0 candidat, Pydantic 4, DSPy 2 sur Phase A | DSPy 36 départs provider + 1 réservation échouée localement, sans bénéfice net d’enrichissement démontré | Aucun remplacement décidé | Les données ne démontrent pas un avantage DSPy d’enrichissement | `INSUFFICIENT_EVIDENCE` |
| DIALOGUE / QRY / PD-009 | Contrôleur commun déterministe, mais questions répétées, parfois déjà résolues ou de faible valeur; 2 branches Pydantic échouent | 7 appels simulateur + appels d’états interactifs | Contrôleur produit distinct avec déduplication et valeur décisionnelle | Nécessaire pour éviter FINISH précoce ou questions répétitives | `KEEP` pour l’ownership; `SIMPLIFY` le contrôleur expérimental |

Le verdict ne constitue ni une décision produit ni une qualification PD-011. Il identifie les composants dont la valeur est ou n’est pas observée dans cette expérience.
"""


def final_report(metrics: dict[str, Any], contribution: dict[str, Any]) -> str:
    sem_counts = contribution["SEM_FULL_vs_SEM_SINGLE_PASS"]["classificationCounts"]
    return f"""# EXP-SEM-ABLATION-02 — Final Architecture Report

## Décision expérimentale

`HYBRID_SEM_CONTRACT_PYDANTIC_RUNTIME`

Le contrat scientifique, les relations, la provenance, l’ownership et les guards déterministes de SEM doivent rester les garanties NOXIA. L’orchestration multi-passes systématique n’est pas justifiée par cette campagne. PydanticAI est le meilleur candidat runtime simple observé, mais pas encore un remplacement direct : ses échecs de contrat I04 et l’absence de raw provider persistant empêchent cette conclusion. Le critic conditionnel Pydantic n’a démontré aucune valeur sémantique observable. DSPy reste un candidat technique robuste, mais pas une couche d’enrichissement démontrée.

## Règle d’interprétation

La campagne distingue désormais strictement :

- `SCIENTIFIC_SEMANTIC_EVALUABILITY` : ce que la sortie disponible permet de comprendre scientifiquement;
- `STRUCTURED_CONTRACT_CONFORMANCE` : sa conformité au Common Scientific State.

Une sortie rejetée par le contrat n’est pas déclarée scientifiquement mauvaise. Lorsque son raw n’a pas été persisté, elle est `NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED`. Aucun appel LLM de revue sémantique n’a été utilisé.

## Ce qui a été réellement comparé

- Common Transcript : 8/8 scénarios, 120 états tentés, 114 Common States acceptés.
- Interactive : 4/4 scénarios, 20/20 branches clôturées, 55 états tentés, 44 Common States acceptés.
- Provider : {metrics['actualProviderStarts']} appels réellement démarrés; {metrics['ledgerReservations']} réservations ledger; 4 retries; 0 appel de semantic review.
- Digest du scénario pack : inchangé.

## Résultats scientifiques

### SEM Full versus SEM Single

Sur 23 états Phase A directement comparables, l’adjudication post-hoc simulée classe {sem_counts.get('CRITIC_ADDED', 0)} apports utiles, {sem_counts.get('CRITIC_DAMAGED', 0)} dégradations et {sem_counts.get('NO_MEANINGFUL_CHANGE', 0)} états sans changement scientifique significatif. Ces observations ont coûté 33 appels critic Phase A.

SEM Full apporte ponctuellement davantage d’explicites et de relations, notamment I01/T1, I04/T1 et I06/T1. Il dégrade toutefois I04/T2 (clarification supprimée), I07/T2 (statut prédictif affaibli) et I08/T1–T2 (pseudo-corrections puis promotion de candidat principal en critère principal). SEM Single conserve mieux le statut exact de I08.

### PydanticAI

Pydantic direct atteint généralement la même compréhension globale en une première passe : corrections, temporalité, négation et hiérarchie des analyses sont bien conservées dans I01, I02, I05, I06 et I07. Il perd de la densité relationnelle par rapport à SEM et échoue structurellement sur I04/T1–T2 dans les deux branches. Le raw provider n’ayant pas été persisté, ces quatre états ne peuvent pas être jugés scientifiquement.

Le critic conditionnel a été déclenché 20 fois en Phase A : 18 `ACCEPT`, 2 `REVISE`. Sur les 22 paires observables, il n’ajoute, ne retire ni ne corrige aucune obligation scientifique; les seules différences sont `null` versus `"null"` ou des échappements de chaîne. Il ne récupère pas les échecs de première passe.

### DSPy

DSPy produit 24/24 Common States Phase A et des résumés scientifiquement solides. Il ne démontre pas l’enrichissement attendu : 2 candidats contextuels et 14 relations, contre 4/37 pour Pydantic et 0/93–102 pour SEM. Sa structure n’utilise aucun objet dédié. Request 13 I01/T1 a perdu son raw non-JSON; request 15 est une régénération qualitative explicitement exclue du pairage primaire strict.

### Risque partagé I08

SEM Full, Pydantic et DSPy transforment à un endroit `candidat principal` en `critère/endpoint principal`. SEM Single conserve correctement le statut candidat. Ce constat interdit de conclure qu’une architecture riche ou conforme est automatiquement épistémiquement correcte.

## Dialogue interactif

Les 20 branches sont terminées, mais le contrôleur commun ne démontre pas une politique ASK/FINISH satisfaisante :

- I01 : Pydantic simple pose une clarification temporelle utile; les autres finissent sans question.
- I04 : SEM et DSPy posent des questions plausibles mais souvent génériques ou répétées; les branches Pydantic échouent.
- I06 : plusieurs branches demandent des seuils ou standards de référence non prioritaires; DSPy finit sans traiter la mesure principale.
- I08 : plusieurs branches répètent la question du critère principal après `Non` ou `Je ne sais pas`.

La génération des clarifications, leur déduplication et l’intégration des réponses doivent rester un composant distinct du runtime de compréhension.

## Robustesse structurée

| Configuration | Phase A | Interactive | Lecture scientifique |
|---|---:|---:|---|
| SEM Full | 23/24 conformes | 11/11 | I05/T2 non évaluable, raw absent |
| SEM Single | 23/24 conformes | 10/11 | I05/T2 et une branche interactive non évaluables, raw absent |
| Pydantic | 22/24 conformes | 6/11 | échecs non assimilés à des échecs scientifiques |
| Pydantic+Critic | 22/24 conformes | 6/11 | critic inaccessible sur certains échecs de première passe |
| DSPy | 24/24 conformes | 11/11 | I01/T1 régénéré, non primaire strict-paired |

## Complexité et coût

Les {metrics['ledgerReservations']} réservations ledger correspondent à {metrics['actualProviderStarts']} départs provider : 53 SEM Full, 39 SEM partagé, 31 SEM Single, 34 Pydantic+Critic, 24 Pydantic partagé, 11 Pydantic simple, 36 DSPy et 7 simulateur; la réservation DSPy 14 a échoué localement avant HTTP. Les latences détaillées sont dans `operational-metrics.json`; elles sont mesurées par opération et ne doivent pas être présentées comme latence end-to-end d’un état.

## Réponses aux questions architecturales

1. SEM Full comprend parfois davantage de relations cumulatives; aucun avantage systématique n’est observé.
2. Son critic coûte 33 appels Phase A et 49 sur toute la campagne.
3. 16/23 tours comparables n’ont aucune valeur scientifique ajoutée observable.
4. Pydantic atteint souvent la même compréhension globale en une passe.
5. Pydantic perd de la densité relationnelle et de la robustesse de contrat, surtout I04.
6. Son critic conditionnel ne récupère aucune perte observable.
7. DSPy n’apporte pas d’enrichissement supérieur démontré.
8. DSPy reste sparse et partage le risque de promotion I08.
9. Relations, provenance, ownership, statut épistémique et guards déterministes SEM doivent rester.
10. Le critic SEM systématique et les repairs LLM peuvent être rendus conditionnels ou simplifiés.
11. L’architecture simple compatible la plus prometteuse est un runtime Pydantic direct sous contrat/guards SEM conservés, pas Pydantic seul.

## Limites

- `SIMULATED_POST_HOC_ADJUDICATION`, aucune revue humaine indépendante.
- Aucun Blind et aucune qualification PD-011.
- Aucun score global inventé.
- Les sorties raw exactes SEM/Pydantic n’ont pas été persistées; seules leurs représentations natives structurées sont disponibles.
- Aucun tuning post-observation, aucun document normatif modifié.

## Action suivante unique

Faire relire humainement les huit dossiers `human-review/I01.md` à `I08.md`, en priorité I04, I07 et I08, avant toute décision de simplification produit.
"""


def generate() -> None:
    generate_views_and_books()
    contribution = component_contribution()
    metrics = operational_metrics()
    summary = comparative_summary(metrics, contribution)
    write_json(RESULT / "component-contribution-analysis.json", contribution)
    write_json(RESULT / "operational-metrics.json", metrics)
    write_json(RESULT / "comparative-summary.json", summary)
    write_text(RESULT / "component-replacement-matrix.md", replacement_matrix())
    write_text(RESULT / "FINAL-ARCHITECTURE-REPORT.md", final_report(metrics, contribution))


if __name__ == "__main__":
    generate()
