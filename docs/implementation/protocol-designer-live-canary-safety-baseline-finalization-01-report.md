# NOXIA — Finalisation de la baseline de sécurité canary et politique budgétaire

Date : 2026-09-14. Mission : `PROTOCOL_DESIGNER_LIVE_CANARY_SAFETY_BASELINE_FINALIZATION_01`.

Nature : rapport technique d'implémentation et de qualification locale. La décision budgétaire vient du prompt de cette mission ; elle s'applique à un seul futur canary explicitement autorisé. Ce rapport ne modifie aucune autorité scientifique, règle Project ou gate P1. Il complète la réparation précédente sans réécrire ses preuves ni son ancienne politique 1 USD / 0,80 USD.

## 1. Décision et baseline

```ini
REPOSITORY = /Users/charles/Documents/Projets/NOXIA/noxia-dev
BRANCH = protocol-designer-canonical-ingestion
HEAD_BEFORE = 02b5bb671339c0aa720c165da5a3b577b9474baf
FINAL_BASELINE = THIS_DOCUMENT_COMMIT
INITIAL_TRACKED_FILES_MODIFIED = 7
INITIAL_STAGED_FILES = 0
INITIAL_UNTRACKED_FILES = 493

SAFETY_REPAIR_REVIEW = PASS
SINGLE_ATTEMPT_GUARD = PASS
PRECALL_ABSOLUTE_BUDGET_GUARD = PASS
ABSOLUTE_HARD_CAMPAIGN_BOUND_USD = 6.00
MEASURED_COST_SOFT_STOP_USD = 1.00
FIRST_TERRA_CANARY_DRY_RUN = ADMITTED
PROVIDER_CALLS = 0
OPENAI_CALLS = 0
GEMINI_CALLS = 0
TOTAL_REAL_COST_USD = 0
LIVE_PROVIDER = NOT_RUN
HUMAN_LIVE = NOT_RUN
P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
NEXT_ACTION = PROTOCOL_DESIGNER_V1_LIVE_PROVIDER_LONG_HORIZON_CANARY_01R
NEXT_ACTION_AUTHORIZED = NO
```

La nouvelle politique admet le premier appel Terra sans réduire sa borne ni son payload scientifique. Le canary n'a pas été lancé. L'identifiant exact du commit et la vérification après commit sont fournis dans le reçu local `validation/protocol-designer-live-canary-safety-baseline-finalization-01/finalization-receipt.json`, créé après ce commit ; cette référence évite une auto-référence de hash impossible dans le document commité.

## 2. Revue contradictoire et corrections attribuées

Les huit fichiers de la réparation ont été revus, avec une revue indépendante en lecture seule. Les guards de ré-extraction, le verrou exclusif, la séparation du fonctionnement normal, le replay et les frontières scientifiques sont conservés.

| Constat | Correction dans son propriétaire | Preuve |
|---|---|---|
| Un journal absent/vide ou privé d'une paire complète pouvait oublier le cumul et les appels consommés alors que les raw subsistaient. | `api/protocol-designer-provider-replay.ts` recoupe toutes les preuves brutes avec les références du journal, sous le verrou existant ; une preuve orpheline ferme la garde. | Tests MISSING, EMPTY et LOST_LAST_PAIR : aucun nouvel appel. |
| L'ancienne politique utilisait le même cumul conservateur pour le hard et le soft stop. | Deux cumuls dérivés du même journal : `committed` pour la protection absolue, `measured` pour le soft stop. Le snapshot 6/1 et les deux montants avant appel sont persistés et vérifiés. | B2, B3, B6 et dry-run séquentiel. |
| La classe de service OpenAI était implicite, alors que la borne suppose la classe standard. | Le transport canary ajoute seulement `service_tier=default` si le champ est absent. Une classe explicite non couverte, dont auto/priority, reste refusée. Le replay applique la même préparation aux seules preuves canary correspondantes. | B1/B7 vérifie le payload complet ; tests auto/priority et replay. |

La seconde revue du patch ne relève plus de défaut actionnable dans ce périmètre. Aucun refactoring général, moteur de comptage, owner ou compteur budgétaire parallèle n'a été ajouté.

## 3. Politique 6 USD hard / 1 USD mesuré soft

Le **hard bound de 6 USD** est la protection absolue selon le contrat de coût qualifié. Avant chaque transport :

`committed_before + conservative_upper_bound(next_call) <= 6 USD`.

Le cumul `committed` conserve une borne du coût des appels déjà consommés, fondée sur les quantités rapportées et les classes tarifaires conservatrices. La réservation du prochain appel couvre l'entrée, le maximum de sortie et les composantes facturables déjà qualifiées, dont cache et raisonnement. L'exclusion concurrente est tenue de l'admission à la capture finale. Tout coût ou état de preuve inconnu entraîne un refus ; une réservation non rapprochée ne devient jamais zéro.

