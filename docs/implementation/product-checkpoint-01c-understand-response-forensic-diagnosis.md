# PRODUCT CHECKPOINT 01C — UNDERSTAND response path and Knowledge delivery forensic diagnosis

Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Statut: non normatif, diagnostic read-only

Date: 2026-08-27

## Decision

`UNDERSTAND_RESPONSE_ROOT_CAUSE_IDENTIFIED`

Le router 01B rend bien `UNDERSTAND`, mais la surface produit n'envoie ce résultat vers Knowledge que si la session ne contient **ni Project ni QRY**. La condition réellement exécutée est:

```text
routeIntent = UNDERSTAND
AND session.project = null
AND queryNavigation = null
```

Une session persistée issue du parcours 01A peut contenir un Project adopté et un QRY actif. Dans cet état, `UNDERSTAND` contourne le handler Knowledge et retombe dans le bridge conversationnel générique Gemini. Ce bridge reçoit la conversation, le Project et, lorsqu'il existe, le besoin QRY, mais aucun `KnowledgeRequest`, aucun `KnowledgeResult`, aucune assertion gouvernée et aucune provenance scientifique. Il est donc le producteur des réponses libres et des formulations interrogatives observées.

```text
FIRST_DIVERGENT_STAGE_AFTER_ROUTING =
UNDERSTAND_HANDLER_SELECTION_CONDITIONED_ON_EMPTY_PROJECT_AND_QRY_STATE
```

Un second défaut, distinct et également localisé, existe sur le chemin neuf sans Project/QRY: le moteur Knowledge local produit bien une preuve structurée, mais l'adapter de réponse n'en projette qu'un résumé, quatre items textuels, trois gaps et une conclusion. Sources, EvidenceLinks, localisateurs, applicabilité, couverture, limites, contradictions et clarifications structurées ne sont pas rendus par la conversation.

Cette décision ne qualifie pas la qualité scientifique des réponses et n'autorise aucune correction, Wave 2, fusion ou mise en production.

## Baseline

- branche: `protocol-designer-canonical-ingestion`;
- HEAD: `fe18e98be73e447af5149771121165ed7ec2f763`;
- `origin/protocol-designer-canonical-ingestion`: `fe18e98be73e447af5149771121165ed7ec2f763`;
- `main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`;
- `origin/main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`;
- état suivi initial: aucune modification;
- état non suivi initial: 54 fichiers, soit les 53 artefacts historiques plus le rapport 01A non suivi;
- aucun artefact historique supprimé, déplacé, ajouté en masse, stashed ou nettoyé.

Autorités consultées, dans l'ordre imposé:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `NOXIA — Charte fondatrice`;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2`;
4. `Editorial Engine — Architecture Manifesto`;
5. PD-003 V2 Research Object Model et Ownership Matrix;
6. PD-004 UX Manifesto;
7. PD-009 Decision Engine Architecture;
8. RDE-001;
9. RDE-002;
10. KE-001;
11. `docs/implementation/product-checkpoint-01a-context-loss-forensic-diagnosis.md`;
12. `docs/implementation/product-checkpoint-01b-router-reconnection-repair.md`;
13. `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md`.

Les corpus locaux applicables ont été interrogés uniquement via le runtime Knowledge déterministe courant, avec `EXTERNAL_FORBIDDEN`. Aucun document normatif n'a été modifié. Aucune contradiction normative bloquante n'a été identifiée.

## UNDERSTAND execution path

### Chemin nominal d'une session neuve

```text
message utilisateur
→ routeProductEntry
→ ProductEntryRoutingDecision(UNDERSTAND)
→ garde !session.project && !queryNavigation
→ executeProductUnderstandInteraction
→ executeKnowledgeEngineForPresentation
→ KnowledgeRequest 1.2.0
→ providers locaux admis
→ KnowledgeResult 1.2.0
→ UnderstandProjection
→ readableKnowledgeReply
→ ConversationEntry.content
→ bulle texte UI
```

