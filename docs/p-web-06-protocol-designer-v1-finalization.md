# P-WEB-06 — NOXIA Protocol Designer V1

## Finalisation du démonstrateur public

**Statut documentaire :** `RAPPORT_OFFICIEL`

**Nature :** rapport d’implémentation, de validation et de décision produit

**Niveau documentaire :** `NIVEAU_3`

**Version :** 1.0

**Source maîtresse :** présent fichier Markdown

**Date d’arrêt :** 8 août 2026

**Baseline Git initiale :** branche `main`, commit `2e5d1a92c0afe1c21dfa777a6912d32f62c49af4`, synchronisé avec `origin/main`, état propre

**Périmètre produit :** `/protocol-designer/demo`, objets d’intake et tests Protocol Designer

**Autorité scientifique revendiquée :** aucune

**PASS PD-011 revendiqué :** aucun

**Publication, commit, push ou déploiement :** aucun

---

## 0. Décision documentaire et règle de lecture

Le présent rapport est admis comme preuve officielle de niveau 3 de la passe P-WEB-06. Son admission documente l’implémentation observée, les validations exécutées, les limites et la décision de disponibilité. Elle ne transforme ni une fixture en corpus dynamique, ni un avertissement en preuve, ni un rapport produit en validation scientifique.

L’admission du rapport ne vaut pas admission rétroactive de P-WEB-05. Cette séparation est obligatoire parce que P-WEB-05 se déclare lui-même `CANDIDATE_NON_ADMIS`, alors que le mandat P-WEB-06 qualifie P-WEB-01 à P-WEB-05 d’« autorité produit ».

P-WEB-06 applique donc la règle explicite suivante :

- P-WEB-01, P-WEB-03/P-WEB-03C et P-WEB-04R restent les preuves et autorités admises de la baseline ;
- P-WEB-05 est traité comme entrée de mission imposée, mais son statut documentaire n’est pas réécrit ;
- seul son sous-ensemble V1 expressément répété par P-WEB-06 est implémenté : `UNDERSTAND`, `FORMALIZE_IDEA` et `DESIGN_STUDY`, continuité de contexte, questions adaptatives, transitions et exploration transversale ;
- les autres intentions, destinations et arbitrages de P-WEB-05 ne sont ni admis ni implémentés silencieusement.

## 1. Nature exacte de la mission

La mission est une mission d’implémentation et de clôture produit. Elle ne demande ni nouvelle architecture, ni nouveau moteur scientifique, ni nouvelle vision, ni extension du corpus.

Elle vise à transformer le Guided Scientific Intake P-WEB-04R en démonstrateur conversationnel spécialisé capable de :

1. comprendre une question scientifique ;
2. transformer une idée en question scientifique ;
3. construire progressivement un dossier de projet de recherche ;
4. passer d’un parcours à l’autre sans perdre le contexte ;
5. refuser honnêtement une couverture absente ;
6. conserver la décision scientifique du côté humain.

## 2. Plans de vérité séparés

| Plan | Sources ou faits applicables | Conséquence P-WEB-06 |
|---|---|---|
| Principes établis | Charte fondatrice ; Scientific Product Manifesto | dialogue comme interface ; science avant technologie ; transparence ; incertitude visible ; décision humaine |
| Références normatives | Product Specification ; PD-003 ; PD-004 ; PD-005 ; PD-009 ; PD-011 | intention avant technique ; objets canoniques préservés ; prochaine question gouvernée ; aucune validation scientifique implicite |
| Corpus scientifiques | RB-003 v1.0 ; RB-004 v1.1 ; RB-005 v1.0, via trois fixtures statiques admises | seules connaissances scientifiques projetables dans cette V1 |
| Cible | P-WEB-01 ; sous-ensemble V1 de P-WEB-05 répété par P-WEB-06 | trois parcours conversationnels, contexte continu, exploration transversale, avertissement de modification majeure |
| État réellement implémenté au départ | P-WEB-04R : interprétation Gemini bornée, validation humaine, matching lexical de trois scénarios, cinq questions locales, session locale, rapport à 42 sections | baseline remplacée seulement dans les limites de la mission |
| État réellement implémenté à l’arrêt | session v4, trois intentions, trois espaces de travail, transitions, objet scientifique conservé, questions conversationnelles, projet en huit étapes, Knowledge Explorer transversal, rapport contextualisé | détaillé et testé dans les sections suivantes |
| Hypothèses non démontrées | résistance à l’abus en environnement distribué ; comportement à charge publique ; valeur clinique ou scientifique externe ; couverture générale de l’imagerie | ne peuvent pas soutenir une autorisation publique |

