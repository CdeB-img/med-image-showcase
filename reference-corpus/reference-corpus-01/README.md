# REFERENCE-CORPUS-01 — governed reference seed

Status: `NON_NORMATIVE_REFERENCE_REGISTRY / NOT_RUNTIME_WIRED`

This directory records external reference material and existing NOXIA documentary assets for later owner-specific coverage analysis. It does not admit external material as NOXIA authority, extract executable rules, or modify any scientific owner.

## Reuse-first boundary

- `regulatory-funding-corpus/reg-000` supplies the existing temporal, jurisdiction and applicability conventions.
- `documentary-pattern-corpus/doc-002/documentary-source-catalog.json` supplies the existing digest/provenance boundary and the `EVIDENCE_ONLY_NOT_AUTHORITY` principle.
- `src/features/knowledge-engine` remains an untouched runtime consumer boundary.
- This directory is the minimal missing, documentary-only source registry: the existing stores do not jointly cover raw external source identity, licence/storage status, linked-study lineage, search decisions and corpus gaps.

## Files

- `reference-corpus.json`: accepted external sources and local-copy metadata.
- `reference-corpus.schema.json`: required metadata contract.
- `linked-study-sets.json`: verified same-study artifact relationships.
- `existing-noxia-assets.json`: pointers to existing assets; no duplication or authority change.
- `search-log.json`: discovery routes and dispositions.
- `rejection-log.json`: rejected and deferred candidates with reasons.
- `gap-matrix.json`: coverage by the 15 required domains.
- `validate.mjs`: read-only documentary integrity checks.
- `sources/fda/`: five unaltered FDA PDFs whose local storage and redistribution are supported by the FDA website policy; logos and marks are not separately licensed.

## Epistemic boundary

`OWNER_RELEVANCE` means potentially useful to an existing owner. It never means owned by, adopted by, or executable by that owner. `RETRIEVAL_QUALITY_TIER` describes source/retrieval quality, not scientific validity. Applicability is recorded on four separate axes and is never collapsed into a score.

The next mission is `OWNER_KNOWLEDGE_COVERAGE_01`; no runtime use is authorized here.
