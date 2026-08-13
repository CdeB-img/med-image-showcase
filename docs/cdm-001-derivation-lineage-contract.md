# CDM-001 — Derivation & Lineage Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — DERIVATION_LINEAGE_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | CDM-001 ; PD-003 V2 Relationship Catalog |

## 1. Classification

`Transformation` n’est pas admise comme objet racine. Sa définition est portée, selon le sens, par une Règle méthodologique/de calcul, une MeasurementDefinition dérivée ou une AnalysisSpecification. Son exécution est une sous-ressource liée aux VariableOccurrences ou à AnalysisExecution.

Un dataset est une projection matérialisée ; une conversion/harmonisation est une transformation ; une Variable dérivée est une CanonicalVariable décidée par le Project ; un effet/statistique globale est un AnalysisResult.

## 2. Contrat de transformation

| Champ conceptuel | Exigence |
|---|---|
| transformationId | identité locale/versionnée d’exécution |
| type / owner | opération et responsabilité explicites |
| inputOccurrenceRefs / versions | ensemble exhaustif et gelé |
| rule/algorithmRef / version | définition gouvernée, jamais texte implicite |
| parameters / context | paramètres et environnement déterminants |
| outputOccurrenceRefs | produits exacts |
| time | exécution et effet documentaire |
| quality checks | règles, résultats, warnings |
| limitations / provenance | contexte, sources, restrictions |
| supersession | exécution/règle remplacée sans effacement |

## 3. Test dérivation / analyse

| Question | Dérivation CDM | Analysis |
|---|---|---|
| unité de sortie | une unité étudiée | population/contraste/statistique possible |
| règle | préspécifiée et réutilisable | modèle/estimand/spécification analytique |
| dépendance centrale | indépendante de la comparaison principale | dépend de population/comparaison |
| sortie | CanonicalVariable/Occurrence | AnalysisResult |
| incertitude inférentielle | non constitutive | souvent constitutive |
| owner | Project/CDM/Data selon acte | Biostatistics/domaine analytique |

BMI, ECV, score, volume, delta ou ratio ne sont classés qu’après ce test. `Baseline-adjusted` peut être une transformation analytique ou un résultat selon la spécification ; aucun classement lexical n’est autorisé.

## 4. Graphe de lignage

Le graphe réutilise `DERIVED_FROM`, `PRODUCED_BY`, `COLLECTED_FROM`, `USES_BIOSPECIMEN`, `CONSUMED_BY_ANALYSIS`, `PRODUCES_RESULT`, `MAPPED_TO_STANDARD` et `SUPERSEDES`. Les chaînes `DERIVED_FROM` et `SUPERSEDES` sont acycliques dans une version.

Chaque nœud conserve id, version, owner, statut, contexte, provenance et restrictions. Chaque arête conserve rôle, règle/version, décision et date. Un parent ne peut pas être résumé au point de perdre son identité/version.

## 5. Reproductibilité

Mêmes occurrences sources canoniques, mêmes versions, même règle, mêmes paramètres et même contexte déterminant produisent le même résultat canonique dérivé. Une source d’aléa admise doit être explicitée, versionnée et incluse dans l’identité de l’exécution ; elle ne permet pas de revendiquer le déterminisme absent.

## 6. Unit conversion et standardisation

Une conversion conserve valeur/unité source, règle/version, output, précision, arrondi, quality impact et provenance. Une standardisation ou canonicalisation ajoute une représentation reliée ; elle ne réécrit pas la source-native.

Les axes source-native, canonicalized, standardized, quality-controlled, derived et analysis input peuvent coexister. Aucun axe ne prouve validité ou readiness à lui seul.

## 7. Corrections et réexécutions

Toute correction de règle, input ou mapping déclenche une nouvelle exécution/output et une analyse d’impact. Les outputs historiques restent liés à leurs inputs/règles. Un retrait de source marque les descendants affectés et peut imposer réanalyse ; il ne les supprime pas.

## 8. Analysis handoff

CDM → Analysis transmet ids/versions, occurrences, méthodes/sources/temps, unités, qualité, missingness, comparabilité, lineage, freeze/release et provenance. Analysis → CDM retourne specification/execution, inputs, population, parameters, Results, uncertainty, quality, warnings et lineage.

CDM ne choisit ni modèle ni interprétation. Cette annexe remplit le contrat d’analyse sans créer un onzième compagnon distinct.

## 9. Refus et limitations

Sont refusés : dérivation sans parents ; règle/version absente ; cycle ; résultat statistique promu en Variable ; écrasement d’original ; dataset comme source du sens ; reproductibilité revendiquée malgré contexte incomplet. Aucun pipeline exécutable n’est créé.
