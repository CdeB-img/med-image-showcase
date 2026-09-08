# LANGUAGE_GATEWAY_REFERENCE_CORRECTION_OPENAI_LUNA_MIGRATION_AND_CONTEXT_BOUNDARY_01

Date de qualification : 2026-09-08

Repository : `/Users/charles/Documents/Projets/NOXIA/noxia-dev`

Branche : `protocol-designer-canonical-ingestion`

## 1. Décision

La modification est bornée au Language Gateway, à son transport OpenAI, à son contrat observable TRACE et à l'évaluateur courant de références. Aucun owner scientifique, Project, QRY, TMP/DOC, moteur décisionnel ou autorité n'a été modifié.

`MISSION_STATUS = QUALIFIED_FIC02_OPENAI_LUNA_LOW_REFREEZE_CANDIDATE_READY`

La cible opérationnelle est `OPENAI / gpt-5.6-luna / low`. Il s'agit d'une baseline provisoire en attente d'un re-freeze et d'un replay produit explicitement autorisés. Ce statut ne constitue ni une comparaison de supériorité Luna/Terra ni une qualification live.

## 2. Routage normatif et périmètre

Le `SOURCE-OF-TRUTH-INDEX` route le Research Project comme état scientifique adopté, les owners comme responsables de leurs raisonnements, QRY comme propriétaire du besoin actif et le Language Gateway comme projection linguistique. Les décisions LG-01 à LG-08 ne contredisent pas ces autorités : elles précisent une frontière linguistique et une configuration d'exécution sans transférer l'ownership scientifique au provider.

Les artefacts historiques sous `validation/language-gateway-reference-human-review-forensic-01/`, `validation/language-gateway-openai-provider-qualification-01/` et `validation/frozen-integrated-campaign-02/` sont restés inchangés et hors commit.

## 3. Language Gateway 1.4.0

Le contrat, le prompt, le schéma et le validator passent ensemble de `1.3.0` à `1.4.0`.

- Les catégories sémantiques sont explicitement non exclusives.
- Les booléens et witnesses sont des claims provider, pas des preuves indépendantes.
- Les witnesses doivent être verbatim, bornés et suffisamment contextualisés.
- `UNKNOWN`, `ABSENT` et `LOST` restent distincts ; absence d'attestation, perte déclarée et preuve obligatoire absente échouent en fail-closed.
- `UNCERTAINTY` est limitée à une modalité épistémique explicite ou une réserve explicite sur la possibilité/degré de certitude.
- `not yet / pas encore`, pris isolément, produit `NEGATION=PRESENT`, `TEMPORAL_RELATION=PRESENT`, `UNCERTAINTY=ABSENT`.
- `yet` ou `encore` isolés ne suffisent pas à attester une relation temporelle.
- Les modalités explicites `may`, `might`, `could`, `perhaps`, `possibly`, `pourrait`, `peut-être`, `possiblement`, etc. restent observables.
- Le Gateway ne produit aucune interprétation scientifique et ne promeut aucune construction linguistique en statut métier du Project.

La règle déterministe nouvelle `SOURCE_CLAIM_NOT_YET_IS_NOT_UNCERTAINTY` refuse une auto-attestation provider qui classerait le seul `not yet / pas encore` comme incertitude.

## 4. Références courantes et séparation des gates

Le nouvel évaluateur courant expose quatre axes indépendants :

1. `PRODUCT_SCHEMA_STATUS` ;
2. `PRODUCT_CONTRACT_STATUS` ;
3. `REFERENCE_AGREEMENT_STATUS` et son autorité ;
4. `HUMAN_VISIBLE_TRANSLATION_STATUS`.

Un payload peut donc être conforme au schéma et au contrat tout en divergeant d'une référence. Aucun agrégat `8/8`, pourcentage, taux de fidélité ou classement de modèle n'est calculé.

### Références CASE-04 et CASE-05

