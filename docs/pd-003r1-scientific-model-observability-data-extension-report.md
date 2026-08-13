# PD-003R1 — Scientific Model, Observability & Study Data Object Model Extension

## Rapport d’arbitrage de l’évolution coordonnée du Research Object Model

| Champ | Valeur |
|---|---|
| Nature | mission normative conditionnelle ; rapport d’arbitrage |
| Statut du présent rapport | `NIVEAU_3 — CANDIDAT_NON_ADMIS` |
| Source maîtresse | présent fichier Markdown |
| Version | 1.0 |
| Date d’arbitrage | 11 août 2026 |
| Autorité métier examinée | `docs/pd-003-research-object-model.md` |
| Constitution spécialisée supérieure | Scientific Product Manifesto, version 1.0 |
| Décision SKM examinée | `SCIENTIFIC_KNOWLEDGE_MODEL_ARCHITECTURE_ACCEPTED_WITH_LIMITATIONS` |
| Portée | modèle métier conceptuel uniquement |

Le présent rapport prépare une évolution normative. Il ne l’accomplit pas : la solution scientifiquement retenue modifie la philosophie constitutionnelle actuelle du biomarqueur. Le mandat autorise la préparation précise de cette évolution, mais pas la modification du Scientific Product Manifesto. Par conséquent, ni PD-003, ni le manifeste, ni le SOURCE-OF-TRUTH-INDEX ne sont modifiés dans cette opération.

---

## 1. Décision

L’Architecture D est **validée comme architecture cible cohérente**, sous la forme suivante :

> Knowledge → Scientific Models → Observability & Measurement → Research Project → Canonical Study Data Model → responsabilités spécialisées.

Cette flèche exprime des transmissions de références, de versions, de provenance, de statuts, d’inconnues et de contradictions. Elle n’exprime ni une chaîne de propriété, ni une autorité descendante, ni un droit de mutation automatique.

Les douze arbitrages produisent la proposition coordonnée suivante :

| Besoin | Proposition cible | Qualification |
|---|---|---|
| Scientific Model | nouvel objet canonique agrégat, versionné, référençant Knowledge | `NEW_OBJECT_REQUIRED` |
| Observable Concept | nouvel objet canonique de contextualisation de l’observabilité | `NEW_OBJECT_REQUIRED` et `MANIFESTO_EVOLUTION_REQUIRED` |
| Biomarker | objet existant spécialisé en rôle contextuel reliant un Observable Concept à un phénomène, un état ou une réponse | `SPECIALIZED` et `MANIFESTO_EVOLUTION_REQUIRED` |
| Observation / Measurement Method | nouvel objet générique ; les méthodes d’imagerie, de laboratoire et d’évaluation le spécialisent | `NEW_OBJECT_REQUIRED` |
| Data Need | nouvel objet de projet, distinct du Besoin d’information adaptatif | `NEW_OBJECT_REQUIRED` |
| Variable Definition | l’objet existant Variable d’étude devient explicitement une définition de projet | `CLARIFIED` ; aucun second objet VariableDefinition |
| Realized Observation | nouvel objet nommé **Occurrence de variable d’étude** | `NEW_OBJECT_REQUIRED` |
| Temporalité | clarification de Visite ou temps d’observation en repères temporels typés et relations temporelles | `CLARIFIED` ; aucune duplication de Variable par temps |
| Sources | plusieurs axes orthogonaux ; aucune liste plate universelle | `NEW_RELATION_REQUIRED` ; objet Source de données à arbitrer avec le futur CDM |
| Biospecimen | ressource spécialisée canonique, distincte d’une Variable et d’une source | `NEW_OBJECT_REQUIRED` |
| Analysis | objet générique existant conservé, avec sous-types et owners explicites | `SPECIALIZED` ; pas de nouvelle famille concurrente |
| Canonical Variable Identity | une identité de Variable par projet, partagée par toutes les projections | `CLARIFIED` |
| Standards externes | mappings versionnés vers le modèle NOXIA, jamais remplacement du raisonnement NOXIA | `NEW_RELATION_REQUIRED` |

Le point bloquant est précis : retenir Observable Concept et Biomarker Role comme deux responsabilités distinctes contredit la formulation du Scientific Product Manifesto selon laquelle « les biomarqueurs représentent les observables ». Cette différence ne peut pas être réduite à une clarification rédactionnelle. Elle change le statut conceptuel du biomarqueur.

La mission s’arrête donc avant toute évolution du manifeste, de PD-003 et de l’index. OBS-001 et CDM-001 restent interdits.

---

## 2. Autorités

### 2.1 Ordre appliqué

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version 1.25, lu intégralement en premier ;
2. Charte fondatrice, version 1.0, DOCX maître ;
3. Scientific Product Manifesto, version 1.0, DOCX maître ;
4. `editorial-engine/docs/architecture-manifesto.md`, version 1.0, dans son dépôt propriétaire ;
5. PD-003, PD-004, PD-005, PD-009 et PD-011 ;
6. RDE-001, RDE-002, RDE-003 et KE-001 ;
7. ST-001, IMG-001, IMG-001B, PRJ-001, REG-001, VAL-000 et SKM-000 ;
8. DOC-002, TMP-001 et DOC-001B pour les impacts demandés.

### 2.2 Plans de vérité

| Plan | Sources | Usage dans l’arbitrage |
|---|---|---|
| Principes établis | Charte fondatrice | utilité démontrée avant abstraction, contexte, responsabilité humaine, inconnues visibles, traçabilité |
| Constitution spécialisée | Scientific Product Manifesto | phénomène non directement observable, biomarqueur comme observable, modalité comme possibilité d’observation |
| Références normatives | PD-003/004/005/009/011, RDE-001/002/003, KE-001 | objets, relations, ownership, décisions, arrêts, évaluation |
| Autorité externe | Editorial Engine Architecture Manifesto | projection passive, vérité appartenant au produit, moteur sans autorité scientifique |
| Corpus scientifiques | aucun corpus n’est modifié ni utilisé pour créer une règle universelle | exemples seulement ; aucune connaissance médicale nouvelle |
| Cible | Architecture D et objets proposés dans ce rapport | proposition conditionnelle, non admise |
| État réellement documenté | rapports ST/IMG/PRJ/REG/DOC/TMP/DOC-001B/VAL | capacités et limites observées, sans pouvoir normatif sur PD-003 |
| Hypothèses | futur OBS, futur CDM, futurs moteurs Data Management et Biostatistics | responsabilités à admettre dans des missions ultérieures |

### 2.3 Règles d’autorité appliquées

- L’index route l’autorité ; il ne tranche pas le fond scientifique ou métier.
- Le manifeste est supérieur à PD-003.
- PD-003 est l’autorité principale sur le vocabulaire métier canonique.
- SKM-000 est un candidat de niveau 3 ; sa recommandation ne modifie aucun objet.
- Les rapports d’implémentation prouvent un état local, jamais une doctrine.
- VAL-000 est consulté depuis le worktree `noxia-val000` et reste une architecture diagnostique extérieure au worktree courant ; il ne valide pas la présente décision.
- Les projections documentaires restent passives et ne deviennent jamais propriétaires des objets projetés.

### 2.4 Anomalie documentaire conservée visible

Au début de cette mission, `docs/skm-000-scientific-knowledge-modeling-architecture-report.md` est non suivi par Git et contient, avant son corps SKM, une copie du mandat PD-003R1 courant. Le corps SKM commence après ce préfixe et conserve sa décision finale. Cette anomalie n’est pas corrigée ici, car SKM-000 est hors du périmètre de modification et ne possède aucune autorité normative. Elle renforce l’obligation de ne pas l’utiliser comme substitut à PD-003 ou au manifeste.

---

## 3. Contradiction initiale

### 3.1 Position constitutionnelle actuelle

Le Scientific Product Manifesto établit la chaîne :

> Phénomène biologique → Biomarqueur → Modalité ou séquence.

Il affirme simultanément que :

- les phénomènes biologiques ne sont pas directement observables ;
- ils sont approchés par des biomarqueurs ;
- les biomarqueurs représentent les observables ;
- la modalité est une possibilité d’observation ;
- la séquence est un outil d’acquisition.

PD-003 traduit cette philosophie en trois objets : Phénomène biologique, Biomarqueur et Variable d’étude. Le Biomarqueur est un indicateur mesurable ; la Variable l’opérationnalise dans le projet.

