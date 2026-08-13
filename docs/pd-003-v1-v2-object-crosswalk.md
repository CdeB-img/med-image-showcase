# PD-003 — Crosswalk exhaustif des 68 objets V1 vers V2

**Version :** 1.0

**Statut :** `OFFICIAL — compagnon de migration PD-003 V2`

**Autorité :** subordonnée à `docs/pd-003-v2-research-object-model.md`
**Règle :** aucune ligne ne réalise une migration ; toute ambiguïté reste visible.

## 1. Statuts

| Statut | Sens |
|---|---|
| `UNCHANGED` | identité et responsabilité V1 conservées sous le contrat commun V2 |
| `CLARIFIED` | même identité, frontière ou sens rendu plus précis |
| `SPECIALIZED` | même lignée, responsabilité V2 spécialisée ; mapping requis pour les contenus ambigus |
| `SUPERSEDED` | nouvelle création interdite sous ce type ; identité historique conservée |
| `DEPRECATED_TERM` | terme historique déconseillé ou interdit sans qualification, sans suppression de l'identité qu'il désignait |
| `LEGACY_ONLY` | lecture/replay historique seulement |
| `LEGACY_INTERPRETATION` | lecture d'une instance sous les règles V1 qui l'ont créée ; aucune conformité V2 déduite |
| `MIGRATION_REQUIRED` | un consumer doit être adapté avant de produire ou modifier une représentation V2 |
| `NEW_MAPPING_REQUIRED` | aucune conversion automatique sûre |

## 2. Crosswalk

