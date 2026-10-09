# Périmètre de release et matrice des blocages

Décision utilisateur du 9 octobre 2026, applicable à la préparation de release NOXIA. La réouverture des anciennes conversations Production v3 dans le workspace v4 n’est pas une exigence de release. La continuité des sessions Preview existantes et la récupération fonctionnelle des nouvelles données Production v4 restent obligatoires.

Cette clarification actualise le périmètre du rapport de préparation committé dans `1cd036b95947129073b4a132b651c74de1bf329f`, dont le code qualifié est `582fdee5ef823dea3e900c5aa852a72133e2b60e`. Elle ne change ni les résultats techniques historiques ni les autorités métier. La copie locale de `REPORT.md`, déjà vide à l’ouverture de cette mission, reste inchangée; son contenu committé demeure conservé dans Git.

## Matrice actualisée

Les états techniques ci-dessous sont ceux du rapport de préparation précédent, pas une nouvelle qualification de déploiement ou de données réelles. Seuls le périmètre et les critères de release sont actualisés ici.

| Exigence ou gate | Statut après décision | Effet sur la release |
| --- | --- | --- |
| Réouvrir les anciennes conversations Production v3 dans v4 | NOT_REQUIRED_BY_USER_DECISION | Retiré des exigences et des blockers. Aucune migration complète v3 vers v4 à développer ou qualifier. |
| Conserver les données legacy existantes | REQUIRED_UNCHANGED | Aucune suppression, réécriture ou conversion silencieuse autorisée. |
| Continuité des sessions et études Preview existantes | REQUIRED_ESSENTIAL | Maintenir l’origine Preview stable et les mécanismes d’accès autorisés; le déploiement ne doit pas imposer une étude de remplacement. |
| Continuité Preview des Projects, documents, archives, Working Revisions et opérations fournisseur | REQUIRED_ESSENTIAL | Préserver identités, bindings, historiques et états récupérables; ne pas régénérer les documents ni répéter les appels pour compenser une perte de continuité. |
| Préservation et récupération fonctionnelle des nouvelles données Production v4 | REQUIRED_OPEN | Le rollback fonctionnel demeure partiel : l’ancien frontend v3 ne découvre pas v4/Studio. Ce manque reste un gate de release. |
| Schéma, droits DDL et migrations Production | OPEN_UNCHANGED | Répétition locale 001–005 réussie; catalogue actuel, droits/verrous DDL lazy et exécution Production restent à autoriser et vérifier. |
| Backup, restauration et preuves d’opérations payées | OPEN_UNCHANGED | PITR/restore et continuité des données/bindings doivent être démontrés sans perdre les preuves nécessaires à la reprise. |
| Configuration modèle et qualification fournisseur Production | OPEN_UNCHANGED | Stratégie de modèle à choisir; readiness réelle UNKNOWN. |
| Admission, coûts, capacité WD et transcription | OPEN_UNCHANGED | Arbitrages financiers précédents inchangés; transcription hors guard durable à traiter selon décision explicite. |
| Périmètre scientifique de la release | OPEN_UNCHANGED | Choix entre qualification scientifique réelle bornée et périmètre initial explicitement limité toujours requis. |
| Réconciliation des comportements main | OPEN_UNCHANGED | Dispositions produit/scientifiques restantes à arbitrer; aucune intégration automatique. |

Le correctif de consultation legacy en lecture seule déjà committé reste une capacité existante non requise pour la release. Cette décision n’ordonne ni son retrait ni son extension. Aucune nouvelle dépense de développement n’est affectée à une migration complète Production v3 vers v4.

## Critère de continuité Preview

Une future opération de déploiement Preview doit permettre de reprendre la même session et la même étude, avec le même Project, les versions documentaires historiques et actuelles, les drafts/saves/intents et le ledger fournisseur. Le rechargement doit retrouver ces états sans recréer les identités ni les générations.

L’alias stable existant `https://noxia-preview-cdeb-imgs-projects.vercel.app` reste l’origine à préserver. Un alias ne transfère pas à lui seul les sauvegardes ou preuves d’accès browser-local depuis une autre origine. Tout transfert encore nécessaire doit rester dans un mécanisme existant et une autorisation exacte, sans secret dans les rapports ni contournement d’ownership. Les données durables et les éléments browser-local sont deux dépendances distinctes de la continuité.

La réutilisation d’un résultat fournisseur ou d’une préparation reste soumise aux identités et contrats natifs exacts. La minimisation des appels ne permet ni matching approximatif, ni adoption d’un ancien résultat invalide, ni reprise automatique d’une opération incertaine. Cette mission n’exécute aucun transfert, retry ou génération.

## Frontière du rollback Production

La non-exigence de récupération des anciennes conversations v3 ne dispense pas de préserver les nouvelles données v4. Une redirection de trafic vers l’ancien runtime n’est pas une preuve de récupération fonctionnelle après création de travail v4.

La stratégie de rollback doit conserver les Projects v4, documents/archives, Working Revisions, intents et preuves fournisseur, ainsi que les moyens d’accès nécessaires à leur récupération par un runtime compatible. Elle ne doit ni les supprimer ni les masquer définitivement, ni recréer un Project parallèle comme continuation supposée. La limitation de l’ancien runtime, les prérequis backup/restore et la protection contre les redispatchs après restauration restent ouverts dans leur portée propre.

## État de release après clarification

```text
PRODUCTION_V3_CONVERSATION_RECOVERY_REQUIRED = NO
FULL_PRODUCTION_V3_TO_V4_MIGRATION_PLANNED = NO
LEGACY_DATA_DELETION_AUTHORIZED = NO

PREVIEW_SESSION_CONTINUITY_REQUIRED = YES
PREVIEW_PROJECT_DOCUMENT_REVISION_LEDGER_CONTINUITY_REQUIRED = YES
STABLE_PREVIEW_ORIGIN_REQUIRED = YES
UNNECESSARY_PROVIDER_REGENERATION_ALLOWED = NO

NEW_PRODUCTION_V4_DATA_PRESERVATION_REQUIRED = YES
FUNCTIONAL_ROLLBACK_REQUIRED = YES
FUNCTIONAL_ROLLBACK_GAP = OPEN_UNCHANGED

PRODUCTION_V3_RECOVERY_RELEASE_BLOCKER = NO
OTHER_RELEASE_GATES = UNCHANGED
READY_FOR_PRODUCTION_AUTHORIZATION = NO

PRODUCT_CODE_CHANGED_THIS_MISSION = NO
PROVIDER_CALLS_THIS_MISSION = 0
DB_WRITES_THIS_MISSION = 0
DEPLOYMENT_THIS_MISSION = NO
PRODUCTION_CHANGED = NO
```

Prochaine action : poursuivre les gates restants et vérifier la continuité Preview lors des prochains déploiements autorisés, sans ouvrir de nouveau chantier de migration des conversations Production v3.
