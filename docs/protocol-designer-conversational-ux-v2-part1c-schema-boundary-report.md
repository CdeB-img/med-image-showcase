# CONV-UX-V2-01C — Schema Boundary Hardening

Date : 2026-08-15

Portée : hotfix production ciblé, Level 3

Blocker traité : `V1_PRODUCTION_BLOCKER_UNHANDLED_SCHEMA_BOUNDARY`

## ROOT CAUSE

`ProtocolDesignerDemo` appelait directement `executeKnowledgeEngine(...)` dans un `useMemo`. Une chaîne issue d'une Contribution libre avait été copiée telle quelle dans `scientificContext.preservedScientificTerms`, puis dans `KnowledgeRequest.scientificObjects[].originalTerm`. `parseKnowledgeRequest(...)` conservait à juste titre une validation Zod stricte à 200 caractères, mais l'exception remontait sans interception pendant le rendu React. Le résultat était une page blanche.

Deux défauts distincts étaient donc présents :

1. une projection Contribution → Knowledge confondait un contenu scientifique libre avec un terme Knowledge atomique ;
2. une projection de présentation autorisait une exception de validation runtime à sortir de `useMemo`/render.

## FAILING OBJECT

La preuve console de production établit exactement :

- chemin : `scientificObjects[3].originalTerm` ;
- erreur : `too_big` ;
- maximum : 200 ;
- conséquence : exception Zod pendant le rendu.

La reproduction déterministe fidèle utilise le message colchicine de 264 caractères :

> Je souhaite étudier l'effet de la colchicine dans l'infarctus du myocarde, étudier les marqueurs de l'inflammation et quantifier les lésions à l'IRM et en biologie, chez deux populations médicaments vs placebo, dans une étude multicentrique créée de toutes pièces.

Objet fautif reconstruit :

- type proposé : `SCIENTIFIC_OBJECT` ;
- `content` / valeur normalisée : le message complet ci-dessus ;
- `originalTerm` anciennement projeté : le même message complet ;
- longueur exacte : 264 ;
- source raw : `source.originalRequest` et `turn:raw`, intégralement conservés ;
- `sourceText` atomique fiable : absent (`null`) ;
- payload ref de test : `object:lossy-full-sentence` ;
- Contribution ref : `contribution:production`.

Le dump brut historique de l'appel provider ayant causé l'incident n'est pas présent dans le dépôt. Son identifiant de modèle et son `rawOutputRef` ne sont donc pas inventés. La reproduction couvre le payload, la longueur, l'index, le schéma et le corridor de rendu observés.

## originalTerm SEMANTICS

`originalTerm` représente la forme de surface atomique utilisée par Knowledge pour identifier et rechercher un objet scientifique. Il ne représente ni une phrase libre, ni la question complète, ni la provenance verbatim.

La phrase libre reste dans `ScientificContributionItem.content`. La provenance verbatim reste dans `Contribution.source.originalRequest`, `Contribution.source.turns` et, lorsqu'il existe réellement, `epistemicBoundary.sourceText`.

Conclusion : un `originalTerm` supérieur à 200 caractères est intrinsèquement invalide dans ce contrat. La limite 200 n'a pas été augmentée.

## AUTHORITATIVE CONTRACT

L'audit a respecté le routage documentaire courant : SOURCE-OF-TRUTH-INDEX, Charte fondatrice, Scientific Product Manifesto V2, Editorial Engine Architecture Manifesto, PD-003 V2, PD-004, PD-005, contrats Scientific Interpretation/Contribution, rapports CONV-UX-V2-01 et 01B.

Les règles appliquées sont :

- une Contribution est un candidat scientifique traçable, pas une vérité Project ;
- une projection ne crée ni ne modifie la vérité de sa source ;
- le texte brut, la provenance, les inconnues et les pertes de projection restent visibles ;
- chaque owner corrige son propre payload ;
- l'interface peut simplifier la présentation, jamais fabriquer un contenu scientifique.

Le `max(200)` est une contrainte d'implémentation Knowledge cohérente avec la sémantique atomique du champ. Aucune autorité normative n'a été modifiée et le SOURCE-OF-TRUTH-INDEX n'a pas à être révisé pour ce hotfix Level 3.

## PRODUCER TRACE

Trace avant correction :

```text
USER RAW TEXT (264)
→ sortie structurée provider pouvant légitimement porter un content scientifique libre
→ validation hybridPrimaryInterpretationSchema
→ HybridScientificInterpretationRuntimeAdapter
→ ScientificInterpretationContributionEnvelope valide
→ projectScientificContributionToV1 / contributionToKnowledgeRequest copiaient item.content sans qualifier sa sémantique
→ scientificContext.preservedScientificTerms
→ ProtocolDesignerDemo copiait ces chaînes dans scientificObjectTerms
→ createKnowledgeRequest créait scientificObjects[3].originalTerm
→ parseKnowledgeRequest
→ Zod too_big
→ exception dans useMemo/render
```

