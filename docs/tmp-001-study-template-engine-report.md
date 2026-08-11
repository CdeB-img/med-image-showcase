# TMP-001 — Study Template Engine V1

| Champ | Valeur |
|---|---|
| Mission | implémentation du moteur de composition logique des Study Templates |
| Date | 11 août 2026 |
| Baseline | `d3de7ad603031acb8703cded7e5f00c24719be37` |
| Branche | `main` |
| Version moteur / schéma | `1.0.0` / `1.0.0` |
| Nature | moteur de structure ; aucune autorité scientifique, réglementaire ou documentaire |
| Validation PD-011 | non réalisée ; aucun PASS scientifique revendiqué |

## 1. Decision

TMP-001 V1 est implémenté avec limitations. Le moteur compose une `StudyTemplateInstance` logique, déterministe, rejouable et traçable à partir d’un Research Project, du résultat REG-001, du catalogue DOC-002 et des décisions humaines explicites. Il ne produit ni texte, ni protocole, ni DOCX, ni PDF, ni `ProtocolProjection`.

Les tests TMP-001, l’audit structurel, le typecheck TMP, le lint, le build, le contrôle des artefacts et `git diff --check` passent. Un premier checkpoint transversal, avant branchement UI du travail concurrent, passait 521/521 tests ciblés et 1 033/1 036 tests globaux, avec les seuls trois échecs externes Editorial Engine déjà connus. Le rejeu final sur le worktree concurrent n’est plus vert : 22 échecs UI proviennent de `SemanticConversationalWorkspace.scrollIntoView`, un échec SEO d’un canonical concurrent dupliqué et trois échecs du checkout Editorial Engine sale. La décision reste donc « avec limitations ».

## 2. Authorities

Le `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` a été lu en premier comme routeur documentaire, sans lui attribuer d’autorité scientifique autonome. La Charte fondatrice et le Scientific Product Manifesto établissent les principes : vérité appartenant au produit, décisions humaines, déterminisme, traçabilité, conservation des inconnues et absence d’effets cachés. L’Architecture Manifesto de l’Editorial Engine externe établit la projection passive et la vérité détenue par le produit consommateur.

Les références normatives consultées dans l’ordre imposé sont PD-003, PD-004, PD-005, PD-009, PD-011, RDE-001 v1.1, RDE-002 v1.1, RDE-003 v1.1 et KE-001. Les rapports PRJ-001, DOC-001, DOC-002, REG-000, REG-001, SYS-001 et SYS-001B documentent l’état réellement implémenté. Les corpus REG-000 et DOC-002 sont des entrées de niveau inférieur : ils ne deviennent pas des autorités par leur consommation.

## 3. Baseline

La baseline était propre : branche `main`, HEAD `d3de7ad603031acb8703cded7e5f00c24719be37`, `git status --short` vide, aucun diff. Aucune modification concurrente n’était visible à ce moment.

Après le début de TMP-001, un travail concurrent est apparu sous `src/features/scientific-semantic-reconstruction/`, `api/`, `src/features/protocol-designer/intake/types.ts`, `src/features/scientific-thinking/input.ts`, `src/features/scientific-thinking/types.ts` et `src/pages/ProtocolDesignerDemo.tsx`. TMP-001 ne l’a ni lu comme autorité, ni modifié, ni corrigé. Le checkout externe `/Users/charles/Documents/Projets/editorial-engine` était déjà déclaré sale par SYS-001 et SYS-001B ; il est resté hors périmètre d’écriture.

## 4. Objectives

Le moteur remplit quatre objectifs bornés : sélectionner une définition de template ; résoudre plusieurs familles simultanées ; composer des nœuds et relations logiques avec supports, statuts, dépendances, inconnues et conflits ; exposer des contrats structurés à de futurs consommateurs.

