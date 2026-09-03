# OWNER-KNOWLEDGE-COVERAGE-01 — rapport de couverture

## A. Baseline et portée

- Repository : `/Users/charles/Documents/Projets/NOXIA/noxia-dev`
- Branche : `protocol-designer-canonical-ingestion`
- HEAD audité : `76a5d91969d77eabeb9e1022cb5096a6cd5ba8f5`
- Remotes observés après fetch : intégration et `main` à `b6aed0e2d3002d45cfce04c321f93e9faf917c01`
- Worktree initial : 0 changement tracked, 0 fichier staged, 9 rapports historiques untracked préservés
- Calls provider : 0

Mission strictement documentaire. Aucun engine, contrat runtime, QRY, Project, TRACE, VAL, TMP/DOC ou UI n’est modifié.

## B. Méthode et plans de vérité

Le `SOURCE-OF-TRUTH-INDEX` a été utilisé comme routeur. Les responsabilités ont été dérivées des autorités spécialisées applicables puis confrontées aux contrats/runtime réellement présents au HEAD. Les 58 entrées RC01, 9 assets NOXIA, 5 sets liés et les logs/gaps de `REFERENCE-CORPUS-01` ont été traités comme sources/références, jamais comme autorité normative NOXIA.

Chaque besoin distingue : mécanique propre de l’owner ; connaissance externe ; information du Project ; jugement humain. Une couverture documentaire n’implique ni accessibilité runtime, ni capacité mécanique, ni décision correcte, ni validation scientifique/humaine.

## C. Carte des besoins

72 classes bornées ont été décrites sur 11 frontières : 9 owners scientifiques/techniques, plus Research Project et QRY limités à leur rôle de consommation/routage.

Les domaines explicitement couverts incluent : question/hypothèses/alternatives ; familles et temporalité de design ; observabilité, mesure et performance ; acquisition/QA/Core Lab ; estimand, modèle, missingness, multiplicité et dimensionnement ; identité/occurrences/lineage ; collecte, queries, reconciliation et release ; applicabilité EU/France, privacy, safety et funding.

## D. Résultat de couverture documentaire

Les statuts sont orthogonaux, donc non sommables en score unique :

| Statut | Besoins concernés |
|---|---:|
| `COVERED_STRONG` | 20 |
| `COVERED_PARTIAL` | 33 |
| `COVERED_CONTEXT_LIMITED` | 16 |
| `COVERED_BY_EXISTING_NOXIA_ASSET` | 19 |
| `REFERENCE_EXISTS_BUT_NOT_RUNTIME_REACHABLE` | 66 |
| `GAP_DOCUMENTARY` | 16 |
| `GAP_OWNER_MECHANIC` | 10 |
| `GAP_RUNTIME_ACCESS` | 8 |
| `HUMAN_ONLY` | 47 |
| `NOT_APPLICABLE` | 2 |

Forces : référentiel général de recherche/GCP ; ICH E9/E9(R1) ; guides FDA locaux pour imagerie, adaptive design, endpoints multiples, non-infériorité et données standardisées ; socle CDISC/SCDM ; QIBA DWI/DCE ; EU CTR ; GDPR/CNIL ; protocoles/SAP liés ; P4/P5 et RB-003/004/005.

Limites structurantes : couverture scientifique interne étroite ; absence de corpus générique de validité/mesure ; design observationnel/diagnostic incomplet ; dimensionnement de précision/observationnel/cluster/diagnostic insuffisant ; absence de charte imagerie/Core Lab/transfer/reader ; absence de chaîne Protocol→CRF→Dictionary→DMP→SAP ; corpus ANSM/CTIS document-level et safety/device incomplet ; faible profondeur opérationnelle française.

## E. Suffisance par owner

