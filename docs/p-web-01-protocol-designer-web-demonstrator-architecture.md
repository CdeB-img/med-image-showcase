# P-WEB-01 — NOXIA Protocol Designer Web

## Architecture fonctionnelle et UX du démonstrateur scientifique intermédiaire

**Statut :** ARCHITECTURE_DE_PREPARATION — OFFICIAL  
**Niveau documentaire :** NIVEAU_3 — documentation d’implémentation  
**Version :** 1.1
**Date d’effet :** 3 août 2026  
**Source maîtresse :** `docs/p-web-01-protocol-designer-web-demonstrator-architecture.md`  
**Édition dérivée :** aucune  
**Nature :** architecture produit intermédiaire, architecture UX et préparation d’implémentation  
**État couvert :** cible du démonstrateur définie ; Protocol Designer `NOT_IMPLEMENTED` ; `NOT_EVALUATED_UNDER_PD011` ; aucune publication interactive autorisée  
**Autorités supérieures :** Charte fondatrice, Scientific Product Manifesto, Product Specification, PD-003, PD-004, PD-009 et PD-011 dans leurs domaines respectifs  
**Corpus officiels démontrables :** RB-003 version 1.0, RB-004 version 1.1 et RB-005 version 1.0
**Condition d’évolution :** changement explicite du périmètre démontrable, du parcours, d’un contrat de vue, d’un scénario admis, d’une dépendance d’implémentation ou d’un critère de recette  
**Usage interdit :** prouver une implémentation, une validation scientifique, un PASS PD-011, une publication, une recommandation clinique, un protocole validé ou une capacité dynamique absente

---

## 0. Décision documentaire et règle de lecture

### 0.1 Nature exacte de la mission

P-WEB-01 définit la première architecture démontrable du Protocol Designer sur le site NOXIA existant. Il fixe un périmètre, un parcours, des vues, des contrats de composants, des états, des règles de contenu, une intégration cible et des critères de recette suffisamment précis pour préparer une mission d’implémentation distincte.

Il ne crée ni interface, ni route, ni composant, ni donnée scientifique, ni moteur. Son statut `OFFICIAL` signifie uniquement que cette architecture de préparation est admise dans la gouvernance documentaire. Il ne transforme aucune cible en capacité présente.

La version 1.1 constitue une correction documentaire bornée de la version 1.0. Elle ajoute RB-005 comme troisième scénario officiel après son admission ultérieure dans PD-013 état 1.7, conformément à l’« Instruction corrective — P-WEB-01 v1.1 — Extension du démonstrateur à RB-005 » du 3 août 2026. Elle ne modifie aucun principe, règle UX, objet conceptuel, Scientific Program, Reasoning Book, contenu scientifique, nombre de vues, composant, famille d’états ou critère d’acceptation.

### 0.2 Niveaux de vérité applicables

| Niveau de vérité | État applicable à P-WEB-01 | Conséquence de lecture |
|---|---|---|
| Principes établis | science avant technologie ; intention avant solution ; contexte indissociable ; incertitude conservée ; responsabilité humaine ; traçabilité ; droit à l’arrêt | Invariants non négociables |
| Références normatives | Product Specification, PD-003, PD-004, PD-009, PD-011, PD-012 et PD-013 | Contrats à appliquer sans les modifier |
| Corpus scientifiques officiels | PD-002, PD-008, RB-003, RB-004 et RB-005 ; seuls RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 alimentent les trois scénarios actifs | Connaissance datée ; aucune généralisation hors contexte |
| Cible produit | produit complet de 65 écrans, navigation scientifique, projections, évaluation et publication futures | Horizon de cohérence, pas périmètre à livrer ici |
| État réellement implémenté | site React/Vite existant ; aucune route ou interface Protocol Designer ; répertoire P0 privé, inactif et non importé ; fixture Fabry strictement technique | Le démonstrateur n’existe pas encore |
| Hypothèses du démonstrateur | parcours borné, scénarios préconfigurés, choix de routes, lecture secondaire des fondations, trace limitée à la démonstration | À vérifier par prototypage et recette |
| Compromis temporaires | trois scénarios seulement ; cinq entrées visibles ; absence de collaboration réelle, de calcul scientifique dynamique et de publication | Ne deviennent pas des normes produit |

### 0.3 Documents consultés, dans l’ordre appliqué

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version 1.19 avant la présente correction ;
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx` ;
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-edition-editoriale.docx` ;
4. `output/documents/noxia-protocol-designer-product-specification-v1.0.docx` ;
5. `docs/pd-003-research-object-model.md` ;
6. `docs/pd-004-ux-manifesto.md` ;
7. `output/documents/noxia-protocol-designer-manuel-ux-officiel.docx` ;
8. `docs/pd-009-decision-engine-architecture.md` ;
9. `docs/pd-011-evaluation-framework.md` ;
10. `docs/pd-012-scientific-program-architecture.md` ;
11. `docs/pd-013-scientific-program-registry.md`, contrat 1.0, état 1.7 ;
12. `docs/scientific-territory-model.md` ;
13. `docs/p6-scientific-knowledge-catalog.md` ;
14. `docs/scientific-assertion-layer.md` ;
15. `docs/scientific-knowledge-graph-web.md` ;
16. `output/documents/noxia-protocol-designer-reasoning-book-pd-002-fabry.docx` ;
17. `output/documents/noxia-protocol-designer-reasoning-book-pd-008-myocardite.docx` ;
18. `output/documents/noxia-protocol-designer-reasoning-book-rb-003-spectral-imaging.docx` ;
19. `output/documents/noxia-protocol-designer-reasoning-book-rb-004-cardiac-mri-quantitative-cardiac-imaging.docx` ;
20. `output/documents/noxia-protocol-designer-reasoning-book-rb-005-neuro-perfusion-metabolism-foundations.docx` ;
21. `docs/p17-scientific-programs-reasoning-books-consolidation-report.md` ;
22. `docs/p-web-02-protocol-designer-web-demonstrator-validation-plan.md` ;
23. preuves courantes d’implémentation : `src/App.tsx`, `src/components/Header.tsx`, `src/features/protocol-designer/README.md`, sa fixture P0 et ses tests de frontière.

Les documents autonomes PD-014, PD-015 et PD-016 n’ont pas été recherchés. Les traces correspondantes sont lues dans PD-013, conformément au mandat.

### 0.4 Contradictions, écarts et arbitrages explicites

| ID | Éléments concernés | Qualification | Arbitrage applicable |
|---|---|---|---|
| E01 | Product Specification S03 : six entrées ; PD-004 budget officiel : cinq points d’entrée visibles | Contradiction de présentation dans un même niveau ; PD-004 est l’autorité UX spécialisée | Cinq cartes visibles et une voie « Autre objectif » recherchable. Les six familles produit restent accessibles sans être affichées simultanément. Compromis de démonstrateur, à réévaluer lors d’une évolution coordonnée des autorités. |
| E02 | Product Specification : cible complète de 65 écrans ; démonstrateur : 17 vues fonctionnelles et états associés | Différence de périmètre, pas contradiction | Le démonstrateur sélectionne une tranche représentative sans prétendre remplacer la cible complète. |
| E03 | PD-004 nomme `manquant` comme projection de l’inconnu ; PD-003 conserve l’état canonique `inconnu` ; le prompt demande aussi `déclaré` | Différence entre modèle et projection | Le modèle conserve `inconnu`. L’interface affiche « Information manquante » lorsque cet inconnu est requis ; `déclaré` qualifie la provenance, jamais un nouvel état épistémique. |
| E04 | Index v1.17, registre de niveau 2 : RB-004 encore libellé version 1.0 ; PD-013 état 1.6, DOCX maître et P17 : version 1.1 | Écart historique résolu par l’index v1.18, sans contradiction courante | Conserver la trace de la correction ; la fixture utilise RB-004 v1.1. Aucune source scientifique n’est modifiée. |
| E05 | P0 protège l’absence de route et de code ; P-WEB-01 décrit de futures routes et composants | Différence cible/état courant | P0 reste la preuve actuelle. Les routes, composants et dépendances de ce document sont des décisions de préparation, non des modifications présentes. |
| E06 | P-WEB-01 v1.0 excluait RB-005 alors candidat ; PD-013 état 1.7 et l’index v1.19 l’admettent ensuite comme actif officiel | Écart temporel explicitement résolu, sans réécriture de l’état historique | La présente version 1.1 ajoute RB-005 v1.0 comme troisième scénario déterministe sous `NXP-000003` v1.1. Aucun contenu scientifique n’est créé ou modifié. |
| E07 | Scientific Assertion Layer décrit une migration initiale vide ; les corpus narratifs existent | Différence de couche et de date | Le démonstrateur n’invente aucun graphe exécutable. Les relations de preuve sont des projections bornées des corpus admis et sont étiquetées comme telles. |
| E08 | Le mandat emploie « Niveau 1 — Raisonnement » ; PD-004 et le Manuel UX nomment la profondeur officielle « Niveau 1 — Compréhension » | Divergence de libellé ; PD-004 est l’autorité UX spécialisée | Le démonstrateur conserve « Niveau 1 — Compréhension ». Le raisonnement décrit son contenu, mais ne crée pas un cinquième libellé ni une profondeur concurrente. |
| E09 | RB-004 v1.1 conserve le récit de son admission dans PD-013 état 1.4 et de `NXP-000002` v1.1 ; PD-013 courant est à l’état 1.7 et le Programme en v1.2 | État historique d’admission contre état courant ultérieur, pas contradiction scientifique | La fixture conserve l’historique si affiché, mais utilise PD-013 état 1.7 et P17 pour l’état courant. Aucun texte de RB-004 n’est réécrit. |

### 0.5 Décisions structurantes