Le **soft stop mesuré de 1 USD** utilise séparément le coût reconstitué à partir des usages rapportés et du snapshot tarifaire. Dès que ce cumul atteint 1 USD, aucun nouvel appel n'est admis. Un appel déjà lancé peut porter le coût au-delà de 1 USD : le soft stop ne constitue donc **pas** une garantie de dépense totale ≤ 1 USD. Le coût reconstitué n'est pas une facture fournisseur. L'arrondi du cumul vers le haut au nanodollar peut anticiper marginalement l'arrêt ; il ne retarde pas son déclenchement.

Les montants et la politique sont liés aux admissions du journal. Une ancienne campagne sans cette politique explicite ne peut pas être reprise silencieusement sous le plafond élargi. La configuration reste serveur, opt-in, avec un identifiant de campagne et une racine privée uniques et conservés. Le body navigateur ne peut pas augmenter le budget. Aucune configuration utilisateur n'a été activée par cette mission.

### Suffisance de 6 USD

Le dry-run utilise les 11 témoins du parcours navigateur synthétique IDM/IRM existant : 6 Terra et 5 Gemini. Chaque appel est traité par le vrai transport enregistré avec un fetch simulé, puis rapproché avant l'admission suivante ; une nouvelle instance du recorder est créée à chaque appel pour vérifier la continuité durable.

| Mesure | Résultat du dry-run |
|---|---:|
| Première réservation Terra | 5,394 USD |
| Premier Terra | ADMITTED |
| Maximum cumul conservateur antérieur + prochaine réservation | 5,4957 USD |
| Appels simulés admis séquentiellement | 11 / 11 |
| Coût reconstitué final des fixtures | 0,110225 USD |
| Cumul conservateur engagé final | 0,122225 USD |
| Appels provider réels | 0 |

La borne minimale pour **cette séquence et ces usages synthétiques** est 5,4957 USD ; la cible humaine de 6 USD suffit. Aucun relèvement supplémentaire n'est justifié. Ces usages injectés ne prédisent pas le coût live. Une prochaine réservation Terra de 5,394 USD reste refusée lorsque le cumul conservateur dépasse 0,606 USD, même si le cumul mesuré est encore inférieur à 1 USD. Ce refus est le comportement attendu du hard bound ; aucune promesse de terminer tous les tours live n'est faite.

Le plafond Terra reste fondé sur 1 050 000 tokens d'entrée, 8 000 tokens de sortie et les tarifs conservateurs du snapshot du 14 septembre 2026. Aucun comptage approximatif plus favorable n'a remplacé cette borne. Les prix/limites n'ont pas été recherchés à nouveau sur le réseau dans cette mission ; le contrat daté déjà qualifié est conservé. Toute modification ultérieure du contrat fournisseur doit être requalifiée.

## 4. Single-attempt et comportement scientifique

`LIVE_CANARY_PROVIDER_ATTEMPT_POLICY=SINGLE_ATTEMPT_FAIL_CLOSED` et `MAX_PROVIDER_ATTEMPTS_PER_LOGICAL_CALL=1` restent inchangés. Aucun retry transport, reroll ou seconde extraction n'est introduit. Après rejet schema/contractuel de l'extraction, la seconde extraction et le HOW payant restent interdits. Une sortie structurellement valide mais incomplète est conservée comme preuve.

Les modèles, reasoning efforts, prompts scientifiques, QRY, owners, contrats Project, candidate lifecycle et Human Review sont inchangés. Les payloads scientifiques sont comparés intégralement aux témoins du parcours ; la seule addition au payload transmis OpenAI est le paramètre technique de classe de service du canary. Le mode normal ne reçoit ni ce paramètre ni la politique canary et ses réparations existantes restent couvertes par leurs tests. Le replay canary accepte la requête d'adapter d'origine après la même préparation technique, sans tolérer une différence scientifique.

## 5. Option future : POST /responses/input_tokens

Le constructeur `buildOpenAIPersistentDeltaPayload` dans `api/protocol-designer-openai-extraction-provider.ts` prépare `model`, `instructions:string`, `input:string`, `text.format.json_schema`, `max_output_tokens:8000`, `store:false`, et le reasoning effort existant. Il est stateless et sans outils : le contenu et le schéma peuvent conceptuellement être liés à un futur résultat de comptage par digest.

La compatibilité directe n'est toutefois pas entièrement démontrée localement. Le client fixe `/v1/responses` et attend une réponse de génération ; le recorder refuse aujourd'hui `/responses/input_tokens`. Aucun SDK OpenAI ni schéma détaillé de cet endpoint n'a été retrouvé dans le code local inspecté. Les champs exacts acceptés/retournés, la couverture du schéma, la tarification et les garanties de correspondance sont donc `UNKNOWN` dans cette mission hors ligne. Le guide référencé par la qualification précédente est `https://developers.openai.com/api/docs/guides/token-counting` ; il n'a pas été reconsulté ici.

