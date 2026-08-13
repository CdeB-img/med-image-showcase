# OBS-001 — Engine Impact Matrix

**Version :** 1.0
**Statut :** OFFICIAL — IMPACT_ANALYSIS_COMPANION
**Niveau documentaire :** NIVEAU_3 — compagnon subordonné à OBS-001
**Date d'admission :** 12 août 2026
**Source maîtresse :** présent fichier Markdown
**Décision associée :** `OBS001_OBSERVABILITY_MEASUREMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`

---

## 1. Objet

Cette matrice identifie les impacts normatifs prévisibles d'OBS-001. Elle ne réalise aucune adaptation, ne qualifie aucune conformité actuelle et n'autorise aucun développement.

## 2. Règle de lecture

`Breaking?` décrit le risque contractuel si un consommateur aplatit les plans scientifiques ; il ne constate pas une rupture effectivement observée. `Adapter needed?`, `Implementation required?` et `Evaluation required?` désignent des travaux futurs à décider séparément.

## 3. Matrice

| Engine | Current normative contract | OBS dependency | Required adaptation | Breaking? | Adapter needed? | Implementation required? | Evaluation required? |
|---|---|---|---|---|---|---|---|
| Knowledge | KE-001 ; sources, assertions, applicabilité, contradictions, gaps | fournir preuves, portée et limites aux MeasurementDefinitions, performances et rôles | préserver les références OBS et refuser la promotion d'une absence de preuve | Potentiel si contexte aplati | À déterminer | Oui, mission séparée | Oui, dont provenance et refus |
| Scientific Thinking | Manifesto V2, PD-003, PD-009 | produire ScientificModel et ObservableProperty distingués | exposer explicitement modèle, propriété, rôle éventuel et décision humaine | Oui si chaîne V1 composite | Probable pour artefacts V1 | Oui, mission séparée | Oui, cas de séparation des plans |
| Imaging | RDE-003 | spécialiser MeasurementDefinition pour l'imagerie sans posséder le modèle global | mapper phénomène, propriété, méthode, équipement, qualité et contribution ; conserver les refus | Potentiel | Probable | Oui, mission séparée | Oui, non-régression RDE-003 |
| Research Project | RDE-001/002, PD-003 | recevoir le paquet OBS et décider des DataNeeds/variables | implémenter le handoff, états incomplets, décisions et impact de version | Potentiel | Probable | Oui, mission séparée | Oui, handoff et décisions humaines |
| REG | REG-001 | transporter des contraintes réglementaires applicables sans définir la mesure | référencer conditions et contexte OBS ; ne pas convertir une règle en preuve métrologique | Non par principe | À déterminer | À déterminer | Oui si adaptation |
| DOC-002 | DOC-002 | projeter définitions, limites, preuves et décisions sans les fusionner | ajouter des projections lisibles et signaler inconnues/contradictions | Potentiel pour documents existants | Probable | Oui, mission séparée | Oui, fidélité documentaire |
| TMP | TMP-001 | composer des structures à partir de besoins qualifiés | accepter les références OBS sans inventer méthode, valeur ou protocole | Non si frontières respectées | À déterminer | À déterminer | Oui si adaptation |
| DOC | contrat documentaire courant | rendre la trace scientifique et les limites | préserver ownership, version et provenance dans toute édition | Potentiel | À déterminer | À déterminer | Oui, accessibilité et fidélité |
| VAL | VAL-000 et PD-011 selon périmètre | vérifier contrat, non-régression et non-promotion | ajouter des cas OBS sans confondre conformité documentaire et validité scientifique | Non normatif ; travaux requis | Non déterminé | Oui, mission séparée | Oui, obligatoire avant revendication |
| future CDM | non admis | représenter les objets et occurrences décidés en aval d'OBS | définir ultérieurement représentation, unités, valeurs manquantes et provenance sans redéfinir OBS | Inconnu | À déterminer | Oui, future mission CDM-001 | Oui |
| future Data Management | non admis | consommer DataNeeds, variables, conditions et qualité | définir collecte, gestion et traçabilité sans posséder la validité scientifique | Inconnu | À déterminer | Oui, future mission | Oui |
| future Biostatistics | non admis | consommer variables, occurrences, performances et limites | définir usages analytiques et estimands sans redéfinir la mesure | Inconnu | À déterminer | Oui, future mission | Oui |

## 4. Impacts transverses minimaux

Tout consommateur futur doit démontrer :

1. séparation ScientificModel / ObservableProperty / MeasurementDefinition / BiomarkerRole / DataNeed / CanonicalVariable / VariableOccurrence / Observation ;
2. conservation de l'owner et de la version ;
3. provenance de toute performance, validité ou comparabilité ;
4. visibilité des limites, inconnues et contradictions ;
5. refus des créations automatiques non autorisées ;
6. lecture legacy sans promotion silencieuse ;
7. décision humaine au handoff vers le Research Project ;
8. non-production d'un protocole exécutable par OBS.

## 5. Non-régression

Les contrats existants restent valides dans leur domaine. OBS-001 :

- ne remplace pas KE-001, RDE-001, RDE-002 ou RDE-003 ;
- ne retire pas la propriété de la prochaine action à PD-009 ;
- ne retire pas la gouvernance de la preuve à PD-011 ;
- ne transforme pas REG, TMP, DOC ou VAL en owners de la science de mesure ;
- ne préjuge pas des contrats encore absents de CDM, Data Management ou Biostatistics.

## 6. État réellement implémenté

Aucune adaptation listée dans la matrice n'a été réalisée ou évaluée par cette mission. Aucun code, moteur, adapter, schéma, donnée, API, interface ou test produit n'a été créé ou modifié.

## 7. Provider et SEM

Cette analyse d'impact est indépendante de tout provider LLM live. Aucun appel Gemini, campagne SEM, benchmark provider ou quota externe n'a été utilisé. L'état de SEM-001R3 est hors périmètre et ne qualifie ni ne bloque les adaptations futures.

## 8. Limites

La matrice décrit des dépendances normatives prévisibles. Une analyse d'écart technique, un plan de migration, une implémentation et une campagne d'évaluation restent nécessaires avant toute revendication de conformité moteur.
