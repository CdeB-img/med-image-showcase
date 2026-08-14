# I04 — PYDANTIC_CONDITIONAL_CRITIC — COMMON_TRANSCRIPT T2

## INPUT

Message utilisateur courant VERBATIM :

> LGE n'est pas disponible partout non plus et je ne veux pas en faire le critère principal. L'ECV est possible seulement si contraste et hématocrite sont disponibles.

Conversation précédente VERBATIM :

> I04:T0 | USER : Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.
> I04:R1 | USER : Tous les centres ont cine et T1 natif. Non, le T2 n'est pas disponible partout.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i04-t2-pydantic-conditional-critic.json`

```json
{
  "configurationId": "PYDANTIC_CONDITIONAL_CRITIC",
  "criticExecuted": false,
  "failureClass": "STRUCTURED_CONTRACT_OR_FRAMEWORK_FAILURE",
  "nativeRawOutputAvailable": false,
  "noSemanticRetry": true,
  "reason": "UnexpectedModelBehavior: Exceeded maximum output retries (0)",
  "round": "T2",
  "scenarioId": "I04",
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
