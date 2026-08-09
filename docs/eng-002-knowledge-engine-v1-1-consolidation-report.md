# ENG-002 — NOXIA Knowledge Engine V1.1

## Rapport de consolidation des corpus internes, restitution UNDERSTAND et persistance locale versionnée

- Date de clôture locale : 2026-08-09
- Dépôt : `noxia-dev`
- Version runtime : `1.1.0`
- Périmètre activé : parcours `UNDERSTAND` du Protocol Designer
- Nature : consolidation technique et produit de niveau 3, non normative

## 1. Décision finale

`KNOWLEDGE_ENGINE_V1_1_CONSOLIDATED_WITH_LIMITATIONS`

ENG-002 consolide les trois capacités autorisées : fédération interne inspectable, restitution scientifique spécifique et progressive, et mémoire locale versionnée. Aucun critère bloquant n’a été retrouvé dans le périmètre exécuté : aucun corpus proche n’est substitué, aucun objet central n’est perdu, aucun provider pertinent n’est omis silencieusement, aucune connaissance ou source n’est inventée, aucune contradiction n’est masquée, aucun résultat périmé n’est présenté comme courant, le patient-level reste bloqué et le build aboutit.

La réserve est non bloquante et explicite : les Reasoning Books restent des providers documentaires contrôlés, sans parseur intégral des DOCX ; aucune recherche scientifique externe n’est réalisée ; la palette claire globale n’existe toujours pas ; la traversée clavier manuelle intégrale n’a pas pu être prouvée avec le pilote navigateur ; enfin, les gates qui exigent un dépôt Editorial Engine externe propre restent rouges à cause de son état initial déjà modifié et de leur gel historique de la page publique.

Cette décision n’est ni un PASS PD-011, ni une validation scientifique globale, ni l’admission d’un corpus, ni une autorisation clinique, ni une autorisation de recherche externe.

## 2. Autorités consultées

La consultation a commencé par la lecture intégrale de `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` v1.25. L’index a été utilisé comme routeur documentaire, jamais comme source scientifique. L’ordre imposé a ensuite été respecté : Charte fondatrice ; Scientific Product Manifesto ; Product Specification ; PD-003, PD-004, Manuel UX, PD-005, PD-007, PD-009, PD-011, PD-012, PD-013 ; Scientific Territory Model ; Scientific Knowledge Catalog ; Scientific Assertion Layer ; Scientific Knowledge Graph ; RDE-001 v1.1 ; RDE-002 v1.1 ; RDE-003 v1.1 ; KE-001 v1.0 ; ENG-001A ; rapport ENG-001 ; sources maîtresses de RB-003, RB-004 et RB-005 ; P4, P4R, P5 ; corpus et manifests réellement consommés. Le manifeste de l’Editorial Engine externe a été lu en accès strictement non modifiant.

| Nature | Autorité ou constat | Usage ENG-002 |
|---|---|---|
| Principe établi | NOXIA structure et borne le raisonnement ; le LLM n’est pas l’autorité scientifique | Frontière scientifique et refus d’invention |
| Contrat normatif | KE-001, PD-003/004/005/007/009/011/012/013, RDE-001/002/003 | Contrats du moteur, décisions humaines, évaluation et ownership |
| Connaissance scientifique officielle | P4/P4R/P5, RB-003/004/005, Assertion Layer et Knowledge Graph dans leur statut réel | Seul contenu scientifique consommable |
| Projection runtime | adapters, `KnowledgeResult`, coverage map et projection UNDERSTAND | Représentation locale reconstructible, non canonique |
| État réellement implémenté | code et tests présents au HEAD initial puis diff ENG-002 | Base de la décision probatoire |
| Amélioration ENG-002 | registre V1.1, fédération, spécificité, UI, persistance et invalidation | Périmètre de la mission |
| Limite résiduelle | absence d’externe, RB non intégralement parsés, preuves clavier/thème et gates externes | Conservée sans résolution silencieuse |

Contradictions préservées : P4 est un snapshot historique et P4R la consolidation courante ; `OFFICIAL` documentaire ne signifie ni activation scientifique, ni validation, ni publication ; P5 est borné à quatre domaines ; la couche générique d’assertions contient zéro assertion ; les tests locaux ne constituent pas un PASS PD-011. Aucune de ces différences n’a été réécrite.

## 3. Baseline Git

