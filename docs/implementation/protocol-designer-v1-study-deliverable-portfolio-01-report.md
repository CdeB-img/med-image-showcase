# PROTOCOL DESIGNER V1 — Study Deliverable Portfolio 01

## Statut

```ini
MISSION_ID = PROTOCOL_DESIGNER_V1_STUDY_DELIVERABLE_PORTFOLIO_01
MISSION_STATUS = V1_STUDY_DELIVERABLE_PORTFOLIO_QUALIFIED
HEAD_BEFORE = 9119a7c2affef24a430b94e1e396e9efc92449aa
PRODUCT_COMMIT = 588fc669ffff108413201d59c20aff8efa3ea6a3
PROVIDER_CALLS = 0
OPENAI_CALLS = 0
GEMINI_CALLS = 0
PUSH = NO
DEPLOYMENT = NO
```

## Discovery bornée et réutilisation

| Capacité avant mission | Statut | Propriétaire observé / réutilisé |
|---|---|---|
| Protocol export | AVAILABLE | `src/features/document-projection/renderer.ts`, `html-renderer.ts`, `functional-reset-boundary.ts` |
| TMP | PARTIAL | `src/features/study-template/` ; composition et raccord DOC existants, pas de portfolio Standard complet |
| DOC / DocumentProjection | AVAILABLE | `src/features/document-projection/` |
| Editorial composition | AVAILABLE | `src/features/document-projection/editorial.ts` |
| CanonicalVariable runtime | AVAILABLE | `src/features/research-project-construction/canonical-project-backbone.ts` |
| Study Data / CDM planning | AVAILABLE | `src/features/data-analysis-planning/study-data.ts` |
| Data Management planning | AVAILABLE | `src/features/data-analysis-planning/data-management.ts` |
| Biostatistics planning | AVAILABLE | `src/features/data-analysis-planning/biostatistics.ts` |
| CRF logique | PARTIAL | projection logique DM existante, sans export Standard |
| Data Dictionary logique | PARTIAL | projection logique DM existante, sans export Standard |
| Schedule of Activities logique | PARTIAL | projection logique DM existante, sans export Standard |
| EDC export | ABSENT | aucun adapter d'import visible avant mission |
| Regulatory resolution | PARTIAL | `src/features/regulatory-resolution/` ; profil juridictionnel/institutionnel requis |

Décision : aucun nouvel owner ni nouveau moteur documentaire. Le portfolio est une projection DOC-001 en lecture seule. Il consomme le Project canonique, la projection Protocol exacte, et les projections Study Data / Data Management déjà présentes.

## Implémentation produit

La surface Standard contient désormais un espace **Documents / Livrables de l’étude** et accepte notamment :

> Exporte mon CRF pour mon logiciel de collecte.

Le produit ouvre le portfolio lié à la version courante du Research Project. Chaque fichier est téléchargeable séparément et le bundle complet est exporté en ZIP déterministe avec `manifest.json`.

Livrables :

| Livrable | Statut témoin fibrose | Formats |
|---|---|---|
| Protocole complet | PARTIAL | HTML, Markdown |
| Synopsis | PARTIAL | HTML |
| Schedule of Activities | PARTIAL | CSV |
| CRF | PARTIAL | HTML |
| Data Dictionary | PARTIAL | CSV, JSON |
| Data Management Plan | PARTIAL | HTML |
| Export EDC | PARTIAL | JSON canonique, CSV générique, REDCap Data Dictionary CSV, mapping JSON |
| Statistical Analysis Plan | MISSING_DECISION | HTML partiel fidèle |
| Documents réglementaires / éthiques | PROFILE_REQUIRED | JSON |
| Guide Imaging / Core Lab | PARTIAL | HTML |

Les statuts partiels sont intentionnels : le témoin ne possède ni occasion de collecte adoptée, ni type/domaine/contrainte EDC adoptés, ni `ANALYSIS_SPECIFICATION`. Le système génère les parties défendables et conserve les décisions manquantes.

## Identité canonique et frontières

