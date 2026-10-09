# Décision humaine conversationnelle — interprétation native

Date : 9 octobre 2026. Statut : implémentation qualifiée hors ligne, non déployée. Ce rapport actualise l'état technique de l'audit précédent sans modifier ses constats historiques ni une autorité normative.

## Périmètre et état protégé

- Base vérifiée : `04b6e54a174813c5cf845457fc748e7986b3445a`.
- Branche : `codex/production-release-preparation`.
- `REPORT.md` était déjà modifié : fichier de 0 octet, suppression de 233 lignes non indexée. État préservé et exclu du commit.
- Tag golden conservé : `protocol-designer-golden-post-p0-2026-10-07` → `c722279f4ed6b2fae1b5d453c02d3bf43eecbde6`.
- Aucun changement main, Production, schéma distant, configuration distante ou déploiement. Aucun appel fournisseur réel.
- Sources d'autorité routées : SOURCE-OF-TRUTH-INDEX, PD-003 V2 §3, PD-009 §0–2, PD-005 §9. L'interprétation contribue ; QRY lie la décision ; PRJ adopte. Pas de nouvelle admission normative : index inchangé selon sa règle de périmètre.

## Propriétaires et mécanisme livré

| Responsabilité | Propriétaire / module |
| --- | --- |
| Interprétation sémantique | Scientific Thinking, `conversation-human-intent.ts`, dans le même résultat TERRA que la réponse et les contributions scientifiques |
| Contexte réellement présenté | Projection QRY existante `buildBoundedConversationReferentContext`, enrichie du digest de présentation native |
| Validation de l'interprétation | QRY, `bindSemanticHumanDecision` : aucun matching linguistique, écriture ni appel fournisseur |
| Fraîcheur au moment de l'action | `validateCurrentSemanticConversationDecision`, reconstruction depuis la session courante et le préfixe exact jusqu'au USER source |
| Adoption / refus | `stageProjectConfirmation` / `stageProjectRejection` puis propriétaires PRJ et persistence existants |
| Correction non adoptante | Retained Contribution Lifecycle existant : ancien scope supersédé, remainder natif conservé ; aucun remplacement scientifique adopté |
| Préparation ultérieure | Reçu conversationnel existant avec digests d'interprétation ; Working Draft reste lazy |

Le chemin nominal vérifié dans la configuration Preview est `TERRA` / `VITE_AUTONOMOUS_PROJECT_BUILD=ON`. Il ne reconnaît plus une confirmation avant la réponse ST. La réponse native est livrée, validée, puis seulement transmise à l'adoption existante.

Le coordinateur relit aussi la session courante pour le refus, l'accusé de présentation et les commandes documentaires : une closure React antérieure à la réponse/adoption n'est plus utilisée par ces étapes.

### Contrat natif

`humanIntent`, version `1.0.0`, représente :

- actes `ACCEPT`, `REJECT`, `PARTIAL_ACCEPT`, `CORRECTION`, `ADDITIONAL_INFORMATION`, `CONTINUE_OR_EXPLAIN`, `DOCUMENT_REQUEST`, `AMBIGUOUS`, `CONDITIONAL` ; plusieurs actes peuvent coexister ;
- digest des entrées, référent exact, partitions disjointes des références acceptées/refusées/corrigées ;
- incertitude, clarification éventuelle, action documentaire Product Entry existante éventuelle.

`CONVERSATION_HUMAN_INTENT_CONTEXT_V1` lie USER et son digest, conversation, Project ID/version/digest, projection QRY, source native et digest de présentation, items effectivement présentés et groupes de dépendances. Les métadonnées natives/provenances complètes ne sont pas recopiées dans chaque item : références et texte de présentation suffisent à cette projection, le digest porte sur la présentation native complète.

Le JSON Schema producteur exige la propriété nullable `humanIntent` et interdit les propriétés inconnues. Les anciens résultats sans cette propriété restent lisibles, mais n'autorisent **aucune** décision sémantique ni fallback lexical dans le chemin TERRA. Les règles required/nullables/strict sont celles des [Structured Outputs officiels](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

### Gardes et décisions partielles