- Branche initiale : `main`.
- HEAD initial : `aa5b9742ef110495463faa8de4101a8c36edd3d3`.
- État initial de `noxia-dev` : propre.
- Fichiers suivis modifiés : aucun.
- Fichiers non suivis : aucun.
- Dépôt externe Editorial Engine : `/Users/charles/Documents/Projets/editorial-engine`.
- HEAD externe : `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`.
- État externe initial : déjà non propre, avec fichiers suivis modifiés et fichiers non suivis ; accès en lecture seule pendant ENG-002.
- L’énumération système des tâches concurrentes a été refusée par le bac à sable ; aucune absence de tâche concurrente n’est donc revendiquée.
- Aucun nettoyage, restauration, commit, push ou déploiement.

Les empreintes initiales et finales sont identiques pour le SOURCE-OF-TRUTH-INDEX, RDE-001/002/003, KE-001, Scientific Territory Model, Scientific Knowledge Catalog, Scientific Assertion Layer, Scientific Knowledge Graph, les trois DOCX maîtres et les trois PDF dérivés des RB. Exemples de contrôle : index `19dd00e4…d337`, KE-001 `39195a03…068f`, RB-003 DOCX `e7e62b91…2c9b`, RB-004 DOCX `570ca168…4d96`, RB-005 DOCX `594d591b…e319`.

## 4. État ENG-001 observé

L’audit a été effectué avant correction. ENG-001 possédait une chaîne déterministe complète, six providers courants, quatre familles d’adapters, une projection UNDERSTAND, un refus patient et 37 tests dédiés. Les contrats fondamentaux de KE-001 existaient déjà ; la dette concernait principalement la complétude du registre, la profondeur documentaire des RB, la visibilité de la fédération, la restitution produit et l’absence de mémoire durable.

| Contract audité | ENG-001 observé | État | Preuve | Action ENG-002 |
|---|---|---|---|---|
| Types et `KnowledgeResult` | Structurés, déterministes, traçables | Implémenté | `types.ts`, `knowledge-result.ts`, tests de contrats | Étendre avec spécificité et coverage map |
| Provider Registry | Six providers disponibles ; Assertion Layer et P4 historique seulement implicites | Partiel | registre V1.0 | Représenter huit surfaces et leurs statuts réels |
| Reasoning Book adapters | Quelques projections contrôlées | Partiel | adapter V1 | Inventorier les familles fiables, versions, owners et sections non structurées |
| Corpus P4/P4R/P5 | P4R et P5 consommés ; P4 seulement historique | Implémenté mais peu inspectable | adapters de corpus | Rendre le statut P4/P4R explicite dans le registre et le plan |
| Concept resolver | Dictionnaire exact-first borné | Implémenté | tests historiques | Ajouter Fabry, faute T1 gouvernée et ambiguïté T1 nue |
| Query planner | Sélection/exclusion déterministe | Partiel produit | trace et tests | Considérer les huit surfaces et expliquer chaque inclusion/exclusion |
| Coverage | Statut global | Partiel | `conflict-gap-analyzer.ts` | Ajouter une carte par branche et comparaison directe |
| Applicability | Filtres de contexte et modalité | Implémenté | tests ENG-001 | Préserver explicitement les pathologies non documentées |
| Contradictions/gaps | Préservés | Implémenté | hématocrite synthétique, no-match | Enrichir leur projection utilisateur |
| UNDERSTAND | Projection déterministe encore technique et dense | Partiel | navigateur ENG-001 | Progressive disclosure, comparaisons, clarifications et niveaux |
| LLM policies | LLM hors décision scientifique | Implémenté | policy et tests | Conserver ; ne pas activer de narration scientifique |
| Persistance | Absente | Absent | aucune clé ni snapshot | Ajouter snapshots locaux V1.1 et invalidation |

## 5. Écarts trouvés

1. Le registre ne permettait pas de voir distinctement une surface réellement vide, une surface historique en replay et un provider courant.
2. Les projections RB ne rendaient pas systématiquement visibles version, Program Owner, famille de section, localisateur et statut non atomique.
3. Le plan interrogeait correctement plusieurs corpus dans certains cas, mais l’utilisateur ne pouvait pas inspecter la couverture de chaque branche.
4. Le statut global ne suffisait pas pour distinguer branche supportée, contexte incompatible, absence de match et comparaison directe insuffisante.
5. La spécificité scientifique était distribuée dans plusieurs objets internes au lieu d’un objet central explicite du résultat.
6. La restitution exposait encore trop la plomberie et ne proposait ni profondeur utilisateur, ni clarification réellement actionnable, ni comparaison dédiée.
7. Aucune reprise locale reconstructible n’existait ; aucun changement de schéma, provider, corpus, question ou contexte ne pouvait invalider un résultat ancien.
8. La limite claire et clavier d’ENG-001 restait entière.

