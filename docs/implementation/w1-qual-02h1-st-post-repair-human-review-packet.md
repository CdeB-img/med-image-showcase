# W1-QUAL-02H1 — Scientific Thinking 1.2.2 post-repair human review packet

Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Normative: `NO`

Campaign: `W1-QUAL-02H-ST-2026-08-26-E`

Freeze digest: `ke1-d1c4ff40aa84e28c`

## Packet status

`W1_QUAL_02H1_HUMAN_REVIEW_PACKET_NOT_READY`

**DO NOT SCIENTIFICALLY ADJUDICATE THIS PACKET.**

The eight fresh cases, Project snapshots, Knowledge inputs, parentage audit and HumanReviewEnvelopes were frozen before observation. During the first and only ST invocation, ST returned an OwnerResult in memory and the passive trace recorder completed. The deterministic collector then attempted to read a non-contract top-level `output.limitations` field and raised a `TypeError` before the ST output, OwnerResult metadata and trace ledger could be persisted.

The first case was not rerun. The remaining seven cases were not invoked. No missing output or trace event is reconstructed. The packet therefore cannot supply the required full readable ST outputs and is not suitable for Charles's adjudication.

`ST_RUNTIME_MODIFIED = NO`

`SCIENTIFIC_PASS = NO`

`HUMAN_SCIENTIFIC_ADJUDICATION_REQUIRED = YES`

`HUMAN_ADJUDICATION_COMPLETED = 0`

`HUMAN_ADJUDICATION_PENDING = 8`

## Failure attribution

- First divergent technical stage: `DETERMINISTIC_CHECKER`.
- Failure code: `LIMITATION_COLLECTION_FIELD_MISMATCH`.
- ST runtime defect demonstrated: `NO`.
- Scientific defect demonstrated: `NO`.
- ST invocations: `1`.
- Rerolls: `0`.
- Repairs after observation: `0`.
- External LLM/API calls: `0`.
- Network calls: `0`.

## Case execution register

| Case | Family | Scientific question | Execution | ST output available for review | H1–H8 |
|---|---|---|---|---|---|
| `ST02H1-E-NVC-MECHANISM-01` | A — Mechanistic reasoning | Chez des adultes avec maladie des petits vaisseaux, une réponse BOLD/perfusion réduite pendant une tâche relève-t-elle du recrutement neuronal, des astrocytes/péricytes ou de l'endothélium ? | One invocation; collector failed after OwnerResult and in-memory trace completion | `NO` | `PENDING` |
| `ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01` | B — Named alternatives | Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction ? | Not executed — fail-closed stop | `NO` | `PENDING` |
| `ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01` | C — Knowledge contradiction | En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes ? | Not executed — fail-closed stop | `NO` | `PENDING` |
| `ST02H1-E-ICI-EXPOSURE-UNKNOWN-01` | D — Structuring Project unknown | Chez des adultes présentant une nouvelle lésion myocardique pendant un traitement anticancéreux, les changements CMR longitudinaux sont-ils associés à une myocardite inflammatoire liée au traitement ? | Not executed — fail-closed stop | `NO` | `PENDING` |
| `ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01` | E — Out of ownership | ST peut-il autoriser la réutilisation et le transfert intersite d'images de soin identifiables sans validation institutionnelle ni DPO ? | Not executed — fail-closed stop | `NO` | `PENDING` |
| `ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01` | F — Insufficient Knowledge | Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi ? | Not executed — fail-closed stop | `NO` | `PENDING` |
| `ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01` | G — Narrow applicability | Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ? | Not executed — fail-closed stop | `NO` | `PENDING` |
| `ST02H1-E-GM-WM-CBF-ASSOCIATION-01` | H — Simple supported association | Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ? | Not executed — fail-closed stop | `NO` | `PENDING` |

## Frozen material retained

The complete pre-observation Project contexts, Knowledge positions/assertions, source and evidence references, gaps, contradictions, limitations, parentage decisions and HumanReviewEnvelopes remain available in the machine registries. They remain frozen and were not edited after observation.

All eight H1–H8 sets remain `PENDING`. No human or automated scientific disposition has been entered.

## Program boundary

`SCIENTIFIC_THINKING_CHARACTERIZATION = NOT_ADJUDICATED_POST_REPAIR`

`W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO`

`W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO`

`WAVE_1_COMPLETE = NO`

`WAVE_2_AUTHORIZED = NO`

No replacement campaign, collector repair, H2 mission, controlled-loop campaign, merge or deployment is authorized by this evidence.
