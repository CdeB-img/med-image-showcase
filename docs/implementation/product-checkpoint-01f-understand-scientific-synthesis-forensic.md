# PRODUCT CHECKPOINT 01F — UNDERSTAND scientific synthesis ownership and projection forensic

Nature : `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Statut : non normatif, diagnostic produit read-only

Date : 2026-08-27

## Decision

`UNDERSTAND_SYNTHESIS_ROOT_CAUSE_IDENTIFIED`

Le parcours Production exécute correctement `UNDERSTAND`, puis le Knowledge Engine local `1.2.0`. Le `KnowledgeResult` contient une `RuntimeKnowledgeSynthesis`, une carte de couverture comparative, les assertions/statements, les sources, les preuves, l'applicabilité, les limites, la différence contextuelle et les gaps. Le défaut ne vient donc ni d'un owner scientifique manquant ni d'un résultat Knowledge absent.

La première divergence pour la synthèse utilisateur est la projection conversationnelle : `projectUnderstandResult` reçoit le résultat complet, mais, pour une couverture `PARTIAL`, produit seulement une phrase générique et n'utilise pas les conclusions, convergences ou divergences de `RuntimeKnowledgeSynthesis` pour former une explication structurée. La projection contient déjà une carte `comparison`, six `supportedItems` bornés et des implications méthodologiques, mais `ProductUnderstandResponse` ne rend aucun de ces trois éléments. L'adapter produit copie parallèlement les 46 assertions/statements dans `presentation.assertions`, puis l'UI les affiche toutes sous « Éléments documentés ».

```text
FIRST_DIVERGENT_STAGE_FOR_USER_FACING_SYNTHESIS =
UNDERSTAND_CONVERSATION_KNOWLEDGE_PROJECTION_COMPOSITION

RAW_TECHNICAL_EXPOSURE_STAGE =
PRODUCT_UNDERSTAND_PRESENTATION_ASSERTION_EXPANSION
```

Le retrieval large contribue au bruit : P4R retourne toute assertion correspondant à au moins un concept ECV/T1/IRM/CT/fibrose, et l'adapter RB-004 retourne ses 18 blocs contrôlés dès qu'un terme couvert est présent. Aucun ranking spécifique à la relation demandée n'est appliqué. Ce facteur amplifie le défaut de projection, sans être son premier étage.

Les responsabilités ne sont pas absentes, mais elles doivent rester séparées. PD-003 V2 et KE-001 attribuent à Knowledge la sélection, la qualification et la synthèse scientifique gouvernée, dont la `RuntimeKnowledgeSynthesis`. KE-001 attribue au Document Engine uniquement la `Conversation Knowledge Projection` du parcours `UNDERSTAND` : sélection fidèle de conclusions déjà présentes, composition conversationnelle et réalisation linguistique sous contrôle. Cette projection ne possède jamais la science qu'elle formule. La capacité générale n'est pas implémentée/raccordée ; une projection déterministe locale placée dans le module Knowledge et un adapter produit la remplacent partiellement.

```text
NORMATIVE_SYNTHESIS_CONTRACT = PRESENT
IMPLEMENTED_SYNTHESIS_CAPABILITY = PARTIAL
USER_FACING_PROJECTION = PARTIAL_AND_USED
SCIENTIFIC_SYNTHESIS_OWNERSHIP = KNOWLEDGE
CONVERSATIONAL_COMPOSITION_RESPONSIBILITY = DOCUMENT_ENGINE
USER_FACING_ANSWER_MODEL = PARTIAL
```

Cette décision ne juge pas la vérité scientifique des éléments, ne produit aucun Gold, ne vaut pas PASS PD-011 et ne justifie aucune modification de Scientific Thinking.

## Production baseline

Le preflight Production a été vérifié par readback Vercel direct dans l'opération autorisée immédiatement antérieure à 01F. Aucun nouveau readback réseau n'a été effectué dans 01F.

| Champ | État vérifié |
| --- | --- |
| Production URL | `https://noxia-imagerie.fr` |
| Vercel project | `cdeb-imgs-projects/med-image-showcase` |
| Environment | `Production` |
| Deployment ID | `dpl_E8e3R54RYZhmA5egxmTjVfNSDMkN` |
| Immutable deployment URL | `https://med-image-showcase-5hjn7dhx0-cdeb-imgs-projects.vercel.app` |
| Source branch | `main` |
| Deployed SHA | `312b4b9c45de57ed3a6339dcc703f79955fbc36c` |
| State | `READY` / `Current` |
| Deployment date | 2026-08-27 10:01:26 UTC+2 |
| `/protocol-designer/demo` | chargé, surface intent-first disponible, aucune erreur runtime bloquante observée au preflight |

```text
PRODUCTION_DEPLOYED_SHA_MATCHES_01D = YES
```

Le test humain Case B fourni par Charles est une preuve produit sur cette Production. Il n'est ni un Gold scientifique ni une adjudication PD-011. Aucun scénario n'a été rejoué dans le navigateur pendant 01F.