## 3. Contradictions et arbitrages non silencieux

| ID | Contradiction ou tension | Qualification | Traitement explicite |
|---|---|---|---|
| C01 | P-WEB-05 est déclaré autorité par la mission, mais son fichier reste `CANDIDATE_NON_ADMIS` | contradiction de gouvernance | sous-ensemble répété par P-WEB-06 appliqué ; P-WEB-05 reste non admis |
| C02 | La mission demande « construire un protocole » ; P-WEB-04R et les connaissances exécutables actuelles interdisent d’inventer séquences, timings, paramètres, puissance ou budget | contradiction de capacité | la V1 construit un dossier de projet en huit étapes et conserve explicitement les sections non générables ; elle ne prétend pas produire un protocole d’acquisition exécutable |
| C03 | P-WEB-04R bloque l’activation publique faute de test Gemini réel et de protections d’abus distribuées | blocage historique à réévaluer | le test Gemini réel est désormais positif ; la protection distribuée reste absente et n’est pas reclassée silencieusement |
| C04 | Le changement de parcours doit préserver le contexte ; une modification majeure doit invalider des dépendances | tension entre continuité et cohérence | les transitions conservent le contexte ; une modification majeure exige confirmation puis invalide uniquement les éléments dépendants affichés |
| C05 | Les réponses doivent être spécialisées ; les fixtures restent très bornées | risque de réponse générique ou d’invention | le terme scientifique exact reste l’objet central ; absence de couverture = refus explicite sans substitution encyclopédique |
| C06 | Une preuve clavier intégrale existe pour P-WEB-03C, mais la surface P-WEB-06 introduit de nouveaux contrôles | preuve héritée non suffisante seule | contrôles natifs et tests automatisés rejoués ; parcours manuel souris/navigateur exécuté ; rejeu clavier intégral du nouvel écran conservé comme limite de validation |

## 4. Périmètre de modifications

### 4.1 Modifié

- modèle de session du démonstrateur ;
- orchestration locale des trois intentions de parcours ;
- conservation des termes et relations scientifiques ;
- matching lexical de spécialités déjà couvertes ;
- questions adaptatives et leur présentation ;
- page `/protocol-designer/demo` ;
- rapport contextualisé ;
- tests Protocol Designer.

### 4.2 Non modifié

- documents scientifiques ;
- Reasoning Books ;
- Scientific Programs ;
- Scientific Territory Model ;
- Scientific Knowledge Graph ;
- corpus scientifiques ;
- Editorial Engine ;
- routes publiques, sitemap et surface `/connaissances` ;
- architecture de déploiement ;
- configuration fournisseur ;
- données patient ou données réelles.

## 5. Implémentation

### 5.1 Session et contexte scientifique

Le schéma de session passe de 3.0 à 4.0. La clé et la version de fixtures changent afin qu’une session historique incompatible ne soit jamais reprise comme si elle satisfaisait le nouveau contrat.

Le contexte de session conserve :

- question originale ;
- reformulation validée ;
- intention de parcours ;
- confiance et motifs d’orientation ;
- objet scientifique central ;
- termes scientifiques exacts ;
- relations détectées ;
- hypothèses de travail issues de la fixture confirmée ;
- informations manquantes ;
- réponses adaptatives ;
- décision humaine ;
- version de contexte ;
- historique des transitions ;
- étape courante du projet.