## 6. Architecture réellement modifiée

L’architecture normative n’a pas changé. La chaîne KE-001 existante a été étendue localement :

`KnowledgeRequest` → contexte → résolution → plan fédéré sur registre V1.1 → adapters réellement inclus → applicabilité → conflits/gaps → spécificité + coverage map → `KnowledgeResult` V1.1 → projection UNDERSTAND déterministe → snapshot local versionné.

Ajouts bornés : `coverage-map.ts`, `specificity.ts`, `persistence.ts`, `empty-provider-adapter.ts` et `KnowledgeUnderstandView.tsx`. L’orchestrateur reste court ; React consomme le résultat structuré et ne choisit ni provider, ni assertion, ni source. Aucun nouveau moteur, manifeste, corpus ou modèle normatif n’a été créé.

## 7. Providers

Le registre V1.1 contient exactement huit surfaces réelles, triées de façon stable. Chaque définition expose les champs demandés : identité/type, autorité, domaine, version, statut, disponibilité, capacités, entités, relations, dimensions contextuelles, granularité, localisateurs, preuves, limites et prétention de complétude.

| Provider | Version | Statut / disponibilité | Usage courant | Limite principale |
|---|---|---|---:|---|
| `assertion-layer` | `1.0.0` | `CURRENT_EMPTY` / `AVAILABLE_EMPTY` | Non positif | Zéro assertion et zéro source scientifique |
| `knowledge-graph` | `1.0.0` | `CURRENT_EFFECTIVE` / `AVAILABLE` | Oui pour concepts/relations | Relations non promues en assertions |
| `p4-historical` | `1.0.0-ecv-t1-pilot` | `HISTORICAL_SUPERSEDED` / `REPLAY_ONLY` | Non, replay seulement | Remplacé par P4R pour la requête courante |
| `p4r-ecv-t1` | `1.1.0-ecv-t1-consolidated` | `CURRENT_EFFECTIVE` / `AVAILABLE` | Oui | Domaine ECV/T1 ; revue automatisée, non humaine |
| `p5-multidomain` | `1.0.0-multidomain-wave-1` | `CURRENT_EFFECTIVE` / `AVAILABLE` | Oui | Quatre domaines déclarés seulement |
| `rb-003` | `1.0` | `CURRENT_DOCUMENTARY` / `AVAILABLE` | Oui | Blocs documentaires, non assertions atomiques |
| `rb-004` | `1.1` | `CURRENT_DOCUMENTARY` / `AVAILABLE` | Oui | Même limite documentaire ; jamais substitué à CT |
| `rb-005` | `1.0` | `CURRENT_DOCUMENTARY` / `AVAILABLE` | Oui | Même limite documentaire |

Le registre porte un digest sur les identités, versions, adapters, statuts, disponibilités et concepts de couverture. Le plan et les snapshots y font référence.

## 8. Reasoning Book adapters

L’adapter V1.1 couvre de manière cohérente RB-003, RB-004 et RB-005. Il préserve respectivement les Program Owners `NXP-000001`, `NXP-000002` et `NXP-000003`, les versions officielles 1.0, 1.1 et 1.0, le domaine de validité et le chemin de la source maîtresse DOCX.

Dix familles fiables sont déclarées : contexte, construit scientifique, objectif, hypothèse, décision candidate, limite, controverse, question ouverte, condition de refus et carte des preuves. Les blocs contrôlés restitués portent type documentaire, section, localisateur, source, version et applicabilité. Ils restent `GOVERNED_DOCUMENTARY` et ne deviennent jamais des assertions atomiques.

Les sections sans représentation contrôlée restent explicitement non structurées. Il n’existe ni parsing heuristique opaque du texte libre, ni conversion automatique d’une narration en fait scientifique. La limite résiduelle est donc honnête : la structure fiable est élargie et inspectable, mais le moteur ne parse pas intégralement les DOCX à chaque requête.

## 9. Corpus structurés

- P4 demeure une baseline historique, visible dans le registre pour audit/replay et exclue du chemin courant avec motif.
- P4R demeure la consolidation courante ECV/T1 : 58 assertions, 84 EvidenceLinks et 27 sources dans son périmètre. Les corrections, rétractations, polarités, contextes, preuves, localisateurs et états de revue sont préservés.
- P5 demeure la wave multidomaine à quatre domaines : diffusion/ADC, perfusion cérébrale, caractérisation myocardique et CT spectral. Ses 97 assertions, 108 liens de preuve et limites de généralisation restent inchangés.
- La couche générique d’assertions reste vide et ne masque aucun provider spécialisé.
- Le Knowledge Graph fournit concepts et relations gouvernés ; il n’est pas utilisé comme source d’assertions absentes.

