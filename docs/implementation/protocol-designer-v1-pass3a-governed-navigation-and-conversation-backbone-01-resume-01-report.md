# Pass 3A — Backbone de navigation gouvernée : reprise et qualification locale

Mission : PROTOCOL_DESIGNER_V1_PASS3A_GOVERNED_NAVIGATION_AND_CONVERSATION_BACKBONE_01. Date : 2026-09-08.

~~~ini
MISSION_STATUS = PASS3A_GOVERNED_NAVIGATION_AND_CONVERSATION_BACKBONE_LOCALLY_QUALIFIED_READY_FOR_HUMAN_REVIEW
PRODUCT_COMMIT = ad2ee90810efc26ab0954641bff58826c0c85b29
NEXT_ACTION = USER_HUMAN_REVIEW_OF_PASS3A_CONVERSATION_PACKET
~~~

Le lifecycle autorisé est implémenté : une candidate validée survit à un échec aval, sans adoption ni disparition de son historique. QRY reçoit la candidate du tour avant le HOW et une projection bornée de résultats Study Design courants. Le contrat de réalisation est commun avant/après adoption.

La qualification est **locale et déterministe**, non une validation scientifique ou une qualification de conversation live. Aucun provider ni replay navigateur n'a été exécuté. Le packet contient les WHAT calculés et des contrôles mécaniques explicitement étiquetés, pas de nouvelles réponses Gemini ni de réponses Standard observées. La valeur scientifique par tour reste à examiner humainement.

## 1. Baseline et décision de reprise

- Repository : /Users/charles/Documents/Projets/NOXIA/noxia-dev.
- Branche vérifiée : protocol-designer-canonical-ingestion.
- HEAD avant travail et parent du commit produit : 27cea44a0b3e261b249527658b1adee28f376b3a.
- État initial suivi/staged : 0/0.
- Préflight initial : 345 fichiers non suivis, digest 6135fbfe21121752768353efdba9c1a2f24e76183fa55e6959c3c6db1f0b1d52.
- Reprise : 347 fichiers préexistants, après ajout du rapport STOP et de son manifeste. Digest de référence : 16dd11f2800f9346df7b2dfaec801cdc3ceba072aff0119d2bb6f5f27a360a1d.
- Sous-ensemble historique Pass 2 : 328 fichiers, digest 4d07a29c71453e539c1989f03f457c15b30e5cbb03b49605dc3f951325c3cf4e.

La décision humaine APPROVED_WITH_EXPLICIT_DOWNSTREAM_FAILURE_STATE lève le gate candidat, dans sa portée transactionnelle uniquement. Aucun audit A–D ou audit Pass 2 complet n'a été recommencé.

Le [rapport STOP initial](/Users/charles/Documents/Projets/NOXIA/noxia-dev/docs/implementation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01-report.md) reste inchangé, SHA256 b0615564630d78ee8c2e437970b411287617522d64e49a9f6cbaafed83d7cec5. Le présent rapport actualise le statut d'exécution ; il ne réécrit pas le constat historique.

Les 347 fichiers ont été re-hachés après commit produit : aucune différence. Le [relevé final de qualification et de préservation](/Users/charles/Documents/Projets/NOXIA/noxia-dev/validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/local-qualification-and-preservation.json) lie le candidat, les 41 fichiers commités, les résultats de tests et les preuves du packet.

## 2. Autorités, ownership et reuse-first

Routage appliqué par SOURCE-OF-TRUTH-INDEX v1.45 : PD-003 V2 pour Project/candidate et handoffs ; PD-009 pour WHAT/VOI ; PD-005 pour HOW ; PD-004 pour succès partiel, erreur et reprise ; PD-011 pour séparer qualification technique et revue humaine. Aucune autorité modifiée.

~~~ini
PASS_1_REUSED_AS_BASELINE = YES
PASS_1_CAUSAL_REDEMONSTRATION = NO
PASS_2_REUSED_AS_PLAN_SOURCE = YES
PASS_2_FULL_REAUDIT = NO
APPROVED_ARCHITECTURE_OPTION = O2_GOVERNED_STAGE_AWARE_CONNECTION
AUTHORIZED_EXECUTION_SLICE = P3_01 + P3_02_BOUNDED_SUBSET + P3_03 + P3_04 + LOCAL_QUALIFICATION
~~~

| Responsabilité | Owner et mécanisme réutilisé |
|---|---|
| État scientifique adopté | Research Project et writer existants ; décision humaine inchangée |
| Candidate non adoptée | Cycle de contribution, préparation/validation existantes, consumer de session |
| Choix de l'action et besoin | QUERY_NAVIGATION ; selectNextAction existant |
| Applicabilité des résultats | Bindings Project/résultat existants, projection de lecture bornée |
| Formulation | Adapter Gemini existant sous enveloppe gouvernée |
| Diagnostic et histoire | TRACE existante ; pas de nouvelle vérité scientifique |
| Valeur scientifique et naturel | Humain ; aucun oracle ou second LLM juge |

Le noyau de classement QRY n'a pas été remplacé : engine.ts, information-value.ts et validation.ts ne changent que leurs imports en .js pour le chargement API NodeNext. Les modifications fonctionnelles portent sur les entrées, la projection, les candidats d'action et les raccords. Il n'existe pas de second moteur QRY.

## 3. Architecture et ordre du tour

Avant : le WHAT pré-Project était construit avant de disposer de la candidate du tour ; HOW précédait l'extraction, et le devenir de la candidate après échec aval n'était pas décidé.

Après :

