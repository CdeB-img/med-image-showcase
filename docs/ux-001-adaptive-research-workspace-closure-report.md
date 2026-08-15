# UX-001 — Adaptive Research Workspace — Closure Report

## 1. Décision

`UX001_ADAPTIVE_RESEARCH_WORKSPACE_CLOSED_WITH_LIMITATIONS_READY_FOR_V1_INTEGRATION_FREEZE`

UX-001 est fermé comme implémentation produit de niveau 3 subordonnée aux autorités existantes. Les 60 gates obligatoires sont PASS. Les limitations restantes appartiennent à QRY, VAL, aux validateurs documentaires historiques ou à la propreté du checkout externe ; elles ne bloquent pas les parcours UX V1 essentiels.

Ce rapport est une `LEVEL_3_PRODUCT_UX_ACCEPTANCE_EVIDENCE`. Il ne constitue ni une norme, ni une qualification scientifique, ni un `PD011_PASS`.

## 2. Périmètre

La mission a transformé l’expérience Protocol Designer en espace de travail centré sur le Research Project : synthèse projet, prochaine action QRY, attention, domaines, documents et détails spécialisés. Elle a ajouté les interactions contextuelles, la présentation Standard/Expert, les gardes stale et la fermeture responsive/accessibilité.

Elle n’a créé aucune règle scientifique, aucun nouvel owner, aucune persistance métier, aucun provider UX, aucun paywall et aucun document normatif.

## 3. Autorités

- `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` a servi au routage et n’a pas été modifié.
- La Charte fondatrice, le Scientific Product Manifesto V2 et l’Architecture Manifesto de l’Editorial Engine ont fixé les frontières.
- PD-003 conserve le modèle du Research Project et ses ownerships.
- PD-004 demeure l’autorité UX.
- PD-009 demeure l’autorité exclusive de la prochaine action.
- PD-005 demeure propriétaire du choix et de l’exécution des capabilities.
- QRY-001, VAL-001 et DAI-001 sont consommés selon leurs clôtures existantes.
- TMP/DOC demeure propriétaire de la générabilité et des projections documentaires.

## 4. Baseline et décisions séquentielles

| Partie | Décision | Commit |
| --- | --- | --- |
| 1 | `UX001_PART1_BASELINE_READY_WAITING_FOR_PART2` | lecture seule, baseline `3a7877c9` |
| 2 | `UX001_PART2_WORKSPACE_FOUNDATION_READY_WAITING_FOR_PART3` | `efa9fdd7` |
| 3 | `UX001_PART3_ADAPTIVE_INTERACTIONS_READY_WAITING_FOR_PART4` | `1a6bff59` |
| 4, correction d’acceptation | gaps UX bornés fermés | `5a79de1c` |

Les clôtures QRY-001, VAL-001 et DAI-001 n’ont pas été modifiées. Aucun développement des Parties 2–4 n’a été exécuté en parallèle.

## 5. Architecture Workspace

`AdaptiveResearchWorkspaceProjection` est une projection Level 3, reconstruite depuis le Research Project, la projection produit QRY, l’état produit VAL, la vue DAI et les états documentaires. Elle porte les références, versions et digests nécessaires sans dupliquer le Research Project.

Les bornes sont explicites : `projectionOnly = true`, `sourceOfTruth = false`, écritures Project/VAL/QRY/DOC interdites, `providerCalls = 0`, aucun score global.

## 6. Centralité du Research Project

Une fois le Research Project disponible, la surface principale montre d’abord :

1. la question et l’état du projet ;
2. la prochaine action utile ;
3. les éléments qui demandent attention ;
4. les domaines ;
5. les documents ;
6. les détails et traces en mode Expert.

La conversation n’est pas un panneau permanent du Workspace : elle est utilisée comme interaction contextuelle lorsque QRY demande une clarification. L’état initial du démonstrateur conserve l’entrée conversationnelle, mais le panneau Project vide n’occupe plus la moitié de l’écran large.

## 7. Navigation et Project Map