Aucun fichier scientifique, manifest, assertion, source, statut candidat/officiel ou contenu canonique n’a été modifié. Un candidat ou une revue requise n’est jamais promu silencieusement.

## 10. Fédération

Le QueryPlanner évalue les huit surfaces du snapshot de registre. Pour chacune, il enregistre inclusion ou exclusion, concepts correspondants et raison. Seuls les adapters inclus sont exécutés ; l’ordre est stable et la règle reste `EXACT_FIRST_NO_IMPLICIT_FALLBACK`.

Une question CT spectral/photon counting fédère P5 et RB-003. Une question T1/ECV peut fédérer P4R, RB-004 et le Knowledge Graph selon les objets et le contexte. Le moteur ne s’arrête pas au premier corpus qui contient « T1 ». P4 historique reste exclu au profit de P4R ; l’Assertion Layer vide est considérée mais ne fournit aucun résultat positif. Les surfaces non pertinentes restent inspectables dans le plan avec motif d’exclusion.

Le LLM ne choisit jamais les providers. Il n’existe aucune recherche vectorielle cloud ni sélection par ressemblance documentaire.

## 11. Coverage

`KnowledgeResult.coverageMap` calcule un item par branche demandée et, pour une comparaison, un item supplémentaire « Comparaison directe ». Les états utilisateur sont : couverture étayée, partielle, contexte incompatible, aucun provider exact, aucun match, positions contradictoires, hors périmètre et preuves insuffisantes pour comparer.

Chaque item conserve concepts demandés, providers considérés, providers supportants, nombre de résultats, explication, besoin éventuel d’une recherche externe future et digest. Le résultat permet ainsi de reconstruire pourquoi une branche est supportée, partielle ou absente.

Une branche non couverte reste visible. Une indisponibilité technique devient `SOURCE_UNAVAILABLE`, pas une absence scientifique. « Recherche externe nécessaire » est uniquement un gap ; aucune recherche n’a été effectuée.

## 12. Specificity preservation

Un objet `ScientificQuestionSpecificity` est maintenant central dans le résultat. Il conserve : objet central, comparateurs, phénomènes, biomarqueurs, pathologies, populations, temporalités, relations demandées, objectif utilisateur et termes originaux.

Les non-régressions couvrent notamment : no-reflow avec stenting/reperfusion et relation temporelle ; fibrose myocardique sans généralisation cardiovasculaire ; T1 mapping distinct d’ECV ; PET et IRM conservées dans une pathologie inconnue ; maladie de Fabry conservée même lorsque son applicabilité n’est pas documentée ; faute gouvernée `T1 maping` résolue sans perte du terme original ; `T1` nu conservé comme ambigu et sans sélection d’un corpus voisin.

## 13. Restitution UNDERSTAND

La surface visible est devenue une réponse scientifique progressive, pas une vue de debug. Le niveau initial présente la compréhension exacte, le constat principal, la conclusion bornée et l’insuffisance éventuelle. Les détails sont répartis dans des disclosures : pourquoi, limites/alternatives, puis preuves.

La plomberie interne n’est plus exposée dans la réponse primaire : pas de `providerId`, enum, nom de type, champ interne, `traceId` ou état runtime brut. Les labels sont formulés en français. Les sources, versions, contributions et localisateurs restent accessibles au niveau preuve.

Trois profondeurs — synthétique, professionnelle par défaut et experte — projettent le même `KnowledgeResult`. Elles modifient uniquement la quantité de détail, jamais le fond scientifique. L’écran conserve les transitions du Protocol Designer, le contexte de session et le Knowledge Explorer transversal.

## 14. Comparaison

Une intention `COMPARE` produit une restitution dédiée. Chaque branche affiche son propre statut et ses points documentés ; la comparaison directe a son propre statut. Les axes ne sont renseignés que par les éléments présents dans `KnowledgeResult`.

Dans le scénario IRM versus CT sur la fibrose myocardique, IRM et CT restent visibles. Les branches peuvent disposer d’éléments internes, tandis que la comparaison directe reste partielle ou insuffisante faute d’assertion comparative. RB-004 ne complète jamais la branche CT. Une cellule absente n’est pas remplie par le LLM ni par une connaissance générale mémorisée.

## 15. Clarification

Une clarification n’est créée que lorsqu’une dimension critique inconnue peut modifier le raisonnement. Les dimensions gouvernées sont phénomène, pathologie, population, objectif et usage ; au plus trois questions sont projetées à la fois.

