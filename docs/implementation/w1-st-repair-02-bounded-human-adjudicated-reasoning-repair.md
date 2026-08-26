# W1-ST-REPAIR-02 — Bounded Human-Adjudicated Scientific Thinking Repair

| Field | Value |
|---|---|
| Classification | `LEVEL_3_IMPLEMENTATION_EVIDENCE` |
| Normative | `NO` |
| Branch | `protocol-designer-canonical-ingestion` |
| Initial HEAD | `62eff65ec8880772c6ced61db910f2e1dbc381f8` |
| Initial ST version | `1.2.1` |
| Repaired ST version | `1.2.2` |
| Decision | `W1_ST_REPAIR_02_COMPLETED_READY_FOR_FRESH_HUMAN_RECHARACTERIZATION` |

This report records a bounded deterministic repair of five defect classes already adjudicated by a human in W1-QUAL-01H2. It does not create a scientific capability, re-adjudicate Campaign D, establish a Scientific PASS, qualify ST under PD-011, characterize the assembled loop, complete Wave 1 or authorize Wave 2.

## Authorities and evidence hierarchy

Authorities were consulted in the required order: `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`; the NOXIA Founding Charter; the Protocol Designer Scientific Product Manifesto V2; the Editorial Engine Architecture Manifesto; and `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md`. The specialized authorities needed for this bounded repair were PD-003 V2 Research Object Model and Ownership Matrix, SEM-002, RDE-001, RDE-002 and KE-001. H1, H1T and H2 artifacts were used only as Level 3 implementation evidence.

No documentary or normative incompatibility requiring arbitration was found. The existing `ScientificThinkingOutput` contract already represents an honest stop through `status = REFUSED`, an explicit refusal reason and restart condition, and `proposedNextAction = STOP`; no normative schema extension was required.

## Baseline and boundary

The preflight matched the required branch and initial HEAD. `main` and `origin/main` remained at `9be06edca1a7500ab7a43d065e94241e91d67bec`. The tracked worktree was initially clean and the 53 known historical untracked artifacts were preserved.

The repair is limited to Scientific Thinking input projection and deterministic candidate/refusal construction. It performs no Project write, adoption, owner selection, orchestration, corpus enrichment, LLM mediation, network call, OBS implementation, Wave 2 work or scientific adjudication.

## Root causes and first divergence

| Human defect class | First divergent stage | Root cause | Repair boundary |
|---|---|---|---|
| `MECHANISTIC_REASONING_NOT_MATERIALIZED` | `SCIENTIFIC_THINKING_ENGINE` | Exact governed Knowledge statements were not available as structured reasoning inputs and the engine always emitted a generic mechanism. | Project exact read-only statements with refs and ownership, then materialize them as pending mechanism candidates when the request is mechanistic. |
| `NAMED_ALTERNATIVES_FLATTENED_TO_GENERIC_COMPETING_BRANCH` | `SCIENTIFIC_THINKING_ENGINE` | Hypothesis construction emitted the same generic competing branch independently of named evidence. | Keep multiple exact statements or explicit conflicting clauses as distinct pending alternatives; use the generic branch only when no named branch exists. |
| `KNOWLEDGE_CONTRADICTION_NOT_MATERIALIZED_AS_COMPETING_HYPOTHESES` | `SCIENTIFIC_THINKING_ENGINE` | Conflict metadata survived but did not participate in branch construction. | Retain conflict structures and expose incompatible exact statements as candidate alternatives without selecting a winner. |
| `STRUCTURING_PROJECT_UNKNOWN_NOT_GOVERNING_REASONING_BRANCH` | `OWNER_REQUEST_BUILDING` | The request reduced the exact Project unknown to a marker without content/type/ref. | Project the exact unknown read-only and make only explicitly impact-qualified Project unknowns produce a blocking clarification. |
| `OUT_OF_OWNERSHIP_QUESTION_NOT_REFUSED_OR_ESCALATED` | `SCIENTIFIC_THINKING_ENGINE` | Structured Knowledge gaps did not carry enough owner-boundary semantics into refusal classification. | Retain gap explanation/restart condition and stop on generic specialized-owner/authority signals using the existing refusal contract. |

The complete pre-repair attribution is in `validation/w1-st-repair-02/root-cause-map.json`, which was frozen before the runtime was changed.

## Repair

ST `1.2.2` adds read-only structures for exact Project unknowns and exact Knowledge reasoning statements, controversies and gaps. Each Knowledge statement retains its original text, status, applicability, limitations, evidence/source references and explicit `owner = KNOWLEDGE`, with `ownershipTransferred = false`.