### 3.2 Position candidate SKM-000

SKM-000 propose de distinguer :

- le concept scientifique ;
- sa composition dans un Scientific Model ;
- la propriété ou le construit observable ;
- l’usage de cet observable comme biomarqueur ;
- sa définition opérationnelle dans un projet ;
- sa réalisation pour une unité et un temps donnés.

### 3.3 Nature de la contradiction

La différence n’est ni temporelle, ni technique, ni une simple différence de granularité. Elle porte sur la philosophie du biomarqueur : **objet observable** dans le manifeste actuel, **rôle contextuel d’un observable** dans l’Option B.

Une évolution de PD-003 seule ne peut pas résoudre cette contradiction. Elle placerait une norme métier de niveau 1 en opposition avec une constitution spécialisée de niveau 0.

---

## 4. Justification du besoin

Les objets actuels protègent déjà la distinction phénomène–biomarqueur–variable, mais quatre séparations nécessaires aux futures responsabilités restent absentes.

Premièrement, une explication mécanistique versionnée n’est ni une collection d’assertions Knowledge, ni la Stratégie scientifique complète d’un projet. Elle doit pouvoir organiser des concepts, rôles, relations, alternatives et temporalités sans recopier les preuves.

Deuxièmement, la propriété que l’on cherche à observer ou estimer n’est pas toujours identique à l’usage de cette propriété comme indicateur d’un phénomène. La fibrose myocardique n’est pas l’ECV ; l’ECV ne devient pas un indicateur valide de tout phénomène, dans toute population et par toute méthode.

Troisièmement, une Variable d’étude est une définition adoptée par un projet. Elle peut exister avant toute collecte. Une valeur, une catégorie, un statut manquant ou une dérivation concernant un participant et une occasion est une occurrence distincte.

Quatrièmement, un besoin de données n’est ni une lacune de connaissance générale, ni une question adaptative adressée au concepteur, ni une Variable créée automatiquement. Il exprime ce que le projet devra pouvoir obtenir pour répondre à un objectif, un critère ou une analyse.

Ces séparations sont nécessaires pour assurer :

- une identité unique des Variables entre CRF, dictionnaire, SAP, jeux d’analyse, exports et documents ;
- une provenance reconstructible des occurrences ;
- l’indépendance du modèle vis-à-vis de l’imagerie ;
- l’absence de duplication entre Knowledge, Project, OBS et CDM ;
- la distinction entre donnée attendue, donnée recueillie, résultat et interprétation.

---

## 5. Architecture D

### 5.1 Les cinq plans et la frontière humaine

| Plan | Responsabilité propre | Ne possède jamais |
|---|---|---|
| Knowledge | identités scientifiques, assertions, relations, preuves, domaines, limites, controverses et versions | modèle explicatif adopté par un projet ; besoin de données ; décision de collecte |
| Scientific Models | composition explicative versionnée : éléments, rôles, relations, temporalité, alternatives et hypothèses | preuve recopiée ; vérité universelle ; décision de projet |
| Observability & Measurement | concepts observables, méthodes, conditions et validité de la relation de mesure | valeur réalisée ; priorité de collecte ; inférence statistique |
| Research Project | Data Needs, Variables, temps attendus, critères, options et décisions humaines | connaissance générale ; observation patient inventée |
| Canonical Study Data Model | occurrences, statuts, qualité, source, provenance, corrections et lignage | vérité scientifique ; justification d’un biomarqueur ; choix de l’analyse |
| Owners spécialisés | propositions Imaging, Data Management, Biostatistics, laboratoire, opérations ou autres domaines | mutation directe des décisions adoptées ; autorité d’un autre domaine |

### 5.2 Handoffs minimaux

Chaque frontière transmet au minimum :

- identités et versions ;
- relations et rôles ;
- domaine de validité ;
- provenance et responsables ;
- états d’adoption ou de candidature ;
- inconnues, limites et contradictions ;
- décisions humaines applicables ;
- références vers les objets sources, jamais leur copie autoritative.

### 5.3 Pourquoi D est retenue

L’Architecture A fusionne connaissance, observable et variable. L’Architecture B introduit le modèle scientifique mais laisse la méthode et la réalisation sans frontière. L’Architecture C distingue les modèles d’observation mais conserve l’ambiguïté entre modèle d’observation et donnée observée. D est la seule à séparer explicitement explication, observabilité, décision de projet et occurrence de données.

Elle n’est pas retenue parce qu’elle comporte davantage d’objets. Elle est retenue parce que chaque séparation correspond à un changement démontré de responsabilité, de cycle de vie, d’identité ou de provenance.

---

## 6. Scientific Model

### 6.1 Arbitrage

Scientific Model doit devenir, si l’évolution est admise, un **objet canonique agrégat versionné**. Il ne doit être ni une simple projection d’exécution, ni un alias de Scientific Thinking, ni une extension du Knowledge Graph.

### 6.2 Pourquoi un objet est nécessaire

Une projection ne suffit pas, car un modèle doit pouvoir être cité, comparé, remplacé, appliqué à plusieurs projets et conservé avec sa version. Une responsabilité de Scientific Thinking ne suffit pas, car Scientific Thinking peut produire plusieurs modèles candidats et ne doit pas devenir propriétaire de leur validité scientifique. La Stratégie scientifique ne suffit pas, car elle inclut l’ensemble des décisions de projet, acquisitions, critères, analyses et compromis ; le Scientific Model reste centré sur l’explication scientifique.

### 6.3 Contrat candidat

Un Scientific Model porte au minimum :

- une identité et une version ;
- un domaine et un objectif explicatif ;
- les références vers ses éléments Knowledge ;
- le rôle de chaque élément dans le modèle ;
- les relations causales, fonctionnelles ou temporelles proposées ;
- les hypothèses et présupposés du modèle ;
- les alternatives et modèles concurrents ;
- les contradictions et inconnues ;
- le domaine de validité ;
- le statut de chaque composant : établi, proposé, alternatif, contesté, incomplet ou hors domaine ;
- la provenance, les contributeurs et l’autorité humaine de revue ;
- les versions remplacées et l’analyse d’impact.

Il référence les preuves Knowledge ; il ne les copie pas. Son statut ne peut jamais augmenter la force d’une assertion référencée.

### 6.4 Ownership

- Knowledge possède les unités épistémiques et leurs preuves.
- Scientific Thinking propose les compositions et hypothèses de modèle.
- Les spécialistes contribuent dans leur domaine.
- Un acteur scientifique mandaté adopte, rejette ou maintient plusieurs modèles candidats dans un projet.
- Aucun moteur Scientific Model n’est créé par cette décision préparatoire.

---

## 7. Observable Concept

### 7.1 Arbitrage

Observable Concept doit devenir un objet canonique distinct **uniquement si** la philosophie constitutionnelle est préalablement modifiée.

### 7.2 Définition candidate

Un Observable Concept est une propriété, un construit ou une catégorie susceptible d’être observée, estimée ou classée par au moins une méthode définissable. Il n’est :

- ni le phénomène que l’on cherche à expliquer ;
- ni automatiquement un biomarqueur ;
- ni la méthode qui permet de l’estimer ;
- ni une Variable d’un projet ;
- ni une valeur réalisée.

Son identité scientifique doit référencer Knowledge. Son objet d’observabilité porte la qualification de ce qui est observé, ses formes de résultat possibles, ses limites de mesure et ses relations aux méthodes. Il ne duplique pas la définition, les preuves ou le statut du concept Knowledge.

### 7.3 Distinctions obligatoires

| Objet | Question à laquelle il répond |
|---|---|
| Phénomène biologique | Quel processus ou état le projet cherche-t-il à comprendre ? |
| Observable Concept | Quelle propriété ou quel construit peut être observé ou estimé ? |
| Biomarker Role | Dans quel contexte cet observable informe-t-il un phénomène, un état ou une réponse ? |
| Variable d’étude | Comment le projet a-t-il décidé d’opérationnaliser cet observable ou une autre caractéristique ? |
| Occurrence de variable | Qu’est-il effectivement advenu pour cette unité et cette occasion ? |

### 7.4 Refus de l’Option A

Conserver Biomarker comme l’unique objet observable et représenter Observable Concept comme simple rôle minimise le nombre d’objets, mais ne résout pas les cas suivants :