Chaque question expose pourquoi elle est utile, ce qu’elle influence, des réponses rapides, une option « Je ne sais pas » et un champ libre dans l’interface. La réponse met à jour le contexte, produit une nouvelle requête et recalcule le résultat. Le scénario « meilleur biomarqueur » ne choisit aucun biomarqueur ; après sélection de « Fibrose », la question correspondante disparaît et le résultat reste borné aux dimensions encore manquantes.

## 16. Narration LLM

Gemini n’est pas utilisé pour produire la narration scientifique ENG-002. Son rôle reste celui de l’intake linguistique existant, avec un mode local explicite si le service est indisponible. Il ne reçoit ni autorité pour sélectionner un provider, ni droit d’ajouter assertion, source, comparaison, conseil patient, conclusion, résolution de gap ou arbitrage de contradiction.

Les tests prouvent que les éléments et sources projetés sont des sous-ensembles identifiables du `KnowledgeResult`. Il n’existe donc aucune conclusion LLM à réconcilier avec le résultat structuré.

## 17. Fallback déterministe

La projection déterministe est le mode produit effectif, pas un écran d’erreur. Elle sait afficher : réponse supportée, réponse partielle, conflit, absence exacte, provider inapplicable ou indisponible, clarification, refus patient, comparaison, limites, gaps et sources.

Lorsque l’API d’intake est indisponible, l’utilisateur voit une erreur récupérable et peut continuer localement. Le moteur scientifique et la restitution restent fonctionnels sans Gemini. Fourier en IRM produit une abstention utile et NumPy/DICOM un arrêt de domaine, sans tutoriel inventé.

## 18. Persistance

La persistance utilise l’infrastructure locale déjà présente, `localStorage`, sous la clé `noxia-knowledge-engine-snapshots-v1-1`. Le schéma est `1.1.0` et la rétention est bornée aux 20 snapshots les plus récents.

Chaque snapshot conserve : `sessionId`, `requestId`, timestamp, version de schéma, version de contexte, `KnowledgeRequest`, `KnowledgeResult`, versions des providers, digest du registre, digests des représentations réellement utilisées et réglages minimaux de projection. Une sauvegarde identique dans la même session est dédupliquée par contexte et digest de résultat.

La page permet de reprendre une réponse courante, de consulter une réponse historique et d’effacer tout l’historique Knowledge. Le reset total du Protocol Designer supprime aussi les snapshots Knowledge.

## 19. Invalidation

Les états explicites sont : `CURRENT`, `STALE_SCHEMA`, `STALE_PROVIDER_VERSION`, `STALE_CORPUS`, `STALE_QUESTION`, `STALE_CONTEXT` et `INVALID`.

L’ordre d’évaluation protège d’abord le schéma, puis le registre/les versions providers, les digests de corpus, la question et le contexte. Une réponse historique affiche qu’elle n’est jamais la réponse courante. Elle peut être consultée pour audit, puis recalculée. Le navigateur a confirmé la reprise d’un snapshot courant et l’affichage « Contexte différent » après clarification ; le test 20 confirme l’état périmé après modification de version provider.

## 20. Confidentialité

La persistance est interdite pour une question patient-level, un identifiant direct ou un secret détectable. Les tests couvrent une valeur T2 individuelle, un IPP et une clé API. La sensibilité `RESTRICTED_PERSONAL` empêche également la création du snapshot.

Les snapshots ne stockent ni token, ni clé, ni réponse brute de LLM, ni contexte plus large que la requête et le résultat nécessaires à la reconstruction. Le refus patient intervient avant persistance et ne fournit aucun diagnostic ni conseil clinique. Une réinitialisation totale explicite est disponible.

## 21. Performances

Le registre et les représentations contrôlées sont construits une fois au chargement du module ; aucun DOCX n’est parsé à chaque requête. Les huit providers sont considérés dans le plan, mais seuls les adapters inclus sont exécutés. Il n’existe aucun appel Gemini multiple pour une réponse et la projection React est mémoïsée sur le résultat et les réglages utiles.

Mesures locales finales : 54 tests Knowledge en 410 ms de temps de tests et 1,98 s mur ; build Vite sur 1 865 modules ; chunk de démonstrateur 441,67 kB, 119,50 kB gzip ; bundle principal 364,75 kB, 116,84 kB gzip. ENG-001 n’ayant pas enregistré un bundle de référence comparable, aucun gain ou surcoût relatif non prouvé n’est revendiqué. Aucun cache transversal n’a été ajouté ; la version provider et le contexte restent dans toute identité persistée pertinente.

