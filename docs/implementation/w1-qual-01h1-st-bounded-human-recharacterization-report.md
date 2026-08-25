# W1-QUAL-01H1 — ST Bounded Human Recharacterization Review Packet Preparation

`LEVEL_3_IMPLEMENTATION_EVIDENCE — NON_NORMATIVE`

## 1. Decision

`W1_QUAL_01H1_REVIEW_PACKET_NOT_READY`

H1 a produit une campagne reconstructible, mais le paquet de revue humaine n'est pas prêt : le checker gelé a signalé 25 échecs sur 11 cas. H1 ne caractérise pas Scientific Thinking, ne prononce aucun Scientific PASS et n'exécute pas H2.

`SCIENTIFIC_THINKING_CHARACTERIZATION = NOT_ADJUDICATED`

## 2. Human program decision

`AUTOMATED_ST_CHARACTERIZATION_HARNESS = NOT_MATURE_FOR_SCIENTIFIC_ADJUDICATION`

`FURTHER_AUTOMATED_HARNESS_REPAIR = STOPPED_BY_HUMAN_PROGRAM_DECISION`

Campaigns A, B et C restent des preuves exposées invalides. Leurs cas et contrôleurs servent seulement à l'audit de parenté et à la conservation historique.

## 3. Baseline and authority boundary

| Élément | Valeur |
|---|---|
| Branche | `protocol-designer-canonical-ingestion` |
| HEAD initial | `ccc6b37dce77c76209cbe556d6ae327c9267dd9d` |
| HEAD au freeze | `1a77e5d5001b2108f43a52a82bebecff350c4296` |
| Main / origin main | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| ST | `1.2.1` |
| ST runtime modified | `NO` |
| TRACE ledger | `0.1.0` |
| Checker | `1.0.0` / `sha256-ad9b7790428f40e45230ed1d1774bfa02a623f5a82e9d3f14df8249c0a269a5c` |

Les autorités ont été consultées dans l'ordre obligatoire : Source-of-Truth Index ; Charte fondatrice ; Scientific Product Manifesto V2 ; Editorial Engine Architecture Manifesto ; roadmap. Les références spécialisées appliquées sont PD-003 V2, Ownership Matrix, Relationship Catalog, PD-005, PD-009, PD-011, RDE-001, RDE-002 et KE-001. W1-QUAL-01, W1-ST-REPAIR-01, W1-QUAL-01R/R1/R2 et W1-TRACE-01 sont utilisés uniquement comme preuves Level 3.

Aucune contradiction normative réelle n'a été trouvée. Le mandat humain remplace la transition R3 sans modifier une norme scientifique.

## 4. Method

1. Douze cas entièrement nouveaux ont été écrits et comparés aux corpus exposés.
2. Un HumanReviewEnvelope non-Gold a été écrit pour chaque cas avant observation.
3. Chaque cas a reçu un ProjectContextSnapshot et un KnowledgeResult synthétique, typé, versionné, digéré et gelé.
4. Campaign ID, HEAD, ST, registres, parentage, TRACE et checker ont été gelés avant la première invocation.
5. Chaque cas a été exécuté une fois, sans reroll ni repair ; l'échec du gate final est conservé.
6. Trois cas pré-sélectionnés ont été rejoués uniquement pour le déterminisme.
7. Les contrôles automatiques sont limités aux invariants objectifs ; les dimensions scientifiques restent `HUMAN_REVIEW_REQUIRED`.

## 5. Independence and parentage

