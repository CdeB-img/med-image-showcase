──────────────────────────────────────────────────────────────────────────────
SEM-001R3I — Development Closure
Qualification Development complète après fermeture des réparations ciblées
──────────────────────────────────────────────────────────────────────────────

Modèle recommandé :
GPT-5.6 Sol

Niveau de raisonnement :
Élevé

IMPORTANT — ÉCONOMIE CODEX ET LLM

Cette mission est une campagne de fermeture.

Ne pas reconstruire l'historique SEM.
Ne pas refaire une analyse architecturale générale.
Ne pas relire intégralement les anciens rapports sauf nécessité précise.

Réutiliser les artefacts, checkpoints, diagnostics et rapports existants.

Principe obligatoire :

CALL_LLM_ONLY_IF_REQUIRED.

Toute étape déterministe ou checkpoint compatible
doit être réutilisée.

──────────────────────────────────────────────────────────────────────────────
BASELINE
──────────────────────────────────────────────────────────────────────────────

Rapport principal :

docs/sem-001r3b-development-semantic-repair-report.md

Dernière décision :

R3H_TARGETED_DEVELOPMENT_REPAIRS_PASSED

État démontré :

D02 : PASS
D16 : PASS
D19 : PASS
D21 : PASS
D23 : PASS
D28 : PASS

D21 :

Explicit Object Recall = 1
Explicit Relation Recall = 1
Critical Semantic Recall = 1
absolute blockers = 0
Critical Unsupported Inference = 0
route correct = true

D28 :

Explicit Object Recall = 1
Explicit Relation Recall = 1
Critical Semantic Recall = 1
absolute blockers = 0
Critical Unsupported Inference = 0
route correct = true

Les réparations ciblées Development connues
sont donc fermées.

Les 24 autres cas Development
restent à rendre compatibles
avec la configuration SEM courante.

Holdout :

NOT_STARTED_FORBIDDEN.

──────────────────────────────────────────────────────────────────────────────
MISSION
──────────────────────────────────────────────────────────────────────────────

Obtenir une vue Development :

30/30 COMPLETE

sous une configuration sémantiquement homogène,

puis calculer les métriques Development complètes.

Cette mission NE DOIT PAS ouvrir le Holdout.

──────────────────────────────────────────────────────────────────────────────
GOUVERNANCE
──────────────────────────────────────────────────────────────────────────────

Avant modification substantielle :

1. lire :
   0. NOXIA — SOURCE-OF-TRUTH-INDEX.md

2. consulter selon sa hiérarchie :
   - Charte fondatrice ;
   - Scientific Product Manifesto V2 ;
   - Editorial Engine Architecture Manifesto.

3. consulter uniquement les autorités spécialisées
   réellement nécessaires à une décision.

Ne pas relire par défaut
toute la documentation historique SEM.

Le rapport R3B–R3H constitue
la preuve d'implémentation de continuité,
pas une autorité normative.

Ne modifier aucune autorité.

──────────────────────────────────────────────────────────────────────────────
ÉTAPE 1 — INVENTAIRE DES CHECKPOINTS
──────────────────────────────────────────────────────────────────────────────

Avant tout appel LLM :

établir pour les 30 Development cases :

caseId

reconstruction status

base critic status

atomic/composition audit status

canonicalization status

evaluation status

metrics status

dependency digests

compatibility avec la configuration R3H.

Classer chaque étage :

REUSE_COMPATIBLE

DETERMINISTIC_RECOMPUTE

LLM_REQUIRED

INVALID.

Ne jamais recalculer
un étage REUSE_COMPATIBLE.

──────────────────────────────────────────────────────────────────────────────
ÉTAPE 2 — PLAN MINIMAL D'APPELS
──────────────────────────────────────────────────────────────────────────────

Construire AVANT exécution :

development-r3i-call-plan.json

avec :