| ID | Autorité source | Choix retenu | Alternatives écartées | Justification | Risque | Durée |
|---|---|---|---|---|---|---|
| D01 | Charte ; Manifesto ; PD-004 UX-01 | Commencer par l’intention | Choix d’une modalité, d’un Program ou d’un Reasoning Book | Évite d’enfermer la question dans une solution | Intention trop vague | Durable |
| D02 | Manifesto ; PD-004 UX-19 | Sept phases visibles et réouvrables | Tunnel linéaire ; conversation seule | Rend le raisonnement lisible et réversible | Impression de processus fixe | Durable |
| D03 | PD-004 budget et UX-07/08 | Une question et une action principale par zone | Formulaire long ; plusieurs CTA équivalents | Réduit la charge immédiate | Parcours plus long | Durable |
| D04 | PD-004 UX-12 ; Product Specification | Résumé stable du projet | Contexte seulement en page d’accueil | Maintient l’interprétabilité locale | Densité sur mobile | Durable |
| D05 | PD-004 UX-15–18 | Quatre profondeurs communes | Écrans séparés débutant/expert | Une science, plusieurs projections | Mauvais réglage de densité | Durable |
| D06 | PD-004 UX-17, UX-37–40 | Blocages visibles au niveau 0 | Alertes dans un onglet ou une info-bulle | Une limite critique conditionne toute décision | Surcharge d’alertes | Durable |
| D07 | PD-009 ; PD-004 UX-20/22 | État par phase et différentiel d’impact | Pourcentage de progression ; réécriture automatique | Préserve l’histoire et évite la fausse complétion | Impacts difficiles à expliquer | Durable |
| D08 | PD-003 ; PD-004 UX-04/60 | Décision humaine datée et attribuée | Acceptation implicite ; auto-validation | Maintient le Mandat et la responsabilité | Friction de confirmation | Durable |
| D09 | PD-011 | Aucune mention PASS/validation | Badge de performance ou « projet validé » | Le démonstrateur n’a pas été évalué | Valeur perçue moins spectaculaire | Durable jusqu’à preuve PD-011 |
| D10 | PD-013 état 1.7 ; index v1.19 ; instruction corrective P-WEB-01 v1.1 | Trois scénarios : RB-003, RB-004 et RB-005 | Fabry/Myocardite comme scénarios principaux ; tout quatrième corpus non admis | Ce sont les trois corpus officiellement admis et explicitement autorisés pour le démonstrateur | Couverture fonctionnelle bornée à trois domaines | Temporaire |
| D11 | PD-004 UX-06 ; prompt | Fondations scientifiques secondaires | Catalogue ou graphe comme accueil | Le produit montre un raisonnement, pas son infrastructure | Provenance moins visible au premier regard | Durable |
| D12 | Site courant ; prompt | Page publique `/protocol-designer` et espace interactif `/protocol-designer/demo` | Démonstrateur en page d’accueil ; sous-route d’un Program | Sépare explication indexable et interaction non indexable | Deux surfaces à maintenir | Cible de cette tranche |
| D13 | P0 ; PD-011 | Fixtures versionnées, lecture seule, explicitement préconfigurées | Génération dynamique simulée | Ne présente pas une fixture comme moteur | Démonstration moins ouverte | Temporaire |
| D14 | PD-004 UX-46–50 | Même capacité de 320 px à 400 % de zoom | Version mobile amputée | Accessibilité et reprise sont essentielles | Comparaisons plus séquentielles | Durable |
| D15 | PD-004 UX-41–45/67 | États non heureux conçus avant le scénario heureux | Message générique d’erreur | Inconnu et contradiction sont des états scientifiques | Catalogue d’états important | Durable |
| D16 | PD-003 ; PD-004 UX-51 | Modèle métier inchangé, projections de lecture seulement | Nouveau modèle « DemoProject » métier | Évite un concurrent conceptuel | Adaptation technique plus exigeante | Durable |
| D17 | Site courant | Réutiliser le bandeau, le langage visuel et les primitives accessibles du site | Micro-site autonome | Continuité institutionnelle et coût limité | Composants actuels à auditer | Cible de cette tranche |
| D18 | Prompt ; P0 | Dégradation sans JavaScript vers une page explicative, jamais vers un faux résultat | Écran vide ; rapport statique simulé | Reste honnête sur l’indisponibilité | Démo non interactive sans JS | Durable |

---

## 1. Résumé exécutif

Le démonstrateur présente NOXIA comme un accompagnateur de raisonnement scientifique. Un visiteur découvre la proposition de valeur, choisit une intention, précise un contexte, voit ce qui est connu, supposé, manquant ou contradictoire, examine des hypothèses et des options, compare leurs conséquences, demande une revue critique, prend explicitement une décision humaine et consulte un rapport reconstructible.

La surface visible repose sur trois scénarios préconfigurés, déterministes et versionnés : Spectral Imaging à partir de RB-003 v1.0, Cardiac MRI & Quantitative Cardiac Imaging à partir de RB-004 v1.1, et Neuro Perfusion & Metabolism Foundations à partir de RB-005 v1.0. Les Reasoning Books, Scientific Programs, sources et preuves sont accessibles comme fondations secondaires. Ils ne constituent jamais le menu principal.

La démonstration ne calcule pas une vérité, ne produit pas de protocole clinique, ne simule pas une validation, ne revendique aucun PASS et ne publie aucune connaissance nouvelle. Elle rend visibles les contrats essentiels d’un futur produit : contexte, information manquante, hypothèses, options, limites, provenance, impact des changements, arrêt honnête et décision humaine.

---

## 2. Matrice de conformité UX

Le DOCX du Manuel UX officiel a été vérifié : il contient les mêmes 70 identifiants et intitulés UX-01 à UX-70 que PD-004. PD-004 reste la source normative maîtresse ; le Manuel en est l’édition officielle mise en forme.

| Règle UX | Source exacte | Traduction dans le démonstrateur | Écart éventuel |
|---|---|---|---|
| Intention avant technique | PD-004 UX-01 ; Manuel UX UX-01 | Premier écran : cinq familles d’intention et « Autre objectif » ; aucune modalité, séquence ou Program | Aucun |
| Comprendre avant de proposer | UX-02 | Aucune stratégie avant question reformulée, population, objectif, contraintes et inconnues principales | Aucun |
| Une stratégie canonique | UX-03 ; PD-003 | Toutes les vues lisent la même version de stratégie ; comparaison = Options, pas projets concurrents | Aucun |
| Décision humaine | UX-04 ; UX-60 | `HumanDecisionPanel` nomme auteur, date, portée, réserves et statut de revue | Aucun |
| Proposition reconstructible | UX-05 | Chaque option répond à quoi, pourquoi, contexte, alternative et limites | Aucun |
| Pas de théâtre IA | UX-06 | Aucun avatar, animation de pensée ou message « généré par IA » central | Aucun |
| Budget des entrées | Budget officiel | Cinq cartes visibles ; sixième famille accessible via « Autre objectif » | Compromis E01 face aux six entrées S03 |
| Une question principale | UX-07 | Titre interrogatif unique dans la zone de travail | Aucun |
| Une action principale | UX-08 | Un seul bouton visuellement dominant ; autres actions secondaires nommées | Aucun |
| Options limitées, connaissance conservée | UX-09 | Trois options mises en avant, cinq maximum ; alternatives regroupées | Aucun |
| Conséquence de chaque choix | UX-10/11 | Sous-libellé, contexte du classement et renoncement principal | Aucun |
| Résumé stable | UX-12 | Question, population, objectif, phase et blocages toujours accessibles | Aucun |
| Ordre décision–justification–détail | UX-13 | Niveau 0 puis 1, accès aux niveaux 2 et 3 | Aucun |
| Pas de sens par couleur seule | UX-14 | Libellé, icône et texte ; rouge réservé aux blocages critiques | Aucun |
| Révélation selon l’utilité | UX-15 | Une donnée apparaît quand elle sert la tâche actuelle | Aucun |
| Quatre profondeurs | UX-16 | Orientation, compréhension, exécution, traçabilité sur les composants structurants | Aucun |
| Blocage jamais replié | UX-17 ; UX-40 | Bandeau niveau 0 et lien de résolution direct, y compris sur mobile | Aucun |
| Approfondir et revenir | UX-18 | Inspecteur/panneau restaure focus et position de lecture | Aucun |
| Carte, pas prison | UX-19 | Sept phases visibles, dépendances avant première visite, réouverture ensuite | Aucun |
| État, pas pourcentage | UX-20 | Non commencée, en cours, suffisamment renseignée, à revoir, bloquée | Aucun |
| Retour sans perte | UX-21/24 | Brouillon conservé ; reprise sur dernier état cohérent avec changements intervenus | Persistance réelle hors périmètre ; fixture de session seulement |
| Différentiel d’impact | UX-22 | Ajouté, retiré, modifié, inchangé ; cause et objets aval à revoir | Calcul dynamique simulé par fixture |
| Transcript secondaire | UX-23 | Aucun chat principal ; décisions, preuves et limites en vues structurées | Aucun |
| Modales limitées | UX-25 | Modal uniquement pour interruption nécessaire ou confirmation destructive | Aucun |
| Qualification de l’information | UX-26/27 | Connu, supposé, inconnu/manquant, contradictoire, non applicable ; conclusions établies, probables, contextuelles, controversées ou insuffisamment documentées | `déclaré` reste une provenance |
| Pas de confiance inventée | UX-28 | Aucun pourcentage ou score global | Aucun |
| Incertitude actionnable | UX-29–31 | Cause, impact, action possible, responsable ; arrêt si progression malhonnête | Aucun |
| Preuve reliée | UX-32/33 | Chaîne proposition → justification → preuve ; ouverture depuis l’objet concerné | Les liens sont des projections de fixtures, pas un graphe actif |
| Volume ≠ force | UX-34 | Nature, contexte et limites avant nombre de références | Aucun |
| Désaccord visible | UX-35/36 | Soutient, réfute, qualifie, mentionne ; version et fraîcheur | Aucun consensus automatique |
| Limites locales et transversales | UX-37–40 | Limite au plus près de l’objet et registre transversal ; critique non masquable | Aucun |
| Messages et récupération | UX-41–45 | Anatomie constante : fait, importance, préservé, action, revue humaine | Aucun |
| Responsive essentiel | UX-46/47 | Parcours complet dès 320 px ; tableaux avec vue linéaire équivalente | Comparaison séquentielle sur mobile |
| Accessibilité | UX-48/49 | WCAG 2.2 AA, clavier, focus, sémantique, annonces, 44 × 44 CSS, alternative au glisser | À prouver en implémentation |
| Attente maîtrisée | UX-50 | Objet de l’attente, état, annulation ou sortie sans perte | Aucun |
| Même science, projection adaptée | UX-51–54 | Densité et ouverture changent ; limites et décisions restent identiques | Mode démonstrateur unique avec sélecteur de profondeur, pas quatre produits |
| Core Lab | UX-55–61 | Comparaison intersite et paquet de reproductibilité visibles comme projection secondaire | Collaboration et export réel hors périmètre |
| Microcopie méthodologique | UX-62/63 | Verbes autonomes, ton calme, aucune promesse automatique | Aucun |
| Composant selon relation | UX-64 | Étapes pour séquence, cartes pour objets, tableau pour comparaison, accordéon pour profondeur | Aucun |
| Tester la compréhension | UX-65/66 | Recette mesure reformulation, limite comprise et prochaine action, avec profils réels | Évaluation future requise |
| États non heureux | UX-67 | Douze familles spécifiées avant implémentation | Aucun |
| Exceptions gouvernées | UX-68–70 | Tout écart porte source, risque, propriétaire, date de revue et expiration | E01 et compromis temporaires consignés ici |

