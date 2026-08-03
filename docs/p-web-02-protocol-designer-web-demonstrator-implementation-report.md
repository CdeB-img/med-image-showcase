# P-WEB-02 — Rapport d’implémentation du démonstrateur Protocol Designer Web

**Statut documentaire :** RAPPORT_D_IMPLEMENTATION — CANDIDAT_NON_ADMIS  
**Niveau documentaire :** NIVEAU_3  
**Version :** 1.0  
**Date d’arrêt :** 3 août 2026  
**Source maîtresse :** `docs/p-web-02-protocol-designer-web-demonstrator-implementation-report.md`  
**Décision unique de mission :** `PASS_WITH_WARNING`  
**Autorité scientifique revendiquée :** aucune  
**Validation PD-011 revendiquée :** aucune  
**Publication ou activation produit revendiquée :** aucune

> Ce rapport décrit un état réellement implémenté et vérifié localement. Il ne modifie aucun document normatif, Scientific Program, registre, territoire, catalogue, assertion, graphe de connaissances ou Reasoning Book. Son statut de niveau 3 ne vaut ni admission documentaire automatique, ni validation scientifique, ni autorisation de déploiement.

## 1. Résumé de la mission

P-WEB-02 demandait de transformer l’architecture préparatoire P-WEB-01 en un démonstrateur Web visible, navigable et déterministe du Protocol Designer sur le site existant. La tranche livrée comprend une page publique, un espace interactif en sept étapes, trois scénarios locaux issus des Reasoning Books officiels, une décision humaine explicite et un rapport imprimable.

La mission est déclarée `PASS_WITH_WARNING` : les capacités demandées sont présentes et les contrats ciblés passent, mais l’évaluation WCAG complète, les essais utilisateurs et la sortie réelle du dialogue système d’impression n’ont pas été exécutés. La suite globale reste en outre affectée par des contrôles historiques fondés sur le Git diff courant et par un dépôt `editorial-engine` externe déjà sale.

## 2. Nature exacte et séparation documentaire

| Catégorie | Nature dans cette mission |
|---|---|
| Principes établis | intention-first, compréhension avant proposition, décision humaine, incertitude visible, traçabilité et une stratégie avec plusieurs projections |
| Références normatives | Charte fondatrice, Scientific Product Manifesto, Product Specification, PD-003, PD-004, PD-005, PD-007, PD-009, PD-011, PD-012 et PD-013 |
| Corpus scientifiques | RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0, chacun sous son Program Owner |
| Cible produit | P-WEB-01, étendu explicitement par P-WEB-02 |
| État réellement implémenté | routes, composants, fixtures locales, état de session, tests, SEO et styles d’impression décrits ci-dessous |
| Hypothèses et travail incomplet | compréhension utilisateur, audit WCAG exhaustif, lecteurs d’écran réels, impression système multi-navigateurs et qualification scientifique indépendante des projections |

## 3. Documents consultés

