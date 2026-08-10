# DOC-002 — Documentary Knowledge Pattern Engine

**Rapport d’implémentation V1**

**Version du moteur :** `1.0.0`

**Version du catalogue :** `1.0.0`

**Date de validation finale :** 11 août 2026

**Date d’extraction du catalogue :** 10 août 2026

**Nature documentaire :** preuve technique de niveau implémentation, sans autorité normative, scientifique ou réglementaire

## 1. Décision

`DOCUMENTARY_KNOWLEDGE_PATTERN_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`

DOC-002 est implémenté comme un moteur déterministe de connaissances documentaires. Il transforme des observations déjà extraites par DOC-000 en patterns abstraits, traçables, versionnés et reliés. Il ne relit pas les documents bruts, ne produit aucun document, ne construit aucun Research Project ou Template, ne choisit aucune question, ne crée aucune connaissance scientifique, ne qualifie aucune exigence réglementaire et ne prend aucune décision.

La décision reste assortie de limitations : les corpus exploités restent candidats, historiques, locaux ou externes selon leur source ; 84 patterns n’ont pas encore de variante observée distincte ; le corpus réel ne contient aucune contradiction abstraite qualifiée comme telle ; aucune évaluation PD-011 n’est revendiquée ; la suite globale conserve trois échecs préexistants liés à l’état sale du dépôt Editorial Engine externe.

Ce rapport est la référence d’implémentation DOC-002. Il ne devient pas une autorité NOXIA et n’est pas admis dans le SOURCE-OF-TRUTH-INDEX par sa seule création.

## 2. Autorités consultées