La carte secondaire ouvre des vues spécialisées sans imposer un ordre scientifique. L’utilisateur peut explorer Question, Design, Imaging, Data & Analysis, Validation ou Documents sans modifier la sélection QRY. Le wording public « Sept étapes » a été remplacé par une carte de territoires adaptée à l’état du projet.

Routes conservées :

| Route | État courant | Classification | Action/test |
| --- | --- | --- | --- |
| `/protocol-designer` | fonctionnelle | entrée nominale | inspection locale 1440/1280/768/390 |
| `/protocol-designer/demo` | fonctionnelle | démonstrateur nominal et compatibilité | inspection locale et suites Protocol Designer |

Le Workspace adaptatif est intégré au parcours `/protocol-designer/demo` lorsque le Research Project existe ; aucune route concurrente n’a été créée.

## 8. Intégration QRY

La surface reçoit `QueryNavigationProductProjection` et ne recalcule ni éligibilité, ni valeur de l’information, ni dominance, ni classement. Elle montre l’action, la raison, « pourquoi maintenant », les impacts et la conséquence d’un report.

Les options non dominées restent neutres, non présélectionnées et également actionnables. Les états defer, decline, cannot-answer, stale, prerequisite technique, suffisance courante et refus restent distincts.

## 9. Modèle d’interaction

Une réponse libre produit un `QuestionResponseEnvelope` puis un handoff vers Scientific Interpretation. Le texte brut reste visible, n’est pas une vérité Project et n’est jamais promu directement.

Un defer, un decline ou un cannot-answer affecte uniquement le lifecycle QRY. Une action stale conserve la saisie locale mais bloque sa transmission. Une exploration manuelle n’altère pas la prochaine action.

## 10. Human Decision

La surface prépare uniquement une cible vers la frontière Human Decision. Aucune option n’est présélectionnée, aucune préférence de navigation ne devient une conclusion scientifique et aucune décision n’est créée automatiquement. Les décisions engageantes restent soumises à l’acteur, au mandat et au workflow owner.

`AUTO_HUMAN_DECISIONS = 0`.

## 11. VAL

Le Workspace consomme le résumé produit VAL en lecture seule. Findings, reviews et gates conservent leurs sources et owners. `NOT_EVALUABLE` est présenté comme un prérequis système/validation, jamais comme une question scientifique ni comme une réussite.

Le reviewer sémantique live demeure désactivé par défaut, non qualifié et non requis pour la V1. Aucun spinner ou appel provider fictif n’est introduit.

## 12. Data & Analysis

La vue DAI est une destination spécialisée. Les exigences Study Data, Data Management et Biostatistics restent chez leurs owners. Le Workspace ne recalcule aucune readiness ; il transporte uniquement cible, état, sources et impacts.

Un DataNeed demeure distinct d’une information nécessaire à la navigation.

## 13. Documents vivants

Chaque résumé de document conserve : owner DOC, source Project, version, générabilité, fraîcheur, éléments manquants, target et limitations. Les états `GENERATABLE`, `PARTIALLY_GENERATABLE`, `NOT_GENERATABLE`, `BLOCKED` et `NOT_APPLICABLE` sont préservés dans le contrat UX.

La disponibilité d’un document dépend de son propre état TMP/DOC. Un Protocol ou un DMP peut donc être prévisualisable alors qu’un SAP reste bloqué. Aucune complétude artificielle du Project ou de la carte n’est exigée.

## 14. Versionnement et fraîcheur documentaires

Une projection liée à la version courante est `CURRENT`. Après changement de Project :

- impact démontré : `STALE` et reconstruction requise ;
- absence d’impact démontrée : la projection peut rester courante ;
- impact non évalué : la projection n’est pas présentée silencieusement comme courante.

L’ancienne projection ne devient jamais la vérité du nouveau Project. L’interface montre systématiquement la version Project fondatrice.

## 15. Frontière d’accès documentaire

Générabilité scientifique et disponibilité d’action sont deux contrats distincts. La V1 conserve les accès gratuits actuels, sans prix, abonnement, crédit, checkout ou bouton Premium. L’architecture ne pose pas `GENERATABLE → PERMANENT_FREE_DIRECT_DOWNLOAD` comme invariant universel et ne crée aucun moteur commercial.

## 16. Scientific Interpretation

