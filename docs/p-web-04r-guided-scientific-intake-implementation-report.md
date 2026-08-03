# P-WEB-04R — Guided Scientific Intake

## Rapport d’implémentation

**Statut documentaire :** OFFICIAL  
**Niveau documentaire :** NIVEAU_3  
**Version :** 1.0  
**Source maîtresse :** présent fichier Markdown  
**Date d’état :** 3 août 2026  
**Baseline :** branche `main`, commit `8fd2c79ef299e4144d69e0df276f081b56eb6aa9`  
**Portée :** implémentation, validation et limites de la tranche P-WEB-04R  

---

## 1. Décision de mission

La tranche verticale est implémentée et démontrable localement en mode dégradé déterministe. La frontière serveur, le contrat JSON strict, la validation humaine, le matching local, les questions adaptatives, la session versionnée et le rapport contextualisé existent.

L’activation publique demeure bloquée : les appels réels ont confirmé l’existence du modèle et le fonctionnement d’une sortie structurée minimale, mais aucun appel complet n’a encore livré un objet métier validable. Le contrat initial a rencontré la limite de complexité du schéma fournisseur ; le contrat compact final a ensuite rencontré le quota HTTP 429. La limitation de débit en mémoire est en outre une protection de démonstration, pas un contrôle d’abus distribué.

Ce résultat n’est ni un PASS PD-011, ni une validation scientifique, ni une autorisation de publication ou de déploiement.

## 2. Nature de la réorientation produit

Le point d’entrée n’est plus la sélection d’une intention puis d’une fixture. Il devient une question scientifique libre, suivie d’une compréhension linguistique vérifiable, d’une validation humaine et d’une orientation locale.

La réorientation ne modifie pas les trois corpus, leurs propriétaires, leurs versions ou leurs contenus. Elle change uniquement la manière de construire une session de démonstration à partir d’une demande utilisateur.

## 3. Documents consultés

| Nature | Autorités et preuves consultées | Usage dans la mission |
|---|---|---|
| Principes établis | Charte fondatrice ; Scientific Product Manifesto | Indépendance du raisonnement, priorité à la question et refus des décisions cachées |
| Références normatives | Product Specification ; PD-003 ; PD-004 ; Manuel UX ; PD-005 ; PD-007 ; PD-009 ; PD-011 ; PD-012 ; PD-013 | Objets, UX, navigation, admission, évaluation et frontières |
| Corpus scientifiques | Scientific Territory Model ; Scientific Knowledge Catalog ; Scientific Assertion Layer ; Scientific Knowledge Graph ; RB-003 ; RB-004 ; RB-005 | Trois projections locales bornées et leurs versions |
| Architecture cible | P-WEB-01 v1.1 | Trois scénarios déterministes et exigences du démonstrateur |
| État antérieur observé | P-WEB-02 ; P-WEB-03 | Défauts initiaux, corrections et gardes de régression |
| Consolidation historique | P17 | Identité et statut des Programmes et Reasoning Books |
| Frontière externe | `editorial-engine/docs/architecture-manifesto.md` | Vérification d’indépendance uniquement ; aucune intégration dans P-WEB-04R |
| Implémentation courante | code, tests, build et validations navigateur de la présente mission | Preuve de ce qui fonctionne effectivement |

La décision `NOT_READY_FOR_P_WEB_04` de P-WEB-03 reste un snapshot historique exact de sa passe. Elle n’est pas réécrite. P-WEB-04R constitue une tranche postérieure distincte et ne transforme pas rétrospectivement les contrôles alors non exécutés en succès.

## 4. Baseline Git

- Branche initiale : `main`.
- HEAD initial : `8fd2c79ef299e4144d69e0df276f081b56eb6aa9`.
- Sujet : `test(protocol-designer): close P-WEB-03 evidence`.
- Écart initial à `origin/main` : 0 avance, 0 retard.
- Fichiers modifiés initiaux : aucun.
- Fichiers non suivis initiaux : aucun.
- Tâche concurrente visible sur le périmètre : aucune.
- Commit, push et déploiement produits par P-WEB-04R : aucun.

