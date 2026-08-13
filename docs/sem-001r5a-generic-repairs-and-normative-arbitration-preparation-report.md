# SEM-001R5A — Generic Repairs + Normative Arbitration Preparation

**Statut :** rapport de campagne non admis
**Date :** 2026-08-13
**Décision :** R5A_BLOCKED_BY_CONFIGURATION_DRIFT

## 1. Résultat

| Élément | Résultat | Preuve |
|---|---:|---|
| Réparation A — classification contextuelle, rôles, routing | PASS | règles génériques et diagnostics déterministes ; aucune logique liée à un cas Holdout |
| Réparation B — graphe, provenance, relations | PASS | nouveau rapport d'intégrité opposable à l'acceptation du critic et à la canonicalisation |
| Réparation C — équivalence compositionnelle | PASS | composition bornée par relation explicite et normalisation des exclusions fidèles |
| Tests génériques R5A | 13/13 PASS | src/features/scientific-semantic-reconstruction/__tests__/r5a-generic-repairs.test.ts |
| Suite SEM complète | 270/270 PASS | 25 fichiers de tests |
| Typecheck | PASS | tsc -p tsconfig.app.json --noEmit |
| H29 ciblé | NON EXÉCUTÉ SUR R5A | checkpoint R5 incompatible avec le nouveau contrat de provenance ; aucun mélange de configuration |
| Arbitrages humains | 7/7 PRÉPARÉS | tableau §5 |

La décision globale n'est pas un échec des réparations A/B/C. Elle constate que H29 ne peut recevoir honnêtement ni PASS ni REPRODUCED_FAILURE dans cette passe : la nouvelle vérification d'intégrité identifie dans son checkpoint du premier tour une relation d'inventaire dont le sourceText n'est pas contigu. Ce checkpoint n'est donc plus réutilisable sous la configuration R5A.

## 2. Réparations génériques

### A — classification contextuelle, rôles et routing

- distinction explicite entre semanticType et studyRole ;
- sélection d'une variable de jugement → ENDPOINT contextuel ;
- choix de comparaison non effectué → UNKNOWN, polarité UNCERTAIN, rôle futur conservé ;
- ensemble de sites/institutions → STUDY_DESIGN, non POPULATION ;
- groupe humain exprimé → POPULATION, non simple CONDITION ;
- observable quantitatif nu distingué de la technique qui le produit ;
- route auditée seulement après complétude des objets, relations, taxonomie et intégrité.

### B — graphe, provenance et relations

Le pipeline calcule désormais un SemanticIntegrityReport couvrant :

- fragments, éléments et relations explicitement ancrés dans un segment USER exact et contigu ;
- cohérence entre identifiants d'inventaire et extrémités sémantiques ;
- direction active/passive ;
- polarité ;
- ancrage de répétition sur l'objet répété et son temps ;
- continuité multi-tour sans élément explicite conservé avec inventaire vide ou orphelin.

Un critic ne peut plus rendre ACCEPT si ce rapport reste INCOMPLETE. La canonicalisation classe également le modèle CLARIFICATION_REQUIRED dans ce cas.

### C — équivalence compositionnelle

L'évaluateur reconnaît maintenant :

- des paraphrases négatives fidèles telles que « non concerné », « hors périmètre » ou « non inclus » ;
- une signification composée par un élément attendu et un voisin explicite relié par une relation qualifiante ;
- uniquement une composition à un saut, explicite, active et non négative.

Les comparaisons, associations ou concepts sans relation qualifiante ne sont pas fusionnés. Le test négatif de concepts déconnectés reste en échec comme attendu.

## 3. H29 — requalification bornée

### 3.1 Tentative sur la configuration R5 intacte

Avant les réparations, le checkpoint du premier tour a été repris sous le digest R5 ke1-01d917dec0ebcd82. Cinq départs réseau ont suivi la politique de retry. Tous ont échoué avant statut HTTP :

- départs réseau : 5 ;
- réponses HTTP : 0 ;
- appels LLM effectivement consommés : 0 ;
- appels LLM évités par réutilisation du premier tour encore compatible avec R5 : 2 ;
- autre cas Holdout exécuté : 0.

Preuve : semantic-validation/sem-001r5a/h29-sandbox-network-attempt.json.

### 3.2 Compatibilité après réparations

Les corpus Development/Holdout et les Gold restent inchangés. En revanche, les owners de configuration reconstructionPrompt, criticPrompt, canonicalModel, canonicalizer, coverageAndRepair, evaluator et routing ont changé dans R5A.

L'audit local du checkpoint du premier tour conclut :

- explicit coverage : COMPLETE ;
- relation coverage : COMPLETE ;
- taxonomy : COMPLETE ;
- integrity : INCOMPLETE ;
- cause : INVENTORY_RELATION_SOURCE_NOT_CONTIGUOUS sur la relation d'inventaire rel-2.

Le checkpoint ne peut donc pas être réutilisé comme preuve compatible. Rejouer le second tour sur ce checkpoint mélangerait deux configurations ; relancer le premier tour dépasserait la reprise bornée autorisée dans cette mission. H29 reste non qualifié, sans nouvelle assertion sur la nature transitoire ou reproductible de l'incident provider.

Preuve : semantic-validation/sem-001r5a/h29-provider-requalification.json.

## 4. Digest Gold R4B

Le corpus courant correspond à l'arbitrage humain R4B documenté dans semantic-validation/sem-001r4/h07-gold-arbitration-r4b.json.

