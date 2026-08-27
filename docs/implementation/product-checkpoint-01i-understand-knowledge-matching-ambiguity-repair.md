# PRODUCT-CHECKPOINT-01I — UNDERSTAND Knowledge matching, soft applicability and ambiguity clarification repair

> Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE` — preuve d’implémentation non normative.
> Date: 2026-08-27.
> Portée: réparation produit bornée, locale et déterministe ; aucune qualification scientifique.

## Decision

Le correctif local est prêt pour promotion Production en fast-forward. La décision finale de mission reste suspendue à la vérification du déploiement Git/Vercel post-commit.

```text
LOCAL_REPAIR = READY
SCIENTIFIC_PASS = NO
PD011_PASS = NO
WAVE_2_AUTHORIZED = NO
PRODUCT_TRACE_INTEGRATION = ABSENT
```

## Authorities

Ordre d’autorité respecté :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` courant ;
2. `NOXIA — Charte fondatrice` ;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2` ;
4. `Editorial Engine — Architecture Manifesto`.

Autorités spécialisées effectivement consultées : PD-003 V2 Research Object Model et Ownership Matrix, PD-004 pour le rendu d’incertitude, PD-009 pour la clarification, PD-011 pour la frontière de qualification, RDE-001 v1.1, RDE-002 v1.1, KE-001 et SEM-002. PD-005 n’a pas été mobilisé : aucun prompt, LLM ou rôle provider n’est modifié. Les rapports 01F, 01F-R, 01G et 01H ont été traités uniquement comme preuves Level 3.

Aucune contradiction documentaire ou normative bloquante n’a été observée. Les contrats applicables distinguent déjà `HARD` et `SOFT`, imposent une couverture par branche pour les comparaisons, conservent l’ambiguïté sans choix silencieux et autorisent `CLARIFICATION_REQUIRED` lorsque les branches de sens divergent.

## Git baseline

Préflight vérifié avant modification :

```text
branch = protocol-designer-canonical-ingestion
HEAD = 320d54bbab3c87833ea69583097860c28d010403
origin/main = 320d54bbab3c87833ea69583097860c28d010403
origin/protocol-designer-canonical-ingestion = 312b4b9c45de57ed3a6339dcc703f79955fbc36c
tracked modifications = 0
historical untracked artifacts = 58
```

La Production rapportée au départ était `noxia-imagerie.fr`, Vercel deployment `dpl_CiMWTcgT3m5qSXfxtgWfut9rPrJx`, au SHA `320d54bbab3c87833ea69583097860c28d010403`.

## 01H forensic preservation

L’artefact 01H a été vérifié avant archivage :

```text
path = docs/implementation/product-checkpoint-01h-understand-knowledge-matching-applicability-forensic.md
sha256 = 4cf7f684d49f07d39dc9f33a847104e7b66c92b9ff78d8e1ad8ed12de902cadc
documentary commit = 123986345d61c65315c58861a3f663c9c7f6b609
```

Ce commit contient uniquement le rapport 01H. Aucun autre artefact non suivi n’a été sélectionné.

## Root causes consumed

Le forensic 01H n’a pas été rouvert :

- Case A : `QUERY_PLANNING` ne représentait pas les objets comparés hors multi-modalité, puis `APPLICABILITY` transformait l’absence de `STENTING` `SOFT` en exclusion absolue ;
- Case C : `ambiguous:t1` était reconnu mais sans sens candidats, sans branches, sans clarification, puis projeté comme absence de connaissance.

Aucun troisième chantier n’a été ouvert.

## Case A repair

Le premier défaut propriétaire a été corrigé dans Knowledge : l’absence d’une dimension `SOFT` documentée par la requête qualifie désormais l’applicabilité en `APPLICABLE_WITH_LIMITATIONS` au lieu d’exclure le candidat. Une incompatibilité effective de domaine reste excluante.

Sur l’entrée exacte du Case A :

```text
retrieved MVO assertions = 5
applicable with limitations = 5
excluded only because STENTING is absent = 0
sources preserved = 3 or more
EvidenceLinks preserved = 6 or more
overall coverage = PARTIAL
synthesis state = PARTIAL_ANSWER
```

L’absence de documentation du contexte `STENTING` reste visible dans les `applicabilityReasons` et les limitations du résultat. Aucune équivalence no-reflow/MVO ni assertion comparative n’a été créée.

## SOFT/HARD propagation

La distinction existante est propagée génériquement :

- dimension absente + `SOFT` : candidat utilisable avec limitation explicite ;
- dimension absente + `HARD` : applicabilité inconnue et candidat non retenu ;
- incompatibilité réelle de modalité/validité : exclusion conservée ;
- aucune règle spécifique à `stenting`, `MVO` ou `STEMI` n’a été ajoutée.

Le moteur d’applicabilité reste actif ; le correctif ne contourne ni ses contrôles ni les domaines de validité.

## Branch-local applicability

Le plan de requête sait désormais créer des branches génériques pour plusieurs objets comparés du même type, pas seulement pour plusieurs modalités. Case A produit donc :

```text
branch no-reflow = no applicable exact corpus item
branch obstruction microvasculaire = supported with qualified applicability
direct comparison = unresolved / partial coverage
```

La correspondance par branche utilise les identifiants canoniques et les identifiants provider gouvernés. Une assertion MVO ne peut plus couvrir artificiellement la branche no-reflow par le seul fait que son provider a également été sélectionné pour une dimension commune.

## Case C repair

`T1` en contexte IRM reste `AMBIGUOUS`; il n’est ni transformé en inconnu, ni résolu silencieusement. Le catalogage existant expose deux sens effectivement gouvernés et présents dans le runtime courant :

- `method:t1-mapping` — T1 mapping ;
- `measurement:native-t1` — T1 natif.

Le plan est arrêté avant retrieval avec `domainGate = CLARIFICATION_REQUIRED`, conserve une branche par sens candidat et ne sélectionne aucun sens arbitraire. La clarification simulée explicite `T1 mapping` retrouve ensuite les connaissances T1 locales, sans appel externe.

## Ambiguous known concept handling

Le corridor distingue maintenant :

```text
ambiguous governed concept -> CLARIFICATION_REQUIRED
truly unknown concept -> genuine internal knowledge absence
```

Une ambiguïté gouvernée reçoit un gap `MISSING_CRITICAL_CONTEXT` de scope `AMBIGUOUS_KNOWN_CONCEPT`; elle ne reçoit ni `NO_REGISTERED_PROVIDER` ni demande de recherche externe. Les sens candidats sont dérivés du catalogue local existant, jamais d’un alias ad hoc.

## PD-009 clarification path

La valeur de clarification est portée par le `domainGate` existant et par un gap de contexte bloquant. La projection formule une seule question à partir des libellés des sens candidats et expose les choix gouvernés. Elle ne choisit pas la réponse et ne crée pas de second Decision Engine.

La surface produit affiche cette clarification et l’inclut dans la réponse conversationnelle. Cette modification est strictement projective : elle ne modifie ni Knowledge truth, ni Project, ni protocole.

## Output-state correction

Le profil de synthèse réutilise le nom contractuel `CLARIFICATION_REQUIRED`. La couverture utilisateur devient « Clarification requise » et la réponse explique que plusieurs sens scientifiques gouvernés existent. Le message « Connaissance interne absente » reste réservé aux absences authentiques de couverture interne.

## Case B positive control

Le contrôle ECV IRM/CT reste `PARTIAL` / `PARTIAL_ANSWER`, avec sources, EvidenceLinks, gap de comparaison directe et synthèse 01G gouvernée. Aucun comportement scientifique ni corpus de ce cas n’a été réécrit.

## 01G non-regression

Les invariants ciblés restent couverts : intent-first, `UNDERSTAND → Knowledge`, zéro Project write, zéro protocol projection, conservation de `NO_STUDY`/`NO_PROTOCOL`, Project/QRY préexistants non détournants, synthèse gouvernée, support/source/gap/contradiction traçables et aucun fallback scientifique LLM.

Le seul test historique adapté attendait l’ancien faux négatif du Case A. Il vérifie désormais le comportement contractuel réparé : éléments partiels utilisables avec limites, comparaison globale non fermée et absence d’équivalence inventée.

## CT normalization secondary finding

L’anomalie secondaire de normalisation CT identifiée par 01H n’est pas causée par le mécanisme SOFT/ambiguïté corrigé et reste hors périmètre. Aucun troisième correctif n’a été engagé.

## UX explicitly out of scope

La surface reste une surface de développement/diagnostic. Aucun redesign des sources, limites, gaps, provenance ou modes de lecture n’a été réalisé. Seule la clarification déjà gouvernée est rendue explicitement visible.

## TRACE explicitly out of scope

```text
PRODUCT_TRACE_INTEGRATION = ABSENT
```

Aucune nouvelle abstraction d’observabilité ni intégration TRACE n’a été ajoutée.

## Tests

Validation locale ciblée :

```text
test files = 6 passed / 6
tests = 51 passed / 51
01I + 01G focused gate = 13 passed / 13
targeted lint errors = 0
```

Couverture explicite : SOFT absent non excluant, incompatibilité HARD conservée, Case A partiel avec provenance, branches locales, ambiguïté connue sans fausse absence, clarification requise, reprise explicite `T1 mapping`, absence authentique conservée, contrôle Case B et non-régressions produit 01B/01D/01G.

## Build/typecheck

```text
Production build = PASS
scientific interpretation API typecheck = PASS
scientific interpretation server typecheck = PASS
Node ESM handler load = PASS
application typecheck = 2 historical TS2698 only
```

Les deux `TS2698` restent dans `w1-qual-02h1r-deterministic-checker.test.ts` aux lignes 37 et 50. Ils sont préexistants, hors fichiers 01I et hors périmètre. Le build conserve ses avertissements historiques de CSS, Browserslist et taille de chunks ; aucun n’est bloquant.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS_BEFORE_GIT_PROMOTION = 0
NEW_BENCHMARKS = 0
NEW_CAMPAIGNS = 0
BROAD_REPLAYS = 0
```