---

## 3. Périmètre du démonstrateur

### 3.1 Inclus

- une page publique de présentation ;
- un espace interactif de démonstration distinct ;
- cinq entrées visibles par intention et une voie « Autre objectif » ;
- sept phases canoniques ;
- trois scénarios officiels préconfigurés ;
- état des informations, hypothèses, options, comparaison, preuves, limites, contradiction, revue, décision humaine et rapport ;
- retour en amont avec impact aval visible ;
- reprise dans une session ou un scénario préconfiguré ;
- fondations scientifiques en lecture secondaire ;
- comportements desktop, tablette, mobile et fort zoom ;
- états vides, partiels, bloqués, non évaluables et récupérables.

### 3.2 Hors périmètre

- production de protocole clinique ou d’ordre d’acquisition ;
- paramètres constructeur exécutables ;
- recommandation thérapeutique ou décision patient ;
- moteur scientifique dynamique, agent, prompt ou modèle ;
- création ou modification d’assertions, de sources, de corpus ou du Knowledge Graph ;
- administration des Scientific Programs, Reasoning Books ou droits ;
- collaboration temps réel, invitation, signature institutionnelle ou workflow Core Lab complet ;
- stockage durable multi-utilisateur, API, synchronisation, export réglementaire ou publication ;
- évaluation ou PASS PD-011 ;
- indexation de l’espace interactif ;
- usage de tout corpus autre que RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 ;
- remplacement de la Product Specification complète.

---

## 4. Proposition de valeur démontrée

La démonstration doit permettre à un visiteur de formuler, après usage :

> NOXIA ne choisit pas une technique à ma place. Il transforme mon intention en une question contextualisée, me montre ce qui manque, organise les hypothèses, compare des stratégies avec leurs preuves et leurs limites, puis conserve ma décision et son raisonnement dans un rapport traçable.

Les preuves observables de cette valeur sont : une reformulation prudente, un blocage expliqué, une hypothèse reliée à son contexte, une comparaison sans score global, une limite critique impossible à masquer, un changement amont avec différentiel aval, une décision humaine attribuée et un rapport relié aux décisions sources.

---

## 5. Utilisateurs et intentions principales

| Public | Besoin démontré | Projection privilégiée | Responsabilité conservée |
|---|---|---|---|
| Médecin chercheur | Clarifier une question et ses observables | Standard | Décision scientifique et interprétation contextuelle |
| Chercheur | Comparer, quantifier, reproduire | Standard ou expert | Hypothèses, choix méthodologiques et réserves |
| Méthodologiste | Vérifier cohérence, biais, preuve et conséquences | Expert | Revue et qualification des limites |
| Équipe Core Lab | Examiner harmonisation, qualité et déviations | Core Lab secondaire | Arbitrage intersite et acceptation des écarts |
| Partenaire industriel | Comprendre la valeur et les frontières | Orientation puis preuve | Aucune autorité scientifique implicite |
| Recruteur ou évaluateur | Observer qualité de conception, traçabilité et maturité | Parcours guidé | Aucune conclusion de validation produit |

Les cinq entrées visibles sont :

1. **Comprendre un phénomène** — clarifier ce qui est mesuré et ce qui reste inféré ;
2. **Comparer des approches** — examiner conséquences, bénéfices et renoncements ;
3. **Quantifier ou suivre** — préciser propriété, temporalité et conditions de mesure ;
4. **Démontrer ou valider une hypothèse** — définir la décision et le niveau de preuve attendu sans promettre une validation ;
5. **Reproduire une étude** — distinguer ce qui est décrit, transférable et manquant.

« Autre objectif » ouvre une saisie guidée et permet de router les familles produit non visibles sans dépasser le budget PD-004.

---

## 6. Scénarios démontrables officiels

### 6.1 S-RB003 — Spectral Imaging

- **Corpus :** RB-003 v1.0 ; Program Owner `NXP-000001` v1.1.
- **Intention de démonstration :** comparer ou quantifier dans un contexte d’imagerie spectrale, sans commencer par une architecture d’acquisition.
- **Ce que la fixture peut montrer :** distinction mesure/dérivation, dépendances de calibration et de contexte, hypothèses concurrentes, options justifiées, limites de transférabilité, conditions de refus et provenance RB-003.
- **Interdit :** scanner particulier, réglage constructeur, indication patient, agent K-edge présenté comme usage établi, recommandation ou protocole.

### 6.2 S-RB004 — Cardiac MRI & Quantitative Cardiac Imaging

- **Corpus :** RB-004 v1.1 ; Program Owner `NXP-000002` v1.2.
- **Intention de démonstration :** comprendre ou comparer une stratégie de mesure quantitative, sans commencer par une séquence.
- **Ce que la fixture peut montrer :** chaîne phénomène → signal → mesure → qualité → incertitude → contexte, dépendances de mouvement et reconstruction, alternatives, métrologie, non-évaluabilité et provenance RB-004.
- **Interdit :** pathologie particulière déduite, protocole patient, paramètres exécutables, seuil universel, recommandation thérapeutique ou équivalence non prouvée.

### 6.3 S-RB005 — Neuro Perfusion & Metabolism Foundations

- **Corpus :** RB-005 v1.0 ; Program Owner `NXP-000003` v1.1.
- **Intention de démonstration :** comprendre, comparer ou quantifier un construit de perfusion cérébrale, d’oxygénation, de métabolisme ou de barrière hémato-encéphalique, sans commencer par une modalité.
- **Ce que la fixture peut montrer :** distinction CBF/CBV/MTT/TTP/Tmax, relations et limites de l’OEF et du CMRO₂, séparation entre perfusion, métabolisme et BBB, dépendances de modèle, fonction d’entrée, calibration, transit, physiologie et version, comparaison bornée de CTP, DSC-MRI, DCE-MRI, ASL et PET, non-évaluabilité, limites de détection, refus et provenance RB-005.
- **Interdit :** protocole clinique, dose, injection ou inhalation prescrite, paramètre d’acquisition, seuil universel, conclusion patient, recommandation, modalité déclarée supérieure en toute situation, viabilité ou irréversibilité affirmée sur une carte seule, interprétation non soutenue par RB-005.

---

## 7. Parcours utilisateur détaillé

### 7.1 Parcours principal

| Phase | Question utilisateur | Entrées minimales | Sortie visible | Blocage possible | Action principale |
|---|---|---|---|---|---|
| Découverte | Qu’est-ce que NOXIA démontre ici ? | Aucun | Valeur, limites, trois scénarios disponibles | JavaScript indisponible | Commencer la démonstration |
| Intention | Qu’est-ce que je cherche à accomplir ? | Verbe et formulation libre | Intention structurée, sans décision scientifique | Formulation vide ou multiple | Clarifier cette intention |
| Compréhension | Ai-je été compris dans mon contexte ? | Question, objectif, population, phénomène, temporalité, contraintes | Reformulation prudente et contexte minimal | Contexte décisif absent | Retenir cette reformulation |
| Hypothèses | Quelles explications ou relations doivent être testées ? | Question, objectifs, informations | Hypothèses principales et concurrentes, statuts | Hypothèse non réfutable ou hors corpus | Ajouter cette hypothèse |
| Informations manquantes | Que sait-on, suppose-t-on ou ignore-t-on ? | Informations de projet et besoins | Connu, supposé, manquant, contradictoire, non applicable, non évaluable | Inconnue structurante | Répondre à la prochaine question utile |
| Stratégie | Quelles options répondent honnêtement au besoin ? | Contexte suffisamment explicite, hypothèses, corpus | Une stratégie candidate, options et justifications | Connaissance ou mandat insuffisant | Comparer les stratégies |
| Revue critique | La chaîne est-elle cohérente et ses limites acceptables ? | Stratégie, preuves, limites, risques, impacts | Points satisfaits, réserves, contradictions, arrêt | Limite critique ou revue humaine requise | Ouvrir le point prioritaire |
| Décision humaine | Quelle option l’utilisateur retient-il, adapte-t-il ou refuse-t-il ? | Mandat explicite, options, réserves | Décision attribuée, alternative, justification, conditions | Auteur ou portée absent | Enregistrer cette décision |
| Rapport | Le raisonnement peut-il être relu et reconstruit ? | Version de stratégie et trace | Rapport consolidé, limites et provenance | Éléments non évaluables | Consulter le rapport |

### 7.2 Itération et reprise

Un retour vers Intention, Compréhension, Hypothèses ou Informations ne supprime rien. Avant confirmation d’un changement structurant, `ImpactSummary` montre : cause, objets ajoutés/retirés/modifiés, décisions humaines conservées, éléments aval marqués « à revoir » et prochaine action. Le démonstrateur applique un différentiel préconfiguré ; l’implémentation future devra remplacer cette simulation par une propagation conforme à PD-009.

Au retour dans une session, la reprise affiche le dernier point cohérent, la version du scénario, les décisions ouvertes et les changements intervenus. Elle ne reprend pas un dialogue fictif.

### 7.3 Parcours d’arrêt honnête

Si une information structurante est absente, contradictoire ou scientifiquement insuffisante, l’utilisateur voit : ce qui bloque, la branche affectée, ce qui reste valide, l’action possible, le responsable requis et la possibilité de produire un rapport provisoire. Aucun bouton ne transforme l’arrêt en réussite.

---

## 8. Architecture de navigation

### 8.1 Deux surfaces séparées

- **Surface publique cible `/protocol-designer` :** proposition de valeur, limites, publics, aperçu du parcours, scénarios disponibles et appel vers la démonstration. Contenu public potentiellement indexable après décision SEO distincte.
- **Surface interactive cible `/protocol-designer/demo` :** parcours scientifique, fixtures, décisions de session et rapport. Espace `noindex, follow`, absent du sitemap, après décision d’implémentation distincte.

Ces chemins sont des décisions d’architecture, pas des routes présentes. La mission d’implémentation devra vérifier disponibilité, SEO, canonique, tests de routes et réversibilité avant toute création.