- nombre de cas ;
- appels reconstruction nécessaires ;
- appels critic nécessaires ;
- audits conditionnels nécessaires ;
- retries maximum ;
- appels évités par cache ;
- appels déterministes ;
- estimation basse / haute de consommation.

Objectif :

minimiser le nombre réel d'appels Gemini.

Les 30 reconstructions historiques
doivent être réutilisées
si leurs dépendances sont toujours compatibles.

Ne pas relancer
les six cas ciblés déjà fermés
si leurs checkpoints sont compatibles.

──────────────────────────────────────────────────────────────────────────────
ÉTAPE 3 — EXÉCUTION DES 24 CAS RESTANTS
──────────────────────────────────────────────────────────────────────────────

Traiter uniquement les étages réellement invalidés.

Ordre :

checkpoint compatible
→ éventuel critic/audit LLM requis
→ réparation déterministe
→ canonicalisation
→ évaluation
→ métrique.

Ne pas lancer automatiquement
un audit atomique/composition
sur chaque cas.

L'utiliser uniquement
lorsque ses conditions d'activation génériques
sont remplies.

──────────────────────────────────────────────────────────────────────────────
ROBUSTESSE PROVIDER
──────────────────────────────────────────────────────────────────────────────

Provider :

Gemini 3.5 Flash Lite
avec l'identifiant API réellement configuré.

CONCURRENCY = 1.

MAX_REQUEST_STARTS_PER_MINUTE = 5.

Pour :

429
502
503
504
timeout
network transient

autoriser jusqu'à :

5 tentatives maximum par opération,

avec au minimum :

60 secondes entre tentatives
pour 429 / 502 / 503 / 504
si aucun Retry-After plus précis n'est fourni.

Respecter Retry-After en priorité.

Ne jamais recommencer
une opération déjà COMPLETE.

Circuit breaker :

si 3 opérations indépendantes
épuisent chacune leurs retries
sur une panne provider comparable :

STOP_PROVIDER_CAPACITY.

Ne pas brûler le quota restant.

──────────────────────────────────────────────────────────────────────────────
INVALID STRUCTURED OUTPUT
──────────────────────────────────────────────────────────────────────────────

Ne pas confondre :

provider failure

et

structured-output failure.

Pour une sortie structurée invalide :

conserver l'artefact brut sécurisé

+

validation paths

+

classification.

Autoriser au maximum
les corrections structurées prévues
par le contrat existant.

Ne pas inventer
les champs manquants côté parser.

──────────────────────────────────────────────────────────────────────────────
CHECKPOINT APRÈS CHAQUE CAS
──────────────────────────────────────────────────────────────────────────────

Après chaque cas COMPLETE :

persister immédiatement
tous les étages.

La campagne doit être resumable.

Une interruption provider
ne doit jamais imposer
de rappeler les cas déjà complets.

──────────────────────────────────────────────────────────────────────────────
GATE DEVELOPMENT
──────────────────────────────────────────────────────────────────────────────

Condition avant toute métrique globale :

30/30 Development COMPLETE.

Sinon :

ne pas calculer
de métriques officielles agrégées.

──────────────────────────────────────────────────────────────────────────────
MÉTRIQUES DEVELOPMENT
──────────────────────────────────────────────────────────────────────────────

Sur 30/30 :

calculer exactement les métriques historiques :

Critical Semantic Recall

Explicit Object Recall

Explicit Relation Recall

Comparator Preservation

Intervention Preservation

Modality Preservation

Semantic Drift Rate

Unsupported Inference Rate

Critical Unsupported Inference Rate

Ellipsis Detection Rate

Ambiguity Preservation Rate

Unnecessary Clarification Rate

Route Correctness

Correction Propagation Rate

Multi-turn Context Preservation

Generic-Domain Collapse Rate.

Publier :

numérateur
dénominateur
score
cas en erreur.

──────────────────────────────────────────────────────────────────────────────
REPÈRES DE QUALIFICATION
──────────────────────────────────────────────────────────────────────────────

