# REG-001 — Regulatory Requirement Resolution Engine

**Rapport d’implémentation v1.0**

**Date :** 10 août 2026

**Dépôt :** `noxia-dev`

## 1. Décision

`REGULATORY_REQUIREMENT_RESOLUTION_V1_IMPLEMENTED_WITH_LIMITATIONS`

REG-001 est implémenté comme un résolveur déterministe, borné au corpus REG-000 et à une projection minimale du Research Project. Il classe chaque `Requirement` sans modifier le projet ni le corpus, conserve les inconnues et les contradictions, sépare les exigences obligatoires des guides, et ne transforme jamais une qualification candidate en décision réglementaire.

La décision reste assortie de limitations parce que REG-000 demeure `NIVEAU_2_CANDIDATE / CANDIDATE_NOT_ADMITTED`, son champ ne couvre pas encore positivement les dispositifs médicaux et DMDIV, et plusieurs relations de règles sont des symboles structurés plutôt que des expressions entièrement exécutables. REG-001 expose ces limites dans `corpusDiagnostics`; il ne les corrige pas.

Cette décision n’est ni une validation réglementaire, ni une consultation juridique, ni une approbation institutionnelle, ni un PASS scientifique PD-011.

## 2. Autorités

La gouvernance a été appliquée avant toute modification substantielle : lecture intégrale du SOURCE-OF-TRUTH-INDEX, puis consultation de la Charte fondatrice, du Scientific Product Manifesto, de l’Architecture Manifesto de l’Editorial Engine, de PD-003, PD-004, PD-005, PD-009, PD-011, RDE-001, RDE-002, RDE-003, KE-001, PRJ-001, SYS-001, SYS-001B, DOC-001, REG-000 et de son rapport.

Les plans de vérité sont séparés :

- **principes établis :** Research Project unique, responsabilité humaine, inconnue jamais inventée, décisions et contradictions conservées, traçabilité et reproductibilité ;
- **références normatives :** documents de gouvernance précités, consommés sans modification ;
- **corpus :** REG-000 et ses sources externes, utilisés comme candidat structuré sans promotion en autorité ;
- **cible :** résolution locale d’un `Applicable Requirement Set` pour un Research Project donné ;
- **état réellement implémenté :** feature TypeScript déterministe, contrats, interpréteur borné, projections structurées, trace et tests ;
- **hypothèses :** les futures éditions, les branches réglementaires absentes et les qualifications humaines seront fournies par de futurs corpus ou acteurs autorisés.

Une contradiction documentaire reste visible : la mission demande d’appliquer REG-000 alors que ce corpus n’est pas admis comme NIVEAU_2 officiel. REG-001 l’utilise comme snapshot candidat explicitement identifié et retourne un diagnostic/readiness correspondant ; il ne modifie pas le SOURCE-OF-TRUTH-INDEX.

## 3. Baseline

- branche : `main` ;
- HEAD de départ REG-001 : `2fb264628cf055ad487930cf4d7a6bbf58319b94` ;
- dépôt NOXIA propre au démarrage ;
- REG-000 maître SHA-256 : `e84c4a2bcab1cf2fd8188fa18f6a675d8ef393c1fdbbb15cad9f7ddded3e31cf` ;
- schéma REG-000 SHA-256 : `4cb662c63072cdbb2c16f5ce0f916a7c3f116e24f3244449145c74d844441280` ;
- rapport REG-000 SHA-256 : `b982dcbae0f48a4e0a9490bedbc99d6fb28a034a155f9a75ca36233bc86d296f` ;
- test REG-000 SHA-256 : `11b3dc930e2b3248e2fa95b3f0b9c74388c2238dddbf15bbb81ab14d6e86efae` ;
- Editorial Engine externe : HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, déjà non propre et conservé strictement en lecture seule.

Les quatre empreintes REG-000 sont identiques avant et après REG-001.

## 4. Architecture

La feature `src/features/regulatory-resolution/` sépare :

- `types.ts` : contrats, états, partitions, readiness et diagnostics ;
- `corpus.ts` : adapter read-only de REG-000, version et digest logique ;
- `input.ts` : projection minimale PRJ et constructeurs de faits explicites ;
- `applicability.ts` : interprétation bornée des identifiants de condition et d’exclusion déjà présents ;
- `resolver.ts` : période, juridiction, conditions, dépendances, conflits et projections ;
- `trace.ts` : trace logique reproductible ;
- `index.ts` : surface publique ;
- `__tests__/` : fixtures et 21 tests REG-001.

Le moteur ne contient ni LLM, ni appel réseau, ni génération documentaire, ni mutation de projet, ni horloge implicite. Toute condition REG-000 sans interprétation admise devient `UNKNOWN_MISSING_INFORMATION` et un `UNINTERPRETED_CONDITION`.

## 5. Input contract

