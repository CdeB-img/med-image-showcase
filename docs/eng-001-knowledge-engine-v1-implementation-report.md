# ENG-001 — NOXIA Knowledge Engine V1

## Implementation report

- Date de clôture locale : 2026-08-09
- Dépôt : `noxia-dev`
- Version runtime : `1.0.0`
- Périmètre activé : parcours `UNDERSTAND` du Protocol Designer
- Nature : implémentation technique probatoire, non normative

## 1. Décision

`KNOWLEDGE_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`

La V1 exécutable demandée est implémentée : une question scientifique bornée est convertie en `KnowledgeRequest`, résolue, planifiée, interrogée contre les fournisseurs locaux déclarés, filtrée par applicabilité, synthétisée et restituée sous forme de `KnowledgeResult` traçable. Les critères bloquants ENG-001 sont couverts par les tests dédiés et par les scénarios navigateur. Les limites restantes concernent l’étendue documentaire et opérationnelle de cette V1, pas une substitution silencieuse, une invention scientifique, une dépendance scientifique au LLM ou un build cassé.

Cette décision n’est ni un PASS PD-011, ni une validation scientifique globale, ni l’admission d’un corpus, ni une autorisation clinique.

## 2. Autorités consultées

La consultation a commencé par la lecture intégrale de `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` v1.25, utilisée comme routeur documentaire et non comme autorité scientifique. Les documents ont ensuite été consultés dans l’ordre imposé :

1. Charte fondatrice ;
2. Scientific Product Manifesto ;
3. Product Specification ;
4. PD-003, PD-004, PD-005, PD-007, PD-009, PD-011, PD-012 et PD-013 ;
5. Scientific Territory Model ;
6. Scientific Knowledge Catalog ;
7. Scientific Assertion Layer ;
8. Scientific Knowledge Graph ;
9. RDE-001 v1.1, RDE-002 v1.1 et RDE-003 v1.1 ;
10. KE-001 v1.0 ;
11. ENG-001A ;
12. RB-003, RB-004 et RB-005, à partir de leurs sources maîtresses ;
13. corpus P4, P4R et P5 réellement présents ;
14. manifeste de l’Editorial Engine, uniquement pour préserver la frontière de compilation documentaire.

Séparation appliquée : les principes établis et références normatives gouvernent les contrats ; les corpus scientifiques fournissent les contenus ; la cible ENG-001 est une V1 locale ; l’état réellement implémenté est décrit dans ce rapport ; les fonctions futures restent des hypothèses ou suites, jamais des faits présents.

## 3. Baseline Git

- Branche : `main`.
- HEAD initial : `dfde79f4bdce6fb2c3ed1abff84658d32168e3b8`.
- Worktree initial non propre et préservé : index modifié ; ENG-001A, KE-001 et RDE-001/002/003 non suivis.
- Aucun nettoyage, écrasement, commit, push ou déploiement.
- L’énumération générale des processus n’était pas autorisée dans le bac à sable ; aucune conclusion non prouvée n’est formulée sur des processus externes.

Empreintes protégées relevées avant l’implémentation et retrouvées identiques après celle-ci :

| Autorité protégée | SHA-256 |
|---|---|
| SOURCE-OF-TRUTH-INDEX | `19dd00e4cb0c1c96438f86d259fa93e4477abe80bf08a26b86075a376f65d337` |
| RDE-001 | `00c793961432d2e808e8fbedbcee1739e795a2cd63167e0ff0ce873e784355ec` |
| RDE-002 | `7da98a5943bc769407f020affe34bb100bd6b9d6f3c89f9a9c735321311f16c6` |
| RDE-003 | `f980ee46b5a1d68562aaf6186de583fc62274f6141c28680fa12d3949d8728f9` |
| KE-001 | `39195a039db713012bf4497e79d917869ce8cea09aa71db63cdfb451d4ed068f` |
| ENG-001A | `b1587740d6c712e5918902bf7bbe310e32345d46d78738c643eaba0b60dd1804` |

Baseline technique avant modification : typecheck conforme ; lint conforme avec sept avertissements préexistants ; 148 tests Protocol Designer conformes ; build de production conforme.

## 4. Architecture réellement implémentée

Le moteur est isolé sous `src/features/knowledge-engine/`. Il comprend treize composants contractuels séparés, un orchestrateur court, quatre familles d’adapters, une projection `UNDERSTAND`, une politique LLM centralisée et une minimisation de confidentialité. Il n’est pas concentré dans React.

Flux runtime :

