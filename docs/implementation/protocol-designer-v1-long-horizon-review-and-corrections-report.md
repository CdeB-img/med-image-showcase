# NOXIA — Revue contradictoire et corrections de la stabilisation long-horizon V1

Date : 2026-09-14.

Périmètre : vérifier l'exécution de `PROTOCOL_DESIGNER_V1_LONG_HORIZON_RUNTIME_STABILIZATION_01`, corriger ses erreurs/omissions et les défauts historiques démontrés susceptibles de dégrader la suite. Aucun appel provider, push ou déploiement. Ce rapport complète, sans réécriture rétroactive, le rapport de stabilisation initial.

## 1. Baseline et décision

```ini
REPOSITORY = /Users/charles/Documents/Projets/NOXIA/noxia-dev
BRANCH = protocol-designer-canonical-ingestion
REVIEW_HEAD_BEFORE = 40f981ee37ea62decc40141ec9d638f370d1c7dd
REVIEWED_PRODUCT_COMMIT = 1db9bde678daff53d2000fac0d84ed07daeca1be
REVIEWED_PRODUCT_PARENT = d4216edcf51ad87f7f1257b87c29232d920035f1
INITIAL_TRACKED_WORKTREE_CHANGES = 0
INITIAL_STAGED_FILES = 0
INITIAL_UNTRACKED_FILES = 474
MISSION_STATUS = LOCAL_REVIEW_CORRECTIONS_QUALIFIED_LIVE_NOT_DEMONSTRATED
PRODUCT_CORRECTION_COMMIT = b13d2b97326e10cb419f45c9954d05cff032d3da
REPORT_COMMIT = THIS_DOCUMENT_COMMIT
PRODUCT_CORRECTION_FILES = 45
PRODUCT_CORRECTION_DIFFSTAT = 2073 insertions / 557 deletions
STAGED_PRODUCT_DIFF_SHA256 = 8e3df7559ee1449d73e1f8a8ef168e46f4acd4c9593ec893154a9693798c118d
```

La revue ne confirme pas une exécution initiale sans omission. Les réparations utiles existaient, mais leur couverture coût/lifecycle/cache était incomplète et le niveau de preuve du harness était surqualifié. Les défauts trouvés ont été corrigés dans leurs propriétaires existants. Les limites de preuve live restent explicites.

## 2. Constats et corrections

| Défaut vérifié | Risque | Correction dans le propriétaire existant |
|---|---|---|
| La coupure publique couvrait le bridge mais pas les anciennes entrées scientific-intake/scientific-interpretation/alias semantic | Dépenses malgré la fermeture du formulaire | Même garde fail-closed avant credentials/transport sur les handlers encore exposés |
| Coûts perdus lors de rejets Language Gateway, erreurs HTTP, lecture du corps échouée, continuation post-adoption et sorties locales | Sous-estimation des dépenses, latence non attribuable | Observation aux adapters, erreurs typées porteuses des observations, rattachement systématique au bridgeTrace de session existant |
| Un coût inconnu pouvait disparaître dans un total numérique | Confusion entre coût nul et sous-total connu | Sous-total accompagné de `costIncomplete` et du nombre d'appels non chiffrables ; propagation conservée après troncature des traces UI |
| Candidates des owners absentes du lifecycle retenu | Bouton Human Review fonctionnel mais confirmation/refus naturels non équivalents | Les cinq chemins ST/Study Design/OBS/Imaging/Biostatistics utilisent le même lifecycle, lié à la validation PRJ existante et non à une prétendue extraction provider |
| Refus naturel sans référence explicite du tour de décision | Provenance humaine incomplète | Référence du tour de refus ajoutée à l'enveloppe existante |
| « Je retiens la question 1 » non reconnu par ST | Sélection naturelle inaccessible | Correction du résolveur ST existant ; les formes négatives ne sélectionnent pas ; sélection toujours candidate avant Human Review |
| Réutilisation ST fondée sur une identité partielle | Résultat périmé malgré changement de Knowledge/contexte | Identité native complète, lecture de fraîcheur existante et absence de dépendance inattendue ; identité Knowledge incluse dans l'identifiant de requête |
| Comparaison Project adoptée ignorée si sa phrase ne passait pas un détecteur lexical | Questions/hypothèses utiles absentes hors Knowledge | ST consomme la comparaison déjà représentée, ses références adoptées et son endpoint ; garde sur UNKNOWN, provenance et identité Project ; aucune nouvelle liste de synonymes |
| Harness indépendant du vrai payload provider, HOW toujours indisponible | Faux positif de parité et réalisation acceptée non testée | Passage par le vrai handler API et l'adapter ; fixture sélectionnée seulement à partir du payload réellement transmis ; validation du schéma, catalogue, texte et contexte Project |
| Assertions principalement présence/version | Perte sémantique silencieuse possible | Oracle par tour, contenu scientifique des réponses, objets non ciblés identiques, UNKNOWN conservés, besoin résolu non redemandé, QRY lié au Project courant |
| Pas de record/replay durable des prochains appels locaux | Chaque incident live pouvait nécessiter une nouvelle dépense | Enregistrement au transport local avec le store atomique existant, références/digests, replay strict sans fallback |