`RegulatoryResolutionInput` transporte les identités et digests du projet et du corpus, une date `resolutionAsOf`, les axes juridiction, projet, design, intervention, produit, données, échantillons, multicentre, international et financement, les qualifications connues, unknowns, contradictions, Human Decision Envelopes et provenance.

Chaque fait est qualifié par `KNOWN`, `CANDIDATE`, `UNKNOWN`, `NOT_APPLICABLE` ou `CONFLICTING`, avec valeur, raison et provenance. Une valeur est obligatoire pour `KNOWN`, `CANDIDATE` et `CONFLICTING`; elle est obligatoirement `null` pour `UNKNOWN` et `NOT_APPLICABLE`. Une propriété absente ne peut donc pas devenir implicitement `false`.

`buildRegulatoryResolutionInput` ne lit du résultat PRJ que l’identité du projet, la version candidate, le digest et les décisions du handoff. Le reste est une projection réglementaire explicite, pas une copie du Research Project.

## 6. Output contract

`RegulatoryResolutionResult` contient tous les champs requis : identité, version/digest du projet et du corpus, date, quatre partitions de Requirements, qualifications, informations manquantes, contradictions, revues humaines, financement, documents, soumissions, approbations, guides, provenance, trace et readiness.

Il ajoute explicitement :

- `regulatoryMandatoryRequirements` ;
- `reportingGuidance`, séparé de `methodologicalGuidance` ;
- `humanDecisions`, conservées sans reconstruction ;
- `corpusDiagnostics`, pour les limites du snapshot et les relations symboliques.

`resolutionId` est dérivé du contenu logique canonique. `resolvedAt` reprend la date explicite `resolutionAsOf`; aucune valeur `Date.now()` ne perturbe le replay.

## 7. Applicability model

Les neuf statuts demandés sont implémentés : `APPLICABLE`, `CONDITIONALLY_APPLICABLE`, `POTENTIALLY_APPLICABLE`, `NOT_APPLICABLE`, `UNKNOWN_REQUIRES_QUALIFICATION`, `UNKNOWN_MISSING_INFORMATION`, `CONFLICTING_REQUIREMENTS`, `SUPERSEDED` et `OUTSIDE_EFFECTIVE_PERIOD`.

Pour chaque Requirement, la trace vérifie version/digest, période, juridiction, `appliesIf`, `doesNotApplyIf`, `requires`, `dependsOn`, qualification et conflits. La précédence est conservatrice : conflit, exclusion démontrée, qualification requise, information manquante, candidat, puis applicabilité positive. Une exclusion inconnue ne produit jamais `NOT_APPLICABLE`.

Les relations `dependsOn` qui référencent une Requirement existante sont résolues après la première passe. Les symboles non-Requirement restent dans la trace et dans `corpusDiagnostics`; ils ne sont pas transformés en règles cachées.

## 8. Qualification model

Une qualification `HUMAN_CONFIRMED` ne satisfait une condition que si elle référence une Human Decision Envelope `ADOPTED` avec `actor` et `mandate`. Une `QUALIFICATION_CANDIDATE` reste `UNKNOWN_REQUIRES_QUALIFICATION`.

En l’absence de choix humain, le moteur produit des besoins génériques tels que `RIPH_CATEGORY_QUALIFICATION_REQUIRED`, `MR_SCOPE_QUALIFICATION_REQUIRED` ou `EU_CTR_SCOPE_QUALIFICATION_REQUIRED`. Il ne choisit donc pas silencieusement RIPH 1/2/3, MR-001/MR-003 ou une qualification américaine.

## 9. Temporalité

La comparaison utilise exclusivement `resolutionAsOf` et les champs `effectiveFrom`, `effectiveUntil`, `status` et `supersededBy` du corpus. Une exigence remplacée devient `SUPERSEDED`; une édition hors fenêtre devient `OUTSIDE_EFFECTIVE_PERIOD` même si le projet mentionne son programme.

Les campagnes archivées restent rejouables à une date historique explicite. Elles ne sont jamais appliquées à une campagne future.

## 10. Juridictions

Le résolveur conserve séparément la juridiction du projet et celles des centres. Chaque Requirement retourne `applicableJurisdictions` et `excludedJurisdictions`. Une exigence française peut donc être limitée au centre français d’un projet international sans s’étendre aux centres américains ou européens.

Aucune appartenance géopolitique n’est inférée entre axes : un projet doit déclarer explicitement `EU_EEA` si cette portée doit être évaluée.

## 11. Funding

Programme, édition, stade, sélection après stade antérieur, documents, sections, champs, annexes, deadlines et workflow restent distincts. Les Requirements PHRC-N 2025-2026 et RHU V6 2023 produisent des ensembles différents et conservent DGOS ou ANR comme provenance.