## 22. Accessibilité

Les surfaces ajoutées utilisent boutons natifs, `aria-pressed` pour les niveaux et choix, disclosures `details/summary`, ordre logique, styles `focus-visible`, champs étiquetés et régions `aria-live` pour le résultat et les erreurs. L’erreur d’intake est récupérable. La fermeture/reprise n’installe aucun piège clavier connu.

Audit DOM navigateur sur la surface testée : 44 boutons, 5 champs, 4 disclosures avec 4 résumés, aucun identifiant dupliqué, deux régions live et aucun champ sans label. Neuf boutons sans nom accessible appartiennent au header mobile global préexistant, hors surface ENG-002 ; ils restent une dette transversale.

La limite ENG-001 a été réellement réévaluée : les contrats sémantiques et tests automatisés passent, mais l’injection de `Tab` par le pilote intégré n’a pas déplacé le focus de façon fiable. La traversée manuelle intégrale et le retour de focus de bout en bout ne sont donc pas revendiqués.

## 23. Responsive

Les six viewports obligatoires ont été inspectés réellement : 320×812, 390×844, 768×1024, 1024×900, 1440×900 et 1920×1080. Pour chacun, largeur document, body et zone principale égalaient la largeur du viewport ; aucun débordement horizontal ni bouton hors cadre n’a été détecté.

Les contrôles ont couvert réponse longue, comparaison, disclosures, sources, coverage, gaps, clarification, reprise et historique périmé. Les styles utilisent les tokens existants et n’introduisent pas de dépendance sombre supplémentaire. La palette claire globale reste identique à la palette sombre et n’a pas été transformée en chantier ENG-002.

## 24. Huit cas historiques

| # | Cas | Résultat final |
|---:|---|---|
| 1 | IRM vs CT — fibrose myocardique | Trois objets conservés ; providers pertinents inspectés ; branches séparées ; comparaison directe insuffisante ; aucune substitution RB-004 vers CT |
| 2 | No-reflow après stenting/reperfusion | No-reflow, stenting/reperfusion et temporalité conservés ; éléments documentaires éventuels bornés ; gaps explicites ; aucune généralisation cardiovasculaire |
| 3 | T1 Mapping vs ECV | Deux objets et types distincts ; fédération P4R/RB-004 selon contexte ; comparaison et limites visibles |
| 4 | Fourier en IRM | `NO_PROVIDER` ; abstention utile ; zéro assertion, source ou connaissance mémorisée ajoutée |
| 5 | NumPy dans pipeline DICOM | `OUT_OF_DOMAIN` ; gap explicite ; aucun tutoriel Python inventé |
| 6 | « J’ai un T2 élevé » | `PATIENT_LEVEL_BLOCKED` ; aucun diagnostic ; reformulation générale proposée ; aucune persistance |
| 7 | « Quel est le meilleur biomarqueur ? » | `CLARIFICATION_REQUIRED` ; aucune réponse unique ; questions décisionnelles avec raison, influence, réponses rapides et inconnu |
| 8 | PET vs IRM dans une maladie non couverte | Deux branches et pathologie inconnue conservées ; absence visible ; aucun fallback vers une autre pathologie |

Les huit cas passent dans les tests automatisés. Les cas 1, 3, 4, 6 et 7 ont également été rejoués dans le navigateur au sein des parcours A–J.

## 25. Nouveaux cas produit

| # | Cas | Preuve obtenue |
|---:|---|---|
| 9 | Question simple couverte | CT spectral/photon counting : `SUPPORTED`, coverage étayée |
| 10 | Deux providers | P5 et RB-003 exécutés et présents dans la provenance |
| 11 | Assertions convergentes | Conclusions compatibles conservées sans vote par nombre de sources |
| 12 | Assertions contradictoires | Controverse hématocrite synthétique visible ; revue humaine requise |
| 13 | Provider indisponible | `SOURCE_UNAVAILABLE`, distinct d’une absence scientifique |
| 14 | Contexte incompatible | P4R inspecté ; assertions exclues ; coverage partielle pour Fabry |
| 15 | Question très générale | Clarification utile ; raison, influence et « Je ne sais pas » |
| 16 | Faute de frappe | `T1 maping` résolu vers T1 mapping tout en conservant le terme original |
| 17 | Acronyme ambigu | `T1` nu reste ambigu ; aucun provider voisin sélectionné |
| 18 | Changement de contexte | Nouveaux digests de requête, contexte et résultat |
| 19 | Reprise persistée | Snapshot V1.1 rechargé `CURRENT`, même digest de résultat |
| 20 | Version provider modifiée | Snapshot détecté `STALE_PROVIDER_VERSION` |

