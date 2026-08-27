# PRODUCT CHECKPOINT 01E — Deployed UNDERSTAND runtime conformance forensic

Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Statut: non normatif, diagnostic read-only

Date: 2026-08-27

## Decision

`PRODUCT_01D_NOT_PRESENT_IN_TESTED_DEPLOYMENT`

Le produit dont les chaînes ont été rapportées n'exécute pas le commit 01D `312b4b9c45de57ed3a6339dcc703f79955fbc36c`. Les deux copies statiques observées constituent une empreinte exacte de la surface Production encore servie par `main@9be06edca1a7500ab7a43d065e94241e91d67bec`.

Le readback live confirme simultanément deux états distincts :

- `https://noxia-imagerie.fr/protocol-designer/demo` affiche les deux copies project-first rapportées et est relié par Vercel au déploiement Production `dpl_BL9xCpkcX9NvsLhR6cj2veGVLcKR`, source `main@9be06edca1a7500ab7a43d065e94241e91d67bec` ;
- le Preview 01D `https://med-image-showcase-lb0av99t0-cdeb-imgs-projects.vercel.app/protocol-designer/demo` affiche la copie intent-first et est lié au SHA `312b4b9c45de57ed3a6339dcc703f79955fbc36c`.

La condition STOP de la mission est atteinte. Les réponses A/B n'ont pas été rejouées, le runtime 01D n'est pas déclaré défectueux sur leur base et aucune correction n'est effectuée.

## Tested URL

```text
TESTED_URL =
https://noxia-imagerie.fr/protocol-designer/demo

TESTED_URL_IDENTIFICATION =
EXACT_STATIC_COPY_FINGERPRINT_PLUS_LIVE_DOMAIN_READBACK
```

La chaîne « Décrivez votre idée, confirmez la structure proposée, puis faites évoluer le projet dans le même échange. » existe exactement dans `ProtocolDesignerWorkspace.tsx` à `main@9be06edc` et n'existe pas dans le tree 01D. Elle est affichée en direct par le domaine Production et n'est pas une entrée de conversation persistée. Elle identifie donc le bundle actif indépendamment de l'état de session.

Le même déploiement est aussi exposé par ses alias Vercel `med-image-showcase-git-main-cdeb-imgs-projects.vercel.app` et `med-image-showcase-m8zolsb2v-cdeb-imgs-projects.vercel.app`. L'URL produit personnalisée lue et reproduisant exactement le constat utilisateur est celle indiquée ci-dessus.

## Deployed SHA

```text
DEPLOYED_GIT_SHA =
9be06edca1a7500ab7a43d065e94241e91d67bec

EXPECTED_01D_SHA =
312b4b9c45de57ed3a6339dcc703f79955fbc36c

DEPLOYED_SHA_MATCHES_01D = NO
```

Le SHA n'est pas déduit du nom de branche ou de l'URL. Il est affiché par la fiche Vercel du déploiement et par le statut GitHub/Vercel attaché au commit.

## Deployed branch

```text
DEPLOYED_BRANCH = main
LOCAL_MAIN = 9be06edca1a7500ab7a43d065e94241e91d67bec
ORIGIN_MAIN = 9be06edca1a7500ab7a43d065e94241e91d67bec
```

La fiche Vercel expose explicitement `Source = main` et le commit `9be06ed`.

## Vercel deployment

| Champ | Valeur vérifiée |
| --- | --- |
| Project | `cdeb-imgs-projects/med-image-showcase` |
| Deployment ID | `dpl_BL9xCpkcX9NvsLhR6cj2veGVLcKR` |
| Immutable deployment URL | `https://med-image-showcase-m8zolsb2v-cdeb-imgs-projects.vercel.app` |
| Environment | `Production` |
| State | `READY` / `Deployment has completed` |
| Created at | `2026-08-24T23:30:23Z` (`25 août 2026, 01:30:23 UTC+2`) |
| Build duration | `35s` |
| Source | `main@9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Current custom domain | `noxia-imagerie.fr` |

Le Preview 01D reste un déploiement distinct :

| Champ | Valeur vérifiée |
| --- | --- |
| URL | `https://med-image-showcase-lb0av99t0-cdeb-imgs-projects.vercel.app` |
| Environment | `Preview` |
| SHA | `312b4b9c45de57ed3a6339dcc703f79955fbc36c` |
| State | `success` |

