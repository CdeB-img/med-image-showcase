# Contrat de campagne multi-session — qualification hors ligne

MISSION_ID = `PROTOCOL_DESIGNER_MULTI_SESSION_LIVE_CAMPAIGN_SAFETY_01`

Le contrat de sécurité demandé est implémenté et qualifié hors ligne. Une politique serveur explicite permet cinq sessions indépendantes avec un seul cumul de campagne. Les plafonds historiques mono-session restent soft 1 USD / hard 6 USD. Le profil cinq sessions / 3 USD / 10 USD est explicite et persisté ; il ne remplace aucun default du produit.

## Résultats obligatoires

| Champ | Résultat |
|---|---|
| BASELINE_HEAD | `5c3a559deae3388555ec8aa08543c1242b3c80c8` |
| FINAL_HEAD | Commit contenant ce rapport ; SHA exact et vérification post-commit dans `final-state.json` |
| CAMPAIGN_MULTI_SESSION_CONTRACT | PASS |
| CAMPAIGN_LEVEL_BUDGET_LEDGER | PASS |
| SESSION_LEVEL_PROVENANCE | PASS |
| NO_BUDGET_RESET_BY_SESSION | PASS |
| NO_BUDGET_RESET_BY_RESTART | PASS |
| CROSS_SESSION_CONCURRENCY | PASS |
| SINGLE_ATTEMPT_ALL_SESSIONS | PASS |
| HISTORICAL_SINGLE_SESSION_COMPATIBILITY | PASS |
| POLICY_SERVER_SIDE_IMMUTABLE | PASS |
| DRY_RUN_5_SESSIONS | PASS |
| DRY_RUN_POLICY | maxSessions 5 ; soft 3 USD ; hard 10 USD |
| PROVIDER_CALLS | 0 |
| Coût réel nouveau | 0 USD |
| FULL_SUITE | 4 253 PASS / 0 FAIL / 0 UNHANDLED ; 12 pending, 1 todo ; 275 fichiers de test |
| PRODUCT_SCIENTIFIC_FILES_CHANGED | 0 |
| TRACKED_WORKTREE | Vérification CLEAN requise après le commit ; résultat exact dans `final-state.json` |
| P1_COMPLETE | NO |
| P1_EXIT_GATE | NOT_SATISFIED |
| WAVE_2_AUTHORIZED | NO |
| NEXT_ACTION | NEW_EXPLICITLY_AUTHORIZED_MULTI_SESSION_LIVE_EVIDENCE_ACQUISITION |

## Modification et attribution

Trois fichiers de sécurité/configuration et deux fichiers de test sont concernés. `api/protocol-designer-canary-policy.ts` valide et fige la politique, son digest et ses limites bornées. `api/protocol-designer-provider-replay.ts` possède l'admission, le verrou global, la reconstruction intégrale des coûts, le rattachement des sessions et le rejeu strict. `vite.config.ts` transmet seulement la configuration serveur qualifiée et le Project courant observé. Aucun nouveau propriétaire scientifique ni seconde comptabilité n'a été créé.

La policy est persistée avant la première préparation. Le journal global existant REQUEST_PREPARED/COMPLETED reste l'unique vérité budgétaire. Les records conservent campagne, session, conversation, tour, appel logique et Project observé ; les sessions se distinguent sans duplication des dépenses. Le registre privé commun lie exclusivement campagne/racine et session/campagne/conversation, sans compteur financier. Le lifecycle se reconstruit depuis l'initialisation et les preuves préparées/complétées.

Un nouveau recorder, une nouvelle session ou un nouveau processus reconstruit le cumul existant. Le verrou filesystem couvre admission, réservation, transport, capture et règlement. Une admission concurrente est refusée avant transport ; l'admission explicite suivante voit le cumul réglé. Il n'y a ni queue ni retry automatique. Un coût inconnu, une préparation non réglée, une policy altérée, une preuve absente ou une identité ambiguë ferme l'admission sans réparer les fichiers.

Les limites ne proviennent jamais du body navigateur. La policy ne change pas après préparation ou dépense. Le rejeu d'une nouvelle campagne exige un scope explicite campagne/session, refuse une autre session même pour un payload identique et n'écrit pas dans le ledger.

## Qualification et portée des preuves