Deux contrôles complémentaires couvrent le refus de persistance de données sensibles et l’interdiction d’ajouter assertion ou source à la narration.

## 26. Tests

| Validation | Résultat final |
|---|---|
| Typecheck | Conforme |
| Lint | Conforme : 0 erreur, 7 avertissements Fast Refresh préexistants |
| Build production | Conforme : 1 865 modules |
| Tests Knowledge Engine | 6 fichiers, 54/54 conformes |
| Tests ciblés ENG-002 | 12 cas supplémentaires + privacy/narration conformes |
| Tests Protocol Designer | 7 fichiers, 148/148 conformes |
| Audit SEO | 40 pages, 0 erreur, 0 avertissement ; rapport horodaté remis à son état initial |
| Knowledge Graph | Conforme : 118 entités, 93 relations, 0 assertion générique |
| Scientific Assertions | Conforme : 58 assertions P4, 84 EvidenceLinks ; contradiction conservée |
| Sources / review / projections | Conformes ; 27 sources P4, 58 reviews, aucune revue humaine revendiquée |
| Knowledge Catalog build check | Conforme : 294 nœuds, digest courant |
| Territory build check | Conforme, aucune dérive |
| Scientific Explorer data check | Conforme : 12 assertions, 5 sources, digest courant |
| Corpus / multidomain / catalog gates | Sous-couches scientifiques conformes ; gate globale rouge sur page publique modifiée par la mission et Editorial Engine externe déjà sale |
| Suite globale | 698/701 conformes après retrait de l’artefact SEO ; trois seuls échecs sur la propreté du dépôt Editorial Engine externe |
| `git diff --check` | Conforme |

Validation navigateur réelle A–J : A réponse CT spectral couverte ; B réponse T1/ECV multicorpus ; C comparaison IRM/CT ; D réponse directe partielle ; E contradiction hématocrite ; F Fourier absent ; G clarification biomarqueur et recalcul ; H refus patient ; I reprise de session courante après rechargement ; J résultat historique marqué contexte différent avec recalcul. La première réponse, les disclosures, sources, reset, erreur d’intake et reprise locale ont été observés. Un onglet neuf après la correction finale ne présentait aucune erreur console. Les avertissements React Router existants restent non bloquants.

## 27. Limites résiduelles

1. Les Reasoning Books utilisent une représentation documentaire contrôlée et élargie, pas un parseur runtime intégral de chaque paragraphe DOCX.
2. Le résolveur demeure un dictionnaire gouverné local et borné ; il n’est pas une ontologie générale.
3. Aucune recherche PubMed, Crossref, web ou autre source externe n’est implémentée ; un besoin externe reste un gap.
4. La persistance est locale à un navigateur, limitée à 20 snapshots, sans synchronisation, chiffrement applicatif ou base distante.
5. La trace n’est pas un journal métier distribué et aucun événement durable PD-009 n’est émis.
6. La projection déterministe reste intégrée au Protocol Designer, sans Document Engine autonome.
7. La palette claire globale distincte n’est pas disponible.
8. La traversée clavier manuelle intégrale n’est pas prouvée avec le pilote actuel ; neuf contrôles globaux du header mobile restent sans nom accessible.
9. Le dépôt Editorial Engine externe demeure non propre à son HEAD initial. Les gates de gel qui exigent sa propreté ou une page publique inchangée restent rouges ; il n’a pas été modifié par ENG-002.
10. Aucun expert humain, campagne d’évaluation, seuil, validation scientifique globale ou PASS PD-011 n’est revendiqué.

Aucune de ces limites ne déclenche un critère bloquant ENG-002 : elles ne provoquent ni substitution silencieuse, ni invention, ni conseil patient, ni résultat périmé présenté comme courant, ni non-reproductibilité, ni build cassé.

## 28. Fichiers modifiés

Créés pour ENG-002 :

- `src/features/knowledge-engine/KnowledgeUnderstandView.tsx` ;
- `src/features/knowledge-engine/coverage-map.ts` ;
- `src/features/knowledge-engine/specificity.ts` ;
- `src/features/knowledge-engine/persistence.ts` ;
- `src/features/knowledge-engine/adapters/empty-provider-adapter.ts` ;
- `src/features/knowledge-engine/__tests__/eng-002-product-cases.test.ts` ;
- `docs/eng-002-knowledge-engine-v1-1-consolidation-report.md`.