- Une seule identité `CanonicalVariable` est transportée dans SoA, CRF, Data Dictionary, package EDC, SAP et manifeste.
- Le champ REDCap est un alias technique réversible ; le mapping conserve le `canonicalVariableId`.
- `record_id` est explicitement décrit comme clé technique REDCap et non comme variable scientifique.
- Une projection Protocol dont `projectId`, `projectVersion` ou `projectDigest` ne correspond pas au Project est rejetée fail-closed.
- Les objets `UNKNOWN` ou `WITHHELD` ne deviennent pas des champs CRF.
- La génération ne mute ni Project ni conversation et n'adopte aucune proposition.
- Le package réglementaire est un index de préparation, avec `regulatoryComplianceClaim=false`.

Le profil REDCap suit la structure Data Dictionary CSV destinée au chargement de métadonnées. La compatibilité avec une version ou une instance locale reste explicitement `REQUIRES_LOCAL_REDCAP_VALIDATION` ; aucune compatibilité EDC générale ni conformité CDISC n'est revendiquée.

## Témoins

### Fibrose myocardique

Le même Project v2 alimente : protocole, synopsis, critère principal d'accord absolu au niveau patient, variable automatisée, CRF, dictionnaire, SoA, SAP partiel, guide Imaging et exports EDC. Le ZIP contient les fichiers individuels et le manifeste. La commande conversationnelle ouvre réellement la surface Standard.

### Thrombus intra-VG post-IDM

Le même builder réutilisé produit un synopsis contenant les deux objectifs thrombus, sans contenu fibrose. Le guide Imaging est applicable et partiel ; le CRF reste `MISSING_DECISION` car aucune variable canonique n'est adoptée. Aucun branchement lexical par domaine n'a été ajouté au portfolio.

## Gates

```ini
D01_PROTOCOL_FULL = WORKS
D02_PROTOCOL_SYNOPSIS = WORKS
D03_SOA = WORKS
D04_CRF = WORKS
D05_DATA_DICTIONARY = WORKS
D06_EDC_IMPORT = WORKS_WITH_LOCAL_INSTANCE_VALIDATION_REQUIRED
D07_BIOSTAT_PLAN_OR_SAP = WORKS_AS_HONEST_PARTIAL
D08_REGULATORY_PACKAGE = WORKS_AS_HONEST_PROFILE_BOUND_PARTIAL
D09_DOCUMENT_WORKSPACE = WORKS
D10_STUDY_PACKAGE_EXPORT = WORKS
D11_SINGLE_SOURCE_PROJECT_CONSISTENCY = PASS
D12_CANONICAL_VARIABLE_IDENTITY_ACROSS_OUTPUTS = PASS
D13_HUMAN_DECISION_BOUNDARY = PASS
D14_NO_SCIENCE_CREATED_BY_DOCUMENTS = PASS
D15_SECOND_PROJECT_GENERICITY = PASS
VISIBLE_DOCUMENT_PRODUCT_BEHAVIOR_CHANGED = YES
```

## Qualification

```ini
PORTFOLIO_AND_COLLECTION_TARGETED = 70 PASS
PROJECT_CDM_DM_BIOSTAT_TMP_DOC_TARGETED = 296 PASS
POST_SUITE_UI_COMPATIBILITY_TARGETED = PASS
TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS

FULL_SUITE_EXECUTED_ONCE = YES
FULL_SUITE_TOTAL = 3887
FULL_SUITE_PASS = 3872
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL_AT_EXECUTION = 2
```

Les deux échecs de l'exécution complète étaient :

1. `p-web-02-contract.test.tsx`, échec historique inchangé : le test attend le titre Standard historique « Protocol Designer » ;
2. `functional-reset-01.test.tsx`, incompatibilité causale d'intitulé « Documents », corrigée ensuite et requalifiée ciblée `PASS`.

La suite complète n'a pas été relancée. Le test historique a été rejoué ciblé et reste seul en échec ; `NEW_REGRESSIONS = 0` est donc établi par requalification causale bornée, pas par une seconde suite complète.

## Dettes conservées

- validation d'import sur une instance REDCap locale réelle ;
- décisions de type, unité, domaine, required/optional et temporalité des champs ;
- adoption d'`AnalysisSpecification` avant SAP complet ;
- sélection du profil réglementaire/institutionnel ;
- PDF/DOCX et deuxième adapter EDC ;
- optimisation de layout et de wording.

Ces dettes ne modifient ni la cohérence Project/document, ni la disponibilité immédiate des projections et exports partiels explicitement qualifiés.

```ini
P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```
