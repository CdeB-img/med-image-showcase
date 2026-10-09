# Reconnaissance sémantique des décisions naturelles

La reconnaissance de confirmation et de refus reste lexicale et déterministe dans le candidat actuel. Scientific Thinking dispose déjà d'un résultat LLM structuré dans l'appel conversationnel ordinaire, mais ce résultat ne contient pas l'interprétation décisionnelle liée nécessaire à l'adoption. Les ajouts lexicaux récents, non committés, ont été retirés à l'identique après la rectification utilisateur du 9 octobre 2026. Aucun nouveau recognizer ou appel fournisseur n'est introduit.

## Mécanisme actuel

| Frontière | Propriétaire et fonction | Capacité observée |
| --- | --- | --- |
| Reconnaissance d'acte | `natural-conversation-policy.ts`: `readNaturalCandidateDecision`, `isExplicitProjectRecordingRequest`, `classifyNaturalConversationActs` | Expressions régulières, normalisation et listes de termes. Ce n'est pas une interprétation LLM. |
| Référent et décision liée | QRY `current-navigation-evidence.ts`: `buildBoundedConversationReferentContext`, `selectBoundedConversationInteraction` | État actuel, présentation, scope et références; plusieurs branches reconnaissent encore lexicalement des décisions partielles et restatements. |
| Appel conversationnel Standard TERRA | `useConversationTurn.submitTerraText` → `prepareTerraConversationRequest` → bridge → `prepareTerraConversation` → `executeOpenAITerraConversation` | Un appel ordinaire ST peut produire réponse et sens scientifique structuré; aucune interprétation décisionnelle typée n'en est extraite. |
| Réception sémantique | `terraScientificResultSchema`, `retainScientificDiscussionResult`, `deliverTerraConversationResult` | `reply`, contributions utilisateur/assistant, polarité, conditions, liens, dispositions et candidateBindings. Rétention non adoptante. |
| Variante de runtime configurée hors TERRA | `useConversationTurn.submitText` → `prepareConversationTurnContext` | Une confirmation liée peut être traitée par le chemin déterministe avant l'appel LLM. |
| Adoption | `stageProjectConfirmation` → `confirmResearchProjectContribution` | Autorité humaine, Project exact, scope canonique, validité et application PRJ. Aucun write PRJ confié au LLM. |

`candidateBindings` relie du sens scientifique à des changements candidats; ce n'est pas un reçu d'autorisation. Les dispositions `REJECTED`, `CLOSED` et `SUPERSEDED` portent le cycle de vie du sens retenu, pas une décision d'adoption PRJ. Le payload QRY de réalisation conversationnelle exprime une action déjà choisie et impose `NO_ADOPTION_NO_PROJECT_WRITE`; il ne constitue pas davantage un interpréteur entrant de décision humaine.

Le chemin TERRA n'envoie pas aujourd'hui le `boundedReferentContext` exact utilisé par la variante configurée. Son contexte scientifique contient des bindings, mais ne prouve pas à lui seul quel scope a effectivement été présenté et autorisé. L'écart porte donc à la fois sur le contrat de sortie et sur son contexte d'entrée et sa consommation gouvernée.

## Adaptation reuse first proposée

Étendre le résultat de l'appel Scientific Thinking conversationnel existant, sans moteur parallèle ni seconde opération de classification. L'interprétation doit rester une proposition de lecture de l'acte utilisateur, jamais une décision d'adoption.

1. Fournir à ce même appel la projection bornée existante du référent et du scope réellement présenté : tour source, digests, Project courant, présentation et références des changements proposés. Ne pas fabriquer de tour USER ni reconstruire une autorité depuis le transcript.
2. Ajouter au résultat natif une interprétation structurée des actes, réutilisant les catégories actuelles lorsqu'elles conviennent : confirmation, refus, correction partielle, nouvelle information, continuation, demande documentaire, ambiguïté/condition. Les exemples de formulations restent des cas de test; aucune whitelist de phrases n'est requise.
3. Faire valider cette proposition d'interprétation par les frontières QRY/PRJ existantes : identité du tour et de la conversation, Project ID/version/digest, candidat actuel, présentation effective, digest du scope, références canoniques sélectionnées/refusées/corrigées et actualité à réception. Une référence étrangère, une portée incertaine ou un état obsolète interdit l'adoption. Aucun fallback suffixe ni rapprochement textuel ne remplace ces bindings.
4. Appliquer seulement une décision humaine interprétée et validée au lifecycle Project actuel. Les corrections et informations supplémentaires restent distinctes des éléments confirmés. Les demandes documentaires passent au propriétaire DOC et à ses admissions, sans devenir des décisions scientifiques.

