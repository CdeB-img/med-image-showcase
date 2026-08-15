# Protocol Designer — Active Interaction and Semantic Projection Hotfix

**Mission:** `CONV-UX-V2-01B`

**Report version:** 1.0

**Date:** 2026-08-15

**Nature:** non-normative Level 3 implementation report; not admitted into the governed documentary corpus

**Decision:** `CONV_UX_V2_PART1B_FIXED_READY_FOR_PRODUCTION_ACCEPTANCE`

## ROOT CAUSE ACTIVE INTERACTION

`ConversationalWorkspaceSession` did not identify the single interaction that owned the next free response. The global composer therefore submitted route answers through the generic Scientific Interpretation path. QRY free text also remained embedded in a separate local control. The response text could be heuristically mistaken for a correction because owner and expected-response semantics were not reconstructible at submission time.

The session now persists one `currentInteractionRef` and one serializable `ActiveConversationInteraction`. It carries the source action, contractual owner, purpose, expected response kind, targets, information needs, Project version/digest and presentation context. Activating another free-response request replaces the prior active interaction. QRY Standard free text registers with the same global composer; specialized option and Human Decision controls remain specialized.

## ROUTE INTENT TRACE

The primary hybrid runtime previously produced no route field: the output contract omitted `routeProposal`, and `hybrid-adapter.ts` explicitly projected it to `null`. Consequently even an explicit study-construction statement could not reach the existing `RoutingIntent` contract.

The hybrid contract now emits a structured `routeProposal`. The prompt uses the complete structured conversation and recognizes DESIGN only for an explicit construction request or an active structured statement explicitly encoding study creation. A ROUTE_INTENT response is tagged in the transport. The runtime interaction boundary retains the previous scientific objects, unknowns, audit and decision boundary while accepting only the new route proposal, so “modèle d’étude à créer” cannot become a scientific unknown.

`RouteIntentResolver` maps that proposal to the existing `UNDERSTAND`, `FORMALIZE_IDEA`, `DESIGN_STUDY` or `DOCUMENT` route. It never writes Project truth. A resolved DESIGN route closes the gate, reports “D’accord. Nous allons construire l’étude à partir de cette question.” and opens the next existing owner surface. A null or unsupported proposal remains an explicit contextual clarification, not a silent loop.

## COMPOSER CONTEXT

The composer placeholder is derived from the active contract:

- scientific correction: “Corrige ou précise ce que j’ai compris…”;
- route intent: “Dis-moi ce que tu veux construire ou approfondir…”;
- QRY free response: normal free response attached to the QRY presentation and Project version;
- owner modification: “Indique ce que tu veux modifier…”.

The former lexical correction detector and prefixed draft strings were removed. Microcopy reflects orchestration state and does not select an owner.

## IRM/BIOLOGY PROJECTION TRACE

The first faulty projection was the generic hybrid `METHOD` compatibility rule. Both the typed conversational handoff and the V1 compatibility projection promoted every generic `METHOD` to an imaging method. A composite provider candidate such as “IRM / biologie” therefore entered `availableEquipment`, ProjectPanel Imaging and downstream Scientific Thinking inputs despite explicit typed MRI and biological-measurement objects already being present.

Only explicit `IMAGING_MODALITY` or `IMAGING_METHOD` values now reach imaging for the hybrid runtime. A generic hybrid `METHOD` remains an `UNCLASSIFIED_CANDIDATE` with an explicit V1 projection loss. The legacy `LEGACY_SEM_FULL` compatibility behavior is preserved only for its existing transitional contract. ProjectPanel consequently exposes MRI under Imaging and biological/quantitative targets under Variables / measurements.

## QRY COMPARISON TRACE

QRY did not invent the sentence itself. Its source InformationNeed came from Scientific Thinking after V1 `availableEquipment` contained both “IRM” and “IRM / biologie”. The methodological detector then saw more than one method and the unrelated treatment comparison “médicaments vs placebo” in the original expression, which activated the existing method-comparison question. QRY merely presented that owner output.

