# DOC-001B — Study Template → Document Projection Integration Report

**Version :** 1.0  
**Date du constat :** 11 août 2026  
**Niveau documentaire :** NIVEAU_3 — preuve d’implémentation et de non-régression  
**Branche de travail :** `doc-001b`  
**Baseline Git :** `c6e4fa4fc3b74d6a16890a5a9b4f534e470a1916`  
**Décision :** `STUDY_TEMPLATE_DOCUMENT_PROJECTION_INTEGRATION_CLOSED_WITH_LIMITATIONS`

Ce rapport décrit l’état réellement implémenté de DOC-001B. Il ne remplace aucune autorité normative, ne crée aucune connaissance scientifique, ne constitue pas un PASS PD-011, ne produit pas de protocole clinique et n’autorise ni publication ni déploiement.

## 1. Décision

L’intégration est **fermée avec limitations**. Le nouveau pipeline DOC-001B consomme réellement une `StudyTemplateInstance` existante, tire sa structure de TMP-001, conserve le contenu scientifique sous ownership du Research Project, transporte les exigences REG-001 et les patterns DOC-002 sans les recalculer, maintient les états `UNKNOWN`, `BLOCKED`, `FUTURE`, `NOT_APPLICABLE` et les conflits, et produit une projection déterministe et auditée.

La fermeture n’est pas déclarée sans réserve pour trois raisons explicites : le chemin produit historique continue d’exister pour les consommateurs qui ne fournissent pas encore de `StudyTemplateInstance`, les 22 `DocumentDefinitions` autres que `PROTOCOL` restent classifiées mais non rendues, et la suite globale reste affectée par trois contrôles d’intégrité d’un dépôt Editorial Engine externe déjà non propre.

## 2. Autorités

La mission a été qualifiée comme une mission d’implémentation de niveau 3. Les catégories documentaires ont été séparées comme suit :

| Catégorie | Sources consultées | Usage dans DOC-001B |
|---|---|---|
| Gouvernance documentaire | `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` | Route les autorités ; ne crée aucune règle scientifique ou technique. |
| Principes établis, niveau 0 | Charte fondatrice ; Scientific Product Manifesto | Research Project comme vérité du projet, explicabilité, visibilité des limites, séparation raisonnement/projection. |
| Références normatives, niveau 1 | Editorial Engine Architecture Manifesto ; PD-003 ; PD-004 ; PD-005 ; PD-009 ; PD-011 ; RDE-001 ; RDE-002 ; RDE-003 | Définit les frontières des objets, décisions, UX, moteurs spécialisés, preuve et projection. |
| Contrats d’implémentation observés, niveau 3 | PRJ-001 ; REG-001 ; DOC-001 ; DOC-002 ; TMP-001 ; SYS-001 ; SYS-001B | État réellement implémenté et interfaces effectivement consommables. |
| Corpus scientifiques | Aucun corpus n’est modifié ni utilisé pour inventer un contenu dans cette tranche. | Le contenu éventuellement présent dans un Research Project reste amont et immuable. |
| Cible de mission | Instruction DOC-001B | Chaîne `Project → REG/DOC-002 → TMP → DOC`. |
| Hypothèses | Aucune hypothèse scientifique ou réglementaire ajoutée. | Les données manquantes restent `UNKNOWN`, `BLOCKED` ou `FUTURE`. |

Aucune autorité normative n’a été modifiée. Le présent rapport n’est pas admis dans le Source-of-Truth Index par cette mission : l’index prescrit de ne pas évoluer pour une simple fonctionnalité lorsque la gouvernance documentaire demeure inchangée.

## 3. Baseline

TMP-001 a été consolidé avant toute écriture DOC-001B :

- commit source TMP-001 : `8b30a632b038790adac1503c9cb44a8193f8fd90` ;
- commit consolidé sur `main` : `c6e4fa4fc3b74d6a16890a5a9b4f534e470a1916` ;
- `origin/main` : `c6e4fa4fc3b74d6a16890a5a9b4f534e470a1916` ;
- branche isolée `doc-001b` : même baseline ;
- worktree temporaire `noxia-main-tmp` supprimé après consolidation ;
- worktrees finaux : `noxia-dev` sur `sem-001r-closure` et `noxia-doc001b` sur `doc-001b`.

