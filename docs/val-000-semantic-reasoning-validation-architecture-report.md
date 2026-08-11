# VAL-000 — Semantic & Reasoning Validation Architecture

| Champ | Valeur |
|---|---|
| Nature | rapport d’implémentation et d’architecture préparatoire de niveau 3 |
| Version | 1.0.0 |
| Date | 11 août 2026 |
| Dépôt | `noxia-val000` |
| Branche | `val-000` |
| Baseline | `3e9e7d5ca3d4fe3aa4288b66768db851459e24a8` |
| Autorité scientifique revendiquée | aucune |
| Validation PD-011 revendiquée | aucune |

## 1. Décision

VAL-000 est implémenté comme une architecture transverse, déterministe, versionnée et strictement diagnostique. La feature fournit les contrats `ValidationRequest`, `ValidationResult` et `ValidationFinding`, un registre machine-readable de 18 invariants, les 26 catégories d’erreur imposées, sept checkpoints, huit définitions de validators, sept politiques techniques, des adaptateurs read-only, seize fixtures synthétiques, un audit d’architecture et l’API publique demandée.

La décision reste assortie de limitations : SEM-001R3 n’est ni consolidé ni qualifié ; les validators B à G sont `EXPERIMENTAL` et ne constituent aucune qualification de moteur ; les comparaisons sont contractuelles et structurées, pas une campagne scientifique PD-011 ; seule la projection DOC `PROTOCOL` existe réellement ; trois gardes globales externes restent rouges parce que le checkout Editorial Engine était déjà non propre.

VAL-000 ne valide aucun Research Project, ne corrige aucune science, ne qualifie aucun moteur et n’implémente pas VAL-001.

## 2. Autorités et ordre de consultation

