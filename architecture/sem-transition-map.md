# SEM_DEPENDENCY_MAP

## SEM-TRANSITION-001 — carte de transition

| Champ | Valeur |
|---|---|
| Statut | `TRANSITION_MAP — NON_NORMATIVE — NON_ADMITTED` |
| Date d'observation | 2026-08-14 |
| Objet | préparer la clôture progressive de SEM Full sans supprimer les preuves |
| Remplacement produit autorisé | `NON` |
| Décision de clôture SEM | `DEFERRED_UNTIL_HYBRID_INTEGRATION` |

Cette carte distingue dépendance fonctionnelle, adaptateur aval, preuve historique et usage expérimental. Une occurrence textuelle de SEM n'est pas nécessairement une dépendance à migrer ; inversement, un champ `semanticModelRef` est une dépendance même sans appel provider.

## 1. Vue d'ensemble

```text
                             PRODUCT PATH — CURRENT V1

Conversation / UI
      |
      v
SemanticConversationalWorkspace
      |
      v
api/scientific-semantic.ts -> prompts -> provider
      |
      v
ScientificSemanticModel
      |\
      | +-> Knowledge verification embedded in legacy SEM
      |
      +-> semanticModelToValidatedIntent
      |       |
      |       +-> intake semanticSnapshot
      |       +-> Scientific Thinking semanticModelRef/digest
      |       +-> Imaging indirectly through ST
      |       +-> Research Project indirectly through intent/ST/Imaging
      |
      +-> semanticModelToScientificSessionContext
              |
              +-> Protocol Designer workspace/session

                         TARGET TRANSITION PATH

Conversation -> Structured Interpreter -> Candidate Scientific State
             -> Guards -> conditional Audit -> Human Decision Envelope
             -> V2 adoption adapter -> Research Project
```

## 2. Direct product/runtime dependencies

| Dependency ID | Location | Dependency | Current behavior | Transition disposition | Break if removed prematurely |
|---|---|---|---|---|---|
| `SEM-DIRECT-001` | `api/scientific-semantic.ts` | legacy server/provider pipeline | validates requests, calls reconstruction/critic flow and returns legacy model | replace behind a versioned interpreter boundary only after hybrid product contract | UI/API loses reconstruction endpoint; retry/error semantics change |
| `SEM-DIRECT-002` | `api/prompts/scientific-semantic-reconstruction-prompt.ts` | primary legacy prompt | defines output and scientific reconstruction behavior | preserve as historical evidence; new runtime owns separately digested prompt | campaign identities and reproducibility become ambiguous |
| `SEM-DIRECT-003` | `api/prompts/scientific-semantic-atomic-composition-prompt.ts` | composition prompt | supports legacy atomic composition | preserve; recycle only proven generic obligations | relation/composition behavior can regress silently |
| `SEM-DIRECT-004` | `src/features/scientific-semantic-reconstruction/SemanticConversationalWorkspace.tsx` | legacy workspace and `ScientificSemanticModel` | manages visible conversation, current model and open/resume actions | adapt UI to a runtime-neutral candidate/session contract | open/resume workflow, history and error display break |
| `SEM-DIRECT-005` | `src/pages/ProtocolDesignerDemo.tsx` | direct import of workspace, model and adapters | accepts a model then opens/resumes structured project flow | introduce a single compatibility facade, then remove direct type dependency | product entry to Protocol Designer breaks or bypasses review |
| `SEM-DIRECT-006` | `src/features/scientific-semantic-reconstruction/adapters.ts` | downstream conversion gate | only `ACCEPTED` legacy models become `ValidatedScientificIntent` and session context | replace with explicit Candidate -> human-reviewed V2 contribution adapters; preserve legacy facade during migration | status, route, relation, provenance and context losses |
| `SEM-DIRECT-007` | `src/features/scientific-semantic-reconstruction/knowledge.ts` | Knowledge request/verification inside SEM | derives context and mutates legacy semantic verification state | decouple into runtime-neutral Knowledge request/response; no Project adoption | Knowledge support can be lost or promoted incorrectly |
| `SEM-DIRECT-008` | `src/features/scientific-semantic-reconstruction/server.ts` and `provider.ts` | orchestration and provider | executes provider-specific legacy pipeline | archive after replacement; retain retry/error evidence | provider failures may be reclassified as semantic failures |
| `SEM-DIRECT-009` | `src/features/scientific-semantic-reconstruction/schema.ts`, `types.ts`, `canonical.ts` | legacy model identity | parses, canonicalises, versions and digests `ScientificSemanticModel` | freeze for compatibility; do not mutate into PD-003 V2 | historical digests and fixtures become invalid; false V2 claim |
| `SEM-DIRECT-010` | `src/features/scientific-semantic-reconstruction/session.ts` | legacy session/history | stores current and prior semantic models | migrate through explicit session projection preserving full history | resume loses corrections/rejected/superseded elements |
| `SEM-DIRECT-011` | `src/features/scientific-semantic-reconstruction/coverage.ts`, `relation-ownership.ts`, `competence.ts` | deterministic logic/evaluator | evaluates coverage, ownership and legacy benchmark obligations | classify each rule: recycle to Audit-D, preserve as evaluator, or archive | business behavior may be copied into wrong owner or overfit retained |
| `SEM-DIRECT-012` | `src/features/scientific-semantic-reconstruction/client.ts` | browser-to-server transport | sends the conversation request and exposes provider/server failures to the workspace | replace behind the same runtime-neutral client boundary with explicit version/error identity | UI transport and error recovery break or provider details leak into business state |
| `SEM-DIRECT-013` | `src/features/scientific-semantic-reconstruction/atomic-composition.ts` | deterministic legacy composition | composes fragments and relations before/around canonical state construction | audit generic invariants for recycling; otherwise freeze with SEM legacy | composite relations, targets or polarities regress during runtime replacement |
| `SEM-DIRECT-014` | `src/features/scientific-semantic-reconstruction/index.ts` | public module facade | exports legacy types, adapters and runtime entry points to consumers | maintain a bounded compatibility facade until every import is migrated | hidden consumer imports bypass the new Human Decision/V2 boundary |