- une propriété observable qui n’est pas utilisée comme biomarqueur ;
- un observable utilisé comme biomarqueur pour plusieurs phénomènes avec des domaines différents ;
- une Variable de contexte ou d’organisation qui ne correspond pas à un biomarqueur ;
- la réutilisation d’une même définition observable dans plusieurs projets sans réutiliser une décision biomarqueur ;
- la distinction entre preuve de mesurabilité et preuve de validité comme indicateur.

L’Option A est donc compatible avec la lettre du manifeste, mais insuffisante pour le besoin démontré.

---

## 8. Biomarker

### 8.1 Arbitrage

L’Option B est retenue comme cible : **Observable Concept distinct et Biomarker Role contextuel**.

Le Biomarqueur existant n’est pas supprimé. Sa responsabilité cible devient une spécialisation : il représente l’usage contextualisé, justifié et soutenu par des preuves d’un Observable Concept comme indicateur d’un phénomène, d’un état biologique, d’une exposition ou d’une réponse.

### 8.2 Contrat candidat du Biomarker Role

Chaque rôle biomarqueur relie au minimum :

- un Observable Concept ;
- un phénomène, état ou réponse cible ;
- un usage scientifique ;
- une population et une temporalité ;
- une ou plusieurs méthodes compatibles ;
- un domaine de validité ;
- des facteurs de confusion ;
- des limites de sensibilité, de spécificité, de transportabilité ou de reproductibilité lorsqu’elles sont connues ;
- les assertions et preuves Knowledge applicables ;
- un niveau de confiance ;
- un statut candidat, retenu, rejeté ou exploratoire dans le projet ;
- les alternatives et contradictions.

### 8.3 Règles

- Un Observable Concept peut ne porter aucun rôle biomarqueur.
- Un même Observable Concept peut porter plusieurs rôles biomarqueurs distincts.
- Deux rôles biomarqueurs portant sur le même observable ne sont pas fusionnés si leur phénomène, population, temps, méthode ou usage diffère.
- La validité d’un rôle n’est jamais déduite de la seule mesurabilité de l’observable.
- Une Variable peut opérationnaliser un Observable Concept sans que son usage soit biomarqueur.

Cette spécialisation est incompatible avec le sens actuel du chapitre 45 du manifeste et déclenche l’arrêt normatif.

---

## 9. Data Need

### 9.1 Arbitrage

Data Need doit devenir un objet canonique appartenant au Research Project et gouverné fonctionnellement par Study Design. Le terme français recommandé est **Besoin de données du projet**.

Il ne doit pas être fusionné avec le Besoin d’information PD-003 :

- le Besoin d’information représente une information manquante nécessaire au raisonnement de conception ;
- le Besoin de données du projet représente une information que l’étude devra obtenir, réutiliser ou dériver pour atteindre un objectif.

### 9.2 Contrat candidat

Un Besoin de données du projet porte :

- une identité et une version ;
- le ou les motifs : question, objectif, hypothèse, critère, analyse, exigence, qualité ou besoin opérationnel ;
- la population ou unité concernée ;
- la temporalité attendue ;
- la précision, qualité ou complétude nécessaire ;
- les sources admissibles ou exclues ;
- les contraintes de réutilisation ;
- les Variables candidates capables de le satisfaire ;
- l’état `OUVERT`, `PARTIELLEMENT_COUVERT`, `COUVERT`, `RENUNCED` ou équivalent à arbitrer ;
- les inconnues, conflits et responsables ;
- la décision humaine qui adopte ou retire le besoin.

### 9.3 Invariants

- Un Data Need ne crée jamais automatiquement une Variable.
- Une Variable peut satisfaire plusieurs Data Needs.
- Un Data Need peut exiger plusieurs Variables.
- Un besoin couvert en définition peut rester non satisfait dans les données réalisées.
- Knowledge peut expliquer le besoin ; il ne décide pas que le projet doit collecter la donnée.

---

## 10. Variable

### 10.1 Arbitrage

L’objet Variable d’étude de PD-003 est conservé et clarifié. Aucun objet concurrent `VariableDefinition` ne doit être créé.

### 10.2 Définition cible

Une Variable d’étude est une définition versionnée propre à un Research Project. Elle opérationnalise un Observable Concept, une caractéristique de contexte, une décision de classification ou une dérivation nécessaire au projet.

Elle porte au minimum :

- son identité canonique de projet ;
- son nom canonique et ses libellés de projection ;
- ses alias et mappings terminologiques ;
- l’Observable Concept ou l’autre construit qu’elle opérationnalise ;
- son rôle scientifique et ses Data Needs ;
- ses Critères de jugement et usages analytiques ;
- sa source prévue et sa méthode ;
- sa temporalité attendue, sans dupliquer la Variable pour chaque occasion ;
- son unité ou domaine de valeurs ;
- sa nature qualitative, quantitative, catégorielle, textuelle ou autre qualification conceptuelle ;
- ses exigences de qualité ;
- ses règles de non-évaluabilité et de données manquantes ;
- ses dérivations et dépendances ;
- sa provenance, sa version et ce qu’elle remplace.

### 10.3 Invariants

- Une Variable peut exister avant toute occurrence.
- Une Variable ne contient pas une valeur individuelle.
- Une modification d’unité, de méthode, de domaine, de source ou de sens produit une nouvelle révision.
- Un changement de libellé de projection ne crée pas une nouvelle identité.
- Une répétition temporelle ne crée pas une nouvelle Variable si la définition scientifique reste identique.

---

## 11. Realized Observation

### 11.1 Comparaison des noms

| Nom candidat | Décision | Motif |
|---|---|---|
| `Observation` | rejeté | déjà utilisé pour constat initial, fait scientifique, occasion et valeur |
| `RealizedObservation` | rejeté comme nom canonique | conserve l’ambiguïté d’Observation |
| `ObservedValue` | rejeté | exclut catégories, statuts manquants, résultats invalides et dérivations |
| `MeasurementRecord` | rejeté | trop étroit pour une valeur non mesurée ou dérivée |
| `StudyObservation` | rejeté | ne qualifie pas le sens d’observation |
| `VariableOccurrence` | retenu conceptuellement | distingue la définition de sa réalisation et peut porter valeur ou statut |

Le nom canonique français recommandé est **Occurrence de variable d’étude**. L’équivalent stable proposé est `StudyVariableOccurrence`.

### 11.2 Contrat candidat

Une Occurrence de variable d’étude représente, pour une unité étudiée et une occasion données, la réalisation, la tentative de réalisation, l’absence qualifiée ou la dérivation d’une Variable.

Elle porte :

- l’identité et la version de la Variable ;
- l’unité étudiée ;
- l’occasion ou le repère temporel ;
- la méthode et sa version ;
- la source et la provenance ;
- la valeur, catégorie ou statut d’absence/non-évaluabilité ;
- l’unité effectivement utilisée ;
- les temps d’acquisition, de collecte, de transformation et d’analyse lorsqu’ils sont applicables ;
- la qualité et les contrôles appliqués ;
- les occurrences sources en cas de dérivation ;
- les corrections, remplacements et raisons ;
- les restrictions d’usage ;
- le responsable ou système source, sans transférer sa responsabilité au CDM.

### 11.3 Invariants

- Une occurrence n’altère jamais la définition de sa Variable.
- Une absence n’est jamais remplacée par une valeur normale.
- Une correction crée une nouvelle version ou occurrence de correction reliée à l’originale ; elle n’efface pas l’histoire.
- Une occurrence dérivée conserve toutes ses dépendances.
- Une occurrence n’est ni un résultat interprété, ni une conclusion scientifique.

---

## 12. Temporalité

### 12.1 Séparations retenues

| Notion | Responsabilité cible |
|---|---|
| Visit | rencontre ou fenêtre opérationnelle planifiée du projet |
| Timepoint | repère scientifique, absolu ou relatif à un événement |
| Observation Occasion | relation attendue entre une Variable, une unité ou un groupe et un repère temporel ; pas un nouvel objet universel |
| Acquisition Time | temps auquel une acquisition ou une procédure produit la matière source |
| Collection Time | temps auquel un prélèvement ou une donnée est recueilli |
| Analysis Time | temps auquel une transformation ou analyse est exécutée |

### 12.2 Arbitrage sur l’objet existant