## 01D expected behavior

Le rapport 01D revendique, comme preuve d'implémentation locale et non comme autorité :

- `UNDERSTAND` gouverne toujours le handler Knowledge, avec ou sans Project/QRY historique ;
- aucun fallback scientifique LLM générique sous `UNDERSTAND` ;
- réponse Knowledge avant clarification ;
- conservation puis rendu progressif des sources, applicabilités, limites, contradictions, lacunes et provenance ;
- migration ciblée de la copie project-first persistée ;
- zéro Project write et zéro projection protocolaire sous `UNDERSTAND`.

Ces comportements sont présents dans le tree `312b4b9c`, mais ce tree n'est pas celui du déploiement testé.

## Observed behavior

Le readback de la Production reproduit exactement :

- la copie de section « Décrivez votre idée, confirmez la structure proposée, puis faites évoluer le projet dans le même échange. » ;
- la première entrée « Décrivez-moi le projet de recherche que vous souhaitez construire. Vous pouvez partir d'une idée simple ou donner tous les détails que vous connaissez déjà. » ;
- une session Project déjà hydratée avec historique conversationnel et affordance protocolaire.

Le readback du Preview 01D affiche à la place :

- « Décrivez votre question ou votre objectif. NOXIA oriente d'abord l'échange, puis n'ouvre un Research Project que si vous demandez de construire une étude. » ;
- « Dites-moi ce que vous souhaitez comprendre, formaliser ou construire. NOXIA préservera votre intention avant de proposer la suite. »

Les scénarios A et B n'ont pas été rejoués. Les réponses utilisateur rapportées restent des observations historiques fournies par l'utilisateur.

## Active runtime path

Chemin statique du déploiement testé :

```text
/protocol-designer/demo
→ ProtocolDesignerDemo
→ ProtocolDesignerWorkspace à main@9be06edc
→ loadFunctionalResetSession(window.localStorage)
→ surface project-first
→ requestProtocolDesignerBridge sur le tour utilisateur
→ réponse texte générique
→ UI Conversation
```

À `main@9be06edc`, `ProtocolDesignerWorkspace.tsx` importe et appelle `requestProtocolDesignerBridge`, mais n'importe ni `routeProductEntry`, ni `executeProductUnderstandInteraction`, ni `ProductUnderstandResponse`.

À `312b4b9c`, ces trois éléments existent et le branchement `routeIntent === "UNDERSTAND"` précède le bridge générique.

```text
ARE_01D_CHANGED_FILES_ON_ACTIVE_RUNTIME_PATH = NO
```

Les mêmes noms de fichiers `ProtocolDesignerWorkspace.tsx` et `session.ts` existent dans le déploiement testé, mais leurs révisions 01D ne sont pas actives. Le composant 01D `ProductUnderstandResponse.tsx` et `product-entry-routing.ts` n'existent pas dans le tree Production déployé.

## 01D changed files

Fichiers runtime 01D absents ou non actifs dans le déploiement testé :

- `src/features/protocol-designer/functional-reset/ProductUnderstandResponse.tsx` — absent de `main@9be06edc` ;
- `src/features/protocol-designer/functional-reset/product-entry-routing.ts` — absent de `main@9be06edc` ;
- `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx` — version antérieure active ;
- `src/features/protocol-designer/functional-reset/session.ts` — version antérieure active.

Les tests et le rapport modifiés par 01D ne participent pas au runtime navigateur.

## Static copy provenance