Le contexte est persisté localement uniquement si les gardes de confidentialité ne détectent pas de donnée sensible.

### 5.2 Frontière LLM / NOXIA

Le contrat P-WEB-04R est conservé : le modèle interprète la langue et produit une structure bornée. Il ne rédige pas la réponse scientifique et ne choisit pas une conduite.

Après validation humaine :

1. NOXIA détermine localement l’intention de parcours à partir de la demande et des champs confirmés ;
2. NOXIA rapproche localement la demande des trois fixtures admises ;
3. l’utilisateur confirme le parcours et le corpus ;
4. NOXIA projette uniquement les construits, hypothèses, stratégies, preuves et limites de cette fixture.

### 5.3 Objet scientifique spécialisé

Une liste bornée de termes spécialisés permet de préserver leur graphie et leur place dans la demande. Les cas couverts incluent notamment :

- no-reflow et obstruction microvasculaire ;
- ECV et T1 mapping ;
- OEF et CMRO₂ ;
- CT spectral, dual energy, photon counting et K-edge.

Lorsque plusieurs termes explicitement liés sont présents, l’objet central conserve le couple au lieu de réduire la demande à un mot. Une demande OEF/CMRO₂ reste donc centrée sur OEF et CMRO₂ jusqu’au rapport.

### 5.4 Parcours 1 — Knowledge Assistant

L’espace « Comprendre une question scientifique » affiche :

- l’objet exact conservé ;
- une réponse construite à partir de la compréhension de la fixture ;
- les distinctions scientifiques utiles ;
- les limites que NOXIA refuse de simplifier ;
- la carte des preuves via le service transversal ;
- les questions encore nécessaires ;
- des transitions vers formalisation ou construction de projet.

La réponse reste bornée au corpus confirmé. Aucun élargissement encyclopédique automatique n’est produit.

### 5.5 Parcours 2 — Scientific Thinking Assistant

L’espace « Transformer une idée en question scientifique » affiche :

- une question candidate construite à partir des seules informations disponibles ;
- les inconnues conservées comme inconnues ;
- des hypothèses de la fixture étiquetées « candidates » et non validées ;
- des questions adaptatives centrées sur objectif, phénomène et contexte ;
- le passage réversible vers compréhension ou construction de projet.

Aucune hypothèse n’est adoptée par NOXIA.

### 5.6 Parcours 3 — Research Protocol Designer

L’espace « Construire un projet de recherche » présente une progression explicite :

1. Intention ;
2. Objectifs scientifiques ;
3. Population ;
4. Matériel et méthodes ;
5. Imagerie ;
6. Statistiques ;
7. Budget ;
8. Documents.

Chaque étape affiche les informations connues, les informations manquantes et les questions pertinentes. Les étapes Statistiques, Budget et Imagerie conservent leurs limites : aucun test, effet attendu, calcul de puissance, coût, séquence, timing ou paramètre n’est inventé.

Le libellé `TIMING_NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE` reste visible lorsque la temporalité n’est pas exécutable.

### 5.7 Questions adaptatives

Chaque question affiche :

- « Question X sur environ N » avec décompte dynamique ;
- le bloc décisionnel ;
- pourquoi la question est posée ;
- ce qu’elle influence ;
- des réponses suggérées ;
- « je ne sais pas » ;
- une réponse libre ;
- la conséquence enregistrée.

Les questions déjà couvertes par des champs confirmés ne sont pas reposées.

### 5.8 Modifications mineures et majeures

Une reformulation proche est classée mineure et peut conserver l’orientation compatible.

Un changement de domaine ou une divergence sémantique importante déclenche un avertissement avant réanalyse. L’interface énumère alors :

- compréhension et objet central ;
- orientation vers le corpus ;
- questions et réponses ;
- options scientifiques ;
- décision humaine et rapport.

L’utilisateur choisit soit de reconstruire ces éléments, soit de conserver le projet courant.

### 5.9 Knowledge Explorer transversal

