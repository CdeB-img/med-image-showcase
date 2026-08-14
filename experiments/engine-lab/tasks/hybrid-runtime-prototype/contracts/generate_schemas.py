from __future__ import annotations

import json
from pathlib import Path

from models import (
    AdjudicationOutput,
    AuditFinding,
    CandidateScientificState,
    ConsolidatedCandidateState,
    PrimaryScientificInterpretation,
    SemanticAuditLBatch,
)


ROOT = Path(__file__).resolve().parent


def main() -> None:
    schemas = {
        "hybrid-candidate-scientific-state.schema.json": CandidateScientificState,
        "primary-scientific-interpretation.schema.json": PrimaryScientificInterpretation,
        "hybrid-audit-finding.schema.json": AuditFinding,
        "semantic-audit-l-batch.schema.json": SemanticAuditLBatch,
        "semantic-adjudication-output.schema.json": AdjudicationOutput,
        "consolidated-candidate-state.schema.json": ConsolidatedCandidateState,
    }
    for filename, model in schemas.items():
        path = ROOT / filename
        path.write_text(
            json.dumps(model.model_json_schema(), ensure_ascii=False, sort_keys=True, indent=2) + "\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