~~~text
éligibilité actuelle du tour
  → extraction déjà requise + validators / recovery existants
  → candidate validée NON ADOPTÉE, avec provenance
  → contexte QRY : candidate distincte du Project + résultats courants autorisés
  → sélection QRY native, alternatives et limites
  → enveloppe WHAT/HOW commune
  → un appel HOW prévu, puis parser / conformance
  → localisation existante
  → présentation effective
      succès : PRESENTED, sans décision humaine inférée
      échec : DOWNSTREAM_FAILED_NOT_PRESENTED, candidate conservée
~~~

L'extraction n'a pas changé de modèle, de prompt, de sémantique ou de recovery. Elle a été déplacée avant HOW, pas dupliquée. Une seconde extraction reste uniquement celle du recovery déterministe préexistant ; aucune extraction n'est ajoutée après HOW ni uniquement pour QRY.

Les mocks du bridge couvrent : extraction 0–2 selon la voie existante, conversation tentée 0–1, total bridge 0–3 ; absence d'extraction sur voie non éligible ; échec pré-validation ; succès partiel avec candidate ; échec HOW post-adoption sans nouvelle extraction. Ces nombres excluent les projections linguistiques externes au bridge, non modifiées. Appels réels de mission : 0.

## 4. Lifecycle de contribution et présentation

Implémentation centrale : [contribution-lifecycle.ts](/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/protocol-designer/functional-reset/contribution-lifecycle.ts:20).

Trois dimensions restent séparées :

| Dimension | États / effet |
|---|---|
| Traitement aval | PENDING_DOWNSTREAM ; DOWNSTREAM_FAILED_NOT_PRESENTED ; PRESENTED |
| Décision humaine | mécanisme ADOPTED / REJECTED / DEFERRED existant |
| Actualité | CURRENT / STALE / SUPERSEDED, indépendamment d'un échec HOW |

La rétention conserve contribution, canonicalChangeSet, digest candidate, source turn/digest, base Project exacte ou absence explicite, dépendances, validator, corrélation TRACE et historique append-only. Une candidate nouvelle ne supprime pas la précédente par simple récence. Le consumer ne modifie pas son contenu scientifique pour résoudre son propre échec.

La session réutilise son stockage actuel avec un champ optionnel retainedContributionCandidates ; les anciennes sessions sans ce champ sont chargées avec une liste vide. Aucun nouveau store, modèle Project ou moteur de mémoire.

Le statut PRESENTED est acquitté après montage effectif de la revue, pas au moment où son affichage est seulement planifié. Le wrapper de présentation protège la préparation/le rendu/le montage couverts par React : en cas d'échec, la candidate reste NOT_PRESENTED et l'échec est conservé. Cela ne certifie ni lecture humaine, ni toute erreur asynchrone possible du navigateur.

### Huit cas exigés par la décision humaine

| Cas | Résultat local |
|---|---|
| L1 validation → HOW/localisation réussis → présentation | PASS ; PRESENTED seulement après acquittement ; aucune adoption |
| L2 validation → HOW échoue | PASS ; rétention, NOT_PRESENTED, Project inchangé |
| L3 HOW réussi → localisation échoue | PASS ; même rétention et absence de mutation |
| L4 ancienne candidate + nouvelle échouée | PASS ; deux identités/historiques conservés |
| L5 reprise explicitement liée, même contexte | PASS ; réutilisable, 0 appel Terra |
| L6 base Project version/digest changé | PASS ; réutilisation bloquée |
| L7 correction utilisateur invalidant la source | PASS ; ancienne candidate non consommée silencieusement |
| L8 échec avant validation | PASS ; aucune fausse candidate validée |

Pour ces cas : aucune écriture Project avant décision humaine, aucun retry/réextraction automatique, provenance et ancien historique préservés. Suite lifecycle : 16 PASS ; UI lifecycle : 5 PASS ; présentation : 5 PASS.

evaluateContributionCandidateReuse exige source/lien explicite de reprise, base et dépendances identiques/current, validator applicable, re-préparation valide et absence d'invalidation. resumeContributionCandidateDownstreamProcessing ne déclenche aucun provider. Si une condition manque, la reprise échoue fermée ; aucune réextraction automatique.

La multisélection Standard et l'UX de récupération ne sont pas inventées. Plusieurs candidates sont conservables ; l'ancienne revue peut rester visible mais désactivée si elle n'est plus le reçu actif. Une sélection globale entre candidates concurrentes reste hors portée.

## 5. Projection de navigation courante

[buildCurrentNavigationEvidence](/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/query-navigation/current-navigation-evidence.ts:133) construit une vue de lecture, pas une seconde vérité. La candidate reste VALIDATED_NON_ADOPTED_CANDIDATE ; le Project adopté garde ses bindings propres.

Le sous-ensemble borné RDE/Study Design conserve besoins explicitement gouvernés, options, trade-offs, contraintes/raisons, limites et références. Les conditions d'admission couvrent :

- Project ID/version/digest et snapshot exact ;
- résultat ID/version/digest, owner, statut et applicabilité ;
- scope explicite, dépendances présentes/current, absence de cycle ;
- contrat natif Study Design validé, non adopté, sans droit d'écriture.

STALE, SUPERSEDED, REJECTED, DEFERRED, autre Project, autre snapshot, hors scope et non applicable sont exclus de l'entrée active avec motif diagnostic. Un résultat non sélectionné n'affecte pas le digest actif. Des contributions courantes contradictoires restent distinctes ; aucune victoire par récence.

Un changement de résultat pertinent recompute le consommateur QRY même si la version Project ne change pas. L'ajout d'une entrée non sélectionnée ne le recompute pas. Une vue partielle d'owner ne déclare pas résolus les besoins Project absents de cette vue ; seules les références de résolution explicitement fournies sont consommées.

