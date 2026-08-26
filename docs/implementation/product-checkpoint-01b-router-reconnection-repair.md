# PRODUCT CHECKPOINT 01B — Router reconnection and intent-preserving product entry

Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Statut: non normatif

Date: 2026-08-26

## Decision

`PRODUCT_ENTRY_ROUTING_REPAIR_READY_FOR_PREVIEW`

La surface réellement montée sous `/protocol-designer/demo` exécute désormais le Domain Gate borné et le routeur d’intention existant avant tout appel au bridge conversationnel ou à un owner. La décision de routing gouverne l’éligibilité de l’extraction Project.

Cette décision démontre une réparation technique du point d’entrée produit. Elle ne constitue ni une validation scientifique, ni une qualification PD-011, ni une autorisation de Wave 2.

## Baseline

- branche: `protocol-designer-canonical-ingestion`;
- HEAD initial: `cf159179087ca2dfa67efd4020afa1c29871f9a1`;
- `origin/protocol-designer-canonical-ingestion`: `cf159179087ca2dfa67efd4020afa1c29871f9a1`;
- `main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`;
- `origin/main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`;
- état suivi initial: aucune modification;
- artefacts historiques non suivis: 53 fichiers, tous préservés;
- preuve 01A non suivie préservée: `docs/implementation/product-checkpoint-01a-context-loss-forensic-diagnosis.md`.

Le déploiement produit observé par 01A était fondé sur `main@9be06edca1a7500ab7a43d065e94241e91d67bec`, tandis que la fermeture Wave 1 était portée par `cf159179087ca2dfa67efd4020afa1c29871f9a1`. Les fichiers critiques du chemin fautif étaient identiques entre ces deux révisions. Le mismatch de déploiement n’est donc pas retenu comme cause fonctionnelle.

