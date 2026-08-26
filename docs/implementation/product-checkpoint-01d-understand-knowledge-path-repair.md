# PRODUCT CHECKPOINT 01D — UNDERSTAND transversal Knowledge path repair

Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Statut: non normatif

Date: 2026-08-27

## Decision

`UNDERSTAND_KNOWLEDGE_PATH_REPAIR_READY_FOR_PREVIEW`

Les trois défauts localisés par PRODUCT-CHECKPOINT-01C sont réparés dans la surface produit et son adapter de présentation. L'intention courante `UNDERSTAND` sélectionne désormais systématiquement le handler Knowledge read-only, y compris lorsqu'un Research Project et/ou un QRY existent déjà. Le résultat Knowledge structuré reste disponible après projection et persistance, puis est rendu par divulgation progressive. La copie historique project-first est remplacée de manière ciblée au chargement sans effacer le reste de la session.

Cette décision établit une readiness technique pour un Preview. Elle ne qualifie ni le corpus ni la qualité scientifique des réponses, n'autorise ni Wave 2 ni un déploiement, et ne vaut pas `SCIENTIFIC_PASS`.

## Baseline

- branche: `protocol-designer-canonical-ingestion`;
- HEAD initial: `fe18e98be73e447af5149771121165ed7ec2f763`;
- `origin/protocol-designer-canonical-ingestion`: `fe18e98be73e447af5149771121165ed7ec2f763`;
- `main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`;
- `origin/main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`;
- état suivi initial: propre;
- état non suivi initial: 55 artefacts connus, intégralement préservés;
- Preview antérieur: non utilisé pour établir la présente preuve locale.

Autorités consultées, dans l'ordre requis:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `NOXIA — Charte fondatrice`;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2`;
4. `Editorial Engine — Architecture Manifesto`;
5. PD-003 V2 — Research Object Model;
6. PD-004 — UX Manifesto;
7. PD-005 — Prompt Library Architecture;
8. PD-009 — Decision Engine Architecture;
9. PD-011 — Evaluation Framework;
10. RDE-001 — Research Design Engine Architecture;
11. RDE-002 — Research Design Workflow;
12. KE-001 — Knowledge Engine Architecture.

Les preuves Level 3 01A, 01B et 01C ont été consultées comme constats d'implémentation, sans promotion normative. Aucune contradiction documentaire ou normative bloquante n'a été identifiée. Aucun document d'autorité n'a été modifié.

## 01C defects repaired

| Défaut 01C | Correction bornée | État |
|---|---|---|
| Handler UNDERSTAND conditionné à `!Project && !QRY` | suppression de la garde d'état; `routeIntent === UNDERSTAND` gouverne le handler | `REPAIRED` |
| `KnowledgeResult` appauvri avant l'UI | contrat de présentation persistant conservant concepts, assertions, applicabilité, qualifications, sources, EvidenceLinks, limites, contradictions, gaps, provenance et versions | `REPAIRED` |
| copie project-first historique persistée | migration ciblée de la première entrée exacte obsolète et microcopie du composer dérivée de l'intention active | `REPAIRED` |

`FIRST_DIVERGENT_STAGE_REPAIRED = UNDERSTAND_HANDLER_SELECTION_AND_PRODUCT_PRESENTATION_ADAPTER`

Le Domain Gate, le router 01B, les contrats QRY, les moteurs scientifiques et les corpus n'ont pas été modifiés.

## Handler selection

Chemin courant démontré:

```text
currentIntent = UNDERSTAND
→ executeProductUnderstandInteraction
→ executeKnowledgeEngineForPresentation
→ local governed KnowledgeResult
→ read-only ProductUnderstandKnowledgePresentation
→ progressive-disclosure UI
```

Ce chemin s'applique aux quatre configurations testées:

- session neuve;
- Project existant sans QRY;
- Project existant avec QRY en attente;
- QRY en attente sans Project.

Le bridge conversationnel générique n'est jamais appelé pour ces interactions. Les traces locales portent `provider = KNOWLEDGE`, `model = KE-001@1.2.0`, `calls = 0`, une référence de résultat et son digest.

## Existing Project behavior

Pour un `UNDERSTAND` transversal:

- Project ID, version, digest, état canonique et décision humaine restent inchangés;
- aucune contribution persistante n'est extraite;
- aucun Project candidate n'est créé;
- `PROJECT_WRITE_COUNT = 0`;
- aucune projection DOC/Protocol n'est créée.

Les tests comparent la sérialisation du Project avant/après pour les états applicables. L'existence du Project ne requalifie plus l'intention en `DESIGN_STUDY`.

## Pending QRY behavior

Le QRY en attente est conservé byte-identiquement pendant `UNDERSTAND`:

- aucun response event n'est ajouté à sa mémoire;
- le besoin actif reste identique;
- la question n'est pas réémise ni forcée dans la réponse Knowledge;
- le QRY demeure disponible lors d'un retour explicite vers `DESIGN_STUDY`.

La logique de clarification QRY n'est plus exécutée avant que le routing ait gouverné la nature du tour. Aucun contrat ou moteur QRY n'a été modifié.

## Knowledge path

`UNDERSTAND` consomme uniquement le runtime Knowledge local déterministe avec:

- consumer `PROTOCOL_DESIGNER_UNDERSTAND`;
- `externalSearchPolicy = EXTERNAL_FORBIDDEN`;
- les termes, relations et exclusions préservés par le routing;
- zéro provider LLM et zéro appel réseau.

Une couverture insuffisante reste insuffisante: les éléments disponibles, gaps et limites sont présentés sans substitution par une connaissance interne de modèle.

## KnowledgeResult fidelity

Le nouveau contrat `PRODUCT_UNDERSTAND_KNOWLEDGE_PRESENTATION@1.0.0` conserve, lorsqu'ils existent:

- identités, libellés et termes originaux des concepts;
- identités, texte, statut, applicabilité et qualifications des assertions/statements;
- références, révisions et localisateurs des sources;
- relations EvidenceLink, localisateurs et limites;
- contradictions/controverses avec références de positions;
- ambiguïtés, concepts non résolus et Knowledge gaps avec conditions de reprise;
- limites globales;
- provenance des providers, versions, digests de représentation;
- version du moteur, état du corpus, référence et digest du résultat.

Cette structure est stockée avec l'entrée de conversation; le rechargement du navigateur ne la réduit pas à une bulle textuelle.

## LLM fallback behavior

```text
GENERIC_LLM_SCIENTIFIC_FALLBACK_FOR_UNDERSTAND = REMOVED
EXTERNAL_LLM_API_CALLS = 0
NETWORK_CALLS = 0
```

Gemini/Terra/OpenAI n'ont été ni appelés ni utilisés comme source scientifique. Les tests font échouer le bridge générique s'il est invoqué par erreur dans les cas UNDERSTAND.

## Answer-first behavior

La réponse bornée de la projection Knowledge est désormais la première information affichée. Le résumé de la demande, les éléments documentés, les gaps et la conclusion de couverture viennent ensuite.

Lorsqu'une réponse interne est possible, aucune clarification n'est placée avant elle. Lorsqu'elle ne l'est pas, le produit expose honnêtement l'absence de couverture, les gaps et le besoin éventuel de connaissance externe sans effectuer cette recherche.

## Evidence and provenance

La réponse principale reste concise. Les détails accessibles utilisent des sections repliables:

- `Sources (N)`;
- `Applicabilité`;
- `Limites (N)`;
- `Contradictions / débats (N)`;
- `Lacunes (N)`;
- `Provenance et versions (N)`.

Les titres, révisions et localisateurs disponibles sont affichés. Les identifiants internes restent dans le contrat persistant pour la traçabilité mais ne constituent pas l'expérience principale. Aucun JSON brut n'est rendu.

## Persisted-session migration

Le loader remplace uniquement la première entrée NOXIA qui correspond exactement à:

> Décrivez-moi le projet de recherche que vous souhaitez construire.

Elle devient la copie d'entrée neutre courante. Toutes les autres entrées, les tours, le Project, le QRY, les contributions et la décision humaine sont préservés. Les sessions 1.6 migrées et les sessions 1.7 courantes passent par la même réparation ciblée; aucune suppression de `localStorage` n'est demandée.