| Chaîne | Source à `main@9be06edc` | Observation live | Classification |
| --- | --- | --- | --- |
| « Décrivez votre idée, confirmez la structure proposée, puis faites évoluer le projet dans le même échange. » | `ProtocolDesignerWorkspace.tsx:605` | visible dans l'en-tête Conversation Production | `BUNDLED_STATIC_COPY` |
| « Décrivez-moi le projet de recherche que vous souhaitez construire. Vous pouvez partir d'une idée simple ou donner tous les détails que vous connaissez déjà. » | `session.ts:28`, valeur `INITIAL_NOXIA_MESSAGE` | visible comme première entrée d'une session hydratée | `BUNDLED_STATIC_COPY` à la création, puis `PERSISTED_SESSION_COPY` |

À `312b4b9c`, la première chaîne n'existe plus. La seconde n'est conservée que comme constante legacy exacte permettant la migration ciblée ; elle n'est plus la copie initiale.

## Persisted state

Le mécanisme réellement utilisé par cette surface est `localStorage`, clé :

```text
noxia-protocol-designer-functional-reset-v3
```

La Production charge cette session au montage, réhydrate ses `entries`, son Project et son QRY, puis la repersiste. Le readback live montre une session historique déjà hydratée avant toute action de la mission.

| Mécanisme | État démontré |
| --- | --- |
| `localStorage` | utilisé pour session, entries, Project et QRY |
| `sessionStorage` | aucun usage trouvé sur ce chemin |
| IndexedDB | aucun usage trouvé sur ce chemin |
| React hydration | `useState(loadInitialSession)` lit la session locale au montage |
| Persisted session schema | `FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION`, clé v3 |
| Service worker / PWA cache | aucun enregistrement trouvé dans le périmètre applicatif inspecté |

La migration 01D ne peut pas être observable sur Production parce que sa fonction `repairPersistedProductPresentation` n'est pas déployée à `main@9be06edc`. La persistance est un amplificateur secondaire de l'ancien parcours ; elle n'explique pas la copie d'en-tête statique, qui provient déjà du bundle Production.

## Answer-first provenance

```text
ANSWER_FIRST_01D_RUNTIME_EVALUATED = NO
```

Le déploiement testé exécute le bridge conversationnel générique antérieur à 01B/01D. Les formulations exactes « Souhaitez-vous… » et « Aimeriez-vous clarifier… » sont absentes des sources statiques inspectées. L'artefact exact de réponse provider et la session du retest ne sont pas exportés ; aucune attribution byte-identical n'est donc inventée.

Le seul constat requis ici est antérieur : ces réponses ne peuvent pas démontrer une non-conformité du handler Knowledge 01D puisque ce handler n'est pas présent dans le déploiement testé.

## KnowledgeResult presence

```text
TESTED_DEPLOYMENT_01D_KNOWLEDGE_RESULT = NOT_APPLICABLE
```

Le tree Production ne contient pas le raccord produit 01D `executeProductUnderstandInteraction` dans le workspace actif. L'absence de sources dans les extraits utilisateur n'est pas utilisée seule pour conclure à l'absence de Knowledge ; c'est l'absence du chemin 01D dans le SHA déployé qui ferme ce point.

## Evidence rendering path

Le composant `ProductUnderstandResponse.tsx`, qui rend les sections Sources, Applicabilité, Limites, Contradictions / débats, Lacunes et Provenance et versions, n'existe pas dans `main@9be06edc` et ne peut donc pas être rendu par la Production testée.

```text
01D_EVIDENCE_RENDERING_PATH_PRESENT_IN_TESTED_DEPLOYMENT = NO
```

Le Preview 01D charge bien la surface intent-first. Aucun scénario scientifique n'a été exécuté dans cette mission, conformément à la condition STOP et à l'interdiction de provider.

## First divergent stage

```text
FIRST_DIVERGENT_STAGE =
TESTED_PRODUCT_URL_RESOLVES_TO_PRODUCTION_MAIN_BEFORE_01D_RUNTIME
```