L’exploration n’est plus une destination indépendante dans ce parcours. Depuis l’espace scientifique, un panneau transversal affiche :

- l’objet exploré ;
- les construits ;
- les limites ;
- la carte des preuves ;
- la version du Reasoning Book.

La fermeture rend le même parcours, la même étape et le même contexte.

### 5.10 Rapport

Le rapport conserve 42 sections et quatre états de livrables. Il inclut désormais :

- version du contexte ;
- intention de parcours ;
- objet central ;
- transitions entre parcours ;
- invalidations ;
- sources et versions ;
- éléments non générables.

## 6. Microcopie et perception produit

Le premier écran se présente comme une conversation avec un assistant scientifique. Il explique immédiatement :

- les trois formes d’aide ;
- la séparation modèle / NOXIA ;
- la conservation de la décision humaine ;
- l’interdiction de saisir des données sensibles ;
- l’absence d’avis médical ou de recommandation clinique.

La revue des 19 champs n’est plus la surface principale. Les éléments repérés sont résumés ; le détail de correction reste disponible à la demande.

## 7. Corrections apportées pendant la passe

| ID | Défaut observé ou risque | Correction | Preuve |
|---|---|---|---|
| PWEB06-D01 | entrée perçue comme formulaire | bulle d’accueil, question libre, vocabulaire conversationnel, détails structurés repliés | navigateur 320 et 1 440 px |
| PWEB06-D02 | aucune distinction entre trois usages | taxonomie V1 explicite et espaces spécialisés | tests de routage et parcours navigateur |
| PWEB06-D03 | contexte perdu lors d’un changement | contexte versionné et transitions historisées | test Understand → Formalize et navigateur trois parcours |
| PWEB06-D04 | réponses adaptatives limitées à un select | boutons suggérés, inconnu, texte libre, motif et impact | tests P-WEB-06 |
| PWEB06-D05 | changement majeur invalidé sans avertissement préalable | évaluation mineur/majeur et dialogue d’impacts | test unitaire et navigateur |
| PWEB06-D06 | Knowledge Explorer indépendant | panneau transversal avec retour au parcours | test navigateur |
| PWEB06-D07 | termes spécialisés insuffisamment rapprochés | extension bornée du matching cardiaque et préservation de termes multi-domaines | tests no-reflow, OEF/CMRO₂, CT spectral |
| PWEB06-D08 | document imprimé avec titres orphelins dans le contrôle PDF | ajustement du rendu QA et nouveau contrôle des quatre pages | inspection visuelle page par page |

## 8. Validations automatisées

| Validation | Résultat | Preuve ou réserve |
|---|---|---|
| Typecheck | `PASS` | aucune erreur |
| Lint | `PASS_WITH_WARNING` | 0 erreur ; 7 avertissements Fast Refresh préexistants dans des composants UI hors périmètre |
| Build production | `PASS_WITH_WARNING` | 1 812 modules ; avertissements Browserslist et annotations de dépendance non bloquants |
| Tests Protocol Designer | `PASS` | 145/145, 7 fichiers |
| Tests P-WEB-06 dédiés | `PASS` | 9/9 |
| Contrats P-WEB-02/P-WEB-03/P-WEB-04R | `PASS` | inclus dans les 145 tests |
| Tests serveur intake | `PASS` | 26/26 inclus |
| Suite globale | `BLOCKED_EXTERNAL` | 641/644 ; trois échecs exclusivement causés par l’état non propre préexistant de `/Users/charles/Documents/Projets/editorial-engine` |
| Gemini réel | `PASS` | HTTP fournisseur 200 ; schéma 1.0 ; langue française |
| `git diff --check` | `PASS` | aucune erreur |

Les trois échecs globaux portent sur les gardes « Editorial Engine clean ». L’état observé du dépôt externe comprend des fichiers modifiés et non suivis antérieurs à la présente mission. Aucune tentative de nettoyage, de restauration ou de modification n’a été effectuée.

## 9. Validations navigateur, responsive, clavier et impression