Pas de nouveau router, owner, moteur scientifique ou ontologie. Aucun changement de modèle, prompt ou politique de retry. Project reste adopté uniquement par décision humaine ; TRACE et l'observation des coûts ne deviennent pas des owners décisionnels.

## 3. Dettes historiques traitées

La suite initiale de revue donnait **3 931 PASS, 4 FAIL, 12 SKIP, 1 TODO**. Les trois assertions jusqu'alors non attribuées ont été reproduites séparément au parent `d4216ed...` : elles n'étaient pas de nouvelles régressions du commit de stabilisation.

- `p-web-02-contract.test.tsx` : assertion sur un ancien titre. Le test vérifie maintenant le vrai H1 courant et la présence du champ, sans retirer les invariants d'entrée scientifique.
- `p1-behavior-01c-biospecimen-projection.test.tsx` : ancien titre de rubrique Imagerie. Seul le repère d'interface change ; la séparation des prélèvements reste testée.
- Deux assertions Scientific Thinking sur l'étude rachidienne : véritable omission runtime de la comparaison Project structurée, corrigée dans ST. Les hypothèses restent candidates `PENDING`, sans prétendre avoir un support Knowledge lorsqu'il est absent.
- TypeScript serveur : deux propriétés d'occasion optionnelles sont matérialisées à `null` conformément au contrat nullable, et un argument du contrôle de références est explicitement `unknown`.
- Mocks UI incomplets du client : réutilisation des exports réels et remplacement limité aux méthodes voulues, sur treize factories concernées. Une classe d'erreur manquante provoquait des rejets asynchrones ; aucune assertion produit n'est supprimée pour obtenir le vert.

Cette correction ne signifie pas que toute dette historique du repository est éliminée. Les tests ignorés/TODO et les warnings de build restent séparés.

## 4. Coût et capture durable

L'observation couvre succès, échec HTTP, timeout, erreur réseau, corps illisible, rejet de contrat après consommation provider et réalisation post-adoption. Les doublons sont évités par `callId`. Le cumul survit aux tours locaux sans appel et à la restauration de session ; la fenêtre UI demeure bornée à vingt traces.

Le waterfall/calcul historique du rapport initial reste un **calcul sur snapshot tarifaire et logs historiques**, pas une facture ni une mesure du canary humain à 0,30 EUR. Aucun tarif actualisé ni nouveau coût live n'est revendiqué ici. La part Terra historique ne démontre pas le coût de la prochaine conversation longue. L'usage manquant est UNKNOWN, jamais une preuve de gratuité.

Le transport local enregistre désormais dans `.provider-evidence.local/`, ou `PROTOCOL_DESIGNER_EVIDENCE_DIR` explicite :

- requête et réponse provider, texte exact hors redaction ;
- endpoint/modèle/effort, usage et identifiants disponibles dans la réponse ;
- session/tour/purpose/retry metadata, transmis localement hors payload externe ;
- horodatage, latence, statut réseau/HTTP et digests de l'échange ;
- pré-enregistrement `REQUEST_PREPARED`, puis référence `COMPLETED`.

Réutilisation : `FileScientificInterpretationEvidenceStore`, sans second stockage de vérité scientifique. L'échec du pré-enregistrement bloque avant toute dépense. Si le provider a déjà répondu mais que sa capture échoue, le runtime conserve cette réponse et ses coûts, ne retente pas l'appel et signale `PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED`. La présence d'une préparation sans complétion reste une limite de capture explicite.

Le replay exige une requête exactement liée, un digest intègre et une réponse disponible. Il consomme chaque référence une seule fois, sérialise les consommations concurrentes et conserve l'ordre des démarrages, sans fallback live. Les identités/temps éphémères doivent être reproduits pour un replay byte-exact : aucun matcher permissif n'est ajouté.