The correction is upstream: generic hybrid METHOD no longer enters imaging, and Scientific Thinking deduplicates a textual method alias such as “IRM” when the structured method “IRM cardiaque” already represents it. No QRY ranking, R04 presentation fallback or fixture-specific colchicine rule was changed.

## RESET

The old conversation reset cleared Scientific Interpretation and conversation state but did not necessarily clear the parent Protocol Designer session, Project construction state, document projections, Knowledge snapshots or the legacy semantic session. Parent state could therefore repopulate a visibly “reset” child after render or reload.

The reset now removes all current and legacy persistence keys for the conversation, Scientific Interpretation, semantic workspace, Guided/Protocol Designer owners and Knowledge snapshots. It also resets the parent session, Project candidate, document projections, review/correction state and Knowledge UI state in memory. The child explicitly calls the parent reset, and the parent uses the same complete persistence reset helper. The operation is idempotent.

## FILES CHANGED

- active interaction contract, context controller, session lifecycle and complete reset helper;
- Scientific Interpretation request contract, transport, hybrid schema/adapter/runtime boundary and workspace orchestration;
- route resolver and Protocol Designer page continuation;
- QRY Standard composer registration and Research Project digest binding;
- typed semantic handoff, V1 compatibility and Scientific Thinking method deduplication;
- production, contract, reset, reload and exact colchicine regression tests.

No normative document, QRY ranking, new scientific owner, Project direct-write path, protocol, Knowledge corpus, deployment configuration or public content was changed.

## TESTS

`CONV-V2B-C01` through `CONV-V2B-C15` pass. Previous CONV V2 Part 1, Scientific Interpretation, Protocol Designer production hotfix, QRY/Adaptive Workspace and Scientific Thinking focused suites pass. The expanded focused scientific/conversational bundle passes 336/336 tests.

## COLCHICINE E2E

The deterministic exact-case fixture contains colchicine, myocardial infarction, placebo, inflammatory and blood biomarkers, cardiac MRI, infarct-size measurement, multicenter study creation and the lossy generic METHOD candidate observed in production. Its route response is bound to ROUTE_INTENT, resolves DESIGN, returns the required feedback, closes the orientation gate and renders the next owner surface. The route utterance is absent from scientific unknowns and cannot be classified as a correction.

Understanding review and ProjectPanel show `IRM cardiaque` separately from inflammatory markers, blood biomarkers and infarct-size measurement. The active typed handoff has no MRI-versus-biology relation. Scientific Thinking receives one MRI method and does not produce the observed comparison question. This is deterministic product-corridor evidence, not a live provider or PD-011 scientific qualification.

## RELOAD

Reload restores a completed interaction with no active route gate and preserves the separated semantic projection. Full reset removes all eight current/legacy persistence keys exercised by the regression test, and both child and parent in-memory state return to a new empty workspace.

## GLOBAL TESTS

The global suite reports 2,560/2,563 passing. The only three failures are the same pre-existing external Editorial Engine cleanliness guards in:

- `scientific-knowledge-graph-web.test.mjs`;
- `scientific-corpus.test.mjs`;
- `scientific-multidomain.test.mjs`.

They are caused by the already-dirty external checkout `/Users/charles/Documents/Projets/editorial-engine`. It was inspected read-only and was not modified by this mission.

## TYPECHECK

Application typecheck, Scientific Interpretation API typecheck and Scientific Interpretation server typecheck pass.

## BUILD

Production build passes. The ESM server check reports 17 static runtime modules, zero runtime aliases, zero extensionless relative imports and `NODE_ESM_HANDLER_LOAD=PASS`. Existing non-blocking Browserslist, Rollup annotation and large-chunk warnings remain.

## LINT

Changed-files lint passes with zero errors and zero warnings.

## DIFF CHECK

`git diff --check` passes.

## COMMITS

The implementation is separated into atomic commits for active-interaction routing/reset, semantic projection correction, and regression evidence/reporting. Exact hashes are reported in the final mission handoff.

## PUSH STATUS

No push and no deployment were performed.

## DECISION

`CONV_UX_V2_PART1B_FIXED_READY_FOR_PRODUCTION_ACCEPTANCE`
