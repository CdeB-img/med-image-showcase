# MAN-001 — Scientific Product Manifesto V2 Impact Analysis

**Statut :** OFFICIAL — analyse d’impact constitutionnelle
**Niveau :** NIVEAU_3 — document d’accompagnement
**Version :** 1.0
**Date :** 12 août 2026
**Autorité supérieure :** Scientific Product Manifesto V2.0

## 1. Objet

Cette analyse identifie les conséquences de la V2 sans les implémenter. Elle distingue :

- l’impact constitutionnel adopté ;
- l’évolution normative future ;
- l’adaptation d’implémentation éventuelle ;
- la preuve de conformité encore absente.

## 2. Impacts de niveau 0

| Élément | Impact | Justification |
|---|---|---|
| biomarqueur | devient rôle contextualisé d’une Observable Property | sépare mesurabilité et validité comme indicateur |
| moteur unique | devient système coordonné à vérité gouvernée unique | protège l’unité sans créer un composant omniscient |
| chaîne scientifique | devient une série de plans et handoffs | empêche les promotions automatiques |
| données d’étude | définition, occurrence, analyse et document sont séparés | protège identité, provenance et interprétation |
| ownership | devient constitutionnel à chaque frontière | empêche la correction aval silencieuse |

## 3. Ce qui reste inchangé

- science avant technique ;
- phénomène distinct de sa mesure ;
- contexte constitutif du sens ;
- preuve, limites, controverses et inconnues visibles ;
- humain décisionnaire ;
- protocole et document comme projections ;
- une question uniquement si elle peut modifier le raisonnement ;
- Core Lab comme modèle de méthode ;
- traçabilité, explicabilité et reproductibilité ;
- droit et obligation de s’arrêter.

## 4. Impacts documentaires directs

| Document | Impact | Action présente | Action ultérieure |
|---|---|---|---|
| Charte fondatrice | aucun changement | compatibilité vérifiée | aucune |
| Manifeste V1 | devient historique | conservé intact | aucune réécriture |
| SOURCE-OF-TRUTH-INDEX | supersession et nouveaux livrables | mise à jour MAN-001 | maintenir les versions futures |
| PD-003 | contradiction levée au niveau supérieur, modèle encore V1 | aucune modification | révision majeure séparée |
| PD-004 | principes UX compatibles | aucune modification | ajouter les nouvelles distinctions lors d’une révision autorisée |
| PD-005 | rôles IA restent subordonnés | aucune modification | vérifier permissions et refus V2 |
| PD-009 | décision humaine et impact compatibles | aucune modification | consommer les futurs objets PD-003 |
| PD-011 | cadre d’évaluation compatible | aucune modification | ajouter des cas V2 et contrats de non-régression |
| RDE-001/002/003 | ownership général compatible | aucune modification | réviser après PD-003/OBS/CDM |
| KE-001 | Knowledge reste distinct du modèle | aucune modification | permettre des handoffs référencés sans devenir model builder |

## 5. Impacts par moteur existant

### Knowledge

Impact : faible et compatible. Knowledge reste owner des concepts, assertions, relations, preuves, contextes, limites et contradictions. Il devra pouvoir fournir des références versionnées à Scientific Models et OBS, sans construire ni adopter ces objets.

Risque principal : dupliquer les preuves dans un Scientific Model. Garde : références obligatoires et force de preuve inchangée.

### Scientific Thinking

Impact : clarification importante. Ses mécanismes candidats peuvent contribuer à de futurs Scientific Models, mais sa projection runtime actuelle `NO_NEW_ONTOLOGY` reste historique et ne devient pas l’objet canonique.

Risque principal : promouvoir une hypothèse en relation Knowledge. Garde : statuts candidat/établi distincts et adoption humaine.

### Imaging

Impact : adaptation future significative. La chaîne runtime V1 phénomène–biomarqueur–modalité demeure interprétable comme projection legacy ; les sorties V2 devront distinguer Observable Property, Measurement Definition et Biomarker Role.

Risque principal : faire d’Imaging l’owner de toute observabilité. Garde : Imaging reste spécialiste contributeur à OBS.

### Research Project / Study Design