Secrets/configurations de credentials et headers d'authentification ne sont pas stockés ; redaction des valeurs connues et des clés sensibles. Les dossiers locaux sont privés et exclus de Git. L'accès HTTP direct et via `@fs` est refusé par Vite : les deux chemins ont retourné 403 lors du contrôle local avec un marqueur synthétique ensuite supprimé. Un stockage local n'est pas une politique de conservation cloud, une anonymisation de données de santé ni une autorisation d'envoyer des données personnelles.

## 5. Gate historique et représentativité

Le défaut de confirmation T03 a été reproduit **après coup** sur une exportation isolée du parent `d4216ed...`, avec le harness original repris byte-for-byte de `1db9bde...`, sans modification du runtime baseline et réseau bloqué :

```ini
FIRST_DIVERGENT_TURN = c'est bon
EXPECTED_PROJECT_REVISION = 2
OBSERVED_PROJECT_REVISION = 1
FIRST_BLOCKING_BOUNDARY = STANDARD_WORKSPACE_PRE_ENTRY_DECISION_BOUNDARY
```

Reçu reproductible versionné : `src/features/protocol-designer/functional-reset/__tests__/fixtures/long-horizon-historical-red-gate.json`. Il est explicitement `POST_HOC_ISOLATED_BASELINE_REPRODUCTION`, **pas un reçu pré-réparation original**. Cela établit la capacité de détection de cette classe, sans réécrire la chronologie de l'exécution initiale.

Le contrat de bridge réellement invalide reste rejeté depuis le champ Standard. Une HOW 503 laisse la contribution valide accessible sans adopter le Project. Une HOW conforme et acceptée est également vérifiée, jusqu'à l'identité entre réponse acceptée et réponse visible.

## 6. Trois parcours dans le navigateur réel

Une configuration DEV explicitement offline a été ajoutée : `scripts/v1-long-horizon-offline-browser.config.ts`. Elle ne charge aucun fichier de credentials, appelle le vrai handler bridge, substitue uniquement le transport provider et refuse les autres endpoints API. Les fixtures sont partagées avec le harness et contrôlent le **payload provider réel**, sans lecture latérale de la requête du bridge.

Les trois familles ont été parcourues depuis le premier tour dans un navigateur réel sur une origine jetable `127.0.0.1:53197`, par le champ Standard, Envoyer et les actions Human Review existantes. Aucune session utilisateur existante n'a été vidée. T01–T05 sont inchangés.

| Famille | Tours | Révision finale | Invariants exercés |
|---|---:|---:|---|
| A — IDM/IRM | 15 | 4 | Correction critère, population multi-champs, réserve/exemple, refus 6 mois, adoption 12 mois, propositions/discussion, refus analyse |
| B — diabète/suivi clinique | 15 | 3 | Critère secondaire, maintien 24 semaines après refus 36 semaines, multicentrique avec incertitude, propositions, refus analyse |
| C — alliage/traitements thermiques | 15 | 3 | Exposition 40 cycles, refus 60 cycles, lecture aveugle, propositions, refus mesure secondaire |

Preuve HTTP : 17 échanges bridge, tous HTTP 200 ; 30 transports provider **simulés**, dont 13 HOW acceptées. Zéro appel provider réel. Les tours traités localement ne génèrent pas d'échange HTTP et sont observés dans le navigateur/harness.

Sessions isolées :

```text
A scientific-conversation:20124519-2a1d-48f1-948b-91c2df8dc521
B scientific-conversation:5651356a-7ca0-4dff-b45f-e3f5703a9d9f
C scientific-conversation:961858c5-470b-4710-ade5-d1c04c774dcb
```

Le journal exact local est `/private/tmp/noxia-long-horizon-browser-review-20260914/browser-http-exchanges.jsonl`, SHA-256 `06753bf1f810377718006a287dbfaedee23872790cda6d65b85956e0bc9c4a26`. Ce fichier temporaire n'est pas admis dans le commit ; le harness/config/corpus sont reproductibles dans le repository. Ce digest permet d'identifier la preuve conservée sur la machine, sans promettre la pérennité de `/private/tmp`.

### Frontière de preuve incontournable

Les réponses des trois parcours sont des **SYNTHETIC_CONTRACT_FIXTURE**, pas les sorties enregistrées d'une campagne provider réelle de 45 tours. Le contrôle réel du payload évite le faux positif d'un mock ignorant l'entrée, mais ne prouve pas que Luna/Terra/Gemini produiront ces sorties.

```ini
UNIT_PROPERTY = PASS
JSDOM_STANDARD_RUNTIME = PASS
REAL_BROWSER_SYNTHETIC_ADAPTER_REPLAY = PASS
RECORDED_LIVE_PROVIDER_45_TURN_CORPUS = NOT_AVAILABLE
RUNTIME_BROWSER_REPLAY_WITH_RECORDED_LIVE_RESPONSES = NOT_RUN
LIVE_PROVIDER = NOT_RUN
HUMAN_LIVE = NOT_RUN
PRODUCT_WORKS_LIVE = NOT_DEMONSTRATED
```

