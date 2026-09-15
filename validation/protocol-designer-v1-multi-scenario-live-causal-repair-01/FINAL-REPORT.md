# Réparation causale des preuves live multi-scénarios

**MISSION_ID = PROTOCOL_DESIGNER_V1_MULTI_SCENARIO_LIVE_EVIDENCE_CAUSAL_REPAIR_01**

**Réparations causales qualifiées, avec contrôle scientifique S5 partiel.** Les cinq défauts live ont été reproduits sur le baseline et les quatre clusters ont été corrigés à leur frontière responsable. Le résultat qualifie ces réparations hors ligne. Il ne clôture ni la capacité scientifique générale, ni P1, ni une validation provider live.

| Indicateur demandé | Résultat |
|---|---|
| MISSION_STATUS | MULTI_SCENARIO_LIVE_EVIDENCE_CAUSAL_REPAIR_QUALIFIED — portée : cinq défauts initiaux ; réserve scientifique S5 ci-dessous |
| BASELINE_HEAD | 91f0fbc5ab32c545b16cabb866299d1cbb756299 |
| FINAL_HEAD | Consigné après commit dans final-state.json et commit-receipt.json ; le commit contenant ce rapport constitue le HEAD de code qualifié |
| Branche | protocol-designer-canonical-ingestion |
| Remote vérifié | https://github.com/CdeB-img/med-image-showcase.git |
| LIVE_FINDINGS_REPRODUCED | 5/5 ; S1_RED_REPRODUCTION à S5_RED_REPRODUCTION = PASS |
| CAUSAL_CLUSTERS / CLUSTERS_REPAIRED / CLUSTERS_UNRESOLVED | 4 / 4 / 0 parmi les cinq findings initiaux |
| S1_EXTRACTION_COMPLETENESS | PASS pour le défaut observé : omission désormais visible, candidate explicitement partielle |
| S2_ST_TYPED_SEMANTICS | PASS pour le défaut observé : deux objectifs ne deviennent plus les opérandes d'une association |
| S3_PRIVACY | PASS — texte CEC historique exact, fautes conservées, PASS_TO_SCIENTIFIC_PRODUCT |
| S4_NEGATION_FIDELITY | PASS — négations conservées jusqu'à la revue et l'adoption canonique testée |
| S5_PRIVACY | PASS — PASS_TO_SCIENTIFIC_PRODUCT |
| S5_NEGATIVE_CONTROL_OFFLINE | PARTIAL — huit tours figés, owners atteints, abstention sans protocole fabriqué ; contradiction mécanistique insuffisamment expliquée |
| LIVE_RESPONSES_USED / STRICT_REPLAY | 7/7 / 7/7 PASS |
| NEW_PROVIDER_CALLS / OPENAI_CALLS / GEMINI_CALLS | 0 / 0 / 0 |
| ADVERSARIAL_225_TURN_REPLAY | PARTIAL — 15 conversations achevées, invariants Project/autorité/provenance PASS, deux limites scientifiques génériques préexistantes |
| V1_FUNCTIONAL_CONVERGENCE | PASS dans le périmètre V1 qualifié, avec abstentions bornées ; 51/51 demandes V1 |
| REAL_BROWSER_OFFLINE | 5/5 PASS sur les défauts enregistrés ; S5 scientifique rapporté séparément |
| FULL_SUITE | 4 308 PASS / 0 FAIL / 0 UNHANDLED observé ; 276 fichiers ; 12 pending/skipped et 1 todo conservés |
| TYPESCRIPT / BUILD / LINT AFFECTÉ | PASS / PASS / PASS ; lint 7 fichiers, 0 erreur, 0 avertissement |
| TRACKED_WORKTREE | CLEAN attendu et contrôlé dans le reçu post-commit final-state.json ; preuves volumineuses et antérieures laissées locales |
| P1_COMPLETE | NO |
| P1_EXIT_GATE | NOT_SATISFIED |
| WAVE_2_AUTHORIZED | NO |
| NEXT_ACTION | RETURN_FOR_FINAL_LIVE_VALIDATION_OR_V1_PRODUCT_CLOSURE_DECISION |

## Causalité et changements