Le placeholder du composer est dérivé du dernier intent routé:

- UNDERSTAND: comprendre ou comparer;
- FORMALIZE_IDEA: travailler une idée ou intuition;
- DESIGN_STUDY: construire un projet de recherche;
- aucun intent actif: entrée neutre.

## Case A

- route: `UNDERSTAND`;
- handler: Knowledge dans tous les états Project/QRY testés;
- termes et relation de comparaison préservés;
- Project writes: 0;
- QRY mutations: 0;
- Protocol projections: 0;
- état local actuel: couverture/applicabilité insuffisante, affichée comme telle;
- aucune comparaison pronostique, validation de technique ou science complémentaire inventée.

Ce constat ne juge pas la qualité scientifique du corpus.

## Case B

- route: `UNDERSTAND`;
- `NO_STUDY` et `NO_PROTOCOL` préservés;
- ECV, IRM cardiaque, CT cardiaque, comparaison et fibrose myocardique diffuse préservés dans le contexte routé;
- chemin Knowledge utilisé avec zéro Project write et zéro projection protocolaire;
- sources, EvidenceLinks, applicabilité, limites, contradiction, gaps et provenance conservés dans le contrat de réponse;
- conclusion directe/partielle présentée avant les détails;
- objectif non supporté sur la « concordance des seuils » absent.

Ce test établit la fidélité au résultat local courant, pas la vérité scientifique de son contenu.

## Transition regressions

Le retour explicite:

> Je veux maintenant construire une étude à partir de cette question.

reste routé `DESIGN_STUDY`. Le contexte de Case A survit à la transition. Le Project courant et le QRY préservé sont retransmis au parcours existant, sans mutation lorsqu'aucune contribution n'est produite.

Les anciennes fixtures de construction devenues ambiguës après la reconnexion du routing ont été rendues explicitement `DESIGN_STUDY`; cela change uniquement leur formulation de test, pas leur résultat attendu.

## Tests

Validation ciblée exécutée, sans campagne scientifique ni broad replay:

- 8 fichiers de tests sélectionnés;
- 7 fichiers exécutés avec succès;
- 1 fichier ignoré par ses conditions existantes;
- `69 passed`;
- `7 skipped`;
- `0 failed`.

Couverture 01D dédiée:

- 13 tests;
- 25 comportements requis couverts;
- 13 passed, 0 failed.

Autres contrôles:

- lint ciblé des six fichiers code/tests concernés: PASS;
- `git diff --check`: PASS;
- typecheck applicatif: aucun défaut nouveau; sortie toujours limitée aux deux `TS2698` historiques de l'artefact non suivi `w1-qual-02h1r-deterministic-checker.test.ts`, lignes 37 et 50;
- scan de secrets ciblé: PASS;
- build: non lancé, aucune modification de configuration/build et validations ciblées suffisantes pour cette mission.

## Known limitations

- la couverture scientifique locale de Case A reste insuffisante; elle n'a pas été enrichie;
- Case B reste partiellement couverte et conserve ses limites/controverse;
- cette tranche utilise le chemin de présentation Knowledge local existant; elle ne crée pas de nouvelle orchestration ni de qualification scientifique;
- le contrat structuré est persisté dans la session navigateur, mais aucun Scientific Execution Trace produit n'est ajouté;
- les deux erreurs TS2698 historiques non suivies restent présentes et hors périmètre;
- aucun test hands-on utilisateur et aucun Preview n'ont été exécutés dans cette mission.

## Product TRACE

`PRODUCT_TRACE_INTEGRATION = ABSENT`

La référence et le digest Knowledge restent visibles dans la trace locale existante, mais aucune couche TRACE produit n'a été construite ou raccordée. Cette dette reste séparée.

## Git

- un commit local atomique est autorisé après validation finale;
- push: `NO` sans autorisation humaine séparée;
- merge vers main: `NO`;
- déploiement: `NO`;
- Wave 2: `NO`;
- main modifié: `NO`;
- 55 artefacts historiques non suivis: préservés.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
NETWORK_CALLS = 0
NEW_SCIENTIFIC_CAMPAIGNS = 0
NEW_BENCHMARKS = 0
BROAD_REPLAYS = 0
```