## 5. État initial

Le dépôt exposait déjà `/protocol-designer` et `/protocol-designer/demo`, trois fixtures locales RB-003/RB-004/RB-005, une navigation en sept étapes, une décision humaine et un rapport court. Le champ libre influençait peu la projection ; l’utilisateur sélectionnait explicitement intention et scénario, puis parcourait un questionnaire fixe.

Le déploiement déclaré est une SPA React/Vite sur Vercel avec réécriture vers `index.html`. Aucun répertoire `api/` n’existait. Le format Vercel Function a donc été retenu pour ajouter une frontière serveur sans créer de serveur applicatif séparé.

## 6. Défaut produit traité

| ID | Surface | Défaut initial | Sévérité | Source d’exigence | Correction | Test-preuve | État final |
|---|---|---|---|---|---|---|---|
| D-01 | Entrée | Faux champ libre | Critique | Prompt P-WEB-04R ; PD-004 | Grande zone libre, compteur, exemples déclarés et analyse réelle | UI-01 à UI-03 | Corrigé |
| D-02 | Orientation | Fixture forcée | Critique | PD-009 ; P-WEB-04R | Matching local multi-corpus, `NO_SUPPORTED_MATCH`, confirmation humaine | UI-18 à UI-21 ; SV-24 | Corrigé |
| D-03 | Questionnaire | Questions difficiles et fixes | Élevée | PD-004 | Registre adaptatif local filtré par informations confirmées | UI-15 à UI-17 | Corrigé dans la tranche |
| D-04 | Choix | Impact invisible | Élevée | PD-004 | Raison, influence et conséquence affichées pour chaque réponse | UI-17 ; navigateur | Corrigé |
| D-05 | Rapport | Rapport générique | Élevée | P-WEB-04R | Dossier contextualisé à 42 sections et quatre livrables | RP-01 à RP-32 | Corrigé dans la couverture locale |
| D-06 | Provenance | Explicite et interprété mélangés | Critique | PD-003 | Origine et confiance par champ, libellés accessibles | SV-22 ; UI-07 à UI-13 | Corrigé |
| D-07 | Validation | Correction humaine absente | Critique | PD-004 ; PD-009 | Six états de revue ; correction prioritaire | UI-09 à UI-14 | Corrigé |
| D-08 | Couverture | Domaine non couvert mal géré | Critique | PD-009 | Aucun scénario forcé ; question conservée | UI-21 | Corrigé |
| D-09 | Architecture | Absence de frontière serveur | Critique | P-WEB-04R | `POST /api/scientific-intake` | SV-01 à SV-24 ; bundle serveur | Corrigé localement |
| D-10 | Secret | Risque d’exposition de clé | Critique | P-WEB-04R | Variables serveur seules ; absence du bundle client | build ; scan `dist/` | Corrigé |
| D-11 | Confidentialité | Absence de barrière avant envoi | Critique | P-WEB-04R | Détection locale et serveur, avertissement, blocage | SV-08 ; UI-04 ; cas E navigateur | Corrigé avec limite heuristique |
| D-12 | Mobile | Débordement du sélecteur et du rapport à 320 px | Élevée | PD-004 ; P-WEB-04R | Largeur bornée, cartes `min-w-0`, rupture des statuts longs | navigateur 320 px | Corrigé |
| D-13 | Impression | Nouveau rapport non raccordé aux sélecteurs d’impression | Élevée | P-WEB-03 ; P-WEB-04R | Identifiants d’impression, détails linéaires, contrôles masqués | CSS ; navigateur | Corrigé structurellement |

## 7. Architecture retenue

```text
Question libre
  → détection locale de données sensibles
  → POST JSON vers la fonction Vercel bornée
  → Gemini, interprétation linguistique seulement
  → validation Zod stricte
  → normalisation déterministe et contrôle d’ancrage
  → revue et correction humaines
  → ValidatedScientificIntent
  → matching local RB-003 / RB-004 / RB-005
  → questions adaptatives locales
  → décision humaine
  → rapport contextualisé local
```

