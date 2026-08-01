# P11 — Production scientifique continue pilotée par territoire

Validation : **valide**. Quatre campagnes atomiques ont enrichi le corpus sans créer de surface publique. La production s'arrête proprement avant la radiomique, qui ne possède pas encore de paquet de sources et de candidats validé.

## 1. État Git initial

Branche main, HEAD `e733d58041a7f6e1e979d52ae1dba424f6793fb9`, écart origin/main 0/0, worktree propre et diff-check valide.

## 2. État initial du catalogue

Catalogue 1.2.0, 258 nœuds, digest `92834a05b8719456eeecae538cdac8aad1325eb7a3959c97a665be3b29044a58`.

## 3. Snapshot initial

Snapshot `53d0623e162de389906de675804676374e57d8cdea49cffe9ea30e9fc8fa8ca2`, dérivé de l'état P10 validé.

## 4. File initiale

12 campagnes planifiées ; T2 mapping en première position.

## 5. Campagnes examinées

12 entrées de file ont été observées sans sélection manuelle.

## 6. Campagnes exécutées

| Ordre | Campagne | Domaine | Score | Statut | Motif |
| --- | --- | --- | --- | --- | --- |
| 1 | SCIENTIFIC-CAMPAIGN-20260801-002 | t2-mapping | 70 | COMPLETED_WITH_GAPS | FIRST_OFFICIAL_QUEUE_ENTRY_WITH_VALIDATED_PACKAGE |
| 2 | SCIENTIFIC-CAMPAIGN-20260801-003 | quality-control | 69 | COMPLETED_WITH_GAPS | FIRST_OFFICIAL_QUEUE_ENTRY_WITH_VALIDATED_PACKAGE |
| 3 | SCIENTIFIC-CAMPAIGN-20260801-004 | neuro-oncology | 68 | COMPLETED_WITH_GAPS | FIRST_OFFICIAL_QUEUE_ENTRY_WITH_VALIDATED_PACKAGE |
| 4 | SCIENTIFIC-CAMPAIGN-20260801-005 | oef-cmro2 | 65 | COMPLETED_WITH_GAPS | FIRST_OFFICIAL_QUEUE_ENTRY_WITH_VALIDATED_PACKAGE |

## 7. Campagnes bloquées

1 campagne : la radiomique, faute de paquet scientifique validé.

## 8. Campagnes différées

7 entrées restent en file après l'arrêt propre.

## 9. Ordre réel d'exécution

1. t2-mapping
2. quality-control
3. neuro-oncology
4. oef-cmro2

## 10. Score de chaque domaine

- t2-mapping : 70
- quality-control : 69
- neuro-oncology : 68
- oef-cmro2 : 65

## 11. Manifestes créés

- SCIENTIFIC-CAMPAIGN-20260801-002 — `53ac10610b500c99dd5d3a3b850c805ff2ba72d1f5ab3d7e4e710699fd034a28`
- SCIENTIFIC-CAMPAIGN-20260801-003 — `978ba16f6f8faabb1bf4c1a5d64b904b847e7bb1206136f7bf9be1871312e2b7`
- SCIENTIFIC-CAMPAIGN-20260801-004 — `4b7e93ea223393eff289b3c680e7dd288dc534c2102e4a578bdd9c8f8fad3170`
- SCIENTIFIC-CAMPAIGN-20260801-005 — `a43d8a1b7a13debea1e8df2a10516f8c1a938e7a89be5f1df2809f8b5528ef80`

## 12. Simulations

Deux simulations strictement identiques ont précédé chaque écriture.

## 13. Sources intégrées

17 SourceRevisions ajoutées et 3 réutilisées, toutes localisées sur PubMed/PMC.

## 14. Concepts intégrés

36 concepts sourcés intégrés.

## 15. Assertions intégrées

48 assertions atomiques intégrées.

## 16. EvidenceLinks intégrés

48 liens : 31 SUPPORTS et 17 QUALIFIES.

## 17. Synthèses créées

4 synthèses internes déterministes, sans méta-analyse statistique.

## 18. Projections internes créées

4 projections INTERNAL_ONLY, sans route, canonical ni indexation.

## 19. Décisions de revue

282 objets préparés possèdent une décision ; aucune revue humaine n'est revendiquée.

## 20. Couverture après chaque campagne

