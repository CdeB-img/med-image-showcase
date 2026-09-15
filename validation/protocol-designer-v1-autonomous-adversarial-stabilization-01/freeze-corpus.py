"""Validate independently generated language and freeze the campaign before discovery."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent
def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name, value):
    p = root / name
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    tmp.replace(p)

if (root / "corpus-freeze.json").exists():
    frozen = json.loads((root / "corpus-freeze.json").read_text())
    assert digest(root / "corpus.json") == frozen["corpusSha256"]
    print("Already frozen; no change")
    raise SystemExit(0)
semantic_path = root / "semantic-corpus.json"
semantic_sha = digest(semantic_path)
assert semantic_sha == json.loads((root / "semantic-freeze.json").read_text())["sha256"]
corpus = json.loads(semantic_path.read_text())
language = {}
inputs = {}
categories = {"NEGATION", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "TEMPORAL_RELATION"}
for i in range(1, 4):
    p = root / f"language-batch-{i}.json"
    batch = json.loads(p.read_text())
    assert batch["semanticSha256"] == semantic_sha
    inputs[p.name] = digest(p)
    for scenario in batch["scenarios"]:
        assert scenario["id"] not in language
        language[scenario["id"]] = {t["id"]: t for t in scenario["turns"]}
        assert len(language[scenario["id"]]) == len(scenario["turns"]) == 15
assert set(language) == {s["id"] for s in corpus["scenarios"]}
count = 0
for scenario in corpus["scenarios"]:
    assert set(language[scenario["id"]]) == {t["id"] for t in scenario["turns"]}
    for turn in scenario["turns"]:
        generated = language[scenario["id"]][turn["id"]]
        assert generated["userText"].strip()
        evidence = generated["languageInvariantEvidence"]
        assert set(evidence) == categories
        for snippets in evidence.values():
            assert len(snippets) <= 6
            for snippet in snippets:
                assert 1 <= len(snippet) <= 240 and snippet in generated["userText"]
        turn["userText"] = generated["userText"]
        turn["languageInvariantEvidence"] = evidence
        count += 1
assert len(corpus["scenarios"]) == 15 and count == 225
save("corpus.json", corpus)
now = datetime.now(timezone.utc).isoformat()
freeze = {"corpusSha256": digest(root / "corpus.json"), "semanticSha256": semantic_sha, "languageInputs": inputs, "frozenAtUtc": now, "conversations": 15, "turns": 225, "productChangesAtFreeze": "NONE", "languageGeneration": "PARSER_BLIND_AFTER_SEMANTIC_FREEZE", "languageUnderstandingClaim": "SYNTHETIC_CONTRACT_ONLY"}
save("corpus-freeze.json", freeze)
state = json.loads((root / "resume-state.json").read_text())
state.update(CURRENT_PHASE="DISCOVERY_READY", LAST_VALID_CHECKPOINT="CP1_CORPUS_FROZEN", CORPUS_SHA256=freeze["corpusSha256"], NEXT_DETERMINISTIC_ACTION="Run DISCOVERY A01,A02,A03,A04,B01; persist each conversation; no product repair before CP2")
save("resume-state.json", state)
with (root / "checkpoint-log.md").open("a") as f:
    f.write(f"- {now} — CP1 corpus frozen: 15 conversations / 225 turns; semantic then parser-blind language; product unchanged; providers=0. SHA256 {freeze['corpusSha256']}.\n")
print(json.dumps(freeze, indent=2))