**C1 — complétude.** La réponse Terra enregistrée omet des précisions explicites de population ; sa provenance valide ne prouve pas sa complétude. Le passage du delta validé à la contribution ne signalait pas cette omission et la revue pouvait sembler complète. product-bridge.ts réutilise les dimensions explicites déjà présentes et clarificationNeeds. Un passage non entièrement représenté dans le contenu extrait reste visible avec UNKNOWN, UNREPRESENTED_SOURCE_SPAN et NOT_ADOPTABLE. ContributionReview affiche une compréhension partielle ; seuls les objets affichés sont soumis à confirmation. Aucun second appel ni fait adopté par inférence. La couverture est conservative et textuelle, pas un nouveau système d'extraction ni une preuve d'équivalence sémantique. Portée : contributions persistantes non vides.

**C2 — types ST.** L'adaptateur Project → ScientificThinkingInput transmettait des OBJECTIVE dans scientificObjectTerms ; le moteur ajoutait aussi des phénomènes/proses comme opérandes. Les termes Project admis sont désormais les objets connus et non withheld de types CANONICAL_VARIABLE, ENDPOINT, INTERVENTION_OR_EXPOSURE et GROUP. Questions, objectifs, méthodes et population restent dans leurs champs propres. Une régression longitudinale démontrée pendant la qualification a été corrigée en conservant l'objectif entier comme question candidate. Aucune règle spécifique au thrombus.

**C3 — privacy S3/S5.** Le motif PATIENT_IDENTIFIER rendait tous les marqueurs d'identifiant optionnels et acceptait un mot ordinaire de quatre lettres après patient/dossier. Désormais il exige un marqueur explicite ou un code compact contenant un chiffre. La protection des véritables identifiants dans un cadre déclaré fictif reste active. Le contre-exemple préexistant sur la casse du titre Mme a aussi été réparé dans le même propriétaire privacy.ts.

**C4 — polarité.** La réponse Terra, le delta validé et sourcePolarity canonique étaient corrects. Le label de revue perdait la polarité. Le constructeur partagé de labels affiche maintenant « Exclusion / absence », « Incertain » ou « Sous condition » pour NEGATED, UNCERTAIN ou CONDITIONAL, y compris remplacement, retrait et liens. Une addition d'exclusion est affichée « + Exclusion / absence : AVC aigu ». Le provider et l'extraction ne sont pas modifiés.

Six fichiers produit modifiés, un fichier de 55 tests de régression autonomes ajouté. Aucun nouveau router, owner, engine, ontology, système de privacy, extraction ou Human Review. La liste exacte est dans commit-whitelist.txt ; les hashes des sept fichiers sont dans preservation-receipt.json.

## S5 : limite scientifique établie

Le navigateur réel parcourt les huit tours figés avec les prémisses synthétiques, deux confirmations humaines explicites et les owners natifs. Le Project reste en révision 2 après les six tours suivants ; aucune alternative n'est adoptée et aucun document/protocole n'est produit.

L'insistance sur un effet central direct malgré l'exposition cérébrale libre stipulée insuffisante produit une abstention bornée. Cependant, le produit n'explicite pas la contradiction entre occupation de la cible centrale requise et exposition insuffisante. Il ne distingue pas utilement effet direct et éventuel effet périphérique indirect, n'expose pas les preuves PK/PD discriminantes demandées, et termine par un rappel du Project. L'observation qualifie la prudence et l'intégrité, pas un raisonnement mécanistique complet. S5-scientific-negative-control.json contient le jugement par tour et les réponses effectivement observées. Aucune règle ad hoc NX/CNS ni connaissance inventée n'a été introduite pour transformer ce résultat en PASS.

## Qualification et provenance des preuves

