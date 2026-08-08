# P-WEB-06C — Protocol Designer V1 — Industrial Closure

**Statut documentaire :** OFFICIAL  
**Niveau documentaire :** NIVEAU_3  
**Version :** 1.0  
**Date :** 8 août 2026  
**Nature :** rapport de stabilisation, de preuves techniques et de décision produit  
**Périmètre :** démonstrateur public Protocol Designer V1  
**Hors périmètre :** norme produit nouvelle, architecture nouvelle, moteur nouveau, évolution scientifique, PASS PD-011, publication ou déploiement

---

## 1. Résumé exécutif

P-WEB-06C ferme la première génération publique du Protocol Designer sans ajouter de fonctionnalité, de workflow, d’architecture, de moteur ou de contenu scientifique.

Trois défauts réels ont été reproduits et corrigés :

1. des statuts techniques non sécables provoquaient un débordement horizontal du rapport à 320, 390 et 768 px ;
2. une modification majeure confirmée perdait son marqueur lorsque Gemini échouait puis que l’utilisateur choisissait le repli local, ce qui empêchait l’invalidation explicite de la décision et du rapport antérieurs ;
3. une règle d’impression masquait le seul conteneur enfant de `#demo-main`, avec pour conséquence un PDF vide lorsque le rendu React était prêt.

Après correction :

- les six largeurs demandées ne présentent plus de débordement horizontal ;
- les changements majeurs invalident aussi les dépendances en mode dégradé ;
- l’impression ne masque plus le contenu principal ;
- deux PDF Chrome/Skia A4, final et provisoire, ont été produits et inspectés ;
- l’appel Gemini réel retourne HTTP 200 et un objet conforme au schéma 1.0 en français ;
- les 148 tests Protocol Designer passent ;
- la suite globale passe 644 tests sur 647, les trois seuls échecs étant les gardes du dépôt externe Editorial Engine déjà non propre ;
- typecheck, lint sans erreur, build, SEO, navigateur et `git diff --check` passent.

La preuve clavier manuelle fraîche est limitée par le backend du navigateur intégré, qui n’a pas propagé les événements Tab/Entrée malgré un focus DOM identifié. Aucun défaut clavier de l’application n’a été reproduit. La surface conserve des contrôles natifs, des styles `focus-visible`, les tests déterministes passent, et la preuve Chrome visible P-WEB-03C reste positive avec 58 observations de focus et zéro échec. Cette limite de moyen de preuve est conservée comme avertissement externe non bloquant.

---

## 2. Gouvernance documentaire

### 2.1 Nature exacte de la mission

La mission est une clôture industrielle produit et une campagne de preuve. Elle ne constitue :

- ni une norme ;
- ni un manifeste ;
- ni un Scientific Program ;
- ni un Reasoning Book ;
- ni un corpus scientifique ;
- ni une évaluation scientifique PD-011 ;
- ni une autorisation de publication ou de déploiement.

P-WEB-06 reste un snapshot historique exact avec la décision `PROTOCOL_DESIGNER_V1_NOT_READY`. Le présent rapport distinct décrit une campagne postérieure de levée de blocages. Il ne réécrit pas silencieusement P-WEB-06.

### 2.2 Principes établis

Les principes suivants sont conservés :

- NOXIA assiste le raisonnement ; l’utilisateur conserve la décision ;
- la conversation est le point d’entrée ;
- le LLM interprète et structure la langue, mais ne rend pas seul la réponse scientifique ;
- une question spécialisée demeure centrée sur son objet scientifique ;
- les absences, incertitudes, limites et refus restent visibles ;
- une projection de démonstration ne devient ni protocole clinique, ni recommandation, ni validation scientifique ;
- une modification majeure n’est jamais appliquée silencieusement ;
- un corpus local ne doit pas être remplacé par une réponse généraliste lorsque la couverture est insuffisante.

### 2.3 Références normatives

La lecture a été effectuée à partir de l’index de vérité, puis de la Charte fondatrice, du Scientific Product Manifesto, de la Product Specification et des autorités spécialisées applicables : PD-003, PD-004, PD-009, PD-011, PD-012, PD-013 et P-WEB-01.