### 8.2 Coquille de travail

1. bandeau institutionnel NOXIA, avec retour explicite au site ;
2. résumé stable du projet ;
3. carte des sept phases ;
4. zone de travail portant une question et une action principale ;
5. inspecteur contextuel pour raisons, preuves, limites et impacts ;
6. accès secondaire au rapport, aux fondations et à la reprise.

La carte des phases reflète le raisonnement. Elle n’affiche ni Program, ni dossier, ni arborescence documentaire. Sur mobile, elle devient un sélecteur séquentiel avec état textuel ; le résumé et l’inspecteur deviennent des panneaux accessibles.

### 8.3 États de phase

`NON_COMMENCEE`, `EN_COURS`, `SUFFISAMMENT_RENSEIGNEE`, `A_REVOIR`, `BLOQUEE`. Ces libellés sont des états de projection. Ils ne deviennent pas des objets PD-003 et ne constituent aucun score de progression.

---

## 9. Arborescence des vues

```text
Site NOXIA
└── Présentation publique du Protocol Designer
    ├── Valeur, limites et publics
    ├── Aperçu des sept phases
    └── Entrer dans la démonstration
        └── Coquille interactive
            ├── Intention
            ├── Compréhension et contexte
            ├── Hypothèses
            ├── Informations et besoins
            ├── Stratégie
            │   └── Comparaison des options
            ├── Revue critique
            │   ├── Preuves et provenance
            │   ├── Limites, risques et controverses
            │   └── Contradictions et non-évaluabilité
            ├── Décision humaine
            ├── Rapport consolidé
            ├── Fondations scientifiques [secondaire]
            └── Reprise et récupération [transversal]
```

---

## 10. Wireframes textuels

### 10.1 Vue publique

```text
[Bandeau NOXIA]
[H1 Protocol Designer]
Une intention scientifique devient un raisonnement traçable sous décision humaine.
[Ce que le démonstrateur montre] [Ce qu’il ne valide pas]
[7 phases en aperçu]
[Scénario Spectral Imaging] [Scénario Cardiac MRI] [Scénario Neuro Perfusion]
[Commencer la démonstration]
[Méthode, accessibilité, limites, date et version]
```

Le CTA est unique. Si JavaScript est indisponible, la page reste lisible et remplace le CTA par « La démonstration interactive nécessite JavaScript ; aucun résultat n’a été calculé ».

### 10.2 Intention

```text
[Résumé : nouveau raisonnement | aucune décision scientifique]
Que cherchez-vous à accomplir aujourd’hui ?
[Comprendre] [Comparer] [Quantifier ou suivre]
[Démontrer ou valider une hypothèse] [Reproduire une étude]
[Autre objectif]
Votre formulation : [champ libre]
[Clarifier cette intention]
```

### 10.3 Compréhension et contexte

```text
[Phases]  INTENTION ✓  COMPRÉHENSION EN COURS ...
Voici notre compréhension prudente : [reformulation]
Ce qui vient de vous : [déclaré]
Population | objectif | phénomène | temporalité
Modalités disponibles | contraintes | multicentrique | preuve attendue
[Manque critique visible]
[Modifier le contexte]                    [Retenir cette reformulation]
```

### 10.4 Informations

```text
Que savons-nous pour instruire cette décision ?
[Connu 4] [Supposé 2] [Manquant 3] [Contradictoire 1]
[Blocage : information X nécessaire — pourquoi — branche affectée]
Question principale : [une seule]
[Réponses rapides, 4 max] [Autre] [Je ne sais pas]
[Répondre et voir l’impact]
```

### 10.5 Hypothèses

```text
Hypothèses à examiner
[H1 principale | statut | ce qui la rend réfutable | conséquence]
[H2 concurrente | statut | différence avec H1 | conséquence]
[Limite locale toujours visible]
[Ajouter une hypothèse]                   [Examiner les informations manquantes]
```

### 10.6 Stratégie candidate

```text
Stratégie candidate — proposition NOXIA, non décision
Question → Hypothèses → Observables → Options → Décisions
[Option mise en avant : contexte, bénéfice, renoncement, limite]
[Alternative 1] [Alternative 2]
[Pourquoi cet ordre ?] [Voir les preuves]
[Comparer les stratégies]
```

### 10.7 Comparaison

```text
Contexte commun : [résumé]
Critère             Option A              Option B              Option C
Ce qui est observé  ...                   ...                   ...
Bénéfice            ...                   ...                   ...
Limite              ...                   ...                   ...
Renoncement         ...                   ...                   ...
Preuve/contexte     ...                   ...                   ...
[Vue linéaire équivalente]
[Conserver le désaccord]                  [Préparer une décision humaine]
```

### 10.8 Preuves et provenance

```text
Objet examiné : [proposition ou limite]
Chaîne : proposition → justification → élément de preuve
[SOUTIENT] [RÉFUTE] [QUALIFIE] [MENTIONNE]
Source | version | date | localisateur | contexte | limite
Projection issue de RB-003 v1.0, RB-004 v1.1 ou RB-005 v1.0
[Comparer le contexte] [Signaler un problème] [Revenir à l’objet]
```

### 10.9 Limites, controverses et risques

```text
[Limite critique — visible et non masquable]
Ce qu’elle limite | conséquence | mitigation | résidu | responsable
Registre transversal : critiques / à traiter / acceptées sous réserve
Controverse : positions A et B, contextes respectifs, aucune majorité artificielle
[Ouvrir le point prioritaire]
```

### 10.10 Contradiction

```text
Contradiction scientifique active
Éléments incompatibles | provenance | contexte | branche affectée
Ce qui reste préservé : [...]
Actions : [Demander une information] [Conserver les deux positions]
Revue humaine requise : [rôle]
[Traiter cette contradiction]
```

### 10.11 Données insuffisantes ou non évaluables

```text
Cette question n’est pas évaluable avec les informations disponibles.
Pourquoi cela importe | données absentes | limites du corpus
Ce qui peut encore être rapporté sans conclure
[Ajouter une information] [Demander une revue] [Produire un rapport provisoire]
```

### 10.12 Revue critique

```text
Revue de cohérence — ne constitue pas une validation
[Satisfait] Question ↔ objectif
[À revoir] Hypothèse sans information discriminante
[Bloqué] Limite critique non arbitrée
[Non évalué] Reproductibilité multicentrique
Réserves conservées : [...]
[Ouvrir le point prioritaire]              [Continuer sous réserve]
```

### 10.13 Décision humaine

```text
Décision attendue de l’utilisateur
Proposition NOXIA | alternative principale | réserves
Je décide de : [retenir] [adapter] [différer] [refuser]
Justification : [...]  Auteur : [...]  Portée/Mandat : [...]
Impacts avant enregistrement : [...]
[Enregistrer cette décision]
```

### 10.14 Rapport consolidé

```text
[Sommaire structuré]
Question et contexte | hypothèses | informations | stratégie
Décisions humaines | alternatives | limites | contradictions
Éléments non évaluables | preuves et provenance | historique
Chaque assertion de rapport → décision ou source de projection
[Revenir au raisonnement] [Voir les fondations]
```

Le démonstrateur ne propose pas d’export officiel. Une impression locale, si elle est ultérieurement admise, doit porter « Démonstration — non évaluée sous PD-011 — ne constitue pas un protocole validé ».

### 10.15 Fondations scientifiques

```text
Fondations utilisées [vue secondaire]
Program Owner | Reasoning Book | version | date des connaissances
Scientific Vision | Territory Links | Evidence Map | sources
[Filtres de lecture, jamais d’administration]
[Revenir à la décision d’origine]
```

### 10.16 Reprise et récupération

```text
Votre travail est préservé jusqu’au dernier état cohérent.
Dernier point | version de fixture | décision ouverte | changement détecté
[Reprendre la prochaine action] [Consulter le rapport préservé]
Si échec : cause technique distincte des limites scientifiques.
```

### 10.17 Chargement, vide et succès partiel

```text
Chargement : « Ouverture des fondations utilisées… » [annuler si durable]
Vide : « Aucune hypothèse n’a encore été formulée. Cela ne signifie pas qu’il n’en existe aucune. »
Partiel : « Le contexte est préservé ; trois preuves n’ont pas pu être ouvertes. Les décisions concernées restent à revoir. »
```

---

## 11. Catalogue des composants

Les noms suivants sont des identifiants d’architecture indicatifs. La mission d’implémentation peut les aligner sur les conventions du dépôt sans changer leurs responsabilités. Tous consomment des projections de PD-003 ; aucun ne possède la vérité métier.

### 11.1 `IntentEntry`

- **Responsabilité :** recueillir le but de l’utilisateur avant toute solution technique.
- **Données :** Intention scientifique, formulation libre, intention secondaire facultative, provenance utilisateur.
- **Profondeur :** niveaux 0 et 1.
- **Actions :** choisir, comparer deux descriptions, saisir « Autre objectif », demander de l’aide, clarifier.
- **États :** vide, brouillon, ambigu, multiple, suffisamment précisé.
- **Erreurs :** champ vide ou formulation incompatible ; jamais « mauvaise intention ».
- **Responsive :** cartes empilées à 320 px, grille au-delà ; une seule sélection active.
- **Accessibilité :** groupe nommé, boutons réels, sélection textuelle, exemples non dépendants du survol.
- **Dépendances :** PD-004 UX-01/07–10 ; Intention scientifique PD-003.
- **Interdit :** modalité, séquence, biomarqueur, constructeur, Reasoning Book ou Program comme entrée.

### 11.2 `ProjectContextSummary`

- **Responsabilité :** conserver question reformulée, population, objectif, phase et blocages majeurs.
- **Données :** Situation, Question, Objectifs, Contexte, Informations, Version de stratégie.
- **Profondeur :** niveau 0, niveau 1 sur demande.
- **Actions :** ouvrir le contexte, modifier un élément, revenir au point d’origine.
- **États :** complet pour la phase, partiel, à revoir, bloqué.
- **Erreurs :** donnée de résumé indisponible ou incohérente, avec source de l’écart.
- **Responsive :** barre/rail sur grand écran ; panneau intitulé et non disparu sur mobile.
- **Accessibilité :** région `aria-labelledby`, ordre stable, blocages annoncés.
- **Dépendances :** PD-004 UX-12/17/21 ; objets PD-003.
- **Interdit :** score global, pourcentage de progression ou conclusion non contextualisée.

### 11.3 `ReasoningProgressMap`