La divergence précède route, session adapter 01D, handler UNDERSTAND, Knowledge adapter et projection de preuve.

## Primary root cause

```text
PRIMARY_ROOT_CAUSE =
MANUAL_RETEST_TARGETED_PRODUCTION_MAIN_NOT_THE_01D_PREVIEW_DEPLOYMENT
```

Le produit observé est cohérent avec le code Production qu'il sert. Le rapport 01D décrit une autre révision, disponible dans un Preview distinct.

## Secondary findings

- la Production conserve un historique `localStorage` project-first ; cette persistance est réelle mais secondaire au mismatch de déploiement ;
- la copie d'en-tête project-first n'est pas persistée et fournit donc une empreinte indépendante de la session ;
- aucun service worker applicatif n'est trouvé pour soutenir l'hypothèse d'un ancien bundle 01D remplacé par cache ;
- le Preview 01D est protégé par l'accès Vercel, alors que le domaine Production est public ; cette différence d'accès doit rester visible lors du prochain retest, sans être présentée comme la cause démontrée du choix d'URL ;
- `PRODUCT_TRACE_INTEGRATION = ABSENT` reste vrai et aucune télémétrie produit n'identifie l'URL du retest utilisateur ou son artefact provider.

## What is not defective

- le code 01D n'est pas démontré défectueux par les observations effectuées sur `main@9be06edc` ;
- le Preview 01D existe, est lié au SHA exact et sert la nouvelle copie intent-first ;
- aucune défaillance du Domain Gate, du router, de Knowledge, ST, Imaging, REG, VAL, QRY, Project ou DOC au SHA 01D n'est établie ;
- aucune conclusion scientifique n'est tirée des réponses A/B ;
- l'Editorial Engine n'est pas impliqué ;
- aucune perte de preuve dans un `KnowledgeResult` 01D n'est déduite de l'UI Production, car ce résultat n'y est pas construit.

## Minimal future repair surface

```text
RUNTIME_CODE_REPAIR_JUSTIFIED = NO
```

La prochaine action bornée est un retest humain sur l'URL Preview 01D exacte, après vérification visible de l'URL et de la copie intent-first. Aucune correction de router, Knowledge, Project, QRY, UI ou session n'est justifiée avant ce retest.

Une éventuelle promotion vers Production, un indicateur visible de SHA ou une amélioration Product TRACE relèveraient de missions séparées et d'autorisations explicites.

## Git

- branche : `protocol-designer-canonical-ingestion` ;
- HEAD : `312b4b9c45de57ed3a6339dcc703f79955fbc36c` ;
- `origin/protocol-designer-canonical-ingestion` : `312b4b9c45de57ed3a6339dcc703f79955fbc36c` ;
- `main` et `origin/main` : `9be06edca1a7500ab7a43d065e94241e91d67bec` ;
- correction de code : `0` ;
- commit : `0` ;
- push : `0` ;
- merge : `0` ;
- déploiement : `0` ;
- 55 artefacts historiques non suivis : préservés ;
- nouvel artefact 01E : le présent rapport, non suivi.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
OPENAI_API_CALLS = 0
CHATGPT_API_CALLS = 0
GEMINI_CALLS = 0
OTHER_LLM_PROVIDER_CALLS = 0
USER_SCENARIO_REPLAYS = 0
SCIENTIFIC_CAMPAIGNS = 0
BENCHMARKS = 0
CODE_REPAIRS = 0
DEPLOYMENTS = 0
```

Méthodes utilisées : inspection statique des deux SHAs, métadonnées GitHub/Vercel, readback browser des surfaces Production et Preview, lecture des rapports 01A–01D et des autorités applicables. Les seuls accès réseau étaient des lectures de métadonnées de déploiement et de pages déjà autorisées ; aucun fournisseur scientifique ou LLM n'a été appelé.

```text
WAVE_2_AUTHORIZED = NO
FINAL_DECISION = PRODUCT_01D_NOT_PRESENT_IN_TESTED_DEPLOYMENT
```
