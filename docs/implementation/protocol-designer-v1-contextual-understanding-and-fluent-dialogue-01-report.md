# PROTOCOL_DESIGNER_V1_CONTEXTUAL_UNDERSTANDING_AND_FLUENT_DIALOGUE_01

## Baseline et causalité

- Baseline vérifiée : branche `protocol-designer-canonical-ingestion`, HEAD `087ae02c0d87fcaebf9f851af4a93a0cdf101f3d`, aucun changement suivi ni indexé avant mission.
- Le Project adopté conservait la comparaison stent immédiat/différé, le critère principal et les objets IRM.
- `buildScientificThinkingInputFromProjectSnapshot` remplaçait cependant le sens scientifique manquant par le motif administratif QRY `Formuler ou préciser…`, puis l'ajoutait à `originalExpression`.
- `hasMethodComparison` considérait ensuite deux méthodes présentes et n'importe quel `ou` comme une comparaison. Le `ou` du motif QRY suffisait donc à fabriquer IRM versus acquisition IRM.
- La projection Standard exposait enfin une hypothèse générique tautologique et des références internes `PENDING_VERIFICATION`.
- QRY sélectionnait correctement le périmètre `QUESTION`; il n'était pas le propriétaire de ces pertes et n'a pas été modifié.

## Réparation bornée

1. L'adapter Project → Scientific Thinking construit une question candidate seulement lorsqu'il dispose d'une relation comparative Project unique, de ses deux extrémités et d'un endpoint adopté. Le rôle `PRIMARY_ENDPOINT` est conservé explicitement. Le motif QRY n'est plus utilisé comme preuve scientifique lorsqu'une telle représentation existe.
2. Une comparaison de méthodes requiert désormais soit une relation méthodologique structurée, soit la présence effective des deux libellés de méthode dans une expression qui les compare. La simple coprésence de deux niveaux méthodologiques et d'un `ou` sans rapport ne suffit plus.
3. Pour cette question contextuelle Project, Standard montre une intervention compacte : question de travail, hypothèse Project explicite lorsqu'elle existe, éventuel besoin adaptatif utile. Les hypothèses de remplissage et identifiants internes restent dans le résultat owner mais ne sont plus le texte conversationnel principal.
4. La frontière de persistent extraction précise génériquement qu'une phase rattachée au même examen/essai ne crée pas une nouvelle occurrence, que deux occurrences explicites restent distinctes et qu'une définition locale reste limitée au Project. Aucun alias global ni nouveau moteur de contexte n'a été créé.

## Conversation avant / après

### Avant — témoin humain

> Quel phénomène relatif à Contexte post-infarctus du myocarde (IDM) souhaitez-vous étudier, indépendamment de la préférence déclarée pour Imagerie par résonance magnétique (IRM) ou Acquisition IRM planifiée ?

> La comparaison entre Imagerie par résonance magnétique (IRM) et Acquisition IRM planifiée constitue-t-elle une question méthodologique distincte de la question scientifique principale ?

### Après — message initial, Project adopté de test

> À partir des éléments confirmés du projet, voici une question scientifique de travail qui conserve la comparaison et le critère principal.
>
> Question scientifique de travail
> Observe-t-on une différence entre « Mise en place immédiate d'un stent » et « Mise en place différée d'un stent » pour le critère principal « Taille des lésions microvasculaires à 3 min post-injection », dans le contexte « post-infarctus du myocarde (IDM) » ?
>
> Vous pouvez discuter ou corriger cette formulation avant toute adoption.

Cette sortie est produite par le corridor déterministe Project → QRY → Scientific Thinking → Standard. Aucun provider n'est appelé.

### Après — correction exacte, candidate injectée puis confirmée en test

> La question scientifique et l’hypothèse exprimée sont maintenant reliées aux éléments confirmés du projet.
>
> Question scientifique de travail
> Observe-t-on une différence entre « Mise en place immédiate du stent » et « Mise en place du stent à J+3 après reperfusion » pour le critère principal « Taille des lésions microvasculaires à 3 min post-injection », dans le contexte « post IDM » ?
>
> Hypothèse de travail
> La mise en place du stent à J+3 après reperfusion réduira les lésions microvasculaires
>
> Vous pouvez discuter ou corriger cette formulation avant toute adoption.

