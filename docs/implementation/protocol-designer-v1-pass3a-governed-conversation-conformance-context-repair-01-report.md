# NOXIA — PASS3A Governed Conversation Conformance, Context and Visible-Obligation Repair 01

## 1. Décision

`MISSION_STATUS = QUALIFIED_GOVERNED_CONVERSATION_CONFORMANCE_CONTEXT_REPAIR_READY_FOR_TARGETED_PROVIDER_REPLAY`

La réparation causale bornée est qualifiée localement. Elle corrige le validator HOW, le transport QRY→HOW, la projection anaphorique de session et les obligations visibles issues d’un OwnerResult courant. Elle ne modifie ni le moteur QRY, ni un owner scientifique, ni Project, ni Language Gateway, ni TRACE comme système.

L’efficacité Gemini live reste volontairement non testée. La prochaine étape est un replay DEV ciblé soumis à autorisation explicite distincte.

## 2. Baseline et autorité

`HEAD_BEFORE = 4ff4614b0fbc16765db25ac1b1c9ec6887a97c05`

`HEAD_AFTER_PRODUCT_CHANGE = e5f7a238653f43478f8b8db45cef6e6f318b73fd`

`HEAD_FINAL = REPORT_COMMIT_SHA_REPORTED_IN_FINAL_EXECUTION_RECEIPT`

`PRODUCT_COMMITS = e5f7a238653f43478f8b8db45cef6e6f318b73fd`

`REPORT_COMMIT = SELF_COMMIT_SHA_REPORTED_IN_FINAL_EXECUTION_RECEIPT`

Les autorités ont été routées depuis `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`. Les sections applicables de la Charte fondatrice, du Scientific Product Manifesto V2, de la Product Specification V1, de PD-004 et de PD-009 ont été consultées sans modification.

Conclusion normative appliquée : QRY reste owner du WHAT et de la prochaine action ; le consumer et Gemini ne réalisent que HOW. Les contenus fournis par l’utilisateur restent des preuves utilisateur. Les options Study Design restent des propositions owner ; aucune option n’est adoptée sans décision humaine.

## 3. Requalification causale

`CAUSAL_CLASSES_CONFIRMED = A_WITNESS_ANCHORING_DEFECT, B_SYNTHETIC_CONTROL_TEXT_MISCLASSIFIED_AS_VISIBLE_CONTENT, C_ANAPHORIC_REFERENT_CONTEXT_MISSING, D_UNSUPPORTED_EXPLANATORY_CONTENT_ACCEPTED, E_USER_SOURCE_OWNERSHIP_OR_SPEECH_ACT_DISTORTION, F_OWNER_DECISION_SUPPORT_NOT_RENDERED`

`CAUSAL_CLASSES_REQUALIFIED = G_PRODUCT_QUALITY_LIMIT_RETAINED_AS_HUMAN_REVIEW_DOMAIN_NOT_GENERAL_SEMANTIC_CONTRACT_PROOF`

Le défaut nouvellement démontré n’était pas dans l’algorithme QRY. La frontière causale était l’adapter QRY→HOW, le contexte de session borné et le contrat/validator de réalisation gouvernée.

| Cas | Avant | Après local | Motif |
|---|---|---|---|
| CASE-06_T1 | FAIL | PASS | Faux rejet de casse supprimé ; span exact matérialisé |
| CASE-11_T2 | FAIL | FAIL | Ancrage réparé ; attribution utilisateur toujours absente de l’output historique |
| CASE-09_T1 | FAIL | FAIL | Faux contenu synthétique retiré ; discriminants, limites et frontière humaine absents |
| CASE-05_T2 | PASS | FAIL | Référents exacts absents ; justification non gouvernée non réutilisable |
| CASE-11_T3 | PASS | FAIL | Écho exact du refus/ordre utilisateur, sans accusé de réception |
| CASE-07_T1 | PASS | FAIL | Source utilisateur non attribuée |
| CASE-08_T1 | PASS | FAIL | Source utilisateur non attribuée |
| CASE-11_T1 | PASS | FAIL | Objectif utilisateur réattribué à NOXIA |
| CASE-12_T1 | PASS | FAIL | Même classe générique hors imagerie |

`CASE_06_T1_STATUS_BEFORE = REJECTED_FALSE_NEGATIVE`

`CASE_06_T1_STATUS_AFTER = ACCEPTED_STRUCTURAL_CONFORMANCE_HUMAN_REVIEW_REQUIRED`

`CASE_11_T2_STATUS_BEFORE = REJECTED_FALSE_NEGATIVE_ON_CASE_SENSITIVE_WITNESS`

`CASE_11_T2_STATUS_AFTER = REJECTED_SOURCE_ATTRIBUTION_AND_INTERVENTION_SEMANTICS_MISSING`

`CASE_09_T1_STATUS_BEFORE = REJECTED_SYNTHETIC_QRY_CONTROL_TEXT_MISSING`

