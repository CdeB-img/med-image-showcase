# Préparation isolée de la release NOXIA

Date : 9 octobre 2026. Cette préparation résout les défauts techniques démontrés sans choisir une nouvelle politique produit, scientifique ou financière. Le candidat est prêt pour une revue d’intégration dans main, mais pas pour une autorisation Production. Aucun déploiement, appel fournisseur réel, accès au contenu utilisateur Production ou changement distant n’a été effectué.

## Sources et références protégées

Le routage documentaire suit le SOURCE-OF-TRUTH-INDEX 1.45, PD-003 et sa compatibilité legacy v2, PD-011 et les conventions DOC. Ce rapport est une preuve de préparation opérationnelle, pas une nouvelle autorité normative.

| Référence | État vérifié |
| --- | --- |
| Départ de la préparation | `c5424158ff1d94c221505b9c52fce998146f6ad0` |
| Worktree isolé | `/Users/charles/.codex/worktrees/production-release-preparation/noxia-dev` |
| Branche de préparation | `codex/production-release-preparation` |
| HEAD de l’implémentation qualifiée | `582fdee5ef823dea3e900c5aa852a72133e2b60e` |
| Branche produit préservée | `codex/document-working-revision`, `c0ad017e1ab927f80316714ae21da61a33e8897e` |
| Branche TRACE préservée | `codex/trace-studio-coverage`, `c5424158ff1d94c221505b9c52fce998146f6ad0` |
| main local | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| main distant relu sans fetch ni push | `91a8ee880cfd1dd128b6f45f9b72ee8408816dad` |
| Ancêtre commun main distant et candidat | `3b0cc47da988e17a1c690e1d6f1f46217686c1ec` |
| Divergence main distant et candidat de départ | 8 commits main uniquement, 128 commits candidat uniquement |
| Production actuelle | `d4156da36ff03e4175b91fca97ce8a875ef4e3bf`, `dpl_7LadkGw7bGeP8fzdAx73Gx67atjv`, READY |
| Alias Preview stable | `noxia-preview-cdeb-imgs-projects.vercel.app`, `dpl_68Z1XyespLACbtWbq5MhcLUwMFZj`, c5424158, READY |
| Golden conservé | `protocol-designer-golden-post-p0-2026-10-07`, cible `c722279f4ed6b2fae1b5d453c02d3bf43eecbde6` |
| Objet du tag annoté | `56f3a04517fe7d902881a7e687c8fab8530d9c9d` |

Le candidat de départ descend du commit réellement déployé en Production : comparaison d4156da/c5424158 = 0/89. Aucune branche protégée ni référence golden n’a été déplacée. Aucun merge global de main n’est présenté comme réalisé.

## Correctifs indépendants committés

| Commit | Propriétaire et portée |
| --- | --- |
| `d04be391accdf6aaf737283411e3a4f885a30554` | Guard et bridge : diagnostics precount bornés repris de main et message PUBLIC_SESSION_LIMITED. Aucun changement de budget/admission. |
| `a49efd9b89313c3ebe1325b6250c451ac04d3f31` | Configuration fournisseur : opt-in Azure explicite `NOXIA_TERRA_MODEL=gpt-6.1-sol`, indépendant de l’environnement. Activation distante non effectuée. |
| `a9b4ceaf0b46251c69e3275ea8e948691a847f22` | Workspace : découverte et consultation inerte des conversations legacy v3 compatibles, sans conversion, adoption ni écriture de sauvegarde. |
| `582fdee5ef823dea3e900c5aa852a72133e2b60e` | DOC SQL : rejet des bindings JSON absents dans 004/005; répétition PostgreSQL locale avec données synthétiques et runtime guard historique exact. |

Le commit de clôture ajoute uniquement ce rapport et l’inventaire main. Les dépendances et le lockfile sont inchangés. Les mécanismes Project, générations, archive et validation native scientifique n’ont pas été réécrits.

## Divergence main et dispositions proposées

