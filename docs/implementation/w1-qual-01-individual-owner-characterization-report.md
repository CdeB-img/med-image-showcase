# W1-QUAL-01 — Independent Individual Owner Characterization

`LEVEL_3_IMPLEMENTATION_EVIDENCE — NON_NORMATIVE`

## 1. Decision

`W1_QUAL_01_OWNER_REPAIR_REQUIRED`

La campagne finale `W1-QUAL-01-2026-08-25-G` caractérise séparément les cinq owners Wave 1 dans un périmètre borné. Knowledge, Imaging, REG et VAL satisfont leurs enveloppes dans ce périmètre. Scientific Thinking présente un défaut critique générique reproductible : sur deux KnowledgeResults gelés, typés et supportés (cardiaque et neuro), il conserve la question mais ne produit aucune hypothèse ni aucun objectif candidat.

```text
KNOWLEDGE_CHARACTERIZATION =
CHARACTERIZED_WITHIN_BOUNDED_SCOPE

SCIENTIFIC_THINKING_CHARACTERIZATION =
OWNER_REPAIR_REQUIRED

IMAGING_CHARACTERIZATION =
CHARACTERIZED_WITHIN_BOUNDED_SCOPE

REG_CHARACTERIZATION =
CHARACTERIZED_WITHIN_BOUNDED_SCOPE

VAL_CHARACTERIZATION =
CHARACTERIZED_WITHIN_BOUNDED_SCOPE
```

Ces statuts ne constituent ni une validation scientifique universelle, ni un PASS PD-011, ni une caractérisation de la boucle assemblée.

## 2. Baseline

| Élément | Valeur vérifiée avant modification |
|---|---|
| Dépôt | `/Users/charles/Documents/Projets/NOXIA/noxia-dev` |
| Branche | `protocol-designer-canonical-ingestion` |
| HEAD initial | `772cacfd184daeb531eef6a7a866874a7863e228` |
| `origin/protocol-designer-canonical-ingestion` | `772cacfd184daeb531eef6a7a866874a7863e228` |
| `main` | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| `origin/main` | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Roadmap preflight | Wave 1 active; architecture `YES`; observabilité `YES`; caractérisation individuelle `NO`; boucle contrôlée `NO`; Wave 1 `NO`; W1-QUAL-01 autorisée |
| État suivi initial | clean |
| Artefacts non suivis historiques | présents et préservés |

Aucune dérive de baseline et aucune contradiction normative bloquante n'ont été observées.

## 3. Authorities

Les autorités ont été consultées dans l'ordre imposé :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` ;
2. NOXIA — Charte fondatrice ;
3. NOXIA Protocol Designer — Scientific Product Manifesto V2 ;
4. Editorial Engine — Architecture Manifesto ;
5. `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md`.

Les autorités spécialisées effectivement applicables ont ensuite été ciblées : PD-003 V2, Ownership Matrix et Relationship Catalog ; OBS-001 pour la seule frontière Imaging/measurement ; PD-005 ; PD-009 ; PD-011 ; RDE-001/002/003 ; KE-001 ; REG-000/REG-001 ; VAL-000/VAL-001. Les Reasoning Books RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 ont servi de références scientifiques contextualisées, jamais de normes produit. Les rapports W0/W1 ont uniquement servi de preuves Level 3.

## 4. Freeze

| Contrôle | Valeur finale |
|---|---|
| Campaign ID | `W1-QUAL-01-2026-08-25-G` |
| Harness | `1.1.3` |
| Freeze digest | `ke1-338176f77d9f11f3` |
| Manifest digest | `ke1-e87cad99f91d14d5` |
| Git HEAD gelé | `772cacfd184daeb531eef6a7a866874a7863e228` |
| Project schema | `PRJ001_CANONICAL_RESEARCH_PROJECT_STATE@0.2.0` |
| Snapshot | `PROJECT_CONTEXT_SNAPSHOT@0.3.0` |
| OwnerResult | `PROJECT_SPINE_02_SPECIALIZED_OWNER_HANDOFF@0.1.0` |
| TRACE | `SCIENTIFIC_EXECUTION_TRACE_LEDGER@0.1.0` |
| Knowledge | `1.2.0`; registry `1.1.0`; digest `ke1-b5727e470489eecb` |
| Scientific Thinking | `1.2.0` |
| Imaging | `1.2.1` |
| REG | `1.0.0`; REG-000 `1.0.0`; digest `ke1-40ba687c4aefa298`; `CANDIDATE_NOT_ADMITTED` |
| VAL | `VAL-001-DETERMINISTIC-ENGINE@1.0.0`; product profile `0.1.0` |
| Provider/LLM/external calls | `0` |