Ce chemin appelle le moteur Knowledge natif local, mais **pas** le runtime product-callable canonique Wave 1 et **pas** son OwnerResult ledger. Le résultat structuré reste transitoire; seule sa référence et son digest sont inscrits dans `bridgeTraces`.

### Chemin réellement compatible avec les réponses observées

```text
message utilisateur
→ routeProductEntry
→ ProductEntryRoutingDecision(UNDERSTAND)
→ garde Knowledge fausse car Project et/ou QRY présent
→ requestProtocolDesignerBridge
→ contexte: conversation + Project read-only + QRY éventuel
→ NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION
→ Gemini conversation
→ texte libre
→ ConversationEntry.content
→ bulle texte UI
```

| Frontière | Entrée | Sortie | Owner/composant | Données scientifiques transmises | Perte/ajout |
|---|---|---|---|---|---|
| Domain Gate/router | message exact, contexte routé antérieur | `ProductEntryRoutingDecision` | Product entry adapter | termes, relations, exclusions, intention | pas de perte démontrée pour A/B |
| Sélection du handler | décision + `session.project` + `queryNavigation` | Knowledge local ou bridge | `ProtocolDesignerWorkspace` | la décision `UNDERSTAND` est disponible | **divergence**: l'état Project/QRY prévaut sur l'intention |
| Bridge context | tours, Project read-only, QRY éventuel | prompt texte | Product bridge | texte utilisateur, objets Project, besoin QRY | aucune assertion/source Knowledge transmise |
| Knowledge request | attendu sous `UNDERSTAND` | aucun sur le chemin observé | non exécuté | aucune | Knowledge gouvernée absente |
| QRY | Project adopté, si navigation active | besoin/question active | QRY, read-only | information need du Project | peut réorienter le prompt vers une question de projet |
| Prompt | contexte bridge | payload Gemini | médiation conversationnelle | conversation/Project/QRY | invite à clarifier et autorise une question principale |
| Provider | payload texte | réponse texte libre | Gemini | aucune provenance scientifique gouvernée | contenu scientifique généré et question formulée |
| UI | `assistantReply` | bulle texte | Product UI | texte seul | aucune structure de preuve affichable |

Le bridge conserve `evaluatePersistentDelta = false` sous `UNDERSTAND`: le défaut constaté n'est pas un Project write silencieux post-01B. C'est un mauvais chemin de **réponse** après une bonne décision de routing.

## Case A

Entrée:

> Je voudrais comprendre la différence entre le no-reflow et l'obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.

Éléments démontrés:

- le router 01B rend `UNDERSTAND` et conserve no-reflow, obstruction microvasculaire, angioplastie, stent, STEMI, IRM cardiaque et la comparaison;
- le readback Knowledge local trouve trois sources et six liens de preuve, mais conclut `PROVIDER_NOT_APPLICABLE` dans le contexte dur actuel; il ne produit aucune assertion applicable et conserve deux gaps;
- sa projection nominale répondrait que l'applicabilité n'est pas démontrée, afficherait des gaps bornés et n'afficherait aucune question, car `readableKnowledgeReply` omet `projection.clarifications`;
- la réponse observée, « Pour bien structurer votre démarche, cherchez-vous… », n'existe dans aucun template, fixture, corpus ou règle déterministe du dépôt;
- cette formulation est compatible avec le bridge Gemini: le prompt parle de construction de projet, demande une clarification en cas d'ambiguïté méthodologique et permet une question principale;
- si le QRY historique est actif, son information need est également injecté comme « Question actuellement présentée au chercheur ».

La demande corrective « je ne cherche pas à étudier mais à comprendre » ne restaure pas le handler Knowledge tant que le Project ou le QRY reste présent. Elle peut être reroutée `UNDERSTAND`, mais la même garde post-routing reste fausse.

## Case B

Entrée:

> Je voudrais comprendre dans quelles situations l'ECV mesuré en IRM cardiaque et l'ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse. Je ne souhaite pas créer d'étude ni de protocole.

Éléments démontrés:

- le router 01B rend `UNDERSTAND`, conserve `NO_STUDY` et `NO_PROTOCOL`, et interdit toute extraction Project;
- le readback local courant résout exactement IRM, CT, fibrose myocardique et ECV;
- il sélectionne le Knowledge Graph, P4R ECV/T1 et RB-004;
- il produit `coverageStatus = PARTIAL`, 20 sources, 46 EvidenceLinks, 28 assertions applicables et 18 statements documentaires;
- les branches IRM et CT restent distinctes et la comparaison directe reste partielle;
- le résultat conserve notamment les dépendances de méthode, limites de contexte, sources, localisateurs, applicabilité, une controverse et l'absence d'assertion comparative générale;
- rien de ce contenu gouverné n'est transmis au bridge Gemini lorsque la garde Knowledge est fausse.

Readback de la livraison locale, sans jugement scientifique:

| Catégorie | KnowledgeResult local | `readableKnowledgeReply` local | Chemin observé via bridge |
|---|---|---|---|
| ECV | `AVAILABLE_UPSTREAM` | `PASSED_TO_RESPONSE_LAYER` dans les items | `NOT_AVAILABLE` comme Knowledge gouvernée; terme utilisateur seulement |
| MRI | `AVAILABLE_UPSTREAM` | `PASSED_TO_RESPONSE_LAYER` | `NOT_AVAILABLE` comme Knowledge gouvernée; terme utilisateur seulement |
| CT | `AVAILABLE_UPSTREAM` | `LOST_BEFORE_RESPONSE` dans la sélection textuelle bornée | `NOT_AVAILABLE` comme Knowledge gouvernée; terme utilisateur seulement |
| Diffuse myocardial fibrosis | `AVAILABLE_UPSTREAM` dans le contexte routé; normalisé en fibrose myocardique dans le résultat | `LOST_BEFORE_RESPONSE` pour le qualificatif « diffuse » | `NOT_AVAILABLE` comme Knowledge gouvernée; texte utilisateur seulement |
| Measurement principles | `AVAILABLE_UPSTREAM` pour les principes IRM; couverture CT/source disponible mais contenu applicable incomplet | `LOST_BEFORE_RESPONSE` dans les quatre premiers items | `NOT_AVAILABLE` comme Knowledge gouvernée |
| Comparability | `AVAILABLE_UPSTREAM` comme couverture directe partielle et relation de méthodes distinctes | `LOST_BEFORE_RESPONSE` dans la projection textuelle bornée | `NOT_AVAILABLE` comme Knowledge gouvernée |
| Methodological limitations | `AVAILABLE_UPSTREAM` | `LOST_BEFORE_RESPONSE` | `NOT_AVAILABLE` comme Knowledge gouvernée |
| Evidence | `AVAILABLE_UPSTREAM` — 20 sources, 46 liens | `LOST_BEFORE_RESPONSE` | `UPSTREAM_EVIDENCE_ABSENT` sur cette branche |
| Applicability | `AVAILABLE_UPSTREAM` par item et par branche | `LOST_BEFORE_RESPONSE` | `NOT_AVAILABLE` comme Knowledge gouvernée |
| Uncertainty | `AVAILABLE_UPSTREAM` | `PASSED_TO_RESPONSE_LAYER` partiellement via trois gaps, avec troncature | `NOT_AVAILABLE` comme incertitude Knowledge structurée |

Les statuts `LOST_BEFORE_RESPONSE` désignent l'adapter conversationnel local, pas une perte à l'intérieur du Knowledge Engine.

## Knowledge actually consumed

Classification des chemins:

| Chemin | A | B | C | D | E | F |
|---|---:|---:|---:|---:|---:|---:|
| Session neuve, premier `UNDERSTAND` | non | **oui** | non | non | non | Knowledge natif + projection déterministe |
| Session avec Project et/ou QRY | non | non | non | **oui** | **oui** | prompt générique + Project/QRY éventuel + Gemini |

Légende de la question centrale:

- A — runtime product-callable/OwnerResult Wave 1: **non appelé**;
- B — projection locale déterministe: **appelée uniquement si Project et QRY sont absents**;
- C — fixture historique: **non**;
- D — prompt/template générique: **oui sur le chemin observé**;
- E — LLM utilisant sa génération propre: **oui sur le chemin observé**;
- F — combinaison: **oui**, mais les deux combinaisons sont différentes selon l'état de session.

```text
OBSERVED_GOVERNED_KNOWLEDGE_CONSUMED = NO
FRESH_SESSION_LOCAL_KNOWLEDGE_AVAILABLE = YES
WAVE_1_PRODUCT_KNOWLEDGE_OWNER_RUNTIME_INVOKED = NO
```

L'initialisation d'un `knowledgeOwnerLedger` dans la session ne prouve aucune invocation; ce ledger n'est ni alimenté ni consulté dans `executeProductUnderstandInteraction`.

## Scientific response provenance

| Phrase affichée | Classification | Preuve |
|---|---|---|
| « L'ECV en IRM calcule le volume extra-cellulaire à partir des variations des temps de relaxation T1… » | `LLM_INTERNAL_KNOWLEDGE` | phrase absente du code, des fixtures et des corpus textuels; aucun KnowledgeResult n'est fourni au bridge; le seul producteur libre de ce chemin est Gemini |
| « l'ECV en CT repose sur la différence de densité… » | `LLM_INTERNAL_KNOWLEDGE` | mêmes éléments; aucune assertion/source gouvernée n'est transmise au provider |
| questions « Souhaitez-vous plutôt… » | génération conversationnelle Gemini | aucune chaîne exacte dans le dépôt; le prompt autorise une clarification et reçoit éventuellement un besoin QRY |

Cette attribution qualifie la **provenance technique**, pas la correction scientifique de ces phrases. L'identifiant exact de réponse provider et son digest ne sont pas disponibles, car la session navigateur du retest n'a pas été exportée et `PRODUCT_TRACE_INTEGRATION = ABSENT`.

## Question-first behavior

Il n'existe pas de règle littérale « always ask next question » dans le chemin UNDERSTAND local. Le comportement observé résulte d'une composition:

1. `UNDERSTAND` contourne Knowledge si un Project ou QRY existe;
2. le bridge générique se présente comme interlocuteur aidant à « construire un projet scientifique »;
3. il demande une clarification lorsqu'une ambiguïté méthodologique empêche de comprendre le projet;
4. il autorise « au plus une question principale »;
5. lorsqu'un QRY est actif, son but et sa question courante sont injectés dans le contexte;
6. le système demande alors au provider de produire un texte naturel libre.

L'instruction « au plus une » ne force pas à poser une question. Elle l'autorise. L'origine de la préférence question-first est donc le mauvais handler, renforcé par un contexte/prompt orienté Project et, lorsque présent, par QRY.

Les formulations exactes « Souhaitez-vous plutôt… » ne proviennent ni:

- du routeur;
- des clarifications déterministes du Knowledge Engine;
- d'un template QRY exact;
- d'une fixture;
- d'un Reasoning Book.

Elles sont formulées par Gemini. Le QRY peut déterminer **le besoin** adressé; il ne fournit pas cette formulation exacte.

Les deux corrections utilisateur rapportées ne correspondent pas exactement aux patterns étroits de `isFunctionalResetQueryMisunderstanding`. Le QRY existant reste donc inchangé et continue d'être transmis. Même lorsqu'un pattern de reformulation est reconnu, le code produit une nouvelle présentation QRY, conserve `queryNavigation`, puis échoue encore la garde `initialUnderstand`.

## Static product copy

Texte analysé:

> Décrivez-moi le projet de recherche que vous souhaitez construire.

Classification:

- origine: constante statique `INITIAL_NOXIA_MESSAGE` dans `functional-reset/session.ts` avant 01B;
- portée historique: première entrée partagée de toute nouvelle session functional-reset, pas seulement `DESIGN_STUDY`;
- moteur: aucun;
- conditionnement par intention: aucun dans la version historique;
- version actuelle pour une session neuve: « Dites-moi ce que vous souhaitez comprendre, formaliser ou construire… ».