Autorités consultées dans l'ordre imposé :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` ;
2. NOXIA — Charte fondatrice ;
3. NOXIA Protocol Designer — Scientific Product Manifesto V2 ;
4. Editorial Engine — Architecture Manifesto ;
5. PD-003 V2 Research Object Model et Ownership Matrix ;
6. PD-004 UX Manifesto ;
7. PD-009 Decision Engine Architecture ;
8. RDE-001 Research Design Engine Architecture ;
9. RDE-002 Research Design Workflow ;
10. KE-001 Knowledge Engine Architecture.

Les rapports PRODUCT-CHECKPOINT-01A à 01E ont été consultés uniquement comme preuves Level 3. Aucune contradiction normative bloquante n'a été trouvée.

## Case A

Entrée exacte :

> Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.

Le readback local déterministe courant reproduit le chemin Product 01D sans provider externe :

| Élément | État |
| --- | --- |
| Route | `UNDERSTAND` |
| Réponse principale | « Des éléments internes existent, mais leur applicabilité au contexte demandé n’est pas démontrée… » |
| Libellé de couverture | `Contexte non applicable` |
| Concepts résolus | 4 |
| Assertions/statements applicables | 0 |
| Sources conservées | 3 |
| EvidenceLinks conservés | 6 |
| Contradictions | 0 |
| Gaps | 3 |
| Limites | 7 |
| Project writes / Protocol projections / external calls | `0 / 0 / 0` |

Les métadonnées distinguent déjà plusieurs natures :

| Disposition souhaitée | Métadonnée disponible aujourd'hui | Capacité de distinction |
| --- | --- | --- |
| `PARTIAL_ANSWER` | `coverageStatus = PARTIAL` et branches `PARTIAL_COVERAGE` | oui en général, non pour Case A qui n'a aucun élément applicable |
| `INSUFFICIENT_FOR_COMPARISON` | `coverageMap = INSUFFICIENT_EVIDENCE` ou gap de comparaison directe | partielle ; Case A n'est pas décomposé en deux branches phénomènes |
| `NOT_APPLICABLE` | `PROVIDER_NOT_APPLICABLE` / `INCOMPATIBLE_CONTEXT` | oui, mais le libellé UI fusionne incompatibilité et documentation insuffisante |
| `NO_KNOWLEDGE` | `NO_PROVIDER` ou `NO_MATCH` | oui, distinct de l'inapplicabilité |

```text
CASE_A_METADATA_DISPOSITION_SEPARABILITY = PARTIAL
```

Le runtime peut donc éviter le faux « aucune connaissance », mais ne possède pas encore une disposition utilisateur consolidée capable d'expliquer proprement la différence complète no-reflow/MVO. La forme comparative proposée par le prompt pourrait être appropriée seulement si les éléments applicables correspondants existaient ; 01F n'en invente aucun.

## Case B

Entrée Production observée :

> Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse.

Le readback local déterministe du même SHA retrouve exactement les comptes du test humain :

| Élément | État |
| --- | --- |
| Route | `UNDERSTAND` |
| Coverage | `PARTIAL` / « Réponse partielle » |
| Request type | `COMPARE` |
| Concepts | ECV, IRM, CT, fibrose myocardique |
| Résumé visible | « Votre question porte sur fibrose myocardique. » |
| Assertions effectives | 28 |
| Statements documentaires gouvernés | 18 |
| Total « Éléments documentés » | 46 |
| Sources | 20 |
| EvidenceLinks | 46 |
| Contradictions/différences contextuelles | 1 |
| Gaps | 4 |
| Limites | 18 |
| Projection `supportedItems` | 6, non rendus comme ensemble borné par l'UI |
| Project writes / Protocol projections / external calls | `0 / 0 / 0` |

La réponse principale est seulement :

> Une partie de la question est documentée. Chaque branche reste visible et la partie absente n’est pas remplacée par une généralisation.

La carte comparative interne conserve pourtant : branche IRM, branche CT, comparaison directe partielle, absence d'assertion comparative générale, méthode IRM/CT distincte, implications méthodologiques, gaps et sources. Cette structure n'est pas transformée en réponse explicative.

Forme informationnelle possible, sans conclusion scientifique ajoutée :

| Section attendue | Support structurel courant | Motif borné |
| --- | --- | --- |
| Objet comparé | `SUPPORTED_BY_CURRENT_KNOWLEDGE` | concepts ECV/IRM/CT/fibrose et demande `COMPARE` conservés |
| Point commun scientifique | `PARTIALLY_SUPPORTED` | les deux branches ECV sont identifiées, sans proposition directe complète sur leur équivalence de construit |
| Différences méthodologiques importantes | `PARTIALLY_SUPPORTED` | relation « method distinct » et détails IRM présents ; la branche CT n'a pas un détail symétrique équivalent dans les conclusions |
| Conditions de comparabilité | `PARTIALLY_SUPPORTED` | méthode, site, hématocrite, contraste, délai et harmonisation sont présents, sans synthèse comparative exacte |
| Limites de l'interchangeabilité | `PARTIALLY_SUPPORTED` | absence de comparaison générale et distinction de méthode explicites ; pas de règle d'interchangeabilité complète |
| Niveau de certitude / gaps | `SUPPORTED_BY_CURRENT_KNOWLEDGE` | couverture, différence contextuelle, limitations et quatre gaps sont structurés |
| Sources principales | `SUPPORTED_BY_CURRENT_KNOWLEDGE` | vingt sources versionnées et quarante-six liens de preuve sont présents |