Le caller Study Design fournit désormais le dernier USER réel au raccord courant. Les callers historiques sans cette entrée conservent leur chemin compatible. Aucun ledger entier n'est envoyé au provider HOW ; seuls le WHAT et son contenu borné le sont.

### Chaîne positive : portée exacte

Le test current-navigation-evidence.test.ts, « reuses the unchanged QRY engine for an explicit governed trade-off », démontre :

~~~text
Project adopté de fixture
→ runtime Study Design existant
→ trade-off natif avec options et refs
→ projection QRY courante
→ selectNextAction
→ COMPARE_OPTIONS, mêmes refs, projectWriteAuthorized=false
~~~

C'est une preuve structurelle positive owner → QRY ; ce n'est pas une adjudication de valeur scientifique ni une preuve de rendu Standard/HOW complet.

CASE-10 du packet démontre autre chose : résultat courant consommé et recalcul du contexte à Project constant. Ses deux étapes restent RESPOND, besoin NONE, sans contenu owner dans HOW. La seconde fixture modifie l'identité/digest et les références de handoff, **pas le contenu scientifique du résultat**. Ne pas annoncer « nouveau raisonnement owner → nouvelle action utile visible » depuis ce cas. Ce raccord visible sémantiquement modifié reste à qualifier.

## 6. Action QRY, candidate et valeur de l'information

[buildCurrentTurnNavigation](/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/query-navigation/current-turn-navigation.ts:87) ne transforme pas « assez d'information pour une candidate » en « plus aucune action utile ». Il compare une proposition réversible depuis les objets typés explicites et l'action native courante réellement admissible.

Une ASK doit avoir un besoin référencé, un impact discriminant/gain représenté et une information non déjà fournie. UNKNOWN seul ne crée pas une clarification. Un USER_TURN explicatif ne ressuscite pas automatiquement une question de POST_ADOPTION_QRY_CONTINUATION.

Les objectifs/questions et comparateurs typés permettent de cibler la proposition ; aucune règle FIC02, thrombus, cardiaque ou dictionnaire de domaine n'a été ajouté à QRY. Les ambiguïtés de la candidate ne sont pas résolues automatiquement. Une égalité non dominée reste sans arbitrage artificiel.

La garde candidate → scope réutilise les needIds/facettes et références Project du consommateur. Si une candidate KNOWN affecte précisément le scope d'une ASK précédente, cette ASK attend la revue : CURRENT_CANDIDATE_AFFECTS_SELECTED_SCOPE_REQUIRES_REVIEW. Le besoin n'est pas déclaré résolu ni adopté. Les facettes non démontrables restent UNKNOWN ; une question matériellement utile hors scope demeure possible.

Le producteur des impacts groupés remappe les candidateRef vers l'identité du groupe courant ; il ne modifie pas l'impact scientifique. Cette correction évite qu'un impact valide soit rejeté seulement parce qu'il conserve la référence d'un membre avant groupement.

Tests indépendants : 22 current-turn, 9 candidate/next-action, 5 scope issu du consommateur réel. L'ASK positive de fixture qualifie le traitement d'un impact déclaré, pas la vérité clinique de cet impact.

## 7. HOW commun et conformance

Contrat nouveau chez le consommateur QRY/HOW existant : GOVERNED_CONVERSATION_REALIZATION@1.0.0.

Il porte action/but, cible et refs, contenu utile limité à cette action, statuts, relations obligatoires, littéraux/quantités, information déjà fournie, binding Project/candidate et frontière humaine. Le même contrat est utilisé avant/après Project ; Gemini réalise, ne sélectionne pas un second WHAT.

Le parser et le validator contrôlent forme, refs, cohérence structurale, witnesses verbatim, claims d'adoption/écriture, statuts/relations et corruption quantitative. Ils ne requièrent plus la récitation littérale de toute la source/candidate.

~~~ini
MATCHER_DETERMINISTIC_SCOPE = STRUCTURE_REFS_WITNESSES_PROTECTED_INVARIANTS_ONLY
PROVIDER_COVERAGE_CLAIM = PROVIDER_CLAIM_NOT_INDEPENDENT_PROOF
STRUCTURED_REF_COVERAGE = CONTRACT_EVIDENCE_NOT_SEMANTIC_ORACLE
VISIBLE_TEXT_SEMANTIC_PROOF = NOT_CLAIMED
VISIBLE_TEXT_FIDELITY = UNKNOWN_UNLESS_DETERMINISTIC_CONFLICT_OR_HUMAN_REVIEW
~~~

Les dix paraphrases claires Pass 1 (A5/A8/B1/B2/B4/B6/C2/C3/D6/D9) ne sont plus rejetées pour simple absence de fragment littéral. A3/D5 restent nuancés ; la couverture C reste distincte de l'accomplissement de PROPOSE. 43 tests HOW passent, dont quantités, statuts, relations, adoption et sortie structurée invalide.

Fallback : uniquement une réalisation locale du **même WHAT** ou une limitation honnête. Le défaut initial et les compteurs restent observables. Le fallback ne choisit ni science ni nouvelle question.

Un raccord post-adoption a été fermé dans [resolveGovernedPostAdoptionReceipt](/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/protocol-designer/functional-reset/session.ts:102) : reçu natif lié au Project exact, accepté seulement avec conformance structurale PASS et sans échec. Sinon réalisation locale sûre du même reçu ; sans reçu sûr, ERROR honnête. L'ancien catch ne reconstruit plus la question Standard précédente et n'annonce plus artificiellement 0 appel après une tentative HOW. 7 tests reçus/TRACE post-adoption passent.