Le PHRC stade 1 et le stade 2 sont résolus séparément. Une édition seulement candidate produit au plus `POTENTIALLY_APPLICABLE`; une édition inconnue n’hérite d’aucune ancienne campagne.

## 12. Document requirements

`DocumentRequirementResolution` conserve `documentRequirementId`, document, statut, Requirement parent, sources, autorité, raison, conditions, édition, période, sections, champs, annexes et provenance. Le moteur projette à la fois les documents embarqués dans les Requirements et les objets `documentRequirements` autonomes de REG-000.

Le test PHRC prouve le contraste : le protocole est `NOT_APPLICABLE` comme pièce du stade 1 encodé, puis obligatoire dans le dossier complet du stade 2. Aucun document n’est généré.

## 13. Methodological guidance

`METHODOLOGICAL_GUIDANCE` et `REPORTING_GUIDANCE` sont projetés dans deux collections séparées. Ils ne sont jamais ajoutés à `regulatoryMandatoryRequirements`. SPIRIT, CONSORT, STROBE, RECORD, TRIPOD, STARD et PRISMA conservent ainsi leur nature de guide, même si une incorporation explicite est déclarée.

## 14. Unknowns

Toute condition indécidable par manque de fait devient `UNKNOWN_MISSING_INFORMATION`. `MissingRegulatoryInformation` conserve le champ, la raison, les Requirements bloquées, les conséquences possibles, un signal de priorité et la provenance.

REG-001 ne choisit pas la prochaine question. Il n’implémente pas QRY-001.

## 15. Contradictions

Les contradictions de l’entrée et les relations explicites entre Requirements sont retournées avec `OPEN_NO_AUTOMATIC_ARBITRATION`. Les Requirements concernées deviennent `CONFLICTING_REQUIREMENTS`; aucune priorité, date ou autorité n’est utilisée pour élire silencieusement un vainqueur.

Les incohérences ou lacunes d’interprétation du corpus sont distinctes dans `corpusDiagnostics`.

## 16. Human Decision Envelope

Le contrat SYS-001B est importé directement. Les champs `decisionId`, `actor`, `mandate`, `scope`, `status`, `version`, `timestamp`, `impact`, `targets`, `reason`, `provenance`, `engineSource` et `projectVersion` sont conservés.

Une porte `PENDING` peut rester sans acteur, mandat ni timestamp. Une qualification engageante ne peut satisfaire le résolveur qu’avec une décision `ADOPTED` disposant d’un acteur et d’un mandat. REG-001 ne crée ni acteur, ni mandat, ni motif.

## 17. Readiness

La readiness locale utilise : `RESOLUTION_COMPLETE`, `RESOLUTION_PARTIAL`, `QUALIFICATION_REQUIRED`, `MISSING_INFORMATION`, `CONTRADICTION_OPEN`, `CORPUS_INSUFFICIENT` et `CORPUS_VERSION_OUTDATED`.

Elle porte la notice permanente `LOCAL_REGULATORY_RESOLUTION_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_APPROVAL`. Le statut candidat de REG-000 empêche une qualification sans réserve même lorsque toutes les conditions d’un scénario sont résolues.

## 18. Cas A–J

| Cas | Résultat démontré |
|---|---|
| A — observationnel rétrospectif FR | champ RIPH inconnu conservé, route CNIL/MR à qualifier, aucune catégorie choisie |
| B — intervention médicament | CTR/CTIS applicable après qualification humaine explicite ; route ANSM RIPH 1 séparée et non appliquée sous la route européenne spécifique encodée |
| C — dispositif | aucune Requirement médicament héritée ; absence de branche dispositif positive signalée comme limite du corpus |
| D — PHRC | seule l’édition/stade explicite est projetée avec documents, deadline et workflow ; stade 1/stade 2 distincts |
| E — RHU | Requirements RHU/ANR séparées du PHRC/DGOS avec trois annexes conservées |
| F — données de santé | `UNKNOWN_REQUIRES_QUALIFICATION`, sans choix MR-001/MR-003 |
| G — international multicentrique | juridictions par centre séparées ; aucune généralisation française |
| H — fait manquant | `UNKNOWN_MISSING_INFORMATION`, jamais `NOT_APPLICABLE` |
| I — remplacée | `SUPERSEDED` avec référence vers la Requirement courante fournie |
| J — conflit | deux Requirements `CONFLICTING_REQUIREMENTS`, contradiction ouverte, aucune arbitration |

## 19. Tests

