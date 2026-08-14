from __future__ import annotations

import datetime as dt
import hashlib
import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
COMPARISON_ROOT = PACKAGE_ROOT.parent
REPOSITORY_ROOT = COMPARISON_ROOT.parents[1]
RESULT_ROOT = COMPARISON_ROOT / "results" / "interactive-overnight"
TRANSCRIPT_ROOT = RESULT_ROOT / "interactive-transcripts"

BASELINES = ["sem-current", "instructor", "pydanticai", "dspy", "langextract", "outlines"]
LABELS = {
    "sem-current": "NOXIA / SEM current",
    "instructor": "Instructor + Pydantic",
    "pydanticai": "PydanticAI",
    "dspy": "DSPy",
    "langextract": "LangExtract",
    "outlines": "Outlines",
}

CAPABILITIES = {
    "C01": "Explicit fidelity",
    "C02": "Multi-turn context",
    "C03": "Correction / change of mind",
    "C04": "Negation",
    "C05": "Non-causality",
    "C06": "Necessary implicit understanding without promotion",
    "C07": "Ellipsis / coreference",
    "C08": "Ambiguity management",
    "C09": "Missing information",
    "C10": "Clarification value",
    "C11": "Temporal reasoning",
    "C12": "Relation semantics",
    "C13": "Phenomenon / observable / method / measurement separation",
    "C14": "Ownership",
    "C15": "Epistemic status",
    "C16": "Contextual enrichment",
    "C17": "Structural robustness",
    "C18": "Global scientific state reconstruction",
    "C19": "Question economy",
    "C20": "Integration of researcher answer",
    "C21": "Premature FINISH / failure to FINISH",
    "C22": "STOP correctness",
    "C23": "Technical robustness / provider cost / latency",
}


def cell(status: str, evidence: str, scenarios: list[str]) -> dict[str, Any]:
    return {"status": status, "evidence": evidence, "scenarioRefs": scenarios}