Les changements non commités SEM-001R3 ont été préservés. L’empreinte du diff suivi est restée `982fb533330a16867c5cc31a861284dd55268cd90eb0a15a4f039e9036807d5f` pendant la consolidation. Aucun fichier SEM n’a été modifié par DOC-001B.

Avant DOC-001B, DOC-001 exposait un moteur version `1.1.0`, une projection `PROTOCOL` depuis le Research Project et des renderers Markdown/HTML, sans consommation structurelle d’une `StudyTemplateInstance`. La baseline des fichiers DOC suivis avant écriture a été enregistrée sous l’empreinte `8fb53babda214a2b66b223f22c51aadf4d518049026657ea501e68907cab2eb3`.

## 4. Rupture précédente

La rupture antérieure était explicite : DOC-001 projetait directement le Research Project à partir de sa propre `ProjectionDefinition`, tandis que TMP-001 composait déjà une structure documentaire logique sans consommateur DOC effectif. Le rapport TMP-001 décrit cette absence comme une limitation de son snapshot initial.

DOC-001B ne réécrit pas ce constat historique. Il ajoute une tranche postérieure qui résout la rupture dans le nouveau pipeline. La phrase du rapport TMP-001 reste donc historiquement exacte à sa date, mais ne décrit plus l’état courant de DOC-001B. La modifier aurait violé l’interdiction de modifier TMP-001 et aurait effacé la chronologie documentaire.

## 5. Architecture cible

La chaîne effectivement implémentée est :

```text
ResearchProjectResult
        │
        ├── RegulatoryResolutionResult (REG-001)
        └── DocumentaryPatternCatalog snapshot (DOC-002)
                         │
                         ▼
              StudyTemplateInstance (TMP-001)
                         │ lecture seule
                         ▼
        projectDocumentFromStudyTemplate (DOC-001B)
                         │
                         ▼
               DocumentProjection PROTOCOL
```

DOC-001B ne recompose pas TMP-001, ne rerésout pas REG-001 et ne recherche pas de patterns DOC-002. Il vérifie et consomme leurs références figées. La chaîne reste descendante ; aucune projection ne remonte vers un moteur amont.

## 6. Contrat d’entrée

Le nouveau contrat `DocumentProjectionRequest` exige :

- le `ResearchProjectResult` complet, avec identité, version et digest ;
- un `StudyTemplateProjectionContext` contenant la `StudyTemplateDefinition` et la `StudyTemplateInstance` exactes ;
- une `RegulatoryResolutionReference` avec `resolutionId`, `corpusVersion` et `corpusDigest` ;
- une `DocumentaryPatternSnapshotReference` avec `catalogId`, `catalogVersion` et `catalogDigest` ;
- le profil, l’usage, l’audience, le type de projection et la date de demande ;
- les décisions humaines, inconnues, limites, provenance et versions optionnelles de projection.

Une absence d’instance dans le nouveau parcours est un défaut `DOC_WITHOUT_TEMPLATE_INSTANCE`. Une discordance d’identité Project/Template produit `DOC_TEMPLATE_PROJECT_MISMATCH`. Une discordance de versions ou digests Project, TMP, REG-001 ou DOC-002 produit `DOC_TEMPLATE_DIGEST_MISMATCH`.

## 7. Ownership

Le contrat de projection expose désormais l’ownership au lieu de le laisser implicite :

| Élément | Owner | Rôle de DOC-001B |
|---|---|---|
| Structure documentaire | `TMP-001` | Consommer les nœuds, sections, blocs et statuts de l’instance. |
| Contenu scientifique | `RESEARCH_PROJECT_AND_UPSTREAM_OWNERS` | Projeter sans devenir source de vérité. |
| Exigences | `REG-001` | Transporter les identifiants et la provenance, sans qualification réglementaire. |
| Patterns documentaires | `DOC-002` | Utiliser les mappings figés, sans promotion ni recalcul. |
| Forme éditoriale | `DOC-001` | Composer les sections et produire les rendus. |