| Empreinte | Avant R4B | État courant autorisé |
|---|---|---|
| Gold Holdout | ke1-34ef12e65473a7f2 | ke1-471d78570da30acb |
| Fixture Holdout complète | ke1-ad6dfe2f629e2343 | ke1-fc953456b8da4602 |
| Corpus textuel Holdout | ke1-08392b87b2cc140b | ke1-08392b87b2cc140b |

Seules les deux assertions techniques obsolètes de competence.test.ts ont été alignées sur cet état. Aucun Gold, texte de cas ou seuil n'a été modifié.

## 5. Arbitrage humain — sept cas normatifs

| Case | Source | Moteur | Gold | Taxonomie | Conflit | Recommandation |
|---|---|---|---|---|---|---|
| H10 | « Après exercice, phosphore 31P et BOLD musculaire; voir récupération énergétique. » | 31P/BOLD BIOMARKER ; récupération PHENOMENON ; RECOVERS_AFTER | 31P/BOLD METHOD ; récupération SCIENTIFIC_OBJECT ; RELATED_TO | méthode = technique ; biomarqueur = observable ; phénomène = processus | les libellés ne disent pas s'ils nomment technique ou sortie ; la récupération est formulée comme processus | INSUFFICIENT_INFORMATION — garder le moteur exige d'ajuster le Gold ; garder le Gold exige une convention normative autorisant l'expansion implicite des techniques |
| H12 | « delta-radiomics avant et pendant RT pour toxicité pulmonaire tardive » | METHOD → RELATED_TO_CANDIDATE → OUTCOME | PREDICTS_CANDIDATE | une relation prédictive ne peut être renforcée depuis « pour » sans règle explicite | prédiction absente du texte | GOLD_RELATION_NOT_SOURCE_GROUNDED — réduire le Gold préserve la source ; garder le Gold crée une inférence normative à documenter |
| H17 | « Faut-il regarder l'œdème ou la MVO pour expliquer le no-reflow, sans dire que l'un cause l'autre ? » | œdème/MVO BIOMARKER ; no-reflow PHENOMENON ; relations candidates non causales | œdème/MVO PHENOMENON ; no-reflow SCIENTIFIC_OBJECT ; comparaison | observable ≠ phénomène ; cible expliquée et processus restent distincts ; causalité négative conservée | frontière ontologique des trois termes et force de la relation « ou » non arbitrées | INSUFFICIENT_INFORMATION — chaque choix change trois types et la relation ; arbitrage scientifique explicite requis |
| H22 | « pseudoprogression vs récidive: perfusion DSC + spectro, résultat histologique pas toujours dispo » | deux CONDITION, rôles sujet/comparateur, COMPARES_WITH | pseudoprogression CONDITION, récidive COMPARATOR, DISTINGUISHED_FROM | « vs » établit une comparaison ; une distinction est plus forte | type ontologique de la récidive masqué par le Gold et relation renforcée | GOLD_RELATION_NOT_SOURCE_GROUNDED — garder la comparaison respecte le texte ; garder la distinction exige une règle normative contextuelle |
| H25 | « Deux agents K-edge injectés pour séparer inflammation et vascularisation : projet exploratoire. » | agents INTERVENTION ; inflammation/vascularisation PHENOMENON ; opération de séparation | agents METHOD ; deux SCIENTIFIC_OBJECT ; DISTINGUISHED_FROM | agent injecté = exposition/intervention ; processus étudié = phénomène ; méthode = technique de production | Gold assimile agents à la méthode et processus à objets ; la relation directe n'est pas portée telle quelle | KEEP_ENGINE_CHANGE_GOLD — préserve les rôles exprimés ; garder le Gold redéfinit normativement agent, cible et séparation |
| H28 | « Mesurer perfusion rénale et prédire déclin du DFG; ASL maintenant, suivi deux ans. » | perfusion et déclin BIOMARKER, second avec OUTCOME_ROLE ; ASL METHOD ; prédiction | perfusion SCIENTIFIC_OBJECT ; déclin OUTCOME | propriété observable, rôle biomarqueur et rôle outcome sont distincts dans PD-003 V2 ; SEM utilise encore une taxonomie opérationnelle legacy | aucune classe legacy ne projette sans perte toutes les distinctions V2 | CHANGE_NORMATIVE_TAXONOMY — définir d'abord le mapping V2→SEM puis requalifier ; garder l'un des états legacy pérennise une perte de sens différente |
| H30 | « Comparer deux parcours de consentement et mesurer le taux de refus dans quatre centres. » | parcours INTERVENTION ; taux ENDPOINT ; setting STUDY_DESIGN ; aucune modification | parcours INTERVENTION ; taux OUTCOME ; AIMS_TO_MODIFY | variable qui juge la comparaison = endpoint contextuel ; mesurer ≠ modifier | type de rôle et relation de modification non exprimée | GOLD_RELATION_NOT_SOURCE_GROUNDED — retirer la modification et arbitrer séparément endpoint/outcome ; garder le Gold ajoute une intention causale absente |

Ces recommandations ne constituent aucune décision normative. Toute décision doit enregistrer l'autorité, le motif, la conséquence sur le corpus Gold et l'obligation éventuelle de requalification.

## 6. Périmètre préservé

- aucun Holdout complet exécuté ;
- aucun H10–H30 rejoué ;
- aucun Gold, seuil, catégorie taxonomique ou contrat normatif modifié ; seules les règles génériques de classification ont été précisées ;
- aucun navigateur live ;
- aucun flux SEM→ST/IMG/PRJ live ;
- aucun commit, push ou déploiement ;
- aucun changement du SOURCE-OF-TRUTH-INDEX, ce rapport restant une preuve de phase non admise.