| Domaine | Couverture avant | Couverture après | Readiness avant | Readiness après |
| --- | --- | --- | --- | --- |
| t2-mapping | DISCOVERING | EDITORIAL_READY | SCIENTIFIC_AND_PROVENANCE_BLOCKED | scientifique/provenance/synthèse/projection/editorial READY ; public BLOCKED |
| quality-control | DISCOVERING | EDITORIAL_READY | SCIENTIFIC_AND_PROVENANCE_BLOCKED | scientifique/provenance/synthèse/projection/editorial READY ; public BLOCKED |
| neuro-oncology | DISCOVERING | EDITORIAL_READY | SCIENTIFIC_AND_PROVENANCE_BLOCKED | scientifique/provenance/synthèse/projection/editorial READY ; public BLOCKED |
| oef-cmro2 | DISCOVERING | EDITORIAL_READY | SCIENTIFIC_AND_PROVENANCE_BLOCKED | scientifique/provenance/synthèse/projection/editorial READY ; public BLOCKED |

## 21. Readiness après chaque campagne

Les six dimensions internes sont READY pour chaque domaine ; publicReadiness reste BLOCKED.

## 22. Replay de chaque campagne

Les quatre replays reconstruisent les catalogues, registres et snapshots attendus.

## 23. Rollback dry-run de chaque campagne

| Campagne | Simulation 1 | Simulation 2 | Exécution | Replay | Rollback |
| --- | --- | --- | --- | --- | --- |
| SCIENTIFIC-CAMPAIGN-20260801-002 | 06b75b8466ca247694e945e4e87b677ef1c88f021986e7b6b2508d00e08f2739 | 06b75b8466ca247694e945e4e87b677ef1c88f021986e7b6b2508d00e08f2739 | COMPLETED_WITH_GAPS | VALID | VALID_DRY_RUN |
| SCIENTIFIC-CAMPAIGN-20260801-003 | 929545c082c902c8bc6353c2fd510add214cd77842cd0a88b2f50660e1b5fc21 | 929545c082c902c8bc6353c2fd510add214cd77842cd0a88b2f50660e1b5fc21 | COMPLETED_WITH_GAPS | VALID | VALID_DRY_RUN |
| SCIENTIFIC-CAMPAIGN-20260801-004 | 446b159c35e73fa56bced787cba22d4c779c6cd736127aa56d2eea18166b5cb6 | 446b159c35e73fa56bced787cba22d4c779c6cd736127aa56d2eea18166b5cb6 | COMPLETED_WITH_GAPS | VALID | VALID_DRY_RUN |
| SCIENTIFIC-CAMPAIGN-20260801-005 | ee4c06e6a7be1eb2fceeb8de2d8aebf040b4c1f578e8b9acf1913e04b4fe01fc | ee4c06e6a7be1eb2fceeb8de2d8aebf040b4c1f578e8b9acf1913e04b4fe01fc | COMPLETED_WITH_GAPS | VALID | VALID_DRY_RUN |

## 24. Catalogue avant/après

| Métrique | Initial | Final | Delta |
| --- | --- | --- | --- |
| KnowledgeNodes | 258 | 294 | 36 |
| Sources | 97 | 114 | 17 |
| Assertions | 189 | 237 | 48 |
| EvidenceLinks | 226 | 274 | 48 |
| Synthèses | 28 | 32 | 4 |
| Projections internes | 25 | 29 | 4 |
| Campagnes en file | 12 | 8 | -4 |

## 25. File finale

8 campagnes demeurent planifiées ; digest `256224b479be48cce87ef489a0fe9699f65722c6dd8b2247ee50cd6c6e029589`.

## 26. Prochain domaine

`noxia:knowledge-catalog:domain:radiomics`, calculé automatiquement.

## 27. État de continuous-wave/data.mjs

Préservé, 282 décisions, 0 objet différé et aucun objet non traité.

## 28. Tests ajoutés

19 tests P11 dédiés, complétés par les tests de non-régression P10 et catalogue.

## 29. Validations exécutées

Validation P11 : true. Les validations globales sont consignées dans le rapport final d'exécution.

## 30. Avertissements

