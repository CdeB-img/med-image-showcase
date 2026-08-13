# PD-003 V2 — Legacy Compatibility

## Politique normative de coexistence PD-003 V1 / V2

| Champ | Valeur |
|---|---|
| Document | Annexe normative de PD-003 V2 |
| Version | 2.0 |
| État | OFFICIAL — avec limitations explicites |
| Date d'effet documentaire | 12 août 2026 |
| Source de vérité courante | `docs/pd-003-v2-research-object-model.md` |
| Référence historique | `docs/pd-003-research-object-model.md` |

## 1. Décision de compatibilité

PD-003 V2 devient le modèle métier canonique courant. PD-003 V1 demeure une référence historique immuable pour interpréter les objets, décisions et projections produits sous V1.

La compatibilité admise est une **compatibilité de lecture et de traçabilité**, pas une migration automatique. Elle protège l'histoire sans autoriser les créations V1 ambiguës après la date d'effet.

## 2. Règles d'effet

1. Toute mention non versionnée de « PD-003 » postérieure au 12 août 2026 désigne PD-003 V2.
2. Toute interprétation d'un artefact antérieur utilise la version de PD-003 déclarée par l'artefact ; à défaut, sa date, son contexte et les preuves de production doivent être examinés.
3. PD-003 V1 n'est ni supprimé, ni réécrit, ni rétroactivement réputé V2.
4. Un objet V1 conserve son identité historique, son owner, ses décisions et ses liens originaux.
5. Une projection V2 d'un objet V1 doit signaler `LEGACY_V1`, son mapping et toute perte sémantique.
6. L'absence de correspondance certaine se note `NEW_MAPPING_REQUIRED` ou `UNRESOLVED`; elle n'est jamais corrigée par inférence silencieuse.
7. Une nouvelle création conforme V2 n'utilise pas le type racine `Biomarqueur` V1.
8. Aucune donnée, occurrence, relation, décision ou document n'est migré par la présente admission.

## 3. Modes de lecture et d'écriture

| Mode | V1 historique | V2 courant | Règle |
|---|---|---|---|
| Lecture | obligatoire pour les artefacts V1 | obligatoire pour les artefacts V2 | un lecteur de transition doit exposer la version et les limites du mapping |
| Création | fermée pour les types ou relations supersédés ; tolérance uniquement pour compléter une preuve historique sans changer son sens | ouverte sous gouvernance V2 | aucune nouvelle dette V1 ne doit être créée |
| Modification | nouvelle version V1 seulement si exigée pour préserver un dossier historique, avec justification ; sinon mapping V2 | nouvelle version ou supersession V2 | jamais d'écrasement |
| Projection | possible avec badge/version V1 | canonique | une projection ne masque pas le statut legacy |
| Validation | règles historiques + contrôles de mapping | invariants V2 | PASS V1 ne vaut pas PASS V2 |

## 4. États de compatibilité

| État | Signification | Action autorisée |
|---|---|---|
| `UNCHANGED` | même concept et même frontière normative | référence directe avec version |
| `CLARIFIED` | identité conservée, contrat V2 plus précis | compléter les qualifications sans changer le sens historique |
| `SPECIALIZED` | l'objet V1 subsiste mais possède une spécialisation canonique V2 | mapping explicite vers la spécialisation |
| `SUPERSEDED` | le type V1 n'est plus créable comme type canonique courant | lecture historique uniquement ; construction V2 séparée |
| `LEGACY_ONLY` | relation ou usage toléré seulement pour l'histoire | afficher la dette et demander un mapping avant usage V2 |
| `NEW_MAPPING_REQUIRED` | aucune équivalence certaine n'est décidée | suspendre la promotion et demander arbitrage humain |
| `INCOMPATIBLE` | sens contradictoire avec un invariant V2 | refuser la conversion ; conserver l'original historique |

Les qualificatifs d'artefacts legacy suivants complètent ces dispositions :

| Qualificatif | Usage |
|---|---|
| `V1_HISTORICAL` | artefact ou identité interprété sous PD-003 V1, sans présomption de conformité V2 |
| `V1_COMPOSITE_LEGACY` | contenu V1 mélangeant plusieurs responsabilités désormais séparées |
| `MAPPING_REQUIRED` | décision de correspondance nécessaire avant toute consommation V2 engageante |
| `AMBIGUOUS_LEGACY` | plusieurs mappings V2 restent recevables ou les preuves sont insuffisantes |

Ces qualificatifs ne sont pas une enum unique : ils peuvent coexister avec les statuts de cycle, d'applicabilité, de connaissance et de réalisation.

## 5. Mappings à risque élevé

### 5.1 Biomarqueur V1

Le type `Biomarqueur` V1 peut avoir mélangé analyte, propriété, résultat, rôle scientifique, méthode et variable. Il est donc `SUPERSEDED / LEGACY_ONLY` pour les nouvelles créations.

Un mapping V2 doit déterminer séparément, sans obligation de tout produire :

- la cible ou le Phénomène biologique ;
- l'ObservableProperty ;
- la ou les MeasurementDefinitions ;
- chaque BiomarkerRole contextualisé ;
- les DataNeeds du projet ;
- les CanonicalVariables qui les couvrent.

Si ces distinctions ne sont pas démontrables, l'objet reste V1 et `NEW_MAPPING_REQUIRED`. Le libellé commun ne suffit pas à établir une identité.

### 5.2 Variable d'étude V1

La Variable d'étude V1 est spécialisée en `CanonicalVariable`. Le mapping exige une définition stable, un owner Project, le DataNeed couvert, l'unité/domaine, la temporalité attendue et les règles d'absence. Un champ CRF, une colonne ou un paramètre d'analyse ne devient pas automatiquement la variable canonique.