`Visite ou temps d’observation` conserve son identité, mais doit être clarifié comme **repère temporel du projet** avec un rôle explicite : visite, timepoint, fenêtre ou temps relatif à un événement. Le mot générique « observation » ne doit plus désigner une valeur réalisée.

Les temps d’acquisition, de collecte et d’analyse sont des rôles temporels portés par les objets concernés. Ils ne justifient pas trois nouveaux objets globaux.

### 12.3 Répétitions

Une même Variable TROPONIN peut être attendue à T0, H6, H12 et H24. Elle conserve une identité canonique. Quatre relations d’attente ou quatre Occurrences peuvent exister ; quatre Variables ne sont créées que si leur définition scientifique diffère réellement.

---

## 13. Sources

### 13.1 Rejet d’une taxonomie plate

La liste proposée mélange plusieurs dimensions :

| Valeur candidate | Dimension réelle |
|---|---|
| `STUDY_MANDATED` | intention ou mandat de collecte |
| `ROUTINE_CARE` | contexte de production |
| `HISTORICAL` | relation temporelle au projet |
| `EXTERNAL_DATA` | frontière d’ownership |
| `REGISTRY`, `BIOBANK` | type d’organisation ou de ressource source |
| `WEARABLE` | canal ou classe de méthode |
| `IMAGING`, `LABORATORY` | domaine spécialisé |
| `DERIVED` | relation de lignage |
| `OTHER` | valeur de repli |

Ces valeurs ne doivent pas devenir une seule énumération canonique.

### 13.2 Architecture candidate

La source est qualifiée selon au moins quatre axes orthogonaux :

1. **mandat de production** : imposée par l’étude, non imposée par l’étude ou inconnue ;
2. **contexte de provenance** : soin courant, recherche, registre, biobanque, ressource externe ou autre contexte gouverné ;
3. **domaine ou méthode** : imagerie, laboratoire, dispositif porté, évaluation clinique ou autre spécialité ;
4. **lignage** : primaire, réutilisée, transformée ou dérivée.

La taxonomie générique appartient à la future gouvernance Data Management/CDM. Les domaines spécialisés définissent leurs sous-qualifications. Le Research Project conserve le but et le mandat ; l’Occurrence conserve la provenance effective.

### 13.3 Règle du soin courant

La consommation d’une donnée de soin courant par un projet ne change jamais son mandat d’origine. `ROUTINE_CARE` ne devient pas `STUDY_MANDATED` par sélection, copie, projection ou analyse.

### 13.4 Objet Source de données

Une source possédant une identité, une responsabilité, une version, une période de validité et des règles d’accès peut justifier un futur objet **Source de données d’étude**. Son admission doit être coordonnée avec CDM-001 afin d’éviter un objet PD-003 vide ou un doublon d’un système source. À ce stade : `AMBIGUOUS_REQUIRES_ARBITRATION`.

---

## 14. Biospecimens

### 14.1 Arbitrage

Biospecimen doit être un objet canonique spécialisé, indépendant d’une Variable et d’une Source de données. Il possède un cycle matériel, une identité, une provenance, des transformations et des contraintes propres.

### 14.2 Contrat candidat

Le Biospecimen porte au minimum :

- l’unité source et le contexte de collecte ;
- le type de matériel ;
- le temps et la procédure de collecte ;
- les conditions de traitement et conservation pertinentes ;
- la quantité ou disponibilité lorsqu’elle est connue ;
- la chaîne de custody et la provenance ;
- les transformations et liens parent–enfant ;
- les aliquots ;
- les restrictions d’usage ;
- les états de qualité, disponibilité et destruction ;
- les décisions et inconnues.

### 14.3 Taxonomie candidate non admise

- Blood est un matériau de collecte.
- Plasma et Serum sont des matériaux dérivés du sang selon une procédure.
- Urine et Stool sont des matériaux distincts.
- Biopsy désigne un prélèvement tissulaire et doit être précisé par site et procédure.
- Aliquot est une ressource fille, pas une Variable.
- DNA et RNA peuvent être un matériau extrait, un analyte ou la cible d’une mesure selon le contexte ; leur qualification ne doit pas être figée sans architecture spécialisée.

La liste ne devient pas une taxonomie officielle dans cette mission.

### 14.4 Invariants

- Specimen n’est pas Variable.
- Collection n’est pas occurrence de Variable tant qu’aucune propriété n’est définie et enregistrée.
- Existence d’une fécothèque n’implique aucune analyse sélectionnée.
- Une analyse future reste un Data Need, une Option ou une Hypothèse de travail tant qu’elle n’est pas adoptée.

---

## 15. Analysis

### 15.1 Arbitrage

L’objet PD-003 Analyse reste le type générique canonique. Il doit recevoir des sous-types ou rôles explicites et un owner spécialisé. Créer plusieurs objets racines concurrents reproduirait la même notion dans chaque moteur.

### 15.2 Sous-types conceptuels

| Sous-type ou rôle | Owner fonctionnel principal | Frontière |
|---|---|---|
| lecture ou mesure d’image | Imaging | définit comment l’image produit une Variable ; n’exécute pas l’inférence statistique |
| mesure de laboratoire ou domaine spécialisé | spécialiste de la méthode | produit ou qualifie une mesure ; ne décide pas son rôle analytique global |
| transformation et dérivation de données | Data Management | conserve règles, entrées, sorties, qualité et lignage |
| analyse statistique | Biostatistics | définit estimand, modèle, population, hypothèses, missingness et sensibilité |
| interprétation scientifique | acteur humain et Study Design, avec Knowledge | n’est pas un sous-type d’Analyse exécutée ; s’appuie sur Règle d’interprétation, résultats, limites et Décisions |

### 15.3 Résultat

Une spécification d’Analyse n’est pas son résultat. Un résultat analytique doit référencer l’Analyse, ses entrées, sa version, sa population, ses paramètres et sa provenance. Une valeur dérivée peut être représentée par une Occurrence de variable d’étude ; un résultat complexe pourra exiger un objet spécialisé ultérieur, sans être inventé ici.

### 15.4 Invariants

- Le CDM représente entrées, sorties et lignage ; il ne choisit pas l’Analyse.
- Imaging ne choisit pas le modèle statistique.
- Data Management ne réinterprète pas le sens scientifique d’une Variable.
- Biostatistics ne redéfinit pas le phénomène, l’observable ou le biomarqueur pour rendre une analyse possible.
- L’interprétation ne remplace pas le résultat brut ou dérivé.

---

## 16. Canonical Variable Identity

### 16.1 Principe

Une Variable possède une seule identité sémantique dans le périmètre d’un Research Project. CRF, Data Dictionary, SAP, Analysis Dataset, exports, documents et rapports la référencent ; aucune projection ne crée une seconde Variable.

### 16.2 Attributs conceptuels

| Attribut demandé | Règle |
|---|---|
| `variableId` | identité stable, opaque au sens, immuable dans le projet |
| `canonicalName` | nom canonique stable et unique dans le projet ; son changement est versionné |
| `displayLabel` | libellé propre à une projection, une langue ou une audience ; ne crée aucune identité |
| `aliases` | synonymes ou anciens libellés versionnés avec provenance et portée |
| `terminologyMappings` | correspondances vers standards externes, versionnées et qualifiées ; jamais identité NOXIA de remplacement |

### 16.3 Règles

- Un CRF peut afficher un libellé court et un SAP un libellé analytique sans créer deux Variables.
- Un jeu d’analyse peut créer une Variable dérivée seulement si sa définition scientifique ou sa règle de dérivation est nouvelle et explicitement reliée aux Variables sources.
- Une révision incompatible ne réutilise pas silencieusement l’identité historique ; elle la remplace avec filiation explicite.
- Les collisions de nom n’autorisent ni fusion ni déduplication automatique.

---

## 17. Standards externes

### 17.1 Arbitrage

NOXIA conserve son modèle métier interne. CDISC, FHIR, OMOP, LOINC, SNOMED CT, MedDRA et les futures terminologies sont des cibles ou sources de mappings versionnés. Elles ne redéfinissent pas silencieusement la question scientifique, le phénomène, l’observable, le rôle biomarqueur ou la Variable.

### 17.2 Contrat de mapping candidat

Un mapping conserve :

- l’objet NOXIA source et sa version ;
- le standard, la version ou l’édition ;
- le concept cible ;
- la relation : exacte, plus large, plus étroite, liée ou non équivalente ;
- le contexte et les exclusions ;
- la méthode et l’auteur du mapping ;
- son statut de revue ;
- les contradictions et mappings alternatifs ;
- sa période d’effet et ce qu’il remplace.