Conserver STRICTEMENT :

Critical Semantic Recall >= 0.98

Explicit Object Recall >= 0.98

Explicit Relation Recall >= 0.95

Comparator Preservation = 1.00
sur cas critiques

Intervention Preservation = 1.00
sur cas critiques

Modality Preservation = 1.00
sur cas critiques

Critical Unsupported Inference Rate = 0

Generic-Domain Collapse Rate = 0

Correction Propagation Rate = 1.00

Multi-turn critical context loss = 0.

Ne modifier aucun seuil.

──────────────────────────────────────────────────────────────────────────────
SI DEVELOPMENT ÉCHOUE
──────────────────────────────────────────────────────────────────────────────

Ne pas corriger automatiquement.

Ne pas créer R3J
dans la même mission.

Produire uniquement :

caseId

metric failure

absolute blocker

first divergent stage

failure class

generic or isolated?

recommended owner.

Classes possibles :

TAXONOMY_FAILURE

OBJECT_COVERAGE_FAILURE

RELATION_COVERAGE_FAILURE

COMPOSITION_FAILURE

ROUTING_FAILURE

PROMPT_FAILURE

MODEL_REASONING_FAILURE

CRITIC_FAILURE

CANONICALIZATION_FAILURE

POLARITY_FAILURE

EVALUATOR_FAILURE

PROVIDER_FAILURE

STRUCTURED_OUTPUT_FAILURE

UNKNOWN.

Puis :

STOP_FOR_HUMAN_REVIEW.

──────────────────────────────────────────────────────────────────────────────
SI DEVELOPMENT PASSE
──────────────────────────────────────────────────────────────────────────────

Ne PAS lancer le Holdout.

Créer uniquement
un manifeste de freeze proposé :

semantic-validation/sem-001r3i/
development-freeze-candidate.json

contenant les digests de :

- corpus Development ;
- Gold Frames ;
- Holdout corpus ;
- reconstruction prompt ;
- critic prompt ;
- audit prompt ;
- provider schemas ;
- canonical model ;
- acceptance guards ;
- canonicalizer ;
- evaluator ;
- routing ;
- model ID ;
- thresholds.

Puis conclure :

R3I_DEVELOPMENT_GATE_PASSED_READY_FOR_HOLDOUT_AUTHORIZATION.

L'autorisation Holdout
reste humaine et séparée.

──────────────────────────────────────────────────────────────────────────────
NON-RÉGRESSION
──────────────────────────────────────────────────────────────────────────────

Une fois la campagne terminée :

exécuter seulement les validations utiles :

- suite SEM complète ;
- frontières Knowledge ;
- IMG ;
- PRJ ;
- SYS ;
- TMP ;
- typecheck ;
- lint ;
- build ;
- git diff --check.

Ne pas exécuter
navigateur live,
ST/IMG/PRJ live
ou Holdout.

Ils appartiennent
à la qualification finale suivante.

Les trois échecs historiques
Editorial Engine externe
peuvent rester isolés
s'ils sont toujours démontrés préexistants.

──────────────────────────────────────────────────────────────────────────────
ÉCONOMIE CODEX
──────────────────────────────────────────────────────────────────────────────

Ne pas produire
un nouveau rapport de plusieurs dizaines de sections.

Ajouter un addendum R3I court
au rapport existant :

docs/sem-001r3b-development-semantic-repair-report.md

Limiter cet addendum à :

1. baseline R3H ;
2. checkpoint inventory ;
3. LLM call plan ;
4. consommation réelle ;
5. Development 30/30 ;
6. métriques ;
7. failures éventuelles ;
8. validations ;
9. décision.

Éviter de recopier
les sections R3B–R3H.

──────────────────────────────────────────────────────────────────────────────
SORTIE CODEX OBLIGATOIRE
──────────────────────────────────────────────────────────────────────────────

