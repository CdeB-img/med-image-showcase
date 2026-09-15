"""Offline qualification only; execute after the parent's explicit stability signal."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
CAMPAIGN = Path(__file__).resolve().parent
QUALIFICATION = CAMPAIGN / "qualification"
GUARD = ROOT / "validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-guard.cjs"
PLAN = json.loads((CAMPAIGN / "qualification-test-plan.json").read_text())
NEW_TESTS = [
    "src/features/knowledge-engine/__tests__/privacy.test.ts",
    "src/features/protocol-designer/functional-reset/__tests__/product-entry-reversible-admission.test.ts",
]
SECRET_NAMES = {"OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"}


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def run_git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def build_commands(whitelist):
    commands = []
    for gate in PLAN["additionalFinalGates"]:
        if gate["id"] in {"typescript-canonical", "typescript-mission", "production-build"}:
            tokens = shlex.split(gate["command"])
            commands.append({"id": gate["id"], "argv": tokens[2:], "env": {}})
    commands.insert(2, {"id": "lint-affected", "argv": ["node", "./node_modules/eslint/bin/eslint.js", *whitelist], "env": {}})
    for group in PLAN["commands"]:
        tokens = shlex.split(group["command"])
        environment = {}
        i = 1
        while i < len(tokens) and "=" in tokens[i] and not tokens[i].startswith("--"):
            key, value = tokens[i].split("=", 1)
            if key != "NODE_OPTIONS":
                environment[key] = value
            i += 1
        commands.append({"id": group["id"], "argv": tokens[i:], "env": environment})
    commands.append({
        "id": "full-canonical-suite",
        "argv": ["node", "./node_modules/vitest/vitest.mjs", "run", "src", *NEW_TESTS,
                 "--reporter=default", "--reporter=json", f"--outputFile={QUALIFICATION / 'full-suite.json'}"],
        "env": {},
    })
    return commands


def summarize_vitest(path):
    if not path.exists():
        return {"reportExists": False}
    data = json.loads(path.read_text())
    return {
        "reportExists": True, "report": str(path.relative_to(ROOT)), "sha256": sha(path),
        **{key: data.get(key) for key in ["success", "numTotalTests", "numPassedTests", "numFailedTests", "numPendingTests", "numTodoTests", "numTotalTestSuites", "numFailedTestSuites"]},
        "reportedTestFiles": len(data.get("testResults", [])),
        "failedAssertions": [{"file": suite["name"], "title": test["fullName"], "messages": test.get("failureMessages", [])}
                             for suite in data.get("testResults", []) for test in suite.get("assertionResults", []) if test["status"] == "failed"],
        "extraRequiredFiles": {file: any(suite["name"].endswith(file) for suite in data.get("testResults", [])) for file in NEW_TESTS},
    }


if len(sys.argv) != 2 or sys.argv[1] != "SOURCE_FINAL_STABLE":
    raise SystemExit("PREPARED_ONLY: requires explicit SOURCE_FINAL_STABLE signal before execution")
if sha(GUARD) != PLAN["safety"]["guardSha256"]:
    raise SystemExit("OFFLINE_GUARD_DIGEST_MISMATCH")
if QUALIFICATION.exists() and any(QUALIFICATION.iterdir()):
    raise SystemExit("QUALIFICATION_DIRECTORY_NOT_EMPTY: previous evidence must not be overwritten")
QUALIFICATION.mkdir(exist_ok=True)
prefix = QUALIFICATION / "recorded-live-prefix"
prefix.mkdir(exist_ok=False)
tracked_changes = run_git("diff", "--name-only").splitlines()
product_whitelist = sorted({p for p in tracked_changes if p.endswith((".ts", ".tsx", ".cjs"))} | set(NEW_TESTS))
mission_whitelist = sorted(str(p.relative_to(ROOT)) for p in CAMPAIGN.iterdir() if p.suffix in {".ts", ".tsx", ".cjs"})
whitelist = sorted(set(product_whitelist + mission_whitelist))
frozen = {file: sha(ROOT / file) for file in whitelist}
canonical_tests = sorted({p for p in run_git("ls-files", "--", "src").splitlines()
                          if re.fullmatch(r"src/.*\.(?:test|spec)\.(?:ts|tsx|mjs)", p)} | set(NEW_TESTS))
commands = build_commands(whitelist)
environment = {key: os.environ[key] for key in os.environ if key not in SECRET_NAMES}
environment["NODE_OPTIONS"] = f"--require={GUARD}"
environment["NO_COLOR"] = "1"
receipt = {
    "contract": "NOXIA_FINAL_TECHNICAL_QUALIFICATION", "status": "RUNNING", "startedAt": now(),
    "signal": "SOURCE_FINAL_STABLE", "head": run_git("rev-parse", "HEAD"),
    "plan": str((CAMPAIGN / "qualification-test-plan.json").relative_to(ROOT)),
    "planSha256": sha(CAMPAIGN / "qualification-test-plan.json"), "guardSha256": sha(GUARD),
    "runnerSha256": sha(Path(__file__).resolve()), "canonicalTestFiles": canonical_tests,
    "realProviderCallsAuthorized": 0, "historicalEvidenceWriteAuthorized": False,
    "sourceSha256": frozen, "lintWhitelist": whitelist, "commands": commands, "results": [],
    "limitations": ["Synthetic transport and exact historical replay do not measure current live-provider fidelity.",
                    "Root owns mass replay and visible-browser qualification; neither is replaced by the canonical suite.",
                    "Vitest JSON does not expose a dedicated unhandled-errors count; console diagnostics are scanned separately and retained verbatim."]
}
write_json(QUALIFICATION / "execution-plan.json", receipt)
receipt_path = CAMPAIGN / "final-tech-qualification.json"
if receipt_path.exists():
    raise SystemExit("FINAL_RECEIPT_ALREADY_EXISTS")
for command in commands:
    drift = [file for file, digest in frozen.items() if sha(ROOT / file) != digest]
    if drift:
        receipt.update(status="BLOCKED_SOURCE_DRIFT", drift=drift)
        break
    identifier = command["id"]
    print(json.dumps({"event": "START", "id": identifier, "at": now()}), flush=True)
    log = QUALIFICATION / f"{identifier}.log"
    start = time.monotonic()
    started = now()
    with log.open("x") as output:
        process = subprocess.run(command["argv"], cwd=ROOT, env={**environment, **command["env"]}, stdout=output, stderr=subprocess.STDOUT)
    contents = log.read_text(errors="replace")
    unhandled = [line for line in contents.splitlines() if re.search(r"(?:Vitest caught \d+ unhandled|Unhandled (?:Errors?|Rejection|Exception)|uncaughtException)", line, re.I)]
    count_matches = re.findall(r"Vitest caught (\d+) unhandled", contents, re.I)
    reported_unhandled_count = sum(map(int, count_matches)) if count_matches else (0 if not unhandled else None)
    item = {"id": identifier, "startedAt": started, "completedAt": now(), "durationSeconds": round(time.monotonic() - start, 3),
            "exitCode": process.returncode, "log": str(log.relative_to(ROOT)), "logSha256": sha(log),
            "unhandledDiagnosticLines": unhandled, "reportedUnhandledCount": reported_unhandled_count}
    json_args = [arg.split("=", 1)[1] for arg in command["argv"] if arg.startswith("--outputFile=")]
    if json_args:
        item["vitest"] = summarize_vitest(ROOT / json_args[0])
    item["status"] = "PASS" if process.returncode == 0 and not unhandled and (not json_args or item["vitest"].get("success") is True) else "FAIL"
    if identifier == "full-canonical-suite" and item["vitest"].get("reportExists"):
        full_data = json.loads((ROOT / json_args[0]).read_text())
        reported = {str(Path(suite["name"]).relative_to(ROOT)) for suite in full_data.get("testResults", [])}
        item["missingCanonicalTestFiles"] = sorted(set(canonical_tests) - reported)
        item["expectedCanonicalTestFiles"] = len(canonical_tests)
        if item["missingCanonicalTestFiles"]:
            item["status"] = "FAIL"
    receipt["results"].append(item)
    write_json(QUALIFICATION / f"{identifier}-receipt.json", item)
    write_json(receipt_path, receipt)
    print(json.dumps({"event": "COMPLETE", "id": identifier, "status": item["status"], "exitCode": process.returncode,
                      "passed": item.get("vitest", {}).get("numPassedTests"), "failed": item.get("vitest", {}).get("numFailedTests"),
                      "unhandled": reported_unhandled_count}), flush=True)
drift = [file for file, digest in frozen.items() if sha(ROOT / file) != digest]
if drift:
    receipt.update(status="BLOCKED_SOURCE_DRIFT", drift=drift)
elif receipt["status"] == "RUNNING":
    receipt["status"] = "PASS" if all(result["status"] == "PASS" for result in receipt["results"]) else "FAIL"
receipt["completedAt"] = now()
receipt["completedCommands"] = len(receipt["results"])
receipt["expectedCommands"] = len(commands)
write_json(receipt_path, receipt)
print(json.dumps({"event": "FINAL", "status": receipt["status"], "receipt": str(receipt_path)}), flush=True)