L’[inventaire détaillé](main-only-inventory.json) conserve pour chaque commit le SHA complet, le sujet exact, tous les fichiers changés, la finalité, les différences actuelles et les tests pertinents. Les classifications ci-dessous sont des dispositions proposées, pas une décision silencieuse de supersession.

| Commit main uniquement | Disposition | Écart déterminant |
| --- | --- | --- |
| `81b8fd8e447efd881eeee3f22163d1f0e711f667` | HUMAN_DECISION_REQUIRED | Défauts main 512 admissions / soft-stop 6 USD et validation jusqu’à 10; candidat 8 / 1 USD. Configuration Production rapportée 512 / 3 USD reste supportée. Message de refus repris seul. |
| `bedeef1a3a3b34c7d9f6beac964192708e365b1d` | POTENTIALLY_SUPERSEDED | Protection contre Review obsolète couverte par checkpoints/receipts actuels; helper et texte historiques non identiques. L’ancienne UI Review a été remplacée par décision produit explicite. |
| `9e14e598182642890ae52a211c884448202c4491` | KEEP | Diagnostic safe du precount absent sous cette forme : port minimal réalisé au guard actuel, tests de confidentialité ajoutés. |
| `5f3b108b056b57aaae759dddda3c5ff4e2e02c13` | POTENTIALLY_SUPERSEDED | Navigation persistante et scroll interne actuels; dimensionnement du composer différent de l’auto-fit main 3–15 lignes / 38 % viewport. Choix UX résiduel à confirmer. |
| `b1803c43f72529e0a702840e56629d5178bc73c7` | POTENTIALLY_SUPERSEDED | Accounting des incomplete connus et normalisation des sources présents. WD actuel 64 000 tokens, pas le plafond main 16 000 : contrats de capacité/coût non identiques. |
| `964786a5ad47f777cfe64bd0f17affa5f418467d` | HUMAN_DECISION_REQUIRED | Adoption naturelle directe d’une Review recommandée et fallback de provenance par suffixe d’atome, différents du scope présenté exact actuel. Ne pas importer un binding affaibli. |
| `3f643c4bef61c4092c9d345dfdbf7d35242959d4` | HUMAN_DECISION_REQUIRED | Grammaire des actes de validation et routage scientifiques différents; aucune équivalence complète démontrée. |
| `91a8ee880cfd1dd128b6f45f9b72ee8408816dad` | POTENTIALLY_SUPERSEDED | Indicateur technique WD retiré du Standard selon décision utilisateur, WD lazy; checkpoints et sources pending conservés. Supersession recommandée du seul affichage. |

Bilan : 1 KEEP, 4 POTENTIALLY_SUPERSEDED, 3 HUMAN_DECISION_REQUIRED; 0 ALREADY_EQUIVALENT_WITH_PROOF. Les sous-comportements déjà présents ne suffisent pas à qualifier un commit entier comme équivalent.

### Douze fichiers potentiellement conflictuels

Il s’agit de zones de conflit potentielles entre les lignées, pas de douze entrées Git actuellement unmerged. Aucun merge forcé n’a été entrepris.

