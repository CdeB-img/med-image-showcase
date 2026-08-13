# SEM-001 — Scientific Semantic Reconstruction & Conversational Workspace

**Type :** rapport d’implémentation et de validation locale
**Date :** 11 août 2026
**Version du contrat SEM :** 1.0
**Schéma :** `SEM-001-1.0`
**Baseline Git :** `d3de7ad603031acb8703cded7e5f00c24719be37` (`main`)
**Décision :** `SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`

Ce rapport décrit un état d’implémentation. Il ne constitue ni un `PASS` PD-011, ni une admission scientifique, ni une autorisation de publication, de déploiement ou d’usage clinique.

## 1. Décision

La reconstruction sémantique, son modèle canonique, son API, son espace conversationnel, son rejeu versionné et ses adaptateurs aval sont implémentés et vérifiés contractuellement.

La fermeture SEM-001 est néanmoins refusée pour deux raisons centrales :

1. la campagne LLM réelle sur le holdout n’est pas démontrée : 3 cas sur 30 ont produit un modèle complet, 27 ont échoué côté fournisseur ; aucune métrique métier valide ne peut être calculée sur un sous-ensemble incomplet ;
2. le diagnostic aval reproduit un blocage absolu du contrat : dans un transfert direct SEM → IMG d’une comparaison CT/IRM, le contexte SEM contient bien CT et IRM, mais l’entrée IMG perd CT.

Ces défauts interdisent également le statut `IMPLEMENTED_WITH_LIMITATIONS`, réservé aux limites périphériques.

## 2. Autorités

