# PROTOCOL DESIGNER V1 — Standard Scientific Conversation Intelligence 01

`MISSION_STATUS = V1_STANDARD_SCIENTIFIC_CONVERSATION_INTELLIGENCE_QUALIFIED`

Date de qualification : 2026-09-09

Baseline : `60a09c783486edd6c29e437017c9e31ac98b31d3`

Commit produit : `2d12e689e23bd52fccdec92407b95028f47f439c`

## Packet humain — conversation principale

### Contexte antérieur adopté

T1 — USER : le projet prévoit des prélèvements sanguins.

T2 — USER : ils sont réalisés à l’inclusion et à M3.

T3 — USER : une utilisation biologique existe déjà.

T4 — USER : le budget des analyses biologiques est limité.

T5 à T10 — la conversation traite six points sans rapport avec la collecte biologique.

### Réactivation contextuelle

T11 — USER : « Je veux ajouter le dosage X à cette étude. »

NOXIA relie la candidate validée non adoptée au graphe de la version courante du Research Project et fait réapparaître uniquement :

- les prélèvements sanguins déjà prévus ;
- la visite d’inclusion ;
- la visite M3 ;
- l’utilisation biologique déjà prévue ;
- la contrainte de budget biologique.

La contrainte sans relation matérielle avec la biologie n’est pas affichée.

NOXIA distingue :

- confirmé dans le projet courant : les éléments adoptés ci-dessus ;
- à vérifier : la possibilité de couvrir le nouveau besoin avec les éléments existants ;
- inconnu à ce stade : l’incidence budgétaire précise ;
- bloqué par une information manquante : les conséquences documentaires avant adoption.

### Bloc d’actions réellement présenté

```text
Ce nouvel élément peut avoir plusieurs conséquences sur le projet.
Que souhaitez-vous que j’examine maintenant à propos du dosage X ?

[ ] Vérifier la couverture par les éléments déjà prévus
[ ] Préciser le besoin supplémentaire éventuel
[ ] Estimer l’incidence sur le budget biologique limité
[ ] Repérer les mises à jour documentaires après adoption

Autre demande : ______________________________

[Examiner ces actions]  [Aucun / pas maintenant]
[Pourquoi ces options ?]
```

Le champ de conversation naturel reste disponible et le bloc ne devient pas un wizard.

### Sélection et réponse combinée

USER sélectionne :

- vérifier la couverture existante ;
- estimer l’incidence budgétaire ;
- autre : « Comparer l’inclusion et M3 ».

NOXIA répond en une restitution combinée :

```text
Je traite ensemble 3 demandes de suivi au niveau permis par les informations
actuelles, sans modifier le projet.

Ce qui est déjà établi :
• les prélèvements sanguins, leur usage biologique, l’inclusion, M3 et la
  contrainte budgétaire appartiennent au projet courant.

Résultat contextuel et limites :
• couverture existante — à vérifier ; aucune compatibilité n’est conclue ;
• budget — inconnu à ce stade et à estimer ; aucun montant n’est déduit ;
• comparaison inclusion/M3 — reste à instruire et ne devient pas une décision.

La modification scientifique reste séparée et doit encore être revue puis
adoptée explicitement.
```

La réponse structurée conserve les actions sélectionnées, non sélectionnées, le texte libre, la date, la version Project de présentation et l’interdiction d’écriture Project.

### Refus puis adoption humaine

- Premier dossier de revue : refus explicite ; le Research Project reste strictement identique.
- Nouvelle proposition explicite : revue puis adoption humaine.
- Le Project passe de la révision N à N+1.
- Le dosage apparaît seulement après cette adoption.
- Le portefeuille documentaire recalculé depuis N+1 référence la nouvelle variable dans le calendrier des activités, le CRF et le dictionnaire de données.

## Packet humain — scénario secondaire

Contexte adopté : mesure fonctionnelle reliée à une visite de suivi.

