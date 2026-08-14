# DM-001 — Ownership Matrix

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — OWNERSHIP_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/dm-001-study-data-management-architecture.md` |

## 1. Règle d’ownership

Collecter, représenter, contrôler, corriger, transformer, projeter ou transmettre une donnée ne transfère jamais l’ownership de son sens scientifique. L’owner du processus DM n’est pas automatiquement l’owner de la variable, de la méthode, de la source, de l’analyse ou de la décision.

## 2. Matrice par plan

| Élément | Owner canonique | Contributeurs | Rôle DM | Consommateurs | Modification interdite |
|---|---|---|---|---|---|
| DataNeed | Research Project | Scientific Thinking, domaines, humains | référence versionnée | CDM, DM, Biostatistics, DOC | adoption ou suppression par DM |
| CanonicalVariable | Research Project | OBS/domaines, DM pour contraintes opérationnelles | référence ; projection en champs/colonnes | CDM, DM, Biostatistics, DOC | création ou redéfinition par eCRF/dataset |
| ExpectedVariableOccasion | Research Project | TMP/operations | planifie la collecte sans posséder l’attente | DM, CDM, SoA | réalisation réécrivant le plan |
| ObservableProperty | OBS/domaine | Knowledge, scientifiques | lecture de l’identité/version | Project, CDM, Biostatistics | changement par contrôle DM |
| MeasurementDefinition | OBS/domaine | Imaging, laboratoire, dispositif, Core Lab | référence plan/réel, conditions, limites | Project, CDM, Biostatistics | modification ou substitution silencieuse |
| BiomarkerRole | Project sous qualification OBS/domaine | scientifiques | conserve la référence | analyses, documents | adoption depuis une valeur disponible |
| VariableOccurrence | représentation CDM ; source primaire reste owner de la source | DM, domaine producteur | crée/qualifie/corrige sous mandat, sans changer la Variable | Biostatistics, DOC, VAL | écrasement d’histoire ou de parents |
| StudyDataSource | source externe pour son contenu ; CDM pour la représentation | DM, domaines | identité opérationnelle, ingestion, contrôles | occurrences, provenance | appropriation de la source externe |
| DataManagementDefinition | Data Management | Project, qualité, domaines, opérations | définit/versionne le processus | équipes DM, VAL, DOC | redéfinition scientifique |
| DataCollectionSpecification | Data Management pour la projection | Project/CDM/OBS | compose champs/règles/instructions | eCRF, Data Dictionary, SoA | identité Variable portée par le champ |
| DataIngestionRecord | Data Management | système/source producteur | crée trace d’exécution et d’intégrité | CDM, audit, VAL | masquer brut, erreurs ou rejeu |
| DataQualityFinding | owner du processus DM ; owner du sens reste domaine compétent | validators, reviewers | détecte, route, suit | queries, corrections, VAL | correction automatique implicite |
| DataQuery | Data Management pour le workflow | owner source, site, domaine, humain mandaté | ouvre, route, trace et ferme selon décision | correction/réconciliation | réponse appliquée comme vérité sans décision |
| DataCorrectionRecord | Data Management pour la trace | acteur/source mandatés | conserve avant/après/raison/impact | CDM, snapshots, audit | effacement de l’état antérieur |
| ReconciliationRecord | Data Management pour le processus | owners des sources, domaine, humain | compare et trace la disposition | CDM, release, VAL | priorité de source cachée |
| TransformationDefinition | owner selon le sens : DM, domaine ou Biostatistics | DM, scientifique, analyste | versionne/exécute si opérationnelle | CDM, analyses, VAL | changement de sens ou d’estimand |
| TransformationExecution | Data Management ou owner analytique de l’exécution | runtime/opérateur | trace parents, sorties et erreurs | CDM, release, analysis | parents masqués |
| DataSnapshot | Data Management | CDM, qualité | matérialise une vue référencée | freeze, lock, release | seconde vérité canonique |
| DataFreeze | humain/autorité mandatée ; DM exécute | qualité, domaines | applique et audite la restriction | lock, reports | prétendre une irréversibilité non prouvée |
| DataLock / Unlock | humain/autorité mandatée ; DM exécute | qualité, Project, Biostatistics | applique, contrôle et trace | release, audit | unlock sans acteur/mandat/raison |
| DatasetRelease | autorité d’usage mandatée ; DM compose | Project, qualité, Biostatistics | produit paquet versionné et limites | analyse, transfert, archivage | réécriture d’une release antérieure |
| AnalysisSpecification | Biostatistics/domaine analytique, adoption humaine | Project, scientifiques | fournit inputs factuels ; aucune sélection | AnalysisExecution, documents | création d’un modèle/estimand par DM |
| AnalysisResult | domaine analytique compétent | Biostatistics, Scientific Thinking | conserve références et handoff | Project, documents, validation | écrasement des occurrences sources |
| Requirement applicability | REG-001 sous corpus/autorités applicables | Project, humain | transporte seulement | plans/projections | déclarer une règle actuelle sans vérification |
| Structure documentaire | TMP-001 | Project, REG, DOC-002 | fournit artefacts projetables | DOC-001 | projection devenue owner du fond |
| Forme éditoriale | DOC-001 | TMP, sources métier | fournit contenu référencé | lecteurs | document devenant vérité source |
| Finding de validation | VAL | owners concernés | fournit sources, versions, traces | décisions humaines | diagnostic corrigeant la source |

## 3. Décisions réservées

| Décision | Owner décisionnel | DM prépare | DM ne décide pas |
|---|---|---|---|
| adopter/modifier une Variable ou un Endpoint | Research Project / humain mandaté | impact et Contribution | sens scientifique |
| qualifier une méthode ou un critère domaine | OBS/domaine | résultat de contrôle et preuves | validité scientifique |
| corriger une occurrence | acteur mandaté selon source/processus | query, avant/après, impact | réponse non autorisée |
| trancher une réconciliation ambiguë | owners/humain mandaté | comparaison et alternatives | source vraie par défaut |
| geler/verrouiller/déverrouiller | autorité humaine mandatée | readiness, findings, périmètre | approbation implicite |
| autoriser un release | autorité d’usage mandatée | snapshot, limites, provenance | finalité scientifique/réglementaire non mandatée |
| imputer, exclure ou choisir une population/modèle | Biostatistics et décisions humaines applicables | missingness factuel, qualité, exclusions documentées | stratégie statistique |

## 4. Handoffs minimaux

Chaque handoff conserve identité/version/digest lorsque pertinent, owner, source, décisions, unknowns, limitations et boundary. Un handoff ne transfère ni ownership ni autorisation de mutation.

`PROJECT → DM → CDM → DM SNAPSHOT/RELEASE → BIOSTATISTICS` est une chaîne de responsabilités, jamais une chaîne où l’aval réécrit l’amont.