| Cas | Référence antérieure | Référence courante | Autorité courante |
|---|---|---|---|
| CASE-04 | NEGATION=PRESENT ; UNCERTAINTY=PRESENT ; TEMPORAL_RELATION non spécifiée ; référence synthétique préengagée, non adjugée | NEGATION=PRESENT ; UNCERTAINTY=ABSENT ; TEMPORAL_RELATION=PRESENT | HUMAN_ADJUDICATED / EXPLICIT_USER_DECISION / 2026-09-08 |
| CASE-05 | NEGATION=PRESENT ; UNCERTAINTY=PRESENT ; TEMPORAL_RELATION non spécifiée ; référence synthétique préengagée, non adjugée | NEGATION=PRESENT ; UNCERTAINTY=ABSENT ; TEMPORAL_RELATION=PRESENT | HUMAN_ADJUDICATED / EXPLICIT_USER_DECISION / 2026-09-08 |

## 5. Requalification historique sans appel provider

Les 16 sorties historiques ont été relues localement avec le parser, le validator 1.4.0 et les références humaines courantes. Les artefacts sources n'ont pas été réécrits.

| Sortie | Schema | Contrat produit 1.4.0 | Accord référence courante | Traduction visible |
|---|---|---|---|---|
| Luna CASE-04 | PASS | FAIL — `SOURCE_CLAIM_NOT_YET_IS_NOT_UNCERTAINTY` | DISAGREE — le payload revendique UNCERTAINTY=PRESENT | NOT_REVIEWED dans l'artefact historique |
| Luna CASE-05 | PASS | PASS | AGREE | NOT_REVIEWED dans l'artefact historique |
| Terra CASE-04 | PASS | PASS | AGREE | NOT_REVIEWED dans l'artefact historique |
| Terra CASE-05 | PASS | PASS | AGREE | NOT_REVIEWED dans l'artefact historique |

La non-conformité rétrospective Luna CASE-04 est un résultat du contrat 1.4.0, et non une altération de l'artefact ni un verdict de mauvaise traduction visible. Les deux textes visibles CASE-04/05 conservent la relation `not yet / pas encore`; le défaut porte sur l'attestation structurée historique de CASE-04. Le choix Luna reste la décision opérationnelle provisoire demandée et doit maintenant être éprouvé sur de nouvelles sorties 1.4.0 lors de la mission suivante.

## 6. Réutilisation OpenAI et migration Luna

L'intégration existante de la Responses API dans `api/protocol-designer-openai-extraction-provider.ts` est réutilisée. Le transport HTTP est factorisé une fois dans ce propriétaire ; aucun second client, registry, orchestrateur, fallback ou moteur multi-provider n'a été créé.

Ownership observé :

- client et transport Responses API : `api/protocol-designer-openai-extraction-provider.ts` ;
- secret `OPENAI_API_KEY` et injection au handler : environnement d'exécution puis `api/protocol-designer-bridge.ts` ;
- mapping d'erreur provider : `ProductBridgeProviderError` dans `api/protocol-designer-bridge-provider.ts`, appliqué par le transport partagé ;
- matérialisation de l'usage provider : adapter OpenAI, puis contrat Gateway ;
- schéma, parser et validator structurés : `conversation-language-gateway.ts` ;
- sélection provider/modèle/effort du Language Gateway : constantes contractuelles Gateway, appliquées explicitement par `api/protocol-designer-bridge.ts`.

Le payload Language Gateway produit :

- utilise `POST https://api.openai.com/v1/responses` ;
- fixe `model=gpt-5.6-luna` et `reasoning.effort=low` dans le chemin produit ;
- transmet le schéma NOXIA unique `conversation_language_projection_v1_4_0` via `text.format=json_schema` ;
- conserve `store=false` ;
- parse puis valide localement la projection avant matérialisation ;
- matérialise response ID, modèle, effort, input/output/reasoning/cached tokens lorsqu'ils sont disponibles ;
- échoue en fail-closed au premier défaut ;
- n'effectue aucun retry, fallback Gemini ou escalade d'effort automatique.