## 8. TRACE et non-mutation

Extension de l'adapter actuel uniquement : pas de second système, nouvelle taxonomie, nouvelle version de TRACE ou nouvel owner scientifique.

TRACE reflète l'ordre effectif extraction/validation → WHAT → tentative HOW → conformance → présentation ou échec/rétention. L'événement de revue humaine correspond à l'acquittement de présentation. Les informations de scope, exclusion, alternative, whySelected et impact restent consultables.

Le nombre d'appels tentés/reçus/acceptés n'est pas déduit de la réponse finalement visible. En fallback post-adoption, le reçu et l'échec originaux sont conservés ; un événement LOCAL_RUNTIME supplémentaire apparaît uniquement lorsque cette réalisation locale a été effectivement consommée.

Tests TRACE dédiés : 6 PASS ; reçus post-adoption : 7 PASS ; tests existants Inspector/vertical/TRACE on-off passent. Le scénario Inspector compte désormais 25 événements, dont l'information-need effectivement sélectionnée. Les autres assertions Project/document/artifact/stale restent actives.

TRACE ne juge pas la science, n'adopte pas et ne répare pas. Les objets de trace n'affectent pas les décisions ni l'état Project dans les scénarios testés.

## 9. Corpus et packet humain

[Packet de revue](/Users/charles/Documents/Projets/NOXIA/noxia-dev/validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/human-review-packet.md) ; [annexe structurée](/Users/charles/Documents/Projets/NOXIA/noxia-dev/validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-navigation-evidence.json).

17 scénarios, 22 étapes, trois scénarios multi-tour : thrombus, correction/refus, Project adopté/résultat owner ultérieur.

| Cas | Observation bornée |
|---|---|
| A | PROPOSE ciblé sur l'objectif explicitement représenté |
| B | PROPOSE ciblé sur les deux stratégies comparées |
| C | PROPOSE ciblé sur l'objectif de validation |
| D | PROPOSE ciblé sur les populations comparées |
| Thrombus, deux tours | première proposition référencée, puis réponse distincte au tour suivant ; pas une récitation intégrale systématique |
| ASK matériellement discriminante | sélection depuis un besoin/impact explicites de fixture |
| Proposition préférable / déjà fourni | pas d'ASK induite pour prolonger la conversation |
| Compréhension pure | RESPOND ; aucune extraction/candidate artificielle |
| Résultat owner courant nouveau | contexte et digest recalculés ; limite CASE-10 décrite au §5 |
| Stale / autre Project / non applicable | exclus ; provenance conservée |
| Contributions contradictoires | conservées sans résolution par récence |
| Correction/refus | identité et action distinctes selon le tour |
| UNKNOWN / WITHHELD | statuts distincts, sans complétion ni adoption |
| Hors imagerie | mécanique générique, aucune validation scientifique revendiquée |

A–D réutilisent les textes et contributions historiques complets ; aucune nouvelle extraction. Les setups adoptés synthétiques sont identifiés comme tels. Knowledge effectivement récupéré : NONE. Les gates humains restent tous PENDING_HUMAN_REVIEW.

Le contrôle HOW du packet est un écho mécanique du contrat, **ni un résultat Gemini, ni un fallback produit, ni une sortie visible**. Gemini = NOT_EXECUTED ; rendu = NOT_OBSERVED_NO_BROWSER_REPLAY. L'absence de FAIL structurel n'est pas un score de qualité.

Provenance : packet calculé sur HEAD parent avec diff suivi 846920ad05114d27713b0479848dabaa521ee5efc94879108bf24a032e50b528. Ce digest excluait les fichiers alors non suivis : il n'est pas présenté comme identité complète du candidat. Ses 16 hashes de fichiers runtime/fixtures, les 8 sources historiques, le runner et la garde correspondent toujours au commit produit/aux fichiers préservés. Le relevé final apporte le lien exact au SHA ad2ee908 sans réécrire le packet.

Une première préparation locale du runner a rencontré une collision d'identité liée à des timestamps d'invocation synthétiques identiques. Les timestamps ont été distingués avant la création des outputs exclusifs. Ce n'était ni un appel provider ni un reroll scientifique.

## 10. Frontière provider

~~~ini
OPENAI_CALLS = 0
LUNA_CALLS = 0
TERRA_CALLS = 0
GEMINI_CALLS = 0
GEMINI_DEV_EVALUATION = NOT_EXECUTED
GEMINI_CONFIGURATIONS = 0
GEMINI_RETRIES = 0
OPENAI_KEY_READ_OR_USED = NO
~~~

La qualification et la génération offline utilisent offline-guard.cjs : fetch/TCP/TLS et lecture de fichiers d'environnement sensibles bloqués. Les tests injectent des mocks, pas des clés. Aucun changement de modèle/effort/endpoint ni fallback provider. L'option Gemini DEV n'a pas été exécutée ; usages, response IDs, latence live et qualité naturelle sont NOT_EVALUATED.

## 11. Qualification locale finale

| Périmètre | Résultat |
|---|---|
| Ciblé final | 99 fichiers ; 1378 PASS ; 1 TODO ; 0 FAIL |
| Evidence owner courante | 21 PASS |
| HOW | 43 PASS |
| Current-turn / candidate-next-action / candidate-scope | 22 / 9 / 5 PASS |
| Bridge lifecycle | 9 PASS |
| Lifecycle / UI / présentation | 16 / 5 / 5 PASS |
| TRACE / reçu post-adoption | 6 / 7 PASS |
| TypeScript application et API NodeNext | PASS |
| Typecheck scientific interpretation / chargement handler Node ESM | PASS |
| Lint ciblé sur les 41 fichiers autorisés | PASS |
| Production build | PASS |
| Suite complète, une exécution | 253 fichiers ; 3821 PASS ; 12 SKIP ; 1 TODO ; 1 FAIL historique |
| Diff check final | PASS |
| Nouvelle régression testée | 0 |

