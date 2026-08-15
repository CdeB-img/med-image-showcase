# V1.1 — Standard conversationnel + Research Project permanent

Statut documentaire : rapport d’implémentation LEVEL 3

Date : 2026-08-15

Périmètre : projection produit du Protocol Designer ; aucun moteur scientifique, ranking QRY, contrat Project, règle VAL ou ownership modifié.

## 1. Autorités consultées

Les autorités ont été lues dans l’ordre imposé :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version courante 1.45 ;
2. `NOXIA — Charte fondatrice` ;
3. `NOXIA Protocol Designer — Scientific Product Manifesto`, version courante V2 ;
4. `Editorial Engine — Architecture Manifesto` ;
5. `docs/pd-003-v2-research-object-model.md` et ses matrices d’ownership/impact ;
6. `docs/pd-004-ux-manifesto.md` ;
7. `docs/pd-009-decision-engine-architecture.md` ;
8. `docs/prj-001-research-project-construction-v1-implementation-report.md` ;
9. `docs/qry-001-information-gain-engine-closure-report.md` ;
10. `docs/ux-001-adaptive-research-workspace-closure-report.md` ;
11. `docs/v1-integration-freeze-closure-report.md` et son manifeste ;
12. contrats runtime Scientific Interpretation / Contribution, Human Decision et DocumentProjection/TMP présents dans `src/features` ;
13. `docs/document-projection-engine-architecture.md`, `docs/doc-001-document-projection-engine-v1-report.md` et `docs/doc-001b-study-template-document-projection-integration-report.md` ;
14. `docs/p-web-06c-protocol-designer-v1-closure.md`.

Aucune contradiction normative n’a été trouvée. La mission relève bien d’une projection LEVEL 3 : Project reste la vérité adoptée ; QRY reste propriétaire de la prochaine action transverse ; Human Decision reste propriétaire des décisions engageantes ; VAL reste propriétaire de l’évaluation ; DOC reste propriétaire des projections documentaires. L’Editorial Engine n’a pas été modifié.

## 2. État initial observé

La trace initiale a identifié les surfaces suivantes :

| Surface initiale | Composant principal | Source réelle | Propriétaire de l’action |
|---|---|---|---|
| Orientation | `ProtocolDesignerDemo.tsx` | `validatedIntent`, `routeIntent`, `scenarioMatches` | contrats de parcours Protocol Designer et confirmation humaine |
| Espace scientifique | `ProtocolDesignerDemo.tsx` | `scientificContext.activeDesignSurface` | moteur actif ; QRY transverse une fois Project construit |
| Questions, hypothèses, objectifs et pistes ST | `ScientificThinkingView.tsx` | `ScientificThinkingSession.output` | Scientific Thinking + Human Decision aux portes engageantes |
| Phénomènes, biomarqueurs, modalités et acquisitions | `ImagingStudyDesignerView.tsx` | `ImagingDesignSession.result` | Imaging + Human Decision aux portes engageantes |
| Autorité acteur/mandat | vues ST, IMG et PRJ détaillées | contrats Human Decision | humain identifié et mandaté |
| Prochaine action Project | `WorkspaceNextActionInteraction.tsx` | `QueryNavigationProductProjection` | QRY |
| Documents | Adaptive Workspace et vue Project détaillée | `projectionReadiness`, TMP/DOC, version Project | DOC-001 |
| Résumé Project | `AdaptiveResearchWorkspace` | `ResearchProjectConstructionResult` | Project |

Les composants ST, IMG et PRJ détaillés pouvaient être conservés dans Expert sans changer leurs contrats. Le résumé Project, la projection QRY et les états documentaires pouvaient être réutilisés directement dans la nouvelle surface Standard.

## 3. Problèmes UX corrigés

- L’ouverture d’un projet structuré arrive maintenant en mode `STANDARD`, et non directement dans l’inspection détaillée.
- Orientation possède une présentation conversationnelle ; les cartes techniques restent accessibles par « Inspecter l’orientation ».
- Le stepper historique est masqué dans Orientation Standard et dans l’espace scientifique Standard. Son état interne est conservé.
- Les bandeaux moteur, routes techniques et statuts internes sont masqués en Standard.
- Scientific Thinking et Imaging disposent chacun d’une projection Standard centrée sur une seule interaction courante, avec réponse libre lorsqu’elle est autorisée.
- Les expressions moteur (`MATCH_PROPOSED`, `TESTABLE_CANDIDATE`, etc.) et le modèle mental de « branche » ne sont plus nécessaires pour continuer en Standard.
- Les contrôles acteur/mandat permanents disparaissent du Standard. Une identification compréhensible est affichée uniquement lors d’une décision engageante.
- Toute action principale désactivée affiche sa condition réelle ou reste absente.
- Chaque réponse, refus ou conservation d’inconnue produit un retour visible immédiat.