- **Responsabilité :** représenter les sept phases et leur état sans imposer un tunnel.
- **Données :** phase courante, états calculés, dépendances critiques, causes de réouverture.
- **Profondeur :** niveau 0.
- **Actions :** ouvrir une phase visitée, examiner un blocage, reprendre la prochaine action.
- **États :** non commencée, en cours, suffisamment renseignée, à revoir, bloquée.
- **Erreurs :** état de phase impossible à calculer ; retour vers dernier état cohérent.
- **Responsive :** rail latéral, barre horizontale ou sélecteur séquentiel selon largeur.
- **Accessibilité :** navigation nommée, étape courante avec texte, ordre logique, pas de couleur seule.
- **Dépendances :** PD-004 UX-19–24 ; décision de navigation PD-009.
- **Interdit :** pourcentage, état `PASS`, arborescence de documents ou navigation possédée par un rôle IA.

### 11.4 `KnowledgeStatePanel`

- **Responsabilité :** présenter l’état épistémique des informations utiles à la décision.
- **Données :** Informations de projet, Contributions, provenance, Besoins d’information, état canonique.
- **Profondeur :** niveaux 0–2.
- **Actions :** filtrer, ouvrir une information, corriger une provenance, répondre à un besoin.
- **États :** connu, supposé, inconnu projeté comme manquant, contradictoire, non applicable, obsolète ; non évaluable comme vue dérivée.
- **Erreurs :** état absent, provenance manquante ou conflit de version.
- **Responsive :** groupes séquentiels ; compte et libellé toujours visibles.
- **Accessibilité :** listes sémantiques, icône + texte, filtres clavier.
- **Dépendances :** PD-003 ; PD-004 UX-26–31.
- **Interdit :** `déclaré` comme état épistémique, suppression d’une contradiction, assimilation de l’inconnu à une erreur.

### 11.5 `MissingInformationPanel`

- **Responsabilité :** expliquer l’information manquante la plus utile et son impact décisionnel.
- **Données :** Besoin d’information, Décision affectée, caractère bloquant, responsable, réponses admises.
- **Profondeur :** niveaux 0 et 1 ; niveau 2 pour conditions de collecte.
- **Actions :** répondre, « Je ne sais pas », différer, demander une revue.
- **États :** ouvert, différé, satisfait, non obtenable, bloquant.
- **Erreurs :** question non reliée à une décision ou répétée sans nouvelle cause.
- **Responsive :** une question à la fois ; réponses empilées.
- **Accessibilité :** `fieldset`/`legend`, aide reliée, validation non destructive.
- **Dépendances :** PD-009 §§10–11 ; PD-004 UX-07/29/30.
- **Interdit :** question par curiosité, donnée inventée, obligation de répondre pour quitter.

### 11.6 `HypothesisCard`

- **Responsabilité :** rendre une Hypothèse compréhensible, réfutable et reliée à ses conséquences.
- **Données :** Hypothèse, objectifs, informations, statut, alternative, limites, provenance.
- **Profondeur :** niveaux 0–3.
- **Actions :** retenir comme hypothèse de travail, ajouter une concurrente, modifier, ouvrir preuves/limites.
- **États :** proposée, retenue, concurrente, à revoir, réfutée dans ce contexte, non évaluable.
- **Erreurs :** formulation non réfutable, contexte absent, doublon sémantique signalé.
- **Responsive :** cartes empilées ; comparaison basculable en vue linéaire.
- **Accessibilité :** titre autonome, statut textuel, relation à l’objectif explicitée.
- **Dépendances :** PD-003 ; corpus du scénario.
- **Interdit :** vérité automatique, causalité déduite d’une association ou suppression d’une hypothèse concurrente.

### 11.7 `StrategyOptionCard`

- **Responsabilité :** exposer une Option argumentée, son contexte, son effet et son renoncement.
- **Données :** Option, Recommandation de travail, Justification, Compromis, Incertitudes, Limites, alternative.
- **Profondeur :** niveaux 0–3.
- **Actions :** comparer, adapter, écarter avec justification, préparer une décision.
- **États :** exploratoire, mise en avant, alternative, conditionnelle, écartée, à revoir.
- **Erreurs :** justification ou contexte absent ; option non comparable.
- **Responsive :** trois cartes maximum en grille ; pile avec résumé commun sur mobile.
- **Accessibilité :** ordre décision/effet/incertitude/raison/détail, libellés autonomes.
- **Dépendances :** PD-004 UX-02/05/09–13 ; PD-009 §12.
- **Interdit :** « optimale », « garantie », classement universel ou décision implicite.

### 11.8 `ComparisonView`

- **Responsabilité :** comparer des Options dans un contexte et selon des critères communs.
- **Données :** options, critères, bénéfices, coûts, renoncements, limites, preuves, préférences humaines.
- **Profondeur :** niveaux 0–3.
- **Actions :** filtrer les différences, changer un critère humain, conserver un désaccord, ouvrir un détail.
- **États :** comparable, comparaison partielle, critère manquant, égalité persistante, non comparable.
- **Erreurs :** contextes incompatibles ou critère sans définition.
- **Responsive :** matrice sur large écran ; fiches par critère et repère d’option sur mobile/zoom.
- **Accessibilité :** en-têtes associés, caption, vue linéaire équivalente, navigation clavier.
- **Dépendances :** PD-004 UX-10/11/35/47/64 ; PD-009 §12.
- **Interdit :** score global, vainqueur artificiel ou simple nombre de références.

### 11.9 `EvidenceDrawer`

- **Responsabilité :** ouvrir la preuve liée à l’objet actif sans faire perdre le contexte.
- **Données :** objet source, justification, références, relation de preuve, contexte, localisateur, version, limites.
- **Profondeur :** niveau 3, précédé d’une chaîne niveau 1.
- **Actions :** comparer le contexte, ouvrir provenance, signaler un problème, fermer et restaurer le focus.
- **États :** disponible, partiel, non localisé, version obsolète, indisponible.
- **Erreurs :** lien cassé, version conflictuelle, source non accessible.
- **Responsive :** inspecteur latéral sur grand écran ; panneau pleine largeur non modal sur mobile.
- **Accessibilité :** titre, contrôle de fermeture nommé, piégeage de focus seulement si modal nécessaire, retour du focus.
- **Dépendances :** PD-004 UX-32–36 ; corpus officiel.
- **Interdit :** mention présentée comme soutien, source sans contexte ou volume comme force.

### 11.10 `LimitationCard`

- **Responsabilité :** placer la Limite au plus près de l’élément qu’elle borne.
- **Données :** Limite, portée, criticité, conséquence, mitigation, résidu, responsable.
- **Profondeur :** niveau 0 si critique ; niveaux 1–3 pour explication et preuve.
- **Actions :** traiter, accepter sous réserve, demander une revue, ouvrir le registre transversal.
- **États :** ouverte, mitigée, acceptée sous réserve, critique, résolue dans une nouvelle version.
- **Erreurs :** portée ou responsable absent.
- **Responsive :** texte essentiel jamais tronqué ; détail séquentiel.
- **Accessibilité :** libellé explicite, pas de couleur seule, ordre de lecture proche de l’objet.
- **Dépendances :** PD-004 UX-37–40.
- **Interdit :** limite critique repliée, minimisée ou supprimée après acceptation.

### 11.11 `ContradictionPanel`

- **Responsabilité :** conserver et expliquer deux éléments incompatibles sans élire un vainqueur artificiel.
- **Données :** Contradiction, éléments, sources, contextes, branche affectée, actions possibles.
- **Profondeur :** niveau 0 toujours visible ; niveaux 1–3 accessibles.
- **Actions :** demander une information, qualifier les contextes, conserver les positions, escalader.
- **États :** détectée, qualifiée, localisée, bloquante, sous revue, résolue par décision/version.
- **Erreurs :** faux conflit de contexte ou source inaccessible.
- **Responsive :** positions empilées avec comparateur de contexte.
- **Accessibilité :** titres « Position 1/2 », aucun axe gauche/droite porteur de valeur, annonce du blocage.
- **Dépendances :** PD-009 §13 ; PD-004 UX-35/41–44.
- **Interdit :** vote automatique, suppression d’une position ou message « corrigez votre erreur ».

### 11.12 `HumanDecisionPanel`

- **Responsabilité :** faire adopter, adapter, différer ou refuser une option par un humain habilité.
- **Données :** Décision, auteur/Acteur, Mandat, option, alternative, justification, réserves, date, impacts.
- **Profondeur :** niveaux 0–3.
- **Actions :** choisir, justifier, différer, demander une revue, enregistrer.
- **États :** en attente, brouillon, adoptée, différée, refusée, remplacée, à revoir.
- **Erreurs :** auteur ou Mandat absent, version conflictuelle, impacts non consultés.
- **Responsive :** choix et justification séquentiels ; action persistante non superposée.
- **Accessibilité :** objet de la décision dans le titre, erreurs proches, confirmation distincte si remplacement.
- **Dépendances :** PD-003 ; PD-004 UX-04/45/60 ; PD-009 §14.
- **Interdit :** adoption par NOXIA, auteur fictif, « protocole validé » ou effacement de l’alternative.

### 11.13 `ImpactSummary`

- **Responsabilité :** montrer les effets d’un changement amont avant confirmation.
- **Données :** événement, version avant/après, dépendances, éléments ajoutés/retirés/modifiés/inchangés, décisions affectées.
- **Profondeur :** niveaux 0–2 ; niveau 3 pour historique.
- **Actions :** ouvrir un impact, confirmer le changement, annuler, demander une revue.
- **États :** aucun impact, impact calculé, calcul partiel, conflit, revue requise.
- **Erreurs :** propagation indisponible ou version source absente.
- **Responsive :** résumé puis liste par catégorie ; jamais une matrice seule.
- **Accessibilité :** statut textuel, liste de changements, focus sur premier impact critique.
- **Dépendances :** PD-009 §8 ; PD-004 UX-22.
- **Interdit :** réécriture silencieuse d’une décision ou marquage global « tout invalidé » sans portée.

### 11.14 `ScientificReport`

- **Responsabilité :** projeter la version de stratégie et sa trace en une synthèse reconstructible.
- **Données :** question, contexte, hypothèses, informations, options, décisions, limites, preuves, non-évaluables, version.
- **Profondeur :** niveaux 0–3 via sommaire et ancres.
- **Actions :** naviguer, revenir à la décision source, ouvrir provenance, demander une revue.
- **États :** provisoire, partiel, consolidé pour démonstration, à revoir, non évaluable.
- **Erreurs :** section orpheline, décision source absente, conflit de version.
- **Responsive :** sommaire escamotable et lecture une colonne ; ancres accessibles.
- **Accessibilité :** titres hiérarchiques, langue, tableaux avec alternatives, liens nommés.
- **Dépendances :** Projection/Profil de projection PD-003 ; PD-004 UX-03/05/51.
- **Interdit :** correction de fond directement dans le rapport, export officiel, protocole ou statut validé.