Seuls le runtime local, les corpus déjà présents, les fixtures et les tests ciblés ont été utilisés.

## Remaining limitations

- la liste de sens candidats T1 reflète uniquement les sens actuellement gouvernés dans le catalogue local ; elle ne revendique pas l’exhaustivité de toutes les acceptions possibles de T1 ;
- l’anomalie de normalisation CT reste ouverte et bornée ;
- la comparaison no-reflow/MVO reste scientifiquement non fermée par le corpus courant ;
- la surface produit finale conversationnelle n’est pas redessinée ;
- aucune recherche externe n’a été réalisée ;
- `SCIENTIFIC_PASS = NO`, `PD011_PASS = NO`, `WAVE_2_AUTHORIZED = NO`.

## Git

Le rapport 01H est isolé dans le commit documentaire `123986345d61c65315c58861a3f663c9c7f6b609`. Le présent rapport et la réparation 01I doivent former le commit fonctionnel suivant. La topologie attendue reste une avance linéaire de deux commits depuis `320d54bbab3c87833ea69583097860c28d010403`, sans rebase, squash, force-push ni modification de `origin/protocol-designer-canonical-ingestion`.

Tous les autres artefacts historiques non suivis ont été préservés.

## Production deployment

Au moment de figer cette preuve dans le commit fonctionnel, la promotion Git/Vercel n’a pas encore eu lieu : elle dépend nécessairement du commit final. Le contrôle post-push autorisé doit confirmer `origin/main`, le deployment ID, le SHA déployé, les états `Ready / Current / Production`, HTTP 200 sur `/protocol-designer/demo`, l’absence d’erreur runtime bloquante et l’absence de secret exposé. Les scénarios A/B/C ne doivent pas être rejoués automatiquement après déploiement.
