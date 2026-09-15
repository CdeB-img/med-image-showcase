**PROTOCOL_DESIGNER_V1_FUNCTIONAL_CONVERGENCE_01 — qualification fonctionnelle hors ligne**

`MISSION_STATUS = V1_FUNCTIONAL_CONVERGENCE_QUALIFIED` sur le corpus figé et le périmètre V1 défini par cette mission. La qualification ne vaut ni clôture P1, ni validation scientifique humaine, ni démonstration avec des providers réels.

| État de référence | Valeur |
|---|---|
| Repository | `/Users/charles/Documents/Projets/NOXIA/noxia-dev` |
| Branche | `protocol-designer-canonical-ingestion` |
| Remote vérifié, non sollicité | `https://github.com/CdeB-img/med-image-showcase.git` |
| `BASELINE_HEAD` | `567ee0ae1823de1d58380596af0e7fd98c86d795` |
| `FINAL_HEAD` | SHA exact dans le reçu local `final-state.json`, écrit après le commit pour éviter une référence circulaire dans le commit lui-même |
| Source qualifiée | `final-browser-source-freeze.json`, identique pendant la qualification finale et les cinq parcours |
| Autorité | Autorités routées consignées dans `routed-authority-excerpts.json`; aucune modification normative |
| Exécution | Uniquement hors ligne; aucun canary, reroll, appel OpenAI/Gemini, push ou déploiement |

**C02 — actes humains et références.** La reconnaissance d’un verbe ne suffit plus à appliquer une décision. Le contexte fournit l’identité de la revue effectivement présentée, sa candidate, sa source et la version du Project concernée. La portée de l’acte est vérifiée contre les modifications de cette candidate; les références non résolues, partielles ou conditionnelles ne deviennent pas une confirmation globale.

| Cause | Propriétaire et première frontière | Correction / limite |
|---|---|---|
| Grammaire trop fermée des confirmations et refus | `query-navigation/current-navigation-evidence.ts`: reconnaissance de l’acte → portée | Compléments descriptifs et quantités liés au contenu natif de la candidate; la présence de « confirme » seule n’autorise aucune écriture |
| Confusion entre candidate récente et candidate désignée | `buildBoundedConversationReferentContext` et lifecycle existant: référent → candidate présentée | Liaison explicite à la revue, à la provenance et au Project courant; ambiguïté conservée |
| Référence à une ancienne liste non résolue | Résolution conversationnelle des owners existants: référence → sélection → applicabilité | Identités et ordre des options présentées conservés; clarification si la cible manque ou n’est plus applicable |
| Décision appliquée à une identité implicite | `ProtocolDesignerWorkspace`: candidate liée → décision humaine → Project | Même identité entre revue et application; provenance du véritable message humain; guards de disponibilité, busy et version conservés |

| `C02_CASES` | Avant | Après |
|---|---|---|
| Confirmations naturelles | 2/16 correctes; 14/16 en échec | **16/16 décisions correctement enregistrées** |
| Refus historiques | 23 contrôles techniques; cascades fonctionnelles non résolues | **15 refus liés à leur candidate + 8 clarifications justifiées** |
| Sélections anciennes du corpus | Références non résolues, avec cascades | **8 clarifications, 0 mauvaise adoption**; sélection réussie non démontrée sur ces huit trajectoires |
| Corrections partielles / conditions / ambiguïtés / busy | À requalifier | Tests ciblés et propriétés de non-écriture, préservation des autres propriétés, provenance et sérialisation réussis |

La clarification de B02-T07 avait été acceptée à tort dans le premier reçu C02. La requalification finale lie correctement l’effectif de personnes à la référence humaine en participants, avec quantité exacte. Le reçu initial reste historique. Le contrôle final est `c02-closure-requalification.json`.

**C04 — nature du service demandé.** La matrice des 83 demandes a été construite avant les modifications C04, avec propriétaires existants, contexte, classe attendue et première frontière fautive (`service-scope-matrix.json`). QRY transporte désormais la demande et son tour source vers le bon service, lié au Project courant.

| Cause | Responsabilité corrigée |
|---|---|
| Toute demande de proposition rabattue sur une hypothèse ST | QRY sélectionne le service existant: Study Design pour recrutement/plan, Imaging pour acquisitions, Biostatistics pour analyse/accord, OBS/Knowledge pour mesure et instrumentation |
| But d’exécution générique malgré un bon owner | But, focus et contexte courant transmis au runtime natif; aucune alternative non défendable fabriquée pour remplir une liste |
| EXPLAIN sans référent ou justification disponibles | Explication depuis la proposition et son résultat réellement présentés, ou clarification explicite; relecture du Project et de l’historique quand ils répondent à la demande |
| DISCUSS confondu avec correction, adoption ou demande de connaissance | Discussion bornée sans écriture; exemples et intuitions préservés. Une référence à ce qui a été « discuté » ne déclenche plus automatiquement une nouvelle demande Knowledge |
| Réponse textuelle correcte mais carte Standard générique | Le contrat de présentation Knowledge, Imaging et Biostatistics porte la même limitation ciblée que le résultat; aucun correctif de renderer pour masquer une erreur amont |
| Contexte adopté absent du document courant | Le contrat DOC compose littéralement les objets `PROJECT_INFORMATION` courants, avec provenance et statut. Aucune reclassification scientifique ni valeur numérique déduite |

