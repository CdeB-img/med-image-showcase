"""Summarize immutable per-conversation evidence without equating collection PASS to product PASS."""
import hashlib
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
root = Path(__file__).resolve().parent
phase = sys.argv[1]
state = json.loads((root / "resume-state.json").read_text())
receipts = state["DISCOVERY_QUALIFIED_ATTEMPT_RECEIPTS"] if phase == "DISCOVERY" else [s for s in state["COMPLETED_SCENARIOS"] if s["phase"] == phase]
assert len({r["scenario"] for r in receipts}) == len(receipts)
scenarios = []
anomalies = []
manifest = {}
for receipt in receipts:
    file = root / receipt["result"]
    assert hashlib.sha256(file.read_bytes()).hexdigest() == receipt["sha256"]
    result = json.loads(file.read_text())
    anomalies.extend(result["anomalies"])
    for evidence in file.parent.iterdir():
        if evidence.is_file(): manifest[str(evidence.relative_to(root))] = hashlib.sha256(evidence.read_bytes()).hexdigest()
    scenarios.append({"id": receipt["scenario"], "turns": result["turnsAttempted"], "plannedTurns": result["plannedTurns"], "harnessCompleted": result["harnessCompleted"], "productVerdict": "PASS" if not result["anomalies"] and result["harnessCompleted"] else "FAIL", "anomalies": len(result["anomalies"]), "firstFailures": [{"turn": t["turn"], "properties": [c["property"] for c in t["checks"] if c["status"] == "FAIL"][:8]} for t in result["checks"] if any(c["status"] == "FAIL" for c in t["checks"])], "evidence": receipt["result"]})
summary = {"phase": phase, "at": datetime.now(timezone.utc).isoformat(), "conversations": len(scenarios), "meaningfulTurns": sum(s["turns"] for s in scenarios), "harnessCompleted": sum(s["harnessCompleted"] for s in scenarios), "productPass": sum(s["productVerdict"] == "PASS" for s in scenarios), "rawOracleSymptoms": len(anomalies), "severity": dict(Counter(a["SEVERITY"] for a in anomalies)), "propertyCounts": dict(Counter(a["PROPERTY"].split("_")[0] for a in anomalies)), "scenarios": scenarios, "realProviderCalls": 0, "qualificationLimit": "Synthetic external provider contracts; provider language fidelity and global scientific adequacy not qualified", "manifest": manifest}
(root / (phase.lower() + "-metrics.json")).write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({k: v for k, v in summary.items() if k not in ["scenarios", "manifest"]}, indent=2))
