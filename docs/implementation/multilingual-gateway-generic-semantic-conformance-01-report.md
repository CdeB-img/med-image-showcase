# MULTILINGUAL_GATEWAY_GENERIC_SEMANTIC_CONFORMANCE_01

## 1. Décision

`MISSION_STATUS = GENERIC_LANGUAGE_CONFORMANCE_QUALIFIED`

Le Language Gateway contenait une connaissance de traduction médicale dans la validation déterministe : un groupe d'équivalence littéral `MRI` / `IRM`. Il assimilait en outre tout token ASCII en majuscules à un identifiant opaque. La réparation remplace ces deux mécanismes par une frontière générique entre :

- les littéraux opaques protégés, conservés caractère pour caractère ;
- le langage scientifique traduisible, dont la réalisation linguistique appartient à Gemini.

Le mécanisme ne contient plus de dictionnaire terminologique médical. Il ne prétend pas non plus prouver la fidélité sémantique d'une traduction par comparaison de chaînes.

## 2. Forensic initial

```ini
HEAD_BEFORE = 7c5c7044e5a59d28dba5ce6ce24b240e06adcbb2

MRI_IRM_HARDCODED = YES
TERM_SPECIFIC_EQUIVALENCE_TABLE_EXISTS = YES
SCIENTIFIC_ACRONYM_TRANSLATION_KNOWLEDGE_IN_DETERMINISTIC_CODE = YES

CURRENT_IDENTIFIER_CLASSIFICATION_MECHANISM = ASCII_UPPERCASE_TOKEN_AS_OPAQUE_IDENTIFIER_WITH_MRI_IRM_EQUIVALENCE
```

Preuves observées avant modification :

- `LANGUAGE_ACRONYM_EQUIVALENCE_GROUPS = [new Set(["MRI", "IRM"])]` ;
- extraction de `IDENTIFIERS` par le motif générique des tokens ASCII majuscules ;
- acceptation/rejet fondé sur une équivalence terminologique connue du runtime.

## 3. Contrat cible implémenté

```ini
TARGET_IDENTIFIER_CLASSIFICATION_MECHANISM = PROTECTED_OPAQUE_LITERAL_BY_STRUCTURE_OR_EXPLICIT_CONTEXT
TERM_SPECIFIC_TRANSLATION_DICTIONARY = 0
PRODUCTION_SPECIAL_CASE_MRI_IRM = NO
PRODUCTION_SPECIAL_CASE_CT_TDM = NO
PRODUCTION_SPECIAL_CASE_CMR_IRM_CARDIAQUE = NO
```

Les classes structurelles déterministes actuellement reconnues sont :

- identifiant d'essai clinique `NCT` ;
- identifiant de variable structuré ;
- identifiant structuré avec séparateur et chiffre ;
- identifiant Project/objet structuré ;
- UUID ;
- hash ;
- DICOM UID ;
- DOI ;
- URL.

Un littéral peut également être protégé par contexte explicite. Dans ce cas il doit être présent dans le texte source, déclaré comme `EXPLICIT_CONTEXT`, inclus dans l'identité de projection et transmis au provider dans `PROTECTED_OPAQUE_LITERALS_JSON`.

Le serveur rejette une structure de littéral protégé invalide ou un littéral explicite absent de la source. À la matérialisation, toute perte ou mutation d'un littéral protégé produit `LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS`.

Les acronymes scientifiques ordinaires ne sont plus inférés comme identifiants à partir de leur seule casse. Le prompt confie explicitement au LLM la traduction naturelle de la terminologie scientifique, des modalités et des acronymes, sans décision scientifique ni ajout sémantique.

## 4. Classification des preuves d'invariant

| Invariant / propriété | Niveau de preuve | Portée exacte |
|---|---|---|
| Texte original et provenance | `DETERMINISTICALLY_PROVABLE` | texte original immuable, références et digests |
| Littéraux opaques protégés / `IDENTIFIERS` | `DETERMINISTICALLY_PROVABLE` | présence littérale et multiplicité minimale |
| `NUMBERS` | `DETERMINISTICALLY_PROVABLE` | conservation numérique, avec équivalence du séparateur décimal `.` / `,` |
| `UNITS` | `STRUCTURALLY_CHECKABLE` | conservation lexicale des unités reconnues ; aucune preuve de cohérence dimensionnelle globale |
| `DECISION_STATUS` | `STRUCTURALLY_CHECKABLE` | conservation lexicale des statuts canoniques reconnus |
| `NEGATION` | `STRUCTURALLY_CHECKABLE` | présence de marqueurs compatibles ; portée logique non prouvée |
| `UNCERTAINTY` | `STRUCTURALLY_CHECKABLE` | présence de marqueurs compatibles ; degré et portée non prouvés |
| `CONDITIONALITY` | `STRUCTURALLY_CHECKABLE` | présence de marqueurs compatibles ; structure logique non prouvée |
| `COMPARISON` | `STRUCTURALLY_CHECKABLE` | présence de marqueurs compatibles ; objets et sens de comparaison non prouvés |
| `TEMPORAL_RELATION` | `STRUCTURALLY_CHECKABLE` | présence de marqueurs compatibles ; ordre temporel complet non prouvé |
| Entités et terminologie scientifiques | `NOT_RELIABLY_CHECKABLE_DETERMINISTICALLY` | traduction linguistique appartenant au LLM ; aucune table médicale déterministe |
| Ambiguïté | `LLM_ATTESTED` | `ambiguityPreserved=true` exigé ; la vérité sémantique de l'attestation n'est pas prouvée par regex |
| Schéma provider/result | `DETERMINISTICALLY_PROVABLE` | forme, enums, champs requis et refus fail-closed |
| Identité provider/résultat | `DETERMINISTICALLY_PROVABLE` | provider, modèle, response id et digest du résultat |
| Déduplication | `DETERMINISTICALLY_PROVABLE` | identité de projection incluant source, langues, provider, modèle et littéraux protégés |
| Non-mutation Project | `DETERMINISTICALLY_PROVABLE` | contrat du gateway sans autorité d'écriture Project ou de décision scientifique |