Le chemin historique porte distinctement `LEGACY_DOC001_PROJECTION_DEFINITION` comme owner de structure. Il ne peut donc pas se présenter comme une consommation TMP-001.

## 8. Template consumption

`projectDocumentFromStudyTemplate` est l’entrée explicite du nouveau pipeline. Il :

1. audite la cohérence de l’entrée ;
2. résout les 23 `DocumentDefinitions` de TMP-001 ;
3. refuse une incohérence d’identité ou de digest ;
4. sélectionne la `DocumentDefinition` correspondant à la projection demandée ;
5. compose la forme éditoriale DOC-001 depuis le contenu Project ;
6. enrichit chaque section avec les nœuds TMP, Requirements, Patterns, limites, inconnues, conflits et provenance ;
7. applique les statuts TMP dominants sans les renforcer ;
8. calcule versions et digest logiques ;
9. audite la projection produite ;
10. gèle récursivement le résultat.

La `StudyTemplateInstance` est consommée telle quelle. Les contrôles de mutation comparent l’état logique avant et après projection.

## 9. DocumentDefinitions

Les 23 `DocumentDefinitions` TMP-001 sont toutes résolues et exposées avec un statut documentaire :

- `SUPPORTED_PROJECTION` lorsqu’une `ProjectionDefinition` DOC-001 existe et que TMP autorise la projection ;
- `FUTURE_PROJECTION` lorsque la capacité DOC n’existe pas encore ou dépend d’une capacité future ;
- `NOT_APPLICABLE` lorsque TMP-001 qualifie explicitement le document ainsi ;
- `BLOCKED` lorsque TMP conserve un blocage ou un conflit ;
- `UNKNOWN` lorsque les informations amont ne permettent pas la qualification.

La classification rend visible le portefeuille documentaire sans simuler les 22 projections non implémentées.

## 10. Protocol

`PROTOCOL` reste la seule projection rendue par le moteur DOC-001 courant. Sa structure est résolue à partir de la `DocumentDefinition` TMP `PROTOCOL`, de son nœud documentaire et des bindings explicites entre les 16 sections DOC actuelles et les nœuds logiques TMP.

Le résultat est un artefact documentaire de recherche, en lecture seule. Sa frontière contractuelle est `READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL`. Aucun paramètre d’acquisition, aucune recommandation clinique et aucun protocole exécutable ne sont inventés.

## 11. Section resolution

Chaque section projetée expose au minimum :

- `templateNodeIds`, `templateSectionIds` et `templateBlockIds` ;
- `projectObjectIds` ;
- `requirementIds` et `patternIds` ;
- `sourceEngine` ;
- `templateStatus` et `templateReadiness` ;
- `unknowns`, `limitations`, `contradictions`, `conflicts` et `futureReason` ;
- `provenanceRefs` transitives ;
- le statut de générabilité et l’applicabilité DOC.

Le nœud dominant est choisi selon une priorité conservatrice : `CONFLICTING`, `BLOCKED`, `FUTURE`, `UNKNOWN`, `NOT_APPLICABLE`, `REQUIRED`, `CONDITIONAL`, `OPTIONAL`. Une absence de binding laisse la section visible et bloquée ; elle n’est jamais interprétée comme une autorisation implicite.

## 12. Statuses

La table de propagation est explicite :

| Statut TMP | Statut DOC |
|---|---|
| `REQUIRED`, `OPTIONAL`, `CONDITIONAL` | Générabilité dérivée du contenu Project, sans changer le sens TMP. |
| `NOT_APPLICABLE` | `NOT_APPLICABLE`. |
| `BLOCKED` | `BLOCKED`. |
| `UNKNOWN` | `UNKNOWN`, applicabilité `APPLICABILITY_UNKNOWN`. |
| `FUTURE` | `FUTURE`, avec raison future visible. |
| `CONFLICTING` | `BLOCKED`, conflit conservé. |

Les diagnostics interdisent respectivement le renforcement d’un `UNKNOWN`, le contournement d’un `BLOCKED`, la simulation d’un `FUTURE` et la dissimulation d’un conflit.

## 13. Requirements

