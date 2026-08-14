# I06 — PYDANTIC_COMMON_CONTRACT — INTERACTIVE T2

## INPUT

Message utilisateur courant VERBATIM :

> Je ne sais pas.

Conversation précédente VERBATIM :

> I06:PYDANTIC_COMMON_CONTRACT:T0 | USER : Je compare DSC et ASL chez mes gliomes. Quand elles ne racontent pas la même chose, je veux savoir laquelle est la plus utile pour la progression. Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible.
> I06:PYDANTIC_COMMON_CONTRACT:Q2 | ASSISTANT : When DSC and ASL give conflicting results regarding progression in your gliomas, do you have a specific clinical or methodological criterion to decide which one to trust, or should we evaluate them against a specific reference standard?

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i06-t2-pydantic-common-contract.json`

```json
{
  "configurationId": "PYDANTIC_COMMON_CONTRACT",
  "failureClass": "STRUCTURED_CONTRACT_OR_FRAMEWORK_FAILURE",
  "nativeRawOutputAvailable": false,
  "noSemanticRetry": true,
  "pairedFirstOutput": true,
  "reason": "UnexpectedModelBehavior: Exceeded maximum output retries (0)",
  "round": "T2",
  "scenarioId": "I06",
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
