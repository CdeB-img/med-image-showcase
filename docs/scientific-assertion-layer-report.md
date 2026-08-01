# Scientific Assertion Layer — Implementation Report

Date: 2026-07-31

Scope: Knowledge Graph model only

Data migration: not started

## Result

The Knowledge Graph now contains a first-class, versioned scientific assertion model. Existing entities and relations have not been altered. No publication, evidence, recommendation or scientific assertion has been invented.

The new write contract is:

1. entities represent stable concepts;
2. assertions represent contextual scientific propositions;
3. versioned sources take an explicit stance through evidence records;
4. structured syntheses expose current status, controversies, consensus, weaknesses, open questions, history and confidence.

## Previous model versus new model

| Previous model | Scientific assertion model |
| --- | --- |
| Scientific meaning inferred from direct entity relations | Scientific meaning carried by `ScientificAssertion` |
| Publication directly linked to concepts | Publication represented through a versioned source and `AssertionEvidence` |
| One flat evidence status on an entity or relation | Evidence level, confidence and stance recorded per source–assertion link |
| Context absent or implicit in descriptions | Eleven optional, validated context facets |
| Flat lists would lose manufacturer/version/sequence pairings | Explicit `ANY_OF` or `ALL_OF` context variants preserve each tuple |
| Contradiction not representable | Supporting and refuting evidence coexist and are reported |
| Global graph version copied to records | Assertion, source and evidence records each carry a version and lifecycle |
| No scientific synthesis contract | Narrative-free structured synthesis |

## Knowledge Graph impact

- The 118 existing entities remain stable concepts.
- The 93 existing relations remain unchanged pending migration.
- Seven versioned registries are added to the canonical registry surface.
- New scientific facts must use the assertion layer.
- Legacy direct scientific relations remain readable but are explicitly identified as migration candidates.
- No page, SEO surface, route, viewer, editorial model, deployment or publication workflow is changed.

## Current migration inventory

- Scientific assertions created: 0.
- Scientific sources created: 0.
- Assertion evidence records created: 0.
- Legacy relation candidates detected: 37.
- Direct Publication-to-concept candidates detected: 7.
- Existing Publication identities eligible for bibliographic source preparation: 9.

These counts are inventory only. They do not qualify any relation as scientifically true.

## Required migration

1. Separate structural, lexical and operational relations from scientific propositions.
2. Resolve and version authoritative provenance records.
3. Preserve eligible legacy relations as `DRAFT` and `UNASSESSED` assertion candidates.
4. Attach a source stance only after examining the source itself.
5. Add context and limitations before scientific activation.
6. Review contradictions instead of merging or suppressing them.
7. Migrate downstream consumers before deprecating direct scientific relations.

## Assertions that may be prepared automatically

Automation is limited to non-interpretive drafts:

- preserve the exact subject, predicate, object and repository provenance of a legacy relation as a draft migration candidate;
- prepare bibliographic source identities from explicit DOI, PMID, journal and year fields;
- prepare explicit lexical references as draft candidates.

Automatic preparation must retain `DRAFT`, `UNASSESSED` and no inferred evidence stance. It is not scientific validation.

## Assertions requiring scientific validation

- anatomical and clinical applicability;
- disease, population and indication scope;
- biomarker measurement and derivation;
- formulae, units, thresholds, uncertainty and interpretation;
- publication support, refutation or qualification;
- consensus and recommendation strength;
- protocol fallback, exception and contraindication rules;
- equipment, software, sequence, field-strength, option and licence compatibility.

## Validator coverage

The validator covers orphan assertions, absent sources, missing evidence links, invalid versions and dates, context reference families, incompatible contexts, mixed dependency cycles, contradictory evidence, opposite predicates and obsolete assertions.

Contradictions are diagnostics, not deletion or invalidation conditions. Missing provenance and forbidden cycles remain blocking errors.

## Test coverage

Synthetic, non-catalogue fixtures cover:

- multiple publications and evidence levels;
- multiple context facets;
- multiple manufacturers, software versions and sequences;
- supporting, refuting and consensus sources;
- opposite assertions in the same context;
- orphan assertions and missing sources;
- incompatible contexts;
- mixed dependency cycles;
- obsolete assertions retained in history;
- model-only migration boundaries.

## Verification results

- Scientific Assertion validator: valid, 0 errors, 0 warnings.
- Knowledge Graph validator: valid; the existing coverage gaps and the pending migration inventory remain explicit warnings.
- Test suite: 42 tests passed in 6 files.
- TypeScript validation: passed.
- Production build: passed, 1,793 modules transformed.
- Lint: 0 errors; 7 pre-existing Fast Refresh warnings in shared UI components.
- Protected pages, components, routes, SEO and editorial files: unchanged by this pass.

## Decision

ASSERTION LAYER VALIDATED — PASSER À LA MIGRATION
