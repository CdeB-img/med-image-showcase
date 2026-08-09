# ENG-003 — NOXIA Knowledge Engine V1.2 — External Evidence Search

Date de clôture : 2026-08-09

Nature : rapport d’implémentation et de validation, non normatif

Périmètre : recherche PubMed externe gouvernée, exclusivement runtime
Décision ENG-002 vérifiée : `KNOWLEDGE_ENGINE_V1_1_CONSOLIDATED_WITH_LIMITATIONS`

## 1. Décision

ENG-003 est implémenté avec des limitations non bloquantes explicites. Le moteur sait désormais partir d’un gap interne, décider si une recherche externe est autorisée, construire une requête PubMed déterministe, récupérer et qualifier des sources candidates, puis les joindre au `KnowledgeResult` sans modifier la synthèse interne ni aucun corpus officiel.

La décision ne constitue ni un PASS PD-011, ni une validation scientifique des publications trouvées, ni une admission dans le Scientific Assertion Layer, le Knowledge Graph, un Reasoning Book ou un Scientific Program.

Décision retenue : `EXTERNAL_EVIDENCE_SEARCH_V1_IMPLEMENTED_WITH_LIMITATIONS`.

## 2. Autorités

La mission a été qualifiée comme une implémentation produit bornée du Knowledge Engine, et non comme une mission de production scientifique ou de gouvernance documentaire.

L’ordre de consultation imposé a été respecté : SOURCE-OF-TRUTH-INDEX intégral, Charte fondatrice, Scientific Product Manifesto, Product Specification, PD-003, PD-004, PD-005, PD-007, PD-009, PD-011, PD-012, PD-013, Scientific Knowledge Catalog, Scientific Assertion Layer, Scientific Knowledge Graph, RDE-001, RDE-002, RDE-003, KE-001, ENG-001A, ENG-001 et ENG-002. Les contrats de provenance existants et, en lecture seule, le manifeste ainsi que la matrice de traçabilité de l’Editorial Engine ont également été consultés.

Séparation appliquée :

- principes établis : Charte fondatrice et Scientific Product Manifesto ;
- références normatives : PD, RDE et KE-001 ;
- corpus scientifiques : Scientific Knowledge Catalog, Scientific Assertion Layer, Scientific Knowledge Graph et providers internes existants ;
- cible : capacité ENG-003 décrite dans l’instruction de mission ;
- état réellement implémenté : modules TypeScript V1.2, interface UNDERSTAND, fixtures et essai réseau manuel décrits ci-dessous ;
- hypothèses : disponibilité future de PubMed, stabilité contractuelle des E-utilities et capacité du navigateur public à effectuer l’appel CORS ; aucune de ces hypothèses n’est convertie en fait scientifique.

Aucune contradiction n’a été résolue silencieusement. Deux divergences d’environnement sont conservées : le dépôt Editorial Engine est sale hors mission ; l’environnement du navigateur intégré refuse l’appel externe alors que l’essai réseau manuel et l’en-tête CORS officiel réussissent.

Contrôle d’intégrité final : les empreintes SHA-256 du SOURCE-OF-TRUTH-INDEX, de RDE-001/002/003, KE-001, ENG-001A/001/002, PD-003/004/005/007/009/011/012/013, du Scientific Assertion Layer et du Scientific Knowledge Graph sont identiques à la baseline. Le SOURCE-OF-TRUTH-INDEX reste à l’empreinte `19dd00e4cb0c1c96438f86d259fa93e4477abe80bf08a26b86075a376f65d337`.

## 3. Baseline Git

- dépôt : `/Users/charles/Documents/Projets/NOXIA/noxia-dev` ;
- branche : `main` ;
- HEAD initial et final : `49ecfcf385735e08b00cd9970070f1deed4ae391` ;
- état initial : propre ;
- aucun commit, push ou déploiement ;
- dépôt externe Editorial Engine contrôlé en lecture seule : HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, déjà sale avant ENG-003 et inchangé par la mission.

## 4. Architecture modifiée

Le pipeline ajouté reste une extension bornée du Knowledge Engine existant :

`Knowledge Gap → External Search Decision → External Query Plan → PubMed Provider → Candidate Sources → Identity/Revision → Eligibility → Retrieval → Extraction → Evidence Qualification → Applicability → Candidate Assertions → Mixed Runtime Synthesis → KnowledgeResult`