### 9.1 Navigateur

- page chargée à `/protocol-designer/demo` ;
- titre et microcopie P-WEB-06 présents ;
- aucune erreur console ;
- parcours local de repli opérationnel lorsque l’endpoint Vite local ne sert pas l’API ;
- rapport provisoire de 42 sections généré ;
- objet « CT spectral » conservé jusqu’au rapport.

### 9.2 Responsive

| Largeur | Résultat | Observation |
|---:|---|---|
| 320 px | `PASS` | largeur de document = largeur de viewport ; aucune fuite horizontale ; hiérarchie lisible |
| 768 px | `PASS` | aucune fuite horizontale |
| 1 440 px | `PASS` | aucune fuite horizontale ; mise en page conversationnelle cohérente |

### 9.3 Clavier

Les contrôles nouveaux utilisent des éléments natifs `button`, `input`, `textarea`, `select` et `details`. Les tests automatisés vérifient l’existence des contrôles, les labels, les états pressés et les styles de focus. La preuve P-WEB-03C conserve le statut historique de 58 observations sans échec sur la génération précédente.

Le rejeu intégral sans souris du nouvel écran P-WEB-06 n’a pas pu être adjudicativement reproduit avec l’outil navigateur embarqué, dont la synthèse de `Tab` ne déplaçait pas le focus. Cette limite n’est pas convertie en `PASS` manuel.

### 9.4 Impression

- le bouton d’impression déclenche `window.print()` ;
- le rapport provisoire comporte 42 sections ;
- un PDF QA A4 de quatre pages a été généré depuis le contenu copié du rapport ;
- présence de CT spectral, section 42, avertissement PD-011 et états non générables contrôlée par extraction ;
- quatre pages sur quatre rendues et inspectées ;
- aucune page vide, aucun chevauchement, aucune coupe de titre orpheline après correction.

Ce PDF QA valide le contenu et la pagination documentaire. Il ne constitue pas une nouvelle preuve Chrome/Skia de la feuille CSS d’impression de l’application. Les deux PDF P-WEB-03C restent les preuves archivées de cette chaîne historique.

## 10. Cas manuels requis

| Cas | Donnée d’essai | Résultat |
|---|---|---|
| 1. Question scientifique | différence OEF / CMRO₂ | `PASS` — intention UNDERSTAND, neuro-perfusion, objet spécialisé conservé |
| 2. Formalisation d’idée | transition depuis OEF / CMRO₂ | `PASS` — question candidate et hypothèses non validées visibles |
| 3. Création de protocole | étude multicentrique en CT spectral | `PASS_WITH_SCOPE_LIMIT` — dossier en huit étapes construit ; aucun protocole d’acquisition inventé |
| 4. Transition entre les trois | Understand → Formalize → Design | `PASS` — objet et contexte conservés, version de contexte incrémentée |
| 5. Modification majeure | OEF/CMRO₂ vers CT spectral | `PASS` — avertissement et liste d’impacts avant reconstruction |
| 6. Question très spécialisée | OEF/CMRO₂ ; contrôles automatisés no-reflow et ECV/T1 | `PASS` — terme conservé, réponse centrée, fixture pertinente |
| 7. Question volontairement vague | recherche en imagerie sans phénomène | `PASS` — absence de scénario, aucune connaissance forcée |
| 8. Aucun scénario supporté | domaine hors trois fixtures | `PASS` — refus explicite, aucun bouton de confirmation de scénario |

## 11. Sécurité, confidentialité et activation publique

Les gardes P-WEB-04R restent présentes :

- détection locale de motifs sensibles ;
- taille maximale ;
- méthode et type de contenu ;
- contrôle d’origine ;
- réponse `no-store` ;
- timeout ;
- erreurs fournisseur bornées ;
- limite en mémoire de dix requêtes par minute et par identifiant client ;
- clé Gemini uniquement côté serveur.

