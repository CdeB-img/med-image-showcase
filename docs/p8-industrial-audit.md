# P8 — Audit industriel de la plateforme scientifique Noxia

> Audit technique interne du système après P7. Aucun contenu scientifique, aucune assertion, aucun EvidenceLink, aucune page et aucune surface publique n'ont été modifiés.

## 1. Conclusion exécutive

P7 est reproductible. Les calculs élémentaires du catalogue sont rapides, y compris sur 5 000 domaines synthétiques. Le problème principal n'est donc ni la stabilité locale ni le coût CPU actuel.

La production scientifique continue n'est toutefois pas industrialisable en l'état. L'exécuteur, le registre d'exécution, le builder, les validateurs et les rapports sont encore construits autour de l'unique campagne hépatique P7. La gouvernance existe comme API déclarative, mais elle n'est pas imposée au chemin d'exécution. Des mutations invalides de provenance et de readiness traversent le validateur du catalogue sans erreur. Enfin, l'identité d'une campagne n'est pas liée à son jeu de nœuds : un lot différent peut conserver le même `campaignId` et être considéré comme déjà exécuté.

Ces défauts sont des blocages de gouvernance et de généricité. Ils nécessitent de durcir les couches existantes, pas d'ajouter une nouvelle architecture parallèle.

## 2. État Git audité

- Branche : `main`.
- HEAD : `eb611004a0024c0545ad474647839d0e819863d3`.
- Commit : `feat: execute first catalog-driven scientific campaign`.
- Worktree initial : propre.
- `git diff --check` initial : valide.
- `origin/main` : aligné sur le HEAD au début de l'audit.

P7 est donc audité comme un état commité, et non comme le worktree non commité décrit par son rapport historique initial.

## 3. Périmètre et méthode

L'audit a couvert :

- le rejeu local de P7 ;
- le Priority Engine ;
- le Coverage Engine ;
- le Campaign Engine ;
- la gouvernance ;
- le builder du Scientific Knowledge Catalog ;
- le registre de KnowledgeNodes ;
- les validateurs et leurs points d'entrée ;
- les scénarios de corruption demandés ;
- les cycles et blocages ;
- les performances de 100, 500, 1 000 et 5 000 domaines ;
- le comportement attendu avec de nombreux EvidenceLinks ;
- l'extensibilité des contrats génériques.

Les charges et corruptions ont été injectées en mémoire. Elles n'ont jamais rejoint les registres scientifiques réels. Aucune campagne supplémentaire n'a été exécutée.

## 4. Reproductibilité de P7

Vingt reconstructions indépendantes en mémoire ont produit une valeur unique pour chacun des digests comparés.

| Élément | Résultat | Déterministe | Remarque |
|---|---|---|---|
| Catalogue P7 | `0499f51a39b19633e539ec5c2711a8897c9e4a0beaef1aa3a1993309b7fb8162` | Oui, 20/20 | 250 KnowledgeNodes et 9 campagnes restantes |
| Trace P7 | `9536482b01c5fd5eca4c64c8495d9a81769c0c45bbe466deb6028deca2531d3c` | Oui, 20/20 | Trace avant/sélection/exécution/après stable |
| Sélection | `c96e0838e0ccbcd7f28bafee9e0c470c9fb637327c9883d5f66d3f167c8867b1` | Oui, 20/20 | Même campagne hépatique et même nœud |
| Résultat de campagne | `0cc9b5a25e5d09cff0f8610611e1d8ee73669e236f778032b7742263f6f50a60` | Oui, 20/20 | 5 sources, 22 assertions, 22 EvidenceLinks |
| Transition | `952b22baacad33e84034c7a1bf54b68a8e407b82df83ad7d0239a051236e2d27` | Oui, 20/20 | Même avant/après |
| Sources | `8d159c8e95fb0d06d98ed0c9f6fb670a8665e6d860c08a0daf24b127f52c270e` | Oui, 20/20 | Identités et métadonnées locales stables |
| Assertions | `ac75dfc1c0e723655ccf1316a23f69cc342ee497db2137b72b9d1cebc03df416` | Oui, 20/20 | Ordre et contenu structurés stables |
| EvidenceLinks | `7a4dacde31523ef5b8992b8f179978dc9f62b79ccc57a465deaf57e9c52c0d62` | Oui, 20/20 | Localisateurs et relations stables |
| Synthèses | `532f3cce9b78e25bba8c1483533d91598070f812b97b35b99fc18e0fc1200d69` | Oui, 20/20 | 5 synthèses internes identiques |
| Projections | `cd21c4afb2d23d32d68b6b8a66ce4789747050ef3e5a4242e73c6c007ac529f4` | Oui, 20/20 | 4 projections internes identiques |
| Couverture | `4c511c26033ebb05a5d329a15ab250e988748076096fd6f0f96987a6f4a9bf6a` | Oui, 20/20 | Couvertures source/assertion/scientifique stables |
| Readiness | `5bd9d49ba2f8e721fb1d44d8e5b3fa23ca40c21ff424577785777dd80b5c4a95` | Oui, 20/20 | Même état multidimensionnel |