`KnowledgeRequest` → `KnowledgeContextPackage` → `ConceptResolver` → `QueryPlanner` → `ProviderRegistry`/`CorpusAdapter` → retrieval → applicability → assertion resolution → conflicts/gaps → structured synthesis → `KnowledgeResult` + `KnowledgeTrace` → projection `UNDERSTAND`.

Les digests reposent sur une canonicalisation locale stable. Une compatibilité SHA-256 synchrone et sans dépendance a été ajoutée au bundle navigateur, car les représentations scientifiques existantes calculent leurs identifiants par une API Node. Son identité binaire est testée sur un vecteur SHA-256 de référence ; aucun corpus ni identifiant n’a été modifié.

## 5. Contrats KE-001 couverts

| Contract | Implémenté ? | Test-preuve | Limite | Suite nécessaire |
|---|---:|---|---|---|
| KnowledgeRequest | Oui | `contracts.test.ts` | Entrée V1 limitée à `UNDERSTAND` et aux tests | Étendre aux handoffs futurs sans changer le schéma normatif |
| KnowledgeContextPackage | Oui | `contracts.test.ts`, `reasoning.test.ts` | Projection des champs disponibles ; décisions/contraintes durables non raccordées | Raccorder les objets PD-003 lorsque disponibles |
| Context relaxation | Oui | `contracts.test.ts` | R1/R2 explicites ; aucune UI de relaxation | Ajouter une décision humaine versionnée avant exposition produit |
| KnowledgeProviderRegistry | Oui | `contracts.test.ts` | Providers locaux uniquement | Ajouter un provider seulement après admission réelle |
| CorpusAdapter | Oui | `adapters.test.ts` | Quatre familles concrètes ; pas de découverte externe | Ajouter des adapters, pas des exceptions au moteur |
| ConceptResolver | Oui, borné | `reasoning.test.ts`, `mandatory-cases.test.ts` | Dictionnaire local limité | Gouverner les aliases supplémentaires |
| QueryPlanner | Oui | `reasoning.test.ts`, `mandatory-cases.test.ts` | Exact-first ; aucun élargissement implicite | Implémenter des branches de relaxation seulement sur décision tracée |
| Retrieval / Coverage | Oui | `reasoning.test.ts` | Local synchrone ; pas de timeout réseau réel | Ajouter les états distants lors d’un provider externe admis |
| ApplicabilityEvaluator | Oui, V1 | `reasoning.test.ts`, `mandatory-cases.test.ts`, `understand-ui.test.tsx` | Profondeur bornée aux dimensions représentées et aux filtres disponibles | Étendre les comparateurs par domaine sans score compensatoire |
| AssertionResolver | Oui | `reasoning.test.ts`, `adapters.test.ts` | Projection runtime ; pas d’écriture canonique | Conserver cette frontière pour tout nouveau corpus |
| ConflictAndGapAnalyzer | Oui | `reasoning.test.ts`, `mandatory-cases.test.ts` | Contradictions déclarées et polarités exactes ; pas d’arbitrage humain | Raccorder les décisions et reprises PD-009 |
| KnowledgeSynthesizer | Oui | `reasoning.test.ts`, `contracts.test.ts` | Structure déterministe ; narration LLM non activée | Évaluer toute narration séparément |
| KnowledgeResult | Oui | `contracts.test.ts`, `understand-ui.test.tsx` | Runtime local, non persisté comme objet métier durable | Ajouter stockage/replay seulement dans une mission autorisée |
| KnowledgeTrace | Oui | `contracts.test.ts` | Trace en mémoire, sans observabilité durable | Définir la persistance et la rétention avant industrialisation |
| LLM boundary | Oui | `contracts.test.ts` | Aucun LLM dans le raisonnement scientifique V1 | Test manuel désactivé si une narration LLM est ensuite ajoutée |
| Privacy minimization / Domain Gate | Oui | `contracts.test.ts`, `mandatory-cases.test.ts`, `understand-ui.test.tsx` | Détection locale bornée, pas un DLP général | Audit privacy dédié avant traitement de projets confidentiels |
| Projection `UNDERSTAND` fidèle au résultat | Oui | `understand-ui.test.tsx` + navigateur | Projection déterministe intégrée, pas un Document Engine autonome | Extraire vers le Document Engine lorsque celui-ci existe réellement |

## 6. Contrats non implémentés

Les extensions suivantes de KE-001 ne sont pas revendiquées par ENG-001 V1 : recherche bibliographique externe ; provider distant ; cache persistant ; reprise durable/replay distribué ; file de travail expert ; événement durable `KnowledgeResultAvailable` vers PD-009 ; handoff Imaging Engine ; Document Engine autonome ; persistance d’un objet métier Knowledge ; couverture de décisions et contraintes de projet non disponibles dans l’intake ; campagne d’évaluation PD-011 ; validation scientifique humaine.

