# NOXIA — PROTOCOL_DESIGNER_V1_LONG_HORIZON_RUNTIME_STABILIZATION_01

## Rapport de stabilisation runtime long-horizon et contrôle des coûts provider

Date de qualification : 2026-09-14

Repository : `/Users/charles/Documents/Projets/NOXIA/noxia-dev`

Branche : `protocol-designer-canonical-ingestion`

```ini
MISSION_STATUS = LONG_HORIZON_RUNTIME_STABILIZATION_QUALIFIED_LOCAL_CANDIDATE_READY

HEAD_INITIAL = d4216edcf51ad87f7f1257b87c29232d920035f1
PRODUCT_COMMIT = 1db9bde6
REPORT_COMMIT = THIS_DOCUMENT_COMMIT_SEE_FINAL_MISSION_PACKET

PROVIDER_CALLS = 0
OPENAI_CALLS = 0
GEMINI_CALLS = 0

PUSH = NO
DEPLOYMENT = NO

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```

## 1. Baseline et frontière Git

La baseline observée avant modification était :

```ini
BRANCH = protocol-designer-canonical-ingestion
HEAD = d4216edcf51ad87f7f1257b87c29232d920035f1
TRACKED_WORKTREE_CHANGES = 0
STAGED_FILES = 0
PRESERVED_UNTRACKED_FILES = 474
```

Les 474 fichiers non suivis préexistants, notamment les rapports et preuves historiques sous `docs/implementation/` et `validation/`, ont été préservés et exclus des commits par allowlist explicite. Aucun `reset`, `stash`, `clean`, rebase, merge, mass-add, push ou déploiement n'a été effectué.

Le diff produit qualifié avant commit comportait 25 fichiers : 20 fichiers suivis modifiés et 5 nouveaux fichiers source/test, pour 1 830 insertions et 69 suppressions. Le digest SHA-256 du diff suivi avant admission des nouveaux fichiers était :

```ini
TRACKED_DIFF_SHA256_BEFORE_STAGING = 055dbfb1690e8f0b8243faf417c1a7da101fdf6ef1bd26d523cdf441072f9ea2
```

## 2. Autorités et invariants conservés

La modification respecte les frontières actives routées par le `SOURCE-OF-TRUTH-INDEX` :

- le Research Project adopté demeure la source de vérité scientifique versionnée ;
- une candidate ne modifie jamais le Project avant décision humaine ;
- QRY reste propriétaire de la prochaine action et du WHAT ;
- le modèle conversationnel reste un exécuteur du HOW, sans adoption scientifique ;
- TRACE et l'observabilité enregistrent des faits mais ne décident ni ne réparent ;
- la coupure publique est fail-closed et ne crée aucun fallback provider.

```ini
NEW_ROUTER = NO
NEW_OWNER = NO
NEW_ENGINE = NO
NEW_ONTOLOGY = NO
PROJECT_WRITE_BEFORE_HUMAN_DECISION = 0
```

## 3. Instrumentation de coût provider

### 3.1 Contrat observé

Le contrat `PROTOCOL_DESIGNER_PROVIDER_CALL_OBSERVABILITY@1.0.0` est maintenant produit au niveau des adapters réels pour :

- Language Gateway ;
- Persistent Extraction OpenAI ;
- réalisation conversationnelle Gemini.

Chaque tentative enregistre : provider, modèle demandé et retourné, version modèle, responsabilité, effort de raisonnement, tokens d'entrée, tokens d'entrée cachés, écritures de cache si disponibles, tokens de sortie, reasoning tokens, total, latence, index et raison de retry, turn/session/request IDs, request/response IDs provider, statut, coût estimé et coût cumulé de session.

Le coût cumulé est conservé indépendamment de la fenêtre bornée des traces UI ; la troncature de l'affichage ne peut donc pas faire diminuer artificiellement le coût de session.

```ini
PROVIDER_OBSERVABILITY = PASS
PROVIDER_ADAPTER_BOUNDARY = PASS
REQUEST_RESPONSE_CORRELATION = PASS
USAGE_MATERIALIZATION = PASS
LATENCY_MATERIALIZATION = PASS
RETRY_METADATA = PASS
CUMULATIVE_SESSION_COST_MONOTONIC = PASS
UNKNOWN_MODEL_COST = UNKNOWN_NOT_ZERO
```

