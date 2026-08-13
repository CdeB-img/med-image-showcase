# SEM-003C1 — Frozen Comparative Baselines Before Blind Execution

## Rapport de gel comparatif pré-observation

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL` |
| Niveau documentaire | `NIVEAU_3 — rapport de mission` |
| Source maîtresse | présent fichier Markdown |
| Date | 14 août 2026 |
| Blind Set prévu | `SEM003C-BLIND-QUALIFICATION-SET-01` version `1.0.0` |
| Evaluator cible | `SEM003_EVALUATOR` version `1.1.0` |
| Commit de gel technique | `40a7718edcd291757163bbedb92238829e3ea0e6` |
| Freeze digest | `6373b7b04838e75582048becb2efdf075b644740f1d3f6bbb381809ecdc010f1` |
| Décision | `SEM003C1_COMPARATIVE_BASELINES_PARTIAL` |

## 1. Résultat

Six architectures sont codées, normalisées, testées et gelées avant toute observation aveugle : SEM courant, Instructor + Pydantic, PydanticAI, DSPy, LangExtract et Outlines. Toutes prévoient Google Gemini `gemini-3.5-flash-lite`, température omise (`null`) et une seule tentative framework par opération. Aucun exemple, résultat, Acceptance Envelope ou contenu de référence aveugle n'est injecté dans leurs prompts.

Le gel technique est reproductible, committé et son worktree a été vérifié propre au commit `40a7718`. Il ne modifie aucun fichier fonctionnel SEM. La suite SEM existante reste à 305/305 PASS.

La décision demeure néanmoins `PARTIAL`. L'évaluateur 1.1.0 expose `FUTURE_SEM_RUNTIME`, mais son champ obligatoire `purpose` n'autorise que `SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT` et `SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION`. Employer silencieusement la seconde valeur pour une campagne Blind qualifierait faussement la nature de l'opération. La campagne commune reste donc fermée jusqu'à résolution gouvernée de ce contrat, avant tout appel provider et sans observation du Blind.

## 2. Baselines gelées

| Baseline | Framework / version | Stratégie native | Statut |
|---|---|---|---|
| `SEM003C1-SEM-CURRENT-01` | NOXIA SEM `SEM-001-1.1 / SEM_LEGACY_R5P` | reconstruction, critic et canonicalisation déterministe natifs | `FROZEN_PRE_BLIND_EVALUATOR_GATE_OPEN` |
| `SEM003C1-INSTRUCTOR-PYDANTIC-01` | Instructor 1.15.4 / Pydantic 2.13.4 | sortie structurée Pydantic via `Mode.JSON` | idem |
| `SEM003C1-PYDANTICAI-01` | PydanticAI 2.29.0 | Agent sans outils, sortie Pydantic | idem |
| `SEM003C1-DSPY-01` | DSPy 3.3.0 | `Predict`, zéro démonstration, zéro optimizer | idem |
| `SEM003C1-LANGEXTRACT-01` | LangExtract 1.6.0 | extraction native contrainte, zéro exemple, une passe | idem |
| `SEM003C1-OUTLINES-01` | Outlines 1.3.3 | adapter Gemini natif et générateur typé | idem |

Le lock commun est `experiments/requirements-experiments-lock.txt`, digest `b41c132189f42c60c02fadb5a38715dc473c63db6fac797ccbed87c3c0139c87`. Chaque manifeste conserve séparément framework, version, provider, modèle, configuration, digests prompt, adapter, schéma, lock et code, avec `blindAccessed = false`, `sealedReferenceAccessed = false`, `blindExecuted = false` et `resultCount = 0`.

## 3. Comparabilité et frontières

Instructor, PydanticAI, DSPy et Outlines partagent la même instruction scientifique et le même contrat natif riche. Les différences restantes appartiennent à leur orchestration et à leur stratégie de sortie structurée. LangExtract conserve volontairement une forme native d'extractions ; son adapter ne la transforme pas artificiellement en sortie SEM. SEM conserve ses propres prompts, critic, guards et canonicalizer : il n'est pas réimplémenté dans un autre framework.

La normalisation suit deux frontières :

1. `NATIVE_OUTPUT -> NORMALIZED_CANDIDATE_SEMANTIC_REPRESENTATION`, sans accès à une référence et sans ajout de compréhension ;
2. binding exact, côté évaluateur de confiance, entre clés déclarées et identifiants d'Acceptance Envelope, sans fuzzy matching, synonymie ajoutée ou complétion sémantique.

Les différences de nombre d'opérations LLM restent visibles. Elles ne sont pas égalisées artificiellement : le protocole commun impose de rapporter appels, échecs provider, tokens et latences lorsqu'ils sont exposés.

## 4. Candidats non forcés

| Candidat | Classification | Décision |
|---|---|---|
| Guidance 0.3.1 | aucun adapter Gemini natif dans la version installée | pas de baseline : un pont propriétaire introduirait une complexité unique |
| Graphiti Core 0.29.3 | composant mémoire/graphe | pas un concurrent direct de compréhension mono-conversation |
| Guardrails AI 0.10.2 | couche de validation/correction | pas un moteur de compréhension indépendant |

Outlines est retenu comme sixième baseline parce que sa version installée possède un adapter Gemini natif. Aucun concurrent artificiel n'est créé pour atteindre un nombre prédéfini.

## 5. Préengagement comparatif

Le protocole gelé prévoit une photographie technique commune : quinze cas, un run par cas et par baseline, ordre case-major avec rotation des baselines, aucune sélection du meilleur run, tous les runs comptés, sorties provider non évaluables conservées et échecs provider séparés des échecs sémantiques. Un seul run ne mesure pas la variabilité générative et ne permet aucun PASS PD-011 ; la décision de campagne est donc bornée à `COMPARATIVE_SNAPSHOT_ONLY_NO_PD011_PASS`.

Pendant la future campagne : aucun tuning, aucune réparation, aucun changement de prompt, schéma, adapter, modèle, configuration ou seuil ; toute dérive arrête la campagne et invalide l'identité concernée. Aucun résultat d'une baseline ne devient visible aux autres avant complétion du groupe prévu.

## 6. Gate commune ouverte

La contradiction est factuelle et antérieure à toute sortie Blind :

- `candidate-semantic-representation.schema.json` version 1.1.0 accepte le mode `FUTURE_SEM_RUNTIME` et la source `FUTURE_SEM_RUNTIME_OUTPUT` ;
- le même contrat exige `purpose` ;
- les seules valeurs admises de `purpose` nomment Development ou Calibration ;
- aucune valeur ne représente une qualification Blind ou une photographie comparative.

La preuve Development synthétique du bridge est valide sous le schéma 1.1.0. Cette preuve démontre sa compatibilité structurelle, pas l'autorisation de mentir sur le but d'une campagne réelle. Une résolution minimale doit être gouvernée et versionnée avant exécution commune. Elle ne doit ni consulter une référence aveugle, ni changer les propriétés P01–P18, ni ajouter un seuil, ni modifier SEM ou une baseline gelée.

## 7. Artefacts

Les artefacts principaux sont :

- `experiments/semantic-engine-comparison/contracts/` : conversation comparative, projection native, représentation normalisée et forme LangExtract ;
- `experiments/semantic-engine-comparison/baselines/` : six baselines et classification des composants non concurrents ;
- `experiments/semantic-engine-comparison/adapters/` : normalisation commune, adapters SEM/LangExtract et bridge évaluateur ;
- `experiments/semantic-engine-comparison/prompts/` : instructions gelées hors Blind ;
- `experiments/semantic-engine-comparison/manifests/` : six manifestes, protocole et freeze index ;
- `experiments/semantic-engine-comparison/results/README.md` : frontière interdisant tout résultat SEM-003C1.

Les copies locales tierces sous `experiments/semantic-alternatives/` et le virtualenv restent ignorés. Les versions applicables sont celles du lock committé, pas ces copies de travail.

## 8. Validations

| Validation | Résultat |
|---|---|
| Freeze reproductible | `PASS — 11 artefacts générés, 6 baselines` |
| Validateur SEM-003C1 | `PASS — 17/17` |
| Tests SEM-003C1 | `PASS — 10/10` |
| Evaluator 1.1.0 validator | `PASS — 7 schémas, 18 propriétés, 15 Development, 41 candidats` |
| Evaluator tests | `PASS — 10/10` |
| SEM local | `PASS — 305/305` |
| Typecheck | `PASS` |
| Build | `PASS`, avertissements de bundling préexistants non bloquants |
| `git diff --check` | `PASS` |
| Appels LLM/provider | `0` |
| Blind input exécuté | `NO` |
| Sealed reference consultée | `NO` |
| Résultat Blind créé | `0` |

## 9. Git et décision

Le commit local `40a7718edcd291757163bbedb92238829e3ea0e6` gèle les implémentations, prompts, contracts, adapters, lock et manifestes. Le présent rapport et l'index sont committés séparément. Aucun push ou déploiement n'est réalisé.

Décision :

`SEM003C1_COMPARATIVE_BASELINES_PARTIAL`

Les six candidats sont techniquement gelés. La prochaine mission ne doit exécuter ni SEM-003D seul ni une campagne comparative tant que le `purpose` de qualification n'est pas représentable honnêtement dans le contrat Evaluator applicable. Après résolution pré-observation et nouveau gel explicite de l'identité Evaluator, la seule exécution autorisée sera une campagne Blind commune sur toutes les baselines demeurées compatibles.
