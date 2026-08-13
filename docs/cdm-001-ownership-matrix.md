# CDM-001 — Ownership Matrix

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — OWNERSHIP_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorités | PD-003 V2 Ownership Matrix → OBS-001 Ownership Matrix → CDM-001 |

## 1. Règles

1. Une identité a un owner sémantique unique ; le CDM n’en crée pas un concurrent.
2. Une contribution, consommation, production technique, projection ou correction proposée ne transfère pas l’ownership.
3. ResearchProject possède le sens des DataNeeds, Variables et attentes ; CDM possède leur représentation Study Data ; le système source possède la production ; Data Management futur possède les opérations de conservation/qualité ; Biostatistics possède l’analyse.
4. Une correction du sens retourne à l’owner. Une correction de réalisation crée une version/supersession traçable.
5. Toute décision engageante exige humain, mandat, portée, version, raison et date.

## 2. Matrice par objet ou construction

| Objet / construction | Owner | Contributors | Consumers | Decision owner | Correction owner | Version owner | Creation right | Mutation right | Read right | Handoff |
|---|---|---|---|---|---|---|---|---|---|---|
| Knowledge assertion/evidence | Knowledge | Programs, experts | Models, OBS, Project, CDM refs, analyses, DOC, VAL | gouvernance Knowledge/humain | Knowledge | Knowledge | Knowledge | Knowledge | selon accès | refs/version/contexte |
| ScientificModel | Models governance | Knowledge, ST, domaines | OBS, Project, Biostatistics | gouvernance Models ; Project pour adoption | Models | Models | Models | Models | consumers | model refs + limites |
| ObservableProperty | OBS | Knowledge, Models, domaines | MD, Project, CDM refs | OBS/humain scientifique | OBS | OBS | OBS | OBS | consumers | id/version/context |
| MeasurementDefinition générale | OBS/domaine spécialisé | Knowledge, Project, Data, Analysis | Project, CDM, Data, Analysis | owner méthode ; Project pour usage | OBS/domaine | OBS/domaine | OBS/domaine | OBS/domaine | consumers | planned/actual refs |
| BiomarkerRole général | gouvernance rôle/OBS | Knowledge, Models, domaines | Project, analyses | gouvernance rôle ; Project pour adoption | owner rôle | owner rôle | owner rôle | owner rôle | consumers | ref contextualisée |
| DataNeed | ResearchProject | Models, OBS, domaines, Data, Biostatistics | Variables, sources, analyses | humain Project | Project | Project | Project | Project | consumers | besoin/version/décision |
| CanonicalVariable — sens | ResearchProject | OBS, domaines, CDM, Data, Biostatistics | CDM, TMP, DOC, analyses | humain Project | Project | Project | Project | Project | consumers | id/version/sens |
| CanonicalVariable — représentation Study Data | CDM sous identité Project | Project, Data, Biostatistics | Data, Analysis, projections, VAL | CDM steward pour conformité ; Project pour sens | CDM pour représentation, Project pour sens | CDM contract / Project object | CDM profile seulement | CDM profile seulement | consumers | contrat qualifié |
| ExpectedVariableOccasion | ResearchProject / Study Design | CDM, Data, domaines | SoA, CRF, Data, analyses | humain Project | Project | Project | Project | Project | consumers | attente/version |
| StudyDataSource usage | ResearchProject ; owner externe conservé | source systems, sites, Data | CDM, analyses, VAL | humain Project pour usage | source pour faits ; Project pour usage | owner source/Project | Project ref/source | owner concerné | selon accès | source ref + mandat |
| VariableOccurrence production | source system/site/dérivation autorisée | sites, domaines | CDM/Data | producteur sous mandat | producteur puis Data | source/CDM | source sous mandat | correction supersédante | autorisés | occurrence + provenance |
| VariableOccurrence canonical representation | CDM / futur Data Management | source, domaines, Project | analyses, DOC autorisé, VAL | Data/humain pour disposition | CDM/Data ; source consultée | CDM/Data | ingestion/représentation | non-destructive | autorisés | value/status/lineage |
| Occurrence quality / missingness | CDM/Data ; critère chez OBS/domaine | source, site, QA | Project, Analysis, VAL | humain/Data selon usage | CDM/Data/source | CDM/Data | source/CDM | supersession | consumers | axes + reasons |
| Biospecimen | Biobanking/domain owner ; Project adopte usage | sites, Laboratory, Data | Laboratory, CDM, analyses | humain Project/biobanque | Biobank/Data | Biobank | domaine/site mandaté | non-destructive | autorisés | identity/chain/restrictions |
| Transformation definition | owner règle/méthode/AnalysisSpecification | Project, Data, domaines, Biostatistics | CDM/Data/Analysis | humain owner | owner définition | owner définition | owner compétent | owner | consumers | rule/version |
| Transformation execution | CDM/Data ou AnalysisExecution selon nature | systèmes/analystes | lineage, analyses, VAL | processus mandaté ; humain pour disposition | execution owner | execution owner | système autorisé | supersession/reexecution | consumers | inputs/outputs/trace |
| Dataset projection | Data Management ou owner analytique selon usage | CDM, Biostatistics | analyses, DOC, VAL | humain mandaté pour freeze/release | projection owner | projection owner | projection owner | nouvelle version | consumers | canonical refs + selection |
| AnalysisSpecification | Biostatistics/domaine analytique ; Project adopte | Project, Data, domaines | executions, DOC, VAL | humain Project | Analysis owner | Analysis owner | Analysis owner | Analysis owner | consumers | inputs/method/version |
| AnalysisExecution | processus analytique sous mandat | systèmes/analystes | AnalysisResult, audit | owner analytique | Analysis owner | Analysis owner | système autorisé | nouvelle execution | consumers | frozen inputs/log |
| AnalysisResult | owner analytique | execution, Data | Project, DOC, VAL | Project pour usage interprétatif | Analysis owner | Analysis owner | Analysis owner | supersession | consumers | result/uncertainty/lineage |
| ScientificInterpretation | humain Project mandaté | Knowledge, Models, OBS, résultats | Project, DOC, VAL | humain mandaté | Project | Project | humain | nouvelle version | consumers | result + rationale |
| TerminologyMapping | owner identité NOXIA + gouvernance terminologique | domaines, Data, REG | exchange, DOC, VAL | humain/owner terminologie | mapping owner | mapping owner | owner/mapping governance | version/supersession | consumers | source/target/equivalence |
| CRF / Data Dictionary / SoA | projection owner TMP/DOC/Data selon artefact | Project, CDM, REG | sites, Data, users | humain pour usage | projection owner pour forme ; owner fond via Contribution | projection owner | projection owner | forme seulement | users | canonical refs |
| Diagnostic VAL | VAL | owners de frontière | owners/gouvernance | humain/PD-011 pour disposition | source owner, jamais VAL | VAL pour règle | VAL | diagnostic seulement | autorisés | findings, no mutation |