Les campagnes A à F ont été invalidées lorsqu'un défaut de harness a été démontré. Leurs résultats ne sont pas retenus et aucun runtime owner n'a été modifié :

| Campagne | Défaut de harness | Correction bornée avant nouveau freeze |
|---|---|---|
| A | configuration VAL différente au replay | replay sur l'input VAL gelé exact |
| B | faux négatifs des évaluateurs documentaires | grounding documentaire et fidélité de question correctement reconnus |
| C | couverture Imaging insuffisamment exercée et couverture de concepts Knowledge trop faible | upstreams Imaging typés et obligation multi-concepts |
| D | faux snapshot successeur pour le stale readback | vrai Project vN+1 confirmé par Human Decision et snapshot canonique |
| E | métadonnées corpus REG absentes du freeze | version/digest/statut REG et digest registry Knowledge explicites |
| F | lint ciblé du harness rouge | exemption locale documentée pour l'inspection de contrats JSON hétérogènes |

## 5. Method

La campagne utilise 35 cas nouveaux, 35 Acceptance Envelopes et 35 Frozen Input Packs créés avant observation. Chaque owner reçoit uniquement son entrée contractuelle :

- Knowledge : snapshot + KnowledgeRequest ;
- Scientific Thinking : snapshot + KnowledgeResult synthétique typé et gelé ;
- Imaging : snapshot + Knowledge refs + ScientificThinkingResult synthétique typé et gelé ;
- REG : snapshot + RegulatoryRequest gelée ;
- VAL : snapshot + chaîne d'OwnerResults gelée + recette de défaut pré-déclarée.

Les upstreams ne sont jamais recalculés dans les cas ST et Imaging. Aucun Gold JSON exact, aucun reroll, aucun LLM, aucun provider externe, aucune recherche web/PubMed et aucun enrichissement de corpus n'ont été utilisés.

## 6. Anti-overfitting controls

- enveloppes écrites et gelées avant observation ;
- obligations critiques définies avant exécution ;
- wording, ordre et pluralité scientifiquement défendable autorisés à varier ;
- inputs typés et digests vérifiés ;
- sous-ensemble de replay pré-déclaré ;
- campagnes partielles invalidées intégralement après chaque défaut de harness ;
- aucun changement de runtime owner après le premier résultat observé ;
- aucun défaut owner réparé pendant la mission.

## 7. Case design

| Owner | Cas | Domaines/catégories |
|---|---:|---|
| Knowledge | 6 | Cardiac MRI, spectral imaging, neuro perfusion, hors corpus, ambiguïté de référence, stale readback |
| Scientific Thinking | 4 | Cardiac MRI, spectral imaging, neuro perfusion, hors corpus |
| Imaging | 4 | Cardiac MRI, spectral imaging, neuro perfusion, chaîne de mesure non supportée |
| REG | 8 | France, EU/EEA, US, international, juridiction unsupported, juridiction absente, contexte incomplet, requête stale |
| VAL | 13 | clean chain, digest, stale K/ST, owner, provenance, unknown, limitation, contradiction, deux lineages, OBS gap, non-scientific-PASS |
| Total | 35 | 35 primary runs + 8 replays |

Le corpus est volontairement minimal : il couvre les frontières et failure classes structurantes sans prétendre estimer une performance populationnelle.

## 8. Reference design