## 4. Composants déplacés, masqués ou conservés

Déplacés vers Expert : graphes, opérations, traces, identifiants, digests, provenance détaillée, cartes d’étapes PRJ, listes complètes de candidats, états techniques exacts, bloc permanent de mandat, détails VAL et navigation moteur.

Conservés en Standard : question en cours, raison intelligible, conséquence, réponse libre, raccourcis non exclusifs, inconnue explicite, décision humaine contextuelle, résumé Project, états des grandes dimensions et documents.

Conservés inchangés dans leurs propriétaires : calcul QRY, reconstruction ST/IMG/PRJ, Human Decision envelopes, règles VAL, générabilité documentaire, version et fraîcheur Project/DOC.

## 5. Project panel

`AdaptiveResearchWorkspace` projette désormais les sections réelles suivantes depuis le résultat Project : Question scientifique, Hypothèses, Population, Design, Imagerie, Variables/mesures et Analyse. Chaque section conserve un état sémantique distinct (`ADOPTED`, `CANDIDATE`, `UNKNOWN`, `NOT_APPLICABLE`, etc.) sans score global.

Le panneau affiche le résumé réel de la question, les derniers changements Project confirmés lorsqu’ils existent, et la distinction explicite entre proposition et élément adopté. Il ne crée aucun objet métier et n’autorise aucune écriture Project.

Avant l’existence du Research Project, les projections Standard ST/IMG affichent uniquement les informations réellement présentes dans leurs entrées/sorties et signalent honnêtement que les documents ne sont pas encore générables.

## 6. Comportement desktop

Dans Scientific Interpretation puis Adaptive Workspace Standard, la grille utilise une colonne Project à gauche et une colonne Conversation à droite. La colonne Project est `sticky`, ancrée en haut de la fenêtre et dotée de son propre débordement vertical. Le scroll de la conversation ne retire donc pas la mémoire visuelle du projet. Le contrôle visuel local à 1 440 px a confirmé `position: sticky`, `top: 16px` et une colonne Project distincte de 441 px.

Les projections Standard ST et IMG reprennent la même relation : résumé de projet à gauche, interaction scientifique à droite.

## 7. Comportement mobile

Scientific Interpretation et Adaptive Workspace affichent un contrôle sticky « Voir le Research Project » qui ouvre immédiatement le panneau repliable. Le Project n’est ni supprimé ni placé derrière un parcours supplémentaire. Les actions ont une hauteur minimale compatible tactile et les groupes de raccourcis reviennent à la ligne. Le contrôle visuel local à 390 × 844 px a confirmé que le bouton est présent avant la conversation et que le panneau s’ouvre immédiatement sous ce contrôle.

Les projections ST/IMG empilent le Project avant la conversation sur petit écran, ce qui le maintient immédiatement accessible.

## 8. Comportement Standard

Standard est le mode d’entrée du projet structuré. Il affiche :

1. le Research Project ou sa construction réelle ;
2. la conversation scientifique ;
3. une seule interaction utile mise au premier plan ;
4. une réponse libre si le contrat l’accepte ;
5. des raccourcis facultatifs ;
6. un retour immédiat ;
7. les états documentaires réels.

Un état de repli explicite empêche tout écran Standard vide lorsque ST ou IMG ne peuvent pas encore autoriser le handoff.

## 9. Comportement Expert

Expert conserve les vues préexistantes : Scientific Reasoning Graph, opérations, candidats, portes, gaps, preuves, provenance, historique, VAL, domaines, projections, digests et cartes d’étapes. Standard et Expert consomment les mêmes sessions et résultats propriétaires ; aucun moteur n’est dupliqué.

## 10. Orientation

L’état interne Orientation est conservé. En Standard, l’utilisateur répond à une formulation humaine : approfondir la question ou structurer l’étude. Une précision libre peut être renvoyée vers Scientific Interpretation. Un match de corpus est présenté comme un socle scientifique à confirmer, sans exposer `MATCH_PROPOSED`, confiance moteur ou identifiant de scénario. L’inspection technique reste accessible explicitement.

## 11. QRY ownership