- CRITERIA_APPLICABILITY_REMAINS_TRIAL_AND_TREATMENT_SPECIFIC
- CROSS_VENDOR_GENERALIZATION_NOT_ESTABLISHED_BY_IDENTICAL_SCANNER_STUDY
- DSC_IMPLEMENTATION_VARIABILITY_REMAINS
- LOCAL_REFERENCE_RANGES_REMAIN_SITE_SPECIFIC
- MRI_VALIDATION_SAMPLES_ARE_SMALL_AND_PRIMARILY_HEALTHY
- QIB_SPECIFIC_CONFORMANCE_REQUIREMENTS_REMAIN_PROFILE_DEPENDENT
- REGIONAL_CMRO2_VALIDATION_REMAINS_INCOMPLETE
- SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED
- TASK_SPECIFIC_METRIC_SELECTION_REMAINS_REQUIRED

## 31. Risques restants

- SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED
- NEXT_QUEUE_DOMAIN_REQUIRES_NEW_SOURCE_RESEARCH
- PUBLICATION_REMAINS_OUT_OF_SCOPE

## 32. Fichiers créés

- `src/knowledge-graph/scientific-campaigns/territorial-wave/`
- `scripts/p11-scientific-production.mjs`
- `docs/p11-continuous-territorial-scientific-production.md`
- `docs/p11-continuous-territorial-scientific-production-report.json`
- `docs/p11-continuous-territorial-scientific-production-report.md`

## 33. Fichiers modifiés

- `package.json`
- `src/knowledge-graph/knowledge-catalog/catalog-builder.mjs`
- `src/knowledge-graph/knowledge-catalog/constants.mjs`
- `src/knowledge-graph/knowledge-catalog/validators.mjs`
- `src/knowledge-graph/knowledge-catalog/knowledge-catalog.json`
- `src/knowledge-graph/knowledge-catalog/knowledge-catalog.test.mjs`
- `src/knowledge-graph/scientific-campaigns/continuous-wave/adapter.mjs`
- `src/knowledge-graph/scientific-campaigns/continuous-wave/state.mjs`
- `src/knowledge-graph/scientific-campaigns/continuous-wave/continuous-wave.test.mjs`

## Tableaux de contrôle

| Campagne | Sources | Concepts | Assertions | EvidenceLinks | Synthèses | Projections |
| --- | --- | --- | --- | --- | --- | --- |
| SCIENTIFIC-CAMPAIGN-20260801-002 | 4 + 1 réutilisée(s) | 9 | 12 | 12 | 1 | 1 |
| SCIENTIFIC-CAMPAIGN-20260801-003 | 4 + 1 réutilisée(s) | 9 | 12 | 12 | 1 | 1 |
| SCIENTIFIC-CAMPAIGN-20260801-004 | 4 + 1 réutilisée(s) | 9 | 12 | 12 | 1 | 1 |
| SCIENTIFIC-CAMPAIGN-20260801-005 | 5 + 0 réutilisée(s) | 9 | 12 | 12 | 1 | 1 |

| Domaine bloqué | Cause | Données manquantes | Action future |
| --- | --- | --- | --- |
| noxia:knowledge-catalog:domain:radiomics | NO_VALIDATED_PREPARED_PACKAGE | Officially localized sources, atomic candidate assertions and validated EvidenceLinks | Run a new source-research and candidate-preparation pass derived from the official queue |

| Contrat | Préservé ? | Test ou preuve | Remarque |
| --- | --- | --- | --- |
| Territory Model immuable | Oui | 23dbfdf7d0d65016bc27b607fa91b0b6103394cdc87573e08c30e3acf455fd66 | Digest identique à P10 |
| Sélection par la file | Oui | P11 sequential-selection validator | File recalculée après chaque campagne |
| Atomicité | Oui | One writer apply per campaign | Aucun objet partiel |
| Replay | Oui | Four replay digests | Catalogue et snapshot reproduits |
| Rollback | Oui | Four dry-runs | Aucun rollback appliqué |
| Revue humaine honnête | Oui | Candidate validator | Revue automatisée explicitement typée |
| Projections internes | Oui | Projection guards | Sans route, canonical ni sitemap |
| Surfaces protégées | Oui | Protected-surface validator | Pages, routes, SEO, sitemap, viewers et produit inchangés |
| Aucun commit/push/déploiement | Oui | Opérations non exécutées | Worktree local uniquement |

PRODUCTION SCIENTIFIQUE BLOQUÉE PAR LES SOURCES