La correction conserve une seule acquisition IRM. Les trois repères restent attachés à trois rôles distincts : fenêtre de l'acquisition IRM J3–J6, endpoint principal à 3 minutes post-injection, stent différé à J+3 après reperfusion. Le Project initial reste byte-for-byte inchangé avant le geste humain ; après confirmation, la correction supersède l'objectif et le comparateur visés avec leur historique, sans supprimer le critère principal.

## Contre-épreuves

| Cas | Résultat local déterministe |
| --- | --- |
| Même IRM, aucun examen supplémentaire | Une acquisition active avant et après |
| Deux IRM explicites à J5 et M3 | Deux acquisitions et deux qualifications temporelles distinctes |
| Mesure précoce/tardive sans contexte | Aucune modalité, visite ou acquisition inventée ; information `UNKNOWN` |
| Essai de compression, définition locale | Une occurrence d'essai ; mesure intermédiaire ajoutée ; définition locale conservée ; aucun contenu cardiaque injecté |

Ces contre-épreuves utilisent des candidates structurées injectées pour qualifier le consumer et le gate d'adoption. Elles ne prouvent pas que Terra a interprété le langage libre : l'appel OpenAI était interdit. La nouvelle instruction d'extraction est donc qualifiée par contrat et mocks, mais sa compétence live sur ces phrases reste à revoir humainement lors d'un futur appel explicitement autorisé.

## Qualification

- Tests ciblés consolidés : `15 files / 110 PASS`.
- TypeScript : PASS.
- Lint affecté : PASS.
- Build Production : PASS, avec avertissements préexistants de taille de chunks/CSS et Browserslist hors causalité.
- Full suite : NOT RUN, conformément au budget.
- App locale : `http://127.0.0.1:5198/protocol-designer/demo`, HTTP 200 au moment de la qualification.
- Gemini : 0 appel. Le HOW réparé ici est déterministe ; un appel Gemini isolé n'aurait pas qualifié l'extraction Terra interdite.
- OpenAI : 0 appel.

## État final

ROOT_CAUSE = PROJECT_TO_SCIENTIFIC_THINKING_SEMANTIC_PROJECTION_LOSS + UNRELATED_OR_METHOD_COMPARISON_HEURISTIC + STANDARD_OWNER_DUMP

OWNER_REPAIRED = SCIENTIFIC_THINKING_INPUT_ADAPTER + SCIENTIFIC_THINKING + STANDARD_SCIENTIFIC_THINKING_PRESENTATION + PERSISTENT_PROJECT_EXTRACTION_CONTEXT_BOUNDARY

VISIBLE_BEFORE = REDUNDANT_PHENOMENON_REASK + FALSE_IRM_VS_ACQUISITION_COMPARISON

VISIBLE_AFTER = CONTEXTUAL_PRIMARY_QUESTION + EXPLICIT_PROJECT_HYPOTHESIS_WHEN_AVAILABLE + NO_INTERNAL_REFERENCE_DUMP

CONTEXTUAL_INTERPRETATION_RESULT = DETERMINISTIC_PROJECT_CONSUMER_PASS; LIVE_TERRA_FREE_TEXT_INTERPRETATION_NOT_VERIFIED

NO_INVENTED_EXAM_OR_TIMEPOINT = PASS

CORRECTIONS_REUSED = PASS_AFTER_INJECTED_CANDIDATE_AND_HUMAN_CONFIRMATION; LIVE_EXTRACTION_NOT_VERIFIED

TARGETED_TESTS = 110 PASS

LIVE_TEST_SCOPE_AND_LIMITS = LOCAL_HTTP_200 + JSDOM_STANDARD_PATH; NO_PROVIDER; NO_HUMAN_ADJUDICATION_PRE-FILLED

GEMINI_CALLS = 0

OPENAI_CALLS = 0

PRODUCT_COMMIT = THIS_COMMIT

NEXT_HUMAN_RETEST = EXACT_INITIAL_MESSAGE_THEN_EXACT_CORRECTION_IN_A_FRESH_LOCAL_SESSION

P1_COMPLETE = NO

P1_EXIT_GATE = NOT_SATISFIED

WAVE_2_AUTHORIZED = NO