Les `Requirement IDs` sont sélectionnés uniquement depuis `StudyTemplateInstance.requirementMapping` pour les nœuds affectant la section. Les références de la résolution REG-001 et du corpus réglementaire sont propagées dans la source de projection et la provenance des sections.

DOC-001B ne réévalue ni l’applicabilité réglementaire, ni le statut PHRC, ni une exigence de financement. Une exigence sans référence REG-001 est détectée par `DOC_REQUIREMENT_WITHOUT_REG_SOURCE`.

## 14. Patterns

Les `Pattern IDs` sont sélectionnés uniquement depuis `StudyTemplateInstance.patternMapping`. Le `catalogId`, la version et le digest du snapshot DOC-002 sont conservés dans la source de projection.

DOC-001B ne promeut pas un pattern candidat, ne requalifie pas son niveau de confiance et ne relance pas le moteur documentaire. Un pattern sans référence DOC-002 est détecté par `DOC_PATTERN_WITHOUT_DOC002_SOURCE`.

## 15. Provenance

La provenance transitive comprend :

- l’identité, la version et le digest du Research Project ;
- l’identité, la version, la révision et le digest de la définition TMP ;
- l’identité et le digest de la `StudyTemplateInstance` ;
- les références et digests REG-001 et DOC-002 ;
- les nœuds, supports et sources TMP ;
- les identifiants Project, Requirement et Pattern réellement utilisés ;
- la provenance explicite fournie par le demandeur.

Un contenu substantiel sans objet Project produit `DOC_CONTENT_WITHOUT_PROJECT_SOURCE`. Une section sans nœud TMP produit `DOC_SECTION_WITHOUT_TEMPLATE_NODE`.

## 16. Versionnement

Le contrat DOC passe de `1.1.0` à `1.2.0`. La projection enregistre séparément :

- version du moteur DOC ;
- version TMP ;
- version du snapshot de patterns ;
- version de la politique de composition ;
- version de la `ProjectionDefinition` ;
- version du renderer.

Une nouvelle série commence en `1.0.0`. Un changement amont de source ou de structure incrémente la version mineure ; un changement interne compatible incrémente la version de patch. Le test de contrat SYS-001 a été aligné sur la version documentaire `1.2.0`, sans modification de l’implémentation SYS.

## 17. Regeneration

Le digest logique est calculé sur le contenu, la structure, les sources, les versions, les statuts, les décisions, les inconnues, les limites et les conflits. `requestedAt` n’entre pas dans la matière logique.

À entrées logiques et configuration identiques, la projection conserve le même digest et la même identité malgré une date de demande différente. Si le digest est identique à la projection antérieure, l’instance précédente est réutilisée. Les entrées amont restent immuables et aucun fichier généré TMP, REG-001 ou DOC-002 n’est réécrit.

## 18. Diff

Le diff de projections distingue huit natures de changement :

1. `PROJECT_CONTENT_CHANGED` ;
2. `TEMPLATE_STRUCTURE_CHANGED` ;
3. `REGULATORY_REQUIREMENT_CHANGED` ;
4. `DOCUMENTARY_PATTERN_CHANGED` ;
5. `UNKNOWN_CHANGED` ;
6. `CONFLICT_CHANGED` ;
7. `LIMITATION_CHANGED` ;
8. `RENDERER_ONLY_CHANGED`.

Le diff conserve en plus les changements de statut, d’applicabilité, de générabilité, de contenu et de références de source section par section. Un changement de renderer seul n’est pas présenté comme un changement scientifique.

## 19. Legacy path

Le parcours direct antérieur est nommé explicitement `LEGACY_DIRECT_PROJECT_PROJECTION`, porte `deprecated: true` et indique `projectDocumentFromStudyTemplate` comme remplacement. Ses sorties exposent une source Template nulle et l’ownership de structure `LEGACY_DOC001_PROJECTION_DEFINITION`.

Le dispatcher `projectDocument` conserve temporairement la compatibilité : une requête contenant `templateContext` emprunte le nouveau pipeline ; une ancienne requête emprunte le parcours legacy. Les 24 tests DOC-001B appellent directement le nouveau pipeline et démontrent qu’il n’utilise jamais le chemin legacy.