Ces absences sont explicites. Elles n’ont pas été remplacées par un mécanisme voisin.

## 7. Providers réellement disponibles

Le registre contient exactement six providers disponibles et triés :

| Provider | Type | Contenu réel | Limite principale |
|---|---|---|---|
| `knowledge-graph` | Knowledge Graph | 118 entités, 93 relations | zéro assertion dans la couche générique ; aucune relation promue en science |
| `p4r-ecv-t1` | corpus structuré | assertions ECV/T1 consolidées, preuves et sources | domaine ECV/T1 seulement ; pas de review humaine revendiquée |
| `p5-multidomain` | corpus structuré | 97 assertions sur quatre domaines | quatre domaines déclarés seulement |
| `rb-003` | Reasoning Book | projection documentaire CT spectral | blocs documentaires, non assertions atomiques |
| `rb-004` | Reasoning Book | projection documentaire IRM cardiaque | ne couvre jamais la branche CT par substitution |
| `rb-005` | Reasoning Book | projection documentaire neuro-perfusion/métabolisme | blocs documentaires, non assertions atomiques |

La Scientific Assertion Layer générique, qui contient zéro assertion, reste un diagnostic du provider Knowledge Graph et n’est pas enregistrée comme provider scientifique positif. Aucun provider fictif n’existe.

## 8. Adapters

- `P4RAdapter` : normalise assertions, preuves, sources, statuts documentaires et contradictions P4R ; exclut les révisions de source `SUPERSEDED` et `RETRACTED` ; conserve `CORRECTED`.
- `P5Adapter` : normalise les 97 assertions et leurs preuves dans les quatre domaines réellement présents.
- `ReasoningBookAdapter` : expose les projections contrôlées déjà utilisées par le démonstrateur comme `GOVERNED_DOCUMENTARY`, jamais comme assertion atomique.
- `KnowledgeGraphAdapter` : résout entités et relations exactes, mais retourne zéro assertion scientifique et le signale.

Tous les adapters retournent une représentation normalisée, leurs diagnostics, limites, version et digest. Ils ne modifient aucun corpus.

## 9. Concept resolution

Le résolveur est un dictionnaire déterministe borné. Il conserve les concepts exacts, inconnus et relations gouvernées. Il distingue notamment T1 mapping et ECV ; conserve no-reflow et MVO comme relation contextuelle, non synonymie universelle ; conserve CT comme domaine plus large que CT spectral ; préserve séparément IRM, CT et PET dans une comparaison.

Les termes inconnus restent dans `unresolvedConcepts`. Aucun LLM ne crée un alias ou une relation engageante.

## 10. Query planning

Chaque plan contient la référence de requête et de contexte, le snapshot du registre, les concepts résolus/non résolus, les branches, les inclusions et exclusions de providers avec justification, l’ordre stable, les filtres durs, les règles de relaxation, les conditions d’arrêt et le Domain Gate.

Sémantique : `EXACT_FIRST_NO_IMPLICIT_FALLBACK`. Une modalité seule ne suffit pas à sélectionner un corpus thématique voisin.

## 11. Coverage

Les états runtime implémentés sont : `NO_PROVIDER`, `PROVIDER_NOT_APPLICABLE`, `NO_MATCH`, `PARTIAL`, `SUPPORTED`, `CONFLICTING`, `SOURCE_UNAVAILABLE` et `COVERAGE_UNKNOWN` dans le contrat. Le calcul distingue provider absent, non applicable, sans correspondance, partiel, supporté, contradictoire et en échec. Une panne d’adapter n’est pas convertie en absence scientifique.

## 12. Applicability

La V1 applique les modalités et les contextes structurés réellement représentés ; les concepts scientifiques exacts bornent les assertions recherchées ; les interventions explicites non documentées restent `UNKNOWN_APPLICABILITY` ; les incompatibilités deviennent `OUT_OF_VALIDITY_DOMAIN`. Les assertions exclues restent visibles dans le `KnowledgeResult` mais ne sont pas promues.

La validation navigateur a détecté puis fait corriger une perte de modalité : les champs vides de l’intake local ne remplacent plus une modalité écrite dans la question. Une question IRM T1/ECV ne reçoit plus d’assertion CT‑ECV.

## 13. Assertions