## 3. Indirect product consumers

| Dependency ID | Consumer | Existing dependency | Nature | Required transition |
|---|---|---|---|---|
| `SEM-INDIRECT-001` | Protocol Designer intake | `semanticSnapshot` with model ID, digest, provider/model/prompt/schema identities | traceability plus replay identity | generalize to source runtime/candidate identity without erasing legacy fields |
| `SEM-INDIRECT-002` | Scientific Thinking input | `semanticModelRef` and digest carried by `ValidatedScientificIntent` | provenance/reference, not direct execution | accept a versioned scientific-context contribution and retain source lineage |
| `SEM-INDIRECT-003` | Scientific Thinking runtime | populations, interventions, outcomes, concepts and relations projected by SEM adapter | V1 semantic shape | map to candidates/ScientificModel inputs; no automatic V2 object creation |
| `SEM-INDIRECT-004` | Imaging | receives ST/Project V1 objects ultimately seeded by semantic intent | transitive content dependency | consume Project/OBS handoffs rather than Semantic Model categories |
| `SEM-INDIRECT-005` | Research Project | receives validated intent, ST and Imaging outputs, not raw SEM directly | transitive adoption risk | accept only Human Decision + governed V2 mapping; Project remains owner |
| `SEM-INDIRECT-006` | Adaptive workspace | current route, session context, model status and resume state | UI/runtime coupling | project runtime-neutral state and findings; UI must not infer adoption |
| `SEM-INDIRECT-007` | Knowledge | semantic route and element types select request/consumer | routing/content coupling | request Knowledge from explicit uncertainty/evidence needs, independent of SEM enum |
| `SEM-INDIRECT-008` | system integration tests | assumed path SEM -> intake -> ST -> Imaging -> Project | contract evidence | add hybrid path tests without deleting legacy assertions until cutover |

Document Projection, Template Engine, Regulatory and VAL have no observed direct import of `ScientificSemanticModel`. They consume Project/domain artefacts or their own contracts. They remain vulnerable to semantic loss upstream, but they are not direct SEM migration targets.

## 4. Experimental dependencies

| Dependency ID | Location | Use | Disposition |
|---|---|---|---|
| `SEM-EXP-001` | `experiments/semantic-engine-comparison/baselines/sem_current.ts` | frozen SEM comparative baseline | preserve exact identity and manifest; never repoint silently |
| `SEM-EXP-002` | `experiments/semantic-engine-comparison/common_contract_ablation_02/sem_pair_runner.ts` | SEM Full/Single paired ablation | preserve as experimental evidence; extract only generic findings with separate proof |
| `SEM-EXP-003` | `experiments/semantic-engine-comparison/interactive_overnight/sem_runner.ts` | interactive legacy runner | preserve; do not treat interactive evidence as product qualification |
| `SEM-EXP-004` | `experiments/engine-lab/tasks/semantic-audit/` | deterministic SEM-AUDIT prototype | strengthen toward a product-neutral finding contract after governance |
| `SEM-EXP-005` | `experiments/engine-lab/tasks/hybrid-runtime-prototype/` | Candidate State, interpreter, guards, Audit-L and adjudication | source of candidate architecture only; no product import before admission |
| `SEM-EXP-006` | `experiments/engine-lab/results/hybrid-runtime-prototype-01/` | frozen raw evidence and results | preserve immutable; 11 adjudicator failures remain visible |