Dans la réponse finale,
donner directement :

Décision

Development : X/30

Métriques principales

LLM :
- appels réalisés
- retries
- appels évités
- appels différés

Provider incidents

Holdout status

Tests

Puis fournir obligatoirement :

Rapport absolu :
<chemin>

Rapport relatif :
<chemin>

et un lien cliquable vers le rapport.

Ne pas obliger l'utilisateur
à chercher le fichier manuellement.

──────────────────────────────────────────────────────────────────────────────
DÉCISIONS AUTORISÉES
──────────────────────────────────────────────────────────────────────────────

Conclure uniquement par :

R3I_DEVELOPMENT_GATE_PASSED_READY_FOR_HOLDOUT_AUTHORIZATION

ou

R3I_DEVELOPMENT_REQUIRES_FURTHER_REPAIR

ou

R3I_BLOCKED_BY_PROVIDER

ou

R3I_BLOCKED_BY_CONFIGURATION_DRIFT

Aucun Holdout.

Aucun navigateur final.

Aucun commit.

Aucun push.

Aucun déploiement.

## Addendum SEM-001R3I — Development Closure

### 1. Baseline R3H

La décision d'entrée `R3H_TARGETED_DEVELOPMENT_REPAIRS_PASSED` et ses six cas fermés ont été vérifiés. Les digests sémantiques R3H sont inchangés. Le contrôle préalable conclut `R3I_CONFIGURATION_VERIFIED`.

### 2. Checkpoint inventory

Les 30 reconstructions sont `REUSE_COMPATIBLE`. Les critiques de D02, D16, D19, D21, D23 et D28 sont réutilisables. Les étages aval de D21 ont seuls été rejoués déterministiquement depuis le premier étage invalidé ; les 24 autres critiques étaient `LLM_REQUIRED`. Inventaire : `semantic-validation/sem-001r3i/development-r3i-checkpoint-inventory.json`.

### 3. LLM call plan

Le plan antérieur à tout appel prévoit 0 reconstruction, 24 critiques, 0 audit préactivé et des audits uniquement sous condition générique. Il borne la concurrence à 1, les départs à 5 par fenêtre glissante de 60 secondes et les tentatives transitoires à 5. Plan : `semantic-validation/sem-001r3i/development-r3i-call-plan.json`.

### 4. Consommation réelle

35 appels Gemini `gemini-3.5-flash-lite` ont été réalisés : 0 retry, 0 correction structurée, 0 audit conditionnel et 0 incident fournisseur. 44 appels ont été évités par réutilisation compatible : 30 reconstructions, 12 critiques et 2 audits. Aucun appel Development n'est différé ; un cas reste incomplet après une opération exécutée. Les 30 cas Holdout restent différés et aucun appel Holdout n'est autorisé.

### 5. Development

Résultat : `29/30 COMPLETE`. Les 29 cas complets partagent le digest de configuration `ke1-d34d45911dbf8b5d`. D22 est `FAILED` au contrôle d'acceptation du critique. Aucun checkpoint complet n'a été rejoué.

### 6. Métriques

Les métriques agrégées officielles ne sont pas calculées : le gate préalable exige `30/30 COMPLETE`. Le fichier `semantic-validation/sem-001r3i/development-metrics-detailed-r3i.json` porte explicitement le statut `NOT_CALCULATED`. Aucun manifeste `development-freeze-candidate.json` n'est créé.

### 7. Failure

`SEM-D22` — `CRITIC_FAILURE`, isolé sur 1 des 24 critiques courants. Le critique retourne `ACCEPT` et affirme `NO_IMPORTANT_FRAGMENT_UNREPRESENTED=PASS`, alors que le contrôle déterministe trouve la couverture explicite `INCOMPLETE` : le fragment d'inventaire `inv-2`, texte source `mesuré`, n'a aucun élément typé source-grounded. Les relations et la taxonomie sont `COMPLETE`. Premier étage divergent : `BASE_CRITIC_ACCEPTANCE_CONSISTENCY`. Propriétaire recommandé : `SEM_CRITIC_PROMPT_OR_ACCEPTANCE_CONTRACT`. Aucune correction automatique n'a été appliquée. Preuve : `semantic-validation/sem-001r3i/development-failures-r3i.json`.