P-WEB-03 et son addendum P-WEB-03C portent les preuves historiques de navigateur, clavier et impression. P-WEB-04R porte le Guided Scientific Intake. P-WEB-06 porte le snapshot conversationnel et sa décision historique. P-WEB-05 reste `CANDIDATE_NON_ADMIS`.

### 2.4 Corpus scientifiques

Les trois corpus mobilisés par le démonstrateur restent inchangés :

- RB-003 — Spectral Imaging, version 1.0 ;
- RB-004 — Cardiac MRI & Quantitative Cardiac Imaging, version 1.1 ;
- RB-005 — Neuro Perfusion & Metabolism Foundations, version 1.0.

Aucun Scientific Program, Reasoning Book, Territory Model, Knowledge Graph, Scientific Assertion Layer, Scientific Knowledge Catalog, corpus ou fixture scientifique n’a été modifié.

### 2.5 Cible

La cible de P-WEB-06C est une V1 stable et montrable publiquement, non une démonstration de toute la vision Clinical Research OS. La protection contre les abus demandée est explicitement minimale et raisonnable ; le mandat exclut une infrastructure distribuée complexe.

### 2.6 État réellement implémenté

L’état observé contient :

- une entrée conversationnelle libre ;
- une interprétation Gemini bornée par schéma ;
- un repli local explicite ;
- une revue humaine de la compréhension ;
- un matching local déterministe ;
- trois parcours `UNDERSTAND`, `FORMALIZE_IDEA` et `DESIGN_STUDY` ;
- des transitions conservant le contexte ;
- un Knowledge Explorer transversal ;
- des questions adaptatives avec justification, conséquence, suggestions, texte libre et réponse inconnue ;
- une construction de projet en huit étapes ;
- une décision humaine ;
- un rapport provisoire ou final à 42 sections ;
- un export Markdown et une impression PDF.

La « construction de protocole » demeure volontairement une construction de dossier de recherche. Aucun protocole d’acquisition exécutable n’est généré.

### 2.7 Hypothèses et contradictions non résolues silencieusement

| Sujet | Qualification | Traitement |
|---|---|---|
| P-WEB-06 conclut `NOT_READY` | snapshot historique | conservé ; P-WEB-06C apporte une décision postérieure distincte |
| P-WEB-05 est déclaré terminé par le prompt mais reste candidat non admis | contradiction documentaire | le statut gouverné reste `CANDIDATE_NON_ADMIS` |
| Le rate limiting n’est pas distribué | limite d’échelle | accepté pour la protection minimale explicitement demandée ; aucune prétention de robustesse multi-instance |
| Le navigateur intégré n’exécute pas Tab/Entrée de façon fiable | limite externe de preuve | preuve automatisée actuelle et preuve Chrome visible historique conservées ; aucun PASS manuel frais inventé |
| Trois tests globaux échouent | dépendance externe | qualifiés `BLOCKED_EXTERNAL`, sans correction du dépôt Editorial Engine |

---

## 3. État Git

### 3.1 Baseline NOXIA

| Élément | État initial |
|---|---|
| Racine Git | `/Users/charles/Documents/Projets/NOXIA/noxia-dev` |
| Branche | `main` |
| HEAD | `f4855bbf9dd6a17fc78604a788185c37de0b2ae1` |
| Écart avec upstream | `0 / 0` |
| Worktree initial | propre |

La mission n’a créé ni branche, ni commit, ni push, ni déploiement.

### 3.2 Dépôt Editorial Engine externe

Le dépôt `/Users/charles/Documents/Projets/editorial-engine`, HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, présentait 42 chemins modifiés ou non suivis avant et après la mission. Ces changements ne proviennent pas de P-WEB-06C. Le dépôt n’a pas été nettoyé, modifié ou réparé.

Qualification : `BLOCKED_EXTERNAL` pour les trois gardes de propreté qui en dépendent.

---

## 4. Corrections bornées

### 4.1 Responsive des statuts techniques