Autorités consultées dans l’ordre imposé:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `NOXIA — Charte fondatrice`;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2`;
4. `Editorial Engine — Architecture Manifesto`;
5. PD-003 V2 Research Object Model et Ownership Matrix;
6. PD-004 UX Manifesto;
7. PD-009 Decision Engine Architecture;
8. RDE-001 et RDE-002;
9. KE-001;
10. SEM-002;
11. rapport d’implémentation PRODUCT-CHECKPOINT-01A.

Aucune contradiction normative bloquante n’a été identifiée.

## Root cause repaired

Cause initiale démontrée:

`DOMAIN_GATE_NOT_EXECUTED_DUE_TO_HARD_CODED_PROJECT_CONSTRUCTION_SURFACE`

Chemin réparé:

```text
User message
→ bounded Domain Gate
→ existing intent router
→ route-governed product path
→ Knowledge local OR conversation/formalization OR Project-eligible design
```

Le routeur existant n’a pas été remplacé. La surface active appelle désormais ses contrats `deriveRoutingIntent` et `buildScientificSessionContext`. Une couche d’adaptation locale conserve les négations, le contexte inter-tour et l’éligibilité Project.

## Files changed

- `src/features/protocol-designer/functional-reset/product-entry-routing.ts`: raccord Domain Gate, routing, négations, continuité de contexte et interaction Knowledge locale;
- `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx`: exécution du routing avant le bridge et garde de l’extraction persistante;
- `src/features/protocol-designer/functional-reset/session.ts`: entrée produit intent-first et métadonnées de diagnostic du routing;
- `src/features/protocol-designer/intake/journey.ts`: conservation explicite des termes nécessaires aux deux cas réels;
- `src/features/protocol-designer/functional-reset/__tests__/product-checkpoint-01b-router-reconnection.test.tsx`: régressions 01B;
- tests UI existants: adaptation de la copie intent-first et de la frontière Knowledge reconnectée;
- présent rapport.

Aucun moteur scientifique, modèle Project canonique, corpus, Reasoning Book, programme scientifique, QRY, DOC ou Editorial Engine n’a été modifié.

## Routing behavior

| Route | Suite gouvernée | Extraction persistante Project | Projection protocole |
| --- | --- | ---: | ---: |
| `UNDERSTAND` initial | Knowledge local déterministe | 0 | 0 |
| `FORMALIZE_IDEA` | bridge conversationnel/formalisation | interdite | 0 automatique |
| `DESIGN_STUDY` | chemin de construction existant éligible | autorisée comme candidate | 0 automatique |
| `OUT_OF_SCOPE` | arrêt avant owner | 0 | 0 |

Le Domain Gate refuse avant owner les entrées personnelles/identifiantes directement détectables. Les cas scientifiques admis restent `IN_SCOPE`. Aucun nouvel enum de routing n’a été créé.

## Project write behavior

Pour un premier tour `UNDERSTAND`:

```text
PERSISTENT_EXTRACTION_CALLS = 0
PROJECT_WRITE_COUNT = 0
PROTOCOL_PROJECTION_COUNT = 0
AUTOMATIC_ADOPTION_COUNT = 0
```

La session peut conserver un identifiant technique réservé, mais `session.project` reste `null`, aucun candidat Project n’est préparé et le portefeuille documentaire reste vide. Une transition humaine explicite ultérieure vers `DESIGN_STUDY` rend uniquement la construction éligible; elle n’adopte rien automatiquement.

## Case A

Entrée de smoke test manuel post-déploiement:

> Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.

Résultat déterministe:

- route: `UNDERSTAND`;
- Project automatique: non;
- protocole automatique: non;
- termes conservés: no-reflow, obstruction microvasculaire, angioplastie, stent, STEMI, IRM cardiaque;
- relation conservée: comparaison explicitement demandée;
- interaction: Knowledge local, politique `EXTERNAL_FORBIDDEN`.

## Case B

Entrée de smoke test manuel post-déploiement:

> Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse. Je ne souhaite pas créer d’étude ni de protocole.

Résultat déterministe:

- route: `UNDERSTAND`;
- exclusions explicites conservées: `NO_STUDY`, `NO_PROTOCOL`, avec la phrase source intacte;
- Project automatique: non;
- protocole automatique: non;
- termes conservés: ECV, IRM cardiaque, CT cardiaque, fibrose myocardique diffuse;
- relation conservée: comparaison explicitement demandée;
- interaction: Knowledge local, politique `EXTERNAL_FORBIDDEN`.

## Transition regression

Séquence testée:

1. Case A → `UNDERSTAND`;
2. aucun appel bridge, aucune extraction Project;
3. message: « Je veux maintenant construire une étude à partir de cette question. »;
4. route → `DESIGN_STUDY`;
5. le bridge reçoit l’historique exact des deux tours;
6. les termes et la relation scientifique de Case A restent dans le contexte routé;
7. l’extraction Project devient seulement éligible à ce stade;
8. aucune adoption automatique n’est effectuée.

## Unsupported generation

La chaîne `UNDERSTAND` ne déclenche plus l’extracteur Project Terra/OpenAI. La phrase suivante est absente de la réponse et des artefacts de session des deux cas:

> Examiner la concordance des seuils rapportés dans la littérature actuelle.

`UNSUPPORTED_THRESHOLD_CONCORDANCE_OBJECTIVE_PRESENT = NO`

L’extracteur global n’a pas été modifié: aucun défaut indépendant n’a été démontré sur un vrai parcours `DESIGN_STUDY`.

## Tests

- suite 01B ciblée: 8/8 tests passés;
- suites fonctionnelles affectées et contrat web: 49/49 tests passés sur 6 fichiers;
- assertions couvertes: routing A/B, termes, négations, zéro extraction/write/protocole, absence de génération non supportée, `FORMALIZE_IDEA`, `DESIGN_STUDY`, transition avec contexte, fail-closed hors périmètre;
- lint ciblé: 0 erreur;
- `git diff --check`: PASS;
- typecheck global: non vert à cause de 2 erreurs TS2698 dans deux fichiers historiques non suivis et non modifiés, `w1-qual-02h1r-deterministic-checker.test.ts` lignes 37 et 50;
- appel provider pendant les tests: 0.

Le typecheck global n’est pas présenté comme vert. Les deux erreurs sont extérieures au diff 01B et appartiennent aux artefacts historiques que la mission doit préserver.

## Remaining limitations

- le Domain Gate raccordé est une adaptation bornée des contrôles locaux existants; il ne prétend pas constituer une taxonomie exhaustive de tous les hors-périmètres possibles;
- la qualité scientifique des réponses Knowledge n’est pas évaluée par ce checkpoint;
- `FORMALIZE_IDEA` conserve le bridge conversationnel existant, sans extraction Project;
- l’adoption Project reste une décision humaine distincte;
- aucun smoke test humain web n’a été exécuté à la place de l’utilisateur;
- aucun Preview n’a été déployé dans cette mission.

## Product TRACE

`PRODUCT_TRACE_INTEGRATION = ABSENT`

La session conserve des métadonnées locales de routing et les références du résultat Knowledge lorsque disponibles. Elles servent au diagnostic du point d’entrée, mais ne constituent pas la Scientific Execution Trace produit, ne remplacent aucun OwnerResult et n’introduisent aucune orchestration.

## Git

- commit local: autorisé après validation finale;
- push: non autorisé dans cette mission;
- merge vers `main`: non;
- déploiement: non;
- Wave 2: non;
- 53 artefacts historiques non suivis: préservés.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
OPENAI_API_CALLS = 0
CHATGPT_API_CALLS = 0
GEMINI_CALLS = 0
OTHER_LLM_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
NEW_SCIENTIFIC_CAMPAIGNS = 0
NEW_BENCHMARKS = 0
BROAD_REPLAY = 0
```