| Fichier | Nature et traitement |
| --- | --- |
| `api/protocol-designer-bridge.ts` | Message mécanique repris; conserver orchestration DOC/Studio et guards actuels. Capacité WD : arbitrage coût/contrat. |
| `api/protocol-designer-openai-extraction-provider.ts` | Différence comportementale de capacité sortie/options, sensible au coût. Ne pas revenir au provider historique par merge textuel. |
| `server/protocol-designer-canary-policy.ts` | Politiques d’admission et soft-stop sensibles au coût; états incomplete connus gérés actuellement. Défauts non remplacés. |
| `server/protocol-designer-durable-guard.ts` | Diagnostic mécanique safe repris; accounting et reprise de scopes durables actuels préservés. |
| `src/features/protocol-designer/__tests__/durable-public-handler.test.ts` | Tests de politique à conserver/reconcilier après décision; le passage actuel ne décide pas les nouveaux défauts. |
| `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx` | Architecture de hooks/viewport actuelle vs monolithe historique; écarts UX/adoption non purement mécaniques. |
| `src/features/protocol-designer/functional-reset/__tests__/continuous-project-build.test.tsx` | Tests scientifiques/lifecycle : adapter seulement après choix de sémantique, sans réduire les invariants exacts. |
| `src/features/protocol-designer/functional-reset/__tests__/v1-researcher-ux-refinement-01.test.tsx` | Écart UX dimensionnement/scroll; ne pas assimiler les deux implementations. |
| `src/features/protocol-designer/functional-reset/__tests__/working-draft-provider-contract.test.ts` | Contrat WD/capacité : distinction 16 000 vs 64 000 et coûts à conserver. |
| `src/features/protocol-designer/functional-reset/continuous-project-build.ts` | Source-set/checkpoints natifs vs source conversation historique; différences d’adoption scientifiquement significatives. |
| `src/features/protocol-designer/functional-reset/natural-conversation-policy.ts` | Validation naturelle, confirmations qualifiées et scope exact : choix produit/scientifique nécessaire. |
| `src/features/protocol-designer/functional-reset/study-proposal-standard.ts` | Identité canonique exacte vs suffixe d’atome : provenance significative, pas un simple conflit syntaxique. |

La préparation isolée incorpore les seuls ports démontrables. Une intégration main complète attend les dispositions humaines restantes; elle ne peut pas être déclarée sans perte sémantique aujourd’hui.

## Continuité des sauvegardes legacy

L’ancien namespace `noxia-protocol-designer-functional-reset-v3` n’est pas découvert par le chargeur courant v4. Celui-ci exige `contentEpoch=DOC_ARCHIVE_CLEAN_V1`, incompatible avec les sauvegardes historiques sans epoch. Forcer cet epoch convertirait artificiellement leur portée documentaire.

Le reader `legacy-session-reader.ts` accepte uniquement le contrat historique `FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION` 2.0.0 sans epoch et l’identité Project exacte `${sessionId}:research-project`. S’il existe, le Project archivé est vérifié par `restoreResearchProjectOwnerProjection`; sa projection normalisée n’est pas réécrite dans le stockage.

Le workspace expose une consultation en lecture seule des entrées TEXT USER/NOXIA. L’ouverture, le rechargement et l’ancien pointeur actif ne créent ni sauvegarde v4, ni nouveau Project, ni appel fournisseur. Aucune action d’adoption, renommage, suppression ou génération n’est exposée dans la surface historique. L’API de découverte v4 garde sa forme initiale; seule l’UI demandant explicitement le legacy reçoit les champs supplémentaires.

Les bytes d’origine, les anciens états et les documents inline restent préservés dans leur sauvegarde. Ils ne sont ni migrés dans l’archive DOC ni déclarés conformes aux contrats actuels. Les contrats plus anciens ou invalides restent conservés et signalés non interprétables. Ce correctif restaure une conversation consultable, pas une migration éditable exhaustive.

Qualification : 8 tests déterministes, dont coexistence v3/v4, reload, aucun write/provider, pointeur actif historique, identité Project étrangère, digest falsifié, epoch incorrect et contrat non supporté. Aucun contenu utilisateur Production n’a été lu. La réouverture reste limitée à l’origine/navigateur possédant la sauvegarde et les accès existants; aucun transfert d’accès n’est inventé.

## Compatibilité et plan des migrations

Le catalogue Production rapporté au preflight contient les tables du guard et `public_project_snapshot`, mais pas DOC 002–005. La migration 001 est partiellement compatible : colonnes présentes, CHECK des états fournisseur limité au sous-ensemble historique. Cet état est une observation du preflight, pas un nouveau contrôle du contenu Production dans cette mission.

États supplémentaires requis : `INCOMPLETE_CONTENT_FILTERED`, `INCOMPLETE_MAX_OUTPUT_TOKENS`, `INCOMPLETE_OTHER`, `INCOMPLETE_UNSETTLED`, `PROVIDER_HTTP_FAILED`, `PROVIDER_RESULT_FAILED`, `PROVIDER_USAGE_UNSETTLED`.