- Le digest du contexte est recalculé ; le digest retourné doit correspondre exactement.
- Présentation, USER, référent, Project et actuality sont revalidés à réception et avant le lifecycle PRJ. Un USER ultérieur ou un changement de présentation/Project/candidat bloque la décision devenue obsolète.
- Références canoniques complètes seulement ; pas de fallback suffixe. Références étrangères, doublons, partitions chevauchantes et élargissement par le consommateur sont rejetés.
- Un accord partiel ne sélectionne que les références concernées. Si elles ne sont pas séparables selon les dépendances natives, aucun complément automatique n'est autorisé.
- Refus et corrections restent distincts. Un scope corrigé seul est supersédé, avec conservation des scopes non concernés. Une acceptation ultérieure ne peut pas ressusciter l'ancien candidat.
- Plusieurs candidats simultanément recevables, un référent absent/obsolète ou une intention conditionnelle/ambiguë ne déclenchent aucune adoption.
- Un assentiment à une réponse textuelle ne vaut pas décision PRJ. Son reçu lie l'échange exact et ne déclenche aucun Working Draft. Une continuation scientifique séparable reste dans la rétention scientifique du même appel.
- L'acteur et le mandat de session restent validés. La provenance conserve la limite existante `DEMO_SESSION_NOT_AUTHENTICATED` : ce correctif n'ajoute pas une authentification ou certification d'identité humaine.
- L'infrastructure PRJ garde présentation complète, base canonique, validation native, mandat, décision humaine et persistance. Studio/QRY/Scientific Thinking ne deviennent pas propriétaires de Project truth.

### Compatibilité résiduelle explicite

Aucune expression ou regex de décision n'a été ajoutée. Les formulations des tests ne sont pas des règles runtime.

La grammaire existante du chemin configuré historique/non-TERRA et les gardes conservatrices de discussion historique restent présentes pour les régressions démontrées. Le fallback historique de sélection d'une source de préparation reste aussi lisible. Elles ne servent pas de fallback d'acceptation dans le nouveau coordinateur TERRA. Les reçus natifs sont utilisés indépendamment des mots du USER. Ce livrable ne revendique donc pas la suppression de tout code lexical du produit.

Studio human decision, Project materialization, Scientific Working Draft, finalization intents et génération/archives DOC ne sont pas redéfinis. Le test Studio retire seulement l'ancien argument lexical de `submitTerraText` ; ses assertions de liaison QRY et de non-adoption sont maintenues.

## Qualification

Tous les résultats suivants sont déterministes/simulés : ils démontrent contrats, routage, gardes et persistance, pas la compétence sémantique réelle du modèle.

| Campagne | Résultat vérifié |
| --- | --- |
| Nouveaux tests natifs, incluant coordinateur UI, persistance et reload | 52/52 PASS |
| Propriétaires ciblés ST/QRY/PRJ/DOC/Studio et régressions | 1367/1367 PASS |
| Régression des reçus et tests natifs | 72/72 PASS |
| Corridor golden two-version, inclus dans stabilité/full | 8/8 PASS_OFFLINE |
| Stabilité | 168/168 PASS |
| Full canonique | 6200 PASS, 0 FAIL, 0 erreur de collection |
| Sentinelles | 309/309 PASS |
| Typecheck | PASS |
| Lint | PASS, 0 erreur, 7 avertissements préexistants |
| Build | PASS |
| Diff-check | PASS |

13 skips et 1 todo préexistants conservés. Aucun ajout d'exclusion, augmentation de timeout ou baisse d'une assertion native. Le premier full a exposé quatre fixtures attendant le reçu lexical avant le résultat : elles retournent désormais un acte natif explicite au même seam fournisseur, en conservant toutes leurs assertions métier. Les premiers essais/logs restent conservés.

Les tests couvrent acceptation inédite, refus, négation, scope partiel, correction+accord, nouvelle information+accord, continuation/explication, demande documentaire non adoptante, condition, référent ambigu/multiple, stale Project/source/présentation, contenu malformé, panne fournisseur, autorité manquante et élargissement frauduleux du scope.

## Coût et latence

- Classifier séparé : aucun. Interprétation incluse dans l'appel conversationnel ST existant.
- Nombre d'opérations supplémentaires requis par l'interprétation : **0**. Aucune nouvelle politique de retry, modèle, plafond de tokens ou budget.
- Aucun Working Draft automatique ajouté. Les tests UI constatent zéro préparation lors d'acceptation/refus natifs ; le lifecycle de préparation demeure explicite/lazy.
- Mesure synthétique UTF-8 avec trois items de Review : paquet sans nouveau contexte **2371 octets**, avec contexte **3353 octets**, surcoût **982 octets**. Limite **80000**, inchangée. Cette fixture n'est pas une mesure de headroom de toutes les sessions réelles.
- Les tokens d'entrée augmentent du mandat sémantique et du contexte ; la sortie peut augmenter des actes/références. Les tokens facturés, latence réelle et coût marginal sont **NON MESURÉS**. Zéro appel en plus ne signifie pas coût par appel strictement identique.