| # | Objet V1 et définition abrégée | Disposition V2 | Identité / owner V2 | Migration | Compatibilité et supersession | Mapping / impact principal |
|---:|---|---|---|---|---|---|
| 1 | **Dossier de recherche** — continuité d'un projet | `SPECIALIZED` | même lignée : `ResearchProject` ; Study Design + humain mandaté | renommage conceptuel compatible | V1 reste alias historique ; aucune seconde identité | agréger modèles adoptés, DataNeeds, Variables et références sans copie |
| 2 | **Acteur du projet** — personne ou instance contributrice | `UNCHANGED` | Project governance | aucune | compatible | clarifier les rôles d'owner, contributor, reviewer et decision-maker |
| 3 | **Mandat décisionnel** — périmètre d'autorité | `CLARIFIED` | Project governance | aucune conversion de mandat implicite | compatible | toute adoption V2 engageante exige acteur, mandat, portée et version |
| 4 | **Situation de recherche** — origine conservée de la demande | `UNCHANGED` | ResearchProject | aucune | compatible | ne pas confondre avec VariableOccurrence ou source scientifique |
| 5 | **Intention scientifique** — finalité poursuivie | `UNCHANGED` | ResearchProject | aucune | compatible | reste distincte du routage runtime `ScientificIntent` |
| 6 | **Contexte du projet** — circonstances applicables | `CLARIFIED` | ResearchProject | axes contextuels conservés séparément | compatible | contextualise modèles, rôles biomarqueurs, méthodes et décisions |
| 7 | **Stratégie scientifique** — agrégat des choix du projet | `CLARIFIED` | ResearchProject | ne pas extraire automatiquement un ScientificModel | compatible ; n'est pas superseded | ScientificModel explique ; Strategy agrège les choix adoptés |
| 8 | **Version de stratégie** — snapshot immuable | `UNCHANGED` | ResearchProject | aucune | compatible | référence les versions exactes des nouveaux objets |
| 9 | **Contribution** — proposition non adoptée | `CLARIFIED` | owner de l'objet cible ; émission par contributeur | aucune promotion | compatible | tout handoff produit une Contribution avant mutation canonique |
| 10 | **Question scientifique** — question confirmée | `UNCHANGED` | Scientific Thinking propose, Project adopte | aucune | compatible | motive ScientificModels, DataNeeds et Analyses |
| 11 | **Objectif scientifique** — finalité examinable | `UNCHANGED` | ResearchProject | aucune | compatible | motive DataNeeds et Critères |
| 12 | **Hypothèse** — proposition examinable | `CLARIFIED` | Scientific Thinking / Project | ne jamais promouvoir en ScientificModel complet | compatible | peut être composant d'un modèle, sans devenir assertion Knowledge |
| 13 | **Pathologie ou condition clinique** — condition de contexte | `UNCHANGED` | Knowledge pour identité ; Project pour usage | aucune | compatible | référence, non copie, dans modèles et rôles |
| 14 | **Structure anatomique** — entité anatomique concernée | `UNCHANGED` | Knowledge / domaine spécialisé | aucune | compatible | ne devient ni ObservableProperty ni source de données |
| 15 | **Population d'étude** — ensemble étudié | `CLARIFIED` | ResearchProject | aucune | compatible | distincte de l'unité d'une VariableOccurrence et de la population d'analyse |
| 16 | **Phénotype** — caractéristique d'une population | `CLARIFIED` | Knowledge / Project | mapping explicite si contenu mesuré | compatible | ne devient pas automatiquement ObservableProperty ou BiomarkerRole |
| 17 | **Phénomène biologique** — processus ou état à comprendre | `CLARIFIED` | Knowledge pour identité ; ScientificModel pour rôle | aucune fusion | compatible | explicitement distinct de l'ObservableProperty |
| 18 | **Plan d'étude** — organisation conceptuelle | `UNCHANGED` | Study Design / Project | aucune | compatible | référence besoins, temps, groupes et analyses |
| 19 | **Groupe d'étude** — sous-ensemble justifié | `UNCHANGED` | ResearchProject | aucune | compatible | peut être unité de planification, pas occurrence individuelle |
| 20 | **Visite ou temps d'observation** — repère de plan | `SPECIALIZED`, `DEPRECATED_TERM` pour « observation » non qualifiée | `Visit` objet + `TemporalAnchor` value object + `ExpectedVariableOccasion` relation | `NEW_MAPPING_REQUIRED` si les sens sont mêlés | identité Visit conservable ; interprétation V1 maintenue | séparer visite, timepoint, fenêtre et temps d'événement |
| 21 | **Intervention ou exposition** — action ou condition étudiée | `UNCHANGED` | ResearchProject / owner spécialisé | aucune | compatible | peut motiver modèles, DataNeeds et temps relatifs |
| 22 | **Biomarqueur** — indicateur mesurable V1 | `SUPERSEDED`, `LEGACY_ONLY`, `LEGACY_INTERPRETATION` | nouvelles créations : `BiomarkerRole` ; OBS/Project/Knowledge coordonnés | `MIGRATION_REQUIRED` pour tout writer V2 ; `NEW_MAPPING_REQUIRED`, aucun split automatique | objet V1 rejouable ; superseded pour V2 | identifier ObservableProperty, cible, usage, méthode, contexte et preuves |
| 23 | **Variable d'étude** — donnée conceptuelle attendue/observée/dérivée | `SPECIALIZED` | même lignée : `CanonicalVariable` ; ResearchProject | séparer toute valeur mêlée avec provenance ; sinon conserver identité | compatible si définition pure | occurrence, source, temps et dérivation deviennent relations/objets distincts |
| 24 | **Critère de jugement** — règle d'évaluation liée à un objectif | `CLARIFIED` | Study Design / Project | aucune | compatible | référence CanonicalVariables et occasions, jamais valeurs implicites |
| 25 | **Modalité d'imagerie** — famille technologique | `CLARIFIED` | Imaging | aucune | compatible | contribue à une MeasurementDefinition ; n'observe pas un BiomarkerRole universel |
| 26 | **Acquisition** — acte/stratégie d'obtention | `CLARIFIED` | Imaging ou domaine de mesure | distinguer plan, exécution et temps | compatible | réalise une méthode Project ; peut produire matière ou occurrences |
| 27 | **Séquence ou technique d'acquisition** — spécialisation de méthode | `SPECIALIZED` | spécialisation de MeasurementDefinition ; owner domaine | mapping de la version et du domaine | compatible | ne devient choix Project que par décision |
| 28 | **Paramètre critique** — réglage influent | `CLARIFIED` | sous-ressource de méthode/acquisition ; owner spécialisé | aucune valeur inventée | compatible | version, domaine, qualité et site restent explicites |
| 29 | **Condition de mesure** — condition influençant la mesure | `CLARIFIED` | MeasurementDefinition ou contexte Project selon portée | qualifier universel vs local | compatible | ne fusionne pas avec source, temps ou qualité |
| 30 | **Protocole d'imagerie** — composition d'acquisitions | `CLARIFIED` | Imaging / ResearchProject | préserver la frontière conceptuelle/exécutable | compatible | ne vaut jamais protocole exécutable par admission V2 |
| 31 | **Site et environnement technique** — capacités locales | `CLARIFIED` | ResearchProject / Operations / Imaging | aucune promotion de déclaration en vérification | compatible | distinct de StudyDataSource et de compatibilité démontrée |
| 32 | **Contrainte** — limite ou condition imposée | `UNCHANGED` | owner du domaine concerné / Project | aucune | compatible | peut restreindre méthode, source, temps ou analyse |
| 33 | **Règle d'harmonisation** — règle de comparabilité | `CLARIFIED` | owner spécialisé + Project | aucune | compatible | porte sur MeasurementDefinitions, sites, sources et qualité |
| 34 | **Contrôle qualité** — vérification et conséquence | `CLARIFIED` | owner spécialisé / Data Management | mapper la cible exacte | compatible | qualité de donnée ≠ validité scientifique ; état attaché aux occurrences/résultats |
| 35 | **Procédure de lecture** — méthode de lecture/mesure | `SPECIALIZED` | spécialisation MeasurementDefinition ; Imaging/Core Lab | identifier spécification vs exécution | compatible | ne contient ni résultat interprété ni inférence statistique |
| 36 | **Analyse** — transformation de Variables V1 | `SPECIALIZED` | même lignée : `AnalysisSpecification` ; owner spécialisé | `NEW_MAPPING_REQUIRED` si exécution/résultat/interprétation mêlés | compatible pour spécification pure | séparer AnalysisExecution, AnalysisResult et ScientificInterpretation |
| 37 | **Dimensionnement** — estimation des unités nécessaires | `CLARIFIED` | Biostatistics | aucune valeur inventée | compatible | spécialisation d'AnalysisSpecification, avec hypothèses/version |
| 38 | **Règle d'interprétation** — règle reliant résultat et sens | `CLARIFIED` | Project/owner scientifique | ne pas la confondre avec interprétation appliquée | compatible | ScientificInterpretation compose règle, résultats, limites et décision |
| 39 | **Information de projet** — fait/contextualisation du projet | `CLARIFIED` | ResearchProject | qualifier source et état | compatible | n'est ni VariableOccurrence ni Knowledge assertion effective |
| 40 | **Besoin d'information** — manque pour poursuivre la conception | `CLARIFIED` | PD-009 / ResearchProject | ne jamais convertir automatiquement en DataNeed | compatible | distinction conversation/design vs information à obtenir par l'étude |
| 41 | **Échange adaptatif** — question/réponse de conception | `UNCHANGED` | PD-009 / UX | aucune | compatible | ne produit pas une VariableOccurrence |
| 42 | **Option** — branche recevable | `UNCHANGED` | owner du domaine / Project | aucune | compatible | peut concerner modèle, rôle, méthode, source ou analyse |
| 43 | **Recommandation** — proposition argumentée | `UNCHANGED` | owner du domaine | aucune promotion | compatible | éclaire une Décision ; ne la remplace pas |
| 44 | **Décision** — adoption/rejet/différé | `CLARIFIED` | humain mandaté | conserver actor, mandate, scope, version | compatible | seule frontière d'adoption engageante du Project |
| 45 | **Justification** — chaîne argumentative | `UNCHANGED` | objet/decision owner | aucune | compatible | référence preuves, limites et alternatives |
| 46 | **Compromis** — comparaison de pertes et bénéfices | `UNCHANGED` | ResearchProject | aucune | compatible | ne produit pas un optimum automatique |
| 47 | **Dépendance** — lien d'impact | `CLARIFIED` | owner de la relation | mapper vers relations typées quand possible | compatible | reste générique uniquement si aucun type plus précis ne s'applique |
| 48 | **Incertitude** — connaissance insuffisante | `UNCHANGED` | owner de l'objet qualifié | projection sur axe épistémique | compatible | ne fusionne pas avec missingness d'occurrence |
| 49 | **Risque** — événement/condition défavorable | `UNCHANGED` | owner du domaine / Project | aucune | compatible | probability inconnue reste inconnue |
| 50 | **Biais** — menace de validité | `UNCHANGED` | owner scientifique / Biostatistics selon type | aucune | compatible | contextualisé par design, mesure ou analyse |
| 51 | **Limite** — borne d'interprétation ou d'usage | `UNCHANGED` | owner de l'objet qualifié | aucune | compatible | traverse tous les handoffs |
| 52 | **Contradiction** — positions incompatibles | `UNCHANGED` | owner de l'arbitrage | aucune résolution automatique | compatible | traverse tous les handoffs jusqu'à décision ou acceptation explicite |
| 53 | **Alerte méthodologique** — signal d'écart | `UNCHANGED` | owner règle/revue | aucune | compatible | diagnostic, jamais correction automatique |
| 54 | **Revue méthodologique** — examen structuré | `UNCHANGED` | reviewer mandaté | aucune | compatible | ne vaut pas adoption ou PASS PD-011 |
| 55 | **Analyse d'impact** — propagation d'un changement | `CLARIFIED` | owner du changement / Project | intégrer nouveaux types et relations | compatible | cible versions, occurrences, résultats et projections sans réécriture |
| 56 | **Événement d'évolution** — fait déclenchant un changement | `CLARIFIED` | owner du domaine / Project | aucune | compatible | les noms runtime restent types de trace, non objets concurrents |
| 57 | **Énoncé de connaissance** — proposition scientifique gouvernée | `UNCHANGED` | Knowledge | aucune | compatible | ne devient ni ScientificModel ni résultat de Project |
| 58 | **Relation scientifique** — lien scientifique qualifié | `UNCHANGED` | Knowledge | aucune | compatible | ScientificModel référence la relation et qualifie son rôle |
| 59 | **Domaine de validité** — périmètre d'applicabilité | `UNCHANGED` | owner de l'objet qualifié | aucune | compatible | obligatoire pour modèle, rôle, méthode et mapping |
| 60 | **Source scientifique** — origine documentaire/experte | `CLARIFIED` | Knowledge | aucune fusion avec StudyDataSource | compatible | source de preuve ≠ source de donnée d'étude |
| 61 | **Preuve scientifique** — résultat/argument extrait et évalué | `UNCHANGED` | Knowledge | aucune | compatible | ne se copie pas dans ScientificModel ou Project |
| 62 | **Synthèse de preuves** — appréciation gouvernée d'un ensemble | `CLARIFIED` | Knowledge | distinguer synthèse runtime, canonique et narrative | compatible | ne devient pas AnalysisResult |
| 63 | **Controverse scientifique** — désaccord persistant | `UNCHANGED` | Knowledge governance | aucune | compatible | modèles concurrents peuvent la référencer sans la résoudre |
| 64 | **État de connaissance effectif** — snapshot applicable | `CLARIFIED` | Knowledge / Project reference | mapper les états sur axes V2 | compatible | immuable, versionné, distinct des états de données |
| 65 | **Règle méthodologique** — exigence de cohérence | `UNCHANGED` | gouvernance méthodologique | aucune | compatible | ne choisit pas l'action à la place de PD-009 |
| 66 | **Profil de projection** — audience et profondeur | `UNCHANGED` | TMP/DOC selon usage | aucune | compatible | ne change jamais identité, statut ou sens |
| 67 | **Projection** — vue dérivée d'une version | `UNCHANGED` | DOC | aucune | compatible | transporte les identités V2, ne les recrée pas |
| 68 | **Rapport scientifique** — projection longue de référence | `UNCHANGED` | DOC | aucune | compatible | résultat documentaire ≠ AnalysisResult ou vérité Project |

## 3. Contrôles de complétude

- Nombre de lignes objet V1 : **68**.
- `Biomarqueur` est la seule lignée V1 placée `SUPERSEDED / LEGACY_ONLY` pour les créations V2.
- `Dossier de recherche`, `Variable d'étude`, `Visite ou temps d'observation`, `Séquence/technique`, `Procédure de lecture` et `Analyse` sont spécialisées sans duplication automatique.
- Toute migration ambiguë porte `NEW_MAPPING_REQUIRED`.
- Aucun objet historique n'est supprimé.

`PD003_V1_V2_CROSSWALK_COMPLETE_68_OF_68`