Défaut reproduit :

- 320 px : largeur documentaire 468 px ;
- 390 px : largeur documentaire 468 px ;
- 768 px : largeur documentaire 844 px.

Cause : les statuts tels que `NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE` ne pouvaient pas se couper dans les tags et certains contenus du rapport.

Correction : ajout d’un wrapping forcé uniquement sur les tags et le rapport. Aucun contenu, statut ou comportement métier n’a été modifié.

### 4.2 Modification majeure en mode dégradé

Défaut reproduit : après confirmation d’un changement de l’objet OEF vers T1 mapping/ECV, un échec de l’API suivi du repli local faisait perdre `MAJOR`. La compréhension changeait, mais la décision et le rapport antérieurs n’étaient pas invalidés.

Correction : le type de changement est conservé dès le début de l’analyse, avant tout appel externe. Un test de non-régression vérifie désormais que la décision devient `null`, que le rapport revient à `NONE` et que la réévaluation est annoncée.

### 4.3 Impression du conteneur principal

Défaut reproduit : la règle d’impression masquait `#demo-main > :first-child`, qui est l’unique conteneur enveloppant tout le parcours et le rapport. Le PDF de preuve avant correction ne contenait que les en-têtes et pieds de page Chrome.

Correction : suppression de ce seul sélecteur. Les éléments réellement non imprimables restent masqués par leurs classes `print:hidden` et par les sélecteurs dédiés au header, à la navigation et au footer.

---

## 5. Protection minimale contre les abus

| Contrôle | État | Preuve |
|---|---|---|
| Fréquence | 10 requêtes acceptées par minute et par identifiant client ; 11e réponse HTTP 429 | test serveur dédié, 10 appels fournisseur exactement |
| Taille HTTP | 12 000 octets maximum | test 413 avant appel fournisseur |
| Taille de question | 4 000 caractères maximum | contrat de schéma et interface |
| Nombre d’appels | un seul appel fournisseur par requête acceptée | test dédié `toHaveBeenCalledTimes(1)` |
| Origine | contrôle same-origin lorsque `Origin` et `Host` sont présents | contrat serveur |
| Données sensibles | blocage local avant fournisseur | test sans appel fournisseur |
| Secret | clé uniquement côté serveur, jamais renvoyée | tests succès et erreur |
| Cache | `cache-control: no-store` | réponse serveur |
| Timeout | 8 secondes par défaut | contrat et test d’erreur 504 |

Le compteur est en mémoire et n’est pas durable entre instances ou redémarrages. Cette limite est compatible avec le mandat de protection minimale du démonstrateur, mais elle ne doit pas être présentée comme une protection industrielle distribuée.

---

## 6. Conversation et parcours

### 6.1 Parcours spécialisé exécuté dans le navigateur

La question suivante a été utilisée :

> Je veux comprendre si la quantification de l’OEF en IRM peut distinguer une adaptation hémodynamique d’une ischémie chez des patients présentant une sténose carotidienne.

Résultats observés :

- le repli local a conservé la question après indisponibilité de l’endpoint local de développement ;
- l’orientation `UNDERSTAND` a été proposée ;
- l’objet OEF et le corpus Neuro-perfusion ont été conservés ;
- la réponse est restée centrée sur OEF, CBF/CBV/MTT/Tmax, OEF/CMRO₂ et les limites du corpus ;
- le Knowledge Explorer a été ouvert puis refermé sans perte de contexte ;
- la transition vers `FORMALIZE_IDEA` a conservé OEF ;
- la transition vers `DESIGN_STUDY` a conservé OEF ;
- les huit étapes Intention, Objectifs, Population, Matériel et méthodes, Imagerie, Statistiques, Budget et Documents ont été parcourues ;
- la décision humaine a été documentée ;
- le rapport final a conservé la question et l’objet OEF.

### 6.2 Modification majeure

La question a ensuite été remplacée par :

> Comparer le T1 mapping et l’ECV en IRM cardiaque dans une cohorte multicentrique.

Avant analyse, l’interface a annoncé explicitement la reconstruction de :