Le premier producteur fautif n'est pas le provider : c'est l'adaptation Contribution → terme atomique Knowledge. Un `content` de 264 caractères est licite dans la Contribution ; sa promotion directe en `originalTerm` ne l'est pas.

## SCHEMA TRACE

Le schéma strict reste :

- `scientificObjects[].originalTerm`: 1 à 200 caractères ;
- `relations[]`: 1 à 200 caractères ;
- maximum 30 objets et 30 relations.

`createKnowledgeRequest` normalise et construit les objets, puis `parseKnowledgeRequest` exécute `knowledgeRequestSchema.parse`. Ce parse demeure strict pour les consommateurs internes qui lui fournissent des données contractuelles.

L'audit borné des bombes de même classe a trouvé les relations Knowledge : une relation construite avec deux contenus libres pouvait également dépasser 200 caractères. Elle est désormais validée au même boundary, conservée intégralement dans la Contribution/trace et refusée comme relation atomique avec `KNOWLEDGE_RELATION_TOO_LONG`.

## RENDER TRACE

Avant : `useMemo` → `executeKnowledgeEngine` → `parseKnowledgeRequest` → throw non intercepté → démontage du rendu Protocol Designer.

Après : `useMemo` → `executeKnowledgeEngineForPresentation` → préparation des objets/relations → exécution stricte protégée → résultat `SUCCESS`, `PARTIAL` ou `FAILURE` + diagnostics → shell maintenu.

Si une autre exception de présentation échappe à cette frontière, l'ErrorBoundary de route intercepte l'exception sans démonter le header/app shell.

## DATA FIX

`prepareScientificObjectTerms` applique la règle suivante au premier boundary Knowledge :

1. accepter un terme atomique non vide de longueur ≤ 200 ;
2. si le contenu libre est plus long, accepter uniquement un `sourceText` réel, présent textuellement dans la source raw et de longueur ≤ 200 ;
3. en l'absence de span fiable, ne fabriquer ni résumé ni remplacement : conserver la valeur complète dans un diagnostic `SCIENTIFIC_OBJECT_ORIGINAL_TERM_TOO_LONG` et ne pas la promouvoir en atome Knowledge.

Les objets valides continuent à alimenter Knowledge. La Contribution, le raw text et la trace de perte restent complets. La même règle est appliquée aux relations de plus de 200 caractères.

## VALIDATION BOUNDARY

La validation structurée provider existante est conservée :

- une panne d'appel devient `PROVIDER_FAILURE` ;
- une sortie reçue mais non conforme devient `STRUCTURED_CONTRACT_FAILURE` ;
- le raw provider est conservé comme preuve avant rejet, conformément à la politique existante ;
- aucune Contribution invalide n'est consommée après l'échec.

Le défaut de cette mission apparaît après une Contribution valide, lors de sa projection vers le contrat plus étroit de Knowledge. La validation s'effectue désormais dans `contributionToKnowledgeRequest`, `projectScientificContributionToV1` et dans le sélecteur de présentation avant l'appel strict au moteur.

L'audit des `.parse()` du corridor n'a trouvé aucun autre parse Zod dépendant d'un payload provider/persisté exécuté sans protection dans le rendu. Le parse provider de `hybrid-primary.ts` est intercepté par l'adapter ; les restaurations de session utilisent `safeParse` ou un `try/catch`.

## ERROR BOUNDARY

`/protocol-designer/demo` est maintenant enveloppé par `ProtocolDesignerErrorBoundary`.

Le boundary :

- laisse le header/app shell hors de son périmètre de chute ;
- affiche un état récupérable ;
- propose « Réessayer l'affichage » et une réinitialisation explicite ;
- journalise code, owner, message et component stack ;
- n'affiche aucune stack Zod en mode Standard ;
- n'autorise aucune écriture Project.

Dans le cas attendu et contrôlé, `SchemaBoundaryNotice` affiche le message contractuel, permet retry/correction et expose uniquement code, owner, schema path et payload ref en mode Expert.

## PERSISTED INVALID STATE

Une session legacy/V2 peut déjà contenir le texte de 264 caractères dans `preservedScientificTerms`. Ce stockage n'est pas supprimé : il contient encore la source utile et ne constitue pas à lui seul une vérité Knowledge.

Au reload, la projection est revalidée :

- le texte utilisateur intégral reste affiché ;
- les trois termes atomiques valides restent utilisables ;
- le quatrième élément reçoit un diagnostic contrôlé ;
- la session reste présente ;
- aucun crash répété ni boucle de reload n'apparaît.

Une réinitialisation n'est réalisée que sur action explicite de l'utilisateur.

## NO-SILENT-TRUNCATION PROOF

Aucun `slice(0, 200)` ni `substring(0, 200)` n'a été introduit. Les tests inspectent les nouveaux boundaries et échouent si une telle troncature apparaît.

Pour le cas de 264 caractères :

- `Contribution.scientificContent.candidateObjects[3].content` vaut toujours les 264 caractères ;
- `Contribution.source.originalRequest` vaut toujours les 264 caractères ;
- `diagnostic.originalValue` vaut toujours les 264 caractères ;
- la perte de projection est inscrite dans `interpretationTrace.legacyProjectionLosses` ;
- seuls les atomes valides `colchicine`, `infarctus du myocarde` et `placebo` sont projetés.