Les fichiers sous `src/features/protocol-designer/intake/` séparent types, schémas, confidentialité, normalisation, session, questions, matching, client, serveur et rapport. Le composant React orchestre ces capacités sans recevoir la clé ni la réponse brute du fournisseur.

## 8. Frontière langage/science

Gemini peut reformuler et structurer le texte, qualifier son origine linguistique, signaler des ambiguïtés et conserver les contradictions. Il ne sélectionne aucun scénario et ne reçoit aucun corpus scientifique NOXIA.

Le matching, les questions, les options, les preuves et les limites proviennent uniquement des structures locales de NOXIA. Toute correction humaine devient la valeur de session. La réponse brute Gemini n’entre jamais dans l’état scientifique.

Le terme « moteur » dans cette tranche désigne la projection déterministe locale existante ; aucun moteur scientifique dynamique nouveau n’est revendiqué.

## 9. Modèle Gemini utilisé

- Identifiant configuré : `gemini-3.5-flash`.
- Variable : `GEMINI_MODEL`.
- Appel : API Gemini `generateContent` par REST.
- Outils, recherche et navigation : absents.
- Température : 0,1, conformément à la demande de mission.
- Sortie demandée : `application/json` avec JSON Schema.

La documentation officielle consultée identifie `gemini-3.5-flash` comme modèle stable et indique la prise en charge des sorties structurées. Elle précise aussi que les schémas trop complexes peuvent être rejetés. La validation Zod côté application reste obligatoire même avec un schéma fournisseur.

## 10. Version du schéma

- Requête : `ScientificIntakeRequest`, schéma `1.0`.
- Réponse : `ScientificIntakeInterpretation`, schéma `1.0`.
- Session locale : schéma `3.0`.
- Jeu de fixtures : `p-web-04r-rb003-1.0-rb004-1.1-rb005-1.0`.
- Longueur de question : 24 à 4 000 caractères.
- Taille HTTP maximale : 12 000 octets.

Le transport fournisseur utilise un objet compact et une liste `fields` typée afin de rester sous la limite de complexité observée. Le serveur reconstruit ensuite les dix-neuf champs du type métier, refuse les clés ou doublons invalides, applique les cardinalités Zod et revalide l’objet complet. Les objets supplémentaires sont refusés. Les champs absents sont normalisés vers `NOT_PROVIDED` et `UNKNOWN`.

## 11. Prompt système

Le prompt versionné se trouve dans `api/prompts/scientific-intake-system-prompt.ts`.

Il borne explicitement le modèle à l’interprétation linguistique, interdit protocole, timing, séquence, dose, seuil, recommandation, source et sélection de corpus, traite la question comme donnée non fiable et interdit de suivre une instruction utilisateur visant à changer de rôle, révéler le prompt, appeler un outil ou modifier le format.

Chaque champ non vide doit citer un extrait contigu de la question. `userValidated` reste toujours faux avant la revue humaine.

## 12. Endpoint

- Route : `POST /api/scientific-intake`.
- Type : Vercel Function TypeScript.
- Entrée : JSON seulement.
- Sortie : interprétation normalisée ou erreur uniforme.
- Cache : `no-store`.
- Dépendance fournisseur : appel REST direct ; aucune nouvelle dépendance de production.

La logique HTTP est testable indépendamment de l’adaptateur Vercel. Un bundle serveur ESM a été produit avec succès dans un emplacement temporaire pour vérifier la compilabilité de la fonction.

## 13. Sécurité

Les contrôles démontrés sont : méthode, MIME, taille, schéma, origine quand `Origin` et `Host` sont disponibles, limitation à dix requêtes par minute et par identifiant en mémoire, timeout, absence d’instruction système cliente, URL fournisseur fixe et erreurs sans stack, corps, clé ou réponse brute.