- la compréhension et l’objet scientifique central ;
- l’orientation vers le corpus local ;
- les questions et réponses adaptatives ;
- les options scientifiques discutées ;
- la décision humaine et le rapport.

Après correction du défaut de repli, cette invalidation est couverte par un test dédié. Le parcours cardiaque a ensuite produit un rapport cohérent avec T1 mapping/ECV et RB-004.

### 6.3 Couverture déterministe complémentaire

Les tests couvrent :

- la compréhension OEF/CMRO₂ ;
- la formalisation no-reflow ;
- la construction d’une étude CT spectral ;
- une demande volontairement vague ;
- l’absence de scénario supporté ;
- les changements mineurs et majeurs ;
- les transitions et la conservation de l’objet ;
- les huit étapes du projet ;
- les questions adaptatives et la réponse inconnue.

---

## 7. Responsive

Après correction, les mesures finales sont :

| Viewport | Largeur document | Débordement global | Sections du rapport | Objet conservé |
|---:|---:|---|---:|---|
| 320 | 320 | aucun | 42 | oui |
| 390 | 390 | aucun | 42 | oui |
| 768 | 768 | aucun | 42 | oui |
| 1024 | 1024 | aucun | 42 | oui |
| 1440 | 1440 | aucun | 42 | oui |
| 1920 | 1920 | aucun | 42 | oui |

Les rendus mobile et desktop ont été inspectés. Aucun élément scientifique ou contrôle essentiel n’est sorti du viewport après correction.

---

## 8. Clavier et accessibilité

### 8.1 État actuel

La surface utilise des contrôles HTML natifs : liens, boutons, textarea, input, select, summary/details. Le champ libre et les principaux contrôles portent des styles `focus-visible`. Les changements d’étape dirigent le focus vers le titre de compréhension lorsque l’interprétation est acceptée.

Les tests actuels confirment :

- contrôles natifs ;
- champ conversationnel étiqueté ;
- focus visible sur le texte libre ;
- dialogues Radix accessibles ;
- absence de radios ou checkboxes simulées non nommées ;
- parcours déterministes sans dépendance à une souris dans la logique métier.

### 8.2 Limite du rejeu manuel frais

Le navigateur intégré a identifié le focus DOM, mais ses commandes Tab, Maj+Tab, Entrée et Espace n’ont pas déplacé ou activé le focus de façon fiable. La même limite avait déjà été constatée lors de P-WEB-06. Elle empêche d’inventer un PASS manuel frais intégral.

La preuve Chrome visible P-WEB-03C demeure pertinente pour les fondations communes : 58 observations de focus, zéro échec, absence de piège, restitution du focus, dialogue et menu mobile. La surface P-WEB-06C conserve ces composants natifs et ses tests passent, mais son parcours conversationnel complet n’a pas reçu une seconde adjudication manuelle native indépendante dans cette passe.

Qualification : avertissement mineur de preuve externe, non défaut produit démontré.

---

## 9. Gemini et fonctionnement dégradé

| Contrôle | Résultat |
|---|---|
| Appel réel | HTTP fournisseur 200 |
| Contrat | schéma 1.0 |
| Langue | français |
| Quota 429 | mappé vers `QUOTA_EXCEEDED`, réessayable |
| Modèle absent | mappé vers `MODEL_UNAVAILABLE` |
| Erreur fournisseur | mappée vers `PROVIDER_ERROR` |
| Timeout | mappé vers `TIMEOUT` |
| JSON invalide | mappé vers `INVALID_PROVIDER_RESPONSE` |
| Repli | texte conservé et continuation locale explicite |
| Décision scientifique | aucune décision automatique du fournisseur |

Le quota Gemini reste une dépendance externe et temporaire. Il n’entraîne pas de perte de la question.

---

## 10. Impression et PDF

### 10.1 Artefacts produits

- `output/pdf/p-web-06c-protocol-designer-final-report.pdf` ;
- `output/pdf/p-web-06c-protocol-designer-provisional-report.pdf`.