### Défaut SQL corrigé

Les anciens CHECK de 004/005 admettaient SQL NULL lorsque les clés d’identité JSON manquaient. Une valeur `{}` passait donc les bindings de colonne. Le défaut a été reproduit sur PostgreSQL local réel avant correction.

Les contraintes additives nommées `doc_working_revision_native_binding_required` et `doc_studio_intent_native_binding_required` imposent un objet JSON et `coalesce(..., false)` sur les égalités natives. Les checks historiques, clés étrangères et triggers d’immutabilité/append-only restent présents. Aucune ligne ou body historique n’est réécrit ou supprimé. Une ligne préexistante invalide bloque le durcissement; la transaction est annulée, sans correction automatique de données.

### Séquence à exécuter seulement après autorisation Production

1. Confirmer le target réel, le catalogue à jour, la présence des contraintes, la sauvegarde/PITR et la restauration testée; identifier les opérations en vol et planifier les verrous DDL.
2. Utiliser les fichiers natifs dans l’ordre 001 compatibilité guard, 002 archive, 003 réservations terminales, 004 Working Revision, 005 Finalization Intent. Sur le schéma Production rapporté, appliquer la séquence dans une transaction explicite; annuler entièrement au premier échec. Ne pas créer un nouveau moteur de migration.
3. Vérifier en lecture de catalogue les états, clés, index, checks et triggers attendus. Ne pas créer de données utilisateur synthétiques en Production, ni réparer des lignes sans autorisation distincte.
4. Autoriser séparément le candidat, sa configuration et sa qualification réelle. Conserver les historiques et preuves fournisseur; aucune down-migration destructive.

| Fichier | SHA-256 qualifié |
| --- | --- |
| `001_protocol_designer_durable_guard.sql` | `abaa9073fbec68f8906bae0975f66bbaa6062f74ff35d20bb07e8cca15ee9118` |
| `002_doc_generation_archive.sql` | `f19cf4fe7e3fa68748ac6f7b941d9c50249539d476c775d5515699f430525923` |
| `003_doc_archive_terminal_reservations.sql` | `6edf337bc03544b5ae183198043fd0b39d6f9ac5637d12b273bcdc04fbaf17b3` |
| `004_doc_working_revision.sql` | `4a7b6adfcbb7aa27e71599f93118d3fb5a55e5b30c0c842e36f6270d819ac718` |
| `005_doc_studio_finalization_intent.sql` | `93b3cb4a8e70c2806e734cd633ee5dd74bc23fb921b3a4f8c5e08d4d300afea0` |

### Répétition locale et limites

`migration-rehearsal.mjs` refuse toute URL hors loopback et toute base sans nom dédié `noxia_release_test_*`. PostgreSQL local natif 17.6 a été utilisé dans un répertoire temporaire, avec identifiants synthétiques et sans credentials de déploiement. Les clusters ont été arrêtés et conservés; aucune migration distante n’a été appliquée.

19 contrôles passent : ancienne contrainte rejetant un état nouveau, migration interrompue et rollback transactionnel, fixtures financières legacy non vides préservées, admission des sept états nouveaux, rejet d’état inconnu, immutabilité des métadonnées/body, append-only des saves/intents, rejet de bindings contradictoires/absents et FK étrangère, concurrence de sauvegarde avec un seul gagnant, save historique encore adressable, idempotence 001–005 sur données non vides, échec de save sans perte, données invalides préexistantes bloquant le durcissement, sous-ensemble SQL historique conservé et guard d4156da effectivement exécuté sur le schéma augmenté avec provider mocks uniquement.

Le loader `historical-runtime.mjs` charge les sources Git exactes d4156da en mémoire. Il ne relabellise pas le runtime courant comme historique. Ce test prouve l’admission, la consommation et la récupération d’une opération ancienne normale; il ne prouve pas que l’ancien runtime comprend les nouveaux états terminales, sessions v4 ou fonctions Studio.

### DDL lazy encore présent