Les tests ciblés incluent Functional Reset et QRY ainsi que les nouveaux fichiers explicitement listés. Avant staging, le mécanisme de découverte ne trouvait pas les nouveaux fichiers non suivis : ils ont été passés explicitement, sans modifier la configuration de découverte.

Les fixtures anciennes du bridge ont été adaptées au nouvel ordre extraction → HOW par dispatch d'endpoint, sans changer leurs attentes scientifiques. Les reçus mocks post-adoption proviennent désormais du WHAT natif. Les attentes remplacées (fusion implicite d'anciennes candidates, fallback legacy/0 appel) sont distinguées des invariants préservés et motivées par la décision humaine/l'exactitude du reçu. L'ASK positive est vérifiée séparément.

Commandes de qualification employées : vitest ciblé sous garde réseau avec sortie JSON ; TypeScript application/API et chargement Node via npm run build ; ESLint sur allowlist ; npm run build ; vitest complet une fois avec sortie JSON. Les rapports JSON temporaires sont référencés avec leurs SHA256 dans le relevé durable ; les comptes par fichier PASS3A et le nom exact de l'échec y sont conservés.

### Échec historique isolé

p-web-02-contract.test.tsx attend encore le heading « Protocol Designer » alors que la surface Standard affiche « Construisons votre projet scientifique ». Le même échec est documenté dans les rapports TRACE-02A (ligne 294) et TRACE-02C (ligne 373). Le titre Standard existe déjà dans le parent, et le fichier de test p-web n'est pas modifié. Aucun autre échec de suite complète.

### Limites de la qualification technique

Le build signale une base Browserslist ancienne, des annotations PURE react-helmet, un warning de CSS généré et de taille de chunks. Build réussi ; aucune réparation opportuniste ni attribution automatique de ces warnings à la mission.

Après l'unique suite complète, un espace terminal sur une ligne vide du nouveau test pass3a-contribution-lifecycle.test.ts (ligne 179) a été supprimé pour satisfaire le contrôle du diff staged. git diff --ignore-all-space --exit-code a confirmé l'absence de différence sémantique ; aucun runtime n'a changé, aucune suite complète n'a été relancée. La qualification porte sur le même état exécutable, non sur une fausse identité byte-for-byte de ce test avant normalisation.

## 12. Gates locaux

~~~ini
# P3A-01
CANDIDATE_AND_PROJECT_DISTINCT = PASS
CANDIDATE_NAVIGATION_PROVENANCE = PASS
CURRENT_OWNER_RESULT_FILTERING = PASS
STALE_OWNER_RESULT_EXCLUDED = PASS
OTHER_PROJECT_RESULT_EXCLUDED = PASS
RELEVANT_RESULT_CHANGE_RECOMPUTES_QRY = PASS
IRRELEVANT_RESULT_CHANGE_DOES_NOT_RECOMPUTE_QRY = PASS
FULL_LEDGER_TRANSMITTED_TO_QRY = NO
NEW_CONTEXT_STORE_CREATED = NO

# P3A-02
EXTRACTION_ALREADY_REQUIRED_BEFORE_REORDER = YES
EXTRA_EXTRACTION_FOR_QRY = 0
SECOND_EXTRACTION_AFTER_HOW = 0
RAW_UNVALIDATED_PROVIDER_OUTPUT_USED_BY_QRY = NO
CANDIDATE_PROMOTED = NO
PROJECT_BOUND_OWNER_CALLED_WITH_FAKE_PROJECT = NO
PURE_NONCONSTRUCTION_EXTRACTION_COUNT = 0
PROVIDER_CALL_MULTIPLICITY_INCREASE = 0

# P3A-03 — qualification bornée des contrats, non jugement scientifique
ENOUGH_FOR_CANDIDATE_SEPARATED_FROM_NO_NEXT_ACTION = PASS
QRY_ACTION_HAS_TARGET_REFS = PASS
QRY_ACTION_HAS_PURPOSE = PASS
QRY_ACTION_HAS_EVIDENCE = PASS
QRY_ACTION_HAS_IMPACT_OR_EXPLICIT_NON_IMPACT_REASON = PASS
QRY_REASKS_ALREADY_PROVIDED_INFORMATION = 0_IN_BOUNDED_TESTS
SECTION_ORDER_USED_AS_SCIENTIFIC_DEPENDENCY = NO_NEW_USE
DOMAIN_SPECIFIC_RULE_HARDCODED_IN_QRY = NO
A_TO_D_UNCONDITIONALLY_STATIC_WHAT = NO
THROMBUS_FULL_RESTATEMENT_ONLY = NO_AT_WHAT_LEVEL
QRY_AUTOMATIC_ADOPTION = NO

# P3A-04
COMMON_PRE_POST_PROJECT_HOW_ENVELOPE = PASS
FULL_SOURCE_LITERAL_COVERAGE_REQUIRED = NO
ACTION_RELEVANT_CONTENT_BOUND = PASS
AUTOMATIC_ADOPTION_CLAIMS_ACCEPTED = 0
PROTECTED_QUANTITY_OR_STATUS_CORRUPTION_ACCEPTED = 0_IN_BOUNDED_TESTS
PASS1_CLEAR_PARAPHRASE_REJECTED_FOR_LITERAL_MISMATCH = 0
DETERMINISTIC_SEMANTIC_EQUIVALENCE_CLAIM = NO
SECOND_LLM_JUDGE_ADDED = NO
FALLBACK_DEFAULT_PATH = NO
FALLBACK_CREATES_WHAT = NO
FALLBACK_CREATES_SCIENCE = NO
~~~