## Compatibilité Preview — lecture seule

Contrôle du catalogue effectif Preview via configuration existante ; isolation Production prouvée. PostgreSQL **18.6**, empreinte de cible sanitizée `11f5efa36bd11789`. Aucune ligne de Project/document ou preuve de session exposée ; aucune écriture DB.

`public_project_snapshot`, `doc_generation` et `doc_generation_body` : empreintes natives compatibles. Les tables Studio existent, mais les deux contraintes natives durcies sont absentes :

| Contrainte manquante | Migration canonique existante |
| --- | --- |
| `doc_working_revision_native_binding_required` | `server/migrations/004_doc_working_revision.sql` |
| `doc_studio_intent_native_binding_required` | `server/migrations/005_doc_studio_finalization_intent.sql` |

Le runtime sans DDL implicite est inchangé et reste fail-closed. Ce correctif n'applique ni ne masque les migrations. Déploiement de la branche bloqué tant que ces prérequis ne sont pas explicitement installés et leur compatibilité vérifiée. Production n'a pas été modifiée.

## Plan de qualification LLM réelle proposé — non autorisé/non exécuté

Campagne contrôlée sur Preview isolée, fixtures gouvernées sanitizées et session autorisée, jamais sur un Project réel à préserver. Réutiliser l'appel ST normal, sans génération DOC ni Working Draft. Maximum **9 nouvelles opérations**, une par cas ; zéro retry/reroll/fallback. Modèle/configuration, présentations et requêtes exactes à figer avant autorisation. Tester :

1. accord entier inédit, sur une présentation unique ;
2. acceptation partielle et refus d'un scope indépendant ;
3. refus avec négation, sans changement de Project ;
4. correction partielle + accord indépendant + demande d'explication ;
5. accord conditionnel ;
6. invitation à expliquer, sans adoption ;
7. référent ambigu entre deux présentations ;
8. confirmation d'une présentation périmée ;
9. demande documentaire sans adoption scientifique.

Oracle humain figé avant exécution : acte attendu, références, scope autorisé et non autorisé, Project avant/après, nombre d'opérations et absence de nouvelles versions/documents. Arrêter au premier échec causal, garder l'évidence native, ne pas réparer et relancer pendant la campagne.

Avant tout dispatch : obtenir l'autorisation distincte du plafond total, établir une borne financière conservatrice par requête réelle avec le modèle/pricing courant et prouver `dépense cumulée + borne prochaine opération <= hard budget`. Prix/bornes inconnus : dispatch interdit. Les budgets existants restent prioritaires, même si cela réduit la campagne proposée.

## Verdict

```text
SEMANTIC_INTERPRETATION_IMPLEMENTED = YES — NOMINAL TERRA
EXISTING_ST_CALL_REUSED = YES
ADDITIONAL_PROVIDER_CALLS_REQUIRED = NO
LEXICAL_DEPENDENCY_REMAINING = HISTORICAL_COMPATIBILITY_ONLY
PARTIAL_DECISIONS = EXACT_NATIVE_SCOPE_VALIDATED
AMBIGUOUS_DECISIONS = NON_ADOPTING
EXACT_SCOPE_BINDING = YES
PROJECT_ADOPTION_GUARDS = PRESERVED
PREVIEW_SCHEMA_MISSING_CONSTRAINTS = 2 — EXACT_NAMES_ABOVE
PREVIEW_MIGRATION_REQUIRED = 004 + 005 — HARDENED_NATIVE_BINDING_CONSTRAINTS
REAL_LLM_QUALIFICATION = NOT_RUN
PROVIDER_CALLS = 0
DB_WRITES = 0
DEPLOYMENT = NO
MAIN_CHANGED = NO
PRODUCTION_CHANGED = NO
WORKTREE_CLEAN = NO — PREEXISTING_REPORT_ONLY_AFTER_COMMIT
REMAINING_GAPS = REAL_LLM_QUALIFICATION; PREVIEW_SCHEMA_PREREQUISITES; HISTORICAL_NON_TERRA_COMPATIBILITY
NEXT_SAFE_ACTION = EXPLICIT_PREVIEW_MIGRATION_AUTHORIZATION_AND_READ_ONLY_RECHECK; THEN_SEPARATELY_AUTHORIZED_BOUNDED_REAL_SEMANTIC_CAMPAIGN
```

Le commit d'implémentation est fourni dans le rapport de livraison et contient ce rapport ; il n'est pas auto-inscrit dans son propre contenu.