Cette matrice décrit la possibilité de composition à partir des objets actuels. Elle n'établit pas que les assertions sont scientifiquement complètes ou que la réponse résultante serait validée.

## Active UNDERSTAND path

| Étape | Objet/type | Owner effectif | Fichier/fonction | Entrée → sortie | Transformation |
| --- | --- | --- | --- | --- | --- |
| UserRequest | texte utilisateur | utilisateur | `ProtocolDesignerWorkspace.submit` | texte exact → tour | aucune science ajoutée |
| Domain Gate/routing | `ProductEntryRoutingDecision` | adapter produit | `product-entry-routing.ts::routeProductEntry` | texte + contexte → `UNDERSTAND` + exclusions + contexte | routage, non scientifique |
| UNDERSTAND handler | `ProductUnderstandInteraction` | surface produit | `product-entry-routing.ts::executeProductUnderstandInteraction` | routing + texte → invocation Knowledge | aucun Project write |
| KnowledgeRequest | `KnowledgeRequest@1.2.0` | Knowledge | `knowledge-request.ts::createKnowledgeRequest` | termes/relations/exclusions → requête `COMPARE` | classification déterministe |
| Retrieval | `AdapterResult[]` | Knowledge/providers locaux | `query-planner.ts`, `retrieval.ts`, adapters P4R/RB/KG | plan → assertions/statements/sources | sélection large par concept |
| KnowledgeResult | `KnowledgeResult@1.2.0` | Knowledge | `engine.ts`, `knowledge-result.ts` | résultats adapters → résultat immutable/digéré | applicabilité, conflits, gaps, provenance |
| Synthèse interne | `RuntimeKnowledgeSynthesis` | Knowledge | `synthesizer.ts::synthesizeKnowledge` | assertions/statements → conclusions structurées | une conclusion par unité ; implications génériques ; aucune narration libre |
| Response projector | `UnderstandProjection` | substitut local de la projection DOC normative | `understand-projection.ts::projectUnderstandResult` | KnowledgeResult → labels, answer, comparison, supportedItems, limites, sources | **première divergence** : réponse générique et sous-utilisation de la synthèse |
| Product response model | `ProductUnderstandKnowledgePresentation` | adapter produit | `product-entry-routing.ts::knowledgePresentation` | projection + KnowledgeResult → modèle persistant | recopie les 46 unités dans `assertions` |
| UI | React `ProductUnderstandResponse` | surface produit | `ProductUnderstandResponse.tsx` | modèle de présentation → carte/accordéons | ignore comparison/supportedItems/implications/evidence ; affiche les 46 unités |
| Rendered answer | HTML | projection UI | workspace | carte structurée → utilisateur | synthèse principale générique, détails atomiques non hiérarchisés |

Les données gouvernées ne sont pas perdues. Leur hiérarchie d'usage est incorrecte : des informations de niveau Expert occupent la première profondeur de détail, tandis que la composition scientifique utile n'est pas produite.

## KnowledgeResult content classification

Classification contractuelle des 46 éléments Case B, sans jugement de vérité scientifique. Les numéros correspondent à l'ordre déterministe du readback.

| Catégorie | Compte | Éléments | Lecture |
| --- | ---: | --- | --- |
| `DIRECTLY_RESPONDS_TO_USER` | 1 | 18 | relation explicite « ECV MR method distinct from ECV CT » |
| `SUPPORTS_SYNTHESIS` | 7 | 5, 10, 11, 13, 24, 25, 33 | définition/calcul et dépendances nécessaires à une explication de méthode |
| `CONTEXTUAL_LIMITATION` | 12 | 1, 2, 6, 7, 9, 12, 14, 17, 22, 23, 26, 35 | conditions techniques, de site, séquence, délai ou généralisabilité |
| `CONTRADICTION_OR_DEBATE` | 4 | 27, 36, 37, 38 | transférabilité contestée, positions et question ouverte |
| `PROVENANCE` | 2 | 15, 16 | correction et position documentaire historique |
| `CORPUS_TECHNICAL_LIMITATION` | 4 | 29, 30, 31, 34 | cadrage/structure RB et absence de seuil produit |
| `PERIPHERAL_BUT_RELEVANT` | 16 | 3, 4, 8, 19, 20, 21, 28, 32, 39, 40, 41, 42, 43, 44, 45, 46 | résultats/contexts cardiaques ou stratégies voisins, non réponse directe |
| `IRRELEVANT_TO_REQUEST` | 0 | — | aucun élément n'est totalement étranger au domaine ; la majorité reste néanmoins périphérique à la relation demandée |
| **Total** | **46** | | |

Le problème est une combinaison : retrieval large, absence de ranking relationnel, synthèse runtime peu composée, projection conversationnelle incomplète et renderer qui ignore les structures bornées existantes.

## Retrieval width

Les 46 éléments sont produits de manière déterministe :

- P4R : 28 assertions atomiques ; l'adapter retient une assertion si elle correspond à **au moins un** concept provider ECV/IRM/CT/fibrose, et non si elle répond à la relation comparative complète ;
- RB-004 : 18 statements ; dès qu'un terme couvert est présent, l'adapter retourne tous les blocs contrôlés de la fixture documentaire ;
- Knowledge Graph : concepts/relations et limites techniques, mais aucune assertion scientifique positive ;
- aucun score ou ranking de pertinence par rapport à la question n'existe ;
- l'ordre est principalement déterministe par identité, pas par utilité utilisateur ;
- `projectUnderstandResult` borne pourtant `supportedItems` à six au niveau `PROFESSIONAL`, mais la UI rend `presentation.assertions`, soit les 46.