Impact : extension future significative. Project devra référencer les modèles applicables, posséder Data Needs et Canonical Variables, conserver les temps attendus et les décisions, sans posséder les occurrences réelles.

Risque principal : créer une variable depuis une propriété observable sans décision. Garde : handoff candidat puis adoption humaine.

### REG

Impact : faible. REG continue de qualifier l’applicabilité à partir de faits Project. Les variables, occurrences et Biospecimens peuvent devenir des faits bornés ; leur présence ne détermine jamais seule une exigence.

### TMP et DOC

Impact : faible à modéré. Ils devront projeter les nouvelles identités et séparations sans les créer. Un document ne peut fusionner variable et occurrence, résultat et interprétation ou observable et biomarqueur.

### VAL

Impact : extension future. De nouveaux checkpoints devront vérifier Knowledge → Model, Model → OBS, OBS → Project, Project → CDM, CDM → Analysis et Analysis → Documents. VAL reste diagnostique ; il ne corrige ni n’admet.

## 6. Impacts sur les briques futures

| Brique | Mission rendue possible | Interdiction constitutionnelle |
|---|---|---|
| Scientific Model | représenter des explications versionnées et concurrentes | recopier Knowledge ou créer une vérité universelle |
| OBS | gouverner observabilité et Measurement Definitions | posséder les données ou décider les Variables |
| CDM | représenter Variables et Occurrences avec provenance | posséder la vérité scientifique ou choisir l’analyse |
| Data Management | structure, qualité, transformation et lignage | redéfinir le sens scientifique |
| Biostatistics | estimands, modèles, populations, sensibilités, dimensionnement | redéfinir Variable, observable ou biomarqueur |

## 7. Impacts sur les parcours et projections

- Le parcours commence toujours par l’intention et la question.
- Les écrans futurs devront permettre de distinguer « ce que l’on cherche à comprendre », « ce que l’on peut observer », « comment on peut le mesurer » et « pourquoi cela joue un rôle biomarqueur ».
- Les utilisateurs débutants pourront recevoir une explication progressive ; les experts pourront consulter une vue condensée, sans perte du fond.
- Les rapports futurs devront séparer données attendues, données disponibles, résultats et interprétations.
- Les projections legacy restent lisibles mais doivent être identifiées comme telles lorsqu’elles fusionnent des responsabilités V2.

## 8. Analyse de risques

| Risque | Sévérité | Réduction obligatoire |
|---|---|---|
| inflation d’objets | élevée | n’admettre un objet que si identité, cycle ou owner diffère |
| duplication Knowledge/Model | critique | références, jamais copie de preuve |
| OBS devient une seconde ontologie | critique | identité Knowledge réutilisée et frontière Project |
| biomarqueur décontextualisé | critique | rôle, cible, population, temps, méthode et preuve obligatoires |
| Variable universalisée | élevée | identité propre au Research Project |
| Observation ambiguë | élevée | terme qualifié obligatoire |
| CDM centralisateur | critique | représentation seulement |
| moteurs actuels déclarés conformes sans preuve | élevée | distinguer compatibilité, adaptation et évaluation |
| documents qui inventent du fond | critique | projections passives et retour vers l’owner |
| migration rétroactive | critique | conservation V1 et mapping explicite |

## 9. Impact sur l’évaluation

Les futures campagnes devront inclure au minimum :

- observable sans rôle biomarqueur ;
- même observable avec deux rôles biomarqueurs ;
- méthode mesurable mais non applicable ;
- Variable répétée sans duplication d’identité ;
- soin courant réutilisé sans changement de mandat ;
- Biospecimen sans analyse sélectionnée ;
- occurrence absente, invalide ou dérivée ;
- résultat distinct de l’interprétation ;
- projection expert et débutant sémantiquement équivalentes ;
- contradiction traversant tous les handoffs.

## 10. Décision d’impact

La V2 est compatible avec les responsabilités établies des moteurs existants. Elle crée des obligations d’évolution future, principalement pour PD-003, Imaging, Research Project, OBS, CDM, Data Management, Biostatistics et VAL. Aucun de ces impacts ne doit être requalifié en capacité déjà implémentée.