### 8. Validations

PASS : SEM 196 tests, Knowledge 87, IMG 60, PRJ 56, SYS 34 et TMP 18, soit 451/451 tests sur 53 fichiers ; `typecheck`, build et `git diff --check` passent. Le lint passe avec 0 erreur et 7 avertissements Fast Refresh préexistants. Aucun navigateur live, aucune suite live et aucun Holdout n'ont été exécutés.

### 9. Décision

`R3I_DEVELOPMENT_REQUIRES_FURTHER_REPAIR`

Disposition : `STOP_FOR_HUMAN_REVIEW`. Holdout : `NOT_STARTED_FORBIDDEN`. Aucun commit, push ou déploiement.

## Addendum SEM-001R3J — Final Development Critic Consistency Repair

### 1. Diagnostic D22

Le chemin persisté a été retracé sans provider : source `iode mesuré en dual energy vs photon counting` → inventaire `inv-1` à `inv-4` → trois éléments typés → trois relations explicites → critique `ACCEPT` → garde explicite `INCOMPLETE`. `inv-2` (`mesuré`, rôle local `action`) n'est pas un objet scientifique autonome : sa fonction est portée par les deux relations source-grounded `MEASURED_BY`. Lui ajouter un nœud `OPERATION` aurait dupliqué artificiellement la sémantique relationnelle. Preuve : `semantic-validation/sem-001r3j/d22-diagnostic-and-classification.json`.

### 2. Failure class

Classe retenue avant modification : `B — COVERAGE_FALSE_POSITIVE`. Le critique n'a pas omis un contenu scientifique ; la garde de couverture exigeait à tort un élément pour un fragment linguistique fonctionnel déjà représenté par des relations typées. Le Gold Frame n'a servi qu'après correction, pour l'évaluation indépendante.

### 3. Correction générique

Le propriétaire corrigé est `DETERMINISTIC_EXPLICIT_COVERAGE`. Un fragment dont le rôle d'inventaire est fonctionnel peut être couvert par une relation uniquement si son texte exact appartient au span relationnel de la même source, si le fragment est structurellement relié à un endpoint — sauf rôle purement relationnel — et si une relation typée `EXPLICIT_USER_STATED`, de même polarité, référence l'identifiant de relation d'inventaire. Aucun terme D22, caseId ou Gold n'apparaît dans la règle. L'invariant fail-closed `CRITIC_ACCEPTANCE_REQUIRES_DETERMINISTIC_GUARDS_COMPLETE` était déjà effectif pour les gardes explicite, relationnelle et taxonomique ; il reste inchangé.

### 4. Invalidation et réutilisation

Seul le digest `coverageAndRepair` évolue, de `ke1-ca1d80690519c165` à `ke1-07d6e2904ee94524`; corpus, Gold Frames, prompts, schémas provider, modèle canonique, gardes d'acceptation, canonicalizer, evaluator et routing restent identiques. Les 29 cas `COMPLETE`, déjà porteurs de couvertures explicite et relationnelle `COMPLETE`, sont réutilisés sans replay. D22 seul est invalidé à `DETERMINISTIC_EXPLICIT_COVERAGE`; reconstruction et critique persistées sont réutilisées. Nouveau digest de configuration : `ke1-01606892072503be`.

### 5. Gate D22