La limitation en mémoire est seulement une barrière de démonstration. Elle n’est pas globale entre instances serverless et ne suffit pas à autoriser une exposition publique.

## 14. Confidentialité

La fonction ne possède ni stockage, ni historique, ni journal scientifique. Le code n’émet aucun log de requête, réponse ou contenu utilisateur. Le navigateur affiche l’interdiction de saisir toute donnée patient, personnelle, confidentielle ou identifiable avant le champ.

Cette politique est une restriction de démonstration, pas une garantie d’anonymisation et pas une autorisation de traiter des données de santé.

## 15. Contrôle des données sensibles

Le contrôle local et serveur recherche raisonnablement : email, téléphone français, NIR, date de naissance explicite, identifiant patient ou hospitalier, numéro de dossier, adresse postale et nom/prénom précédé d’un libellé patient.

En cas de détection, l’appel fournisseur est bloqué, le texte reste dans le champ pour correction et seul un code de catégorie non révélateur est manipulé. Les faux négatifs restent possibles ; le contrôle ne remplace ni anonymisation certifiée, ni DLP, ni politique juridique.

## 16. Parcours utilisateur

Le parcours visible comporte sept repères : Question, Compréhension, Orientation, Questions, Options, Décision et Rapport.

L’ordre de raisonnement est préservé : phénomène, puis mesure, biomarqueur, modalité et acquisition. Les identifiants internes restent repliés dans la traçabilité.

## 17. Écran de saisie

L’écran reprend le titre, le sous-titre, l’aide, l’avertissement et les actions demandés. La zone de texte est étiquetée, limitée à 4 000 caractères, accompagnée d’un compteur et conserve le texte après erreur.

Les cinq exemples sont explicitement sélectionnés par l’utilisateur. Aucun exemple ne déclenche automatiquement un scénario.

## 18. Écran de compréhension

La question originale et la reformulation sont présentées séparément. Les dix-neuf champs affichent valeur, origine, confiance et état humain. Chaque champ peut être confirmé, corrigé, supprimé, déclaré inconnu ou non pertinent.

Les ambiguïtés, informations manquantes et contradictions restent dans des blocs distincts. Les alternatives reçues restent visibles ; les informations manquantes sont classées en nécessaire maintenant, utile plus tard, facultative ou non supportée, avec raison, influence et caractère bloquant. La compréhension n’est confirmable qu’après revue des champs et traitement explicite des ambiguïtés et contradictions. Le focus est déplacé vers le titre après analyse et vers une correction ouverte.

## 19. Questions adaptatives

Le registre local contient cinq questions versionnées de cette tranche : phénomène, objectif, contexte, équipements/données et visites déjà imposées. Chaque question déclare raison, impact, caractère bloquant, réponses, conséquences, sources et niveau d’implémentation.

Une question dont le champ source a déjà été confirmé n’est pas reposée. La temporalité est seulement enregistrée et porte l’état `TIMING_NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE` lorsque les règles exécutables manquent.

## 20. Matching de scénarios

Le matching est déterministe, local et fondé sur le texte original, la reformulation validée et les valeurs humaines conservées. Il couvre exactement `spectral`, `cardiac` et `neuro`.

Il peut rendre une proposition, plusieurs correspondances ou aucune correspondance. Seule une action humaine produit `MATCH_CONFIRMED`. Les corpus secondaires restent des relations de session, sans relation canonique entre Programmes.

## 21. Gestion de session

La session locale utilise la clé `noxia-guided-intake-session-v3`, un schéma `3.0` et une version de fixtures explicite. Une version étrangère ou un contenu corrompu est invalidé.

La reprise n’est jamais automatique : reprendre, recommencer ou supprimer sont proposés. Une modification amont invalide matching, réponses, scénario, décision et rapport. Une session portant une donnée détectée ou un `safetyFlag` n’est pas persistée.

## 22. Rapport contextualisé

Le générateur produit exactement 42 sections. Il conserve question originale, reformulation validée, revue, réponses, conséquences, scénario, sources, versions, limites, gaps, preuves, décision et historique.