The engine now:

- materializes exact Knowledge statements as pending mechanisms for mechanistic requests;
- retains multiple named or conflicting statements as separate pending alternative hypotheses;
- never chooses a contradiction winner or promotes Knowledge evidence;
- asks a blocking clarification only when a Project unknown is paired with an explicit impact signal;
- returns the existing fail-closed refusal shape for a generic specialized-owner/authority requirement;
- preserves the generic competing branch only when no named branch is available.

No Campaign identifier, exposed-case identifier or case-specific medical vocabulary was added to the repaired runtime. The product ST runtime entrypoint is byte-identical before and after the repair.

## Fresh development probes

Twelve fresh `DEVELOPMENT_ONLY_NON_QUALIFYING` probes were frozen before repair across unrelated scientific domains: two for each defect class plus two negative controls. They reuse no Campaign A/B/C/D case and no historical ST fixture.

| Observation | PASS | FAIL |
|---|---:|---:|
| Pre-repair ST `1.2.1` | 2 | 10 |
| Post-repair ST `1.2.2` | 12 | 0 |
| Representative deterministic replays, one per repaired class | 5 | 0 |

The final development test file contains 13 tests: 12 probe obligations and one five-class deterministic replay test; all 13 pass. These are development-contract checks, not a scientific benchmark or human characterization.

## Exposed Campaign D non-regression

After the repaired runtime and its tests were frozen, exactly five exposed H2 critical cases (3, 4, 5, 7 and 9) were invoked once each through the product ST entrypoint. All five passed their bounded non-regression obligations. Each invocation retained the exact Knowledge dependency, transferred no Knowledge ownership, authorized no Project write and reported zero Project writes.

This evidence is classified only as `EXPOSED_HUMAN_CASE_NON_REGRESSION`. There was no reroll and no runtime modification after observing it. Campaign D evidence was not mutated. These exposed cases are not fresh post-repair evidence and cannot be counted as a new human scientific adjudication.

## Safety invariants

| Invariant | Result |
|---|---|
| `candidate != adopted` | `PRESERVED` |
| Project writes | `0` |
| Automatic adoption | `0` |
| Knowledge ownership transfer | `0` |
| Exact Knowledge evidence/source refs retained | `YES` |
| Contradiction winner selected | `NO` |
| Human decision simulated | `NO` |
| Frozen Campaign D evidence mutated | `NO` |
| External LLM/API calls | `0` |
| Network calls | `0` |

The H1T digest registry contains 21 entries. The two entries for the deliberately repaired ST engine/types now differ as expected; the other 19 historical evidence files remain byte-identical. This is a versioned runtime change, not a rewrite of historical H1/H1T/H2 evidence.

## Verification

| Check | Exact result |
|---|---|
| Fresh development probes and deterministic replay | `13/13 PASS` |
| Exposed Campaign D non-regression, single observation | `5/5 PASS` |
| Final targeted impacted suite, exposed replay explicitly excluded | `10/10 files; 87/87 tests PASS` |
| TypeScript typecheck | `PASS` |
| Targeted ESLint | `PASS` |
| Runtime hardcode scan | `PASS` for Campaign/exposed identifiers and repaired-case vocabulary |
| Frozen H1/H1T/H2 path diff | `NONE` |

The exact final repository checks, JSON parsing, secret scan and `git diff --check` are recorded in the mission handoff. No unrelated global suite or new scientific campaign was run.

## Characterization and program decision

`HUMAN_SCIENTIFIC_ADJUDICATION_REQUIRED = YES`

`SCIENTIFIC_THINKING_CHARACTERIZATION = NOT_ADJUDICATED_POST_REPAIR`

`SCIENTIFIC_PASS = NO`

`W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO`

`W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO`

`WAVE_1_COMPLETE = NO`

`WAVE_2_AUTHORIZED = NO`

The bounded technical repair is ready for a separate fresh human recharacterization. The recommended mission is `W1-QUAL-02H1_ST_POST_REPAIR_FRESH_HUMAN_RECHARACTERIZATION`, but it is not automatically authorized.

`NEXT_AUTHORIZED_MISSION = NONE_PENDING_EXPLICIT_HUMAN_PROGRAM_DECISION`

`NEXT_RECOMMENDED_MISSION = W1-QUAL-02H1_ST_POST_REPAIR_FRESH_HUMAN_RECHARACTERIZATION`

## Decision

`W1_ST_REPAIR_02_COMPLETED_READY_FOR_FRESH_HUMAN_RECHARACTERIZATION`