La consultation a commencé par `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, puis a suivi la hiérarchie documentaire applicable :

1. NOXIA — Charte fondatrice ;
2. NOXIA Protocol Designer — Scientific Product Manifesto ;
3. NOXIA Protocol Designer — Product Specification ;
4. Editorial Engine — Architecture Manifesto, en lecture seule dans le dépôt externe ;
5. PD-003 — Research Object Model ;
6. PD-004 — UX Manifesto ;
7. PD-005 — Prompt Library Architecture ;
8. PD-009 — Decision Engine Architecture ;
9. PD-011 — Evaluation Framework ;
10. RDE-001 — Research Design Engine Architecture ;
11. RDE-002 — Research Design Workflow ;
12. RDE-003 — Imaging Engine Architecture ;
13. KE-001 — Knowledge Engine Architecture ;
14. DOC-001 — Document Projection & Composition Engine et son rapport ;
15. DOC-000A, DOC-000B, DOC-000B-R1, DOC-000C et DOC-000D, uniquement via leurs livrables déjà extraits ;
16. REG-000 et REG-001, en lecture seule.

Séparation appliquée :

- **principes établis :** science avant technologie, décision humaine, inconnus et contradictions conservés, traçabilité, reproductibilité et arrêt honnête ;
- **références normatives :** documents précités, consommés sans modification ;
- **corpus documentaires :** observations candidates et preuves de pratiques, sans autorité scientifique ou réglementaire ;
- **cible :** couche de savoir-faire documentaire réutilisable ;
- **état réellement implémenté :** feature déterministe, catalogue sérialisé, graphe, audit, projections passives et tests ;
- **hypothèses :** usages futurs par TMP-001 et les moteurs spécialisés, non implémentés ici.

## 3. Baseline

- dépôt : `noxia-dev` ;
- branche initiale et finale : `main` ;
- HEAD de départ : `4aa0c0f7ccf2a38dc59065f57d12503c9e6eba13` ;
- worktree NOXIA propre avant DOC-002 ;
- dépôt Editorial Engine externe : branche `main`, HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, déjà non propre avant DOC-002 ;
- aucun commit, push ou déploiement réalisé.

Un manifeste SHA-256 initial a été capturé pour 27 livrables DOC-000 directement consultés. Le catalogue final étend l’inventaire d’intégrité à 44 artefacts dérivés de premier niveau sous `_audit` et `_intelligence`. `build:documentary-patterns:check` recalcule leurs empreintes et refuse toute dérive par rapport aux sorties sérialisées.

Contrôles finaux d’intégrité :

- 44/44 artefacts DOC-000 du manifeste final correspondent à leur empreinte sérialisée ;
- les 27 artefacts de la baseline directement consommée sont inchangés ;
- REG-000, son schéma, son test et son rapport n’ont aucun diff contre le HEAD de départ ;
- REG-001, son test et son rapport n’ont aucun diff contre le HEAD de départ ;
- aucune écriture n’a eu lieu dans `docs-audit` ou dans le dépôt Editorial Engine externe ;
- les dossiers sources restreints et l’archive DOC-000D n’ont pas été ouverts par DOC-002.

Contradictions documentaires conservées :

- DOC-000C ferme l’exploitation générale du corpus mais autorise une réouverture ciblée ; DOC-002 consomme uniquement les sorties extraites explicitement désignées, sans nouvelle campagne brute ;
- REG-000 décrit l’absence historique de DOC-000 dans son checkout ; ce constat reste historique et n’est pas réécrit ;
- le rapport DOC-002 est requis comme référence d’implémentation mais ne devient pas une autorité ; le SOURCE-OF-TRUTH-INDEX reste donc inchangé.

## 4. Objectifs

DOC-002 réalise quatre objectifs bornés :

1. représenter les faits documentaires contextualisés déjà extraits ;
2. abstraire des comportements de travail réutilisables sans recopier de valeurs locales ;
3. conserver preuves, provenance, variantes, limites et relations ;
4. exposer des contrats de consultation passifs pour des consommateurs futurs.

Le moteur n’apprend pas la science, ne valide pas une pratique, ne produit pas de recommandation et ne remplace aucun corpus d’origine.

## 5. Architecture générale

L’architecture implémente quatre niveaux distincts :

1. **Source Documents :** preuves externes au moteur, jamais modifiées et non relues lorsque DOC-000 a déjà extrait le signal ;
2. **Extracted Documentary Facts :** observations contextualisées, avec source, date d’extraction, portée et limites ;
3. **Documentary Patterns :** abstractions de comportements de travail, indépendantes d’un document particulier mais reconstructibles ;
4. **Pattern Graph :** nœuds et relations dirigées typées entre patterns, faits, preuves, sources et références externes bornées.

Le moteur travaille uniquement des niveaux 2 à 4. La persistance JSON est indépendante des vues `CATALOG`, `GRAPH`, `PROVENANCE`, `AUDIT` et `STATISTICS`.

## 6. Documentary Facts

Le corpus contient **120 Documentary Facts**. Chaque fait porte une identité déterministe, une clé comportementale, un nom abstrait, une description, une catégorie, une origine, une portée, des entrées, des actions, des sorties, des preuves, des variantes, des limites, une date d’extraction et des références de sources.

Les faits proviennent exclusivement de livrables déjà extraits : cartes de patterns DOC-000D, intelligence DOC-000B, structures réutilisables, variantes, candidats DOC-000A, cycle documentaire, comparaison FDA/local et rapports de clôture. Les chemins de documents bruts, valeurs individuelles et contenus restreints ne sont pas importés.

## 7. Documentary Patterns

Le catalogue contient **120 Documentary Patterns**. Chaque objet fournit au minimum :

`patternId`, `name`, `description`, `category`, `status`, `confidence`, `origin`, `sources`, `evidence`, `relationships`, `variants`, `limitations`, `provenance`, `version` et `createdFrom`.

Les statuts autorisés sont fermés : `CANDIDATE_ONLY`, `SUPPORTED_BY_MULTIPLE_DOCUMENTS`, `SUPPORTED_BY_MULTIPLE_FAMILIES`, `LOCAL_PRACTICE`, `HISTORICAL_REFERENCE`, `EXTERNAL_REFERENCE`, `SUPERSEDED` et `UNKNOWN`. `VALIDATED`, `OFFICIAL` et `APPROVED` sont explicitement interdits.

## 8. Pattern Graph

Le graphe contient les nœuds `PATTERN`, `FACT`, `EVIDENCE`, `SOURCE` et `EXTERNAL_REFERENCE`. Il expose **269 relations dirigées** et un digest logique indépendant de l’ordre des entrées.

Chaque pattern possède au moins une arête `SUPPORTED_BY` et une arête `DERIVES_FROM`. Les références REG-000/REG-001 sont des nœuds externes bornés ; elles ne deviennent jamais des patterns ni des autorités détenues par DOC-002.

## 9. Catégories

Le catalogue de catégories contient les **25 catégories minimales**. Vingt-deux sont représentées dans le corpus V1 ; `Operational`, `Software` et `Unknown` restent disponibles sans pattern forcé.

| Catégorie représentée | Patterns |
|---|---:|
| Document Structure | 42 |
| Data | 14 |
| Quality | 10 |
| CoreLab | 8 |
| Acquisition | 6 |
| Monitoring | 6 |
| Validation | 6 |
| Equipment | 4 |
| Workflow | 4 |
| Training | 3 |
| Funding | 2 |
| Human Decision | 2 |
| Project | 2 |
| Regulatory Interaction | 2 |
| Risk | 2 |
| Communication | 1 |
| Decision | 1 |
| Deviation | 1 |
| Editorial | 1 |
| Imaging | 1 |
| Review | 1 |
| Troubleshooting | 1 |

La classification ne modifie ni l’origine ni l’autorité d’un pattern.

## 10. Variantes

Le catalogue conserve **47 variantes** : `OBSERVED_VARIANT`, `HISTORICAL_VARIANT`, `LOCAL_VARIANT`, `TARGET_VARIANT` ou `UNRESOLVED_VARIANT`. Chaque variante référence une preuve du pattern, décrit son applicabilité et conserve ses limites.

Les variantes locales Core Lab ne deviennent pas des valeurs par défaut. La structure de protocole conserve sections observées et blocs conditionnels comme alternatives explicites. **84 patterns** n’ont pas encore de variante distincte documentée ; cette absence reste visible et n’est pas comblée.

## 11. Consolidation

La consolidation groupe uniquement les faits partageant la même identité comportementale canonique. Une similarité lexicale ne suffit jamais. Deux formulations de la même clé peuvent fusionner leurs preuves ; deux comportements proches mais différents conservent deux identités.

Les tests démontrent :

- fusion de deux faits à comportement identique ;
- absence de fusion pour deux comportements textuellement proches ;
- stabilité des identités lorsque l’ordre des faits change ;
- nouvelle identité lorsque le comportement change.

## 12. Normalisation

La normalisation applique NFKC, homogénéise les apostrophes et espaces et utilise une clé comportementale, jamais la phrase descriptive, pour l’identité. Les listes de sources, faits et preuves sont triées et dédupliquées avant digest.

Le générateur exclut ou abstrait : noms d’étude, plateformes, constructeurs, paramètres chiffrés, dates locales, personnes, contacts et chemins bruts. L’audit sensible détecte notamment adresses électroniques, numéros de téléphone, dates individuelles, valeurs avec unités exécutables et identifiants locaux connus.

## 13. Relations

Le contrat accepte les vingt types requis :

`DEPENDS_ON`, `REQUIRES`, `OPTIONALLY_REQUIRES`, `PRECEDES`, `FOLLOWS`, `GENERATES`, `CONSUMES`, `VALIDATES`, `REVIEWS`, `REPLACES`, `SPECIALIZES`, `GENERALIZES`, `CONFLICTS_WITH`, `COMPLEMENTS`, `USES`, `DERIVES_FROM`, `SUPPORTED_BY`, `ALTERNATIVE_TO`, `COEXISTS_WITH` et `PRODUCES`.

Chaque relation porte identité déterministe, source, cible, type, justification, preuves, sources de provenance et statut. Une relation `CONFLICTS_WITH` reste `UNRESOLVED`. Le lien vers `REG-000:REQUIREMENT_REFERENCE` est uniquement `COEXISTS_WITH` ; il ne produit aucune Requirement.

## 14. Versionnement

Les identités de pattern dérivent du comportement, pas de la date ou de l’ordre des sources. Une preuve compatible conserve le même `patternId` et produit une révision explicite. Un changement du comportement produit une nouvelle identité.

Les snapshots de catalogue sont append-only. Chaque snapshot conserve `catalogId`, version, digest, date, motif et référence vers le snapshot antérieur. Une tentative de branche sur un historique déjà avancé est refusée par `PATTERN_HISTORY_NON_APPEND_ONLY`. Aucun ancien snapshot n’est muté.

## 15. Provenance

La couverture de provenance est **100 %**. Chaque pattern relie :

pattern → fait extrait → preuve → source dérivée → corpus → version → empreinte → date d’extraction.

La provenance contient les identifiants de sources, preuves et faits, les versions des artefacts, les dates d’extraction, la version de la règle d’abstraction et un digest du record. Un pattern sans preuve ou provenance est une erreur d’audit bloquante.

## 16. Catalogue

Le catalogue maître machine-readable est `documentary-pattern-corpus.json`. Il agrège identité, version, sources, patterns, relations, graphe, statistiques, audit, digest et frontière permanente.

Les projections séparées permettent une consommation ciblée sans déplacer la source de vérité : faits, patterns, graphe, catégories, variantes, relations, statistiques, audit et catalogue des sources disposent chacun d’un JSON dédié.

## 17. Statistiques

Les statistiques sont descriptives ; elles ne mesurent ni validité scientifique, ni conformité, ni qualité globale.

| Indicateur | Valeur |
|---|---:|
| Patterns | 120 |
| Documentary Facts | 120 |
| Catégories contractuelles | 25 |
| Catégories représentées | 22 |
| Variantes | 47 |
| Relations | 269 |
| Preuves | 122 |
| Sources dérivées inventoriées | 44 |
| Preuves moyennes par pattern | 1,02 |
| `LOCAL_PRACTICE` | 37 |
| `HISTORICAL_REFERENCE` | 1 |
| `EXTERNAL_REFERENCE` | 1 |
| `CANDIDATE_ONLY` | 79 |
| `SUPPORTED_BY_MULTIPLE_DOCUMENTS` | 0 |
| `SUPPORTED_BY_MULTIPLE_FAMILIES` | 2 |
| Contradictions du corpus réel | 0 |
| Consommateurs futurs documentés | 9 |
| Patterns orphelins | 0 |
| Patterns sans provenance | 0 |
| Patterns sans consommateur prévu | 0 |
| Patterns sans variante | 84 |
| Patterns superseded | 0 |
| Patterns signalant une revue/décision humaine | 30 |

Le niveau de confiance reste strictement documentaire : 37 `LOCAL_ONLY`, 81 `SINGLE_DOCUMENT` et 2 `MULTIPLE_DOCUMENTS`. Aucun support multi-projet ou multi-institution n’est inventé.

## 18. Patterns documentaires

Les patterns documentaires couvrent contrôle de document, identité/version/date, historique des changements, sections longues, définitions, portée, références, check-lists, inventaires, dictionnaires, blocs de trace et structures de protocole.

Ils décrivent une forme de travail. Ils ne fournissent aucun contenu scientifique, réglementaire ou clinique.

## 19. Patterns éditoriaux

Le pattern `Niveau d’engagement documentaire explicite` conserve la distinction entre observation, candidat, limite, décision et rejet. Il abstrait le comportement éditorial sans mémoriser les formulations originales et interdit toute augmentation silencieuse du niveau d’engagement.

DOC-002 ne rédige pas. Toute future formulation relèvera d’un consommateur distinct et devra conserver cette qualification.

## 20. Patterns métier

Les patterns métier couvrent workflow, projet, qualité, données, financement, risque, communication, review et décision. Ils représentent des savoir-faire transversaux : qualifier l’applicabilité, tracer une remise, séparer owner et approbateur, conserver un finding, suivre une action et rendre une limite visible.

Ils ne sont ni une ontologie métier nouvelle, ni des objets PD-003, ni des règles exécutables.

## 21. Patterns Core Lab

DOC-000D produit **37 patterns locaux**, dont 34 patterns sources Core Lab et trois structures DOC-000B/R1 qualifiées locales. Le graphe conserve des patterns distincts pour : prise en charge, acquisition, qualification et activation de site, équipement/version, dé-identification, transfert, réception, QC, lecture, interprétabilité, adjudication, monitoring, déviation, calibration, archivage, formation, feedback et frontière source/connaissance.

Le cas métier démontre un workflow distribué et relié, jamais un pattern monolithique. Aucune dose, fenêtre, paramètre, plateforme, logiciel ou compatibilité n’est promu.

## 22. Patterns réglementaires

DOC-002 contient deux patterns de `Regulatory Interaction` : une structure documentaire candidate issue du corpus et la séparation explicite d’une référence externe avec une pratique locale.

Le moteur ne peut pas produire `REGULATORY_REQUIREMENT`, `LEGAL_REQUIREMENT` ou `APPROVAL_REQUIREMENT`. Le seul lien vers REG-000 est une relation `COEXISTS_WITH` à un nœud externe. REG-000/REG-001 conservent seuls la responsabilité réglementaire.

## 23. Patterns historiques

Un pattern `HISTORICAL_REFERENCE` représente le cycle documentaire descriptif avec branches et reprises. La fréquence historique ne produit jamais `CURRENT`. Les procédures, versions et séquences anciennes restent des repères d’évolution, pas des pratiques actuelles.

L’audit `HISTORICAL_PATTERN_PROMOTED` bloque toute promotion de ce statut.

## 24. Patterns locaux

Les 37 patterns locaux conservent `origin=LOCAL_PRACTICE`, `status=LOCAL_PRACTICE` et `confidence=LOCAL_ONLY`, même lorsqu’ils disposent de plusieurs documents sources.

La répétition, la présence d’une signature, un nom de fichier final ou une convergence avec une référence externe ne change jamais ce statut. L’audit `LOCAL_PATTERN_PROMOTED` rend toute promotion bloquante.

## 25. Patterns externes

Le guide FDA est représenté uniquement comme `EXTERNAL_REFERENCE`. Il sert à comparer des domaines de gouvernance et à exposer des écarts. Il ne valide, n’approuve et ne rend conforme aucune pratique locale.

Les vocabulaires `VALIDATED_BY_FDA`, `APPROVED_BY_FDA`, `FDA_COMPLIANT`, `LEGAL_MANDATORY` et `REGULATORY_MANDATORY` sont absents des patterns. L’audit `EXTERNAL_REFERENCE_PROMOTED` bloque toute promotion.

## 26. Patterns contradictoires

Le corpus V1 ne contient aucune contradiction comportementale suffisamment qualifiée pour créer une relation réelle `CONFLICTS_WITH`. Cette valeur n’est pas remplacée par un conflit artificiel : statistique finale, **0**.

La capacité est néanmoins testée avec deux workflows incompatibles. Les deux patterns restent présents, la relation est `CONFLICTS_WITH / UNRESOLVED`, l’audit émet `UNRESOLVED_CONTRADICTION` et le moteur ne choisit aucune branche.

## 27. Patterns de décision

Les patterns de décision et de Human Decision conservent rôle, mandat, décision, revue, date, justification et impact comme structure de traçabilité. Une signature visuelle ou un indice d’approbation ne prouve jamais qu’une décision a été prise.

Le moteur public ne possède aucune opération `decide` et ne crée aucune Human Decision Envelope.

## 28. Patterns d’équipement

Quatre patterns décrivent profil d’équipement, capacité, version/options, calibration et compatibilité par exigence et preuve. Les noms de constructeur, modèle et package sont exclus de l’abstraction.

La compatibilité reste `NOT_ESTABLISHED` lorsqu’elle n’est pas prouvée ; DOC-002 ne recommande aucun matériel ou logiciel.

## 29. Patterns de formation

Trois patterns couvrent qualification du lecteur, formation avec test et maintien, et formation opérateur liée à une procédure versionnée. Ils conservent preuve, version, contexte et décision humaine de qualification.

Aucun matériel local, nom de personne ou critère propre à une étude n’est reproduit.

## 30. Patterns de monitoring

Six patterns couvrent jalons, suivi, monitoring fondé sur les risques, feedback, actions, délais et escalades. Les relations lient QC, déviation, action et clôture sans clore automatiquement un finding.

Les métriques, seuils et calendriers restent propres au projet et au moteur consommateur autorisé.

## 31. Patterns de validation

Six patterns représentent la chaîne Validation SI : besoin, risque, spécification, test, anomalie, correction, impact du changement et revue. Les relations `PRECEDES`, `REQUIRES` et `GENERATES` rendent le chemin interrogeable.

Ces patterns restent candidats. Ils ne déclarent ni méthode universelle, ni test réussi, ni système validé, ni mise en production autorisée.

## 32. Patterns de workflow

Quatre patterns explicites et plusieurs relations inter-catégories décrivent cycles, remises, dépendances et retours. Le Core Lab conserve un workflow distribué ; le cycle d’étude reste historique et descriptif.

Une relation de workflow n’est jamais exécutée par DOC-002. Le moteur décrit, interroge et projette le graphe en lecture seule.

## 33. Audit automatique

L’audit détecte, sans corriger :

`PATTERN_WITHOUT_EVIDENCE`, `PATTERN_WITHOUT_PROVENANCE`, `PATTERN_WITHOUT_CATEGORY`, `ORPHAN_PATTERN`, `DANGLING_RELATION`, `INVALID_VARIANT`, `CIRCULAR_HIERARCHY`, `UNRESOLVED_CONTRADICTION`, `LOCAL_PATTERN_PROMOTED`, `EXTERNAL_REFERENCE_PROMOTED`, `HISTORICAL_PATTERN_PROMOTED`, `SENSITIVE_VALUE_LEAK`, `SOURCE_VERSION_MISSING` et `BROKEN_SOURCE_REFERENCE`.

Résultat sur le corpus livré : **0 erreur, 0 avertissement, 0 information**, audit `passed=true`. Les quatorze diagnostics sont chacun déclenchés par une fixture négative ; l’état fautif reste identique avant et après audit.

## 34. Tests

| Validation | Résultat |
|---|---:|
| DOC-002 ciblé | 42/42 PASS |
| DOC-001 + REG-000 + REG-001 | 59/59 PASS |
| Research Project | 56/56 PASS |
| Imaging | 60/60 PASS |
| Scientific Thinking | 33/33 PASS |
| Knowledge + External Evidence | 87/87 PASS |
| SYS + SYS-001B | 34/34 PASS |
| Protocol Designer + Intent | 148/148 PASS |
| Reproductibilité du générateur | PASS |
| Typecheck | PASS |
| Lint | 0 erreur, 7 avertissements Fast Refresh préexistants |
| Build production | PASS, avertissements de dépendance et taille de chunk préexistants |
| `git diff --check` | PASS |
| Suite globale | 1 015/1 018 PASS |

Les trois échecs globaux sont les contrôles P3M-Web, P4 et P5 qui exigent un dépôt externe `editorial-engine` propre. Ce dépôt avait déjà le même HEAD et le même état sale avant DOC-002 ; aucun fichier n’y a été modifié par cette mission. Tous les tests fonctionnels NOXIA et DOC-002 passent.

Les tests DOC-002 couvrent : document unique, plusieurs documents/projets/institutions, fusion exacte, non-fusion sémantique, ordre des sources et faits, reformulation non sémantique, statuts local/historique/externe/inconnu, variantes, contradictions, FDA/local, relation REG-000, provenance 100 %, versionnement append-only, sensibilité, Core Lab, huit cas métier, neuf consumers, projections passives, imports/exports et frontières moteur.

## 35. Contrats de non-régression

| Contrat | Résultat |
|---|---:|
| DOC-C01 — un Pattern ne devient jamais une vérité scientifique | PASS |
| DOC-C02 — une pratique locale reste locale | PASS |
| DOC-C03 — une référence historique reste historique | PASS |
| DOC-C04 — une référence externe reste externe | PASS |
| DOC-C05 — une recommandation ne devient pas une obligation réglementaire | PASS |
| DOC-C06 — toute contradiction reste visible | PASS |
| DOC-C07 — tout Pattern possède une provenance | PASS |
| DOC-C08 — toute version historique reste reconstructible | PASS |
| DOC-C09 — aucune donnée sensible ne fuit dans les Patterns | PASS |
| DOC-C10 — l’ordre des sources n’influence pas le résultat logique | PASS |
| DOC-C11 — DOC-002 ne produit aucun Research Project | PASS |
| DOC-C12 — DOC-002 ne produit aucun Template | PASS |
| DOC-C13 — DOC-002 ne prend aucune décision humaine | PASS |
| DOC-C14 — DOC-002 ne sélectionne aucune méthode scientifique | PASS |
| DOC-C15 — DOC-002 ne modifie aucun corpus source | PASS |
| DOC-C16 — une relation réglementaire reste une relation | PASS |

Non-régressions fonctionnelles démontrées : Knowledge Engine, Scientific Thinking, Imaging, Research Project, Document Projection, REG-000, REG-001, SYS-001B, Protocol Designer, Intent et External Evidence. Les empreintes et diffs démontrent l’absence de modification des corpus DOC-000, REG-000 et REG-001.

## 36. Limitations

- DOC-002 n’apprend pas la science.
- DOC-002 ne décide jamais.
- DOC-002 ne crée aucune recommandation.
- DOC-002 ne produit aucun protocole, document ou projection documentaire DOC-001.
- DOC-002 ne valide aucune étude, pratique, méthode, personne, site, équipement ou système.
- DOC-002 ne remplace pas les corpus d’origine.
- La qualité du catalogue dépend de la qualité et de la qualification des sorties DOC-000.
- Un pattern historique ne bénéficie d’aucune garantie d’actualité.
- Une pratique locale ne devient jamais générale.
- Une référence externe ne devient jamais une autorité détenue par DOC-002.
- Les 44 sources inventoriées sont des livrables dérivés de premier niveau ; les documents bruts et archives restreintes restent hors du moteur.
- Les statuts `SUPPORTED_BY_MULTIPLE_PROJECTS` et `SUPPORTED_BY_MULTIPLE_INSTITUTIONS` n’existent pas : ces dimensions sont des niveaux de confiance, et aucune preuve réelle ne permet de les attribuer dans le corpus livré.
- Aucun pattern réel contradictoire n’a été inventé pour satisfaire une métrique ; la capacité est démontrée par fixture.
- 84 patterns n’ont pas de variante distincte documentée.
- Les consumers futurs ne sont pas implémentés ; leurs adapters sont des références read-only.
- Aucun PASS scientifique PD-011, conformité réglementaire, activation produit ou publication n’est revendiqué.
- La suite globale reste affectée par trois contrôles du dépôt Editorial Engine externe déjà sale.

## 37. Fichiers modifiés

### Nouveaux fichiers moteur

- `src/features/documentary-knowledge/types.ts` ;
- `src/features/documentary-knowledge/canonical.ts` ;
- `src/features/documentary-knowledge/model.ts` ;
- `src/features/documentary-knowledge/audit.ts` ;
- `src/features/documentary-knowledge/persistence.ts` ;
- `src/features/documentary-knowledge/projections.ts` ;
- `src/features/documentary-knowledge/consumer-adapters.ts` ;
- `src/features/documentary-knowledge/engine.ts` ;
- `src/features/documentary-knowledge/catalog.ts` ;
- `src/features/documentary-knowledge/index.ts`.

### Nouveaux tests

- `src/features/documentary-knowledge/__tests__/fixtures.ts` ;
- `src/features/documentary-knowledge/__tests__/model.test.ts` ;
- `src/features/documentary-knowledge/__tests__/audit-versioning.test.ts` ;
- `src/features/documentary-knowledge/__tests__/corpus-cases.test.ts` ;
- `src/features/documentary-knowledge/__tests__/non-regression-contracts.test.ts`.

### Générateur et sorties machine-readable

- `scripts/generate-documentary-pattern-corpus.mjs` ;
- `documentary-pattern-corpus/doc-002/documentary-source-catalog.json` ;
- `documentary-pattern-corpus/doc-002/documentary-facts.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-catalog.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-graph.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-categories.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-variants.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-relations.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-statistics.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-audit.json` ;
- `documentary-pattern-corpus/doc-002/documentary-pattern-corpus.json`.

### Documentation et configuration

- `docs/doc-002-documentary-knowledge-pattern-engine-report.md` ;
- `package.json` : scripts DOC-002 ;
- `tsconfig.app.json` : import JSON typé.

Aucun fichier supprimé. Aucun fichier de moteur existant, autorité, manifeste, corpus scientifique, corpus réglementaire, route, page, Research Project ou source DOC-000 n’est modifié.

## 38. Contrats publics

| Contrat | Responsabilité |
|---|---|
| Pattern Catalog | retourner le snapshot complet sans mutation |
| Pattern Query | filtrer par texte, catégorie, statut, origine, confiance, source ou relation |
| Pattern Graph | exposer nœuds, arêtes, types et digest |
| Pattern Lookup | retrouver un pattern par identité stable |
| Pattern Provenance | restituer sources, preuves, faits, versions, dates et digest |
| Pattern Statistics | fournir des métriques descriptives sans score de qualité |
| Pattern Audit | détecter les violations sans correction automatique |
| Pattern Export | sérialiser canoniquement le catalogue |
| Pattern Import | vérifier schéma et frontière avant lecture |

Les projections `CATALOG`, `GRAPH`, `PROVENANCE`, `AUDIT` et `STATISTICS` sont des vues read-only. Elles ne deviennent jamais source de vérité.

## 39. Consommateurs futurs

Neuf adapters minimaux démontrent la consommation de références sans implémenter les moteurs :

| Consommateur | Familles principales |
|---|---|
| TMP-001 | structures, éditorial, workflow, Core Lab, qualité, équipement et décision humaine |
| Document Projection | structures, éditorial, workflow et décisions humaines |
| Clinical Operations | workflow, monitoring, déviation, formation, Core Lab et équipement |
| Data Management | données, validation, qualité et workflow |
| QRY-001 | dépendances, décisions, review et risques ; aucune sélection de question par DOC-002 |
| UX-001 | éditorial, décision, review, communication et Human Decision |
| Regulatory Engine | interactions réglementaires et relations externes, sans Requirement produite |
| Biostatistics | structures de données, validation, risque et document ; aucune méthode sélectionnée |
| Knowledge | structures, review, qualité et données ; aucune connaissance scientifique créée |

Chaque adapter retourne uniquement identifiant, nom, catégorie, statut et limites du pattern, avec la frontière `REFERENCE_ONLY_NO_CONSUMER_MUTATION_NO_AUTOMATIC_DECISION`.

## 40. Prochaine étape

La prochaine étape est **TMP-001 — Study Template Engine**. TMP-001 devra consommer séparément :

`Research Project + Applicable Requirement Set produit par REG-001 + Documentary Patterns produits par DOC-002 → Study Template`

Le Research Project restera l’unique source de vérité du projet. REG-001 restera propriétaire de l’ensemble d’exigences applicables. DOC-002 restera propriétaire des patterns documentaires candidats. TMP-001 devra sélectionner et composer sous gouvernance humaine sans promouvoir un pattern en science, règle ou décision.

La conception de TMP-001, QRY-001, UX-001, VAL-001 ou de tout autre consommateur est hors du périmètre de DOC-002 et n’est pas commencée par ce rapport.

`DOCUMENTARY_KNOWLEDGE_PATTERN_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`
