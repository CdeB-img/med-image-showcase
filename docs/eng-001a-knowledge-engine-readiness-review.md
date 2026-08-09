# ENG-001A — Architecture Validation

## Knowledge Engine Readiness Review

| Champ | Valeur |
|---|---|
| Mission | Audit critique de readiness de RDE-001, RDE-002 et RDE-003 pour l’implémentation future du Knowledge Engine |
| Version du rapport | 1.0 |
| Date d’état | 8 août 2026 |
| Nature | Revue d’architecture ; aucune conception corrective et aucune implémentation |
| Périmètre | Architecture générale, frontières, workflow, contrats, ownership, connaissances, corpus, graphe, assertions, sources, contexte, cas limites, patient et LLM |
| Livrable unique | `docs/eng-001a-knowledge-engine-readiness-review.md` |
| Documents audités | RDE-001, RDE-002 et RDE-003, tous trois candidats non admis |
| Autorité du rapport | Constat d’audit ; ne modifie ni n’admet aucun document |

---

## 0. Cadre de lecture et méthode de rupture

### 0.1 Nature exacte de la mission

La mission ne demande pas si l’architecture exprime une bonne intention. Elle demande si une équipe différente pourrait, dès demain, implémenter un **Knowledge Engine conforme, déterministe, traçable et scientifiquement sûr** sans inventer les contrats absents.

La barre de readiness retenue est donc la suivante :

> une responsabilité générale, une liste d’entrées et une liste de sorties ne suffisent pas ; l’équipe doit pouvoir déterminer sans arbitrage implicite quelle autorité interroger, comment qualifier le contexte, comment sélectionner et hiérarchiser les résultats, quels objets lire ou proposer, quand s’arrêter et comment remettre un résultat consommable aux autres moteurs.

L’audit cherche volontairement :

- les formulations qui permettent plusieurs implémentations scientifiquement incompatibles ;
- les dépendances qui ne disposent pas de contrat de passage ;
- les boucles sans condition de terminaison ;
- les sources d’autorité concurrentes ou insuffisamment ordonnées ;
- les cas où l’abstention est définie mais où la réponse positive ne l’est pas ;
- les objets nécessaires à l’exécution mais absents du modèle ou de leur correspondance canonique.

### 0.2 Ordre de consultation