Le stockage conserve la même clé `noxia-protocol-designer-functional-reset-v3`. Le loader réutilise une session 1.7.0 valide telle quelle et les migrations plus anciennes propagent les `entries`; aucune étape ne remplace la copie déjà enregistrée. Une session existante continue donc d'afficher la copie project-first même au SHA 01B. Cela ne prouve pas que la nouvelle constante est incorrecte; cela prouve que la copie historique persistée n'est pas reconditionnée.

```text
STATIC_COPY_ORIGIN = HISTORICAL_SHARED_SESSION_DEFAULT
STATIC_COPY_CURRENT_FRESH_SESSION = INTENT_FIRST
STATIC_COPY_PERSISTED_SESSION_REWRITTEN = NO
```

## Evidence/provenance projection

Deux situations doivent rester séparées:

### Chemin observé bridge

`UPSTREAM_EVIDENCE_ABSENT`

Aucun Knowledge owner/result n'est appelé ou transmis. Le bridge envoie uniquement la conversation, un snapshot Project lisible et le QRY éventuel. Gemini ne retourne qu'un texte.

### Chemin local Knowledge d'une session neuve

```text
UPSTREAM_EVIDENCE_PRESENT_BUT_NOT_PROJECTED = YES
RESPONSE_LAYER_DROPS_EVIDENCE = YES
UI_DOES_NOT_RENDER_EVIDENCE = YES
```

`UnderstandProjection` contient `sources`, `supportIds`, `locator`, `applicability`, `coverage`, `limitations`, `gaps`, `comparison` et `clarifications`. `readableKnowledgeReply` n'utilise que `requestSummary`, `answer`, quatre textes de `supportedItems`, trois gaps et `boundedConclusion`. La UI rend ensuite `entry.content` comme texte brut. Aucun composant de source ou localisateur n'est disponible à ce point.

## First divergent stage after routing

```text
RoutingDecision = UNDERSTAND
  ↓
expected: route governs Knowledge delivery independently of Project history
  ↓
actual guard: UNDERSTAND && !session.project && !queryNavigation
  ╳
Project/QRY state present
  ↓
generic Product Bridge → Gemini → plain-text UI
```

```text
FIRST_DIVERGENT_STAGE_AFTER_ROUTING =
UNDERSTAND_HANDLER_SELECTION_CONDITIONED_ON_EMPTY_PROJECT_AND_QRY_STATE
```

Étages divergents secondaires:

1. `UNDERSTAND_GENERIC_CONVERSATION_PROMPT`: prompt project-centric et QRY éventuel sans Knowledge structurée;
2. `UNDERSTAND_KNOWLEDGE_RESPONSE_PROJECTION`: preuves et qualifications structurées supprimées du texte même sur une session neuve;
3. `PERSISTED_SESSION_COPY`: ancien cadrage project-first conservé dans l'historique navigateur.

La session navigateur exacte n'étant pas exportée, il reste impossible de distinguer byte-for-byte si la garde a été invalidée par `session.project` seul ou par `session.project` **et** `queryNavigation`. Le Project visible et adopté établi par 01A suffit à rendre la garde fausse; un QRY est normalement construit après adoption et constitue le mécanisme probable de renforcement interrogatif. Cette incertitude ne délocalise pas le premier étage divergent.

## Owner attribution

| Comportement | Owner/composant réel | Attribution |
|---|---|---|
| Bonne décision A/B `UNDERSTAND` | Domain Gate + router 01B | non défectueux pour ces cas |
| Mauvais choix de handler après routing | `ProtocolDesignerWorkspace` | **owner du défaut primaire** |
| Project/QRY historique conservé | session functional-reset | condition déclenchante; historique valide, pas vérité Knowledge |
| Besoin de question après adoption | QRY | read-only; facteur de contexte, pas premier défaut |
| Formulation libre et contenu non sourcé | Gemini product bridge | producteur du texte observé |
| KnowledgeResult local | Knowledge Engine 1.2.0 | disponible mais contourné sur le chemin observé |
| Perte de sources/applicabilité/limites sur le chemin local | `readableKnowledgeReply` + UI texte | **défaut secondaire de projection produit** |
| Project write | aucun sous `UNDERSTAND` post-01B | zéro écriture démontrée |