Limite : il s'agit d'un rejeu des représentations locales figées. Les cinq sources P7 ont `contentDigest: null`. Le système ne réimporte pas et ne redigeste pas leur texte intégral distant ; il ne prouve donc pas la reproductibilité octet par octet des sources externes.

## 5. Montée en charge

Les mesures suivantes sont des observations locales, non des objectifs de service. Chaque domaine synthétique produit une campagne distincte, ce qui couvre directement les cas 100 et 1 000 campagnes.

| Domaines | Campagnes | Recalcul des nœuds | Sélection médiane | Validation graphe médiane | Mémoire observée | JSON synthétique |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 100 | 1,238 ms | 0,119 ms | 0,428 ms | 7,390 Mio | 0,556 Mio |
| 500 | 500 | 5,192 ms | 0,366 ms | 3,121 ms | 6,149 Mio | 2,782 Mio |
| 1 000 | 1 000 | 9,845 ms | 0,746 ms | 3,906 ms | 15,991 Mio | 5,564 Mio |
| 5 000 | 5 000 | 42,179 ms | 4,825 ms | 184,592 ms | 52,040 Mio | 27,831 Mio |

Les quatre sélections sont restées identiques après inversion de l'ordre d'entrée. La sélection pure est donc rapide et déterministe.

| Moteur | Temps | Complexité | Limite |
|---|---:|---|---|
| Recalcul d'un ensemble de KnowledgeNodes | 42,179 ms à 5 000 | Approximativement O(N) hors relations | Mesure sur nœuds plats, pas sur un corpus scientifique complet |
| Sélection des campagnes | 4,825 ms médian à 5 000 | O(N log N) par tri et regroupement | L'ordre global reste incorrect fonctionnellement |
| Validation du graphe | 184,592 ms médian à 5 000 | Chemins superlinéaires ; `shift`, tris répétés et recherches de doublons | Acceptable à 5 000, non démontré à plusieurs dizaines de milliers |
| Sérialisation stable | 169,499 ms à 5 000 | O(taille de sortie) | 27,874 Mio même pour des nœuds synthétiques minimaux |
| Digest stable | 175,611 ms à 5 000 | O(taille de sortie) | Duplique le coût de sérialisation lorsque les deux sont enchaînés |
| Reconstruction du catalogue réel | 18,273 ms médian, 10 passages | Corpus P7 statique | Ne mesure pas l'injection de campagnes futures |
| Recherche actuelle d'EvidenceLinks | 178,447 ms à 10 000 liens | O(E²) dans le pire cas via `evidence.find` répété | 0,961 ms avec un index `Map` sur le même jeu |
| Ensemble des 23 validateurs | 4 245,9 ms | Nombreux recalculs et validations imbriquées | Deux commandes émettent respectivement 7 941 et 7 071 lignes |

Le catalogue réel de 250 nœuds occupe déjà 2 796 481 octets, soit 2,667 Mio et environ 11 186 octets par nœud. À densité égale, 5 000 nœuds approcheraient 53 Mio. Le calcul reste viable ; la taille des artefacts, les diffs Git et les validations répétées deviendraient d'abord le problème opérationnel.