Les accès archive (`protocol-designer-document-archive.ts`) appellent 002/003 via `authorize`/`ready`, y compris history/body/receipt. Les stores Working Revision et Finalization Intent appellent 004/005; le snapshot Project peut créer schema/table. La pré-application des migrations ne retire pas ce DDL des workers froids : certains scripts recréent triggers ou contraintes, même si les données ne changent pas.

Un accès applicatif présenté comme lecture peut donc écrire le catalogue et requérir les droits DDL. Aucun de ces accès n’a été appelé en Production. L’exploitation doit choisir explicitement entre ce mécanisme existant avec droits/verrous audités et une réparation bornée séparant installation et runtime. La réussite locale ne démontre pas une configuration least-privilege Production.

## Configuration fournisseur et exposition financière

Le propriétaire est `server/protocol-designer-openai-provider-config.ts`. Le sélecteur `NOXIA_PREVIEW_TERRA_MODEL` reste strictement réservé à Preview; il est toujours rejeté en Production. Le nouvel opt-in explicite `NOXIA_TERRA_MODEL=gpt-6.1-sol` est accepté uniquement pour Azure et cette valeur exacte. Les valeurs étrangères et configurations incompatibles restent rejetées. Aucun paramètre distant n’a été activé.

Deux options humaines : conserver le défaut Production mappé `gpt-6-sol` avec sa qualification propre, ou autoriser l’activation 6.1 par le sélecteur général puis qualifier la configuration réelle. Les capacités, credentials, quotas et readiness fournisseur Production ne sont pas démontrés par les mocks : `PROVIDER_READY=UNKNOWN`.

Les valeurs rapportées du preflight restent distinctes des défauts de code : Preview 16 admissions / soft-stop 1 USD; Production 512 / 3 USD; borne hard 6 USD par session. Les défauts du candidat restent 8 / 1 USD, inchangés. Le plafond est par session, pas un plafond global compte/campagne. Le quota de 6 admissions/minute est par client réseau; l’expiration de quota après 24 h d’inactivité ne réinitialise pas les coûts.

Le guard durable encadre les opérations Responses passant par `createBudgetedFetch`, avec réserve conservatrice et accounting natif. Une mesure incertaine ne devient pas un succès consommable. Le soft-stop n’est pas une garantie de facture maximale 3 USD; l’admission prend aussi en compte la réserve jusqu’à la borne hard.

La capacité WD actuelle de 64 000 tokens est un contrat préexistant du candidat, contre 16 000 dans le correctif main. Les tests financiers ont une réserve pouvant atteindre environ 5,57 USD pour un packet volumineux; celle-ci peut rester admissible sous hard 6 USD si le cumul le permet. Cette préparation ne choisit ni réduction de capacité scientifique ni augmentation de budget.

### Transcription hors guard durable

La branche transcription du bridge retourne avant l’admission durable. `server/protocol-designer-transcription.ts` envoie directement à OpenAI audio `gpt-4o-transcribe`, avec limite 3 Mo et timeout 60 s, sans accounting/coût/quota session durable équivalent. Cette situation existe déjà dans d4156da; elle n’est pas introduite par ce candidat.

La politique humaine doit choisir un encadrement adapté à la durée/coût sous l’infrastructure existante, une enveloppe/rate-policy séparée explicite, ou une limitation/désactivation assumée pour la release initiale. Aucun budget n’a été modifié et le microphone n’a pas été désactivé silencieusement.

## Portée scientifique de la release

Les protections observées restent actives : Working Revision UNASSESSED distincte de Project truth; assessment Studio 1.2.0 lié au save/Project exact; DOCUMENT_ONLY et AMBIGUOUS sans coverage scientifique, PROJECT_CHANGE avec références natives; source-set conversation/Studio sans faux USER; préparation réutilisable exacte; décision humaine liée à l’intent/scope gelé; PRJ seul propriétaire de l’adoption; pack DOC complet validé puis archive atomique; replay éditorial conditionné aux anchors/contexte et collisions fermées.