## 20. Cas A–G

| Cas | Entrée | Résultat vérifié |
|---|---|---|
| A | Étude sans Imaging | Structure Imaging `NOT_APPLICABLE`, sources conservées. |
| B | Étude Imaging | Blocs Imaging structurés depuis TMP. |
| C | Imaging avec moteur spécialisé incomplet | Structure présente, contenu partiel, aucune invention. |
| D | Projet PHRC | Requirements funding transportées, aucune qualification recalculée. |
| E | Unknown réglementaire | Branche `UNKNOWN`/`CONDITIONAL`, aucun document inventé. |
| F | Moteur Biostatistics futur | Bloc `FUTURE`, dépendance explicite, aucune simulation. |
| G | Conflit Template | Conflit conservé et sections affectées bloquées. |

## 21. Audit

L’audit `DOC-001B-AUDIT-1.0.0` est strictement détectif (`DETECTION_ONLY_NO_AUTOMATIC_FIX`). Il implémente les 15 diagnostics obligatoires :

`DOC_WITHOUT_TEMPLATE_INSTANCE`, `DOC_TEMPLATE_PROJECT_MISMATCH`, `DOC_TEMPLATE_DIGEST_MISMATCH`, `DOC_SECTION_WITHOUT_TEMPLATE_NODE`, `DOC_CONTENT_WITHOUT_PROJECT_SOURCE`, `DOC_REQUIREMENT_WITHOUT_REG_SOURCE`, `DOC_PATTERN_WITHOUT_DOC002_SOURCE`, `TMP_UNKNOWN_STRENGTHENED`, `TMP_BLOCKED_BYPASSED`, `TMP_FUTURE_SIMULATED`, `CONFLICT_HIDDEN`, `PROJECT_MUTATED`, `TEMPLATE_MUTATED`, `REG_MUTATED`, `DOC002_MUTATED`.

Chaque finding possède un identifiant déterministe, une sévérité, un sujet, un message et des références de preuve. Aucune correction automatique n’est déclenchée.

## 22. Tests

Résultats constatés le 11 août 2026 :

| Validation | Résultat |
|---|---|
| DOC-001B dédié | 24/24 tests. |
| DOC-001 complet | 46/46 tests. |
| DOC-001 + SYS après alignement de version | 80/80 tests, 15 fichiers. |
| TMP-001 | 18/18 tests. |
| DOC-002 | 42/42 tests. |
| REG-001 | 21/21 tests. |
| PRJ-001 | 56/56 tests. |
| IMG + ST + Knowledge + SYS + Protocol Designer | 362/362 tests, 41 fichiers, après l’unique alignement de contrat SYS. |
| Typecheck principal | PASS. |
| Typecheck TMP | PASS. |
| Lint | PASS, 0 erreur et 7 avertissements Fast Refresh préexistants dans les composants UI. |
| Build production | PASS ; avertissements non bloquants Browserslist, annotation Rollup et taille d’un chunk. |
| Artefacts TMP | `STUDY_TEMPLATE_ARTIFACTS_CURRENT:13`. |
| Corpus DOC-002 | PASS ; 120 patterns, couverture de provenance et d’évidence à 100 %, audit 0/0/0. |
| `git diff --check` | PASS. |
| Suite globale | 1057/1060 tests, 74/77 fichiers ; trois seuls échecs externes détaillés en section 23. |

Les avertissements React Router observés pendant les tests sont des avertissements de migration future et non des échecs.

## 23. Non-régressions

Les suites ciblées PRJ-001, REG-001, DOC-002, TMP-001, DOC-001, IMG, ST, Knowledge, SYS et Protocol Designer sont préservées. Les chemins amont `research-project-construction`, `regulatory-resolution`, `documentary-knowledge` et `study-template` ne présentent aucun changement Git dans le worktree DOC-001B.

La suite globale ne présente que les trois échecs explicitement autorisés à rester isolés par la mission :

- `P3M-Web deterministic migration > leaves editorial-engine clean` ;
- `P5 scientific multidomain wave > leaves editorial-engine unchanged` ;
- `P4 real sourced ECV/T1 scientific corpus > leaves editorial-engine unchanged`.