La projection runtime préserve `stableId`, révision, provider, statut, contenu atomique, concepts, modalité, contexte, polarité, relations de preuve, limites, statut de review, localisateur et applicabilité. Les candidats restent séparés des effectifs. Les représentations canoniques sources ne sont ni écrasées ni enrichies.

## 14. Contradictions et gaps

Les positions incompatibles restent séparées. La divergence P4R sur l’hématocrite synthétique est exposée comme différence contextuelle et génère `CONFLICT_UNRESOLVED`. Les gaps couvrent notamment absence de provider, absence de correspondance, provider inapplicable, panne, contexte critique manquant, comparaison directe absente, hors domaine et confidentialité patient.

Aucune phrase moyenne ne fusionne les conclusions divergentes.

## 15. Synthesis

`RuntimeKnowledgeSynthesis` est construit uniquement à partir des assertions applicables, blocs documentaires, preuves, conflits, gaps et limites normalisés. Son digest est déterministe. Le LLM n’en choisit aucune conclusion, source, controverse ou implication méthodologique.

## 16. KnowledgeResult

Le résultat contient la requête, le plan, le snapshot du registre, les versions providers, statuts runtime et de couverture, concepts, assertions applicables/exclues/candidates, blocs documentaires, sources, evidence, matrice d’applicabilité, synthèse, controverses, gaps, limites, provenance, fraîcheur, indications consommateur, besoins de review humaine, exécutions providers et trace.

Le digest logique exclut l’ordre d’arrivée et l’horodatage d’exécution. Même entrée, mêmes versions et mêmes corpus produisent le même résultat structuré.

## 17. LLM boundary

La politique centrale classe les opérations `DETERMINISTIC`, `LLM_ALLOWED`, `LLM_PROPOSAL_ONLY`, `HUMAN_REQUIRED` ou `FORBIDDEN`. Sélection de provider, applicabilité, assertion, synthèse scientifique et choix du « meilleur » biomarqueur ne dépendent pas du LLM. Gemini reste limité à l’intake linguistique existant ; son indisponibilité ouvre un mode local explicite et ne modifie pas le raisonnement Knowledge.

## 18. Confidentialité

La minimisation retire question originale, identifiant projet, identifiants patient et document complet de toute charge externe hypothétique. ENG-001 ne réalise aucun appel externe. Une expression patient est refusée localement avant l’intake, n’est pas persistée et ne reçoit aucune interprétation individuelle. NumPy/DICOM technique est arrêté par le Domain Gate sans réponse médicale détournée.

## 19. Huit cas ENG-001A

| Cas | Résultat prouvé |
|---|---|
| IRM vs CT — fibrose myocardique | deux branches conservées ; `PARTIAL` ; gap de comparaison directe ; RB-004 ne remplace pas CT |
| No-reflow après stenting/reperfusion | terme et timing conservés ; aucune assertion applicable ; gaps explicites |
| T1 Mapping vs ECV | objets distincts ; P4R interrogé ; aucune synonymie ; aucune assertion CT dans une branche IRM seule |
| Fourier en IRM | `NO_PROVIDER` ; aucune assertion, source ou substitution |
| NumPy dans pipeline DICOM | `OUT_OF_DOMAIN` ; aucune réponse technique générale depuis le corpus médical |
| « J’ai un T2 élevé. » | `PRIVACY_BLOCKED` ; aucune interprétation individuelle ; aucune persistance de session |
| « Quel est le meilleur biomarqueur ? » | `CLARIFICATION_REQUIRED` ; aucune sélection ; intervention humaine requise |
| PET vs IRM, maladie non couverte | deux modalités conservées ; aucun provider proche ; provenance vide |

## 20. Tests

Cinq fichiers ENG-001 couvrent séparément les contrats, adapters, raisonnement, huit cas obligatoires et projection `UNDERSTAND`. Ils testent aussi ordre stable, provider absent, corpus vide, contexte incompatible et partiel, contradiction, source corrigée/rétractée représentable, candidat non promu, indépendance au LLM, confidentialité, absence de fallback et reproductibilité.

Les tests n’effectuent aucun appel réseau.

## 21. Résultats

| Validation | Résultat |
|---|---|
| Typecheck | conforme |
| Lint | conforme, 0 erreur ; 7 avertissements préexistants Fast Refresh |
| Tests Knowledge | 5 fichiers, 37/37 conformes |
| Tests Protocol Designer | 7 fichiers, 148/148 conformes |
| Build production | conforme |
| Audit SEO | 40 pages ; 0 erreur ; 0 avertissement ; rapport généré remis à son état antérieur |
| `validate:knowledge-graph` | conforme ; 118 entités, 93 relations, 0 assertion générique |
| `validate:scientific-assertions` | conforme ; corpus réel P4 valide |
| `git diff --check` | conforme |
| Suite globale | 681/684 conformes ; 3 échecs exclusivement causés par le dépôt externe `editorial-engine` déjà modifié |
| Validateurs corpus/multidomain/catalog | sous-couches scientifiques conformes ; gate globale non conforme car elle exige un Editorial Engine externe propre et/ou aucune modification de page publique |

