# Protocol Designer — Continuous Scientific Conversation Foundation

**Mission:** `CONV-UX-V2-01`

**Report version:** 1.0

**Date:** 2026-08-15

**Nature:** technical implementation report, non-normative, outside the governed documentary corpus

**Decision:** `CONV_UX_V2_PART1_READY_AWAITING_PUSH_AUTHORIZATION`

## Authorities

The implementation was checked against the current routing of `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, then against the NOXIA founding charter, Scientific Product Manifesto V2, Editorial Engine Architecture Manifesto, PD-003 V2, PD-004, PD-005, PD-009, the Scientific Interpretation contracts, QRY-001, PRJ-001, SYS-001B / Human Decision, UX-001, applicable DOC/TMP contracts, the V1 freeze, and production hotfixes `9ca000cc` and `2e50ff1b`.

No normative contradiction was found. This implementation introduces no PD-003 root, no scientific owner, no new QRY ranking, no protocol, and no scientific or PD-011 PASS. P-WEB-01 and the SOURCE-OF-TRUTH-INDEX remain unchanged: this report records an implementation and is not admitted by the documentary workflow.

## Initial architecture

The nominal path had two orchestration identities: Scientific Interpretation and the Guided / workspace session. Continuing reasoning could unmount the initial conversation. `WorkspaceNextActionInteraction` could build a free-response handoff, but the nominal Research Project parent did not close the callback loop. The transitional V1 projection could also map imaging and biological measurements into semantically incompatible fields.

The accepted target is one presentation conversation around existing owners. Conversation state stores only timeline and owner references; it never becomes scientific truth.

## Shell migration

`ConversationalProtocolDesignerShell` is now the nominal Standard shell. It keeps one `ConversationTimeline` mounted while owner surfaces are rendered inside that timeline. “Poursuivre le raisonnement” appends a phase event and changes the internal owner projection without selecting a second chat or a mutually exclusive workspace page.

The prior Guided surface remains readable for compatibility but is no longer the nominal Standard writer or nominal product path.

## Session migration

`ConversationalWorkspaceSession` version `CONVERSATIONAL-WORKSPACE-2.0` writes to `noxia-conversational-workspace-session-v2`. It contains:

- stable session and conversation identities;
- presentation timeline events and visible statuses;
- Contribution, Project and QRY references;
- pending handoff references;
- Standard/Expert and responsive presentation state;
- migration metadata.

It does not copy canonical hypotheses, population, design, modality, variables, or decisions. Existing Scientific Interpretation and Guided keys are read-only migration sources. Specialized owner sessions write their own V2 keys. Append and migration operations are idempotent so reload does not duplicate events.

## Understanding review

The timeline displays a structured “Voici ce que j’ai compris” card. Only populated sections are shown. Human presentation states are used instead of internal enums. The researcher can confirm, request a correction, or add information.

Confirmation records actor, time and Contribution reference as a working context. It explicitly keeps `projectWriteAuthorized: false` and does not create adopted Project truth. A correction is submitted as a new raw turn in the same conversation, interpreted as a new Contribution, and triggers explicit invalidation of dependent projections before reconstruction.

## Typed handoff

The V2 semantic handoff is built from the Contribution’s scientific elements, relations, provenance, unknowns, contradictions and correction references. It is explicitly non-authoritative and non-writing. The V1 projection remains available for migration and historical fallback, but it is not the sole source of the V2 workspace.

`ConversationalHandoffRouter` selects only an existing contractual owner. It does not decide the scientific result, adopt a Contribution, create a Human Decision, or write Project state.

## IRM / biology correction

The real colchicine case now keeps distinct typed elements for:

- colchicine as intervention;
- myocardial infarction as condition;
- cardiac MRI as imaging modality;
- inflammatory biological markers as biological measurements;
- lesion quantification as quantitative target;
- treatment versus placebo as the proposed comparison.

MRI and biology are not collapsed into `METHOD = "IRM / biologie"`. Conjunction does not create a comparison relation. The V1 compatibility reader now projects biological measurements to outcomes/measurements instead of an imaging method, and ignores inactive corrected relations in the current projection.

## Owner routing

Free QRY responses now carry `targetRef` and `answerOwner`. `ResearchProjectConstructionView` records the selected action, presentation, response and lifecycle event, resolves the contractual owner, and calls the nominal owner callback.

The executable Part 1 owner loop is complete for Research Project adaptive questions: the owner evaluates the response with the existing Project engine, rebuilds the candidate result when authorized, and returns version/digest references. Other recognized owners return an explicit partial state with a recovery instruction until their specialized executable callback is integrated; no generic UX owner was introduced.

## Feedback loop

The response corridor is:

`raw response → visible user event → pending feedback → Scientific Interpretation → typed Contribution → contractual owner → owner result → Project references when authorized → QRY refresh → same timeline`.

Pending, success, partial, failure and stale states all have visible text. A missing owner surface, missing orientation, stale project version, frozen candidate, or processing error produces explicit recovery instead of a silent click.

## QRY refresh

QRY selection and ranking code were not changed. After a successful owner result, a new QRY memory is built against the returned Project version and the existing product projection re-evaluates the next action. Both owner feedback and the QRY result are appended to the same conversation.

`QuestionPresentationRequest` now exposes `informationNeedRefs[]`; the transitional scalar reader remains and must be a member of the array. No composite question is fabricated in React.

## ProjectPanel

The permanent left panel is a read-only live projection. It shows only owner-derived Question, Hypotheses, Population, Design, Imaging, Variables / measurements, Analysis and Documents. Human labels replace internal states. Optional “Modifier” actions only prepare conversational context; the panel does not become a mega-form and has no Project write permission.

The desktop panel is sticky within ergonomic bounds. The conversation remains the primary mobile surface and a sticky button immediately reveals the Project projection without creating two narrow columns.

## Documents

Protocol, DMP and SAP states are derived only from actual TMP/DOC projections and their Project version/digest. In their absence, the panel reports that they are not yet generatable; it does not infer document readiness from the UI. Version mismatch is displayed as stale and requiring refresh.

## Expert integration

Standard and Expert consume the same owner and orchestration state. Expert adds Contribution identity, runtime, audit and provenance inspection, while the same continuation callback renders Knowledge, Scientific Thinking, Imaging, Research Project and Document owner projections.

## Reload

Reload restores the V2 conversation, Project reference/version/digest, QRY memory/action references and specialized owner sessions. Deterministic event identifiers and idempotent append/migration prevent duplicate messages or a second session. Legacy sessions are imported by read-only migration and do not become nominal writers.

## Tests

The blocking contracts `CONV-V2-C01` through `CONV-V2-C20` were created before implementation and initially failed because the V2 modules and callbacks did not exist. They now pass, together with:

- a composed colchicine corridor using actual Scientific Interpretation contracts, Project construction, Project owner rebuild and QRY selection;
- the real correction “L’IRM et la biologie sont complémentaires…”;
- previous Protocol Designer production hotfix tests;
- Scientific Interpretation, Protocol Designer, Knowledge, QRY, ST, IMG, PRJ, Human Decision, Adaptive Workspace, DAI, VAL and TMP/DOC suites.

Validation results at mission close:

- focused conversation and compatibility bundle: 94/94 passed;
- focused Knowledge and conversation safety bundle: 29/29 passed;
- global suite: 2,543/2,546 passed;
- the only three global failures are the pre-existing external Editorial Engine cleanliness guards in `scientific-knowledge-graph-web.test.mjs`, `scientific-corpus.test.mjs`, and `scientific-multidomain.test.mjs`;
- application, Scientific Interpretation API/server and TMP typechecks: passed;
- production build and ESM server check: passed;
- changed-files lint: passed with zero errors and zero warnings;
- `git diff --check`: passed.

The colchicine integration isolates a presentable adaptive Project question for the QRY interaction so the existing QRY algorithm can be exercised without changing its ranking. It is a deterministic composed product corridor, not a provider or browser qualification and not a PD-011 scientific validation.

## Limitations

- Only Research Project free-response processing is executable end to end in Part 1; other contractual owner routes are visible partial handoffs with recovery.
- The current UI embeds existing owner surfaces; progressive conversational summarization and proposal-first composition are not implemented.
- Conversation persistence remains local and single-user.
- The global suite remains red only because `/Users/charles/Documents/Projets/editorial-engine` contains pre-existing user changes. That external checkout was inspected read-only and not modified.
- Production build retains pre-existing non-blocking warnings for browsers-list age and large chunks.
- This mission proves the software corridor and deterministic contracts, not scientific validity, clinical suitability, deployment readiness, or publication eligibility.

## Deferred V2 capabilities

Proposal-first advanced reasoning, CHU and multicenter intelligence, new Reasoning Books, protocol ingestion, automatic complete protocol generation, learned QRY ranking, hard-coded scanner recommendations, vulnerable-population automation, statistical learning, billing and multi-user collaboration remain explicitly deferred.

The recommended next part is to make the specialized ST, IMG, Knowledge, Human Decision, Data Management, Biostatistics, Validation, TMP and DOC owner response callbacks executable through the same router, without changing the session or shell contract established here.