Il s’agit d’une nouvelle relation canonique versionnée, pas nécessairement d’un nouvel objet racine. Aucun mapping réel n’est créé ici.

### 17.3 Invariants

- Un code externe ne devient jamais l’identité canonique NOXIA.
- Une équivalence partielle ne devient jamais exacte par commodité d’export.
- Un changement de version du standard déclenche une analyse d’impact.
- Une projection externe peut perdre de la granularité ; cette perte reste visible.

---

## 18. Crosswalk PD-003

### 18.1 Règle de lecture

Le tableau couvre les 68 objets actuels de PD-003. Les statuts décrivent la **cible proposée**, non une évolution admise. Aucune identité n’est supprimée.

| # | Objet PD-003 actuel | Cible proposée | Statut |
|---:|---|---|---|
| 1 | Dossier de recherche | reste l’agrégat du projet ; référence Data Needs, modèles applicables, Variables et occurrences sans les confondre | `CLARIFIED` |
| 2 | Acteur du projet | inchangé ; assume les revues et décisions selon Mandat | `UNCHANGED` |
| 3 | Mandat décisionnel | inchangé ; requis pour adoption de modèle, besoin, variable et mapping structurant | `UNCHANGED` |
| 4 | Situation de recherche | conserve l’idée, l’intuition ou le constat initial ; le mot Observation doit être qualifié dans les projections | `CLARIFIED` |
| 5 | Intention scientifique | inchangée | `UNCHANGED` |
| 6 | Contexte du projet | référence modèles, méthodes, sources et contextes d’usage applicables | `CLARIFIED` |
| 7 | Stratégie scientifique | demeure plus large que Scientific Model ; adopte ses références, Data Needs et Variables | `CLARIFIED` |
| 8 | Version de stratégie | fige versions de modèles, observables, méthodes, Variables et mappings utilisés | `CLARIFIED` |
| 9 | Contribution | inchangée ; seul moyen d’entrée avant adoption humaine | `UNCHANGED` |
| 10 | Question scientifique | inchangée | `UNCHANGED` |
| 11 | Objectif scientifique | motive Data Needs et Variables ; identité inchangée | `CLARIFIED` |
| 12 | Hypothèse | peut référencer un Scientific Model sans devenir assertion Knowledge | `CLARIFIED` |
| 13 | Pathologie ou condition clinique | inchangée | `UNCHANGED` |
| 14 | Structure anatomique | inchangée | `UNCHANGED` |
| 15 | Population d’étude | inchangée | `UNCHANGED` |
| 16 | Phénotype | reste manifestation contextualisée ; relation avec Observable Concept à qualifier | `CLARIFIED` |
| 17 | Phénomène biologique | reste le processus/état étudié ; peut jouer un rôle dans un Scientific Model ; distinct de l’observable | `CLARIFIED` |
| 18 | Plan d’étude | organise Data Needs, repères temporels et occasions attendues | `CLARIFIED` |
| 19 | Groupe d’étude | inchangé | `UNCHANGED` |
| 20 | Visite ou temps d’observation | identité conservée comme repère temporel typé ; « observation » ne désigne plus une valeur | `DEPRECATED_TERM` |
| 21 | Intervention ou exposition | inchangée | `UNCHANGED` |
| 22 | Biomarqueur | devient Biomarker Role entre Observable Concept et phénomène/état/réponse | `SPECIALIZED` ; `MANIFESTO_EVOLUTION_REQUIRED` |
| 23 | Variable d’étude | devient explicitement la Variable Definition du projet ; jamais une valeur | `CLARIFIED` |
| 24 | Critère de jugement | reste objectif opérationnel ; référence Variables et temps, jamais occurrences comme définition | `CLARIFIED` |
| 25 | Modalité d’imagerie | spécialise une famille de méthodes d’observation ; reste moyen, jamais observable | `CLARIFIED` |
| 26 | Acquisition | acte planifié de production d’une source ; distinct d’une occurrence de Variable | `CLARIFIED` |
| 27 | Séquence ou technique d’acquisition | spécialisation Imaging de Méthode d’observation ou de mesure | `SPECIALIZED` |
| 28 | Paramètre critique | inchangé ; s’applique à une version de méthode, acquisition ou analyse | `UNCHANGED` |
| 29 | Condition de mesure | contextualise méthode et occurrence ; identité conservée | `CLARIFIED` |
| 30 | Protocole d’imagerie | inchangé ; projection opératoire de stratégie Imaging | `UNCHANGED` |
| 31 | Site et environnement technique | inchangé | `UNCHANGED` |
| 32 | Contrainte | inchangée | `UNCHANGED` |
| 33 | Règle d’harmonisation | inchangée ; peut couvrir méthodes, Variables et occurrences | `CLARIFIED` |
| 34 | Contrôle qualité | s’applique aux définitions, acquisitions, occurrences et analyses sans les fusionner | `CLARIFIED` |
| 35 | Procédure de lecture | spécialisation de méthode de mesure/production de Variable | `SPECIALIZED` |
| 36 | Analyse | type générique conservé ; sous-type et owner obligatoires ; résultat séparé | `SPECIALIZED` |
| 37 | Dimensionnement | inchangé | `UNCHANGED` |
| 38 | Règle d’interprétation | reste distincte de l’Analyse et de son résultat | `CLARIFIED` |
| 39 | Information de projet | inchangée ; ne devient jamais occurrence de données par défaut | `UNCHANGED` |
| 40 | Besoin d’information | inchangé et explicitement distinct du Data Need | `CLARIFIED` |
| 41 | Échange adaptatif | inchangé | `UNCHANGED` |
| 42 | Option | inchangée | `UNCHANGED` |
| 43 | Recommandation | inchangée | `UNCHANGED` |
| 44 | Décision | inchangée ; adopte ou refuse les objets candidats | `UNCHANGED` |
| 45 | Justification | inchangée | `UNCHANGED` |
| 46 | Compromis | inchangé | `UNCHANGED` |
| 47 | Dépendance | accueille les nouvelles dépendances sans changer de nature | `CLARIFIED` |
| 48 | Incertitude | inchangée et propagée à chaque frontière | `UNCHANGED` |
| 49 | Risque | inchangé | `UNCHANGED` |
| 50 | Biais | inchangé | `UNCHANGED` |
| 51 | Limite | inchangée | `UNCHANGED` |
| 52 | Contradiction | inchangée ; aucune fusion ou mapping ne peut la fermer implicitement | `UNCHANGED` |
| 53 | Alerte méthodologique | inchangée | `UNCHANGED` |
| 54 | Revue méthodologique | inchangée | `UNCHANGED` |
| 55 | Analyse d’impact | étendue aux modèles, observables, méthodes, mappings et définitions de Variables | `CLARIFIED` |
| 56 | Événement d’évolution | inchangé | `UNCHANGED` |
| 57 | Énoncé de connaissance | reste unité Knowledge ; référencé, jamais copié dans Scientific Model | `UNCHANGED` |
| 58 | Relation scientifique | reste unité Knowledge ; distincte des rôles de composition et mappings terminologiques | `CLARIFIED` |
| 59 | Domaine de validité | qualifie modèle, rôle biomarqueur, méthode et mapping | `CLARIFIED` |
| 60 | Source scientifique | inchangée et distincte d’une Source de données d’étude | `CLARIFIED` |
| 61 | Preuve scientifique | inchangée ; jamais propriété autonome du modèle | `UNCHANGED` |
| 62 | Synthèse de preuves | inchangée | `UNCHANGED` |
| 63 | Controverse scientifique | inchangée | `UNCHANGED` |
| 64 | État de connaissance effectif | continue de figer les versions Knowledge ; ne devient pas version de Scientific Model | `CLARIFIED` |
| 65 | Règle méthodologique | inchangée | `UNCHANGED` |
| 66 | Profil de projection | inchangé | `UNCHANGED` |
| 67 | Projection | référence les identités canoniques et ne recrée ni Variable ni mapping | `CLARIFIED` |
| 68 | Rapport scientifique | inchangé ; expose la séparation définition/occurrence/résultat/interprétation | `CLARIFIED` |

### 18.2 Objets nouveaux proposés