Le rapport provisoire porte `RAPPORT_PROVISOIRE — RAISONNEMENT INCOMPLET`. Le rapport final exige compréhension confirmée, scénario confirmé, contradictions traitées et décision humaine. Un rapport final peut rester scientifiquement partiel ; ses absences sont qualifiées.

## 23. Quatre livrables

1. Dossier de raisonnement scientifique : produit, provisoire ou final selon la session.
2. Proposition de protocole d’acquisition : `NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE`.
3. Partie imagerie — financement : `STRUCTURE_ONLY`.
4. Partie imagerie — publication : `STRUCTURE_ONLY`.

Chaque carte conserve disponible, manquant, sources et limites. Aucun statut ne simule un contenu achevé.

## 24. Fonctionnement dégradé

L’absence de clé, l’indisponibilité fournisseur, le timeout, le quota, une erreur fournisseur, un JSON invalide, un échec Zod, une donnée sensible, une longueur invalide ou une absence de corpus produisent des états distincts.

Le texte est conservé. Le mode local sans interprétation automatique est explicite et moins adaptatif. Il n’invente aucune extraction : tous les champs commencent inconnus et doivent être revus humainement.

## 25. Tests mockés

- Suite serveur : 24 cas requis plus 2 gardes, tous réussis.
- Suite interface/session : 40 cas requis plus 2 gardes, tous réussis.
- Suite rapport : 32 cas requis plus 3 gardes, tous réussis.
- Total P-WEB-04R ciblé : 103 tests réussis.
- P-WEB-02/P-WEB-03 rebaselinés sur leurs invariants encore applicables : 20 tests réussis.
- Total ciblé Protocol Designer : 123 tests réussis.

La suite complète NOXIA obtient 632 succès et 3 échecs exclusivement causés par le contrôle de propreté du dépôt externe `editorial-engine`, observé modifié avant et après la mission. P-WEB-04R ne modifie pas ce dépôt.

## 26. Test réel Gemini

Le protocole manuel hors CI se trouve dans `src/features/protocol-designer/manual/scientific-intake-real.manual.ts`. Il charge uniquement `GEMINI_API_KEY` et `GEMINI_MODEL` depuis l’environnement ou `.env.local`, utilise une question fictive, passe par le même handler et ne journalise que statut HTTP, statut local, version de schéma et langue.

Une clé locale ignorée par Git était disponible. La campagne initiale a rencontré HTTP 400, HTTP 503 puis un timeout. Le diagnostic final, sans donnée utilisateur, a confirmé : métadonnées du modèle HTTP 200 ; sortie structurée minimale HTTP 200 ; schéma à cinq champs HTTP 200 ; schémas à dix ou dix-neuf champs avec cardinalités fournisseur HTTP 400. Le transport a été compacté et les cardinalités maintenues dans Zod ; les appels complets suivants ont rencontré HTTP 429 puis HTTP 503. Aucun appel complet n’a donc livré de JSON métier validable. Le test réel reste `FAIL_EXTERNAL_OR_CONTRACT_UNRESOLVED` et l’activation publique demeure bloquée.

Aucune clé, aucun fragment de clé, aucune réponse brute et aucune question ne figurent dans ce rapport.

## 27. Validation clavier

Les contrôles utilisent des éléments HTML natifs étiquetés, les anneaux de focus restent visibles, le focus arrive sur la compréhension après analyse et la réinitialisation utilise un `AlertDialog` avec retour possible.

Les tests automatisés sont réussis et le dialogue a été contrôlé dans le navigateur. Un parcours intégral exclusivement clavier n’a pas fait l’objet d’une preuve vidéo ou d’une archive dédiée : `PASS_WITH_WARNING`.

## 28. Validation responsive

Les largeurs 320, 390, 768, 1024, 1440 et 1920 px ont été contrôlées. Un débordement initial du sélecteur d’exemples et du rapport a été corrigé. À 320 px, le document, le champ, le sélecteur, l’orientation et le rapport final restent dans la largeur du viewport.