### 3.2 Snapshot tarifaire

Le calcul est reproductible avec un snapshot daté du 2026-09-14 ; il ne constitue pas une facture. Sources officielles consultées :

- OpenAI GPT-5.6 Luna : <https://developers.openai.com/api/docs/models/gpt-5.6-luna>
- OpenAI GPT-5.6 Terra : <https://developers.openai.com/api/docs/models/gpt-5.6-terra>
- Google Gemini pricing : <https://ai.google.dev/gemini-api/docs/pricing>

Tarifs textuels utilisés, en USD par million de tokens :

| Modèle | Entrée | Entrée cachée | Écriture cache | Sortie |
|---|---:|---:|---:|---:|
| gpt-5.6-luna | 0,20 | 0,02 | 0,25 | 1,20 |
| gpt-5.6-terra | 2,00 | 0,20 | 2,50 | 12,00 |
| gemini-3.5-flash-lite | 0,30 | 0,03 | non exposé | 2,50 |

### 3.3 Waterfall historique réévalué

La preuve historique durable réutilisée est `validation/frozen-integrated-campaign-02-openai-luna-low/execution-01/provider-call-log.json`. Elle contient 16 appels, quatre scénarios A–D à un tour, sans retry. Aucun appel n'a été relancé.

| Scénario | Ordre | Modèle | Purpose | Entrée | Cachée | Sortie | Latence ms | Retry | Coût USD |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|
| A | 1 | Luna | Language input | 1 448 | 0 | 676 | 9 173 | 0 | 0,00117305 |
| A | 2 | Gemini | HOW | 2 059 | 0 | 104 | 20 991 | 0 | 0,00087770 |
| A | 3 | Terra | Persistent extraction | 8 204 | 0 | 2 641 | 32 522 | 0 | 0,05220050 |
| A | 4 | Luna | Language output | 1 517 | 1 344 | 639 | 7 209 | 0 | 0,00083678 |
| B | 1 | Luna | Language input | 1 436 | 1 344 | 556 | 6 883 | 0 | 0,00071693 |
| B | 2 | Gemini | HOW | 1 886 | 0 | 87 | 3 283 | 0 | 0,00078330 |
| B | 3 | Terra | Persistent extraction | 7 967 | 6 404 | 3 685 | 45 227 | 0 | 0,04940680 |
| B | 4 | Luna | Language output | 1 492 | 1 344 | 508 | 6 369 | 0 | 0,00067333 |
| C | 1 | Luna | Language input | 1 432 | 1 344 | 567 | 5 958 | 0 | 0,00072913 |
| C | 2 | Gemini | HOW | 1 721 | 0 | 75 | 1 088 | 0 | 0,00070380 |
| C | 3 | Terra | Persistent extraction | 7 765 | 6 404 | 1 882 | 22 801 | 0 | 0,02726580 |
| C | 4 | Luna | Language output | 1 493 | 1 344 | 603 | 7 285 | 0 | 0,00078758 |
| D | 1 | Luna | Language input | 1 445 | 1 344 | 482 | 4 691 | 0 | 0,00063038 |
| D | 2 | Gemini | HOW | 2 077 | 0 | 98 | 1 164 | 0 | 0,00086810 |
| D | 3 | Terra | Persistent extraction | 8 193 | 6 404 | 2 799 | 32 039 | 0 | 0,03933980 |
| D | 4 | Luna | Language output | 1 504 | 1 344 | 578 | 6 243 | 0 | 0,00076033 |

Agrégats :

| Modèle | Appels | Entrée | Cachée | Sortie | Latence ms | Coût USD | Part |
|---|---:|---:|---:|---:|---:|---:|---:|
| Luna | 8 | 11 767 | 9 408 | 4 609 | 53 811 | 0,00630751 | 3,55 % |
| Gemini | 4 | 7 743 | 0 | 364 | 26 526 | 0,00323290 | 1,82 % |
| Terra | 4 | 32 129 | 19 212 | 11 007 | 132 589 | 0,16821290 | 94,63 % |
| Total | 16 | 51 639 | 28 620 | 15 980 | 212 926 | 0,17775331 | 100 % |