Le test Gemini réel lève le défaut historique « aucun JSON fournisseur validable ». Il ne lève pas l’autre cause de blocage : le compteur en mémoire n’est pas un contrôle distribué et durable. Une multiplication d’instances ou un redémarrage peut remettre les compteurs à zéro.

P-WEB-06 interdit d’inventer une nouvelle architecture et n’autorise aucun déploiement. Aucune protection distribuée n’a donc été ajoutée, configurée ou démontrée.

## 12. Limitations restantes

### 12.1 Bloquantes pour une démonstration publique revendiquée

1. absence de limitation d’abus distribuée ou de preuve équivalente ;
2. parcours « construire un protocole » limité à un dossier structuré, faute de connaissances exécutables validées ;
3. rejeu clavier manuel intégral de la nouvelle surface non adjudicatif ;
4. absence de nouveau PDF Chrome/Skia de la feuille CSS d’impression P-WEB-06.

### 12.2 Non bloquantes pour une démonstration locale contrôlée

- fixtures statiques et datées du 3 août 2026 ;
- trois domaines seulement ;
- session locale, mono-navigateur et non collaborative ;
- endpoint API absent du serveur Vite local simple ; le repli local est volontairement sans interprétation automatique ;
- avertissements lint et build préexistants ;
- trois gardes globales bloquées par le dépôt externe non propre.

### 12.3 Limites scientifiques obligatoires

- aucune recommandation clinique ;
- aucun avis médical ;
- aucun protocole clinique ou paramètre constructeur ;
- aucun résultat, seuil, coût ou effet attendu inventé ;
- aucun PASS PD-011 ;
- aucune revue scientifique humaine revendiquée ;
- aucune publication.

## 13. Parcours utilisateur final

1. l’utilisateur décrit librement une question, une idée ou un projet ;
2. le modèle propose une interprétation linguistique bornée ;
3. l’utilisateur valide la reformulation et les éléments repérés ;
4. NOXIA propose une intention et un corpus, distinctement ;
5. l’utilisateur confirme ou corrige ;
6. il entre dans l’un des trois espaces spécialisés ;
7. les questions restantes sont posées par blocs avec motif, impact, suggestions, texte libre et inconnu ;
8. il peut explorer un concept puis revenir sans perte ;
9. il peut changer de parcours avec conservation du contexte ;
10. une modification majeure exige une confirmation de reconstruction ;
11. il documente sa décision ;
12. il obtient un rapport de session distinguant disponible, manquant, limité et non générable.

## 14. État du démonstrateur

L’implémentation P-WEB-06 constitue une amélioration fonctionnelle nette et démontrée de la V1 locale : elle ne se présente plus principalement comme un formulaire, expose trois usages cohérents, conserve le contexte et répond de manière spécialisée dans les limites des trois fixtures.

Elle ne peut cependant pas être qualifiée de prête pour une démonstration publique au sens strict du mandat. Le test Gemini réel est positif, mais la protection d’abus distribuée reste absente et la capacité « construire un protocole » demeure une construction de dossier, non une génération de protocole exécutable. Les preuves clavier et impression intégrales de la nouvelle surface restent également incomplètes.

## 15. Fichiers livrés ou modifiés

- `src/pages/ProtocolDesignerDemo.tsx` ;
- `src/features/protocol-designer/intake/types.ts` ;
- `src/features/protocol-designer/intake/session.ts` ;
- `src/features/protocol-designer/intake/journey.ts` ;
- `src/features/protocol-designer/intake/questions.ts` ;
- `src/features/protocol-designer/intake/scenarios.ts` ;
- `src/features/protocol-designer/intake/report.ts` ;
- `src/features/protocol-designer/__tests__/p-web-06-v1.test.tsx` ;
- `docs/p-web-06-protocol-designer-v1-finalization.md` ;
- `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`.

Les artefacts temporaires de contrôle PDF restent sous `tmp/`, répertoire ignoré, et ne constituent pas des livrables gouvernés.

## 16. Décision finale unique

**`PROTOCOL_DESIGNER_V1_NOT_READY`**