Scientific Interpretation demeure propriétaire de la structuration du texte libre. L’UX crée le handoff, conserve le brut et montre l’état « contribution candidate » ; elle ne réalise aucune interprétation locale et n’appelle aucun provider.

## 17. États sémantiques

Les présentations distinguent textuellement et structurellement : unknown/error, ambiguous/rejected, candidate/adopted, deferred/rejected, warning/blocking, not-applicable/missing, not-evaluable/valid, not-generatable/system-failure, realized-time deferred/current blocker et stale/current.

La couleur n’est jamais l’unique signal : chaque état possède un libellé, un indicateur et une explication accessible.

## 18. Standard et Expert

Standard suffit pour comprendre l’action, répondre, différer, décider, ouvrir un domaine et comprendre un document bloqué. Expert révèle owners, versions, sources, digests, traces QRY/VAL et limitations. Le mode Expert est inspection-only.

Le libellé historique « Audit / mode expert » a été remplacé par « Inspecter la trace » : aucun simple niveau de détail n’est présenté comme audit.

## 19. Guided Intake et legacy

Guided Intake reste une entrée, un renderer ou une compatibilité locale. Il n’est pas l’arbitre transverse. Le stepper historique est une carte secondaire et ne sélectionne jamais la prochaine action scientifique. Aucun ancien score de complétion ou routeur lexical ne participe au classement QRY.

## 20. Responsive et contrôle visuel

Le build local a été inspecté sur `/protocol-designer` et `/protocol-designer/demo` à 1440, 1280, 768 et 390 px. Aucun overflow horizontal global n’a été mesuré. Les contrôles essentiels utilisent des cibles tactiles, des grilles adaptatives et des groupes flexibles.

| Surface | Desktop | Laptop | Tablet | Mobile | Standard | Expert |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | PASS | PASS | PASS | PASS | PASS | N/A |
| Workspace | PASS | PASS | PASS | PASS | PASS | PASS |
| Clarification | PASS | PASS | PASS | PASS | PASS | PASS |
| Options | PASS | PASS | PASS | PASS | PASS | PASS |
| Human Decision | PASS | PASS | PASS | PASS | PASS | PASS |
| Data/Analysis | PASS | PASS | PASS | PASS | PASS | PASS |
| Validation | PASS | PASS | PASS | PASS | PASS | PASS |
| Documents | PASS | PASS | PASS | PASS | PASS | PASS |

Les routes complètes ont été inspectées dans le navigateur local ; les états Workspace propriétaires ont été vérifiés par composants et parcours synthétiques sans provider.

## 21. Accessibilité

Landmarks, hiérarchie de titres, labels, fieldsets, radios, `aria-pressed`, alerts et statuses sont couverts. Les parcours utilisent des contrôles HTML natifs accessibles au clavier. Les dialogs propriétaires conservent leurs contrats de focus et de confirmation.

La matrice détaillée se trouve dans `validation/ux-001-closure/accessibility-matrix.json`.

## 22. Parcours de fermeture

La campagne couvre les 26 familles UX-A à UX-Z : nouveau projet vague, projet précis, reprise, action unique, options non dominées, décision humaine, defer, cannot-answer, decline, stale, VAL, DAI, documents, suffisance, refus, exploration, reload, erreur technique, mobile, clavier et absence de writes cachés.

Trois traces structurantes sont démontrées :

1. Project → QRY → réponse brute → Scientific Interpretation → contribution candidate → décision owner → nouvelle version → VAL → QRY → document réévalué ;
2. Existing Project → DAI blocker → target spécialisé → décision humaine → nouvelle version → SAP réévalué → nouvelle action QRY ;
3. demande de projection → refus PD-009 → explication → aucune projection → remédiation ou arrêt honnête.

## 23. Campagne et gates

Campagne : `validation/ux-001-closure/`, classification `VISIBLE_SYNTHETIC_PRODUCT_FIXTURES`, `NOT_PD011_QUALIFICATION`, aucune donnée patient et aucun Blind.

| Famille | PASS | FAIL | Total |
| --- | ---: | ---: | ---: |
| UX-CLOSE-C01..C50 | 50 | 0 | 50 |
| UX-DOC-LIVE-C01..C10 | 10 | 0 | 10 |
| Total | 60 | 0 | 60 |