Knowledge, Scientific Thinking, Imaging, REG, VAL, le Project canonique, les corpus et l'Editorial Engine ne doivent pas être modifiés sur la base de ce diagnostic.

## What is not defective

- le Domain Gate et le router 01B rendent correctement `UNDERSTAND` pour A/B;
- `NO_STUDY` et `NO_PROTOCOL` sont conservés;
- l'extraction persistante Project reste désactivée sous `UNDERSTAND`;
- aucun Project write ou protocole automatique post-01B n'est démontré;
- les corpus locaux contiennent des éléments ECV/MRI/CT avec sources et localisateurs;
- Knowledge conserve des gaps, limites, applicabilités et contradictions;
- QRY reste une projection read-only et n'est pas une source scientifique;
- PRJ, ST, Imaging, REG, VAL, DOC et Editorial ne sont pas le premier étage divergent;
- aucune fixture historique ne produit les réponses observées.

## Minimal repair surface

Ce diagnostic n'implémente rien. La surface minimale à traiter dans une mission séparée est bornée à:

1. faire gouverner le handler par `routeIntent = UNDERSTAND` même lorsqu'un Project/QRY historique existe;
2. suspendre le besoin QRY pour le tour explicatif sans supprimer son historique ni muter le Project;
3. réutiliser le Knowledge Engine/owner existant, sans nouveau moteur ni nouvelle orchestration;
4. projeter explicitement sources, localisateurs, applicabilité, limites, contradictions et couverture utiles au lieu d'une simple chaîne tronquée;
5. rendre ces structures dans l'UI;
6. décider explicitement du traitement de la copie initiale déjà persistée dans les sessions antérieures.

La mission de réparation ne devrait pas modifier les corpus ni tenter d'améliorer scientifiquement les moteurs pour corriger ce défaut de dispatch/projection.

## Remaining unknowns

- la session navigateur exacte du retest et ses `bridgeTraces` ne sont pas exportés;
- l'opérande précis qui a invalidé la garde dans chaque tour (`Project`, `QRY`, ou les deux) n'est donc pas observable directement;
- les IDs provider, modèles retournés, usages, latences et digests des réponses observées sont indisponibles;
- sans Product TRACE intégré, aucun événement cross-owner ne matérialise ce parcours;
- le readback Knowledge démontre les structures disponibles, pas la qualité scientifique de leur synthèse;
- la priorité et l'ordre actuels des quatre `supportedItems` ne sont pas une preuve de pertinence scientifique;
- aucune conclusion n'est tirée sur la validité scientifique des phrases Gemini observées.

```text
PRODUCT_TRACE_INTEGRATION = ABSENT
SCIENTIFIC_PASS = NOT_CLAIMED
WAVE_2_AUTHORIZED = NO
```

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

Méthodes utilisées: inspection statique, historique Git local, readback Knowledge local déterministe A/B, tests ciblés existants. Aucun scénario utilisateur live n'a été rejoué.

Validation ciblée:

- `product-checkpoint-01b-router-reconnection.test.tsx`: 8/8 PASS;
- `minimal-product-bridge.test.ts`: 11/11 PASS;
- total: 19/19 PASS sur 2 fichiers;
- appels provider réels pendant la validation: 0.

## Git

- fichier créé: le présent rapport uniquement;
- correction de code: aucune;
- commit: aucun;
- push: aucun;
- merge vers `main`: aucun;
- déploiement: aucun;
- Wave 2: non démarrée;
- artefacts historiques non suivis: préservés.

```text
FINAL_DECISION = UNDERSTAND_RESPONSE_ROOT_CAUSE_IDENTIFIED
```
