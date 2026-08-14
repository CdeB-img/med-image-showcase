# I06 — PYDANTIC_CONDITIONAL_CRITIC — INTERACTIVE T2

## INPUT

Message utilisateur courant VERBATIM :

> Je ne sais pas.

Conversation précédente VERBATIM :

> I06:PYDANTIC_CONDITIONAL_CRITIC:T0 | USER : Je compare DSC et ASL chez mes gliomes. Quand elles ne racontent pas la même chose, je veux savoir laquelle est la plus utile pour la progression. Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible.
> I06:PYDANTIC_CONDITIONAL_CRITIC:Q2 | ASSISTANT : How would you like to define when DSC and ASL 'ne racontent pas la même chose' (e.g., quantitative thresholds or qualitative reading)?

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i06-t2-pydantic-conditional-critic.json`

```json
{
  "configurationId": "PYDANTIC_CONDITIONAL_CRITIC",
  "criticExecuted": false,
  "failureClass": "STRUCTURED_CONTRACT_OR_FRAMEWORK_FAILURE",
  "nativeRawOutputAvailable": false,
  "noSemanticRetry": true,
  "reason": "UnexpectedModelBehavior: Exceeded maximum output retries (0)",
  "round": "T2",
  "scenarioId": "I06",
  "sharedFirstOutputFailed": true,
  "status": "FAILED"
}
```

## STRUCTURED CONTRACT STATUS

- provider status : `FAILED_OR_OUTPUT_REJECTED`
- parsing status : `STRUCTURED_CONTRACT_OR_FRAMEWORK_FAILURE`
- structured contract conformance : `FAIL`
- scientific semantic evaluability : `NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED`
- evaluation mode : `NONE`
- native raw output persisted : `false`
- exact error : UnexpectedModelBehavior: Exceeded maximum output retries (0)

## SCIENTIFIC INTERPRETATION

Aucune interprétation scientifique n’est produite : la sortie native exploitable n’a pas été persistée. Cet état n’est pas compté comme un échec de compréhension scientifique.

## MISSING STRUCTURAL GUARANTEES

- COMMON_SCIENTIFIC_STATE_NOT_AVAILABLE
- NATIVE_RAW_OUTPUT_NOT_PERSISTED

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