```text
RETRIEVAL_CONTRIBUTES_TO_USER_NOISE = YES
```

Tous les éléments peuvent avoir une utilité de corpus, mais ils ne sont pas tous nécessaires à la réponse actuelle. La première réparation future ne doit pas nécessairement réduire le retrieval : une projection correcte peut d'abord sélectionner et hiérarchiser sans modifier le `KnowledgeResult` historique. Une évolution du ranking ne serait justifiée qu'après mesure du bruit résiduel.

## Existing synthesis capability

### Contrat normatif

KE-001 distingue trois objets :

1. `RuntimeKnowledgeSynthesis`, calcul immuable d'une exécution Knowledge ;
2. synthèse de preuves canonique gouvernée, distincte ;
3. projection narrative du Document Engine.

La synthèse runtime doit conserver question/contexte, conclusions, supporting/qualifying/refuting sets, convergence, divergences, controverses, limites, gaps, implications méthodologiques, sources/localisateurs et versions/policies. Elle ne crée ni connaissance, ni recommandation, ni texte utilisateur final.

### Implémentation

`RuntimeKnowledgeSynthesis` existe dans `KnowledgeResult.synthesis` et son digest participe au digest du résultat. Le builder est appelé à chaque exécution et produit des conclusions traçables, des divergences, controverses, limites, gaps, implications méthodologiques et sources.

Capacité démontrée : conservation et regroupement déterministes.

Limite constatée : chaque assertion/statement devient une conclusion de même texte ; la convergence est une phrase générique ; pour `COMPARE`, l'implication est uniquement de conserver les branches. Il n'existe pas de composition explicite « objets communs → différences → conditions → limites ».

### Usage aval

`projectUnderstandResult` utilise `synthesis.methodologicalImplications`, mais n'utilise pas `synthesis.conclusions`, `convergences` ou `divergences` pour construire `answer`. En couverture `PARTIAL`, il sélectionne une phrase statique de couverture. Sa structure `comparison` est bien calculée, puis ignorée par le composant UI.

Conclusion : la synthèse n'est ni absente ni entièrement ignorée ; elle est **présente, peu composée et sous-consommée**.

## Synthesis ownership

| Hypothèse | Verdict | Preuve |
| --- | --- | --- |
| A — Knowledge possède une synthèse runtime ignorée | `PARTIAL_YES` | synthèse calculée ; seule l'implication méthodologique est consommée |
| B — Knowledge fournit les unités et une projection doit les expliquer | `YES` | Knowledge possède la synthèse scientifique ; KE-001 attribue seulement la `Conversation Knowledge Projection` fidèle à Document |
| C — une composition existe mais n'est pas appelée | `NO` au sens strict | `projectUnderstandResult` est appelée ; sa composition est incomplète et ses champs utiles sont ensuite ignorés |
| D — la UI rend directement KnowledgeResult faute de composer | `PARTIAL_YES` | elle reçoit un modèle produit, pas le résultat brut, mais ce modèle recopie et rend les 46 unités |
| E — Scientific Thinking est nécessaire | `NO_FOR_CASE_B` | une comparaison de connaissances applicables reste dans le contrat Knowledge/DOC ; ST n'est requis que pour proposer modèles/hypothèses candidats |
| F — aucun owner ne possède la responsabilité | `NO` | responsabilités partagées sans chevauchement : Knowledge possède la science ; Document possède la projection conversationnelle ; PD-004 gouverne la profondeur UX |

Knowledge possède le fond épistémique, la sélection/qualification des éléments applicables et leur synthèse scientifique structurée. Document possède uniquement la composition conversationnelle et la réalisation linguistique de la réponse utilisateur depuis ce résultat, avec fidélité phrase–assertion–source. PD-004 gouverne la profondeur de présentation et la progressive disclosure. La surface produit réalise le rendu ; ni Document, ni l'UI ne deviennent owners scientifiques.

Le Document Engine général est décrit comme non implémenté dans RDE-001. Le code DOC courant traite principalement les projections de projet/protocole et ne contient pas de `Conversation Knowledge Projection`. Le substitut local actuel vit dans `knowledge-engine/understand-projection.ts`, alors qu'il produit déjà un texte utilisateur. Cette discordance d'implémentation n'autorise ni un nouvel owner ni un transfert à Scientific Thinking.

### Authority reconciliation 01F-R

`UNDERSTAND_SYNTHESIS_OWNERSHIP_RECONCILED`