- **Rouge avant modification :** red-tests-corrected-assertion.json, red/. Les cinq findings sont reproduits ; une assertion de harness S1 a été resserrée pour ne pas confondre une section PARTIAL générique avec un signalement d'omission.
- **Rejeu strict :** green/strict-transport-replay.json, seven-responses-native.json, green/recorded-gemini-native-conformance.json. Sept requêtes/réponses historiques exactes consommées hors ligne ; les deux réponses Gemini passent également par le validateur de réalisation natif. La réponse historique n° 3 est acceptée structurellement ; la n° 7 est refusée pour USER_SOURCE_ATTRIBUTION_SURFACE_MISSING. Ce refus historique est conservé, pas présenté comme une réussite de fidélité sémantique.
- **Trajectoires reconstruites :** S1/S2/S4 conservent la science enregistrée avec rebinding explicite des seules identités de session, ancrages et références Project, par correspondance exacte et unique. S3/S5 utilisent une extraction synthétique déclarée ; HOW utilise l'adaptateur synthétique existant. Ce niveau ne revendique pas l'identité des nouvelles requêtes avec les anciennes après modification du produit.
- **Tests ciblés :** targeted-post-audit.json : 70 PASS ; seven-responses-native.json : 7 PASS ; canonical-regression.json : 55 PASS, intégrés ensuite à la suite complète. Ces comptes se recouvrent et ne doivent pas être additionnés comme autant de tests indépendants.
- **Corpus final :** post_audit/ : 15 × 15 tours. 18 écarts à l'oracle historique conservés et adjudiqués dans mass-requalification.json. Aucun FATAL. Les 83 réponses scientifiques sont strictement identiques aux réponses déjà évaluées lors de la convergence fonctionnelle, avec nouvelles vérifications d'identité Project et d'absence d'écriture : 37 contributions utiles, 36 abstentions bornées, 8 clarifications, 2 PARTIAL génériques (C01-T06, C03-T10). Aucun gain scientifique ne découle de cette égalité. Voir scientific-request-review.json.
- **Actes humains C02 :** 16 confirmations enregistrées ; 15 refus enregistrés et 8 refus nécessitant clarification ; 8 sélections historiques nécessitant clarification ; 0 mauvaise adoption. B02-T07 est bien une décision résolue. Voir c02-requalification.json.
- **SOAK A/B/C :** les trois familles IDM/IRM, clinique non imagerie et expérimentale non médicale sont rejouées pendant 15 tours chacune dans la suite canonique finale. Record/replay et budget B1–B8 : 31 PASS ; sécurité multi-session : 45 PASS ; actes humains : 18 PASS ; scope scientifique : 19 PASS.
- **Navigateur réel :** browser-post-audit/browser-receipts.jsonl contient cinq reçus complets avec texte visible et état local réel ; browser-http-exchanges.jsonl capture les échanges du vrai handler. Les digests sont vérifiés par browser-qualification.json. Les captures antérieures restent locales mais ne fondent pas le verdict final. Le serveur local a été arrêté après qualification.
- **Technique finale :** qualification/full-suite-commit-candidate.json et son reçu, build-commit-candidate.log, lint-commit-candidate.json. Exit 0, source inchangée pendant la suite, aucun unhandled signalé. Build inclut les gates TypeScript application/API/serveur ; avertissements de taille de bundles et base Browserslist ancienne conservés, sans modification des dépendances.
- **Revue contradictoire :** CONTRADICTORY-REVIEW.md. Les régressions intermédiaires démontrées et les corrections de harness sont explicites ; seul l'état final requalifié fonde les résultats ci-dessus.

## Intégrité, budget et interruption

Mode OFFLINE_ONLY. Réutilisation du garde réseau offline et, pour le navigateur, du garde loopback limité au port local avec secrets désactivés. Aucun provider réel ni appel d'essai. Les sept appels payés antérieurs ne sont jamais réémis. Coût supplémentaire = 0 USD. Le coût live historique reste 0.2137379 USD mesuré, 0.2611208 USD engagé, sans réinitialisation du ledger.

verify-preservation.py vérifie les 2 225 fichiers antérieurement non suivis, les 36 preuves privées et 5 326 fichiers suivis hors six modifications autorisées ; aucune dérive attendue n'est tolérée. Hash du ledger historique : e654f9ae72608702923e1e8919599a2a58102ea4402fd54c8bb038e6c4d7cf1e. Hash du manifeste live : 28b70548578160fa37c86b0621344540b2aeec6100a834e5b81e8b4fc485751b.

evidence-manifest.json référence les preuves locales finales et intermédiaires par hash. Les grandes captures et phases de replay restent locales, non ajoutées en masse à Git. Le commit est limité à la whitelist explicite, aux corrections, tests, harnesses et reçus documentaires sélectionnés. Aucun push ni déploiement.

Pour reprendre : lire final-state.json, resume-state.json et checkpoint-log.md ; vérifier branche/HEAD/index/worktree et hashes avant toute action. Préserver les fichiers non suivis. Ne pas reset/clean/stash/rebase automatiquement. Aucune campagne live automatique autorisée par ce rapport.