Chaque enveloppe scientifique lie ses obligations à des références admises (`corpusRef`, `sourceRef`, localisateur ou assertion ref lorsqu'ils existent), avec applicabilité et limites conservées dans les packs et résultats. Les cas hors corpus utilisent des attentes contractuelles de gap/refus. Les inputs ST/Imaging synthétiques sont des OwnerResults typés déterministes construits directement depuis ces références ; aucune reconstruction textuelle LLM n'intervient.

## 9. Knowledge characterization

`KNOWLEDGE_CHARACTERIZATION = CHARACTERIZED_WITHIN_BOUNDED_SCOPE`

- 6 cas, 6 entièrement satisfaits ;
- 57 obligations : 55 `SATISFIED`, 2 `NOT_APPLICABLE`, 0 violation ;
- 47 obligations critiques, 0 violation critique ;
- 14 classes exercées, aucune observée ; `KNOWLEDGE_GAP_SUPPRESSED` et `SOURCE_REFERENCE_MISSING` ne sont pas injectées séparément, mais les frontières adjacentes honest-gap/source-grounding sont exercées ;
- le hors-corpus et l'ambiguïté produisent un gap, pas une assertion artificielle ;
- le résultat vN reste historiquement lisible et stale contre le vrai Project vN+1 ;
- 2 replays stables ; 6 primary TRACE runs, 45 événements primaires.

Limite : six cas contextualisés ne démontrent ni complétude du corpus ni qualité universelle des réponses Knowledge.

## 10. Scientific Thinking characterization

`SCIENTIFIC_THINKING_CHARACTERIZATION = OWNER_REPAIR_REQUIRED`

- 4 cas : 2 entièrement satisfaits, 2 avec violation critique ;
- 45 obligations : 42 `SATISFIED`, 1 `NOT_APPLICABLE`, 2 `VIOLATED` ;
- 44 obligations critiques, 2 violations critiques ;
- failure class observée : `CRITICAL_REASONING_OMISSION` ;
- `ST-CARDIAC-01` : question conservée, statut `CLARIFICATION_REQUIRED`, 0 hypothèse, 0 objectif ;
- `ST-NEURO-01` : question conservée, statut `CLARIFICATION_REQUIRED`, 0 hypothèse, 0 objectif ;
- `ST-SPECTRAL-01` : 2 questions, 2 hypothèses, 2 objectifs et 1 alternative, tous candidats ;
- `ST-UNSUPPORTED-01` : clarification correcte sans hypothèse solide ;
- lineage Knowledge, contradictions, unknowns, non-promotion et zéro Project write restent préservés ;
- le replay pré-déclaré de `ST-CARDIAC-01` reproduit le même digest logique : le défaut est reproductible ;
- 4 primary TRACE runs, 28 événements primaires.

Le premier résultat incorrect observable apparaît dans `SCIENTIFIC_THINKING_ENGINE`, pas dans le pack upstream. Aucune correction n'a été effectuée.

## 11. Imaging characterization

`IMAGING_CHARACTERIZATION = CHARACTERIZED_WITHIN_BOUNDED_SCOPE`

- 4 cas, 4 entièrement satisfaits ;
- 48 obligations : 47 `SATISFIED`, 1 `NOT_APPLICABLE`, 0 violation ;
- 40 obligations critiques, 0 violation critique ;
- modalités/acquisitions restent candidates, QA et compatibilité inconnue sont visibles, Core Lab reste `HUMAN_ASSESSMENT_REQUIRED / NO_AUTOMATIC_OPTIMUM` ;
- la chaîne non supportée retourne/clarifie sans acquisition surengagée ;
- unknowns et upstream refs restent reconstructibles ;
- `OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED` et `OBS_RUNTIME_UNAVAILABLE_NO_AUTONOMOUS_QUALIFICATION` restent explicites ;
- 1 replay stable ; 4 primary TRACE runs, 28 événements primaires.

`OBS_CAPABILITY_INVENTED = NO`

Limite : aucune qualification OBS, aucun protocole exécutable et aucune meilleure stratégie universelle ne sont démontrés.

## 12. REG characterization

`REG_CHARACTERIZATION = CHARACTERIZED_WITHIN_BOUNDED_SCOPE`

- 8 cas, 8 entièrement satisfaits ;
- 58 obligations : 54 `SATISFIED`, 4 `NOT_APPLICABLE`, 0 violation ;
- 58 obligations critiques, 0 violation critique ;
- France, EU/EEA, US et guidance internationale sont résolus uniquement dans le corpus encodé ;
- `CA` échoue fermé avec `UNSUPPORTED_JURISDICTION:CA` ;
- la requête stale échoue fermée avec `REGULATORY_PRODUCT_REQUEST_SNAPSHOT_MISMATCH` ;
- juridiction/contexte manquants restent manquants ;
- REG-000 reste `CANDIDATE_NOT_ADMITTED` et méthodologique seulement ;
- 2 replays stables ; 8 primary TRACE runs, 50 événements primaires.

`REGULATORY_APPROVAL_INVENTED = NO`

Limite : aucune complétude du droit courant, aucun avis juridique et aucune approbation réglementaire ne sont démontrés.

## 13. VAL characterization

`VAL_CHARACTERIZATION = CHARACTERIZED_WITHIN_BOUNDED_SCOPE`

- 13 cas, 13 entièrement satisfaits ;
- 78 obligations, toutes `SATISFIED` ;
- 78 obligations critiques, 0 violation critique ;
- les défauts pré-déclarés de digest, stale, ownership, provenance, conservation et lineage sont détectés ;
- la chaîne clean ne produit aucun faux finding critique ;
- le gap OBS attendu ne produit aucun faux finding ;
- un `STRUCTURAL_FIDELITY_PASS` ne devient jamais scientific PASS ou qualification PD-011 ;
- 2 replays stables ; 13 primary TRACE runs, 78 événements primaires.

```text
VAL_REPAIR_PERFORMED = NO
SCIENTIFIC_PASS_INVENTED = NO
```

## 14. Failure classes

| Owner | Classes dans la taxonomie | Exercées | Observées | Non directement exercées |
|---|---:|---:|---|---|
| Knowledge | 16 | 14 | 0 | `KNOWLEDGE_GAP_SUPPRESSED`, `SOURCE_REFERENCE_MISSING` |
| Scientific Thinking | 15 incluant contrôles communs | 13 | 1 | `FALSE_CERTAINTY`, `KNOWLEDGE_CONTEXT_LOSS` |
| Imaging | 16 incluant contrôles communs | 13 | 0 | `OBS_GAP_LOST`, `PROJECT_ADOPTION_LEAK`, `QA_REQUIREMENT_LOSS` comme injections indépendantes |
| REG | 13 incluant contrôles communs | 10 | 0 | contradiction, current-law completeness et legal conclusion comme injections indépendantes |
| VAL | 17 incluant contrôles communs/alias stale | 16 | 0 défaut VAL | `PROJECT_DIGEST_MISMATCH` est exercé via le finding stale/digest générique |

L'absence d'une classe observée signifie uniquement qu'elle n'est pas apparue dans le périmètre gelé.

## 15. First divergent stages

| Case | Owner | First divergent stage | Failure class | Evidence TRACE | Repair owner |
|---|---|---|---|---|---|
| `ST-CARDIAC-01` | Scientific Thinking | `SCIENTIFIC_THINKING_ENGINE` | `CRITICAL_REASONING_OMISSION` | `scientific-run:W1-QUAL-01-2026-08-25-G:ST-CARDIAC-01:primary` | Scientific Thinking |
| `ST-NEURO-01` | Scientific Thinking | `SCIENTIFIC_THINKING_ENGINE` | `CRITICAL_REASONING_OMISSION` | `scientific-run:W1-QUAL-01-2026-08-25-G:ST-NEURO-01:primary` | Scientific Thinking |

Les deux inputs contiennent un Project snapshot exact et un KnowledgeResult typé gelé. Aucune divergence upstream n'est observable avant l'exécution ST.

## 16. Determinism/replay

| Owner | Replays | Stabilité logique |
|---|---:|---|
| Knowledge | 2 | stable |
| Scientific Thinking | 1 | stable, y compris le défaut cardiaque |
| Imaging | 1 | stable |
| REG | 2 | stable, y compris le rejet stale |
| VAL | 2 | stable |

Les huit replays conservent digest logique, gaps, limitations et sources selon les champs applicables. La campagne comprend 43 runs TRACE et 280 événements ; tous portent `privateReasoningStored=false`, `repairAuthorized=false` et `projectWriteAuthorized=false`.

## 17. Human arbitrations

Aucun cas `HUMAN_ARBITRATION_REQUIRED`. Aucun conflit local entre enveloppe et sortie n'empêche de figer la preuve.

## 18. Coverage limitations

- corpus volontairement petit, non statistique et non représentatif de tous les domaines ;
- aucune comparaison à une référence clinique universelle ;
- aucun benchmark de performance, sensibilité ou exhaustivité ;
- plusieurs failure classes sont couvertes par un contrôle composite plutôt que par une injection indépendante ;
- corpus Knowledge narratif et borné ;
- REG-000 candidat/non admis ;
- OBS, Study Design autonome, Biostatistics calculation, DM realized-time et orchestration restent absents/ouverts ;
- W1-LOOP-QUAL-01 n'est pas réalisée.

## 19. Historical debts

Les huit échecs historiques sont reproduits à l'identique et restent séparés des deux nouveaux défauts ST :

| Suite | Passed | Failed | Classification |
|---|---:|---:|---|
| Imaging historical | 56 | 4 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| PRJ historical | 72 | 1 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` (`IMG_001B_LIVE_HANDOFF_NOT_FROZEN`) |
| SYS historical | 31 | 3 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| Total | 159 | 8 | préexistant, non réparé |

## 20. Program implications

```text
W1_ARCHITECTURAL_CONVERGENCE_READY = YES
W1_OBSERVABILITY_READY = YES
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
WAVE_2_AUTHORIZED = NO
```

La première dette réelle est maintenant la couverture de candidats Scientific Thinking. Lancer la caractérisation contrôlée de la boucle avec ce défaut connu mélangerait un défaut owner avec des erreurs de handoff/chaîne.

## 21. Files

- rapport : `docs/implementation/w1-qual-01-individual-owner-characterization-report.md` ;
- roadmap : `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md` ;
- harness : `validation/w1-qual-01/harness/` ;
- artefacts machine : `validation/w1-qual-01/*.json` ;
- test d'intégrité : `src/features/protocol-designer/functional-reset/__tests__/w1-qual-01-characterization-harness.test.ts`.

## 22. Tests

| Contrôle | Résultat exact |
|---|---|
| Validation machine campagne G | 35 cas, 35 enveloppes, 35 packs, 43 traces, manifest digest valide |
| Harness final G | 1 fichier, 3 tests passed, 0 failed |
| Owners/TRACE/SPINE ciblés | 29 fichiers passed + 1 skipped ; 738 tests passed, 7 skipped, 0 failed |
| Typecheck application | PASS |
| ESM runtime | PASS via préparation, exécution et validation `vite-node` |
| Lint ciblé final | PASS |
| Build | PASS ; avertissements non bloquants Browserslist/CSS/chunks conservés |
| Historique IMG/PRJ/SYS | 159 passed, 8 failed préexistants |

Le premier lint ciblé a invalidé F ; G a été gelée uniquement après correction de cette dette de harness.

## 23. Next mission

`NEXT_AUTHORIZED_MISSION = W1-SCIENTIFIC-THINKING-REPAIR-01_CRITICAL_REASONING_CANDIDATE_COVERAGE`

Mission bornée proposée : corriger uniquement la production de candidats question/hypothèse/objectif pour des KnowledgeResults supportés et typés, sans promotion de preuve, sans adoption Project, sans enrichissement de corpus et sans toucher aux autres owners. Une nouvelle caractérisation ST sera nécessaire avant W1-LOOP-QUAL-01.