| Responsabilité | Owner normatif | Composant implémenté actuel | Source d'autorité | Statut | Surface minimale future à corriger |
| --- | --- | --- | --- | --- | --- |
| A — sélection et qualification des éléments Knowledge applicables | Knowledge | `query-planner.ts`, adapters, `applicability.ts`, `assertion-resolver.ts`, `conflict-gap-analyzer.ts`, `knowledge-result.ts` | PD-003 V2, plan Knowledge ; crosswalk #57–65 ; KE-001 §§1, 8–15 ; RDE-001 §§17–18 | `IMPLEMENTED_TECHNICALLY_WITH_BOUNDED_CORPUS`; aucun PASS scientifique | conserver sous Knowledge ; mesurer puis corriger séparément le ranking seulement si le bruit résiduel le justifie |
| B — synthèse scientifique gouvernée de plusieurs éléments Knowledge | Knowledge | `synthesizer.ts::synthesizeKnowledge` → `RuntimeKnowledgeSynthesis` | PD-003 V2 crosswalk #62 ; KE-001 §§0.5, 1, 14–16 | `RUNTIME_IMPLEMENTED_PARTIAL`; aucune Synthèse de preuves canonique publiée déduite | améliorer dans Knowledge la composition structurée question-shaped, sans produire de narration libre ni modifier le corpus |
| C — composition de la réponse `UNDERSTAND` depuis `KnowledgeResult` | Document Engine, uniquement comme `Conversation Knowledge Projection` fidèle | `understand-projection.ts::projectUnderstandResult` puis `product-entry-routing.ts::knowledgePresentation`, substitut local actuellement situé dans le module Knowledge | KE-001 §§18.1 et 20 ; RDE-001 §20 pour le parcours ; PD-003 V2 plan Projection | `PARTIAL_AND_BOUNDARY_MISPLACED`; ne possède pas la synthèse scientifique | raccorder la projection conversationnelle sous la frontière Document existante, en consommant le résultat Knowledge immuable sans recomposition scientifique autonome |
| D — réalisation linguistique de la réponse | Document Engine dans la projection contrôlée ; LLM facultatif, jamais autorité | `UnderstandProjection.answer`, `readableKnowledgeReply` et libellés déterministes | KE-001 §§17 et 20 | `PARTIAL_DETERMINISTIC`; réponse générique sur couverture partielle | réaliser une formulation fidèle depuis la composition structurée, avec validation phrase–conclusion–assertion–localisateur |
| E — profondeur d'affichage et progressive disclosure | gouvernance UX du Protocol Designer sous PD-004 ; ce n'est pas un ownership scientifique | `ProjectionDepth`, modèle de présentation, accordéons du composant produit | PD-004 UX-13, UX-15–17, UX-32–33 et UX-51–54 | `PARTIAL` | appliquer les quatre profondeurs : conclusion/nuance avant détail atomique, limites critiques toujours visibles |
| F — rendu React final | surface produit / renderer technique ; aucune autorité scientifique | `ProductUnderstandResponse.tsx` | PD-004 pour l'expérience ; Editorial Engine Manifesto, chapitre 20, pour la frontière du renderer | `PARTIAL` | rendre `comparison`, `supportedItems`, implications et liens de preuve déjà disponibles ; réserver les dumps atomiques au niveau Expert |
| G — projections documentaires Protocol, rapport, synopsis, etc. | TMP puis DOC selon l'usage ; Document Engine pour la fidélité, jamais le fond | `src/features/document-projection/`, actuellement borné principalement à Protocol | PD-003 V2 plan Projection et crosswalk #66–68 ; RDE-001 §§17–18 et 26–30 | `SEPARATE_FROM_UNDERSTAND`; rapports DOC présents non autoritatifs | aucune modification requise par 01F ; ne pas utiliser DOC-001 pour inventer un ownership conversationnel supplémentaire |

La phrase initiale « le Document Engine est l'owner normatif de la réponse conversationnelle » était trop large. La formulation autoritative exacte est : Knowledge possède la matière et la synthèse scientifiques ; Document possède la projection conversationnelle et sa réalisation linguistique ; PD-004 gouverne la projection UX ; React rend sans posséder le sens. L'Editorial Engine externe ne reçoit aucune responsabilité NOXIA dans cette réconciliation.

## Scientific vs linguistic transformation

| Transformation | Responsabilité légitime | LLM admissible |
| --- | --- | --- |
| sélectionner les conclusions applicables | Knowledge, par règles/policies | non comme autorité |
| conserver/qualifier comparaisons, limites, contradictions et gaps | Knowledge | proposition possible, validation déterministe obligatoire |
| composer les sections structurées de la réponse depuis ces conclusions | Knowledge pour la matière structurée ; Document pour la projection fidèle | non requis |
| choisir ordre, densité, vocabulaire et formulations | Document / Conversation Knowledge Projection | oui, uniquement comme réalisation linguistique contrôlée |
| ajouter relation, causalité, mécanisme, certitude ou recommandation | owner scientifique compétent + gouvernance | interdit à une projection LLM |
| produire hypothèses ou Scientific Models candidats | Scientific Thinking | possible sous ses contrats, sans adoption automatique |

```text
SCIENTIFIC_SYNTHESIS = GOVERNED_STRUCTURED_COMPOSITION
LINGUISTIC_REALIZATION = FAITHFUL_DOCUMENT_PROJECTION
LLM_REQUIRED_FOR_REPAIR = NO
```

Un futur LLM pourrait reformuler une projection déjà structurée, à condition que chaque phrase reste reliée à des assertions/statements/localisateurs et qu'un validateur fail-closed refuse tout ajout. 01F ne choisit aucun fournisseur et n'appelle aucun modèle.

## User-facing answer model

Deux modèles existent :

