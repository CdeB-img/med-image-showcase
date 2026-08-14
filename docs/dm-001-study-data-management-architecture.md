# DM-001 — Study Data Management Architecture

## Architecture normative de la capacité Data Management de NOXIA

| Champ | Valeur |
|---|---|
| Identifiant | DM-001 |
| Version | 1.0 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT` avec limitations explicites |
| Niveau | `NIVEAU_1 — référence normative spécialisée` |
| Date d’effet documentaire | 15 août 2026 |
| Source maîtresse | `docs/dm-001-study-data-management-architecture.md` |
| Autorités supérieures | Charte fondatrice → Scientific Product Manifesto V2 → PD-003 V2 → OBS-001 → CDM-001 |
| Nature | architecture métier conceptuelle et opérationnelle ; ni stockage, ni moteur, ni implémentation |

## 1. Décision

DM-001 est admis comme référence normative spécialisée de la **Data Management Capability** de NOXIA.

Il gouverne les processus qui permettent de spécifier la collecte, recevoir ou saisir des données, créer ou qualifier leurs occurrences canoniques, appliquer des contrôles, ouvrir et résoudre des queries, tracer des corrections et réconciliations, exécuter des transformations opérationnelles, constituer des snapshots, geler, verrouiller, déverrouiller et libérer des jeux de données, sans changer silencieusement leur signification scientifique.

Décision : `DM001_STUDY_DATA_MANAGEMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`.

Aucun nouvel objet racine PD-003 n’est requis. Les artefacts DM-001 sont des artefacts opérationnels subordonnés, des définitions, des traces d’exécution, des findings, des enveloppes de décision, des projections ou des événements d’audit. CDM-001 reste inchangé et demeure l’autorité sur la représentation canonique des Study Data.

## 2. Autorités et plans de vérité

Le SOURCE-OF-TRUTH-INDEX a routé la consultation. Les autorités ont été lues dans l’ordre prescrit : Charte fondatrice ; Scientific Product Manifesto V2 ; manifeste externe de l’Editorial Engine ; PD-003 V2 et ses compagnons ; OBS-001 et ses compagnons ; CDM-001 et ses dix compagnons ; RDE-001 ; RDE-002 ; PRJ-001 ; REG-001 ; TMP-001 ; DOC-001 ; DOC-001B ; DOC-002 ; VAL-000. Les rapports DOC-000B-R1 et DOC-000D ainsi que leurs inventaires de patterns ont été consultés comme sources locales ou historiques non normatives.

| Plan | Autorité ou preuve | Usage DM-001 | Promotion interdite |
|---|---|---|---|
| Principes établis | Charte, Manifeste V2 | science avant opération, décisions humaines, limites visibles, reconstructibilité | pratique → principe |
| Références normatives | PD-003 V2, OBS-001, CDM-001 | objets, mesure, représentation canonique et ownership | sous-contrat DM → nouvelle racine scientifique |
| Corpus et patterns | DOC-000B-R1, DOC-000D, DOC-002, REG-000 | pratiques candidates contextualisées | historique/local → règle actuelle générale |
| Cible | DM-001 | responsabilité Data Management conceptuelle | cible → capacité implémentée |
| État réellement implémenté | rapports PRJ/REG/TMP/DOC/VAL et dépôt courant | constate les interfaces et absences | rapport technique → norme ou PASS |
| Hypothèses | futurs runtimes DM et Biostatistics | dépendances explicites | hypothèse → fonctionnalité |

## 3. Mission et non-mission

DM-001 répond à la question : comment les données prévues par le Research Project et représentées par CDM-001 sont-elles collectées, reçues, enregistrées, qualifiées, contrôlées, corrigées, réconciliées, transformées, versionnées, gelées, verrouillées, libérées et tracées sans modifier leur sens scientifique ?

La Data Management Capability gouverne les opérations et le cycle de vie des données réalisées. Elle n’est ni un second Research Project, ni un second CDM, ni un moteur de définition scientifique, d’observabilité ou de statistique, ni un EDC universel, ni une base de données imposée, ni une source parallèle de vérité.

Le terme **Data Management Capability** est normatif. Un runtime futur pourra l’implémenter ; la présente architecture ne dépend d’aucun framework, langage, provider, EDC, stockage, format, fournisseur ou standard externe.

## 4. Frontière centrale d’ownership

| Plan | Owner | Possède | DM peut faire | DM ne peut pas faire |
|---|---|---|---|---|
| Projet | Research Project | DataNeeds, CanonicalVariables, ExpectedVariableOccasions, sources et méthodes prévues, objectifs, endpoints, décisions adoptées | consommer les références/version et signaler un écart | adopter ou redéfinir un besoin, une variable, un objectif, un endpoint ou une décision |
| Mesure | OBS et domaines spécialisés | ObservableProperties, MeasurementDefinitions, qualifications, conditions et limites de mesure | appliquer les critères fournis et enregistrer les résultats réels | inventer une qualité domaine ou modifier une MeasurementDefinition/BiomarkerRole |
| Représentation Study Data | CDM-001 | identités référencées, VariableOccurrences, valeurs/statuts, sources/méthodes/temps réels, qualité, missingness, provenance, dérivations, lignage, projections de datasets | créer ou qualifier des occurrences selon mandat et produire des traces conformes | dupliquer l’identité ou créer une vérité concurrente |
| Opérations | Data Management | collecte, spécifications, ingestion, contrôles, findings, queries, corrections, réconciliations, transformations opérationnelles, snapshots, freezes, locks, releases, audit opérationnel | modifier l’état opérationnel et la représentation avec historique | changer silencieusement le sens scientifique |
| Analyse | future Biostatistics | estimands, AnalysisSpecifications, populations, modèles, stratégie du missingness, sensibilités, dimensionnement, interprétation statistique bornée | recevoir un release et tracer les handoffs | imputer, choisir un modèle ou un estimand pour Biostatistics |

Une modification opérationnelle licite conserve l’avant, l’après, l’acteur ou runtime, le mandat, la raison, la date, les preuves, les impacts et les parents de lignage. Toute modification de sens revient sous forme de Contribution à l’owner scientifique ; elle n’est jamais appliquée silencieusement par DM.

## 5. Vocabulaire architectural

| Terme | Définition bornée |
|---|---|
| Planned data | donnée attendue par une décision Project : DataNeed, CanonicalVariable, occasion, source ou méthode prévue |
| Realized data | réalisation, tentative, absence qualifiée, invalidité, non-applicabilité ou dérivation représentée par CDM |
| Source data | information telle qu’elle existe dans une source identifiée avant transformation DM |
| Captured data | information reçue ou saisie avec contexte, acteur, temps et trace de capture |
| Canonical occurrence | VariableOccurrence CDM reliée à une version de CanonicalVariable et à son contexte réel |
| Operational metadata | données de processus nécessaires à la collecte, l’ingestion, le contrôle, la correction, le gel, le lock ou la release ; elles ne changent pas le sens scientifique |
| Data quality finding | observation tracée d’un écart à une règle ou attente, sans correction implicite |
| Data query | question opérationnelle adressée à un owner pour résoudre ou qualifier un finding ; elle ne modifie aucune donnée seule |
| Correction | changement tracé d’une valeur ou d’un état, conservant la version antérieure et son motif |
| Reconciliation | comparaison gouvernée de sources ou représentations et décision tracée sur leurs différences |
| Transformation | application versionnée d’une définition à des entrées identifiées pour produire des sorties reliées à leurs parents |
| Snapshot | vue immuable et digérée d’un périmètre à un instant logique |
| Freeze | restriction opérationnelle préparatoire, partielle ou temporaire sur un périmètre |
| Lock | décision et état gouvernés empêchant les modifications ordinaires dans un périmètre |
| Unlock | réouverture explicite avec acteur, mandat, raison, impact et nouvelle version |
| Release | projection ou paquet versionné autorisé pour un usage défini |
| Audit event | événement immuable attendu décrivant ce qui a affecté l’état d’un artefact |
| Provenance | d’où vient l’information |
| Lineage | comment elle a été transformée et reliée à ses parents |

## 6. Classification des artefacts opérationnels

| Artefact | Classification PD-003 compatible | Responsabilité et contenu minimal | Pourquoi ce n’est pas une racine scientifique |
|---|---|---|---|
| DataManagementDefinition | `DEFINITION` + `OPERATIONAL_ARTEFACT` | identité, version, statut, périmètre, responsabilités, sources, règles, procédures, dépendances, approbations | décrit un processus, pas un construit scientifique |
| DataCollectionSpecification | `DEFINITION` + `PROJECTION` | instruments, champs, références CanonicalVariable/occasion, source prévue, contrôles, conditions, instructions, ownership | projette le Project/CDM ; ne possède pas les variables |
| DataIngestionRecord | `EXECUTION_RECORD` | lot, source/version, temps, acteur/runtime, méthode, fichier/flux, résultat, erreurs, brut préservé, digest, occurrences affectées | trace une opération réalisée |
| DataQualityFinding | `FINDING` | cible, règle, observation, sévérité, statut, preuve, owner, impact, absence de correction implicite | observe un écart sans créer de vérité |
| DataQuery | `DECISION_ENVELOPE` + `OPERATIONAL_ARTEFACT` | question, cible, source, justification, statut, réponse, acteurs, dates, résolution, fermeture/réouverture | organise une résolution humaine, sans décision scientifique autonome |
| DataCorrectionRecord | `EXECUTION_RECORD` + `AUDIT_RECORD` | avant, après, raison, source, acteur, mandat, date, impact, supersession, historique | conserve une mutation autorisée d’une occurrence existante |
| ReconciliationRecord | `DECISION_ENVELOPE` + `AUDIT_RECORD` | sources comparées, différences, décision, justification, owner, résultat, non-résolus | trace un arbitrage entre sources sans les fusionner silencieusement |
| TransformationDefinition | `DEFINITION` | entrées, sorties, version, règles, conditions, paramètres, owner, lien CDM | réutilise règle/méthode/AnalysisSpecification selon le sens ; aucune racine générique Transformation |
| TransformationExecution | `EXECUTION_RECORD` | définition/version, parents, résultats, environnement, date, acteur/runtime, statut, logs, erreurs, provenance, lignage | réalisation rattachée aux occurrences ou à AnalysisExecution |
| DataSnapshot | `PROJECTION` | périmètre, version, références, date, sélection, état qualité, digest, parent | vue matérialisée, jamais seconde vérité |
| DataFreeze | `DECISION_ENVELOPE` + `AUDIT_RECORD` | périmètre/type, acteur, mandat, préconditions, date, statut, exclusions, findings ouverts | restriction de processus, non construit scientifique |
| DataLock | `DECISION_ENVELOPE` + `AUDIT_RECORD` | mêmes garanties que Freeze, avec interdiction de mutation ordinaire et contrat d’unlock | état gouverné, non irréversibilité technique présumée |
| DatasetRelease | `PROJECTION` + `DECISION_ENVELOPE` | snapshot, version, usage, population/périmètre, variables, occurrences, limites, provenance, destinataires, statut | paquet d’usage dérivé des occurrences canoniques |
| AuditEvent | `AUDIT_RECORD` | événement, objet, acteur, mandat, avant/après, date, justification, références, immutabilité attendue | preuve de changement, jamais owner du contenu |

Cette classification est suffisante au regard de PD-003 V2. Si un futur besoin exige une identité autonome, un cycle de vie indépendant, des relations propres et une décision propre impossibles à représenter par ces catégories, il déclenche un arbitrage PD-003 avant création.

## 7. Cycle de vie conceptuel

Le corridor de référence est :

`définitions Project/CDM → spécification de collecte → préparation des sources → capture ou ingestion → création/qualification de VariableOccurrences → contrôles et qualité → queries → corrections/réconciliations → nettoyage → snapshot → freeze → lock → release → handoff analyse → éventuel unlock/correction/nouvelle release`.

Il s’agit d’un graphe de responsabilités, pas d’une séquence universelle. Une étude prospective peut capturer progressivement ; une étude rétrospective ou de soins courants peut ingérer tardivement ; l’imagerie et le laboratoire peuvent produire des sources et dérivations spécialisées ; un registre peut recevoir des imports successifs ; un essai multicentrique peut geler par site ; des données externes ou de dispositif peuvent rester partielles. Chaque branche conserve ses sources, versions, décisions et restrictions.

## 8. Projections de collecte

- **eCRF** : projection de collecte du Research Project, de CDM et de Data Management. Un champ référence une CanonicalVariable et, si applicable, une ExpectedVariableOccasion ; il ne crée ni l’une ni l’autre.
- **Data Dictionary** : projection structurée des CanonicalVariables, champs, domaines, unités, sources, règles et métadonnées opérationnelles. Une colonne ou un libellé n’est jamais l’identité de Variable.
- **Schedule of Activities** : projection des ExpectedVariableOccasions, visites, événements et activités attendues. Il décrit le plan, pas les réalisations.

Ces projections ne possèdent ni vérité Project, ni occurrence réalisée, ni stratégie statistique. Toute projection conserve l’identité et la version canoniques, son owner de contenu, sa source, sa configuration et ses limites.

## 9. Collecte, ingestion et sources

DM distingue source prévue, source réelle, source primaire, source dérivée, système producteur, fichier ou flux reçu, extraction, import, saisie manuelle, correction manuelle et réconciliation. Une source est identifiée et versionnée avec contexte, temps, acteur/runtime, environnement, contrôles d’intégrité, préservation du brut et digest lorsque pertinent.

Chaque ingestion applique une politique d’idempotence explicite. Un lot déjà réussi n’est pas recréé ; un rejeu est reconnu par identité/digest et produit une trace. Les doublons potentiels restent findings jusqu’à résolution. Les conflits de versions, imports partiels et données tardives sont visibles ; aucun import ne remplace implicitement son prédécesseur.

Une source réelle différente du plan est enregistrée comme réalité. Elle peut produire un finding et une demande de décision, mais ne réécrit pas automatiquement le Project ni la MeasurementDefinition prévue.

## 10. Contrôles, qualité et queries

| Couche | Owner du sens | Rôle DM |
|---|---|---|
| Validation structurelle | contrat CDM/collection | vérifier type, format, domaine, unité, présence, cardinalité et cohérence référentielle |
| Validation contextuelle | Project/CDM/domaines | vérifier temps, visite, population, source, méthode, centre et applicabilité sans réinterpréter le projet |
| Qualité scientifique ou domaine | OBS, Imaging, laboratoire, Core Lab ou autre owner | appliquer et transporter critères/résultats/version/limites ; ne rien inventer |
| Utilisabilité analytique | Biostatistics et décisions humaines applicables | préparer, documenter et transmettre ; ne pas décider seul l’inclusion analytique |

Un finding n’est ni une correction ni une conclusion scientifique. Une query n’est pas une correction. Une réponse à une query est une source de résolution à évaluer selon mandat. Une correction licite conserve avant/après, auteur, mandat, raison, date, preuve, impact et supersession ; un historique n’est jamais écrasé.

## 11. Missingness factuel

DM réutilise les axes et raisons admis par CDM-001, notamment `NOT_COLLECTED`, `NOT_AVAILABLE`, `NOT_APPLICABLE`, `NOT_EVALUABLE`, `INVALID`, `LOST`, `WITHDRAWN`, `SOURCE_MISSING`, `TECHNICAL_FAILURE` et `UNKNOWN_REASON`, dans leur contexte exact. Il n’introduit pas de catalogue incompatible.

Le missingness décrit un fait et sa raison. DM le détecte, qualifie, documente, peut ouvrir une query et corriger si une nouvelle source valide existe. La future Biostatistics décide exclusion, imputation, modèle, sensibilité et population d’analyse. DM ne remplace jamais une valeur absente par une estimation statistique.

## 12. Transformations, dérivations et analyses

DM distingue normalisation, conversion d’unité, harmonisation, recodage, mapping terminologique, agrégation, dérivation, pseudonymisation/anonymisation, calcul analytique et correction. Chaque exécution référence une définition/version, ses entrées, sorties, paramètres, acteur/runtime, environnement, date, statut, erreurs, provenance et parents de lignage.

Une transformation opérationnelle peut changer une représentation, jamais la signification scientifique. Elle ne transforme pas silencieusement un observable en un autre, ne crée ni endpoint, MeasurementDefinition, BiomarkerRole, estimand ou AnalysisSpecification. Une dérivation opérationnelle explicitement définie reste reliée à ses parents ; un calcul analytique appartient à l’exécution de l’AnalysisSpecification du domaine analytique compétent.

## 13. Snapshot, freeze, lock, unlock et release

- **Snapshot** : vue versionnée et digérée d’un état de données.
- **Freeze** : restriction opérationnelle préparatoire ou partielle. Il peut être soft, partiel, par variable, site, unité étudiée ou autre périmètre justifié.
- **Lock** : décision, contrat et état empêchant les modifications ordinaires. DM ne présume aucune irréversibilité technique.
- **Unlock** : réouverture explicite avec acteur, mandat, raison, impact, findings concernés et nouvelle version.
- **Release** : projection ou paquet versionné autorisé pour un usage, une population, un périmètre et des destinataires définis.

Une correction post-lock crée une trace, une version successeure et, si nécessaire, une nouvelle release. Elle ne modifie jamais silencieusement une ancienne release, qui reste reconstructible avec son snapshot, ses règles, limites et décisions.

## 14. Provenance, lignage et audit trail

La provenance décrit l’origine ; le lignage décrit les transformations et parents ; l’audit trail décrit les événements, actions et décisions qui ont affecté l’état. Ces plans restent distincts et reliés.

Chaque occurrence, transformation, correction, snapshot, freeze, lock, unlock et release est reconstructible selon son contrat. Un texte libre seul ne suffit pas au lignage. Les références distinguent document source, système source, valeur source, transformation, décision, analyse et projection.

## 15. Handoffs

| Handoff | Contenu transmis | Interdiction |
|---|---|---|
| Project → DM | définitions adoptées, variables, occasions, sources prévues, règles, décisions, readiness | DM n’adopte pas le fond scientifique |
| OBS/domaines → DM | méthodes, résultats, critères/résultats de qualité, sources réelles, versions, limitations | DM n’invente pas la qualité domaine |
| DM → CDM | occurrences réalisées, statuts, sources, corrections, transformations, provenance, lignage | aucune identité concurrente |
| DM → Biostatistics | snapshots/releases, variables, occurrences, qualité, missingness factuel, exclusions documentées, transformations, limites | aucune stratégie analytique implicite |
| Biostatistics → DM/CDM | références d’exécution, dérivations analytiques admises, résultats, provenance | aucun écrasement d’occurrence source |
| DM → TMP/DOC | Data Management Plan, eCRF, Data Dictionary, plans de validation/query/réconciliation, rapports freeze/lock, spécifications de transfert | projection ≠ vérité |
| DM → VAL | artefacts source/cible, traces, versions, findings, décisions, checkpoints | diagnostic ≠ correction automatique |

## 16. Apports du corpus documentaire

| Apport observé | Source | Classification DM-001 | Usage autorisé | Limite |
|---|---|---|---|---|
| cycle usage prévu → exigences → risques → tests → anomalies → release/changement | DOC-000B-R1 validation SI | `QUALITY_PATTERN` | inspirer traçabilité, tests et décisions humaines | aucune validation réelle ni règle actuelle démontrée |
| tables variable/source/unité/règle, CRF et Data Management Plan | DOC-002 / inventaire DOC-000B | `OPERATIONAL_PATTERN` | vérifier la couverture des projections | valeurs et fréquences historiques non généralisables |
| edit checks, query, correction, clôture | DOC-002 et corpus Data Management | `METHODOLOGICAL_PRACTICE` | séparer finding, query, réponse et correction | aucune procédure locale automatiquement normative |
| coding et mapping | DOC-002 / REG-000 | `METHODOLOGICAL_PRACTICE` | exiger version, source, contexte et trace | aucun standard déclaré implémenté |
| rapprochement attendu/reçu, QC, feedback/action/clôture | DOC-000D Core Lab | `OPERATIONAL_PATTERN` | réconciliation et qualité domaine transportée | pratique Core Lab locale/historique |
| structures de lock, audit, transfert et archivage | comparaison FDA/Core Lab | `REGULATORY_REQUIREMENT_CANDIDATE` | identifier les domaines à vérifier | référence externe non contraignante, actualité à vérifier |
| jalons, readiness, déviations et clôture | DOC-000B-R1 suivi d’étude | `LOCAL_PRACTICE` | illustrer coordination et audit | historique sensible, non universel |
| formulaires et workflows institutionnels | CIC/Core Lab/industriel | `INSTITUTIONAL_RULE` | conserver l’owner et le contexte | aucune transposition générale |
| données de qualité définies par domaine | OBS et patterns Core Lab | `SCIENTIFIC_REQUIREMENT` | préserver critères, résultats, méthodes et limites | DM n’en devient pas owner |
| versions multiples sans succession prouvée | DOC-000D | `HISTORICAL_REFERENCE` | imposer version/supersession/justification | aucun statut courant déduit du nom de fichier |

Ces apports démontrent la réalité des responsabilités à couvrir ; ils ne créent aucune obligation réglementaire actuelle, aucune pratique générale et aucune approbation.

## 17. Cas conceptuels A–O

Tous les cas sont abstraits, sans donnée patient, identifiant individuel ni valeur clinique réelle.

### A — Champ eCRF lié à une CanonicalVariable

- **Objets Project/CDM/OBS concernés :** DataNeed, CanonicalVariable, ExpectedVariableOccasion, DataCollectionSpecification, éventuelle MeasurementDefinition.
- **Source prévue et réelle :** saisie eCRF prévue ; source réelle enregistrée lors de la saisie.
- **Occurrence :** aucune occurrence n’existe tant qu’aucune réalisation n’est enregistrée ; le champ conserve la référence canonique.
- **Statut de valeur :** renseigné uniquement à la capture.
- **Missingness :** qualifié si la collecte attendue n’aboutit pas.
- **Qualité :** contrôles structurels DM ; critères de mesure référencés depuis l’owner.
- **Query :** possible sur incohérence ; sans effet direct sur la valeur.
- **Correction :** seulement après source et mandat, avec avant/après.
- **Transformation :** mapping champ → occurrence, sans création de Variable.
- **Provenance :** instrument, version, acteur et temps.
- **Lineage :** champ capturé → occurrence canonique.
- **Owner :** Project pour la Variable ; DM pour la spécification et la capture ; CDM pour la représentation.
- **Décision humaine :** adoption du champ et résolution de toute ambiguïté.
- **Objets interdits :** nouvelle CanonicalVariable créée par le champ.
- **Projections concernées :** eCRF, Data Dictionary, SoA, release futur.

### B — Même Variable à plusieurs visites

- **Objets Project/CDM/OBS concernés :** une CanonicalVariable, plusieurs ExpectedVariableOccasions, plusieurs VariableOccurrences, même définition de mesure ou versions explicitement distinctes.
- **Source prévue et réelle :** source prévue par visite ; source réelle enregistrée par occurrence.
- **Occurrence :** une occurrence distincte par unité et contexte temporel.
- **Statut de valeur :** indépendant à chaque visite.
- **Missingness :** indépendant par occasion, jamais porté par la Variable entière.
- **Qualité :** résultat propre à chaque occurrence.
- **Query :** ciblée sur l’occurrence concernée.
- **Correction :** versionne uniquement l’occurrence corrigée.
- **Transformation :** aucune agrégation implicite entre visites.
- **Provenance :** séparée par source et temps.
- **Lineage :** toutes les occurrences réalisent la même version de Variable sans fusion.
- **Owner :** Project/OBS conservent définitions ; DM opère ; CDM représente.
- **Décision humaine :** arbitrage si la méthode réelle diffère.
- **Objets interdits :** une nouvelle Variable par visite sans décision Project.
- **Projections concernées :** SoA, eCRF, dataset longitudinal.

### C — Donnée attendue non collectée

- **Objets Project/CDM/OBS concernés :** ExpectedVariableOccasion et occurrence d’absence qualifiée selon CDM.
- **Source prévue et réelle :** source prévue connue ; aucune source réelle disponible.
- **Occurrence :** tentative/absence représentée si le contrat CDM le requiert.
- **Statut de valeur :** aucune valeur exploitable.
- **Missingness :** `NOT_COLLECTED` ou raison CDM plus précise, jamais `null` non qualifié.
- **Qualité :** non évaluable ; ne devient pas valide.
- **Query :** ouverte si une source peut encore être fournie.
- **Correction :** possible seulement si une source nouvelle est reçue.
- **Transformation :** aucune estimation de remplacement.
- **Provenance :** attente Project, constat DM et éventuelle réponse.
- **Lineage :** attente → constat d’absence → éventuelle occurrence successeure.
- **Owner :** DM qualifie le fait ; Biostatistics décidera du traitement analytique.
- **Décision humaine :** clôture de query et acceptation de la raison.
- **Objets interdits :** valeur imputée par DM.
- **Projections concernées :** missingness report, snapshot, release avec limitation.

### D — Donnée collectée mais invalide

- **Objets Project/CDM/OBS concernés :** VariableOccurrence, règle de contrôle, critères de qualité référencés.
- **Source prévue et réelle :** source réelle conservée même si invalide.
- **Occurrence :** réalisée avec statut d’invalidité.
- **Statut de valeur :** valeur présente mais non utilisable selon son statut.
- **Missingness :** raison `INVALID` distincte de l’absence de capture.
- **Qualité :** finding documenté ; critère scientifique appartient au domaine.
- **Query :** possible pour confirmation ou nouvelle source.
- **Correction :** ne remplace l’ancienne version qu’avec preuve et supersession.
- **Transformation :** aucune transformation ne rend automatiquement la mesure valide.
- **Provenance :** brut, contrôle, finding et décision.
- **Lineage :** source → occurrence invalide → éventuelle version corrigée.
- **Owner :** domaine pour la règle scientifique ; DM pour le workflow du finding.
- **Décision humaine :** disposition si la règle l’exige.
- **Objets interdits :** validation automatique inventée.
- **Projections concernées :** quality report, query log, release limité.

### E — Donnée non applicable

- **Objets Project/CDM/OBS concernés :** condition d’applicabilité, occasion attendue, occurrence/qualification CDM.
- **Source prévue et réelle :** source prévue conditionnelle ; aucune source exigée si condition fausse.
- **Occurrence :** non-applicabilité qualifiée, sans fausse valeur.
- **Statut de valeur :** absent par non-applicabilité.
- **Missingness :** `NOT_APPLICABLE`, distinct de `NOT_COLLECTED`.
- **Qualité :** sans objet pour la valeur, condition évaluée et tracée.
- **Query :** uniquement si l’applicabilité est ambiguë.
- **Correction :** versionne l’évaluation d’applicabilité si une source la change.
- **Transformation :** aucune valeur par défaut.
- **Provenance :** règle, faits sources et décision.
- **Lineage :** condition → statut d’applicabilité.
- **Owner :** owner Project/domaine pour la condition ; DM pour son application opérationnelle.
- **Décision humaine :** requise si la condition n’est pas déterministe.
- **Objets interdits :** promotion en donnée manquante ordinaire ou valeur nulle.
- **Projections concernées :** eCRF conditionnel, SoA, snapshot.

### F — Correction après query

- **Objets Project/CDM/OBS concernés :** VariableOccurrence, DataQualityFinding, DataQuery, DataCorrectionRecord.
- **Source prévue et réelle :** source initiale et source de réponse toutes deux conservées.
- **Occurrence :** version antérieure supersédée, non supprimée.
- **Statut de valeur :** recalculé seulement selon le contrat applicable.
- **Missingness :** mis à jour si une valeur source devient disponible, avec histoire.
- **Qualité :** finding résolu ou maintenu séparément.
- **Query :** ouverte, répondue, résolue, fermée ou réouverte avec dates/acteurs.
- **Correction :** avant/après, raison, mandat, preuve et impact obligatoires.
- **Transformation :** correction distincte de toute normalisation.
- **Provenance :** query, réponse, documents sources et acteurs.
- **Lineage :** occurrence initiale → correction → occurrence successeure.
- **Owner :** DM orchestre ; owner de source/humain autorise selon mandat.
- **Décision humaine :** acceptation de la réponse et clôture si non déterministes.
- **Objets interdits :** réponse appliquée automatiquement comme vérité.
- **Projections concernées :** query log, audit trail, snapshots avant/après.

### G — Réconciliation entre deux sources

- **Objets Project/CDM/OBS concernés :** deux StudyDataSources, occurrences candidates, ReconciliationRecord.
- **Source prévue et réelle :** les deux sources et leurs versions restent distinctes.
- **Occurrence :** aucune fusion silencieuse ; résultat canonique selon décision tracée.
- **Statut de valeur :** conserve l’état de chaque entrée et du résultat.
- **Missingness :** qualifié séparément par source.
- **Qualité :** différences représentées comme findings.
- **Query :** possible auprès des owners compétents.
- **Correction :** seulement après décision et preuve.
- **Transformation :** règle de rapprochement versionnée, sans effacer les entrées.
- **Provenance :** deux origines et décision de réconciliation.
- **Lineage :** sources A/B → comparaison → résultat ou non-résolu.
- **Owner :** DM pour le rapprochement ; owner métier pour le sens.
- **Décision humaine :** requise si aucune règle déterministe autorisée ne tranche.
- **Objets interdits :** source déclarée vraie par priorité cachée.
- **Projections concernées :** reconciliation report, snapshot, release.

### H — Unité inattendue puis conversion tracée

- **Objets Project/CDM/OBS concernés :** VariableOccurrence, unité prévue/réelle, TransformationDefinition/Execution.
- **Source prévue et réelle :** source réelle et unité originale conservées.
- **Occurrence :** occurrence source puis représentation convertie liée.
- **Statut de valeur :** statut source inchangé ; sortie qualifiée séparément.
- **Missingness :** sans changement sauf échec de conversion explicitement qualifié.
- **Qualité :** finding sur unité inattendue ; applicabilité de conversion vérifiée.
- **Query :** si l’unité source est ambiguë.
- **Correction :** uniquement si la source avait une unité erronée ; distincte de la conversion.
- **Transformation :** conversion versionnée avec paramètres et erreurs.
- **Provenance :** valeur/unité source et règle de conversion.
- **Lineage :** occurrence source → conversion → occurrence/représentation résultante.
- **Owner :** OBS/domaine pour la sémantique d’unité ; DM pour l’exécution.
- **Décision humaine :** si équivalence ou contexte non démontré.
- **Objets interdits :** changement silencieux d’unité ou de propriété mesurée.
- **Projections concernées :** Data Dictionary, dataset harmonisé, audit.

### I — Donnée Imaging dérivée d’une segmentation

- **Objets Project/CDM/OBS concernés :** CanonicalVariable, MeasurementDefinition Imaging, occurrences sources, dérivation.
- **Source prévue et réelle :** images et segmentation réelles identifiées avec versions.
- **Occurrence :** résultat dérivé distinct des sources.
- **Statut de valeur :** reflète succès/échec de la dérivation.
- **Missingness :** `TECHNICAL_FAILURE` ou autre raison CDM si la dérivation échoue.
- **Qualité :** critères et résultat Imaging/Core Lab référencés, non inventés par DM.
- **Query :** peut cibler source, segmentation ou résultat.
- **Correction :** nouvelle segmentation produit une version dérivée successeure.
- **Transformation :** algorithme/définition/version/paramètres explicités.
- **Provenance :** acquisition, segmentation, outil/runtime et opérateur.
- **Lineage :** images → segmentation → mesure dérivée.
- **Owner :** Imaging/Core Lab pour le sens/méthode ; DM/CDM pour opération et représentation.
- **Décision humaine :** acceptation qualité selon mandat.
- **Objets interdits :** endpoint ou biomarqueur créé par la dérivation.
- **Projections concernées :** Core Lab report, dataset, release.

### J — Donnée laboratoire liée à un Biospecimen/aliquot

- **Objets Project/CDM/OBS concernés :** Biospecimen, aliquot/dérivé, MeasurementDefinition laboratoire, VariableOccurrence.
- **Source prévue et réelle :** prélèvement/aliquot et système producteur identifiés.
- **Occurrence :** liée au spécimen exact et au contexte temporel.
- **Statut de valeur :** résultat et statuts orthogonaux.
- **Missingness :** distingue absence de prélèvement, perte, échec technique et résultat indisponible.
- **Qualité :** critères laboratoire et chaîne de garde référencés.
- **Query :** sur identité, aliquot, temps ou résultat.
- **Correction :** conserve le résultat et lien antérieurs.
- **Transformation :** préparation/normalisation/derivation tracée si applicable.
- **Provenance :** spécimen, aliquot, méthode, lot et système.
- **Lineage :** collecte → dérivé/aliquot → mesure → occurrence.
- **Owner :** laboratoire pour la méthode ; CDM pour la représentation ; DM pour le workflow.
- **Décision humaine :** résolution d’une discordance d’identité ou chaîne de garde.
- **Objets interdits :** fusion de spécimens ou résultat inventé.
- **Projections concernées :** sample log, Data Dictionary, release.

### K — Donnée de soins courants importée tardivement

- **Objets Project/CDM/OBS concernés :** StudyDataSource externe/routine care, VariableOccurrence, ancrages temporels.
- **Source prévue et réelle :** source réelle peut différer ou arriver après le plan ; écart visible.
- **Occurrence :** créée à la date logique de l’observation, non à la seule date d’import.
- **Statut de valeur :** qualifié selon disponibilité et validité.
- **Missingness :** l’absence antérieure reste historique ; une nouvelle version devient disponible.
- **Qualité :** limitations de contexte et de méthode conservées.
- **Query :** possible sur identité, temps, source ou méthode.
- **Correction :** une arrivée tardive ne réécrit pas les snapshots/releases antérieurs.
- **Transformation :** extraction/mapping/import versionnés.
- **Provenance :** source de soins, extraction, fichier/flux et import.
- **Lineage :** source externe → extraction → import → occurrence.
- **Owner :** source externe reste owner de sa source ; Project décide l’usage ; DM ingère.
- **Décision humaine :** inclusion dans une nouvelle release si nécessaire.
- **Objets interdits :** présumer consentement, compatibilité ou source prévue.
- **Projections concernées :** late-data report, nouveau snapshot/release.

### L — Doublon ou import rejoué

- **Objets Project/CDM/OBS concernés :** DataIngestionRecord, sources, occurrences candidates.
- **Source prévue et réelle :** lot réel identifié par source/version/digest.
- **Occurrence :** aucune nouvelle occurrence si rejeu idempotent confirmé.
- **Statut de valeur :** inchangé tant qu’aucune différence valide n’existe.
- **Missingness :** inchangé.
- **Qualité :** finding de doublon ou conflit de version.
- **Query :** si l’identité ou la version ne permet pas de trancher.
- **Correction :** seulement pour une duplication effectivement admise comme erreur.
- **Transformation :** déduplication explicite, jamais suppression silencieuse.
- **Provenance :** toutes les tentatives d’import, y compris le rejeu.
- **Lineage :** lot → décision idempotente ou rapprochement → occurrence.
- **Owner :** DM pour l’idempotence ; owner métier si ambiguïté de sens.
- **Décision humaine :** requise pour conflit non déterministe.
- **Objets interdits :** second enregistrement présenté comme nouvelle mesure sans preuve.
- **Projections concernées :** ingestion log, duplicate report, audit.

### M — Soft freeze puis correction

- **Objets Project/CDM/OBS concernés :** DataSnapshot, DataFreeze, finding, correction.
- **Source prévue et réelle :** sources du snapshot conservées.
- **Occurrence :** correction produit une version successeure.
- **Statut de valeur :** avant/après conservés.
- **Missingness :** peut évoluer avec preuve, sans effacer l’état gelé.
- **Qualité :** finding ouvert explicitement dans le freeze ou déclenché ensuite.
- **Query :** workflow autorisé par la politique de soft freeze.
- **Correction :** mandatée et auditée.
- **Transformation :** recalculs dépendants exécutés sous versions nouvelles.
- **Provenance :** freeze, query, correction et sources.
- **Lineage :** snapshot gelé → correction → nouveau snapshot.
- **Owner :** DM opère ; acteur mandaté autorise.
- **Décision humaine :** maintien/levée du freeze et nouvelle disposition.
- **Objets interdits :** mutation du snapshot gelé.
- **Projections concernées :** freeze report, audit, nouveau snapshot.

### N — Lock puis unlock gouverné

- **Objets Project/CDM/OBS concernés :** DataLock, AuditEvent, DataCorrectionRecord, snapshots.
- **Source prévue et réelle :** toute nouvelle source après lock est enregistrée séparément.
- **Occurrence :** aucune mutation ordinaire sous lock ; correction après unlock seulement.
- **Statut de valeur :** versionné après réouverture.
- **Missingness :** modification seulement avec nouvelle preuve.
- **Qualité :** finding motivant l’unlock conservé.
- **Query :** peut justifier la demande d’unlock sans l’effectuer.
- **Correction :** après acteur, mandat, raison et impact enregistrés.
- **Transformation :** sorties dépendantes réexécutées si impactées.
- **Provenance :** décision de lock, demande/unlock, correction.
- **Lineage :** état locké → unlock → nouvelle branche/version.
- **Owner :** autorité humaine mandatée pour lock/unlock ; DM applique.
- **Décision humaine :** obligatoire pour unlock.
- **Objets interdits :** levée automatique ou effacement du lock historique.
- **Projections concernées :** lock/unlock report, audit, nouvelle release possible.

### O — Dataset release puis nouvelle version

- **Objets Project/CDM/OBS concernés :** DataSnapshot, DatasetRelease, occurrences, transformations et limitations.
- **Source prévue et réelle :** sources de chaque release figées par référence/version.
- **Occurrence :** ensemble référencé, pas copié comme nouvelle vérité.
- **Statut de valeur :** état au snapshot de chaque release.
- **Missingness :** distribution factuelle propre à la version.
- **Qualité :** findings/exclusions/limites explicités.
- **Query :** les queries post-release n’altèrent pas la release publiée.
- **Correction :** produit de nouvelles occurrences/versions.
- **Transformation :** définitions/exécutions propres à chaque release.
- **Provenance :** snapshot, décision d’usage, destinataires et versions.
- **Lineage :** occurrences → snapshot v1 → release v1 ; correction → snapshot v2 → release v2.
- **Owner :** DM pour le paquet ; Project/Biostatistics/humains pour l’usage selon leurs mandats.
- **Décision humaine :** autorisation de release et, si nécessaire, retrait/notification.
- **Objets interdits :** réécriture de v1 par v2.
- **Projections concernées :** release package, transfer specification, analysis handoff.

## 18. Contrats de non-régression

| ID | Contrat permanent |
|---|---|
| DM-C01 | Data Management ne crée pas une CanonicalVariable. |
| DM-C02 | Un champ eCRF n’est pas propriétaire de l’identité de Variable. |
| DM-C03 | Une colonne dataset n’est pas propriétaire de l’identité de Variable. |
| DM-C04 | Une correction conserve l’état antérieur. |
| DM-C05 | Aucune correction silencieuse. |
| DM-C06 | Une query ne modifie aucune donnée à elle seule. |
| DM-C07 | Le missingness factuel reste distinct du traitement statistique. |
| DM-C08 | Une valeur absente n’est jamais imputée par Data Management. |
| DM-C09 | La source prévue reste distincte de la source réelle. |
| DM-C10 | La méthode prévue reste distincte de la méthode réelle. |
| DM-C11 | Toute transformation conserve ses parents de lignage. |
| DM-C12 | Une conversion d’unité est versionnée et traçable. |
| DM-C13 | Une dérivation ne masque pas ses occurrences sources. |
| DM-C14 | Un snapshot ne devient pas une seconde vérité. |
| DM-C15 | Un release ancien reste reconstructible après correction. |
| DM-C16 | Un lock ne peut être levé sans acteur, mandat et raison. |
| DM-C17 | Biostatistics ne modifie pas les occurrences sources. |
| DM-C18 | Data Management ne modifie pas MeasurementDefinition ou BiomarkerRole. |
| DM-C19 | Une pratique locale ne devient pas une règle générale. |
| DM-C20 | Aucun standard externe n’est déclaré implémenté sans preuve. |

## 19. Contradictions et arbitrages

| ID | Tension observée | Arbitrage explicite |
|---|---|---|
| DM-A01 | RDE-001 emploie historiquement « définir les données » pour Data Management | DM définit les spécifications opérationnelles ; le Project définit les besoins et identités, OBS le sens de mesure, CDM la représentation canonique. |
| DM-A02 | Une Transformation pourrait sembler une nouvelle racine | sa définition réutilise une règle, méthode ou AnalysisSpecification selon le sens ; son exécution est un record lié aux occurrences/AnalysisExecution. Toute autonomie future exige arbitrage PD-003. |
| DM-A03 | Dataset, eCRF ou Data Dictionary pourraient devenir sources de vérité | ce sont des projections référencées et versionnées ; aucune identité scientifique ne leur appartient. |
| DM-A04 | Qualité DM et qualité scientifique pourraient se confondre | DM possède le processus de contrôle ; OBS/domaines possèdent les critères scientifiques ; Biostatistics décide l’usage analytique. |
| DM-A05 | Lock pourrait être interprété comme irréversibilité technique | DM-001 le définit comme décision, contrat, état et audit ; toute garantie technique reste à démontrer par une implémentation future. |

## 20. Limitations obligatoires

La présente admission est exclusivement conceptuelle et documentaire :

- aucun moteur Data Management n’est implémenté ;
- aucun stockage ;
- aucune base de données ;
- aucun eCRF fonctionnel ;
- aucun EDC ;
- aucun dataset réel ;
- aucune donnée patient ;
- aucune migration V1 ;
- aucun mapping CDISC, FHIR ou OMOP implémenté ;
- aucune règle réglementaire n’est déclarée actuelle sans vérification de source primaire courante ;
- aucune capacité Biostatistics n’est implémentée ;
- aucune campagne ou décision PD-011 ;
- aucune activation produit ;
- aucune modification du runtime hybride ;
- aucune réouverture de SEM ;
- aucun provider, aucun Blind et aucun appel externe n’ont été utilisés.

DM-001 n’est ni une validation scientifique, ni une validation de système informatisé, ni une qualification réglementaire, ni une autorisation de traitement de données, ni un protocole, ni une publication.

## 21. Conditions d’évolution

DM-001 évolue si la responsabilité normative de la capacité, ses artefacts, ownerships, handoffs, états de cycle de vie ou contrats permanents changent. Un ajout d’implémentation, de fournisseur, de format, de stockage ou de standard n’autorise pas à modifier silencieusement l’architecture.

Toute demande de nouvel objet racine, relation canonique ou transfert d’ownership doit d’abord être arbitrée sous PD-003 V2, OBS-001 et CDM-001. Toute revendication d’évaluation ou de qualification relève de PD-011 dans une mission distincte.

`DM001_STUDY_DATA_MANAGEMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`