Gemini reste présent dans l'adapter historique comme comparateur DEV/TEST. Le chemin produit `LANGUAGE_PROJECTION` ne l'appelle plus et ne l'utilise pas comme fallback. La conversation naturelle et les autres usages Gemini sont hors périmètre et inchangés.

## 7. Frontière de contexte du Language Gateway

### État observé avant modification

Le payload 1.3.0 était déjà construit exclusivement depuis : texte source courant, langue source, langue cible, littéraux protégés résolus, contrat/prompt d'invariants et schéma de sortie. L'objet `LanguageProjectionRequest` ne portait ni transcript, ni Project, ni OwnerResults, ni portfolio documentaire, ni corpus Knowledge.

`CURRENT_GATEWAY_CONTEXT_INPUTS = CURRENT_SOURCE_TEXT + SOURCE_LANGUAGE + TARGET_LANGUAGE + PROTECTED_LITERALS + REQUIRED_STRUCTURED_INVARIANT_CONTRACT`

`CURRENT_GATEWAY_CONTEXT_TOKEN_COUNT_METHOD = PROVIDER_USAGE_IF_AVAILABLE ; NO_PRE_REQUEST_TOKEN_ESTIMATE`

`UNBOUNDED_CONTEXT_DEFECT_FOUND = NO`

### État 1.4.0

Le contenu scientifique transmis reste identique en portée. La modification ajoute une frontière observable :

- `contextScopeId = LANGUAGE_GATEWAY_CURRENT_SOURCE_TEXT_V1` ;
- digest du texte source ;
- digest des littéraux protégés ;
- référence du contrat structuré requis ;
- `localLinguisticContextRefs = []` ;
- `tokenCountMethod = PROVIDER_USAGE_IF_AVAILABLE`.

La projection de contexte déclare et teste explicitement : transcript complet absent, Project complet absent, OwnerResults absents, documents absents, Knowledge absent. L'ajout d'un historique arbitrairement long et non consommé ne modifie pas le payload sémantique.

Aucun mécanisme préexistant de sélection anaphorique locale, bornée, identifié et réutilisable n'a été trouvé au niveau du Gateway. Aucun nouveau Context Engine n'a donc été créé.

`LOCAL_LINGUISTIC_CONTEXT_SELECTION_GAP = YES`

## 8. Audit read-only des contextes des autres owners

Cet audit décrit les contrats/code paths courants ; il ne qualifie pas encore leur comportement sous stress de contexte long.

