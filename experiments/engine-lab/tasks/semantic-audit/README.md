# SEM-AUDIT — Semantic Integrity Auditor

Status: `EXPERIMENTAL_PROTOTYPE`  
Product integration: `NO`  
Normative authority: `NONE`

SEM-AUDIT reads an original conversation, a previous scientific state, a candidate state, confirmed decisions and an optional explicitly supplied Knowledge state. It returns only `findings[]`. It never returns a replacement state, rewrites the candidate, adopts a Project decision or decides for the researcher.

## Input contract

The deterministic prototype accepts a JSON-compatible object with:

- `conversationTurns[]`: exact `{turnId, text}` records;
- `previousState`: items, relations, ambiguities and clarifications before reconstruction;
- `candidateState`: the proposed items, relations, ambiguities, clarifications and corrections;
- `confirmedDecisionIds[]`: decisions already confirmed by their authorized owner;
- optional `knowledgeState`: explicitly supplied Knowledge only;
- `constraints[]`: explicit polarity, causality or availability constraints;
- `rawProviderOutput.persisted`: whether the native provider output was stored before parsing or validation.

Items and relations retain source turns and exact source text when they claim explicit provenance. Adoption, ownership, availability and lifecycle are orthogonal fields; a confidence value can never substitute for a decision.

## Output contract

`audit_semantic_integrity(input) -> findings[]`

Every finding conforms to `contracts/semantic-audit-finding.schema.json`, has a stable content-derived identifier and sets `autoFixAllowed` to `false`. `RAW_OUTPUT_NOT_PERSISTED` is a technical evidence finding, not a scientific-understanding failure.

## Layers

### SEM-AUDIT-D

Implemented here. It applies deterministic, scenario-independent guards for promotion, ownership, relations, provenance, polarity, conceptual planes, corrections, historical state, clarification history and raw-output persistence.

### SEM-AUDIT-L

Contract only in this mission (`sem-audit-l-contract.json`). A future second reader may use SEM Single or another typed runtime, but it must remain non-mutating, cite candidate/source evidence, return the same finding contract and run only when explicitly authorized. It is not qualified and makes no provider call here.

## Evidence fixtures

Fixtures are hand-authored, minimal state projections derived from already persisted I04–I08 evidence under `experiments/semantic-engine-comparison/results/common-contract-ablation-02/`. They are visible non-Blind regression evidence, not new Golds and not PD-011 proof. No model is replayed.

The core contains no scenario identifier or domain-specific lexical rule. Scenario labels exist only in fixture metadata and tests.