La gestion de plusieurs dizaines de milliers d'assertions n'est pas validée. Le builder n'accepte pas un corpus de campagne injecté génériquement et son lookup linéaire répété des EvidenceLinks introduit un risque quadratique.

## 6. Gouvernance

Le flux déclaré est correct conceptuellement : Catalog → Campaign Engine → Knowledge Graph → Assertions → EvidenceLinks → Coverage → Readiness. Il n'est pas imposé techniquement.

Constats :

- `requireCataloguedScientificOperation`, `authorizeScientificEnrichment` et `authorizeScientificProjection` n'ont aucun appel de production hors tests ;
- l'exécuteur P7 ne demande pas de décision de gouvernance ;
- une autorisation d'enrichissement exige uniquement que le nœud existe et ne soit pas terminal ;
- l'appartenance à une campagne, la priorité, les déficits de couverture, les dépendances et `blockingNodes` ne sont pas vérifiés ;
- une opération inconnue est traitée comme un enrichissement et autorisée ;
- avec un catalogue injecté, la décision conserve le digest du catalogue global ;
- un nœud explicitement bloqué est encore sélectionnable et autorisable.

Le contrat `futureEnrichmentOutsideCatalogAllowed: false` est donc déclaratif. Il ne constitue pas une frontière d'exécution.

## 7. Priorisation et campagnes

### 7.1 Ordre global

Les nœuds sont triés par score à l'intérieur d'un groupe, puis les groupes sont parcourus par identifiant lexicographique. L'ordre des campagnes n'est pas trié globalement par priorité.

- prochaine campagne courante : `neuro-oncology`, score 68 ;
- campagnes les plus prioritaires : `segmentation` et `t2-mapping`, score 70 ;
- inversions de priorité : 23 sur 36 paires possibles.

Deux exécutions identiques restent déterministes, mais le résultat déterministe ne correspond pas à la règle métier attendue « meilleure priorité globale d'abord ».

### 7.2 Critères produisant des nœuds morts

`isCampaignCandidate` exige simultanément :

- priorité HIGH ;
- statut non ready-like et non terminal ;
- couverture source incomplète ;
- couverture assertion incomplète.

Conséquences :

- un nœud ayant seulement un déficit de sources ou seulement un déficit d'assertions n'est pas sélectionné ;
- `PROJECTED` est considéré ready-like avant examen de ses déficits ;
- 52 nœuds `PROJECTED` ont pourtant une couverture incomplète ;
- parmi eux, 38 ont un déficit source et 39 un déficit assertion ;
- 4 sont HIGH mais restent exclus par leur statut ;
- 155 nœuds incomplets non terminaux sont MEDIUM ou LOW et ne sont pas sélectionnables dans leur état actuel ;
- 105 cumulent les deux déficits mais restent exclus uniquement parce qu'ils ne sont pas HIGH.

Le moteur ne possède par ailleurs ni état d'échec, ni tentative, ni backoff. Une campagne non enregistrée comme terminée restera toujours la première et peut affamer les suivantes.

### 7.3 Identité instable des lots

Un `campaignId` est construit à partir du slug du groupe et du numéro ordinal du lot. Le jeu de nœuds et son digest ne participent pas à cette identité.

Dans la simulation, l'insertion d'un nouveau nœud en tête du groupe a modifié le contenu du lot `:01` sans changer son ID. Le registre d'exécution, qui compare seulement le `campaignId`, a alors ignoré le nouveau nœud et sélectionné le lot `:02`.

Ce défaut interdit une gestion sûre de lots évolutifs.

## 8. Dépendances

Le catalogue réel contient actuellement :

- 0 arête de dépendance ;
- 0 nœud avec `blockingNodes`.

Il ne fournit donc aucune preuve industrielle sur un graphe de dépendances réel.

Les tests de mutation donnent :