Il n’exécute aucune science, ne qualifie aucune réglementation, ne promeut aucun pattern documentaire, ne rédige aucun contenu et ne remplace aucun moteur spécialisé. Les six instances distribuées sont marquées `ILLUSTRATIVE_TECHNICAL_FIXTURE_NOT_SCIENTIFIC_CORPUS`.

## 5. Architecture

La chaîne implémentée est : `Research Project + RegulatoryResolutionResult + PatternCatalog + décisions/inconnues/limitations humaines → résolution multi-axes → supports → statuts → dépendances → readiness locale → StudyTemplateInstance`.

Le module autonome `src/features/study-template/` contient contrats, définitions, composition, audit, catalogue, requête, vues passives, persistance, versionnement et adaptateurs futurs. Les moteurs PRJ, REG-001, DOC-002 et DOC-001 ne sont jamais appelés pour écrire ; ils sont seulement référencés par leurs contrats de lecture.

## 6. Study Templates

Le catalogue V1 contient un template stable : `TMP-STUDY:CLINICAL-STUDY`, version `1.0.0`, révision `1`. Son `behaviorDigest` distingue le comportement de sa description. La définition porte ses documents, sections, blocs, graphe, familles, provenance et les contrats TMP-C01 à TMP-C12.

Cette unicité n’impose pas une branche unique : elle fournit un socle multi-axes capable de composer plusieurs familles applicables ou potentielles sur la même instance.

## 7. Template Families

Treize familles explicites sont indexées selon sept axes : Clinical Study ; Interventional ; Observational ; Registry ; SNDS ; RIPH ; PHRC ; RHU ; ANR ; France 2030 ; Device ; Drug ; Imaging. Chaque `StudyFamilyProfile` transporte source, statut, raison, faits Project, exigences REG-001, patterns associés, conflits et inconnues.

Clinical Study est le socle de composition. Observational et Imaging sont résolus depuis le Project. Les familles réglementaires, produits et financements reprennent uniquement les signaux structurés REG-001. L’instance de fixture Imaging + PHRC démontre quatre familles applicables simultanément, sans sélection exclusive.

## 8. Template Graph

Le graphe de définition contient 92 nœuds et 252 relations. Les 13 types de nœuds sont représentés : DOCUMENT, SECTION, SUBSECTION, BLOCK, TABLE, ANNEX, WORKFLOW, DECISION, CONDITIONAL_BLOCK, OPTIONAL_BLOCK, REQUIRED_BLOCK, FUTURE_BLOCK et REFERENCE.

Les relations de base couvrent CONTAINS, DEPENDS_ON, REQUIRES, OPTIONALLY_REQUIRES, PRECEDES, FOLLOWS, SPECIALIZES, GENERALIZES, GENERATES, USES_PATTERN, USES_REQUIREMENT et USES_PROJECT_OBJECT. CONFLICTS_WITH et EXCLUDES sont ajoutées seulement lorsqu’un conflit ou une exclusion humaine explicite existe ; les tests couvrent ainsi les quatorze relations publiques sans inventer de conflit statique.

## 9. Template Instances

Une instance porte identifiants et digests exacts des trois entrées, version et révision du template, profils familiaux, nœuds, relations, documents logiques, conditions, conflits, informations manquantes, inconnues, limitations, décisions, mappings, graphes de dépendance/readiness, trace et digest.

Six instances techniques sont distribuées : base, Imaging + PHRC, inconnue, conflit, statuts humains et niveau MINIMAL. Leurs readiness globales sont respectivement PARTIAL, BLOCKED, UNKNOWN, CONFLICTING, BLOCKED et PARTIAL. Ces états sont locaux au template.

## 10. Composition Engine

La composition est pure à ses frontières : sérialisation canonique avant/après, tris stables, identifiants dérivés de digests et absence d’horodatage implicite. `compositionAsOf` est une entrée explicite. À entrées identiques, l’instance, son ID, son ordre et son digest sont identiques.

La trace distingue opérations déterministes, décision humaine et frontière. Aucun renderer, générateur de prose ou appel LLM n’est présent.