- `UnderstandProjection` : `answer`, `requestSummary`, `boundedConclusion`, concepts, relations, `supportedItems`, implications, couverture, comparaison, clarifications, limites, gaps, sources et profondeur ;
- `ProductUnderstandKnowledgePresentation` : résultat/digest/version, projection, assertions, sources, EvidenceLinks, contradictions, gaps, limites, provenance et fraîcheur.

Ils sont appelés et persistés. Ils restent partiels parce que :

- `answer` est un fallback de couverture en cas `PARTIAL`, pas une synthèse de la question ;
- le résumé réduit Case B à « fibrose myocardique » ;
- `comparison`, `supportedItems`, `methodologicalImplications`, `relations` et `clarifications` ne sont pas rendus par l'UI ;
- `presentation.evidence` est conservé mais jamais rendu ;
- les assertions complètes remplacent la liste bornée prévue par la projection.

```text
USER_FACING_ANSWER_MODEL = PARTIAL
```

## Progressive disclosure

Le composant utilise des `<details>` pour Sources, Applicabilité, Limites, Contradictions, Lacunes et Provenance. Ce mécanisme préserve l'accès aux éléments et évite leur suppression. Il ne suffit pas à respecter PD-004 :

| Niveau cible | État actuel | Verdict |
| --- | --- | --- |
| Level 1 — réponse scientifique synthétique | phrase générique de couverture | `FAIL` |
| Level 2 — justification/nuances principales | absent ; la comparaison interne n'est pas rendue | `FAIL` |
| Level 3 — sources/applicabilité/limites/contradictions | présents dans plusieurs accordéons | `PASS_WITH_LIMITATIONS` |
| Level 4 Expert — assertions, identifiants, versions, provenance technique | assertions atomiques placées dès le premier accordéon, sans mode Expert dédié | `FAIL` |

```text
PROGRESSIVE_DISCLOSURE_CONFORMANCE = PARTIAL
```

Le problème n'est pas que les preuves soient visibles. Il est qu'aucune couche synthétique utile ne précède une couche atomique trop large et peu organisée.

## Scientific vs technical limitations

Placement : A = réponse principale ; B = panneau Limites contextuel ; C = mode Expert/provenance ; D = ne pas afficher dans la surface normale pour cette question, sauf si l'élément devient causal à la réponse.

| Limite actuelle | Taxonomie primaire | Placement |
| --- | --- | --- |
| `AUTOMATED_REVIEW_IS_NOT_HUMAN_SCIENTIFIC_REVIEW` | `DOCUMENTARY_GOVERNANCE_LIMITATION` | C |
| `CLINICAL_MISCLASSIFICATION` | `EVIDENCE_LIMITATION` | B seulement si l'hématocrite synthétique est retenu ; sinon D |
| `DOCUMENTARY_SECTIONS_WITHOUT_CONTROLLED_TEXT_REMAIN_UNSTRUCTURED` | `CORPUS_STRUCTURE_LIMITATION` | C |
| `ECV_T1_DOMAIN_ONLY` | `APPLICABILITY_LIMITATION` | B/C |
| `NARRATIVE_CORPUS` | `DOCUMENTARY_GOVERNANCE_LIMITATION` | C |
| `NO_GENERAL_MRI_CT_COMPARISON` | `EVIDENCE_LIMITATION` | A puis B, car central à la demande |
| `NO_GENERAL_TECHNICAL_ANSWER` | `ENGINE_TECHNICAL_LIMITATION` | C/D |
| `NOT_ATOMIC_ASSERTIONS` | `DOCUMENTARY_GOVERNANCE_LIMITATION` | C |
| `cardiac-motion` | `SCIENTIFIC_LIMITATION` | B si l'élément IRM dépendant est retenu |
| `method-dependence` | `APPLICABILITY_LIMITATION` | A/B, car central à la comparabilité |
| `post-contrast-delay` | `APPLICABILITY_LIMITATION` | B |
| `POST_CONTRAST_T1_CONFOUNDING` | `SCIENTIFIC_LIMITATION` | B |
| `RELATION_EVIDENCE_MAY_BE_UNKNOWN` | `EVIDENCE_LIMITATION` | B/C ; A si la relation centrale en dépend |
| `SCIENTIFIC_ASSERTION_REGISTRY_EMPTY` | `ENGINE_TECHNICAL_LIMITATION` | C |
| `SINGLE_CRITERION_SPECIFICITY` | `SCIENTIFIC_LIMITATION` | D pour cette question, sinon B local |
| `SITE_SPECIFIC_VALUES` | `APPLICABILITY_LIMITATION` | B |
| `SMALL_SAMPLE` | `EVIDENCE_LIMITATION` | B local, uniquement avec la conclusion concernée |
| `UNSTRUCTURED_SECTIONS_DECLARED_NOT_CONVERTED` | `CORPUS_STRUCTURE_LIMITATION` | C |

Les limites scientifiques/applicabilité qui changent directement la réponse doivent rester visibles. Les limites de moteur, structure de corpus et gouvernance documentaire doivent rester accessibles pour l'audit, mais ne doivent pas remplacer l'explication scientifique principale.

## Evidence and provenance rendering

Le modèle produit conserve :

- `sourceRefs` par assertion ;
- EvidenceLinks assertion–source–relation–localisateur ;
- sources, révisions et localisateurs ;
- providers, versions et representation digests ;
- Knowledge result ref/digest et engine version.