Modifiés pour ENG-002 : 18 fichiers existants du Knowledge Engine pour les types, registre, adapters, résolution, planification, applicabilité, gaps, résultat, projection, confidentialité, exports et tests ; `src/pages/ProtocolDesignerDemo.tsx` pour la surface UNDERSTAND et la persistance ; `src/features/protocol-designer/__tests__/p-web-06-v1.test.tsx` pour le contrat de microcopie V1.1.

Non modifiés : SOURCE-OF-TRUTH-INDEX, Charte, manifeste, Product Specification, PD-003 à PD-013, RDE-001/002/003, KE-001, Scientific Programs, Reasoning Books, corpus, Territory Model, Knowledge Graph scientifique, Assertion Layer, manifests scientifiques et dépôt Editorial Engine. L’index n’est pas mis à jour : ce rapport de niveau 3 ne change ni hiérarchie documentaire ni admission de corpus.

## 29. Contrats

| Contract | Préservé ? | ENG-001 | ENG-002 | Test-preuve | Limite |
|---|---:|---|---|---|---|
| exact scientific object preserved | Oui | Concepts exacts et inconnus conservés | Objet central, comparateurs, pathologie, temporalité, relations et termes originaux explicites | Cas 1–3, 8, 14, 16–18 | Dictionnaire local borné |
| all relevant internal providers considered | Oui | Six providers courants planifiables | Huit surfaces considérées avec inclusion/exclusion et raison | Registry/adapters/cas 10 | Providers internes seulement |
| no closest-corpus fallback | Oui | Exact-first | Ambiguïté et branches absentes n’activent aucun voisin | Cas 1, 4, 8, 17 | Aucun moteur sémantique externe |
| context explicit | Oui | ContextPackage et applicabilité | Spécificité et snapshots exposent versions/contexte | Cas 14, 18, UI | Dimensions disponibles seulement |
| coverage explicit | Oui | Statut global | Carte par branche et comparaison directe | Tests coverage, cas 9, 14 | Axes bornés aux providers |
| gaps explicit | Oui | Gaps structurés | Gaps projetés et besoin externe signalé | Cas 2, 4, 5, 8, UI | Pas de recherche externe |
| contradictions preserved | Oui | Positions distinctes | Coverage conflictuelle et controverse lisible | Cas 12, navigateur E | Arbitrage humain futur |
| sources traceable | Oui | Sources/EvidenceLinks/localisateurs | Niveau preuve secondaire avec version et contribution | Adapters/UI/navigateur | RB : localisateurs documentaires |
| KnowledgeResult deterministic | Oui | Digest logique reproductible | Coverage, spécificité et registre versionnés inclus | Contracts/reproductibilité | Runtime local synchrone |
| narration faithful | Oui | Projection déterministe | Chaque item/source est un sous-ensemble du résultat | Test narration bornée | Pas de narration Gemini activée |
| patient-level blocked | Oui | Domain Gate et refus | Refus aussi avant persistance et reprise | Cas 6, privacy, navigateur H | Détection locale, non DLP général |
| local persistence versioned | Oui | Absente | Schéma 1.1.0, snapshots reconstructibles, 20 max | Cas 19, persistence tests, navigateur I | Navigateur local uniquement |
| stale result detected | Oui | Non applicable | Schéma/provider/corpus/question/contexte invalidants | Cas 18–20, navigateur J | Pas de diff scientifique automatique |
| privacy minimization | Oui | Charge externe minimisée | Aucun secret, IPP, patient ou brut LLM persisté | Test privacy | Détection bornée |
| no external scientific search | Oui | Aucune | Aucune ; besoin externe seulement signalé | Cas 4/5/8, inspection réseau/code | Couverture interne limitée |
| no corpus mutation | Oui | Aucun corpus écrit | Empreintes et diff confirment zéro mutation | Hashes, git diff, validators | Gates externes sensibles au worktree voisin |
| no PD-011 claim | Oui | Limite explicite | Décision technique avec limitations seulement | Rapport et code | Campagne PD-011 future distincte |

## 30. Décision de suite

La suite recevable est une mission séparée : d’abord résoudre la dette d’accessibilité globale et acquérir une preuve clavier humaine ; ensuite décider, sous gouvernance, si un parseur documentaire fiable des RB et une synchronisation de snapshots sont nécessaires ; enfin seulement concevoir une recherche externe comme provider distinct, avec provenance, confidentialité, évaluation et refus. Aucun de ces travaux n’est autorisé implicitement par ENG-002.

Décision ENG-002 : `KNOWLEDGE_ENGINE_V1_1_CONSOLIDATED_WITH_LIMITATIONS`