La lecture a suivi le SOURCE-OF-TRUTH-INDEX, puis les autorités applicables dans leur ordre documentaire :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` ;
2. Charte fondatrice ;
3. Scientific Product Manifesto ;
4. Product Specification ;
5. PD-003 — Research Object Model ;
6. PD-004 — UX Manifesto et Manuel UX officiel ;
7. PD-005 — Prompt Library Architecture ;
8. PD-007 — Implementation Roadmap ;
9. PD-009 — Decision Engine ;
10. PD-011 — Evaluation Framework ;
11. PD-012 — Scientific Program Architecture ;
12. PD-013 — Scientific Program Registry, état 1.7 ;
13. Scientific Programs NXP-000001, NXP-000002 et NXP-000003 ;
14. Scientific Territory Model, Scientific Knowledge Catalog, Scientific Assertion Layer et Scientific Knowledge Graph ;
15. RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 ;
16. P17, P-WEB-01 et P-WEB-02.

## 4. Arbitrage P-WEB-01 / P-WEB-02

P-WEB-01 avait fixé deux scénarios parce que RB-005 n’était pas alors admis. PD-013 1.7 et P-WEB-02 établissent désormais NXP-000003 et RB-005 v1.0 comme troisième corpus officiel de la tranche. Cette différence n’est pas résolue silencieusement : l’implémentation traite P-WEB-02 comme une extension datée et explicite de la cible P-WEB-01. P-WEB-01 n’est pas réécrit.

Le libellé du niveau 1 reste **Compréhension**, conformément à PD-004, et non « Raisonnement ».

## 5. État initial

- branche : `main` ;
- arbre NOXIA propre avant modification ;
- Protocol Designer limité à une frontière P0 et à une fixture Fabry technique non importée ;
- aucune route `/protocol-designer` ;
- aucune entrée Header dédiée ;
- aucun démonstrateur, état de session ou rapport ;
- typecheck initial : réussite ;
- contrats P0 et SEO ciblés initiaux : 18/18 réussites.

## 6. Architecture retenue

L’architecture est une tranche React locale et déterministe :

- deux pages chargées paresseusement par le routeur existant ;
- trois fixtures TypeScript figées, sans lecture dynamique de DOCX/PDF ;
- état React conservé dans `sessionStorage` sous une enveloppe versionnée ;
- aucun backend, compte, base, LLM, API scientifique, appel réseau métier ou ingestion de graphe ;
- composants du design system existant et aucun nouveau paquet ;
- rapport rendu dans le navigateur et impression déléguée à `window.print()`.

## 7. Routes

| Route | Fonction | Indexation |
|---|---|---|
| `/protocol-designer` | page publique de présentation et d’entrée | indexable, canonical propre, sitemap |
| `/protocol-designer/demo` | démonstrateur interactif | `noindex, follow`, canonical vers la page publique, absent du sitemap |

## 8. Composants principaux

- `ProtocolDesigner` : page publique, proposition de valeur, limites et présentation des trois corpus ;
- `ProtocolDesignerDemo` : shell, navigation en sept étapes, état, erreurs, décision et rapport ;
- `DisclosureStack` : quatre profondeurs avec sens stable et ouverture persistée ;
- `DEMONSTRATOR_SCENARIOS` : trois projections locales et versionnées ;
- Header existant : nouvelle entrée principale « Protocol Designer » ;
- Footer et thème existants : réutilisés sans duplication.

## 9. Fixtures et provenance

| Scénario | Program Owner | Corpus | Projection affichée |
|---|---|---|---|
| Imagerie spectrale | NXP-000001 v1.1 | RB-003 v1.0 | mesure/dérivation, architecture, calibration, métrologie et reproductibilité |
| IRM cardiaque quantitative | NXP-000002 v1.2 | RB-004 v1.1 | biomarqueur, dépendances de séquence/logiciel, qualité, harmonisation et répétabilité |
| Neuro Perfusion & Metabolism | NXP-000003 v1.1 | RB-005 v1.0 | CBF/CBV/délais, OEF/CMRO₂, modèles, modalités et contexte systémique |

Chaque fixture expose construits, hypothèses, informations manquantes, options, localisateurs de preuve, limites, controverse et question ouverte. Les localisateurs pointent vers le Reasoning Book propriétaire ; aucune source externe n’est chargée à l’exécution.

## 10. Modèle d’état local

La session conserve : étape courante et étape maximale atteinte, intention, scénario, formulation, contexte déclaré, contradiction, profondeurs ouvertes, positions sur les hypothèses, disponibilité des informations, option retenue, auteur, portée, confirmation et date de décision.

La structure de session porte `DEMO_SCHEMA_VERSION = 1`. Une structure incompatible ou illisible produit un message récupérable au niveau 0 et restaure un état initial propre. La réinitialisation est confirmée et n’efface que la clé de session du démonstrateur.

## 11. Parcours en sept étapes

1. **Intention** — cinq verbes maximum, choix de l’un des trois scénarios et formulation explicite ;
2. **Compréhension** — reformulation, corpus/version, quatre profondeurs, contexte et contradiction ;
3. **Hypothèses** — retenir, contester ou laisser non examinée chaque hypothèse ;
4. **Informations manquantes** — criticité, décision affectée, conséquence, disponible ou inconnue ;
5. **Stratégie** — options non classées automatiquement avec objectif, bénéfice, limite, renoncement, dépendances, inconnues, risque, preuve, profondeur et recevabilité ;
6. **Revue critique** — constats distincts, risques, non-évaluabilité, revue humaine et confirmation attribuée ;
7. **Rapport** — synthèse reconstructible, preuves, alternatives, limites, controverses, risques et Knowledge Gap.

## 12. Progressive disclosure

| Niveau | Contenu |
|---|---|
| 0 — Orientation | question, statut, blocage critique, contradiction active et action immédiate |
| 1 — Compréhension | construits, justification courte et conséquences |
| 2 — Exécution | dépendances, options, contrôles et conditions conceptuelles |
| 3 — Traçabilité | Program, Reasoning Book, versions, sources et localisateurs |

Les niveaux 1 à 3 utilisent des contrôles natifs `details/summary`. Leur ouverture est persistée dans la session. Aucun bloqueur critique ni contradiction active n’est caché dans un accordéon fermé.

## 13. Accessibilité

Capacités livrées : langue française, landmarks, H1 unique par étape, navigation nommée, `aria-current`, fieldsets et legends, labels explicites, contrôles natifs, états `aria-pressed`, alertes annoncées, lien d’évitement, tailles tactiles minimales, focus visible, focus déplacé lors des changements d’étape et informations non portées par la couleur seule.

Contrôle structurel : aucun champ visible sans label et aucun bouton visible sans nom accessible. Le parcours principal et le lien d’évitement sont focalisables au clavier.

Limite : ceci ne constitue pas une revendication de conformité WCAG 2.2 AA. Aucun audit exhaustif avec lecteur d’écran réel, zoom 400 %, contraste automatisé ou technologies d’assistance multiples n’a été conduit.

## 14. Responsive

Le navigateur local a contrôlé 320, 390, 768, 1024, 1440 et 1920 px sur la page publique, l’intention et le rapport. Un défaut réel d’intrinsic sizing de la barre des sept étapes a été détecté à 320 px puis corrigé avec une frontière `min-width: 0` et un défilement horizontal contenu.

Résultat final observé : aucune largeur de document supérieure au viewport et accès conservé aux actions, preuves, limites et décision. Le Header utilise le menu mobile jusqu’à 1023 px afin d’éviter la compression à 768 px.

## 15. SEO

- page publique : title, description, canonical, BreadcrumbList et sitemap ;
- démonstrateur : title, description, `noindex, follow`, canonical public et exclusion du sitemap ;
- aucune page SEO par scénario ;
- auditeur SEO adapté aux pages interactives `noindex` et aux H1 rendus par composant ;
- résultat local : 40 pages analysées, 38 URL de sitemap, 0 erreur, 0 avertissement.

## 16. Tests et validations

| Validation | Résultat | Observation |
|---|---|---|
| Typecheck | `PASS` | aucune erreur |
| Contrats PWEB02-01 à PWEB02-18 | `PASS` | 18 tests numérotés et 1 garde budget/version |
| Contrats P0 Fabry | `PASS` | 13/13, fixture exacte et non importée |
| Contrats SEO ciblés | `PASS` | 5/5 |
| Cible combinée | `PASS` | 37/37 |
| Audit SEO | `PASS` | 0 erreur, 0 avertissement |
| Build production | `PASS` | 1 804 modules transformés |
| Lint | `PASS_WITH_WARNING` | 0 erreur, 7 avertissements préexistants dans des composants UI |
| `git diff --check` | `PASS` | aucune erreur d’espacement |
| Parcours navigateur complet | `PASS` | intention → décision → rapport, sans erreur d’exécution finale |
| Responsive six largeurs | `PASS` | métriques et inspections distinctes |
| Impression système/PDF | `NOT_TESTED` | bouton et CSS présents ; dialogue système non exécuté |
| Suite globale | `PASS_WITH_WARNING` | 521/531 réussites ; 10 échecs expliqués ci-dessous |

Les dix échecs globaux ne signalent pas une régression fonctionnelle du démonstrateur : sept contrôles historiques exigent que les pages/SEO/sitemap restent absents du Git diff, ce que P-WEB-02 autorise précisément à modifier ; trois contrôles interrogent le dépôt externe `editorial-engine`, déjà sale et hors périmètre. Ces tests ne sont pas assouplis depuis une mission scientifique afin de masquer le signal.

## 17. Capacités réellement livrées

- découverte publique et navigation Header ;
- intention-first avec budget de cinq choix ;
- trois scénarios officiels exactement ;
- états bloquant, non bloquant, contradictoire, non évaluable et indisponible ;
- comparaison sans score ni optimum automatique ;
- décision humaine attribuée et datée ;
- session locale versionnée, transparente et effaçable ;
- preuves, limites, controverses, provenance et gaps ;
- rapport responsive et préparé pour impression navigateur ;
- SEO séparé public/démonstrateur ;
- garde-fous P0 Fabry conservés.

## 18. Capacités explicitement absentes

Aucun protocole d’acquisition, paramètre constructeur, recommandation clinique, décision automatique, moteur PD-009 complet, évaluation PD-011, publication, activation produit, backend, base de données, authentification, compte, chargement dynamique de document, ingestion de Knowledge Graph, appel LLM, appel scientifique distant, export DOCX/PDF serveur, PACS, DICOM, PixelData ou viewer.

## 19. Limites

1. Les fixtures sont des projections de démonstration, pas les Reasoning Books exécutés dynamiquement.
2. La vérification scientifique indépendante, assertion par assertion, reste à conduire.
3. La persistance est limitée à la session du navigateur et n’est pas un Mandat institutionnel.
4. La date locale de décision est une métadonnée de session, non une preuve scientifique.
5. Le dialogue système d’impression et le PDF produit n’ont pas été inspectés sur plusieurs navigateurs.
6. Aucun test utilisateur débutant, expert ou Core Lab n’a encore mesuré la compréhension.
7. La page reste une SPA suivant l’architecture actuelle du site ; aucune pré-rendition serveur nouvelle n’est introduite.

## 20. Risques et prochaines étapes

La prochaine étape recommandée est une recette indépendante fondée sur le plan QA existant, après mise à jour explicite de son arbitrage RB-005 pour tenir compte de P-WEB-02. Cette recette devrait couvrir lecteur d’écran, zoom 400 %, contraste, impression réelle, trois profils utilisateur, concordance scientifique exhaustive des fixtures et tests de compréhension.

Il sera également utile de remplacer, dans une mission dédiée, les contrôles Git historiques dépendant du diff courant par des baselines de périmètre capables de distinguer une modification Web explicitement autorisée d’une fuite depuis une mission Knowledge Graph.

## 21. Fichiers créés

- `docs/p-web-02-protocol-designer-web-demonstrator-implementation-report.md` ;
- `src/pages/ProtocolDesigner.tsx` ;
- `src/pages/ProtocolDesignerDemo.tsx` ;
- `src/features/protocol-designer/types.ts` ;
- `src/features/protocol-designer/fixtures.ts` ;
- `src/features/protocol-designer/DisclosureStack.tsx` ;
- `src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx`.

Le fichier non suivi `docs/p-web-02-protocol-designer-web-demonstrator-validation-plan.md` a été observé dans l’espace de travail mais n’a été ni créé ni modifié par cette implémentation.

## 22. Fichiers modifiés

- `src/App.tsx` ;
- `src/components/Header.tsx` ;
- `src/index.css` ;
- `src/features/protocol-designer/README.md` ;
- `src/features/protocol-designer/__tests__/p0-boundary.test.ts` ;
- `src/__tests__/seo-pages-contract.test.ts` ;
- `scripts/audit-seo-pages.mjs` ;
- `public/sitemap.xml` ;
- `docs/seo-authority-local-report.md`.

Aucun fichier de niveau 0, 1 ou 2 n’a été modifié. Le SOURCE-OF-TRUTH-INDEX n’est pas mis à jour, car le présent rapport n’est pas officiellement admis par la mission. Aucun fichier du dépôt externe `editorial-engine` n’a été touché par P-WEB-02.

## 23. Tableau final des contrats

| Contract | Préservé ? | Test-preuve | Remarque |
|---|---|---|---|
| PWEB02-01 — Entrée par l’intention | `PASS` | test PWEB02-01 + parcours navigateur | premier écran : cinq intentions, avant Program/modalité |
| PWEB02-02 — Trois scénarios officiels | `PASS` | test PWEB02-02 | RB-003, RB-004 et RB-005 exactement |
| PWEB02-03 — Démonstrateur déterministe | `PASS` | test PWEB02-03 + inspection source | aucun fetch, LLM, API ou document dynamique |
| PWEB02-04 — Décision humaine | `PASS` | test PWEB02-04 + parcours complet | aucune stratégie par défaut ; auteur, portée et confirmation exigés |
| PWEB02-05 — Blocages visibles | `PASS` | test PWEB02-05 + navigateur | bloqueurs et contradiction active maintenus au niveau 0 |
| PWEB02-06 — Progressive disclosure | `PASS` | test PWEB02-06 | quatre profondeurs et ouverture persistée |
| PWEB02-07 — Programmes secondaires | `PASS` | test PWEB02-07 | fondations secondaires ; aucune navigation principale par Program |
| PWEB02-08 — Aucune revendication PD-011 | `PASS` | test PWEB02-08 + recherche de copie | aucune chaîne visible ne déclare une validation formelle |
| PWEB02-09 — Aucun protocole clinique | `PASS` | test PWEB02-09 | aucun paramètre, ordre ou recommandation exécutable |
| PWEB02-10 — Provenance | `PASS` | test PWEB02-10/16 | Program, Reasoning Book, versions et localisateurs visibles |
| PWEB02-11 — Responsive essentiel | `PASS` | test PWEB02-11 + six viewports | défaut 320 px corrigé ; contenu essentiel accessible |
| PWEB02-12 — Accessibilité | `PASS_WITH_WARNING` | test PWEB02-12 + audit DOM/clavier | structure et noms accessibles ; audit WCAG complet absent |
| PWEB02-13 — SEO séparé | `PASS` | test PWEB02-13 + audit SEO | public indexable ; démo `noindex, follow` |
| PWEB02-14 — Réinitialisation | `PASS` | test PWEB02-14 | confirmation et effacement limité à la session de démo |
| PWEB02-15 — Non-régression du site | `PASS_WITH_WARNING` | typecheck, build, lint, SEO, cible 37/37 | suite globale affectée par 7 garde-fous diff et 3 états externes |
| PWEB02-16 — Frontières scientifiques | `PASS_WITH_WARNING` | test PWEB02-16 + revue locale des trois RB | localisateurs présents ; validation scientifique indépendante à faire |
| PWEB02-17 — Frontière Editorial Engine | `PASS_WITH_WARNING` | test PWEB02-17 + liste des fichiers | aucun import/écriture ; dépôt externe déjà sale empêche un état global vert |
| PWEB02-18 — P0 et candidat Fabry préservés | `PASS` | test PWEB02-18 + 13 contrats P0 | fixture exacte, non importée, non routée, non indexée et non activée |

## 24. État Git et no-go

- aucun commit ;
- aucun push ;
- aucun déploiement ;
- aucun fichier stagé ;
- aucun document normatif ou scientifique modifié ;
- arbre NOXIA volontairement modifié uniquement par les fichiers listés aux sections 21 et 22, plus le plan QA non suivi et préexistant signalé séparément.