| Cas | Statut | Matériau le plus proche | Raison de distinction |
|---|---|---|---|
| `ST01H1-D-MPR-CMR-PET-COMPARATIVE-01` | `NOVEL` | ST01R-CARDIAC-MYOCARDITIS-01; ST01R2-C-FOURD-FLOW-ALIASING-01; tests T1/ECV | Nouveaux construits de réserve, nouvelle paire CMR/PET et population INOCA; aucun T1/ECV, flux valvulaire, myocardite ou no-reflow. |
| `ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01` | `NOVEL` | ST01R1-B-CARDIAC-IRON-ASSOCIATION-01; ST01R2-C-STRAIN-ALGORITHMS-01 | Nouvelle anatomie valvulaire, nouvel outcome rythmique et nouveau lien longitudinal; aucune surcharge en fer, strain logiciel ou récidive post-ablation. |
| `ST01H1-D-RVPA-EXERCISE-MECHANISM-01` | `NOVEL` | ST01R2-C-FOURD-FLOW-ALIASING-01; SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP | Nouvelle physiologie d'effort et relation ventriculo-artérielle; aucune mesure valvulaire de vitesse, flux 4D ou suivi de pression pulmonaire du cas SEM. |
| `ST01H1-D-NEUROMELANIN-ALTERNATIVES-01` | `NOVEL` | ST01R1-B-NEURO-BBB-CAUSALITY-01; ST01R2-C-CAPILLARY-HETEROGENEITY-01 | Nouveau noyau cérébral, nouveau contraste neuromélanine et nouvelles alternatives pigment/eau/fer; aucune BBB, Ktrans, perfusion ou extraction d'oxygène. |
| `ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01` | `RELATED_BUT_DISTINCT` | ST01R-NEURO-RCBV-ALTERNATIVES-01; ST01R1-B-NEURO-BBB-CAUSALITY-01 | Même famille générale d'alternatives en neuro-oncologie, mais nouveau métabolite, nouvelle méthode MRS, nouveau contexte post-thérapeutique et contradiction activité/nécrose. |
| `ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01` | `NOVEL` | ST-UNSUPPORTED-01; ST01R-INSUFFICIENT-FINALITY-01; repair probe D | Nouveau construit métabolique réel et question scientifique structurée; contrairement aux cas zéphyr/vagues, l'insuffisance vient du corpus, non d'un terme fictif ou d'une finalité absente. |
| `ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01` | `RELATED_BUT_DISTINCT` | ST01R1-B-CONDITIONAL-ENDPOINT-01; ST01R2-C-PROJECT-COMPARATOR-UNKNOWN-01 | Même famille d'inconnue Project, mais nouveau territoire pulmonaire, nouvelle distinction aigu/chronique et nouveau construit perfusé; aucun endpoint carotidien ni référence hépatique. |
| `ST01H1-D-PANCREAS-IODINE-NARROW-01` | `NOVEL` | ST01R-SPECTRAL-IODINE-CONSTRUCT-01; ST01R1-B-SPECTRAL-NEGATIVE-IODINE-01 | Nouveau territoire pancréatique, phase artérielle explicite et relation quantitative intrachaîne; aucun rein, négativité d'iode, tumeur hépatique ou construit générique. |
| `ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01` | `NOVEL` | ST01R-OUT-OF-OWNER-DICOM-01; ST01R1-B-OUT-OF-OWNER-ACCOUNTING-01; repair probe G | Nouvelle frontière Safety/éthique/recrutement et décision humaine; aucun logiciel, DICOM, marketing, comptabilité ou tarification. |
| `ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01` | `RELATED_BUT_DISTINCT` | ST01R1-B-METHOD-REFERENCE-MISMATCH-01; ST01R2-C-STRAIN-ALGORITHMS-01 | Nouveau contexte multicentrique radiomique et dépendance conjointe reconstruction/segmentation; aucun accord entre références imparfaites ni feature-tracking cardiaque. |
| `ST01H1-D-CT-BMD-STALE-01` | `RELATED_BUT_DISTINCT` | ST01R-STALE-KNOWLEDGE-01; ST01R1-B-STALE-ZEFF-01; ST01R2-C-STALE-DIFFUSION-01; stale meta-tests | Le garde contractuel est nécessairement apparenté, mais le Project, le KnowledgeResult, l'ostéoporose opportuniste, l'outcome fracture et toutes les identités sont nouveaux. |
| `ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01` | `RELATED_BUT_DISTINCT` | ST01R-NEURO-PREDICTION-NONPROMOTION-01; ST01R1-B-NEURO-GHOST-CORE-01 | Même frontière de non-promotion, mais nouveau cancer, nouvelle signature radiomique, nouvelle faiblesse monocentrique et nouvelle dette de validation externe; aucun neurotrauma ni core d'AVC. |

