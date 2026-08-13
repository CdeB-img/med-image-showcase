# CDM-001 — Legacy Compatibility

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — LEGACY_COMPATIBILITY_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorités | PD-003 V2 Legacy Compatibility → OBS-001 Legacy → CDM-001 |

## 1. Principe

La compatibilité est une compatibilité de lecture, de mapping et de traçabilité. Elle n’est ni migration, ni réinterprétation rétroactive, ni écriture V2. Les artefacts V1 restent attachés à leur version et à leur contexte.

## 2. États

| État | Signification | Usage |
|---|---|---|
| `LEGACY_READABLE` | sens historique suffisamment lisible | lecture/citation |
| `V1_COMPOSITE_LEGACY` | définition, valeur, source, temps ou méthode mêlés | aucune création V2 directe |
| `MAPPING_REQUIRED` | décision explicite nécessaire | suspendre la promotion |
| `AMBIGUOUS_LEGACY` | plusieurs interprétations plausibles | revue/arbitrage |
| `MAPPED_WITH_LIMITATIONS` | mapping documenté avec pertes | usage borné |
| `REFUSED_MAPPING` | identité/provenance/sens insuffisants | conserver sans promotion |

Ces états complètent PD-003 ; ils ne forment pas un cycle universel et n’effacent jamais les qualificatifs historiques.

## 3. Inventaire de lecture

| Artefact historique | Questions de mapping | Interdiction |
|---|---|---|
| Variable V1 | définition pure ? valeur/source/temps mêlés ? | promotion automatique en CanonicalVariable |
| Observation V1 | fait, occasion, valeur, constat ou méthode ? | choisir par libellé |
| Data Requirement | besoin scientifique ou champ demandé ? | devenir DataNeed sans décision Project |
| champ CRF/eCRF | quelle variable/version/occasion/source ? | champ crée Variable |
| Data Dictionary entry | source de quel sens et version ? | registry concurrent |
| dataset/colonne | projection de quelle identité et sélection ? | nom proche = same identity |
| SAP variable | role analytique ou nouvelle donnée ? | SAP redéfinit source |
| export historique | standard/version/mapping/losses ? | code externe remplace NOXIA |
| Imaging output | source, MD, execution, value, unit, QA ? | image/metric devient Variable sans décision |
| Laboratory result | specimen, assay, unit, source, time ? | résultat fusionné avec Biospecimen/MD |

## 4. Tests de désambiguïsation

Pour chaque artefact : identifier Project/version et owner ; DataNeed/objectif ; définition scientifique ; OP/MD éventuelles ; Variable candidate ; unités/value domain ; unité étudiée ; occasion attendue et temps réel ; source/méthode prévues et réelles ; valeur/statut ; qualité/missingness ; transformations/corrections ; provenance ; usages/projections ; pertes et contradictions.

Une réponse inconnue reste inconnue. Une même cellule historique ne doit pas être décomposée en plusieurs objets V2 sans décisions et preuves distinctes.

## 5. Identity mapping

`sameIdentity` exige continuité démontrée du sens, de l’owner et du rôle. Ne suffisent pas : même label ; même nom de colonne ; même unité ; même code externe ; même position CRF ; même modalité ; même timepoint ; proximité lexicale.

Un mapping conserve source id/version/digest, artefact, localisateur, décision, actor/mandate/date, cible(s), relation, pertes, alternatives et supersession. `REFUSED_MAPPING` est un résultat recevable.

## 6. Occurrences et corrections historiques

Une valeur historique ne devient occurrence V2 que si Variable/version, unité étudiée, temps, source, méthode, statut et provenance nécessaires sont identifiables ou explicitement incomplets. Une correction historique ne peut pas être inventée depuis la dernière valeur connue. Les versions et anomalies restent visibles.

## 7. Projection legacy

Toute projection courante d’un artefact V1 affiche statut legacy, version source, mapping, pertes, unknowns et limitations. Un PASS, freeze ou validation historique ne vaut pas conformité CDM-001.

## 8. Provider, migration et limitations

Aucun provider LLM live, Gemini, SEM ou benchmark n’est requis ou autorisé pour décider un mapping. Aucun script, adapter, inventaire complet ou migration n’est créé. Toute future migration exige mission, corpus figé, rollback, audit, validation et décision humaine distincts.