Le rendu montre les assertions, puis une liste de sources et les versions des providers. Il ne montre pas les EvidenceLinks et ne relie pas visuellement une phrase synthétique à ses preuves. La chaîne preuve–proposition exigée par PD-004 UX-32/33 reste donc reconstructible dans le modèle mais pas dans l'expérience utilisateur.

```text
UPSTREAM_EVIDENCE_PRESENT = YES
EVIDENCE_MODEL_PRESERVED = YES
PHRASE_LEVEL_EVIDENCE_RENDERING = NO
```

Les identifiants internes ne sont pas tous rendus comme champs, mais certains textes atomiques contiennent eux-mêmes des IDs, codes et JSON techniques. Cette exposition provient du rendu non transformé des unités Knowledge, pas d'une perte de provenance.

## Partial-coverage behavior

Pour Case B, la couverture `PARTIAL` déclenche automatiquement un fallback générique. La projection ne distingue pas, dans sa réponse principale, ce qui est directement soutenu, ce qui ne l'est que partiellement et ce qui manque pour comparer. Pourtant, ces états existent dans `coverageMap`, `comparison`, `limitations` et `gaps`.

Pour Case A, `PROVIDER_NOT_APPLICABLE` est correctement distinct de `NO_PROVIDER` et `NO_MATCH`. Le libellé « Contexte non applicable » est néanmoins trop absolu lorsque la branche est « incompatible ou insuffisamment documentée » et que des contextes critiques manquent.

Le comportement futur minimal doit dériver une disposition lisible des statuts existants, sans créer de faux résultat : réponse partielle si un sous-ensemble applicable répond réellement ; insuffisance comparative si les branches existent sans lien direct ; inapplicabilité si le contexte dur est incompatible ; absence de connaissance seulement si les conditions d'absence honnête sont remplies.

## First divergent stage

```text
UserRequest
  ↓
ProductEntryRoutingDecision(UNDERSTAND)                    PASS
  ↓
KnowledgeRequest(COMPARE)                                 PASS
  ↓
KnowledgeResult + RuntimeKnowledgeSynthesis               PRESENT / PARTIAL COMPOSITION
  ↓
projectUnderstandResult                                   FIRST DIVERGENCE
  ├─ answer = generic PARTIAL fallback
  ├─ synthesis conclusions/convergences/divergences unused
  └─ comparison/support items calculated but not made primary
  ↓
knowledgePresentation                                     SECONDARY AMPLIFIER
  └─ 46 atomic items copied
  ↓
ProductUnderstandResponse                                 SECONDARY AMPLIFIER
  ├─ comparison/support items/implications/evidence ignored
  └─ 46 items rendered under first detail level
```

```text
FIRST_DIVERGENT_STAGE_FOR_USER_FACING_SYNTHESIS =
UNDERSTAND_CONVERSATION_KNOWLEDGE_PROJECTION_COMPOSITION
```

## Root cause

Cause primaire :

`CONVERSATION_KNOWLEDGE_PROJECTION_IS_PARTIAL_AND_DOES_NOT_COMPOSE_THE_GOVERNED_SYNTHESIS_INTO_A_QUESTION_SHAPED_ANSWER`

Facteurs secondaires :

1. la `RuntimeKnowledgeSynthesis` implémentée conserve les unités mais compose peu leur sens comparatif ;
2. la projection de réponse n'utilise pas ses conclusions/convergences/divergences ;
3. les structures `comparison`, `supportedItems` et `methodologicalImplications` existent mais ne sont pas rendues ;
4. les EvidenceLinks restent invisibles ;
5. le retrieval P4R est `ANY_MATCH` par concept et RB-004 retourne ses blocs contrôlés en bloc ;
6. aucun ranking relationnel n'ordonne les 46 unités ;
7. le Document Engine normativement owner de la projection conversationnelle n'est pas raccordé à ce parcours.

### Microcopy résiduelle

L'ancienne phrase observée est une entrée conversationnelle `localStorage` historique, pas la microcopy initiale active du bundle 01D et pas un effet d'hydration React :

- clé persistée : `noxia-protocol-designer-functional-reset-v3` ;
- ancienne valeur historique réelle : deux phrases ;
- valeur active : copie intent-first ;
- migration actuelle : ne remplace que l'exacte première phrase courte `LEGACY_PROJECT_FIRST_NOXIA_MESSAGE` ;
- la valeur historique à deux phrases ne correspond donc pas au test d'égalité et survit au chargement.

```text
RESIDUAL_MICROCOPY_CLASSIFICATION = PERSISTED_LOCALSTORAGE_LEGACY_ENTRY
RESIDUAL_MICROCOPY_MIGRATION = INCOMPLETE_EXACT_MATCH
MICROCOPY_CAUSAL_TO_SYNTHESIS_DEFECT = NO
```

Ce finding est secondaire et n'est pas corrigé dans 01F.

## What is not defective

