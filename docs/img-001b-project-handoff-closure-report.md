# IMG-001B — Imaging → Research Project Handoff Closure

**Nature documentaire :** rapport d’implémentation et de validation de niveau 3

**Date :** 10 août 2026

**Périmètre :** correction bornée du handoff IMG-001 → PRJ-001

**Autorité normative :** aucune ; ce rapport ne modifie ni RDE-002, ni RDE-003, ni PD-003, ni PD-009

**Baseline Git :** branche `main`, commit `2adc8b144569f6d9cb21904b085b464297cc1db6`

## 1. Problème

PRJ-001 ne consomme une contribution Imaging que si son handoff porte `FROZEN_BY_HUMAN`. Dans l’état de départ, une dépendance équipement non résolue produisait `UNKNOWN_MANUFACTURER_DEPENDENCY`, maintenait le handoff IMG à `NOT_READY` et empêchait PRJ-001 de recevoir une stratégie pourtant scientifiquement construite.

La rupture provenait d’une confusion entre deux questions différentes :

- cette version de stratégie scientifique peut-elle être adoptée comme contribution au Research Project ?
- les capacités exactes de l’équipement permettent-elles de produire un protocole exécutable vérifié ?

IMG-001 répondait implicitement à la seconde avant d’autoriser la première. IMG-001B sépare ces maturités sans réduire les exigences scientifiques.

## 2. Autorités