## 13. Remaining gaps et cutline

1. **Valeur scientifique et réponse visible non qualifiées.** Le packet permet d'examiner la sélection et les contrats, mais ne remplace pas un futur essai de réalisation autorisé. Aucun succès UX humain n'est inféré.
2. **Owner → action visible après changement sémantique : non démontré par CASE-10.** La preuve positive COMPARE_OPTIONS est distincte et bornée au raccord natif QRY.
3. **Observation de préparation hors tranche :** une fixture Project incomplète dans plusieurs sections a exposé un cycle de dominance dans le classement QRY historique (INTERVENTION, COMPARATOR, MEASUREMENTS, IMAGING parmi les besoins ; selected=null/BLOCKED). Le test de scope a ensuite été construit avec les autres sections renseignées pour isoler son invariant propre : ne pas redemander le scope explicitement fourni tout en conservant l'ASK hors scope. Le cycle n'a pas été réparé ; sa portée produit reste à analyser séparément. Ce n'est pas une nouvelle régression attribuée à Pass3A ni une preuve de bon comportement global.
4. **Scientific Thinking pré-Project :** DEFERRED_OWNER_OR_CONTRACT_GAP ; aucun faux snapshot adopté n'a été fourni à un owner Project-bound.
5. **Knowledge / autres owners :** pas d'intégration générale, corpus neuf ou assertion scientifique ; sous-ensemble positif Study Design seulement. BIOMARKER_END_TO_END_OWNER_COVERAGE = PARTIAL_NOT_RESOLVED_BY_PASS3A.
6. **Candidates concurrentes :** conservation/provenance acquises ; pas de nouvelle règle de sélection globale, de partial adoption ni de redesign Standard de récupération.
7. **Conformance :** claims et witnesses ne prouvent pas l'équivalence sémantique indépendante. Pas de oracle, critic, deuxième LLM juge.
8. **Longue étude / documents / coût live :** non qualifiés. V1_DOCUMENT_CUTLINE = UNRESOLVED_NOT_IN_SCOPE_OF_PASS3A. Pas de P3-05/06/07, contexte global, TMP/DOC ou Editorial Engine.

Ces limites ne doivent pas être supprimées du handoff ni transformées en décisions scientifiques closes.

## 14. Git et fichiers exacts

Un seul commit produit atomique a été choisi : projection, ordre du bridge, lifecycle, contrat HOW, raccord Standard/TRACE et tests sont dépendants. Les séparer artificiellement aurait créé des états intermédiaires non qualifiés. Le maximum autorisé de quatre commits n'est pas une obligation de fragmentation.

~~~ini
PRODUCT_COMMIT = ad2ee90810efc26ab0954641bff58826c0c85b29
PRODUCT_PARENT = 27cea44a0b3e261b249527658b1adee28f376b3a
PRODUCT_COMMIT_MESSAGE = fix(protocol-designer): connect governed navigation and preserve candidate lifecycle
PRODUCT_DIFFSTAT = 41 files changed, 4852 insertions(+), 250 deletions(-)
MODIFIED_FILES = 25
CREATED_FILES = 16
DELETED_FILES = 0
REPORT_COMMIT = THIS_DOCUMENT_COMMIT
~~~

Le commit documentaire séparé ne contient que le présent fichier. Son SHA est celui retourné par git log -1 --format=%H -- docs/implementation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01-resume-01-report.md ; il est également fourni dans la réponse finale. Aucun identifiant auto-référent n'est inventé dans le contenu commité.

Allowlist produit exacte (M = modifié, A = créé) :

~~~text
M api/protocol-designer-bridge-provider.ts
M api/protocol-designer-bridge.ts
M src/features/protocol-designer/functional-reset/ContributionReview.tsx
M src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx
M src/features/protocol-designer/functional-reset/__tests__/functional-reset-03b.test.tsx
M src/features/protocol-designer/functional-reset/__tests__/functional-reset-fixtures.ts
M src/features/protocol-designer/functional-reset/__tests__/minimal-product-bridge-ui.test.tsx
M src/features/protocol-designer/functional-reset/__tests__/minimal-product-bridge.test.ts
M src/features/protocol-designer/functional-reset/__tests__/p1-e2e-03-standard-projection.test.tsx
M src/features/protocol-designer/functional-reset/__tests__/p1-trace-02c-inspector-qualification.test.tsx
M src/features/protocol-designer/functional-reset/__tests__/p1-ux-restore-01lang-language-fidelity.test.ts
A src/features/protocol-designer/functional-reset/__tests__/pass3a-bridge-lifecycle.test.ts
A src/features/protocol-designer/functional-reset/__tests__/pass3a-bridge-provider-test-fixtures.ts
A src/features/protocol-designer/functional-reset/__tests__/pass3a-candidate-lifecycle-ui.test.tsx
A src/features/protocol-designer/functional-reset/__tests__/pass3a-contribution-lifecycle.test.ts
A src/features/protocol-designer/functional-reset/__tests__/pass3a-governed-conversation-trace.test.ts
A src/features/protocol-designer/functional-reset/__tests__/pass3a-post-adoption-governed-receipt.test.ts
A src/features/protocol-designer/functional-reset/__tests__/pass3a-review-presentation.test.tsx
M src/features/protocol-designer/functional-reset/__tests__/project-hands-on-03.test.ts
M src/features/protocol-designer/functional-reset/__tests__/project-persistence-oai-02.test.ts
M src/features/protocol-designer/functional-reset/__tests__/project-qry-01.test.tsx
A src/features/protocol-designer/functional-reset/contribution-lifecycle.ts
M src/features/protocol-designer/functional-reset/end-to-end-trace-adapter.ts
M src/features/protocol-designer/functional-reset/session.ts
M src/features/protocol-designer/functional-reset/study-design-standard.ts
M src/features/protocol-designer/product-bridge.ts
A src/features/query-navigation/__tests__/current-navigation-evidence.test.ts
A src/features/query-navigation/__tests__/governed-conversation-realization.test.ts
A src/features/query-navigation/__tests__/pass3a-candidate-next-action.test.ts
A src/features/query-navigation/__tests__/pass3a-current-candidate-scope.test.ts
A src/features/query-navigation/__tests__/pass3a-current-turn-navigation.test.ts
M src/features/query-navigation/adapters.ts
M src/features/query-navigation/canonical.ts
M src/features/query-navigation/contracts.ts
A src/features/query-navigation/current-navigation-evidence.ts
A src/features/query-navigation/current-turn-navigation.ts
M src/features/query-navigation/engine.ts
M src/features/query-navigation/functional-reset-progression.ts
A src/features/query-navigation/governed-conversation-realization.ts
M src/features/query-navigation/information-value.ts
M src/features/query-navigation/validation.ts
~~~

