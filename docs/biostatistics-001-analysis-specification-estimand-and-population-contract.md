# BIOSTATISTICS-001 — Analysis Specification, Estimand and Population Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — SPECIFICATION_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/biostatistics-001-analysis-architecture.md` |

## 1. AnalysisSpecification

Une `AnalysisSpecification` possède une identité stable et des versions immuables une fois consommées. Son contrat minimal comprend :

- identity, version, title, purpose, owner, status et lifecycle ;
- Project, Objective, Hypothesis, Endpoint et Decision refs exactes ;
- niveau `PRIMARY`, `SUPPORTIVE`, `SENSITIVITY`, `EXPLORATORY` ou `POST_HOC` ;
- estimand ou objet de calcul, population, rôles analytiques et inputs ;
- DatasetRelease attendu et règles de projection d'AnalysisDataset ;
- transformations analytiques, méthode/modèle, hypothèses et diagnostics ;
- missing-data et intercurrent-event strategies ;
- multiplicité, sensibilités et analyses supplémentaires ;
- outputs attendus, uncertainty, limitations et quality criteria ;
- provenance, justifications, unknowns, contradictions, approvals et amendment history.

La spécification ne contient pas de donnée réelle, résultat, log d'exécution ou conclusion.

## 2. Lifecycle et versionnement

`DRAFT → REVIEW_REQUIRED → ADOPTED → FROZEN_FOR_EXECUTION → EXECUTED → SUPERSEDED/ARCHIVED` est un corridor conceptuel, non une enum universelle. Une exécution lie exactement une version. Un amendement crée un successeur, conserve l'ancienne version, indique motif, auteur/mandat, impacts sur release, population, outputs et projections, et qualifie le caractère pré- ou post-observation.

## 3. Estimand

L'Estimand est un `VALUE_OBJECT / SUBRESOURCE` de la spécification. Il porte : identity locale, version, scientific target, population, variable/endpoint, conditions/interventions/expositions et comparateur applicables, temporalité, summary/contrast, intercurrent events et stratégies, uncertainty about definition, exclusions, provenance et justification.

| Plan | Question | Ne doit pas devenir |
|---|---|---|
| Endpoint | qu'est-ce qui juge l'étude ? | estimand complet ou modèle |
| CanonicalVariable | quelle donnée unitaire garde son identité ? | résultat d'effet |
| Estimand | quelle quantité/effet vise-t-on ? | méthode de calcul |
| Model | comment estime-t-on sous hypothèses ? | cible scientifique |
| AnalysisResult | qu'a produit l'exécution ? | conclusion |

Si l'Estimand ne peut être défini sans décision Project, la spécification reste incomplète ; Biostatistics ne complète pas silencieusement.

## 4. AnalysisPopulationDefinition

Le contrat comprend : population Project source/version ; unité d'analyse ; critères analytiques ; période/occasion ; règles de disponibilité/qualité ; déviations ; relations d'exclusion ; countability ; reason/owner par disposition ; version ; provenance ; unknowns ; impact sur estimand et outputs.

Une population analytique est une vue de sélection, jamais une mutation de la population Project ou du DatasetRelease. Une unité exclue reste dans les sources et dans l'audit de disposition. Primary, sensitivity, safety, evaluable ou autres labels n'ont pas de sens universel : leur définition doit être explicite.

## 5. Randomisation, insu et événements intercurrents

La spécification référence les stratégies Project et opérations réelles sans les posséder. Tout usage analytique de l'allocation, de l'insu, d'une levée d'insu ou d'un événement intercurrent porte la source, le temps, la version, le statut et l'effet sur estimand/population. Missingness, déviation, invalidité et changement de méthode restent distincts.

## 6. Pre-specification et post-hoc

Le statut de préspécification est déterminé par une version, un temps de gel et une preuve de décision, jamais par un libellé. Toute analyse née après observation des résultats est `POST_HOC` ou qualifiée plus prudemment si la temporalité est inconnue. Elle reste exploitable comme signal, jamais promue en analyse préspécifiée.

## 7. Refus

Refuser une spécification lorsque : source Project non versionnée ; endpoint/estimand/model fusionnés ; population sans source ; rôle de variable sans CanonicalVariable ; release inconnue ; méthode adoptée par fréquence ; missingness ou multiplicité implicites lorsqu'applicables ; owner/mandat absent ; post-hoc masqué ; output attendu qui constitue déjà un résultat inventé.