Les sources ont été consultées dans l’ordre gouverné :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` ;
2. Charte fondatrice, source DOCX ;
3. Scientific Product Manifesto, source DOCX ;
4. Editorial Engine Architecture Manifesto, dans le dépôt externe protégé `editorial-engine`, en lecture seule ;
5. `PD-003`, `PD-004`, `PD-005`, `PD-009`, `PD-011` ;
6. `RDE-001`, `RDE-002`, `RDE-003` ;
7. rapports IMG-001 et PRJ-001.

Séparation documentaire appliquée :

| Catégorie | Contenu utilisé | Portée dans IMG-001B |
|---|---|---|
| Principes établis | absence ≠ fait ; décision humaine ; provenance ; versionnement ; impact ciblé | invariants non négociables |
| Références normatives | PD-003, PD-009, RDE-001/002/003 | contraintes de conception |
| Corpus scientifiques | résultats Knowledge et assertions déjà projetés | aucune modification ; aucune nouvelle vérité |
| Cible | handoff scientifique gelé avec inconnues conservées | capacité à atteindre |
| État réellement implémenté | IMG-001 et PRJ-001 live au commit de baseline | objet de la correction |
| Hypothèses | futurs catalogues d’équipements, connaissances exécutables, compatibilité déterministe | explicitement non disponibles |

Une tension de portée a été rendue explicite. RDE-003 §42 énumère l’équipement exact inconnu ou la compatibilité non démontrable parmi les conditions de refus, alors que RDE-002 §34 autorise la poursuite des branches indépendantes lorsqu’une inconnue n’est pas bloquante. IMG-001B ne résout pas cette tension par une modification normative : le refus RDE-003 demeure absolu pour la qualification technique et le protocole exécutable ; l’inconnue est seulement non bloquante pour le gel d’une stratégie scientifique destinée au Research Project. Une incompatibilité connue reste bloquante à tous les niveaux concernés.

Le SOURCE-OF-TRUTH-INDEX n’est pas modifié : aucune autorité, hiérarchie, admission scientifique ou identité documentaire n’a changé.

## 3. Baseline

- dépôt cible : `/Users/charles/Documents/Projets/NOXIA/noxia-dev` ;
- branche : `main` ;
- HEAD : `2adc8b144569f6d9cb21904b085b464297cc1db6` ;
- worktree cible propre avant IMG-001B ;
- dépôt externe `editorial-engine` déjà modifié avant la mission, HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, conservé en lecture seule ;
- IMG-001 ne pouvait pas produire un handoff live gelé avec équipement inconnu ;
- PRJ-001 exigeait correctement `FROZEN_BY_HUMAN` mais ne pouvait donc pas recevoir ce cas.

## 4. Sémantique précédente

`FROZEN_BY_HUMAN` impliquait de fait la résolution de toutes les chaînes cassées du graphe IMG, y compris `UNKNOWN_MANUFACTURER_DEPENDENCY`. Une réponse équipement absente bloquait également le gel. Cette sémantique rapprochait le gel scientifique d’une qualification technique complète et empêchait une inconnue honnête d’entrer dans le projet.

La disponibilité déclarée, la disponibilité vérifiée et la compatibilité n’étaient pas exposées comme surfaces de maturité distinctes dans le handoff PRJ.

## 5. Sémantique corrigée

Quatre niveaux orthogonaux sont maintenant portés par le contrat :

| Niveau | Signification |
|---|---|
| `SCIENTIFIC_STRATEGY_DEFINED` | la chaîne Question → Objectifs/Hypothèses → phénomène → biomarqueur → modalité → acquisition conceptuelle est défendable |
| `PROJECT_HANDOFF_READY` | la version a été adoptée humainement pour le Research Project, avec inconnues et limites intactes |
| `TECHNICAL_COMPATIBILITY_CONFIRMED` | compatibilité matériel/version/capacités effectivement démontrée ; cet état n’est jamais produit par défaut |
| `EXECUTABLE_PROTOCOL_READY` | paramètres exacts générables et vérifiés ; cet état reste indisponible dans l’implémentation courante |

`FROZEN_BY_HUMAN` signifie désormais : « cette version de stratégie Imaging est adoptée par un humain comme contribution au Research Project ». Il ne signifie ni disponibilité vérifiée, ni compatibilité confirmée, ni protocole exécutable.

## 6. Freeze

Le freeze reste interdit si l’un des éléments suivants est présent :

- contexte patient individuel ou dépendance Safety critique ;
- Question non reliée à des Objectifs/Hypothèses ;
- phénomène absent ;
- aucun biomarqueur défendable ;
- chaîne scientifique ou de QA structurellement cassée ;
- incompatibilité équipement explicite ;
- timing critique injustifié ;
- contradiction structurante non arbitrée ;
- question structurante hors équipement sans réponse ;
- porte humaine structurante non approuvée ;
- décision humaine de gel absente.

L’absence de constructeur, modèle, version, champ, option ou équipement local n’est plus un blocage du seul handoff de projet. Elle reste une inconnue visible et continue de bloquer la qualification technique et l’exécution.

Le système refuse maintenant l’approbation directe de `IMG-GATE-HANDOFF-FREEZE` tant que le handoff n’est pas `READY_FOR_HUMAN_FREEZE`.

## 7. Équipements

Chaque évaluation d’équipement distingue dorénavant la disponibilité et son niveau de preuve :

- `UNKNOWN` ;
- `DECLARED` ;
- `VERIFIED` ;
- `CONFIRMED_ABSENT`.

Le handoff agrège séparément la compatibilité :

- `UNKNOWN` ;
- `DECLARED_NOT_VERIFIED` ;
- `VERIFIED_AVAILABILITY_COMPATIBILITY_UNCONFIRMED` ;
- `PARTIALLY_KNOWN` ;
- `TECHNICAL_COMPATIBILITY_CONFIRMED` ;
- `INCOMPATIBLE` ;
- `NOT_APPLICABLE`.

Une disponibilité déclarée ou vérifiée n’est jamais convertie en compatibilité. La compatibilité exacte demeure inconnue tant qu’aucune connaissance exécutable gouvernée ne la démontre.

## 8. Unknown vs incompatible

`UNKNOWN_MANUFACTURER_DEPENDENCY` est non bloquant uniquement pour `PROJECT_HANDOFF_READY`. Il reste inscrit dans les inconnues, limites, revues futures et dans le graphe.

`EQUIPMENT_INCOMPATIBLE_WITH_REQUIRED_MODALITY` a été ajouté comme rupture explicite. Il bloque le freeze lorsque l’équipement déclaré est indisponible pour la modalité requise ou appartient explicitement à une autre famille. PRJ ne reçoit alors aucune contribution Imaging valide.

Les invariants vérifiés sont :

- `UNKNOWN ≠ AVAILABLE` ;
- `UNKNOWN ≠ COMPATIBLE` ;
- `UNKNOWN ≠ INCOMPATIBLE` ;
- `DECLARED ≠ VERIFIED` ;
- `VERIFIED_AVAILABILITY ≠ TECHNICAL_COMPATIBILITY_CONFIRMED`.

## 9. Project handoff

Le handoff IMG → PRJ passe en version `1.1` et contient explicitement :

- `status` ;
- `imagingStrategyVersion` ;
- `humanDecision` et son `decisionRecordId` ;
- `scientificStrategyStatus` ;
- `projectHandoffReadiness` ;
- `equipmentCompatibilityStatus` ;
- `executableProtocolReadiness` ;
- `unknowns` ;
- `limitations` ;
- `contradictions` ;
- `requiredFutureReviews` ;
- `provenance` ;
- `trace`.

Le schéma de session valide ce contrat et valide également l’historique des handoffs gelés. `imagingStrategyVersion` est dérivée du contenu scientifique, technique conceptuel et des changements confirmés ; une proposition de changement non confirmée ne remplace pas la version gelée.

## 10. Executable readiness

`executableProtocolReadiness` reste `EXECUTABLE_PROTOCOL_NOT_READY` dans tous les cas produits par IMG-001B. Les acquisitions de niveau 3 conservent `NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE` et la liste des familles de paramètres interdites.

Une demande de TR, TE, résolution ou paramètres constructeur exacts peut coexister avec un `PROJECT_HANDOFF_READY` conceptuel, mais ne produit aucune valeur. Le Research Project reçoit la limitation et la revue future requise ; il ne reçoit jamais un protocole exécutable.

## 11. PRJ integration

PRJ-001 accepte uniquement un résultat IMG à la fois :

- `FROZEN_BY_HUMAN` ;
- `PROJECT_HANDOFF_READY`.

Il conserve les états Imaging dans son contrat source et sa contribution : aptitude au handoff, compatibilité, aptitude exécutable, limitations et revues futures.

La faisabilité technique est évaluée séparément :

- `INCOMPATIBLE` → `BLOCKED` ;
- compatibilité inconnue, déclarée, partiellement connue ou disponibilité vérifiée sans compatibilité → `PARTIAL` ;
- compatibilité technique confirmée → `READY_WITH_LIMITATIONS`, car le protocole exécutable reste indisponible ;
- projet sans Imaging → `NOT_APPLICABLE`.

Aucun score global, équipement de substitution, alternative automatique ou paramètre n’est créé.

## 12. Impacts

`EquipmentChanged` est désormais un événement majeur. Après confirmation d’un changement majeur :

- les portes Acquisition, Multicenter et Handoff Freeze sont rouvertes de manière ciblée ;
- les impacts `REVIEW_REQUIRED` sont conservés ;
- le handoff courant redevient non gelé ;
- la version gelée antérieure entre dans `handoffHistory` ;
- le Project Construction live devenu obsolète est archivé avec son motif d’invalidation ;
- l’interface revient à Imaging pour requalification.

Une proposition non confirmée conserve la stratégie gelée. Aucun changement n’est appliqué silencieusement.

## 13. Cas produits

| Cas | Résultat obtenu |
|---|---|
| 1 — IRM justifiée, équipement inconnu | freeze et handoff PRJ possibles ; `UNKNOWN` conservé ; exécutable indisponible |
| 2 — équipement déclaré disponible | `DECLARED_NOT_VERIFIED` ; limitation explicite ; handoff possible |
| 2b — disponibilité vérifiée | `VERIFIED_AVAILABILITY_COMPATIBILITY_UNCONFIRMED` ; aucune promotion de compatibilité |
| 3 — équipement incompatible | freeze bloqué ; rupture explicite ; handoff PRJ non valide |
| 4 — multicentrique partiellement connu | handoff possible ; `PARTIALLY_KNOWN` ; harmonisation future requise |
| 5 — paramètres exacts demandés | handoff conceptuel possible ; aucune valeur ; exécutable non prêt |
| 6 — décision humaine absente | freeze impossible |
| 7 — changement après freeze | impact propagé ; historique conservé ; requalification ciblée |
| 8 — projet sans imagerie | PRJ poursuit avec Imaging `NOT_APPLICABLE` |

## 14. Browser

Validation effectuée dans l’application locale rendue, via le parcours utilisateur, sans mutation directe du stockage de session.

1. **Projet Imaging avec équipement inconnu :** Question ECV/T1/fibrose, phénomène corrigé humainement après fallback linguistique local, équipement laissé inconnu ; stratégie construite.
2. **Décision humaine :** portes IMG approuvées successivement ; aucun contournement du gel possible avant `READY_FOR_HUMAN_FREEZE`.
3. **Passage IMG → PRJ :** état visible `FROZEN_BY_HUMAN`, bouton de handoff actif, ouverture effective du Research Project.
4. **Incertitude technique dans PRJ :** `TECHNICAL_FEASIBILITY = PARTIAL`, `Compatibilité : UNKNOWN`, qualification requise avant protocole exécutable.
5. **Exécutable indisponible :** retour Imaging affichant simultanément `PROJECT_HANDOFF_READY`, `UNKNOWN` et `EXECUTABLE_PROTOCOL_NOT_READY`.
6. **Retour Imaging et modification :** changement majeur proposé, impacts visibles avant confirmation ; après confirmation, handoff bloqué, deux portes ciblées rouvertes et `Historique gelé conservé : 1`.
7. **Projet sans imagerie :** entrée directe dans Project Construction, sans régression et sans contribution Imaging inventée.

La console de l’application ne contenait aucune erreur. L’API linguistique n’était pas disponible dans l’instance Vite locale ; le fallback prévu et la correction humaine des champs ont été utilisés. Cette indisponibilité ne modifie pas les résultats IMG/PRJ mais limite la validation du fournisseur linguistique live.

## 15. Tests

| Validation | Résultat |
|---|---|
| Tests IMG-001 | 60/60 PASS |
| Tests IMG-001B dédiés | 8/8 PASS |
| Tests PRJ-001 | 56/56 PASS |
| Tests Scientific Thinking | 30/30 PASS |
| Tests Knowledge | 87/87 PASS |
| Tests Protocol Designer | 148/148 PASS |
| Typecheck | PASS |
| Lint | PASS, 0 erreur ; 7 avertissements Fast Refresh préexistants |
| Build production | PASS ; avertissement non bloquant sur un chunk supérieur à 500 kB |
| `git diff --check` | PASS en clôture, rapport inclus |
| Suite globale | 877/880 PASS ; 3 échecs exclusivement dus au worktree externe `editorial-engine` déjà modifié |

Les trois échecs globaux sont les gardes historiques qui exigent que `/Users/charles/Documents/Projets/editorial-engine` soit propre. Ils ne touchent aucun contrat, test ou fichier IMG-001B/PRJ-001. Le dépôt externe a été conservé en lecture seule.

## 16. Limitations

- Aucun catalogue gouverné d’équipements ou moteur général de compatibilité n’existe.
- Aucune compatibilité exacte n’est confirmée par l’implémentation courante.
- Aucun protocole d’acquisition exécutable n’est générable.
- La qualification des sites, la QA opérationnelle, l’harmonisation multicentrique, le Core Lab, Biostatistics, Data Management, Safety et Operations restent des revues futures spécialisées.
- Le fournisseur linguistique live n’a pas été validé dans le navigateur local ; le parcours de fallback a été utilisé.
- Les sept avertissements lint et l’avertissement de taille de chunk sont antérieurs ou transversaux et non bloquants pour IMG-001B.
- La suite globale reste rouge tant que le dépôt externe protégé `editorial-engine` est sale ; les suites ciblées et critiques IMG-001B sont vertes.

## 17. Fichiers modifiés

- `src/features/imaging-study-designer/types.ts`
- `src/features/imaging-study-designer/engine.ts`
- `src/features/imaging-study-designer/graph.ts`
- `src/features/imaging-study-designer/session.ts`
- `src/features/imaging-study-designer/change.ts`
- `src/features/imaging-study-designer/ImagingStudyDesignerView.tsx`
- `src/features/imaging-study-designer/__tests__/img-001b-project-handoff.test.ts`
- `src/features/research-project-construction/types.ts`
- `src/features/research-project-construction/input.ts`
- `src/features/research-project-construction/engine.ts`
- `src/features/research-project-construction/__tests__/fixtures.ts`
- `src/features/protocol-designer/intake/types.ts`
- `src/features/protocol-designer/intake/session.ts`
- `src/pages/ProtocolDesignerDemo.tsx`
- `package.json`
- `docs/img-001b-project-handoff-closure-report.md`

Aucun document normatif, corpus, Reasoning Book, Scientific Program, Territory Model, Knowledge Graph ou Editorial Engine n’a été modifié.

## 18. Contrats

Les versions de contrat deviennent :

- Imaging Study Designer : `1.1.0` ;
- Imaging → Project handoff : `1.1` ;
- session Protocol Designer persistée : `8.0` et clé de stockage v8, afin de ne pas relire silencieusement une session v7 incompatible.

Compatibilité conservée :

- le handoff IMG reste une projection de session, jamais une source de vérité ;
- la décision humaine possède un identifiant traçable ;
- la provenance et la trace sont présentes ;
- l’historique immuable conserve la version gelée remplacée ;
- PRJ refuse une contribution non gelée ou non prête ;
- PRJ distingue contribution scientifique et faisabilité technique ;
- le parcours sans imagerie reste `NOT_APPLICABLE` ;
- aucun protocole, paramètre, équipement ou compatibilité n’est inventé.

## 19. Décision de suite

La rupture IMG-001 → PRJ-001 est fermée au niveau de la stratégie scientifique et du Research Project. Les limitations restantes correspondent aux moteurs et connaissances techniques explicitement non implémentés, ainsi qu’à l’état sale préexistant du dépôt externe vérifié par la suite globale ; elles ne réouvrent pas le handoff corrigé.

`IMAGING_PROJECT_HANDOFF_CLOSED_WITH_LIMITATIONS`