Option future : compter le contenu effectivement préparé, lier le résultat au digest et qualifier le coût ainsi que les erreurs de ce nouvel appel. Il ne s'agit pas d'un remplacement immédiat d'URL dans l'adapter. Aucune intégration, nouvelle dépendance ou requête de comptage n'a été ajoutée : la politique 6 USD rend ce travail inutile pour admettre le dry-run demandé.

## 6. Validation finale hors ligne

Le garde réseau préexistant est réutilisé byte-for-byte et inclus explicitement dans la baseline committée. Il retire les clés des processus de validation, neutralise les lectures `.env`, et bloque fetch ainsi que TCP/TLS non mockés. Les contrôles indépendants fetch/http/https/net/tls ont tous échoué avant émission réseau. Aucun provider réel n'a été appelé.

| Validation | Résultat |
|---|---|
| Tests directement liés aux guards et au middleware | 52 PASS, 0 FAIL |
| A1–A4, B1–B8, replay, observabilité, Product Bridge, long-horizon affecté | **82 PASS**, 0 FAIL, 7 fichiers |
| Suite complète finale | **4 006 PASS, 0 FAIL, 0 UNHANDLED**, 12 SKIP et 1 TODO historiques séparés |
| Fichiers de tests complets | 267 PASS, 2 SKIP |
| TypeScript app/API/server et configuration Node | PASS |
| Lint des huit fichiers affectés | PASS |
| Build | PASS ; avertissement existant de taille des chunks conservé |
| Diff whitespace | PASS |
| Dry-run de la nouvelle politique | Premier Terra et 11 témoins ADMITTED, 0 provider réel |

La preuve antérieure 4 002 PASS n'est pas réutilisée comme preuve finale : le patch a changé fonctionnellement, donc la suite complète a été relancée. Les quatre tests supplémentaires couvrent la classe auto et les trois pertes de journal. Les attentes B2/B3/Terra ont été actualisées pour le mandat budgétaire 6/1 ; les tests scientifiques A1–A4 et les autres tests historiques n'ont pas été affaiblis.

Le harness long-horizon rejoue les familles IDM/IRM, clinique non-imagerie et expérimentale non-médicale sur 15 tours chacune. Aucun nouveau parcours navigateur live n'a été lancé. Le dry-run standalone emploie `--config vitest.config.ts`, nécessaire pour conserver le module crypto Node ; le défaut de lancement avec l'alias crypto navigateur du Vite produit a été corrigé dans la commande, sans modification supplémentaire du produit.

Preuves compactes commitées :

- `validation/protocol-designer-live-canary-safety-baseline-finalization-01/qualification-results.json` : résultats, portée, revue et hashes des preuves détaillées.
- `validation/protocol-designer-live-canary-safety-baseline-finalization-01/canary-dry-run.json` : séquence d'admissions, réservations et rapprochements ; digest du journal source synthétique.

Les logs complets, résultats Vitest détaillés, baseline initiale, script local de dry-run et reçu Git final restent dans ce même répertoire local ; ils ne sont pas ajoutés en masse. Le journal source synthétique de la mission précédente reste inchangé.

## 7. Sélection Git et reprise

Whitelist de commit : les huit fichiers produit/tests de la réparation, ce rapport, les deux JSON compacts cités ci-dessus et le preload réseau préexistant. Aucun autre artefact historique n'est sélectionné.

Les 493 fichiers initialement non suivis sont inventoriés avec SHA-256. **492 restent byte-for-byte identiques**. Le seul fichier initialement non suivi dont le contenu évolue est `api/protocol-designer-canary-policy.ts`, explicitement inclus dans la réparation demandée. Ce module et le garde réseau deviennent suivis lors du commit ; les 491 autres fichiers historiquement non suivis restent hors index et intacts. Les sept fichiers produit déjà suivis sont committés avec eux.

Le commit est local, sans push ni déploiement. Les contrôles après commit doivent constater un worktree suivi propre et zéro fichier indexé ; le reçu local fournit le HEAD exact, la whitelist effective et le contrôle de préservation. Le prochain canary doit partir de ce HEAD vérifié, avec une nouvelle autorisation explicite, un identifiant/répertoire unique, une tentative par appel logique et la politique 6 USD hard / 1 USD mesuré soft. Aucun ordre d'exécution live n'est donné par ce rapport.

La garantie budgétaire dépend du contrat fournisseur qualifié, de la racine de campagne conservée et partagée par ses appels, et des preuves d'usage. Une destruction complète du répertoire par un opérateur, des appels extérieurs à cette campagne ou un changement non requalifié de tarification ne sont pas couverts. Une preuve manquante dans le répertoire conservé ferme désormais la garde.