## 11. Family Resolution

Chaque famille possède un resolver déclaré : ALWAYS, PROJECT_DESIGN, PROJECT_IMAGING, REGULATORY_TOKEN ou FUNDING_PROGRAM. La résolution utilise les champs structurés Project et les résolutions REG-001 ; elle ne relit pas REG-000 brut et ne déduit pas une qualification depuis un texte utilisateur.

Les statuts sont APPLICABLE, POTENTIALLY_APPLICABLE, NOT_APPLICABLE, UNKNOWN ou CONFLICTING. L’absence de signal produit UNKNOWN, jamais NOT_APPLICABLE. Une exclusion exige une preuve amont explicite.

## 12. Requirement Integration

`RegulatoryResolutionResult` est consommé comme Applicable Requirement Set. Les exigences applicables, potentielles, non applicables, non résolues, documentaires et de financement sont consolidées par identifiant sans modifier REG-001. Chaque mapping conserve statut, raison et références sources.

APPLICABLE peut rendre un bloc REQUIRED ; un bloc dépendant d’un moteur futur devient BLOCKED plutôt que faussement disponible. Les statuts conditionnels restent CONDITIONAL, les qualifications manquantes restent UNKNOWN, les conflits restent CONFLICTING et NOT_APPLICABLE n’est produit que par une exclusion explicitement résolue.

## 13. Documentary Pattern Integration

DOC-002 est consommé par catégories déclaratives. Chaque `TemplatePatternMapping` conserve `patternId`, statut, nœuds, sources et la frontière `REFERENCE_ONLY_NEVER_MAKES_REQUIRED`.

Les patterns candidats, locaux, historiques et externes restent tels quels. Un pattern seul ne rend jamais un bloc REQUIRED. Les supports documentaires sont agrégés par nœud pour éviter la duplication tout en conservant le mapping détaillé séparé.

## 14. Blocks

Le catalogue contient 43 `BlockDefinition`, dont 20 réutilisables. Les blocs partagés — identité, question, objectifs, population, inconnues, limites, provenance, décisions et dépendances — existent une seule fois et sont référencés par plusieurs documents.

Les huit statuts sont supportés et testés : REQUIRED, OPTIONAL, CONDITIONAL, NOT_APPLICABLE, BLOCKED, UNKNOWN, FUTURE et CONFLICTING. OPTIONAL n’est jamais un défaut ; il exige une décision humaine TMP explicite. Les blocs FUTURE restent présents même en niveau MINIMAL.

## 15. Sections

Vingt-trois `SectionDefinition` logiques sont déclarées, une structure primaire par famille documentaire V1. Chaque section porte ordre, blocs référencés, niveaux de détail et provenance.

Les sections ne contiennent aucun texte scientifique ou réglementaire. Elles décrivent seulement où des objets déjà gouvernés pourront être projetés par un moteur propriétaire futur.

## 16. Documents

Vingt-trois `DocumentDefinition` sont exposées : Protocol, Synopsis, Imaging Charter, Core Lab Manual, SAP, Data Management Plan, CRF Specification, Data Dictionary, Monitoring Plan, Quality Plan, Risk Plan, Training Plan, Funding Application, Budget, Investigator Brochure, Site Documents, Patient Information, Consent, Regulatory Submission, Publication Plan, Registry Submission, Study Report et Archive Manifest.

Chaque définition reste `LOGICAL_DEFINITION_ONLY` et cible un futur consommateur DOC-001. Aucun objet DOC-001 `ProjectionDefinition`, `DocumentProjection` ou `ProtocolProjection` n’est produit.

## 17. Variants

Chaque document expose des variantes logiques FULL et SHORT, tandis que les nœuds déclarent FULL, MEDIUM, SHORT et MINIMAL. Le niveau demandé est conservé dans l’instance mais ne supprime jamais les inconnues, conflits, limitations ou blocs futurs.

Les variantes sont des métadonnées de structure. Elles ne choisissent ni formulation, ni engagement éditorial, ni contenu.