Le résultat interne est construit avant toute décision externe. L’extension ne crée ni moteur web général, ni nouvelle autorité, ni chaîne d’admission scientifique. Le contrat `KnowledgeResult` V1.2 comporte un champ externe séparé et nullable ; `sources`, `synthesis`, conclusions et provenance internes ne sont pas réécrits.

Les états normatifs KE-001 sont matérialisés par leurs noms déjà admis : `INTERNAL_ONLY`, `EXTERNAL_ALLOWED`, `EXTERNAL_REQUIRED`, `EXTERNAL_FORBIDDEN`. L’interface n’autorise la recherche à la demande que pour un gap visible, un domaine autorisé et une sensibilité `PUBLIC`.

## 5. Providers externes

Un seul provider est activé : `pubmed-ncbi`, adossé à PubMed et aux NCBI E-utilities.

Son contrat expose l’autorité, les capacités de découverte/métadonnées/abstract/résolution d’identité, les filtres, la pagination, les limites de débit, les identités PMID/DOI/PMCID, la révision, les localisateurs, la disponibilité d’abstract et de lien PMCID, les limitations et la frontière de confidentialité. Il ne possède aucune capacité de création d’assertion officielle.

Crossref n’a pas été ajouté : PubMed fournit les DOI nécessaires à la résolution bibliographique de cette V1.2 et un second provider n’aurait pas apporté de capacité obligatoire distincte. Google Scholar, Semantic Scholar, ResearchGate, les moteurs commerciaux et la recherche web générale restent exclus.