```ini
ESTIMATED_AVERAGE_COST_PER_CALL_USD = 0.01110958
ESTIMATED_AVERAGE_COST_PER_ONE_TURN_SCENARIO_USD = 0.04443833
ESTIMATED_FOUR_SCENARIO_CAMPAIGN_COST_USD = 0.17775331
ESTIMATED_EQUIVALENT_ONE_TURN_CANARY_USD = 0.04443833
OFFLINE_SOAK_COST_USD = 0
LIVE_15_TURN_CONVERSATION_COST = UNKNOWN_NOT_MEASURED
```

La valeur utilisateur historique d'environ 0,30 EUR n'est pas reconstruite comme une facture exacte : devise, dates tarifaires, arrondis de facturation, taxes et éventuels appels non présents dans ce log restent inconnus. Le signal causal est cependant net : l'extraction Terra représente 94,63 % du coût estimé de la preuve disponible. Sur le total estimé, environ 0,13852480 USD proviennent des sorties et 0,03922851 USD du contexte/cache ; les sorties Terra dominent donc davantage que le seul volume d'entrée.

### 3.4 Ordre d'optimisation retenu

1. Éliminer les appels et retries inutiles : réutilisation d'un résultat Scientific Thinking identique et suppression du quota partagé provoquant une attente sans valeur.
2. Réduire/mettre en cache le contexte : la preuve montre un bénéfice du cache, mais Terra reste dominant.
3. Réduire le volume de sortie imposé par le contrat de Persistent Extraction, sans affaiblir fidélité, provenance ou validation.
4. Ne comparer les modèles qu'après ces trois étapes ; aucun changement de modèle n'a été effectué ici.

## 4. Coupure publique temporaire

La surface publique a été désactivée par deux barrières indépendantes :

- UI : le lien et la route publique Protocol Designer ne sont disponibles qu'en mode développement ; la production affiche une page d'indisponibilité temporaire sans formulaire ;
- API : le handler bloque toute requête en environnement `production`/Vercel production avant lecture des credentials et avant tout adapter provider, avec statut 503 et `providerCalls=[]`.

```ini
PUBLIC_PROTOCOL_DESIGNER = DISABLED
LOCAL_PROTOCOL_DESIGNER = AVAILABLE
PUBLIC_NAVIGATION_ENTRY = REMOVED
PRODUCTION_PROVIDER_GATE = FAIL_CLOSED
PUBLIC_SILENT_FALLBACK = NO
PRODUCTION_BLOCK_TEST = PASS
PRODUCTION_BLOCK_HTTP_STATUS = 503
```

Cette preuve est une preuve de code et de test local. Aucun déploiement Production n'a été réalisé dans cette mission ; l'état effectivement déployé reste donc non démontré.

## 5. Harness représentatif du runtime Standard

Le harness monte la vraie page Standard React et agit sur le vrai champ, le bouton réel et les actions Human Review. Il traverse :

```text
Standard UI
→ handler workspace
→ Product Entry Router
→ client Product Bridge
→ handler API
→ validators réels
→ adapters provider réels
→ seule substitution : réponse réseau provider figée
→ candidate lifecycle
→ Human Review
→ Project versionné
→ Project → QRY
→ projection Standard
```

Il n'injecte ni Project final ni OwnerResult et n'appelle pas QRY ou un renderer isolément. La substitution se fait exclusivement sur le transport externe de l'adapter provider.

Le repository ne possède pas Playwright/Puppeteer. La preuve navigateur est donc exécutée sous Vitest/jsdom : elle est représentative du corridor applicatif React/runtime, mais n'est pas une preuve Chromium réelle ni une preuve réseau/live.

### 5.1 Gate historique

Le harness a détecté des classes de rupture auparavant masquées par les helpers :