L’édition conversationnelle éditoriale a une preuve PASS_REAL antérieure sur le candidat c5424158. La préparation isolée actuelle a PASS_OFFLINE, pas une nouvelle qualification réelle. La finalisation Studio scientifique complète n’est pas qualifiée en réel sur ce candidat exact.

Décision requise, non prise : A, autoriser une qualification scientifique réelle bornée avec scénario et budget exacts; ou B, limiter explicitement la portée initiale à des workflows éditoriaux qualifiés. B nécessiterait des gates serveur produit définis et implémentés après décision, pas seulement une mention documentaire. Aucun workflow actuel n’est désactivé dans cette mission.

## Rollback de trafic et récupération fonctionnelle

Le déploiement Production d4156da est encore READY et identifié. Un retour de trafic est donc préparé comme opération d’infrastructure, mais pas exécuté ni déclaré suffisant pour les données nouvelles.

Le guard historique fonctionne sur le schéma additif local pour le sous-ensemble normal testé. Son frontend utilise v3 et ne découvre pas v4; il ne sait pas exposer les nouveaux drafts/intents/générations DOC. Un rollback après usage v4/Studio laisserait les données persistées mais les rendrait partiellement inaccessibles dans l’ancien produit. `FUNCTIONAL_ROLLBACK=PARTIAL`, pas ROLLBACK_READY.

Avant création de travail v4, le retour legacy dispose d’une frontière plus simple. Après création de travail v4, privilégier une réparation avant compatible ou une coexistence protégée explicitement autorisée. Ne pas laisser l’ancien runtime écrire un Project v3 parallèle comme s’il s’agissait de la continuation v4. Conserver les nouvelles tables et historiques; ne pas les supprimer pour faciliter un rollback.

Les sauvegardes, rétention/PITR et restaurations Production testées sont UNKNOWN. Leur validation doit couvrir Project, DOC, Working Revision, intents, ledger fournisseur et états financiers, ainsi que RPO/RTO et bindings d’accès. Une sauvegarde DB ne conserve pas la conversation/proof browser-local. Une restauration antérieure peut retirer la preuve d’opérations déjà payées; bloquer les dispatchs pendant restauration et réconcilier les preuves post-checkpoint avant reprise. Aucune sauvegarde ou restauration de contenu Production n’a été réalisée ici.

## Qualification du candidat isolé

| Gate | Résultat |
| --- | --- |
| Ciblés, sélection finale de 13 fichiers | 186/186 PASS |
| Répétition PostgreSQL réelle locale | 19/19 PASS |
| Full canonical | 6118 PASS / 0 FAIL; 394 fichiers passés, 2 fichiers skipped; 0 collection errors |
| Stability | 168/168 PASS |
| Sentinels | 309/309 PASS |
| Golden two-version | PASS_OFFLINE 8/8 |
| Typecheck | PASS; build réexécute également API/app typecheck |
| Lint final | PASS, 0 errors, 7 warnings préexistants |
| Build final | PASS, warning préexistant de gros chunks |
| Diff-check | PASS |

Les 13 skips et 1 todo préexistants restent inchangés; aucun délai/exclusion n’a été changé. Le premier full run avait quatre échecs sur la forme de retour de découverte v4. L’owner a été corrigé pour conserver l’API v4 et rendre l’extension legacy opt-in; le full a ensuite passé. Ces échecs restent dans les logs, sans réécriture de l’historique de qualification.

Les 42 sorties générées et 12 journaux ont été conservés après vérification SHA-256 dans `/private/tmp/noxia-production-release-preparation.BacUB7`, avec `manifest.json`. Les seuls fichiers générés par cette qualification ont quitté le checkout après copie vérifiée. La copie temporaire est récupérable tant que ce dossier est conservé; elle n’est pas une sauvegarde Production. Les dépendances PostgreSQL de test restent dans `/private/tmp/noxia-release-postgres.r9xwBz`, pas dans package.json/lockfile.

## Décisions et prochaine action