## 18. Dependencies

Le moteur conserve DEPENDS_ON, REQUIRES, OPTIONALLY_REQUIRES, PRECEDES et FOLLOWS dans un graphe séparé. Une dépendance bloquée ou conflictuelle propage un blocage ciblé ; une dépendance UNKNOWN ou FUTURE bloque un nœud REQUIRED.

Les dépendances vers Biostatistics, Data Management, Regulatory, Economics, Quality et Clinical Operations restent FUTURE ou BLOCKED. Aucun moteur absent n’est simulé.

## 19. Conditions

Les conditions viennent de REG-001. Chaque `TemplateCondition` conserve expression, cible, statut, raison et références. APPLICABLE donne SATISFIED, NOT_APPLICABLE donne NOT_SATISFIED et toute qualification incomplète donne UNKNOWN.

TMP-001 ne réinterprète pas les expressions et ne transforme pas une condition symbolique en obligation certaine.

## 20. Unknowns

Les inconnues Project, les informations réglementaires manquantes et les inconnues humaines déclarées sont fusionnées sans perte d’origine. Elles créent des `TemplateMissingInformation` ciblées et maintiennent les nœuds concernés à UNKNOWN, BLOCKED ou CONFLICTING.

L’audit `UNKNOWN_DOWNGRADED` interdit un renforcement silencieux. Les tests démontrent qu’un critère principal non arrêté reste UNKNOWN et traçable.

## 21. Conflicts

Les conflits proviennent des contradictions Project, de REG-001, des relations DOC-002 `CONFLICTS_WITH`, des identités Project/REG incohérentes ou de décisions TMP incompatibles. Chaque `TemplateConflict` reste OPEN, liste sources, nœuds, raison, résolutions possibles et `humanDecisionRequired: true`.

Le moteur ajoute une relation CONFLICTS_WITH et un statut CONFLICTING. Il ne sélectionne jamais une résolution.

## 22. Human Decisions

Les décisions TMP portent ID, acteur, mandat, cibles, outcome, raison, version, timestamp et provenance. Elles seules peuvent demander explicitement OPTIONAL. Les décisions amont sont conservées par référence `decisionId@version`, sans reconstruire leur identité.

Deux décisions incompatibles sur le même nœud créent un conflit ouvert. Une exclusion humaine crée une relation EXCLUDES traçable ; elle n’efface pas le nœud.

## 23. Readiness

La readiness locale supporte COMPLETE, PARTIAL, BLOCKED, UNKNOWN, FUTURE, CONFLICTING et INCOMPLETE. Elle est calculée par nœud puis agrégée selon une priorité conservatrice.

Chaque vue porte la notice `LOCAL_TEMPLATE_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_READINESS`. Elle ne remplace ni PD-011, ni la readiness PRJ, ni REG-001, ni une approbation humaine.

## 24. Versioning

Le contrat porte `templateVersion`, `templateRevision`, `createdAt`, `updatedAt`, `derivedFrom`, `supersedes`, `supersededBy`, `reason` et `provenance`. L’identité du template reste stable.

Un changement de description avec comportement identique incrémente la révision. Un changement de `behaviorDigest` crée une nouvelle version et remet la révision à 1. Les deux cas sont testés.

## 25. Catalog

Le `StudyTemplateCatalog` est interrogeable par texte, famille, type de nœud et document. Lookup et Query retournent des identifiants triés et le digest du catalogue. Les vues Template Graph, Template Tree, Document Graph, Requirement, Pattern, Dependency, Workflow et Readiness sont passives.

Le catalogue machine est versionné, audité, doté d’un digest et borné par `TEMPLATE_STRUCTURE_CATALOG_ONLY_NOT_PROJECT_TRUTH`.

## 26. Statistics

État généré : 1 template, 13 familles, 23 documents, 23 sections, 43 blocs, 20 blocs réutilisables, 92 nœuds, 252 relations de base, 6 instances et 100 % de couverture de provenance sur les nœuds.