- REG-001 ciblé : 21/21 tests réussis ;
- non-régression REG-000 + REG-001 + PRJ + SYS + DOC : 149/149 tests réussis ;
- typecheck global : réussi ;
- lint global : 0 erreur, 7 avertissements Fast Refresh préexistants ;
- build de production : réussi, avec avertissements préexistants `caniuse-lite`, annotations `PURE` et taille de chunk ;
- suite complète : 973/976 tests réussis ; les trois seuls échecs contrôlent l’état propre du dépôt externe `editorial-engine`, déjà non propre avant REG-001 et non modifié par cette mission ;
- contrôle ESLint strict de la feature REG-001 : réussi avec zéro avertissement ;
- `git diff --check` et contrôle whitespace `--no-index` des nouveaux fichiers : réussis.

La suite couvre déterminisme, juridiction, période, `appliesIf`, `doesNotApplyIf`, dépendance, unknown propagation, supersession, conflit, édition de financement, séparation réglementaire/guidance, privacy, information manquante, décisions humaines, provenance, version/digest et égalité du Requirement Set.

## 20. Non-régressions

REG-000, son schéma, son rapport et son test gardent exactement leurs empreintes de baseline. Aucun fichier PRJ, Knowledge, ST, IMG, DOC, SYS-001B, external evidence, manifeste, corpus scientifique, route, renderer ou autorité documentaire n’est modifié.

Le moteur compare les sérialisations canoniques avant/après et lève une erreur explicite si l’entrée projet ou le corpus est muté. Aucun commit, push ou déploiement n’est effectué.

## 21. Limitations

- REG-000 reste candidat non admis et n’est pas une autorité réglementaire.
- Le corpus v1 ne contient pas de Requirements positives complètes pour les dispositifs médicaux, DMDIV et plusieurs routes non médicamenteuses ; REG-001 s’abstient au lieu d’extrapoler.
- L’interpréteur est volontairement borné aux identifiants REG-000 actuels. Toute nouvelle condition inconnue bloque la branche et produit un diagnostic.
- Certaines relations `dependsOn` et `conflictsWith` sont des symboles métier sans Requirement autonome ; elles restent informatives tant que le corpus ne fournit pas une cible exécutable.
- Le mapping entre contexte documentaire et Requirement est limité aux contextes explicitement présents dans REG-000 v1.
- Les campagnes futures PHRC, RHU, Horizon Europe, NIH et autres ne sont pas inventées.
- Aucune UI REG-001 n’a été ajoutée : les contrats et tests suffisent à démontrer la résolution sans créer une fausse validation réglementaire.
- QRY-001, TMP-001, la veille réglementaire, l’adoption institutionnelle et la qualification experte restent hors périmètre.
- La suite globale reste affectée par l’état sale préexistant du dépôt externe Editorial Engine.

## 22. Fichiers modifiés

Créés :

- `src/features/regulatory-resolution/types.ts` ;
- `src/features/regulatory-resolution/corpus.ts` ;
- `src/features/regulatory-resolution/input.ts` ;
- `src/features/regulatory-resolution/applicability.ts` ;
- `src/features/regulatory-resolution/resolver.ts` ;
- `src/features/regulatory-resolution/trace.ts` ;
- `src/features/regulatory-resolution/index.ts` ;
- `src/features/regulatory-resolution/__tests__/fixtures.ts` ;
- `src/features/regulatory-resolution/__tests__/reg-001.test.ts` ;
- `docs/reg-001-requirement-resolution-engine-report.md`.

Aucun fichier existant n’est modifié.

## 23. Contrats

1. Le Research Project reste la seule source de vérité du projet.
2. REG-001 consomme une projection minimale et ne la mute jamais.
3. REG-000 est consommé read-only et son digest est vérifié.
4. Même projet, même corpus et même date de résolution produisent le même Requirement Set et le même `resolutionId`.
5. Absence, inconnu, candidat, non-applicable explicite et contradiction restent distincts.
6. Une qualification candidate n’est jamais une décision humaine.
7. Une qualification engageante exige une Human Decision Envelope adoptée avec acteur et mandat.
8. Les juridictions ne sont jamais fusionnées.
9. Une ancienne édition n’est jamais projetée comme édition courante.
10. Les guides méthodologiques et de reporting ne deviennent pas des obligations réglementaires.
11. Une contradiction reste ouverte jusqu’à arbitrage externe ou humain.
12. Toute exigence conserve sources, autorité, période, édition et provenance.
13. REG-001 ne produit aucun document et ne choisit aucune question adaptative.
14. La readiness locale ne vaut ni readiness scientifique globale, ni approbation réglementaire.

## 24. Prochaine étape

La prochaine étape cohérente est de faire admettre ou réviser REG-000 selon la gouvernance, puis de concevoir QRY-001 pour sélectionner une information réglementaire manquante à partir de `MissingRegulatoryInformation`. TMP-001 ou une projection documentaire future pourra ensuite consommer `RegulatoryResolutionResult` en lecture seule, sans déplacer la source de vérité hors du Research Project.

REGULATORY_REQUIREMENT_RESOLUTION_V1_IMPLEMENTED_WITH_LIMITATIONS