| Type de cycle | Détecté ? | Observation |
|---|---|---|
| `dependencies` | Oui | `CATALOG_DEPENDENCY_CYCLE` |
| `prerequisites` | Non | Champ dirigé validé comme endpoint, mais pas comme DAG |
| `blockingNodes` | Non | Aucun contrôle de cycle ou de sélection |
| `successors` | Non | Aucun contrat de cycle explicite |

La sélection et l'autorisation ignorent tous ces champs, y compris le champ `dependencies` dont les cycles sont pourtant détectés séparément.

## 9. Robustesse et tests de mutation

Le test a conservé les mêmes nombres globaux et a replannifié les campagnes après chaque mutation afin de ne mesurer que la cohérence interne du catalogue.

| Scénario | Détecté ? | Résultat |
|---|---|---|
| Référence de source retirée de la provenance d'un nœud | Non | Faux négatif |
| Référence d'assertion retirée de la provenance d'un nœud | Non | Faux négatif |
| Référence d'EvidenceLink remplacée par un ID inconnu | Non | Faux négatif |
| Champ requis `description` retiré | Oui | Champ manquant et projection non déterministe détectés |
| Nœud `READY` sans source | Non | Faux négatif |
| Nœud `READY` sans assertion | Non | Faux négatif |
| Nœud `READY` avec couverture nulle | Non | Faux négatif |

Les validateurs recalculent la priorité, la couverture et les capacités de projection, mais ne recalculent pas :

- le statut dérivé ;
- la readiness ;
- la cohérence entre métriques et listes de provenance ;
- la résolution des références de provenance ;
- le digest du catalogue injecté.

Les validateurs scientifiques inférieurs savent contrôler des sources et EvidenceLinks dans leurs corpus historiques. Le problème est l'absence d'un contrat générique qui les applique à toute future campagne injectée.

## 10. Sémantique de couverture scientifique

Le Coverage Engine utilise `sourceCount`, qui inclut des références historiques ou documentaires non résolues comme source scientifique, au lieu de `scientificSourceCount`.

Dans le catalogue actuel :

- 118 nœuds ont plus de références source que de sources scientifiques résolues ;
- 114 ont au moins une référence mais aucune source scientifique résolue ;
- ces 114 nœuds sont malgré tout `provenanceReady` ;
- 22 ont même une `sourceCoverage` complète.

Cette modélisation peut être valable pour une readiness purement catalogique, mais elle ne doit pas être confondue avec une couverture scientifique. Les deux dimensions ne sont pas séparées aujourd'hui dans la règle de campagne.

## 11. Industrialisation

La commande `execute:scientific-campaign` ne consomme pas la prochaine campagne actuelle. Elle reconstruit uniquement :

- les données hépatiques statiques ;
- la trace P7 ;
- le catalogue P7.

Le chemin d'exécution :

- importe directement `hepatic-imaging.mjs` ;
- impose l'ID hépatique ;
- utilise le catalogue P6 comme état avant par défaut ;
- expose seulement un booléen `includeCampaignExecutions` dans le builder ;
- construit un registre contenant exactement une exécution ;
- ne possède pas d'état `RUNNING`, d'échec, de retry, de verrou, de lease ou de transaction compare-and-swap.

Il peut rejouer P7, mais il ne peut pas exécuter la campagne suivante sans modifications de code. Il ne satisfait donc ni 100 campagnes ni 1 000 campagnes sans changement d'architecture existante.

## 12. Extensibilité

| Ajout | Contrat de KnowledgeNode | Builder actuel | Exécution de campagne | Verdict |
|---|---|---|---|---|
| Modalité | Déjà supporté par `Modality` | Import/registre à modifier | Non générique | Partiel |
| Constructeur | Déjà supporté par `Manufacturer` | Import/registre à modifier | Non générique | Partiel |
| Technologie | Déjà supporté par `Technology` | Import/registre à modifier | Non générique | Partiel |
| Biomarqueur | Déjà supporté par `Biomarker` | Import/registre à modifier | Non générique | Partiel |
| Spécialité | Pas de classe `Specialty` ; fallback `Domain` possible | Convention à documenter | Non générique | Décision sémantique requise |