| Objet cible | Justification d’autonomie | Statut actuel |
|---|---|---|
| Scientific Model | identité, version, alternatives, composition et réutilisation distinctes de Knowledge et Strategy | `NEW_OBJECT_REQUIRED` |
| Observable Concept | identité d’observabilité distincte du phénomène, du rôle biomarqueur et de la Variable | `NEW_OBJECT_REQUIRED` ; bloqué par le manifeste |
| Observation or Measurement Method | contrat générique non dépendant de l’imagerie ; version et validité propres | `NEW_OBJECT_REQUIRED` |
| Besoin de données du projet | motivation, couverture et cycle distincts du Besoin d’information adaptatif | `NEW_OBJECT_REQUIRED` |
| Occurrence de variable d’étude | unité, occasion, valeur/statut, qualité et provenance distinctes de la définition | `NEW_OBJECT_REQUIRED` |
| Biospecimen | identité matérielle, collecte, transformation, conservation et aliquotage | `NEW_OBJECT_REQUIRED` |
| Source de données d’étude | identité et responsabilité possibles, à coordonner avec CDM-001 | `AMBIGUOUS_REQUIRES_ARBITRATION` |

### 18.3 Relations nouvelles proposées

| Source | Relation | Cible | Statut |
|---|---|---|---|
| Scientific Model | référence sans copier | Énoncé, Relation, Domaine et Preuve Knowledge | `NEW_RELATION_REQUIRED` |
| Scientific Model | compose avec rôle, ordre et temporalité | Phénomène ou autre concept scientifique | `NEW_RELATION_REQUIRED` |
| Observable Concept | est observable ou estimable par | Méthode d’observation ou de mesure | `NEW_RELATION_REQUIRED` |
| Biomarker Role | utilise comme indicateur de | Observable Concept → Phénomène/état/réponse | `NEW_RELATION_REQUIRED` |
| Data Need | est motivé par | Question, Objectif, Hypothèse, Critère, Analyse ou exigence | `NEW_RELATION_REQUIRED` |
| Variable | couvre tout ou partie de | Data Need | `NEW_RELATION_REQUIRED` |
| Variable | opérationnalise | Observable Concept ou caractéristique explicitée | `NEW_RELATION_REQUIRED` |
| Variable | est attendue à | repère temporel du projet | `NEW_RELATION_REQUIRED` |
| Occurrence de variable | réalise | Variable | `NEW_RELATION_REQUIRED` |
| Occurrence de variable | est produite par ou dérivée de | Méthode, Acquisition, Biospecimen ou Occurrence source | `NEW_RELATION_REQUIRED` |
| Biospecimen | dérive de / possède pour parent | Biospecimen | `NEW_RELATION_REQUIRED` |
| Analyse | consomme / produit | Occurrences ou résultats qualifiés | `NEW_RELATION_REQUIRED` |
| Objet NOXIA | est mappé vers avec qualification | concept d’un standard externe versionné | `NEW_RELATION_REQUIRED` |

---

## 19. Six cas conceptuels

### 19.1 Cas A — Infarctus et imagerie

Un projet évaluant un infarctus par XA et/ou IRM doit conserver les étages suivants :

- **Phénomène** : processus ou état tissulaire étudié, défini sans être assimilé à une image.
- **Scientific Model** : composition candidate reliant mécanismes, territoires, temporalité et alternatives, avec références Knowledge.
- **Observable Concept** : propriété telle que perméabilité vasculaire, étendue d’une lésion, comportement de signal ou fonction, selon la question réellement adoptée.
- **Biomarker Role** : usage contextualisé de l’observable pour informer le phénomène d’infarctus ou une conséquence donnée.
- **Modalité et méthode** : XA ou IRM et méthodes compatibles, sans conclure qu’une modalité est supérieure universellement.
- **Variable** : définition propre au projet, avec méthode, temps, unité/domaine, qualité et rôle.
- **Occurrence** : réalisation pour un participant et une occasion, avec valeur ou statut, qualité et provenance.

Le cas est cohérent sans protocole clinique, seuil ou paramètre. Le modèle refuse `phénomène = observable`, `observable = valeur` et `modalité = biomarqueur`.

### 19.2 Cas B — Échocardiographie de soin courant

Le projet peut avoir un Data Need satisfait par une échocardiographie déjà réalisée. La Variable précise que la source admissible est issue du soin courant et conserve la méthode, la date, la qualité et les restrictions d’usage. L’Occurrence référence l’examen source.

La décision de réutiliser la donnée ne transforme ni l’examen, ni son intention initiale, ni sa provenance en procédure imposée par l’étude. Si la qualité ou la temporalité ne couvre pas le besoin, le Data Need reste partiellement couvert ou ouvert.

### 19.3 Cas C — Biologie et mesures répétées

Pour un biomarqueur sanguin d’infarctus :

- l’Observable Concept est la propriété ou concentration définie ;
- le Biomarker Role qualifie son usage comme indicateur dans le contexte précis ;
- la méthode de laboratoire est versionnée séparément ;
- une Variable unique définit la mesure dans le projet ;
- T0, H6, H12 et H24 sont des repères attendus ;
- chaque participant peut produire plusieurs Occurrences de cette même Variable.

La Variable ne devient pas quatre Variables. Un changement réel de méthode, d’unité ou de définition peut en revanche nécessiter une révision.

### 19.4 Cas D — Fécothèque

La création d’une collection de selles produit des Biospecimens avec identités, collectes, conditions, disponibilités et aliquots éventuels. La fécothèque n’est pas une Variable. La collecte n’est pas une occurrence scientifique tant qu’aucune propriété définie n’est enregistrée comme Variable.

La possibilité d’analyses futures est un Data Need exploratoire, une Option ou une finalité de conservation. Elle ne devient ni une Analyse sélectionnée, ni un résultat, ni une promesse de connaissance.

### 19.5 Cas E — Étude sans imagerie

Une étude clinique ou biologique suit la même architecture : Scientific Model, Observable Concepts, méthodes cliniques ou de laboratoire, Data Needs, Variables et Occurrences. Imaging n’est activé que si une méthode d’imagerie est nécessaire.

Ce cas démontre que l’Observability & Measurement Model ne peut pas être possédé par Imaging. Imaging en est un contributeur spécialisé.

### 19.6 Cas F — Variable commune CRF / Biostatistics

Une Variable adoptée pour le projet possède un seul `variableId`. Le CRF la projette comme champ de recueil ; le Data Dictionary en expose la définition ; le SAP la référence comme entrée ou dérivation ; le jeu d’analyse conserve son identité ou crée explicitement une Variable dérivée reliée aux sources.

Les différences de libellé sont des `displayLabel` ou alias. Aucun document ne redéfinit la Variable. Les Occurrences recueillies restent distinctes de cette identité et sont les entrées de l’Analyse.

---

## 20. Contrats normatifs proposés

Ces contrats sont préparés pour une future admission ; ils ne sont pas encore opposables.

| ID | Contrat |
|---|---|
| PD003R1-C01 | Knowledge unit is not a Scientific Model. |
| PD003R1-C02 | Scientific Model references Knowledge. |
| PD003R1-C03 | Phenomenon is not its observable. |
| PD003R1-C04 | Observable is not automatically a Biomarker. |
| PD003R1-C05 | Biomarker validity is contextual. |
| PD003R1-C06 | Observable is not a Variable. |
| PD003R1-C07 | Variable belongs to a Project context. |
| PD003R1-C08 | Variable definition is not realized data. |
| PD003R1-C09 | Routine Care does not become Study Mandated silently. |
| PD003R1-C10 | Specimen is not Variable. |
| PD003R1-C11 | One Variable identity across projections. |
| PD003R1-C12 | CDM represents data; it does not own scientific truth. |
| PD003R1-C13 | Analysis owner remains specialized. |
| PD003R1-C14 | Unknown and contradiction survive every boundary. |
| PD003R1-C15 | External standards map to NOXIA objects; they do not replace NOXIA scientific reasoning. |
| PD003R1-C16 | A candidate mechanism is neither a Knowledge assertion nor a universal truth. |
| PD003R1-C17 | A Data Need does not create a Variable automatically. |
| PD003R1-C18 | A repeated timepoint does not create a second Variable identity. |
| PD003R1-C19 | Biospecimen collection does not imply a selected analysis. |
| PD003R1-C20 | Analysis specification, result and interpretation remain distinct. |
| PD003R1-C21 | Every derived occurrence retains its source occurrences, method, version and quality lineage. |
| PD003R1-C22 | A projection may rename for display; it may not create a second semantic identity. |