MATRIX: dict[str, dict[str, dict[str, Any]]] = {
    "C01": {
        baseline: cell("PASS", "Les faits visibles restent reconstructibles dans les états observés.", ["I01", "I02", "I03", "I04", "I05"])
        for baseline in BASELINES
    },
    "C02": {
        "sem-current": cell("PASS", "I02 et I05 sont maintenus sur deux états et leurs réponses sont consolidées.", ["I02", "I05"]),
        "instructor": cell("PARTIAL", "Une seule branche multi-tour observable, correctement consolidée.", ["I04"]),
        "pydanticai": cell("PASS", "Les trois réponses reçues sont intégrées dans un état consolidé.", ["I01", "I02", "I04"]),
        "dspy": cell("PASS", "Les réponses I02 et I04 sont intégrées sans perdre l'état initial.", ["I02", "I04"]),
        "langextract": cell("FAIL", "L'inconnu temporel reste actif après deux réponses qui le résolvent.", ["I02"]),
        "outlines": cell("PARTIAL", "Quatre branches multi-tour réussissent; I03 reste sans réponse checkpointée.", ["I01", "I02", "I04", "I05", "I03"]),
    },
    "C03": {
        "sem-current": cell("PARTIAL", "La correction I02 est présente dans le sens final mais non exposée comme supersession par l'adapter.", ["I02"]),
        "instructor": cell("PASS", "La mise à jour I04 est intégrée sans conserver une décision contraire.", ["I04"]),
        "pydanticai": cell("PASS", "Les corrections I01, I02 et I04 deviennent le nouvel état courant.", ["I01", "I02", "I04"]),
        "dspy": cell("PASS", "Les corrections I02 et I04 sont explicites et cohérentes.", ["I02", "I04"]),
        "langextract": cell("PARTIAL", "Le contenu corrigé est copié, mais la supersession n'est pas structurée et un ancien inconnu persiste.", ["I02"]),
        "outlines": cell("PASS", "Les corrections reçues sont consolidées avec leur polarité.", ["I01", "I02", "I04"]),
    },
    "C04": {
        "sem-current": cell("PASS", "L'absence d'IRM pré-geste et la non-causalité restent reconstructibles.", ["I02"]),
        "instructor": cell("PASS", "La réponse négative sur T2 et la non-primauté du LGE sont préservées.", ["I04"]),
        "pydanticai": cell("PASS", "Les négations I01, I02 et I04 sont explicites.", ["I01", "I02", "I04"]),
        "dspy": cell("PASS", "Les négations I02 et I04 sont explicites.", ["I02", "I04"]),
        "langextract": cell("PARTIAL", "La négation apparaît dans le résumé I02, mais pas dans le champ de polarité prévu.", ["I02"]),
        "outlines": cell("PASS", "Les négations reçues sont conservées sans STOP.", ["I01", "I02", "I04"]),
    },
    "C05": {
        "sem-current": cell("PASS", "La relation I02 reste associative et la causalité est explicitement niée.", ["I02"]),
        "instructor": cell("PASS", "Aucune causalité n'est ajoutée à la formulation relationnelle observée.", ["I02"]),
        "pydanticai": cell("PASS", "Association et absence de causalité sont explicitement séparées.", ["I02"]),
        "dspy": cell("PASS", "Association et absence de causalité sont explicitement séparées.", ["I02"]),
        "langextract": cell("PARTIAL", "Le sens non causal est dans le résumé, sans représentation dédiée.", ["I02"]),
        "outlines": cell("PASS", "Association et absence de causalité sont explicitement séparées.", ["I02"]),
    },
    "C06": {baseline: cell("NOT_TESTED", "Les variantes exécutées ne permettent pas un test discriminant de l'implicite nécessaire.", [],) for baseline in BASELINES},
    "C07": {baseline: cell("NOT_TESTED", "La variante I05 exécutée a supprimé les ellipses et coréférences prévues.", ["I05"]) for baseline in BASELINES},
    "C08": {
        "sem-current": cell("PARTIAL", "Une ambiguïté temporelle est questionnée en I02, mais plusieurs ambiguïtés structurantes conduisent à FINISH.", ["I01", "I02", "I03", "I04"]),
        "instructor": cell("PARTIAL", "Les inconnues sont souvent nommées, mais généralement sans clarification.", ["I01", "I02", "I03", "I05"]),
        "pydanticai": cell("PARTIAL", "Trois ambiguïtés sont questionnées; I03 et I05 sont terminés sans clarification.", ["I01", "I02", "I03", "I04", "I05"]),
        "dspy": cell("PARTIAL", "I02 est clarifié; I01, I03 et I05 se terminent tôt.", ["I01", "I02", "I03", "I05"]),
        "langextract": cell("FAIL", "Les ambiguïtés sont soit ignorées, soit répétées après résolution.", ["I02", "I03", "I05"]),
        "outlines": cell("PARTIAL", "Plusieurs ambiguïtés déclenchent ASK, mais I03 cible un détail secondaire.", ["I01", "I02", "I03", "I04", "I05"]),
    },
    "C09": {
        "sem-current": cell("PARTIAL", "Quelques informations manquantes déclenchent ASK, avec une priorité inégale.", ["I02", "I05"]),
        "instructor": cell("PASS", "Les inconnues importantes sont régulièrement explicitées dans l'état.", ["I01", "I02", "I03", "I05"]),
        "pydanticai": cell("PASS", "Les inconnues sont conservées sans complétion silencieuse.", ["I02", "I03", "I05"]),
        "dspy": cell("PARTIAL", "Les inconnues sont peu exposées lorsque le système termine tôt.", ["I01", "I03", "I05"]),
        "langextract": cell("FAIL", "La détection est instable et l'inconnu I02 n'est pas clôturé après réponse.", ["I02"]),
        "outlines": cell("PASS", "Les informations absentes sont explicites dans les états observés.", ["I02", "I03", "I04", "I05"]),
    },
    "C10": {
        "sem-current": cell("PARTIAL", "La question I02 est discriminante; la question I05 sur les critères d'inclusion ne cible pas la décision centrale.", ["I02", "I05"]),
        "instructor": cell("PARTIAL", "La question I04 est utile mais large; les autres scénarios finissent sans arbitrage.", ["I04"]),
        "pydanticai": cell("PARTIAL", "Les questions sont utiles, mais deux sont guidées par des listes d'exemples ou combinent modalités et timing.", ["I01", "I02", "I04"]),
        "dspy": cell("PARTIAL", "I02 est de forte valeur; I04 demande une anatomie déjà contextualisée par Fabry plutôt que la disponibilité des mesures.", ["I02", "I04"]),
        "langextract": cell("FAIL", "Les questions I02 sont grammaticalement faibles puis répétées après réponse.", ["I02"]),
        "outlines": cell("PARTIAL", "I01 et I04 sont utiles; I03 cible le type tumoral et I05 combine deux questions.", ["I01", "I02", "I03", "I04", "I05"]),
    },
    "C11": {
        "sem-current": cell("PASS", "Les temps 24 h et J7 sont conservés comme éléments temporels.", ["I02"]),
        "instructor": cell("PASS", "Le caractère post-thrombectomie et l'incertitude temporelle sont conservés.", ["I02"]),
        "pydanticai": cell("PASS", "Les temps reçus et les contextes pendant traitement sont préservés.", ["I02", "I05"]),
        "dspy": cell("PASS", "24 h, J7 et les contextes de traitement sont structurés.", ["I02", "I03", "I05"]),
        "langextract": cell("PARTIAL", "Le temps reste dans le texte, mais la projection temporelle est vide et l'inconnu est obsolète.", ["I02", "I05"]),
        "outlines": cell("PASS", "Les temps 24 h et J7 sont explicitement conservés.", ["I02"]),
    },
    "C12": {
        "sem-current": cell("PASS", "Le natif SEM conserve un graphe relationnel; l'adapter expérimental n'en expose que les types.", ["I01", "I02", "I03", "I04", "I05"]),
        "instructor": cell("PASS", "Les relations comparatives et d'observation sont textuellement reconstructibles.", ["I01", "I02", "I03", "I04", "I05"]),
        "pydanticai": cell("PARTIAL", "Les relations sont bonnes en I01/I03 mais le champ relation reste vide dans plusieurs états.", ["I01", "I02", "I03", "I04", "I05"]),
        "dspy": cell("PASS", "Les relations scientifiques importantes sont explicitement formulées.", ["I01", "I02", "I03", "I04", "I05"]),
        "langextract": cell("FAIL", "Aucune relation structurée n'est extraite dans les cinq scénarios.", ["I01", "I02", "I03", "I04", "I05"]),
        "outlines": cell("PASS", "Les relations majeures sont reconstructibles dans les états observés.", ["I01", "I02", "I03", "I04", "I05"]),
    },
    "C13": {baseline: cell("NOT_EVALUABLE", "Les variantes interactives exécutées ne discriminent pas correctement ces plans conceptuels.", ["I04", "I05"]) for baseline in BASELINES},
    "C14": {
        "sem-current": cell("PASS", "Le natif conserve les statuts épistémiques par élément.", ["I01", "I02", "I03", "I04", "I05"]),
        "instructor": cell("PARTIAL", "Aucune promotion visible, mais l'ownership n'est pas explicitement tracé.", ["I03"]),
        "pydanticai": cell("PARTIAL", "Aucune promotion visible, mais l'ownership n'est pas explicitement tracé.", ["I03"]),
        "dspy": cell("PASS", "Les paramètres PET proposés sont explicitement conservés comme candidats.", ["I03"]),
        "langextract": cell("PARTIAL", "Aucune promotion visible, mais aucun ownership n'est extrait.", ["I03"]),
        "outlines": cell("PARTIAL", "Aucune promotion visible, mais l'ownership n'est pas explicitement tracé.", ["I03"]),
    },
    "C15": {
        "sem-current": cell("PASS", "Les éléments natifs portent un statut épistémique traçable.", ["I01", "I02", "I03", "I04", "I05"]),
        "instructor": cell("PARTIAL", "Les inconnues sont séparées, sans statut épistémique systématique.", ["I01", "I03", "I05"]),
        "pydanticai": cell("PARTIAL", "Les inconnues sont séparées, sans statut épistémique systématique.", ["I02", "I05"]),
        "dspy": cell("PASS", "Les suggestions I03 sont marquées candidates et non faits utilisateur.", ["I03"]),
        "langextract": cell("PARTIAL", "Le schéma prévoit des classes, mais elles sont peu renseignées dans les sorties.", ["I01", "I02", "I03", "I04", "I05"]),
        "outlines": cell("PARTIAL", "Les inconnues sont séparées, sans provenance ou statut systématique.", ["I02", "I03", "I04", "I05"]),
    },
    "C16": {
        "sem-current": cell("FAIL", "Aucun candidat contextuel n'est exposé sur I03 malgré la demande de paramètres quantitatifs.", ["I03"]),
        "instructor": cell("FAIL", "Aucun candidat quantitatif n'est proposé en I03.", ["I03"]),
        "pydanticai": cell("FAIL", "Aucun candidat quantitatif n'est proposé en I03.", ["I03"]),
        "dspy": cell("PASS", "SUV, MTV, TLG et critères immuno-PET sont proposés comme candidats, sans attribution à l'utilisateur.", ["I03"]),
        "langextract": cell("FAIL", "Aucun candidat quantitatif n'est proposé en I03.", ["I03"]),
        "outlines": cell("FAIL", "Aucun candidat quantitatif n'est proposé en I03.", ["I03"]),
    },
    "C17": {
        "sem-current": cell("PASS", "Six états interactifs valides; aucune erreur provider SEM.", ["I01", "I02", "I03", "I04", "I05"]),
        "instructor": cell("PASS", "Six états interactifs structurés sans échec.", ["I01", "I02", "I03", "I04", "I05"]),
        "pydanticai": cell("PASS", "Huit états interactifs structurés sans échec.", ["I01", "I02", "I03", "I04", "I05"]),
        "dspy": cell("PASS", "Sept états interactifs structurés sans échec.", ["I01", "I02", "I03", "I04", "I05"]),
        "langextract": cell("PARTIAL", "Sept états valides, mais l'adapter de dialogue reste fragile et répète un inconnu résolu.", ["I02"]),
        "outlines": cell("PASS", "Huit états interactifs structurés sans échec de baseline.", ["I01", "I02", "I03", "I04", "I05"]),
    },
    "C18": {
        "sem-current": cell("PARTIAL", "Le sens explicite et les relations sont riches, mais l'état final manque souvent les décisions cachées faute de clarification.", ["I01", "I03", "I04", "I05"]),
        "instructor": cell("PARTIAL", "Bonne fidélité initiale, mais plusieurs états restent incomplets après FINISH précoce.", ["I01", "I02", "I03", "I05"]),
        "pydanticai": cell("PASS", "États finaux les plus complets sur les trois branches multi-tour réussies; aucune promotion observée.", ["I01", "I02", "I04"]),
        "dspy": cell("PARTIAL", "Bon état multi-tour et meilleur enrichissement, mais FINISH précoce sur trois scénarios.", ["I01", "I03", "I05"]),
        "langextract": cell("FAIL", "La copie des faits est fidèle mais relations, polarités et mémoire de résolution sont insuffisantes.", ["I01", "I02", "I03", "I04", "I05"]),
        "outlines": cell("PARTIAL", "Les états répondus sont riches, mais I03 reste techniquement incomplet côté simulateur.", ["I01", "I02", "I03", "I04", "I05"]),
    },
    "C19": {
        "sem-current": cell("PARTIAL", "Deux questions: une forte valeur en I02, une faible priorité en I05; trois FINISH précoces.", ["I01", "I02", "I03", "I04", "I05"]),
        "instructor": cell("PARTIAL", "Une seule question, utile mais large; plusieurs besoins de clarification restent ouverts.", ["I04"]),
        "pydanticai": cell("PARTIAL", "Trois questions utiles, mais parfois orientées par des exemples ou multi-composantes.", ["I01", "I02", "I04"]),
        "dspy": cell("PARTIAL", "Deux questions; I02 est précise, I04 moins décisionnelle.", ["I02", "I04"]),
        "langextract": cell("FAIL", "Trois ASK temporels dont deux répétitions après réponse.", ["I02"]),
        "outlines": cell("PARTIAL", "Cinq questions, avec une bonne couverture mais plusieurs questions secondaires ou combinées.", ["I01", "I02", "I03", "I04", "I05"]),
    },
    "C20": {
        "sem-current": cell("PASS", "Les réponses I02 et I05 sont intégrées avec temporalité, polarité et relations.", ["I02", "I05"]),
        "instructor": cell("PASS", "La réponse I04 est intégrée avec négations et rôles.", ["I04"]),
        "pydanticai": cell("PASS", "Les trois réponses reçues sont intégrées et clôturent les inconnues centrales.", ["I01", "I02", "I04"]),
        "dspy": cell("PASS", "Les deux réponses reçues sont intégrées avec temporalité et polarité.", ["I02", "I04"]),
        "langextract": cell("FAIL", "L'information reçue est copiée mais l'inconnu résolu reste actif et re-questionné.", ["I02"]),
        "outlines": cell("PARTIAL", "Trois réponses sont bien intégrées; deux autres ne sont pas disponibles dans les checkpoints.", ["I01", "I02", "I04", "I03", "I05"]),
    },
    "C21": {
        "sem-current": cell("FAIL", "FINISH à T0 sur I01, I03 et I04; I05 reste en attente technique.", ["I01", "I03", "I04", "I05"]),
        "instructor": cell("FAIL", "FINISH à T0 sur quatre scénarios malgré des inconnues explicitement détectées.", ["I01", "I02", "I03", "I05"]),
        "pydanticai": cell("PARTIAL", "Bonne clôture après réponse sur trois scénarios; I03 et I05 finissent sans lever des ambiguïtés utiles.", ["I01", "I02", "I03", "I04", "I05"]),
        "dspy": cell("PARTIAL", "Bonne clôture I02/I04, mais FINISH initial sur I01, I03 et I05.", ["I01", "I02", "I03", "I04", "I05"]),
        "langextract": cell("FAIL", "I02 atteint la profondeur maximale en répétant une question résolue; les autres finissent immédiatement.", ["I01", "I02", "I03", "I04", "I05"]),
        "outlines": cell("PARTIAL", "Bonne clôture sur quatre branches; I03 reste sans réponse checkpointée.", ["I01", "I02", "I03", "I04", "I05"]),
    },
    "C22": {baseline: cell("NOT_TESTED", "Aucun scénario exécuté ne contient une demande explicite d'arrêt.", [],) for baseline in BASELINES},
    "C23": {
        "sem-current": cell("PARTIAL", "Aucun échec interactif provider, mais 2,71 appels et environ 17,9 s par état en moyenne.", ["I01", "I02", "I03", "I04", "I05"]),
        "instructor": cell("PASS", "Un appel par état, six succès interactifs, environ 1,6 s par état.", ["I01", "I02", "I03", "I04", "I05"]),
        "pydanticai": cell("PASS", "Un appel par état, huit succès interactifs, environ 1,2 s par état; un incident smoke 504 reste historique.", ["I01", "I02", "I03", "I04", "I05"]),
        "dspy": cell("PASS", "Un appel par état, sept succès interactifs, environ 1,7 s par état.", ["I01", "I02", "I03", "I04", "I05"]),
        "langextract": cell("PARTIAL", "Un appel et moins d'une seconde par état, mais configuration spécialisée et contrôle de dialogue fragile.", ["I01", "I02", "I03", "I04", "I05"]),
        "outlines": cell("PARTIAL", "Un appel par état et huit succès interactifs; la phase smoke a nécessité une réparation de parsing.", ["I01", "I02", "I03", "I04", "I05"]),
    },
}


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ledger_statistics() -> dict[str, Any]:
    events = [json.loads(line) for line in (RESULT_ROOT / "provider-ledger.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    reservations = [item for item in events if item["event"] == "RESERVED"]
    completions = {item["requestNumber"]: item for item in events if item["event"] == "COMPLETED"}
    reserved = {item["requestNumber"]: item for item in reservations}
    technical: dict[str, Any] = {}
    for baseline in BASELINES:
        ledger_id = "EXP-SEM-INTERACTIVE-SEM-CURRENT" if baseline == "sem-current" else f"EXP-SEM-INTERACTIVE-{baseline.upper()}"
        rows = [item for item in reservations if item["baselineOrSimulator"] == ledger_id]
        interactive = [item for item in rows if item["scenario"].startswith("I")]
        groups: dict[tuple[str, str], list[float]] = defaultdict(list)
        for row in interactive:
            completed = completions.get(row["requestNumber"])
            if not completed:
                continue
            start = dt.datetime.fromisoformat(completed["startedAt"].replace("Z", "+00:00"))
            end = dt.datetime.fromisoformat(completed["completedAt"].replace("Z", "+00:00"))
            groups[(row["scenario"], row["round"])].append((end - start).total_seconds())
        state_latencies = [sum(values) for values in groups.values()]
        technical[baseline] = {
            "allMissionReservations": len(rows),
            "allMissionSucceeded": sum(completions.get(row["requestNumber"], {}).get("success") is True for row in rows),
            "allMissionFailed": sum(completions.get(row["requestNumber"], {}).get("success") is False for row in rows),
            "allMissionUnknownReserved": sum(row["requestNumber"] not in completions for row in rows),
            "interactiveProviderRequests": len(interactive),
            "interactiveProviderSuccesses": sum(completions.get(row["requestNumber"], {}).get("success") is True for row in interactive),
            "interactiveStatesWithLatency": len(state_latencies),
            "interactiveCallsPerState": round(len(interactive) / len(state_latencies), 2) if state_latencies else None,
            "interactiveMedianStateLatencySeconds": round(statistics.median(state_latencies), 3) if state_latencies else None,
            "interactiveMeanStateLatencySeconds": round(statistics.mean(state_latencies), 3) if state_latencies else None,
        }
    scenario_counts = Counter(item["scenario"] for item in reservations)
    return {
        "reservationsConservativelyCountedAsConsumed": len(reservations),
        "completedEvents": len(completions),
        "successfulCompletions": sum(item.get("success") is True for item in completions.values()),
        "failedCompletions": sum(item.get("success") is False for item in completions.values()),
        "unknownReserved": sum(number not in completions for number in reserved),
        "knownDailyUsageBefore": 357,
        "estimatedDailyUsageAfter": 357 + len(reservations),
        "remainingBeforeHardStop492": 492 - (357 + len(reservations)),
        "remainingProviderDailyLimit500": 500 - (357 + len(reservations)),
        "byScenario": dict(sorted(scenario_counts.items())),
        "byBaseline": technical,
    }


def interaction_statistics(transcripts: list[dict[str, Any]]) -> dict[str, Any]:
    state_counts: Counter[str] = Counter()
    question_counts: Counter[str] = Counter()
    statuses: dict[str, Counter[str]] = defaultdict(Counter)
    delivered_answers = 0
    generated_asks = 0
    for transcript in transcripts:
        for baseline, branch in transcript["branches"].items():
            state_counts[baseline] += len(branch["states"])
            generated_asks += sum(state["projection"]["action"] == "ASK" for state in branch["states"])
            question_counts[baseline] += branch["questionsAsked"]
            statuses[baseline][branch["status"]] += 1
            delivered_answers += sum(1 for turn in branch["turns"] if turn["role"] == "USER") - 1
    return {
        "scenarios": len(transcripts),
        "candidateStates": sum(state_counts.values()),
        "candidateStatesByBaseline": dict(state_counts),
        "askStatesGenerated": generated_asks,
        "questionsDispatchedToSimulator": sum(question_counts.values()),
        "questionsByBaseline": dict(question_counts),
        "researcherAnswersDeliveredToBranches": delivered_answers,
        "researcherSimulatorBatchCalls": 6,
        "terminalStatusesByBaseline": {baseline: dict(counter) for baseline, counter in statuses.items()},
    }


def report_table(headers: list[str], rows: list[list[Any]]) -> str:
    return "\n".join([
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
        *["| " + " | ".join(str(value) for value in row) + " |" for row in rows],
    ])


def main() -> int:
    transcripts = [read_json(path) for path in sorted(TRANSCRIPT_ROOT.glob("*.json"))]
    readiness = read_json(RESULT_ROOT / "technical-readiness.json")
    ledger = ledger_statistics()
    interactions = interaction_statistics(transcripts)
    generated_at = utc_now()

    capability_rows = [
        {"capabilityId": capability_id, "label": label, "assessments": MATRIX[capability_id]}
        for capability_id, label in CAPABILITIES.items()
    ]
    capability_artifact = {
        "campaignId": "EXP-SEM-INTERACTIVE-01",
        "adjudication": "SIMULATED_POST_HOC_ADJUDICATION",
        "adjudicator": "Codex; not a human expert panel",
        "scale": ["PASS", "PARTIAL", "FAIL", "NOT_EVALUABLE", "NOT_TESTED"],
        "aggregationRule": "Qualitative property judgment; no weighted or global score.",
        "scenarioConformanceLimitation": "Executed scenario variants differ materially from the requested cards; unexercised properties are NOT_TESTED or NOT_EVALUABLE.",
        "capabilities": capability_rows,
        "generatedAt": generated_at,
    }
    write_json(RESULT_ROOT / "capability-matrix.json", capability_artifact)

    divergences = {
        "campaignId": "EXP-SEM-INTERACTIVE-01",
        "adjudication": "SIMULATED_POST_HOC_ADJUDICATION",
        "divergences": [
            {
                "id": "DIV-01",
                "kind": "SCENARIO_CONFORMANCE",
                "architectures": BASELINES,
                "scenarios": ["I01", "I02", "I03", "I04", "I05"],
                "finding": "The harness executed simplified variants rather than the exact messages and hidden cards requested.",
                "impact": "C06 and C13 are not evaluable; C07 is not tested; missing-data and ownership conclusions are narrower than planned.",
                "noPostObservationRepair": True,
            },
            {
                "id": "DIV-02",
                "kind": "DIALOGUE_CONTROL",
                "architectures": ["sem-current", "instructor", "dspy", "langextract"],
                "scenarios": ["I01", "I03", "I04", "I05"],
                "finding": "Several candidates chose FINISH at T0 despite consequential unknowns; SEM finished early in I01, I03 and I04.",
                "impact": "Hidden corrections were never elicited on those branches.",
            },
            {
                "id": "DIV-03",
                "kind": "QUESTION_VALUE",
                "architectures": ["pydanticai", "outlines", "dspy", "sem-current"],
                "scenarios": ["I01", "I02", "I04", "I05"],
                "finding": "PydanticAI and Outlines asked more often; DSPy and SEM produced the strongest single temporal question in I02. Some questions were leading, multi-part, or low-priority.",
                "impact": "Question frequency and question value do not rank architectures identically.",
            },
            {
                "id": "DIV-04",
                "kind": "STALE_UNKNOWN_AND_REPEAT",
                "architectures": ["langextract"],
                "scenarios": ["I02"],
                "finding": "LangExtract retained the missing-time statement after 24 h and J7 were supplied, then repeated the same clarification.",
                "impact": "MAX_DIALOGUE_DEPTH_REACHED despite a resolved unknown.",
            },
            {
                "id": "DIV-05",
                "kind": "CONTEXTUAL_ENRICHMENT",
                "architectures": ["dspy", "sem-current", "instructor", "pydanticai", "langextract", "outlines"],
                "scenarios": ["I03"],
                "finding": "DSPy alone proposed PET quantitative candidates and labeled them as candidates; the other projections did not enrich the request.",
                "impact": "DSPy confirms an enrichment signal, but the exact requested I03 constraints were not executed.",
            },
            {
                "id": "DIV-06",
                "kind": "SEM_NORMALIZATION_LOSS",
                "architectures": ["sem-current"],
                "scenarios": ["I01", "I02", "I03", "I04", "I05"],
                "finding": "SEM native relations retain endpoints and epistemic fields, while the experimental normalized projection exposes only relation types.",
                "impact": "The native output must remain the evidentiary source; normalized relation strings alone are insufficient.",
            },
            {
                "id": "DIV-07",
                "kind": "SIMULATOR_CHECKPOINT_INCOMPLETENESS",
                "architectures": ["outlines", "sem-current"],
                "scenarios": ["I03", "I05"],
                "finding": "A successful batched simulator call omitted Outlines in I03. The malformed I05 checkpoint was recovered deterministically by matching each unique question to its branch.",
                "impact": "I03/Outlines cannot be evaluated after ASK; the successful simulator operation was not replayed.",
            },
            {
                "id": "DIV-08",
                "kind": "TECHNICAL_COST",
                "architectures": BASELINES,
                "scenarios": ["I01", "I02", "I03", "I04", "I05"],
                "finding": "External frameworks used one provider request per state; SEM used 2.67 requests and about 17.2 seconds per state on average.",
                "impact": "SEM's critic/repair pipeline has a material operational cost that requires a demonstrated semantic benefit.",
            },
            {
                "id": "DIV-09",
                "kind": "PRODUCT_IMPLEMENTATION_BOUNDARY",
                "architectures": ["sem-current"],
                "scenarios": ["I01", "I02", "I03", "I04", "I05"],
                "finding": "NOXIA_INTERACTIVE_CONTROLLER_NOT_IMPLEMENTED. The experiment maps SEM clarificationCandidates to ASK and otherwise to FINISH.",
                "impact": "The observed dialogue decisions are not evidence of a production PD-009 controller.",
            },
        ],
        "generatedAt": generated_at,
    }
    write_json(RESULT_ROOT / "divergence-analysis.json", divergences)

    comparisons = {
        "instructor": {
            "classificationAgainstSem": "WORSE_THAN_NOXIA",
            "rationale": "Bonne fidélité explicite et faible coût, mais FINISH prématurés fréquents, relations limitées et aucun enrichissement.",
        },
        "pydanticai": {
            "classificationAgainstSem": "COMPARABLE_WITH_MAJOR_OPERATIONAL_ADVANTAGE",
            "rationale": "Meilleure complétude multi-tour observée, un appel par état et orchestration plus simple; ownership moins explicite que SEM.",
        },
        "dspy": {
            "classificationAgainstSem": "COMPARABLE_WITH_MAJOR_OPERATIONAL_ADVANTAGE",
            "rationale": "Meilleur enrichissement contextuel et bonnes mises à jour I02/I04 avec un appel par état; dialogue souvent terminé trop tôt.",
        },
        "langextract": {
            "classificationAgainstSem": "WORSE_THAN_NOXIA",
            "rationale": "Extraction fidèle et rapide, mais relations et polarités faibles, avec inconnus obsolètes en multi-tour.",
        },
        "outlines": {
            "classificationAgainstSem": "COMPARABLE_WITHOUT_MEANINGFUL_ADVANTAGE",
            "rationale": "États riches et large couverture des clarifications, mais valeur des questions inégale et parsing réparé; lacunes simulateur limitantes.",
        },
    }
    summary = {
        "campaignId": "EXP-SEM-INTERACTIVE-01",
        "decision": "EXP_INTERACTIVE_COMPARE_PARTIAL_TECHNICAL",
        "nature": "EXPERIMENTAL_NON_NORMATIVE_EXPLORATORY",
        "architecturalConclusion": "HYBRID_ARCHITECTURE",
        "bestExternalArchitecture": "pydanticai",
        "technicalReadiness": {baseline: readiness["baselines"][baseline]["status"] for baseline in BASELINES},
        "interactiveCampaign": interactions,
        "provider": ledger,
        "noxia": {
            "scientificStateUnderstanding": "PARTIAL_BUT_STRUCTURALLY_RICH",
            "dialogueController": "NOXIA_INTERACTIVE_CONTROLLER_NOT_IMPLEMENTED",
            "observedExperimentalDialogueControl": "MIXED_ONE_HIGH_VALUE_ASK_MULTIPLE_PREMATURE_FINISHES",
            "strengths": ["native relations", "epistemic status", "negation/non-causality preservation", "zero interactive provider failure"],
            "weaknesses": ["no production generic dialogue controller", "high calls and latency", "no I03 contextual candidates", "early FINISH on I01/I03/I04"],
        },
        "comparisonsAgainstSem": comparisons,
        "limitations": [
            "Executed scenarios are simplified variants, not exact prompt scenarios.",
            "One ASK branch lacks a checkpointed simulator answer.",
            "Adjudication is simulated post hoc, not human expert review.",
            "No blind material or PD-011 qualification was used.",
            "All candidates share the same base model; results mix model and orchestration effects.",
        ],
        "boundaries": {
            "realHumanExpertReview": False,
            "pd011Qualification": False,
            "blindReused": False,
            "tuningAfterInteractiveObservation": False,
            "semProductBehaviorModified": False,
            "sourceOfTruthIndexModified": False,
        },
        "next": "Design and implement one generic PD-009 dialogue controller over a preserved scientific-state contract, then preregister a clean visible comparison using the exact scenario texts before any further provider run.",
        "generatedAt": generated_at,
    }
    write_json(RESULT_ROOT / "comparative-summary.json", summary)

    readiness_rows = [[LABELS[b], readiness["baselines"][b]["status"], "2/2 visible outputs"] for b in BASELINES]
    technical_rows = []
    for baseline in BASELINES:
        metrics = ledger["byBaseline"][baseline]
        technical_rows.append([
            LABELS[baseline], interactions["candidateStatesByBaseline"][baseline],
            metrics["interactiveProviderRequests"], metrics["interactiveCallsPerState"],
            metrics["interactiveMeanStateLatencySeconds"], metrics["interactiveProviderSuccesses"],
        ])
    principal_caps = ["C01", "C02", "C03", "C04", "C08", "C10", "C14", "C16", "C18", "C19", "C21", "C23"]
    cap_rows = [[cap, CAPABILITIES[cap], *[MATRIX[cap][baseline]["status"] for baseline in BASELINES]] for cap in principal_caps]
    dialogue_rows = []
    for baseline in BASELINES:
        statuses = interactions["terminalStatusesByBaseline"][baseline]
        dialogue_rows.append([
            LABELS[baseline], interactions["questionsByBaseline"][baseline],
            MATRIX["C10"][baseline]["status"], MATRIX["C20"][baseline]["status"],
            statuses.get("FINISHED", 0), statuses.get("MAX_DIALOGUE_DEPTH_REACHED", 0),
            statuses.get("STOPPED_BY_CANDIDATE", 0), statuses.get("SIMULATOR_OUTPUT_NOT_CHECKPOINTED_OR_BRANCH_MISSING", 0),
        ])

    report = f"""# EXP-SEM-INTERACTIVE-01 — Overnight Interactive Scientific Understanding Comparison

Status: `EXPERIMENTAL_NON_NORMATIVE_EXPLORATORY`
Adjudication: `SIMULATED_POST_HOC_ADJUDICATION`
Decision: `EXP_INTERACTIVE_COMPARE_PARTIAL_TECHNICAL`
Conclusion architecturale: `HYBRID_ARCHITECTURE`

## Résultat exécutif

Les six architectures sont techniquement exécutables avec `gemini-3.5-flash-lite`. PydanticAI fournit le meilleur compromis externe observé: états multi-tour complets sur les branches répondables, un appel par état et une latence moyenne d'environ 1,2 s. DSPy confirme un signal spécifique d'enrichissement contextuel: c'est la seule baseline ayant proposé en I03 des paramètres PET comme candidats, sans les attribuer à l'utilisateur.

SEM conserve une valeur structurelle observable dans ses sorties natives — relations, polarités et statuts épistémiques — et n'a connu aucun échec provider pendant les scénarios. En revanche, l'expérience n'observe aucun contrôleur interactif produit générique: `NOXIA_INTERACTIVE_CONTROLLER_NOT_IMPLEMENTED`. L'adapter expérimental transforme la première clarification SEM en `ASK`, sinon en `FINISH`. Il a posé une bonne question temporelle en I02, une question secondaire en I05 et a terminé trop tôt en I01, I03 et I04. Le coût observé est de 2,71 appels et 17,9 s par état, contre environ un appel et 0,9–1,7 s pour les frameworks externes.

La conclusion n'est pas un remplacement du coeur SEM. Les scénarios exécutés sont des variantes simplifiées et I03/Outlines n'a pas de réponse simulateur checkpointée. La recommandation est donc hybride: préserver un état scientifique riche et traçable, mais construire un contrôleur PD-009 générique, plus simple, testable séparément, au-dessus de ce contrat.

## Technical readiness

{report_table(["Architecture", "Statut", "Preuve"], readiness_rows)}

Phase A a consommé 24 réservations sur le plafond de 25. Les erreurs initiales de configuration, parsing et deux 504 ont été réparées uniquement dans la plomberie expérimentale. Les six baselines ont ensuite produit deux sorties natives visibles.

## Campagne interactive

- Scénarios exécutés: {interactions['scenarios']} (`I01`–`I05`).
- États candidats: {interactions['candidateStates']}.
- États `ASK` générés: {interactions['askStatesGenerated']}.
- Questions effectivement envoyées au simulateur: {interactions['questionsDispatchedToSimulator']}.
- Réponses chercheur effectivement livrées aux branches: {interactions['researcherAnswersDeliveredToBranches']}.
- Appels batch du simulateur chercheur: {interactions['researcherSimulatorBatchCalls']}.
- Réservations provider nouvelles, comptées prudemment comme consommées: {ledger['reservationsConservativelyCountedAsConsumed']}.
- Compteur journalier estimé final: {ledger['estimatedDailyUsageAfter']}/500; marge avant le hard stop 492: {ledger['remainingBeforeHardStop492']}.
- Ledger: {ledger['successfulCompletions']} succès, {ledger['failedCompletions']} échecs, {ledger['unknownReserved']} réservation à issue inconnue.
- Reprise sûre: 5 réservations supplémentaires, 4 succès, 1 échec local avant réseau; aucun appel simulateur `SUCCESS` rejoué.

{report_table(["Architecture", "États", "Appels interactifs", "Appels/état", "Latence moyenne/état (s)", "Succès interactifs"], technical_rows)}

Les durées sont calculées depuis les horodatages du ledger et ne constituent pas un benchmark de performance contrôlé. SEM réalise plusieurs passes natives de reconstruction/critic/repair; les baselines externes effectuent une seule génération par état.

## Limite de conformité des scénarios

La campagne n'a pas exécuté exactement les messages et hidden cards prescrits. Elle a utilisé des variantes simplifiées, enregistrées sans réécriture dans `scenario-cards.json`:

- I01 conserve STEMI/stent/IRM, mais omet les détails multivaisseaux, lésion coupable, 4–6 semaines et CMR J3–J5.
- I02 remplace la formulation OEF/perfusion par une relation générale et reporte l'absence d'IRM pré-geste dans la première réponse.
- I03 omet dans le message initial la négation SUVmax seul et le CT de routine.
- I04 omet l'atteinte précoce avant fibrose et l'hétérogénéité initiale des séquences.
- I05 omet le pré/post, la récidive, l'IRM manquante et les coréférences «ça»/«ceux qui».

Conséquence: C06 est `NOT_TESTED`, C07 est `NOT_TESTED`, C13 est `NOT_EVALUABLE`, et les conclusions sur l'implicite, la coréférence, les données manquantes et l'ownership sont nécessairement étroites. Aucun scénario, prompt ou résultat n'a été corrigé après observation.

## Résultats scientifiques principaux

{report_table(["Capacité", "Objet", *[LABELS[b] for b in BASELINES]], cap_rows)}

La matrice exhaustive C01–C23, avec preuves et scénarios associés, se trouve dans `capability-matrix.json`. Aucun score global n'est calculé.

## Dialogue

{report_table(["Architecture", "Questions", "Valeur", "Intégration", "FINISH", "Max depth", "STOP", "Sim. manquant"], dialogue_rows)}

Questions les plus utiles observées:

- DSPy et SEM en I02: calendrier post-thrombectomie, puis intégration de 24 h/J7 et de la non-causalité.
- Outlines en I01: critère principal, puis intégration taille d'infarctus/MVO/absence de strain.
- PydanticAI en I01 et I04: endpoints et mesures disponibles, avec une formulation parfois trop guidée par des exemples.

Défauts saillants:

- LangExtract répète en I02 un inconnu déjà résolu et atteint la profondeur maximale.
- Outlines demande en I03 le type/localisation tumorale alors que l'endpoint ou le rôle des paramètres aurait une valeur plus directe.
- SEM demande en I05 les critères d'inclusion plutôt que la temporalité, le delta ADC ou l'endpoint.
- Aucun `STOP` n'a été produit. C22 reste `NOT_TESTED`, car aucun abandon explicite n'était inclus.

## Divergences et architecture

Les différences observées proviennent de plusieurs couches:

- **Base model capability**: tous les candidats partagent Gemini; une grande part de la paraphrase scientifique vient donc du même modèle.
- **Structured output effect**: Instructor, PydanticAI et Outlines produisent directement un état riche et lisible; LangExtract perd des relations faute d'extractions correspondantes.
- **Orchestration effect**: SEM ajoute plusieurs passes, plus coûteuses, et conserve davantage de structure épistémique native.
- **Memory/state effect**: PydanticAI, DSPy et Outlines consolident correctement les réponses reçues; LangExtract conserve un inconnu obsolète.
- **Dialogue-control effect**: aucune baseline ne domine uniformément. PydanticAI couvre le mieux les branches réellement répondables; SEM a une très bonne question I02 mais plusieurs FINISH précoces.
- **Framework robustness**: les six frameworks fonctionnent après réparation expérimentale; les états interactifs externes utilisent un seul appel.

## Comparaison asymétrique contre SEM

{report_table(["Alternative", "Classification", "Raison"], [[LABELS[b], comparisons[b]['classificationAgainstSem'], comparisons[b]['rationale']] for b in ["instructor", "pydanticai", "dspy", "langextract", "outlines"]])}

### Meilleure alternative externe observée

`PydanticAI` est la meilleure alternative externe de cette passe. Elle combine la meilleure reconstruction globale observée sur les branches multi-tour, une bonne conservation des corrections/négations et un appel provider par état. Ses limites sont une provenance/ownership moins structurés que SEM, des questions parfois guidées ou multi-parties, et des FINISH précoces en I03/I05.

DSPy confirme le signal de SEM-003D-COMP uniquement sur un axe: enrichissement contextuel utile avec étiquetage candidat. Il ne confirme pas une domination globale, car il termine à T0 en I01, I03 et I05.

## NOXIA / SEM

- State understanding: `PARTIAL_BUT_STRUCTURALLY_RICH`.
- Dialogue control produit: `NOXIA_INTERACTIVE_CONTROLLER_NOT_IMPLEMENTED`.
- Preuve de dépôt: `src/features/protocol-designer/intake/questions.ts` contient un registre fixe de cinq questions adaptatives; aucun contrôleur générique `ASK`/`FINISH`/`STOP` n'a été trouvé.
- Forces: relations natives, statut épistémique, négations/non-causalité, robustesse provider interactive.
- Faiblesses: dialogue control expérimental inégal, enrichissement I03 absent, 2,71 appels/état, latence élevée.
- Complexité expérimentale: bridge SEM d'environ 56 lignes Python + 110 lignes TypeScript, contre 7–15 lignes par adapter direct Instructor/PydanticAI/DSPy/Outlines et 43 lignes pour LangExtract.

## Incidents techniques conservés

- Une réservation PydanticAI smoke reste sans issue connue et compte comme consommée.
- Deux 504 smoke ont reçu l'unique retry autorisé.
- Des erreurs de parsing Outlines et de configuration LangExtract ont été corrigées avant leurs deux smokes réussis.
- Le batch simulateur I03 a omis Outlines et reste irrécupérable sans rejouer un succès.
- Le checkpoint I05 associait les réponses au texte des questions; un mapping déterministe vers les deux branches a permis de reprendre SEM T1 et Outlines T1 sans répéter le simulateur.
- La première tentative Outlines T1 a échoué localement avant réseau faute de clé exportée; elle reste comptée par prudence. La reprise avec la configuration locale existante a réussi.

## Frontières

- Revue d'experts humains réelle: `NO`.
- Qualification PD-011: `NO`.
- Blind réutilisé ou consulté: `NO`.
- Tuning scientifique après observation interactive: `NO`.
- Modification du comportement SEM produit: `NO`.
- Modification du SOURCE-OF-TRUTH-INDEX: `NO`.

## Décision et next

Décision: `EXP_INTERACTIVE_COMPARE_PARTIAL_TECHNICAL`.

Conclusion: `HYBRID_ARCHITECTURE`.

Prochaine action unique: concevoir et implémenter un contrôleur PD-009 générique au-dessus d'un contrat d'état scientifique préservé, puis préenregistrer une comparaison visible propre avec les textes exacts avant tout nouvel appel provider.
"""
    (RESULT_ROOT / "interactive-comparative-report.md").write_text(report, encoding="utf-8")

    manifest_path = RESULT_ROOT / "run-manifest.json"
    manifest = read_json(manifest_path)
    resume_summary_path = RESULT_ROOT / "resume-summary.json"
    resume_summary = read_json(resume_summary_path) if resume_summary_path.exists() else None
    manifest.update({
        "status": "POST_HOC_ADJUDICATION_COMPLETE_WITH_TECHNICAL_LIMITATIONS",
        "decision": summary["decision"],
        "architecturalConclusion": summary["architecturalConclusion"],
        "adjudication": "SIMULATED_POST_HOC_ADJUDICATION",
        "finalArtifactDigests": {
            name: sha256(RESULT_ROOT / name)
            for name in ["capability-matrix.json", "divergence-analysis.json", "comparative-summary.json", "interactive-comparative-report.md"]
        },
        "postHocAdjudicationCodeDigest": sha256(Path(__file__)),
        "adjudicationCompletedAt": generated_at,
        "newProviderRequestsReserved": ledger["reservationsConservativelyCountedAsConsumed"],
        "estimatedDailyUsageAfterMission": ledger["estimatedDailyUsageAfter"],
        "generationProviderRequestsReserved": (
            resume_summary["providerReservationsBefore"] if resume_summary else manifest["newProviderRequestsReserved"]
        ),
        "safeResume": {
            "status": "COMPLETE_WITH_ONE_UNRECOVERABLE_BRANCH",
            "remainingBranch": "I03:outlines:R1",
            "summaryDigest": sha256(resume_summary_path) if resume_summary else None,
            "resumeCodeDigest": sha256(PACKAGE_ROOT / "resume.py"),
            "providerNormalizationCodeDigest": sha256(PACKAGE_ROOT / "campaign.py"),
            "completedAt": generated_at,
        },
    })
    write_json(manifest_path, manifest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