D22 est `COMPLETE` après un replay déterministe unique : Explicit Coverage, Relation Coverage et Semantic Taxonomy sont `COMPLETE`; l'acceptation du critique est cohérente; Explicit Object Recall, Explicit Relation Recall et Critical Semantic Recall valent `1`; absolute blockers et Critical Unsupported Inference valent `0`; route correct vaut `true`. Le modèle contient le biomarqueur et les deux méthodes, sans nœud `OPERATION` artificiel. Preuve : `semantic-validation/sem-001r3j/d22-deterministic-replay.json`.

### 6. Development 30/30

Assemblage : `30/30 COMPLETE`, composé de 29 cas réutilisés sans modification et de D22 rejoué depuis son premier étage invalidé. Aucun autre cas, reconstruction, critique ou audit n'a été relancé. Le manifeste `semantic-validation/sem-001r3j/development-freeze-candidate.json` est créé avec le statut `PROPOSED_NOT_ACTIVATED`; il n'ouvre pas le Holdout.

### 7. Métriques Development

Les numérateurs ci-dessous sont les sommes des scores par cas sur le dénominateur applicable. Les seuils SEM-001 restent inchangés et passent; aucun absolute blocker n'est présent. Ellipsis Detection, Ambiguity Preservation et Route Correctness restent publiées comme métriques historiques, sans devenir silencieusement de nouveaux seuils.

| Métrique | Numérateur | Dénominateur | Score | Cas en erreur |
|---|---:|---:|---:|---|
| Critical Semantic Recall | 30 | 30 | 1.000000 | aucun |
| Explicit Object Recall | 30 | 30 | 1.000000 | aucun |
| Explicit Relation Recall | 30 | 30 | 1.000000 | aucun |
| Comparator Preservation | 7 | 7 | 1.000000 | aucun |
| Intervention Preservation | 6 | 6 | 1.000000 | aucun |
| Modality Preservation | 9 | 9 | 1.000000 | aucun |
| Semantic Drift Rate | 0 | 30 | 0.000000 | aucun |
| Unsupported Inference Rate | 0 | 30 | 0.000000 | aucun |
| Critical Unsupported Inference Rate | 0 | 30 | 0.000000 | aucun |
| Ellipsis Detection Rate | 29 | 30 | 0.966667 | SEM-D01 |
| Ambiguity Preservation Rate | 19.833333 | 30 | 0.661111 | SEM-D01, D04, D05, D07, D08, D09, D11, D23, D25, D26, D30 |
| Unnecessary Clarification Rate | 0 | 30 | 0.000000 | aucun |
| Route Correctness | 26 | 30 | 0.866667 | SEM-D14, D20, D23, D27 |
| Correction Propagation Rate | 1 | 1 | 1.000000 | aucun |
| Multi-turn Context Preservation | 1 | 1 | 1.000000 | aucun |
| Generic-Domain Collapse Rate | 0 | 30 | 0.000000 | aucun |

Preuve complète : `semantic-validation/sem-001r3j/development-metrics-detailed-r3j.json`.

### 8. LLM accounting et validations

R3J réalise `0` appel LLM, `0` request start, `0` retry et `0` structured regeneration. `79` appels sont évités par réutilisation : 44 checkpoints déjà économisés à l'entrée de R3I et 35 sorties provider persistées de R3I. Un cas et quatre étages déterministes sont rejoués; 29 cas sont réutilisés et un seul invalidé. Aucun incident provider. PASS : nouveaux tests R3J 8/8; SEM 204, Knowledge 87, IMG 60, PRJ 56, SYS 34 et TMP 18, soit 459/459 tests sur 54 fichiers; `typecheck`, build et `git diff --check`. Le lint passe avec 0 erreur et 7 avertissements Fast Refresh préexistants. Aucun Holdout, navigateur final ou test live n'a été exécuté.

### 9. Décision

`R3J_DEVELOPMENT_GATE_PASSED_READY_FOR_HOLDOUT_AUTHORIZATION`

Development : `30/30 COMPLETE`. Holdout : `NOT_STARTED_FORBIDDEN`. Freeze : proposé, non activé. Aucun commit, push ou déploiement.