## 3. Matrice des droits par domaine

Légende : **O** owner ; **S** owner spécialisé ; **C** contributeur ; **P** producteur ; **R** consumer/read ; **D** décision humaine ; **V** diagnostic ; **—** aucun droit implicite.

| Domaine | Knowledge/Models | OP/MD | DataNeed/Variable | Expected Occasion | Occurrence | Biospecimen | Transformation | Analysis | Projection | Décision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Knowledge | O | C | R | — | — | R | R | R | R | R |
| Scientific Models | O | C | C | — | — | — | R | C | R | R |
| OBS | R | O | C | C | R | R | C | C | R | R |
| ResearchProject | R | R/adoption | O | O | O sens/R | O usage | O adoption | O adoption | R | O/D |
| CDM | R | R | O représentation/C | R | O représentation | R | O data execution | R | C | R |
| Imaging | R | S Imaging | C | C | P/C | R | S Imaging | S image | C | R |
| Laboratory | R | S Laboratory | C | C | P/C | C | S Laboratory | S domaine | C | R |
| Clinical Assessment | R | S Clinical | C | C | P/C | — | S domaine | S domaine | C | R |
| Device / Wearable | R | S Device | C | C | P/C | — | S domaine | S domaine | C | R |
| Data Management futur | R | C | C | C | O conservation/quality | C | O data operations | C | O data projections | R |
| Biostatistics futur | R | C | C | R | R | R | O analytique | O | O analysis projection | R |
| REG | R | R | R | R | R borné | R borné | R | R | C | R |
| TMP | R | R | R | R | — | R | — | R | O structure | R |
| DOC | R | R | R | R | R autorisé | R autorisé | R | R | O rendu | R/diffusion |
| VAL | V | V | V | V | V | V | V | V | V | R |
| Source systems | — | — | — | R | P | P selon domaine | P execution | P execution | — | — |
| Site personnel | R | C | R | R | P/C | P/C | C | R | R | D selon mandat |
| Human decision-maker | D | D selon mandat | D | D | D correction/usage | D usage | D adoption | D | D diffusion | O |

## 4. Handoffs sans transfert

| Handoff | Paquet | Ce qui reste chez la source |
|---|---|---|
| OBS/Domain → Project | propriété, méthode, qualité, limites | science générale de mesure |
| Project → CDM | variables, attentes, décisions, provenance | sens scientifique et adoption |
| Source/Site → CDM/Data | occurrence, source, méthode réelle, temps, qualité | vérité du système/source original |
| CDM → Data Management | représentation, statuts, lineage, restrictions | contrat canonique |
| CDM/Data → Biostatistics | occurrences gelées/contextualisées | conservation et qualité |
| Analysis → CDM | execution, inputs, results, uncertainty | méthode/résultat analytique |
| CDM → TMP/DOC/VAL | refs, projections autorisées, invariants | identités et droit de correction |

## 5. Conflits et limitations

Un conflit est une revendication du même acte sur la même identité/version, pas la coexistence d’un owner transversal et spécialisé. Il est résolu par PD-003, l’owner du sens et une décision humaine ; sinon `PD003_EVOLUTION_REQUIRED`.

Les instances organisationnelles CDM, Data Management et Biostatistics restent à instituer. Cette matrice n’accorde aucun accès aux données, mandat clinique ou droit réglementaire et ne prouve aucune implémentation.