`WorkspaceNextActionInteraction` consomme toujours la projection QRY fournie. Aucun ranking, tri scientifique ou fabrication de `nextAction` n’a été ajouté en React. La reformulation Standard porte uniquement sur le wording et l’impact humainement compréhensible. Les callbacks d’exploration ne reclassent pas la projection QRY.

## 12. Human Decision

Les contrats Human Decision ne changent pas. Une Contribution ou un clic UX ne crée pas automatiquement une décision adoptée. En Standard, l’auteur et son habilitation apparaissent uniquement pour la décision scientifique précise qui exige cette gouvernance. Le refus reste tracé sans promotion de vérité ni valeur par défaut.

## 13. Documents

Le panneau Project affiche tôt Protocol, DMP, SAP et Synopsis lorsqu’ils existent dans la projection. Les libellés visibles sont dérivés des vrais états `GENERATABLE`, `PARTIALLY_GENERATABLE`, `NOT_GENERATABLE`, `BLOCKED` et `NOT_APPLICABLE`. Les premiers éléments manquants réels sont affichés. La version source Project et la fraîcheur restent disponibles en Expert. `owner = DOC-001`, `generatabilitySource = TMP_DOC` et toutes les interdictions d’écriture Project sont inchangés.

## 14. Session / reload

La persistance existante n’a pas changé. Le workspace Standard est reconstruit de manière déterministe à partir de la session Project restaurée, de la projection QRY, de VAL et de DAI. Une version ou un digest source différent rend l’interaction obsolète et bloque sa transmission tout en conservant la saisie locale.

## 15. Tests

Un fichier dédié ajoute exactement les 20 contrats `V11-UX-C01` à `V11-UX-C20`. Il couvre la conversation principale, le sticky desktop, l’accès mobile, l’absence d’enums, la gouvernance contextuelle, le refus visible, les raisons d’actions désactivées, QRY, les frontières d’écriture, candidate/adopted, les documents, Expert, Orientation, reload, le cas colchicine/IDM, l’absence d’état vide et l’absence de nouvel owner.

Les tests UX-001 antérieurs ont été migrés vers la nouvelle projection Standard ; les attentes d’inspection détaillée ouvrent désormais explicitement Expert.

Résultat du contrat V1.1 : 20 tests, 20 PASS, 0 FAIL.

Résultat des suites fonctionnelles pertinentes finales : 55 fichiers de tests, 1 461 tests, 1 461 PASS, 0 FAIL. Ce périmètre couvre Protocol Designer, Scientific Interpretation, Research Project, QRY, Human Decision via System Integration, Adaptive Workspace, DOC/TMP, DAI, VAL, session/reload et les deux hotfixes de production.

Résultat de la suite globale : 134 fichiers, 2 524 tests, 2 521 PASS et 3 FAIL. Les trois échecs sont exclusivement les gardes d’état propre du dépôt externe `editorial-engine`, déjà sale avant cette mission et laissé en lecture seule : `scientific-knowledge-graph-web` C80, `scientific-corpus` C66 et `scientific-multidomain` « leaves editorial-engine unchanged ». Aucun test scientifique ou produit NOXIA n’échoue.

Contrôles de clôture : typecheck PASS ; build de production PASS, y compris le handler Scientific Interpretation Vercel/Node ESM ; lint de tous les fichiers TypeScript/TSX modifiés PASS ; `git diff --check` PASS. La vérification visuelle locale desktop/mobile et l’accès à la vue Expert sont PASS.

## 16. Limites restantes

- Cette mission ne rend pas QRY plus intelligent et n’implémente pas QRY-002.
- La conversation ne regroupe pas encore plusieurs besoins cohérents en une proposition composite.
- Le runtime LLM n’est pas réarchitecturé ; les réponses libres empruntent les handoffs existants.
- Les projections ST/IMG précèdent encore l’existence du Research Project canonique et ne peuvent afficher qu’un résumé de construction fondé sur leurs propres contrats.
- La générabilité documentaire reste strictement limitée par les états Project/TMP/DOC existants.
- La validation automatique ne remplace pas la validation manuelle du parcours réel en production.

## 17. Prochaines étapes recommandées

1. Effectuer le parcours manuel de production colchicine/IDM après déploiement Ready.
2. Relever séparément les incompréhensions de wording sans changer les owners.
3. Traiter QRY-002 dans une mission dédiée si la prochaine action réelle reste trop atomique.
4. N’engager Proposal-first, nouveaux Reasoning Books ou enrichissement Knowledge que dans leurs chantiers gouvernés propres.

Ces éléments sont des recommandations, pas des engagements de livraison.