Symboles principaux : retainValidatedContributionCandidate / recordContributionDownstreamFailure / evaluateContributionCandidateReuse / resumeContributionCandidateDownstreamProcessing ; buildCurrentNavigationEvidence / currentGovernedNavigationInput ; currentCandidateSelectedScopeEvidence / buildCurrentTurnNavigation ; buildGovernedConversationEnvelope / validateGovernedConversationRealization / realizeGovernedConversation ; resolveGovernedPostAdoptionReceipt.

Les 347 non suivis préexistants restent hors commits. Cinq nouveaux artefacts de validation restent eux aussi non suivis :

~~~text
validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-guard.cjs
validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-human-review-packet.ts
validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-navigation-evidence.json
validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/human-review-packet.md
validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/local-qualification-and-preservation.json
~~~

Donc 352 fichiers non suivis après commit documentaire, dont 347 préservés. Pas de mass-add, reset, stash, clean, rebase, merge, push ou déploiement. Le contrôle des hooks n'a révélé que les samples Git ; aucun test caché de commit n'a été lancé.

## 15. Registre final

~~~ini
MISSION_STATUS = PASS3A_GOVERNED_NAVIGATION_AND_CONVERSATION_BACKBONE_LOCALLY_QUALIFIED_READY_FOR_HUMAN_REVIEW
HEAD_BEFORE = 27cea44a0b3e261b249527658b1adee28f376b3a
HEAD_AFTER_NAVIGATION_CHANGE = ad2ee90810efc26ab0954641bff58826c0c85b29
HEAD_AFTER_ORCHESTRATION_CHANGE = ad2ee90810efc26ab0954641bff58826c0c85b29
HEAD_AFTER_CONVERSATION_CHANGE = ad2ee90810efc26ab0954641bff58826c0c85b29
HEAD_FINAL = THIS_DOCUMENT_COMMIT
PRODUCT_COMMITS = ad2ee90810efc26ab0954641bff58826c0c85b29
REPORT_COMMIT = THIS_DOCUMENT_COMMIT
COMMIT_STRATEGY = ONE_ATOMIC_QUALIFIED_PRODUCT_COMMIT_PLUS_DOCUMENTARY_REPORT
APPROVED_ARCHITECTURE_OPTION = O2_GOVERNED_STAGE_AWARE_CONNECTION
AUTHORIZED_SCOPE_COMPLETED = YES_LOCAL_CONTRACT_SCOPE_WITH_REMAINING_GAPS_EXPLICIT

CANDIDATE_MAY_INFORM_QRY = YES_AUTHORIZED
CANDIDATE_REMAINS_NON_ADOPTED = YES
PROJECT_BOUND_OWNER_RECEIVED_FAKE_PROJECT = NO
QRY_CURRENT_TURN_CONTEXT_STATUS = PASS
QRY_CURRENT_OWNER_RESULT_STATUS = PASS_BOUNDED_STUDY_DESIGN
QRY_STALE_RESULT_FILTER_STATUS = PASS
QRY_RECOMPUTE_ON_OWNER_RESULT_CHANGE = PASS
QRY_CORE_CHANGED = NO_ALGORITHM_CHANGE_IMPORTS_ONLY
QRY_CORE_CHANGE_CAUSAL_EVIDENCE = NOT_APPLICABLE
ENOUGH_FOR_CANDIDATE_VS_HIGH_VALUE_ACTION = PASS
A_TO_D_CONTEXTUAL_WHAT_STATUS = PASS_OFFLINE_TYPED_TARGETS
THROMBUS_WHAT_STATUS = PASS_OFFLINE_MULTI_TURN
POST_ADOPTION_QRY_STATUS = PASS_LOCAL_RECEIPT_BINDING_AND_SAFE_SAME_WHAT_REALIZATION
PREPROJECT_SCIENTIFIC_THINKING_STATUS = DEFERRED_OWNER_OR_CONTRACT_GAP