### 5.3 Visite ou temps d'observation V1

L'objet V1 est conservé, mais V2 sépare : événement/visite, `TemporalAnchor`, `ExpectedVariableOccasion`, temps réellement observé et tolérance. Une visite globale ne doit pas être dupliquée comme occasion exacte de toutes les variables.

### 5.4 Analyse V1

`Analyse` est spécialisée en `AnalysisSpecification`. Toute lecture V2 sépare spécification, `AnalysisExecution`, `AnalysisResult` et `ScientificInterpretation`. Un document historique qui confond ces plans reste lisible mais ne peut pas être promu en résultat V2 sans lignage.

### 5.5 Stratégie, Hypothèse et ScientificModel

Ni la Stratégie ni l'Hypothèse V1 ne devient automatiquement un ScientificModel. Le mapping requiert composants, relations, cibles modélisées, alternatives, statut épistémique, provenance, preuves et version. Une phrase explicative isolée reste une hypothèse ou une contribution.

### 5.6 Source scientifique et StudyDataSource

Une `Source scientifique` soutient la connaissance. Une `StudyDataSource` décrit une source de données prévue ou utilisée par un projet. Une même ressource externe peut être référencée dans les deux rôles, mais les identités, mandats, périodes et provenances ne sont pas fusionnés.

## 6. Identité et versionnement

- `sameIdentity` exige continuité de sens, owner et rôle ; un nom stable ne suffit pas.
- `newVersion` conserve l'identité lorsque le sens reste compatible et que l'évolution est réversible par lecture de l'historique.
- `newIdentity` est obligatoire si l'owner, la nature, le rôle ou la définition change substantiellement.
- `SUPERSEDES` relie le remplacement à l'ancien objet sans le supprimer.
- Une occurrence conserve la version de CanonicalVariable qu'elle réalise ; une nouvelle définition ne réétiquette jamais silencieusement les occurrences passées.
- Toute TerminologyMapping conserve versions source/cible, type d'équivalence, contexte, exclusions et décision de revue.

## 7. Compatibilité par famille V1

Le crosswalk exhaustif est porté par `docs/pd-003-v1-v2-object-crosswalk.md`. La synthèse suivante ne le remplace pas.

| Famille | Compatibilité dominante | Point de contrôle |
|---|---|---|
| Projet, adaptation, Knowledge, projection | `UNCHANGED` ou `CLARIFIED` | owner, version, décision et non-promotion |
| ResearchProject | `SPECIALIZED` depuis Dossier de recherche | continuité d'identité décidée par projet |
| Modèles et observabilité | nouveaux objets V2 | aucun backfill sans mapping scientifique |
| Biomarqueur | `SUPERSEDED / LEGACY_ONLY` | scission propriété/mesure/rôle/besoin/variable |
| Variable | `SPECIALIZED` en CanonicalVariable | identité canonique indépendante des projections |
| Temps | `SPECIALIZED` | attendu, observé et tolérance séparés |
| Sources et Biospecimen | nouveaux axes/objet | provenance et identité matérielle explicites |
| Analyse | `SPECIALIZED` et décomposée | spécification, exécution, résultat, interprétation |
| Standards externes | nouvelle relation versionnée | pas d'équivalence sur libellé seul |

## 8. Contrat de transition pour les consommateurs

Tout moteur ou document consommateur doit, avant de déclarer une compatibilité V2 :

1. déclarer les versions V1 et V2 qu'il sait lire ;
2. rendre visible la version source de chaque objet ;
3. distinguer lecture, écriture, projection et validation ;
4. refuser ou signaler les types V1 supersédés lors d'une création V2 ;
5. conserver identités, versions, owners, décisions, sources et provenance ;
6. implémenter les mappings à risque élevé comme décisions explicites ;
7. tester la non-promotion entre modèle, propriété, mesure, rôle, besoin, variable, occurrence, résultat et interprétation ;
8. prouver la reproductibilité des projections et diagnostics.

L'existence d'un champ portant un nouveau nom ne constitue pas une conformité V2.

## 9. Checkpoints avant toute migration future

Une mission de migration distincte devra produire et faire admettre :

- un inventaire des artefacts et identités V1 réellement présents ;
- une classification 68/68 par consommateur ;
- les règles de mapping, refus et retour arrière ;
- un jeu de cas témoins comprenant les douze cas A à L de PD-003 V2 ;
- une preuve de conservation des décisions, sources, propriétaires et versions ;
- des rapports de pertes sémantiques et de mappings non résolus ;
- une décision humaine d'admission avant toute écriture ou réindexation.

Sans ces éléments, la migration reste interdite.

## 10. Non-régression

La coexistence est acceptable seulement si :

- les 68 objets V1 restent interprétables ;
- les artefacts V1 ne changent pas de sens après admission V2 ;
- les 74 types racines V2 sont identifiables sans double comptage ;
- `Biomarqueur` V1 ne réapparaît pas comme type courant ;
- aucune occurrence historique ne perd sa définition ou sa provenance ;
- aucune recommandation moteur n'est promue en décision humaine ;
- aucune projection n'est promue en source de vérité.

## 11. Limites

- Aucun inventaire runtime ni migration de données n'a été réalisé dans cette mission normative.
- Les moteurs existants n'ont pas encore fourni leurs preuves de double lecture ou d'écriture V2.
- Les mappings de corpus réels restent à instruire au cas par cas.
- La compatibilité documentaire n'est ni une validation scientifique, ni une certification réglementaire, ni une activation produit.

`PD003_V2_LEGACY_COMPATIBILITY_ADMITTED_WITH_LIMITATIONS`