| Component | Input context contract | Project id/version/digest | Full transcript | Owner-scoped view | Upstream result refs | Stale filter | Token accounting | Current status | Gap |
|---|---|---|---|---|---|---|---|---|---|
| Product Entry Router | texte du tour + `previous ScientificSessionContext` borné | NO | NO | YES | NO | N/A | NO | déterministe, borné | aucun budget token nécessaire ; conservation du contexte scientifique limitée par le contrat |
| QRY | projectRef/version + `QueryNavigationSourceState`, branches fermées et besoins résolus | PARTIAL — id/ref + version, sans digest Project dans ce contrat | NO | YES | YES, via refs/version/provenance des besoins | YES — version/sourceState digest et lifecycle | NO | projection déterministe bornée | identité Project sans digest explicite dans `QueryNavigationContext` |
| Persistent Project Extraction | dernier tour utilisateur, catalogue d'ancres, 4 propositions NOXIA récentes, projection du Project courant | YES | REQUEST=YES ; PAYLOAD PROVIDER=NO | YES | YES | PARTIAL — Project courant fourni, pas de gate stale autonome dans l'adapter | YES, usage provider | transcript provider borné ; contexte Project proportionnel au Project courant | taille de la projection Project et du catalogue à éprouver en stress long |
| Scientific Thinking | `ProjectContextSnapshot` exact + éventuel résultat Knowledge courant | YES | NO | YES | YES | YES — binding et dépendance Knowledge exacts | N/A, runtime local | borné et versionné | aucun constat bloquant |
| Study Design | `ProjectContextSnapshot` exact | YES | NO | YES | NO pour l'entrée initiale | YES — identité snapshot stricte | N/A, runtime local | borné et versionné | aucun constat bloquant |
| OBS | snapshot exact + derniers handoffs ST/Study Design applicables + éventuel Knowledge | YES | NO | YES | YES | YES — Project/snapshot exacts et déduplication par owner | N/A, runtime local | owner-scoped | volume cumulé des payloads spécialisés à éprouver en stress long |
| Imaging | snapshot exact + résultats OBS/Study Design applicables au même snapshot | YES | NO | YES | YES | YES — filtres Project/version/digest/snapshot | N/A, runtime local | owner-scoped | volume des résultats amont à éprouver en stress long |
| Biostatistics | snapshot exact + derniers handoffs applicables des owners autorisés | YES | NO | YES | YES, avec digests/provenance | YES — filtres Project/version/digest/snapshot | N/A, runtime local | owner-scoped | volume des résultats amont à éprouver en stress long |
| CDM | snapshot exact + selected need + upstream inputs explicitement fournis | YES | NO | YES | YES, avec contrôle ledger | YES — identité Project et dépendances | N/A, runtime local | owner-scoped | politique uniforme de budget de taille non démontrée |
| Data Management | snapshot exact + résultat CDM courant exigé | YES | NO | YES | YES | YES — résultat CDM strictement lié au snapshot | N/A, runtime local | owner-scoped | aucun constat bloquant |
| TMP / DOC | snapshot Project, objets/relations/temporalités typés par actuality, décisions humaines et projections exactes | YES | NO | YES | YES | YES — DOC consomme les objets CURRENT et marque les projections antérieures STALE ; TMP conserve les superseded comme tels | N/A, déterministe | projection structurée et versionnée | cohérence de fin d'étude et non-contamination par superseded à tester sous stress |

### Findings hors périmètre

1. Le provider de conversation naturelle reçoit le Project courant et les dix derniers tours ; ce corridor n'est pas le Language Gateway et n'a pas été modifié.
2. Persistent Project Extraction reçoit une projection complète du Project courant et son payload peut donc croître avec celui-ci, bien que le transcript provider soit borné.
3. QRY ne porte pas le digest Project dans son propre contexte, mais lie version et digest de sourceState ; aucune modification n'était autorisée ici.
4. Les owners locaux n'ont pas de comptage token, ce qui est non applicable tant qu'ils n'appellent pas de provider ; aucune politique transversale de taille de contexte n'est démontrée.
5. La cohérence globale avec versions multiples, OwnerResults nombreux, contradictions, documents partiels et objets superseded reste non qualifiée.

Ces éléments sont enregistrés sans correction sous `OUT_OF_SCOPE_CONTEXT_FINDING` et justifient la mission différée `END_OF_STUDY_CONTEXT_STRESS_01`.

## 9. TRACE v2

TRACE reste l'unique système de faits, passif et non décisionnaire. Son profil observable passe de `1.4.0` à `1.5.0` pour ajouter `SCIENTIFIC_TRACE_PROVIDER_EXECUTION` : provider/executor, modèle, effort, response ID, context scope, refs/digests et compteurs de tokens. Les versions antérieures 1.0–1.4 restent acceptées.

TRACE n'enregistre pas le transcript complet pour décrire le contexte. Les noms de compteurs de tokens sont explicitement autorisés par le garde de sécurité sans élargir l'autorisation aux secrets, API keys, credentials, auth headers ou raw prompts.

## 10. Qualification locale

- Suites Language Gateway, contrats de référence, frontière de contexte, adapter OpenAI, TRACE et non-régressions RC04/RC05/RC06/RC07/RC08 : `17 fichiers / 305 PASS`.
- Suites Standard/Expert affectées : `7 fichiers / 59 PASS`.
- TypeScript : PASS pour application, API Vercel et serveur scientifique.
- Lint du périmètre affecté : PASS.
- Build production : PASS, 2 077 modules transformés. Les warnings Browserslist, annotation Rollup, CSS existante et taille de chunks ne sont pas causaux ici.
- Suite canonique complète, exécutée une seule fois : 238 fichiers PASS, 2 SKIP, 1 FAIL ; 3 661 tests PASS, 12 SKIP, 1 TODO, 1 FAIL.
- Échec historique inchangé : `src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx`.
- Nouvelles régressions : 0.
- `git diff --check` : PASS.