---

## 21. Compatibilité historique

### 21.1 Éléments compatibles sans changement de philosophie

- Scientific Model peut être ajouté sans modifier la définition du Knowledge Graph si les références remplacent toute copie de preuves.
- Variable d’étude peut être clarifiée comme définition sans créer un second objet.
- Occurrence de variable, Data Need, méthode générique, Biospecimen, temporalité et mappings externes peuvent être préparés de manière additive.
- Analyse peut rester un type générique avec owners spécialisés.

### 21.2 Élément incompatible

La transformation du Biomarqueur en rôle contextuel d’un Observable Concept modifie le sens constitutionnel actuel. Une simple règle de compatibilité ne suffit pas.

### 21.3 Préservation des versions historiques

Les stratégies, décisions, projections et rapports existants restent interprétés selon la version de PD-003 et du manifeste qui leur était applicable. Ils ne sont jamais réécrits pour donner l’impression que la distinction Observable Concept–Biomarker Role existait déjà.

---

## 22. Migration conceptuelle préparée

### 22.1 Versionnement proposé

En raison du changement de sens du Biomarqueur, l’évolution coordonnée devrait être majeure :

- Scientific Product Manifesto : nouvelle version substantielle, à numéroter explicitement par son autorité humaine ;
- PD-003 : version majeure nouvelle, recommandée `2.0` plutôt qu’une simple correction mineure ;
- les anciennes versions restent consultables et opposables pour leurs usages historiques.

Le nom de mission PD-003R1 ne préjuge pas du numéro de version normatif final.

### 22.2 Règles de compatibilité

1. Tout ancien Biomarqueur reste un objet legacy interprétable.
2. Aucun ancien Biomarqueur n’est séparé automatiquement en Observable Concept et Biomarker Role.
3. Une séparation explicite produit une correspondance vérifiée, un auteur, une date, un domaine et un statut.
4. Une Variable historique est interprétée comme définition si son contenu le permet ; toute valeur mêlée doit être isolée uniquement avec provenance démontrée.
5. Deux Variables historiques portant des temps différents ne sont pas fusionnées automatiquement.
6. Les termes Observation historiques sont qualifiés par contexte ; une ambiguïté non résolue reste `AMBIGUOUS_REQUIRES_ARBITRATION`.
7. Les méthodes existantes Imaging conservent leurs identités et deviennent des spécialisations explicites, sans réécriture silencieuse.
8. Les anciennes projections conservent leurs libellés et leur version source.
9. Toute conversion interdit l’augmentation du niveau de preuve ou de certitude.
10. Tout mapping vers un standard externe est versionné séparément de la migration interne.

### 22.3 Supersession

Chaque nouvel objet ou relation indique ce qu’il remplace, spécialise ou contextualise. `supersedes` ne signifie jamais suppression de l’original. Les objets legacy restent accessibles pour replay, audit et interprétation historique.

### 22.4 Frontière de migration

La future migration réelle devra être une mission séparée après :

- adoption du manifeste révisé ;
- admission de PD-003 révisé et mise à jour de l’index ;
- inventaire des objets réellement représentés ;
- politique de mapping approuvée ;
- validation de non-duplication ;
- stratégie de rollback et preuve de conservation historique.

Aucune migration réelle n’est réalisée ici.

---

## 23. Impacts sur les moteurs et documents

| Domaine | Impact préparé | Frontière préservée |
|---|---|---|
| Knowledge | fournir identités, assertions, relations, preuves, limites et versions aux modèles et à OBS | ne construit ni modèle adopté, ni Data Need, ni Variable |
| Scientific Thinking | proposer Scientific Models candidats et mécanismes qualifiés | une hypothèse candidate ne devient pas assertion Knowledge |
| Imaging | proposer phénomènes, méthodes Imaging, Variables et qualité selon OBS | ne possède pas tous les observables ni les occurrences réelles |
| Study Design / PRJ | posséder Data Needs, Variables, temps attendus et décisions de projet | ne redéfinit pas Knowledge ni la méthode spécialisée |
| REG-001 | consommer les faits de projet, données et échantillons nécessaires à l’applicabilité | ne crée ni Observable, ni Variable, ni occurrence |
| DOC-002 | conserver ses patterns documentaires | une observation documentaire ne devient pas occurrence d’étude |
| TMP-001 | composer une structure depuis Project, REG et DOC-002 | ne crée ni identité de Variable ni contenu scientifique |
| DOC-001B | projeter passivement les identités et statuts | ne résout aucune ambiguïté ou mapping |
| VAL-000 | ajouter ultérieurement des invariants de frontière et d’identité | diagnostic seulement ; aucune correction ni admission automatique |
| futur OBS | gouverner la signification d’observabilité et les méthodes | ne collecte pas de données et ne décide pas les priorités Project |
| futur CDM | représenter occurrences, provenance, qualité et lignage | ne possède pas la vérité scientifique |
| futur Data Management | définir structure, intégrité, transformations et sources | ne choisit pas le rôle biomarqueur ou l’inférence |
| futur Biostatistics | définir analyses statistiques et dimensionnement | ne redéfinit ni Variable, ni observable, ni phénomène |

### 23.1 État réellement documenté

- ST-001 produit des questions, hypothèses, objectifs et mécanismes candidats, avec une projection déclarée sans nouvelle ontologie.
- IMG-001/IMG-001B produisent des chaînes Imaging candidates et distinguent déjà non-évaluabilité, Variables et contributions aux critères, mais restent subordonnés à PD-003.
- PRJ-001 porte Variables, Data Requirements et Analysis Requirements ; ses Data Requirements sont des handoffs d’implémentation, pas encore l’objet canonique Data Need.
- REG-001 conserve les inconnues et l’ownership réglementaire.
- DOC-002, TMP-001 et DOC-001B conservent la vérité du Research Project et restent passifs sur le fond.
- VAL-000 est disponible dans un worktree séparé et ne constitue pas une validation admise dans le dépôt courant.
- Aucun Scientific Model canonique, OBS-001, CDM-001, moteur Data Management général ou moteur Biostatistics général n’est admis par le présent worktree.

---

## 24. Impacts sur OBS

OBS-001 devra, après admission normative :

1. consommer des références Knowledge versionnées ;
2. représenter Observable Concepts sans recopier leur autorité scientifique ;
3. qualifier les méthodes, conditions, formes de résultat et limites ;
4. représenter Biomarker Role séparément de la simple observabilité ;
5. accepter les domaines non Imaging ;
6. conserver méthodes candidates, retenues, rejetées et alternatives ;
7. propager inconnues et contradictions ;
8. produire des Contributions vers le Research Project ;
9. ne créer aucune Variable sans Décision de projet ;
10. ne créer aucune Occurrence ;
11. ne choisir aucune analyse statistique ;
12. ne transformer aucune mesurabilité en validité biomarqueur.

OBS-001 reste interdit tant que le manifeste et PD-003 n’ont pas admis la distinction Observable Concept–Biomarker Role.

---

## 25. Impacts sur CDM

CDM-001 devra, après admission normative :

- référencer l’identité et la version des Variables ;
- représenter les Occurrences avec unité, occasion, méthode, source, valeur ou statut, qualité et provenance ;
- distinguer attendu, recueilli, absent, invalide, rejeté, dérivé et corrigé ;
- conserver les temps d’acquisition, collecte, transformation et analyse ;
- représenter les Biospecimens et leur lignage sans les assimiler à des Variables ;
- conserver le mandat et le contexte de source sans transformer le soin courant en procédure d’étude ;
- conserver les relations de dérivation ;
- exposer les mappings externes sans remplacer les identités NOXIA ;
- fournir des entrées aux owners spécialisés sans choisir leurs méthodes ;
- préserver toutes les versions historiques et leurs corrections.

CDM-001 reste interdit tant que Variable d’étude et Occurrence de variable d’étude ne sont pas normativement séparées.

---

## 26. Impacts Biostatistics et Data Management

### 26.1 Biostatistics

Biostatistics consomme Questions, Hypothèses, Critères, Variables, repères temporels, Occurrences qualifiées, règles de missingness et décisions. Il possède les propositions d’estimands, modèles, populations d’analyse, covariables, sensibilités et dimensionnement.