| Owner | Mécanique | Couverture | Accès runtime | Premier test humain |
|---|---|---|---|---|
| Scientific Thinking | `READY_WITH_LIMITATIONS` | context-limited | `READY_WITH_LIMITATIONS` | `READY_WITH_LIMITATIONS` |
| Study Design | `READY_WITH_LIMITATIONS` | partial | `NOT_READY` | `READY_WITH_LIMITATIONS` |
| OBS | `NOT_READY` | context-limited | `NOT_READY` | `NOT_READY` |
| Imaging | `READY_WITH_LIMITATIONS` | context-limited | `READY_WITH_LIMITATIONS` | `READY_WITH_LIMITATIONS` |
| Biostatistics | `NOT_READY` | partial | `NOT_READY` | `NOT_READY` |
| CDM | `READY_WITH_LIMITATIONS` | partial | `NOT_READY` | `READY_WITH_LIMITATIONS` |
| Data Management | `READY_WITH_LIMITATIONS` | partial | `NOT_READY` | `READY_WITH_LIMITATIONS` |
| REG | `READY_WITH_LIMITATIONS` | partial | `READY_WITH_LIMITATIONS` via REG-000, pas RC01 | `READY_WITH_LIMITATIONS` |

`NOT_READY` ne signifie pas comportement actuellement faux : les contrats peuvent dégrader vers `UNKNOWN`, `INFORMATION_REQUIRED` ou proposition non adoptée. Il signifie que la capacité complète demandée pour une recommandation owner utile n’est pas démontrée.

### Mécaniques réellement insuffisantes

- OBS : le runtime valide des déclarations `ObservableProperty`, `MeasurementDefinition` et `BiomarkerRole`, mais ne porte pas les structures normatives de validité, performance, erreur, confounders, qualité ou harmonisation.
- Biostatistics : quatre familles de méthode, `model=null` et calcul borné à deux groupes continus ; diagnostic plan, non-infériorité/équivalence et dimensionnements spécialisés absents.
- CDM : mapping externe CDISC/ODM/terminologies non exécutable et non qualifié.

### Gaps qui ne sont pas des gaps documentaires

Les informations de population, phénomène, calendrier, équipement/sites, données réelles, missingness, juridiction, classification produit/étude, rôles, transferts et contraintes sont des `PROJECT_CONTEXT_GAP` lorsqu’elles manquent. Aucun corpus ne doit les inventer. L’adoption de toute option, la qualification réglementaire/légale, l’acceptation du risque et l’interprétation scientifique/clinique sont `HUMAN_ONLY`.

## F. Knowledge runtime et première divergence

Le runtime Knowledge 1.2.1 possède un registry interne, cinq adapters, des identités/digests, des sources/localisateurs, assertions/statements, coverage/gaps, applicabilité partielle, trace et persistance. Les providers effectifs sont P4R, P5, Knowledge Graph et RB-003/004/005 ; P4 est replay-only et l’assertion layer vide.

Un corridor externe distinct utilise PubMed comme provider de découverte/métadonnées/résumés. Il produit seulement `SOURCE_CANDIDATE`, `ASSERTION_CANDIDATE` et candidate evidence, sans extraire le full text ni fusionner les candidates aux conclusions effectives.

`REFERENCE_CORPUS_RUNTIME_REACHABLE = NO`.

La première divergence est `REGISTRY_NOT_RUNTIME_VISIBLE` entre `reference-corpus.json` et `provider-registry.ts`. Aucun identifiant RC01 n’existe sous `src/`, aucun provider et aucun adapter RC01 ne sont déclarés. Les documents non ingérés, l’absence d’index/ancres et les handoffs owners manquants sont des frontières aval.

Deux limites de contrat interdisent un branchement naïf : `RuntimeSource` ne porte pas juridiction, dates d’effet, supersession, source class ou licence ; le filtre d’applicabilité ne traite pas les prédicats réglementaires/versionnés. Forcer RC01 dans `GovernedDocumentaryStatement` le ferait passer pour un corpus NOXIA gouverné, ce qui serait incorrect.

## G. Bridge minimal futur

`REFERENCE_KNOWLEDGE_BRIDGE_01` doit : enregistrer un provider/adaptor read-only RC01 ; produire des snapshots documentaires versionnés et ancrés, initialement pour les cinq PDF FDA locaux ; maintenir les 53 entrées remote-only en metadata-only/`MISSING_SOURCE_ACCESS` ; indexer besoin/type de support/concepts/juridiction/version ; restituer seulement des candidates avec limitations ; étendre additivement les métadonnées et filtres ; puis brancher les owners via QRY→KnowledgeResult sans accès PDF direct.