Il s'agit d'un refus explicite de promotion, pas d'une suppression silencieuse de contenu scientifique.

## FILES CHANGED

- `src/features/knowledge-engine/scientific-object-boundary.ts`
- `src/features/knowledge-engine/presentation.ts`
- `src/features/knowledge-engine/knowledge-request.ts`
- `src/features/knowledge-engine/index.ts`
- `src/features/scientific-interpretation/knowledge.ts`
- `src/features/scientific-interpretation/v1-compatibility.ts`
- `src/features/protocol-designer/ProtocolDesignerErrorBoundary.tsx`
- `src/features/protocol-designer/conversation/SchemaBoundaryNotice.tsx`
- `src/pages/ProtocolDesignerDemo.tsx`
- `src/App.tsx`
- `src/features/scientific-interpretation/__tests__/scientific-object-boundary.test.ts`
- `src/features/protocol-designer/conversation/__tests__/conv-ux-v2-part1c.test.tsx`
- `docs/protocol-designer-conversational-ux-v2-part1c-schema-boundary-report.md`

## TESTS

Tests ajoutés :

- `CONV-V2C-C01` à `CONV-V2C-C14` ;
- frontières `originalTerm` 199, 200 et 201 ;
- relation Knowledge de 201 caractères ;
- Contribution → Knowledge : source atomique fiable, absence de source fiable, relation longue ;
- ErrorBoundary et reload persistant.

Résultats :

- tests Part 1C + producer boundary : 21/21 PASS ;
- corridor élargi Protocol Designer, Scientific Interpretation, Knowledge, QRY, Project, ST, IMG, Adaptive Workspace et intégration : 999/999 PASS sur 66 fichiers ;
- les suites Part 1 et Part 1B sont incluses dans ce corridor et restent PASS.

## EXACT PRODUCTION REPRO

`CONV-V2C-C01` hydrate `ProtocolDesignerDemo` avec le message colchicine exact de 264 caractères placé en quatrième terme, reproduit `scientificObjects[3].originalTerm`, et prouve que le rendu ne lance plus d'exception.

Résultat attendu et obtenu : shell monté, texte brut visible, diagnostic Standard visible, autres éléments utilisables, aucune page blanche.

## RELOAD

`CONV-V2C-C08` recharge une session propriétaire V2 contenant le quatrième terme de 264 caractères. La session n'est ni supprimée ni réécrite silencieusement ; le raw demeure disponible et la projection produit un diagnostic récupérable à chaque ouverture sans throw.

Résultat : PASS.

## GLOBAL TESTS

`npm test -- --reporter=dot` : 2 581 PASS / 2 584 tests, 135 fichiers PASS / 138.

Les trois seuls échecs sont strictement les contrôles préexistants de propreté du checkout externe `/Users/charles/Documents/Projets/editorial-engine` :

- `scientific-knowledge-graph-web.test.mjs` ;
- `scientific-corpus.test.mjs` ;
- `scientific-multidomain.test.mjs`.

Leur cause est identique au baseline : ce checkout externe contient déjà des modifications et fichiers non suivis. Il n'a pas été modifié par cette mission.

## TYPECHECK

`npm run typecheck` : PASS.

Le build exécute aussi :

- `typecheck:scientific-interpretation-api` : PASS ;
- `typecheck:scientific-interpretation-server` : PASS.

## BUILD

`npm run build` : PASS. Vite a transformé 1 976 modules et produit le bundle de production.

Les avertissements Browserslist, annotation Rollup de `react-helmet-async` et taille de chunk sont préexistants et non bloquants pour ce hotfix.

## ESM CHECK

`check-scientific-interpretation-server.mjs` : PASS.

- modules runtime statiques : 18 ;
- alias runtime : 0 ;
- imports relatifs sans extension : 0 ;
- chargement handler Node ESM : PASS.

Le test `vercel-node-esm-runtime.test.ts` passe également.

## LINT

ESLint sur les 12 fichiers source/test modifiés : PASS, zéro erreur et zéro warning.

## DIFF CHECK

`git diff --check` : PASS.

Aucun fichier du checkout Editorial Engine externe, aucune autorité normative et aucun SOURCE-OF-TRUTH-INDEX n'ont été modifiés.

## COMMITS

Découpage atomique retenu :

1. `fix(scientific-interpretation): enforce scientific object term contract`
2. `fix(protocol-designer): prevent schema failures from blanking workspace`
3. `test(protocol-designer): prove schema boundary recovery`

Les identifiants exacts sont rapportés dans la sortie finale de mission ; le troisième commit contient le présent rapport.

## PUSH STATUS

Non effectué, conformément à la mission. Aucun déploiement n'a été lancé.

## DECISION

`CONV_UX_V2_PART1C_SCHEMA_BOUNDARY_FIXED_READY_FOR_PRODUCTION_ACCEPTANCE`