Résultat : `PASS` pour la tranche vérifiée.

## 29. Validation impression

Le rapport possède un conteneur dédié, masque les contrôles et le footer, conserve avertissements et sources, ouvre linéairement le contenu des détails et applique `break-inside: avoid-page` aux cartes.

Les règles, le bouton d’impression, les 42 sections et les quatre livrables ont été vérifiés. Aucun fichier PDF physique n’a été généré et relu page par page pendant cette mission : `PASS_WITH_WARNING`.

## 30. Validation du bundle

- Typecheck : PASS.
- Lint : PASS, 0 erreur et 7 avertissements Fast Refresh préexistants.
- Build Vite production : PASS, 1 811 modules transformés.
- Bundle principal : 364,75 kB brut ; 116,83 kB gzip.
- Chunk `ProtocolDesignerDemo` : 62,04 kB brut ; 18,88 kB gzip.
- Bundle de la fonction serveur : PASS, 140,2 kB ESM.
- Scan de `dist/` pour clé de test ou affectation `GEMINI_API_KEY` : PASS.
- Audit SEO : 40 pages, 0 erreur, 0 avertissement.

Les avertissements de données Browserslist anciennes et d’annotations `react-helmet-async` sont préexistants et non bloquants pour cette tranche.

## 31. Fichiers créés

- `api/scientific-intake.ts`
- `api/prompts/scientific-intake-system-prompt.ts`
- `src/features/protocol-designer/intake/client.ts`
- `src/features/protocol-designer/intake/normalizer.ts`
- `src/features/protocol-designer/intake/privacy.ts`
- `src/features/protocol-designer/intake/questions.ts`
- `src/features/protocol-designer/intake/report.ts`
- `src/features/protocol-designer/intake/scenarios.ts`
- `src/features/protocol-designer/intake/schema.ts`
- `src/features/protocol-designer/intake/server.ts`
- `src/features/protocol-designer/intake/session.ts`
- `src/features/protocol-designer/intake/types.ts`
- `src/features/protocol-designer/manual/scientific-intake-real.manual.ts`
- `src/features/protocol-designer/__tests__/p-web-04r-server.test.ts`
- `src/features/protocol-designer/__tests__/p-web-04r-ui-session.test.tsx`
- `src/features/protocol-designer/__tests__/p-web-04r-report.test.ts`
- `docs/p-web-04r-guided-scientific-intake-implementation-report.md`

## 32. Fichiers modifiés

- `src/pages/ProtocolDesignerDemo.tsx` : nouveau parcours guidé.
- `src/index.css` : impression linéaire du rapport.
- `src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx` : rebaselining des invariants encore applicables.
- `src/features/protocol-designer/__tests__/p-web-03-regression.test.tsx` : rebaselining des gardes post-réorientation.
- `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` : admission du présent rapport uniquement.

`.env.local.example` et `.gitignore` étaient déjà conformes et ne sont pas modifiés.

## 33. Éléments non implémentés

- aucun moteur scientifique dynamique nouveau ;
- aucune génération exécutable de séquence, timing, dose, contraste, seuil ou QA ;
- aucune génération complète de partie financement ou publication ;
- aucun stockage serveur ou historique distant ;
- aucune limitation de débit distribuée ;
- aucune authentification, CAPTCHA, DLP ou anonymisation certifiée ;
- aucune relation canonique nouvelle entre Programmes ;
- aucun Knowledge Graph dynamique ;
- aucun DOCX ;
- aucun déploiement ou configuration Vercel de production.

## 34. Limites

L’interpréteur réel dépend de la disponibilité et de la stabilité contractuelle de Gemini. Le mode local sans extraction conserve la sécurité et la traçabilité, mais impose davantage de revue humaine. Les questions adaptatives ne couvrent que cinq décisions générales. Le matching est lexical et borné aux trois corpus.