La consultation a commencé par `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, puis a suivi l’ordre imposé : Charte fondatrice, Scientific Product Manifesto, Product Specification, PD-003, PD-004, PD-005, PD-009, PD-011, PD-012, PD-013, P17, RDE-001, RDE-002 et RDE-003.

Les surfaces scientifiques auxquelles l’index et les RDE renvoient ont ensuite été contrôlées uniquement pour éprouver les affirmations de readiness : Scientific Territory Model, Scientific Knowledge Catalog, Scientific Assertion Layer, Scientific Knowledge Graph documentaire, corpus P4/P4R/P5 et les trois Reasoning Books officiels RB-003, RB-004 et RB-005. Cette consultation supplémentaire n’élargit pas l’autorité du présent rapport.

### 0.3 Plans de vérité séparés

| Plan | État applicable à l’audit | Conséquence |
|---|---|---|
| Principes établis | science avant technologie ; contexte indissociable de la connaissance ; limites et controverses visibles ; responsabilité humaine ; arrêt honnête | Socle cohérent et non contesté |
| Références normatives | PD-003, PD-004, PD-005, PD-009, PD-011, PD-012 et PD-013 sont officielles dans leurs domaines | Elles priment sur les RDE candidats |
| Corpus scientifiques | RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 sont officiels ; P4/P4R/P5 portent aussi des corpus structurés spécialisés | Le patrimoine scientifique existe mais n’est pas une surface unique de requête |
| Cible | un Knowledge Engine général sélectionne une connaissance contextualisée, sourcée, limitée et réutilisable | Cible décrite à grands traits, pas contrat implémentable |
| État réellement implémenté | Knowledge Explorer et traitements bornés à des fixtures/corpus du démonstrateur ; corpus structurés et requêtes spécialisées existent par domaines | Aucun Knowledge Engine général et autonome n’est démontré |
| Hypothèses | moteur général, interopérabilité des corpus, usage des Programs, rôle runtime du graphe, composition des rôles R06–R09 | Hypothèses non arbitrées |

### 0.4 Constat documentaire préalable

RDE-001, RDE-002 et RDE-003 se déclarent eux-mêmes `REFERENCE_NORMATIVE_CANDIDATE — REQUIRES_ARBITRATION` et ne figurent pas dans le SOURCE-OF-TRUTH-INDEX. RDE-002 dépend de l’admission de RDE-001 ; RDE-003 dépend de RDE-001 et RDE-002. Une équipe d’implémentation ne disposerait donc pas d’une chaîne normative RDE opposable.

P17 reste un snapshot officiel historique antérieur à l’admission de RB-005. Son compte de deux Reasoning Books officiels n’est pas l’état courant. Le SOURCE-OF-TRUTH-INDEX v1.24 et PD-013 état 1.7 établissent l’état ultérieur : trois Scientific Programs et trois Reasoning Books officiels. Cet écart chronologique est explicite et n’est pas résolu par réécriture de P17.

---

## 1. Résumé exécutif

RDE-001, RDE-002 et RDE-003 définissent correctement la philosophie de sécurité du futur Knowledge Engine : il ne produit pas de vérité, ne décide pas à la place du chercheur, préserve le contexte, expose les limites, refuse le hors-domaine et ne doit jamais remplacer un corpus absent par le corpus le plus proche.

Ils ne suffisent toutefois pas à implémenter ce moteur.

L’équipe disposerait d’une **charte de comportement**, mais pas d’un **contrat d’exécution scientifique**. Elle ne saurait pas, sans inventer :

- quel registre constitue l’inventaire interrogeable des connaissances ;
- comment arbitrer entre Reasoning Books, corpus P4/P4R/P5, assertions du graphe, sources externes et documents utilisateur ;
- comment transformer une question et son contexte en requête reproductible ;
- comment décider qu’une assertion est applicable, hors contexte, trop générale ou contradictoire ;
- comment hiérarchiser les sources et les révisions ;
- comment produire une sortie canonique consommable par Scientific Thinking, Imaging ou Document ;
- quels objets le moteur peut proposer, posséder temporairement ou ne jamais modifier ;
- où se termine le rôle du LLM dans la recherche, l’extraction et la synthèse ;
- comment les boucles Knowledge ↔ Scientific Thinking ↔ Imaging et R06 → R09 se terminent ;
- comment une Contribution de connaissance non encore effective peut être utilisée dans le même raisonnement.

Le résultat est asymétrique : l’architecture décrit mieux **comment ne pas répondre** que **comment construire une réponse scientifiquement positive**. Les huit exercices confirment cette asymétrie. Aucun ne dispose, à partir des trois RDE seuls, d’une chaîne positive complète et implémentable ; plusieurs permettent néanmoins une clarification ou un refus conceptuellement correct.

La readiness est donc refusée. Les écarts ne sont pas de simples choix techniques laissés à une équipe : ils portent sur l’autorité scientifique, la sémantique des requêtes, l’ownership, les objets et la responsabilité des décisions. Les résoudre pendant ENG-001 reviendrait à inventer l’architecture au cours de l’implémentation.

---

## 2. Points forts

1. **Mission scientifique clairement bornée.** Knowledge fournit des connaissances applicables, provenance, limites, controverses et lacunes ; il n’est ni source de vérité ni décideur scientifique.
2. **Séparation entre cible et état réel.** Les trois RDE déclarent explicitement qu’aucun moteur général n’est démontré.
3. **Préservation du contexte.** RDE-001 et RDE-002 imposent un Research Project unique, une version identifiée et un État de connaissance effectif.
4. **Navigation séparée de l’exécution.** PD-009 choisit l’action scientifique ; l’orchestration et les rôles PD-005 ne doivent pas s’approprier cette décision.
5. **Frontière patient robuste au niveau des principes.** Domain Gate et RDE-003 excluent diagnostic, conduite et interprétation clinique individuelle.
6. **Pas de repli silencieux.** RDE-003 interdit de substituer un corpus proche à une branche non couverte.
7. **Comparaison multimodale bien cadrée conceptuellement.** Construit, biomarqueur, variable, temporalité, référence, métrologie, non-évaluabilité, risques et contraintes doivent rester séparés.
8. **Contradictions conservées.** Les divergences ne sont ni moyennées ni supprimées ; elles doivent rester contextualisées.
9. **Traçabilité attendue.** Les handoffs doivent porter version, objets sources, corpus, assertions, contexte, limites, impacts et décisions humaines.
10. **Contribution avant mutation.** Une sortie moteur ne devient pas automatiquement une vérité du projet ou du corpus.
11. **Rôles de preuve déjà identifiés.** PD-005 distingue stratégie de recherche, extraction, évaluation et synthèse par R06, R07, R08 et R09.
12. **Historique protégé.** Une évolution de connaissance déclenche une nouvelle version et une analyse d’impact ; elle ne réécrit pas une stratégie passée.
13. **Scientific Programs correctement séparés des projets.** PD-012 et PD-013 empêchent un Program de devenir un second Knowledge Graph ou un dossier de projet.
14. **Refus reconstructibles.** RDE-003 exige motif, éléments conservés, conclusion impossible, information manquante et condition de reprise.

Ces forces sont nécessaires. Elles ne compensent pas l’absence de contrats opérationnels décrite ci-dessous.

---

## 3. Points faibles

### 3.1 Audit des vingt points imposés

| Point | Verdict | Constat de rupture |
|---|---|---|
| 1. Architecture générale | Partiel | La mission est claire ; la décomposition interne et le contrat d’exécution ne le sont pas. |
| 2. Frontières | Partiel | Les non-missions sont lisibles, mais la production des mécanismes, comparaisons, synthèses et réponses traverse Knowledge, Scientific Thinking, Imaging et Document sans ownership complet. |
| 3. Responsabilités | Insuffisant | Knowledge « sélectionne », R06–R09 recherchent et synthétisent, R13 compare, Imaging construit la comparaison et Document rédige ; la responsabilité finale de chaque étape n’est pas univoque. |
| 4. Workflow | Partiel | RDE-002 précise le déclencheur général mais pas les états internes, la granularité d’une requête, les reprises ni les conditions de terminaison des boucles. |
| 5. Entrées | Insuffisant | « question, contexte, état de connaissance, besoins de preuve » n’est pas un contrat exact : champs requis, version, négation, inconnues, contexte minimal et règles de validation manquent. |
| 6. Sorties | Insuffisant | « références, synthèses, lacunes, controverses » n’est relié à aucun schéma canonique complet, cardinalité, statut, ordre ou règle d’acceptation. |
| 7. Ownership | Insuffisant | Knowledge est responsable de la sélection mais ne possède pas l’autorité source ; l’objet qu’il possède pendant l’exécution n’est pas défini. |
| 8. Sélection, contradictions, lacunes | Insuffisant | L’obligation de les conserver existe ; les procédures de détection, regroupement, priorité et clôture n’existent pas. |
| 9. Recherche corpus | Insuffisant | Aucun inventaire d’adaptateurs, langage de requête commun, stratégie de rappel/précision, résolution de synonymes ou règle d’échec n’est fourni. |
| 10. Knowledge Graph | Insuffisant | Son rôle général est décrit, pas le moment exact de consultation, la surface interrogée, le contrat de résultat ni le traitement d’un graphe sans assertion applicable. |
| 11. Reasoning Books | Insuffisant | Ils sont déclarés applicables mais aucun contrat d’indexation, de localisation, d’extraction atomique ou de mise en correspondance avec les assertions n’est défini. |
| 12. Scientific Programs | Ambigu | RDE-001 les liste comme dépendance directe ; PD-012 les définit comme gouvernance de portefeuille, pas comme source scientifique runtime. |
| 13. Assertions | Insuffisant | Le schéma existe, mais la coexistence des registres généraux, corpus spécialisés et Reasoning Books n’est pas unifiée par RDE. |
| 14. Sources | Insuffisant | Aucune hiérarchie runtime ne départage version officielle, révision récente, consensus, source primaire, preuve qualifiante ou source rétractée. |
| 15. Contexte | Partiel | La conservation au niveau projet est forte ; l’application du contexte à chaque assertion et la politique de relaxation ne sont pas définies. |
| 16. Spécificité | Partiel | L’invariant interdit la réponse généraliste, mais aucun mécanisme ne mesure ou ne garantit la conservation des entités et relations spécialisées. |
| 17. Connaissance absente | Partiel | Le refus est nommé ; la procédure capable de démontrer exhaustivement l’absence n’est pas définie. |
| 18. Comparaison IRM/CT | Partiel | RDE-003 définit les dimensions de comparaison, mais pas la construction scientifique du jeu comparable ni la fusion des preuves transmodales. |
| 19. Patient | Fort sur le refus | La dérive clinique individuelle est explicitement interdite ; la séparation entre explication générale et interprétation personnelle reste à matérialiser. |
| 20. LLM | Insuffisant | Les interdictions sont claires ; les opérations autorisées dans recherche, extraction, classification, synthèse et rédaction ne sont pas attribuées avec un contrôle déterministe. |

### 3.2 Faiblesses transversales

- Le moteur n’a pas de machine d’état propre.
- Le moteur n’a pas de contrat d’erreur commun aux RDE.
- Le moteur n’a pas de définition de « connaissance applicable » testable.
- Le moteur n’a pas de règle d’autorité entre les différentes familles de corpus.
- Le moteur n’a pas de contrat de preuve permettant de produire une phrase scientifique.
- Le moteur n’a pas de sortie utilisateur pour le parcours `UNDERSTAND`.
- Le moteur n’a pas de politique de fraîcheur, correction, rétractation et date d’effet au moment de la requête.
- Le moteur n’a pas de règle pour les documents apportés par l’utilisateur.
- Le moteur n’a pas de politique de minimisation du contexte sensible transmis à une recherche ou à un LLM.
- Le moteur n’a pas de campagne d’évaluation spécifique définie au-delà du renvoi général à PD-011.

---

## 4. Architecture suffisante ?

### 4.1 Ce que les trois RDE suffisent à encadrer

| Capacité | Suffisance | Limite |
|---|---|---|
| Refuser une demande clinique individuelle | Oui, conceptuellement | L’implémentation de la détection reste à définir |
| Ne pas inventer une source ou une connaissance | Oui comme invariant | Aucun contrôle de génération n’est spécifié |
| Conserver le contexte de projet | Oui comme exigence | Aucun paquet d’entrée Knowledge n’est défini |
| Signaler l’absence de couverture | Oui comme résultat attendu | La preuve de couverture interrogée n’est pas reproductible |
| Préserver une controverse | Oui comme invariant | Détection et regroupement ne sont pas définis |
| Demander une décision humaine | Oui | L’objet de connaissance soumis et son statut restent ambigus |
| Comparer des modalités selon des dimensions pertinentes | Oui comme cadre méthodologique | La récupération et la comparabilité des preuves ne sont pas implémentables depuis les RDE seuls |
| Protéger les autorités de corpus | Oui | Le routage entre ces autorités n’est pas défini |

Cette suffisance est une suffisance de **garde-fous**, pas une suffisance d’implémentation.

### 4.2 Exercices de rupture

| # | Cas | Matériel scientifique identifiable | Comportement que l’architecture devrait permettre | Verdict de readiness |
|---|---|---|---|---|
| 1 | IRM vs CT pour la fibrose myocardique | RB-004 couvre la CMR ; le corpus P4/P4R contient des éléments MR/CT sur l’ECV ; RB-003 couvre le CT spectral sans établir une comparaison universelle de fibrose | Clarifier le construit, distinguer cicatrice, expansion extracellulaire et collagène, comparer seulement les mesures compatibles, exposer les lacunes CT | **Non.** Les sources existent partiellement, mais RDE ne dit pas comment découvrir P4, l’ordonner avec RB-004/RB-003 et construire une synthèse transmodale. |
| 2 | No-reflow après stenting | P5 contient un domaine de caractérisation myocardique avec MVO/no-reflow dans l’infarctus ; RDE-003 conserve le terme spécialisé | Distinguer restauration du flux épicardique, perfusion tissulaire, MVO et contexte de reperfusion/stenting, puis borner l’applicabilité | **Non.** Le routage vers P5 n’est pas défini et le contexte « après stenting » n’a pas de règle de correspondance ou d’extrapolation. |
| 3 | T1 Mapping vs ECV | P4/P4R et RB-004 couvrent directement méthodes T1 et ECV, leurs dépendances et limites | Comparer un mode de mesure T1 à un estimateur dérivé ECV sans les traiter comme biomarqueurs interchangeables | **Partiel seulement.** La matière est disponible, mais le moteur ne dispose pas du contrat de sélection, de comparaison et de sortie. |
| 4 | Transformée de Fourier en IRM | Aucun routage RDE ne démontre un corpus général de physique IRM applicable ; RB-004 n’établit pas à lui seul une couverture pédagogique générale de Fourier | Expliquer le lien signal/espace k/reconstruction en restant dans la physique documentée, ou déclarer la lacune | **Non pour la réponse scientifique ; oui pour l’abstention.** L’architecture sait interdire l’invention, pas trouver une source autorisée. |
| 5 | NumPy dans un pipeline DICOM | Le Catalog mentionne NumPy avec couverture faible ou absente ; aucun corpus scientifique ou documentaire runtime n’est désigné par les RDE | Qualifier la demande comme informatique scientifique, identifier une source technique gouvernée ou réduire la portée | **Non.** Le Domain Gate ne tranche pas le domaine et aucun fournisseur de connaissance logicielle n’est défini. |
| 6 | « J’ai un T2 élevé » | Des corpus bornés peuvent expliquer T2 dans certains contextes, mais la phrase est patient-level et sans méthode ni contexte | Refuser l’interprétation individuelle, expliquer pourquoi une valeur isolée est insuffisante et, si autorisé, proposer une information générale non diagnostique | **Oui pour le refus patient ; non pour une explication générale sourcée garantie.** |
| 7 | « Quel est le meilleur biomarqueur ? » | Aucun biomarqueur ne peut être classé sans phénomène, population, tâche, temporalité, contraintes et critère | Ne pas répondre par un classement ; demander l’information décisionnelle minimale via PD-009 | **Oui pour la clarification ; non pour une sélection.** La réaction correcte dépend de PD-009 et Scientific Thinking, pas de Knowledge seul. |
| 8 | PET vs IRM dans une maladie non couverte | Aucun corpus applicable par hypothèse | Conserver les deux modalités comme options, déclarer l’absence de connaissance soutenue et ne pas substituer un autre domaine | **Partiel.** Le résultat conceptuel est défini, mais l’architecture ne précise pas comment établir que tous les corpus pertinents ont été interrogés. |

### 4.3 Résultat des exercices

- Zéro cas sur huit possède une chaîne positive complète, reproductible et implémentable à partir des trois RDE.
- Deux cas disposent d’un comportement de sécurité fort : refus patient et clarification d’une question « meilleur biomarqueur ».
- Deux autres permettent conceptuellement une abstention honnête : Fourier sans corpus démontré et comparaison PET/IRM hors couverture.
- Les trois cas pour lesquels le dépôt contient le plus de matière scientifique — fibrose MR/CT, no-reflow et T1/ECV — échouent précisément sur le routage, l’applicabilité et la synthèse inter-corpus.

---

## 5. Architecture insuffisante ?

Oui. L’insuffisance est démontrée à chaque étape de la chaîne nécessaire à une réponse Knowledge.

### 5.1 Chaîne de bout en bout non spécifiée

| Étape nécessaire | Ce qui existe | Ce qui empêche l’implémentation conforme |
|---|---|---|
| Qualifier la demande | Domain Gate et `ScientificIntent` | Domaine scientifique vs technique, patient vs général et niveau de preuve attendu non codifiés pour Knowledge |
| Construire le besoin | Besoin d’information PD-003 et action PD-009 | Aucune correspondance exacte entre Besoin d’information et requête Knowledge |
| Résoudre les concepts | Concepts, aliases spécialisés dans certains corpus | Aucun service canonique inter-corpus ni politique multilingue/abréviation/négation |
| Trouver les corpus | Programs, Catalog, Reasoning Books, corpus structurés, Knowledge Graph | Aucun registre runtime unique ni ordre de consultation |
| Rechercher | Filtres spécialisés P4/P5 et rôles R06–R07 | Pas de langage de requête commun, de rappel attendu ou de stratégie de recherche générale |
| Vérifier l’applicabilité | Domaine de validité PD-003 et dimensions de contexte du graphe | Pas de règle de matching, de priorité de spécificité ou de relaxation |
| Évaluer les preuves | R08 et objets Preuve/Synthèse | Pas de méthode commune runtime ni de seuil d’usage pour une réponse |
| Gérer les contradictions | Objets Contradiction et Controverse ; synthèses structurées | Pas de regroupement des propositions équivalentes ni de décision sur les conflits de révision/contextes |
| Construire la synthèse | R09 et Synthèse de preuves | Pas de contrat de composition, de granularité ni de statut de conclusion |
| Produire le handoff | Contribution RDE-002 et handoff RDE-003 | Pas de schéma Knowledge propre, d’ordre des résultats ni d’atomicité |
| Produire la réponse utilisateur | Parcours `UNDERSTAND` pouvant s’arrêter après Knowledge | Aucun propriétaire de la projection narrative lorsque Document n’est pas appelé et que le LLM ne répond pas directement |
| Mettre à jour l’état | État de connaissance effectif et R42 | Statut d’une connaissance nouvellement recherchée dans le raisonnement courant non défini |

### 5.2 Conclusion de suffisance

Une équipe pourrait implémenter un prototype ad hoc autour d’un corpus connu et de quelques cas. Elle ne pourrait pas démontrer qu’il s’agit du Knowledge Engine décrit par NOXIA. Les choix nécessaires modifieraient le sens de l’autorité scientifique et doivent donc précéder ENG-001.

---

## 6. Concepts manquants

Les intitulés ci-dessous décrivent des fonctions nécessaires constatées comme absentes. Ils ne constituent pas une proposition de nouveaux objets canoniques.

1. **Contrat de demande de connaissance.** Identité, finalité, question, décision concernée, niveau de preuve, contexte et usage attendu.
2. **Paquet de contexte Knowledge.** Sous-ensemble minimal, versionné et autorisé du Research Project transmis au moteur.
3. **Registre des fournisseurs de connaissance.** Inventaire de chaque corpus, son domaine, sa version, son statut, ses capacités de requête et ses limites.
4. **Contrat d’adaptateur de corpus.** Correspondance entre une requête commune et les filtres propres à RB, P4/P5, Knowledge Graph ou source externe.
5. **Plan de requête.** Concepts résolus, synonymes, exclusions, contextes, corpus sélectionnés et justification.
6. **Résolution d’identité scientifique.** Règles pour alias, abréviations, langues, variantes lexicales et homonymes.
7. **Décision d’applicabilité.** Résultat explicite et justifié : applicable, partiellement applicable, hors contexte, inconnu ou incompatible.
8. **Politique de relaxation contextuelle.** Ce qui peut être généralisé, dans quel ordre et avec quelle perte de portée.
9. **Enveloppe de résultat Knowledge.** Assertions, preuves, sources, synthèses, controverses, lacunes, exclusions, statut et trace.
10. **Traçabilité de sélection.** Pourquoi un corpus, une assertion ou une source a été inclus ou exclu.
11. **Hiérarchie de révision et d’effet.** Date d’effet, remplacement, correction, rétractation et révision utilisée.
12. **Localisateur de source commun.** Passage, section, table ou résultat précis permettant la vérification.
13. **Regroupement de propositions équivalentes.** Capacité à reconnaître deux assertions de sens identique, opposé ou seulement différent de contexte.
14. **Taxonomie de lacunes.** Absence de corpus, absence d’assertion, contexte non rapporté, source inaccessible, revue insuffisante, contradiction non résolue ou couverture inconnue.
15. **Statut d’une synthèse runtime.** Distinction entre information déjà effective, résultat calculé depuis des objets effectifs et proposition candidate non gouvernée.
16. **Contrat de comparaison scientifique.** Unité de comparaison, axes, conditions de comparabilité et traitement d’une branche non documentée.
17. **Contrat de réponse pédagogique.** Passage d’une synthèse structurée à une explication utilisateur sans mutation scientifique.
18. **Politique des documents utilisateur.** Statut d’une publication fournie, extraction, confiance, confidentialité et non-promotion automatique.
19. **Politique de recherche externe.** Conditions dans lesquelles R06 peut sortir des corpus déjà admis et statut des résultats obtenus.
20. **Politique de fraîcheur.** Quand une recherche doit être réexécutée et quand un résultat ancien devient insuffisant.
21. **Terminaison de boucle.** Critère de progrès, nombre ou condition de reprise, sortie définitive et propriétaire de l’arrêt.
22. **Séparation données sensibles / contexte scientifique.** Ce qui peut quitter le projet vers un outil documentaire ou un LLM.
23. **Contrat d’observabilité scientifique.** Trace minimale permettant de reproduire la sélection et la synthèse indépendamment du modèle.
24. **Contrat d’évaluation Knowledge.** Cas de référence, vérité attendue, tolérances, erreurs critiques et comparateurs propres au moteur.

---

## 7. Contradictions

### 7.1 Contradictions ou tensions non résolues

| ID | Sources en tension | Constat | Effet |
|---|---|---|---|
| KE-C01 | SOURCE-OF-TRUTH-INDEX vs RDE-001/002/003 | Les RDE proposent une autorité de niveau 1 mais ne sont pas admis | Une implémentation ne peut pas les traiter comme norme officielle |
| KE-C02 | RDE-001 §15 vs §18 | Le LLM ne peut pas choisir une connaissance ; Knowledge est responsable de la sélection contextualisée | Le composant qui effectue effectivement la sélection n’est pas identifié |
| KE-C03 | RDE-001 moteur Knowledge vs PD-012 | Scientific Programs sont une dépendance directe dans RDE-001 ; PD-012 leur interdit de devenir source de contenu scientifique | Usage runtime du Program indéterminé : routage, ownership, filtre ou source |
| KE-C04 | RDE-002 transition 5 vs sortie `KnowledgeUnavailable` | Un corpus ou une source gouvernée disponible est une précondition, mais le moteur doit aussi établir qu’aucune connaissance applicable n’existe | Le moteur peut être empêché de s’exécuter avant de produire le constat d’absence attendu |
| KE-C05 | RDE-002 transitions 5–6 vs PD-003/R42 | La sortie Knowledge est une Contribution et ne modifie l’État de connaissance qu’après gouvernance ; Scientific Thinking la consomme immédiatement | Le statut utilisable d’une connaissance candidate dans la session n’est pas défini |
| KE-C06 | RDE-002 corridor vs responsabilités réelles | Knowledge précède Scientific Thinking, alors que Knowledge exige une question/contexte et Scientific Thinking produit question, mécanismes et hypothèses | Boucle de bootstrap sans contrat de terminaison |
| KE-C07 | RDE-003 biomarqueur/Knowledge | Imaging a besoin de Knowledge pour proposer un biomarqueur ; Knowledge peut avoir besoin du biomarqueur et du contexte Imaging pour rechercher | Dépendance circulaire sans découpage entre exploration et validation |
| KE-C08 | PD-005 R06–R09 vs RDE-001/002 | R06 recherche des preuves nouvelles ; RDE n’autorise que des corpus ou sources gouvernés et R42 exige validation humaine avant activation | Statut des preuves externes nouvellement trouvées dans une réponse immédiate ambigu |
| KE-C09 | RDE-001 parcours `UNDERSTAND` vs frontière LLM/Document | Le parcours peut s’arrêter après Knowledge ; le LLM ne répond pas directement et Document n’est pas nécessairement appelé | Aucun propriétaire explicite de la réponse présentée à l’utilisateur |
| KE-C10 | Scientific Assertion Layer, P4/P4R/P5 et RDE-003 | La surface générale d’assertions est documentée comme vide dans sa passe initiale, tandis que des corpus spécialisés structurés possèdent leurs propres assertions ; RDE-003 met surtout en avant les trois RB | Aucune règle n’indique quelle surface est courante, fusionnable ou prioritaire pour Knowledge |
| KE-C11 | RDE-002 vs RDE-003 | `KnowledgeUnavailable` est un événement de workflow ; `NO_SUPPORTED_KNOWLEDGE` est un libellé d’arrêt Imaging | Leur correspondance, leur portée et leur représentation canonique ne sont pas définies |
| KE-C12 | RDE-003 exemple MR/CT vs patrimoine P4 | L’exemple cite RB-003/RB-004 et une recherche future, sans mentionner le corpus structuré MR/CT ECV déjà gouverné | Une équipe pourrait ignorer une source applicable ou construire deux chemins concurrents |

### 7.2 Écart historique explicitement non qualifié comme contradiction active

P17 rapporte deux Reasoning Books officiels et RB-005 candidat non créé. PD-013 état 1.7 et le SOURCE-OF-TRUTH-INDEX v1.24 constatent l’admission ultérieure de RB-005. P17 conserve sa valeur de snapshot ; il ne gouverne pas l’état courant. Les RDE datés du 8 août utilisent correctement le nouvel état de trois RB. Aucun document ne doit être réécrit silencieusement pour effacer cette chronologie.

---

## 8. Responsabilités ambiguës

| Frontière | Ambiguïté | Risque d’implémentation |
|---|---|---|
| Knowledge vs PD-009 | PD-009 choisit l’action « demander une connaissance » ; Knowledge sélectionne les connaissances | Knowledge peut redéfinir silencieusement le besoin ou PD-009 peut surspécifier la recherche |
| Knowledge vs R06 | R06 construit la stratégie bibliographique ; Knowledge doit sélectionner le corpus et les sources | Deux propriétaires possibles du plan de recherche |
| Knowledge vs R07 | R07 produit des assertions sourcées ; Knowledge produit des connaissances applicables | Statut et ownership de l’assertion extraite non définis |
| Knowledge vs R08 | R08 qualifie preuve et applicabilité ; Knowledge doit fournir la connaissance applicable | La décision d’applicabilité peut être dupliquée |
| Knowledge vs R09 | R09 synthétise preuves et controverses ; Knowledge produit des synthèses et controverses | Mission presque superposée sans contrat moteur/rôle |
| Knowledge vs R42 | Knowledge utilise la connaissance ; R42 prépare son activation ou retrait | Frontière entre usage ponctuel, proposition et état effectif absente |
| Knowledge vs Scientific Thinking | Knowledge explique ; Scientific Thinking construit mécanismes et hypothèses | Une explication mécanistique peut être produite par les deux |
| Knowledge vs Imaging | Knowledge possède l’autorité de sélection ; Imaging construit biomarqueurs et comparaison | La conclusion comparative et la formulation des limites n’ont pas de propriétaire unique |
| Knowledge vs Document | Knowledge produit une synthèse ; Document produit la projection narrative | Le parcours `UNDERSTAND` ne dit pas qui transforme le résultat en réponse |
| Knowledge vs Knowledge Graph | Knowledge sélectionne ; le graphe retourne aussi assertions applicables et synthèse structurée | La sélection pourrait être déléguée au graphe sans que ce soit déclaré |
| Knowledge vs Scientific Program | Program gouverne ownership/portefeuille ; Knowledge le liste comme dépendance | Risque de traiter un dossier de Program comme preuve |
| Knowledge vs humain scientifique | Une synthèse nouvelle peut exiger revue ; le moteur doit néanmoins répondre | Niveau de décision humaine requis par type de réponse indéfini |
| Domain Gate vs Knowledge | Domain Gate vérifie domaine/capacité ; Knowledge détecte l’absence de connaissance | Double évaluation de couverture sans autorité de départage |
| Scientific Thinking vs R13/Imaging | Scientific Thinking conserve la question et le construit ; R13/Imaging compare les modalités | Une demande de comparaison directe peut entrer par trois chemins différents |

---

## 9. Objets insuffisamment définis

| Élément requis par le workflow | Appui documentaire actuel | Insuffisance |
|---|---|---|
| Besoin adressé à Knowledge | Besoin d’information PD-003 | Aucun sous-type, champ ou garde propre à un besoin de connaissance |
| Requête Knowledge | Mention de question, contexte et besoins de preuve | Identité, version, filtres, portée et finalité absents |
| Contexte de requête | Contexte du projet et Domaine de validité | Sous-ensemble transmis, valeurs inconnues, exclusions et temporalité non définis |
| Corpus interrogé | Programs, RB, corpus, Catalog, Knowledge Graph | Identité runtime et contrat commun absents |
| Assertion applicable | Énoncé de connaissance PD-003 et ScientificAssertion | Correspondance entre les deux modèles et règle d’effet non fixées |
| Source candidate | Source scientifique PD-003 et SourceIdentity/Revision | Statut d’une source trouvée mais non admise ambigu |
| Preuve extraite | Preuve scientifique et EvidenceLink | Règle d’atomicité et de qualification commune à tous les corpus absente |
| Synthèse runtime | Synthèse de preuves, R09, AssertionSynthesis | Distinction entre calcul déterministe, synthèse gouvernée et texte généré absente |
| Controverse runtime | Controverse scientifique et contradictions de corpus | Critère de création, identité et clôture absents |
| Lacune | Limite, Incertitude, Besoin d’information, données absentes | Plusieurs représentations possibles sans règle de choix |
| Résultat Knowledge | Contribution | Contenu minimal, cardinalités, ordre et cycle de vie non définis |
| Adoption dans le projet | Contribution, Décision, État de connaissance effectif | Autorité et moment d’intégration non définis selon le type de résultat |
| Trace de sélection | Exigence générale de traçabilité | Aucun objet ou structure canonique pour inclusions/exclusions |
| Réponse utilisateur | Projection et parcours `UNDERSTAND` | Profil, fidélité, citations et responsable de génération non définis |
| Erreur Knowledge | `KnowledgeUnavailable`, `NO_SUPPORTED_KNOWLEDGE` | Taxonomie, payload et mapping canonique absents |

---

## 10. Éléments à arbitrer

Les points suivants appellent une décision d’autorité. Le présent audit ne choisit pas leur solution.

1. Statut et ordre d’admission de RDE-001, RDE-002 et RDE-003 avant toute mission ENG-001.
2. Nature exacte du Knowledge Engine : orchestrateur de fournisseurs, moteur de requête, moteur de synthèse ou combinaison explicitement bornée.
3. Objets canoniques lus, proposés et possédés temporairement par Knowledge.
4. Autorité responsable de la sélection finale des connaissances applicables.
5. Rôle runtime exact des Scientific Programs.
6. Inventaire officiel des corpus interrogeables et autorité qui le maintient.
7. Place respective des Reasoning Books et des corpus structurés P4/P4R/P5.
8. Statut de la surface générale du Scientific Assertion Layer par rapport aux registres spécialisés.
9. Ordre de consultation et de priorité entre corpus, graphe, RB, source externe et document utilisateur.
10. Correspondance entre Énoncé de connaissance PD-003 et ScientificAssertion.
11. Conditions d’usage d’une preuve nouvellement trouvée mais non activée dans l’État de connaissance effectif.
12. Seuil humain requis pour une explication, une comparaison, une recommandation conditionnelle et une mise à jour de corpus.
13. Propriétaire de la synthèse structurée et propriétaire de la réponse narrative.
14. Frontière exacte du LLM dans formulation de requête, extraction, appariement, synthèse et rédaction.
15. Règles de contexte exact, partiel, absent, incompatible et relaxé.
16. Taxonomie commune des lacunes, refus et indisponibilités.
17. Terminaison des boucles Knowledge–Scientific Thinking–Imaging et R06–R09.
18. Politique de recherche externe et de fraîcheur des sources.
19. Politique des documents fournis par l’utilisateur.
20. Contrat d’évaluation scientifique propre au Knowledge Engine sous PD-011.

---

## 11. Éléments bloquants

| ID | Blocage | Pourquoi ENG-001 ne peut pas l’inventer |
|---|---|---|
| KE-B01 | Les trois architectures RDE ne sont pas admises | Leur autorité et leurs arbitrages conditionnent toute implémentation conforme |
| KE-B02 | Aucun contrat exact d’entrée/sortie Knowledge | Il détermine les objets et responsabilités métier, pas seulement une interface technique |
| KE-B03 | Aucun registre runtime unifié des corpus | Une implémentation pourrait ignorer une source officielle ou interroger des sources non autorisées |
| KE-B04 | Aucune sémantique commune de requête et d’applicabilité | Deux équipes pourraient produire des réponses opposées avec les mêmes corpus |
| KE-B05 | Aucune hiérarchie runtime des sources et révisions | La confiance, l’actualité et le traitement des corrections ne peuvent pas être déterminés |
| KE-B06 | Aucun contrat d’ownership et de mutation | Le moteur pourrait modifier un objet qu’il ne possède pas ou ne rien pouvoir intégrer |
| KE-B07 | Statut indéfini des résultats non encore effectifs | La chaîne Knowledge → Scientific Thinking peut consommer une proposition comme vérité ou se bloquer complètement |
| KE-B08 | Frontière LLM incomplète | Le point où une opération probabiliste peut influencer la sélection scientifique n’est pas contrôlable |
| KE-B09 | Boucles sans terminaison ni progrès mesurable | Risque de cycles infinis, d’arrêt arbitraire ou de sortie variable selon l’implémentation |
| KE-B10 | Aucun propriétaire de la réponse `UNDERSTAND` | Le moteur peut produire des objets sans sortie utilisateur ou autoriser indirectement une réponse LLM interdite |
| KE-B11 | Coexistence non arbitrée des RB et corpus structurés | Les exercices MR/CT, no-reflow et T1/ECV ne disposent pas d’un chemin scientifique unique |
| KE-B12 | Absence de contrat d’évaluation Knowledge | Aucune preuve future ne pourrait conclure de façon reproductible que le moteur respecte sa mission |
| KE-B13 | Politique de contexte sensible absente | Une implémentation de recherche externe ou LLM pourrait exposer inutilement des données patient/projet |

Un seul de KE-B02 à KE-B12 suffirait à refuser la readiness. Leur cumul exclut `READY_WITH_ARBITRATIONS` : les arbitrages ne sont pas périphériques, ils constituent le cœur du moteur.

---

## 12. Éléments non bloquants

| Élément | Qualification |
|---|---|
| Duplication textuelle d’une ligne Data Management dans RDE-001 | Défaut éditorial sans effet direct sur Knowledge |
| Collision historique de la roadmap RDE-001 avec les identifiants RDE-002/RDE-003 | Bloquante pour l’admission documentaire globale, mais pas pour comprendre la mission scientifique de Knowledge |
| Choix futur d’une technologie d’indexation ou de stockage | Non bloquant tant que les contrats sémantiques sont fixés |
| Choix du fournisseur LLM | Non bloquant en principe ; les frontières doivent rester stables |
| Format visuel de la réponse | Non bloquant pour le moteur, sous réserve d’un contrat de projection fidèle |
| Nombre exact de questions conversationnelles | Gouverné par PD-009/PD-004, pas par Knowledge |
| Extension à de nouvelles modalités | Non bloquante si le registre de corpus et l’abstention sont définis |
| Compte historique de deux RB dans P17 | Écart chronologique déjà explicite ; l’état courant est déterminable |
| Absence de protocole d’acquisition constructeur | Conforme au périmètre ; ne bloque pas un Knowledge Engine documentaire |
| Absence actuelle de PASS PD-011 | État normal avant implémentation ; bloque une revendication de validation, pas la rédaction ultérieure du moteur |

---

## 13. Liste exhaustive des questions restantes avant ENG-001

### 13.1 Autorité et périmètre

1. RDE-001 est-il admis, avec quels arbitrages A01–A10 ?
2. RDE-002 est-il admis après RDE-001, avec quelle réconciliation de son identifiant ?
3. RDE-003 est-il admis comme premier moteur spécialisé ou reste-t-il seulement une dépendance candidate ?
4. Quel document devient l’autorité spécialisée du Knowledge Engine ?
5. ENG-001 est-il autorisé à implémenter seulement ou aussi à prendre des décisions d’architecture scientifique ?
6. Le premier moteur vise-t-il uniquement `UNDERSTAND` ou tous les parcours RDE ?
7. Le domaine initial est-il borné aux trois RB, aux corpus structurés existants ou à tout le Territory Model ?
8. Une demande technique comme NumPy/DICOM est-elle `IN_SCOPE`, `BORDERLINE` ou `OUT_OF_SCOPE` ?

### 13.2 Mission et ownership

9. Knowledge est-il responsable de la recherche, de la sélection, de l’évaluation, de la synthèse ou seulement de leur orchestration ?
10. Quel rôle reste à R06 si Knowledge construit aussi le plan de recherche ?
11. Quel rôle reste à R09 si Knowledge produit aussi une synthèse et des controverses ?
12. Quel composant décide qu’une connaissance est applicable ?
13. Quel composant décide qu’aucune connaissance applicable n’existe ?
14. Quels objets PD-003 Knowledge peut-il lire ?
15. Quels objets PD-003 Knowledge peut-il proposer ?
16. Quels objets Knowledge ne peut-il jamais modifier, même après une réponse humaine ?
17. Knowledge possède-t-il une trace d’exécution durable ou seulement une Contribution ?
18. Qui adopte une Contribution Knowledge dans le Research Project ?
19. Qui peut modifier l’État de connaissance effectif ?
20. Qui est responsable de la réponse finale dans `UNDERSTAND` ?

### 13.3 Entrée et contexte

21. Quel est le schéma exact d’une demande Knowledge ?
22. La Question scientifique est-elle obligatoire pour une simple explication pédagogique ?
23. Un parcours sans Dossier durable possède-t-il un État de connaissance effectif ?
24. Quel contexte minimal est obligatoire par type de demande ?
25. Comment représenter une information absente, supposée, contradictoire ou refusée dans la requête ?
26. Comment les négations et exclusions exprimées par l’utilisateur sont-elles conservées ?
27. Comment une modification de contexte invalide-t-elle une requête ou un résultat antérieur ?
28. Quelle version du Research Project est lue pendant une requête longue ?
29. Comment gérer une modification concurrente du projet ?
30. Quelles données sensibles sont interdites dans un appel externe ou LLM ?
31. Comment réduire le contexte transmis au strict nécessaire ?
32. Comment prouver que les termes spécialisés et leurs relations n’ont pas été généralisés ?

### 13.4 Corpus, Programs, Reasoning Books et graphe

33. Quelle autorité maintient la liste des corpus interrogeables ?
34. Le Scientific Knowledge Catalog est-il un routeur runtime ou uniquement une couche de pilotage ?
35. Les Scientific Programs servent-ils au routage, à l’ownership, aux impacts ou à aucun appel runtime direct ?
36. Un portefeuille Program vide en `ScientificAssertionRefs` peut-il néanmoins router vers son RB ?
37. Comment un RB devient-il interrogeable sans transformer son texte narratif en assertion effective ?
38. Le moteur lit-il le DOCX maître, une représentation dérivée contrôlée ou une indexation séparée ?
39. Comment un passage de RB reçoit-il un localisateur stable à travers les versions ?
40. Quelle relation existe entre une décision de Reasoning Book et une ScientificAssertion ?
41. Comment P4/P4R/P5 sont-ils découverts par une requête générale ?
42. Les requêtes spécialisées P4 et P5 partagent-elles une interface garantie ?
43. La surface générale du Scientific Assertion Layer absorbe-t-elle à terme les corpus spécialisés ou les fédère-t-elle ?
44. À quel moment le Scientific Knowledge Graph est-il interrogé ?
45. Que retourne le graphe lorsque ses registres généraux sont vides mais qu’un corpus spécialisé existe ?
46. Comment dédupliquer une même source ou proposition présente dans un RB et un corpus structuré ?
47. Comment gérer un actif possédé par un Program mais consommé par un autre ?
48. Comment propager une mise à jour de source vers les requêtes et projets utilisateurs affectés ?

### 13.5 Recherche et résolution de concepts

49. Qui transforme la demande en stratégie de recherche reproductible ?
50. Quel vocabulaire ou registre résout les synonymes, acronymes et traductions ?
51. Comment distinguer T1 comme paramètre, mesure, carte, séquence ou biomarqueur ?
52. Comment distinguer ECV comme construit, estimateur, variable ou critère ?
53. Comment traiter `no-reflow`, MVO et obstruction microvasculaire sans les rendre universellement synonymes ?
54. Comment traiter une entité inconnue du graphe mais présente dans un RB ?
55. Une requête utilise-t-elle intersection stricte, union, alternatives ou sous-requêtes ?
56. Comment les filtres de population, pathologie, modalité, méthode, temps et équipement se combinent-ils ?
57. Comment les valeurs `EXACT`, plages, `ANY_OF`, exclusions et inconnu sont-elles comparées ?
58. Quel est l’ordre de priorité entre correspondance exacte et correspondance plus générale ?
59. Une relaxation de contexte est-elle permise ? Qui l’autorise et comment sa perte de portée est-elle affichée ?
60. Comment empêcher un fort rappel de produire une réponse encyclopédique générique ?
61. Comment mesurer qu’aucun corpus pertinent n’a été omis ?
62. Comment une recherche est-elle rendue déterministe et rejouable ?

### 13.6 Sources, preuves et synthèses

63. Quelle hiérarchie runtime s’applique entre consensus, standard, revue systématique, étude primaire et validation technique ?
64. La hiérarchie de sélection P4 vaut-elle pour tous les domaines ou uniquement pour sa construction de corpus ?
65. Comment une source plus récente mais moins robuste est-elle comparée à une source officielle plus ancienne ?
66. Comment une correction, rétractation ou version remplacée affecte-t-elle le résultat ?
67. Une source limitée au résumé peut-elle soutenir une explication, une comparaison ou une recommandation conditionnelle ?
68. Quel niveau de localisateur est obligatoire avant utilisation ?
69. Qui vérifie que l’extraction ne dépasse pas le passage source ?
70. Comment plusieurs EvidenceLinks sont-ils regroupés sans compter les publications comme votes ?
71. Comment des assertions de contextes différents sont-elles séparées d’une contradiction réelle ?
72. Comment une controverse reçoit-elle une identité stable ?
73. Quel statut de conclusion peut être produit sans revue scientifique humaine ?
74. Comment une synthèse runtime diffère-t-elle d’une Synthèse de preuves publiée et effective ?
75. Comment une phrase de réponse reste-t-elle reliée aux assertions et localisateurs qui la soutiennent ?
76. Quelle règle interdit une conclusion plus forte que le sous-ensemble de preuves effectivement récupéré ?

### 13.7 Lacunes, refus et reprise

77. Quelle taxonomie distingue absence de corpus, absence d’assertion, absence de contexte, absence de source et absence de revue ?
78. `KnowledgeUnavailable` et `NO_SUPPORTED_KNOWLEDGE` représentent-ils le même fait ?
79. Quels objets canoniques portent chaque type de lacune ?
80. Une lacune ouvre-t-elle toujours un Besoin d’information ?
81. Qui décide d’une recherche externe, d’une réduction de portée ou d’un arrêt ?
82. Comment prouver qu’un refus est dû à la connaissance et non à une panne de fournisseur ?
83. Quelle condition permet de reprendre après ajout d’un corpus ou d’une source ?
84. Un résultat partiel peut-il être présenté si une branche comparative est absente ?
85. Comment conserver une modalité non couverte sans lui attribuer de propriétés inventées ?
86. Comment distinguer « non comparable » de « comparaison non encore documentée » ?

### 13.8 Boucles et orchestration

87. Comment démarre Knowledge si la Question n’est pas encore stabilisée ?
88. Comment Scientific Thinking raffine-t-il le besoin sans devenir propriétaire de la recherche ?
89. Comment Imaging fournit-il un biomarqueur candidat sans exiger au préalable la connaissance qui doit le soutenir ?
90. Quel événement matérialise le retour Knowledge → Scientific Thinking ?
91. Quel événement matérialise le retour Imaging → Knowledge ?
92. Quel critère démontre un progrès entre deux itérations ?
93. Quand la boucle R06 → R07 → R08 → R09 → R06 doit-elle s’arrêter ?
94. Qui émet l’arrêt lorsqu’aucune nouvelle source exploitable n’existe ?
95. Comment éviter qu’un changement de formulation relance inutilement la recherche ?
96. Quel cache scientifique est licite et sous quelle version de contexte ?
97. Une même requête peut-elle alimenter plusieurs moteurs et projets sans perdre son domaine de validité ?
98. Comment un événement de connaissance invalide-t-il uniquement les branches réellement dépendantes ?

### 13.9 LLM et réponse utilisateur

99. Le LLM peut-il générer des termes de recherche ?
100. Le LLM peut-il résoudre des synonymes non présents dans un registre ?
101. Le LLM peut-il classer une source dans un type documentaire ?
102. Le LLM peut-il extraire une assertion si R07 exige le texte intégral ?
103. Le LLM peut-il décider qu’un contexte est applicable ?
104. Le LLM peut-il ordonner les assertions ou les sources ?
105. Le LLM peut-il rédiger une synthèse à partir d’un résultat déterministe ?
106. Quel contrôle vérifie que le texte n’ajoute aucune relation absente ?
107. Comment chaque phrase générée conserve-t-elle ses sources exactes ?
108. Comment une réponse générale est-elle séparée d’une interprétation patient-level ?
109. Quelle formulation est permise après « J’ai un T2 élevé » ?
110. Qui approuve une réponse contenant une recommandation conditionnelle de modalité ?

### 13.10 Évaluation et admission du moteur

111. Quels cas de référence appartiennent spécifiquement au Knowledge Engine ?
112. Quels résultats structurés exacts sont attendus pour les huit exercices ENG-001A ?
113. Quels experts établissent les références de comparaison ?
114. Comment évaluer séparément rappel, précision, applicabilité, provenance, contradiction, lacune et abstention ?
115. Quelles erreurs ont une tolérance nulle ?
116. Comment tester qu’un corpus proche n’est jamais utilisé comme substitution ?
117. Comment tester la stabilité sous changement de LLM ?
118. Comment tester la reproductibilité après mise à jour d’un corpus ?
119. Comment tester les sources corrigées, rétractées, abstrait-only et sans localisateur ?
120. Comment tester la minimisation des données sensibles ?
121. Quel seuil ou quelle décision humaine autorise le passage de candidat à moteur utilisable ?
122. Quel artefact PD-011 portera la décision de promotion, sans confondre recette technique et validation scientifique ?

---

## 14. Décision finale

KNOWLEDGE_ENGINE_NOT_READY
