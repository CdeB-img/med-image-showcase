# DM-001 — Collection, Source and Ingestion Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — COLLECTION_INGESTION_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/dm-001-study-data-management-architecture.md` |

## 1. Contrat de préparation

Une collecte commence par des références Project/CDM adoptées : DataNeed, CanonicalVariable, ExpectedVariableOccasion, source et méthode prévues, règles, décisions, unknowns et limitations. DM ne complète pas une définition scientifique absente ; il bloque la partie concernée ou demande une décision.

`DataManagementDefinition` gouverne le périmètre, les rôles, sources, règles, procédures, dépendances et approbations. `DataCollectionSpecification` projette ces références vers instruments, champs, instructions, conditions d’affichage et contrôles de saisie.

## 2. Projections déclaratives

| Projection | Entrées maîtresses | Contenu DM | Invariant |
|---|---|---|---|
| eCRF | Project + CDM + OBS/domaines | champs, occasions, contrôles, instructions, conditions | champ ≠ Variable ; capture ≠ occurrence jusqu’à qualification |
| Data Dictionary | CanonicalVariables + domaines de valeur/unité + règles | noms projetés, formats, sources, métadonnées | colonne/libellé ≠ identité |
| Schedule of Activities | ExpectedVariableOccasions + visites/événements | représentation de l’attendu | attendu ≠ réalisé |
| Data transfer specification | sources, variables, formats/mappings et contrôles | contrat d’échange projeté | format externe ≠ modèle canonique |

Chaque champ ou colonne conserve `CanonicalVariableReference` et version ; chaque occasion conserve `ExpectedVariableOccasionReference` ; chaque règle cite son owner. Les projections peuvent varier sans créer de nouvelle identité scientifique.

## 3. Modèle de source

DM distingue obligatoirement : source prévue ; source réellement utilisée ; source primaire ; source dérivée ; système producteur ; fichier/flux reçu ; extraction ; import ; saisie manuelle ; correction manuelle ; réconciliation.

Une source opérationnelle porte au minimum : identité, version, type, owner externe ou interne, contexte, période/horodatage, système producteur, méthode d’accès, restriction, provenance et statut. La disponibilité n’établit ni propriété, ni consentement, ni compatibilité, ni validité scientifique.

## 4. DataIngestionRecord

Chaque lot d’ingestion enregistre : lot, source/version, date/temps, acteur ou runtime, méthode, fichier/flux/extraction, environnement, résultat, erreurs, brut préservé, digest lorsque pertinent, politique d’idempotence, occurrences créées/mises à jour/non modifiées et restrictions.

Le brut est préservé avant parsing ou validation lorsqu’il constitue la preuve reçue. La persistance de la trace n’autorise pas l’usage de son contenu. Les secrets, données personnelles et droits d’accès relèvent de gouvernances distinctes non établies par DM-001.

## 5. Idempotence, doublons et versions

- Une opération `SUCCESS` à identité et digest identiques n’est pas rejouée comme création nouvelle.
- Un rejeu reconnu produit un record idempotent et aucune occurrence dupliquée.
- Une différence de contenu sous la même identité produit un conflit de version/finding, jamais un remplacement silencieux.
- Un doublon potentiel reste visible jusqu’à résolution ; la déduplication est une transformation ou correction tracée.
- Un lot partiel conserve ce qui a été reçu, ce qui manque, les erreurs et la reprise autorisée.
- Une reprise ne rejoue que les opérations manquantes ou invalides selon un contrat gelé.

## 6. Données tardives et sources non prévues

Une donnée tardive conserve au moins le temps de l’événement/observation, le temps de capture à la source, le temps d’extraction et le temps d’ingestion lorsqu’ils existent. Sa date d’import ne remplace pas son ancrage scientifique.

Une source réelle différente de la source prévue est enregistrée comme telle. DM produit un finding et une Contribution si l’écart peut modifier le sens, la qualité ou l’usage ; il ne modifie pas le Project. Une source de soins courants ne devient pas source d’étude autorisée par sa seule disponibilité.

## 7. Création ou qualification d’occurrences

L’ingestion peut créer ou qualifier une VariableOccurrence uniquement si la CanonicalVariable, l’unité étudiée, le contexte temporel et la source sont suffisamment référencés. À défaut, l’information reste en zone de réception/revue et ne devient pas une occurrence canonique inventée.

Une occurrence conserve source/méthode réelle, valeur/statuts orthogonaux, unité, temps, qualité, missingness, provenance, parents, corrections et restrictions selon CDM-001. La capture ne change jamais la Variable ni son rôle.

## 8. Contextes couverts

Le contrat est compatible avec collecte prospective, rétrospective, soins courants, registre, imagerie, laboratoire, dispositif, données externes, multicentrique, collecte partielle, imports successifs et données tardives. Il n’impose aucun EDC, fichier, API, base ou fournisseur.

## 9. Refus

DM refuse la promotion canonique si l’identité de Variable, l’unité étudiée, la provenance minimale ou le contexte critique sont absents ; si une ambiguïté modifierait le sens ; si un brut reçu a été altéré sans trace ; ou si une source/autorisation requise n’est pas établie. Le refus conserve le lot et son diagnostic sans inventer les champs manquants.
