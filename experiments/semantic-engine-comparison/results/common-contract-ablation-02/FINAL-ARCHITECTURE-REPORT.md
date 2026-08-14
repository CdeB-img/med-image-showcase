# EXP-SEM-ABLATION-02 — Final Architecture Report

## Décision expérimentale

`HYBRID_SEM_CONTRACT_PYDANTIC_RUNTIME`

Le contrat scientifique, les relations, la provenance, l’ownership et les guards déterministes de SEM doivent rester les garanties NOXIA. L’orchestration multi-passes systématique n’est pas justifiée par cette campagne. PydanticAI est le meilleur candidat runtime simple observé, mais pas encore un remplacement direct : ses échecs de contrat I04 et l’absence de raw provider persistant empêchent cette conclusion. Le critic conditionnel Pydantic n’a démontré aucune valeur sémantique observable. DSPy reste un candidat technique robuste, mais pas une couche d’enrichissement démontrée.

## Règle d’interprétation

La campagne distingue désormais strictement :

- `SCIENTIFIC_SEMANTIC_EVALUABILITY` : ce que la sortie disponible permet de comprendre scientifiquement;
- `STRUCTURED_CONTRACT_CONFORMANCE` : sa conformité au Common Scientific State.

Une sortie rejetée par le contrat n’est pas déclarée scientifiquement mauvaise. Lorsque son raw n’a pas été persisté, elle est `NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED`. Aucun appel LLM de revue sémantique n’a été utilisé.

## Ce qui a été réellement comparé

- Common Transcript : 8/8 scénarios, 120 états tentés, 114 Common States acceptés.
- Interactive : 4/4 scénarios, 20/20 branches clôturées, 55 états tentés, 44 Common States acceptés.
- Provider : 235 appels réellement démarrés; 236 réservations ledger; 4 retries; 0 appel de semantic review.
- Digest du scénario pack : inchangé.

## Résultats scientifiques

### SEM Full versus SEM Single

Sur 23 états Phase A directement comparables, l’adjudication post-hoc simulée classe 3 apports utiles, 4 dégradations et 16 états sans changement scientifique significatif. Ces observations ont coûté 33 appels critic Phase A.

SEM Full apporte ponctuellement davantage d’explicites et de relations, notamment I01/T1, I04/T1 et I06/T1. Il dégrade toutefois I04/T2 (clarification supprimée), I07/T2 (statut prédictif affaibli) et I08/T1–T2 (pseudo-corrections puis promotion de candidat principal en critère principal). SEM Single conserve mieux le statut exact de I08.

### PydanticAI

Pydantic direct atteint généralement la même compréhension globale en une première passe : corrections, temporalité, négation et hiérarchie des analyses sont bien conservées dans I01, I02, I05, I06 et I07. Il perd de la densité relationnelle par rapport à SEM et échoue structurellement sur I04/T1–T2 dans les deux branches. Le raw provider n’ayant pas été persisté, ces quatre états ne peuvent pas être jugés scientifiquement.

Le critic conditionnel a été déclenché 20 fois en Phase A : 18 `ACCEPT`, 2 `REVISE`. Sur les 22 paires observables, il n’ajoute, ne retire ni ne corrige aucune obligation scientifique; les seules différences sont `null` versus `"null"` ou des échappements de chaîne. Il ne récupère pas les échecs de première passe.

### DSPy

DSPy produit 24/24 Common States Phase A et des résumés scientifiquement solides. Il ne démontre pas l’enrichissement attendu : 2 candidats contextuels et 14 relations, contre 4/37 pour Pydantic et 0/93–102 pour SEM. Sa structure n’utilise aucun objet dédié. Request 13 I01/T1 a perdu son raw non-JSON; request 15 est une régénération qualitative explicitement exclue du pairage primaire strict.

### Risque partagé I08

SEM Full, Pydantic et DSPy transforment à un endroit `candidat principal` en `critère/endpoint principal`. SEM Single conserve correctement le statut candidat. Ce constat interdit de conclure qu’une architecture riche ou conforme est automatiquement épistémiquement correcte.

## Dialogue interactif

Les 20 branches sont terminées, mais le contrôleur commun ne démontre pas une politique ASK/FINISH satisfaisante :

- I01 : Pydantic simple pose une clarification temporelle utile; les autres finissent sans question.
- I04 : SEM et DSPy posent des questions plausibles mais souvent génériques ou répétées; les branches Pydantic échouent.
- I06 : plusieurs branches demandent des seuils ou standards de référence non prioritaires; DSPy finit sans traiter la mesure principale.
- I08 : plusieurs branches répètent la question du critère principal après `Non` ou `Je ne sais pas`.

La génération des clarifications, leur déduplication et l’intégration des réponses doivent rester un composant distinct du runtime de compréhension.

## Robustesse structurée

| Configuration | Phase A | Interactive | Lecture scientifique |
|---|---:|---:|---|
| SEM Full | 23/24 conformes | 11/11 | I05/T2 non évaluable, raw absent |
| SEM Single | 23/24 conformes | 10/11 | I05/T2 et une branche interactive non évaluables, raw absent |
| Pydantic | 22/24 conformes | 6/11 | échecs non assimilés à des échecs scientifiques |
| Pydantic+Critic | 22/24 conformes | 6/11 | critic inaccessible sur certains échecs de première passe |
| DSPy | 24/24 conformes | 11/11 | I01/T1 régénéré, non primaire strict-paired |

## Complexité et coût

Les 236 réservations ledger correspondent à 235 départs provider : 53 SEM Full, 39 SEM partagé, 31 SEM Single, 34 Pydantic+Critic, 24 Pydantic partagé, 11 Pydantic simple, 36 DSPy et 7 simulateur; la réservation DSPy 14 a échoué localement avant HTTP. Les latences détaillées sont dans `operational-metrics.json`; elles sont mesurées par opération et ne doivent pas être présentées comme latence end-to-end d’un état.

## Réponses aux questions architecturales

1. SEM Full comprend parfois davantage de relations cumulatives; aucun avantage systématique n’est observé.
2. Son critic coûte 33 appels Phase A et 49 sur toute la campagne.
3. 16/23 tours comparables n’ont aucune valeur scientifique ajoutée observable.
4. Pydantic atteint souvent la même compréhension globale en une passe.
5. Pydantic perd de la densité relationnelle et de la robustesse de contrat, surtout I04.
6. Son critic conditionnel ne récupère aucune perte observable.
7. DSPy n’apporte pas d’enrichissement supérieur démontré.
8. DSPy reste sparse et partage le risque de promotion I08.
9. Relations, provenance, ownership, statut épistémique et guards déterministes SEM doivent rester.
10. Le critic SEM systématique et les repairs LLM peuvent être rendus conditionnels ou simplifiés.
11. L’architecture simple compatible la plus prometteuse est un runtime Pydantic direct sous contrat/guards SEM conservés, pas Pydantic seul.

## Limites

- `SIMULATED_POST_HOC_ADJUDICATION`, aucune revue humaine indépendante.
- Aucun Blind et aucune qualification PD-011.
- Aucun score global inventé.
- Les sorties raw exactes SEM/Pydantic n’ont pas été persistées; seules leurs représentations natives structurées sont disponibles.
- Aucun tuning post-observation, aucun document normatif modifié.

## Action suivante unique

Faire relire humainement les huit dossiers `human-review/I01.md` à `I08.md`, en priorité I04, I07 et I08, avant toute décision de simplification produit.