Le dépôt externe `/Users/charles/Documents/Projets/editorial-engine`, branche `main`, HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, contient actuellement 30 entrées modifiées/indexées et 12 entrées non suivies. DOC-001B n’a lu que son état Git et ne l’a pas modifié. Ces trois échecs sont `BLOCKED_EXTERNAL`, préexistants au périmètre DOC-001B et sans rapport avec le résultat fonctionnel de l’intégration.

## 24. Limitations

1. `PROTOCOL` est la seule projection DOC effectivement implémentée ; les 22 autres `DocumentDefinitions` sont visibles et qualifiées, mais ne sont pas rendues.
2. Les consommateurs produit historiques qui ne construisent pas encore de `StudyTemplateInstance` utilisent le dispatcher compatible et restent sur `LEGACY_DIRECT_PROJECT_PROJECTION`. Le nouveau pipeline est complet, mais son branchement exclusif dans l’interface produit appartient à une tranche ultérieure.
3. Le rapport TMP-001 conserve son constat historique d’absence de consommation DOC. Il n’a pas été réécrit, conformément aux frontières de la mission.
4. Les trois contrôles globaux Editorial Engine restent bloqués par l’état externe non propre ; ils ne peuvent être corrigés depuis ce worktree.
5. Les avertissements de build, lint et React Router restent non bloquants mais visibles.
6. Aucun test de cette tranche ne vaut validation scientifique, revue humaine, PASS PD-011, validation clinique ou autorisation de publication.
7. Le présent rapport de niveau 3 n’est pas admis par l’index dans cette opération. Une admission éventuelle exige une décision documentaire séparée.

## 25. Fichiers modifiés

Implémentation DOC-001B :

- `src/features/document-projection/types.ts` ;
- `src/features/document-projection/contracts.ts` ;
- `src/features/document-projection/template-integration.ts` ;
- `src/features/document-projection/audit.ts` ;
- `src/features/document-projection/projection.ts` ;
- `src/features/document-projection/section-planner.ts` ;
- `src/features/document-projection/editorial.ts` ;
- `src/features/document-projection/diff.ts` ;
- `src/features/document-projection/versioning.ts` ;
- `src/features/document-projection/markdown-renderer.ts` ;
- `src/features/document-projection/html-renderer.ts` ;
- `src/features/document-projection/DocumentProjectionView.tsx` ;
- `src/features/document-projection/index.ts`.

Tests et fixtures :

- `src/features/document-projection/__tests__/fixtures.ts` ;
- `src/features/document-projection/__tests__/projection-engine.test.ts` ;
- `src/features/document-projection/__tests__/contracts-history-renderers.test.ts` ;
- `src/features/document-projection/__tests__/ui.test.tsx` ;
- `src/features/document-projection/__tests__/doc-001b-study-template-integration.test.ts` ;
- `src/features/system-integration/__tests__/contracts.test.ts` — alignement attendu de `1.1.0` vers `1.2.0` uniquement.

Rapport :

- `docs/doc-001b-study-template-document-projection-integration-report.md`.

Aucun fichier normatif, PRJ-001, REG-001, DOC-002, TMP-001, SEM, IMG, ST, Knowledge, SYS d’implémentation ou Protocol Designer n’a été modifié.

## 26. Prochaine étape

Une tranche séparée pourra construire la `StudyTemplateInstance` dans l’orchestration produit avant l’appel DOC, basculer les consommateurs restants vers `projectDocumentFromStudyTemplate`, mesurer les régressions de surface puis retirer le dispatcher legacy lorsqu’aucun appel historique ne subsiste. Cette étape devra préserver les mêmes frontières d’ownership et ne pourra ni recomposer silencieusement TMP, ni transformer les projections futures en capacités présentes.

Toute admission de ce rapport dans le Source-of-Truth Index, tout commit, tout push ou tout déploiement nécessitent une décision distincte. Aucun de ces actes n’est réalisé par DOC-001B.

`STUDY_TEMPLATE_DOCUMENT_PROJECTION_INTEGRATION_CLOSED_WITH_LIMITATIONS`