`CASE_09_T1_STATUS_AFTER = REJECTED_REQUIRED_OWNER_DECISION_SUPPORT_NOT_VISIBLE`

`CASE_05_T2_STATUS_BEFORE = ACCEPTED_WITH_UNBOUND_REFERENT_AND_UNSUPPORTED_EXPLANATION`

`CASE_05_T2_STATUS_AFTER = REJECTED_OR_NOT_REUSABLE_WITHOUT_EXACT_REFERENT_BINDING`

`CASE_11_T3_STATUS_BEFORE = ACCEPTED_EXACT_USER_COMMAND_ECHO`

`CASE_11_T3_STATUS_AFTER = REJECTED_EXACT_USER_COMMAND_ECHO_AND_MISSING_ACKNOWLEDGEMENT`

Le packet offline complet est conservé hors commit produit sous `validation/protocol-designer-v1-pass3a-governed-conversation-conformance-context-repair-01/offline-review-packet.md`.

## 4. Réparations

### 4.1 Witness visible

`VISIBLE_WITNESS_NORMALIZATION = EXACT_CONTIGUOUS_VISIBLE_SPAN_WITH_SOURCE_INDEX_MAPPING`

`UNICODE_NORMALIZATION = NFKC_CASE_FOLD_WHITESPACE_AND_CONTROLLED_APOSTROPHE_NORMALIZATION`

`CASE_FOLDING = YES_FR_LOCALE`

`FUZZY_MATCHING_ADDED = NO`

`SECOND_LLM_JUDGE_ADDED = NO`

La normalisation ne supprime pas les accents, ne réordonne pas les mots et n’accepte aucune paraphrase. Le premier span correspondant dans le texte réellement visible est enregistré avec ses offsets et son texte exact.

### 4.2 Contexte anaphorique borné

`ANAPHORIC_REFERENT_BINDING_STATUS = PASS_UNIQUE_CURRENT_EXACT_LIFECYCLE_BINDING`

`FULL_TRANSCRIPT_TRANSMITTED = NO_TO_GOVERNED_HOW`

`NEW_CONTEXT_ENGINE_CREATED = NO`

La projection réutilise les candidates retenues de la session. Elle exige : actualité `CURRENT`, absence de décision humaine, validation réussie, même conversation, digest exact du tour source, même base Project et digest exact de candidate. Une candidate unique transmet uniquement les contenus structurés pertinents ; plusieurs candidates restent `AMBIGUOUS` ; une candidate stale/superseded ne peut pas redevenir courante.

Une demande d’explication ambiguë ou périmée produit une limite explicite. Elle ne résout pas silencieusement le référent.

### 4.3 Sémantique d’intervention et source

`STRUCTURING_PROPOSAL_VS_SCIENTIFIC_PROPOSAL_STATUS = PASS`

`USER_SOURCE_OWNERSHIP_PRESERVATION_STATUS = PASS_STRUCTURAL_VISIBLE_ATTRIBUTION_REQUIRED`

`REFUSAL_SPEAKER_ROLE_STATUS = PASS_EXACT_ECHO_REJECTED_AND_ACKNOWLEDGEMENT_REQUIRED`

L’enveloppe distingue `ASK_INFORMATION`, `STRUCTURE_USER_SUPPLIED_CONTENT`, `PRESENT_OWNER_DECISION_SUPPORT`, `EXPLAIN_REFERENCED_CONTENT`, `ACKNOWLEDGE_USER_DIRECTION` et `RESPOND_WITHOUT_MUTATION`, avec une source explicite. Pour les contenus utilisateur, le visible doit contenir l’attribution bornée « les éléments que vous avez formulés ». Une correction/refus doit contenir « Votre instruction est reçue ». Les claims provider restent des claims ; les obligations visibles fournissent la preuve structurelle minimale sans prétendre prouver toute la sémantique.

### 4.4 OwnerResult vers visible

`COMPARE_OPTIONS_VISIBLE_OBLIGATION_STATUS = PASS`

`OWNER_RESULT_TO_VISIBLE_ACTION_LOCAL_STATUS = PASS`

`GENERIC_WITNESS_FOR_RICH_CONTENT_ACCEPTED = 0`

Seul le résultat Study Design courant, validé et lié exactement au Project et à l’action QRY sélectionnée est projeté. Le HOW reçoit un sous-ensemble borné : identité et discriminant de chaque option sélectionnée, limites matérielles disponibles et frontière de décision humaine. Le résumé de contrôle QRY n’est plus un contenu scientifique obligatoire. L’OwnerResult n’est pas modifié et les payloads non sélectionnés ne sont pas imposés au visible.

`QRY_WHAT_VALUE_STATUS = PASS_UNCHANGED_EXISTING_QRY_SELECTION_REUSED`

`VISIBLE_CONVERSATION_STATUS = LOCALLY_CONTRACT_QUALIFIED_PROVIDER_EFFECTIVENESS_PENDING`

