from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path


TASK_DIR = Path(__file__).resolve().parent
FIXTURE_DIR = TASK_DIR / "fixtures"
sys.path.insert(0, str(TASK_DIR))

spec = importlib.util.spec_from_file_location("semantic_audit_fixture_runner", TASK_DIR / "semantic_audit.py")
semantic_audit = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(semantic_audit)


class HistoricalFixtureRegressionTests(unittest.TestCase):
    def test_all_visible_historical_fixture_expectations(self) -> None:
        fixture_files = sorted(FIXTURE_DIR.glob("*.json"))
        self.assertEqual(5, len(fixture_files))
        observed_families: set[str] = set()
        variant_count = 0
        for path in fixture_files:
            fixture = json.loads(path.read_text(encoding="utf-8"))
            observed_families.add(fixture["fixtureFamily"])
            self.assertEqual("VISIBLE_HISTORICAL_NON_PD011_FIXTURE", fixture["evidenceStatus"])
            self.assertTrue(fixture["evidencePaths"])
            for evidence_path in fixture["evidencePaths"]:
                self.assertTrue((TASK_DIR.parents[3] / evidence_path).exists(), evidence_path)
            for variant in fixture["variants"]:
                variant_count += 1
                with self.subTest(fixture=variant["fixtureId"]):
                    findings = semantic_audit.audit_semantic_integrity(variant["input"])
                    finding_classes = {finding["findingClass"] for finding in findings}
                    self.assertTrue(set(variant["expectedFindingClasses"]).issubset(finding_classes))
                    self.assertTrue(set(variant["forbiddenFindingClasses"]).isdisjoint(finding_classes))
        self.assertEqual({"I04", "I05", "I06", "I07", "I08"}, observed_families)
        self.assertEqual(8, variant_count)


if __name__ == "__main__":
    unittest.main()
