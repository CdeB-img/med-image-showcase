# CDM-001 — Variable Identity Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — VARIABLE_IDENTITY_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | CDM-001 puis PD-003 V2 |

## 1. Principe

Une CanonicalVariable possède une identité sémantique unique dans un ResearchProject. CRF, eCRF, Data Dictionary, SoA, Data Management Plan, SAP, AnalysisSpecification, dataset, table, listing, figure, export, document et mapping externe la référencent ; aucun ne la recrée.

L’owner scientifique reste ResearchProject. CDM possède seulement le contrat de représentation Study Data. Une anomalie de sens retourne comme Contribution à l’owner.

## 2. Contrat minimal

| Élément | Règle |
|---|---|
| variableId | stable, opaque au sens et indépendant des noms de projection |
| version | immuable ; supersession explicite |
| canonicalName | nom gouverné du Project, non clé de stockage |
| displayLabels / aliases | projection, langue, audience et provenance |
| description | sens scientifique/contextuel exact |
| motivation | DataNeed/Objectif/Endpoint refs applicables |
| mesure | ObservableProperty/MeasurementDefinition refs si applicables |
| sémantique | rôle, ValueDomain, unités, source/temps/qualité/missingness attendus |
| dérivation | statut, règle/version et sourceVariableRefs |
| mappings | TerminologyMappings versionnés et non autoritaires |
| gouvernance | owner, decisions, provenance, status, supersession |

Une variable administrative, de contexte, d’identification pseudonymisée, événementielle, d’exposition ou de classification n’est pas forcée vers une ObservableProperty.

## 3. Same identity, new version, new identity

| Changement | Disposition | Condition |
|---|---|---|
| label, traduction, alias, colonne | même identité ; projection/version descriptive | sens inchangé |
| timepoint | même identité + nouvelle occasion | définition stable |
| source ou routine/study mandate | même identité + contexte source | sens stable |
| rôle analytique / endpoint usage | même identité + qualification consumer | pas de redéfinition |
| code/standard externe | même identité + mapping versionné | mapping qualifié |
| unité/precision | même identité/version si conversion et sens compatibles | original conservé |
| ValueDomain | version si distinctions stables ; nouvelle identité si sens change | analyse d’impact |
| MeasurementDefinition | même identité possible si le sens Project reste identique | OBS + décision Project |
| population | qualification/version si portée d’usage ; nouvelle identité si constitutive | domaine explicite |
| formule | version compatible ou nouvelle identité si sens substantiel change | parents/règle conservés |
| définition scientifique | nouvelle identité ou supersession | continuity of meaning rompue |

`sameIdentity` requiert continuité du sens, de l’owner et du rôle. Un libellé identique ne suffit jamais. Une nouvelle identité conserve sa filiation par `SUPERSEDES` ou relations de dérivation appropriées.

## 4. Variables composites et dérivées

Questionnaire score, ECV, BMI, lesion burden, score multi-marker, volume Imaging, delta, ratio et valeur normalisée sont arbitrés selon deux axes : composition du format et sens scientifique dérivé. Une structure composée ne crée pas nécessairement plusieurs Variables ; une nouvelle sortie réutilisable possède une CanonicalVariable seulement après décision Project.

Une sortie d’effet, estimand, statistique globale ou incertitude inférentielle est AnalysisResult, pas Variable.

## 5. Projections

Exemple normatif :

| Projection | Nom local | Référence obligatoire |
|---|---|---|
| CRF | `Infarct size` | `VAR-INFARCT-SIZE` |
| Data Dictionary | `infarct_size` | `VAR-INFARCT-SIZE` |
| dataset | `INF_SIZE` | `VAR-INFARCT-SIZE` |
| SAP | `Infarct size at primary assessment` | `VAR-INFARCT-SIZE` |
| external mapping | code/version qualifiés | `VAR-INFARCT-SIZE` |

## 6. Refus

Sont refusés : identité encodant automatiquement timepoint, source, méthode ou projection ; déduplication lexicale ; promotion d’un champ/colonne/code ; changement de sens pour satisfaire un export ; réétiquetage rétroactif des occurrences après révision.

## 7. Provider et limitations

Le contrat est indépendant de Gemini, SEM et de tout provider. Il n’implémente aucun registry, générateur d’identifiants, catalogue ou migration.