`LIVE_PROVIDER_EFFECTIVENESS = NOT_TESTED`

## 5. Frontières et non-mutation

`DETERMINISTIC_VALIDATOR_PROVES = STRUCTURE_REFS_EXACT_NORMALIZED_VISIBLE_SPANS_STATUSES_PROTECTED_LITERALS_QUANTITIES_REQUIRED_VISIBLE_OBLIGATIONS_FORBIDDEN_MUTATION_OR_ADOPTION_CLAIMS`

`DETERMINISTIC_VALIDATOR_DOES_NOT_PROVE = GENERAL_SEMANTIC_EQUIVALENCE_SCIENTIFIC_CORRECTNESS_SCIENTIFIC_USEFULNESS_NATURALNESS_EXHAUSTIVE_NUANCE_PRESERVATION`

`PROJECT_WRITES_BEFORE_HUMAN = 0`

`AUTOMATIC_ADOPTION = 0`

`NEW_OWNER_CREATED = 0`

`NEW_ENGINE_CREATED = 0`

`NEW_TRACE_SYSTEM_CREATED = 0`

`SCIENTIFIC_OWNER_FILES_CHANGED = 0`

`LANGUAGE_GATEWAY_FILES_CHANGED = 0`

`PROJECT_WRITER_FILES_CHANGED = 0`

`NORMATIVE_FILES_CHANGED = 0`

`MEMORY_FILES_CHANGED = 0`

## 6. Validation

`TARGETED_TESTS = PASS — 13 files / 203 tests`

`TYPESCRIPT = PASS — application + Vercel API + scientific interpretation server`

`AFFECTED_LINT = PASS`

`PRODUCTION_BUILD = PASS`

`FULL_SUITE_PASS = 3822`

`FULL_SUITE_SKIP = 12`

`FULL_SUITE_TODO = 1`

`FULL_SUITE_FAIL = 1`

`HISTORICAL_FAILURES = src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx — unchanged expectation for heading "Protocol Designer"`

`NEW_REGRESSIONS = 0`

`GIT_DIFF_CHECK = PASS`

Le build conserve des avertissements préexistants non causaux : donnée Browserslist ancienne, annotations Rollup tierces, erreur CSS déjà présente lors de la minification et taille de chunks. Aucun n’a été réparé opportunistement.

## 7. Git et préservation

Allowlist du commit produit :

- `api/protocol-designer-bridge.ts`
- `src/features/protocol-designer/product-bridge.ts`
- `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx`
- `src/features/protocol-designer/functional-reset/__tests__/functional-reset-fixtures.ts`
- `src/features/protocol-designer/functional-reset/__tests__/pass3a-bridge-lifecycle.test.ts`
- `src/features/protocol-designer/functional-reset/__tests__/pass3a-bridge-provider-test-fixtures.ts`
- `src/features/protocol-designer/functional-reset/__tests__/pass3a-governed-conversation-trace.test.ts`
- `src/features/protocol-designer/functional-reset/__tests__/pass3a-post-adoption-governed-receipt.test.ts`
- `src/features/query-navigation/current-navigation-evidence.ts`
- `src/features/query-navigation/current-turn-navigation.ts`
- `src/features/query-navigation/governed-conversation-realization.ts`
- `src/features/query-navigation/__tests__/current-navigation-evidence.test.ts`
- `src/features/query-navigation/__tests__/pass3a-governed-conversation-conformance-context-repair.test.ts`
- `src/features/query-navigation/__tests__/fixtures/pass3a-gemini-dev-exact-outputs.json`

`PREEXISTING_UNTRACKED_FILES = 402`

`PREEXISTING_UNTRACKED_CONTENT_CHANGED = 0`

`TRACKED_WORKTREE_CHANGES = 0_AFTER_REPORT_COMMIT`

`STAGED_FILES = 0_AFTER_REPORT_COMMIT`

Les quatre nouveaux artefacts mission sous `validation/protocol-designer-v1-pass3a-governed-conversation-conformance-context-repair-01/` restent non suivis. Les artefacts historiques de validation n’ont pas été ajoutés au commit.

## 8. Appels et suite

`PROVIDER_CALLS = 0`

`GEMINI_CALLS = 0`

`OPENAI_CALLS = 0`

`PUSH = NO`

`DEPLOYMENT = NO`

`P1_COMPLETE = NO`

`P1_EXIT_GATE = NOT_SATISFIED`

`WAVE_2_AUTHORIZED = NO`

`NEXT_ACTION = TARGETED_GEMINI_DEV_REPLAY_OF_DISCRIMINANT_CASES_PENDING_EXPLICIT_AUTHORIZATION`

Le futur replay nominal comporte six appels Gemini DEV maximum, sans retry, reroll, fallback ni appel OpenAI. Il ne fait pas partie de cette mission.