Plus tard : « Ajouter un critère fonctionnel secondaire. »

NOXIA retrouve la mesure et la visite reliées, indique la couverture existante sans la surinterpréter, puis propose au plus quatre actions génériques. Aucun contenu biologique, prélèvement ou budget n’est injecté. Le mécanisme dépend du graphe Project, non d’un vocabulaire de discipline.

## Réalisation technique bornée

- `CURRENT_RELEVANT_PROJECT_CONTEXT@1.0.0` est une projection par tour, en lecture seule, liée au `projectId`, `versionId`, `projectDigest`, à la candidate et à son digest.
- La pertinence provient de chemins du graphe canonique courant et des relations candidates matérielles ; les relations faibles `ASSOCIATED_WITH`, `RELATED_TO`, `MENTIONS`, `DESCRIBES` et `CONTEXT_OF` sont exclues.
- QRY reste propriétaire de la prochaine action et du WHAT.
- Le composant Standard affiche les conséquences et actions sans exposer QRY, TRACE, owner, refs ou digests.
- TRACE v2 enregistre le choix `QRY_ACTION_SELECTED`, ses preuves, statuts et options ; TRACE ne décide et ne répare rien.
- Une sélection de checkbox est une demande de suivi et non une adoption, une variable, une visite ou une analyse adoptée.

Limite conservée : la restitution immédiate combine l’analyse contextuelle démontrable et ses limites. Elle ne prétend pas avoir exécuté en parallèle plusieurs runtimes spécialisés pré-Project, dont les contrats restent liés au Project adopté.

## Qualification

```text
TARGETED_COMPATIBILITY = 9 files / 90 PASS
V1_VERTICALS = 3 files / 8 PASS
FINAL_CHANGED_PATH = 1 file / 6 PASS
TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS

FULL_SUITE_FILES = 255 PASS / 2 SKIPPED / 1 FAIL
FULL_SUITE_TESTS = 3873 PASS / 12 SKIPPED / 1 TODO / 1 FAIL
HISTORICAL_FAILURE = p-web-02-contract.test.tsx
NEW_REGRESSIONS = 0

PROVIDER_CALLS = 0
OPENAI_CALLS = 0
GEMINI_CALLS = 0
PUSH = NO
DEPLOYMENT = NO
```

Les avertissements React Router, Browserslist, Rollup, CSS et taille de chunks observés au build préexistaient et ne sont pas causaux pour ce changement.

## Gates

```text
CI01_LONGITUDINAL_PROJECT_UNDERSTANDING = WORKS
CI02_RELEVANT_CONTEXT_RESURFACING = WORKS
CI03_PROACTIVE_IMPACT_DISCOVERY = WORKS
CI04_USEFUL_SUGGESTIONS = WORKS
CI05_CHECKBOX_MULTISELECT = WORKS
CI06_FREE_TEXT_OTHER = WORKS
CI07_WHY_EXPLANATION = WORKS
CI08_NO_AUTOMATIC_ADOPTION = PASS
CI09_PROJECT_PROPAGATION_AFTER_HUMAN_DECISION = WORKS
CI10_DOCUMENT_IMPACT_PROPAGATION = WORKS
CI11_BUDGET_CONSTRAINT_RESURFACING = WORKS
CI12_NO_UNSUPPORTED_COST_INVENTION = PASS
CI13_NO_CONSEQUENCE_SPAM = PASS
CI14_SECOND_SCENARIO_GENERICITY = PASS
CI15_STANDARD_CHAT_REMAINS_PRIMARY = PASS

VISIBLE_CONVERSATION_INTELLIGENCE_CHANGED = YES
GOOD_SCIENTIFIC_COLLEAGUE_BEHAVIOR = DEMONSTRATED_ON_TWO_LONGITUDINAL_SCENARIOS

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```

`NEXT_ACTION = GLOBAL_V1_CANDIDATE_QUALIFICATION_AND_HUMAN_PRODUCT_REVIEW`