Sur les six fixtures, les statuts observés couvrent 46 REQUIRED, 1 OPTIONAL, 116 CONDITIONAL, 108 NOT_APPLICABLE, 4 BLOCKED, 1 UNKNOWN, 275 FUTURE et 1 CONFLICTING. Ces nombres décrivent les fixtures techniques et non une fréquence métier.

## 27. Automated audit

Les 17 codes obligatoires sont implémentés : entrées absentes, bloc sans source, orphelins, relations/dépendances invalides, cycle, unknown renforcé, provenance manquante, référence cassée, conflit masqué, futur retiré et mutation de chacun des trois inputs.

L’audit du catalogue et les six audits d’instances retournent 0 erreur, 0 warning, 0 information. La frontière reste `DETECTION_ONLY_NO_AUTOMATIC_FIX` ; aucun finding n’est corrigé automatiquement.

## 28. Tests

La suite TMP-001 comprend 2 fichiers et 18 tests : cas A–G, base, Imaging, PHRC multi-axes, pattern seul, inconnue, conflit, niveau minimal, huit statuts, quatorze relations, treize types de nœuds, OPTIONAL non par défaut, réutilisation, déterminisme, immutabilité, catalogue, requête, vues, export/import, adaptateur, audit, version et contrats.

Le checkpoint transversal pris avant le branchement UI concurrent exécutait 56 fichiers et 521 tests : TMP-001, DOC-002, DOC-001, REG-001, PRJ, IMG, ST, Knowledge, SYS et Protocol Designer ; tous passaient. Sur l’état final concurrent, les mêmes suites donnent 499 PASS / 521 et 22 FAIL, tous causés par `transcriptEndRef.current?.scrollIntoView` dans `SemanticConversationalWorkspace.tsx`, fichier hors périmètre TMP-001. `test:tmp` reste à 18/18 ; typecheck global et TMP, lint global et TMP, génération/check des artefacts, build et `git diff --check` passent.

## 29. TMP contracts

TMP-C01 : le Research Project reste l’unique vérité du projet. TMP-C02 : REG-001 possède les exigences. TMP-C03 : DOC-002 possède les patterns. TMP-C04 : TMP compose uniquement la structure. TMP-C05 : toute source reste traçable. TMP-C06 : UNKNOWN reste UNKNOWN. TMP-C07 : les conflits restent ouverts. TMP-C08 : les dépendances restent explicites. TMP-C09 : toute instance est reconstructible. TMP-C10 : aucun document n’est produit. TMP-C11 : aucune décision scientifique, réglementaire ou éditoriale n’est prise. TMP-C12 : mêmes entrées, même sortie.

Les douze identifiants sont exposés par la définition et testés.

## 30. Non-regressions

Les empreintes avant/après sont identiques : PRJ `198d6d9492421db416a5e75bbe7b8568ab728c8bb83cfa760e34004d8c49e565` ; REG-001 `3c8fb64b46ce0e5eb6a40702bfb1ef61e390b273954494de109a921801464ca5` ; DOC-002 code `9fa87f245e70d079583931dfb7c4f5f8f2a94eb4426f39b9f13a47a94240bd29` ; DOC-001 `28eb9f2368ef5025dc0fc9ed777fdd2463e743bb75d077b835a9603d861fb174` ; REG-000 `ee11342bb570f52ef9bdd5a84143f62b31f745ba0c67f1145c808e8133b9cf68` ; corpus DOC-002 `49e0b99999b0018231ee962002c090073`.

Le build final passe. Le lint global final passe avec 0 erreur et 7 warnings Fast Refresh préexistants. Avant branchement UI concurrent, la suite globale exécutait 1 036 tests : 1 033 PASS et seulement les trois gardes externes P3M-Web 80, P4 66 et P5 en échec. Sur l’état final concurrent, elle donne 1 010 PASS / 1 036 et 26 FAIL : 22 échecs `scrollIntoView` dans le nouveau workspace sémantique, 1 échec SEO pour deux canonicals sur `/protocol-designer/demo`, et les 3 gardes Editorial Engine. SYS-001/SYS-001B établissent que le checkout externe était déjà sale ; les 23 autres échecs sont apparus avec le travail concurrent après le checkpoint vert TMP-001.