- une confirmation naturelle telle que `c'est bon` repartait vers Product Entry/Product Bridge au lieu d'adopter la candidate courante ;
- un refus naturel ne disposait pas d'une frontière équivalente aux boutons Human Review ;
- le contexte textuel complet d'un tour pouvait contaminer les rôles de plusieurs objets frères (âge, eligibility, populations vulnérables) ;
- une question de discussion contenant `plutôt que` pouvait être confondue avec une correction de Project ;
- le provider HOW partageait le quota glissant de Scientific Interpretation : après dix démarrages agrégés, une conversation valide pouvait attendre presque 60 secondes, causalement cohérent avec le témoin humain à 56 secondes ;
- une réponse de bridge structurellement invalide est détectée au niveau runtime et reste fail-closed, sans Project.

Le libellé historique exact `Contrat du pont produit invalide.` n'est pas reproductible avec une fixture conforme dans le code courant. Sa frontière reste néanmoins exercée par un replay invalide dédié, qui prouve le rejet fail-closed depuis Standard.

```ini
HARNESS_VALIDATION_GATE = PASS
HELPER_ONLY_PROOF = NO
REAL_STANDARD_HANDLER_TRAVERSED = YES
REAL_PRODUCT_BRIDGE_TRAVERSED = YES
REAL_VALIDATORS_TRAVERSED = YES
PROVIDER_ADAPTER_BOUNDARY_SUBSTITUTED = YES
INVALID_BRIDGE_CONTRACT_FAILS_CLOSED = PASS
```

## 6. Regroupement causal et réparations

### Groupe causal A — cycle de vie des actes naturels

```ini
SYMPTOMS = natural confirmation/refusal fell through to Product Entry; stale busy lifecycle
FIRST_BLOCKING_BOUNDARY = STANDARD_WORKSPACE_PRE_ENTRY_DECISION_BOUNDARY
REAL_OWNER = EXISTING_CONTRIBUTION_LIFECYCLE_IN_STANDARD_WORKSPACE
REPAIR = bounded exact natural-decision grammar + unique current candidate + existing confirm/reject paths
```

La décision naturelle ajoute son tour utilisateur, sa provenance et son motif au chemin existant. Elle ne contourne ni l'accusé de présentation, ni Human Review, ni la confirmation Project. Les boutons existants restent inchangés.

### Groupe causal B — contamination sémantique inter-objets

```ini
SYMPTOMS = sibling objects inherited population/age/exclusion roles from whole-turn witness
FIRST_BLOCKING_BOUNDARY = CONTRIBUTION_TO_PROJECT_OWNER_PROJECTION
REAL_OWNER = RESEARCH_PROJECT_CONSTRUCTION_CONTRIBUTION_ADAPTER
REPAIR = role classification from intrinsic object context; full turn retained only as provenance/witness
```

Le texte source complet peut encore aider à retrouver une valeur d'un objet déjà identifié ; il ne peut plus assigner le même rôle scientifique à tous les objets frères. Aucun vocabulaire IDM/cardio n'a été ajouté.

### Groupe causal C — latence artificielle HOW

```ini
SYMPTOM = valid long conversation sleeps near 60 seconds after aggregate call 10
FIRST_BLOCKING_BOUNDARY = CONVERSATION_PROVIDER_CONCURRENCY_GATE
REAL_OWNER = PRODUCT_BRIDGE_CONVERSATION_PROVIDER_ADAPTER
ROOT_CAUSE = HOW shared Scientific Interpretation rolling-start budget
REPAIR = separate reuse of existing single-concurrency gate without unrelated rolling quota
RETRY_POLICY_CHANGED = NO
FAIL_CLOSED_CHANGED = NO
```

La correction conserve un seul appel concurrent, une seule tentative et le fail-closed. Elle supprime uniquement le couplage entre deux classes de trafic distinctes.

### Groupe causal D — navigation et réutilisation

```ini
SYMPTOMS = discussion misrouted as Project correction; duplicate Scientific Thinking invocation
FIRST_BLOCKING_BOUNDARY = CURRENT_PROJECT_DIRECTION_RECOGNITION_AND_OWNER_DISPATCH
REAL_OWNERS = EXISTING_PROJECT_DIRECTION_RECOGNIZER + SCIENTIFIC_THINKING_DISPATCH
REPAIRS = interrogative guard; reuse exact current Project/purpose owner result
```

Une question contenant `plutôt que` ne devient plus une correction implicite. Un résultat Scientific Thinking strictement lié au même Project/version/digest, au même requestId et au même contrat peut être réutilisé sans second appel owner.