Contrats techniques consultés : [NCBI E-utilities — usage et paramètres](https://www.ncbi.nlm.nih.gov/books/NBK25497/?report=printable) et [NCBI E-utilities — références ESearch/EFetch](https://www.ncbi.nlm.nih.gov/sites/books/NBK25499/pdf/Bookshelf_NBK25499.pdf).

## 6. Query planning

Le plan externe est dérivé du `KnowledgeResult` interne, donc de la `KnowledgeRequest`, des concepts résolus, du `Context Package`, des branches et des gaps. La sérialisation est déterministe et limitée à un dictionnaire de synonymes scientifiques gouvernés. L’ordre des concepts n’affecte pas la requête.

Le texte libre original, les inconnues non gouvernées, l’identité de projet, le site, l’équipement libre et les documents sont explicitement exclus. La requête réellement envoyée ne contient que les groupes `Title/Abstract`, les bornes de date éventuelles, la pagination et le tri.

Une exigence `FROM_YYYY-MM-DD` produit une fenêtre documentée allant de cette date à la date d’autorisation. Les filtres de population, langue ou contexte ne sont ajoutés que lorsqu’une représentation gouvernée existe ; la V1.2 ne transforme pas un texte libre inconnu en filtre externe.

Le plan conserve `queryPlanId`, révision, digest, requête exacte par branche, paramètres, filtres, concepts, relations documentaires, exclusions, contexte minimisé et champs redacted.

## 7. Source identity

Chaque notice PubMed candidate reçoit :

- une identité fondée sur le PMID, jamais sur le titre seul ;
- DOI et PMCID lorsqu’ils sont publiés dans la notice ;
- titre, auteurs, journal, année/date, langue et types de publication ;
- abstract structuré lorsqu’il est disponible ;
- liens de correction, erratum ou rétractation ;
- une révision dérivée du PMID, du DOI, du PMCID, de `DateRevised`, du statut documentaire et des relations associées.

La déduplication s’effectue d’abord par PMID, puis par DOI, en conservant les branches auxquelles la source appartenait.

## 8. Retrieval

La chaîne effectue `ESearch` en JSON puis `EFetch` PubMed en XML. Elle conserve l’ordre reçu, les identifiants retournés, la pagination et les empreintes des réponses.

Par défaut, une branche demande au plus six notices sur une page ; la recherche complète reste bornée à douze notices et deux pages au maximum lorsque l’appelant l’autorise. Une continuation non consommée produit un état partiel explicite, pas une prétention d’exhaustivité.

Le provider ne télécharge aucun texte intégral. Lorsqu’un PMCID existe, il fournit uniquement un lien PMC ; aucune extraction intégrale automatique n’est réalisée.

## 9. Eligibility

Les états documentaires sont séparés : `FULL_TEXT_ACCESSIBLE`, `ABSTRACT_ONLY`, `METADATA_ONLY`, `CORRECTED`, `RETRACTED`, `DUPLICATE`, `UNSUPPORTED_DOCUMENT_TYPE`, `INACCESSIBLE`.

Dans cette V1.2, `FULL_TEXT_ACCESSIBLE` signifie qu’un localisateur PMCID est disponible ; le texte intégral n’est ni téléchargé ni extrait. Les corrections doivent être résolues vers une notice courante avant extraction positive. Une source rétractée est conservée dans les exclusions et ne peut soutenir une assertion candidate positive.

Les éditoriaux, lettres, commentaires et actualités sont exclus lorsque leur type documentaire est le seul type déclaré. Une métadonnée seule peut rester une source candidate, mais ne produit aucune assertion.

## 10. Extraction

L’extraction V1.2 est entièrement déterministe, sans LLM. Elle n’utilise que la première phrase d’une section d’abstract explicitement marquée comme conclusion, bornée à 50 mots. Elle n’extrait rien du titre seul et ne complète jamais l’abstract avec une connaissance mémorisée.

Chaque extraction conserve l’identité et la révision de la source, le localisateur de section, le support exact, le claim identique au support, le contexte extrait ou `NOT_EXTRACTED`, les limites, la méthode, l’absence de modèle, une confiance technique et l’absence de niveau de preuve scientifique attribué.

## 11. Evidence qualification

Chaque assertion candidate reçoit une relation `CANDIDATE_EVIDENCE` localisée sur la conclusion d’abstract. Le type d’étude reprend uniquement les types de publication présents dans PubMed. Population et méthode restent `NOT_EXTRACTED` lorsqu’elles ne sont pas structurées par l’extracteur.

Aucune nouvelle échelle de preuve n’est créée. `scientificEvidenceLevel` reste `NOT_ASSIGNED`. La relation `SUPPORTS` signifie ici que le passage exact supporte le claim identique extrait ; elle ne signifie ni robustesse scientifique ni admission NOXIA.

## 12. Applicability

Les assertions candidates passent par l’`ApplicabilityEvaluator` existant. La recherche lexicale ne peut jamais produire à elle seule `APPLICABLE_EXACT`.

La V1.2 plafonne l’applicabilité externe à `PARTIALLY_APPLICABLE` ou `UNKNOWN_APPLICABILITY`, sauf incompatibilité ou contradiction de contexte déjà détectée. Toute dimension clinique ou technique critique non extraite maintient l’applicabilité inconnue.

## 13. Candidate assertions

Les assertions issues de PubMed ont le statut `ASSERTION_CANDIDATE` et l’origine `EXTERNAL_CANDIDATE`. Elles imposent une revue humaine, ne sont pas versées dans `candidateAssertions` internes et ne modifient aucune autorité scientifique.

Leur révision, support exact, source, limites et applicabilité sont conservés. Une source metadata-only, corrigée, rétractée, dupliquée ou non supportée ne produit aucune assertion candidate positive.

## 14. Synthesis

La synthèse mixte référence séparément les identifiants des conclusions internes, assertions candidates externes et sources externes. Elle ne fusionne aucun texte externe dans la réponse interne.

La V1.2 détecte une divergence documentaire uniquement lorsqu’un PMID ou DOI interne identique est signalé corrigé ou rétracté par la notice externe. Elle affiche alors le conflit d’identité sans modifier la conclusion. Elle ne prétend pas résoudre une contradiction scientifique sémantique.

## 15. Internal/external separation

Les origines sont explicites : `INTERNAL_OFFICIAL`, `INTERNAL_RUNTIME_DERIVED`, `EXTERNAL_CANDIDATE`, `USER_PROVIDED`, `LOCAL_PRACTICE`.

L’implémentation vérifie que :

- la recherche interne précède l’externe ;
- `sources` et `synthesis` internes restent byte-for-byte égaux après rattachement externe ;
- `corpusMutation` vaut toujours `false` ;
- la révision runtime du résultat est nouvelle et tracée ;
- une source externe ne rejoint ni provider interne, ni corpus, ni graphe, ni Reasoning Book.

## 16. Freshness

La décision prend en compte la couverture, les gaps, l’usage, la sensibilité et `freshnessRequirement`. Une connaissance interne suffisamment couverte n’est pas relancée sous `EXTERNAL_ALLOWED`. `EXTERNAL_REQUIRED` exige une autorisation `PD_009_POLICY` tracée.

Le résultat conserve la date de recherche, la date de publication la plus récente parmi les sources éligibles, les dates de correction/révision, la politique de fraîcheur et une recommandation bornée. Aucun seuil universel du type « six mois » n’est introduit.

## 17. Cache

Le cache local V1.2 inclut le provider, les requêtes par branche, filtres, paramètres, digest de contexte et politique de fraîcheur. Il conserve la sortie originale du provider, y compris les corps de réponse et leurs empreintes, afin de reconstruire l’état historique.

Un hit est affiché comme `HIT_HISTORICAL` avec sa date originale, jamais comme une nouvelle recherche. Le cache est borné à douze entrées. Un refus d’écriture ou quota navigateur produit un bypass non bloquant : le résultat externe courant reste utilisable.

La persistance générale du Knowledge Engine passe au schéma 1.2 et continue de lire les snapshots 1.1 comme historiques obsolètes.

## 18. Rate limits

Le provider sans clé respecte une cadence maximale déclarée de trois appels par seconde par un espacement de 350 ms. Il effectue au plus un retry sur 429, 502, 503 ou 504, respecte un `Retry-After` borné et applique un timeout de dix secondes.

Les états `RATE_LIMITED`, `TIMEOUT`, `PROVIDER_UNAVAILABLE`, `MALFORMED_RESPONSE`, `PARTIAL_PAGINATION`, `NETWORK_ERROR`, `SOURCE_UNAVAILABLE` et `NO_MATCH` sont distincts. Une panne réseau ne devient jamais `NO_SUPPORTED_KNOWLEDGE`.

## 19. Privacy

Seules les requêtes de sensibilité `PUBLIC` peuvent atteindre le provider. Une expression patient, un identifiant direct, un secret, un `researchProjectId` ou une `strategyVersion` classe la demande de façon bloquante avant tout appel externe.

Le provider reçoit uniquement la requête scientifique gouvernée, les dates, la pagination et le tri. Le texte original, les données individuelles, l’identité de projet, le centre, les documents, les secrets et le contexte confidentiel ne sont pas transmis. Les tests vérifient qu’aucun appel provider n’a lieu dans les cas patient ou projet.

## 20. Restitution UNDERSTAND

La progressive disclosure suit l’ordre : réponse, pourquoi, limites, preuves internes, preuves externes candidates. La recherche est proposée uniquement lorsqu’un gap interne visible le justifie.

L’interface affiche :

- `Preuves internes — corpus NOXIA` ;
- `Preuves externes candidates — recherche documentaire` ;
- la date de recherche et l’état historique du cache ;
- titre, auteurs, année, journal, PMID, DOI, PMCID et lien PubMed ;
- l’assertion candidate exacte, l’applicabilité prudente et l’absence de niveau de preuve ;
- les exclusions, rétractations, erreurs, résultat partiel, absence de correspondance et indisponibilité avec retry.

La réponse interne reste lisible et disponible pendant une panne. Après exécution, le gap précise que la recherche externe ne le ferme pas automatiquement.

## 21. Tests fixtures

Les tests CI n’utilisent pas Internet. Les fixtures ESearch/EFetch couvrent PMID, DOI, PMCID, abstract-only, lien full text, metadata-only, correction, rétractation, publication récente, doublon, absence de correspondance, 429, indisponibilité, réponse mal formée et pagination partielle.

Résultat final ciblé :

- suite Knowledge Engine : 8 fichiers, 87 tests réussis ;
- ENG-003 logique/provider : 26 tests ;
- ENG-003 UNDERSTAND : 7 tests ;
- cas scientifiques obligatoires : IRM vs CT fibrose, no-reflow après stenting, Fourier en IRM, PET vs IRM, T1 mapping vs ECV ;
- tests Protocol Designer impactés : 7 fichiers, 148 tests réussis.

Les tests vérifient notamment la séparation interne/externe, l’absence de mutation, la minimisation, les filtres de fraîcheur, le cache historique, le bypass de quota, les branches comparatives et les contrôles natifs focalisables.

## 22. Tests réseau

Le script manuel séparé `npm run test:knowledge:external:manual` a été exécuté le 2026-08-09. Il n’appartient pas à la suite CI et ne promeut aucune source.

Résultats réels :

| Cas | Requête | Provider | Statut | Identifiants reçus |
|---|---|---|---|---|
| Fourier IRM | `"Fourier transform"[Title/Abstract] AND "magnetic resonance imaging"[Title/Abstract]` | PubMed/NCBI | ESearch 200, EFetch 200 | PMID 33750628, 22499279 ; DOI 10.1016/j.zemedi.2021.01.005, 10.1002/jmri.23642 |
| No-reflow stenting | `"no-reflow phenomenon"[Title/Abstract] AND ("percutaneous coronary intervention"[Title/Abstract] OR "stenting"[Title/Abstract])` | PubMed/NCBI | ESearch 200, EFetch 200 | PMID 21712046, 30205793 ; DOI 10.1016/j.yjmcc.2011.06.009, 10.2174/1381612824666180911122230 |

Les dates UTC enregistrées sont respectivement `2026-08-09T14:07:18.440Z` et `2026-08-09T14:07:19.585Z`. Les corps de réponse n’ont pas été imprimés par le test final ; seules leurs empreintes sont journalisées.

## 23. Scénarios navigateur

| # | Scénario | Résultat et surface de preuve |
|---:|---|---|
| 1 | Réponse interne suffisante | Parcours réel dans le navigateur intégré : CT spectral/photon counting retourne `Réponse étayée` et aucune proposition externe. |
| 2 | Réponse partielle → proposition externe | Parcours réel Fourier : arrêt interne explicite puis bouton de recherche PubMed. |
| 3 | Recherche externe réussie | Provider réel validé par test réseau ; succès d’interface validé avec fixture déterministe. L’appel externe de bout en bout n’a pas abouti dans le navigateur intégré isolé. |
| 4 | Aucun résultat externe | Test d’interface déterministe : `NO_MATCH` et avertissement que cela ne prouve pas l’absence de littérature. |
| 5 | Contradiction interne/externe | Test d’interface déterministe : même identité interne signalée rétractée, divergence visible, conclusion interne inchangée. |
| 6 | Provider indisponible | Parcours réel dans le navigateur intégré : panneau d’indisponibilité, interne conservé. |
| 7 | Retry | Test d’interface déterministe : indisponibilité puis succès au second appel ; contrôle `Réessayer` natif. |
| 8 | Source rétractée | Test d’interface déterministe : source visible seulement sous les exclusions, sans assertion candidate. |
| 9 | Mobile | Contrats responsive P-WEB impactés réussis et structure sans largeur fixe ajoutée. Un viewport réel 320 px n’a pas pu être imposé par le navigateur intégré. |
| 10 | Desktop | Inspection réelle 1280 × 720 : hiérarchie, séparation des preuves et état d’erreur lisibles sans recouvrement. |
| 11 | Clavier | Contrôles modifiés natifs et focalisables, anneau de focus visible ; tests clavier P-WEB impactés réussis. L’outil du navigateur intégré a focalisé le bouton mais n’a pas reproduit l’activation clavier native. |

Le navigateur intégré utilise un environnement réseau isolé : l’appel PubMed depuis l’interface a produit `SOURCE_UNAVAILABLE`, alors que l’essai réseau manuel a réussi et que la réponse PubMed expose `Access-Control-Allow-Origin: *`. Cette divergence est conservée comme limitation de validation, non comme absence scientifique.

## 24. Limitations

1. PubMed est le seul provider externe V1.2 ; aucun fallback Crossref n’est activé.
2. La shortlist est volontairement bornée et non exhaustive.
3. Le texte intégral n’est pas téléchargé ; un PMCID fournit uniquement un lien.
4. L’extraction se limite aux conclusions d’abstract structurées ; elle n’extrait pas automatiquement population, méthode ou échantillon.
5. Aucun niveau de preuve scientifique n’est calculé.
6. Les corrections sont exclues jusqu’à résolution manuelle de la notice courante.
7. Les divergences ne sont détectées automatiquement qu’au niveau d’une identité documentaire corrigée ou rétractée, pas par interprétation scientifique sémantique.
8. Le vocabulaire externe est limité aux concepts et synonymes gouvernés ; un terme libre inconnu reste non transmis et non recherché.
9. Le cache est local au navigateur et soumis à son quota ; il n’est pas un registre probatoire serveur.
10. La réussite réseau réelle a été prouvée hors navigateur, mais pas de bout en bout dans le navigateur intégré isolé ; aucun navigateur Chrome connecté n’était disponible.
11. Le contrôle réel d’un viewport mobile 320 px et l’activation clavier native n’ont pas pu être reproduits par l’outil intégré ; les contrats automatisés restent positifs.

Ces limites empêchent une décision sans réserve, mais aucune ne satisfait un critère bloquant `NOT_READY` : aucune source ou assertion n’est inventée, promue, décontextualisée ou envoyée avec des données sensibles.

## 25. Fichiers modifiés

Implémentation :

- `package.json` ;
- `scripts/manual-test-eng-003-pubmed.mjs` ;
- `src/features/knowledge-engine/types.ts` ;
- `src/features/knowledge-engine/knowledge-request.ts` ;
- `src/features/knowledge-engine/knowledge-result.ts` ;
- `src/features/knowledge-engine/persistence.ts` ;
- `src/features/knowledge-engine/understand-projection.ts` ;
- `src/features/knowledge-engine/KnowledgeUnderstandView.tsx` ;
- `src/features/knowledge-engine/index.ts` ;
- `src/features/knowledge-engine/external-evidence/types.ts` ;
- `src/features/knowledge-engine/external-evidence/query-plan.ts` ;
- `src/features/knowledge-engine/external-evidence/pubmed-provider.ts` ;
- `src/features/knowledge-engine/external-evidence/qualification.ts` ;
- `src/features/knowledge-engine/external-evidence/cache.ts` ;
- `src/features/knowledge-engine/external-evidence/pipeline.ts` ;
- `src/features/knowledge-engine/external-evidence/index.ts`.

Tests :

- `src/features/knowledge-engine/__tests__/fixtures/pubmed-fixtures.ts` ;
- `src/features/knowledge-engine/__tests__/eng-003-external-search.test.ts` ;
- `src/features/knowledge-engine/__tests__/eng-003-understand-ui.test.tsx` ;
- adaptations de version dans `eng-002-product-cases.test.ts` et `understand-ui.test.tsx`.

Rapport : présent document. Aucun document normatif, RDE, KE-001, Reasoning Book, Scientific Program, corpus, Knowledge Graph ou SOURCE-OF-TRUTH-INDEX n’a été modifié.

## 26. Contrats

Contrats ajoutés ou versionnés :

- `KnowledgeRequest` et `KnowledgeResult` V1.2 ;
- décision de recherche externe ;
- plan de requête externe par branche ;
- définition et interface d’un external provider ;
- source candidate et révision ;
- eligibility documentaire ;
- assertion et evidence candidates ;
- résultat externe et synthèse mixte séparée ;
- trace provider, pagination, erreurs et snapshots de réponse ;
- cache V1.2 et persistance Knowledge V1.2 avec lecture legacy 1.1.

Validations finales :

- `npm run typecheck` : succès ;
- `npm run lint` : succès, 0 erreur et 7 warnings Fast Refresh préexistants dans les composants UI partagés ;
- `npm run build` : succès, avec avertissements non bloquants Browserslist ancien et annotations de dépendance ;
- `npm run test:knowledge` : succès, 87/87 ;
- tests Protocol Designer impactés : succès, 148/148 ;
- suite globale : 730/733 ; les 3 échecs contrôlent exclusivement la propreté du dépôt Editorial Engine externe déjà sale, sans échec ENG-001/002/003 ;
- `git diff --check` : succès ;
- intégrité des autorités : succès par empreintes inchangées ;
- aucun commit, push ou déploiement.

## 27. Décision de suite

La prochaine étape autorisée n’est pas une admission scientifique automatique. Elle pourra être une mission distincte de durcissement production : validation de bout en bout dans un navigateur public connecté, éventuel proxy gouverné si l’environnement de déploiement l’exige, politique de rétention/licence du cache d’abstracts, résolution de corrections et revue humaine d’admission.

L’activation d’un provider supplémentaire, l’extraction de texte intégral, l’évaluation scientifique ou la promotion de candidats exigeraient une mission et une autorité séparées.

EXTERNAL_EVIDENCE_SEARCH_V1_IMPLEMENTED_WITH_LIMITATIONS
