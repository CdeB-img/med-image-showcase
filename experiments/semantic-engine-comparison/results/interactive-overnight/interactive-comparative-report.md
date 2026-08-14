# EXP-SEM-INTERACTIVE-01 — Overnight Interactive Scientific Understanding Comparison

Status: `EXPERIMENTAL_NON_NORMATIVE_EXPLORATORY`
Adjudication: `SIMULATED_POST_HOC_ADJUDICATION`
Decision: `EXP_INTERACTIVE_COMPARE_PARTIAL_TECHNICAL`
Conclusion architecturale: `HYBRID_ARCHITECTURE`

## Résultat exécutif

Les six architectures sont techniquement exécutables avec `gemini-3.5-flash-lite`. PydanticAI fournit le meilleur compromis externe observé: états multi-tour complets sur les branches répondables, un appel par état et une latence moyenne d'environ 1,2 s. DSPy confirme un signal spécifique d'enrichissement contextuel: c'est la seule baseline ayant proposé en I03 des paramètres PET comme candidats, sans les attribuer à l'utilisateur.

SEM conserve une valeur structurelle observable dans ses sorties natives — relations, polarités et statuts épistémiques — et n'a connu aucun échec provider pendant les scénarios. En revanche, l'expérience n'observe aucun contrôleur interactif produit générique: `NOXIA_INTERACTIVE_CONTROLLER_NOT_IMPLEMENTED`. L'adapter expérimental transforme la première clarification SEM en `ASK`, sinon en `FINISH`. Il a posé une bonne question temporelle en I02, une question secondaire en I05 et a terminé trop tôt en I01, I03 et I04. Le coût observé est de 2,71 appels et 17,9 s par état, contre environ un appel et 0,9–1,7 s pour les frameworks externes.

La conclusion n'est pas un remplacement du coeur SEM. Les scénarios exécutés sont des variantes simplifiées et I03/Outlines n'a pas de réponse simulateur checkpointée. La recommandation est donc hybride: préserver un état scientifique riche et traçable, mais construire un contrôleur PD-009 générique, plus simple, testable séparément, au-dessus de ce contrat.

## Technical readiness

| Architecture | Statut | Preuve |
| --- | --- | --- |
| NOXIA / SEM current | TECHNICALLY_READY | 2/2 visible outputs |
| Instructor + Pydantic | TECHNICALLY_READY | 2/2 visible outputs |
| PydanticAI | TECHNICALLY_READY | 2/2 visible outputs |
| DSPy | TECHNICALLY_READY | 2/2 visible outputs |
| LangExtract | TECHNICALLY_READY | 2/2 visible outputs |
| Outlines | TECHNICALLY_READY | 2/2 visible outputs |

Phase A a consommé 24 réservations sur le plafond de 25. Les erreurs initiales de configuration, parsing et deux 504 ont été réparées uniquement dans la plomberie expérimentale. Les six baselines ont ensuite produit deux sorties natives visibles.

## Campagne interactive

- Scénarios exécutés: 5 (`I01`–`I05`).
- États candidats: 44.
- États `ASK` générés: 16.
- Questions effectivement envoyées au simulateur: 15.
- Réponses chercheur effectivement livrées aux branches: 14.
- Appels batch du simulateur chercheur: 6.
- Réservations provider nouvelles, comptées prudemment comme consommées: 87.
- Compteur journalier estimé final: 444/500; marge avant le hard stop 492: 48.
- Ledger: 76 succès, 10 échecs, 1 réservation à issue inconnue.
- Reprise sûre: 5 réservations supplémentaires, 4 succès, 1 échec local avant réseau; aucun appel simulateur `SUCCESS` rejoué.

| Architecture | États | Appels interactifs | Appels/état | Latence moyenne/état (s) | Succès interactifs |
| --- | --- | --- | --- | --- | --- |
| NOXIA / SEM current | 7 | 19 | 2.71 | 17.905 | 19 |
| Instructor + Pydantic | 6 | 6 | 1.0 | 1.561 | 6 |
| PydanticAI | 8 | 8 | 1.0 | 1.234 | 8 |
| DSPy | 7 | 7 | 1.0 | 1.652 | 7 |
| LangExtract | 7 | 7 | 1.0 | 0.937 | 7 |
| Outlines | 9 | 10 | 1.11 | 1.572 | 9 |

Les durées sont calculées depuis les horodatages du ledger et ne constituent pas un benchmark de performance contrôlé. SEM réalise plusieurs passes natives de reconstruction/critic/repair; les baselines externes effectuent une seule génération par état.

## Limite de conformité des scénarios

La campagne n'a pas exécuté exactement les messages et hidden cards prescrits. Elle a utilisé des variantes simplifiées, enregistrées sans réécriture dans `scenario-cards.json`:

- I01 conserve STEMI/stent/IRM, mais omet les détails multivaisseaux, lésion coupable, 4–6 semaines et CMR J3–J5.
- I02 remplace la formulation OEF/perfusion par une relation générale et reporte l'absence d'IRM pré-geste dans la première réponse.
- I03 omet dans le message initial la négation SUVmax seul et le CT de routine.
- I04 omet l'atteinte précoce avant fibrose et l'hétérogénéité initiale des séquences.
- I05 omet le pré/post, la récidive, l'IRM manquante et les coréférences «ça»/«ceux qui».

Conséquence: C06 est `NOT_TESTED`, C07 est `NOT_TESTED`, C13 est `NOT_EVALUABLE`, et les conclusions sur l'implicite, la coréférence, les données manquantes et l'ownership sont nécessairement étroites. Aucun scénario, prompt ou résultat n'a été corrigé après observation.

## Résultats scientifiques principaux

| Capacité | Objet | NOXIA / SEM current | Instructor + Pydantic | PydanticAI | DSPy | LangExtract | Outlines |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | Explicit fidelity | PASS | PASS | PASS | PASS | PASS | PASS |
| C02 | Multi-turn context | PASS | PARTIAL | PASS | PASS | FAIL | PARTIAL |
| C03 | Correction / change of mind | PARTIAL | PASS | PASS | PASS | PARTIAL | PASS |
| C04 | Negation | PASS | PASS | PASS | PASS | PARTIAL | PASS |
| C08 | Ambiguity management | PARTIAL | PARTIAL | PARTIAL | PARTIAL | FAIL | PARTIAL |
| C10 | Clarification value | PARTIAL | PARTIAL | PARTIAL | PARTIAL | FAIL | PARTIAL |
| C14 | Ownership | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL |
| C16 | Contextual enrichment | FAIL | FAIL | FAIL | PASS | FAIL | FAIL |
| C18 | Global scientific state reconstruction | PARTIAL | PARTIAL | PASS | PARTIAL | FAIL | PARTIAL |
| C19 | Question economy | PARTIAL | PARTIAL | PARTIAL | PARTIAL | FAIL | PARTIAL |
| C21 | Premature FINISH / failure to FINISH | FAIL | FAIL | PARTIAL | PARTIAL | FAIL | PARTIAL |
| C23 | Technical robustness / provider cost / latency | PARTIAL | PASS | PASS | PASS | PARTIAL | PARTIAL |

La matrice exhaustive C01–C23, avec preuves et scénarios associés, se trouve dans `capability-matrix.json`. Aucun score global n'est calculé.

## Dialogue

| Architecture | Questions | Valeur | Intégration | FINISH | Max depth | STOP | Sim. manquant |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOXIA / SEM current | 2 | PARTIAL | PASS | 5 | 0 | 0 | 0 |
| Instructor + Pydantic | 1 | PARTIAL | PASS | 5 | 0 | 0 | 0 |
| PydanticAI | 3 | PARTIAL | PASS | 5 | 0 | 0 | 0 |
| DSPy | 2 | PARTIAL | PASS | 5 | 0 | 0 | 0 |
| LangExtract | 2 | FAIL | FAIL | 4 | 1 | 0 | 0 |
| Outlines | 5 | PARTIAL | PARTIAL | 4 | 0 | 0 | 1 |

Questions les plus utiles observées:

- DSPy et SEM en I02: calendrier post-thrombectomie, puis intégration de 24 h/J7 et de la non-causalité.
- Outlines en I01: critère principal, puis intégration taille d'infarctus/MVO/absence de strain.
- PydanticAI en I01 et I04: endpoints et mesures disponibles, avec une formulation parfois trop guidée par des exemples.

Défauts saillants:

- LangExtract répète en I02 un inconnu déjà résolu et atteint la profondeur maximale.
- Outlines demande en I03 le type/localisation tumorale alors que l'endpoint ou le rôle des paramètres aurait une valeur plus directe.
- SEM demande en I05 les critères d'inclusion plutôt que la temporalité, le delta ADC ou l'endpoint.
- Aucun `STOP` n'a été produit. C22 reste `NOT_TESTED`, car aucun abandon explicite n'était inclus.

## Divergences et architecture

Les différences observées proviennent de plusieurs couches:

- **Base model capability**: tous les candidats partagent Gemini; une grande part de la paraphrase scientifique vient donc du même modèle.
- **Structured output effect**: Instructor, PydanticAI et Outlines produisent directement un état riche et lisible; LangExtract perd des relations faute d'extractions correspondantes.
- **Orchestration effect**: SEM ajoute plusieurs passes, plus coûteuses, et conserve davantage de structure épistémique native.
- **Memory/state effect**: PydanticAI, DSPy et Outlines consolident correctement les réponses reçues; LangExtract conserve un inconnu obsolète.
- **Dialogue-control effect**: aucune baseline ne domine uniformément. PydanticAI couvre le mieux les branches réellement répondables; SEM a une très bonne question I02 mais plusieurs FINISH précoces.
- **Framework robustness**: les six frameworks fonctionnent après réparation expérimentale; les états interactifs externes utilisent un seul appel.

## Comparaison asymétrique contre SEM

| Alternative | Classification | Raison |
| --- | --- | --- |
| Instructor + Pydantic | WORSE_THAN_NOXIA | Bonne fidélité explicite et faible coût, mais FINISH prématurés fréquents, relations limitées et aucun enrichissement. |
| PydanticAI | COMPARABLE_WITH_MAJOR_OPERATIONAL_ADVANTAGE | Meilleure complétude multi-tour observée, un appel par état et orchestration plus simple; ownership moins explicite que SEM. |
| DSPy | COMPARABLE_WITH_MAJOR_OPERATIONAL_ADVANTAGE | Meilleur enrichissement contextuel et bonnes mises à jour I02/I04 avec un appel par état; dialogue souvent terminé trop tôt. |
| LangExtract | WORSE_THAN_NOXIA | Extraction fidèle et rapide, mais relations et polarités faibles, avec inconnus obsolètes en multi-tour. |
| Outlines | COMPARABLE_WITHOUT_MEANINGFUL_ADVANTAGE | États riches et large couverture des clarifications, mais valeur des questions inégale et parsing réparé; lacunes simulateur limitantes. |

### Meilleure alternative externe observée

`PydanticAI` est la meilleure alternative externe de cette passe. Elle combine la meilleure reconstruction globale observée sur les branches multi-tour, une bonne conservation des corrections/négations et un appel provider par état. Ses limites sont une provenance/ownership moins structurés que SEM, des questions parfois guidées ou multi-parties, et des FINISH précoces en I03/I05.

DSPy confirme le signal de SEM-003D-COMP uniquement sur un axe: enrichissement contextuel utile avec étiquetage candidat. Il ne confirme pas une domination globale, car il termine à T0 en I01, I03 et I05.

## NOXIA / SEM

- State understanding: `PARTIAL_BUT_STRUCTURALLY_RICH`.
- Dialogue control produit: `NOXIA_INTERACTIVE_CONTROLLER_NOT_IMPLEMENTED`.
- Preuve de dépôt: `src/features/protocol-designer/intake/questions.ts` contient un registre fixe de cinq questions adaptatives; aucun contrôleur générique `ASK`/`FINISH`/`STOP` n'a été trouvé.
- Forces: relations natives, statut épistémique, négations/non-causalité, robustesse provider interactive.
- Faiblesses: dialogue control expérimental inégal, enrichissement I03 absent, 2,71 appels/état, latence élevée.
- Complexité expérimentale: bridge SEM d'environ 56 lignes Python + 110 lignes TypeScript, contre 7–15 lignes par adapter direct Instructor/PydanticAI/DSPy/Outlines et 43 lignes pour LangExtract.

## Incidents techniques conservés

- Une réservation PydanticAI smoke reste sans issue connue et compte comme consommée.
- Deux 504 smoke ont reçu l'unique retry autorisé.
- Des erreurs de parsing Outlines et de configuration LangExtract ont été corrigées avant leurs deux smokes réussis.
- Le batch simulateur I03 a omis Outlines et reste irrécupérable sans rejouer un succès.
- Le checkpoint I05 associait les réponses au texte des questions; un mapping déterministe vers les deux branches a permis de reprendre SEM T1 et Outlines T1 sans répéter le simulateur.
- La première tentative Outlines T1 a échoué localement avant réseau faute de clé exportée; elle reste comptée par prudence. La reprise avec la configuration locale existante a réussi.

## Frontières

- Revue d'experts humains réelle: `NO`.
- Qualification PD-011: `NO`.
- Blind réutilisé ou consulté: `NO`.
- Tuning scientifique après observation interactive: `NO`.
- Modification du comportement SEM produit: `NO`.
- Modification du SOURCE-OF-TRUTH-INDEX: `NO`.

## Décision et next

Décision: `EXP_INTERACTIVE_COMPARE_PARTIAL_TECHNICAL`.

Conclusion: `HYBRID_ARCHITECTURE`.

Prochaine action unique: concevoir et implémenter un contrôleur PD-009 générique au-dessus d'un contrat d'état scientifique préservé, puis préenregistrer une comparaison visible propre avec les textes exacts avant tout nouvel appel provider.