## 24. Tests et validations techniques

| Validation | PASS | FAIL | SKIP | TOTAL |
| --- | ---: | ---: | ---: | ---: |
| Gates Partie 4 | 60 | 0 | 0 | 60 |
| Corridor transverse ciblé | 1 544 | 0 | 0 | 1 544 |
| Suite globale | 2 490 | 3 | 0 | 2 493 |

Typecheck, build, lint des fichiers modifiés et `git diff --check` : PASS.

Les trois échecs globaux sont exactement les gardes historiques de propreté du checkout externe `editorial-engine`. Classification : `PRE_EXISTING_EXTERNAL_CLEANLINESS_FAILURE`. Aucun échec global n’est attribuable à UX-001 et ce checkout n’a pas été modifié par la mission.

## 25. Comptabilité des frontières

| Compteur | Valeur |
| --- | ---: |
| `PROJECT_WRITES_BY_UX` | 0 |
| `VAL_WRITES_BY_UX` | 0 |
| `QRY_RANKING_RECALCULATIONS_BY_UX` | 0 |
| `AUTO_HUMAN_DECISIONS` | 0 |
| `DIRECT_RESPONSE_TO_PROJECT_PROMOTIONS` | 0 |
| `DOCUMENT_WRITES_BY_WORKSPACE` | 0 |
| `PROVIDER_CALLS_BY_UX` | 0 |
| `GLOBAL_PROGRESS_SCORES` | 0 |
| `PAYMENT_FUNCTIONALITY` | 0 |
| `NORMATIVE_DOCUMENTS_MODIFIED` | 0 |
| `SOURCE_OF_TRUTH_INDEX_MODIFIED` | 0 |

## 26. Contrats préservés

| Contrat | Préservé ? | Preuve |
| --- | --- | --- |
| Project ownership | Oui | UX-CLOSE-C03, C10, C11 |
| QRY ownership | Oui | UX-CLOSE-C05, C14, C39 |
| VAL ownership | Oui | UX-CLOSE-C06, C12, C33 |
| Human Decision ownership | Oui | UX-CLOSE-C07, C13, C25 |
| Scientific Interpretation ownership | Oui | UX-CLOSE-C29 |
| DAI ownership | Oui | UX-CLOSE-C35 |
| Documents projection-only | Oui | UX-CLOSE-C08, C38 |
| Unknown preservation | Oui | UX-CLOSE-C27 |
| Candidate/adopted separation | Oui | UX-CLOSE-C30, C41 |
| No hidden writes | Oui | boundary accounting |
| No provider | Oui | UX-CLOSE-C09, C34 |
| No PD-011 claim | Oui | classification de campagne |

## 27. Limitations connues

- `NAVIGATION_MEMORY_SESSION_SCOPED_PROJECT_STATE_RECONSTRUCTIBLE` : la science Project persiste chez son owner et la prochaine action se reconstruit, mais la mémoire QRY n’est pas multi-device.
- La démonstration ne possède pas d’historique transverse persisté de ValidationRuns.
- Le semantic reviewer VAL live reste disabled-by-default et non qualifié.
- Les validateurs DM/BIO historiques restent documentaires.
- Trois gardes de propreté du checkout externe `editorial-engine` restent rouges.
- L’acceptation UX n’est pas une qualification scientifique PD-011.

Ces limites sont visibles et non propriétaires UX ; elles n’empêchent ni la compréhension de l’état courant, ni l’action, ni la reprise, ni les parcours documentaires V1.

## 28. Relation au V1-INTEGRATION-FREEZE

UX-001 n’exécute pas le freeze. Elle fournit la surface produit, les contrats de projection, les interactions, les preuves responsive/accessibilité, les 60 gates et les limites nécessaires pour que la mission suivante puisse geler l’intégration V1 sans rouvrir l’architecture UX.

## 29. Décision finale

`UX001_ADAPTIVE_RESEARCH_WORKSPACE_CLOSED_WITH_LIMITATIONS_READY_FOR_V1_INTEGRATION_FREEZE`