- `qualification/dedicated-sealed.json` : 94 tests ciblés réussis, dont les 18 obligations MULTI_SESSION_01 à MULTI_SESSION_18, budget, historique, configuration locale et middleware affecté. Le bridge lifecycle ajoute 14 tests réussis dans la full suite finale.
- `qualification/full-suite-sealed-receipt.json` et `qualification/full-suite-sealed.json` : 4 253 réussites, aucun échec, aucun unhandled. Exit 0 et success=true, aucune option ignorant les erreurs non gérées. Les tests pending/todo ne sont pas présentés comme exécutés.
- TypeScript complet, build et lint des fichiers affectés : PASS. Les logs locaux sont référencés et hachés dans `technical-final-receipt.json`. Le build conserve l'avertissement de taille des chunks ; aucun échec de build.
- `dry-run-sealed/receipt.json` : vraie chaîne middleware/bridge locale, campagne `synthetic-qualified-multisession`, scénarios A01/A02/A04/B01/F01, cinq sessions distinctes et cinq réponses synthétiques. Préparation persistée avant chaque transport synthétique, cumul croissant, sixième session refusée, rejeu strict et journal inchangé.
- Le dry-run réutilise les premiers tours synthétiques existants. Les seuls usages chiffrés proviennent d'une capture existante et servent à la simulation du budget : cumul mesuré simulé 0,3198275 USD, cumul engagé simulé 0,319835 USD. Aucun de ces montants n'est une nouvelle dépense réelle. Les tests séparés établissent l'épuisement agrégé soft/hard ; notamment A+B+C atteignent 3 USD et D est refusée sous le profil exact 3/10.
- `qualification/restart-and-history-sealed.json` : processus Node distinct, cinq sessions restaurées, appel consommé et sixième session refusés ; les cinq captures réelles historiques 01R se rejouent strictement hors ligne, avec corps de réponse identiques et journal inchangé.

Tous ces processus utilisent le garde hors ligne existant : credentials supprimés dans le processus de qualification, lectures `.env` neutralisées, réseau provider interdit. Les entrées sont des fixtures locales ; aucun contenu n'a été transmis à un provider dans cette mission.

Le dry-run qualifie la sécurité de cinq premiers tours via le middleware réel. Il ne démontre ni cinq conversations scientifiques complètes, ni une nouvelle campagne navigateur, ni une amélioration scientifique ou clinique. Cette distinction ne modifie pas les résultats de sécurité ci-dessus.

## Revue contradictoire

Cinq contre-exemples ont été démontrés puis corrigés : rattachement historique vers nouveau contrat, rattachement inverse, métadonnées de session incohérentes en rejeu, ancien journal tronqué laissant des raw orphelins, et arrondi vers le haut d'un plafond absolu configurable. Les reçus rouges sont conservés : `review-counterexamples-red.json`, `historical-orphan-red.json`, `hard-bound-rounding-red.json`, dans `qualification/`.

Le dernier cas permettait de dépasser le plafond de 0,25e-9 USD. Le plafond est maintenant arrondi vers le bas ; les coûts restent arrondis vers le haut. Les contrats exacts 1/6 et 3/10 restent identiques. Tous les contre-exemples passent dans la qualification finale. La revue détaillée est dans `contradictory-review.md` ; elle a été réalisée dans cette tâche, sans affirmation d'audit humain indépendant.

Le premier runner de dry-run échouait avant transport à cause de l'alias front-end de `node:crypto`. L'exécution du runner serveur avec la configuration native existante `vitest.config.ts` a résolu ce défaut de harness sans modifier cet alias produit. Les essais diagnostiques et leurs preuves locales restent disponibles ; ils ne constituent pas une implémentation alternative à déployer.

## Préservation et clôture

`preservation-final.json` vérifie les empreintes des 2 088 artefacts antérieurs non suivis, 16 fichiers privés historiques et 375 fichiers scientifiques surveillés : tous inchangés. Les seuls changements source sont les trois fichiers sécurité/configuration et les deux tests listés dans `source-freeze-final.json`. Aucun prompt scientifique, modèle, reasoning effort, QRY, sémantique Project, Human Review ou génération documentaire n'a été modifié.

Le commit local utilise exclusivement `explicit-git-whitelist.json`. Les preuves brutes privées, les anciens artefacts non suivis, les sorties diagnostiques et les logs restent sur disque. `resume-state.json`, `checkpoint-log.md` et `final-state.json` restent des reçus opérationnels locaux non suivis, afin de porter le SHA post-commit exact sans rendre le worktree suivi sale. CP0 à CP6 sont validés avant commit ; CP7 est vérifié après commit.

La protection est locale à la racine privée configurée. Une destruction coordonnée du registre et de toutes les preuves, une migration de racine, une protection multi-hôte et un billing général restent hors qualification. Une interruption laissant un verrou ou un état incomplet provoque un arrêt sûr ; aucune reprise automatique ne contourne cet arrêt.

Aucun push, déploiement, nouvelle configuration live persistante ou appel provider n'a lieu dans cette mission. La prochaine acquisition exige un nouveau mandat explicite et son propre preflight sur la baseline résultante ; les gates P1 et Wave 2 restent fermés.