Les contre-exemples navigateur ont été conservés séparément: `browser-first-pass-evidence`, `browser-second-pass-evidence`, `browser-pre-document-repair-evidence`, `browser-pre-act-scope-repair-evidence`. Ils ne sont pas comptés parmi les cinq parcours finaux. Les omissions des exclusions A02 et des centres B01 ont été constatées alors que la version source était correcte: un lien de version ne suffisait donc pas à prouver la fidélité du contenu.

**Résultats des 83 demandes.** Les jugements sont liés aux réponses et aux identités du replay `FINAL_CLOSURE` dans `scientific-request-review-closure.json`. Les 83 réponses sont exactement identiques aux réponses déjà examinées individuellement; leur présentation finale et les documents ont été contrôlés séparément. Trois tours de conservation hors de ces 83 demandes ont changé: A03-T15, C03-T15 et F01-T14, sans écriture Project.

| Oracle | Avant | Après |
|---|---:|---:|
| `SCIENTIFIC_REQUESTS_TOTAL` | 83 | 83 |
| PASS, total | 6 | 81 |
| `PASS_USEFUL_CONTRIBUTION` | Non ventilé | **37** |
| `PASS_BOUNDED_ABSTENTION` | Non ventilé | **36** |
| `PASS_CLARIFICATION_REQUIRED` | Non ventilé | **8** |
| `PARTIAL` | 2 | **2** |
| FAIL, total | 70 | **0** |
| `FAIL_WRONG_SCOPE` | Non ventilé | 0 |
| `FAIL_EMPTY` | Non ventilé | 0 |
| `FAIL_STALE_PROJECT` | Non ventilé | 0 |
| `FAIL_WRONG_OWNER` | Non ventilé | 0 |
| `FAIL_OTHER` | Non ventilé | 0 |
| `NOT_EVALUABLE` | 5 | 0 |

| Demande initiale | N | Contribution utile | Abstention bornée | Clarification | Partiel |
|---|---:|---:|---:|---:|---:|
| PROPOSAL | 32 | 10 | 21 | 1 | 0 |
| EXPLAIN | 25 | 7 | 12 | 5 | 1 |
| DISCUSS, comprenant les demandes documentaires classées ainsi dans le corpus | 26 | 20 | 3 | 2 | 1 |

| Périmètre | Demandes | PASS | FAIL | Ventilation |
|---|---:|---:|---:|---|
| `V1_PRODUCT_GATE`: A01–A04, B01–B04, F01 | **51** | **51** | **0** | 21 utiles, 26 abstentions, 4 clarifications |
| `GENERIC_ARCHITECTURE_STRESS`: C01–C03, D01, E01, F02 | **32** | **30** | **0** | 16 utiles, 10 abstentions, 4 clarifications, **2 partiels** |

Les autorités routées couvrent la clinique, l’imagerie et la méthodologie correspondante, y compris un cas clinique sans imagerie. Elles ne sont pas interprétées comme une obligation d’expertise universelle. Les invariants de Project, lifecycle, provenance et autorité restent exigés dans les domaines génériques.

Les deux partiels génériques sont conservés: C01-T06 explique la deuxième hypothèse mais ne traite pas les conséquences des lots et de l’essai destructif; C03-T10 préserve l’incertitude causale mais surinterprète encore une « hypothèse de discussion » comme une demande d’explication Knowledge.

`ADVERSARIAL_REPLAY = PARTIAL` pour l’ensemble du corpus, en raison de ces deux partiels. Les 15 conversations et 225 tours sont achevés, avec 0 fatal et `PROJECT_INTEGRITY = PASS`. Les **18 échecs bruts de l’ancien oracle restent présents**: 9 contrôles d’ancrage scientifique, 1 de statut candidat et 8 de refus imposaient une proposition ou une transition de lifecycle là où la mission autorise une abstention ou une clarification justifiée. Leur adjudication individuelle figure dans `closure-replay-adjudication.json`; ils ne sont pas supprimés ni présentés comme des passes bruts.

**Navigateur réel.** `REAL_BROWSER_GATE = 5/5 FUNCTIONAL PASS`, sur la même source finale, avec 75 tours retenus et cinq fermetures/réouvertures réelles. Chaque saisie et décision suit le scénario figé. Les revues candidates, messages, états Project et documents ont été lus dans le DOM visible; les reçus sont conservés avec empreintes dans `final-browser-review.json`.

| Parcours | Version finale | Preuve principale |
|---|---:|---|
| A01 — IDM/IRM | 5 | Deux repères temporels distincts, normalisation du principal, refus de six mois et adoption de douze mois, acquisition liée au calendrier corrigé |
| A02 — recrutement et références | 5 | 35–80 ans, premier STEMI, exclusions individuelles, explication de la deuxième hypothèse, document actualisé |
| A04 — méthode appariée | 4 | Même examen pour les deux méthodes, principal normalisé, secondaire durée, relecture quatre semaines, refus d’une semaine |
| B01 — clinique sans imagerie | 5 | Refus puis nouvelle adoption de 36 semaines, trois centres confirmés, sécurité secondaire, document courant |
| F01 — ambiguïtés et inconnues | 5 | Mineurs exclus, seize semaines, effectif seulement envisagé, instrument inconnu, conservation après discussion sans sollicitation Knowledge |