## 5. Historical and qualification surfaces

| Surface | Examples | Required treatment |
|---|---|---|
| local unit/contract tests | `src/features/scientific-semantic-reconstruction/__tests__/` | preserve as legacy non-regression; label which obligations remain runtime-independent |
| manual campaign runners | `src/features/scientific-semantic-reconstruction/manual/` | preserve exact configurations/digests; never mix with hybrid evidence |
| historical benchmark fixtures | `competence-fixtures.ts` and legacy Development/Holdout material referenced by campaigns | retain as exposed non-regression, not future blind competence proof |
| campaign artefacts | `semantic-validation/sem-001r*/` | immutable evidence; no deletion or retroactive rewrite |
| reports | `docs/sem-*.md` | historical snapshots; not current normative principles unless separately admitted |
| package scripts | semantic tests and manual campaign commands in `package.json` | keep until closure; rename/deprecate only with explicit migration plan |

## 6. Semantic Model historical contract dependencies

The following properties must be handled explicitly during migration even when their target representation changes:

| Legacy concern | Current use | Target boundary | Non-loss rule |
|---|---|---|---|
| model identity and digest | snapshot, replay, test evidence | runtime/candidate identity plus source digest | keep legacy identity alongside new identity during compatibility window |
| provider/model/prompt/schema identity | traceability and campaign reproducibility | raw-output record and runtime manifest | never substitute a new digest under an old label |
| element epistemic status | active/rejected/confirmed selection | Candidate State and V2 contribution envelope | candidate, inferred, rejected and adopted remain distinct |
| source spans/provenance | reconstruction and downstream trace | exact raw/source references | no element without reconstructible source class |
| relations and relation ownership | semantic graph and evaluator | Candidate relations plus specialized V2 mappings | do not flatten into lists or infer causality |
| corrections/history | session evolution | versioned candidate history and decision reopening | no silent deletion or overwrite |
| unknowns/ambiguities | clarification and safety | QRY inputs and Human Decision views | no empty/default replacement |
| route proposal | workspace branching | QRY/Project workflow projection | runtime may propose; owner decides |
| Knowledge verification | semantic support | independent KnowledgeResult linkage | support never becomes user statement or Project adoption |
| ACCEPTED status | downstream adapter gate | Human Decision Envelope plus mapping readiness | legacy accepted is not equivalent to Project adopted |

## 7. Current Candidate State consumers

As of the observed repository state, `CandidateScientificState` is consumed only inside Engine Lab:

- deterministic adapter and guards;
- Audit-L;
- trigger selection;
- adjudication/consolidation;
- reporting and experimental expectation checks;
- prototype tests and schemas.

No product UI, Product Designer intake, Scientific Thinking, Imaging, Research Project, Knowledge, OBS, VAL, Document Projection or QRY runtime consumes it. A product integration mission must therefore add a governed boundary rather than simply replace a type import.

## 8. Potential rupture register

| Rupture | First affected stage | Impact | Required prevention |
|---|---|---|---|
| `ACCEPTED` legacy treated as human adoption | Candidate -> Project | unauthorized Project truth | explicit Human Decision Envelope and actor/mandate validation |
| relation arrays flattened into intake lists | adapter | loss of comparison, timing, causal/polarity semantics | relation-preserving contribution contract |
| legacy type enum mapped one-to-one to V2 | V1/V2 adapter | conceptual collapse | explicit split, unmapped/ambiguous status and domain owner review |
| model digest replaced by candidate digest | persistence/resume | unreconstructible history | dual identity and mapping record |
| prior rejected/superseded elements omitted | session migration | false current state and repeated questions | full versioned history migration |
| raw native output not retained | interpreter | audit/provenance impossible | persistence gate before parsing |
| Knowledge verification removed with SEM | support layer | lost evidence/contradictions | independent Knowledge request interface |
| route proposal removed without QRY | workspace | broken progression | compatibility router until QRY qualified |
| ST assumes `semanticModelRef` | ST input | type and provenance break | runtime-neutral source reference with legacy compatibility |
| hybrid audit findings treated as VAL result | validation | ownership and PASS confusion | distinct contracts and cross-reference only |
| product code imports Engine Lab package | integration | experimental contract becomes de facto norm | product contract admission and explicit adapter first |
| tests rewritten to new JSON topology | qualification | false regression/overfitting signal | evaluate obligations and critical invariants, preserve old fixtures |