## 31. Limitations

1. DOC-001 ne consomme pas encore `StudyTemplateInstance` et ne possède actuellement qu’une `ProjectionDefinition` Protocol ; TMP-001 expose seulement un adaptateur futur.
2. REG-000 reste `CANDIDATE_CORPUS` ; une résolution REG-001 ne vaut pas validation réglementaire.
3. DOC-002 contient majoritairement des patterns candidats ou locaux ; aucun n’est promu.
4. Le rejeu final ciblé/global est rouge sur 22 tests UI `scrollIntoView` et un contrat SEO canonical introduits par le travail concurrent ; le checkpoint antérieur était vert sur ces tests. Le typecheck concurrent a été corrigé avant le snapshot final et passe désormais.
5. La suite globale reste rouge sur trois gardes externes préexistantes Editorial Engine.
6. VAL-001, la validation scientifique PD-011, l’accessibilité UI et toute génération documentaire sont hors périmètre et non réalisées.

Contradiction documentaire laissée ouverte : la cible TMP-001 place l’instance entre Project et DOC-001, tandis que l’état DOC-001 actuel consomme directement le Project. L’interdiction de modifier les moteurs existants impose un adaptateur futur ; aucun contournement silencieux n’est introduit.

## 32. Modified files

Périmètre TMP-001 : `src/features/study-template/` (13 fichiers, tests inclus), `scripts/generate-study-template-artifacts.ts`, `study-template-engine/tmp-001/` (13 JSON générés), `tsconfig.tmp001.json`, quatre scripts ajoutés à `package.json` et le présent rapport.

Les fichiers concurrents sous `api/` et `src/features/scientific-semantic-reconstruction/`, ainsi que les modifications de Protocol Designer, Scientific Thinking et `ProtocolDesignerDemo.tsx`, ne font pas partie de TMP-001. TMP-001 n’a modifié aucun fichier de PRJ, REG-001, REG-000, DOC-002, DOC-001, IMG, ST, Knowledge, SYS, aucun document normatif et aucun index ; l’état global du worktree contient néanmoins les changements concurrents listés ci-dessus.

## 33. Public contracts

Les contrats publics sont : Template Catalog, Template Lookup, Template Graph, Template Query, Template Instance, Template Statistics, Template Audit, Template Export, Template Import, Requirement Mapping, Pattern Mapping et Document Mapping.

Treize artefacts sont générés : catalogue, familles, graphe, instances, statistiques, audit, requirement mapping, pattern mapping, document mapping, dependency graph, readiness graph, structured export et manifest. Le mode `build:study-templates:check` garantit leur reproductibilité.

## 34. Future consumers

DOC-001 est déclaré comme futur consommateur en lecture seule de `DocumentDefinition`, `SectionDefinition` et `BlockDefinition`. L’adaptateur porte explicitement `FUTURE_READ_ONLY_ADAPTER_NO_PROTOCOL_PROJECTION_NO_ENGINE_MUTATION`.

VAL-001 est seulement référencé comme prochaine couche possible avec le statut `NOT_IMPLEMENTED_NEXT_ARCHITECTURAL_STEP`. Aucun validator, renderer, moteur de rédaction ou orchestration UI n’est implémenté par TMP-001.

## 35. Next step

La prochaine étape architecturale est VAL-001, dans une mission séparée, après arbitrage explicite du handoff TMP-001 → DOC-001. Elle devra consommer une instance immuable, conserver les readiness amont séparées et ne jamais transformer une complétude structurelle en validation scientifique ou réglementaire.

`STUDY_TEMPLATE_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`