Les contenus proviennent des rapports effectivement générés dans l’interface et copiés par le contrôle utilisateur. La projection PDF a été produite par Chrome 151 / Skia PDF m151, en A4, sans en-têtes ni pieds de page navigateur.

### 10.2 Contrôles

| PDF | Pages | Format | Sections | Texte extrait | Contrôle visuel |
|---|---:|---|---:|---:|---|
| final | 8 | A4 | 42/42 | 7 272 caractères | PASS |
| provisoire | 8 | A4 | 42/42 | 7 298 caractères | PASS |

Les seize pages ont été rendues en images puis inspectées. Les marges, titres, listes, statuts, questions, décision, limites, Evidence Map et livrables sont lisibles. Aucun texte tronqué, chevauchement, page vide, contrôle interactif ou contenu provenant d’un autre scénario n’a été observé. Les statuts techniques longs sont sécables.

Le bouton d’impression de l’application a également été déclenché sans erreur navigateur après correction. Le profil headless séparé ne partageant pas la session locale du navigateur intégré, les PDF probatoires ont été construits depuis le contenu de rapport réel copié par l’interface plutôt que depuis le stockage de session du profil headless.

---

## 11. Validations finales

| Validation | Résultat | Détail |
|---|---|---|
| Typecheck | PASS | aucune erreur |
| Lint | PASS_WITH_WARNING | 0 erreur, 7 avertissements Fast Refresh préexistants |
| Tests Protocol Designer | PASS | 148/148 |
| Tests protection minimale | PASS | taille, fréquence et nombre d’appels prouvés |
| Test majeur + repli | PASS | décision et rapport invalidés |
| Suite globale | BLOCKED_EXTERNAL | 644/647 ; trois seules gardes Editorial Engine externe |
| Build production | PASS | 1 812 modules transformés |
| Audit SEO | PASS | 40 pages, 0 erreur, 0 avertissement |
| Navigateur | PASS | trois parcours et transitions parcourus ; 0 erreur ou avertissement console |
| Responsive | PASS | 320/390/768/1024/1440/1920 sans overflow global |
| Gemini réel | PASS | HTTP 200, schéma 1.0, français |
| Impression | PASS | défaut de conteneur corrigé ; bouton sans erreur |
| PDF | PASS | 2 PDF, 16 pages inspectées, 42 sections chacun |
| `git diff --check` | PASS | aucune erreur d’espace |
| Commit/push/déploiement | PASS | aucune action |

Le build signale une base Browserslist ancienne de 14 mois et deux annotations `PURE` de `react-helmet-async` retirées par Rollup. Ces messages ne bloquent pas la construction et ne sont pas issus des corrections P-WEB-06C.

---

## 12. Qualité finale et défauts restants

### 12.1 Qualité finale

La valeur du produit est compréhensible dès l’accueil conversationnel : comprendre, formaliser ou construire un projet de recherche en imagerie, avec décision humaine et limites explicites. Les réponses restent spécifiques aux objets OEF, T1 mapping/ECV, no-reflow ou CT spectral selon la demande. Les transitions ne perdent pas le contexte. Le rapport sépare ce qui est disponible, inconnu, structurel ou non encore générable.

### 12.2 Défauts et limites restants

| Élément | Nature | Blocage public |
|---|---|---|
| Quota Gemini possible | externe | non, repli explicite |
| Editorial Engine externe non propre | externe | non pour le démonstrateur ; bloque seulement trois gardes globales |
| Rejeu clavier manuel frais limité par le navigateur intégré | externe de preuve | non, aucun défaut produit reproduit ; avertissement conservé |
| Rate limiting en mémoire | limite d’échelle acceptée par le mandat minimal | non pour cette V1 ; insuffisant pour une architecture distribuée |
| 7 avertissements lint Fast Refresh | dette préexistante | non |
| Base Browserslist ancienne | dette de maintenance | non |

Il ne subsiste aucun défaut local démontré empêchant une présentation publique du démonstrateur V1 dans son périmètre déclaré.

---

## 13. Décision

PROTOCOL_DESIGNER_V1_READY_WITH_MINOR_WARNINGS