### 11.15 `ProvenanceInspector`

- **Responsabilité :** exposer identité, version, date, localisateur et relation de provenance.
- **Données :** source, corpus, version, Program Owner, type de relation, contexte, fraîcheur.
- **Profondeur :** niveau 3.
- **Actions :** copier un identifiant, ouvrir l’objet autorisé, comparer des versions, revenir.
- **États :** complet, partiel, historique, obsolète, indisponible.
- **Erreurs :** identifiant ou localisateur non résolu.
- **Responsive :** définition/valeur empilées sous 768 px.
- **Accessibilité :** listes de description, valeurs copiables sans interaction au survol.
- **Dépendances :** PD-004 UX-36 ; Scientific Assertion Layer et Knowledge Graph comme contrats.
- **Interdit :** accès d’administration, modification de source ou statut de preuve inféré.

### 11.16 `ScientificFoundationBrowser`

- **Responsabilité :** donner un accès secondaire aux fondations mobilisées.
- **Données :** Program, Reasoning Book, Scientific Vision, Territory Links, Evidence Map, assertions disponibles et sources.
- **Profondeur :** niveaux 1–3.
- **Actions :** filtrer, ouvrir, revenir à la décision d’origine.
- **États :** disponible, partiel, corpus non admis, donnée absente, version historique.
- **Erreurs :** lien local cassé ou désaccord de version.
- **Responsive :** recherche et fiches ; aucune arborescence obligatoire.
- **Accessibilité :** repères de résultat, filtres nommés, retour de focus.
- **Dépendances :** PD-012/013, Territory, Catalog, Assertion Layer, Knowledge Graph et corpus.
- **Interdit :** devenir accueil, catalogue d’administration, navigation principale ou preuve de couverture du graphe.

### 11.17 `RecoveryPanel`

- **Responsabilité :** expliquer ce qui a échoué et permettre de reprendre sans perdre le travail valide.
- **Données :** dernier état cohérent, opération, erreur technique, éléments préservés, options de reprise.
- **Profondeur :** niveaux 0 et 1.
- **Actions :** réessayer, reprendre, consulter le préservé, signaler.
- **États :** hors ligne, délai dépassé, chargement interrompu, conflit récupérable.
- **Erreurs :** reprise elle-même impossible, alors escalade claire.
- **Responsive :** action essentielle immédiatement visible.
- **Accessibilité :** focus sur le titre, annonce `role=status` ou `alert` selon urgence, aucun rechargement forcé.
- **Dépendances :** PD-004 UX-41–45/50.
- **Interdit :** confondre panne et insuffisance scientifique ou promettre une sauvegarde non réalisée.

### 11.18 Composants d’état transversaux

| Composant | Responsabilité et données | Actions et états | Responsive/accessibilité | Contenu interdit |
|---|---|---|---|---|
| `EmptyState` | Expliquer l’absence attendue d’un objet et la prochaine action ; données : type, raison, prérequis | Créer, revenir ou demander une information ; vide initial/vide filtré/non applicable | Texte autonome, illustration facultative avec alternative | « Aucun résultat » interprété comme absence scientifique |
| `LoadingState` | Nommer l’opération et ce qui reste accessible ; données : objet, état, possibilité d’annuler | Annuler/quitter si durable ; initial/progressif/stagnant | Annonce polie, pas d’animation essentielle, mouvement réduit | Animation de pensée IA ou progression fictive |
| `PartialSuccessState` | Distinguer chargé, indisponible et à revoir | Continuer sur le préservé, réessayer, ouvrir les impacts | Résumé niveau 0, liste accessible | Succès global ou décision inchangée sans vérification |
| `NonEvaluableState` | Dire pourquoi aucune conclusion honnête n’est possible | Ajouter, différer, revue humaine, rapport provisoire | Blocage textuel, focus et action explicite | Échec utilisateur, score zéro ou conclusion négative |

---

## 12. États et erreurs

L’anatomie obligatoire de tout message est : **ce qui s’est produit ; pourquoi cela importe ; ce qui reste préservé ; ce que l’utilisateur peut faire ; ce qui nécessite une décision ou une revue humaine**.

| État | Ce qui s’est produit / importance | Préservé | Action utilisateur | Humain requis |
|---|---|---|---|---|
| Saisie invalide | Format ou champ requis inexploitable ; la question ne peut être instruite | Autres réponses et brouillon | Corriger avec exemple précis | Non, sauf sens scientifique ambigu |
| Information manquante | Inconnu requis pour une décision | Contexte et branches indépendantes | Répondre, « Je ne sais pas », différer | Oui si source ou expertise externe |
| Contradiction | Deux éléments incompatibles dans le même contexte | Les deux positions et branches non touchées | Qualifier, compléter, conserver, escalader | Souvent |
| Insuffisance scientifique | Corpus ou preuve insuffisant pour soutenir la conclusion | Question, hypothèses, lacune et sources | Borner la conclusion, rapport provisoire | Revue scientifique |
| Conflit de version | La décision vise une version différente de celle affichée | Les deux versions et modifications locales | Comparer, recharger, créer une nouvelle décision | Oui si arbitrage de fond |
| Conflit de droits | L’utilisateur ne possède pas le Mandat nécessaire | Lecture et brouillon non engageant | Demander l’accès ou transmettre | Acteur habilité |
| Défaillance technique | Une opération n’a pas abouti pour cause technique | Dernier état cohérent explicitement nommé | Réessayer, reprendre, signaler | Support si répétée |
| Chargement | Une projection est en cours d’ouverture | Travail courant | Continuer ailleurs ou annuler si possible | Non |
| Succès partiel | Une partie seulement est disponible | Objets chargés et décisions antérieures | Continuer sous réserve ou réessayer | Selon impacts |
| Échec récupérable | L’opération a échoué mais un état de reprise existe | Dernier état cohérent | Reprendre ou restaurer comme nouvelle version | Non par défaut |
| Non évaluable | Les conditions pour conclure ne sont pas réunies | Faits, inconnues et limites | Compléter, suspendre, rapporter sans conclure | Oui si la poursuite engage |
| Arrêt pour revue humaine | PD-009 ne permet plus une progression honnête | Tout l’état et la cause d’arrêt | Demander une revue ou suspendre | Oui, explicitement nommé |

Une inconnue, une contradiction ou une insuffisance scientifique utilise un vocabulaire scientifique. Seules les saisies de format et défaillances techniques sont présentées comme erreurs opérationnelles.

---

## 13. Progressive disclosure

| Profondeur | Contenu obligatoire | Ouverture | Composants principaux |
|---|---|---|---|
| Niveau 0 — Orientation | question, état, blocage, décision ou action immédiate | Toujours ouvert | ProgressMap, Summary, Limitation critique, NonEvaluable |
| Niveau 1 — Compréhension | justification courte, hypothèse, conséquence, compromis, alternative principale | Ouvert en standard et débutant | HypothesisCard, StrategyOptionCard, Review |
| Niveau 2 — Exécution | paramètres conceptuels, contrôles, dépendances et conditions d’application | Selon tâche et projection | ComparisonView, contexte, conditions de mesure |
| Niveau 3 — Traçabilité | sources, localisateurs, provenance, versions, historique | Fermé mais accessible en un geste | EvidenceDrawer, ProvenanceInspector, Foundations |

Le changement de niveau d’accompagnement modifie densité, vocabulaire, ordre d’ouverture et raccourcis. Il ne supprime jamais une limite, ne change aucun statut scientifique et ne produit pas une autre stratégie.

---

## 14. Responsive

| Largeur utile | Organisation | Navigation | Preuves/comparaison | Actions |
|---|---|---|---|---|
| 320–767 px | Une colonne ; résumé et inspecteur en panneaux identifiés | Sélecteur de phase séquentiel | Preuves pleine largeur ; comparaison par critère avec repère d’option | Une action principale persistante sans superposition |
| 768–1199 px | Colonne large ou deux zones temporaires | Carte compacte | Inspecteur escamotable ; matrice si conteneur suffisant | Barre d’action dans le flux |
| 1200–1599 px | Rail de phases + zone de travail + inspecteur contextuel | Carte complète | Matrice et preuve latérale | Action principale locale |
| ≥1600 px | Largeur de lecture plafonnée ; espace de comparaison supplémentaire | Identique, sans étirer le texte | Trois options ou projection Core Lab | Aucun contenu essentiel rejeté en périphérie |

Règles transversales : aucun défilement horizontal pour le contenu courant ; les vraies matrices possèdent une vue linéaire ; aucun hover requis ; le clavier et le tactile ont les mêmes possibilités ; le zoom 400 % déclenche une réorganisation équivalente, pas une version amputée.

---

## 15. Accessibilité

La cible de recette est WCAG 2.2 AA. Cette déclaration est un objectif à prouver, pas un résultat actuel.

- un `h1` unique, des régions nommées et une hiérarchie de titres sans saut arbitraire ;
- navigation complète au clavier et ordre de focus identique à l’ordre logique ;
- focus visible, non masqué par le bandeau ou une action persistante ;
- restauration du focus après fermeture d’un inspecteur ;
- HTML natif avant ARIA ; modèles WAI-ARIA APG uniquement lorsque nécessaire ;
- statut, sélection, criticité et progression portés par texte, structure et éventuellement icône, jamais couleur seule ;
- annonces `status` pour chargement/succès partiel et `alert` uniquement pour blocage nécessitant une attention immédiate ;
- erreurs reliées à leur champ et résumé de problèmes navigable ;
- tableaux avec caption, en-têtes et vue linéaire ; graphiques éventuels avec alternative textuelle complète ;
- cibles principales d’au moins 44 × 44 pixels CSS ;
- contraste conforme, y compris focus, texte secondaire et états désactivés ;
- préférence de mouvement réduit ; aucune animation nécessaire à la compréhension ;
- libellés d’actions autonomes et langue française déclarée ;
- tests automatiques complétés par clavier, lecteur d’écran, zoom 200/400 %, contraste, reflow 320 px et tactile.

---

## 16. Règles de microcopie