### Groupe causal E — éligibilité de construction

Le signal explicite `essai` est admis dans le vocabulaire générique existant de construction d'étude. Une demande comparative interrogative reste non-construction ; aucune croissance d'une liste de mots-clés métier ou imagerie n'a été introduite.

## 7. Corpus humain immuable T01–T05

Les cinq textes ont été conservés byte-for-byte dans le harness. Résultat :

```ini
T01 = CANDIDATE_PRESENTED_PROJECT_UNCHANGED
T01_HUMAN_CONFIRMATION = PROJECT_REVISION_1
T02 = PARTIAL_ENDPOINT_AND_VARIABLE_CORRECTION_PRESENTED_PROJECT_REVISION_1
T03 = NATURAL_CONFIRMATION_PROJECT_REVISION_2_NO_PROVIDER_CALL
T04 = MULTI_FIELD_POPULATION_CANDIDATE_PRESENTED_PROJECT_REVISION_2
T04_HUMAN_CONFIRMATION = PROJECT_REVISION_3
T05 = USEFUL_GOVERNED_PROPOSAL_FROM_CURRENT_PROJECT_NO_PROVIDER_CALL

EXAMPLE_PACEMAKER_PROMOTED_TO_AUTONOMOUS_RULE = NO
VULNERABLE_POPULATION_LOGICAL_EXCLUSION_PRESERVED = YES
PROJECT_WRITE_BEFORE_HUMAN = 0
```

## 8. Trois conversations longues

Chaque famille contient 15 tours significatifs et est rejouée depuis le tour 1 après les modifications.

### A — IDM/IRM

Décisions testées : candidate initiale, correction partielle du critère, confirmation naturelle, population multi-champs, propositions, réserve, refus d'un suivi à 6 mois, adoption d'un suivi à 12 mois, discussion, retour au Project, ajout exploratoire puis refus.

```ini
SOAK_A_TURNS = 15
SOAK_A_STATUS = PASS
SOAK_A_FINAL_PROJECT_REVISION = 4
SOAK_A_REJECTED_6_MONTH_VISIT_ABSENT = YES
SOAK_A_ADOPTED_12_MONTH_VISIT_PRESENT = YES
SOAK_A_REJECTED_EXPLORATORY_ANALYSIS_ABSENT = YES
SOAK_A_QRY_BINDS_CURRENT_PROJECT = YES
```

### B — clinique non-imagerie

Décisions testées : essai randomisé ouvert diabète, critère principal HbA1c à 24 semaines, hypoglycémies sévères, correction 36 semaines refusée, multicentrique adopté avec incertitude conservée, propositions, discussion et analyse exploratoire refusée.

```ini
SOAK_B_TURNS = 15
SOAK_B_STATUS = PASS
SOAK_B_FINAL_PROJECT_REVISION = 3
SOAK_B_24_WEEK_STATE_PRESERVED = YES
SOAK_B_REJECTED_36_WEEK_CHANGE_ABSENT = YES
SOAK_B_QRY_BINDS_CURRENT_PROJECT = YES
```

### C — non-médical

Décisions testées : étude expérimentale d'alliage, traitements thermiques, fatigue, 60 éprouvettes, vieillissement humide à 40 cycles, correction à 60 cycles refusée, lecture en aveugle adoptée, propositions, discussion et rugosité secondaire refusée.

```ini
SOAK_C_TURNS = 15
SOAK_C_STATUS = PASS
SOAK_C_FINAL_PROJECT_REVISION = 3
SOAK_C_40_CYCLE_STATE_PRESERVED = YES
SOAK_C_REJECTED_60_CYCLE_CHANGE_ABSENT = YES
SOAK_C_QRY_BINDS_CURRENT_PROJECT = YES
```

Les soaks n'ont généré aucun document ; l'absence de contradiction documentaire est donc `NOT_APPLICABLE_NOT_GENERATED`, et non une qualification du corridor DOC.

## 9. Propriétés d'acceptation

