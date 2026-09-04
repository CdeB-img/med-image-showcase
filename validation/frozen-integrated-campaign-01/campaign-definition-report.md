# FROZEN-INTEGRATED-CAMPAIGN-DEFINITION-01 — Definition Report

## Scope and baseline

The campaign definition targets runtime baseline `adea948aef0402d8f4bbf66324b0d59643e95bfd` on `protocol-designer-canonical-ingestion`. The definition mission changes no runtime, engine, owner, corpus, DOC-002, TMP-001, QRY, VAL, TRACE or UX file. It executes no integrated scenario and makes no provider call.

The runtime identity and campaign-definition identity are intentionally distinct. Before the definition commit, the latter remains `FROZEN_AT_COMMIT_PENDING`; the resulting commit SHA is reported externally after the one definition-only commit.

## Definition

- Campaign: `FROZEN-INTEGRATED-CAMPAIGN-01@1.0.0`
- Status: `FROZEN`
- Primary scenarios: A longitudinal multimodal imaging; B interventional analytic; C measurement validation; D multicenter harmonization.
- Optional stress scenario: E evolvable imaging master protocol; excluded from the mandatory gate.
- Product surface: Standard.
- Diagnostic surface: Expert/TRACE.
- Capture: `LEVEL_2_DIAGNOSTIC`.
- Gold answers: zero.
- User simulation: deterministic fact packets only; no LLM.

Each scenario separates known facts, unresolved decisions, known absences, withheld information and out-of-scope information. Each acceptance envelope expresses required observable behavior, acceptable scientific alternative families, forbidden inventions, ownership/evidence/human boundaries and documentary expectations. It does not freeze answer wording, owner order, QRY action IDs, number of questions or method choice.

## Frozen component identity

The manifest records native versions/digests when they exist and deterministic campaign-only composite SHA-256 digests otherwise. The composite algorithm hashes sorted `{path, sha256(raw bytes)}` records. The validator recomputes every component from the exact path/root selection stored in the manifest.

The Reference Knowledge index has no native version identifier; it is therefore labeled `UNVERSIONED_CURRENT_INDEX` and frozen by file digest. This is an explicit limitation, not a fabricated version.

Provider configuration readiness is `PARTIAL`: source code establishes routing, defaults, timeouts, output limits and the bounded extraction retry, but deployment environment model overrides and effective production network settings cannot be derived from the repository without invoking or inspecting the deployment. The later execution gate must bind the actual effective configuration once and prohibit changes between primary scenarios.

## Definition-only preflight

The following current checks were executed without running any campaign scenario or provider:

- Reference Corpus validator: PASS — 101 sources, 7 locally reproducible sources, 12 linked study sets, 38 linked artifacts, 5 platform trials, 4 source-ready platforms, 0 runtime-content-ready platforms.
- Owner Knowledge coverage validator: PASS — 11 owners, 72 needs, 101 sources, 12 linked study sets.
- DOC-002 reconciliation test: PASS.
- TMP generated-artifact currency check: PASS — 13 artifacts current.
- VAL current profile and QRY/TRACE/Project corridor focused qualification: PASS.
- Focused suites: 7 files, 154 tests passed, no failure.

The owner-coverage validator still emits the historical label `FIRST_RUNTIME_GAP=REGISTRY_NOT_RUNTIME_VISIBLE`. That label was not altered here. Its own validation completed PASS, while current runtime reachability is covered separately by the qualified pre-integrated owner-connection tests. This campaign definition does not rewrite either source of evidence.

## Budgets and stopping

The fixed per-scenario ceilings are 8 Standard exchanges, 12 QRY actions, 4 Knowledge actions, 12 domain-owner invocations and 24 external provider request starts, with no more than 8 retries and only under the existing bounded extraction-retry contract. These ceilings reflect the current maximum of one conversation request plus one extraction request and at most one deterministic-validation-triggered extraction retry per exchange. Local deterministic Reference Corpus lookups remain separately counted.

Primary scenarios continue independently after another scenario fails. Each stops at a blocking first divergence, planned terminal target, unresolved human-decision checkpoint or budget exhaustion. No repair occurs during the baseline pass.

## Adversarial review

Result: `PASS`.

1. An obviously poor answer cannot pass solely by naming expected topics: the envelopes also require preservation of uncertainty/provenance, coherent ownership, non-invention, Project fidelity, evidence limitations and human adoption.
2. Defensible alternatives remain admissible through explicit alternative families; no endpoint, design, modality hierarchy, statistical method, regulatory class, harmonization algorithm or platform architecture is prescribed.
3. Fact packets do not pre-answer unresolved decisions. Missing method parameters, dates, readers, equipment assumptions, legal context and decision criteria remain unknown.
4. Mandatory criteria are limited to material recognition/preservation, governance and safety boundaries. Stylistic detail and secondary alternatives are non-blocking.
5. Optional protected platform content and final specialized documents are not primary-gate requirements.
6. Acceptance describes behavior. No exact internal function, owner sequence, QRY action ID, wording, question count or algorithm is encoded.

## Qualification outcome

`FROZEN_INTEGRATED_CAMPAIGN_DEFINED`

This means the campaign definition is reproducible and integrity-checkable. It does not mean `SCIENTIFIC_PASS`, `PD011_PASS`, human product pass or `P1_COMPLETE`.