La consultation a commencé par la lecture intégrale de `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, utilisé comme routeur de gouvernance et non comme autorité scientifique. Ont ensuite été consultés, dans l’ordre prescrit : Charte fondatrice ; Scientific Product Manifesto ; Editorial Engine Architecture Manifesto ; PD-003 ; PD-004 ; PD-005 ; PD-009 ; PD-011 ; RDE-001 ; RDE-002 ; RDE-003 ; KE-001 ; ST-001 ; IMG-001 ; IMG-001B ; PRJ-001 ; REG-001 ; DOC-001 ; DOC-001B ; DOC-002 ; TMP-001 ; SYS-001 ; SYS-001B.

Les rapports SEM-001, SEM-001R, SEM-001R2 et SEM-001R3 sont absents du HEAD consolidé. L’instruction interdit de lire le travail SEM non commité comme état produit. Ils n’ont donc pas été importés ni consultés depuis l’autre worktree. Cette absence est conservée comme limite, jamais contournée.

## 3. Plans de vérité

| Plan | Contenu appliqué | Portée dans VAL-000 |
|---|---|---|
| Principes établis | science avant production ; humain décisionnaire ; inconnues et contradictions visibles ; traçabilité ; reproductibilité ; projection passive | invariants non négociables |
| Références normatives | PD-003/004/005/009/011, RDE-001/002/003, KE-001 | contraintes de sens, ownership, handoff, évaluation et arrêt |
| Corpus scientifiques | aucun corpus modifié ni évalué | les références amont sont seulement transportées |
| Cible | architecture future de VAL-001 | contrats, registres, checkpoints, politiques et adapters |
| État réellement implémenté | feature VAL-000, tests et rapport | diagnostic structural déterministe, sans UI ni LLM |
| Hypothèses | futurs validators sémantiques et validation end-to-end après SEM | explicitement non activées |

## 4. Baseline Git

Le worktree a été créé depuis `origin/main` avec une branche dédiée `val-000`. Au démarrage : HEAD et `origin/main` étaient tous deux à `3e9e7d5ca3d4fe3aa4288b66768db851459e24a8`, le statut Git était propre et `git diff --check` passait. Le commit de baseline contient TMP-001 et DOC-001B consolidés.

Le worktree SEM `/Users/charles/Documents/Projets/NOXIA/noxia-dev` n’a été ni inspecté comme état produit, ni modifié, ni nettoyé, ni importé. Le dépôt externe Editorial Engine a été consulté uniquement pour son manifeste et son état préexistant exposé par les gardes de test.

Aucun commit, push ou déploiement n’a été réalisé.

## 5. Finalité et non-mission

VAL-000 répond à la question : comment vérifier de manière structurée et reproductible qu’une transformation NOXIA reste fidèle à son entrée, ses sources, ses décisions, ses inconnues et ses responsabilités ?

Il vérifie conservation, perte, ajout, renforcement, affaiblissement, changement de statut, mapping et provenance. Il ne décide jamais ce qui est scientifiquement vrai et ne remplace jamais le moteur propriétaire.

Sont interdits : écriture dans Research Project ou Knowledge ; sélection d’une hypothèse, d’un biomarqueur ou d’une modalité ; résolution d’une contradiction ; qualification réglementaire ; modification d’une Requirement, d’un Pattern, d’une `StudyTemplateInstance` ou d’une `DocumentProjection` ; invention d’une donnée manquante.

## 6. Architecture implémentée

La feature `src/features/validation-architecture/` sépare :

- les contrats et vocabulaires fermés ;
- la canonicalisation et les digests logiques ;
- le registre d’invariants ;
- les checkpoints A à G ;
- le registry des validators et les politiques ;
- les adapters des contrats réels ;
- le moteur de diagnostic ;
- l’audit d’architecture ;
- les fixtures et tests.

Le flux est read-only : `sourceArtifact + targetArtifact + validator + policy → findings + trace + resultDigest`. Aucune fonction de validation n’expose de callback de correction ou d’écriture.

## 7. ValidationRequest

`ValidationRequest` contient les champs requis : `validationId`, `validatorType`, `sourceArtifact`, `targetArtifact`, `sourceVersion`, `targetVersion`, `sourceDigest`, `targetDigest`, `context`, `expectedInvariantSet`, `humanDecisions`, `unknowns`, `contradictions`, `limitations`, `provenance`, `requestedAt` et `validationPolicyVersion`.

Les artefacts sont des snapshots minimaux : identité, type, version, digest, owner, références de sources, éléments, relations et boundary. Les objets amont complets ne sont pas sérialisés lorsque leurs références suffisent.

## 8. ValidationResult

`ValidationResult` expose : identité, type de validator, statut, findings, éléments conservés/perdus/ajoutés/renforcés/affaiblis/non mappés, changements de statut, ruptures de provenance, changements d’inconnues, contradictions et décisions, digests, version du validator, digest de résultat, trace et limitations.

Les six statuts sont : `VALID`, `VALID_WITH_WARNINGS`, `REVIEW_REQUIRED`, `INVALID`, `NOT_EVALUABLE` et `VALIDATOR_UNAVAILABLE`.

Un mismatch de version ou digest rend l’évaluation `NOT_EVALUABLE`. Un validator non disponible retourne `VALIDATOR_UNAVAILABLE`. Les sévérités bloquantes sont déterminées par la politique applicable ; aucun total de points n’est calculé.

## 9. Finding model

Chaque `ValidationFinding` contient : `findingId`, `code`, `severity`, `sourceRefs`, `targetRefs`, `message`, `evidence`, `impact`, `owner`, `recommendedAction` et `automaticCorrectionAllowed: false`.

Chaque preuve cite au moins un invariant, son assertion et l’observation structurée. Les explications sont déterministes et issues de tables contrôlées ; aucun texte LLM n’est généré.

## 10. Taxonomie des erreurs

| Famille | Codes |
|---|---|
| Perte/ajout | `OBJECT_LOST`, `RELATION_LOST`, `OBJECT_ADDED_WITHOUT_SOURCE`, `RELATION_ADDED_WITHOUT_SOURCE`, `DOWNSTREAM_INFORMATION_LOSS` |
| Inconnues/contradictions | `UNKNOWN_STRENGTHENED`, `UNKNOWN_REMOVED`, `CONTRADICTION_HIDDEN`, `CONTRADICTION_RESOLVED_WITHOUT_DECISION` |
| Décisions/provenance | `DECISION_LOST`, `DECISION_RECREATED`, `DECISION_STATUS_CHANGED`, `PROVENANCE_LOST` |
| Intégrité/ownership | `SOURCE_VERSION_MISMATCH`, `DIGEST_MISMATCH`, `OWNERSHIP_VIOLATION` |
| Statuts conservateurs | `NOT_APPLICABLE_STRENGTHENED`, `BLOCKED_BYPASSED`, `FUTURE_SIMULATED` |
| Owners spécialisés | `REQUIREMENT_REINTERPRETED`, `PATTERN_PROMOTED`, `TEMPLATE_STRUCTURE_BYPASSED`, `DOCUMENT_CONTENT_INVENTED` |
| Fidélité sémantique/projection | `SEMANTIC_DRIFT`, `ROUTE_DRIFT`, `PROJECTION_DIVERGENCE` |

Les 26 codes sont fermés, typés et couverts par le moteur ou les fixtures. Ils diagnostiquent ; ils ne corrigent jamais.

## 11. Registre des invariants

| ID | Règle officielle |
|---|---|
| VAL-C01 | Original request traceable. |
| VAL-C02 | Explicit object never silently lost. |
| VAL-C03 | Critical relation never silently lost. |
| VAL-C04 | Unknown remains unknown unless a valid source/decision changes it. |
| VAL-C05 | Contradiction remains visible. |
| VAL-C06 | Decision IDs and versions preserved. |
| VAL-C07 | Provenance remains reconstructible. |
| VAL-C08 | Engine ownership preserved. |
| VAL-C09 | Project remains source of project truth. |
| VAL-C10 | REG remains owner of requirement applicability. |
| VAL-C11 | DOC-002 remains owner of documentary patterns. |
| VAL-C12 | TMP remains structural composition only. |
| VAL-C13 | DOC remains projection only. |
| VAL-C14 | Renderer change does not change science. |
| VAL-C15 | Missing engine never simulated. |
| VAL-C16 | NOT_APPLICABLE never becomes applicable silently. |
| VAL-C17 | FUTURE never becomes implemented silently. |
| VAL-C18 | Same source/version/policy gives same validation result. |

Chaque entrée ajoute description, owner et références d’autorité sans modifier le libellé imposé.

## 12. Points de validation

| Point | Frontière | Comparaison | État |
|---|---|---|---|
| A | SEM → ST | objets sémantiques, relations, intent, inconnues, ambiguïtés, corrections, route | `PENDING_SEM_QUALIFICATION` |
| B | ST → IMG | question, phénomènes, objectifs, hypothèses, inconnues, contradictions, contexte comparatif | `EXPERIMENTAL` |
| C | IMG → PRJ | phénomènes, biomarqueurs, modalités, alternatives, compatibilité, inconnues, limites | `EXPERIMENTAL` |
| D | PRJ → REG | faits Project consommés, aucune qualification inventée, inconnues conservées | `EXPERIMENTAL` |
| E | PRJ/REG/DOC-002 → TMP | structure, Requirements, Patterns, inconnues, conflits | `EXPERIMENTAL` |
| F | TMP/PRJ → DOC | structure TMP, contenu Project, Requirements REG, Patterns DOC-002, absence de renforcement | `EXPERIMENTAL` |
| G | DOC → Renderers | même projection, même contenu logique, différences renderer-only | `EXPERIMENTAL` |

## 13. Frontière SEM

Le registry contient `VAL-SEM-ST-001`, version `1.0.0`, statut `FUTURE`, disponibilité `PENDING_SEM_QUALIFICATION`. Il n’a aucun runner actif. Une requête utilisant la politique `SEMANTIC_END_TO_END_FUTURE` retourne `VALIDATOR_UNAVAILABLE`.

Le HEAD consolidé contient encore un script `test:semantic` pointant vers une surface absente. Ce constat est un écart d’implémentation historique, pas une autorisation d’importer SEM. VAL-000 ne modifie ni le script ni aucun fichier SEM.

## 14. Validator Registry

| Validator | Type | Source → cible | Statut |
|---|---|---|---|
| `VAL-SEM-ST-001` | Semantic Fidelity | SEM → ST | `FUTURE` / pending |
| `VAL-ST-IMG-001` | ST Handoff | ST → IMG | `EXPERIMENTAL` |
| `VAL-IMG-PRJ-001` | IMG Handoff | IMG → PRJ | `EXPERIMENTAL` |
| `VAL-PRJ-CONSISTENCY-001` | Project Consistency | PRJ → PRJ | `EXPERIMENTAL` |
| `VAL-PRJ-REG-001` | Regulatory Consistency | PRJ → REG | `EXPERIMENTAL` |
| `VAL-TMP-001` | Template Consistency | sources multiples → TMP | `EXPERIMENTAL` |
| `VAL-DOC-001` | Document Fidelity | sources multiples → DOC | `EXPERIMENTAL` |
| `VAL-CROSS-PROJECTION-001` | Cross-Projection | DOC → renderer | `EXPERIMENTAL` |

Chaque définition transporte les champs imposés : ID, type, version, statut, types source/cible, invariants supportés, disponibilité, dépendances, owner, limitations et provenance. Le registry possède sa propre version et son digest.

## 15. Politiques

Sept profils sont fournis : `ENGINE_HANDOFF`, `PROJECT_CONSTRUCTION`, `REGULATORY_COMPOSITION`, `TEMPLATE_COMPOSITION`, `DOCUMENT_PROJECTION`, `CROSS_PROJECTION` et `SEMANTIC_END_TO_END_FUTURE`.

Chaque politique déclare les invariants, sévérités bloquantes, acceptation ou refus des warnings, versions de validators requises et versions de sources compatibles. Ces profils sont des politiques techniques ; ils ne sont ni des normes scientifiques ni un PASS PD-011. Il n’existe pas de politique universelle cachée.

## 16. Déterminisme

La canonicalisation trie les clés d’objet, déduplique et trie les références, puis calcule un digest logique `val1-*`. Les finding IDs, traces, résultats, registry et audits sont dérivés de contenus logiques stables.

`requestedAt` n’entre pas dans le digest du résultat. Aucun `Date.now()`, provider distant, ordre d’arrivée ou LLM n’intervient dans la logique. Le test modifiant uniquement `requestedAt` conserve le même `resultDigest`.

## 17. Provenance et reconstructibilité

Chaque finding relie : éléments source, éléments cible, invariant, assertion évaluée, observation, impact, owner et action recommandée. La trace émet un résultat `PASS`, `FAIL` ou `NOT_EVALUABLE` pour chaque invariant demandé.

Les adapters conservent versions, digests, owner, sources, décisions, unknowns, contradictions et boundaries. Un artefact composite référence les artefacts amont sans devenir une nouvelle source de vérité.

## 18. Fixtures synthétiques

Les seize cas requis sont implémentés : préservation exacte ; objet perdu ; relation perdue ; inconnue renforcée ; contradiction masquée ; décision perdue ; provenance perdue ; violation d’ownership ; Requirement réinterprétée ; Pattern promu ; Template contourné ; contenu documentaire inventé ; renderer-only ; moteur absent simulé ; `NOT_APPLICABLE` renforcé ; `FUTURE` simulé.

Toutes les fixtures portent la limite `SYNTHETIC_FIXTURE_NOT_SCIENTIFIC_EVIDENCE`. Elles ne dépendent d’aucun LLM.

## 19. Adaptateurs des contrats réels

Des adapters read-only existent pour :

- `ScientificThinkingOutput` ;
- `ImagingDesignResult` ;
- `ResearchProjectDesignResult` ;
- `RegulatoryResolutionResult` ;
- `PatternCatalog` DOC-002 ;
- `StudyTemplateInstance` ;
- `DocumentProjection` DOC-001B ;
- sortie logique de renderer ;
- source composite multi-owner.

Les tests construisent de vrais résultats avec les moteurs et fixtures actuels, les adaptent puis vérifient que chaque entrée reste strictement identique avant/après. Aucun moteur existant n’a été modifié.

## 20. Audit d’architecture

L’audit `VAL-000-AUDIT-1.0.0` détecte les douze codes imposés :

`VALIDATOR_WITHOUT_VERSION`, `VALIDATOR_WITHOUT_OWNER`, `VALIDATOR_WITHOUT_INVARIANTS`, `UNKNOWN_INVARIANT`, `POLICY_WITHOUT_VALIDATOR`, `POLICY_WITHOUT_BLOCKING_RULE`, `NON_DETERMINISTIC_VALIDATOR`, `MISSING_PROVENANCE`, `CIRCULAR_VALIDATION_DEPENDENCY`, `VALIDATOR_MUTATES_SOURCE`, `VALIDATOR_MUTATES_TARGET`, `UNAVAILABLE_VALIDATOR_MARKED_AVAILABLE`.

L’audit du registry livré retourne zéro finding et `passed=true`. Une fixture négative déclenche les douze catégories. La boundary est `DETECTION_ONLY_NO_AUTOMATIC_FIX`.

## 21. API publique

La surface exporte au minimum :

- `validateTransformation()` ;
- `validateWithPolicy()` ;
- `getValidator()` ;
- `listValidators()` ;
- `listPolicies()` ;
- `auditValidationArchitecture()` ;
- `explainValidationFinding()`.

Sont aussi exposés les contrats, registres, checkpoints, adapters et outils de digest nécessaires au replay. L’explication d’un finding est une structure stable, pas une prose générée.

## 22. Tests et validations

| Validation | Résultat |
|---|---|
| VAL-000 ciblé | 1 fichier, 26/26 tests PASS |
| ST + IMG + PRJ + REG-001 + DOC-002 + TMP-001 + DOC-001B + SYS | 42 fichiers, 310/310 tests PASS |
| Typecheck principal | PASS |
| Lint ciblé VAL-000 | PASS, 0 erreur et 0 warning |
| Lint global | PASS, 0 erreur et 7 warnings Fast Refresh préexistants |
| Build production | PASS, 1 915 modules ; warnings Browserslist, Rollup et chunk > 500 kB préexistants |
| Suite globale | 1 083/1 086 tests PASS ; 75/78 fichiers PASS |
| `git diff --check` | PASS en clôture |

Les trois échecs globaux sont exclusivement : P3M-Web « leaves editorial-engine clean », P4 « leaves editorial-engine unchanged » et P5 « leaves editorial-engine unchanged ». Le checkout externe était déjà non propre dans les rapports antérieurs et est demeuré hors du périmètre d’écriture VAL-000.

## 23. Non-régressions

VAL-000 n’a modifié aucun fichier SEM, ST, IMG, PRJ, REG-001, DOC-002, TMP-001, DOC-001B, Knowledge, Protocol Designer ou Editorial Engine. Aucun document normatif, Scientific Program, registre, Reasoning Book, corpus scientifique ou SOURCE-OF-TRUTH-INDEX n’a été modifié.

Les validators comparent les sérialisations logiques et l’audit détecte séparément toute mutation source ou cible. Les 310 tests ciblés de moteurs existants passent sans correction dans leurs modules.

## 24. Contradictions et arbitrages non silencieux

1. **Index vs rapports de niveau 3.** L’index conserve un snapshot antérieur sur certains moteurs généraux ; les rapports ultérieurs démontrent des capacités V1 bornées. VAL-000 traite les rapports comme état d’implémentation, sans promouvoir leurs capacités au rang de norme ou de PASS PD-011.
2. **RDE-003 vs IMG-001B.** RDE-003 cite l’équipement exact inconnu parmi les arrêts, tandis qu’IMG-001B autorise un handoff scientifique Project en maintenant l’exécutable bloqué. VAL-000 ne tranche pas : il conserve séparément stratégie scientifique, compatibilité et readiness exécutable.
3. **TMP-001 vs DOC-001B.** TMP-001 constatait historiquement l’absence de consommation DOC. DOC-001B a ensuite fermé le nouveau pipeline. Le premier constat reste historique ; l’état courant suit DOC-001B.
4. **SEM demandé mais absent.** Les rapports SEM sont demandés par la mission mais absents de `origin/main`, et leur worktree non commité est protégé. La seule qualification licite est `PENDING_SEM_QUALIFICATION`.

Aucun de ces écarts n’a été résolu par modification d’une autorité.

## 25. Limitations

1. SEM-001R3 est non qualifié et absent du baseline consolidé ; le checkpoint A est inactif.
2. Les validators B à G sont expérimentaux et fondés sur des contrats structurés ; ils ne démontrent pas la correction scientifique de leurs contenus.
3. Aucune campagne, référence experte, métrique ou décision indépendante PD-011 n’est réalisée.
4. Aucun validator sémantique assisté par LLM n’est autorisé ou implémenté.
5. L’adapter renderer vérifie l’identité logique de la projection ; il ne constitue ni audit visuel, ni audit WCAG.
6. `PROTOCOL` demeure la seule projection DOC rendue ; la cohérence entre plusieurs familles documentaires réelles reste à démontrer.
7. REG-000 reste un corpus candidat ; VAL-000 ne transforme pas REG-001 en autorité réglementaire.
8. Les résultats de fixtures sont des preuves techniques, jamais des preuves scientifiques.
9. La suite globale conserve trois échecs externes préexistants liés au checkout Editorial Engine.

## 26. Fichiers créés

- `src/features/validation-architecture/types.ts` ;
- `src/features/validation-architecture/canonical.ts` ;
- `src/features/validation-architecture/invariants.ts` ;
- `src/features/validation-architecture/checkpoints.ts` ;
- `src/features/validation-architecture/registry.ts` ;
- `src/features/validation-architecture/adapters.ts` ;
- `src/features/validation-architecture/engine.ts` ;
- `src/features/validation-architecture/audit.ts` ;
- `src/features/validation-architecture/index.ts` ;
- `src/features/validation-architecture/__tests__/fixtures.ts` ;
- `src/features/validation-architecture/__tests__/validation-architecture.test.ts` ;
- `docs/val-000-semantic-reasoning-validation-architecture-report.md`.

Aucun fichier existant n’est modifié.

## 27. SOURCE-OF-TRUTH-INDEX

Le SOURCE-OF-TRUTH-INDEX n’est pas mis à jour. VAL-000 crée une feature et un rapport technique de niveau 3 sans modifier l’autorité, la hiérarchie, une identité normative, un Program, un registre ou un corpus officiel. Une admission documentaire future, si souhaitée, exigerait une décision séparée.

## 28. Transition vers VAL-001

VAL-001 ne pourra être activé qu’après :

1. consolidation et qualification explicites d’un contrat SEM ;
2. remplacement de `PENDING_SEM_QUALIFICATION` par une décision documentée ;
3. choix explicite des validators qui deviennent exécutables ;
4. campagnes de référence distinctes des fixtures de développement ;
5. définition de l’UX des findings dans une mission séparée ;
6. maintien des boundaries read-only et de l’autorité PD-011 sur toute revendication de validation.

VAL-001 devra consommer les contrats VAL-000 sans transformer un résultat technique `VALID` en vérité scientifique, approbation réglementaire, readiness globale ou décision humaine.

`VALIDATION_ARCHITECTURE_V1_IMPLEMENTED_WITH_LIMITATIONS`