La barrière de confidentialité est heuristique. Le rapport est complet dans sa structure mais partiel dans sa substance lorsque la session ou les règles locales manquent. L’impression n’a pas été validée par relecture d’un PDF généré.

## 35. Risques résiduels

| Risque | Niveau | Traitement actuel | Condition de clôture |
|---|---|---|---|
| API réelle non validée | Bloquant public | Erreur uniforme et mode local | Obtenir plusieurs réponses réelles valides et stables |
| Limitation serverless non distribuée | Bloquant public | 10/minute en mémoire | Limitation durable adaptée au déploiement |
| Détection sensible incomplète | Élevé | Double contrôle et avertissement | Revue privacy et mécanisme accepté pour la démonstration publique |
| Impression non relue en PDF | Moyen | CSS print et structure vérifiés | Générer et inspecter le PDF de référence |
| Couverture adaptative étroite | Moyen | Statuts honnêtes | Étendre sous P-WEB-05 sans inventer la science |
| Dépôt externe sale | Externe | Signalé, non modifié | Nettoyage ou décision du propriétaire du dépôt externe |

## 36. Contrats

| Contract | Préservé ? | Test-preuve | Remarque |
|---|---|---|---|
| 1. Question scientifique comme point d’entrée | PASS | UI-01 ; navigateur | Premier H1 et champ libre |
| 2. Utilisateur non contraint de connaître les biomarqueurs | PASS | UI-38 | Aucun biomarqueur au niveau 0 |
| 3. Utilisateur non contraint de connaître les séquences | PASS | UI-38 ; UI-40 | Aucune sélection initiale |
| 4. Utilisateur non contraint de connaître le timing | PASS | UI-39 | Timing déclaré seulement |
| 5. Gemini limité à l’interprétation linguistique | PASS | prompt ; SV-24 | Frontière explicite |
| 6. Gemini non utilisé comme source scientifique | PASS | RP-20 | Aucune source Gemini dans le rapport |
| 7. Science provenant uniquement de NOXIA | PASS | matching et fixtures | RB-003/RB-004/RB-005 locaux |
| 8. Distinction explicite / normalisé / interprété / manquant / contradictoire | PASS | SV-22/SV-23 ; UI | Origine par champ |
| 9. Correction humaine prioritaire | PASS | UI-09 ; RP-02 | Valeur corrigée projetée |
| 10. Aucune décision automatique | PASS | UI-19 ; décision | Confirmation humaine requise |
| 11. Aucune recommandation clinique | PASS | SV-14 ; RP-31 | Sortie rejetée |
| 12. Aucune donnée patient | PASS_WITH_WARNING | SV-08 ; UI-04 ; cas E | Barrière heuristique, pas DLP certifiée |
| 13. Clé absente du frontend | PASS | build et scan `dist/` | Variables serveur seulement |
| 14. Clé absente de Git | PASS | `.gitignore` ; `.env.local.example` | Fichier réel ignoré |
| 15. Sortie JSON strictement validée | PASS | SV-09 à SV-12 | JSON Schema puis Zod strict |
| 16. Réponse brute non utilisée comme état scientifique | PASS | server/normalizer/client | Seule la réponse normalisée est renvoyée |
| 17. Prompt injection bornée | PASS | SV-20 ; prompt | Question traitée comme donnée |
| 18. Endpoint non utilisable comme proxy générique | PASS | endpoint et prompt | Modèle, URL et système fixés côté serveur |
| 19. Scénario non forcé | PASS | SV-24 ; UI-18 à UI-21 | Confirmation humaine ou aucun match |
| 20. Domaine non couvert honnêtement géré | PASS | UI-21 | `NO_SUPPORTED_MATCH` |
| 21. Questions réellement adaptatives | PASS | UI-15/UI-16 | Filtrage local par champs confirmés |
| 22. Raison de chaque question visible | PASS | registre ; navigateur | Affichée dans chaque carte |
| 23. Conséquence de chaque réponse visible | PASS | UI-17 ; navigateur | Mise à jour non silencieuse |
| 24. Provenance conservée | PASS | RP-14/RP-15/RP-38 | Valeur, origine, revue, source |
| 25. Rapport contextualisé | PASS | RP-01 à RP-10 | 42 sections |
| 26. Rapport provisoire distinct | PASS | RP-11/RP-12 | Gate final séparé |
| 27. Quatre livrables visibles | PASS | RP-16/RP-17 ; navigateur | Tous restent affichés |
| 28. Protocole non inventé | PASS | SV-13 ; RP-15/RP-29 | Statut non générable |
| 29. Timing non inventé | PASS | UI-39 ; RP-30 | État exact visible |
| 30. Partie financement non inventée | PASS | RP-16 | `STRUCTURE_ONLY` |
| 31. Partie publication non inventée | PASS | RP-17 | `STRUCTURE_ONLY` |
| 32. Session locale versionnée | PASS | UI-28/UI-29 | Schéma et fixtures versionnés |
| 33. Réinitialisation sûre | PASS | UI-30 ; navigateur | Dialogue borné à la clé de session |
| 34. Responsive | PASS | navigateur 320–1920 px | Aucun débordement final à 320 px |
| 35. Navigation clavier | PASS_WITH_WARNING | UI-31 ; focus ; dialogue | Pas d’archive d’un parcours clavier intégral |
| 36. Impression PDF | PASS_WITH_WARNING | CSS ; RP-21 à RP-23 | PDF physique non relu |
| 37. Aucun changement scientifique | PASS | diff | Fixtures et corpus inchangés |
| 38. Aucun changement normatif | PASS | diff | PD-003 à PD-013 inchangés |
| 39. Aucun Editorial Engine | PASS | diff NOXIA | Dépôt externe seulement consulté |
| 40. Aucun Knowledge Graph dynamique | PASS | diff | Aucun appel ou mutation KG |
| 41. Aucun PASS PD-011 | PASS | RP-32 ; UI | Disclaimer explicite |
| 42. Aucun déploiement | PASS | historique de mission | Build local uniquement |