L'ontologie de base est suffisamment large pour quatre ajouts sur cinq sans changer les contrats génériques. En revanche, l'ingestion d'une campagne réelle exige encore de modifier `catalog-builder`, l'exécution, les validateurs et les rapports. L'extensibilité du modèle ne compense donc pas l'absence d'extensibilité opérationnelle.

## 13. Audit des validateurs

Les 23 commandes `validate:*` existantes ont été exécutées.

- 23 réussies ;
- 0 échec ;
- durée cumulée : 4 245,9 ms ;
- `validate:scientific-knowledge-graph` : 7 941 lignes de sortie ;
- `validate:knowledge-graph-completeness` : 7 071 lignes de sortie.

### Faux négatifs

Les six faux négatifs de provenance/readiness documentés en section 9 ne sont couverts par aucun test existant.

### Faux positifs futurs

Les validateurs P7 et catalogue codent en dur :

- 5 sources retenues et 3 rejetées ;
- 15 concepts ;
- 22 assertions et 22 EvidenceLinks ;
- 5 synthèses et 4 projections ;
- une seule exécution ;
- 9 campagnes restantes ;
- 250 nœuds, 235 concepts et 15 domaines ;
- les digests P6/P7 et l'identité hépatique.

Ils constituent un bon golden master de P7, mais un mauvais validateur de l'état courant après une seconde campagne. Une évolution légitime sera rejetée tant que ces totaux ne sont pas réécrits.

### Redondance

Les validateurs par couche restent utiles pour diagnostiquer. En revanche, plusieurs commandes relancent les mêmes validations imbriquées et produisent de très gros JSON. Le coût actuel est faible, mais l'effet sera amplifié avec un catalogue de plusieurs dizaines de mégaoctets.

## 14. Dette technique inventoriée

Aucun fichier n'a été supprimé. Aucun élément n'est déclaré inutile sans preuve.

| Dette technique | Gravité | Impact | Priorité |
|---|---|---|---|
| Exécuteur et trace câblés sur la campagne hépatique | Critique | Impossible d'exécuter une campagne 2 génériquement | P0 |
| Registre `campaignExecutions` limité à une entrée statique | Critique | Pas de production continue | P0 |
| Identité campagne fondée sur ordinal, sans digest de sélection | Critique | Lot différent considéré comme déjà exécuté | P0 |
| Gouvernance non appelée par l'exécuteur | Critique | Contournement du catalogue | P0 |
| Opération inconnue autorisée comme enrichissement | Critique | Fail-open | P0 |
| Statut/readiness/provenance non recroisés | Critique | Faux `READY`, références invalides invisibles | P0 |
| Ordre des groupes lexicographique | Haute | Priority Engine non directeur à l'échelle globale | P0 |
| Règle de candidature exigeant les deux déficits | Haute | Nœuds incomplets non sélectionnables | P0 |
| `PROJECTED` traité ready-like avec couverture incomplète | Haute | 52 nœuds exclus malgré des lacunes | P0 |
| Dépendances absentes du catalogue réel et ignorées au scheduling | Haute | Gouvernance interdomaines non prouvée | P0 |
| Totaux P7 codés en dur dans les validateurs génériques | Haute | Toute nouvelle campagne devient une régression | P0 |
| `sourceCount` utilisé comme couverture scientifique | Haute | Provenance scientifique surestimée | P1 |
| Aucun lifecycle transactionnel, retry ou verrou | Haute | Échecs partiels et concurrence non maîtrisés | P1 |
| Lookup EvidenceLink par `find` répété | Moyenne | Risque quadratique à grande échelle | P1 |
| Parcours de DAG avec `shift` et tris répétés | Moyenne | Validation superlinéaire sur graphes plats | P1 |
| JSON catalogue monolithique de 2,667 Mio pour 250 nœuds | Moyenne | Diffs et maintenance coûteux à l'échelle | P2 |
| `contentDigest` P7 absent | Moyenne | Rejeu local, pas vérification octet des sources | P2 |
| Rapport P7 avec `expectedHead` P6 et `noCommitPushDeploy: true` | Faible | État historique confondu avec état courant | P2 |
| Justification de readiness mentionnant encore P6 | Faible | Documentation obsolescente | P2 |
| Wrappers et validateurs imbriqués très verbeux | Faible | Bruit et temps répété | P2 |