## 9. SEM-TRANSITION-001 phases

### `S0 — LEGACY_FREEZE`

- preserve current SEM code, 305-test evidence, prompts, fixtures, reports and campaign artefacts;
- record direct and indirect consumers;
- forbid changes made only to improve exposed historical cases.

Exit: dependency inventory accepted and legacy identity reproducible.

### `S1 — HYBRID_PRODUCT_CONTRACT`

- derive an admitted product contract from the experimental Candidate State without copying Engine Lab status;
- define raw retention, errors, versioning, provenance, relation ownership and audit findings;
- keep PydanticAI/provider choices runtime-specific, outside the scientific contract.

Exit: contract authority and migration owner decided.

### `S2 — V2_CONTRIBUTION_ADAPTER`

- map candidate content to PD-003 V2 contribution envelopes;
- route measurement concepts through OBS and scientific models through Scientific Thinking/Project review;
- represent ambiguous/unmapped concepts explicitly;
- implement Human Decision Envelope before Project mutation.

Exit: no automatic adoption and complete provenance through the handoff.

### `S3 — SHADOW_INTEGRATION`

- run legacy and hybrid paths on authorized visible/non-regression material;
- compare scientific obligations rather than exact JSON;
- keep Project writes disabled;
- validate session/resume, Knowledge requests, route compatibility and audit traces.

Exit: all critical consumers can read the compatibility facade without loss.

### `S4 — CONTROLLED_PROJECT_HANDOFF`

- enable only explicitly authorized Human Decision -> Project V2 writes;
- test adopt/reject/defer/reopen and mapping failures;
- preserve legacy rollback and dual trace identities.

Exit: Project remains unique source owner under success and failure paths.

### `S5 — QUALIFICATION`

- execute the precommitted PD-011 protocol on independent material;
- qualify interpreter, guards, conditional audit, evaluator, robustness and provider failure separation;
- verify all downstream contracts and VAL handoffs.

Exit: formal evidence supports or rejects replacement.

### `S6 — CLOSURE_DECISION`

- human governance decides cutover, compatibility duration and rollback;
- remove SEM Full from the nominal runtime only if every closure gate passes;
- retain all historical artefacts permanently under archive/non-regression status.

Exit: explicit decision; no automatic closure from a successful prototype.

## 10. Recycled, preserved and archived value

| Disposition | Content |
|---|---|
| recycle | generic deterministic guards, relation ownership checks, raw retention, provider error separation, checkpoint/digest discipline, conditional second-pass evidence |
| preserve unchanged | historical prompts, schemas, tests, fixtures, reports, raw outputs, campaign manifests and results |
| adapt | model/session identity, downstream intent/context, Knowledge requests, UI routing and provenance references |
| archive after gates | SEM Full nominal orchestration, systematic critic topology and legacy-only downstream API |
| do not transfer | case-specific benchmark repairs, implicit V1-to-V2 conversions, any claim that SEM owns scientific truth |

## 11. Relation to VAL and Hybrid Runtime

```text
Hybrid Runtime produces candidate + traces
        |
        +-> SEM-AUDIT-D/L produces findings about interpretation
        |
        +-> Human Decision governs disposition/adoption
        |
        +-> V2 adapter and Project produce versioned artefacts
                         |
                         +-> VAL compares boundaries and invariants
```

- Audit answers: « quelle dérive potentielle existe dans cette interprétation candidate ? »
- VAL answers: « quelles propriétés et décisions ont été préservées entre ces artefacts sous le protocole applicable ? »
- PD-011 answers: « quelle décision d'évaluation est justifiée par le protocole, les métriques et les seuils préengagés ? »

No layer may answer on behalf of another.

## 12. Closure gates

SEM Full cannot be closed until all are true:

- hybrid product contract admitted;
- Candidate -> V2 contribution adapter validated;
- Human Decision Envelope enforced before Project write;
- direct product dependencies removed or bounded by a tested compatibility facade;
- Knowledge, ST, Imaging, Project and workspace traces preserved;
- conditional audit policy qualified;
- VAL boundary tests available;
- independent PD-011 evidence supports cutover;
- rollback and archive plan verified;
- final human closure decision recorded.

Until then the disposition is `ARCHIVE_PREPARED_NOT_CLOSED`.