Scientific Thinking et Imaging peuvent réutiliser leur projection actuelle. Study Design, OBS, Biostatistics, CDM et DM nécessitent des dépendances KnowledgeResult read-only ; REG conserve son resolver REG-000 et n’admet aucune Requirement depuis RC01 automatiquement.

## H. Sources de pratique et sets liés

Les cinq sets sont `PARTIAL`. Ils permettent d’observer l’identité d’étude, un corridor protocol/SAP et certains rôles documentaires, mais aucun ne permet une analyse complète objectif→endpoint→CRF/dictionnaire→DMP→SAP. Aucun ne comporte charte imagerie, Core Lab/reader/transfer, release, code ou publication.

La valeur d’extraction future est `MEDIUM` : quatre candidats récurrents sont défendables (identité stable ; versions/supersession des SAP ; double rôle des fichiers combinés ; relation explicite des addenda). L’absence d’artefacts aval interdit une extraction end-to-end à haute valeur.

## I. Priorités

- P0 : 4 gaps, tous liés au corridor runtime (registry, ingestion, index/ancres, handoffs owners).
- P1 : 12 gaps de mécanique/couverture utiles avant adjudication humaine.
- P2 : 7 gaps pouvant suivre le premier test borné.
- P3 : 0.

Les gaps P1 ne bloquent pas le test si chaque owner dégrade de manière sûre et explicite ; ils bloquent seulement les branches qui prétendraient une recommandation qualifiée dans leur domaine.

Statuts demandés :

- ANSM : `HIGH_PRIORITY_NON_BLOCKING`, avec `UNKNOWN_REQUIRES_QUALIFICATION` tant que le set courant n’est pas acquis.
- Imaging Core Lab/charter/transfer/scanner/reader : `HIGH_PRIORITY_NON_BLOCKING`, mais bloquant pour tout protocole imagerie exécutable/Level 3.
- Linked Protocol→CRF→DMP→SAP : `HIGH_PRIORITY_NON_BLOCKING`.
- Biostat dimensioning : `HIGH_PRIORITY_NON_BLOCKING`, bloquant pour toute sortie chiffrée hors cas borné actuel.
- French operational artifacts : `HIGH_PRIORITY_NON_BLOCKING`.
- Funding annexes : `DEFERRED_P2`; FUTURE_BUDGET_FEASIBILITY reste inactif.

## J. Décision

Le corpus est suffisamment structuré pour planifier son accès, mais pas accessible au runtime. La prochaine mission doit être `REFERENCE_KNOWLEDGE_BRIDGE_01`, avant une nouvelle acquisition large ou une qualification intégrée prétendant utiliser RC01.

```text
OWNER_KNOWLEDGE_NEEDS_MAPPED = YES
REFERENCE_COVERAGE_MAPPED = YES
OWNER_GAPS_CLASSIFIED = YES

ENGINE_MECHANIC_VS_KNOWLEDGE_GAP_DISTINCTION = PASS
PROJECT_CONTEXT_GAP_DISTINCTION = PASS
RUNTIME_ACCESS_GAP_DISTINCTION = PASS
HUMAN_JUDGMENT_DISTINCTION = PASS

KNOWLEDGE_RUNTIME_REACHABILITY_AUDITED = YES
REFERENCE_CORPUS_RUNTIME_REACHABLE = NO
FIRST_RUNTIME_GAP_IDENTIFIED = YES
MINIMAL_REFERENCE_KNOWLEDGE_BRIDGE_DEFINED = YES

TARGETED_CORPUS_EXPANSION_REQUIRED = YES
PRACTICE_PATTERN_EXTRACTION_VALUE = MEDIUM

NO_ENGINE_MODIFICATION = PASS
NO_RUNTIME_WIRING = PASS
NO_EXTERNAL_AUTHORITY_PROMOTION = PASS
```