Les huit propriétés sont exercées dans le harness depuis Standard : non-mutation avant décision, refus, préservation des objets non ciblés, besoin résolu non redemandé, rejet des vrais contrats invalides, exemple non promu en règle, réserve non promue en fait, QRY actuel. L'inspection navigateur complète cette preuve de runtime ; elle ne démontre pas une compétence linguistique/scientifique générale du provider. Aucun document n'a été généré : DOC long-horizon reste non qualifié par ces trois parcours.

## 7. Validation finale

```ini
TARGETED_RUNTIME_AND_PROVIDER_TESTS = PASS
HISTORICAL_FOUR_FAILURES = CORRECTED
TYPESCRIPT_APP = PASS
TYPESCRIPT_NODE_CONFIG = PASS
TYPESCRIPT_API_AND_SERVER = PASS
STATIC_SERVER_ESM_LOADING = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS
FULL_SUITE = PASS
FULL_SUITE_PASS = 3978
FULL_SUITE_FAIL = 0
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_UNHANDLED_ERRORS = 0
FULL_SUITE_PROCESS_EXIT_CODE = 0
GIT_DIFF_CHECK = PASS
```

Les tests sont exécutés avec une garde bloquant `fetch` et les sorties Node http/https/net/tls ; les transports explicitement mockés ne peuvent pas retomber silencieusement sur un provider. Le canary payant n'est pas lancé, conformément à la demande actuelle.

Le rapport JSON-only d'une exécution intermédiaire indiquait 3 978 assertions passantes mais le processus sortait en erreur : Vitest n'y sérialise pas ses erreurs globales. La capture complémentaire a exposé quatre rejets asynchrones de mocks incomplets. Leur correction ciblée donne 103 PASS sur les douze derniers fichiers concernés, sans erreur globale. L'exécution finale avec reporters texte + JSON confirme ensuite les nombres ci-dessus et un processus à code 0. Aucun échec n'est ignoré au motif que les seules assertions passent.

Preuve finale locale :

```text
/private/tmp/noxia-long-horizon-qualified-full-20260914.json
SHA256 33ad604f56337e8de196c4067bd50541d0ba9beb915be61c94b0a91b6a860f37
/private/tmp/noxia-long-horizon-qualified-full-20260914.log
SHA256 f1cf2a24f87fafce141e8cb052891bbb1288e047a3efd58c1387cb39c90cc998
```

Le gate TypeScript complet du repository passe, y compris API NodeNext et chargement statique des handlers, en complément du contrôle app/config Node. Lint affecté et build production passent. Les itérations de suite globale ont servi à attribuer les échecs puis à détecter les erreurs asynchrones absentes du reporter JSON ; elles ne sont pas des replays provider.

Warnings de build hérités : base Browserslist ancienne, annotations de react-helmet, avertissement de minification CSS et taille de chunks. Ils ne sont pas présentés comme erreurs de cette qualification ni comme entièrement corrigés. Les tests SKIP/TODO restent hors démonstration.

## 8. État livré et limites

L'application locale a répondu HTTP 200 sur `http://127.0.0.1:5198/protocol-designer/demo`, sans message soumis. Le serveur offline de qualification est distinct du serveur de retest utilisateur. La fermeture publique est qualifiée **dans le code local**, pas attestée sur la production puisqu'aucun déploiement n'est autorisé.

Les 474 fichiers non suivis préexistants restent hors des commits ; aucun artefact historique n'est réécrit. Le commit produit et le commit de rapport utilisent des listes explicites. Le rapport présent est la seule admission documentaire nouvelle. Aucun reset/clean/stash/rebase, mass-add, push ou déploiement.

La latence humaine de 56 secondes n'est pas attribuée rétrospectivement avec certitude à une seule cause : le quota partagé était un risque réel corrigé précédemment, mais le witness provider exact de cet incident manque. Aucun gain de latence live chiffré n'est revendiqué. Les mécanismes de capture nouvellement qualifiés doivent permettre d'éviter cette absence de preuve au prochain incident local.

```ini
PROVIDER_CALLS = 0
OPENAI_CALLS = 0
GEMINI_CALLS = 0
PUSH = NO
DEPLOYMENT = NO
P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
NEXT_ACTION = HUMAN_LOCAL_REVIEW; LIVE_CANARY_REQUIRES_SEPARATE_EXPLICIT_AUTHORIZATION
```