| Nature | Formulation conforme | Formulation interdite ou à borner |
|---|---|---|
| Proposition NOXIA | « NOXIA propose d’examiner cette option parce que… » | « NOXIA a choisi la meilleure option » |
| Source | « Les sources reliées soutiennent cette relation dans le contexte… » | « La littérature prouve… » sans portée |
| Hypothèse | « Hypothèse de travail à tester : … » | « Fait : … » |
| Manque | « Cette information manque pour comparer les options. » | « Vous avez oublié… » |
| Contradiction | « Deux éléments restent incompatibles dans ce contexte. » | « Une source est forcément erronée. » |
| Décision humaine | « Vous retenez cette option sous les réserves suivantes. » | « Option validée par NOXIA. » |
| Blocage | « La progression s’arrête ici tant que… » | « Réessayez plus tard » sans cause |
| Non évaluable | « Les données disponibles ne permettent pas de conclure. » | « Résultat négatif » |
| Revue | « Cette revue révèle des points à traiter ; elle ne valide pas le projet. » | « Revue réussie » |
| Rapport | « Rapport de démonstration, non évalué sous PD-011. » | « Protocole validé » |

Sont interdits sans autorité et preuve correspondantes : « protocole validé », « décision optimale », « choix certain », « solution garantie », « résultat prouvé ». Les boutons nomment leur effet : « Comparer les stratégies », « Ajouter cette hypothèse », « Enregistrer cette décision », « Demander une revue » ; jamais « OK », « Suite » ou « Confirmer » seuls.

---

## 17. Modèle de données fonctionnel minimal

### 17.1 Réutilisation de PD-003

| Besoin de vue | Objets ou relations PD-003 réutilisés | Projection du démonstrateur |
|---|---|---|
| Entrée | Situation de recherche, Intention scientifique | Formulation et famille d’intention |
| Compréhension | Question, Objectifs, Contexte, Information de projet | Résumé prudent et informations déclarées |
| Hypothèses | Hypothèse, Objectif, Dépendance | Cartes principales et concurrentes |
| Manques | Besoin d’information, Échange adaptatif, Décision affectée | Prochaine question utile |
| Stratégie | Option, Recommandation, Justification, Compromis | Option candidate et alternatives |
| Limites | Incertitude, Risque, Biais, Limite, Contradiction, Alerte | Registre local et transversal |
| Revue | Revue méthodologique, Contribution | Points satisfaits, réserves et arrêts |
| Décision | Décision, Acteur, Mandat | Choix humain attribué et daté |
| Changement | Événement d’évolution, Analyse d’impact, Dépendance, Version de stratégie | Différentiel aval |
| Rapport | Projection, Profil de projection, État de connaissance effectif | Rapport consolidé de démonstration |

### 17.2 Catégories techniques autorisées

Les structures suivantes sont des enveloppes de projection, pas de nouveaux objets métier : `ScenarioFixture`, `ViewProjection`, `CalculatedViewState`, `SessionDecisionDraft`, `ProvenancePointer`, `AvailabilityState`. Leurs identifiants doivent pointer vers des objets canoniques ou déclarer explicitement `DEMO_ONLY`.

### 17.3 Séparation des données

| Catégorie | Source | Règle d’affichage |
|---|---|---|
| Donnée officielle | Corpus, PD-013 ou autre autorité nommée | Version, date et source visibles |
| Projection de lecture | Transformation sans modification du fond | Étiquetée comme vue, reconstructible |
| Fixture de démonstration | Paquet versionné et borné | « Scénario préconfiguré » ; jamais capacité dynamique |
| État calculé | Règle de vue ou résultat simulé | Cause et entrées visibles ; jamais objet métier |
| Décision utilisateur | Session de démonstration | Auteur local explicite ; aucun Mandat institutionnel inventé |
| Provenance | Pointeur corpus/source/localisateur | Ouverture niveau 3 ; absence explicite si non disponible |
| Élément non disponible | Absence ou échec vérifié | `INDISPONIBLE`, jamais complété par inférence |

---

## 18. Usage des corpus et fixtures

Chaque fixture doit porter : identifiant stable, version, scénario, corpus et version, Program Owner, date d’état des connaissances, intention initiale, objets PD-003 projetés, décisions préconfigurées, variantes d’état, localisateurs de provenance, limites, interdictions et statut `DEMO_FIXTURE_NOT_DYNAMIC`.

La fixture n’extrait pas librement une phrase d’un Reasoning Book pour la transformer en assertion. Chaque élément narratif doit être soit un extrait localisé, soit une reformulation de lecture bornée portant son origine et ses limites. `SOUTIENT`, `RÉFUTE`, `QUALIFIE` et `MENTIONNE` ne sont affichés que lorsqu’une relation est explicitement établie dans le paquet ; aucune stance n’est inférée du simple fait qu’une référence est citée.

Le registre de fixtures contient exactement trois scénarios actifs à la version 1.1 de P-WEB-01 : RB-003 v1.0 sous `NXP-000001` v1.1, RB-004 v1.1 sous `NXP-000002` v1.2 et RB-005 v1.0 sous `NXP-000003` v1.1. Toute extension exige : corpus officiellement admis, Program Owner unique, revue documentaire, mise à jour du registre de fixtures, cas d’état non heureux, validation des localisateurs et mise à jour du présent document si le parcours ou les contrats changent.

PD-002 Fabry et PD-008 Myocardite restent des corpus consultés pour vérifier la structure et les portes de non-protocole. Ils ne sont pas des scénarios actifs de P-WEB-01. La fixture Fabry P0 existante reste technique et inchangée ; elle ne doit pas être enrichie silencieusement en paquet scientifique.

---

## 19. Intégration au site existant

### 19.1 État observé

Le site utilise une SPA avec bandeau institutionnel commun, routes publiques explicites, pages à métadonnées dédiées, route interactive `/connaissances` déjà séparée du sitemap, et tests protégeant routes et SEO. Aucune route Protocol Designer n’existe. `src/features/protocol-designer/` contient seulement la frontière P0, une fixture technique et des tests ; aucun fichier de production n’y est importé.

### 19.2 Décision cible

- ajouter ultérieurement une entrée de premier niveau « Protocol Designer » dans le bandeau, sans dépasser sept sections principales ;
- conserver « Accueil », « Expertise », « Prestations », « Projets », « Protocol Designer » et « Contact » comme six entrées visibles ;
- créer une page publique cohérente avec les pages institutionnelles existantes ;
- isoler l’interactif sous `/protocol-designer/demo` et fournir un retour « Revenir à NOXIA » ;
- ne pas placer le démonstrateur dans le méga-menu Expertise ni sous un Scientific Program ;
- distinguer la décision SEO de la page publique de celle de l’espace interactif ;
- maintenir l’interactif hors sitemap et `noindex, follow` tant qu’aucune décision différente n’est admise ;
- préserver header, footer, contrastes, typographie, espacements et primitives du site après audit d’accessibilité.

### 19.3 Sans JavaScript ou données indisponibles

Sans JavaScript, la page publique conserve titre, proposition de valeur, limites, parcours et informations de contact. Elle ne prétend pas exécuter la démonstration. Si un corpus ou un paquet scientifique est indisponible, le scénario concerné est désactivé avec version, cause, éléments préservés et possibilité de revenir ; aucun résultat de secours n’est inventé.

---

## 20. Dépendances d’implémentation

Ces dépendances décrivent des responsabilités à construire, sans imposer une API ou une technologie supplémentaire :

1. **admission de surface :** décision séparée pour routes, navigation, SEO, sitemap et métadonnées ;
2. **registre de scénarios :** trois fixtures versionnées, localisateurs vérifiés et statut de disponibilité ;
3. **adaptateur de projection PD-003 :** transforme les objets en vues sans créer de modèle concurrent ;
4. **navigation conforme PD-009 :** prochaine action, branches, états, arrêts et impacts ; pour le démonstrateur, résultats bornés et explicitement préconfigurés ;
5. **coquille UX PD-004 :** résumé, phases, zone de travail, inspecteur, rapport et reprise ;
6. **registre de provenance :** corpus, version, Program Owner, source et localisateur ;
7. **gestion de session :** brouillons, décisions locales, reprise et effacement explicite ;
8. **gestion des états :** catalogue complet de la section 12 ;
9. **accessibilité :** primitives auditées, annonces, focus, reflow et tests manuels ;
10. **observabilité respectueuse :** erreurs et performance sans contenu scientifique sensible ;
11. **tests de frontières :** aucune publication, aucun PASS, aucun protocole, aucune mutation de corpus ;
12. **recette de compréhension :** utilisateurs représentatifs, reformulation, limite principale et prochaine action.

Ordre recommandé : préserver P0 → admettre fixtures → implémenter la coquille et les états → connecter les projections → ajouter impacts et décision humaine → rapport → fondations → accessibilité et tests → admission interne. Cet ordre reste subordonné aux passes de PD-007 lorsqu’elles s’appliquent ; il ne vaut pas modification de PD-007.

---

## 21. Risques et compromis temporaires

| ID | Risque/compromis | Impact | Mesure de maîtrise | Propriétaire futur | Revue/expiration |
|---|---|---|---|---|---|
| R01 | Trois scénarios seulement | Peut suggérer une généricité plus large que démontrée | Nommer exactement le périmètre et la version | Product Governance | À chaque nouveau corpus admis |
| R02 | Fixtures préconfigurées | Peut être confondu avec un moteur dynamique | Badge « scénario préconfiguré », trace des réponses fixes | Lead implementation | Expire avec moteur démontré |
| R03 | Cinq entrées vs six familles S03 | Une famille moins visible | « Autre objectif » et test de trouvabilité | UX Governance | Revue conjointe PD-004/Product Spec |
| R04 | Décisions de session sans identité institutionnelle | Responsabilité réduite | « Décision de démonstration » et aucun Mandat inventé | Product Governance | Expire avec gestion d’identité admise |
| R05 | Fondations issues de corpus narratifs | Risque d’inférer une relation de preuve | Localisateurs obligatoires et relations explicites seulement | Scientific Governance | Avant toute fixture |
| R06 | Rapport visuellement convaincant | Peut être pris pour un protocole validé | Marquage permanent et termes interdits | UX + Scientific Governance | Permanent sans PASS |
| R07 | Matrices denses sur mobile | Perte de relations | Vue linéaire équivalente et tests 320 px/400 % | UX implementation | Avant recette |
| R08 | Site public et espace interactif proches | Confusion indexation/publication | Routes et statuts SEO distincts | SEO Governance | Avant mise en ligne |
| R09 | RB-004 a connu une révision 1.1 | Fixture périmée | Version verrouillée et alerte de conflit | Fixture owner | À chaque révision de corpus |
| R10 | RB-005 nouvellement admis | Risque de projection au-delà de son corpus ou de sa version | Fixture verrouillée sur RB-005 v1.0, localisateurs et interdits explicites | Registry Governance | À chaque révision du corpus ou de son Programme |
| R11 | P0 garantit aujourd’hui l’absence de code | Première implémentation cassera cette frontière | Mission explicite pour faire évoluer les tests P0 avec preuve | Implementation owner | Au démarrage du code |
| R12 | Aucun résultat PD-011 | Démo confondue avec validation | Mentions `NOT_EVALUATED_UNDER_PD011` et aucun claim de valeur mesurée | Evaluation Governance | Jusqu’à campagne PASS applicable |