EXTRACTION_PROVIDER_CALLS_ADDED = 0
OPENAI_CALLS = 0
LUNA_CALLS = 0
TERRA_CALLS = 0
GEMINI_CALLS = 0
GEMINI_CONFIGURATIONS = 0
GEMINI_RETRIES = 0
OPENAI_KEY_READ_OR_USED = NO
MISSION_NETWORK_GUARD = OFFLINE_GUARD_LOADED_FOR_QUALIFICATION_AND_PACKET

COMMON_PRE_POST_PROJECT_HOW_CONTRACT = GOVERNED_CONVERSATION_REALIZATION@1.0.0
PASS1_PARAPHRASE_FALSE_NEGATIVE_STATUS = PASS_10_CLEAR_PARAPHRASES_NOT_REJECTED_FOR_LITERAL_MISMATCH
MATCHER_DETERMINISTIC_SCOPE = STRUCTURE_REFS_WITNESSES_PROTECTED_INVARIANTS_ONLY
VISIBLE_TEXT_SEMANTIC_PROOF = NOT_CLAIMED
FALLBACK_STATUS = SAME_GOVERNED_WHAT_OR_HONEST_LIMITATION
FALLBACK_NOMINAL_USE_COUNT = NOT_EVALUATED_NO_PROVIDER_RUN
FALLBACK_CREATES_SCIENCE = NO
PROJECT_WRITES_BEFORE_HUMAN = 0

HUMAN_CANDIDATE_LIFECYCLE_DECISION = APPROVED_WITH_EXPLICIT_DOWNSTREAM_FAILURE_STATE
CANDIDATE_LIFECYCLE_POLICY = VALIDATED_CANDIDATE_RETAINED_ON_DOWNSTREAM_FAILURE
CANDIDATE_LIFECYCLE_GAP = RESOLVED_FOR_PASS3A
DOWNSTREAM_FAILURE_STATE_SUPPORTED = YES
NOT_PRESENTED_DISTINCT_FROM_PENDING_HUMAN_DECISION = YES
PREVIOUS_CANDIDATE_HISTORY_PRESERVED = YES
PROJECT_MUTATION_ON_DOWNSTREAM_FAILURE = 0
AUTO_RETRY_ON_DOWNSTREAM_FAILURE = 0
AUTO_REEXTRACTION_ON_DOWNSTREAM_FAILURE = 0
REUSE_WITH_SAME_CONTEXT_STATUS = PASS_EXPLICITLY_BOUND_AND_REVALIDATED
STALE_CONTEXT_REUSE_BLOCKED = YES
CANDIDATE_LIFECYCLE_TESTS = PASS_8_REQUIRED_CASES_16_LIFECYCLE_TESTS_PLUS_UI_AND_PRESENTATION

TARGETED_TESTS = 1378_PASS_1_TODO_0_FAIL_99_FILES
TYPESCRIPT = PASS
TYPESCRIPT_APPLICATION = PASS
TYPESCRIPT_API = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS
FULL_SUITE_EXECUTION_COUNT = 1
FULL_SUITE_PASS = 3821
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL = 1
HISTORICAL_FAILURES = p-web-02-contract.test.tsx_UNCHANGED_HEADING_EXPECTATION
NEW_REGRESSIONS = 0
GIT_DIFF_CHECK = PASS

PRODUCT_FILES_CHANGED = 41_INCLUDING_TESTS
NORMATIVE_FILES_CHANGED = 0
MEMORY_FILES_CHANGED = 0
HISTORICAL_FIC_FILES_CHANGED = 0
LANGUAGE_GATEWAY_FILES_CHANGED = 0
PROJECT_WRITER_FILES_CHANGED = 0
PRESERVED_PREEXISTING_UNTRACKED_FILES = 347
PREEXISTING_UNTRACKED_CONTENT_CHANGED = 0
NEW_VALIDATION_ARTIFACTS = 5_UNTRACKED
TRACKED_WORKTREE_CHANGES = 0
STAGED_FILES = 0
COMMIT = YES_LOCAL_PRODUCT_AND_REPORT
PUSH = NO
DEPLOYMENT = NO

HUMAN_REVIEW_PACKET = AVAILABLE_OFFLINE_VISIBLE_RESPONSE_NOT_OBSERVED
SCIENTIFIC_VALUE_PER_TURN = PENDING_HUMAN_REVIEW
NEW_OWNER_REQUIRED_FOR_PASS3A = NO
GLOBAL_NEW_OWNER_REQUIREMENT = UNKNOWN
NEW_ENGINE_REQUIRED_FOR_PASS3A = NO
GLOBAL_NEW_ENGINE_REQUIREMENT = NOT_REASSESSED_BY_THIS_MISSION
V1_DOCUMENT_CUTLINE = UNRESOLVED_NOT_IN_SCOPE_OF_PASS3A
BIOMARKER_END_TO_END_OWNER_COVERAGE = PARTIAL_NOT_RESOLVED_BY_PASS3A
P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO

NEXT_ACTION = USER_HUMAN_REVIEW_OF_PASS3A_CONVERSATION_PACKET
NEXT_ACTION_AFTER_HUMAN_APPROVAL = DEFINE_AND_AUTHORIZE_NEXT_BOUNDED_PASS3_SLICE
~~~

Les trois HEAD_AFTER_* identiques désignent le candidat atomique réellement qualifié, pas trois commits ou états intermédiaires reconstruits. Le registre d'état suivi/staged doit être confirmé après le commit documentaire ; la réponse finale fournit ce contrôle.

## 16. Arrêt

La mission s'arrête après le commit documentaire et les contrôles d'intégrité. Aucun Gemini DEV, OpenAI, nouveau freeze, replay, développement, push, déploiement ou unité Pass 3 suivante. Le prochain gate appartient à l'humain.
