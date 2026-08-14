# HYBRID-RUNTIME-PROTOTYPE-01

Status: `PRODUCT_CANDIDATE`, `NON_NORMATIVE`, `VISIBLE`, `REVERSIBLE`.

This isolated Engine Lab task evaluates a guarded scientific interpretation
pipeline without writing to a NOXIA Research Project:

1. `PYDANTIC_AI_DIRECT` creates one candidate state from the visible conversation.
2. the existing non-mutating `SEM_AUDIT_D` runs on every state;
3. a SEM Single prompted second reader emits findings only when generic risk or
   campaign-final triggers require it;
4. a typed Pydantic adjudicator runs only when unresolved semantic risk requires
   a bounded resolution;
5. the result remains a `CONSOLIDATED_CANDIDATE_STATE` with open decisions and
   clarification needs. It never becomes Project truth.

The four ablations share the same primary output. QRY is a downstream boundary
only and is not implemented here. The prototype does not load Knowledge or the
document corpus, does not access a blind set, and does not modify legacy SEM.

## Local commands

```text
experiments/.venv/bin/python experiments/engine-lab/tasks/hybrid-runtime-prototype/run_campaign.py freeze
experiments/.venv/bin/python experiments/engine-lab/tasks/hybrid-runtime-prototype/run_campaign.py run
experiments/.venv/bin/python experiments/engine-lab/tasks/hybrid-runtime-prototype/run_campaign.py report
experiments/.venv/bin/python experiments/engine-lab/tasks/hybrid-runtime-prototype/run_campaign.py validate
```

`freeze` creates the append-only ledger and records the exact maximum request
plan before the first provider call. `run` resumes only missing checkpoints and
never replays a terminal provider operation.