Comptes : 7 `NOVEL`, 5 `RELATED_BUT_DISTINCT`, 0 `TOO_CLOSE`, 0 `EXACT_OR_NEAR_DUPLICATE`. Aucun cas exclu n'a été réintroduit comme preuve indépendante.

## 6. Freeze

| Élément gelé | Digest / version |
|---|---|
| Campaign | `W1-QUAL-01H-ST-2026-08-26-D` |
| Freeze digest | `ke1-f8f6b4620ab40c36` |
| Case registry | `ke1-a71c840521dad471` |
| HumanReviewEnvelope registry | `ke1-a2e79901fbaa197d` |
| Frozen input registry | `ke1-3070ff81ac8d1105` |
| Parentage audit | `ke1-ff96cf6c8c75a468` |
| ST engine | `sha256-e87aa94e3e7f0542991f2d3bc748a9ba41f33fb0ff32511ea25f820feb9564dc` |
| ST types | `sha256-79f7ac776d92d4be9586385a94113d9d02a6dd500d1f8194eb523f6eaf9a00f6` |
| Product ST runtime | `sha256-bef0aa5ede4daafa9eae9b5cab158e7c36bfa899bfd4d460a4ac7773f5fa0fe7` |

Après exposition, aucun cas, envelope, input, checker ou runtime ST n'a été modifié.

## 7. Execution and TRACE

| Mesure | Compte exact |
|---|---:|
| Cas | 12 |
| Primary runs | 12 |
| OwnerResults produits | 11 |
| Rejets pré-owner attendus | 1 |
| Échecs techniques selon le gate gelé | 11 |
| Primary TRACE déclarées complètes par le checker gelé | 1/12 |
| Replays pré-sélectionnés | 3 |
| Replays stables | 3 |
| Rerolls | 0 |
| Repairs | 0 |
| LLM/provider/network calls | 0 / 0 / 0 |
| Project writes | 0 |

Les 11 exécutions nominales ont chacune conservé la séquence `RUN_STARTED → HANDOFF_STARTED → HANDOFF_ACCEPTED → OWNER_INVOCATION_STARTED → OWNER_INVOCATION_COMPLETED → RESULT_PERSISTED → RUN_COMPLETED`. Le cas stale a conservé la séquence fail-closed attendue. Le checker gelé cherchait toutefois `OWNER_RESULT_PERSISTED`, nom absent du schéma courant, et n'a donc reconnu qu'une trace sur douze. Aucun raisonnement privé n'est enregistré.

## 8. Deterministic structural and safety checks

| Contrôle global | PASS | FAIL | N/A | Verdict technique |
|---|---:|---:|---:|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | 11 | 0 | 1 | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | 11 | 0 | 1 | `PASS` |
| `CONTRADICTION_LOSS` | 8 | 3 | 1 | `FAIL` |
| `PROJECT_QUESTION_DRIFT` | 0 | 11 | 1 | `FAIL` |
| `LINEAGE_BREAK` | 11 | 0 | 1 | `PASS` |
| `OWNERSHIP_LEAK` | 11 | 0 | 1 | `PASS` |
| `PROJECT_WRITES` | 12 | 0 | 0 | `PASS` |
| `STALE_PROTECTION_FAILURE` | 1 | 0 | 11 | `PASS` |
| `TRACE_INCOMPLETE` | 1 | 11 | 0 | `FAIL` |

Contrôles élémentaires : 228 au total ; 178 PASS ; 25 FAIL ; 25 NOT_APPLICABLE.

Ces résultats ne constituent pas un Scientific PASS. La qualité des hypothèses, des mécanismes, des omissions et des alternatives reste PENDING jusqu'à une éventuelle mission humaine explicitement autorisée.

### Premier étage divergent observé

