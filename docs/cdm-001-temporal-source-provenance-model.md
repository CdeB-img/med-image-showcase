# CDM-001 — Temporal, Source & Provenance Model

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — TEMPORAL_SOURCE_PROVENANCE_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | CDM-001 ; PD-003 V2 pour les constructions |

## 1. Responsabilité

Cette annexe gouverne trois axes inséparables pour reconstruire une réalisation : quand elle était attendue et a eu lieu ; d’où elle devait et a réellement provenir ; quelles traces permettent de suivre chaque changement. Elle ne crée ni ontologie temporelle, source racine, système externe ni stockage.

## 2. Temps

| Élément | Classe | Règle |
|---|---|---|
| Visit / event | objet PD-003 existant | contexte planifié ou réel |
| TemporalAnchor | value object | référentiel, direction, unité, offset/fenêtre, tolérance |
| ExpectedVariableOccasion | relation/sous-ressource | variable × unité/population × ancre × conditions |
| collection/acquisition/observation/processing/derivation/analysis time | contenu qualifié | temps réel, source et précision propres |
| timepoint projection | projection | label local, jamais identité Variable |

Une occasion couvre répétition, fenêtre, condition, événement déclencheur, as-needed, option, sous-étude et absence prévue. Une occurrence peut être in-window, out-of-window, partial, non-applicable, missing, invalid ou not-evaluable. L’ordre d’une visite ne fabrique aucun temps réel.

## 3. Study units et temporalité hiérarchique

Les temps peuvent porter sur participant, épisode, lésion, examen, série, image, ROI, Biospecimen, aliquot, événement, centre, dispositif ou reader. La StudyUnitReference principale et ses parents sont conservés ; un temps d’examen ne remplace pas le temps de collection d’un Biospecimen ou de processing.

## 4. Source orthogonale

| Axe | Contenu |
|---|---|
| production mandate | study-mandated, routine care, registry/external reuse, autre mandat qualifié |
| provenance context | système/objet/version/producteur |
| domain/method | Imaging, Laboratory, Device, Clinical ou autre domaine |
| organization | site, central/local laboratory, registry, biobank, vendor |
| relation to project | planned, reused, imported, historical, contemporary |
| lineage role | source-native, transformed, derived, analysis-produced |

Ces axes ne sont pas interchangeables. Une source Imaging peut être routine care ; une source Laboratory peut être study-mandated ; une donnée derived peut provenir de plusieurs domaines.

## 5. StudyDataSource contract

La sous-ressource conserve sourceId, type qualifié, external owner, system identity, organization, version, effective period, production/mandate/access contexts, provenance, quality/reliability metadata, restrictions, limitations, mapping status et supersession. Référencer une source ne transfère ni ownership ni accès.

## 6. Planned versus actual

| Axe | Plan | Réalisation | Écart obligatoire |
|---|---|---|---|
| source | ExpectedVariableOccasion/Project | VariableOccurrence | planned/actual refs, reason, impact, decision |
| method | Project + OBS/domain ref | VariableOccurrence | versions, quality/comparability, decision |
| time | TemporalAnchor/window | actual timestamps | in/out window, precision, unknowns |
| unit | canonical/expected | actual unit | conversion need, compatibility, lineage |

Le réel n’écrase jamais le plan. Une donnée de soin courant réutilisée conserve son origine. Une méthode inattendue ne crée pas automatiquement une nouvelle Variable.

## 7. Provenance minimum

Toute occurrence relie : project/version ; variable/version ; unit identity ; expected occasion ; actual temporal contexts ; planned/actual source ; planned/actual MD ; source object/version ; value/unit origin ; quality; transformations ; corrections ; terminology mappings ; analysis consumers/results ; restrictions ; actor/system ; timestamps ; evidence/localizers disponibles.

## 8. Longitudinal et multicentre

Le modèle couvre temps relatif, événements, visites manquées/hors fenêtre, séries continues, trous, synchronisation et changements de device/version. En multicentre, site, système, vendor, procédure, unité locale et versions restent visibles. Aucune normalisation ou harmonisation n’efface la variabilité originale.

## 9. Audit et limitations

Chaque évolution conserve before/after, actor/system, mandate, reason, source version, timestamp et downstream impact. Aucun provider live, graphe technique, base ou format n’est imposé. Une provenance incomplète reste incomplète et peut bloquer l’usage.