Le statut runtime `PRESERVED` des marqueurs linguistiques est donc explicitement une observation structurelle. Il ne constitue pas une adjudication de fidélité scientifique ou sémantique.

## 5. Tests de généricité et de fermeture

Résultats déterministes/mock :

```ini
MRI_IRM = PASS
CT_TDM = PASS
PET_TEP = PASS
UNSEEN_TRANSLATABLE_ACRONYM_CASE = PASS (QXZ -> ZXQ)

OPAQUE_IDENTIFIER_MUTATION_REJECTED = PASS (ABC-001 -> ABC-002; project_var_01 -> project_var_02)
NCT_IDENTIFIER_MUTATION_REJECTED = PASS (NCT01234567 -> NCT01234568)
UUID_MUTATION_REJECTED = PASS

NUMBER_UNIT_LOCALIZATION = PASS (1.5 T -> 1,5 T)
AMBIGUITY_ATTESTATION_REQUIRED = PASS
UNCERTAINTY_STRUCTURAL_SENTINEL = PASS
PROVIDER_FAILURE_FAIL_CLOSED = PASS
DEDUPLICATION = PASS
FRENCH_NO_CALL_PATH = PASS
TRACE_LEVEL2_EFFECTIVE = PASS
```

Le payload provider transmet `NCT01234567` comme littéral protégé mais ne transmet ni `MRI` ni `CT` dans cette liste. Les fixtures médicales restent cantonnées aux tests.

## 6. Fichiers modifiés

- `src/features/protocol-designer/conversation-language-gateway.ts`
- `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx`
- `src/features/protocol-designer/functional-reset/__tests__/multilingual-conversation-gateway-01.test.ts`
- `docs/implementation/multilingual-gateway-generic-semantic-conformance-01-report.md`

```ini
SCIENTIFIC_OWNER_FILES_CHANGED = 0
PRODUCT_ENTRY_ROUTER_SEMANTICS_CHANGED = NO
QRY_SEMANTICS_CHANGED = NO
PROJECT_SEMANTICS_CHANGED = NO

FIC01_FILES_CHANGED = 0
FIC02_DEFINITION_FILES_CHANGED = 0
FIC02_EXECUTION_01_FILES_CHANGED = 0
TRACE_PROFILE_VERSION = 1.3.0_UNCHANGED
```

## 7. Qualification

```ini
TARGETED_TESTS = PASS — 11 files / 90 PASS / 1 TODO
TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS
GIT_DIFF_CHECK = PASS

FULL_SUITE_FILES = 234 PASS / 2 SKIP / 1 FAIL
FULL_SUITE_PASS = 3608
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL = 1
HISTORICAL_FAILURE = src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx
NEW_REGRESSIONS = 0
```

Les avertissements non bloquants du build restent distincts : base Browserslist ancienne, annotations Rollup tierces, dette CSS existante et taille de chunks. Aucun n'est introduit ou réparé dans cette mission.

## 8. Limites et responsabilités

```ini
VALIDATION_RELAXED = YES_ONLY_FOR_UNJUSTIFIED_LITERAL_PRESERVATION_OF_SCIENTIFIC_ACRONYMS
LLM_TRANSLATION_RESPONSIBILITY = NATURAL_LANGUAGE_TERMINOLOGY_MODALITIES_ACRONYMS_AND_SEMANTIC_FIDELITY
DETERMINISTIC_VALIDATION_RESPONSIBILITY = CONTRACT_SCHEMA_PROVENANCE_PROTECTED_LITERALS_OBJECTIVE_STRUCTURAL_SENTINELS_PROVIDER_RESULT_IDENTITY_FAILURE_AND_DEDUPLICATION

PUSH = NO
DEPLOYMENT = NO
FIC02_REPLAY = NO

NEXT_ACTION = FROZEN_INTEGRATED_CAMPAIGN_02_REPLAY
P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```