```ini
PROPERTY_01_NO_PROJECT_MUTATION_BEFORE_HUMAN_DECISION = PASS
PROPERTY_02_REFUSAL_PRESERVES_CURRENT_PROJECT = PASS
PROPERTY_03_PARTIAL_CORRECTION_PRESERVES_UNCHANGED_PROPERTIES = PASS
PROPERTY_04_RESOLVED_NEED_NOT_GENERICALLY_REASKED = PASS
PROPERTY_05_TRULY_INVALID_BRIDGE_CONTRACT_STILL_FAILS_CLOSED = PASS
PROPERTY_06_EXAMPLE_NOT_PROMOTED_TO_AUTONOMOUS_RULE = PASS
PROPERTY_07_PROPOSAL_OR_UNCERTAINTY_NOT_PROMOTED_TO_FACT = PASS
PROPERTY_08_CURRENT_PROJECT_STATE_DRIVES_NEXT_QRY_ACTION = PASS

NATURAL_CONFIRMATION = PASS
NATURAL_REFUSAL = PASS
PARTIAL_CORRECTION = PASS
MULTI_FIELD_INPUT = PASS
LEAVE_AND_RETURN_TO_PROJECT = PASS
GOVERNED_PROPOSAL = PASS
PROJECT_VERSION_COHERENCE = PASS
SUPERSESSION_COHERENCE = PASS
FATAL_RUNTIME_OR_BRIDGE_CRASH = 0
```

## 10. Qualification technique

Validations finales ou post-correction :

```ini
LONG_HORIZON_PROPERTY_AND_RUNTIME_HARNESS = 2 files / 12 PASS
COMBINED_AFFECTED_RUNTIME_SUITES = 9 files / 137 PASS
CEC_BIOSTATISTICS_CONTEXTUAL_REGRESSIONS = 3 files / 30 PASS
PUBLIC_ROUTE_AND_UI_PERIMETER = 10 files / 76 PASS
POST_COMMIT_CORPUS_SCANNERS = 3 files / 247 PASS

TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS
GIT_DIFF_CHECK = PASS
```

La suite complète a été exécutée une seule fois, conformément à la consigne :

```ini
FULL_SUITE_FILES_PASS = 254
FULL_SUITE_FILES_FAIL = 7
FULL_SUITE_FILES_SKIP = 2
FULL_SUITE_TESTS_PASS = 3915
FULL_SUITE_TESTS_FAIL = 8
FULL_SUITE_TESTS_SKIP = 12
FULL_SUITE_TESTS_TODO = 1
```

Ce run unique avait précédé les dernières corrections ciblées et le commit. Parmi ses échecs observés :

- deux scanners de corpus causés par les cinq nouveaux fichiers source alors encore non suivis : résolus post-commit, `247/247 PASS` ;
- deux régressions ciblées CEC/Biostatistics : corrigées et requalifiées dans leurs suites ciblées ;
- l'échec historique `p-web-02-contract.test.tsx` : reproduit isolément après commit, `9 PASS / 1 FAIL`, assertion de titre historique `Protocol Designer` alors que le titre Standard courant est `Construisons votre projet scientifique` ;
- le log global tronqué n'a pas permis d'attribuer avec certitude les trois autres assertions de deux fichiers. Les périmètres affectés route/UI et runtime ont ensuite passé leurs suites ciblées, mais la suite complète n'a volontairement pas été relancée.

Par conséquent :

```ini
FULL_SUITE_FINAL = NOT_RERUN_BY_INSTRUCTION
KNOWN_HISTORICAL_FAILURE = p-web-02-contract.test.tsx
TARGETED_NEW_REGRESSIONS = 0
GLOBAL_NEW_REGRESSIONS = NOT_FULLY_DEMONSTRATED_AFTER_FINAL_COMMIT
```

Les avertissements de build restent préexistants ou hors causalité : Browserslist ancien, commentaire `react-helmet`, déclaration CSS `-: .TZ` et taille de chunk.

## 11. Niveaux de preuve

```ini
UNIT_PROPERTY = PASS
RUNTIME_BROWSER_REPLAY = PASS
RUNTIME_BROWSER_REPLAY_ENVIRONMENT = VITEST_JSDOM_REAL_REACT_RUNTIME
LIVE_PROVIDER = NOT_RUN
HUMAN_LIVE = NOT_RUN

PRODUCT_WORKS_LIVE = NOT_DEMONSTRATED
PRODUCTION_PUBLIC_GATE_DEPLOYED = NOT_DEMONSTRATED
```