---

## 22. Critères d’acceptation

### 22.1 Fonctionnels et UX

- **AC-01** Le premier écran fonctionnel demande une intention sans modalité, séquence, biomarqueur, Program ou Reasoning Book.
- **AC-02** Cinq entrées visibles maximum et une voie « Autre objectif » donnent accès aux familles restantes.
- **AC-03** Les sept phases canoniques sont visibles, nommées et réouvrables.
- **AC-04** Chaque zone active porte une question et une action principale.
- **AC-05** Le résumé stable reste accessible à toutes les largeurs.
- **AC-06** Aucun pourcentage d’avancement ou de confiance non calibré n’apparaît.
- **AC-07** Une information bloquante est visible au niveau 0 et conduit directement à son traitement.
- **AC-08** Un retour amont conserve les données et affiche un différentiel aval.
- **AC-09** Une stratégie affiche contexte, justification, alternative et limites.
- **AC-10** La comparaison n’utilise aucun score global et conserve l’égalité ou le désaccord.
- **AC-11** Toute décision structurante est explicitement humaine, attribuée et datée.
- **AC-12** Le rapport renvoie aux décisions et aux provenances sources ; aucune correction de fond n’y est autonome.

### 22.2 Science, corpus et gouvernance

- **AC-13** Exactement trois scénarios sont actifs : RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0.
- **AC-14** Le scénario RB-005 affiche `NXP-000003` v1.1, sa version, sa provenance et ses limites sans contenu extrapolé.
- **AC-15** Chaque contenu scientifique porte corpus, version, date et localisateur.
- **AC-16** Une citation ne reçoit aucune stance par inférence.
- **AC-17** Aucune fixture n’est présentée comme connaissance nouvelle ou calcul dynamique.
- **AC-18** Scientific Programs et Reasoning Books n’apparaissent que dans les fondations ou la provenance.
- **AC-19** Aucune assertion, source, relation, Program ou corpus n’est modifié par la démonstration.
- **AC-20** Aucun protocole, paramètre constructeur, recommandation clinique ou PASS PD-011 n’est produit.

### 22.3 États, accessibilité et responsive

- **AC-21** Les douze familles d’états de la section 12 possèdent un exemple testable.
- **AC-22** Une contradiction est distinguée d’une erreur de saisie et conserve les deux positions.
- **AC-23** Une non-évaluabilité expose cause, préservé, actions et revue humaine.
- **AC-24** Les trois scénarios sont réalisables à 320 px sans fonction essentielle absente.
- **AC-25** À 400 % de zoom, aucune action ou information n’est perdue et les matrices ont une vue linéaire.
- **AC-26** Toutes les actions sont utilisables au clavier avec focus visible et restauré.
- **AC-27** Les statuts, alertes et sélections sont compréhensibles sans couleur.
- **AC-28** Les changements dynamiques essentiels sont annoncés aux technologies d’assistance.
- **AC-29** Les cibles principales mesurent au moins 44 × 44 pixels CSS.
- **AC-30** La recette combine automatisation et tests manuels clavier, lecteur d’écran, zoom, contraste et tactile.

### 22.4 Site et frontières

- **AC-31** La page publique et l’espace interactif ont des statuts SEO distincts.
- **AC-32** L’interactif reste hors sitemap et ne revendique aucune publication scientifique.
- **AC-33** Sans JavaScript, la page publique reste utile et aucun résultat n’est simulé.
- **AC-34** Une donnée scientifique indisponible désactive le scénario concerné sans fallback inventé.
- **AC-35** Les routes, pages, SEO et tests existants restent inchangés jusqu’à la mission d’implémentation autorisée.
- **AC-36** L’intégration respecte le bandeau existant et ne dépasse pas sept entrées principales.
- **AC-37** Le démonstrateur est identifiable comme intermédiaire et non évalué.
- **AC-38** Un évaluateur peut comprendre la valeur, la limite principale et la responsabilité humaine sans lire le code.

---

## 23. Checklist de préparation de l’implémentation

### Gouvernance

- [ ] relire l’index courant et vérifier que P-WEB-01 reste admis ;
- [ ] vérifier versions PD-004, PD-009, PD-011, PD-013, RB-003, RB-004 et RB-005 ;
- [ ] confirmer que les trois scénarios actifs correspondent au registre et à la présente version ;
- [ ] nommer les propriétaires UX, science, fixture, accessibilité, SEO et recette ;
- [ ] documenter toute exception selon UX-68.

### Fixtures et contenu

- [ ] construire trois paquets versionnés sans modifier les Reasoning Books ;
- [ ] vérifier chaque localisateur et relation de preuve ;
- [ ] inclure heureux, manquant, contradiction, non-évaluable, conflit de version et reprise ;
- [ ] marquer tout contenu `DEMO_FIXTURE_NOT_DYNAMIC` ;
- [ ] faire relire les formulations scientifiques et les interdits.

### UX et interface

- [ ] prototyper les 17 vues et les quatre profondeurs ;
- [ ] tester cinq entrées + « Autre objectif » ;
- [ ] vérifier une question et une action principale par zone ;
- [ ] rendre les blocages visibles au niveau 0 ;
- [ ] concevoir la comparaison linéaire mobile ;
- [ ] vérifier la reprise, le différentiel et le retour de focus ;
- [ ] appliquer les microcopies autorisées.

### Site et technique

- [ ] obtenir une décision explicite avant toute route ou modification du header ;
- [ ] préserver et faire évoluer intentionnellement les tests de frontière P0 ;
- [ ] décider canonique, robots et sitemap séparément pour les deux surfaces ;
- [ ] définir la dégradation sans JavaScript ;
- [ ] isoler les données de session et prévoir leur effacement ;
- [ ] empêcher tout appel de publication ou mutation de corpus.

### Validation

- [ ] transformer AC-01 à AC-38 en tests ou preuves de recette ;
- [ ] exécuter les tests de routes, SEO, frontières et non-régression existants ;
- [ ] tester les trois scénarios avec médecins/chercheurs et un profil méthodologique ou Core Lab ;
- [ ] tester explicitement compréhension, limite principale et prochaine action ;
- [ ] réaliser clavier, lecteur d’écran, zoom 400 %, contraste, reflow 320 px et tactile ;
- [ ] consigner que la recette d’implémentation ne vaut pas PASS PD-011.

---

## 24. Validation finale des contrats

| Contract | Préservé ? | Preuve | Remarque |
|---|---|---|---|
| Entrée par l’intention | Oui | §§5, 7, 10.2 ; D01 ; AC-01/02 | Aucun Program, RB ou modalité en entrée |
| Parcours canonique | Oui | §§7–10 ; D02 ; AC-03 | Carte réouvrable, non tunnel |
| Programs et Reasoning Books secondaires | Oui | §§6, 9, 10.15, 11.16 ; AC-18 | Fondations et provenance seulement |
| Architecture interne non exposée | Oui | §§8–9, 17 | Les objets alimentent des projections utilisateur |
| Progressive disclosure | Oui | §§2, 13 | Quatre profondeurs conformes à UX-15–18 |
| Blocages critiques visibles | Oui | §§7.3, 10.9–10.12, 11.10–11.11 ; AC-07 | Niveau 0, jamais replié |
| Décision humaine explicite | Oui | §§7, 10.13, 11.12 ; AC-11 | Auteur, date, Mandat/portée |
| Preuves, limites, incertitudes | Oui | §§10.8–10.12, 11.9–11.11 | Accessibles depuis l’objet concerné |
| Mobile 320 px | Oui comme cible | §§14–15 ; AC-24 | À prouver lors de l’implémentation |
| WCAG 2.2 AA | Oui comme cible | §15 ; AC-25–30 | Aucune conformité actuelle revendiquée |
| Cible non présentée comme implémentée | Oui | En-tête, §§0.2, 19.1 | P0 reste `NOT_IMPLEMENTED` |
| Aucun contenu scientifique inventé | Oui | §§6, 17–18 ; AC-15–20 | Fixtures bornées aux corpus officiels |
| Trois scénarios officiels exacts | Oui | §§0.4 E06, 6, 18 ; AC-13/14 | RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 ; aucun quatrième scénario |
| PD-003 préservé | Oui | §17 | Aucun objet métier concurrent |
| PD-004 préservé | Oui | §§2, 13–16 | Aucune règle UX normative modifiée |
| PD-009 préservé | Oui | §§7–8, 20 | Navigation cible, aucun rôle IA propriétaire |
| PD-011 préservé | Oui | En-tête, §§3.2, 16, 22 | Aucun PASS, publication ou claim de validation |
| PD-012/PD-013 préservés | Oui | §§0.2, 6, 18 | Program Owners lus, aucun registre modifié |
| Corpus préservés | Oui | §§6, 18 | Aucune modification scientifique |
| Site existant préservé | Oui | §19 ; AC-35 | Aucune route, composant, sitemap ou métadonnée modifiés |
| Préparation suffisante | Oui | §§10–23 | Vues, composants, données, états, dépendances, recette et checklist définis |

---

## Décision de clôture

P-WEB-01 est admis comme **architecture de préparation NIVEAU_3, version 1.1**. Il fournit une base directement exploitable pour une mission ultérieure d’implémentation, sous réserve d’une autorisation distincte de modifier le site et de la vérification des versions documentaires alors courantes.

La création de ce document ne modifie ni la science, ni les normes, ni le registre des Scientific Programs, ni les Reasoning Books, ni le code, ni les routes, ni le SEO, ni la publication. Le Protocol Designer demeure `NOT_IMPLEMENTED` et `NOT_EVALUATED_UNDER_PD011`.