| Nature | Autorité consultée | Usage dans SEM-001 |
|---|---|---|
| Gouvernance documentaire | `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version 1.25 | Routage des autorités ; aucune autorité scientifique propre |
| Principes établis | Charte fondatrice ; Scientific Product Manifesto | Comprendre avant de construire ; rendre le raisonnement reconstructible |
| Cible produit | Product Specification ; PD-003 ; PD-004 ; PD-005 ; PD-009 | Objets, UX, rôles, décision et orchestration cibles |
| Évaluation | PD-011 | Frontière de validation formelle ; aucun `PASS` revendiqué |
| État implémenté antérieur | RDE-001, RDE-002, RDE-003, KE-001, ST, IMG, PRJ, DOC, SYS et SYS-001B | Contrats réellement observés et points de raccordement |
| Autorité externe | `editorial-engine/docs/architecture-manifesto.md` | Frontières génériques du moteur éditorial ; aucune modification effectuée |
| Hypothèses SEM | Prompt SEM-001 et durcissement de compétence | Autorisation bornée des inférences candidates et critères de fermeture |

Contradiction rendue explicite : RDE-001 bornait historiquement l’interprétation aux mentions explicites. SEM-001 autorise désormais des implicites candidats, mais interdit leur promotion silencieuse. Cette évolution d’implémentation ne transforme ni l’inférence LLM ni le support Knowledge en fait confirmé.

## 3. Baseline

- dépôt : `noxia-dev` ;
- branche : `main` ;
- commit de départ : `d3de7ad603031acb8703cded7e5f00c24719be37` ;
- index documentaire : version 1.25, 74 artefacts gouvernés et 75 index inclus ;
- aucun artefact INT-001 observé ;
- changements TMP-001 apparus simultanément dans le worktree et laissés hors du périmètre SEM ;
- dépôt externe `editorial-engine` déjà modifié avant SEM-001 et laissé intact.

Le présent rapport de niveau implémentation ne modifie pas le SOURCE-OF-TRUTH-INDEX et ne devient pas autoritatif par sa seule présence.

## 4. Problème observé

L’entrée antérieure structurait surtout des champs d’Intake et exposait rapidement des états internes. Elle savait préserver le texte et contrôler des champs, mais ne possédait pas de représentation canonique autonome des objets, relations, ellipses, implicites, corrections et niveaux de preuve.

Le risque principal était un projet méthodiquement cohérent construit à partir d’une compréhension sémantique appauvrie : modalité perdue, comparateur fusionné, endpoint promu ou pathologie spécifique réduite à un domaine générique.

## 5. Architecture précédente

Le parcours précédent reposait sur :

1. une interprétation Intake structurée ;
2. une revue champ par champ ;
3. un routage déterministe ;
4. des handoffs spécialisés vers Knowledge, ST, IMG, PRJ et DOC ;
5. des sessions locales versionnées.

Cette architecture reste disponible comme espace structuré de reprise et comme consommateur aval. Elle n’est plus la surface d’entrée principale.

## 6. Architecture SEM-001

Le flux implémenté est :

`Conversation → reconstruction LLM → critique LLM indépendante → canonicalisation déterministe → vérification Knowledge → correction/confirmation humaine → snapshot accepté → adaptateurs aval`.

Les responsabilités sont séparées entre :

- contrats et schémas stricts ;
- abstraction de fournisseur ;
- double passe LLM ;
- garde-fous serveur ;
- canonicalisation et digests ;
- vérification Knowledge ;
- session conversationnelle ;
- adaptateurs vers les contrats existants ;
- interface principale conversationnelle ;
- campagne de compétence indépendante des tests techniques.

## 7. Rôle du LLM

Le LLM est l’interpréteur primaire du langage scientifique libre. Il propose des objets, relations, ellipses, ambiguïtés, implicites, clarifications et un routage.

Il ne décide pas :

- qu’une inférence est vraie ;
- qu’un endpoint candidat est adopté ;
- qu’une hypothèse causale est confirmée ;
- qu’une connaissance existe dans le corpus ;
- qu’un projet est publiable ;
- qu’une évaluation PD-011 est réussie.

La seconde passe critique reçoit la reconstruction structurée et cherche explicitement les pertes, fusions et promotions non soutenues.

## 8. Scientific Semantic Model

Le `ScientificSemanticModel` version 1.0 conserve :

- requête originale et messages sources ;
- sens normalisé ;
- objets sémantiques typés ;
- relations et leurs extrémités ;
- ellipses, ambiguïtés, inconnues, contradictions et concepts manquants ;
- clarifications candidates ;
- proposition de route ;
- résultat de la critique ;
- snapshot d’exécution LLM ;
- snapshot Knowledge ;
- état précédent, historique, digest et révision ;
- trace d’acceptation humaine.

Un modèle accepté n’est jamais réécrit en place. Une nouvelle conversation produit une révision liée à l’état précédent.

## 9. Explicit / inferred / supported / confirmed

| Statut | Sens | Promotion autorisée |
|---|---|---|
| `EXPLICIT_USER_STATED` | Présent dans un span exact du message utilisateur | Conservé comme explicite |
| `INFERRED_HIGH_CONFIDENCE` | Implicite très plausible proposé par le LLM | Jamais confirmé automatiquement |
| `INFERRED_CANDIDATE` | Implicite de travail | Confirmation ou rejet requis selon impact |
| `SUPPORTED_CANDIDATE` | Candidat couvert par Knowledge | Reste candidat |
| `UNSUPPORTED_CANDIDATE` | Candidat non couvert ou gap | Reste visible, non promu |
| `CONFIRMED_BY_USER` | Adopté explicitement par l’utilisateur | Utilisable dans le snapshot accepté |
| `REJECTED_BY_USER` | Écarté ou remplacé | Conservé dans la trace, exclu du modèle actif |
| `UNKNOWN` / `AMBIGUOUS` | Non déterminé ou polysémique | Ne doit pas être comblé silencieusement |

La canonicalisation refuse le statut explicite si le texte source n’est pas un segment contigu exact d’un message utilisateur.

## 10. Ellipses

Les ellipses sont des objets visibles et non des erreurs de formulaire. Le système peut reconstruire ce qui est établi, conserver l’ellipse structurante et poser une clarification unique portant sur la décision la plus affectée.

Une ellipse non résolue qui soutiendrait silencieusement la construction place le modèle en `CLARIFICATION_REQUIRED`.

## 11. Implicites

Les implicites sont proposés séparément des éléments déclarés. Leur raison, leur confiance, leur besoin de confirmation et leur support Knowledge sont conservés.

Les inférences de causalité, direction attendue, endpoint ou spécificité non soutenue sont des cibles explicites de la critique et des bloqueurs de campagne lorsqu’elles sont adoptées.

## 12. Knowledge verification

Le modèle canonique produit une requête Knowledge à partir des objets et relations actifs. Le résultat peut qualifier un candidat comme soutenu, partiel, non soutenu, conflictuel ou gap.

Knowledge ne transforme jamais une inférence en déclaration utilisateur. Les objets explicites et confirmés gardent leur origine épistémique ; les références et gaps restent traçables dans le snapshot.

## 13. Auto-critique sémantique

La critique couvre notamment :

- perte d’objet, de relation, de comparateur, d’intervention, de modalité, de timing ou d’outcome ;
- généralisation de domaine non soutenue ;
- spécificité, causalité, direction ou endpoint non soutenus ;
- ellipse non résolue ;
- ambiguïté cachée ;
- effondrement sémantique.

Toute issue critique non résolue empêche l’acceptation automatique du candidat.

## 14. Provider abstraction

Le contrat `ScientificSemanticProvider` expose deux opérations : reconstruction et critique. L’implémentation active utilise Google Gemini avec :

- modèle configuré : `gemini-3.5-flash` ;
- température : 0 ;
- prompt de reconstruction : `SEM-001-RECONSTRUCTION-1.0` ;
- prompt critique : `SEM-001-CRITIC-1.0` ;
- schéma de réponse strict : `SEM-001-1.0`.

La reproductibilité porte sur les entrées, versions, réponses structurées, digests et snapshots ; elle ne prétend pas rendre un modèle génératif intrinsèquement déterministe.

## 15. Failure mode

En absence de fournisseur, timeout, erreur fournisseur ou réponse invalide, le système produit `SEMANTIC_RECONSTRUCTION_DEGRADED`.

Ce mode :

- conserve le texte original ;
- n’invente aucun objet sémantique ;
- ne se présente pas comme équivalent au LLM ;
- interdit la poursuite comme snapshot accepté ;
- affiche une alerte explicite à l’utilisateur.

La campagne navigateur locale a exercé ce mode, car le serveur Vite ne fournit pas l’API serverless. Elle démontre la sûreté de la dégradation, pas la compétence sémantique.

## 16. Routing

Les routes candidates sont `UNDERSTAND`, `FORMALIZE_IDEA`, `DESIGN_STUDY`, `DOCUMENT` et `REVIEW_REROUTE`.

Le routage reste une proposition tracée. Une demande documentaire avec projet insuffisant conserve l’intention `DOCUMENT` mais n’autorise aucune génération. Une contradiction ou une critique non résolue peut imposer `REVIEW_REROUTE`.

## 17. Intégration ST

L’adaptateur ajoute la référence et le digest du snapshot sémantique au `ValidatedScientificIntent` puis à l’entrée ST. Le diagnostic CT/IRM conserve les deux modalités et la relation de comparaison à l’entrée ST.

Résultat diagnostique : entrée sémantiquement correcte, sortie de construction ST fidèle pour les éléments vérifiés, aucun ajout causatif observé dans le test ciblé.

## 18. Intégration IMG

Le transfert direct vers IMG reçoit un contexte SEM qui contient CT et IRM. `buildImagingDesignInput` conserve IRM mais perd CT dans `methodPreferences`.

Cette perte n’a pas été corrigée dans SEM-001, conformément à l’interdiction de modifier silencieusement un moteur aval. Elle correspond textuellement au blocage absolu « CT perdu dans une comparaison CT/IRM ».

## 19. Intégration PRJ

Le transfert PRJ conserve CT et IRM dans le contexte scientifique. Lorsque l’imagerie spécialisée n’est pas prête, le handoff reste `REQUIRED_BUT_NOT_READY` ; le projet n’est pas déclaré complet par défaut.

### Diagnostic aval consolidé

| Engine | Input semantically correct? | Output faithful? | Information lost? | Unsupported inference? | Follow-up required? |
|---|---:|---:|---|---:|---|
| ST | Oui | Oui sur le cas CT/IRM testé | Non observée | Non observée | Campagne aval élargie après fermeture SEM |
| IMG | Oui | Non | CT perdu dans le transfert direct CT/IRM | Non observée | Oui, correction IMG distincte de SEM |
| PRJ | Oui | Oui pour le contexte et l’état de readiness | Non observée dans le test ciblé | Non observée | Rejouer après correction IMG |

## 20. Human Decision Envelope

Le parcours standard ne demande aucun champ générique Actor ou Mandate pour interpréter, corriger, accepter ou poursuivre. L’acceptation sémantique produit une trace minimale interne.

Les décisions scientifiques, documentaires, produit et de publication restent gouvernées par leurs contrats propres. L’acceptation d’une interprétation n’est pas une décision clinique ni un `PASS` PD-011.

## 21. Interface précédente

L’interface précédente était dominée par la saisie d’une question, une interprétation champ par champ, des états internes et des parcours spécialisés visibles tôt. Elle reste disponible pour reprendre une session existante ou poursuivre après un snapshot SEM accepté.

Elle ne gouverne plus l’entrée initiale.

## 22. Nouvelle interface

La route de démonstration ouvre désormais deux surfaces principales :

1. Conversation ;
2. Projet en construction.

L’interface reste responsive, sans formulaire initial obligatoire, sans Actor/Mandate générique et sans jargon moteur au niveau principal.

## 23. Conversation

La conversation accepte un texte libre, des formulations incomplètes et des corrections naturelles. Les messages restent visibles, l’historique n’est pas effacé par une correction et la réinitialisation demande confirmation.

Les anciennes sessions structurées peuvent être reprises explicitement ; elles ne sont jamais restaurées automatiquement.

## 24. Project Living View

Le projet vivant projette le snapshot courant : sens normalisé, objets groupés, statuts épistémiques, raisons d’inférence, clarification prioritaire et actions autorisées.

Cette vue n’est pas une seconde source de vérité. Elle est dérivée du `ScientificSemanticModel` courant.

## 25. Progressive disclosure

L’audit est une vue secondaire ouverte par `Audit / mode expert`. Il montre versions, snapshot, fournisseur, critique, Knowledge et relations du graphe sans remplacer la conversation, la saisie libre ni le projet vivant.

Le test navigateur mobile confirme que ces quatre surfaces restent simultanément accessibles et sans débordement horizontal.

## 26. Cas carotidien

Le cas elliptique « Je voudrais évaluer la carotidienne via différentes modalités » est présent dans la campagne et dans les tests obligatoires. Les contrats exigent la conservation de l’objet carotidien, de l’intention d’évaluation, de l’ellipse et d’une clarification pertinente.

Le navigateur réel a vérifié la conservation du message et le mode dégradé sûr. La compréhension LLM live de ce cas n’est pas démontrée par la campagne incomplète.

## 27. Cas reperfusion / stenting

Le cadre de compétence exige de conserver séparément comparaison, stenting immédiat, stenting différé, IRM et lésions, puis de proposer les implicites sans les adopter.

Les tests contractuels et canoniques couvrent cette structure. La campagne live incomplète interdit d’en déduire une compétence réelle généralisée.

## 28. Corrections multi-tours

La correction « la MVO m’intéresse davantage que la taille de l’infarctus » produit une nouvelle révision. L’ancien élément est marqué `REJECTED_BY_USER`, le nouvel élément reste actif et la relation avec l’état précédent est conservée.

Les tests de correction et de contexte multi-tour passent. Le navigateur confirme que les deux messages restent visibles en mode dégradé. Le taux live de propagation ne peut pas être calculé sur un holdout incomplet.

## 29. Campagne sémantique

Le corpus local comprend 60 cas :

- 30 `DEVELOPMENT_CASES` ;
- 30 `HOLDOUT_CASES` distincts.

Chaque cas possède un Gold Semantic Frame : objets explicites, relations, inférences acceptables et interdites, ambiguïtés, clarifications, intent, routes, éléments critiques et règles de correction.

La campagne live configurée a exécuté le holdout avec Gemini :

| Élément | Résultat |
|---|---|
| Cas prévus | 30 |
| Modèles complets | 3 |
| Échecs fournisseur | 27 |
| Statut | `NOT_DEMONSTRATED` |

Les 3 résultats partiels ne sont pas évalués comme s’ils constituaient la campagne.

## 30. Métriques

L’évaluateur calcule toutes les métriques requises : Explicit Object Recall, Explicit Relation Recall, Critical Semantic Recall, préservation comparateur/intervention/modalité, dérive, inférence non soutenue, ellipses, ambiguïtés, clarifications inutiles, routage, corrections, contexte multi-tour et effondrement de domaine.

Les seuils sont codés exactement comme critères d’acceptation SEM-001. Aucun score holdout n’est publié, car 27 résultats manquent. Le résultat métrique applicable est `NOT_DEMONSTRATED`, donc `NOT_READY`.

## 31. Tests

| Validation | Résultat observé |
|---|---|
| SEM-001 ciblé | 7 fichiers, 40 tests, tous passés |
| Protocol Designer | 7 fichiers, 148 tests, tous passés |
| Knowledge / External Evidence | 8 fichiers, 87 tests, tous passés |
| ST | 6 fichiers, 33 tests, tous passés |
| IMG | 9 fichiers, 60 tests, tous passés |
| PRJ | 5 fichiers, 56 tests, tous passés |
| DOC ciblé | 7 fichiers, 64 tests, tous passés après reprise explicite |
| SYS | 11 fichiers, 34 tests, tous passés |
| Typecheck | passé |
| Lint ciblé SEM et raccordements | passé |
| Build production | passé |
| `git diff --check` | passé |
| Campagne LLM live | échec de fermeture : 3/30 résultats |

Les tests techniques ne remplacent pas la campagne de compétence.

## 32. Navigateur

Une campagne A–H a été rejouée sur :

- bureau : 1440 × 1000 ;
- mobile : 390 × 844.

Cas couverts : ellipse, formulation experte implicite, question complète, comparaison multimodale, intervention + imagerie, correction majeure, projet sans imagerie et demande documentaire insuffisante.

Résultats communs : 8/8 sans plantage, messages conservés, projet vivant visible, saisie libre disponible, aucun Actor/Mandate, aucun débordement horizontal et aucune erreur console. Les 8 cas ont exercé le mode dégradé ; ils ne prouvent donc pas que NOXIA comprend davantage avant de questionner.

## 33. Non-régressions

La suite globale finale compte 1 073 succès sur 1 076 tests. Les trois échecs restants sont exclusivement les contrôles de propreté du dépôt externe `editorial-engine`. La présence statique de deux canoniques dans deux branches exclusives a été factorisée en une balise unique et le contrat SEO repasse.

Les trois autres défaillances vérifient que le dépôt externe `editorial-engine` est propre. Elles restent externes, préexistantes et indépendantes de SEM-001. Le dépôt externe n’a été ni nettoyé ni modifié par cette mission.

Les changements TMP-001 concurrents restent isolés. Ils ne sont ni importés comme preuves SEM ni inclus dans le périmètre de modification SEM.

## 34. Limitations

Limitations centrales bloquantes :

- compétence live non démontrée sur le holdout complet ;
- perte CT active dans le transfert direct SEM → IMG ;
- parcours navigateur live non exercé avec l’API serverless dans le serveur Vite local.

Limitations périphériques :

- un seul fournisseur LLM implémenté ;
- avertissement de taille du bundle de démonstration ;
- données Browserslist anciennes ;
- avertissements React Router v7 préexistants dans les tests UI.

## 35. Fichiers modifiés

Périmètre SEM :

- 22 fichiers sous `src/features/scientific-semantic-reconstruction/` ;
- `api/scientific-semantic.ts` ;
- `api/prompts/scientific-semantic-reconstruction-prompt.ts` ;
- `src/pages/ProtocolDesignerDemo.tsx` ;
- raccordements typés dans Intake et ST ;
- deux contrats de test P-WEB adaptés à la nouvelle entrée ;
- scripts npm `test:semantic` et `test:semantic:live` ;
- présent rapport.

Aucun fichier TMP-001 ou `editorial-engine` n’a été modifié par SEM-001.

## 36. Contrats

| Contrat | Préservé ? | Preuve / remarque |
|---|---:|---|
| Texte utilisateur original | Oui | `originalRequest`, messages et source spans |
| Distinction explicite / inféré / soutenu / confirmé | Oui | statuts épistémiques séparés |
| Aucune adoption silencieuse | Oui au niveau canonique | confirmation/rejet et critique requis |
| Knowledge non prescriptif | Oui | support sans promotion automatique |
| Snapshot accepté immuable | Oui | révisions, digest, historique |
| Mode dégradé non équivalent | Oui | statut et alertes explicites |
| Actor/Mandate absent du parcours standard | Oui | tests UI et navigateur |
| Project truth unique | Oui | vue vivante dérivée du modèle canonique |
| Handoff ST | Oui sur les diagnostics ciblés | snapshot ref et modalités conservés |
| Handoff IMG | Non | CT perdu dans CT/IRM direct |
| Handoff PRJ | Oui sur les diagnostics ciblés | contexte conservé, readiness non inventée |
| PD-011 | Non revendiqué | aucune évaluation formelle effectuée |
| Publication / déploiement | Non | hors périmètre et non effectués |

## 37. Frontières VAL-001 / QRY-001

SEM-001 reconstruit et trace le sens. Il ne remplace pas :

- VAL-001 pour l’évaluation formelle, les seuils scientifiques ou la décision de validation ;
- QRY-001 pour une future couche de requêtes scientifiques gouvernées ;
- Knowledge pour la couverture du corpus ;
- PD-009 pour la prochaine action ;
- PD-011 pour la preuve de validation et de publication ;
- les moteurs ST, IMG, PRJ et DOC pour leurs responsabilités spécialisées.

Aucune logique de correction IMG n’a été introduite dans SEM.

## 38. Prochaine étape

La fermeture exige une nouvelle opération bornée, sans assouplir les seuils :

1. rendre la campagne Gemini stable et exécuter les 30 holdouts complets ;
2. calculer et publier toutes les métriques uniquement sur les 30 résultats ;
3. corriger dans IMG, pas dans SEM, la perte CT du handoff direct CT/IRM ;
4. rejouer SEM → ST, SEM → IMG et SEM → PRJ ;
5. servir l’API réelle lors des essais navigateur A–H ;
6. relancer la suite complète en séparant les trois contrôles externes `editorial-engine` ;
7. ne déclarer la fermeture que si tous les seuils et blocages absolus sont satisfaits.

## Conclusion

`SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`