Le panneau Project complet est identique avant/après chaque réouverture. Les identités canoniques et digests sont vérifiés dans le replay runtime; les requêtes HTTP du navigateur conservent une identité Project par scénario. Il n’est pas prétendu que le DOM Standard expose lui-même tous les identifiants internes. Les cinq documents demandés dans le replay se lient au Project courant; les deux documents des parcours navigateur, A02 et B01, ont aussi été relus visuellement. Aucun audit documentaire complet ni formulaire administratif n’a été ajouté.

**Qualification technique et limites.**

| Contrôle | Résultat final |
|---|---|
| `FULL_SUITE` | **4 207 PASS / 0 FAIL / 0 UNHANDLED**, 274 fichiers; 12 tests en attente et 1 todo préexistants |
| C02/C04, QRY, lifecycle, owners, Project, record/replay, provider safety | Inclus dans la suite canonique finale |
| SOAK A/B/C | 3 trajectoires de 15 tours réussies, incluses dans la suite finale |
| Propriétés fortes de reuse/lifecycle | 10 contrôles `PROPERTY_REUSE_*` réussis, en plus des contrôles de décision ciblés |
| TypeScript | Application, API, serveur et configuration: PASS |
| Build | PASS; avertissement de taille des bundles conservé |
| Lint des fichiers concernés | **0 erreur / 0 avertissement** |
| Lint global historique | **51 erreurs / 36 avertissements**, fichiers inchangés hors réparation; aucun résultat global vert revendiqué |
| `LIVE_01R_REPLAY` | **PASS hors ligne**, cinq réponses enregistrées, cinq requêtes exactes vérifiées, trois échanges bridge; aucune requête réelle nouvelle |
| Transport des cinq parcours navigateur | 52 échanges bridge locaux, 99 réponses provider synthétiques, 0 échec de transport |
| `NEW_PROVIDER_CALLS`, `OPENAI_CALLS`, `GEMINI_CALLS` | **0 / 0 / 0** |
| Préservation | **829 fichiers non suivis initiaux et 427 fichiers de la campagne précédente inchangés**; ensembles pouvant se recouvrir |

Le champ historique `LIVE_01R_T05_OFFLINE_REPRODUCTION=FAIL_OR_REPAIRED` du reçu brut signifie que le symptôme rouge n’est plus reproduit. Le test final attend précisément sa disparition, la contribution candidate utile, la réutilisation bornée et la revue sans adoption automatique. Ce libellé brut n’est pas changé; l’adjudication du replay est distincte.

`CAPABILITY_GAP_DEMONSTRATED = NO` au sens d’une responsabilité absente nécessitant un nouvel owner et bloquant cette mission. Cela ne signifie pas que les capacités scientifiques sont complètes: les abstentions reflètent notamment l’absence de connaissances, instruments, acquisitions et méthodes d’accord suffisamment qualifiés dans ces entrées. L’efficacité clinique, la qualité scientifique générale, les providers réels et la compréhension linguistique universelle ne sont pas démontrés par ce corpus synthétique.

`KNOWN_RESIDUAL_V1_GAPS`: dépendance aux appuis scientifiques qualifiés; plusieurs demandes progressent par abstention ou clarification; les huit anciennes options indisponibles ne démontrent pas une sélection réussie; certaines relances génériques et présentations de delta restent maladroites malgré une décision correcte. Les besoins comptes, paiement, formulaires, placeholders, PACS et multi-Project sont hors mission. Aucun de ces points n’est déclaré clos implicitement.

**Clôture locale et reprise.** Le commit porte uniquement sur les fichiers énumérés dans `explicit-git-whitelist.json`. Les preuves volumineuses et les checkpoints opérationnels restent disponibles localement, avec leurs empreintes, sans nettoyage des anciens artefacts. `resume-state.json` et `checkpoint-log.md` consignent CP0 à CP7; `final-state.json` donne le SHA exact et l’état suivi après commit. Aucun push ni déploiement.

`P1_COMPLETE = NO`  
`P1_EXIT_GATE = NOT_SATISFIED`  
`WAVE_2_AUTHORIZED = NO`  
`NEXT_ACTION = RETURN_FOR_V1_PRODUCT_CLOSURE_AND_LIVE_EVIDENCE_DECISION`

Pour reprendre, contrôler d’abord HEAD, index et fichiers suivis contre `final-state.json`, puis lire `resume-state.json`. Ne pas reset, clean, stash ou rebase. Les commandes et scripts de qualification sont locaux dans ce dossier; ils utilisent `offline-guard.cjs` et refusent d’écraser les reçus existants. Une nouvelle exécution exige un nouveau nom de phase de preuve, jamais un nouveau canary implicite.