1. Approuver les dispositions des huit commits main : confirmations/adoption naturelle exactes, provenance sans fallback faible, dimensionnement résiduel du composer, retrait des seuls indicateurs Review/WD supersédés.
2. Choisir le modèle Production et autoriser ensuite sa qualification réelle distincte. Définir coût/admission/soft-stop, capacité WD 64k et couverture transcription, sans confondre plafond session et enveloppe globale.
3. Choisir A qualification scientifique réelle ou B release explicitement limitée; conserver les gates d’adoption existants dans les deux cas.
4. Valider le plan migration, droits/verrous DDL lazy, backup/restore et stratégie fonctionnelle v4 après rollback.

La prochaine action sûre est la revue du candidat isolé et de ces alternatives, puis une intégration bornée après décisions. Il n’existe pas encore de candidat main intégralement réconcilié ni d’autorisation Production.

```text
STARTING_COMMIT = c5424158ff1d94c221505b9c52fce998146f6ad0
QUALIFIED_IMPLEMENTATION_HEAD = 582fdee5ef823dea3e900c5aa852a72133e2b60e
FINAL_ISOLATED_COMMIT = commit de clôture portant ce rapport; SHA fourni dans le compte rendu final
MAIN_ONLY_COMMITS_ENUMERATED = 8/8
MAIN_ONLY_DISPOSITIONS = 1 KEEP / 4 POTENTIALLY_SUPERSEDED / 3 HUMAN_DECISION_REQUIRED
UNRESOLVED_MAIN_CONFLICTS = écarts produit/scientifiques/coût documentés; aucun merge en cours
LEGACY_V3_RECOVERY = PASS_OFFLINE_READ_ONLY_CONVERSATION_2_0_0
V4_COMPATIBILITY = PASS_OFFLINE
USER_DATA_PRESERVED = YES — fixtures et sauvegardes non converties; aucun contenu Production consulté
SCHEMA_001_COMPATIBILITY = PASS_LOCAL_ON_RECONSTRUCTED_PREFLIGHT_SCHEMA
MIGRATIONS_002_TO_005_TESTED = PASS_LOCAL_POSTGRESQL
PRODUCTION_MIGRATIONS_EXECUTED = NO
PRODUCTION_MODEL_STRATEGY = opt-in Azure 6.1 préparé; choix et activation humaine requis
PROVIDER_READY = UNKNOWN
FINANCIAL_GUARD_SCOPE = Responses via guard durable; par session; transcription exclue
UNRESOLVED_COST_DECISIONS = limites/defaults, capacité WD, transcription, enveloppe globale
SCIENTIFIC_RELEASE_SCOPE = A qualification réelle ou B périmètre limité — décision non prise
SCIENTIFIC_QUALIFICATION_GAPS = finalisation Studio scientifique complète sur candidat exact
TRAFFIC_ROLLBACK = déploiement d4156da conservé READY; rollback non exécuté
FUNCTIONAL_ROLLBACK = PARTIAL — v4/Studio non accessibles par ancien runtime
TARGETED_TESTS = 186/186 PASS + POSTGRESQL 19/19 PASS
FULL_TESTS = 6118 PASS / 0 FAIL
STABILITY = 168/168 PASS
SENTINELS = 309/309 PASS
GOLDEN_CORRIDOR = PASS_OFFLINE 8/8
TYPECHECK = PASS
LINT = PASS
BUILD = PASS
DIFF_CHECK = PASS
READY_FOR_MAIN_INTEGRATION_REVIEW = YES — revue uniquement, pas autorisation de merge
READY_FOR_PRODUCTION_AUTHORIZATION = NO
HUMAN_DECISIONS_REQUIRED = dispositions main; modèle/coût/transcription; portée scientifique; migration/rollback
REMAINING_BLOCKERS = décisions ci-dessus; provider réel; DDL/runtime; backup/restore et continuité fonctionnelle v4
NEXT_SAFE_ACTION = revue humaine du candidat isolé avant intégration et toute action Production
MAIN_CHANGED = NO
PRODUCTION_CHANGED = NO
STABLE_PREVIEW_CHANGED = NO
PROVIDER_CALLS = 0
```