Il ne possède jamais :

- l’identité scientifique d’une Variable ;
- la décision d’utiliser un Observable Concept comme biomarqueur ;
- la correction de la provenance d’une occurrence ;
- l’interprétation humaine finale.

### 26.2 Data Management

Data Management possède les propositions de structure, intégrité, source, qualité, validation, transformation et lignage. Il assure que l’identité de Variable traverse les projections et que les Occurrences restent reconstructibles.

Il ne possède jamais :

- le Scientific Model ;
- la preuve Knowledge ;
- le rôle biomarqueur ;
- le Critère adopté ;
- le choix de l’analyse statistique ;
- la conclusion scientifique.

### 26.3 Handoff commun

Toute transformation Data destinée à Biostatistics conserve : Variable source, Occurrences sources, méthode, version, qualité, exclusion, correction, temporalité et décision applicable. Une Variable dérivée reçoit une identité propre uniquement si sa définition change réellement.

---

## 27. Contradictions restantes

| ID | Contradiction ou question | État |
|---|---|---|
| PD003R1-A01 | Manifeste : biomarqueur observable ; cible : biomarqueur rôle d’un observable | `BLOCKING — HUMAN_ARBITRATION_REQUIRED` |
| PD003R1-A02 | Observable Concept objet autonome ou contextualisation d’un concept Knowledge | cible proposée, contrat détaillé OBS requis |
| PD003R1-A03 | Scientific Model réutilisable hors projet : owner institutionnel non nommé | mandat de gouvernance futur requis |
| PD003R1-A04 | Source de données : objet PD-003 ou objet CDM spécialisé | `AMBIGUOUS_REQUIRES_ARBITRATION` |
| PD003R1-A05 | Taxonomie Biospecimen et statut de DNA/RNA | architecture spécialisée future requise |
| PD003R1-A06 | Résultat analytique complexe non réductible à une Variable dérivée | à arbitrer avec Biostatistics/CDM |
| PD003R1-A07 | Numérotation de la nouvelle version du manifeste | autorité humaine constitutionnelle requise |
| PD003R1-A08 | Préfixe de mandat présent dans le fichier SKM-000 non suivi | anomalie documentaire hors périmètre, à traiter séparément |

Aucune de ces questions n’est masquée par une admission partielle.

---

## 28. Évolution nécessaire du Scientific Product Manifesto

### 28.1 Qualification

`MANIFESTO_EVOLUTION_REQUIRED`

La modification doit être substantielle, explicite et décidée par l’autorité humaine compétente. Elle ne doit pas être présentée comme une correction éditoriale.

### 28.2 Modification conceptuelle préparée

Le chapitre 44 peut conserver le principe selon lequel le phénomène n’est pas directement observable. Le chapitre 45 doit remplacer la proposition « les biomarqueurs représentent les observables » par le contrat suivant :

> Les concepts observables représentent les propriétés, construits ou catégories susceptibles d’être observés, estimés ou classés. Un biomarqueur est l’usage contextualisé et soutenu par des preuves d’un concept observable comme indicateur d’un phénomène biologique, d’un état, d’une exposition ou d’une réponse. Un concept observable n’est pas automatiquement un biomarqueur. La validité biomarqueur dépend du phénomène ciblé, de la population, du temps, de la méthode, de l’usage, des facteurs de confusion, du domaine de validité et du niveau de preuve.

Le chapitre 46 doit préciser qu’une modalité contribue à observer ou estimer un Observable Concept par une méthode donnée ; elle n’observe pas automatiquement un biomarqueur valide dans tout contexte.

Le chapitre 47 doit remplacer la chaîne linéaire unique par deux relations coordonnées :

- Phénomène biologique → est informé, dans un contexte, par un Biomarker Role utilisant un Observable Concept ;
- Observable Concept → est observé ou estimé par une Méthode, éventuellement rattachée à une Modalité et une Acquisition.

Le chapitre 42 doit ajouter au vocabulaire fondamental, après décision constitutionnelle : Scientific Model, Observable Concept, Méthode d’observation ou de mesure, Besoin de données du projet, Variable d’étude comme définition, Occurrence de variable d’étude et Biospecimen.

Les chapitres 12, 22, 41, 45, 46, 47, 53, 54, 71, 84, 95, 99, 109, 114, 121 et l’Appendice A devront recevoir une analyse d’impact sémantique afin de préserver la philosophie « comprendre avant de mesurer » tout en supprimant les chaînes devenues ambiguës.

### 28.3 Ce qui ne change pas dans le manifeste

- le phénomène reste distinct de sa mesure ;
- le contexte fait partie de la connaissance ;
- la méthode influence le résultat ;
- le chercheur reste décisionnaire ;
- le protocole reste une projection de la stratégie ;
- les preuves, limites, incertitudes et controverses restent visibles ;
- l’imagerie reste un domaine où la méthode participe à la connaissance produite ;
- aucune modalité ou technique ne devient un objectif.

### 28.4 Opération documentaire requise

Après arbitrage humain positif, l’opération constitutionnelle devra :

1. modifier le DOCX maître du Scientific Product Manifesto ;
2. enregistrer une nouvelle version substantielle et un historique de modification de fond ;
3. régénérer et vérifier le PDF dérivé ;
4. mettre à jour le SOURCE-OF-TRUTH-INDEX ;
5. analyser les impacts sur PD-003, PD-004, PD-005, RDE-003, KE-001 et les documents consommateurs ;
6. seulement ensuite faire évoluer PD-003 dans une opération coordonnée.

Cette autorité n’est pas incluse dans le mandat présent. Aucune modification constitutionnelle n’est exécutée.

---

## 29. Gouvernance et SOURCE-OF-TRUTH-INDEX

### 29.1 État de la présente opération

- PD-003 reste la référence normative courante, inchangée.
- Le Scientific Product Manifesto reste en version 1.0, inchangé.
- Le SOURCE-OF-TRUTH-INDEX reste en version 1.25, inchangé.
- Le présent rapport reste candidat non admis et ne crée aucune autorité.
- SKM-000 reste candidat non admis.
- Aucun objet ou contrat proposé ici n’est opposable.

### 29.2 Mise à jour future préparée

Si l’arbitrage constitutionnel est positif puis PD-003 évolue, l’index devra, dans la même opération :

- enregistrer les nouvelles versions du manifeste et de PD-003 ;
- nommer les sources maîtresses et éditions dérivées ;
- déclarer explicitement la supersession et l’interprétation legacy ;
- enregistrer le niveau, le statut et le domaine de la nouvelle norme ;
- lister les dépendances vers Knowledge, Scientific Thinking, Imaging, Project, OBS, CDM, Data Management et Biostatistics ;
- identifier les consommateurs PD-004/005/009/011, RDE-001/002/003, KE-001, REG-001, DOC-002, TMP-001, DOC-001B et VAL-000 ;
- recalculer les comptes documentaires à partir des artefacts réellement admis ;
- conserver les anciennes versions et leur période d’autorité.

Il est interdit de préinscrire cette évolution avant sa décision.

---

## 30. Limitations

1. Le rapport arbitre un modèle conceptuel ; il ne crée aucun moteur, aucune interface et aucune migration.
2. Aucune campagne PD-011 n’évalue cette architecture ; aucun PASS scientifique n’est revendiqué.
3. Les objets candidats ne disposent pas encore d’autorité humaine nommée pour leur gouvernance durable.
4. La taxonomie des sources et des Biospecimens reste à spécialiser ; aucune liste n’est admise par anticipation.
5. Le modèle de résultat analytique complexe reste à coordonner avec les futures architectures Biostatistics et CDM.
6. L’objet Source de données d’étude reste à arbitrer afin d’éviter un doublon entre PD-003 et CDM.
7. Les documents d’implémentation consultés décrivent des snapshots ; ils ne prouvent pas une conformité future au modèle proposé.
8. VAL-000 se trouve dans un worktree séparé et ne constitue ni une admission dans le worktree courant, ni une validation de la présente mission.
9. Le fichier SKM-000 courant possède une anomalie de préfixe documentaire et reste non admis ; son corps architectural a été utilisé uniquement comme proposition candidate.
10. La modification constitutionnelle nécessaire dépasse le mandat présent.

---

## 31. Décision finale

PD003R1_REQUIRES_MANIFESTO_ARBITRATION
