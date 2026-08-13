# OBS-001 — Ownership Matrix

## Matrice normative spécialisée des responsabilités Observability & Measurement

| Champ | Valeur |
|---|---|
| Document | Annexe normative d’OBS-001 |
| Version | 1.0 |
| Statut | `OFFICIAL — SPECIALIZED_OWNERSHIP_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorités | PD-003 V2 Ownership Matrix puis OBS-001 |

## 1. Règle de lecture

Cette matrice spécialise PD-003 V2 sans la contredire. L’owner sémantique définit le sens et le cycle. Un contributeur propose. Un consumer référence. Le decision owner adopte l’usage engageant. Le correction owner reçoit et instruit les corrections. Le version owner publie une nouvelle version sans écraser l’historique.

Une même construction peut avoir un owner transversal et un owner spécialisé : OBS possède le contrat commun de `MeasurementDefinition`; Imaging, Laboratory, Clinical Assessment ou Device possèdent la spécialisation de domaine. Ils ne sont pas concurrents.

## 2. Règles permanentes

1. Un consumer ne mute jamais l’objet du provider.
2. Une correction aval devient `Contribution` vers l’owner.
3. L’owner de la preuve reste Knowledge, même lorsque la preuve qualifie une méthode OBS.
4. L’owner d’une spécialisation ne devient pas owner transversal.
5. Le ResearchProject possède l’adoption contextuelle, jamais la qualification scientifique générale.
6. L’exécution ou la production technique ne transfère pas le sens scientifique.
7. La décision humaine exige acteur, mandat, portée, version, raison et date.
8. Une projection, un Requirement, un Template ou un diagnostic VAL ne devient jamais source du fond OBS.

## 3. Matrice par objet et construction

| Objet / construction | Owner sémantique | Contributeurs | Consumers | Decision owner | Correction owner | Version owner |
|---|---|---|---|---|---|---|
| concept/assertion/preuve scientifique | Knowledge | Programs, experts, domaines | Models, OBS, Project, REG, analyses, DOC | gouvernance Knowledge/humain mandaté | Knowledge | Knowledge |
| ScientificModel général | gouvernance Scientific Models à instituer | Knowledge, Scientific Thinking, experts, domaines | OBS, Project, Biostatistics | gouvernance modèle ; Project pour adoption locale | gouvernance Models | gouvernance Models |
| adoption d’un ScientificModel | ResearchProject | Models, Scientific Thinking, OBS, domaines | Project, analyses, DOC | humain Project mandaté | ResearchProject | ResearchProject |
| ObservableProperty | OBS transversal | Knowledge, Models, domaines de mesure | MeasurementDefinitions, BiomarkerRoles, Project, DOC | gouvernance OBS/humain scientifique | OBS | OBS |
| contrat transversal MeasurementDefinition | OBS transversal | tous domaines de mesure | Project, CDM/Data futurs, analyses, DOC | gouvernance OBS pour contrat | OBS | OBS |
| MeasurementDefinition Imaging | Imaging sous contrat OBS | OBS, Knowledge, Core Lab, Project | Project, CDM/Data, Biostatistics, DOC | Imaging pour définition ; Project pour usage | Imaging | Imaging |
| MeasurementDefinition Laboratory | Laboratory sous contrat OBS | OBS, Knowledge, biobanque, Project | Project, CDM/Data, Biostatistics, DOC | Laboratory pour définition ; Project pour usage | Laboratory | Laboratory |
| MeasurementDefinition Clinical Assessment | Clinical Assessment sous contrat OBS | OBS, Knowledge, experts, Project | Project, Data, Biostatistics, DOC | domaine clinique pour définition ; Project pour usage | Clinical Assessment | Clinical Assessment |
| MeasurementDefinition Questionnaire | Questionnaire/Clinical Assessment | OBS, Knowledge, linguistique/culture selon mandat | Project, Data, Biostatistics, DOC | domaine instrument pour définition ; Project pour usage | owner de l’instrument | owner de l’instrument |
| MeasurementDefinition Device/Wearable | Device domain sous contrat OBS | OBS, Knowledge, spécialistes dispositifs | Project, Data, Biostatistics, DOC | Device domain pour définition ; Project pour usage | Device domain | Device domain |
| MeasurementDefinition Derived | domaine de mesure compétent + OBS | Knowledge, Imaging/Lab/Clinical/Device, Data | Project, Analysis, CDM/Data | owner de la méthode ; Project pour usage | owner de la méthode | owner de la méthode |
| Measurement Principle | owner de la MeasurementDefinition | Knowledge, domaine | OBS, Project | owner de méthode | owner de méthode | inclus dans version de méthode |
| Measurement Procedure générique | domaine spécialisé | OBS, Knowledge, QA/Core Lab | Project, systèmes d’exécution | owner spécialisé ; Project pour adoption | domaine spécialisé | domaine spécialisé |
| Acquisition plan/acte | domaine d’acquisition ; Project pour le plan adopté | OBS, Operations, Data, Safety selon portée | Project, Data, analyses | humain Project | domaine/Project selon objet | domaine/Project |
| Reading Procedure | domaine de lecture/Core Lab | OBS, Knowledge, QA | Project, Data, analyses | owner domaine ; Project pour adoption | domaine lecture | domaine lecture |
| qualité attendue de mesure | OBS + domaine | Knowledge, Project, Data, Biostatistics | Project, systèmes, CDM/Data | owner de méthode ; Project pour acceptation | OBS/domaine | OBS/domaine |
| qualité d’acquisition attendue | domaine d’acquisition | OBS, Project, QA | système source, Project, Data | domaine + Project | domaine | domaine |
| qualité de lecture attendue | domaine lecture/Core Lab | OBS, Project, QA | Project, Data, analyses | domaine + Project | domaine | domaine |
| qualité réelle d’une occurrence | système source puis CDM/Data | domaines, sites | analyses, Project, VAL | owner Data/correction humaine autorisée | Data/système source | Data/CDM |
| qualification de performance | OBS/domaine ; preuve chez Knowledge | Knowledge, experts | Project, analyses, DOC | gouvernance OBS/domaine | OBS/domaine avec correction Knowledge référencée | OBS/domaine |
| qualification de condition/confounder | OBS/domaine ; assertion chez Knowledge | Knowledge, Project, sites | Project, Data, analyses | owner selon portée | owner de l’objet qualifié | owner de l’objet qualifié |
| qualification de comparabilité | OBS + domains concernés | Knowledge, domaines, Data, Biostatistics | Project, CDM/Data, analyses | gouvernance scientifique/humain | OBS + domaines | OBS + domaines |
| Règle d’harmonisation | domaine spécialisé + Project pour adoption | OBS, Knowledge, Data, Biostatistics, sites | Project, Data, analyses, Core Lab | humain Project/domaine | domaine spécialisé | domaine spécialisé |
| dépendance/compatibilité équipement | domaine Device/équipement ou méthode | OBS, Knowledge, sites | Project, Operations, Data | Project pour usage local | domaine/site selon donnée | owner de la qualification |
| BiomarkerRole général | gouvernance scientifique du rôle avec OBS | Knowledge, Models, domaines, Biostatistics | Project, analyses, DOC | gouvernance du rôle/humain | gouvernance du rôle | gouvernance du rôle |
| BiomarkerRole adopté au projet | ResearchProject | OBS, Knowledge, domaines, Biostatistics | Project, analyses, DOC | humain Project mandaté | ResearchProject, avec Contribution amont si défaut général | ResearchProject |
| DataNeed | ResearchProject / Study Design | Models, OBS, domaines, Data, Biostatistics | Variables, acquisitions, sources, analyses | humain Project | ResearchProject | ResearchProject |
| CanonicalVariable | ResearchProject | OBS, domaines, Data, Biostatistics | CDM/Data, TMP, DOC, analyses | humain Project | ResearchProject | ResearchProject |
| VariableOccurrence | système source pour production ; futur CDM/Data pour représentation | sites, domaines, dérivations autorisées | analyses, Project, DOC autorisé | correction Data/humaine selon mandat | système source/CDM/Data | CDM/Data |
| AnalysisSpecification | Biostatistics ou domaine analytique compétent | Project, OBS, Data, domaines | executions, DOC, VAL | humain Project pour adoption | owner Analysis | owner Analysis |
| AnalysisResult | owner de l’analyse | AnalysisExecution, Data | Project, humain, DOC, VAL | Project pour usage interprétatif | owner Analysis | owner Analysis |
| ScientificInterpretation | ResearchProject/humain mandaté | Knowledge, Models, OBS, domaines, résultats | DOC, décisions, VAL | humain mandaté | ResearchProject | ResearchProject |
| Requirement | REG | sources réglementaires, Project | Project, TMP, DOC | owner REG/humain selon qualification | REG | REG |
| Pattern documentaire | DOC-002 | corpus documentaire, experts | TMP, DOC | DOC-002 pour pattern ; humain pour usage | DOC-002 | DOC-002 |
| structure Template | TMP | Project, REG, DOC-002 | DOC | humain TMP pour options ; sources restent owners | TMP | TMP |
| Projection documentaire | DOC | tous owners sources via références | utilisateurs, VAL | humain pour diffusion/publication | owner du fond via Contribution ; DOC pour forme | DOC |
| diagnostic de fidélité | VAL | owners des frontières | owners, gouvernance évaluation | humain/PD-011 pour disposition | owner source, jamais VAL directement | VAL pour règle diagnostique |

## 4. Matrice des domaines obligatoires

Légende : **O** owner ; **S** owner spécialisé ; **C** contributeur ; **R** consumer ; **D** décideur engageant ; **V** diagnostic read-only ; **—** aucun droit implicite.

| Domaine | Knowledge | Models | OBS | ResearchProject | Imaging | Laboratory | Clinical | Device | Data Mgmt | Biostatistics | REG | TMP | DOC | VAL | Humain |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Knowledge assertions/evidence | O | R | R | R | R | R | R | R | R | R | R | R | R | V | D |
| ScientificModel général | C | O | R | R | C | C | C | C | R | R | R | R | R | V | D |
| ObservableProperty | C | C | O | R | C | C | C | C | R | R | R | R | R | V | D |
| MD transversal | R | C | O | R | C | C | C | C | C | C | R | R | R | V | D |
| MD Imaging | R | C | O | R | S | R | R | R | C | C | R | R | R | V | D |
| MD Laboratory | R | C | O | R | R | S | R | R | C | C | R | R | R | V | D |
| MD Clinical/Questionnaire | R | C | O | R | R | R | S | R | C | C | R | R | R | V | D |
| MD Device/Wearable | R | C | O | R | R | R | R | S | C | C | R | R | R | V | D |
| BiomarkerRole général | C | C | O | R | C | C | C | C | R | C | R | R | R | V | D |
| BiomarkerRole Project | R | C | C | O | C | C | C | C | R | C | R | R | R | V | D |
| DataNeed / CanonicalVariable | R | C | C | O | C | C | C | C | C | C | R | R | R | V | D |
| Occurrence et qualité réelle | — | — | R | R | C | C | C | C | O | R | R | R | R autorisé | V | D correction |
| AnalysisSpecification | R | C | C | O adoption | S image | S domaine | S domaine | S domaine | C | O statistique | R | R | R | V | D |
| Projection | R | R | R | R | R | R | R | R | R | R | R | C | O | V | D diffusion |

## 5. Handoffs et non-transfert

| Handoff | Source owner | Target owner | Décision du target | Reste chez la source |
|---|---|---|---|---|
| Knowledge → OBS | Knowledge | OBS | qualifier l’usage et les mappings | concepts, assertions, preuves, force |
| Model → OBS | Models | OBS | qualifier observabilité/méthodes | structure explicative et alternatives |
| domaine → OBS | domaine spécialisé | OBS | vérifier contrat transversal | savoir et version spécialisés |
| OBS → Project | OBS | ResearchProject | adopter/rejeter/contextualiser | définitions générales et qualifications |
| Project → domaine | ResearchProject | domaine spécialisé | proposer faisabilité/opérationnalisation | besoin, choix final et décisions |
| Project → CDM/Data | ResearchProject | CDM/Data futur | représenter et contrôler | sens des besoins/variables |
| CDM/Data → Analysis | CDM/Data | owner Analysis | sélectionner des entrées selon spécification | occurrences, qualité et lignage |
| toute frontière → VAL | owner source | VAL | diagnostiquer seulement | droit de correction et version |

## 6. Conflits d’ownership

Un conflit existe si deux domaines revendiquent le même acte de création, correction ou décision sur la même identité/version. Il n’existe pas lorsqu’OBS possède le contrat commun et un domaine la spécialisation.

La résolution suit : identifier objet/version/acte ; consulter PD-003 ; déterminer owner sémantique et owner spécialisé ; préserver les contributions ; demander une décision humaine si le conflit porte sur une adoption ; ouvrir `PD003_EVOLUTION_REQUIRED` si aucune représentation conforme n’est possible. Aucun conflit bloquant n’est identifié pour OBS-001 v1.0.

## 7. Limitations

- L’instance organisationnelle d’OBS et celle des Scientific Models restent à instituer.
- Data Management, Biostatistics et CDM sont des responsabilités normatives futures.
- Cette matrice n’accorde aucun accès aux données, mandat clinique ou qualification réglementaire.
- Aucune implémentation actuelle n’est déclarée conforme.
