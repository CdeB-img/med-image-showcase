# DM-001 — Quality, Query, Correction and Reconciliation Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — QUALITY_QUERY_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/dm-001-study-data-management-architecture.md` |

## 1. Quatre plans de contrôle

| Plan | Exemples | Owner de la règle | Sortie DM |
|---|---|---|---|
| Structurel | type, format, domaine, unité, présence, cardinalité, référence | CDM/collection | PASS ou finding, jamais correction implicite |
| Contextuel | temps, visite, population, source, méthode, centre, applicabilité | Project/CDM/domaines | observation et finding contextualisés |
| Scientifique/domaine | validité de mesure, QC Imaging/laboratoire/Core Lab | OBS/domaine compétent | critère/version et résultat transportés |
| Utilisabilité analytique | disponibilité pour population/modèle/analyse | Biostatistics/humains | préparation et limites ; aucune décision statistique autonome |

DM possède l’exécution et le suivi des contrôles, pas nécessairement le sens de leur règle.

## 2. DataQualityFinding

Un finding contient cible, règle/version/owner, observation, sévérité, statut, preuves, impact, owner de résolution, dates et disposition. Il ne modifie rien et n’établit pas seul une erreur scientifique.

Les statuts au minimum distinguent ouvert, en revue, en attente de réponse, résolu, accepté avec limitation, non résolu, fermé et réouvert. Une clôture ne supprime pas l’historique.

## 3. DataQuery

Une query porte question, cible, finding/source, justification, destinataire, acteurs, dates, statut, réponse, pièces, résolution, fermeture et réouverture. Elle est une enveloppe de décision opérationnelle.

- Ouvrir une query ne modifie aucune occurrence.
- Répondre ne rend pas automatiquement la réponse vraie ou applicable.
- Résoudre exige l’évaluation de la preuve et l’owner/mandat appropriés.
- Fermer conserve question, réponses, décision, auteur et date.
- Réouvrir crée un nouvel événement et une raison, sans effacer la clôture antérieure.

## 4. DataCorrectionRecord

Une correction conserve obligatoirement ancienne valeur/ancien état, nouvelle valeur/nouvel état, occurrence cible, source de correction, acteur, mandat, raison, date, preuves, impact, supersession et audit. Si le changement affecte une transformation, un snapshot, un freeze, un lock, un release ou une analyse, l’impact est propagé comme besoin de revue ; aucun résultat aval n’est réécrit silencieusement.

Correction, conversion, recodage et dérivation restent des opérations distinctes. Une correction sémantique potentielle retourne au Project/OBS/domaine avant application.

## 5. ReconciliationRecord

Une réconciliation conserve les identités et versions de toutes les sources, les éléments comparés, la règle de comparaison, les différences, leur qualification, les queries, la décision, sa justification, son owner, le résultat et les éléments non résolus.

Le rapprochement n’applique aucune priorité de source cachée. Une règle déterministe peut trancher seulement si elle est versionnée, applicable et autorisée ; sinon une décision humaine est requise. Les sources et leurs valeurs restent reconstructibles après production d’un résultat canonique.

## 6. Missingness et invalidité

DM applique le vocabulaire CDM-001 : la raison factuelle ne devient jamais une stratégie statistique. `NOT_APPLICABLE`, `NOT_COLLECTED`, `NOT_AVAILABLE`, `NOT_EVALUABLE`, `INVALID`, `LOST`, `WITHDRAWN`, `SOURCE_MISSING`, `TECHNICAL_FAILURE` et `UNKNOWN_REASON` ne sont pas interchangeables.

Une valeur présente mais invalide ne devient pas une absence de collecte. Une valeur absente n’est jamais imputée par DM. Si une query apporte une source nouvelle, la nouvelle version conserve la raison et l’état précédents.

## 7. Qualité domaine et Core Lab

DM peut recevoir des résultats QC, seuils, statuts ou recommandations opérationnelles d’Imaging, laboratoire ou Core Lab avec owner, méthode, version et limitation. Il ne généralise pas un critère local, ne recommande pas un paramètre constructeur et ne transforme pas un finding technique en conclusion scientifique.

Les patterns attendus/reçus, feedback/action/clôture et QC séquence par séquence de DOC-000D sont `OPERATIONAL_PATTERN` ou `LOCAL_PRACTICE`, jamais norme générale.

## 8. Handoff analytique

DM transmet qualité, missingness factuel, exclusions déjà décidées par owner compétent, queries ouvertes/fermées, corrections, réconciliations, limitations et versions. Biostatistics décide populations, exclusions analytiques supplémentaires, imputation, modèles et sensibilités. Un statut « usable » préparé par DM n’est pas une décision d’analyse sans la règle et l’owner applicables.

## 9. Invariants ciblés

- finding ≠ query ≠ réponse ≠ correction ≠ réconciliation ;
- aucun finding n’est corrigé automatiquement ;
- aucune réponse n’est promue sans disposition ;
- aucune correction ne détruit l’avant ;
- aucune réconciliation ne masque ses sources ;
- aucun contrôle DM ne modifie une MeasurementDefinition ou un BiomarkerRole ;
- aucune moyenne de qualité ne compense une violation bloquante définie par son owner.