| Composant | Constat borné |
| --- | --- |
| Domain Gate | Case A/B admis correctement ; aucun nouveau défaut démontré |
| Router | rend `UNDERSTAND` ; termes/exclusions préservés |
| Project | aucun Project créé ou muté sous `UNDERSTAND` |
| QRY | ne détourne plus le tour et reste inchangé ; non impliqué ici |
| Knowledge identity/provenance | result ref/digest, versions, sources et liens conservés |
| Scientific Thinking | non appelé et non nécessaire pour la composition Knowledge Case B |
| Imaging | non appelé |
| REG | non appelé |
| VAL | non appelé |
| DOC project/protocol projections | non appelées et non responsables du contenu observé |
| Editorial Engine | non mobilisé ; aucune intégration décidée par KE-001 |

Le Document Engine est l'owner normatif de la projection conversationnelle. Son absence de raccord/capacité générale est une dette d'implémentation, mais aucun défaut de ses projections Project/Protocol existantes n'est démontré.

## Minimal future repair surface

Mission future bornée proposée, sans l'exécuter ici :

1. renforcer sous Knowledge la composition scientifique structurée de `RuntimeKnowledgeSynthesis`, sans narration libre ni mutation du corpus ;
2. implémenter/raccorder ensuite la `Conversation Knowledge Projection` sous la responsabilité Document déjà définie par KE-001, sans lui transférer l'ownership de la synthèse scientifique ;
3. consommer le `KnowledgeResult` et sa synthèse immuables, sans recomputation scientifique ni mutation ;
4. produire une projection déterministe question-shaped : objet, conclusion bornée, différences, conditions, limites, gaps et sources principales ;
5. exiger des support refs/localisateurs pour chaque proposition scientifique rendue ;
6. utiliser `comparison`, `supportedItems`, `methodologicalImplications` et EvidenceLinks déjà présents ;
7. réserver les assertions atomiques, IDs, versions et limites de corpus au niveau Expert ;
8. traiter séparément la migration de microcopy legacy ;
9. mesurer le bruit résiduel avant toute modification du retrieval/ranking.

Fichiers actuellement au premier plan du défaut :

- `src/features/knowledge-engine/understand-projection.ts` ;
- `src/features/protocol-designer/functional-reset/product-entry-routing.ts` ;
- `src/features/protocol-designer/functional-reset/ProductUnderstandResponse.tsx` ;
- future frontière Document existante à utiliser, sans nouvel owner.

Ne sont pas justifiés par 01F : modification de corpus, enrichissement scientifique, ajout de ST, appel LLM, nouveau moteur, nouvelle orchestration, changement Project/QRY, TRACE produit ou Wave 2.

## Remaining unknowns

- la complétude scientifique du corpus ECV IRM/CT n'est pas évaluée ;
- la meilleure sélection ou hiérarchie scientifique des 46 éléments n'est pas adjudicable sans cadre humain/PD-011 ;
- aucune mesure utilisateur ne quantifie encore l'amélioration attendue d'une projection synthétique ;
- le comportement d'un futur validateur phrase–assertion–source n'est pas implémenté ;
- l'opportunité d'un LLM de réalisation linguistique reste une décision future et non nécessaire au correctif minimal ;
- le corridor Product n'ajoute pas les événements `UNDERSTAND` à la Scientific Execution Trace ; seules des `bridgeTraces` locales retiennent result ref/digest.

```text
PRODUCT_TRACE_INTEGRATION = ABSENT
SCIENTIFIC_PASS = NO
WAVE_2_AUTHORIZED = NO
```

## Git

- branche de travail : `protocol-designer-canonical-ingestion` ;
- HEAD initial : `312b4b9c45de57ed3a6339dcc703f79955fbc36c` ;
- `origin/protocol-designer-canonical-ingestion` : `312b4b9c45de57ed3a6339dcc703f79955fbc36c` ;
- `origin/main` : `312b4b9c45de57ed3a6339dcc703f79955fbc36c` ;
- référence locale `main` : `9be06edca1a7500ab7a43d065e94241e91d67bec`, non checkoutée et non modifiée ;
- code/runtime modifié : `NO` ;
- seul nouvel artefact : le présent rapport ;
- commit : `NO` ;
- push : `NO` ;
- merge : `NO` ;
- déploiement : `NO` ;
- artefacts historiques non suivis : préservés.

## Cost

Méthodes : inspection statique, autorités et rapports locaux, historique Git local, deux readbacks déterministes locaux Case A/B et tests ciblés existants. Les deux fichiers ciblés passent : `2/2` fichiers, `27/27` tests (`14` Knowledge Engine et `13` parcours Product 01D). Le test de transition emploie un provider mocké et comptabilise une invocation simulée dans sa trace ; aucun provider externe n'a été contacté. Le contrôle d'espaces Git ne relève aucune erreur et le scan ciblé ne trouve aucun motif de secret. Aucun navigateur live, réseau, benchmark ou campagne.

```text
EXTERNAL_LLM_API_CALLS = 0
OPENAI_API_CALLS = 0
CHATGPT_API_CALLS = 0
GEMINI_CALLS = 0
OTHER_LLM_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
NEW_SCIENTIFIC_CAMPAIGNS = 0
NEW_BENCHMARKS = 0
BROAD_REPLAYS = 0
CODE_REPAIRS = 0
```

```text
FINAL_DECISION = UNDERSTAND_SYNTHESIS_ROOT_CAUSE_IDENTIFIED
AUTHORITY_RECONCILIATION_DECISION = UNDERSTAND_SYNTHESIS_OWNERSHIP_RECONCILED
```