Les JSON ne présentent aucun fichier strictement identique au niveau SHA-256. Ils sont toutefois redondants par dérivation : le catalogue de 2,667 Mio, la trace de 30 682 octets et les rapports P7 reprennent des sous-ensembles des mêmes nœuds, métriques et listes d'identifiants. Cette redondance est acceptable comme snapshot, mais elle deviendra coûteuse si chaque campagne ajoute un nouveau monolithe.

## 15. Contrats

| Contrat | Préservé | Test | Observation |
|---|---|---|---|
| P7 rejouable | Oui | 20 reconstructions et digests | Déterminisme local complet |
| Sélection stable à entrée identique | Oui | 100 à 5 000 domaines, ordre inversé | Même digest de campagnes |
| Priorité globale respectée | Non | 23 inversions sur 36 | Groupes triés lexicalement |
| Toute campagne passe par la gouvernance | Non | Recherche des call sites | Gouvernance utilisée seulement par les tests |
| Nœud bloqué non sélectionnable | Non | Mutation `blockingNodes` | Le nœud reste candidat et autorisé |
| Identité de campagne immuable | Non | Insertion dans un lot de 25 nœuds | Même ID, jeu de nœuds différent |
| Provenance référentielle valide | Non | Trois mutations de références | Aucune détectée par le validateur catalogue |
| `READY` cohérent avec sources/assertions/couverture | Non | Trois mutations de statut | Aucune détectée |
| Cycles de dépendance détectés | Partiel | Cycles sur quatre champs | `dependencies` seulement |
| 5 000 domaines calculables | Oui | Benchmark synthétique | CPU et mémoire acceptables |
| 50 000 assertions industrialisées | Non démontré | Audit du builder et microbenchmark | Pas d'injection générique, lookup quadratique |
| Modalité/constructeur/technologie/biomarqueur représentables | Oui | Types génériques existants | Exécution reste spécifique |
| Spécialité représentable sans convention | Non | Registre des types | `Domain` est un fallback possible |
| Validateurs actuels verts | Oui | 23/23 | Ne neutralise pas les faux négatifs |
| Pages, routes, SEO et sitemap inchangés | Oui | Périmètre Git et validateurs existants | Aucun contenu public produit |
| Corpus scientifique inchangé | Oui | Diff limité aux livrables P8 | Aucun enrichissement |

## 16. Recommandations

Les recommandations détaillées et leurs critères d'acceptation figurent dans `p8-industrial-audit-recommendations.json`. Leur ordre est :

1. généraliser l'exécuteur dans le Campaign Engine existant ;
2. lier l'identité de campagne au digest exact de sélection ;
3. rendre la gouvernance obligatoire et fail-closed ;
4. recalculer statut, readiness, provenance et digests dans le validateur ;
5. définir un ordre global de priorité et une politique de liveness ;
6. conserver P7 comme golden master sans figer les totaux courants ;
7. ajouter un cycle de vie atomique des exécutions ;
8. gouverner les dépendances réelles ;
9. séparer références documentaires et sources scientifiques ;
10. indexer les EvidenceLinks et linéariser les parcours ;
11. limiter la croissance des artefacts monolithiques ;
12. clarifier les digests de source et la représentation des spécialités.

Il s'agit de durcir les composants officiels existants. Aucune nouvelle couche parallèle n'est recommandée.

## 17. Livrables P8

- `docs/p8-industrial-audit.md` : audit complet ;
- `docs/p8-industrial-audit-report.json` : constats structurés ;
- `docs/p8-industrial-audit-metrics.json` : mesures et mutations ;
- `docs/p8-industrial-audit-recommendations.json` : actions proposées et critères d'acceptation.

INTERVENTION TECHNIQUE REQUISE