Un test local non suivi et préexistant, `project-persistence-01.test.ts`, contient un digest figé déjà incompatible avec le HEAD de départ. Il n'est pas découvert par la suite canonique, n'a pas été modifié et reste hors candidat comme tous les artefacts non suivis historiques.

## 11. Git boundary

Le commit produit contient exactement dix fichiers : les deux adapters API concernés, le contrat Gateway, l'évaluateur courant, TRACE, le wiring workspace et quatre fichiers de tests. Aucun artefact `validation/`, aucun rapport historique et aucun autre owner n'y figurent.

`HEAD_BEFORE = 8c72184b1e2f726cbaefe9817762cb3130c3dd9f`

`HEAD_AFTER_PRODUCT_CHANGE = 9675ebac2dbc77ee268e2d83a7351b9d49c82e29`

`PRODUCT_COMMIT = 9675ebac2dbc77ee268e2d83a7351b9d49c82e29`

`REPORT_COMMIT = RESOLVED_AFTER_THIS_DOCUMENT_COMMIT`

`PUSH = NO`

`DEPLOYMENT = NO`

## 12. Rapport exact demandé

```ini
MISSION_STATUS = QUALIFIED_FIC02_OPENAI_LUNA_LOW_REFREEZE_CANDIDATE_READY

HEAD_BEFORE = 8c72184b1e2f726cbaefe9817762cb3130c3dd9f
HEAD_AFTER_PRODUCT_CHANGE = 9675ebac2dbc77ee268e2d83a7351b9d49c82e29
HEAD_FINAL = RESOLVED_AFTER_REPORT_COMMIT

PRODUCT_COMMIT = 9675ebac2dbc77ee268e2d83a7351b9d49c82e29
REPORT_COMMIT = RESOLVED_AFTER_REPORT_COMMIT

LANGUAGE_GATEWAY_VERSION_BEFORE = 1.3.0
LANGUAGE_GATEWAY_VERSION_AFTER = 1.4.0

TARGET_PROVIDER = OPENAI
TARGET_MODEL = gpt-5.6-luna
TARGET_REASONING_EFFORT = low

MODEL_SELECTION_STATUS = PROVISIONAL_OPERATIONAL_BASELINE_PENDING_PRODUCT_REPLAY
AUTOMATIC_REASONING_EFFORT_ESCALATION = NO
SUPPORTED_FUTURE_LUNA_EFFORTS = low, medium, high
TERRA_SELECTION_STATUS = DEFERRED_NOT_SELECTED

UNCERTAINTY_BOUNDARY_CLARIFIED = YES
NOT_YET_NOT_AUTOMATIC_UNCERTAINTY = YES
NOT_YET_TEMPORAL_PRESERVATION = PASS

CASE_04_REFERENCE_BEFORE = NEGATION_PRESENT__UNCERTAINTY_PRESENT__TEMPORAL_UNSPECIFIED__PRECOMMITTED_SYNTHETIC_NOT_HUMAN_ADJUDICATED
CASE_04_REFERENCE_AFTER = NEGATION_PRESENT__UNCERTAINTY_ABSENT__TEMPORAL_RELATION_PRESENT
CASE_04_REFERENCE_PROVENANCE = HUMAN_ADJUDICATED__EXPLICIT_USER_DECISION__2026_09_08

CASE_05_REFERENCE_BEFORE = NEGATION_PRESENT__UNCERTAINTY_PRESENT__TEMPORAL_UNSPECIFIED__PRECOMMITTED_SYNTHETIC_NOT_HUMAN_ADJUDICATED
CASE_05_REFERENCE_AFTER = NEGATION_PRESENT__UNCERTAINTY_ABSENT__TEMPORAL_RELATION_PRESENT
CASE_05_REFERENCE_PROVENANCE = HUMAN_ADJUDICATED__EXPLICIT_USER_DECISION__2026_09_08

PRODUCT_GATE_REFERENCE_GATE_SEPARATION = PASS

HISTORICAL_OPENAI_ARTIFACTS_CHANGED = 0
HISTORICAL_FIC02_ARTIFACTS_CHANGED = 0

HISTORICAL_LUNA_CASE_04_REQUALIFICATION = SCHEMA_PASS__PRODUCT_CONTRACT_FAIL_SOURCE_CLAIM_NOT_YET_IS_NOT_UNCERTAINTY__REFERENCE_DISAGREE__VISIBLE_NOT_REVIEWED
HISTORICAL_LUNA_CASE_05_REQUALIFICATION = SCHEMA_PASS__PRODUCT_CONTRACT_PASS__REFERENCE_AGREE__VISIBLE_NOT_REVIEWED
HISTORICAL_TERRA_CASE_04_REQUALIFICATION = SCHEMA_PASS__PRODUCT_CONTRACT_PASS__REFERENCE_AGREE__VISIBLE_NOT_REVIEWED
HISTORICAL_TERRA_CASE_05_REQUALIFICATION = SCHEMA_PASS__PRODUCT_CONTRACT_PASS__REFERENCE_AGREE__VISIBLE_NOT_REVIEWED

OPENAI_INFRASTRUCTURE_REUSED = YES
OPENAI_CLIENT_OWNER = api/protocol-designer-openai-extraction-provider.ts
OPENAI_RESPONSES_API_OWNER = api/protocol-designer-openai-extraction-provider.ts
OPENAI_API_KEY_OWNER = RUNTIME_ENVIRONMENT_OPENAI_API_KEY_INJECTED_BY_api/protocol-designer-bridge.ts
OPENAI_ERROR_MAPPING_OWNER = ProductBridgeProviderError__api/protocol-designer-bridge-provider.ts
OPENAI_USAGE_ACCOUNTING_OWNER = api/protocol-designer-openai-extraction-provider.ts__MATERIALIZED_BY_conversation-language-gateway.ts
OPENAI_STRUCTURED_OUTPUT_OWNER = conversation-language-gateway.ts__SCHEMA_PARSER_VALIDATOR
LANGUAGE_GATEWAY_PROVIDER_OWNER = api/protocol-designer-bridge.ts
LANGUAGE_GATEWAY_CONFIGURATION_OWNER = conversation-language-gateway.ts
OPENAI_API_ENDPOINT = https://api.openai.com/v1/responses
OPENAI_STRUCTURED_OUTPUT_MODE = RESPONSES_TEXT_FORMAT_JSON_SCHEMA
OPENAI_LANGUAGE_GATEWAY_ADAPTER_OWNER = api/protocol-designer-openai-extraction-provider.ts
OPENAI_SCHEMA_IDENTITY = conversation_language_projection_v1_4_0

GEMINI_ADAPTER_STATUS = RETAINED_UNCHANGED
GEMINI_POST_MIGRATION_ROLE = DEV_TEST_COMPARATOR_ONLY
AUTOMATIC_PROVIDER_FALLBACK = NO

LANGUAGE_GATEWAY_CONTEXT_SCOPE_BEFORE = CURRENT_SOURCE_TEXT__SOURCE_LANGUAGE__TARGET_LANGUAGE__PROTECTED_LITERALS__REQUIRED_STRUCTURED_INVARIANT_CONTRACT
LANGUAGE_GATEWAY_CONTEXT_SCOPE_AFTER = CURRENT_SOURCE_TEXT__SOURCE_LANGUAGE__TARGET_LANGUAGE__PROTECTED_LITERALS__REQUIRED_STRUCTURED_INVARIANT_CONTRACT__BOUNDED_CONTEXT_IDENTITY_AND_DIGEST_REFS
CURRENT_GATEWAY_CONTEXT_INPUTS = CURRENT_SOURCE_TEXT__SOURCE_LANGUAGE__TARGET_LANGUAGE__PROTECTED_LITERALS__REQUIRED_STRUCTURED_INVARIANT_CONTRACT
CURRENT_GATEWAY_CONTEXT_TOKEN_COUNT_METHOD = PROVIDER_USAGE_IF_AVAILABLE__NO_PRE_REQUEST_TOKEN_ESTIMATE

CURRENT_GATEWAY_RECEIVES_FULL_TRANSCRIPT = NO
CURRENT_GATEWAY_RECEIVES_FULL_PROJECT = NO
CURRENT_GATEWAY_RECEIVES_OWNER_RESULTS = NO
CURRENT_GATEWAY_RECEIVES_DOCUMENT_PORTFOLIO = NO
CURRENT_GATEWAY_RECEIVES_KNOWLEDGE_CORPUS = NO

UNBOUNDED_CONTEXT_DEFECT_FOUND = NO
UNBOUNDED_CONTEXT_DEFECT_REPAIRED = NOT_APPLICABLE
LOCAL_LINGUISTIC_CONTEXT_SELECTION_GAP = YES

CONTEXT_BOUNDARY_TESTS = PASS
CONTEXT_TOKEN_ACCOUNTING = PROVIDER_USAGE_IF_AVAILABLE__PRE_REQUEST_ESTIMATE_NOT_IMPLEMENTED
CONTEXT_PROVENANCE = PASS__CONTEXT_SCOPE_ID_AND_ITEM_DIGEST_REFS
FULL_TRANSCRIPT_AS_SCIENTIFIC_CONTEXT = NO

OTHER_OWNER_CONTEXT_AUDIT = READ_ONLY_COMPLETE

OUT_OF_SCOPE_CONTEXT_FINDINGS = NATURAL_CONVERSATION_LAST_10_TURNS_PLUS_CURRENT_PROJECT__PERSISTENT_EXTRACTION_PROJECT_SCALED_CONTEXT__QRY_PROJECT_DIGEST_ABSENT_FROM_CONTEXT__NO_TRANSVERSE_CONTEXT_SIZE_BUDGET__END_OF_STUDY_STRESS_UNQUALIFIED

DEFERRED_REQUIRED_MISSION = END_OF_STUDY_CONTEXT_STRESS_01

LANGUAGE_TARGETED_TESTS = PASS__IN_AGGREGATE_17_FILES_305_TESTS
REFERENCE_EVALUATOR_TESTS = PASS
CONTEXT_BOUNDARY_TESTS = PASS
OPENAI_ADAPTER_TESTS = PASS
TRACE_TARGETED_TESTS = PASS
AFFECTED_STANDARD_TESTS = PASS__7_FILES_59_TESTS

TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS
FULL_SUITE_PASS = 3661
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL = 1
HISTORICAL_FAILURES = src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx
NEW_REGRESSIONS = 0
GIT_DIFF_CHECK = PASS

PROVIDER_CALLS = 0
OPENAI_CALLS = 0
GEMINI_CALLS = 0

FIC02_REPLAY = NO
FIC02_DEFINITION_CHANGED = NO

TRACKED_WORKTREE_CHANGES_AFTER_COMMIT = 0_EXPECTED_AFTER_REPORT_COMMIT
STAGED_FILES_AFTER_COMMIT = 0_EXPECTED_AFTER_REPORT_COMMIT
PRESERVED_UNTRACKED_FILES = 262_EXPECTED_AFTER_REPORT_COMMIT

PUSH = NO
DEPLOYMENT = NO

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO

NEXT_ACTION = FIC02_OPENAI_LUNA_LOW_PROVIDER_REFREEZE_01
```

## 13. Stop boundary

Aucun appel Luna, Gemini ou Terra n'a été effectué. Aucun niveau `medium/high` n'a été testé. FIC02 n'a été ni modifié, ni re-freezé, ni rejoué. La mission `END_OF_STUDY_CONTEXT_STRESS_01` n'a pas été commencée. Aucun push ni déploiement n'a été exécuté.