Le mot `PASS` du replay runtime signifie que le vrai corridor applicatif Standard a été traversé avec le seul transport provider substitué. Il ne signifie pas qu'un navigateur Chromium, un provider live ou un humain a validé le candidat.

## 12. Actifs de replay et limites

```ini
HISTORICAL_DURABLE_PROVIDER_FIXTURE_REUSED = YES
NEW_LIVE_PROVIDER_FIXTURE_CAPTURE = NOT_EXERCISED_PROVIDER_CALLS_ZERO
FUTURE_CALL_OBSERVABILITY_IN_API_RESPONSE_AND_SESSION_TRACE = READY
FILESYSTEM_PERSISTENCE_OF_FUTURE_LIVE_FIXTURES = NOT_ADDED
```

Le runtime et la session conservent les observations de tentative, mais une application navigateur/serverless ne peut pas committer automatiquement une nouvelle fixture dans le repository. La persistance durable d'un futur canary devra passer par le mécanisme d'exécution/collecte autorisé de la campagne ; aucune architecture parallèle n'a été ajoutée.

Autres limites :

- aucune campagne provider, aucun paid canary et aucune mesure live longue ;
- aucun test réseau de la coupure publique déployée ;
- aucun stress documentaire ou fin d'étude ;
- aucun benchmark multi-session ;
- la réévaluation historique est en USD avec tarifs datés, pas une reconstruction comptable EUR.

## 13. Fichiers du commit produit

Instrumentation/adapters :

- `src/features/protocol-designer/provider-call-observability.ts`
- `src/features/protocol-designer/product-bridge.ts`
- `src/features/protocol-designer/conversation-language-gateway.ts`
- `api/protocol-designer-bridge.ts`
- `api/protocol-designer-bridge-provider.ts`
- `api/protocol-designer-openai-extraction-provider.ts`

Runtime/ownership :

- `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx`
- `src/features/protocol-designer/functional-reset/session.ts`
- `src/features/protocol-designer/functional-reset/product-entry-routing.ts`
- `src/features/protocol-designer/functional-reset/scientific-thinking-standard.ts`
- `src/features/protocol-designer/intake/journey.ts`
- `src/features/query-navigation/current-navigation-evidence.ts`
- `src/features/query-navigation/current-turn-navigation.ts`
- `src/features/research-project-construction/contribution-owner-boundary.ts`

Coupure publique :

- `src/features/protocol-designer/public-runtime-access.ts`
- `src/pages/ProtocolDesignerUnavailable.tsx`
- `src/App.tsx`
- `src/components/Header.tsx`

Tests/fixtures :

- `src/features/protocol-designer/__tests__/v1-long-horizon-runtime-stabilization-01.test.ts`
- `src/features/protocol-designer/functional-reset/__tests__/v1-long-horizon-runtime-harness.test.tsx`
- quatre fichiers de tests/fixtures Functional Reset affectés ;
- un test QRY conformance/context affecté.

## 14. Décision finale

Le candidat atteint la condition de sortie locale : harness représentatif validé et trois conversations de 15 tours passées depuis leur premier tour. Il corrige des causes communes plutôt qu'une succession de micro-prompts et rend les coûts provider observables avant toute décision de modèle.

Il n'est pas déclaré live-ready au sens provider/humain : ces niveaux n'ont pas été exécutés. L'étape suivante, si elle est autorisée ultérieurement, est un unique canary humain/provider après promotion explicite ; au premier échec, l'appel doit être capturé puis le travail revenir offline sans second canary immédiat.

```ini
HARNESS_RUNTIME_REPRESENTATIVE = YES
THREE_LONG_SOAKS = PASS
PUBLIC_COST_GENERATION_DISABLED_IN_CANDIDATE = YES
PROVIDER_COST_CONTROL_READY = YES

LOCAL_APPLICATION_READY_FOR_HUMAN_REVIEW = YES
NEXT_ACTION = USER_LOCAL_HUMAN_REVIEW_THEN_SEPARATE_PROMOTION_AUTHORIZATION_IF_ACCEPTED

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```