Le contrat doit lier l'interprétation au résultat reçu et aux inputs figés. Un LLM déclarant « accord compris » ou `projectWriteAuthorized=true` ne suffit jamais. Une ambiguïté doit rester non adoptante et revenir au QRY/conversation existant. La confiance numérique du modèle n'est pas une preuve de scope.

Cette adaptation n'est pas implémentée dans cette mission d'inspection. Elle modifie un contrat producteur et sa consommation runtime; elle doit être qualifiée avant remplacement des chemins historiques. Aucun nouveau schéma décisionnel permissif n'est ajouté sous couvert d'audit.

## Coût et modes de runtime

Dans TERRA, le résultat sémantique peut être produit avec la réponse ordinaire déjà exécutée. La cible ne nécessite donc pas une deuxième opération par tour. Les confirmations actuellement court-circuitées à zéro appel dans l'autre variante ne peuvent toutefois pas recevoir une interprétation LLM gratuitement : leur passage à l'appel conversationnel ordinaire doit être explicite, intégré à l'admission financière et autorisé dans le périmètre retenu. Aucun appel réel ni changement de budget n'a été exécuté pour cet audit.

## Tests et portée des preuves

`natural-decision-semantic-boundary-audit.test.ts` contient 12 tests de caractérisation de la frontière actuelle : huit contributions inédites couvrant accord, refus, correction, information, poursuite, demande documentaire, condition et actes mixtes; rejet d'un champ décisionnel inventé; trois cas sans scope adoptable, dont « vas-y ».

Les réponses sont entièrement simulées à la frontière fournisseur existante. Ces tests prouvent que la réception du sens scientifique courant reste non adoptante, n'ajoute pas d'appel de classification et ne modifie pas PRJ. Ils établissent aussi l'absence du champ décisionnel lié dans le schéma courant. Ils ne prouvent pas que le LLM comprend réellement les huit formulations. Cette compétence reste à qualifier après l'extension, sous budget explicitement autorisé.

Les régressions existantes de liaison naturelle et de reçus, de scopes partiels, de candidats non présentés, obsolètes ou multiples restent inchangées. Les tests ne transforment pas une phrase nouvelle en règle lexicale.

```text
CURRENT_DECISION_RECOGNITION_OWNER = PROTOCOL_DESIGNER_UI + QUERY_NAVIGATION
CURRENT_RECOGNITION_MECHANISM = LEXICAL_DETERMINISTIC_WITH_CONTEXT_BINDING
LEXICAL_DICTIONARY_DEPENDENCY = YES_EXISTING
RECENT_LEXICAL_ADDITIONS_RETAINED = NO
LLM_SEMANTIC_INTERPRETATION_AVAILABLE = PARTIAL_SCIENTIFIC_MEANING_NOT_BOUND_DECISION
CHANGES_REQUIRED = EXTEND_EXISTING_SAME_CALL_ST_RESULT_AND_QRY_PRJ_CONSUMPTION
VALIDATION_GUARDS_PRESERVED = YES
SEMANTIC_BOUNDARY_TESTS = 12/12 PASS_OFFLINE
REMAINING_GAP = EXACT_NATIVE_DECISION_INTERPRETATION_INPUT_RESULT_VALIDATION_AND_RUNTIME_APPLICATION
REAL_LLM_DECISION_COMPETENCE = NOT_QUALIFIED
PROVIDER_CALLS = 0
MAIN_CHANGED = NO
PRODUCTION_CHANGED = NO
```