## 37. Décision sur la démonstration locale

Le parcours local dégradé est fonctionnel : saisie, barrière sensible, fallback explicite, revue humaine, matching, question adaptative, décision et rapport final ont été parcourus dans le navigateur. Les cas neuro-perfusion et donnée sensible ont été validés manuellement. Les cas cardiaque, spectral et hors couverture sont couverts par les tests déterministes, mais n’ont pas pu être validés avec une interprétation Gemini réelle.

La qualité fonctionnelle locale est suffisante pour poursuivre les essais internes sans donnée sensible. Elle ne satisfait pas le libellé `GUIDED_INTAKE_READY_FOR_LOCAL_DEMONSTRATION`, lequel exige explicitement un test réel Gemini réussi.

## 38. Décision sur l’activation publique

La fonction serveur est compatible avec l’architecture Vercel et protège la clé. La politique de données est visible, la saisie sensible est bloquée, le build et les tests ciblés réussissent.

L’activation publique est cependant interdite à cette étape en raison de l’absence de réponse Gemini réelle validée, de l’incertitude API observée, de la limitation de débit non distribuée et de l’absence de relecture PDF complète. Aucun déploiement n’a été réalisé.

## 39. Étape suivante recommandée

Avant P-WEB-05, exécuter une campagne réelle bornée lorsque Gemini est disponible : cas A à E, plusieurs formulations, latence, schéma, ambiguïtés et sorties interdites. Ajouter ensuite une limitation d’usage compatible avec plusieurs instances Vercel, obtenir une revue explicite de la politique de données et archiver une validation clavier et PDF.

P-WEB-05 — Guided Scientific Reasoning pourra ensuite étendre le raisonnement local sur phénomène, temporalité, biomarqueurs, modalités, acquisition, QA, analyse et critères de jugement, sans transférer cette responsabilité à Gemini.

`GUIDED_INTAKE_IMPLEMENTED_BUT_PUBLIC_ACTIVATION_BLOCKED`