Tests navigateur réels :

- question couverte T1/ECV : `SUPPORTED`, contenu IRM contextualisé, sources et localisateurs, aucune fuite CT ;
- comparaison IRM/CT : `PARTIAL`, deux branches et gap direct ;
- Fourier : arrêt `NO_PROVIDER` honnête ;
- hématocrite synthétique : divergence visible et non résolue ;
- T2 individuel : refus local et absence de source ;
- passage de `DESIGN_STUDY` proposé à `UNDERSTAND` : question et objets conservés ;
- réinitialisation : dialogue explicite et nettoyage de l’état de secours ;
- 375×812 et 1440×900 : largeur du document égale à la largeur de viewport, sans débordement horizontal.

La navigation clavier est couverte par la suite P-WEB ; le pilote du navigateur intégré n’a pas déplacé le focus lors de l’injection de `Tab`, donc une preuve manuelle complète de bout en bout n’est pas revendiquée. L’interface globale expose actuellement une palette sombre identique pour `:root` et `.dark` : les tokens du composant sont compatibles, mais un rendu clair distinct n’est pas disponible à inspecter dans ce produit.

## 22. Limites

1. Les Reasoning Books sont consommés par leurs projections contrôlées de démonstration, pas par un parseur runtime intégral des DOCX ; ils restent `DEMO_PROJECTION_ONLY` et `GOVERNED_DOCUMENTARY`.
2. Le résolveur de concepts est volontairement borné et local.
3. Il n’existe ni découverte bibliographique externe, ni cache persistant, ni replay durable, ni orchestration distribuée.
4. La trace est runtime et non un journal métier persistant.
5. Les contextes décisionnels PD-003 non exposés par l’intake ne sont pas injectés artificiellement.
6. La projection `UNDERSTAND` est déterministe dans le Protocol Designer, pas encore possédée par un Document Engine autonome.
7. Aucun expert humain, seuil d’évaluation ou PASS PD-011 n’est revendiqué.
8. La vérification visuelle claire et la tabulation manuelle complète restent à exécuter lorsqu’une palette claire réelle et un pilote clavier fonctionnel existent.
9. Les gates scientifiques globales restent sensibles à l’état du dépôt externe Editorial Engine ; cet état n’a pas été modifié par ENG-001.

## 23. Fichiers modifiés

Créés pour ENG-001 :

- 32 fichiers sous `src/features/knowledge-engine/`, dont les composants, adapters et cinq fichiers de tests ;
- `docs/eng-001-knowledge-engine-v1-implementation-report.md`.

Modifiés pour ENG-001 :

- `src/pages/ProtocolDesignerDemo.tsx` : raccord `UNDERSTAND`, refus patient local, contexte et reset ;
- `package.json` : script `test:knowledge` ;
- `vite.config.ts` : compatibilité locale `node:crypto` pour le bundle scientifique existant.

Non modifiés par ENG-001 : index, RDE, KE-001, ENG-001A, Reasoning Books, Scientific Programs, Territory Model, Knowledge Graph scientifique, Assertion Layer et corpus.

## 24. Non-régressions

Préservés : Domain Gate, Guided Intake, décisions humaines, contexte de session, confidentialité, responsive, surfaces d’accessibilité, styles d’impression, SEO, frontière Gemini, absence de conseil clinique, absence de protocole inventé et absence de PASS PD-011. Les parcours `FORMALIZE_IDEA` et `DESIGN_STUDY` n’utilisent pas le moteur complet ; seule une transition explicite vers `UNDERSTAND` a été validée.

Le rapport SEO horodaté produit par l’audit a été restauré à son contenu initial. Aucune mutation incidente de l’Editorial Engine externe n’a été effectuée.

## 25. Décision de suite

La suite recevable est une mission distincte et gouvernée : enrichir les adapters ou concepts uniquement après admission de contenus réels ; définir la persistance/reprise ; raccorder PD-009 et le Document Engine ; puis conduire une campagne PD-011. Aucune de ces suites n’est implicitement autorisée par ENG-001.

Décision ENG-001 : `KNOWLEDGE_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`.