| Contrôle | Cas affectés | Observation | Attente gelée | Attribution |
|---|---:|---|---|---|
| `PROJECT_QUESTION_DRIFT` | 11 | validatedReformulation conserve exactement la question ; originalExpression conserve contractuellement question + purpose. | originalExpression et validatedReformulation tous deux égaux à la question seule. | `DETERMINISTIC_CHECKER_EXPECTATION_MISMATCH` |
| `TRACE_INCOMPLETE` | 11 | La séquence nominale contient RESULT_PERSISTED, l'événement défini par le schéma TRACE courant. | OWNER_RESULT_PERSISTED, nom absent du schéma TRACE courant. | `DETERMINISTIC_CHECKER_EVENT_NAME_MISMATCH` |
| `CONTRADICTION_LOSS` | 3 | La contradiction est conservée dans la forme typée conflictId:state:explanation. | Égalité de tableau avec l'explication nue, sans préfixe typé. | `DETERMINISTIC_CHECKER_REPRESENTATION_MISMATCH` |

Les 25 échecs sont entièrement expliqués par ces trois attentes incompatibles du checker gelé. Cela n'établit aucun nouveau défaut du runtime ST. Cela invalide néanmoins le gate H1, car le checker ne peut être modifié après exposition et aucun rerun n'est autorisé.

## 9. Human review status

`HUMAN_REVIEW_CASES = 12`

`HUMAN_ADJUDICATION_COMPLETED = 0`

`HUMAN_ADJUDICATION_PENDING = 12`

Le template machine conserve H1–H8 à `PENDING` pour chaque cas. Aucune disposition finale n'est calculée ici. H2 ne doit pas recevoir ces cas tant qu'une décision humaine de programme n'a pas traité le statut `NOT_READY`.

## 10. Limitations

- corpus synthétique de 12 cas, non populationnel ;
- aucune validation aveugle ou comparaison humaine PD-011 ;
- références locales bornées et aucune recherche externe ;
- aucun benchmark de sensibilité, spécificité ou performance scientifique ;
- la revue d'un seul humain en H2, si retenue, devra être explicitement bornée et ne deviendra pas une validation universelle ;
- la caractérisation contrôlée de la boucle assemblée reste non réalisée.

## 11. Program status

`W1_ARCHITECTURAL_CONVERGENCE_READY = YES`

`W1_OBSERVABILITY_READY = YES`

`W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO`

`W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO`

`WAVE_1_COMPLETE = NO`

`WAVE_2_AUTHORIZED = NO`

`NEXT_AUTHORIZED_MISSION = NONE_PENDING_EXPLICIT_HUMAN_PROGRAM_DECISION`

`W1-QUAL-01H2_ST_HUMAN_ADJUDICATION_CLOSURE = NOT_AUTHORIZED_FROM_THIS_FAILED_GATE`

H2 n'est pas exécutée par H1. Le mandat initial visait H2 après un paquet prêt ; cette condition n'est pas satisfaite. Une nouvelle décision humaine de programme est nécessaire, sans correction rétroactive du checker ni rerun de Campaign D.

## 12. Verification record

| Vérification | Résultat exact |
|---|---|
| Validation statique des artefacts H1 | 12/12 fichiers machine requis présents ; digests registres, outputs, checker, authoring et trois fichiers runtime conformes au freeze ; 11/11 assertions composites PASS |
| Exécution H1 gelée | 12 primary runs ; 11 OwnerResults ; 1 rejet stale attendu ; gate final FAIL avec 25 échecs gelés |
| Replays H1 | 3/3 stables ; 0 divergent |
| Tests ST + product handoff + TRACE | 9/9 fichiers PASS ; 133/133 tests PASS |
| Typecheck application | PASS |
| Typecheck API / server + Node ESM handler load | PASS / PASS / PASS |
| Lint ciblé | 5/5 fichiers TypeScript H1 sans erreur |
| Build Vite | PASS ; avertissements non bloquants préexistants sur Browserslist, annotations PURE, syntaxe CSS et taille des chunks |
| Secret scan ciblé | 0 correspondance |

Le gate H1 rouge n'est pas masqué par les suites techniques vertes. Aucun test technique ne constitue une adjudication scientifique.
